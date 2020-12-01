const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

const app = express()
app.use(express.static("public"));
app.use(morgan('combined'));
app.use(bodyParser.raw({type:"*/*"}))
app.use(cors())

let settingHeader = obj => obj.setHeader('Content-Type', 'application/json')
let setToken = () => (100000 + Math.floor(Math.random() * 900000)).toString() 
let token = undefined
//adding a comment
let users = new Map()
// users.set('bob', 'pwd123')
let usersSession = new Map() //key -> token, name
// usersSession.set(token, user.get(key))
let channels = new Map() //key -> token, channelName
//channels.set(channel name, {creator: userSession.get(key), usersList: [], banned: [], contents: []})

//FUNCTIONS START
//FUNCTIONS START
//FUNCTIONS START
let checkHeader = (header, res) => {
    if(header !== undefined) return
    return res.send(JSON.stringify({'success':false,'reason':'token field missing'}))
}
  
let checkChannelName = (chanName , res) =>{
    if(chanName !== undefined) return 
    return res.send(JSON.stringify({'success':false, 'reason': 'channelName field missing'}))
}
  
let checkUserSession = (header, res) =>{
    if(usersSession.has(header)) return
    return res.send(JSON.stringify({'success': false, 'reason': 'Invalid token'}))
}
  
//FUNCTIONS END
//FUNCTIONS END
//FUNCTIONS END


app.get("/sourcecode", (req, res) => {
    res.send(require('fs').readFileSync(__filename).toString())
})

app.get('/', (res, req)=>{
    console.log('START')
})

app.post('/signup', (req, res) =>{
    let user = JSON.parse(req.body)
    let name = user.username
    let password = user.password
    settingHeader(res)

    if(users.has(name) && (name)) res.send(JSON.stringify({"success":false,"reason":"Username exists"}))
    else if(name === undefined) res.send(JSON.stringify({"success":false,"reason":"username field missing"}))
    else if(password === undefined) res.send(JSON.stringify({"success":false,"reason":"password field missing"})) 
    else {
        users.set(name, password)
        res.send(JSON.stringify({success:true})) 
    }
})

app.post('/login', (req,res)=>{
    let user = JSON.parse(req.body)
    let name = user.username, password = user.password
    token = setToken()
    settingHeader(res)
    if(users.has(name)){
        if(password !== users.get(name) && password !== undefined) res.send(JSON.stringify({'success' :false, "reason":'Invalid password'}))
        else if(password === undefined) res.send(JSON.stringify({'success':false, "reason":'password field missing'}))
        else {
        usersSession.set(token, name)
        res.send({'success':true, token:`${token}`})
        }
    } 
    else if(name === undefined) res.send(JSON.stringify({'success' :false, "reason":'username field missing'}))
    else res.send(JSON.stringify({'success':false, 'reason': 'User does not exist'}))
})

app.post('/create-channel',(req,res)=>{
    let channel = JSON.parse(req.body)
    const header = req.headers['token']
    checkHeader(req.headers['token'], res)
    let chanName = channel.channelName
    // checkChannelName(chanName, res)

    if(chanName !== undefined){
        if(usersSession.has(req.headers['token'])){
        if(!channels.has(channel.channelName)){
            channels.set(channel.channelName, {creator: usersSession.get(req.headers['token']) , usersList: [], banned: [], contents:[]})
            // console.log(chanName+ " CREATED " + usersSession.get(token)+" USER->"+req.headers['token'])
            res.send(JSON.stringify({'success':true}))
        } else res.send(JSON.stringify({'success': false,"reason": 'Channel already exists'}))
        } else res.send(JSON.stringify({'success':false,'reason': 'Invalid token'}))
    } else res.send(JSON.stringify({'success': false, 'reason':'channelName field missing'}))
})


app.post('/join-channel',(req, res)=>{
    let user = JSON.parse(req.body)
    let chanName = user.channelName
    const header = req.headers['token']
    checkHeader(header, res)
    checkUserSession(header, res)
    checkChannelName(chanName, res)   

    if(!channels.has(chanName)) res.send(JSON.stringify({"success":false,"reason":"Channel does not exist"}))
    else {
        let check = channels.get(chanName).usersList
        let ban = channels.get(chanName).banned
        if(check.includes(usersSession.get(header))){
        res.send(JSON.stringify({"success":false,"reason":"User has already joined"}))
        } 
        else if(ban.includes(usersSession.get(header))){
        res.send(JSON.stringify({'success':false,'reason':'User is banned'}))
        }else{
        channels.get(chanName).usersList.push(usersSession.get(header))
        res.send(JSON.stringify({'success': true}))
        }
    }
})

app.post('/leave-channel', (req, res)=>{
    let user = JSON.parse(req.body)
    let chanName = user.channelName
    const header = req.headers['token']
    checkHeader(header, res)
    checkUserSession(header, res)
    if(chanName !== undefined){
        if(channels.has(chanName)){
        let checkArr = channels.get(chanName).usersList
        if(!checkArr.includes(usersSession.get(header))) res.send(JSON.stringify({'success':false, 'reason':'User is not part of this channel'}))
        else{
            let checkArr = channels.get(chanName).usersList
            let index = checkArr.indexOf(usersSession.get(header))
            channels.get(chanName).usersList.splice(index,1)
            res.send(JSON.stringify({'success':true}))
        }
        } else res.send(JSON.stringify({'success':false, "reason":'Channel does not exist'}))
    } else res.send(JSON.stringify({'success':false,"reason": 'channelName field missing'}))
})

