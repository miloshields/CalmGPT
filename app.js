require('dotenv').config();
const http = require('http');
const express = require('express');
const twilio = require('twilio');
const session = require('express-session');


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
    max_tokens: 150
  });
  return response.data.choices[0].message.content;
}

async function getGPTResourceResponse(prompt) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: resource_prompt + prompt + "\nOutput: ",
    temperature: 0,
    max_tokens: 64,
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
    twiml.say("Welcome to Calm GPT. Feel free to talk as much or as little about your day as you'd like, and I'll design a meditation according to how you say you're feeling. You can also ask for a specific visualization, like 'I want to visualize waves washing over me' or, I want to do a breath-counting exercise. We can start whenever you're ready.");
    twiml.gather({
      input: 'speech',
      action: '/next',
      speechTimeout: '10',
      language: 'en-US'
    });
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  })

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