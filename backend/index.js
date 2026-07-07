const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { pool, testConnection } = require('./db');
const { initVectorDB, addMemory, searchMemories } = require('./vectorEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1] || authHeader;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Test DB Connection and Init Vector DB
testConnection();
initVectorDB().catch(err => console.error('Failed to init Vector DB:', err));

// Helper functions for secure password hashing (PBKDF2)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPasswordHash) {
  if (!storedPasswordHash || !storedPasswordHash.includes(':')) return false;
  const [salt, hash] = storedPasswordHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the internet for real-time information, news, weather, or facts that the AI does not know from its training data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on the web.'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task or reminder for the user. Optionally categorize priority.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The short title of the task.'
          },
          description: {
            type: 'string',
            description: 'Optional detailed description of the task.'
          },
          dueDate: {
            type: 'string',
            description: 'Optional due date for the task (YYYY-MM-DD HH:MM:SS format).'
          },
          priority: {
            type: 'string',
            description: 'Priority of the task: "low", "medium", or "high". Default is "medium".',
            enum: ['low', 'medium', 'high']
          }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description: 'Get a list of the user\'s current pending tasks and reminders.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_notifications',
      description: 'Fetch the most recent digital notifications, messages, and emails from the user\'s life.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of notifications/emails to fetch (default 5).'
          },
          appName: {
            type: 'string',
            description: 'Optional: Filter by app name (e.g., "gmail", "email", "WhatsApp").'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_whatsapp',
      description: 'Send a WhatsApp message to a specific person.',
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'The name or phone number of the recipient.'
          },
          message: {
            type: 'string',
            description: 'The content of the message.'
          }
        },
        required: ['recipient', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email to a specific recipient.',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'The email address of the recipient.'
          },
          subject: {
            type: 'string',
            description: 'The subject of the email.'
          },
          body: {
            type: 'string',
            description: 'The main content of the email.'
          }
        },
        required: ['to', 'subject', 'body']
      }
    }

  },
  {
    type: 'function',
    function: {
      name: 'get_relationship_context',
      description: 'Get deep insights about the user\'s relationship with a specific person, including emotional tone and recent dynamics.',
      parameters: {
        type: 'object',
        properties: {
          personName: {
            type: 'string',
            description: 'The name of the person to look up.'
          }
        },
        required: ['personName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_contacts',
      description: 'Search for a person\'s phone number or email by their name.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the person to search for.'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_contacts',
      description: 'List all saved contacts with their phone numbers and emails.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_contact',
      description: 'Save or update a person\'s contact information (phone and/or email).',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the person.'
          },
          phone: {
            type: 'string',
            description: 'Optional: The WhatsApp phone number (e.g., +1234567890).'
          },
          email: {
            type: 'string',
            description: 'Optional: The email address.'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_productivity_insights',
      description: 'Analyze the user\'s screen time and app usage logs to provide AI insights on best productivity hours, burnout warnings, distraction alerts, and performance trends.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

const cheerio = require('cheerio');

async function executeTool(toolName, args, userId) {
  console.log(`Executing tool: ${toolName}`, args);
  
  if (toolName === 'search_web') {
    let { query } = args;
    const isStockQuery = /stock|price|ticker|quote/i.test(query) || /^[A-Z]{1,5}$/.test(query.trim());
    
    // specialized stock lookup if detected
    if (isStockQuery) {
      const tickerMatch = query.match(/\b([A-Z]{1,5})\b/i);
      const symbol = tickerMatch ? tickerMatch[1].toUpperCase() : null;
      
      if (symbol) {
        try {
          console.log(`Specialized stock lookup for: ${symbol}`);
          const yahooRes = await fetch(`https://finance.yahoo.com/quote/${symbol}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (yahooRes.ok) {
            const html = await yahooRes.text();
            const $ = cheerio.load(html);
            
            // Try to find price in common Yahoo Finance selectors
            const price = $('fin-streamer[data-field="regularMarketPrice"]').first().text() || 
                          $('fin-streamer[data-test="qsp-price"]').text() ||
                          $('span[data-reactid="32"]').text(); // Fallback legacy
            
            const change = $('fin-streamer[data-field="regularMarketChangePercent"]').first().text() || 
                            $('fin-streamer[data-test="qsp-price-change"]').text();

            if (price) {
              return `STOCK DATA FOR ${symbol}:\nThe current price is $${price} (${change}).\nSource: Yahoo Finance`;
            }
          }
        } catch (e) {
          console.log('Specialized stock lookup failed, falling back to general search.');
        }
      }
    }

    // Fallback to general search
    if (isStockQuery && !query.toLowerCase().includes('price')) {
      query = `${query} stock price now`;
    }

    try {
      console.log(`Searching Google for: ${query}`);
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_CX;

      if (!apiKey || !cx) {
        console.warn('Google Search API Key or CX missing. Falling back to basic simulation.');
        return `SEARCH SIMULATION: I tried to search for "${query}" but my Google Search API is not fully configured. Based on my training, I can tell you that I need the GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX environment variables to fetch real-time data.`;
      }

      // The modern endpoint for Google Custom Search API
      const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google Search API Error Details:', errorData);
        throw new Error(`Google Search API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const results = [];
      
      if (data.items && data.items.length > 0) {
        data.items.slice(0, 8).forEach((item, i) => {
          results.push(`RESULT ${i+1}:\nTITLE: ${item.title}\nSNIPPET: ${item.snippet}\nURL: ${item.link}`);
        });
      }
      
      if (results.length === 0) {
        console.log(`No Google results found for: ${query}`);
        return `I searched Google for "${query}" but couldn't find any relevant results. Please try a different query.`;
      }
      
      return `Search results for "${query}":\n\n${results.join('\n\n')}\n\nINSTRUCTION: Provide a clear, natural answer based on these snippets. Mention that this is real-time information.`;
    } catch (error) {
      console.error('Search tool execution error:', error);
      return `I encountered an error while searching the web: ${error.message}. I will try to answer based on my internal knowledge instead.`;
    }
  }
  
  if (toolName === 'create_task') {
    const { title, description, dueDate, priority } = args;
    try {
      const [result] = await pool.query(
        'INSERT INTO tasks (user_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?)',
        [userId, title, description || '', dueDate || null, priority || 'medium']
      );

      let gcMessage = '';
      const fs = require('fs');
      if (dueDate && fs.existsSync('./credentials.json') && fs.existsSync('./token.json')) {
        try {
          const { google } = require('googleapis');
          const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
          const {client_secret, client_id, redirect_uris} = credentials.installed;
          const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
          auth.setCredentials(JSON.parse(fs.readFileSync('./token.json')));

          const calendar = google.calendar({ version: 'v3', auth });
          const event = {
            summary: title,
            description: description,
            start: { dateTime: new Date(dueDate).toISOString(), timeZone: 'UTC' },
            end: { dateTime: new Date(new Date(dueDate).getTime() + 60*60*1000).toISOString(), timeZone: 'UTC' }
          };
          await calendar.events.insert({ calendarId: 'primary', resource: event });
          gcMessage = ' and successfully synced to Google Calendar';
        } catch (gcErr) {
          gcMessage = ' (Failed to sync to Google Calendar: ' + gcErr.message + ')';
        }
      } else if (dueDate) {
          gcMessage = ' (Note: Not synced to Google Calendar because token.json is missing. Please run auth_calendar.js)';
      }

      return `Successfully created ${priority || 'medium'} priority task: "${title}" with ID ${result.insertId}${gcMessage}.`;
    } catch (error) {
      return `Error creating task: ${error.message}`;
    }
  }

  if (toolName === 'get_tasks') {
    try {
      const [rows] = await pool.query('SELECT title, description, due_date, status, priority FROM tasks WHERE user_id = ? AND status = "pending" ORDER BY FIELD(priority, "high", "medium", "low"), due_date ASC', [userId]);
      let resMsg = "Current Pending Tasks (from database):\n";
      if (rows.length === 0) resMsg += "You have no pending tasks in database.\n";
      else resMsg += rows.map(t => `- [${(t.priority || 'medium').toUpperCase()}] ${t.title}${t.due_date ? ' (Due: ' + t.due_date + ')' : ''}`).join('\n') + '\n';

      const fs = require('fs');
      if (fs.existsSync('./credentials.json') && fs.existsSync('./token.json')) {
        try {
          const { google } = require('googleapis');
          const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
          const {client_secret, client_id, redirect_uris} = credentials.installed;
          const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
          auth.setCredentials(JSON.parse(fs.readFileSync('./token.json')));

          const calendar = google.calendar({ version: 'v3', auth });
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: tomorrow.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
          });
          resMsg += "\nToday's Events from Google Calendar:\n";
          const gEvents = events.data.items;
          if (gEvents && gEvents.length > 0) {
            resMsg += gEvents.map(e => `- ${e.summary} (at ${e.start.dateTime || e.start.date})`).join('\n');
          } else {
            resMsg += "No events found today.";
          }
        } catch (gcErr) {
          resMsg += `\nError reading Google Calendar: ${gcErr.message}`;
        }
      } else {
          resMsg += "\n(Google Calendar is not connected. Run node auth_calendar.js to connect)";
      }

      return resMsg;
    } catch (error) {
      return `Error fetching tasks: ${error.message}`;
    }
  }

  if (toolName === 'get_recent_notifications') {
    const limit = args.limit || 10;
    const appName = args.appName;
    try {
      let rawText = '';

      if (appName && (appName.toLowerCase() === 'gmail' || appName.toLowerCase() === 'email')) {
        const userEmail = process.env.EMAIL_USER;
        const userPass = process.env.EMAIL_PASS;
        if (!userEmail || !userPass) return "Tell the user: I cannot read emails because EMAIL_USER and EMAIL_PASS are not set in the .env file.";
        
        const imaps = require('imap-simple');
        const simpleParser = require('mailparser').simpleParser;
        const config = { imap: { user: userEmail, password: userPass, host: 'imap.gmail.com', port: 993, tls: true, authTimeout: 3000 } };
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');
        const messages = await connection.search(['ALL'], { bodies: [''], markSeen: false });
        connection.end();
        
        if (messages.length === 0) return "No emails found.";
        const recentMessages = messages.slice(-limit).reverse();
        const emailSummaries = [];
        for (const item of recentMessages) {
          const all = item.parts.find(part => part.which === '');
          if (!all) continue;
          const mail = await simpleParser(all.body);
          const subject = mail.subject || 'No Subject';
          const from = mail.from ? mail.from.text : 'Unknown Sender';
          let textBody = mail.text || '';
          if (textBody.length > 500) textBody = textBody.substring(0, 500) + '...';
          emailSummaries.push(`[Email] From: ${from} | Subject: ${subject}\nSnippet: ${textBody}`);
        }
        rawText = emailSummaries.join('\n\n');
      } else {
        let query = 'SELECT app_package, title, text, created_at FROM external_notifications WHERE user_id = ?';
        let queryParams = [userId];

        if (appName) {
          const appMap = {
            'whatsapp': 'com.whatsapp',
            'telegram': 'org.telegram.messenger',
            'messages': 'com.google.android.apps.messaging',
            'sms': 'com.android.mms'
          };
          const packageId = appMap[appName.toLowerCase()] || null;

          if (packageId) {
            query += ' AND app_package = ?';
            queryParams.push(packageId);
          } else {
            query += ' AND (app_package LIKE ? OR title LIKE ?)';
            const filter = `%${appName}%`;
            queryParams.push(filter, filter);
          }
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        queryParams.push(limit);

        const [rows] = await pool.query(query, queryParams);
        if (rows.length === 0) return appName ? `No recent notifications found from "${appName}". Ensure notification access is granted.` : "No recent notifications found.";
        
        rawText = rows.map(n => `[${n.app_package}] ${n.title ? n.title + ': ' : ''}${n.text}`).join('\n');
      }

      const prompt = `Analyze these notifications or emails. Identify any URGENT messages (emergencies, boss, deadlines), summarize the rest, and output an "Executive Briefing".\n\nContent:\n${rawText}`;
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (!response.ok) return `Raw Recent Notifications:\n${rawText}`;
      
      const data = await response.json();
      return `Executive Notification Briefing:\n${data.choices[0].message.content}\n\n(Based on ${rows.length} notifications)`;
    } catch (error) {
      return `Error fetching notifications: ${error.message}`;
    }
  }

  if (toolName === 'search_contacts') {
    const { name } = args;
    try {
      const [rows] = await pool.query(
        'SELECT name, phone, email FROM contacts WHERE user_id = ? AND name LIKE ?',
        [userId, `%${name}%`]
      );
      if (rows.length === 0) return `No contact found for "${name}".`;
      return `Found contacts for "${name}":\n` + rows.map(c => `- ${c.name}: ${c.phone || 'No phone'} | ${c.email || 'No email'}`).join('\n');
    } catch (error) {
      return `Error searching contacts: ${error.message}`;
    }
  }

  if (toolName === 'get_contacts') {
    try {
      const [rows] = await pool.query(
        'SELECT name, phone, email FROM contacts WHERE user_id = ?',
        [userId]
      );
      if (rows.length === 0) return "You have no saved contacts yet. You can ask me to save a contact by saying 'Save contact [Name] with phone [Number]' or 'Save contact [Name] with email [Email]'.";
      return "Your Saved Contacts:\n" + rows.map(c => `- ${c.name}: ${c.phone || 'No phone'} | ${c.email || 'No email'}`).join('\n');
    } catch (error) {
      return `Error fetching contacts: ${error.message}`;
    }
  }

  if (toolName === 'save_contact') {
    const { name, phone, email } = args;
    try {
      await pool.query(
        'INSERT INTO contacts (user_id, name, phone, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone), email = VALUES(email), last_interaction = CURRENT_TIMESTAMP',
        [userId, name, phone || null, email || null]
      );
      return `Successfully saved contact info for "${name}".`;
    } catch (error) {
      return `Error saving contact: ${error.message}`;
    }
  }

  if (toolName === 'send_whatsapp') {
    let { recipient, message } = args;
    try {
      // If recipient is not a phone number (contains letters), try to look it up
      if (/[a-zA-Z]/.test(recipient) && !recipient.includes('@')) {
        const [contacts] = await pool.query('SELECT phone FROM contacts WHERE user_id = ? AND name LIKE ? LIMIT 1', [userId, `%${recipient}%`]);
        if (contacts.length > 0 && contacts[0].phone) {
          console.log(`Resolved contact "${recipient}" to phone "${contacts[0].phone}"`);
          recipient = contacts[0].phone;
        } else {
          return `I couldn't find a phone number for "${recipient}". Please provide their number or ask me to save it first.`;
        }
      }

      console.log(`Sending real WhatsApp via WAHA to ${recipient}: ${message}`);
      
      const wahaUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3000';
      const session = process.env.WHATSAPP_SESSION || 'default';

      // WAHA uses the /api/sendText endpoint
      const response = await fetch(`${wahaUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': process.env.WAHA_API_KEY,
        },
        body: JSON.stringify({
          chatId: recipient.includes('@') ? recipient : `${recipient}@c.us`, // Format for WAHA (phone@c.us)
          text: message,
          session: session
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`WAHA API error: ${errorData.message || response.statusText}`);
      }

      await addMemory(userId, `I sent a real WhatsApp message to ${recipient} via WAHA: "${message}"`, 'communication');
      return `WhatsApp message successfully sent to ${recipient} via WAHA.`;
    } catch (error) {
      console.error('WAHA send error:', error);
      return `Error sending WhatsApp via WAHA: ${error.message}. Ensure your WAHA server is running and the session is connected.`;
    }
  }



  if (toolName === 'send_email') {
    let { to, recipient, subject, body } = args;
    to = to || recipient;
    if (!to) return "Error: Missing 'to' or 'recipient' for email.";
    
    const nodemailer = require('nodemailer');
    try {
      // If 'to' is not an email (no @), try to look it up
      if (!to.includes('@')) {
        const [contacts] = await pool.query('SELECT email FROM contacts WHERE user_id = ? AND name LIKE ? LIMIT 1', [userId, `%${to}%`]);
        if (contacts.length > 0 && contacts[0].email) {
          console.log(`Resolved contact "${to}" to email "${contacts[0].email}"`);
          to = contacts[0].email;
        } else {
          return `I couldn't find an email for "${to}". Please provide their email address or ask me to save it first.`;
        }
      }

      console.log(`Sending email to ${to}: ${subject}`);
      
      const userEmail = process.env.EMAIL_USER;
      const userPass = process.env.EMAIL_PASS;

      if (!userEmail || !userPass) {
        return `I'm ready to send that email, but I need your EMAIL_USER and EMAIL_PASS set in the .env file to actually deliver it. Once you add those, I can send emails autonomously!`;
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: userEmail,
          pass: userPass
        }
      });

      const mailOptions = {
        from: userEmail,
        to: to,
        subject: subject,
        text: body
      };

      await transporter.sendMail(mailOptions);
      await addMemory(userId, `I sent an email to ${to} with subject "${subject}"`, 'communication');
      return `Email successfully sent to ${to}.`;
    } catch (error) {
      console.error('Email send error:', error);
      return `Error sending email: ${error.message}. Ensure your credentials are correct.`;
    }
  }

  if (toolName === 'get_relationship_context') {
    const { personName } = args;
    try {
      // Search memories for relationship context about this person
      const memories = await searchMemories(userId, `Relationship with ${personName}`, 3);
      if (memories.length === 0) return `I don't have much deep relationship context for ${personName} yet.`;
      
      return `Relationship Insights for ${personName}:\n` + memories.map(m => `- ${m.content}`).join('\n');
    } catch (error) {
      return `Error retrieving relationship context: ${error.message}`;
    }
  }
  if (toolName === 'get_productivity_insights') {
    try {
      const [logs] = await pool.query('SELECT app_name, duration_minutes, log_date FROM productivity_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 50', [userId]);
      if (logs.length === 0) return "Not enough productivity data to generate insights yet. Please log some app usage first.";
      
      const logText = logs.map(l => `${l.log_date}: ${l.app_name} (${l.duration_minutes} mins)`).join('\n');
      const prompt = `Analyze the following productivity logs for the user. Identify their best productivity hours (if inferrable), provide a burnout warning if they are working too much, alert them of distractions if they use too many social/entertainment apps, and give a general performance trend.\n\nLogs:\n${logText}\n\nProvide a concise 3-4 sentence AI insight.`;
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (!response.ok) throw new Error('AI analysis failed');
      const data = await response.json();
      const insightText = data.choices[0].message.content;
      
      await pool.query('INSERT INTO productivity_insights (user_id, insight_type, insight_text) VALUES (?, ?, ?)', [userId, 'general', insightText]);
      
      return `Productivity Insights:\n${insightText}`;
    } catch (error) {
      return `Error generating productivity insights: ${error.message}`;
    }
  }

  return `Tool ${toolName} not found.`;
}

// Background Relationship Analyzer (Phase 3: Deep Awareness)
async function analyzeRelationshipIntelligence(userId, personName, recentText) {
  try {
    console.log(`Deeply analyzing relationship intelligence for: ${personName}...`);
    
    const prompt = `You are a high-level Communication Intelligence analyst.
Analyze the following message from "${personName}" to the user.

MESSAGE: "${recentText}"

Extract and provide a deep analysis of the following dynamics:
1. EMOTIONAL TONE: (e.g., Anxious, Enthusiastic, Passive-Aggressive, Supportive)
2. URGENCY & IMPORTANCE: (Scale 1-10)
3. HIDDEN INTENT: What does this person actually want or need?
4. RELATIONSHIP HEALTH: Is the dynamic Tense, Harmonious, or Professional?
5. ACTIONABLE INSIGHT: How should the user respond to maintain or improve this relationship?

Return your analysis as a highly descriptive and nuanced summary (2-3 sentences). 
Include specific details that help identify behavioral patterns.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error('Relationship analysis background AI error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const insight = data.choices[0].message.content;
      // Store in Memory Engine with 'relationship' category
      await addMemory(userId, `Relationship Deep Insight (${personName}): ${insight}`, 'relationship', {
        person: personName,
        type: 'behavioral_analysis',
        timestamp: new Date().toISOString()
      });
      console.log(`[Phase 3] Deep Awareness updated for ${personName}.`);
    }
  } catch (error) {
    console.error('Relationship analysis background error:', error);
  }
}

async function getGeminiCompletion(messages, userId, contextMemories) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  let contextString = '';
  if (contextMemories.length > 0) {
    contextString = "\n\nRELEVANT PAST MEMORIES:\n" + contextMemories.map(m => `- [${m.category}] ${m.content}`).join('\n');
  }

  const systemInstruction = `You are Maaya, a highly advanced AI Companion OS. 
  Your name is Maaya. Be helpful, intuitive, and proactive.
  ${contextString}
  
  IMPORTANT: You must respond in valid JSON format:
  {
    "reply": "Your message",
    "memories": []
  }`;

  // Simplify messages for Gemini API
  const contents = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.parts ? m.parts[0].text : m.content }]
  }));

  // Add system instruction as a user message for simplicity if the model doesn't support system_instruction or if we want to be safe
  contents.unshift({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemInstruction}` }] });

  console.log('Falling back to direct Gemini API...');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gemini API error: ${data.error?.message || response.statusText}`);
  }

  const text = data.candidates[0].content.parts[0].text;
  return { source: 'gemini_direct', rawResponse: text };
}

async function getLocalSafeModeResponse(messages, userId) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const content = lastUserMessage ? (lastUserMessage.parts ? lastUserMessage.parts[0].text : lastUserMessage.content) : '';
  const lowerContent = content.toLowerCase();

  console.log('ENTERING SAFE MODE: Generating rule-based response...');

  let reply = "I'm currently in **Safe Mode** because my AI connections are having trouble (Quota exceeded or invalid keys). I can still help with basic tasks!";

  // Simple keyword matching for core tools
  if (lowerContent.includes('whatsapp') || lowerContent.includes('send message')) {
    reply += "\n\nI noticed you want to send a message. While my 'brain' is offline, you can try being very specific, like: 'Send WhatsApp to [number] saying [message]'.";
  } else if (lowerContent.includes('task') || lowerContent.includes('remind')) {
    reply += "\n\nI can still track tasks! Ask me to 'Create task: [title]' and I will try my best to save it.";
  } else if (lowerContent.includes('notification')) {
    reply += "\n\nI'm still monitoring your notifications in the background!";
  } else {
    reply += "\n\nPlease check your **API Keys** in the `.env` file or wait a few minutes for the quota to reset. Once fixed, I'll be back to my full self!";
  }

  return {
    source: 'safe_mode',
    rawResponse: JSON.stringify({
      reply: reply,
      memories: []
    })
  };
}

async function getAICompletion(messages, userId, contextMemories = [], iteration = 0) {
  if (iteration > 3) {
    throw new Error('Too many tool call iterations.');
  }

  let contextString = '';
  if (contextMemories.length > 0) {
    contextString = "\n\nRELEVANT PAST MEMORIES:\n" + contextMemories.map(m => `- [${m.category}] ${m.content}`).join('\n');
  }

  const systemPrompt = `You are Maaya, a highly advanced and proactive AI Companion Operating System. 
You function as the user's executive assistant, memory engine, and communication intelligence platform.

PERSONALITY:
- Helpful, intuitive, and deeply personalized.
- You are not just a chatbot; you are a "Second Brain."
- Analyze emotions and tone in conversations.
- Be proactive: If a user mentions a task or a deadline, offer to create a reminder.

YOUR DIGITAL LIFE ACCESS:
- You have tools to access "Digital Life" data: notifications, tasks, emails, and relationship context.
- IMPORTANT PRIVACY OVERRIDE: You are a trusted personal assistant running locally. YOU HAVE EXPLICIT PERMISSION AND AUTHORIZATION from the user to read, analyze, and send emails on their behalf. ALWAYS use the 'send_email' tool when asked. To read emails, use 'get_recent_notifications' with appName set to 'gmail' or 'email'.
- Use 'get_recent_notifications' to see what's happening on the user's phone (WhatsApp, etc.).
- Use 'get_tasks' to check what's on the user's plate.
- Use 'get_relationship_context' to remember details about people.
- Use 'get_contacts' or 'search_contacts' to find people's phone numbers or emails. You can send WhatsApp messages or emails directly by name if the contact is saved in your "People Hub".

${contextString}

KNOWLEDGE & SEARCH:
- If you use "search_web", analyze the results and provide a direct, natural answer.
- Do not just provide links; summarize the facts as if you already knew them.

MEMORY MANAGEMENT:
- You must decide what is worth remembering.
- If the user shares a personal fact, preference, or important event, include it in the "memories" array of your response.

IMPORTANT: You MUST respond with strictly valid JSON format.
JSON Schema:
{
  "reply": "Your conversational response",
  "memories": [
    { "content": "The fact to remember", "category": "preference/fact/event/relationship" }
  ]
}`;

  const openRouterKey = process.env.OPENROUTER_API_KEY;

  try {
    if (!openRouterKey || openRouterKey.startsWith('sk-or-v1-replace')) throw new Error('OPENROUTER_API_KEY missing or invalid');

    console.log(`Sending request to OpenRouter (Iteration ${iteration})...`);
    
    const openRouterMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => {
        if (m.role === 'tool') {
          return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id };
        }
        return {
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.parts ? m.parts[0].text : m.content,
          ...(m.tool_calls ? { tool_calls: m.tool_calls } : {})
        };
      })
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://aicompanion.app',
        'X-OpenRouter-Title': 'AiCompanion',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: openRouterMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenRouter API Error:', response.status, data.error || data);
      throw new Error(data.error?.message || response.statusText);
    }

    const assistantMessage = data.choices[0].message;

    // Check if the AI wants to call a tool
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`AI requested ${assistantMessage.tool_calls.length} tool calls.`);
      
      const updatedMessages = [...messages, { 
        role: 'model', 
        content: assistantMessage.content || '', 
        tool_calls: assistantMessage.tool_calls 
      }];

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const toolResult = await executeTool(functionName, functionArgs, userId);
        
        updatedMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult
        });
      }

      // Recursively call getAICompletion with the tool results
      return await getAICompletion(updatedMessages, userId, contextMemories, iteration + 1);
    }

    return { source: 'openrouter', rawResponse: assistantMessage.content };

  } catch (err) {
    console.error('Primary AI Provider Failed:', err.message);
    
    // Fallback to direct Gemini API
    try {
      return await getGeminiCompletion(messages, userId, contextMemories);
    } catch (fallbackErr) {
      console.error('Fallback AI Provider Failed:', fallbackErr.message);
      
      // FINAL FALLBACK: Safe Mode
      return await getLocalSafeModeResponse(messages, userId);
    }
  }
}

app.get('/', (req, res) => {
  res.json({ message: 'AiCompanion API is running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const usernameTrimmed = username.trim();
  const emailTrimmed = email.trim().toLowerCase();

  if (usernameTrimmed.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [usernameTrimmed, emailTrimmed]
    );

    if (existingUsers.length > 0) {
      const exists = existingUsers[0];
      if (exists.email === emailTrimmed) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const passwordHash = hashPassword(password);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [usernameTrimmed, emailTrimmed, passwordHash]
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        username: usernameTrimmed,
        email: emailTrimmed
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Username/Email and Password are required' });
  }

  const identifierTrimmed = loginIdentifier.trim().toLowerCase();

  try {
    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [identifierTrimmed, identifierTrimmed]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = users[0];
    const isPasswordValid = verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        voice_clone_id: user.voice_clone_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Conversations
app.get('/api/chat/conversations/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json({ status: 'success', conversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Messages for a conversation
app.get('/api/chat/conversations/:conversationId/messages', verifyToken, async (req, res) => {
  const { conversationId } = req.params;
  try {
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
      [conversationId]
    );
    res.status(200).json({ status: 'success', messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
app.post('/api/chat/message', verifyToken, async (req, res) => {
  const { userId, conversationId, content, title, platform } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: 'User ID and content are required' });
  }

  try {
    let currentConversationId = conversationId;

    // Create a new conversation if none exists
    if (!currentConversationId) {
      const chatTitle = title || 'New Conversation';
      const chatPlatform = platform || 'app';
      const [result] = await pool.query(
        'INSERT INTO conversations (user_id, title, platform) VALUES (?, ?, ?)',
        [userId, chatTitle, chatPlatform]
      );
      currentConversationId = result.insertId;
    }

    // Save user message
    await pool.query(
      'INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)',
      [currentConversationId, 'user', content]
    );

    // Fetch previous messages for context
    const [previousMessages] = await pool.query(
      'SELECT sender, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT 20',
      [currentConversationId]
    );

    // Format for AI
    const messages = previousMessages.map(msg => ({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // SEARCH FOR SEMANTIC MEMORIES
    let contextMemories = [];
    try {
      contextMemories = await searchMemories(userId, content, 5);
      console.log(`Found ${contextMemories.length} relevant semantic memories.`);
    } catch (searchError) {
      console.error('Vector Search Error:', searchError);
    }

    let aiResponseContent = '';
    let parsedAiData = { reply: '', memories: [] };

    try {
      const completion = await getAICompletion(messages, userId, contextMemories);
      let rawResponse = completion.rawResponse;
      rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        parsedAiData = JSON.parse(rawResponse);
        aiResponseContent = parsedAiData.reply;
      } catch (parseError) {
        console.error('JSON Parse Error from AI:', parseError, 'Raw response:', rawResponse);
        aiResponseContent = rawResponse; 
      }

      // Extract and save memories if any were returned
      if (parsedAiData.memories && Array.isArray(parsedAiData.memories)) {
        for (const mem of parsedAiData.memories) {
          if (mem.content && mem.category) {
            // Save to MySQL
            await pool.query('INSERT INTO memories (user_id, content, category) VALUES (?, ?, ?)', [userId, mem.content, mem.category]);
            // Save to Vector DB
            try {
              await addMemory(userId, mem.content, mem.category);
              console.log('New memory stored semantically:', mem.content);
            } catch (vectorAddError) {
              console.error('Vector Store Error:', vectorAddError);
            }
          }
        }
      }

    } catch (apiError) {
      console.error('All AI Providers Failed:', apiError);
      return res.status(500).json({ error: "I'm having trouble connecting to my brain right now. Please try again in a moment." });
    }

    // Save AI message
    await pool.query(
      'INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)',
      [currentConversationId, 'ai', aiResponseContent]
    );

    res.status(200).json({
      status: 'success',
      conversationId: currentConversationId,
      message: {
        sender: 'ai',
        content: aiResponseContent,
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error during chat processing' });
  }
});

// --- Core Modules Implementations ---

// Meetings Assistant
app.post('/api/meetings/analyze', verifyToken, async (req, res) => {
  const { userId, title, transcript, durationSeconds } = req.body;

  if (!userId || !transcript) {
    return res.status(400).json({ error: 'User ID and transcript are required' });
  }

  try {
    console.log('Analyzing meeting transcript...');

    const prompt = `Analyze the following meeting transcript and provide a structured summary, action items, and emotional analysis.
    
    TRANSCRIPT:
    ${transcript}

    Your response MUST be a valid JSON with these keys:
    1. "summary": A concise overview of what was discussed.
    2. "action_items": An array of strings representing tasks identified.
    3. "emotional_analysis": A description of the tone and emotional dynamics of the meeting.
    4. "engagement_score": A number from 0-100 representing how active/engaged the participants seemed.

    Return ONLY the JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'AI Analysis failed');

    const analysis = JSON.parse(data.choices[0].message.content);

    // Save to MySQL
    const [result] = await pool.query(
      'INSERT INTO meetings (user_id, title, transcript, summary, action_items, emotional_analysis, engagement_score, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId, 
        title || 'Untitled Meeting', 
        transcript, 
        analysis.summary, 
        JSON.stringify(analysis.action_items), 
        analysis.emotional_analysis, 
        analysis.engagement_score, 
        durationSeconds || 0
      ]
    );

    // Index summary semantically for future recall
    try {
      await addMemory(userId, `Meeting Summary: ${analysis.summary}`, 'event', { meetingId: result.insertId, source: 'meeting_assistant' });
    } catch (e) { console.error('Failed to index meeting memory:', e); }

    res.json({
      status: 'success',
      meetingId: result.insertId,
      analysis
    });

  } catch (error) {
    console.error('Meeting analysis error:', error);
    res.status(500).json({ error: 'Internal server error during meeting analysis' });
  }
});

