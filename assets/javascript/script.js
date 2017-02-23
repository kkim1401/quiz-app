/**
 * Created by Kevin_Kim on 8/30/16.
 */

function Question(question) {
    this.question = question.question;
    this.correct = false;
}

function MultipleChoice(question) {
    Question.call(this, question);
    this.answerChoices = question.choices;
    this.correctIndex = question.correctIndex;

}

function FillInTheBlank(question) {
    Question.call(this, question);
    this.correctAnswer = question.answer;
}

function DragAndDrop(question) {
    Question.call(this, question);
    this.items = question.items;
    this.correctAnswers = question.answers;
}

function inheritPrototype() {
    for (var i = 0; i < arguments.length; i++) {
        var prototype = Object.create(Question);
        prototype.constructor = arguments[i];
        arguments[i].prototype = prototype;
    }
}

inheritPrototype(MultipleChoice, FillInTheBlank, DragAndDrop);

MultipleChoice.prototype.evaluate = function(index) {
    this.chosenIndex = index;
    this.correct = this.chosenIndex === this.correctIndex;
};

FillInTheBlank.prototype.evaluate = function(answer) {
    this.correct = answer.toLowerCase() === this.correctAnswer.toLowerCase();
};

DragAndDrop.prototype.evaluate = function(items) {
    this.correct = this.correctAnswers === items;
};

DragAndDrop.prototype.getQuestion = function() {

};

function Subject() {
    var observers = [];
    return {
        add: function (observer) {
            observers.push(observer);
        },
        removeAll: function () {
            observers.length = 0;
        },
        notifyObservers: function () {
            observers.forEach(function (observer) {
                observer.notify();
            });
        }
    }
}

