function initializePerspectiveService() {
	loadStaticFile("http://fonts.googleapis.com/css?family=Poiret+One", "css");
}

function loadStaticFile(filename, filetype){
 	if (filetype=="js"){ //if filename is a external JavaScript file
 		var fileref=document.createElement('script');
 		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", filename);
	} else if (filetype=="css"){ //if filename is an external CSS file
 		var fileref=document.createElement("link");
 		fileref.setAttribute("rel", "stylesheet");
 		fileref.setAttribute("type", "text/css");
 		fileref.setAttribute("href", filename);
	}
	if (typeof fileref!="undefined") {
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}
}

function setStyle(elem, KeyValue) {
	if(elem == null) return;
	for (var key in KeyValue) {
		if(KeyValue.hasOwnProperty(key)) {
			elem.style.setProperty(key, KeyValue[key]);
		}
	}
}

function setTransform(elem, transform) {
	elem.style.setProperty('transform', transform);
	elem.style.setProperty('-moz-transform', transform);
	elem.style.setProperty('-webkit-transform', transform);
}

function setTransition(elem, transition) {
	elem.style.setProperty('transition', transition);
	elem.style.setProperty('-moz-transition', transition);
	elem.style.setProperty('-webkit-transition', transition);
}

function Perspective(panoid, _heading, _pitch) {
	this.command = {};
	this.infoList = [];
	this.POV_RANGE = 45;
	this.SCREEN_DISTANCE = window.innerWidth/2/Math.tan(this.POV_RANGE/180*Math.PI);
	this.initializePerspective(panoid, _heading, _pitch);
}

Perspective.prototype.initializePerspective = function(panoid, _heading, _pitch) {
	this.container = document.createElement('div');
	this.display = document.createElement('div');
	this.googleMap = document.createElement('div');
	this.container.appendChild(this.display);
	this.container.appendChild(this.googleMap);

	this.headSpeed = 0;
	this.pitchSpeed = 0;
	this.inertialSpeed = 0.95;

	setStyle(this.container, {
		'width': '100%',
		'height': '100%',
	});

	setStyle(this.display, {
		'position' : 'absolute',
		'width' : '100%',
		'height' : '100%',
		'z-index' : '2',
	});

	setStyle(this.googleMap, {
		'z-index' : '1',
		'height' : '100%',
	});

	var panoramaOptions = {
		pano : panoid,
		pov : {
			heading : _heading,
			pitch : _pitch,
		},
		zoom : 1,
		disableDefaultUI : true,
	}
	this.photoSphere = new google.maps.StreetViewPanorama(this.googleMap, panoramaOptions);
	this.photoSphere.setVisible(true);
	document.addEventListener('mousemove', this, false);
	document.addEventListener('mouseleave', this, false);
}

Perspective.prototype.handleEvent = function(e) {
	if(e.type == 'mousemove') {
		this.command = {};
		if(e.pageX < window.innerWidth/4) {
			this.command['LEFT'] = true;
		}
		if(e.pageX > window.innerWidth/4*3) {
			this.command['RIGHT'] = true;
		}
		if(e.pageY > window.innerHeight/4*3) {
			this.command['UP'] = true;
		}
		if(e.pageY < window.innerHeight/4) {
			this.command['DOWN'] = true;
		}
	}
	if(e.type == 'mouseleave') {
		this.command = {};
	}
}

Perspective.prototype.headLeft = function() {
	this.headSpeed = Math.max(-0.9, this.headSpeed - 0.04);
}

Perspective.prototype.headRight = function() {
	this.headSpeed = Math.min(0.9, this.headSpeed + 0.04);
}

Perspective.prototype.pitchUp = function() {
	this.pitchSpeed = Math.max(-0.6, this.pitchSpeed - 0.04);
}

Perspective.prototype.pitchDown = function() {
	this.pitchSpeed = Math.min(0.6, this.pitchSpeed + 0.04);
}

