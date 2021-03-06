"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var ReactDOM = require('react-dom');

var utils = require('./utils');
var scrollSpy = require('./scroll-spy');
var defaultScroller = require('./scroller');
var assign = require('object-assign');
var PropTypes = require('prop-types');

var scrollHash = require('./scroll-hash');

var protoTypes = {
  to: PropTypes.string.isRequired,
  containerId: PropTypes.string,
  container: PropTypes.object,
  activeClass: PropTypes.string,
  spy: PropTypes.bool,
  smooth: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  offset: PropTypes.number,
  delay: PropTypes.number,
  isDynamic: PropTypes.bool,
  onClick: PropTypes.func,
  duration: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  absolute: PropTypes.bool,
  onSetActive: PropTypes.func,
  onSetInactive: PropTypes.func,
  ignoreCancelEvents: PropTypes.bool,
  hashSpy: PropTypes.bool
};

var Helpers = {
  Scroll: function Scroll(Component, customScroller) {

    var scroller = customScroller || defaultScroller;

    var _ = function (_React$Component) {
      _inherits(_, _React$Component);

      function _(props) {
        _classCallCheck(this, _);

        var _this = _possibleConstructorReturn(this, (_.__proto__ || Object.getPrototypeOf(_)).call(this, props));

        _this.scrollTo = _this.scrollTo.bind(_this);
        _this.handleClick = _this.handleClick.bind(_this);
        _this.stateHandler = _this.stateHandler.bind(_this);
        _this.spyHandler = _this.spyHandler.bind(_this);

        _this.state = {
          active: false
        };
        return _this;
      }

      _createClass(_, [{
        key: 'scrollTo',
        value: function scrollTo(to, props) {
          scroller.scrollTo(to, _extends({}, this.state, props));
        }
      }, {
        key: 'handleClick',
        value: function handleClick(event) {

          /*
           * give the posibility to override onClick
           */

          if (this.props.onClick) {
            this.props.onClick(event);
          }

          /*
           * dont bubble the navigation
           */

          if (event.stopPropagation) event.stopPropagation();
          if (event.preventDefault) event.preventDefault();

          /*
           * do the magic!
           */
          this.scrollTo(this.props.to, this.props);
        }
      }, {
        key: 'stateHandler',
        value: function stateHandler() {
          var to = this.props.to;

          if (scroller.getActiveLink() !== to) {
            if (this.state !== null && this.state.active && this.props.onSetInactive) {
              this.props.onSetInactive();
            }
            this.setState({ active: false });
          }
        }
      }, {
        key: 'spyHandler',
        value: function spyHandler(y) {
          var scrollSpyContainer = this.getScrollSpyContainer();

          if (scrollHash.isMounted() && !scrollHash.isInitialized()) {
            return;
          }

          var to = this.props.to;

          var element = null;
          var elemTopBound = 0;
          var elemBottomBound = 0;

          var containerTop = 0;
          if (scrollSpyContainer.getBoundingClientRect) {
            var containerCords = scrollSpyContainer.getBoundingClientRect();
            containerTop = containerCords.top;
          }

          if (!element || this.props.isDynamic) {
            element = scroller.get(to);
            if (!element) {
              return;
            }

            var cords = element.getBoundingClientRect();
            elemTopBound = cords.top - containerTop + y;
            elemBottomBound = elemTopBound + cords.height;
          }

          var offsetY = y - this.props.offset;
          // var isInside = (offsetY >= Math.floor(elemTopBound) && offsetY <= Math.floor(elemBottomBound));
          // var isOutside = (offsetY < Math.floor(elemTopBound) || offsetY > Math.floor(elemBottomBound));
          var isInside = offsetY >= Math.floor(elemTopBound) && offsetY < Math.floor(elemBottomBound);
          var isOutside = offsetY < Math.floor(elemTopBound) || offsetY >= Math.floor(elemBottomBound);
          var activeLink = scroller.getActiveLink();

          if (isOutside) {
            if (to === activeLink) {
              scroller.setActiveLink(void 0);
            }

            if (this.props.hashSpy && scrollHash.getHash() === to) {
              scrollHash.changeHash();
            }

            if (this.props.spy && this.state.active) {
              this.setState({ active: false });

              if (this.props.onSetInactive) {
                this.props.onSetInactive();
              }
            }
          } else if (isInside && activeLink !== to) {
            scroller.setActiveLink(to);

            if (this.props.hashSpy) {
              scrollHash.changeHash(to);
            }

            if (this.props.spy) {
              this.setState({ active: true });
              if (this.props.onSetActive) {
                this.props.onSetActive(to);
              }
            }

            scrollSpy.updateStates();
          }
        }
      }, {
        key: 'getScrollSpyContainer',
        value: function getScrollSpyContainer() {
          var containerId = this.props.containerId;
          var container = this.props.container;

          var scrollSpyContainer;

          if (containerId) {
            scrollSpyContainer = document.getElementById(containerId);
          } else if (container && container.nodeType) {
            scrollSpyContainer = container;
          } else {
            scrollSpyContainer = utils.getScrollParent(ReactDOM.findDOMNode(this));
          }

          return scrollSpyContainer;
        }
      }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
          if (this.props.spy || this.props.hashSpy) {
            var scrollSpyContainer = this.getScrollSpyContainer();

            if (!scrollSpy.isMounted(scrollSpyContainer)) {
              scrollSpy.mount(scrollSpyContainer);
            }

            if (this.props.hashSpy) {
              if (!scrollHash.isMounted()) {
                scrollHash.mount(scroller);
              }
            }

            if (this.props.spy) {
              scrollSpy.addStateHandler(this.stateHandler);
            }

            scrollSpy.addSpyHandler(this.spyHandler, scrollSpyContainer);

            this.setState({
              container: scrollSpyContainer
            });
          }
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          scrollSpy.unmount(this.stateHandler, this.spyHandler);
        }
      }, {
        key: 'render',
        value: function render() {
          var className = "";

          if (this.state && this.state.active) {
            className = ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim();
          } else {
            className = this.props.className;
          }

          var props = assign({}, this.props);

          for (var prop in protoTypes) {
            if (props.hasOwnProperty(prop)) {
              delete props[prop];
            }
          }

          props.className = className;
          props.onClick = this.handleClick;

          return React.createElement(Component, props);
        }
      }]);

      return _;
    }(React.Component);

    ;
    _.propTypes = protoTypes;
    _.defaultProps = { offset: 0 };
    return _;
  },

  Element: function Element(Component) {
    var _ = function (_React$Component2) {
      _inherits(_, _React$Component2);

      function _(props) {
        _classCallCheck(this, _);

        var _this2 = _possibleConstructorReturn(this, (_.__proto__ || Object.getPrototypeOf(_)).call(this, props));

        _this2.registerElems = _this2.registerElems.bind(_this2);
        _this2.childBindings = {
          domNode: null
        };
        return _this2;
      }

      _createClass(_, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
          this.registerElems(this.props.name);
        }
      }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(nextProps) {
          if (this.props.name !== nextProps.name) {
            this.registerElems(nextProps.name);
          }
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          defaultScroller.unregister(this.props.name);
        }
      }, {
        key: 'registerElems',
        value: function registerElems(name) {
          defaultScroller.register(name, this.childBindings.domNode);
        }
      }, {
        key: 'render',
        value: function render() {
          return React.createElement(Component, _extends({}, this.props, { parentBindings: this.childBindings }));
        }
      }]);

      return _;
    }(React.Component);

    ;
    _.propTypes = {
      name: PropTypes.string,
      id: PropTypes.string
    };
    return _;
  }
};

module.exports = Helpers;