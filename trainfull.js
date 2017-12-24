const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;

const Interactive = require('beam-interactive-node');
const BeamClient = require('beam-client-node');
const BeamSocket = require('beam-client-node/lib/ws');
const FuzzySet = require('fuzzyset.js');


let port;
let userInfo;
let channelId;
const client = new BeamClient();


client.use('oauth', {
    tokens: {
        access: 'ZmkdkCQWZRA8e9hiGZx408lEjod12TETUpw8FDwl04qc1WOr9gO4CEJTH9LpSLAm',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    }
});

client.request('GET', 'users/current')
    .then(response => {
        //console.log(response.body);
        userInfo = response.body;
        channelId = 342086;
        return client.chat.join(channelId);
    })
    .then(response => {
        const body = response.body;
        //console.log(body);
        return createChatSocket(userInfo.id, channelId, body.endpoints, body.authkey);

    })
    .catch(error => {
        console.log('Something went wrong:', error);
    });

    function startBeam() {
        //console.log(username, password, code);
        beam.use('oauth', {
            tokens: {
                access: "ZmkdkCQWZRA8e9hiGZx408lEjod12TETUpw8FDwl04qc1WOr9gO4CEJTH9LpSLAm",
                expires: Date.now() + (365*24*60*60*1000)
            }
        })
        
        beam.request('GET', 'users/current')
        .then(resp => {
            //console.log(resp.body);
            console.log('Authenticated with Beam');
            channelId = resp.body.channel.id
            return beam.game.join(channelId)
        })
        .then(res => {
            console.log(res.body);
            console.log('Creating Robot');
            return createRobot(res);
        })
        .then(robot => performRobotHandShake(robot))
        .then(robot => setupRobotEvents(robot))
        .catch(err => {
            if (err.res) { 
                throw new Error('Error connecting to Interactive', + err.res.body.message);
            }
            throw new Error('Error connecting to interactive', err);
            
        });
    
    }
    
    //Create the robot for answering game reports
    function createRobot(res) {
        return new Interactive.Robot({
            remote: res.body.address,
            channel: channelId,
            key: res.body.key,
        });
    }
    
    //Authenticate the robot
    function performRobotHandShake(robot) {
        return new Promise((resolve, reject) => {
            robot.handshake(err => {
                if (err) { 
                    reject(err);
                }
                resolve(robot);
            });
        });
    }
    
    function setupRobotEvents (robot) {
        robot.on('report', report => {
            console.log(report);
            // var tacGroup = report.tactile.filter(item => item.id < 7 && item.holding > 0);
            // if (tacGroup.length > 0) {
            //     var packet = tacGroup.reduce((prev, curr) => {return prev.holding < curr.holding ? curr : prev; });
            //     broadcast(packet.id.toString());
            // }
    
            // var soundGroup = report.tactile.filter(item => item.id > 6 && item.holding > 0);
    
            // if (soundGroup.length > 0) {
            //     var sounds = JSON.parse(fs.readFileSync("sounds.json")).sounds;
            //     console.log(sounds.sounds);
            //     //console.log(soundGroup);
            //     soundGroup.forEach(item => {
            //         var sound = sounds.find(s=> s.id == item.id);
            //         playSound(sound.name, sound.path, sound.volume);
            //     })
            // }
        });
    }

function createChatSocket(userId, channelId, endpoints, authkey) {
    const socket = new BeamSocket(endpoints).boot();

    socket.auth(channelId, userId, authkey)
        .then(() => {
            console.log('You are now authenticated!');
            setupPort();
            //return socket.call('msg', ['Hello World!']);
        })
        .catch(error => {
            console.log('Oh no! An error occurred!', error);
        });

    socket.on('ChatMessage', data => {
        sourceEmote(data, socket);
        detectRaid(data);
        doTrain(data);

    });

    socket.on('error', error => {
        console.error('Socket error', error);
    });
}

var messageLog = [];


          //  port.write(new Buffer( data.message.message[0].text.split(' ', 3)[1]));


