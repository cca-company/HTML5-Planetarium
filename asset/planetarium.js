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
    data : null,
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

        globe.init(50);

        for(var i = 0; i < this.data.length; ++i){
            this.asterisms[i] = new asterism(this.data[i]);
            this.asterisms[i].init(50);
        }

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	},
    update: function(){
        //this.rotX = (this.rotX >= 360)? 0 : this.rotX + 0.3 ;
        this.rotY = (this.rotY <= 0)? 360 : this.rotY - 0.3 ;
    },
	drawScene : function(){
        WebGL.update();

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, WebGL.pMatrix);

        mat4.identity(WebGL.mvMatrix);
        mat4.translate(WebGL.mvMatrix, [0.0, 0.0, -50.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(270), [1.0, 0.0, 0.0]);
        mat4.rotate(WebGL.mvMatrix, degToRad(WebGL.rotY), [0.0, 1.0, 0.0]);

        globe.draw();


        for(var i = 0; i < WebGL.data.length; ++i){
            WebGL.asterisms[i].draw();
        }
	},
    mouseClick : function(){

    },
    mouseDragged : function(){

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
var globe = {
    lineBuffer : null,
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
        this.colorBufferRed = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferRed);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        this.colorBufferRed.itemSize = 4;
        this.colorBufferRed.numItems = 72;

        color = [];
        for(var i = 0; i < 72; ++i){
            color = color.concat([0.3, 0.3, 0.3, 1.0]);
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
    this.globeRadius; 
    this.pointColorBuffer;
    this.colorBuffer;
}
asterism.prototype = {
    init : function(globeRadius){
        var vertices = [];
        for(var i = 0; i < this.stars.length; ++i){
            var star = this.stars[i];
            this.pointBufferArray[i] = circle(0.5/star.magnitude, 12);

            var ascensionTime = star.pos[0].split(":");
            var ascension = (parseInt(ascensionTime[0])*60 + parseInt(ascensionTime[1]))/4
            var declination = star.pos[1];
            star.pos[0] = ascension;

            var r = globeRadius * Math.cos(degToRad(declination));
            var x = r * Math.cos(degToRad(360-ascension));
            var y = globeRadius * Math.sin(degToRad(declination));;
            var z = r * Math.sin(degToRad(360-ascension));

            vertices = vertices.concat([x,y,z]);

        }

        this.globeRadius = globeRadius;

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
        this.pointColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        this.pointColorBuffer.itemSize = 4;
        this.pointColorBuffer.numItems = 12;

        color = [];
        for(var i = 0; i < this.stars.length; ++i){
            color = color.concat([0.5, 0.5, 0.5, 1.0]);
        }
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        this.colorBuffer.itemSize = 4;
        this.colorBuffer.numItems = this.stars.length;
    },
    draw : function(){

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);    

        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
        gl.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.lineBuffer.itemSize, gl.FLOAT, false, 0, 0);    

        for(var i = 0; i < this.lineElement.length; ++i){  
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElement[i]);
            WebGL.setMatrixUniforms();
            gl.drawElements(gl.LINE_STRIP, this.lineElement[i].numItems, gl.UNSIGNED_SHORT, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointColorBuffer);
        gl.vertexAttribPointer(WebGL.shaderProgram.vertexColorAttribute, this.pointColorBuffer.itemSize, gl.FLOAT, false, 0, 0);    

        for(var i = 0; i < this.stars.length; ++i){
            var star = this.stars[i];

            WebGL.mvPushMatrix();
            mat4.rotate(WebGL.mvMatrix, degToRad(star.pos[0] - 90), [0.0, 1.0, 0.0]);
            mat4.rotate(WebGL.mvMatrix, degToRad(star.pos[1]), [1.0, 0.0, 0.0]);
            mat4.translate(WebGL.mvMatrix, [0.0, 0.0, -this.globeRadius]);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBufferArray[i]);
            gl.vertexAttribPointer(WebGL.shaderProgram.vertexPositionAttribute, this.pointBufferArray[i].itemSize, gl.FLOAT, false, 0, 0);
            
            WebGL.setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_FAN, 0, this.pointBufferArray[i].numItems);

            WebGL.mvPopMatrix();
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

function sphere(){

}

function degToRad(degree){
	return degree * Math.PI / 180
}