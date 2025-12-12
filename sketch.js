// is working. !!

//oscillator visualization integration:

//variables
let mic, osc;

var analyzer;
var numSamples = 1024;

let frequency = 110;

//===============
// mode Select
//===============
//let inputMode = 0;

//array of amplitude values (-1 to +1) over time
var samples = [];
var currentSource = "mic";

let hueZ;

// let frequency = 110;
// let amp = 0.5;

//original sketch:

const akebonoFreqs = [
        18.0203, // index 0
        20.2271, //index 1
        21.4299, //index 2
    27.0, 30.3065, 36.0407, 40.4542, 42.8598, 
    54.0, //index 8
    60.6129,
    72.0814,
    80.9086,
    85.7197,
        108.0, // index 13
        121.2259,
        144.1627,
        161.8172,
        171.4393,
    216.0,
    242.4519,
    288.3254,
    323.6344,
    342.8786,
  // original A4 (440 now 432hz);
    432.0, 484.9036, 576.7, 647.3, 685.8, 
    864.0, 969.8072, 1153.3017, 1294.5373, 1371.5145,
    1728.0, 1939.6144, 2306.6032, 2589.0747, 2743.0291,
    3456.0, 3879.2288, 4613.2065, 5178.1492, 5486.058,
    6912.0, 7758.4577, 15516.9153

    // organized by pentatonic rows
];


const bellHarmonics = {
    //harmonics 2 - 6x for square waves;

    squareWaveRatios: [
        { ratio: 2.0, name: "2nd Harmonic" },
        { ratio: 3.0, name: "3rd Harmonic" },
        { ratio: 4.0, name: "4th Harmonic" },
        { ratio: 5.0, name: "5th Harmonic" },
        { ratio: 6.0, name: "6th Harmonic" }
    ],
    // harmonics 6x to 13x for sine waves
    sineWaveRatios: [
        { ratio: 6.0, name: "6th Harmonic" },
        { ratio: 7.0, name: "7th Harmonic" },
        { ratio: 8.0, name: "8th Harmonic" },
        { ratio: 9.0, name: "9th Harmonic" },
        { ratio: 10.0, name: "10th Harmonic" },
        { ratio: 11.0, name: "11th Harmonic" },
        { ratio: 12.0, name: "12th Harmonic" },
        { ratio: 13.0, name: "13th Harmonic" }
    ]
}

let gloAtk, gloDec, gloSus, gloRel;

// Keys for pentatonic scale
const keyMap = ['A', 'S', 'F', 'G', 'H', 'K', 'L'];
const japaneseNoteNames = ['ロ', 'ハ', 'ニ', 'ホ', 'ヘ', 'イ', 'キ']; // Example for one octave

let octave = 2;
let activeOscs = [];

let noteIndx = 13;
let noteBuffer = 0;

let cnv2;

function setup() {
  
  createCanvas(550, 620);
 
  
  cnv2 = createGraphics(550, 620);
  
   textFont('monospace');
  cnv2.textFont('monospace');
  colorMode(HSL, 360, 100, 100, 100);
  hueZ = 0;
 
  textSize(16);
  
  analyzer = new p5.FFT(0.33, numSamples);
  
  //set up various inputs, toggle when T key is pressed
  
  mic = new p5.AudioIn();
  
  
  
}

function keyPressed() {
  // Octave selection
  if (key >= '1' && key <= '7') {
    octave = int(key) - 1;
    return;
  }
  
  let idx = keyMap.indexOf(key.toUpperCase());
  if (idx !== -1) {
    // add three to start key mapping at an even fundamental.
    playBellNote(3 + idx + octave * 5); 
    // There are 5 pentatonic notes per octave
  }
  
    if(keyCode == '37'){
      if(noteBuffer == 0){
        noteBuffer = 1;
      } else if (noteBuffer == 1){
        noteIndx = noteIndx - 1;
      }
     if(noteIndx < 0){
       noteIndx = 0;
      }
     playBellNote(noteIndx);
       }
  
   if(keyCode == '39'){
     
     
     if(noteIndx > akebonoFreqs.length){
       noteIndex = akebonoFreqs.length;
     }
   }
}

