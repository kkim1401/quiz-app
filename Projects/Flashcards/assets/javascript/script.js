/**
 * Created by Kevin_Kim on 10/9/16.
 */

function Card(word, definition) {
    this.word = word;
    this.definition = definition;
    this.faceUp = true;
}

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

function Flashcard() {
    var stack = [],
        subject = Subject();

    return {
        addWord: function(args) {
            for (var i = 0; i < arguments.length; i++) {
                stack.push(arguments[i]);
            }
            subject.notifyObservers();
        },
        getNextCard: function() {
            return stack[0];
        },
        nextCard: function() {
            stack.pop();
            subject.notifyObservers();
        },
        getPosition: function() {
            return stack[0].faceUp;
        },
        changePosition: function() {
            stack[0].faceUp = !stack[0].faceUp;
            subject.notifyObservers();
        },
        getStackLength: function() {
            return stack.length;
        },
        register: function(args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function View(model) {
    var DOM = {
        div: document.getElementsByTagName("div")[0],
        p: document.getElementsByTagName("p")[0]
    };
    function getData() {
        if (model.getStackLength()) {
            if (model.getPosition()) {
                return model.getNextCard().word;
            }
            else {
                return model.getNextCard().definition;
            }
        }
        else {
            return "That's all folks! Click to start over!";
        }
    }
    return {
        getDOM: function() {
            return DOM;
        },
        notify: function() {
            console.log(getData());
            DOM.p.innerHTML = "";
            DOM.p.appendChild(document.createTextNode(getData()));
        }
    }
}

function Handler(view, model) {
    var DOM = view.getDOM();
    var handler = function() {
        if (model.getPosition()) {
            model.changePosition();
        }
        else {
            model.nextCard();
        }
    };
    DOM.div.addEventListener("click", handler, false);
    return {
        notify: function() {
            if (!model.getStackLength()) {
                DOM.div.removeEventListener("click", handler, false);
                DOM.div.addEventListener("click", function() {
                    location.reload();
                }, false);
            }
        }
    }
}

var model = Flashcard(),
    view = View(model),
    handler = Handler(view, model);

model.register(view, handler);
model.addWord(new Card("love", "affection"));
