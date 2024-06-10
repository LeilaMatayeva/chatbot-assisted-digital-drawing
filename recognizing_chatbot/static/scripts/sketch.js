const WIDTH = 500;
const HEIGHT = 500;
let size = 4;
let color = "black"
const CROP_PADDING = (REPOS_PADDING = 2);

let model;
let pieChart;
let clicked = false;
let mousePosition = []
let savedColor = "black";
let magicBrushActive = false;
let lastTime = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let releaseCount = 0;
let lastPrediction = null; // Initialize with null to indicate no previous prediction

const increaseBtn = document.querySelector('.increase');
const decreaseBtn = document.querySelector('.decrease');
const sizeEL = document.querySelector('.size');
const colorEl = document.querySelector('.color');
const clearEl = document.querySelector('.clear');
const canvasColor = document.querySelector('.canvas-color');
const eraserBtn = document.querySelector('.eraser');

// Coordinates of the current drawn stroke [[x1, x2, ..., xn], [y1, y2, ..., yn]]
let strokePixels = [[], []];

// Coordinates of all canvas strokes [[[x1, x2, ..., xn], [y1, y2, ..., yn]], [[x1, x2, ..., xn], [y1, y2, ..., yn]], ...]
let imageStrokes = [];

function inRange(n, from, to) {
    return n >= from && n < to;
}

function setup() {
    createCanvas(WIDTH, HEIGHT);
    strokeWeight(size);
    stroke(color);
    background("#FFFFFF");
}

function calculateDrawingSpeed(x, y) {
    const currentTime = Date.now();
    const timeDifference = currentTime - lastTime;
    const distance = Math.sqrt(Math.pow(x - lastMouseX, 2) + Math.pow(y - lastMouseY, 2));

    const speed = timeDifference > 0 ? distance / timeDifference : 0;

    console.log("Speed:", speed); // Debugging log

    if (speed > 0.5) {
        color = "red";
    } else if (speed < 0.1) {
        color = "blue";
    } else {
        color = "green";
    }

    lastTime = currentTime;
    lastMouseX = x;
    lastMouseY = y;
}

function mouseDown() {
    clicked = true;
    mousePosition = [mouseX, mouseY];
}

function mouseMoved() {
    // Check whether mouse position is within canvas
    if (clicked && inRange(mouseX, 0, WIDTH) && inRange(mouseY, 0, HEIGHT)) {
          if (magicBrushActive) {
            calculateDrawingSpeed(mouseX, mouseY);
        }
        strokePixels[0].push(Math.floor(mouseX));
        strokePixels[1].push(Math.floor(mouseY));
        stroke(color);
        line(mouseX, mouseY, mousePosition[0], mousePosition[1]);
        mousePosition = [mouseX, mouseY]

    }
}

function mouseReleased() {
    if (inRange(mouseX, 0, WIDTH) && inRange(mouseY, 0, HEIGHT)) {
        if (strokePixels[0].length) {
            imageStrokes.push(strokePixels);
            strokePixels = [[], []];
        }
        clicked = false;
        releaseCount++;

        // Check if the counter has reached 5
        if (releaseCount === 5) {
            // Reset the counter
            releaseCount = 0;

            // Trigger the predict function
            const $canvas = document.getElementById("defaultCanvas0");
            predict($canvas);
        }

    }
}

function increaseSize() {
    size += 2;
    if (size > 50) size = 50;
    strokeWeight(size);
    updateSizeOnScreen()
}

// Decrease stroke size
function decreaseSize() {
    size -= 2;
    if (size < 2) size = 2;
    strokeWeight(size);
    updateSizeOnScreen()
}

function updateSizeOnScreen() {
    sizeEL.innerText = size
}

function setEraser() {
    color = "white";
    stroke(color);
}
// Change stroke color
function changeColor(newColor) {
    color = newColor;
    savedColor = newColor;
    // if (eraserActive) {
    //     eraserActive = false;
    // }
    stroke(color);
}

