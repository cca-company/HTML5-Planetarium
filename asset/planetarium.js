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
	start : function(){
    	this.glCanvas = $("#glCanvas");

        this.glContext = this.glCanvas[0].getContext("webgl") || this.glCanvas[0].getContext("experimental-webgl");
        this.glContext.viewportWidth = this.glCanvas.attr("width");
        this.glContext.viewportHeight = this.glCanvas.attr("height");

        // TODO : 텍스트 제어
        // http://webglfundamentals.org/webgl/webgl-text-html-canvas2d-arrows.html
        this.textCanvas = $("#textCanvas");
        this.textContext = this.textCanvas[0].getContext("2d");

        this.pMatrix = mat4.create();
        this.mvMatrix = mat4.create();
        this.tMatrix = mat4.create();

		if(this.glContext){

            $(document).on("keydown", this.keyDown);

			this.initShader();
			this.setup();

            this.drawScene();
		}
	},
	setup : function(){
        // 임시 데이터
        this.data = [
            {
                "name" : "Ursa Minor",
                "stars" :[
                    { "name" : "Polaris", "pos" : ["02:31",89.15], "magnitude" : 1},  // 항성명 : [적경, 적위, 밝기]
                    { "name" : "Kochab", "pos" : ["14:50",74.09], "magnitude" : 2},
                    { "name" : "Ursa Minor - Gamma", "pos" : ["15:20",71.50], "magnitude" : 3},
                    { "name" : "Ursa Minor - Delta", "pos" : ["17:32",86.35], "magnitude" : 4},
                    { "name" : "Ursa Minor - Epsilon", "pos" : ["16:45",82.02], "magnitude" : 4},
                    { "name" : "Ursa Minor - Zeta", "pos" : ["15:44",77.47], "magnitude" : 4},
                    { "name" : "Ursa Minor - Eta", "pos" : ["16:17",75.45], "magnitude" : 5}
                ],
                "line" : [[2,6],[6,5],[1,2],[1,5],[5,4],[3,4],[3,0]]
            },
            {
                "name" : "Ursa Major",
                "stars" : [
                    { "name" : "Dubhe", "pos" : ["11:03",61.45], "magnitude" : 1},
                    { "name" : "Merak", "pos" : ["11:01",56.22], "magnitude" : 2},
                    { "name" : "Phecda", "pos" : ["11:53",53.41], "magnitude" : 2},
                    { "name" : "Megrez", "pos" : ["12:15",57.01], "magnitude" : 3},
                    { "name" : "Alioth", "pos" : ["12:54",55.57], "magnitude" : 1},
                    { "name" : "Mizar", "pos" : ["13:23",54.55], "magnitude" : 2},
                    { "name" : "Alkaid", "pos" : ["13:47",49.18], "magnitude" : 3},
                    { "name" : "Ursa Major - Theta", "pos" : ["09:32",51.40], "magnitude" : 1},
                    { "name" : "Ursa Major - Iota", "pos" : ["08:59",48.02], "magnitude" : 3},
                    { "name" : "Ursa Major - Kappa", "pos" : ["09:03",47.09], "magnitude" : 3},
                    { "name" : "Ursa Major - Lambda", "pos" : ["10:17",42.54], "magnitude" : 3},
                    { "name" : "Ursa Major - Mu", "pos" : ["10:22",41.29], "magnitude" : 3},
                    { "name" : "Ursa Major - Nu", "pos" : ["11:18",33.05], "magnitude" : 3},
                    { "name" : "Ursa Major - Xi", "pos" : ["11:18",31.31], "magnitude" : 3},
                    { "name" : "Ursa Major - Omicron", "pos" : ["08:30",60.43], "magnitude" : 3},
                    { "name" : "Ursa Major - Pi", "pos" : ["08:39",65.01], "magnitude" : 5},
                    { "name" : "Ursa Major - Rho", "pos" : ["09:02",67.37], "magnitude" : 4},
                    { "name" : "Ursa Major - Sigma", "pos" : ["09:10",66.52], "magnitude" : 5},
                    { "name" : "Ursa Major - Tau", "pos" : ["09:10",63.30], "magnitude" : 4},
                    { "name" : "Ursa Major - Upsilon", "pos" : ["09:50",59.02], "magnitude" : 3},
                    { "name" : "Ursa Major - Phi", "pos" : ["09:52",54.03], "magnitude" : 4},
                    { "name" : "Ursa Major - Chi", "pos" : ["11:46",47.46], "magnitude" : 3},
                    { "name" : "Ursa Major - Psi", "pos" : ["11:09",44.29], "magnitude" : 3},
                    { "name" : "Ursa Major - Omega", "pos" : ["10:53",43.11], "magnitude" : 4}
                ],
                "line" : [[0,1],[0,3],[1,2],[2,3],[3,4],[4,5],[5,6],[7,9],[8,9],[10,11],[0,18],[18,19],[7,19],[1,19],[18,14],[19,14],[21,2],[22,21],[22,11],[12,13],[12,21]]
            }
        ];

        // 오브젝트 초기화
        globe.init(150);

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

        this.glContext.clearColor(0.1, 0.1, 0.1, 1.0);
        this.glContext.enable(this.glContext.DEPTH_TEST);
        this.glContext.viewport(0, 0, this.glContext.viewportWidth, this.glContext.viewportHeight);

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
        var r = Math.cos(degToRad(WebGL.locateLatitude));
        var x = r * Math.cos(degToRad(WebGL.locateGradient));
        var y = Math.sin(degToRad(WebGL.locateLatitude));
        var z = r * Math.sin(degToRad(WebGL.locateGradient));

        mat4.translate(WebGL.mvMatrix, [0.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotX), [1.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotY), [0.0, 1.0, 0.0]);

        // draw earth
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, WebGL.earthBuffer);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, WebGL.earthBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
        
        WebGL.setMatrixUniforms();
        WebGL.glContext.drawArrays(WebGL.glContext.TRIANGLE_FAN, 0, WebGL.earthBuffer.numItems);


        // rotate globe
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.locateLatitude), [1.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotGlobe), [0.0, 1.0, 0.0]);
        globe.draw();


        // 3D->2D좌표로 변경
        mat4.identity(WebGL.tMatrix);
        WebGL.textContext.translate(100, 100);
        WebGL.textContext.fillText("이것은 텍스트 입니다!", 20, 20);

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
        WebGL.rotX -= dy * 0.01;

        if(WebGL.rotX < -90) WebGL.rotX = -90;
        if(WebGL.rotX > 20) WebGL.rotX = 20;

        WebGL.rotY -= dx * 0.01;

        this.drawScene();
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
    }
}

