// Test this element. This code is auto-removed by the chilipeppr.load()
cprequire_test(["inline:com-chilipeppr-widget-grbl"], function (grbl) {
    //console.log("test running of " + grbl.id);
    grbl.init();
    //testRecvline();
    
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "$0=755.906 (x, step/mm)\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "$1=755.906 (y, step/mm)\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "$13=0 (report mode, 0=mm,1=inch)\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "$3=30 (step pulse, usec)\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "$5=500.000 (default feed, mm/min)\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "[G0 G54 G17 G21 G90 G94 M0 M5 M9 T0 F500.0]\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "[ALARM: Hard/soft limit]\n" });
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", {dataline: "['$H'|'$X' to unlock]\n" });
    
    
    chilipeppr.publish("/com-chilipeppr-widget-3dviewer/unitsChanged","inch");
    chilipeppr.publish("/com-chilipeppr-widget-serialport/onQueue", {Buf: 100});
    
    var sendTestPositionData = function() {
        setTimeout(function() {
            // MPos:[-0.05,0.00,0.00],WPos:[-0.05,0.00,0.00]
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/recvline", { 
                //dataline: "MPos:[-0.05,0.00,0.00],WPos:[-0.05,0.200,-1.00]"  //0.8a            
                //dataline: "<idle,MPos:-0.05,0.00,0.00,WPos:-0.05,0.200,-1.00>"  //0.8c
            //});
        }, 2000);
        
    };
  //  sendGrblVersion();
  //  sendTestPositionData();
    
    chilipeppr.publish("/com-chilipeppr-widget-serialport/recvSingleSelectPort",{BufferAlgorithm: "grbl"}); //error not grbl buffer

} /*end_test*/ );