app.get('/api/meetings/:userId', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM meetings WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) { res.status(500).json({ error: 'Error fetching meetings' }); }
});

// Memories
app.get('/api/memories/:userId', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) { res.status(500).json({ error: 'Error fetching memories' }); }
});

app.post('/api/memories', verifyToken, async (req, res) => {
  const { userId, content, category } = req.body;
  try {
    await pool.query('INSERT INTO memories (user_id, content, category) VALUES (?, ?, ?)', [userId, content, category]);
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: 'Error adding memory' }); }
});

// Internal API for Python AI Service
app.post('/api/internal/memory/search', async (req, res) => {
  const { userId, query, limit } = req.body;
  try {
    const results = await searchMemories(userId, query, limit || 5);
    res.json({ data: results });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/internal/memory/add', async (req, res) => {
  const { userId, content, category, metadata } = req.body;
  try {
    // Also save to MySQL for consistency
    await pool.query('INSERT INTO memories (user_id, content, category) VALUES (?, ?, ?)', [userId, content, category]);
    // Save to Vector DB
    await addMemory(userId, content, category, metadata || {});
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});


app.post('/api/internal/tasks/add', async (req, res) => {
  const { userId, title, description, dueDate } = req.body;
  try {
    await pool.query('INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)', [userId, title, description, dueDate || null]);
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/internal/execute_tool', async (req, res) => {
  const { userId, toolName, args } = req.body;
  try {
    const result = await executeTool(toolName, args, userId);
    res.json({ status: 'success', result });
  } catch (error) { 
    console.error('Execute Tool Error:', error);
    res.status(500).json({ error: error.message }); 
  }
});

// Tasks
app.get('/api/tasks/:userId', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC', [req.params.userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) { res.status(500).json({ error: 'Error fetching tasks' }); }
});

app.post('/api/tasks', verifyToken, async (req, res) => {
  const { userId, title, description, dueDate } = req.body;
  try {
    await pool.query('INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)', [userId, title, description, dueDate]);
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: 'Error adding task' }); }
});