document.querySelector('.magicBrush').addEventListener('click', () => {
    magicBrushActive = true;
    chatbox.infoMagicBrush();
});
// Clear canvas
function clearCanvas() {
    clear();
    background(255);
    imageStrokes = [];
}

// Event listeners for buttons
document.querySelector('.increase').addEventListener('click', increaseSize);
document.querySelector('.decrease').addEventListener('click', decreaseSize);
document.querySelector('.eraser').addEventListener('click', () => {
    setEraser()
    magicBrushActive = false;

    // Send a POST request to the Flask server to track the click
    fetch("/track_eraser_click", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            // Include any necessary headers, such as CSRF tokens if you're using CSRF protection
        },
        body: JSON.stringify({ userId: userId })  // Replace "USER_ID" with the actual user ID
    })
    .then(response => response.json())
    .then(data => {
        console.log("Eraser click tracked successfully:", data);
    })
    .catch((error) => {
        console.error("Error tracking eraser click:", error);
    });



});
document.querySelector('.color').addEventListener('change', (e) => {
    changeColor(e.target.value)
     magicBrushActive = false;
});
document.querySelector('.color').addEventListener('click', () => {
    color = savedColor;
    stroke(color)
     magicBrushActive = false;
})
document.querySelector('.clear').addEventListener('click', () => {
    clearCanvas();
    color = savedColor; // reset to saved color
    stroke(color);

    fetch("/track_delete_all_click", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            // Include any necessary headers, such as CSRF tokens if you're using CSRF protection
        },
        body: JSON.stringify({ userId: userId })  // Replace "USER_ID" with the actual user ID
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

const loadModel = async () => {
    console.log("Model loading...");

    model = await tflite.loadTFLiteModel(modelPath);
    model.predict(tf.zeros([1, 28, 28, 1])); // warmup

    console.log(`Model loaded! (${LABELS.length} classes)`);
};

const preprocess = async (cb) => {
    const {min, max} = getBoundingBox();

    // Resize to 28x28 pixel & crop
    const imageBlob = await fetch("/transform", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
            strokes: imageStrokes,
            box: [min.x, min.y, max.x, max.y],
        }),
    }).then((response) => response.blob());

    const img = new Image(28, 28);
    img.src = URL.createObjectURL(imageBlob);

    img.onload = () => {
        const tensor = tf.tidy(() =>
            tf.browser.fromPixels(img, 1).toFloat().expandDims(0)
        );
        cb(tensor);
    };
};

const drawPie = (top3) => {
    const probs = [];
    const labels = [];

    for (const pred of top3) {
        const prop = +pred.probability.toPrecision(2);
        probs.push(prop);
        labels.push(`${pred.className} (${prop})`);
    }

    const others = +(
        1 - probs.reduce((prev, prob) => prev + prob, 0)
    ).toPrecision(2);
    probs.push(others);
    labels.push(`Others (${others})`);

    if (pieChart) pieChart.destroy();

    const ctx = document.getElementById("predictions").getContext("2d");
    pieChart = new Chart(ctx, {
        type: "pie",
        options: {
            plugins: {
                legend: {
                    position: "bottom",
                },
                title: {
                    display: true,
                    text: "Top 3 Predictions",
                },
            },
        },
        data: {
            labels,
            datasets: [
                {
                    label: "Top 3 predictions",
                    data: probs,
                    backgroundColor: [
                        "rgb(255, 99, 132)",
                        "rgb(54, 162, 235)",
                        "rgb(255, 205, 86)",
                        "rgb(97,96,96)",
                    ],
                },
            ],
        },
    });
};

const getMinimumCoordinates = () => {
    let min_x = Number.MAX_SAFE_INTEGER;
    let min_y = Number.MAX_SAFE_INTEGER;

    for (const stroke of imageStrokes) {
        for (let i = 0; i < stroke[0].length; i++) {
            min_x = Math.min(min_x, stroke[0][i]);
            min_y = Math.min(min_y, stroke[1][i]);
        }
    }

    return [Math.max(0, min_x), Math.max(0, min_y)];
};

