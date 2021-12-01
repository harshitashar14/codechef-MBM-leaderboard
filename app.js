require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();
var axios = require('axios').default;

const path = require('path');
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post("/", function(req, res) {
 const output = await executeCpp(req);
 return res.join({output});
}

function executeCpp(req){
  const jobId = path.basename(req.p).split(".")[0];
  const outPath = path.join(req.outputpath,`${jobId}.out`);
  return new Promise((resolve, reject) => {
    exec(`g++ ${req.p} -o &{outPath} && cd ${req.outputpath} && ./${jobId}.out`, (error, stdout, stderr) =>{
      if(err)
      reject({error,stderr});

      if(stderr)
      reject({stderr});

      resolve(stdout);
    });
  });
}

app.listen(3000, function(req, res) {
  console.log("server started at port 3000");
});
