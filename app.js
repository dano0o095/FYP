let express = require('express');
let path = require('path');
let logger = require('morgan');
let bodyParser = require('body-parser');
let neo4j = require('neo4j-driver').v1;

let app = express();

//View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

let driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'screwball2'));
let session = driver.session();

app.get('/', function(req, res){
    session
        .run('MATCH(n:Movie) RETURN n limit 25')
        .then(function(result){
        var movieArr = [];
        result.records.forEach(function(record){
            movieArr.push({
               id: record._fields[0].identity.low,
                title: record._fields[0].properties.title,
                year: record._fields[0].properties.year
            });
        });

        session 
            .run('MATCH(n:Actor) RETURN n LIMIT 25')
            .then(function(result2){
                var actorArr = [];
            result2.records.forEach(function(record){
                    actorArr.push({
                   id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name
                });
            });
             res.render('index', {
                movies: movieArr,
                actors: actorArr
            });
        })
        .catch(function(err){
            console.log(err)
        });
    })
    .catch(function(err){
        console.log(err);
    });
  });

app.post('/movie/add', function(req, res){
    var title = req.body.title;
    var year = req.body.year;
    
    session 
        .run('CREATE(n:Movie {title:{titleParam},year:{yearParam}}) RETURN n.title', {titleParam:title, yearParam:year})
        .then(function(result){
            res.redirect('/');
        
        session.close();
    })
        .catch(function(err){
        console.log(err);
    });
    
    res.redirect('/');
});

app.post('/actor/add', function(req, res){
    var name = req.body.name;
    
    session 
        .run('CREATE(n:Actor {name:{nameParam}}) RETURN n.name', {nameParam:name})
        .then(function(result){
            res.redirect('/');
        
        session.close();
    })
        .catch(function(err){
        console.log(err);
    });
    
    res.redirect('/');
});

app.post('/movie/actor/add', function(req, res){
    var title = req.body.title;
    var name = req.body.name;
    
    session 
        .run('MATCH(a:Actor {name:{nameParam}}),(b:Movie {title:{titleParam}}) MERGE(a)-[r:ACTED_IN]-(b) RETURN a,b', {titleParam:title, nameParam:name})
        .then(function(result){
            res.redirect('/');
        
        session.close();
    })
        .catch(function(err){
        console.log(err);
    });
    
    res.redirect('/');
});

app.listen(3000);
console.log("Server started on Port 3000");
module.exports = app;