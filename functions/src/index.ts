import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Guid } from 'guid-typescript'

admin.initializeApp();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

export const register = functions.https.onRequest((request, response) => {
    const question = request.query.question;
    const answer = request.query.answer;
    // FIXME: check question, answer

    const uuid = Guid.create();
    const ref  = admin.database().ref(`/question/${uuid}`);
    ref.set({
        "answer": answer,
        "question": question,
    }).catch();

    response.send(`Accepted! Your Question id is ${uuid}`);
});
