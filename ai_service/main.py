import asyncio
import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

import httpx

# Import Real AI SDKs
from elevenlabs.client import ElevenLabs
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Companion Voice OS - Real-Time Engine")

# Initialize Clients
eleven_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
llm_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

# =====================================================================
# 1. WAKE WORD & STT (Deepgram)
# =====================================================================
async def process_stt_stream(audio_chunk: bytes) -> str:
    """
    Calls Deepgram API using httpx to transcribe the audio chunk.
    """
    try:
        if len(audio_chunk) < 1000:
            return "" # Ignore empty/tiny chunks
            
        url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"
        headers = {
            "Authorization": f"Token {os.getenv('DEEPGRAM_API_KEY')}",
            "Content-Type": "audio/wav" # or appropriate content type
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, content=audio_chunk)
            response.raise_for_status()
            data = response.json()
            return data["results"]["channels"][0]["alternatives"][0]["transcript"]
    except Exception as e:
        print(f"Deepgram STT Error: {e}")
        return ""

# =====================================================================
# 2. EMOTIONAL ANALYSIS
# =====================================================================
async def analyze_emotion(text: str) -> dict:
    """
    Analyzes the emotional tone of the user's text to adjust Nova's response.
    """
    if not text.strip():
        return {"dominant_emotion": "neutral", "aggression": 0.0, "confidence": 0.5}
        
    try:
        response = await llm_client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an emotion analyzer. Read the user's text and return ONLY valid JSON with three keys: 'dominant_emotion' (e.g. calm, frustrated, urgent, happy, confused), 'aggression' (float 0.0 to 1.0), and 'confidence' (float 0.0 to 1.0)."
                },
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        data = json.loads(response.choices[0].message.content)
        print(f"Detected Emotion: {data}")
        return data
    except Exception as e:
        print(f"Emotion Analysis Error: {e}")
        return {"dominant_emotion": "neutral", "aggression": 0.0, "confidence": 0.5}

