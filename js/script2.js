(function(){
    if( !document.createElement("canvas").getContext ){ return; } //the canvas tag isn't supported
     
    var mainCanvas = document.getElementById("mainCanvas"); // points to the HTML canvas element above
    var mainContext = mainCanvas.getContext('2d'); //the drawing context of the canvas element
    var video = document.getElementById("video"); // points to the HTML video element
    var frameDuration = 33; // the animation's speed in milliseconds
    video.addEventListener( 'play', init ); // The init() function is called whenever the user presses play & the video starts/continues playing
    video.addEventListener( 'ended', function(){ drawStats(true); } ); //drawStats() is called one last time when the video end, to sum up all the statistics       
     
    var videoSamples; // this is an array of images, used to store all the snapshots of the playing video taken over time. These images are used to create the 'film reel'
    var backgrounds; // this is an array of images, used to store all the snapshots of the playing video taken over time. These images are used as the canvas background
    var blade; //An canvas element to store the image copied from blade.png 
    var bladeSrc = 'blade.png'; //path to the blade's image source file
     
    var lastPaintCount = 0; // stores the last value of mozPaintCount sampled
    var paintCountLog = []; // an array containing all measured values of mozPaintCount over time
    var speedLog = []; // an array containing all the execution speeds of main(), measured in milliseconds
    var fpsLog = []; // an array containing the calculated frames per secong (fps) of the script, measured by counting the calls made to main() per second
    var frameCount = 0; // counts the number of times main() is executed per second.
    var frameStartTime = 0; // the last time main() was called
     
    // Called when the video starts playing. Sets up all the javascript objects required to generate the canvas animation and measure perfomance
    function init(){ 
        if( video.currentTime > 1 ){ return; }       
 
        bladeSrc = new Image();
        bladeSrc.src = "blade.png";
        bladeSrc.onload = setBlade;
         
        backgrounds = [];           
        videoSamples = [];
        fpsLog = [];
        paintCountLog = []; 
        if( window.mozPaintCount ){ lastPaintCount = window.mozPaintCount; }
        speedLog = [];
        frameCount = 0; 
        frameStartTime = 0;
        main(); 
        setTimeout( getStats, 1000 );
    }
     
    // As the scripts main function, it controls the pace of the animation
    function main(){    
        setTimeout( main, frameDuration );
        if( video.paused || video.ended ){ return; }
         
        var now = new Date().getTime(); 
        if( frameStartTime ){ 
            speedLog.push( now - frameStartTime );
        }
        frameStartTime = now;
        if( video.readyState < 2 ){ return; }
         
        frameCount++;
        mainCanvas.width = mainCanvas.width; //clear the canvas
        drawBackground(); 
        drawFilm();
        drawDescription();
        drawStats();
        drawBlade();
        drawTitle();
    }
     
    // This function is called every second, and it calculates and stores the current frame rate
    function getStats(){
        if( video.readyState >= 2 ){
            if( window.mozPaintCount ){ //this property is specific to firefox, and tracks how many times the browser has rendered the window since the document was loaded
                paintCountLog.push( window.mozPaintCount - lastPaintCount );
                lastPaintCount = window.mozPaintCount;
            }           
             
            fpsLog.push(frameCount);
            frameCount = 0; 
        }
        setTimeout( getStats, 1000 );
    }
     
    // create blade, the ofscreen canavs that will contain the spining animation of the image copied from blade.png
    function setBlade(){
        blade = document.createElement("canvas");
        blade.width = 400;
        blade.height = 400;         
        blade.angle = 0;
        blade.x = -blade.height * 0.5;
        blade.y = mainCanvas.height/2 - blade.height/2; 
    }
             
    // Creates and returns a new image that contains a snapshot of the currently playing video.
    function sampleVideo(){
        var newCanvas = document.createElement("canvas");
        newCanvas.width = video.width;
        newCanvas.height = video.height; 
        newCanvas.getContext("2d").drawImage( video, 0, 0, video.width, video.height );
        return newCanvas;   
    }
     
    // renders the dark background for the whole canvas element. The background features a greyscale sample of the video and a gradient overlay
    function drawBackground(){
        var newCanvas = document.createElement("canvas");
        var newContext = newCanvas.getContext("2d");
        newCanvas.width = mainCanvas.width;
        newCanvas.height = mainCanvas.height; 
        newContext.drawImage(  video, 0, video.height * 0.1, video.width, video.height * 0.5, 0, 0, mainCanvas.width, mainCanvas.height  );
             
        var imageData, data;
        try{
            imageData = newContext.getImageData( 0, 0, mainCanvas.width, mainCanvas.height );
            data = imageData.data;
        } catch(error){ // CORS error (eg when viewed from a local file). Create a solid fill background instead
            newContext.fillStyle = "yellow";
            newContext.fillRect( 0, 0, mainCanvas.width, mainCanvas.height );
            imageData = mainContext.createImageData( mainCanvas.width, mainCanvas.height );
            data = imageData.data;
        }
         
        //loop through each pixel, turning its color into a shade of grey
        for( var i = 0; i < data.length; i += 4 ){
            var red = data[i]; 
            var green = data[i + 1]; 
            var blue = data[i + 2]; 
            var grey = Math.max( red, green, blue );
             
            data[i] =  grey;
            data[i+1] = grey;
            data[i+2] = grey;
        }
        newContext.putImageData( imageData, 0, 0 );
         
        //add the gradient overlay
        var gradient = newContext.createLinearGradient( mainCanvas.width/2, 0, mainCanvas.width/2, mainCanvas.height );
        gradient.addColorStop( 0, '#000' );
        gradient.addColorStop( 0.2, '#000' );
        gradient.addColorStop( 1, "rgba(0,0,0,0.5)" );
        newContext.fillStyle = gradient;
        newContext.fillRect( 0, 0, mainCanvas.width, mainCanvas.height );
         
        mainContext.save();
        mainContext.drawImage( newCanvas, 0, 0, mainCanvas.width, mainCanvas.height );
         
        mainContext.restore();
    }
     
    // renders the 'film reel' animation that scrolls across the canvas
    function drawFilm(){
        var sampleWidth = 116; // the width of a sampled video frame, when painted on the canvas as part of a 'film reel'
        var sampleHeight = 80; // the height of a sampled video frame, when painted on the canvas as part of a 'film reel'
        var filmSpeed = 20; // determines how fast the 'film reel' scrolls across the generated canvas animation.
        var filmTop = 120; //the y co-ordinate of the 'film reel' animation
        var filmAngle = -10 * Math.PI / 180; //the slant of the 'film reel'
        var filmRight = ( videoSamples.length > 0 )? videoSamples[0].x + videoSamples.length * sampleWidth : mainCanvas.width; //the right edge of the 'film reel' in pixels, relative to the canvas     
         
        //here, we check if the first frame of the 'film reel' has scrolled out of view 
        if( videoSamples.length > 0 ){
            var bottomLeftX = videoSamples[0].x + sampleWidth;
            var bottomLeftY = filmTop + sampleHeight;
            bottomLeftX = Math.floor( Math.cos(filmAngle) * bottomLeftX - Math.sin(filmAngle) * bottomLeftY ); // the final display position after rotation
             
            if( bottomLeftX < 0 ){ //the frame is offscreen, remove it's refference from the film array
                videoSamples.shift();           
            }           
        }           
         
        // add new frames to the reel as required
        while( filmRight <= mainCanvas.width ){
            var newFrame = {};
            newFrame.x = filmRight;
            newFrame.canvas = sampleVideo();
            videoSamples.push(newFrame);            
            filmRight += sampleWidth;           
        }
         
        // create the gradient fill for the reel
        var gradient = mainContext.createLinearGradient( 0, 0, mainCanvas.width, mainCanvas.height );
        gradient.addColorStop( 0, '#0D0D0D' );
        gradient.addColorStop( 0.25, '#300A02' );
        gradient.addColorStop( 0.5, '#AF5A00' );
        gradient.addColorStop( 0.75, '#300A02' );
        gradient.addColorStop( 1, '#0D0D0D' );          
             
        mainContext.save();
        mainContext.globalAlpha = 0.9;
        mainContext.fillStyle = gradient;           
        mainContext.rotate(filmAngle);
         
        // loops through all items of film array, using the stored co-ordinate values of each to draw part of the 'film reel'
        for( var i in videoSamples ){
            var sample = videoSamples[i];               
            var punchX, punchY, punchWidth = 4, punchHeight = 6, punchInterval = 11.5;
             
            //draws the main rectangular box of the sample
            mainContext.beginPath();
            mainContext.moveTo( sample.x, filmTop );
            mainContext.lineTo( sample.x + sampleWidth, filmTop );
            mainContext.lineTo( sample.x + sampleWidth, filmTop + sampleHeight );
            mainContext.lineTo( sample.x, filmTop + sampleHeight );
            mainContext.closePath();                
             
            //adds the small holes lining the top and bottom edges of the 'fim reel'
            for( var j = 0; j < 10; j++ ){
                punchX = sample.x + ( j * punchInterval ) + 5;
                punchY = filmTop + 4;
                mainContext.moveTo( punchX, punchY + punchHeight );
                mainContext.lineTo( punchX + punchWidth, punchY + punchHeight );
                mainContext.lineTo( punchX + punchWidth, punchY );              
                mainContext.lineTo( punchX, punchY );
                mainContext.closePath();
                punchX = sample.x + ( j * punchInterval ) + 5;
                punchY = filmTop + 70;
                mainContext.moveTo( punchX, punchY + punchHeight );
                mainContext.lineTo( punchX + punchWidth, punchY + punchHeight );
                mainContext.lineTo( punchX + punchWidth, punchY );              
                mainContext.lineTo( punchX, punchY );
                mainContext.closePath();
            } 
            mainContext.fill();         
        }       
         
        //loop through all items of videoSamples array, update the x co-ordinate values of each item, and draw its stored image onto the canvas
        mainContext.globalCompositeOperation = 'lighter';
        for( var i in videoSamples ){
            var sample = videoSamples[i];
            sample.x -= filmSpeed;  
            mainContext.drawImage( sample.canvas, sample.x + 5, filmTop + 10, 110, 62 );            
        }
         
        mainContext.restore();          
    }
     
    // renders the canvas title
    function drawTitle(){
        mainContext.save();
        mainContext.fillStyle = 'black';
        mainContext.fillRect( 0, 0, 368, 25 ); 
        mainContext.fillStyle = 'white';
        mainContext.font = "bold 21px Georgia";
        mainContext.fillText( "SINTEL", 10, 20 );   
        mainContext.restore();
    }
     
    // renders all the text appearing at the top left corner of the canvas
    function drawDescription(){     
        var text = []; //stores all text items, to be displayed over time. the video is 60 seconds, and each will be visible for 10 seconds.
        text[0] = "Sintel is an independently produced short film, initiated by the Blender Foundation.";
        text[1] = "For over a year an international team of 3D animators and artists worked in the studio of the Amsterdam Blender Institute on the computer-animated short 'Sintel'.";
        text[2] = "It is an epic short film that takes place in a fantasy world, where a girl befriends a baby dragon.";
        text[3] = "After the little dragon is taken from her violently, she undertakes a long journey that leads her to a dramatic confrontation.";
        text[4] = "The script was inspired by a number of story suggestions by Martin Lodewijk around a Cinderella character (Cinder in Dutch is 'Sintel'). ";
        text[5] = "Screenwriter Esther Wouda then worked with director Colin Levy to create a script with multiple layers, with strong characterization and dramatic impact as central goals.";         
        text = text[Math.floor( video.currentTime / 10 )]; //use the videos current time to determine which text item to display.  
         
        mainContext.save();
        var alpha = 1 - ( video.currentTime % 10 ) / 10;
        mainContext.globalAlpha = ( alpha < 5 )? alpha : 1;
        mainContext.fillStyle = '#fff';
        mainContext.font = "normal 12px Georgia";
         
        //break the text up into several lines as required, and write each line on the canvas
        text = text.split(' ');
        var colWidth = mainCanvas.width * .75;
        var line = '';
        var y = 40;
        for(var i in text ){
            line += text[i] + ' ';
            if( mainContext.measureText(line).width > colWidth ){
                mainContext.fillText( line, 10, y ); 
                line = '';
                y += 12;                
            }           
        }
        mainContext.fillText( line, 10, y ); 
         
        mainContext.restore();
    }
     
    //updates the bottom-right potion of the canvas with the latest perfomance statistics
    function drawStats( average ){          
        var x = 245.5, y = 130.5, graphScale = 0.25;
         
        mainContext.save();
        mainContext.font = "normal 10px monospace";
        mainContext.textAlign = 'left';
        mainContext.textBaseLine = 'top';
        mainContext.fillStyle = 'black';
        mainContext.fillRect( x, y, 120, 75 );          
         
        //draw the x and y axis lines of the graph
        y += 30;    
        x += 10;            
        mainContext.beginPath();
        mainContext.strokeStyle = '#888';
        mainContext.lineWidth = 1.5;
        mainContext.moveTo( x, y );
        mainContext.lineTo( x + 100, y );
        mainContext.stroke();
        mainContext.moveTo( x, y );
        mainContext.lineTo( x, y - 25 );
        mainContext.stroke();           
         
        // draw the last 50 speedLog entries on the graph
        mainContext.strokeStyle = '#00ffff';
        mainContext.fillStyle = '#00ffff';
        mainContext.lineWidth = 0.3;
        var imax = speedLog.length;
        var i = ( speedLog.length > 50 )? speedLog.length - 50 : 0
        mainContext.beginPath();                
        for( var j = 0; i < imax; i++, j += 2 ){             
            mainContext.moveTo( x + j, y );
            mainContext.lineTo( x + j, y - speedLog[i] * graphScale );      
            mainContext.stroke();
        }
         
        // the red line, marking the desired maximum rendering time
        mainContext.beginPath();
        mainContext.strokeStyle = '#FF0000';
        mainContext.lineWidth = 1;
        var target = y - frameDuration * graphScale;                
        mainContext.moveTo( x, target );
        mainContext.lineTo( x + 100, target );      
        mainContext.stroke();
         
        // current/average speedLog items
        y += 12;
        if( average ){
            var speed = 0;
            for( i in speedLog ){ speed += speedLog[i]; }
            speed = Math.floor( speed / speedLog.length * 10) / 10;
        }else {
            speed = speedLog[speedLog.length-1];
        }
        mainContext.fillText( 'Render Time: ' + speed, x, y );
         
        // canvas fps
        mainContext.fillStyle = '#00ff00';
        y += 12;
        if( average ){
            fps = 0;
            for( i in fpsLog ){ fps += fpsLog[i]; }
            fps = Math.floor( fps / fpsLog.length * 10) / 10;
        }else {
            fps = fpsLog[fpsLog.length-1];
        }
        mainContext.fillText( ' Canvas FPS: ' + fps, x, y );
         
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
            mainContext.fillText( 'Browser FPS: ' + fps, x, y );
        }
         
        mainContext.restore();
    }
     
    //draw the spining blade that appears in the begining of the animation  
    function drawBlade(){ 
        if( !blade || blade.x > mainCanvas.width ){ return; }
        blade.x += 2.5;
        blade.angle = ( blade.angle - 45 ) % 360;
         
        //update blade, an ofscreen canvas containing the blade's image
        var angle = blade.angle * Math.PI / 180;            
        var bladeContext = blade.getContext('2d');
        blade.width = blade.width; //clear the canvas
        bladeContext.save(); 
        bladeContext.translate( 200, 200 ); 
        bladeContext.rotate(angle); 
        bladeContext.drawImage( bladeSrc, -bladeSrc.width/2, -bladeSrc.height/2 );
        bladeContext.restore();
         
        mainContext.save(); 
        mainContext.globalAlpha = 0.95;
        mainContext.drawImage( blade, blade.x, blade.y + Math.sin(angle) * 50 ); 
        mainContext.restore();
    }   
})();