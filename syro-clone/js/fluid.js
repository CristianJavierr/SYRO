/*
I tweaked the original code quite a bit.

You can find the original here: https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/18-flip.html
And a copy of its license below.

---

Copyright 2022 Matthias Müller - Ten Minute Physics, 
www.youtube.com/c/TenMinutePhysics
www.matthiasMueller.info/tenMinutePhysics

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

export function initSyroFluid() {
if (window.__syroFluidStarted) return;
const containerProbe = document.getElementById("fluid-container");
if (!containerProbe || !containerProbe.querySelector("canvas") || !containerProbe.querySelector(".render")) return;
window.__syroFluidStarted = true;
console.log("SYRO fluid initialized");

  const isCompactFluidViewport = () =>
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;
  const isFluidMobile = isCompactFluidViewport();

  const perfMultiplier = window.fluidGridMultiplier || 1.0;
  const getTargetLongSide = () => {
    const baseTarget = isCompactFluidViewport() ? 128 * 40 : 128 * 74;
    return baseTarget / (perfMultiplier * perfMultiplier);
  };
  const MIN_GRID_SIZE = 8;
  const CELL_CROP_X = 1;
  const CELL_CROP_Y = 2;

const BASE = [
  // ["@", 42996],
  // ["&", 35409],
  // ["X", 32454],
  // ["$", 32427],
  // ["=", 19752],
  // ["+", 16884],
  ["~", 12198],
  [":", 6921],
  ["-", 5589],
  ["·", 3267],
  [" ", 0],
  [" ", 0],
];

const RENDER_CHARS = [
  [["S", 26574], ["S", 26574], ["s", 17490], ...BASE],
  [["Y", 21327], ["Y", 21327], ["y", 14019], ...BASE],
  [["R", 32973], ["R", 32973], ["r", 24093], ...BASE],
  [["O", 36198], ["O", 36198], ["o", 30762], ...BASE],
];

const RENDER_CHAR_DICTIONARIES = RENDER_CHARS.map((chars) =>
  [...chars]
    .sort((a, b) => a[1] - b[1])
    .map(([char]) => char)
    .join("")
);

// // amount of bright pixels a character shows at 12px font size
// const RENDER_CHAR_B = [
//   [" ", 0],
//   [" ", 0],
//   ["·", 18700 / 4],
//   ["·", 18700 / 4],
//   [":", 35984 / 4],

//   ["-", 30980 / 4],
//   ["-", 30980 / 4],

//   ["~", 41648 / 4],
//   // ["~", 41648 / 4],

//   ["=", 75592 / 4],
//   ["+", 75592 / 4],
//   // ["#", 151600 / 4],
//   ["X", 142104 / 4],

//   // ["@", 175768 / 4],
//   // ["@", 175768 / 4],

//   ["&", 176176 / 4],
//   ["$", 177400 / 4],
// ];

// const RENDER_CHAR_DICTIONARY = RENDER_CHAR_B.sort((a, b) => a[1] - b[1])
//   .map(([char]) => char)
//   .join("");

const canvasEl = document.querySelector("#fluid-container canvas");
const renderEl = document.querySelector("#fluid-container .render");


const containerEl = document.getElementById("fluid-container");
let hasRenderedFirstFrame = false;
let lastAsciiFrame = "";
let lastAsciiRenderTime = 0;
let containerWidth = containerEl ? containerEl.clientWidth : window.innerWidth;
let containerHeight = containerEl ? containerEl.clientHeight : window.innerHeight;

let GRID_SIZE = Math.max(
  Math.round(
    Math.sqrt(
      (containerWidth * containerHeight) / getTargetLongSide()
    )
  ),
  MIN_GRID_SIZE
);

const SPEED_1 = 1.0 / 60.0 / 16;
const SPEED_BASE = 1.0 / 60.0 / 3;
const SPEED_2 = 1.0 / 60.0 / 1.8;

let realWidth =
  Math.ceil(containerWidth / GRID_SIZE + CELL_CROP_X * 2) *
  GRID_SIZE;
let realHeight =
  Math.ceil(containerHeight / GRID_SIZE + CELL_CROP_Y * 2) *
  GRID_SIZE;

let Y_RESOLUTION = realHeight / GRID_SIZE;
let X_RESOLUTION = realWidth / GRID_SIZE;
let RESOLUTION = Y_RESOLUTION;

const GRAVITY = -9.81;

const extraSized = 0;
const ASCII_FRAME_INTERVAL = isFluidMobile ? 1000 / 30 : 1000 / 45;
const runFluidIdle = (callback, timeout = 800) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    window.setTimeout(callback, 32);
  }
};

canvasEl.width = realWidth;
canvasEl.height = realHeight;
canvasEl.style.width = realWidth + "px";
canvasEl.style.height = realHeight + "px";
renderEl.style.width = realWidth + "px";
renderEl.style.height = (Y_RESOLUTION - CELL_CROP_Y * 2) * GRID_SIZE + "px";
document.documentElement.style.setProperty(
  "--cell-size",
  GRID_SIZE + "px"
);

canvasEl.focus();

var simHeight = 2.0;

var cScale = canvasEl.height / simHeight;
var simWidth = canvasEl.width / cScale;

var U_FIELD = 0;
var V_FIELD = 1;

var FLUID_CELL = 0;
var AIR_CELL = 1;
var SOLID_CELL = 2;

var cnt = 0;

function clamp(x, min, max) {
  if (x < min) return min;
  else if (x > max) return max;
  else return x;
}

// ----------------- start of simulator ------------------------------

class FlipFluid {
  constructor(
    density,
    width,
    height,
    spacing,
    particleRadius,
    maxParticles
  ) {
    // fluid

    this.density = density;
    this.fNumX = Math.floor(width / spacing);
    this.fNumY = Math.floor(height / spacing);
    this.h = Math.max(width / this.fNumX, height / this.fNumY);
    this.fInvSpacing = 1.0 / this.h;
    this.fNumCells = this.fNumX * this.fNumY;

    this.u = new Float32Array(this.fNumCells);
    this.v = new Float32Array(this.fNumCells);
    this.du = new Float32Array(this.fNumCells);
    this.dv = new Float32Array(this.fNumCells);
    this.prevU = new Float32Array(this.fNumCells);
    this.prevV = new Float32Array(this.fNumCells);
    this.p = new Float32Array(this.fNumCells);
    this.s = new Float32Array(this.fNumCells);
    this.baseCellType = new Int32Array(this.fNumCells);
    this.cellType = new Int32Array(this.fNumCells);
    this.cellColor = new Float32Array(3 * this.fNumCells);
    this.activeFluidCells = new Int32Array(this.fNumCells);
    this.numActiveFluidCells = 0;
    this.solidCells = new Int32Array(this.fNumCells);
    this.numSolidCells = 0;
    this.solidUCells = new Int32Array(this.fNumCells);
    this.solidVCells = new Int32Array(this.fNumCells);
    this.numSolidUCells = 0;
    this.numSolidVCells = 0;
    this.activeUCells = new Int32Array(this.fNumCells);
    this.activeVCells = new Int32Array(this.fNumCells);
    this.activeUMarks = new Int32Array(this.fNumCells);
    this.activeVMarks = new Int32Array(this.fNumCells);
    this.activeUStamp = 0;
    this.activeVStamp = 0;
    this.numActiveUCells = 0;
    this.numActiveVCells = 0;
    this.coloredCells = new Int32Array(this.fNumCells);
    this.numColoredCells = 0;

    // particles

    this.maxParticles = maxParticles;

    this.particlePos = new Float32Array(2 * this.maxParticles);
    this.particleColor = new Float32Array(3 * this.maxParticles);
    for (var i = 0; i < this.maxParticles; i++)
      this.particleColor[3 * i + 2] = 1.0;

    this.particleVel = new Float32Array(2 * this.maxParticles);
    this.particleDensity = new Float32Array(this.fNumCells);
    this.particleRestDensity = 0.0;

    this.particleRadius = particleRadius;
    this.pInvSpacing = 1.0 / (2.2 * particleRadius);
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
    this.pNumCells = this.pNumX * this.pNumY;

    this.numCellParticles = new Int32Array(this.pNumCells);
    this.firstCellParticle = new Int32Array(this.pNumCells + 1);
    this.cellParticleIds = new Int32Array(maxParticles);

    this.numParticles = 0;
  }

  rebuildSolidCells() {
    this.numSolidCells = 0;
    this.numSolidUCells = 0;
    this.numSolidVCells = 0;
    this.baseCellType.fill(AIR_CELL);

    for (var i = 0; i < this.fNumCells; i++) {
      if (this.s[i] == 0.0) {
        this.baseCellType[i] = SOLID_CELL;
        this.solidCells[this.numSolidCells++] = i;
      }
    }

    var n = this.fNumY;

    for (var i = 0; i < this.fNumX; i++) {
      for (var j = 0; j < this.fNumY; j++) {
        var cellNr = i * n + j;
        var solid = this.baseCellType[cellNr] == SOLID_CELL;

        if (solid || (i > 0 && this.baseCellType[(i - 1) * n + j] == SOLID_CELL)) {
          this.solidUCells[this.numSolidUCells++] = cellNr;
        }

        if (solid || (j > 0 && this.baseCellType[i * n + j - 1] == SOLID_CELL)) {
          this.solidVCells[this.numSolidVCells++] = cellNr;
        }
      }
    }
  }

  integrateParticles(dt) {
    for (var i = 0; i < this.numParticles; i++) {
      let gravityX = 0;
      let gravityY = GRAVITY + scrollGravityY;

      if (window.gravityVector) {
        gravityX = window.gravityVector.x;
        gravityY = window.gravityVector.y + scrollGravityY;
      }

      this.particleVel[2 * i] += dt * gravityX;
      this.particleVel[2 * i + 1] += dt * gravityY;
      this.particlePos[2 * i] += this.particleVel[2 * i] * dt;
      this.particlePos[2 * i + 1] += this.particleVel[2 * i + 1] * dt;
    }
  }

  pushParticlesApart(numIters) {
    var colorDiffusionCoeff = 0.001;

    // count particles per cell

    this.numCellParticles.fill(0);

    for (var i = 0; i < this.numParticles; i++) {
      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];

      var xi = clamp(
        Math.floor(x * this.pInvSpacing),
        0,
        this.pNumX - 1
      );
      var yi = clamp(
        Math.floor(y * this.pInvSpacing),
        0,
        this.pNumY - 1
      );
      var cellNr = xi * this.pNumY + yi;
      this.numCellParticles[cellNr]++;
    }

    // partial sums

    var first = 0;

    for (var i = 0; i < this.pNumCells; i++) {
      first += this.numCellParticles[i];
      this.firstCellParticle[i] = first;
    }
    this.firstCellParticle[this.pNumCells] = first; // guard

    // fill particles into cells

    for (var i = 0; i < this.numParticles; i++) {
      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];

      var xi = clamp(
        Math.floor(x * this.pInvSpacing),
        0,
        this.pNumX - 1
      );
      var yi = clamp(
        Math.floor(y * this.pInvSpacing),
        0,
        this.pNumY - 1
      );
      var cellNr = xi * this.pNumY + yi;
      this.firstCellParticle[cellNr]--;
      this.cellParticleIds[this.firstCellParticle[cellNr]] = i;
    }

    // push particles apart

    var minDist = 2.0 * this.particleRadius;
    var minDist2 = minDist * minDist;

    for (var iter = 0; iter < numIters; iter++) {
      for (var i = 0; i < this.numParticles; i++) {
        var px = this.particlePos[2 * i];
        var py = this.particlePos[2 * i + 1];

        var pxi = Math.floor(px * this.pInvSpacing);
        var pyi = Math.floor(py * this.pInvSpacing);
        var x0 = Math.max(pxi - 1, 0);
        var y0 = Math.max(pyi - 1, 0);
        var x1 = Math.min(pxi + 1, this.pNumX - 1);
        var y1 = Math.min(pyi + 1, this.pNumY - 1);

        for (var xi = x0; xi <= x1; xi++) {
          for (var yi = y0; yi <= y1; yi++) {
            var cellNr = xi * this.pNumY + yi;
            var first = this.firstCellParticle[cellNr];
            var last = this.firstCellParticle[cellNr + 1];
            for (var j = first; j < last; j++) {
              var id = this.cellParticleIds[j];
              if (id == i) continue;
              var qx = this.particlePos[2 * id];
              var qy = this.particlePos[2 * id + 1];

              var dx = qx - px;
              var dy = qy - py;
              var d2 = dx * dx + dy * dy;
              if (d2 > minDist2 || d2 == 0.0) continue;
              var d = Math.sqrt(d2);
              var s = (0.5 * (minDist - d)) / d;
              dx *= s;
              dy *= s;
              this.particlePos[2 * i] -= dx;
              this.particlePos[2 * i + 1] -= dy;
              this.particlePos[2 * id] += dx;
              this.particlePos[2 * id + 1] += dy;

              // diffuse colors

              // for (var k = 0; k < 3; k++) {
              //   var color0 = this.particleColor[3 * i + k];
              //   var color1 = this.particleColor[3 * id + k];
              //   var color = (color0 + color1) * 0.5;
              //   this.particleColor[3 * i + k] =
              //     color0 + (color - color0) * colorDiffusionCoeff;
              //   this.particleColor[3 * id + k] =
              //     color1 + (color - color1) * colorDiffusionCoeff;
              // }
            }
          }
        }
      }
    }
  }

    handleParticleCollisions(obstacleX, obstacleY, obstacleRadius) {
    var h = 1.0 / this.fInvSpacing;
    var r = this.particleRadius;

    var minX = h + r;
    var maxX = (this.fNumX - 1) * h - r;
    var minY = h + r;
    var maxY = (this.fNumY - 1) * h - r;

    // Check if user is dragging to apply cursor obstacle
    const checkDragObstacle = mouseDown && obstacleRadius > 0.01;

    for (var i = 0; i < this.numParticles; i++) {
      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];

      // 1. Collide with stationary Logo SDF
      if (logoLoaded && logoSdf) {
        // Map particle position (x, y) to grid coordinates
        let gx = Math.floor(x * this.fInvSpacing);
        let gy = Math.floor(y * this.fInvSpacing);

        if (gx >= 0 && gx < this.fNumX && gy >= 0 && gy < this.fNumY) {
          const sdfIdx = gy * this.fNumX + gx;
          const dist = logoSdf[sdfIdx * 3];
          if (dist > 0) {
            const dirX = logoSdf[sdfIdx * 3 + 1];
            const dirY = logoSdf[sdfIdx * 3 + 2];
            // Push particle outside the logo area
            const pushDist = (dist + 0.5) * h;
            x += dirX * pushDist;
            y += dirY * pushDist;
            this.particleVel[2 * i] = 0;
            this.particleVel[2 * i + 1] = 0;
          }
        }
      }

      // 2. Collide with mouse drag circular obstacle
      if (checkDragObstacle) {
        var dx = x - obstacleX;
        var dy = y - obstacleY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < obstacleRadius) {
          x = obstacleX + (dx / dist) * obstacleRadius;
          y = obstacleY + (dy / dist) * obstacleRadius;
          this.particleVel[2 * i] = scene.obstacleVelX;
          this.particleVel[2 * i + 1] = scene.obstacleVelY;
        }
      }

      // 3. Keep within tank boundaries
      if (x < minX) { x = minX; this.particleVel[2 * i] = 0.0; }
      if (x > maxX) { x = maxX; this.particleVel[2 * i] = 0.0; }
      if (y < minY) { y = minY; this.particleVel[2 * i + 1] = 0.0; }
      if (y > maxY) { y = maxY; this.particleVel[2 * i + 1] = 0.0; }

      // Save corrected position
      this.particlePos[2 * i] = x;
      this.particlePos[2 * i + 1] = y;
    }
  }

  updateParticleDensity() {
    var n = this.fNumY;
    var h = this.h;
    var h1 = this.fInvSpacing;
    var h2 = 0.5 * h;

    var d = f.particleDensity;

    d.fill(0.0);

    for (var i = 0; i < this.numParticles; i++) {
      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];

      x = clamp(x, h, (this.fNumX - 1) * h);
      y = clamp(y, h, (this.fNumY - 1) * h);

      var x0 = Math.floor((x - h2) * h1);
      var tx = (x - h2 - x0 * h) * h1;
      var x1 = Math.min(x0 + 1, this.fNumX - 2);

      var y0 = Math.floor((y - h2) * h1);
      var ty = (y - h2 - y0 * h) * h1;
      var y1 = Math.min(y0 + 1, this.fNumY - 2);

      var sx = 1.0 - tx;
      var sy = 1.0 - ty;

      if (x0 < this.fNumX && y0 < this.fNumY) d[x0 * n + y0] += sx * sy;
      if (x1 < this.fNumX && y0 < this.fNumY) d[x1 * n + y0] += tx * sy;
      if (x1 < this.fNumX && y1 < this.fNumY) d[x1 * n + y1] += tx * ty;
      if (x0 < this.fNumX && y1 < this.fNumY) d[x0 * n + y1] += sx * ty;
    }

    if (this.particleRestDensity == 0.0) {
      var sum = 0.0;
      var numFluidCells = 0;

      for (var i = 0; i < this.numActiveFluidCells; i++) {
        var cellNr = this.activeFluidCells[i];
        if (this.cellType[cellNr] == FLUID_CELL) {
          sum += d[cellNr];
          numFluidCells++;
        }
      }

      if (numFluidCells > 0)
        this.particleRestDensity = sum / numFluidCells;
    }
  }

  transferVelocities(toGrid, flipRatio) {
    var n = this.fNumY;
    var h = this.h;
    var h1 = this.fInvSpacing;
    var h2 = 0.5 * h;

    if (toGrid) {
      this.prevU.set(this.u);
      this.prevV.set(this.v);

      this.du.fill(0.0);
      this.dv.fill(0.0);
      this.u.fill(0.0);
      this.v.fill(0.0);

      this.cellType.set(this.baseCellType);
      this.numActiveFluidCells = 0;

      for (var i = 0; i < this.numParticles; i++) {
        var x = this.particlePos[2 * i];
        var y = this.particlePos[2 * i + 1];
        var xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1);
        var yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1);
        var cellNr = xi * n + yi;
        if (this.cellType[cellNr] == AIR_CELL) {
          this.cellType[cellNr] = FLUID_CELL;
          if (xi > 0 && xi < this.fNumX - 1 && yi > 0 && yi < this.fNumY - 1) {
            this.activeFluidCells[this.numActiveFluidCells++] = cellNr;
          }
        }
      }
    }

    for (var component = 0; component < 2; component++) {
      var dx = component == 0 ? 0.0 : h2;
      var dy = component == 0 ? h2 : 0.0;

      var f = component == 0 ? this.u : this.v;
      var prevF = component == 0 ? this.prevU : this.prevV;
      var d = component == 0 ? this.du : this.dv;
      var activeVelocityCells = null;
      var activeVelocityMarks = null;
      var activeVelocityStamp = 0;
      var activeVelocityCount = 0;

      if (toGrid) {
        if (component == 0) {
          this.activeUStamp = (this.activeUStamp + 1) | 0;
          if (this.activeUStamp <= 0) {
            this.activeUMarks.fill(0);
            this.activeUStamp = 1;
          }
          activeVelocityCells = this.activeUCells;
          activeVelocityMarks = this.activeUMarks;
          activeVelocityStamp = this.activeUStamp;
        } else {
          this.activeVStamp = (this.activeVStamp + 1) | 0;
          if (this.activeVStamp <= 0) {
            this.activeVMarks.fill(0);
            this.activeVStamp = 1;
          }
          activeVelocityCells = this.activeVCells;
          activeVelocityMarks = this.activeVMarks;
          activeVelocityStamp = this.activeVStamp;
        }
      }

      for (var i = 0; i < this.numParticles; i++) {
        var x = this.particlePos[2 * i];
        var y = this.particlePos[2 * i + 1];

        x = clamp(x, h, (this.fNumX - 1) * h);
        y = clamp(y, h, (this.fNumY - 1) * h);

        var x0 = Math.min(Math.floor((x - dx) * h1), this.fNumX - 2);
        var tx = (x - dx - x0 * h) * h1;
        var x1 = Math.min(x0 + 1, this.fNumX - 2);

        var y0 = Math.min(Math.floor((y - dy) * h1), this.fNumY - 2);
        var ty = (y - dy - y0 * h) * h1;
        var y1 = Math.min(y0 + 1, this.fNumY - 2);

        var sx = 1.0 - tx;
        var sy = 1.0 - ty;

        var d0 = sx * sy;
        var d1 = tx * sy;
        var d2 = tx * ty;
        var d3 = sx * ty;

        var nr0 = x0 * n + y0;
        var nr1 = x1 * n + y0;
        var nr2 = x1 * n + y1;
        var nr3 = x0 * n + y1;

        if (toGrid) {
          var pv = this.particleVel[2 * i + component];
          f[nr0] += pv * d0;
          d[nr0] += d0;
          f[nr1] += pv * d1;
          d[nr1] += d1;
          f[nr2] += pv * d2;
          d[nr2] += d2;
          f[nr3] += pv * d3;
          d[nr3] += d3;

          if (activeVelocityMarks[nr0] != activeVelocityStamp) {
            activeVelocityMarks[nr0] = activeVelocityStamp;
            activeVelocityCells[activeVelocityCount++] = nr0;
          }
          if (activeVelocityMarks[nr1] != activeVelocityStamp) {
            activeVelocityMarks[nr1] = activeVelocityStamp;
            activeVelocityCells[activeVelocityCount++] = nr1;
          }
          if (activeVelocityMarks[nr2] != activeVelocityStamp) {
            activeVelocityMarks[nr2] = activeVelocityStamp;
            activeVelocityCells[activeVelocityCount++] = nr2;
          }
          if (activeVelocityMarks[nr3] != activeVelocityStamp) {
            activeVelocityMarks[nr3] = activeVelocityStamp;
            activeVelocityCells[activeVelocityCount++] = nr3;
          }
        } else {
          var offset = component == 0 ? n : 1;
          var valid0 =
            this.cellType[nr0] != AIR_CELL ||
            this.cellType[nr0 - offset] != AIR_CELL
              ? 1.0
              : 0.0;
          var valid1 =
            this.cellType[nr1] != AIR_CELL ||
            this.cellType[nr1 - offset] != AIR_CELL
              ? 1.0
              : 0.0;
          var valid2 =
            this.cellType[nr2] != AIR_CELL ||
            this.cellType[nr2 - offset] != AIR_CELL
              ? 1.0
              : 0.0;
          var valid3 =
            this.cellType[nr3] != AIR_CELL ||
            this.cellType[nr3 - offset] != AIR_CELL
              ? 1.0
              : 0.0;

          var v = this.particleVel[2 * i + component];
          var d = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3;

          if (d > 0.0) {
            var picV =
              (valid0 * d0 * f[nr0] +
                valid1 * d1 * f[nr1] +
                valid2 * d2 * f[nr2] +
                valid3 * d3 * f[nr3]) /
              d;
            var corr =
              (valid0 * d0 * (f[nr0] - prevF[nr0]) +
                valid1 * d1 * (f[nr1] - prevF[nr1]) +
                valid2 * d2 * (f[nr2] - prevF[nr2]) +
                valid3 * d3 * (f[nr3] - prevF[nr3])) /
              d;
            var flipV = v + corr;

            this.particleVel[2 * i + component] =
              (1.0 - flipRatio) * picV + flipRatio * flipV;
          }
        }
      }

      if (toGrid) {
        if (component == 0) {
          this.numActiveUCells = activeVelocityCount;
        } else {
          this.numActiveVCells = activeVelocityCount;
        }

        for (var i = 0; i < activeVelocityCount; i++) {
          var cellNr = activeVelocityCells[i];
          if (d[cellNr] > 0.0) f[cellNr] /= d[cellNr];
        }

        if (component == 0) {
          for (var i = 0; i < this.numSolidUCells; i++) {
            var solidUCell = this.solidUCells[i];
            this.u[solidUCell] = this.prevU[solidUCell];
          }
        } else {
          for (var i = 0; i < this.numSolidVCells; i++) {
            var solidVCell = this.solidVCells[i];
            this.v[solidVCell] = this.prevV[solidVCell];
          }
        }
      }
    }
  }

  solveIncompressibility(
    numIters,
    dt,
    overRelaxation,
    compensateDrift = true
  ) {
    this.p.fill(0.0);
    this.prevU.set(this.u);
    this.prevV.set(this.v);

    var n = this.fNumY;
    var cp = (this.density * this.h) / dt;
    var activeFluidCells = this.activeFluidCells;

    for (var iter = 0; iter < numIters; iter++) {
      for (var activeIndex = 0; activeIndex < this.numActiveFluidCells; activeIndex++) {
        var center = activeFluidCells[activeIndex];
        if (this.cellType[center] != FLUID_CELL) continue;

        var left = center - n;
        var right = center + n;
        var bottom = center - 1;
        var top = center + 1;

        var sx0 = this.s[left];
        var sx1 = this.s[right];
        var sy0 = this.s[bottom];
        var sy1 = this.s[top];
        var s = sx0 + sx1 + sy0 + sy1;
        if (s == 0.0) continue;

        var div =
          this.u[right] -
          this.u[center] +
          this.v[top] -
          this.v[center];

        if (this.particleRestDensity > 0.0 && compensateDrift) {
          var k = 1.0;
          var compression =
            this.particleDensity[center] -
            this.particleRestDensity;
          if (compression > 0.0) div = div - k * compression;
        }

        var p = -div / s;
        p *= overRelaxation;
        this.p[center] += cp * p;

        this.u[center] -= sx0 * p;
        this.u[right] += sx1 * p;
        this.v[center] -= sy0 * p;
        this.v[top] += sy1 * p;
      }
    }
  }

  updateParticleColors() {
    var h1 = this.fInvSpacing;

    for (var i = 0; i < this.numParticles; i++) {
      var s = 0.01;

      this.particleColor[3 * i] = clamp(
        this.particleColor[3 * i] - s,
        0.0,
        1.0
      );
      this.particleColor[3 * i + 1] = clamp(
        this.particleColor[3 * i + 1] - s,
        0.0,
        1.0
      );
      this.particleColor[3 * i + 2] = clamp(
        this.particleColor[3 * i + 2] + s,
        0.0,
        1.0
      );

      var x = this.particlePos[2 * i];
      var y = this.particlePos[2 * i + 1];
      var xi = clamp(Math.floor(x * h1), 1, this.fNumX - 1);
      var yi = clamp(Math.floor(y * h1), 1, this.fNumY - 1);
      var cellNr = xi * this.fNumY + yi;

      var d0 = this.particleRestDensity;

      if (d0 > 0.0) {
        var relDensity = this.particleDensity[cellNr] / d0;
        if (relDensity < 0.7) {
          var s = 0.8;
          this.particleColor[3 * i] = s;
          this.particleColor[3 * i + 1] = s;
          this.particleColor[3 * i + 2] = s;
        }
      }
    }
  }

  setSciColor(cellNr, val, minVal, maxVal) {
    val = Math.min(Math.max(val, minVal), maxVal - 0.0001);
    var d = maxVal - minVal;
    val = d == 0.0 ? 0.5 : (val - minVal) / d;
    var m = 0.25;
    var num = Math.floor(val / m);
    var s = (val - num * m) / m;
    var r, g, b;

    switch (num) {
      case 0:
        r = s;
        g = s;
        b = s;
        break;
      case 1:
        r = 1.0 - s;
        g = 1.0 - s;
        b = 1.0 - s;
        break;
      case 2:
        r = s;
        g = s;
        b = s;
        break;
      case 3:
        r = 1.0 - s;
        g = 1.0 - s;
        b = 1.0 - s;
        break;
    }

    this.cellColor[3 * cellNr] = r;
    this.cellColor[3 * cellNr + 1] = g;
    this.cellColor[3 * cellNr + 2] = b;
  }

  updateCellColors() {
    for (var i = 0; i < this.numColoredCells; i++) {
      var previousCell = this.coloredCells[i];
      this.cellColor[3 * previousCell] = 0.0;
      this.cellColor[3 * previousCell + 1] = 0.0;
      this.cellColor[3 * previousCell + 2] = 0.0;
    }

    this.numColoredCells = 0;

    for (var i = 0; i < this.numSolidCells; i++) {
      var solidCell = this.solidCells[i];
      this.coloredCells[this.numColoredCells++] = solidCell;
      this.cellColor[3 * solidCell] = 0.5;
      this.cellColor[3 * solidCell + 1] = 0.5;
      this.cellColor[3 * solidCell + 2] = 0.5;
    }

    for (var i = 0; i < this.numActiveFluidCells; i++) {
      var fluidCell = this.activeFluidCells[i];
      if (this.cellType[fluidCell] == FLUID_CELL) {
        this.coloredCells[this.numColoredCells++] = fluidCell;
        var d = this.particleDensity[fluidCell];
        if (this.particleRestDensity > 0.0)
          d /= this.particleRestDensity;
        this.setSciColor(fluidCell, d, 0.0, 2.0);
      }
    }
  }

  simulate(
    dt,
    gravity,
    flipRatio,
    numPressureIters,
    numParticleIters,
    overRelaxation,
    compensateDrift,
    separateParticles,
    obstacleX,
    abstacleY,
    obstacleRadius
  ) {
    var numSubSteps = 1;
    var sdt = dt / numSubSteps;

    for (var step = 0; step < numSubSteps; step++) {
      this.integrateParticles(sdt, gravity);
      if (separateParticles) {
        this.pushParticlesApart(numParticleIters);
      }
      this.handleParticleCollisions(
        obstacleX,
        abstacleY,
        obstacleRadius
      );
      this.transferVelocities(true);
      this.updateParticleDensity();
      this.solveIncompressibility(
        numPressureIters,
        sdt,
        overRelaxation,
        compensateDrift
      );
      this.transferVelocities(false, flipRatio);
    }

    // We are not rendering particles at the moment
    // this.updateParticleColors();
    this.updateCellColors();
  }
}
// ----------------- end of simulator ------------------------------

var scene = {
  gravity: GRAVITY,
  dt: SPEED_BASE,
  flipRatio: 0.9,
  numPressureIters: 30,
  numParticleIters: 2,
  frameNr: 0,
  overRelaxation: 1.9,
  compensateDrift: true,
  separateParticles: true,
  obstacleX: 0.0,
  obstacleY: 0.0,
  obstacleRadius: 0,
  paused: true,
  showObstacle: true,
  obstacleVelX: 0.0,
  obstacleVelY: 0.0,
  fluid: null,
};
let f = null;
let asciiRowsMeta = [];

function rebuildAsciiRowsMeta() {
  if (!f) return;

  asciiRowsMeta = [];
  for (let i = f.fNumY - CELL_CROP_Y; i > CELL_CROP_Y; i--) {
    const row = [];

    for (let j = CELL_CROP_X; j < f.fNumX - CELL_CROP_X; j++) {
      row.push({
        colorOffset: 3 * (j * f.fNumY + i),
        dictionary: RENDER_CHAR_DICTIONARIES[(i + j + 1) % RENDER_CHAR_DICTIONARIES.length],
        sdfOffset: (i * f.fNumX + j) * 3,
      });
    }

    asciiRowsMeta.push(row);
  }
}


// Custom Logo SDF variables and generator
var logoImg = new Image();
var logoSdf = null;
var logoLoaded = false;
  // isFluidMobile is declared at the top of initSyroFluid

// Mobile is scroll-reactive only. Let gestures pass through to the page and
// prevent taps or drags from becoming fluid obstacles.
if (isFluidMobile && containerEl) {
  containerEl.style.touchAction = "pan-y";
  containerEl.style.pointerEvents = "none";
}
if (isFluidMobile && canvasEl) {
  canvasEl.style.touchAction = "pan-y";
  canvasEl.style.pointerEvents = "none";
}

// Scroll gravity integration
var lastScrollY = window.scrollY;
var scrollGravityY = 0;

const isFluidNearViewport = () => {
  if (!containerEl) return false;

  const bounds = containerEl.getBoundingClientRect();
  const activationMargin = window.innerHeight * 0.7;
  return bounds.bottom >= -activationMargin &&
    bounds.top <= window.innerHeight + activationMargin;
};

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  const deltaY = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  if (!deltaY || !isFluidNearViewport()) return;

  // Native mobile scrolling emits fewer, smaller events than a desktop wheel.
  // Give those deltas enough force to visibly move the fluid while keeping the
  // impulse capped so a fast swipe cannot destabilize the simulation.
  const deltaLimit = isFluidMobile ? 32 : 35;
  const impulse = isFluidMobile ? 0.5 : 1.0;
  const gravityLimit = isFluidMobile ? 18 : 35;
  const clampedDelta = Math.max(-deltaLimit, Math.min(deltaLimit, deltaY));
  
  scrollGravityY += clampedDelta * impulse;
  scrollGravityY = Math.max(-gravityLimit, Math.min(gravityLimit, scrollGravityY));

  // A scroll may arrive just before IntersectionObserver marks the section as
  // visible. Wake a short burst of frames so the first mobile swipe is never lost.
  queueFluidWarmup(isFluidMobile ? 18 : 8);
}, { passive: true });


function generateLogoSdf() {
  if (!logoImg.complete || logoImg.naturalWidth === 0) {
    console.warn("Logo image not fully loaded yet.");
    return;
  }

  if (!f) {
    console.warn("Fluid simulation not initialized yet.");
    return;
  }

  const gridX = f.fNumX;
  const gridY = f.fNumY;
  
  const offscreen = document.createElement("canvas");
  offscreen.width = gridX;
  offscreen.height = gridY;
  const oCtx = offscreen.getContext("2d", { willReadFrequently: true });

  oCtx.clearRect(0, 0, gridX, gridY);

  // SVG aspect ratio (width=2889, height=1849)
  const logoAspect = 2889.0 / 1849.0;
  
  const isMobile = window.matchMedia("(max-width: 768px)").matches || gridX < gridY;
  const scaleY = gridY * (isMobile ? 0.24 : 0.45);
  const scaleX = scaleY * logoAspect;
  
  const dx = (gridX - scaleX) / 2;
  const dy = (gridY - scaleY) / 2;

  // Draw onto offscreen canvas, flipped horizontally to match the site composition.
  oCtx.save();
  oCtx.translate(gridX, 0);
  oCtx.scale(-1, 1);
  oCtx.drawImage(logoImg, dx, dy, scaleX, scaleY);
  oCtx.restore();

  const imgData = oCtx.getImageData(0, 0, gridX, gridY);
  const pixels = imgData.data;

  // Generate 2D Signed Distance Field (SDF) lookup grid
  logoSdf = new Float32Array(gridX * gridY * 3); // [distance, dirX, dirY]

  // We'll store the coordinates of the closest outside boundary pixel
  const closestXGrid = new Int16Array(gridX * gridY);
  const closestYGrid = new Int16Array(gridX * gridY);

  // Initialize grid states
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      const idx = y * gridX + x;
      const isInside = pixels[idx * 4 + 3] > 40; // check alpha channel
      
      if (!isInside) {
        closestXGrid[idx] = x;
        closestYGrid[idx] = y;
      } else {
        closestXGrid[idx] = -1;
        closestYGrid[idx] = -1;
      }
    }
  }

  // O(N) Distance transform helper
  const checkNeighbor = (x, y, nx, ny) => {
    if (nx < 0 || nx >= gridX || ny < 0 || ny >= gridY) return;
    
    const idx = y * gridX + x;
    const nidx = ny * gridX + nx;
    
    const ncx = closestXGrid[nidx];
    const ncy = closestYGrid[nidx];
    
    if (ncx === -1) return; // Neighbor is unresolved
    
    const curCx = closestXGrid[idx];
    const curCy = closestYGrid[idx];
    
    if (curCx === -1) {
      closestXGrid[idx] = ncx;
      closestYGrid[idx] = ncy;
    } else {
      const d1 = (ncx - x) ** 2 + (ncy - y) ** 2;
      const d2 = (curCx - x) ** 2 + (curCy - y) ** 2;
      if (d1 < d2) {
        closestXGrid[idx] = ncx;
        closestYGrid[idx] = ncy;
      }
    }
  };

  // Pass 1: Forward Pass (top-left to bottom-right)
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      checkNeighbor(x, y, x - 1, y);     // Left
      checkNeighbor(x, y, x, y - 1);     // Top
      checkNeighbor(x, y, x - 1, y - 1); // Top-Left
      checkNeighbor(x, y, x + 1, y - 1); // Top-Right
    }
  }

  // Pass 2: Backward Pass (bottom-right to top-left)
  for (let y = gridY - 1; y >= 0; y--) {
    for (let x = gridX - 1; x >= 0; x--) {
      checkNeighbor(x, y, x + 1, y);     // Right
      checkNeighbor(x, y, x, y + 1);     // Bottom
      checkNeighbor(x, y, x + 1, y + 1); // Bottom-Right
      checkNeighbor(x, y, x - 1, y + 1); // Bottom-Left
    }
  }

  // Populate the final logoSdf lookup array
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      const idx = y * gridX + x;
      const cx = closestXGrid[idx];
      const cy = closestYGrid[idx];
      
      if (cx === -1 || (cx === x && cy === y)) {
        logoSdf[idx * 3] = 0;
        logoSdf[idx * 3 + 1] = 0;
        logoSdf[idx * 3 + 2] = 0;
      } else {
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        logoSdf[idx * 3] = dist;
        logoSdf[idx * 3 + 1] = dx / dist; // normalized direction x
        logoSdf[idx * 3 + 2] = dy / dist; // normalized direction y
      }
    }
  }

  logoLoaded = true;
  console.log("Logo SDF generated in O(N) successfully!");
}

function setupScene() {
  var res = RESOLUTION;

  var tankHeight = 1.0 * simHeight;
  var tankWidth = 1.0 * simWidth;
  var h = tankHeight / res;

  var density = 1000.0;

  var relWaterHeight = 0.618;
  var relWaterWidth = 1;

  // dam break

  // compute number of particles

  var r = 0.3 * h; // particle radius w.r.t. cell size
  var dx = 2.0 * r;
  var dy = (Math.sqrt(3.0) / 2.0) * dx;

  var numX = Math.floor(
    (relWaterWidth * tankWidth - 2.0 * h - 2.0 * r) / dx
  );
  var numY = Math.floor(
    (relWaterHeight * tankHeight - 2.0 * h - 2.0 * r) / dy
  );
  var maxParticles = numX * numY;

  // create fluid

  f = scene.fluid = new FlipFluid(
    density,
    tankWidth,
    tankHeight,
    h,
    r,
    maxParticles
  );

  // create particles

  f.numParticles = numX * numY;
  var p = 0;
  for (var i = 0; i < numX; i++) {
    for (var j = 0; j < numY; j++) {
      // Center horizontally by adding offset to x position
      let xOffset = (tankWidth - numX * dx) / 2;
      // Center vertically by adding offset to y position
      let yOffset = (tankHeight - numY * dy) * -0.5;

      f.particlePos[p++] =
        h + r + dx * i + (j % 2 == 0 ? 0.0 : r) + xOffset;
      f.particlePos[p++] = h + r + dy * j + yOffset;
    }
  }

  // setup grid cells for tank

  var n = f.fNumY;

  for (var i = 0; i < f.fNumX; i++) {
    for (var j = 0; j < f.fNumY; j++) {
      var s = 1.0; // fluid
      if (i == 0 || i == f.fNumX - 1 || j == 0) s = 0.0; // solid
      f.s[i * n + j] = s;
    }
  }

  f.rebuildSolidCells();
}

function setObstacle(x, y, reset) {
  var vx = 0.0;
  var vy = 0.0;

  if (!reset) {
    vx = (x - scene.obstacleX) / scene.dt;
    vy = (y - scene.obstacleY) / scene.dt;
  }

  scene.obstacleX = x;
  scene.obstacleY = y;
  var r = scene.obstacleRadius;
  var f = scene.fluid;
  var n = f.numY;
  var cd = Math.sqrt(2) * f.h;

  for (var i = 1; i < f.numX - 2; i++) {
    for (var j = 1; j < f.numY - 2; j++) {
      f.s[i * n + j] = 1.0;

      dx = (i + 0.5) * f.h - x;
      dy = (j + 0.5) * f.h - y;

      if (dx * dx + dy * dy < r * r) {
        f.s[i * n + j] = 0.0;
        f.u[i * n + j] = vx;
        f.u[(i + 1) * n + j] = vx;
        f.v[i * n + j] = vy;
        f.v[i * n + j + 1] = vy;
      }
    }
  }

  scene.showObstacle = true;
  scene.obstacleVelX = vx;
  scene.obstacleVelY = vy;
}

// interaction -------------------------------------------------------

var mouseDown = false;

function setObstacleFromLocalPoint(mx, my, reset, activate = true) {
  const x = mx / cScale;
  const y = (canvasEl.height - my) / cScale;

  setObstacle(x, y, reset);
  if (activate) {
    scene.paused = false;
    startFluidLoop();
  }
}

function setInitialObstacle() {
  setObstacleFromLocalPoint(containerWidth / 2, containerHeight * 0.54, true, false);
  mouseDown = false;
  scene.obstacleVelX = 0.0;
  scene.obstacleVelY = 0.0;
  scene.paused = true;
}

function startDrag(x, y) {
  let bounds = canvasEl.getBoundingClientRect();

  let mx = x - bounds.left - canvasEl.clientLeft;
  let my = y - bounds.top - canvasEl.clientTop;
  mouseDown = true;

  setObstacleFromLocalPoint(mx, my, true);
}

function drag(x, y) {
  if (mouseDown) {
    let bounds = canvasEl.getBoundingClientRect();
    let mx = x - bounds.left - canvasEl.clientLeft;
    let my = y - bounds.top - canvasEl.clientTop;
    x = mx / cScale;
    y = (canvasEl.height - my) / cScale;
    setObstacle(x, y, false);
  }
}

function endDrag() {
  mouseDown = false;
  scene.obstacleVelX = 0.0;
  scene.obstacleVelY = 0.0;
}

if (!isFluidMobile) {
  // Desktop: full mouse + touch listeners
  containerEl.addEventListener("mousedown", (event) => {
    scene.obstacleRadius = 0.0;
    scene.dt = SPEED_1;
    startDrag(event.x, event.y);
  });

  containerEl.addEventListener("mouseup", (event) => {
    scene.dt = SPEED_2;
    endDrag();
  });

  containerEl.addEventListener("mousemove", (event) => {
    drag(event.x, event.y);
  });

  containerEl.addEventListener("touchstart", (event) => {
    event.preventDefault();
    scene.obstacleRadius = 0.0;
    scene.dt = SPEED_1;
    startDrag(event.touches[0].clientX, event.touches[0].clientY);
  });

  containerEl.addEventListener("touchend", (event) => {
    scene.dt = SPEED_2;
    endDrag();
  });

  containerEl.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      drag(event.touches[0].clientX, event.touches[0].clientY);
    },
    {
      passive: false,
    }
  );
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "p":
      scene.paused = !scene.paused;
      startFluidLoop();
      break;
    case "m":
      scene.paused = false;
      simulate();
      scene.paused = true;
      break;
  }
});

// on window resize, re-initialize scene locally
let resizeTimeout;
let lastLayoutWidth = containerWidth;
let lastLayoutHeight = containerHeight;
window.addEventListener("resize", () => {
  const nextWidth = containerEl ? containerEl.clientWidth : window.innerWidth;
  const nextHeight = containerEl ? containerEl.clientHeight : window.innerHeight;
  const widthDelta = Math.abs(nextWidth - lastLayoutWidth);
  const heightDelta = Math.abs(nextHeight - lastLayoutHeight);
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  if (widthDelta < 2 && heightDelta < 2) return;
  if (isCoarsePointer && widthDelta < 16) return;

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const wasPaused = scene.paused;
    containerWidth = containerEl ? containerEl.clientWidth : window.innerWidth;
    containerHeight = containerEl ? containerEl.clientHeight : window.innerHeight;
    lastLayoutWidth = containerWidth;
    lastLayoutHeight = containerHeight;
    GRID_SIZE = Math.max(
      Math.round(
        Math.sqrt(
          (containerWidth * containerHeight) / getTargetLongSide()
        )
      ),
      MIN_GRID_SIZE
    );
    realWidth = Math.ceil(containerWidth / GRID_SIZE + CELL_CROP_X * 2) * GRID_SIZE;
    realHeight = Math.ceil(containerHeight / GRID_SIZE + CELL_CROP_Y * 2) * GRID_SIZE;
    Y_RESOLUTION = realHeight / GRID_SIZE;
    X_RESOLUTION = realWidth / GRID_SIZE;
    RESOLUTION = Y_RESOLUTION;

    canvasEl.width = realWidth;
    canvasEl.height = realHeight;
    canvasEl.style.width = realWidth + "px";
    canvasEl.style.height = realHeight + "px";
    renderEl.style.width = realWidth + "px";
    renderEl.style.height = (Y_RESOLUTION - CELL_CROP_Y * 2) * GRID_SIZE + "px";
    document.documentElement.style.setProperty(
      "--cell-size",
      GRID_SIZE + "px"
    );

    cScale = canvasEl.height / simHeight;
    simWidth = canvasEl.width / cScale;
    lastAsciiFrame = "";
    lastAsciiRenderTime = 0;

    setupScene();
    rebuildAsciiRowsMeta();
    generateLogoSdf();
    if (!mouseDown) {
      setInitialObstacle();
    }
    scene.paused = wasPaused;
    queueFluidWarmup(LOGO_WARMUP_FRAMES);
  }, 250);
});

// Request device motion permission if available
async function requestDeviceMotion() {
  if (typeof DeviceMotionEvent?.requestPermission === "function") {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission === "granted") {
        setupDeviceMotion();
      }
    } catch (err) {
      console.error("Error requesting device motion permission:", err);
    }
  } else {
    setupDeviceMotion();
  }
}

if (!isFluidMobile) {
  canvasEl.addEventListener("click", requestDeviceMotion, { once: true });
  document.addEventListener("touchend", requestDeviceMotion, {
    once: true,
  });
}
function setupDeviceMotion() {
  window.addEventListener("devicemotion", (event) => {
    console.log("Device motion event:", event);
    let x = event.accelerationIncludingGravity.x;
    let y = event.accelerationIncludingGravity.y;

    if (!x && !y) {
      console.warn("No acceleration data available");
      return;
    }

    // Adjust for screen orientation
    if (window.orientation === 90 || window.orientation === -90) {
      // In landscape mode, swap and invert x and y
      const temp = x;
      x = -y;
      y = temp;
    }

    window.gravityVector = {
      x,
      y,
    };

    scene.gravity = 0;
  });
}

function toggleStart() {
  var button = document.getElementById("startButton");
  if (scene.paused) button.innerHTML = "Stop";
  else button.innerHTML = "Start";
  scene.paused = !scene.paused;
}

// main -------------------------------------------------------

function simulate() {
  if (!scene.paused)
    scene.fluid.simulate(
      scene.dt,
      scene.gravity,
      scene.flipRatio,
      scene.numPressureIters,
      scene.numParticleIters,
      scene.overRelaxation,
      scene.compensateDrift,
      scene.separateParticles,
      scene.obstacleX,
      scene.obstacleY,
      scene.obstacleRadius,
      scene.colorFieldNr
    );
  scene.frameNr++;
}

let ctx = null;
let fluidFrameId = 0;
let warmupRemainingFrames = 0;
let fluidShouldRun = false;
const INITIAL_WARMUP_FRAMES = isFluidMobile ? 18 : 36;
const LOGO_WARMUP_FRAMES = isFluidMobile ? 8 : 12;

function queueFluidWarmup(frameCount = INITIAL_WARMUP_FRAMES) {
  if (!scene.fluid) return;

  warmupRemainingFrames = Math.max(warmupRemainingFrames, frameCount);
  if (document.hidden) return;

  scene.paused = false;
  startFluidLoop();
}

function startFluidLoop() {
  if (document.hidden || scene.paused || fluidFrameId) {
    return;
  }

  fluidFrameId = requestAnimationFrame(update);
}

function update(now = performance.now()) {
  fluidFrameId = 0;
  if (document.hidden) {
    scene.paused = true;
    return;
  }

  if (scene.paused) {
    return;
  }

  // Decay scroll gravity smoothly towards 0
  scrollGravityY *= isFluidMobile ? 0.9 : 0.91;
  if (Math.abs(scrollGravityY) < 0.1) {
    scrollGravityY = 0;
  }

  const MAX_RADIUS =
    containerWidth > containerHeight ? 0.47 : 0.37;

  scene.obstacleRadius = (scene.obstacleRadius * 3 + MAX_RADIUS) / 4;
  simulate();

  const renderAscii = scene.paused ? false : now - lastAsciiRenderTime >= ASCII_FRAME_INTERVAL;
  const renderCanvas = scene.paused ? false : false;

  if (renderAscii) {
    let rows = [];
    for (const cells of asciiRowsMeta) {
      let row = "";
      for (const cell of cells) {
        const RENDER_CHAR_DICTIONARY = cell.dictionary;
        const cellColor = f.cellColor[cell.colorOffset];
        const charIndex = Math.min(
          RENDER_CHAR_DICTIONARY.length - 1,
          Math.max(0, Math.floor(cellColor * RENDER_CHAR_DICTIONARY.length))
        );
        let char = RENDER_CHAR_DICTIONARY[charIndex];

        // Force a persistent outline character on the logo border so it remains visible
        if (logoLoaded && logoSdf) {
          if (cell.sdfOffset >= 0 && cell.sdfOffset < logoSdf.length) {
            const dist = logoSdf[cell.sdfOffset];
            if (dist > 0 && dist <= 1.4) {
              if (char === " ") {
                // Use the highest intensity character of the cell's active dictionary
                char = RENDER_CHAR_DICTIONARY[RENDER_CHAR_DICTIONARY.length - 1];
              }
            }
          }
        }
        row += char;
      }
      rows.push(row);
    }
    const nextAsciiFrame = rows.join("\n");
    lastAsciiRenderTime = now;
    if (nextAsciiFrame !== lastAsciiFrame) {
      renderEl.textContent = nextAsciiFrame;
      lastAsciiFrame = nextAsciiFrame;
    }

    if (!hasRenderedFirstFrame) {
      hasRenderedFirstFrame = true;
      containerEl?.classList.add("is-fluid-ready");
      containerEl?.classList.remove("is-fluid-seeded");
    }
  }

  if (renderCanvas) {
    if (!ctx) {
      ctx = canvasEl.getContext("2d");
    }

    // Use a single ImageData for better performance
    const imageData = ctx.createImageData(realWidth, realHeight);
    const data = imageData.data;

    // Fill black background directly in ImageData
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0; // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }

    const cellSize = GRID_SIZE;
    const finalSize = cellSize - 2;
    const squarePadding = Math.floor((cellSize - finalSize) / 2);

    for (let i = f.fNumY - CELL_CROP_Y; i > CELL_CROP_Y; i--) {
      for (let j = CELL_CROP_X; j < f.fNumX - CELL_CROP_X; j++) {
        let cellColor = f.cellColor[3 * (j * f.fNumY + i)];
        let intensity = Math.round(cellColor * 255);

        // Calculate pixel positions once
        const startX = j * cellSize - cellSize * CELL_CROP_X;
        const startY =
          (f.fNumY - i) * cellSize - cellSize * CELL_CROP_Y;
        const width = finalSize - squarePadding;
        const height = finalSize - squarePadding;

        // Fill pixels directly in ImageData
        for (let y = startY; y < startY + height; y++) {
          for (let x = startX; x < startX + width; x++) {
            const index = (y * realWidth + x) * 4;
            data[index] = intensity; // R
            data[index + 1] = intensity; // G
            data[index + 2] = intensity; // B
            data[index + 3] = 255; // A
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (warmupRemainingFrames > 0) {
    warmupRemainingFrames -= 1;
    if (warmupRemainingFrames === 0 && !fluidShouldRun && !mouseDown) {
      scene.paused = true;
    }
  }

  if (!scene.paused) {
    fluidFrameId = requestAnimationFrame(update);
  }
}

setupScene();
rebuildAsciiRowsMeta();
// draw obstacle in the middle
setInitialObstacle();
queueFluidWarmup();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    scene.paused = true;
    return;
  }

  if (fluidShouldRun || warmupRemainingFrames > 0) {
    scene.paused = false;
    startFluidLoop();
  }
});

// Scroll activation IntersectionObserver (both desktop and mobile)
let speedTimeout = null;
let hasSpedUp = false;
{
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      fluidShouldRun = entry.isIntersecting;
      if (entry.isIntersecting) {
        scene.paused = false;
        startFluidLoop();
        if (!hasSpedUp) {
          // Mobile: start fast immediately; Desktop: ramp up slowly
          scene.dt = isFluidMobile ? SPEED_2 : SPEED_BASE;
          if (!isFluidMobile && !speedTimeout) {
            speedTimeout = setTimeout(() => {
              scene.dt = SPEED_2;
              hasSpedUp = true;
              speedTimeout = null;
            }, 5000);
          } else if (isFluidMobile) {
            hasSpedUp = true;
          }
        }
      } else {
        if (warmupRemainingFrames <= 0) {
          scene.paused = true;
        }
        if (!hasSpedUp && speedTimeout) {
          clearTimeout(speedTimeout);
          speedTimeout = null;
        }
      }
    });
  }, { rootMargin: "55% 0px", threshold: 0 });
  if (containerEl) {
    observer.observe(containerEl);
  }
}

// Start loading custom SVG logo image
let logoImgRetries = 0;
const loadLogoImg = () => {
  logoImg.src = logoImgRetries === 0
    ? "./assets/image 63 (2).svg"
    : `./assets/image 63 (2).svg?t=${Date.now()}`;
};

logoImg.onload = () => {
  const buildLogoSdf = () => {
    generateLogoSdf();
    queueFluidWarmup(LOGO_WARMUP_FRAMES);
  };

  if (document.body.classList.contains("is-loading")) {
    requestAnimationFrame(buildLogoSdf);
  } else {
    runFluidIdle(buildLogoSdf, 1200);
  }
};

logoImg.onerror = () => {
  if (logoImgRetries < 3) {
    logoImgRetries++;
    console.warn(`[Logo Retry] Simulation SVG failed to load. Retrying in 1000ms... (attempt ${logoImgRetries})`);
    setTimeout(loadLogoImg, 1000);
  } else {
    console.error("[Logo Retry] Simulation SVG failed to load after all retries.");
  }
};

loadLogoImg();

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSyroFluid, { once: true });
} else {
  requestAnimationFrame(initSyroFluid);
}
