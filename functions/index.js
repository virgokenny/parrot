const request = require('request');
const functions = require('firebase-functions');

const coursesMap = new Map([
  [2001, 'Whats Your Favorite Dessert'],
  [2002, 'Traveling To New Places'],
  [2003, 'Taking A Walk'],
  [2004, 'Video Games'],
  [2005, 'Lets Talk About TV Shows'],
  [2006, 'Making Friends'],
  [2007, 'What Do You Eat For Breakfast'],
  [2008, 'Talking About The Weather'],
  [2009, 'Lets Go Grab A Drink'],
  [2010, 'Smartphones'],
]);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });

exports.completeCourses = functions.firestore
  .document('completeCourses/{docId}')
  .onCreate((snap, context) => {
    const courseId = snap.data()['courseId'];
    const userName = snap.data()['userName'];

    const message =
      userName +
      ' has completed a new audio recorded in course "' +
      coursesMap.get(courseId) +
      '"';

    const postData = {
      body: message,
      data: {},
      title: 'New Complete Course',
      to: [
        'ExponentPushToken[hBrGnAEl4_LHC4ojk8opXG]', // Kenny
        'ExponentPushToken[b3pcTpIvwk3fV-ukkKWopp]', // Michelle
        'ExponentPushToken[I7i7nOGaKmm3eT4nAgzTdc]', // Shaquille
      ],
    };

    const options = {
      url: 'https://exp.host/--/api/v2/push/send',
      json: true,
      body: postData,
    };

    request.post(options, (err, res, body) => {
      if (err) {
        return console.log(err);
      }
      console.log(`Status: ${res.statusCode}`);
      console.log(body);
      return true;
    });

    return true;
  });
