/**
 * Created by Kevin_Kim on 3/13/16.
 */
alert("js works");
window.addEventListener("load", function(){
    var btn = document.getElementById("myBtn");
    btn.addEventListener("click", function() {
        alert("button works");
        //document.getElementById("hiddenMessage").style.visibility = "visible";
        document.body.querySelector("#hiddenMessage").style.visibility = "visible";
        var paragraph = document.createElement("p");
        paragraph.appendChild(document.createTextNode("Appending works!"));
        document.body.appendChild(paragraph);
        var pElement = document.getElementsByTagName("p");
        alert(pElement.namedItem("testing").childNodes[0].data);
        alert(pElement.firstChild.firstChild.data);
        alert(document.body.lastElementChild.firstChild.data);
        alert(document.querySelector("p").firstChild.data);
        alert(document.querySelector("input").classList[0]);
        document.querySelector("input").focus();
        alert(document.activeElement == document.querySelector("input"));
        document.getElementById("hiddenMessage").innerHTML = "Surprise again!";

    }, false);
}, false);





