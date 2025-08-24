const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { VoiceResponse } = require("twilio").twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// ---------------------- Data ----------------------
const topCrops = ["Wheat", "Rice", "Maize", "Sugarcane", "Cotton"];
const cropPrices = {
  Wheat: "2000 rupees per quintal",
  Rice: "1800 rupees per quintal",
  Maize: "1500 rupees per quintal",
  Sugarcane: "2500 rupees per quintal",
  Cotton: "3000 rupees per quintal",
};
const soilTypes = {
  Wheat: "Loamy soil",
  Rice: "Clay soil",
  Maize: "Sandy loam soil",
  Sugarcane: "Alluvial soil",
  Cotton: "Black cotton soil",
};

// ---------------------- Root ----------------------
app.get("/", (req, res) => res.send("Twilio IVR bot is running ✅"));

// ---------------------- Language Selection ----------------------
app.post("/voice", (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({ numDigits: 1, action: "/language", method: "POST" });
  gather.say(
    "Welcome! Press 1 for English. Press 2 for Hindi. Press 3 for Telugu. Press 4 for Marathi.",
    { voice: "alice", language: "en-US" }
  );
  res.type("text/xml");
  res.send(twiml.toString());
});

// ---------------------- Language Handler ----------------------
app.post("/language", (req, res) => {
  const twiml = new VoiceResponse();
  const digit = req.body.Digits;
  let gather;

  switch (digit) {
    case "1": // English
      gather = twiml.gather({ numDigits: 1, action: "/english-main", method: "POST" });
      gather.say("Press 1 for Weather. Press 2 for Crop Info. Press 3 for Soil Info.", { voice: "alice", language: "en-US" });
      break;
    case "2": // Hindi
      gather = twiml.gather({ numDigits: 1, action: "/hindi-main", method: "POST" });
      gather.say("Mausam ke liye 1 dabaye. Fasal ke liye 2 dabaye. Mitti ke liye 3 dabaye.", { voice: "alice", language: "hi-IN" });
      break;
    case "3": // Telugu
      gather = twiml.gather({ numDigits: 1, action: "/telugu-main", method: "POST" });
      gather.say("Mausam kosam 1 dabbandi. Fasal kosam 2 dabbandi. Mitti kosam 3 dabbandi.", { voice: "alice", language: "te-IN" });
      break;
    case "4": // Marathi
      gather = twiml.gather({ numDigits: 1, action: "/marathi-main", method: "POST" });
      gather.say("Hawa sathi 1 dabva. Fasal sathi 2 dabva. Mati sathi 3 dabva.", { voice: "alice", language: "mr-IN" });
      break;
    default:
      twiml.say("Invalid choice. Goodbye!", { voice: "alice", language: "en-US" });
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// ---------------------- Main Menu Function ----------------------
function mainMenu(languageCode) {
  return (req, res) => {
    const twiml = new VoiceResponse();
    const digit = req.body.Digits;

    // Weather option
    if (digit === "1") {
      const gather = twiml.gather({
        numDigits: 5,
        action: `/${languageCode}-weather`,
        method: "POST",
      });
      let prompt = {
        "en": "Please enter the 5-digit postal code of your city followed by the pound key.",
        "hi": "Apne sheher ka 5 ank ka zip code dabaye aur pound key dabaye.",
        "te": "Mee nagaram yokka 5 digit postal code enter cheyandi, pound key to kalupukondi.",
        "mr": "Tumchya shaharatil 5-ankanchya zip code enter kara ani pound key dabhva."
      };
      gather.say(prompt[languageCode], { voice: "alice", language: langCodeMap(languageCode) });

    } 
    // Crop info
    else if (digit === "2") {
      const gather = twiml.gather({
        numDigits: 1,
        action: `/${languageCode}-crop-choice`,
        method: "POST"
      });
      let cropsList = "Top crops are: ";
      topCrops.forEach((c, i) => cropsList += `Press ${i+1} for ${c}. `);
      gather.say(cropsList, { voice: "alice", language: langCodeMap(languageCode) });

    } 
    // Soil info
    else if (digit === "3") {
      const gather = twiml.gather({
        numDigits: 1,
        action: `/${languageCode}-soil-choice`,
        method: "POST"
      });
      let cropsList = "Top crops are: ";
      topCrops.forEach((c, i) => cropsList += `Press ${i+1} for ${c}. `);
      gather.say(cropsList, { voice: "alice", language: langCodeMap(languageCode) });

    } else {
      twiml.say({
        "en": "Invalid choice. Goodbye!",
        "hi": "Galat vikalp. Alvida!",
        "te": "Thappu vikalamu. Vidhaayaka!",
        "mr": "Chukicha paryay. Alvida!"
      }[languageCode], { voice: "alice", language: langCodeMap(languageCode) });
    }

    res.type("text/xml");
    res.send(twiml.toString());
  }
}

// Map languageCode to Twilio language
function langCodeMap(code) {
  switch(code) {
    case "en": return "en-US";
    case "hi": return "hi-IN";
    case "te": return "te-IN";
    case "mr": return "mr-IN";
  }
}

// ---------------------- Weather Function ----------------------
async function weatherHandler(languageCode) {
  return async (req, res) => {
    const twiml = new VoiceResponse();
    const zip = req.body.Digits;
    const apiKey = process.env.OPENWEATHER_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},IN&units=metric&appid=${apiKey}`;

    try {
      const response = await axios.get(url);
      const temp = response.data.main.temp;
      const description = response.data.weather[0].description;

      let message = {
        "en": `The weather in your area is ${description} with temperature ${temp} degrees Celsius.`,
        "hi": `Aapke kshetra ka mausam ${description} hai aur taapman ${temp} degree Celsius hai.`,
        "te": `Mee pradesham lo vaatawaranam ${description} undi mariyu taapam ${temp} degrees Celsius undi.`,
        "mr": `Tumchya kshetra madhil hawa ${description} aahe aani tapman ${temp} degree Celsius aahe.`
      }[languageCode];

      twiml.say(message, { voice: "alice", language: langCodeMap(languageCode) });

    } catch(err) {
      console.error(err);
      twiml.say({
        "en": "Sorry, I could not find your location. Please try again.",
        "hi": "Maaf kijiye, main aapka location nahi paaya. Kripya dobara koshish karein.",
        "te": "Kshaminchandi, mee mee sthalanni kanipinchaledu. Dayachesi malli prayatnam cheyandi.",
        "mr": "Maaf kara, mi tumcha sthaan shodhhu shakat nahi. Krupaya punha prayatna kara."
      }[languageCode], { voice: "alice", language: langCodeMap(languageCode) });
    }

    res.type("text/xml");
    res.send(twiml.toString());
  }
}

// ---------------------- Crop Choice Function ----------------------
function cropChoiceHandler(languageCode) {
  return (req, res) => {
    const twiml = new VoiceResponse();
    const digit = parseInt(req.body.Digits);

    if(digit >= 1 && digit <= topCrops.length) {
      const crop = topCrops[digit-1];
      let message = {
        "en": `The price of ${crop} is ${cropPrices[crop]}.`,
        "hi": `${crop} ki keemat ${cropPrices[crop]} hai.`,
        "te": `${crop} yokka dharaka mariyu moolya ${cropPrices[crop]}.`,
        "mr": `${crop} chi kimmat ${cropPrices[crop]} aahe.`
      }[languageCode];

      twiml.say(message, { voice: "alice", language: langCodeMap(languageCode) });
    } else {
      twiml.say({
        "en": "Invalid choice. Goodbye!",
        "hi": "Galat vikalp. Alvida!",
        "te": "Thappu vikalamu. Vidhaayaka!",
        "mr": "Chukicha paryay. Alvida!"
      }[languageCode], { voice: "alice", language: langCodeMap(languageCode) });
    }

    res.type("text/xml");
    res.send(twiml.toString());
  }
}

// ---------------------- Soil Choice Function ----------------------
function soilChoiceHandler(languageCode) {
  return (req, res) => {
    const twiml = new VoiceResponse();
    const digit = parseInt(req.body.Digits);

    if(digit >= 1 && digit <= topCrops.length) {
      const crop = topCrops[digit-1];
      let message = {
        "en": `The suitable soil for ${crop} is ${soilTypes[crop]}.`,
        "hi": `${crop} ke liye upyukt mitti ${soilTypes[crop]} hai.`,
        "te": `${crop} kosam upayukta mati ${soilTypes[crop]}.`,
        "mr": `${crop} sathi yogya mati ${soilTypes[crop]} aahe.`
      }[languageCode];

      twiml.say(message, { voice: "alice", language: langCodeMap(languageCode) });
    } else {
      twiml.say({
        "en": "Invalid choice. Goodbye!",
        "hi": "Galat vikalp. Alvida!",
        "te": "Thappu vikalamu. Vidhaayaka!",
        "mr": "Chukicha paryay. Alvida!"
      }[languageCode], { voice: "alice", language: langCodeMap(languageCode) });
    }

    res.type("text/xml");
    res.send(twiml.toString());
  }
}

// ---------------------- Routes ----------------------
// English
app.post("/english-main", mainMenu("en"));
app.post("/english-weather", weatherHandler("en"));
app.post("/english-crop-choice", cropChoiceHandler("en"));
app.post("/english-soil-choice", soilChoiceHandler("en"));

// Hindi
app.post("/hindi-main", mainMenu("hi"));
app.post("/hindi-weather", weatherHandler("hi"));
app.post("/hindi-crop-choice", cropChoiceHandler("hi"));
app.post("/hindi-soil-choice", soilChoiceHandler("hi"));

// Telugu
app.post("/telugu-main", mainMenu("te"));
app.post("/telugu-weather", weatherHandler("te"));
app.post("/telugu-crop-choice", cropChoiceHandler("te"));
app.post("/telugu-soil-choice", soilChoiceHandler("te"));

// Marathi
app.post("/marathi-main", mainMenu("mr"));
app.post("/marathi-weather", weatherHandler("mr"));
app.post("/marathi-crop-choice", cropChoiceHandler("mr"));
app.post("/marathi-soil-choice", soilChoiceHandler("mr"));

// ---------------------- Start Server ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