Perspective.prototype.updatePhotoSphere = function() {
	if(this.command['UP']) this.pitchUp();
	if(this.command['DOWN']) this.pitchDown();
	if(this.command['LEFT']) this.headLeft();
	if(this.command['RIGHT']) this.headRight();
	var newHeading = this.photoSphere.pov.heading + this.headSpeed;
	var newPitch = this.photoSphere.pov.pitch + this.pitchSpeed;
	if(newHeading < -180) newHeading += 360;
	if(newHeading > 180) newHeading -= 360;
	if(newPitch < -180) newPitch += 360;
	if(newPitch > 180) newPitch -=360;
	this.photoSphere.setPov({heading : newHeading, pitch : newPitch});
	this.headSpeed = this.headSpeed * this.inertialSpeed;
	this.pitchSpeed = this.pitchSpeed * this.inertialSpeed;
}

Perspective.prototype.setAmbientSound = function(audioSource) {
	var that = this;
	var audio = document.createElement('audio');
	this.ambientSound = audio;
	audio.addEventListener('loadedmetadata', function() {
		that.playAmbientSound();
	});
	audio.addEventListener('ended', function() {
		this.currentTime = 0;
		that.playAmbientSound();
	});
	audio.src = audioSource;
}

Perspective.prototype.playAmbientSound = function() {
	if(this.ambientSound == null) return;
	this.ambientSound.play();
}

Perspective.prototype.addInfo = function(info) {
	this.infoList.push(info);
}

Perspective.prototype.update = function() {
	this.updatePhotoSphere();
	for (var i=0;i<this.infoList.length;++i){
		this.infoList[i].update();
	}
}

Perspective.prototype.setTitle = function(title) {
	if(this.title == null) {
		this.title = document.createElement('div');

		setStyle(this.title, {
			'position': 'absolute',
			'left' : '50%',
			'top' : '30px',
			'font-family' : 'Poiret One',
			'font-size' : '1.10em',
			'font-weight' : 'lighter',
			'color' : 'white',
			'border' : '1px solid white',
			'padding' : '7px 28px 7px 28px',
		});

		setTransform(this.title, 'translateX(-50%)');
		this.display.appendChild(this.title);
	}
	this.title.innerHTML = title;
}

function Information(parent, heading, pitch) {
	this.parent = parent;
	this.heading = heading;
	this.pitch = pitch;
	this.container = document.createElement('div');
	this.opacity = 0;
	this.parent.display.appendChild(this.container);
	setStyle(this.container, {
		'position' : 'absolute',
		'opacity' : '0',
		'overflow' : 'hidden',
	});
}

Information.prototype.setContent = function(content) {
	this.content = content;
	this.container.appendChild(content.container);
}

Information.prototype.update = function(heading, pitch) {
	var alpha = this.heading - this.parent.photoSphere.pov.heading;
	this.left = this.parent.SCREEN_DISTANCE * Math.tan(alpha/180 * Math.PI) + window.innerWidth/2;
	if(alpha > 180) alpha -= 360;
	if(alpha < -180) alpha += 360;
	var beta = this.parent.photoSphere.pov.pitch - this.pitch;
	this.top = this.parent.SCREEN_DISTANCE * Math.tan(beta/180 * Math.PI) + window.innerHeight/2;
	if(beta > 180) beta -= 360;
	if(beta < -180) beta += 360;
	this.opacity = Math.max(0,1 - Math.abs(alpha)/(3*this.parent.POV_RANGE));
	setStyle(this.container, {
		'top' : this.top + 'px',
		'left' : this.left + 'px',
		'opacity' : this.opacity,
	});
	if(this.opacity < 0.02) this.container.style.setProperty('display', 'none');
	else this.container.style.setProperty('display', 'block');
}

function PersonCommentContent(thumbnailSource, headerPhotoSource, comment) {
	var thumbnailImg = new Image();
	thumbnailImg.src = thumbnailSource;
	var headerPhotoImg = new Image();
	headerPhotoImg.src = headerPhotoSource;
	this.comment = comment;
	this.thumbnail = thumbnailImg;
	this.headerPhoto = headerPhotoImg;
	this.width = 280;
	this.height = 250;
	this.thRadius = 35;
	this.initializePersonCommentContent();
}

