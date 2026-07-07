import asyncio
import websockets
import sys

async def test():
    uri = "ws://127.0.0.1:8001/ws/maaya"
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send(b"\x00\x01\x02\x03")
            print("Sent bytes")
            await websocket.send("STOP")
            print("Sent STOP")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

asyncio.run(test())