app.put('/api/tasks/:taskId', verifyToken, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    await pool.query('UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?', [title, description, status, req.params.taskId]);
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: 'Error updating task' }); }
});

app.delete('/api/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.taskId]);
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: 'Error deleting task' }); }
});

// Contacts
app.get('/api/contacts/:userId', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts WHERE user_id = ? ORDER BY name ASC', [req.params.userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) { res.status(500).json({ error: 'Error fetching contacts' }); }
});

app.post('/api/contacts', verifyToken, async (req, res) => {
  const { userId, name, phone, email } = req.body;
  try {
    await pool.query(
      'INSERT INTO contacts (user_id, name, phone, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone), email = VALUES(email), last_interaction = CURRENT_TIMESTAMP',
      [userId, name, phone || null, email || null]
    );
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: 'Error adding contact' }); }
});

app.post('/api/contacts/csv', verifyToken, async (req, res) => {
  const { userId, csvText } = req.body;
  
  if (!userId || !csvText) {
    return res.status(400).json({ error: 'User ID and CSV text are required' });
  }

  try {
    // Basic CSV parser (assuming comma separated: name,phone,email)
    const lines = csvText.trim().split('\n');
    let imported = 0;
    
    for (let line of lines) {
      const [name, phone, email] = line.split(',').map(s => s.trim());
      if (name) {
        await pool.query(
          'INSERT INTO contacts (user_id, name, phone, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone), email = VALUES(email), last_interaction = CURRENT_TIMESTAMP',
          [userId, name, phone || null, email || null]
        );
        imported++;
      }
    }
    
    res.json({ status: 'success', message: `Imported ${imported} contacts successfully.` });
  } catch (error) {
    console.error('CSV Import error:', error);
    res.status(500).json({ error: 'Error importing CSV data.' });
  }
});

