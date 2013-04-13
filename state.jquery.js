/*
 * jQuery state plugin
 *
 * @author Disparity <disparity-github@yandex.ru>
 * @version 0.1.5
 */
(function($, document, undefined) {
	"use strict";
	var state = {
		options: {
			eventNamespace: "state",
			dataPrefix    : "state-",
			stateDataKey  : "state",
			events        :
				[// @todo how many events to fire? ...
					"change.{namespace}",
					"change-{state_name}.{namespace}",
					"{action}.{namespace}",
					"{action}-{state_name}.{namespace}"
				]
		},

		storage:
			function(element, key, value) {
				if (value === undefined) {
					return $.data(element, this.options.dataPrefix + key);
				}
				$.data(element, this.options.dataPrefix + key, value);
				return undefined;
			},

		change:
			function($element, stateName, stateVal) {
				$element.toggleClass(stateName, stateVal);
			},

		is:
			function($element, stateName) {
				return $element.hasClass(stateName);
			},

		parser:
			function(stateElem, stateVal) {
				var states = {},
					stateNames = [];
				if (stateVal === null) {
					stateVal = undefined;
				}

				if (typeof stateElem === "string") {
					stateNames = $.grep(stateElem.split(/\s+/), function(stateName) {return $.trim(stateName) !== "";});
				}
				if ($.isArray(stateElem)) {
					stateNames = stateElem;
				}
				if ($.isPlainObject(stateElem)) {
					$.extend(states, stateElem);
				}
				$.each(stateNames, function(index, stateName) {
					states[stateName] = stateVal;
				});
				return states;
			},

		notificator:
			function($element, stateName, stateVal) {
				if (stateVal === undefined) {
					stateVal = this.is($element, stateName);
				}
				var replacements = {action: stateVal ? "add" : "remove", state_name: stateName, namespace: this.options.eventNamespace};

				$.each(this.options.events, function(index, eventName) {
					eventName = eventName.replace(/\{(\w+)\}/g, function(match, placeholder) {return replacements[placeholder];});
					var event = $.Event(eventName, {state: {name: stateName, value: stateVal}});
					event.preventDefault();
					$element.trigger(event);
				});
			},

		processor:
			function($element, stateName, stateVal) {
				if (typeof stateVal !== "boolean" && stateVal !== undefined) {
					throw {message: "Invalid argumment type"}; // @todo fix message
				}
				if (this.is($element, stateName) === stateVal) {
					return;
				}
				this.change($element, stateName, stateVal);
				this.notificator($element, stateName, stateVal);
			}
	};


	var handlers = {
		switchedState:
			function(event) {
				var groupStates = $.grep(state.storage(event.target, "one-groups") || [], function(variants) {return $.inArray(event.state.name, variants) !== -1;});

				$.each(groupStates, function(index, variants) {
					jQueryHandlers.removeState.call($(event.target), $.grep(variants, function(stateName) {return stateName !== event.state.name;}));
				});
			},

		onlyOne:
			function(event) {
				jQueryHandlers.removeState.call(event.data.$elements.not(this), event.state.name);
			}
	};


	var jQueryHandlers = {
		toggleState:
			function(states, stateVal) {
				states = state.parser(states, stateVal);
				return this.each(function(index, element) {
					$.each(states, function(stateName, stateVal) {
						state.processor($(element), stateName, stateVal);
					});
				});
			},

		addState:
			function(states) {return jQueryHandlers.toggleState.call(this, states, true);},

		removeState:
			function(states) {return jQueryHandlers.toggleState.call(this, states, false);},

		joinByState:
			function(states) {
				var events = $.map(state.parser(states), function(tmp, stateName) {
					return "add-" + stateName + "." + state.options.eventNamespace;
				});
				return this.bind(events.join(" "), {$elements: this}, handlers.onlyOne);
			},

		onlyOneState:
			function(states) {
				states = $.map(state.parser(states), function(tmp, index) {return index;});
				return this
					.each(function() {
						var stateGroups = (state.storage(this, "one-groups") || []);
						stateGroups.push(states);
						state.storage(this, "one-groups", stateGroups);
					});
			},

		loadStates:
			function(dataKey) {
				var groups = {};
				this.each(function() {
					var element = this,
						$element = $(this),
						stateStr = $element.data(dataKey || state.options.stateDataKey) || "";

					stateStr = stateStr.replace(/\{(.*?)\}/g, function(match, stateStr) {
						stateStr.replace(/(\w+)(\.\w+)?/g, function(match, stateName, stateGroup) {
							stateGroup = stateGroup || ".default";
							(groups[stateGroup] || (groups[stateGroup] = {}) && (groups[stateGroup][stateName] || (groups[stateGroup][stateName] = [])));
							groups[stateGroup][stateName].push(element);
						});
						return "";
					});
					stateStr = stateStr.replace(/\[(.*?)\]/g, function(match, states) {
						jQueryHandlers.onlyOneState.call($element, states);
						return "";
					});

					jQueryHandlers.addState.call($element, stateStr);
				});

				$.each(groups, function(group) {
					$.each(groups[group], function(stateName, elements) {
						jQueryHandlers.joinByState.call($(elements), stateName);
					});
				});
				return this;
			},

		state:
			function() {
				// .state("state", boolean) | .state("state", null) | .state({state: boolean})
				if (arguments.length === 2 && (typeof arguments[1] === "boolean" || arguments[1] === null || arguments[1] === undefined) ||
					arguments.length === 1 && $.isPlainObject(arguments[0]))
				{
					return jQueryHandlers.toggleState.apply(this, arguments);
				}
				// .state("state")
				if (arguments.length === 1 && !$.isPlainObject(arguments[0])) {
					return state.is(this, arguments[0]);
				}
				// .state("only one", "group by")
				if (arguments.length === 2 &&
					(typeof arguments[0] === "string" || $.isArray(arguments[0]) || $.isPlainObject(arguments[0])) &&
					(typeof arguments[1] === "string" || $.isArray(arguments[1]) || $.isPlainObject(arguments[1]))
				) {
					jQueryHandlers.onlyOneState.call(this, arguments[0]);
					jQueryHandlers.joinByState.call(this, arguments[1]);
					return this;
				}
				// .state()
				if (arguments.length === 0) {
					return jQueryHandlers.loadStates.call(this);
				}

				throw {message: "Unexpected usage \"state\""};
			},

		filter:
			function(element, i, match) {
				var args = match[3].split(","),
					stateName = args[0],
					stateVal = args[1] !== undefined && $.trim(args[1]) === "false" ? false : true;
				return state.is($(element), stateName) === stateVal;
			}
	};


	$.fn.state = jQueryHandlers.state;
	$.extend($.expr[":"], {state: jQueryHandlers.filter});
	$(function() {
		$(document.body).bind("add." + state.options.eventNamespace, handlers.switchedState);
	});
})(jQuery, window.document);
