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
    const prototype = Object.create(parentClass);
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

const Constants = {
    QUIZ_UNANSWERED_MSG: "Please answer the question.",
    QUIZ_FIRST_QUESTION_MSG: "This is the first question!",
    LOGIN_UNRECOGNIZABLE_MSG: "Can't recognize username or password.",
    LOGIN_INCOMPLETE_MSG: "Please complete the form",
    LOGIN_SUCCESS_MSG: "User successfully registered!",
    LOGIN_USER_EXISTS_MSG: "User already exists!",
    LOGIN_PASSWORD_MISMATCH_MSG: "Passwords do not match.",
    FAST_SPEED: "fast",
    MEDIUM_SPEED: "400",
    JSON_PATH: "assets/javascript/questions.json"
};

function Subject() {
    const observers = [];
    return {
        add: function (observer) {
            observers.push(observer);
        },
        removeAll: function () {
            observers.length = 0;
        },
        notifyObservers: function () {
            observers.forEach(observer => {
                observer.notify();
            });
        }
    }
}

function QuizModel() {
    const subject = Subject(),
        questions = [];
    let numberCorrect = 0,
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
            //I may chunk the array if this loop starts taking too long.
            data.forEach(item => {
                switch (item.type) {
                    case "multiple-choice":
                        questions.push(new MultipleChoice(item));
                        break;
                    case "fill-in-the-blank":
                        questions.push(new FillInTheBlank(item));
                        break;
                    case "drag-and-drop":
                        questions.push(new DragAndDrop((item)));
                        break;
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
            questions.forEach(item => {
                if (item.correct) {
                    numberCorrect++;
                }
            });
            return numberCorrect;
        },
        //Maybe make an abstract model for register function?
        register: function (...args) {
            subject.removeAll();
            args.forEach(item => {
                subject.add(item);
            });
        }
    }
}

function QuizController(view, model) {
    const DOM = view.getDOM(),
        constants = Constants;
    //To stop the quiz from refreshing when pressing enter.
    DOM.$quiz.on("submit", event => {
        event.preventDefault();
    });
    DOM.$quiz.on("dragstart", ".item", handleDragStart)
        .on("dragend", ".item", handleDragEnd)
        .on("dragover", "input[name='item-blank']", handleDragOver)
        .on("dragenter", "input[name='item-blank']", handleDragEnter)
        .on("drop", "input[name='item-blank']", handleDrop);
    function process(question)
    {
        switch(question.constructor)
        {
            case MultipleChoice:
                DOM.get$Choices().each(function (index) {
                    if (this.checked) {
                        question.evaluate(index);
                    }
                });
                break;
            case FillInTheBlank:
                const blank = DOM.get$Blank().val() || "";
                question.evaluate(blank);
                break;
            case DragAndDrop:
                question.evaluate(DOM.get$ItemBlank().map((index, elem) => elem.value).get());
                break;
            default:
                break;
        }
    }
    function handleClick (data, event) {
        switch (event.target) {
            case DOM.getNext():
                //Have to check for validity since HTML5 validation API won't work for click events.
                if (DOM.$quiz[0].checkValidity()) {
                    process(data);
                    //Fade method calls model.nextQuestion after screen fades out (but before the screen fades in).
                    //Clickhandler is therefore removed before the model notifies the controller/view with new question.
                    DOM.fade(DOM.$quiz, constants.FAST_SPEED, model.nextQuestion);
                }
                else {
                    alert(constants.QUIZ_UNANSWERED_MSG);
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
                    DOM.fade(DOM.$quiz, constants.FAST_SPEED, model.back);
                }
                else {
                    alert(constants.QUIZ_FIRST_QUESTION_MSG);
                    return;
                }
                break;
            case DOM.getTryAgain():
                location.reload();
                break;
        }
        DOM.$quiz.off("click");
    }
    function handleDragStart(event) {
        DOM.get$ItemBlank().prop("readonly", false);
        event.originalEvent.dataTransfer.setData("text", event.target.firstChild.data);
    }
    function handleDragEnd() {
        DOM.get$ItemBlank().prop("readonly", true);
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
            const question = model.getQuestion() || null;
            //I might see if I can just add the click handler in the controller's initialization.
            DOM.$quiz.on("click", "button", handleClick.bind(null, question));
        }
    }
}

