const path = require('path');
const express = require('express');
const app = express();

app.use('/build', express.static(__dirname + '/build'));
app.get('/', (req, res) =>
    res.status(200).sendFile(path.join(__dirname, './index.html')));
app.listen(process.env.PORT || 8080);
