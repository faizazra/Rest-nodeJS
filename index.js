var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var app = express();
const jsonwebtoken = require("jsonwebtoken");

app.use(bodyParser.json());

const JWT_SECRET = "Faiz_$3Cr3tKeY";


function validateToken(req, res, next) { //Token Validator

  const token = req.headers["authorization"];
  let _msg = null;
  let _code = null;
  try {
    if (token == null) {
      _msg = "No Token";
      _code = 401;
    } else {
      jsonwebtoken.verify(token, JWT_SECRET, (err, name) => {
        if (err) {
          _msg = "Token invalid";
          _code = 401;
        } else {
          _msg = name;
          _code = 200;
        }
      });
    }
  } catch (err) {
    console.log("catch error :", err);
    _code = 500;
    _msg = err;
  }

  result = {
    code: _code,
    msg: _msg,
  };
  console.log("check validate:",result);
  return result;
} 


//#region Routes

app.post("/login",function (req,res) { //Login Routes
   let _name = req.body.name;
   let apiKey = req.body.apiKey;

   let correctName = "John Doe";
   let correctApiKey = "qW1hrT";
    
 console.log("name : "+_name+", api key : "+apiKey+"");
   if (correctName == _name) {
      console.log("name corect")
      if(correctApiKey = apiKey){
         
      console.log("pass corect")
         return res.json({
            token: jsonwebtoken.sign({ user: "normalUser", name : _name }, JWT_SECRET), //generate token with secret key
         });
      }
   }else{
      return res
      .status(401)
      .json({ message: "The name and apiKey wrong" });
      
  };
})

app.get("/dashboard", function (req, res, next) { 
  //get Dashboard

  var check = validateToken(req); //token validate
  if (check.code == 200) {
    var data = {
      tasksCompleted: checkCompleteTask(),
      totalTasks: checkTotalTask(),
      latestTasks: dataCache(),
    };

    console.log("return", data);
    res.json(data);
  } else {
    res.status(check.code).json(check.msg);
  }
});

app.get("/tasks", function (req, res) { 
  //get list
  var check = validateToken(req); //token validate
  if (check.code == 200) {
    var data = dataCache();

    console.log("return", data);
    res.json(data);
  } else {
    res.status(check.code).json(check.msg);
  }
});

app.delete("/tasks/:iD", function (req, res) {
  //delete
  var check = validateToken(req);
  if (check.code == 200) {
    let data = {};
    let taskId = req.params.iD;

    var localData = findTask(taskId);
    console.log("LocalData : ", localData);
    var result = deleteTask(taskId);

    if (result) {
      data = { msg: "Delete Task : " + localData.name + " not Success!" };
      res.status(400);
    } else {
      data = localData;
      res.status(200);
    }

    res.json(data);
  } else {
    res.status(check.code).json(check.msg);
  }
});

app.post("/tasks", function (req, res) {
  //Add
  var check = validateToken(req);
  if (check.code == 200) {
    let data = {};
    console.log("Body : ", req.body);
    let taskName = req.body.name;
    var result = addTask(req.body);

    console.log("result : ", result);

    if (result) {
      data = { msg: "Add Task : " + taskName + " not Success!" };
      res.status(400);
    } else {
      data = { msg: "Add Task : " + taskName + " Success!" };
      res.status(200);
    }
    res.json(data);
  } else {
    res.status(check.code).json(check.msg);
  }
});

app.put("/tasks", function (req, res) {
  //edit
  var check = validateToken(req);
  if (check.code == 200) {
    let data = {};
    console.log("Body : ", req.body);
    let taskName = req.body.name;
    var result = editTask(req.body);

    console.log("result : ", result);

    if (result) {
      data = { msg: "Updated Task : " + taskName + " is Success!" };
      res.status(200);
    } else {
      data = { msg: "Updated Task : " + taskName + " not Success!" };
      res.status(400);
    }
    res.json(data);
  } else {
    res.status(check.code).json(check.msg);
  }
});

//#endregion



function uuid() { //ID generator
   function S4() {
     return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
   }
   return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 }

function dataCache() { //pullinig data from task.json
   
   let rawdata = fs.readFileSync('tasks.json');
   var datalist = JSON.parse(rawdata);
   return datalist;

}

function updateDataCache(newCahce) //update tasks.json
{
   console.log("newCahce :",newCahce)
   let data = JSON.stringify(newCahce);
   fs.writeFileSync('tasks.json', data);

}

function findTask(_taskId) 
{
   let data = dataCache();
   var found = null ;
   data.forEach(function (item) {    
    if(item.iD = _taskId)
    {
      found = item;
    }
    });
    return found;

}
function checkCompleteTask() //count completed task
{
   let count = 0
  let data = dataCache();
  data.forEach(function (item) {  
   if(item.completed == true)
   { count++ }
  })

  return count;

}
function checkTotalTask() //count total task
{
   let count = 0
  let data = dataCache();
  return data.length;

}

function addTask(task)
{
   let cacheTask = [];
   let data = dataCache();
   console.log("addTask After Datacache",data);
   var found = null ;

   data.forEach(function (item) {    
    if(task.name == item.name)
    {
      "found YESS!";
      found = item;
    }
    });

    if(found != null)
    {
      console.log ("found Task",found);
      return null;
    }else{
      console.log ("add Task");
      var newTask = {
         id : uuid(),
         name : task.name,
         completed : task.completed
      }

      cacheTask.push(newTask)
      var oldData = dataCache();
      oldData.forEach(function (item) { 
         cacheTask.push(item);
      });
    }
    
    updateDataCache(cacheTask)
    return found;
}

function editTask(task)
{
   let cacheTask = [];
   let data = dataCache();
   var found = null ;
   var updateNameTask = task.name ?? null;
   var updateCompletedTask = task.completed ?? null;

   data.forEach(function (item) {    
    if(task.name == item.name)
    {
      "found YESS!";
      if(updateNameTask!=null)
      { item.name = updateNameTask }
      if(updateCompletedTask!=null)
      { item.name = updateCompletedTask}
      found = true;
    }

    cacheTask.push(item)

    });
    
    updateDataCache(cacheTask)
    return found;
}

function deleteTask(_taskId)
{
  let cacheTask = [];
  let data = dataCache();
  let hasDeleted =false;
  data.forEach(function (item) {    
   if(_taskId == item.id)
   {
      console.log("HAS DELETED !!!!! : _taskid : "+_taskId,item)
      hasDeleted = true;
   }else{
      cacheTask.push(item);
   }
   });
    updateDataCache(cacheTask);
    return hasDeleted;
}



var server = app.listen(3000, function () {
  dataCache();
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://localhost", host, port);
});

