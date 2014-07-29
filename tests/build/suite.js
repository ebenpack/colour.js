!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.tests=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":3}],2:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],3:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":2,"1YiZ5S":5,"inherits":4}],4:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(_dereq_,module,exports){
var hslToRgb, rgbToHsl, parseColor, cache, div;
/**
 * A color with both rgb and hsl representations.
 * @class Color
 * @param {string} color Any legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 */
function Color(color, alpha){
    var hsl, rgb;
    var parsed_color = {};
    if (typeof color === 'string'){
        color = color.toLowerCase();
        if (color in cache){
            parsed_color = cache[color];
        } else {
            parsed_color = parseColor(color);
            cache[color] = parsed_color;
        }
        rgb = parsed_color;
        hsl = rgbToHsl(parsed_color.r, parsed_color.g, parsed_color.b);
        alpha = parsed_color.a || alpha || 1;
    } else if ('r' in color){
        rgb = color;
        hsl = rgbToHsl(color.r, color.g, color.b);
        alpha = hsl.a || alpha || 1;
    } else if ('h' in color){
        hsl = color;
        rgb = hslToRgb(color.h, color.s, color.l);
        alpha = rgb.a || alpha || 1;
    }
    this.rgb = {'r': rgb.r, 'g': rgb.g, 'b': rgb.b};
    this.hsl = {'h': hsl.h, 's': hsl.s, 'l': hsl.l};
    this.alpha = alpha;
}
/**
 * Lighten a color by the given percentage.

 * @method
 * @param  {number} percent
 * @return {Color}
 */
Color.prototype.lighten = function(percent){
    var hsl = this.hsl;
    var lum = hsl.l + percent;
    if (lum > 100){
        lum = 100;
    }
    return new Color({'h':hsl.h, 's':hsl.s, 'l':lum}, this.alpha);
};
/**
 * Darken a color by the given percentage.
 * @method
 * @param  {number} percent
 * @return {Color}
 */
Color.prototype.darken = function(percent){
    var hsl = this.hsl;
    var lum = hsl.l - percent;
    if (lum < 0){
        lum = 0;
    }
    return new Color({'h':hsl.h, 's':hsl.s, 'l':lum}, this.alpha);
};
/**
* @param {number} h Hue
* @param {number} s Saturation
* @param {number} l Luminance
* @return {{r: number, g: number, b: number}}
*/
hslToRgb = function(h, s, l){
    function _v(m1, m2, hue){
        hue = hue;
        if (hue < 0){hue+=1;}
        if (hue > 1){hue-=1;}
        if (hue < (1/6)){
            return m1 + (m2-m1)*hue*6;
        }
        if (hue < 0.5){
            return m2;
        }
        if (hue < (2/3)){
            return m1 + (m2-m1)*((2/3)-hue)*6;
        }
        return m1;
    }
    var m2;
    var fraction_l = (l/100);
    var fraction_s = (s/100);
    if (s === 0){
        var gray = fraction_l*255;
        return {'r': gray, 'g': gray, 'b': gray};
    }
    if (l <= 50){
        m2 = fraction_l * (1+fraction_s);
    }
    else{
        m2 = fraction_l+fraction_s-(fraction_l*fraction_s);
    }
    var m1 = 2*fraction_l - m2;
    h = h / 360;
    return {'r': Math.round(_v(m1, m2, h+(1/3))*255), 'g': Math.round(_v(m1, m2, h)*255), 'b': Math.round(_v(m1, m2, h-(1/3))*255)};
};
/**
 * @param  {number} r Red
 * @param  {number} g Green
 * @param  {number} b Blue
 * @return {{h: number, s: number, l: number}}
 */
rgbToHsl = function(r, g, b){
    r = r / 255;
    g = g / 255;
    b = b / 255;
    var maxc = Math.max(r, g, b);
    var minc = Math.min(r, g, b);
    var l = Math.round(((minc+maxc)/2)*100);
    if (l > 100) {l = 100;}
    if (l < 0) {l = 0;}
    var h, s;
    if (minc === maxc){
        return {'h': 0, 's': 0, 'l': l};
    }
    if (l <= 50){
        s = (maxc-minc) / (maxc+minc);
    }
    else{
        s = (maxc-minc) / (2-maxc-minc);
    }
    var rc = (maxc-r) / (maxc-minc);
    var gc = (maxc-g) / (maxc-minc);
    var bc = (maxc-b) / (maxc-minc);
    if (r === maxc){
        h = bc-gc;
    }
    else if (g === maxc){
        h = 2+rc-bc;
    }
    else{
        h = 4+gc-rc;
    }
    h = (h/6) % 1;
    if (h < 0){h+=1;}
    h = Math.round(h*360);
    s = Math.round(s*100);
    if (h > 360) {h = 360;}
    if (h < 0) {h = 0;}
    if (s > 100) {s = 100;}
    if (s < 0) {s = 0;}
    return {'h': h, 's': s, 'l': l};
};
div = document.createElement('div');
/**
 * Parse a CSS color value and return an rgba color object.
 * @param  {string} color A legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 * @return {{r: number, g: number, b: number, a: number}}   rgba color object.
 * @throws {ColorError} If illegal color value is passed.
 */
parseColor = function(color){
    // TODO: How cross-browser compatible is this? How efficient?
    // Make a temporary HTML element styled with the given color string
    // then extract and parse the computed rgb(a) value.
    // N.B. This can create a loooot of DOM nodes. It's not a great method.
    // TODO: Fix
    div.style.backgroundColor = color;
    var rgba = div.style.backgroundColor;
    // Convert string in form 'rgb[a](num, num, num[, num])' to array ['num', 'num', 'num'[, 'num']]
    rgba = rgba.slice(rgba.indexOf('(')+1).slice(0,-1).replace(/\s/g, '').split(',');
    var return_color = {};
    var color_spaces = ['r', 'g', 'b', 'a'];
    for (var i = 0; i < rgba.length; i++){
        var value = parseFloat(rgba[i]); // Alpha value will be floating point.
        if (isNaN(value)){
            throw "ColorError: Something went wrong. Perhaps " + color + " is not a legal CSS color value";
        }
        else {
            return_color[color_spaces[i]] = value;
        }
    }
    return return_color;
};
// Pre-warm the cache with named colors, as these are not
// converted to rgb values by the parseColor function above.
cache = {
    "black": {"r": 0, "g": 0, "b": 0, "h": 0, "s": 0, "l": 0},
    "silver": {"r": 192, "g": 192, "b": 192, "h": 0, "s": 0, "l": 75},
    "gray": {"r": 128, "g": 128, "b": 128, "h": 0, "s": 0, "l": 50},
    "white": {"r": 255, "g": 255, "b": 255, "h": 0, "s": 0, "l": 100},
    "maroon": {"r": 128, "g": 0, "b": 0, "h": 0, "s": 100, "l": 25},
    "red": {"r": 255, "g": 0, "b": 0, "h": 0, "s": 100, "l": 50},
    "purple": {"r": 128, "g": 0, "b": 128, "h": 300, "s": 100, "l": 25},
    "fuchsia": {"r": 255, "g": 0, "b": 255, "h": 300, "s": 100, "l": 50},
    "green": {"r": 0, "g": 128, "b": 0, "h": 120, "s": 100, "l": 25},
    "lime": {"r": 0, "g": 255, "b": 0, "h": 120, "s": 100, "l": 50},
    "olive": {"r": 128, "g": 128, "b": 0, "h": 60, "s": 100, "l": 25},
    "yellow": {"r": 255, "g": 255, "b": 0, "h": 60, "s": 100, "l": 50},
    "navy": {"r": 0, "g": 0, "b": 128, "h": 240, "s": 100, "l": 25},
    "blue": {"r": 0, "g": 0, "b": 255, "h": 240, "s": 100, "l": 50},
    "teal": {"r": 0, "g": 128, "b": 128, "h": 180, "s": 100, "l": 25},
    "aqua": {"r": 0, "g": 255, "b": 255, "h": 180, "s": 100, "l": 50},
    "orange": {"r": 255, "g": 165, "b": 0, "h": 39, "s": 100, "l": 50},
    "aliceblue": {"r": 240, "g": 248, "b": 255, "h": 208, "s": 100, "l": 97},
    "antiquewhite": {"r": 250, "g": 235, "b": 215, "h": 34, "s": 78, "l": 91},
    "aquamarine": {"r": 127, "g": 255, "b": 212, "h": 160, "s": 100, "l": 75},
    "azure": {"r": 240, "g": 255, "b": 255, "h": 180, "s": 100, "l": 97},
    "beige": {"r": 245, "g": 245, "b": 220, "h": 60, "s": 56, "l": 91},
    "bisque": {"r": 255, "g": 228, "b": 196, "h": 33, "s": 100, "l": 88},
    "blanchedalmond": {"r": 255, "g": 235, "b": 205, "h": 36, "s": 100, "l": 90},
    "blueviolet": {"r": 138, "g": 43, "b": 226, "h": 271, "s": 76, "l": 53},
    "brown": {"r": 165, "g": 42, "b": 42, "h": 0, "s": 59, "l": 41},
    "burlywood": {"r": 222, "g": 184, "b": 135, "h": 34, "s": 57, "l": 70},
    "cadetblue": {"r": 95, "g": 158, "b": 160, "h": 182, "s": 25, "l": 50},
    "chartreuse": {"r": 127, "g": 255, "b": 0, "h": 90, "s": 100, "l": 50},
    "chocolate": {"r": 210, "g": 105, "b": 30, "h": 25, "s": 75, "l": 47},
    "coral": {"r": 255, "g": 127, "b": 80, "h": 16, "s": 100, "l": 66},
    "cornflowerblue": {"r": 100, "g": 149, "b": 237, "h": 219, "s": 79, "l": 66},
    "cornsilk": {"r": 255, "g": 248, "b": 220, "h": 48, "s": 100, "l": 93},
    "crimson": {"r": 220, "g": 20, "b": 60, "h": 348, "s": 83, "l": 47},
    "darkblue": {"r": 0, "g": 0, "b": 139, "h": 240, "s": 100, "l": 27},
    "darkcyan": {"r": 0, "g": 139, "b": 139, "h": 180, "s": 100, "l": 27},
    "darkgoldenrod": {"r": 184, "g": 134, "b": 11, "h": 43, "s": 89, "l": 38},
    "darkgray": {"r": 169, "g": 169, "b": 169, "h": 0, "s": 0, "l": 66},
    "darkgreen": {"r": 0, "g": 100, "b": 0, "h": 120, "s": 100, "l": 20},
    "darkgrey": {"r": 169, "g": 169, "b": 169, "h": 0, "s": 0, "l": 66},
    "darkkhaki": {"r": 189, "g": 183, "b": 107, "h": 56, "s": 38, "l": 58},
    "darkmagenta": {"r": 139, "g": 0, "b": 139, "h": 300, "s": 100, "l": 27},
    "darkolivegreen": {"r": 85, "g": 107, "b": 47, "h": 82, "s": 39, "l": 30},
    "darkorange": {"r": 255, "g": 140, "b": 0, "h": 33, "s": 100, "l": 50},
    "darkorchid": {"r": 153, "g": 50, "b": 204, "h": 280, "s": 61, "l": 50},
    "darkred": {"r": 139, "g": 0, "b": 0, "h": 0, "s": 100, "l": 27},
    "darksalmon": {"r": 233, "g": 150, "b": 122, "h": 15, "s": 72, "l": 70},
    "darkseagreen": {"r": 143, "g": 188, "b": 143, "h": 120, "s": 25, "l": 65},
    "darkslateblue": {"r": 72, "g": 61, "b": 139, "h": 248, "s": 39, "l": 39},
    "darkslategray": {"r": 47, "g": 79, "b": 79, "h": 180, "s": 25, "l": 25},
    "darkslategrey": {"r": 47, "g": 79, "b": 79, "h": 180, "s": 25, "l": 25},
    "darkturquoise": {"r": 0, "g": 206, "b": 209, "h": 181, "s": 100, "l": 41},
    "darkviolet": {"r": 148, "g": 0, "b": 211, "h": 282, "s": 100, "l": 41},
    "deeppink": {"r": 255, "g": 20, "b": 147, "h": 328, "s": 100, "l": 54},
    "deepskyblue": {"r": 0, "g": 191, "b": 255, "h": 195, "s": 100, "l": 50},
    "dimgray": {"r": 105, "g": 105, "b": 105, "h": 0, "s": 0, "l": 41},
    "dimgrey": {"r": 105, "g": 105, "b": 105, "h": 0, "s": 0, "l": 41},
    "dodgerblue": {"r": 30, "g": 144, "b": 255, "h": 210, "s": 100, "l": 56},
    "firebrick": {"r": 178, "g": 34, "b": 34, "h": 0, "s": 68, "l": 42},
    "floralwhite": {"r": 255, "g": 250, "b": 240, "h": 40, "s": 100, "l": 97},
    "forestgreen": {"r": 34, "g": 139, "b": 34, "h": 120, "s": 61, "l": 34},
    "gainsboro": {"r": 220, "g": 220, "b": 220, "h": 0, "s": 0, "l": 86},
    "ghostwhite": {"r": 248, "g": 248, "b": 255, "h": 240, "s": 100, "l": 99},
    "gold": {"r": 255, "g": 215, "b": 0, "h": 51, "s": 100, "l": 50},
    "goldenrod": {"r": 218, "g": 165, "b": 32, "h": 43, "s": 74, "l": 49},
    "greenyellow": {"r": 173, "g": 255, "b": 47, "h": 84, "s": 100, "l": 59},
    "grey": {"r": 128, "g": 128, "b": 128, "h": 0, "s": 0, "l": 50},
    "honeydew": {"r": 240, "g": 255, "b": 240, "h": 120, "s": 100, "l": 97},
    "hotpink": {"r": 255, "g": 105, "b": 180, "h": 330, "s": 100, "l": 71},
    "indianred": {"r": 205, "g": 92, "b": 92, "h": 0, "s": 53, "l": 58},
    "indigo": {"r": 75, "g": 0, "b": 130, "h": 275, "s": 100, "l": 25},
    "ivory": {"r": 255, "g": 255, "b": 240, "h": 60, "s": 100, "l": 97},
    "khaki": {"r": 240, "g": 230, "b": 140, "h": 54, "s": 77, "l": 75},
    "lavender": {"r": 230, "g": 230, "b": 250, "h": 240, "s": 67, "l": 94},
    "lavenderblush": {"r": 255, "g": 240, "b": 245, "h": 340, "s": 100, "l": 97},
    "lawngreen": {"r": 124, "g": 252, "b": 0, "h": 90, "s": 100, "l": 49},
    "lemonchiffon": {"r": 255, "g": 250, "b": 205, "h": 54, "s": 100, "l": 90},
    "lightblue": {"r": 173, "g": 216, "b": 230, "h": 195, "s": 53, "l": 79},
    "lightcoral": {"r": 240, "g": 128, "b": 128, "h": 0, "s": 79, "l": 72},
    "lightcyan": {"r": 224, "g": 255, "b": 255, "h": 180, "s": 100, "l": 94},
    "lightgoldenrodyellow": {"r": 250, "g": 250, "b": 210, "h": 60, "s": 80, "l": 90},
    "lightgray": {"r": 211, "g": 211, "b": 211, "h": 0, "s": 0, "l": 83},
    "lightgreen": {"r": 144, "g": 238, "b": 144, "h": 120, "s": 73, "l": 75},
    "lightgrey": {"r": 211, "g": 211, "b": 211, "h": 0, "s": 0, "l": 83},
    "lightpink": {"r": 255, "g": 182, "b": 193, "h": 351, "s": 100, "l": 86},
    "lightsalmon": {"r": 255, "g": 160, "b": 122, "h": 17, "s": 100, "l": 74},
    "lightseagreen": {"r": 32, "g": 178, "b": 170, "h": 177, "s": 70, "l": 41},
    "lightskyblue": {"r": 135, "g": 206, "b": 250, "h": 203, "s": 92, "l": 75},
    "lightslategray": {"r": 119, "g": 136, "b": 153, "h": 210, "s": 14, "l": 53},
    "lightslategrey": {"r": 119, "g": 136, "b": 153, "h": 210, "s": 14, "l": 53},
    "lightsteelblue": {"r": 176, "g": 196, "b": 222, "h": 214, "s": 41, "l": 78},
    "lightyellow": {"r": 255, "g": 255, "b": 224, "h": 60, "s": 100, "l": 94},
    "limegreen": {"r": 50, "g": 205, "b": 50, "h": 120, "s": 61, "l": 50},
    "linen": {"r": 250, "g": 240, "b": 230, "h": 30, "s": 67, "l": 94},
    "mediumaquamarine": {"r": 102, "g": 205, "b": 170, "h": 160, "s": 51, "l": 60},
    "mediumblue": {"r": 0, "g": 0, "b": 205, "h": 240, "s": 100, "l": 40},
    "mediumorchid": {"r": 186, "g": 85, "b": 211, "h": 288, "s": 59, "l": 58},
    "mediumpurple": {"r": 147, "g": 112, "b": 219, "h": 260, "s": 60, "l": 65},
    "mediumseagreen": {"r": 60, "g": 179, "b": 113, "h": 147, "s": 50, "l": 47},
    "mediumslateblue": {"r": 123, "g": 104, "b": 238, "h": 249, "s": 80, "l": 67},
    "mediumspringgreen": {"r": 0, "g": 250, "b": 154, "h": 157, "s": 100, "l": 49},
    "mediumturquoise": {"r": 72, "g": 209, "b": 204, "h": 178, "s": 60, "l": 55},
    "mediumvioletred": {"r": 199, "g": 21, "b": 133, "h": 322, "s": 81, "l": 43},
    "midnightblue": {"r": 25, "g": 25, "b": 112, "h": 240, "s": 64, "l": 27},
    "mintcream": {"r": 245, "g": 255, "b": 250, "h": 150, "s": 100, "l": 98},
    "mistyrose": {"r": 255, "g": 228, "b": 225, "h": 6, "s": 100, "l": 94},
    "moccasin": {"r": 255, "g": 228, "b": 181, "h": 38, "s": 100, "l": 85},
    "navajowhite": {"r": 255, "g": 222, "b": 173, "h": 36, "s": 100, "l": 84},
    "oldlace": {"r": 253, "g": 245, "b": 230, "h": 39, "s": 85, "l": 95},
    "olivedrab": {"r": 107, "g": 142, "b": 35, "h": 80, "s": 60, "l": 35},
    "orangered": {"r": 255, "g": 69, "b": 0, "h": 16, "s": 100, "l": 50},
    "orchid": {"r": 218, "g": 112, "b": 214, "h": 302, "s": 59, "l": 65},
    "palegoldenrod": {"r": 238, "g": 232, "b": 170, "h": 55, "s": 67, "l": 80},
    "palegreen": {"r": 152, "g": 251, "b": 152, "h": 120, "s": 93, "l": 79},
    "paleturquoise": {"r": 175, "g": 238, "b": 238, "h": 180, "s": 65, "l": 81},
    "palevioletred": {"r": 219, "g": 112, "b": 147, "h": 340, "s": 60, "l": 65},
    "papayawhip": {"r": 255, "g": 239, "b": 213, "h": 37, "s": 100, "l": 92},
    "peachpuff": {"r": 255, "g": 218, "b": 185, "h": 28, "s": 100, "l": 86},
    "peru": {"r": 205, "g": 133, "b": 63, "h": 30, "s": 59, "l": 53},
    "pink": {"r": 255, "g": 192, "b": 203, "h": 350, "s": 100, "l": 88},
    "plum": {"r": 221, "g": 160, "b": 221, "h": 300, "s": 47, "l": 75},
    "powderblue": {"r": 176, "g": 224, "b": 230, "h": 187, "s": 52, "l": 80},
    "rosybrown": {"r": 188, "g": 143, "b": 143, "h": 0, "s": 25, "l": 65},
    "royalblue": {"r": 65, "g": 105, "b": 225, "h": 225, "s": 73, "l": 57},
    "saddlebrown": {"r": 139, "g": 69, "b": 19, "h": 25, "s": 76, "l": 31},
    "salmon": {"r": 250, "g": 128, "b": 114, "h": 6, "s": 93, "l": 71},
    "sandybrown": {"r": 244, "g": 164, "b": 96, "h": 28, "s": 87, "l": 67},
    "seagreen": {"r": 46, "g": 139, "b": 87, "h": 146, "s": 50, "l": 36},
    "seashell": {"r": 255, "g": 245, "b": 238, "h": 25, "s": 100, "l": 97},
    "sienna": {"r": 160, "g": 82, "b": 45, "h": 19, "s": 56, "l": 40},
    "skyblue": {"r": 135, "g": 206, "b": 235, "h": 197, "s": 71, "l": 73},
    "slateblue": {"r": 106, "g": 90, "b": 205, "h": 248, "s": 53, "l": 58},
    "slategray": {"r": 112, "g": 128, "b": 144, "h": 210, "s": 13, "l": 50},
    "slategrey": {"r": 112, "g": 128, "b": 144, "h": 210, "s": 13, "l": 50},
    "snow": {"r": 255, "g": 250, "b": 250, "h": 0, "s": 100, "l": 99},
    "springgreen": {"r": 0, "g": 255, "b": 127, "h": 150, "s": 100, "l": 50},
    "steelblue": {"r": 70, "g": 130, "b": 180, "h": 207, "s": 44, "l": 49},
    "tan": {"r": 210, "g": 180, "b": 140, "h": 34, "s": 44, "l": 69},
    "thistle": {"r": 216, "g": 191, "b": 216, "h": 300, "s": 24, "l": 80},
    "tomato": {"r": 255, "g": 99, "b": 71, "h": 9, "s": 100, "l": 64},
    "turquoise": {"r": 64, "g": 224, "b": 208, "h": 174, "s": 72, "l": 56},
    "violet": {"r": 238, "g": 130, "b": 238, "h": 300, "s": 76, "l": 72},
    "wheat": {"r": 245, "g": 222, "b": 179, "h": 39, "s": 77, "l": 83},
    "whitesmoke": {"r": 245, "g": 245, "b": 245, "h": 0, "s": 0, "l": 96},
    "yellowgreen": {"r": 154, "g": 205, "b": 50, "h": 80, "s": 61, "l": 50}
};

module.exports = Color;

},{}],7:[function(_dereq_,module,exports){
_dereq_('./../tests/color.js');
_dereq_('./../tests/helpers.js');
_dereq_('./../tests/data/colors.js');

},{"./../tests/color.js":8,"./../tests/data/colors.js":9,"./../tests/helpers.js":10}],8:[function(_dereq_,module,exports){
var Color = _dereq_('../src/colour.js');
var named = _dereq_('./data/colors.js');
var nearlyEqual = _dereq_('./helpers.js')['nearlyEqual'];
var assert = _dereq_("assert");

suite('Color', function(){
    var red, green, blue, rgb, rgba, hsl, hsla;
    setup(function(){
        red = new Color("red");
        green = new Color("#0F0"); // Named color 'green' is rgb(0,128,0)
        blue = new Color("blue");
        rgb = new Color("rgb(1, 7, 29)");
        rgba = new Color("rgba(1, 7, 29, 0.3)");
        hsl = new Color("hsl(0, 100%, 50%)");
        hsla = new Color("hsla(0, 100%, 50%, 0.3)");
    });
    suite('properties', function(){
        test('rgb', function(){
            assert.equal(red.rgb.r, 255);
            assert.equal(red.rgb.g, 0);
            assert.equal(red.rgb.b, 0);
            assert.equal(rgb.rgb.r, 1);
            assert.equal(rgb.rgb.g, 7);
            assert.equal(rgb.rgb.b, 29);
            assert.equal(rgb.alpha, 1);
            assert.equal(rgba.rgb.r, 1);
            assert.equal(rgba.rgb.g, 7);
            assert.equal(rgba.rgb.b, 29);
            assert.ok(nearlyEqual(rgba.alpha, 0.3));
            for (var color in named){
                if (named.hasOwnProperty(color)){
                    var name = new Color(color);
                    var hex = new Color(named[color].hex);
                    var named_rgb = named[color].rgb;
                    assert.equal(name.rgb.r, hex.rgb.r);
                    assert.equal(name.rgb.g, hex.rgb.g);
                    assert.equal(name.rgb.b, hex.rgb.b);
                    assert.equal(name.rgb.r, named_rgb.r);
                    assert.equal(name.rgb.g, named_rgb.g);
                    assert.equal(name.rgb.b, named_rgb.b);
                } 
            }
        });
        test('hsl', function(){
            assert.equal(red.hsl.h, 0);
            assert.equal(red.hsl.s, 100);
            assert.equal(red.hsl.l, 50);

            assert.equal(hsl.hsl.h, 0);
            assert.equal(hsl.hsl.s, 100);
            assert.equal(hsl.hsl.l, 50);
            assert.ok(nearlyEqual(hsl.alpha, 1));

            assert.equal(hsla.hsl.h, 0);
            assert.equal(hsla.hsl.s, 100);
            assert.equal(hsla.hsl.l, 50);
            assert.ok(nearlyEqual(hsla.alpha, 0.3));
            for (var color in named){
                if (named.hasOwnProperty(color)){
                    var name = new Color(color);
                    var hex = new Color(named[color].hex);
                    var named_hsl = named[color].rgb;
                    assert.equal(name.rgb.h, hex.rgb.h);
                    assert.equal(name.rgb.s, hex.rgb.s);
                    assert.equal(name.rgb.l, hex.rgb.l);
                    assert.equal(name.rgb.h, named_hsl.h);
                    assert.equal(name.rgb.s, named_hsl.s);
                    assert.equal(name.rgb.l, named_hsl.l);
                }
            }
        });
        test('alpha', function(){
            assert.ok(nearlyEqual(red.alpha, 1));
            assert.ok(nearlyEqual(rgba.alpha, 0.3));
            assert.ok(nearlyEqual(hsla.alpha, 0.3));
        });
    });
    suite('methods', function(){
        test('lighten', function(){
            var r1 = red.lighten(10);
            var r2 = red.lighten(20);
            var r3 = red.lighten(50);
            var g1 = green.lighten(10);
            var g2 = green.lighten(20);
            var g3 = green.lighten(50);
            var b1 = blue.lighten(10);
            var b2 = blue.lighten(20);
            var b3 = blue.lighten(50);

            assert.equal(r1.rgb.r, 255);
            assert.equal(r1.rgb.g, 51);
            assert.equal(r1.rgb.b, 51);
            assert.equal(r2.rgb.r, 255);
            assert.equal(r2.rgb.g, 102);
            assert.equal(r2.rgb.b, 102);
            assert.equal(r3.rgb.r, 255);
            assert.equal(r3.rgb.g, 255);
            assert.equal(r3.rgb.b, 255);

            assert.equal(g1.rgb.r, 51);
            assert.equal(g1.rgb.g, 255);
            assert.equal(g1.rgb.b, 51);
            assert.equal(g2.rgb.r, 102);
            assert.equal(g2.rgb.g, 255);
            assert.equal(g2.rgb.b, 102);
            assert.equal(g3.rgb.r, 255);
            assert.equal(g3.rgb.g, 255);
            assert.equal(g3.rgb.b, 255);

            assert.equal(b1.rgb.r, 51);
            assert.equal(b1.rgb.g, 51);
            assert.equal(b1.rgb.b, 255);
            assert.equal(b2.rgb.r, 102);
            assert.equal(b2.rgb.g, 102);
            assert.equal(b2.rgb.b, 255);
            assert.equal(b3.rgb.r, 255);
            assert.equal(b3.rgb.g, 255);
            assert.equal(b3.rgb.b, 255);

        });
        test('darken', function(){
            var r1 = red.darken(10);
            var r2 = red.darken(20);
            var r3 = red.darken(50);
            var g1 = green.darken(10);
            var g2 = green.darken(20);
            var g3 = green.darken(50);
            var b1 = blue.darken(10);
            var b2 = blue.darken(20);
            var b3 = blue.darken(50);

            assert.equal(r1.rgb.r, 204);
            assert.equal(r1.rgb.g, 0);
            assert.equal(r1.rgb.b, 0);
            assert.equal(r2.rgb.r, 153);
            assert.equal(r2.rgb.g, 0);
            assert.equal(r2.rgb.b, 0);
            assert.equal(r3.rgb.r, 0);
            assert.equal(r3.rgb.g, 0);
            assert.equal(r3.rgb.b, 0);

            assert.equal(g1.rgb.r, 0);
            assert.equal(g1.rgb.g, 204);
            assert.equal(g1.rgb.b, 0);
            assert.equal(g2.rgb.r, 0);
            assert.equal(g2.rgb.g, 153);
            assert.equal(g2.rgb.b, 0);
            assert.equal(g3.rgb.r, 0);
            assert.equal(g3.rgb.g, 0);
            assert.equal(g3.rgb.b, 0);

            assert.equal(b1.rgb.r, 0);
            assert.equal(b1.rgb.g, 0);
            assert.equal(b1.rgb.b, 204);
            assert.equal(b2.rgb.r, 0);
            assert.equal(b2.rgb.g, 0);
            assert.equal(b2.rgb.b, 153);
            assert.equal(b3.rgb.r, 0);
            assert.equal(b3.rgb.g, 0);
            assert.equal(b3.rgb.b, 0);
        });
    });
});
},{"../src/colour.js":6,"./data/colors.js":9,"./helpers.js":10,"assert":1}],9:[function(_dereq_,module,exports){
var namedcolors = {
    "aliceblue": {"hsl": {"h": 0,"s": 0,"l": 0 }, "rgb": {"r": 240,"g": 248,"b": 255 }, "hex": "#f0f8ff"},
    "antiquewhite": {"hsl": {"h": 0,"s": 0,"l": 75 }, "rgb": {"r": 250,"g": 235,"b": 215 }, "hex": "#faebd7"},
    "aqua": {"hsl": {"h": 0,"s": 0,"l": 50 }, "rgb": {"r": 0,"g": 255,"b": 255 }, "hex": "#00ffff"},
    "aquamarine": {"hsl": {"h": 0,"s": 0,"l": 100 }, "rgb": {"r": 127,"g": 255,"b": 212 }, "hex": "#7fffd4"},
    "azure": {"hsl": {"h": 0,"s": 100,"l": 25 }, "rgb": {"r": 240,"g": 255,"b": 255 }, "hex": "#f0ffff"},
    "beige": {"hsl": {"h": 0,"s": 100,"l": 50 }, "rgb": {"r": 245,"g": 245,"b": 220 }, "hex": "#f5f5dc"},
    "bisque": {"hsl": {"h": 300,"s": 100,"l": 25 }, "rgb": {"r": 255,"g": 228,"b": 196 }, "hex": "#ffe4c4"},
    "black": {"hsl": {"h": 300,"s": 100,"l": 50 }, "rgb": {"r": 0,"g": 0,"b": 0 }, "hex": "#000000"},
    "blanchedalmond": {"hsl": {"h": 120,"s": 100,"l": 25 }, "rgb": {"r": 255,"g": 235,"b": 205 }, "hex": "#ffebcd"},
    "blue": {"hsl": {"h": 120,"s": 100,"l": 50 }, "rgb": {"r": 0,"g": 0,"b": 255 }, "hex": "#0000ff"},
    "blueviolet": {"hsl": {"h": 60,"s": 100,"l": 25 }, "rgb": {"r": 138,"g": 43,"b": 226 }, "hex": "#8a2be2"},
    "brown": {"hsl": {"h": 60,"s": 100,"l": 50 }, "rgb": {"r": 165,"g": 42,"b": 42 }, "hex": "#a52a2a"},
    "burlywood": {"hsl": {"h": 240,"s": 100,"l": 25 }, "rgb": {"r": 222,"g": 184,"b": 135 }, "hex": "#deb887"},
    "cadetblue": {"hsl": {"h": 240,"s": 100,"l": 50 }, "rgb": {"r": 95,"g": 158,"b": 160 }, "hex": "#5f9ea0"},
    "chartreuse": {"hsl": {"h": 180,"s": 100,"l": 25 }, "rgb": {"r": 127,"g": 255,"b": 0 }, "hex": "#7fff00"},
    "chocolate": {"hsl": {"h": 180,"s": 100,"l": 50 }, "rgb": {"r": 210,"g": 105,"b": 30 }, "hex": "#d2691e"},
    "coral": {"hsl": {"h": 39,"s": 100,"l": 50 }, "rgb": {"r": 255,"g": 127,"b": 80 }, "hex": "#ff7f50"},
    "cornflowerblue": {"hsl": {"h": 208,"s": 100,"l": 97 }, "rgb": {"r": 100,"g": 149,"b": 237 }, "hex": "#6495ed"},
    "cornsilk": {"hsl": {"h": 34,"s": 78,"l": 91 }, "rgb": {"r": 255,"g": 248,"b": 220 }, "hex": "#fff8dc"},
    "crimson": {"hsl": {"h": 160,"s": 100,"l": 75 }, "rgb": {"r": 220,"g": 20,"b": 60 }, "hex": "#dc143c"},
    "cyan": {"hsl": {"h": 180,"s": 100,"l": 97 }, "rgb": {"r": 0,"g": 255,"b": 255 }, "hex": "#00ffff"},
    "darkblue": {"hsl": {"h": 60,"s": 56,"l": 91 }, "rgb": {"r": 0,"g": 0,"b": 139 }, "hex": "#00008b"},
    "darkcyan": {"hsl": {"h": 33,"s": 100,"l": 88 }, "rgb": {"r": 0,"g": 139,"b": 139 }, "hex": "#008b8b"},
    "darkgoldenrod": {"hsl": {"h": 36,"s": 100,"l": 90 }, "rgb": {"r": 184,"g": 134,"b": 11 }, "hex": "#b8860b"},
    "darkgray": {"hsl": {"h": 271,"s": 76,"l": 53 }, "rgb": {"r": 169,"g": 169,"b": 169 }, "hex": "#a9a9a9"},
    "darkgreen": {"hsl": {"h": 0,"s": 59,"l": 41 }, "rgb": {"r": 0,"g": 100,"b": 0 }, "hex": "#006400"},
    "darkgrey": {"hsl": {"h": 34,"s": 57,"l": 70 }, "rgb": {"r": 169,"g": 169,"b": 169 }, "hex": "#a9a9a9"},
    "darkkhaki": {"hsl": {"h": 182,"s": 25,"l": 50 }, "rgb": {"r": 189,"g": 183,"b": 107 }, "hex": "#bdb76b"},
    "darkmagenta": {"hsl": {"h": 90,"s": 100,"l": 50 }, "rgb": {"r": 139,"g": 0,"b": 139 }, "hex": "#8b008b"},
    "darkolivegreen": {"hsl": {"h": 25,"s": 75,"l": 47 }, "rgb": {"r": 85,"g": 107,"b": 47 }, "hex": "#556b2f"},
    "darkorange": {"hsl": {"h": 16,"s": 100,"l": 66 }, "rgb": {"r": 255,"g": 140,"b": 0 }, "hex": "#ff8c00"},
    "darkorchid": {"hsl": {"h": 219,"s": 79,"l": 66 }, "rgb": {"r": 153,"g": 50,"b": 204 }, "hex": "#9932cc"},
    "darkred": {"hsl": {"h": 48,"s": 100,"l": 93 }, "rgb": {"r": 139,"g": 0,"b": 0 }, "hex": "#8b0000"},
    "darksalmon": {"hsl": {"h": 348,"s": 83,"l": 47 }, "rgb": {"r": 233,"g": 150,"b": 122 }, "hex": "#e9967a"},
    "darkseagreen": {"hsl": {"h": 240,"s": 100,"l": 27 }, "rgb": {"r": 143,"g": 188,"b": 143 }, "hex": "#8fbc8f"},
    "darkslateblue": {"hsl": {"h": 180,"s": 100,"l": 27 }, "rgb": {"r": 72,"g": 61,"b": 139 }, "hex": "#483d8b"},
    "darkslategray": {"hsl": {"h": 43,"s": 89,"l": 38 }, "rgb": {"r": 47,"g": 79,"b": 79 }, "hex": "#2f4f4f"},
    "darkslategrey": {"hsl": {"h": 0,"s": 0,"l": 66 }, "rgb": {"r": 47,"g": 79,"b": 79 }, "hex": "#2f4f4f"},
    "darkturquoise": {"hsl": {"h": 120,"s": 100,"l": 20 }, "rgb": {"r": 0,"g": 206,"b": 209 }, "hex": "#00ced1"},
    "darkviolet": {"hsl": {"h": 0,"s": 0,"l": 66 }, "rgb": {"r": 148,"g": 0,"b": 211 }, "hex": "#9400d3"},
    "deeppink": {"hsl": {"h": 56,"s": 38,"l": 58 }, "rgb": {"r": 255,"g": 20,"b": 147 }, "hex": "#ff1493"},
    "deepskyblue": {"hsl": {"h": 300,"s": 100,"l": 27 }, "rgb": {"r": 0,"g": 191,"b": 255 }, "hex": "#00bfff"},
    "dimgray": {"hsl": {"h": 82,"s": 39,"l": 30 }, "rgb": {"r": 105,"g": 105,"b": 105 }, "hex": "#696969"},
    "dimgrey": {"hsl": {"h": 33,"s": 100,"l": 50 }, "rgb": {"r": 105,"g": 105,"b": 105 }, "hex": "#696969"},
    "dodgerblue": {"hsl": {"h": 280,"s": 61,"l": 50 }, "rgb": {"r": 30,"g": 144,"b": 255 }, "hex": "#1e90ff"},
    "firebrick": {"hsl": {"h": 0,"s": 100,"l": 27 }, "rgb": {"r": 178,"g": 34,"b": 34 }, "hex": "#b22222"},
    "floralwhite": {"hsl": {"h": 15,"s": 72,"l": 70 }, "rgb": {"r": 255,"g": 250,"b": 240 }, "hex": "#fffaf0"},
    "forestgreen": {"hsl": {"h": 120,"s": 25,"l": 65 }, "rgb": {"r": 34,"g": 139,"b": 34 }, "hex": "#228b22"},
    "fuchsia": {"hsl": {"h": 248,"s": 39,"l": 39 }, "rgb": {"r": 255,"g": 0,"b": 255 }, "hex": "#ff00ff"},
    "gainsboro": {"hsl": {"h": 180,"s": 25,"l": 25 }, "rgb": {"r": 220,"g": 220,"b": 220 }, "hex": "#dcdcdc"},
    "ghostwhite": {"hsl": {"h": 180,"s": 25,"l": 25 }, "rgb": {"r": 248,"g": 248,"b": 255 }, "hex": "#f8f8ff"},
    "gold": {"hsl": {"h": 181,"s": 100,"l": 41 }, "rgb": {"r": 255,"g": 215,"b": 0 }, "hex": "#ffd700"},
    "goldenrod": {"hsl": {"h": 282,"s": 100,"l": 41 }, "rgb": {"r": 218,"g": 165,"b": 32 }, "hex": "#daa520"},
    "gray": {"hsl": {"h": 328,"s": 100,"l": 54 }, "rgb": {"r": 128,"g": 128,"b": 128 }, "hex": "#808080"},
    "green": {"hsl": {"h": 195,"s": 100,"l": 50 }, "rgb": {"r": 0,"g": 128,"b": 0 }, "hex": "#008000"},
    "greenyellow": {"hsl": {"h": 0,"s": 0,"l": 41 }, "rgb": {"r": 173,"g": 255,"b": 47 }, "hex": "#adff2f"},
    "grey": {"hsl": {"h": 0,"s": 0,"l": 41 }, "rgb": {"r": 128,"g": 128,"b": 128 }, "hex": "#808080"},
    "honeydew": {"hsl": {"h": 210,"s": 100,"l": 56 }, "rgb": {"r": 240,"g": 255,"b": 240 }, "hex": "#f0fff0"},
    "hotpink": {"hsl": {"h": 0,"s": 68,"l": 42 }, "rgb": {"r": 255,"g": 105,"b": 180 }, "hex": "#ff69b4"},
    "indianred": {"hsl": {"h": 40,"s": 100,"l": 97 }, "rgb": {"r": 205,"g": 92,"b": 92 }, "hex": "#cd5c5c"},
    "indigo": {"hsl": {"h": 120,"s": 61,"l": 34 }, "rgb": {"r": 75,"g": 0,"b": 130 }, "hex": "#4b0082"},
    "ivory": {"hsl": {"h": 0,"s": 0,"l": 86 }, "rgb": {"r": 255,"g": 255,"b": 240 }, "hex": "#fffff0"},
    "khaki": {"hsl": {"h": 240,"s": 100,"l": 99 }, "rgb": {"r": 240,"g": 230,"b": 140 }, "hex": "#f0e68c"},
    "lavender": {"hsl": {"h": 51,"s": 100,"l": 50 }, "rgb": {"r": 230,"g": 230,"b": 250 }, "hex": "#e6e6fa"},
    "lavenderblush": {"hsl": {"h": 43,"s": 74,"l": 49 }, "rgb": {"r": 255,"g": 240,"b": 245 }, "hex": "#fff0f5"},
    "lawngreen": {"hsl": {"h": 84,"s": 100,"l": 59 }, "rgb": {"r": 124,"g": 252,"b": 0 }, "hex": "#7cfc00"},
    "lemonchiffon": {"hsl": {"h": 0,"s": 0,"l": 50 }, "rgb": {"r": 255,"g": 250,"b": 205 }, "hex": "#fffacd"},
    "lightblue": {"hsl": {"h": 120,"s": 100,"l": 97 }, "rgb": {"r": 173,"g": 216,"b": 230 }, "hex": "#add8e6"},
    "lightcoral": {"hsl": {"h": 330,"s": 100,"l": 71 }, "rgb": {"r": 240,"g": 128,"b": 128 }, "hex": "#f08080"},
    "lightcyan": {"hsl": {"h": 0,"s": 53,"l": 58 }, "rgb": {"r": 224,"g": 255,"b": 255 }, "hex": "#e0ffff"},
    "lightgoldenrodyellow": {"hsl": {"h": 275,"s": 100,"l": 25 }, "rgb": {"r": 250,"g": 250,"b": 210 }, "hex": "#fafad2"},
    "lightgray": {"hsl": {"h": 60,"s": 100,"l": 97 }, "rgb": {"r": 211,"g": 211,"b": 211 }, "hex": "#d3d3d3"},
    "lightgreen": {"hsl": {"h": 54,"s": 77,"l": 75 }, "rgb": {"r": 144,"g": 238,"b": 144 }, "hex": "#90ee90"},
    "lightgrey": {"hsl": {"h": 240,"s": 67,"l": 94 }, "rgb": {"r": 211,"g": 211,"b": 211 }, "hex": "#d3d3d3"},
    "lightpink": {"hsl": {"h": 340,"s": 100,"l": 97 }, "rgb": {"r": 255,"g": 182,"b": 193 }, "hex": "#ffb6c1"},
    "lightsalmon": {"hsl": {"h": 90,"s": 100,"l": 49 }, "rgb": {"r": 255,"g": 160,"b": 122 }, "hex": "#ffa07a"},
    "lightseagreen": {"hsl": {"h": 54,"s": 100,"l": 90 }, "rgb": {"r": 32,"g": 178,"b": 170 }, "hex": "#20b2aa"},
    "lightskyblue": {"hsl": {"h": 195,"s": 53,"l": 79 }, "rgb": {"r": 135,"g": 206,"b": 250 }, "hex": "#87cefa"},
    "lightslategray": {"hsl": {"h": 0,"s": 79,"l": 72 }, "rgb": {"r": 119,"g": 136,"b": 153 }, "hex": "#778899"},
    "lightslategrey": {"hsl": {"h": 180,"s": 100,"l": 94 }, "rgb": {"r": 119,"g": 136,"b": 153 }, "hex": "#778899"},
    "lightsteelblue": {"hsl": {"h": 60,"s": 80,"l": 90 }, "rgb": {"r": 176,"g": 196,"b": 222 }, "hex": "#b0c4de"},
    "lightyellow": {"hsl": {"h": 0,"s": 0,"l": 83 }, "rgb": {"r": 255,"g": 255,"b": 224 }, "hex": "#ffffe0"},
    "lime": {"hsl": {"h": 120,"s": 73,"l": 75 }, "rgb": {"r": 0,"g": 255,"b": 0 }, "hex": "#00ff00"},
    "limegreen": {"hsl": {"h": 0,"s": 0,"l": 83 }, "rgb": {"r": 50,"g": 205,"b": 50 }, "hex": "#32cd32"},
    "linen": {"hsl": {"h": 351,"s": 100,"l": 86 }, "rgb": {"r": 250,"g": 240,"b": 230 }, "hex": "#faf0e6"},
    "magenta": {"hsl": {"h": 17,"s": 100,"l": 74 }, "rgb": {"r": 255,"g": 0,"b": 255 }, "hex": "#ff00ff"},
    "maroon": {"hsl": {"h": 177,"s": 70,"l": 41 }, "rgb": {"r": 128,"g": 0,"b": 0 }, "hex": "#800000"},
    "mediumaquamarine": {"hsl": {"h": 203,"s": 92,"l": 75 }, "rgb": {"r": 102,"g": 205,"b": 170 }, "hex": "#66cdaa"},
    "mediumblue": {"hsl": {"h": 210,"s": 14,"l": 53 }, "rgb": {"r": 0,"g": 0,"b": 205 }, "hex": "#0000cd"},
    "mediumorchid": {"hsl": {"h": 210,"s": 14,"l": 53 }, "rgb": {"r": 186,"g": 85,"b": 211 }, "hex": "#ba55d3"},
    "mediumpurple": {"hsl": {"h": 214,"s": 41,"l": 78 }, "rgb": {"r": 147,"g": 112,"b": 219 }, "hex": "#9370db"},
    "mediumseagreen": {"hsl": {"h": 60,"s": 100,"l": 94 }, "rgb": {"r": 60,"g": 179,"b": 113 }, "hex": "#3cb371"},
    "mediumslateblue": {"hsl": {"h": 120,"s": 61,"l": 50 }, "rgb": {"r": 123,"g": 104,"b": 238 }, "hex": "#7b68ee"},
    "mediumspringgreen": {"hsl": {"h": 30,"s": 67,"l": 94 }, "rgb": {"r": 0,"g": 250,"b": 154 }, "hex": "#00fa9a"},
    "mediumturquoise": {"hsl": {"h": 160,"s": 51,"l": 60 }, "rgb": {"r": 72,"g": 209,"b": 204 }, "hex": "#48d1cc"},
    "mediumvioletred": {"hsl": {"h": 240,"s": 100,"l": 40 }, "rgb": {"r": 199,"g": 21,"b": 133 }, "hex": "#c71585"},
    "midnightblue": {"hsl": {"h": 288,"s": 59,"l": 58 }, "rgb": {"r": 25,"g": 25,"b": 112 }, "hex": "#191970"},
    "mintcream": {"hsl": {"h": 260,"s": 60,"l": 65 }, "rgb": {"r": 245,"g": 255,"b": 250 }, "hex": "#f5fffa"},
    "mistyrose": {"hsl": {"h": 147,"s": 50,"l": 47 }, "rgb": {"r": 255,"g": 228,"b": 225 }, "hex": "#ffe4e1"},
    "moccasin": {"hsl": {"h": 249,"s": 80,"l": 67 }, "rgb": {"r": 255,"g": 228,"b": 181 }, "hex": "#ffe4b5"},
    "navajowhite": {"hsl": {"h": 157,"s": 100,"l": 49 }, "rgb": {"r": 255,"g": 222,"b": 173 }, "hex": "#ffdead"},
    "navy": {"hsl": {"h": 178,"s": 60,"l": 55 }, "rgb": {"r": 0,"g": 0,"b": 128 }, "hex": "#000080"},
    "oldlace": {"hsl": {"h": 322,"s": 81,"l": 43 }, "rgb": {"r": 253,"g": 245,"b": 230 }, "hex": "#fdf5e6"},
    "olive": {"hsl": {"h": 240,"s": 64,"l": 27 }, "rgb": {"r": 128,"g": 128,"b": 0 }, "hex": "#808000"},
    "olivedrab": {"hsl": {"h": 150,"s": 100,"l": 98 }, "rgb": {"r": 107,"g": 142,"b": 35 }, "hex": "#6b8e23"},
    "orange": {"hsl": {"h": 6,"s": 100,"l": 94 }, "rgb": {"r": 255,"g": 165,"b": 0 }, "hex": "#ffa500"},
    "orangered": {"hsl": {"h": 38,"s": 100,"l": 85 }, "rgb": {"r": 255,"g": 69,"b": 0 }, "hex": "#ff4500"},
    "orchid": {"hsl": {"h": 36,"s": 100,"l": 84 }, "rgb": {"r": 218,"g": 112,"b": 214 }, "hex": "#da70d6"},
    "palegoldenrod": {"hsl": {"h": 39,"s": 85,"l": 95 }, "rgb": {"r": 238,"g": 232,"b": 170 }, "hex": "#eee8aa"},
    "palegreen": {"hsl": {"h": 80,"s": 60,"l": 35 }, "rgb": {"r": 152,"g": 251,"b": 152 }, "hex": "#98fb98"},
    "paleturquoise": {"hsl": {"h": 16,"s": 100,"l": 50 }, "rgb": {"r": 175,"g": 238,"b": 238 }, "hex": "#afeeee"},
    "palevioletred": {"hsl": {"h": 302,"s": 59,"l": 65 }, "rgb": {"r": 219,"g": 112,"b": 147 }, "hex": "#db7093"},
    "papayawhip": {"hsl": {"h": 55,"s": 67,"l": 80 }, "rgb": {"r": 255,"g": 239,"b": 213 }, "hex": "#ffefd5"},
    "peachpuff": {"hsl": {"h": 120,"s": 93,"l": 79 }, "rgb": {"r": 255,"g": 218,"b": 185 }, "hex": "#ffdab9"},
    "peru": {"hsl": {"h": 180,"s": 65,"l": 81 }, "rgb": {"r": 205,"g": 133,"b": 63 }, "hex": "#cd853f"},
    "pink": {"hsl": {"h": 340,"s": 60,"l": 65 }, "rgb": {"r": 255,"g": 192,"b": 203 }, "hex": "#ffc0cb"},
    "plum": {"hsl": {"h": 37,"s": 100,"l": 92 }, "rgb": {"r": 221,"g": 160,"b": 221 }, "hex": "#dda0dd"},
    "powderblue": {"hsl": {"h": 28,"s": 100,"l": 86 }, "rgb": {"r": 176,"g": 224,"b": 230 }, "hex": "#b0e0e6"},
    "purple": {"hsl": {"h": 30,"s": 59,"l": 53 }, "rgb": {"r": 128,"g": 0,"b": 128 }, "hex": "#800080"},
    "red": {"hsl": {"h": 350,"s": 100,"l": 88 }, "rgb": {"r": 255,"g": 0,"b": 0 }, "hex": "#ff0000"},
    "rosybrown": {"hsl": {"h": 300,"s": 47,"l": 75 }, "rgb": {"r": 188,"g": 143,"b": 143 }, "hex": "#bc8f8f"},
    "royalblue": {"hsl": {"h": 187,"s": 52,"l": 80 }, "rgb": {"r": 65,"g": 105,"b": 225 }, "hex": "#4169e1"},
    "saddlebrown": {"hsl": {"h": 0,"s": 25,"l": 65 }, "rgb": {"r": 139,"g": 69,"b": 19 }, "hex": "#8b4513"},
    "salmon": {"hsl": {"h": 225,"s": 73,"l": 57 }, "rgb": {"r": 250,"g": 128,"b": 114 }, "hex": "#fa8072"},
    "sandybrown": {"hsl": {"h": 25,"s": 76,"l": 31 }, "rgb": {"r": 244,"g": 164,"b": 96 }, "hex": "#f4a460"},
    "seagreen": {"hsl": {"h": 6,"s": 93,"l": 71 }, "rgb": {"r": 46,"g": 139,"b": 87 }, "hex": "#2e8b57"},
    "seashell": {"hsl": {"h": 28,"s": 87,"l": 67 }, "rgb": {"r": 255,"g": 245,"b": 238 }, "hex": "#fff5ee"},
    "sienna": {"hsl": {"h": 146,"s": 50,"l": 36 }, "rgb": {"r": 160,"g": 82,"b": 45 }, "hex": "#a0522d"},
    "silver": {"hsl": {"h": 25,"s": 100,"l": 97 }, "rgb": {"r": 192,"g": 192,"b": 192 }, "hex": "#c0c0c0"},
    "skyblue": {"hsl": {"h": 19,"s": 56,"l": 40 }, "rgb": {"r": 135,"g": 206,"b": 235 }, "hex": "#87ceeb"},
    "slateblue": {"hsl": {"h": 197,"s": 71,"l": 73 }, "rgb": {"r": 106,"g": 90,"b": 205 }, "hex": "#6a5acd"},
    "slategray": {"hsl": {"h": 248,"s": 53,"l": 58 }, "rgb": {"r": 112,"g": 128,"b": 144 }, "hex": "#708090"},
    "slategrey": {"hsl": {"h": 210,"s": 13,"l": 50 }, "rgb": {"r": 112,"g": 128,"b": 144 }, "hex": "#708090"},
    "snow": {"hsl": {"h": 210,"s": 13,"l": 50 }, "rgb": {"r": 255,"g": 250,"b": 250 }, "hex": "#fffafa"},
    "springgreen": {"hsl": {"h": 0,"s": 100,"l": 99 }, "rgb": {"r": 0,"g": 255,"b": 127 }, "hex": "#00ff7f"},
    "steelblue": {"hsl": {"h": 150,"s": 100,"l": 50 }, "rgb": {"r": 70,"g": 130,"b": 180 }, "hex": "#4682b4"},
    "tan": {"hsl": {"h": 207,"s": 44,"l": 49 }, "rgb": {"r": 210,"g": 180,"b": 140 }, "hex": "#d2b48c"},
    "teal": {"hsl": {"h": 34,"s": 44,"l": 69 }, "rgb": {"r": 0,"g": 128,"b": 128 }, "hex": "#008080"},
    "thistle": {"hsl": {"h": 300,"s": 24,"l": 80 }, "rgb": {"r": 216,"g": 191,"b": 216 }, "hex": "#d8bfd8"},
    "tomato": {"hsl": {"h": 9,"s": 100,"l": 64 }, "rgb": {"r": 255,"g": 99,"b": 71 }, "hex": "#ff6347"},
    "turquoise": {"hsl": {"h": 174,"s": 72,"l": 56 }, "rgb": {"r": 64,"g": 224,"b": 208 }, "hex": "#40e0d0"},
    "violet": {"hsl": {"h": 300,"s": 76,"l": 72 }, "rgb": {"r": 238,"g": 130,"b": 238 }, "hex": "#ee82ee"},
    "wheat": {"hsl": {"h": 39,"s": 77,"l": 83 }, "rgb": {"r": 245,"g": 222,"b": 179 }, "hex": "#f5deb3"},
    "white": {"hsl": {"h": 0,"s": 0,"l": 96 }, "rgb": {"r": 255,"g": 255,"b": 255 }, "hex": "#ffffff"},
    "whitesmoke": {"hsl": {"h": 80,"s": 61,"l": 50 }, "rgb": {"r": 245,"g": 245,"b": 245 }, "hex": "#f5f5f5"},"yellow": { "rgb": {"r": 255,"g": 255,"b": 0 }, "hex": "#ffff00"},"yellowgreen": { "rgb": {"r": 154,"g": 205,"b": 50 }, "hex": "#9acd32"}
}

module.exports = namedcolors;
},{}],10:[function(_dereq_,module,exports){
function nearlyEqual(a, b, eps){
    if (typeof eps === "undefined") {eps = 0.01;}
    var diff = Math.abs(a - b);
    return (diff < eps);
}

var helpers = new Object(null);

helpers.nearlyEqual = nearlyEqual;

module.exports = helpers;
},{}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9zcmMvY29sb3VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay9jb2xvdXIvdGVzdC9mYWtlXzU1ZjIwY2FlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay9jb2xvdXIvdGVzdHMvY29sb3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci90ZXN0cy9kYXRhL2NvbG9ycy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL3Rlc3RzL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pVQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAoaXNOYU4odmFsdWUpIHx8ICFpc0Zpbml0ZSh2YWx1ZSkpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICAgIGtleSwgaTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsInZhciBoc2xUb1JnYiwgcmdiVG9Ic2wsIHBhcnNlQ29sb3IsIGNhY2hlLCBkaXY7XG4vKipcbiAqIEEgY29sb3Igd2l0aCBib3RoIHJnYiBhbmQgaHNsIHJlcHJlc2VudGF0aW9ucy5cbiAqIEBjbGFzcyBDb2xvclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIEFueSBsZWdhbCBDU1MgY29sb3IgdmFsdWUgKGhleCwgY29sb3Iga2V5d29yZCwgcmdiW2FdLCBoc2xbYV0pLlxuICovXG5mdW5jdGlvbiBDb2xvcihjb2xvciwgYWxwaGEpe1xuICAgIHZhciBoc2wsIHJnYjtcbiAgICB2YXIgcGFyc2VkX2NvbG9yID0ge307XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycpe1xuICAgICAgICBjb2xvciA9IGNvbG9yLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChjb2xvciBpbiBjYWNoZSl7XG4gICAgICAgICAgICBwYXJzZWRfY29sb3IgPSBjYWNoZVtjb2xvcl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzZWRfY29sb3IgPSBwYXJzZUNvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgIGNhY2hlW2NvbG9yXSA9IHBhcnNlZF9jb2xvcjtcbiAgICAgICAgfVxuICAgICAgICByZ2IgPSBwYXJzZWRfY29sb3I7XG4gICAgICAgIGhzbCA9IHJnYlRvSHNsKHBhcnNlZF9jb2xvci5yLCBwYXJzZWRfY29sb3IuZywgcGFyc2VkX2NvbG9yLmIpO1xuICAgICAgICBhbHBoYSA9IHBhcnNlZF9jb2xvci5hIHx8IGFscGhhIHx8IDE7XG4gICAgfSBlbHNlIGlmICgncicgaW4gY29sb3Ipe1xuICAgICAgICByZ2IgPSBjb2xvcjtcbiAgICAgICAgaHNsID0gcmdiVG9Ic2woY29sb3IuciwgY29sb3IuZywgY29sb3IuYik7XG4gICAgICAgIGFscGhhID0gaHNsLmEgfHwgYWxwaGEgfHwgMTtcbiAgICB9IGVsc2UgaWYgKCdoJyBpbiBjb2xvcil7XG4gICAgICAgIGhzbCA9IGNvbG9yO1xuICAgICAgICByZ2IgPSBoc2xUb1JnYihjb2xvci5oLCBjb2xvci5zLCBjb2xvci5sKTtcbiAgICAgICAgYWxwaGEgPSByZ2IuYSB8fCBhbHBoYSB8fCAxO1xuICAgIH1cbiAgICB0aGlzLnJnYiA9IHsncic6IHJnYi5yLCAnZyc6IHJnYi5nLCAnYic6IHJnYi5ifTtcbiAgICB0aGlzLmhzbCA9IHsnaCc6IGhzbC5oLCAncyc6IGhzbC5zLCAnbCc6IGhzbC5sfTtcbiAgICB0aGlzLmFscGhhID0gYWxwaGE7XG59XG4vKipcbiAqIExpZ2h0ZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cblxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmxpZ2h0ZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sICsgcGVyY2VudDtcbiAgICBpZiAobHVtID4gMTAwKXtcbiAgICAgICAgbHVtID0gMTAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKHsnaCc6aHNsLmgsICdzJzpoc2wucywgJ2wnOmx1bX0sIHRoaXMuYWxwaGEpO1xufTtcbi8qKlxuICogRGFya2VuIGEgY29sb3IgYnkgdGhlIGdpdmVuIHBlcmNlbnRhZ2UuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG9yfVxuICovXG5Db2xvci5wcm90b3R5cGUuZGFya2VuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCAtIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA8IDApe1xuICAgICAgICBsdW0gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKHsnaCc6aHNsLmgsICdzJzpoc2wucywgJ2wnOmx1bX0sIHRoaXMuYWxwaGEpO1xufTtcbi8qKlxuKiBAcGFyYW0ge251bWJlcn0gaCBIdWVcbiogQHBhcmFtIHtudW1iZXJ9IHMgU2F0dXJhdGlvblxuKiBAcGFyYW0ge251bWJlcn0gbCBMdW1pbmFuY2VcbiogQHJldHVybiB7e3I6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXJ9fVxuKi9cbmhzbFRvUmdiID0gZnVuY3Rpb24oaCwgcywgbCl7XG4gICAgZnVuY3Rpb24gX3YobTEsIG0yLCBodWUpe1xuICAgICAgICBodWUgPSBodWU7XG4gICAgICAgIGlmIChodWUgPCAwKXtodWUrPTE7fVxuICAgICAgICBpZiAoaHVlID4gMSl7aHVlLT0xO31cbiAgICAgICAgaWYgKGh1ZSA8ICgxLzYpKXtcbiAgICAgICAgICAgIHJldHVybiBtMSArIChtMi1tMSkqaHVlKjY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGh1ZSA8IDAuNSl7XG4gICAgICAgICAgICByZXR1cm4gbTI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGh1ZSA8ICgyLzMpKXtcbiAgICAgICAgICAgIHJldHVybiBtMSArIChtMi1tMSkqKCgyLzMpLWh1ZSkqNjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbTE7XG4gICAgfVxuICAgIHZhciBtMjtcbiAgICB2YXIgZnJhY3Rpb25fbCA9IChsLzEwMCk7XG4gICAgdmFyIGZyYWN0aW9uX3MgPSAocy8xMDApO1xuICAgIGlmIChzID09PSAwKXtcbiAgICAgICAgdmFyIGdyYXkgPSBmcmFjdGlvbl9sKjI1NTtcbiAgICAgICAgcmV0dXJuIHsncic6IGdyYXksICdnJzogZ3JheSwgJ2InOiBncmF5fTtcbiAgICB9XG4gICAgaWYgKGwgPD0gNTApe1xuICAgICAgICBtMiA9IGZyYWN0aW9uX2wgKiAoMStmcmFjdGlvbl9zKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgbTIgPSBmcmFjdGlvbl9sK2ZyYWN0aW9uX3MtKGZyYWN0aW9uX2wqZnJhY3Rpb25fcyk7XG4gICAgfVxuICAgIHZhciBtMSA9IDIqZnJhY3Rpb25fbCAtIG0yO1xuICAgIGggPSBoIC8gMzYwO1xuICAgIHJldHVybiB7J3InOiBNYXRoLnJvdW5kKF92KG0xLCBtMiwgaCsoMS8zKSkqMjU1KSwgJ2cnOiBNYXRoLnJvdW5kKF92KG0xLCBtMiwgaCkqMjU1KSwgJ2InOiBNYXRoLnJvdW5kKF92KG0xLCBtMiwgaC0oMS8zKSkqMjU1KX07XG59O1xuLyoqXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHIgUmVkXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGcgR3JlZW5cbiAqIEBwYXJhbSAge251bWJlcn0gYiBCbHVlXG4gKiBAcmV0dXJuIHt7aDogbnVtYmVyLCBzOiBudW1iZXIsIGw6IG51bWJlcn19XG4gKi9cbnJnYlRvSHNsID0gZnVuY3Rpb24ociwgZywgYil7XG4gICAgciA9IHIgLyAyNTU7XG4gICAgZyA9IGcgLyAyNTU7XG4gICAgYiA9IGIgLyAyNTU7XG4gICAgdmFyIG1heGMgPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICB2YXIgbWluYyA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIHZhciBsID0gTWF0aC5yb3VuZCgoKG1pbmMrbWF4YykvMikqMTAwKTtcbiAgICBpZiAobCA+IDEwMCkge2wgPSAxMDA7fVxuICAgIGlmIChsIDwgMCkge2wgPSAwO31cbiAgICB2YXIgaCwgcztcbiAgICBpZiAobWluYyA9PT0gbWF4Yyl7XG4gICAgICAgIHJldHVybiB7J2gnOiAwLCAncyc6IDAsICdsJzogbH07XG4gICAgfVxuICAgIGlmIChsIDw9IDUwKXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKG1heGMrbWluYyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvICgyLW1heGMtbWluYyk7XG4gICAgfVxuICAgIHZhciByYyA9IChtYXhjLXIpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGdjID0gKG1heGMtZykgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgYmMgPSAobWF4Yy1iKSAvIChtYXhjLW1pbmMpO1xuICAgIGlmIChyID09PSBtYXhjKXtcbiAgICAgICAgaCA9IGJjLWdjO1xuICAgIH1cbiAgICBlbHNlIGlmIChnID09PSBtYXhjKXtcbiAgICAgICAgaCA9IDIrcmMtYmM7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIGggPSA0K2djLXJjO1xuICAgIH1cbiAgICBoID0gKGgvNikgJSAxO1xuICAgIGlmIChoIDwgMCl7aCs9MTt9XG4gICAgaCA9IE1hdGgucm91bmQoaCozNjApO1xuICAgIHMgPSBNYXRoLnJvdW5kKHMqMTAwKTtcbiAgICBpZiAoaCA+IDM2MCkge2ggPSAzNjA7fVxuICAgIGlmIChoIDwgMCkge2ggPSAwO31cbiAgICBpZiAocyA+IDEwMCkge3MgPSAxMDA7fVxuICAgIGlmIChzIDwgMCkge3MgPSAwO31cbiAgICByZXR1cm4geydoJzogaCwgJ3MnOiBzLCAnbCc6IGx9O1xufTtcbmRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuLyoqXG4gKiBQYXJzZSBhIENTUyBjb2xvciB2YWx1ZSBhbmQgcmV0dXJuIGFuIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2xvciBBIGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyfX0gICByZ2JhIGNvbG9yIG9iamVjdC5cbiAqIEB0aHJvd3Mge0NvbG9yRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIC8vIFRPRE86IEhvdyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGUgaXMgdGhpcz8gSG93IGVmZmljaWVudD9cbiAgICAvLyBNYWtlIGEgdGVtcG9yYXJ5IEhUTUwgZWxlbWVudCBzdHlsZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3Igc3RyaW5nXG4gICAgLy8gdGhlbiBleHRyYWN0IGFuZCBwYXJzZSB0aGUgY29tcHV0ZWQgcmdiKGEpIHZhbHVlLlxuICAgIC8vIE4uQi4gVGhpcyBjYW4gY3JlYXRlIGEgbG9vb290IG9mIERPTSBub2Rlcy4gSXQncyBub3QgYSBncmVhdCBtZXRob2QuXG4gICAgLy8gVE9ETzogRml4XG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xuICAgIHZhciByZ2JhID0gZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvcjtcbiAgICAvLyBDb252ZXJ0IHN0cmluZyBpbiBmb3JtICdyZ2JbYV0obnVtLCBudW0sIG51bVssIG51bV0pJyB0byBhcnJheSBbJ251bScsICdudW0nLCAnbnVtJ1ssICdudW0nXV1cbiAgICByZ2JhID0gcmdiYS5zbGljZShyZ2JhLmluZGV4T2YoJygnKSsxKS5zbGljZSgwLC0xKS5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XG4gICAgdmFyIHJldHVybl9jb2xvciA9IHt9O1xuICAgIHZhciBjb2xvcl9zcGFjZXMgPSBbJ3InLCAnZycsICdiJywgJ2EnXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJnYmEubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0KHJnYmFbaV0pOyAvLyBBbHBoYSB2YWx1ZSB3aWxsIGJlIGZsb2F0aW5nIHBvaW50LlxuICAgICAgICBpZiAoaXNOYU4odmFsdWUpKXtcbiAgICAgICAgICAgIHRocm93IFwiQ29sb3JFcnJvcjogU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBlcmhhcHMgXCIgKyBjb2xvciArIFwiIGlzIG5vdCBhIGxlZ2FsIENTUyBjb2xvciB2YWx1ZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuX2NvbG9yW2NvbG9yX3NwYWNlc1tpXV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0dXJuX2NvbG9yO1xufTtcbi8vIFByZS13YXJtIHRoZSBjYWNoZSB3aXRoIG5hbWVkIGNvbG9ycywgYXMgdGhlc2UgYXJlIG5vdFxuLy8gY29udmVydGVkIHRvIHJnYiB2YWx1ZXMgYnkgdGhlIHBhcnNlQ29sb3IgZnVuY3Rpb24gYWJvdmUuXG5jYWNoZSA9IHtcbiAgICBcImJsYWNrXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwfSxcbiAgICBcInNpbHZlclwiOiB7XCJyXCI6IDE5MiwgXCJnXCI6IDE5MiwgXCJiXCI6IDE5MiwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNzV9LFxuICAgIFwiZ3JheVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNTB9LFxuICAgIFwid2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDEwMH0sXG4gICAgXCJtYXJvb25cIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJwdXJwbGVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwibGltZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib2xpdmVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJ5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJuYXZ5XCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJ0ZWFsXCI6IHtcInJcIjogMCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImFxdWFcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTY1LCBcImJcIjogMCwgXCJoXCI6IDM5LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiYWxpY2VibHVlXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMjA4LCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjM1LCBcImJcIjogMjE1LCBcImhcIjogMzQsIFwic1wiOiA3OCwgXCJsXCI6IDkxfSxcbiAgICBcImFxdWFtYXJpbmVcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMTIsIFwiaFwiOiAxNjAsIFwic1wiOiAxMDAsIFwibFwiOiA3NX0sXG4gICAgXCJhenVyZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImJlaWdlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjIwLCBcImhcIjogNjAsIFwic1wiOiA1NiwgXCJsXCI6IDkxfSxcbiAgICBcImJpc3F1ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE5NiwgXCJoXCI6IDMzLCBcInNcIjogMTAwLCBcImxcIjogODh9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzUsIFwiYlwiOiAyMDUsIFwiaFwiOiAzNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDkwfSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiclwiOiAxMzgsIFwiZ1wiOiA0MywgXCJiXCI6IDIyNiwgXCJoXCI6IDI3MSwgXCJzXCI6IDc2LCBcImxcIjogNTN9LFxuICAgIFwiYnJvd25cIjoge1wiclwiOiAxNjUsIFwiZ1wiOiA0MiwgXCJiXCI6IDQyLCBcImhcIjogMCwgXCJzXCI6IDU5LCBcImxcIjogNDF9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcInJcIjogMjIyLCBcImdcIjogMTg0LCBcImJcIjogMTM1LCBcImhcIjogMzQsIFwic1wiOiA1NywgXCJsXCI6IDcwfSxcbiAgICBcImNhZGV0Ymx1ZVwiOiB7XCJyXCI6IDk1LCBcImdcIjogMTU4LCBcImJcIjogMTYwLCBcImhcIjogMTgyLCBcInNcIjogMjUsIFwibFwiOiA1MH0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDkwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiY2hvY29sYXRlXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTA1LCBcImJcIjogMzAsIFwiaFwiOiAyNSwgXCJzXCI6IDc1LCBcImxcIjogNDd9LFxuICAgIFwiY29yYWxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxMjcsIFwiYlwiOiA4MCwgXCJoXCI6IDE2LCBcInNcIjogMTAwLCBcImxcIjogNjZ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiclwiOiAxMDAsIFwiZ1wiOiAxNDksIFwiYlwiOiAyMzcsIFwiaFwiOiAyMTksIFwic1wiOiA3OSwgXCJsXCI6IDY2fSxcbiAgICBcImNvcm5zaWxrXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ4LCBcImJcIjogMjIwLCBcImhcIjogNDgsIFwic1wiOiAxMDAsIFwibFwiOiA5M30sXG4gICAgXCJjcmltc29uXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjAsIFwiYlwiOiA2MCwgXCJoXCI6IDM0OCwgXCJzXCI6IDgzLCBcImxcIjogNDd9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtjeWFuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEzOSwgXCJiXCI6IDEzOSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiclwiOiAxODQsIFwiZ1wiOiAxMzQsIFwiYlwiOiAxMSwgXCJoXCI6IDQzLCBcInNcIjogODksIFwibFwiOiAzOH0sXG4gICAgXCJkYXJrZ3JheVwiOiB7XCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNjZ9LFxuICAgIFwiZGFya2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEwMCwgXCJiXCI6IDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiAyMH0sXG4gICAgXCJkYXJrZ3JleVwiOiB7XCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNjZ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcInJcIjogMTg5LCBcImdcIjogMTgzLCBcImJcIjogMTA3LCBcImhcIjogNTYsIFwic1wiOiAzOCwgXCJsXCI6IDU4fSxcbiAgICBcImRhcmttYWdlbnRhXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcInJcIjogODUsIFwiZ1wiOiAxMDcsIFwiYlwiOiA0NywgXCJoXCI6IDgyLCBcInNcIjogMzksIFwibFwiOiAzMH0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTQwLCBcImJcIjogMCwgXCJoXCI6IDMzLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJyXCI6IDE1MywgXCJnXCI6IDUwLCBcImJcIjogMjA0LCBcImhcIjogMjgwLCBcInNcIjogNjEsIFwibFwiOiA1MH0sXG4gICAgXCJkYXJrcmVkXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogMjd9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJyXCI6IDIzMywgXCJnXCI6IDE1MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDE1LCBcInNcIjogNzIsIFwibFwiOiA3MH0sXG4gICAgXCJkYXJrc2VhZ3JlZW5cIjoge1wiclwiOiAxNDMsIFwiZ1wiOiAxODgsIFwiYlwiOiAxNDMsIFwiaFwiOiAxMjAsIFwic1wiOiAyNSwgXCJsXCI6IDY1fSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiclwiOiA3MiwgXCJnXCI6IDYxLCBcImJcIjogMTM5LCBcImhcIjogMjQ4LCBcInNcIjogMzksIFwibFwiOiAzOX0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMTgwLCBcInNcIjogMjUsIFwibFwiOiAyNX0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMTgwLCBcInNcIjogMjUsIFwibFwiOiAyNX0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcInJcIjogMCwgXCJnXCI6IDIwNiwgXCJiXCI6IDIwOSwgXCJoXCI6IDE4MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDQxfSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiclwiOiAxNDgsIFwiZ1wiOiAwLCBcImJcIjogMjExLCBcImhcIjogMjgyLCBcInNcIjogMTAwLCBcImxcIjogNDF9LFxuICAgIFwiZGVlcHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMCwgXCJiXCI6IDE0NywgXCJoXCI6IDMyOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU0fSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDE5MSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE5NSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImRpbWdyYXlcIjoge1wiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDQxfSxcbiAgICBcImRpbWdyZXlcIjoge1wiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDQxfSxcbiAgICBcImRvZGdlcmJsdWVcIjoge1wiclwiOiAzMCwgXCJnXCI6IDE0NCwgXCJiXCI6IDI1NSwgXCJoXCI6IDIxMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU2fSxcbiAgICBcImZpcmVicmlja1wiOiB7XCJyXCI6IDE3OCwgXCJnXCI6IDM0LCBcImJcIjogMzQsIFwiaFwiOiAwLCBcInNcIjogNjgsIFwibFwiOiA0Mn0sXG4gICAgXCJmbG9yYWx3aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI0MCwgXCJoXCI6IDQwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiclwiOiAzNCwgXCJnXCI6IDEzOSwgXCJiXCI6IDM0LCBcImhcIjogMTIwLCBcInNcIjogNjEsIFwibFwiOiAzNH0sXG4gICAgXCJnYWluc2Jvcm9cIjoge1wiclwiOiAyMjAsIFwiZ1wiOiAyMjAsIFwiYlwiOiAyMjAsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDg2fSxcbiAgICBcImdob3N0d2hpdGVcIjoge1wiclwiOiAyNDgsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyNTUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5OX0sXG4gICAgXCJnb2xkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE1LCBcImJcIjogMCwgXCJoXCI6IDUxLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZ29sZGVucm9kXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTY1LCBcImJcIjogMzIsIFwiaFwiOiA0MywgXCJzXCI6IDc0LCBcImxcIjogNDl9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiclwiOiAxNzMsIFwiZ1wiOiAyNTUsIFwiYlwiOiA0NywgXCJoXCI6IDg0LCBcInNcIjogMTAwLCBcImxcIjogNTl9LFxuICAgIFwiZ3JleVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNTB9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJob3RwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTA1LCBcImJcIjogMTgwLCBcImhcIjogMzMwLCBcInNcIjogMTAwLCBcImxcIjogNzF9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcInJcIjogMjA1LCBcImdcIjogOTIsIFwiYlwiOiA5MiwgXCJoXCI6IDAsIFwic1wiOiA1MywgXCJsXCI6IDU4fSxcbiAgICBcImluZGlnb1wiOiB7XCJyXCI6IDc1LCBcImdcIjogMCwgXCJiXCI6IDEzMCwgXCJoXCI6IDI3NSwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcIml2b3J5XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJraGFraVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDIzMCwgXCJiXCI6IDE0MCwgXCJoXCI6IDU0LCBcInNcIjogNzcsIFwibFwiOiA3NX0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJyXCI6IDIzMCwgXCJnXCI6IDIzMCwgXCJiXCI6IDI1MCwgXCJoXCI6IDI0MCwgXCJzXCI6IDY3LCBcImxcIjogOTR9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0MCwgXCJiXCI6IDI0NSwgXCJoXCI6IDM0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImxhd25ncmVlblwiOiB7XCJyXCI6IDEyNCwgXCJnXCI6IDI1MiwgXCJiXCI6IDAsIFwiaFwiOiA5MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDQ5fSxcbiAgICBcImxlbW9uY2hpZmZvblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDIwNSwgXCJoXCI6IDU0LCBcInNcIjogMTAwLCBcImxcIjogOTB9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcInJcIjogMTczLCBcImdcIjogMjE2LCBcImJcIjogMjMwLCBcImhcIjogMTk1LCBcInNcIjogNTMsIFwibFwiOiA3OX0sXG4gICAgXCJsaWdodGNvcmFsXCI6IHtcInJcIjogMjQwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDc5LCBcImxcIjogNzJ9LFxuICAgIFwibGlnaHRjeWFuXCI6IHtcInJcIjogMjI0LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMTAsIFwiaFwiOiA2MCwgXCJzXCI6IDgwLCBcImxcIjogOTB9LFxuICAgIFwibGlnaHRncmF5XCI6IHtcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4M30sXG4gICAgXCJsaWdodGdyZWVuXCI6IHtcInJcIjogMTQ0LCBcImdcIjogMjM4LCBcImJcIjogMTQ0LCBcImhcIjogMTIwLCBcInNcIjogNzMsIFwibFwiOiA3NX0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDgzfSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE4MiwgXCJiXCI6IDE5MywgXCJoXCI6IDM1MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDg2fSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTYwLCBcImJcIjogMTIyLCBcImhcIjogMTcsIFwic1wiOiAxMDAsIFwibFwiOiA3NH0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcInJcIjogMzIsIFwiZ1wiOiAxNzgsIFwiYlwiOiAxNzAsIFwiaFwiOiAxNzcsIFwic1wiOiA3MCwgXCJsXCI6IDQxfSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDI1MCwgXCJoXCI6IDIwMywgXCJzXCI6IDkyLCBcImxcIjogNzV9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAyMTAsIFwic1wiOiAxNCwgXCJsXCI6IDUzfSxcbiAgICBcImxpZ2h0c2xhdGVncmV5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMjEwLCBcInNcIjogMTQsIFwibFwiOiA1M30sXG4gICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDE3NiwgXCJnXCI6IDE5NiwgXCJiXCI6IDIyMiwgXCJoXCI6IDIxNCwgXCJzXCI6IDQxLCBcImxcIjogNzh9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMjQsIFwiaFwiOiA2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJyXCI6IDUwLCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiAxMjAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfSxcbiAgICBcImxpbmVuXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjQwLCBcImJcIjogMjMwLCBcImhcIjogMzAsIFwic1wiOiA2NywgXCJsXCI6IDk0fSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiclwiOiAxMDIsIFwiZ1wiOiAyMDUsIFwiYlwiOiAxNzAsIFwiaFwiOiAxNjAsIFwic1wiOiA1MSwgXCJsXCI6IDYwfSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDIwNSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDQwfSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJyXCI6IDE4NiwgXCJnXCI6IDg1LCBcImJcIjogMjExLCBcImhcIjogMjg4LCBcInNcIjogNTksIFwibFwiOiA1OH0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiclwiOiAxNDcsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTksIFwiaFwiOiAyNjAsIFwic1wiOiA2MCwgXCJsXCI6IDY1fSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcInJcIjogNjAsIFwiZ1wiOiAxNzksIFwiYlwiOiAxMTMsIFwiaFwiOiAxNDcsIFwic1wiOiA1MCwgXCJsXCI6IDQ3fSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEyMywgXCJnXCI6IDEwNCwgXCJiXCI6IDIzOCwgXCJoXCI6IDI0OSwgXCJzXCI6IDgwLCBcImxcIjogNjd9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjUwLCBcImJcIjogMTU0LCBcImhcIjogMTU3LCBcInNcIjogMTAwLCBcImxcIjogNDl9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiAyMDksIFwiYlwiOiAyMDQsIFwiaFwiOiAxNzgsIFwic1wiOiA2MCwgXCJsXCI6IDU1fSxcbiAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiB7XCJyXCI6IDE5OSwgXCJnXCI6IDIxLCBcImJcIjogMTMzLCBcImhcIjogMzIyLCBcInNcIjogODEsIFwibFwiOiA0M30sXG4gICAgXCJtaWRuaWdodGJsdWVcIjoge1wiclwiOiAyNSwgXCJnXCI6IDI1LCBcImJcIjogMTEyLCBcImhcIjogMjQwLCBcInNcIjogNjQsIFwibFwiOiAyN30sXG4gICAgXCJtaW50Y3JlYW1cIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTAsIFwiaFwiOiAxNTAsIFwic1wiOiAxMDAsIFwibFwiOiA5OH0sXG4gICAgXCJtaXN0eXJvc2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAyMjUsIFwiaFwiOiA2LCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibW9jY2FzaW5cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxODEsIFwiaFwiOiAzOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg1fSxcbiAgICBcIm5hdmFqb3doaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjIyLCBcImJcIjogMTczLCBcImhcIjogMzYsIFwic1wiOiAxMDAsIFwibFwiOiA4NH0sXG4gICAgXCJvbGRsYWNlXCI6IHtcInJcIjogMjUzLCBcImdcIjogMjQ1LCBcImJcIjogMjMwLCBcImhcIjogMzksIFwic1wiOiA4NSwgXCJsXCI6IDk1fSxcbiAgICBcIm9saXZlZHJhYlwiOiB7XCJyXCI6IDEwNywgXCJnXCI6IDE0MiwgXCJiXCI6IDM1LCBcImhcIjogODAsIFwic1wiOiA2MCwgXCJsXCI6IDM1fSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDY5LCBcImJcIjogMCwgXCJoXCI6IDE2LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib3JjaGlkXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTEyLCBcImJcIjogMjE0LCBcImhcIjogMzAyLCBcInNcIjogNTksIFwibFwiOiA2NX0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcInJcIjogMjM4LCBcImdcIjogMjMyLCBcImJcIjogMTcwLCBcImhcIjogNTUsIFwic1wiOiA2NywgXCJsXCI6IDgwfSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJyXCI6IDE1MiwgXCJnXCI6IDI1MSwgXCJiXCI6IDE1MiwgXCJoXCI6IDEyMCwgXCJzXCI6IDkzLCBcImxcIjogNzl9LFxuICAgIFwicGFsZXR1cnF1b2lzZVwiOiB7XCJyXCI6IDE3NSwgXCJnXCI6IDIzOCwgXCJiXCI6IDIzOCwgXCJoXCI6IDE4MCwgXCJzXCI6IDY1LCBcImxcIjogODF9LFxuICAgIFwicGFsZXZpb2xldHJlZFwiOiB7XCJyXCI6IDIxOSwgXCJnXCI6IDExMiwgXCJiXCI6IDE0NywgXCJoXCI6IDM0MCwgXCJzXCI6IDYwLCBcImxcIjogNjV9LFxuICAgIFwicGFwYXlhd2hpcFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIzOSwgXCJiXCI6IDIxMywgXCJoXCI6IDM3LCBcInNcIjogMTAwLCBcImxcIjogOTJ9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE4LCBcImJcIjogMTg1LCBcImhcIjogMjgsIFwic1wiOiAxMDAsIFwibFwiOiA4Nn0sXG4gICAgXCJwZXJ1XCI6IHtcInJcIjogMjA1LCBcImdcIjogMTMzLCBcImJcIjogNjMsIFwiaFwiOiAzMCwgXCJzXCI6IDU5LCBcImxcIjogNTN9LFxuICAgIFwicGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE5MiwgXCJiXCI6IDIwMywgXCJoXCI6IDM1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg4fSxcbiAgICBcInBsdW1cIjoge1wiclwiOiAyMjEsIFwiZ1wiOiAxNjAsIFwiYlwiOiAyMjEsIFwiaFwiOiAzMDAsIFwic1wiOiA0NywgXCJsXCI6IDc1fSxcbiAgICBcInBvd2RlcmJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMzAsIFwiaFwiOiAxODcsIFwic1wiOiA1MiwgXCJsXCI6IDgwfSxcbiAgICBcInJvc3licm93blwiOiB7XCJyXCI6IDE4OCwgXCJnXCI6IDE0MywgXCJiXCI6IDE0MywgXCJoXCI6IDAsIFwic1wiOiAyNSwgXCJsXCI6IDY1fSxcbiAgICBcInJveWFsYmx1ZVwiOiB7XCJyXCI6IDY1LCBcImdcIjogMTA1LCBcImJcIjogMjI1LCBcImhcIjogMjI1LCBcInNcIjogNzMsIFwibFwiOiA1N30sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDY5LCBcImJcIjogMTksIFwiaFwiOiAyNSwgXCJzXCI6IDc2LCBcImxcIjogMzF9LFxuICAgIFwic2FsbW9uXCI6IHtcInJcIjogMjUwLCBcImdcIjogMTI4LCBcImJcIjogMTE0LCBcImhcIjogNiwgXCJzXCI6IDkzLCBcImxcIjogNzF9LFxuICAgIFwic2FuZHlicm93blwiOiB7XCJyXCI6IDI0NCwgXCJnXCI6IDE2NCwgXCJiXCI6IDk2LCBcImhcIjogMjgsIFwic1wiOiA4NywgXCJsXCI6IDY3fSxcbiAgICBcInNlYWdyZWVuXCI6IHtcInJcIjogNDYsIFwiZ1wiOiAxMzksIFwiYlwiOiA4NywgXCJoXCI6IDE0NiwgXCJzXCI6IDUwLCBcImxcIjogMzZ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMzgsIFwiaFwiOiAyNSwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcInNpZW5uYVwiOiB7XCJyXCI6IDE2MCwgXCJnXCI6IDgyLCBcImJcIjogNDUsIFwiaFwiOiAxOSwgXCJzXCI6IDU2LCBcImxcIjogNDB9LFxuICAgIFwic2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDIzNSwgXCJoXCI6IDE5NywgXCJzXCI6IDcxLCBcImxcIjogNzN9LFxuICAgIFwic2xhdGVibHVlXCI6IHtcInJcIjogMTA2LCBcImdcIjogOTAsIFwiYlwiOiAyMDUsIFwiaFwiOiAyNDgsIFwic1wiOiA1MywgXCJsXCI6IDU4fSxcbiAgICBcInNsYXRlZ3JheVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDIxMCwgXCJzXCI6IDEzLCBcImxcIjogNTB9LFxuICAgIFwic2xhdGVncmV5XCI6IHtcInJcIjogMTEyLCBcImdcIjogMTI4LCBcImJcIjogMTQ0LCBcImhcIjogMjEwLCBcInNcIjogMTMsIFwibFwiOiA1MH0sXG4gICAgXCJzbm93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjUwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk5fSxcbiAgICBcInNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDEyNywgXCJoXCI6IDE1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDcwLCBcImdcIjogMTMwLCBcImJcIjogMTgwLCBcImhcIjogMjA3LCBcInNcIjogNDQsIFwibFwiOiA0OX0sXG4gICAgXCJ0YW5cIjoge1wiclwiOiAyMTAsIFwiZ1wiOiAxODAsIFwiYlwiOiAxNDAsIFwiaFwiOiAzNCwgXCJzXCI6IDQ0LCBcImxcIjogNjl9LFxuICAgIFwidGhpc3RsZVwiOiB7XCJyXCI6IDIxNiwgXCJnXCI6IDE5MSwgXCJiXCI6IDIxNiwgXCJoXCI6IDMwMCwgXCJzXCI6IDI0LCBcImxcIjogODB9LFxuICAgIFwidG9tYXRvXCI6IHtcInJcIjogMjU1LCBcImdcIjogOTksIFwiYlwiOiA3MSwgXCJoXCI6IDksIFwic1wiOiAxMDAsIFwibFwiOiA2NH0sXG4gICAgXCJ0dXJxdW9pc2VcIjoge1wiclwiOiA2NCwgXCJnXCI6IDIyNCwgXCJiXCI6IDIwOCwgXCJoXCI6IDE3NCwgXCJzXCI6IDcyLCBcImxcIjogNTZ9LFxuICAgIFwidmlvbGV0XCI6IHtcInJcIjogMjM4LCBcImdcIjogMTMwLCBcImJcIjogMjM4LCBcImhcIjogMzAwLCBcInNcIjogNzYsIFwibFwiOiA3Mn0sXG4gICAgXCJ3aGVhdFwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3OSwgXCJoXCI6IDM5LCBcInNcIjogNzcsIFwibFwiOiA4M30sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjQ1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA5Nn0sXG4gICAgXCJ5ZWxsb3dncmVlblwiOiB7XCJyXCI6IDE1NCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogODAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjtcbiIsInJlcXVpcmUoJy4vLi4vdGVzdHMvY29sb3IuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvaGVscGVycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9kYXRhL2NvbG9ycy5qcycpO1xuIiwidmFyIENvbG9yID0gcmVxdWlyZSgnLi4vc3JjL2NvbG91ci5qcycpO1xudmFyIG5hbWVkID0gcmVxdWlyZSgnLi9kYXRhL2NvbG9ycy5qcycpO1xudmFyIG5lYXJseUVxdWFsID0gcmVxdWlyZSgnLi9oZWxwZXJzLmpzJylbJ25lYXJseUVxdWFsJ107XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgYmx1ZSwgcmdiLCByZ2JhLCBoc2wsIGhzbGE7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVkID0gbmV3IENvbG9yKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvcihcIiMwRjBcIik7IC8vIE5hbWVkIGNvbG9yICdncmVlbicgaXMgcmdiKDAsMTI4LDApXG4gICAgICAgIGJsdWUgPSBuZXcgQ29sb3IoXCJibHVlXCIpO1xuICAgICAgICByZ2IgPSBuZXcgQ29sb3IoXCJyZ2IoMSwgNywgMjkpXCIpO1xuICAgICAgICByZ2JhID0gbmV3IENvbG9yKFwicmdiYSgxLCA3LCAyOSwgMC4zKVwiKTtcbiAgICAgICAgaHNsID0gbmV3IENvbG9yKFwiaHNsKDAsIDEwMCUsIDUwJSlcIik7XG4gICAgICAgIGhzbGEgPSBuZXcgQ29sb3IoXCJoc2xhKDAsIDEwMCUsIDUwJSwgMC4zKVwiKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ3JnYicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLnIsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuZywgNyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLmFscGhhLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5yLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5nLCA3KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBjb2xvciBpbiBuYW1lZCl7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVkLmhhc093blByb3BlcnR5KGNvbG9yKSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmV3IENvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhleCA9IG5ldyBDb2xvcihuYW1lZFtjb2xvcl0uaGV4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVkX3JnYiA9IG5hbWVkW2NvbG9yXS5yZ2I7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBoZXgucmdiLnIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuZywgaGV4LnJnYi5nKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmIsIGhleC5yZ2IuYik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBuYW1lZF9yZ2Iucik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5nLCBuYW1lZF9yZ2IuZyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5iLCBuYW1lZF9yZ2IuYik7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2hzbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5sLCA1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbC5oc2wucywgMTAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmwsIDUwKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2wuYWxwaGEsIDEpKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYS5oc2wubCwgNTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKGhzbGEuYWxwaGEsIDAuMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgY29sb3IgaW4gbmFtZWQpe1xuICAgICAgICAgICAgICAgIGlmIChuYW1lZC5oYXNPd25Qcm9wZXJ0eShjb2xvcikpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBDb2xvcihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3IobmFtZWRbY29sb3JdLmhleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lZF9oc2wgPSBuYW1lZFtjb2xvcl0ucmdiO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgaGV4LnJnYi5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIGhleC5yZ2Iucyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5sLCBoZXgucmdiLmwpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgbmFtZWRfaHNsLmgpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IucywgbmFtZWRfaHNsLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgbmFtZWRfaHNsLmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FscGhhJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZWQuYWxwaGEsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZ2JhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2xhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdsaWdodGVuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciByMyA9IHJlZC5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4ubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgZzMgPSBncmVlbi5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGIzID0gYmx1ZS5saWdodGVuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZGFya2VuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIHIyID0gcmVkLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQuZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgZzIgPSBncmVlbi5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4uZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciBiMiA9IGJsdWUuZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUuZGFya2VuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuZywgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5nLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5iLCAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgbmFtZWRjb2xvcnMgPSB7XG4gICAgXCJhbGljZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogMCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjBmOGZmXCJ9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyMzUsXCJiXCI6IDIxNSB9LCBcImhleFwiOiBcIiNmYWViZDdcIn0sXG4gICAgXCJhcXVhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiYXF1YW1hcmluZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiAxMDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjcsXCJnXCI6IDI1NSxcImJcIjogMjEyIH0sIFwiaGV4XCI6IFwiIzdmZmZkNFwifSxcbiAgICBcImF6dXJlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2YwZmZmZlwifSxcbiAgICBcImJlaWdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2Y1ZjVkY1wifSxcbiAgICBcImJpc3F1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMTk2IH0sIFwiaGV4XCI6IFwiI2ZmZTRjNFwifSxcbiAgICBcImJsYWNrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDAwMDAwXCJ9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMzUsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiNmZmViY2RcIn0sXG4gICAgXCJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMDAwZmZcIn0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMTM4LFwiZ1wiOiA0MyxcImJcIjogMjI2IH0sIFwiaGV4XCI6IFwiIzhhMmJlMlwifSxcbiAgICBcImJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTY1LFwiZ1wiOiA0MixcImJcIjogNDIgfSwgXCJoZXhcIjogXCIjYTUyYTJhXCJ9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMixcImdcIjogMTg0LFwiYlwiOiAxMzUgfSwgXCJoZXhcIjogXCIjZGViODg3XCJ9LFxuICAgIFwiY2FkZXRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDk1LFwiZ1wiOiAxNTgsXCJiXCI6IDE2MCB9LCBcImhleFwiOiBcIiM1ZjllYTBcIn0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNyxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzdmZmYwMFwifSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTAsXCJnXCI6IDEwNSxcImJcIjogMzAgfSwgXCJoZXhcIjogXCIjZDI2OTFlXCJ9LFxuICAgIFwiY29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDEyNyxcImJcIjogODAgfSwgXCJoZXhcIjogXCIjZmY3ZjUwXCJ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjA4LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTAwLFwiZ1wiOiAxNDksXCJiXCI6IDIzNyB9LCBcImhleFwiOiBcIiM2NDk1ZWRcIn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNzgsXCJsXCI6IDkxIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDgsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNmZmY4ZGNcIn0sXG4gICAgXCJjcmltc29uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2MCxcInNcIjogMTAwLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjAsXCJiXCI6IDYwIH0sIFwiaGV4XCI6IFwiI2RjMTQzY1wifSxcbiAgICBcImN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDU2LFwibFwiOiA5MSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiMwMDAwOGJcIn0sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA4OCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEzOSxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzAwOGI4YlwifSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMzYsXCJzXCI6IDEwMCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxODQsXCJnXCI6IDEzNCxcImJcIjogMTEgfSwgXCJoZXhcIjogXCIjYjg4NjBiXCJ9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjcxLFwic1wiOiA3NixcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjksXCJnXCI6IDE2OSxcImJcIjogMTY5IH0sIFwiaGV4XCI6IFwiI2E5YTlhOVwifSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA1OSxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA2NDAwXCJ9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDU3LFwibFwiOiA3MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE2OSxcImdcIjogMTY5LFwiYlwiOiAxNjkgfSwgXCJoZXhcIjogXCIjYTlhOWE5XCJ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MixcInNcIjogMjUsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTg5LFwiZ1wiOiAxODMsXCJiXCI6IDEwNyB9LCBcImhleFwiOiBcIiNiZGI3NmJcIn0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiA5MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOSxcImdcIjogMCxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzhiMDA4YlwifSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NSxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiA4NSxcImdcIjogMTA3LFwiYlwiOiA0NyB9LCBcImhleFwiOiBcIiM1NTZiMmZcIn0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY4YzAwXCJ9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTksXCJzXCI6IDc5LFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE1MyxcImdcIjogNTAsXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM5OTMyY2NcIn0sXG4gICAgXCJkYXJrcmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQ4LFwic1wiOiAxMDAsXCJsXCI6IDkzIH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzhiMDAwMFwifSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogMzQ4LFwic1wiOiA4MyxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzMsXCJnXCI6IDE1MCxcImJcIjogMTIyIH0sIFwiaGV4XCI6IFwiI2U5OTY3YVwifSxcbiAgICBcImRhcmtzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDMsXCJnXCI6IDE4OCxcImJcIjogMTQzIH0sIFwiaGV4XCI6IFwiIzhmYmM4ZlwifSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogNzIsXCJnXCI6IDYxLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjNDgzZDhiXCJ9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogODksXCJsXCI6IDM4IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiAyMCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDIwNixcImJcIjogMjA5IH0sIFwiaGV4XCI6IFwiIzAwY2VkMVwifSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDgsXCJnXCI6IDAsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiM5NDAwZDNcIn0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiA1NixcInNcIjogMzgsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMCxcImJcIjogMTQ3IH0sIFwiaGV4XCI6IFwiI2ZmMTQ5M1wifSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDE5MSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwYmZmZlwifSxcbiAgICBcImRpbWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogODIsXCJzXCI6IDM5LFwibFwiOiAzMCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZGltZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDMwLFwiZ1wiOiAxNDQsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMxZTkwZmZcIn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDE3OCxcImdcIjogMzQsXCJiXCI6IDM0IH0sIFwiaGV4XCI6IFwiI2IyMjIyMlwifSxcbiAgICBcImZsb3JhbHdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1LFwic1wiOiA3MixcImxcIjogNzAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2ZmZmFmMFwifSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMzQsXCJnXCI6IDEzOSxcImJcIjogMzQgfSwgXCJoZXhcIjogXCIjMjI4YjIyXCJ9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDgsXCJzXCI6IDM5LFwibFwiOiAzOSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcImdhaW5zYm9yb1wiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjIwLFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZGNkY2RjXCJ9LFxuICAgIFwiZ2hvc3R3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0OCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjhmOGZmXCJ9LFxuICAgIFwiZ29sZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODEsXCJzXCI6IDEwMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIxNSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmQ3MDBcIn0sXG4gICAgXCJnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMjgyLFwic1wiOiAxMDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxNjUsXCJiXCI6IDMyIH0sIFwiaGV4XCI6IFwiI2RhYTUyMFwifSxcbiAgICBcImdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzI4LFwic1wiOiAxMDAsXCJsXCI6IDU0IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDgwODBcIn0sXG4gICAgXCJncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA4MDAwXCJ9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDI1NSxcImJcIjogNDcgfSwgXCJoZXhcIjogXCIjYWRmZjJmXCJ9LFxuICAgIFwiZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODA4MDgwXCJ9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxMDAsXCJsXCI6IDU2IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNTUsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmMGZmZjBcIn0sXG4gICAgXCJob3RwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDY4LFwibFwiOiA0MiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTA1LFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjZmY2OWI0XCJ9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjA1LFwiZ1wiOiA5MixcImJcIjogOTIgfSwgXCJoZXhcIjogXCIjY2Q1YzVjXCJ9LFxuICAgIFwiaW5kaWdvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNjEsXCJsXCI6IDM0IH0sIFwicmdiXCI6IHtcInJcIjogNzUsXCJnXCI6IDAsXCJiXCI6IDEzMCB9LCBcImhleFwiOiBcIiM0YjAwODJcIn0sXG4gICAgXCJpdm9yeVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZmZmZmYwXCJ9LFxuICAgIFwia2hha2lcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDk5IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyMzAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNmMGU2OGNcIn0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJoc2xcIjoge1wiaFwiOiA1MSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIzMCxcImdcIjogMjMwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZTZlNmZhXCJ9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogNzQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDAsXCJiXCI6IDI0NSB9LCBcImhleFwiOiBcIiNmZmYwZjVcIn0sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogODQsXCJzXCI6IDEwMCxcImxcIjogNTkgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjQsXCJnXCI6IDI1MixcImJcIjogMCB9LCBcImhleFwiOiBcIiM3Y2ZjMDBcIn0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiI2ZmZmFjZFwifSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDIxNixcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2FkZDhlNlwifSxcbiAgICBcImxpZ2h0Y29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzMwLFwic1wiOiAxMDAsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiNmMDgwODBcIn0sXG4gICAgXCJsaWdodGN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNTMsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjI0LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNlMGZmZmZcIn0sXG4gICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyNzUsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDI1MCxcImJcIjogMjEwIH0sIFwiaGV4XCI6IFwiI2ZhZmFkMlwifSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMSxcImdcIjogMjExLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjZDNkM2QzXCJ9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA1NCxcInNcIjogNzcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTQ0LFwiZ1wiOiAyMzgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM5MGVlOTBcIn0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiA2NyxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTEsXCJnXCI6IDIxMSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2QzZDNkM1wifSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE4MixcImJcIjogMTkzIH0sIFwiaGV4XCI6IFwiI2ZmYjZjMVwifSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDkwLFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNjAsXCJiXCI6IDEyMiB9LCBcImhleFwiOiBcIiNmZmEwN2FcIn0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU0LFwic1wiOiAxMDAsXCJsXCI6IDkwIH0sIFwicmdiXCI6IHtcInJcIjogMzIsXCJnXCI6IDE3OCxcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiIzIwYjJhYVwifSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDUzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDEzNSxcImdcIjogMjA2LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjODdjZWZhXCJ9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNzksXCJsXCI6IDcyIH0sIFwicmdiXCI6IHtcInJcIjogMTE5LFwiZ1wiOiAxMzYsXCJiXCI6IDE1MyB9LCBcImhleFwiOiBcIiM3Nzg4OTlcIn0sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTksXCJnXCI6IDEzNixcImJcIjogMTUzIH0sIFwiaGV4XCI6IFwiIzc3ODg5OVwifSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiA4MCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzYsXCJnXCI6IDE5NixcImJcIjogMjIyIH0sIFwiaGV4XCI6IFwiI2IwYzRkZVwifSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDIyNCB9LCBcImhleFwiOiBcIiNmZmZmZTBcIn0sXG4gICAgXCJsaW1lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNzMsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwZmYwMFwifSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDUwLFwiZ1wiOiAyMDUsXCJiXCI6IDUwIH0sIFwiaGV4XCI6IFwiIzMyY2QzMlwifSxcbiAgICBcImxpbmVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM1MSxcInNcIjogMTAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjQwLFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjZmFmMGU2XCJ9LFxuICAgIFwibWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNyxcInNcIjogMTAwLFwibFwiOiA3NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcIm1hcm9vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzcsXCJzXCI6IDcwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4MDAwMDBcIn0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwMyxcInNcIjogOTIsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTAyLFwiZ1wiOiAyMDUsXCJiXCI6IDE3MCB9LCBcImhleFwiOiBcIiM2NmNkYWFcIn0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTQsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiIzAwMDBjZFwifSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDE0LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDE4NixcImdcIjogODUsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNiYTU1ZDNcIn0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMjE0LFwic1wiOiA0MSxcImxcIjogNzggfSwgXCJyZ2JcIjoge1wiclwiOiAxNDcsXCJnXCI6IDExMixcImJcIjogMjE5IH0sIFwiaGV4XCI6IFwiIzkzNzBkYlwifSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogNjAsXCJnXCI6IDE3OSxcImJcIjogMTEzIH0sIFwiaGV4XCI6IFwiIzNjYjM3MVwifSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyMyxcImdcIjogMTA0LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjN2I2OGVlXCJ9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDY3LFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1MCxcImJcIjogMTU0IH0sIFwiaGV4XCI6IFwiIzAwZmE5YVwifSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNjAsXCJzXCI6IDUxLFwibFwiOiA2MCB9LCBcInJnYlwiOiB7XCJyXCI6IDcyLFwiZ1wiOiAyMDksXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM0OGQxY2NcIn0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDQwIH0sIFwicmdiXCI6IHtcInJcIjogMTk5LFwiZ1wiOiAyMSxcImJcIjogMTMzIH0sIFwiaGV4XCI6IFwiI2M3MTU4NVwifSxcbiAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODgsXCJzXCI6IDU5LFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1LFwiZ1wiOiAyNSxcImJcIjogMTEyIH0sIFwiaGV4XCI6IFwiIzE5MTk3MFwifSxcbiAgICBcIm1pbnRjcmVhbVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNjAsXCJzXCI6IDYwLFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjU1LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZjVmZmZhXCJ9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NyxcInNcIjogNTAsXCJsXCI6IDQ3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDIyNSB9LCBcImhleFwiOiBcIiNmZmU0ZTFcIn0sXG4gICAgXCJtb2NjYXNpblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDksXCJzXCI6IDgwLFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAxODEgfSwgXCJoZXhcIjogXCIjZmZlNGI1XCJ9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTU3LFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjIsXCJiXCI6IDE3MyB9LCBcImhleFwiOiBcIiNmZmRlYWRcIn0sXG4gICAgXCJuYXZ5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3OCxcInNcIjogNjAsXCJsXCI6IDU1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzAwMDA4MFwifSxcbiAgICBcIm9sZGxhY2VcIjoge1wiaHNsXCI6IHtcImhcIjogMzIyLFwic1wiOiA4MSxcImxcIjogNDMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTMsXCJnXCI6IDI0NSxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2ZkZjVlNlwifSxcbiAgICBcIm9saXZlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogNjQsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjODA4MDAwXCJ9LFxuICAgIFwib2xpdmVkcmFiXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1MCxcInNcIjogMTAwLFwibFwiOiA5OCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNyxcImdcIjogMTQyLFwiYlwiOiAzNSB9LCBcImhleFwiOiBcIiM2YjhlMjNcIn0sXG4gICAgXCJvcmFuZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTY1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmYTUwMFwifSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOCxcInNcIjogMTAwLFwibFwiOiA4NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogNjksXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY0NTAwXCJ9LFxuICAgIFwib3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM2LFwic1wiOiAxMDAsXCJsXCI6IDg0IH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxMTIsXCJiXCI6IDIxNCB9LCBcImhleFwiOiBcIiNkYTcwZDZcIn0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA4NSxcImxcIjogOTUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDIzMixcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiI2VlZThhYVwifSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MCxcInNcIjogNjAsXCJsXCI6IDM1IH0sIFwicmdiXCI6IHtcInJcIjogMTUyLFwiZ1wiOiAyNTEsXCJiXCI6IDE1MiB9LCBcImhleFwiOiBcIiM5OGZiOThcIn0sXG4gICAgXCJwYWxldHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTc1LFwiZ1wiOiAyMzgsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNhZmVlZWVcIn0sXG4gICAgXCJwYWxldmlvbGV0cmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMixcInNcIjogNTksXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjE5LFwiZ1wiOiAxMTIsXCJiXCI6IDE0NyB9LCBcImhleFwiOiBcIiNkYjcwOTNcIn0sXG4gICAgXCJwYXBheWF3aGlwXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU1LFwic1wiOiA2NyxcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIzOSxcImJcIjogMjEzIH0sIFwiaGV4XCI6IFwiI2ZmZWZkNVwifSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDkzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjE4LFwiYlwiOiAxODUgfSwgXCJoZXhcIjogXCIjZmZkYWI5XCJ9LFxuICAgIFwicGVydVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDY1LFwibFwiOiA4MSB9LCBcInJnYlwiOiB7XCJyXCI6IDIwNSxcImdcIjogMTMzLFwiYlwiOiA2MyB9LCBcImhleFwiOiBcIiNjZDg1M2ZcIn0sXG4gICAgXCJwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0MCxcInNcIjogNjAsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxOTIsXCJiXCI6IDIwMyB9LCBcImhleFwiOiBcIiNmZmMwY2JcIn0sXG4gICAgXCJwbHVtXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM3LFwic1wiOiAxMDAsXCJsXCI6IDkyIH0sIFwicmdiXCI6IHtcInJcIjogMjIxLFwiZ1wiOiAxNjAsXCJiXCI6IDIyMSB9LCBcImhleFwiOiBcIiNkZGEwZGRcIn0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4LFwic1wiOiAxMDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMTc2LFwiZ1wiOiAyMjQsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNiMGUwZTZcIn0sXG4gICAgXCJwdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDU5LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwMDA4MFwifSxcbiAgICBcInJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNTAsXCJzXCI6IDEwMCxcImxcIjogODggfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmYwMDAwXCJ9LFxuICAgIFwicm9zeWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogNDcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTg4LFwiZ1wiOiAxNDMsXCJiXCI6IDE0MyB9LCBcImhleFwiOiBcIiNiYzhmOGZcIn0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTg3LFwic1wiOiA1MixcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiA2NSxcImdcIjogMTA1LFwiYlwiOiAyMjUgfSwgXCJoZXhcIjogXCIjNDE2OWUxXCJ9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiA2OSxcImJcIjogMTkgfSwgXCJoZXhcIjogXCIjOGI0NTEzXCJ9LFxuICAgIFwic2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIyNSxcInNcIjogNzMsXCJsXCI6IDU3IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAxMjgsXCJiXCI6IDExNCB9LCBcImhleFwiOiBcIiNmYTgwNzJcIn0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NixcImxcIjogMzEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDQsXCJnXCI6IDE2NCxcImJcIjogOTYgfSwgXCJoZXhcIjogXCIjZjRhNDYwXCJ9LFxuICAgIFwic2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogOTMsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogNDYsXCJnXCI6IDEzOSxcImJcIjogODcgfSwgXCJoZXhcIjogXCIjMmU4YjU3XCJ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiaHNsXCI6IHtcImhcIjogMjgsXCJzXCI6IDg3LFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjQ1LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjZmZmNWVlXCJ9LFxuICAgIFwic2llbm5hXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NixcInNcIjogNTAsXCJsXCI6IDM2IH0sIFwicmdiXCI6IHtcInJcIjogMTYwLFwiZ1wiOiA4MixcImJcIjogNDUgfSwgXCJoZXhcIjogXCIjYTA1MjJkXCJ9LFxuICAgIFwic2lsdmVyXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTkyLFwiZ1wiOiAxOTIsXCJiXCI6IDE5MiB9LCBcImhleFwiOiBcIiNjMGMwYzBcIn0sXG4gICAgXCJza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5LFwic1wiOiA1NixcImxcIjogNDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzUsXCJnXCI6IDIwNixcImJcIjogMjM1IH0sIFwiaGV4XCI6IFwiIzg3Y2VlYlwifSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTcsXCJzXCI6IDcxLFwibFwiOiA3MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNixcImdcIjogOTAsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiM2YTVhY2RcIn0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQ4LFwic1wiOiA1MyxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAxMTIsXCJnXCI6IDEyOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzcwODA5MFwifSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDExMixcImdcIjogMTI4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjNzA4MDkwXCJ9LFxuICAgIFwic25vd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZmZmYWZhXCJ9LFxuICAgIFwic3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiA5OSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMTI3IH0sIFwiaGV4XCI6IFwiIzAwZmY3ZlwifSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiA3MCxcImdcIjogMTMwLFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjNDY4MmI0XCJ9LFxuICAgIFwidGFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwNyxcInNcIjogNDQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjEwLFwiZ1wiOiAxODAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNkMmI0OGNcIn0sXG4gICAgXCJ0ZWFsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA0NCxcImxcIjogNjkgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiMwMDgwODBcIn0sXG4gICAgXCJ0aGlzdGxlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMjQsXCJsXCI6IDgwIH0sIFwicmdiXCI6IHtcInJcIjogMjE2LFwiZ1wiOiAxOTEsXCJiXCI6IDIxNiB9LCBcImhleFwiOiBcIiNkOGJmZDhcIn0sXG4gICAgXCJ0b21hdG9cIjoge1wiaHNsXCI6IHtcImhcIjogOSxcInNcIjogMTAwLFwibFwiOiA2NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogOTksXCJiXCI6IDcxIH0sIFwiaGV4XCI6IFwiI2ZmNjM0N1wifSxcbiAgICBcInR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzQsXCJzXCI6IDcyLFwibFwiOiA1NiB9LCBcInJnYlwiOiB7XCJyXCI6IDY0LFwiZ1wiOiAyMjQsXCJiXCI6IDIwOCB9LCBcImhleFwiOiBcIiM0MGUwZDBcIn0sXG4gICAgXCJ2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiA3NixcImxcIjogNzIgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDEzMCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2VlODJlZVwifSxcbiAgICBcIndoZWF0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA3NyxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDIyMixcImJcIjogMTc5IH0sIFwiaGV4XCI6IFwiI2Y1ZGViM1wifSxcbiAgICBcIndoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDk2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmZmZmZmZcIn0sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDgwLFwic1wiOiA2MSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjQ1IH0sIFwiaGV4XCI6IFwiI2Y1ZjVmNVwifSxcInllbGxvd1wiOiB7IFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZmZjAwXCJ9LFwieWVsbG93Z3JlZW5cIjogeyBcInJnYlwiOiB7XCJyXCI6IDE1NCxcImdcIjogMjA1LFwiYlwiOiA1MCB9LCBcImhleFwiOiBcIiM5YWNkMzJcIn1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuYW1lZGNvbG9yczsiLCJmdW5jdGlvbiBuZWFybHlFcXVhbChhLCBiLCBlcHMpe1xuICAgIGlmICh0eXBlb2YgZXBzID09PSBcInVuZGVmaW5lZFwiKSB7ZXBzID0gMC4wMTt9XG4gICAgdmFyIGRpZmYgPSBNYXRoLmFicyhhIC0gYik7XG4gICAgcmV0dXJuIChkaWZmIDwgZXBzKTtcbn1cblxudmFyIGhlbHBlcnMgPSBuZXcgT2JqZWN0KG51bGwpO1xuXG5oZWxwZXJzLm5lYXJseUVxdWFsID0gbmVhcmx5RXF1YWw7XG5cbm1vZHVsZS5leHBvcnRzID0gaGVscGVyczsiXX0=
(7)
});
