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
var math = _dereq_('../math/math.js');
var Vector = math.Vector;
var Matrix = math.Matrix;

/** 
 * @constructor
 * @param {Vector} position Camera position.
 * @param {Vector} target   Camera
 */
function Camera(width, height, position){
    this.position = position || new Vector(1,1,20);
    this.up = new Vector(0, 1, 0);
    this.rotation = {'yaw': 0, 'pitch': 0, 'roll': 0};
    this.view_matrix = this.createViewMatrix();
    this.width = width;
    this.height = height;
    this.near = 0.1;
    this.far = 1000;
    this.fov = 90;
    this.perspectiveFov = this.calculatePerspectiveFov();
}
/** @method */
Camera.prototype.direction = function() {
    var sin_pitch = Math.sin(this.rotation.pitch);
    var cos_pitch = Math.cos(this.rotation.pitch);
    var sin_yaw = Math.sin(this.rotation.yaw);
    var cos_yaw = Math.cos(this.rotation.yaw);

    return new Vector(-cos_pitch * sin_yaw, sin_pitch, -cos_pitch * cos_yaw);
};
/**
 * Builds a perspective projection matrix based on a field of view.
 * @method
 * @return {Matrix}
 */
Camera.prototype.calculatePerspectiveFov = function() {
    var fov = this.fov * (Math.PI / 180); // convert to radians
    var aspect = this.width / this.height;
    var near = this.near;
    var far = this.far;
    var matrix = Matrix.zero();
    var height = (1/Math.tan(fov/2)) * this.height;
    var width = height * aspect;

    matrix[0] = width;
    matrix[5] = height;
    matrix[10] = far/(near-far) ;
    matrix[11] = -1;
    matrix[14] = near*far/(near-far);

    return matrix;
};
/** @method */
Camera.prototype.createViewMatrix = function(){
    var eye = this.position;
    var pitch = this.rotation.pitch;
    var yaw = this.rotation.yaw;
    var cos_pitch = Math.cos(pitch);
    var sin_pitch = Math.sin(pitch);
    var cos_yaw = Math.cos(yaw);
    var sin_yaw = Math.sin(yaw);

    var xaxis = new Vector(cos_yaw, 0, -sin_yaw );
    var yaxis = new Vector(sin_yaw * sin_pitch, cos_pitch, cos_yaw * sin_pitch );
    var zaxis = new Vector(sin_yaw * cos_pitch, -sin_pitch, cos_pitch * cos_yaw );

    var view_matrix = Matrix.fromArray([
        xaxis.x, yaxis.x, zaxis.x, 0,
        xaxis.y, yaxis.y, zaxis.y, 0,
        xaxis.z, yaxis.z, zaxis.z, 0,
        -(xaxis.dot(eye) ), -( yaxis.dot(eye) ), -( zaxis.dot(eye) ), 1
    ]);
    return view_matrix;
};
/** @method */
Camera.prototype.moveTo = function(x, y, z){
    this.position = new Vector(x,y,z);
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveRight = function(amount){
    var right = this.up.cross(this.direction()).normalize().scale(amount);
    this.position = this.position.subtract(right);
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveLeft = function(amount){
    var left = this.up.cross(this.direction()).normalize().scale(amount);
    this.position = this.position.add(left);
    this.view_matrix = this.createViewMatrix();
};
Camera.prototype.turnRight = function(amount){
    this.rotation.yaw -= amount;
    if (this.rotation.yaw < 0){
        this.rotation.yaw = this.rotation.yaw + (Math.PI*2);
    }
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.turnLeft = function(amount){
    this.rotation.yaw += amount;
    if (this.rotation.yaw > (Math.PI*2)){
        this.rotation.yaw = this.rotation.yaw - (Math.PI*2);
    }
    this.view_matrix = this.createViewMatrix();
};
Camera.prototype.lookUp = function(amount){
    this.rotation.pitch -= amount;
    if (this.rotation.pitch > (Math.PI*2)){
        this.rotation.pitch = this.rotation.pitch - (Math.PI*2);
    }
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.lookDown = function(amount){
    this.rotation.pitch += amount;
    if (this.rotation.pitch < 0){
        this.rotation.pitch = this.rotation.pitch + (Math.PI*2);
    }
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveUp = function(amount){
    var up = this.up.normalize().scale(amount);
    this.position = this.position.add(up);
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveDown = function(amount){
    var down = this.up.normalize().scale(amount);
    this.position = this.position.subtract(down);
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveForward = function(amount){
    var forward = this.direction().scale(amount);
    this.position = this.position.add(forward);
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveBackward = function(amount){
    var backward = this.direction().scale(amount);
    this.position = this.position.subtract(backward);
    this.view_matrix = this.createViewMatrix();
};

module.exports = Camera;

},{"../math/math.js":10}],7:[function(_dereq_,module,exports){
/**
 * Event handler.
 * @constructor
 * @license
 * Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
 * MIT License
 */

function EventTarget(){
    this._listeners = {};
}

/** @method */
EventTarget.prototype.addListener = function(type, listener){
    if (typeof this._listeners[type] === "undefined"){
        this._listeners[type] = [];
    }

    this._listeners[type].push(listener);
};
/** @method */
EventTarget.prototype.fire = function(event){
    if (typeof event === "string"){
        event = { type: event };
    }
    if (!event.target){
        event.target = this;
    }

    if (!event.type){  //falsy
        throw new Error("Event object missing 'type' property.");
    }

    if (this._listeners[event.type] instanceof Array){
        var listeners = this._listeners[event.type];
        for (var i=0, len=listeners.length; i < len; i++){
            listeners[i].call(this, event);
        }
    }
};
/** @method */
EventTarget.prototype.removeListener = function(type, listener){
    if (this._listeners[type] instanceof Array){
        var listeners = this._listeners[type];
        for (var i=0, len=listeners.length; i < len; i++){
            if (listeners[i] === listener){
                listeners.splice(i, 1);
                break;
            }
        }
    }
};

module.exports = EventTarget;
},{}],8:[function(_dereq_,module,exports){
var math = _dereq_('../math/math.js');
var Camera = _dereq_('./camera.js');
var EventTarget = _dereq_('./events.js');
var KEYCODES = _dereq_('../utility/keycodes.js');

var Vector = math.Vector;
var Matrix = math.Matrix;

/**
 * @constructor
 * @param {{canvas_id: string, width: number, height: number}} options
 */
function Scene(options){
    /** @type {number} */
    this.width = options.width;
    /** @type {number} */
    this.height = options.height;
    this.canvas = document.getElementById(options.canvas_id);
    this.ctx = this.canvas.getContext('2d');
    this._back_buffer = document.createElement('canvas');
    this._back_buffer.width = this.width;
    this._back_buffer.height = this.height;
    this._back_buffer_ctx = this._back_buffer.getContext('2d');
    this._back_buffer_image = null;
    this._depth_buffer = [];
    this.drawing_mode = 1;
    this._backface_culling = true;
    this.camera = new Camera(this.width, this.height);
    this.illumination = new Vector(90,0,0);
    /** @type {Array.<Mesh>} */
    this.meshes = {};
    /** @type {Object.<number, boolean>} */
    this._keys = {}; // Keys currently pressed
    this._key_count = 0; // Number of keys being pressed... this feels kludgy
    /** @type {?number} */
    this._anim_id = null;
    /** @type {boolean} */
    this._needs_update = true;
    this._draw_mode = 'wireframe';
    this.init();
}
Scene.prototype = new EventTarget();
/** @method */
Scene.prototype.init = function(){
    this.canvas.tabIndex = 1; // Set tab index to allow canvas to have focus to receive key events
    this._x_offset = Math.round(this.width / 2);
    this._y_offset = Math.round(this.height / 2);
    this.initializeDepthBuffer();
    this._back_buffer_image = this._back_buffer_ctx.createImageData(this.width, this.height);
    this.canvas.addEventListener('keydown', this.onKeyDown.bind(this), false);
    this.canvas.addEventListener('keyup', this.onKeyUp.bind(this), false);
    this.canvas.addEventListener('blur', this.emptyKeys.bind(this), false);
    EventTarget.call(this);
    this.update();
};
/**
 * Dump all pressed keys on blur.
 * @method
 */
Scene.prototype.emptyKeys = function(){
    this._key_count = 0;
    this._keys = {};
};
/** @method */
Scene.prototype.isKeyDown = function(key){
    return (KEYCODES[key] in this._keys);
};
/** @method */
Scene.prototype.onKeyDown = function(e){
    var pressed = e.keyCode || e.which;
    if (!this.isKeyDown(pressed)){
        this._key_count += 1;
        this._keys[pressed] = true;
    }
};
/** @method */
Scene.prototype.onKeyUp = function(e){
    var pressed = e.keyCode || e.which;
    if (pressed in this._keys){
        this._key_count -= 1;
        delete this._keys[pressed];
    }
};
/** @method */
Scene.prototype.initializeDepthBuffer = function(){
    for (var x = 0, len = this.width * this.height; x < len; x++){
        this._depth_buffer[x] = 9999999;
    }
};
/** @method */
Scene.prototype.offscreen = function(vector){
    // TODO: Not totally certain that z>1 indicates vector is behind camera.
    var x = vector.x + this._x_offset;
    var y = vector.y + this._y_offset;
    var z = vector.z;
    return (z > 1 || x < 0 || x > this.width || y < 0 || y > this.height);
};
/** @method */
Scene.prototype.drawPixel = function(x, y, z, color){
    x = Math.floor(x + this._x_offset);
    y = Math.floor(y + this._y_offset);
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        var index = x + (y * this.width);
        if (z < this._depth_buffer[index]) {
            var image_data = this._back_buffer_image.data;
            var i = index * 4;
            image_data[i] = color.r;
            image_data[i+1] = color.g;
            image_data[i+2] = color.b;
            image_data[i+3] = 255;
            this._depth_buffer[index] = z;
        }
    }
};
/** @method  */
Scene.prototype.drawEdge = function(vector1, vector2, color){
    var abs = Math.abs;
    if (vector1.x > vector2.x){
        var temp = vector1;
        vector1 = vector2;
        vector2 = temp;
    }
    var current_x = vector1.x;
    var current_y = vector1.y;
    var current_z = vector1.z;
    var longest_dist = Math.max(abs(vector2.x - vector1.x), abs(vector2.y - vector1.y), abs(vector2.z - vector1.z));
    var step_x = (vector2.x - vector1.x) / longest_dist;
    var step_y = (vector2.y - vector1.y) / longest_dist;
    var step_z = (vector2.z - vector1.z) / longest_dist;

    for (var i = 0; i < longest_dist; i++){
        this.drawPixel(current_x, current_y, current_z, color);
        current_x += step_x;
        current_y += step_y;
        current_z += step_z;
    }
};
/** @method */
Scene.prototype.drawTriangle = function(vector1, vector2, vector3, color){
    this.drawEdge(vector1, vector2, color);
    this.drawEdge(vector2, vector3, color);
    this.drawEdge(vector3, vector1, color);
};
/** @method */
Scene.prototype.drawFlatBottomTriangle = function(v1, v2, v3, color){
    // Draw left to right
    if (v2.x >= v3.x){
        var temp = v3;
        v3 = v2;
        v2 = temp;
    }
    // compute deltas
    var dxy_left  = (v3.x-v1.x)/(v3.y-v1.y);
    var dxy_right = (v2.x-v1.x)/(v2.y-v1.y);
    var z_slope_left = (v3.z-v1.z)/(v3.y-v1.y);
    var z_slope_right = (v2.z-v1.z)/(v2.y-v1.y);

    // set starting and ending points for edge trace
    var xs = new Vector(v1.x, v1.y, v1.z);
    var xe = new Vector(v1.x, v1.y, v1.z);
    xs.z = v3.z + ((v1.y - v3.y) * z_slope_left);
    xe.z = v2.z + ((v1.y - v2.y) * z_slope_right);

    // draw each scanline
    for (var y=v1.y; y <= v2.y; y++){
        xs.y = y;
        xe.y = y;
        this.drawEdge(xs, xe, color);

        // move down one scanline
        xs.x+=dxy_left;
        xe.x+=dxy_right;
        xs.z+=z_slope_left;
        xe.z+=z_slope_right;
    }
};
Scene.prototype.drawFlatTopTriangle = function(v1, v2, v3, color){
    // Draw left to right
    if (v1.x >= v2.x){
        var temp = v1;
        v1 = v2;
        v2 = temp;
    }
    // compute deltas
    var dxy_left  = (v3.x-v1.x)/(v3.y-v1.y);
    var dxy_right = (v3.x-v2.x)/(v3.y-v2.y);
    var z_slope_left = (v3.z-v1.z)/(v3.y-v1.y);
    var z_slope_right = (v3.z-v2.z)/(v3.y-v2.y);

    // set starting and ending points for edge trace
    var xs = new Vector(v1.x, v1.y, v1.z);
    var xe = new Vector(v2.x, v1.y, v1.z);

    xs.z = v1.z + ((v1.y - v1.y) * z_slope_left);
    xe.z = v2.z + ((v1.y - v2.y) * z_slope_right);

    // draw each scanline
    for (var y=v1.y; y <= v3.y; y++){
        xs.y = y;
        xe.y = y;
        // draw a line from xs to xe at y in color c
        this.drawEdge(xs, xe, color);
        // move down one scanline
        xs.x+=dxy_left;
        xe.x+=dxy_right;
        xs.z+=z_slope_left;
        xe.z+=z_slope_right;
    }
};
/** @method */
Scene.prototype.fillTriangle = function(v1, v2, v3, color){
    // Draw edges first
    // TODO: Fix. This is a hack. 
    //this.drawTriangle(v1, v2, v3, color);
    // Sort vertices by y value
    var temp;
    if(v1.y > v2.y) {
        temp = v2;
        v2 = v1;
        v1 = temp;
    }
    if(v2.y > v3.y) {
        temp = v2;
        v2 = v3;
        v3 = temp;
    }
    if(v1.y > v2.y) {
        temp = v2;
        v2 = v1;
        v1 = temp;
    }
    // Triangle with no height
    if ((v1.y - v3.y) === 0){
        return;
    }

    var short_slope, long_slope;
    if ((v2.y - v1.y) === 0) {
        short_slope = 0;
    } else {
        short_slope = (v2.x - v1.x) / (v2.y - v1.y);
    }
    if ((v3.y - v1.y) === 0) {
        long_slope = 0;
    } else {
        long_slope = (v3.x - v1.x) / (v3.y - v1.y);
    }

    if (v2.y === v3.y){
        // Flat top
        this.drawFlatBottomTriangle(v1, v2, v3, color);
    }
    else if (v1.y === v2.y ){
        // Flat bottom
        this.drawFlatTopTriangle(v1, v2, v3, color);
    } else {
        // Decompose into flat top and flat bottom triangles
        var z_slope = (v3.z - v1.z) / (v3.y - v1.y);
        var x = ((v2.y - v1.y)*long_slope) + v1.x;
        var z = ((v2.y - v1.y)*z_slope) + v1.z;
        var v4 = new Vector(x, v2.y, z);
        this.drawFlatBottomTriangle(v1, v2, v4, color);
        this.drawFlatTopTriangle(v2, v4, v3, color);
    }
};
/** @method */
Scene.prototype.renderScene = function(){
    // TODO: Simplify this function.
    this._back_buffer_image = this._back_buffer_ctx.createImageData(this.width, this.height);
    this.initializeDepthBuffer();
    var camera_matrix = this.camera.view_matrix;
    var projection_matrix = this.camera.perspectiveFov;
    var light = this.illumination;
    for (var key in this.meshes){
        if (this.meshes.hasOwnProperty(key)){
            var mesh = this.meshes[key];
            var scale = mesh.scale;
            var rotation = mesh.rotation;
            var position = mesh.position;
            var world_matrix = Matrix.scale(scale.x, scale.y, scale.z).multiply(
                Matrix.rotation(rotation.pitch, rotation.yaw, rotation.roll).multiply(
                    Matrix.translation(position.x, position.y, position.z)));
            for (var k = 0; k < mesh.faces.length; k++){
                var face = mesh.faces[k].face;
                var color = mesh.faces[k].color;
                var v1 = mesh.vertices[face[0]];
                var v2 = mesh.vertices[face[1]];
                var v3 = mesh.vertices[face[2]];

                // Calculate the normal
                // TODO: Can this be calculated just once, and then transformed into
                // camera space?
                var cam_to_vert = this.camera.position.subtract(v1.transform(world_matrix));
                var side1 = v2.transform(world_matrix).subtract(v1.transform(world_matrix));
                var side2 = v3.transform(world_matrix).subtract(v1.transform(world_matrix));
                var norm = side1.cross(side2);
                if (norm.magnitude() <= 0.00000001){
                    norm = norm;
                } else {
                    norm = norm.normalize();
                }
                // Backface culling.
                if (cam_to_vert.dot(norm) >= 0) {
                    var wvp_matrix = world_matrix.multiply(camera_matrix).multiply(projection_matrix);
                    var wv1 = v1.transform(wvp_matrix);
                    var wv2 = v2.transform(wvp_matrix);
                    var wv3 = v3.transform(wvp_matrix);
                    var draw = true;

                    // Draw surface normals
                    // var face_trans = Matrix.translation(wv1.x, wv1.y, v1.z);
                    // this.drawEdge(wv1, norm.scale(20).transform(face_trans), {'r':255,"g":255,"b":255})

                    // TODO: Fix frustum culling
                    // This is really stupid frustum culling... this can result in some faces not being
                    // drawn when they should, e.g. when a triangles vertices straddle the frustrum.
                    if (this.offscreen(wv1) && this.offscreen(wv2) && this.offscreen(wv3)){
                        draw = false;
                    }
                    if (draw){
                        var light_direction = light.subtract(v1.transform(world_matrix)).normalize();
                        var illumination_angle = norm.dot(light_direction);
                        color = color.lighten(illumination_angle/6);
                        this.fillTriangle(wv1, wv2, wv3, color.rgb);
                        //this.drawTriangle(wv1, wv2, wv3, color.rgb);
                    }
                }
            }
        }
    }
    this._back_buffer_ctx.putImageData(this._back_buffer_image, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this._back_buffer, 0, 0, this.canvas.width, this.canvas.height);
};
/** @method */
Scene.prototype.addMesh = function(mesh){
    this.meshes[mesh.name] = mesh;
};
/** @method */
Scene.prototype.removeMesh = function(mesh){
    delete this.meshes[mesh.name];
};
/** @method */
Scene.prototype.update = function(){
    if (this._key_count > 0){
        this.fire('keydown');
    }
    // TODO: Add keyup, mousedown, mousedrag, mouseup, etc.
    if (this._needs_update) {
        this.renderScene();
        this._needs_update = false;
    }
    this._anim_id = window.requestAnimationFrame(this.update.bind(this));
};

module.exports = Scene;

},{"../math/math.js":10,"../utility/keycodes.js":15,"./camera.js":6,"./events.js":7}],9:[function(_dereq_,module,exports){
var Color = _dereq_('../utility/color.js');

/**
 * A 3D triangle
 * @param {number} a     [description]
 * @param {number} b     [description]
 * @param {number} c     [description]
 * @param {string} color [description]
 */
function Face(a, b, c, color){
    this.face = [a, b, c];
    this.color = new Color(color);
}

module.exports = Face;
},{"../utility/color.js":14}],10:[function(_dereq_,module,exports){
var Vector = _dereq_('./vector.js');
var Mesh = _dereq_('./mesh.js');
var Matrix = _dereq_('./matrix.js');
var Face = _dereq_('./face.js');

var math = Object.create(null);

math.Vector = Vector;
math.Mesh = Mesh;
math.Matrix = Matrix;
math.Face = Face;

module.exports = math;
},{"./face.js":9,"./matrix.js":11,"./mesh.js":12,"./vector.js":13}],11:[function(_dereq_,module,exports){
/** 
 * 4x4 matrix.
 * @constructor
 */
function Matrix(){
    /** @type {Array.<number>} */
    for (var i=0; i<16; i++){
        this[i] = 0;
    }
    this.length = 16;
}
/**
 * Compare matrix with self for equality.
 * @method
 * @param {Matrix} matrix
 * @return {boolean}
 */
Matrix.prototype.equal = function(matrix){
    for (var i = 0, len = this.length; i < len; i++){
        if (this[i] !== matrix[i]){
            return false;
        }
    }
    return true;
};
/**
 * Add matrix to self.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.add = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] + matrix[i];
    }
    return new_matrix;
};
/**
 * Subtract matrix from self.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.subtract = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] - matrix[i];
    }
    return new_matrix;
};
/**
 * Multiply self by scalar.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.multiplyScalar = function(scalar){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] * scalar;
    }
    return new_matrix;
};
/**
 * Multiply self by matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.multiply = function(matrix){
    var new_matrix = new Matrix();
    new_matrix[0] = (this[0] * matrix[0]) + (this[1] * matrix[4]) + (this[2] * matrix[8]) + (this[3] * matrix[12]);
    new_matrix[1] = (this[0] * matrix[1]) + (this[1] * matrix[5]) + (this[2] * matrix[9]) + (this[3] * matrix[13]);
    new_matrix[2] = (this[0] * matrix[2]) + (this[1] * matrix[6]) + (this[2] * matrix[10]) + (this[3] * matrix[14]);
    new_matrix[3] = (this[0] * matrix[3]) + (this[1] * matrix[7]) + (this[2] * matrix[11]) + (this[3] * matrix[15]);
    new_matrix[4] = (this[4] * matrix[0]) + (this[5] * matrix[4]) + (this[6] * matrix[8]) + (this[7] * matrix[12]);
    new_matrix[5] = (this[4] * matrix[1]) + (this[5] * matrix[5]) + (this[6] * matrix[9]) + (this[7] * matrix[13]);
    new_matrix[6] = (this[4] * matrix[2]) + (this[5] * matrix[6]) + (this[6] * matrix[10]) + (this[7] * matrix[14]);
    new_matrix[7] = (this[4] * matrix[3]) + (this[5] * matrix[7]) + (this[6] * matrix[11]) + (this[7] * matrix[15]);
    new_matrix[8] = (this[8] * matrix[0]) + (this[9] * matrix[4]) + (this[10] * matrix[8]) + (this[11] * matrix[12]);
    new_matrix[9] = (this[8] * matrix[1]) + (this[9] * matrix[5]) + (this[10] * matrix[9]) + (this[11] * matrix[13]);
    new_matrix[10] = (this[8] * matrix[2]) + (this[9] * matrix[6]) + (this[10] * matrix[10]) + (this[11] * matrix[14]);
    new_matrix[11] = (this[8] * matrix[3]) + (this[9] * matrix[7]) + (this[10] * matrix[11]) + (this[11] * matrix[15]);
    new_matrix[12] = (this[12] * matrix[0]) + (this[13] * matrix[4]) + (this[14] * matrix[8]) + (this[15] * matrix[12]);
    new_matrix[13] = (this[12] * matrix[1]) + (this[13] * matrix[5]) + (this[14] * matrix[9]) + (this[15] * matrix[13]);
    new_matrix[14] = (this[12] * matrix[2]) + (this[13] * matrix[6]) + (this[14] * matrix[10]) + (this[15] * matrix[14]);
    new_matrix[15] = (this[12] * matrix[3]) + (this[13] * matrix[7]) + (this[14] * matrix[11]) + (this[15] * matrix[15]);
    return new_matrix;
};
/**
 * Negate self.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.negate = function(){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = -this[i];
    }
    return new_matrix;
};
/**
 * Transpose self.
 * @method
 * @return {Matrix}
 */
Matrix.prototype.transpose = function(){
    var new_matrix = new Matrix();
    new_matrix[0] = this[0];
    new_matrix[1] = this[4];
    new_matrix[2] = this[8];
    new_matrix[3] = this[12];
    new_matrix[4] = this[1];
    new_matrix[5] = this[5];
    new_matrix[6] = this[9];
    new_matrix[7] = this[13];
    new_matrix[8] = this[2];
    new_matrix[9] = this[6];
    new_matrix[10] = this[10];
    new_matrix[11] = this[14];
    new_matrix[12] = this[3];
    new_matrix[13] = this[7];
    new_matrix[14] = this[11];
    new_matrix[15] = this[15];
    return new_matrix;
};

/**
 * Constructs a rotation matrix, rotating by theta around the x-axis
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationX = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = 1;
    rotation_matrix[5] = cos;
    rotation_matrix[6] = -sin;
    rotation_matrix[9] = sin;
    rotation_matrix[10] = cos;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the y-axis
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationY = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = cos;
    rotation_matrix[2] = sin;
    rotation_matrix[5] = 1;
    rotation_matrix[8] = -sin;
    rotation_matrix[10] = cos;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the z-axis
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationZ = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = cos;
    rotation_matrix[1] = -sin;
    rotation_matrix[4] = sin;
    rotation_matrix[5] = cos;
    rotation_matrix[10] = 1;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the axis
 * @method
 * @static
 * @param {Vector} axis
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationAxis = function(axis, theta){
    var rotation_matrix = new Matrix();
    var u = axis.normalize();
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = u.x;
    var uy = u.y;
    var uz = u.z;
    var xy = ux * uy;
    var xz = ux * uz;
    var yz = uy * uz;
    rotation_matrix[0] = cos + ((ux*ux)*cos1);
    rotation_matrix[1] = (xy*cos1) - (uz*sin);
    rotation_matrix[2] = (xz*cos1)+(uy*sin);
    rotation_matrix[4] = (xy*cos1)+(uz*sin);
    rotation_matrix[5] = cos+((uy*uy)*cos1);
    rotation_matrix[6] = (yz*cos1)-(ux*sin);
    rotation_matrix[8] = (xz*cos1)-(uy*sin);
    rotation_matrix[9] = (yz*cos1)+(ux*sin);
    rotation_matrix[10] = cos + ((uz*uz)*cos1);
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix from pitch, yaw, and roll
 * @method
 * @static
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @return {Matrix}
 */
Matrix.rotation = function(pitch, yaw, roll){
    return Matrix.rotationX(roll).multiply(Matrix.rotationZ(yaw)).multiply(Matrix.rotationY(pitch));
};
/**
 * Constructs a translation matrix from x, y, and z distances
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.translation = function(xtrans, ytrans, ztrans){
    var translation_matrix = Matrix.identity();
    translation_matrix[12] = xtrans;
    translation_matrix[13] = ytrans;
    translation_matrix[14] = ztrans;
    return translation_matrix;
};
/**
 * Constructs a scaling matrix from x, y, and z scale
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.scale = function(xscale, yscale, zscale){
    var scaling_matrix = new Matrix();
    scaling_matrix[0] = xscale;
    scaling_matrix[5] = yscale;
    scaling_matrix[10] = zscale;
    scaling_matrix[15] = 1;
    return scaling_matrix;
};
/**
 * Constructs an identity matrix
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.identity = function(){
    var identity = new Matrix();
    identity[0] = 1;
    identity[5] = 1;
    identity[10] = 1;
    identity[15] = 1;
    return identity;
};
/**
 * Constructs a zero matrix
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.zero = function(){
    return new Matrix();
};
/**
 * Constructs a new matrix from an array
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.fromArray = function(arr){
    var new_matrix = new Matrix();
    for (var i = 0; i < 16; i++){
        new_matrix[i] = arr[i];
    }
    return new_matrix;
};

module.exports = Matrix;
},{}],12:[function(_dereq_,module,exports){
var Vector = _dereq_('./vector.js');
var Face = _dereq_('./face.js');

/**
 * @constructor
 * @param {string} name
 * @param {Array.<Vector>} vertices
 * @param {Array.<Face>} edges
 */
function Mesh(name, vertices, faces){
    this.name = name;
    this.vertices = vertices;
    this.faces = faces;
    this.position = new Vector(0, 0, 0);
    this.rotation = {'yaw': 0, 'pitch': 0, 'roll': 0};
    this.scale = {'x': 1, 'y': 1, 'z': 1};
}
Mesh.fromJSON = function(json){
    var vertices = [];
    var faces = [];
    for (var i = 0, len = json.vertices.length; i < len; i++){
        var vertex = json.vertices[i];
        vertices.push(new Vector(vertex[0], vertex[1], vertex[2]));
    }
    for (var j = 0, ln = json.faces.length; j < ln; j++){
        var face = json.faces[j];
        faces.push(new Face(face.face[0], face.face[1], face.face[2], face.color));
    }
    return new Mesh(json.name, vertices, faces);
};

module.exports = Mesh;

},{"./face.js":9,"./vector.js":13}],13:[function(_dereq_,module,exports){
/**
 * @constructor
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function Vector(x, y, z){
    if (typeof x === 'undefined' ||
        typeof y === 'undefined' ||
        typeof z === 'undefined'){
        throw new Error('Insufficient arguments.');
    } else {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
/**
 * Add vector to self.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.add = function(vector){
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
};
/**
 * Subtract vector from self.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.subtract = function(vector){
    return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
};
/**
 * Compare vector with self for equality
 * @method
 * @param {Vector} vector
 * @return {boolean}
 */
Vector.prototype.equal = function(vector){
    return this.x === vector.x && this.y === vector.y && this.z === vector.z;
};
/**
 * Find angle between two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.angle = function(vector){
    var a = this.normalize();
    var b = vector.normalize();
    var amag = a.magnitude();
    var bmag = b.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = a.dot(b) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return Math.acos(theta);
};
/**
 * Find the cos of the angle between two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.cosAngle = function(vector){
    var a = this.normalize();
    var b = vector.normalize();
    var amag = a.magnitude();
    var bmag = b.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = a.dot(b) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return theta;
};
/**
 * Find magnitude of a vector.
 * @method
 * @return {number}
 */
Vector.prototype.magnitude = function(){
    return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
};
/**
 * Find magnitude squared of a vector.
 * @method
 * @return {number}
 */
Vector.prototype.magnitudeSquared = function(){
    return (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
};
/**
 * Find dot product of self and vector.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.dot = function(vector){
    return (this.x * vector.x) + (this.y * vector.y) + (this.z * vector.z);
};
/**
 * Find cross product of self and vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.cross = function(vector){
    return new Vector(
        (this.y * vector.z) - (this.z * vector.y),
        (this.z * vector.x) - (this.x * vector.z),
        (this.x * vector.y) - (this.y * vector.x)
    );
};
/**
 * Normalize self.
 * @method
 * @return {Vector}
 * @throws {ZeroDivisionError}
 */
Vector.prototype.normalize = function(){
    var magnitude = this.magnitude();
    if (magnitude === 0) {
        return this;
    }
    return new Vector(this.x / magnitude, this.y / magnitude, this.z / magnitude);
};
/**
 * Scale self by scale.
 * @method
 * @param {number} scale
 * @return {Vector}
 */
Vector.prototype.scale = function(scale){
    return new Vector(this.x * scale, this.y * scale, this.z * scale);
};
/** @method */
Vector.prototype.negate = function(){
    return new Vector(-this.x, -this.y, -this.z);
};
/**
 * Project self onto vector
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.vectorProjection = function(vector){
    var mag = vector.magnitude();
    return vector.scale(this.dot(vector) / (mag * mag));
};
/**
 * Project self onto vector
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.scalarProjection = function(vector){
    return this.dot(vector) / vector.magnitude();
};
/**
 * Perform linear tranformation on self.
 * @method
 * @param {Matrix} transform_matrix
 * @return {Vector}
 */
Vector.prototype.transform = function(transform_matrix){
    var x = (this.x * transform_matrix[0]) + (this.y * transform_matrix[4]) + (this.z * transform_matrix[8]) + transform_matrix[12];
    var y = (this.x * transform_matrix[1]) + (this.y * transform_matrix[5]) + (this.z * transform_matrix[9]) + transform_matrix[13];
    var z = (this.x * transform_matrix[2]) + (this.y * transform_matrix[6]) + (this.z * transform_matrix[10]) + transform_matrix[14];
    var w = (this.x * transform_matrix[3]) + (this.y * transform_matrix[7]) + (this.z * transform_matrix[11]) + transform_matrix[15];
    return new Vector(x / w, y / w, z / w);
};
/**
 * Rotate self by theta around axis
 * @method
 * @param {Vector} axis
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotate = function(axis, theta){
    var u = axis.normalize();
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = u.x;
    var uy = u.y;
    var uz = u.z;
    var xy = u.x * u.y;
    var xz = u.x * u.z;
    var yz = u.y * u.z;
    var x = ((cos + ((ux*ux)*cos1)) * this.x) + (((xy*cos1) - (uz*sin)) * this.y) + (((xz*cos1)+(uy*sin)) * this.z);
    var y = (((xy*cos1)+(uz*sin)) * this.x) + ((cos+((uy*uy)*cos1)) * this.y) + (((yz*cos1)-(ux*sin)) * this.z);
    var z = (((xz*cos1)-(uy*sin)) * this.x) + (((yz*cos1)+(ux*sin)) * this.y) + ((cos + ((ux*ux)*cos1)) * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate self by theta around x-axis
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateX = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = this.x;
    var y = (cos * this.y) - (sin * this.z);
    var z = (sin * this.y) + (cos * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate self by theta around y-axis
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateY = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos *this.x) + (sin * this.z);
    var y = this.y;
    var z = -(sin * this.x) + (cos * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate self by theta around z-axis
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateZ = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos * this.x) - (sin * this.y);
    var y = (sin * this.x) + (cos * this.y);
    var z = this.z;
    return new Vector(x, y, z);
};
/**
 * Rotate self by pitch, yaw, roll
 * @method
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @return {Vector}
 */
Vector.prototype.rotatePitchYawRoll = function(pitch_amnt, yaw_amnt, roll_amnt) {
    return this.rotateX(roll_amnt).rotateY(pitch_amnt).rotateZ(yaw_amnt);
};

module.exports = Vector;
},{}],14:[function(_dereq_,module,exports){
var parseColor, cache;
/**
 * A color with both rgb and hsl representations.
 * @constructor
 * @param {string} color Any legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 */
function Color(color){
    var parsed_color = {};
    if (color in cache){
        parsed_color = cache[color];
    } else {
        parsed_color = parseColor(color);
        cache[color] = parsed_color;
    }
    var hsl = Color.rgbToHsl(parsed_color.r, parsed_color.g, parsed_color.b);
    this.rgb = {'r': parsed_color.r, 'g': parsed_color.g, 'b': parsed_color.b};
    this.hsl = {'h': hsl.h, 's': hsl.s, 'l': hsl.l};
    this.alpha = parsed_color.a || 1;
}
/**
 * Lighten a color by percent amount.
 * @method
 * @param  {number} percent
 * @return {Color}
 */
Color.prototype.lighten = function(percent){
    var hsl = this.hsl;
    var lum = hsl.l + percent;
    if (lum > 1){
        lum = 1;
    }
    var lighter = Color.hslToRgb(hsl.h, hsl.s, lum);
    return new Color("rgb(" + Math.floor(lighter.r) + "," + Math.floor(lighter.g) + "," + Math.floor(lighter.b) + ")");
};
/**
 * Darken a color by percent amount.
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
    var darker = Color.hslToRgb(hsl.h, hsl.s, lum);
    return new Color("rgb(" + Math.floor(darker.r) + "," + Math.floor(darker.g) + "," + Math.floor(darker.b) + ")");
};
Color.hslToRgb = function(h, s, l){
    function _v(m1, m2, hue){
        hue = hue % 1;
        if (hue < 0){hue+=1;}
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
    if (s === 0){
        return {'r': l, 'g': l, 'b': l};
    }
    if (l <= 0.5){
        m2 = l * (1+s);
    }
    else{
        m2 = l+s-(l*s);
    }
    var m1 = 2*l - m2;
    return {'r': _v(m1, m2, h+(1/3))*255, 'g': _v(m1, m2, h)*255, 'b': _v(m1, m2, h-(1/3))*255};
};
Color.rgbToHsl = function(r, g, b){
    r = r / 255;
    g = g / 255;
    b = b / 255;
    var maxc = Math.max(r, g, b);
    var minc = Math.min(r, g, b);
    var l = (minc+maxc)/2;
    var h, s;
    if (minc === maxc){
        return {'h': 0, 's': 0, 'l': l};
    }
    if (l <= 0.5){
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
    return {'h': h, 's': s, 'l': l};
};

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
    var div = document.createElement('div');
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
    "black": { "r": 0, "g": 0, "b": 0, "h": 0, "s": 0, "l": 0, "a": 1},
    "silver": { "r": 192, "g": 192, "b": 192, "h": 0, "s": 0, "l": 0.7529411764705882, "a": 1},
    "gray": { "r": 128, "g": 128, "b": 128, "h": 0, "s": 0, "l": 0.5019607843137255, "a": 1},
    "white": { "r": 255, "g": 255, "b": 255, "h": 0, "s": 0, "l": 1, "a": 1},
    "maroon": {"r": 128, "g": 0, "b": 0, "h": 0, "s": 1, "l": 0.25098039215686274, "a": 1},
    "red": {"r": 255, "g": 0, "b": 0, "h": 0, "s": 1, "l": 0.5, "a": 1},
    "purple": {"r": 128, "g": 0, "b": 128, "h": 0.8333333333333334, "s": 1, "l": 0.25098039215686274, "a": 1},
    "fuchsia": {"r": 255, "g": 0, "b": 255, "h": 0.8333333333333334, "s": 1, "l": 0.5, "a": 1},
    "green": {"r": 0, "g": 128, "b": 0, "h": 0.3333333333333333, "s": 1, "l": 0.25098039215686274, "a": 1},
    "lime": {"r": 0, "g": 255, "b": 0, "h": 0.3333333333333333, "s": 1, "l": 0.5, "a": 1},
    "olive": {"r": 128, "g": 128, "b": 0, "h": 0.16666666666666666, "s": 1, "l": 0.25098039215686274, "a": 1},
    "yellow": {"r": 255, "g": 255, "b": 0, "h": 0.16666666666666666, "s": 1, "l": 0.5, "a": 1},
    "navy": {"r": 0, "g": 0, "b": 128, "h": 0.6666666666666666, "s": 1, "l": 0.25098039215686274, "a": 1},
    "blue": {"r": 0, "g": 0, "b": 255, "h": 0.6666666666666666, "s": 1, "l": 0.5, "a": 1},
    "teal": {"r": 0, "g": 128, "b": 128, "h": 0.5, "s": 1, "l": 0.25098039215686274, "a": 1},
    "aqua": {"r": 0, "g": 255, "b": 255, "h": 0.5, "s": 1, "l": 0.5, "a": 1},
    "orange": {"r": 255, "g": 165, "b": 0, "h": 0.10784313725490197, "s": 1, "l": 0.5, "a": 1},
    "aliceblue": {"r": 240, "g": 248, "b": 255, "h": 0.5777777777777778, "s": 1, "l": 0.9705882352941176, "a": 1},
    "antiquewhite": {"r": 250, "g": 235, "b": 215, "h": 0.09523809523809519, "s": 0.7777777777777779, "l": 0.9117647058823529, "a": 1},
    "aquamarine": {"r": 127, "g": 255, "b": 212, "h": 0.4440104166666667, "s": 1, "l": 0.7490196078431373, "a": 1},
    "azure": {"r": 240, "g": 255, "b": 255, "h": 0.5, "s": 1, "l": 0.9705882352941176, "a": 1},
    "beige": {"r": 245, "g": 245, "b": 220, "h": 0.16666666666666666, "s": 0.555555555555556, "l": 0.911764705882353, "a": 1},
    "bisque": {"r": 255, "g": 228, "b": 196, "h": 0.09039548022598871, "s": 1, "l": 0.884313725490196, "a": 1},
    "blanchedalmond": {"r": 255, "g": 235, "b": 205, "h": 0.09999999999999994, "s": 1, "l": 0.9019607843137255, "a": 1},
    "blueviolet": {"r": 138, "g": 43, "b": 226, "h": 0.7531876138433514, "s": 0.7593360995850621, "l": 0.5274509803921569, "a": 1},
    "brown": {"r": 165, "g": 42, "b": 42, "h": 0, "s": 0.5942028985507247, "l": 0.40588235294117647, "a": 1},
    "burlywood": {"r": 222, "g": 184, "b": 135, "h": 0.09386973180076626, "s": 0.5686274509803922, "l": 0.7, "a": 1},
    "cadetblue": {"r": 95, "g": 158, "b": 160, "h": 0.5051282051282051, "s": 0.2549019607843137, "l": 0.5, "a": 1},
    "chartreuse": {"r": 127, "g": 255, "b": 0, "h": 0.2503267973856209, "s": 1, "l": 0.5, "a": 1},
    "chocolate": {"r": 210, "g": 105, "b": 30, "h": 0.06944444444444443, "s": 0.7499999999999999, "l": 0.47058823529411764, "a": 1},
    "coral": {"r": 255, "g": 127, "b": 80, "h": 0.04476190476190476, "s": 1, "l": 0.6568627450980392, "a": 1},
    "cornflowerblue": {"r": 100, "g": 149, "b": 237, "h": 0.6070559610705596, "s": 0.7919075144508672, "l": 0.6607843137254902, "a": 1},
    "cornsilk": {"r": 255, "g": 248, "b": 220, "h": 0.1333333333333333, "s": 1, "l": 0.9313725490196079, "a": 1},
    "crimson": {"r": 220, "g": 20, "b": 60, "h": 0.9666666666666667, "s": 0.8333333333333335, "l": 0.47058823529411764, "a": 1},
    "darkblue": {"r": 0, "g": 0, "b": 139, "h": 0.6666666666666666, "s": 1, "l": 0.2725490196078431, "a": 1},
    "darkcyan": {"r": 0, "g": 139, "b": 139, "h": 0.5, "s": 1, "l": 0.2725490196078431, "a": 1},
    "darkgoldenrod": {"r": 184, "g": 134, "b": 11, "h": 0.1184971098265896, "s": 0.8871794871794872, "l": 0.38235294117647056, "a": 1},
    "darkgray": { "r": 169, "g": 169, "b": 169, "h": 0, "s": 0, "l": 0.6627450980392157, "a": 1},
    "darkgreen": {"r": 0, "g": 100, "b": 0, "h": 0.3333333333333333, "s": 1, "l": 0.19607843137254902, "a": 1},
    "darkgrey": { "r": 169, "g": 169, "b": 169, "h": 0, "s": 0, "l": 0.6627450980392157, "a": 1},
    "darkkhaki": {"r": 189, "g": 183, "b": 107, "h": 0.15447154471544713, "s": 0.38317757009345804, "l": 0.5803921568627451, "a": 1},
    "darkmagenta": {"r": 139, "g": 0, "b": 139, "h": 0.8333333333333334, "s": 1, "l": 0.2725490196078431, "a": 1},
    "darkolivegreen": {"r": 85, "g": 107, "b": 47, "h": 0.22777777777777777, "s": 0.3896103896103896, "l": 0.3019607843137255, "a": 1},
    "darkorange": {"r": 255, "g": 140, "b": 0, "h": 0.09150326797385622, "s": 1, "l": 0.5, "a": 1},
    "darkorchid": {"r": 153, "g": 50, "b": 204, "h": 0.7781385281385281, "s": 0.6062992125984252, "l": 0.4980392156862745, "a": 1},
    "darkred": {"r": 139, "g": 0, "b": 0, "h": 0, "s": 1, "l": 0.2725490196078431, "a": 1},
    "darksalmon": {"r": 233, "g": 150, "b": 122, "h": 0.04204204204204204, "s": 0.7161290322580643, "l": 0.696078431372549, "a": 1},
    "darkseagreen": {"r": 143, "g": 188, "b": 143, "h": 0.3333333333333333, "s": 0.2513966480446928, "l": 0.6490196078431373, "a": 1},
    "darkslateblue": {"r": 72, "g": 61, "b": 139, "h": 0.69017094017094, "s": 0.3899999999999999, "l": 0.39215686274509803, "a": 1},
    "darkslategray": {"r": 47, "g": 79, "b": 79, "h": 0.5, "s": 0.25396825396825395, "l": 0.24705882352941178, "a": 1},
    "darkslategrey": {"r": 47, "g": 79, "b": 79, "h": 0.5, "s": 0.25396825396825395, "l": 0.24705882352941178, "a": 1},
    "darkturquoise": {"r": 0, "g": 206, "b": 209, "h": 0.5023923444976076, "s": 1, "l": 0.40980392156862744, "a": 1},
    "darkviolet": {"r": 148, "g": 0, "b": 211, "h": 0.7835703001579778, "s": 1, "l": 0.4137254901960784, "a": 1},
    "deeppink": {"r": 255, "g": 20, "b": 147, "h": 0.9099290780141844, "s": 1, "l": 0.5392156862745098, "a": 1},
    "deepskyblue": {"r": 0, "g": 191, "b": 255, "h": 0.5418300653594771, "s": 1, "l": 0.5, "a": 1},
    "dimgray": { "r": 105, "g": 105, "b": 105, "h": 0, "s": 0, "l": 0.4117647058823529, "a": 1},
    "dimgrey": { "r": 105, "g": 105, "b": 105, "h": 0, "s": 0, "l": 0.4117647058823529, "a": 1},
    "dodgerblue": {"r": 30, "g": 144, "b": 255, "h": 0.5822222222222222, "s": 1, "l": 0.5588235294117647, "a": 1},
    "firebrick": {"r": 178, "g": 34, "b": 34, "h": 0, "s": 0.679245283018868, "l": 0.4156862745098039, "a": 1},
    "floralwhite": {"r": 255, "g": 250, "b": 240, "h": 0.11111111111111101, "s": 1, "l": 0.9705882352941176, "a": 1},
    "forestgreen": {"r": 34, "g": 139, "b": 34, "h": 0.3333333333333333, "s": 0.6069364161849712, "l": 0.33921568627450976, "a": 1},
    "gainsboro": { "r": 220, "g": 220, "b": 220, "h": 0, "s": 0, "l": 0.8627450980392157, "a": 1},
    "ghostwhite": {"r": 248, "g": 248, "b": 255, "h": 0.6666666666666666, "s": 1, "l": 0.9862745098039216, "a": 1},
    "gold": {"r": 255, "g": 215, "b": 0, "h": 0.14052287581699346, "s": 1, "l": 0.5, "a": 1},
    "goldenrod": {"r": 218, "g": 165, "b": 32, "h": 0.11917562724014337, "s": 0.744, "l": 0.49019607843137253, "a": 1},
    "greenyellow": {"r": 173, "g": 255, "b": 47, "h": 0.23237179487179485, "s": 1, "l": 0.592156862745098, "a": 1},
    "grey": { "r": 128, "g": 128, "b": 128, "h": 0, "s": 0, "l": 0.5019607843137255, "a": 1},
    "honeydew": {"r": 240, "g": 255, "b": 240, "h": 0.3333333333333333, "s": 1, "l": 0.9705882352941176, "a": 1},
    "hotpink": {"r": 255, "g": 105, "b": 180, "h": 0.9166666666666666, "s": 1, "l": 0.7058823529411764, "a": 1},
    "indianred": {"r": 205, "g": 92, "b": 92, "h": 0, "s": 0.5305164319248827, "l": 0.5823529411764706, "a": 1},
    "indigo": {"r": 75, "g": 0, "b": 130, "h": 0.7628205128205128, "s": 1, "l": 0.2549019607843137, "a": 1},
    "ivory": {"r": 255, "g": 255, "b": 240, "h": 0.16666666666666666, "s": 1, "l": 0.9705882352941176, "a": 1},
    "khaki": {"r": 240, "g": 230, "b": 140, "h": 0.15, "s": 0.7692307692307692, "l": 0.7450980392156863, "a": 1},
    "lavender": {"r": 230, "g": 230, "b": 250, "h": 0.6666666666666666, "s": 0.6666666666666666, "l": 0.9411764705882353, "a": 1},
    "lavenderblush": {"r": 255, "g": 240, "b": 245, "h": 0.9444444444444443, "s": 1, "l": 0.9705882352941176, "a": 1},
    "lawngreen": {"r": 124, "g": 252, "b": 0, "h": 0.25132275132275134, "s": 1, "l": 0.49411764705882355, "a": 1},
    "lemonchiffon": {"r": 255, "g": 250, "b": 205, "h": 0.14999999999999997, "s": 1, "l": 0.9019607843137255, "a": 1},
    "lightblue": {"r": 173, "g": 216, "b": 230, "h": 0.5409356725146198, "s": 0.5327102803738316, "l": 0.7901960784313726, "a": 1},
    "lightcoral": {"r": 240, "g": 128, "b": 128, "h": 0, "s": 0.7887323943661971, "l": 0.7215686274509804, "a": 1},
    "lightcyan": {"r": 224, "g": 255, "b": 255, "h": 0.5, "s": 1, "l": 0.9392156862745098, "a": 1},
    "lightgoldenrodyellow": {"r": 250, "g": 250, "b": 210, "h": 0.16666666666666666, "s": 0.8000000000000002, "l": 0.9019607843137254, "a": 1},
    "lightgray": { "r": 211, "g": 211, "b": 211, "h": 0, "s": 0, "l": 0.8274509803921568, "a": 1},
    "lightgreen": {"r": 144, "g": 238, "b": 144, "h": 0.3333333333333333, "s": 0.734375, "l": 0.7490196078431373, "a": 1},
    "lightgrey": { "r": 211, "g": 211, "b": 211, "h": 0, "s": 0, "l": 0.8274509803921568, "a": 1},
    "lightpink": {"r": 255, "g": 182, "b": 193, "h": 0.9748858447488584, "s": 1, "l": 0.8568627450980393, "a": 1},
    "lightsalmon": {"r": 255, "g": 160, "b": 122, "h": 0.047619047619047596, "s": 1, "l": 0.7392156862745098, "a": 1},
    "lightseagreen": {"r": 32, "g": 178, "b": 170, "h": 0.49086757990867574, "s": 0.6952380952380952, "l": 0.4117647058823529, "a": 1},
    "lightskyblue": {"r": 135, "g": 206, "b": 250, "h": 0.5637681159420289, "s": 0.92, "l": 0.7549019607843137, "a": 1},
    "lightslategray": {"r": 119, "g": 136, "b": 153, "h": 0.5833333333333334, "s": 0.14285714285714285, "l": 0.5333333333333333, "a": 1},
    "lightslategrey": {"r": 119, "g": 136, "b": 153, "h": 0.5833333333333334, "s": 0.14285714285714285, "l": 0.5333333333333333, "a": 1},
    "lightsteelblue": {"r": 176, "g": 196, "b": 222, "h": 0.5942028985507246, "s": 0.41071428571428575, "l": 0.7803921568627451, "a": 1},
    "lightyellow": {"r": 255, "g": 255, "b": 224, "h": 0.16666666666666666, "s": 1, "l": 0.9392156862745098, "a": 1},
    "limegreen": {"r": 50, "g": 205, "b": 50, "h": 0.3333333333333333, "s": 0.607843137254902, "l": 0.5, "a": 1},
    "linen": {"r": 250, "g": 240, "b": 230, "h": 0.08333333333333333, "s": 0.6666666666666666, "l": 0.9411764705882353, "a": 1},
    "mediumaquamarine": {"r": 102, "g": 205, "b": 170, "h": 0.4433656957928802, "s": 0.5073891625615764, "l": 0.6019607843137256, "a": 1},
    "mediumblue": {"r": 0, "g": 0, "b": 205, "h": 0.6666666666666666, "s": 1, "l": 0.4019607843137255, "a": 1},
    "mediumorchid": {"r": 186, "g": 85, "b": 211, "h": 0.8002645502645502, "s": 0.5887850467289718, "l": 0.580392156862745, "a": 1},
    "mediumpurple": {"r": 147, "g": 112, "b": 219, "h": 0.721183800623053, "s": 0.5977653631284916, "l": 0.6490196078431372, "a": 1},
    "mediumseagreen": {"r": 60, "g": 179, "b": 113, "h": 0.4075630252100841, "s": 0.49790794979079495, "l": 0.46862745098039216, "a": 1},
    "mediumslateblue": {"r": 123, "g": 104, "b": 238, "h": 0.6902985074626865, "s": 0.7976190476190477, "l": 0.6705882352941177, "a": 1},
    "mediumspringgreen": {"r": 0, "g": 250, "b": 154, "h": 0.436, "s": 1, "l": 0.49019607843137253, "a": 1},
    "mediumturquoise": {"r": 72, "g": 209, "b": 204, "h": 0.49391727493917276, "s": 0.5982532751091703, "l": 0.5509803921568628, "a": 1},
    "mediumvioletred": {"r": 199, "g": 21, "b": 133, "h": 0.8951310861423221, "s": 0.809090909090909, "l": 0.43137254901960786, "a": 1},
    "midnightblue": {"r": 25, "g": 25, "b": 112, "h": 0.6666666666666666, "s": 0.635036496350365, "l": 0.26862745098039215, "a": 1},
    "mintcream": {"r": 245, "g": 255, "b": 250, "h": 0.41666666666666646, "s": 1, "l": 0.9803921568627452, "a": 1},
    "mistyrose": {"r": 255, "g": 228, "b": 225, "h": 0.016666666666666757, "s": 1, "l": 0.9411764705882353, "a": 1},
    "moccasin": {"r": 255, "g": 228, "b": 181, "h": 0.10585585585585588, "s": 1, "l": 0.8549019607843138, "a": 1},
    "navajowhite": {"r": 255, "g": 222, "b": 173, "h": 0.09959349593495936, "s": 1, "l": 0.8392156862745098, "a": 1},
    "oldlace": {"r": 253, "g": 245, "b": 230, "h": 0.10869565217391304, "s": 0.8518518518518523, "l": 0.9470588235294117, "a": 1},
    "olivedrab": {"r": 107, "g": 142, "b": 35, "h": 0.22118380062305296, "s": 0.6045197740112994, "l": 0.34705882352941175, "a": 1},
    "orangered": {"r": 255, "g": 69, "b": 0, "h": 0.04509803921568626, "s": 1, "l": 0.5, "a": 1},
    "orchid": {"r": 218, "g": 112, "b": 214, "h": 0.8396226415094339, "s": 0.5888888888888889, "l": 0.6470588235294117, "a": 1},
    "palegoldenrod": {"r": 238, "g": 232, "b": 170, "h": 0.15196078431372548, "s": 0.6666666666666667, "l": 0.8, "a": 1},
    "palegreen": {"r": 152, "g": 251, "b": 152, "h": 0.3333333333333333, "s": 0.9252336448598131, "l": 0.7901960784313725, "a": 1},
    "paleturquoise": {"r": 175, "g": 238, "b": 238, "h": 0.5, "s": 0.6494845360824743, "l": 0.8098039215686275, "a": 1},
    "palevioletred": {"r": 219, "g": 112, "b": 147, "h": 0.9454828660436138, "s": 0.5977653631284916, "l": 0.6490196078431372, "a": 1},
    "papayawhip": {"r": 255, "g": 239, "b": 213, "h": 0.10317460317460315, "s": 1, "l": 0.9176470588235295, "a": 1},
    "peachpuff": {"r": 255, "g": 218, "b": 185, "h": 0.07857142857142856, "s": 1, "l": 0.8627450980392157, "a": 1},
    "peru": {"r": 205, "g": 133, "b": 63, "h": 0.08215962441314555, "s": 0.5867768595041323, "l": 0.5254901960784314, "a": 1},
    "pink": {"r": 255, "g": 192, "b": 203, "h": 0.9708994708994709, "s": 1, "l": 0.8764705882352941, "a": 1},
    "plum": {"r": 221, "g": 160, "b": 221, "h": 0.8333333333333334, "s": 0.4728682170542637, "l": 0.7470588235294118, "a": 1},
    "powderblue": {"r": 176, "g": 224, "b": 230, "h": 0.5185185185185186, "s": 0.5192307692307692, "l": 0.7960784313725491, "a": 1},
    "rosybrown": {"r": 188, "g": 143, "b": 143, "h": 0, "s": 0.2513966480446928, "l": 0.6490196078431373, "a": 1},
    "royalblue": {"r": 65, "g": 105, "b": 225, "h": 0.625, "s": 0.7272727272727272, "l": 0.5686274509803921, "a": 1},
    "saddlebrown": {"r": 139, "g": 69, "b": 19, "h": 0.06944444444444443, "s": 0.759493670886076, "l": 0.3098039215686274, "a": 1},
    "salmon": {"r": 250, "g": 128, "b": 114, "h": 0.017156862745098016, "s": 0.9315068493150683, "l": 0.7137254901960784, "a": 1},
    "sandybrown": {"r": 244, "g": 164, "b": 96, "h": 0.07657657657657659, "s": 0.8705882352941179, "l": 0.6666666666666667, "a": 1},
    "seagreen": {"r": 46, "g": 139, "b": 87, "h": 0.4068100358422939, "s": 0.5027027027027026, "l": 0.3627450980392157, "a": 1},
    "seashell": {"r": 255, "g": 245, "b": 238, "h": 0.0686274509803922, "s": 1, "l": 0.9666666666666667, "a": 1},
    "sienna": {"r": 160, "g": 82, "b": 45, "h": 0.053623188405797106, "s": 0.5609756097560975, "l": 0.4019607843137255, "a": 1},
    "skyblue": {"r": 135, "g": 206, "b": 235, "h": 0.5483333333333333, "s": 0.714285714285714, "l": 0.7254901960784313, "a": 1},
    "slateblue": {"r": 106, "g": 90, "b": 205, "h": 0.6898550724637681, "s": 0.5348837209302326, "l": 0.5784313725490197, "a": 1},
    "slategray": {"r": 112, "g": 128, "b": 144, "h": 0.5833333333333334, "s": 0.12598425196850394, "l": 0.5019607843137255, "a": 1},
    "slategrey": {"r": 112, "g": 128, "b": 144, "h": 0.5833333333333334, "s": 0.12598425196850394, "l": 0.5019607843137255, "a": 1},
    "snow": {"r": 255, "g": 250, "b": 250, "h": 0, "s": 1, "l": 0.9901960784313726, "a": 1},
    "springgreen": {"r": 0, "g": 255, "b": 127, "h": 0.41633986928104577, "s": 1, "l": 0.5, "a": 1},
    "steelblue": {"r": 70, "g": 130, "b": 180, "h": 0.5757575757575758, "s": 0.44, "l": 0.4901960784313726, "a": 1},
    "tan": {"r": 210, "g": 180, "b": 140, "h": 0.09523809523809527, "s": 0.4374999999999999, "l": 0.6862745098039216, "a": 1},
    "thistle": {"r": 216, "g": 191, "b": 216, "h": 0.8333333333333334, "s": 0.24271844660194178, "l": 0.7980392156862746, "a": 1},
    "tomato": {"r": 255, "g": 99, "b": 71, "h": 0.025362318840579694, "s": 1, "l": 0.6392156862745098, "a": 1},
    "turquoise": {"r": 64, "g": 224, "b": 208, "h": 0.48333333333333334, "s": 0.7207207207207207, "l": 0.5647058823529412, "a": 1},
    "violet": {"r": 238, "g": 130, "b": 238, "h": 0.8333333333333334, "s": 0.7605633802816902, "l": 0.7215686274509804, "a": 1},
    "wheat": {"r": 245, "g": 222, "b": 179, "h": 0.1085858585858586, "s": 0.7674418604651168, "l": 0.8313725490196078, "a": 1},
    "whitesmoke": { "r": 245, "g": 245, "b": 245, "h": 0, "s": 0, "l": 0.9607843137254902, "a": 1},
    "yellowgreen": {"r": 154, "g": 205, "b": 50, "h": 0.22150537634408604, "s": 0.607843137254902, "l": 0.5, "a": 1}
};

module.exports = Color;
},{}],15:[function(_dereq_,module,exports){
/** 
 * @constant
 * @type {Object.<string, number>} 
 */
var KEYCODES = {
    'backspace' : 8,
    'tab' : 9,
    'enter' : 13,
    'shift' : 16,
    'ctrl' : 17,
    'alt' : 18,
    'pause_break' : 19,
    'caps_lock' : 20,
    'escape' : 27,
    'page_up' : 33,
    'page down' : 34,
    'end' : 35,
    'home' : 36,
    'left_arrow' : 37,
    'up_arrow' : 38,
    'right_arrow' : 39,
    'down_arrow' : 40,
    'insert' : 45,
    'delete' : 46,
    '0' : 48,
    '1' : 49,
    '2' : 50,
    '3' : 51,
    '4' : 52,
    '5' : 53,
    '6' : 54,
    '7' : 55,
    '8' : 56,
    '9' : 57,
    'a' : 65,
    'b' : 66,
    'c' : 67,
    'd' : 68,
    'e' : 69,
    'f' : 70,
    'g' : 71,
    'h' : 72,
    'i' : 73,
    'j' : 74,
    'k' : 75,
    'l' : 76,
    'm' : 77,
    'n' : 78,
    'o' : 79,
    'p' : 80,
    'q' : 81,
    'r' : 82,
    's' : 83,
    't' : 84,
    'u' : 85,
    'v' : 86,
    'w' : 87,
    'x' : 88,
    'y' : 89,
    'z' : 90,
    'left_window key' : 91,
    'right_window key' : 92,
    'select_key' : 93,
    'numpad 0' : 96,
    'numpad 1' : 97,
    'numpad 2' : 98,
    'numpad 3' : 99,
    'numpad 4' : 100,
    'numpad 5' : 101,
    'numpad 6' : 102,
    'numpad 7' : 103,
    'numpad 8' : 104,
    'numpad 9' : 105,
    'multiply' : 106,
    'add' : 107,
    'subtract' : 109,
    'decimal point' : 110,
    'divide' : 111,
    'f1' : 112,
    'f2' : 113,
    'f3' : 114,
    'f4' : 115,
    'f5' : 116,
    'f6' : 117,
    'f7' : 118,
    'f8' : 119,
    'f9' : 120,
    'f10' : 121,
    'f11' : 122,
    'f12' : 123,
    'num_lock' : 144,
    'scroll_lock' : 145,
    'semi_colon' : 186,
    'equal_sign' : 187,
    'comma' : 188,
    'dash' : 189,
    'period' : 190,
    'forward_slash' : 191,
    'grave_accent' : 192,
    'open_bracket' : 219,
    'backslash' : 220,
    'closebracket' : 221,
    'single_quote' : 222
};

module.exports = KEYCODES;
},{}],16:[function(_dereq_,module,exports){
_dereq_('./../tests/data/colors.js');
_dereq_('./../tests/engine/camera.js');
_dereq_('./../tests/engine/scene.js');
_dereq_('./../tests/math/face.js');
_dereq_('./../tests/math/matrix.js');
_dereq_('./../tests/math/mesh.js');
_dereq_('./../tests/math/vector.js');
_dereq_('./../tests/utility/color.js');

},{"./../tests/data/colors.js":17,"./../tests/engine/camera.js":18,"./../tests/engine/scene.js":19,"./../tests/math/face.js":20,"./../tests/math/matrix.js":21,"./../tests/math/mesh.js":22,"./../tests/math/vector.js":23,"./../tests/utility/color.js":24}],17:[function(_dereq_,module,exports){
var colorlist = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"];

module.exports = colorlist;
},{}],18:[function(_dereq_,module,exports){
var Camera = _dereq_('../../src/engine/camera.js');
var assert = _dereq_("assert");

suite('Camera', function(){
    var camera;
    setup(function(){
        camera = new Camera(600, 400);
    })
    suite('properties', function(){
        test('height', function(){
            assert.ok(camera.height);
            assert.equal(camera.height, 400);
        });
    });
    suite('methods', function(){

    });
});
},{"../../src/engine/camera.js":6,"assert":1}],19:[function(_dereq_,module,exports){
var Scene = _dereq_('../../src/engine/scene.js');
var assert = _dereq_("assert");

suite('Scene', function(){
    setup(function(){
        //var scene = new Scene({canvas_id: 'wireframe', width:600, height:400});
    });
    suite('properties', function(){
        test('height', function(){
            // assert.equal(scene.height, 400);
        });
    });
    suite('methods', function(){
        
    })
});
},{"../../src/engine/scene.js":8,"assert":1}],20:[function(_dereq_,module,exports){
var Face = _dereq_('../../src/math/face.js');
var assert = _dereq_("assert");

var face;

suite('Face', function(){
    var face;
    setup(function(){
        face = new Face(0, 1, 2, "red");
    });
    suite('properties', function(){
        test('color', function(){
            assert.equal(face.color.rgb.r, 255);
        });
    });
    suite('methods', function(){

    });
});
},{"../../src/math/face.js":9,"assert":1}],21:[function(_dereq_,module,exports){
var Matrix = _dereq_('../../src/math/matrix.js');
var Vector = _dereq_('../../src/math/vector.js');
var assert = _dereq_("assert");

suite('Matrix', function(){
    var zero, zero2, zero3, identity, identity2, identity3, ones, m0, m1, m2, m3, m4, m5, m6, m7, angles;
    setup(function(){
        angles = [0, Math.PI / 2, Math.PI, 3*Math.PI / 2, Math.PI / 2];
        zero = Matrix.zero();
        zero2 = new Matrix();
        zero3 = Matrix.fromArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        identity = Matrix.identity();
        identity2 = new Matrix();
        identity3 = Matrix.fromArray([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
        identity2[0] = 1;
        identity2[5] = 1;
        identity2[10] = 1;
        identity2[15] = 1;
        ones = new Matrix();
        m0 = new Matrix();
        m1 = new Matrix();
        m2 = new Matrix();
        m3 = new Matrix();
        m4 = new Matrix();
        m4[0] = 0;
        m4[1] = 1;
        m4[2] = 1;
        m4[3] = 2;
        m4[4] = 3;
        m4[5] = 5;
        m4[6] = 8;
        m4[7] = 13;
        m4[8] = 21;
        m4[9] = 34;
        m4[10] = 55;
        m4[11] = 89;
        m4[12] = 144;
        m4[13] = 233;
        m4[14] = 377;
        m4[15] = 610;
        m5 = Matrix.fromArray([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]);
        m6 = Matrix.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8]);
        m7 = Matrix.fromArray([34, 44, 54, 64, 82, 108, 134, 160, 34, 44, 54, 64, 82, 108, 134, 160]);
        for (var i = 0; i < 16; i++){
            ones[i] = 1;
            m0[i] = i;
            m1[i] = i+1;
            m2[i] = i+2;
            m3[i] = i*2;
        }
    });
    suite('properties', function(){
        test('length', function(){
            assert.equal(zero.length, 16);
            assert.equal(zero2.length, 16);
            assert.equal(zero3.length, 16);
            assert.equal(identity.length, 16);
            assert.equal(identity2.length, 16);
            assert.equal(m1.length, 16);
            assert.equal(m2.length, 16);
            assert.equal(m3.length, 16);
            assert.equal(m4.length, 16);
            assert.equal(m5.length, 16);
        });
    });
    suite('methods', function(){
        test('equal', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(zero.equal(zero2));
            assert.ok(zero.equal(zero3));
            assert.ok(zero2.equal(zero3));
            assert.ok(!identity.equal(zero));
            assert.ok(m4.equal(m5));
            assert.ok(!m0.equal(m1));
            assert.ok(!m0.equal(m2));
            assert.ok(!m0.equal(m3));
        });
        test('add', function(){
            var t1 = zero.add(m1);
            var t2 = m0.add(ones);
            var t3 = m0.add(ones).add(ones);
            assert.ok(t1.equal(m1));
            assert.ok(t2.equal(m1));
            assert.ok(t3.equal(m2));
        });
        test('subtract', function(){
            var t1 = m4.subtract(m5);
            var t2 = m1.subtract(ones);
            var t3 = m2.subtract(m1);
            assert.ok(t1.equal(zero));
            assert.ok(t2.equal(m0));
            assert.ok(t3.equal(ones));
        });
        test('multiplyScalar', function(){
            var t1 = m0.multiplyScalar(2);
            var t2 = zero.multiplyScalar(20);
            var t3 = m0.multiplyScalar(1);
            assert.ok(t1.equal(m3));
            assert.ok(t2.equal(zero));
            assert.ok(t3.equal(m0));
        });
        test('multiply', function(){
            var t1 = m6.multiply(m6);
            var t2 = identity.multiply(identity);
            var t3 = identity.multiply(zero);
            var t4 = identity.multiply(m0);
            var t5 = zero.multiply(m0);
            assert.ok(t1.equal(m7));
            assert.ok(t2.equal(identity));
            assert.ok(t3.equal(zero));
            assert.ok(t4.equal(m0));
            assert.ok(t5.equal(zero));
        });
        test('negate', function(){
            var t1 = m0.negate();
            var t2 = m1.negate();
            var t3 = m2.negate();
            var t4 = m3.negate();
            var t5 = zero.negate();
            var t6 = ones.negate();

            assert.ok(zero.equal(t5));
            for (var i = 0; i < 16; i++){
                assert.equal(t1[i], -m0[i]);
                assert.equal(t2[i], -m1[i]);
                assert.equal(t3[i], -m2[i]);
                assert.equal(t4[i], -m3[i]);
            }
            for (var j = 0; j < 16; j++){
                assert.equal(t1[j], -j);
                assert.equal(t6[j], -1);
            }
        });
        test('transpose', function(){
            var transpose_map = {
                0:0, 1:4, 2:8, 3:12, 4:1, 5:5, 6:9, 7:13,
                8:2, 9:6, 10:10, 11:14, 12:3, 13:7, 14:11, 15:15
            }
            var t1 = identity.transpose();
            var t2 = ones.transpose();
            var t3 = zero.transpose();
            var t4 = m0.transpose();
            var t5 = m1.transpose();
            var t6 = m2.transpose();
            var t7 = m3.transpose();

            assert.ok(t1.equal(identity));
            assert.ok(t2.equal(ones));
            assert.ok(t3.equal(zero));
            var t4 = m0.transpose();
            for (var i = 0; i < 16; i++){
                assert.equal(t4[i], m0[transpose_map[i]]);
                assert.equal(t5[i], m1[transpose_map[i]]);
                assert.equal(t6[i], m2[transpose_map[i]]);
                assert.equal(t7[i], m3[transpose_map[i]]);
            }
        });
        test('rotationX', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationX(theta);
                var t2 = Matrix.identity();
                t2[5] = Math.cos(theta)
                t2[6] = -Math.sin(theta)
                t2[9] = Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationY', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationY(theta);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[2] = Math.sin(theta)
                t2[8] = -Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationZ', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationZ(theta);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[1] = -Math.sin(theta)
                t2[4] = Math.sin(theta)
                t2[5] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationAxis', function(){
            // TODO: Add multi-axis tests?
            var xaxis = new Vector(1, 0, 0);
            var yaxis = new Vector(0, 1, 0);
            var zaxis = new Vector(0, 0, 1);
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationAxis(xaxis, theta);
                var t2 = Matrix.rotationAxis(yaxis, theta);
                var t3 = Matrix.rotationAxis(zaxis, theta);
                var t4 = Matrix.rotationAxis(xaxis, theta);
                var t5 = Matrix.rotationAxis(yaxis, theta);
                var t6 = Matrix.rotationAxis(zaxis, theta);
                assert.ok(t1.equal(Matrix.rotationX(theta)));
                assert.ok(t2.equal(Matrix.rotationY(theta)));
                assert.ok(t3.equal(Matrix.rotationZ(theta)));
                assert.ok(t4.equal(Matrix.rotationX(theta)));
                assert.ok(t5.equal(Matrix.rotationY(theta)));
                assert.ok(t6.equal(Matrix.rotationZ(theta)));
            }
        });
        test('rotation', function(){
            // TODO: Add better tests, this is basically just recreating the method
            var xaxis = new Vector(1, 0, 0);
            var yaxis = new Vector(0, 1, 0);
            var zaxis = new Vector(0, 0, 1);
            for (var i = 0; i < angles.length; i++){
                var pitch = angles[i];
                for (var j = 0; j < angles.length; j++){
                    var yaw = angles[j];
                    for (var k = 0; k < angles.length; k++){
                        var roll = angles[k];
                        var t1 = Matrix.rotation(pitch, yaw, roll);
                        var t2 = Matrix.rotationX(roll).
                            multiply(Matrix.rotationZ(yaw)).
                            multiply(Matrix.rotationY(pitch));
                        assert.ok(t1.equal(t2));
                    }
                }
            }
        });
        test('translation', function(){
            var trans = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < trans.length; i++){
                var xtrans = trans[i];
                for (var j = 0; j < trans.length; j++){
                    var ytrans = trans[j];
                    for (var k = 0; k < trans.length; k++){
                        var ztrans = trans[k];
                        var t1 = Matrix.translation(xtrans, ytrans, ztrans);   
                        for (var m = 0; m < 16; m++){
                            var result;
                            if (m === 12){
                                result = xtrans;
                            } else if (m === 13){
                                result = ytrans;
                            } else if (m === 14){
                                result = ztrans;
                            } else if (m === 0 || m === 5 || m === 10 || m === 15) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            assert.equal(t1[m], result);
                        }
                    }
                }
            }
        });
        test('scale', function(){
            var scale = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < scale.length; i++){
                var xscale = scale[i];
                for (var j = 0; j < scale.length; j++){
                    var yscale = scale[j];
                    for (var k = 0; k < scale.length; k++){
                        var zscale = scale[k];
                        var t1 = Matrix.scale(xscale, yscale, zscale);   
                        for (var m = 0; m < 16; m++){
                            var result;
                            if (m === 0){
                                result = xscale;
                            } else if (m === 5){
                                result = yscale;
                            } else if (m === 10){
                                result = zscale;
                            } else if (m === 15) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            assert.equal(t1[m], result);
                        }
                    }
                }
            }
        });
        test('identity', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(identity.equal(identity3));
            for (var i = 0; i < 16; i++){
                if (i % 5 === 0){
                    assert.equal(identity[i], 1);
                } else {
                    assert.equal(identity[i], 0);
                }
            }
        });
        test('zero', function(){
            assert.ok(zero.equal(zero2));
            assert.ok(zero.equal(zero3));
            for (var i = 0; i < 16; i++){
                assert.equal(zero[i], 0);
            }
        });
        test('fromArray', function(){
            assert.ok(m5.equal(m4));
            assert.ok(zero.equal(zero3));
            assert.ok(zero2.equal(zero3));
            assert.ok(identity.equal(identity3));
            assert.ok(identity2.equal(identity3));
        });
    });
});
},{"../../src/math/matrix.js":11,"../../src/math/vector.js":13,"assert":1}],22:[function(_dereq_,module,exports){
var Mesh = _dereq_('../../src/math/mesh.js');
var Face = _dereq_('../../src/math/face.js');
var Vector = _dereq_('../../src/math/vector.js');
var assert = _dereq_("assert");

suite('Mesh', function(){
    var mesh;
    setup(function(){
        mesh = new Mesh('triangle',
            [
                new Vector(1,0,0),
                new Vector(0,1,0),
                new Vector(0,0,1)
            ],
            [
                new Face(0, 1, 2, 'red')
            ]);
    });
    suite('properties', function(){
        test('name', function(){
            assert.ok(mesh.name);
            assert.equal(mesh.name, 'triangle');
        });
        test('vertices', function(){
            
        });
        test('faces', function(){
            
        });
        test('position', function(){
            
        });
        test('rotation', function(){
            
        });
        test('scale', function(){
            
        });
    });
    suite('methods', function(){
        test('fromJSON', function(){
            
        });
    });
});
},{"../../src/math/face.js":9,"../../src/math/mesh.js":12,"../../src/math/vector.js":13,"assert":1}],23:[function(_dereq_,module,exports){
var Vector = _dereq_('../../src/math/vector.js');
var assert = _dereq_("assert");

suite('Vector', function(){
    var origin, vector1, vector2, vector3, vector4, vector5, vectorx, vectory, vectorz;
    var vector100x, vector200y, vector300z, vector123, vector112;
    var epsilon = 0.01;
    function nearlyEqual(a, b, eps){
        if (typeof eps === "undefined") {eps = epsilon;}
        var diff = Math.abs(a - b);
        return (diff < eps);
    }
    setup(function(){
        origin = new Vector(0, 0, 0);
        vector1 = new Vector(1, 1, 1);
        vector2 = new Vector(1, 1, 1);
        vector3 = new Vector(10, 10, 10);
        vector4 = new Vector(11, 11, 11);
        vector5 = new Vector(-1, -1, -1);
        vectorx = new Vector(1, 0, 0);
        vectory = new Vector(0, 1, 0);
        vectorz = new Vector(0, 0, 1);
        vector100x = new Vector(100, 0, 0);
        vector200y = new Vector(0, 200, 0);
        vector300z = new Vector(0, 0, 300);
        vector123 = new Vector(1, 2, 3);
        vector112 = new Vector(-1, 1, 2);
    });
    suite('properties', function(){
        test('axes', function(){
            assert.throws(function(){new Vector();}, Error);
            assert.ok(vector1.x);
            assert.ok(vector1.y);
            assert.ok(vector1.z);
        });
    });
    suite('methods', function(){
        test('add', function(){
            var t1 = vector1.add(vector3);
            var t2 = vector1.add(vector5);
            assert.ok(vector1.add(vector3).equal(vector4));
            assert.ok(vector1.add(vector5).equal(origin));
            assert.equal(t1.x, 11);
            assert.equal(t1.y, 11);
            assert.equal(t1.z, 11);
            assert.equal(t2.x, 0);
            assert.equal(t2.y, 0);
            assert.equal(t2.z, 0);
        });
        test('subtract', function(){
            var t1 = vector4.subtract(vector1);
            var t2 = vector1.subtract(vector2);
            assert.ok(vector4.subtract(vector1).equal(vector3));
            assert.ok(vector1.subtract(vector2).equal(origin));
            assert.equal(t1.x, 10);
            assert.equal(t1.y, 10);
            assert.equal(t1.z, 10);
            assert.equal(t2.x, 0);
            assert.equal(t2.y, 0);
            assert.equal(t2.z, 0);
        });
        test('equal', function(){
            assert.equal(vector1.equal(vector2), true);
            assert.equal(vector1.equal(vector3), false);
        });
        test('angle', function(){
            assert.ok(nearlyEqual(vectorx.angle(vectory), Math.PI / 2));
            assert.ok(nearlyEqual(vectory.angle(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vectorx.angle(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vector1.angle(vector2), 0));
            assert.ok(nearlyEqual(vector1.angle(vector5), Math.PI));
        });
        test('cosAngle', function(){
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngle(vectory)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectory.cosAngle(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngle(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngle(vector2)), 0));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngle(vector5)), Math.PI));
        });
        test('magnitude', function(){
            assert.equal(vectorx.magnitude(), 1);
            assert.equal(vectory.magnitude(), 1);
            assert.equal(vectorz.magnitude(), 1);
            assert.ok(nearlyEqual(vector1.magnitude(), Math.sqrt(3)));
            assert.ok(nearlyEqual(vector5.magnitude(), Math.sqrt(3)));
            assert.ok(nearlyEqual(vector3.magnitude(), Math.sqrt(300)));
        });
        test('magnitudeSquared', function(){
            assert.equal(vectorx.magnitudeSquared(), 1);
            assert.equal(vectory.magnitudeSquared(), 1);
            assert.equal(vectorz.magnitudeSquared(), 1);
            assert.equal(vector1.magnitudeSquared(), 3);
            assert.equal(vector5.magnitudeSquared(), 3);
            assert.equal(vector3.magnitudeSquared(), 300);
        });
        test('dot', function(){
            assert.equal(vector1.dot(vector2), 3);
            assert.equal(vector2.dot(vector3), 30);
            assert.equal(vector3.dot(vector5), -30);
            assert.equal(vectorx.dot(vectory), 0);
            assert.equal(vectorx.dot(vectorz), 0);
            assert.equal(vectory.dot(vectorz), 0);
        });
        test('cross', function(){
            var t1 = vector123.cross(vector112);
            assert.ok(vectorx.cross(vectory).equal(vectorz));
            assert.ok(vectory.cross(vectorz).equal(vectorx));
            assert.ok(vectorz.cross(vectorx).equal(vectory));
            assert.ok(!vectory.cross(vectorx).equal(vectorz));
            assert.ok(!vectorz.cross(vectory).equal(vectorx));
            assert.ok(!vectorx.cross(vectorz).equal(vectory));
            assert.equal(vectorx.cross(vectory).z, 1);
            assert.equal(vectory.cross(vectorz).x, 1);
            assert.equal(vectorz.cross(vectorx).y, 1);
            assert.equal(t1.x, 1);
            assert.equal(t1.y, -5);
            assert.equal(t1.z, 3);

        });
        test('normalize', function(){
            assert.equal(vector100x.normalize().x, 1);
            assert.equal(vector200y.normalize().y, 1);
            assert.equal(vector300z.normalize().z, 1);
        });
        test('scale', function(){
            assert.ok(vectorx.scale(100).equal(vector100x));
            assert.ok(vectory.scale(200).equal(vector200y));
            assert.ok(vectorz.scale(300).equal(vector300z));
            assert.ok(vector1.scale(10).equal(vector3));
            assert.ok(vector1.scale(11).equal(vector4));
        });
        test('negate', function(){
            assert.ok(vector1.negate().equal(vector5));
            assert.ok(vector1.negate().negate().equal(vector1));
        });
        test('vectorProjection', function(){
            var t1 = vectorx.vectorProjection(vectory);
            var t2 = vector1.vectorProjection(vector3);
            var t3 = vector123.vectorProjection(vector112);
            assert.ok(nearlyEqual(t1.x, 0));
            assert.ok(nearlyEqual(t1.y, 0));
            assert.ok(nearlyEqual(t1.z, 0));
            assert.ok(nearlyEqual(t2.x, 1));
            assert.ok(nearlyEqual(t2.y, 1));
            assert.ok(nearlyEqual(t2.z, 1));
            assert.ok(nearlyEqual(t3.x, -1.167));
            assert.ok(nearlyEqual(t3.y, 1.16));
            assert.ok(nearlyEqual(t3.z, 2.33));
        });
        test('scalarProjection', function(){
            assert.ok(nearlyEqual(vectorx.scalarProjection(vectory), 0));
            assert.ok(nearlyEqual(vectory.scalarProjection(vectorz), 0));
            assert.ok(nearlyEqual(vectory.scalarProjection(vectorz), 0));
            assert.ok(nearlyEqual(vector1.scalarProjection(vector3), 1.73));
            assert.ok(nearlyEqual(vector123.scalarProjection(vector112), 2.85));
        });
        test('transform', function(){

        });
        test('rotate', function(){
            var rot1 = vectorx.rotate(vectory, Math.PI / 2);
            var rot2 = vectorx.rotate(vectory, Math.PI);
            var rot3 = vectorx.rotate(vectory, ((3*Math.PI) / 2));
            var rot4 = vectorx.rotate(vectory, 2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
            assert.ok(nearlyEqual(rot2.x, -1));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 1));
            assert.ok(nearlyEqual(rot4.x, 1));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotateX', function(){
            var rot1 = vectorz.rotateX(Math.PI / 2);
            var rot2 = vectorz.rotateX(Math.PI);
            var rot3 = vectorz.rotateX(((3*Math.PI) / 2));
            var rot4 = vectorz.rotateX(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, -1));
            assert.ok(nearlyEqual(rot1.z, 0));
            assert.ok(nearlyEqual(rot2.x, 0));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, -1));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 1));
            assert.ok(nearlyEqual(rot3.z, 0));
            assert.ok(nearlyEqual(rot4.x, 0));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 1));
        });
        test('rotateY', function(){
            var rot1 = vectorx.rotateY(Math.PI / 2);
            var rot2 = vectorx.rotateY(Math.PI);
            var rot3 = vectorx.rotateY(((3*Math.PI) / 2));
            var rot4 = vectorx.rotateY(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
            assert.ok(nearlyEqual(rot2.x, -1));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 1));
            assert.ok(nearlyEqual(rot4.x, 1));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotateZ', function(){
            var rot1 = vectory.rotateZ(Math.PI / 2);
            var rot2 = vectory.rotateZ(Math.PI);
            var rot3 = vectory.rotateZ(((3*Math.PI) / 2));
            var rot4 = vectory.rotateZ(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, -1));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, 0));
            assert.ok(nearlyEqual(rot2.x, 0));
            assert.ok(nearlyEqual(rot2.y, -1));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 1));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 0));
            assert.ok(nearlyEqual(rot4.x, 0));
            assert.ok(nearlyEqual(rot4.y, 1));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotatePitchYawRoll', function(){
            var rot1 = vectorx.rotatePitchYawRoll(Math.PI / 2, Math.PI / 2, Math.PI / 2);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
        });
    });
});
},{"../../src/math/vector.js":13,"assert":1}],24:[function(_dereq_,module,exports){
var Color = _dereq_('../../src/utility/color.js');
var colorlist = _dereq_('../data/colors.js');
var assert = _dereq_("assert");

suite('Color', function(){
    var red, green, rgba, hsl, hsla, aliceblue, epsilon;
    setup(function(){
        red = new Color("red");
        green = new Color("#BADA55");
        rgba = new Color("rgba(255, 0, 0, 0.3)");
        epsilon = 0.01;
        hsl = new Color("hsl(0, 100%, 50%)");
        hsla = new Color("hsla(0, 100%, 50%, 0.3)");
    });
    suite('properties', function(){
        test('rgb', function(){
            assert.equal(red.rgb.r, 255);
            assert.equal(red.rgb.g, 0);
            assert.equal(red.rgb.b, 0);
        });
        test('hsl', function(){
            assert.equal(red.hsl.h, 0);
            assert.equal(red.hsl.s, 1);
            assert.equal(red.hsl.l, 0.5);
        });
        test('alpha', function(){
            assert.ok(Math.abs(red.alpha - 1) < epsilon);
            assert.ok(Math.abs(rgba.alpha - 0.3) < epsilon);
        });
    });
    suite('methods', function(){
        test('lighten', function(){

        });
        test('darken', function(){

        });
        test('hslToRgb', function(){

        });
        test('rgbToHsl', function(){

        });
    });
});
},{"../../src/utility/color.js":14,"../data/colors.js":17,"assert":1}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2V2ZW50cy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL21hdGgvbWF0aC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC92ZWN0b3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvdXRpbGl0eS9jb2xvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy91dGlsaXR5L2tleWNvZGVzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdC9mYWtlX2M3YjQ1OGRlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZGF0YS9jb2xvcnMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9lbmdpbmUvY2FtZXJhLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZW5naW5lL3NjZW5lLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvbWF0aC9tYXRyaXguanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL3ZlY3Rvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL3V0aWxpdHkvY29sb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAoaXNOYU4odmFsdWUpIHx8ICFpc0Zpbml0ZSh2YWx1ZSkpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICAgIGtleSwgaTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsInZhciBtYXRoID0gcmVxdWlyZSgnLi4vbWF0aC9tYXRoLmpzJyk7XG52YXIgVmVjdG9yID0gbWF0aC5WZWN0b3I7XG52YXIgTWF0cml4ID0gbWF0aC5NYXRyaXg7XG5cbi8qKiBcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtWZWN0b3J9IHBvc2l0aW9uIENhbWVyYSBwb3NpdGlvbi5cbiAqIEBwYXJhbSB7VmVjdG9yfSB0YXJnZXQgICBDYW1lcmFcbiAqL1xuZnVuY3Rpb24gQ2FtZXJhKHdpZHRoLCBoZWlnaHQsIHBvc2l0aW9uKXtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24gfHwgbmV3IFZlY3RvcigxLDEsMjApO1xuICAgIHRoaXMudXAgPSBuZXcgVmVjdG9yKDAsIDEsIDApO1xuICAgIHRoaXMucm90YXRpb24gPSB7J3lhdyc6IDAsICdwaXRjaCc6IDAsICdyb2xsJzogMH07XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLm5lYXIgPSAwLjE7XG4gICAgdGhpcy5mYXIgPSAxMDAwO1xuICAgIHRoaXMuZm92ID0gOTA7XG4gICAgdGhpcy5wZXJzcGVjdGl2ZUZvdiA9IHRoaXMuY2FsY3VsYXRlUGVyc3BlY3RpdmVGb3YoKTtcbn1cbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLmRpcmVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzaW5fcGl0Y2ggPSBNYXRoLnNpbih0aGlzLnJvdGF0aW9uLnBpdGNoKTtcbiAgICB2YXIgY29zX3BpdGNoID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbi5waXRjaCk7XG4gICAgdmFyIHNpbl95YXcgPSBNYXRoLnNpbih0aGlzLnJvdGF0aW9uLnlhdyk7XG4gICAgdmFyIGNvc195YXcgPSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uLnlhdyk7XG5cbiAgICByZXR1cm4gbmV3IFZlY3RvcigtY29zX3BpdGNoICogc2luX3lhdywgc2luX3BpdGNoLCAtY29zX3BpdGNoICogY29zX3lhdyk7XG59O1xuLyoqXG4gKiBCdWlsZHMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCBiYXNlZCBvbiBhIGZpZWxkIG9mIHZpZXcuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuY2FsY3VsYXRlUGVyc3BlY3RpdmVGb3YgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm92ID0gdGhpcy5mb3YgKiAoTWF0aC5QSSAvIDE4MCk7IC8vIGNvbnZlcnQgdG8gcmFkaWFuc1xuICAgIHZhciBhc3BlY3QgPSB0aGlzLndpZHRoIC8gdGhpcy5oZWlnaHQ7XG4gICAgdmFyIG5lYXIgPSB0aGlzLm5lYXI7XG4gICAgdmFyIGZhciA9IHRoaXMuZmFyO1xuICAgIHZhciBtYXRyaXggPSBNYXRyaXguemVybygpO1xuICAgIHZhciBoZWlnaHQgPSAoMS9NYXRoLnRhbihmb3YvMikpICogdGhpcy5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gaGVpZ2h0ICogYXNwZWN0O1xuXG4gICAgbWF0cml4WzBdID0gd2lkdGg7XG4gICAgbWF0cml4WzVdID0gaGVpZ2h0O1xuICAgIG1hdHJpeFsxMF0gPSBmYXIvKG5lYXItZmFyKSA7XG4gICAgbWF0cml4WzExXSA9IC0xO1xuICAgIG1hdHJpeFsxNF0gPSBuZWFyKmZhci8obmVhci1mYXIpO1xuXG4gICAgcmV0dXJuIG1hdHJpeDtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5jcmVhdGVWaWV3TWF0cml4ID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgZXllID0gdGhpcy5wb3NpdGlvbjtcbiAgICB2YXIgcGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoO1xuICAgIHZhciB5YXcgPSB0aGlzLnJvdGF0aW9uLnlhdztcbiAgICB2YXIgY29zX3BpdGNoID0gTWF0aC5jb3MocGl0Y2gpO1xuICAgIHZhciBzaW5fcGl0Y2ggPSBNYXRoLnNpbihwaXRjaCk7XG4gICAgdmFyIGNvc195YXcgPSBNYXRoLmNvcyh5YXcpO1xuICAgIHZhciBzaW5feWF3ID0gTWF0aC5zaW4oeWF3KTtcblxuICAgIHZhciB4YXhpcyA9IG5ldyBWZWN0b3IoY29zX3lhdywgMCwgLXNpbl95YXcgKTtcbiAgICB2YXIgeWF4aXMgPSBuZXcgVmVjdG9yKHNpbl95YXcgKiBzaW5fcGl0Y2gsIGNvc19waXRjaCwgY29zX3lhdyAqIHNpbl9waXRjaCApO1xuICAgIHZhciB6YXhpcyA9IG5ldyBWZWN0b3Ioc2luX3lhdyAqIGNvc19waXRjaCwgLXNpbl9waXRjaCwgY29zX3BpdGNoICogY29zX3lhdyApO1xuXG4gICAgdmFyIHZpZXdfbWF0cml4ID0gTWF0cml4LmZyb21BcnJheShbXG4gICAgICAgIHhheGlzLngsIHlheGlzLngsIHpheGlzLngsIDAsXG4gICAgICAgIHhheGlzLnksIHlheGlzLnksIHpheGlzLnksIDAsXG4gICAgICAgIHhheGlzLnosIHlheGlzLnosIHpheGlzLnosIDAsXG4gICAgICAgIC0oeGF4aXMuZG90KGV5ZSkgKSwgLSggeWF4aXMuZG90KGV5ZSkgKSwgLSggemF4aXMuZG90KGV5ZSkgKSwgMVxuICAgIF0pO1xuICAgIHJldHVybiB2aWV3X21hdHJpeDtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbih4LCB5LCB6KXtcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlY3Rvcih4LHkseik7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVSaWdodCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIHJpZ2h0ID0gdGhpcy51cC5jcm9zcyh0aGlzLmRpcmVjdGlvbigpKS5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KHJpZ2h0KTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZUxlZnQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBsZWZ0ID0gdGhpcy51cC5jcm9zcyh0aGlzLmRpcmVjdGlvbigpKS5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmFkZChsZWZ0KTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuQ2FtZXJhLnByb3RvdHlwZS50dXJuUmlnaHQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHRoaXMucm90YXRpb24ueWF3IC09IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi55YXcgPCAwKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi55YXcgPSB0aGlzLnJvdGF0aW9uLnlhdyArIChNYXRoLlBJKjIpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUudHVybkxlZnQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHRoaXMucm90YXRpb24ueWF3ICs9IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi55YXcgPiAoTWF0aC5QSSoyKSl7XG4gICAgICAgIHRoaXMucm90YXRpb24ueWF3ID0gdGhpcy5yb3RhdGlvbi55YXcgLSAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbkNhbWVyYS5wcm90b3R5cGUubG9va1VwID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnBpdGNoIC09IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi5waXRjaCA+IChNYXRoLlBJKjIpKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi5waXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2ggLSAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLmxvb2tEb3duID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnBpdGNoICs9IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi5waXRjaCA8IDApe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaCArIChNYXRoLlBJKjIpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVVwID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgdXAgPSB0aGlzLnVwLm5vcm1hbGl6ZSgpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKHVwKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZURvd24gPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBkb3duID0gdGhpcy51cC5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KGRvd24pO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlRm9yd2FyZCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGZvcndhcmQgPSB0aGlzLmRpcmVjdGlvbigpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKGZvcndhcmQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlQmFja3dhcmQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBiYWNrd2FyZCA9IHRoaXMuZGlyZWN0aW9uKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChiYWNrd2FyZCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIvKipcbiAqIEV2ZW50IGhhbmRsZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgTmljaG9sYXMgQy4gWmFrYXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBNSVQgTGljZW5zZVxuICovXG5cbmZ1bmN0aW9uIEV2ZW50VGFyZ2V0KCl7XG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG59XG5cbi8qKiBAbWV0aG9kICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcil7XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9saXN0ZW5lcnNbdHlwZV0gPT09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB9XG5cbiAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG59O1xuLyoqIEBtZXRob2QgKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICBldmVudCA9IHsgdHlwZTogZXZlbnQgfTtcbiAgICB9XG4gICAgaWYgKCFldmVudC50YXJnZXQpe1xuICAgICAgICBldmVudC50YXJnZXQgPSB0aGlzO1xuICAgIH1cblxuICAgIGlmICghZXZlbnQudHlwZSl7ICAvL2ZhbHN5XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50IG9iamVjdCBtaXNzaW5nICd0eXBlJyBwcm9wZXJ0eS5cIik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1tldmVudC50eXBlXSBpbnN0YW5jZW9mIEFycmF5KXtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudC50eXBlXTtcbiAgICAgICAgZm9yICh2YXIgaT0wLCBsZW49bGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuRXZlbnRUYXJnZXQucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpe1xuICAgIGlmICh0aGlzLl9saXN0ZW5lcnNbdHlwZV0gaW5zdGFuY2VvZiBBcnJheSl7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbdHlwZV07XG4gICAgICAgIGZvciAodmFyIGk9MCwgbGVuPWxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldID09PSBsaXN0ZW5lcil7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRUYXJnZXQ7IiwidmFyIG1hdGggPSByZXF1aXJlKCcuLi9tYXRoL21hdGguanMnKTtcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYS5qcycpO1xudmFyIEV2ZW50VGFyZ2V0ID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBLRVlDT0RFUyA9IHJlcXVpcmUoJy4uL3V0aWxpdHkva2V5Y29kZXMuanMnKTtcblxudmFyIFZlY3RvciA9IG1hdGguVmVjdG9yO1xudmFyIE1hdHJpeCA9IG1hdGguTWF0cml4O1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHt7Y2FudmFzX2lkOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBTY2VuZShvcHRpb25zKXtcbiAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICB0aGlzLndpZHRoID0gb3B0aW9ucy53aWR0aDtcbiAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob3B0aW9ucy5jYW52YXNfaWQpO1xuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlci5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9jdHggPSB0aGlzLl9iYWNrX2J1ZmZlci5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gbnVsbDtcbiAgICB0aGlzLl9kZXB0aF9idWZmZXIgPSBbXTtcbiAgICB0aGlzLmRyYXdpbmdfbW9kZSA9IDE7XG4gICAgdGhpcy5fYmFja2ZhY2VfY3VsbGluZyA9IHRydWU7XG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmlsbHVtaW5hdGlvbiA9IG5ldyBWZWN0b3IoOTAsMCwwKTtcbiAgICAvKiogQHR5cGUge0FycmF5LjxNZXNoPn0gKi9cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuICAgIC8qKiBAdHlwZSB7T2JqZWN0LjxudW1iZXIsIGJvb2xlYW4+fSAqL1xuICAgIHRoaXMuX2tleXMgPSB7fTsgLy8gS2V5cyBjdXJyZW50bHkgcHJlc3NlZFxuICAgIHRoaXMuX2tleV9jb3VudCA9IDA7IC8vIE51bWJlciBvZiBrZXlzIGJlaW5nIHByZXNzZWQuLi4gdGhpcyBmZWVscyBrbHVkZ3lcbiAgICAvKiogQHR5cGUgez9udW1iZXJ9ICovXG4gICAgdGhpcy5fYW5pbV9pZCA9IG51bGw7XG4gICAgLyoqIEB0eXBlIHtib29sZWFufSAqL1xuICAgIHRoaXMuX25lZWRzX3VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fZHJhd19tb2RlID0gJ3dpcmVmcmFtZSc7XG4gICAgdGhpcy5pbml0KCk7XG59XG5TY2VuZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRUYXJnZXQoKTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5jYW52YXMudGFiSW5kZXggPSAxOyAvLyBTZXQgdGFiIGluZGV4IHRvIGFsbG93IGNhbnZhcyB0byBoYXZlIGZvY3VzIHRvIHJlY2VpdmUga2V5IGV2ZW50c1xuICAgIHRoaXMuX3hfb2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMik7XG4gICAgdGhpcy5feV9vZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgdGhpcy5pbml0aWFsaXplRGVwdGhCdWZmZXIoKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IHRoaXMuX2JhY2tfYnVmZmVyX2N0eC5jcmVhdGVJbWFnZURhdGEodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bi5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLmVtcHR5S2V5cy5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgRXZlbnRUYXJnZXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xufTtcbi8qKlxuICogRHVtcCBhbGwgcHJlc3NlZCBrZXlzIG9uIGJsdXIuXG4gKiBAbWV0aG9kXG4gKi9cblNjZW5lLnByb3RvdHlwZS5lbXB0eUtleXMgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuX2tleV9jb3VudCA9IDA7XG4gICAgdGhpcy5fa2V5cyA9IHt9O1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaXNLZXlEb3duID0gZnVuY3Rpb24oa2V5KXtcbiAgICByZXR1cm4gKEtFWUNPREVTW2tleV0gaW4gdGhpcy5fa2V5cyk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5vbktleURvd24gPSBmdW5jdGlvbihlKXtcbiAgICB2YXIgcHJlc3NlZCA9IGUua2V5Q29kZSB8fCBlLndoaWNoO1xuICAgIGlmICghdGhpcy5pc0tleURvd24ocHJlc3NlZCkpe1xuICAgICAgICB0aGlzLl9rZXlfY291bnQgKz0gMTtcbiAgICAgICAgdGhpcy5fa2V5c1twcmVzc2VkXSA9IHRydWU7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub25LZXlVcCA9IGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwcmVzc2VkID0gZS5rZXlDb2RlIHx8IGUud2hpY2g7XG4gICAgaWYgKHByZXNzZWQgaW4gdGhpcy5fa2V5cyl7XG4gICAgICAgIHRoaXMuX2tleV9jb3VudCAtPSAxO1xuICAgICAgICBkZWxldGUgdGhpcy5fa2V5c1twcmVzc2VkXTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pbml0aWFsaXplRGVwdGhCdWZmZXIgPSBmdW5jdGlvbigpe1xuICAgIGZvciAodmFyIHggPSAwLCBsZW4gPSB0aGlzLndpZHRoICogdGhpcy5oZWlnaHQ7IHggPCBsZW47IHgrKyl7XG4gICAgICAgIHRoaXMuX2RlcHRoX2J1ZmZlclt4XSA9IDk5OTk5OTk7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub2Zmc2NyZWVuID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICAvLyBUT0RPOiBOb3QgdG90YWxseSBjZXJ0YWluIHRoYXQgej4xIGluZGljYXRlcyB2ZWN0b3IgaXMgYmVoaW5kIGNhbWVyYS5cbiAgICB2YXIgeCA9IHZlY3Rvci54ICsgdGhpcy5feF9vZmZzZXQ7XG4gICAgdmFyIHkgPSB2ZWN0b3IueSArIHRoaXMuX3lfb2Zmc2V0O1xuICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgcmV0dXJuICh6ID4gMSB8fCB4IDwgMCB8fCB4ID4gdGhpcy53aWR0aCB8fCB5IDwgMCB8fCB5ID4gdGhpcy5oZWlnaHQpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd1BpeGVsID0gZnVuY3Rpb24oeCwgeSwgeiwgY29sb3Ipe1xuICAgIHggPSBNYXRoLmZsb29yKHggKyB0aGlzLl94X29mZnNldCk7XG4gICAgeSA9IE1hdGguZmxvb3IoeSArIHRoaXMuX3lfb2Zmc2V0KTtcbiAgICBpZiAoeCA+PSAwICYmIHggPCB0aGlzLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy5oZWlnaHQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0geCArICh5ICogdGhpcy53aWR0aCk7XG4gICAgICAgIGlmICh6IDwgdGhpcy5fZGVwdGhfYnVmZmVyW2luZGV4XSkge1xuICAgICAgICAgICAgdmFyIGltYWdlX2RhdGEgPSB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZS5kYXRhO1xuICAgICAgICAgICAgdmFyIGkgPSBpbmRleCAqIDQ7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2ldID0gY29sb3IucjtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSsxXSA9IGNvbG9yLmc7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krMl0gPSBjb2xvci5iO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzNdID0gMjU1O1xuICAgICAgICAgICAgdGhpcy5fZGVwdGhfYnVmZmVyW2luZGV4XSA9IHo7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLyoqIEBtZXRob2QgICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd0VkZ2UgPSBmdW5jdGlvbih2ZWN0b3IxLCB2ZWN0b3IyLCBjb2xvcil7XG4gICAgdmFyIGFicyA9IE1hdGguYWJzO1xuICAgIGlmICh2ZWN0b3IxLnggPiB2ZWN0b3IyLngpe1xuICAgICAgICB2YXIgdGVtcCA9IHZlY3RvcjE7XG4gICAgICAgIHZlY3RvcjEgPSB2ZWN0b3IyO1xuICAgICAgICB2ZWN0b3IyID0gdGVtcDtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRfeCA9IHZlY3RvcjEueDtcbiAgICB2YXIgY3VycmVudF95ID0gdmVjdG9yMS55O1xuICAgIHZhciBjdXJyZW50X3ogPSB2ZWN0b3IxLno7XG4gICAgdmFyIGxvbmdlc3RfZGlzdCA9IE1hdGgubWF4KGFicyh2ZWN0b3IyLnggLSB2ZWN0b3IxLngpLCBhYnModmVjdG9yMi55IC0gdmVjdG9yMS55KSwgYWJzKHZlY3RvcjIueiAtIHZlY3RvcjEueikpO1xuICAgIHZhciBzdGVwX3ggPSAodmVjdG9yMi54IC0gdmVjdG9yMS54KSAvIGxvbmdlc3RfZGlzdDtcbiAgICB2YXIgc3RlcF95ID0gKHZlY3RvcjIueSAtIHZlY3RvcjEueSkgLyBsb25nZXN0X2Rpc3Q7XG4gICAgdmFyIHN0ZXBfeiA9ICh2ZWN0b3IyLnogLSB2ZWN0b3IxLnopIC8gbG9uZ2VzdF9kaXN0O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb25nZXN0X2Rpc3Q7IGkrKyl7XG4gICAgICAgIHRoaXMuZHJhd1BpeGVsKGN1cnJlbnRfeCwgY3VycmVudF95LCBjdXJyZW50X3osIGNvbG9yKTtcbiAgICAgICAgY3VycmVudF94ICs9IHN0ZXBfeDtcbiAgICAgICAgY3VycmVudF95ICs9IHN0ZXBfeTtcbiAgICAgICAgY3VycmVudF96ICs9IHN0ZXBfejtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5kcmF3VHJpYW5nbGUgPSBmdW5jdGlvbih2ZWN0b3IxLCB2ZWN0b3IyLCB2ZWN0b3IzLCBjb2xvcil7XG4gICAgdGhpcy5kcmF3RWRnZSh2ZWN0b3IxLCB2ZWN0b3IyLCBjb2xvcik7XG4gICAgdGhpcy5kcmF3RWRnZSh2ZWN0b3IyLCB2ZWN0b3IzLCBjb2xvcik7XG4gICAgdGhpcy5kcmF3RWRnZSh2ZWN0b3IzLCB2ZWN0b3IxLCBjb2xvcik7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5kcmF3RmxhdEJvdHRvbVRyaWFuZ2xlID0gZnVuY3Rpb24odjEsIHYyLCB2MywgY29sb3Ipe1xuICAgIC8vIERyYXcgbGVmdCB0byByaWdodFxuICAgIGlmICh2Mi54ID49IHYzLngpe1xuICAgICAgICB2YXIgdGVtcCA9IHYzO1xuICAgICAgICB2MyA9IHYyO1xuICAgICAgICB2MiA9IHRlbXA7XG4gICAgfVxuICAgIC8vIGNvbXB1dGUgZGVsdGFzXG4gICAgdmFyIGR4eV9sZWZ0ICA9ICh2My54LXYxLngpLyh2My55LXYxLnkpO1xuICAgIHZhciBkeHlfcmlnaHQgPSAodjIueC12MS54KS8odjIueS12MS55KTtcbiAgICB2YXIgel9zbG9wZV9sZWZ0ID0gKHYzLnotdjEueikvKHYzLnktdjEueSk7XG4gICAgdmFyIHpfc2xvcGVfcmlnaHQgPSAodjIuei12MS56KS8odjIueS12MS55KTtcblxuICAgIC8vIHNldCBzdGFydGluZyBhbmQgZW5kaW5nIHBvaW50cyBmb3IgZWRnZSB0cmFjZVxuICAgIHZhciB4cyA9IG5ldyBWZWN0b3IodjEueCwgdjEueSwgdjEueik7XG4gICAgdmFyIHhlID0gbmV3IFZlY3Rvcih2MS54LCB2MS55LCB2MS56KTtcbiAgICB4cy56ID0gdjMueiArICgodjEueSAtIHYzLnkpICogel9zbG9wZV9sZWZ0KTtcbiAgICB4ZS56ID0gdjIueiArICgodjEueSAtIHYyLnkpICogel9zbG9wZV9yaWdodCk7XG5cbiAgICAvLyBkcmF3IGVhY2ggc2NhbmxpbmVcbiAgICBmb3IgKHZhciB5PXYxLnk7IHkgPD0gdjIueTsgeSsrKXtcbiAgICAgICAgeHMueSA9IHk7XG4gICAgICAgIHhlLnkgPSB5O1xuICAgICAgICB0aGlzLmRyYXdFZGdlKHhzLCB4ZSwgY29sb3IpO1xuXG4gICAgICAgIC8vIG1vdmUgZG93biBvbmUgc2NhbmxpbmVcbiAgICAgICAgeHMueCs9ZHh5X2xlZnQ7XG4gICAgICAgIHhlLngrPWR4eV9yaWdodDtcbiAgICAgICAgeHMueis9el9zbG9wZV9sZWZ0O1xuICAgICAgICB4ZS56Kz16X3Nsb3BlX3JpZ2h0O1xuICAgIH1cbn07XG5TY2VuZS5wcm90b3R5cGUuZHJhd0ZsYXRUb3BUcmlhbmdsZSA9IGZ1bmN0aW9uKHYxLCB2MiwgdjMsIGNvbG9yKXtcbiAgICAvLyBEcmF3IGxlZnQgdG8gcmlnaHRcbiAgICBpZiAodjEueCA+PSB2Mi54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2MTtcbiAgICAgICAgdjEgPSB2MjtcbiAgICAgICAgdjIgPSB0ZW1wO1xuICAgIH1cbiAgICAvLyBjb21wdXRlIGRlbHRhc1xuICAgIHZhciBkeHlfbGVmdCAgPSAodjMueC12MS54KS8odjMueS12MS55KTtcbiAgICB2YXIgZHh5X3JpZ2h0ID0gKHYzLngtdjIueCkvKHYzLnktdjIueSk7XG4gICAgdmFyIHpfc2xvcGVfbGVmdCA9ICh2My56LXYxLnopLyh2My55LXYxLnkpO1xuICAgIHZhciB6X3Nsb3BlX3JpZ2h0ID0gKHYzLnotdjIueikvKHYzLnktdjIueSk7XG5cbiAgICAvLyBzZXQgc3RhcnRpbmcgYW5kIGVuZGluZyBwb2ludHMgZm9yIGVkZ2UgdHJhY2VcbiAgICB2YXIgeHMgPSBuZXcgVmVjdG9yKHYxLngsIHYxLnksIHYxLnopO1xuICAgIHZhciB4ZSA9IG5ldyBWZWN0b3IodjIueCwgdjEueSwgdjEueik7XG5cbiAgICB4cy56ID0gdjEueiArICgodjEueSAtIHYxLnkpICogel9zbG9wZV9sZWZ0KTtcbiAgICB4ZS56ID0gdjIueiArICgodjEueSAtIHYyLnkpICogel9zbG9wZV9yaWdodCk7XG5cbiAgICAvLyBkcmF3IGVhY2ggc2NhbmxpbmVcbiAgICBmb3IgKHZhciB5PXYxLnk7IHkgPD0gdjMueTsgeSsrKXtcbiAgICAgICAgeHMueSA9IHk7XG4gICAgICAgIHhlLnkgPSB5O1xuICAgICAgICAvLyBkcmF3IGEgbGluZSBmcm9tIHhzIHRvIHhlIGF0IHkgaW4gY29sb3IgY1xuICAgICAgICB0aGlzLmRyYXdFZGdlKHhzLCB4ZSwgY29sb3IpO1xuICAgICAgICAvLyBtb3ZlIGRvd24gb25lIHNjYW5saW5lXG4gICAgICAgIHhzLngrPWR4eV9sZWZ0O1xuICAgICAgICB4ZS54Kz1keHlfcmlnaHQ7XG4gICAgICAgIHhzLnorPXpfc2xvcGVfbGVmdDtcbiAgICAgICAgeGUueis9el9zbG9wZV9yaWdodDtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5maWxsVHJpYW5nbGUgPSBmdW5jdGlvbih2MSwgdjIsIHYzLCBjb2xvcil7XG4gICAgLy8gRHJhdyBlZGdlcyBmaXJzdFxuICAgIC8vIFRPRE86IEZpeC4gVGhpcyBpcyBhIGhhY2suIFxuICAgIC8vdGhpcy5kcmF3VHJpYW5nbGUodjEsIHYyLCB2MywgY29sb3IpO1xuICAgIC8vIFNvcnQgdmVydGljZXMgYnkgeSB2YWx1ZVxuICAgIHZhciB0ZW1wO1xuICAgIGlmKHYxLnkgPiB2Mi55KSB7XG4gICAgICAgIHRlbXAgPSB2MjtcbiAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgdjEgPSB0ZW1wO1xuICAgIH1cbiAgICBpZih2Mi55ID4gdjMueSkge1xuICAgICAgICB0ZW1wID0gdjI7XG4gICAgICAgIHYyID0gdjM7XG4gICAgICAgIHYzID0gdGVtcDtcbiAgICB9XG4gICAgaWYodjEueSA+IHYyLnkpIHtcbiAgICAgICAgdGVtcCA9IHYyO1xuICAgICAgICB2MiA9IHYxO1xuICAgICAgICB2MSA9IHRlbXA7XG4gICAgfVxuICAgIC8vIFRyaWFuZ2xlIHdpdGggbm8gaGVpZ2h0XG4gICAgaWYgKCh2MS55IC0gdjMueSkgPT09IDApe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNob3J0X3Nsb3BlLCBsb25nX3Nsb3BlO1xuICAgIGlmICgodjIueSAtIHYxLnkpID09PSAwKSB7XG4gICAgICAgIHNob3J0X3Nsb3BlID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaG9ydF9zbG9wZSA9ICh2Mi54IC0gdjEueCkgLyAodjIueSAtIHYxLnkpO1xuICAgIH1cbiAgICBpZiAoKHYzLnkgLSB2MS55KSA9PT0gMCkge1xuICAgICAgICBsb25nX3Nsb3BlID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsb25nX3Nsb3BlID0gKHYzLnggLSB2MS54KSAvICh2My55IC0gdjEueSk7XG4gICAgfVxuXG4gICAgaWYgKHYyLnkgPT09IHYzLnkpe1xuICAgICAgICAvLyBGbGF0IHRvcFxuICAgICAgICB0aGlzLmRyYXdGbGF0Qm90dG9tVHJpYW5nbGUodjEsIHYyLCB2MywgY29sb3IpO1xuICAgIH1cbiAgICBlbHNlIGlmICh2MS55ID09PSB2Mi55ICl7XG4gICAgICAgIC8vIEZsYXQgYm90dG9tXG4gICAgICAgIHRoaXMuZHJhd0ZsYXRUb3BUcmlhbmdsZSh2MSwgdjIsIHYzLCBjb2xvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRGVjb21wb3NlIGludG8gZmxhdCB0b3AgYW5kIGZsYXQgYm90dG9tIHRyaWFuZ2xlc1xuICAgICAgICB2YXIgel9zbG9wZSA9ICh2My56IC0gdjEueikgLyAodjMueSAtIHYxLnkpO1xuICAgICAgICB2YXIgeCA9ICgodjIueSAtIHYxLnkpKmxvbmdfc2xvcGUpICsgdjEueDtcbiAgICAgICAgdmFyIHogPSAoKHYyLnkgLSB2MS55KSp6X3Nsb3BlKSArIHYxLno7XG4gICAgICAgIHZhciB2NCA9IG5ldyBWZWN0b3IoeCwgdjIueSwgeik7XG4gICAgICAgIHRoaXMuZHJhd0ZsYXRCb3R0b21UcmlhbmdsZSh2MSwgdjIsIHY0LCBjb2xvcik7XG4gICAgICAgIHRoaXMuZHJhd0ZsYXRUb3BUcmlhbmdsZSh2MiwgdjQsIHYzLCBjb2xvcik7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUucmVuZGVyU2NlbmUgPSBmdW5jdGlvbigpe1xuICAgIC8vIFRPRE86IFNpbXBsaWZ5IHRoaXMgZnVuY3Rpb24uXG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSB0aGlzLl9iYWNrX2J1ZmZlcl9jdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmluaXRpYWxpemVEZXB0aEJ1ZmZlcigpO1xuICAgIHZhciBjYW1lcmFfbWF0cml4ID0gdGhpcy5jYW1lcmEudmlld19tYXRyaXg7XG4gICAgdmFyIHByb2plY3Rpb25fbWF0cml4ID0gdGhpcy5jYW1lcmEucGVyc3BlY3RpdmVGb3Y7XG4gICAgdmFyIGxpZ2h0ID0gdGhpcy5pbGx1bWluYXRpb247XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubWVzaGVzKXtcbiAgICAgICAgaWYgKHRoaXMubWVzaGVzLmhhc093blByb3BlcnR5KGtleSkpe1xuICAgICAgICAgICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hlc1trZXldO1xuICAgICAgICAgICAgdmFyIHNjYWxlID0gbWVzaC5zY2FsZTtcbiAgICAgICAgICAgIHZhciByb3RhdGlvbiA9IG1lc2gucm90YXRpb247XG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBtZXNoLnBvc2l0aW9uO1xuICAgICAgICAgICAgdmFyIHdvcmxkX21hdHJpeCA9IE1hdHJpeC5zY2FsZShzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KS5tdWx0aXBseShcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb24ocm90YXRpb24ucGl0Y2gsIHJvdGF0aW9uLnlhdywgcm90YXRpb24ucm9sbCkubXVsdGlwbHkoXG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeC50cmFuc2xhdGlvbihwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KSkpO1xuICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBtZXNoLmZhY2VzLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICB2YXIgZmFjZSA9IG1lc2guZmFjZXNba10uZmFjZTtcbiAgICAgICAgICAgICAgICB2YXIgY29sb3IgPSBtZXNoLmZhY2VzW2tdLmNvbG9yO1xuICAgICAgICAgICAgICAgIHZhciB2MSA9IG1lc2gudmVydGljZXNbZmFjZVswXV07XG4gICAgICAgICAgICAgICAgdmFyIHYyID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzFdXTtcbiAgICAgICAgICAgICAgICB2YXIgdjMgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMl1dO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBub3JtYWxcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBDYW4gdGhpcyBiZSBjYWxjdWxhdGVkIGp1c3Qgb25jZSwgYW5kIHRoZW4gdHJhbnNmb3JtZWQgaW50b1xuICAgICAgICAgICAgICAgIC8vIGNhbWVyYSBzcGFjZT9cbiAgICAgICAgICAgICAgICB2YXIgY2FtX3RvX3ZlcnQgPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpZGUxID0gdjIudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlMiA9IHYzLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybSA9IHNpZGUxLmNyb3NzKHNpZGUyKTtcbiAgICAgICAgICAgICAgICBpZiAobm9ybS5tYWduaXR1ZGUoKSA8PSAwLjAwMDAwMDAxKXtcbiAgICAgICAgICAgICAgICAgICAgbm9ybSA9IG5vcm07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9ybSA9IG5vcm0ubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEJhY2tmYWNlIGN1bGxpbmcuXG4gICAgICAgICAgICAgICAgaWYgKGNhbV90b192ZXJ0LmRvdChub3JtKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3dnBfbWF0cml4ID0gd29ybGRfbWF0cml4Lm11bHRpcGx5KGNhbWVyYV9tYXRyaXgpLm11bHRpcGx5KHByb2plY3Rpb25fbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MSA9IHYxLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MiA9IHYyLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MyA9IHYzLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRyYXcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIERyYXcgc3VyZmFjZSBub3JtYWxzXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciBmYWNlX3RyYW5zID0gTWF0cml4LnRyYW5zbGF0aW9uKHd2MS54LCB3djEueSwgdjEueik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0VkZ2Uod3YxLCBub3JtLnNjYWxlKDIwKS50cmFuc2Zvcm0oZmFjZV90cmFucyksIHsncic6MjU1LFwiZ1wiOjI1NSxcImJcIjoyNTV9KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZpeCBmcnVzdHVtIGN1bGxpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyByZWFsbHkgc3R1cGlkIGZydXN0dW0gY3VsbGluZy4uLiB0aGlzIGNhbiByZXN1bHQgaW4gc29tZSBmYWNlcyBub3QgYmVpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gZHJhd24gd2hlbiB0aGV5IHNob3VsZCwgZS5nLiB3aGVuIGEgdHJpYW5nbGVzIHZlcnRpY2VzIHN0cmFkZGxlIHRoZSBmcnVzdHJ1bS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub2Zmc2NyZWVuKHd2MSkgJiYgdGhpcy5vZmZzY3JlZW4od3YyKSAmJiB0aGlzLm9mZnNjcmVlbih3djMpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZHJhdyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlnaHRfZGlyZWN0aW9uID0gbGlnaHQuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlsbHVtaW5hdGlvbl9hbmdsZSA9IG5vcm0uZG90KGxpZ2h0X2RpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9IGNvbG9yLmxpZ2h0ZW4oaWxsdW1pbmF0aW9uX2FuZ2xlLzYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsVHJpYW5nbGUod3YxLCB3djIsIHd2MywgY29sb3IucmdiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3VHJpYW5nbGUod3YxLCB3djIsIHd2MywgY29sb3IucmdiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9jdHgucHV0SW1hZ2VEYXRhKHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlLCAwLCAwKTtcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgdGhpcy5jdHguZHJhd0ltYWdlKHRoaXMuX2JhY2tfYnVmZmVyLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmFkZE1lc2ggPSBmdW5jdGlvbihtZXNoKXtcbiAgICB0aGlzLm1lc2hlc1ttZXNoLm5hbWVdID0gbWVzaDtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnJlbW92ZU1lc2ggPSBmdW5jdGlvbihtZXNoKXtcbiAgICBkZWxldGUgdGhpcy5tZXNoZXNbbWVzaC5uYW1lXTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKHRoaXMuX2tleV9jb3VudCA+IDApe1xuICAgICAgICB0aGlzLmZpcmUoJ2tleWRvd24nKTtcbiAgICB9XG4gICAgLy8gVE9ETzogQWRkIGtleXVwLCBtb3VzZWRvd24sIG1vdXNlZHJhZywgbW91c2V1cCwgZXRjLlxuICAgIGlmICh0aGlzLl9uZWVkc191cGRhdGUpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJTY2VuZSgpO1xuICAgICAgICB0aGlzLl9uZWVkc191cGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fYW5pbV9pZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy51cGRhdGUuYmluZCh0aGlzKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lO1xuIiwidmFyIENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9jb2xvci5qcycpO1xuXG4vKipcbiAqIEEgM0QgdHJpYW5nbGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBhICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge251bWJlcn0gYiAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtudW1iZXJ9IGMgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIEZhY2UoYSwgYiwgYywgY29sb3Ipe1xuICAgIHRoaXMuZmFjZSA9IFthLCBiLCBjXTtcbiAgICB0aGlzLmNvbG9yID0gbmV3IENvbG9yKGNvbG9yKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGYWNlOyIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3Rvci5qcycpO1xudmFyIE1lc2ggPSByZXF1aXJlKCcuL21lc2guanMnKTtcbnZhciBNYXRyaXggPSByZXF1aXJlKCcuL21hdHJpeC5qcycpO1xudmFyIEZhY2UgPSByZXF1aXJlKCcuL2ZhY2UuanMnKTtcblxudmFyIG1hdGggPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5tYXRoLlZlY3RvciA9IFZlY3Rvcjtcbm1hdGguTWVzaCA9IE1lc2g7XG5tYXRoLk1hdHJpeCA9IE1hdHJpeDtcbm1hdGguRmFjZSA9IEZhY2U7XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0aDsiLCIvKiogXG4gKiA0eDQgbWF0cml4LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1hdHJpeCgpe1xuICAgIC8qKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59ICovXG4gICAgZm9yICh2YXIgaT0wOyBpPDE2OyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gMDtcbiAgICB9XG4gICAgdGhpcy5sZW5ndGggPSAxNjtcbn1cbi8qKlxuICogQ29tcGFyZSBtYXRyaXggd2l0aCBzZWxmIGZvciBlcXVhbGl0eS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgaWYgKHRoaXNbaV0gIT09IG1hdHJpeFtpXSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuLyoqXG4gKiBBZGQgbWF0cml4IHRvIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldICsgbWF0cml4W2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFN1YnRyYWN0IG1hdHJpeCBmcm9tIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gLSBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTXVsdGlwbHkgc2VsZiBieSBzY2FsYXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHlTY2FsYXIgPSBmdW5jdGlvbihzY2FsYXIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gKiBzY2FsYXI7XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTXVsdGlwbHkgc2VsZiBieSBtYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIG5ld19tYXRyaXhbMF0gPSAodGhpc1swXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs0XSkgKyAodGhpc1syXSAqIG1hdHJpeFs4XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMV0gPSAodGhpc1swXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs1XSkgKyAodGhpc1syXSAqIG1hdHJpeFs5XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMl0gPSAodGhpc1swXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs2XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzNdID0gKHRoaXNbMF0gKiBtYXRyaXhbM10pICsgKHRoaXNbMV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzNdICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFs0XSA9ICh0aGlzWzRdICogbWF0cml4WzBdKSArICh0aGlzWzVdICogbWF0cml4WzRdKSArICh0aGlzWzZdICogbWF0cml4WzhdKSArICh0aGlzWzddICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs1XSA9ICh0aGlzWzRdICogbWF0cml4WzFdKSArICh0aGlzWzVdICogbWF0cml4WzVdKSArICh0aGlzWzZdICogbWF0cml4WzldKSArICh0aGlzWzddICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFs2XSA9ICh0aGlzWzRdICogbWF0cml4WzJdKSArICh0aGlzWzVdICogbWF0cml4WzZdKSArICh0aGlzWzZdICogbWF0cml4WzEwXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbN10gPSAodGhpc1s0XSAqIG1hdHJpeFszXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs3XSkgKyAodGhpc1s2XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzhdID0gKHRoaXNbOF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTBdICogbWF0cml4WzhdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbOV0gPSAodGhpc1s4XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTFdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxMF0gPSAodGhpc1s4XSAqIG1hdHJpeFsyXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbMTFdID0gKHRoaXNbOF0gKiBtYXRyaXhbM10pICsgKHRoaXNbOV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMTBdICogbWF0cml4WzExXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzEyXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTRdICogbWF0cml4WzhdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMTNdID0gKHRoaXNbMTJdICogbWF0cml4WzFdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTVdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxNF0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMTNdICogbWF0cml4WzZdKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTVdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxNV0gPSAodGhpc1sxMl0gKiBtYXRyaXhbM10pICsgKHRoaXNbMTNdICogbWF0cml4WzddKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTVdICogbWF0cml4WzE1XSk7XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBOZWdhdGUgc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IC10aGlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFRyYW5zcG9zZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9IHRoaXNbMF07XG4gICAgbmV3X21hdHJpeFsxXSA9IHRoaXNbNF07XG4gICAgbmV3X21hdHJpeFsyXSA9IHRoaXNbOF07XG4gICAgbmV3X21hdHJpeFszXSA9IHRoaXNbMTJdO1xuICAgIG5ld19tYXRyaXhbNF0gPSB0aGlzWzFdO1xuICAgIG5ld19tYXRyaXhbNV0gPSB0aGlzWzVdO1xuICAgIG5ld19tYXRyaXhbNl0gPSB0aGlzWzldO1xuICAgIG5ld19tYXRyaXhbN10gPSB0aGlzWzEzXTtcbiAgICBuZXdfbWF0cml4WzhdID0gdGhpc1syXTtcbiAgICBuZXdfbWF0cml4WzldID0gdGhpc1s2XTtcbiAgICBuZXdfbWF0cml4WzEwXSA9IHRoaXNbMTBdO1xuICAgIG5ld19tYXRyaXhbMTFdID0gdGhpc1sxNF07XG4gICAgbmV3X21hdHJpeFsxMl0gPSB0aGlzWzNdO1xuICAgIG5ld19tYXRyaXhbMTNdID0gdGhpc1s3XTtcbiAgICBuZXdfbWF0cml4WzE0XSA9IHRoaXNbMTFdO1xuICAgIG5ld19tYXRyaXhbMTVdID0gdGhpc1sxNV07XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeC1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWCA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbNl0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs5XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHktYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblkgPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs4XSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB6LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25aID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMV0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25BeGlzID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIHUgPSBheGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHUueDtcbiAgICB2YXIgdXkgPSB1Lnk7XG4gICAgdmFyIHV6ID0gdS56O1xuICAgIHZhciB4eSA9IHV4ICogdXk7XG4gICAgdmFyIHh6ID0gdXggKiB1ejtcbiAgICB2YXIgeXogPSB1eSAqIHV6O1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcyArICgodXgqdXgpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxXSA9ICh4eSpjb3MxKSAtICh1eipzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9ICh4eipjb3MxKSsodXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSAoeHkqY29zMSkrKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zKygodXkqdXkpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9ICh5eipjb3MxKS0odXgqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAoeHoqY29zMSktKHV5KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gKHl6KmNvczEpKyh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3MgKyAoKHV6KnV6KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIHBpdGNoLCB5YXcsIGFuZCByb2xsXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvbiA9IGZ1bmN0aW9uKHBpdGNoLCB5YXcsIHJvbGwpe1xuICAgIHJldHVybiBNYXRyaXgucm90YXRpb25YKHJvbGwpLm11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblooeWF3KSkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWShwaXRjaCkpO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHRyYW5zbGF0aW9uIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IGRpc3RhbmNlc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgudHJhbnNsYXRpb24gPSBmdW5jdGlvbih4dHJhbnMsIHl0cmFucywgenRyYW5zKXtcbiAgICB2YXIgdHJhbnNsYXRpb25fbWF0cml4ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEyXSA9IHh0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTNdID0geXRyYW5zO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxNF0gPSB6dHJhbnM7XG4gICAgcmV0dXJuIHRyYW5zbGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBzY2FsaW5nIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IHNjYWxlXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5zY2FsZSA9IGZ1bmN0aW9uKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpe1xuICAgIHZhciBzY2FsaW5nX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBzY2FsaW5nX21hdHJpeFswXSA9IHhzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFs1XSA9IHlzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxMF0gPSB6c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gc2NhbGluZ19tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGlkZW50aXR5IG1hdHJpeFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguaWRlbnRpdHkgPSBmdW5jdGlvbigpe1xuICAgIHZhciBpZGVudGl0eSA9IG5ldyBNYXRyaXgoKTtcbiAgICBpZGVudGl0eVswXSA9IDE7XG4gICAgaWRlbnRpdHlbNV0gPSAxO1xuICAgIGlkZW50aXR5WzEwXSA9IDE7XG4gICAgaWRlbnRpdHlbMTVdID0gMTtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgemVybyBtYXRyaXhcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4Lnplcm8gPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBuZXcgTWF0cml4KCk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1hdHJpeCBmcm9tIGFuIGFycmF5XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5mcm9tQXJyYXkgPSBmdW5jdGlvbihhcnIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSBhcnJbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4vZmFjZS5qcycpO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7QXJyYXkuPFZlY3Rvcj59IHZlcnRpY2VzXG4gKiBAcGFyYW0ge0FycmF5LjxGYWNlPn0gZWRnZXNcbiAqL1xuZnVuY3Rpb24gTWVzaChuYW1lLCB2ZXJ0aWNlcywgZmFjZXMpe1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICAgIHRoaXMuZmFjZXMgPSBmYWNlcztcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMuc2NhbGUgPSB7J3gnOiAxLCAneSc6IDEsICd6JzogMX07XG59XG5NZXNoLmZyb21KU09OID0gZnVuY3Rpb24oanNvbil7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG4gICAgdmFyIGZhY2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGpzb24udmVydGljZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB2YXIgdmVydGV4ID0ganNvbi52ZXJ0aWNlc1tpXTtcbiAgICAgICAgdmVydGljZXMucHVzaChuZXcgVmVjdG9yKHZlcnRleFswXSwgdmVydGV4WzFdLCB2ZXJ0ZXhbMl0pKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaiA9IDAsIGxuID0ganNvbi5mYWNlcy5sZW5ndGg7IGogPCBsbjsgaisrKXtcbiAgICAgICAgdmFyIGZhY2UgPSBqc29uLmZhY2VzW2pdO1xuICAgICAgICBmYWNlcy5wdXNoKG5ldyBGYWNlKGZhY2UuZmFjZVswXSwgZmFjZS5mYWNlWzFdLCBmYWNlLmZhY2VbMl0sIGZhY2UuY29sb3IpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBNZXNoKGpzb24ubmFtZSwgdmVydGljZXMsIGZhY2VzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzaDtcbiIsIi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEBwYXJhbSB7bnVtYmVyfSB6XG4gKi9cbmZ1bmN0aW9uIFZlY3Rvcih4LCB5LCB6KXtcbiAgICBpZiAodHlwZW9mIHggPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeiA9PT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3VmZmljaWVudCBhcmd1bWVudHMuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy56ID0gejtcbiAgICB9XG59XG4vKipcbiAqIEFkZCB2ZWN0b3IgdG8gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHZlY3Rvci54LCB0aGlzLnkgKyB2ZWN0b3IueSwgdGhpcy56ICsgdmVjdG9yLnopO1xufTtcbi8qKlxuICogU3VidHJhY3QgdmVjdG9yIGZyb20gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0gdmVjdG9yLngsIHRoaXMueSAtIHZlY3Rvci55LCB0aGlzLnogLSB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBDb21wYXJlIHZlY3RvciB3aXRoIHNlbGYgZm9yIGVxdWFsaXR5XG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy54ID09PSB2ZWN0b3IueCAmJiB0aGlzLnkgPT09IHZlY3Rvci55ICYmIHRoaXMueiA9PT0gdmVjdG9yLno7XG59O1xuLyoqXG4gKiBGaW5kIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBhID0gdGhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgYiA9IHZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICB2YXIgYW1hZyA9IGEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSBiLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gYS5kb3QoYikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiBNYXRoLmFjb3ModGhldGEpO1xufTtcbi8qKlxuICogRmluZCB0aGUgY29zIG9mIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNvc0FuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gdGhldGE7XG59O1xuLyoqXG4gKiBGaW5kIG1hZ25pdHVkZSBvZiBhIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tYWduaXR1ZGUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBNYXRoLnNxcnQoKHRoaXMueCAqIHRoaXMueCkgKyAodGhpcy55ICogdGhpcy55KSArICh0aGlzLnogKiB0aGlzLnopKTtcbn07XG4vKipcbiAqIEZpbmQgbWFnbml0dWRlIHNxdWFyZWQgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlU3F1YXJlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KTtcbn07XG4vKipcbiAqIEZpbmQgZG90IHByb2R1Y3Qgb2Ygc2VsZiBhbmQgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuICh0aGlzLnggKiB2ZWN0b3IueCkgKyAodGhpcy55ICogdmVjdG9yLnkpICsgKHRoaXMueiAqIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIEZpbmQgY3Jvc3MgcHJvZHVjdCBvZiBzZWxmIGFuZCB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKFxuICAgICAgICAodGhpcy55ICogdmVjdG9yLnopIC0gKHRoaXMueiAqIHZlY3Rvci55KSxcbiAgICAgICAgKHRoaXMueiAqIHZlY3Rvci54KSAtICh0aGlzLnggKiB2ZWN0b3IueiksXG4gICAgICAgICh0aGlzLnggKiB2ZWN0b3IueSkgLSAodGhpcy55ICogdmVjdG9yLngpXG4gICAgKTtcbn07XG4vKipcbiAqIE5vcm1hbGl6ZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7VmVjdG9yfVxuICogQHRocm93cyB7WmVyb0RpdmlzaW9uRXJyb3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGUoKTtcbiAgICBpZiAobWFnbml0dWRlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLyBtYWduaXR1ZGUsIHRoaXMueSAvIG1hZ25pdHVkZSwgdGhpcy56IC8gbWFnbml0dWRlKTtcbn07XG4vKipcbiAqIFNjYWxlIHNlbGYgYnkgc2NhbGUuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGVcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKiBzY2FsZSwgdGhpcy55ICogc2NhbGUsIHRoaXMueiAqIHNjYWxlKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuVmVjdG9yLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKC10aGlzLngsIC10aGlzLnksIC10aGlzLnopO1xufTtcbi8qKlxuICogUHJvamVjdCBzZWxmIG9udG8gdmVjdG9yXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUudmVjdG9yUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIG1hZyA9IHZlY3Rvci5tYWduaXR1ZGUoKTtcbiAgICByZXR1cm4gdmVjdG9yLnNjYWxlKHRoaXMuZG90KHZlY3RvcikgLyAobWFnICogbWFnKSk7XG59O1xuLyoqXG4gKiBQcm9qZWN0IHNlbGYgb250byB2ZWN0b3JcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsYXJQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy5kb3QodmVjdG9yKSAvIHZlY3Rvci5tYWduaXR1ZGUoKTtcbn07XG4vKipcbiAqIFBlcmZvcm0gbGluZWFyIHRyYW5mb3JtYXRpb24gb24gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSB0cmFuc2Zvcm1fbWF0cml4XG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24odHJhbnNmb3JtX21hdHJpeCl7XG4gICAgdmFyIHggPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFswXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs0XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFs4XSkgKyB0cmFuc2Zvcm1fbWF0cml4WzEyXTtcbiAgICB2YXIgeSA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzFdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzVdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzldKSArIHRyYW5zZm9ybV9tYXRyaXhbMTNdO1xuICAgIHZhciB6ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMl0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNl0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbMTBdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTRdO1xuICAgIHZhciB3ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbM10pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbN10pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbMTFdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTVdO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHggLyB3LCB5IC8gdywgeiAvIHcpO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIGF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSBheGlzXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihheGlzLCB0aGV0YSl7XG4gICAgdmFyIHUgPSBheGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHUueDtcbiAgICB2YXIgdXkgPSB1Lnk7XG4gICAgdmFyIHV6ID0gdS56O1xuICAgIHZhciB4eSA9IHUueCAqIHUueTtcbiAgICB2YXIgeHogPSB1LnggKiB1Lno7XG4gICAgdmFyIHl6ID0gdS55ICogdS56O1xuICAgIHZhciB4ID0gKChjb3MgKyAoKHV4KnV4KSpjb3MxKSkgKiB0aGlzLngpICsgKCgoeHkqY29zMSkgLSAodXoqc2luKSkgKiB0aGlzLnkpICsgKCgoeHoqY29zMSkrKHV5KnNpbikpICogdGhpcy56KTtcbiAgICB2YXIgeSA9ICgoKHh5KmNvczEpKyh1eipzaW4pKSAqIHRoaXMueCkgKyAoKGNvcysoKHV5KnV5KSpjb3MxKSkgKiB0aGlzLnkpICsgKCgoeXoqY29zMSktKHV4KnNpbikpICogdGhpcy56KTtcbiAgICB2YXIgeiA9ICgoKHh6KmNvczEpLSh1eSpzaW4pKSAqIHRoaXMueCkgKyAoKCh5eipjb3MxKSsodXgqc2luKSkgKiB0aGlzLnkpICsgKChjb3MgKyAoKHV4KnV4KSpjb3MxKSkgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHgtYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWCA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSAoY29zICogdGhpcy55KSAtIChzaW4gKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKHNpbiAqIHRoaXMueSkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB5LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVkgPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gKGNvcyAqdGhpcy54KSArIChzaW4gKiB0aGlzLnopO1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gLShzaW4gKiB0aGlzLngpICsgKGNvcyAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgei1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVaID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKiB0aGlzLngpIC0gKHNpbiAqIHRoaXMueSk7XG4gICAgdmFyIHkgPSAoc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnkpO1xuICAgIHZhciB6ID0gdGhpcy56O1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgcGl0Y2gsIHlhdywgcm9sbFxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHBpdGNoXG4gKiBAcGFyYW0ge251bWJlcn0geWF3XG4gKiBAcGFyYW0ge251bWJlcn0gcm9sbFxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVBpdGNoWWF3Um9sbCA9IGZ1bmN0aW9uKHBpdGNoX2FtbnQsIHlhd19hbW50LCByb2xsX2FtbnQpIHtcbiAgICByZXR1cm4gdGhpcy5yb3RhdGVYKHJvbGxfYW1udCkucm90YXRlWShwaXRjaF9hbW50KS5yb3RhdGVaKHlhd19hbW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yOyIsInZhciBwYXJzZUNvbG9yLCBjYWNoZTtcbi8qKlxuICogQSBjb2xvciB3aXRoIGJvdGggcmdiIGFuZCBoc2wgcmVwcmVzZW50YXRpb25zLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgQW55IGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKi9cbmZ1bmN0aW9uIENvbG9yKGNvbG9yKXtcbiAgICB2YXIgcGFyc2VkX2NvbG9yID0ge307XG4gICAgaWYgKGNvbG9yIGluIGNhY2hlKXtcbiAgICAgICAgcGFyc2VkX2NvbG9yID0gY2FjaGVbY29sb3JdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnNlZF9jb2xvciA9IHBhcnNlQ29sb3IoY29sb3IpO1xuICAgICAgICBjYWNoZVtjb2xvcl0gPSBwYXJzZWRfY29sb3I7XG4gICAgfVxuICAgIHZhciBoc2wgPSBDb2xvci5yZ2JUb0hzbChwYXJzZWRfY29sb3IuciwgcGFyc2VkX2NvbG9yLmcsIHBhcnNlZF9jb2xvci5iKTtcbiAgICB0aGlzLnJnYiA9IHsncic6IHBhcnNlZF9jb2xvci5yLCAnZyc6IHBhcnNlZF9jb2xvci5nLCAnYic6IHBhcnNlZF9jb2xvci5ifTtcbiAgICB0aGlzLmhzbCA9IHsnaCc6IGhzbC5oLCAncyc6IGhzbC5zLCAnbCc6IGhzbC5sfTtcbiAgICB0aGlzLmFscGhhID0gcGFyc2VkX2NvbG9yLmEgfHwgMTtcbn1cbi8qKlxuICogTGlnaHRlbiBhIGNvbG9yIGJ5IHBlcmNlbnQgYW1vdW50LlxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmxpZ2h0ZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sICsgcGVyY2VudDtcbiAgICBpZiAobHVtID4gMSl7XG4gICAgICAgIGx1bSA9IDE7XG4gICAgfVxuICAgIHZhciBsaWdodGVyID0gQ29sb3IuaHNsVG9SZ2IoaHNsLmgsIGhzbC5zLCBsdW0pO1xuICAgIHJldHVybiBuZXcgQ29sb3IoXCJyZ2IoXCIgKyBNYXRoLmZsb29yKGxpZ2h0ZXIucikgKyBcIixcIiArIE1hdGguZmxvb3IobGlnaHRlci5nKSArIFwiLFwiICsgTWF0aC5mbG9vcihsaWdodGVyLmIpICsgXCIpXCIpO1xufTtcbi8qKlxuICogRGFya2VuIGEgY29sb3IgYnkgcGVyY2VudCBhbW91bnQuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG9yfVxuICovXG5Db2xvci5wcm90b3R5cGUuZGFya2VuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCAtIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA8IDApe1xuICAgICAgICBsdW0gPSAwO1xuICAgIH1cbiAgICB2YXIgZGFya2VyID0gQ29sb3IuaHNsVG9SZ2IoaHNsLmgsIGhzbC5zLCBsdW0pO1xuICAgIHJldHVybiBuZXcgQ29sb3IoXCJyZ2IoXCIgKyBNYXRoLmZsb29yKGRhcmtlci5yKSArIFwiLFwiICsgTWF0aC5mbG9vcihkYXJrZXIuZykgKyBcIixcIiArIE1hdGguZmxvb3IoZGFya2VyLmIpICsgXCIpXCIpO1xufTtcbkNvbG9yLmhzbFRvUmdiID0gZnVuY3Rpb24oaCwgcywgbCl7XG4gICAgZnVuY3Rpb24gX3YobTEsIG0yLCBodWUpe1xuICAgICAgICBodWUgPSBodWUgJSAxO1xuICAgICAgICBpZiAoaHVlIDwgMCl7aHVlKz0xO31cbiAgICAgICAgaWYgKGh1ZSA8ICgxLzYpKXtcbiAgICAgICAgICAgIHJldHVybiBtMSArIChtMi1tMSkqaHVlKjY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGh1ZSA8IDAuNSl7XG4gICAgICAgICAgICByZXR1cm4gbTI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGh1ZSA8ICgyLzMpKXtcbiAgICAgICAgICAgIHJldHVybiBtMSArIChtMi1tMSkqKCgyLzMpLWh1ZSkqNjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbTE7XG4gICAgfVxuICAgIHZhciBtMjtcbiAgICBpZiAocyA9PT0gMCl7XG4gICAgICAgIHJldHVybiB7J3InOiBsLCAnZyc6IGwsICdiJzogbH07XG4gICAgfVxuICAgIGlmIChsIDw9IDAuNSl7XG4gICAgICAgIG0yID0gbCAqICgxK3MpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBtMiA9IGwrcy0obCpzKTtcbiAgICB9XG4gICAgdmFyIG0xID0gMipsIC0gbTI7XG4gICAgcmV0dXJuIHsncic6IF92KG0xLCBtMiwgaCsoMS8zKSkqMjU1LCAnZyc6IF92KG0xLCBtMiwgaCkqMjU1LCAnYic6IF92KG0xLCBtMiwgaC0oMS8zKSkqMjU1fTtcbn07XG5Db2xvci5yZ2JUb0hzbCA9IGZ1bmN0aW9uKHIsIGcsIGIpe1xuICAgIHIgPSByIC8gMjU1O1xuICAgIGcgPSBnIC8gMjU1O1xuICAgIGIgPSBiIC8gMjU1O1xuICAgIHZhciBtYXhjID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgdmFyIG1pbmMgPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICB2YXIgbCA9IChtaW5jK21heGMpLzI7XG4gICAgdmFyIGgsIHM7XG4gICAgaWYgKG1pbmMgPT09IG1heGMpe1xuICAgICAgICByZXR1cm4geydoJzogMCwgJ3MnOiAwLCAnbCc6IGx9O1xuICAgIH1cbiAgICBpZiAobCA8PSAwLjUpe1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAobWF4YyttaW5jKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKDItbWF4Yy1taW5jKTtcbiAgICB9XG4gICAgdmFyIHJjID0gKG1heGMtcikgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgZ2MgPSAobWF4Yy1nKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBiYyA9IChtYXhjLWIpIC8gKG1heGMtbWluYyk7XG4gICAgaWYgKHIgPT09IG1heGMpe1xuICAgICAgICBoID0gYmMtZ2M7XG4gICAgfVxuICAgIGVsc2UgaWYgKGcgPT09IG1heGMpe1xuICAgICAgICBoID0gMityYy1iYztcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgaCA9IDQrZ2MtcmM7XG4gICAgfVxuICAgIGggPSAoaC82KSAlIDE7XG4gICAgaWYgKGggPCAwKXtoKz0xO31cbiAgICByZXR1cm4geydoJzogaCwgJ3MnOiBzLCAnbCc6IGx9O1xufTtcblxuLyoqXG4gKiBQYXJzZSBhIENTUyBjb2xvciB2YWx1ZSBhbmQgcmV0dXJuIGFuIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2xvciBBIGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyfX0gICByZ2JhIGNvbG9yIG9iamVjdC5cbiAqIEB0aHJvd3Mge0NvbG9yRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIC8vIFRPRE86IEhvdyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGUgaXMgdGhpcz8gSG93IGVmZmljaWVudD9cbiAgICAvLyBNYWtlIGEgdGVtcG9yYXJ5IEhUTUwgZWxlbWVudCBzdHlsZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3Igc3RyaW5nXG4gICAgLy8gdGhlbiBleHRyYWN0IGFuZCBwYXJzZSB0aGUgY29tcHV0ZWQgcmdiKGEpIHZhbHVlLlxuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3I7XG4gICAgdmFyIHJnYmEgPSBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yO1xuICAgIC8vIENvbnZlcnQgc3RyaW5nIGluIGZvcm0gJ3JnYlthXShudW0sIG51bSwgbnVtWywgbnVtXSknIHRvIGFycmF5IFsnbnVtJywgJ251bScsICdudW0nWywgJ251bSddXVxuICAgIHJnYmEgPSByZ2JhLnNsaWNlKHJnYmEuaW5kZXhPZignKCcpKzEpLnNsaWNlKDAsLTEpLnJlcGxhY2UoL1xccy9nLCAnJykuc3BsaXQoJywnKTtcbiAgICB2YXIgcmV0dXJuX2NvbG9yID0ge307XG4gICAgdmFyIGNvbG9yX3NwYWNlcyA9IFsncicsICdnJywgJ2InLCAnYSddO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmdiYS5sZW5ndGg7IGkrKyl7XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQocmdiYVtpXSk7IC8vIEFscGhhIHZhbHVlIHdpbGwgYmUgZmxvYXRpbmcgcG9pbnQuXG4gICAgICAgIGlmIChpc05hTih2YWx1ZSkpe1xuICAgICAgICAgICAgdGhyb3cgXCJDb2xvckVycm9yOiBTb21ldGhpbmcgd2VudCB3cm9uZy4gUGVyaGFwcyBcIiArIGNvbG9yICsgXCIgaXMgbm90IGEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm5fY29sb3JbY29sb3Jfc3BhY2VzW2ldXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5fY29sb3I7XG59O1xuLy8gUHJlLXdhcm0gdGhlIGNhY2hlIHdpdGggbmFtZWQgY29sb3JzLCBhcyB0aGVzZSBhcmUgbm90XG4vLyBjb252ZXJ0ZWQgdG8gcmdiIHZhbHVlcyBieSB0aGUgcGFyc2VDb2xvciBmdW5jdGlvbiBhYm92ZS5cbmNhY2hlID0ge1xuICAgIFwiYmxhY2tcIjogeyBcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLCBcImFcIjogMX0sXG4gICAgXCJzaWx2ZXJcIjogeyBcInJcIjogMTkyLCBcImdcIjogMTkyLCBcImJcIjogMTkyLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjc1Mjk0MTE3NjQ3MDU4ODIsIFwiYVwiOiAxfSxcbiAgICBcImdyYXlcIjogeyBcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjUwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcIndoaXRlXCI6IHsgXCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMSwgXCJhXCI6IDF9LFxuICAgIFwibWFyb29uXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcInJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcInB1cnBsZVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcImxpbWVcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcIm9saXZlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwieWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJuYXZ5XCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwiYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwidGVhbFwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwiYXF1YVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJvcmFuZ2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNjUsIFwiYlwiOiAwLCBcImhcIjogMC4xMDc4NDMxMzcyNTQ5MDE5NywgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNTc3Nzc3Nzc3Nzc3Nzc3OCwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImFudGlxdWV3aGl0ZVwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDIzNSwgXCJiXCI6IDIxNSwgXCJoXCI6IDAuMDk1MjM4MDk1MjM4MDk1MTksIFwic1wiOiAwLjc3Nzc3Nzc3Nzc3Nzc3NzksIFwibFwiOiAwLjkxMTc2NDcwNTg4MjM1MjksIFwiYVwiOiAxfSxcbiAgICBcImFxdWFtYXJpbmVcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMTIsIFwiaFwiOiAwLjQ0NDAxMDQxNjY2NjY2NjcsIFwic1wiOiAxLCBcImxcIjogMC43NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJhenVyZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNSwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImJlaWdlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjIwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDAuNTU1NTU1NTU1NTU1NTU2LCBcImxcIjogMC45MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcImJpc3F1ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE5NiwgXCJoXCI6IDAuMDkwMzk1NDgwMjI1OTg4NzEsIFwic1wiOiAxLCBcImxcIjogMC44ODQzMTM3MjU0OTAxOTYsIFwiYVwiOiAxfSxcbiAgICBcImJsYW5jaGVkYWxtb25kXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM1LCBcImJcIjogMjA1LCBcImhcIjogMC4wOTk5OTk5OTk5OTk5OTk5NCwgXCJzXCI6IDEsIFwibFwiOiAwLjkwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiclwiOiAxMzgsIFwiZ1wiOiA0MywgXCJiXCI6IDIyNiwgXCJoXCI6IDAuNzUzMTg3NjEzODQzMzUxNCwgXCJzXCI6IDAuNzU5MzM2MDk5NTg1MDYyMSwgXCJsXCI6IDAuNTI3NDUwOTgwMzkyMTU2OSwgXCJhXCI6IDF9LFxuICAgIFwiYnJvd25cIjoge1wiclwiOiAxNjUsIFwiZ1wiOiA0MiwgXCJiXCI6IDQyLCBcImhcIjogMCwgXCJzXCI6IDAuNTk0MjAyODk4NTUwNzI0NywgXCJsXCI6IDAuNDA1ODgyMzUyOTQxMTc2NDcsIFwiYVwiOiAxfSxcbiAgICBcImJ1cmx5d29vZFwiOiB7XCJyXCI6IDIyMiwgXCJnXCI6IDE4NCwgXCJiXCI6IDEzNSwgXCJoXCI6IDAuMDkzODY5NzMxODAwNzY2MjYsIFwic1wiOiAwLjU2ODYyNzQ1MDk4MDM5MjIsIFwibFwiOiAwLjcsIFwiYVwiOiAxfSxcbiAgICBcImNhZGV0Ymx1ZVwiOiB7XCJyXCI6IDk1LCBcImdcIjogMTU4LCBcImJcIjogMTYwLCBcImhcIjogMC41MDUxMjgyMDUxMjgyMDUxLCBcInNcIjogMC4yNTQ5MDE5NjA3ODQzMTM3LCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDAuMjUwMzI2Nzk3Mzg1NjIwOSwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDEwNSwgXCJiXCI6IDMwLCBcImhcIjogMC4wNjk0NDQ0NDQ0NDQ0NDQ0MywgXCJzXCI6IDAuNzQ5OTk5OTk5OTk5OTk5OSwgXCJsXCI6IDAuNDcwNTg4MjM1Mjk0MTE3NjQsIFwiYVwiOiAxfSxcbiAgICBcImNvcmFsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTI3LCBcImJcIjogODAsIFwiaFwiOiAwLjA0NDc2MTkwNDc2MTkwNDc2LCBcInNcIjogMSwgXCJsXCI6IDAuNjU2ODYyNzQ1MDk4MDM5MiwgXCJhXCI6IDF9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiclwiOiAxMDAsIFwiZ1wiOiAxNDksIFwiYlwiOiAyMzcsIFwiaFwiOiAwLjYwNzA1NTk2MTA3MDU1OTYsIFwic1wiOiAwLjc5MTkwNzUxNDQ1MDg2NzIsIFwibFwiOiAwLjY2MDc4NDMxMzcyNTQ5MDIsIFwiYVwiOiAxfSxcbiAgICBcImNvcm5zaWxrXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ4LCBcImJcIjogMjIwLCBcImhcIjogMC4xMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuOTMxMzcyNTQ5MDE5NjA3OSwgXCJhXCI6IDF9LFxuICAgIFwiY3JpbXNvblwiOiB7XCJyXCI6IDIyMCwgXCJnXCI6IDIwLCBcImJcIjogNjAsIFwiaFwiOiAwLjk2NjY2NjY2NjY2NjY2NjcsIFwic1wiOiAwLjgzMzMzMzMzMzMzMzMzMzUsIFwibFwiOiAwLjQ3MDU4ODIzNTI5NDExNzY0LCBcImFcIjogMX0sXG4gICAgXCJkYXJrYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTM5LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2N5YW5cIjoge1wiclwiOiAwLCBcImdcIjogMTM5LCBcImJcIjogMTM5LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2dvbGRlbnJvZFwiOiB7XCJyXCI6IDE4NCwgXCJnXCI6IDEzNCwgXCJiXCI6IDExLCBcImhcIjogMC4xMTg0OTcxMDk4MjY1ODk2LCBcInNcIjogMC44ODcxNzk0ODcxNzk0ODcyLCBcImxcIjogMC4zODIzNTI5NDExNzY0NzA1NiwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2dyYXlcIjogeyBcInJcIjogMTY5LCBcImdcIjogMTY5LCBcImJcIjogMTY5LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjY2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMDAsIFwiYlwiOiAwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuMTk2MDc4NDMxMzcyNTQ5MDIsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtncmV5XCI6IHsgXCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC42NjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJkYXJra2hha2lcIjoge1wiclwiOiAxODksIFwiZ1wiOiAxODMsIFwiYlwiOiAxMDcsIFwiaFwiOiAwLjE1NDQ3MTU0NDcxNTQ0NzEzLCBcInNcIjogMC4zODMxNzc1NzAwOTM0NTgwNCwgXCJsXCI6IDAuNTgwMzkyMTU2ODYyNzQ1MSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya21hZ2VudGFcIjoge1wiclwiOiAxMzksIFwiZ1wiOiAwLCBcImJcIjogMTM5LCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya29saXZlZ3JlZW5cIjoge1wiclwiOiA4NSwgXCJnXCI6IDEwNywgXCJiXCI6IDQ3LCBcImhcIjogMC4yMjc3Nzc3Nzc3Nzc3Nzc3NywgXCJzXCI6IDAuMzg5NjEwMzg5NjEwMzg5NiwgXCJsXCI6IDAuMzAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya29yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE0MCwgXCJiXCI6IDAsIFwiaFwiOiAwLjA5MTUwMzI2Nzk3Mzg1NjIyLCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJyXCI6IDE1MywgXCJnXCI6IDUwLCBcImJcIjogMjA0LCBcImhcIjogMC43NzgxMzg1MjgxMzg1MjgxLCBcInNcIjogMC42MDYyOTkyMTI1OTg0MjUyLCBcImxcIjogMC40OTgwMzkyMTU2ODYyNzQ1LCBcImFcIjogMX0sXG4gICAgXCJkYXJrcmVkXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJyXCI6IDIzMywgXCJnXCI6IDE1MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDAuMDQyMDQyMDQyMDQyMDQyMDQsIFwic1wiOiAwLjcxNjEyOTAzMjI1ODA2NDMsIFwibFwiOiAwLjY5NjA3ODQzMTM3MjU0OSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcInJcIjogMTQzLCBcImdcIjogMTg4LCBcImJcIjogMTQzLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC4yNTEzOTY2NDgwNDQ2OTI4LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2xhdGVibHVlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiA2MSwgXCJiXCI6IDEzOSwgXCJoXCI6IDAuNjkwMTcwOTQwMTcwOTQsIFwic1wiOiAwLjM4OTk5OTk5OTk5OTk5OTksIFwibFwiOiAwLjM5MjE1Njg2Mjc0NTA5ODAzLCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMC41LCBcInNcIjogMC4yNTM5NjgyNTM5NjgyNTM5NSwgXCJsXCI6IDAuMjQ3MDU4ODIzNTI5NDExNzgsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtzbGF0ZWdyZXlcIjoge1wiclwiOiA0NywgXCJnXCI6IDc5LCBcImJcIjogNzksIFwiaFwiOiAwLjUsIFwic1wiOiAwLjI1Mzk2ODI1Mzk2ODI1Mzk1LCBcImxcIjogMC4yNDcwNTg4MjM1Mjk0MTE3OCwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3R1cnF1b2lzZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMDksIFwiaFwiOiAwLjUwMjM5MjM0NDQ5NzYwNzYsIFwic1wiOiAxLCBcImxcIjogMC40MDk4MDM5MjE1Njg2Mjc0NCwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3Zpb2xldFwiOiB7XCJyXCI6IDE0OCwgXCJnXCI6IDAsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLjc4MzU3MDMwMDE1Nzk3NzgsIFwic1wiOiAxLCBcImxcIjogMC40MTM3MjU0OTAxOTYwNzg0LCBcImFcIjogMX0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIwLCBcImJcIjogMTQ3LCBcImhcIjogMC45MDk5MjkwNzgwMTQxODQ0LCBcInNcIjogMSwgXCJsXCI6IDAuNTM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwiZGVlcHNreWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMTkxLCBcImJcIjogMjU1LCBcImhcIjogMC41NDE4MzAwNjUzNTk0NzcxLCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZGltZ3JheVwiOiB7IFwiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNDExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwiZGltZ3JleVwiOiB7IFwiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNDExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJyXCI6IDMwLCBcImdcIjogMTQ0LCBcImJcIjogMjU1LCBcImhcIjogMC41ODIyMjIyMjIyMjIyMjIyLCBcInNcIjogMSwgXCJsXCI6IDAuNTU4ODIzNTI5NDExNzY0NywgXCJhXCI6IDF9LFxuICAgIFwiZmlyZWJyaWNrXCI6IHtcInJcIjogMTc4LCBcImdcIjogMzQsIFwiYlwiOiAzNCwgXCJoXCI6IDAsIFwic1wiOiAwLjY3OTI0NTI4MzAxODg2OCwgXCJsXCI6IDAuNDE1Njg2Mjc0NTA5ODAzOSwgXCJhXCI6IDF9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNDAsIFwiaFwiOiAwLjExMTExMTExMTExMTExMTAxLCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiclwiOiAzNCwgXCJnXCI6IDEzOSwgXCJiXCI6IDM0LCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC42MDY5MzY0MTYxODQ5NzEyLCBcImxcIjogMC4zMzkyMTU2ODYyNzQ1MDk3NiwgXCJhXCI6IDF9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHsgXCJyXCI6IDIyMCwgXCJnXCI6IDIyMCwgXCJiXCI6IDIyMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC44NjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcInJcIjogMjQ4LCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuOTg2Mjc0NTA5ODAzOTIxNiwgXCJhXCI6IDF9LFxuICAgIFwiZ29sZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxNSwgXCJiXCI6IDAsIFwiaFwiOiAwLjE0MDUyMjg3NTgxNjk5MzQ2LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZ29sZGVucm9kXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTY1LCBcImJcIjogMzIsIFwiaFwiOiAwLjExOTE3NTYyNzI0MDE0MzM3LCBcInNcIjogMC43NDQsIFwibFwiOiAwLjQ5MDE5NjA3ODQzMTM3MjUzLCBcImFcIjogMX0sXG4gICAgXCJncmVlbnllbGxvd1wiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDI1NSwgXCJiXCI6IDQ3LCBcImhcIjogMC4yMzIzNzE3OTQ4NzE3OTQ4NSwgXCJzXCI6IDEsIFwibFwiOiAwLjU5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwiZ3JleVwiOiB7IFwiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJob3RwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTA1LCBcImJcIjogMTgwLCBcImhcIjogMC45MTY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuNzA1ODgyMzUyOTQxMTc2NCwgXCJhXCI6IDF9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcInJcIjogMjA1LCBcImdcIjogOTIsIFwiYlwiOiA5MiwgXCJoXCI6IDAsIFwic1wiOiAwLjUzMDUxNjQzMTkyNDg4MjcsIFwibFwiOiAwLjU4MjM1Mjk0MTE3NjQ3MDYsIFwiYVwiOiAxfSxcbiAgICBcImluZGlnb1wiOiB7XCJyXCI6IDc1LCBcImdcIjogMCwgXCJiXCI6IDEzMCwgXCJoXCI6IDAuNzYyODIwNTEyODIwNTEyOCwgXCJzXCI6IDEsIFwibFwiOiAwLjI1NDkwMTk2MDc4NDMxMzcsIFwiYVwiOiAxfSxcbiAgICBcIml2b3J5XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImtoYWtpXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjMwLCBcImJcIjogMTQwLCBcImhcIjogMC4xNSwgXCJzXCI6IDAuNzY5MjMwNzY5MjMwNzY5MiwgXCJsXCI6IDAuNzQ1MDk4MDM5MjE1Njg2MywgXCJhXCI6IDF9LFxuICAgIFwibGF2ZW5kZXJcIjoge1wiclwiOiAyMzAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAyNTAsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwibFwiOiAwLjk0MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcImxhdmVuZGVyYmx1c2hcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyNDUsIFwiaFwiOiAwLjk0NDQ0NDQ0NDQ0NDQ0NDMsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiclwiOiAxMjQsIFwiZ1wiOiAyNTIsIFwiYlwiOiAwLCBcImhcIjogMC4yNTEzMjI3NTEzMjI3NTEzNCwgXCJzXCI6IDEsIFwibFwiOiAwLjQ5NDExNzY0NzA1ODgyMzU1LCBcImFcIjogMX0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMDUsIFwiaFwiOiAwLjE0OTk5OTk5OTk5OTk5OTk3LCBcInNcIjogMSwgXCJsXCI6IDAuOTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcInJcIjogMTczLCBcImdcIjogMjE2LCBcImJcIjogMjMwLCBcImhcIjogMC41NDA5MzU2NzI1MTQ2MTk4LCBcInNcIjogMC41MzI3MTAyODAzNzM4MzE2LCBcImxcIjogMC43OTAxOTYwNzg0MzEzNzI2LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGNvcmFsXCI6IHtcInJcIjogMjQwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAuNzg4NzMyMzk0MzY2MTk3MSwgXCJsXCI6IDAuNzIxNTY4NjI3NDUwOTgwNCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRjeWFuXCI6IHtcInJcIjogMjI0LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuOTM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMTAsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMC44MDAwMDAwMDAwMDAwMDAyLCBcImxcIjogMC45MDE5NjA3ODQzMTM3MjU0LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGdyYXlcIjogeyBcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjgyNzQ1MDk4MDM5MjE1NjgsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Z3JlZW5cIjoge1wiclwiOiAxNDQsIFwiZ1wiOiAyMzgsIFwiYlwiOiAxNDQsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjczNDM3NSwgXCJsXCI6IDAuNzQ5MDE5NjA3ODQzMTM3MywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRncmV5XCI6IHsgXCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC44Mjc0NTA5ODAzOTIxNTY4LCBcImFcIjogMX0sXG4gICAgXCJsaWdodHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxODIsIFwiYlwiOiAxOTMsIFwiaFwiOiAwLjk3NDg4NTg0NDc0ODg1ODQsIFwic1wiOiAxLCBcImxcIjogMC44NTY4NjI3NDUwOTgwMzkzLCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNhbG1vblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDAuMDQ3NjE5MDQ3NjE5MDQ3NTk2LCBcInNcIjogMSwgXCJsXCI6IDAuNzM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzZWFncmVlblwiOiB7XCJyXCI6IDMyLCBcImdcIjogMTc4LCBcImJcIjogMTcwLCBcImhcIjogMC40OTA4Njc1Nzk5MDg2NzU3NCwgXCJzXCI6IDAuNjk1MjM4MDk1MjM4MDk1MiwgXCJsXCI6IDAuNDExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRza3libHVlXCI6IHtcInJcIjogMTM1LCBcImdcIjogMjA2LCBcImJcIjogMjUwLCBcImhcIjogMC41NjM3NjgxMTU5NDIwMjg5LCBcInNcIjogMC45MiwgXCJsXCI6IDAuNzU0OTAxOTYwNzg0MzEzNywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjE0Mjg1NzE0Mjg1NzE0Mjg1LCBcImxcIjogMC41MzMzMzMzMzMzMzMzMzMzLCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDAuNTgzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuMTQyODU3MTQyODU3MTQyODUsIFwibFwiOiAwLjUzMzMzMzMzMzMzMzMzMzMsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMTk2LCBcImJcIjogMjIyLCBcImhcIjogMC41OTQyMDI4OTg1NTA3MjQ2LCBcInNcIjogMC40MTA3MTQyODU3MTQyODU3NSwgXCJsXCI6IDAuNzgwMzkyMTU2ODYyNzQ1MSwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMjQsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuOTM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwibGltZWdyZWVuXCI6IHtcInJcIjogNTAsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuNjA3ODQzMTM3MjU0OTAyLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJsaW5lblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI0MCwgXCJiXCI6IDIzMCwgXCJoXCI6IDAuMDgzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwibFwiOiAwLjk0MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiclwiOiAxMDIsIFwiZ1wiOiAyMDUsIFwiYlwiOiAxNzAsIFwiaFwiOiAwLjQ0MzM2NTY5NTc5Mjg4MDIsIFwic1wiOiAwLjUwNzM4OTE2MjU2MTU3NjQsIFwibFwiOiAwLjYwMTk2MDc4NDMxMzcyNTYsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDIwNSwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjQwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJyXCI6IDE4NiwgXCJnXCI6IDg1LCBcImJcIjogMjExLCBcImhcIjogMC44MDAyNjQ1NTAyNjQ1NTAyLCBcInNcIjogMC41ODg3ODUwNDY3Mjg5NzE4LCBcImxcIjogMC41ODAzOTIxNTY4NjI3NDUsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXB1cnBsZVwiOiB7XCJyXCI6IDE0NywgXCJnXCI6IDExMiwgXCJiXCI6IDIxOSwgXCJoXCI6IDAuNzIxMTgzODAwNjIzMDUzLCBcInNcIjogMC41OTc3NjUzNjMxMjg0OTE2LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzcyLCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1zZWFncmVlblwiOiB7XCJyXCI6IDYwLCBcImdcIjogMTc5LCBcImJcIjogMTEzLCBcImhcIjogMC40MDc1NjMwMjUyMTAwODQxLCBcInNcIjogMC40OTc5MDc5NDk3OTA3OTQ5NSwgXCJsXCI6IDAuNDY4NjI3NDUwOTgwMzkyMTYsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEyMywgXCJnXCI6IDEwNCwgXCJiXCI6IDIzOCwgXCJoXCI6IDAuNjkwMjk4NTA3NDYyNjg2NSwgXCJzXCI6IDAuNzk3NjE5MDQ3NjE5MDQ3NywgXCJsXCI6IDAuNjcwNTg4MjM1Mjk0MTE3NywgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjUwLCBcImJcIjogMTU0LCBcImhcIjogMC40MzYsIFwic1wiOiAxLCBcImxcIjogMC40OTAxOTYwNzg0MzEzNzI1MywgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiAyMDksIFwiYlwiOiAyMDQsIFwiaFwiOiAwLjQ5MzkxNzI3NDkzOTE3Mjc2LCBcInNcIjogMC41OTgyNTMyNzUxMDkxNzAzLCBcImxcIjogMC41NTA5ODAzOTIxNTY4NjI4LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiclwiOiAxOTksIFwiZ1wiOiAyMSwgXCJiXCI6IDEzMywgXCJoXCI6IDAuODk1MTMxMDg2MTQyMzIyMSwgXCJzXCI6IDAuODA5MDkwOTA5MDkwOTA5LCBcImxcIjogMC40MzEzNzI1NDkwMTk2MDc4NiwgXCJhXCI6IDF9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcInJcIjogMjUsIFwiZ1wiOiAyNSwgXCJiXCI6IDExMiwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDAuNjM1MDM2NDk2MzUwMzY1LCBcImxcIjogMC4yNjg2Mjc0NTA5ODAzOTIxNSwgXCJhXCI6IDF9LFxuICAgIFwibWludGNyZWFtXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjU1LCBcImJcIjogMjUwLCBcImhcIjogMC40MTY2NjY2NjY2NjY2NjY0NiwgXCJzXCI6IDEsIFwibFwiOiAwLjk4MDM5MjE1Njg2Mjc0NTIsIFwiYVwiOiAxfSxcbiAgICBcIm1pc3R5cm9zZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDIyNSwgXCJoXCI6IDAuMDE2NjY2NjY2NjY2NjY2NzU3LCBcInNcIjogMSwgXCJsXCI6IDAuOTQxMTc2NDcwNTg4MjM1MywgXCJhXCI6IDF9LFxuICAgIFwibW9jY2FzaW5cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxODEsIFwiaFwiOiAwLjEwNTg1NTg1NTg1NTg1NTg4LCBcInNcIjogMSwgXCJsXCI6IDAuODU0OTAxOTYwNzg0MzEzOCwgXCJhXCI6IDF9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzMsIFwiaFwiOiAwLjA5OTU5MzQ5NTkzNDk1OTM2LCBcInNcIjogMSwgXCJsXCI6IDAuODM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJyXCI6IDI1MywgXCJnXCI6IDI0NSwgXCJiXCI6IDIzMCwgXCJoXCI6IDAuMTA4Njk1NjUyMTczOTEzMDQsIFwic1wiOiAwLjg1MTg1MTg1MTg1MTg1MjMsIFwibFwiOiAwLjk0NzA1ODgyMzUyOTQxMTcsIFwiYVwiOiAxfSxcbiAgICBcIm9saXZlZHJhYlwiOiB7XCJyXCI6IDEwNywgXCJnXCI6IDE0MiwgXCJiXCI6IDM1LCBcImhcIjogMC4yMjExODM4MDA2MjMwNTI5NiwgXCJzXCI6IDAuNjA0NTE5Nzc0MDExMjk5NCwgXCJsXCI6IDAuMzQ3MDU4ODIzNTI5NDExNzUsIFwiYVwiOiAxfSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDY5LCBcImJcIjogMCwgXCJoXCI6IDAuMDQ1MDk4MDM5MjE1Njg2MjYsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJvcmNoaWRcIjoge1wiclwiOiAyMTgsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTQsIFwiaFwiOiAwLjgzOTYyMjY0MTUwOTQzMzksIFwic1wiOiAwLjU4ODg4ODg4ODg4ODg4ODksIFwibFwiOiAwLjY0NzA1ODgyMzUyOTQxMTcsIFwiYVwiOiAxfSxcbiAgICBcInBhbGVnb2xkZW5yb2RcIjoge1wiclwiOiAyMzgsIFwiZ1wiOiAyMzIsIFwiYlwiOiAxNzAsIFwiaFwiOiAwLjE1MTk2MDc4NDMxMzcyNTQ4LCBcInNcIjogMC42NjY2NjY2NjY2NjY2NjY3LCBcImxcIjogMC44LCBcImFcIjogMX0sXG4gICAgXCJwYWxlZ3JlZW5cIjoge1wiclwiOiAxNTIsIFwiZ1wiOiAyNTEsIFwiYlwiOiAxNTIsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjkyNTIzMzY0NDg1OTgxMzEsIFwibFwiOiAwLjc5MDE5NjA3ODQzMTM3MjUsIFwiYVwiOiAxfSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiclwiOiAxNzUsIFwiZ1wiOiAyMzgsIFwiYlwiOiAyMzgsIFwiaFwiOiAwLjUsIFwic1wiOiAwLjY0OTQ4NDUzNjA4MjQ3NDMsIFwibFwiOiAwLjgwOTgwMzkyMTU2ODYyNzUsIFwiYVwiOiAxfSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiclwiOiAyMTksIFwiZ1wiOiAxMTIsIFwiYlwiOiAxNDcsIFwiaFwiOiAwLjk0NTQ4Mjg2NjA0MzYxMzgsIFwic1wiOiAwLjU5Nzc2NTM2MzEyODQ5MTYsIFwibFwiOiAwLjY0OTAxOTYwNzg0MzEzNzIsIFwiYVwiOiAxfSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzksIFwiYlwiOiAyMTMsIFwiaFwiOiAwLjEwMzE3NDYwMzE3NDYwMzE1LCBcInNcIjogMSwgXCJsXCI6IDAuOTE3NjQ3MDU4ODIzNTI5NSwgXCJhXCI6IDF9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE4LCBcImJcIjogMTg1LCBcImhcIjogMC4wNzg1NzE0Mjg1NzE0Mjg1NiwgXCJzXCI6IDEsIFwibFwiOiAwLjg2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcInBlcnVcIjoge1wiclwiOiAyMDUsIFwiZ1wiOiAxMzMsIFwiYlwiOiA2MywgXCJoXCI6IDAuMDgyMTU5NjI0NDEzMTQ1NTUsIFwic1wiOiAwLjU4Njc3Njg1OTUwNDEzMjMsIFwibFwiOiAwLjUyNTQ5MDE5NjA3ODQzMTQsIFwiYVwiOiAxfSxcbiAgICBcInBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxOTIsIFwiYlwiOiAyMDMsIFwiaFwiOiAwLjk3MDg5OTQ3MDg5OTQ3MDksIFwic1wiOiAxLCBcImxcIjogMC44NzY0NzA1ODgyMzUyOTQxLCBcImFcIjogMX0sXG4gICAgXCJwbHVtXCI6IHtcInJcIjogMjIxLCBcImdcIjogMTYwLCBcImJcIjogMjIxLCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC40NzI4NjgyMTcwNTQyNjM3LCBcImxcIjogMC43NDcwNTg4MjM1Mjk0MTE4LCBcImFcIjogMX0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMjI0LCBcImJcIjogMjMwLCBcImhcIjogMC41MTg1MTg1MTg1MTg1MTg2LCBcInNcIjogMC41MTkyMzA3NjkyMzA3NjkyLCBcImxcIjogMC43OTYwNzg0MzEzNzI1NDkxLCBcImFcIjogMX0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiclwiOiAxODgsIFwiZ1wiOiAxNDMsIFwiYlwiOiAxNDMsIFwiaFwiOiAwLCBcInNcIjogMC4yNTEzOTY2NDgwNDQ2OTI4LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiclwiOiA2NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDIyNSwgXCJoXCI6IDAuNjI1LCBcInNcIjogMC43MjcyNzI3MjcyNzI3MjcyLCBcImxcIjogMC41Njg2Mjc0NTA5ODAzOTIxLCBcImFcIjogMX0sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDY5LCBcImJcIjogMTksIFwiaFwiOiAwLjA2OTQ0NDQ0NDQ0NDQ0NDQzLCBcInNcIjogMC43NTk0OTM2NzA4ODYwNzYsIFwibFwiOiAwLjMwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcInNhbG1vblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDExNCwgXCJoXCI6IDAuMDE3MTU2ODYyNzQ1MDk4MDE2LCBcInNcIjogMC45MzE1MDY4NDkzMTUwNjgzLCBcImxcIjogMC43MTM3MjU0OTAxOTYwNzg0LCBcImFcIjogMX0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcInJcIjogMjQ0LCBcImdcIjogMTY0LCBcImJcIjogOTYsIFwiaFwiOiAwLjA3NjU3NjU3NjU3NjU3NjU5LCBcInNcIjogMC44NzA1ODgyMzUyOTQxMTc5LCBcImxcIjogMC42NjY2NjY2NjY2NjY2NjY3LCBcImFcIjogMX0sXG4gICAgXCJzZWFncmVlblwiOiB7XCJyXCI6IDQ2LCBcImdcIjogMTM5LCBcImJcIjogODcsIFwiaFwiOiAwLjQwNjgxMDAzNTg0MjI5MzksIFwic1wiOiAwLjUwMjcwMjcwMjcwMjcwMjYsIFwibFwiOiAwLjM2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcInNlYXNoZWxsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ1LCBcImJcIjogMjM4LCBcImhcIjogMC4wNjg2Mjc0NTA5ODAzOTIyLCBcInNcIjogMSwgXCJsXCI6IDAuOTY2NjY2NjY2NjY2NjY2NywgXCJhXCI6IDF9LFxuICAgIFwic2llbm5hXCI6IHtcInJcIjogMTYwLCBcImdcIjogODIsIFwiYlwiOiA0NSwgXCJoXCI6IDAuMDUzNjIzMTg4NDA1Nzk3MTA2LCBcInNcIjogMC41NjA5NzU2MDk3NTYwOTc1LCBcImxcIjogMC40MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJza3libHVlXCI6IHtcInJcIjogMTM1LCBcImdcIjogMjA2LCBcImJcIjogMjM1LCBcImhcIjogMC41NDgzMzMzMzMzMzMzMzMzLCBcInNcIjogMC43MTQyODU3MTQyODU3MTQsIFwibFwiOiAwLjcyNTQ5MDE5NjA3ODQzMTMsIFwiYVwiOiAxfSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEwNiwgXCJnXCI6IDkwLCBcImJcIjogMjA1LCBcImhcIjogMC42ODk4NTUwNzI0NjM3NjgxLCBcInNcIjogMC41MzQ4ODM3MjA5MzAyMzI2LCBcImxcIjogMC41Nzg0MzEzNzI1NDkwMTk3LCBcImFcIjogMX0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjEyNTk4NDI1MTk2ODUwMzk0LCBcImxcIjogMC41MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJzbGF0ZWdyZXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjEyNTk4NDI1MTk2ODUwMzk0LCBcImxcIjogMC41MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJzbm93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjUwLCBcImhcIjogMCwgXCJzXCI6IDEsIFwibFwiOiAwLjk5MDE5NjA3ODQzMTM3MjYsIFwiYVwiOiAxfSxcbiAgICBcInNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDEyNywgXCJoXCI6IDAuNDE2MzM5ODY5MjgxMDQ1NzcsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJzdGVlbGJsdWVcIjoge1wiclwiOiA3MCwgXCJnXCI6IDEzMCwgXCJiXCI6IDE4MCwgXCJoXCI6IDAuNTc1NzU3NTc1NzU3NTc1OCwgXCJzXCI6IDAuNDQsIFwibFwiOiAwLjQ5MDE5NjA3ODQzMTM3MjYsIFwiYVwiOiAxfSxcbiAgICBcInRhblwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDE4MCwgXCJiXCI6IDE0MCwgXCJoXCI6IDAuMDk1MjM4MDk1MjM4MDk1MjcsIFwic1wiOiAwLjQzNzQ5OTk5OTk5OTk5OTksIFwibFwiOiAwLjY4NjI3NDUwOTgwMzkyMTYsIFwiYVwiOiAxfSxcbiAgICBcInRoaXN0bGVcIjoge1wiclwiOiAyMTYsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyMTYsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjI0MjcxODQ0NjYwMTk0MTc4LCBcImxcIjogMC43OTgwMzkyMTU2ODYyNzQ2LCBcImFcIjogMX0sXG4gICAgXCJ0b21hdG9cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA5OSwgXCJiXCI6IDcxLCBcImhcIjogMC4wMjUzNjIzMTg4NDA1Nzk2OTQsIFwic1wiOiAxLCBcImxcIjogMC42MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJ0dXJxdW9pc2VcIjoge1wiclwiOiA2NCwgXCJnXCI6IDIyNCwgXCJiXCI6IDIwOCwgXCJoXCI6IDAuNDgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjcyMDcyMDcyMDcyMDcyMDcsIFwibFwiOiAwLjU2NDcwNTg4MjM1Mjk0MTIsIFwiYVwiOiAxfSxcbiAgICBcInZpb2xldFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDEzMCwgXCJiXCI6IDIzOCwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuNzYwNTYzMzgwMjgxNjkwMiwgXCJsXCI6IDAuNzIxNTY4NjI3NDUwOTgwNCwgXCJhXCI6IDF9LFxuICAgIFwid2hlYXRcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzksIFwiaFwiOiAwLjEwODU4NTg1ODU4NTg1ODYsIFwic1wiOiAwLjc2NzQ0MTg2MDQ2NTExNjgsIFwibFwiOiAwLjgzMTM3MjU0OTAxOTYwNzgsIFwiYVwiOiAxfSxcbiAgICBcIndoaXRlc21va2VcIjogeyBcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjQ1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjk2MDc4NDMxMzcyNTQ5MDIsIFwiYVwiOiAxfSxcbiAgICBcInllbGxvd2dyZWVuXCI6IHtcInJcIjogMTU0LCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiAwLjIyMTUwNTM3NjM0NDA4NjA0LCBcInNcIjogMC42MDc4NDMxMzcyNTQ5MDIsIFwibFwiOiAwLjUsIFwiYVwiOiAxfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjsiLCIvKiogXG4gKiBAY29uc3RhbnRcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgbnVtYmVyPn0gXG4gKi9cbnZhciBLRVlDT0RFUyA9IHtcbiAgICAnYmFja3NwYWNlJyA6IDgsXG4gICAgJ3RhYicgOiA5LFxuICAgICdlbnRlcicgOiAxMyxcbiAgICAnc2hpZnQnIDogMTYsXG4gICAgJ2N0cmwnIDogMTcsXG4gICAgJ2FsdCcgOiAxOCxcbiAgICAncGF1c2VfYnJlYWsnIDogMTksXG4gICAgJ2NhcHNfbG9jaycgOiAyMCxcbiAgICAnZXNjYXBlJyA6IDI3LFxuICAgICdwYWdlX3VwJyA6IDMzLFxuICAgICdwYWdlIGRvd24nIDogMzQsXG4gICAgJ2VuZCcgOiAzNSxcbiAgICAnaG9tZScgOiAzNixcbiAgICAnbGVmdF9hcnJvdycgOiAzNyxcbiAgICAndXBfYXJyb3cnIDogMzgsXG4gICAgJ3JpZ2h0X2Fycm93JyA6IDM5LFxuICAgICdkb3duX2Fycm93JyA6IDQwLFxuICAgICdpbnNlcnQnIDogNDUsXG4gICAgJ2RlbGV0ZScgOiA0NixcbiAgICAnMCcgOiA0OCxcbiAgICAnMScgOiA0OSxcbiAgICAnMicgOiA1MCxcbiAgICAnMycgOiA1MSxcbiAgICAnNCcgOiA1MixcbiAgICAnNScgOiA1MyxcbiAgICAnNicgOiA1NCxcbiAgICAnNycgOiA1NSxcbiAgICAnOCcgOiA1NixcbiAgICAnOScgOiA1NyxcbiAgICAnYScgOiA2NSxcbiAgICAnYicgOiA2NixcbiAgICAnYycgOiA2NyxcbiAgICAnZCcgOiA2OCxcbiAgICAnZScgOiA2OSxcbiAgICAnZicgOiA3MCxcbiAgICAnZycgOiA3MSxcbiAgICAnaCcgOiA3MixcbiAgICAnaScgOiA3MyxcbiAgICAnaicgOiA3NCxcbiAgICAnaycgOiA3NSxcbiAgICAnbCcgOiA3NixcbiAgICAnbScgOiA3NyxcbiAgICAnbicgOiA3OCxcbiAgICAnbycgOiA3OSxcbiAgICAncCcgOiA4MCxcbiAgICAncScgOiA4MSxcbiAgICAncicgOiA4MixcbiAgICAncycgOiA4MyxcbiAgICAndCcgOiA4NCxcbiAgICAndScgOiA4NSxcbiAgICAndicgOiA4NixcbiAgICAndycgOiA4NyxcbiAgICAneCcgOiA4OCxcbiAgICAneScgOiA4OSxcbiAgICAneicgOiA5MCxcbiAgICAnbGVmdF93aW5kb3cga2V5JyA6IDkxLFxuICAgICdyaWdodF93aW5kb3cga2V5JyA6IDkyLFxuICAgICdzZWxlY3Rfa2V5JyA6IDkzLFxuICAgICdudW1wYWQgMCcgOiA5NixcbiAgICAnbnVtcGFkIDEnIDogOTcsXG4gICAgJ251bXBhZCAyJyA6IDk4LFxuICAgICdudW1wYWQgMycgOiA5OSxcbiAgICAnbnVtcGFkIDQnIDogMTAwLFxuICAgICdudW1wYWQgNScgOiAxMDEsXG4gICAgJ251bXBhZCA2JyA6IDEwMixcbiAgICAnbnVtcGFkIDcnIDogMTAzLFxuICAgICdudW1wYWQgOCcgOiAxMDQsXG4gICAgJ251bXBhZCA5JyA6IDEwNSxcbiAgICAnbXVsdGlwbHknIDogMTA2LFxuICAgICdhZGQnIDogMTA3LFxuICAgICdzdWJ0cmFjdCcgOiAxMDksXG4gICAgJ2RlY2ltYWwgcG9pbnQnIDogMTEwLFxuICAgICdkaXZpZGUnIDogMTExLFxuICAgICdmMScgOiAxMTIsXG4gICAgJ2YyJyA6IDExMyxcbiAgICAnZjMnIDogMTE0LFxuICAgICdmNCcgOiAxMTUsXG4gICAgJ2Y1JyA6IDExNixcbiAgICAnZjYnIDogMTE3LFxuICAgICdmNycgOiAxMTgsXG4gICAgJ2Y4JyA6IDExOSxcbiAgICAnZjknIDogMTIwLFxuICAgICdmMTAnIDogMTIxLFxuICAgICdmMTEnIDogMTIyLFxuICAgICdmMTInIDogMTIzLFxuICAgICdudW1fbG9jaycgOiAxNDQsXG4gICAgJ3Njcm9sbF9sb2NrJyA6IDE0NSxcbiAgICAnc2VtaV9jb2xvbicgOiAxODYsXG4gICAgJ2VxdWFsX3NpZ24nIDogMTg3LFxuICAgICdjb21tYScgOiAxODgsXG4gICAgJ2Rhc2gnIDogMTg5LFxuICAgICdwZXJpb2QnIDogMTkwLFxuICAgICdmb3J3YXJkX3NsYXNoJyA6IDE5MSxcbiAgICAnZ3JhdmVfYWNjZW50JyA6IDE5MixcbiAgICAnb3Blbl9icmFja2V0JyA6IDIxOSxcbiAgICAnYmFja3NsYXNoJyA6IDIyMCxcbiAgICAnY2xvc2VicmFja2V0JyA6IDIyMSxcbiAgICAnc2luZ2xlX3F1b3RlJyA6IDIyMlxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBLRVlDT0RFUzsiLCJyZXF1aXJlKCcuLy4uL3Rlc3RzL2RhdGEvY29sb3JzLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2VuZ2luZS9jYW1lcmEuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZW5naW5lL3NjZW5lLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvZmFjZS5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL21hdHJpeC5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL21lc2guanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC92ZWN0b3IuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvdXRpbGl0eS9jb2xvci5qcycpO1xuIiwidmFyIGNvbG9ybGlzdCA9IFtcIkFsaWNlQmx1ZVwiLCBcIkFudGlxdWVXaGl0ZVwiLCBcIkFxdWFcIiwgXCJBcXVhbWFyaW5lXCIsIFwiQXp1cmVcIiwgXCJCZWlnZVwiLCBcIkJpc3F1ZVwiLCBcIkJsYWNrXCIsIFwiQmxhbmNoZWRBbG1vbmRcIiwgXCJCbHVlXCIsIFwiQmx1ZVZpb2xldFwiLCBcIkJyb3duXCIsIFwiQnVybHlXb29kXCIsIFwiQ2FkZXRCbHVlXCIsIFwiQ2hhcnRyZXVzZVwiLCBcIkNob2NvbGF0ZVwiLCBcIkNvcmFsXCIsIFwiQ29ybmZsb3dlckJsdWVcIiwgXCJDb3Juc2lsa1wiLCBcIkNyaW1zb25cIiwgXCJDeWFuXCIsIFwiRGFya0JsdWVcIiwgXCJEYXJrQ3lhblwiLCBcIkRhcmtHb2xkZW5Sb2RcIiwgXCJEYXJrR3JheVwiLCBcIkRhcmtHcmV5XCIsIFwiRGFya0dyZWVuXCIsIFwiRGFya0toYWtpXCIsIFwiRGFya01hZ2VudGFcIiwgXCJEYXJrT2xpdmVHcmVlblwiLCBcIkRhcmtvcmFuZ2VcIiwgXCJEYXJrT3JjaGlkXCIsIFwiRGFya1JlZFwiLCBcIkRhcmtTYWxtb25cIiwgXCJEYXJrU2VhR3JlZW5cIiwgXCJEYXJrU2xhdGVCbHVlXCIsIFwiRGFya1NsYXRlR3JheVwiLCBcIkRhcmtTbGF0ZUdyZXlcIiwgXCJEYXJrVHVycXVvaXNlXCIsIFwiRGFya1Zpb2xldFwiLCBcIkRlZXBQaW5rXCIsIFwiRGVlcFNreUJsdWVcIiwgXCJEaW1HcmF5XCIsIFwiRGltR3JleVwiLCBcIkRvZGdlckJsdWVcIiwgXCJGaXJlQnJpY2tcIiwgXCJGbG9yYWxXaGl0ZVwiLCBcIkZvcmVzdEdyZWVuXCIsIFwiRnVjaHNpYVwiLCBcIkdhaW5zYm9yb1wiLCBcIkdob3N0V2hpdGVcIiwgXCJHb2xkXCIsIFwiR29sZGVuUm9kXCIsIFwiR3JheVwiLCBcIkdyZXlcIiwgXCJHcmVlblwiLCBcIkdyZWVuWWVsbG93XCIsIFwiSG9uZXlEZXdcIiwgXCJIb3RQaW5rXCIsIFwiSW5kaWFuUmVkXCIsIFwiSW5kaWdvXCIsIFwiSXZvcnlcIiwgXCJLaGFraVwiLCBcIkxhdmVuZGVyXCIsIFwiTGF2ZW5kZXJCbHVzaFwiLCBcIkxhd25HcmVlblwiLCBcIkxlbW9uQ2hpZmZvblwiLCBcIkxpZ2h0Qmx1ZVwiLCBcIkxpZ2h0Q29yYWxcIiwgXCJMaWdodEN5YW5cIiwgXCJMaWdodEdvbGRlblJvZFllbGxvd1wiLCBcIkxpZ2h0R3JheVwiLCBcIkxpZ2h0R3JleVwiLCBcIkxpZ2h0R3JlZW5cIiwgXCJMaWdodFBpbmtcIiwgXCJMaWdodFNhbG1vblwiLCBcIkxpZ2h0U2VhR3JlZW5cIiwgXCJMaWdodFNreUJsdWVcIiwgXCJMaWdodFNsYXRlR3JheVwiLCBcIkxpZ2h0U2xhdGVHcmV5XCIsIFwiTGlnaHRTdGVlbEJsdWVcIiwgXCJMaWdodFllbGxvd1wiLCBcIkxpbWVcIiwgXCJMaW1lR3JlZW5cIiwgXCJMaW5lblwiLCBcIk1hZ2VudGFcIiwgXCJNYXJvb25cIiwgXCJNZWRpdW1BcXVhTWFyaW5lXCIsIFwiTWVkaXVtQmx1ZVwiLCBcIk1lZGl1bU9yY2hpZFwiLCBcIk1lZGl1bVB1cnBsZVwiLCBcIk1lZGl1bVNlYUdyZWVuXCIsIFwiTWVkaXVtU2xhdGVCbHVlXCIsIFwiTWVkaXVtU3ByaW5nR3JlZW5cIiwgXCJNZWRpdW1UdXJxdW9pc2VcIiwgXCJNZWRpdW1WaW9sZXRSZWRcIiwgXCJNaWRuaWdodEJsdWVcIiwgXCJNaW50Q3JlYW1cIiwgXCJNaXN0eVJvc2VcIiwgXCJNb2NjYXNpblwiLCBcIk5hdmFqb1doaXRlXCIsIFwiTmF2eVwiLCBcIk9sZExhY2VcIiwgXCJPbGl2ZVwiLCBcIk9saXZlRHJhYlwiLCBcIk9yYW5nZVwiLCBcIk9yYW5nZVJlZFwiLCBcIk9yY2hpZFwiLCBcIlBhbGVHb2xkZW5Sb2RcIiwgXCJQYWxlR3JlZW5cIiwgXCJQYWxlVHVycXVvaXNlXCIsIFwiUGFsZVZpb2xldFJlZFwiLCBcIlBhcGF5YVdoaXBcIiwgXCJQZWFjaFB1ZmZcIiwgXCJQZXJ1XCIsIFwiUGlua1wiLCBcIlBsdW1cIiwgXCJQb3dkZXJCbHVlXCIsIFwiUHVycGxlXCIsIFwiUmVkXCIsIFwiUm9zeUJyb3duXCIsIFwiUm95YWxCbHVlXCIsIFwiU2FkZGxlQnJvd25cIiwgXCJTYWxtb25cIiwgXCJTYW5keUJyb3duXCIsIFwiU2VhR3JlZW5cIiwgXCJTZWFTaGVsbFwiLCBcIlNpZW5uYVwiLCBcIlNpbHZlclwiLCBcIlNreUJsdWVcIiwgXCJTbGF0ZUJsdWVcIiwgXCJTbGF0ZUdyYXlcIiwgXCJTbGF0ZUdyZXlcIiwgXCJTbm93XCIsIFwiU3ByaW5nR3JlZW5cIiwgXCJTdGVlbEJsdWVcIiwgXCJUYW5cIiwgXCJUZWFsXCIsIFwiVGhpc3RsZVwiLCBcIlRvbWF0b1wiLCBcIlR1cnF1b2lzZVwiLCBcIlZpb2xldFwiLCBcIldoZWF0XCIsIFwiV2hpdGVcIiwgXCJXaGl0ZVNtb2tlXCIsIFwiWWVsbG93XCIsIFwiWWVsbG93R3JlZW5cIl07XG5cbm1vZHVsZS5leHBvcnRzID0gY29sb3JsaXN0OyIsInZhciBDYW1lcmEgPSByZXF1aXJlKCcuLi8uLi9zcmMvZW5naW5lL2NhbWVyYS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdDYW1lcmEnLCBmdW5jdGlvbigpe1xuICAgIHZhciBjYW1lcmE7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgY2FtZXJhID0gbmV3IENhbWVyYSg2MDAsIDQwMCk7XG4gICAgfSlcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2hlaWdodCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soY2FtZXJhLmhlaWdodCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoY2FtZXJhLmhlaWdodCwgNDAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuXG4gICAgfSk7XG59KTsiLCJ2YXIgU2NlbmUgPSByZXF1aXJlKCcuLi8uLi9zcmMvZW5naW5lL3NjZW5lLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ1NjZW5lJywgZnVuY3Rpb24oKXtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICAvL3ZhciBzY2VuZSA9IG5ldyBTY2VuZSh7Y2FudmFzX2lkOiAnd2lyZWZyYW1lJywgd2lkdGg6NjAwLCBoZWlnaHQ6NDAwfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdoZWlnaHQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gYXNzZXJ0LmVxdWFsKHNjZW5lLmhlaWdodCwgNDAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICBcbiAgICB9KVxufSk7IiwidmFyIEZhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9mYWNlLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxudmFyIGZhY2U7XG5cbnN1aXRlKCdGYWNlJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZmFjZTtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICBmYWNlID0gbmV3IEZhY2UoMCwgMSwgMiwgXCJyZWRcIik7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdjb2xvcicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZmFjZS5jb2xvci5yZ2IuciwgMjU1KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuXG4gICAgfSk7XG59KTsiLCJ2YXIgTWF0cml4ID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvbWF0cml4LmpzJyk7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvdmVjdG9yLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ01hdHJpeCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHplcm8sIHplcm8yLCB6ZXJvMywgaWRlbnRpdHksIGlkZW50aXR5MiwgaWRlbnRpdHkzLCBvbmVzLCBtMCwgbTEsIG0yLCBtMywgbTQsIG01LCBtNiwgbTcsIGFuZ2xlcztcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICBhbmdsZXMgPSBbMCwgTWF0aC5QSSAvIDIsIE1hdGguUEksIDMqTWF0aC5QSSAvIDIsIE1hdGguUEkgLyAyXTtcbiAgICAgICAgemVybyA9IE1hdHJpeC56ZXJvKCk7XG4gICAgICAgIHplcm8yID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICB6ZXJvMyA9IE1hdHJpeC5mcm9tQXJyYXkoWzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdKTtcbiAgICAgICAgaWRlbnRpdHkgPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgICAgaWRlbnRpdHkyID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBpZGVudGl0eTMgPSBNYXRyaXguZnJvbUFycmF5KFsxLDAsMCwwLDAsMSwwLDAsMCwwLDEsMCwwLDAsMCwxXSk7XG4gICAgICAgIGlkZW50aXR5MlswXSA9IDE7XG4gICAgICAgIGlkZW50aXR5Mls1XSA9IDE7XG4gICAgICAgIGlkZW50aXR5MlsxMF0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbMTVdID0gMTtcbiAgICAgICAgb25lcyA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTAgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0xID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTMgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG00ID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtNFswXSA9IDA7XG4gICAgICAgIG00WzFdID0gMTtcbiAgICAgICAgbTRbMl0gPSAxO1xuICAgICAgICBtNFszXSA9IDI7XG4gICAgICAgIG00WzRdID0gMztcbiAgICAgICAgbTRbNV0gPSA1O1xuICAgICAgICBtNFs2XSA9IDg7XG4gICAgICAgIG00WzddID0gMTM7XG4gICAgICAgIG00WzhdID0gMjE7XG4gICAgICAgIG00WzldID0gMzQ7XG4gICAgICAgIG00WzEwXSA9IDU1O1xuICAgICAgICBtNFsxMV0gPSA4OTtcbiAgICAgICAgbTRbMTJdID0gMTQ0O1xuICAgICAgICBtNFsxM10gPSAyMzM7XG4gICAgICAgIG00WzE0XSA9IDM3NztcbiAgICAgICAgbTRbMTVdID0gNjEwO1xuICAgICAgICBtNSA9IE1hdHJpeC5mcm9tQXJyYXkoWzAsIDEsIDEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgMTQ0LCAyMzMsIDM3NywgNjEwXSk7XG4gICAgICAgIG02ID0gTWF0cml4LmZyb21BcnJheShbMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgMSwgMiwgMywgNCwgNSwgNiwgNywgOF0pO1xuICAgICAgICBtNyA9IE1hdHJpeC5mcm9tQXJyYXkoWzM0LCA0NCwgNTQsIDY0LCA4MiwgMTA4LCAxMzQsIDE2MCwgMzQsIDQ0LCA1NCwgNjQsIDgyLCAxMDgsIDEzNCwgMTYwXSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICBvbmVzW2ldID0gMTtcbiAgICAgICAgICAgIG0wW2ldID0gaTtcbiAgICAgICAgICAgIG0xW2ldID0gaSsxO1xuICAgICAgICAgICAgbTJbaV0gPSBpKzI7XG4gICAgICAgICAgICBtM1tpXSA9IGkqMjtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbGVuZ3RoJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHplcm8yLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHplcm8zLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5Lmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5Mi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtMS5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtMi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtMy5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtNC5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtNS5sZW5ndGgsIDE2KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdlcXVhbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvMi5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFpZGVudGl0eS5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobTQuZXF1YWwobTUpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghbTAuZXF1YWwobTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghbTAuZXF1YWwobTIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghbTAuZXF1YWwobTMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FkZCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB6ZXJvLmFkZChtMSk7XG4gICAgICAgICAgICB2YXIgdDIgPSBtMC5hZGQob25lcyk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMC5hZGQob25lcykuYWRkKG9uZXMpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwobTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbChtMikpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTQuc3VidHJhY3QobTUpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTEuc3VidHJhY3Qob25lcyk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMi5zdWJ0cmFjdChtMSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG0wKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwob25lcykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHlTY2FsYXInLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTAubXVsdGlwbHlTY2FsYXIoMik7XG4gICAgICAgICAgICB2YXIgdDIgPSB6ZXJvLm11bHRpcGx5U2NhbGFyKDIwKTtcbiAgICAgICAgICAgIHZhciB0MyA9IG0wLm11bHRpcGx5U2NhbGFyKDEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKG0zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKG0wKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdtdWx0aXBseScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSBtNi5tdWx0aXBseShtNik7XG4gICAgICAgICAgICB2YXIgdDIgPSBpZGVudGl0eS5tdWx0aXBseShpZGVudGl0eSk7XG4gICAgICAgICAgICB2YXIgdDMgPSBpZGVudGl0eS5tdWx0aXBseSh6ZXJvKTtcbiAgICAgICAgICAgIHZhciB0NCA9IGlkZW50aXR5Lm11bHRpcGx5KG0wKTtcbiAgICAgICAgICAgIHZhciB0NSA9IHplcm8ubXVsdGlwbHkobTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKG03KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwoaWRlbnRpdHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDQuZXF1YWwobTApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0NS5lcXVhbCh6ZXJvKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTAubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDIgPSBtMS5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0MyA9IG0yLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQ0ID0gbTMubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDUgPSB6ZXJvLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQ2ID0gb25lcy5uZWdhdGUoKTtcblxuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwodDUpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxW2ldLCAtbTBbaV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MltpXSwgLW0xW2ldKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDNbaV0sIC1tMltpXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ0W2ldLCAtbTNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAxNjsgaisrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbal0sIC1qKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDZbal0sIC0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zcG9zZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJhbnNwb3NlX21hcCA9IHtcbiAgICAgICAgICAgICAgICAwOjAsIDE6NCwgMjo4LCAzOjEyLCA0OjEsIDU6NSwgNjo5LCA3OjEzLFxuICAgICAgICAgICAgICAgIDg6MiwgOTo2LCAxMDoxMCwgMTE6MTQsIDEyOjMsIDEzOjcsIDE0OjExLCAxNToxNVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHQxID0gaWRlbnRpdHkudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDIgPSBvbmVzLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQzID0gemVyby50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0wLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQ1ID0gbTEudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDYgPSBtMi50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NyA9IG0zLnRyYW5zcG9zZSgpO1xuXG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwoaWRlbnRpdHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChvbmVzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgdmFyIHQ0ID0gbTAudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NFtpXSwgbTBbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NVtpXSwgbTFbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NltpXSwgbTJbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0N1tpXSwgbTNbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25YJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvblgodGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzVdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNl0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbOV0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwodDIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uWScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbW9yZSB0ZXN0c1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb25ZKHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB0MlswXSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzJdID0gTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbOF0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMTBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblonLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWih0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxXSA9IC1NYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls0XSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzVdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbkF4aXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG11bHRpLWF4aXMgdGVzdHM/XG4gICAgICAgICAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKDEsIDAsIDApO1xuICAgICAgICAgICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICAgICAgICAgIHZhciB6YXhpcyA9IG5ldyBWZWN0b3IoMCwgMCwgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoeGF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXgucm90YXRpb25BeGlzKHlheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQzID0gTWF0cml4LnJvdGF0aW9uQXhpcyh6YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0NCA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoeGF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDUgPSBNYXRyaXgucm90YXRpb25BeGlzKHlheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQ2ID0gTWF0cml4LnJvdGF0aW9uQXhpcyh6YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChNYXRyaXgucm90YXRpb25YKHRoZXRhKSkpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChNYXRyaXgucm90YXRpb25ZKHRoZXRhKSkpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbChNYXRyaXgucm90YXRpb25aKHRoZXRhKSkpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0NC5lcXVhbChNYXRyaXgucm90YXRpb25YKHRoZXRhKSkpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0NS5lcXVhbChNYXRyaXgucm90YXRpb25ZKHRoZXRhKSkpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0Ni5lcXVhbChNYXRyaXgucm90YXRpb25aKHRoZXRhKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIGJldHRlciB0ZXN0cywgdGhpcyBpcyBiYXNpY2FsbHkganVzdCByZWNyZWF0aW5nIHRoZSBtZXRob2RcbiAgICAgICAgICAgIHZhciB4YXhpcyA9IG5ldyBWZWN0b3IoMSwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgeWF4aXMgPSBuZXcgVmVjdG9yKDAsIDEsIDApO1xuICAgICAgICAgICAgdmFyIHpheGlzID0gbmV3IFZlY3RvcigwLCAwLCAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgcGl0Y2ggPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhbmdsZXMubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeWF3ID0gYW5nbGVzW2pdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGFuZ2xlcy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm9sbCA9IGFuZ2xlc1trXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvbihwaXRjaCwgeWF3LCByb2xsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5yb3RhdGlvblgocm9sbCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWih5YXcpKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBseShNYXRyaXgucm90YXRpb25ZKHBpdGNoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwodDIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zbGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmFucyA9IFsxLCAyLCAzLCA1LCAxMCwgMjAsIDMwLCA0MF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYW5zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgeHRyYW5zID0gdHJhbnNbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0cmFucy5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5dHJhbnMgPSB0cmFuc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0cmFucy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgenRyYW5zID0gdHJhbnNba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgudHJhbnNsYXRpb24oeHRyYW5zLCB5dHJhbnMsIHp0cmFucyk7ICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDE2OyBtKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG0gPT09IDEyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geHRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB5dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAxNCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHp0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDAgfHwgbSA9PT0gNSB8fCBtID09PSAxMCB8fCBtID09PSAxNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVttXSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IFsxLCAyLCAzLCA1LCAxMCwgMjAsIDMwLCA0MF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjYWxlLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgeHNjYWxlID0gc2NhbGVbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzY2FsZS5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5c2NhbGUgPSBzY2FsZVtqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBzY2FsZS5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgenNjYWxlID0gc2NhbGVba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXguc2NhbGUoeHNjYWxlLCB5c2NhbGUsIHpzY2FsZSk7ICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDE2OyBtKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG0gPT09IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB4c2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSA1KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geXNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB6c2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAxNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVttXSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2lkZW50aXR5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTMpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgaWYgKGkgJSA1ID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5W2ldLCAxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoaWRlbnRpdHlbaV0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3plcm8nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvW2ldLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Zyb21BcnJheScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobTUuZXF1YWwobTQpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVybzIuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eTIuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7IiwidmFyIE1lc2ggPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9tZXNoLmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL2ZhY2UuanMnKTtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC92ZWN0b3IuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnTWVzaCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG1lc2g7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgbWVzaCA9IG5ldyBNZXNoKCd0cmlhbmdsZScsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigxLDAsMCksXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigwLDEsMCksXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigwLDAsMSlcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbmV3IEZhY2UoMCwgMSwgMiwgJ3JlZCcpXG4gICAgICAgICAgICBdKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ25hbWUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG1lc2gubmFtZSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5uYW1lLCAndHJpYW5nbGUnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3ZlcnRpY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZmFjZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdwb3NpdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnZnJvbUpTT04nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL3ZlY3Rvci5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdWZWN0b3InLCBmdW5jdGlvbigpe1xuICAgIHZhciBvcmlnaW4sIHZlY3RvcjEsIHZlY3RvcjIsIHZlY3RvcjMsIHZlY3RvcjQsIHZlY3RvcjUsIHZlY3RvcngsIHZlY3RvcnksIHZlY3Rvcno7XG4gICAgdmFyIHZlY3RvcjEwMHgsIHZlY3RvcjIwMHksIHZlY3RvcjMwMHosIHZlY3RvcjEyMywgdmVjdG9yMTEyO1xuICAgIHZhciBlcHNpbG9uID0gMC4wMTtcbiAgICBmdW5jdGlvbiBuZWFybHlFcXVhbChhLCBiLCBlcHMpe1xuICAgICAgICBpZiAodHlwZW9mIGVwcyA9PT0gXCJ1bmRlZmluZWRcIikge2VwcyA9IGVwc2lsb247fVxuICAgICAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICAgICAgcmV0dXJuIChkaWZmIDwgZXBzKTtcbiAgICB9XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgb3JpZ2luID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yMSA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjIgPSBuZXcgVmVjdG9yKDEsIDEsIDEpO1xuICAgICAgICB2ZWN0b3IzID0gbmV3IFZlY3RvcigxMCwgMTAsIDEwKTtcbiAgICAgICAgdmVjdG9yNCA9IG5ldyBWZWN0b3IoMTEsIDExLCAxMSk7XG4gICAgICAgIHZlY3RvcjUgPSBuZXcgVmVjdG9yKC0xLCAtMSwgLTEpO1xuICAgICAgICB2ZWN0b3J4ID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yeSA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgIHZlY3RvcnogPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICB2ZWN0b3IxMDB4ID0gbmV3IFZlY3RvcigxMDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IyMDB5ID0gbmV3IFZlY3RvcigwLCAyMDAsIDApO1xuICAgICAgICB2ZWN0b3IzMDB6ID0gbmV3IFZlY3RvcigwLCAwLCAzMDApO1xuICAgICAgICB2ZWN0b3IxMjMgPSBuZXcgVmVjdG9yKDEsIDIsIDMpO1xuICAgICAgICB2ZWN0b3IxMTIgPSBuZXcgVmVjdG9yKC0xLCAxLCAyKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2F4ZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe25ldyBWZWN0b3IoKTt9LCBFcnJvcik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS54KTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcjEuYWRkKHZlY3RvcjMpO1xuICAgICAgICAgICAgdmFyIHQyID0gdmVjdG9yMS5hZGQodmVjdG9yNSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5hZGQodmVjdG9yMykuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuYWRkKHZlY3RvcjUpLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS55LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueiwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKTtcbiAgICAgICAgICAgIHZhciB0MiA9IHZlY3RvcjEuc3VidHJhY3QodmVjdG9yMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKS5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zdWJ0cmFjdCh2ZWN0b3IyKS5lcXVhbChvcmlnaW4pKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS54LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi56LCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2VxdWFsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjIpLCB0cnVlKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjMpLCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbmdsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5hbmdsZSh2ZWN0b3J5KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LmFuZ2xlKHZlY3RvcnopLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnguYW5nbGUodmVjdG9yeiksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZSh2ZWN0b3IyKSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjEuYW5nbGUodmVjdG9yNSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nvc0FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J5KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeS5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3IyKSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3I1KSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yNS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMy5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMwMCkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZVNxdWFyZWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEubWFnbml0dWRlU3F1YXJlZCgpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3I1Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMy5tYWduaXR1ZGVTcXVhcmVkKCksIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkb3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZG90KHZlY3RvcjIpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyLmRvdCh2ZWN0b3IzKSwgMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMuZG90KHZlY3RvcjUpLCAtMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguZG90KHZlY3RvcnkpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmRvdCh2ZWN0b3J6KSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5kb3QodmVjdG9yeiksIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY3Jvc3MnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yMTIzLmNyb3NzKHZlY3RvcjExMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yei5jcm9zcyh2ZWN0b3J4KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnkuY3Jvc3ModmVjdG9yeCkuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J6LmNyb3NzKHZlY3RvcnkpLmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yeC5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS56LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5LmNyb3NzKHZlY3RvcnopLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnouY3Jvc3ModmVjdG9yeCkueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgLTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDMpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdub3JtYWxpemUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEwMHgubm9ybWFsaXplKCkueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMjAweS5ub3JtYWxpemUoKS55LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IzMDB6Lm5vcm1hbGl6ZSgpLnosIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnguc2NhbGUoMTAwKS5lcXVhbCh2ZWN0b3IxMDB4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5zY2FsZSgyMDApLmVxdWFsKHZlY3RvcjIwMHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J6LnNjYWxlKDMwMCkuZXF1YWwodmVjdG9yMzAweikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuc2NhbGUoMTApLmVxdWFsKHZlY3RvcjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnNjYWxlKDExKS5lcXVhbCh2ZWN0b3I0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkuZXF1YWwodmVjdG9yNSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkubmVnYXRlKCkuZXF1YWwodmVjdG9yMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndmVjdG9yUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB2ZWN0b3J4LnZlY3RvclByb2plY3Rpb24odmVjdG9yeSk7XG4gICAgICAgICAgICB2YXIgdDIgPSB2ZWN0b3IxLnZlY3RvclByb2plY3Rpb24odmVjdG9yMyk7XG4gICAgICAgICAgICB2YXIgdDMgPSB2ZWN0b3IxMjMudmVjdG9yUHJvamVjdGlvbih2ZWN0b3IxMTIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQyLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0Mi55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDIueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLngsIC0xLjE2NykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLnksIDEuMTYpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0My56LCAyLjMzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsYXJQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LnNjYWxhclByb2plY3Rpb24odmVjdG9yeSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLnNjYWxhclByb2plY3Rpb24odmVjdG9yMyksIDEuNzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxMjMuc2NhbGFyUHJvamVjdGlvbih2ZWN0b3IxMTIpLCAyLjg1KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCAoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS56LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcnoucm90YXRlWCgoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcnoucm90YXRlWCgyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVZJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByb3QxID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkgLyAyKTtcbiAgICAgICAgICAgIHZhciByb3QyID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZVkoKCgzKk1hdGguUEkpIC8gMikpO1xuICAgICAgICAgICAgdmFyIHJvdDQgPSB2ZWN0b3J4LnJvdGF0ZVkoMipNYXRoLlBJKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeS5yb3RhdGVaKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeS5yb3RhdGVaKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlUGl0Y2hZYXdSb2xsKE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbGl0eS9jb2xvci5qcycpO1xudmFyIGNvbG9ybGlzdCA9IHJlcXVpcmUoJy4uL2RhdGEvY29sb3JzLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgcmdiYSwgaHNsLCBoc2xhLCBhbGljZWJsdWUsIGVwc2lsb247XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVkID0gbmV3IENvbG9yKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvcihcIiNCQURBNTVcIik7XG4gICAgICAgIHJnYmEgPSBuZXcgQ29sb3IoXCJyZ2JhKDI1NSwgMCwgMCwgMC4zKVwiKTtcbiAgICAgICAgZXBzaWxvbiA9IDAuMDE7XG4gICAgICAgIGhzbCA9IG5ldyBDb2xvcihcImhzbCgwLCAxMDAlLCA1MCUpXCIpO1xuICAgICAgICBoc2xhID0gbmV3IENvbG9yKFwiaHNsYSgwLCAxMDAlLCA1MCUsIDAuMylcIik7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdyZ2InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuYiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2wnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5zLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLmwsIDAuNSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbHBoYScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soTWF0aC5hYnMocmVkLmFscGhhIC0gMSkgPCBlcHNpbG9uKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhNYXRoLmFicyhyZ2JhLmFscGhhIC0gMC4zKSA8IGVwc2lsb24pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xpZ2h0ZW4nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkYXJrZW4nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2xUb1JnYicsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JnYlRvSHNsJywgZnVuY3Rpb24oKXtcblxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyJdfQ==
(16)
});