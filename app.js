const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
const dbPath = path.join(__dirname, "userData.db");

let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error ${e.message}`);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  //console.log(`${username}`);
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  const userCheck = `select * from user where username = '${username}';`;
  let userCheckData = await db.get(userCheck);
  if (userCheckData === undefined) {
    let newUser = `insert into user(username,name,password,gender,location)
      values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;

    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserData = await db.run(newUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `select * from user where username = '${username}';`;

  const hashedPass = await bcrypt.hash(newPassword, 10);
  const userQueryData = await db.get(userQuery);
  const checkPassMatch = await bcrypt.compare(
    oldPassword,
    userQueryData.password
  );
  if (checkPassMatch === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const query = `update user set password = '${hashedPass}'
          where username = '${username}';`;

      await db.run(query);

      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const userCheck = `select * from user where username =  '${username}';`;
  const userCheckData = await db.get(userCheck);
  if (userCheckData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatchCheck = await bcrypt.compare(
      password,
      userCheckData.password
    );
    if (passwordMatchCheck === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

module.exports = app;
