const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const bcrypt = require('bcrypt');
const pgp= require('pg-promise')();


const cn = {
    host: 'localhost', 
    port: 5432,
    database: 'shyzu-db',
    user: '',
    password: ''
}
db = pgp(cn);









const app = express();

app.use(bodyParser.json());
app.use(cors())




app.get('/', (req, res) => {

  
res.send("server on");
})



app.post('/signin', (req, res) => {
    const liEmail = req.body.email;
    db.any("SELECT email , hash FROM login WHERE email = $1", [liEmail])
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid) {
            return db.any('SELECT * FROM users WHERE email = $1',[liEmail])
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('user not found'))
        } else {
            res.status(400).json('incorrect details')
        }
    })
        .catch(err => res.status(400).json('incorrect details'))
})




app.post('/register', (req, res) => {
    const { email, userName, password } = req.body;
    const hash = bcrypt.hashSync(password, 8)
    db.tx( trx => {
        trx.none('INSERT INTO login (email, hash) VALUES($1, $2)', [email, hash]);
        trx.one('INSERT INTO users (email, userName, joined) VALUES($1, $2, $3) RETURNING *', [email, userName, new Date()])
        .then(user => {
            res.json(user);
        })
        .catch(err => {
            console.log(err)
        })
    })
    .catch(err => res.status(400).json('sorry there is a problem'))

})



app.put('/score', (req, res) => {
    const  {id}  = req.body;
    db.one('SELECT score FROM users WHERE id = $1',  [id])
        .then(data => {
            const newScore = Number(data.score) + 50;
            db.one('UPDATE users SET score = $1 WHERE id = $2' , [newScore, id])
           return res.json(newScore);
        })
})





app.listen(3000, () => {
    console.log('app on port 3000');
})