# =====================================================================
# 3. COGNITIVE LLM ENGINE (OpenAI direct)
# =====================================================================
async def generate_llm_response(text: str, emotion_data: dict) -> str:
    """
    Uses OpenAI directly to generate a contextual response and manages memory.
    """
    try:
        # 1. Fetch relevant memories from Node.js backend
        context_memories = []
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post("http://localhost:5000/api/internal/memory/search", json={"userId": 1, "query": text, "limit": 5})
                if res.status_code == 200:
                    context_memories = res.json().get("data", [])
        except Exception as e:
            print(f"Failed to fetch memory: {e}")
            
        memory_str = "\n".join([f"- [{m.get('category', 'general')}] {m.get('content', '')}" for m in context_memories])
        if memory_str:
            memory_str = f"\n\nRELEVANT PAST MEMORIES:\n{memory_str}"

        system_prompt = f"""You are Nova, an advanced AI executive assistant. 
The user's current detected emotion is: {emotion_data.get('dominant_emotion', 'neutral')}. 
Keep your response concise, helpful, and conversational.
{memory_str}

IMPORTANT: You MUST respond with strictly valid JSON format.
If you need to search the web or send a WhatsApp message BEFORE answering, use the 'action' object. Otherwise, leave 'action' null.
If the user shares a personal fact, extract it into 'memories'.
If the user asks to create a task, extract it into 'tasks'.

JSON Schema:
{{
  "action": {{ "type": "manage_calendar", "intent": "add_event", "summary": "Meeting", "time": "2026-06-25T10:00:00" }}, // OR {{ "type": "manage_calendar", "intent": "list_events", "date": "2026-06-25" }} OR null
  "reply": "Your conversational spoken response",
  "memories": [
    {{ "content": "The fact to remember", "category": "preference" }}
  ],
  "tasks": [
    {{ "title": "Call John", "description": "About the new project", "dueDate": "2026-06-25 10:00:00" }}
  ]
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]

        # Multi-step loop for tool execution
        for iteration in range(3):
            response = await llm_client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            raw_response = response.choices[0].message.content
            try:
                parsed_data = json.loads(raw_response)
                action = parsed_data.get("action")
                
                if action and action.get("type"):
                    action_type = action["type"]
                    print(f"AI taking action: {action_type}")
                    
                    tool_result = ""
                    if action_type == "manage_calendar":
                        try:
                            import google_cal
                            intent = action.get("intent", "list_events")
                            if intent == "add_event":
                                tool_result = google_cal.add_calendar_event(action.get("summary"), action.get("description", ""), action.get("time"))
                            else:
                                target_date = action.get("date")
                                tool_result = google_cal.get_upcoming_events(target_date=target_date)
                        except Exception as e:
                            tool_result = f"Calendar Error: {e}"
                    else:
                        # Execute tool via Node.js backend
                        try:
                            async with httpx.AsyncClient(timeout=10.0) as client:
                                res = await client.post("http://localhost:5000/api/internal/execute_tool", json={
                                    "userId": 1,
                                    "toolName": action_type,
                                    "args": action
                                })
                                if res.status_code == 200:
                                    tool_result = res.json().get("result", "Action completed successfully.")
                                else:
                                    tool_result = f"Error: {res.text}"
                        except Exception as e:
                            tool_result = f"Tool execution failed: {e}"
                        
                    print(f"Tool Result: {tool_result}")
                    
                    # Add result to messages and loop
                    messages.append({"role": "assistant", "content": raw_response})
                    messages.append({"role": "system", "content": f"TOOL RESULT for {action_type}:\n{tool_result}\nNow formulate your final 'reply' based on this result. Set 'action' to null."})
                    continue # Go to next iteration

                # If no action, we process the final reply
                reply_text = parsed_data.get("reply", "I'm sorry, I encountered an error formatting my response.")
                memories_to_save = parsed_data.get("memories", [])
                tasks_to_save = parsed_data.get("tasks", [])
                
                # Save new memories to Node.js backend
                for mem in memories_to_save:
                    try:
                        async with httpx.AsyncClient() as client:
                            await client.post("http://localhost:5000/api/internal/memory/add", json={
                                "userId": 1, "content": mem.get("content", ""), "category": mem.get("category", "fact")
                            })
                            print(f"Saved new memory: {mem.get('content')}")
                    except Exception as e:
                        pass
                
                # Save new tasks to Node.js backend
                for task in tasks_to_save:
                    try:
                        async with httpx.AsyncClient() as client:
                            await client.post("http://localhost:5000/api/internal/tasks/add", json={
                                "userId": 1, "title": task.get("title", "New Task"), "description": task.get("description", ""), "dueDate": task.get("dueDate", None)
                            })
                            print(f"Saved new task: {task.get('title')}")
                    except Exception as e:
                        pass
                        
                return reply_text
                
            except json.JSONDecodeError:
                print("LLM did not return valid JSON.")
                return raw_response

        return "I'm sorry, I couldn't complete the task in time."

    except Exception as e:
        print(f"LLM Error: {e}")
        return "I'm sorry, I encountered an error processing that."

# =====================================================================
# 4. VOICE CLONING & TTS (ElevenLabs)
# =====================================================================
async def stream_tts(text: str):
    """
    Calls ElevenLabs to convert text to speech and yields audio chunks.
    """
    try:
        # We use standard generation for simplicity. 
        # For true streaming, use eleven_client.text_to_speech.convert_as_stream
        audio_stream = await asyncio.to_thread(
            eleven_client.text_to_speech.convert,
            voice_id="EXAVITQu4vr4xnSDxMaL", # Replace with your cloned Voice ID
            optimize_streaming_latency="3",
            output_format="mp3_44100_128",
            text=text,
            model_id="eleven_multilingual_v2",
        )
        
        # Yield the audio data chunk by chunk
        for chunk in audio_stream:
            if chunk:
                yield chunk
    except Exception as e:
        print(f"ElevenLabs TTS Error: {e}")

# =====================================================================
# 5. WEBSOCKET INFRASTRUCTURE
# =====================================================================
@app.websocket("/ws/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("User connected to Voice OS WebSocket (REAL AI INTEGRATION).")
    
    try:
        while True:
            # 1. Receive incoming text from the mobile app
            transcribed_text = await websocket.receive_text()
            print(f"User said: {transcribed_text}")
            
            # If valid text was spoken
            if transcribed_text.strip():
                # 2. Analyze Emotion
                emotion_scores = await analyze_emotion(transcribed_text)
                
                # 3. Get LLM response 
                llm_response = await generate_llm_response(transcribed_text, emotion_scores)
                print(f"AI Response: {llm_response}")
                
                # Send the generated text back to the phone so the UI can display it
                await websocket.send_json({"type": "text", "content": llm_response})
                
                # 4. Stream TTS audio back to the client immediately
                async for tts_audio_chunk in stream_tts(llm_response):
                    await websocket.send_bytes(tts_audio_chunk)
                    
                # Signal end of AI response
                await websocket.send_json({"type": "status", "message": "response_complete"})
                
    except WebSocketDisconnect:
        print("User disconnected.")
    except Exception as e:
        print(f"WebSocket Error: {e}")

# Run the server: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
