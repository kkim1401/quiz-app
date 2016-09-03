/**
 * Created by Kevin_Kim on 8/30/16.
 */

function Question(question, answerChoices, correctIndex) {
    this.question = question;
    this.answerChoices = answerChoices;
    this.correctIndex = correctIndex;
    this.correct = false;
    this.answered = false; //Will replace answered boolean and removeAnsweredQuestion method with simple popping of first item of array after next is clicked.
}

Question.prototype = {
    constructor: Question,
    evaluate: function(index) {
        this.answered = true;
        if (index === this.correctIndex) {
            this.correct = true;
        }
    }
};

var questions = function() {
    var questions = [],
        numberCorrect = 0,
        totalNumber = 0;
    return {

        //Methods for initialization and maintenance
        getQuestion: function() {
            return questions;
        },
        addQuestion: function(question) {
            questions.push(question);
        },
        removeQuestion: function(question) {
            questions.splice(questions.indexOf(question), 1);
        },
        removeAnsweredQuestion: function() {
            questions.forEach(function(question) {
                if (question.answered) {
                    questions.splice(questions.indexOf(question), 1);
                }
            });
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
        //Methods for conclusion
        calcNumberCorrect: function(question) {
            if (question.correct) {
                numberCorrect++;
            }
        }
        };
}();

var handler = {
    initialize: function(arg) {
        for (var i = 0; i < arguments.length; i++) {
            questions.addQuestion(arguments[i]);
        }
        questions.calcTotalNumber();
        this.display();
        this.setUpListener();
    },
    display: function() {
        view.render(questions.getQuestion()[0]);
    },
    setUpListener: function() {
        var form = document.forms[0];
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            if (document.getElementsByTagName("fieldset")[0].hasChildNodes()) {
                console.log("in if statement of analyze");
                var choices = document.getElementsByName("choices");
                for (var i = 0; i < choices.length; i++) {
                    if (choices[i].checked) {
                        var question = questions.getQuestion()[i];
                        question.evaluate(i);
                        questions.calcNumberCorrect(question);
                        questions.removeQuestion(question);
                    }
                }
                view.wipe();
                if(questions.getQuestion().length) {
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
                input.insertAdjacentHTML("afterend", input.value);
                docFrag.appendChild(label);
            }
            fieldset.appendChild(docFrag);
        },
        wipe: function () {
            fieldset.innerHTML = "";
        }
    };
}();

handler.initialize(new Question("What is your name?", ["Kevin", "Zoe"], 0));

