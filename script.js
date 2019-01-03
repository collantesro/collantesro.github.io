"use strict";

// This is very likely more optimizeable...
// The point of this is to implement the math equations needed for a clock
// and to learn more about canvas drawing.

// Helpful functions:
// Convert degrees to radians
const degToRad = degrees => degrees * (Math.PI / 180);
// "Rotates" the degree pi/2 counter-clockwise
const clockOffset = degrees => degToRad(degrees) - Math.PI/2;
// Normalizes vectors
const normalize = ({x, y}) => ({x: x / Math.sqrt(x*x + y*y), y: y / Math.sqrt(x*x + y*y)});

const perSecAngleDeg = 360/60;
const secJiggleAngle = ms => degToRad(perSecAngleDeg) / 2 * Math.cos(ms/32) / Math.pow(2,ms/64);

var continuous = document.querySelector("#rdContinuous").checked;

const updateClockTickStyle = ()=>{
    let rdContinuous = document.querySelector("#rdContinuous");
    continuous = rdContinuous.checked;
}

document.querySelector("#rdContinuous").addEventListener("click", updateClockTickStyle);
document.querySelector("#rdTick").addEventListener("click", updateClockTickStyle);

// Prepare Canvas:
let canvas = document.querySelector("#clockCanvas");
let context = canvas.getContext("2d");
let logicSizes = {width: canvas.width, height: canvas.height};
canvas.width *= window.devicePixelRatio;
canvas.height *= window.devicePixelRatio;
canvas.style.width = 400 + "px";
canvas.style.height = 400 + "px";
let realSize = {width: canvas.width, height: canvas.height};
canvas = logicSizes;
context.scale(window.devicePixelRatio,window.devicePixelRatio);
context.translate(canvas.width/2, canvas.height/2);

// Clock background
let radius = canvas.width / 3;
context.beginPath();
context.arc(0,0, radius * 1.025, 0, Math.PI*2);
context.fillStyle = "#fff";
context.fill();

// Clock Outline
context.beginPath();
context.arc(0, 0, radius, 0, Math.PI*2);
context.lineWidth = 3;
context.stroke();

// Numbers & Major Ticks
let hours = [...Array(12).keys()];
hours[0] = 12;

context.font = ((radius * 0.15)|0) + "px Sans-Serif";
context.textBaseline = "middle";
context.textAlign = "center";
context.fillStyle = "Black";

let i = 0;
hours.forEach(h=>{
    let pos = {
        x: Math.cos(clockOffset(i * 30)),
        y: Math.sin(clockOffset(i * 30))
    };
    context.fillText(h.toString(), radius*0.8 * pos.x, radius*0.8 * pos.y);
    
    // Normalized Vector in order to be able to draw lines 
    let nvec = normalize(pos);

    context.beginPath();
    context.moveTo(pos.x * radius, pos.y * radius);
    context.lineTo(pos.x * radius - radius*0.075 * nvec.x, pos.y * radius - radius*0.075 * nvec.y);
    context.stroke();
    i++;
});

// Minute Tick Marks
context.lineWidth = 2;
[...Array(60).keys()].forEach(k=>{
    let pos = {
        x: Math.cos(clockOffset(k * 6)),
        y: Math.sin(clockOffset(k * 6))
    };
    let nvec = normalize(pos);

    context.beginPath();
    context.moveTo(pos.x * radius, pos.y * radius);
    context.lineTo(pos.x * radius - radius/20 * nvec.x, pos.y * radius - radius/20 * nvec.y);
    context.stroke();
});

// Save the clock skeleton for reuse in tick()
let skeleton = context.getImageData(0,0, realSize.width, realSize.height);

// Function to draw the arms of the clock
const tick = ()=>{
    // Paper over the old frame:
    context.putImageData(skeleton, 0, 0);

    // Get Time:
    let now = new Date();
    let millis = now.getMilliseconds();
    if(continuous){
        var secs = now.getSeconds() + millis / 1000;
    } else {
        var secs = now.getSeconds();
    }
    let mins = now.getMinutes() + secs/60;
    let hours = now.getHours() % 12 + mins/60;

    // What angle from the origin is it for each hand
    let hourAngle = clockOffset(hours * 30);
    let minAngle = clockOffset(mins * 6);
    let secAngle = clockOffset(secs * perSecAngleDeg);
    if(!continuous){
        secAngle += secJiggleAngle(millis);
    }

    // Calculating the vectors for each hand
    let hour = {
        x: radius*0.5 * Math.cos(hourAngle),
        y: radius*0.5 * Math.sin(hourAngle)
    };
    let min = {
        x: radius*0.8 * Math.cos(minAngle),
        y: radius*0.8 * Math.sin(minAngle)
    };
    let sec = {
        x: radius*0.9 * Math.cos(secAngle),
        y: radius*0.9 * Math.sin(secAngle)
    };
    
    // Normalizing the previous vectors to draw lines backward
    let hourN = normalize(hour);
    let minN = normalize(min);
    let secN = normalize(sec);

    // AM/PM text
    context.font = ((radius * 0.12)|0) + "px Sans-Serif";
    context.fillText( (now.getHours() / 12) | 0 == 1 ? "PM" : "AM", radius*0.375, radius*0.375 );

    // Draw Hour hand:
    context.lineWidth = 3;
    context.strokeStyle = "#000";
    context.beginPath();
    context.moveTo(-10*hourN.x, -10*hourN.y);
    context.lineTo(hour.x, hour.y);
    context.stroke();

    // Draw Minute hand:
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-10*minN.x, -10*minN.y);
    context.lineTo(min.x, min.y);
    context.stroke();

    // Draw Second hand in red:
    context.lineWidth = 1;
    context.strokeStyle = "#f00";
    context.beginPath();
    context.moveTo(-20*secN.x, -20*secN.y);
    context.lineTo(sec.x, sec.y);
    context.stroke();

    // Draw a little... cap/circle over the hands at the center
    context.beginPath();
    context.arc(0, 0, radius/32, 0, Math.PI*2);
    context.fill();

    // And repeat:
    requestAnimationFrame(tick);
};

// Kick it all off:
tick();
