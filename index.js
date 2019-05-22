'use strict';

const request = require('request-promise-native');
const version = require('./package.json').version;
const API_URL = 'https://ollehtvplay.ktipmedia.co.kr/otp/v1';
let Service;
let Characteristic;
let logger;
let requestOptions = {
	method: 'POST',
	uri: API_URL + url,
	headers: {
		'Accept-Language': 'ko-kr',
		'User-Agent': '%EC%98%AC%EB%A0%88%20tv%play/3.0.2 CFNetwork/808.2.16 Darwin/16.3.0'
	},
	json: true,
	body: {
		DEVICE_ID: undefined,
		SVC_ID: 'OTP',
		SVC_PW: undefined
	}
};

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-ollehtv', 'OllehTV', OllehTV);
}

function sender(url, params) {
	if (params) {
		Object.assign(requestOptions.body, params);
	}

	return request(requestOptions);
}

function OllehTV(log, config) {
	logger = log;

	this.services = [];
	this.name = config.name || 'Olleh TV';
	this.interval = config.interval || 5000;
	requestOptions.body.DEVICE_ID = config.id;
	requestOptions.body.SVC_PW = config.token;
	this.operatingState = false;

	// olleh tv remote controller buttons
	this.buttonGroup = {
		JIUGI: 8,
		HWAGIN: 10,
		NAGAGI: 27,
		HOME: 36,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		ZERO: 48,
		ONE: 49,
		TWO: 50,
		THREE: 51,
		FOUR: 52,
		FIVE: 53,
		SIX: 54,
		SEVEN: 55,
		EIGHT: 56,
		NINE: 57,
		STAR: 112,
		POUND: 113,
		IJEON: 115,
		RED: 403,
		GREEN: 404,
		YELLOW: 405,
		BLUE: 406,
		POWER: 409,
		REWIND: 412,
		STOP: 413,
		PLAY_PAUSE: 415,
		FAST_FORWARD: 417,
		CHANNEL_UP: 427,
		CHANNEL_DOWN: 428,
		VOLUME_UP: 447,
		VOLUME_DOWN: 448,
		MUTE: 449
	};

	this.stateGroup = {
		OFF: 0,
		STANDBY: 1,
		ON: 2
	};

	if (!requestOptions.body.DEVICE_ID) {
		throw new Error('Your must provide id of the Olleh TV.');
	}

	if (!requestOptions.body.SVC_PW) {
		throw new Error('Your must provide token of the Olleh TV.');
	}

	this.service = new Service.Television(this.name);
	this.serviceInfo = new Service.AccessoryInformation();

	this.serviceInfo
		.setCharacteristic(Characteristic.Manufacturer, 'Olleh TV')
		.setCharacteristic(Characteristic.FirmwareRevision, version);

	this.service
		.setCharacteristic(Characteristic.ConfiguredName, this.name)
		.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

	this.service
		.getCharacteristic(Characteristic.Active)
        .on('get', this.getPowerState.bind(this))
		.on('set', this.setPowerState.bind(this));

	this.services.push(this.service);
	this.services.push(this.serviceInfo);
	
	this.discover();
}

OllehTV.prototype = {
	discover: function () {
		const that = this;

		setInterval(function () {
			that.updateState.bind(this);
		}, that.interval);
	},

	getPowerState: function (callback) {
		callback(null, this.operatingState);
	},

	setPowerState: function (state, callback) {
		const that = this;

		sender('/rmt/inputButton', {
			KEY_CD: that.buttonGroup.POWER
		}).then(result => {
			if (result && result.STATUS) {
				if (result.STATUS && result.STATUS.CODE == 0) {
					callback();
				} else {
					callback(new Error(result.STATUS.MESSAGE));
				}
			} else {
				callback(new Error(result.STATUS.MESSAGE));
			}
		}).catch(error => {
			callback(new Error('Communication with Olleh TV failed.'));
		});
	},

	updateState: function () {
		const that = this;

		sender('/rmt/getCurrentState').then(result => {
			if (result && result.STATUS) {
				if (result.STATUS && result.STATUS.CODE == 0 && result.STATUS.DATA) {
					/*
					* CHNL_NM: channel name
					* CHNL_NO: channel number
					* PRGM_ID: program id
					* PRGM_NM: program name
					* STRT_TM: start time
					* FIN_TM: end time
					* STB_STATE: state(0: OFF, 1: STANDBY, 2: ON)
					*/

					that.operatingState = (result.STATUS.DATA.STB_STATE != that.stateGroup.OFF);

					that.service
						.getCharacteristic(Characteristic.ActiveIdentifier)
						.updateValue(result.STATUS.DATA.PRGM_ID);

					that.service
						.getCharacteristic(Characteristic.ConfiguredName)
						.updateValue(result.STATUS.DATA.PRGM_NM);
				} else {
					callback(new Error(result.STATUS.MESSAGE));
				}
			} else {
				callback(new Error(result.STATUS.MESSAGE));
			}
		}).catch(error => {
			callback(new Error('Communication with Olleh TV failed.'));
		});
	},

	identify: function (callback) {
		callback();
	},

	getServices: function () {
		return this.services;
	}
};
