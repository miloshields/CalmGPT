require('dotenv').config();
const http = require('http');
const express = require('express');
const twilio = require('twilio');
const session = require('express-session');
const { parseMeditationInput, getPauseLength } = require('./helpers.js');

const workingPrompt = "You are a meditation generation robot. You respond to any prompt with a series of stringsthat should be said to the user, with [PAUSE] in between those strings. The user will first tell you about their day as well as any visualizations or exercises that they want, followed by the length of time. Err on the side of more speech, not less, when it comes to generating these meditations. You should have at least as many blocks of text separated by pauses as minutes in the meditation - if you have a 15 minute meditation, for example, you can number them 1/15, 2/15, 3/15, etc. Here's your first prompt:\n"

const accountSid    = process.env.TWILIO_ACCOUNT_SID;
const authToken     = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone   = process.env.TWILIO_PHONE_NUMBER;
const testPhone     = process.env.TEST_PHONE_NUMBER;
const sessionSecret = process.env.EXPRESS_SESSION_SECRET;
const ngrok_url     = process.env.NGROK_TUNNEL_URL;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Initialize Express web server
const app = express();

// Set express urlencoded mode, activate session
app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: true
    }),
    express.urlencoded({
      extended: true,
    })
  );

const { Configuration, OpenAIApi} = require('openai');

// Configuring OpenAI connection
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// functions to use OpenAi apis
async function getChatGPTResponse(prompt) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: prompt}],
    max_tokens: 1000
  });
  return response.data.choices[0].message.content;
}

async function getGPTResourceResponse(prompt) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  return response.data.choices[0].text;
}

module.exports = { getChatGPTResponse, getGPTResourceResponse };

// landing pad for all functionality
app.post('/start', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Welcome to Calm GPT.");// Feel free to talk as much or as little about your day as you'd like, and I'll design a meditation according to how you say you're feeling. You can also ask for a specific visualization, like 'I want to visualize waves washing over me' or, I want to do a breath-counting exercise. We can start whenever you're ready.");
    twiml.gather({
      input: 'speech',
      action: '/get-meditation-time',
      speechTimeout: 'auto',
      language: 'en-US'
    });
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
})

app.post('/get-meditation-time', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    req.session.userSpeech = req.body.SpeechResult;
  
    const gather = twiml.gather({
      input: 'dtmf',
      action: '/generate-response',
      hints: '3-30',
      timeout: 5,
      numDigits: 2
    });
    
    gather.say('Please enter a desired meditation length between 3 and 30 minutes using the keybad. You may have to wait up to 10 seconds for your meditation.');

    res.type('text/xml');
    res.send(twiml.toString());
  });

  app.post('/generate-response', async (req, res) => {
    const meditationTime = req.body.Digits;
    req.session.meditationTime = meditationTime;
  
    console.log("User speech: " + req.session.userSpeech);
    console.log("Desired meditation length: " + meditationTime + " minutes");
  
    console.log("Got to generate response");
    const prompt = workingPrompt + req.session.userSpeech + "/n/n Desired Meditation Time: "+ meditationTime +" minutes"; 
    const response = await getGPTResourceResponse(prompt);
    console.log("Response:" + response)
    const messages = parseMeditationInput(response);
    console.log("Messages: "+messages)
    const pauseLength  = Math.ceil(getPauseLength(messages, meditationTime));
    console.log("Pause length: "+pauseLength)
  
    const twiml = new twilio.twiml.VoiceResponse();

    for (let i = 0; i < messages.length; i++) {
        twiml.say(messages[i]);
        if (i < messages.length - 1) {
          twiml.pause({ length: pauseLength });
        }
      }
  
      res.type('text/xml');
      res.send(twiml.toString());
  });



  // start the server
http.createServer(app).listen(3000, () => {
    console.log('Express server listening on port 3000');
});

// Make the initial outgoing call
client.calls.create({
  url: ngrok_url+'/start',
  to: testPhone,
  from: twilioPhone
})
.then(call => console.log(call.sid))
.catch(error => console.log(error));