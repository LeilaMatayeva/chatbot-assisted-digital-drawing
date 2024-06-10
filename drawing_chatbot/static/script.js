// const increaseBtn = document.querySelector('.increase');
// const decreaseBtn = document.querySelector('.decrease');
// const sizeEL = document.querySelector('.size');
// const colorEl = document.querySelector('.color');
// const clearEl = document.querySelector('.clear');
// const canvasColor = document.querySelector('.canvas-color')
//
// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');
//
// let size = 2;
// let isPressed = false
// let color = 'black'
// let x
// let y
// let lineCounter = 0;
// const mouseMoveThreshold = 1; // Adjust this threshold as needed
// let isAlmostStraight = false;
// let isAlmostStraightV = false;
// let firstY;
// let firstX;
// let line = 0;
// let horizLine = false;
// let vertLine = false;
// let straightmessH = 0;
// let straightmessV = 0;
// canvas.addEventListener('mousedown', (e) => {
//     isPressed = true
//
//     x = e.offsetX
//     y = e.offsetY
//     lineCounter++
//     firstY = y;
//     firstX = x;
//
//
// })
//
// canvas.addEventListener('mouseup', (e) => {
//     isPressed = false
//
//     x = undefined
//     y = undefined
//
//     if (isAlmostStraight && horizLine === true) {
//         chatbox.sendStraightLineMessage();
//             straightmessH++;
//     }
//      if (straightmessH >= 10 && horizLine === true) {
//          chatbox.send10StraightLinesDone();
//      }
//
//      if (isAlmostStraightV && vertLine === true){
//          chatbox.sendStraightLineMessage();
//          straightmessV++;
//     }
//       if (straightmessV >= 10 && vertLine === true) {
//          chatbox.send10StraightLinesDone2();
//      }
//
//
//
// })
//
// canvas.addEventListener('mousemove', (e) => {
//     if(isPressed) {
//         const x2 = e.offsetX
//         const y2 = e.offsetY
//
//         drawCircle(x2, y2)
//         drawLine(x, y, x2, y2)
//
//         if (Math.abs(firstY-y2) < 3) {
//             isAlmostStraight = true;
//         } else {
//             isAlmostStraight = false;
//         }
//
//         if (Math.abs(firstX-x2) < 3) {
//             isAlmostStraightV = true;
//         } else {
//             isAlmostStraightV = false;
//         }
//
//
//         x = x2
//         y = y2
//
//
//         }
//
// });
//
//
// function drawCircle(x, y) {
//     ctx.beginPath();
//     ctx.arc(x, y, size, 0, Math.PI * 2)
//     ctx.fillStyle = color
//     ctx.fill()
// }
//
// function drawLine(x1, y1, x2, y2) {
//     ctx.beginPath()
//     ctx.moveTo(x1, y1)
//     ctx.lineTo(x2, y2)
//     ctx.strokeStyle = color
//     ctx.lineWidth = size * 2
//     ctx.stroke()
//
// }
//
// function updateSizeOnScreen() {
//     sizeEL.innerText = size
// }
//
//
// // function eraser(){
// //     context.globalCompositeOperation = "destination-out";
// //     context.strokeStyle = "rgba(255,255,255,1)";
// // }
//
// increaseBtn.addEventListener('click', () => {
//     size += 2
//
//     if(size > 50) {
//         size = 50
//     }
//
//     updateSizeOnScreen()
// })
//
// decreaseBtn.addEventListener('click', () => {
//     size -= 5
//
//     if(size < 5) {
//         size = 5
//     }
//
//     updateSizeOnScreen()
// })
//
// colorEl.addEventListener('change', (e) => color = e.target.value)
//
// // canvasColor.value='#ffffff'
// canvasColor.addEventListener('change', (e) => canvas.style.background =e.target.value)
//
// function clearCanvas() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     lineCounter = 0; // Reset the line counter
// }
//
//
// clearEl.addEventListener('click', () => ctx.clearRect(0,0, canvas.width, canvas.height))