const express = require('express');
const app = express();
const PORT = 3000;
const fs = require('fs');

app.use(express.static('static'));
app.use('/build', express.static('build'));
app.use('/dist', express.static('dist'));

app.get('/hourDatumBundle', (req, res) => {
    const json = fs.readFileSync('./shared/backend/json-file-db/hourDatumBundle.json', {encoding: 'utf8'});
    res.send(json);
});

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));