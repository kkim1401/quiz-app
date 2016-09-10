/**
 * Created by Kevin_Kim on 8/30/16.
 */

function Question(question, answerChoices, correctIndex) {
    this.question = question;
    this.answerChoices = answerChoices;
    this.correctIndex = correctIndex;
    this.correct = false;
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

function QuestionsModel() {
    var subject = Subject(),
        questions = [],
        numberCorrect = 0,
        totalNumber = 0;

    //QuestionsModel object
    return {
        getFirstQuestion: function () {
            return questions[0];
        },
        getQuestionsLength: function () {
            return questions.length;
        },
        addQuestion: function (question) {
            questions.push(question);
            subject.notifyObservers();
        },
        removeQuestion: function () {
            questions.shift();
            subject.notifyObservers();
        },
        getTotalNumber: function () {
            return totalNumber;
        },
        getNumberCorrect: function () {
            return numberCorrect;
        },
        calcTotalNumber: function () {
            totalNumber = questions.length;
            subject.notifyObservers();
        },
        calcNumberCorrect: function (question) {
            if (question.correct) {
                numberCorrect++;
            }
        },
        register: function (args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function Handler(view, model) {
    return {
        notify: function () {
            var DOM = view.getDOM();
            DOM.form.addEventListener("submit", function (event) { //remove this handler later
                event.preventDefault();
                if (DOM.fieldset.hasChildNodes()) {
                    var question = model.getFirstQuestion();
                    for (var i = 0; i < DOM.choices.length; i++) {
                        if (DOM.choices[i].checked) {
                            question.evaluate(i);
                            model.calcNumberCorrect(question);
                            model.removeQuestion();
                        }
                    }
                }
            }, false);
        }
    };
}

function View(model) {
    var DOM = {
        form: document.forms[0],
        fieldset: document.getElementsByTagName("fieldset")[0],
        choices: document.getElementsByName("choices")
    };
    return {
        getDOM: function() {
            return DOM;
    },
        notify: function () {
            DOM.fieldset.innerHTML = "";
            if (model.getQuestionsLength()) {
            var input,
                label,
                docFrag = document.createDocumentFragment(),
                labelForQuestion = document.createElement("label"),
                labelQuestion = document.createTextNode(model.getFirstQuestion().question);
            labelForQuestion.appendChild(labelQuestion);
            docFrag.appendChild(labelForQuestion);
            for (var i = 0; i < model.getFirstQuestion().answerChoices.length; i++) {
                input = document.createElement("input");
                label = document.createElement("label");
                input.type = "radio";
                input.name = "choices";
                input.value = model.getFirstQuestion().answerChoices[i];
                label.appendChild(input);
                docFrag.appendChild(label);
                input.insertAdjacentHTML("afterend", input.value);
            }
            DOM.fieldset.appendChild(docFrag);
            }
            else {
            console.log("You got "+ model.getNumberCorrect() + " out of " + model.getTotalNumber());
        }
        }
    };
}


//Initialization
var model = QuestionsModel(),
    view = View(model),
    handler = Handler(view, model);

model.register(handler, view);
model.addQuestion(new Question("What is your name?", ["Kevin", "Zoe"], 0));





