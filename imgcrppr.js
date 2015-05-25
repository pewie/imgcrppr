;(function ($, window, document, undefined) {

	$.widget("pwa.imgcrppr", {

		options: {
			image_src: 'test.jpg',
			image_height: 300,
			canvas_width: 600,
			canvas_height: 300,
			inner_width: 300,
			inner_height: 300,
			axis: false,
			max_zoom_level: 2,
			callback: function(data) {
				console.log(data);
			},
			custom_controls: false,
			controls: {
				parent: '#imgcrppr',
				container: '#ic-controls',
				zoom: false,
				rotate: false,
				reset: false
			}
		},

		_create: function() {

			var self = this;
			
			this.angle = 0;

			this.transform_values = {
				scale: 1,
				angle: 0
			}

			this._addElements();

			this.img = new Image();

			// Must wait on image to load before we can get its properties.
			this.img.onload = function() {
				self._getImgDimensions(this);
				self._setUpCanvas();
				self._centerImage();
				self._moveToOrigin();
			}

			this.img.src = this.options.image_src;

			$.get(this.options.image_src)
				.done(function() {
					console.log("Image found");
				})
				.fail(function() {
					console.log("Image not found");
					$('#imgcrppr').html("<div id='ic-canvas'><div id='ic-not-found'>Could not load image :(</div></div>");
				});
		},

		_addElements: function() {
			var imgcrppr = $('#imgcrppr');

			$('#imgcrppr').append("<div id='ic-canvas'>"+
					"<div id='ic-back-container' class='draggable'>"+
						"<img id='ic-back-image' class='ui-widget-content draggable' />"+
					"</div>"+
					"<div id='ic-front-container' class='clearfix inner-border'>"+
						"<img id='ic-front-image' class='ui-widget-content draggable' />"+
					"</div>"+
				"</div>");

			if ( ! this.options.custom_controls) {
				$('#imgcrppr').append("<div id='ic-controls'>"+
						"<div id='ic-slider'></div>"+
						"<button type='button' id='ic-btn-rotate'>Rotate</button>"+
						"<button type='button' id='ic-btn-reset'>Reset</button>"+
						"<button type='button' id='ic-btn-crop'>Crop and Save</button>"+
					"</div>");
			} else {
				var coptions = this.options.controls;
				var controls = "<div id='" + coptions.container + "'>";

				if (coptions.zoom) { controls += coptions.zoom; }
				if (coptions.rotate) { controls += coptions.rotate; }
				if (coptions.reset) { controls += coptions.reset; }
				if (coptions.crop) { controls += coptions.crop; }

				controls += '</div';

				$(coptions.parent).append(controls);
			}
		},

		_rotate: function(angle) {
			if (typeof angle == 'undefined') {
				console.log(angle, this.angle)
				this.angle = 0;
			} else {
				this.angle = (this.angle + angle) % 360;				
			}

			this._setTransform({angle: this.angle});
		},

		_setTransform: function(options) {
			var scale, angle_tmp, angle;

			if (typeof options.angle == 'undefined') {
				angle = this.transform_values.angle;
			} else {
				this.transform_values.angle = options.angle;
				angle = options.angle;
			}

			if (typeof options.scale == 'undefined') {
				scale = this.transform_values.scale;
			} else {
				scale = options.scale;
				this.transform_values.scale = scale;
			}

			$('#ic-front-image').css({
				'-webkit-transform' : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'-moz-transform'    : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'-ms-transform'     : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'-o-transform'      : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'transform'         : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)'
			});

			$('#ic-back-image').css({
				'-webkit-transform' : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'-moz-transform'    : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'-ms-transform'     : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'-o-transform'      : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)',
				'transform'         : 'scale(' + scale + ')' + ' rotate(' + angle + 'deg)'
			});
		},

		_setUpCanvas: function() {
			var self = this,
				
				img_height = this.options.image_height,
				canvas_width = this.options.canvas_width,
				canvas_height = this.options.canvas_height,
				inner_height = this.options.inner_height,
				inner_width = this.options.inner_width,

				ratio = this.img_dimensions.ratio,
				size = img_height + 'px ' + img_height * ratio + 'px';

			$('#ic-canvas').css('width', canvas_width);
			$('#ic-canvas').css('height', canvas_height);


			$('#ic-back-image').css('width', canvas_width + 'px');
			$('#ic-back-image').css('height', canvas_width * ratio + 'px');

			$('#ic-front-image').css('width', img_height + 'px');
			$('#ic-front-image').css('height', img_height * ratio + 'px');

			$('#ic-front-container').css('width', inner_width + 'px');
			$('#ic-front-container').css('height', inner_height + 'px');

			$('#ic-back-container').css('width', canvas_width + 'px');
			$('#ic-back-container').css('height', canvas_height + 'px');

			$('#ic-front-image').attr('src', this.img.src);
			$('#ic-back-image').attr('src', this.img.src);

			this._makeDraggable();
			this._makeButtonsClickable();

			// Create the slider. 
			$("#ic-slider").slider({
				min: img_height,
				max: img_height * this.options.max_zoom_level,
				value: img_height,

				slide: function( event, ui ) {
					var width = ui.value,
						img_width = self.img_dimensions.new_width,
						img_height = self.img_dimensions.new_height,
						ratio = self.img_dimensions.ratio
						sy = img_width/self.options.image_height;

					self._setTransform({scale: sy});

					self.img_dimensions.new_width = width;
					self.img_dimensions.new_height = width / ratio;

				}
			});
		},

		_makeButtonsClickable: function() {
			var self = this;

			$('#ic-btn-reset').click(function() {
				self._moveToOrigin();
				self._rotate();
			});

			$('#ic-btn-rotate').click(function() {
				self._rotate(90);
			});

			$('#ic-btn-crop').click(function() {
				self._callback();
			});
		},

		_makeDraggable: function() {
			var self = this,
				startDrag = function(draggable, e, ui) {
					var x = draggable.offset().left - e.pageX,
						y = draggable.offset().top - e.pageY;

					$(window)
						.on('mousemove.draggable touchmove.draggable', function(e) {

							draggable
								.css({
									'bottom': 'auto',
									'right': 'auto'
								})
								.offset(function() {
									if (self.options.axis == 'y') {
										offset = {top: y + e.pageY};
									} else if (self.options.axis == 'x') {
										offset = {left: x + e.pageX};
									} else {
										offset = {
											left: x + e.pageX,
											top: y + e.pageY
										};
									}
									return offset;
								})
								.find('a').one('click.draggable', function(e) {
									e.preventDefault();
								});

							e.preventDefault();
						});
				};

			$('#ic-back-image').draggable({
				cursor: "crosshair",
				axis: this.options.axis,
				start: function(e, ui) {
					startDrag($('#ic-front-image'), e, ui);
				},
				stop: function(e, ui) {
					$(window).off('mousemove.draggable touchmove.draggable click.draggable');
				}
			});

			$('#ic-front-image').draggable({
				cursor: "crosshair",
				axis: this.options.axis,
				start: function(e, ui) {
					startDrag($('#ic-back-image'), e, ui);
				},
				stop: function(e, ui) {
					$(window).off('mousemove.draggable touchmove.draggable click.draggable');
				}
			});
		},

		_getImgDimensions: function(img) {
			var ratio = img.width / img.height;

			this.img_dimensions = {
				natural_width: img.width,
				natural_height: img.height,
				new_width: this.options.image_height * ratio,
				new_height: this.options.image_height,
				ratio: ratio
			};
		},

		_centerImage: function() {
			var height = this.options.image_height,
				ratio = this.img_dimensions.ratio;

			$('#ic-back-image').css('width', height * ratio + 'px');
			$('#ic-back-image').css('height', height + 'px');
			$('#ic-front-image').css('width', height * ratio + 'px');
			$('#ic-front-image').css('height', height + 'px');
		},

		_moveToOrigin: function() {
			var	ratio = this.img_dimensions.ratio,
				image_height = this.options.image_height,
				image_width = this.options.image_height * ratio,

				canvas_width = $('#ic-canvas').width(),
				canvas_height = $('#ic-canvas').height(),

				front_container_height = $('#ic-front-container').height(),
				front_container_width = $('#ic-front-container').width(),

				img_canvas_width_diff = (image_width - canvas_width) / 2,
				img_canvas_height = (image_width / ratio - canvas_height) / 2,

				container_canvas_width_diff = (canvas_width - front_container_width) / 2,
				cotainer_canvas_height_diff = (canvas_height - front_container_height) / 2,

				img_left_pos = -(img_canvas_width_diff + container_canvas_width_diff),
				img_top_pos = -(img_canvas_height + cotainer_canvas_height_diff),

				front_container_left_pos = (canvas_width - front_container_width) /2,
				front_container_top_pos = (canvas_height - front_container_height) / 2;

			$('#ic-front-image').css('left', img_left_pos + 'px');
			$('#ic-front-image').css('top', img_top_pos + 'px');

			$('#ic-back-image').css('left', -img_canvas_width_diff + 'px');
			$('#ic-back-image').css('top',  -img_canvas_height + 'px');

			$('#ic-front-container').css('left', front_container_left_pos + 'px');
			$('#ic-front-container').css('top', front_container_top_pos + 'px');

		},

		_getCropData: function() {
			var	x_value,
				y_value,

				x_scale_diff,
				y_scale_diff,
				
				ratio = this.img_dimensions.ratio,
				img_height = this.options.image_height,
				img_width = this.options.image_height * ratio,

				canvas_width = $('#ic-canvas').width(),
				canvas_height = $('#ic-canvas').height(),

				front_container_height = $('#ic-front-container').height(),
				front_container_width = $('#ic-front-container').width(),

				outer_img_rect = $('#ic-back-image')[0].getBoundingClientRect(),

				outer_img_left = parseInt($('#ic-back-image').css('left'), 10),
				outer_img_top = parseInt($('#ic-back-image').css('top'), 10);

			x_value = (canvas_width - front_container_width) / 2 - outer_img_left;
			y_value = (canvas_height - front_container_height) / 2 - outer_img_top;

			x_scale_diff = img_width - outer_img_rect.width;
			y_scale_diff = img_height - outer_img_rect.height;

			x_value -= x_scale_diff / 2;
			y_value -= y_scale_diff / 2;

			return {
				x: Math.round(x_value),
				y: Math.round(y_value),
				scale_width: Math.round(outer_img_rect.width),
				scale_height: Math.round(outer_img_rect.height),
				crop_width: Math.round(front_container_width),
				crop_height: Math.round(front_container_height),
				rotate_deg: Math.round(this.angle)
			};
		},

		_callback: function() {
			var crop_data = this._getCropData();
			this.options.callback(crop_data);
		}
		
	});


})(jQuery, window, document);