var channels = []
var emotes = []
function sourceEmote(data, socket) {
    var newEmotes = []
    for (i in data.message) {
        if (i == 'message') {
            for (j in data.message[i])
                if (data.message[i][j].type == 'emoticon') {
                    if (data.message[i][j].source == 'external') {
                        var url = data.message[i][j].pack;
                        var text = data.message[i][j].text;
                        var emoteChannelId = url.substring(url.indexOf('-') + 1, url.indexOf('.', url.indexOf('-')))
                        var emo = emotes.find(e => { return e.channelId == emoteChannelId; });
                        if (emo) {
                            if (emo.emote.indexOf(text) < 0)
                                emo.emote += ' ' + text;
                        }
                        else {
                            emotes.push({ channelId: emoteChannelId, emote: text });
                            newEmotes.push({ channelId: emoteChannelId, emote: text });
                        }
                    }
                }
        }
    }
    for (var e in newEmotes) {
        if (chan = channels.find(c => { return c.channelId == newEmotes[e].channelId; })) {
            console.log(newEmotes[e].emote, '-', chan.userName);

        } else {
            client.channel.getChannel(newEmotes[e].channelId).then(response => {
                channels.push({ channelId: response.body.id, userName: response.body.user.username });
                console.log(newEmotes.find(f => { return f.channelId == response.body.id.toString(); }).emote, '-', response.body.user.username);
            });

        }

    }
    parseEmoteCommand(data, socket);
}

function parseEmoteCommand(data, socket) {
    if (data.message.message[0].data.toLowerCase().startsWith("!emote ")) {
        var fulltext = "";
        for (var obj in data.message.message) {
            fulltext = fulltext + data.message.message[obj].text;
        }
        qEmoteText = fulltext.split(' ')[1]
        if (emotes.find(e => e.emote == qEmoteText)) {
            qEmote = emotes.find(e => e.emote == qEmoteText).channelId
            if (qEmote) {
                if (channels.find(c => { return c.channelId == qEmote })) {
                    var respName = channels.find(c => { return c.channelId == qEmote }).userName;
                    if (respName) {
                        socket.call('msg', [qEmoteText + ' belongs to ' + respName]);
                    } else {
                        socket.call('msg', [qEmoteText + ' not used in chat tonight.']);
                    }
                }
                else {
                    socket.call('msg', [qEmoteText + ' not used in chat tonight.']);
                }
            } else {
                socket.call('msg', [qEmoteText + ' not used in chat tonight.']);
            }
        }
        else {
            socket.call('msg', [qEmoteText + ' not used in chat tonight.']);
        }
        //console.log(respName);
    }
}

startBeam();
//Open a beam session for Interactive
function startBeam() {
    //console.log(username, password, code);
    
    client.request('GET', 'users/current')
    .then(resp => {
        //console.log(resp.body);
        console.log('Authenticated with Beam');
        channelId = resp.body.channel.id
        return client.game.join(channelId)
    })
    .then(res => {
        console.log(res.body);
        console.log('Creating Robot');
        return createRobot(res);
    })
    .then(robot => performRobotHandShake(robot))
    .then(robot => setupRobotEvents(robot))
    .catch(err => {
        if (err.res) { 
            throw new Error('Error connecting to Interactive', + err.res.body.message);
        }
        throw new Error('Error connecting to interactive', err);
        
    });

}

//Create the robot for answering game reports
function createRobot(res) {
    return new Interactive.Robot({
        remote: res.body.address,
        channel: channelId,
        key: res.body.key,
    });
}

//Authenticate the robot
function performRobotHandShake(robot) {
    return new Promise((resolve, reject) => {
        robot.handshake(err => {
            if (err) { 
                reject(err);
            }
            resolve(robot);
        });
    });
}

function setupRobotEvents (robot) {
    robot.on('report', report => {
        var tacGroup = report.tactile.filter(item => item.id < 7 && item.holding > 0);
        if (tacGroup.length > 0) {
            var packet = tacGroup.reduce((prev, curr) => {return prev.holding < curr.holding ? curr : prev; });
            broadcast(packet.id.toString());
        }

        var soundGroup = report.tactile.filter(item => item.id > 6 && item.holding > 0);

        if (soundGroup.length > 0) {
            var sounds = JSON.parse(fs.readFileSync("sounds.json")).sounds;
            console.log(sounds.sounds);
            //console.log(soundGroup);
            soundGroup.forEach(item => {
                var sound = sounds.find(s=> s.id == item.id);
                playSound(sound.name, sound.path, sound.volume);
            })
        }
    });
}

function setupPort() {
    port = new SerialPort('COM3', {
        baudRate: 9600
    });
    const parser = port.pipe(new Readline());

    port.on('open', function () {
        console.log('Port open');
    });

    port.on('error', function (err) {
        console.log('Error: ', err.message);
    });

    // port.on('readable', function () {
    //     console.log('Data: ', port.read());
    // });
    parser.on('data', function(data) {
        console.log('Data: ', data.toString());
    })
    console.log('port set up')
}
