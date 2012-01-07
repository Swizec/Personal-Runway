
// fetch
// feed to haskell
// get prediction
// send email

var toggl = require('./fetching/toggl'),
    toshl = require('./fetching/toshl'),
    secrets = require('./secrets'),
    moment = require('moment'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    spawn = require('child_process').spawn,
    mongodb = require('mongodb'),
    email = require('mailer'),
    mongo = new mongodb.Db('personal-runway', new mongodb.Server('127.0.0.1', 27017, {}));

var Data = {toshl: false,
            toggl: false};

var emitter = new EventEmitter();

toggl.fetch_data(function (data) {
    console.log("toggl'd");
    if (Data.toggl) return;
    Data.toggl = data;
    emitter.emit('fetched');
});

toshl.fetch_data(function (data) {
    console.log("toshl'd");
    if (Data.toshl) return;
    Data.toshl = data;
    emitter.emit('fetched');
});

var last_known_state = function (callback) {
    mongo.open(function (err) {
        var meta = new mongodb.Collection(mongo, 'meta');
        meta.find({}).sort({'time': -1}).limit(1).toArray(function(err, metas) {
            var last = metas[0];
            mongo.close();

            callback(last);
        });
    });
};

var extract_data = function (last) {
    var now = new Date(),
        keys = _.keys(Data.toshl).filter(
            function (k) {
                k = moment(k, "YYYY-DDD");
                return k >= last.time && k <= now;
            });
    return  keys.map(function (k) {
        return {'day': moment(k, "YYYY-DDD")['_d'],
                '+': Data.toggl[k],
                '-': Data.toshl[k]};
    });
};

var store_deltas = function (mongo, data) {
    var deltas = new mongodb.Collection(mongo, 'deltas');
    deltas.insert(data);
};

var replay_events = function (mongo, data, last) {
    var new_amount = data.reduce(function (a, b) {
        return a+b['+']-b['-'];
    }, last.amount);

    var metas = new mongodb.Collection(mongo, 'meta');
    metas.insert({time: new Date(),
                  amount: new_amount});
    return new_amount;
};

emitter.on('fetched', function () {
    if (!(Data.toshl && Data.toggl)) return;

    last_known_state(function (last) {

        var data = extract_data(last);

        mongo.open(function (err) {
            store_deltas(mongo, data);
            var money = replay_events(mongo, data, last);

            emitter.emit("replayed", money);

            mongo.close();
        });
    });
});

emitter.on('replayed', function (money) {
    var predict = spawn('./implementation/in_fortnight', [money]);
    predict.stdin.end();
    predict.stdout.on('data', function (data) {
        emitter.emit('predicted', money, parseFloat((data+"").split("\n")[0]));
    });
});

emitter.on('predicted', function (now, prediction) {
    var subject = "", template = "";

    if (prediction > now) {
        subject = "Yay, money \\o/";
        template = "emails/good_prediction.txt";
    }else  if (prediction < 0) {
        subject = "Fuck, money!";
        template = "emails/bad_prediction.txt";
    }else{
        subject = "Yay ... money?";
        template = "emails/lukewarm_prediction.txt";
    }

    mail({to: 'swizec@swizec.com',
          subject: subject,
          template: template,
          data: {prediction: Math.round(prediction)}},
         function () {
             console.log("Sent.");
         });
});

function mail (info, callback) {
    email.send(
        {host: "smtp.sendgrid.net",
         port : "25",
         domain: "smtp.sendgrid.net",
         authentication: "login",
         username: secrets.sendgrid.user,
         password: secrets.sendgrid.pass,
         to : info.to,
         from : "swizec@swizec.com",
         template: info.template,
         data: info.data,
         subject : info.subject
        },
        callback);
}
