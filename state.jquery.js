/*
 * jQuery state plugin
 *
 * @author Disparity <disparity-github@yandex.ru>
 * @version 0.1.4
 */
(function($, undefined) {
	var state = {
		change:
			function($element, stateName, setOrUnset) {
				$element.toggleClass(stateName, setOrUnset);
			},

		is:
			function($element, stateName) {
				return $element.is("." + stateName);
			},

		parser:
			function(stateElem, setOrUnset) {
				var states = {};
				if (typeof stateElem === "string") {
					$.each($.grep(stateElem.split(" "), function(stateName) {
						return $.trim(stateName) !== "";
					}), function(index, stateName) {
						states[stateName] = setOrUnset;
					});
				}
				return states;
			},

		notificator:
			function($element, stateName, setOrUnset) {
				if (setOrUnset === undefined) {
					setOrUnset = $element.isInState(stateName);
				}
				// @todo how many events to fire? ...
				var notificationTypes = [
					"change.state",
					(setOrUnset ? "set" : "remove") + ".state",
					"change.state-" + stateName,
					(setOrUnset ? "set" : "remove") + ".state-" + stateName
				];

				$.each(notificationTypes, function(index, notificationType) {
					var event = $.Event(notificationType, {state: {name: stateName, value: setOrUnset}});
					event.preventDefault();
					$element.trigger(event);
				});
			},

		processor:
			function($element, stateName, setOrUnset) {
				if (typeof setOrUnset !== "boolean" && setOrUnset !== undefined) {
					throw {message: "Invalid argumment type"}; // @todo fix message
				}
				if ($element.isInState(stateName) === setOrUnset) {
					return;
				}
				this.change($element, stateName, setOrUnset);
				this.notificator($element, stateName, setOrUnset);
			}
	};


	$.fn.toggleState = function(states, setOrUnset) {
		states = state.parser(states, setOrUnset);
		return this.each(function(index, element) {
			$.each(states, function(stateName, setOrUnset) {
				state.processor($(element), stateName, setOrUnset);
			});
		});
	}

	$.fn.addState = function(states) {return this.toggleState(states, true);}
	$.fn.removeState = function(states) {return this.toggleState(states, false);}
	$.fn.isInState = function(stateName) {return state.is(this, stateName);}

	$.fn.loadStates = function(dataKey) {
		return this.each(function() {
			var $element = $(this);
			$element.addState($element.data(dataKey || "state") || "");
		});
	}

	$.fn.joinByState = function(states) {
		states = state.parser(states);
		var $elements = this;
		$.each(states, function(stateName) {
			$elements.bind("set.state-" + stateName, function() {
				$elements.not(this).removeState(stateName);
			});
		});
		return this;
	}

	$.fn.state = function(states, setOrUnset) {
		if (setOrUnset === undefined && !$.isPlainObject(states)) {
			return this.isInState(states);
		}
		return this.toggleState(states, setOrUnset);
	}
})(jQuery);
