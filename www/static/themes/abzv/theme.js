(function(){

    // ABZV Theme
    // ----------

    // Every theme will inherit the properties of this
    // theme. They can override everything or just a bit
    // of them. Also, every theme can extend any other
    // existing theme.

    Datawrapper.Themes.Abzv = $.extend(true, {}, Datawrapper.Themes.Base, {

        colors: {
            highlight: '#D21F1F',
            main: '#cde',
            background: '#fff'
        },

        lineWidth: {
            focus: 2,
            context: 1
        }

    });

}).call(this);