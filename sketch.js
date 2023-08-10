const steps = 175;
let t = 0;
let controlPoint3s = [];
let controlPointsList = [];
let initial = true;
let color1;
let color2;
let color3;
let color4;
let cornerColors;
let timeStepCornerColors;
let mode1 = 0;
let mode2 = 1;
let playing = false;

function setup() {
  let canvasDiv = document.getElementById("canvas");
  let canvasWidth = canvasDiv.offsetWidth;

  let canvasDivClone = canvasDiv.cloneNode(true);
  canvasDivClone.style.visibility = "hidden";
  document.body.appendChild(canvasDivClone);
  let canvasHeight = canvasDivClone.offsetHeight + 0;
  document.body.removeChild(canvasDivClone);
  canvasDivClone.style.visibility = "visible";

  let renderer = createCanvas(canvasWidth, canvasHeight);
  renderer.parent("canvas");
  color1 = color(255, 173, 173); // red pink
  color2 = color(160, 196, 255); // purple blue
  color3 = color(155, 246, 255); // green blue
  color4 = color(253, 255, 182); // yellow
  cornerColors = [color1, color2, color3, color4];
  timeStepCornerColors = cornerColors;
}

function draw() {
  if (!playing) {
    drawPixels(
      timeStepCornerColors[0],
      timeStepCornerColors[1],
      timeStepCornerColors[2],
      timeStepCornerColors[3],
      width,
      height
    );
  } else if (playing) {
    const {
      currCornerColors,
      newControlPoint3List,
      currControlPointsList,
      timeStepCornerColors: thisTimeStepCornerColors,
    } = drawNewPixels(
      mode1,
      mode2,
      cornerColors,
      controlPoint3s,
      controlPointsList,
      initial,
      t,
      steps
    );
    cornerColors = currCornerColors;
    controlPoint3s = newControlPoint3List;
    controlPointsList = currControlPointsList;
    timeStepCornerColors = thisTimeStepCornerColors;
    mode1 = (mode1 + 1) % 3;
    mode2 = (mode2 + 1) % 3;
    t = (t + 1) % steps;
    if (initial) {
      initial = false;
    }
  }
}

function drawPixels(color1, color2, color3, color4, width, height) {
  const squareWidth = 25;
  const scaledWidth = width / squareWidth;
  const scaledHeight = height / squareWidth;
  // https://www.linkedin.com/pulse/create-color-matrix-from-4-corner-colors-bilinear-chonghua-yin/
  for (let i = 0; i < scaledWidth; i++) {
    for (let j = 0; j < scaledHeight; j++) {
      const [u0, v0] = [i / scaledWidth, j / scaledHeight];
      const [u1, v1] = [1 - u0, 1 - v0];
      const colorRed = Math.floor(
        u1 * v1 * red(color1) +
          u0 * v1 * red(color2) +
          u1 * v0 * red(color3) +
          u0 * v0 * red(color4) +
          0.5
      );

      const colorBlue = Math.floor(
        u1 * v1 * blue(color1) +
          u0 * v1 * blue(color2) +
          u1 * v0 * blue(color3) +
          u0 * v0 * blue(color4) +
          0.5
      );

      const colorGreen = Math.floor(
        u1 * v1 * green(color1) +
          u0 * v1 * green(color2) +
          u1 * v0 * green(color3) +
          u0 * v0 * green(color4) +
          0.5
      );

      const pixelColor = color(colorRed, colorGreen, colorBlue);
      fill(pixelColor);
      stroke("white");
      rect(i * squareWidth, j * squareWidth, squareWidth, squareWidth);
    }
  }
}

