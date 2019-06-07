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

function sender(uri, params) {
	let requestOptions = {
		method: 'POST',
		url: API_URL + uri,
		headers: {
			'User-Agent': 'compatible;ServiceType/OTP;OSType/Android;DeviceModel/Nexus 6;OSVersion/5.1.1;AppName/OllehTvPlay;AppVersion/03.01.14'
		},
		json: true,
		body: {
			SVC_ID: 'OTP'
		}
	};
	
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
	this.deviceId = config.deviceId;
	this.token = config.token;
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
		OFF: '1',
		ON: '2'
	};

	if (!this.deviceId) {
		throw new Error('Your must provide device id of the Olleh TV.');
	}

	if (!this.token) {
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
		setInterval(this.updateState.bind(this), this.interval);
	},

	getPowerState: function (callback) {
		callback(null, this.operatingState);
	},

	setPowerState: function (state, callback) {
		const that = this;

		sender('/rmt/inputButton', {
			KEY_CD: that.buttonGroup.POWER,
			DEVICE_ID: that.deviceId,
			SVC_PW: that.token
		}).then(result => {
			if (result && result.STATUS) {
				if (result.STATUS.CODE == '000') {
					that.operatingState = state;
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

		sender('/rmt/getCurrentState', {
			DEVICE_ID: that.deviceId,
			SVC_PW: that.token
		}).then(result => {
			if (result && result.STATUS) {
				if (result.STATUS.CODE == '000' && result.DATA) {
					/*
					* CHNL_NM: channel name
					* CHNL_NO: channel number
					* PRGM_ID: program id
					* PRGM_NM: program name
					* STRT_TM: start time
					* FIN_TM: end time
					* STB_STATE: state(1: OFF, 2: ON)
					*/

					let stbState = (result.DATA.STB_STATE != that.stateGroup.OFF);
					
					if (stbState != that.operatingState) {
						that.operatingState = stbState;
						that.service
							.getCharacteristic(Characteristic.Active)
							.updateValue(that.operatingState);
					}

					that.service
						.getCharacteristic(Characteristic.ActiveIdentifier)
						.updateValue(result.DATA.CHNL_NO);

					that.service
						.getCharacteristic(Characteristic.ConfiguredName)
						.updateValue(result.DATA.PRGM_NM);
				} else {
					logger.error(new Error(result.STATUS.MESSAGE));
				}
			} else {
				logger.error(new Error(result.STATUS.MESSAGE));
			}
		}).catch(error => {
			logger.error(new Error('Communication with Olleh TV failed.'));
		});
	},

	identify: function (callback) {
		callback();
	},

	getServices: function () {
		return this.services;
	}
};
