(function () {
   var util = YAHOO.util, lang = YAHOO.lang, Event = YAHOO.util.Event, Dom = util.Dom;

/**
 * Create a group of fields within a FORM tag and adds buttons
 * @class inputEx.Form
 * @extends inputEx.Group
 * @constructor
 * @param {Object} options The following options are added for Forms:
 * <ul>
 *   <li>buttons: list of button definition objects {value: 'Click Me', type: 'submit'}</li>
 *   <li>ajax: send the form through an ajax request (submit button should be present): {method: 'POST', uri: 'myScript.php', callback: same as YAHOO.util.Connect.asyncRequest callback}</li>
 *   <li>showMask: adds a mask over the form while the request is running (default is false)</li>
 * </ul>
 */
inputEx.Form = function(options) {
   inputEx.Form.superclass.constructor.call(this, options);
};

lang.extend(inputEx.Form, inputEx.Group, {

   /**
    * Adds buttons and set ajax default parameters
    * @param {Object} options Options object as passed to the constructor
    */
   setOptions: function(options) {
      inputEx.Form.superclass.setOptions.call(this, options);

      this.buttons = [];

      this.options.buttons = options.buttons || [];

      this.options.action = options.action;
   	this.options.method = options.method;

		this.options.className =  options.className || 'inputEx-Group';
		this.options.autocomplete = lang.isUndefined(options.autocomplete) ? true : options.autocomplete;
		
		this.options.enctype = options.enctype;

      if(options.ajax) {
         this.options.ajax = {};
         this.options.ajax.method = options.ajax.method || 'POST';
         this.options.ajax.uri = options.ajax.uri || 'default.php';
         this.options.ajax.callback = options.ajax.callback || {};
         this.options.ajax.callback.scope = options.ajax.callback.scope || this;
         this.options.ajax.showMask = lang.isUndefined(options.ajax.showMask) ? false : options.ajax.showMask;

			this.options.ajax.contentType = options.ajax.contentType || "application/json";
			this.options.ajax.wrapObject = options.ajax.wrapObject;
      }
      
      if (lang.isFunction(options.onSubmit)) {
         this.options.onSubmit = options.onSubmit;
      }
   },


   /**
    * Render the group
    */
   render: function() {
      // Create the div wrapper for this group
  	   this.divEl = inputEx.cn('div', {className: this.options.className});
	   if(this.options.id) {
   	   this.divEl.id = this.options.id;
   	}
   	  	   
  	   // Create the FORM element
      this.form = inputEx.cn('form', {method: this.options.method || 'POST', action: this.options.action || '', className: this.options.className || 'inputEx-Form'});
      this.divEl.appendChild(this.form);

		// set the enctype
		if(this.options.enctype) {
			this.form.setAttribute('enctype',this.options.enctype);
		}

	   // Set the autocomplete attribute to off to disable firefox autocompletion
		if(!this.options.autocomplete) {
	   	this.form.setAttribute('autocomplete','off');
		}
   	
      // Set the name of the form
      if(this.options.formName) { this.form.name = this.options.formName; }
  	   
  	   this.renderFields(this.form);

      this.renderButtons();
      
      if(this.options.disabled) {
  	      this.disable();
  	   }	  
   },


   /**
    * Render the buttons
    */
   renderButtons: function() {
       
      var button, buttonEl, innerSpan, i, buttonsNb = this.options.buttons.length;
	   
      this.buttonDiv = inputEx.cn('div', {className: 'inputEx-Form-buttonBar'});

	   for(i = 0 ; i < buttonsNb ; i++ ) {
	      button = this.options.buttons[i];
	
			// Throw Error if button is undefined
			if(!button) {
				throw new Error("inputEx.Form: One of the provided button is undefined ! (check trailing comma)");
			}
			
			// custom submit button, rendered as "link"
			if (button.type == "link") {
			   
			   buttonEl = inputEx.cn('a', {name: button.name, className:"inputEx-Form-Button", href:"#"});
			   innerSpan = inputEx.cn('span', null, null, button.value);
			   
			   buttonEl.appendChild(innerSpan);
   	      
			// default type is "submit" input
			} else {
			   
			   buttonEl = inputEx.cn('input', {type: button.type, value: button.value, name: button.name, className:"inputEx-Form-Button"});
   	      
			}
			
			// add id and/or classname
			if (!lang.isUndefined(button.id)) { inputEx.sn(buttonEl,{id:button.id}); }
			if (!lang.isUndefined(button.className)) { Dom.addClass(buttonEl,button.className); }
			
			// add onClick listener
			if( button.onClick ) {
			   Event.addListener(buttonEl,"click",button.onClick,buttonEl,true);
			}
			
			// save and add to Dom
	      this.buttons.push(buttonEl);
	      this.buttonDiv.appendChild(buttonEl);
	   }

	   this.form.appendChild(this.buttonDiv);
   },


   /**
    * Init the events
    */
   initEvents: function() {
      inputEx.Form.superclass.initEvents.call(this);

      // Handle the submit event
      Event.addListener(this.form, 'submit', this.options.onSubmit || this.onSubmit,this,true);
   },

   /**
    * Intercept the 'onsubmit' event and stop it if !validate
    * If the ajax option object is set, use YUI async Request to send the form
    * @param {Event} e The original onSubmit event
    */
   onSubmit: function(e) {
      
      // do nothing if does not validate
	   if ( !this.validate() ) {
		   Event.stopEvent(e); // no submit
		   return; // no ajax submit
	   }
	   
	   if(this.options.ajax) {
		   Event.stopEvent(e);
	      this.asyncRequest();
	   }
   },

   /**
    * Send the form value in JSON through an ajax request
    */
   asyncRequest: function() {

      if(this.options.ajax.showMask) { this.showMask(); }
	
		var formValue = this.getValue();
	
		// options.ajax.uri and options.ajax.method can also be functions that return a the uri/method depending of the value of the form
		var uri = lang.isFunction(this.options.ajax.uri) ? this.options.ajax.uri(formValue) : this.options.ajax.uri;
		var method = lang.isFunction(this.options.ajax.method) ? this.options.ajax.method(formValue) : this.options.ajax.method;
	
		var postData = null;
		
		// Classic application/x-www-form-urlencoded (like html forms)
		if(this.options.ajax.contentType == "application/x-www-form-urlencoded" && method != "PUT") {
			var params = [];
			for(var key in formValue) {
				if(formValue.hasOwnProperty(key)) {
					var pName = (this.options.ajax.wrapObject ? this.options.ajax.wrapObject+'[' : '')+key+(this.options.ajax.wrapObject ? ']' : '');
					params.push( pName+"="+window.encodeURIComponent(formValue[key]));
				}
			}
			postData = params.join('&');
		}
		// The only other contentType available is "application/json"
		else {
			YAHOO.util.Connect.initHeader("Content-Type" , "application/json" , false);
			
			// method PUT don't send as x-www-form-urlencoded but in JSON
			if(method == "PUT") {
				var formVal = this.getValue();
				var p;
				if(this.options.ajax.wrapObject) {
					p = {};
					p[this.options.ajax.wrapObject] = formVal;
				}
				else {
					p = formVal;
				}
				postData = lang.JSON.stringify(p);
			}
			else {
				// We keep this case for backward compatibility, but should not be used
				// Used when we send in JSON in POST or GET
				postData = "value="+window.encodeURIComponent(lang.JSON.stringify(this.getValue()));
			}
		}
		
      util.Connect.asyncRequest( method, uri, {
         success: function(o) {
            if(this.options.ajax.showMask) { this.hideMask(); }
            if( lang.isFunction(this.options.ajax.callback.success) ) {
               this.options.ajax.callback.success.call(this.options.ajax.callback.scope,o);
            }
         },

         failure: function(o) {
            if(this.options.ajax.showMask) { this.hideMask(); }
            if( lang.isFunction(this.options.ajax.callback.failure) ) {
               this.options.ajax.callback.failure.call(this.options.ajax.callback.scope,o);
            }
         },

         scope:this
      }, postData);
   },

   /**
    * Create a Mask over the form
    */
   renderMask: function() {
      if(this.maskRendered) return;

      // position as "relative" to position formMask inside as "absolute"
      Dom.setStyle(this.divEl, "position", "relative");

      // set zoom = 1 to fix hasLayout issue with IE6/7
      if (YAHOO.env.ua.ie) { Dom.setStyle(this.divEl, "zoom", 1); }

      // Render mask over the divEl
      this.formMask = inputEx.cn('div', {className: 'inputEx-Form-Mask'},
         {
            display: 'none',
            // Use offsetWidth instead of Dom.getStyle(this.divEl,"width") because
            // would return "auto" with IE instead of size in px
            width: this.divEl.offsetWidth+"px",
            height: this.divEl.offsetHeight+"px"
         },
         "<div class='inputEx-Form-Mask-bg'/><center><br/><div class='inputEx-Form-Mask-spinner'></div><br /><span>"+inputEx.messages.ajaxWait+"</span></div>");
      this.divEl.appendChild(this.formMask);
      this.maskRendered = true;
   },

   /**
    * Show the form mask
    */
   showMask: function() {
      this.renderMask();

      // Hide selects in IE 6
      this.toggleSelectsInIE(false);

      this.formMask.style.display = '';
   },

   /**
    * Hide the form mask
    */
   hideMask: function() {

      // Show selects back in IE 6
      this.toggleSelectsInIE(true);

      this.formMask.style.display = 'none';
   },

   /*
   * Method to hide selects in IE 6 when masking the form (else they would appear over the mask)
   */
   toggleSelectsInIE: function(show) {
      // IE 6 only
      if (!!YAHOO.env.ua.ie && YAHOO.env.ua.ie < 7) {
         var method = !!show ? YAHOO.util.Dom.removeClass : YAHOO.util.Dom.addClass;
         var that = this;
         YAHOO.util.Dom.getElementsBy(
            function() {return true;},
            "select",
            this.divEl,
            function(el) {method.call(that,el,"inputEx-hidden");}
         );
      }
   },


   /**
    * Enable all fields and buttons in the form
    */
   enable: function() {
      inputEx.Form.superclass.enable.call(this);
      for (var i = 0 ; i < this.buttons.length ; i++) {
 	      this.buttons[i].disabled = false;
      }
   },

   /**
    * Disable all fields and buttons in the form
    */
   disable: function() {
      inputEx.Form.superclass.disable.call(this);
      for (var i = 0 ; i < this.buttons.length ; i++) {
 	      this.buttons[i].disabled = true;
      }
   }

});


// Specific waiting message in ajax submit
inputEx.messages.ajaxWait = "Please wait...";

// Register this class as "form" type
inputEx.registerType("form", inputEx.Form, [
   {  
      type: 'list', 
      label: 'Buttons', 
      name: 'buttons', 
      elementType: {
         type: 'group', 
         fields: [
            { label: 'Label', name: 'value'},
            { type: 'select', label: 'Type', name: 'type', selectValues:["button", "submit"] }
         ]
      }
   }
]);


})();
