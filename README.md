[![npm version](https://badge.fury.io/js/homebridge-ollehtv.svg)](https://badge.fury.io/js/homebridge-ollehtv)

# homebridge-raspberrypi-remote

This is Olleh TV plugin for [Homebridge](https://github.com/nfarina/homebridge). 



### Features

* Switch on / off.



### Installation

1. Install required packages.

   ```
   npm install -g homebridge-ollehtv
   ```

2. Record down the `token` and `password` values as we need it in our configuration file later.

3. Add these values to `config.json`.

    ```
      "accessories": [
        {
          "accessory": "OllehTV",
          "name": "Olleh TV",
          "token": "TOKEN_FROM_STEP_2"
        }
      ]
    ```

4. Restart Homebridge, and your Olleh TV will be added to Home app.



### License

See the [LICENSE](https://github.com/clauzewitz/homebridge-ollehtv/blob/master/LICENSE.md) file for license rights and limitations (MIT).
