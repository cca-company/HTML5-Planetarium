var gl; // webgl object

var WebGL = {
	canvas : null,
	shaderProgram : null,
	pMatrix : null,
	mvMatrix : null,
	mvMatrixStack : [],
    rotX : 0,
    rotY : 0,
    rotZ : 0,
    buffer : null,
    asterisms : [],
	start : function(){
    	this.canvas = $("#glCanvas");

        gl = this.canvas[0].getContext("webgl") || this.canvas[0].getContext("experimental-webgl");
        gl.viewportWidth = this.canvas.attr("width");   // 스타일로 지정한 가로세로크기는 캔버스가 인식못함 ㅆㅃ 내 열시간...
        gl.viewportHeight = this.canvas.attr("height");

        this.pMatrix = mat4.create();
        this.mvMatrix = mat4.create();

		if(gl){
			this.initShader();
			this.setup();

			setInterval(this.drawScene, 17);
		}
	},
	setup : function(){
        // 임시 데이터
        var data = [
            {
                "name" : "Ursa Minor",
                "stars" :[
                    { "name" : "Polaris", "pos" : [151/4,89.15], "magnitude" : 1},  // 항성명 : [적경, 적위, 밝기]
                    { "name" : "Kochab", "pos" : [890/4,74.09], "magnitude" : 2},
                    { "name" : "Ursa Minor - Gamma", "pos" : [920/4,71.50], "magnitude" : 3},
                    { "name" : "Ursa Minor - Delta", "pos" : [1052/4,86.35], "magnitude" : 4},
                    { "name" : "Ursa Minor - Epsilon", "pos" : [1005/4,82.02], "magnitude" : 4},
                    { "name" : "Ursa Minor - Zeta", "pos" : [944/4,77.47], "magnitude" : 4},
                    { "name" : "Ursa Minor - Eta", "pos" : [977/4,75.45], "magnitude" : 5}
                ],
                "line" : [[2,6],[6,5],[1,2],[1,5],[5,4],[3,4],[3,0]],
            }
        ];

        sphere.init(50);
        this.asterisms[0] = new asterism(data[0]);
        this.asterisms[0].init(50);

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	},
    update: function(){
        this.rotX = (this.rotX >= 360)? 0 : this.rotX + 0.3 ;
        this.rotZ = (this.rotZ >= 360)? 0 : this.rotZ + 0.3 ;
    },
	drawScene : function(){
        WebGL.update();

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0, WebGL.pMatrix);

        mat4.identity(WebGL.mvMatrix);
        mat4.translate(WebGL.mvMatrix, [0.0, 0.0, 10.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(280), [1.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotZ), [0.0, 1.0, 0.0]);

        sphere.draw();
        WebGL.asterisms[0].draw();
	},
	initShader : function(){
        var fragmentShader = this.getShader("shader-fs");
        var vertexShader = this.getShader("shader-vs");

        this.shaderProgram = gl.createProgram();

        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);

        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(this.shaderProgram);

        this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

        this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        

        this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
    },
    getShader : function(id){
        var shader;
        var shaderScript = $("#"+id);

        if (!shaderScript) {
            return null;
        }
        
        var source = shaderScript.text();

        if (shaderScript.attr("type") == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
            console.log("fragment shader loaded!")
        } else if (shaderScript.attr("type") == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
            console.log("vertex shader loaded!")
        } else {
            return null;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    },
    setMatrixUniforms : function() {
        gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, WebGL.pMatrix);
        gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, WebGL.mvMatrix);
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
	init : function(){
        // 별자리 데이터 로드
        // 임시 데이터

		WebGL.start();
	},
}

