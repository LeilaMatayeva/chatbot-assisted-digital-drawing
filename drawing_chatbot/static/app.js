

class Chatbox {
    constructor() {
        this.args = {
            openButton: document.querySelector('.chatbox__button'),
            chatBox: document.querySelector('.chatbox__support'),
            sendButton: document.querySelector('.send__button'),
            imageFirstEx: document.querySelector('.image_exercise'),
            typingMessage: document.querySelector('.typing-message'),
            mMessages: document.querySelector('.chatbox__messages')


        }
        this.state = false;
        this.messages = [];
        this.notificationSound = new Audio('/static/sounds/message_pop.mp3');

    }


    display() {
        const {openButton, chatBox, sendButton} = this.args;
        openButton.addEventListener('click', () => this.toggleState(chatBox))
        sendButton.addEventListener('click', () => this.onSendButton(chatBox))

        const node = chatBox.querySelector('input');
        node.addEventListener('keyup', ({key}) => {
            if (key === 'Enter') {
                this.onSendButton(chatBox)
            }
        })

        this.toggleState(chatBox);
        // this.sendAdvice(chatBox);


    }

    toggleState(chatbox) {
        this.state = !this.state;

        if (this.state) {
            chatbox.classList.add('chatbox--active')
             if (this.messages.length === 0) {
                let msg2 = {
                    name: 'Art Teacher',
                    message: 'Hey:) I am here to help you with your drawings. I will be adding some sketches which I think are fitting.'
                };
                this.messages.push(msg2);
                this.updateChatText(chatbox);

                 setTimeout(() => {
                let msg5 = {
                    name: 'Art Teacher',
                    message: 'You can always completely stop me from drawing by texting "stop" and restart my sketching by texting "start"'
                };
                this.messages.push(msg5);
                this.playNotificationSound();
                this.updateChatText(chatbox);


                }, 7000)

                 setTimeout(() => {
                let msg4 = {
                    name: 'Art Teacher',
                    message: 'Text me "undo" if you do not like my sketch and I will remove it'
                };
                this.messages.push(msg4);
                this.playNotificationSound();
                this.updateChatText(chatbox);

                }, 5000)
                //
                //  setTimeout(() => {
                // const info =  {name: 'Art Teacher', message:"Maybe we can start by drawing" +  " " + sketchObject + ". "+ "If you want to draw something else. type 'stop' and then 'start'" };
                // this.messages.push(info);
                // this.playNotificationSound();
                //  this.updateChatText(this.args.chatBox);
                //
                // }, 9000)



            } else {
            }
        } else {
            chatbox.classList.remove('chatbox--active')
        }

    }

