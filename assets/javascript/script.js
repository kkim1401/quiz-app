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

function inheritPrototype(parentClass, childClass) {
        var prototype = Object.create(parentClass);
        prototype.constructor = childClass;
        childClass.prototype = prototype;
}

inheritPrototype(Question, MultipleChoice);
inheritPrototype(Question, FillInTheBlank);
inheritPrototype(Question, DragAndDrop);

MultipleChoice.prototype.evaluate = function(index) {
    this.chosenIndex = index;
    this.correct = this.chosenIndex === this.correctIndex;
};

FillInTheBlank.prototype.evaluate = function(answer) {
    this.correct = answer.toLowerCase() === this.correctAnswer.toLowerCase();
};

DragAndDrop.prototype.evaluate = function(items) {
    this.correct = this.correctAnswers.toString() === items.toString();
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
    DOM.quiz.on("submit", function(){
        event.preventDefault();
    });
    DOM.quiz.on("dragstart", ".item", handleDragStart)
        .on("dragend", ".item", handleDragEnd)
        .on("dragover", "input[name='item-blank']", handleDragOver)
        .on("dragenter", "input[name='item-blank']", handleDragEnter)
        .on("drop", "input[name='item-blank']", handleDrop);
    function process(question)
    {
        switch(question.constructor)
        {
            case MultipleChoice:
                DOM.getChoices().each(function (index) {
                    if (this.checked) {
                        question.evaluate(index);
                    }
                });
                //console.log(question.question);
                break;
            case FillInTheBlank:
                var blank = DOM.getBlank().val() || "";
                //Results in error if going back while leaving answer blank, since value is undefined.
                question.evaluate(blank);
                //console.log(question.question);
                break;
            case DragAndDrop:
                question.evaluate(DOM.getItemBlank().map(function() {
                    return this.value;
                }).get());
                //console.log(question.question);
                break;
            default:
                break;
        }
    }
    function handleClick (data, event) {
        switch (event.target) {
            case DOM.getNext():
                    //Have to check for validity since HTML5 validation API won't work for click events.
                    if (DOM.quiz[0].checkValidity()) {
                        process(data);
                        //$fade method calls model.nextQuestion after screen fades out (but before the screen fades in).
                        //Clickhandler is therefore removed before the model notifies the controller/view with new question.
                        $fade(DOM.quiz, "fast", model.nextQuestion);
                    }
                    else {
                        alert("Please answer the question.");
                        //Need to return so that the removal of the click handler after switch will not be reached.
                        return;
                    }
                break;
            case DOM.getBack():
                if (model.getQuestionNumber() > 0) {
                    //If required blank field is not filled in,
                    //then going back will for some reason have the browser ask to fill the field out.
                    //Temporarily setting the input's required to false will help fix this issue.
                    $("input:required").prop("required", false);
                    process(data);
                    $fade(DOM.quiz, "fast", model.back);
                }
                else {
                    alert("This is the first question!");
                    return;
                }
                break;
            case DOM.getTryAgain():
                location.reload();
                break;
        }
        DOM.quiz.off("click");
    }
    function handleDragStart(event) {
        $("input[name='item-blank']", ".quiz").prop("readonly", false);
        event.originalEvent.dataTransfer.setData("text", event.target.firstChild.data);
    }
    function handleDragEnd() {
        $("input[name='item-blank']", ".quiz").prop("readonly", true);
    }
    function handleDragOver(event) {
        event.preventDefault();
    }
    function handleDragEnter(event) {
        event.preventDefault();
        event.originalEvent.dataTransfer.dropEffect = "copy";
    }
    function handleDrop(event) {
        event.target.value = event.originalEvent.dataTransfer.getData("text");
    }
    return {
        notify: function () {
            var question = model.getQuestion() || null;
            clickHandler = handleClick.bind(null, question);
            //I might see if I can just add the click handler in the controller's initialization.
            DOM.quiz.on("click", "button", clickHandler);
        }
    }
}

