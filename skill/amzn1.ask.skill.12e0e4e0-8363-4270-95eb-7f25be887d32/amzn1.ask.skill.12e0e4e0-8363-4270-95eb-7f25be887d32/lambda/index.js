/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');           //eason-13-add  add dependency

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';	//eason-28 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
    },
    handle(handlerInput) {
        const speakOutput = 'Hello, Welcome to Annual Dinner. What is your birthday?';//eason-04-01 greeting words ⬇️ 
                                                                //That was a piece of cake! Bye! ' ; 'Welcome, you can say Hello or Help. Which would you like to try?';
        const repromptText = 'I was born Nov. 6th, 2014. When were you born?' ;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)                              //eason-05-02 uncomment/comment to exit after speaking with/without need to listen for user's response ; if uncommented , give a example that Alexa expects user to say in provided and specified format .
            .getResponse();                                     //eason-03 ?? Callback interacting with ASK ??
    }
};

const HasBirthdayLaunchRequestHandler = {                       //eason-23-add canHandle check user's birth is saved on S3;handle notify func to SDK
    canHandle(handlerInput) {
        console.log(JSON.stringify(handlerInput.requestEnvelope.request));      //eason-56add log along with v2
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {} ;
        
        const year = sessionAttributes.hasOwnProperty('year')?sessionAttributes.year : 0;
        const month = sessionAttributes.hasOwnProperty('month')?sessionAttributes.month : 0;
        const day = sessionAttributes.hasOwnProperty('day')?sessionAttributes.day : 0;
        
        return	handlerInput.requestEnvelope.request.type === 'LaunchRequest'		//eason-29 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
                && year
                && month
                && day ;
    },
    async handle(handlerInput) {                                                        //eason-47add async character
        const serviceClientFactory = handlerInput.serviceClientFactory;                  //eason-44add serviceClient Factory
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId ;  //eason-42add request deviceId

        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {} ;
        
        const year = sessionAttributes.hasOwnProperty('year')?sessionAttributes.year : 0;
        const month = sessionAttributes.hasOwnProperty('month')?sessionAttributes.month : 0;
        const day = sessionAttributes.hasOwnProperty('day')?sessionAttributes.day : 0;
        
        let userTimeZone;                                                               //eason-45add-46add get TimeZone and handle exception
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        } catch (error) {
            if(error.name !== 'ServiceError' ) {
                return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
            }
            console.log('error',error.message);
        }

        console.log('userTimeZone',userTimeZone);                                       //eason-57add for log userTimeZone

        //TODO:: Use setting API to get current date and then compute how many days until user's birthday
        //TODO:: Say Happy birthday to the user's birthday 
        
        //getting the current date with the time
        const currentDateTime = new Date(new Date().toLocaleString("en-US",{timeZone:userTimeZone}));   //eason-48add get correct date

        //removing the time from the date because it affects our difference calculation
        const currentDate = new Date(currentDateTime.getFullYear(),currentDateTime.getMonth(),currentDateTime.getDate());
        let currentYear = currentDate.getFullYear();                //eason-58alter from const to let ↓↓
                                                                        //eason-49add-50add extract Y/M/D, recreate date without S

        console.log('currentDateTime:', currentDateTime);              //eason-59add-60add for log currentDateTime and currentDate
        console.log('currentDate:', currentDate);

        //getting the next birthday
        let nextBirthday = Date.parse(`${month} ${day}, ${currentYear}`);       //eason-51add-52add determine user's next birthday
        //adjust the nextBirthday by one year if the current date is after their birthday
        if( currentDate.getTime() > nextBirthday ) {
            nextBirthday = Date.parse(`${month} ${day}, ${currentYear + 1}`);
            currentYear++;                                              //eason-61 for v2
        }

        //const speakOutput = `Welcome back. It looks like there are X more days until your y-th birthday`; 
        const oneDay = 24*60*60*1000;                                           //eason-53replace this with belowing
        //setting the default speakOutput to Happy xth Birthday!
        //Don't worry about when to use st, th , rd --Alexa will automatically correct the ordinal for you.
        let speakOutput = `Happy ${currentYear - year}th birthday `; 
        if(currentDate.getTime() !== nextBirthday ) {
            const diffDays = Math.round(Math.abs((currentDate.getTime() - nextBirthday)/oneDay));
            speakOutput = `Welcome back. It looks like there are ${diffDays} days until your ${currentYear - year}th birthday`;
        }

        return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
    }
};

