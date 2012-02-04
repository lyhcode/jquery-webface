
function WebFaceClass() {

    this.urlPattern = {
        html: "module/{0}/{1}.aspx",
        css: "module/{0}/{1}.css",
        min_css: "module/{0}/{1}.min.css",
        script: "module/{0}/{1}.js",
        min_script: "module/{0}/{1}.min.js",
        handler: "module/{0}/{1}.ashx"
    };
    
    this.statusMessage = {
        busy: '<img src="lib/img/ajax-load-02.gif" border="0" alt="busy" />',
        finish: '',
        error: '<img src="lib/icon/error.png" border="0" alt="error" />'
    };
    
    this.statusSelector = null;

    //useOptimization: true => load source css/script without cache, false => load min with cache.
    this.useOptimization = false;
    this.useDebugger = false;

    this.targetTabObject = '';
    this.targetTabPrefix = '';
    this.targetTabMap = {};
    this.targetTabIndex = 1;
    
    this.layoutWestSize = 250;

    this.packFuncMap = {};
    this.debugFuncArray = new Array();
    this.debugSelector = null;
}

WebFaceClass.prototype.SetStatusMessage = function(message) {
    this.statusMessage = message;
};

WebFaceClass.prototype.SetStatusSelector = function(selector) {
    this.statusSelector = selector;
};

WebFaceClass.prototype.SetOptimization = function(bool) {
    this.useOptimization = bool;
};

WebFaceClass.prototype.GetOptimization = function() {
    return this.useOptimization;
}

WebFaceClass.prototype.EnableDebug = function(selector) {
    this.debugSelector = selector;
    this.useDebugger = true;
    this.debugFuncArray.push(jQuery.aop.around( {target: WebFaceClass, method: 'Load'}, function(invocation) { 
        container = invocation.arguments[0];
        module = invocation.arguments[1];
        prog = invocation.arguments[2];
        data = invocation.arguments[3];
        $(this.debugSelector).append('<p>WebFace.Load<br/>container='+container+',module='+module+',prog='+prog+',data='+(typeof(JSON)=='object'?JSON.stringify(data):data)+'</p>'); 
        return invocation.proceed();
    }));

    this.debugFuncArray.push(jQuery.aop.around( {target: WebFaceClass, method: 'Execute'}, function(invocation) { 
        module = invocation.arguments[0];
        prog = invocation.arguments[1];
        data = invocation.arguments[2];
        $(this.debugSelector).append('<p>WebFace.Execute<br/>module='+module+',prog='+prog+',data='+(typeof(JSON)=='object'?JSON.stringify(data):data)+'</p>'); 
        return invocation.proceed();
    }));

    this.debugFuncArray.push(jQuery.aop.around( {target: WebFaceClass, method: 'Submit'}, function(invocation) { 
        form = $(invocation.arguments[0]);
        $(this.debugSelector).append('<p>WebFace.Submit<br/>selector='+invocation.arguments[0]+',action='+form.attr('action')+',method='+form.attr('method')+',data='+form.serialize()+'</p>'); 
        return invocation.proceed();
    }));

};

WebFaceClass.prototype.DisableDebug = function() {
    this.useDebugger = false;
    for (i=0; i<this.debugFuncArray.length; i++) {
        this.debugFuncArray[i][0].unweave();
        delete this.debugFuncArray[i];
    }
    delete this.debugFuncArray;
    this.debugFuncArray = new Array();
};

WebFaceClass.prototype.Debug = function(msg) {
    $(this.debugSelector).append('<p>'+msg+'</p>');
};

WebFaceClass.prototype.MakeFuncIndex = function(module, prog, func) {
    return module+'.'+prog+'#'+func;
};

WebFaceClass.prototype.Register = function(module, prog, func, lamb) {
    this.packFuncMap[this.MakeFuncIndex(module, prog, func)] = lamb;
};

WebFaceClass.prototype.Unregister = function() {
    //todo
};

WebFaceClass.prototype.Demand = function(module, prog, func) {
    return this.packFuncMap[this.MakeFuncIndex(module, prog, func)];
};