function playBellNote(i) {
  // Three oscillators for bell timbre
  // call base freq from array of akebono freqs.
  let baseFreq = akebonoFreqs[i % akebonoFreqs.length];
  
  //let ratios = [1, 1.01, 3.98]; not used anymore
  //arrays to hold all active oscillators and envelopes for cleanup
  let envelopes = [];
  let oscs = [];

  // helper function to create and start oscillator
  const createOscillator = (type, freq, amp, delay = 0) => {
    let osc = new p5.Oscillator(type);
    osc.freq(freq);;

    let env = new p5.Envelope();
    //use global A.D.S.R. settings (gloatk etc...)
    env.setADSR(gloAtk, gloDec, gloSus, gloRel);
    //env.setADSR(0.01, 0.5, 0, 5);
    //set max amp to desired level
    env.setRange(amp, 0);

    osc.amp(env);
    osc.start();
    env.play(osc, delay, 0.15); //start envelope

    oscs.push(osc);
    envelopes.push(env);

    //stop oscillator after release (2400ms as per existing code)
    setTimeout(() => osc.stop(), 6800);
  };

  // --1. fundamental freq (sin and saw)

  const sineAmp = random(0.88, 1.05); // max amplitude main component
  createOscillator('sine', baseFreq, sineAmp);

  //2nd osc sawtooth timbral component
  const sawAmp = random(0.74, 0.92);
  createOscillator('saw', baseFreq, sawAmp);

  // 2. square wave harmonix, rand chosen from 2x to 6x

  //create copy of ratios array to select from w/o duplication
  let availableSquareRatios = [...bellHarmonics.squareWaveRatios];

  //select 2 non-duplicate ratios
  let selectedSquareRatios = [];
  for (let k = 0; k < 2; k++){
    if(availableSquareRatios.length === 0) break;

    //randomly select an index and remove it from available list
    let randomIndex = floor(random(availableSquareRatios.length));
    let selectedRatio = availableSquareRatios[randomIndex];

    selectedSquareRatios.push(selectedRatio);
    availableSquareRatios.splice(randomIndex, 1);
  }

  //create the two square wave oscillators

  const squareAmp = random(0.71, 0.85)*sineAmp;
  selectedSquareRatios.forEach(item => {
    createOscillator('square', baseFreq * item.ratio, squareAmp);
  });

  //--------3.. sine wave harmonics (rand chose from 6x to 13x)

  let availableSineRatios = [...bellHarmonics.sineWaveRatios];

  //select 3 non duplicate ratios
  let selectedSineRatios = [];
  for(let k = 0; k < 3; k++) {
    if(availableSineRatios.length === 0) break;

    ////randomly select an index and remove from list
    let randomIndex = floor(random(availableSineRatios.length));
    let selectedRatio = availableSineRatios[randomIndex];

    selectedSineRatios.push(selectedRatio);
    availableSineRatios.splice(randomIndex, 1);
  }
  const sineHarmonicAmp = sineAmp * 0.77;
  selectedSineRatios.forEach(item => {
    createOscillator('sine', baseFreq * item.ratio, sineHarmonicAmp);
  });

  // Visual feedback
  let wn = getWesternNote(baseFreq); // function to convert to nearest MIDI note name
  let japanese = japaneseNoteNames[i % japaneseNoteNames.length];
  
  drawInfo(baseFreq, wn, japanese);

}
//   for (let j = 0; j < 1; j++) {
//     let freq = baseFreq * ratios[j];
//     let osc = new p5.Oscillator();
//     osc.setType(j === 0 ? 'sine' : 'triangle');
//     osc.freq(freq);

//     let env = new p5.Envelope();
//     env.setADSR(gloAtk, gloDec, gloSus, gloRel); // sharp attack, long release
//     env.setRange(1, 0);

//     osc.amp(env);
//     osc.start();
//     env.play(osc, 0, 0.15);

//     oscs.push(osc);
//     envelopes.push(env);

//     // Stop oscillator after release
//     setTimeout(() => osc.stop(), 2400);

  //activeOscs.push(...oscs);

  


//handle positionds for ADSR curve
let handles = [
    {x: 101, y: 300}, // attack
    {x: 102, y: 170}, // decay
    {x: 150, y: 270}, // sustain
    {x: 200, y: 290} // release end
];
let dragging = [-1, -1, -1, -1];
let handleRadius = 12;

