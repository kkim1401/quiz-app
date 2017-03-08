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

function QuizModel() {
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
            questions.forEach(function(item) {
                if (item.correct) {
                    numberCorrect++;
                }
            });
            return numberCorrect;
        },
        register: function (args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function QuizController(view, model) {
    var DOM = view.getDOM(),
        clickHandler = null;
    //To stop the quiz from refreshing when pressing enter.
    DOM.quiz.addEventListener("submit", function(){
        event.preventDefault();
    });
    function process(question)
    {
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
                //Results in error if going back while leaving answer blank, since value is undefined.
                question.evaluate(DOM.getBlank().value);
                break;
            /*case DragAndDrop:
                var items = Array.prototype.concat(DOM.getItemBlank());
                var values = items.map(function(item, index) {
                    return item.values;
                });
                question.evaluate(values);
                break;
                */
            default:
                break;
        }
    }
    function handleClick (data, event) {
        switch (event.target) {
            case DOM.getNext():
                    //Have to check for validity since HTML5 validation API won't work for click events.
                    if (DOM.quiz.checkValidity()) {
                        process(data);
                        $fade(DOM.$quiz, "fast", model.nextQuestion);
                    }
                    else {
                        alert("Please answer the question.");
                        //Need to return so that removeEventListener after switch will not be reached.
                        return;
                    }
                break;
            case DOM.getBack():
                if (model.getQuestionNumber() > 0) {
                    process(data);
                    model.back();
                }
                else {
                    alert("This is the first question!");
                    return;
                }
                break;
            case DOM.getTryAgain():
                location.reload();
                break;
            default:
                //Ignore unimportant clicks.
                return;
        }
        DOM.quiz.removeEventListener("click", clickHandler, false);
    }
    function handleDragStart(event) {
        if (event.target.className = "item") {
            console.log("drag start");
            event.dataTransfer.setData("text", event.target.firstChild.data);
            event.dataTransfer.effectAllowed = "copy";
            console.log(event.dataTransfer.getData("text"));
        }
    }
    function handleDragOver(event) {
            console.log("drag over");
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
    }
    function handleDragEnter(event) {
            console.log("drag enter");
            event.preventDefault();
    }
    function handleDrop(event) {
            console.log("drop");
            var data = event.dataTransfer.getData("text");
            event.target.value = data;
    }
    return {
        notify: function () {
            var question = model.getQuestion() || null;
            clickHandler = handleClick.bind(null, question);
            //I might see if I can just add the click handler in the controller's initialization and somehow pass a new question to it so that I won't have to keep adding/removing an event listener every time.
            DOM.quiz.addEventListener("click", clickHandler, false);

            //I want to find another way of adding event listeners for drag events. Delegating the events to the parent node results in some weird errors, but I also don't like attaching them individually. Where should I remove these?
            /*if (question.constructor = DragAndDrop) {
                DOM.quiz.addEventListener("dragstart", handleDragStart, false);
                DOM.getItemBlank().forEach(function (itemblank) {
                    itemblank.addEventListener("dragover", handleDragOver, false);
                    itemblank.addEventListener("dragenter", handleDragEnter, false);
                    itemblank.addEventListener("drop", handleDrop, false);
                });
            }*/
        }
    }
}

