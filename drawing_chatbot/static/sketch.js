
let sketchRNN;
let currentStroke;
let x, y;
let nextPen = 'down';
let seedPath = [];
let seedPoints = [];
let strokePath = [];
let personDrawing = false;
let size = 6; // Initial stroke weight
let color = "black"
let drawingColor = color;
let savedColor;
let magicBrushActive = false;
let lastTime = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let sketchRNNActive = true;
let sketchRNNStrokes = []; // To store SketchRNN-generated strokes
let sketchRNNHistory = []; // Stores the history of all SketchRNN sessions
let currentSketchRNNStrokes = []; // Stores strokes for the current session
let releaseCounter = 0;
const increaseBtn = document.querySelector('.increase');
const decreaseBtn = document.querySelector('.decrease');
const sizeEL = document.querySelector('.size');
let sketchObject;


async function preload() {

    const sketchObj = await fetch('/static/objects.json')
    const sketchObjj = await sketchObj.json()
    const skObj = sketchObjj.objects;

    const randomObjIndex = Math.floor(Math.random() * skObj.length);
    sketchObject = skObj[randomObjIndex];
    sketchRNN = ml5.sketchRNN(sketchObject);
    console.log(sketchObject);
    chatbox.letUserKnowObject();

}

function changeColor(newColor) {
    color = newColor;
    savedColor = newColor;
    stroke(color); // Set the stroke to the new drawing color

}


function startDrawing() {
  personDrawing = true;
  x = mouseX;
  y = mouseY;

}


function sketchRNNStart() {
  if (!sketchRNNActive) {
    return; // Exit if sketchRNNStart is not active
  }
  sketchRNNHistory.push(currentSketchRNNStrokes);
  console.log('history' + sketchRNNHistory);

  // Start a new session
  currentSketchRNNStrokes = [];
  personDrawing = false;




  // Perform RDP Line Simplification
  const rdpPoints = [];
  const total = seedPoints.length;
  const start = seedPoints[0].point;
  const end = seedPoints[total - 1].point;
  rdpPoints.push(start);
  rdp(0, total - 1, seedPoints.map(p => p.point), rdpPoints);
  rdpPoints.push(end);

  // Drawing the simplified path with original colors
  for (let i = 0; i < rdpPoints.length - 1; i++) {

    let strokeColor = seedPoints[i].color; // Use the color stored with the stroke
    stroke(strokeColor);
    strokeWeight(size);
    line(rdpPoints[i].x, rdpPoints[i].y, rdpPoints[i+1].x, rdpPoints[i+1].y);
  }

  x = rdpPoints[rdpPoints.length - 1].x;
  y = rdpPoints[rdpPoints.length - 1].y;

  seedPath = [];
  // Converting to SketchRNN states
  for (let i = 1; i < rdpPoints.length; i++) {
    strokePath = {
      dx: rdpPoints[i].x - rdpPoints[i-1].x,
      dy: rdpPoints[i].y - rdpPoints[i-1].y,
      pen: 'down'
    }
    seedPath.push(strokePath);
  }

  sketchRNN.generate(seedPath, gotStrokePath);
}



function setup() {
  let canvas = createCanvas(1008, 740);
  canvas.position(10, 10);
  canvas.style('border', '2px solid #581B98FF');
  canvas.mousePressed(startDrawing);
  canvas.mouseReleased(function() {
      personDrawing = false;
    releaseCounter++; // Increment the counter each time the mouse is released
        if (releaseCounter >= 3) { // Check if the counter has reached 5
            setTimeout(sketchRNNStart, 2000); // Call SketchRNNStart with a delay
            releaseCounter = 0; // Reset the counter
        }
  });

  background(255);
  strokeWeight(size);
  stroke(color);

  console.log('model loaded');
  chatbox.letUserKnowObject();
}
function updateSizeOnScreen() {
    sizeEL.innerText = size
}


