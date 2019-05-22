'use strict';

const request = require('request-promise-native');
const version = require('./package.json').version;
const API_URL = 'https://ollehtvplay.ktipmedia.co.kr/otp/v1';
let Service;
let Characteristic;
let logger;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-ollehtv', 'OllehTV', OllehTV);
}

function sender(url, params) {
	let options = {
		method: 'POST',
		uri: API_URL + url,
		headers: {
			'Accept-Language': 'ko-kr',
			'User-Agent': '%EC%98%AC%EB%A0%88%20tv%play/3.0.2 CFNetwork/808.2.16 Darwin/16.3.0'
		}
	};

	if (options.method == 'POST' || options.method == 'PUT') {
		options.body = params;
		options.json = true;
	} else if (options.method == 'GET' || options.method == 'DELETE') {
		options.qs = params;
		options.json = false;
	}

	return request(options);
}

function OllehTV(log, config) {
	logger = log;

	this.services = [];
	this.name = config.name || 'Olleh TV';
	this.token = config.token;

	if (!this.token) {
		throw new Error('Your must provide token of the Olleh TV.');
	}

	this.service = new Service.Television(this.name);
	this.serviceInfo = new Service.AccessoryInformation();

	this.serviceInfo
		.setCharacteristic(Characteristic.Manufacturer, 'Olleh TV')
		.setCharacteristic(Characteristic.FirmwareRevision, version);

	this.services.push(this.service);
	this.services.push(this.serviceInfo);
	
	this.discover();
}

OllehTV.prototype = {
	discover: function () {

	},

	identify: function (callback) {
		callback();
	},

	getServices: function () {
		return this.services;
	}
};
