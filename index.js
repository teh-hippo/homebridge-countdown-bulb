var Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-countdown-bulb", "CountdownBulb", countdownBulb);
}


function countdownBulb(log, config, api) {
    let UUIDGen = api.hap.uuid;

    this.log = log;
    this.name = config['name'];
    this.interval = Math.max(1, config['interval']);
    this.timer;
    this.brightness = 0;
    this.uuid = UUIDGen.generate(this.name);
}

countdownBulb.prototype.getServices = function () {
    var informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Manufacturer, "Countdown Switch")
        .setCharacteristic(Characteristic.Model, `Interval-${this.interval}ms`)
        .setCharacteristic(Characteristic.SerialNumber, this.uuid);


    this.lightbulbService = new Service.Lightbulb(this.name);

    this.lightbulbService.getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));

    this.lightbulbService.getCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));

    var services = [informationService, this.lightbulbService]
    return services;

}

countdownBulb.prototype.getBrightness = function (callback) {
    callback(null, this.brightness);
}

countdownBulb.prototype.setBrightness = function (brightness, callback) {
  this.log(`[${this.name}] User updating the brightness: ${brightness} (currently: ${this.brightness})`);
  this.brightness = Math.min(100, brightness);
  this.lightbulbService.getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
  clearInterval(this.timer);

  if (this.brightness <= 0) {
      this.log(`[${this.name}] Clearing a running timer`);
  } else if (this.brightness > 0) {
      this.log(`[${this.name}] Starting a countdown from: ${this.brightness} (interval: ${this.interval})`);
      this.timer = setInterval(function() {
        this.log(`[${this.name}] Timer update: ${this.brightness} (currently: ${--this.brightness})`);  
        this.lightbulbService.getCharacteristic(Characteristic.Brightness).updateValue(this.brightness);
        this.lightbulbService.getCharacteristic(Characteristic.On).updateValue(this.brightness > 0);
        if (this.brightness <= 0) {
          this.log(`[${this.name}] Countdown has completed`);
          this.brightness = 0;
          clearInterval(this.timer);
        }
      }.bind(this), this.interval);
    }
  
    callback();
}

countdownBulb.prototype.getOn = function (callback) {
  callback(null, this.brightness > 0);
}

countdownBulb.prototype.setOn = function (on, callback) {
  this.log(`[${this.name}] Attempt to set on to: ${on} (brightness: ${this.brightness})`);
  callback();
}