function SketchRNNCancel() {
    // preload();
    if (sketchRNNHistory.length > 0) {
        // Remove the last session
        sketchRNNHistory.pop();
    }
    background(255);
    redrawUserLines()

    // Redraw all remaining SketchRNN strokes except the last session
    sketchRNNHistory.forEach(session => {
        session.forEach(stroke => {
            strokeWeight(size);
            stroke(stroke.color); // Use the stored color for each stroke
            line(stroke.x, stroke.y, stroke.x + stroke.dx, stroke.y + stroke.dy);
        });
    });

    // Redraw the user's drawing with correct colors
    // strokeWeight(size);
    // seedPoints.forEach((point, index) => {
    //     // Skip the last point since there's no next point to draw a line to
    //     if (index < seedPoints.length - 1) {
    //         const nextPoint = seedPoints[index + 1];
    //         stroke(point.color); // Use the stored color
    //         line(point.point.x, point.point.y, nextPoint.point.x, nextPoint.point.y);
    //     }
    // });
    for (let i = 0; i < seedPoints.length - 1; i++) {
        const p1 = seedPoints[i];
        const p2 = seedPoints[i + 1];
        stroke(p1.color); // Use the color stored with the point
        line(p1.point.x, p1.point.y, p2.point.x, p2.point.y);
    }
}

    function setEraser() {
        console.log('eraser is active');
        drawingColor = "white";
        strokeWeight(20); // You can adjust the size of the eraser
        stroke(drawingColor);
        // seedPath = [];
        // seedPoints = [];
        // strokePath = [];
    }



    function restoreColorAfterEraser() {
        if (typeof savedColor === 'string' && savedColor) {
            drawingColor = savedColor; // Restore the drawing color from savedColor
            strokeWeight(size); // Reset stroke weight to the previous size

            console.log('Restoring color to:', drawingColor); // Debugging: Log the color being restored
            stroke(drawingColor); // Apply the restored color
        } else {
            console.error('Invalid savedColor:', savedColor); // Log an error if savedColor is not valid
        }
    }

    document.querySelector('.magicBrush').addEventListener('click', () => {
        magicBrushActive = !magicBrushActive; // Toggle MagicBrush mode
        if (!magicBrushActive) {
            color = savedColor; // Reset to saved color when MagicBrush mode is off
        }
        sketchRNNActive = true;
        chatbox.infoMagicBrush();
    });
    document.querySelector('.color').addEventListener('change', (e) => {
        savedColor = e.target.value; // Update the savedColor with the new color
        changeColor(savedColor); // Change to the selected color
        drawingColor = color; // Ensure drawingColor is updated to the new color
        stroke(drawingColor); // Apply the new drawing color
        restoreColorAfterEraser()
        sketchRNNActive = true;
        magicBrushActive = false;
    });

    document.querySelector('.color').addEventListener('click', (e) => {
        savedColor = e.target.value; // Update the savedColor with the new color
        changeColor(savedColor); // Change to the selected color
        drawingColor = color; // Ensure drawingColor is updated to the new color
        stroke(drawingColor); // Apply the new drawing color
        restoreColorAfterEraser()
        sketchRNNActive = true;
        magicBrushActive = false;


    })

    document.querySelector('.clear').addEventListener('click', () => {
        clearCanvas();
        // changeColor(savedColor);

        fetch("/track_delete_all_click", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                // Include any necessary headers, such as CSRF tokens if you're using CSRF protection
            },
            body: JSON.stringify({userId: userId})  // Replace "USER_ID" with the actual user ID
        })
            .then(response => response.json())
            .then(data => {
                console.log("Delete all click tracked successfully:", data);
            })
            .catch((error) => {
                console.error("Delete all tracking eraser click:", error);
            });

    });
    document.querySelector('.canvas-color').addEventListener('change', (e) => {
        background(e.target.value);
        color = savedColor; // reset to saved color
        stroke(color);
    });
    document.querySelector('.eraser').addEventListener('click', () => {
        setEraser();
        sketchRNNActive = false;
        magicBrushActive = false;

        // Send a POST request to the Flask server to track the click
        fetch("/track_eraser_click", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                // Include any necessary headers, such as CSRF tokens if you're using CSRF protection
            },
            body: JSON.stringify({userId: userId})  // Replace "USER_ID" with the actual user ID
        })
            .then(response => response.json())
            .then(data => {
                console.log("Eraser click tracked successfully:", data);
            })
            .catch((error) => {
                console.error("Error tracking eraser click:", error);
            });
    });
    increaseBtn.addEventListener('click', () => {
        size += 2

        if (size > 50) {
            size = 50
        }
        strokeWeight(size);

        updateSizeOnScreen()
    })

    decreaseBtn.addEventListener('click', () => {
        size -= 2

        if (size < 2) {
            size = 2
        }
        strokeWeight(size);
        updateSizeOnScreen()
    })


    function clearCanvas() {
        background(255);
        strokePath = [];
        seedPoints = [];
        seedPath = [];


    }

    function gotStrokePath(error, strokePath) {
        //console.error(error);
        //console.log(strokePath);
        currentStroke = strokePath;
    }

    /*new*/

    function calculateDrawingSpeed() {
        const currentTime = millis();
        const timeDifference = currentTime - lastTime;
        const distance = dist(mouseX, mouseY, lastMouseX, lastMouseY);

        // Speed calculation (distance per time unit)
        const speed = timeDifference > 0 ? distance / timeDifference : 0;

        // Set color based on speed
        // Adjust the speed thresholds as needed for your application
        if (speed > 0.5) {
            drawingColor = "red"; // Fast drawing
        } else if (speed < 0.1) {
            drawingColor = "blue"; // Slow drawing
        } else {
            drawingColor = "green"; // Moderate speed
        }

        // Update for next calculation
        lastTime = currentTime;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }

    function recordPoint(x, y, color) {
        seedPoints.push({point: createVector(x, y), color: color});
    }


    function draw() {
        stroke(drawingColor);
        strokeWeight(size);


        if (personDrawing) {
            if (magicBrushActive) {
                calculateDrawingSpeed(); // Update the color based on speed only if MagicBrush is active
            }

            line(mouseX, mouseY, pmouseX, pmouseY);
            // seedPoints.push(createVector(mouseX, mouseY));
            recordPoint(mouseX, mouseY, drawingColor);

        }

        if (currentStroke) {

            if (nextPen === 'end') {
                sketchRNN.reset();
                //sketchRNNStart();
                currentStroke = null;
                nextPen = 'down';
                return;
            }

            currentSketchRNNStrokes.push({x: x, y: y, dx: currentStroke.dx, dy: currentStroke.dy, pen: nextPen});
            // console.log('thats all strokes' + currentSketchRNNStrokes);
            if (nextPen === 'down') {
                line(x, y, x + currentStroke.dx, y + currentStroke.dy);
            }
            x += currentStroke.dx;
            y += currentStroke.dy;
            nextPen = currentStroke.pen;
            currentStroke = null;
            sketchRNN.generate(gotStrokePath);

            redrawUserLines();

        }


    }

    function redrawUserLines() {
        for (let i = 0; i < seedPoints.length - 1; i++) {
            const p1 = seedPoints[i];
            const p2 = seedPoints[i + 1];
            stroke(p1.color); // Use the color stored with the point
            line(p1.point.x, p1.point.y, p2.point.x, p2.point.y);
        }

    }