const getBoundingBox = () => {
    repositionImage();

    const coords_x = [];
    const coords_y = [];

    for (const stroke of imageStrokes) {
        for (let i = 0; i < stroke[0].length; i++) {
            coords_x.push(stroke[0][i]);
            coords_y.push(stroke[1][i]);
        }
    }

    const x_min = Math.min(...coords_x);
    const x_max = Math.max(...coords_x);
    const y_min = Math.min(...coords_y);
    const y_max = Math.max(...coords_y);

    // New width & height of cropped image
    const width = Math.max(...coords_x) - Math.min(...coords_x);
    const height = Math.max(...coords_y) - Math.min(...coords_y);

    const coords_min = {
        x: Math.max(0, x_min - CROP_PADDING), //
        y: Math.max(0, y_min - CROP_PADDING), //
    };
    let coords_max;

    if (width > height)
        // Left + right edge as boundary
        coords_max = {
            x: Math.min(WIDTH, x_max + CROP_PADDING), // Right edge
            y: Math.max(0, y_min + CROP_PADDING) + width, // Lower edge
        };
    // Upper + lower edge as boundary
    else
        coords_max = {
            x: Math.max(0, x_min + CROP_PADDING) + height, // Right edge
            y: Math.min(HEIGHT, y_max + CROP_PADDING), // Lower edge
        };

    return {
        min: coords_min,
        max: coords_max,
    };
};

// Reposition image to top left corner
const repositionImage = () => {
    const [min_x, min_y] = getMinimumCoordinates();
    for (const stroke of imageStrokes) {
        for (let i = 0; i < stroke[0].length; i++) {
            stroke[0][i] = stroke[0][i] - min_x + REPOS_PADDING;
            stroke[1][i] = stroke[1][i] - min_y + REPOS_PADDING;
        }
    }
};

const maxResult = (obj) => {
	var name = obj.className;
	var probability = obj.probability;
	//var text = obj.className + " - " + Math.round(probability*100) + "%";
	var text = obj.className;
    //chatbox.sendRecMes(text);
    return {text, probability};
};

const predict = async () => {
    if (!imageStrokes.length) return;
    if (!LABELS.length) throw new Error("No labels found!");

    preprocess((tensor) => {
        const predictions = model.predict(tensor).dataSync();

        const top3 = Array.from(predictions)
            .map((p, i) => ({
                probability: p,
                className: LABELS[i],
                index: i,
            }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3);

        //drawPie(top3);
        console.log(top3)
        var recognitionText = maxResult(top3[0]);
           if (recognitionText.text !== lastPrediction) {
            // Update lastPrediction with the current recognized object
            lastPrediction = recognitionText.text;
            chatbox.sendRecMes(recognitionText);
        } else {
               console.log('same object recognized');
           }
    });
};


const sizeCanvas = () => {
    //clear();
    var canvas = document.querySelector("#defaultCanvas0");
    var predictions = document.querySelector("#predictions");
    //const $wsize = document.getElementById("wsize");
    //const $hsize = document.getElementById("hsize");
    //var w = wsize.value;
    //var h = hsize.value;
    //var wstr = w.toString() + 'px';
    //var hstr = h.toString() + 'px';

    var wstr = '1005px';
    var hstr = '740px';

    canvas.style.width = wstr;
    canvas.style.height = hstr;
    // predictions.style.width = wstr;
    // predictions.style.height = hstr;
};


window.onload = () => {

    // setInterval(  () => {
    //     predict($canvas);
    // }, 2000)

    const $canvas = document.getElementById("defaultCanvas0");

    loadModel();
    sizeCanvas();
    $canvas.addEventListener("mousedown", (e) => mouseDown(e));
    $canvas.addEventListener("mousemove", (e) => mouseMoved(e));

    //$submit.addEventListener("click", () => predict($canvas));
    //$clear.addEventListener("click", clearCanvas);
};