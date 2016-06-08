/**
 * Created by Kevin_Kim on 6/2/16.
 */

var form = document.forms[0];
var colors = form.elements["color"];
var chosenColor;
for (var member in colors) {
    if (member.checked) {
        chosenColor = member.text.toLowerCase();
        break;
    }
}
var handler = function(event) {
    document.write("<h1>Hello World!</h1>");
    var h1 = document.querySelector("h1");
    h1.classList.add(chosenColor);
};
document.body.addEventListener("click", handler, false); //Event Delegation
//document.body.addEventListener("click", handler, false); //Browsers differ in order of click and submit events.
document.body.addEventListener("reset", handler, false);