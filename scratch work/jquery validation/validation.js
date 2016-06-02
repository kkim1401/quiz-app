/**
 * Created by Kevin_Kim on 2/21/16.
 */

$(function() {

    $("#register-form").validate({
        //errorClass: "has-error",
        onkeyup: false,
        onfocusout: false,
        rules: {
            email: {
                required: true

            },
            name: {
                required: true,
                minlength: 3

            },
            phone: {
                phoneUS: true
            }
        }

    });

});