// 3D 오브젝트 프로토타입
var sphere = {
    lineBuffer : null,
    colorBufferRed : null,
    colorBufferWhite : null,
    radius : null,
    init : function(radius){
        this.radius = radius;
        this.lineBuffer = circle(this.radius, 72);

        var color = [];
        for(var i = 0; i < 72; ++i){
            color = color.concat([0.5, 0.5, 0.0, 1.0]);
        }
        this.colorBufferRed = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferRed);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        this.colorBufferRed.itemSize = 4;
        this.colorBufferRed.numItems = 72;

        color = [];
        for(var i = 0; i < 72; ++i){
            color = color.concat([0.5, 0.5, 0.5, 1.0]);
        }
        this.colorBufferWhite = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferWhite);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        this.colorBufferWhite.itemSize = 4;
        this.colorBufferWhite.numItems = 72;

    },
    draw : function(){

        WebGL.mvPushMatrix();
        var colorBuffer;

        for(var i = 0; i < 12; ++i){

            mat4.rotate(WebGL.mvMatrix, degToRad(15), [0.0, 1.0, 0.0]);

            colorBuffer = (i == 0)? this.colorBufferRed : this.colorBufferWhite ;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
            gl.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
                
            WebGL.setMatrixUniforms();
            gl.drawArrays(gl.LINE_LOOP, 0, this.lineBuffer.numItems);
        }
        WebGL.mvPopMatrix();


        WebGL.mvPushMatrix();
        mat4.rotate(WebGL.mvMatrix, degToRad(90), [1.0, 0.0, 0.0]);

        for(var i = -12; i < 13; ++i){
            WebGL.mvPushMatrix();

            mat4.translate(WebGL.mvMatrix, [0.0, 0.0, Math.sin(degToRad(10*i)) * this.radius]);

            mat4.scale(WebGL.mvMatrix, [Math.cos(degToRad(10*i)),Math.cos(degToRad(10*i)),1.0])
            
            colorBuffer = (i == 0)? this.colorBufferRed : this.colorBufferWhite;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
            gl.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            WebGL.setMatrixUniforms();
            gl.drawArrays(gl.LINE_LOOP, 0, this.lineBuffer.numItems);

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
    this.sphereRadius; 
    this.colorBuffer;
}
asterism.prototype = {
    init : function(sphereRadius){
        var vertices = [];
        for(var i = 0; i < this.stars.length; ++i){
            var star = this.stars[i];
            this.pointBufferArray[i] = circle(0.5/star.magnitude, 12);

            var r = sphereRadius * Math.cos(degToRad(star.pos[1]));
            var x = r * Math.cos(degToRad(360-star.pos[0]));
            var y = sphereRadius * Math.sin(degToRad(star.pos[1]));;
            var z = r * Math.sin(degToRad(360-star.pos[0]));

            vertices = vertices.concat([x,y,z]);

        }

        this.sphereRadius = sphereRadius;

        this.lineBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.lineBuffer.itemSize = 3;
        this.lineBuffer.numItems = this.stars.length;

        for(var i = 0; i < this.lineIndex.length; ++i){
            this.lineElement.push(gl.createBuffer());
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElement[i]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.lineIndex[i]), gl.STATIC_DRAW);
            this.lineElement[i].itemSize = 1;
            this.lineElement[i].numItems = 2;
        }

        var color = [];
        for(var i = 0; i < 12; ++i){
            color = color.concat([1.0, 1.0, 1.0, 1.0]);
        }
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        this.colorBuffer.itemSize = 4;
        this.colorBuffer.numItems = 12;
    },
    draw : function(){

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);    

        for(var i = 0; i < this.stars.length; ++i){
            var star = this.stars[i];

            WebGL.mvPushMatrix();
            mat4.rotate(WebGL.mvMatrix, degToRad(star.pos[0] - 90), [0.0, 1.0, 0.0]);
            mat4.rotate(WebGL.mvMatrix, degToRad(star.pos[1]), [1.0, 0.0, 0.0]);
            mat4.translate(WebGL.mvMatrix, [0.0, 0.0, -this.sphereRadius]);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBufferArray[i]);
            gl.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.pointBufferArray[i].itemSize, gl.FLOAT, false, 0, 0);
            
            WebGL.setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_FAN, 0, this.pointBufferArray[i].numItems);

            WebGL.mvPopMatrix();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
        gl.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, gl.FLOAT, false, 0, 0);    

        for(var i = 0; i < this.lineElement.length; ++i){  
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElement[i]);
            WebGL.setMatrixUniforms();
            gl.drawElements(gl.LINE_STRIP, this.lineElement[i].numItems, gl.UNSIGNED_SHORT, 0);
        }
    }
}

function circle(radius, vertexNum){
    var buffer = gl.createBuffer();
    var vertices = [];
    var degree = 360/vertexNum;

    for(var j = 0; j < vertexNum; ++j){
        var x = radius * Math.cos(degToRad(degree * j));
        var y = radius * Math.sin(degToRad(degree * j));
        var z = 0;
        vertices = vertices.concat([x,y,z]);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array(vertices), gl.STATIC_DRAW);

    buffer.itemSize = 3;
    buffer.numItems = vertexNum;

    return buffer;
}

function degToRad(degree){
	return degree * Math.PI / 180
}