var Planetarium = {
    time : null,
    timeout : null,
    drag : { isDrag : false, _x : 0, _y : 0},
	init : function(){
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
		WebGL.start();

        this.time = new Date();
        this.runTime();
	},
    runTime : function(option){

        clearTimeout(Planetarium.timeout);

        switch(option){
            case "back-fast" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,16,option);
                Planetarium.time.setMinutes(Planetarium.time.getMinutes()-2);
                break;
            case "back-slow" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,16,option);
                Planetarium.time.setMinutes(Planetarium.time.getMinutes()-1);
                break;
            case "basic" : 
                Planetarium.timeout = setTimeout(Planetarium.runTime,1000,option);
                Planetarium.time.setSeconds(Planetarium.time.getSeconds()+1);
                break;
            case "forward-slow" :
                Planetarium.timeout = setTimeout(Planetarium.runTime,16,option);
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

        timeText = digit(this.time.getHours() % 12, 2) + ":";
        timeText += digit(this.time.getMinutes(), 2) + ":";
        timeText += digit(this.time.getSeconds(), 2);

        ampm = (this.time.getHours() >= 12)?"PM":"AM";

        $("#am-pm").text(ampm);
        $("#time-num").text(timeText);

        WebGL.rotateGlobe((this.time.getHours() * 60 + this.time.getMinutes())/4);
    }
}

// 3D 오브젝트 프로토타입
var globe = {
    lineBuffer : null,
    earthColorBuffer : null,
    colorBufferRed : null,
    colorBufferWhite : null,
    radius : null,
    init : function(radius){
        this.radius = radius;
        this.lineBuffer = circle(this.radius, 72);

        var color = [];
        for(var i = 0; i < 72; ++i){
            color = color.concat([0.3, 0.3, 0.0, 1.0]);
        }
        this.colorBufferRed = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.colorBufferRed);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(color), WebGL.glContext.STATIC_DRAW);
        this.colorBufferRed.itemSize = 4;
        this.colorBufferRed.numItems = 72;

        color = [];
        for(var i = 0; i < 72; ++i){
            color = color.concat([0.3, 0.3, 0.3, 1.0]);
        }
        this.colorBufferWhite = WebGL.glContext.createBuffer();
        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.colorBufferWhite);
        WebGL.glContext.bufferData(WebGL.glContext.ARRAY_BUFFER, new Float32Array(color), WebGL.glContext.STATIC_DRAW);
        this.colorBufferWhite.itemSize = 4;
        this.colorBufferWhite.numItems = 72;

    },
    draw : function(){

        WebGL.mvPushMatrix();
        var colorBuffer;

        for(var i = 0; i < 12; ++i){

            mat4.rotate(WebGL.mvMatrix, degToRad(15), [0.0, 1.0, 0.0]);

            colorBuffer = (i == 11)? this.colorBufferRed : this.colorBufferWhite ;

            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
            
            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, colorBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, colorBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
                
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
            
            colorBuffer = (i == 0)? this.colorBufferRed : this.colorBufferWhite;

            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);
            
            WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, colorBuffer);
            WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, colorBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);

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

        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.colorBuffer);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);    

        WebGL.glContext.bindBuffer(WebGL.glContext.ARRAY_BUFFER, this.lineBuffer);
        WebGL.glContext.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, WebGL.glContext.FLOAT, false, 0, 0);    

        for(var i = 0; i < this.lineElement.length; ++i){  
            WebGL.glContext.bindBuffer(WebGL.glContext.ELEMENT_ARRAY_BUFFER, this.lineElement[i]);
            WebGL.setMatrixUniforms();
            WebGL.glContext.drawElements(WebGL.glContext.LINE_STRIP, this.lineElement[i].numItems, WebGL.glContext.UNSIGNED_SHORT, 0);
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