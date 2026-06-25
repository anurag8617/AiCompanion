import asyncio
import websockets
import json

async def test_voice_os():
    uri = "ws://localhost:8000/ws/voice"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Sending fake audio data...")
            
            # Send fake/empty binary audio to trigger the STT
            # (Deepgram might return nothing for empty audio, so this just tests the connection)
            fake_audio = b"fake_audio_bytes_1234567890" * 100 
            await websocket.send(fake_audio)
            
            print("Audio sent. Waiting for AI response...")
            
            # Receive incoming messages/audio
            while True:
                response = await websocket.recv()
                
                if isinstance(response, bytes):
                    print(f"-> Received TTS Audio chunk: {len(response)} bytes")
                    # Here you would play the audio or save it to a .mp3 file
                else:
                    data = json.loads(response)
                    print(f"-> Received JSON Status: {data}")
                    if data.get("message") == "response_complete":
                        print("Test finished successfully!")
                        break
                        
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_voice_os())
