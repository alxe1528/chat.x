/**
 * Created with JetBrains WebStorm.
 * User: xuwenmin
 * Date: 14-4-19
 * Time: 下午1:20
 * To change this template use File | Settings | File Templates.
 */

var express = require('express'),
    io = require('socket.io');

var app  =express();

app.use(express.static(__dirname));

var server = app.listen(8888, 'localhost');


var ws = io.listen(server);


// 检查昵称是否重复
var checkNickname = function(name){
    for(var k in ws.sockets.sockets){
        if(ws.sockets.sockets.hasOwnProperty(k)){
            if(ws.sockets.sockets[k] && ws.sockets.sockets[k].nickname == name){
                return true;
            }
        }
    }
    return false;
}
// 获取所有的昵称数组
var getAllNickname = function(){
    var result = [];
    for(var k in ws.sockets.sockets){
        if(ws.sockets.sockets.hasOwnProperty(k)){
            result.push({
                name: ws.sockets.sockets[k].nickname
            });
        }
    }
    return result;
}
ws.on('connection', function(client) {
    console.log('\033[96m' + client.handshake.address.address + ' is connect\033[39m');

    var ip = client.handshake.address.address + '';
    var ipNums = ip.split(".");
    var rawIp = ipNums[0] + ".*.*." + ipNums[3];
    client.rawIp = rawIp;

    client.on('join', function(msg){
        console.log(msg);
        // 检查是否有重复
        if(msg) {
            if(checkNickname(msg)){
                client.emit('nickname', '昵称有重复!');
            }else{
                client.nickname = msg;
            }
        } else {
            client.nickname = client.rawIp;
        }
        console.log(client.rawIp);
        ws.sockets.emit('announcement', '系统', client.nickname + '(' + client.rawIp + ') 加入了聊天室!', {type:'join', name:getAllNickname()});
    });
    // 监听发送消息
    client.on('send.message', function(msg){
        client.broadcast.emit('send.message', (client.nickname || client.rawIp), msg);
    });

    client.on('disconnect', function(arg){
        if(client.nickname){
            client.broadcast.emit('send.message','系统',  (client.nickname || client.rawIp) + '离开聊天室!', {type:'disconnect', name:client.nickname});
        }
    });

});

