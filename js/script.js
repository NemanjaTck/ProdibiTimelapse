(function(){
        if( !document.createElement("canvas").getContext ){ return; } //the canvas tag isn't supported
        //Lock FPS on 24
        requestAnimationFrame =  function( callback ){
            window.setTimeout(callback, 1000 / 24);
          }; 
        //document.addEventListener( "visibilitychange", init, false );     
        
        var mainCanvas = document.getElementById("mainCanvas"); // points to the on-screen, original HTML canvas element
        var mainContext = mainCanvas.getContext('2d'); // the drawing context of the on-screen canvas element 
        var osCanvas = document.createElement("canvas"); // creates a new off-screen canvas element
        var osContext = osCanvas.getContext('2d'); //the drawing context of the off-screen canvas element
        osCanvas.width = mainCanvas.width; // match the off-screen canvas dimensions with that of #mainCanvas
        osCanvas.height = mainCanvas.height; 
        var frameDuration = 33; // the animation's speed in milliseconds

        // Help variables for the image objects
        var tempImage;  
        var imageArray = new Array();
        var cancelAnim = "";
        var imageCount = 0;

        // Get the button
        var startBtn = document.getElementById('startBtn');
        
        
        // Stats and Firefox variables
        var lastPaintCount = 0; // stores the last value of mozPaintCount sampled
        var paintCountLog = []; // an array containing all measured values of mozPaintCount over time
        var speedLog = []; // an array containing all the execution speeds of main(), measured in milliseconds
        var fpsLog = []; // an array containing the calculated frames per secong (fps) of the script, measured by counting the calls made to main() per second
        var frameCount = 0; // counts the number of times main() is executed per second.
        var frameStartTime = 0; // the last time main() was called
        
        var titleCache = false; // points to an off-screen canvas used to cache the animation scene's title 

        //****EVENT CLASS - trigering controllers****

        /*function Event(sender) {
            this._sender = sender;
            this._listeners = [];
        }

        Event.prototype = {
            attach : function (listener) {
                this._listeners.push(listener);
            },
            notify : function (args) {
                var index;

                for (index = 0; index < this._listeners.length; index += 1) {
                    this._listeners[index](this._sender, args);
                }
            }
        };*/

        //****THE MODEL****

        /*function ImageListModel (items){

            this._items = items;
            this._selectedIndex = -1;

            this.itemAdded = new Event(this);
            this.itemRemoved = new Event(this);

        }

        ImageListModel.prototype = {
            getItems: function () {
                return [].concat(this._items);
            },

            addItem: function (item) {
                this._items.push(item);
                this.itemAdded.notify({
                    item: item
                });
            },

            clearItems: function() {
                this._items.clear();
            }


            getSelectedIndex: function () {
                return this._selectedIndex;
            },

            setSelectedIndex: function (index) {
                var previousIndex;

                previousIndex = this._selectedIndex;
                this._selectedIndex = index;
                this.selectedIndexChanged.notify({
                    previous: previousIndex
                });
            }
        };
*/
        
        //Start animation

        function startAnimation(event) {
                 if(this.textContent === "Start") {
                    console.log("Entered");
                    main();
                    this.textContent = "Stop";

                 }
                 else{
                    window.cancelAnimationFrame(cancelAnim);
                    this.textContent = "Start";
                 }


        }

        startBtn.addEventListener('click', startAnimation, false);



        // Called when the video starts playing. Sets up all the javascript objects required to generate the canvas animation and measure perfomance
        function init(){ 
            

            //Setting the starting values for the variables used for stats
            resetVar();

            //Load images 
            loadImg();
            //Start main after images are loaded

            /*function trackProgress() {
                loadedImages++;
                     
                if (loadedImages == sourceArray.length) {
                    main();
                }
            }*/

            
        }

        //Reset variables

        function resetVar(){

            //Setting the starting values for the variables used for stats and image counts
            fpsLog = [];
            paintCountLog = []; 
            if( window.mozPaintCount ){ lastPaintCount = window.mozPaintCount; }
            speedLog = [];
            frameCount = 0; 
            imageCount = 0;
            frameStartTime = 0;
            setTimeout( getStats, 1000 );

        }

        //Preload images
        function loadImg(){

            var sourceArray = new Array();

            for (var i = 0; i < 114; i++){

                sourceArray.push("http://prodibiimagewe.blob.core.windows.net/timelapse/IMG_"+i+".JPG");

            }


            for (var i = 0; i < sourceArray.length; i++) {
                
                tempImage = new Image();
                //tempImage.onload = trackProgress()
                tempImage.src = sourceArray[i];
                tempImage.crossOrigin = 'anonymous';
                imageArray.push(tempImage);
                //console.log(tempImage);

            }

        }

        // Main function, controling the animation
        function main(){

            if(imageCount === imageArray.length){
                resetVar(); 
            }

            cancelAnim = requestAnimationFrame( main, mainCanvas);
            //Used for stats
            var now = new Date().getTime(); 
            
            if( frameStartTime ){ 
                speedLog.push( now - frameStartTime );
            }
            frameStartTime = now;
            
            
            frameCount++;
            
            
            //console.log("Glob ID: " +imageCount);
        
            osContext.clearRect( 0, 0, osCanvas.width, osCanvas.height ); //clear the offscreen canvas              
            drawBackground(imageCount); //draw image to offscreen canvas and then copy image data to main canvas
            drawStats();

            mainContext.drawImage( osCanvas, 0, 0 ); 

            imageCount++;
            
            
        }
        
        
        
        // Calculates and stores the current frame rate, every second
        function getStats(){
            if( startBtn.textContent === "Stop" ){
                // Firefox, tracks how many times the browser has rendered the window since the document was loaded
                if( window.mozPaintCount ){ 
                    paintCountLog.push( window.mozPaintCount - lastPaintCount );
                    lastPaintCount = window.mozPaintCount;
                }           
                
                fpsLog.push(frameCount);
                frameCount = 0; 
            }
            setTimeout( getStats, 1000 );
        }
        

        
        // Drawing to the offscreen canvas
        function drawBackground(x){
                
            console.log("Drawing image number " + x);
            osContext.save();

            imageArray[x].crossOrigin = '';
            //console.log("This is image: " + imageArray[x]);
            osContext.drawImage( imageArray[x], 0, 0 );     

            //mainContext.drawImage( osCanvas, 0, 0 ); // copy the off-screen canvas graphics to the on-screen canvas

            osContext.restore();


        }
        
        
        
        //updates the bottom-right potion of the canvas with the latest perfomance statistics
        function drawStats( average ){          
            var x = 525, y = 450, graphScale = 0.25;
            
            osContext.save();
            osContext.font = "normal 10px monospace";
            osContext.textAlign = 'left';
            osContext.textBaseLine = 'top';
            osContext.fillStyle = 'black';
            osContext.fillRect( x, y, 120, 75 );            
            
            //draw the x and y axis lines of the graph
            y += 30;    
            x += 10;            
            osContext.beginPath();
            osContext.strokeStyle = '#888';
            osContext.lineWidth = 1.5;
            osContext.moveTo( x, y );
            osContext.lineTo( x + 100, y );
            osContext.stroke();
            osContext.moveTo( x, y );
            osContext.lineTo( x, y - 25 );
            osContext.stroke();         
            
            // draw the last 50 speedLog entries on the graph
            osContext.strokeStyle = '#00ffff';
            osContext.fillStyle = '#00ffff';
            osContext.lineWidth = 0.3;
            var imax = speedLog.length;
            var i = ( speedLog.length > 50 )? speedLog.length - 50 : 0
            osContext.beginPath();              
            for( var j = 0; i < imax; i++, j += 2 ){                
                osContext.moveTo( x + j, y );
                osContext.lineTo( x + j, y - speedLog[i] * graphScale );
            }       
            osContext.stroke();
            
            // the red line, marking the desired maximum rendering time
            osContext.beginPath();
            osContext.strokeStyle = '#FF0000';
            osContext.lineWidth = 1;
            var target = y - frameDuration * graphScale;                
            osContext.moveTo( x, target );
            osContext.lineTo( x + 100, target );        
            osContext.stroke();
            
            // current/average speedLog items
            y += 12;
            if( average ){
                var speed = 0;
                for( i in speedLog ){ speed += speedLog[i]; }
                speed = Math.floor( speed / speedLog.length * 10) / 10;
            }else {
                speed = speedLog[speedLog.length-1];
            }
            osContext.fillText( 'Render Time: ' + speed, x, y );
            
            // canvas fps
            osContext.fillStyle = '#00ff00';
            y += 12;
            if( average ){
                fps = 0;
                for( i in fpsLog ){ fps += fpsLog[i]; }
                fps = Math.floor( fps / fpsLog.length * 10) / 10;
            }else {
                fps = fpsLog[fpsLog.length-1];
            }
            osContext.fillText( ' Canvas FPS: ' + fps, x, y );
            
            // browser frames per second (fps), using window.mozPaintCount (firefox only)
            if( window.mozPaintCount ){     
                y += 12;
                if( average ){
                    fps = 0;
                    for( i in paintCountLog ){ fps += paintCountLog[i]; }
                    fps = Math.floor( fps / paintCountLog.length * 10) / 10;
                }else { 
                    fps = paintCountLog[paintCountLog.length-1];    
                }
                osContext.fillText( 'Browser FPS: ' + fps, x, y );
            }
            
            osContext.restore();
        }
        window.onload = function() {
          init();
        };
        
    })();