function draw() {
    //background(23, 128);
    fill(64, 128);
    rect(0, 150, width, height);

//drawInfo(baseFreq, wn, japanese);
  
  background(hueZ,90, 20, 20);
  
  //get buffer of 512 samples over time 
  samples = analyzer.waveform();
  var bufferLength = samples.length;
  
  //draw a snapshot of the samples
  strokeWeight(100);
  stroke(180-hueZ, 75, 75, 40);
  noFill();
  
  //===================
  // draw oscilloscope
  //===================
  
  beginShape();
  strokeWeight(random(0.25,1.25));
  for(let i = 0; i < bufferLength; i++) {
    var x = map(i, 0, bufferLength, 0, width);
    var y = map(samples[i], -0.5, 0.5, -height/1.5, height/1.5);
    //strokeWeight(1);
    //vertex(x, y + height/2);
    //adjustar y aqui para m,odificar efecto visual.
    //
    
    line(width/2+y, height, width/2-y, 0);
  }
  endShape();
  
    beginShape();
  strokeWeight(random(2, 7));
  for(let i = 0; i < bufferLength; i++) {
    var x = map(i, 0, bufferLength, 5, width-5);
    var y = map(samples[i], -0.5, 0.5, -height/1.5+50, height/1.5-50);
    
    vertex(x, y + height/2);
    //adjustar y aqui para m,odificar efecto visual.
    
    //line(width/2+y, height, width/2-y, 0);
  }
  endShape();
  
  //map oscillator frequency to mouse position
  
  //osc.freq(frequency, 0.1);
  amp = map(mouseX, height, 0, 0, 1);
  
  if(hueZ >=360){
  hueZ = hueZ - 360;
  } else {
  hueZ = hueZ + 0.2;
}
  let c = 1+sin(millis()/512)/2;
  
  for(i = 0; i<= 32; i++){
    for(u = 0; u<=32; u++){
      stroke(360-hueZ, 80, 25, 25);
      
      
      strokeWeight(0.5*c);
    line(map(i, 0, 32, 0, width), height, width/2-150+u*10, 0)
    }
  }
  
  
  
     stroke(255);
    fill(255);
    textSize(16);
    text("~graphic a.d.s.r. editor~", width/2, 170);
  textSize(11);
  text("Attack = Sound Onset", width/2+50, 200);
  text("Decay = Rate of Fall", width/2+50, 230);
  text("Sustain = level maintained", width/2+50, 260);
  text("Release = time to fade away", width/2+50, 290);
  
   // draw adsr curve as lines
    stroke(0);
    strokeWeight(3);
    noFill();
    textSize(10);
    beginShape();
    for (let h of handles)  vertex(h.x, h.y);
    endShape();

    // draw drag handles
    for(let i=0; i<handles.length; i++) {
        fill(dragging[i]==1 ? 'deeppink' : 'honeydew');
        stroke(0);
        ellipse(handles[i].x, handles[i].y, handleRadius * 2);
        //fill(0);
        text(['A', 'D', 'S', 'R'][i], handles[i].x-7, handles[i].y-15);
      stroke(90, 100, 70);
      fill(0, 0, 0, 50)
        text(`x:${handles[i].x}, y:${handles[i].y}`, handles[i].x-25, handles[i].y+25);
    }

    // optionally, display calculated a.d.s.r. values
    let attackTime = (handles[0].x - 100) / 100;
    let decayTime = (handles[1].x - handles[0].x) / 100;
    let sustainLevel = 1 - (handles[2].y-180) / 100;
    let releaseTime = (handles[3].x - handles[2].x) / 10;
    stroke(0)
    fill(0, 0, 75, 100);
    textSize(14);
    text(`Attack: ${attackTime.toFixed(2)}s`, 10, 350);
    text(`Decay: ${decayTime.toFixed(2)}s`, 140, 350);
    text(`Sustain: ${sustainLevel.toFixed(2)}`, 260, 350);
    text(`Release: ${releaseTime.toFixed(2)}s`, 380, 350);

    gloAtk = attackTime;
    gloDec = decayTime;
    gloSus = sustainLevel;
    gloRel = releaseTime;
  
  //call text display;
  labelStuff(frequency, amp);
  image(cnv2, 0, 0);
  
}

function labelStuff(frequency, amp) {
  fill(0);
  stroke(360);
  // cnv2.text('T = Toggle', 20, 120);
  // cnv2.text('Source: '+currentSource, 20, 40);
  //if currentSource is oscillator
  
  if(currentSource === 'sine' || currentSource == 'triangle' || currentSource == 'sawtooth' || currentSource == 'square'){
    cnv2.text('Frequency: '+frequency, 20, 60);
     cnv2.text('Amplitude: '+ amp, 20, 80);
  }
}

function mousePressed() {
    for (let i = 0; i<handles.length; i++) {
        let d = dist(mouseX, mouseY, handles[i].x, handles[i].y);
        if(d < handleRadius) dragging[i]=1;
    }
}

function mouseDragged() {
    for(let i=0; i<handles.length; i++) {
        if(dragging[i]==1) {
            handles[i].x = constrain(mouseX, 50, width);
            handles[i].y = constrain(mouseY, 25, height);
        }
    }
}

function mouseReleased() { dragging = [-1, -1, -1, -1]; }

function drawInfo(freq, wn, japanese) {
  //background(255);
  cnv2.textSize(17);
  
  cnv2.fill(hueZ, 25, 85, 44);
  cnv2.rect(190, 35, 350, 80, 25);
  
  
  cnv2.fill(0, 0, 0, 95);
  cnv2.rect(225, 45, 230, 15, 10);
  cnv2.rect(235, 65, 180, 15, 10);
  cnv2.rect(245, 85, 250, 15, 10);
  
  cnv2.fill(360, 100, 100);
  cnv2.text(`Frequency: ${freq.toFixed(4)} Hz`, 230, 60);
  cnv2.text(`Western Note: ${wn}`, 240, 80);
  cnv2.text(`katakana: [translate:${japanese}]`, 250, 99);
}

// Find approximate Western letter note
function getWesternNote(freq) {
  // MIDI note formula: 69 + 12*log2(freq/440)
  let midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let note = noteNames[midi % 12];
  let octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}



// function keyPressed() {
//
// }