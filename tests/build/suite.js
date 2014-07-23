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
(function (global){
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.linearalgea=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Vector = _dereq_('./vector.js');
var Matrix = _dereq_('./matrix.js');

var math = Object.create(null);

math.Vector = Vector;
math.Matrix = Matrix;

module.exports = math;

},{"./matrix.js":2,"./vector.js":3}],2:[function(_dereq_,module,exports){
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
},{}],3:[function(_dereq_,module,exports){
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
},{}]},{},[1])
(1)
});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(_dereq_,module,exports){
var math = _dereq_('linearalgea');
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
    this.position = this.position.subtract(up);
    this.view_matrix = this.createViewMatrix();
};
/** @method */
Camera.prototype.moveDown = function(amount){
    var up = this.up.normalize().scale(amount);
    this.position = this.position.add(up);
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

},{"linearalgea":6}],8:[function(_dereq_,module,exports){
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
},{}],9:[function(_dereq_,module,exports){
var math = _dereq_('linearalgea');
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
    this._draw_mode = 0;
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
    var pressed = KEYCODES[key];
    return (pressed in this._keys && this._keys[pressed]);
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
        this._keys[pressed] = false;
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
Scene.prototype.toggleDrawMode = function(){
    this._draw_mode = (this._draw_mode + 1) % 2;
    this.renderScene();
};
/** @method */
Scene.prototype.toggleBackfaceCulling = function(){
    this._backface_culling = !this._backface_culling;
    this.renderScene();
};
/** @method */
Scene.prototype.drawPixel = function(x, y, z, color){
    x = x + this._x_offset;
    y = y + this._y_offset;
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
    if (vector1.x >= vector2.x){
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
        this.drawPixel(Math.floor(current_x), Math.floor(current_y), current_z, color);
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
Scene.prototype.fillTriangle = function(v1, v2, v3, color){
    // TODO: This method chugs when close to a face. See if this can be fixed.
    // Is this just because it's looping over so many extraneous points?
    // Decomposing into smaller triangles may alleviate this somewhat.
    var x0 = v1.x;
    var x1 = v2.x;
    var x2 = v3.x;
    var y0 = v1.y;
    var y1 = v2.y;
    var y2 = v3.y;
    var z0 = v1.z;
    var z1 = v2.z;
    var z2 = v3.z;

    // Compute offsets. Used to avoid computing barycentric coords for offscreen pixels
    var xleft = 0 - this._x_offset;
    var xright = this.width - this._x_offset;
    var ytop = 0 - this._y_offset;
    var ybot = this.height - this._y_offset;

    // Compute bounding box
    var xmin = Math.floor(Math.min(x0, x1, x2));
    if (xmin < xleft){xmin=xleft;}
    var xmax = Math.ceil(Math.max(x0, x1, x2));
    if (xmax > xright){xmax=xright;}
    var ymin = Math.floor(Math.min(y0, y1, y2));
    if (ymin < ytop){ymin=ytop;}
    var ymax = Math.ceil(Math.max(y0, y1, y2));
    if (ymax > ybot){ymax=ybot;}

    // Precompute as much as possible
    var y2y0 = y2-y0;
    var x0x2 = x0-x2;
    var y0y1 = y0-y1;
    var x1x0 = x1-x0;
    var x2y0x0y2 = x2*y0 - x0*y2;
    var x0y1x1y0 = x0*y1 - x1*y0;
    var f20x1y1 = ((y2y0*x1) + (x0x2*y1) + x2y0x0y2);
    var f01x2y2 = ((y0y1*x2) + (x1x0*y2) + x0y1x1y0);

    var y2y0overf20x1y1 = y2y0/f20x1y1;
    var x0x2overf20x1y1 = x0x2/f20x1y1;
    var x2y0x0y21overf20x1y1 = x2y0x0y2/f20x1y1;

    var y0y1overf01x2y2 = y0y1/f01x2y2;
    var x0x2overf01x2y2 = x1x0/f01x2y2;
    var x2y0x0y2overf01x2y2 = x0y1x1y0/f01x2y2;

    // Loop over bounding box
    for (var x = xmin; x <= xmax; x++){
        for (var y = ymin; y <= ymax; y++){
            // Compute barycentric coordinates
            // If any of the coordinates are not in the range [0,1], then the
            // point is not inside the triangle. Rather than compute all the
            // coordinates straight away, we'll short-circuit as soon as a coordinate outside
            // of that range is encountered.
            var beta = y2y0overf20x1y1*x + x0x2overf20x1y1*y + x2y0x0y21overf20x1y1;
            if (beta >= 0 && beta <= 1){
                var gamma = y0y1overf01x2y2*x + x0x2overf01x2y2*y +x2y0x0y2overf01x2y2;
                if (gamma >= 0 && gamma <= 1){
                    var alpha = 1 - beta - gamma;
                    if (alpha >= 0 && alpha <= 1){
                        // If all barycentric coords within range [0,1], inside triangle
                        var z = alpha*z0 + beta*z1 + gamma*z2;
                        this.drawPixel(x, y, z, color);
                    }
                }
            }
        }
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
                if (!this._backface_culling || cam_to_vert.dot(norm) >= 0) {
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
                        if (this._draw_mode === 0){
                            this.drawTriangle(wv1, wv2, wv3, color.rgb);
                        } else if (this._draw_mode === 1){
                            var light_direction = light.subtract(v1.transform(world_matrix)).normalize();
                            var illumination_angle = norm.dot(light_direction);
                            color = color.lighten(illumination_angle*15);
                            this.fillTriangle(wv1, wv2, wv3, color.rgb);
                        }
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

},{"../utilities/keycodes.js":13,"./camera.js":7,"./events.js":8,"linearalgea":6}],10:[function(_dereq_,module,exports){
var Color = _dereq_('../utilities/color.js');

/**
 * A 3D triangle
 * @constructor
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {string} color
 */
function Face(a, b, c, color){
    this.face = [a, b, c];
    this.color = new Color(color);
}

module.exports = Face;
},{"../utilities/color.js":12}],11:[function(_dereq_,module,exports){
var Vector = _dereq_('linearalgea').Vector;
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

},{"./face.js":10,"linearalgea":6}],12:[function(_dereq_,module,exports){
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
    // N.B. This can create a loooot of DOM nodes. It's not a great method.
    // TODO: Fix
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
},{}],13:[function(_dereq_,module,exports){
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
},{}],14:[function(_dereq_,module,exports){
_dereq_('./../tests/helpers.js');
_dereq_('./../tests/data/colors.js');
_dereq_('./../tests/engine/camera.js');
_dereq_('./../tests/engine/scene.js');
_dereq_('./../tests/geometry/face.js');
_dereq_('./../tests/geometry/mesh.js');
_dereq_('./../tests/utilities/color.js');

},{"./../tests/data/colors.js":15,"./../tests/engine/camera.js":16,"./../tests/engine/scene.js":17,"./../tests/geometry/face.js":18,"./../tests/geometry/mesh.js":19,"./../tests/helpers.js":20,"./../tests/utilities/color.js":21}],15:[function(_dereq_,module,exports){
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
},{}],16:[function(_dereq_,module,exports){
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
},{"../../src/engine/camera.js":7,"assert":1}],17:[function(_dereq_,module,exports){
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
},{"../../src/engine/scene.js":9,"assert":1}],18:[function(_dereq_,module,exports){
var Face = _dereq_('../../src/geometry/face.js');
var assert = _dereq_("assert");

var face;

suite('Face', function(){
    var face;
    setup(function(){
        face = new Face(0, 1, 2, "red");
    });
    suite('properties', function(){
        test('vertices', function(){
            assert.equal(face.face[0], 0);
            assert.equal(face.face[1], 1);
            assert.equal(face.face[2], 2);
        });
        test('color', function(){
            assert.equal(face.color.rgb.r, 255);
        });
    });
});
},{"../../src/geometry/face.js":10,"assert":1}],19:[function(_dereq_,module,exports){
var Mesh = _dereq_('../../src/geometry/mesh.js');
var Face = _dereq_('../../src/geometry/face.js');
var Vector = _dereq_('linearalgea').Vector;
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
            assert.equal(mesh.name, 'triangle');
        });
        test('vertices', function(){
            assert.equal(mesh.vertices[0].x, 1);
            assert.equal(mesh.vertices[0].y, 0);
            assert.equal(mesh.vertices[0].z, 0);
            assert.equal(mesh.vertices[1].x, 0);
            assert.equal(mesh.vertices[1].y, 1);
            assert.equal(mesh.vertices[1].z, 0);
            assert.equal(mesh.vertices[2].x, 0);
            assert.equal(mesh.vertices[2].y, 0);
            assert.equal(mesh.vertices[2].z, 1);
        });
        test('faces', function(){
            assert.equal(mesh.faces[0].face[0], 0);
            assert.equal(mesh.faces[0].face[1], 1);
            assert.equal(mesh.faces[0].face[2], 2);
        });
        test('position', function(){
            assert.equal(mesh.position.x, 0);
            assert.equal(mesh.position.y, 0);
            assert.equal(mesh.position.z, 0);
        });
        test('rotation', function(){
            assert.equal(mesh.rotation.pitch, 0);
            assert.equal(mesh.rotation.yaw, 0);
            assert.equal(mesh.rotation.roll, 0);
        });
        test('scale', function(){
            assert.equal(mesh.scale.x, 1);
            assert.equal(mesh.scale.y, 1);
            assert.equal(mesh.scale.z, 1);
        });
    });
    suite('methods', function(){
        test('fromJSON', function(){
            var json = Mesh.fromJSON(
                {
                    'name': 'triangle',
                    'vertices':[
                        [1,0,0],
                        [0,1,0],
                        [0,0,1]
                    ],
                    'faces':[
                        {'face': [0, 1, 2], 'color': 'red'}
                    ]
                });
            assert.equal(mesh.vertices[0].x, json.vertices[0].x);
            assert.equal(mesh.vertices[0].y, json.vertices[0].y);
            assert.equal(mesh.vertices[0].z, json.vertices[0].z);
            assert.equal(mesh.vertices[1].x, json.vertices[1].x);
            assert.equal(mesh.vertices[1].y, json.vertices[1].y);
            assert.equal(mesh.vertices[1].z, json.vertices[1].z);
            assert.equal(mesh.vertices[2].x, json.vertices[2].x);
            assert.equal(mesh.vertices[2].y, json.vertices[2].y);
            assert.equal(mesh.vertices[2].z, json.vertices[2].z);

            assert.equal(mesh.faces[0].face[0], json.faces[0].face[0]);
            assert.equal(mesh.faces[0].face[1], json.faces[0].face[1]);
            assert.equal(mesh.faces[0].face[2], json.faces[0].face[2]);

            assert.equal(mesh.position.x, json.position.x);
            assert.equal(mesh.position.y, json.position.y);
            assert.equal(mesh.position.z, json.position.z);
     
            assert.equal(mesh.rotation.pitch, json.rotation.pitch);
            assert.equal(mesh.rotation.yaw, json.rotation.yaw);
            assert.equal(mesh.rotation.roll, json.rotation.roll);
        
            assert.equal(mesh.scale.x, mesh.scale.x);
            assert.equal(mesh.scale.y, mesh.scale.y);
            assert.equal(mesh.scale.z, mesh.scale.z);
        });
    });
});
},{"../../src/geometry/face.js":10,"../../src/geometry/mesh.js":11,"assert":1,"linearalgea":6}],20:[function(_dereq_,module,exports){
function nearlyEqual(a, b, eps){
    if (typeof eps === "undefined") {eps = 0.01;}
    var diff = Math.abs(a - b);
    return (diff < eps);
}

var helpers = new Object(null);

helpers.nearlyEqual = nearlyEqual;

module.exports = helpers;
},{}],21:[function(_dereq_,module,exports){
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
},{"../../src/utilities/color.js":12,"../data/colors.js":15,"../helpers.js":20,"assert":1}]},{},[14])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2xpbmVhcmFsZ2VhL2J1aWxkL2xpbmVhcmFsZ2VhLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2V2ZW50cy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZ2VvbWV0cnkvZmFjZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9nZW9tZXRyeS9tZXNoLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL3V0aWxpdGllcy9jb2xvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy91dGlsaXRpZXMva2V5Y29kZXMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0L2Zha2VfNmNiNzg3YWEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9kYXRhL2NvbG9ycy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9nZW9tZXRyeS9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZ2VvbWV0cnkvbWVzaC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2hlbHBlcnMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy91dGlsaXRpZXMvY29sb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAoaXNOYU4odmFsdWUpIHx8ICFpc0Zpbml0ZSh2YWx1ZSkpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYiksXG4gICAgICAgIGtleSwgaTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbiFmdW5jdGlvbihlKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKGUpO2Vsc2V7dmFyIGY7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz9mPXdpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2Y9Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiYoZj1zZWxmKSxmLmxpbmVhcmFsZ2VhPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xudmFyIFZlY3RvciA9IF9kZXJlcV8oJy4vdmVjdG9yLmpzJyk7XG52YXIgTWF0cml4ID0gX2RlcmVxXygnLi9tYXRyaXguanMnKTtcblxudmFyIG1hdGggPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5tYXRoLlZlY3RvciA9IFZlY3Rvcjtcbm1hdGguTWF0cml4ID0gTWF0cml4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGg7XG5cbn0se1wiLi9tYXRyaXguanNcIjoyLFwiLi92ZWN0b3IuanNcIjozfV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKiogXG4gKiA0eDQgbWF0cml4LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1hdHJpeCgpe1xuICAgIGZvciAodmFyIGk9MDsgaTwxNjsgaSsrKXtcbiAgICAgICAgdGhpc1tpXSA9IDA7XG4gICAgfVxuICAgIHRoaXMubGVuZ3RoID0gMTY7XG59XG4vKipcbiAqIENvbXBhcmUgbWF0cml4IHdpdGggc2VsZiBmb3IgZXF1YWxpdHkuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5NYXRyaXgucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIGlmICh0aGlzW2ldICE9PSBtYXRyaXhbaV0pe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcbi8qKlxuICogQWRkIG1hdHJpeCB0byBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gdGhpc1tpXSArIG1hdHJpeFtpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBTdWJ0cmFjdCBtYXRyaXggZnJvbSBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldIC0gbWF0cml4W2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE11bHRpcGx5IHNlbGYgYnkgc2NhbGFyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyID0gZnVuY3Rpb24oc2NhbGFyKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldICogc2NhbGFyO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE11bHRpcGx5IHNlbGYgYnkgbWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBuZXdfbWF0cml4WzBdID0gKHRoaXNbMF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMl0gKiBtYXRyaXhbOF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzFdID0gKHRoaXNbMF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbMl0gKiBtYXRyaXhbOV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzJdID0gKHRoaXNbMF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzNdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFszXSA9ICh0aGlzWzBdICogbWF0cml4WzNdKSArICh0aGlzWzFdICogbWF0cml4WzddKSArICh0aGlzWzJdICogbWF0cml4WzExXSkgKyAodGhpc1szXSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbNF0gPSAodGhpc1s0XSAqIG1hdHJpeFswXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs0XSkgKyAodGhpc1s2XSAqIG1hdHJpeFs4XSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbNV0gPSAodGhpc1s0XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs1XSkgKyAodGhpc1s2XSAqIG1hdHJpeFs5XSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbNl0gPSAodGhpc1s0XSAqIG1hdHJpeFsyXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs2XSkgKyAodGhpc1s2XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzddID0gKHRoaXNbNF0gKiBtYXRyaXhbM10pICsgKHRoaXNbNV0gKiBtYXRyaXhbN10pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzddICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFs4XSA9ICh0aGlzWzhdICogbWF0cml4WzBdKSArICh0aGlzWzldICogbWF0cml4WzRdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs4XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzldID0gKHRoaXNbOF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbMTBdICogbWF0cml4WzldKSArICh0aGlzWzExXSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMTBdID0gKHRoaXNbOF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbMTBdICogbWF0cml4WzEwXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzExXSA9ICh0aGlzWzhdICogbWF0cml4WzNdKSArICh0aGlzWzldICogbWF0cml4WzddKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTFdICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFsxMl0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMF0pICsgKHRoaXNbMTNdICogbWF0cml4WzRdKSArICh0aGlzWzE0XSAqIG1hdHJpeFs4XSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzEzXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNV0pICsgKHRoaXNbMTRdICogbWF0cml4WzldKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMTRdID0gKHRoaXNbMTJdICogbWF0cml4WzJdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbMTVdID0gKHRoaXNbMTJdICogbWF0cml4WzNdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs3XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxNV0pO1xuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTmVnYXRlIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSAtdGhpc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBUcmFuc3Bvc2Ugc2VsZi5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS50cmFuc3Bvc2UgPSBmdW5jdGlvbigpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIG5ld19tYXRyaXhbMF0gPSB0aGlzWzBdO1xuICAgIG5ld19tYXRyaXhbMV0gPSB0aGlzWzRdO1xuICAgIG5ld19tYXRyaXhbMl0gPSB0aGlzWzhdO1xuICAgIG5ld19tYXRyaXhbM10gPSB0aGlzWzEyXTtcbiAgICBuZXdfbWF0cml4WzRdID0gdGhpc1sxXTtcbiAgICBuZXdfbWF0cml4WzVdID0gdGhpc1s1XTtcbiAgICBuZXdfbWF0cml4WzZdID0gdGhpc1s5XTtcbiAgICBuZXdfbWF0cml4WzddID0gdGhpc1sxM107XG4gICAgbmV3X21hdHJpeFs4XSA9IHRoaXNbMl07XG4gICAgbmV3X21hdHJpeFs5XSA9IHRoaXNbNl07XG4gICAgbmV3X21hdHJpeFsxMF0gPSB0aGlzWzEwXTtcbiAgICBuZXdfbWF0cml4WzExXSA9IHRoaXNbMTRdO1xuICAgIG5ld19tYXRyaXhbMTJdID0gdGhpc1szXTtcbiAgICBuZXdfbWF0cml4WzEzXSA9IHRoaXNbN107XG4gICAgbmV3X21hdHJpeFsxNF0gPSB0aGlzWzExXTtcbiAgICBuZXdfbWF0cml4WzE1XSA9IHRoaXNbMTVdO1xuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHgtYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblggPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzZdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbOV0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB5LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25ZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMl0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgei1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWiA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzFdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIGF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7VmVjdG9yfSBheGlzXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uQXhpcyA9IGZ1bmN0aW9uKGF4aXMsIHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciB1ID0gYXhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB1Lng7XG4gICAgdmFyIHV5ID0gdS55O1xuICAgIHZhciB1eiA9IHUuejtcbiAgICB2YXIgeHkgPSB1eCAqIHV5O1xuICAgIHZhciB4eiA9IHV4ICogdXo7XG4gICAgdmFyIHl6ID0gdXkgKiB1ejtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3MgKyAoKHV4KnV4KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMV0gPSAoeHkqY29zMSkgLSAodXoqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMl0gPSAoeHoqY29zMSkrKHV5KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzRdID0gKHh5KmNvczEpKyh1eipzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcysoKHV5KnV5KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNl0gPSAoeXoqY29zMSktKHV4KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzhdID0gKHh6KmNvczEpLSh1eSpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs5XSA9ICh5eipjb3MxKSsodXgqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zICsgKCh1eip1eikqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBwaXRjaCwgeWF3LCBhbmQgcm9sbFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHBpdGNoXG4gKiBAcGFyYW0ge251bWJlcn0geWF3XG4gKiBAcGFyYW0ge251bWJlcn0gcm9sbFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb24gPSBmdW5jdGlvbihwaXRjaCwgeWF3LCByb2xsKXtcbiAgICByZXR1cm4gTWF0cml4LnJvdGF0aW9uWChyb2xsKS5tdWx0aXBseShNYXRyaXgucm90YXRpb25aKHlhdykpLm11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblkocGl0Y2gpKTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB0cmFuc2xhdGlvbiBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBkaXN0YW5jZXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnRyYW5zbGF0aW9uID0gZnVuY3Rpb24oeHRyYW5zLCB5dHJhbnMsIHp0cmFucyl7XG4gICAgdmFyIHRyYW5zbGF0aW9uX21hdHJpeCA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxMl0gPSB4dHJhbnM7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEzXSA9IHl0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTRdID0genRyYW5zO1xuICAgIHJldHVybiB0cmFuc2xhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgc2NhbGluZyBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBzY2FsZVxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguc2NhbGUgPSBmdW5jdGlvbih4c2NhbGUsIHlzY2FsZSwgenNjYWxlKXtcbiAgICB2YXIgc2NhbGluZ19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgc2NhbGluZ19tYXRyaXhbMF0gPSB4c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbNV0gPSB5c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbMTBdID0genNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHNjYWxpbmdfbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhbiBpZGVudGl0eSBtYXRyaXhcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LmlkZW50aXR5ID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgaWRlbnRpdHkgPSBuZXcgTWF0cml4KCk7XG4gICAgaWRlbnRpdHlbMF0gPSAxO1xuICAgIGlkZW50aXR5WzVdID0gMTtcbiAgICBpZGVudGl0eVsxMF0gPSAxO1xuICAgIGlkZW50aXR5WzE1XSA9IDE7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHplcm8gbWF0cml4XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC56ZXJvID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gbmV3IE1hdHJpeCgpO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIG5ldyBtYXRyaXggZnJvbSBhbiBhcnJheVxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguZnJvbUFycmF5ID0gZnVuY3Rpb24oYXJyKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gYXJyW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0cml4O1xufSx7fV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIDNEIHZlY3Rvci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IHggeCBjb29yZGluYXRlXG4gKiBAcGFyYW0ge251bWJlcn0geSB5IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB6IHogY29vcmRpbmF0ZVxuICovXG5mdW5jdGlvbiBWZWN0b3IoeCwgeSwgeil7XG4gICAgaWYgKHR5cGVvZiB4ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHogPT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnN1ZmZpY2llbnQgYXJndW1lbnRzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMueiA9IHo7XG4gICAgfVxufVxuLyoqXG4gKiBBZGQgdmVjdG9yIHRvIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB2ZWN0b3IueCwgdGhpcy55ICsgdmVjdG9yLnksIHRoaXMueiArIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIFN1YnRyYWN0IHZlY3RvciBmcm9tIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHZlY3Rvci54LCB0aGlzLnkgLSB2ZWN0b3IueSwgdGhpcy56IC0gdmVjdG9yLnopO1xufTtcbi8qKlxuICogQ29tcGFyZSB2ZWN0b3Igd2l0aCBzZWxmIGZvciBlcXVhbGl0eVxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5lcXVhbCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIHRoaXMueCA9PT0gdmVjdG9yLnggJiYgdGhpcy55ID09PSB2ZWN0b3IueSAmJiB0aGlzLnogPT09IHZlY3Rvci56O1xufTtcbi8qKlxuICogRmluZCBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmFuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gTWF0aC5hY29zKHRoZXRhKTtcbn07XG4vKipcbiAqIEZpbmQgdGhlIGNvcyBvZiB0aGUgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jb3NBbmdsZSA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIGEgPSB0aGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBiID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBhbWFnID0gYS5tYWduaXR1ZGUoKTtcbiAgICB2YXIgYm1hZyA9IGIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSBhLmRvdChiKSAvIChhbWFnICogYm1hZyApO1xuICAgIGlmICh0aGV0YSA8IC0xKSB7dGhldGEgPSAtMTt9XG4gICAgaWYgKHRoZXRhID4gMSkge3RoZXRhID0gMTt9XG4gICAgcmV0dXJuIHRoZXRhO1xufTtcbi8qKlxuICogRmluZCBtYWduaXR1ZGUgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KSk7XG59O1xuLyoqXG4gKiBGaW5kIG1hZ25pdHVkZSBzcXVhcmVkIG9mIGEgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZVNxdWFyZWQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAodGhpcy54ICogdGhpcy54KSArICh0aGlzLnkgKiB0aGlzLnkpICsgKHRoaXMueiAqIHRoaXMueik7XG59O1xuLyoqXG4gKiBGaW5kIGRvdCBwcm9kdWN0IG9mIHNlbGYgYW5kIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiAodGhpcy54ICogdmVjdG9yLngpICsgKHRoaXMueSAqIHZlY3Rvci55KSArICh0aGlzLnogKiB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBGaW5kIGNyb3NzIHByb2R1Y3Qgb2Ygc2VsZiBhbmQgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3RvcihcbiAgICAgICAgKHRoaXMueSAqIHZlY3Rvci56KSAtICh0aGlzLnogKiB2ZWN0b3IueSksXG4gICAgICAgICh0aGlzLnogKiB2ZWN0b3IueCkgLSAodGhpcy54ICogdmVjdG9yLnopLFxuICAgICAgICAodGhpcy54ICogdmVjdG9yLnkpIC0gKHRoaXMueSAqIHZlY3Rvci54KVxuICAgICk7XG59O1xuLyoqXG4gKiBOb3JtYWxpemUgc2VsZi5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqIEB0aHJvd3Mge1plcm9EaXZpc2lvbkVycm9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlKCk7XG4gICAgaWYgKG1hZ25pdHVkZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC8gbWFnbml0dWRlLCB0aGlzLnkgLyBtYWduaXR1ZGUsIHRoaXMueiAvIG1hZ25pdHVkZSk7XG59O1xuLyoqXG4gKiBTY2FsZSBzZWxmIGJ5IHNjYWxlLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICogc2NhbGUsIHRoaXMueSAqIHNjYWxlLCB0aGlzLnogKiBzY2FsZSk7XG59O1xuLyoqXG4gKiBOZWdhdGVzIHNlbGZcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gW2Rlc2NyaXB0aW9uXVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XG59O1xuLyoqXG4gKiBQcm9qZWN0IHNlbGYgb250byB2ZWN0b3JcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS52ZWN0b3JQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgbWFnID0gdmVjdG9yLm1hZ25pdHVkZSgpO1xuICAgIHJldHVybiB2ZWN0b3Iuc2NhbGUodGhpcy5kb3QodmVjdG9yKSAvIChtYWcgKiBtYWcpKTtcbn07XG4vKipcbiAqIFByb2plY3Qgc2VsZiBvbnRvIHZlY3RvclxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxhclByb2plY3Rpb24gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiB0aGlzLmRvdCh2ZWN0b3IpIC8gdmVjdG9yLm1hZ25pdHVkZSgpO1xufTtcbi8qKlxuICogUGVyZm9ybSBsaW5lYXIgdHJhbmZvcm1hdGlvbiBvbiBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IHRyYW5zZm9ybV9tYXRyaXhcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbih0cmFuc2Zvcm1fbWF0cml4KXtcbiAgICB2YXIgeCA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzBdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzRdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzhdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTJdO1xuICAgIHZhciB5ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMV0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNV0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOV0pICsgdHJhbnNmb3JtX21hdHJpeFsxM107XG4gICAgdmFyIHogPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsyXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs2XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMF0pICsgdHJhbnNmb3JtX21hdHJpeFsxNF07XG4gICAgdmFyIHcgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFszXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs3XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMV0pICsgdHJhbnNmb3JtX21hdHJpeFsxNV07XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCAvIHcsIHkgLyB3LCB6IC8gdyk7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKGF4aXMsIHRoZXRhKXtcbiAgICB2YXIgdSA9IGF4aXMubm9ybWFsaXplKCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdS54O1xuICAgIHZhciB1eSA9IHUueTtcbiAgICB2YXIgdXogPSB1Lno7XG4gICAgdmFyIHh5ID0gdS54ICogdS55O1xuICAgIHZhciB4eiA9IHUueCAqIHUuejtcbiAgICB2YXIgeXogPSB1LnkgKiB1Lno7XG4gICAgdmFyIHggPSAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueCkgKyAoKCh4eSpjb3MxKSAtICh1eipzaW4pKSAqIHRoaXMueSkgKyAoKCh4eipjb3MxKSsodXkqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB5ID0gKCgoeHkqY29zMSkrKHV6KnNpbikpICogdGhpcy54KSArICgoY29zKygodXkqdXkpKmNvczEpKSAqIHRoaXMueSkgKyAoKCh5eipjb3MxKS0odXgqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKCgoeHoqY29zMSktKHV5KnNpbikpICogdGhpcy54KSArICgoKHl6KmNvczEpKyh1eCpzaW4pKSAqIHRoaXMueSkgKyAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgeC1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVYID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IChjb3MgKiB0aGlzLnkpIC0gKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoc2luICogdGhpcy55KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHktYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICp0aGlzLngpICsgKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSAtKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB6LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gKGNvcyAqIHRoaXMueCkgLSAoc2luICogdGhpcy55KTtcbiAgICB2YXIgeSA9IChzaW4gKiB0aGlzLngpICsgKGNvcyAqIHRoaXMueSk7XG4gICAgdmFyIHogPSB0aGlzLno7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSBwaXRjaCwgeWF3LCByb2xsXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlUGl0Y2hZYXdSb2xsID0gZnVuY3Rpb24ocGl0Y2hfYW1udCwgeWF3X2FtbnQsIHJvbGxfYW1udCkge1xuICAgIHJldHVybiB0aGlzLnJvdGF0ZVgocm9sbF9hbW50KS5yb3RhdGVZKHBpdGNoX2FtbnQpLnJvdGF0ZVooeWF3X2FtbnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XG59LHt9XX0se30sWzFdKVxuKDEpXG59KTtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIG1hdGggPSByZXF1aXJlKCdsaW5lYXJhbGdlYScpO1xudmFyIFZlY3RvciA9IG1hdGguVmVjdG9yO1xudmFyIE1hdHJpeCA9IG1hdGguTWF0cml4O1xuXG4vKiogXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSBwb3NpdGlvbiBDYW1lcmEgcG9zaXRpb24uXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZ2V0ICAgQ2FtZXJhXG4gKi9cbmZ1bmN0aW9uIENhbWVyYSh3aWR0aCwgaGVpZ2h0LCBwb3NpdGlvbil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IG5ldyBWZWN0b3IoMSwxLDIwKTtcbiAgICB0aGlzLnVwID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5uZWFyID0gMC4xO1xuICAgIHRoaXMuZmFyID0gMTAwMDtcbiAgICB0aGlzLmZvdiA9IDkwO1xuICAgIHRoaXMucGVyc3BlY3RpdmVGb3YgPSB0aGlzLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92KCk7XG59XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi5waXRjaCk7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHRoaXMucm90YXRpb24ucGl0Y2gpO1xuICAgIHZhciBzaW5feWF3ID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi55YXcpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbi55YXcpO1xuXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLWNvc19waXRjaCAqIHNpbl95YXcsIHNpbl9waXRjaCwgLWNvc19waXRjaCAqIGNvc195YXcpO1xufTtcbi8qKlxuICogQnVpbGRzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggYmFzZWQgb24gYSBmaWVsZCBvZiB2aWV3LlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5DYW1lcmEucHJvdG90eXBlLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvdiA9IHRoaXMuZm92ICogKE1hdGguUEkgLyAxODApOyAvLyBjb252ZXJ0IHRvIHJhZGlhbnNcbiAgICB2YXIgYXNwZWN0ID0gdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0O1xuICAgIHZhciBuZWFyID0gdGhpcy5uZWFyO1xuICAgIHZhciBmYXIgPSB0aGlzLmZhcjtcbiAgICB2YXIgbWF0cml4ID0gTWF0cml4Lnplcm8oKTtcbiAgICB2YXIgaGVpZ2h0ID0gKDEvTWF0aC50YW4oZm92LzIpKSAqIHRoaXMuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IGhlaWdodCAqIGFzcGVjdDtcblxuICAgIG1hdHJpeFswXSA9IHdpZHRoO1xuICAgIG1hdHJpeFs1XSA9IGhlaWdodDtcbiAgICBtYXRyaXhbMTBdID0gZmFyLyhuZWFyLWZhcikgO1xuICAgIG1hdHJpeFsxMV0gPSAtMTtcbiAgICBtYXRyaXhbMTRdID0gbmVhcipmYXIvKG5lYXItZmFyKTtcblxuICAgIHJldHVybiBtYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUuY3JlYXRlVmlld01hdHJpeCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGV5ZSA9IHRoaXMucG9zaXRpb247XG4gICAgdmFyIHBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaDtcbiAgICB2YXIgeWF3ID0gdGhpcy5yb3RhdGlvbi55YXc7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHBpdGNoKTtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4ocGl0Y2gpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3MoeWF3KTtcbiAgICB2YXIgc2luX3lhdyA9IE1hdGguc2luKHlhdyk7XG5cbiAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKGNvc195YXcsIDAsIC1zaW5feWF3ICk7XG4gICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcihzaW5feWF3ICogc2luX3BpdGNoLCBjb3NfcGl0Y2gsIGNvc195YXcgKiBzaW5fcGl0Y2ggKTtcbiAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKHNpbl95YXcgKiBjb3NfcGl0Y2gsIC1zaW5fcGl0Y2gsIGNvc19waXRjaCAqIGNvc195YXcgKTtcblxuICAgIHZhciB2aWV3X21hdHJpeCA9IE1hdHJpeC5mcm9tQXJyYXkoW1xuICAgICAgICB4YXhpcy54LCB5YXhpcy54LCB6YXhpcy54LCAwLFxuICAgICAgICB4YXhpcy55LCB5YXhpcy55LCB6YXhpcy55LCAwLFxuICAgICAgICB4YXhpcy56LCB5YXhpcy56LCB6YXhpcy56LCAwLFxuICAgICAgICAtKHhheGlzLmRvdChleWUpICksIC0oIHlheGlzLmRvdChleWUpICksIC0oIHpheGlzLmRvdChleWUpICksIDFcbiAgICBdKTtcbiAgICByZXR1cm4gdmlld19tYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSwgeil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IoeCx5LHopO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlUmlnaHQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciByaWdodCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChyaWdodCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVMZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgbGVmdCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQobGVmdCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbkNhbWVyYS5wcm90b3R5cGUudHVyblJpZ2h0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3IDwgMCl7XG4gICAgICAgIHRoaXMucm90YXRpb24ueWF3ID0gdGhpcy5yb3RhdGlvbi55YXcgKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLnR1cm5MZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3ID4gKE1hdGguUEkqMikpe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnlhdyA9IHRoaXMucm90YXRpb24ueWF3IC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5DYW1lcmEucHJvdG90eXBlLmxvb2tVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPiAoTWF0aC5QSSoyKSl7XG4gICAgICAgIHRoaXMucm90YXRpb24ucGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoIC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5sb29rRG93biA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPCAwKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi5waXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2ggKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIHVwID0gdGhpcy51cC5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KHVwKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZURvd24gPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciB1cCA9IHRoaXMudXAubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQodXApO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlRm9yd2FyZCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGZvcndhcmQgPSB0aGlzLmRpcmVjdGlvbigpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKGZvcndhcmQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlQmFja3dhcmQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBiYWNrd2FyZCA9IHRoaXMuZGlyZWN0aW9uKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChiYWNrd2FyZCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIvKipcbiAqIEV2ZW50IGhhbmRsZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgTmljaG9sYXMgQy4gWmFrYXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBNSVQgTGljZW5zZVxuICovXG5cbmZ1bmN0aW9uIEV2ZW50VGFyZ2V0KCl7XG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG59XG5cbi8qKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICBpZiAodHlwZW9mIHRoaXMuX2xpc3RlbmVyc1t0eXBlXSA9PT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgIH1cblxuICAgIHRoaXMuX2xpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbn07XG4vKipcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge3N0cmluZ30gZXZlbnRcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBldmVudCB0eXBlIGRvZXMgbm90IGV4aXN0IGluIEV2ZW50VGFyZ2V0XG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICBldmVudCA9IHsgdHlwZTogZXZlbnQgfTtcbiAgICB9XG4gICAgaWYgKCFldmVudC50YXJnZXQpe1xuICAgICAgICBldmVudC50YXJnZXQgPSB0aGlzO1xuICAgIH1cblxuICAgIGlmICghZXZlbnQudHlwZSl7ICAvL2ZhbHN5XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV2ZW50IG9iamVjdCBtaXNzaW5nICd0eXBlJyBwcm9wZXJ0eS5cIik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1tldmVudC50eXBlXSBpbnN0YW5jZW9mIEFycmF5KXtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldmVudC50eXBlXTtcbiAgICAgICAgZm9yICh2YXIgaT0wLCBsZW49bGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4vKipcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICogQHBhcmFtICB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW3R5cGVdIGluc3RhbmNlb2YgQXJyYXkpe1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICBmb3IgKHZhciBpPTAsIGxlbj1saXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXSA9PT0gbGlzdGVuZXIpe1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50VGFyZ2V0OyIsInZhciBtYXRoID0gcmVxdWlyZSgnbGluZWFyYWxnZWEnKTtcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYS5qcycpO1xudmFyIEV2ZW50VGFyZ2V0ID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBLRVlDT0RFUyA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy9rZXljb2Rlcy5qcycpO1xuXG52YXIgVmVjdG9yID0gbWF0aC5WZWN0b3I7XG52YXIgTWF0cml4ID0gbWF0aC5NYXRyaXg7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3tjYW52YXNfaWQ6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXJ9fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFNjZW5lKG9wdGlvbnMpe1xuICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoO1xuICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQ7XG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRpb25zLmNhbnZhc19pZCk7XG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXIud2lkdGggPSB0aGlzLndpZHRoO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyLmhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2N0eCA9IHRoaXMuX2JhY2tfYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSBudWxsO1xuICAgIHRoaXMuX2RlcHRoX2J1ZmZlciA9IFtdO1xuICAgIHRoaXMuX2JhY2tmYWNlX2N1bGxpbmcgPSB0cnVlO1xuICAgIHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5pbGx1bWluYXRpb24gPSBuZXcgVmVjdG9yKDkwLDAsMCk7XG4gICAgLyoqIEB0eXBlIHtBcnJheS48TWVzaD59ICovXG4gICAgdGhpcy5tZXNoZXMgPSB7fTtcbiAgICAvKiogQHR5cGUge09iamVjdC48bnVtYmVyLCBib29sZWFuPn0gKi9cbiAgICB0aGlzLl9rZXlzID0ge307IC8vIEtleXMgY3VycmVudGx5IHByZXNzZWRcbiAgICB0aGlzLl9rZXlfY291bnQgPSAwOyAvLyBOdW1iZXIgb2Yga2V5cyBiZWluZyBwcmVzc2VkLi4uIHRoaXMgZmVlbHMga2x1ZGd5XG4gICAgLyoqIEB0eXBlIHs/bnVtYmVyfSAqL1xuICAgIHRoaXMuX2FuaW1faWQgPSBudWxsO1xuICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICB0aGlzLl9uZWVkc191cGRhdGUgPSB0cnVlO1xuICAgIHRoaXMuX2RyYXdfbW9kZSA9IDA7XG4gICAgdGhpcy5pbml0KCk7XG59XG5TY2VuZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRUYXJnZXQoKTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5jYW52YXMudGFiSW5kZXggPSAxOyAvLyBTZXQgdGFiIGluZGV4IHRvIGFsbG93IGNhbnZhcyB0byBoYXZlIGZvY3VzIHRvIHJlY2VpdmUga2V5IGV2ZW50c1xuICAgIHRoaXMuX3hfb2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMik7XG4gICAgdGhpcy5feV9vZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgdGhpcy5pbml0aWFsaXplRGVwdGhCdWZmZXIoKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IHRoaXMuX2JhY2tfYnVmZmVyX2N0eC5jcmVhdGVJbWFnZURhdGEodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bi5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLmVtcHR5S2V5cy5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgRXZlbnRUYXJnZXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xufTtcbi8qKlxuICogRHVtcCBhbGwgcHJlc3NlZCBrZXlzIG9uIGJsdXIuXG4gKiBAbWV0aG9kXG4gKi9cblNjZW5lLnByb3RvdHlwZS5lbXB0eUtleXMgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuX2tleV9jb3VudCA9IDA7XG4gICAgdGhpcy5fa2V5cyA9IHt9O1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaXNLZXlEb3duID0gZnVuY3Rpb24oa2V5KXtcbiAgICB2YXIgcHJlc3NlZCA9IEtFWUNPREVTW2tleV07XG4gICAgcmV0dXJuIChwcmVzc2VkIGluIHRoaXMuX2tleXMgJiYgdGhpcy5fa2V5c1twcmVzc2VkXSk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5vbktleURvd24gPSBmdW5jdGlvbihlKXtcbiAgICB2YXIgcHJlc3NlZCA9IGUua2V5Q29kZSB8fCBlLndoaWNoO1xuICAgIGlmICghdGhpcy5pc0tleURvd24ocHJlc3NlZCkpe1xuICAgICAgICB0aGlzLl9rZXlfY291bnQgKz0gMTtcbiAgICAgICAgdGhpcy5fa2V5c1twcmVzc2VkXSA9IHRydWU7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub25LZXlVcCA9IGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwcmVzc2VkID0gZS5rZXlDb2RlIHx8IGUud2hpY2g7XG4gICAgaWYgKHByZXNzZWQgaW4gdGhpcy5fa2V5cyl7XG4gICAgICAgIHRoaXMuX2tleV9jb3VudCAtPSAxO1xuICAgICAgICB0aGlzLl9rZXlzW3ByZXNzZWRdID0gZmFsc2U7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuaW5pdGlhbGl6ZURlcHRoQnVmZmVyID0gZnVuY3Rpb24oKXtcbiAgICBmb3IgKHZhciB4ID0gMCwgbGVuID0gdGhpcy53aWR0aCAqIHRoaXMuaGVpZ2h0OyB4IDwgbGVuOyB4Kyspe1xuICAgICAgICB0aGlzLl9kZXB0aF9idWZmZXJbeF0gPSA5OTk5OTk5O1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9mZnNjcmVlbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgLy8gVE9ETzogTm90IHRvdGFsbHkgY2VydGFpbiB0aGF0IHo+MSBpbmRpY2F0ZXMgdmVjdG9yIGlzIGJlaGluZCBjYW1lcmEuXG4gICAgdmFyIHggPSB2ZWN0b3IueCArIHRoaXMuX3hfb2Zmc2V0O1xuICAgIHZhciB5ID0gdmVjdG9yLnkgKyB0aGlzLl95X29mZnNldDtcbiAgICB2YXIgeiA9IHZlY3Rvci56O1xuICAgIHJldHVybiAoeiA+IDEgfHwgeCA8IDAgfHwgeCA+IHRoaXMud2lkdGggfHwgeSA8IDAgfHwgeSA+IHRoaXMuaGVpZ2h0KTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnRvZ2dsZURyYXdNb2RlID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLl9kcmF3X21vZGUgPSAodGhpcy5fZHJhd19tb2RlICsgMSkgJSAyO1xuICAgIHRoaXMucmVuZGVyU2NlbmUoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnRvZ2dsZUJhY2tmYWNlQ3VsbGluZyA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5fYmFja2ZhY2VfY3VsbGluZyA9ICF0aGlzLl9iYWNrZmFjZV9jdWxsaW5nO1xuICAgIHRoaXMucmVuZGVyU2NlbmUoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdQaXhlbCA9IGZ1bmN0aW9uKHgsIHksIHosIGNvbG9yKXtcbiAgICB4ID0geCArIHRoaXMuX3hfb2Zmc2V0O1xuICAgIHkgPSB5ICsgdGhpcy5feV9vZmZzZXQ7XG4gICAgaWYgKHggPj0gMCAmJiB4IDwgdGhpcy53aWR0aCAmJiB5ID49IDAgJiYgeSA8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHggKyAoeSAqIHRoaXMud2lkdGgpO1xuICAgICAgICBpZiAoeiA8IHRoaXMuX2RlcHRoX2J1ZmZlcltpbmRleF0pIHtcbiAgICAgICAgICAgIHZhciBpbWFnZV9kYXRhID0gdGhpcy5fYmFja19idWZmZXJfaW1hZ2UuZGF0YTtcbiAgICAgICAgICAgIHZhciBpID0gaW5kZXggKiA0O1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpXSA9IGNvbG9yLnI7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krMV0gPSBjb2xvci5nO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzJdID0gY29sb3IuYjtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSszXSA9IDI1NTtcbiAgICAgICAgICAgIHRoaXMuX2RlcHRoX2J1ZmZlcltpbmRleF0gPSB6O1xuICAgICAgICB9XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdFZGdlID0gZnVuY3Rpb24odmVjdG9yMSwgdmVjdG9yMiwgY29sb3Ipe1xuICAgIHZhciBhYnMgPSBNYXRoLmFicztcbiAgICBpZiAodmVjdG9yMS54ID49IHZlY3RvcjIueCl7XG4gICAgICAgIHZhciB0ZW1wID0gdmVjdG9yMTtcbiAgICAgICAgdmVjdG9yMSA9IHZlY3RvcjI7XG4gICAgICAgIHZlY3RvcjIgPSB0ZW1wO1xuICAgIH1cbiAgICB2YXIgY3VycmVudF94ID0gdmVjdG9yMS54O1xuICAgIHZhciBjdXJyZW50X3kgPSB2ZWN0b3IxLnk7XG4gICAgdmFyIGN1cnJlbnRfeiA9IHZlY3RvcjEuejtcbiAgICB2YXIgbG9uZ2VzdF9kaXN0ID0gTWF0aC5tYXgoYWJzKHZlY3RvcjIueCAtIHZlY3RvcjEueCksIGFicyh2ZWN0b3IyLnkgLSB2ZWN0b3IxLnkpLCBhYnModmVjdG9yMi56IC0gdmVjdG9yMS56KSk7XG4gICAgdmFyIHN0ZXBfeCA9ICh2ZWN0b3IyLnggLSB2ZWN0b3IxLngpIC8gbG9uZ2VzdF9kaXN0O1xuICAgIHZhciBzdGVwX3kgPSAodmVjdG9yMi55IC0gdmVjdG9yMS55KSAvIGxvbmdlc3RfZGlzdDtcbiAgICB2YXIgc3RlcF96ID0gKHZlY3RvcjIueiAtIHZlY3RvcjEueikgLyBsb25nZXN0X2Rpc3Q7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvbmdlc3RfZGlzdDsgaSsrKXtcbiAgICAgICAgdGhpcy5kcmF3UGl4ZWwoTWF0aC5mbG9vcihjdXJyZW50X3gpLCBNYXRoLmZsb29yKGN1cnJlbnRfeSksIGN1cnJlbnRfeiwgY29sb3IpO1xuICAgICAgICBjdXJyZW50X3ggKz0gc3RlcF94O1xuICAgICAgICBjdXJyZW50X3kgKz0gc3RlcF95O1xuICAgICAgICBjdXJyZW50X3ogKz0gc3RlcF96O1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdUcmlhbmdsZSA9IGZ1bmN0aW9uKHZlY3RvcjEsIHZlY3RvcjIsIHZlY3RvcjMsIGNvbG9yKXtcbiAgICB0aGlzLmRyYXdFZGdlKHZlY3RvcjEsIHZlY3RvcjIsIGNvbG9yKTtcbiAgICB0aGlzLmRyYXdFZGdlKHZlY3RvcjIsIHZlY3RvcjMsIGNvbG9yKTtcbiAgICB0aGlzLmRyYXdFZGdlKHZlY3RvcjMsIHZlY3RvcjEsIGNvbG9yKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmZpbGxUcmlhbmdsZSA9IGZ1bmN0aW9uKHYxLCB2MiwgdjMsIGNvbG9yKXtcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBjaHVncyB3aGVuIGNsb3NlIHRvIGEgZmFjZS4gU2VlIGlmIHRoaXMgY2FuIGJlIGZpeGVkLlxuICAgIC8vIElzIHRoaXMganVzdCBiZWNhdXNlIGl0J3MgbG9vcGluZyBvdmVyIHNvIG1hbnkgZXh0cmFuZW91cyBwb2ludHM/XG4gICAgLy8gRGVjb21wb3NpbmcgaW50byBzbWFsbGVyIHRyaWFuZ2xlcyBtYXkgYWxsZXZpYXRlIHRoaXMgc29tZXdoYXQuXG4gICAgdmFyIHgwID0gdjEueDtcbiAgICB2YXIgeDEgPSB2Mi54O1xuICAgIHZhciB4MiA9IHYzLng7XG4gICAgdmFyIHkwID0gdjEueTtcbiAgICB2YXIgeTEgPSB2Mi55O1xuICAgIHZhciB5MiA9IHYzLnk7XG4gICAgdmFyIHowID0gdjEuejtcbiAgICB2YXIgejEgPSB2Mi56O1xuICAgIHZhciB6MiA9IHYzLno7XG5cbiAgICAvLyBDb21wdXRlIG9mZnNldHMuIFVzZWQgdG8gYXZvaWQgY29tcHV0aW5nIGJhcnljZW50cmljIGNvb3JkcyBmb3Igb2Zmc2NyZWVuIHBpeGVsc1xuICAgIHZhciB4bGVmdCA9IDAgLSB0aGlzLl94X29mZnNldDtcbiAgICB2YXIgeHJpZ2h0ID0gdGhpcy53aWR0aCAtIHRoaXMuX3hfb2Zmc2V0O1xuICAgIHZhciB5dG9wID0gMCAtIHRoaXMuX3lfb2Zmc2V0O1xuICAgIHZhciB5Ym90ID0gdGhpcy5oZWlnaHQgLSB0aGlzLl95X29mZnNldDtcblxuICAgIC8vIENvbXB1dGUgYm91bmRpbmcgYm94XG4gICAgdmFyIHhtaW4gPSBNYXRoLmZsb29yKE1hdGgubWluKHgwLCB4MSwgeDIpKTtcbiAgICBpZiAoeG1pbiA8IHhsZWZ0KXt4bWluPXhsZWZ0O31cbiAgICB2YXIgeG1heCA9IE1hdGguY2VpbChNYXRoLm1heCh4MCwgeDEsIHgyKSk7XG4gICAgaWYgKHhtYXggPiB4cmlnaHQpe3htYXg9eHJpZ2h0O31cbiAgICB2YXIgeW1pbiA9IE1hdGguZmxvb3IoTWF0aC5taW4oeTAsIHkxLCB5MikpO1xuICAgIGlmICh5bWluIDwgeXRvcCl7eW1pbj15dG9wO31cbiAgICB2YXIgeW1heCA9IE1hdGguY2VpbChNYXRoLm1heCh5MCwgeTEsIHkyKSk7XG4gICAgaWYgKHltYXggPiB5Ym90KXt5bWF4PXlib3Q7fVxuXG4gICAgLy8gUHJlY29tcHV0ZSBhcyBtdWNoIGFzIHBvc3NpYmxlXG4gICAgdmFyIHkyeTAgPSB5Mi15MDtcbiAgICB2YXIgeDB4MiA9IHgwLXgyO1xuICAgIHZhciB5MHkxID0geTAteTE7XG4gICAgdmFyIHgxeDAgPSB4MS14MDtcbiAgICB2YXIgeDJ5MHgweTIgPSB4Mip5MCAtIHgwKnkyO1xuICAgIHZhciB4MHkxeDF5MCA9IHgwKnkxIC0geDEqeTA7XG4gICAgdmFyIGYyMHgxeTEgPSAoKHkyeTAqeDEpICsgKHgweDIqeTEpICsgeDJ5MHgweTIpO1xuICAgIHZhciBmMDF4MnkyID0gKCh5MHkxKngyKSArICh4MXgwKnkyKSArIHgweTF4MXkwKTtcblxuICAgIHZhciB5Mnkwb3ZlcmYyMHgxeTEgPSB5MnkwL2YyMHgxeTE7XG4gICAgdmFyIHgweDJvdmVyZjIweDF5MSA9IHgweDIvZjIweDF5MTtcbiAgICB2YXIgeDJ5MHgweTIxb3ZlcmYyMHgxeTEgPSB4MnkweDB5Mi9mMjB4MXkxO1xuXG4gICAgdmFyIHkweTFvdmVyZjAxeDJ5MiA9IHkweTEvZjAxeDJ5MjtcbiAgICB2YXIgeDB4Mm92ZXJmMDF4MnkyID0geDF4MC9mMDF4MnkyO1xuICAgIHZhciB4MnkweDB5Mm92ZXJmMDF4MnkyID0geDB5MXgxeTAvZjAxeDJ5MjtcblxuICAgIC8vIExvb3Agb3ZlciBib3VuZGluZyBib3hcbiAgICBmb3IgKHZhciB4ID0geG1pbjsgeCA8PSB4bWF4OyB4Kyspe1xuICAgICAgICBmb3IgKHZhciB5ID0geW1pbjsgeSA8PSB5bWF4OyB5Kyspe1xuICAgICAgICAgICAgLy8gQ29tcHV0ZSBiYXJ5Y2VudHJpYyBjb29yZGluYXRlc1xuICAgICAgICAgICAgLy8gSWYgYW55IG9mIHRoZSBjb29yZGluYXRlcyBhcmUgbm90IGluIHRoZSByYW5nZSBbMCwxXSwgdGhlbiB0aGVcbiAgICAgICAgICAgIC8vIHBvaW50IGlzIG5vdCBpbnNpZGUgdGhlIHRyaWFuZ2xlLiBSYXRoZXIgdGhhbiBjb21wdXRlIGFsbCB0aGVcbiAgICAgICAgICAgIC8vIGNvb3JkaW5hdGVzIHN0cmFpZ2h0IGF3YXksIHdlJ2xsIHNob3J0LWNpcmN1aXQgYXMgc29vbiBhcyBhIGNvb3JkaW5hdGUgb3V0c2lkZVxuICAgICAgICAgICAgLy8gb2YgdGhhdCByYW5nZSBpcyBlbmNvdW50ZXJlZC5cbiAgICAgICAgICAgIHZhciBiZXRhID0geTJ5MG92ZXJmMjB4MXkxKnggKyB4MHgyb3ZlcmYyMHgxeTEqeSArIHgyeTB4MHkyMW92ZXJmMjB4MXkxO1xuICAgICAgICAgICAgaWYgKGJldGEgPj0gMCAmJiBiZXRhIDw9IDEpe1xuICAgICAgICAgICAgICAgIHZhciBnYW1tYSA9IHkweTFvdmVyZjAxeDJ5Mip4ICsgeDB4Mm92ZXJmMDF4MnkyKnkgK3gyeTB4MHkyb3ZlcmYwMXgyeTI7XG4gICAgICAgICAgICAgICAgaWYgKGdhbW1hID49IDAgJiYgZ2FtbWEgPD0gMSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbHBoYSA9IDEgLSBiZXRhIC0gZ2FtbWE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhbHBoYSA+PSAwICYmIGFscGhhIDw9IDEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYWxsIGJhcnljZW50cmljIGNvb3JkcyB3aXRoaW4gcmFuZ2UgWzAsMV0sIGluc2lkZSB0cmlhbmdsZVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHogPSBhbHBoYSp6MCArIGJldGEqejEgKyBnYW1tYSp6MjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1BpeGVsKHgsIHksIHosIGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnJlbmRlclNjZW5lID0gZnVuY3Rpb24oKXtcbiAgICAvLyBUT0RPOiBTaW1wbGlmeSB0aGlzIGZ1bmN0aW9uLlxuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gdGhpcy5fYmFja19idWZmZXJfY3R4LmNyZWF0ZUltYWdlRGF0YSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5pbml0aWFsaXplRGVwdGhCdWZmZXIoKTtcbiAgICB2YXIgY2FtZXJhX21hdHJpeCA9IHRoaXMuY2FtZXJhLnZpZXdfbWF0cml4O1xuICAgIHZhciBwcm9qZWN0aW9uX21hdHJpeCA9IHRoaXMuY2FtZXJhLnBlcnNwZWN0aXZlRm92O1xuICAgIHZhciBsaWdodCA9IHRoaXMuaWxsdW1pbmF0aW9uO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLm1lc2hlcyl7XG4gICAgICAgIGlmICh0aGlzLm1lc2hlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKXtcbiAgICAgICAgICAgIHZhciBtZXNoID0gdGhpcy5tZXNoZXNba2V5XTtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IG1lc2guc2NhbGU7XG4gICAgICAgICAgICB2YXIgcm90YXRpb24gPSBtZXNoLnJvdGF0aW9uO1xuICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gbWVzaC5wb3NpdGlvbjtcbiAgICAgICAgICAgIHZhciB3b3JsZF9tYXRyaXggPSBNYXRyaXguc2NhbGUoc2NhbGUueCwgc2NhbGUueSwgc2NhbGUueikubXVsdGlwbHkoXG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uKHJvdGF0aW9uLnBpdGNoLCByb3RhdGlvbi55YXcsIHJvdGF0aW9uLnJvbGwpLm11bHRpcGx5KFxuICAgICAgICAgICAgICAgICAgICBNYXRyaXgudHJhbnNsYXRpb24ocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueikpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbWVzaC5mYWNlcy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGZhY2UgPSBtZXNoLmZhY2VzW2tdLmZhY2U7XG4gICAgICAgICAgICAgICAgdmFyIGNvbG9yID0gbWVzaC5mYWNlc1trXS5jb2xvcjtcbiAgICAgICAgICAgICAgICB2YXIgdjEgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMF1dO1xuICAgICAgICAgICAgICAgIHZhciB2MiA9IG1lc2gudmVydGljZXNbZmFjZVsxXV07XG4gICAgICAgICAgICAgICAgdmFyIHYzID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzJdXTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbm9ybWFsXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQ2FuIHRoaXMgYmUgY2FsY3VsYXRlZCBqdXN0IG9uY2UsIGFuZCB0aGVuIHRyYW5zZm9ybWVkIGludG9cbiAgICAgICAgICAgICAgICAvLyBjYW1lcmEgc3BhY2U/XG4gICAgICAgICAgICAgICAgdmFyIGNhbV90b192ZXJ0ID0gdGhpcy5jYW1lcmEucG9zaXRpb24uc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlMSA9IHYyLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lkZTIgPSB2My50cmFuc2Zvcm0od29ybGRfbWF0cml4KS5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIG5vcm0gPSBzaWRlMS5jcm9zcyhzaWRlMik7XG4gICAgICAgICAgICAgICAgaWYgKG5vcm0ubWFnbml0dWRlKCkgPD0gMC4wMDAwMDAwMSl7XG4gICAgICAgICAgICAgICAgICAgIG5vcm0gPSBub3JtO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm0gPSBub3JtLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBCYWNrZmFjZSBjdWxsaW5nLlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYmFja2ZhY2VfY3VsbGluZyB8fCBjYW1fdG9fdmVydC5kb3Qobm9ybSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgd3ZwX21hdHJpeCA9IHdvcmxkX21hdHJpeC5tdWx0aXBseShjYW1lcmFfbWF0cml4KS5tdWx0aXBseShwcm9qZWN0aW9uX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djEgPSB2MS50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djIgPSB2Mi50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3djMgPSB2My50cmFuc2Zvcm0od3ZwX21hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkcmF3ID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IHN1cmZhY2Ugbm9ybWFsc1xuICAgICAgICAgICAgICAgICAgICAvLyB2YXIgZmFjZV90cmFucyA9IE1hdHJpeC50cmFuc2xhdGlvbih3djEueCwgd3YxLnksIHYxLnopO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdFZGdlKHd2MSwgbm9ybS5zY2FsZSgyMCkudHJhbnNmb3JtKGZhY2VfdHJhbnMpLCB7J3InOjI1NSxcImdcIjoyNTUsXCJiXCI6MjU1fSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBGaXggZnJ1c3R1bSBjdWxsaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgcmVhbGx5IHN0dXBpZCBmcnVzdHVtIGN1bGxpbmcuLi4gdGhpcyBjYW4gcmVzdWx0IGluIHNvbWUgZmFjZXMgbm90IGJlaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGRyYXduIHdoZW4gdGhleSBzaG91bGQsIGUuZy4gd2hlbiBhIHRyaWFuZ2xlcyB2ZXJ0aWNlcyBzdHJhZGRsZSB0aGUgZnJ1c3RydW0uXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9mZnNjcmVlbih3djEpICYmIHRoaXMub2Zmc2NyZWVuKHd2MikgJiYgdGhpcy5vZmZzY3JlZW4od3YzKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYXcpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2RyYXdfbW9kZSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUod3YxLCB3djIsIHd2MywgY29sb3IucmdiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZHJhd19tb2RlID09PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlnaHRfZGlyZWN0aW9uID0gbGlnaHQuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbGx1bWluYXRpb25fYW5nbGUgPSBub3JtLmRvdChsaWdodF9kaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yID0gY29sb3IubGlnaHRlbihpbGx1bWluYXRpb25fYW5nbGUqMTUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbFRyaWFuZ2xlKHd2MSwgd3YyLCB3djMsIGNvbG9yLnJnYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4LnB1dEltYWdlRGF0YSh0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSwgMCwgMCk7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIHRoaXMuY3R4LmRyYXdJbWFnZSh0aGlzLl9iYWNrX2J1ZmZlciwgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5hZGRNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgdGhpcy5tZXNoZXNbbWVzaC5uYW1lXSA9IG1lc2g7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5yZW1vdmVNZXNoID0gZnVuY3Rpb24obWVzaCl7XG4gICAgZGVsZXRlIHRoaXMubWVzaGVzW21lc2gubmFtZV07XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpe1xuICAgIGlmICh0aGlzLl9rZXlfY291bnQgPiAwKXtcbiAgICAgICAgdGhpcy5maXJlKCdrZXlkb3duJyk7XG4gICAgfVxuICAgIC8vIFRPRE86IEFkZCBrZXl1cCwgbW91c2Vkb3duLCBtb3VzZWRyYWcsIG1vdXNldXAsIGV0Yy5cbiAgICBpZiAodGhpcy5fbmVlZHNfdXBkYXRlKSB7XG4gICAgICAgIHRoaXMucmVuZGVyU2NlbmUoKTtcbiAgICAgICAgdGhpcy5fbmVlZHNfdXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2FuaW1faWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuZTtcbiIsInZhciBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy9jb2xvci5qcycpO1xuXG4vKipcbiAqIEEgM0QgdHJpYW5nbGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcGFyYW0ge251bWJlcn0gY1xuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yXG4gKi9cbmZ1bmN0aW9uIEZhY2UoYSwgYiwgYywgY29sb3Ipe1xuICAgIHRoaXMuZmFjZSA9IFthLCBiLCBjXTtcbiAgICB0aGlzLmNvbG9yID0gbmV3IENvbG9yKGNvbG9yKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGYWNlOyIsInZhciBWZWN0b3IgPSByZXF1aXJlKCdsaW5lYXJhbGdlYScpLlZlY3RvcjtcbnZhciBGYWNlID0gcmVxdWlyZSgnLi9mYWNlLmpzJyk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtBcnJheS48VmVjdG9yPn0gdmVydGljZXNcbiAqIEBwYXJhbSB7QXJyYXkuPEZhY2U+fSBlZGdlc1xuICovXG5mdW5jdGlvbiBNZXNoKG5hbWUsIHZlcnRpY2VzLCBmYWNlcyl7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnZlcnRpY2VzID0gdmVydGljZXM7XG4gICAgdGhpcy5mYWNlcyA9IGZhY2VzO1xuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yKDAsIDAsIDApO1xuICAgIHRoaXMucm90YXRpb24gPSB7J3lhdyc6IDAsICdwaXRjaCc6IDAsICdyb2xsJzogMH07XG4gICAgdGhpcy5zY2FsZSA9IHsneCc6IDEsICd5JzogMSwgJ3onOiAxfTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3QgYSBNZXNoIGZyb20gYSBKU09OIG9iamVjdC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSAge3tuYW1lOiBzdHJpbmcsIHZlcnRpY2llczogQXJyYXkuPEFycmF5LjxudW1iZXI+PiwgZmFjZXM6IHt7ZmFjZTogQXJyYXkuPG51bWJlcj4sIGNvbG9yOiBzdHJpbmd9fX19IGpzb25cbiAqIEByZXR1cm4ge01lc2h9XG4gKi9cbk1lc2guZnJvbUpTT04gPSBmdW5jdGlvbihqc29uKXtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICB2YXIgZmFjZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0ganNvbi52ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIHZhciB2ZXJ0ZXggPSBqc29uLnZlcnRpY2VzW2ldO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoKG5ldyBWZWN0b3IodmVydGV4WzBdLCB2ZXJ0ZXhbMV0sIHZlcnRleFsyXSkpO1xuICAgIH1cbiAgICBmb3IgKHZhciBqID0gMCwgbG4gPSBqc29uLmZhY2VzLmxlbmd0aDsgaiA8IGxuOyBqKyspe1xuICAgICAgICB2YXIgZmFjZSA9IGpzb24uZmFjZXNbal07XG4gICAgICAgIGZhY2VzLnB1c2gobmV3IEZhY2UoZmFjZS5mYWNlWzBdLCBmYWNlLmZhY2VbMV0sIGZhY2UuZmFjZVsyXSwgZmFjZS5jb2xvcikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IE1lc2goanNvbi5uYW1lLCB2ZXJ0aWNlcywgZmFjZXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZXNoO1xuIiwidmFyIHJnYlRvSHNsLCBwYXJzZUNvbG9yLCBjYWNoZTtcbi8qKlxuICogQSBjb2xvciB3aXRoIGJvdGggcmdiIGFuZCBoc2wgcmVwcmVzZW50YXRpb25zLlxuICogQGNsYXNzIENvbG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgQW55IGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKi9cbmZ1bmN0aW9uIENvbG9yKGNvbG9yKXtcbiAgICB2YXIgcGFyc2VkX2NvbG9yID0ge307XG4gICAgY29sb3IgPSBjb2xvci50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChjb2xvciBpbiBjYWNoZSl7XG4gICAgICAgIHBhcnNlZF9jb2xvciA9IGNhY2hlW2NvbG9yXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJzZWRfY29sb3IgPSBwYXJzZUNvbG9yKGNvbG9yKTtcbiAgICAgICAgY2FjaGVbY29sb3JdID0gcGFyc2VkX2NvbG9yO1xuICAgIH1cbiAgICB2YXIgaHNsID0gcmdiVG9Ic2wocGFyc2VkX2NvbG9yLnIsIHBhcnNlZF9jb2xvci5nLCBwYXJzZWRfY29sb3IuYik7XG4gICAgdGhpcy5yZ2IgPSB7J3InOiBwYXJzZWRfY29sb3IuciwgJ2cnOiBwYXJzZWRfY29sb3IuZywgJ2InOiBwYXJzZWRfY29sb3IuYn07XG4gICAgdGhpcy5oc2wgPSB7J2gnOiBoc2wuaCwgJ3MnOiBoc2wucywgJ2wnOiBoc2wubH07XG4gICAgdGhpcy5hbHBoYSA9IHBhcnNlZF9jb2xvci5hIHx8IDE7XG59XG4vKipcbiAqIExpZ2h0ZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cblxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmxpZ2h0ZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sICsgcGVyY2VudDtcbiAgICBpZiAobHVtID4gMTAwKXtcbiAgICAgICAgbHVtID0gMTAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKFwiaHNsYShcIiArIGhzbC5oICsgXCIsXCIgKyBoc2wucyArIFwiJSxcIiArIGx1bSArIFwiJSxcIiArIHRoaXMuYWxwaGEgKyBcIilcIik7XG59O1xuLyoqXG4gKiBEYXJrZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3J9XG4gKi9cbkNvbG9yLnByb3RvdHlwZS5kYXJrZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sIC0gcGVyY2VudDtcbiAgICBpZiAobHVtIDwgMCl7XG4gICAgICAgIGx1bSA9IDA7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29sb3IoXCJoc2xhKFwiICsgaHNsLmggKyBcIixcIiArIGhzbC5zICsgXCIlLFwiICsgbHVtICsgXCIlLFwiICsgdGhpcy5hbHBoYSArIFwiKVwiKTtcbn07XG4vKipcbiAqIEBwYXJhbSAge251bWJlcn0gciBSZWRcbiAqIEBwYXJhbSAge251bWJlcn0gZyBHcmVlblxuICogQHBhcmFtICB7bnVtYmVyfSBiIEJsdWVcbiAqIEByZXR1cm4ge3toOiBudW1iZXIsIHM6IG51bWJlciwgbDogbnVtYmVyfX1cbiAqL1xucmdiVG9Ic2wgPSBmdW5jdGlvbihyLCBnLCBiKXtcbiAgICByID0gciAvIDI1NTtcbiAgICBnID0gZyAvIDI1NTtcbiAgICBiID0gYiAvIDI1NTtcbiAgICB2YXIgbWF4YyA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIHZhciBtaW5jID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgdmFyIGwgPSBNYXRoLnJvdW5kKCgobWluYyttYXhjKS8yKSoxMDApO1xuICAgIGlmIChsID4gMTAwKSB7bCA9IDEwMDt9XG4gICAgaWYgKGwgPCAwKSB7bCA9IDA7fVxuICAgIHZhciBoLCBzO1xuICAgIGlmIChtaW5jID09PSBtYXhjKXtcbiAgICAgICAgcmV0dXJuIHsnaCc6IDAsICdzJzogMCwgJ2wnOiBsfTtcbiAgICB9XG4gICAgaWYgKGwgPD0gNTApe1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAobWF4YyttaW5jKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKDItbWF4Yy1taW5jKTtcbiAgICB9XG4gICAgdmFyIHJjID0gKG1heGMtcikgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgZ2MgPSAobWF4Yy1nKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBiYyA9IChtYXhjLWIpIC8gKG1heGMtbWluYyk7XG4gICAgaWYgKHIgPT09IG1heGMpe1xuICAgICAgICBoID0gYmMtZ2M7XG4gICAgfVxuICAgIGVsc2UgaWYgKGcgPT09IG1heGMpe1xuICAgICAgICBoID0gMityYy1iYztcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgaCA9IDQrZ2MtcmM7XG4gICAgfVxuICAgIGggPSAoaC82KSAlIDE7XG4gICAgaWYgKGggPCAwKXtoKz0xO31cbiAgICBoID0gTWF0aC5yb3VuZChoKjM2MCk7XG4gICAgcyA9IE1hdGgucm91bmQocyoxMDApO1xuICAgIGlmIChoID4gMzYwKSB7aCA9IDM2MDt9XG4gICAgaWYgKGggPCAwKSB7aCA9IDA7fVxuICAgIGlmIChzID4gMTAwKSB7cyA9IDEwMDt9XG4gICAgaWYgKHMgPCAwKSB7cyA9IDA7fVxuICAgIHJldHVybiB7J2gnOiBoLCAncyc6IHMsICdsJzogbH07XG59O1xuLyoqXG4gKiBQYXJzZSBhIENTUyBjb2xvciB2YWx1ZSBhbmQgcmV0dXJuIGFuIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2xvciBBIGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyfX0gICByZ2JhIGNvbG9yIG9iamVjdC5cbiAqIEB0aHJvd3Mge0NvbG9yRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIC8vIFRPRE86IEhvdyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGUgaXMgdGhpcz8gSG93IGVmZmljaWVudD9cbiAgICAvLyBNYWtlIGEgdGVtcG9yYXJ5IEhUTUwgZWxlbWVudCBzdHlsZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3Igc3RyaW5nXG4gICAgLy8gdGhlbiBleHRyYWN0IGFuZCBwYXJzZSB0aGUgY29tcHV0ZWQgcmdiKGEpIHZhbHVlLlxuICAgIC8vIE4uQi4gVGhpcyBjYW4gY3JlYXRlIGEgbG9vb290IG9mIERPTSBub2Rlcy4gSXQncyBub3QgYSBncmVhdCBtZXRob2QuXG4gICAgLy8gVE9ETzogRml4XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcbiAgICB2YXIgcmdiYSA9IGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgLy8gQ29udmVydCBzdHJpbmcgaW4gZm9ybSAncmdiW2FdKG51bSwgbnVtLCBudW1bLCBudW1dKScgdG8gYXJyYXkgWydudW0nLCAnbnVtJywgJ251bSdbLCAnbnVtJ11dXG4gICAgcmdiYSA9IHJnYmEuc2xpY2UocmdiYS5pbmRleE9mKCcoJykrMSkuc2xpY2UoMCwtMSkucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xuICAgIHZhciByZXR1cm5fY29sb3IgPSB7fTtcbiAgICB2YXIgY29sb3Jfc3BhY2VzID0gWydyJywgJ2cnLCAnYicsICdhJ107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZ2JhLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdChyZ2JhW2ldKTsgLy8gQWxwaGEgdmFsdWUgd2lsbCBiZSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgaWYgKGlzTmFOKHZhbHVlKSl7XG4gICAgICAgICAgICB0aHJvdyBcIkNvbG9yRXJyb3I6IFNvbWV0aGluZyB3ZW50IHdyb25nLiBQZXJoYXBzIFwiICsgY29sb3IgKyBcIiBpcyBub3QgYSBsZWdhbCBDU1MgY29sb3IgdmFsdWVcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybl9jb2xvcltjb2xvcl9zcGFjZXNbaV1dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldHVybl9jb2xvcjtcbn07XG4vLyBQcmUtd2FybSB0aGUgY2FjaGUgd2l0aCBuYW1lZCBjb2xvcnMsIGFzIHRoZXNlIGFyZSBub3Rcbi8vIGNvbnZlcnRlZCB0byByZ2IgdmFsdWVzIGJ5IHRoZSBwYXJzZUNvbG9yIGZ1bmN0aW9uIGFib3ZlLlxuY2FjaGUgPSB7XG4gICAgXCJibGFja1wiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMH0sXG4gICAgXCJzaWx2ZXJcIjoge1wiclwiOiAxOTIsIFwiZ1wiOiAxOTIsIFwiYlwiOiAxOTIsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDc1fSxcbiAgICBcImdyYXlcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDUwfSxcbiAgICBcIndoaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAxMDB9LFxuICAgIFwibWFyb29uXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwicmVkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwicHVycGxlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDEyOCwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImZ1Y2hzaWFcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImxpbWVcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9saXZlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwieWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwibmF2eVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwidGVhbFwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJhcXVhXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2NSwgXCJiXCI6IDAsIFwiaFwiOiAzOSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDIwOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImFudGlxdWV3aGl0ZVwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDIzNSwgXCJiXCI6IDIxNSwgXCJoXCI6IDM0LCBcInNcIjogNzgsIFwibFwiOiA5MX0sXG4gICAgXCJhcXVhbWFyaW5lXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMjEyLCBcImhcIjogMTYwLCBcInNcIjogMTAwLCBcImxcIjogNzV9LFxuICAgIFwiYXp1cmVcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJiZWlnZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDIyMCwgXCJoXCI6IDYwLCBcInNcIjogNTYsIFwibFwiOiA5MX0sXG4gICAgXCJiaXNxdWVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxOTYsIFwiaFwiOiAzMywgXCJzXCI6IDEwMCwgXCJsXCI6IDg4fSxcbiAgICBcImJsYW5jaGVkYWxtb25kXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM1LCBcImJcIjogMjA1LCBcImhcIjogMzYsIFwic1wiOiAxMDAsIFwibFwiOiA5MH0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcInJcIjogMTM4LCBcImdcIjogNDMsIFwiYlwiOiAyMjYsIFwiaFwiOiAyNzEsIFwic1wiOiA3NiwgXCJsXCI6IDUzfSxcbiAgICBcImJyb3duXCI6IHtcInJcIjogMTY1LCBcImdcIjogNDIsIFwiYlwiOiA0MiwgXCJoXCI6IDAsIFwic1wiOiA1OSwgXCJsXCI6IDQxfSxcbiAgICBcImJ1cmx5d29vZFwiOiB7XCJyXCI6IDIyMiwgXCJnXCI6IDE4NCwgXCJiXCI6IDEzNSwgXCJoXCI6IDM0LCBcInNcIjogNTcsIFwibFwiOiA3MH0sXG4gICAgXCJjYWRldGJsdWVcIjoge1wiclwiOiA5NSwgXCJnXCI6IDE1OCwgXCJiXCI6IDE2MCwgXCJoXCI6IDE4MiwgXCJzXCI6IDI1LCBcImxcIjogNTB9LFxuICAgIFwiY2hhcnRyZXVzZVwiOiB7XCJyXCI6IDEyNywgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiA5MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDEwNSwgXCJiXCI6IDMwLCBcImhcIjogMjUsIFwic1wiOiA3NSwgXCJsXCI6IDQ3fSxcbiAgICBcImNvcmFsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTI3LCBcImJcIjogODAsIFwiaFwiOiAxNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDY2fSxcbiAgICBcImNvcm5mbG93ZXJibHVlXCI6IHtcInJcIjogMTAwLCBcImdcIjogMTQ5LCBcImJcIjogMjM3LCBcImhcIjogMjE5LCBcInNcIjogNzksIFwibFwiOiA2Nn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0OCwgXCJiXCI6IDIyMCwgXCJoXCI6IDQ4LCBcInNcIjogMTAwLCBcImxcIjogOTN9LFxuICAgIFwiY3JpbXNvblwiOiB7XCJyXCI6IDIyMCwgXCJnXCI6IDIwLCBcImJcIjogNjAsIFwiaFwiOiAzNDgsIFwic1wiOiA4MywgXCJsXCI6IDQ3fSxcbiAgICBcImRhcmtibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMzksIFwiYlwiOiAxMzksIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrZ29sZGVucm9kXCI6IHtcInJcIjogMTg0LCBcImdcIjogMTM0LCBcImJcIjogMTEsIFwiaFwiOiA0MywgXCJzXCI6IDg5LCBcImxcIjogMzh9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDY2fSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMDAsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogMjB9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDY2fSxcbiAgICBcImRhcmtraGFraVwiOiB7XCJyXCI6IDE4OSwgXCJnXCI6IDE4MywgXCJiXCI6IDEwNywgXCJoXCI6IDU2LCBcInNcIjogMzgsIFwibFwiOiA1OH0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrb2xpdmVncmVlblwiOiB7XCJyXCI6IDg1LCBcImdcIjogMTA3LCBcImJcIjogNDcsIFwiaFwiOiA4MiwgXCJzXCI6IDM5LCBcImxcIjogMzB9LFxuICAgIFwiZGFya29yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE0MCwgXCJiXCI6IDAsIFwiaFwiOiAzMywgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImRhcmtvcmNoaWRcIjoge1wiclwiOiAxNTMsIFwiZ1wiOiA1MCwgXCJiXCI6IDIwNCwgXCJoXCI6IDI4MCwgXCJzXCI6IDYxLCBcImxcIjogNTB9LFxuICAgIFwiZGFya3JlZFwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiclwiOiAyMzMsIFwiZ1wiOiAxNTAsIFwiYlwiOiAxMjIsIFwiaFwiOiAxNSwgXCJzXCI6IDcyLCBcImxcIjogNzB9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcInJcIjogMTQzLCBcImdcIjogMTg4LCBcImJcIjogMTQzLCBcImhcIjogMTIwLCBcInNcIjogMjUsIFwibFwiOiA2NX0sXG4gICAgXCJkYXJrc2xhdGVibHVlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiA2MSwgXCJiXCI6IDEzOSwgXCJoXCI6IDI0OCwgXCJzXCI6IDM5LCBcImxcIjogMzl9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDE4MCwgXCJzXCI6IDI1LCBcImxcIjogMjV9LFxuICAgIFwiZGFya3NsYXRlZ3JleVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDE4MCwgXCJzXCI6IDI1LCBcImxcIjogMjV9LFxuICAgIFwiZGFya3R1cnF1b2lzZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMDksIFwiaFwiOiAxODEsIFwic1wiOiAxMDAsIFwibFwiOiA0MX0sXG4gICAgXCJkYXJrdmlvbGV0XCI6IHtcInJcIjogMTQ4LCBcImdcIjogMCwgXCJiXCI6IDIxMSwgXCJoXCI6IDI4MiwgXCJzXCI6IDEwMCwgXCJsXCI6IDQxfSxcbiAgICBcImRlZXBwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjAsIFwiYlwiOiAxNDcsIFwiaFwiOiAzMjgsIFwic1wiOiAxMDAsIFwibFwiOiA1NH0sXG4gICAgXCJkZWVwc2t5Ymx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyNTUsIFwiaFwiOiAxOTUsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJkaW1ncmF5XCI6IHtcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA0MX0sXG4gICAgXCJkaW1ncmV5XCI6IHtcInJcIjogMTA1LCBcImdcIjogMTA1LCBcImJcIjogMTA1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA0MX0sXG4gICAgXCJkb2RnZXJibHVlXCI6IHtcInJcIjogMzAsIFwiZ1wiOiAxNDQsIFwiYlwiOiAyNTUsIFwiaFwiOiAyMTAsIFwic1wiOiAxMDAsIFwibFwiOiA1Nn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiclwiOiAxNzgsIFwiZ1wiOiAzNCwgXCJiXCI6IDM0LCBcImhcIjogMCwgXCJzXCI6IDY4LCBcImxcIjogNDJ9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNDAsIFwiaFwiOiA0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcInJcIjogMzQsIFwiZ1wiOiAxMzksIFwiYlwiOiAzNCwgXCJoXCI6IDEyMCwgXCJzXCI6IDYxLCBcImxcIjogMzR9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjIwLCBcImJcIjogMjIwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4Nn0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcInJcIjogMjQ4LCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogOTl9LFxuICAgIFwiZ29sZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxNSwgXCJiXCI6IDAsIFwiaFwiOiA1MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImdvbGRlbnJvZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDE2NSwgXCJiXCI6IDMyLCBcImhcIjogNDMsIFwic1wiOiA3NCwgXCJsXCI6IDQ5fSxcbiAgICBcImdyZWVueWVsbG93XCI6IHtcInJcIjogMTczLCBcImdcIjogMjU1LCBcImJcIjogNDcsIFwiaFwiOiA4NCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU5fSxcbiAgICBcImdyZXlcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDUwfSxcbiAgICBcImhvbmV5ZGV3XCI6IHtcInJcIjogMjQwLCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiaG90cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDE4MCwgXCJoXCI6IDMzMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDcxfSxcbiAgICBcImluZGlhbnJlZFwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDkyLCBcImJcIjogOTIsIFwiaFwiOiAwLCBcInNcIjogNTMsIFwibFwiOiA1OH0sXG4gICAgXCJpbmRpZ29cIjoge1wiclwiOiA3NSwgXCJnXCI6IDAsIFwiYlwiOiAxMzAsIFwiaFwiOiAyNzUsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJpdm9yeVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI0MCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwia2hha2lcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAxNDAsIFwiaFwiOiA1NCwgXCJzXCI6IDc3LCBcImxcIjogNzV9LFxuICAgIFwibGF2ZW5kZXJcIjoge1wiclwiOiAyMzAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAyNTAsIFwiaFwiOiAyNDAsIFwic1wiOiA2NywgXCJsXCI6IDk0fSxcbiAgICBcImxhdmVuZGVyYmx1c2hcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyNDUsIFwiaFwiOiAzNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiclwiOiAxMjQsIFwiZ1wiOiAyNTIsIFwiYlwiOiAwLCBcImhcIjogOTAsIFwic1wiOiAxMDAsIFwibFwiOiA0OX0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMDUsIFwiaFwiOiA1NCwgXCJzXCI6IDEwMCwgXCJsXCI6IDkwfSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDIxNiwgXCJiXCI6IDIzMCwgXCJoXCI6IDE5NSwgXCJzXCI6IDUzLCBcImxcIjogNzl9LFxuICAgIFwibGlnaHRjb3JhbFwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiA3OSwgXCJsXCI6IDcyfSxcbiAgICBcImxpZ2h0Y3lhblwiOiB7XCJyXCI6IDIyNCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IHtcInJcIjogMjUwLCBcImdcIjogMjUwLCBcImJcIjogMjEwLCBcImhcIjogNjAsIFwic1wiOiA4MCwgXCJsXCI6IDkwfSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogODN9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJyXCI6IDE0NCwgXCJnXCI6IDIzOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDEyMCwgXCJzXCI6IDczLCBcImxcIjogNzV9LFxuICAgIFwibGlnaHRncmV5XCI6IHtcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4M30sXG4gICAgXCJsaWdodHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxODIsIFwiYlwiOiAxOTMsIFwiaFwiOiAzNTEsIFwic1wiOiAxMDAsIFwibFwiOiA4Nn0sXG4gICAgXCJsaWdodHNhbG1vblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDE3LCBcInNcIjogMTAwLCBcImxcIjogNzR9LFxuICAgIFwibGlnaHRzZWFncmVlblwiOiB7XCJyXCI6IDMyLCBcImdcIjogMTc4LCBcImJcIjogMTcwLCBcImhcIjogMTc3LCBcInNcIjogNzAsIFwibFwiOiA0MX0sXG4gICAgXCJsaWdodHNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyNTAsIFwiaFwiOiAyMDMsIFwic1wiOiA5MiwgXCJsXCI6IDc1fSxcbiAgICBcImxpZ2h0c2xhdGVncmF5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMjEwLCBcInNcIjogMTQsIFwibFwiOiA1M30sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDIxMCwgXCJzXCI6IDE0LCBcImxcIjogNTN9LFxuICAgIFwibGlnaHRzdGVlbGJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAxOTYsIFwiYlwiOiAyMjIsIFwiaFwiOiAyMTQsIFwic1wiOiA0MSwgXCJsXCI6IDc4fSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjI0LCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA5NH0sXG4gICAgXCJsaW1lZ3JlZW5cIjoge1wiclwiOiA1MCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogMTIwLCBcInNcIjogNjEsIFwibFwiOiA1MH0sXG4gICAgXCJsaW5lblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI0MCwgXCJiXCI6IDIzMCwgXCJoXCI6IDMwLCBcInNcIjogNjcsIFwibFwiOiA5NH0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcInJcIjogMTAyLCBcImdcIjogMjA1LCBcImJcIjogMTcwLCBcImhcIjogMTYwLCBcInNcIjogNTEsIFwibFwiOiA2MH0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyMDUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA0MH0sXG4gICAgXCJtZWRpdW1vcmNoaWRcIjoge1wiclwiOiAxODYsIFwiZ1wiOiA4NSwgXCJiXCI6IDIxMSwgXCJoXCI6IDI4OCwgXCJzXCI6IDU5LCBcImxcIjogNTh9LFxuICAgIFwibWVkaXVtcHVycGxlXCI6IHtcInJcIjogMTQ3LCBcImdcIjogMTEyLCBcImJcIjogMjE5LCBcImhcIjogMjYwLCBcInNcIjogNjAsIFwibFwiOiA2NX0sXG4gICAgXCJtZWRpdW1zZWFncmVlblwiOiB7XCJyXCI6IDYwLCBcImdcIjogMTc5LCBcImJcIjogMTEzLCBcImhcIjogMTQ3LCBcInNcIjogNTAsIFwibFwiOiA0N30sXG4gICAgXCJtZWRpdW1zbGF0ZWJsdWVcIjoge1wiclwiOiAxMjMsIFwiZ1wiOiAxMDQsIFwiYlwiOiAyMzgsIFwiaFwiOiAyNDksIFwic1wiOiA4MCwgXCJsXCI6IDY3fSxcbiAgICBcIm1lZGl1bXNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1MCwgXCJiXCI6IDE1NCwgXCJoXCI6IDE1NywgXCJzXCI6IDEwMCwgXCJsXCI6IDQ5fSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJyXCI6IDcyLCBcImdcIjogMjA5LCBcImJcIjogMjA0LCBcImhcIjogMTc4LCBcInNcIjogNjAsIFwibFwiOiA1NX0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiclwiOiAxOTksIFwiZ1wiOiAyMSwgXCJiXCI6IDEzMywgXCJoXCI6IDMyMiwgXCJzXCI6IDgxLCBcImxcIjogNDN9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcInJcIjogMjUsIFwiZ1wiOiAyNSwgXCJiXCI6IDExMiwgXCJoXCI6IDI0MCwgXCJzXCI6IDY0LCBcImxcIjogMjd9LFxuICAgIFwibWludGNyZWFtXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjU1LCBcImJcIjogMjUwLCBcImhcIjogMTUwLCBcInNcIjogMTAwLCBcImxcIjogOTh9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMjI1LCBcImhcIjogNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcIm1vY2Nhc2luXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMTgxLCBcImhcIjogMzgsIFwic1wiOiAxMDAsIFwibFwiOiA4NX0sXG4gICAgXCJuYXZham93aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3MywgXCJoXCI6IDM2LCBcInNcIjogMTAwLCBcImxcIjogODR9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJyXCI6IDI1MywgXCJnXCI6IDI0NSwgXCJiXCI6IDIzMCwgXCJoXCI6IDM5LCBcInNcIjogODUsIFwibFwiOiA5NX0sXG4gICAgXCJvbGl2ZWRyYWJcIjoge1wiclwiOiAxMDcsIFwiZ1wiOiAxNDIsIFwiYlwiOiAzNSwgXCJoXCI6IDgwLCBcInNcIjogNjAsIFwibFwiOiAzNX0sXG4gICAgXCJvcmFuZ2VyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA2OSwgXCJiXCI6IDAsIFwiaFwiOiAxNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9yY2hpZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDExMiwgXCJiXCI6IDIxNCwgXCJoXCI6IDMwMiwgXCJzXCI6IDU5LCBcImxcIjogNjV9LFxuICAgIFwicGFsZWdvbGRlbnJvZFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDIzMiwgXCJiXCI6IDE3MCwgXCJoXCI6IDU1LCBcInNcIjogNjcsIFwibFwiOiA4MH0sXG4gICAgXCJwYWxlZ3JlZW5cIjoge1wiclwiOiAxNTIsIFwiZ1wiOiAyNTEsIFwiYlwiOiAxNTIsIFwiaFwiOiAxMjAsIFwic1wiOiA5MywgXCJsXCI6IDc5fSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiclwiOiAxNzUsIFwiZ1wiOiAyMzgsIFwiYlwiOiAyMzgsIFwiaFwiOiAxODAsIFwic1wiOiA2NSwgXCJsXCI6IDgxfSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiclwiOiAyMTksIFwiZ1wiOiAxMTIsIFwiYlwiOiAxNDcsIFwiaFwiOiAzNDAsIFwic1wiOiA2MCwgXCJsXCI6IDY1fSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzksIFwiYlwiOiAyMTMsIFwiaFwiOiAzNywgXCJzXCI6IDEwMCwgXCJsXCI6IDkyfSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIxOCwgXCJiXCI6IDE4NSwgXCJoXCI6IDI4LCBcInNcIjogMTAwLCBcImxcIjogODZ9LFxuICAgIFwicGVydVwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDEzMywgXCJiXCI6IDYzLCBcImhcIjogMzAsIFwic1wiOiA1OSwgXCJsXCI6IDUzfSxcbiAgICBcInBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxOTIsIFwiYlwiOiAyMDMsIFwiaFwiOiAzNTAsIFwic1wiOiAxMDAsIFwibFwiOiA4OH0sXG4gICAgXCJwbHVtXCI6IHtcInJcIjogMjIxLCBcImdcIjogMTYwLCBcImJcIjogMjIxLCBcImhcIjogMzAwLCBcInNcIjogNDcsIFwibFwiOiA3NX0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMjI0LCBcImJcIjogMjMwLCBcImhcIjogMTg3LCBcInNcIjogNTIsIFwibFwiOiA4MH0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiclwiOiAxODgsIFwiZ1wiOiAxNDMsIFwiYlwiOiAxNDMsIFwiaFwiOiAwLCBcInNcIjogMjUsIFwibFwiOiA2NX0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiclwiOiA2NSwgXCJnXCI6IDEwNSwgXCJiXCI6IDIyNSwgXCJoXCI6IDIyNSwgXCJzXCI6IDczLCBcImxcIjogNTd9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiclwiOiAxMzksIFwiZ1wiOiA2OSwgXCJiXCI6IDE5LCBcImhcIjogMjUsIFwic1wiOiA3NiwgXCJsXCI6IDMxfSxcbiAgICBcInNhbG1vblwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDEyOCwgXCJiXCI6IDExNCwgXCJoXCI6IDYsIFwic1wiOiA5MywgXCJsXCI6IDcxfSxcbiAgICBcInNhbmR5YnJvd25cIjoge1wiclwiOiAyNDQsIFwiZ1wiOiAxNjQsIFwiYlwiOiA5NiwgXCJoXCI6IDI4LCBcInNcIjogODcsIFwibFwiOiA2N30sXG4gICAgXCJzZWFncmVlblwiOiB7XCJyXCI6IDQ2LCBcImdcIjogMTM5LCBcImJcIjogODcsIFwiaFwiOiAxNDYsIFwic1wiOiA1MCwgXCJsXCI6IDM2fSxcbiAgICBcInNlYXNoZWxsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ1LCBcImJcIjogMjM4LCBcImhcIjogMjUsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJzaWVubmFcIjoge1wiclwiOiAxNjAsIFwiZ1wiOiA4MiwgXCJiXCI6IDQ1LCBcImhcIjogMTksIFwic1wiOiA1NiwgXCJsXCI6IDQwfSxcbiAgICBcInNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMzUsIFwiaFwiOiAxOTcsIFwic1wiOiA3MSwgXCJsXCI6IDczfSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEwNiwgXCJnXCI6IDkwLCBcImJcIjogMjA1LCBcImhcIjogMjQ4LCBcInNcIjogNTMsIFwibFwiOiA1OH0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAyMTAsIFwic1wiOiAxMywgXCJsXCI6IDUwfSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDIxMCwgXCJzXCI6IDEzLCBcImxcIjogNTB9LFxuICAgIFwic25vd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI1MCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiA5OX0sXG4gICAgXCJzcHJpbmdncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAxMjcsIFwiaFwiOiAxNTAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJzdGVlbGJsdWVcIjoge1wiclwiOiA3MCwgXCJnXCI6IDEzMCwgXCJiXCI6IDE4MCwgXCJoXCI6IDIwNywgXCJzXCI6IDQ0LCBcImxcIjogNDl9LFxuICAgIFwidGFuXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTgwLCBcImJcIjogMTQwLCBcImhcIjogMzQsIFwic1wiOiA0NCwgXCJsXCI6IDY5fSxcbiAgICBcInRoaXN0bGVcIjoge1wiclwiOiAyMTYsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyMTYsIFwiaFwiOiAzMDAsIFwic1wiOiAyNCwgXCJsXCI6IDgwfSxcbiAgICBcInRvbWF0b1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDk5LCBcImJcIjogNzEsIFwiaFwiOiA5LCBcInNcIjogMTAwLCBcImxcIjogNjR9LFxuICAgIFwidHVycXVvaXNlXCI6IHtcInJcIjogNjQsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMDgsIFwiaFwiOiAxNzQsIFwic1wiOiA3MiwgXCJsXCI6IDU2fSxcbiAgICBcInZpb2xldFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDEzMCwgXCJiXCI6IDIzOCwgXCJoXCI6IDMwMCwgXCJzXCI6IDc2LCBcImxcIjogNzJ9LFxuICAgIFwid2hlYXRcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzksIFwiaFwiOiAzOSwgXCJzXCI6IDc3LCBcImxcIjogODN9LFxuICAgIFwid2hpdGVzbW9rZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDI0NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogOTZ9LFxuICAgIFwieWVsbG93Z3JlZW5cIjoge1wiclwiOiAxNTQsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDgwLCBcInNcIjogNjEsIFwibFwiOiA1MH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7IiwiLyoqIFxuICogQGNvbnN0YW50XG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIG51bWJlcj59IFxuICovXG52YXIgS0VZQ09ERVMgPSB7XG4gICAgJ2JhY2tzcGFjZScgOiA4LFxuICAgICd0YWInIDogOSxcbiAgICAnZW50ZXInIDogMTMsXG4gICAgJ3NoaWZ0JyA6IDE2LFxuICAgICdjdHJsJyA6IDE3LFxuICAgICdhbHQnIDogMTgsXG4gICAgJ3BhdXNlX2JyZWFrJyA6IDE5LFxuICAgICdjYXBzX2xvY2snIDogMjAsXG4gICAgJ2VzY2FwZScgOiAyNyxcbiAgICAncGFnZV91cCcgOiAzMyxcbiAgICAncGFnZSBkb3duJyA6IDM0LFxuICAgICdlbmQnIDogMzUsXG4gICAgJ2hvbWUnIDogMzYsXG4gICAgJ2xlZnRfYXJyb3cnIDogMzcsXG4gICAgJ3VwX2Fycm93JyA6IDM4LFxuICAgICdyaWdodF9hcnJvdycgOiAzOSxcbiAgICAnZG93bl9hcnJvdycgOiA0MCxcbiAgICAnaW5zZXJ0JyA6IDQ1LFxuICAgICdkZWxldGUnIDogNDYsXG4gICAgJzAnIDogNDgsXG4gICAgJzEnIDogNDksXG4gICAgJzInIDogNTAsXG4gICAgJzMnIDogNTEsXG4gICAgJzQnIDogNTIsXG4gICAgJzUnIDogNTMsXG4gICAgJzYnIDogNTQsXG4gICAgJzcnIDogNTUsXG4gICAgJzgnIDogNTYsXG4gICAgJzknIDogNTcsXG4gICAgJ2EnIDogNjUsXG4gICAgJ2InIDogNjYsXG4gICAgJ2MnIDogNjcsXG4gICAgJ2QnIDogNjgsXG4gICAgJ2UnIDogNjksXG4gICAgJ2YnIDogNzAsXG4gICAgJ2cnIDogNzEsXG4gICAgJ2gnIDogNzIsXG4gICAgJ2knIDogNzMsXG4gICAgJ2onIDogNzQsXG4gICAgJ2snIDogNzUsXG4gICAgJ2wnIDogNzYsXG4gICAgJ20nIDogNzcsXG4gICAgJ24nIDogNzgsXG4gICAgJ28nIDogNzksXG4gICAgJ3AnIDogODAsXG4gICAgJ3EnIDogODEsXG4gICAgJ3InIDogODIsXG4gICAgJ3MnIDogODMsXG4gICAgJ3QnIDogODQsXG4gICAgJ3UnIDogODUsXG4gICAgJ3YnIDogODYsXG4gICAgJ3cnIDogODcsXG4gICAgJ3gnIDogODgsXG4gICAgJ3knIDogODksXG4gICAgJ3onIDogOTAsXG4gICAgJ2xlZnRfd2luZG93IGtleScgOiA5MSxcbiAgICAncmlnaHRfd2luZG93IGtleScgOiA5MixcbiAgICAnc2VsZWN0X2tleScgOiA5MyxcbiAgICAnbnVtcGFkIDAnIDogOTYsXG4gICAgJ251bXBhZCAxJyA6IDk3LFxuICAgICdudW1wYWQgMicgOiA5OCxcbiAgICAnbnVtcGFkIDMnIDogOTksXG4gICAgJ251bXBhZCA0JyA6IDEwMCxcbiAgICAnbnVtcGFkIDUnIDogMTAxLFxuICAgICdudW1wYWQgNicgOiAxMDIsXG4gICAgJ251bXBhZCA3JyA6IDEwMyxcbiAgICAnbnVtcGFkIDgnIDogMTA0LFxuICAgICdudW1wYWQgOScgOiAxMDUsXG4gICAgJ211bHRpcGx5JyA6IDEwNixcbiAgICAnYWRkJyA6IDEwNyxcbiAgICAnc3VidHJhY3QnIDogMTA5LFxuICAgICdkZWNpbWFsIHBvaW50JyA6IDExMCxcbiAgICAnZGl2aWRlJyA6IDExMSxcbiAgICAnZjEnIDogMTEyLFxuICAgICdmMicgOiAxMTMsXG4gICAgJ2YzJyA6IDExNCxcbiAgICAnZjQnIDogMTE1LFxuICAgICdmNScgOiAxMTYsXG4gICAgJ2Y2JyA6IDExNyxcbiAgICAnZjcnIDogMTE4LFxuICAgICdmOCcgOiAxMTksXG4gICAgJ2Y5JyA6IDEyMCxcbiAgICAnZjEwJyA6IDEyMSxcbiAgICAnZjExJyA6IDEyMixcbiAgICAnZjEyJyA6IDEyMyxcbiAgICAnbnVtX2xvY2snIDogMTQ0LFxuICAgICdzY3JvbGxfbG9jaycgOiAxNDUsXG4gICAgJ3NlbWlfY29sb24nIDogMTg2LFxuICAgICdlcXVhbF9zaWduJyA6IDE4NyxcbiAgICAnY29tbWEnIDogMTg4LFxuICAgICdkYXNoJyA6IDE4OSxcbiAgICAncGVyaW9kJyA6IDE5MCxcbiAgICAnZm9yd2FyZF9zbGFzaCcgOiAxOTEsXG4gICAgJ2dyYXZlX2FjY2VudCcgOiAxOTIsXG4gICAgJ29wZW5fYnJhY2tldCcgOiAyMTksXG4gICAgJ2JhY2tzbGFzaCcgOiAyMjAsXG4gICAgJ2Nsb3NlYnJhY2tldCcgOiAyMjEsXG4gICAgJ3NpbmdsZV9xdW90ZScgOiAyMjJcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gS0VZQ09ERVM7IiwicmVxdWlyZSgnLi8uLi90ZXN0cy9oZWxwZXJzLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2RhdGEvY29sb3JzLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2VuZ2luZS9jYW1lcmEuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZW5naW5lL3NjZW5lLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2dlb21ldHJ5L2ZhY2UuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZ2VvbWV0cnkvbWVzaC5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy91dGlsaXRpZXMvY29sb3IuanMnKTtcbiIsInZhciBuYW1lZGNvbG9ycyA9IHtcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiAwIH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNDgsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmMGY4ZmZcIn0sXG4gICAgXCJhbnRpcXVld2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDIzNSxcImJcIjogMjE1IH0sIFwiaGV4XCI6IFwiI2ZhZWJkN1wifSxcbiAgICBcImFxdWFcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMGZmZmZcIn0sXG4gICAgXCJhcXVhbWFyaW5lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDEwMCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNyxcImdcIjogMjU1LFwiYlwiOiAyMTIgfSwgXCJoZXhcIjogXCIjN2ZmZmQ0XCJ9LFxuICAgIFwiYXp1cmVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjBmZmZmXCJ9LFxuICAgIFwiYmVpZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjQ1LFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZjVmNWRjXCJ9LFxuICAgIFwiYmlzcXVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAxOTYgfSwgXCJoZXhcIjogXCIjZmZlNGM0XCJ9LFxuICAgIFwiYmxhY2tcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMDAwMDBcIn0sXG4gICAgXCJibGFuY2hlZGFsbW9uZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIzNSxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiI2ZmZWJjZFwifSxcbiAgICBcImJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwMDBmZlwifSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzgsXCJnXCI6IDQzLFwiYlwiOiAyMjYgfSwgXCJoZXhcIjogXCIjOGEyYmUyXCJ9LFxuICAgIFwiYnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjUsXCJnXCI6IDQyLFwiYlwiOiA0MiB9LCBcImhleFwiOiBcIiNhNTJhMmFcIn0sXG4gICAgXCJidXJseXdvb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjIyLFwiZ1wiOiAxODQsXCJiXCI6IDEzNSB9LCBcImhleFwiOiBcIiNkZWI4ODdcIn0sXG4gICAgXCJjYWRldGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogOTUsXCJnXCI6IDE1OCxcImJcIjogMTYwIH0sIFwiaGV4XCI6IFwiIzVmOWVhMFwifSxcbiAgICBcImNoYXJ0cmV1c2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMTI3LFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjN2ZmZjAwXCJ9LFxuICAgIFwiY2hvY29sYXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMCxcImdcIjogMTA1LFwiYlwiOiAzMCB9LCBcImhleFwiOiBcIiNkMjY5MWVcIn0sXG4gICAgXCJjb3JhbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTI3LFwiYlwiOiA4MCB9LCBcImhleFwiOiBcIiNmZjdmNTBcIn0sXG4gICAgXCJjb3JuZmxvd2VyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMDgsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDAsXCJnXCI6IDE0OSxcImJcIjogMjM3IH0sIFwiaGV4XCI6IFwiIzY0OTVlZFwifSxcbiAgICBcImNvcm5zaWxrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA3OCxcImxcIjogOTEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI0OCxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2ZmZjhkY1wifSxcbiAgICBcImNyaW1zb25cIjoge1wiaHNsXCI6IHtcImhcIjogMTYwLFwic1wiOiAxMDAsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMjIwLFwiZ1wiOiAyMCxcImJcIjogNjAgfSwgXCJoZXhcIjogXCIjZGMxNDNjXCJ9LFxuICAgIFwiY3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMGZmZmZcIn0sXG4gICAgXCJkYXJrYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogNTYsXCJsXCI6IDkxIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzAwMDA4YlwifSxcbiAgICBcImRhcmtjeWFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMzLFwic1wiOiAxMDAsXCJsXCI6IDg4IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTM5LFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjMDA4YjhiXCJ9LFxuICAgIFwiZGFya2dvbGRlbnJvZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNixcInNcIjogMTAwLFwibFwiOiA5MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE4NCxcImdcIjogMTM0LFwiYlwiOiAxMSB9LCBcImhleFwiOiBcIiNiODg2MGJcIn0sXG4gICAgXCJkYXJrZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNzEsXCJzXCI6IDc2LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDE2OSxcImdcIjogMTY5LFwiYlwiOiAxNjkgfSwgXCJoZXhcIjogXCIjYTlhOWE5XCJ9LFxuICAgIFwiZGFya2dyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDU5LFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEwMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMDY0MDBcIn0sXG4gICAgXCJkYXJrZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNTcsXCJsXCI6IDcwIH0sIFwicmdiXCI6IHtcInJcIjogMTY5LFwiZ1wiOiAxNjksXCJiXCI6IDE2OSB9LCBcImhleFwiOiBcIiNhOWE5YTlcIn0sXG4gICAgXCJkYXJra2hha2lcIjoge1wiaHNsXCI6IHtcImhcIjogMTgyLFwic1wiOiAyNSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxODksXCJnXCI6IDE4MyxcImJcIjogMTA3IH0sIFwiaGV4XCI6IFwiI2JkYjc2YlwifSxcbiAgICBcImRhcmttYWdlbnRhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDkwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiAwLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjOGIwMDhiXCJ9LFxuICAgIFwiZGFya29saXZlZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMjUsXCJzXCI6IDc1LFwibFwiOiA0NyB9LCBcInJnYlwiOiB7XCJyXCI6IDg1LFwiZ1wiOiAxMDcsXCJiXCI6IDQ3IH0sIFwiaGV4XCI6IFwiIzU1NmIyZlwifSxcbiAgICBcImRhcmtvcmFuZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTYsXCJzXCI6IDEwMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE0MCxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZjhjMDBcIn0sXG4gICAgXCJkYXJrb3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxOSxcInNcIjogNzksXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMTUzLFwiZ1wiOiA1MCxcImJcIjogMjA0IH0sIFwiaGV4XCI6IFwiIzk5MzJjY1wifSxcbiAgICBcImRhcmtyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogNDgsXCJzXCI6IDEwMCxcImxcIjogOTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzksXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjOGIwMDAwXCJ9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDgsXCJzXCI6IDgzLFwibFwiOiA0NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIzMyxcImdcIjogMTUwLFwiYlwiOiAxMjIgfSwgXCJoZXhcIjogXCIjZTk5NjdhXCJ9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDE0MyxcImdcIjogMTg4LFwiYlwiOiAxNDMgfSwgXCJoZXhcIjogXCIjOGZiYzhmXCJ9LFxuICAgIFwiZGFya3NsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiA3MixcImdcIjogNjEsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiM0ODNkOGJcIn0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDQzLFwic1wiOiA4OSxcImxcIjogMzggfSwgXCJyZ2JcIjoge1wiclwiOiA0NyxcImdcIjogNzksXCJiXCI6IDc5IH0sIFwiaGV4XCI6IFwiIzJmNGY0ZlwifSxcbiAgICBcImRhcmtzbGF0ZWdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiA0NyxcImdcIjogNzksXCJiXCI6IDc5IH0sIFwiaGV4XCI6IFwiIzJmNGY0ZlwifSxcbiAgICBcImRhcmt0dXJxdW9pc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDIwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjA2LFwiYlwiOiAyMDkgfSwgXCJoZXhcIjogXCIjMDBjZWQxXCJ9LFxuICAgIFwiZGFya3Zpb2xldFwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE0OCxcImdcIjogMCxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiIzk0MDBkM1wifSxcbiAgICBcImRlZXBwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU2LFwic1wiOiAzOCxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIwLFwiYlwiOiAxNDcgfSwgXCJoZXhcIjogXCIjZmYxNDkzXCJ9LFxuICAgIFwiZGVlcHNreWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTkxLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBiZmZmXCJ9LFxuICAgIFwiZGltZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MixcInNcIjogMzksXCJsXCI6IDMwIH0sIFwicmdiXCI6IHtcInJcIjogMTA1LFwiZ1wiOiAxMDUsXCJiXCI6IDEwNSB9LCBcImhleFwiOiBcIiM2OTY5NjlcIn0sXG4gICAgXCJkaW1ncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDMzLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTA1LFwiZ1wiOiAxMDUsXCJiXCI6IDEwNSB9LCBcImhleFwiOiBcIiM2OTY5NjlcIn0sXG4gICAgXCJkb2RnZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4MCxcInNcIjogNjEsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMzAsXCJnXCI6IDE0NCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzFlOTBmZlwifSxcbiAgICBcImZpcmVicmlja1wiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTc4LFwiZ1wiOiAzNCxcImJcIjogMzQgfSwgXCJoZXhcIjogXCIjYjIyMjIyXCJ9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTUsXCJzXCI6IDcyLFwibFwiOiA3MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZmZmYWYwXCJ9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAyNSxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAzNCxcImdcIjogMTM5LFwiYlwiOiAzNCB9LCBcImhleFwiOiBcIiMyMjhiMjJcIn0sXG4gICAgXCJmdWNoc2lhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0OCxcInNcIjogMzksXCJsXCI6IDM5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAwLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZmYwMGZmXCJ9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMjUsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjIwLFwiZ1wiOiAyMjAsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNkY2RjZGNcIn0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMjUsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjQ4LFwiZ1wiOiAyNDgsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmOGY4ZmZcIn0sXG4gICAgXCJnb2xkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MSxcInNcIjogMTAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjE1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmZDcwMFwifSxcbiAgICBcImdvbGRlbnJvZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODIsXCJzXCI6IDEwMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTgsXCJnXCI6IDE2NSxcImJcIjogMzIgfSwgXCJoZXhcIjogXCIjZGFhNTIwXCJ9LFxuICAgIFwiZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMjgsXCJzXCI6IDEwMCxcImxcIjogNTQgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwODA4MFwifSxcbiAgICBcImdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5NSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEyOCxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMDgwMDBcIn0sXG4gICAgXCJncmVlbnllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDE3MyxcImdcIjogMjU1LFwiYlwiOiA0NyB9LCBcImhleFwiOiBcIiNhZGZmMmZcIn0sXG4gICAgXCJncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDgwODBcIn0sXG4gICAgXCJob25leWRld1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEwMCxcImxcIjogNTYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI1NSxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2YwZmZmMFwifSxcbiAgICBcImhvdHBpbmtcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNjgsXCJsXCI6IDQyIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxMDUsXCJiXCI6IDE4MCB9LCBcImhleFwiOiBcIiNmZjY5YjRcIn0sXG4gICAgXCJpbmRpYW5yZWRcIjoge1wiaHNsXCI6IHtcImhcIjogNDAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMDUsXCJnXCI6IDkyLFwiYlwiOiA5MiB9LCBcImhleFwiOiBcIiNjZDVjNWNcIn0sXG4gICAgXCJpbmRpZ29cIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiA2MSxcImxcIjogMzQgfSwgXCJyZ2JcIjoge1wiclwiOiA3NSxcImdcIjogMCxcImJcIjogMTMwIH0sIFwiaGV4XCI6IFwiIzRiMDA4MlwifSxcbiAgICBcIml2b3J5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmZmZmZjBcIn0sXG4gICAgXCJraGFraVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogOTkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDIzMCxcImJcIjogMTQwIH0sIFwiaGV4XCI6IFwiI2YwZTY4Y1wifSxcbiAgICBcImxhdmVuZGVyXCI6IHtcImhzbFwiOiB7XCJoXCI6IDUxLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjMwLFwiZ1wiOiAyMzAsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiNlNmU2ZmFcIn0sXG4gICAgXCJsYXZlbmRlcmJsdXNoXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQzLFwic1wiOiA3NCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI0MCxcImJcIjogMjQ1IH0sIFwiaGV4XCI6IFwiI2ZmZjBmNVwifSxcbiAgICBcImxhd25ncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA4NCxcInNcIjogMTAwLFwibFwiOiA1OSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNCxcImdcIjogMjUyLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzdjZmMwMFwifSxcbiAgICBcImxlbW9uY2hpZmZvblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyMDUgfSwgXCJoZXhcIjogXCIjZmZmYWNkXCJ9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDE3MyxcImdcIjogMjE2LFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjYWRkOGU2XCJ9LFxuICAgIFwibGlnaHRjb3JhbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMzAsXCJzXCI6IDEwMCxcImxcIjogNzEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiI2YwODA4MFwifSxcbiAgICBcImxpZ2h0Y3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA1MyxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAyMjQsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2UwZmZmZlwifSxcbiAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDI3NSxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjUwLFwiYlwiOiAyMTAgfSwgXCJoZXhcIjogXCIjZmFmYWQyXCJ9LFxuICAgIFwibGlnaHRncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjExLFwiZ1wiOiAyMTEsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNkM2QzZDNcIn0sXG4gICAgXCJsaWdodGdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU0LFwic1wiOiA3NyxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDQsXCJnXCI6IDIzOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzkwZWU5MFwifSxcbiAgICBcImxpZ2h0Z3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDY3LFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMSxcImdcIjogMjExLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjZDNkM2QzXCJ9LFxuICAgIFwibGlnaHRwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTgyLFwiYlwiOiAxOTMgfSwgXCJoZXhcIjogXCIjZmZiNmMxXCJ9LFxuICAgIFwibGlnaHRzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogOTAsXCJzXCI6IDEwMCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE2MCxcImJcIjogMTIyIH0sIFwiaGV4XCI6IFwiI2ZmYTA3YVwifSxcbiAgICBcImxpZ2h0c2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNTQsXCJzXCI6IDEwMCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAzMixcImdcIjogMTc4LFwiYlwiOiAxNzAgfSwgXCJoZXhcIjogXCIjMjBiMmFhXCJ9LFxuICAgIFwibGlnaHRza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5NSxcInNcIjogNTMsXCJsXCI6IDc5IH0sIFwicmdiXCI6IHtcInJcIjogMTM1LFwiZ1wiOiAyMDYsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiM4N2NlZmFcIn0sXG4gICAgXCJsaWdodHNsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA3OSxcImxcIjogNzIgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTksXCJnXCI6IDEzNixcImJcIjogMTUzIH0sIFwiaGV4XCI6IFwiIzc3ODg5OVwifSxcbiAgICBcImxpZ2h0c2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDExOSxcImdcIjogMTM2LFwiYlwiOiAxNTMgfSwgXCJoZXhcIjogXCIjNzc4ODk5XCJ9LFxuICAgIFwibGlnaHRzdGVlbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDgwLFwibFwiOiA5MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE3NixcImdcIjogMTk2LFwiYlwiOiAyMjIgfSwgXCJoZXhcIjogXCIjYjBjNGRlXCJ9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMjI0IH0sIFwiaGV4XCI6IFwiI2ZmZmZlMFwifSxcbiAgICBcImxpbWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiA3MyxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDBmZjAwXCJ9LFxuICAgIFwibGltZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogNTAsXCJnXCI6IDIwNSxcImJcIjogNTAgfSwgXCJoZXhcIjogXCIjMzJjZDMyXCJ9LFxuICAgIFwibGluZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzUxLFwic1wiOiAxMDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyNDAsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNmYWYwZTZcIn0sXG4gICAgXCJtYWdlbnRhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3LFwic1wiOiAxMDAsXCJsXCI6IDc0IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAwLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZmYwMGZmXCJ9LFxuICAgIFwibWFyb29uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3NyxcInNcIjogNzAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzgwMDAwMFwifSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiaHNsXCI6IHtcImhcIjogMjAzLFwic1wiOiA5MixcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDIsXCJnXCI6IDIwNSxcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiIzY2Y2RhYVwifSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxNCxcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAyMDUgfSwgXCJoZXhcIjogXCIjMDAwMGNkXCJ9LFxuICAgIFwibWVkaXVtb3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTQsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMTg2LFwiZ1wiOiA4NSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2JhNTVkM1wifSxcbiAgICBcIm1lZGl1bXB1cnBsZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTQsXCJzXCI6IDQxLFwibFwiOiA3OCB9LCBcInJnYlwiOiB7XCJyXCI6IDE0NyxcImdcIjogMTEyLFwiYlwiOiAyMTkgfSwgXCJoZXhcIjogXCIjOTM3MGRiXCJ9LFxuICAgIFwibWVkaXVtc2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiA2MCxcImdcIjogMTc5LFwiYlwiOiAxMTMgfSwgXCJoZXhcIjogXCIjM2NiMzcxXCJ9LFxuICAgIFwibWVkaXVtc2xhdGVibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNjEsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTIzLFwiZ1wiOiAxMDQsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiM3YjY4ZWVcIn0sXG4gICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMCxcInNcIjogNjcsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjUwLFwiYlwiOiAxNTQgfSwgXCJoZXhcIjogXCIjMDBmYTlhXCJ9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2MCxcInNcIjogNTEsXCJsXCI6IDYwIH0sIFwicmdiXCI6IHtcInJcIjogNzIsXCJnXCI6IDIwOSxcImJcIjogMjA0IH0sIFwiaGV4XCI6IFwiIzQ4ZDFjY1wifSxcbiAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogNDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxOTksXCJnXCI6IDIxLFwiYlwiOiAxMzMgfSwgXCJoZXhcIjogXCIjYzcxNTg1XCJ9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4OCxcInNcIjogNTksXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjUsXCJnXCI6IDI1LFwiYlwiOiAxMTIgfSwgXCJoZXhcIjogXCIjMTkxOTcwXCJ9LFxuICAgIFwibWludGNyZWFtXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI2MCxcInNcIjogNjAsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjQ1LFwiZ1wiOiAyNTUsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiNmNWZmZmFcIn0sXG4gICAgXCJtaXN0eXJvc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTQ3LFwic1wiOiA1MCxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMjI1IH0sIFwiaGV4XCI6IFwiI2ZmZTRlMVwifSxcbiAgICBcIm1vY2Nhc2luXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0OSxcInNcIjogODAsXCJsXCI6IDY3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDE4MSB9LCBcImhleFwiOiBcIiNmZmU0YjVcIn0sXG4gICAgXCJuYXZham93aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTcsXCJzXCI6IDEwMCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyMixcImJcIjogMTczIH0sIFwiaGV4XCI6IFwiI2ZmZGVhZFwifSxcbiAgICBcIm5hdnlcIjoge1wiaHNsXCI6IHtcImhcIjogMTc4LFwic1wiOiA2MCxcImxcIjogNTUgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjMDAwMDgwXCJ9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMjIsXCJzXCI6IDgxLFwibFwiOiA0MyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MyxcImdcIjogMjQ1LFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjZmRmNWU2XCJ9LFxuICAgIFwib2xpdmVcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiA2NCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDEyOCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4MDgwMDBcIn0sXG4gICAgXCJvbGl2ZWRyYWJcIjoge1wiaHNsXCI6IHtcImhcIjogMTUwLFwic1wiOiAxMDAsXCJsXCI6IDk4IH0sIFwicmdiXCI6IHtcInJcIjogMTA3LFwiZ1wiOiAxNDIsXCJiXCI6IDM1IH0sIFwiaGV4XCI6IFwiIzZiOGUyM1wifSxcbiAgICBcIm9yYW5nZVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2LFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNjUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZhNTAwXCJ9LFxuICAgIFwib3JhbmdlcmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM4LFwic1wiOiAxMDAsXCJsXCI6IDg1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiA2OSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZjQ1MDBcIn0sXG4gICAgXCJvcmNoaWRcIjoge1wiaHNsXCI6IHtcImhcIjogMzYsXCJzXCI6IDEwMCxcImxcIjogODQgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTgsXCJnXCI6IDExMixcImJcIjogMjE0IH0sIFwiaGV4XCI6IFwiI2RhNzBkNlwifSxcbiAgICBcInBhbGVnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDg1LFwibFwiOiA5NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIzOCxcImdcIjogMjMyLFwiYlwiOiAxNzAgfSwgXCJoZXhcIjogXCIjZWVlOGFhXCJ9LFxuICAgIFwicGFsZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDgwLFwic1wiOiA2MCxcImxcIjogMzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxNTIsXCJnXCI6IDI1MSxcImJcIjogMTUyIH0sIFwiaGV4XCI6IFwiIzk4ZmI5OFwifSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTYsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzUsXCJnXCI6IDIzOCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2FmZWVlZVwifSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMzAyLFwic1wiOiA1OSxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTksXCJnXCI6IDExMixcImJcIjogMTQ3IH0sIFwiaGV4XCI6IFwiI2RiNzA5M1wifSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiaHNsXCI6IHtcImhcIjogNTUsXCJzXCI6IDY3LFwibFwiOiA4MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjM5LFwiYlwiOiAyMTMgfSwgXCJoZXhcIjogXCIjZmZlZmQ1XCJ9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogOTMsXCJsXCI6IDc5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMTgsXCJiXCI6IDE4NSB9LCBcImhleFwiOiBcIiNmZmRhYjlcIn0sXG4gICAgXCJwZXJ1XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogNjUsXCJsXCI6IDgxIH0sIFwicmdiXCI6IHtcInJcIjogMjA1LFwiZ1wiOiAxMzMsXCJiXCI6IDYzIH0sIFwiaGV4XCI6IFwiI2NkODUzZlwifSxcbiAgICBcInBpbmtcIjoge1wiaHNsXCI6IHtcImhcIjogMzQwLFwic1wiOiA2MCxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE5MixcImJcIjogMjAzIH0sIFwiaGV4XCI6IFwiI2ZmYzBjYlwifSxcbiAgICBcInBsdW1cIjoge1wiaHNsXCI6IHtcImhcIjogMzcsXCJzXCI6IDEwMCxcImxcIjogOTIgfSwgXCJyZ2JcIjoge1wiclwiOiAyMjEsXCJnXCI6IDE2MCxcImJcIjogMjIxIH0sIFwiaGV4XCI6IFwiI2RkYTBkZFwifSxcbiAgICBcInBvd2RlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjgsXCJzXCI6IDEwMCxcImxcIjogODYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzYsXCJnXCI6IDIyNCxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2IwZTBlNlwifSxcbiAgICBcInB1cnBsZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMCxcInNcIjogNTksXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAwLFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODAwMDgwXCJ9LFxuICAgIFwicmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM1MCxcInNcIjogMTAwLFwibFwiOiA4OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZjAwMDBcIn0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiA0NyxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxODgsXCJnXCI6IDE0MyxcImJcIjogMTQzIH0sIFwiaGV4XCI6IFwiI2JjOGY4ZlwifSxcbiAgICBcInJveWFsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODcsXCJzXCI6IDUyLFwibFwiOiA4MCB9LCBcInJnYlwiOiB7XCJyXCI6IDY1LFwiZ1wiOiAxMDUsXCJiXCI6IDIyNSB9LCBcImhleFwiOiBcIiM0MTY5ZTFcIn0sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAyNSxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzksXCJnXCI6IDY5LFwiYlwiOiAxOSB9LCBcImhleFwiOiBcIiM4YjQ1MTNcIn0sXG4gICAgXCJzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogMjI1LFwic1wiOiA3MyxcImxcIjogNTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDEyOCxcImJcIjogMTE0IH0sIFwiaGV4XCI6IFwiI2ZhODA3MlwifSxcbiAgICBcInNhbmR5YnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMjUsXCJzXCI6IDc2LFwibFwiOiAzMSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NCxcImdcIjogMTY0LFwiYlwiOiA5NiB9LCBcImhleFwiOiBcIiNmNGE0NjBcIn0sXG4gICAgXCJzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA2LFwic1wiOiA5MyxcImxcIjogNzEgfSwgXCJyZ2JcIjoge1wiclwiOiA0NixcImdcIjogMTM5LFwiYlwiOiA4NyB9LCBcImhleFwiOiBcIiMyZThiNTdcIn0sXG4gICAgXCJzZWFzaGVsbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyOCxcInNcIjogODcsXCJsXCI6IDY3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDUsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNmZmY1ZWVcIn0sXG4gICAgXCJzaWVubmFcIjoge1wiaHNsXCI6IHtcImhcIjogMTQ2LFwic1wiOiA1MCxcImxcIjogMzYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjAsXCJnXCI6IDgyLFwiYlwiOiA0NSB9LCBcImhleFwiOiBcIiNhMDUyMmRcIn0sXG4gICAgXCJzaWx2ZXJcIjoge1wiaHNsXCI6IHtcImhcIjogMjUsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxOTIsXCJnXCI6IDE5MixcImJcIjogMTkyIH0sIFwiaGV4XCI6IFwiI2MwYzBjMFwifSxcbiAgICBcInNreWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTksXCJzXCI6IDU2LFwibFwiOiA0MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEzNSxcImdcIjogMjA2LFwiYlwiOiAyMzUgfSwgXCJoZXhcIjogXCIjODdjZWViXCJ9LFxuICAgIFwic2xhdGVibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5NyxcInNcIjogNzEsXCJsXCI6IDczIH0sIFwicmdiXCI6IHtcInJcIjogMTA2LFwiZ1wiOiA5MCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiIzZhNWFjZFwifSxcbiAgICBcInNsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDgsXCJzXCI6IDUzLFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDExMixcImdcIjogMTI4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjNzA4MDkwXCJ9LFxuICAgIFwic2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTMsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTEyLFwiZ1wiOiAxMjgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM3MDgwOTBcIn0sXG4gICAgXCJzbm93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTMsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTAsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiNmZmZhZmFcIn0sXG4gICAgXCJzcHJpbmdncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAxMDAsXCJsXCI6IDk5IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAxMjcgfSwgXCJoZXhcIjogXCIjMDBmZjdmXCJ9LFxuICAgIFwic3RlZWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDcwLFwiZ1wiOiAxMzAsXCJiXCI6IDE4MCB9LCBcImhleFwiOiBcIiM0NjgyYjRcIn0sXG4gICAgXCJ0YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMjA3LFwic1wiOiA0NCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTAsXCJnXCI6IDE4MCxcImJcIjogMTQwIH0sIFwiaGV4XCI6IFwiI2QyYjQ4Y1wifSxcbiAgICBcInRlYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDQ0LFwibFwiOiA2OSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzAwODA4MFwifSxcbiAgICBcInRoaXN0bGVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAyNCxcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTYsXCJnXCI6IDE5MSxcImJcIjogMjE2IH0sIFwiaGV4XCI6IFwiI2Q4YmZkOFwifSxcbiAgICBcInRvbWF0b1wiOiB7XCJoc2xcIjoge1wiaFwiOiA5LFwic1wiOiAxMDAsXCJsXCI6IDY0IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiA5OSxcImJcIjogNzEgfSwgXCJoZXhcIjogXCIjZmY2MzQ3XCJ9LFxuICAgIFwidHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3NCxcInNcIjogNzIsXCJsXCI6IDU2IH0sIFwicmdiXCI6IHtcInJcIjogNjQsXCJnXCI6IDIyNCxcImJcIjogMjA4IH0sIFwiaGV4XCI6IFwiIzQwZTBkMFwifSxcbiAgICBcInZpb2xldFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDc2LFwibFwiOiA3MiB9LCBcInJnYlwiOiB7XCJyXCI6IDIzOCxcImdcIjogMTMwLFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjZWU4MmVlXCJ9LFxuICAgIFwid2hlYXRcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDc3LFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjIyLFwiYlwiOiAxNzkgfSwgXCJoZXhcIjogXCIjZjVkZWIzXCJ9LFxuICAgIFwid2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogOTYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmZmZmZlwifSxcbiAgICBcIndoaXRlc21va2VcIjoge1wiaHNsXCI6IHtcImhcIjogODAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjQ1LFwiYlwiOiAyNDUgfSwgXCJoZXhcIjogXCIjZjVmNWY1XCJ9LFwieWVsbG93XCI6IHsgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmZmMDBcIn0sXCJ5ZWxsb3dncmVlblwiOiB7IFwicmdiXCI6IHtcInJcIjogMTU0LFwiZ1wiOiAyMDUsXCJiXCI6IDUwIH0sIFwiaGV4XCI6IFwiIzlhY2QzMlwifVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5hbWVkY29sb3JzOyIsInZhciBDYW1lcmEgPSByZXF1aXJlKCcuLi8uLi9zcmMvZW5naW5lL2NhbWVyYS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdDYW1lcmEnLCBmdW5jdGlvbigpe1xuICAgIHZhciBjYW1lcmE7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgY2FtZXJhID0gbmV3IENhbWVyYSg2MDAsIDQwMCk7XG4gICAgfSlcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2hlaWdodCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soY2FtZXJhLmhlaWdodCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoY2FtZXJhLmhlaWdodCwgNDAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuXG4gICAgfSk7XG59KTsiLCJ2YXIgU2NlbmUgPSByZXF1aXJlKCcuLi8uLi9zcmMvZW5naW5lL3NjZW5lLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ1NjZW5lJywgZnVuY3Rpb24oKXtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICAvL3ZhciBzY2VuZSA9IG5ldyBTY2VuZSh7Y2FudmFzX2lkOiAnd2lyZWZyYW1lJywgd2lkdGg6NjAwLCBoZWlnaHQ6NDAwfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdoZWlnaHQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gYXNzZXJ0LmVxdWFsKHNjZW5lLmhlaWdodCwgNDAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICBcbiAgICB9KVxufSk7IiwidmFyIEZhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvZ2VvbWV0cnkvZmFjZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnZhciBmYWNlO1xuXG5zdWl0ZSgnRmFjZScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGZhY2U7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgZmFjZSA9IG5ldyBGYWNlKDAsIDEsIDIsIFwicmVkXCIpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgndmVydGljZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZhY2UuZmFjZVswXSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZmFjZS5mYWNlWzFdLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmYWNlLmZhY2VbMl0sIDIpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY29sb3InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZhY2UuY29sb3IucmdiLnIsIDI1NSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7IiwidmFyIE1lc2ggPSByZXF1aXJlKCcuLi8uLi9zcmMvZ2VvbWV0cnkvbWVzaC5qcycpO1xudmFyIEZhY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvZ2VvbWV0cnkvZmFjZS5qcycpO1xudmFyIFZlY3RvciA9IHJlcXVpcmUoJ2xpbmVhcmFsZ2VhJykuVmVjdG9yO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdNZXNoJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgbWVzaDtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICBtZXNoID0gbmV3IE1lc2goJ3RyaWFuZ2xlJyxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBuZXcgVmVjdG9yKDEsMCwwKSxcbiAgICAgICAgICAgICAgICBuZXcgVmVjdG9yKDAsMSwwKSxcbiAgICAgICAgICAgICAgICBuZXcgVmVjdG9yKDAsMCwxKVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBuZXcgRmFjZSgwLCAxLCAyLCAncmVkJylcbiAgICAgICAgICAgIF0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbmFtZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5uYW1lLCAndHJpYW5nbGUnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3ZlcnRpY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzBdLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMF0ueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1swXS56LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzFdLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMV0ueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1sxXS56LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzJdLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMl0ueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1syXS56LCAxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2ZhY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLmZhY2VzWzBdLmZhY2VbMF0sIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guZmFjZXNbMF0uZmFjZVsxXSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5mYWNlc1swXS5mYWNlWzJdLCAyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3Bvc2l0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnBvc2l0aW9uLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucG9zaXRpb24ueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5wb3NpdGlvbi56LCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnJvdGF0aW9uLnBpdGNoLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnJvdGF0aW9uLnlhdywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5yb3RhdGlvbi5yb2xsLCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnNjYWxlLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guc2NhbGUueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5zY2FsZS56LCAxKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdmcm9tSlNPTicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIganNvbiA9IE1lc2guZnJvbUpTT04oXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAnbmFtZSc6ICd0cmlhbmdsZScsXG4gICAgICAgICAgICAgICAgICAgICd2ZXJ0aWNlcyc6W1xuICAgICAgICAgICAgICAgICAgICAgICAgWzEsMCwwXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFswLDEsMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMCwwLDFdXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICdmYWNlcyc6W1xuICAgICAgICAgICAgICAgICAgICAgICAgeydmYWNlJzogWzAsIDEsIDJdLCAnY29sb3InOiAncmVkJ31cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMF0ueCwganNvbi52ZXJ0aWNlc1swXS54KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzBdLnksIGpzb24udmVydGljZXNbMF0ueSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1swXS56LCBqc29uLnZlcnRpY2VzWzBdLnopO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMV0ueCwganNvbi52ZXJ0aWNlc1sxXS54KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzFdLnksIGpzb24udmVydGljZXNbMV0ueSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1sxXS56LCBqc29uLnZlcnRpY2VzWzFdLnopO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMl0ueCwganNvbi52ZXJ0aWNlc1syXS54KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzJdLnksIGpzb24udmVydGljZXNbMl0ueSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1syXS56LCBqc29uLnZlcnRpY2VzWzJdLnopO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5mYWNlc1swXS5mYWNlWzBdLCBqc29uLmZhY2VzWzBdLmZhY2VbMF0pO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guZmFjZXNbMF0uZmFjZVsxXSwganNvbi5mYWNlc1swXS5mYWNlWzFdKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLmZhY2VzWzBdLmZhY2VbMl0sIGpzb24uZmFjZXNbMF0uZmFjZVsyXSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnBvc2l0aW9uLngsIGpzb24ucG9zaXRpb24ueCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5wb3NpdGlvbi55LCBqc29uLnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucG9zaXRpb24ueiwganNvbi5wb3NpdGlvbi56KTtcbiAgICAgXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5yb3RhdGlvbi5waXRjaCwganNvbi5yb3RhdGlvbi5waXRjaCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5yb3RhdGlvbi55YXcsIGpzb24ucm90YXRpb24ueWF3KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnJvdGF0aW9uLnJvbGwsIGpzb24ucm90YXRpb24ucm9sbCk7XG4gICAgICAgIFxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guc2NhbGUueCwgbWVzaC5zY2FsZS54KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnNjYWxlLnksIG1lc2guc2NhbGUueSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5zY2FsZS56LCBtZXNoLnNjYWxlLnopO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsImZ1bmN0aW9uIG5lYXJseUVxdWFsKGEsIGIsIGVwcyl7XG4gICAgaWYgKHR5cGVvZiBlcHMgPT09IFwidW5kZWZpbmVkXCIpIHtlcHMgPSAwLjAxO31cbiAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICByZXR1cm4gKGRpZmYgPCBlcHMpO1xufVxuXG52YXIgaGVscGVycyA9IG5ldyBPYmplY3QobnVsbCk7XG5cbmhlbHBlcnMubmVhcmx5RXF1YWwgPSBuZWFybHlFcXVhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWxwZXJzOyIsInZhciBDb2xvciA9IHJlcXVpcmUoJy4uLy4uL3NyYy91dGlsaXRpZXMvY29sb3IuanMnKTtcbnZhciBuYW1lZCA9IHJlcXVpcmUoJy4uL2RhdGEvY29sb3JzLmpzJyk7XG52YXIgbmVhcmx5RXF1YWwgPSByZXF1aXJlKCcuLi9oZWxwZXJzLmpzJylbJ25lYXJseUVxdWFsJ107XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgYmx1ZSwgcmdiLCByZ2JhLCBoc2wsIGhzbGE7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVkID0gbmV3IENvbG9yKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvcihcIiMwRjBcIik7IC8vIE5hbWVkIGNvbG9yICdncmVlbicgaXMgcmdiKDAsMTI4LDApXG4gICAgICAgIGJsdWUgPSBuZXcgQ29sb3IoXCJibHVlXCIpO1xuICAgICAgICByZ2IgPSBuZXcgQ29sb3IoXCJyZ2IoMSwgNywgMjkpXCIpO1xuICAgICAgICByZ2JhID0gbmV3IENvbG9yKFwicmdiYSgxLCA3LCAyOSwgMC4zKVwiKTtcbiAgICAgICAgaHNsID0gbmV3IENvbG9yKFwiaHNsKDAsIDEwMCUsIDUwJSlcIik7XG4gICAgICAgIGhzbGEgPSBuZXcgQ29sb3IoXCJoc2xhKDAsIDEwMCUsIDUwJSwgMC4zKVwiKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ3JnYicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLnIsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuZywgNyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLmFscGhhLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5yLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5nLCA3KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBjb2xvciBpbiBuYW1lZCl7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVkLmhhc093blByb3BlcnR5KGNvbG9yKSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmV3IENvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhleCA9IG5ldyBDb2xvcihuYW1lZFtjb2xvcl0uaGV4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVkX3JnYiA9IG5hbWVkW2NvbG9yXS5yZ2I7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBoZXgucmdiLnIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuZywgaGV4LnJnYi5nKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmIsIGhleC5yZ2IuYik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBuYW1lZF9yZ2Iucik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5nLCBuYW1lZF9yZ2IuZyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5iLCBuYW1lZF9yZ2IuYik7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2hzbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5sLCA1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbC5oc2wucywgMTAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmwsIDUwKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2wuYWxwaGEsIDEpKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYS5oc2wubCwgNTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKGhzbGEuYWxwaGEsIDAuMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgY29sb3IgaW4gbmFtZWQpe1xuICAgICAgICAgICAgICAgIGlmIChuYW1lZC5oYXNPd25Qcm9wZXJ0eShjb2xvcikpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBDb2xvcihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3IobmFtZWRbY29sb3JdLmhleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lZF9oc2wgPSBuYW1lZFtjb2xvcl0ucmdiO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgaGV4LnJnYi5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIGhleC5yZ2Iucyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5sLCBoZXgucmdiLmwpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgbmFtZWRfaHNsLmgpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IucywgbmFtZWRfaHNsLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgbmFtZWRfaHNsLmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FscGhhJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZWQuYWxwaGEsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZ2JhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2xhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdsaWdodGVuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciByMyA9IHJlZC5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4ubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgZzMgPSBncmVlbi5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGIzID0gYmx1ZS5saWdodGVuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZGFya2VuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIHIyID0gcmVkLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQuZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgZzIgPSBncmVlbi5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4uZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciBiMiA9IGJsdWUuZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUuZGFya2VuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuZywgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5nLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5iLCAwKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiXX0=
(14)
});
