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

/**
 * @method
 * @param {string} type
 * @param {function} listener
 */
EventTarget.prototype.addListener = function(type, listener){
    if (typeof this._listeners[type] === "undefined"){
        this._listeners[type] = [];
    }

    this._listeners[type].push(listener);
};
/**
 * @method
 * @param  {string} event
 * @throws {Error} If event type does not exist in EventTarget
 */
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
/**
 * @method
 * @param  {string} type
 * @param  {function} listener
 */
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
var KEYCODES = _dereq_('../utilities/keycodes.js');

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
                        color = color.lighten(illumination_angle*15);
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

},{"../math/math.js":10,"../utilities/keycodes.js":15,"./camera.js":6,"./events.js":7}],9:[function(_dereq_,module,exports){
var Color = _dereq_('../utilities/color.js');

/**
 * A 3D triangle
 * @constructor
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
},{"../utilities/color.js":14}],10:[function(_dereq_,module,exports){
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

/**
 * Construct a Mesh from a JSON object.
 * @method
 * @static
 * @param  {{name: string, verticies: Array.<Array.<number>>, faces: {{face: Array.<number>, color: string}}}} json
 * @return {Mesh}
 */
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
 * 3D vector.
 * @constructor
 * @param {number} x x coordinate
 * @param {number} y y coordinate
 * @param {number} z z coordinate
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
/**
 * Negates self
 * @return {Vector} [description]
 */
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
var rgbToHsl, parseColor, cache;
/**
 * A color with both rgb and hsl representations.
 * @class Color
 * @param {string} color Any legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 */
function Color(color){
    var parsed_color = {};
    color = color.toLowerCase();
    if (color in cache){
        parsed_color = cache[color];
    } else {
        parsed_color = parseColor(color);
        cache[color] = parsed_color;
    }
    var hsl = rgbToHsl(parsed_color.r, parsed_color.g, parsed_color.b);
    this.rgb = {'r': parsed_color.r, 'g': parsed_color.g, 'b': parsed_color.b};
    this.hsl = {'h': hsl.h, 's': hsl.s, 'l': hsl.l};
    this.alpha = parsed_color.a || 1;
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
    return new Color("hsla(" + hsl.h + "," + hsl.s + "%," + lum + "%," + this.alpha + ")");
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
    return new Color("hsla(" + hsl.h + "," + hsl.s + "%," + lum + "%," + this.alpha + ")");
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
_dereq_('./../tests/helpers.js');
_dereq_('./../tests/data/colors.js');
_dereq_('./../tests/engine/camera.js');
_dereq_('./../tests/engine/scene.js');
_dereq_('./../tests/math/face.js');
_dereq_('./../tests/math/matrix.js');
_dereq_('./../tests/math/mesh.js');
_dereq_('./../tests/math/vector.js');
_dereq_('./../tests/utilities/color.js');

},{"./../tests/data/colors.js":17,"./../tests/engine/camera.js":18,"./../tests/engine/scene.js":19,"./../tests/helpers.js":20,"./../tests/math/face.js":21,"./../tests/math/matrix.js":22,"./../tests/math/mesh.js":23,"./../tests/math/vector.js":24,"./../tests/utilities/color.js":25}],17:[function(_dereq_,module,exports){
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
function nearlyEqual(a, b, eps){
    if (typeof eps === "undefined") {eps = 0.01;}
    var diff = Math.abs(a - b);
    return (diff < eps);
}

var helpers = new Object(null);

helpers.nearlyEqual = nearlyEqual;

module.exports = helpers;
},{}],21:[function(_dereq_,module,exports){
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
},{"../../src/math/face.js":9,"assert":1}],22:[function(_dereq_,module,exports){
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
},{"../../src/math/matrix.js":11,"../../src/math/vector.js":13,"assert":1}],23:[function(_dereq_,module,exports){
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
},{"../../src/math/face.js":9,"../../src/math/mesh.js":12,"../../src/math/vector.js":13,"assert":1}],24:[function(_dereq_,module,exports){
var Vector = _dereq_('../../src/math/vector.js');
var assert = _dereq_('assert');
var nearlyEqual = _dereq_('../helpers.js')['nearlyEqual'];

suite('Vector', function(){
    var origin, vector1, vector2, vector3, vector4, vector5, vectorx, vectory, vectorz;
    var vector100x, vector200y, vector300z, vector123, vector112;
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
},{"../../src/math/vector.js":13,"../helpers.js":20,"assert":1}],25:[function(_dereq_,module,exports){
var Color = _dereq_('../../src/utilities/color.js');
var named = _dereq_('../data/colors.js');
var nearlyEqual = _dereq_('../helpers.js')['nearlyEqual'];
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
},{"../../src/utilities/color.js":14,"../data/colors.js":17,"../helpers.js":20,"assert":1}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2V2ZW50cy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL21hdGgvbWF0aC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC92ZWN0b3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvdXRpbGl0aWVzL2NvbG9yLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL3V0aWxpdGllcy9rZXljb2Rlcy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3QvZmFrZV8xYTYwYjdjMi5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2RhdGEvY29sb3JzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZW5naW5lL2NhbWVyYS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2VuZ2luZS9zY2VuZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2hlbHBlcnMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL2ZhY2UuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL21hdGgvbWVzaC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL21hdGgvdmVjdG9yLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvdXRpbGl0aWVzL2NvbG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAoaXNOYU4odmFsdWUpIHx8ICFpc0Zpbml0ZSh2YWx1ZSkpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICAgIGtleSwgaTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsInZhciBtYXRoID0gcmVxdWlyZSgnLi4vbWF0aC9tYXRoLmpzJyk7XG52YXIgVmVjdG9yID0gbWF0aC5WZWN0b3I7XG52YXIgTWF0cml4ID0gbWF0aC5NYXRyaXg7XG5cbi8qKiBcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtWZWN0b3J9IHBvc2l0aW9uIENhbWVyYSBwb3NpdGlvbi5cbiAqIEBwYXJhbSB7VmVjdG9yfSB0YXJnZXQgICBDYW1lcmFcbiAqL1xuZnVuY3Rpb24gQ2FtZXJhKHdpZHRoLCBoZWlnaHQsIHBvc2l0aW9uKXtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24gfHwgbmV3IFZlY3RvcigxLDEsMjApO1xuICAgIHRoaXMudXAgPSBuZXcgVmVjdG9yKDAsIDEsIDApO1xuICAgIHRoaXMucm90YXRpb24gPSB7J3lhdyc6IDAsICdwaXRjaCc6IDAsICdyb2xsJzogMH07XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLm5lYXIgPSAwLjE7XG4gICAgdGhpcy5mYXIgPSAxMDAwO1xuICAgIHRoaXMuZm92ID0gOTA7XG4gICAgdGhpcy5wZXJzcGVjdGl2ZUZvdiA9IHRoaXMuY2FsY3VsYXRlUGVyc3BlY3RpdmVGb3YoKTtcbn1cbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLmRpcmVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzaW5fcGl0Y2ggPSBNYXRoLnNpbih0aGlzLnJvdGF0aW9uLnBpdGNoKTtcbiAgICB2YXIgY29zX3BpdGNoID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbi5waXRjaCk7XG4gICAgdmFyIHNpbl95YXcgPSBNYXRoLnNpbih0aGlzLnJvdGF0aW9uLnlhdyk7XG4gICAgdmFyIGNvc195YXcgPSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uLnlhdyk7XG5cbiAgICByZXR1cm4gbmV3IFZlY3RvcigtY29zX3BpdGNoICogc2luX3lhdywgc2luX3BpdGNoLCAtY29zX3BpdGNoICogY29zX3lhdyk7XG59O1xuLyoqXG4gKiBCdWlsZHMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCBiYXNlZCBvbiBhIGZpZWxkIG9mIHZpZXcuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuY2FsY3VsYXRlUGVyc3BlY3RpdmVGb3YgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm92ID0gdGhpcy5mb3YgKiAoTWF0aC5QSSAvIDE4MCk7IC8vIGNvbnZlcnQgdG8gcmFkaWFuc1xuICAgIHZhciBhc3BlY3QgPSB0aGlzLndpZHRoIC8gdGhpcy5oZWlnaHQ7XG4gICAgdmFyIG5lYXIgPSB0aGlzLm5lYXI7XG4gICAgdmFyIGZhciA9IHRoaXMuZmFyO1xuICAgIHZhciBtYXRyaXggPSBNYXRyaXguemVybygpO1xuICAgIHZhciBoZWlnaHQgPSAoMS9NYXRoLnRhbihmb3YvMikpICogdGhpcy5oZWlnaHQ7XG4gICAgdmFyIHdpZHRoID0gaGVpZ2h0ICogYXNwZWN0O1xuXG4gICAgbWF0cml4WzBdID0gd2lkdGg7XG4gICAgbWF0cml4WzVdID0gaGVpZ2h0O1xuICAgIG1hdHJpeFsxMF0gPSBmYXIvKG5lYXItZmFyKSA7XG4gICAgbWF0cml4WzExXSA9IC0xO1xuICAgIG1hdHJpeFsxNF0gPSBuZWFyKmZhci8obmVhci1mYXIpO1xuXG4gICAgcmV0dXJuIG1hdHJpeDtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5jcmVhdGVWaWV3TWF0cml4ID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgZXllID0gdGhpcy5wb3NpdGlvbjtcbiAgICB2YXIgcGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoO1xuICAgIHZhciB5YXcgPSB0aGlzLnJvdGF0aW9uLnlhdztcbiAgICB2YXIgY29zX3BpdGNoID0gTWF0aC5jb3MocGl0Y2gpO1xuICAgIHZhciBzaW5fcGl0Y2ggPSBNYXRoLnNpbihwaXRjaCk7XG4gICAgdmFyIGNvc195YXcgPSBNYXRoLmNvcyh5YXcpO1xuICAgIHZhciBzaW5feWF3ID0gTWF0aC5zaW4oeWF3KTtcblxuICAgIHZhciB4YXhpcyA9IG5ldyBWZWN0b3IoY29zX3lhdywgMCwgLXNpbl95YXcgKTtcbiAgICB2YXIgeWF4aXMgPSBuZXcgVmVjdG9yKHNpbl95YXcgKiBzaW5fcGl0Y2gsIGNvc19waXRjaCwgY29zX3lhdyAqIHNpbl9waXRjaCApO1xuICAgIHZhciB6YXhpcyA9IG5ldyBWZWN0b3Ioc2luX3lhdyAqIGNvc19waXRjaCwgLXNpbl9waXRjaCwgY29zX3BpdGNoICogY29zX3lhdyApO1xuXG4gICAgdmFyIHZpZXdfbWF0cml4ID0gTWF0cml4LmZyb21BcnJheShbXG4gICAgICAgIHhheGlzLngsIHlheGlzLngsIHpheGlzLngsIDAsXG4gICAgICAgIHhheGlzLnksIHlheGlzLnksIHpheGlzLnksIDAsXG4gICAgICAgIHhheGlzLnosIHlheGlzLnosIHpheGlzLnosIDAsXG4gICAgICAgIC0oeGF4aXMuZG90KGV5ZSkgKSwgLSggeWF4aXMuZG90KGV5ZSkgKSwgLSggemF4aXMuZG90KGV5ZSkgKSwgMVxuICAgIF0pO1xuICAgIHJldHVybiB2aWV3X21hdHJpeDtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbih4LCB5LCB6KXtcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlY3Rvcih4LHkseik7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVSaWdodCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIHJpZ2h0ID0gdGhpcy51cC5jcm9zcyh0aGlzLmRpcmVjdGlvbigpKS5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KHJpZ2h0KTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZUxlZnQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBsZWZ0ID0gdGhpcy51cC5jcm9zcyh0aGlzLmRpcmVjdGlvbigpKS5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmFkZChsZWZ0KTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuQ2FtZXJhLnByb3RvdHlwZS50dXJuUmlnaHQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHRoaXMucm90YXRpb24ueWF3IC09IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi55YXcgPCAwKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi55YXcgPSB0aGlzLnJvdGF0aW9uLnlhdyArIChNYXRoLlBJKjIpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUudHVybkxlZnQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHRoaXMucm90YXRpb24ueWF3ICs9IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi55YXcgPiAoTWF0aC5QSSoyKSl7XG4gICAgICAgIHRoaXMucm90YXRpb24ueWF3ID0gdGhpcy5yb3RhdGlvbi55YXcgLSAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbkNhbWVyYS5wcm90b3R5cGUubG9va1VwID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnBpdGNoIC09IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi5waXRjaCA+IChNYXRoLlBJKjIpKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi5waXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2ggLSAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLmxvb2tEb3duID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnBpdGNoICs9IGFtb3VudDtcbiAgICBpZiAodGhpcy5yb3RhdGlvbi5waXRjaCA8IDApe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaCArIChNYXRoLlBJKjIpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVVwID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgdXAgPSB0aGlzLnVwLm5vcm1hbGl6ZSgpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKHVwKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZURvd24gPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBkb3duID0gdGhpcy51cC5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KGRvd24pO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlRm9yd2FyZCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGZvcndhcmQgPSB0aGlzLmRpcmVjdGlvbigpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKGZvcndhcmQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlQmFja3dhcmQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBiYWNrd2FyZCA9IHRoaXMuZGlyZWN0aW9uKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChiYWNrd2FyZCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIvKipcbiAqIEV2ZW50IGhhbmRsZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgTmljaG9sYXMgQy4gWmFrYXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBNSVQgTGljZW5zZVxuICovXG5cbmZ1bmN0aW9uIEV2ZW50VGFyZ2V0KCl7XG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG59XG5cbi8qKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICBpZiAodHlwZW9mIHRoaXMuX2xpc3RlbmVyc1t0eXBlXSA9PT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgIH1cblxuICAgIHRoaXMuX2xpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbn07XG4vKipcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge3N0cmluZ30gZXZlbnRcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBldmVudCB0eXBlIGRvZXMgbm90IGV4aXN0IGluIEV2ZW50VGFyZ2V0XG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICBldmVudCA9IHsgdHlwZTogZXZlbnQgfTtcbiAgICB9XG4gICAgaWYgKCFldmVudC50YXJnZXQpe1xuICAgICAgICBldmVudC50YXJnZXQgPSB0aGlzO1xuICAgIH1cblxuICAgIGlmICghZXZlbnQudHlwZSl7ICAvL2ZhbHN5XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50IG9iamVjdCBtaXNzaW5nICd0eXBlJyBwcm9wZXJ0eS5cIik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1tldmVudC50eXBlXSBpbnN0YW5jZW9mIEFycmF5KXtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudC50eXBlXTtcbiAgICAgICAgZm9yICh2YXIgaT0wLCBsZW49bGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4vKipcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICogQHBhcmFtICB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW3R5cGVdIGluc3RhbmNlb2YgQXJyYXkpe1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICBmb3IgKHZhciBpPTAsIGxlbj1saXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXSA9PT0gbGlzdGVuZXIpe1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50VGFyZ2V0OyIsInZhciBtYXRoID0gcmVxdWlyZSgnLi4vbWF0aC9tYXRoLmpzJyk7XG52YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi9jYW1lcmEuanMnKTtcbnZhciBFdmVudFRhcmdldCA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgS0VZQ09ERVMgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMva2V5Y29kZXMuanMnKTtcblxudmFyIFZlY3RvciA9IG1hdGguVmVjdG9yO1xudmFyIE1hdHJpeCA9IG1hdGguTWF0cml4O1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHt7Y2FudmFzX2lkOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBTY2VuZShvcHRpb25zKXtcbiAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICB0aGlzLndpZHRoID0gb3B0aW9ucy53aWR0aDtcbiAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob3B0aW9ucy5jYW52YXNfaWQpO1xuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlci5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9jdHggPSB0aGlzLl9iYWNrX2J1ZmZlci5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gbnVsbDtcbiAgICB0aGlzLl9kZXB0aF9idWZmZXIgPSBbXTtcbiAgICB0aGlzLmRyYXdpbmdfbW9kZSA9IDE7XG4gICAgdGhpcy5fYmFja2ZhY2VfY3VsbGluZyA9IHRydWU7XG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmlsbHVtaW5hdGlvbiA9IG5ldyBWZWN0b3IoOTAsMCwwKTtcbiAgICAvKiogQHR5cGUge0FycmF5LjxNZXNoPn0gKi9cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuICAgIC8qKiBAdHlwZSB7T2JqZWN0LjxudW1iZXIsIGJvb2xlYW4+fSAqL1xuICAgIHRoaXMuX2tleXMgPSB7fTsgLy8gS2V5cyBjdXJyZW50bHkgcHJlc3NlZFxuICAgIHRoaXMuX2tleV9jb3VudCA9IDA7IC8vIE51bWJlciBvZiBrZXlzIGJlaW5nIHByZXNzZWQuLi4gdGhpcyBmZWVscyBrbHVkZ3lcbiAgICAvKiogQHR5cGUgez9udW1iZXJ9ICovXG4gICAgdGhpcy5fYW5pbV9pZCA9IG51bGw7XG4gICAgLyoqIEB0eXBlIHtib29sZWFufSAqL1xuICAgIHRoaXMuX25lZWRzX3VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fZHJhd19tb2RlID0gJ3dpcmVmcmFtZSc7XG4gICAgdGhpcy5pbml0KCk7XG59XG5TY2VuZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRUYXJnZXQoKTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5jYW52YXMudGFiSW5kZXggPSAxOyAvLyBTZXQgdGFiIGluZGV4IHRvIGFsbG93IGNhbnZhcyB0byBoYXZlIGZvY3VzIHRvIHJlY2VpdmUga2V5IGV2ZW50c1xuICAgIHRoaXMuX3hfb2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMik7XG4gICAgdGhpcy5feV9vZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgdGhpcy5pbml0aWFsaXplRGVwdGhCdWZmZXIoKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IHRoaXMuX2JhY2tfYnVmZmVyX2N0eC5jcmVhdGVJbWFnZURhdGEodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bi5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLmVtcHR5S2V5cy5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgRXZlbnRUYXJnZXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xufTtcbi8qKlxuICogRHVtcCBhbGwgcHJlc3NlZCBrZXlzIG9uIGJsdXIuXG4gKiBAbWV0aG9kXG4gKi9cblNjZW5lLnByb3RvdHlwZS5lbXB0eUtleXMgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuX2tleV9jb3VudCA9IDA7XG4gICAgdGhpcy5fa2V5cyA9IHt9O1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaXNLZXlEb3duID0gZnVuY3Rpb24oa2V5KXtcbiAgICByZXR1cm4gKEtFWUNPREVTW2tleV0gaW4gdGhpcy5fa2V5cyk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5vbktleURvd24gPSBmdW5jdGlvbihlKXtcbiAgICB2YXIgcHJlc3NlZCA9IGUua2V5Q29kZSB8fCBlLndoaWNoO1xuICAgIGlmICghdGhpcy5pc0tleURvd24ocHJlc3NlZCkpe1xuICAgICAgICB0aGlzLl9rZXlfY291bnQgKz0gMTtcbiAgICAgICAgdGhpcy5fa2V5c1twcmVzc2VkXSA9IHRydWU7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub25LZXlVcCA9IGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwcmVzc2VkID0gZS5rZXlDb2RlIHx8IGUud2hpY2g7XG4gICAgaWYgKHByZXNzZWQgaW4gdGhpcy5fa2V5cyl7XG4gICAgICAgIHRoaXMuX2tleV9jb3VudCAtPSAxO1xuICAgICAgICBkZWxldGUgdGhpcy5fa2V5c1twcmVzc2VkXTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pbml0aWFsaXplRGVwdGhCdWZmZXIgPSBmdW5jdGlvbigpe1xuICAgIGZvciAodmFyIHggPSAwLCBsZW4gPSB0aGlzLndpZHRoICogdGhpcy5oZWlnaHQ7IHggPCBsZW47IHgrKyl7XG4gICAgICAgIHRoaXMuX2RlcHRoX2J1ZmZlclt4XSA9IDk5OTk5OTk7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub2Zmc2NyZWVuID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICAvLyBUT0RPOiBOb3QgdG90YWxseSBjZXJ0YWluIHRoYXQgej4xIGluZGljYXRlcyB2ZWN0b3IgaXMgYmVoaW5kIGNhbWVyYS5cbiAgICB2YXIgeCA9IHZlY3Rvci54ICsgdGhpcy5feF9vZmZzZXQ7XG4gICAgdmFyIHkgPSB2ZWN0b3IueSArIHRoaXMuX3lfb2Zmc2V0O1xuICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgcmV0dXJuICh6ID4gMSB8fCB4IDwgMCB8fCB4ID4gdGhpcy53aWR0aCB8fCB5IDwgMCB8fCB5ID4gdGhpcy5oZWlnaHQpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd1BpeGVsID0gZnVuY3Rpb24oeCwgeSwgeiwgY29sb3Ipe1xuICAgIHggPSBNYXRoLmZsb29yKHggKyB0aGlzLl94X29mZnNldCk7XG4gICAgeSA9IE1hdGguZmxvb3IoeSArIHRoaXMuX3lfb2Zmc2V0KTtcbiAgICBpZiAoeCA+PSAwICYmIHggPCB0aGlzLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy5oZWlnaHQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0geCArICh5ICogdGhpcy53aWR0aCk7XG4gICAgICAgIGlmICh6IDwgdGhpcy5fZGVwdGhfYnVmZmVyW2luZGV4XSkge1xuICAgICAgICAgICAgdmFyIGltYWdlX2RhdGEgPSB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZS5kYXRhO1xuICAgICAgICAgICAgdmFyIGkgPSBpbmRleCAqIDQ7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2ldID0gY29sb3IucjtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSsxXSA9IGNvbG9yLmc7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krMl0gPSBjb2xvci5iO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzNdID0gMjU1O1xuICAgICAgICAgICAgdGhpcy5fZGVwdGhfYnVmZmVyW2luZGV4XSA9IHo7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLyoqIEBtZXRob2QgICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd0VkZ2UgPSBmdW5jdGlvbih2ZWN0b3IxLCB2ZWN0b3IyLCBjb2xvcil7XG4gICAgdmFyIGFicyA9IE1hdGguYWJzO1xuICAgIGlmICh2ZWN0b3IxLnggPiB2ZWN0b3IyLngpe1xuICAgICAgICB2YXIgdGVtcCA9IHZlY3RvcjE7XG4gICAgICAgIHZlY3RvcjEgPSB2ZWN0b3IyO1xuICAgICAgICB2ZWN0b3IyID0gdGVtcDtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRfeCA9IHZlY3RvcjEueDtcbiAgICB2YXIgY3VycmVudF95ID0gdmVjdG9yMS55O1xuICAgIHZhciBjdXJyZW50X3ogPSB2ZWN0b3IxLno7XG4gICAgdmFyIGxvbmdlc3RfZGlzdCA9IE1hdGgubWF4KGFicyh2ZWN0b3IyLnggLSB2ZWN0b3IxLngpLCBhYnModmVjdG9yMi55IC0gdmVjdG9yMS55KSwgYWJzKHZlY3RvcjIueiAtIHZlY3RvcjEueikpO1xuICAgIHZhciBzdGVwX3ggPSAodmVjdG9yMi54IC0gdmVjdG9yMS54KSAvIGxvbmdlc3RfZGlzdDtcbiAgICB2YXIgc3RlcF95ID0gKHZlY3RvcjIueSAtIHZlY3RvcjEueSkgLyBsb25nZXN0X2Rpc3Q7XG4gICAgdmFyIHN0ZXBfeiA9ICh2ZWN0b3IyLnogLSB2ZWN0b3IxLnopIC8gbG9uZ2VzdF9kaXN0O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb25nZXN0X2Rpc3Q7IGkrKyl7XG4gICAgICAgIHRoaXMuZHJhd1BpeGVsKGN1cnJlbnRfeCwgY3VycmVudF95LCBjdXJyZW50X3osIGNvbG9yKTtcbiAgICAgICAgY3VycmVudF94ICs9IHN0ZXBfeDtcbiAgICAgICAgY3VycmVudF95ICs9IHN0ZXBfeTtcbiAgICAgICAgY3VycmVudF96ICs9IHN0ZXBfejtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5kcmF3VHJpYW5nbGUgPSBmdW5jdGlvbih2ZWN0b3IxLCB2ZWN0b3IyLCB2ZWN0b3IzLCBjb2xvcil7XG4gICAgdGhpcy5kcmF3RWRnZSh2ZWN0b3IxLCB2ZWN0b3IyLCBjb2xvcik7XG4gICAgdGhpcy5kcmF3RWRnZSh2ZWN0b3IyLCB2ZWN0b3IzLCBjb2xvcik7XG4gICAgdGhpcy5kcmF3RWRnZSh2ZWN0b3IzLCB2ZWN0b3IxLCBjb2xvcik7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5kcmF3RmxhdEJvdHRvbVRyaWFuZ2xlID0gZnVuY3Rpb24odjEsIHYyLCB2MywgY29sb3Ipe1xuICAgIC8vIERyYXcgbGVmdCB0byByaWdodFxuICAgIGlmICh2Mi54ID49IHYzLngpe1xuICAgICAgICB2YXIgdGVtcCA9IHYzO1xuICAgICAgICB2MyA9IHYyO1xuICAgICAgICB2MiA9IHRlbXA7XG4gICAgfVxuICAgIC8vIGNvbXB1dGUgZGVsdGFzXG4gICAgdmFyIGR4eV9sZWZ0ICA9ICh2My54LXYxLngpLyh2My55LXYxLnkpO1xuICAgIHZhciBkeHlfcmlnaHQgPSAodjIueC12MS54KS8odjIueS12MS55KTtcbiAgICB2YXIgel9zbG9wZV9sZWZ0ID0gKHYzLnotdjEueikvKHYzLnktdjEueSk7XG4gICAgdmFyIHpfc2xvcGVfcmlnaHQgPSAodjIuei12MS56KS8odjIueS12MS55KTtcblxuICAgIC8vIHNldCBzdGFydGluZyBhbmQgZW5kaW5nIHBvaW50cyBmb3IgZWRnZSB0cmFjZVxuICAgIHZhciB4cyA9IG5ldyBWZWN0b3IodjEueCwgdjEueSwgdjEueik7XG4gICAgdmFyIHhlID0gbmV3IFZlY3Rvcih2MS54LCB2MS55LCB2MS56KTtcbiAgICB4cy56ID0gdjMueiArICgodjEueSAtIHYzLnkpICogel9zbG9wZV9sZWZ0KTtcbiAgICB4ZS56ID0gdjIueiArICgodjEueSAtIHYyLnkpICogel9zbG9wZV9yaWdodCk7XG5cbiAgICAvLyBkcmF3IGVhY2ggc2NhbmxpbmVcbiAgICBmb3IgKHZhciB5PXYxLnk7IHkgPD0gdjIueTsgeSsrKXtcbiAgICAgICAgeHMueSA9IHk7XG4gICAgICAgIHhlLnkgPSB5O1xuICAgICAgICB0aGlzLmRyYXdFZGdlKHhzLCB4ZSwgY29sb3IpO1xuXG4gICAgICAgIC8vIG1vdmUgZG93biBvbmUgc2NhbmxpbmVcbiAgICAgICAgeHMueCs9ZHh5X2xlZnQ7XG4gICAgICAgIHhlLngrPWR4eV9yaWdodDtcbiAgICAgICAgeHMueis9el9zbG9wZV9sZWZ0O1xuICAgICAgICB4ZS56Kz16X3Nsb3BlX3JpZ2h0O1xuICAgIH1cbn07XG5TY2VuZS5wcm90b3R5cGUuZHJhd0ZsYXRUb3BUcmlhbmdsZSA9IGZ1bmN0aW9uKHYxLCB2MiwgdjMsIGNvbG9yKXtcbiAgICAvLyBEcmF3IGxlZnQgdG8gcmlnaHRcbiAgICBpZiAodjEueCA+PSB2Mi54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2MTtcbiAgICAgICAgdjEgPSB2MjtcbiAgICAgICAgdjIgPSB0ZW1wO1xuICAgIH1cbiAgICAvLyBjb21wdXRlIGRlbHRhc1xuICAgIHZhciBkeHlfbGVmdCAgPSAodjMueC12MS54KS8odjMueS12MS55KTtcbiAgICB2YXIgZHh5X3JpZ2h0ID0gKHYzLngtdjIueCkvKHYzLnktdjIueSk7XG4gICAgdmFyIHpfc2xvcGVfbGVmdCA9ICh2My56LXYxLnopLyh2My55LXYxLnkpO1xuICAgIHZhciB6X3Nsb3BlX3JpZ2h0ID0gKHYzLnotdjIueikvKHYzLnktdjIueSk7XG5cbiAgICAvLyBzZXQgc3RhcnRpbmcgYW5kIGVuZGluZyBwb2ludHMgZm9yIGVkZ2UgdHJhY2VcbiAgICB2YXIgeHMgPSBuZXcgVmVjdG9yKHYxLngsIHYxLnksIHYxLnopO1xuICAgIHZhciB4ZSA9IG5ldyBWZWN0b3IodjIueCwgdjEueSwgdjEueik7XG5cbiAgICB4cy56ID0gdjEueiArICgodjEueSAtIHYxLnkpICogel9zbG9wZV9sZWZ0KTtcbiAgICB4ZS56ID0gdjIueiArICgodjEueSAtIHYyLnkpICogel9zbG9wZV9yaWdodCk7XG5cbiAgICAvLyBkcmF3IGVhY2ggc2NhbmxpbmVcbiAgICBmb3IgKHZhciB5PXYxLnk7IHkgPD0gdjMueTsgeSsrKXtcbiAgICAgICAgeHMueSA9IHk7XG4gICAgICAgIHhlLnkgPSB5O1xuICAgICAgICAvLyBkcmF3IGEgbGluZSBmcm9tIHhzIHRvIHhlIGF0IHkgaW4gY29sb3IgY1xuICAgICAgICB0aGlzLmRyYXdFZGdlKHhzLCB4ZSwgY29sb3IpO1xuICAgICAgICAvLyBtb3ZlIGRvd24gb25lIHNjYW5saW5lXG4gICAgICAgIHhzLngrPWR4eV9sZWZ0O1xuICAgICAgICB4ZS54Kz1keHlfcmlnaHQ7XG4gICAgICAgIHhzLnorPXpfc2xvcGVfbGVmdDtcbiAgICAgICAgeGUueis9el9zbG9wZV9yaWdodDtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5maWxsVHJpYW5nbGUgPSBmdW5jdGlvbih2MSwgdjIsIHYzLCBjb2xvcil7XG4gICAgLy8gRHJhdyBlZGdlcyBmaXJzdFxuICAgIC8vIFRPRE86IEZpeC4gVGhpcyBpcyBhIGhhY2suIFxuICAgIC8vdGhpcy5kcmF3VHJpYW5nbGUodjEsIHYyLCB2MywgY29sb3IpO1xuICAgIC8vIFNvcnQgdmVydGljZXMgYnkgeSB2YWx1ZVxuICAgIHZhciB0ZW1wO1xuICAgIGlmKHYxLnkgPiB2Mi55KSB7XG4gICAgICAgIHRlbXAgPSB2MjtcbiAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgdjEgPSB0ZW1wO1xuICAgIH1cbiAgICBpZih2Mi55ID4gdjMueSkge1xuICAgICAgICB0ZW1wID0gdjI7XG4gICAgICAgIHYyID0gdjM7XG4gICAgICAgIHYzID0gdGVtcDtcbiAgICB9XG4gICAgaWYodjEueSA+IHYyLnkpIHtcbiAgICAgICAgdGVtcCA9IHYyO1xuICAgICAgICB2MiA9IHYxO1xuICAgICAgICB2MSA9IHRlbXA7XG4gICAgfVxuICAgIC8vIFRyaWFuZ2xlIHdpdGggbm8gaGVpZ2h0XG4gICAgaWYgKCh2MS55IC0gdjMueSkgPT09IDApe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNob3J0X3Nsb3BlLCBsb25nX3Nsb3BlO1xuICAgIGlmICgodjIueSAtIHYxLnkpID09PSAwKSB7XG4gICAgICAgIHNob3J0X3Nsb3BlID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaG9ydF9zbG9wZSA9ICh2Mi54IC0gdjEueCkgLyAodjIueSAtIHYxLnkpO1xuICAgIH1cbiAgICBpZiAoKHYzLnkgLSB2MS55KSA9PT0gMCkge1xuICAgICAgICBsb25nX3Nsb3BlID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsb25nX3Nsb3BlID0gKHYzLnggLSB2MS54KSAvICh2My55IC0gdjEueSk7XG4gICAgfVxuXG4gICAgaWYgKHYyLnkgPT09IHYzLnkpe1xuICAgICAgICAvLyBGbGF0IHRvcFxuICAgICAgICB0aGlzLmRyYXdGbGF0Qm90dG9tVHJpYW5nbGUodjEsIHYyLCB2MywgY29sb3IpO1xuICAgIH1cbiAgICBlbHNlIGlmICh2MS55ID09PSB2Mi55ICl7XG4gICAgICAgIC8vIEZsYXQgYm90dG9tXG4gICAgICAgIHRoaXMuZHJhd0ZsYXRUb3BUcmlhbmdsZSh2MSwgdjIsIHYzLCBjb2xvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRGVjb21wb3NlIGludG8gZmxhdCB0b3AgYW5kIGZsYXQgYm90dG9tIHRyaWFuZ2xlc1xuICAgICAgICB2YXIgel9zbG9wZSA9ICh2My56IC0gdjEueikgLyAodjMueSAtIHYxLnkpO1xuICAgICAgICB2YXIgeCA9ICgodjIueSAtIHYxLnkpKmxvbmdfc2xvcGUpICsgdjEueDtcbiAgICAgICAgdmFyIHogPSAoKHYyLnkgLSB2MS55KSp6X3Nsb3BlKSArIHYxLno7XG4gICAgICAgIHZhciB2NCA9IG5ldyBWZWN0b3IoeCwgdjIueSwgeik7XG4gICAgICAgIHRoaXMuZHJhd0ZsYXRCb3R0b21UcmlhbmdsZSh2MSwgdjIsIHY0LCBjb2xvcik7XG4gICAgICAgIHRoaXMuZHJhd0ZsYXRUb3BUcmlhbmdsZSh2MiwgdjQsIHYzLCBjb2xvcik7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUucmVuZGVyU2NlbmUgPSBmdW5jdGlvbigpe1xuICAgIC8vIFRPRE86IFNpbXBsaWZ5IHRoaXMgZnVuY3Rpb24uXG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSB0aGlzLl9iYWNrX2J1ZmZlcl9jdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmluaXRpYWxpemVEZXB0aEJ1ZmZlcigpO1xuICAgIHZhciBjYW1lcmFfbWF0cml4ID0gdGhpcy5jYW1lcmEudmlld19tYXRyaXg7XG4gICAgdmFyIHByb2plY3Rpb25fbWF0cml4ID0gdGhpcy5jYW1lcmEucGVyc3BlY3RpdmVGb3Y7XG4gICAgdmFyIGxpZ2h0ID0gdGhpcy5pbGx1bWluYXRpb247XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubWVzaGVzKXtcbiAgICAgICAgaWYgKHRoaXMubWVzaGVzLmhhc093blByb3BlcnR5KGtleSkpe1xuICAgICAgICAgICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hlc1trZXldO1xuICAgICAgICAgICAgdmFyIHNjYWxlID0gbWVzaC5zY2FsZTtcbiAgICAgICAgICAgIHZhciByb3RhdGlvbiA9IG1lc2gucm90YXRpb247XG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBtZXNoLnBvc2l0aW9uO1xuICAgICAgICAgICAgdmFyIHdvcmxkX21hdHJpeCA9IE1hdHJpeC5zY2FsZShzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KS5tdWx0aXBseShcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb24ocm90YXRpb24ucGl0Y2gsIHJvdGF0aW9uLnlhdywgcm90YXRpb24ucm9sbCkubXVsdGlwbHkoXG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeC50cmFuc2xhdGlvbihwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KSkpO1xuICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBtZXNoLmZhY2VzLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICB2YXIgZmFjZSA9IG1lc2guZmFjZXNba10uZmFjZTtcbiAgICAgICAgICAgICAgICB2YXIgY29sb3IgPSBtZXNoLmZhY2VzW2tdLmNvbG9yO1xuICAgICAgICAgICAgICAgIHZhciB2MSA9IG1lc2gudmVydGljZXNbZmFjZVswXV07XG4gICAgICAgICAgICAgICAgdmFyIHYyID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzFdXTtcbiAgICAgICAgICAgICAgICB2YXIgdjMgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMl1dO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBub3JtYWxcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBDYW4gdGhpcyBiZSBjYWxjdWxhdGVkIGp1c3Qgb25jZSwgYW5kIHRoZW4gdHJhbnNmb3JtZWQgaW50b1xuICAgICAgICAgICAgICAgIC8vIGNhbWVyYSBzcGFjZT9cbiAgICAgICAgICAgICAgICB2YXIgY2FtX3RvX3ZlcnQgPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpZGUxID0gdjIudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlMiA9IHYzLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybSA9IHNpZGUxLmNyb3NzKHNpZGUyKTtcbiAgICAgICAgICAgICAgICBpZiAobm9ybS5tYWduaXR1ZGUoKSA8PSAwLjAwMDAwMDAxKXtcbiAgICAgICAgICAgICAgICAgICAgbm9ybSA9IG5vcm07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9ybSA9IG5vcm0ubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEJhY2tmYWNlIGN1bGxpbmcuXG4gICAgICAgICAgICAgICAgaWYgKGNhbV90b192ZXJ0LmRvdChub3JtKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3dnBfbWF0cml4ID0gd29ybGRfbWF0cml4Lm11bHRpcGx5KGNhbWVyYV9tYXRyaXgpLm11bHRpcGx5KHByb2plY3Rpb25fbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MSA9IHYxLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MiA9IHYyLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MyA9IHYzLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRyYXcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIERyYXcgc3VyZmFjZSBub3JtYWxzXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciBmYWNlX3RyYW5zID0gTWF0cml4LnRyYW5zbGF0aW9uKHd2MS54LCB3djEueSwgdjEueik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0VkZ2Uod3YxLCBub3JtLnNjYWxlKDIwKS50cmFuc2Zvcm0oZmFjZV90cmFucyksIHsncic6MjU1LFwiZ1wiOjI1NSxcImJcIjoyNTV9KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZpeCBmcnVzdHVtIGN1bGxpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyByZWFsbHkgc3R1cGlkIGZydXN0dW0gY3VsbGluZy4uLiB0aGlzIGNhbiByZXN1bHQgaW4gc29tZSBmYWNlcyBub3QgYmVpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gZHJhd24gd2hlbiB0aGV5IHNob3VsZCwgZS5nLiB3aGVuIGEgdHJpYW5nbGVzIHZlcnRpY2VzIHN0cmFkZGxlIHRoZSBmcnVzdHJ1bS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub2Zmc2NyZWVuKHd2MSkgJiYgdGhpcy5vZmZzY3JlZW4od3YyKSAmJiB0aGlzLm9mZnNjcmVlbih3djMpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZHJhdyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlnaHRfZGlyZWN0aW9uID0gbGlnaHQuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlsbHVtaW5hdGlvbl9hbmdsZSA9IG5vcm0uZG90KGxpZ2h0X2RpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9IGNvbG9yLmxpZ2h0ZW4oaWxsdW1pbmF0aW9uX2FuZ2xlKjE1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbFRyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1RyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4LnB1dEltYWdlRGF0YSh0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSwgMCwgMCk7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIHRoaXMuY3R4LmRyYXdJbWFnZSh0aGlzLl9iYWNrX2J1ZmZlciwgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5hZGRNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgdGhpcy5tZXNoZXNbbWVzaC5uYW1lXSA9IG1lc2g7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5yZW1vdmVNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgZGVsZXRlIHRoaXMubWVzaGVzW21lc2gubmFtZV07XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLl9rZXlfY291bnQgPiAwKXtcbiAgICAgICAgdGhpcy5maXJlKCdrZXlkb3duJyk7XG4gICAgfVxuICAgIC8vIFRPRE86IEFkZCBrZXl1cCwgbW91c2Vkb3duLCBtb3VzZWRyYWcsIG1vdXNldXAsIGV0Yy5cbiAgICBpZiAodGhpcy5fbmVlZHNfdXBkYXRlKSB7XG4gICAgICAgIHRoaXMucmVuZGVyU2NlbmUoKTtcbiAgICAgICAgdGhpcy5fbmVlZHNfdXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2FuaW1faWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTtcbiIsInZhciBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy9jb2xvci5qcycpO1xuXG4vKipcbiAqIEEgM0QgdHJpYW5nbGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IGEgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7bnVtYmVyfSBiICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge251bWJlcn0gYyAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gRmFjZShhLCBiLCBjLCBjb2xvcil7XG4gICAgdGhpcy5mYWNlID0gW2EsIGIsIGNdO1xuICAgIHRoaXMuY29sb3IgPSBuZXcgQ29sb3IoY29sb3IpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2U7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG52YXIgTWVzaCA9IHJlcXVpcmUoJy4vbWVzaC5qcycpO1xudmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4vbWF0cml4LmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4vZmFjZS5qcycpO1xuXG52YXIgbWF0aCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbm1hdGguVmVjdG9yID0gVmVjdG9yO1xubWF0aC5NZXNoID0gTWVzaDtcbm1hdGguTWF0cml4ID0gTWF0cml4O1xubWF0aC5GYWNlID0gRmFjZTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXRoOyIsIi8qKiBcbiAqIDR4NCBtYXRyaXguXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWF0cml4KCl7XG4gICAgZm9yICh2YXIgaT0wOyBpPDE2OyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gMDtcbiAgICB9XG4gICAgdGhpcy5sZW5ndGggPSAxNjtcbn1cbi8qKlxuICogQ29tcGFyZSBtYXRyaXggd2l0aCBzZWxmIGZvciBlcXVhbGl0eS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgaWYgKHRoaXNbaV0gIT09IG1hdHJpeFtpXSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuLyoqXG4gKiBBZGQgbWF0cml4IHRvIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldICsgbWF0cml4W2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFN1YnRyYWN0IG1hdHJpeCBmcm9tIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gLSBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTXVsdGlwbHkgc2VsZiBieSBzY2FsYXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHlTY2FsYXIgPSBmdW5jdGlvbihzY2FsYXIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gKiBzY2FsYXI7XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTXVsdGlwbHkgc2VsZiBieSBtYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIG5ld19tYXRyaXhbMF0gPSAodGhpc1swXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs0XSkgKyAodGhpc1syXSAqIG1hdHJpeFs4XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMV0gPSAodGhpc1swXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs1XSkgKyAodGhpc1syXSAqIG1hdHJpeFs5XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMl0gPSAodGhpc1swXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs2XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzNdID0gKHRoaXNbMF0gKiBtYXRyaXhbM10pICsgKHRoaXNbMV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzNdICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFs0XSA9ICh0aGlzWzRdICogbWF0cml4WzBdKSArICh0aGlzWzVdICogbWF0cml4WzRdKSArICh0aGlzWzZdICogbWF0cml4WzhdKSArICh0aGlzWzddICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs1XSA9ICh0aGlzWzRdICogbWF0cml4WzFdKSArICh0aGlzWzVdICogbWF0cml4WzVdKSArICh0aGlzWzZdICogbWF0cml4WzldKSArICh0aGlzWzddICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFs2XSA9ICh0aGlzWzRdICogbWF0cml4WzJdKSArICh0aGlzWzVdICogbWF0cml4WzZdKSArICh0aGlzWzZdICogbWF0cml4WzEwXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbN10gPSAodGhpc1s0XSAqIG1hdHJpeFszXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs3XSkgKyAodGhpc1s2XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzhdID0gKHRoaXNbOF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTBdICogbWF0cml4WzhdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbOV0gPSAodGhpc1s4XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTFdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxMF0gPSAodGhpc1s4XSAqIG1hdHJpeFsyXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbMTFdID0gKHRoaXNbOF0gKiBtYXRyaXhbM10pICsgKHRoaXNbOV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMTBdICogbWF0cml4WzExXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzEyXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTRdICogbWF0cml4WzhdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMTNdID0gKHRoaXNbMTJdICogbWF0cml4WzFdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTVdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxNF0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMTNdICogbWF0cml4WzZdKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTVdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxNV0gPSAodGhpc1sxMl0gKiBtYXRyaXhbM10pICsgKHRoaXNbMTNdICogbWF0cml4WzddKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTVdICogbWF0cml4WzE1XSk7XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBOZWdhdGUgc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IC10aGlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFRyYW5zcG9zZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9IHRoaXNbMF07XG4gICAgbmV3X21hdHJpeFsxXSA9IHRoaXNbNF07XG4gICAgbmV3X21hdHJpeFsyXSA9IHRoaXNbOF07XG4gICAgbmV3X21hdHJpeFszXSA9IHRoaXNbMTJdO1xuICAgIG5ld19tYXRyaXhbNF0gPSB0aGlzWzFdO1xuICAgIG5ld19tYXRyaXhbNV0gPSB0aGlzWzVdO1xuICAgIG5ld19tYXRyaXhbNl0gPSB0aGlzWzldO1xuICAgIG5ld19tYXRyaXhbN10gPSB0aGlzWzEzXTtcbiAgICBuZXdfbWF0cml4WzhdID0gdGhpc1syXTtcbiAgICBuZXdfbWF0cml4WzldID0gdGhpc1s2XTtcbiAgICBuZXdfbWF0cml4WzEwXSA9IHRoaXNbMTBdO1xuICAgIG5ld19tYXRyaXhbMTFdID0gdGhpc1sxNF07XG4gICAgbmV3X21hdHJpeFsxMl0gPSB0aGlzWzNdO1xuICAgIG5ld19tYXRyaXhbMTNdID0gdGhpc1s3XTtcbiAgICBuZXdfbWF0cml4WzE0XSA9IHRoaXNbMTFdO1xuICAgIG5ld19tYXRyaXhbMTVdID0gdGhpc1sxNV07XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeC1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWCA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbNl0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs5XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHktYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblkgPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs4XSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB6LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25aID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMV0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25BeGlzID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIHUgPSBheGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHUueDtcbiAgICB2YXIgdXkgPSB1Lnk7XG4gICAgdmFyIHV6ID0gdS56O1xuICAgIHZhciB4eSA9IHV4ICogdXk7XG4gICAgdmFyIHh6ID0gdXggKiB1ejtcbiAgICB2YXIgeXogPSB1eSAqIHV6O1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcyArICgodXgqdXgpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxXSA9ICh4eSpjb3MxKSAtICh1eipzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9ICh4eipjb3MxKSsodXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSAoeHkqY29zMSkrKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zKygodXkqdXkpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9ICh5eipjb3MxKS0odXgqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAoeHoqY29zMSktKHV5KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gKHl6KmNvczEpKyh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3MgKyAoKHV6KnV6KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIHBpdGNoLCB5YXcsIGFuZCByb2xsXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvbiA9IGZ1bmN0aW9uKHBpdGNoLCB5YXcsIHJvbGwpe1xuICAgIHJldHVybiBNYXRyaXgucm90YXRpb25YKHJvbGwpLm11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblooeWF3KSkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWShwaXRjaCkpO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHRyYW5zbGF0aW9uIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IGRpc3RhbmNlc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgudHJhbnNsYXRpb24gPSBmdW5jdGlvbih4dHJhbnMsIHl0cmFucywgenRyYW5zKXtcbiAgICB2YXIgdHJhbnNsYXRpb25fbWF0cml4ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEyXSA9IHh0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTNdID0geXRyYW5zO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxNF0gPSB6dHJhbnM7XG4gICAgcmV0dXJuIHRyYW5zbGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBzY2FsaW5nIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IHNjYWxlXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5zY2FsZSA9IGZ1bmN0aW9uKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpe1xuICAgIHZhciBzY2FsaW5nX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBzY2FsaW5nX21hdHJpeFswXSA9IHhzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFs1XSA9IHlzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxMF0gPSB6c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gc2NhbGluZ19tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGlkZW50aXR5IG1hdHJpeFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguaWRlbnRpdHkgPSBmdW5jdGlvbigpe1xuICAgIHZhciBpZGVudGl0eSA9IG5ldyBNYXRyaXgoKTtcbiAgICBpZGVudGl0eVswXSA9IDE7XG4gICAgaWRlbnRpdHlbNV0gPSAxO1xuICAgIGlkZW50aXR5WzEwXSA9IDE7XG4gICAgaWRlbnRpdHlbMTVdID0gMTtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgemVybyBtYXRyaXhcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4Lnplcm8gPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBuZXcgTWF0cml4KCk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1hdHJpeCBmcm9tIGFuIGFycmF5XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5mcm9tQXJyYXkgPSBmdW5jdGlvbihhcnIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSBhcnJbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4vZmFjZS5qcycpO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7QXJyYXkuPFZlY3Rvcj59IHZlcnRpY2VzXG4gKiBAcGFyYW0ge0FycmF5LjxGYWNlPn0gZWRnZXNcbiAqL1xuZnVuY3Rpb24gTWVzaChuYW1lLCB2ZXJ0aWNlcywgZmFjZXMpe1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICAgIHRoaXMuZmFjZXMgPSBmYWNlcztcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMuc2NhbGUgPSB7J3gnOiAxLCAneSc6IDEsICd6JzogMX07XG59XG5cbi8qKlxuICogQ29uc3RydWN0IGEgTWVzaCBmcm9tIGEgSlNPTiBvYmplY3QuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0gIHt7bmFtZTogc3RyaW5nLCB2ZXJ0aWNpZXM6IEFycmF5LjxBcnJheS48bnVtYmVyPj4sIGZhY2VzOiB7e2ZhY2U6IEFycmF5LjxudW1iZXI+LCBjb2xvcjogc3RyaW5nfX19fSBqc29uXG4gKiBAcmV0dXJuIHtNZXNofVxuICovXG5NZXNoLmZyb21KU09OID0gZnVuY3Rpb24oanNvbil7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG4gICAgdmFyIGZhY2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGpzb24udmVydGljZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB2YXIgdmVydGV4ID0ganNvbi52ZXJ0aWNlc1tpXTtcbiAgICAgICAgdmVydGljZXMucHVzaChuZXcgVmVjdG9yKHZlcnRleFswXSwgdmVydGV4WzFdLCB2ZXJ0ZXhbMl0pKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaiA9IDAsIGxuID0ganNvbi5mYWNlcy5sZW5ndGg7IGogPCBsbjsgaisrKXtcbiAgICAgICAgdmFyIGZhY2UgPSBqc29uLmZhY2VzW2pdO1xuICAgICAgICBmYWNlcy5wdXNoKG5ldyBGYWNlKGZhY2UuZmFjZVswXSwgZmFjZS5mYWNlWzFdLCBmYWNlLmZhY2VbMl0sIGZhY2UuY29sb3IpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBNZXNoKGpzb24ubmFtZSwgdmVydGljZXMsIGZhY2VzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzaDtcbiIsIi8qKlxuICogM0QgdmVjdG9yLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0geCB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IHkgY29vcmRpbmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHogeiBjb29yZGluYXRlXG4gKi9cbmZ1bmN0aW9uIFZlY3Rvcih4LCB5LCB6KXtcbiAgICBpZiAodHlwZW9mIHggPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeiA9PT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3VmZmljaWVudCBhcmd1bWVudHMuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy56ID0gejtcbiAgICB9XG59XG4vKipcbiAqIEFkZCB2ZWN0b3IgdG8gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHZlY3Rvci54LCB0aGlzLnkgKyB2ZWN0b3IueSwgdGhpcy56ICsgdmVjdG9yLnopO1xufTtcbi8qKlxuICogU3VidHJhY3QgdmVjdG9yIGZyb20gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0gdmVjdG9yLngsIHRoaXMueSAtIHZlY3Rvci55LCB0aGlzLnogLSB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBDb21wYXJlIHZlY3RvciB3aXRoIHNlbGYgZm9yIGVxdWFsaXR5XG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy54ID09PSB2ZWN0b3IueCAmJiB0aGlzLnkgPT09IHZlY3Rvci55ICYmIHRoaXMueiA9PT0gdmVjdG9yLno7XG59O1xuLyoqXG4gKiBGaW5kIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBhID0gdGhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgYiA9IHZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICB2YXIgYW1hZyA9IGEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSBiLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gYS5kb3QoYikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiBNYXRoLmFjb3ModGhldGEpO1xufTtcbi8qKlxuICogRmluZCB0aGUgY29zIG9mIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNvc0FuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gdGhldGE7XG59O1xuLyoqXG4gKiBGaW5kIG1hZ25pdHVkZSBvZiBhIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tYWduaXR1ZGUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBNYXRoLnNxcnQoKHRoaXMueCAqIHRoaXMueCkgKyAodGhpcy55ICogdGhpcy55KSArICh0aGlzLnogKiB0aGlzLnopKTtcbn07XG4vKipcbiAqIEZpbmQgbWFnbml0dWRlIHNxdWFyZWQgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlU3F1YXJlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KTtcbn07XG4vKipcbiAqIEZpbmQgZG90IHByb2R1Y3Qgb2Ygc2VsZiBhbmQgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuICh0aGlzLnggKiB2ZWN0b3IueCkgKyAodGhpcy55ICogdmVjdG9yLnkpICsgKHRoaXMueiAqIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIEZpbmQgY3Jvc3MgcHJvZHVjdCBvZiBzZWxmIGFuZCB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKFxuICAgICAgICAodGhpcy55ICogdmVjdG9yLnopIC0gKHRoaXMueiAqIHZlY3Rvci55KSxcbiAgICAgICAgKHRoaXMueiAqIHZlY3Rvci54KSAtICh0aGlzLnggKiB2ZWN0b3IueiksXG4gICAgICAgICh0aGlzLnggKiB2ZWN0b3IueSkgLSAodGhpcy55ICogdmVjdG9yLngpXG4gICAgKTtcbn07XG4vKipcbiAqIE5vcm1hbGl6ZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7VmVjdG9yfVxuICogQHRocm93cyB7WmVyb0RpdmlzaW9uRXJyb3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGUoKTtcbiAgICBpZiAobWFnbml0dWRlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLyBtYWduaXR1ZGUsIHRoaXMueSAvIG1hZ25pdHVkZSwgdGhpcy56IC8gbWFnbml0dWRlKTtcbn07XG4vKipcbiAqIFNjYWxlIHNlbGYgYnkgc2NhbGUuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGVcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKiBzY2FsZSwgdGhpcy55ICogc2NhbGUsIHRoaXMueiAqIHNjYWxlKTtcbn07XG4vKipcbiAqIE5lZ2F0ZXMgc2VsZlxuICogQHJldHVybiB7VmVjdG9yfSBbZGVzY3JpcHRpb25dXG4gKi9cblZlY3Rvci5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gbmV3IFZlY3RvcigtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56KTtcbn07XG4vKipcbiAqIFByb2plY3Qgc2VsZiBvbnRvIHZlY3RvclxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnZlY3RvclByb2plY3Rpb24gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBtYWcgPSB2ZWN0b3IubWFnbml0dWRlKCk7XG4gICAgcmV0dXJuIHZlY3Rvci5zY2FsZSh0aGlzLmRvdCh2ZWN0b3IpIC8gKG1hZyAqIG1hZykpO1xufTtcbi8qKlxuICogUHJvamVjdCBzZWxmIG9udG8gdmVjdG9yXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc2NhbGFyUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIHRoaXMuZG90KHZlY3RvcikgLyB2ZWN0b3IubWFnbml0dWRlKCk7XG59O1xuLyoqXG4gKiBQZXJmb3JtIGxpbmVhciB0cmFuZm9ybWF0aW9uIG9uIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gdHJhbnNmb3JtX21hdHJpeFxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKHRyYW5zZm9ybV9tYXRyaXgpe1xuICAgIHZhciB4ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMF0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNF0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOF0pICsgdHJhbnNmb3JtX21hdHJpeFsxMl07XG4gICAgdmFyIHkgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsxXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs1XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFs5XSkgKyB0cmFuc2Zvcm1fbWF0cml4WzEzXTtcbiAgICB2YXIgeiA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzJdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzZdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzEwXSkgKyB0cmFuc2Zvcm1fbWF0cml4WzE0XTtcbiAgICB2YXIgdyA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzNdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzddKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzExXSkgKyB0cmFuc2Zvcm1fbWF0cml4WzE1XTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4IC8gdywgeSAvIHcsIHogLyB3KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCBheGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciB1ID0gYXhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB1Lng7XG4gICAgdmFyIHV5ID0gdS55O1xuICAgIHZhciB1eiA9IHUuejtcbiAgICB2YXIgeHkgPSB1LnggKiB1Lnk7XG4gICAgdmFyIHh6ID0gdS54ICogdS56O1xuICAgIHZhciB5eiA9IHUueSAqIHUuejtcbiAgICB2YXIgeCA9ICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy54KSArICgoKHh5KmNvczEpIC0gKHV6KnNpbikpICogdGhpcy55KSArICgoKHh6KmNvczEpKyh1eSpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHkgPSAoKCh4eSpjb3MxKSsodXoqc2luKSkgKiB0aGlzLngpICsgKChjb3MrKCh1eSp1eSkqY29zMSkpICogdGhpcy55KSArICgoKHl6KmNvczEpLSh1eCpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoKCh4eipjb3MxKS0odXkqc2luKSkgKiB0aGlzLngpICsgKCgoeXoqY29zMSkrKHV4KnNpbikpICogdGhpcy55KSArICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB4LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gKGNvcyAqIHRoaXMueSkgLSAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeiA9IChzaW4gKiB0aGlzLnkpICsgKGNvcyAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgeS1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKnRoaXMueCkgKyAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IC0oc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHotYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICogdGhpcy54KSAtIChzaW4gKiB0aGlzLnkpO1xuICAgIHZhciB5ID0gKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy55KTtcbiAgICB2YXIgeiA9IHRoaXMuejtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHBpdGNoLCB5YXcsIHJvbGxcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVQaXRjaFlhd1JvbGwgPSBmdW5jdGlvbihwaXRjaF9hbW50LCB5YXdfYW1udCwgcm9sbF9hbW50KSB7XG4gICAgcmV0dXJuIHRoaXMucm90YXRlWChyb2xsX2FtbnQpLnJvdGF0ZVkocGl0Y2hfYW1udCkucm90YXRlWih5YXdfYW1udCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjsiLCJ2YXIgcmdiVG9Ic2wsIHBhcnNlQ29sb3IsIGNhY2hlO1xuLyoqXG4gKiBBIGNvbG9yIHdpdGggYm90aCByZ2IgYW5kIGhzbCByZXByZXNlbnRhdGlvbnMuXG4gKiBAY2xhc3MgQ29sb3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBBbnkgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqL1xuZnVuY3Rpb24gQ29sb3IoY29sb3Ipe1xuICAgIHZhciBwYXJzZWRfY29sb3IgPSB7fTtcbiAgICBjb2xvciA9IGNvbG9yLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGNvbG9yIGluIGNhY2hlKXtcbiAgICAgICAgcGFyc2VkX2NvbG9yID0gY2FjaGVbY29sb3JdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnNlZF9jb2xvciA9IHBhcnNlQ29sb3IoY29sb3IpO1xuICAgICAgICBjYWNoZVtjb2xvcl0gPSBwYXJzZWRfY29sb3I7XG4gICAgfVxuICAgIHZhciBoc2wgPSByZ2JUb0hzbChwYXJzZWRfY29sb3IuciwgcGFyc2VkX2NvbG9yLmcsIHBhcnNlZF9jb2xvci5iKTtcbiAgICB0aGlzLnJnYiA9IHsncic6IHBhcnNlZF9jb2xvci5yLCAnZyc6IHBhcnNlZF9jb2xvci5nLCAnYic6IHBhcnNlZF9jb2xvci5ifTtcbiAgICB0aGlzLmhzbCA9IHsnaCc6IGhzbC5oLCAncyc6IGhzbC5zLCAnbCc6IGhzbC5sfTtcbiAgICB0aGlzLmFscGhhID0gcGFyc2VkX2NvbG9yLmEgfHwgMTtcbn1cbi8qKlxuICogTGlnaHRlbiBhIGNvbG9yIGJ5IHRoZSBnaXZlbiBwZXJjZW50YWdlLlxuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG9yfVxuICovXG5Db2xvci5wcm90b3R5cGUubGlnaHRlbiA9IGZ1bmN0aW9uKHBlcmNlbnQpe1xuICAgIHZhciBoc2wgPSB0aGlzLmhzbDtcbiAgICB2YXIgbHVtID0gaHNsLmwgKyBwZXJjZW50O1xuICAgIGlmIChsdW0gPiAxMDApe1xuICAgICAgICBsdW0gPSAxMDA7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29sb3IoXCJoc2xhKFwiICsgaHNsLmggKyBcIixcIiArIGhzbC5zICsgXCIlLFwiICsgbHVtICsgXCIlLFwiICsgdGhpcy5hbHBoYSArIFwiKVwiKTtcbn07XG4vKipcbiAqIERhcmtlbiBhIGNvbG9yIGJ5IHRoZSBnaXZlbiBwZXJjZW50YWdlLlxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmRhcmtlbiA9IGZ1bmN0aW9uKHBlcmNlbnQpe1xuICAgIHZhciBoc2wgPSB0aGlzLmhzbDtcbiAgICB2YXIgbHVtID0gaHNsLmwgLSBwZXJjZW50O1xuICAgIGlmIChsdW0gPCAwKXtcbiAgICAgICAgbHVtID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2xvcihcImhzbGEoXCIgKyBoc2wuaCArIFwiLFwiICsgaHNsLnMgKyBcIiUsXCIgKyBsdW0gKyBcIiUsXCIgKyB0aGlzLmFscGhhICsgXCIpXCIpO1xufTtcbi8qKlxuICogQHBhcmFtICB7bnVtYmVyfSByIFJlZFxuICogQHBhcmFtICB7bnVtYmVyfSBnIEdyZWVuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIgQmx1ZVxuICogQHJldHVybiB7e2g6IG51bWJlciwgczogbnVtYmVyLCBsOiBudW1iZXJ9fVxuICovXG5yZ2JUb0hzbCA9IGZ1bmN0aW9uKHIsIGcsIGIpe1xuICAgIHIgPSByIC8gMjU1O1xuICAgIGcgPSBnIC8gMjU1O1xuICAgIGIgPSBiIC8gMjU1O1xuICAgIHZhciBtYXhjID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgdmFyIG1pbmMgPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICB2YXIgbCA9IE1hdGgucm91bmQoKChtaW5jK21heGMpLzIpKjEwMCk7XG4gICAgaWYgKGwgPiAxMDApIHtsID0gMTAwO31cbiAgICBpZiAobCA8IDApIHtsID0gMDt9XG4gICAgdmFyIGgsIHM7XG4gICAgaWYgKG1pbmMgPT09IG1heGMpe1xuICAgICAgICByZXR1cm4geydoJzogMCwgJ3MnOiAwLCAnbCc6IGx9O1xuICAgIH1cbiAgICBpZiAobCA8PSA1MCl7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvIChtYXhjK21pbmMpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAoMi1tYXhjLW1pbmMpO1xuICAgIH1cbiAgICB2YXIgcmMgPSAobWF4Yy1yKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBnYyA9IChtYXhjLWcpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGJjID0gKG1heGMtYikgLyAobWF4Yy1taW5jKTtcbiAgICBpZiAociA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSBiYy1nYztcbiAgICB9XG4gICAgZWxzZSBpZiAoZyA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSAyK3JjLWJjO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBoID0gNCtnYy1yYztcbiAgICB9XG4gICAgaCA9IChoLzYpICUgMTtcbiAgICBpZiAoaCA8IDApe2grPTE7fVxuICAgIGggPSBNYXRoLnJvdW5kKGgqMzYwKTtcbiAgICBzID0gTWF0aC5yb3VuZChzKjEwMCk7XG4gICAgaWYgKGggPiAzNjApIHtoID0gMzYwO31cbiAgICBpZiAoaCA8IDApIHtoID0gMDt9XG4gICAgaWYgKHMgPiAxMDApIHtzID0gMTAwO31cbiAgICBpZiAocyA8IDApIHtzID0gMDt9XG4gICAgcmV0dXJuIHsnaCc6IGgsICdzJzogcywgJ2wnOiBsfTtcbn07XG4vKipcbiAqIFBhcnNlIGEgQ1NTIGNvbG9yIHZhbHVlIGFuZCByZXR1cm4gYW4gcmdiYSBjb2xvciBvYmplY3QuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvbG9yIEEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXJ9fSAgIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHRocm93cyB7Q29sb3JFcnJvcn0gSWYgaWxsZWdhbCBjb2xvciB2YWx1ZSBpcyBwYXNzZWQuXG4gKi9cbnBhcnNlQ29sb3IgPSBmdW5jdGlvbihjb2xvcil7XG4gICAgLy8gVE9ETzogSG93IGNyb3NzLWJyb3dzZXIgY29tcGF0aWJsZSBpcyB0aGlzPyBIb3cgZWZmaWNpZW50P1xuICAgIC8vIE1ha2UgYSB0ZW1wb3JhcnkgSFRNTCBlbGVtZW50IHN0eWxlZCB3aXRoIHRoZSBnaXZlbiBjb2xvciBzdHJpbmdcbiAgICAvLyB0aGVuIGV4dHJhY3QgYW5kIHBhcnNlIHRoZSBjb21wdXRlZCByZ2IoYSkgdmFsdWUuXG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcbiAgICB2YXIgcmdiYSA9IGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgLy8gQ29udmVydCBzdHJpbmcgaW4gZm9ybSAncmdiW2FdKG51bSwgbnVtLCBudW1bLCBudW1dKScgdG8gYXJyYXkgWydudW0nLCAnbnVtJywgJ251bSdbLCAnbnVtJ11dXG4gICAgcmdiYSA9IHJnYmEuc2xpY2UocmdiYS5pbmRleE9mKCcoJykrMSkuc2xpY2UoMCwtMSkucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xuICAgIHZhciByZXR1cm5fY29sb3IgPSB7fTtcbiAgICB2YXIgY29sb3Jfc3BhY2VzID0gWydyJywgJ2cnLCAnYicsICdhJ107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZ2JhLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdChyZ2JhW2ldKTsgLy8gQWxwaGEgdmFsdWUgd2lsbCBiZSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgaWYgKGlzTmFOKHZhbHVlKSl7XG4gICAgICAgICAgICB0aHJvdyBcIkNvbG9yRXJyb3I6IFNvbWV0aGluZyB3ZW50IHdyb25nLiBQZXJoYXBzIFwiICsgY29sb3IgKyBcIiBpcyBub3QgYSBsZWdhbCBDU1MgY29sb3IgdmFsdWVcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybl9jb2xvcltjb2xvcl9zcGFjZXNbaV1dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldHVybl9jb2xvcjtcbn07XG4vLyBQcmUtd2FybSB0aGUgY2FjaGUgd2l0aCBuYW1lZCBjb2xvcnMsIGFzIHRoZXNlIGFyZSBub3Rcbi8vIGNvbnZlcnRlZCB0byByZ2IgdmFsdWVzIGJ5IHRoZSBwYXJzZUNvbG9yIGZ1bmN0aW9uIGFib3ZlLlxuY2FjaGUgPSB7XG4gICAgXCJibGFja1wiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMH0sXG4gICAgXCJzaWx2ZXJcIjoge1wiclwiOiAxOTIsIFwiZ1wiOiAxOTIsIFwiYlwiOiAxOTIsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDc1fSxcbiAgICBcImdyYXlcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDUwfSxcbiAgICBcIndoaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAxMDB9LFxuICAgIFwibWFyb29uXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwicmVkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwicHVycGxlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDEyOCwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImZ1Y2hzaWFcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImxpbWVcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9saXZlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwieWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwibmF2eVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwidGVhbFwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJhcXVhXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2NSwgXCJiXCI6IDAsIFwiaFwiOiAzOSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDIwOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImFudGlxdWV3aGl0ZVwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDIzNSwgXCJiXCI6IDIxNSwgXCJoXCI6IDM0LCBcInNcIjogNzgsIFwibFwiOiA5MX0sXG4gICAgXCJhcXVhbWFyaW5lXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMjEyLCBcImhcIjogMTYwLCBcInNcIjogMTAwLCBcImxcIjogNzV9LFxuICAgIFwiYXp1cmVcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJiZWlnZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDIyMCwgXCJoXCI6IDYwLCBcInNcIjogNTYsIFwibFwiOiA5MX0sXG4gICAgXCJiaXNxdWVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxOTYsIFwiaFwiOiAzMywgXCJzXCI6IDEwMCwgXCJsXCI6IDg4fSxcbiAgICBcImJsYW5jaGVkYWxtb25kXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM1LCBcImJcIjogMjA1LCBcImhcIjogMzYsIFwic1wiOiAxMDAsIFwibFwiOiA5MH0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcInJcIjogMTM4LCBcImdcIjogNDMsIFwiYlwiOiAyMjYsIFwiaFwiOiAyNzEsIFwic1wiOiA3NiwgXCJsXCI6IDUzfSxcbiAgICBcImJyb3duXCI6IHtcInJcIjogMTY1LCBcImdcIjogNDIsIFwiYlwiOiA0MiwgXCJoXCI6IDAsIFwic1wiOiA1OSwgXCJsXCI6IDQxfSxcbiAgICBcImJ1cmx5d29vZFwiOiB7XCJyXCI6IDIyMiwgXCJnXCI6IDE4NCwgXCJiXCI6IDEzNSwgXCJoXCI6IDM0LCBcInNcIjogNTcsIFwibFwiOiA3MH0sXG4gICAgXCJjYWRldGJsdWVcIjoge1wiclwiOiA5NSwgXCJnXCI6IDE1OCwgXCJiXCI6IDE2MCwgXCJoXCI6IDE4MiwgXCJzXCI6IDI1LCBcImxcIjogNTB9LFxuICAgIFwiY2hhcnRyZXVzZVwiOiB7XCJyXCI6IDEyNywgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiA5MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDEwNSwgXCJiXCI6IDMwLCBcImhcIjogMjUsIFwic1wiOiA3NSwgXCJsXCI6IDQ3fSxcbiAgICBcImNvcmFsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTI3LCBcImJcIjogODAsIFwiaFwiOiAxNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDY2fSxcbiAgICBcImNvcm5mbG93ZXJibHVlXCI6IHtcInJcIjogMTAwLCBcImdcIjogMTQ5LCBcImJcIjogMjM3LCBcImhcIjogMjE5LCBcInNcIjogNzksIFwibFwiOiA2Nn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0OCwgXCJiXCI6IDIyMCwgXCJoXCI6IDQ4LCBcInNcIjogMTAwLCBcImxcIjogOTN9LFxuICAgIFwiY3JpbXNvblwiOiB7XCJyXCI6IDIyMCwgXCJnXCI6IDIwLCBcImJcIjogNjAsIFwiaFwiOiAzNDgsIFwic1wiOiA4MywgXCJsXCI6IDQ3fSxcbiAgICBcImRhcmtibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMzksIFwiYlwiOiAxMzksIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrZ29sZGVucm9kXCI6IHtcInJcIjogMTg0LCBcImdcIjogMTM0LCBcImJcIjogMTEsIFwiaFwiOiA0MywgXCJzXCI6IDg5LCBcImxcIjogMzh9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDY2fSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMDAsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogMjB9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDY2fSxcbiAgICBcImRhcmtraGFraVwiOiB7XCJyXCI6IDE4OSwgXCJnXCI6IDE4MywgXCJiXCI6IDEwNywgXCJoXCI6IDU2LCBcInNcIjogMzgsIFwibFwiOiA1OH0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrb2xpdmVncmVlblwiOiB7XCJyXCI6IDg1LCBcImdcIjogMTA3LCBcImJcIjogNDcsIFwiaFwiOiA4MiwgXCJzXCI6IDM5LCBcImxcIjogMzB9LFxuICAgIFwiZGFya29yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE0MCwgXCJiXCI6IDAsIFwiaFwiOiAzMywgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImRhcmtvcmNoaWRcIjoge1wiclwiOiAxNTMsIFwiZ1wiOiA1MCwgXCJiXCI6IDIwNCwgXCJoXCI6IDI4MCwgXCJzXCI6IDYxLCBcImxcIjogNTB9LFxuICAgIFwiZGFya3JlZFwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiclwiOiAyMzMsIFwiZ1wiOiAxNTAsIFwiYlwiOiAxMjIsIFwiaFwiOiAxNSwgXCJzXCI6IDcyLCBcImxcIjogNzB9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcInJcIjogMTQzLCBcImdcIjogMTg4LCBcImJcIjogMTQzLCBcImhcIjogMTIwLCBcInNcIjogMjUsIFwibFwiOiA2NX0sXG4gICAgXCJkYXJrc2xhdGVibHVlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiA2MSwgXCJiXCI6IDEzOSwgXCJoXCI6IDI0OCwgXCJzXCI6IDM5LCBcImxcIjogMzl9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDE4MCwgXCJzXCI6IDI1LCBcImxcIjogMjV9LFxuICAgIFwiZGFya3NsYXRlZ3JleVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDE4MCwgXCJzXCI6IDI1LCBcImxcIjogMjV9LFxuICAgIFwiZGFya3R1cnF1b2lzZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMDksIFwiaFwiOiAxODEsIFwic1wiOiAxMDAsIFwibFwiOiA0MX0sXG4gICAgXCJkYXJrdmlvbGV0XCI6IHtcInJcIjogMTQ4LCBcImdcIjogMCwgXCJiXCI6IDIxMSwgXCJoXCI6IDI4MiwgXCJzXCI6IDEwMCwgXCJsXCI6IDQxfSxcbiAgICBcImRlZXBwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjAsIFwiYlwiOiAxNDcsIFwiaFwiOiAzMjgsIFwic1wiOiAxMDAsIFwibFwiOiA1NH0sXG4gICAgXCJkZWVwc2t5Ymx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyNTUsIFwiaFwiOiAxOTUsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJkaW1ncmF5XCI6IHtcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA0MX0sXG4gICAgXCJkaW1ncmV5XCI6IHtcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA0MX0sXG4gICAgXCJkb2RnZXJibHVlXCI6IHtcInJcIjogMzAsIFwiZ1wiOiAxNDQsIFwiYlwiOiAyNTUsIFwiaFwiOiAyMTAsIFwic1wiOiAxMDAsIFwibFwiOiA1Nn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiclwiOiAxNzgsIFwiZ1wiOiAzNCwgXCJiXCI6IDM0LCBcImhcIjogMCwgXCJzXCI6IDY4LCBcImxcIjogNDJ9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNDAsIFwiaFwiOiA0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcInJcIjogMzQsIFwiZ1wiOiAxMzksIFwiYlwiOiAzNCwgXCJoXCI6IDEyMCwgXCJzXCI6IDYxLCBcImxcIjogMzR9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjIwLCBcImJcIjogMjIwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4Nn0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcInJcIjogMjQ4LCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogOTl9LFxuICAgIFwiZ29sZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxNSwgXCJiXCI6IDAsIFwiaFwiOiA1MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImdvbGRlbnJvZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDE2NSwgXCJiXCI6IDMyLCBcImhcIjogNDMsIFwic1wiOiA3NCwgXCJsXCI6IDQ5fSxcbiAgICBcImdyZWVueWVsbG93XCI6IHtcInJcIjogMTczLCBcImdcIjogMjU1LCBcImJcIjogNDcsIFwiaFwiOiA4NCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU5fSxcbiAgICBcImdyZXlcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDUwfSxcbiAgICBcImhvbmV5ZGV3XCI6IHtcInJcIjogMjQwLCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiaG90cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDE4MCwgXCJoXCI6IDMzMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDcxfSxcbiAgICBcImluZGlhbnJlZFwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDkyLCBcImJcIjogOTIsIFwiaFwiOiAwLCBcInNcIjogNTMsIFwibFwiOiA1OH0sXG4gICAgXCJpbmRpZ29cIjoge1wiclwiOiA3NSwgXCJnXCI6IDAsIFwiYlwiOiAxMzAsIFwiaFwiOiAyNzUsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJpdm9yeVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI0MCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwia2hha2lcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAxNDAsIFwiaFwiOiA1NCwgXCJzXCI6IDc3LCBcImxcIjogNzV9LFxuICAgIFwibGF2ZW5kZXJcIjoge1wiclwiOiAyMzAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAyNTAsIFwiaFwiOiAyNDAsIFwic1wiOiA2NywgXCJsXCI6IDk0fSxcbiAgICBcImxhdmVuZGVyYmx1c2hcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyNDUsIFwiaFwiOiAzNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiclwiOiAxMjQsIFwiZ1wiOiAyNTIsIFwiYlwiOiAwLCBcImhcIjogOTAsIFwic1wiOiAxMDAsIFwibFwiOiA0OX0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMDUsIFwiaFwiOiA1NCwgXCJzXCI6IDEwMCwgXCJsXCI6IDkwfSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDIxNiwgXCJiXCI6IDIzMCwgXCJoXCI6IDE5NSwgXCJzXCI6IDUzLCBcImxcIjogNzl9LFxuICAgIFwibGlnaHRjb3JhbFwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiA3OSwgXCJsXCI6IDcyfSxcbiAgICBcImxpZ2h0Y3lhblwiOiB7XCJyXCI6IDIyNCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IHtcInJcIjogMjUwLCBcImdcIjogMjUwLCBcImJcIjogMjEwLCBcImhcIjogNjAsIFwic1wiOiA4MCwgXCJsXCI6IDkwfSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogODN9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJyXCI6IDE0NCwgXCJnXCI6IDIzOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDEyMCwgXCJzXCI6IDczLCBcImxcIjogNzV9LFxuICAgIFwibGlnaHRncmV5XCI6IHtcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4M30sXG4gICAgXCJsaWdodHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxODIsIFwiYlwiOiAxOTMsIFwiaFwiOiAzNTEsIFwic1wiOiAxMDAsIFwibFwiOiA4Nn0sXG4gICAgXCJsaWdodHNhbG1vblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDE3LCBcInNcIjogMTAwLCBcImxcIjogNzR9LFxuICAgIFwibGlnaHRzZWFncmVlblwiOiB7XCJyXCI6IDMyLCBcImdcIjogMTc4LCBcImJcIjogMTcwLCBcImhcIjogMTc3LCBcInNcIjogNzAsIFwibFwiOiA0MX0sXG4gICAgXCJsaWdodHNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyNTAsIFwiaFwiOiAyMDMsIFwic1wiOiA5MiwgXCJsXCI6IDc1fSxcbiAgICBcImxpZ2h0c2xhdGVncmF5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMjEwLCBcInNcIjogMTQsIFwibFwiOiA1M30sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDIxMCwgXCJzXCI6IDE0LCBcImxcIjogNTN9LFxuICAgIFwibGlnaHRzdGVlbGJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAxOTYsIFwiYlwiOiAyMjIsIFwiaFwiOiAyMTQsIFwic1wiOiA0MSwgXCJsXCI6IDc4fSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjI0LCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA5NH0sXG4gICAgXCJsaW1lZ3JlZW5cIjoge1wiclwiOiA1MCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogMTIwLCBcInNcIjogNjEsIFwibFwiOiA1MH0sXG4gICAgXCJsaW5lblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI0MCwgXCJiXCI6IDIzMCwgXCJoXCI6IDMwLCBcInNcIjogNjcsIFwibFwiOiA5NH0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcInJcIjogMTAyLCBcImdcIjogMjA1LCBcImJcIjogMTcwLCBcImhcIjogMTYwLCBcInNcIjogNTEsIFwibFwiOiA2MH0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyMDUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA0MH0sXG4gICAgXCJtZWRpdW1vcmNoaWRcIjoge1wiclwiOiAxODYsIFwiZ1wiOiA4NSwgXCJiXCI6IDIxMSwgXCJoXCI6IDI4OCwgXCJzXCI6IDU5LCBcImxcIjogNTh9LFxuICAgIFwibWVkaXVtcHVycGxlXCI6IHtcInJcIjogMTQ3LCBcImdcIjogMTEyLCBcImJcIjogMjE5LCBcImhcIjogMjYwLCBcInNcIjogNjAsIFwibFwiOiA2NX0sXG4gICAgXCJtZWRpdW1zZWFncmVlblwiOiB7XCJyXCI6IDYwLCBcImdcIjogMTc5LCBcImJcIjogMTEzLCBcImhcIjogMTQ3LCBcInNcIjogNTAsIFwibFwiOiA0N30sXG4gICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjoge1wiclwiOiAxMjMsIFwiZ1wiOiAxMDQsIFwiYlwiOiAyMzgsIFwiaFwiOiAyNDksIFwic1wiOiA4MCwgXCJsXCI6IDY3fSxcbiAgICBcIm1lZGl1bXNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1MCwgXCJiXCI6IDE1NCwgXCJoXCI6IDE1NywgXCJzXCI6IDEwMCwgXCJsXCI6IDQ5fSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJyXCI6IDcyLCBcImdcIjogMjA5LCBcImJcIjogMjA0LCBcImhcIjogMTc4LCBcInNcIjogNjAsIFwibFwiOiA1NX0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiclwiOiAxOTksIFwiZ1wiOiAyMSwgXCJiXCI6IDEzMywgXCJoXCI6IDMyMiwgXCJzXCI6IDgxLCBcImxcIjogNDN9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcInJcIjogMjUsIFwiZ1wiOiAyNSwgXCJiXCI6IDExMiwgXCJoXCI6IDI0MCwgXCJzXCI6IDY0LCBcImxcIjogMjd9LFxuICAgIFwibWludGNyZWFtXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjU1LCBcImJcIjogMjUwLCBcImhcIjogMTUwLCBcInNcIjogMTAwLCBcImxcIjogOTh9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMjI1LCBcImhcIjogNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcIm1vY2Nhc2luXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMTgxLCBcImhcIjogMzgsIFwic1wiOiAxMDAsIFwibFwiOiA4NX0sXG4gICAgXCJuYXZham93aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3MywgXCJoXCI6IDM2LCBcInNcIjogMTAwLCBcImxcIjogODR9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJyXCI6IDI1MywgXCJnXCI6IDI0NSwgXCJiXCI6IDIzMCwgXCJoXCI6IDM5LCBcInNcIjogODUsIFwibFwiOiA5NX0sXG4gICAgXCJvbGl2ZWRyYWJcIjoge1wiclwiOiAxMDcsIFwiZ1wiOiAxNDIsIFwiYlwiOiAzNSwgXCJoXCI6IDgwLCBcInNcIjogNjAsIFwibFwiOiAzNX0sXG4gICAgXCJvcmFuZ2VyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA2OSwgXCJiXCI6IDAsIFwiaFwiOiAxNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9yY2hpZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDExMiwgXCJiXCI6IDIxNCwgXCJoXCI6IDMwMiwgXCJzXCI6IDU5LCBcImxcIjogNjV9LFxuICAgIFwicGFsZWdvbGRlbnJvZFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDIzMiwgXCJiXCI6IDE3MCwgXCJoXCI6IDU1LCBcInNcIjogNjcsIFwibFwiOiA4MH0sXG4gICAgXCJwYWxlZ3JlZW5cIjoge1wiclwiOiAxNTIsIFwiZ1wiOiAyNTEsIFwiYlwiOiAxNTIsIFwiaFwiOiAxMjAsIFwic1wiOiA5MywgXCJsXCI6IDc5fSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiclwiOiAxNzUsIFwiZ1wiOiAyMzgsIFwiYlwiOiAyMzgsIFwiaFwiOiAxODAsIFwic1wiOiA2NSwgXCJsXCI6IDgxfSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiclwiOiAyMTksIFwiZ1wiOiAxMTIsIFwiYlwiOiAxNDcsIFwiaFwiOiAzNDAsIFwic1wiOiA2MCwgXCJsXCI6IDY1fSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzksIFwiYlwiOiAyMTMsIFwiaFwiOiAzNywgXCJzXCI6IDEwMCwgXCJsXCI6IDkyfSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxOCwgXCJiXCI6IDE4NSwgXCJoXCI6IDI4LCBcInNcIjogMTAwLCBcImxcIjogODZ9LFxuICAgIFwicGVydVwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDEzMywgXCJiXCI6IDYzLCBcImhcIjogMzAsIFwic1wiOiA1OSwgXCJsXCI6IDUzfSxcbiAgICBcInBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxOTIsIFwiYlwiOiAyMDMsIFwiaFwiOiAzNTAsIFwic1wiOiAxMDAsIFwibFwiOiA4OH0sXG4gICAgXCJwbHVtXCI6IHtcInJcIjogMjIxLCBcImdcIjogMTYwLCBcImJcIjogMjIxLCBcImhcIjogMzAwLCBcInNcIjogNDcsIFwibFwiOiA3NX0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMjI0LCBcImJcIjogMjMwLCBcImhcIjogMTg3LCBcInNcIjogNTIsIFwibFwiOiA4MH0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiclwiOiAxODgsIFwiZ1wiOiAxNDMsIFwiYlwiOiAxNDMsIFwiaFwiOiAwLCBcInNcIjogMjUsIFwibFwiOiA2NX0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiclwiOiA2NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDIyNSwgXCJoXCI6IDIyNSwgXCJzXCI6IDczLCBcImxcIjogNTd9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiclwiOiAxMzksIFwiZ1wiOiA2OSwgXCJiXCI6IDE5LCBcImhcIjogMjUsIFwic1wiOiA3NiwgXCJsXCI6IDMxfSxcbiAgICBcInNhbG1vblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDExNCwgXCJoXCI6IDYsIFwic1wiOiA5MywgXCJsXCI6IDcxfSxcbiAgICBcInNhbmR5YnJvd25cIjoge1wiclwiOiAyNDQsIFwiZ1wiOiAxNjQsIFwiYlwiOiA5NiwgXCJoXCI6IDI4LCBcInNcIjogODcsIFwibFwiOiA2N30sXG4gICAgXCJzZWFncmVlblwiOiB7XCJyXCI6IDQ2LCBcImdcIjogMTM5LCBcImJcIjogODcsIFwiaFwiOiAxNDYsIFwic1wiOiA1MCwgXCJsXCI6IDM2fSxcbiAgICBcInNlYXNoZWxsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ1LCBcImJcIjogMjM4LCBcImhcIjogMjUsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJzaWVubmFcIjoge1wiclwiOiAxNjAsIFwiZ1wiOiA4MiwgXCJiXCI6IDQ1LCBcImhcIjogMTksIFwic1wiOiA1NiwgXCJsXCI6IDQwfSxcbiAgICBcInNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMzUsIFwiaFwiOiAxOTcsIFwic1wiOiA3MSwgXCJsXCI6IDczfSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEwNiwgXCJnXCI6IDkwLCBcImJcIjogMjA1LCBcImhcIjogMjQ4LCBcInNcIjogNTMsIFwibFwiOiA1OH0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAyMTAsIFwic1wiOiAxMywgXCJsXCI6IDUwfSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDIxMCwgXCJzXCI6IDEzLCBcImxcIjogNTB9LFxuICAgIFwic25vd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI1MCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiA5OX0sXG4gICAgXCJzcHJpbmdncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAxMjcsIFwiaFwiOiAxNTAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJzdGVlbGJsdWVcIjoge1wiclwiOiA3MCwgXCJnXCI6IDEzMCwgXCJiXCI6IDE4MCwgXCJoXCI6IDIwNywgXCJzXCI6IDQ0LCBcImxcIjogNDl9LFxuICAgIFwidGFuXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTgwLCBcImJcIjogMTQwLCBcImhcIjogMzQsIFwic1wiOiA0NCwgXCJsXCI6IDY5fSxcbiAgICBcInRoaXN0bGVcIjoge1wiclwiOiAyMTYsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyMTYsIFwiaFwiOiAzMDAsIFwic1wiOiAyNCwgXCJsXCI6IDgwfSxcbiAgICBcInRvbWF0b1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDk5LCBcImJcIjogNzEsIFwiaFwiOiA5LCBcInNcIjogMTAwLCBcImxcIjogNjR9LFxuICAgIFwidHVycXVvaXNlXCI6IHtcInJcIjogNjQsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMDgsIFwiaFwiOiAxNzQsIFwic1wiOiA3MiwgXCJsXCI6IDU2fSxcbiAgICBcInZpb2xldFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDEzMCwgXCJiXCI6IDIzOCwgXCJoXCI6IDMwMCwgXCJzXCI6IDc2LCBcImxcIjogNzJ9LFxuICAgIFwid2hlYXRcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzksIFwiaFwiOiAzOSwgXCJzXCI6IDc3LCBcImxcIjogODN9LFxuICAgIFwid2hpdGVzbW9rZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDI0NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogOTZ9LFxuICAgIFwieWVsbG93Z3JlZW5cIjoge1wiclwiOiAxNTQsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDgwLCBcInNcIjogNjEsIFwibFwiOiA1MH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7IiwiLyoqIFxuICogQGNvbnN0YW50XG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIG51bWJlcj59IFxuICovXG52YXIgS0VZQ09ERVMgPSB7XG4gICAgJ2JhY2tzcGFjZScgOiA4LFxuICAgICd0YWInIDogOSxcbiAgICAnZW50ZXInIDogMTMsXG4gICAgJ3NoaWZ0JyA6IDE2LFxuICAgICdjdHJsJyA6IDE3LFxuICAgICdhbHQnIDogMTgsXG4gICAgJ3BhdXNlX2JyZWFrJyA6IDE5LFxuICAgICdjYXBzX2xvY2snIDogMjAsXG4gICAgJ2VzY2FwZScgOiAyNyxcbiAgICAncGFnZV91cCcgOiAzMyxcbiAgICAncGFnZSBkb3duJyA6IDM0LFxuICAgICdlbmQnIDogMzUsXG4gICAgJ2hvbWUnIDogMzYsXG4gICAgJ2xlZnRfYXJyb3cnIDogMzcsXG4gICAgJ3VwX2Fycm93JyA6IDM4LFxuICAgICdyaWdodF9hcnJvdycgOiAzOSxcbiAgICAnZG93bl9hcnJvdycgOiA0MCxcbiAgICAnaW5zZXJ0JyA6IDQ1LFxuICAgICdkZWxldGUnIDogNDYsXG4gICAgJzAnIDogNDgsXG4gICAgJzEnIDogNDksXG4gICAgJzInIDogNTAsXG4gICAgJzMnIDogNTEsXG4gICAgJzQnIDogNTIsXG4gICAgJzUnIDogNTMsXG4gICAgJzYnIDogNTQsXG4gICAgJzcnIDogNTUsXG4gICAgJzgnIDogNTYsXG4gICAgJzknIDogNTcsXG4gICAgJ2EnIDogNjUsXG4gICAgJ2InIDogNjYsXG4gICAgJ2MnIDogNjcsXG4gICAgJ2QnIDogNjgsXG4gICAgJ2UnIDogNjksXG4gICAgJ2YnIDogNzAsXG4gICAgJ2cnIDogNzEsXG4gICAgJ2gnIDogNzIsXG4gICAgJ2knIDogNzMsXG4gICAgJ2onIDogNzQsXG4gICAgJ2snIDogNzUsXG4gICAgJ2wnIDogNzYsXG4gICAgJ20nIDogNzcsXG4gICAgJ24nIDogNzgsXG4gICAgJ28nIDogNzksXG4gICAgJ3AnIDogODAsXG4gICAgJ3EnIDogODEsXG4gICAgJ3InIDogODIsXG4gICAgJ3MnIDogODMsXG4gICAgJ3QnIDogODQsXG4gICAgJ3UnIDogODUsXG4gICAgJ3YnIDogODYsXG4gICAgJ3cnIDogODcsXG4gICAgJ3gnIDogODgsXG4gICAgJ3knIDogODksXG4gICAgJ3onIDogOTAsXG4gICAgJ2xlZnRfd2luZG93IGtleScgOiA5MSxcbiAgICAncmlnaHRfd2luZG93IGtleScgOiA5MixcbiAgICAnc2VsZWN0X2tleScgOiA5MyxcbiAgICAnbnVtcGFkIDAnIDogOTYsXG4gICAgJ251bXBhZCAxJyA6IDk3LFxuICAgICdudW1wYWQgMicgOiA5OCxcbiAgICAnbnVtcGFkIDMnIDogOTksXG4gICAgJ251bXBhZCA0JyA6IDEwMCxcbiAgICAnbnVtcGFkIDUnIDogMTAxLFxuICAgICdudW1wYWQgNicgOiAxMDIsXG4gICAgJ251bXBhZCA3JyA6IDEwMyxcbiAgICAnbnVtcGFkIDgnIDogMTA0LFxuICAgICdudW1wYWQgOScgOiAxMDUsXG4gICAgJ211bHRpcGx5JyA6IDEwNixcbiAgICAnYWRkJyA6IDEwNyxcbiAgICAnc3VidHJhY3QnIDogMTA5LFxuICAgICdkZWNpbWFsIHBvaW50JyA6IDExMCxcbiAgICAnZGl2aWRlJyA6IDExMSxcbiAgICAnZjEnIDogMTEyLFxuICAgICdmMicgOiAxMTMsXG4gICAgJ2YzJyA6IDExNCxcbiAgICAnZjQnIDogMTE1LFxuICAgICdmNScgOiAxMTYsXG4gICAgJ2Y2JyA6IDExNyxcbiAgICAnZjcnIDogMTE4LFxuICAgICdmOCcgOiAxMTksXG4gICAgJ2Y5JyA6IDEyMCxcbiAgICAnZjEwJyA6IDEyMSxcbiAgICAnZjExJyA6IDEyMixcbiAgICAnZjEyJyA6IDEyMyxcbiAgICAnbnVtX2xvY2snIDogMTQ0LFxuICAgICdzY3JvbGxfbG9jaycgOiAxNDUsXG4gICAgJ3NlbWlfY29sb24nIDogMTg2LFxuICAgICdlcXVhbF9zaWduJyA6IDE4NyxcbiAgICAnY29tbWEnIDogMTg4LFxuICAgICdkYXNoJyA6IDE4OSxcbiAgICAncGVyaW9kJyA6IDE5MCxcbiAgICAnZm9yd2FyZF9zbGFzaCcgOiAxOTEsXG4gICAgJ2dyYXZlX2FjY2VudCcgOiAxOTIsXG4gICAgJ29wZW5fYnJhY2tldCcgOiAyMTksXG4gICAgJ2JhY2tzbGFzaCcgOiAyMjAsXG4gICAgJ2Nsb3NlYnJhY2tldCcgOiAyMjEsXG4gICAgJ3NpbmdsZV9xdW90ZScgOiAyMjJcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gS0VZQ09ERVM7IiwicmVxdWlyZSgnLi8uLi90ZXN0cy9oZWxwZXJzLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2RhdGEvY29sb3JzLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2VuZ2luZS9jYW1lcmEuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZW5naW5lL3NjZW5lLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvZmFjZS5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL21hdHJpeC5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL21lc2guanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC92ZWN0b3IuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvdXRpbGl0aWVzL2NvbG9yLmpzJyk7XG4iLCJ2YXIgbmFtZWRjb2xvcnMgPSB7XG4gICAgXCJhbGljZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogMCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjBmOGZmXCJ9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyMzUsXCJiXCI6IDIxNSB9LCBcImhleFwiOiBcIiNmYWViZDdcIn0sXG4gICAgXCJhcXVhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiYXF1YW1hcmluZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiAxMDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjcsXCJnXCI6IDI1NSxcImJcIjogMjEyIH0sIFwiaGV4XCI6IFwiIzdmZmZkNFwifSxcbiAgICBcImF6dXJlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2YwZmZmZlwifSxcbiAgICBcImJlaWdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2Y1ZjVkY1wifSxcbiAgICBcImJpc3F1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMTk2IH0sIFwiaGV4XCI6IFwiI2ZmZTRjNFwifSxcbiAgICBcImJsYWNrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDAwMDAwXCJ9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMzUsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiNmZmViY2RcIn0sXG4gICAgXCJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMDAwZmZcIn0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMTM4LFwiZ1wiOiA0MyxcImJcIjogMjI2IH0sIFwiaGV4XCI6IFwiIzhhMmJlMlwifSxcbiAgICBcImJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTY1LFwiZ1wiOiA0MixcImJcIjogNDIgfSwgXCJoZXhcIjogXCIjYTUyYTJhXCJ9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMixcImdcIjogMTg0LFwiYlwiOiAxMzUgfSwgXCJoZXhcIjogXCIjZGViODg3XCJ9LFxuICAgIFwiY2FkZXRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDk1LFwiZ1wiOiAxNTgsXCJiXCI6IDE2MCB9LCBcImhleFwiOiBcIiM1ZjllYTBcIn0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNyxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzdmZmYwMFwifSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTAsXCJnXCI6IDEwNSxcImJcIjogMzAgfSwgXCJoZXhcIjogXCIjZDI2OTFlXCJ9LFxuICAgIFwiY29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDEyNyxcImJcIjogODAgfSwgXCJoZXhcIjogXCIjZmY3ZjUwXCJ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjA4LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTAwLFwiZ1wiOiAxNDksXCJiXCI6IDIzNyB9LCBcImhleFwiOiBcIiM2NDk1ZWRcIn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNzgsXCJsXCI6IDkxIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDgsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNmZmY4ZGNcIn0sXG4gICAgXCJjcmltc29uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2MCxcInNcIjogMTAwLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjAsXCJiXCI6IDYwIH0sIFwiaGV4XCI6IFwiI2RjMTQzY1wifSxcbiAgICBcImN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDU2LFwibFwiOiA5MSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiMwMDAwOGJcIn0sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA4OCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEzOSxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzAwOGI4YlwifSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMzYsXCJzXCI6IDEwMCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxODQsXCJnXCI6IDEzNCxcImJcIjogMTEgfSwgXCJoZXhcIjogXCIjYjg4NjBiXCJ9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjcxLFwic1wiOiA3NixcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjksXCJnXCI6IDE2OSxcImJcIjogMTY5IH0sIFwiaGV4XCI6IFwiI2E5YTlhOVwifSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA1OSxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA2NDAwXCJ9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDU3LFwibFwiOiA3MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE2OSxcImdcIjogMTY5LFwiYlwiOiAxNjkgfSwgXCJoZXhcIjogXCIjYTlhOWE5XCJ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MixcInNcIjogMjUsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTg5LFwiZ1wiOiAxODMsXCJiXCI6IDEwNyB9LCBcImhleFwiOiBcIiNiZGI3NmJcIn0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiA5MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOSxcImdcIjogMCxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzhiMDA4YlwifSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NSxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiA4NSxcImdcIjogMTA3LFwiYlwiOiA0NyB9LCBcImhleFwiOiBcIiM1NTZiMmZcIn0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY4YzAwXCJ9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTksXCJzXCI6IDc5LFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE1MyxcImdcIjogNTAsXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM5OTMyY2NcIn0sXG4gICAgXCJkYXJrcmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQ4LFwic1wiOiAxMDAsXCJsXCI6IDkzIH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzhiMDAwMFwifSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogMzQ4LFwic1wiOiA4MyxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzMsXCJnXCI6IDE1MCxcImJcIjogMTIyIH0sIFwiaGV4XCI6IFwiI2U5OTY3YVwifSxcbiAgICBcImRhcmtzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDMsXCJnXCI6IDE4OCxcImJcIjogMTQzIH0sIFwiaGV4XCI6IFwiIzhmYmM4ZlwifSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogNzIsXCJnXCI6IDYxLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjNDgzZDhiXCJ9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogODksXCJsXCI6IDM4IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiAyMCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDIwNixcImJcIjogMjA5IH0sIFwiaGV4XCI6IFwiIzAwY2VkMVwifSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDgsXCJnXCI6IDAsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiM5NDAwZDNcIn0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiA1NixcInNcIjogMzgsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMCxcImJcIjogMTQ3IH0sIFwiaGV4XCI6IFwiI2ZmMTQ5M1wifSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDE5MSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwYmZmZlwifSxcbiAgICBcImRpbWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogODIsXCJzXCI6IDM5LFwibFwiOiAzMCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZGltZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDMwLFwiZ1wiOiAxNDQsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMxZTkwZmZcIn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDE3OCxcImdcIjogMzQsXCJiXCI6IDM0IH0sIFwiaGV4XCI6IFwiI2IyMjIyMlwifSxcbiAgICBcImZsb3JhbHdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1LFwic1wiOiA3MixcImxcIjogNzAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2ZmZmFmMFwifSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMzQsXCJnXCI6IDEzOSxcImJcIjogMzQgfSwgXCJoZXhcIjogXCIjMjI4YjIyXCJ9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDgsXCJzXCI6IDM5LFwibFwiOiAzOSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcImdhaW5zYm9yb1wiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjIwLFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZGNkY2RjXCJ9LFxuICAgIFwiZ2hvc3R3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0OCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjhmOGZmXCJ9LFxuICAgIFwiZ29sZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODEsXCJzXCI6IDEwMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIxNSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmQ3MDBcIn0sXG4gICAgXCJnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMjgyLFwic1wiOiAxMDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxNjUsXCJiXCI6IDMyIH0sIFwiaGV4XCI6IFwiI2RhYTUyMFwifSxcbiAgICBcImdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzI4LFwic1wiOiAxMDAsXCJsXCI6IDU0IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDgwODBcIn0sXG4gICAgXCJncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA4MDAwXCJ9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDI1NSxcImJcIjogNDcgfSwgXCJoZXhcIjogXCIjYWRmZjJmXCJ9LFxuICAgIFwiZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODA4MDgwXCJ9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxMDAsXCJsXCI6IDU2IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNTUsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmMGZmZjBcIn0sXG4gICAgXCJob3RwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDY4LFwibFwiOiA0MiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTA1LFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjZmY2OWI0XCJ9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjA1LFwiZ1wiOiA5MixcImJcIjogOTIgfSwgXCJoZXhcIjogXCIjY2Q1YzVjXCJ9LFxuICAgIFwiaW5kaWdvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNjEsXCJsXCI6IDM0IH0sIFwicmdiXCI6IHtcInJcIjogNzUsXCJnXCI6IDAsXCJiXCI6IDEzMCB9LCBcImhleFwiOiBcIiM0YjAwODJcIn0sXG4gICAgXCJpdm9yeVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZmZmZmYwXCJ9LFxuICAgIFwia2hha2lcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDk5IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyMzAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNmMGU2OGNcIn0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJoc2xcIjoge1wiaFwiOiA1MSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIzMCxcImdcIjogMjMwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZTZlNmZhXCJ9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogNzQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDAsXCJiXCI6IDI0NSB9LCBcImhleFwiOiBcIiNmZmYwZjVcIn0sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogODQsXCJzXCI6IDEwMCxcImxcIjogNTkgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjQsXCJnXCI6IDI1MixcImJcIjogMCB9LCBcImhleFwiOiBcIiM3Y2ZjMDBcIn0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiI2ZmZmFjZFwifSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDIxNixcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2FkZDhlNlwifSxcbiAgICBcImxpZ2h0Y29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzMwLFwic1wiOiAxMDAsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiNmMDgwODBcIn0sXG4gICAgXCJsaWdodGN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNTMsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjI0LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNlMGZmZmZcIn0sXG4gICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyNzUsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDI1MCxcImJcIjogMjEwIH0sIFwiaGV4XCI6IFwiI2ZhZmFkMlwifSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMSxcImdcIjogMjExLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjZDNkM2QzXCJ9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA1NCxcInNcIjogNzcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTQ0LFwiZ1wiOiAyMzgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM5MGVlOTBcIn0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiA2NyxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTEsXCJnXCI6IDIxMSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2QzZDNkM1wifSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE4MixcImJcIjogMTkzIH0sIFwiaGV4XCI6IFwiI2ZmYjZjMVwifSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDkwLFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNjAsXCJiXCI6IDEyMiB9LCBcImhleFwiOiBcIiNmZmEwN2FcIn0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU0LFwic1wiOiAxMDAsXCJsXCI6IDkwIH0sIFwicmdiXCI6IHtcInJcIjogMzIsXCJnXCI6IDE3OCxcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiIzIwYjJhYVwifSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDUzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDEzNSxcImdcIjogMjA2LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjODdjZWZhXCJ9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNzksXCJsXCI6IDcyIH0sIFwicmdiXCI6IHtcInJcIjogMTE5LFwiZ1wiOiAxMzYsXCJiXCI6IDE1MyB9LCBcImhleFwiOiBcIiM3Nzg4OTlcIn0sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTksXCJnXCI6IDEzNixcImJcIjogMTUzIH0sIFwiaGV4XCI6IFwiIzc3ODg5OVwifSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiA4MCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzYsXCJnXCI6IDE5NixcImJcIjogMjIyIH0sIFwiaGV4XCI6IFwiI2IwYzRkZVwifSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDIyNCB9LCBcImhleFwiOiBcIiNmZmZmZTBcIn0sXG4gICAgXCJsaW1lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNzMsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwZmYwMFwifSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDUwLFwiZ1wiOiAyMDUsXCJiXCI6IDUwIH0sIFwiaGV4XCI6IFwiIzMyY2QzMlwifSxcbiAgICBcImxpbmVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM1MSxcInNcIjogMTAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjQwLFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjZmFmMGU2XCJ9LFxuICAgIFwibWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNyxcInNcIjogMTAwLFwibFwiOiA3NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcIm1hcm9vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzcsXCJzXCI6IDcwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4MDAwMDBcIn0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwMyxcInNcIjogOTIsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTAyLFwiZ1wiOiAyMDUsXCJiXCI6IDE3MCB9LCBcImhleFwiOiBcIiM2NmNkYWFcIn0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTQsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiIzAwMDBjZFwifSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDE0LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDE4NixcImdcIjogODUsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNiYTU1ZDNcIn0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMjE0LFwic1wiOiA0MSxcImxcIjogNzggfSwgXCJyZ2JcIjoge1wiclwiOiAxNDcsXCJnXCI6IDExMixcImJcIjogMjE5IH0sIFwiaGV4XCI6IFwiIzkzNzBkYlwifSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogNjAsXCJnXCI6IDE3OSxcImJcIjogMTEzIH0sIFwiaGV4XCI6IFwiIzNjYjM3MVwifSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyMyxcImdcIjogMTA0LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjN2I2OGVlXCJ9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDY3LFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1MCxcImJcIjogMTU0IH0sIFwiaGV4XCI6IFwiIzAwZmE5YVwifSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNjAsXCJzXCI6IDUxLFwibFwiOiA2MCB9LCBcInJnYlwiOiB7XCJyXCI6IDcyLFwiZ1wiOiAyMDksXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM0OGQxY2NcIn0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDQwIH0sIFwicmdiXCI6IHtcInJcIjogMTk5LFwiZ1wiOiAyMSxcImJcIjogMTMzIH0sIFwiaGV4XCI6IFwiI2M3MTU4NVwifSxcbiAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODgsXCJzXCI6IDU5LFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1LFwiZ1wiOiAyNSxcImJcIjogMTEyIH0sIFwiaGV4XCI6IFwiIzE5MTk3MFwifSxcbiAgICBcIm1pbnRjcmVhbVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNjAsXCJzXCI6IDYwLFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjU1LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZjVmZmZhXCJ9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NyxcInNcIjogNTAsXCJsXCI6IDQ3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDIyNSB9LCBcImhleFwiOiBcIiNmZmU0ZTFcIn0sXG4gICAgXCJtb2NjYXNpblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDksXCJzXCI6IDgwLFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAxODEgfSwgXCJoZXhcIjogXCIjZmZlNGI1XCJ9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTU3LFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjIsXCJiXCI6IDE3MyB9LCBcImhleFwiOiBcIiNmZmRlYWRcIn0sXG4gICAgXCJuYXZ5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3OCxcInNcIjogNjAsXCJsXCI6IDU1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzAwMDA4MFwifSxcbiAgICBcIm9sZGxhY2VcIjoge1wiaHNsXCI6IHtcImhcIjogMzIyLFwic1wiOiA4MSxcImxcIjogNDMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTMsXCJnXCI6IDI0NSxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2ZkZjVlNlwifSxcbiAgICBcIm9saXZlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogNjQsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjODA4MDAwXCJ9LFxuICAgIFwib2xpdmVkcmFiXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1MCxcInNcIjogMTAwLFwibFwiOiA5OCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNyxcImdcIjogMTQyLFwiYlwiOiAzNSB9LCBcImhleFwiOiBcIiM2YjhlMjNcIn0sXG4gICAgXCJvcmFuZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTY1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmYTUwMFwifSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOCxcInNcIjogMTAwLFwibFwiOiA4NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogNjksXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY0NTAwXCJ9LFxuICAgIFwib3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM2LFwic1wiOiAxMDAsXCJsXCI6IDg0IH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxMTIsXCJiXCI6IDIxNCB9LCBcImhleFwiOiBcIiNkYTcwZDZcIn0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA4NSxcImxcIjogOTUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDIzMixcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiI2VlZThhYVwifSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MCxcInNcIjogNjAsXCJsXCI6IDM1IH0sIFwicmdiXCI6IHtcInJcIjogMTUyLFwiZ1wiOiAyNTEsXCJiXCI6IDE1MiB9LCBcImhleFwiOiBcIiM5OGZiOThcIn0sXG4gICAgXCJwYWxldHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTc1LFwiZ1wiOiAyMzgsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNhZmVlZWVcIn0sXG4gICAgXCJwYWxldmlvbGV0cmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMixcInNcIjogNTksXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjE5LFwiZ1wiOiAxMTIsXCJiXCI6IDE0NyB9LCBcImhleFwiOiBcIiNkYjcwOTNcIn0sXG4gICAgXCJwYXBheWF3aGlwXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU1LFwic1wiOiA2NyxcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIzOSxcImJcIjogMjEzIH0sIFwiaGV4XCI6IFwiI2ZmZWZkNVwifSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDkzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjE4LFwiYlwiOiAxODUgfSwgXCJoZXhcIjogXCIjZmZkYWI5XCJ9LFxuICAgIFwicGVydVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDY1LFwibFwiOiA4MSB9LCBcInJnYlwiOiB7XCJyXCI6IDIwNSxcImdcIjogMTMzLFwiYlwiOiA2MyB9LCBcImhleFwiOiBcIiNjZDg1M2ZcIn0sXG4gICAgXCJwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0MCxcInNcIjogNjAsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxOTIsXCJiXCI6IDIwMyB9LCBcImhleFwiOiBcIiNmZmMwY2JcIn0sXG4gICAgXCJwbHVtXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM3LFwic1wiOiAxMDAsXCJsXCI6IDkyIH0sIFwicmdiXCI6IHtcInJcIjogMjIxLFwiZ1wiOiAxNjAsXCJiXCI6IDIyMSB9LCBcImhleFwiOiBcIiNkZGEwZGRcIn0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4LFwic1wiOiAxMDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMTc2LFwiZ1wiOiAyMjQsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNiMGUwZTZcIn0sXG4gICAgXCJwdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDU5LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwMDA4MFwifSxcbiAgICBcInJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNTAsXCJzXCI6IDEwMCxcImxcIjogODggfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmYwMDAwXCJ9LFxuICAgIFwicm9zeWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogNDcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTg4LFwiZ1wiOiAxNDMsXCJiXCI6IDE0MyB9LCBcImhleFwiOiBcIiNiYzhmOGZcIn0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTg3LFwic1wiOiA1MixcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiA2NSxcImdcIjogMTA1LFwiYlwiOiAyMjUgfSwgXCJoZXhcIjogXCIjNDE2OWUxXCJ9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiA2OSxcImJcIjogMTkgfSwgXCJoZXhcIjogXCIjOGI0NTEzXCJ9LFxuICAgIFwic2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIyNSxcInNcIjogNzMsXCJsXCI6IDU3IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAxMjgsXCJiXCI6IDExNCB9LCBcImhleFwiOiBcIiNmYTgwNzJcIn0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NixcImxcIjogMzEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDQsXCJnXCI6IDE2NCxcImJcIjogOTYgfSwgXCJoZXhcIjogXCIjZjRhNDYwXCJ9LFxuICAgIFwic2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogOTMsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogNDYsXCJnXCI6IDEzOSxcImJcIjogODcgfSwgXCJoZXhcIjogXCIjMmU4YjU3XCJ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiaHNsXCI6IHtcImhcIjogMjgsXCJzXCI6IDg3LFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjQ1LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjZmZmNWVlXCJ9LFxuICAgIFwic2llbm5hXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NixcInNcIjogNTAsXCJsXCI6IDM2IH0sIFwicmdiXCI6IHtcInJcIjogMTYwLFwiZ1wiOiA4MixcImJcIjogNDUgfSwgXCJoZXhcIjogXCIjYTA1MjJkXCJ9LFxuICAgIFwic2lsdmVyXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTkyLFwiZ1wiOiAxOTIsXCJiXCI6IDE5MiB9LCBcImhleFwiOiBcIiNjMGMwYzBcIn0sXG4gICAgXCJza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5LFwic1wiOiA1NixcImxcIjogNDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzUsXCJnXCI6IDIwNixcImJcIjogMjM1IH0sIFwiaGV4XCI6IFwiIzg3Y2VlYlwifSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTcsXCJzXCI6IDcxLFwibFwiOiA3MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNixcImdcIjogOTAsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiM2YTVhY2RcIn0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQ4LFwic1wiOiA1MyxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAxMTIsXCJnXCI6IDEyOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzcwODA5MFwifSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDExMixcImdcIjogMTI4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjNzA4MDkwXCJ9LFxuICAgIFwic25vd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZmZmYWZhXCJ9LFxuICAgIFwic3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiA5OSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMTI3IH0sIFwiaGV4XCI6IFwiIzAwZmY3ZlwifSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiA3MCxcImdcIjogMTMwLFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjNDY4MmI0XCJ9LFxuICAgIFwidGFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwNyxcInNcIjogNDQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjEwLFwiZ1wiOiAxODAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNkMmI0OGNcIn0sXG4gICAgXCJ0ZWFsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA0NCxcImxcIjogNjkgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiMwMDgwODBcIn0sXG4gICAgXCJ0aGlzdGxlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMjQsXCJsXCI6IDgwIH0sIFwicmdiXCI6IHtcInJcIjogMjE2LFwiZ1wiOiAxOTEsXCJiXCI6IDIxNiB9LCBcImhleFwiOiBcIiNkOGJmZDhcIn0sXG4gICAgXCJ0b21hdG9cIjoge1wiaHNsXCI6IHtcImhcIjogOSxcInNcIjogMTAwLFwibFwiOiA2NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogOTksXCJiXCI6IDcxIH0sIFwiaGV4XCI6IFwiI2ZmNjM0N1wifSxcbiAgICBcInR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzQsXCJzXCI6IDcyLFwibFwiOiA1NiB9LCBcInJnYlwiOiB7XCJyXCI6IDY0LFwiZ1wiOiAyMjQsXCJiXCI6IDIwOCB9LCBcImhleFwiOiBcIiM0MGUwZDBcIn0sXG4gICAgXCJ2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiA3NixcImxcIjogNzIgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDEzMCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2VlODJlZVwifSxcbiAgICBcIndoZWF0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA3NyxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDIyMixcImJcIjogMTc5IH0sIFwiaGV4XCI6IFwiI2Y1ZGViM1wifSxcbiAgICBcIndoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDk2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmZmZmZmZcIn0sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDgwLFwic1wiOiA2MSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjQ1IH0sIFwiaGV4XCI6IFwiI2Y1ZjVmNVwifSxcInllbGxvd1wiOiB7IFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZmZjAwXCJ9LFwieWVsbG93Z3JlZW5cIjogeyBcInJnYlwiOiB7XCJyXCI6IDE1NCxcImdcIjogMjA1LFwiYlwiOiA1MCB9LCBcImhleFwiOiBcIiM5YWNkMzJcIn1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuYW1lZGNvbG9yczsiLCJ2YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9jYW1lcmEuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnQ2FtZXJhJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgY2FtZXJhO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGNhbWVyYSA9IG5ldyBDYW1lcmEoNjAwLCA0MDApO1xuICAgIH0pXG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdoZWlnaHQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGNhbWVyYS5oZWlnaHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGNhbWVyYS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIFNjZW5lID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9zY2VuZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdTY2VuZScsIGZ1bmN0aW9uKCl7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgLy92YXIgc2NlbmUgPSBuZXcgU2NlbmUoe2NhbnZhc19pZDogJ3dpcmVmcmFtZScsIHdpZHRoOjYwMCwgaGVpZ2h0OjQwMH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnaGVpZ2h0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGFzc2VydC5lcXVhbChzY2VuZS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgXG4gICAgfSlcbn0pOyIsImZ1bmN0aW9uIG5lYXJseUVxdWFsKGEsIGIsIGVwcyl7XG4gICAgaWYgKHR5cGVvZiBlcHMgPT09IFwidW5kZWZpbmVkXCIpIHtlcHMgPSAwLjAxO31cbiAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICByZXR1cm4gKGRpZmYgPCBlcHMpO1xufVxuXG52YXIgaGVscGVycyA9IG5ldyBPYmplY3QobnVsbCk7XG5cbmhlbHBlcnMubmVhcmx5RXF1YWwgPSBuZWFybHlFcXVhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWxwZXJzOyIsInZhciBGYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvZmFjZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnZhciBmYWNlO1xuXG5zdWl0ZSgnRmFjZScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGZhY2U7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgZmFjZSA9IG5ldyBGYWNlKDAsIDEsIDIsIFwicmVkXCIpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnY29sb3InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZhY2UuY29sb3IucmdiLnIsIDI1NSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL21hdHJpeC5qcycpO1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL3ZlY3Rvci5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdNYXRyaXgnLCBmdW5jdGlvbigpe1xuICAgIHZhciB6ZXJvLCB6ZXJvMiwgemVybzMsIGlkZW50aXR5LCBpZGVudGl0eTIsIGlkZW50aXR5Mywgb25lcywgbTAsIG0xLCBtMiwgbTMsIG00LCBtNSwgbTYsIG03LCBhbmdsZXM7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgYW5nbGVzID0gWzAsIE1hdGguUEkgLyAyLCBNYXRoLlBJLCAzKk1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMl07XG4gICAgICAgIHplcm8gPSBNYXRyaXguemVybygpO1xuICAgICAgICB6ZXJvMiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgemVybzMgPSBNYXRyaXguZnJvbUFycmF5KFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSk7XG4gICAgICAgIGlkZW50aXR5ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgIGlkZW50aXR5MiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgaWRlbnRpdHkzID0gTWF0cml4LmZyb21BcnJheShbMSwwLDAsMCwwLDEsMCwwLDAsMCwxLDAsMCwwLDAsMV0pO1xuICAgICAgICBpZGVudGl0eTJbMF0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbNV0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbMTBdID0gMTtcbiAgICAgICAgaWRlbnRpdHkyWzE1XSA9IDE7XG4gICAgICAgIG9uZXMgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0wID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMSA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTIgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0zID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtNCA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTRbMF0gPSAwO1xuICAgICAgICBtNFsxXSA9IDE7XG4gICAgICAgIG00WzJdID0gMTtcbiAgICAgICAgbTRbM10gPSAyO1xuICAgICAgICBtNFs0XSA9IDM7XG4gICAgICAgIG00WzVdID0gNTtcbiAgICAgICAgbTRbNl0gPSA4O1xuICAgICAgICBtNFs3XSA9IDEzO1xuICAgICAgICBtNFs4XSA9IDIxO1xuICAgICAgICBtNFs5XSA9IDM0O1xuICAgICAgICBtNFsxMF0gPSA1NTtcbiAgICAgICAgbTRbMTFdID0gODk7XG4gICAgICAgIG00WzEyXSA9IDE0NDtcbiAgICAgICAgbTRbMTNdID0gMjMzO1xuICAgICAgICBtNFsxNF0gPSAzNzc7XG4gICAgICAgIG00WzE1XSA9IDYxMDtcbiAgICAgICAgbTUgPSBNYXRyaXguZnJvbUFycmF5KFswLCAxLCAxLCAyLCAzLCA1LCA4LCAxMywgMjEsIDM0LCA1NSwgODksIDE0NCwgMjMzLCAzNzcsIDYxMF0pO1xuICAgICAgICBtNiA9IE1hdHJpeC5mcm9tQXJyYXkoWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDhdKTtcbiAgICAgICAgbTcgPSBNYXRyaXguZnJvbUFycmF5KFszNCwgNDQsIDU0LCA2NCwgODIsIDEwOCwgMTM0LCAxNjAsIDM0LCA0NCwgNTQsIDY0LCA4MiwgMTA4LCAxMzQsIDE2MF0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgb25lc1tpXSA9IDE7XG4gICAgICAgICAgICBtMFtpXSA9IGk7XG4gICAgICAgICAgICBtMVtpXSA9IGkrMTtcbiAgICAgICAgICAgIG0yW2ldID0gaSsyO1xuICAgICAgICAgICAgbTNbaV0gPSBpKjI7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xlbmd0aCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVyby5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvMi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvMy5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eS5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eTIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTEubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTMubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTQubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTUubGVuZ3RoLCAxNik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnZXF1YWwnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGlkZW50aXR5LmVxdWFsKGlkZW50aXR5MikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVybzIuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghaWRlbnRpdHkuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG00LmVxdWFsKG01KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0zKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhZGQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gemVyby5hZGQobTEpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTAuYWRkKG9uZXMpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTAuYWRkKG9uZXMpLmFkZChvbmVzKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwobTIpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3N1YnRyYWN0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG00LnN1YnRyYWN0KG01KTtcbiAgICAgICAgICAgIHZhciB0MiA9IG0xLnN1YnRyYWN0KG9uZXMpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTIuc3VidHJhY3QobTEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChtMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKG9uZXMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5U2NhbGFyJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG0wLm11bHRpcGx5U2NhbGFyKDIpO1xuICAgICAgICAgICAgdmFyIHQyID0gemVyby5tdWx0aXBseVNjYWxhcigyMCk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMC5tdWx0aXBseVNjYWxhcigxKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbChtMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTYubXVsdGlwbHkobTYpO1xuICAgICAgICAgICAgdmFyIHQyID0gaWRlbnRpdHkubXVsdGlwbHkoaWRlbnRpdHkpO1xuICAgICAgICAgICAgdmFyIHQzID0gaWRlbnRpdHkubXVsdGlwbHkoemVybyk7XG4gICAgICAgICAgICB2YXIgdDQgPSBpZGVudGl0eS5tdWx0aXBseShtMCk7XG4gICAgICAgICAgICB2YXIgdDUgPSB6ZXJvLm11bHRpcGx5KG0wKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtNykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKGlkZW50aXR5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ0LmVxdWFsKG0wKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDUuZXF1YWwoemVybykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbmVnYXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG0wLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTEubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMi5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0zLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQ1ID0gemVyby5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NiA9IG9uZXMubmVnYXRlKCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHQ1KSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVtpXSwgLW0wW2ldKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDJbaV0sIC1tMVtpXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQzW2ldLCAtbTJbaV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NFtpXSwgLW0zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMTY7IGorKyl7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxW2pdLCAtaik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ2W2pdLCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc3Bvc2UnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyYW5zcG9zZV9tYXAgPSB7XG4gICAgICAgICAgICAgICAgMDowLCAxOjQsIDI6OCwgMzoxMiwgNDoxLCA1OjUsIDY6OSwgNzoxMyxcbiAgICAgICAgICAgICAgICA4OjIsIDk6NiwgMTA6MTAsIDExOjE0LCAxMjozLCAxMzo3LCAxNDoxMSwgMTU6MTVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0MSA9IGlkZW50aXR5LnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQyID0gb25lcy50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0MyA9IHplcm8udHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDQgPSBtMC50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NSA9IG0xLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQ2ID0gbTIudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDcgPSBtMy50cmFuc3Bvc2UoKTtcblxuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKGlkZW50aXR5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwob25lcykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0wLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDRbaV0sIG0wW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDVbaV0sIG0xW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDZbaV0sIG0yW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDdbaV0sIG0zW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uWCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbW9yZSB0ZXN0c1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb25YKHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzZdID0gLU1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzldID0gTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMTBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWSh0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsyXSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzhdID0gLU1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzEwXSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25aJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvbloodGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMV0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNF0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25BeGlzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtdWx0aS1heGlzIHRlc3RzP1xuICAgICAgICAgICAgdmFyIHhheGlzID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgICAgIHZhciB5YXhpcyA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgICAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb25BeGlzKHhheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LnJvdGF0aW9uQXhpcyh5YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MyA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoemF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDQgPSBNYXRyaXgucm90YXRpb25BeGlzKHhheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQ1ID0gTWF0cml4LnJvdGF0aW9uQXhpcyh5YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0NiA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoemF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDUuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDYuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBiZXR0ZXIgdGVzdHMsIHRoaXMgaXMgYmFzaWNhbGx5IGp1c3QgcmVjcmVhdGluZyB0aGUgbWV0aG9kXG4gICAgICAgICAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKDEsIDAsIDApO1xuICAgICAgICAgICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICAgICAgICAgIHZhciB6YXhpcyA9IG5ldyBWZWN0b3IoMCwgMCwgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHBpdGNoID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5nbGVzLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlhdyA9IGFuZ2xlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBhbmdsZXMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvbGwgPSBhbmdsZXNba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb24ocGl0Y2gsIHlhdywgcm9sbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXgucm90YXRpb25YKHJvbGwpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblooeWF3KSkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWShwaXRjaCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2xhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJhbnMgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFucy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHh0cmFucyA9IHRyYW5zW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdHJhbnMubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXRyYW5zID0gdHJhbnNbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdHJhbnMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHp0cmFucyA9IHRyYW5zW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnRyYW5zbGF0aW9uKHh0cmFucywgeXRyYW5zLCB6dHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAxMil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHh0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geXRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB6dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAwIHx8IG0gPT09IDUgfHwgbSA9PT0gMTAgfHwgbSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbbV0sIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2FsZS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHhzY2FsZSA9IHNjYWxlW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2NhbGUubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXNjYWxlID0gc2NhbGVbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc2NhbGUubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpzY2FsZSA9IHNjYWxlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnNjYWxlKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gNSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0genNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbbV0sIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdpZGVudGl0eScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGlmIChpICUgNSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eVtpXSwgMSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5W2ldLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd6ZXJvJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVyb1tpXSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdmcm9tQXJyYXknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG01LmVxdWFsKG00KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8yLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkyLmVxdWFsKGlkZW50aXR5MykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBNZXNoID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvbWVzaC5qcycpO1xudmFyIEZhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9mYWNlLmpzJyk7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvdmVjdG9yLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ01lc2gnLCBmdW5jdGlvbigpe1xuICAgIHZhciBtZXNoO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIG1lc2ggPSBuZXcgTWVzaCgndHJpYW5nbGUnLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMSwwLDApLFxuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMCwxLDApLFxuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMCwwLDEpXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIG5ldyBGYWNlKDAsIDEsIDIsICdyZWQnKVxuICAgICAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCduYW1lJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhtZXNoLm5hbWUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gubmFtZSwgJ3RyaWFuZ2xlJyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZXJ0aWNlcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2ZhY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncG9zaXRpb24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2Zyb21KU09OJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC92ZWN0b3IuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBuZWFybHlFcXVhbCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMuanMnKVsnbmVhcmx5RXF1YWwnXTtcblxuc3VpdGUoJ1ZlY3RvcicsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG9yaWdpbiwgdmVjdG9yMSwgdmVjdG9yMiwgdmVjdG9yMywgdmVjdG9yNCwgdmVjdG9yNSwgdmVjdG9yeCwgdmVjdG9yeSwgdmVjdG9yejtcbiAgICB2YXIgdmVjdG9yMTAweCwgdmVjdG9yMjAweSwgdmVjdG9yMzAweiwgdmVjdG9yMTIzLCB2ZWN0b3IxMTI7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgb3JpZ2luID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yMSA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjIgPSBuZXcgVmVjdG9yKDEsIDEsIDEpO1xuICAgICAgICB2ZWN0b3IzID0gbmV3IFZlY3RvcigxMCwgMTAsIDEwKTtcbiAgICAgICAgdmVjdG9yNCA9IG5ldyBWZWN0b3IoMTEsIDExLCAxMSk7XG4gICAgICAgIHZlY3RvcjUgPSBuZXcgVmVjdG9yKC0xLCAtMSwgLTEpO1xuICAgICAgICB2ZWN0b3J4ID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yeSA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgIHZlY3RvcnogPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICB2ZWN0b3IxMDB4ID0gbmV3IFZlY3RvcigxMDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IyMDB5ID0gbmV3IFZlY3RvcigwLCAyMDAsIDApO1xuICAgICAgICB2ZWN0b3IzMDB6ID0gbmV3IFZlY3RvcigwLCAwLCAzMDApO1xuICAgICAgICB2ZWN0b3IxMjMgPSBuZXcgVmVjdG9yKDEsIDIsIDMpO1xuICAgICAgICB2ZWN0b3IxMTIgPSBuZXcgVmVjdG9yKC0xLCAxLCAyKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2F4ZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe25ldyBWZWN0b3IoKTt9LCBFcnJvcik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS54KTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcjEuYWRkKHZlY3RvcjMpO1xuICAgICAgICAgICAgdmFyIHQyID0gdmVjdG9yMS5hZGQodmVjdG9yNSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5hZGQodmVjdG9yMykuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuYWRkKHZlY3RvcjUpLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS55LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueiwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKTtcbiAgICAgICAgICAgIHZhciB0MiA9IHZlY3RvcjEuc3VidHJhY3QodmVjdG9yMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKS5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zdWJ0cmFjdCh2ZWN0b3IyKS5lcXVhbChvcmlnaW4pKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS54LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi56LCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2VxdWFsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjIpLCB0cnVlKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjMpLCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbmdsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5hbmdsZSh2ZWN0b3J5KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LmFuZ2xlKHZlY3RvcnopLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnguYW5nbGUodmVjdG9yeiksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZSh2ZWN0b3IyKSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjEuYW5nbGUodmVjdG9yNSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nvc0FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J5KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeS5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3IyKSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3I1KSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yNS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMy5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMwMCkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZVNxdWFyZWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEubWFnbml0dWRlU3F1YXJlZCgpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3I1Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMy5tYWduaXR1ZGVTcXVhcmVkKCksIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkb3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZG90KHZlY3RvcjIpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyLmRvdCh2ZWN0b3IzKSwgMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMuZG90KHZlY3RvcjUpLCAtMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguZG90KHZlY3RvcnkpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmRvdCh2ZWN0b3J6KSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5kb3QodmVjdG9yeiksIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY3Jvc3MnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yMTIzLmNyb3NzKHZlY3RvcjExMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yei5jcm9zcyh2ZWN0b3J4KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnkuY3Jvc3ModmVjdG9yeCkuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J6LmNyb3NzKHZlY3RvcnkpLmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yeC5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS56LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5LmNyb3NzKHZlY3RvcnopLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnouY3Jvc3ModmVjdG9yeCkueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgLTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDMpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdub3JtYWxpemUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEwMHgubm9ybWFsaXplKCkueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMjAweS5ub3JtYWxpemUoKS55LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IzMDB6Lm5vcm1hbGl6ZSgpLnosIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnguc2NhbGUoMTAwKS5lcXVhbCh2ZWN0b3IxMDB4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5zY2FsZSgyMDApLmVxdWFsKHZlY3RvcjIwMHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J6LnNjYWxlKDMwMCkuZXF1YWwodmVjdG9yMzAweikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuc2NhbGUoMTApLmVxdWFsKHZlY3RvcjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnNjYWxlKDExKS5lcXVhbCh2ZWN0b3I0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkuZXF1YWwodmVjdG9yNSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkubmVnYXRlKCkuZXF1YWwodmVjdG9yMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndmVjdG9yUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB2ZWN0b3J4LnZlY3RvclByb2plY3Rpb24odmVjdG9yeSk7XG4gICAgICAgICAgICB2YXIgdDIgPSB2ZWN0b3IxLnZlY3RvclByb2plY3Rpb24odmVjdG9yMyk7XG4gICAgICAgICAgICB2YXIgdDMgPSB2ZWN0b3IxMjMudmVjdG9yUHJvamVjdGlvbih2ZWN0b3IxMTIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQyLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0Mi55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDIueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLngsIC0xLjE2NykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLnksIDEuMTYpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0My56LCAyLjMzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsYXJQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LnNjYWxhclByb2plY3Rpb24odmVjdG9yeSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLnNjYWxhclByb2plY3Rpb24odmVjdG9yMyksIDEuNzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxMjMuc2NhbGFyUHJvamVjdGlvbih2ZWN0b3IxMTIpLCAyLjg1KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCAoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS56LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcnoucm90YXRlWCgoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcnoucm90YXRlWCgyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVZJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByb3QxID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkgLyAyKTtcbiAgICAgICAgICAgIHZhciByb3QyID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZVkoKCgzKk1hdGguUEkpIC8gMikpO1xuICAgICAgICAgICAgdmFyIHJvdDQgPSB2ZWN0b3J4LnJvdGF0ZVkoMipNYXRoLlBJKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeS5yb3RhdGVaKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeS5yb3RhdGVaKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlUGl0Y2hZYXdSb2xsKE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbGl0aWVzL2NvbG9yLmpzJyk7XG52YXIgbmFtZWQgPSByZXF1aXJlKCcuLi9kYXRhL2NvbG9ycy5qcycpO1xudmFyIG5lYXJseUVxdWFsID0gcmVxdWlyZSgnLi4vaGVscGVycy5qcycpWyduZWFybHlFcXVhbCddO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdDb2xvcicsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHJlZCwgZ3JlZW4sIGJsdWUsIHJnYiwgcmdiYSwgaHNsLCBoc2xhO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIHJlZCA9IG5ldyBDb2xvcihcInJlZFwiKTtcbiAgICAgICAgZ3JlZW4gPSBuZXcgQ29sb3IoXCIjMEYwXCIpOyAvLyBOYW1lZCBjb2xvciAnZ3JlZW4nIGlzIHJnYigwLDEyOCwwKVxuICAgICAgICBibHVlID0gbmV3IENvbG9yKFwiYmx1ZVwiKTtcbiAgICAgICAgcmdiID0gbmV3IENvbG9yKFwicmdiKDEsIDcsIDI5KVwiKTtcbiAgICAgICAgcmdiYSA9IG5ldyBDb2xvcihcInJnYmEoMSwgNywgMjksIDAuMylcIik7XG4gICAgICAgIGhzbCA9IG5ldyBDb2xvcihcImhzbCgwLCAxMDAlLCA1MCUpXCIpO1xuICAgICAgICBoc2xhID0gbmV3IENvbG9yKFwiaHNsYSgwLCAxMDAlLCA1MCUsIDAuMylcIik7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdyZ2InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5yLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLmcsIDcpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuYiwgMjkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5hbHBoYSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYS5yZ2IuciwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYS5yZ2IuZywgNyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYS5yZ2IuYiwgMjkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJnYmEuYWxwaGEsIDAuMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgY29sb3IgaW4gbmFtZWQpe1xuICAgICAgICAgICAgICAgIGlmIChuYW1lZC5oYXNPd25Qcm9wZXJ0eShjb2xvcikpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBDb2xvcihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3IobmFtZWRbY29sb3JdLmhleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lZF9yZ2IgPSBuYW1lZFtjb2xvcl0ucmdiO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuciwgaGV4LnJnYi5yKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmcsIGhleC5yZ2IuZyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5iLCBoZXgucmdiLmIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuciwgbmFtZWRfcmdiLnIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuZywgbmFtZWRfcmdiLmcpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuYiwgbmFtZWRfcmdiLmIpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2wnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5zLCAxMDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wubCwgNTApO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsLmhzbC5sLCA1MCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoaHNsLmFscGhhLCAxKSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2xhLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2xhLmhzbC5zLCAxMDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLmwsIDUwKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2xhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGNvbG9yIGluIG5hbWVkKXtcbiAgICAgICAgICAgICAgICBpZiAobmFtZWQuaGFzT3duUHJvcGVydHkoY29sb3IpKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBuZXcgQ29sb3IoY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGV4ID0gbmV3IENvbG9yKG5hbWVkW2NvbG9yXS5oZXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZWRfaHNsID0gbmFtZWRbY29sb3JdLnJnYjtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmgsIGhleC5yZ2IuaCk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5zLCBoZXgucmdiLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgaGV4LnJnYi5sKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmgsIG5hbWVkX2hzbC5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIG5hbWVkX2hzbC5zKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmwsIG5hbWVkX2hzbC5sKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbHBoYScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVkLmFscGhhLCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbGlnaHRlbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgcjIgPSByZWQubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQubGlnaHRlbig1MCk7XG4gICAgICAgICAgICB2YXIgZzEgPSBncmVlbi5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciBnMiA9IGdyZWVuLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4ubGlnaHRlbig1MCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGIyID0gYmx1ZS5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUubGlnaHRlbig1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuZywgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5iLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuciwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5iLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuciwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmcsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2RhcmtlbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIHIzID0gcmVkLmRhcmtlbig1MCk7XG4gICAgICAgICAgICB2YXIgZzEgPSBncmVlbi5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4uZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBnMyA9IGdyZWVuLmRhcmtlbig1MCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgYjMgPSBibHVlLmRhcmtlbig1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuciwgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5yLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5iLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7Il19
(16)
});
