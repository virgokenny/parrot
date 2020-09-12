const request = require('request');
const functions = require('firebase-functions');
const { google } = require('googleapis');

// Get Firestore
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

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

const testData = {
  uid: 'fhfbSFY7JxScojmzJccMUcqOXEd2',
  courseId: 2010,
  userName: '周世剛',
  data: {
    recordFeedback: {
      student: [
        {
          question: 1,
          uri:
            'https://firebasestorage.googleapis.com/v0/b/english-bama.appspot.com/o/users%2FIvPIePiByfWXIhFGwzruJJCFg8d2%2Fcourses%2F2004%2F1.m4a?alt=media&token=5735ba4a-3608-41ea-9970-6502adb31ad3',
        },
        {
          question: 2,
          uri:
            'https://firebasestorage.googleapis.com/v0/b/english-bama.appspot.com/o/users%2FIvPIePiByfWXIhFGwzruJJCFg8d2%2Fcourses%2F2004%2F1.m4a?alt=media&token=5735ba4a-3608-41ea-9970-6502adb31ad3',
        },
        {
          question: 3,
          uri:
            'https://firebasestorage.googleapis.com/v0/b/english-bama.appspot.com/o/users%2FIvPIePiByfWXIhFGwzruJJCFg8d2%2Fcourses%2F2004%2F1.m4a?alt=media&token=5735ba4a-3608-41ea-9970-6502adb31ad3',
        },
      ],
    },
  },
};

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true });
//   response.send('Hello from Firebase!');
// });

const callGoogleAppScriptFunction = (uData, cData) => {
  const postData = {
    uid: cData['uid'],
    courseId: cData['courseId'].toString(),
    userEmail: uData['email'],
    audios: JSON.stringify(cData['data']['recordFeedback']['student']),
    courseName: coursesMap.get(cData['courseId']),
  };

  const options = {
    url:
      'https://script.google.com/macros/s/AKfycbyH8l6Wffz97kAC8FHAXNwnF3xzvdx9PEYfcV3UQQODS-UgefM/exec',
    followAllRedirects: true,
    method: 'POST',
    form: postData,
  };

  console.log(postData);

  return request.post(options, (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    console.log(`Status: ${res.statusCode}`);
    console.log(body);
    return true;
  });
};

const userData = (uid) => {
  const snapshot = db.collection('users').doc(uid);
  return snapshot.get().then((doc) => {
    return doc.data();
  });
};

const pushNotification = (title, message) => {
  const postData = {
    body: message,
    data: {},
    title: title,
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

  return request.post(options, (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    console.log(`Status: ${res.statusCode}`);
    console.log(body);
    return true;
  });
};

exports.completeCourses = functions.firestore
  .document('completeCourses/{docId}')
  .onCreate((snap, context) => {
    const cData = snap.data();
    //const cData = testData;
    const courseId = cData['courseId'];
    const userName = cData['userName'];
    const uid = cData['uid'];

    userData(uid)
      .then((uData) => {
        console.log(uData);
        return callGoogleAppScriptFunction(uData, cData);
      })
      .catch(() => console.log('No User Data'));

    const message =
      userName +
      ' has completed a new audio recorded in course "' +
      coursesMap.get(courseId) +
      '"';

    return pushNotification('New Completed Course', message);
  });

exports.finalCheck = functions.firestore
  .document('completeCourses/{docId}')
  .onUpdate((change, context) => {
    const newStatus = change.after.data()['status'];
    const previousStatus = change.before.data()['status'];

    if (
      (previousStatus === 'progress' || previousStatus === 'new') &&
      newStatus === 'final_check'
    ) {
      const courseId = change.after.data()['courseId'];
      const userName = change.after.data()['userName'];
      const message =
        'Please check the course "' +
        coursesMap.get(courseId) +
        '" is own by ' +
        userName;

      return pushNotification('Final Check', message);
    }

    return false;
  });