    onSendButton(chatbox) {
        var textField = chatbox.querySelector('input');
        let text1 = textField.value
        let ta = ''
        if (text1 === '') {
            return
        }
        let msg1 = {name: 'User', message: text1}
        this.messages.push(msg1);

        let typingMessage = {name: 'Art Teacher', message: '...'};
        this.args.typingMessage = typingMessage
        this.messages.push(typingMessage);
        this.updateChatText(chatbox);

        fetch($SCRIPT_ROOT + '/predict', {
            method: 'POST',
            body: JSON.stringify({message: text1}),
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
        })

            .then(r => r.json())
            .then(r => {
                setTimeout(() => {
                    this.messages.pop(); // Remove the typing message
                    this.updateChatText(chatbox);

                    const responses = r.answer.split('\n');
                    for (let i = 0; i < responses.length; i++) {
                        let msg2 = {name: 'Art Teacher', message: responses[i]};
                        this.messages.push(msg2);
                        this.playNotificationSound();
                    }
                    this.updateChatText(chatbox)
                    textField.value = ''
                    var ex1 = '';
                    ex1 +=  '<img src="/static/images/flower1.png" style="width: 250px; height: 250px" />';
                    if (r.tag === 'exercise 1') {
                        clearCanvas();
                        let msg2 = {name: 'Art Teacher', message: ex1};
                        this.messages.push(msg2)
                        this.updateChatText(chatbox)
                    }
              if (r.tag === 'finished'){

                        stopTimer()
                         html2canvas(document.body).then(canvas => {
                        // Convert the canvas to a data URL
                        let screenshot = canvas.toDataURL('image/png');

                            // Send the screenshot to the server
                            fetch('/submit_screenshot', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ image: screenshot })
                            })
                            .then(response => response.json())
                            .then(data => {
                                console.log("Screenshot submitted successfully:", data);
                            })
                            .catch((error) => {
                                console.error("Error submitting screenshot:", error);
                            });
                        });
                    }
                     if (r.tag === 'exercise 2 started') {
                                clearCanvas();
                             // Set a timer to send 'time is out' message after 1 minute
                             setTimeout(() => {
                                 let timeOutMessage = {name: 'Art Teacher', message: '1 minute has passed!'};
                                 this.messages.push(timeOutMessage);
                                 this.updateChatText(chatbox);
                                 clearCanvas();
                                 let continueMessage2 =  {name: 'Art Teacher', message: 'Let me know if you want to repeat this exercise. Otherwise tell me the number of exercise you want to continue on:)'};
                                 this.messages.push(continueMessage2);
                                 this.updateChatText(chatbox);
                             }, 30000); // 60000 milliseconds = 1 minute
                         }
                     if(r.tag === 'exercise 3'){
                         clearCanvas();
                     }
                    if (r.tag === 'exercise 3 finished') {
                       setTimeout(() => {
                        if(lineCounter>3) {
                        let lineLimit = { name: 'Art Teacher', message: '3 lines limit is exceeded! Try again' };
                        this.messages.push(lineLimit);
                        this.updateChatText(this.args.chatBox);
                        setTimeout(() => {
                        clearCanvas();},1000) }
                        else {
                            let lineLimit = { name: 'Art Teacher', message: 'Good job! 3 lines limit is not exceeded! To continue with the exercises, please type the number of the exercise you want to do:)' };
                        this.messages.push(lineLimit);
                        this.updateChatText(this.args.chatBox);
                        }
                        }, 2000);
                        }

                    if (r.tag === 'exercise 4') {
                        clearCanvas();
                        horizLine = true;

                    }
                    if (r.tag === 'exercise 5') {
                        clearCanvas();
                        vertLine = true;
                    }
                     if (r.tag === 'undo') {
                        SketchRNNCancel();
                    }
                     if (r.tag === 'stop_model'){
                         sketchRNNActive = false;

                     }
                     if (r.tag === 'start_model'){
                         sketchRNNActive = true;
                           preload();
                            // const info =  {name: 'Art Teacher', message:"Maybe we can start by drawing" +  " " + sketchObject + ". "+ "If you want to draw something else. type 'stop' and then 'start'" };
                            // this.messages.push(info);
                            // this.playNotificationSound();
                            // this.updateChatText(this.args.chatBox);

                     }
                     if (r.tag === 'next_object'){
                           sketchRNNActive = true;
                           preload();
                           clearCanvas();
                     }

                }, 2000);
            }).catch((error) => {
            console.error('Error:', error);
            this.updateChatText(chatbox)
            textField.value = ''});


    }
    sendStraightLineMessage() {
    // Add your code to send a message to the chatbot
    const straightLineMessage = { name: 'Art Teacher', message: 'Line is straight!' };
    this.messages.push(straightLineMessage);
    this.updateChatText(this.args.chatBox);
}
    send10StraightLinesDone() {
        const straighmesHdone = {
            name: 'Art Teacher',
            message: 'Nice job! You did 10 horizontal straight lines. To continue with the exercises, please type the number of the exercise you want to do:)'
        };
        this.messages.push(straighmesHdone);
        this.updateChatText(this.args.chatBox);
        horizLine = false;
        vertLine = false;
        straightmessH = 0;


}
    send10StraightLinesDone2() {
        const straighmesVdone = {
            name: 'Art Teacher',
            message: 'Nice job! You did 10 vertical straight lines. To continue with the exercises, please type the number of the exercise you want to do:)'
        };
        this.messages.push(straighmesVdone);
        this.updateChatText(this.args.chatBox);
        vertLine = false;
        horizLine = false;
        straightmessV = 0;
}

 infoMagicBrush() {
        const info =  {name: 'Art Teacher', message:'That is a brush that changes its color depending on how fast or slow you are drawing. Give it a try!'};
        this.messages.push(info);
        this.playNotificationSound();
        this.updateChatText(this.args.chatBox);
 }
 letUserKnowObject() {
     if (sketchObject) {
         const info = {
             name: 'Art Teacher',
             message: "Maybe we can start by drawing" + " " + sketchObject + ". " + "If you want to draw something else. type 'next'!'"
         };
         this.messages.push(info);
         this.playNotificationSound();
         this.updateChatText(this.args.chatBox);
     }
 }


    updateChatText(chatbox) {
        var html = '';
        this.messages.slice().reverse().forEach(function (item,) {
            if (item.name === 'Art Teacher') {
                html += '<div class="messages__item messages__item--visitor">' + item.message + '</div>'
            } else {
                html += '<div class="messages__item messages__item--operator">' + item.message + '</div>'
            }
        });
        const chatmessage = chatbox.querySelector('.chatbox__messages');
        chatmessage.innerHTML = html;



    }

     playNotificationSound() {
        this.notificationSound.play().catch(error => console.error('Error playing the sound:', error));
    }

}


const chatbox = new Chatbox();

chatbox.display();
