/**
 * Created by Kevin_Kim on 6/2/16.
 */
var form = document.forms[0],
    colors = form.elements["color"],
    chosenColor;

//Manging handler for when the user picks an option.
document.body.querySelector(".radioList").addEventListener("click", function() {
    for (var i = 0; i < colors.length; i++) {
        if (colors[i].checked) {
            chosenColor = colors[i].value.toLowerCase();
            break;
        }
    }
}, false);

//Declaring handler for when the user clicks submit.
var handler = function (event) {
    var h1 = document.createElement("h1");
    h1.classList.add(chosenColor);
    h1.appendChild(document.createTextNode("Hello World!"));
    document.body.appendChild(h1);
    event.preventDefault(); //So that the page won't refresh.
    event.target.elements["myBtn"].disabled = true; //Can only submit once.
};

//Adding handlers for submit and reset events. Taking care to utilize event delegation.
document.body.addEventListener("submit", handler, false);
document.body.addEventListener("reset", function() {window.location.reload();}, false);