function QuestionsModel() {
    var subject = Subject(),
        questions = [],
        numberCorrect = 0,
        totalNumber = 0,
        questionNumber = 0;
    return {
        getQuestion: function () {
            return questions[questionNumber];
        },
        getQuestionsLength: function () {
            return questions.length;
        },
        getQuestionNumber: function () {
            return questionNumber;
        },
        addQuestion: function (data) {
            data.forEach(function(item) {
                switch (true) {
                    case "choices" in item:
                        questions.push(new MultipleChoice(item));
                        break;
                    case "answer" in item:
                        questions.push(new FillInTheBlank(item));
                        break;
                    case "items" in item:
                        questions.push(new DragAndDrop((item)));
                }
            });
            totalNumber = questions.length;
            subject.notifyObservers();
        },
        nextQuestion: function () {
            questionNumber++;
            subject.notifyObservers();
        },
        back: function () {
            questionNumber--;
            subject.notifyObservers();
        },
        getTotalNumber: function () {
            return totalNumber;
        },
        getNumberCorrect: function () {
            return numberCorrect;
        },
        calcNumberCorrect: function () {
            questions.forEach(function(item) {
                if (item.correct) {
                    numberCorrect++;
                }
            });
        },
        register: function (args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function Controller(view, model) {
    var DOM = view.getDOM();
    //To stop the quiz from refreshing when pressing enter.
    DOM.quiz.addEventListener("submit", function(){
        event.preventDefault();
    });
    function process()
    {
        var question = model.getQuestion();
        switch(question.constructor)
        {
            case MultipleChoice:
                DOM.choices.forEach(function (choice, count) {
                    if (choice.checked) {
                        question.evaluate(count);
                    }
                });
                break;
            case FillInTheBlank:
                question.evaluate(DOM.getBlank().value);
                break;
            case DragAndDrop:
                var items = Array.prototype.concat(DOM.getItemBlank());
                var values = items.map(function(item, index) {
                    return item.values;
                });
                question.evaluate(values);
                break;
            default:
                break;
        }
    }
    function Handler (event) {
        //I want to separate application logic and event-handling logic.
        switch (event.target) {
            case DOM.getNext():
                if (model.getQuestionNumber() < model.getQuestionsLength()) {
                    process();
                    if (model.getQuestionNumber() === model.getQuestionsLength() - 1) {
                        model.calcNumberCorrect();
                    }
                    //Have to check for validity since HTML5 validation API won't work for click events.
                    if (DOM.quiz.checkValidity()) {
                        $fade(DOM.$quiz, "fast", model.nextQuestion);
                    }
                    else {
                        alert("Please answer the question.");
                        break;
                    }

                }
                break;
            case DOM.getBack():
                if (model.getQuestionNumber() > 0) {
                    process();
                    model.back();
                }
                else {
                    alert("This is the first question!");
                }
                break;
            case DOM.getTryAgain():
                location.reload();
                break;
            default:
                //Need to break for any other event targets so that the form can keep listening for clicks.
                break;
        }
    }
    DOM.quiz.addEventListener("click", Handler, false);
    return {
        /*notify: function () {
            //For some reason, item or item-blank classes are added in drag/drop events.
            DOM.quiz.addEventListener("dragstart", function (event) {
                if (event.target.className = "item") {
                    //console.log("drag start");
                    //event.dataTransfer.setData("text", event.target.firstChild.data);
                    //event.dataTransfer.effectAllowed = "copy";
                    //console.log(event.dataTransfer.getData("text"));
                }
            });
            DOM.getItemBlank().forEach(function (itemblank) {
                itemblank.addEventListener("dragover", function (event) {
                    if (event.target.className = "item") {
                        //console.log("drag over");
                        event.preventDefault();
                        //event.dataTransfer.dropEffect = "copy";
                    }
                })
            });
            DOM.quiz.addEventListener("dragenter", function (event) {
                if (event.target.className = "item-blank") {
                    //console.log("drag enter");
                    //event.preventDefault();
                }
            });
            DOM.quiz.addEventListener("drop", function (event) {
                //event.preventDefault();
                if (event.target.className = "item-blank") {
                    //console.log("drop");
                    //var data = event.dataTransfer.getData("text");
                    //event.target.value = data;
                }
            });
        }*/
    }
}

function View(model) {
    var DOM = {
            $quiz: $(".quiz").find("form"),
            quiz: document.forms[1],
            fieldset: document.forms[1].getElementsByTagName("fieldset")[0],
            choices: document.getElementsByName("choices"),
            items: document.forms[1].elements["item"],
        /* The following properties are functions since their return values do not exist when this DOM object is initialized.
        DOM.choices get a pass since it returns a NodeList.
         */
            getNext: function() {
                return document.getElementsByName("next")[0];
            },
            getBack: function(){
                return document.getElementsByName("back")[0];
            },
            getTryAgain: function() {
                return document.getElementsByName("try-again")[0];
            },
            getBlank: function() {
                return document.forms[1].elements["blank"];
            },
            getItemBlank: function() {
                return document.forms[1].elements["item-blank"];
            },
            getItemsList: function() {
                return document.getElementsByClassName("items-list")[0];
            }
        },
        template = Handlebars.compile(document.getElementById("template").innerHTML);
    Handlebars.registerHelper("getQuestion", function(options) {
        if (this.items) {
            return this.question.split(" ").reduce(function(acc, val) {
                if (val.includes("___")) {
                    val = "<input type='text' name='item-blank' readonly>" + val.substring(3) || "";
                }
                return acc += " " + val;
            },"");
        }
        else {
            return this.question;
        }
    });
    function getData() {
        function checkTest(index) {
            return index === model.getQuestion().chosenIndex ? "checked": "";
        }
        if (model.getQuestionNumber() < model.getQuestionsLength()) {
            switch (model.getQuestion().constructor){
                case MultipleChoice:
                    return {
                        question: model.getQuestion().question,
                        number: model.getQuestionNumber() + 1,
                        total: model.getTotalNumber(),
                        choices: model.getQuestion().answerChoices.map(function (item, index) {
                            return {
                                choice: item,
                                checked: checkTest(index)
                            };
                        })
                    };
                    break;
                case FillInTheBlank:
                    return {
                        question: model.getQuestion().question,
                        number: model.getQuestionNumber() + 1,
                        total: model.getTotalNumber(),
                        correctAnswer: model.getQuestion().correctAnswer
                    };
                    break;
                case DragAndDrop:
                    return {
                        question: model.getQuestion().question,
                        number: model.getQuestionNumber() + 1,
                        items: model.getQuestion().items,
                        total: model.getTotalNumber()
                    };
                    break;
            }
        }
        else {
            return {
                score: model.getNumberCorrect(),
                total: model.getTotalNumber()
            };
        }
    }
    return {
        getDOM: function () {
            return DOM;
        },
        notify: function () {
            DOM.fieldset.innerHTML = template(getData());
        }
    };
}

function $fade($, speed, fn1, fn2) {
    $.fadeOut(speed, fn1);
    $.fadeIn(speed, fn2);
}

(function() {
    var model = QuestionsModel(),
        view = View(model),
        controller = Controller(view, model),
        request = new XMLHttpRequest();
    model.register(view);
    request.open("GET", "assets/javascript/questions.json", true);
    request.setRequestHeader("Content-type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            model.addQuestion(JSON.parse(request.responseText));
        }
    };
    request.send();
})();

/*
 I get a "Uncaught (in promise) error" when trying to access document.cookie after quitting the browser,
 so document.cookie only lasts for one session. Not sure why this happens.
 */
if (document.cookie) {
    document.forms[0].elements["username"].value = document.cookie.substring(5, document.cookie.indexOf("=", 5));
    document.forms[0].elements["password"].value = document.cookie.substring(document.cookie.lastIndexOf("=") + 1,
        document.cookie.length);
}

document.getElementsByClassName("btn")[0].addEventListener("click", function() {
    var form = document.forms[0],
        sections = document.getElementsByTagName("section"),
        username = form.elements["username"].value,
        password = form.elements["password"].value,
        date = new Date();
    date.setDate(date.getDate() + 1);
    $fade($(".login"), "400", function() {
        sections[0].style.visibility = "hidden";
        sections[1].style.visibility = "visible";
    });
    if (form.elements["remember"].checked) {
        //Made a subcookie so that it can be overwritten at every initialization.
        document.cookie = encodeURIComponent("data") + "=" + encodeURIComponent(username) + "=" +
            encodeURIComponent(password) + "; expires=" + date.toDateString();
    }
    if (localStorage.getItem(username) === password) {
        alert("Welcome back " + username + "!");
    }
    localStorage.setItem(username, password);
    event.target.removeEventListener("click", arguments.callee);
}, false);









