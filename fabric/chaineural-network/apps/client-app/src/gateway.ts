'use strict';
var cors = require('cors');
var express = require('express');
var bodyParser = require('body-parser')
const app = express()
const port = 3000;
const org = process.env.ORG as string;
console.log(org);
import * as invokes from './invoke';

app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.post('/api/init-minibatch/:epochName/:minibatchNumber/:workerName', async (req, res) => {
  res.send(await invokes.initMinibatch(req.params.epochName, req.params.minibatchNumber, req.params.workerName));
});
app.post('/api/finish-minibatch/:epochName/:minibatchNumber/:learningTime/:loss', async (req, res) => {
  res.send(await invokes.finishMinibatch(req.params.epochName, req.params.minibatchNumber, req.params.learningTime, req.params.loss));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));