PersonCommentContent.prototype.initializePersonCommentContent = function() {
	this.container = document.createElement('div');

	setStyle(this.container, {
		'overflow' : 'auto',
	});
	this.thumbnailContainer = document.createElement('div');
	setStyle(this.thumbnailContainer, {
		'position' : 'relative',
		'width' : this.thRadius*2+'px',
		'height' : this.thRadius*2+'px',
		'border-radius' : '70px',
		'background-color' : 'white',
		'z-index' : '3',
		'overflow' : 'hidden',
	});
	setTransition(this.thumbnailContainer, 'left 0.3s');

	setStyle(this.thumbnail, {
		'width' : '100%',
	});

	this.bodyContainer = document.createElement('div');
	setStyle(this.bodyContainer, {
		'width' : '0px',
		'height' : '0px',
		'opacity' : '0',
	});
	setTransition(this.bodyContainer, 'width 0.3s');
	setTransition(this.bodyContainer, 'height 0.3s');
	setTransition(this.bodyContainer, 'opacity 0.3s');

	this.headerPhotoContainer = document.createElement('div');
	setStyle(this.headerPhotoContainer, {
		'position' : 'absolute',
		'width' : this.width+'px',
		'height' : this.height/2+'px',
		'top' : this.thRadius + 'px',
		'overflow' : 'hidden',
		'background-color' : 'black',
		'z-index' : '1',
	});

	setStyle(this.headerPhoto, {
		'width' : '100%',
	});

	this.commentContainer = document.createElement('div');
	setStyle(this.commentContainer, {
		'position' : 'absolute',
		'width' : this.width+'px',
		'height' : this.height/2+'px',
		'top' : this.thRadius+this.height/2+'px',
		'padding' : '20px 0px 20px 0px',
		'font-size' : '0.9em',
		'color' : 'white',
		'background-color' : 'rgb(202, 171, 85)',
		'font-family' : 'Poiret One',
		'z-index' : '2',
	});

	this.commentDiv = document.createElement('div');
	this.commentDiv.innerHTML = this.comment;
	this.commentContainer.appendChild(this.commentDiv);
	setStyle(this.commentDiv, {
		'position' : 'absolute',
		'width' : '100%',
		'top' : '50%',
		'padding' : '0px 3px 0px 3px',
		'text-align' : 'center',
	});
	setTransform(this.commentDiv, 'translateY(-50%)');
	if(this.headerPhoto != null) this.headerPhotoContainer.appendChild(this.headerPhoto);
	if(this.thumbnail != null) this.thumbnailContainer.appendChild(this.thumbnail);

	this.bodyContainer.appendChild(this.commentContainer);
	this.bodyContainer.appendChild(this.headerPhotoContainer);

	this.container.appendChild(this.thumbnailContainer);
	this.container.appendChild(this.bodyContainer);

	this.container.addEventListener('mouseover', this, false);
	this.container.addEventListener('mouseleave', this, false);
}

PersonCommentContent.prototype.handleEvent = function(e) {
	var that = this;
	if(e.type == 'mouseover'){
		setStyle(this.thumbnailContainer, {
			'left' : this.width/2 - this.thRadius + 'px',
		})
		setStyle(this.bodyContainer, {
			'width' : this.width+'px',
			'height' : this.thRadius+this.height+'px',
			'opacity' : '1',
		});
	}
	if(e.type == 'mouseleave') {
		setStyle(this.thumbnailContainer, {
			'left' : '0px',
		})
		setTimeout(function() {
			setStyle(that.bodyContainer, {
				'width' : '0px',
				'height' : '0px',
				'opacity' : '0',
			});
		}, 220);
	}
}


//testing code
document.addEventListener("DOMContentLoaded", function() {
	initializePerspectiveService();
	var p = new Perspective('oacawDojVGkAAAQYfeZmJg', 90, 0);
	document.body.appendChild(p.container);
	p.setAmbientSound('sounds/wind-breeze.mp3');

	var info = new Information(p, 80, 15);
	info.setContent(new PersonCommentContent('test/th1.jpg','test/h1.jpg',"Prajogo: Hello There! Welcome to Singapore! You are currently in Marina Bay, a place where a lot of tall buildings can be seen!"));

	var info2 = new Information(p, 125, 20);
	info2.setContent(new PersonCommentContent('test/th2.jpg','test/h2.jpg',"Febriliani: Singapore is a lion city, and the skyscrapers divide the horizon into two."));

	p.addInfo(info);
	p.addInfo(info2);

	p.setTitle('By the side of Marina Bay');
	setInterval(function() {
		p.update();
	}, 1000/60);
})