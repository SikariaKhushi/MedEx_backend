const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// Middleware
app.use(cors()); // Allow cross-origin requests from specified origin
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// Database connection
const mongoUrl = "mongodb+srv://khushisikaria2022:%23iamgroot1508@cluster0.skia7n6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoUrl, {
    useNewUrlParser:true
}).then(() => {
    console.log("Connected to database");
}).catch((e) => console.log(e));

// Register Route
app.post('/register', async (req,res) => {
    const {username,password} = req.body;
    try{
      const userDoc = await User.create({
        username,
        password: bcrypt.hashSync(password, salt),
      });
      res.json(userDoc);
    } catch(e) {
      console.log(e);
      res.status(400).json(e);
    }
});

// Login route
app.post('/login', async (req,res) => {
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    if (!userDoc) {
        return res.status(400).json('User not found');
    }
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      // logged in
      jwt.sign({username, id: userDoc._id}, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json('Wrong credentials');
    }
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        req.username = decoded.username;
        req.userId = decoded.id;
        next();
    });
}

// Protected route example
app.get('/profile', verifyToken, (req,res) => {
    // This route is protected, only accessible with a valid token
    res.json({ username: req.username, userId: req.userId });
});

// Logout route
app.post('/logout', (req,res) => {
    res.clearCookie('token').json({ message: 'Logged out successfully' });
});

// Start the server
const port = 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});