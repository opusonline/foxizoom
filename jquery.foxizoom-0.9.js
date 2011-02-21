/*!
 * name: foxizoom
 * author: Stefan Benicke - www.opusonline.at
 * version: 0.9
 * last update: 21.02.2011
 * category: jQuery plugin
 * license: GNU GPLv3
 */
(function($){
	
	var foxizoom_defaults = {
		zoomWidth: 'auto', // original image size
		zoomHeight: 'auto',
		xOffset: 10,
		yOffset: 0,
		title: true,
		preload: true,
		position: 'right', // left, right, inside
		fadeSpeed: 200,
		smoothMove: 3,
		onStart: function(){},
		onComplete: function(){},
		onClose: function(){}
	};
	
	$.fn.foxizoomDefaults = function(options){
		$.extend(foxizoom_defaults, options);
		return this;
	};
	
	$.fn.foxizoom = function(defaults){
		
		var defaults = $.extend({}, foxizoom_defaults, defaults),
		container_div = '<div class="foxizoom_image_container"><div class="foxizoom_title"></div><img class="foxizoom_image" /></div>';
		
		if (!$('#foxizoom').length) {
			$('body').append('<div id="foxizoom">' + container_div + '</div><div id="foxizoom_lens"></div>');
		}
		
		return this.each(function(){
			
			var options = defaults,
				$link = $(this),
				$me = $link.children('img'),
				source = $link.attr('href'),
				rel = $link.attr('rel'),
				big = new Image(),
				loaded = false,
        border_top_width = parseInt($me.css('border-top-width')),
        border_left_width = parseInt($me.css('border-left-width')),
				orig_top = Math.round($me.offset().top) + (isNaN(border_top_width) ? 0 : border_top_width) + parseInt($me.css('padding-top')),
				orig_left = Math.round($me.offset().left) + (isNaN(border_left_width) ? 0 : border_left_width) + parseInt($me.css('padding-left')),
				orig_width = Math.round($me.width()),
				orig_height = Math.round($me.height()),
				title = $link.attr('title') || $me.attr('title'),
				$lens = $('#foxizoom_lens'),
				container_top,
				container_left,
				container_width,
				container_height,
				lens_width,
				lens_height,
				lens_top,
				lens_left,
				lens_bottom,
				lens_right,
				image_top,
				image_left,
				mouse_top,
				mouse_left,
				timer,
				load_timer,
				error = false;
			
			if (rel != '') {
				//var rel_options = {};
				eval('var rel_options = {' + rel + '}');
				options = $.extend({}, options, rel_options);
			}
			
			var extern = options.position.match(/^#[^\ ]+/gi);
			if (extern) {
				var $extern = $(extern[0]);
				if (!$extern.length) extern = null;
				if (!$extern.data('set')) {
					$extern.html(container_div).data('set', true);
				}
			}
			var $container = extern ? $extern : $('#foxizoom'),
				$title = $container.find('.foxizoom_title'),
				$image_container = $container.find('.foxizoom_image_container'),
				$image = $container.find('.foxizoom_image');
		
			if (options.smoothMove < 1) options.smoothMove = 1;
			
			$('<div class="foxizoom_layer" style="top:'+orig_top+'px;left:'+orig_left+'px;width:'+orig_width+'px;height:'+orig_height+'px"></div>').appendTo('body')
				.bind('mouseenter', enter).bind('mouseleave', leave).bind('mousemove', update);
			
			if (options.preload) load();
			
			function load() {
				if (loaded) return;
				try {
					big.src = source;
				} catch(err) {
					error = true;
				}
				big.onload = function(){
					loaded = true;
				};
				big.onerror = function(){
					error = true;
				};
			}
			
			function enter(event) {
				mouse_top = event.pageY;
				mouse_left = event.pageX;
				options.onStart.call($link);
				container_width = options.zoomWidth == 'auto' ? orig_width : options.zoomWidth;
				container_height = options.zoomHeight == 'auto' ? orig_height : options.zoomHeight;
				if (options.position == 'inside') {
					container_top = orig_top;
					container_left = orig_left;
					container_width = orig_width;
					container_height = orig_height;
					$container.addClass('inside');
				} else if (!extern) {
					container_top = orig_top + options.yOffset;
					container_left = options.position == 'left' ? orig_left - options.xOffset - container_width : orig_left + orig_width + options.xOffset;
					$container.removeClass('inside');
				}
				if (extern) {
					container_width = $container.width();
					container_height = $container.height();
				}
				if (title != '' && options.title) {
					var new_title = title;
					if (typeof options.title == 'function') {
						new_title = options.title.call($link, title);
					}
					$title.html(new_title).show();
				} else {
					$title.hide();
				}
				$image.hide();
				$image_container.css({width: container_width, height: container_height});
				if (!extern) $container.css({top:container_top, left:container_left});
				$container.stop(true, true).fadeIn(options.fadeSpeed);
				if (!loaded) $image_container.addClass('loading');
				if (!options.preload) load();
				start();
			}
			
			function leave() {
				clearTimeout(timer);
				clearTimeout(load_timer);
				if (loaded && options.position != 'inside') $lens.hide();
				$container.fadeOut(options.fadeSpeed, function(){
					options.onClose.call($link);
				});
			}
			
			function update(event) {
				mouse_top = event.pageY;
				mouse_left = event.pageX;
			}
			
			function start() {
				if (!loaded) {
					if (!error) load_timer = setTimeout(start, 100);
					return;
				}
				$image_container.removeClass('loading');
				lens_width = Math.round(orig_width / big.width * container_width);
				lens_height = Math.round(orig_height / big.height * container_height);
				lens_right = orig_left + orig_width - lens_width;
				lens_bottom = orig_top + orig_height - lens_height;
				lens_top = Math.round(mouse_top - lens_height / 2);
				lens_left = Math.round(mouse_left - lens_width / 2);
				if (lens_top < orig_top) lens_top = orig_top;
				if (lens_top > lens_bottom) lens_top = lens_bottom;
				if (lens_left < orig_left) lens_left = orig_left;
				if (lens_left > lens_right) lens_left = lens_right;
				if (options.position != 'inside') $lens.css({width:lens_width, height:lens_height, top: lens_top, left: lens_left}).show();
				image_top = Math.round(big.height / orig_height * (lens_top - orig_top)) * -1;
				image_left = Math.round(big.width / orig_width * (lens_left - orig_left)) * -1;
				$image.attr('src', big.src).css({width:big.width, height:big.height, top:image_top, left:image_left}).show();
				options.onComplete.call($link);
				move();
			}
			
			function move() {
				lens_top = Math.round(mouse_top - lens_height / 2);
				lens_left = Math.round(mouse_left - lens_width / 2);
				if (lens_top < orig_top) lens_top = orig_top;
				if (lens_top > lens_bottom) lens_top = lens_bottom;
				if (lens_left < orig_left) lens_left = orig_left;
				if (lens_left > lens_right) lens_left = lens_right;
				if (options.position != 'inside') $lens.css({top: lens_top, left: lens_left});
				var new_image_top = big.height / orig_height * (lens_top - orig_top),
					new_image_left = big.width / orig_width * (lens_left - orig_left);
				image_top += Math.round((-new_image_top - image_top) / options.smoothMove);
				image_left += Math.round((-new_image_left - image_left) / options.smoothMove);
				$image.css({top:image_top, left:image_left});
				timer = setTimeout(move, 30);
			}
			
		});
		
	};
	
})(jQuery)