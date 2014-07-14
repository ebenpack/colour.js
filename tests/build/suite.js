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
var hslToRgb, rgbToHsl, parseColor, cache;
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
 * @param  {number} h Hue
 * @param  {number} s Saturation
 * @param  {number} l Luminance
 * @return {{r: number, g: number, b: number}}
 */
hslToRgb = function(h, s, l){
    function _v(m1, m2, hue){
        hue = hue;
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
    return {'h': h*360, 's': s*100, 'l': l*100};
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
var colorlist = [
    ['aliceblue', '#f0f8ff', [240, 248, 255]],
    ['antiquewhite', '#faebd7', [250, 235, 215]],
    ['aqua', '#00ffff', [0, 255, 255]],
    ['aquamarine', '#7fffd4', [127, 255, 212]],
    ['azure', '#f0ffff', [240, 255, 255]],
    ['beige', '#f5f5dc', [245, 245, 220]],
    ['bisque', '#ffe4c4', [255, 228, 196]],
    ['black', '#000000', [0, 0, 0]],
    ['blanchedalmond', '#ffebcd', [255, 235, 205]],
    ['blue', '#0000ff', [0, 0, 255]],
    ['blueviolet', '#8a2be2', [138, 43, 226]],
    ['brown', '#a52a2a', [165, 42, 42]],
    ['burlywood', '#deb887', [222, 184, 135]],
    ['cadetblue', '#5f9ea0', [95, 158, 160]],
    ['chartreuse', '#7fff00', [127, 255, 0]],
    ['chocolate', '#d2691e', [210, 105, 30]],
    ['coral', '#ff7f50', [255, 127, 80]],
    ['cornflowerblue', '#6495ed', [100, 149, 237]],
    ['cornsilk', '#fff8dc', [255, 248, 220]],
    ['crimson', '#dc143c', [220, 20, 60]],
    ['cyan', '#00ffff', [0, 255, 255]],
    ['darkblue', '#00008b', [0, 0, 139]],
    ['darkcyan', '#008b8b', [0, 139, 139]],
    ['darkgoldenrod', '#b8860b', [184, 134, 11]],
    ['darkgray', '#a9a9a9', [169, 169, 169]],
    ['darkgreen', '#006400', [0, 100, 0]],
    ['darkgrey', '#a9a9a9', [169, 169, 169]],
    ['darkkhaki', '#bdb76b', [189, 183, 107]],
    ['darkmagenta', '#8b008b', [139, 0, 139]],
    ['darkolivegreen', '#556b2f', [85, 107, 47]],
    ['darkorange', '#ff8c00', [255, 140, 0]],
    ['darkorchid', '#9932cc', [153, 50, 204]],
    ['darkred', '#8b0000', [139, 0, 0]],
    ['darksalmon', '#e9967a', [233, 150, 122]],
    ['darkseagreen', '#8fbc8f', [143, 188, 143]],
    ['darkslateblue', '#483d8b', [72, 61, 139]],
    ['darkslategray', '#2f4f4f', [47, 79, 79]],
    ['darkslategrey', '#2f4f4f', [47, 79, 79]],
    ['darkturquoise', '#00ced1', [0, 206, 209]],
    ['darkviolet', '#9400d3', [148, 0, 211]],
    ['deeppink', '#ff1493', [255, 20, 147]],
    ['deepskyblue', '#00bfff', [0, 191, 255]],
    ['dimgray', '#696969', [105, 105, 105]],
    ['dimgrey', '#696969', [105, 105, 105]],
    ['dodgerblue', '#1e90ff', [30, 144, 255]],
    ['firebrick', '#b22222', [178, 34, 34]],
    ['floralwhite', '#fffaf0', [255, 250, 240]],
    ['forestgreen', '#228b22', [34, 139, 34]],
    ['fuchsia', '#ff00ff', [255, 0, 255]],
    ['gainsboro', '#dcdcdc', [220, 220, 220]],
    ['ghostwhite', '#f8f8ff', [248, 248, 255]],
    ['gold', '#ffd700', [255, 215, 0]],
    ['goldenrod', '#daa520', [218, 165, 32]],
    ['gray', '#808080', [128, 128, 128]],
    ['green', '#008000', [0, 128, 0]],
    ['greenyellow', '#adff2f', [173, 255, 47]],
    ['grey', '#808080', [128, 128, 128]],
    ['honeydew', '#f0fff0', [240, 255, 240]],
    ['hotpink', '#ff69b4', [255, 105, 180]],
    ['indianred', '#cd5c5c', [205, 92, 92]],
    ['indigo', '#4b0082', [75, 0, 130]],
    ['ivory', '#fffff0', [255, 255, 240]],
    ['khaki', '#f0e68c', [240, 230, 140]],
    ['lavender', '#e6e6fa', [230, 230, 250]],
    ['lavenderblush', '#fff0f5', [255, 240, 245]],
    ['lawngreen', '#7cfc00', [124, 252, 0]],
    ['lemonchiffon', '#fffacd', [255, 250, 205]],
    ['lightblue', '#add8e6', [173, 216, 230]],
    ['lightcoral', '#f08080', [240, 128, 128]],
    ['lightcyan', '#e0ffff', [224, 255, 255]],
    ['lightgoldenrodyellow', '#fafad2', [250, 250, 210]],
    ['lightgray', '#d3d3d3', [211, 211, 211]],
    ['lightgreen', '#90ee90', [144, 238, 144]],
    ['lightgrey', '#d3d3d3', [211, 211, 211]],
    ['lightpink', '#ffb6c1', [255, 182, 193]],
    ['lightsalmon', '#ffa07a', [255, 160, 122]],
    ['lightseagreen', '#20b2aa', [32, 178, 170]],
    ['lightskyblue', '#87cefa', [135, 206, 250]],
    ['lightslategray', '#778899', [119, 136, 153]],
    ['lightslategrey', '#778899', [119, 136, 153]],
    ['lightsteelblue', '#b0c4de', [176, 196, 222]],
    ['lightyellow', '#ffffe0', [255, 255, 224]],
    ['lime', '#00ff00', [0, 255, 0]],
    ['limegreen', '#32cd32', [50, 205, 50]],
    ['linen', '#faf0e6', [250, 240, 230]],
    ['magenta', '#ff00ff', [255, 0, 255]],
    ['maroon', '#800000', [128, 0, 0]],
    ['mediumaquamarine', '#66cdaa', [102, 205, 170]],
    ['mediumblue', '#0000cd', [0, 0, 205]],
    ['mediumorchid', '#ba55d3', [186, 85, 211]],
    ['mediumpurple', '#9370db', [147, 112, 219]],
    ['mediumseagreen', '#3cb371', [60, 179, 113]],
    ['mediumslateblue', '#7b68ee', [123, 104, 238]],
    ['mediumspringgreen', '#00fa9a', [0, 250, 154]],
    ['mediumturquoise', '#48d1cc', [72, 209, 204]],
    ['mediumvioletred', '#c71585', [199, 21, 133]],
    ['midnightblue', '#191970', [25, 25, 112]],
    ['mintcream', '#f5fffa', [245, 255, 250]],
    ['mistyrose', '#ffe4e1', [255, 228, 225]],
    ['moccasin', '#ffe4b5', [255, 228, 181]],
    ['navajowhite', '#ffdead', [255, 222, 173]],
    ['navy', '#000080', [0, 0, 128]],
    ['oldlace', '#fdf5e6', [253, 245, 230]],
    ['olive', '#808000', [128, 128, 0]],
    ['olivedrab', '#6b8e23', [107, 142, 35]],
    ['orange', '#ffa500', [255, 165, 0]],
    ['orangered', '#ff4500', [255, 69, 0]],
    ['orchid', '#da70d6', [218, 112, 214]],
    ['palegoldenrod', '#eee8aa', [238, 232, 170]],
    ['palegreen', '#98fb98', [152, 251, 152]],
    ['paleturquoise', '#afeeee', [175, 238, 238]],
    ['palevioletred', '#db7093', [219, 112, 147]],
    ['papayawhip', '#ffefd5', [255, 239, 213]],
    ['peachpuff', '#ffdab9', [255, 218, 185]],
    ['peru', '#cd853f', [205, 133, 63]],
    ['pink', '#ffc0cb', [255, 192, 203]],
    ['plum', '#dda0dd', [221, 160, 221]],
    ['powderblue', '#b0e0e6', [176, 224, 230]],
    ['purple', '#800080', [128, 0, 128]],
    ['red', '#ff0000', [255, 0, 0]],
    ['rosybrown', '#bc8f8f', [188, 143, 143]],
    ['royalblue', '#4169e1', [65, 105, 225]],
    ['saddlebrown', '#8b4513', [139, 69, 19]],
    ['salmon', '#fa8072', [250, 128, 114]],
    ['sandybrown', '#f4a460', [244, 164, 96]],
    ['seagreen', '#2e8b57', [46, 139, 87]],
    ['seashell', '#fff5ee', [255, 245, 238]],
    ['sienna', '#a0522d', [160, 82, 45]],
    ['silver', '#c0c0c0', [192, 192, 192]],
    ['skyblue', '#87ceeb', [135, 206, 235]],
    ['slateblue', '#6a5acd', [106, 90, 205]],
    ['slategray', '#708090', [112, 128, 144]],
    ['slategrey', '#708090', [112, 128, 144]],
    ['snow', '#fffafa', [255, 250, 250]],
    ['springgreen', '#00ff7f', [0, 255, 127]],
    ['steelblue', '#4682b4', [70, 130, 180]],
    ['tan', '#d2b48c', [210, 180, 140]],
    ['teal', '#008080', [0, 128, 128]],
    ['thistle', '#d8bfd8', [216, 191, 216]],
    ['tomato', '#ff6347', [255, 99, 71]],
    ['turquoise', '#40e0d0', [64, 224, 208]],
    ['violet', '#ee82ee', [238, 130, 238]],
    ['wheat', '#f5deb3', [245, 222, 179]],
    ['white', '#ffffff', [255, 255, 255]],
    ['whitesmoke', '#f5f5f5', [245, 245, 245]],
    ['yellow', '#ffff00', [255, 255, 0]],
    ['yellowgreen', '#9acd32', [154, 205, 50]]
];

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
var colorlist = _dereq_('../data/colors.js');
var nearlyEqual = _dereq_('../helpers.js')['nearlyEqual'];
var assert = _dereq_("assert");

suite('Color', function(){
    var red, green, rgba, hsl, hsla, named, epsilon;
    setup(function(){
        epsilon = 0.01;
        red = new Color("red");
        green = new Color("#0F0"); // Named color 'green' is rgb(0,128,0)
        blue = new Color("blue");
        bada55 = new Color("#BADA55");
        rgb = new Color("rgb(1, 7, 29)");
        rgba = new Color("rgba(255, 0, 0, 0.3)");
        hsl = new Color("hsl(0, 100%, 50%)");
        hsla = new Color("hsla(0, 100%, 50%, 0.3)");
        named = [];
        for (var i = 0; i < colorlist.length; i++){
            var color = colorlist[i];
            named.push([new Color(color[0]), new Color(color[1]), color[2]]);
        }
    });
    suite('properties', function(){
        test('rgb', function(){
            assert.equal(red.rgb.r, 255);
            assert.equal(red.rgb.g, 0);
            assert.equal(red.rgb.b, 0);
            for (var i = 0; i < named.length; i++){
                var named_color = named[i][0];
                var hex_color = named[i][1];
                var actual = named[i][2];
                assert.equal(named_color.rgb.r, hex_color.rgb.r);
                assert.equal(named_color.rgb.g, hex_color.rgb.g);
                assert.equal(named_color.rgb.b, hex_color.rgb.b);
                assert.equal(named_color.rgb.r, actual[0]);
                assert.equal(named_color.rgb.g, actual[1]);
                assert.equal(named_color.rgb.b, actual[2]);
            }
        });
        test('hsl', function(){
            assert.equal(red.hsl.h, 0);
            assert.equal(red.hsl.s, 100);
            assert.equal(red.hsl.l, 50);
            for (var i = 0; i < named.length; i++){
                var named_color = named[i][0];
                var hex_color = named[i][1];
                var actual = named[i][2];
                assert.equal(named_color.rgb.h, hex_color.rgb.h);
                assert.equal(named_color.rgb.s, hex_color.rgb.s);
                assert.equal(named_color.rgb.l, hex_color.rgb.l);
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
        test('hslToRgb', function(){

        });
        test('rgbToHsl', function(){

        });
    });
});
},{"../../src/utilities/color.js":14,"../data/colors.js":17,"../helpers.js":20,"assert":1}]},{},[16])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2V2ZW50cy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL21hdGgvbWF0aC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC92ZWN0b3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvdXRpbGl0aWVzL2NvbG9yLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL3V0aWxpdGllcy9rZXljb2Rlcy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3QvZmFrZV83ZWMwNDY1Ni5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2RhdGEvY29sb3JzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZW5naW5lL2NhbWVyYS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2VuZ2luZS9zY2VuZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2hlbHBlcnMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL2ZhY2UuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL21hdGgvbWVzaC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL21hdGgvdmVjdG9yLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvdXRpbGl0aWVzL2NvbG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAgICBrZXksIGk7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ2YXIgbWF0aCA9IHJlcXVpcmUoJy4uL21hdGgvbWF0aC5qcycpO1xudmFyIFZlY3RvciA9IG1hdGguVmVjdG9yO1xudmFyIE1hdHJpeCA9IG1hdGguTWF0cml4O1xuXG4vKiogXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSBwb3NpdGlvbiBDYW1lcmEgcG9zaXRpb24uXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZ2V0ICAgQ2FtZXJhXG4gKi9cbmZ1bmN0aW9uIENhbWVyYSh3aWR0aCwgaGVpZ2h0LCBwb3NpdGlvbil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IG5ldyBWZWN0b3IoMSwxLDIwKTtcbiAgICB0aGlzLnVwID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5uZWFyID0gMC4xO1xuICAgIHRoaXMuZmFyID0gMTAwMDtcbiAgICB0aGlzLmZvdiA9IDkwO1xuICAgIHRoaXMucGVyc3BlY3RpdmVGb3YgPSB0aGlzLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92KCk7XG59XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi5waXRjaCk7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHRoaXMucm90YXRpb24ucGl0Y2gpO1xuICAgIHZhciBzaW5feWF3ID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi55YXcpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbi55YXcpO1xuXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLWNvc19waXRjaCAqIHNpbl95YXcsIHNpbl9waXRjaCwgLWNvc19waXRjaCAqIGNvc195YXcpO1xufTtcbi8qKlxuICogQnVpbGRzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggYmFzZWQgb24gYSBmaWVsZCBvZiB2aWV3LlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5DYW1lcmEucHJvdG90eXBlLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvdiA9IHRoaXMuZm92ICogKE1hdGguUEkgLyAxODApOyAvLyBjb252ZXJ0IHRvIHJhZGlhbnNcbiAgICB2YXIgYXNwZWN0ID0gdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0O1xuICAgIHZhciBuZWFyID0gdGhpcy5uZWFyO1xuICAgIHZhciBmYXIgPSB0aGlzLmZhcjtcbiAgICB2YXIgbWF0cml4ID0gTWF0cml4Lnplcm8oKTtcbiAgICB2YXIgaGVpZ2h0ID0gKDEvTWF0aC50YW4oZm92LzIpKSAqIHRoaXMuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IGhlaWdodCAqIGFzcGVjdDtcblxuICAgIG1hdHJpeFswXSA9IHdpZHRoO1xuICAgIG1hdHJpeFs1XSA9IGhlaWdodDtcbiAgICBtYXRyaXhbMTBdID0gZmFyLyhuZWFyLWZhcikgO1xuICAgIG1hdHJpeFsxMV0gPSAtMTtcbiAgICBtYXRyaXhbMTRdID0gbmVhcipmYXIvKG5lYXItZmFyKTtcblxuICAgIHJldHVybiBtYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUuY3JlYXRlVmlld01hdHJpeCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGV5ZSA9IHRoaXMucG9zaXRpb247XG4gICAgdmFyIHBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaDtcbiAgICB2YXIgeWF3ID0gdGhpcy5yb3RhdGlvbi55YXc7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHBpdGNoKTtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4ocGl0Y2gpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3MoeWF3KTtcbiAgICB2YXIgc2luX3lhdyA9IE1hdGguc2luKHlhdyk7XG5cbiAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKGNvc195YXcsIDAsIC1zaW5feWF3ICk7XG4gICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcihzaW5feWF3ICogc2luX3BpdGNoLCBjb3NfcGl0Y2gsIGNvc195YXcgKiBzaW5fcGl0Y2ggKTtcbiAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKHNpbl95YXcgKiBjb3NfcGl0Y2gsIC1zaW5fcGl0Y2gsIGNvc19waXRjaCAqIGNvc195YXcgKTtcblxuICAgIHZhciB2aWV3X21hdHJpeCA9IE1hdHJpeC5mcm9tQXJyYXkoW1xuICAgICAgICB4YXhpcy54LCB5YXhpcy54LCB6YXhpcy54LCAwLFxuICAgICAgICB4YXhpcy55LCB5YXhpcy55LCB6YXhpcy55LCAwLFxuICAgICAgICB4YXhpcy56LCB5YXhpcy56LCB6YXhpcy56LCAwLFxuICAgICAgICAtKHhheGlzLmRvdChleWUpICksIC0oIHlheGlzLmRvdChleWUpICksIC0oIHpheGlzLmRvdChleWUpICksIDFcbiAgICBdKTtcbiAgICByZXR1cm4gdmlld19tYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSwgeil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IoeCx5LHopO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlUmlnaHQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciByaWdodCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChyaWdodCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVMZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgbGVmdCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQobGVmdCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbkNhbWVyYS5wcm90b3R5cGUudHVyblJpZ2h0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3IDwgMCl7XG4gICAgICAgIHRoaXMucm90YXRpb24ueWF3ID0gdGhpcy5yb3RhdGlvbi55YXcgKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLnR1cm5MZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3ID4gKE1hdGguUEkqMikpe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnlhdyA9IHRoaXMucm90YXRpb24ueWF3IC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5DYW1lcmEucHJvdG90eXBlLmxvb2tVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPiAoTWF0aC5QSSoyKSl7XG4gICAgICAgIHRoaXMucm90YXRpb24ucGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoIC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5sb29rRG93biA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPCAwKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi5waXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2ggKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIHVwID0gdGhpcy51cC5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmFkZCh1cCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVEb3duID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgZG93biA9IHRoaXMudXAubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChkb3duKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZUZvcndhcmQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBmb3J3YXJkID0gdGhpcy5kaXJlY3Rpb24oKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmFkZChmb3J3YXJkKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZUJhY2t3YXJkID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgYmFja3dhcmQgPSB0aGlzLmRpcmVjdGlvbigpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uc3VidHJhY3QoYmFja3dhcmQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuIiwiLyoqXG4gKiBFdmVudCBoYW5kbGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDEwIE5pY2hvbGFzIEMuIFpha2FzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG5mdW5jdGlvbiBFdmVudFRhcmdldCgpe1xuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xufVxuXG4vKipcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaXN0ZW5lclxuICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcil7XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9saXN0ZW5lcnNbdHlwZV0gPT09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB9XG5cbiAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG59O1xuLyoqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGV2ZW50XG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgZXZlbnQgdHlwZSBkb2VzIG5vdCBleGlzdCBpbiBFdmVudFRhcmdldFxuICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgZXZlbnQgPSB7IHR5cGU6IGV2ZW50IH07XG4gICAgfVxuICAgIGlmICghZXZlbnQudGFyZ2V0KXtcbiAgICAgICAgZXZlbnQudGFyZ2V0ID0gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50LnR5cGUpeyAgLy9mYWxzeVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFdmVudCBvYmplY3QgbWlzc2luZyAndHlwZScgcHJvcGVydHkuXCIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9saXN0ZW5lcnNbZXZlbnQudHlwZV0gaW5zdGFuY2VvZiBBcnJheSl7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnQudHlwZV07XG4gICAgICAgIGZvciAodmFyIGk9MCwgbGVuPWxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICBsaXN0ZW5lcnNbaV0uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLyoqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBsaXN0ZW5lclxuICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcil7XG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KXtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgZm9yICh2YXIgaT0wLCBsZW49bGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0gPT09IGxpc3RlbmVyKXtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudFRhcmdldDsiLCJ2YXIgbWF0aCA9IHJlcXVpcmUoJy4uL21hdGgvbWF0aC5qcycpO1xudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhLmpzJyk7XG52YXIgRXZlbnRUYXJnZXQgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEtFWUNPREVTID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2tleWNvZGVzLmpzJyk7XG5cbnZhciBWZWN0b3IgPSBtYXRoLlZlY3RvcjtcbnZhciBNYXRyaXggPSBtYXRoLk1hdHJpeDtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7e2NhbnZhc19pZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn19IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gU2NlbmUob3B0aW9ucyl7XG4gICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGg7XG4gICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodDtcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdGlvbnMuY2FudmFzX2lkKTtcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlci53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgdGhpcy5fYmFja19idWZmZXIuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4ID0gdGhpcy5fYmFja19idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IG51bGw7XG4gICAgdGhpcy5fZGVwdGhfYnVmZmVyID0gW107XG4gICAgdGhpcy5kcmF3aW5nX21vZGUgPSAxO1xuICAgIHRoaXMuX2JhY2tmYWNlX2N1bGxpbmcgPSB0cnVlO1xuICAgIHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5pbGx1bWluYXRpb24gPSBuZXcgVmVjdG9yKDkwLDAsMCk7XG4gICAgLyoqIEB0eXBlIHtBcnJheS48TWVzaD59ICovXG4gICAgdGhpcy5tZXNoZXMgPSB7fTtcbiAgICAvKiogQHR5cGUge09iamVjdC48bnVtYmVyLCBib29sZWFuPn0gKi9cbiAgICB0aGlzLl9rZXlzID0ge307IC8vIEtleXMgY3VycmVudGx5IHByZXNzZWRcbiAgICB0aGlzLl9rZXlfY291bnQgPSAwOyAvLyBOdW1iZXIgb2Yga2V5cyBiZWluZyBwcmVzc2VkLi4uIHRoaXMgZmVlbHMga2x1ZGd5XG4gICAgLyoqIEB0eXBlIHs/bnVtYmVyfSAqL1xuICAgIHRoaXMuX2FuaW1faWQgPSBudWxsO1xuICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICB0aGlzLl9uZWVkc191cGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2RyYXdfbW9kZSA9ICd3aXJlZnJhbWUnO1xuICAgIHRoaXMuaW5pdCgpO1xufVxuU2NlbmUucHJvdG90eXBlID0gbmV3IEV2ZW50VGFyZ2V0KCk7XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuY2FudmFzLnRhYkluZGV4ID0gMTsgLy8gU2V0IHRhYiBpbmRleCB0byBhbGxvdyBjYW52YXMgdG8gaGF2ZSBmb2N1cyB0byByZWNlaXZlIGtleSBldmVudHNcbiAgICB0aGlzLl94X29mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDIpO1xuICAgIHRoaXMuX3lfb2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLmhlaWdodCAvIDIpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZURlcHRoQnVmZmVyKCk7XG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSB0aGlzLl9iYWNrX2J1ZmZlcl9jdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd24uYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5lbXB0eUtleXMuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIEV2ZW50VGFyZ2V0LmNhbGwodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbn07XG4vKipcbiAqIER1bXAgYWxsIHByZXNzZWQga2V5cyBvbiBibHVyLlxuICogQG1ldGhvZFxuICovXG5TY2VuZS5wcm90b3R5cGUuZW1wdHlLZXlzID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLl9rZXlfY291bnQgPSAwO1xuICAgIHRoaXMuX2tleXMgPSB7fTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmlzS2V5RG93biA9IGZ1bmN0aW9uKGtleSl7XG4gICAgcmV0dXJuIChLRVlDT0RFU1trZXldIGluIHRoaXMuX2tleXMpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub25LZXlEb3duID0gZnVuY3Rpb24oZSl7XG4gICAgdmFyIHByZXNzZWQgPSBlLmtleUNvZGUgfHwgZS53aGljaDtcbiAgICBpZiAoIXRoaXMuaXNLZXlEb3duKHByZXNzZWQpKXtcbiAgICAgICAgdGhpcy5fa2V5X2NvdW50ICs9IDE7XG4gICAgICAgIHRoaXMuX2tleXNbcHJlc3NlZF0gPSB0cnVlO1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9uS2V5VXAgPSBmdW5jdGlvbihlKXtcbiAgICB2YXIgcHJlc3NlZCA9IGUua2V5Q29kZSB8fCBlLndoaWNoO1xuICAgIGlmIChwcmVzc2VkIGluIHRoaXMuX2tleXMpe1xuICAgICAgICB0aGlzLl9rZXlfY291bnQgLT0gMTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2tleXNbcHJlc3NlZF07XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaW5pdGlhbGl6ZURlcHRoQnVmZmVyID0gZnVuY3Rpb24oKXtcbiAgICBmb3IgKHZhciB4ID0gMCwgbGVuID0gdGhpcy53aWR0aCAqIHRoaXMuaGVpZ2h0OyB4IDwgbGVuOyB4Kyspe1xuICAgICAgICB0aGlzLl9kZXB0aF9idWZmZXJbeF0gPSA5OTk5OTk5O1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9mZnNjcmVlbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgLy8gVE9ETzogTm90IHRvdGFsbHkgY2VydGFpbiB0aGF0IHo+MSBpbmRpY2F0ZXMgdmVjdG9yIGlzIGJlaGluZCBjYW1lcmEuXG4gICAgdmFyIHggPSB2ZWN0b3IueCArIHRoaXMuX3hfb2Zmc2V0O1xuICAgIHZhciB5ID0gdmVjdG9yLnkgKyB0aGlzLl95X29mZnNldDtcbiAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgIHJldHVybiAoeiA+IDEgfHwgeCA8IDAgfHwgeCA+IHRoaXMud2lkdGggfHwgeSA8IDAgfHwgeSA+IHRoaXMuaGVpZ2h0KTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdQaXhlbCA9IGZ1bmN0aW9uKHgsIHksIHosIGNvbG9yKXtcbiAgICB4ID0gTWF0aC5mbG9vcih4ICsgdGhpcy5feF9vZmZzZXQpO1xuICAgIHkgPSBNYXRoLmZsb29yKHkgKyB0aGlzLl95X29mZnNldCk7XG4gICAgaWYgKHggPj0gMCAmJiB4IDwgdGhpcy53aWR0aCAmJiB5ID49IDAgJiYgeSA8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHggKyAoeSAqIHRoaXMud2lkdGgpO1xuICAgICAgICBpZiAoeiA8IHRoaXMuX2RlcHRoX2J1ZmZlcltpbmRleF0pIHtcbiAgICAgICAgICAgIHZhciBpbWFnZV9kYXRhID0gdGhpcy5fYmFja19idWZmZXJfaW1hZ2UuZGF0YTtcbiAgICAgICAgICAgIHZhciBpID0gaW5kZXggKiA0O1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpXSA9IGNvbG9yLnI7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krMV0gPSBjb2xvci5nO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzJdID0gY29sb3IuYjtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSszXSA9IDI1NTtcbiAgICAgICAgICAgIHRoaXMuX2RlcHRoX2J1ZmZlcltpbmRleF0gPSB6O1xuICAgICAgICB9XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdFZGdlID0gZnVuY3Rpb24odmVjdG9yMSwgdmVjdG9yMiwgY29sb3Ipe1xuICAgIHZhciBhYnMgPSBNYXRoLmFicztcbiAgICBpZiAodmVjdG9yMS54ID4gdmVjdG9yMi54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2ZWN0b3IxO1xuICAgICAgICB2ZWN0b3IxID0gdmVjdG9yMjtcbiAgICAgICAgdmVjdG9yMiA9IHRlbXA7XG4gICAgfVxuICAgIHZhciBjdXJyZW50X3ggPSB2ZWN0b3IxLng7XG4gICAgdmFyIGN1cnJlbnRfeSA9IHZlY3RvcjEueTtcbiAgICB2YXIgY3VycmVudF96ID0gdmVjdG9yMS56O1xuICAgIHZhciBsb25nZXN0X2Rpc3QgPSBNYXRoLm1heChhYnModmVjdG9yMi54IC0gdmVjdG9yMS54KSwgYWJzKHZlY3RvcjIueSAtIHZlY3RvcjEueSksIGFicyh2ZWN0b3IyLnogLSB2ZWN0b3IxLnopKTtcbiAgICB2YXIgc3RlcF94ID0gKHZlY3RvcjIueCAtIHZlY3RvcjEueCkgLyBsb25nZXN0X2Rpc3Q7XG4gICAgdmFyIHN0ZXBfeSA9ICh2ZWN0b3IyLnkgLSB2ZWN0b3IxLnkpIC8gbG9uZ2VzdF9kaXN0O1xuICAgIHZhciBzdGVwX3ogPSAodmVjdG9yMi56IC0gdmVjdG9yMS56KSAvIGxvbmdlc3RfZGlzdDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9uZ2VzdF9kaXN0OyBpKyspe1xuICAgICAgICB0aGlzLmRyYXdQaXhlbChjdXJyZW50X3gsIGN1cnJlbnRfeSwgY3VycmVudF96LCBjb2xvcik7XG4gICAgICAgIGN1cnJlbnRfeCArPSBzdGVwX3g7XG4gICAgICAgIGN1cnJlbnRfeSArPSBzdGVwX3k7XG4gICAgICAgIGN1cnJlbnRfeiArPSBzdGVwX3o7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd1RyaWFuZ2xlID0gZnVuY3Rpb24odmVjdG9yMSwgdmVjdG9yMiwgdmVjdG9yMywgY29sb3Ipe1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMSwgdmVjdG9yMiwgY29sb3IpO1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMiwgdmVjdG9yMywgY29sb3IpO1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMywgdmVjdG9yMSwgY29sb3IpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd0ZsYXRCb3R0b21UcmlhbmdsZSA9IGZ1bmN0aW9uKHYxLCB2MiwgdjMsIGNvbG9yKXtcbiAgICAvLyBEcmF3IGxlZnQgdG8gcmlnaHRcbiAgICBpZiAodjIueCA+PSB2My54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2MztcbiAgICAgICAgdjMgPSB2MjtcbiAgICAgICAgdjIgPSB0ZW1wO1xuICAgIH1cbiAgICAvLyBjb21wdXRlIGRlbHRhc1xuICAgIHZhciBkeHlfbGVmdCAgPSAodjMueC12MS54KS8odjMueS12MS55KTtcbiAgICB2YXIgZHh5X3JpZ2h0ID0gKHYyLngtdjEueCkvKHYyLnktdjEueSk7XG4gICAgdmFyIHpfc2xvcGVfbGVmdCA9ICh2My56LXYxLnopLyh2My55LXYxLnkpO1xuICAgIHZhciB6X3Nsb3BlX3JpZ2h0ID0gKHYyLnotdjEueikvKHYyLnktdjEueSk7XG5cbiAgICAvLyBzZXQgc3RhcnRpbmcgYW5kIGVuZGluZyBwb2ludHMgZm9yIGVkZ2UgdHJhY2VcbiAgICB2YXIgeHMgPSBuZXcgVmVjdG9yKHYxLngsIHYxLnksIHYxLnopO1xuICAgIHZhciB4ZSA9IG5ldyBWZWN0b3IodjEueCwgdjEueSwgdjEueik7XG4gICAgeHMueiA9IHYzLnogKyAoKHYxLnkgLSB2My55KSAqIHpfc2xvcGVfbGVmdCk7XG4gICAgeGUueiA9IHYyLnogKyAoKHYxLnkgLSB2Mi55KSAqIHpfc2xvcGVfcmlnaHQpO1xuXG4gICAgLy8gZHJhdyBlYWNoIHNjYW5saW5lXG4gICAgZm9yICh2YXIgeT12MS55OyB5IDw9IHYyLnk7IHkrKyl7XG4gICAgICAgIHhzLnkgPSB5O1xuICAgICAgICB4ZS55ID0geTtcbiAgICAgICAgdGhpcy5kcmF3RWRnZSh4cywgeGUsIGNvbG9yKTtcblxuICAgICAgICAvLyBtb3ZlIGRvd24gb25lIHNjYW5saW5lXG4gICAgICAgIHhzLngrPWR4eV9sZWZ0O1xuICAgICAgICB4ZS54Kz1keHlfcmlnaHQ7XG4gICAgICAgIHhzLnorPXpfc2xvcGVfbGVmdDtcbiAgICAgICAgeGUueis9el9zbG9wZV9yaWdodDtcbiAgICB9XG59O1xuU2NlbmUucHJvdG90eXBlLmRyYXdGbGF0VG9wVHJpYW5nbGUgPSBmdW5jdGlvbih2MSwgdjIsIHYzLCBjb2xvcil7XG4gICAgLy8gRHJhdyBsZWZ0IHRvIHJpZ2h0XG4gICAgaWYgKHYxLnggPj0gdjIueCl7XG4gICAgICAgIHZhciB0ZW1wID0gdjE7XG4gICAgICAgIHYxID0gdjI7XG4gICAgICAgIHYyID0gdGVtcDtcbiAgICB9XG4gICAgLy8gY29tcHV0ZSBkZWx0YXNcbiAgICB2YXIgZHh5X2xlZnQgID0gKHYzLngtdjEueCkvKHYzLnktdjEueSk7XG4gICAgdmFyIGR4eV9yaWdodCA9ICh2My54LXYyLngpLyh2My55LXYyLnkpO1xuICAgIHZhciB6X3Nsb3BlX2xlZnQgPSAodjMuei12MS56KS8odjMueS12MS55KTtcbiAgICB2YXIgel9zbG9wZV9yaWdodCA9ICh2My56LXYyLnopLyh2My55LXYyLnkpO1xuXG4gICAgLy8gc2V0IHN0YXJ0aW5nIGFuZCBlbmRpbmcgcG9pbnRzIGZvciBlZGdlIHRyYWNlXG4gICAgdmFyIHhzID0gbmV3IFZlY3Rvcih2MS54LCB2MS55LCB2MS56KTtcbiAgICB2YXIgeGUgPSBuZXcgVmVjdG9yKHYyLngsIHYxLnksIHYxLnopO1xuXG4gICAgeHMueiA9IHYxLnogKyAoKHYxLnkgLSB2MS55KSAqIHpfc2xvcGVfbGVmdCk7XG4gICAgeGUueiA9IHYyLnogKyAoKHYxLnkgLSB2Mi55KSAqIHpfc2xvcGVfcmlnaHQpO1xuXG4gICAgLy8gZHJhdyBlYWNoIHNjYW5saW5lXG4gICAgZm9yICh2YXIgeT12MS55OyB5IDw9IHYzLnk7IHkrKyl7XG4gICAgICAgIHhzLnkgPSB5O1xuICAgICAgICB4ZS55ID0geTtcbiAgICAgICAgLy8gZHJhdyBhIGxpbmUgZnJvbSB4cyB0byB4ZSBhdCB5IGluIGNvbG9yIGNcbiAgICAgICAgdGhpcy5kcmF3RWRnZSh4cywgeGUsIGNvbG9yKTtcbiAgICAgICAgLy8gbW92ZSBkb3duIG9uZSBzY2FubGluZVxuICAgICAgICB4cy54Kz1keHlfbGVmdDtcbiAgICAgICAgeGUueCs9ZHh5X3JpZ2h0O1xuICAgICAgICB4cy56Kz16X3Nsb3BlX2xlZnQ7XG4gICAgICAgIHhlLnorPXpfc2xvcGVfcmlnaHQ7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZmlsbFRyaWFuZ2xlID0gZnVuY3Rpb24odjEsIHYyLCB2MywgY29sb3Ipe1xuICAgIC8vIERyYXcgZWRnZXMgZmlyc3RcbiAgICAvLyBUT0RPOiBGaXguIFRoaXMgaXMgYSBoYWNrLiBcbiAgICAvL3RoaXMuZHJhd1RyaWFuZ2xlKHYxLCB2MiwgdjMsIGNvbG9yKTtcbiAgICAvLyBTb3J0IHZlcnRpY2VzIGJ5IHkgdmFsdWVcbiAgICB2YXIgdGVtcDtcbiAgICBpZih2MS55ID4gdjIueSkge1xuICAgICAgICB0ZW1wID0gdjI7XG4gICAgICAgIHYyID0gdjE7XG4gICAgICAgIHYxID0gdGVtcDtcbiAgICB9XG4gICAgaWYodjIueSA+IHYzLnkpIHtcbiAgICAgICAgdGVtcCA9IHYyO1xuICAgICAgICB2MiA9IHYzO1xuICAgICAgICB2MyA9IHRlbXA7XG4gICAgfVxuICAgIGlmKHYxLnkgPiB2Mi55KSB7XG4gICAgICAgIHRlbXAgPSB2MjtcbiAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgdjEgPSB0ZW1wO1xuICAgIH1cbiAgICAvLyBUcmlhbmdsZSB3aXRoIG5vIGhlaWdodFxuICAgIGlmICgodjEueSAtIHYzLnkpID09PSAwKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzaG9ydF9zbG9wZSwgbG9uZ19zbG9wZTtcbiAgICBpZiAoKHYyLnkgLSB2MS55KSA9PT0gMCkge1xuICAgICAgICBzaG9ydF9zbG9wZSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2hvcnRfc2xvcGUgPSAodjIueCAtIHYxLngpIC8gKHYyLnkgLSB2MS55KTtcbiAgICB9XG4gICAgaWYgKCh2My55IC0gdjEueSkgPT09IDApIHtcbiAgICAgICAgbG9uZ19zbG9wZSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9uZ19zbG9wZSA9ICh2My54IC0gdjEueCkgLyAodjMueSAtIHYxLnkpO1xuICAgIH1cblxuICAgIGlmICh2Mi55ID09PSB2My55KXtcbiAgICAgICAgLy8gRmxhdCB0b3BcbiAgICAgICAgdGhpcy5kcmF3RmxhdEJvdHRvbVRyaWFuZ2xlKHYxLCB2MiwgdjMsIGNvbG9yKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodjEueSA9PT0gdjIueSApe1xuICAgICAgICAvLyBGbGF0IGJvdHRvbVxuICAgICAgICB0aGlzLmRyYXdGbGF0VG9wVHJpYW5nbGUodjEsIHYyLCB2MywgY29sb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlY29tcG9zZSBpbnRvIGZsYXQgdG9wIGFuZCBmbGF0IGJvdHRvbSB0cmlhbmdsZXNcbiAgICAgICAgdmFyIHpfc2xvcGUgPSAodjMueiAtIHYxLnopIC8gKHYzLnkgLSB2MS55KTtcbiAgICAgICAgdmFyIHggPSAoKHYyLnkgLSB2MS55KSpsb25nX3Nsb3BlKSArIHYxLng7XG4gICAgICAgIHZhciB6ID0gKCh2Mi55IC0gdjEueSkqel9zbG9wZSkgKyB2MS56O1xuICAgICAgICB2YXIgdjQgPSBuZXcgVmVjdG9yKHgsIHYyLnksIHopO1xuICAgICAgICB0aGlzLmRyYXdGbGF0Qm90dG9tVHJpYW5nbGUodjEsIHYyLCB2NCwgY29sb3IpO1xuICAgICAgICB0aGlzLmRyYXdGbGF0VG9wVHJpYW5nbGUodjIsIHY0LCB2MywgY29sb3IpO1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnJlbmRlclNjZW5lID0gZnVuY3Rpb24oKXtcbiAgICAvLyBUT0RPOiBTaW1wbGlmeSB0aGlzIGZ1bmN0aW9uLlxuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gdGhpcy5fYmFja19idWZmZXJfY3R4LmNyZWF0ZUltYWdlRGF0YSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5pbml0aWFsaXplRGVwdGhCdWZmZXIoKTtcbiAgICB2YXIgY2FtZXJhX21hdHJpeCA9IHRoaXMuY2FtZXJhLnZpZXdfbWF0cml4O1xuICAgIHZhciBwcm9qZWN0aW9uX21hdHJpeCA9IHRoaXMuY2FtZXJhLnBlcnNwZWN0aXZlRm92O1xuICAgIHZhciBsaWdodCA9IHRoaXMuaWxsdW1pbmF0aW9uO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLm1lc2hlcyl7XG4gICAgICAgIGlmICh0aGlzLm1lc2hlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKXtcbiAgICAgICAgICAgIHZhciBtZXNoID0gdGhpcy5tZXNoZXNba2V5XTtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IG1lc2guc2NhbGU7XG4gICAgICAgICAgICB2YXIgcm90YXRpb24gPSBtZXNoLnJvdGF0aW9uO1xuICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gbWVzaC5wb3NpdGlvbjtcbiAgICAgICAgICAgIHZhciB3b3JsZF9tYXRyaXggPSBNYXRyaXguc2NhbGUoc2NhbGUueCwgc2NhbGUueSwgc2NhbGUueikubXVsdGlwbHkoXG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uKHJvdGF0aW9uLnBpdGNoLCByb3RhdGlvbi55YXcsIHJvdGF0aW9uLnJvbGwpLm11bHRpcGx5KFxuICAgICAgICAgICAgICAgICAgICBNYXRyaXgudHJhbnNsYXRpb24ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueikpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbWVzaC5mYWNlcy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGZhY2UgPSBtZXNoLmZhY2VzW2tdLmZhY2U7XG4gICAgICAgICAgICAgICAgdmFyIGNvbG9yID0gbWVzaC5mYWNlc1trXS5jb2xvcjtcbiAgICAgICAgICAgICAgICB2YXIgdjEgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMF1dO1xuICAgICAgICAgICAgICAgIHZhciB2MiA9IG1lc2gudmVydGljZXNbZmFjZVsxXV07XG4gICAgICAgICAgICAgICAgdmFyIHYzID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzJdXTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbm9ybWFsXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQ2FuIHRoaXMgYmUgY2FsY3VsYXRlZCBqdXN0IG9uY2UsIGFuZCB0aGVuIHRyYW5zZm9ybWVkIGludG9cbiAgICAgICAgICAgICAgICAvLyBjYW1lcmEgc3BhY2U/XG4gICAgICAgICAgICAgICAgdmFyIGNhbV90b192ZXJ0ID0gdGhpcy5jYW1lcmEucG9zaXRpb24uc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlMSA9IHYyLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lkZTIgPSB2My50cmFuc2Zvcm0od29ybGRfbWF0cml4KS5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIG5vcm0gPSBzaWRlMS5jcm9zcyhzaWRlMik7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm0ubWFnbml0dWRlKCkgPD0gMC4wMDAwMDAwMSl7XG4gICAgICAgICAgICAgICAgICAgIG5vcm0gPSBub3JtO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm0gPSBub3JtLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBCYWNrZmFjZSBjdWxsaW5nLlxuICAgICAgICAgICAgICAgIGlmIChjYW1fdG9fdmVydC5kb3Qobm9ybSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgd3ZwX21hdHJpeCA9IHdvcmxkX21hdHJpeC5tdWx0aXBseShjYW1lcmFfbWF0cml4KS5tdWx0aXBseShwcm9qZWN0aW9uX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djEgPSB2MS50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djIgPSB2Mi50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djMgPSB2My50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkcmF3ID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IHN1cmZhY2Ugbm9ybWFsc1xuICAgICAgICAgICAgICAgICAgICAvLyB2YXIgZmFjZV90cmFucyA9IE1hdHJpeC50cmFuc2xhdGlvbih3djEueCwgd3YxLnksIHYxLnopO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdFZGdlKHd2MSwgbm9ybS5zY2FsZSgyMCkudHJhbnNmb3JtKGZhY2VfdHJhbnMpLCB7J3InOjI1NSxcImdcIjoyNTUsXCJiXCI6MjU1fSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGaXggZnJ1c3R1bSBjdWxsaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgcmVhbGx5IHN0dXBpZCBmcnVzdHVtIGN1bGxpbmcuLi4gdGhpcyBjYW4gcmVzdWx0IGluIHNvbWUgZmFjZXMgbm90IGJlaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGRyYXduIHdoZW4gdGhleSBzaG91bGQsIGUuZy4gd2hlbiBhIHRyaWFuZ2xlcyB2ZXJ0aWNlcyBzdHJhZGRsZSB0aGUgZnJ1c3RydW0uXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9mZnNjcmVlbih3djEpICYmIHRoaXMub2Zmc2NyZWVuKHd2MikgJiYgdGhpcy5vZmZzY3JlZW4od3YzKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYXcpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpZ2h0X2RpcmVjdGlvbiA9IGxpZ2h0LnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbGx1bWluYXRpb25fYW5nbGUgPSBub3JtLmRvdChsaWdodF9kaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBjb2xvci5saWdodGVuKGlsbHVtaW5hdGlvbl9hbmdsZS82KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbFRyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1RyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4LnB1dEltYWdlRGF0YSh0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSwgMCwgMCk7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIHRoaXMuY3R4LmRyYXdJbWFnZSh0aGlzLl9iYWNrX2J1ZmZlciwgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5hZGRNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgdGhpcy5tZXNoZXNbbWVzaC5uYW1lXSA9IG1lc2g7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5yZW1vdmVNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgZGVsZXRlIHRoaXMubWVzaGVzW21lc2gubmFtZV07XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLl9rZXlfY291bnQgPiAwKXtcbiAgICAgICAgdGhpcy5maXJlKCdrZXlkb3duJyk7XG4gICAgfVxuICAgIC8vIFRPRE86IEFkZCBrZXl1cCwgbW91c2Vkb3duLCBtb3VzZWRyYWcsIG1vdXNldXAsIGV0Yy5cbiAgICBpZiAodGhpcy5fbmVlZHNfdXBkYXRlKSB7XG4gICAgICAgIHRoaXMucmVuZGVyU2NlbmUoKTtcbiAgICAgICAgdGhpcy5fbmVlZHNfdXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2FuaW1faWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTtcbiIsInZhciBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy9jb2xvci5qcycpO1xuXG4vKipcbiAqIEEgM0QgdHJpYW5nbGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IGEgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7bnVtYmVyfSBiICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge251bWJlcn0gYyAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gRmFjZShhLCBiLCBjLCBjb2xvcil7XG4gICAgdGhpcy5mYWNlID0gW2EsIGIsIGNdO1xuICAgIHRoaXMuY29sb3IgPSBuZXcgQ29sb3IoY29sb3IpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2U7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG52YXIgTWVzaCA9IHJlcXVpcmUoJy4vbWVzaC5qcycpO1xudmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4vbWF0cml4LmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4vZmFjZS5qcycpO1xuXG52YXIgbWF0aCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbm1hdGguVmVjdG9yID0gVmVjdG9yO1xubWF0aC5NZXNoID0gTWVzaDtcbm1hdGguTWF0cml4ID0gTWF0cml4O1xubWF0aC5GYWNlID0gRmFjZTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXRoOyIsIi8qKiBcbiAqIDR4NCBtYXRyaXguXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWF0cml4KCl7XG4gICAgZm9yICh2YXIgaT0wOyBpPDE2OyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gMDtcbiAgICB9XG4gICAgdGhpcy5sZW5ndGggPSAxNjtcbn1cbi8qKlxuICogQ29tcGFyZSBtYXRyaXggd2l0aCBzZWxmIGZvciBlcXVhbGl0eS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgaWYgKHRoaXNbaV0gIT09IG1hdHJpeFtpXSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuLyoqXG4gKiBBZGQgbWF0cml4IHRvIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldICsgbWF0cml4W2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFN1YnRyYWN0IG1hdHJpeCBmcm9tIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gLSBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTXVsdGlwbHkgc2VsZiBieSBzY2FsYXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHlTY2FsYXIgPSBmdW5jdGlvbihzY2FsYXIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gKiBzY2FsYXI7XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTXVsdGlwbHkgc2VsZiBieSBtYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIG5ld19tYXRyaXhbMF0gPSAodGhpc1swXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs0XSkgKyAodGhpc1syXSAqIG1hdHJpeFs4XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMV0gPSAodGhpc1swXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs1XSkgKyAodGhpc1syXSAqIG1hdHJpeFs5XSkgKyAodGhpc1szXSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMl0gPSAodGhpc1swXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs2XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzNdID0gKHRoaXNbMF0gKiBtYXRyaXhbM10pICsgKHRoaXNbMV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzNdICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFs0XSA9ICh0aGlzWzRdICogbWF0cml4WzBdKSArICh0aGlzWzVdICogbWF0cml4WzRdKSArICh0aGlzWzZdICogbWF0cml4WzhdKSArICh0aGlzWzddICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs1XSA9ICh0aGlzWzRdICogbWF0cml4WzFdKSArICh0aGlzWzVdICogbWF0cml4WzVdKSArICh0aGlzWzZdICogbWF0cml4WzldKSArICh0aGlzWzddICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFs2XSA9ICh0aGlzWzRdICogbWF0cml4WzJdKSArICh0aGlzWzVdICogbWF0cml4WzZdKSArICh0aGlzWzZdICogbWF0cml4WzEwXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbN10gPSAodGhpc1s0XSAqIG1hdHJpeFszXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs3XSkgKyAodGhpc1s2XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzhdID0gKHRoaXNbOF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTBdICogbWF0cml4WzhdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbOV0gPSAodGhpc1s4XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTFdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxMF0gPSAodGhpc1s4XSAqIG1hdHJpeFsyXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbMTFdID0gKHRoaXNbOF0gKiBtYXRyaXhbM10pICsgKHRoaXNbOV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMTBdICogbWF0cml4WzExXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzEyXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFswXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTRdICogbWF0cml4WzhdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbMTNdID0gKHRoaXNbMTJdICogbWF0cml4WzFdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs1XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOV0pICsgKHRoaXNbMTVdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsxNF0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMTNdICogbWF0cml4WzZdKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTVdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxNV0gPSAodGhpc1sxMl0gKiBtYXRyaXhbM10pICsgKHRoaXNbMTNdICogbWF0cml4WzddKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTVdICogbWF0cml4WzE1XSk7XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBOZWdhdGUgc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IC10aGlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFRyYW5zcG9zZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9IHRoaXNbMF07XG4gICAgbmV3X21hdHJpeFsxXSA9IHRoaXNbNF07XG4gICAgbmV3X21hdHJpeFsyXSA9IHRoaXNbOF07XG4gICAgbmV3X21hdHJpeFszXSA9IHRoaXNbMTJdO1xuICAgIG5ld19tYXRyaXhbNF0gPSB0aGlzWzFdO1xuICAgIG5ld19tYXRyaXhbNV0gPSB0aGlzWzVdO1xuICAgIG5ld19tYXRyaXhbNl0gPSB0aGlzWzldO1xuICAgIG5ld19tYXRyaXhbN10gPSB0aGlzWzEzXTtcbiAgICBuZXdfbWF0cml4WzhdID0gdGhpc1syXTtcbiAgICBuZXdfbWF0cml4WzldID0gdGhpc1s2XTtcbiAgICBuZXdfbWF0cml4WzEwXSA9IHRoaXNbMTBdO1xuICAgIG5ld19tYXRyaXhbMTFdID0gdGhpc1sxNF07XG4gICAgbmV3X21hdHJpeFsxMl0gPSB0aGlzWzNdO1xuICAgIG5ld19tYXRyaXhbMTNdID0gdGhpc1s3XTtcbiAgICBuZXdfbWF0cml4WzE0XSA9IHRoaXNbMTFdO1xuICAgIG5ld19tYXRyaXhbMTVdID0gdGhpc1sxNV07XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeC1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWCA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbNl0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs5XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHktYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblkgPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFs4XSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB6LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25aID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMV0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25BeGlzID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIHUgPSBheGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHUueDtcbiAgICB2YXIgdXkgPSB1Lnk7XG4gICAgdmFyIHV6ID0gdS56O1xuICAgIHZhciB4eSA9IHV4ICogdXk7XG4gICAgdmFyIHh6ID0gdXggKiB1ejtcbiAgICB2YXIgeXogPSB1eSAqIHV6O1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcyArICgodXgqdXgpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxXSA9ICh4eSpjb3MxKSAtICh1eipzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsyXSA9ICh4eipjb3MxKSsodXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSAoeHkqY29zMSkrKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zKygodXkqdXkpKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9ICh5eipjb3MxKS0odXgqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAoeHoqY29zMSktKHV5KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gKHl6KmNvczEpKyh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3MgKyAoKHV6KnV6KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIHBpdGNoLCB5YXcsIGFuZCByb2xsXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvbiA9IGZ1bmN0aW9uKHBpdGNoLCB5YXcsIHJvbGwpe1xuICAgIHJldHVybiBNYXRyaXgucm90YXRpb25YKHJvbGwpLm11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblooeWF3KSkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWShwaXRjaCkpO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHRyYW5zbGF0aW9uIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IGRpc3RhbmNlc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgudHJhbnNsYXRpb24gPSBmdW5jdGlvbih4dHJhbnMsIHl0cmFucywgenRyYW5zKXtcbiAgICB2YXIgdHJhbnNsYXRpb25fbWF0cml4ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEyXSA9IHh0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTNdID0geXRyYW5zO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxNF0gPSB6dHJhbnM7XG4gICAgcmV0dXJuIHRyYW5zbGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBzY2FsaW5nIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IHNjYWxlXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5zY2FsZSA9IGZ1bmN0aW9uKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpe1xuICAgIHZhciBzY2FsaW5nX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBzY2FsaW5nX21hdHJpeFswXSA9IHhzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFs1XSA9IHlzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxMF0gPSB6c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gc2NhbGluZ19tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGlkZW50aXR5IG1hdHJpeFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguaWRlbnRpdHkgPSBmdW5jdGlvbigpe1xuICAgIHZhciBpZGVudGl0eSA9IG5ldyBNYXRyaXgoKTtcbiAgICBpZGVudGl0eVswXSA9IDE7XG4gICAgaWRlbnRpdHlbNV0gPSAxO1xuICAgIGlkZW50aXR5WzEwXSA9IDE7XG4gICAgaWRlbnRpdHlbMTVdID0gMTtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgemVybyBtYXRyaXhcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4Lnplcm8gPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBuZXcgTWF0cml4KCk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1hdHJpeCBmcm9tIGFuIGFycmF5XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5mcm9tQXJyYXkgPSBmdW5jdGlvbihhcnIpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSBhcnJbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4vZmFjZS5qcycpO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7QXJyYXkuPFZlY3Rvcj59IHZlcnRpY2VzXG4gKiBAcGFyYW0ge0FycmF5LjxGYWNlPn0gZWRnZXNcbiAqL1xuZnVuY3Rpb24gTWVzaChuYW1lLCB2ZXJ0aWNlcywgZmFjZXMpe1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICAgIHRoaXMuZmFjZXMgPSBmYWNlcztcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMuc2NhbGUgPSB7J3gnOiAxLCAneSc6IDEsICd6JzogMX07XG59XG5cbi8qKlxuICogQ29uc3RydWN0IGEgTWVzaCBmcm9tIGEgSlNPTiBvYmplY3QuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0gIHt7bmFtZTogc3RyaW5nLCB2ZXJ0aWNpZXM6IEFycmF5LjxBcnJheS48bnVtYmVyPj4sIGZhY2VzOiB7e2ZhY2U6IEFycmF5LjxudW1iZXI+LCBjb2xvcjogc3RyaW5nfX19fSBqc29uXG4gKiBAcmV0dXJuIHtNZXNofVxuICovXG5NZXNoLmZyb21KU09OID0gZnVuY3Rpb24oanNvbil7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG4gICAgdmFyIGZhY2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGpzb24udmVydGljZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB2YXIgdmVydGV4ID0ganNvbi52ZXJ0aWNlc1tpXTtcbiAgICAgICAgdmVydGljZXMucHVzaChuZXcgVmVjdG9yKHZlcnRleFswXSwgdmVydGV4WzFdLCB2ZXJ0ZXhbMl0pKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaiA9IDAsIGxuID0ganNvbi5mYWNlcy5sZW5ndGg7IGogPCBsbjsgaisrKXtcbiAgICAgICAgdmFyIGZhY2UgPSBqc29uLmZhY2VzW2pdO1xuICAgICAgICBmYWNlcy5wdXNoKG5ldyBGYWNlKGZhY2UuZmFjZVswXSwgZmFjZS5mYWNlWzFdLCBmYWNlLmZhY2VbMl0sIGZhY2UuY29sb3IpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBNZXNoKGpzb24ubmFtZSwgdmVydGljZXMsIGZhY2VzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzaDtcbiIsIi8qKlxuICogM0QgdmVjdG9yLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0geCB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IHkgY29vcmRpbmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHogeiBjb29yZGluYXRlXG4gKi9cbmZ1bmN0aW9uIFZlY3Rvcih4LCB5LCB6KXtcbiAgICBpZiAodHlwZW9mIHggPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeiA9PT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3VmZmljaWVudCBhcmd1bWVudHMuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy56ID0gejtcbiAgICB9XG59XG4vKipcbiAqIEFkZCB2ZWN0b3IgdG8gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHZlY3Rvci54LCB0aGlzLnkgKyB2ZWN0b3IueSwgdGhpcy56ICsgdmVjdG9yLnopO1xufTtcbi8qKlxuICogU3VidHJhY3QgdmVjdG9yIGZyb20gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0gdmVjdG9yLngsIHRoaXMueSAtIHZlY3Rvci55LCB0aGlzLnogLSB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBDb21wYXJlIHZlY3RvciB3aXRoIHNlbGYgZm9yIGVxdWFsaXR5XG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy54ID09PSB2ZWN0b3IueCAmJiB0aGlzLnkgPT09IHZlY3Rvci55ICYmIHRoaXMueiA9PT0gdmVjdG9yLno7XG59O1xuLyoqXG4gKiBGaW5kIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBhID0gdGhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgYiA9IHZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICB2YXIgYW1hZyA9IGEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSBiLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gYS5kb3QoYikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiBNYXRoLmFjb3ModGhldGEpO1xufTtcbi8qKlxuICogRmluZCB0aGUgY29zIG9mIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNvc0FuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gdGhldGE7XG59O1xuLyoqXG4gKiBGaW5kIG1hZ25pdHVkZSBvZiBhIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tYWduaXR1ZGUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBNYXRoLnNxcnQoKHRoaXMueCAqIHRoaXMueCkgKyAodGhpcy55ICogdGhpcy55KSArICh0aGlzLnogKiB0aGlzLnopKTtcbn07XG4vKipcbiAqIEZpbmQgbWFnbml0dWRlIHNxdWFyZWQgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlU3F1YXJlZCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KTtcbn07XG4vKipcbiAqIEZpbmQgZG90IHByb2R1Y3Qgb2Ygc2VsZiBhbmQgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuICh0aGlzLnggKiB2ZWN0b3IueCkgKyAodGhpcy55ICogdmVjdG9yLnkpICsgKHRoaXMueiAqIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIEZpbmQgY3Jvc3MgcHJvZHVjdCBvZiBzZWxmIGFuZCB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKFxuICAgICAgICAodGhpcy55ICogdmVjdG9yLnopIC0gKHRoaXMueiAqIHZlY3Rvci55KSxcbiAgICAgICAgKHRoaXMueiAqIHZlY3Rvci54KSAtICh0aGlzLnggKiB2ZWN0b3IueiksXG4gICAgICAgICh0aGlzLnggKiB2ZWN0b3IueSkgLSAodGhpcy55ICogdmVjdG9yLngpXG4gICAgKTtcbn07XG4vKipcbiAqIE5vcm1hbGl6ZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7VmVjdG9yfVxuICogQHRocm93cyB7WmVyb0RpdmlzaW9uRXJyb3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGUoKTtcbiAgICBpZiAobWFnbml0dWRlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLyBtYWduaXR1ZGUsIHRoaXMueSAvIG1hZ25pdHVkZSwgdGhpcy56IC8gbWFnbml0dWRlKTtcbn07XG4vKipcbiAqIFNjYWxlIHNlbGYgYnkgc2NhbGUuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGVcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKiBzY2FsZSwgdGhpcy55ICogc2NhbGUsIHRoaXMueiAqIHNjYWxlKTtcbn07XG4vKipcbiAqIE5lZ2F0ZXMgc2VsZlxuICogQHJldHVybiB7VmVjdG9yfSBbZGVzY3JpcHRpb25dXG4gKi9cblZlY3Rvci5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gbmV3IFZlY3RvcigtdGhpcy54LCAtdGhpcy55LCAtdGhpcy56KTtcbn07XG4vKipcbiAqIFByb2plY3Qgc2VsZiBvbnRvIHZlY3RvclxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnZlY3RvclByb2plY3Rpb24gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBtYWcgPSB2ZWN0b3IubWFnbml0dWRlKCk7XG4gICAgcmV0dXJuIHZlY3Rvci5zY2FsZSh0aGlzLmRvdCh2ZWN0b3IpIC8gKG1hZyAqIG1hZykpO1xufTtcbi8qKlxuICogUHJvamVjdCBzZWxmIG9udG8gdmVjdG9yXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc2NhbGFyUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIHRoaXMuZG90KHZlY3RvcikgLyB2ZWN0b3IubWFnbml0dWRlKCk7XG59O1xuLyoqXG4gKiBQZXJmb3JtIGxpbmVhciB0cmFuZm9ybWF0aW9uIG9uIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gdHJhbnNmb3JtX21hdHJpeFxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKHRyYW5zZm9ybV9tYXRyaXgpe1xuICAgIHZhciB4ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMF0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNF0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOF0pICsgdHJhbnNmb3JtX21hdHJpeFsxMl07XG4gICAgdmFyIHkgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsxXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs1XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFs5XSkgKyB0cmFuc2Zvcm1fbWF0cml4WzEzXTtcbiAgICB2YXIgeiA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzJdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzZdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzEwXSkgKyB0cmFuc2Zvcm1fbWF0cml4WzE0XTtcbiAgICB2YXIgdyA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzNdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzddKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzExXSkgKyB0cmFuc2Zvcm1fbWF0cml4WzE1XTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4IC8gdywgeSAvIHcsIHogLyB3KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCBheGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciB1ID0gYXhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB1Lng7XG4gICAgdmFyIHV5ID0gdS55O1xuICAgIHZhciB1eiA9IHUuejtcbiAgICB2YXIgeHkgPSB1LnggKiB1Lnk7XG4gICAgdmFyIHh6ID0gdS54ICogdS56O1xuICAgIHZhciB5eiA9IHUueSAqIHUuejtcbiAgICB2YXIgeCA9ICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy54KSArICgoKHh5KmNvczEpIC0gKHV6KnNpbikpICogdGhpcy55KSArICgoKHh6KmNvczEpKyh1eSpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHkgPSAoKCh4eSpjb3MxKSsodXoqc2luKSkgKiB0aGlzLngpICsgKChjb3MrKCh1eSp1eSkqY29zMSkpICogdGhpcy55KSArICgoKHl6KmNvczEpLSh1eCpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoKCh4eipjb3MxKS0odXkqc2luKSkgKiB0aGlzLngpICsgKCgoeXoqY29zMSkrKHV4KnNpbikpICogdGhpcy55KSArICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB4LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gKGNvcyAqIHRoaXMueSkgLSAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeiA9IChzaW4gKiB0aGlzLnkpICsgKGNvcyAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgeS1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKnRoaXMueCkgKyAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IC0oc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHotYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICogdGhpcy54KSAtIChzaW4gKiB0aGlzLnkpO1xuICAgIHZhciB5ID0gKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy55KTtcbiAgICB2YXIgeiA9IHRoaXMuejtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHBpdGNoLCB5YXcsIHJvbGxcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVQaXRjaFlhd1JvbGwgPSBmdW5jdGlvbihwaXRjaF9hbW50LCB5YXdfYW1udCwgcm9sbF9hbW50KSB7XG4gICAgcmV0dXJuIHRoaXMucm90YXRlWChyb2xsX2FtbnQpLnJvdGF0ZVkocGl0Y2hfYW1udCkucm90YXRlWih5YXdfYW1udCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjsiLCJ2YXIgaHNsVG9SZ2IsIHJnYlRvSHNsLCBwYXJzZUNvbG9yLCBjYWNoZTtcbi8qKlxuICogQSBjb2xvciB3aXRoIGJvdGggcmdiIGFuZCBoc2wgcmVwcmVzZW50YXRpb25zLlxuICogQGNsYXNzIENvbG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgQW55IGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKi9cbmZ1bmN0aW9uIENvbG9yKGNvbG9yKXtcbiAgICB2YXIgcGFyc2VkX2NvbG9yID0ge307XG4gICAgY29sb3IgPSBjb2xvci50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjb2xvciBpbiBjYWNoZSl7XG4gICAgICAgIHBhcnNlZF9jb2xvciA9IGNhY2hlW2NvbG9yXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJzZWRfY29sb3IgPSBwYXJzZUNvbG9yKGNvbG9yKTtcbiAgICAgICAgY2FjaGVbY29sb3JdID0gcGFyc2VkX2NvbG9yO1xuICAgIH1cbiAgICB2YXIgaHNsID0gcmdiVG9Ic2wocGFyc2VkX2NvbG9yLnIsIHBhcnNlZF9jb2xvci5nLCBwYXJzZWRfY29sb3IuYik7XG4gICAgdGhpcy5yZ2IgPSB7J3InOiBwYXJzZWRfY29sb3IuciwgJ2cnOiBwYXJzZWRfY29sb3IuZywgJ2InOiBwYXJzZWRfY29sb3IuYn07XG4gICAgdGhpcy5oc2wgPSB7J2gnOiBoc2wuaCwgJ3MnOiBoc2wucywgJ2wnOiBoc2wubH07XG4gICAgdGhpcy5hbHBoYSA9IHBhcnNlZF9jb2xvci5hIHx8IDE7XG59XG4vKipcbiAqIExpZ2h0ZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cblxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmxpZ2h0ZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sICsgcGVyY2VudDtcbiAgICBpZiAobHVtID4gMTAwKXtcbiAgICAgICAgbHVtID0gMTAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKFwiaHNsYShcIiArIGhzbC5oICsgXCIsXCIgKyBoc2wucyArIFwiJSxcIiArIGx1bSArIFwiJSxcIiArIHRoaXMuYWxwaGEgKyBcIilcIik7XG59O1xuLyoqXG4gKiBEYXJrZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3J9XG4gKi9cbkNvbG9yLnByb3RvdHlwZS5kYXJrZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sIC0gcGVyY2VudDtcbiAgICBpZiAobHVtIDwgMCl7XG4gICAgICAgIGx1bSA9IDA7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29sb3IoXCJoc2xhKFwiICsgaHNsLmggKyBcIixcIiArIGhzbC5zICsgXCIlLFwiICsgbHVtICsgXCIlLFwiICsgdGhpcy5hbHBoYSArIFwiKVwiKTtcbn07XG4vKipcbiAqIEBwYXJhbSAge251bWJlcn0gaCBIdWVcbiAqIEBwYXJhbSAge251bWJlcn0gcyBTYXR1cmF0aW9uXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGwgTHVtaW5hbmNlXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcn19XG4gKi9cbmhzbFRvUmdiID0gZnVuY3Rpb24oaCwgcywgbCl7XG4gICAgZnVuY3Rpb24gX3YobTEsIG0yLCBodWUpe1xuICAgICAgICBodWUgPSBodWU7XG4gICAgICAgIGlmIChodWUgPCAwKXtodWUrPTE7fVxuICAgICAgICBpZiAoaHVlIDwgKDEvNikpe1xuICAgICAgICAgICAgcmV0dXJuIG0xICsgKG0yLW0xKSpodWUqNjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgMC41KXtcbiAgICAgICAgICAgIHJldHVybiBtMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgKDIvMykpe1xuICAgICAgICAgICAgcmV0dXJuIG0xICsgKG0yLW0xKSooKDIvMyktaHVlKSo2O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtMTtcbiAgICB9XG4gICAgdmFyIG0yO1xuICAgIGlmIChzID09PSAwKXtcbiAgICAgICAgcmV0dXJuIHsncic6IGwsICdnJzogbCwgJ2InOiBsfTtcbiAgICB9XG4gICAgaWYgKGwgPD0gMC41KXtcbiAgICAgICAgbTIgPSBsICogKDErcyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIG0yID0gbCtzLShsKnMpO1xuICAgIH1cbiAgICB2YXIgbTEgPSAyKmwgLSBtMjtcbiAgICByZXR1cm4geydyJzogX3YobTEsIG0yLCBoKygxLzMpKSoyNTUsICdnJzogX3YobTEsIG0yLCBoKSoyNTUsICdiJzogX3YobTEsIG0yLCBoLSgxLzMpKSoyNTV9O1xufTtcbi8qKlxuICogQHBhcmFtICB7bnVtYmVyfSByIFJlZFxuICogQHBhcmFtICB7bnVtYmVyfSBnIEdyZWVuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIgQmx1ZVxuICogQHJldHVybiB7e2g6IG51bWJlciwgczogbnVtYmVyLCBsOiBudW1iZXJ9fVxuICovXG5yZ2JUb0hzbCA9IGZ1bmN0aW9uKHIsIGcsIGIpe1xuICAgIHIgPSByIC8gMjU1O1xuICAgIGcgPSBnIC8gMjU1O1xuICAgIGIgPSBiIC8gMjU1O1xuICAgIHZhciBtYXhjID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgdmFyIG1pbmMgPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICB2YXIgbCA9IChtaW5jK21heGMpLzI7XG4gICAgdmFyIGgsIHM7XG4gICAgaWYgKG1pbmMgPT09IG1heGMpe1xuICAgICAgICByZXR1cm4geydoJzogMCwgJ3MnOiAwLCAnbCc6IGx9O1xuICAgIH1cbiAgICBpZiAobCA8PSAwLjUpe1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAobWF4YyttaW5jKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKDItbWF4Yy1taW5jKTtcbiAgICB9XG4gICAgdmFyIHJjID0gKG1heGMtcikgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgZ2MgPSAobWF4Yy1nKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBiYyA9IChtYXhjLWIpIC8gKG1heGMtbWluYyk7XG4gICAgaWYgKHIgPT09IG1heGMpe1xuICAgICAgICBoID0gYmMtZ2M7XG4gICAgfVxuICAgIGVsc2UgaWYgKGcgPT09IG1heGMpe1xuICAgICAgICBoID0gMityYy1iYztcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgaCA9IDQrZ2MtcmM7XG4gICAgfVxuICAgIGggPSAoaC82KSAlIDE7XG4gICAgaWYgKGggPCAwKXtoKz0xO31cbiAgICByZXR1cm4geydoJzogaCozNjAsICdzJzogcyoxMDAsICdsJzogbCoxMDB9O1xufTtcblxuLyoqXG4gKiBQYXJzZSBhIENTUyBjb2xvciB2YWx1ZSBhbmQgcmV0dXJuIGFuIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2xvciBBIGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyfX0gICByZ2JhIGNvbG9yIG9iamVjdC5cbiAqIEB0aHJvd3Mge0NvbG9yRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIC8vIFRPRE86IEhvdyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGUgaXMgdGhpcz8gSG93IGVmZmljaWVudD9cbiAgICAvLyBNYWtlIGEgdGVtcG9yYXJ5IEhUTUwgZWxlbWVudCBzdHlsZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3Igc3RyaW5nXG4gICAgLy8gdGhlbiBleHRyYWN0IGFuZCBwYXJzZSB0aGUgY29tcHV0ZWQgcmdiKGEpIHZhbHVlLlxuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3I7XG4gICAgdmFyIHJnYmEgPSBkaXYuc3R5bGUuYmFja2dyb3VuZENvbG9yO1xuICAgIC8vIENvbnZlcnQgc3RyaW5nIGluIGZvcm0gJ3JnYlthXShudW0sIG51bSwgbnVtWywgbnVtXSknIHRvIGFycmF5IFsnbnVtJywgJ251bScsICdudW0nWywgJ251bSddXVxuICAgIHJnYmEgPSByZ2JhLnNsaWNlKHJnYmEuaW5kZXhPZignKCcpKzEpLnNsaWNlKDAsLTEpLnJlcGxhY2UoL1xccy9nLCAnJykuc3BsaXQoJywnKTtcbiAgICB2YXIgcmV0dXJuX2NvbG9yID0ge307XG4gICAgdmFyIGNvbG9yX3NwYWNlcyA9IFsncicsICdnJywgJ2InLCAnYSddO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmdiYS5sZW5ndGg7IGkrKyl7XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQocmdiYVtpXSk7IC8vIEFscGhhIHZhbHVlIHdpbGwgYmUgZmxvYXRpbmcgcG9pbnQuXG4gICAgICAgIGlmIChpc05hTih2YWx1ZSkpe1xuICAgICAgICAgICAgdGhyb3cgXCJDb2xvckVycm9yOiBTb21ldGhpbmcgd2VudCB3cm9uZy4gUGVyaGFwcyBcIiArIGNvbG9yICsgXCIgaXMgbm90IGEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm5fY29sb3JbY29sb3Jfc3BhY2VzW2ldXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5fY29sb3I7XG59O1xuLy8gUHJlLXdhcm0gdGhlIGNhY2hlIHdpdGggbmFtZWQgY29sb3JzLCBhcyB0aGVzZSBhcmUgbm90XG4vLyBjb252ZXJ0ZWQgdG8gcmdiIHZhbHVlcyBieSB0aGUgcGFyc2VDb2xvciBmdW5jdGlvbiBhYm92ZS5cbmNhY2hlID0ge1xuICAgIFwiYmxhY2tcIjogeyBcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLCBcImFcIjogMX0sXG4gICAgXCJzaWx2ZXJcIjogeyBcInJcIjogMTkyLCBcImdcIjogMTkyLCBcImJcIjogMTkyLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjc1Mjk0MTE3NjQ3MDU4ODIsIFwiYVwiOiAxfSxcbiAgICBcImdyYXlcIjogeyBcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjUwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcIndoaXRlXCI6IHsgXCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMSwgXCJhXCI6IDF9LFxuICAgIFwibWFyb29uXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcInJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcInB1cnBsZVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcImxpbWVcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcIm9saXZlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwieWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJuYXZ5XCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwiYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwidGVhbFwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwiYXF1YVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJvcmFuZ2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNjUsIFwiYlwiOiAwLCBcImhcIjogMC4xMDc4NDMxMzcyNTQ5MDE5NywgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNTc3Nzc3Nzc3Nzc3Nzc3OCwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImFudGlxdWV3aGl0ZVwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDIzNSwgXCJiXCI6IDIxNSwgXCJoXCI6IDAuMDk1MjM4MDk1MjM4MDk1MTksIFwic1wiOiAwLjc3Nzc3Nzc3Nzc3Nzc3NzksIFwibFwiOiAwLjkxMTc2NDcwNTg4MjM1MjksIFwiYVwiOiAxfSxcbiAgICBcImFxdWFtYXJpbmVcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMTIsIFwiaFwiOiAwLjQ0NDAxMDQxNjY2NjY2NjcsIFwic1wiOiAxLCBcImxcIjogMC43NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJhenVyZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNSwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImJlaWdlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjIwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDAuNTU1NTU1NTU1NTU1NTU2LCBcImxcIjogMC45MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcImJpc3F1ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE5NiwgXCJoXCI6IDAuMDkwMzk1NDgwMjI1OTg4NzEsIFwic1wiOiAxLCBcImxcIjogMC44ODQzMTM3MjU0OTAxOTYsIFwiYVwiOiAxfSxcbiAgICBcImJsYW5jaGVkYWxtb25kXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM1LCBcImJcIjogMjA1LCBcImhcIjogMC4wOTk5OTk5OTk5OTk5OTk5NCwgXCJzXCI6IDEsIFwibFwiOiAwLjkwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiclwiOiAxMzgsIFwiZ1wiOiA0MywgXCJiXCI6IDIyNiwgXCJoXCI6IDAuNzUzMTg3NjEzODQzMzUxNCwgXCJzXCI6IDAuNzU5MzM2MDk5NTg1MDYyMSwgXCJsXCI6IDAuNTI3NDUwOTgwMzkyMTU2OSwgXCJhXCI6IDF9LFxuICAgIFwiYnJvd25cIjoge1wiclwiOiAxNjUsIFwiZ1wiOiA0MiwgXCJiXCI6IDQyLCBcImhcIjogMCwgXCJzXCI6IDAuNTk0MjAyODk4NTUwNzI0NywgXCJsXCI6IDAuNDA1ODgyMzUyOTQxMTc2NDcsIFwiYVwiOiAxfSxcbiAgICBcImJ1cmx5d29vZFwiOiB7XCJyXCI6IDIyMiwgXCJnXCI6IDE4NCwgXCJiXCI6IDEzNSwgXCJoXCI6IDAuMDkzODY5NzMxODAwNzY2MjYsIFwic1wiOiAwLjU2ODYyNzQ1MDk4MDM5MjIsIFwibFwiOiAwLjcsIFwiYVwiOiAxfSxcbiAgICBcImNhZGV0Ymx1ZVwiOiB7XCJyXCI6IDk1LCBcImdcIjogMTU4LCBcImJcIjogMTYwLCBcImhcIjogMC41MDUxMjgyMDUxMjgyMDUxLCBcInNcIjogMC4yNTQ5MDE5NjA3ODQzMTM3LCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDAuMjUwMzI2Nzk3Mzg1NjIwOSwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDEwNSwgXCJiXCI6IDMwLCBcImhcIjogMC4wNjk0NDQ0NDQ0NDQ0NDQ0MywgXCJzXCI6IDAuNzQ5OTk5OTk5OTk5OTk5OSwgXCJsXCI6IDAuNDcwNTg4MjM1Mjk0MTE3NjQsIFwiYVwiOiAxfSxcbiAgICBcImNvcmFsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTI3LCBcImJcIjogODAsIFwiaFwiOiAwLjA0NDc2MTkwNDc2MTkwNDc2LCBcInNcIjogMSwgXCJsXCI6IDAuNjU2ODYyNzQ1MDk4MDM5MiwgXCJhXCI6IDF9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiclwiOiAxMDAsIFwiZ1wiOiAxNDksIFwiYlwiOiAyMzcsIFwiaFwiOiAwLjYwNzA1NTk2MTA3MDU1OTYsIFwic1wiOiAwLjc5MTkwNzUxNDQ1MDg2NzIsIFwibFwiOiAwLjY2MDc4NDMxMzcyNTQ5MDIsIFwiYVwiOiAxfSxcbiAgICBcImNvcm5zaWxrXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ4LCBcImJcIjogMjIwLCBcImhcIjogMC4xMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuOTMxMzcyNTQ5MDE5NjA3OSwgXCJhXCI6IDF9LFxuICAgIFwiY3JpbXNvblwiOiB7XCJyXCI6IDIyMCwgXCJnXCI6IDIwLCBcImJcIjogNjAsIFwiaFwiOiAwLjk2NjY2NjY2NjY2NjY2NjcsIFwic1wiOiAwLjgzMzMzMzMzMzMzMzMzMzUsIFwibFwiOiAwLjQ3MDU4ODIzNTI5NDExNzY0LCBcImFcIjogMX0sXG4gICAgXCJkYXJrYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTM5LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2N5YW5cIjoge1wiclwiOiAwLCBcImdcIjogMTM5LCBcImJcIjogMTM5LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2dvbGRlbnJvZFwiOiB7XCJyXCI6IDE4NCwgXCJnXCI6IDEzNCwgXCJiXCI6IDExLCBcImhcIjogMC4xMTg0OTcxMDk4MjY1ODk2LCBcInNcIjogMC44ODcxNzk0ODcxNzk0ODcyLCBcImxcIjogMC4zODIzNTI5NDExNzY0NzA1NiwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2dyYXlcIjogeyBcInJcIjogMTY5LCBcImdcIjogMTY5LCBcImJcIjogMTY5LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjY2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMDAsIFwiYlwiOiAwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuMTk2MDc4NDMxMzcyNTQ5MDIsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtncmV5XCI6IHsgXCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC42NjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJkYXJra2hha2lcIjoge1wiclwiOiAxODksIFwiZ1wiOiAxODMsIFwiYlwiOiAxMDcsIFwiaFwiOiAwLjE1NDQ3MTU0NDcxNTQ0NzEzLCBcInNcIjogMC4zODMxNzc1NzAwOTM0NTgwNCwgXCJsXCI6IDAuNTgwMzkyMTU2ODYyNzQ1MSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya21hZ2VudGFcIjoge1wiclwiOiAxMzksIFwiZ1wiOiAwLCBcImJcIjogMTM5LCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya29saXZlZ3JlZW5cIjoge1wiclwiOiA4NSwgXCJnXCI6IDEwNywgXCJiXCI6IDQ3LCBcImhcIjogMC4yMjc3Nzc3Nzc3Nzc3Nzc3NywgXCJzXCI6IDAuMzg5NjEwMzg5NjEwMzg5NiwgXCJsXCI6IDAuMzAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya29yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE0MCwgXCJiXCI6IDAsIFwiaFwiOiAwLjA5MTUwMzI2Nzk3Mzg1NjIyLCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJyXCI6IDE1MywgXCJnXCI6IDUwLCBcImJcIjogMjA0LCBcImhcIjogMC43NzgxMzg1MjgxMzg1MjgxLCBcInNcIjogMC42MDYyOTkyMTI1OTg0MjUyLCBcImxcIjogMC40OTgwMzkyMTU2ODYyNzQ1LCBcImFcIjogMX0sXG4gICAgXCJkYXJrcmVkXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMSwgXCJsXCI6IDAuMjcyNTQ5MDE5NjA3ODQzMSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJyXCI6IDIzMywgXCJnXCI6IDE1MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDAuMDQyMDQyMDQyMDQyMDQyMDQsIFwic1wiOiAwLjcxNjEyOTAzMjI1ODA2NDMsIFwibFwiOiAwLjY5NjA3ODQzMTM3MjU0OSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcInJcIjogMTQzLCBcImdcIjogMTg4LCBcImJcIjogMTQzLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC4yNTEzOTY2NDgwNDQ2OTI4LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2xhdGVibHVlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiA2MSwgXCJiXCI6IDEzOSwgXCJoXCI6IDAuNjkwMTcwOTQwMTcwOTQsIFwic1wiOiAwLjM4OTk5OTk5OTk5OTk5OTksIFwibFwiOiAwLjM5MjE1Njg2Mjc0NTA5ODAzLCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMC41LCBcInNcIjogMC4yNTM5NjgyNTM5NjgyNTM5NSwgXCJsXCI6IDAuMjQ3MDU4ODIzNTI5NDExNzgsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtzbGF0ZWdyZXlcIjoge1wiclwiOiA0NywgXCJnXCI6IDc5LCBcImJcIjogNzksIFwiaFwiOiAwLjUsIFwic1wiOiAwLjI1Mzk2ODI1Mzk2ODI1Mzk1LCBcImxcIjogMC4yNDcwNTg4MjM1Mjk0MTE3OCwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3R1cnF1b2lzZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMDksIFwiaFwiOiAwLjUwMjM5MjM0NDQ5NzYwNzYsIFwic1wiOiAxLCBcImxcIjogMC40MDk4MDM5MjE1Njg2Mjc0NCwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3Zpb2xldFwiOiB7XCJyXCI6IDE0OCwgXCJnXCI6IDAsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLjc4MzU3MDMwMDE1Nzk3NzgsIFwic1wiOiAxLCBcImxcIjogMC40MTM3MjU0OTAxOTYwNzg0LCBcImFcIjogMX0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIwLCBcImJcIjogMTQ3LCBcImhcIjogMC45MDk5MjkwNzgwMTQxODQ0LCBcInNcIjogMSwgXCJsXCI6IDAuNTM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwiZGVlcHNreWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMTkxLCBcImJcIjogMjU1LCBcImhcIjogMC41NDE4MzAwNjUzNTk0NzcxLCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZGltZ3JheVwiOiB7IFwiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNDExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwiZGltZ3JleVwiOiB7IFwiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNDExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJyXCI6IDMwLCBcImdcIjogMTQ0LCBcImJcIjogMjU1LCBcImhcIjogMC41ODIyMjIyMjIyMjIyMjIyLCBcInNcIjogMSwgXCJsXCI6IDAuNTU4ODIzNTI5NDExNzY0NywgXCJhXCI6IDF9LFxuICAgIFwiZmlyZWJyaWNrXCI6IHtcInJcIjogMTc4LCBcImdcIjogMzQsIFwiYlwiOiAzNCwgXCJoXCI6IDAsIFwic1wiOiAwLjY3OTI0NTI4MzAxODg2OCwgXCJsXCI6IDAuNDE1Njg2Mjc0NTA5ODAzOSwgXCJhXCI6IDF9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNDAsIFwiaFwiOiAwLjExMTExMTExMTExMTExMTAxLCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiclwiOiAzNCwgXCJnXCI6IDEzOSwgXCJiXCI6IDM0LCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC42MDY5MzY0MTYxODQ5NzEyLCBcImxcIjogMC4zMzkyMTU2ODYyNzQ1MDk3NiwgXCJhXCI6IDF9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHsgXCJyXCI6IDIyMCwgXCJnXCI6IDIyMCwgXCJiXCI6IDIyMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC44NjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcInJcIjogMjQ4LCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuOTg2Mjc0NTA5ODAzOTIxNiwgXCJhXCI6IDF9LFxuICAgIFwiZ29sZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxNSwgXCJiXCI6IDAsIFwiaFwiOiAwLjE0MDUyMjg3NTgxNjk5MzQ2LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZ29sZGVucm9kXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTY1LCBcImJcIjogMzIsIFwiaFwiOiAwLjExOTE3NTYyNzI0MDE0MzM3LCBcInNcIjogMC43NDQsIFwibFwiOiAwLjQ5MDE5NjA3ODQzMTM3MjUzLCBcImFcIjogMX0sXG4gICAgXCJncmVlbnllbGxvd1wiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDI1NSwgXCJiXCI6IDQ3LCBcImhcIjogMC4yMzIzNzE3OTQ4NzE3OTQ4NSwgXCJzXCI6IDEsIFwibFwiOiAwLjU5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwiZ3JleVwiOiB7IFwiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJob3RwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTA1LCBcImJcIjogMTgwLCBcImhcIjogMC45MTY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuNzA1ODgyMzUyOTQxMTc2NCwgXCJhXCI6IDF9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcInJcIjogMjA1LCBcImdcIjogOTIsIFwiYlwiOiA5MiwgXCJoXCI6IDAsIFwic1wiOiAwLjUzMDUxNjQzMTkyNDg4MjcsIFwibFwiOiAwLjU4MjM1Mjk0MTE3NjQ3MDYsIFwiYVwiOiAxfSxcbiAgICBcImluZGlnb1wiOiB7XCJyXCI6IDc1LCBcImdcIjogMCwgXCJiXCI6IDEzMCwgXCJoXCI6IDAuNzYyODIwNTEyODIwNTEyOCwgXCJzXCI6IDEsIFwibFwiOiAwLjI1NDkwMTk2MDc4NDMxMzcsIFwiYVwiOiAxfSxcbiAgICBcIml2b3J5XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImtoYWtpXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjMwLCBcImJcIjogMTQwLCBcImhcIjogMC4xNSwgXCJzXCI6IDAuNzY5MjMwNzY5MjMwNzY5MiwgXCJsXCI6IDAuNzQ1MDk4MDM5MjE1Njg2MywgXCJhXCI6IDF9LFxuICAgIFwibGF2ZW5kZXJcIjoge1wiclwiOiAyMzAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAyNTAsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwibFwiOiAwLjk0MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcImxhdmVuZGVyYmx1c2hcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyNDUsIFwiaFwiOiAwLjk0NDQ0NDQ0NDQ0NDQ0NDMsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiclwiOiAxMjQsIFwiZ1wiOiAyNTIsIFwiYlwiOiAwLCBcImhcIjogMC4yNTEzMjI3NTEzMjI3NTEzNCwgXCJzXCI6IDEsIFwibFwiOiAwLjQ5NDExNzY0NzA1ODgyMzU1LCBcImFcIjogMX0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMDUsIFwiaFwiOiAwLjE0OTk5OTk5OTk5OTk5OTk3LCBcInNcIjogMSwgXCJsXCI6IDAuOTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcInJcIjogMTczLCBcImdcIjogMjE2LCBcImJcIjogMjMwLCBcImhcIjogMC41NDA5MzU2NzI1MTQ2MTk4LCBcInNcIjogMC41MzI3MTAyODAzNzM4MzE2LCBcImxcIjogMC43OTAxOTYwNzg0MzEzNzI2LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGNvcmFsXCI6IHtcInJcIjogMjQwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAuNzg4NzMyMzk0MzY2MTk3MSwgXCJsXCI6IDAuNzIxNTY4NjI3NDUwOTgwNCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRjeWFuXCI6IHtcInJcIjogMjI0LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuOTM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMTAsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMC44MDAwMDAwMDAwMDAwMDAyLCBcImxcIjogMC45MDE5NjA3ODQzMTM3MjU0LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGdyYXlcIjogeyBcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjgyNzQ1MDk4MDM5MjE1NjgsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Z3JlZW5cIjoge1wiclwiOiAxNDQsIFwiZ1wiOiAyMzgsIFwiYlwiOiAxNDQsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjczNDM3NSwgXCJsXCI6IDAuNzQ5MDE5NjA3ODQzMTM3MywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRncmV5XCI6IHsgXCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC44Mjc0NTA5ODAzOTIxNTY4LCBcImFcIjogMX0sXG4gICAgXCJsaWdodHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxODIsIFwiYlwiOiAxOTMsIFwiaFwiOiAwLjk3NDg4NTg0NDc0ODg1ODQsIFwic1wiOiAxLCBcImxcIjogMC44NTY4NjI3NDUwOTgwMzkzLCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNhbG1vblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDAuMDQ3NjE5MDQ3NjE5MDQ3NTk2LCBcInNcIjogMSwgXCJsXCI6IDAuNzM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzZWFncmVlblwiOiB7XCJyXCI6IDMyLCBcImdcIjogMTc4LCBcImJcIjogMTcwLCBcImhcIjogMC40OTA4Njc1Nzk5MDg2NzU3NCwgXCJzXCI6IDAuNjk1MjM4MDk1MjM4MDk1MiwgXCJsXCI6IDAuNDExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRza3libHVlXCI6IHtcInJcIjogMTM1LCBcImdcIjogMjA2LCBcImJcIjogMjUwLCBcImhcIjogMC41NjM3NjgxMTU5NDIwMjg5LCBcInNcIjogMC45MiwgXCJsXCI6IDAuNzU0OTAxOTYwNzg0MzEzNywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjE0Mjg1NzE0Mjg1NzE0Mjg1LCBcImxcIjogMC41MzMzMzMzMzMzMzMzMzMzLCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDAuNTgzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuMTQyODU3MTQyODU3MTQyODUsIFwibFwiOiAwLjUzMzMzMzMzMzMzMzMzMzMsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMTk2LCBcImJcIjogMjIyLCBcImhcIjogMC41OTQyMDI4OTg1NTA3MjQ2LCBcInNcIjogMC40MTA3MTQyODU3MTQyODU3NSwgXCJsXCI6IDAuNzgwMzkyMTU2ODYyNzQ1MSwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMjQsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuOTM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwibGltZWdyZWVuXCI6IHtcInJcIjogNTAsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuNjA3ODQzMTM3MjU0OTAyLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJsaW5lblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI0MCwgXCJiXCI6IDIzMCwgXCJoXCI6IDAuMDgzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwibFwiOiAwLjk0MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiclwiOiAxMDIsIFwiZ1wiOiAyMDUsIFwiYlwiOiAxNzAsIFwiaFwiOiAwLjQ0MzM2NTY5NTc5Mjg4MDIsIFwic1wiOiAwLjUwNzM4OTE2MjU2MTU3NjQsIFwibFwiOiAwLjYwMTk2MDc4NDMxMzcyNTYsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDIwNSwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjQwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJyXCI6IDE4NiwgXCJnXCI6IDg1LCBcImJcIjogMjExLCBcImhcIjogMC44MDAyNjQ1NTAyNjQ1NTAyLCBcInNcIjogMC41ODg3ODUwNDY3Mjg5NzE4LCBcImxcIjogMC41ODAzOTIxNTY4NjI3NDUsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXB1cnBsZVwiOiB7XCJyXCI6IDE0NywgXCJnXCI6IDExMiwgXCJiXCI6IDIxOSwgXCJoXCI6IDAuNzIxMTgzODAwNjIzMDUzLCBcInNcIjogMC41OTc3NjUzNjMxMjg0OTE2LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzcyLCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1zZWFncmVlblwiOiB7XCJyXCI6IDYwLCBcImdcIjogMTc5LCBcImJcIjogMTEzLCBcImhcIjogMC40MDc1NjMwMjUyMTAwODQxLCBcInNcIjogMC40OTc5MDc5NDk3OTA3OTQ5NSwgXCJsXCI6IDAuNDY4NjI3NDUwOTgwMzkyMTYsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEyMywgXCJnXCI6IDEwNCwgXCJiXCI6IDIzOCwgXCJoXCI6IDAuNjkwMjk4NTA3NDYyNjg2NSwgXCJzXCI6IDAuNzk3NjE5MDQ3NjE5MDQ3NywgXCJsXCI6IDAuNjcwNTg4MjM1Mjk0MTE3NywgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjUwLCBcImJcIjogMTU0LCBcImhcIjogMC40MzYsIFwic1wiOiAxLCBcImxcIjogMC40OTAxOTYwNzg0MzEzNzI1MywgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiAyMDksIFwiYlwiOiAyMDQsIFwiaFwiOiAwLjQ5MzkxNzI3NDkzOTE3Mjc2LCBcInNcIjogMC41OTgyNTMyNzUxMDkxNzAzLCBcImxcIjogMC41NTA5ODAzOTIxNTY4NjI4LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiclwiOiAxOTksIFwiZ1wiOiAyMSwgXCJiXCI6IDEzMywgXCJoXCI6IDAuODk1MTMxMDg2MTQyMzIyMSwgXCJzXCI6IDAuODA5MDkwOTA5MDkwOTA5LCBcImxcIjogMC40MzEzNzI1NDkwMTk2MDc4NiwgXCJhXCI6IDF9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcInJcIjogMjUsIFwiZ1wiOiAyNSwgXCJiXCI6IDExMiwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDAuNjM1MDM2NDk2MzUwMzY1LCBcImxcIjogMC4yNjg2Mjc0NTA5ODAzOTIxNSwgXCJhXCI6IDF9LFxuICAgIFwibWludGNyZWFtXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjU1LCBcImJcIjogMjUwLCBcImhcIjogMC40MTY2NjY2NjY2NjY2NjY0NiwgXCJzXCI6IDEsIFwibFwiOiAwLjk4MDM5MjE1Njg2Mjc0NTIsIFwiYVwiOiAxfSxcbiAgICBcIm1pc3R5cm9zZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDIyNSwgXCJoXCI6IDAuMDE2NjY2NjY2NjY2NjY2NzU3LCBcInNcIjogMSwgXCJsXCI6IDAuOTQxMTc2NDcwNTg4MjM1MywgXCJhXCI6IDF9LFxuICAgIFwibW9jY2FzaW5cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxODEsIFwiaFwiOiAwLjEwNTg1NTg1NTg1NTg1NTg4LCBcInNcIjogMSwgXCJsXCI6IDAuODU0OTAxOTYwNzg0MzEzOCwgXCJhXCI6IDF9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzMsIFwiaFwiOiAwLjA5OTU5MzQ5NTkzNDk1OTM2LCBcInNcIjogMSwgXCJsXCI6IDAuODM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJyXCI6IDI1MywgXCJnXCI6IDI0NSwgXCJiXCI6IDIzMCwgXCJoXCI6IDAuMTA4Njk1NjUyMTczOTEzMDQsIFwic1wiOiAwLjg1MTg1MTg1MTg1MTg1MjMsIFwibFwiOiAwLjk0NzA1ODgyMzUyOTQxMTcsIFwiYVwiOiAxfSxcbiAgICBcIm9saXZlZHJhYlwiOiB7XCJyXCI6IDEwNywgXCJnXCI6IDE0MiwgXCJiXCI6IDM1LCBcImhcIjogMC4yMjExODM4MDA2MjMwNTI5NiwgXCJzXCI6IDAuNjA0NTE5Nzc0MDExMjk5NCwgXCJsXCI6IDAuMzQ3MDU4ODIzNTI5NDExNzUsIFwiYVwiOiAxfSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDY5LCBcImJcIjogMCwgXCJoXCI6IDAuMDQ1MDk4MDM5MjE1Njg2MjYsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJvcmNoaWRcIjoge1wiclwiOiAyMTgsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTQsIFwiaFwiOiAwLjgzOTYyMjY0MTUwOTQzMzksIFwic1wiOiAwLjU4ODg4ODg4ODg4ODg4ODksIFwibFwiOiAwLjY0NzA1ODgyMzUyOTQxMTcsIFwiYVwiOiAxfSxcbiAgICBcInBhbGVnb2xkZW5yb2RcIjoge1wiclwiOiAyMzgsIFwiZ1wiOiAyMzIsIFwiYlwiOiAxNzAsIFwiaFwiOiAwLjE1MTk2MDc4NDMxMzcyNTQ4LCBcInNcIjogMC42NjY2NjY2NjY2NjY2NjY3LCBcImxcIjogMC44LCBcImFcIjogMX0sXG4gICAgXCJwYWxlZ3JlZW5cIjoge1wiclwiOiAxNTIsIFwiZ1wiOiAyNTEsIFwiYlwiOiAxNTIsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjkyNTIzMzY0NDg1OTgxMzEsIFwibFwiOiAwLjc5MDE5NjA3ODQzMTM3MjUsIFwiYVwiOiAxfSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiclwiOiAxNzUsIFwiZ1wiOiAyMzgsIFwiYlwiOiAyMzgsIFwiaFwiOiAwLjUsIFwic1wiOiAwLjY0OTQ4NDUzNjA4MjQ3NDMsIFwibFwiOiAwLjgwOTgwMzkyMTU2ODYyNzUsIFwiYVwiOiAxfSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiclwiOiAyMTksIFwiZ1wiOiAxMTIsIFwiYlwiOiAxNDcsIFwiaFwiOiAwLjk0NTQ4Mjg2NjA0MzYxMzgsIFwic1wiOiAwLjU5Nzc2NTM2MzEyODQ5MTYsIFwibFwiOiAwLjY0OTAxOTYwNzg0MzEzNzIsIFwiYVwiOiAxfSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzksIFwiYlwiOiAyMTMsIFwiaFwiOiAwLjEwMzE3NDYwMzE3NDYwMzE1LCBcInNcIjogMSwgXCJsXCI6IDAuOTE3NjQ3MDU4ODIzNTI5NSwgXCJhXCI6IDF9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE4LCBcImJcIjogMTg1LCBcImhcIjogMC4wNzg1NzE0Mjg1NzE0Mjg1NiwgXCJzXCI6IDEsIFwibFwiOiAwLjg2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcInBlcnVcIjoge1wiclwiOiAyMDUsIFwiZ1wiOiAxMzMsIFwiYlwiOiA2MywgXCJoXCI6IDAuMDgyMTU5NjI0NDEzMTQ1NTUsIFwic1wiOiAwLjU4Njc3Njg1OTUwNDEzMjMsIFwibFwiOiAwLjUyNTQ5MDE5NjA3ODQzMTQsIFwiYVwiOiAxfSxcbiAgICBcInBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxOTIsIFwiYlwiOiAyMDMsIFwiaFwiOiAwLjk3MDg5OTQ3MDg5OTQ3MDksIFwic1wiOiAxLCBcImxcIjogMC44NzY0NzA1ODgyMzUyOTQxLCBcImFcIjogMX0sXG4gICAgXCJwbHVtXCI6IHtcInJcIjogMjIxLCBcImdcIjogMTYwLCBcImJcIjogMjIxLCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC40NzI4NjgyMTcwNTQyNjM3LCBcImxcIjogMC43NDcwNTg4MjM1Mjk0MTE4LCBcImFcIjogMX0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMjI0LCBcImJcIjogMjMwLCBcImhcIjogMC41MTg1MTg1MTg1MTg1MTg2LCBcInNcIjogMC41MTkyMzA3NjkyMzA3NjkyLCBcImxcIjogMC43OTYwNzg0MzEzNzI1NDkxLCBcImFcIjogMX0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiclwiOiAxODgsIFwiZ1wiOiAxNDMsIFwiYlwiOiAxNDMsIFwiaFwiOiAwLCBcInNcIjogMC4yNTEzOTY2NDgwNDQ2OTI4LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiclwiOiA2NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDIyNSwgXCJoXCI6IDAuNjI1LCBcInNcIjogMC43MjcyNzI3MjcyNzI3MjcyLCBcImxcIjogMC41Njg2Mjc0NTA5ODAzOTIxLCBcImFcIjogMX0sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDY5LCBcImJcIjogMTksIFwiaFwiOiAwLjA2OTQ0NDQ0NDQ0NDQ0NDQzLCBcInNcIjogMC43NTk0OTM2NzA4ODYwNzYsIFwibFwiOiAwLjMwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcInNhbG1vblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDExNCwgXCJoXCI6IDAuMDE3MTU2ODYyNzQ1MDk4MDE2LCBcInNcIjogMC45MzE1MDY4NDkzMTUwNjgzLCBcImxcIjogMC43MTM3MjU0OTAxOTYwNzg0LCBcImFcIjogMX0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcInJcIjogMjQ0LCBcImdcIjogMTY0LCBcImJcIjogOTYsIFwiaFwiOiAwLjA3NjU3NjU3NjU3NjU3NjU5LCBcInNcIjogMC44NzA1ODgyMzUyOTQxMTc5LCBcImxcIjogMC42NjY2NjY2NjY2NjY2NjY3LCBcImFcIjogMX0sXG4gICAgXCJzZWFncmVlblwiOiB7XCJyXCI6IDQ2LCBcImdcIjogMTM5LCBcImJcIjogODcsIFwiaFwiOiAwLjQwNjgxMDAzNTg0MjI5MzksIFwic1wiOiAwLjUwMjcwMjcwMjcwMjcwMjYsIFwibFwiOiAwLjM2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcInNlYXNoZWxsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ1LCBcImJcIjogMjM4LCBcImhcIjogMC4wNjg2Mjc0NTA5ODAzOTIyLCBcInNcIjogMSwgXCJsXCI6IDAuOTY2NjY2NjY2NjY2NjY2NywgXCJhXCI6IDF9LFxuICAgIFwic2llbm5hXCI6IHtcInJcIjogMTYwLCBcImdcIjogODIsIFwiYlwiOiA0NSwgXCJoXCI6IDAuMDUzNjIzMTg4NDA1Nzk3MTA2LCBcInNcIjogMC41NjA5NzU2MDk3NTYwOTc1LCBcImxcIjogMC40MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJza3libHVlXCI6IHtcInJcIjogMTM1LCBcImdcIjogMjA2LCBcImJcIjogMjM1LCBcImhcIjogMC41NDgzMzMzMzMzMzMzMzMzLCBcInNcIjogMC43MTQyODU3MTQyODU3MTQsIFwibFwiOiAwLjcyNTQ5MDE5NjA3ODQzMTMsIFwiYVwiOiAxfSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEwNiwgXCJnXCI6IDkwLCBcImJcIjogMjA1LCBcImhcIjogMC42ODk4NTUwNzI0NjM3NjgxLCBcInNcIjogMC41MzQ4ODM3MjA5MzAyMzI2LCBcImxcIjogMC41Nzg0MzEzNzI1NDkwMTk3LCBcImFcIjogMX0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjEyNTk4NDI1MTk2ODUwMzk0LCBcImxcIjogMC41MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJzbGF0ZWdyZXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjEyNTk4NDI1MTk2ODUwMzk0LCBcImxcIjogMC41MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJzbm93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjUwLCBcImhcIjogMCwgXCJzXCI6IDEsIFwibFwiOiAwLjk5MDE5NjA3ODQzMTM3MjYsIFwiYVwiOiAxfSxcbiAgICBcInNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDEyNywgXCJoXCI6IDAuNDE2MzM5ODY5MjgxMDQ1NzcsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJzdGVlbGJsdWVcIjoge1wiclwiOiA3MCwgXCJnXCI6IDEzMCwgXCJiXCI6IDE4MCwgXCJoXCI6IDAuNTc1NzU3NTc1NzU3NTc1OCwgXCJzXCI6IDAuNDQsIFwibFwiOiAwLjQ5MDE5NjA3ODQzMTM3MjYsIFwiYVwiOiAxfSxcbiAgICBcInRhblwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDE4MCwgXCJiXCI6IDE0MCwgXCJoXCI6IDAuMDk1MjM4MDk1MjM4MDk1MjcsIFwic1wiOiAwLjQzNzQ5OTk5OTk5OTk5OTksIFwibFwiOiAwLjY4NjI3NDUwOTgwMzkyMTYsIFwiYVwiOiAxfSxcbiAgICBcInRoaXN0bGVcIjoge1wiclwiOiAyMTYsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyMTYsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjI0MjcxODQ0NjYwMTk0MTc4LCBcImxcIjogMC43OTgwMzkyMTU2ODYyNzQ2LCBcImFcIjogMX0sXG4gICAgXCJ0b21hdG9cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA5OSwgXCJiXCI6IDcxLCBcImhcIjogMC4wMjUzNjIzMTg4NDA1Nzk2OTQsIFwic1wiOiAxLCBcImxcIjogMC42MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJ0dXJxdW9pc2VcIjoge1wiclwiOiA2NCwgXCJnXCI6IDIyNCwgXCJiXCI6IDIwOCwgXCJoXCI6IDAuNDgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjcyMDcyMDcyMDcyMDcyMDcsIFwibFwiOiAwLjU2NDcwNTg4MjM1Mjk0MTIsIFwiYVwiOiAxfSxcbiAgICBcInZpb2xldFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDEzMCwgXCJiXCI6IDIzOCwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuNzYwNTYzMzgwMjgxNjkwMiwgXCJsXCI6IDAuNzIxNTY4NjI3NDUwOTgwNCwgXCJhXCI6IDF9LFxuICAgIFwid2hlYXRcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzksIFwiaFwiOiAwLjEwODU4NTg1ODU4NTg1ODYsIFwic1wiOiAwLjc2NzQ0MTg2MDQ2NTExNjgsIFwibFwiOiAwLjgzMTM3MjU0OTAxOTYwNzgsIFwiYVwiOiAxfSxcbiAgICBcIndoaXRlc21va2VcIjogeyBcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjQ1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjk2MDc4NDMxMzcyNTQ5MDIsIFwiYVwiOiAxfSxcbiAgICBcInllbGxvd2dyZWVuXCI6IHtcInJcIjogMTU0LCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiAwLjIyMTUwNTM3NjM0NDA4NjA0LCBcInNcIjogMC42MDc4NDMxMzcyNTQ5MDIsIFwibFwiOiAwLjUsIFwiYVwiOiAxfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjsiLCIvKiogXG4gKiBAY29uc3RhbnRcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgbnVtYmVyPn0gXG4gKi9cbnZhciBLRVlDT0RFUyA9IHtcbiAgICAnYmFja3NwYWNlJyA6IDgsXG4gICAgJ3RhYicgOiA5LFxuICAgICdlbnRlcicgOiAxMyxcbiAgICAnc2hpZnQnIDogMTYsXG4gICAgJ2N0cmwnIDogMTcsXG4gICAgJ2FsdCcgOiAxOCxcbiAgICAncGF1c2VfYnJlYWsnIDogMTksXG4gICAgJ2NhcHNfbG9jaycgOiAyMCxcbiAgICAnZXNjYXBlJyA6IDI3LFxuICAgICdwYWdlX3VwJyA6IDMzLFxuICAgICdwYWdlIGRvd24nIDogMzQsXG4gICAgJ2VuZCcgOiAzNSxcbiAgICAnaG9tZScgOiAzNixcbiAgICAnbGVmdF9hcnJvdycgOiAzNyxcbiAgICAndXBfYXJyb3cnIDogMzgsXG4gICAgJ3JpZ2h0X2Fycm93JyA6IDM5LFxuICAgICdkb3duX2Fycm93JyA6IDQwLFxuICAgICdpbnNlcnQnIDogNDUsXG4gICAgJ2RlbGV0ZScgOiA0NixcbiAgICAnMCcgOiA0OCxcbiAgICAnMScgOiA0OSxcbiAgICAnMicgOiA1MCxcbiAgICAnMycgOiA1MSxcbiAgICAnNCcgOiA1MixcbiAgICAnNScgOiA1MyxcbiAgICAnNicgOiA1NCxcbiAgICAnNycgOiA1NSxcbiAgICAnOCcgOiA1NixcbiAgICAnOScgOiA1NyxcbiAgICAnYScgOiA2NSxcbiAgICAnYicgOiA2NixcbiAgICAnYycgOiA2NyxcbiAgICAnZCcgOiA2OCxcbiAgICAnZScgOiA2OSxcbiAgICAnZicgOiA3MCxcbiAgICAnZycgOiA3MSxcbiAgICAnaCcgOiA3MixcbiAgICAnaScgOiA3MyxcbiAgICAnaicgOiA3NCxcbiAgICAnaycgOiA3NSxcbiAgICAnbCcgOiA3NixcbiAgICAnbScgOiA3NyxcbiAgICAnbicgOiA3OCxcbiAgICAnbycgOiA3OSxcbiAgICAncCcgOiA4MCxcbiAgICAncScgOiA4MSxcbiAgICAncicgOiA4MixcbiAgICAncycgOiA4MyxcbiAgICAndCcgOiA4NCxcbiAgICAndScgOiA4NSxcbiAgICAndicgOiA4NixcbiAgICAndycgOiA4NyxcbiAgICAneCcgOiA4OCxcbiAgICAneScgOiA4OSxcbiAgICAneicgOiA5MCxcbiAgICAnbGVmdF93aW5kb3cga2V5JyA6IDkxLFxuICAgICdyaWdodF93aW5kb3cga2V5JyA6IDkyLFxuICAgICdzZWxlY3Rfa2V5JyA6IDkzLFxuICAgICdudW1wYWQgMCcgOiA5NixcbiAgICAnbnVtcGFkIDEnIDogOTcsXG4gICAgJ251bXBhZCAyJyA6IDk4LFxuICAgICdudW1wYWQgMycgOiA5OSxcbiAgICAnbnVtcGFkIDQnIDogMTAwLFxuICAgICdudW1wYWQgNScgOiAxMDEsXG4gICAgJ251bXBhZCA2JyA6IDEwMixcbiAgICAnbnVtcGFkIDcnIDogMTAzLFxuICAgICdudW1wYWQgOCcgOiAxMDQsXG4gICAgJ251bXBhZCA5JyA6IDEwNSxcbiAgICAnbXVsdGlwbHknIDogMTA2LFxuICAgICdhZGQnIDogMTA3LFxuICAgICdzdWJ0cmFjdCcgOiAxMDksXG4gICAgJ2RlY2ltYWwgcG9pbnQnIDogMTEwLFxuICAgICdkaXZpZGUnIDogMTExLFxuICAgICdmMScgOiAxMTIsXG4gICAgJ2YyJyA6IDExMyxcbiAgICAnZjMnIDogMTE0LFxuICAgICdmNCcgOiAxMTUsXG4gICAgJ2Y1JyA6IDExNixcbiAgICAnZjYnIDogMTE3LFxuICAgICdmNycgOiAxMTgsXG4gICAgJ2Y4JyA6IDExOSxcbiAgICAnZjknIDogMTIwLFxuICAgICdmMTAnIDogMTIxLFxuICAgICdmMTEnIDogMTIyLFxuICAgICdmMTInIDogMTIzLFxuICAgICdudW1fbG9jaycgOiAxNDQsXG4gICAgJ3Njcm9sbF9sb2NrJyA6IDE0NSxcbiAgICAnc2VtaV9jb2xvbicgOiAxODYsXG4gICAgJ2VxdWFsX3NpZ24nIDogMTg3LFxuICAgICdjb21tYScgOiAxODgsXG4gICAgJ2Rhc2gnIDogMTg5LFxuICAgICdwZXJpb2QnIDogMTkwLFxuICAgICdmb3J3YXJkX3NsYXNoJyA6IDE5MSxcbiAgICAnZ3JhdmVfYWNjZW50JyA6IDE5MixcbiAgICAnb3Blbl9icmFja2V0JyA6IDIxOSxcbiAgICAnYmFja3NsYXNoJyA6IDIyMCxcbiAgICAnY2xvc2VicmFja2V0JyA6IDIyMSxcbiAgICAnc2luZ2xlX3F1b3RlJyA6IDIyMlxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBLRVlDT0RFUzsiLCJyZXF1aXJlKCcuLy4uL3Rlc3RzL2hlbHBlcnMuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZGF0YS9jb2xvcnMuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZW5naW5lL2NhbWVyYS5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9lbmdpbmUvc2NlbmUuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC9mYWNlLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvbWF0cml4LmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvbWVzaC5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL3ZlY3Rvci5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy91dGlsaXRpZXMvY29sb3IuanMnKTtcbiIsInZhciBjb2xvcmxpc3QgPSBbXG4gICAgWydhbGljZWJsdWUnLCAnI2YwZjhmZicsIFsyNDAsIDI0OCwgMjU1XV0sXG4gICAgWydhbnRpcXVld2hpdGUnLCAnI2ZhZWJkNycsIFsyNTAsIDIzNSwgMjE1XV0sXG4gICAgWydhcXVhJywgJyMwMGZmZmYnLCBbMCwgMjU1LCAyNTVdXSxcbiAgICBbJ2FxdWFtYXJpbmUnLCAnIzdmZmZkNCcsIFsxMjcsIDI1NSwgMjEyXV0sXG4gICAgWydhenVyZScsICcjZjBmZmZmJywgWzI0MCwgMjU1LCAyNTVdXSxcbiAgICBbJ2JlaWdlJywgJyNmNWY1ZGMnLCBbMjQ1LCAyNDUsIDIyMF1dLFxuICAgIFsnYmlzcXVlJywgJyNmZmU0YzQnLCBbMjU1LCAyMjgsIDE5Nl1dLFxuICAgIFsnYmxhY2snLCAnIzAwMDAwMCcsIFswLCAwLCAwXV0sXG4gICAgWydibGFuY2hlZGFsbW9uZCcsICcjZmZlYmNkJywgWzI1NSwgMjM1LCAyMDVdXSxcbiAgICBbJ2JsdWUnLCAnIzAwMDBmZicsIFswLCAwLCAyNTVdXSxcbiAgICBbJ2JsdWV2aW9sZXQnLCAnIzhhMmJlMicsIFsxMzgsIDQzLCAyMjZdXSxcbiAgICBbJ2Jyb3duJywgJyNhNTJhMmEnLCBbMTY1LCA0MiwgNDJdXSxcbiAgICBbJ2J1cmx5d29vZCcsICcjZGViODg3JywgWzIyMiwgMTg0LCAxMzVdXSxcbiAgICBbJ2NhZGV0Ymx1ZScsICcjNWY5ZWEwJywgWzk1LCAxNTgsIDE2MF1dLFxuICAgIFsnY2hhcnRyZXVzZScsICcjN2ZmZjAwJywgWzEyNywgMjU1LCAwXV0sXG4gICAgWydjaG9jb2xhdGUnLCAnI2QyNjkxZScsIFsyMTAsIDEwNSwgMzBdXSxcbiAgICBbJ2NvcmFsJywgJyNmZjdmNTAnLCBbMjU1LCAxMjcsIDgwXV0sXG4gICAgWydjb3JuZmxvd2VyYmx1ZScsICcjNjQ5NWVkJywgWzEwMCwgMTQ5LCAyMzddXSxcbiAgICBbJ2Nvcm5zaWxrJywgJyNmZmY4ZGMnLCBbMjU1LCAyNDgsIDIyMF1dLFxuICAgIFsnY3JpbXNvbicsICcjZGMxNDNjJywgWzIyMCwgMjAsIDYwXV0sXG4gICAgWydjeWFuJywgJyMwMGZmZmYnLCBbMCwgMjU1LCAyNTVdXSxcbiAgICBbJ2RhcmtibHVlJywgJyMwMDAwOGInLCBbMCwgMCwgMTM5XV0sXG4gICAgWydkYXJrY3lhbicsICcjMDA4YjhiJywgWzAsIDEzOSwgMTM5XV0sXG4gICAgWydkYXJrZ29sZGVucm9kJywgJyNiODg2MGInLCBbMTg0LCAxMzQsIDExXV0sXG4gICAgWydkYXJrZ3JheScsICcjYTlhOWE5JywgWzE2OSwgMTY5LCAxNjldXSxcbiAgICBbJ2RhcmtncmVlbicsICcjMDA2NDAwJywgWzAsIDEwMCwgMF1dLFxuICAgIFsnZGFya2dyZXknLCAnI2E5YTlhOScsIFsxNjksIDE2OSwgMTY5XV0sXG4gICAgWydkYXJra2hha2knLCAnI2JkYjc2YicsIFsxODksIDE4MywgMTA3XV0sXG4gICAgWydkYXJrbWFnZW50YScsICcjOGIwMDhiJywgWzEzOSwgMCwgMTM5XV0sXG4gICAgWydkYXJrb2xpdmVncmVlbicsICcjNTU2YjJmJywgWzg1LCAxMDcsIDQ3XV0sXG4gICAgWydkYXJrb3JhbmdlJywgJyNmZjhjMDAnLCBbMjU1LCAxNDAsIDBdXSxcbiAgICBbJ2RhcmtvcmNoaWQnLCAnIzk5MzJjYycsIFsxNTMsIDUwLCAyMDRdXSxcbiAgICBbJ2RhcmtyZWQnLCAnIzhiMDAwMCcsIFsxMzksIDAsIDBdXSxcbiAgICBbJ2RhcmtzYWxtb24nLCAnI2U5OTY3YScsIFsyMzMsIDE1MCwgMTIyXV0sXG4gICAgWydkYXJrc2VhZ3JlZW4nLCAnIzhmYmM4ZicsIFsxNDMsIDE4OCwgMTQzXV0sXG4gICAgWydkYXJrc2xhdGVibHVlJywgJyM0ODNkOGInLCBbNzIsIDYxLCAxMzldXSxcbiAgICBbJ2RhcmtzbGF0ZWdyYXknLCAnIzJmNGY0ZicsIFs0NywgNzksIDc5XV0sXG4gICAgWydkYXJrc2xhdGVncmV5JywgJyMyZjRmNGYnLCBbNDcsIDc5LCA3OV1dLFxuICAgIFsnZGFya3R1cnF1b2lzZScsICcjMDBjZWQxJywgWzAsIDIwNiwgMjA5XV0sXG4gICAgWydkYXJrdmlvbGV0JywgJyM5NDAwZDMnLCBbMTQ4LCAwLCAyMTFdXSxcbiAgICBbJ2RlZXBwaW5rJywgJyNmZjE0OTMnLCBbMjU1LCAyMCwgMTQ3XV0sXG4gICAgWydkZWVwc2t5Ymx1ZScsICcjMDBiZmZmJywgWzAsIDE5MSwgMjU1XV0sXG4gICAgWydkaW1ncmF5JywgJyM2OTY5NjknLCBbMTA1LCAxMDUsIDEwNV1dLFxuICAgIFsnZGltZ3JleScsICcjNjk2OTY5JywgWzEwNSwgMTA1LCAxMDVdXSxcbiAgICBbJ2RvZGdlcmJsdWUnLCAnIzFlOTBmZicsIFszMCwgMTQ0LCAyNTVdXSxcbiAgICBbJ2ZpcmVicmljaycsICcjYjIyMjIyJywgWzE3OCwgMzQsIDM0XV0sXG4gICAgWydmbG9yYWx3aGl0ZScsICcjZmZmYWYwJywgWzI1NSwgMjUwLCAyNDBdXSxcbiAgICBbJ2ZvcmVzdGdyZWVuJywgJyMyMjhiMjInLCBbMzQsIDEzOSwgMzRdXSxcbiAgICBbJ2Z1Y2hzaWEnLCAnI2ZmMDBmZicsIFsyNTUsIDAsIDI1NV1dLFxuICAgIFsnZ2FpbnNib3JvJywgJyNkY2RjZGMnLCBbMjIwLCAyMjAsIDIyMF1dLFxuICAgIFsnZ2hvc3R3aGl0ZScsICcjZjhmOGZmJywgWzI0OCwgMjQ4LCAyNTVdXSxcbiAgICBbJ2dvbGQnLCAnI2ZmZDcwMCcsIFsyNTUsIDIxNSwgMF1dLFxuICAgIFsnZ29sZGVucm9kJywgJyNkYWE1MjAnLCBbMjE4LCAxNjUsIDMyXV0sXG4gICAgWydncmF5JywgJyM4MDgwODAnLCBbMTI4LCAxMjgsIDEyOF1dLFxuICAgIFsnZ3JlZW4nLCAnIzAwODAwMCcsIFswLCAxMjgsIDBdXSxcbiAgICBbJ2dyZWVueWVsbG93JywgJyNhZGZmMmYnLCBbMTczLCAyNTUsIDQ3XV0sXG4gICAgWydncmV5JywgJyM4MDgwODAnLCBbMTI4LCAxMjgsIDEyOF1dLFxuICAgIFsnaG9uZXlkZXcnLCAnI2YwZmZmMCcsIFsyNDAsIDI1NSwgMjQwXV0sXG4gICAgWydob3RwaW5rJywgJyNmZjY5YjQnLCBbMjU1LCAxMDUsIDE4MF1dLFxuICAgIFsnaW5kaWFucmVkJywgJyNjZDVjNWMnLCBbMjA1LCA5MiwgOTJdXSxcbiAgICBbJ2luZGlnbycsICcjNGIwMDgyJywgWzc1LCAwLCAxMzBdXSxcbiAgICBbJ2l2b3J5JywgJyNmZmZmZjAnLCBbMjU1LCAyNTUsIDI0MF1dLFxuICAgIFsna2hha2knLCAnI2YwZTY4YycsIFsyNDAsIDIzMCwgMTQwXV0sXG4gICAgWydsYXZlbmRlcicsICcjZTZlNmZhJywgWzIzMCwgMjMwLCAyNTBdXSxcbiAgICBbJ2xhdmVuZGVyYmx1c2gnLCAnI2ZmZjBmNScsIFsyNTUsIDI0MCwgMjQ1XV0sXG4gICAgWydsYXduZ3JlZW4nLCAnIzdjZmMwMCcsIFsxMjQsIDI1MiwgMF1dLFxuICAgIFsnbGVtb25jaGlmZm9uJywgJyNmZmZhY2QnLCBbMjU1LCAyNTAsIDIwNV1dLFxuICAgIFsnbGlnaHRibHVlJywgJyNhZGQ4ZTYnLCBbMTczLCAyMTYsIDIzMF1dLFxuICAgIFsnbGlnaHRjb3JhbCcsICcjZjA4MDgwJywgWzI0MCwgMTI4LCAxMjhdXSxcbiAgICBbJ2xpZ2h0Y3lhbicsICcjZTBmZmZmJywgWzIyNCwgMjU1LCAyNTVdXSxcbiAgICBbJ2xpZ2h0Z29sZGVucm9keWVsbG93JywgJyNmYWZhZDInLCBbMjUwLCAyNTAsIDIxMF1dLFxuICAgIFsnbGlnaHRncmF5JywgJyNkM2QzZDMnLCBbMjExLCAyMTEsIDIxMV1dLFxuICAgIFsnbGlnaHRncmVlbicsICcjOTBlZTkwJywgWzE0NCwgMjM4LCAxNDRdXSxcbiAgICBbJ2xpZ2h0Z3JleScsICcjZDNkM2QzJywgWzIxMSwgMjExLCAyMTFdXSxcbiAgICBbJ2xpZ2h0cGluaycsICcjZmZiNmMxJywgWzI1NSwgMTgyLCAxOTNdXSxcbiAgICBbJ2xpZ2h0c2FsbW9uJywgJyNmZmEwN2EnLCBbMjU1LCAxNjAsIDEyMl1dLFxuICAgIFsnbGlnaHRzZWFncmVlbicsICcjMjBiMmFhJywgWzMyLCAxNzgsIDE3MF1dLFxuICAgIFsnbGlnaHRza3libHVlJywgJyM4N2NlZmEnLCBbMTM1LCAyMDYsIDI1MF1dLFxuICAgIFsnbGlnaHRzbGF0ZWdyYXknLCAnIzc3ODg5OScsIFsxMTksIDEzNiwgMTUzXV0sXG4gICAgWydsaWdodHNsYXRlZ3JleScsICcjNzc4ODk5JywgWzExOSwgMTM2LCAxNTNdXSxcbiAgICBbJ2xpZ2h0c3RlZWxibHVlJywgJyNiMGM0ZGUnLCBbMTc2LCAxOTYsIDIyMl1dLFxuICAgIFsnbGlnaHR5ZWxsb3cnLCAnI2ZmZmZlMCcsIFsyNTUsIDI1NSwgMjI0XV0sXG4gICAgWydsaW1lJywgJyMwMGZmMDAnLCBbMCwgMjU1LCAwXV0sXG4gICAgWydsaW1lZ3JlZW4nLCAnIzMyY2QzMicsIFs1MCwgMjA1LCA1MF1dLFxuICAgIFsnbGluZW4nLCAnI2ZhZjBlNicsIFsyNTAsIDI0MCwgMjMwXV0sXG4gICAgWydtYWdlbnRhJywgJyNmZjAwZmYnLCBbMjU1LCAwLCAyNTVdXSxcbiAgICBbJ21hcm9vbicsICcjODAwMDAwJywgWzEyOCwgMCwgMF1dLFxuICAgIFsnbWVkaXVtYXF1YW1hcmluZScsICcjNjZjZGFhJywgWzEwMiwgMjA1LCAxNzBdXSxcbiAgICBbJ21lZGl1bWJsdWUnLCAnIzAwMDBjZCcsIFswLCAwLCAyMDVdXSxcbiAgICBbJ21lZGl1bW9yY2hpZCcsICcjYmE1NWQzJywgWzE4NiwgODUsIDIxMV1dLFxuICAgIFsnbWVkaXVtcHVycGxlJywgJyM5MzcwZGInLCBbMTQ3LCAxMTIsIDIxOV1dLFxuICAgIFsnbWVkaXVtc2VhZ3JlZW4nLCAnIzNjYjM3MScsIFs2MCwgMTc5LCAxMTNdXSxcbiAgICBbJ21lZGl1bXNsYXRlYmx1ZScsICcjN2I2OGVlJywgWzEyMywgMTA0LCAyMzhdXSxcbiAgICBbJ21lZGl1bXNwcmluZ2dyZWVuJywgJyMwMGZhOWEnLCBbMCwgMjUwLCAxNTRdXSxcbiAgICBbJ21lZGl1bXR1cnF1b2lzZScsICcjNDhkMWNjJywgWzcyLCAyMDksIDIwNF1dLFxuICAgIFsnbWVkaXVtdmlvbGV0cmVkJywgJyNjNzE1ODUnLCBbMTk5LCAyMSwgMTMzXV0sXG4gICAgWydtaWRuaWdodGJsdWUnLCAnIzE5MTk3MCcsIFsyNSwgMjUsIDExMl1dLFxuICAgIFsnbWludGNyZWFtJywgJyNmNWZmZmEnLCBbMjQ1LCAyNTUsIDI1MF1dLFxuICAgIFsnbWlzdHlyb3NlJywgJyNmZmU0ZTEnLCBbMjU1LCAyMjgsIDIyNV1dLFxuICAgIFsnbW9jY2FzaW4nLCAnI2ZmZTRiNScsIFsyNTUsIDIyOCwgMTgxXV0sXG4gICAgWyduYXZham93aGl0ZScsICcjZmZkZWFkJywgWzI1NSwgMjIyLCAxNzNdXSxcbiAgICBbJ25hdnknLCAnIzAwMDA4MCcsIFswLCAwLCAxMjhdXSxcbiAgICBbJ29sZGxhY2UnLCAnI2ZkZjVlNicsIFsyNTMsIDI0NSwgMjMwXV0sXG4gICAgWydvbGl2ZScsICcjODA4MDAwJywgWzEyOCwgMTI4LCAwXV0sXG4gICAgWydvbGl2ZWRyYWInLCAnIzZiOGUyMycsIFsxMDcsIDE0MiwgMzVdXSxcbiAgICBbJ29yYW5nZScsICcjZmZhNTAwJywgWzI1NSwgMTY1LCAwXV0sXG4gICAgWydvcmFuZ2VyZWQnLCAnI2ZmNDUwMCcsIFsyNTUsIDY5LCAwXV0sXG4gICAgWydvcmNoaWQnLCAnI2RhNzBkNicsIFsyMTgsIDExMiwgMjE0XV0sXG4gICAgWydwYWxlZ29sZGVucm9kJywgJyNlZWU4YWEnLCBbMjM4LCAyMzIsIDE3MF1dLFxuICAgIFsncGFsZWdyZWVuJywgJyM5OGZiOTgnLCBbMTUyLCAyNTEsIDE1Ml1dLFxuICAgIFsncGFsZXR1cnF1b2lzZScsICcjYWZlZWVlJywgWzE3NSwgMjM4LCAyMzhdXSxcbiAgICBbJ3BhbGV2aW9sZXRyZWQnLCAnI2RiNzA5MycsIFsyMTksIDExMiwgMTQ3XV0sXG4gICAgWydwYXBheWF3aGlwJywgJyNmZmVmZDUnLCBbMjU1LCAyMzksIDIxM11dLFxuICAgIFsncGVhY2hwdWZmJywgJyNmZmRhYjknLCBbMjU1LCAyMTgsIDE4NV1dLFxuICAgIFsncGVydScsICcjY2Q4NTNmJywgWzIwNSwgMTMzLCA2M11dLFxuICAgIFsncGluaycsICcjZmZjMGNiJywgWzI1NSwgMTkyLCAyMDNdXSxcbiAgICBbJ3BsdW0nLCAnI2RkYTBkZCcsIFsyMjEsIDE2MCwgMjIxXV0sXG4gICAgWydwb3dkZXJibHVlJywgJyNiMGUwZTYnLCBbMTc2LCAyMjQsIDIzMF1dLFxuICAgIFsncHVycGxlJywgJyM4MDAwODAnLCBbMTI4LCAwLCAxMjhdXSxcbiAgICBbJ3JlZCcsICcjZmYwMDAwJywgWzI1NSwgMCwgMF1dLFxuICAgIFsncm9zeWJyb3duJywgJyNiYzhmOGYnLCBbMTg4LCAxNDMsIDE0M11dLFxuICAgIFsncm95YWxibHVlJywgJyM0MTY5ZTEnLCBbNjUsIDEwNSwgMjI1XV0sXG4gICAgWydzYWRkbGVicm93bicsICcjOGI0NTEzJywgWzEzOSwgNjksIDE5XV0sXG4gICAgWydzYWxtb24nLCAnI2ZhODA3MicsIFsyNTAsIDEyOCwgMTE0XV0sXG4gICAgWydzYW5keWJyb3duJywgJyNmNGE0NjAnLCBbMjQ0LCAxNjQsIDk2XV0sXG4gICAgWydzZWFncmVlbicsICcjMmU4YjU3JywgWzQ2LCAxMzksIDg3XV0sXG4gICAgWydzZWFzaGVsbCcsICcjZmZmNWVlJywgWzI1NSwgMjQ1LCAyMzhdXSxcbiAgICBbJ3NpZW5uYScsICcjYTA1MjJkJywgWzE2MCwgODIsIDQ1XV0sXG4gICAgWydzaWx2ZXInLCAnI2MwYzBjMCcsIFsxOTIsIDE5MiwgMTkyXV0sXG4gICAgWydza3libHVlJywgJyM4N2NlZWInLCBbMTM1LCAyMDYsIDIzNV1dLFxuICAgIFsnc2xhdGVibHVlJywgJyM2YTVhY2QnLCBbMTA2LCA5MCwgMjA1XV0sXG4gICAgWydzbGF0ZWdyYXknLCAnIzcwODA5MCcsIFsxMTIsIDEyOCwgMTQ0XV0sXG4gICAgWydzbGF0ZWdyZXknLCAnIzcwODA5MCcsIFsxMTIsIDEyOCwgMTQ0XV0sXG4gICAgWydzbm93JywgJyNmZmZhZmEnLCBbMjU1LCAyNTAsIDI1MF1dLFxuICAgIFsnc3ByaW5nZ3JlZW4nLCAnIzAwZmY3ZicsIFswLCAyNTUsIDEyN11dLFxuICAgIFsnc3RlZWxibHVlJywgJyM0NjgyYjQnLCBbNzAsIDEzMCwgMTgwXV0sXG4gICAgWyd0YW4nLCAnI2QyYjQ4YycsIFsyMTAsIDE4MCwgMTQwXV0sXG4gICAgWyd0ZWFsJywgJyMwMDgwODAnLCBbMCwgMTI4LCAxMjhdXSxcbiAgICBbJ3RoaXN0bGUnLCAnI2Q4YmZkOCcsIFsyMTYsIDE5MSwgMjE2XV0sXG4gICAgWyd0b21hdG8nLCAnI2ZmNjM0NycsIFsyNTUsIDk5LCA3MV1dLFxuICAgIFsndHVycXVvaXNlJywgJyM0MGUwZDAnLCBbNjQsIDIyNCwgMjA4XV0sXG4gICAgWyd2aW9sZXQnLCAnI2VlODJlZScsIFsyMzgsIDEzMCwgMjM4XV0sXG4gICAgWyd3aGVhdCcsICcjZjVkZWIzJywgWzI0NSwgMjIyLCAxNzldXSxcbiAgICBbJ3doaXRlJywgJyNmZmZmZmYnLCBbMjU1LCAyNTUsIDI1NV1dLFxuICAgIFsnd2hpdGVzbW9rZScsICcjZjVmNWY1JywgWzI0NSwgMjQ1LCAyNDVdXSxcbiAgICBbJ3llbGxvdycsICcjZmZmZjAwJywgWzI1NSwgMjU1LCAwXV0sXG4gICAgWyd5ZWxsb3dncmVlbicsICcjOWFjZDMyJywgWzE1NCwgMjA1LCA1MF1dXG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbG9ybGlzdDsiLCJ2YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9jYW1lcmEuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnQ2FtZXJhJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgY2FtZXJhO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGNhbWVyYSA9IG5ldyBDYW1lcmEoNjAwLCA0MDApO1xuICAgIH0pXG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdoZWlnaHQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGNhbWVyYS5oZWlnaHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGNhbWVyYS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIFNjZW5lID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9zY2VuZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdTY2VuZScsIGZ1bmN0aW9uKCl7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgLy92YXIgc2NlbmUgPSBuZXcgU2NlbmUoe2NhbnZhc19pZDogJ3dpcmVmcmFtZScsIHdpZHRoOjYwMCwgaGVpZ2h0OjQwMH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnaGVpZ2h0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGFzc2VydC5lcXVhbChzY2VuZS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgXG4gICAgfSlcbn0pOyIsImZ1bmN0aW9uIG5lYXJseUVxdWFsKGEsIGIsIGVwcyl7XG4gICAgaWYgKHR5cGVvZiBlcHMgPT09IFwidW5kZWZpbmVkXCIpIHtlcHMgPSAwLjAxO31cbiAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICByZXR1cm4gKGRpZmYgPCBlcHMpO1xufVxuXG52YXIgaGVscGVycyA9IG5ldyBPYmplY3QobnVsbCk7XG5cbmhlbHBlcnMubmVhcmx5RXF1YWwgPSBuZWFybHlFcXVhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWxwZXJzOyIsInZhciBGYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvZmFjZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnZhciBmYWNlO1xuXG5zdWl0ZSgnRmFjZScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGZhY2U7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgZmFjZSA9IG5ldyBGYWNlKDAsIDEsIDIsIFwicmVkXCIpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnY29sb3InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZhY2UuY29sb3IucmdiLnIsIDI1NSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL21hdHJpeC5qcycpO1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL3ZlY3Rvci5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdNYXRyaXgnLCBmdW5jdGlvbigpe1xuICAgIHZhciB6ZXJvLCB6ZXJvMiwgemVybzMsIGlkZW50aXR5LCBpZGVudGl0eTIsIGlkZW50aXR5Mywgb25lcywgbTAsIG0xLCBtMiwgbTMsIG00LCBtNSwgbTYsIG03LCBhbmdsZXM7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgYW5nbGVzID0gWzAsIE1hdGguUEkgLyAyLCBNYXRoLlBJLCAzKk1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMl07XG4gICAgICAgIHplcm8gPSBNYXRyaXguemVybygpO1xuICAgICAgICB6ZXJvMiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgemVybzMgPSBNYXRyaXguZnJvbUFycmF5KFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSk7XG4gICAgICAgIGlkZW50aXR5ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgIGlkZW50aXR5MiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgaWRlbnRpdHkzID0gTWF0cml4LmZyb21BcnJheShbMSwwLDAsMCwwLDEsMCwwLDAsMCwxLDAsMCwwLDAsMV0pO1xuICAgICAgICBpZGVudGl0eTJbMF0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbNV0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbMTBdID0gMTtcbiAgICAgICAgaWRlbnRpdHkyWzE1XSA9IDE7XG4gICAgICAgIG9uZXMgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0wID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMSA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTIgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0zID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtNCA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTRbMF0gPSAwO1xuICAgICAgICBtNFsxXSA9IDE7XG4gICAgICAgIG00WzJdID0gMTtcbiAgICAgICAgbTRbM10gPSAyO1xuICAgICAgICBtNFs0XSA9IDM7XG4gICAgICAgIG00WzVdID0gNTtcbiAgICAgICAgbTRbNl0gPSA4O1xuICAgICAgICBtNFs3XSA9IDEzO1xuICAgICAgICBtNFs4XSA9IDIxO1xuICAgICAgICBtNFs5XSA9IDM0O1xuICAgICAgICBtNFsxMF0gPSA1NTtcbiAgICAgICAgbTRbMTFdID0gODk7XG4gICAgICAgIG00WzEyXSA9IDE0NDtcbiAgICAgICAgbTRbMTNdID0gMjMzO1xuICAgICAgICBtNFsxNF0gPSAzNzc7XG4gICAgICAgIG00WzE1XSA9IDYxMDtcbiAgICAgICAgbTUgPSBNYXRyaXguZnJvbUFycmF5KFswLCAxLCAxLCAyLCAzLCA1LCA4LCAxMywgMjEsIDM0LCA1NSwgODksIDE0NCwgMjMzLCAzNzcsIDYxMF0pO1xuICAgICAgICBtNiA9IE1hdHJpeC5mcm9tQXJyYXkoWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDhdKTtcbiAgICAgICAgbTcgPSBNYXRyaXguZnJvbUFycmF5KFszNCwgNDQsIDU0LCA2NCwgODIsIDEwOCwgMTM0LCAxNjAsIDM0LCA0NCwgNTQsIDY0LCA4MiwgMTA4LCAxMzQsIDE2MF0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgb25lc1tpXSA9IDE7XG4gICAgICAgICAgICBtMFtpXSA9IGk7XG4gICAgICAgICAgICBtMVtpXSA9IGkrMTtcbiAgICAgICAgICAgIG0yW2ldID0gaSsyO1xuICAgICAgICAgICAgbTNbaV0gPSBpKjI7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xlbmd0aCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVyby5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvMi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvMy5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eS5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eTIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTEubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTMubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTQubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobTUubGVuZ3RoLCAxNik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnZXF1YWwnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGlkZW50aXR5LmVxdWFsKGlkZW50aXR5MikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8uZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVybzIuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghaWRlbnRpdHkuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG00LmVxdWFsKG01KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIW0wLmVxdWFsKG0zKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhZGQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gemVyby5hZGQobTEpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTAuYWRkKG9uZXMpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTAuYWRkKG9uZXMpLmFkZChvbmVzKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwobTIpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3N1YnRyYWN0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG00LnN1YnRyYWN0KG01KTtcbiAgICAgICAgICAgIHZhciB0MiA9IG0xLnN1YnRyYWN0KG9uZXMpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTIuc3VidHJhY3QobTEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChtMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKG9uZXMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5U2NhbGFyJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG0wLm11bHRpcGx5U2NhbGFyKDIpO1xuICAgICAgICAgICAgdmFyIHQyID0gemVyby5tdWx0aXBseVNjYWxhcigyMCk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMC5tdWx0aXBseVNjYWxhcigxKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbChtMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gbTYubXVsdGlwbHkobTYpO1xuICAgICAgICAgICAgdmFyIHQyID0gaWRlbnRpdHkubXVsdGlwbHkoaWRlbnRpdHkpO1xuICAgICAgICAgICAgdmFyIHQzID0gaWRlbnRpdHkubXVsdGlwbHkoemVybyk7XG4gICAgICAgICAgICB2YXIgdDQgPSBpZGVudGl0eS5tdWx0aXBseShtMCk7XG4gICAgICAgICAgICB2YXIgdDUgPSB6ZXJvLm11bHRpcGx5KG0wKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtNykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKGlkZW50aXR5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ0LmVxdWFsKG0wKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDUuZXF1YWwoemVybykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbmVnYXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG0wLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQyID0gbTEubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMi5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0zLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQ1ID0gemVyby5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NiA9IG9uZXMubmVnYXRlKCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHQ1KSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVtpXSwgLW0wW2ldKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDJbaV0sIC1tMVtpXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQzW2ldLCAtbTJbaV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NFtpXSwgLW0zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMTY7IGorKyl7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxW2pdLCAtaik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQ2W2pdLCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc3Bvc2UnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyYW5zcG9zZV9tYXAgPSB7XG4gICAgICAgICAgICAgICAgMDowLCAxOjQsIDI6OCwgMzoxMiwgNDoxLCA1OjUsIDY6OSwgNzoxMyxcbiAgICAgICAgICAgICAgICA4OjIsIDk6NiwgMTA6MTAsIDExOjE0LCAxMjozLCAxMzo3LCAxNDoxMSwgMTU6MTVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0MSA9IGlkZW50aXR5LnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQyID0gb25lcy50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0MyA9IHplcm8udHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDQgPSBtMC50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NSA9IG0xLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQ2ID0gbTIudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDcgPSBtMy50cmFuc3Bvc2UoKTtcblxuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKGlkZW50aXR5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwob25lcykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0wLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDRbaV0sIG0wW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDVbaV0sIG0xW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDZbaV0sIG0yW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDdbaV0sIG0zW3RyYW5zcG9zZV9tYXBbaV1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uWCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbW9yZSB0ZXN0c1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb25YKHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzZdID0gLU1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzldID0gTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMTBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uWSh0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgICAgICAgICAgdDJbMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsyXSA9IE1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzhdID0gLU1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzEwXSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25aJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvbloodGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMV0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNF0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25BeGlzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtdWx0aS1heGlzIHRlc3RzP1xuICAgICAgICAgICAgdmFyIHhheGlzID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgICAgIHZhciB5YXhpcyA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgICAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb25BeGlzKHhheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LnJvdGF0aW9uQXhpcyh5YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MyA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoemF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDQgPSBNYXRyaXgucm90YXRpb25BeGlzKHhheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQ1ID0gTWF0cml4LnJvdGF0aW9uQXhpcyh5YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0NiA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoemF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDQuZXF1YWwoTWF0cml4LnJvdGF0aW9uWCh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDUuZXF1YWwoTWF0cml4LnJvdGF0aW9uWSh0aGV0YSkpKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDYuZXF1YWwoTWF0cml4LnJvdGF0aW9uWih0aGV0YSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBiZXR0ZXIgdGVzdHMsIHRoaXMgaXMgYmFzaWNhbGx5IGp1c3QgcmVjcmVhdGluZyB0aGUgbWV0aG9kXG4gICAgICAgICAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKDEsIDAsIDApO1xuICAgICAgICAgICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICAgICAgICAgIHZhciB6YXhpcyA9IG5ldyBWZWN0b3IoMCwgMCwgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHBpdGNoID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5nbGVzLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlhdyA9IGFuZ2xlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBhbmdsZXMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvbGwgPSBhbmdsZXNba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgucm90YXRpb24ocGl0Y2gsIHlhdywgcm9sbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXgucm90YXRpb25YKHJvbGwpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblooeWF3KSkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWShwaXRjaCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKHQyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2xhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJhbnMgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFucy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHh0cmFucyA9IHRyYW5zW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdHJhbnMubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXRyYW5zID0gdHJhbnNbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdHJhbnMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHp0cmFucyA9IHRyYW5zW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnRyYW5zbGF0aW9uKHh0cmFucywgeXRyYW5zLCB6dHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAxMil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHh0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geXRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB6dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAwIHx8IG0gPT09IDUgfHwgbSA9PT0gMTAgfHwgbSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbbV0sIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2FsZS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHhzY2FsZSA9IHNjYWxlW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2NhbGUubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXNjYWxlID0gc2NhbGVbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc2NhbGUubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpzY2FsZSA9IHNjYWxlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnNjYWxlKHhzY2FsZSwgeXNjYWxlLCB6c2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gNSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0genNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbbV0sIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdpZGVudGl0eScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGlmIChpICUgNSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChpZGVudGl0eVtpXSwgMSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5W2ldLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd6ZXJvJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVyb1tpXSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdmcm9tQXJyYXknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG01LmVxdWFsKG00KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8yLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkyLmVxdWFsKGlkZW50aXR5MykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBNZXNoID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvbWVzaC5qcycpO1xudmFyIEZhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9mYWNlLmpzJyk7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvdmVjdG9yLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ01lc2gnLCBmdW5jdGlvbigpe1xuICAgIHZhciBtZXNoO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIG1lc2ggPSBuZXcgTWVzaCgndHJpYW5nbGUnLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMSwwLDApLFxuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMCwxLDApLFxuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMCwwLDEpXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIG5ldyBGYWNlKDAsIDEsIDIsICdyZWQnKVxuICAgICAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCduYW1lJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhtZXNoLm5hbWUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gubmFtZSwgJ3RyaWFuZ2xlJyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZXJ0aWNlcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2ZhY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncG9zaXRpb24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2Zyb21KU09OJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC92ZWN0b3IuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbnZhciBuZWFybHlFcXVhbCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMuanMnKVsnbmVhcmx5RXF1YWwnXTtcblxuc3VpdGUoJ1ZlY3RvcicsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG9yaWdpbiwgdmVjdG9yMSwgdmVjdG9yMiwgdmVjdG9yMywgdmVjdG9yNCwgdmVjdG9yNSwgdmVjdG9yeCwgdmVjdG9yeSwgdmVjdG9yejtcbiAgICB2YXIgdmVjdG9yMTAweCwgdmVjdG9yMjAweSwgdmVjdG9yMzAweiwgdmVjdG9yMTIzLCB2ZWN0b3IxMTI7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgb3JpZ2luID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yMSA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjIgPSBuZXcgVmVjdG9yKDEsIDEsIDEpO1xuICAgICAgICB2ZWN0b3IzID0gbmV3IFZlY3RvcigxMCwgMTAsIDEwKTtcbiAgICAgICAgdmVjdG9yNCA9IG5ldyBWZWN0b3IoMTEsIDExLCAxMSk7XG4gICAgICAgIHZlY3RvcjUgPSBuZXcgVmVjdG9yKC0xLCAtMSwgLTEpO1xuICAgICAgICB2ZWN0b3J4ID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yeSA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgIHZlY3RvcnogPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICB2ZWN0b3IxMDB4ID0gbmV3IFZlY3RvcigxMDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IyMDB5ID0gbmV3IFZlY3RvcigwLCAyMDAsIDApO1xuICAgICAgICB2ZWN0b3IzMDB6ID0gbmV3IFZlY3RvcigwLCAwLCAzMDApO1xuICAgICAgICB2ZWN0b3IxMjMgPSBuZXcgVmVjdG9yKDEsIDIsIDMpO1xuICAgICAgICB2ZWN0b3IxMTIgPSBuZXcgVmVjdG9yKC0xLCAxLCAyKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2F4ZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe25ldyBWZWN0b3IoKTt9LCBFcnJvcik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS54KTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcjEuYWRkKHZlY3RvcjMpO1xuICAgICAgICAgICAgdmFyIHQyID0gdmVjdG9yMS5hZGQodmVjdG9yNSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5hZGQodmVjdG9yMykuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuYWRkKHZlY3RvcjUpLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS55LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueiwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKTtcbiAgICAgICAgICAgIHZhciB0MiA9IHZlY3RvcjEuc3VidHJhY3QodmVjdG9yMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKS5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zdWJ0cmFjdCh2ZWN0b3IyKS5lcXVhbChvcmlnaW4pKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS54LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi56LCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2VxdWFsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjIpLCB0cnVlKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjMpLCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbmdsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5hbmdsZSh2ZWN0b3J5KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LmFuZ2xlKHZlY3RvcnopLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnguYW5nbGUodmVjdG9yeiksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZSh2ZWN0b3IyKSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjEuYW5nbGUodmVjdG9yNSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nvc0FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J5KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeS5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3IyKSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3I1KSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yNS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMy5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMwMCkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZVNxdWFyZWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEubWFnbml0dWRlU3F1YXJlZCgpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3I1Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMy5tYWduaXR1ZGVTcXVhcmVkKCksIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkb3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZG90KHZlY3RvcjIpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyLmRvdCh2ZWN0b3IzKSwgMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMuZG90KHZlY3RvcjUpLCAtMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguZG90KHZlY3RvcnkpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmRvdCh2ZWN0b3J6KSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5kb3QodmVjdG9yeiksIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY3Jvc3MnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yMTIzLmNyb3NzKHZlY3RvcjExMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yei5jcm9zcyh2ZWN0b3J4KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnkuY3Jvc3ModmVjdG9yeCkuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J6LmNyb3NzKHZlY3RvcnkpLmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yeC5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS56LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5LmNyb3NzKHZlY3RvcnopLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnouY3Jvc3ModmVjdG9yeCkueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgLTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDMpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdub3JtYWxpemUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEwMHgubm9ybWFsaXplKCkueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMjAweS5ub3JtYWxpemUoKS55LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IzMDB6Lm5vcm1hbGl6ZSgpLnosIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnguc2NhbGUoMTAwKS5lcXVhbCh2ZWN0b3IxMDB4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5zY2FsZSgyMDApLmVxdWFsKHZlY3RvcjIwMHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J6LnNjYWxlKDMwMCkuZXF1YWwodmVjdG9yMzAweikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuc2NhbGUoMTApLmVxdWFsKHZlY3RvcjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnNjYWxlKDExKS5lcXVhbCh2ZWN0b3I0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkuZXF1YWwodmVjdG9yNSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkubmVnYXRlKCkuZXF1YWwodmVjdG9yMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndmVjdG9yUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB2ZWN0b3J4LnZlY3RvclByb2plY3Rpb24odmVjdG9yeSk7XG4gICAgICAgICAgICB2YXIgdDIgPSB2ZWN0b3IxLnZlY3RvclByb2plY3Rpb24odmVjdG9yMyk7XG4gICAgICAgICAgICB2YXIgdDMgPSB2ZWN0b3IxMjMudmVjdG9yUHJvamVjdGlvbih2ZWN0b3IxMTIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQyLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0Mi55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDIueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLngsIC0xLjE2NykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLnksIDEuMTYpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0My56LCAyLjMzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsYXJQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LnNjYWxhclByb2plY3Rpb24odmVjdG9yeSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLnNjYWxhclByb2plY3Rpb24odmVjdG9yMyksIDEuNzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxMjMuc2NhbGFyUHJvamVjdGlvbih2ZWN0b3IxMTIpLCAyLjg1KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCAoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS56LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcnoucm90YXRlWCgoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcnoucm90YXRlWCgyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVZJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByb3QxID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkgLyAyKTtcbiAgICAgICAgICAgIHZhciByb3QyID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZVkoKCgzKk1hdGguUEkpIC8gMikpO1xuICAgICAgICAgICAgdmFyIHJvdDQgPSB2ZWN0b3J4LnJvdGF0ZVkoMipNYXRoLlBJKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeS5yb3RhdGVaKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeS5yb3RhdGVaKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlUGl0Y2hZYXdSb2xsKE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbGl0aWVzL2NvbG9yLmpzJyk7XG52YXIgY29sb3JsaXN0ID0gcmVxdWlyZSgnLi4vZGF0YS9jb2xvcnMuanMnKTtcbnZhciBuZWFybHlFcXVhbCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMuanMnKVsnbmVhcmx5RXF1YWwnXTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnQ29sb3InLCBmdW5jdGlvbigpe1xuICAgIHZhciByZWQsIGdyZWVuLCByZ2JhLCBoc2wsIGhzbGEsIG5hbWVkLCBlcHNpbG9uO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGVwc2lsb24gPSAwLjAxO1xuICAgICAgICByZWQgPSBuZXcgQ29sb3IoXCJyZWRcIik7XG4gICAgICAgIGdyZWVuID0gbmV3IENvbG9yKFwiIzBGMFwiKTsgLy8gTmFtZWQgY29sb3IgJ2dyZWVuJyBpcyByZ2IoMCwxMjgsMClcbiAgICAgICAgYmx1ZSA9IG5ldyBDb2xvcihcImJsdWVcIik7XG4gICAgICAgIGJhZGE1NSA9IG5ldyBDb2xvcihcIiNCQURBNTVcIik7XG4gICAgICAgIHJnYiA9IG5ldyBDb2xvcihcInJnYigxLCA3LCAyOSlcIik7XG4gICAgICAgIHJnYmEgPSBuZXcgQ29sb3IoXCJyZ2JhKDI1NSwgMCwgMCwgMC4zKVwiKTtcbiAgICAgICAgaHNsID0gbmV3IENvbG9yKFwiaHNsKDAsIDEwMCUsIDUwJSlcIik7XG4gICAgICAgIGhzbGEgPSBuZXcgQ29sb3IoXCJoc2xhKDAsIDEwMCUsIDUwJSwgMC4zKVwiKTtcbiAgICAgICAgbmFtZWQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvcmxpc3QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gY29sb3JsaXN0W2ldO1xuICAgICAgICAgICAgbmFtZWQucHVzaChbbmV3IENvbG9yKGNvbG9yWzBdKSwgbmV3IENvbG9yKGNvbG9yWzFdKSwgY29sb3JbMl1dKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgncmdiJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmIsIDApO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lZC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWVkX2NvbG9yID0gbmFtZWRbaV1bMF07XG4gICAgICAgICAgICAgICAgdmFyIGhleF9jb2xvciA9IG5hbWVkW2ldWzFdO1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBuYW1lZFtpXVsyXTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZWRfY29sb3IucmdiLnIsIGhleF9jb2xvci5yZ2Iucik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWVkX2NvbG9yLnJnYi5nLCBoZXhfY29sb3IucmdiLmcpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lZF9jb2xvci5yZ2IuYiwgaGV4X2NvbG9yLnJnYi5iKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZWRfY29sb3IucmdiLnIsIGFjdHVhbFswXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWVkX2NvbG9yLnJnYi5nLCBhY3R1YWxbMV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lZF9jb2xvci5yZ2IuYiwgYWN0dWFsWzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2hzbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5sLCA1MCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVkLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZWRfY29sb3IgPSBuYW1lZFtpXVswXTtcbiAgICAgICAgICAgICAgICB2YXIgaGV4X2NvbG9yID0gbmFtZWRbaV1bMV07XG4gICAgICAgICAgICAgICAgdmFyIGFjdHVhbCA9IG5hbWVkW2ldWzJdO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lZF9jb2xvci5yZ2IuaCwgaGV4X2NvbG9yLnJnYi5oKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZWRfY29sb3IucmdiLnMsIGhleF9jb2xvci5yZ2Iucyk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWVkX2NvbG9yLnJnYi5sLCBoZXhfY29sb3IucmdiLmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnYWxwaGEnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlZC5hbHBoYSwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJnYmEuYWxwaGEsIDAuMykpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xpZ2h0ZW4nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHIxID0gcmVkLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIHIyID0gcmVkLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIHIzID0gcmVkLmxpZ2h0ZW4oNTApO1xuICAgICAgICAgICAgdmFyIGcxID0gZ3JlZW4ubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgZzIgPSBncmVlbi5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciBnMyA9IGdyZWVuLmxpZ2h0ZW4oNTApO1xuICAgICAgICAgICAgdmFyIGIxID0gYmx1ZS5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciBiMiA9IGJsdWUubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgYjMgPSBibHVlLmxpZ2h0ZW4oNTApO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmcsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuYiwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5nLCAxMDIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5iLCAxMDIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5iLCAyNTUpO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLnIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuYiwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5yLCAxMDIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5iLCAxMDIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5iLCAyNTUpO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLnIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuZywgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5iLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5yLCAxMDIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5nLCAxMDIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5iLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5iLCAyNTUpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkYXJrZW4nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHIxID0gcmVkLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgcjIgPSByZWQuZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciByMyA9IHJlZC5kYXJrZW4oNTApO1xuICAgICAgICAgICAgdmFyIGcxID0gZ3JlZW4uZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciBnMiA9IGdyZWVuLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgZzMgPSBncmVlbi5kYXJrZW4oNTApO1xuICAgICAgICAgICAgdmFyIGIxID0gYmx1ZS5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIGIyID0gYmx1ZS5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIGIzID0gYmx1ZS5kYXJrZW4oNTApO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLnIsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuciwgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmIsIDApO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5nLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmcsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmIsIDApO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuYiwgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5iLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmIsIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnaHNsVG9SZ2InLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyZ2JUb0hzbCcsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiXX0=
(16)
});
