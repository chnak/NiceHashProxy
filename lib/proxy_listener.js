var config = require('../config.json')
var net = require('net');
var util = require('util')
var ldj = require('ldjson-stream')

var miners = new Map();
var id = 0;

//======================== miner connection =============================
exports.createMiningListener = function createMiningListener() {
	return net.createServer(function(socket) {
        miners.set(++id, socket);
        socket.poolConnection = poolConnection(socket);
		socket.on('data', function(data) {}).pipe(ldj.parse()).on('data', function(obj) {
			//forward data to the pool_listener to handle. 
			console.log('====================================')
			
			obj.id = id;
			var rpcjson = JSON.stringify(obj);
			console.log('miner listener received data' + rpcjson);
			socket.poolConnection.write(rpcjson + '\n');
			console.log('this data has been sent to the mining pool')
			console.log('====================================')
		});

		socket.on('end', function() {
			console.log('miner disconnected');
			socket.poolConnection.end();
			miners.forEach(function(value, key) {
				if (value === socket) {
					console.log('removing connection from dictionary');
					miners.delete(key);
				}
			});
		});

		socket.on('error',function(er){
			switch (er.code) {
				case 'ECONNRESET':
					console.log('client close connection!')
					socket.end();
					socket.emit('end');
					break;
				case 'EADDRINUSE':
					console.log('Address in use, retrying...');
					setTimeout(function () {
						socket.close();
						socket.poolConnection = poolConnection(socket);
					}, 1000);
					break;
				default:
					console.log(er);
					break;
			}
		});
	});
};

//====================== pool connection ================================
function poolConnection(miner) {
	var option = global.pools.get(miner.localPort);
	var poolSocket = net.createConnection({
		port: option.port,
		host: option.host
	});

	poolSocket.on('connect', function(connect){
		console.log(`proxy connected to ${option.host}:${option.port}`);
	});

	poolSocket.on('error', function(error) {
		console.log('the socket had a error: ' + error)
	});

	poolSocket.on('data', function(data) {}).pipe(ldj.parse()).on('data', function(obj) {
		console.log('====================================')
        console.log('pool socket has received data' + JSON.stringify(obj));
        miner.write(JSON.stringify(obj) + '\n');
		console.log('====================================')
	});

	poolSocket.on('end', function() {
		console.log('the pool closed the connection');
	});

	return poolSocket;
};


exports.miners = miners;