function QuizView(model) {
    const DOM = {
            $quiz: $("form", ".quiz"),
            $fieldset: $("fieldset", ".quiz"),
            get$Choices: function () {
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
            get$Blank: function() {
                return $("input[name='blank']", ".quiz");
            },
            get$ItemBlank: function() {
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
            return this.question.split(" ").reduce((acc, val) => {
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
        const question = model.getQuestion();
        function checkTest(index) {
            return index === question.chosenIndex ? "checked": "";
        }
        if (model.getQuestionNumber() < model.getQuestionsLength()) {
            switch (question.constructor){
                case MultipleChoice:
                    return {
                        type: question.type,
                        question: question.question,
                        number: model.getQuestionNumber() + 1,
                        total: model.getTotalNumber(),
                        choices: question.answerChoices.map((item, index) =>
                            ({choice: item, checked: checkTest(index)}))
                    };
                    break;
                case FillInTheBlank:
                    return {
                        type: question.type,
                        question: question.question,
                        number: model.getQuestionNumber() + 1,
                        total: model.getTotalNumber(),
                        correctAnswer: question.correctAnswer
                    };
                    break;
                case DragAndDrop:
                    return {
                        type: question.type,
                        question: question.question,
                        number: model.getQuestionNumber() + 1,
                        total: model.getTotalNumber(),
                        items: question.items
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
            DOM.$fieldset.html(template(getData()));
        }
    };
}

function LoginModel() {
    const subject = new Subject();
    let date;
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
        register: function (...args) {
            subject.removeAll();
            args.forEach(item => {
                subject.add(item);
            });
        }
    }
}

function LoginPresenter(view, model) {
    const DOM = view.getDOM(),
        subject = new Subject(),
        constants = Constants;
    DOM.$loginForm.on("submit", event => {
        event.preventDefault();
    });
    function handleClickInTitle(event) {
        switch(event.target) {
            case DOM.loginButton:
                Handlebars.registerHelper("login", function(options) {
                    //Helper need to last only for this screen.
                    Handlebars.unregisterHelper("login");
                    return options.fn(this);
                });
                subject.notifyObservers();
                DOM.setUser(model.getCookie);
                break;
            case DOM.registerButton:
                Handlebars.registerHelper("register", function(options) {
                    Handlebars.unregisterHelper("register");
                    return options.fn(this);
                });
                subject.notifyObservers();
                break;
            case DOM.adminButton:
                /*
                 Handlebars.registerHelper("admin", function(options) {
                 //Helper need to last only for this screen.
                 Handlebars.unregisterHelper("login");
                 return options.fn(this);
                 });
                 subject.notifyObservers();
                 */
                break;
            default:
                return;
        }
        DOM.fade(DOM.$loginSection, constants.MEDIUM_SPEED, DOM.$titleSection, DOM.$loginSection);
    }
    function handleClickInLogin(event) {
        switch(event.target) {
            case DOM.getStartButton():
                login();
                break;
            case DOM.getJoinButton():
                register();
                break;
            case DOM.getBackButton():
                DOM.fade(DOM.$loginSection, constants.FAST_SPEED, DOM.$loginSection, DOM.$titleSection);
                break;
            default:
                break;
        }
    }
    function login() {
        const usernameElement = DOM.getUsernameElement(),
            passwordElement = DOM.getPasswordElement(),
            username = usernameElement.value,
            password = passwordElement.value;
        //Need to dynamically set required boolean to avoid focus errors when toggling visibility.
        DOM.setRequired(usernameElement, passwordElement);
        if (DOM.$loginForm[0].checkValidity()) {
            if (model.isUser(username, password)) {
                model.setDate();
                if (DOM.isChecked()) {
                    model.setCookie(username, password);
                }
                DOM.fade(DOM.$loginSection, constants.MEDIUM_SPEED, DOM.$loginSection, DOM.$quizSection);
            }
            else {
                alert(constants.LOGIN_UNRECOGNIZABLE_MSG);
            }
        }
        else {
            alert(constants.LOGIN_INCOMPLETE_MSG);
        }
        DOM.setUnrequired(usernameElement, passwordElement);
    }
    function register() {
        const usernameElement = DOM.getUsernameElement(),
            passwordElement = DOM.getPasswordElement(),
            confirmPasswordElement = DOM.getConfirmPasswordElement(),
            username = usernameElement.value,
            password = passwordElement.value,
            confirmPassword = confirmPasswordElement.value;
        DOM.setRequired(usernameElement, passwordElement, confirmPasswordElement);
        if (DOM.$loginForm[0].checkValidity()) {
            if (password === confirmPassword) {
                if (!model.userExists(username)) {
                    model.storeCredentials(username, password);
                    alert(constants.LOGIN_SUCCESS_MSG);
                }
                else {
                    alert(constants.LOGIN_USER_EXISTS_MSG);
                }
            }
            else {
                alert(constants.LOGIN_PASSWORD_MISMATCH_MSG);
            }
        }
        else {
            alert(constants.LOGIN_INCOMPLETE_MSG);
        }
        DOM.setUnrequired(usernameElement, passwordElement, confirmPasswordElement);
    }
    DOM.$titleSection.on("click", handleClickInTitle);
    DOM.$loginSection.on("click", handleClickInLogin);
    return {
        register: function (...args) {
            subject.removeAll();
            args.forEach(item => {
                subject.add(item);
            });
        }
    }
}

function LoginView() {
    const DOM = {
            $loginForm: $("form", ".login"),
            $loginSection: $(".login"),
            $quizSection: $(".quiz"),
            $titleSection: $(".title"),
            $fieldset: $("fieldset", ".login"),
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
            setUser: function(user) {
                $("input[name='username']", ".login").val(user.user);
                $("input[name='password']", ".login").val(user.pass);
            },
            setRequired: function(...args) {
                args.forEach(item => {item.required = true;})
            },
            setUnrequired: function(...args) {
                args.forEach(item => {item.required = false;})
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
    DOM.$fieldset.innerHTML = template({});
    return {
        getDOM: function() {
            return DOM;
        },
        notify: function() {
            DOM.$fieldset.html(template({}));
        }

    }
}

(function() {
    const loginModel = LoginModel(),
        loginView = LoginView(),
        loginPresenter = LoginPresenter(loginView, loginModel),
        quizModel = QuizModel(),
        quizView = QuizView(quizModel),
        quizController = QuizController(quizView, quizModel),
        request = new XMLHttpRequest();
    quizModel.register(quizView, quizController);
    loginPresenter.register(loginView);
    request.open("GET", Constants.JSON_PATH, true);
    request.setRequestHeader("Content-type", "application/json");
    request.onreadystatechange = () => {
        if (request.readyState == 4 && request.status == 200) {
            quizModel.addQuestion(JSON.parse(request.responseText));
        }
    };
    request.send();
})();








