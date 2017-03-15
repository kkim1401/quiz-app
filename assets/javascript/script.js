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
                break;
            case FillInTheBlank:
                var blank = DOM.getBlank().val() || "";
                question.evaluate(blank);
                break;
            case DragAndDrop:
                question.evaluate(DOM.getItemBlank().map(function() {
                    return this.value;
                }).get());
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
                        //Fade method calls model.nextQuestion after screen fades out (but before the screen fades in).
                        //Clickhandler is therefore removed before the model notifies the controller/view with new question.
                        DOM.fade(DOM.quiz, "fast", model.nextQuestion);
                    }
                    else {
                        alert("Please answer the question.");
                        //Need to return so that the removal of the click handler after switch will not be reached.
                        return;
                    }
                break;
            case DOM.getBack():
                if (model.getQuestionNumber() > 0) {
                    //Temporarily setting the input's required to false helps resolve the issue of the browser
                    //constantly notifying the user that a field should be filled in.
                    $("input:required").prop("required", false);
                    process(data);
                    DOM.fade(DOM.quiz, "fast", model.back);
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
            },
            fade: function($, speed, fn) {
                $.fadeOut(speed, fn);
                $.fadeIn(speed);
            }
        },
        template = Handlebars.compile($("#quiz-template").html());
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
            document.cookie = encodeURIComponent("data") + "=" + encodeURIComponent(user) + "="
                + encodeURIComponent(pass) + "; expires=" + date.toDateString();
        },
        getCookie: {
            user: document.cookie
                ? document.cookie.substring(5, document.cookie.indexOf("=", 5)) : "",
            pass: document.cookie
                ? document.cookie.substring(document.cookie.lastIndexOf("=") + 1, document.cookie.length) : ""
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
    DOM.loginForm.on("submit", function(event) {
        event.preventDefault();
    });
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
        DOM.fade(DOM.loginSection, "400", DOM.titleSection, DOM.loginSection);
    }
    function handleClickInLogin(event) {
        switch(event.target) {
            case DOM.getStartButton():
                //Need to dynamically set required boolean to avoid focus errors when toggling visibility.
                DOM.setRequired(DOM.getUsernameElement(), DOM.getPasswordElement());
                if (DOM.loginForm[0].checkValidity()) {
                    if (model.isUser(DOM.getUsernameElement().value, DOM.getPasswordElement().value)) {
                        model.setDate();
                        if (DOM.isChecked()) {
                            model.setCookie(DOM.getUsernameElement().value, DOM.getPasswordElement().value);
                        }
                        DOM.fade(DOM.loginSection, "400", DOM.loginSection, DOM.quizSection);
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
                if (DOM.loginForm[0].checkValidity()) {
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
                DOM.fade(DOM.loginSection, "200", DOM.loginSection, DOM.titleSection);
                break;
            default:
                break;
        }
    }
    DOM.titleSection.on("click", handleClickInTitle);
    DOM.loginSection.on("click", handleClickInLogin);
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
        loginForm: $("form", ".login"),
        loginSection: $(".login"),
        quizSection: $(".quiz"),
        titleSection: $(".title"),
        fieldset: $("fieldset", ".login"),
        loginButton: $("button[name='login']", ".title")[0],
        registerButton: $("button[name='register']", ".title")[0],
        adminButton: $("button[name='admin']", ".title")[0],
        getStartButton: function() {
            return $("button[name='start']", ".login")[0];
        },
        getJoinButton: function() {
            return $("button[name='join']", ".login")[0];
        },
        getBackButton: function() {
            return $("button[name='back']", ".login")[0];
        },
        getUsernameElement: function() {
            return $("input[name='username']", ".login")[0];
        },
        getPasswordElement: function() {
            return $("input[name='password']", ".login")[0];
        },
        getConfirmPasswordElement: function() {
            return $("input[name='confirm-password']", ".login")[0];
        },
        setUsername: function(user) {
            $("input[name='username']", ".login").val(user);
        },
        setPassword: function(pass) {
            $("input[name='password']", ".login").val(pass);
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
            return $("input[name='remember']", ".login").val();
        },
        fade: function($, speed, hidden, visible) {
            $.fadeOut(speed, function() {
                hidden.css("visibility", "hidden");
                visible.css("visibility", "visible");
            });
            $.fadeIn(speed);
        }
    },
        template = Handlebars.compile($("#login-template").html());
    DOM.fieldset.innerHTML = template({});
    return {
        getDOM: function() {
            return DOM;
        },
        notify: function() {
            DOM.fieldset.html(template({}));
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