function QuizView(model) {
    var DOM = {
            quiz: $("form", ".quiz"),
            fieldset: $("fieldset", ".quiz"),
            getItems: function() {
                return $(".items", ".quiz");
            },
            getChoices: function () {
                return $("input[name='choices']", ".quiz");
            },
            getNext: function() {
                return $("button[name='next']", ".quiz")[0];
            },
            getBack: function(){
                return $("button[name='back']", ".quiz")[0];
            },
            getTryAgain: function() {
                return $("button[name='try-again']", ".quiz")[0];
            },
            getBlank: function() {
                return $("input[name='blank']", ".quiz");
            },
            getItemBlank: function() {
                return $("input[name='item-blank']", ".quiz");
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
            DOM.fieldset.html(template(getData()));
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
        userExists: function(user) {
          return localStorage.getItem(user);
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
                    //Helper need to last only for this screen.
                    Handlebars.unregisterHelper("login");
                    return options.fn(this);
                });
                break;
            case DOM.registerButton:
                Handlebars.registerHelper("register", function(options) {
                    Handlebars.unregisterHelper("register");
                    return options.fn(this);
                });
                break;
            case DOM.adminButton:
                /*
                Handlebars.registerHelper("admin", function(options) {
                    //Helper need to last only for this screen.
                    Handlebars.unregisterHelper("login");
                    return options.fn(this);
                });
                */
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
    //Works but there's a lot of logic here that looks like it can be broken up.
    function handleClickInLogin(event) {
        switch(event.target) {
            case DOM.getStartButton():
                //Need to dynamically set required boolean to avoid focus errors when toggling visibility.
                DOM.setRequired(DOM.getUsernameElement(), DOM.getPasswordElement());
                if (DOM.loginForm.checkValidity()) {
                    if (model.isUser(DOM.getUsernameElement().value, DOM.getPasswordElement().value)) {
                        model.setDate();
                        if (DOM.isChecked()) {
                            model.setCookie(DOM.getUsernameElement().value, DOM.getPasswordElement().value);
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
                DOM.setUnrequired(DOM.getUsernameElement(), DOM.getPasswordElement());
                break;
            case DOM.getJoinButton():
                DOM.setRequired(DOM.getUsernameElement(), DOM.getPasswordElement(), DOM.getConfirmPasswordElement());
                if (DOM.loginForm.checkValidity()) {
                    if (DOM.getPasswordElement().value === DOM.getConfirmPasswordElement().value) {
                        if (!model.userExists(DOM.getUsernameElement().value)) {
                            model.storeCredentials(DOM.getUsernameElement().value, DOM.getPasswordElement().value);
                            alert("User successfully registered!");
                        }
                        else {
                            alert("User already exists!");
                        }
                    }
                    else {
                        alert("Passwords do not match.");
                    }
                }
                else {
                    alert("Please fill out the form.");
                }
                DOM.setUnrequired(DOM.getUsernameElement(), DOM.getPasswordElement(), DOM.getConfirmPasswordElement());
                break;
            case DOM.getBackButton():
                DOM.loginSection.style.visibility = "hidden";
                DOM.titleSection.style.visibility = "visible";
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
        loginButton: document.getElementsByClassName("title")[0].querySelector("button[name='login']"),
        registerButton: document.getElementsByClassName("title")[0].querySelector("button[name='register']"),
        adminButton: document.getElementsByClassName("title")[0].querySelector("button[name='admin']"),
        getStartButton: function() {
            return document.getElementsByName("start")[0];
        },
        getJoinButton: function() {
            return document.getElementsByName("join")[0];
        },
        getBackButton: function() {
            return document.getElementsByName("back")[0];
        },
        getUsernameElement: function() {
            return this.loginForm.elements["username"];
        },
        getPasswordElement: function() {
            return this.loginForm.elements["password"];
        },
        getConfirmPasswordElement: function() {
            return this.loginForm.elements["confirm-password"];
        },
        setUsername: function(user) {
            this.loginForm.elements["username"].value = user;
        },
        setPassword: function(pass) {
            this.loginForm.elements["password"].value = pass;
        },
        setRequired: function(args) {
            for (var i = 0; i < arguments.length; i++) {
                arguments[i].required = true;
            }
        },
        setUnrequired: function(args) {
            for (var i = 0; i < arguments.length; i++) {
                arguments[i].required = false;
            }
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