app.get('/joined', (req, res)=>{
    const header = req.headers['token']
    let channel = req.query.channelName
    if(header !== undefined){ 
        if(usersSession.has(req.headers['token'])){ 
        if(channels.has(req.query.channelName)){
        let arrUser = channels.get(req.query.channelName).usersList 
            if(!arrUser.includes(usersSession.get(header)))  res.send(JSON.stringify({'success':false,'reason':'User is not part of this channel'}))
            else res.send(JSON.stringify({'success':true, 'joined':arrUser}))  
        }else res.send(JSON.stringify({'success':false,'reason':'Channel does not exist'}))
        } else res.send(JSON.stringify({'success':false,'reason':'Invalid token'})) 
    } else res.send(JSON.stringify({'success':false,'reason':'token field missing'}))  
})

app.post("/delete",(req, res)=>{
    let user = JSON.parse(req.body), chanName = user.channelName
    const header = req.headers['token']
    if(header !== undefined){
        if(usersSession.has(header)){
        if(chanName !== undefined){
            if(channels.has(chanName)){
            console.log(chanName + " DELETED")
            channels.delete(chanName)
            
            res.send(JSON.stringify({'success':true }))
            } else res.send(JSON.stringify({'success':false,'reason':'Channel does not exist'}))
        } else res.send(JSON.stringify({'success': false,'reason':'channelName field missing'}))
        } else res.send(JSON.stringify({'success':false,'reason':'Invalid token'}))
    } else res.send(JSON.stringify({'success':false, 'reason':'token field missing'}))
})

app.post('/kick', (req,res)=>{
    let userIn = JSON.parse(req.body)
    let chanName = userIn.channelName 
    let targetUser = userIn.target
    const header = req.headers['token']
    if(header !== undefined){
        if(usersSession.has(header)){
        if(chanName !== undefined){
            if(targetUser !== undefined){
            let creator = channels.get(chanName).creator
            if(usersSession.get(header) !== creator){
                res.send(JSON.stringify({'success':false, 'reason':'Channel not owned by user'}))
            }else{
                let index = channels.get(chanName).usersList.indexOf(targetUser)
                channels.get(chanName).usersList.splice(index,1)
                res.send(JSON.stringify({'success':true}))

            }
            } else res.send(JSON.stringify({'success':false,'reason':'target field missing'}))
        } else res.send(JSON.stringify({'success': false, 'reason':'channelName field missing'}))
        } else res.send(JSON.stringify({'success': false, 'reason': 'Invalid token'}))
    } else res.send(JSON.stringify({'success': false, 'reason':'token field missing'}))
})


app.post('/ban', (req, res)=>{
    let userIn = JSON.parse(req.body), chanName = userIn.channelName, target = userIn.target
    const header = req.headers['token']
    if(header !== undefined){
        if(usersSession.has(header)){
        if(chanName !== undefined){
            if(channels.has(chanName)){
                if(target !== undefined){ 
                let creator = channels.get(chanName).creator
                if(usersSession.get(header) !== creator) res.send(JSON.stringify({'success':false, 'reason': 'Channel not owned by user'}))
                else {
                    let index = channels.get(chanName).usersList.indexOf(target)
                    channels.get(chanName).usersList.splice(index,1)
                    channels.get(chanName).banned.push(target)
                    res.send(JSON.stringify({'success':true}))
                    }
                } else res.send(JSON.stringify({'success':false, 'reason': 'target field missing'}))
            }
        } else res.send(JSON.stringify({'success':false,'reason':'channelName field missing'}))
        } else res.send(JSON.stringify({'success':false,'reason':'Invalid token'}))
    }else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
})


app.post('/message',(req,res)=>{
    let userIn = JSON.parse(req.body), chanName = userIn.channelName, contents = userIn.contents
    const header = req.headers['token']  
    if(header !== undefined){
        if(usersSession.has(req.headers['token'])){
        if(chanName !== undefined){
            if(!channels.has(chanName) || !channels.get(chanName).usersList.includes(usersSession.get(req.headers['token']))){
            res.send(JSON.stringify({'success':false,'reason':'User is not part of this channel'}))
            } else if(channels.has(chanName)){
                if(contents !== undefined) {
                let msg = {from : usersSession.get(req.headers['token']), contents : contents}
                channels.get(chanName).contents.push(msg)
                res.send(JSON.stringify({'success':true}))            
                }
                else  res.send(JSON.stringify({'success':false,'reason':'contents field missing'}))
            }
        } else res.send(JSON.stringify({'success':false,'reason':'channelName field missing'}))
        } else res.send(JSON.stringify({'success':false,'reason':'Invalid token'}))
    } else res.send(JSON.stringify({'success':false, 'reason':'token field missing'}))
})
  
  
app.get('/messages', (req, res)=>{
    let chan = req.query.channelName
    if(chan !== undefined){
        if(channels.get(chan)){
        if(!channels.get(chan).usersList.includes(usersSession.get(req.headers['token']))){
            res.send(JSON.stringify({'success':false,'reason':'User is not part of this channel'}))
        }
        else{
            res.send(JSON.stringify({'success':true, 'messages': channels.get(chan).contents }))
        }
        } else res.send(JSON.stringify({'success': false,'reason':'Channel does not exist'}))
    } else res.send(JSON.stringify({'success':false,'reason':'channelName field missing'}))
})



// listen for requests :)
app.listen(process.env.PORT || 3000)
// app.listen(process.env.PORT, () => {
//     console.log("Your app is listening on port " + listener.address().port);
// });
  



