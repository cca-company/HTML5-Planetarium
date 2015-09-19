var WebGL = {
	glCanvas : null,
    glContext : null,
    textCanvas : null,
    textContext : null,
	shaderProgram : null,
	pMatrix : null,
	mvMatrix : null,
    tMatrix : null,
	mvMatrixStack : [],
    rotX : 0,
    rotY : 0,
    rotGlobe : 0,
    locateLatitude : 38,
    locateGradient : 127,
    buffer : null,
    asterisms : [],
    data : null,
    earthBuffer : null,
    colorBuffer : null,
    bgcolor : [0.0,0.0,0.0,1.0],
	start : function(data){
    	this.glCanvas = $("#glCanvas");
        this.glContext = this.glCanvas[0].getContext("webgl") || this.glCanvas[0].getContext("experimental-webgl");

        // TODO : 텍스트 제어
        // http://webglfundamentals.org/webgl/webgl-text-html-canvas2d-arrows.html
        this.textCanvas = $("#textCanvas");
        this.textContext = this.textCanvas[0].getContext("2d");

        this.setWindow();

        this.pMatrix = mat4.create();
        this.mvMatrix = mat4.create();
        this.tMatrix = mat4.create();

		if(this.glContext){

            $(document).on("keydown", this.keyDown);

			this.initShader();
			this.setup(data);

            //this.drawScene();
		}
	},
	setup : function(data){

        // 오브젝트 초기화
        globe.init(150);

        this.data = data;

        for(var i = 0; i < this.data.length; ++i){
            this.asterisms[i] = new asterism(this.data[i]);
            this.asterisms[i].init(150);
        }


        var vertices = [
            200, -20, 200,
            200, -20, -200,
            -200, -20, -200,
            -200, -20, 200,
            200, -20, 200
        ];

        this.earthBuffer = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.earthBuffer);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(vertices), WebGL.glContext.STATIC_DRAW);
        this.earthBuffer.itemSize = 3;
        this.earthBuffer.numItems = 5;

        var color = [];
        for(var i = 0; i < 5; ++i){
            color = color.concat([0.0, 0.0, 0.0, 1.0]);
        }
        this.colorBuffer = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.colorBuffer);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(color), WebGL.glContext.STATIC_DRAW);
        this.colorBuffer.itemSize = 4;
        this.colorBuffer.numItems = 5;

        this.glContext.enable(this.glContext.DEPTH_TEST);

        this.rotGlobe = this.locateGradient;

        this.setBG(0);

	},
	drawScene : function(){

        WebGL.textContext.fillStyle = "white";
        WebGL.glContext.clear(WebGL.glContext.COLOR_BUFFER_BIT | WebGL.glContext.DEPTH_BUFFER_BIT);   
        WebGL.textContext.clearRect(0, 0, WebGL.textCanvas.attr("width"), WebGL.textCanvas.attr("height"));
        WebGL.textContext.save();

        mat4.perspective(45, WebGL.glContext.viewportWidth / WebGL.glContext.viewportHeight, 0.1, 1000.0, WebGL.pMatrix);

        mat4.identity(WebGL.mvMatrix);

        // camera setting
        // 위치 경도,위도 기반으로 카메라 회전축 설정 
        mat4.translate(WebGL.mvMatrix, [0.0, 0.0, -20.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotX), [1.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotY), [0.0, 1.0, 0.0]);

        // draw earth
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, WebGL.colorBuffer);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, WebGL.colorBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);

        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, WebGL.earthBuffer);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, WebGL.earthBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
        
        WebGL.setMatrixUniforms();
        WebGL.glContext.drawArrays(WebGL.glContext.TRIANGLE_FAN, 0, WebGL.earthBuffer.numItems);


        // rotate globe
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.locateLatitude - 90), [1.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotGlobe), [0.0, 1.0, 0.0]);

        globe.draw(WebGL.bgcolor);


        // 3D->2D좌표로 변경
        /*
        mat4.identity(WebGL.tMatrix);
        WebGL.textContext.translate(100, 100);
        WebGL.textContext.fillText("이것은 텍스트 입니다!", 20, 20);
        */

        for(var i = 0; i < WebGL.data.length; ++i){
            WebGL.asterisms[i].draw();
        }

        WebGL.textContext.restore();
	},
    rotateGlobe : function(degree){
        this.rotGlobe = 360-degree;
        this.drawScene();
    },
    drawText : function(text, pos){
        // TODO ㅠㅠ
    },
    mouseDrag : function(dx, dy){
        WebGL.rotX -= dy / WebGL.glContext.viewportHeight * 3;

        if(WebGL.rotX < -90) WebGL.rotX = -90;
        if(WebGL.rotX > 20) WebGL.rotX = 20;

        WebGL.rotY -= dx / WebGL.glContext.viewportWidth * 3;

        this.drawScene();
    },
    setWindow : function(){
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();

        WebGL.glCanvas.attr("width",windowWidth);
        WebGL.glCanvas.attr("height",windowHeight);

        WebGL.textCanvas.attr("width",windowWidth);
        WebGL.textCanvas.attr("height",windowHeight);

        WebGL.glContext.viewportWidth = windowWidth;
        WebGL.glContext.viewportHeight = windowHeight;

        WebGL.glContext.viewport(0, 0, windowWidth, windowHeight);

    },
	initShader : function(){
        var fragmentShader = this.getShader("shader-fs");
        var vertexShader = this.getShader("shader-vs");

        this.shaderProgram = this.glContext.createProgram();

        this.glContext.attachShader(this.shaderProgram, vertexShader);
        this.glContext.attachShader(this.shaderProgram, fragmentShader);

        this.glContext.linkProgram(this.shaderProgram);
        if (!this.glContext.getProgramParameter(this.shaderProgram, this.glContext.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        this.glContext.useProgram(this.shaderProgram);

        this.shaderProgram.vertexPositionAttribute = this.glContext.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.glContext.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        this.shaderProgram.vertexColorAttribute = this.glContext.getAttribLocation(this.shaderProgram, "aVertexColor");
        this.glContext.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        

        this.shaderProgram.pMatrixUniform = this.glContext.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = this.glContext.getUniformLocation(this.shaderProgram, "uMVMatrix");
    },
    getShader : function(id){
        var shader;
        var shaderScript = $("#"+id);

        if (!shaderScript) {
            return null;
        }
        
        var source = shaderScript.text();

        if (shaderScript.attr("type") == "x-shader/x-fragment") {
            shader = this.glContext.createShader(this.glContext.FRAGMENT_SHADER);
            console.log("fragment shader loaded!")
        } else if (shaderScript.attr("type") == "x-shader/x-vertex") {
            shader = this.glContext.createShader(this.glContext.VERTEX_SHADER);
            console.log("vertex shader loaded!")
        } else {
            return null;
        }

        this.glContext.shaderSource(shader, source);
        this.glContext.compileShader(shader);

        if (!this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS)) {
            alert(this.glContext.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    },
    setMatrixUniforms : function() {
        this.glContext.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, WebGL.pMatrix);
        this.glContext.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, WebGL.mvMatrix);
    },
    mvPushMatrix: function() {
        var copy = mat4.create();
        mat4.set(this.mvMatrix, copy);
        this.mvMatrixStack.push(copy);
    },
    mvPopMatrix : function(){
        if (this.mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        this.mvMatrix = this.mvMatrixStack.pop();
    },
    setBG : function(percent){
        var colorNight = [0.06, 0.08, 0.12, 1.0];
        var colorDay = [0.7, 0.85, 0.98, 1.0];

        if(percent < 0) percent = 0;
        if(percent > 1) percent = 1;


        for(var i = 0; i < 3; ++i){
            this.bgcolor[i] = colorNight[i] + (colorDay[i]-colorNight[i]) * percent;
        }
        this.bgcolor[3] = 1.0;

        this.glContext.clearColor(this.bgcolor[0], this.bgcolor[1], this.bgcolor[2], this.bgcolor[3]);
    },
    setColor : function(color, vertex, add){
        var colorBuffer = WebGL.glContext.createBuffer();;
        var data = [];
        var colorData = color.slice();

        if(add){
            // 함수 인자로 들어오는 배열은 복사되지 않고 대상을 참조함!
            colorData[0] += add;
            colorData[1] += add;
            colorData[2] += add;
        }

        for(var i = 0; i < 72; ++i){
            data = data.concat(colorData);
        }

        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, colorBuffer);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(data), WebGL.glContext.STATIC_DRAW);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, 4, WebGL.glContext.FLOAT, false, 0, 0);
    }
}

