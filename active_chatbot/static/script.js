const increaseBtn = document.querySelector('.increase');
const decreaseBtn = document.querySelector('.decrease');
const sizeEL = document.querySelector('.size');
const colorEl = document.querySelector('.color');
const clearEl = document.querySelector('.clear');
const canvasColor = document.querySelector('.canvas-color')

const eraserBtn = document.querySelector('.eraser'); // Add this line

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let size = 4;
let isPressed = false
let color = 'black'
let x
let y
let lineCounter = 0;
const mouseMoveThreshold = 1; // Adjust this threshold as needed
let isAlmostStraight = false;
let isAlmostStraightV = false;
let firstY;
let firstX;
let line = 0;
let horizLine = false;
let vertLine = false;
let straightmessH = 0;
let straightmessV = 0;
let inactivityTimer;
let magicBrushActive = false;
let lastTime = 0;
let lastMouseX = 0;
let lastMouseY = 0;

function calculateDrawingSpeed(x, y) {
  const currentTime = Date.now();
  const timeDifference = currentTime - lastTime;
  const distance = Math.sqrt(Math.pow(x - lastMouseX, 2) + Math.pow(y - lastMouseY, 2));

  const speed = timeDifference > 0 ? distance / timeDifference : 0;

  if (speed > 0.5) { //
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

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        chatbox.sendInactiveMessage()
    }, 8000); // 60000 milliseconds = 1 minute
}
canvas.addEventListener('mousedown', (e) => {
    isPressed = true
    resetInactivityTimer();
    x = e.offsetX
    y = e.offsetY
    lineCounter++
    firstY = y;
    firstX = x;


})

canvas.addEventListener('mouseup', (e) => {
    isPressed = false
    resetInactivityTimer();
    x = undefined
    y = undefined

    if (isAlmostStraight && horizLine === true) {
       chatbox.sendStraightLineMessage();
            straightmessH++;
    }
     if (straightmessH >= 10 && horizLine === true) {
         chatbox.send10StraightLinesDone();
     }

     if (isAlmostStraightV && vertLine === true){
         chatbox.sendStraightLineMessage();
         straightmessV++;
    }
      if (straightmessV >= 10 && vertLine === true) {
         chatbox.send10StraightLinesDone2();
     }



})

canvas.addEventListener('mousemove', (e) => {
    if(isPressed) {
        resetInactivityTimer();
        const x2 = e.offsetX
        const y2 = e.offsetY

           if (magicBrushActive) {
            calculateDrawingSpeed(e.offsetX, e.offsetY);
        }

        drawCircle(x2, y2)
        drawLine(x, y, x2, y2)

        if (Math.abs(firstY-y2) < 3) {
            isAlmostStraight = true;
        } else {
            isAlmostStraight = false;
        }

        if (Math.abs(firstX-x2) < 3) {
            isAlmostStraightV = true;
        } else {
            isAlmostStraightV = false;
        }


        x = x2
        y = y2


        }

});

function erase(x, y) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}
function drawCircle(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = color
    ctx.lineWidth = size * 2
    ctx.stroke()

}

function updateSizeOnScreen() {
    sizeEL.innerText = size
}

function isEraserActive() {
    return eraserBtn.classList.contains('active');
}
// function eraser(){
//     context.globalCompositeOperation = "destination-out";
//     context.strokeStyle = "rgba(255,255,255,1)";
// }

increaseBtn.addEventListener('click', () => {
    size += 2

    if(size > 50) {
        size = 50
    }

    updateSizeOnScreen()
})

decreaseBtn.addEventListener('click', () => {
    size -= 2

    if(size < 2) {
        size = 2
    }

    updateSizeOnScreen()
})

colorEl.addEventListener('change', (e) =>{
    color = e.target.value
    eraserBtn.classList.remove('active')
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    magicBrushActive = false;
})
colorEl.addEventListener('click', (e) => {
    color = e.target.value
    eraserBtn.classList.remove('active')
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    magicBrushActive = false;
});


// canvasColor.value='#ffffff'
canvasColor.addEventListener('change', (e) => {
    canvas.style.background =e.target.value
    eraserBtn.classList.remove('active')
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;})

eraserBtn.addEventListener('click', () => {
    eraserBtn.classList.toggle('active');
    if (isEraserActive()) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(255,255,255,1)";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
    }


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

document.querySelector('.magicBrush').addEventListener('click', () => {
    eraserBtn.classList.remove('active')
    magicBrushActive = true;
    chatbox.infoMagicBrush();

});

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lineCounter = 0; // Reset the line counter
}


clearEl.addEventListener('click', () => {
    ctx.clearRect(0,0, canvas.width, canvas.height)
    eraserBtn.classList.remove('active')
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;

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
})