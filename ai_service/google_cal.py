import os
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=8080, access_type='offline', prompt='consent')
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('calendar', 'v3', credentials=creds)
    return service

def add_calendar_event(summary, description, start_time, end_time=None):
    service = get_calendar_service()
    if not end_time:
        # Default 1 hour duration
        start_dt = datetime.datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = start_dt + datetime.timedelta(hours=1)
        end_time = end_dt.isoformat()

    event = {
      'summary': summary,
      'description': description,
      'start': {
        'dateTime': start_time,
        'timeZone': 'UTC',
      },
      'end': {
        'dateTime': end_time,
        'timeZone': 'UTC',
      },
    }
    
    event = service.events().insert(calendarId='primary', body=event).execute()
    return f"Event created: {event.get('htmlLink')}"

def get_upcoming_events(max_results=5, target_date=None):
    service = get_calendar_service()
    if target_date:
        try:
            # Parse 'YYYY-MM-DD'
            start_dt = datetime.datetime.fromisoformat(target_date)
            end_dt = start_dt + datetime.timedelta(days=1)
            time_min = start_dt.isoformat() + 'Z'
            time_max = end_dt.isoformat() + 'Z'
            events_result = service.events().list(
                calendarId='primary', timeMin=time_min, timeMax=time_max,
                singleEvents=True, orderBy='startTime'
            ).execute()
        except ValueError:
            return "Invalid date format. Please use YYYY-MM-DD."
    else:
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        events_result = service.events().list(
            calendarId='primary', timeMin=now, maxResults=max_results,
            singleEvents=True, orderBy='startTime'
        ).execute()

    events = events_result.get('items', [])
    if not events:
        if target_date:
            return f"No events found for {target_date}."
        return "No upcoming events found."
    
    res = []
    for event in events:
        start = event['start'].get('dateTime', event['start'].get('date'))
        res.append(f"{start} - {event['summary']}")
    return "\n".join(res)

if __name__ == '__main__':
    # Initial auth
    get_calendar_service()
    print("Authentication successful.")
