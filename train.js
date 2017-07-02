const SerialPort = require('serialport');

const BeamClient = require('beam-client-node');
const BeamSocket = require('beam-client-node/lib/ws');
const FuzzySet = require('fuzzyset.js');
const auth = require('auth.js');

let port;
let userInfo;
let channelId;
const client = new BeamClient();


client.use('oauth', {
    tokens: {
        access: 'oiyxyQun0gD4Es2qNCH3nESfzWD5BwpdQ3AcZWgtjm2MQvNpz25y7znTKRKEx25e',
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

function doTrain(data) {
    if (data.message.message[0].data.toLowerCase().startsWith('!so')) {

        if (data.user_roles.indexOf('Owner') >= 0 | data.user_roles.indexOf('Mod') >= 0) {
            console.log('running train');
            port.write(new Buffer('10'));
        }
    }
    if (data.message.message[0].data.toLowerCase().startsWith('!hypetrain')) {

        if (data.user_roles.indexOf('Owner') >= 0 | data.user_roles.indexOf('Mod') >= 0) {
            console.log('running train');
            port.write(new Buffer('10'));
        }
    }

    if (data.message.message[0].data.toLowerCase().startsWith('!train')) {
        if (data.user_roles.indexOf('Owner') >= 0 | data.user_roles.indexOf('Mod') >= 0) {
            console.log('running train', data.message.message[0].text.split(' ', 3)[1]);
            port.write(new Buffer( data.message.message[0].text.split(' ', 3)[1]));
        }
    }


}

function detectRaid(chatMessage) {
    var fulltext = "";
    var raid = false;
    //console.log(chatMessage);
    for (var obj in chatMessage.message.message) {
        fulltext = fulltext + chatMessage.message.message[obj].text;
    }
    var textlog = messageLog.map(l => l.text);
    fuzz = FuzzySet(textlog);
    if (fuzz.get(fulltext)) if (fuzz.get(fulltext)[0][0] > 0.9) console.log(fuzz.get(fulltext));

    messageLog.push({
        user: chatMessage.user_name,
        text: fulltext,
        obj: chatMessage,
        hashtagged: fulltext.indexOf('#') >= 0,
        hashtag: fulltext.indexOf('#') >= 0 ? fulltext.slice(fulltext.indexOf('#'), fulltext.indexOf(' ', fulltext.indexOf('#')) > 0 ? fulltext.indexOf(' ', fulltext.indexOf('#')) + 1 : fulltext.length).toLowerCase() : '',
        containsraid: fulltext.toLowerCase().indexOf('raid') >= 0,
    });
    if (messageLog.length > 25) {
        messageLog.pop();
    }
    var hashtags = [];

    for (i = 0; i < messageLog.length; i++) {
        if (hashtags[messageLog[i].hashtag]) {
            hashtags[messageLog[i].hashtag] += 1;
        }
        else {
            hashtags[messageLog[i].hashtag] = 1;
        }
    }
    //console.log(hashtags);
    for (var tag in hashtags) {
        if (hashtags[tag] > 1) {
            //console.log(tag);
        }
    }
    if (!raid) console.log(chatMessage.user_name + ": " + fulltext);

}

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


function setupPort() {
    port = new SerialPort('/dev/ttyACM0', {
        parser: SerialPort.parsers.readline('\n')
    });
    var counter = 0

    port.on('open', function () {
        console.log('Port open');
    });

    port.on('error', function (err) {
        console.log('Error: ', err.message);
    });

    port.on('data', function (data) {
        counter++;
        console.log(data.toString());
    });
    console.log('port set up')
}
