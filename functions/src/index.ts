import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Guid } from 'guid-typescript'

admin.initializeApp();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

// e.g. ?question=[[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,2,7],[4,0,0,6,0,8,0,0,0],[0,7,1,0,0,3,3,0,0],[2,3,8,5,0,6,4,1,9],[9,6,4,1,0,0,7,5,0],[3,9,5,0,2,7,8,0,0],[1,8,2,0,6,0,9,7,4],[0,4,6,8,1,9,2,0,5]]&answer=[[6,1,9,7,3,2,5,4,8],[8,5,3,9,4,1,6,2,7],[4,2,7,6,5,8,1,9,3],[5,7,1,2,9,4,3,8,6],[2,3,8,5,7,6,4,1,9],[9,6,4,1,8,3,7,5,2],[3,9,5,4,2,7,8,6,1],[1,8,2,3,6,5,9,7,4],[7,4,6,8,1,9,2,3,5]]
export const register = functions.https.onRequest((request, response) => {
    const question = request.query.question as number[][];
    const answer = request.query.answer as number[][];

    console.log('called register');

    const errors = validate_register(answer, question)
    console.log(`errors is ${errors}`);

    if (errors.length > 0) {
        response.status(400).send(errors.reduce((p, c) => `${p}\n${c}`))
    } else {
        const uuid = Guid.create();
        const ref  = admin.database().ref(`/question/${uuid}`);
        ref.set({
            "answer": answer,
            "question": question,
        }).catch();

        response.send(`Accepted! Your Question id is ${uuid}`);
    }
});

function validate_register(answer: number[][], question: number[][]): string[] {
    const errors: string[] = []

    if (answer   === undefined) errors.push('answer is null')
    if (question === undefined) errors.push('question is null')

    if (errors.length > 0) return errors

    // 9x9 ?
    if (answer  .length !== 9 || answer  .some(x => x.length !== 9)) errors.push('answer is not 9x9')
    if (question.length !== 9 || question.some(x => x.length !== 9)) errors.push('question is not 9x9')

    // number between 0 and 9? (0 is question placeholder)
    if (! answer  .every(array => array.every(x => 1 <= x && x <= 9))) errors.push('answer must has only 1-9 number')
    if (! question.every(array => array.every(x => 0 <= x && x <= 9))) errors.push('question must has only 0-9 number')

    if (errors.length > 0) return errors

    // answer[i][j] === question[i][j]?
    for (const i in [0,1,2,3,4,5,6,7,8]) {
        for (const j in [1,2,3,4,5,6,7,8]) {
            if (question[i][j] !== 0 && question[i][j] === answer[i][j]) {
                errors.push(`answer[${i}][${j}] != question[${i}][${j}]`)
            }
        }
    }

    const numpre_errors = validate_numpre(answer)

    return errors.concat(numpre_errors)
}

function validate_numpre(numpre: number[][]): string[] {
    let errors: string[] = []

    // <->
    numpre.forEach((array, idx) => {
        const blcok_errors = find_not_contains_number(array).map(x => `numpre[${idx}][] hasn't ${x}`)
        errors = errors.concat(blcok_errors)
    })

    // ↑↓
    const numpre_dash = numpre.map((_, idx) => numpre.map(array => array[idx]))
    numpre_dash.forEach((array, idx) => {
        const blcok_errors = find_not_contains_number(array).map(x => `numpre[][${idx}] hasn't ${x}`)
        errors = errors.concat(blcok_errors)
    })

    // |-|
    const numpre_block = [[],[],[],[],[],[],[],[],[]]
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const block_idx = get_block_idx(i, j)
            numpre[block_idx].push(numpre[i][j])
        }
    }
    numpre_block.forEach((array, idx) => {
        const blcok_errors = find_not_contains_number(array).map(x => `block[${idx}] hasn't ${x}`)
        errors = errors.concat(blcok_errors)
    }) 
    return errors
}

function find_not_contains_number(block: number[]): number[] {
    const not_contains_number: number[] = []

    for (let x = 1; x <= 9; x++) {
        if (! block.some(elem => x === elem)) not_contains_number.push(x)
    }

    return not_contains_number
}

function get_block_idx(i: number, j: number): number {
    return Math.floor(i / 3) * 3 + Math.floor(j) 
}