cpdefine("inline:com-chilipeppr-widget-grbl", ["chilipeppr_ready", "jquerycookie"], function () {
    return {
        id: "com-chilipeppr-widget-grbl",
        implements: { 
            "com-chilipeppr-interface-cnccontroller" : "The CNC Controller interface is a loosely defined set of publish/subscribe signals. The notion of an interface is taken from object-oriented programming like Java where an interface is defined and then specific implementations of the interface are created. For the sake of a Javascript mashup like what ChiliPeppr is, the interface is just a rule to follow to publish signals and subscribe to signals by different top-level names than the ID of the widget or element implementing the interface. Most widgets/elements will publish and subscribe on their own ID. In this widget we are publishing/subscribing on an interface name. If another controller like Grbl is defined by a member of the community beyond this widget for GRBL, this widget can be forked and used without other widgets needing to be changed and the user could pick a Grbl or GRBL implementation of the interface."
        },
        url: "http://jsfiddle.net/lunix80/L4nvo7r7/show/light/",
        fiddleurl: "http://jsfiddle.net/lunix80/L4nvo7r7/",
        name: "Widget / GRBL",
        desc: "This widget shows the GRBL Buffer so other widgets can limit their flow of sending commands and other specific GRBL features.",
        publish: {
            '/com-chilipeppr-interface-cnccontroller/feedhold' : "Feedhold (Emergency Stop). This signal is published when user hits the Feedhold button for an emergency stop of the GRBL. Other widgets should see this and stop sending all commands such that even when the plannerresume signal is received when the user clears the queue or cycle starts again, they have to manually start sending code again. So, for example, a Gcode sender widget should place a pause on the sending but allow user to unpause.",
            '/com-chilipeppr-interface-cnccontroller/plannerpause' : "This widget will publish this signal when it determines that the planner buffer is too full on the GRBL and all other elements/widgets need to stop sending data. You will be sent a /plannerresume when this widget determines you can start sending again. The GRBL has a buffer of 28 slots for data. You want to fill it up with around 12 commands to give the planner enough data to work on for optimizing velocities of movement. However, you can't overfill the GRBL or it will go nuts with buffer overflows. This signal helps you fire off your data and not worry about it, but simply pause the sending of the data when you see this signal. This signal does rely on the GRBL being in {qv:2} mode which means it will auto-send us a report on the planner every time it changes. This widget watches for those changes to generate the signal. The default setting is when we hit 12 remaining planner buffer slots we will publish this signal.",
            '/com-chilipeppr-interface-cnccontroller/plannerresume' : "This widget will send this signal when it is ok to send data to the GRBL again. This widget watches the {qr:[val]} status report from the GRBL to determine when the planner buffer has enough room in it to send more data. You may not always get a 1 to 1 /plannerresume for every /plannerpause sent because we will keep sending /plannerpause signals if we're below threshold, but once back above threshold we'll only send you one /plannerresume. The default setting is to send this signal when we get back to 16 available planner buffer slots.",
            '/com-chilipeppr-interface-cnccontroller/axes' : "This widget will normalize the GRBL status report of axis coordinates to send off to other widgets like the XYZ widget. The axes publish payload contains {x:float, y:float, z:float, a:float} If a different CNC controller is implemented, it should normalize the coordinate status reports like this model. The goal of this is to abstract away the specific controller implementation from generic CNC widgets.",
            '/com-chilipeppr-interface-cnccontroller/units' : "This widget will normalize the GRBL units to the interface object of units {units: \"mm\"} or {units: \"inch\"}. This signal will be published on load or when this widget detects a change in units so other widgets like the XYZ widget can display the units for the coordinates it is displaying.",
            '/com-chilipeppr-interface-cnccontroller/proberesponse': 'Publish a probe response with the coordinates triggered during probing, or an alarm state if the probe does not contact a surface',
            '/com-chilipeppr-interface-cnccontroller/status' : 'Publish a signal each time the GRBL status changes'
        },
        subscribe: {
            '/com-chilipeppr-interface-cnccontroller/jogdone' : 'We subscribe to a jogdone event so that we can fire off an exclamation point (!) to the GRBL to force it to drop all planner buffer items to stop the jog immediately.',
            '/com-chilipeppr-interface-cnccontroller/recvgcode' : 'Subscribe to receive gcode from other widgets for processing and passing on to serial port'
        },
        foreignPublish: {
            "/com-chilipeppr-widget-serialport/send" : "We send to the serial port certain commands like the initial configuration commands for the GRBL to be in the correct mode and to get initial statuses like planner buffers and XYZ coords. We also send the Emergency Stop and Resume of ! and ~"
        },
        foreignSubscribe: {
            "/com-chilipeppr-widget-serialport/ws/onconnect" : "When we see a new connect, query for status.",
            "/com-chilipeppr-widget-serialport/recvline" : "When we get a dataline from serialport, process it and fire off generic CNC controller signals to the /com-chilipeppr-interface-cnccontroller channel.",
            "/com-chilipeppr-widget-serialport/send" : "Subscribe to serial send and override so no other subscriptions receive command."
        },
        config: [],
        err_log: [],
        //config_index: [],
        buffer_name: "",
        report_mode: 0,
        work_mode: 0,
        controller_units: null,
        status: "Offline",
        version: "",
        q_count: 0,
        alarm: false,
        offsets: {"x": 0.000, "y": 0.000, "z": 0.000},
        last_work: {"x":0.000, "y": 0.000, "z": 0.000},
        last_machine: {"x":0.000, "y": 0.000, "z": 0.000},
        g_status_reports: null,
        gcode_lookup:{"G0":"Rapid","G1":"Linear","G2":"Circular CW","G3":"Circular CCW","G38.2":"Probing","G80":"Cancel Mode",
                      "G54":"G54","G55":"G55","G56":"G56","G57":"G57","G58":"G58","G59":"G59",
                      "G17":"XY Plane", "G18":"ZX Plane","G19":"YZ Plane","G90":"Absolute", "G91":"Relative","G93":"Inverse", "G94":"Units/Min",
                      "G20":"Inches", "G21":"Millimetres","G43.1":"Active Tool Offset","G49":"No Tool Offset",
                      "M0":"Stop","M1":"Stop","M2":"End","M30":"End","M3":"Active-CW","M4":"Active-CCW","M5":"Off",
                      "M7":"Mist","M8":"Flood","M9":"Off"
                     },
                      
                      
        init: function () {
            this.uiHover(); //set up the data elements for all UI

          

            
            this.setupUiFromCookie();
            this.btnSetup();

            this.forkSetup();

            // setup recv pubsub event
            // this is when we receive data in a per line format from the serial port
            chilipeppr.subscribe("/com-chilipeppr-widget-serialport/recvline", this, function (msg) {
                this.grblResponseV1(msg);
            });

            chilipeppr.subscribe("/com-chilipeppr-widget-serialport/onportopen", this, this.openController);
            chilipeppr.subscribe("/com-chilipeppr-widget-serialport/onportclose", this, this.closeController);
            
            // subscribe to jogdone so we can stop the planner buffer immediately
            chilipeppr.subscribe("/com-chilipeppr-interface-cnccontroller/jogdone", this, function (msg) {
                //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", '!\n');
                //this.sendCode('!\n');
                setTimeout(function() {
                    chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/plannerresume', "");
                }, 2);
            });
            
            chilipeppr.subscribe("/com-chilipeppr-widget-serialport/recvSingleSelectPort", this, function(port){
                if(port !== null){
                   this.buffer_name = port.BufferAlgorithm;
                    if(this.buffer_name !== "grbl"){
                       $("#grbl-buffer-warning").show();
                    }
                    else{
                       $("#grbl-buffer-warning").hide();
                    }
                }
            });
            
            //no longer following the send.
            //chilipeppr.subscribe("/com-chilipeppr-widget-serialport/send", this, this.bufferPush, 1);
            
            //listen for units changed
            chilipeppr.subscribe("/com-chilipeppr-widget-3dviewer/unitsChanged",this,this.updateWorkUnits);
            chilipeppr.subscribe("/com-chilipeppr-widget-3dviewer/recvUnits",this,this.updateWorkUnits);
            chilipeppr.subscribe("/com-chilipeppr-interface-cnccontroller/units", this, this.updateWorkUnits); //this sets axes to match 3d viewer.
            
            //listen for whether a gcode file is playing - if so, cancel our $G interval and start sending each 25 lines of gcode file sent.
            chilipeppr.subscribe("/com-chilipeppr-widget-gcode/onplay", this, this.trackGcodeLines);
            chilipeppr.subscribe("/com-chilipeppr-widget-gcode/onstop", this, this.restartStatusInterval);
            //chilipeppr.subscribe("/com-chilipeppr-widget-gcode/onpause",this, function(state, metadata){
            //    if(state === false){ this.restartStatusInterval(); } //when gcode widget pauses, go back to interval querying $G
            //    else if(state === true){ this.trackGcodeLines(); }   //when gcode widget resumes, begin tracking line count to embed $G into buffer.
            //});
            chilipeppr.subscribe("/com-chilipeppr-widget-gcode/done", this, this.restartStatusInterval);
            
            //call to determine the current serialport configuration
            chilipeppr.publish("/com-chilipeppr-widget-serialport/requestSingleSelectPort","");
            
            //count spjs queue
            chilipeppr.subscribe("/com-chilipeppr-widget-serialport/onWrite", this, function(data){
                if(data.QCnt >= 0){
                    this.q_count = data.QCnt;
                    $('.stat-queue').html(this.q_count); 
                }
            });

            //call to find out what current work units are
            chilipeppr.publish("/com-chilipeppr-widget-3dviewer/requestUnits","");
            
            //watch for a 3d viewer /sceneReloaded and pass back axes info
            chilipeppr.subscribe("/com-chilipeppr-widget-3dviewer/sceneReloaded",this,function(data){
                if(this.last_work.x !== null)
                    this.publishAxisStatus(this.last_work);
                else if(this.last_machine.x !== null)
                    this.publishAxisStatus(this.machine);
                else
                    this.publishAxisStatus({"x":"x","y":"y","z":"z"});
            });
        },
        options: null,
        setupUiFromCookie: function() {
            // read vals from cookies
            var options = $.cookie('com-chilipeppr-widget-grbl-options');
            
            if (true && options) {
                options = $.parseJSON(options);
                //console.log("GRBL: just evaled options: ", options);
            } else {
                options = {showBody: true};
            }
            this.options = options;
            //console.log("GRBL: options:", options);
            
        },
        saveOptionsCookie: function() {
            var options = {
                showBody: this.options.showBody
            };
            var optionsStr = JSON.stringify(options);
            //console.log("GRBL: saving options:", options, "json.stringify:", optionsStr);
            // store cookie
            $.cookie('com-chilipeppr-widget-grbl-options', optionsStr, {
                expires: 365 * 10,
                path: '/'
            });
        },
        showBody: function(evt) {
            $('#com-chilipeppr-widget-grbl .panel-body .stat-row').removeClass('hidden');
            $('#com-chilipeppr-widget-grbl .hidebody span').addClass('glyphicon-chevron-up');
            $('#com-chilipeppr-widget-grbl .hidebody span').removeClass('glyphicon-chevron-down');
            if ((evt !== null)) {
                this.options.showBody = true;
                this.saveOptionsCookie();
            }
        },
        hideBody: function(evt) {
            $('#com-chilipeppr-widget-grbl .panel-body .stat-row').addClass('hidden');
            $('#com-chilipeppr-widget-grbl .hidebody span').removeClass('glyphicon-chevron-up');
            $('#com-chilipeppr-widget-grbl .hidebody span').addClass('glyphicon-chevron-down');
            if ((evt !== null)) {
                this.options.showBody = false;
                this.saveOptionsCookie();
            }
        },
        btnSetup: function() {
            // chevron hide body
            var that = this;

            
            $(".com-chilipeppr-widget-grbl-realtime-commands").hide();

            $('#com-chilipeppr-widget-grbl .hide-overrides').click(function(evt) {
                $(".com-chilipeppr-widget-grbl-realtime-commands").toggle();
              
            });

            
            $('#com-chilipeppr-widget-grbl .hidebody').click(function(evt) {
                //console.log("GRBL: hide/unhide body");
                if ($('#com-chilipeppr-widget-grbl .panel-body .stat-row').hasClass('hidden')) {
                    // it's hidden, unhide
                    that.showBody(evt);
                } else {
                    // hide
                    that.hideBody(evt);
                }
            });
            
            // https://github.com/gnea/grbl/wiki/Grbl-v1.1-Commands
            $('#com-chilipeppr-widget-grbl .grbl-safety-door').click(function() {
	            	that.sendCode('\x84');
            });

            $('#com-chilipeppr-widget-grbl .grbl-unlock').click(function() {
	            	that.sendCode('$X');
                $('#com-chilipeppr-widget-grbl .grbl-unlock').removeClass("btn-danger");
            });
            
            $('#com-chilipeppr-widget-grbl .overrides-btn .btn').click(function(){
            		// send ascii code from data-send-code html tag
              //   var code_to_send = parseInt($(this).data("send-code"),16);
                var code_to_send = parseInt($(this).data("send-code"),16);
              //   console.log("CODE: " + code_to_send);
                that.sendCode(String.fromCharCode(code_to_send));
	            	// that.sendCode(String.fromCharCode(code_to_send));
            });
            
            
            $('#com-chilipeppr-widget-grbl .grbl-feedhold').click(function() {
                //console.log("GRBL: feedhold");
                that.sendCode('!');
                $(this).html("!");
                $('#com-chilipeppr-widget-grbl .grbl-cyclestart').html('Resume').addClass("btn-success");
                // announce to other widgets that user hit e-stop
                chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/plannerpause', "");
                chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/feedhold", "");
            });
            $('#com-chilipeppr-widget-grbl .grbl-cyclestart').click(function() {
                //console.log("GRBL: cyclestart");
                that.sendCode('~');

                $(this).html("~").removeClass("btn-success");
                $('#com-chilipeppr-widget-grbl .grbl-feedhold').html('Feedhold !');
                //may want to check if buffer queue is >128 before resuming planner.
                chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/plannerresume', ""); 
            });
            
            $('#com-chilipeppr-widget-grbl .grbl-verbose').click(function() {
                //console.log("GRBL: manual status update");
                $('#com-chilipeppr-widget-grbl .grbl-verbose').toggleClass("enabled");
            });
            
            $('#com-chilipeppr-widget-grbl .grbl-reset').click(function() {
                //console.log("GRBL: reset");
                that.sendCode(String.fromCharCode(24));
                chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/plannerresume', "");
            });

            $('#com-chilipeppr-widget-grbl-btnoptions').click(this.showConfigModal.bind(this));
            
            $('#com-chilipeppr-widget-grbl  .btn').popover({
                delay: 500,
                animation: true,
                placement: "auto",
                trigger: "hover",
                container: 'body'
            });
            
          
            
        },
        showConfigModal: function() {
            $('#grbl-config-div').empty();
            
            this.config.forEach(function(config_element,index_num) {
                
            $('#grbl-config-div').append('<div class="input-group" style="width:400px;margin-bottom:2px;"><div class="input-group-addon" style="width:40px;padding:0px 6px;">&#36;' + index_num + '</div><input class="form-control" style="height:20px;padding:0px 6px;width:100px;" id="com-chilipeppr-widget-grbl-config-' + index_num +'" value="' + config_element[0] + '"/><span style="margin-left:10px;">' + config_element[1] + '</span></div>');},this);

            $('#grbl-config-div').append('<br/><button class="btn btn-xs btn-default save-config">Save Settings To GRBL</button>');
            $('.save-config').click(this.saveConfigModal.bind(this));
            $('#com-chilipeppr-widget-grbl-modal').modal('show');
        },
        hideConfigModal: function() {
            $('#com-chilipeppr-widget-grbl-modal').modal('hide');
        },
        saveConfigModal: function() {
            console.log("GRBL: Save Settings");

            this.config.forEach(function(config_element,index_num){
                var command = '&#36;' + index_num + '=' + $('#com-chilipeppr-widget-grbl-config-' + index_num).val() + '\n';
                this.config[index_num][0] = $('#com-chilipeppr-widget-grbl-config-' + index_num).val();
                this.sendCode(command);
            },this);
            console.log(this.config);
            return true;
        },
        updateWorkUnits: function(units){
            if(units==="mm")
                this.work_mode = 0;
            else if(units==="inch")
                this.work_mode = 1;
            console.log("GRBL: Updated Work Units - " + this.work_mode);
            //update report units if they have changed
            this.updateReportUnits();
        },
        updateReportUnits: function(){
            if(this.config[13] !== undefined){
                if(this.config[13][0] === 0)
                    this.report_mode = 0;
                else if(this.config[13][0] === 1)
                    this.report_mode = 1;
            }
            console.log("GRBL: Updated Report Units - " + this.report_mode);
        },
        //formerly queryControllerForStatus
        openController: function(isWithDelay) {
            var that = this;
            
            //wait three second for arduino initialization before requesting the grbl config variables.
            setTimeout(function() {
                chilipeppr.publish("/com-chilipeppr-widget-serialport/requestSingleSelectPort",""); //Request port info
                if(that.version === "")
                that.sendCode("*init*\n"); //send request for grbl init line (grbl was already connected to spjs when chilipeppr loaded and no init was sent back.
                that.sendCode("*status*\n"); //send request for initial status response.
                that.sendCode("$$\n"); //get grbl params
                //wait one additional second before checking for what reporting units grbl is configured for.
                setTimeout(function() {
                    that.updateReportUnits();
                }, 1000);


                //// that.restartStatusInterval();  //Start the $G tracking loop
                
                //that.g_status_reports = setInterval(function(){
                //    that.getControllerInfo(); //send a $G every 2 seconds
                //}, 2000);
            }, 3000);
        },
        closeController: function(isWithDelay) {
            $("#grbl-buffer-warning").show();
            $('#grbl-status-info-div').hide();
            clearInterval(this.g_status_reports);
            this.config = [];
            this.buffer_name = "";
            this.report_mode = 0;
            this.work_mode = 0;
            this.status = "Offline";
            chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/status',this.status);
            $('.com-chilipeppr-grbl-state').text(this.status);
            this.version = "";
            $('#com-chilipeppr-widget-grbl .panel-title').text("GRBL");
            this.offsets = {"x": 0.000, "y": 0.000, "z": 0.000};
            this.last_machine= {"x":0.000, "y": 0.000, "z": 0.000};
            this.last_work = {"x":0.000, "y": 0.000, "z": 0.000};
            this.publishAxisStatus({"posx":0.000, "posy":0.000,"posz":0.000});
        },
        getControllerInfo: function(){
          return false;
            var json = {
                D: "$G\n",
                Id: "status"
            };
            if(!this.alarm) //only send if we're not in an alarm state.
                chilipeppr.publish("/com-chilipeppr-widget-serialport/jsonSend", json);
        },
        trackGcodeLines: function(){
          
            if(this.g_status_reports !== null){
                clearInterval(this.g_status_reports);
                this.g_status_reports = null; //clear status report interval flag
            }
            //this was causing problems for users - removed until I could figure out a better method of $G during gcode streaming.
            /*chilipeppr.subscribe("/com-chilipeppr-widget-serialport/jsonSend", this, function(msg){
                if(msg.Id.slice(1) % 5 === 0)
                    this.getControllerInfo(); //send a $G every 5 lines of the gcode file.
            });*/
        },
        restartStatusInterval: function(){
            //stop tracking the jsonSend, file is finished.
            //chilipeppr.unsubscribe("/com-chilipeppr-widget-serialport/jsonSend", this.trackGcodeLines);
            return false;
            
            var that = this;
            if(this.g_status_reports === null){ //confirm no setInterval is currently running.
                that.g_status_reports = setInterval(function(){
                    if(that.q_count === 0) //only send $G if the queue is clear
                        that.getControllerInfo(); //send a $G every 2 seconds
                }, 2000);
            }
        },
        
          grblResponseV1: function(recvline) {

            if (!(recvline.dataline) || recvline.dataline=='\n' || recvline.dataline.indexOf("ok") >= 0) {
                //console.log("GRBL: got recvline but it's not a dataline, so returning.");
                return true;
            }

              
          //   console.log("GRBL WIDGET: received 1.1 line");

            
            var pushMessages = {
                status: new RegExp("^\\<(.*?)\\>", "i"),
                gCodeState: new RegExp("^\\[GC:(.*?)\\]", "i"),
                welcome: new RegExp("^Grbl (.*?) .*?", "i"),
                alarm: new RegExp("^ALARM:([0-9]+)", "i"),
                error: new RegExp("^error:([0-9]+)", "i"),
                setting: new RegExp("^\\$([0-9]+)=([0-9.]+)", "i"),
                message: new RegExp("^\\[MSG:(.*?)\\]", "i"),
                helpMessage: new RegExp("^\\[HLP:(.*?)\\]", "i"),
                hashQuery: new RegExp("^\\[(G54|G55|G56|G57|G58|G59|G28|G92|TLO|PRB):(.*?)\\]", "i"),
                version: new RegExp("^\\[VER:(.*?)\\]", "i"),
                options: new RegExp("^\\[OPT:(.*?)\\]", "i"),
                startupLineExecution: new RegExp("^\\>(.*?):(.*?)", "i")
            };

            var errorMessages = [
                "", //dummy
                "G-code words consist of a letter and a value. Letter was not found.",
                "Numeric value format is not valid or missing an expected value",
                "Grbl '&#36;' system command was not recognized or supported.",
                "Negative value received for an expected positive value.",
                "Homing cycle is not enabled via settings.",
                "Minimum step pulse time must be greater than 3usec",
                "EEPROM read failed. Reset and restored to default values.",
                "Grbl '&#36;' command cannot be used unless Grbl is IDLE. Ensures smooth operation during a job.",
                "G-code locked out during alarm or jog state",
                "Soft limits cannot be enabled without homing also enabled.",
                "Max characters per line exceeded. Line was not processed and executed.",
                "(Compile Option) Grbl '&#36;' setting value exceeds the maximum step rate supported.",
                "Safety door detected as opened and door state initiated.",
                "(Grbl-Mega Only) Build info or startup line exceeded EEPROM line length limit.",
                "Jog target exceeds machine travel. Command ignored.",
                "Jog command with no '=' or contains prohibited g-code.",
                "Unsupported or invalid g-code command found in block.",
                "More than one g-code command from same modal group found in block.",
                "Feed rate has not yet been set or is undefined.",
                "G-code command in block requires an integer value.",
                "Two G-code commands that both require the use of the XYZ axis words were detected in the block.",
                "A G-code word was repeated in the block.",
                "A G-code command implicitly or explicitly requires XYZ axis words in the block, but none were detected.",
                "N line number value is not within the valid range of 1 - 9,999,999.",
                "A G-code command was sent, but is missing some required P or L value words in the line.",
                "Grbl supports six work coordinate systems G54-G59. G59.1, G59.2, and G59.3 are not supported.",
                "The G53 G-code command requires either a G0 seek or G1 feed motion mode to be active. A different motion was active.",
                "There are unused axis words in the block and G80 motion mode cancel is active.",
                "A G2 or G3 arc was commanded but there are no XYZ axis words in the selected plane to trace the arc.",
                "The motion command has an invalid target. G2, G3, and G38.2 generates this error, if the arc is impossible to generate or if the probe target is the current position.",
                "A G2 or G3 arc, traced with the radius definition, had a mathematical error when computing the arc geometry. Try either breaking up the arc into semi-circles or quadrants, or redefine them with the arc offset definition.",
                "A G2 or G3 arc, traced with the offset definition, is missing the IJK offset word in the selected plane to trace the arc.",
                "There are unused, leftover G-code words that aren't used by any command in the block.",
                "The G43.1 dynamic tool length offset command cannot apply an offset to an axis other than its configured axis. The Grbl default axis is the Z-axis."
            ];

            var alarmCodes = [
                "", //dummy",
                "Hard limit triggered. Machine position is likely lost due to sudden and immediate halt. Re-homing is highly recommended.",
                "G-code motion target exceeds machine travel. Machine position safely retained. Alarm may be unlocked.",
                "Reset while in motion. Grbl cannot guarantee position. Lost steps are likely. Re-homing is highly recommended.",
                "Probe fail. The probe is not in the expected initial state before starting probe cycle, where G38.2 and G38.3 is not triggered and G38.4 and G38.5 is triggered.",
                "Probe fail. Probe did not contact the workpiece within the programmed travel for G38.2 and G38.4.",
                "Homing fail. Reset during active homing cycle.",
                "Homing fail. Safety door was opened during active homing cycle.",
                "Homing fail. Cycle failed to clear limit switch when pulling off. Try increasing pull-off setting or check wiring.",
                "Homing fail. Could not find limit switch within search distance. Defined as 1.5 * max_travel on search and 5 * pulloff on locate phases."
            ];

            var optionCodes = {
                V: "Variable spindle enabled",
                N: "Line numbers enabled",
                M: "Mist coolant enabled",
                C: "CoreXY enabled",
                P: "Parking motion enabled",
                Z: "Homing force origin enabled",
                H: "Homing single axis enabled",
                L: "Two limit switches on axis enabled",
                A: "Allow feed rate overrides in probe cycles",
                '*': "Restore all EEPROM disabled",
                $ : "Restore EEPROM $ settings disabled",
                '#': "Restore EEPROM parameter data disabled",
                I: "Build info write user string disabled",
                E: "Force sync upon EEPROM write disabled",
                W: "Force sync upon work coordinate offset change disabled"
            };

            var subStates = {
                "Hold:0": "Hold complete. Ready to resume.",
                "Hold:1": "Hold in-progress. Reset will throw an alarm.",
                "Door:0": "Door closed. Ready to resume.",
                "Door:1": "Machine stopped. Door still ajar. Can't resume until closed.",
                "Door:2": "Door opened. Hold (or parking retract) in-progress. Reset will throw an alarm.",
                "Door:3": "Door closed and resuming. Restoring from park, if applicable. Reset will throw an alarm."
            };

            var configStrings = {
                "0": "Step pulse time, microseconds",
                "1": "Step idle delay, milliseconds",
                "2": "Step pulse invert, mask",
                "3": "Step direction invert, mask",
                "4": "Invert step enable pin, boolean",
                "5": "Invert limit pins, boolean",
                "6": "Invert probe pin, boolean",
                "10": "Status report options, mask",
                "11": "Junction deviation, millimeters",
                "12": "Arc tolerance, millimeters",
                "13": "Report in inches, boolean",
                "20": "Soft limits enable, boolean",
                "21": "Hard limits enable, boolean",
                "22": "Homing cycle enable, boolean",
                "23": "Homing direction invert, mask",
                "24": "Homing locate feed rate, mm/min",
                "25": "Homing search seek rate, mm/min",
                "26": "Homing switch debounce delay, milliseconds",
                "27": "Homing switch pull-off distance, millimeters",
                "30": "Maximum spindle speed, RPM",
                "31": "Minimum spindle speed, RPM",
                "32": "Laser-mode enable, boolean",
                "100": "X-axis steps per millimeter",
                "101": "Y-axis steps per millimeter",
                "102": "Z-axis steps per millimeter",
                "110": "X-axis maximum rate, mm/min",
                "111": "Y-axis maximum rate, mm/min",
                "112": "Z-axis maximum rate, mm/min",
                "120": "X-axis acceleration, mm/sec^2",
                "121": "Y-axis acceleration, mm/sec^2",
                "122": "Z-axis acceleration, mm/sec^2",
                "130": "X-axis maximum travel, millimeters",
                "131": "Y-axis maximum travel, millimeters",
                "132": "Z-axis maximum travel, millimeters"
            };

            var msg = recvline.dataline;
            var parsing = true;
            var key = [];
            var result = "";

            msg = msg.replace(/\n/g, ""); 
            
            $.each(pushMessages, function(k, v) {
              
                var res = v.exec(msg);
                if (res){      
                	key = k;
                  result = res;
                }	
							});
            
                switch (key) {
                    case 'status':
                        //we need the bits
                        var fields = result[1].split("|");
                        //0 is the machine stat
                        var status = new RegExp("(Idle|Run|Hold|Jog|Alarm|Door|Check|Sleep)", "i");
                        if (status.exec(fields[0])) {
                            if (fields[0].indexOf('Hold:') >= 0 || fields[0].indexOf('Door:') >= 0) {
                                this.status = subStates[fields[0]];
                            }
                            else {
                                this.status = fields[0];
                            }
                        }
                        else {
                            this.status = 'Offline';
                        }

                        if (this.status == 'Alarm'){
                            $('#com-chilipeppr-widget-grbl .grbl-unlock').addClass("btn-danger");
                        }

                        $('.stat-state').html(this.status); //Update UI

                        
                        
                        var receivedMachineCoords = false;
                        var receivedWorkCoords = false;
                        for (var i = 1; i < fields.length; i++) {
                            var bit = fields[i].split(":");
                            switch (bit[0].toLowerCase()) {
                                case "mpos":
                                    var coords = bit[1].split(',');
                                    this.last_machine.x = parseFloat(coords[0]).toFixed(3);
                                    this.last_machine.y = parseFloat(coords[1]).toFixed(3);
                                    this.last_machine.z = parseFloat(coords[2]).toFixed(3);
                                    receivedMachineCoords = true;
                                    $('.stat-mcoords').html("X:" + this.last_machine.x + " Y:" + this.last_machine.y + " Z:" + this.last_machine.z);
                                    
                                    break;
                                case "wpos":
                                    var coords = bit[1].split(',');
                                    this.last_work.x = parseFloat(coords[0]);
                                    this.last_work.y = parseFloat(coords[1]);
                                    this.last_work.z = parseFloat(coords[2]);
                                    receivedWorkCoords = true;
                                    break;
                                case "wco":
                                    var offset = bit[1].split(',');
                                    this.offsets.x = parseFloat(offset[0]);
                                    this.offsets.y = parseFloat(offset[1]);
                                    this.offsets.z = parseFloat(offset[2]);
                                    
                                    break;
                                case "bf":
                                    break;
                                case "ln":
                                    break;
                                case "f":
                                    break;
                                case "fs":
                                      // FS:500,8000 contains real-time feed rate, followed by spindle speed, data as the values. 
                                      // Note the FS:, rather than F:, data type name indicates spindle speed data is included.
                                      var fs = bit[1].split(',');
                                      $(".stat-feedrate").html(fs[0]);
                                      $(".stat-spindle").html(fs[1]);
                                
                                    break;
                                case "pn":
                                      // X Y Z XYZ limit pins, respectively
                                      // P the probe pin.
                                      // D H R S the door, hold, soft-reset, and cycle-start pins, respectively.
                                      

                                      
                                    break;
                                case "ov":
                                      // Ov:100,100,100 indicates current override values in percent 
                                      // of programmed values for feed, rapids, and spindle speed, respectively.
                                      var ov = bit[1].split(',');
                                    
                                      $(".ov-1").html(ov[0]);
                                      $(".ov-2").html(ov[1]);
                                      $(".ov-3").html(ov[2]);
                                      
                                    break;
                                case "a":
                                    break;
                            }
                        }

                        
                        //end of status
                        if (receivedMachineCoords && !receivedWorkCoords) {
                            this.last_work.x = this.last_machine.x - this.offsets.x;
                            this.last_work.y = this.last_machine.y - this.offsets.y;
                            this.last_work.z = this.last_machine.z - this.offsets.z;
                          //   $(".stat-wcs").html("G92");
                        }
                        else if (!receivedMachineCoords && receivedWorkCoords) {
                            this.last_machine.x = this.last_work.x + this.offsets.x;
                            this.last_machine.y = this.last_work.y + this.offsets.y;
                            this.last_machine.z = this.last_work.z + this.offsets.z;
                            // $(".stat-wcs").html("G54");
                        }

                        //UI updates
                  			//chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/status', this.status);
												
                        
                        //send axis updates
                        if (this.work_mode === this.report_mode) {
                            this.publishAxisStatus({
                                "x": parseFloat(this.last_work.x).toFixed(3),
                                "y": parseFloat(this.last_work.y).toFixed(3),
                                "z": parseFloat(this.last_work.z).toFixed(3)
                            });
                            
                          //   this.publishAxisStatus(this.last_machine);
  
                        }
                        else if (this.work_mode === 1 && this.report_mode === 0) { //work is inch, reporting in mm
                            this.publishAxisStatus({
                                "x": this.toInch(parseFloat(this.last_work.x)),
                                "y": this.toInch(parseFloat(this.last_work.y)),
                                "z": this.toInch(parseFloat(this.last_work.z))
                            });
                        }
                        else if (this.work_mode === 0 && this.report_mode === 1) { //work is mm, reporting in inch
                            this.publishAxisStatus({
                                "x": this.toMM(parseFloat(this.last_work.x)),
                                "y": this.toMM(parseFloat(this.last_work.y)),
                                "z": this.toMM(parseFloat(this.last_work.z))
                            });
                        }
                        break;
                    case 'gCodeState':
                        break;
                    case 'welcome':
                        
                        if (this.version !== "") {
                            chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "GRBL has been reset - temporary work coordinate and tool offsets have been lost.");
                        }
                        this.version = result[1];
                        $('#com-chilipeppr-widget-grbl .panel-title').html("GRBL (" + this.version + ")"); //update ui
                        break;
                    case 'alarm':
                        
                        chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", alarmCodes[parseInt(result[1])]);
                        if (parseInt(result[1], 10) == 4 || parseInt(result[1], 10) == 5) {
                            chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/proberesponse", "alarm");
                        }
                        $('#com-chilipeppr-widget-grbl .grbl-unlock').addClass("btn-danger");
                        this.alarm = true;
                        // this.restartStatusInterval();

                        chilipeppr.publish("/com-chilipeppr-widget-gcode/stop", true); //stops gcode widget since grbl just reset.
                        this.clearBuffer();
                        
                        if(this.alarm !== true && this.status === "Alarm"){
                                this.alarm = true;
                                $('.stat-state').text("Alarm - Click To Reset (CTRL+X)");
                                var that = this;
                                $('.stat-state').click(function(){
                                    that.sendCode(String.fromCharCode(24));
                                });
                                $(".stat-state").hover(function() {
                                    $(this).css('cursor','pointer');
                                }, function() {
                                    $(this).css('cursor','auto');
                                });
                                $('#stat-state-background-box').css('background-color', 'pink');
                            }
                            if(this.alarm !== true || this.status !== "Alarm"){
                                this.alarm = false;
                                $('.stat-state').unbind("click");
                                $('.stat-state').text(this.status.charAt(0).toUpperCase() + this.status.slice(1)); //Update UI
                                $('#stat-state-background-box').css('background-color', '#f5f5f5');
                            }
                        
                        
                        
                        break;
                    case 'error':
                      var errorNum = parseInt(result[1]);
                        chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", errorMessages[errorNum]);
                        //should we stop now?
                        break;
                    case 'setting':
                        var cfg_id = parseInt(result[1]);
                        var cfg_val = parseFloat(result[2]);

                        console.log("CFG SETTINGS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! "+ cfg_id +" "+ cfg_val );
                        this.config[cfg_id] = [cfg_val, configStrings[cfg_id]]; //save config value and description
                        if (cfg_id == 13){
                          var units = cfg_val == 0 ? 'mm' : 'inches' ;
                            $('.stat-units').html(  units );
                        }
                        
                        
                        break;
                    case 'message':
                        //not all messages are implemented
                        switch (result[1]) {
                            case "Reset to continue":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "Reset is required before Grbl accepts any other commands.");
                                break;
                            case "Enabled":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "GRBL is now in passive gcode checking mode.");
                                break;
                            case "Disabled":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "GRBL is now in active run mode.");
                                break;
                            case "Check Door":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "Safety door is open.");
                                break;
                            case "Check Limits":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "Limit switch triggered.");
                                break;
                            case "Pgm End":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "Program ended, gCode modes restored to defaults.");
                                break;
                            case "Sleeping":
                                chilipeppr.publish("/com-chilipeppr-elem-flashmsg/flashmsg", "GRBL Widget", "Sleeping.");
                                break;
                        }
                        break;
                    case 'helpMessage':
                        //not a very helpful response.  so ignore
                        break;
                    case 'hashQuery':
                        if (result[1] == 'PRB') {
                            var bits = result[2].split(':');
                            var probeSuccess = parseInt(bits[1]);
                            var coords = bits[0].split(',');
                            if (this.work_mode === this.report_mode) {
                                chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/proberesponse", {
                                    "x": parseFloat(coords[0]).toFixed(3) - this.offsets.x,
                                    "y": parseFloat(coords[1]).toFixed(3) - this.offsets.y,
                                    "z": parseFloat(coords[2]).toFixed(3) - this.offsets.z,
                                    status: probeSuccess
                                });
                            }
                            else if (this.work_mode === 1 && this.report_mode === 0) { //work is inch, reporting in mm
                                chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/proberesponse", {
                                    "x": this.toInch(parseFloat(coords[0]) - this.offsets.x),
                                    "y": this.toInch(parseFloat(coords[1]) - this.offsets.y),
                                    "z": this.toInch(parseFloat(coords[2]) - this.offsets.z),
                                    status: probeSuccess
                                });
                            }
                            else if (this.work_mode === 0 && this.report_mode === 1) { //work is mm, reporting in inches
                                chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/proberesponse", {
                                    "x": this.toMM(parseFloat(coords[0]) - this.offsets.x),
                                    "y": this.toMM(parseFloat(coords[1]) - this.offsets.y),
                                    "z": this.toMM(parseFloat(coords[2]) - this.offsets.z),
                                    status: probeSuccess
                                });
                            }
                        }
                        break;
                    case 'version':
                        this.version = result[1];
                        break;
                    case 'options':
                        var opt;
                        var tmp = new Array;
                        this.compileOptions = "";
                        for (var i = 0; i < result[1].length; i++) {
                            opt = result[1].substr(i, 1);
                            if (configStrings[opt]) {
                                tmp.push(configStrings[opt]);
                            }
                        }
                        this.compileOptions = tmp.join("\n");

                        
                        break;
                    case 'startupLineExecution':
                        //ignore
                        break;
                }
          

        },
        
        
        
        
        sendCode: function (sendline){
            //chilipeppr.unsubscribe("/com-chilipeppr-widget-serialport/send", this, this.bufferPush); //unsubscribe before publishing to serial port
            chilipeppr.publish("/com-chilipeppr-widget-serialport/send", sendline); //send to serial port 
            // console.log("GRBL: Code Sent - " + sendline);
            //chilipeppr.subscribe("/com-chilipeppr-widget-serialport/send", this, this.bufferPush, 1); //resubscribe with top priority
        },
        
        clearBuffer: function(){
            console.log("GRBL: Clearing SPJS Buffer");
            this.sendCode("%\n");
        },
        
        //queryStatus: function(that){
        //    that.sendCode('?\n'); //request status/coordinates
        //},
        publishAxisStatus: function(axes) {
            chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/axes", axes);
        },
        plannerLastEvent: "resume",
        publishPlannerPause: function() {
            // tell other widgets to pause their sending because we're too far into
            // filling up the planner buffer
            this.plannerLastEvent = "pause";
            chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/plannerpause", "");
        },
        publishPlannerResume: function() {
            // tell other widgets they can send again
            this.plannerLastEvent = "resume";
            chilipeppr.publish("/com-chilipeppr-interface-cnccontroller/plannerresume", "");
        },
        toInch: function(mm){
            return (mm/25.4).toFixed(3);  
        },
        toMM: function(inch){
            return (inch*25.4).toFixed(3);   
        },
        addError: function(line, msg){
            if(this.err_log.length === 0)
                i = 0;
            else
                i = this.err_log.length - 1;
            //save error in log array
            this.err_log[i] = line.toString() + " - " + msg;
        },
        forkSetup: function () {
            var topCssSelector = '#com-chilipeppr-widget-grbl';
            
            //$(topCssSelector + ' .fork').prop('href', this.fiddleurl);
            //$(topCssSelector + ' .standalone').prop('href', this.url);
            //$(topCssSelector + ' .fork-name').html(this.id);
            $(topCssSelector + ' .panel-title').popover({
                title: this.name,
                content: this.desc,
                html: true,
                delay: 200,
                animation: true,
                trigger: 'hover',
                placement: 'auto'
            });
            
            var that = this;
            
            chilipeppr.load("http://fiddle.jshell.net/chilipeppr/zMbL9/show/light/", function () {
                require(['inline:com-chilipeppr-elem-pubsubviewer'], function (pubsubviewer) {
                    pubsubviewer.attachTo($('#com-chilipeppr-widget-grbl .panel-heading .dropdown-menu'), that);
                });
            });
            
        },
        uiHover: function(){
            //units
            $("#ttl-units").attr("data-delay", "500");
            $("#ttl-units").attr("data-animation","true");
            $("#ttl-units").attr("data-placement","auto");
            $("#ttl-units").attr("data-container","body");
            $("#ttl-units").attr("data-trigger","hover");
            $("#ttl-units").attr("data-toggle","popover");
            $("#ttl-units").attr("data-title","Units");
            $("#ttl-units").attr("data-content","The active distance mode which the CNC will move - Can be Inches (G20) or Millimetres (G21)");
            $("#ttl-units").popover();
            
            //state
            $("#ttl-state").attr("data-delay", "500");
            $("#ttl-state").attr("data-animation","true");
            $("#ttl-state").attr("data-placement","auto");
            $("#ttl-state").attr("data-container","body");
            $("#ttl-state").attr("data-trigger","hover");
            $("#ttl-state").attr("data-toggle","popover");
            $("#ttl-state").attr("data-title","State");
            $("#ttl-state").attr("data-content","Current state of the GRBL controller");
            $("#ttl-state").popover();
            
            //wcs
            $("#ttl-wcs").attr("data-delay", "500");
            $("#ttl-wcs").attr("data-animation","true");
            $("#ttl-wcs").attr("data-placement","auto");
            $("#ttl-wcs").attr("data-container","body");
            $("#ttl-wcs").attr("data-trigger","hover");
            $("#ttl-wcs").attr("data-toggle","popover");
            $("#ttl-wcs").attr("data-title","Work Coordinate System");
            $("#ttl-wcs").attr("data-content","The current work coordinate offsets being applied to the machine coordinates");
            $("#ttl-wcs").popover();
            
            //coolant
            $("#ttl-coolant").attr("data-delay", "500");
            $("#ttl-coolant").attr("data-animation","true");
            $("#ttl-coolant").attr("data-placement","auto");
            $("#ttl-coolant").attr("data-container","body");
            $("#ttl-coolant").attr("data-trigger","hover");
            $("#ttl-coolant").attr("data-toggle","popover");
            $("#ttl-coolant").attr("data-title","Coolant");
            $("#ttl-coolant").attr("data-content","Indicates whether cooling is currently on or off");
            $("#ttl-coolant").popover();
            
            //plane
            $("#ttl-plane").attr("data-delay", "500");
            $("#ttl-plane").attr("data-animation","true");
            $("#ttl-plane").attr("data-placement","auto");
            $("#ttl-plane").attr("data-container","body");
            $("#ttl-plane").attr("data-trigger","hover");
            $("#ttl-plane").attr("data-toggle","popover");
            $("#ttl-plane").attr("data-title","Plane");
            $("#ttl-plane").attr("data-content","The current coordinate plane on which arcs will be rendered (XY, XZ, or YZ)");
            $("#ttl-plane").popover();
            
            //feedrate
            $("#ttl-feedrate").attr("data-delay", "500");
            $("#ttl-feedrate").attr("data-animation","true");
            $("#ttl-feedrate").attr("data-placement","auto");
            $("#ttl-feedrate").attr("data-container","body");
            $("#ttl-feedrate").attr("data-trigger","hover");
            $("#ttl-feedrate").attr("data-toggle","popover");
            $("#ttl-feedrate").attr("data-title","Feedrate");
            $("#ttl-feedrate").attr("data-content","The active feedrate for G1, G2, G3 commands");
            $("#ttl-feedrate").popover();
            
            //motion
            $("#ttl-motion").attr("data-delay", "500");
            $("#ttl-motion").attr("data-animation","true");
            $("#ttl-motion").attr("data-placement","auto");
            $("#ttl-motion").attr("data-container","body");
            $("#ttl-motion").attr("data-trigger","hover");
            $("#ttl-motion").attr("data-toggle","popover");
            $("#ttl-motion").attr("data-title","Motion");
            $("#ttl-motion").attr("data-content","Indicates what type of motion GRBL performed on the last command (rapid seek motion, cutting feed motion, or probing operations)");
            $("#ttl-motion").popover();
            
            //distance
            $("#ttl-distance").attr("data-delay", "500");
            $("#ttl-distance").attr("data-animation","true");
            $("#ttl-distance").attr("data-placement","auto");
            $("#ttl-distance").attr("data-container","body");
            $("#ttl-distance").attr("data-trigger","hover");
            $("#ttl-distance").attr("data-toggle","popover");
            $("#ttl-distance").attr("data-title","Distance");
            $("#ttl-distance").attr("data-content","Indicates whether commands should use absolute positioning or relative positioning for determining distance of a command (Determined by G90 or G91 commands)");
            $("#ttl-distance").popover();
            
            //spindle
            $("#ttl-spindle").attr("data-delay", "500");
            $("#ttl-spindle").attr("data-animation","true");
            $("#ttl-spindle").attr("data-placement","auto");
            $("#ttl-spindle").attr("data-container","body");
            $("#ttl-spindle").attr("data-trigger","hover");
            $("#ttl-spindle").attr("data-toggle","popover");
            $("#ttl-spindle").attr("data-title","Spindle");
            $("#ttl-spindle").attr("data-content","Indicates whether the spindle is on or off");
            $("#ttl-spindle").popover();
            
            //queue
            $("#ttl-queue").attr("data-delay", "500");
            $("#ttl-queue").attr("data-animation","true");
            $("#ttl-queue").attr("data-placement","auto");
            $("#ttl-queue").attr("data-container","body");
            $("#ttl-queue").attr("data-trigger","hover");
            $("#ttl-queue").attr("data-toggle","popover");
            $("#ttl-queue").attr("data-title","Queue");
            $("#ttl-queue").attr("data-content","Lists the number of lines remaining to be executed in the SPJS queue");
            $("#ttl-queue").popover();
            
            //machine Coords
            $("#ttl-mcoords").attr("data-delay", "500");
            $("#ttl-mcoords").attr("data-animation","true");
            $("#ttl-mcoords").attr("data-placement","auto");
            $("#ttl-mcoords").attr("data-container","body");
            $("#ttl-mcoords").attr("data-trigger","hover");
            $("#ttl-mcoords").attr("data-toggle","popover");
            $("#ttl-mcoords").attr("data-title","Machine Coordinates");
            $("#ttl-mcoords").attr("data-content","Shows the current machine coordinates based on the machine origin.  This differs from the current work coordinates when a work coordinate offset has been applied.");
            $("#ttl-queue").popover();
        }
    };
});