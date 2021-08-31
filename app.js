require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();
var axios = require('axios').default;
const mongoose = require("mongoose");
var users = [];
const challenge = 1;
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/leaderDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const memberSchema = new mongoose.Schema({
  username: String, // codechef username
  L_Score: Number, //leaderboard score
  L_rank: Number, // leaderboard rank
  division: Number,
  //old_data: memberSchema
});
const Members = mongoose.model("Member", memberSchema);

var options = {
  method: 'POST',
  url: 'https://api.codechef.com/oauth/token',
  headers: {
    'content-type': 'application/json'
  },
  data: {
    grant_type: 'client_credentials',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scope: 'public',
    redirect_uri: 'http://127.0.0.1:3000/result'
  }
};
app.post("/", function(req, res) {
  const contestCode = req.body.contestCode;
  //const offset = req.body.offset;
  console.log(contestCode);
  const cn = req.body.contestNumber;
  const url = "https://api.codechef.com/rankings/" + contestCode + "?fields=username,totalScore&institution=Mugneeram%20Bangur%20Memorial%20Engineering%20College%2C%20Jodhpur";
  //  'https://api.codechef.com/rankings/LTIME99C?fields=username,totalScore&institution=Mugneeram%20Bangur%20Memorial%20Engineering%20College%2C%20Jodhpur',


  axios.request(options).then(function(response) {
    console.log(response.data.result.data.access_token);
    access_token = response.data.result.data.access_token;
    axios.request({
      method: 'GET',
      url: 'https://api.codechef.com/rankings/DEC20B?fields=username,totalScore&institution=Mugneeram%20Bangur%20Memorial%20Engineering%20College%2C%20Jodhpur',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + access_token
      }
    }).then(function(result) {
      console.log(result.data.result.data.content);
      users = result.data.result.data.content;
      users.forEach(function(user) {
        Members.findOne({
          username: user.username
        }, function(err, resu) {
          if (err)
            console.log(err);
          else {
            if (resu) {
              //console.log(parseInt(user.totalScore));
              resu.L_Score = parseInt(user.totalScore);
              resu.L_rank = parseInt(user.rank);
              resu.division = 5;
              resu.save(function(err) {});
              //console.log(resu);

            } else {
              const newItem = new Members({
                username: user.username,
                L_Score: parseInt(user.totalScore),
                L_rank: parseInt(user.rank),
                division: 3

              });
              newItem.save();

            }
          }
        });
      });

    }).catch(function(error) {
      console.error(error);
    });
  }).catch(function(error) {
    console.error(error);

  });
  res.redirect("/");
});

app.get("/admin_only", function(req, res) {
  res.render("admin_only");
});


app.get("/", function(req, res) {
  Members.find({}, function(err, found) {
    if (err)
      console.log(err);
    else {
      if (found) {
        res.render("index", {data: found});
      }
      else{
        console.log("Wron =g found");
      }
    }

  });

});

app.listen(3000, function(req, res) {
  console.log("server started at port 3000");
});