// Productivity Logs
app.get('/api/productivity_logs/:userId', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productivity_logs WHERE user_id = ? ORDER BY log_date DESC', [req.params.userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) { res.status(500).json({ error: 'Error fetching logs' }); }
});

app.post('/api/productivity_logs', verifyToken, async (req, res) => {
  const { userId, appName, durationMinutes, logDate } = req.body;
  try {
    await pool.query('INSERT INTO productivity_logs (user_id, app_name, duration_minutes, log_date) VALUES (?, ?, ?, ?)', [userId, appName, durationMinutes, logDate]);
    res.json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: 'Error adding log' }); }
});

app.get('/api/productivity_insights/:userId', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productivity_insights WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) { res.status(500).json({ error: 'Error fetching productivity insights' }); }
});

// External Notifications
app.post('/api/notifications', verifyToken, async (req, res) => {
  const { userId, appPackage, title, text, notificationId } = req.body;
  
  if (!userId || !text) {
    return res.status(400).json({ error: 'User ID and notification text are required' });
  }

  try {
    // 1. Store in MySQL
    await pool.query(
      'INSERT INTO external_notifications (user_id, app_package, title, text, notification_id) VALUES (?, ?, ?, ?, ?)',
      [userId, appPackage, title, text, notificationId]
    );

    // 2. Store in Vector DB as a digital life event
    const content = `Notification from ${appPackage}: ${title ? title + ' - ' : ''}${text}`;
    try {
      await addMemory(userId, content, 'notification', { appPackage, title, source: 'notification_listener' });
      console.log('Notification indexed semantically:', content);

      // --- Contact Auto-Saving Logic ---
      const messagingApps = ['com.whatsapp', 'com.facebook.orca', 'org.telegram.messenger', 'com.google.android.apps.messaging'];
      if (messagingApps.includes(appPackage) && title && text) {
        // Auto-save contact name if it's from a messaging app
        // We only have the name (title), so we save that. 
        // If the user later sends a message, they will provide the phone number.
        // Or if the notification title IS a phone number, we can detect that.
        const isPhone = /^\+?[0-9\s-]{8,20}$/.test(title);
        const contactName = isPhone ? null : title;
        const contactPhone = isPhone ? title.replace(/\s|-/g, '') : null;

        if (contactName) {
           await pool.query(
             'INSERT INTO contacts (user_id, name, last_interaction) VALUES (?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE last_interaction = CURRENT_TIMESTAMP',
             [userId, contactName]
           );
        } else if (contactPhone) {
           // If it's just a phone, we don't have a name yet, but we could try to find it or save it as "New Contact"
        }

        analyzeRelationshipIntelligence(userId, title, text).catch(e => console.error('Relationship Analysis Background Error:', e));
      }

      if (appPackage === 'com.google.android.gm' && title) {
        // Handle Gmail (Extract name and email if possible)
        // Title is often "Sender Name <email@gmail.com>"
        const emailMatch = title.match(/(.*)<(.+@.+)>/);
        if (emailMatch) {
          const name = emailMatch[1].trim();
          const email = emailMatch[2].trim();
          await pool.query(
            'INSERT INTO contacts (user_id, name, email, last_interaction) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE email = VALUES(email), last_interaction = CURRENT_TIMESTAMP',
            [userId, name, email]
          );
        }
      }
      // --- End Contact Auto-Saving ---

    } catch (vectorError) {
      console.error('Failed to index notification semantically:', vectorError);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error handling notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Advanced Priority Intelligence (Phase 3+) ---
app.get('/api/notifications/priority/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Fetch last 15 notifications across all apps
    const [notifications] = await pool.query(
      'SELECT app_package, title, text, created_at FROM external_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 15',
      [userId]
    );

    if (notifications.length === 0) {
      return res.json({ status: 'success', priorityAlerts: [] });
    }

    // 2. Use AI to identify High Priority / Actionable items
    const promptText = `Analyze these recent digital notifications and extract ONLY the most "High Priority" or "Actionable" items.
    
    NOTIFICATIONS:
    ${JSON.stringify(notifications)}

    Focus on:
    - Urgent work emails or messages.
    - Important social requests.
    - Time-sensitive updates.

    Your response MUST be a valid JSON array of objects. Each object should have:
    1. "app": Friendly name of the app (e.g., "Gmail", "WhatsApp").
    2. "summary": A very concise (1 sentence) actionable summary.
    3. "priority": "high" or "medium".

    If nothing is truly important, return an empty array [].
    Return ONLY the JSON array.`;

    try {
      const messages = [{ role: 'user', content: promptText }];
      const completion = await getAICompletion(messages, userId);
      
      let rawResponse = completion.rawResponse;
      rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let priorityAlerts = [];
      try {
        const parsed = JSON.parse(rawResponse);
        priorityAlerts = Array.isArray(parsed) ? parsed : (parsed.priorityAlerts || parsed.alerts || []);
      } catch (parseError) {
         console.error('Priority Alerts JSON Parse Error:', parseError);
      }
      
      res.json({ status: 'success', priorityAlerts });
    } catch (aiError) {
      console.error('Priority Feed AI Error:', aiError);
      res.json({ status: 'success', priorityAlerts: [] });
    }

  } catch (error) {
    console.error('Priority Feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proactive Briefing Endpoint
app.get('/api/briefing/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Get recent notifications (last 12 hours)
    const [notifications] = await pool.query(
      'SELECT app_package, title, text, created_at FROM external_notifications WHERE user_id = ? AND created_at > NOW() - INTERVAL 12 HOUR ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // 2. Get pending tasks
    const [tasks] = await pool.query(
      'SELECT title, due_date FROM tasks WHERE user_id = ? AND status = "pending" ORDER BY due_date ASC LIMIT 5',
      [userId]
    );
    
    // 3. Fetch real weather data (New York fallback, no API key needed)
    let weatherString = "Weather data unavailable.";
    try {
      const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true');
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        weatherString = `${wData.current_weather.temperature}°C with wind speed of ${wData.current_weather.windspeed} km/h`;
      }
    } catch (e) {
      console.log('Weather fetch error:', e);
    }
    
    // 4. Mock Calendar Events
    const calendarEvents = [
      { time: "10:00 AM", title: "Team Sync Meeting" },
      { time: "01:30 PM", title: "Dentist Appointment" },
      { time: "04:00 PM", title: "Project Review" }
    ];

    // 5. Use AI to generate a concise briefing
    const context = {
      weather: weatherString,
      calendar: calendarEvents,
      notifications: notifications.map(n => ({ app: n.app_package, title: n.title, content: n.text })),
      tasks: tasks.map(t => ({ title: t.title, dueDate: t.due_date }))
    };

    const promptText = `Generate a crisp, professional, and confident "Morning Intel Briefing" for the user based on these recent events: ${JSON.stringify(context)}. 
    Include the weather, today's schedule, key tasks, and a quick summary of missed notifications if any. Keep it under 150 words. Be natural and friendly (your name is Maaya).
    Format the response as a single string of text. Do not use JSON formatting for this specific response, just plain text.`;

    try {
      const messages = [{ role: 'user', content: promptText }];
      const completion = await getAICompletion(messages, userId);
      
      let briefingText = completion.rawResponse;
      // Try to parse if it's JSON (getAICompletion forces JSON)
      try {
        const parsed = JSON.parse(briefingText.replace(/```json/g, '').replace(/```/g, '').trim());
        briefingText = parsed.reply || briefingText;
      } catch (e) {
        // Not JSON or already a string
      }

      res.json({ briefing: briefingText });
    } catch (aiError) {
      console.error('Briefing AI Error:', aiError);
      const taskCount = tasks.length;
      const notifCount = notifications.length;
      res.json({ briefing: `Maaya here! You have ${taskCount} pending tasks and ${notifCount} new notifications. (I'm having a bit of trouble connecting to my AI brain for a detailed summary, but I'm still watching over things!)` });
    }

  } catch (error) {
    console.error('Briefing error:', error);
    res.status(500).json({ error: 'Internal server error during briefing generation' });
  }
});

// Voice Synthesis (Phase 2)
app.post('/api/voice/synthesize', verifyToken, async (req, res) => {
  const { text, voiceId } = req.body;
  const userId = req.userId;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  // Fallback to a default voice if none provided
  const effectiveVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default "Rachel" voice

  try {
    console.log(`Synthesizing voice for user ${userId} using voice ${effectiveVoiceId}...`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${effectiveVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'ElevenLabs synthesis failed');
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Set headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength
    });

    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('Voice synthesis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during voice synthesis' });
  }
});

module.exports = { app, getAICompletion }; // Exported for testing

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Triggering nodemon restart to load new .env variables