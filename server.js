var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const fs = require('fs');
let mysql = require('mysql');
let md5= require("md5");
let ejs= require("ejs");
var multer  = require('multer');
var upload = multer({ dest: 'images/' })


let myPass= fs.readFileSync("./pass.txt","utf-8");

let connection1 = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : myPass,
    database : 'finito_db'
  });



app.use( bodyParser.json() ); 
app.use(bodyParser.urlencoded({     
        extended: true
      })); 
      

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});
app.use(express.static(__dirname+"/public"));
app.use(express.static(__dirname+"/images"));

app.get("/",function(req,res)
{
    //let results= fs.readFileSync("./public/home.html",{encoding:"utf-8"})
    res.sendFile(__dirname+"/public/home.html");
})

app.post("/signup",function(req,res)
{
    let username= req.body.txt_user;
    let password= req.body.txt_password;
    let foundUser=false;
    connection1.query("Select username from users", function(error, results, fields) {
        if (error) throw error;
        console.log(results);
        results.forEach((val)=>{
            if(val.username===username)
            {

                res.end("user Exists");
                foundUser=true;
                return;
            }
        })
        if(!foundUser)
        {
        connection1.query(`Insert into users (username,password) values ('${username}','${md5(password)}')`,function(error, results, fields){
            if (error) throw error;
            ejs.renderFile(__dirname+"/public/signup.ejs", {username:username}, function(e, dt) {
                // Send the compiled HTML as the response
                res.send(dt);
              });
            
        })
    }
      });
})

app.post("/addinfo",upload.single('fl_image'), function (req, res, next) {
    // req.file is the `fl_image` file
    // req.body will hold the text fields, if there were any
    let username= req.body.txt_user;
    let text= req.body.txt_text;
    let file= req.file;
    let fileOrArray= req.file.originalname.split(".");
    let fileUrl= "./"+req.file.filename;
    let textUrl= `./texts/${username}.txt`;
    fs.writeFileSync(textUrl,text,function(){});
    connection1.query(`Insert into userinfo (username,imageurl,texturl) values ('${username}','${fileUrl}','${textUrl}')`,function(error, results, fields){
        if (error) throw error;
        res.sendFile(__dirname+"/public/home.html");
    })
  })
app.post("/task",function(req,res){
    let tasktitle = req.body.tasktitle; 
    let tasknote = req.body.tasknote; 
    let taskstart = req.body.taskstart; 
    let taskend = req.body.taskend; 
    let resistance = req.body.resistance; 
    let priority = req.body.priority; 
    let isfixed = req.body.isfixed; 
    connection1.query(`Insert into tasks (title,notes,start,end,resistance,priority,isfixed) values ('${tasktitle}','${tasknote}','${taskstart}','${taskend}',${resistance},${priority},${isfixed})`,function(error, results, fields){
        if (error) throw error;
        ejs.renderFile(__dirname+"/public/tasks.ejs", {ejsObj:JSON.stringify(results)}, function(e, dt) {
            // Send the compiled HTML as the response
            res.send(dt);
          });
    })
});
app.get("/signin",function(req,res){
    console.log("signin");
    let username= req.query.txt_user;
    let password= req.query.txt_password;
    if(username==="admin" && password === "admin")
    {
        connection1.query("Select * from userinfo", function(error, results, fields) {
            console.log(results);
            results.forEach((val)=>{
                val.text=fs.readFileSync(val.texturl,"utf-8",function(){});
                val.texturl=null;
            })
            ejs.renderFile(__dirname+"/public/admin.ejs", {ejsObj:JSON.stringify(results)}, function(e, dt) {
                // Send the compiled HTML as the response
                res.send(dt);
              });
        })
        return;
    }
    else
    {
        let foundUser=false;
    connection1.query("Select username from users", function(error, results, fields) {
        if (error) throw error;
        results.forEach((val)=>{
            if(val.username===username)
            {
                console.log("hello");
                foundUser=true;
                connection1.query(`Select * from userinfo where username='${username}'`, function(error, results1, fields) {
                    console.log(results1);
                    let imageurl=results1[0].imageurl;
                    let texturl=results1[0].texturl;
                    let sentText= fs.readFileSync(texturl,'utf-8',function(){});
                    
                    ejs.renderFile(__dirname+"/public/signin.ejs", {username:username,text:sentText,imageurl:imageurl}, function(e, dt) {
                        // Send the compiled HTML as the response
                        res.send(dt);
                      });
                    
                    return;
                })
            }
            
        })
        if(!foundUser)
        {
            res.end("user does not exist");
        }
      });
    }
    
})


var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("listening on 8081");
 })