const express = require("express");
const bodyParser = require("body-parser");
const { VoiceResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Root route for testing
app.get("/", (req, res) => {
  res.send("Twilio IVR bot is running ✅");
});

// Twilio voice webhook
app.post("/voice", (req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: "/gather",
    method: "POST",
  });

  gather.say("Welcome! Press 1 for crop info. Press 2 for weather info.");

  res.type("text/xml");
  res.send(twiml.toString());
});

// Handle user input
app.post("/gather", (req, res) => {
  const twiml = new VoiceResponse();
  const digit = req.body.Digits;

  if (digit === "1") {
    twiml.say("You selected crop info. Wheat price is 2000 rupees per quintal.");
  } else if (digit === "2") {
    twiml.say("You selected weather info. Today's weather is sunny with 32 degrees Celsius.");
  } else {
    twiml.say("Invalid choice. Goodbye!");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// IMPORTANT: Use Render’s PORT, not hardcoded 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
