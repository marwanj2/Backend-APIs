const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const mongoose = require('mongoose');

const {Schema} = mongoose

mongoose.connect(process.env.MONGO_URL)

const UserSchema = new Schema({
  username: String
})
const User = mongoose.model('User', UserSchema)


const ExSchema = new Schema({
  user_id : {type:String, required: true} ,
  description: String,
  duration: Number,
  date: Date
})
const Exercise = mongoose.model("Exercise", ExSchema)


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// get all users.
app.get('/api/users', async (req,res) => {
  try {
    const users = await User.find({}).select("_id username");
    if (users) {
      res.json(users)
    }
    else{
      res.send("could not find users");
    }
  } catch (err) {
    console.log(err)
  }
})


//
app.post('/api/users', async (req,res) => {

  const userObj = new User({
    username: req.body.username
  });
  try {
    const user = await userObj.save();
    res.json(user)
  } catch (err) {
    console.log(err)
  }
})


//
app.post('/api/users/:_id/exercises', async (req,res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.send("could not find user!");
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });

      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch (error) {
    console.log(err)
    res.send("there was an error saving the Exercise")
  }
})

// logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.send("could not find user");
    return;
  }

  let dateObj = {}
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if (from || to) {
    filter.date = dateObj
  }

  const exercices = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercices.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))

  res.json({
    username: user.username,
    count: exercices.length,
    _id: user._id,
    log
  })

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
