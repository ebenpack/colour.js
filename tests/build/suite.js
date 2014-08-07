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
var hslToRgb, rgbToHsl, parseColor, cache;
/**
 * A color with both rgb and hsl representations.
 * @class Colour
 * @param {string} color Any legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 */
function Colour(color, alpha){
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
 * @return {Colour}
 */
Colour.prototype.lighten = function(percent){
    var hsl = this.hsl;
    var lum = hsl.l + percent;
    if (lum > 100){
        lum = 100;
    }
    return new Colour({'h':hsl.h, 's':hsl.s, 'l':lum}, this.alpha);
};
/**
 * Darken a color by the given percentage.
 * @method
 * @param  {number} percent
 * @return {Colour}
 */
Colour.prototype.darken = function(percent){
    var hsl = this.hsl;
    var lum = hsl.l - percent;
    if (lum < 0){
        lum = 0;
    }
    return new Colour({'h':hsl.h, 's':hsl.s, 'l':lum}, this.alpha);
};
/**
 * Return a string representation of color in #hex form.
 * @method
 * @return {string}
 */
Colour.prototype.toString = function(){
    var r = this.rgb.r.toString(16);
    var g = this.rgb.g.toString(16);
    var b = this.rgb.b.toString(16);
    // Zero fill
    if (r.length === 1){
        r = "0" + r;
    }
    if (g.length === 1){
        g = "0" + g;
    }
    if (b.length === 1){
        b = "0" + b;
    }
    return "#" + r + g + b;
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
/**
 * Parse a CSS color value and return an rgba color object.
 * @param  {string} color A legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 * @return {{r: number, g: number, b: number, a: number}}   rgba color object.
 * @throws {ColourError} If illegal color value is passed.
 */
parseColor = function(color){
    // TODO: This isn't perfect. Some strings that would be accepted CSS color values
    // (e.g. negative numbers, alpha greater than 1) will not work.
    var red, green, blue, hue, sat, lum;
    var alpha = 1;
    var regex, match;
    var pref = color.substr(0,3); // Three letter color prefix
    var error = false;
    if (pref === 'hsl'){
        regex = /(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})/g;
        match = regex.exec(color);
        hue = parseInt(match[1], 10);
        sat = parseInt(match[2], 10);
        lum = parseInt(match[3], 10);
        if (color[3] === 'a'){
            regex = /,\s*(\d\.?\d?)\s*\)/g;
            match = regex.exec(color);
            alpha = parseFloat(match[1]);
        }
        if (hue < 0 || hue > 360 ||
            sat < 0 || sat > 100 ||
            lum < 0 || lum > 100 ||
            alpha < 0 || alpha > 1){
            error = true;
        } else {
            var parsed = hslToRgb(hue, sat, lum);
            red = parsed.r;
            green = parsed.g;
            blue = parsed.b;
        }

    } else if (pref === 'rgb'){
        regex = /(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;
        match = regex.exec(color);
        red = parseInt(match[1], 10);
        green = parseInt(match[2], 10);
        blue = parseInt(match[3], 10);
        if (color[3] === 'a'){
            regex = /,\s*(\d\.?\d?)\s*\)/g;
            match = regex.exec(color);
            alpha = parseFloat(match[1]);
        }
    } else if (color[0] === '#'){
        var hex = color.substr(1);
        if (hex.length === 3){
            red = parseInt(hex[0]+hex[0], 16);
            green = parseInt(hex[1]+hex[1], 16);
            blue = parseInt(hex[2]+hex[2], 16);
        } else if (hex.length === 6){
            red = parseInt(hex[0]+hex[1], 16);
            green = parseInt(hex[2]+hex[3], 16);
            blue = parseInt(hex[4]+hex[5], 16);
        } else {
            error = true;
        }
    } else {
        error = true;
    }

    if (red < 0 || red > 255 ||
        green < 0 || green > 255 ||
        blue < 0 || blue > 255 ||
        alpha < 0 || alpha > 1){
        error = true;
    }

    if (error){
        throw "ColourError: Something went wrong. Perhaps " + color + " is not a legal CSS color value";
    }
    return {'r': red, 'g': green, 'b': blue, 'a': alpha};
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
    "cyan": {"r": 0,"g": 255,"b": 255, "h": 180,"s": 100,"l": 97},
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
    "magenta": {"r": 255,"g": 0,"b": 255, "h": 17,"s": 100,"l": 74},
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

module.exports = Colour;

},{}],7:[function(_dereq_,module,exports){
_dereq_('./../tests/colour.js');
_dereq_('./../tests/helpers.js');
_dereq_('./../tests/data/colors.js');

},{"./../tests/colour.js":8,"./../tests/data/colors.js":9,"./../tests/helpers.js":10}],8:[function(_dereq_,module,exports){
var Colour = _dereq_('../src/colour.js');
var named = _dereq_('./data/colors.js');
var nearlyEqual = _dereq_('./helpers.js')['nearlyEqual'];
var assert = _dereq_("assert");

suite('Colour', function(){
    var red, green, blue, rgb, rgba, hsl, hsla;
    setup(function(){
        red = new Colour("red");
        green = new Colour("#0F0"); // Named color 'green' is rgb(0,128,0)
        blue = new Colour("blue");
        rgb = new Colour("rgb(1, 7, 29)");
        rgba = new Colour("rgba(1, 7, 29, 0.3)");
        hsl = new Colour("hsl(0, 100%, 50%)");
        hsla = new Colour("hsla(0, 100%, 50%, 0.3)");
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
                    var name = new Colour(color);
                    var hex = new Colour(named[color].hex);
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
                    var name = new Colour(color);
                    var hex = new Colour(named[color].hex);
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
        test('toString', function(){
            var r1 = red.toString();
            var g1 = green.toString();
            var b1 = blue.toString();
            var rgb1 = rgb.toString();
            var rgba1 = rgba.toString();
            var hsl1 = hsl.toString();
            var hsla1 = hsl.toString();
            assert.equal(r1.toLowerCase(), "#ff0000");
            assert.equal(g1.toLowerCase(), "#00ff00");
            assert.equal(b1.toLowerCase(), "#0000ff");
            assert.equal(rgb1.toLowerCase(), "#01071d");
            assert.equal(rgba1.toLowerCase(), "#01071d");
            assert.equal(hsl1.toLowerCase(), "#ff0000");
            assert.equal(hsla1.toLowerCase(), "#ff0000");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvc3JjL2NvbG91ci5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy90ZXN0L2Zha2VfMmNmNGQ3NTguanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvdGVzdHMvY29sb3VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRG9jdW1lbnRzL3dvcmsvY29sb3VyLmpzL3Rlc3RzL2RhdGEvY29sb3JzLmpzIiwiL2hvbWUvZWJlbnBhY2svRG9jdW1lbnRzL3dvcmsvY29sb3VyLmpzL3Rlc3RzL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAgICBrZXksIGk7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ2YXIgaHNsVG9SZ2IsIHJnYlRvSHNsLCBwYXJzZUNvbG9yLCBjYWNoZTtcbi8qKlxuICogQSBjb2xvciB3aXRoIGJvdGggcmdiIGFuZCBoc2wgcmVwcmVzZW50YXRpb25zLlxuICogQGNsYXNzIENvbG91clxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIEFueSBsZWdhbCBDU1MgY29sb3IgdmFsdWUgKGhleCwgY29sb3Iga2V5d29yZCwgcmdiW2FdLCBoc2xbYV0pLlxuICovXG5mdW5jdGlvbiBDb2xvdXIoY29sb3IsIGFscGhhKXtcbiAgICB2YXIgaHNsLCByZ2I7XG4gICAgdmFyIHBhcnNlZF9jb2xvciA9IHt9O1xuICAgIGlmICh0eXBlb2YgY29sb3IgPT09ICdzdHJpbmcnKXtcbiAgICAgICAgY29sb3IgPSBjb2xvci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoY29sb3IgaW4gY2FjaGUpe1xuICAgICAgICAgICAgcGFyc2VkX2NvbG9yID0gY2FjaGVbY29sb3JdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyc2VkX2NvbG9yID0gcGFyc2VDb2xvcihjb2xvcik7XG4gICAgICAgICAgICBjYWNoZVtjb2xvcl0gPSBwYXJzZWRfY29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgcmdiID0gcGFyc2VkX2NvbG9yO1xuICAgICAgICBoc2wgPSByZ2JUb0hzbChwYXJzZWRfY29sb3IuciwgcGFyc2VkX2NvbG9yLmcsIHBhcnNlZF9jb2xvci5iKTtcbiAgICAgICAgYWxwaGEgPSBwYXJzZWRfY29sb3IuYSB8fCBhbHBoYSB8fCAxO1xuICAgIH0gZWxzZSBpZiAoJ3InIGluIGNvbG9yKXtcbiAgICAgICAgcmdiID0gY29sb3I7XG4gICAgICAgIGhzbCA9IHJnYlRvSHNsKGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpO1xuICAgICAgICBhbHBoYSA9IGhzbC5hIHx8IGFscGhhIHx8IDE7XG4gICAgfSBlbHNlIGlmICgnaCcgaW4gY29sb3Ipe1xuICAgICAgICBoc2wgPSBjb2xvcjtcbiAgICAgICAgcmdiID0gaHNsVG9SZ2IoY29sb3IuaCwgY29sb3IucywgY29sb3IubCk7XG4gICAgICAgIGFscGhhID0gcmdiLmEgfHwgYWxwaGEgfHwgMTtcbiAgICB9XG4gICAgdGhpcy5yZ2IgPSB7J3InOiByZ2IuciwgJ2cnOiByZ2IuZywgJ2InOiByZ2IuYn07XG4gICAgdGhpcy5oc2wgPSB7J2gnOiBoc2wuaCwgJ3MnOiBoc2wucywgJ2wnOiBoc2wubH07XG4gICAgdGhpcy5hbHBoYSA9IGFscGhhO1xufVxuLyoqXG4gKiBMaWdodGVuIGEgY29sb3IgYnkgdGhlIGdpdmVuIHBlcmNlbnRhZ2UuXG5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3VyfVxuICovXG5Db2xvdXIucHJvdG90eXBlLmxpZ2h0ZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sICsgcGVyY2VudDtcbiAgICBpZiAobHVtID4gMTAwKXtcbiAgICAgICAgbHVtID0gMTAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG91cih7J2gnOmhzbC5oLCAncyc6aHNsLnMsICdsJzpsdW19LCB0aGlzLmFscGhhKTtcbn07XG4vKipcbiAqIERhcmtlbiBhIGNvbG9yIGJ5IHRoZSBnaXZlbiBwZXJjZW50YWdlLlxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvdXJ9XG4gKi9cbkNvbG91ci5wcm90b3R5cGUuZGFya2VuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCAtIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA8IDApe1xuICAgICAgICBsdW0gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG91cih7J2gnOmhzbC5oLCAncyc6aHNsLnMsICdsJzpsdW19LCB0aGlzLmFscGhhKTtcbn07XG4vKipcbiAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBjb2xvciBpbiAjaGV4IGZvcm0uXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkNvbG91ci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpe1xuICAgIHZhciByID0gdGhpcy5yZ2Iuci50b1N0cmluZygxNik7XG4gICAgdmFyIGcgPSB0aGlzLnJnYi5nLnRvU3RyaW5nKDE2KTtcbiAgICB2YXIgYiA9IHRoaXMucmdiLmIudG9TdHJpbmcoMTYpO1xuICAgIC8vIFplcm8gZmlsbFxuICAgIGlmIChyLmxlbmd0aCA9PT0gMSl7XG4gICAgICAgIHIgPSBcIjBcIiArIHI7XG4gICAgfVxuICAgIGlmIChnLmxlbmd0aCA9PT0gMSl7XG4gICAgICAgIGcgPSBcIjBcIiArIGc7XG4gICAgfVxuICAgIGlmIChiLmxlbmd0aCA9PT0gMSl7XG4gICAgICAgIGIgPSBcIjBcIiArIGI7XG4gICAgfVxuICAgIHJldHVybiBcIiNcIiArIHIgKyBnICsgYjtcbn07XG4vKipcbiogQHBhcmFtIHtudW1iZXJ9IGggSHVlXG4qIEBwYXJhbSB7bnVtYmVyfSBzIFNhdHVyYXRpb25cbiogQHBhcmFtIHtudW1iZXJ9IGwgTHVtaW5hbmNlXG4qIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyfX1cbiovXG5oc2xUb1JnYiA9IGZ1bmN0aW9uKGgsIHMsIGwpe1xuICAgIGZ1bmN0aW9uIF92KG0xLCBtMiwgaHVlKXtcbiAgICAgICAgaHVlID0gaHVlO1xuICAgICAgICBpZiAoaHVlIDwgMCl7aHVlKz0xO31cbiAgICAgICAgaWYgKGh1ZSA+IDEpe2h1ZS09MTt9XG4gICAgICAgIGlmIChodWUgPCAoMS82KSl7XG4gICAgICAgICAgICByZXR1cm4gbTEgKyAobTItbTEpKmh1ZSo2O1xuICAgICAgICB9XG4gICAgICAgIGlmIChodWUgPCAwLjUpe1xuICAgICAgICAgICAgcmV0dXJuIG0yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChodWUgPCAoMi8zKSl7XG4gICAgICAgICAgICByZXR1cm4gbTEgKyAobTItbTEpKigoMi8zKS1odWUpKjY7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0xO1xuICAgIH1cbiAgICB2YXIgbTI7XG4gICAgdmFyIGZyYWN0aW9uX2wgPSAobC8xMDApO1xuICAgIHZhciBmcmFjdGlvbl9zID0gKHMvMTAwKTtcbiAgICBpZiAocyA9PT0gMCl7XG4gICAgICAgIHZhciBncmF5ID0gZnJhY3Rpb25fbCoyNTU7XG4gICAgICAgIHJldHVybiB7J3InOiBncmF5LCAnZyc6IGdyYXksICdiJzogZ3JheX07XG4gICAgfVxuICAgIGlmIChsIDw9IDUwKXtcbiAgICAgICAgbTIgPSBmcmFjdGlvbl9sICogKDErZnJhY3Rpb25fcyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIG0yID0gZnJhY3Rpb25fbCtmcmFjdGlvbl9zLShmcmFjdGlvbl9sKmZyYWN0aW9uX3MpO1xuICAgIH1cbiAgICB2YXIgbTEgPSAyKmZyYWN0aW9uX2wgLSBtMjtcbiAgICBoID0gaCAvIDM2MDtcbiAgICByZXR1cm4geydyJzogTWF0aC5yb3VuZChfdihtMSwgbTIsIGgrKDEvMykpKjI1NSksICdnJzogTWF0aC5yb3VuZChfdihtMSwgbTIsIGgpKjI1NSksICdiJzogTWF0aC5yb3VuZChfdihtMSwgbTIsIGgtKDEvMykpKjI1NSl9O1xufTtcbi8qKlxuICogQHBhcmFtICB7bnVtYmVyfSByIFJlZFxuICogQHBhcmFtICB7bnVtYmVyfSBnIEdyZWVuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIgQmx1ZVxuICogQHJldHVybiB7e2g6IG51bWJlciwgczogbnVtYmVyLCBsOiBudW1iZXJ9fVxuICovXG5yZ2JUb0hzbCA9IGZ1bmN0aW9uKHIsIGcsIGIpe1xuICAgIHIgPSByIC8gMjU1O1xuICAgIGcgPSBnIC8gMjU1O1xuICAgIGIgPSBiIC8gMjU1O1xuICAgIHZhciBtYXhjID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgdmFyIG1pbmMgPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICB2YXIgbCA9IE1hdGgucm91bmQoKChtaW5jK21heGMpLzIpKjEwMCk7XG4gICAgaWYgKGwgPiAxMDApIHtsID0gMTAwO31cbiAgICBpZiAobCA8IDApIHtsID0gMDt9XG4gICAgdmFyIGgsIHM7XG4gICAgaWYgKG1pbmMgPT09IG1heGMpe1xuICAgICAgICByZXR1cm4geydoJzogMCwgJ3MnOiAwLCAnbCc6IGx9O1xuICAgIH1cbiAgICBpZiAobCA8PSA1MCl7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvIChtYXhjK21pbmMpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAoMi1tYXhjLW1pbmMpO1xuICAgIH1cbiAgICB2YXIgcmMgPSAobWF4Yy1yKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBnYyA9IChtYXhjLWcpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGJjID0gKG1heGMtYikgLyAobWF4Yy1taW5jKTtcbiAgICBpZiAociA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSBiYy1nYztcbiAgICB9XG4gICAgZWxzZSBpZiAoZyA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSAyK3JjLWJjO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBoID0gNCtnYy1yYztcbiAgICB9XG4gICAgaCA9IChoLzYpICUgMTtcbiAgICBpZiAoaCA8IDApe2grPTE7fVxuICAgIGggPSBNYXRoLnJvdW5kKGgqMzYwKTtcbiAgICBzID0gTWF0aC5yb3VuZChzKjEwMCk7XG4gICAgaWYgKGggPiAzNjApIHtoID0gMzYwO31cbiAgICBpZiAoaCA8IDApIHtoID0gMDt9XG4gICAgaWYgKHMgPiAxMDApIHtzID0gMTAwO31cbiAgICBpZiAocyA8IDApIHtzID0gMDt9XG4gICAgcmV0dXJuIHsnaCc6IGgsICdzJzogcywgJ2wnOiBsfTtcbn07XG4vKipcbiAqIFBhcnNlIGEgQ1NTIGNvbG9yIHZhbHVlIGFuZCByZXR1cm4gYW4gcmdiYSBjb2xvciBvYmplY3QuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvbG9yIEEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXJ9fSAgIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHRocm93cyB7Q29sb3VyRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIC8vIFRPRE86IFRoaXMgaXNuJ3QgcGVyZmVjdC4gU29tZSBzdHJpbmdzIHRoYXQgd291bGQgYmUgYWNjZXB0ZWQgQ1NTIGNvbG9yIHZhbHVlc1xuICAgIC8vIChlLmcuIG5lZ2F0aXZlIG51bWJlcnMsIGFscGhhIGdyZWF0ZXIgdGhhbiAxKSB3aWxsIG5vdCB3b3JrLlxuICAgIHZhciByZWQsIGdyZWVuLCBibHVlLCBodWUsIHNhdCwgbHVtO1xuICAgIHZhciBhbHBoYSA9IDE7XG4gICAgdmFyIHJlZ2V4LCBtYXRjaDtcbiAgICB2YXIgcHJlZiA9IGNvbG9yLnN1YnN0cigwLDMpOyAvLyBUaHJlZSBsZXR0ZXIgY29sb3IgcHJlZml4XG4gICAgdmFyIGVycm9yID0gZmFsc2U7XG4gICAgaWYgKHByZWYgPT09ICdoc2wnKXtcbiAgICAgICAgcmVnZXggPSAvKFxcZHsxLDN9KVxccyosXFxzKihcXGR7MSwzfSklXFxzKixcXHMqKFxcZHsxLDN9KS9nO1xuICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoY29sb3IpO1xuICAgICAgICBodWUgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICBzYXQgPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuICAgICAgICBsdW0gPSBwYXJzZUludChtYXRjaFszXSwgMTApO1xuICAgICAgICBpZiAoY29sb3JbM10gPT09ICdhJyl7XG4gICAgICAgICAgICByZWdleCA9IC8sXFxzKihcXGRcXC4/XFxkPylcXHMqXFwpL2c7XG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoY29sb3IpO1xuICAgICAgICAgICAgYWxwaGEgPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgMCB8fCBodWUgPiAzNjAgfHxcbiAgICAgICAgICAgIHNhdCA8IDAgfHwgc2F0ID4gMTAwIHx8XG4gICAgICAgICAgICBsdW0gPCAwIHx8IGx1bSA+IDEwMCB8fFxuICAgICAgICAgICAgYWxwaGEgPCAwIHx8IGFscGhhID4gMSl7XG4gICAgICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcGFyc2VkID0gaHNsVG9SZ2IoaHVlLCBzYXQsIGx1bSk7XG4gICAgICAgICAgICByZWQgPSBwYXJzZWQucjtcbiAgICAgICAgICAgIGdyZWVuID0gcGFyc2VkLmc7XG4gICAgICAgICAgICBibHVlID0gcGFyc2VkLmI7XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAocHJlZiA9PT0gJ3JnYicpe1xuICAgICAgICByZWdleCA9IC8oXFxkezEsM30pXFxzKixcXHMqKFxcZHsxLDN9KVxccyosXFxzKihcXGR7MSwzfSkvZztcbiAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKGNvbG9yKTtcbiAgICAgICAgcmVkID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgZ3JlZW4gPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuICAgICAgICBibHVlID0gcGFyc2VJbnQobWF0Y2hbM10sIDEwKTtcbiAgICAgICAgaWYgKGNvbG9yWzNdID09PSAnYScpe1xuICAgICAgICAgICAgcmVnZXggPSAvLFxccyooXFxkXFwuP1xcZD8pXFxzKlxcKS9nO1xuICAgICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKGNvbG9yKTtcbiAgICAgICAgICAgIGFscGhhID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNvbG9yWzBdID09PSAnIycpe1xuICAgICAgICB2YXIgaGV4ID0gY29sb3Iuc3Vic3RyKDEpO1xuICAgICAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gMyl7XG4gICAgICAgICAgICByZWQgPSBwYXJzZUludChoZXhbMF0raGV4WzBdLCAxNik7XG4gICAgICAgICAgICBncmVlbiA9IHBhcnNlSW50KGhleFsxXStoZXhbMV0sIDE2KTtcbiAgICAgICAgICAgIGJsdWUgPSBwYXJzZUludChoZXhbMl0raGV4WzJdLCAxNik7XG4gICAgICAgIH0gZWxzZSBpZiAoaGV4Lmxlbmd0aCA9PT0gNil7XG4gICAgICAgICAgICByZWQgPSBwYXJzZUludChoZXhbMF0raGV4WzFdLCAxNik7XG4gICAgICAgICAgICBncmVlbiA9IHBhcnNlSW50KGhleFsyXStoZXhbM10sIDE2KTtcbiAgICAgICAgICAgIGJsdWUgPSBwYXJzZUludChoZXhbNF0raGV4WzVdLCAxNik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHJlZCA8IDAgfHwgcmVkID4gMjU1IHx8XG4gICAgICAgIGdyZWVuIDwgMCB8fCBncmVlbiA+IDI1NSB8fFxuICAgICAgICBibHVlIDwgMCB8fCBibHVlID4gMjU1IHx8XG4gICAgICAgIGFscGhhIDwgMCB8fCBhbHBoYSA+IDEpe1xuICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGVycm9yKXtcbiAgICAgICAgdGhyb3cgXCJDb2xvdXJFcnJvcjogU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBlcmhhcHMgXCIgKyBjb2xvciArIFwiIGlzIG5vdCBhIGxlZ2FsIENTUyBjb2xvciB2YWx1ZVwiO1xuICAgIH1cbiAgICByZXR1cm4geydyJzogcmVkLCAnZyc6IGdyZWVuLCAnYic6IGJsdWUsICdhJzogYWxwaGF9O1xufTtcbi8vIFByZS13YXJtIHRoZSBjYWNoZSB3aXRoIG5hbWVkIGNvbG9ycywgYXMgdGhlc2UgYXJlIG5vdFxuLy8gY29udmVydGVkIHRvIHJnYiB2YWx1ZXMgYnkgdGhlIHBhcnNlQ29sb3IgZnVuY3Rpb24gYWJvdmUuXG5jYWNoZSA9IHtcbiAgICBcImJsYWNrXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwfSxcbiAgICBcInNpbHZlclwiOiB7XCJyXCI6IDE5MiwgXCJnXCI6IDE5MiwgXCJiXCI6IDE5MiwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNzV9LFxuICAgIFwiZ3JheVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNTB9LFxuICAgIFwid2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDEwMH0sXG4gICAgXCJtYXJvb25cIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJwdXJwbGVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwibGltZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib2xpdmVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJ5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJuYXZ5XCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJ0ZWFsXCI6IHtcInJcIjogMCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImFxdWFcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTY1LCBcImJcIjogMCwgXCJoXCI6IDM5LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiYWxpY2VibHVlXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMjA4LCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjM1LCBcImJcIjogMjE1LCBcImhcIjogMzQsIFwic1wiOiA3OCwgXCJsXCI6IDkxfSxcbiAgICBcImFxdWFtYXJpbmVcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMTIsIFwiaFwiOiAxNjAsIFwic1wiOiAxMDAsIFwibFwiOiA3NX0sXG4gICAgXCJhenVyZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImJlaWdlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjIwLCBcImhcIjogNjAsIFwic1wiOiA1NiwgXCJsXCI6IDkxfSxcbiAgICBcImJpc3F1ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE5NiwgXCJoXCI6IDMzLCBcInNcIjogMTAwLCBcImxcIjogODh9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzUsIFwiYlwiOiAyMDUsIFwiaFwiOiAzNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDkwfSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiclwiOiAxMzgsIFwiZ1wiOiA0MywgXCJiXCI6IDIyNiwgXCJoXCI6IDI3MSwgXCJzXCI6IDc2LCBcImxcIjogNTN9LFxuICAgIFwiYnJvd25cIjoge1wiclwiOiAxNjUsIFwiZ1wiOiA0MiwgXCJiXCI6IDQyLCBcImhcIjogMCwgXCJzXCI6IDU5LCBcImxcIjogNDF9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcInJcIjogMjIyLCBcImdcIjogMTg0LCBcImJcIjogMTM1LCBcImhcIjogMzQsIFwic1wiOiA1NywgXCJsXCI6IDcwfSxcbiAgICBcImNhZGV0Ymx1ZVwiOiB7XCJyXCI6IDk1LCBcImdcIjogMTU4LCBcImJcIjogMTYwLCBcImhcIjogMTgyLCBcInNcIjogMjUsIFwibFwiOiA1MH0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDkwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiY2hvY29sYXRlXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTA1LCBcImJcIjogMzAsIFwiaFwiOiAyNSwgXCJzXCI6IDc1LCBcImxcIjogNDd9LFxuICAgIFwiY29yYWxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxMjcsIFwiYlwiOiA4MCwgXCJoXCI6IDE2LCBcInNcIjogMTAwLCBcImxcIjogNjZ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiclwiOiAxMDAsIFwiZ1wiOiAxNDksIFwiYlwiOiAyMzcsIFwiaFwiOiAyMTksIFwic1wiOiA3OSwgXCJsXCI6IDY2fSxcbiAgICBcImNvcm5zaWxrXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ4LCBcImJcIjogMjIwLCBcImhcIjogNDgsIFwic1wiOiAxMDAsIFwibFwiOiA5M30sXG4gICAgXCJjeWFuXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUsIFwiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTd9LFxuICAgIFwiY3JpbXNvblwiOiB7XCJyXCI6IDIyMCwgXCJnXCI6IDIwLCBcImJcIjogNjAsIFwiaFwiOiAzNDgsIFwic1wiOiA4MywgXCJsXCI6IDQ3fSxcbiAgICBcImRhcmtibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMzksIFwiYlwiOiAxMzksIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrZ29sZGVucm9kXCI6IHtcInJcIjogMTg0LCBcImdcIjogMTM0LCBcImJcIjogMTEsIFwiaFwiOiA0MywgXCJzXCI6IDg5LCBcImxcIjogMzh9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDY2fSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMDAsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogMjB9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDY2fSxcbiAgICBcImRhcmtraGFraVwiOiB7XCJyXCI6IDE4OSwgXCJnXCI6IDE4MywgXCJiXCI6IDEwNywgXCJoXCI6IDU2LCBcInNcIjogMzgsIFwibFwiOiA1OH0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrb2xpdmVncmVlblwiOiB7XCJyXCI6IDg1LCBcImdcIjogMTA3LCBcImJcIjogNDcsIFwiaFwiOiA4MiwgXCJzXCI6IDM5LCBcImxcIjogMzB9LFxuICAgIFwiZGFya29yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE0MCwgXCJiXCI6IDAsIFwiaFwiOiAzMywgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImRhcmtvcmNoaWRcIjoge1wiclwiOiAxNTMsIFwiZ1wiOiA1MCwgXCJiXCI6IDIwNCwgXCJoXCI6IDI4MCwgXCJzXCI6IDYxLCBcImxcIjogNTB9LFxuICAgIFwiZGFya3JlZFwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiclwiOiAyMzMsIFwiZ1wiOiAxNTAsIFwiYlwiOiAxMjIsIFwiaFwiOiAxNSwgXCJzXCI6IDcyLCBcImxcIjogNzB9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcInJcIjogMTQzLCBcImdcIjogMTg4LCBcImJcIjogMTQzLCBcImhcIjogMTIwLCBcInNcIjogMjUsIFwibFwiOiA2NX0sXG4gICAgXCJkYXJrc2xhdGVibHVlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiA2MSwgXCJiXCI6IDEzOSwgXCJoXCI6IDI0OCwgXCJzXCI6IDM5LCBcImxcIjogMzl9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDE4MCwgXCJzXCI6IDI1LCBcImxcIjogMjV9LFxuICAgIFwiZGFya3NsYXRlZ3JleVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDE4MCwgXCJzXCI6IDI1LCBcImxcIjogMjV9LFxuICAgIFwiZGFya3R1cnF1b2lzZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMDksIFwiaFwiOiAxODEsIFwic1wiOiAxMDAsIFwibFwiOiA0MX0sXG4gICAgXCJkYXJrdmlvbGV0XCI6IHtcInJcIjogMTQ4LCBcImdcIjogMCwgXCJiXCI6IDIxMSwgXCJoXCI6IDI4MiwgXCJzXCI6IDEwMCwgXCJsXCI6IDQxfSxcbiAgICBcImRlZXBwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjAsIFwiYlwiOiAxNDcsIFwiaFwiOiAzMjgsIFwic1wiOiAxMDAsIFwibFwiOiA1NH0sXG4gICAgXCJkZWVwc2t5Ymx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyNTUsIFwiaFwiOiAxOTUsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJkaW1ncmF5XCI6IHtcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA0MX0sXG4gICAgXCJkaW1ncmV5XCI6IHtcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA0MX0sXG4gICAgXCJkb2RnZXJibHVlXCI6IHtcInJcIjogMzAsIFwiZ1wiOiAxNDQsIFwiYlwiOiAyNTUsIFwiaFwiOiAyMTAsIFwic1wiOiAxMDAsIFwibFwiOiA1Nn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiclwiOiAxNzgsIFwiZ1wiOiAzNCwgXCJiXCI6IDM0LCBcImhcIjogMCwgXCJzXCI6IDY4LCBcImxcIjogNDJ9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNDAsIFwiaFwiOiA0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcInJcIjogMzQsIFwiZ1wiOiAxMzksIFwiYlwiOiAzNCwgXCJoXCI6IDEyMCwgXCJzXCI6IDYxLCBcImxcIjogMzR9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjIwLCBcImJcIjogMjIwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4Nn0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcInJcIjogMjQ4LCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogOTl9LFxuICAgIFwiZ29sZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxNSwgXCJiXCI6IDAsIFwiaFwiOiA1MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImdvbGRlbnJvZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDE2NSwgXCJiXCI6IDMyLCBcImhcIjogNDMsIFwic1wiOiA3NCwgXCJsXCI6IDQ5fSxcbiAgICBcImdyZWVueWVsbG93XCI6IHtcInJcIjogMTczLCBcImdcIjogMjU1LCBcImJcIjogNDcsIFwiaFwiOiA4NCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU5fSxcbiAgICBcImdyZXlcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDUwfSxcbiAgICBcImhvbmV5ZGV3XCI6IHtcInJcIjogMjQwLCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiaG90cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDE4MCwgXCJoXCI6IDMzMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDcxfSxcbiAgICBcImluZGlhbnJlZFwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDkyLCBcImJcIjogOTIsIFwiaFwiOiAwLCBcInNcIjogNTMsIFwibFwiOiA1OH0sXG4gICAgXCJpbmRpZ29cIjoge1wiclwiOiA3NSwgXCJnXCI6IDAsIFwiYlwiOiAxMzAsIFwiaFwiOiAyNzUsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJpdm9yeVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI0MCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwia2hha2lcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAxNDAsIFwiaFwiOiA1NCwgXCJzXCI6IDc3LCBcImxcIjogNzV9LFxuICAgIFwibGF2ZW5kZXJcIjoge1wiclwiOiAyMzAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAyNTAsIFwiaFwiOiAyNDAsIFwic1wiOiA2NywgXCJsXCI6IDk0fSxcbiAgICBcImxhdmVuZGVyYmx1c2hcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyNDUsIFwiaFwiOiAzNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiclwiOiAxMjQsIFwiZ1wiOiAyNTIsIFwiYlwiOiAwLCBcImhcIjogOTAsIFwic1wiOiAxMDAsIFwibFwiOiA0OX0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMDUsIFwiaFwiOiA1NCwgXCJzXCI6IDEwMCwgXCJsXCI6IDkwfSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDIxNiwgXCJiXCI6IDIzMCwgXCJoXCI6IDE5NSwgXCJzXCI6IDUzLCBcImxcIjogNzl9LFxuICAgIFwibGlnaHRjb3JhbFwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiA3OSwgXCJsXCI6IDcyfSxcbiAgICBcImxpZ2h0Y3lhblwiOiB7XCJyXCI6IDIyNCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IHtcInJcIjogMjUwLCBcImdcIjogMjUwLCBcImJcIjogMjEwLCBcImhcIjogNjAsIFwic1wiOiA4MCwgXCJsXCI6IDkwfSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogODN9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJyXCI6IDE0NCwgXCJnXCI6IDIzOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDEyMCwgXCJzXCI6IDczLCBcImxcIjogNzV9LFxuICAgIFwibGlnaHRncmV5XCI6IHtcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4M30sXG4gICAgXCJsaWdodHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxODIsIFwiYlwiOiAxOTMsIFwiaFwiOiAzNTEsIFwic1wiOiAxMDAsIFwibFwiOiA4Nn0sXG4gICAgXCJsaWdodHNhbG1vblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDE3LCBcInNcIjogMTAwLCBcImxcIjogNzR9LFxuICAgIFwibGlnaHRzZWFncmVlblwiOiB7XCJyXCI6IDMyLCBcImdcIjogMTc4LCBcImJcIjogMTcwLCBcImhcIjogMTc3LCBcInNcIjogNzAsIFwibFwiOiA0MX0sXG4gICAgXCJsaWdodHNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyNTAsIFwiaFwiOiAyMDMsIFwic1wiOiA5MiwgXCJsXCI6IDc1fSxcbiAgICBcImxpZ2h0c2xhdGVncmF5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMjEwLCBcInNcIjogMTQsIFwibFwiOiA1M30sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDIxMCwgXCJzXCI6IDE0LCBcImxcIjogNTN9LFxuICAgIFwibGlnaHRzdGVlbGJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAxOTYsIFwiYlwiOiAyMjIsIFwiaFwiOiAyMTQsIFwic1wiOiA0MSwgXCJsXCI6IDc4fSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjI0LCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA5NH0sXG4gICAgXCJsaW1lZ3JlZW5cIjoge1wiclwiOiA1MCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogMTIwLCBcInNcIjogNjEsIFwibFwiOiA1MH0sXG4gICAgXCJsaW5lblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI0MCwgXCJiXCI6IDIzMCwgXCJoXCI6IDMwLCBcInNcIjogNjcsIFwibFwiOiA5NH0sXG4gICAgXCJtYWdlbnRhXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAwLFwiYlwiOiAyNTUsIFwiaFwiOiAxNyxcInNcIjogMTAwLFwibFwiOiA3NH0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcInJcIjogMTAyLCBcImdcIjogMjA1LCBcImJcIjogMTcwLCBcImhcIjogMTYwLCBcInNcIjogNTEsIFwibFwiOiA2MH0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyMDUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA0MH0sXG4gICAgXCJtZWRpdW1vcmNoaWRcIjoge1wiclwiOiAxODYsIFwiZ1wiOiA4NSwgXCJiXCI6IDIxMSwgXCJoXCI6IDI4OCwgXCJzXCI6IDU5LCBcImxcIjogNTh9LFxuICAgIFwibWVkaXVtcHVycGxlXCI6IHtcInJcIjogMTQ3LCBcImdcIjogMTEyLCBcImJcIjogMjE5LCBcImhcIjogMjYwLCBcInNcIjogNjAsIFwibFwiOiA2NX0sXG4gICAgXCJtZWRpdW1zZWFncmVlblwiOiB7XCJyXCI6IDYwLCBcImdcIjogMTc5LCBcImJcIjogMTEzLCBcImhcIjogMTQ3LCBcInNcIjogNTAsIFwibFwiOiA0N30sXG4gICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjoge1wiclwiOiAxMjMsIFwiZ1wiOiAxMDQsIFwiYlwiOiAyMzgsIFwiaFwiOiAyNDksIFwic1wiOiA4MCwgXCJsXCI6IDY3fSxcbiAgICBcIm1lZGl1bXNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1MCwgXCJiXCI6IDE1NCwgXCJoXCI6IDE1NywgXCJzXCI6IDEwMCwgXCJsXCI6IDQ5fSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJyXCI6IDcyLCBcImdcIjogMjA5LCBcImJcIjogMjA0LCBcImhcIjogMTc4LCBcInNcIjogNjAsIFwibFwiOiA1NX0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiclwiOiAxOTksIFwiZ1wiOiAyMSwgXCJiXCI6IDEzMywgXCJoXCI6IDMyMiwgXCJzXCI6IDgxLCBcImxcIjogNDN9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcInJcIjogMjUsIFwiZ1wiOiAyNSwgXCJiXCI6IDExMiwgXCJoXCI6IDI0MCwgXCJzXCI6IDY0LCBcImxcIjogMjd9LFxuICAgIFwibWludGNyZWFtXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjU1LCBcImJcIjogMjUwLCBcImhcIjogMTUwLCBcInNcIjogMTAwLCBcImxcIjogOTh9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMjI1LCBcImhcIjogNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcIm1vY2Nhc2luXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMTgxLCBcImhcIjogMzgsIFwic1wiOiAxMDAsIFwibFwiOiA4NX0sXG4gICAgXCJuYXZham93aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3MywgXCJoXCI6IDM2LCBcInNcIjogMTAwLCBcImxcIjogODR9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJyXCI6IDI1MywgXCJnXCI6IDI0NSwgXCJiXCI6IDIzMCwgXCJoXCI6IDM5LCBcInNcIjogODUsIFwibFwiOiA5NX0sXG4gICAgXCJvbGl2ZWRyYWJcIjoge1wiclwiOiAxMDcsIFwiZ1wiOiAxNDIsIFwiYlwiOiAzNSwgXCJoXCI6IDgwLCBcInNcIjogNjAsIFwibFwiOiAzNX0sXG4gICAgXCJvcmFuZ2VyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA2OSwgXCJiXCI6IDAsIFwiaFwiOiAxNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9yY2hpZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDExMiwgXCJiXCI6IDIxNCwgXCJoXCI6IDMwMiwgXCJzXCI6IDU5LCBcImxcIjogNjV9LFxuICAgIFwicGFsZWdvbGRlbnJvZFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDIzMiwgXCJiXCI6IDE3MCwgXCJoXCI6IDU1LCBcInNcIjogNjcsIFwibFwiOiA4MH0sXG4gICAgXCJwYWxlZ3JlZW5cIjoge1wiclwiOiAxNTIsIFwiZ1wiOiAyNTEsIFwiYlwiOiAxNTIsIFwiaFwiOiAxMjAsIFwic1wiOiA5MywgXCJsXCI6IDc5fSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiclwiOiAxNzUsIFwiZ1wiOiAyMzgsIFwiYlwiOiAyMzgsIFwiaFwiOiAxODAsIFwic1wiOiA2NSwgXCJsXCI6IDgxfSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiclwiOiAyMTksIFwiZ1wiOiAxMTIsIFwiYlwiOiAxNDcsIFwiaFwiOiAzNDAsIFwic1wiOiA2MCwgXCJsXCI6IDY1fSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzksIFwiYlwiOiAyMTMsIFwiaFwiOiAzNywgXCJzXCI6IDEwMCwgXCJsXCI6IDkyfSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxOCwgXCJiXCI6IDE4NSwgXCJoXCI6IDI4LCBcInNcIjogMTAwLCBcImxcIjogODZ9LFxuICAgIFwicGVydVwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDEzMywgXCJiXCI6IDYzLCBcImhcIjogMzAsIFwic1wiOiA1OSwgXCJsXCI6IDUzfSxcbiAgICBcInBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxOTIsIFwiYlwiOiAyMDMsIFwiaFwiOiAzNTAsIFwic1wiOiAxMDAsIFwibFwiOiA4OH0sXG4gICAgXCJwbHVtXCI6IHtcInJcIjogMjIxLCBcImdcIjogMTYwLCBcImJcIjogMjIxLCBcImhcIjogMzAwLCBcInNcIjogNDcsIFwibFwiOiA3NX0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMjI0LCBcImJcIjogMjMwLCBcImhcIjogMTg3LCBcInNcIjogNTIsIFwibFwiOiA4MH0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiclwiOiAxODgsIFwiZ1wiOiAxNDMsIFwiYlwiOiAxNDMsIFwiaFwiOiAwLCBcInNcIjogMjUsIFwibFwiOiA2NX0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiclwiOiA2NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDIyNSwgXCJoXCI6IDIyNSwgXCJzXCI6IDczLCBcImxcIjogNTd9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiclwiOiAxMzksIFwiZ1wiOiA2OSwgXCJiXCI6IDE5LCBcImhcIjogMjUsIFwic1wiOiA3NiwgXCJsXCI6IDMxfSxcbiAgICBcInNhbG1vblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDExNCwgXCJoXCI6IDYsIFwic1wiOiA5MywgXCJsXCI6IDcxfSxcbiAgICBcInNhbmR5YnJvd25cIjoge1wiclwiOiAyNDQsIFwiZ1wiOiAxNjQsIFwiYlwiOiA5NiwgXCJoXCI6IDI4LCBcInNcIjogODcsIFwibFwiOiA2N30sXG4gICAgXCJzZWFncmVlblwiOiB7XCJyXCI6IDQ2LCBcImdcIjogMTM5LCBcImJcIjogODcsIFwiaFwiOiAxNDYsIFwic1wiOiA1MCwgXCJsXCI6IDM2fSxcbiAgICBcInNlYXNoZWxsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ1LCBcImJcIjogMjM4LCBcImhcIjogMjUsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJzaWVubmFcIjoge1wiclwiOiAxNjAsIFwiZ1wiOiA4MiwgXCJiXCI6IDQ1LCBcImhcIjogMTksIFwic1wiOiA1NiwgXCJsXCI6IDQwfSxcbiAgICBcInNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMzUsIFwiaFwiOiAxOTcsIFwic1wiOiA3MSwgXCJsXCI6IDczfSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEwNiwgXCJnXCI6IDkwLCBcImJcIjogMjA1LCBcImhcIjogMjQ4LCBcInNcIjogNTMsIFwibFwiOiA1OH0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAyMTAsIFwic1wiOiAxMywgXCJsXCI6IDUwfSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDIxMCwgXCJzXCI6IDEzLCBcImxcIjogNTB9LFxuICAgIFwic25vd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI1MCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiA5OX0sXG4gICAgXCJzcHJpbmdncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAxMjcsIFwiaFwiOiAxNTAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJzdGVlbGJsdWVcIjoge1wiclwiOiA3MCwgXCJnXCI6IDEzMCwgXCJiXCI6IDE4MCwgXCJoXCI6IDIwNywgXCJzXCI6IDQ0LCBcImxcIjogNDl9LFxuICAgIFwidGFuXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTgwLCBcImJcIjogMTQwLCBcImhcIjogMzQsIFwic1wiOiA0NCwgXCJsXCI6IDY5fSxcbiAgICBcInRoaXN0bGVcIjoge1wiclwiOiAyMTYsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyMTYsIFwiaFwiOiAzMDAsIFwic1wiOiAyNCwgXCJsXCI6IDgwfSxcbiAgICBcInRvbWF0b1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDk5LCBcImJcIjogNzEsIFwiaFwiOiA5LCBcInNcIjogMTAwLCBcImxcIjogNjR9LFxuICAgIFwidHVycXVvaXNlXCI6IHtcInJcIjogNjQsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMDgsIFwiaFwiOiAxNzQsIFwic1wiOiA3MiwgXCJsXCI6IDU2fSxcbiAgICBcInZpb2xldFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDEzMCwgXCJiXCI6IDIzOCwgXCJoXCI6IDMwMCwgXCJzXCI6IDc2LCBcImxcIjogNzJ9LFxuICAgIFwid2hlYXRcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzksIFwiaFwiOiAzOSwgXCJzXCI6IDc3LCBcImxcIjogODN9LFxuICAgIFwid2hpdGVzbW9rZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDI0NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogOTZ9LFxuICAgIFwieWVsbG93Z3JlZW5cIjoge1wiclwiOiAxNTQsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDgwLCBcInNcIjogNjEsIFwibFwiOiA1MH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3VyO1xuIiwicmVxdWlyZSgnLi8uLi90ZXN0cy9jb2xvdXIuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvaGVscGVycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9kYXRhL2NvbG9ycy5qcycpO1xuIiwidmFyIENvbG91ciA9IHJlcXVpcmUoJy4uL3NyYy9jb2xvdXIuanMnKTtcbnZhciBuYW1lZCA9IHJlcXVpcmUoJy4vZGF0YS9jb2xvcnMuanMnKTtcbnZhciBuZWFybHlFcXVhbCA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpWyduZWFybHlFcXVhbCddO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdDb2xvdXInLCBmdW5jdGlvbigpe1xuICAgIHZhciByZWQsIGdyZWVuLCBibHVlLCByZ2IsIHJnYmEsIGhzbCwgaHNsYTtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICByZWQgPSBuZXcgQ29sb3VyKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvdXIoXCIjMEYwXCIpOyAvLyBOYW1lZCBjb2xvciAnZ3JlZW4nIGlzIHJnYigwLDEyOCwwKVxuICAgICAgICBibHVlID0gbmV3IENvbG91cihcImJsdWVcIik7XG4gICAgICAgIHJnYiA9IG5ldyBDb2xvdXIoXCJyZ2IoMSwgNywgMjkpXCIpO1xuICAgICAgICByZ2JhID0gbmV3IENvbG91cihcInJnYmEoMSwgNywgMjksIDAuMylcIik7XG4gICAgICAgIGhzbCA9IG5ldyBDb2xvdXIoXCJoc2woMCwgMTAwJSwgNTAlKVwiKTtcbiAgICAgICAgaHNsYSA9IG5ldyBDb2xvdXIoXCJoc2xhKDAsIDEwMCUsIDUwJSwgMC4zKVwiKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ3JnYicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLnIsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuZywgNyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLmFscGhhLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5yLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5nLCA3KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBjb2xvciBpbiBuYW1lZCl7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVkLmhhc093blByb3BlcnR5KGNvbG9yKSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmV3IENvbG91cihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3VyKG5hbWVkW2NvbG9yXS5oZXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZWRfcmdiID0gbmFtZWRbY29sb3JdLnJnYjtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnIsIGhleC5yZ2Iucik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5nLCBoZXgucmdiLmcpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuYiwgaGV4LnJnYi5iKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnIsIG5hbWVkX3JnYi5yKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmcsIG5hbWVkX3JnYi5nKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmIsIG5hbWVkX3JnYi5iKTtcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnaHNsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wucywgMTAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLmwsIDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbC5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsLmhzbC5zLCAxMDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbC5oc2wubCwgNTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKGhzbC5hbHBoYSwgMSkpO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYS5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYS5oc2wucywgMTAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2xhLmhzbC5sLCA1MCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoaHNsYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBjb2xvciBpbiBuYW1lZCl7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVkLmhhc093blByb3BlcnR5KGNvbG9yKSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmV3IENvbG91cihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3VyKG5hbWVkW2NvbG9yXS5oZXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZWRfaHNsID0gbmFtZWRbY29sb3JdLnJnYjtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmgsIGhleC5yZ2IuaCk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5zLCBoZXgucmdiLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgaGV4LnJnYi5sKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmgsIG5hbWVkX2hzbC5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIG5hbWVkX2hzbC5zKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmwsIG5hbWVkX2hzbC5sKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbHBoYScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVkLmFscGhhLCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoaHNsYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbGlnaHRlbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgcjIgPSByZWQubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQubGlnaHRlbig1MCk7XG4gICAgICAgICAgICB2YXIgZzEgPSBncmVlbi5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciBnMiA9IGdyZWVuLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4ubGlnaHRlbig1MCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGIyID0gYmx1ZS5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUubGlnaHRlbig1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuZywgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5iLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuciwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5iLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuciwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmcsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2RhcmtlbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIHIzID0gcmVkLmRhcmtlbig1MCk7XG4gICAgICAgICAgICB2YXIgZzEgPSBncmVlbi5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4uZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBnMyA9IGdyZWVuLmRhcmtlbig1MCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgYjMgPSBibHVlLmRhcmtlbig1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuciwgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5yLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5iLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0b1N0cmluZycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB2YXIgcmdiMSA9IHJnYi50b1N0cmluZygpO1xuICAgICAgICAgICAgdmFyIHJnYmExID0gcmdiYS50b1N0cmluZygpO1xuICAgICAgICAgICAgdmFyIGhzbDEgPSBoc2wudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciBoc2xhMSA9IGhzbC50b1N0cmluZygpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnRvTG93ZXJDYXNlKCksIFwiI2ZmMDAwMFwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS50b0xvd2VyQ2FzZSgpLCBcIiMwMGZmMDBcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEudG9Mb3dlckNhc2UoKSwgXCIjMDAwMGZmXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYjEudG9Mb3dlckNhc2UoKSwgXCIjMDEwNzFkXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYmExLnRvTG93ZXJDYXNlKCksIFwiIzAxMDcxZFwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wxLnRvTG93ZXJDYXNlKCksIFwiI2ZmMDAwMFwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2xhMS50b0xvd2VyQ2FzZSgpLCBcIiNmZjAwMDBcIik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7IiwidmFyIG5hbWVkY29sb3JzID0ge1xuICAgIFwiYWxpY2VibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI0OCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2YwZjhmZlwifSxcbiAgICBcImFudGlxdWV3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjM1LFwiYlwiOiAyMTUgfSwgXCJoZXhcIjogXCIjZmFlYmQ3XCJ9LFxuICAgIFwiYXF1YVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwZmZmZlwifSxcbiAgICBcImFxdWFtYXJpbmVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogMTAwIH0sIFwicmdiXCI6IHtcInJcIjogMTI3LFwiZ1wiOiAyNTUsXCJiXCI6IDIxMiB9LCBcImhleFwiOiBcIiM3ZmZmZDRcIn0sXG4gICAgXCJhenVyZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmMGZmZmZcIn0sXG4gICAgXCJiZWlnZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjQ1LFwiZ1wiOiAyNDUsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNmNWY1ZGNcIn0sXG4gICAgXCJiaXNxdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDE5NiB9LCBcImhleFwiOiBcIiNmZmU0YzRcIn0sXG4gICAgXCJibGFja1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwMDAwMFwifSxcbiAgICBcImJsYW5jaGVkYWxtb25kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjM1LFwiYlwiOiAyMDUgfSwgXCJoZXhcIjogXCIjZmZlYmNkXCJ9LFxuICAgIFwiYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDAwMGZmXCJ9LFxuICAgIFwiYmx1ZXZpb2xldFwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOCxcImdcIjogNDMsXCJiXCI6IDIyNiB9LCBcImhleFwiOiBcIiM4YTJiZTJcIn0sXG4gICAgXCJicm93blwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE2NSxcImdcIjogNDIsXCJiXCI6IDQyIH0sIFwiaGV4XCI6IFwiI2E1MmEyYVwifSxcbiAgICBcImJ1cmx5d29vZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMjIsXCJnXCI6IDE4NCxcImJcIjogMTM1IH0sIFwiaGV4XCI6IFwiI2RlYjg4N1wifSxcbiAgICBcImNhZGV0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiA5NSxcImdcIjogMTU4LFwiYlwiOiAxNjAgfSwgXCJoZXhcIjogXCIjNWY5ZWEwXCJ9LFxuICAgIFwiY2hhcnRyZXVzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjcsXCJnXCI6IDI1NSxcImJcIjogMCB9LCBcImhleFwiOiBcIiM3ZmZmMDBcIn0sXG4gICAgXCJjaG9jb2xhdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjEwLFwiZ1wiOiAxMDUsXCJiXCI6IDMwIH0sIFwiaGV4XCI6IFwiI2QyNjkxZVwifSxcbiAgICBcImNvcmFsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxMjcsXCJiXCI6IDgwIH0sIFwiaGV4XCI6IFwiI2ZmN2Y1MFwifSxcbiAgICBcImNvcm5mbG93ZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwOCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDEwMCxcImdcIjogMTQ5LFwiYlwiOiAyMzcgfSwgXCJoZXhcIjogXCIjNjQ5NWVkXCJ9LFxuICAgIFwiY29ybnNpbGtcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDc4LFwibFwiOiA5MSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjQ4LFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZmZmOGRjXCJ9LFxuICAgIFwiY3JpbXNvblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNjAsXCJzXCI6IDEwMCxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMjAsXCJnXCI6IDIwLFwiYlwiOiA2MCB9LCBcImhleFwiOiBcIiNkYzE0M2NcIn0sXG4gICAgXCJjeWFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwZmZmZlwifSxcbiAgICBcImRhcmtibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiA1NixcImxcIjogOTEgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjMDAwMDhiXCJ9LFxuICAgIFwiZGFya2N5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzMsXCJzXCI6IDEwMCxcImxcIjogODggfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMzksXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiMwMDhiOGJcIn0sXG4gICAgXCJkYXJrZ29sZGVucm9kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM2LFwic1wiOiAxMDAsXCJsXCI6IDkwIH0sIFwicmdiXCI6IHtcInJcIjogMTg0LFwiZ1wiOiAxMzQsXCJiXCI6IDExIH0sIFwiaGV4XCI6IFwiI2I4ODYwYlwifSxcbiAgICBcImRhcmtncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDI3MSxcInNcIjogNzYsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMTY5LFwiZ1wiOiAxNjksXCJiXCI6IDE2OSB9LCBcImhleFwiOiBcIiNhOWE5YTlcIn0sXG4gICAgXCJkYXJrZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNTksXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwNjQwMFwifSxcbiAgICBcImRhcmtncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA1NyxcImxcIjogNzAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjksXCJnXCI6IDE2OSxcImJcIjogMTY5IH0sIFwiaGV4XCI6IFwiI2E5YTlhOVwifSxcbiAgICBcImRhcmtraGFraVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODIsXCJzXCI6IDI1LFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE4OSxcImdcIjogMTgzLFwiYlwiOiAxMDcgfSwgXCJoZXhcIjogXCIjYmRiNzZiXCJ9LFxuICAgIFwiZGFya21hZ2VudGFcIjoge1wiaHNsXCI6IHtcImhcIjogOTAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzksXCJnXCI6IDAsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiM4YjAwOGJcIn0sXG4gICAgXCJkYXJrb2xpdmVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNSxcInNcIjogNzUsXCJsXCI6IDQ3IH0sIFwicmdiXCI6IHtcInJcIjogODUsXCJnXCI6IDEwNyxcImJcIjogNDcgfSwgXCJoZXhcIjogXCIjNTU2YjJmXCJ9LFxuICAgIFwiZGFya29yYW5nZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNixcInNcIjogMTAwLFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTQwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmOGMwMFwifSxcbiAgICBcImRhcmtvcmNoaWRcIjoge1wiaHNsXCI6IHtcImhcIjogMjE5LFwic1wiOiA3OSxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNTMsXCJnXCI6IDUwLFwiYlwiOiAyMDQgfSwgXCJoZXhcIjogXCIjOTkzMmNjXCJ9LFxuICAgIFwiZGFya3JlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiA0OCxcInNcIjogMTAwLFwibFwiOiA5MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOSxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4YjAwMDBcIn0sXG4gICAgXCJkYXJrc2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0OCxcInNcIjogODMsXCJsXCI6IDQ3IH0sIFwicmdiXCI6IHtcInJcIjogMjMzLFwiZ1wiOiAxNTAsXCJiXCI6IDEyMiB9LCBcImhleFwiOiBcIiNlOTk2N2FcIn0sXG4gICAgXCJkYXJrc2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTQzLFwiZ1wiOiAxODgsXCJiXCI6IDE0MyB9LCBcImhleFwiOiBcIiM4ZmJjOGZcIn0sXG4gICAgXCJkYXJrc2xhdGVibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDcyLFwiZ1wiOiA2MSxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzQ4M2Q4YlwifSxcbiAgICBcImRhcmtzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogNDMsXCJzXCI6IDg5LFwibFwiOiAzOCB9LCBcInJnYlwiOiB7XCJyXCI6IDQ3LFwiZ1wiOiA3OSxcImJcIjogNzkgfSwgXCJoZXhcIjogXCIjMmY0ZjRmXCJ9LFxuICAgIFwiZGFya3NsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDQ3LFwiZ1wiOiA3OSxcImJcIjogNzkgfSwgXCJoZXhcIjogXCIjMmY0ZjRmXCJ9LFxuICAgIFwiZGFya3R1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogMjAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyMDYsXCJiXCI6IDIwOSB9LCBcImhleFwiOiBcIiMwMGNlZDFcIn0sXG4gICAgXCJkYXJrdmlvbGV0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMTQ4LFwiZ1wiOiAwLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjOTQwMGQzXCJ9LFxuICAgIFwiZGVlcHBpbmtcIjoge1wiaHNsXCI6IHtcImhcIjogNTYsXCJzXCI6IDM4LFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjAsXCJiXCI6IDE0NyB9LCBcImhleFwiOiBcIiNmZjE0OTNcIn0sXG4gICAgXCJkZWVwc2t5Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxOTEsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMGJmZmZcIn0sXG4gICAgXCJkaW1ncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDgyLFwic1wiOiAzOSxcImxcIjogMzAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDUsXCJnXCI6IDEwNSxcImJcIjogMTA1IH0sIFwiaGV4XCI6IFwiIzY5Njk2OVwifSxcbiAgICBcImRpbWdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzMsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDUsXCJnXCI6IDEwNSxcImJcIjogMTA1IH0sIFwiaGV4XCI6IFwiIzY5Njk2OVwifSxcbiAgICBcImRvZGdlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjgwLFwic1wiOiA2MSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAzMCxcImdcIjogMTQ0LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMWU5MGZmXCJ9LFxuICAgIFwiZmlyZWJyaWNrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzgsXCJnXCI6IDM0LFwiYlwiOiAzNCB9LCBcImhleFwiOiBcIiNiMjIyMjJcIn0sXG4gICAgXCJmbG9yYWx3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNSxcInNcIjogNzIsXCJsXCI6IDcwIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTAsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmZmZhZjBcIn0sXG4gICAgXCJmb3Jlc3RncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDI1LFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDM0LFwiZ1wiOiAxMzksXCJiXCI6IDM0IH0sIFwiaGV4XCI6IFwiIzIyOGIyMlwifSxcbiAgICBcImZ1Y2hzaWFcIjoge1wiaHNsXCI6IHtcImhcIjogMjQ4LFwic1wiOiAzOSxcImxcIjogMzkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmZjAwZmZcIn0sXG4gICAgXCJnYWluc2Jvcm9cIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAyNSxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMjAsXCJnXCI6IDIyMCxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2RjZGNkY1wifSxcbiAgICBcImdob3N0d2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAyNSxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDgsXCJnXCI6IDI0OCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2Y4ZjhmZlwifSxcbiAgICBcImdvbGRcIjoge1wiaHNsXCI6IHtcImhcIjogMTgxLFwic1wiOiAxMDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZkNzAwXCJ9LFxuICAgIFwiZ29sZGVucm9kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4MixcInNcIjogMTAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDIxOCxcImdcIjogMTY1LFwiYlwiOiAzMiB9LCBcImhleFwiOiBcIiNkYWE1MjBcIn0sXG4gICAgXCJncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDMyOCxcInNcIjogMTAwLFwibFwiOiA1NCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODA4MDgwXCJ9LFxuICAgIFwiZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTk1LFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTI4LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwODAwMFwifSxcbiAgICBcImdyZWVueWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMTczLFwiZ1wiOiAyNTUsXCJiXCI6IDQ3IH0sIFwiaGV4XCI6IFwiI2FkZmYyZlwifSxcbiAgICBcImdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwODA4MFwifSxcbiAgICBcImhvbmV5ZGV3XCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTAwLFwibFwiOiA1NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjU1LFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZjBmZmYwXCJ9LFxuICAgIFwiaG90cGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA2OCxcImxcIjogNDIgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDEwNSxcImJcIjogMTgwIH0sIFwiaGV4XCI6IFwiI2ZmNjliNFwifSxcbiAgICBcImluZGlhbnJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIwNSxcImdcIjogOTIsXCJiXCI6IDkyIH0sIFwiaGV4XCI6IFwiI2NkNWM1Y1wifSxcbiAgICBcImluZGlnb1wiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDYxLFwibFwiOiAzNCB9LCBcInJnYlwiOiB7XCJyXCI6IDc1LFwiZ1wiOiAwLFwiYlwiOiAxMzAgfSwgXCJoZXhcIjogXCIjNGIwMDgyXCJ9LFxuICAgIFwiaXZvcnlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogODYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2ZmZmZmMFwifSxcbiAgICBcImtoYWtpXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiA5OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjMwLFwiYlwiOiAxNDAgfSwgXCJoZXhcIjogXCIjZjBlNjhjXCJ9LFxuICAgIFwibGF2ZW5kZXJcIjoge1wiaHNsXCI6IHtcImhcIjogNTEsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzAsXCJnXCI6IDIzMCxcImJcIjogMjUwIH0sIFwiaGV4XCI6IFwiI2U2ZTZmYVwifSxcbiAgICBcImxhdmVuZGVyYmx1c2hcIjoge1wiaHNsXCI6IHtcImhcIjogNDMsXCJzXCI6IDc0LFwibFwiOiA0OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjQwLFwiYlwiOiAyNDUgfSwgXCJoZXhcIjogXCIjZmZmMGY1XCJ9LFxuICAgIFwibGF3bmdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDg0LFwic1wiOiAxMDAsXCJsXCI6IDU5IH0sIFwicmdiXCI6IHtcInJcIjogMTI0LFwiZ1wiOiAyNTIsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjN2NmYzAwXCJ9LFxuICAgIFwibGVtb25jaGlmZm9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTAsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiNmZmZhY2RcIn0sXG4gICAgXCJsaWdodGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTczLFwiZ1wiOiAyMTYsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNhZGQ4ZTZcIn0sXG4gICAgXCJsaWdodGNvcmFsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMzMCxcInNcIjogMTAwLFwibFwiOiA3MSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjZjA4MDgwXCJ9LFxuICAgIFwibGlnaHRjeWFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDUzLFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDIyNCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZTBmZmZmXCJ9LFxuICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMjc1LFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyNTAsXCJiXCI6IDIxMCB9LCBcImhleFwiOiBcIiNmYWZhZDJcIn0sXG4gICAgXCJsaWdodGdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTEsXCJnXCI6IDIxMSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2QzZDNkM1wifSxcbiAgICBcImxpZ2h0Z3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNTQsXCJzXCI6IDc3LFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDE0NCxcImdcIjogMjM4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjOTBlZTkwXCJ9LFxuICAgIFwibGlnaHRncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogNjcsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogMjExLFwiZ1wiOiAyMTEsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNkM2QzZDNcIn0sXG4gICAgXCJsaWdodHBpbmtcIjoge1wiaHNsXCI6IHtcImhcIjogMzQwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxODIsXCJiXCI6IDE5MyB9LCBcImhleFwiOiBcIiNmZmI2YzFcIn0sXG4gICAgXCJsaWdodHNhbG1vblwiOiB7XCJoc2xcIjoge1wiaFwiOiA5MCxcInNcIjogMTAwLFwibFwiOiA0OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTYwLFwiYlwiOiAxMjIgfSwgXCJoZXhcIjogXCIjZmZhMDdhXCJ9LFxuICAgIFwibGlnaHRzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA1NCxcInNcIjogMTAwLFwibFwiOiA5MCB9LCBcInJnYlwiOiB7XCJyXCI6IDMyLFwiZ1wiOiAxNzgsXCJiXCI6IDE3MCB9LCBcImhleFwiOiBcIiMyMGIyYWFcIn0sXG4gICAgXCJsaWdodHNreWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTk1LFwic1wiOiA1MyxcImxcIjogNzkgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzUsXCJnXCI6IDIwNixcImJcIjogMjUwIH0sIFwiaGV4XCI6IFwiIzg3Y2VmYVwifSxcbiAgICBcImxpZ2h0c2xhdGVncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDc5LFwibFwiOiA3MiB9LCBcInJnYlwiOiB7XCJyXCI6IDExOSxcImdcIjogMTM2LFwiYlwiOiAxNTMgfSwgXCJoZXhcIjogXCIjNzc4ODk5XCJ9LFxuICAgIFwibGlnaHRzbGF0ZWdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogMTE5LFwiZ1wiOiAxMzYsXCJiXCI6IDE1MyB9LCBcImhleFwiOiBcIiM3Nzg4OTlcIn0sXG4gICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogODAsXCJsXCI6IDkwIH0sIFwicmdiXCI6IHtcInJcIjogMTc2LFwiZ1wiOiAxOTYsXCJiXCI6IDIyMiB9LCBcImhleFwiOiBcIiNiMGM0ZGVcIn0sXG4gICAgXCJsaWdodHllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAyMjQgfSwgXCJoZXhcIjogXCIjZmZmZmUwXCJ9LFxuICAgIFwibGltZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDczLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMGZmMDBcIn0sXG4gICAgXCJsaW1lZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiA1MCxcImdcIjogMjA1LFwiYlwiOiA1MCB9LCBcImhleFwiOiBcIiMzMmNkMzJcIn0sXG4gICAgXCJsaW5lblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNTEsXCJzXCI6IDEwMCxcImxcIjogODYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDI0MCxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2ZhZjBlNlwifSxcbiAgICBcIm1hZ2VudGFcIjoge1wiaHNsXCI6IHtcImhcIjogMTcsXCJzXCI6IDEwMCxcImxcIjogNzQgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmZjAwZmZcIn0sXG4gICAgXCJtYXJvb25cIjoge1wiaHNsXCI6IHtcImhcIjogMTc3LFwic1wiOiA3MCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjODAwMDAwXCJ9LFxuICAgIFwibWVkaXVtYXF1YW1hcmluZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMDMsXCJzXCI6IDkyLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDEwMixcImdcIjogMjA1LFwiYlwiOiAxNzAgfSwgXCJoZXhcIjogXCIjNjZjZGFhXCJ9LFxuICAgIFwibWVkaXVtYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDE0LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiMwMDAwY2RcIn0sXG4gICAgXCJtZWRpdW1vcmNoaWRcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxNCxcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxODYsXCJnXCI6IDg1LFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjYmE1NWQzXCJ9LFxuICAgIFwibWVkaXVtcHVycGxlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxNCxcInNcIjogNDEsXCJsXCI6IDc4IH0sIFwicmdiXCI6IHtcInJcIjogMTQ3LFwiZ1wiOiAxMTIsXCJiXCI6IDIxOSB9LCBcImhleFwiOiBcIiM5MzcwZGJcIn0sXG4gICAgXCJtZWRpdW1zZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDYwLFwiZ1wiOiAxNzksXCJiXCI6IDExMyB9LCBcImhleFwiOiBcIiMzY2IzNzFcIn0sXG4gICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiA2MSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjMsXCJnXCI6IDEwNCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiIzdiNjhlZVwifSxcbiAgICBcIm1lZGl1bXNwcmluZ2dyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwLFwic1wiOiA2NyxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTAsXCJiXCI6IDE1NCB9LCBcImhleFwiOiBcIiMwMGZhOWFcIn0sXG4gICAgXCJtZWRpdW10dXJxdW9pc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTYwLFwic1wiOiA1MSxcImxcIjogNjAgfSwgXCJyZ2JcIjoge1wiclwiOiA3MixcImdcIjogMjA5LFwiYlwiOiAyMDQgfSwgXCJoZXhcIjogXCIjNDhkMWNjXCJ9LFxuICAgIFwibWVkaXVtdmlvbGV0cmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiA0MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE5OSxcImdcIjogMjEsXCJiXCI6IDEzMyB9LCBcImhleFwiOiBcIiNjNzE1ODVcIn0sXG4gICAgXCJtaWRuaWdodGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjg4LFwic1wiOiA1OSxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAyNSxcImdcIjogMjUsXCJiXCI6IDExMiB9LCBcImhleFwiOiBcIiMxOTE5NzBcIn0sXG4gICAgXCJtaW50Y3JlYW1cIjoge1wiaHNsXCI6IHtcImhcIjogMjYwLFwic1wiOiA2MCxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI1NSxcImJcIjogMjUwIH0sIFwiaGV4XCI6IFwiI2Y1ZmZmYVwifSxcbiAgICBcIm1pc3R5cm9zZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNDcsXCJzXCI6IDUwLFwibFwiOiA0NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAyMjUgfSwgXCJoZXhcIjogXCIjZmZlNGUxXCJ9LFxuICAgIFwibW9jY2FzaW5cIjoge1wiaHNsXCI6IHtcImhcIjogMjQ5LFwic1wiOiA4MCxcImxcIjogNjcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMTgxIH0sIFwiaGV4XCI6IFwiI2ZmZTRiNVwifSxcbiAgICBcIm5hdmFqb3doaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1NyxcInNcIjogMTAwLFwibFwiOiA0OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjIyLFwiYlwiOiAxNzMgfSwgXCJoZXhcIjogXCIjZmZkZWFkXCJ9LFxuICAgIFwibmF2eVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzgsXCJzXCI6IDYwLFwibFwiOiA1NSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiMwMDAwODBcIn0sXG4gICAgXCJvbGRsYWNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMyMixcInNcIjogODEsXCJsXCI6IDQzIH0sIFwicmdiXCI6IHtcInJcIjogMjUzLFwiZ1wiOiAyNDUsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNmZGY1ZTZcIn0sXG4gICAgXCJvbGl2ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDY0LFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMTI4LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzgwODAwMFwifSxcbiAgICBcIm9saXZlZHJhYlwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTAsXCJzXCI6IDEwMCxcImxcIjogOTggfSwgXCJyZ2JcIjoge1wiclwiOiAxMDcsXCJnXCI6IDE0MixcImJcIjogMzUgfSwgXCJoZXhcIjogXCIjNmI4ZTIzXCJ9LFxuICAgIFwib3JhbmdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE2NSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmE1MDBcIn0sXG4gICAgXCJvcmFuZ2VyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMzgsXCJzXCI6IDEwMCxcImxcIjogODUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDY5LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmNDUwMFwifSxcbiAgICBcIm9yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNixcInNcIjogMTAwLFwibFwiOiA4NCB9LCBcInJnYlwiOiB7XCJyXCI6IDIxOCxcImdcIjogMTEyLFwiYlwiOiAyMTQgfSwgXCJoZXhcIjogXCIjZGE3MGQ2XCJ9LFxuICAgIFwicGFsZWdvbGRlbnJvZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOSxcInNcIjogODUsXCJsXCI6IDk1IH0sIFwicmdiXCI6IHtcInJcIjogMjM4LFwiZ1wiOiAyMzIsXCJiXCI6IDE3MCB9LCBcImhleFwiOiBcIiNlZWU4YWFcIn0sXG4gICAgXCJwYWxlZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogODAsXCJzXCI6IDYwLFwibFwiOiAzNSB9LCBcInJnYlwiOiB7XCJyXCI6IDE1MixcImdcIjogMjUxLFwiYlwiOiAxNTIgfSwgXCJoZXhcIjogXCIjOThmYjk4XCJ9LFxuICAgIFwicGFsZXR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNixcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE3NSxcImdcIjogMjM4LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjYWZlZWVlXCJ9LFxuICAgIFwicGFsZXZpb2xldHJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDIsXCJzXCI6IDU5LFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIxOSxcImdcIjogMTEyLFwiYlwiOiAxNDcgfSwgXCJoZXhcIjogXCIjZGI3MDkzXCJ9LFxuICAgIFwicGFwYXlhd2hpcFwiOiB7XCJoc2xcIjoge1wiaFwiOiA1NSxcInNcIjogNjcsXCJsXCI6IDgwIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMzksXCJiXCI6IDIxMyB9LCBcImhleFwiOiBcIiNmZmVmZDVcIn0sXG4gICAgXCJwZWFjaHB1ZmZcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiA5MyxcImxcIjogNzkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIxOCxcImJcIjogMTg1IH0sIFwiaGV4XCI6IFwiI2ZmZGFiOVwifSxcbiAgICBcInBlcnVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiA2NSxcImxcIjogODEgfSwgXCJyZ2JcIjoge1wiclwiOiAyMDUsXCJnXCI6IDEzMyxcImJcIjogNjMgfSwgXCJoZXhcIjogXCIjY2Q4NTNmXCJ9LFxuICAgIFwicGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDAsXCJzXCI6IDYwLFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTkyLFwiYlwiOiAyMDMgfSwgXCJoZXhcIjogXCIjZmZjMGNiXCJ9LFxuICAgIFwicGx1bVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNyxcInNcIjogMTAwLFwibFwiOiA5MiB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMSxcImdcIjogMTYwLFwiYlwiOiAyMjEgfSwgXCJoZXhcIjogXCIjZGRhMGRkXCJ9LFxuICAgIFwicG93ZGVyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyOCxcInNcIjogMTAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE3NixcImdcIjogMjI0LFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjYjBlMGU2XCJ9LFxuICAgIFwicHVycGxlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwLFwic1wiOiA1OSxcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDAsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDAwODBcIn0sXG4gICAgXCJyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMzUwLFwic1wiOiAxMDAsXCJsXCI6IDg4IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmMDAwMFwifSxcbiAgICBcInJvc3licm93blwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDQ3LFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDE4OCxcImdcIjogMTQzLFwiYlwiOiAxNDMgfSwgXCJoZXhcIjogXCIjYmM4ZjhmXCJ9LFxuICAgIFwicm95YWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4NyxcInNcIjogNTIsXCJsXCI6IDgwIH0sIFwicmdiXCI6IHtcInJcIjogNjUsXCJnXCI6IDEwNSxcImJcIjogMjI1IH0sIFwiaGV4XCI6IFwiIzQxNjllMVwifSxcbiAgICBcInNhZGRsZWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDI1LFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOSxcImdcIjogNjksXCJiXCI6IDE5IH0sIFwiaGV4XCI6IFwiIzhiNDUxM1wifSxcbiAgICBcInNhbG1vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMjUsXCJzXCI6IDczLFwibFwiOiA1NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMTI4LFwiYlwiOiAxMTQgfSwgXCJoZXhcIjogXCIjZmE4MDcyXCJ9LFxuICAgIFwic2FuZHlicm93blwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNSxcInNcIjogNzYsXCJsXCI6IDMxIH0sIFwicmdiXCI6IHtcInJcIjogMjQ0LFwiZ1wiOiAxNjQsXCJiXCI6IDk2IH0sIFwiaGV4XCI6IFwiI2Y0YTQ2MFwifSxcbiAgICBcInNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYsXCJzXCI6IDkzLFwibFwiOiA3MSB9LCBcInJnYlwiOiB7XCJyXCI6IDQ2LFwiZ1wiOiAxMzksXCJiXCI6IDg3IH0sIFwiaGV4XCI6IFwiIzJlOGI1N1wifSxcbiAgICBcInNlYXNoZWxsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4LFwic1wiOiA4NyxcImxcIjogNjcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI0NSxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2ZmZjVlZVwifSxcbiAgICBcInNpZW5uYVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNDYsXCJzXCI6IDUwLFwibFwiOiAzNiB9LCBcInJnYlwiOiB7XCJyXCI6IDE2MCxcImdcIjogODIsXCJiXCI6IDQ1IH0sIFwiaGV4XCI6IFwiI2EwNTIyZFwifSxcbiAgICBcInNpbHZlclwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNSxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDE5MixcImdcIjogMTkyLFwiYlwiOiAxOTIgfSwgXCJoZXhcIjogXCIjYzBjMGMwXCJ9LFxuICAgIFwic2t5Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOSxcInNcIjogNTYsXCJsXCI6IDQwIH0sIFwicmdiXCI6IHtcInJcIjogMTM1LFwiZ1wiOiAyMDYsXCJiXCI6IDIzNSB9LCBcImhleFwiOiBcIiM4N2NlZWJcIn0sXG4gICAgXCJzbGF0ZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTk3LFwic1wiOiA3MSxcImxcIjogNzMgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDYsXCJnXCI6IDkwLFwiYlwiOiAyMDUgfSwgXCJoZXhcIjogXCIjNmE1YWNkXCJ9LFxuICAgIFwic2xhdGVncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0OCxcInNcIjogNTMsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMTEyLFwiZ1wiOiAxMjgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM3MDgwOTBcIn0sXG4gICAgXCJzbGF0ZWdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxMyxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTIsXCJnXCI6IDEyOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzcwODA5MFwifSxcbiAgICBcInNub3dcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxMyxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjUwIH0sIFwiaGV4XCI6IFwiI2ZmZmFmYVwifSxcbiAgICBcInNwcmluZ2dyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogOTkgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDEyNyB9LCBcImhleFwiOiBcIiMwMGZmN2ZcIn0sXG4gICAgXCJzdGVlbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTUwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogNzAsXCJnXCI6IDEzMCxcImJcIjogMTgwIH0sIFwiaGV4XCI6IFwiIzQ2ODJiNFwifSxcbiAgICBcInRhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMDcsXCJzXCI6IDQ0LFwibFwiOiA0OSB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMCxcImdcIjogMTgwLFwiYlwiOiAxNDAgfSwgXCJoZXhcIjogXCIjZDJiNDhjXCJ9LFxuICAgIFwidGVhbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNDQsXCJsXCI6IDY5IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjMDA4MDgwXCJ9LFxuICAgIFwidGhpc3RsZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDI0LFwibFwiOiA4MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIxNixcImdcIjogMTkxLFwiYlwiOiAyMTYgfSwgXCJoZXhcIjogXCIjZDhiZmQ4XCJ9LFxuICAgIFwidG9tYXRvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDksXCJzXCI6IDEwMCxcImxcIjogNjQgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDk5LFwiYlwiOiA3MSB9LCBcImhleFwiOiBcIiNmZjYzNDdcIn0sXG4gICAgXCJ0dXJxdW9pc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTc0LFwic1wiOiA3MixcImxcIjogNTYgfSwgXCJyZ2JcIjoge1wiclwiOiA2NCxcImdcIjogMjI0LFwiYlwiOiAyMDggfSwgXCJoZXhcIjogXCIjNDBlMGQwXCJ9LFxuICAgIFwidmlvbGV0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogNzYsXCJsXCI6IDcyIH0sIFwicmdiXCI6IHtcInJcIjogMjM4LFwiZ1wiOiAxMzAsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNlZTgyZWVcIn0sXG4gICAgXCJ3aGVhdFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOSxcInNcIjogNzcsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogMjQ1LFwiZ1wiOiAyMjIsXCJiXCI6IDE3OSB9LCBcImhleFwiOiBcIiNmNWRlYjNcIn0sXG4gICAgXCJ3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA5NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZmZmZmZmXCJ9LFxuICAgIFwid2hpdGVzbW9rZVwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MCxcInNcIjogNjEsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjQ1LFwiZ1wiOiAyNDUsXCJiXCI6IDI0NSB9LCBcImhleFwiOiBcIiNmNWY1ZjVcIn0sXCJ5ZWxsb3dcIjogeyBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmZmYwMFwifSxcInllbGxvd2dyZWVuXCI6IHsgXCJyZ2JcIjoge1wiclwiOiAxNTQsXCJnXCI6IDIwNSxcImJcIjogNTAgfSwgXCJoZXhcIjogXCIjOWFjZDMyXCJ9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmFtZWRjb2xvcnM7IiwiZnVuY3Rpb24gbmVhcmx5RXF1YWwoYSwgYiwgZXBzKXtcbiAgICBpZiAodHlwZW9mIGVwcyA9PT0gXCJ1bmRlZmluZWRcIikge2VwcyA9IDAuMDE7fVxuICAgIHZhciBkaWZmID0gTWF0aC5hYnMoYSAtIGIpO1xuICAgIHJldHVybiAoZGlmZiA8IGVwcyk7XG59XG5cbnZhciBoZWxwZXJzID0gbmV3IE9iamVjdChudWxsKTtcblxuaGVscGVycy5uZWFybHlFcXVhbCA9IG5lYXJseUVxdWFsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGhlbHBlcnM7Il19
(7)
});