function QuizView(model) {
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
        template = Handlebars.compile(document.getElementById("quiz-template").innerHTML);
    Handlebars.registerHelper("getQuestion", function(options) {
        if (this.items) {
            return this.question.split(" ").reduce(function(acc, val) {
                if (val.includes("___")) {
                    val = "<input type='text' name='item-blank' readonly>" + val.substring(3) || "";
                }
                return acc + " " + val;
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

function LoginModel() {
    var subject = new Subject(),
        date;
    return {
        storeCredentials: function(user, pass) {
            localStorage.setItem(user, pass);
        },
        setDate: function() {
            date = new Date();
            date.setDate(date.getDate() + 1);
        },
        isUser: function(user, pass) {
          return localStorage.getItem(user) === pass;
        },
        setCookie: function(user, pass) {
            document.cookie = encodeURIComponent("data") + "=" + encodeURIComponent(user) + "=" +
                encodeURIComponent(pass) + "; expires=" + date.toDateString();
        },
        getCookie: {
                user: document.cookie ? document.cookie.substring(5, document.cookie.indexOf("=", 5)) : "",
                pass: document.cookie ? document.cookie.substring(document.cookie.lastIndexOf("=") + 1, document.cookie.length) : ""
        },
        register: function (args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function LoginPresenter(view, model) {
    var DOM = view.getDOM(),
        subject = new Subject();
    DOM.loginForm.addEventListener("submit", function(event) {
        event.preventDefault();
    }, false);
    function handleClickInTitle(event) {
        switch(event.target) {
            case DOM.loginButton:
                DOM.setUsername(model.getCookie["user"]);
                DOM.setPassword(model.getCookie["pass"]);
                Handlebars.registerHelper("login", function(options) {
                    return options.fn(this);
                });
                break;
            case DOM.registerButton:
                Handlebars.registerHelper("register", function(options) {
                    return options.fn(this);
                });
                break;
            case DOM.adminButton:
                break;
            default:
                return;
        }
        subject.notifyObservers();
        $fade(DOM.$login, "400", function() {
            DOM.titleSection.style.visibility = "hidden";
            DOM.loginSection.style.visibility = "visible";
        });
    }
    function handleClickInLogin(event) {
        switch(event.target) {
            case DOM.getStartButton():
                if (DOM.loginForm.checkValidity()) {
                    if (model.isUser(DOM.getUsername(), DOM.getPassword())) {
                        model.setDate();
                        if (DOM.isChecked()) {
                            model.setCookie(DOM.getUsername(), DOM.getPassword());
                        }
                        $fade(DOM.$login, "400", function () {
                            DOM.loginSection.style.visibility = "hidden";
                            DOM.quizSection.style.visibility = "visible";
                        });
                    }
                    else {
                        alert("Can't recognize username or password.");
                    }
                }
                else {
                    alert("Please complete the form");
                }
                break;
            case DOM.getJoinButton():
                if (DOM.loginForm.checkValidity()) {
                    if (DOM.getPassword() === DOM.getConfirmPassword()) {
                        model.storeCredentials(DOM.getUsername(), DOM.getPassword());
                    }
                    else {
                        alert("Passwords do not match.");
                    }
                } else {
                    alert("Please fill out the form.");
                }
                break;
            default:
                break;
        }
    }
    DOM.titleSection.addEventListener("click", handleClickInTitle, false);
    DOM.loginSection.addEventListener("click", handleClickInLogin, false);
    return {
        register: function (args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function LoginView() {
    var DOM = {
        $login: $(".login"),
        loginForm: document.forms[0],
        loginSection: document.getElementsByClassName("login")[0],
        quizSection: document.getElementsByClassName("quiz")[0],
        titleSection: document.getElementsByClassName("title")[0],
        fieldset: document.forms[0].getElementsByTagName("fieldset")[0],
        loginButton: document.getElementsByName("login")[0],
        registerButton: document.getElementsByName("register")[0],
        adminButton: document.getElementsByName("admin")[0],
        getStartButton: function() {
            return document.getElementsByName("start")[0];
        },
        getJoinButton: function() {
            return document.getElementsByName("join")[0];
        },
        getUsername: function() {
            return this.loginForm.elements["username"].value;
        },
        getPassword: function() {
            return this.loginForm.elements["password"].value;
        },
        getConfirmPassword: function() {
            return this.loginForm.elements["confirm-password"].value;
        },
        setUsername: function(user) {
            this.loginForm.elements["username"].value = user;
        },
        setPassword: function(pass) {
            this.loginForm.elements["password"].value = pass;
        },
        isChecked: function() {
            return this.loginForm.elements["remember"].value;
        }
    },
        template = Handlebars.compile(document.getElementById("login-template").innerHTML);
    DOM.fieldset.innerHTML = template({});
    return {
        getDOM: function() {
            return DOM;
        },
        notify: function() {
            DOM.fieldset.innerHTML = template({});
        }

    }
}

(function() {
    var loginModel = LoginModel(),
        loginView = LoginView(),
        loginPresenter = LoginPresenter(loginView, loginModel),
        quizModel = QuizModel(),
        quizView = QuizView(quizModel),
        quizController = QuizController(quizView, quizModel),
        request = new XMLHttpRequest();
    quizModel.register(quizView, quizController);
    loginPresenter.register(loginView);
    request.open("GET", "assets/javascript/questions.json", true);
    request.setRequestHeader("Content-type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            quizModel.addQuestion(JSON.parse(request.responseText));
        }
    };
    request.send();
})();








