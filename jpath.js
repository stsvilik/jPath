//jpath.js - is a library that allows filtering of JSON data based on pattern-like expression
(function(document, Array, undef) {	
	var 
		TRUE = !0,
		FALSE = !1,
		UNDEF = "undefined",
		STRING = "string",
		FUNCTION = "function",
		PERIOD = ".",
		SPACE = '',
		FLAGS = 'g',
		
		rxTokens = new RegExp("([A-Za-z0-9_\\*@]+(?:\\[.+?\\])?)", FLAGS),
		rxIndex = new RegExp("(\\S+)\\[(\\d+)\\]"),
		rxPairs = new RegExp("([\\w@\\.]+)\\s*([~><\\^\\*\\$\\!=]=?|\\?)\\s*([@\\w\\s_\\'\$\\.\\+]+)(\\s*|$)", FLAGS),
		rxCondition = new RegExp("(\\S+)\\[(.+)\\]"),
		trimBefore = new RegExp("^\\s\\s*"),
		trimAfter = new RegExp("\\s\\s*$"),
		
		app = Array.prototype.push,
		apc = Array.prototype.concat,
		
		hidden = {
			trim: function( s ) {
				return s.replace(trimBefore, SPACE).replace(trimAfter, SPACE);
			},
			toArray: function(o) {
				return o instanceof Array? o : (o === undef || o === null) ? []:[o];
			},
			traverse: function(pattern, cfn, obj){
				var out, data = (obj || this.data), temp, tokens, token, idxToken, index, expToken, condition, tail, self = arguments.callee, found, i, j, l;
				if(data && typeof(pattern) === STRING) {
					tokens = pattern.match(rxTokens); //dot notation splitter
					//Get first token
					token = tokens[0];
					//Trailing tokens
					tail = tokens.slice(1).join(PERIOD);
					
					if( data instanceof Array ) {
						temp = [];
						for(i = 0, l = data.length; l > i; i++) {
							j = data[i];
							found = self.apply(this, [token, null, j]);
							if(((found instanceof Array) && found.length) || found !== undef) {
								app.apply(temp, [found]);
							}
						}
						if(temp.length) {
							return tail ? self.apply(this, [tail, null, temp]) : temp;
						} else {
							return;	
						}
					} else if(token === "*") {
						return tail ? self.apply(this, [tail, null, data]) : data;
					} else if(data[token] !== undef) {
						return tail ? self.apply(this, [tail, null, data[token]]) : data[token];
					} else if( rxIndex.test(token) ) {
						idxToken = token.match(rxIndex);
						token = idxToken[1];
						index = +idxToken[2];
						return tail ? self.apply(this, [tail, null, data[token][index]]) : data[token][index];
					} else if( rxCondition.test(token) ) {
						expToken = token.match(rxCondition);
						token = expToken[1];
						condition = expToken[2];
						
						var evalStr, isMatch, subset = data[token], elem;
						
						if(subset instanceof Array) {
							temp = [];
							//Second loop here is faster than recursive call
							for(i = 0, l = subset.length; l > i; i++) {
								elem = subset[i];
								//Convert condition pairs to booleans
								evalStr = condition.replace(rxPairs, function($0, $1, $2, $3) {
									return hidden.testPairs.apply(elem, [$1, $3, $2, cfn]);
								});
								//Evaluate expression
								isMatch = eval(evalStr);
								if(isMatch) {
									app.apply(temp, [elem]);
								}
							}
							if(temp.length) {
								return tail ? self.apply(this, [tail, null, temp]) : temp;
							} else {
								return;	
							}
						} else {
							elem = data;
							//Convert condition pairs to booleans
							evalStr = condition.replace(rxPairs, function($0, $1, $2, $3) {
								return hidden.testPairs.apply(elem, [$1, $3, $2, cfn]);
							});
							//Evaluate expression
							isMatch = eval(evalStr);
							if(isMatch) {
								return tail ? self.apply(this, [tail, null, elem]) : elem;
							}
						}
					}
				}
				return out;
			},
			//Matches type of a to b
			matchTypes: function(a, b) {
				var _a, _b;
				switch(typeof(a)) {
					case STRING: _b = b+''; break;
					case "boolean": _b = b === "true"?TRUE:FALSE; break;
					case "number": _b = +b; break;
					case "date": _b = new Date(b).valueOf(); _a = a.valueOf(); break;
					default: _b = b;
				}
				if(b === "null") { _b = null; }
				if(b === "undefined") { _b = void(0); }
				return {left:(_a||a), right:_b};
			},
			testPairs: function(left, right, operator, fn) {
				var out = FALSE, 
					leftVal = left.indexOf(PERIOD) !== -1 ? hidden.traverse(left, null, this) : this[left],
					pairs = hidden.matchTypes(leftVal, trim(right));
				switch(operator) {
					case "=": out = (pairs.left === pairs.right); break;
					case "==": out = (pairs.left === pairs.right); break;
					case "!=": out = (pairs.left !== pairs.right); break;
					case "^=": out = (pairs.left+'').indexOf(pairs.right) === 0; break;
					case "<": out = (pairs.left < pairs.right); break;
					case "<=": out = (pairs.left <= pairs.right); break;
					case ">": out = (pairs.left > pairs.right); break;
					case ">=": out = (pairs.left >= pairs.right); break;
					case "~=": out = ((pairs.left+'').toLowerCase() === (pairs.right+'').toLowerCase()); break;
					case "$=": out = new RegExp(pairs.right+"$", "i").test(pairs.left); break;
					case "*=": out = (pairs.left+'').indexOf(pairs.right)!==-1; break;
					case "?": if(typeof(fn) === FUNCTION) { out = fn.call(this, left, right); } break;
				}
				return out;
			},
			merge: function(pattern) {
				var out = [], temp = hidden.toArray(pattern ? hidden.traverse.apply(this, arguments) : this.selection);
				out = apc.apply([], temp);
				return out;
			}
		},
	
	module = {};
	
	
	function JPath(obj) {
		if(!(this instanceof JPath)) {
			return new JPath(obj);	
		}
		this.data = obj || null;
		this.selection = [];
	}
	
	JPath.prototype = {
		from: function(obj) {
			this.data = obj;
			return this;
		},
		first: function(){
			return this.selection.length ? this.selection[0] : null;		
		},
		last:function(){
			return this.selection.length ? this.selection.slice(-1)[0] : null;	
		},
		eq: function(idx) {
			return this.selection.length ? this.selection[idx] : null;	
		},
		select:function(pattern, cfn, obj){
			this.selection = hidden.merge.apply(this, arguments);
			return this;
		},
		and: function(pattern) {
			this.selection = this.selection.concat(hidden.merge.apply(this, arguments));
			return this;
		},
		val: function() {
			return this.selection;	
		}
	};
	
	module.select = function(obj, pattern, cfn) {
		return JPath(obj).select(pattern, null, cfn);
	};

	//Backwards compatibility 1.0
	module.filter = function(obj, pattern, cfn) {
		return JPath(obj).select(pattern, null, cfn).val();
	};

	window.jPath = window.jPath || module;
})(document, Array);