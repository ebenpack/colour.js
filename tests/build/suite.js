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
Matrix.prototype.equals = function(matrix){
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
        this[i] = this[i] - matrix[i];
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
        this[i] = this[i] * scalar;
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
        this[i] = -this[i];
    }
    return new_matrix;
};
/**
 * Transpose self.
 * @method
 * @param {number} scalar
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
 * @param {Array.<Vertex>} vertices
 * @param {Array.<{edge: Array.<number>, color: string}>} edges
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
    var theta = a.dot(b) / (amag * bmag )
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
    return this.magnitude() * Math.cos(this.angle(vector));
};
/**
 * Project self onto vector
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.scalarProjection = function(vector){
    return this.dot(vector.normalize()) * vector.normalize;
};
/**
 * Comp self and vector
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.component = function(vector){
    //A.comp(B) = dot(A,norm(B))
    return this.dot(vector) / this.magnitude();
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
var assert = _dereq_("assert");

suite('Matrix', function(){
    var zero, identity;
    setup(function(){
        zero = new Matrix();
        identity = Matrix.identity();
    });
    suite('properties', function(){
        test('length', function(){
            assert.equal(16, zero.length);
            assert.equal(16, identity.length);
        });
    });
    suite('methods', function(){
        test('equal', function(){
            
        });
        test('add', function(){
            
        });
        test('subtract', function(){
            
        });
        test('multiplyScalar', function(){
            
        });
        test('multiply', function(){
            
        });
        test('negate', function(){
            
        });
        test('transpose', function(){
            
        });
        test('rotationX', function(){
            
        });
        test('rotationY', function(){
            
        });
        test('rotationZ', function(){
            
        });
        test('rotationAxis', function(){
            
        });
        test('rotation', function(){
            
        });
        test('translation', function(){
            
        });
        test('scale', function(){
            
        });
        test('identity', function(){
            
        });
        test('zero', function(){
            
        });
        test('fromArray', function(){
            
        });
    });
});
},{"../../src/math/matrix.js":11,"assert":1}],22:[function(_dereq_,module,exports){
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
            assert.throws(function(){new Vector()}, Error);
            assert.ok(vector1.x);
            assert.ok(vector1.y);
            assert.ok(vector1.z);
        });
    });
    suite('methods', function(){
        test('add', function(){
            assert.ok(vector1.add(vector3).equal(vector4));
            assert.ok(vector1.add(vector5).equal(origin));
            assert.equal(vector1.add(vector3).x, 11);
            assert.equal(vector1.add(vector3).y, 11);
            assert.equal(vector1.add(vector3).z, 11);
            assert.equal(vector1.add(vector5).x, 0);
            assert.equal(vector1.add(vector5).y, 0);
            assert.equal(vector1.add(vector5).z, 0);
        });
        test('subtract', function(){
            assert.ok(vector4.subtract(vector1).equal(vector3));
            assert.ok(vector1.subtract(vector2).equal(origin));
            assert.equal(vector4.subtract(vector1).x, 10);
            assert.equal(vector4.subtract(vector1).y, 10);
            assert.equal(vector4.subtract(vector1).z, 10);
            assert.equal(vector1.subtract(vector2).x, 0);
            assert.equal(vector1.subtract(vector2).y, 0);
            assert.equal(vector1.subtract(vector2).z, 0);
        });
        test('equal', function(){
            assert.equal(vector1.equal(vector2), true);
            assert.equal(vector1.equal(vector3), false);
        });
        test('angle', function(){
            assert.ok((vectorx.angle(vectory) - (Math.PI / 2)) < epsilon);
            assert.ok((vectory.angle(vectorz) - (Math.PI / 2)) < epsilon);
            assert.ok((vectorx.angle(vectorz) - (Math.PI / 2)) < epsilon);
            assert.equal(vector1.angle(vector2), 0);
            assert.ok((vector1.angle(vector5) - Math.PI) < epsilon);
        });
        test('cosAngle', function(){
            assert.ok((Math.acos(vectorx.cosAngle(vectory)) - (Math.PI / 2)) < epsilon);
            assert.ok((Math.acos(vectory.cosAngle(vectorz)) - (Math.PI / 2)) < epsilon);
            assert.ok((Math.acos(vectorx.cosAngle(vectorz)) - (Math.PI / 2)) < epsilon);
            assert.equal(Math.acos(vector1.cosAngle(vector2)), 0);
            assert.ok((Math.acos(vector1.cosAngle(vector5)) - Math.PI) < epsilon);
        });
        test('magnitude', function(){
            assert.equal(vectorx.magnitude(), 1);
            assert.equal(vectory.magnitude(), 1);
            assert.equal(vectorz.magnitude(), 1);
            assert.ok((vector1.magnitude() - Math.sqrt(3)) < epsilon);
            assert.ok((vector5.magnitude() - Math.sqrt(3)) < epsilon);
            assert.ok((vector3.magnitude() - Math.sqrt(300)) < epsilon);
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
        });
        test('cross', function(){
            assert.ok(vectorx.cross(vectory).equal(vectorz));
            assert.ok(vectory.cross(vectorz).equal(vectorx));
            assert.ok(vectorz.cross(vectorx).equal(vectory));
            assert.ok(!vectory.cross(vectorx).equal(vectorz));
            assert.ok(!vectorz.cross(vectory).equal(vectorx));
            assert.ok(!vectorx.cross(vectorz).equal(vectory));
            assert.equal(vectorx.cross(vectory).z, 1);
            assert.equal(vectory.cross(vectorz).x, 1);
            assert.equal(vectorz.cross(vectorx).y, 1);
            assert.equal(vector123.cross(vector112).x, 1);
            assert.equal(vector123.cross(vector112).y, -5);
            assert.equal(vector123.cross(vector112).z, 3);

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

        });
        test('scalarProjection', function(){

        });
        test('component', function(){

        });
        test('rotate', function(){

        });
        test('transform', function(){

        });
        test('rotateX', function(){

        });
        test('rotateY', function(){

        });
        test('rotateZ', function(){

        });
        test('rotatePitchYawRoll', function(){

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2V2ZW50cy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL21hdGgvbWF0aC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC92ZWN0b3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvdXRpbGl0eS9jb2xvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy91dGlsaXR5L2tleWNvZGVzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdC9mYWtlXzNhNmVkNjI1LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZGF0YS9jb2xvcnMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9lbmdpbmUvY2FtZXJhLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZW5naW5lL3NjZW5lLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvbWF0aC9tYXRyaXguanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL3ZlY3Rvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL3V0aWxpdHkvY29sb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAgICBrZXksIGk7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ2YXIgbWF0aCA9IHJlcXVpcmUoJy4uL21hdGgvbWF0aC5qcycpO1xudmFyIFZlY3RvciA9IG1hdGguVmVjdG9yO1xudmFyIE1hdHJpeCA9IG1hdGguTWF0cml4O1xuXG4vKiogXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSBwb3NpdGlvbiBDYW1lcmEgcG9zaXRpb24uXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZ2V0ICAgQ2FtZXJhXG4gKi9cbmZ1bmN0aW9uIENhbWVyYSh3aWR0aCwgaGVpZ2h0LCBwb3NpdGlvbil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IG5ldyBWZWN0b3IoMSwxLDIwKTtcbiAgICB0aGlzLnVwID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5uZWFyID0gMC4xO1xuICAgIHRoaXMuZmFyID0gMTAwMDtcbiAgICB0aGlzLmZvdiA9IDkwO1xuICAgIHRoaXMucGVyc3BlY3RpdmVGb3YgPSB0aGlzLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92KCk7XG59XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi5waXRjaCk7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHRoaXMucm90YXRpb24ucGl0Y2gpO1xuICAgIHZhciBzaW5feWF3ID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi55YXcpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbi55YXcpO1xuXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLWNvc19waXRjaCAqIHNpbl95YXcsIHNpbl9waXRjaCwgLWNvc19waXRjaCAqIGNvc195YXcpO1xufTtcbi8qKlxuICogQnVpbGRzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggYmFzZWQgb24gYSBmaWVsZCBvZiB2aWV3LlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5DYW1lcmEucHJvdG90eXBlLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvdiA9IHRoaXMuZm92ICogKE1hdGguUEkgLyAxODApOyAvLyBjb252ZXJ0IHRvIHJhZGlhbnNcbiAgICB2YXIgYXNwZWN0ID0gdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0O1xuICAgIHZhciBuZWFyID0gdGhpcy5uZWFyO1xuICAgIHZhciBmYXIgPSB0aGlzLmZhcjtcbiAgICB2YXIgbWF0cml4ID0gTWF0cml4Lnplcm8oKTtcbiAgICB2YXIgaGVpZ2h0ID0gKDEvTWF0aC50YW4oZm92LzIpKSAqIHRoaXMuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IGhlaWdodCAqIGFzcGVjdDtcblxuICAgIG1hdHJpeFswXSA9IHdpZHRoO1xuICAgIG1hdHJpeFs1XSA9IGhlaWdodDtcbiAgICBtYXRyaXhbMTBdID0gZmFyLyhuZWFyLWZhcikgO1xuICAgIG1hdHJpeFsxMV0gPSAtMTtcbiAgICBtYXRyaXhbMTRdID0gbmVhcipmYXIvKG5lYXItZmFyKTtcblxuICAgIHJldHVybiBtYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUuY3JlYXRlVmlld01hdHJpeCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGV5ZSA9IHRoaXMucG9zaXRpb247XG4gICAgdmFyIHBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaDtcbiAgICB2YXIgeWF3ID0gdGhpcy5yb3RhdGlvbi55YXc7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHBpdGNoKTtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4ocGl0Y2gpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3MoeWF3KTtcbiAgICB2YXIgc2luX3lhdyA9IE1hdGguc2luKHlhdyk7XG5cbiAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKGNvc195YXcsIDAsIC1zaW5feWF3ICk7XG4gICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcihzaW5feWF3ICogc2luX3BpdGNoLCBjb3NfcGl0Y2gsIGNvc195YXcgKiBzaW5fcGl0Y2ggKTtcbiAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKHNpbl95YXcgKiBjb3NfcGl0Y2gsIC1zaW5fcGl0Y2gsIGNvc19waXRjaCAqIGNvc195YXcgKTtcblxuICAgIHZhciB2aWV3X21hdHJpeCA9IE1hdHJpeC5mcm9tQXJyYXkoW1xuICAgICAgICB4YXhpcy54LCB5YXhpcy54LCB6YXhpcy54LCAwLFxuICAgICAgICB4YXhpcy55LCB5YXhpcy55LCB6YXhpcy55LCAwLFxuICAgICAgICB4YXhpcy56LCB5YXhpcy56LCB6YXhpcy56LCAwLFxuICAgICAgICAtKHhheGlzLmRvdChleWUpICksIC0oIHlheGlzLmRvdChleWUpICksIC0oIHpheGlzLmRvdChleWUpICksIDFcbiAgICBdKTtcbiAgICByZXR1cm4gdmlld19tYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSwgeil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IoeCx5LHopO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlUmlnaHQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciByaWdodCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChyaWdodCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVMZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgbGVmdCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQobGVmdCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbkNhbWVyYS5wcm90b3R5cGUudHVyblJpZ2h0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3IDwgMCl7XG4gICAgICAgIHRoaXMucm90YXRpb24ueWF3ID0gdGhpcy5yb3RhdGlvbi55YXcgKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLnR1cm5MZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3ID4gKE1hdGguUEkqMikpe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnlhdyA9IHRoaXMucm90YXRpb24ueWF3IC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5DYW1lcmEucHJvdG90eXBlLmxvb2tVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPiAoTWF0aC5QSSoyKSl7XG4gICAgICAgIHRoaXMucm90YXRpb24ucGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoIC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5sb29rRG93biA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPCAwKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi5waXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2ggKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIHVwID0gdGhpcy51cC5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmFkZCh1cCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVEb3duID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgZG93biA9IHRoaXMudXAubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChkb3duKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZUZvcndhcmQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBmb3J3YXJkID0gdGhpcy5kaXJlY3Rpb24oKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmFkZChmb3J3YXJkKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZUJhY2t3YXJkID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgYmFja3dhcmQgPSB0aGlzLmRpcmVjdGlvbigpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uc3VidHJhY3QoYmFja3dhcmQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuIiwiLyoqXG4gKiBFdmVudCBoYW5kbGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDEwIE5pY2hvbGFzIEMuIFpha2FzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG5mdW5jdGlvbiBFdmVudFRhcmdldCgpe1xuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xufVxuXG4vKiogQG1ldGhvZCAqL1xuRXZlbnRUYXJnZXQucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpe1xuICAgIGlmICh0eXBlb2YgdGhpcy5fbGlzdGVuZXJzW3R5cGVdID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzW3R5cGVdID0gW107XG4gICAgfVxuXG4gICAgdGhpcy5fbGlzdGVuZXJzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xufTtcbi8qKiBAbWV0aG9kICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgZXZlbnQgPSB7IHR5cGU6IGV2ZW50IH07XG4gICAgfVxuICAgIGlmICghZXZlbnQudGFyZ2V0KXtcbiAgICAgICAgZXZlbnQudGFyZ2V0ID0gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50LnR5cGUpeyAgLy9mYWxzeVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFdmVudCBvYmplY3QgbWlzc2luZyAndHlwZScgcHJvcGVydHkuXCIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9saXN0ZW5lcnNbZXZlbnQudHlwZV0gaW5zdGFuY2VvZiBBcnJheSl7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnQudHlwZV07XG4gICAgICAgIGZvciAodmFyIGk9MCwgbGVuPWxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICBsaXN0ZW5lcnNbaV0uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW3R5cGVdIGluc3RhbmNlb2YgQXJyYXkpe1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICBmb3IgKHZhciBpPTAsIGxlbj1saXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXSA9PT0gbGlzdGVuZXIpe1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50VGFyZ2V0OyIsInZhciBtYXRoID0gcmVxdWlyZSgnLi4vbWF0aC9tYXRoLmpzJyk7XG52YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi9jYW1lcmEuanMnKTtcbnZhciBFdmVudFRhcmdldCA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgS0VZQ09ERVMgPSByZXF1aXJlKCcuLi91dGlsaXR5L2tleWNvZGVzLmpzJyk7XG5cbnZhciBWZWN0b3IgPSBtYXRoLlZlY3RvcjtcbnZhciBNYXRyaXggPSBtYXRoLk1hdHJpeDtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7e2NhbnZhc19pZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn19IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gU2NlbmUob3B0aW9ucyl7XG4gICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGg7XG4gICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodDtcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdGlvbnMuY2FudmFzX2lkKTtcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlci53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgdGhpcy5fYmFja19idWZmZXIuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4ID0gdGhpcy5fYmFja19idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IG51bGw7XG4gICAgdGhpcy5fZGVwdGhfYnVmZmVyID0gW107XG4gICAgdGhpcy5kcmF3aW5nX21vZGUgPSAxO1xuICAgIHRoaXMuX2JhY2tmYWNlX2N1bGxpbmcgPSB0cnVlO1xuICAgIHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5pbGx1bWluYXRpb24gPSBuZXcgVmVjdG9yKDkwLDAsMCk7XG4gICAgLyoqIEB0eXBlIHtBcnJheS48TWVzaD59ICovXG4gICAgdGhpcy5tZXNoZXMgPSB7fTtcbiAgICAvKiogQHR5cGUge09iamVjdC48bnVtYmVyLCBib29sZWFuPn0gKi9cbiAgICB0aGlzLl9rZXlzID0ge307IC8vIEtleXMgY3VycmVudGx5IHByZXNzZWRcbiAgICB0aGlzLl9rZXlfY291bnQgPSAwOyAvLyBOdW1iZXIgb2Yga2V5cyBiZWluZyBwcmVzc2VkLi4uIHRoaXMgZmVlbHMga2x1ZGd5XG4gICAgLyoqIEB0eXBlIHs/bnVtYmVyfSAqL1xuICAgIHRoaXMuX2FuaW1faWQgPSBudWxsO1xuICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICB0aGlzLl9uZWVkc191cGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2RyYXdfbW9kZSA9ICd3aXJlZnJhbWUnO1xuICAgIHRoaXMuaW5pdCgpO1xufVxuU2NlbmUucHJvdG90eXBlID0gbmV3IEV2ZW50VGFyZ2V0KCk7XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuY2FudmFzLnRhYkluZGV4ID0gMTsgLy8gU2V0IHRhYiBpbmRleCB0byBhbGxvdyBjYW52YXMgdG8gaGF2ZSBmb2N1cyB0byByZWNlaXZlIGtleSBldmVudHNcbiAgICB0aGlzLl94X29mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDIpO1xuICAgIHRoaXMuX3lfb2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLmhlaWdodCAvIDIpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZURlcHRoQnVmZmVyKCk7XG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSB0aGlzLl9iYWNrX2J1ZmZlcl9jdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd24uYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5lbXB0eUtleXMuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIEV2ZW50VGFyZ2V0LmNhbGwodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbn07XG4vKipcbiAqIER1bXAgYWxsIHByZXNzZWQga2V5cyBvbiBibHVyLlxuICogQG1ldGhvZFxuICovXG5TY2VuZS5wcm90b3R5cGUuZW1wdHlLZXlzID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLl9rZXlfY291bnQgPSAwO1xuICAgIHRoaXMuX2tleXMgPSB7fTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmlzS2V5RG93biA9IGZ1bmN0aW9uKGtleSl7XG4gICAgcmV0dXJuIChLRVlDT0RFU1trZXldIGluIHRoaXMuX2tleXMpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub25LZXlEb3duID0gZnVuY3Rpb24oZSl7XG4gICAgdmFyIHByZXNzZWQgPSBlLmtleUNvZGUgfHwgZS53aGljaDtcbiAgICBpZiAoIXRoaXMuaXNLZXlEb3duKHByZXNzZWQpKXtcbiAgICAgICAgdGhpcy5fa2V5X2NvdW50ICs9IDE7XG4gICAgICAgIHRoaXMuX2tleXNbcHJlc3NlZF0gPSB0cnVlO1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9uS2V5VXAgPSBmdW5jdGlvbihlKXtcbiAgICB2YXIgcHJlc3NlZCA9IGUua2V5Q29kZSB8fCBlLndoaWNoO1xuICAgIGlmIChwcmVzc2VkIGluIHRoaXMuX2tleXMpe1xuICAgICAgICB0aGlzLl9rZXlfY291bnQgLT0gMTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2tleXNbcHJlc3NlZF07XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaW5pdGlhbGl6ZURlcHRoQnVmZmVyID0gZnVuY3Rpb24oKXtcbiAgICBmb3IgKHZhciB4ID0gMCwgbGVuID0gdGhpcy53aWR0aCAqIHRoaXMuaGVpZ2h0OyB4IDwgbGVuOyB4Kyspe1xuICAgICAgICB0aGlzLl9kZXB0aF9idWZmZXJbeF0gPSA5OTk5OTk5O1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9mZnNjcmVlbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgLy8gVE9ETzogTm90IHRvdGFsbHkgY2VydGFpbiB0aGF0IHo+MSBpbmRpY2F0ZXMgdmVjdG9yIGlzIGJlaGluZCBjYW1lcmEuXG4gICAgdmFyIHggPSB2ZWN0b3IueCArIHRoaXMuX3hfb2Zmc2V0O1xuICAgIHZhciB5ID0gdmVjdG9yLnkgKyB0aGlzLl95X29mZnNldDtcbiAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgIHJldHVybiAoeiA+IDEgfHwgeCA8IDAgfHwgeCA+IHRoaXMud2lkdGggfHwgeSA8IDAgfHwgeSA+IHRoaXMuaGVpZ2h0KTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdQaXhlbCA9IGZ1bmN0aW9uKHgsIHksIHosIGNvbG9yKXtcbiAgICB4ID0gTWF0aC5mbG9vcih4ICsgdGhpcy5feF9vZmZzZXQpO1xuICAgIHkgPSBNYXRoLmZsb29yKHkgKyB0aGlzLl95X29mZnNldCk7XG4gICAgaWYgKHggPj0gMCAmJiB4IDwgdGhpcy53aWR0aCAmJiB5ID49IDAgJiYgeSA8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHggKyAoeSAqIHRoaXMud2lkdGgpO1xuICAgICAgICBpZiAoeiA8IHRoaXMuX2RlcHRoX2J1ZmZlcltpbmRleF0pIHtcbiAgICAgICAgICAgIHZhciBpbWFnZV9kYXRhID0gdGhpcy5fYmFja19idWZmZXJfaW1hZ2UuZGF0YTtcbiAgICAgICAgICAgIHZhciBpID0gaW5kZXggKiA0O1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpXSA9IGNvbG9yLnI7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krMV0gPSBjb2xvci5nO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzJdID0gY29sb3IuYjtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSszXSA9IDI1NTtcbiAgICAgICAgICAgIHRoaXMuX2RlcHRoX2J1ZmZlcltpbmRleF0gPSB6O1xuICAgICAgICB9XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdFZGdlID0gZnVuY3Rpb24odmVjdG9yMSwgdmVjdG9yMiwgY29sb3Ipe1xuICAgIHZhciBhYnMgPSBNYXRoLmFicztcbiAgICBpZiAodmVjdG9yMS54ID4gdmVjdG9yMi54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2ZWN0b3IxO1xuICAgICAgICB2ZWN0b3IxID0gdmVjdG9yMjtcbiAgICAgICAgdmVjdG9yMiA9IHRlbXA7XG4gICAgfVxuICAgIHZhciBjdXJyZW50X3ggPSB2ZWN0b3IxLng7XG4gICAgdmFyIGN1cnJlbnRfeSA9IHZlY3RvcjEueTtcbiAgICB2YXIgY3VycmVudF96ID0gdmVjdG9yMS56O1xuICAgIHZhciBsb25nZXN0X2Rpc3QgPSBNYXRoLm1heChhYnModmVjdG9yMi54IC0gdmVjdG9yMS54KSwgYWJzKHZlY3RvcjIueSAtIHZlY3RvcjEueSksIGFicyh2ZWN0b3IyLnogLSB2ZWN0b3IxLnopKTtcbiAgICB2YXIgc3RlcF94ID0gKHZlY3RvcjIueCAtIHZlY3RvcjEueCkgLyBsb25nZXN0X2Rpc3Q7XG4gICAgdmFyIHN0ZXBfeSA9ICh2ZWN0b3IyLnkgLSB2ZWN0b3IxLnkpIC8gbG9uZ2VzdF9kaXN0O1xuICAgIHZhciBzdGVwX3ogPSAodmVjdG9yMi56IC0gdmVjdG9yMS56KSAvIGxvbmdlc3RfZGlzdDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9uZ2VzdF9kaXN0OyBpKyspe1xuICAgICAgICB0aGlzLmRyYXdQaXhlbChjdXJyZW50X3gsIGN1cnJlbnRfeSwgY3VycmVudF96LCBjb2xvcik7XG4gICAgICAgIGN1cnJlbnRfeCArPSBzdGVwX3g7XG4gICAgICAgIGN1cnJlbnRfeSArPSBzdGVwX3k7XG4gICAgICAgIGN1cnJlbnRfeiArPSBzdGVwX3o7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd1RyaWFuZ2xlID0gZnVuY3Rpb24odmVjdG9yMSwgdmVjdG9yMiwgdmVjdG9yMywgY29sb3Ipe1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMSwgdmVjdG9yMiwgY29sb3IpO1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMiwgdmVjdG9yMywgY29sb3IpO1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMywgdmVjdG9yMSwgY29sb3IpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd0ZsYXRCb3R0b21UcmlhbmdsZSA9IGZ1bmN0aW9uKHYxLCB2MiwgdjMsIGNvbG9yKXtcbiAgICAvLyBEcmF3IGxlZnQgdG8gcmlnaHRcbiAgICBpZiAodjIueCA+PSB2My54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2MztcbiAgICAgICAgdjMgPSB2MjtcbiAgICAgICAgdjIgPSB0ZW1wO1xuICAgIH1cbiAgICAvLyBjb21wdXRlIGRlbHRhc1xuICAgIHZhciBkeHlfbGVmdCAgPSAodjMueC12MS54KS8odjMueS12MS55KTtcbiAgICB2YXIgZHh5X3JpZ2h0ID0gKHYyLngtdjEueCkvKHYyLnktdjEueSk7XG4gICAgdmFyIHpfc2xvcGVfbGVmdCA9ICh2My56LXYxLnopLyh2My55LXYxLnkpO1xuICAgIHZhciB6X3Nsb3BlX3JpZ2h0ID0gKHYyLnotdjEueikvKHYyLnktdjEueSk7XG5cbiAgICAvLyBzZXQgc3RhcnRpbmcgYW5kIGVuZGluZyBwb2ludHMgZm9yIGVkZ2UgdHJhY2VcbiAgICB2YXIgeHMgPSBuZXcgVmVjdG9yKHYxLngsIHYxLnksIHYxLnopO1xuICAgIHZhciB4ZSA9IG5ldyBWZWN0b3IodjEueCwgdjEueSwgdjEueik7XG4gICAgeHMueiA9IHYzLnogKyAoKHYxLnkgLSB2My55KSAqIHpfc2xvcGVfbGVmdCk7XG4gICAgeGUueiA9IHYyLnogKyAoKHYxLnkgLSB2Mi55KSAqIHpfc2xvcGVfcmlnaHQpO1xuXG4gICAgLy8gZHJhdyBlYWNoIHNjYW5saW5lXG4gICAgZm9yICh2YXIgeT12MS55OyB5IDw9IHYyLnk7IHkrKyl7XG4gICAgICAgIHhzLnkgPSB5O1xuICAgICAgICB4ZS55ID0geTtcbiAgICAgICAgdGhpcy5kcmF3RWRnZSh4cywgeGUsIGNvbG9yKTtcblxuICAgICAgICAvLyBtb3ZlIGRvd24gb25lIHNjYW5saW5lXG4gICAgICAgIHhzLngrPWR4eV9sZWZ0O1xuICAgICAgICB4ZS54Kz1keHlfcmlnaHQ7XG4gICAgICAgIHhzLnorPXpfc2xvcGVfbGVmdDtcbiAgICAgICAgeGUueis9el9zbG9wZV9yaWdodDtcbiAgICB9XG59O1xuU2NlbmUucHJvdG90eXBlLmRyYXdGbGF0VG9wVHJpYW5nbGUgPSBmdW5jdGlvbih2MSwgdjIsIHYzLCBjb2xvcil7XG4gICAgLy8gRHJhdyBsZWZ0IHRvIHJpZ2h0XG4gICAgaWYgKHYxLnggPj0gdjIueCl7XG4gICAgICAgIHZhciB0ZW1wID0gdjE7XG4gICAgICAgIHYxID0gdjI7XG4gICAgICAgIHYyID0gdGVtcDtcbiAgICB9XG4gICAgLy8gY29tcHV0ZSBkZWx0YXNcbiAgICB2YXIgZHh5X2xlZnQgID0gKHYzLngtdjEueCkvKHYzLnktdjEueSk7XG4gICAgdmFyIGR4eV9yaWdodCA9ICh2My54LXYyLngpLyh2My55LXYyLnkpO1xuICAgIHZhciB6X3Nsb3BlX2xlZnQgPSAodjMuei12MS56KS8odjMueS12MS55KTtcbiAgICB2YXIgel9zbG9wZV9yaWdodCA9ICh2My56LXYyLnopLyh2My55LXYyLnkpO1xuXG4gICAgLy8gc2V0IHN0YXJ0aW5nIGFuZCBlbmRpbmcgcG9pbnRzIGZvciBlZGdlIHRyYWNlXG4gICAgdmFyIHhzID0gbmV3IFZlY3Rvcih2MS54LCB2MS55LCB2MS56KTtcbiAgICB2YXIgeGUgPSBuZXcgVmVjdG9yKHYyLngsIHYxLnksIHYxLnopO1xuXG4gICAgeHMueiA9IHYxLnogKyAoKHYxLnkgLSB2MS55KSAqIHpfc2xvcGVfbGVmdCk7XG4gICAgeGUueiA9IHYyLnogKyAoKHYxLnkgLSB2Mi55KSAqIHpfc2xvcGVfcmlnaHQpO1xuXG4gICAgLy8gZHJhdyBlYWNoIHNjYW5saW5lXG4gICAgZm9yICh2YXIgeT12MS55OyB5IDw9IHYzLnk7IHkrKyl7XG4gICAgICAgIHhzLnkgPSB5O1xuICAgICAgICB4ZS55ID0geTtcbiAgICAgICAgLy8gZHJhdyBhIGxpbmUgZnJvbSB4cyB0byB4ZSBhdCB5IGluIGNvbG9yIGNcbiAgICAgICAgdGhpcy5kcmF3RWRnZSh4cywgeGUsIGNvbG9yKTtcbiAgICAgICAgLy8gbW92ZSBkb3duIG9uZSBzY2FubGluZVxuICAgICAgICB4cy54Kz1keHlfbGVmdDtcbiAgICAgICAgeGUueCs9ZHh5X3JpZ2h0O1xuICAgICAgICB4cy56Kz16X3Nsb3BlX2xlZnQ7XG4gICAgICAgIHhlLnorPXpfc2xvcGVfcmlnaHQ7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZmlsbFRyaWFuZ2xlID0gZnVuY3Rpb24odjEsIHYyLCB2MywgY29sb3Ipe1xuICAgIC8vIERyYXcgZWRnZXMgZmlyc3RcbiAgICAvLyBUT0RPOiBGaXguIFRoaXMgaXMgYSBoYWNrLiBcbiAgICAvL3RoaXMuZHJhd1RyaWFuZ2xlKHYxLCB2MiwgdjMsIGNvbG9yKTtcbiAgICAvLyBTb3J0IHZlcnRpY2VzIGJ5IHkgdmFsdWVcbiAgICB2YXIgdGVtcDtcbiAgICBpZih2MS55ID4gdjIueSkge1xuICAgICAgICB0ZW1wID0gdjI7XG4gICAgICAgIHYyID0gdjE7XG4gICAgICAgIHYxID0gdGVtcDtcbiAgICB9XG4gICAgaWYodjIueSA+IHYzLnkpIHtcbiAgICAgICAgdGVtcCA9IHYyO1xuICAgICAgICB2MiA9IHYzO1xuICAgICAgICB2MyA9IHRlbXA7XG4gICAgfVxuICAgIGlmKHYxLnkgPiB2Mi55KSB7XG4gICAgICAgIHRlbXAgPSB2MjtcbiAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgdjEgPSB0ZW1wO1xuICAgIH1cbiAgICAvLyBUcmlhbmdsZSB3aXRoIG5vIGhlaWdodFxuICAgIGlmICgodjEueSAtIHYzLnkpID09PSAwKXtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzaG9ydF9zbG9wZSwgbG9uZ19zbG9wZTtcbiAgICBpZiAoKHYyLnkgLSB2MS55KSA9PT0gMCkge1xuICAgICAgICBzaG9ydF9zbG9wZSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2hvcnRfc2xvcGUgPSAodjIueCAtIHYxLngpIC8gKHYyLnkgLSB2MS55KTtcbiAgICB9XG4gICAgaWYgKCh2My55IC0gdjEueSkgPT09IDApIHtcbiAgICAgICAgbG9uZ19zbG9wZSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9uZ19zbG9wZSA9ICh2My54IC0gdjEueCkgLyAodjMueSAtIHYxLnkpO1xuICAgIH1cblxuICAgIGlmICh2Mi55ID09PSB2My55KXtcbiAgICAgICAgLy8gRmxhdCB0b3BcbiAgICAgICAgdGhpcy5kcmF3RmxhdEJvdHRvbVRyaWFuZ2xlKHYxLCB2MiwgdjMsIGNvbG9yKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodjEueSA9PT0gdjIueSApe1xuICAgICAgICAvLyBGbGF0IGJvdHRvbVxuICAgICAgICB0aGlzLmRyYXdGbGF0VG9wVHJpYW5nbGUodjEsIHYyLCB2MywgY29sb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlY29tcG9zZSBpbnRvIGZsYXQgdG9wIGFuZCBmbGF0IGJvdHRvbSB0cmlhbmdsZXNcbiAgICAgICAgdmFyIHpfc2xvcGUgPSAodjMueiAtIHYxLnopIC8gKHYzLnkgLSB2MS55KTtcbiAgICAgICAgdmFyIHggPSAoKHYyLnkgLSB2MS55KSpsb25nX3Nsb3BlKSArIHYxLng7XG4gICAgICAgIHZhciB6ID0gKCh2Mi55IC0gdjEueSkqel9zbG9wZSkgKyB2MS56O1xuICAgICAgICB2YXIgdjQgPSBuZXcgVmVjdG9yKHgsIHYyLnksIHopO1xuICAgICAgICB0aGlzLmRyYXdGbGF0Qm90dG9tVHJpYW5nbGUodjEsIHYyLCB2NCwgY29sb3IpO1xuICAgICAgICB0aGlzLmRyYXdGbGF0VG9wVHJpYW5nbGUodjIsIHY0LCB2MywgY29sb3IpO1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnJlbmRlclNjZW5lID0gZnVuY3Rpb24oKXtcbiAgICAvLyBUT0RPOiBTaW1wbGlmeSB0aGlzIGZ1bmN0aW9uLlxuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gdGhpcy5fYmFja19idWZmZXJfY3R4LmNyZWF0ZUltYWdlRGF0YSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5pbml0aWFsaXplRGVwdGhCdWZmZXIoKTtcbiAgICB2YXIgY2FtZXJhX21hdHJpeCA9IHRoaXMuY2FtZXJhLnZpZXdfbWF0cml4O1xuICAgIHZhciBwcm9qZWN0aW9uX21hdHJpeCA9IHRoaXMuY2FtZXJhLnBlcnNwZWN0aXZlRm92O1xuICAgIHZhciBsaWdodCA9IHRoaXMuaWxsdW1pbmF0aW9uO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLm1lc2hlcyl7XG4gICAgICAgIGlmICh0aGlzLm1lc2hlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKXtcbiAgICAgICAgICAgIHZhciBtZXNoID0gdGhpcy5tZXNoZXNba2V5XTtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IG1lc2guc2NhbGU7XG4gICAgICAgICAgICB2YXIgcm90YXRpb24gPSBtZXNoLnJvdGF0aW9uO1xuICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gbWVzaC5wb3NpdGlvbjtcbiAgICAgICAgICAgIHZhciB3b3JsZF9tYXRyaXggPSBNYXRyaXguc2NhbGUoc2NhbGUueCwgc2NhbGUueSwgc2NhbGUueikubXVsdGlwbHkoXG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uKHJvdGF0aW9uLnBpdGNoLCByb3RhdGlvbi55YXcsIHJvdGF0aW9uLnJvbGwpLm11bHRpcGx5KFxuICAgICAgICAgICAgICAgICAgICBNYXRyaXgudHJhbnNsYXRpb24ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueikpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbWVzaC5mYWNlcy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGZhY2UgPSBtZXNoLmZhY2VzW2tdLmZhY2U7XG4gICAgICAgICAgICAgICAgdmFyIGNvbG9yID0gbWVzaC5mYWNlc1trXS5jb2xvcjtcbiAgICAgICAgICAgICAgICB2YXIgdjEgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMF1dO1xuICAgICAgICAgICAgICAgIHZhciB2MiA9IG1lc2gudmVydGljZXNbZmFjZVsxXV07XG4gICAgICAgICAgICAgICAgdmFyIHYzID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzJdXTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbm9ybWFsXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQ2FuIHRoaXMgYmUgY2FsY3VsYXRlZCBqdXN0IG9uY2UsIGFuZCB0aGVuIHRyYW5zZm9ybWVkIGludG9cbiAgICAgICAgICAgICAgICAvLyBjYW1lcmEgc3BhY2U/XG4gICAgICAgICAgICAgICAgdmFyIGNhbV90b192ZXJ0ID0gdGhpcy5jYW1lcmEucG9zaXRpb24uc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlMSA9IHYyLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lkZTIgPSB2My50cmFuc2Zvcm0od29ybGRfbWF0cml4KS5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIG5vcm0gPSBzaWRlMS5jcm9zcyhzaWRlMik7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm0ubWFnbml0dWRlKCkgPD0gMC4wMDAwMDAwMSl7XG4gICAgICAgICAgICAgICAgICAgIG5vcm0gPSBub3JtO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm0gPSBub3JtLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBCYWNrZmFjZSBjdWxsaW5nLlxuICAgICAgICAgICAgICAgIGlmIChjYW1fdG9fdmVydC5kb3Qobm9ybSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgd3ZwX21hdHJpeCA9IHdvcmxkX21hdHJpeC5tdWx0aXBseShjYW1lcmFfbWF0cml4KS5tdWx0aXBseShwcm9qZWN0aW9uX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djEgPSB2MS50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djIgPSB2Mi50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djMgPSB2My50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkcmF3ID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IHN1cmZhY2Ugbm9ybWFsc1xuICAgICAgICAgICAgICAgICAgICAvLyB2YXIgZmFjZV90cmFucyA9IE1hdHJpeC50cmFuc2xhdGlvbih3djEueCwgd3YxLnksIHYxLnopO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdFZGdlKHd2MSwgbm9ybS5zY2FsZSgyMCkudHJhbnNmb3JtKGZhY2VfdHJhbnMpLCB7J3InOjI1NSxcImdcIjoyNTUsXCJiXCI6MjU1fSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGaXggZnJ1c3R1bSBjdWxsaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgcmVhbGx5IHN0dXBpZCBmcnVzdHVtIGN1bGxpbmcuLi4gdGhpcyBjYW4gcmVzdWx0IGluIHNvbWUgZmFjZXMgbm90IGJlaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGRyYXduIHdoZW4gdGhleSBzaG91bGQsIGUuZy4gd2hlbiBhIHRyaWFuZ2xlcyB2ZXJ0aWNlcyBzdHJhZGRsZSB0aGUgZnJ1c3RydW0uXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9mZnNjcmVlbih3djEpICYmIHRoaXMub2Zmc2NyZWVuKHd2MikgJiYgdGhpcy5vZmZzY3JlZW4od3YzKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYXcpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpZ2h0X2RpcmVjdGlvbiA9IGxpZ2h0LnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbGx1bWluYXRpb25fYW5nbGUgPSBub3JtLmRvdChsaWdodF9kaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBjb2xvci5saWdodGVuKGlsbHVtaW5hdGlvbl9hbmdsZS82KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbFRyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1RyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4LnB1dEltYWdlRGF0YSh0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSwgMCwgMCk7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIHRoaXMuY3R4LmRyYXdJbWFnZSh0aGlzLl9iYWNrX2J1ZmZlciwgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5hZGRNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgdGhpcy5tZXNoZXNbbWVzaC5uYW1lXSA9IG1lc2g7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5yZW1vdmVNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgZGVsZXRlIHRoaXMubWVzaGVzW21lc2gubmFtZV07XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLl9rZXlfY291bnQgPiAwKXtcbiAgICAgICAgdGhpcy5maXJlKCdrZXlkb3duJyk7XG4gICAgfVxuICAgIC8vIFRPRE86IEFkZCBrZXl1cCwgbW91c2Vkb3duLCBtb3VzZWRyYWcsIG1vdXNldXAsIGV0Yy5cbiAgICBpZiAodGhpcy5fbmVlZHNfdXBkYXRlKSB7XG4gICAgICAgIHRoaXMucmVuZGVyU2NlbmUoKTtcbiAgICAgICAgdGhpcy5fbmVlZHNfdXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2FuaW1faWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTtcbiIsInZhciBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvY29sb3IuanMnKTtcblxuLyoqXG4gKiBBIDNEIHRyaWFuZ2xlXG4gKiBAcGFyYW0ge251bWJlcn0gYSAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtudW1iZXJ9IGIgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7bnVtYmVyfSBjICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBGYWNlKGEsIGIsIGMsIGNvbG9yKXtcbiAgICB0aGlzLmZhY2UgPSBbYSwgYiwgY107XG4gICAgdGhpcy5jb2xvciA9IG5ldyBDb2xvcihjb2xvcik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmFjZTsiLCJ2YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3IuanMnKTtcbnZhciBNZXNoID0gcmVxdWlyZSgnLi9tZXNoLmpzJyk7XG52YXIgTWF0cml4ID0gcmVxdWlyZSgnLi9tYXRyaXguanMnKTtcbnZhciBGYWNlID0gcmVxdWlyZSgnLi9mYWNlLmpzJyk7XG5cbnZhciBtYXRoID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxubWF0aC5WZWN0b3IgPSBWZWN0b3I7XG5tYXRoLk1lc2ggPSBNZXNoO1xubWF0aC5NYXRyaXggPSBNYXRyaXg7XG5tYXRoLkZhY2UgPSBGYWNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGg7IiwiLyoqIFxuICogNHg0IG1hdHJpeC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYXRyaXgoKXtcbiAgICAvKiogQHR5cGUge0FycmF5LjxudW1iZXI+fSAqL1xuICAgIGZvciAodmFyIGk9MDsgaTwxNjsgaSsrKXtcbiAgICAgICAgdGhpc1tpXSA9IDA7XG4gICAgfVxuICAgIHRoaXMubGVuZ3RoID0gMTY7XG59XG4vKipcbiAqIENvbXBhcmUgbWF0cml4IHdpdGggc2VsZiBmb3IgZXF1YWxpdHkuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5NYXRyaXgucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBpZiAodGhpc1tpXSAhPT0gbWF0cml4W2ldKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG4vKipcbiAqIEFkZCBtYXRyaXggdG8gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gKyBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogU3VidHJhY3QgbWF0cml4IGZyb20gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gdGhpc1tpXSAtIG1hdHJpeFtpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBNdWx0aXBseSBzZWxmIGJ5IHNjYWxhci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uKHNjYWxhcil7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gdGhpc1tpXSAqIHNjYWxhcjtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBNdWx0aXBseSBzZWxmIGJ5IG1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9ICh0aGlzWzBdICogbWF0cml4WzBdKSArICh0aGlzWzFdICogbWF0cml4WzRdKSArICh0aGlzWzJdICogbWF0cml4WzhdKSArICh0aGlzWzNdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFsxXSA9ICh0aGlzWzBdICogbWF0cml4WzFdKSArICh0aGlzWzFdICogbWF0cml4WzVdKSArICh0aGlzWzJdICogbWF0cml4WzldKSArICh0aGlzWzNdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsyXSA9ICh0aGlzWzBdICogbWF0cml4WzJdKSArICh0aGlzWzFdICogbWF0cml4WzZdKSArICh0aGlzWzJdICogbWF0cml4WzEwXSkgKyAodGhpc1szXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbM10gPSAodGhpc1swXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs3XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzRdID0gKHRoaXNbNF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOF0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzVdID0gKHRoaXNbNF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzZdID0gKHRoaXNbNF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzddICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFs3XSA9ICh0aGlzWzRdICogbWF0cml4WzNdKSArICh0aGlzWzVdICogbWF0cml4WzddKSArICh0aGlzWzZdICogbWF0cml4WzExXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbOF0gPSAodGhpc1s4XSAqIG1hdHJpeFswXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTFdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs5XSA9ICh0aGlzWzhdICogbWF0cml4WzFdKSArICh0aGlzWzldICogbWF0cml4WzVdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzEwXSA9ICh0aGlzWzhdICogbWF0cml4WzJdKSArICh0aGlzWzldICogbWF0cml4WzZdKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTFdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxMV0gPSAodGhpc1s4XSAqIG1hdHJpeFszXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs3XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbMTJdID0gKHRoaXNbMTJdICogbWF0cml4WzBdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTVdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFsxM10gPSAodGhpc1sxMl0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMTNdICogbWF0cml4WzVdKSArICh0aGlzWzE0XSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzE0XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNl0pICsgKHRoaXNbMTRdICogbWF0cml4WzEwXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzE1XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbN10pICsgKHRoaXNbMTRdICogbWF0cml4WzExXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTVdKTtcbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE5lZ2F0ZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gLXRoaXNbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogVHJhbnNwb3NlIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBuZXdfbWF0cml4WzBdID0gdGhpc1swXTtcbiAgICBuZXdfbWF0cml4WzFdID0gdGhpc1s0XTtcbiAgICBuZXdfbWF0cml4WzJdID0gdGhpc1s4XTtcbiAgICBuZXdfbWF0cml4WzNdID0gdGhpc1sxMl07XG4gICAgbmV3X21hdHJpeFs0XSA9IHRoaXNbMV07XG4gICAgbmV3X21hdHJpeFs1XSA9IHRoaXNbNV07XG4gICAgbmV3X21hdHJpeFs2XSA9IHRoaXNbOV07XG4gICAgbmV3X21hdHJpeFs3XSA9IHRoaXNbMTNdO1xuICAgIG5ld19tYXRyaXhbOF0gPSB0aGlzWzJdO1xuICAgIG5ld19tYXRyaXhbOV0gPSB0aGlzWzZdO1xuICAgIG5ld19tYXRyaXhbMTBdID0gdGhpc1sxMF07XG4gICAgbmV3X21hdHJpeFsxMV0gPSB0aGlzWzE0XTtcbiAgICBuZXdfbWF0cml4WzEyXSA9IHRoaXNbM107XG4gICAgbmV3X21hdHJpeFsxM10gPSB0aGlzWzddO1xuICAgIG5ld19tYXRyaXhbMTRdID0gdGhpc1sxMV07XG4gICAgbmV3X21hdHJpeFsxNV0gPSB0aGlzWzE1XTtcbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB4LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25YID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeS1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzJdID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzhdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHotYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblogPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxXSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzRdID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSBheGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvbkF4aXMgPSBmdW5jdGlvbihheGlzLCB0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgdSA9IGF4aXMubm9ybWFsaXplKCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdS54O1xuICAgIHZhciB1eSA9IHUueTtcbiAgICB2YXIgdXogPSB1Lno7XG4gICAgdmFyIHh5ID0gdXggKiB1eTtcbiAgICB2YXIgeHogPSB1eCAqIHV6O1xuICAgIHZhciB5eiA9IHV5ICogdXo7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zICsgKCh1eCp1eCkqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzFdID0gKHh5KmNvczEpIC0gKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzJdID0gKHh6KmNvczEpKyh1eSpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9ICh4eSpjb3MxKSsodXoqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3MrKCh1eSp1eSkqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzZdID0gKHl6KmNvczEpLSh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs4XSA9ICh4eipjb3MxKS0odXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOV0gPSAoeXoqY29zMSkrKHV4KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcyArICgodXoqdXopKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4IGZyb20gcGl0Y2gsIHlhdywgYW5kIHJvbGxcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uID0gZnVuY3Rpb24ocGl0Y2gsIHlhdywgcm9sbCl7XG4gICAgcmV0dXJuIE1hdHJpeC5yb3RhdGlvblgocm9sbCkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWih5YXcpKS5tdWx0aXBseShNYXRyaXgucm90YXRpb25ZKHBpdGNoKSk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgdHJhbnNsYXRpb24gbWF0cml4IGZyb20geCwgeSwgYW5kIHogZGlzdGFuY2VzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC50cmFuc2xhdGlvbiA9IGZ1bmN0aW9uKHh0cmFucywgeXRyYW5zLCB6dHJhbnMpe1xuICAgIHZhciB0cmFuc2xhdGlvbl9tYXRyaXggPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTJdID0geHRyYW5zO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxM10gPSB5dHJhbnM7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzE0XSA9IHp0cmFucztcbiAgICByZXR1cm4gdHJhbnNsYXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHNjYWxpbmcgbWF0cml4IGZyb20geCwgeSwgYW5kIHogc2NhbGVcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnNjYWxlID0gZnVuY3Rpb24oeHNjYWxlLCB5c2NhbGUsIHpzY2FsZSl7XG4gICAgdmFyIHNjYWxpbmdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHNjYWxpbmdfbWF0cml4WzBdID0geHNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzVdID0geXNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzEwXSA9IHpzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiBzY2FsaW5nX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYW4gaWRlbnRpdHkgbWF0cml4XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5pZGVudGl0eSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGlkZW50aXR5ID0gbmV3IE1hdHJpeCgpO1xuICAgIGlkZW50aXR5WzBdID0gMTtcbiAgICBpZGVudGl0eVs1XSA9IDE7XG4gICAgaWRlbnRpdHlbMTBdID0gMTtcbiAgICBpZGVudGl0eVsxNV0gPSAxO1xuICAgIHJldHVybiBpZGVudGl0eTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB6ZXJvIG1hdHJpeFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguemVybyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBNYXRyaXgoKTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBuZXcgbWF0cml4IGZyb20gYW4gYXJyYXlcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LmZyb21BcnJheSA9IGZ1bmN0aW9uKGFycil7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IGFycltpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdHJpeDsiLCJ2YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3IuanMnKTtcbnZhciBGYWNlID0gcmVxdWlyZSgnLi9mYWNlLmpzJyk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtBcnJheS48VmVydGV4Pn0gdmVydGljZXNcbiAqIEBwYXJhbSB7QXJyYXkuPHtlZGdlOiBBcnJheS48bnVtYmVyPiwgY29sb3I6IHN0cmluZ30+fSBlZGdlc1xuICovXG5mdW5jdGlvbiBNZXNoKG5hbWUsIHZlcnRpY2VzLCBmYWNlcyl7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnZlcnRpY2VzID0gdmVydGljZXM7XG4gICAgdGhpcy5mYWNlcyA9IGZhY2VzO1xuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yKDAsIDAsIDApO1xuICAgIHRoaXMucm90YXRpb24gPSB7J3lhdyc6IDAsICdwaXRjaCc6IDAsICdyb2xsJzogMH07XG4gICAgdGhpcy5zY2FsZSA9IHsneCc6IDEsICd5JzogMSwgJ3onOiAxfTtcbn1cbk1lc2guZnJvbUpTT04gPSBmdW5jdGlvbihqc29uKXtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICB2YXIgZmFjZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0ganNvbi52ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIHZhciB2ZXJ0ZXggPSBqc29uLnZlcnRpY2VzW2ldO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoKG5ldyBWZWN0b3IodmVydGV4WzBdLCB2ZXJ0ZXhbMV0sIHZlcnRleFsyXSkpO1xuICAgIH1cbiAgICBmb3IgKHZhciBqID0gMCwgbG4gPSBqc29uLmZhY2VzLmxlbmd0aDsgaiA8IGxuOyBqKyspe1xuICAgICAgICB2YXIgZmFjZSA9IGpzb24uZmFjZXNbal07XG4gICAgICAgIGZhY2VzLnB1c2gobmV3IEZhY2UoZmFjZS5mYWNlWzBdLCBmYWNlLmZhY2VbMV0sIGZhY2UuZmFjZVsyXSwgZmFjZS5jb2xvcikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IE1lc2goanNvbi5uYW1lLCB2ZXJ0aWNlcywgZmFjZXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZXNoO1xuIiwiLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IHpcbiAqL1xuZnVuY3Rpb24gVmVjdG9yKHgsIHksIHope1xuICAgIGlmICh0eXBlb2YgeCA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHkgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB6ID09PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5zdWZmaWNpZW50IGFyZ3VtZW50cy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLnogPSB6O1xuICAgIH1cbn1cbi8qKlxuICogQWRkIHZlY3RvciB0byBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgdmVjdG9yLngsIHRoaXMueSArIHZlY3Rvci55LCB0aGlzLnogKyB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBTdWJ0cmFjdCB2ZWN0b3IgZnJvbSBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLSB2ZWN0b3IueCwgdGhpcy55IC0gdmVjdG9yLnksIHRoaXMueiAtIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIENvbXBhcmUgdmVjdG9yIHdpdGggc2VsZiBmb3IgZXF1YWxpdHlcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiB0aGlzLnggPT09IHZlY3Rvci54ICYmIHRoaXMueSA9PT0gdmVjdG9yLnkgJiYgdGhpcy56ID09PSB2ZWN0b3Iuejtcbn07XG4vKipcbiAqIEZpbmQgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hbmdsZSA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIGEgPSB0aGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBiID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBhbWFnID0gYS5tYWduaXR1ZGUoKTtcbiAgICB2YXIgYm1hZyA9IGIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSBhLmRvdChiKSAvIChhbWFnICogYm1hZyApO1xuICAgIGlmICh0aGV0YSA8IC0xKSB7dGhldGEgPSAtMTt9XG4gICAgaWYgKHRoZXRhID4gMSkge3RoZXRhID0gMTt9XG4gICAgcmV0dXJuIE1hdGguYWNvcyh0aGV0YSk7XG59O1xuLyoqXG4gKiBGaW5kIHRoZSBjb3Mgb2YgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY29zQW5nbGUgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBhID0gdGhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgYiA9IHZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICB2YXIgYW1hZyA9IGEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSBiLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gYS5kb3QoYikgLyAoYW1hZyAqIGJtYWcgKVxuICAgICAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiB0aGV0YTtcbn07XG4vKipcbiAqIEZpbmQgbWFnbml0dWRlIG9mIGEgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIE1hdGguc3FydCgodGhpcy54ICogdGhpcy54KSArICh0aGlzLnkgKiB0aGlzLnkpICsgKHRoaXMueiAqIHRoaXMueikpO1xufTtcbi8qKlxuICogRmluZCBtYWduaXR1ZGUgc3F1YXJlZCBvZiBhIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tYWduaXR1ZGVTcXVhcmVkID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gKHRoaXMueCAqIHRoaXMueCkgKyAodGhpcy55ICogdGhpcy55KSArICh0aGlzLnogKiB0aGlzLnopO1xufTtcbi8qKlxuICogRmluZCBkb3QgcHJvZHVjdCBvZiBzZWxmIGFuZCB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gKHRoaXMueCAqIHZlY3Rvci54KSArICh0aGlzLnkgKiB2ZWN0b3IueSkgKyAodGhpcy56ICogdmVjdG9yLnopO1xufTtcbi8qKlxuICogRmluZCBjcm9zcyBwcm9kdWN0IG9mIHNlbGYgYW5kIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jcm9zcyA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoXG4gICAgICAgICh0aGlzLnkgKiB2ZWN0b3IueikgLSAodGhpcy56ICogdmVjdG9yLnkpLFxuICAgICAgICAodGhpcy56ICogdmVjdG9yLngpIC0gKHRoaXMueCAqIHZlY3Rvci56KSxcbiAgICAgICAgKHRoaXMueCAqIHZlY3Rvci55KSAtICh0aGlzLnkgKiB2ZWN0b3IueClcbiAgICApO1xufTtcbi8qKlxuICogTm9ybWFsaXplIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKiBAdGhyb3dzIHtaZXJvRGl2aXNpb25FcnJvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbigpe1xuICAgIHZhciBtYWduaXR1ZGUgPSB0aGlzLm1hZ25pdHVkZSgpO1xuICAgIGlmIChtYWduaXR1ZGUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAvIG1hZ25pdHVkZSwgdGhpcy55IC8gbWFnbml0dWRlLCB0aGlzLnogLyBtYWduaXR1ZGUpO1xufTtcbi8qKlxuICogU2NhbGUgc2VsZiBieSBzY2FsZS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAqIHNjYWxlLCB0aGlzLnkgKiBzY2FsZSwgdGhpcy56ICogc2NhbGUpO1xufTtcbi8qKiBAbWV0aG9kICovXG5WZWN0b3IucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XG59O1xuLyoqXG4gKiBQcm9qZWN0IHNlbGYgb250byB2ZWN0b3JcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS52ZWN0b3JQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy5tYWduaXR1ZGUoKSAqIE1hdGguY29zKHRoaXMuYW5nbGUodmVjdG9yKSk7XG59O1xuLyoqXG4gKiBQcm9qZWN0IHNlbGYgb250byB2ZWN0b3JcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsYXJQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy5kb3QodmVjdG9yLm5vcm1hbGl6ZSgpKSAqIHZlY3Rvci5ub3JtYWxpemU7XG59O1xuLyoqXG4gKiBDb21wIHNlbGYgYW5kIHZlY3RvclxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNvbXBvbmVudCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgLy9BLmNvbXAoQikgPSBkb3QoQSxub3JtKEIpKVxuICAgIHJldHVybiB0aGlzLmRvdCh2ZWN0b3IpIC8gdGhpcy5tYWduaXR1ZGUoKTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCBheGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciB1ID0gYXhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB1Lng7XG4gICAgdmFyIHV5ID0gdS55O1xuICAgIHZhciB1eiA9IHUuejtcbiAgICB2YXIgeHkgPSB1LnggKiB1Lnk7XG4gICAgdmFyIHh6ID0gdS54ICogdS56O1xuICAgIHZhciB5eiA9IHUueSAqIHUuejtcbiAgICB2YXIgeCA9ICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy54KSArICgoKHh5KmNvczEpIC0gKHV6KnNpbikpICogdGhpcy55KSArICgoKHh6KmNvczEpKyh1eSpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHkgPSAoKCh4eSpjb3MxKSsodXoqc2luKSkgKiB0aGlzLngpICsgKChjb3MrKCh1eSp1eSkqY29zMSkpICogdGhpcy55KSArICgoKHl6KmNvczEpLSh1eCpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoKCh4eipjb3MxKS0odXkqc2luKSkgKiB0aGlzLngpICsgKCgoeXoqY29zMSkrKHV4KnNpbikpICogdGhpcy55KSArICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFBlcmZvcm0gbGluZWFyIHRyYW5mb3JtYXRpb24gb24gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSB0cmFuc2Zvcm1fbWF0cml4XG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24odHJhbnNmb3JtX21hdHJpeCl7XG4gICAgIHZhciB4ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMF0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNF0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOF0pICsgdHJhbnNmb3JtX21hdHJpeFsxMl07XG4gICAgdmFyIHkgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsxXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs1XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFs5XSkgKyB0cmFuc2Zvcm1fbWF0cml4WzEzXTtcbiAgICB2YXIgeiA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzJdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzZdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzEwXSkgKyB0cmFuc2Zvcm1fbWF0cml4WzE0XTtcbiAgICB2YXIgdyA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzNdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzddKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzExXSkgKyB0cmFuc2Zvcm1fbWF0cml4WzE1XTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4IC8gdywgeSAvIHcsIHogLyB3KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB4LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gKGNvcyAqIHRoaXMueSkgLSAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeiA9IChzaW4gKiB0aGlzLnkpICsgKGNvcyAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgeS1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKnRoaXMueCkgKyAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IC0oc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHotYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICogdGhpcy54KSAtIChzaW4gKiB0aGlzLnkpO1xuICAgIHZhciB5ID0gKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy55KTtcbiAgICB2YXIgeiA9IHRoaXMuejtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHBpdGNoLCB5YXcsIHJvbGxcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVQaXRjaFlhd1JvbGwgPSBmdW5jdGlvbihwaXRjaF9hbW50LCB5YXdfYW1udCwgcm9sbF9hbW50KSB7XG4gICAgcmV0dXJuIHRoaXMucm90YXRlWChyb2xsX2FtbnQpLnJvdGF0ZVkocGl0Y2hfYW1udCkucm90YXRlWih5YXdfYW1udCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjsiLCJ2YXIgcGFyc2VDb2xvciwgY2FjaGU7XG4vKipcbiAqIEEgY29sb3Igd2l0aCBib3RoIHJnYiBhbmQgaHNsIHJlcHJlc2VudGF0aW9ucy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIEFueSBsZWdhbCBDU1MgY29sb3IgdmFsdWUgKGhleCwgY29sb3Iga2V5d29yZCwgcmdiW2FdLCBoc2xbYV0pLlxuICovXG5mdW5jdGlvbiBDb2xvcihjb2xvcil7XG4gICAgdmFyIHBhcnNlZF9jb2xvciA9IHt9O1xuICAgIGlmIChjb2xvciBpbiBjYWNoZSl7XG4gICAgICAgIHBhcnNlZF9jb2xvciA9IGNhY2hlW2NvbG9yXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJzZWRfY29sb3IgPSBwYXJzZUNvbG9yKGNvbG9yKTtcbiAgICAgICAgY2FjaGVbY29sb3JdID0gcGFyc2VkX2NvbG9yO1xuICAgIH1cbiAgICB2YXIgaHNsID0gQ29sb3IucmdiVG9Ic2wocGFyc2VkX2NvbG9yLnIsIHBhcnNlZF9jb2xvci5nLCBwYXJzZWRfY29sb3IuYik7XG4gICAgdGhpcy5yZ2IgPSB7J3InOiBwYXJzZWRfY29sb3IuciwgJ2cnOiBwYXJzZWRfY29sb3IuZywgJ2InOiBwYXJzZWRfY29sb3IuYn07XG4gICAgdGhpcy5oc2wgPSB7J2gnOiBoc2wuaCwgJ3MnOiBoc2wucywgJ2wnOiBoc2wubH07XG4gICAgdGhpcy5hbHBoYSA9IHBhcnNlZF9jb2xvci5hIHx8IDE7XG59XG4vKipcbiAqIExpZ2h0ZW4gYSBjb2xvciBieSBwZXJjZW50IGFtb3VudC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3J9XG4gKi9cbkNvbG9yLnByb3RvdHlwZS5saWdodGVuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCArIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA+IDEpe1xuICAgICAgICBsdW0gPSAxO1xuICAgIH1cbiAgICB2YXIgbGlnaHRlciA9IENvbG9yLmhzbFRvUmdiKGhzbC5oLCBoc2wucywgbHVtKTtcbiAgICByZXR1cm4gbmV3IENvbG9yKFwicmdiKFwiICsgTWF0aC5mbG9vcihsaWdodGVyLnIpICsgXCIsXCIgKyBNYXRoLmZsb29yKGxpZ2h0ZXIuZykgKyBcIixcIiArIE1hdGguZmxvb3IobGlnaHRlci5iKSArIFwiKVwiKTtcbn07XG4vKipcbiAqIERhcmtlbiBhIGNvbG9yIGJ5IHBlcmNlbnQgYW1vdW50LlxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmRhcmtlbiA9IGZ1bmN0aW9uKHBlcmNlbnQpe1xuICAgIHZhciBoc2wgPSB0aGlzLmhzbDtcbiAgICB2YXIgbHVtID0gaHNsLmwgLSBwZXJjZW50O1xuICAgIGlmIChsdW0gPCAwKXtcbiAgICAgICAgbHVtID0gMDtcbiAgICB9XG4gICAgdmFyIGRhcmtlciA9IENvbG9yLmhzbFRvUmdiKGhzbC5oLCBoc2wucywgbHVtKTtcbiAgICByZXR1cm4gbmV3IENvbG9yKFwicmdiKFwiICsgTWF0aC5mbG9vcihkYXJrZXIucikgKyBcIixcIiArIE1hdGguZmxvb3IoZGFya2VyLmcpICsgXCIsXCIgKyBNYXRoLmZsb29yKGRhcmtlci5iKSArIFwiKVwiKTtcbn07XG5Db2xvci5oc2xUb1JnYiA9IGZ1bmN0aW9uKGgsIHMsIGwpe1xuICAgIGZ1bmN0aW9uIF92KG0xLCBtMiwgaHVlKXtcbiAgICAgICAgaHVlID0gaHVlICUgMTtcbiAgICAgICAgaWYgKGh1ZSA8IDApe2h1ZSs9MTt9XG4gICAgICAgIGlmIChodWUgPCAoMS82KSl7XG4gICAgICAgICAgICByZXR1cm4gbTEgKyAobTItbTEpKmh1ZSo2O1xuICAgICAgICB9XG4gICAgICAgIGlmIChodWUgPCAwLjUpe1xuICAgICAgICAgICAgcmV0dXJuIG0yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChodWUgPCAoMi8zKSl7XG4gICAgICAgICAgICByZXR1cm4gbTEgKyAobTItbTEpKigoMi8zKS1odWUpKjY7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0xO1xuICAgIH1cbiAgICB2YXIgbTI7XG4gICAgaWYgKHMgPT09IDApe1xuICAgICAgICByZXR1cm4geydyJzogbCwgJ2cnOiBsLCAnYic6IGx9O1xuICAgIH1cbiAgICBpZiAobCA8PSAwLjUpe1xuICAgICAgICBtMiA9IGwgKiAoMStzKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgbTIgPSBsK3MtKGwqcyk7XG4gICAgfVxuICAgIHZhciBtMSA9IDIqbCAtIG0yO1xuICAgIHJldHVybiB7J3InOiBfdihtMSwgbTIsIGgrKDEvMykpKjI1NSwgJ2cnOiBfdihtMSwgbTIsIGgpKjI1NSwgJ2InOiBfdihtMSwgbTIsIGgtKDEvMykpKjI1NX07XG59O1xuQ29sb3IucmdiVG9Ic2wgPSBmdW5jdGlvbihyLCBnLCBiKXtcbiAgICByID0gciAvIDI1NTtcbiAgICBnID0gZyAvIDI1NTtcbiAgICBiID0gYiAvIDI1NTtcbiAgICB2YXIgbWF4YyA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIHZhciBtaW5jID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgdmFyIGwgPSAobWluYyttYXhjKS8yO1xuICAgIHZhciBoLCBzO1xuICAgIGlmIChtaW5jID09PSBtYXhjKXtcbiAgICAgICAgcmV0dXJuIHsnaCc6IDAsICdzJzogMCwgJ2wnOiBsfTtcbiAgICB9XG4gICAgaWYgKGwgPD0gMC41KXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKG1heGMrbWluYyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvICgyLW1heGMtbWluYyk7XG4gICAgfVxuICAgIHZhciByYyA9IChtYXhjLXIpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGdjID0gKG1heGMtZykgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgYmMgPSAobWF4Yy1iKSAvIChtYXhjLW1pbmMpO1xuICAgIGlmIChyID09PSBtYXhjKXtcbiAgICAgICAgaCA9IGJjLWdjO1xuICAgIH1cbiAgICBlbHNlIGlmIChnID09PSBtYXhjKXtcbiAgICAgICAgaCA9IDIrcmMtYmM7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIGggPSA0K2djLXJjO1xuICAgIH1cbiAgICBoID0gKGgvNikgJSAxO1xuICAgIGlmIChoIDwgMCl7aCs9MTt9XG4gICAgcmV0dXJuIHsnaCc6IGgsICdzJzogcywgJ2wnOiBsfTtcbn07XG5cbi8qKlxuICogUGFyc2UgYSBDU1MgY29sb3IgdmFsdWUgYW5kIHJldHVybiBhbiByZ2JhIGNvbG9yIG9iamVjdC5cbiAqIEBwYXJhbSAge3N0cmluZ30gY29sb3IgQSBsZWdhbCBDU1MgY29sb3IgdmFsdWUgKGhleCwgY29sb3Iga2V5d29yZCwgcmdiW2FdLCBoc2xbYV0pLlxuICogQHJldHVybiB7e3I6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIGE6IG51bWJlcn19ICAgcmdiYSBjb2xvciBvYmplY3QuXG4gKiBAdGhyb3dzIHtDb2xvckVycm9yfSBJZiBpbGxlZ2FsIGNvbG9yIHZhbHVlIGlzIHBhc3NlZC5cbiAqL1xucGFyc2VDb2xvciA9IGZ1bmN0aW9uKGNvbG9yKXtcbiAgICAvLyBUT0RPOiBIb3cgY3Jvc3MtYnJvd3NlciBjb21wYXRpYmxlIGlzIHRoaXM/IEhvdyBlZmZpY2llbnQ/XG4gICAgLy8gTWFrZSBhIHRlbXBvcmFyeSBIVE1MIGVsZW1lbnQgc3R5bGVkIHdpdGggdGhlIGdpdmVuIGNvbG9yIHN0cmluZ1xuICAgIC8vIHRoZW4gZXh0cmFjdCBhbmQgcGFyc2UgdGhlIGNvbXB1dGVkIHJnYihhKSB2YWx1ZS5cbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xuICAgIHZhciByZ2JhID0gZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvcjtcbiAgICAvLyBDb252ZXJ0IHN0cmluZyBpbiBmb3JtICdyZ2JbYV0obnVtLCBudW0sIG51bVssIG51bV0pJyB0byBhcnJheSBbJ251bScsICdudW0nLCAnbnVtJ1ssICdudW0nXV1cbiAgICByZ2JhID0gcmdiYS5zbGljZShyZ2JhLmluZGV4T2YoJygnKSsxKS5zbGljZSgwLC0xKS5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XG4gICAgdmFyIHJldHVybl9jb2xvciA9IHt9O1xuICAgIHZhciBjb2xvcl9zcGFjZXMgPSBbJ3InLCAnZycsICdiJywgJ2EnXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJnYmEubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0KHJnYmFbaV0pOyAvLyBBbHBoYSB2YWx1ZSB3aWxsIGJlIGZsb2F0aW5nIHBvaW50LlxuICAgICAgICBpZiAoaXNOYU4odmFsdWUpKXtcbiAgICAgICAgICAgIHRocm93IFwiQ29sb3JFcnJvcjogU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBlcmhhcHMgXCIgKyBjb2xvciArIFwiIGlzIG5vdCBhIGxlZ2FsIENTUyBjb2xvciB2YWx1ZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuX2NvbG9yW2NvbG9yX3NwYWNlc1tpXV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0dXJuX2NvbG9yO1xufTtcbi8vIFByZS13YXJtIHRoZSBjYWNoZSB3aXRoIG5hbWVkIGNvbG9ycywgYXMgdGhlc2UgYXJlIG5vdFxuLy8gY29udmVydGVkIHRvIHJnYiB2YWx1ZXMgYnkgdGhlIHBhcnNlQ29sb3IgZnVuY3Rpb24gYWJvdmUuXG5jYWNoZSA9IHtcbiAgICBcImJsYWNrXCI6IHsgXCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMCwgXCJhXCI6IDF9LFxuICAgIFwic2lsdmVyXCI6IHsgXCJyXCI6IDE5MiwgXCJnXCI6IDE5MiwgXCJiXCI6IDE5MiwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC43NTI5NDExNzY0NzA1ODgyLCBcImFcIjogMX0sXG4gICAgXCJncmF5XCI6IHsgXCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC41MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJ3aGl0ZVwiOiB7IFwiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDEsIFwiYVwiOiAxfSxcbiAgICBcIm1hcm9vblwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEsIFwibFwiOiAwLjI1MDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJwdXJwbGVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcImZ1Y2hzaWFcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDEsIFwibFwiOiAwLjI1MDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJsaW1lXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJvbGl2ZVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDAsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcInllbGxvd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwibmF2eVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcImJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcInRlYWxcIjoge1wiclwiOiAwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuMjUwOTgwMzkyMTU2ODYyNzQsIFwiYVwiOiAxfSxcbiAgICBcImFxdWFcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwib3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTY1LCBcImJcIjogMCwgXCJoXCI6IDAuMTA3ODQzMTM3MjU0OTAxOTcsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJhbGljZWJsdWVcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjU3Nzc3Nzc3Nzc3Nzc3NzgsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJhbnRpcXVld2hpdGVcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyMzUsIFwiYlwiOiAyMTUsIFwiaFwiOiAwLjA5NTIzODA5NTIzODA5NTE5LCBcInNcIjogMC43Nzc3Nzc3Nzc3Nzc3Nzc5LCBcImxcIjogMC45MTE3NjQ3MDU4ODIzNTI5LCBcImFcIjogMX0sXG4gICAgXCJhcXVhbWFyaW5lXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMjEyLCBcImhcIjogMC40NDQwMTA0MTY2NjY2NjY3LCBcInNcIjogMSwgXCJsXCI6IDAuNzQ5MDE5NjA3ODQzMTM3MywgXCJhXCI6IDF9LFxuICAgIFwiYXp1cmVcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJiZWlnZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDIyMCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAwLjU1NTU1NTU1NTU1NTU1NiwgXCJsXCI6IDAuOTExNzY0NzA1ODgyMzUzLCBcImFcIjogMX0sXG4gICAgXCJiaXNxdWVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxOTYsIFwiaFwiOiAwLjA5MDM5NTQ4MDIyNTk4ODcxLCBcInNcIjogMSwgXCJsXCI6IDAuODg0MzEzNzI1NDkwMTk2LCBcImFcIjogMX0sXG4gICAgXCJibGFuY2hlZGFsbW9uZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIzNSwgXCJiXCI6IDIwNSwgXCJoXCI6IDAuMDk5OTk5OTk5OTk5OTk5OTQsIFwic1wiOiAxLCBcImxcIjogMC45MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcInJcIjogMTM4LCBcImdcIjogNDMsIFwiYlwiOiAyMjYsIFwiaFwiOiAwLjc1MzE4NzYxMzg0MzM1MTQsIFwic1wiOiAwLjc1OTMzNjA5OTU4NTA2MjEsIFwibFwiOiAwLjUyNzQ1MDk4MDM5MjE1NjksIFwiYVwiOiAxfSxcbiAgICBcImJyb3duXCI6IHtcInJcIjogMTY1LCBcImdcIjogNDIsIFwiYlwiOiA0MiwgXCJoXCI6IDAsIFwic1wiOiAwLjU5NDIwMjg5ODU1MDcyNDcsIFwibFwiOiAwLjQwNTg4MjM1Mjk0MTE3NjQ3LCBcImFcIjogMX0sXG4gICAgXCJidXJseXdvb2RcIjoge1wiclwiOiAyMjIsIFwiZ1wiOiAxODQsIFwiYlwiOiAxMzUsIFwiaFwiOiAwLjA5Mzg2OTczMTgwMDc2NjI2LCBcInNcIjogMC41Njg2Mjc0NTA5ODAzOTIyLCBcImxcIjogMC43LCBcImFcIjogMX0sXG4gICAgXCJjYWRldGJsdWVcIjoge1wiclwiOiA5NSwgXCJnXCI6IDE1OCwgXCJiXCI6IDE2MCwgXCJoXCI6IDAuNTA1MTI4MjA1MTI4MjA1MSwgXCJzXCI6IDAuMjU0OTAxOTYwNzg0MzEzNywgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiY2hhcnRyZXVzZVwiOiB7XCJyXCI6IDEyNywgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiAwLjI1MDMyNjc5NzM4NTYyMDksIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJjaG9jb2xhdGVcIjoge1wiclwiOiAyMTAsIFwiZ1wiOiAxMDUsIFwiYlwiOiAzMCwgXCJoXCI6IDAuMDY5NDQ0NDQ0NDQ0NDQ0NDMsIFwic1wiOiAwLjc0OTk5OTk5OTk5OTk5OTksIFwibFwiOiAwLjQ3MDU4ODIzNTI5NDExNzY0LCBcImFcIjogMX0sXG4gICAgXCJjb3JhbFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDEyNywgXCJiXCI6IDgwLCBcImhcIjogMC4wNDQ3NjE5MDQ3NjE5MDQ3NiwgXCJzXCI6IDEsIFwibFwiOiAwLjY1Njg2Mjc0NTA5ODAzOTIsIFwiYVwiOiAxfSxcbiAgICBcImNvcm5mbG93ZXJibHVlXCI6IHtcInJcIjogMTAwLCBcImdcIjogMTQ5LCBcImJcIjogMjM3LCBcImhcIjogMC42MDcwNTU5NjEwNzA1NTk2LCBcInNcIjogMC43OTE5MDc1MTQ0NTA4NjcyLCBcImxcIjogMC42NjA3ODQzMTM3MjU0OTAyLCBcImFcIjogMX0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0OCwgXCJiXCI6IDIyMCwgXCJoXCI6IDAuMTMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDEsIFwibFwiOiAwLjkzMTM3MjU0OTAxOTYwNzksIFwiYVwiOiAxfSxcbiAgICBcImNyaW1zb25cIjoge1wiclwiOiAyMjAsIFwiZ1wiOiAyMCwgXCJiXCI6IDYwLCBcImhcIjogMC45NjY2NjY2NjY2NjY2NjY3LCBcInNcIjogMC44MzMzMzMzMzMzMzMzMzM1LCBcImxcIjogMC40NzA1ODgyMzUyOTQxMTc2NCwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjI3MjU0OTAxOTYwNzg0MzEsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtjeWFuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEzOSwgXCJiXCI6IDEzOSwgXCJoXCI6IDAuNSwgXCJzXCI6IDEsIFwibFwiOiAwLjI3MjU0OTAxOTYwNzg0MzEsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiclwiOiAxODQsIFwiZ1wiOiAxMzQsIFwiYlwiOiAxMSwgXCJoXCI6IDAuMTE4NDk3MTA5ODI2NTg5NiwgXCJzXCI6IDAuODg3MTc5NDg3MTc5NDg3MiwgXCJsXCI6IDAuMzgyMzUyOTQxMTc2NDcwNTYsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtncmF5XCI6IHsgXCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC42NjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJkYXJrZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMTAwLCBcImJcIjogMCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDEsIFwibFwiOiAwLjE5NjA3ODQzMTM3MjU0OTAyLCBcImFcIjogMX0sXG4gICAgXCJkYXJrZ3JleVwiOiB7IFwiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNjYyNzQ1MDk4MDM5MjE1NywgXCJhXCI6IDF9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcInJcIjogMTg5LCBcImdcIjogMTgzLCBcImJcIjogMTA3LCBcImhcIjogMC4xNTQ0NzE1NDQ3MTU0NDcxMywgXCJzXCI6IDAuMzgzMTc3NTcwMDkzNDU4MDQsIFwibFwiOiAwLjU4MDM5MjE1Njg2Mjc0NTEsIFwiYVwiOiAxfSxcbiAgICBcImRhcmttYWdlbnRhXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDEsIFwibFwiOiAwLjI3MjU0OTAxOTYwNzg0MzEsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcInJcIjogODUsIFwiZ1wiOiAxMDcsIFwiYlwiOiA0NywgXCJoXCI6IDAuMjI3Nzc3Nzc3Nzc3Nzc3NzcsIFwic1wiOiAwLjM4OTYxMDM4OTYxMDM4OTYsIFwibFwiOiAwLjMwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtvcmFuZ2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNDAsIFwiYlwiOiAwLCBcImhcIjogMC4wOTE1MDMyNjc5NzM4NTYyMiwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtvcmNoaWRcIjoge1wiclwiOiAxNTMsIFwiZ1wiOiA1MCwgXCJiXCI6IDIwNCwgXCJoXCI6IDAuNzc4MTM4NTI4MTM4NTI4MSwgXCJzXCI6IDAuNjA2Mjk5MjEyNTk4NDI1MiwgXCJsXCI6IDAuNDk4MDM5MjE1Njg2Mjc0NSwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3JlZFwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEsIFwibFwiOiAwLjI3MjU0OTAxOTYwNzg0MzEsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiclwiOiAyMzMsIFwiZ1wiOiAxNTAsIFwiYlwiOiAxMjIsIFwiaFwiOiAwLjA0MjA0MjA0MjA0MjA0MjA0LCBcInNcIjogMC43MTYxMjkwMzIyNTgwNjQzLCBcImxcIjogMC42OTYwNzg0MzEzNzI1NDksIFwiYVwiOiAxfSxcbiAgICBcImRhcmtzZWFncmVlblwiOiB7XCJyXCI6IDE0MywgXCJnXCI6IDE4OCwgXCJiXCI6IDE0MywgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuMjUxMzk2NjQ4MDQ0NjkyOCwgXCJsXCI6IDAuNjQ5MDE5NjA3ODQzMTM3MywgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NsYXRlYmx1ZVwiOiB7XCJyXCI6IDcyLCBcImdcIjogNjEsIFwiYlwiOiAxMzksIFwiaFwiOiAwLjY5MDE3MDk0MDE3MDk0LCBcInNcIjogMC4zODk5OTk5OTk5OTk5OTk5LCBcImxcIjogMC4zOTIxNTY4NjI3NDUwOTgwMywgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDAuNSwgXCJzXCI6IDAuMjUzOTY4MjUzOTY4MjUzOTUsIFwibFwiOiAwLjI0NzA1ODgyMzUyOTQxMTc4LCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMC41LCBcInNcIjogMC4yNTM5NjgyNTM5NjgyNTM5NSwgXCJsXCI6IDAuMjQ3MDU4ODIzNTI5NDExNzgsIFwiYVwiOiAxfSxcbiAgICBcImRhcmt0dXJxdW9pc2VcIjoge1wiclwiOiAwLCBcImdcIjogMjA2LCBcImJcIjogMjA5LCBcImhcIjogMC41MDIzOTIzNDQ0OTc2MDc2LCBcInNcIjogMSwgXCJsXCI6IDAuNDA5ODAzOTIxNTY4NjI3NDQsIFwiYVwiOiAxfSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiclwiOiAxNDgsIFwiZ1wiOiAwLCBcImJcIjogMjExLCBcImhcIjogMC43ODM1NzAzMDAxNTc5Nzc4LCBcInNcIjogMSwgXCJsXCI6IDAuNDEzNzI1NDkwMTk2MDc4NCwgXCJhXCI6IDF9LFxuICAgIFwiZGVlcHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMCwgXCJiXCI6IDE0NywgXCJoXCI6IDAuOTA5OTI5MDc4MDE0MTg0NCwgXCJzXCI6IDEsIFwibFwiOiAwLjUzOTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDE5MSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNTQxODMwMDY1MzU5NDc3MSwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImRpbWdyYXlcIjogeyBcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjQxMTc2NDcwNTg4MjM1MjksIFwiYVwiOiAxfSxcbiAgICBcImRpbWdyZXlcIjogeyBcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjQxMTc2NDcwNTg4MjM1MjksIFwiYVwiOiAxfSxcbiAgICBcImRvZGdlcmJsdWVcIjoge1wiclwiOiAzMCwgXCJnXCI6IDE0NCwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNTgyMjIyMjIyMjIyMjIyMiwgXCJzXCI6IDEsIFwibFwiOiAwLjU1ODgyMzUyOTQxMTc2NDcsIFwiYVwiOiAxfSxcbiAgICBcImZpcmVicmlja1wiOiB7XCJyXCI6IDE3OCwgXCJnXCI6IDM0LCBcImJcIjogMzQsIFwiaFwiOiAwLCBcInNcIjogMC42NzkyNDUyODMwMTg4NjgsIFwibFwiOiAwLjQxNTY4NjI3NDUwOTgwMzksIFwiYVwiOiAxfSxcbiAgICBcImZsb3JhbHdoaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjQwLCBcImhcIjogMC4xMTExMTExMTExMTExMTEwMSwgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcInJcIjogMzQsIFwiZ1wiOiAxMzksIFwiYlwiOiAzNCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuNjA2OTM2NDE2MTg0OTcxMiwgXCJsXCI6IDAuMzM5MjE1Njg2Mjc0NTA5NzYsIFwiYVwiOiAxfSxcbiAgICBcImdhaW5zYm9yb1wiOiB7IFwiclwiOiAyMjAsIFwiZ1wiOiAyMjAsIFwiYlwiOiAyMjAsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuODYyNzQ1MDk4MDM5MjE1NywgXCJhXCI6IDF9LFxuICAgIFwiZ2hvc3R3aGl0ZVwiOiB7XCJyXCI6IDI0OCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjk4NjI3NDUwOTgwMzkyMTYsIFwiYVwiOiAxfSxcbiAgICBcImdvbGRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMTUsIFwiYlwiOiAwLCBcImhcIjogMC4xNDA1MjI4NzU4MTY5OTM0NiwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImdvbGRlbnJvZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDE2NSwgXCJiXCI6IDMyLCBcImhcIjogMC4xMTkxNzU2MjcyNDAxNDMzNywgXCJzXCI6IDAuNzQ0LCBcImxcIjogMC40OTAxOTYwNzg0MzEzNzI1MywgXCJhXCI6IDF9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiclwiOiAxNzMsIFwiZ1wiOiAyNTUsIFwiYlwiOiA0NywgXCJoXCI6IDAuMjMyMzcxNzk0ODcxNzk0ODUsIFwic1wiOiAxLCBcImxcIjogMC41OTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcImdyZXlcIjogeyBcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjUwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcImhvbmV5ZGV3XCI6IHtcInJcIjogMjQwLCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwiaG90cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDE4MCwgXCJoXCI6IDAuOTE2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjcwNTg4MjM1Mjk0MTE3NjQsIFwiYVwiOiAxfSxcbiAgICBcImluZGlhbnJlZFwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDkyLCBcImJcIjogOTIsIFwiaFwiOiAwLCBcInNcIjogMC41MzA1MTY0MzE5MjQ4ODI3LCBcImxcIjogMC41ODIzNTI5NDExNzY0NzA2LCBcImFcIjogMX0sXG4gICAgXCJpbmRpZ29cIjoge1wiclwiOiA3NSwgXCJnXCI6IDAsIFwiYlwiOiAxMzAsIFwiaFwiOiAwLjc2MjgyMDUxMjgyMDUxMjgsIFwic1wiOiAxLCBcImxcIjogMC4yNTQ5MDE5NjA3ODQzMTM3LCBcImFcIjogMX0sXG4gICAgXCJpdm9yeVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI0MCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJraGFraVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDIzMCwgXCJiXCI6IDE0MCwgXCJoXCI6IDAuMTUsIFwic1wiOiAwLjc2OTIzMDc2OTIzMDc2OTIsIFwibFwiOiAwLjc0NTA5ODAzOTIxNTY4NjMsIFwiYVwiOiAxfSxcbiAgICBcImxhdmVuZGVyXCI6IHtcInJcIjogMjMwLCBcImdcIjogMjMwLCBcImJcIjogMjUwLCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcImxcIjogMC45NDExNzY0NzA1ODgyMzUzLCBcImFcIjogMX0sXG4gICAgXCJsYXZlbmRlcmJsdXNoXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQwLCBcImJcIjogMjQ1LCBcImhcIjogMC45NDQ0NDQ0NDQ0NDQ0NDQzLCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwibGF3bmdyZWVuXCI6IHtcInJcIjogMTI0LCBcImdcIjogMjUyLCBcImJcIjogMCwgXCJoXCI6IDAuMjUxMzIyNzUxMzIyNzUxMzQsIFwic1wiOiAxLCBcImxcIjogMC40OTQxMTc2NDcwNTg4MjM1NSwgXCJhXCI6IDF9LFxuICAgIFwibGVtb25jaGlmZm9uXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjA1LCBcImhcIjogMC4xNDk5OTk5OTk5OTk5OTk5NywgXCJzXCI6IDEsIFwibFwiOiAwLjkwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDIxNiwgXCJiXCI6IDIzMCwgXCJoXCI6IDAuNTQwOTM1NjcyNTE0NjE5OCwgXCJzXCI6IDAuNTMyNzEwMjgwMzczODMxNiwgXCJsXCI6IDAuNzkwMTk2MDc4NDMxMzcyNiwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRjb3JhbFwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLjc4ODczMjM5NDM2NjE5NzEsIFwibFwiOiAwLjcyMTU2ODYyNzQ1MDk4MDQsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Y3lhblwiOiB7XCJyXCI6IDIyNCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNSwgXCJzXCI6IDEsIFwibFwiOiAwLjkzOTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IHtcInJcIjogMjUwLCBcImdcIjogMjUwLCBcImJcIjogMjEwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDAuODAwMDAwMDAwMDAwMDAwMiwgXCJsXCI6IDAuOTAxOTYwNzg0MzEzNzI1NCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRncmF5XCI6IHsgXCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC44Mjc0NTA5ODAzOTIxNTY4LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGdyZWVuXCI6IHtcInJcIjogMTQ0LCBcImdcIjogMjM4LCBcImJcIjogMTQ0LCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC43MzQzNzUsIFwibFwiOiAwLjc0OTAxOTYwNzg0MzEzNzMsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Z3JleVwiOiB7IFwiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuODI3NDUwOTgwMzkyMTU2OCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTgyLCBcImJcIjogMTkzLCBcImhcIjogMC45NzQ4ODU4NDQ3NDg4NTg0LCBcInNcIjogMSwgXCJsXCI6IDAuODU2ODYyNzQ1MDk4MDM5MywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzYWxtb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNjAsIFwiYlwiOiAxMjIsIFwiaFwiOiAwLjA0NzYxOTA0NzYxOTA0NzU5NiwgXCJzXCI6IDEsIFwibFwiOiAwLjczOTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c2VhZ3JlZW5cIjoge1wiclwiOiAzMiwgXCJnXCI6IDE3OCwgXCJiXCI6IDE3MCwgXCJoXCI6IDAuNDkwODY3NTc5OTA4Njc1NzQsIFwic1wiOiAwLjY5NTIzODA5NTIzODA5NTIsIFwibFwiOiAwLjQxMTc2NDcwNTg4MjM1MjksIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDI1MCwgXCJoXCI6IDAuNTYzNzY4MTE1OTQyMDI4OSwgXCJzXCI6IDAuOTIsIFwibFwiOiAwLjc1NDkwMTk2MDc4NDMxMzcsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c2xhdGVncmF5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMC41ODMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC4xNDI4NTcxNDI4NTcxNDI4NSwgXCJsXCI6IDAuNTMzMzMzMzMzMzMzMzMzMywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzbGF0ZWdyZXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAwLjU4MzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjE0Mjg1NzE0Mjg1NzE0Mjg1LCBcImxcIjogMC41MzMzMzMzMzMzMzMzMzMzLCBcImFcIjogMX0sXG4gICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDE3NiwgXCJnXCI6IDE5NiwgXCJiXCI6IDIyMiwgXCJoXCI6IDAuNTk0MjAyODk4NTUwNzI0NiwgXCJzXCI6IDAuNDEwNzE0Mjg1NzE0Mjg1NzUsIFwibFwiOiAwLjc4MDM5MjE1Njg2Mjc0NTEsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjI0LCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjkzOTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJyXCI6IDUwLCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjYwNzg0MzEzNzI1NDkwMiwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwibGluZW5cIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyMzAsIFwiaFwiOiAwLjA4MzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcImxcIjogMC45NDExNzY0NzA1ODgyMzUzLCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcInJcIjogMTAyLCBcImdcIjogMjA1LCBcImJcIjogMTcwLCBcImhcIjogMC40NDMzNjU2OTU3OTI4ODAyLCBcInNcIjogMC41MDczODkxNjI1NjE1NzY0LCBcImxcIjogMC42MDE5NjA3ODQzMTM3MjU2LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyMDUsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC40MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1vcmNoaWRcIjoge1wiclwiOiAxODYsIFwiZ1wiOiA4NSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAuODAwMjY0NTUwMjY0NTUwMiwgXCJzXCI6IDAuNTg4Nzg1MDQ2NzI4OTcxOCwgXCJsXCI6IDAuNTgwMzkyMTU2ODYyNzQ1LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiclwiOiAxNDcsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTksIFwiaFwiOiAwLjcyMTE4MzgwMDYyMzA1MywgXCJzXCI6IDAuNTk3NzY1MzYzMTI4NDkxNiwgXCJsXCI6IDAuNjQ5MDE5NjA3ODQzMTM3MiwgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtc2VhZ3JlZW5cIjoge1wiclwiOiA2MCwgXCJnXCI6IDE3OSwgXCJiXCI6IDExMywgXCJoXCI6IDAuNDA3NTYzMDI1MjEwMDg0MSwgXCJzXCI6IDAuNDk3OTA3OTQ5NzkwNzk0OTUsIFwibFwiOiAwLjQ2ODYyNzQ1MDk4MDM5MjE2LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjoge1wiclwiOiAxMjMsIFwiZ1wiOiAxMDQsIFwiYlwiOiAyMzgsIFwiaFwiOiAwLjY5MDI5ODUwNzQ2MjY4NjUsIFwic1wiOiAwLjc5NzYxOTA0NzYxOTA0NzcsIFwibFwiOiAwLjY3MDU4ODIzNTI5NDExNzcsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1MCwgXCJiXCI6IDE1NCwgXCJoXCI6IDAuNDM2LCBcInNcIjogMSwgXCJsXCI6IDAuNDkwMTk2MDc4NDMxMzcyNTMsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJyXCI6IDcyLCBcImdcIjogMjA5LCBcImJcIjogMjA0LCBcImhcIjogMC40OTM5MTcyNzQ5MzkxNzI3NiwgXCJzXCI6IDAuNTk4MjUzMjc1MTA5MTcwMywgXCJsXCI6IDAuNTUwOTgwMzkyMTU2ODYyOCwgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtdmlvbGV0cmVkXCI6IHtcInJcIjogMTk5LCBcImdcIjogMjEsIFwiYlwiOiAxMzMsIFwiaFwiOiAwLjg5NTEzMTA4NjE0MjMyMjEsIFwic1wiOiAwLjgwOTA5MDkwOTA5MDkwOSwgXCJsXCI6IDAuNDMxMzcyNTQ5MDE5NjA3ODYsIFwiYVwiOiAxfSxcbiAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiB7XCJyXCI6IDI1LCBcImdcIjogMjUsIFwiYlwiOiAxMTIsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAwLjYzNTAzNjQ5NjM1MDM2NSwgXCJsXCI6IDAuMjY4NjI3NDUwOTgwMzkyMTUsIFwiYVwiOiAxfSxcbiAgICBcIm1pbnRjcmVhbVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1MCwgXCJoXCI6IDAuNDE2NjY2NjY2NjY2NjY2NDYsIFwic1wiOiAxLCBcImxcIjogMC45ODAzOTIxNTY4NjI3NDUyLCBcImFcIjogMX0sXG4gICAgXCJtaXN0eXJvc2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAyMjUsIFwiaFwiOiAwLjAxNjY2NjY2NjY2NjY2Njc1NywgXCJzXCI6IDEsIFwibFwiOiAwLjk0MTE3NjQ3MDU4ODIzNTMsIFwiYVwiOiAxfSxcbiAgICBcIm1vY2Nhc2luXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMTgxLCBcImhcIjogMC4xMDU4NTU4NTU4NTU4NTU4OCwgXCJzXCI6IDEsIFwibFwiOiAwLjg1NDkwMTk2MDc4NDMxMzgsIFwiYVwiOiAxfSxcbiAgICBcIm5hdmFqb3doaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjIyLCBcImJcIjogMTczLCBcImhcIjogMC4wOTk1OTM0OTU5MzQ5NTkzNiwgXCJzXCI6IDEsIFwibFwiOiAwLjgzOTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcIm9sZGxhY2VcIjoge1wiclwiOiAyNTMsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMzAsIFwiaFwiOiAwLjEwODY5NTY1MjE3MzkxMzA0LCBcInNcIjogMC44NTE4NTE4NTE4NTE4NTIzLCBcImxcIjogMC45NDcwNTg4MjM1Mjk0MTE3LCBcImFcIjogMX0sXG4gICAgXCJvbGl2ZWRyYWJcIjoge1wiclwiOiAxMDcsIFwiZ1wiOiAxNDIsIFwiYlwiOiAzNSwgXCJoXCI6IDAuMjIxMTgzODAwNjIzMDUyOTYsIFwic1wiOiAwLjYwNDUxOTc3NDAxMTI5OTQsIFwibFwiOiAwLjM0NzA1ODgyMzUyOTQxMTc1LCBcImFcIjogMX0sXG4gICAgXCJvcmFuZ2VyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA2OSwgXCJiXCI6IDAsIFwiaFwiOiAwLjA0NTA5ODAzOTIxNTY4NjI2LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwib3JjaGlkXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTEyLCBcImJcIjogMjE0LCBcImhcIjogMC44Mzk2MjI2NDE1MDk0MzM5LCBcInNcIjogMC41ODg4ODg4ODg4ODg4ODg5LCBcImxcIjogMC42NDcwNTg4MjM1Mjk0MTE3LCBcImFcIjogMX0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcInJcIjogMjM4LCBcImdcIjogMjMyLCBcImJcIjogMTcwLCBcImhcIjogMC4xNTE5NjA3ODQzMTM3MjU0OCwgXCJzXCI6IDAuNjY2NjY2NjY2NjY2NjY2NywgXCJsXCI6IDAuOCwgXCJhXCI6IDF9LFxuICAgIFwicGFsZWdyZWVuXCI6IHtcInJcIjogMTUyLCBcImdcIjogMjUxLCBcImJcIjogMTUyLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC45MjUyMzM2NDQ4NTk4MTMxLCBcImxcIjogMC43OTAxOTYwNzg0MzEzNzI1LCBcImFcIjogMX0sXG4gICAgXCJwYWxldHVycXVvaXNlXCI6IHtcInJcIjogMTc1LCBcImdcIjogMjM4LCBcImJcIjogMjM4LCBcImhcIjogMC41LCBcInNcIjogMC42NDk0ODQ1MzYwODI0NzQzLCBcImxcIjogMC44MDk4MDM5MjE1Njg2Mjc1LCBcImFcIjogMX0sXG4gICAgXCJwYWxldmlvbGV0cmVkXCI6IHtcInJcIjogMjE5LCBcImdcIjogMTEyLCBcImJcIjogMTQ3LCBcImhcIjogMC45NDU0ODI4NjYwNDM2MTM4LCBcInNcIjogMC41OTc3NjUzNjMxMjg0OTE2LCBcImxcIjogMC42NDkwMTk2MDc4NDMxMzcyLCBcImFcIjogMX0sXG4gICAgXCJwYXBheWF3aGlwXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM5LCBcImJcIjogMjEzLCBcImhcIjogMC4xMDMxNzQ2MDMxNzQ2MDMxNSwgXCJzXCI6IDEsIFwibFwiOiAwLjkxNzY0NzA1ODgyMzUyOTUsIFwiYVwiOiAxfSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxOCwgXCJiXCI6IDE4NSwgXCJoXCI6IDAuMDc4NTcxNDI4NTcxNDI4NTYsIFwic1wiOiAxLCBcImxcIjogMC44NjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJwZXJ1XCI6IHtcInJcIjogMjA1LCBcImdcIjogMTMzLCBcImJcIjogNjMsIFwiaFwiOiAwLjA4MjE1OTYyNDQxMzE0NTU1LCBcInNcIjogMC41ODY3NzY4NTk1MDQxMzIzLCBcImxcIjogMC41MjU0OTAxOTYwNzg0MzE0LCBcImFcIjogMX0sXG4gICAgXCJwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTkyLCBcImJcIjogMjAzLCBcImhcIjogMC45NzA4OTk0NzA4OTk0NzA5LCBcInNcIjogMSwgXCJsXCI6IDAuODc2NDcwNTg4MjM1Mjk0MSwgXCJhXCI6IDF9LFxuICAgIFwicGx1bVwiOiB7XCJyXCI6IDIyMSwgXCJnXCI6IDE2MCwgXCJiXCI6IDIyMSwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuNDcyODY4MjE3MDU0MjYzNywgXCJsXCI6IDAuNzQ3MDU4ODIzNTI5NDExOCwgXCJhXCI6IDF9LFxuICAgIFwicG93ZGVyYmx1ZVwiOiB7XCJyXCI6IDE3NiwgXCJnXCI6IDIyNCwgXCJiXCI6IDIzMCwgXCJoXCI6IDAuNTE4NTE4NTE4NTE4NTE4NiwgXCJzXCI6IDAuNTE5MjMwNzY5MjMwNzY5MiwgXCJsXCI6IDAuNzk2MDc4NDMxMzcyNTQ5MSwgXCJhXCI6IDF9LFxuICAgIFwicm9zeWJyb3duXCI6IHtcInJcIjogMTg4LCBcImdcIjogMTQzLCBcImJcIjogMTQzLCBcImhcIjogMCwgXCJzXCI6IDAuMjUxMzk2NjQ4MDQ0NjkyOCwgXCJsXCI6IDAuNjQ5MDE5NjA3ODQzMTM3MywgXCJhXCI6IDF9LFxuICAgIFwicm95YWxibHVlXCI6IHtcInJcIjogNjUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAyMjUsIFwiaFwiOiAwLjYyNSwgXCJzXCI6IDAuNzI3MjcyNzI3MjcyNzI3MiwgXCJsXCI6IDAuNTY4NjI3NDUwOTgwMzkyMSwgXCJhXCI6IDF9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiclwiOiAxMzksIFwiZ1wiOiA2OSwgXCJiXCI6IDE5LCBcImhcIjogMC4wNjk0NDQ0NDQ0NDQ0NDQ0MywgXCJzXCI6IDAuNzU5NDkzNjcwODg2MDc2LCBcImxcIjogMC4zMDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJzYWxtb25cIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMTQsIFwiaFwiOiAwLjAxNzE1Njg2Mjc0NTA5ODAxNiwgXCJzXCI6IDAuOTMxNTA2ODQ5MzE1MDY4MywgXCJsXCI6IDAuNzEzNzI1NDkwMTk2MDc4NCwgXCJhXCI6IDF9LFxuICAgIFwic2FuZHlicm93blwiOiB7XCJyXCI6IDI0NCwgXCJnXCI6IDE2NCwgXCJiXCI6IDk2LCBcImhcIjogMC4wNzY1NzY1NzY1NzY1NzY1OSwgXCJzXCI6IDAuODcwNTg4MjM1Mjk0MTE3OSwgXCJsXCI6IDAuNjY2NjY2NjY2NjY2NjY2NywgXCJhXCI6IDF9LFxuICAgIFwic2VhZ3JlZW5cIjoge1wiclwiOiA0NiwgXCJnXCI6IDEzOSwgXCJiXCI6IDg3LCBcImhcIjogMC40MDY4MTAwMzU4NDIyOTM5LCBcInNcIjogMC41MDI3MDI3MDI3MDI3MDI2LCBcImxcIjogMC4zNjI3NDUwOTgwMzkyMTU3LCBcImFcIjogMX0sXG4gICAgXCJzZWFzaGVsbFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDIzOCwgXCJoXCI6IDAuMDY4NjI3NDUwOTgwMzkyMiwgXCJzXCI6IDEsIFwibFwiOiAwLjk2NjY2NjY2NjY2NjY2NjcsIFwiYVwiOiAxfSxcbiAgICBcInNpZW5uYVwiOiB7XCJyXCI6IDE2MCwgXCJnXCI6IDgyLCBcImJcIjogNDUsIFwiaFwiOiAwLjA1MzYyMzE4ODQwNTc5NzEwNiwgXCJzXCI6IDAuNTYwOTc1NjA5NzU2MDk3NSwgXCJsXCI6IDAuNDAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwic2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDIzNSwgXCJoXCI6IDAuNTQ4MzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuNzE0Mjg1NzE0Mjg1NzE0LCBcImxcIjogMC43MjU0OTAxOTYwNzg0MzEzLCBcImFcIjogMX0sXG4gICAgXCJzbGF0ZWJsdWVcIjoge1wiclwiOiAxMDYsIFwiZ1wiOiA5MCwgXCJiXCI6IDIwNSwgXCJoXCI6IDAuNjg5ODU1MDcyNDYzNzY4MSwgXCJzXCI6IDAuNTM0ODgzNzIwOTMwMjMyNiwgXCJsXCI6IDAuNTc4NDMxMzcyNTQ5MDE5NywgXCJhXCI6IDF9LFxuICAgIFwic2xhdGVncmF5XCI6IHtcInJcIjogMTEyLCBcImdcIjogMTI4LCBcImJcIjogMTQ0LCBcImhcIjogMC41ODMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC4xMjU5ODQyNTE5Njg1MDM5NCwgXCJsXCI6IDAuNTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwic2xhdGVncmV5XCI6IHtcInJcIjogMTEyLCBcImdcIjogMTI4LCBcImJcIjogMTQ0LCBcImhcIjogMC41ODMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC4xMjU5ODQyNTE5Njg1MDM5NCwgXCJsXCI6IDAuNTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwic25vd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI1MCwgXCJoXCI6IDAsIFwic1wiOiAxLCBcImxcIjogMC45OTAxOTYwNzg0MzEzNzI2LCBcImFcIjogMX0sXG4gICAgXCJzcHJpbmdncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAxMjcsIFwiaFwiOiAwLjQxNjMzOTg2OTI4MTA0NTc3LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwic3RlZWxibHVlXCI6IHtcInJcIjogNzAsIFwiZ1wiOiAxMzAsIFwiYlwiOiAxODAsIFwiaFwiOiAwLjU3NTc1NzU3NTc1NzU3NTgsIFwic1wiOiAwLjQ0LCBcImxcIjogMC40OTAxOTYwNzg0MzEzNzI2LCBcImFcIjogMX0sXG4gICAgXCJ0YW5cIjoge1wiclwiOiAyMTAsIFwiZ1wiOiAxODAsIFwiYlwiOiAxNDAsIFwiaFwiOiAwLjA5NTIzODA5NTIzODA5NTI3LCBcInNcIjogMC40Mzc0OTk5OTk5OTk5OTk5LCBcImxcIjogMC42ODYyNzQ1MDk4MDM5MjE2LCBcImFcIjogMX0sXG4gICAgXCJ0aGlzdGxlXCI6IHtcInJcIjogMjE2LCBcImdcIjogMTkxLCBcImJcIjogMjE2LCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC4yNDI3MTg0NDY2MDE5NDE3OCwgXCJsXCI6IDAuNzk4MDM5MjE1Njg2Mjc0NiwgXCJhXCI6IDF9LFxuICAgIFwidG9tYXRvXCI6IHtcInJcIjogMjU1LCBcImdcIjogOTksIFwiYlwiOiA3MSwgXCJoXCI6IDAuMDI1MzYyMzE4ODQwNTc5Njk0LCBcInNcIjogMSwgXCJsXCI6IDAuNjM5MjE1Njg2Mjc0NTA5OCwgXCJhXCI6IDF9LFxuICAgIFwidHVycXVvaXNlXCI6IHtcInJcIjogNjQsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMDgsIFwiaFwiOiAwLjQ4MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC43MjA3MjA3MjA3MjA3MjA3LCBcImxcIjogMC41NjQ3MDU4ODIzNTI5NDEyLCBcImFcIjogMX0sXG4gICAgXCJ2aW9sZXRcIjoge1wiclwiOiAyMzgsIFwiZ1wiOiAxMzAsIFwiYlwiOiAyMzgsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjc2MDU2MzM4MDI4MTY5MDIsIFwibFwiOiAwLjcyMTU2ODYyNzQ1MDk4MDQsIFwiYVwiOiAxfSxcbiAgICBcIndoZWF0XCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjIyLCBcImJcIjogMTc5LCBcImhcIjogMC4xMDg1ODU4NTg1ODU4NTg2LCBcInNcIjogMC43Njc0NDE4NjA0NjUxMTY4LCBcImxcIjogMC44MzEzNzI1NDkwMTk2MDc4LCBcImFcIjogMX0sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHsgXCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDI0NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC45NjA3ODQzMTM3MjU0OTAyLCBcImFcIjogMX0sXG4gICAgXCJ5ZWxsb3dncmVlblwiOiB7XCJyXCI6IDE1NCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogMC4yMjE1MDUzNzYzNDQwODYwNCwgXCJzXCI6IDAuNjA3ODQzMTM3MjU0OTAyLCBcImxcIjogMC41LCBcImFcIjogMX1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7IiwiLyoqIFxuICogQGNvbnN0YW50XG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIG51bWJlcj59IFxuICovXG52YXIgS0VZQ09ERVMgPSB7XG4gICAgJ2JhY2tzcGFjZScgOiA4LFxuICAgICd0YWInIDogOSxcbiAgICAnZW50ZXInIDogMTMsXG4gICAgJ3NoaWZ0JyA6IDE2LFxuICAgICdjdHJsJyA6IDE3LFxuICAgICdhbHQnIDogMTgsXG4gICAgJ3BhdXNlX2JyZWFrJyA6IDE5LFxuICAgICdjYXBzX2xvY2snIDogMjAsXG4gICAgJ2VzY2FwZScgOiAyNyxcbiAgICAncGFnZV91cCcgOiAzMyxcbiAgICAncGFnZSBkb3duJyA6IDM0LFxuICAgICdlbmQnIDogMzUsXG4gICAgJ2hvbWUnIDogMzYsXG4gICAgJ2xlZnRfYXJyb3cnIDogMzcsXG4gICAgJ3VwX2Fycm93JyA6IDM4LFxuICAgICdyaWdodF9hcnJvdycgOiAzOSxcbiAgICAnZG93bl9hcnJvdycgOiA0MCxcbiAgICAnaW5zZXJ0JyA6IDQ1LFxuICAgICdkZWxldGUnIDogNDYsXG4gICAgJzAnIDogNDgsXG4gICAgJzEnIDogNDksXG4gICAgJzInIDogNTAsXG4gICAgJzMnIDogNTEsXG4gICAgJzQnIDogNTIsXG4gICAgJzUnIDogNTMsXG4gICAgJzYnIDogNTQsXG4gICAgJzcnIDogNTUsXG4gICAgJzgnIDogNTYsXG4gICAgJzknIDogNTcsXG4gICAgJ2EnIDogNjUsXG4gICAgJ2InIDogNjYsXG4gICAgJ2MnIDogNjcsXG4gICAgJ2QnIDogNjgsXG4gICAgJ2UnIDogNjksXG4gICAgJ2YnIDogNzAsXG4gICAgJ2cnIDogNzEsXG4gICAgJ2gnIDogNzIsXG4gICAgJ2knIDogNzMsXG4gICAgJ2onIDogNzQsXG4gICAgJ2snIDogNzUsXG4gICAgJ2wnIDogNzYsXG4gICAgJ20nIDogNzcsXG4gICAgJ24nIDogNzgsXG4gICAgJ28nIDogNzksXG4gICAgJ3AnIDogODAsXG4gICAgJ3EnIDogODEsXG4gICAgJ3InIDogODIsXG4gICAgJ3MnIDogODMsXG4gICAgJ3QnIDogODQsXG4gICAgJ3UnIDogODUsXG4gICAgJ3YnIDogODYsXG4gICAgJ3cnIDogODcsXG4gICAgJ3gnIDogODgsXG4gICAgJ3knIDogODksXG4gICAgJ3onIDogOTAsXG4gICAgJ2xlZnRfd2luZG93IGtleScgOiA5MSxcbiAgICAncmlnaHRfd2luZG93IGtleScgOiA5MixcbiAgICAnc2VsZWN0X2tleScgOiA5MyxcbiAgICAnbnVtcGFkIDAnIDogOTYsXG4gICAgJ251bXBhZCAxJyA6IDk3LFxuICAgICdudW1wYWQgMicgOiA5OCxcbiAgICAnbnVtcGFkIDMnIDogOTksXG4gICAgJ251bXBhZCA0JyA6IDEwMCxcbiAgICAnbnVtcGFkIDUnIDogMTAxLFxuICAgICdudW1wYWQgNicgOiAxMDIsXG4gICAgJ251bXBhZCA3JyA6IDEwMyxcbiAgICAnbnVtcGFkIDgnIDogMTA0LFxuICAgICdudW1wYWQgOScgOiAxMDUsXG4gICAgJ211bHRpcGx5JyA6IDEwNixcbiAgICAnYWRkJyA6IDEwNyxcbiAgICAnc3VidHJhY3QnIDogMTA5LFxuICAgICdkZWNpbWFsIHBvaW50JyA6IDExMCxcbiAgICAnZGl2aWRlJyA6IDExMSxcbiAgICAnZjEnIDogMTEyLFxuICAgICdmMicgOiAxMTMsXG4gICAgJ2YzJyA6IDExNCxcbiAgICAnZjQnIDogMTE1LFxuICAgICdmNScgOiAxMTYsXG4gICAgJ2Y2JyA6IDExNyxcbiAgICAnZjcnIDogMTE4LFxuICAgICdmOCcgOiAxMTksXG4gICAgJ2Y5JyA6IDEyMCxcbiAgICAnZjEwJyA6IDEyMSxcbiAgICAnZjExJyA6IDEyMixcbiAgICAnZjEyJyA6IDEyMyxcbiAgICAnbnVtX2xvY2snIDogMTQ0LFxuICAgICdzY3JvbGxfbG9jaycgOiAxNDUsXG4gICAgJ3NlbWlfY29sb24nIDogMTg2LFxuICAgICdlcXVhbF9zaWduJyA6IDE4NyxcbiAgICAnY29tbWEnIDogMTg4LFxuICAgICdkYXNoJyA6IDE4OSxcbiAgICAncGVyaW9kJyA6IDE5MCxcbiAgICAnZm9yd2FyZF9zbGFzaCcgOiAxOTEsXG4gICAgJ2dyYXZlX2FjY2VudCcgOiAxOTIsXG4gICAgJ29wZW5fYnJhY2tldCcgOiAyMTksXG4gICAgJ2JhY2tzbGFzaCcgOiAyMjAsXG4gICAgJ2Nsb3NlYnJhY2tldCcgOiAyMjEsXG4gICAgJ3NpbmdsZV9xdW90ZScgOiAyMjJcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gS0VZQ09ERVM7IiwicmVxdWlyZSgnLi8uLi90ZXN0cy9kYXRhL2NvbG9ycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9lbmdpbmUvY2FtZXJhLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2VuZ2luZS9zY2VuZS5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL2ZhY2UuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC9tYXRyaXguanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC9tZXNoLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvdmVjdG9yLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL3V0aWxpdHkvY29sb3IuanMnKTtcbiIsInZhciBjb2xvcmxpc3QgPSBbXCJBbGljZUJsdWVcIiwgXCJBbnRpcXVlV2hpdGVcIiwgXCJBcXVhXCIsIFwiQXF1YW1hcmluZVwiLCBcIkF6dXJlXCIsIFwiQmVpZ2VcIiwgXCJCaXNxdWVcIiwgXCJCbGFja1wiLCBcIkJsYW5jaGVkQWxtb25kXCIsIFwiQmx1ZVwiLCBcIkJsdWVWaW9sZXRcIiwgXCJCcm93blwiLCBcIkJ1cmx5V29vZFwiLCBcIkNhZGV0Qmx1ZVwiLCBcIkNoYXJ0cmV1c2VcIiwgXCJDaG9jb2xhdGVcIiwgXCJDb3JhbFwiLCBcIkNvcm5mbG93ZXJCbHVlXCIsIFwiQ29ybnNpbGtcIiwgXCJDcmltc29uXCIsIFwiQ3lhblwiLCBcIkRhcmtCbHVlXCIsIFwiRGFya0N5YW5cIiwgXCJEYXJrR29sZGVuUm9kXCIsIFwiRGFya0dyYXlcIiwgXCJEYXJrR3JleVwiLCBcIkRhcmtHcmVlblwiLCBcIkRhcmtLaGFraVwiLCBcIkRhcmtNYWdlbnRhXCIsIFwiRGFya09saXZlR3JlZW5cIiwgXCJEYXJrb3JhbmdlXCIsIFwiRGFya09yY2hpZFwiLCBcIkRhcmtSZWRcIiwgXCJEYXJrU2FsbW9uXCIsIFwiRGFya1NlYUdyZWVuXCIsIFwiRGFya1NsYXRlQmx1ZVwiLCBcIkRhcmtTbGF0ZUdyYXlcIiwgXCJEYXJrU2xhdGVHcmV5XCIsIFwiRGFya1R1cnF1b2lzZVwiLCBcIkRhcmtWaW9sZXRcIiwgXCJEZWVwUGlua1wiLCBcIkRlZXBTa3lCbHVlXCIsIFwiRGltR3JheVwiLCBcIkRpbUdyZXlcIiwgXCJEb2RnZXJCbHVlXCIsIFwiRmlyZUJyaWNrXCIsIFwiRmxvcmFsV2hpdGVcIiwgXCJGb3Jlc3RHcmVlblwiLCBcIkZ1Y2hzaWFcIiwgXCJHYWluc2Jvcm9cIiwgXCJHaG9zdFdoaXRlXCIsIFwiR29sZFwiLCBcIkdvbGRlblJvZFwiLCBcIkdyYXlcIiwgXCJHcmV5XCIsIFwiR3JlZW5cIiwgXCJHcmVlblllbGxvd1wiLCBcIkhvbmV5RGV3XCIsIFwiSG90UGlua1wiLCBcIkluZGlhblJlZFwiLCBcIkluZGlnb1wiLCBcIkl2b3J5XCIsIFwiS2hha2lcIiwgXCJMYXZlbmRlclwiLCBcIkxhdmVuZGVyQmx1c2hcIiwgXCJMYXduR3JlZW5cIiwgXCJMZW1vbkNoaWZmb25cIiwgXCJMaWdodEJsdWVcIiwgXCJMaWdodENvcmFsXCIsIFwiTGlnaHRDeWFuXCIsIFwiTGlnaHRHb2xkZW5Sb2RZZWxsb3dcIiwgXCJMaWdodEdyYXlcIiwgXCJMaWdodEdyZXlcIiwgXCJMaWdodEdyZWVuXCIsIFwiTGlnaHRQaW5rXCIsIFwiTGlnaHRTYWxtb25cIiwgXCJMaWdodFNlYUdyZWVuXCIsIFwiTGlnaHRTa3lCbHVlXCIsIFwiTGlnaHRTbGF0ZUdyYXlcIiwgXCJMaWdodFNsYXRlR3JleVwiLCBcIkxpZ2h0U3RlZWxCbHVlXCIsIFwiTGlnaHRZZWxsb3dcIiwgXCJMaW1lXCIsIFwiTGltZUdyZWVuXCIsIFwiTGluZW5cIiwgXCJNYWdlbnRhXCIsIFwiTWFyb29uXCIsIFwiTWVkaXVtQXF1YU1hcmluZVwiLCBcIk1lZGl1bUJsdWVcIiwgXCJNZWRpdW1PcmNoaWRcIiwgXCJNZWRpdW1QdXJwbGVcIiwgXCJNZWRpdW1TZWFHcmVlblwiLCBcIk1lZGl1bVNsYXRlQmx1ZVwiLCBcIk1lZGl1bVNwcmluZ0dyZWVuXCIsIFwiTWVkaXVtVHVycXVvaXNlXCIsIFwiTWVkaXVtVmlvbGV0UmVkXCIsIFwiTWlkbmlnaHRCbHVlXCIsIFwiTWludENyZWFtXCIsIFwiTWlzdHlSb3NlXCIsIFwiTW9jY2FzaW5cIiwgXCJOYXZham9XaGl0ZVwiLCBcIk5hdnlcIiwgXCJPbGRMYWNlXCIsIFwiT2xpdmVcIiwgXCJPbGl2ZURyYWJcIiwgXCJPcmFuZ2VcIiwgXCJPcmFuZ2VSZWRcIiwgXCJPcmNoaWRcIiwgXCJQYWxlR29sZGVuUm9kXCIsIFwiUGFsZUdyZWVuXCIsIFwiUGFsZVR1cnF1b2lzZVwiLCBcIlBhbGVWaW9sZXRSZWRcIiwgXCJQYXBheWFXaGlwXCIsIFwiUGVhY2hQdWZmXCIsIFwiUGVydVwiLCBcIlBpbmtcIiwgXCJQbHVtXCIsIFwiUG93ZGVyQmx1ZVwiLCBcIlB1cnBsZVwiLCBcIlJlZFwiLCBcIlJvc3lCcm93blwiLCBcIlJveWFsQmx1ZVwiLCBcIlNhZGRsZUJyb3duXCIsIFwiU2FsbW9uXCIsIFwiU2FuZHlCcm93blwiLCBcIlNlYUdyZWVuXCIsIFwiU2VhU2hlbGxcIiwgXCJTaWVubmFcIiwgXCJTaWx2ZXJcIiwgXCJTa3lCbHVlXCIsIFwiU2xhdGVCbHVlXCIsIFwiU2xhdGVHcmF5XCIsIFwiU2xhdGVHcmV5XCIsIFwiU25vd1wiLCBcIlNwcmluZ0dyZWVuXCIsIFwiU3RlZWxCbHVlXCIsIFwiVGFuXCIsIFwiVGVhbFwiLCBcIlRoaXN0bGVcIiwgXCJUb21hdG9cIiwgXCJUdXJxdW9pc2VcIiwgXCJWaW9sZXRcIiwgXCJXaGVhdFwiLCBcIldoaXRlXCIsIFwiV2hpdGVTbW9rZVwiLCBcIlllbGxvd1wiLCBcIlllbGxvd0dyZWVuXCJdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbG9ybGlzdDsiLCJ2YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9jYW1lcmEuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnQ2FtZXJhJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgY2FtZXJhO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGNhbWVyYSA9IG5ldyBDYW1lcmEoNjAwLCA0MDApO1xuICAgIH0pXG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdoZWlnaHQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGNhbWVyYS5oZWlnaHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGNhbWVyYS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIFNjZW5lID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9zY2VuZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdTY2VuZScsIGZ1bmN0aW9uKCl7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgLy92YXIgc2NlbmUgPSBuZXcgU2NlbmUoe2NhbnZhc19pZDogJ3dpcmVmcmFtZScsIHdpZHRoOjYwMCwgaGVpZ2h0OjQwMH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnaGVpZ2h0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGFzc2VydC5lcXVhbChzY2VuZS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgXG4gICAgfSlcbn0pOyIsInZhciBGYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvZmFjZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnZhciBmYWNlO1xuXG5zdWl0ZSgnRmFjZScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGZhY2U7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgZmFjZSA9IG5ldyBGYWNlKDAsIDEsIDIsIFwicmVkXCIpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnY29sb3InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZhY2UuY29sb3IucmdiLnIsIDI1NSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL21hdHJpeC5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdNYXRyaXgnLCBmdW5jdGlvbigpe1xuICAgIHZhciB6ZXJvLCBpZGVudGl0eTtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICB6ZXJvID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBpZGVudGl0eSA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbGVuZ3RoJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCgxNiwgemVyby5sZW5ndGgpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKDE2LCBpZGVudGl0eS5sZW5ndGgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2VxdWFsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdtdWx0aXBseVNjYWxhcicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbmVnYXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndHJhbnNwb3NlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25YJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25ZJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25aJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25BeGlzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2xhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnaWRlbnRpdHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd6ZXJvJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZnJvbUFycmF5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBNZXNoID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvbWVzaC5qcycpO1xudmFyIEZhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9mYWNlLmpzJyk7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vc3JjL21hdGgvdmVjdG9yLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ01lc2gnLCBmdW5jdGlvbigpe1xuICAgIHZhciBtZXNoO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIG1lc2ggPSBuZXcgTWVzaCgndHJpYW5nbGUnLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMSwwLDApLFxuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMCwxLDApLFxuICAgICAgICAgICAgICAgIG5ldyBWZWN0b3IoMCwwLDEpXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIG5ldyBGYWNlKDAsIDEsIDIsICdyZWQnKVxuICAgICAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCduYW1lJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhtZXNoLm5hbWUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gubmFtZSwgJ3RyaWFuZ2xlJyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZXJ0aWNlcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2ZhY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncG9zaXRpb24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2Zyb21KU09OJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC92ZWN0b3IuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnVmVjdG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgb3JpZ2luLCB2ZWN0b3IxLCB2ZWN0b3IyLCB2ZWN0b3IzLCB2ZWN0b3I0LCB2ZWN0b3I1LCB2ZWN0b3J4LCB2ZWN0b3J5LCB2ZWN0b3J6O1xuICAgIHZhciB2ZWN0b3IxMDB4LCB2ZWN0b3IyMDB5LCB2ZWN0b3IzMDB6LCB2ZWN0b3IxMjMsIHZlY3RvcjExMjtcbiAgICB2YXIgZXBzaWxvbiA9IDAuMDE7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgb3JpZ2luID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yMSA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjIgPSBuZXcgVmVjdG9yKDEsIDEsIDEpO1xuICAgICAgICB2ZWN0b3IzID0gbmV3IFZlY3RvcigxMCwgMTAsIDEwKTtcbiAgICAgICAgdmVjdG9yNCA9IG5ldyBWZWN0b3IoMTEsIDExLCAxMSk7XG4gICAgICAgIHZlY3RvcjUgPSBuZXcgVmVjdG9yKC0xLCAtMSwgLTEpO1xuICAgICAgICB2ZWN0b3J4ID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yeSA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgIHZlY3RvcnogPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICB2ZWN0b3IxMDB4ID0gbmV3IFZlY3RvcigxMDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IyMDB5ID0gbmV3IFZlY3RvcigwLCAyMDAsIDApO1xuICAgICAgICB2ZWN0b3IzMDB6ID0gbmV3IFZlY3RvcigwLCAwLCAzMDApO1xuICAgICAgICB2ZWN0b3IxMjMgPSBuZXcgVmVjdG9yKDEsIDIsIDMpO1xuICAgICAgICB2ZWN0b3IxMTIgPSBuZXcgVmVjdG9yKC0xLCAxLCAyKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2F4ZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe25ldyBWZWN0b3IoKX0sIEVycm9yKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLngpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS56KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdhZGQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuYWRkKHZlY3RvcjMpLmVxdWFsKHZlY3RvcjQpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLmFkZCh2ZWN0b3I1KS5lcXVhbChvcmlnaW4pKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmFkZCh2ZWN0b3IzKS54LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMS5hZGQodmVjdG9yMykueSwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuYWRkKHZlY3RvcjMpLnosIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmFkZCh2ZWN0b3I1KS54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmFkZCh2ZWN0b3I1KS55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmFkZCh2ZWN0b3I1KS56LCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3N1YnRyYWN0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3I0LnN1YnRyYWN0KHZlY3RvcjEpLmVxdWFsKHZlY3RvcjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnN1YnRyYWN0KHZlY3RvcjIpLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjQuc3VidHJhY3QodmVjdG9yMSkueCwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjQuc3VidHJhY3QodmVjdG9yMSkueSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjQuc3VidHJhY3QodmVjdG9yMSkueiwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuc3VidHJhY3QodmVjdG9yMikueCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMS5zdWJ0cmFjdCh2ZWN0b3IyKS55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLnN1YnRyYWN0KHZlY3RvcjIpLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZXF1YWwnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZXF1YWwodmVjdG9yMiksIHRydWUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZXF1YWwodmVjdG9yMyksIGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vaygodmVjdG9yeC5hbmdsZSh2ZWN0b3J5KSAtIChNYXRoLlBJIC8gMikpIDwgZXBzaWxvbik7XG4gICAgICAgICAgICBhc3NlcnQub2soKHZlY3RvcnkuYW5nbGUodmVjdG9yeikgLSAoTWF0aC5QSSAvIDIpKSA8IGVwc2lsb24pO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCh2ZWN0b3J4LmFuZ2xlKHZlY3RvcnopIC0gKE1hdGguUEkgLyAyKSkgPCBlcHNpbG9uKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmFuZ2xlKHZlY3RvcjIpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5vaygodmVjdG9yMS5hbmdsZSh2ZWN0b3I1KSAtIE1hdGguUEkpIDwgZXBzaWxvbik7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdjb3NBbmdsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soKE1hdGguYWNvcyh2ZWN0b3J4LmNvc0FuZ2xlKHZlY3RvcnkpKSAtIChNYXRoLlBJIC8gMikpIDwgZXBzaWxvbik7XG4gICAgICAgICAgICBhc3NlcnQub2soKE1hdGguYWNvcyh2ZWN0b3J5LmNvc0FuZ2xlKHZlY3RvcnopKSAtIChNYXRoLlBJIC8gMikpIDwgZXBzaWxvbik7XG4gICAgICAgICAgICBhc3NlcnQub2soKE1hdGguYWNvcyh2ZWN0b3J4LmNvc0FuZ2xlKHZlY3RvcnopKSAtIChNYXRoLlBJIC8gMikpIDwgZXBzaWxvbik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoTWF0aC5hY29zKHZlY3RvcjEuY29zQW5nbGUodmVjdG9yMikpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5vaygoTWF0aC5hY29zKHZlY3RvcjEuY29zQW5nbGUodmVjdG9yNSkpIC0gTWF0aC5QSSkgPCBlcHNpbG9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2soKHZlY3RvcjEubWFnbml0dWRlKCkgLSBNYXRoLnNxcnQoMykpIDwgZXBzaWxvbik7XG4gICAgICAgICAgICBhc3NlcnQub2soKHZlY3RvcjUubWFnbml0dWRlKCkgLSBNYXRoLnNxcnQoMykpIDwgZXBzaWxvbik7XG4gICAgICAgICAgICBhc3NlcnQub2soKHZlY3RvcjMubWFnbml0dWRlKCkgLSBNYXRoLnNxcnQoMzAwKSkgPCBlcHNpbG9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZVNxdWFyZWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEubWFnbml0dWRlU3F1YXJlZCgpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3I1Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMy5tYWduaXR1ZGVTcXVhcmVkKCksIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkb3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZG90KHZlY3RvcjIpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyLmRvdCh2ZWN0b3IzKSwgMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMuZG90KHZlY3RvcjUpLCAtMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguZG90KHZlY3RvcnkpLCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nyb3NzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J4LmNyb3NzKHZlY3RvcnkpLmVxdWFsKHZlY3RvcnopKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J5LmNyb3NzKHZlY3RvcnopLmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J6LmNyb3NzKHZlY3RvcngpLmVxdWFsKHZlY3RvcnkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yeS5jcm9zcyh2ZWN0b3J4KS5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnouY3Jvc3ModmVjdG9yeSkuZXF1YWwodmVjdG9yeCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J4LmNyb3NzKHZlY3RvcnopLmVxdWFsKHZlY3RvcnkpKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmNyb3NzKHZlY3RvcnkpLnosIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnkuY3Jvc3ModmVjdG9yeikueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5jcm9zcyh2ZWN0b3J4KS55LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxMjMuY3Jvc3ModmVjdG9yMTEyKS54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxMjMuY3Jvc3ModmVjdG9yMTEyKS55LCAtNSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMTIzLmNyb3NzKHZlY3RvcjExMikueiwgMyk7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMTAweC5ub3JtYWxpemUoKS54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyMDB5Lm5vcm1hbGl6ZSgpLnksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMwMHoubm9ybWFsaXplKCkueiwgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5zY2FsZSgxMDApLmVxdWFsKHZlY3RvcjEwMHgpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J5LnNjYWxlKDIwMCkuZXF1YWwodmVjdG9yMjAweSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnouc2NhbGUoMzAwKS5lcXVhbCh2ZWN0b3IzMDB6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zY2FsZSgxMCkuZXF1YWwodmVjdG9yMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuc2NhbGUoMTEpLmVxdWFsKHZlY3RvcjQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25lZ2F0ZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5uZWdhdGUoKS5lcXVhbCh2ZWN0b3I1KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5uZWdhdGUoKS5uZWdhdGUoKS5lcXVhbCh2ZWN0b3IxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZWN0b3JQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcblxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGFyUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2NvbXBvbmVudCcsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZScsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVgnLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVZJywgZnVuY3Rpb24oKXtcblxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWicsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbCcsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbGl0eS9jb2xvci5qcycpO1xudmFyIGNvbG9ybGlzdCA9IHJlcXVpcmUoJy4uL2RhdGEvY29sb3JzLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgcmdiYSwgaHNsLCBoc2xhLCBhbGljZWJsdWUsIGVwc2lsb247XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVkID0gbmV3IENvbG9yKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvcihcIiNCQURBNTVcIik7XG4gICAgICAgIHJnYmEgPSBuZXcgQ29sb3IoXCJyZ2JhKDI1NSwgMCwgMCwgMC4zKVwiKTtcbiAgICAgICAgZXBzaWxvbiA9IDAuMDE7XG4gICAgICAgIGhzbCA9IG5ldyBDb2xvcihcImhzbCgwLCAxMDAlLCA1MCUpXCIpO1xuICAgICAgICBoc2xhID0gbmV3IENvbG9yKFwiaHNsYSgwLCAxMDAlLCA1MCUsIDAuMylcIik7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdyZ2InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuYiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2wnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5zLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLmwsIDAuNSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbHBoYScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soTWF0aC5hYnMocmVkLmFscGhhIC0gMSkgPCBlcHNpbG9uKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhNYXRoLmFicyhyZ2JhLmFscGhhIC0gMC4zKSA8IGVwc2lsb24pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xpZ2h0ZW4nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkYXJrZW4nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2xUb1JnYicsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JnYlRvSHNsJywgZnVuY3Rpb24oKXtcblxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyJdfQ==
(16)
});
