/*
 * jQuery state plugin
 *
 * @author Disparity <disparity-github@yandex.ru>
 * @version 0.1.3
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
		if ($element.isInState(stateName) === setOrUnset) {
			return;
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

	$.fn.addState = function(state) {return this.toggleState(state, true);}
	$.fn.removeState = function(state) {return this.toggleState(state, false);}
	$.fn.isInState = function(stateName) {return this.is("." + stateName);}

	$.fn.loadStates = function(dataKey) {
		return this.each(function() {
			var $element = $(this);
			$element.addState($element.data(dataKey || "state") || "");
		});
	}

	$.fn.joinByState = function(state) {
		var states = stateParser(state);
		var $elements = this;
		$.each(states, function(stateName) {
			$elements.bind("set.state-" + stateName, function() {
				$elements.not(this).removeState(stateName);
			});
		});
		return this;
	}
})(jQuery);
