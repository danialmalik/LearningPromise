const LearningPromise = require('./LearningPromise');


const fs = require('fs');
const path = require('path');

const readFile = (filename, encoding) => new LearningPromise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, value) => {
        if (err) {
            return reject(err);
        }
        resolve(value);
    })
});

const delay = (timeInMs, value) => new LearningPromise(resolve => {
    setTimeout(() => {
        resolve(value);
    }, timeInMs);
});

readFile(path.join(__dirname, 'indexxxx.js'), 'utf8')
    .then(text => {
        console.log(`${text.length} characters read`);
        return delay(2000, text.replace(/[aeiou]/g, ''));
    })
    .then(newText => {
        console.log(newText.slice(0, 200));
    })
    .catch(err => {
        console.error('An error occured!');
        console.error(err);
    })
    .finally(() => {
        console.log('--- All done! ---');
    });
