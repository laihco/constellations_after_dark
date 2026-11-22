
let video;
let cameraDots = [];
let clickedDots = [];
let showVideo = false;

let threshold = 60;
let linkDist = 150;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();
}

function draw() {
  background(12, 14, 24);

  if (showVideo) {
    tint(255, 80);
    image(video, 0, 0, width, height);
    noTint();
  }

  findDots();
  let dots = cameraDots.concat(clickedDots);

  // lines between close dots
  stroke(215, 225, 255);
  strokeWeight(1.5);
  for (let a = 0; a < dots.length; a++) {
    for (let b = a + 1; b < dots.length; b++) {
      if (dist(dots[a].x, dots[a].y, dots[b].x, dots[b].y) < linkDist) {
        line(dots[a].x, dots[a].y, dots[b].x, dots[b].y);
      }
    }
  }

  // the dots
  noStroke();
  fill(255);
  for (let d of dots) {
    circle(d.x, d.y, 8);
  }
}

function findDots() {
  cameraDots = [];
  video.loadPixels();

  // check every 4th pixel
  for (let y = 0; y < video.height; y += 4) {
    for (let x = 0; x < video.width; x += 4) {
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
