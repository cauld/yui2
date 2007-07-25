(function () {

    /**
    * Dialog is an implementation of Panel that can be used to submit form 
    * data. Built-in functionality for buttons with event handlers is included, 
    * and button sets can be build dynamically, or the preincluded ones for 
    * Submit/Cancel and OK/Cancel can be utilized. Forms can be processed in 3
    * ways -- via an asynchronous Connection utility call, a simple form 
    * POST or GET, or manually.
    * @namespace YAHOO.widget
    * @class Dialog
    * @extends YAHOO.widget.Panel
    * @constructor
    * @param {String} el The element ID representing the Dialog <em>OR</em>
    * @param {HTMLElement} el The element representing the Dialog
    * @param {Object} userConfig The configuration object literal containing 
    * the configuration that should be set for this Dialog. See configuration 
    * documentation for more details.
    */
    YAHOO.widget.Dialog = function (el, userConfig) {
    
        YAHOO.widget.Dialog.superclass.constructor.call(this, el, userConfig);
    
    };


    var Event = YAHOO.util.Event,
        CustomEvent = YAHOO.util.CustomEvent,
        Dom = YAHOO.util.Dom,
        KeyListener = YAHOO.util.KeyListener,
        Connect = YAHOO.util.Connect,
        Dialog = YAHOO.widget.Dialog,
        Lang = YAHOO.lang,

        /**
        * Constant representing the name of the Dialog's events
        * @property EVENT_TYPES
        * @private
        * @final
        * @type Object
        */
        EVENT_TYPES = {
        
            "BEFORE_SUBMIT": "beforeSubmit",
            "SUBMIT": "submit",
            "MANUAL_SUBMIT": "manualSubmit",
            "ASYNC_SUBMIT": "asyncSubmit",
            "FORM_SUBMIT": "formSubmit",
            "CANCEL": "cancel"
        
        },
        
        /**
        * Constant representing the Dialog's configuration properties
        * @property DEFAULT_CONFIG
        * @private
        * @final
        * @type Object
        */
        DEFAULT_CONFIG = {
        
            "POST_METHOD": { 
                key: "postmethod", 
                value: "async" 
            },
            
            "BUTTONS": { 
                key: "buttons", 
                value: "none" 
            }
        
        };    


    /**
    * Constant representing the default CSS class used for a Dialog
    * @property Dialog.CSS_DIALOG
    * @static
    * @final
    * @type String
    */
    Dialog.CSS_DIALOG = "yui-dialog";


    function removeButtonEventHandlers() {

        var aButtons = this._aButtons,
            nButtons,
            oButton,
            i;

        if (Lang.isArray(aButtons)) {

            nButtons = aButtons.length;

            if (nButtons > 0) {

                i = nButtons - 1;

                do {

                    oButton = aButtons[i];
                    
                    if (oButton instanceof YAHOO.widget.Button) {
                        
                        oButton.destroy();
                        
                    }
                    else if (oButton.tagName.toUpperCase() == "BUTTON") {

                        Event.purgeElement(oButton);
                        Event.purgeElement(oButton, false);

                    }

                }
                while (i--);
            
            }
        
        }

    }
    
    
    YAHOO.extend(Dialog, YAHOO.widget.Panel, { 

        
        /**
        * @property form
        * @description Object reference to the Dialog's 
        * <code>&#60;form&#62;</code> element.
        * @default null 
        * @type <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/
        * level-one-html.html#ID-40002357">HTMLFormElement</a>
        */
        form: null,
    
        /**
        * Initializes the class's configurable properties which can be changed 
        * using the Dialog's Config object (cfg).
        * @method initDefaultConfig
        */
        initDefaultConfig: function () {
            Dialog.superclass.initDefaultConfig.call(this);
        
            /**
            * The internally maintained callback object for use with the 
            * Connection utility
            * @property callback
            * @type Object
            */
            this.callback = {
    
                /**
                * The function to execute upon success of the 
                * Connection submission
                * @property callback.success
                * @type Function
                */
                success: null,
    
                /**
                * The function to execute upon failure of the 
                * Connection submission
                * @property callback.failure
                * @type Function
                */
                failure: null,
    
                /**
                * The arbitraty argument or arguments to pass to the Connection 
                * callback functions
                * @property callback.argument
                * @type Object
                */
                argument: null
    
            };
        

            // Add form dialog config properties //
            
            /**
            * The method to use for posting the Dialog's form. Possible values 
            * are "async", "form", and "manual".
            * @config postmethod
            * @type String
            * @default async
            */
            this.cfg.addProperty(DEFAULT_CONFIG.POST_METHOD.key, {
                handler: this.configPostMethod, 
                value: DEFAULT_CONFIG.POST_METHOD.value, 
                validator: function (val) {
                    if (val != "form" && val != "async" && val != "none" && 
                        val != "manual") {
                        return false;
                    } else {
                        return true;
                    }
                }
            });
            
            /**
            * Array of object literals, each containing a set of properties 
            * defining a button to be appended into the Dialog's footer.
            * Each button object in the buttons array can have three properties:
            * <dt>text:</dt>
            * <dd>The text that will display on the face of the button.  <em>
            * Please note:</em> As of version 2.3, the text can include 
            * HTML.</dd>
            * <dt>handler:</dt>
            * <dd>Can be either:
            *     <ol>
            *         <li>A reference to a function that should fire when the 
            * button is clicked.  (In this case scope of this function is 
            * always its Dialog instance.)</li>
            *         <li>An object literal representing the code to be 
            * executed when the button is clicked.  Format:<br> <code> {<br>  
            * <strong>fn:</strong> Function,   &#47;&#47; The handler to call 
            * when  the event fires.<br> <strong>obj:</strong> Object, 
            * &#47;&#47; An  object to pass back to the handler.<br> <strong>
            * scope:</strong>  Object &#47;&#47; The object to use for the 
            * scope of the handler. <br> } </code> <br><em>Please note: this 
            * functionality was added in version 2.3.</em></li>
            *     </ol>
            * </dd>
            * <dt>isDefault:</dt>
            * <dd>An optional boolean value that specifies that a button 
            * should be highlighted and focused by default.</dd>
            * @config buttons
            * @type {Array|String}
            * @default "none"
            */
            this.cfg.addProperty(DEFAULT_CONFIG.BUTTONS.key, {
                handler: this.configButtons,
                value: DEFAULT_CONFIG.BUTTONS.value
            }); 
            
        },
        
        /**
        * Initializes the custom events for Dialog which are fired 
        * automatically at appropriate times by the Dialog class.
        * @method initEvents
        */
        initEvents: function () {
            Dialog.superclass.initEvents.call(this);
        
            var SIGNATURE = CustomEvent.LIST;
        
            /**
            * CustomEvent fired prior to submission
            * @event beforeSubmitEvent
            */ 
            this.beforeSubmitEvent = 
                this.createEvent(EVENT_TYPES.BEFORE_SUBMIT);
            this.beforeSubmitEvent.signature = SIGNATURE;
            
            /**
            * CustomEvent fired after submission
            * @event submitEvent
            */
            this.submitEvent = this.createEvent(EVENT_TYPES.SUBMIT);
            this.submitEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired prior to manual submission
            * @event manualSubmitEvent
            */
            this.manualSubmitEvent = 
                this.createEvent(EVENT_TYPES.MANUAL_SUBMIT);
            this.manualSubmitEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired prior to asynchronous submission
            * @event asyncSubmitEvent
            */ 
            this.asyncSubmitEvent = this.createEvent(EVENT_TYPES.ASYNC_SUBMIT);
            this.asyncSubmitEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired prior to form-based submission
            * @event formSubmitEvent
            */
            this.formSubmitEvent = this.createEvent(EVENT_TYPES.FORM_SUBMIT);
            this.formSubmitEvent.signature = SIGNATURE;
        
            /**
            * CustomEvent fired after cancel
            * @event cancelEvent
            */
            this.cancelEvent = this.createEvent(EVENT_TYPES.CANCEL);
            this.cancelEvent.signature = SIGNATURE;
        
        },
        
        /**
        * The Dialog initialization method, which is executed for Dialog and 
        * all of its subclasses. This method is automatically called by the 
        * constructor, and  sets up all DOM references for pre-existing markup, 
        * and creates required markup if it is not already present.
        * @method init
        * @param {String} el The element ID representing the Dialog <em>OR</em>
        * @param {HTMLElement} el The element representing the Dialog
        * @param {Object} userConfig The configuration object literal 
        * containing the configuration that should be set for this Dialog. 
        * See configuration documentation for more details.
        */
        init: function (el, userConfig) {

            /*
                 Note that we don't pass the user config in here yet because 
                 we only want it executed once, at the lowest subclass level
            */

            Dialog.superclass.init.call(this, el/*, userConfig*/); 
        
            this.beforeInitEvent.fire(Dialog);
        
            Dom.addClass(this.element, Dialog.CSS_DIALOG);
        
            this.cfg.setProperty("visible", false);
        
            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }
        
            this.showEvent.subscribe(this.focusFirst, this, true);
            this.beforeHideEvent.subscribe(this.blurButtons, this, true);

            this.subscribe("changeBody", this.registerForm);
        
            this.initEvent.fire(Dialog);
        },
        
        /**
        * Submits the Dialog's form depending on the value of the 
        * "postmethod" configuration property.  <strong>Please note:
        * </strong> As of version 2.3 this method will automatically handle 
        * asyncronous file uploads should the Dialog instance's form contain 
        * <code>&#60;input type="file"&#62;</code> elements.  If a Dialog 
        * instance will be handling asyncronous file uploads, its 
        * <code>callback</code> property will need to be setup with a 
        * <code>upload</code> handler rather than the standard 
        * <code>success</code> and, or <code>failure</code> handlers.  For more 
        * information, see the <a href="http://developer.yahoo.com/yui/
        * connection/#file">Connection Manager documenation on file uploads</a>.
        * @method doSubmit
        */
        doSubmit: function () {
    
            var oForm = this.form,
                bUseFileUpload = false,
                bUseSecureFileUpload = false,
                aElements,
                nElements,
                i,
                sMethod;


            switch (this.cfg.getProperty("postmethod")) {
    
            case "async":

                aElements = oForm.elements;
                nElements = aElements.length;

                if (nElements > 0) {
                
                    i = nElements - 1;
                
                    do {
                    
                        if (aElements[i].type == "file") {
                        
                            bUseFileUpload = true;
                            break;
                        
                        }
                    
                    }
                    while(i--);
                
                }

                if (bUseFileUpload && YAHOO.env.ua.ie && this.isSecure) {

                    bUseSecureFileUpload = true;
                
                }

                sMethod = 
                    (oForm.getAttribute("method") || "POST").toUpperCase();

                Connect.setForm(oForm, bUseFileUpload, bUseSecureFileUpload);

                Connect.asyncRequest(sMethod, oForm.getAttribute("action"), 
                    this.callback);

                this.asyncSubmitEvent.fire();

                break;

            case "form":

                oForm.submit();
                this.formSubmitEvent.fire();

                break;

            case "none":
            case "manual":

                this.manualSubmitEvent.fire();

                break;
    
            }
    
        },
        
        
        /**
        * Prepares the Dialog's internal FORM object, creating one if one is
        * not currently present.
        * @method registerForm
        */
        registerForm: function () {
    
            var form = this.element.getElementsByTagName("form")[0],
                me = this,
                firstElement,
                lastElement;


            if (this.form) {

                if (this.form == form && 
                    Dom.isAncestor(this.element, this.form)) {
    
                    return;
    
                }
                else {

                    Event.purgeElement(this.form);
                    
                    this.form = null;                
                
                }
            
            }
        

            if (!form) {

                form = document.createElement("form");
                form.name = "frm_" + this.id;

                this.body.appendChild(form);

            }


            if (form) {

                this.form = form;

                Event.on(form, "submit", function (e) {

                    Event.stopEvent(e);

                    this.submit();
                    this.form.blur();
        
                });


                this.firstFormElement = function () {
        
                    var f, el, nElements = form.elements.length;
        
                    for (f = 0; f < nElements; f++) {
    
                        el = form.elements[f];
    
                        if (el.focus && !el.disabled && el.type != "hidden") {
    
                            return el;
    
                        }
    
                    }
    
                    return null;
                    
                }();
            
                this.lastFormElement = function () {
        
                    var f, el, nElements = form.elements.length;
        
                    for (f = nElements - 1; f >= 0; f--) {
    
                        el = form.elements[f];
    
                        if (el.focus && !el.disabled && el.type != "hidden") {
    
                            return el;
    
                        }
    
                    }
    
                    return null;
    
                }();
            
                if (this.cfg.getProperty("modal")) {
            
                    firstElement = this.firstFormElement || this.firstButton;
        
                    if (firstElement) {
    
                        this.preventBackTab = new KeyListener(firstElement, 
                            { shift: true, keys: 9 }, 
                            { fn: me.focusLast, scope: me, 
                            correctScope: true });
    
                        this.showEvent.subscribe(this.preventBackTab.enable, 
                            this.preventBackTab, true);
    
                        this.hideEvent.subscribe(this.preventBackTab.disable, 
                            this.preventBackTab, true);
                    }
            
                    lastElement = this.lastButton || this.lastFormElement;
    
                    if (lastElement) {
    
                        this.preventTabOut = new KeyListener(lastElement, 
                            { shift: false, keys: 9 }, 
                            { fn: me.focusFirst, scope: me, 
                            correctScope: true });
    
                        this.showEvent.subscribe(this.preventTabOut.enable, 
                            this.preventTabOut, true);
    
                        this.hideEvent.subscribe(this.preventTabOut.disable, 
                            this.preventTabOut, true);
    
                    }
                }
            
            }

        },
        
        // BEGIN BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * The default event handler fired when the "close" property is 
        * changed. The method controls the appending or hiding of the close
        * icon at the top right of the Dialog.
        * @method configClose
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For 
        * configuration handlers, args[0] will equal the newly applied value 
        * for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configClose: function (type, args, obj) {
            var val = args[0];
        
            function doCancel(e, obj) {
                obj.cancel();
            }
        
            if (val) {
                if (! this.close) {
                    this.close = document.createElement("div");
                    Dom.addClass(this.close, "container-close");
        
                    this.close.innerHTML = "&#160;";
                    this.innerElement.appendChild(this.close);
                    Event.on(this.close, "click", doCancel, this);
                } else {
                    this.close.style.display = "block";
                }
            } else {
                if (this.close) {
                    this.close.style.display = "none";
                }
            }
        },
        
        /**
        * The default event handler for the "buttons" configuration property
        * @method configButtons
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For configuration 
        * handlers, args[0] will equal the newly applied value for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configButtons: function (type, args, obj) {
    
            var Button = YAHOO.widget.Button,
                aButtons = args[0],
                oInnerElement = this.innerElement,
                oButton,
                oButtonEl,
                oYUIButton,
                nButtons,
                oSpan,
                oFooter,
                i;

            removeButtonEventHandlers.call(this);
            
            this._aButtons = null;

            if (Lang.isArray(aButtons)) {

                oSpan = document.createElement("span");
                oSpan.className = "button-group";

                nButtons = aButtons.length;

                this._aButtons = [];
        
                for (i = 0; i < nButtons; i++) {

                    oButton = aButtons[i];

                    if (Button) {

                        oYUIButton = new Button({ label: oButton.text, 
                                            container: oSpan });

                        oButtonEl = oYUIButton.get("element");

                        if (oButton.isDefault) {

                            oYUIButton.addClass("default");

                            this.defaultHtmlButton = oButtonEl;

                        }
    
                        if (Lang.isFunction(oButton.handler)) {
    
                            oYUIButton.set("onclick", { fn: oButton.handler, 
                                obj: this, scope: this });
            
                        }
                        else if (Lang.isObject(oButton.handler) && 
                            Lang.isFunction(oButton.handler.fn)) {

                            oYUIButton.set("onclick", { fn: oButton.handler.fn, 
                                obj: ((!Lang.isUndefined(oButton.handler.obj)) ? 
                                oButton.handler.obj : this), 
                                scope: (oButton.handler.scope || this) });
    
                        }

                        this._aButtons[this._aButtons.length] = oYUIButton;

                    }
                    else {
        
                        oButtonEl = document.createElement("button");
                        oButtonEl.setAttribute("type", "button");
            
                        if (oButton.isDefault) {
                            oButtonEl.className = "default";
                            this.defaultHtmlButton = oButtonEl;
                        }
    
                        oButtonEl.innerHTML = oButton.text;
    
                        if (Lang.isFunction(oButton.handler)) {
    
                            Event.on(oButtonEl, "click", oButton.handler, 
                                this, true);
            
                        }
                        else if (Lang.isObject(oButton.handler) && 
                            Lang.isFunction(oButton.handler.fn)) {
    
                            Event.on(oButtonEl, "click", oButton.handler.fn, 
                                ((!Lang.isUndefined(oButton.handler.obj)) ? 
                                oButton.handler.obj : this), 
                                (oButton.handler.scope || this));
    
                        }
            
                        oSpan.appendChild(oButtonEl);
                        
                        this._aButtons[this._aButtons.length] = oButtonEl;
                        
                    }

                    oButton.htmlButton = oButtonEl;
        
                    if (i === 0) {
                        this.firstButton = oButtonEl;
                    }
        
                    if (i == (nButtons - 1)) {
                        this.lastButton = oButtonEl;
                    }
        
                }
        
                this.setFooter(oSpan);

                oFooter = this.footer;
                
                if (Dom.inDocument(this.element) && 
                    !Dom.isAncestor(oInnerElement, oFooter)) {
    
                    oInnerElement.appendChild(oFooter);
                
                }

                this.buttonSpan = oSpan;

            } else { // Do cleanup

                oSpan = this.buttonSpan;
                oFooter = this.footer;

                if (oSpan && oFooter) {

                    oFooter.removeChild(oSpan);

                    this.buttonSpan = null;
                    this.firstButton = null;
                    this.lastButton = null;
                    this.defaultHtmlButton = null;

                }

            }

            this.cfg.refireEvent("iframe");
            this.cfg.refireEvent("underlay");

        },


        /**
        * @method getButtons
        * @description Returns an array containing each of the Dialog's 
        * buttons, by default an array of HTML <code>&#60;BUTTON&#60;</code> 
        * elements.  If the Dialog's buttons were created using the 
        * YAHOO.widget.Button class (via the inclusion of the optional Button 
        * dependancy on the page), an array of YAHOO.widget.Button instances 
        * is returned.
        * @return {Array}
        */
        getButtons: function () {
        
            var aButtons = this._aButtons;
            
            if (aButtons) {
            
                return aButtons;
            
            }
        
        },

        
        /**
        * Sets focus to the first element in the Dialog's form or the first 
        * button defined via the "buttons" configuration property. Called 
        * when the Dialog is made visible.
        * @method focusFirst
        */
        focusFirst: function (type, args, obj) {
    
            var oElement = this.firstFormElement,
                oEvent;

            if (args) {

                oEvent = args[1];

                if (oEvent) {

                    Event.stopEvent(oEvent);

                }

            }
        

            if (oElement) {

                /*
                    Place the call to the "focus" method inside a try/catch
                    block to prevent IE from throwing JavaScript errors if
                    the element is disabled or hidden.
                */

                try {

                    oElement.focus();

                }
                catch(oException) {

                }

            } else {

                this.focusDefaultButton();

            }

        },
        
        /**
        * Sets focus to the last element in the Dialog's form or the last 
        * button defined via the "buttons" configuration property.
        * @method focusLast
        */
        focusLast: function (type, args, obj) {
    
            var aButtons = this.cfg.getProperty("buttons"),
                oElement = this.lastFormElement,
                oEvent;
    
            if (args) {

                oEvent = args[1];

                if (oEvent) {

                    Event.stopEvent(oEvent);

                }

            }
            
            if (aButtons && Lang.isArray(aButtons)) {

                this.focusLastButton();

            } else {

                if (oElement) {

                    /*
                        Place the call to the "focus" method inside a try/catch
                        block to prevent IE from throwing JavaScript errors if
                        the element is disabled or hidden.
                    */
    
                    try {
    
                        oElement.focus();
    
                    }
                    catch(oException) {
    
                    }

                }

            }

        },
        
        /**
        * Sets the focus to the button that is designated as the default via 
        * the "buttons" configuration property. By default, this method is 
        * called when the Dialog is made visible.
        * @method focusDefaultButton
        */
        focusDefaultButton: function () {
        
            var oElement = this.defaultHtmlButton;
        
            if (oElement) {

                /*
                    Place the call to the "focus" method inside a try/catch
                    block to prevent IE from throwing JavaScript errors if
                    the element is disabled or hidden.
                */

                try {

                    oElement.focus();
                
                }
                catch(oException) {
                
                }

            }
        },
        
        /**
        * Blurs all the buttons defined via the "buttons" 
        * configuration property.
        * @method blurButtons
        */
        blurButtons: function () {
            
            var aButtons = this.cfg.getProperty("buttons"),
                nButtons,
                oButton,
                oElement,
                i;

            if (aButtons && Lang.isArray(aButtons)) {
            
                nButtons = aButtons.length;
                
                if (nButtons > 0) {
                
                    i = (nButtons - 1);
                    
                    do {
                    
                        oButton = aButtons[i];
                        
                        if (oButton) {

                            oElement = oButton.htmlButton;

                            if (oElement) {

                                /*
                                    Place the call to the "blur" method inside  
                                    a try/catch block to prevent IE from  
                                    throwing JavaScript errors if the element 
                                    is disabled or hidden.
                                */
    
                                try {
            
                                    oElement.blur();
                                
                                }
                                catch(oException) {
                                
                                
                                }
                            
                            }

                        }
                    
                    }
                    while(i--);
                
                }
            
            }

        },
        
        /**
        * Sets the focus to the first button created via the "buttons"
        * configuration property.
        * @method focusFirstButton
        */
        focusFirstButton: function () {
    
            var aButtons = this.cfg.getProperty("buttons"),
                oButton,
                oElement;

            if (aButtons && Lang.isArray(aButtons)) {

                oButton = aButtons[0];

                if (oButton) {

                    oElement = oButton.htmlButton;
                    
                    if (oElement) {

                        /*
                            Place the call to the "focus" method inside a 
                            try/catch block to prevent IE from throwing 
                            JavaScript errors if the element is disabled 
                            or hidden.
                        */
    
                        try {
    
                            oElement.focus();
                        
                        }
                        catch(oException) {
                        
                        
                        }
                    
                    }

                }

            }
        },
        
        /**
        * Sets the focus to the last button created via the "buttons" 
        * configuration property.
        * @method focusLastButton
        */
        focusLastButton: function () {
    
            var aButtons = this.cfg.getProperty("buttons"),
                nButtons,
                oButton,
                oElement;

            if (aButtons && Lang.isArray(aButtons)) {

                nButtons = aButtons.length;
                
                if (nButtons > 0) {

                    oButton = aButtons[(nButtons - 1)];
                    
                    if (oButton) {
                    
                        oElement = oButton.htmlButton;

                        if (oElement) {

                            /*
                                Place the call to the "focus" method inside a 
                                try/catch block to prevent IE from throwing 
                                JavaScript errors if the element is disabled
                                or hidden.
                            */
        
                            try {
        
                                oElement.focus();
                            
                            }
                            catch(oException) {
                            
                            
                            }
                        
                        }
                    
                    }
                
                }
            
            }

        },
        
        /**
        * The default event handler for the "postmethod" configuration property
        * @method configPostMethod
        * @param {String} type The CustomEvent type (usually the property name)
        * @param {Object[]} args The CustomEvent arguments. For 
        * configuration handlers, args[0] will equal the newly applied value 
        * for the property.
        * @param {Object} obj The scope object. For configuration handlers, 
        * this will usually equal the owner.
        */
        configPostMethod: function (type, args, obj) {
    
            var postmethod = args[0];
        
            this.registerForm();
    
        },
        
        // END BUILT-IN PROPERTY EVENT HANDLERS //
        
        /**
        * Built-in function hook for writing a validation function that will 
        * be checked for a "true" value prior to a submit. This function, as 
        * implemented by default, always returns true, so it should be 
        * overridden if validation is necessary.
        * @method validate
        */
        validate: function () {
            return true;
        },
        
        /**
        * Executes a submit of the Dialog followed by a hide, if validation 
        * is successful.
        * @method submit
        */
        submit: function () {
            if (this.validate()) {
                this.beforeSubmitEvent.fire();
                this.doSubmit();
                this.submitEvent.fire();
                this.hide();
                return true;
            } else {
                return false;
            }
        },
        
        /**
        * Executes the cancel of the Dialog followed by a hide.
        * @method cancel
        */
        cancel: function () {
            this.cancelEvent.fire();
            this.hide();
        },
        
        /**
        * Returns a JSON-compatible data structure representing the data 
        * currently contained in the form.
        * @method getData
        * @return {Object} A JSON object reprsenting the data of the 
        * current form.
        */
        getData: function () {
        
            var oForm = this.form,
                aElements,
                nTotalElements,
                oData,
                sName,
                oElement,
                nElements,
                sType,
                sTagName,
                aOptions,
                nOptions,
                aValues,
                oOption,
                sValue,
                oRadio,
                oCheckbox,
                i,
                n;    
    
            function isFormElement(p_oElement) {
            
                var sTag = p_oElement.tagName.toUpperCase();
                
                return ((sTag == "INPUT" || sTag == "TEXTAREA" || 
                        sTag == "SELECT") && p_oElement.name == sName);
    
            }
    
    
            if (oForm) {
        
                aElements = oForm.elements;
                nTotalElements = aElements.length;
                oData = {};
    
        
                for (i = 0; i < nTotalElements; i++) {
        
                    sName = aElements[i].name;
        
                    /*
                        Using "Dom.getElementsBy" to safeguard user from JS 
                        errors that result from giving a form field (or set of 
                        fields) the same name as a native method of a form 
                        (like "submit") or a DOM collection (such as the "item"
                        method). Originally tried accessing fields via the 
                        "namedItem" method of the "element" collection, but 
                        discovered that it won't return a collection of fields 
                        in Gecko.
                    */
        
                    oElement = Dom.getElementsBy(isFormElement, "*", oForm);
                    nElements = oElement.length;
        
                    if (nElements > 0) {
        
                        if (nElements == 1) {
        
                            oElement = oElement[0];
        
                            sType = oElement.type;
                            sTagName = oElement.tagName.toUpperCase();
        
                            switch (sTagName) {
        
                            case "INPUT":
    
                                if (sType == "checkbox") {
    
                                    oData[sName] = oElement.checked;
    
                                }
                                else if (sType != "radio") {
    
                                    oData[sName] = oElement.value;
    
                                }
    
                                break;
    
                            case "TEXTAREA":
    
                                oData[sName] = oElement.value;
    
                                break;
    
                            case "SELECT":
    
                                aOptions = oElement.options;
                                nOptions = aOptions.length;
                                aValues = [];
    
                                for (n = 0; n < nOptions; n++) {
    
                                    oOption = aOptions[n];
    
                                    if (oOption.selected) {
    
                                        sValue = oOption.value;
    
                                        if (!sValue || sValue === "") {
    
                                            sValue = oOption.text;
    
                                        }
    
                                        aValues[aValues.length] = sValue;
    
                                    }
    
                                }
    
                                oData[sName] = aValues;
    
                                break;
        
                            }
        
        
                        }
                        else {
        
                            sType = oElement[0].type;
        
                            switch (sType) {
        
                            case "radio":
    
                                for (n = 0; n < nElements; n++) {
    
                                    oRadio = oElement[n];
    
                                    if (oRadio.checked) {
    
                                        oData[sName] = oRadio.value;
                                        break;
    
                                    }
    
                                }
    
                                break;
    
                            case "checkbox":
    
                                aValues = [];
    
                                for (n = 0; n < nElements; n++) {
    
                                    oCheckbox = oElement[n];
    
                                    if (oCheckbox.checked) {
    
                                        aValues[aValues.length] = 
                                            oCheckbox.value;
    
                                    }
    
                                }
    
                                oData[sName] = aValues;
    
                                break;
        
                            }
        
                        }
        
                    }
        
                }
        
            }
        
        
            return oData;
        
        },
        
        /**
        * Removes the Panel element from the DOM and sets all child elements 
        * to null.
        * @method destroy
        */
        destroy: function () {
        
            removeButtonEventHandlers.call(this);
            
            this._aButtons = null;

            var aForms = this.element.getElementsByTagName("form"),
                oForm;
            
            if (aForms.length > 0) {

                oForm = aForms[0];

                if (oForm) {
                   
                    Event.purgeElement(oForm);
            
                    this.body.removeChild(oForm);
                    
                    this.form = null;
            
                }
            
            }
        
            Dialog.superclass.destroy.call(this);  
        
        },
        
        /**
        * Returns a string representation of the object.
        * @method toString
        * @return {String} The string representation of the Dialog
        */
        toString: function () {
            return "Dialog " + this.id;
        }
    
    });

}());