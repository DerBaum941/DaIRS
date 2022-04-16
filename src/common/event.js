const Emitter = new(require('events'));
exports.Emitter = Emitter;

Emitter.on('SuperCoolEvent',()=>{
    console.log("Event ran");
});