var Planetarium = {
    time : null,
    timeout : null,
    drag : { isDrag : false, _x : 0, _y : 0},
	init : function(){
        $.getJSON( "asset/stellar.json", function(data){
                $(document).on("mousedown", function(e){
                    Planetarium.drag.isDrag = true;
                    Planetarium.drag._x = e.pageX;
                    Planetarium.drag._y = e.pageY;
                });

                $(document).on("mouseup", function(e){
                    Planetarium.drag.isDrag = false;
                })

                $(document).on("mousemove", function(e){
                    if(Planetarium.drag.isDrag){
                        WebGL.mouseDrag(e.pageX-Planetarium.drag._x, e.pageY-Planetarium.drag._y);
                    }
                })

                $(window).on("resize", WebGL.setWindow);

                WebGL.start(data);
                Planetarium.time = new Date();
                Planetarium.runTime();
        })
	},
    runTime : function(option){

        clearTimeout(Planetarium.timeout);

        switch(option){
            case "back-fast" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,16,option);
                Planetarium.time.setMinutes(Planetarium.time.getMinutes()-2);
                break;
            case "back-slow" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,32,option);
                Planetarium.time.setMinutes(Planetarium.time.getMinutes()-1);
                break;
            case "basic" : 
                Planetarium.timeout = setTimeout(Planetarium.runTime,1000,option);
                Planetarium.time.setSeconds(Planetarium.time.getSeconds()+1);
                break;
            case "forward-slow" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,32,option);
                Planetarium.time.setMinutes(Planetarium.time.getMinutes()+1);
                break;
            case "forward-fast" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,16,option);
                Planetarium.time.setMinutes(Planetarium.time.getMinutes()+2);
                break;
            case "stop":
                break;
            default : 
                Planetarium.timeout = setTimeout(Planetarium.runTime,1000);
                Planetarium.time = new Date();
                break;
        }

        Planetarium.setTime();
    },
    setTime : function(){
        var timeText;
        var ampm;
        var hour = this.time.getHours();
        var minute = this.time.getMinutes();

        timeText = digit(hour % 12, 2) + ":";
        timeText += digit(minute, 2) + ":";
        timeText += digit(this.time.getSeconds(), 2);

        ampm = (this.time.getHours() >= 12)?"PM":"AM";

        $("#am-pm").text(ampm);
        $("#time-num").text(timeText);

        if(hour == 4){
            var percent = minute/60;
            WebGL.setBG(percent);
        }
        if(hour == 18){
            var percent = (60-minute)/60;
            WebGL.setBG(percent);
        }
        if(hour < 4 || hour > 18){
            WebGL.setBG(0);
        }else if(hour > 4 && hour < 18){
            WebGL.setBG(1);
        }

        WebGL.rotateGlobe((this.time.getHours() * 60 + this.time.getMinutes())/4);
    }
}

