
let video;
let cameraDots = [];
let clickedDots = [];
let showVideo = false;

let threshold = 120;
let linkDist = 150;
let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();
}

function draw() {
  background(12, 14, 24);
  t += 0.001;

  if (showVideo) {
    tint(255, 80);
    image(video, 0, 0, width, height);
    noTint();
  }

  findDots();
  let dots = cameraDots.concat(clickedDots);



  // lines between close dots
  strokeWeight(1.5);
  for (let a = 0; a < dots.length; a++) {
    for (let b = a + 1; b < dots.length; b++) {
      let d = dist(dots[a].x, dots[a].y, dots[b].x, dots[b].y);
      if (d < linkDist) {
        // noise at the middle of the line decides if it shows right now
        let mx = (dots[a].x + dots[b].x) / 2;
        let my = (dots[a].y + dots[b].y) / 2;
        let n = noise(mx * 0.005, my * 0.005, t * 4);
        let alpha = map(d, 0, linkDist, 255, 60) * map(n, 0.4, 0.6, 0, 1, true);
        stroke(215, 225, 255, alpha);
        line(dots[a].x, dots[a].y, dots[b].x, dots[b].y);
      }
    }
  }

  // the dots, twinkling with noise
  noStroke();
  for (let d of dots) {
    let n = noise(d.x * 0.01, d.y * 0.01, t * 4);
    fill(255, 150 + n * 105);
    circle(d.x, d.y, 5 + n * 5);
  }
}

function findDots() {
  cameraDots = [];
  video.loadPixels();
  if (video.elt.readyState < 2) return;

  // check every 2nd pixel
  for (let y = 0; y < video.height; y += 2) {
    for (let x = 0; x < video.width; x += 2) {
      let i = (y * video.width + x) * 4;
      let brightness = (video.pixels[i] + video.pixels[i + 1] + video.pixels[i + 2]) / 3;

      if (brightness < threshold) {
        let sx = map(x, 0, video.width, 0, width);
        let sy = map(y, 0, video.height, 0, height);
        addToDot(sx, sy);
      }
    }
  }
}

function addToDot(x, y) {
  for (let d of cameraDots) {
    if (dist(x, y, d.x, d.y) < 40) {
      d.count++;
      d.x += (x - d.x) / d.count;
      d.y += (y - d.y) / d.count;
      return;
    }
  }
  cameraDots.push({ x: x, y: y, count: 1 });
}

function mousePressed() {
  clickedDots.push({ x: mouseX, y: mouseY });
}

function keyPressed() {
  if (key == "c" || key == "C") {
    clickedDots = [];
  }
  if (key == "v" || key == "V") {
    showVideo = !showVideo;
  }
}
