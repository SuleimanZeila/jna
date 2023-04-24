const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const pathhere = require('path')
require('dotenv').config()
const app = express();
const cors = require('cors')
const multer = require('multer');
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

//mongodb Connection
// mongoose.connect(process.env.mongodburl, {useNewUrlParser: true })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch((err) => console.error('Error connecting to MongoDB:', err));

const startServer = async () => {
    try {
      // Connect to MongoDB using Mongoose
      await mongoose.connect(process.env.mongodburl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
  
      // Start listening on port 3000
      app.listen(3000, () => {
        console.log('Server listening on port 3000');
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  startServer();

//User Schemas
const userSchema = new mongoose.Schema({
    Fullname: {
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    phone: {
        type: String,
        require: true
    }
})
const User = new mongoose.model("User", userSchema)



//News Schema
const postSchema = new mongoose.Schema({
    postId:{type:String,required:true},
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date,
        get: function() {
        return this._date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } },
    category: [{ type: String }],
});
  
const Post = mongoose.model('Post', postSchema);

//get home
app.get('/', async(req,res) => {
    res.sendFile(__dirname + '/index.html')
})

//checking database
app.get('/allusers', async (req,res) => {
    const all_users = await User.find()
    res.json(all_users)

})
//register new user
app.post('/newuser', async  (req,res)=>{
    const user = new User({
        Fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        phone:req.body.phone,
        username:req.body.username,
      })
    const email = req.body.email
    const find_user_first = User.find({email:email})
    if (find_user_first === true){
        console.log('Email Already Taken!')
        res.send('Email Allready Registered')
    }
    else{
        const newUser = await user.save();
    if (newUser) {
        console.log(req.body.username)
        res.send({
          _id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          username: newUser.username,
          password: newUser.password,
        });
      } else {
        res.status(401).send({ message: 'Invalid User Data.' });
      }
    }
    
})

app.post('/login', async (req,res) =>{
    const {username, password } = req.body
   try {
    const user =  await User.findOne({username,password})
    if(!user){
        return res.status(401).send('Invalid Credentials!')
    }
    return res.status(200).json({
        message:'login successfully', user
    })
   } catch (err) {
    return res.status(500).send(err)
   }
})


//NEWS CODES
app.post('/newpost', async (req,res) => {
    const {title,content,date,category,author,description} = req.body
    const newSentence = title.replace(/\s/g, '');
    const new_item_post = new Post({
        postId:newSentence,
        title,
        content,
        date,
        author,
        category,
        description,
    })
    const post_saved = await new_item_post.save()
    if(post_saved){
        res.json(post_saved)
    }else{
        res.send('Sorry Something Went Wrong!!!')
    }
})



//upload Image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });

  //Image Schema
  const imageSchema = new mongoose.Schema({
    filename: String,
    path: String,
  });
  
  const Image = mongoose.model('Image', imageSchema);

  //route
  app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { filename, path } = req.file;
    // Save the image metadata to the database
    try {
      const image = new Image({ filename, path });
      await image.save();
      return res.status(201).json({ success: true, message: 'Image uploaded successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
//get image
app.get('/images/:title/:author', (req, res) => {
  const title = req.params.title;
  const author = req.params.author;
  const imagePath = pathhere.join(__dirname, 'uploads', `${title}-${author}.jpg`);
  res.sendFile(imagePath);
});

  

//checking all Post
app.get('/allpost', async (req,res) => {
    const all_images = await Image.find()
    const all_post = await Post.find()
    res.json({all_post,all_images})
})

//Specific POST 
app.get('/api/posts/:id', async (req, res) => {
    const post = await Post.findOne({_id:req.params.id});
    res.json(post);
  });
