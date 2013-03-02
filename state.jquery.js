/*
 * jQuery state plugin
 *
 * @author Disparity <disparity-github@yandex.ru>
 * @version 0.1.0-alpha
 */
(function($, undefined) {
	var stateParser = function(stateElem, setOrUnset) {
		var states = {};
		if (typeof stateElem === "string") {
			$.each($.grep(stateElem.split(" "), function(stateName) {
				return $.trim(stateName) !== "";
			}), function(index, stateName) {
				states[stateName] = setOrUnset;
			});
		}
		return states;
	}

	var stateNotificator = function($element, stateName, setOrUnset) {
		if (setOrUnset === undefined) {
			setOrUnset = $element.is("." + stateName);
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
	}

	var stateProcessor = function($element, stateName, setOrUnset) {
		if (typeof setOrUnset !== "boolean" && setOrUnset !== undefined) {
			throw {message: "Invalid argumment type"}; // @todo fix message
		}
		$element.toggleClass(stateName, setOrUnset);
		stateNotificator($element, stateName, setOrUnset);
	}

	$.fn.toggleState = function(state, setOrUnset) {
		var states = stateParser(state, setOrUnset);
		return this.each(function(index, element) {
			$.each(states, function(stateName, state) {
				stateProcessor($(element), stateName, state);
			});
		});
	}

	$.fn.addState = function(stateName) {return this.toggleState(stateName, true);}
	$.fn.removeState = function(stateName) {return this.toggleState(stateName, false);}
	$.fn.isInState = function(stateName) {return this.is("." + stateName);}

	$.fn.loadStates = function(dataKey) {
		return this.each(function() {
			var $element = $(this);
			$element.addState($element.data(dataKey || "state") || "");
		});
	}
})(jQuery);
