(function( $ ){

    //this
    $.fn.multiselectplus = function(method) {
    
        if (!method) {
            $(this).each(function() {
                var widget1 = $(this);
                widget1.wrap($('<table class="webface-multiselectplus-default"><tr><td></td><td align="center"></td><td></td></tr><tr><td align="right" colspan="3"></td></tr></table>'));
                var table1 = widget1.parent().parent().parent();
                var widget2 = widget1.clone().appendTo($('td:eq(2)', table1));
                
                widget2.attr('id', widget1.attr('id')+'-plus');
                widget2.removeAttr('name', '');
                
                $('option:not(:selected)', widget1).remove();
                $('option:selected', widget2).remove();
                
                $('<button>&lt;&lt;</button>').appendTo($('td:eq(1)', table1)).click(function() {
                    $('option', widget2).remove().appendTo(widget1);
                    widget1.html($("option", widget1).sort(function (a, b) {
                        return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
                    }));
                });
                $('<br/>').appendTo($('td:eq(1)', table1));
                $('<button>&lt;</button>').appendTo($('td:eq(1)', table1)).click(function() {
                    $('option:selected', widget2).remove().appendTo(widget1);
                    widget1.html($("option", widget1).sort(function (a, b) {
                        return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
                    }));
                });
                $('<br/>').appendTo($('td:eq(1)', table1));
                $('<button>&gt;</button>').appendTo($('td:eq(1)', table1)).click(function() {
                    $('option:selected', widget1).remove().appendTo(widget2);
                    widget2.html($("option", widget2).sort(function (a, b) {
                        return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
                    }));
                });
                $('<br/>').appendTo($('td:eq(1)', table1));
                $('<button>&gt;&gt;</button>').appendTo($('td:eq(1)', table1)).click(function() {
                    $('option', widget1).remove().appendTo(widget2);
                    widget2.html($("option", widget2).sort(function (a, b) {
                        return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
                    }));
                });
            });
        }
        else if (method=='reset') {
            $(this).each(function() {
                var widget1 = $(this);
                var widget2 = $('select#'+widget1.attr('id')+'-plus');
                $('option:not(:selected)', widget1).remove().appendTo(widget2);
                widget2.html($("option", widget2).sort(function (a, b) {
                    return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
                }));
            });
        }
    };
    
})( jQuery );