// 3D 오브젝트 프로토타입
var globe = {
    lineBuffer : null,
    radius : null,
    color : [1.0, 1.0, 1.0, 1.0],
    init : function(radius, color){
        this.radius = radius;
        this.lineBuffer = circle(this.radius, 72);
    },
    draw : function(color){
        WebGL.mvPushMatrix();

        for(var i = 0; i < 12; ++i){

            mat4.rotate(WebGL.mvMatrix, degToRad(15), [0.0, 1.0, 0.0]);

            if(i == 11){
                WebGL.setColor(color,72,0.3);
            }else{
                WebGL.setColor(color,72,0.1);
            }

            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
            
            WebGL.setMatrixUniforms();
            WebGL.glContext.drawArrays(WebGL.glContext.LINE_LOOP, 0, this.lineBuffer.numItems);
        }
        WebGL.mvPopMatrix();


        WebGL.mvPushMatrix();
        mat4.rotate(WebGL.mvMatrix, degToRad(90), [1.0, 0.0, 0.0]);

        for(var i = -12; i < 13; ++i){
            WebGL.mvPushMatrix();

            mat4.translate(WebGL.mvMatrix, [0.0, 0.0, Math.sin(degToRad(10*i)) * this.radius]);

            mat4.scale(WebGL.mvMatrix, [Math.cos(degToRad(10*i)),Math.cos(degToRad(10*i)),1.0])
            
            if(i == 0){
                WebGL.setColor(color,72,0.3);
            }else{
                WebGL.setColor(color,72,0.1);
            }

            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
            
            WebGL.setMatrixUniforms();
            WebGL.glContext.drawArrays(WebGL.glContext.LINE_LOOP, 0, this.lineBuffer.numItems);

            WebGL.mvPopMatrix();
        }

        WebGL.mvPopMatrix();
    }
}

