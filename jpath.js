//jpath.js - is a library that allows filtering of JSON data based on pattern-like expression
(function(Array, undef) {	
	var 
		TRUE = !0,
		FALSE = !1,
		STRING = "string",
		FUNCTION = "function",
		PERIOD = ".",
		SPACE = '',
		FLAGS = 'g',
		NULL = null,
		
        rxTokens = new RegExp("([A-Za-z0-9_\\*@\\$\\(\\)]+(?:\\[.+?\\])?)", "g"),
        rxIndex = /^(\S+)\((\d+)\)$/,
		rxPairs = new RegExp("([\\w@\\.\\(\\)]+)\\s*([~><\\^\\*\\$\\!=]=?|\\?)\\s*([\\S ]+)(\\s*|$)", "g"),
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
				return o instanceof Array? o : (o === undef || o === NULL) ? []:[o];
			},
			traverse: function(pattern, cfn, obj) {
				var out, data = (obj || this.data),
					temp, tokens, token, idxToken, index, expToken, condition, tail, self = arguments.callee,
					found, i, j, l;
				if (data && typeof(pattern) === STRING) {
					tokens = pattern.match(rxTokens); //dot notation splitter
					//Get first token
					token = tokens[0];
					//Trailing tokens
					tail = tokens.slice(1).join(PERIOD);
                    
					if (data instanceof Array) {
						temp = [];
						for (i = 0, l = data.length; l > i; i++) {
							j = data[i];
							found = self.apply(this, [token, cfn, j]);
							if (((found instanceof Array) && found.length) || found !== undef) {
								app.apply(temp, [found]);
							}
						}
						if (temp.length) {
							return tail ? self.apply(this, [tail, cfn, temp]) : temp;
						} else {
							return;
						}
					} else if (token === "*") {
						return tail ? self.apply(this, [tail, cfn, data]) : data;
					} else if (data[token] !== undef) {
						return tail ? self.apply(this, [tail, cfn, data[token]]) : data[token];
					} else if (rxIndex.test(token)) {
						idxToken = token.match(rxIndex);
						token = idxToken[1];
						index = +idxToken[2];
						temp = data[token];
						return tail ? self.apply(this, [tail, cfn, (temp && temp.length) ? temp[index] : temp]) : (temp && temp.length) ? temp[index] : temp;
					} else if (rxCondition.test(token)) {
						expToken = token.match(rxCondition);
						token = expToken[1];
						condition = expToken[2];
                        
						var evalStr, isMatch, subset = token === "*" ? data : data[token],
							elem;
                            
						if (subset instanceof Array) {
							temp = [];
							//Second loop here is faster than recursive call
							for (i = 0, l = subset.length; l > i; i++) {
								elem = subset[i];
								//Convert condition pairs to booleans
								evalStr = condition.replace(rxPairs, function($0, $1, $2, $3) {
									return hidden.testPairs.apply(elem, [$1, $3, $2, cfn]);
								});
								//Evaluate expression
								isMatch = eval(evalStr);
								if (isMatch) {
									app.apply(temp, [elem]);
								}
							}
							if (temp.length) {
								return tail ? self.apply(this, [tail, cfn, temp]) : temp;
							} else {
								return;
							}
						} else {
							elem = subset;
							//Convert condition pairs to booleans
							evalStr = condition.replace(rxPairs, function($0, $1, $2, $3) {
								return hidden.testPairs.apply(elem, [$1, $3, $2, cfn]);
							});
							//Evaluate expression
							isMatch = eval(evalStr);
							if (isMatch) {
								return tail ? self.apply(this, [tail, cfn, elem]) : elem;
							}
						}
					}
				}
				return out;
			},
			//Matches type of a to b
			matchTypes: function(a, b) {
				var _a, _b;
				switch (typeof(a)) {
				case "string":
					_b = b + '';
					break;
				case "boolean":
					_b = b === "true" ? TRUE : FALSE;
					break;
				case "number":
					_b = +b;
					break;
				case "date":
					_b = new Date(b).valueOf();
					_a = a.valueOf();
					break;
				default:
					_b = b;
				}
				if (b === "null") {
					_b = null;
				}
				if (b === "undefined") {
					_b = void(0);
				}
				return {
					left: (_a || a),
					right: _b
				};
			},
			testPairs: (function() {
				var conditions = {
					"=": function(l, r) {
						return l === r;
					},
					"==": function(l, r) {
						return l === r;
					},
					"!=": function(l, r) {
						return l !== r;
					},
					"^=": function(l, r) {
						return !((l + '').indexOf(r));
					},
					"<": function(l, r) {
						return l < r;
					},
					"<=": function(l, r) {
						return l <= r;
					},
					">": function(l, r) {
						return l > r;
					},
					">=": function(l, r) {
						return l >= r;
					},
					"~=": function(l, r) {
						return (l + '').toLowerCase() === (r + '').toLowerCase();
					},
					"$=": function(l, r) {
						return new RegExp(r + "$", "i").test(l);
					},
					"*=": function(l, r) {
						return (l + '').indexOf(r) >= 0;
					}
				};
                
				return function(left, right, operator, fn) {
					var out = FALSE,
						leftVal = left.indexOf(PERIOD) !== -1 ? hidden.traverse(left, null, this) : this[left],
						pairs = hidden.matchTypes(leftVal, hidden.trim(right));
					if (operator === "?") {
						if (typeof(fn) === FUNCTION) {
							out = fn.call(this, pairs.left, right);
						}
					} else {
						out = conditions[operator](pairs.left, pairs.right);
					}
					return out;
				};
			})(),
			merge: function(pattern) {
				var out = [],
					temp = hidden.toArray(pattern ? hidden.traverse.apply(this, arguments) : this.selection);
				out = apc.apply([], temp);
				return out;
			}
		},
	
	module = {};
	
	
	function JPath(obj) {
		if(!(this instanceof JPath)) {
			return new JPath(obj);	
		}
		this.data = obj || NULL;
		this.selection = [];
	}
	
	JPath.prototype = {
		//Sets JSON object source on the fly
		from: function(obj) {
			this.data = obj;
			return this;
		},
		//Returns the first element value of the search
		first: function(){
			return this.selection.length ? this.selection[0] : NULL;		
		},
		//Returns the last element value of the search
		last:function(){
			return this.selection.length ? this.selection.slice(-1)[0] : NULL;	
		},
		//Returns an exact element value specified by index position
		eq: function(idx) {
			return this.selection.length ? this.selection[idx] : NULL;	
		},
		//Performs a search on the JSON object
		select:function(pattern, cfn, obj){
			this.selection = hidden.merge.apply(this, arguments);
			return this;
		},
		//Appends result of additional search to original search results
		and: function(pattern) {
			this.selection = this.selection.concat(hidden.merge.apply(this, arguments));
			return this;
		},
		//Returns search results as an Array
		val: function() {
			return this.selection;	
		}
	};
	
	//Returns an insance if JPath object
	//@obj - JSON object
	//@pattern - <String> search pattern
	//@cfn - <Function> custom compare function. This function has two input arguments: @left, @right
	module.select = function(obj, pattern, cfn) {
		return JPath(obj).select(pattern, NULL, cfn);
	};

	//Returns a result of the selection <Array>
	//WARNING: This function returns references to the values contained in JSON object, so if you modify them they will affect your JSON object.
	//@obj - JSON object
	//@pattern - <String> search pattern
	//@cfn - <Function> custom compare function. This function has two input arguments: @left, @right
	module.filter = function(obj, pattern, cfn) {
		return JPath(obj).select(pattern, NULL, cfn).val();
	};

	window.jPath = window.jPath || module;
})(Array);