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
  //L_rank: Number, // leaderboard rank
  division: Number,
  rating:Number,
  problem_solved: Number,
  //old_rank: Number,
  old_score:Number,
  old_problems: Number
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
  const div = req.body.division;
  console.log(contestCode);
  const cn = req.body.contestNumber;
  const url = "https://api.codechef.com/rankings/" + contestCode + "?fields=username,totalScore,rating,problemScore&institution=Mugneeram%20Bangur%20Memorial%20Engineering%20College%2C%20Jodhpur";
  //  'https://api.codechef.com/rankings/LTIME99C?fields=username,totalScore&institution=Mugneeram%20Bangur%20Memorial%20Engineering%20College%2C%20Jodhpur',
  const weightage = [[15,30,30,25],[25,20,20,35]];

  axios.request(options).then(function(response) {
    console.log(response.data.result.data.access_token);
    access_token = response.data.result.data.access_token;
    axios.request({
      method: 'GET',
      url: url,
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + access_token
      }
    }).then(function(result) {
      //console.log(result.data.result.data.content);
      users = result.data.result.data.content;
      var cnt=1;
      var rank= users[0].rank;
      var top_score= parseInt(users[0].totalScore);
      var total_st= users.length;
      users.forEach(function(user){
         if(user.rank == rank)user.rank= cnt;
         else
         {
           cnt++;
           rank= user.rank;
           user.rank=cnt;
         }
         user['problem_solved']= Math.floor(parseInt(user.totalScore/100));
         user.totalScore = Math.round((parseInt(user.totalScore )* weightage[div-2][cn-1])/(top_score* Math.pow(user.rank,(1.0 / total_st)))*100);

      });



      users.forEach(function(user) {
        Members.findOne({
          username: user.username
        }, function(err, resu) {
          if (err)
            console.log(err);
          else {
            if (resu) {
              //console.log(parseInt(user.totalScore));
              if(cn!=1)
              {
               resu.old_score= resu.L_Score;
               resu.old_problems= resu.problem_solved;
               resu.L_Score += user.totalScore;
               resu.problem_solved += user.problem_solved;
             }
             else
             {
               resu.old_score= 0;
               resu.old_problems= 0;
               resu.L_Score= user.totalScore;
               resu.problem_solved = user.problem_solved;
             }
              //resu.L_rank = user.rank;
              resu.division = div;
              resu.rating = user.rating;

              resu.save(function(err) {});
              //console.log(resu);

            } else {

                const newItem = new Members({
                username: user.username,
                L_Score: user.totalScore,
                old_score: 0,
                old_problems: 0,
                //L_rank: user.rank,
                rating: user.rating,
                division: div,
                problem_solved:  user.problem_solved

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
  Members.find({division:3}).sort({L_Score:-1}).exec (function(err, found) {
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
