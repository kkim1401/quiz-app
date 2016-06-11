/**
 * Created by Kevin_Kim on 6/10/16.
 */

var form = document.forms[0],
    list = document.getElementById("blankList"),
    input = form.elements["blank"];

//Today I learned that the focus event does not bubble. That's what focusin is for.
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
list.addEventListener("keypress", function(event) {
    var target = event.target;
    if (target.id == "phoneNumber") {
        var char = event.charCode;
        if (!/\d/.test(String.fromCharCode(char)) && char > 9 && !event.ctrlKey) {
            event.preventDefault();
        }
    }
}, false);