const CaptureBirthdayIntentHandler = {           //eason-06 alter from HelloWorld to CaptureBirthday
    canHandle(handlerInput) {
        return  handlerInput.requestEnvelope.request.type === 'IntentRequest'		//eason-30 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureBirthdayIntent'; 
    },								//eason-31alter-07alter from Alexa.getIntentName(handlerInput.requestEnvelope) & from HelloWorld to CaptureBirthday
    async handle(handlerInput) {                                                                //eason-15-add async attribute
        const year = handlerInput.requestEnvelope.request.intent.slots.year.value ;                  //eason-08-09-10
        const month = handlerInput.requestEnvelope.request.intent.slots.month.value ;
        const day = handlerInput.requestEnvelope.request.intent.slots.day.value ;
        
        //"ask-sdk-s3-persistence-adapter":"^2.0.0"                                           //eason-16-add dependency declaration::::tutorial error
        const attributesManager = handlerInput.attributesManager;                               //eason-17-add attributesManager
        let birthdayAttributes = {                                                            //eason-27alter-18add from const &construct birthdayAttributes
          "year":year,
          "month":month,
          "day":day
        };
        
        attributesManager.setPersistentAttributes(birthdayAttributes);                          //eason-19-add value set to attributesManager
        
        await attributesManager.savePersistentAttributes();                                    //eason-20-add wait for setting user information to S3
        
        const speakOutput = `Thanks, I'll remember that you were born ${month} ${day} ${year}.`;    //eason-11 alter from 'Hello World!';                                         

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'			//eason-32 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';//eason-33 alter from Alexa.getIntentName(handlerInput.requestEnvelope)
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'			//eason-34 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
            &&( handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' //eason-35-36 alter from Alexa.getIntentName(handlerInput.requestEnvelope)
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
/*																						//eason-37-del obsolete
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
*/
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';		//eason-38 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';			//eason-39 alter from Alexa.getRequestType(handlerInput.requestEnvelope)
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);									//eason-40 alter from JSON.stringfy(error)
        const speakOutput = 'Sorry, I could not understand what you asked. Please try again.';	//eason-41 calibrate confusing grammer against git tutorial

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const LoadBirthdayInterceptor = {                                                       //eason-21-add construct an interceptor to consolidate
    async process(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {} ;
        
        const year= sessionAttributes.hasOwnProperty('year')?sessionAttributes.year:0;
        const month= sessionAttributes.hasOwnProperty('month')?sessionAttributes.month:0;
        const day= sessionAttributes.hasOwnProperty('day')?sessionAttributes.day:0;
        
        if(year&&month&&day) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
};

/**
 * The SkillBuilder acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    // .withApiClient( new Alexa.DefaultApiClient() )                              //eason-54del-43add add ApiClient object
    .withPersistenceAdapter(                                                     //eason-14-add notify that persistenceAdapter exist
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .addRequestHandlers(
        HasBirthdayLaunchRequestHandler,                                        //eason-24-add callback chain
        LaunchRequestHandler,
        CaptureBirthdayIntentHandler,                                           //eason-12 alter from HelloWorld to CaptureBirthday
        HelpIntentHandler,
        CancelAndStopIntentHandler,
//         FallbackIntentHandler,                                                  //eason-25 obsolete
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addRequestInterceptors(                                                    //eason-22 register an interceptor to the SDK   
        LoadBirthdayInterceptor
    )
    .addErrorHandlers(
        ErrorHandler)
//     .withCustomUserAgent('sample/hello-world/v1.2')                             //eason-26 obsolete
    .withApiClient( new Alexa.DefaultApiClient() )                              //eason-55add move here for "add ApiClient object"
    .lambda();
