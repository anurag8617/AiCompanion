import asyncio
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
import io
import base64
import whisper
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server started on:\nws://0.0.0.0:8001", flush=True)
    yield

app = FastAPI(title="Maaya Assistant V1", lifespan=lifespan)

print("Loading Whisper model...", flush=True)
model = whisper.load_model("tiny")
print("Whisper model loaded.", flush=True)

@app.websocket("/ws/maaya")
async def maaya_websocket(websocket: WebSocket):
    await websocket.accept()
    print("Client connected", flush=True)
    
    pcm_buffer = bytearray()
    
    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message:
                pcm_buffer.extend(message["bytes"])
                print(f"Bytes received: {len(message['bytes'])}", flush=True)
            elif "text" in message:
                text = message["text"]
                if text == "STOP":
                    print("Speech detected.", flush=True)
                    print("Transcription started.", flush=True)
                    if len(pcm_buffer) > 0:
                        audio_data = np.frombuffer(pcm_buffer, dtype=np.int16).astype(np.float32) / 32768.0
                        try:
                            result = model.transcribe(audio_data, fp16=False)
                            print("Transcript:", flush=True)
                            print(result["text"].strip(), flush=True)
                        except Exception as e:
                            print(f"Whisper failure: {e}", flush=True)
                    else:
                        print("Empty transcript", flush=True)
                    
                    pcm_buffer.clear()
                else:
                    # Treat other text as base64 audio
                    try:
                        chunk = base64.b64decode(text)
                        pcm_buffer.extend(chunk)
                        print(f"Bytes received (base64): {len(chunk)}", flush=True)
                    except Exception as e:
                        print(f"Base64 decode error: {e}", flush=True)
    except WebSocketDisconnect:
        print("Client disconnected", flush=True)
        print("Connection closed", flush=True)
    except Exception as e:
        print("Exceptions", flush=True)
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    uvicorn.run("maaya_server:app", host="0.0.0.0", port=8001)
