'use strict';

var assign = require('object-assign');

var utils = require('./utils');
var smooth = require('./smooth');

var cancelEvents = require('./cancel-events');

var events = require('./scroll-events');

/*
 * Gets the easing type from the smooth prop within options.
 */
var getAnimationType = function getAnimationType(options) {
  return smooth[options.smooth] || smooth.defaultEasing;
};

/*
 * Function helper
 */
var functionWrapper = function functionWrapper(value) {
  return typeof value === 'function' ? value : function () {
    return value;
  };
};

/*
 * Wraps window properties to allow server side rendering
 */
var currentWindowProperties = function currentWindowProperties() {
  if (typeof window !== 'undefined') {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame;
  }
};

/*
 * Helper function to never extend 60fps on the webpage.
 */
var requestAnimationFrameHelper = function () {
  return currentWindowProperties() || function (callback, element, delay) {
    window.setTimeout(callback, delay || 1000 / 60, new Date().getTime());
  };
}();

var __currentPositionY = 0;
var __startPositionY = 0;
var __targetPositionY = 0;
var __progress = 0;
var __duration = 0;
var __cancel = false;

var __target;
var __containerElement;
var __to;
var __start;
var __deltaTop;
var __percent;
var __delayTimeout;

var currentPositionY = function currentPositionY() {
  if (__containerElement && __containerElement !== document && __containerElement !== document.body) {
    return __containerElement.scrollTop;
  } else {
    var supportPageOffset = window.pageXOffset !== undefined;
    var isCSS1Compat = (document.compatMode || "") === "CSS1Compat";
    return supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
  }
};

var scrollContainerHeight = function scrollContainerHeight() {
  if (__containerElement && __containerElement !== document && __containerElement !== document.body) {
    return Math.max(__containerElement.scrollHeight, __containerElement.offsetHeight, __containerElement.clientHeight);
  } else {
    var body = document.body;
    var html = document.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
  }
};

var animateTopScroll = function animateTopScroll(easing, timestamp) {

  // Cancel on specific events
  if (__cancel) {
    if (events.registered['end']) {
      events.registered['end'](__to, __target, __currentPositionY);
    }
    return;
  };

  __deltaTop = Math.round(__targetPositionY - __startPositionY);

  if (__start === null) {
    __start = timestamp;
  }

  __progress = timestamp - __start;

  __percent = __progress >= __duration ? 1 : easing(__progress / __duration);

  __currentPositionY = __startPositionY + Math.ceil(__deltaTop * __percent);

  if (__containerElement && __containerElement !== document && __containerElement !== document.body) {
    __containerElement.scrollTop = __currentPositionY;
  } else {
    window.scrollTo(0, __currentPositionY);
  }

  if (__percent < 1) {
    var easedAnimate = animateTopScroll.bind(null, easing);
    requestAnimationFrameHelper.call(window, easedAnimate);
    return;
  }

  if (events.registered['end']) {
    events.registered['end'](__to, __target, __currentPositionY);
  }
};

var setContainer = function setContainer(options) {
  __containerElement = !options ? null : options.containerId ? document.getElementById(options.containerId) : options.container && options.container.nodeType ? options.container : options.element && options.element.nodeType ? utils.getScrollParent(options.element) : document;
};

var startAnimateTopScroll = function startAnimateTopScroll(y, options, to, target) {

  window.clearTimeout(__delayTimeout);

  if (!options.ignoreCancelEvents) {
    /*
     * Sets the cancel trigger
     */

    cancelEvents.register(function () {
      __cancel = true;
    });
  }

  setContainer(options);

  __start = null;
  __cancel = false;
  __startPositionY = currentPositionY();
  __targetPositionY = options.absolute ? y : y + __startPositionY;
  __deltaTop = Math.round(__targetPositionY - __startPositionY);

  __duration = functionWrapper(options.duration)(__deltaTop);
  __duration = isNaN(parseFloat(__duration)) ? 1000 : parseFloat(__duration);
  __to = to;
  __target = target;

  var easing = getAnimationType(options);
  var easedAnimate = animateTopScroll.bind(null, easing);

  if (options && options.delay > 0) {
    __delayTimeout = window.setTimeout(function animate() {
      requestAnimationFrameHelper.call(window, easedAnimate);
    }, options.delay);
    return;
  }

  requestAnimationFrameHelper.call(window, easedAnimate);
};

function proceedOptions(options) {
  if (options && options.nodeType) {
    options = { element: options };
  } else {
    options = assign({}, options);
  }
  options.absolute = true;

  return options;
}

var scrollToTop = function scrollToTop(options) {
  startAnimateTopScroll(0, proceedOptions(options));
};

var scrollTo = function scrollTo(toY, options) {
  startAnimateTopScroll(toY, proceedOptions(options));
};

var scrollToBottom = function scrollToBottom(options) {
  options = proceedOptions(options);
  setContainer(options);
  startAnimateTopScroll(scrollContainerHeight(), options);
};

var scrollMore = function scrollMore(toY, options) {
  options = proceedOptions(options);
  setContainer(options);
  startAnimateTopScroll(currentPositionY() + toY, options);
};

module.exports = {
  animateTopScroll: startAnimateTopScroll,
  getAnimationType: getAnimationType,
  scrollToTop: scrollToTop,
  scrollToBottom: scrollToBottom,
  scrollTo: scrollTo,
  scrollMore: scrollMore
};