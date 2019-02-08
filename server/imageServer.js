const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

var currentImage

app.use(bodyParser.json({limit: '1mb'}));
app.use(express.static('public'));

// currently expecting to be sent an array in the request body
// should correspond to rgba values for an image.
var screenSize = {width:144, height:168};
app.post('/img', (req, res) => {
  currentImage = req.body
  res.status(200).send()
})

app.get('/img', (req, res) => {
  const img = createImage(req, currentImage.slice())
  res.send(img)
})

app.listen(port, function () {
  console.log('Image Server listening on port: ', port);
});

function createImage(request, data) {
  // I could use request to provide different formats
  // Here I'm assuming the request wants an image formatted for
  // a pebble time.

  var nearestColor, currentColor;
  var colors = generate8bitPalette();
  var rErr = 0;
  var gErr = 0;
  var bErr = 0;
  var errorArray = [];
  var row;
  var convertedData = [];

  // This is a dithering algorithem.
  // It simplifies the image to a smaller color palette
  // and spreads errors out to avoid color banding
  for(var i=0; i<data.length; i+=4){
    row = i % screenSize.width*4;
    if(row == 0){
      rErr = 0;
      gErr = 0;
      bErr = 0;
    }
    currentColor = {
      r: data[i] + rErr + (errorArray[row] && errorArray[row].r || 0),
      g: data[i+1] + gErr + (errorArray[row] && errorArray[row].g || 0),
      b: data[i+2] + bErr + (errorArray[row] && errorArray[row].b || 0)
    };
    nearestColor = getClosestColorFromPalette(currentColor, colors);
    convertedData.push(nearestColor.val);

    data[i] = nearestColor.r;
    data[i+1] = nearestColor.g;
    data[i+2] = nearestColor.b;
    data[i+3] = 255;

    errorArray[row-1] = {};
    errorArray[row] = {};

    rErr = (currentColor.r - nearestColor.r);
    gErr = (currentColor.g - nearestColor.g);
    bErr = (currentColor.b - nearestColor.b);

    errorArray[row-1].r = rErr * (1/4);
    errorArray[row-1].g = gErr * (1/4);
    errorArray[row-1].b = bErr * (1/4);

    errorArray[row].r = rErr * (1/4);
    errorArray[row].g = gErr * (1/4);
    errorArray[row].b = bErr * (1/4);

    rErr/=2;
    gErr/=2;
    bErr/=2;
  }

  return convertedData;
}

function generate8bitPalette() {
  var palette = [];
  for(var r=0; r<4; r++){
    for(var g=0; g<4; g++){
      for(var b=0; b<4; b++){
        palette.push({
          r: r*85,
          g: g*85,
          b: b*85,
          val: (3<<6)+(r<<4)+(g<<2)+b
        });
      }
    }
  }
  return palette;
}

function getClosestColorFromPalette(color, palette){
  var nearestColor = palette[0];
  for(var i=0; i < palette.length; i++){
    nearestColor = Math.min(getColorDistance(color,palette[i]),getColorDistance(color,nearestColor)) < getColorDistance(color,nearestColor) ? palette[i] : nearestColor;
  }
  return nearestColor;
}

function getColorDistance(color1,color2){
  return Math.hypot(color2.r-color1.r, color2.g-color1.g, color2.b-color1.b);
}