function drawNewPixels(
  mode1,
  mode2,
  cornerColors,
  controlPoint3s,
  controlPointsList,
  initial,
  t,
  steps
) {
  if (controlPointsList.length == 0) {
    for (let i = 0; i < 4; i++) {
      const controlPoints = getBezierParams(
        mode1,
        mode2,
        cornerColors[i],
        initial,
        controlPoint3s.length != 0 ? controlPoint3s[i] : null
      );
      controlPointsList.push(controlPoints);
    }
  }

  const u = t / steps;
  let newCornerColors = [];
  let newControlPoint3List = [];
  for (let j = 0; j < 4; j++) {
    const controlPoints = controlPointsList[j];
    const colorRed = bezierPoint(
      red(controlPoints[0]),
      red(controlPoints[1]),
      red(controlPoints[2]),
      red(controlPoints[3]),
      u
    );
    const colorGreen = bezierPoint(
      green(controlPoints[0]),
      green(controlPoints[1]),
      green(controlPoints[2]),
      green(controlPoints[3]),
      u
    );
    const colorBlue = bezierPoint(
      blue(controlPoints[0]),
      blue(controlPoints[1]),
      blue(controlPoints[2]),
      blue(controlPoints[3]),
      u
    );
    newCornerColors.push(color(colorRed, colorGreen, colorBlue));
    if (t == steps - 1) {
      newControlPoint3List.push(controlPoints[2]);
    }
  }
  drawPixels(
    newCornerColors[0],
    newCornerColors[1],
    newCornerColors[2],
    newCornerColors[3],
    width,
    height
  );
  let currCornerColors = cornerColors;
  if (t == steps - 1) {
    currCornerColors = newCornerColors;
    controlPointsList = [];
  }
  return {
    currCornerColors,
    newControlPoint3List,
    currControlPointsList: controlPointsList,
    timeStepCornerColors: newCornerColors,
  };
}

function getBezierParams(mode1, mode2, cornerColor, initial, controlPoint3) {
  let newCornerColor = fillColor(mode1, cornerColor);
  newCornerColor = fillColor(mode2, cornerColor);

  let controlColor1;
  if (!initial) {
    // ensure smoothness of turn
    const corner = Math.random() * 1.3;
    const colorRed =
      red(cornerColor) + (red(cornerColor) - red(controlPoint3)) * corner;
    const colorGreen =
      green(cornerColor) + (green(cornerColor) - green(controlPoint3)) * corner;
    const colorBlue =
      blue(cornerColor) + (blue(cornerColor) - blue(controlPoint3)) * corner;
    controlColor1 = color(colorRed, colorGreen, colorBlue);
  } else {
    controlColor1 = getRandomColor();
  }

  controlColor2 = getRandomColor();
  return [cornerColor, controlColor1, controlColor2, newCornerColor];
}

function fillColor(mode, cornerColor) {
  if (mode == 0) {
    const colorRed =
      red(cornerColor) > 127
        ? getRandomInt(red(cornerColor))
        : getRandomInt(red(cornerColor)) + 127;
    return color(colorRed, green(cornerColor), blue(cornerColor));
  } else if (mode == 1) {
    const colorGreen =
      green(cornerColor) > 127
        ? getRandomInt(green(cornerColor))
        : getRandomInt(green(cornerColor)) + 127;
    return color(red(cornerColor), colorGreen, blue(cornerColor));
  } else if (mode == 2) {
    const colorBlue =
      blue(cornerColor) > 127
        ? getRandomInt(blue(cornerColor))
        : getRandomInt(blue(cornerColor)) + 127;
    return color(red(cornerColor), green(cornerColor), colorBlue);
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomColor() {
  return color(getRandomInt(255), getRandomInt(255), getRandomInt(255));
}

function play() {
  playing = true;
  document.getElementById("color_tl").disabled = true;
  document.getElementById("color_tr").disabled = true;
  document.getElementById("color_bl").disabled = true;
  document.getElementById("color_br").disabled = true;
}

function stop() {
  playing = false;
  document.getElementById("color_tl").disabled = false;
  document.getElementById("color_tr").disabled = false;
  document.getElementById("color_bl").disabled = false;
  document.getElementById("color_br").disabled = false;
}

function updateCornerColor() {
  const color_tl = hexToRgb(document.getElementById("color_tl").value);
  const color_tr = hexToRgb(document.getElementById("color_tr").value);
  const color_bl = hexToRgb(document.getElementById("color_bl").value);
  const color_br = hexToRgb(document.getElementById("color_br").value);
  color1 = color(color_tl[0], color_tl[1], color_tl[2]);
  color2 = color(color_tr[0], color_tr[1], color_tr[2]);
  color3 = color(color_bl[0], color_bl[1], color_bl[2]);
  color4 = color(color_br[0], color_br[1], color_br[2]);

  t = 0;
  controlPoint3s = [];
  controlPointsList = [];
  initial = true;
  mode1 = 0;
  mode2 = 1;
  cornerColors = [color1, color2, color3, color4];
  timeStepCornerColors = cornerColors;
}

function hexToRgb(hex) {
  const colorRed = parseInt(hex.substring(1, 3), 16);
  const colorGreen = parseInt(hex.substring(3, 5), 16);
  const colorBlue = parseInt(hex.substring(5, 7), 16);

  return [colorRed, colorGreen, colorBlue];
}
