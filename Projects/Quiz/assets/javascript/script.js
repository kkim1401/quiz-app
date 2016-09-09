/**
 * Created by Kevin_Kim on 8/30/16.
 */

function Question(question, answerChoices, correctIndex) {
    this.question = question;
    this.answerChoices = answerChoices;
    this.correctIndex = correctIndex;
    this.correct = false;
    //this.answered = false; //Will replace answered boolean and removeAnsweredQuestion method with simple popping of first item of array after next is clicked.
}

Question.prototype = {
    constructor: Question,
    evaluate: function(index) {
        //this.answered = true;
        if (index === this.correctIndex) {
            this.correct = true;
        }
    }
};

//Implementing Dan Martensen's basic Subject template for MVC.
function Subject() {
    var observers = [];
    return {
        add: function(observer) {
            observers.push(observer);
        },
        removeAll: function() {
            observers.length = 0;
        },
        notifyObservers: function() {
            observers.forEach(function(observer) {
                observer.notify();
            });
        }
    }
}

var questions = function() {
    var subject = Subject(),
        questions = [],
        numberCorrect = 0,
        totalNumber = 0;
    return {
        getFirstQuestion: function() {
            return questions[0];
        },
        getQuestionsLength: function() {
          return questions.length;
        },
        addQuestion: function(question) {
            questions.push(question);
        },
        removeQuestion: function() {
            questions.shift();
        },
        getTotalNumber: function() {
            return totalNumber;
        },
        getNumberCorrect: function() {
            return numberCorrect;
        },
        calcTotalNumber: function() {
            totalNumber = questions.length;
        },
        calcNumberCorrect: function(question) {
            if (question.correct) {
                numberCorrect++;
            }
        },
        register: function() {
            subject.removeAll();
            arguments.forEach(function(observer){
                subject.add(observer);
            });
        }
        };
}();

var handler = {
    initialize: function(args) {
        for (var i = 0; i < arguments.length; i++) {
            questions.addQuestion(arguments[i]);
        }
        questions.calcTotalNumber();
        this.display();
        this.setUpListener();
    },
    display: function() {
        view.render(questions.getFirstQuestion());
    },
    setUpListener: function() {
        var form = document.forms[0];
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            if (document.getElementsByTagName("fieldset")[0].hasChildNodes()) {
                console.log("in if statement of analyze");
                var choices = document.getElementsByName("choices");
                var question = questions.getFirstQuestion();
                for (var i = 0; i < choices.length; i++) {
                    if (choices[i].checked) {
                        question.evaluate(i);
                        questions.calcNumberCorrect(question);
                        questions.removeQuestion();
                    }
                }
                view.wipe();
                if(questions.getQuestionsLength()) {
                    handler.display();
                }
                else {
                    handler.conclude();
                }
            }
            else {
                this.conclude();
            }
        }, false);
    },
    conclude: function() {
        console.log("You got "+ questions.getNumberCorrect() + " out of " + questions.getTotalNumber());
    }

};

var view = function() {
    var fieldset = document.body.getElementsByTagName("fieldset")[0];
    return {
        render: function (question) {
            console.log("view.render activates!");
            var input,
                label,
                docFrag = document.createDocumentFragment(),
                label2 = document.createElement("label"),
                labelQuestion = document.createTextNode(question.question);
            label2.appendChild(labelQuestion);
            docFrag.appendChild(label2);
            for (var i = 0; i < question.answerChoices.length; i++) {
                input = document.createElement("input");
                label = document.createElement("label");
                input.type = "radio";
                input.name = "choices";
                input.value = question.answerChoices[i];
                label.appendChild(input);
                docFrag.appendChild(label);
                input.insertAdjacentHTML("afterend", input.value);
            }
            fieldset.appendChild(docFrag);
        },
        wipe: function () {
            fieldset.innerHTML = "";
        },
        conclude: function() {

        }
    };
}();

handler.initialize(new Question("What is your name?", ["Kevin", "Zoe"], 0));