WebFaceClass.prototype.Invoke = function(module, prog, func) {
    var args = new Array();
    for (i=3; i<arguments.length; i++) args.push(arguments[i]);
    if (this.packFuncMap[this.MakeFuncIndex(module, prog, func)]) {
        return this.packFuncMap[this.MakeFuncIndex(module, prog, func)].apply(this, args);
    }
    else {
        this.Alert('Registeration module='+module+', prog='+prog+', func='+func+' not found.');
        return false;
    }
    //return this.packFuncMap[pack+'#'+func]();
};

WebFaceClass.prototype.MakeUrl = function(scheme, module, prog, data) {
    //NOT_IMPL: process data
    var token1 = prog.split('?');
    var result = this.StringFormat(eval("this.urlPattern."+scheme), module, token1[0]);
    if (token1[1]) {
        result += ('?'+token1[1]);
    }
    if (data) {
        if (!token1[1]) {
            result += '?';
        }
        result += data;
    }
    return result;
};

WebFaceClass.prototype.MakeActionUrl = function(action) {
    var token1 = action.split('?');
    var token2 = token1[0].split('/');
    return this.MakeUrl('handler', token2[0], token2[1])+(token1[1]?token1[1]:'');
};

WebFaceClass.prototype.StringFormat = function() {
    if( arguments.length == 0 ) return null;
    var str = arguments[0];
    for(var i=1;i<arguments.length;i++) {
        var re = new RegExp('\\{' + (i-1) + '\\}','gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
};

WebFaceClass.prototype.Alert = function(msg, title) {
    $( '<div title="'+(title?title:'Message')+'">'+msg+'</div>' ).dialog({
		modal: true,
		buttons: {
			'OK': function() {
				$( this ).dialog('close');
			}
		},
		close: function(event, ui) {
		    $( this ).dialog('destroy');
		    $( this ).remove();
		}
	});
}

WebFaceClass.prototype.LoadCss = function(module, prog) {

    $('link[href^="'+this.MakeUrl('css', module, prog)+'"]').remove();
    $('<link/>').appendTo($('head')).attr({
        rel: 'stylesheet',
        type: 'text/css',
        media: 'screen',
        href: this.MakeUrl('css', module, prog)+(this.useOptimization?'':('?_='+new Date().getTime()))
    });
    
    //$('<link rel="stylesheet" type="text/css" media="screen" href="'+(this.MakeUrl('css', module, prog)+(this.useOptimization?'':('?_='+new Date().getTime())))+'" />').appendTo($('head'));
};

WebFaceClass.prototype.LoadScript = function(module, prog) {
    //$.getScript(this.MakeUrl('script', module, prog));
    $.ajax({
        url: this.MakeUrl('script', module, prog),
        type: 'GET',
        dataType: 'script',
        async: false,
        cache: this.useOptimization,
        success: function(data) {
            //nothing 
        },
        error: function(xhr) {
        }
    });
};

WebFaceClass.prototype.EffectLoading = function(selector, type, opt) {
    if (opt==0) {
        $(selector).prepend('<img src="lib/img/ajax-load-'+(type?type:'01')+'.gif" border="0" alt="ajax loading" />');
    }
    else if (opt==2) {
        $(selector).append('<img src="lib/img/ajax-load-'+(type?type:'01')+'.gif" border="0" alt="ajax loading" />');
    }
    else {
        $(selector).html('<img src="lib/img/ajax-load-'+(type?type:'01')+'.gif" border="0" alt="ajax loading" />');
    }
};

WebFaceClass.prototype.Load = function(selector, module, prog, data) {
    var wf = this;
    var debug = this.useDebugger;
    var url = this.MakeUrl('html', module, prog);
    
    $(wf.statusSelector).html('<span class="status-busy">'+wf.statusMessage.busy+'</span>');
    
    $.ajax({
        url: url,
        type: 'POST',
        dataType: 'html',
        data: data,
        async: false,
        cache: false,
        success: function(data) {
            $(selector).html(data);
            setTimeout(function() {
                $(wf.statusSelector).html('<span class="status-finish">'+wf.statusMessage.finish+'</span>');
            }, 1000);
        },
        error: function(xhr) {
            wf.Alert('error: could not load '+url);
            if (debug) {
                $(selector).html(xhr.responseText);
            }
            $(wf.statusSelector).html('<span class="status-error">'+wf.statusMessage.error+'</span>');
        }
    });
};

WebFaceClass.prototype.LoadAuto = function(selector, module, prog, data) {
    this.LoadCss(module, prog);
    this.LoadScript(module, prog);
    this.Load(selector, module, prog, data);
    if (this.Demand(module, prog, 'HookOnLoad')) {
        this.Invoke(module, prog, 'HookOnLoad');
    }
    if (this.Demand('global', 'common', 'HookOnLoad')) {
        this.Invoke('global', 'common', 'HookOnLoad', module, prog);
    }
};

WebFaceClass.prototype.Execute = function(module, prog, data) {
    var debug = this.useDebugger;
    var wf = this;
    var url = this.MakeUrl('handler', module, prog);
    
    $(wf.statusSelector).html('<span class="status-busy">'+wf.statusMessage.busy+'</span>');
    
    $.ajax({
        url: url,
        type: 'POST',
        dataType: 'script',
        data: data,
        async: false,
        cache: false,
        success: function(data) {
            setTimeout(function() {
                $(wf.statusSelector).html('<span class="status-finish">'+wf.statusMessage.finish+'</span>');
            }, 1000);
        },
        error: function(xhr) {
            if (debug) {
                wf.Alert(xhr.responseText, 'error: could not execute '+url);
            }
            else {
                wf.Alert('error: could not execute '+url);
            }
            setTimeout(function() {
                $(wf.statusSelector).html('<span class="status-finish">'+wf.statusMessage.finish+'</span>');
            }, 1000);
        }
    });
};

WebFaceClass.prototype.ExecuteResult = function(module, prog, key, value) {
};

/**
 * @param selector Specify a selector to DOM Form object.
 */
WebFaceClass.prototype.Submit = function(form_selector) {
    var debug = this.useDebugger;
    var wf = this;
    var form = $(form_selector);

    url = WebFace.MakeActionUrl(form.attr('action'));
    type = form.attr('method');
    data = form.serialize();

    $.ajax({
        url: url,
        type: type,
        dataType: 'script',
        data: data,
        async: false,
        cache: false,
        success: function(data) {
            //nothing 
        },
        error: function(xhr) {
            if (debug) {
                wf.Alert(xhr.responseText, 'error: could not execute '+url);
            }
            else {
                wf.Alert('error: could not execute '+url);
            }
        }
    });
}

WebFaceClass.prototype.TabInit = function(selector) {
    var wf = this;
    this.targetTabObject = $(selector);
    this.targetTabPrefix = "webface-tab";
    this.targetTabObject.tabs({
        closable: true,
        remove: function(event, ui) {
            wf.TabClean();
        }
    });
    this.targetTabObject.tabs('remove', 0);
};

WebFaceClass.prototype.TabKeep = function(module, prog, data, id) {
    this.targetTabMap[module+'.'+prog] = {module: module, prog: prog, data: data, id: id};
};

WebFaceClass.prototype.TabRead = function(module, prog) {
    return this.targetTabMap[module+'.'+prog];
};

WebFaceClass.prototype.TabId = function(module, prog) {
    if (this.TabHas(module, prog)) {
        return this.targetTabMap[module+'.'+prog].id;
    }
    return null;
};

WebFaceClass.prototype.TabData = function(module, prog) {
    if (this.TabHas(module, prog)) {
        return this.targetTabMap[module+'.'+prog].data;
    }
    return null;
};

WebFaceClass.prototype.TabHas = function(module, prog) {
    if (this.targetTabMap[module+'.'+prog]) {
        return true;
    }
    return false;
};

WebFaceClass.prototype.TabIndex = function(module, prog) {
    return $('div[id^="'+this.targetTabPrefix+'"]').index($('#'+this.TabId(module, prog)));
};

WebFaceClass.prototype.TabSelect = function(module, prog) {
    if (this.TabHas(module, prog)) {
        this.targetTabObject.tabs('select', this.TabIndex(module, prog));
        return this.TabIndex(module, prog);
    }
    return -1;
};

WebFaceClass.prototype.TabSelectedIndex = function() {
    return this.targetTabObject.tabs('option', 'selected');
};

WebFaceClass.prototype.TabSelected = function() {
    var tabId = $('div[id^="'+this.targetTabPrefix+'"]:eq('+this.TabSelectedIndex()+')').attr('id');
    for (var key in this.targetTabMap) {
        if (this.targetTabMap[key].id == tabId) {
            return this.targetTabMap[key];
        }
    }
    return null;
};

WebFaceClass.prototype.TabOpen = function(label, module, prog, data) {
    if (this.TabHas(module, prog)) {
        this.TabSelect(module, prog);
    }
    else {
        var newIndex = this.targetTabIndex++;
        var newId = this.targetTabPrefix+'-'+module+"-"+prog;

        this.TabKeep(module, prog, data, newId);

        this.targetTabObject.append('<div id="'+newId+'" class="webface-tab-container">Loading</div>');
        this.targetTabObject.tabs('add', '#'+newId, label);

        this.TabSelect(module, prog);
        
        this.LoadAuto('#'+newId, module, prog, data);
    }
};

WebFaceClass.prototype.TabClose = function(module, prog) {
    if (this.TabHas(module, prog)) {
        this.targetTabObject.tabs('remove', this.TabIndex(module, prog));
    }
};

WebFaceClass.prototype.TabClean = function() {
    for (var key in this.targetTabMap) {
        if (this.TabIndex(this.targetTabMap[key].module, this.targetTabMap[key].prog) < 0) {
            delete this.targetTabMap[key];
        }
    }
};

WebFaceClass.prototype.TabReload = function(module, prog, data) {
    if (!module) {
        var tabObj = this.TabSelected();
        if (tabObj && tabObj.module) {
            this.TabReload(tabObj.module, tabObj.prog, tabObj.data);
        }
    }
    else {
        this.TabKeep(module, prog, data, this.TabId(module, prog));
        this.LoadAuto('#'+(this.TabId(module, prog)), module, prog, data);
    }
};

WebFaceClass.prototype.DialogOpen = function(label, module, prog, data) {
    var dialog_id = 'webface-dialog-'+module+'-'+prog;

    if (this.DialogHas(module, prog)) {
        this.DialogSelect(module, prog);
        $('#'+dialog_id).dialog('option', 'title', label);
    }
    else {
        var curtab = $('div.webface-tab-container:visible');
        var newDialog = $('<div id="'+dialog_id+'" title="'+label+'">Loading</div>').appendTo(curtab);
        newDialog.dialog({
            width: (data&&data.width)?data.width:((($.browser.msie&&($.browser.version=='6.0'))?800:'auto')),
            height: (data&&data.height)?data.height:((($.browser.msie&&($.browser.version=='6.0'))?600:'auto')),
            position: [300, 50],
            close: function(event, ui) {
                newDialog.dialog('destroy');
                $('#'+dialog_id).remove();
            } 
        });
    }
    this.LoadAuto('#'+dialog_id, module, prog, data);
};

WebFaceClass.prototype.DialogClose = function(module, prog) {
    $('div#webface-dialog-'+module+'-'+prog).dialog('close');
};

WebFaceClass.prototype.DialogHas = function(module, prog) {
    return ($('div#webface-dialog-'+module+'-'+prog).length > 0);
};

WebFaceClass.prototype.DialogSelect = function(module, prog) {
    $('div#webface-dialog-'+module+'-'+prog).dialog('moveToTop');
};

/**
 * Layout function.
 * @param param JSon data
 * {north: "container1", west: "container2", center: "container3"}
 */
WebFaceClass.prototype.Layout = function(param) {
    $(param.north).addClass('ui-layout-north');
    $(param.west).addClass('ui-layout-west');
    $(param.east).addClass('ui-layout-east');
    $(param.south).addClass('ui-layout-south');
    $(param.center).addClass('ui-layout-center');

    $(param.center).css('overflow', 'auto');
    
    $('body').layout({
        defaults: {
        },
        north: {
            size: 'auto',
            spacing_open: 0,
            closable: false,
            resizable: false
        },
        west: {
            size: this.layoutWestSize,
            closable: true,
            resizable: true,
            spacing_closed: 20,
            togglerLength_closed: 140,
            togglerAlign_closed: 'top',
            togglerContent_closed: param.togglerContent_closed?param.togglerContent_closed:'M<br/>E<br/>N<br/>U',
            slideTrigger_open: 'click'
        },
        south: {
            size: 'auto',
            spacing_open: 0,
            closable: false,
            resizable: false
        }
    });
};
