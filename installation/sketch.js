let cell = 22;
let cols, rows;
let glow = [];
let stars = [];
let maxSlots = 400;
let starCount = 0;
let word = "constellation";
let maxStars = 25;
let minDist = 3;
let linkDist = 8;
let t = 0;
// camera
let video;
let showVideo = false;
let threshold = 40;
let learning = 30;
let whiteboard = true;
let leaveFade = 0.02;
let note = "";
let noteTime = -9999;

class Star {
  constructor(i, j, pinned) {
    this.i = i;
    this.j = j;
    this.life = 1;
    this.show = 0;
    this.fade = random(0.003, 0.006);
    this.pinned = pinned;
    this.camera = false;
    this.missing = 0;
  }

  strength() {
    if (this.pinned) return this.show;
    return min(this.show, this.life);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textFont("Helvetica");
  textSize(32);

  cols = floor(width / cell);
  rows = floor(height / cell);
  for (let k = 0; k < cols * rows; k++) {
    glow[k] = 0;
  }

  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();
}

function draw() {
  background(0, 4, 10);
  t += 0.005;

  if (showVideo) {
    tint(0, 255, 255, 80);
    image(video, 0, 0, width, height);
    noTint();
  }

  if (frameCount % 3 == 0) {
    findDots();
  }
  updateStars();
  updateGlow();
  drawLines();
  drawLetters();
  drawNote();
}

function addStar(i, j, pinned) {
  if (starCount < maxSlots) {
    stars[starCount] = new Star(i, j, pinned);
    starCount++;
    return stars[starCount - 1];
  }
  return null;
}

function updateStars() {
  let target = maxStars * (0.4 + noise(t * 2, 100));

  let oldCount = starCount;
  for (let k = 0; k < oldCount; k++) {
    let s = stars[k];
    if (!s.pinned) s.life -= s.fade;
    s.show = min(1, s.show + 0.02);

    if (random(1) < 0.015 && backgroundCount() < target) {
      let angle = random(TWO_PI);
      let d = random(minDist, minDist + 3);
      let ni = round(s.i + cos(angle) * d);
      let nj = round(s.j + sin(angle) * d);
      if (insideGrid(ni, nj) && farFromStars(ni, nj)) {
        addStar(ni, nj, false);
      }
    }
  }

  for (let k = starCount - 1; k >= 0; k--) {
    if (stars[k].life <= 0) {
      stars[k] = stars[starCount - 1];
      starCount--;
    }
  }

  if (backgroundCount() < target && random(1) < 0.05) {
    for (let tries = 0; tries < 20; tries++) {
      let i = floor(random(cols));
      let j = floor(random(rows));
      if (noise(i * 0.1, j * 0.1, t) > 0.5 && farFromStars(i, j)) {
        addStar(i, j, false);
        break;
      }
    }
  }
}

function backgroundCount() {
  let count = 0;
  for (let k = 0; k < starCount; k++) {
    if (!stars[k].pinned) count++;
  }
  return count;
}

function farFromStars(i, j) {
  for (let k = 0; k < starCount; k++) {
    if (dist(i, j, stars[k].i, stars[k].j) < minDist) {
      return false;
    }
  }
  return true;
}

function insideGrid(i, j) {
  return i >= 0 && i < cols && j >= 0 && j < rows;
}

function updateGlow() {
  let target = [];
  for (let k = 0; k < cols * rows; k++) {
    target[k] = 0;
  }
  for (let k = 0; k < starCount; k++) {
    let s = stars[k];
    target[s.i + s.j * cols] = s.strength();
  }
  for (let k = 0; k < cols * rows; k++) {
    glow[k] = lerp(glow[k], target[k], 0.08);
  }
}

function drawLines() {
  strokeWeight(1.5);
  for (let a = 0; a < starCount; a++) {
    for (let b = a + 1; b < starCount; b++) {
      let sa = stars[a];
      let sb = stars[b];
      let d = dist(sa.i, sa.j, sb.i, sb.j);
      if (d < linkDist) {
        let alpha = map(d, 0, linkDist, 255, 60) * min(sa.strength(), sb.strength());
        stroke(0, 255, 255, alpha);
        line(sa.i * cell + cell / 2, sa.j * cell + cell / 2,
             sb.i * cell + cell / 2, sb.j * cell + cell / 2);
      }
    }
  }
}

function drawLetters() {
  noStroke();
  textStyle(NORMAL);
  drawLetterPass(false);
  textStyle(BOLD);
  drawLetterPass(true);
}

function drawLetterPass(boldPass) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let g = glow[i + j * cols];
      let isBold = g > 0.4;
      if (isBold != boldPass) continue;

