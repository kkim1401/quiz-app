/**
 * Created by Kevin_Kim on 6/10/16.
 */

var form = document.forms[0],
    list = document.getElementById("blankList"),
    input = form.elements["blank"],
    phoneNumber = input[2],
    button = document.querySelector("#myBtn");

/*Today I learned that the focus event does not bubble. That's what focusin is for. I also learned that
I can use the :focus pseudo-class in css instead of focus events in javascript to highlight focused inputs.
 */
list.addEventListener("focusin", function (event) {
    var target = event.target;
    target.classList.add("focus");
    target.select(); //For convenience.
}, false);

//Focusout is a bubbling version of blur.
list.addEventListener("focusout", function (event) {
    var target = event.target;
    target.classList.remove("focus");
}, false);

//Will not accept characters for phoneNumber entry.
phoneNumber.addEventListener("keypress", function(event) {
        var char = event.charCode;
        if (!/\d/.test(String.fromCharCode(char)) && char > 9 && !event.ctrlKey) {
            event.preventDefault();
        }
}, false);

//Ensures that characters cannot be pasted to the phoneNumber entry.
phoneNumber.addEventListener("paste", function(event) {
    var clipBoardData = (event.clipboardData || window.clipboardData);
    var data = clipBoardData.getData("text");
    if (!/^\d*$/.test(data)) {
        event.preventDefault();
    }
}, false);

list.addEventListener("submit", function(event) {
    if (form.checkValidity()) {
        alert("Form submitted!");
        event.preventDefault();
        button.disabled = true;
    }
    else {
        for (var i = 0; i < input.length; i++) {
            if (!input[i].validity.valid) {
                var error = input[i].nextElementSibling;
                if (input[i].validity.valueMissing) {
                    error.innerHTML = "Field is required.";
                }
                else if (input[i].validity.typeMismatch) {
                    switch (input[i].type) {
                        case "email":
                            error.innerHTML = "Please type in a correct email.";
                            break;
                        case "tel":
                            error.innerHTML = "Please type in a correct telephone number.";
                            break;
                    }
                }
                else {
                    error.innerHTML = "Value is invalid.";
                }
                event.preventDefault();
            }
        }
    }
}, false);