function asterism(data){
    this.name = data.name;
    this.stars = data.stars;
    this.lineBuffer;
    this.lineElement = [];
    this.lineIndex = data.line;
    this.pointBufferArray = [];
    this.globeRadius; 
    this.pointColorBuffer;
    this.colorBuffer;
    this.viewLine = false;
}
asterism.prototype = {
    init : function(globeRadius){
        var vertices = [];
        for(var i = 0; i < this.stars.length; ++i){
            var star = this.stars[i];
            this.pointBufferArray[i] = circle(1.0/star.magnitude, 12);

            var ascensionTime = star.pos[0].split(":");
            var ascension = (parseInt(ascensionTime[0])*60 + parseInt(ascensionTime[1]))/4
            var declination = star.pos[1];
            star.pos[0] = ascension;

            var r = globeRadius * Math.cos(degToRad(declination));
            var x = r * Math.cos(degToRad(360 - ascension));
            var y = globeRadius * Math.sin(degToRad(declination));;
            var z = r * Math.sin(degToRad(360 - ascension));

            vertices = vertices.concat([x,y,z]);

        }

        this.globeRadius = globeRadius;

        this.lineBuffer = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(vertices), WebGL.glContext.STATIC_DRAW);
        this.lineBuffer.itemSize = 3;
        this.lineBuffer.numItems = this.stars.length;

        for(var i = 0; i < this.lineIndex.length; ++i){
            this.lineElement.push(WebGL.glContext.createBuffer());
            WebGL.glContext.bindBuffer(WebGL.glContext.ELEMENT_ARRAY_BUFFER, this.lineElement[i]);
            WebGL.glContext.bufferData(WebGL.glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.lineIndex[i]), WebGL.glContext.STATIC_DRAW);
            this.lineElement[i].itemSize = 1;
            this.lineElement[i].numItems = 2;
        }

        var color = [];
        for(var i = 0; i < 12; ++i){
            color = color.concat([1.0, 1.0, 1.0, 1.0]);
        }
        this.pointColorBuffer = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.pointColorBuffer);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(color), WebGL.glContext.STATIC_DRAW);
        this.pointColorBuffer.itemSize = 4;
        this.pointColorBuffer.numItems = 12;

        color = [];
        for(var i = 0; i < this.stars.length; ++i){
            color = color.concat([0.5, 0.5, 0.5, 1.0]);
        }
        this.colorBuffer = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.colorBuffer);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(color), WebGL.glContext.STATIC_DRAW);
        this.colorBuffer.itemSize = 4;
        this.colorBuffer.numItems = this.stars.length;
    },
    draw : function(){

        if(this.viewLine){
            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.colorBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);    

            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);    

            for(var i = 0; i < this.lineElement.length; ++i){  
                WebGL.glContext.bindBuffer(WebGL.glContext.ELEMENT_ARRAY_BUFFER, this.lineElement[i]);
                WebGL.setMatrixUniforms();
                WebGL.glContext.drawElements(WebGL.glContext.LINE_STRIP, this.lineElement[i].numItems, WebGL.glContext.UNSIGNED_SHORT, 0);
            }

        }

        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.pointColorBuffer);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, this.pointColorBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);    

        for(var i = 0; i < this.stars.length; ++i){
            var star = this.stars[i];

            WebGL.mvPushMatrix();
            mat4.rotate(WebGL.mvMatrix, degToRad(star.pos[0] - 90), [0.0, 1.0, 0.0]);
            mat4.rotate(WebGL.mvMatrix, degToRad(star.pos[1]), [1.0, 0.0, 0.0]);
            mat4.translate(WebGL.mvMatrix, [0.0, 0.0, - this.globeRadius + 0.1]);

            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.pointBufferArray[i]);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.pointBufferArray[i].itemSize, WebGL.glContext.FLOAT, false, 0, 0);
            
            WebGL.setMatrixUniforms();
            WebGL.glContext.drawArrays(WebGL.glContext.TRIANGLE_FAN, 0, this.pointBufferArray[i].numItems);


            if(i == 0){
                //mat4.translate(WebGL.tMatrix, [50.0, 20.0, 0.0]);
                mat4.multiply(WebGL.tMatrix, WebGL.pMatrix);
                mat4.multiply(WebGL.tMatrix, WebGL.mvMatrix);

                //console.log(WebGL.tMatrix[0],WebGL.tMatrix[5]);
            }

            WebGL.mvPopMatrix();
        }
    }
}

function circle(radius, vertexNum){
    var buffer = WebGL.glContext.createBuffer();
    var vertices = [];
    var degree = 360/vertexNum;

    for(var j = 0; j < vertexNum; ++j){
        var x = radius * Math.cos(degToRad(degree * j));
        var y = radius * Math.sin(degToRad(degree * j));
        var z = 0;
        vertices = vertices.concat([x,y,z]);
    }

    WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, buffer);
    WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER,  new Float32Array(vertices), WebGL.glContext.STATIC_DRAW);

    buffer.itemSize = 3;
    buffer.numItems = vertexNum;

    return buffer;
}

function degToRad(degree){
	return degree * Math.PI / 180
}

function digit(num,digit){
    var res;
    for(var i = 0; i < digit; ++i){
        res += "0";
    }

    return (res + num).slice(-digit);
}

function matrixMult(matrix1, matrix2){
    var result = [];

}