      let x = i * cell + cell / 2;
      let y = j * cell + cell / 2;
      let letter = word.charAt((i + j * cols) % word.length);

      let n = noise(i * 0.1, j * 0.1, t);
      let size = lerp(cell * 0.5, cell * 0.95, g) + n * 3;
      let bright = lerp(30 + n * 50, 255, g);

      fill(0, bright, bright);
      push();
      translate(x, y);
      scale(size / 32.0);
      text(letter, 0, 0);
      pop();
    }
  }
}

// ---------- camera ----------

function findDots() {
  if (video.elt.readyState < 2) return;
  video.loadPixels();

  if (learning > 0) {
    for (let y = 0; y < video.height; y += 2) {
      for (let x = 0; x < video.width; x += 2) {
        let k = y * video.width + x;
        let red = video.pixels[k * 4];
        if (base[k] == undefined) base[k] = red;
        else base[k] = lerp(base[k], red, 0.2);
      }
    }
    learning--;
    if (learning == 0) showNote("board learned");
    return;
  }

  for (let k = 0; k < starCount; k++) {
    stars[k].seen = false;
  }

  for (let y = 0; y < video.height; y += 2) {
    for (let x = 0; x < video.width; x += 2) {
      let k = y * video.width + x;
      let red = video.pixels[k * 4];
      let change = red - base[k];

      let person;
      if (whiteboard) person = change < -threshold;
      else person = abs(change) > threshold;

      if (person) {
        let i = floor(map(x, 0, video.width, 0, cols));
        let j = floor(map(y, 0, video.height, 0, rows));
        seeDot(i, j);
      } else {
        base[k] = lerp(base[k], red, 0.001);
      }
    }
  }

  for (let k = 0; k < starCount; k++) {
    let s = stars[k];
    if (s.camera && !s.seen) {
      s.missing++;
      if (s.missing > 10) {
        s.camera = false;
        s.pinned = false;
        s.life = s.show;
        s.fade = leaveFade;
      }
    }
  }
}

function seeDot(i, j) {
  for (let k = 0; k < starCount; k++) {
    let s = stars[k];
    if (s.camera && dist(i, j, s.i, s.j) <= 1.5) {
      s.seen = true;
      s.missing = 0;
      return;
    }
  }
  let s = addStar(i, j, true);
  if (s != null) {
    s.camera = true;
    s.seen = true;
  }
}

// ---------- mouse and keys ----------

function mousePressed() {
  let i = floor(mouseX / cell);
  let j = floor(mouseY / cell);
  if (insideGrid(i, j)) {
    addStar(i, j, true);
  }
}

function keyPressed() {
  if (keyCode == ENTER) {
    noiseSeed(floor(random(10000)));
    starCount = 0;
  }
  if (keyCode == UP_ARROW) maxStars = min(140, maxStars + 5);
  if (keyCode == DOWN_ARROW) maxStars = max(5, maxStars - 5);
  if (key == "c" || key == "C") {
    // clear clicked stars
    for (let k = 0; k < starCount; k++) {
      if (stars[k].pinned && !stars[k].camera) stars[k].life = 0;
    }
  }
  if (key == "v" || key == "V") showVideo = !showVideo;
  if (key == "b" || key == "B") {
    relearn();
    showNote("learning the board... stay out of the camera");
  }
  if (key == "w" || key == "W") {
    whiteboard = !whiteboard;
    showNote(whiteboard ? "whiteboard: looking for dark" : "blackboard: looking for any change");
  }
  if (key == "-") {
    threshold = max(5, threshold - 5);
    showNote("threshold " + threshold);
  }
  if (key == "=") {
    threshold = min(150, threshold + 5);
    showNote("threshold " + threshold);
  }
  if (key == "f" || key == "F") fullscreen(!fullscreen());
}

function relearn() {
  base = [];
  learning = 20;
  for (let k = 0; k < starCount; k++) {
    if (stars[k].camera) stars[k].life = 0;
  }
}

function showNote(msg) {
  note = msg;
  noteTime = millis();
}

function drawNote() {
  let msg = "";
  if (millis() - noteTime < 2500) msg = note;
  if (showVideo) {
    msg = (whiteboard ? "whiteboard" : "blackboard") + "   threshold " + threshold + "   " + msg;
  }
  if (msg == "") return;

  push();
  noStroke();
  textStyle(NORMAL);
  textAlign(LEFT, BOTTOM);
  textSize(14);
  fill(0, 255, 255);
  text(msg, 14, height - 12);
  pop();
}
