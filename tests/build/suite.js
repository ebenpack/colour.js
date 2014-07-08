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
var assert = _dereq_("assert");

suite('Matrix', function(){
    var zero, zero2, identity, identity2, ones, m0, m1, m2, m3, m4, m5;
    setup(function(){
        zero = Matrix.zero();
        identity = Matrix.identity();
        zero2 = new Matrix();
        identity2 = new Matrix();
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
        m5 = Matrix.fromArray([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]);
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
            assert.equal(identity.length, 16);
            assert.equal(zero2.length, 16);
            assert.equal(identity2.length, 16);
            assert.equal(m1.length, 16);
            assert.equal(m2.length, 16);
            assert.equal(m3.length, 16);
        });
    });
    suite('methods', function(){
        test('equal', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(zero.equal(zero2));
            assert.ok(!identity.equal(zero));
            assert.ok(m4.equal(m5));
            assert.ok(!m0.equal(m1));
        });
        test('add', function(){
            var t1 = zero.add(m1);
            var t2 = m0.add(ones);
            assert.ok(t1.equal(m1));
            assert.ok(t2.equal(m1));
        });
        test('subtract', function(){
            //var t1 = 0;
            var t2 = m1.subtract(ones);
            assert.ok(t2.equal(m0));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9jYW1lcmEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2V2ZW50cy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvc2NlbmUuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL21hdGgvbWF0aC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvbWF0aC92ZWN0b3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvdXRpbGl0eS9jb2xvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy91dGlsaXR5L2tleWNvZGVzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdC9mYWtlXzZlMGU2OWEwLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZGF0YS9jb2xvcnMuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9lbmdpbmUvY2FtZXJhLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZW5naW5lL3NjZW5lLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvbWF0aC9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvbWF0aC9tYXRyaXguanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9tYXRoL3ZlY3Rvci5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL3V0aWxpdHkvY29sb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmIChpc05hTih2YWx1ZSkgfHwgIWlzRmluaXRlKHZhbHVlKSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgICAga2V5LCBpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwidmFyIG1hdGggPSByZXF1aXJlKCcuLi9tYXRoL21hdGguanMnKTtcbnZhciBWZWN0b3IgPSBtYXRoLlZlY3RvcjtcbnZhciBNYXRyaXggPSBtYXRoLk1hdHJpeDtcblxuLyoqIFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcG9zaXRpb24gQ2FtZXJhIHBvc2l0aW9uLlxuICogQHBhcmFtIHtWZWN0b3J9IHRhcmdldCAgIENhbWVyYVxuICovXG5mdW5jdGlvbiBDYW1lcmEod2lkdGgsIGhlaWdodCwgcG9zaXRpb24pe1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbiB8fCBuZXcgVmVjdG9yKDEsMSwyMCk7XG4gICAgdGhpcy51cCA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgdGhpcy5yb3RhdGlvbiA9IHsneWF3JzogMCwgJ3BpdGNoJzogMCwgJ3JvbGwnOiAwfTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMubmVhciA9IDAuMTtcbiAgICB0aGlzLmZhciA9IDEwMDA7XG4gICAgdGhpcy5mb3YgPSA5MDtcbiAgICB0aGlzLnBlcnNwZWN0aXZlRm92ID0gdGhpcy5jYWxjdWxhdGVQZXJzcGVjdGl2ZUZvdigpO1xufVxuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUuZGlyZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNpbl9waXRjaCA9IE1hdGguc2luKHRoaXMucm90YXRpb24ucGl0Y2gpO1xuICAgIHZhciBjb3NfcGl0Y2ggPSBNYXRoLmNvcyh0aGlzLnJvdGF0aW9uLnBpdGNoKTtcbiAgICB2YXIgc2luX3lhdyA9IE1hdGguc2luKHRoaXMucm90YXRpb24ueWF3KTtcbiAgICB2YXIgY29zX3lhdyA9IE1hdGguY29zKHRoaXMucm90YXRpb24ueWF3KTtcblxuICAgIHJldHVybiBuZXcgVmVjdG9yKC1jb3NfcGl0Y2ggKiBzaW5feWF3LCBzaW5fcGl0Y2gsIC1jb3NfcGl0Y2ggKiBjb3NfeWF3KTtcbn07XG4vKipcbiAqIEJ1aWxkcyBhIHBlcnNwZWN0aXZlIHByb2plY3Rpb24gbWF0cml4IGJhc2VkIG9uIGEgZmllbGQgb2Ygdmlldy5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5jYWxjdWxhdGVQZXJzcGVjdGl2ZUZvdiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3YgPSB0aGlzLmZvdiAqIChNYXRoLlBJIC8gMTgwKTsgLy8gY29udmVydCB0byByYWRpYW5zXG4gICAgdmFyIGFzcGVjdCA9IHRoaXMud2lkdGggLyB0aGlzLmhlaWdodDtcbiAgICB2YXIgbmVhciA9IHRoaXMubmVhcjtcbiAgICB2YXIgZmFyID0gdGhpcy5mYXI7XG4gICAgdmFyIG1hdHJpeCA9IE1hdHJpeC56ZXJvKCk7XG4gICAgdmFyIGhlaWdodCA9ICgxL01hdGgudGFuKGZvdi8yKSkgKiB0aGlzLmhlaWdodDtcbiAgICB2YXIgd2lkdGggPSBoZWlnaHQgKiBhc3BlY3Q7XG5cbiAgICBtYXRyaXhbMF0gPSB3aWR0aDtcbiAgICBtYXRyaXhbNV0gPSBoZWlnaHQ7XG4gICAgbWF0cml4WzEwXSA9IGZhci8obmVhci1mYXIpIDtcbiAgICBtYXRyaXhbMTFdID0gLTE7XG4gICAgbWF0cml4WzE0XSA9IG5lYXIqZmFyLyhuZWFyLWZhcik7XG5cbiAgICByZXR1cm4gbWF0cml4O1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLmNyZWF0ZVZpZXdNYXRyaXggPSBmdW5jdGlvbigpe1xuICAgIHZhciBleWUgPSB0aGlzLnBvc2l0aW9uO1xuICAgIHZhciBwaXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2g7XG4gICAgdmFyIHlhdyA9IHRoaXMucm90YXRpb24ueWF3O1xuICAgIHZhciBjb3NfcGl0Y2ggPSBNYXRoLmNvcyhwaXRjaCk7XG4gICAgdmFyIHNpbl9waXRjaCA9IE1hdGguc2luKHBpdGNoKTtcbiAgICB2YXIgY29zX3lhdyA9IE1hdGguY29zKHlhdyk7XG4gICAgdmFyIHNpbl95YXcgPSBNYXRoLnNpbih5YXcpO1xuXG4gICAgdmFyIHhheGlzID0gbmV3IFZlY3Rvcihjb3NfeWF3LCAwLCAtc2luX3lhdyApO1xuICAgIHZhciB5YXhpcyA9IG5ldyBWZWN0b3Ioc2luX3lhdyAqIHNpbl9waXRjaCwgY29zX3BpdGNoLCBjb3NfeWF3ICogc2luX3BpdGNoICk7XG4gICAgdmFyIHpheGlzID0gbmV3IFZlY3RvcihzaW5feWF3ICogY29zX3BpdGNoLCAtc2luX3BpdGNoLCBjb3NfcGl0Y2ggKiBjb3NfeWF3ICk7XG5cbiAgICB2YXIgdmlld19tYXRyaXggPSBNYXRyaXguZnJvbUFycmF5KFtcbiAgICAgICAgeGF4aXMueCwgeWF4aXMueCwgemF4aXMueCwgMCxcbiAgICAgICAgeGF4aXMueSwgeWF4aXMueSwgemF4aXMueSwgMCxcbiAgICAgICAgeGF4aXMueiwgeWF4aXMueiwgemF4aXMueiwgMCxcbiAgICAgICAgLSh4YXhpcy5kb3QoZXllKSApLCAtKCB5YXhpcy5kb3QoZXllKSApLCAtKCB6YXhpcy5kb3QoZXllKSApLCAxXG4gICAgXSk7XG4gICAgcmV0dXJuIHZpZXdfbWF0cml4O1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVUbyA9IGZ1bmN0aW9uKHgsIHksIHope1xuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yKHgseSx6KTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVJpZ2h0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgcmlnaHQgPSB0aGlzLnVwLmNyb3NzKHRoaXMuZGlyZWN0aW9uKCkpLm5vcm1hbGl6ZSgpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uc3VidHJhY3QocmlnaHQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlTGVmdCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGxlZnQgPSB0aGlzLnVwLmNyb3NzKHRoaXMuZGlyZWN0aW9uKCkpLm5vcm1hbGl6ZSgpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKGxlZnQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5DYW1lcmEucHJvdG90eXBlLnR1cm5SaWdodCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi55YXcgLT0gYW1vdW50O1xuICAgIGlmICh0aGlzLnJvdGF0aW9uLnlhdyA8IDApe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnlhdyA9IHRoaXMucm90YXRpb24ueWF3ICsgKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS50dXJuTGVmdCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi55YXcgKz0gYW1vdW50O1xuICAgIGlmICh0aGlzLnJvdGF0aW9uLnlhdyA+IChNYXRoLlBJKjIpKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi55YXcgPSB0aGlzLnJvdGF0aW9uLnlhdyAtIChNYXRoLlBJKjIpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuQ2FtZXJhLnByb3RvdHlwZS5sb29rVXAgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHRoaXMucm90YXRpb24ucGl0Y2ggLT0gYW1vdW50O1xuICAgIGlmICh0aGlzLnJvdGF0aW9uLnBpdGNoID4gKE1hdGguUEkqMikpe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaCAtIChNYXRoLlBJKjIpO1xuICAgIH1cbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubG9va0Rvd24gPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHRoaXMucm90YXRpb24ucGl0Y2ggKz0gYW1vdW50O1xuICAgIGlmICh0aGlzLnJvdGF0aW9uLnBpdGNoIDwgMCl7XG4gICAgICAgIHRoaXMucm90YXRpb24ucGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoICsgKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlVXAgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciB1cCA9IHRoaXMudXAubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQodXApO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlRG93biA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGRvd24gPSB0aGlzLnVwLm5vcm1hbGl6ZSgpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uc3VidHJhY3QoZG93bik7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVGb3J3YXJkID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgZm9yd2FyZCA9IHRoaXMuZGlyZWN0aW9uKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQoZm9yd2FyZCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVCYWNrd2FyZCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGJhY2t3YXJkID0gdGhpcy5kaXJlY3Rpb24oKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KGJhY2t3YXJkKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIi8qKlxuICogRXZlbnQgaGFuZGxlci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxMCBOaWNob2xhcyBDLiBaYWthcy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuZnVuY3Rpb24gRXZlbnRUYXJnZXQoKXtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcbn1cblxuLyoqIEBtZXRob2QgKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICBpZiAodHlwZW9mIHRoaXMuX2xpc3RlbmVyc1t0eXBlXSA9PT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgIH1cblxuICAgIHRoaXMuX2xpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuRXZlbnRUYXJnZXQucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbihldmVudCl7XG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgIGV2ZW50ID0geyB0eXBlOiBldmVudCB9O1xuICAgIH1cbiAgICBpZiAoIWV2ZW50LnRhcmdldCl7XG4gICAgICAgIGV2ZW50LnRhcmdldCA9IHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKCFldmVudC50eXBlKXsgIC8vZmFsc3lcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXZlbnQgb2JqZWN0IG1pc3NpbmcgJ3R5cGUnIHByb3BlcnR5LlwiKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW2V2ZW50LnR5cGVdIGluc3RhbmNlb2YgQXJyYXkpe1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50LnR5cGVdO1xuICAgICAgICBmb3IgKHZhciBpPTAsIGxlbj1saXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcil7XG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1t0eXBlXSBpbnN0YW5jZW9mIEFycmF5KXtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgZm9yICh2YXIgaT0wLCBsZW49bGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0gPT09IGxpc3RlbmVyKXtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudFRhcmdldDsiLCJ2YXIgbWF0aCA9IHJlcXVpcmUoJy4uL21hdGgvbWF0aC5qcycpO1xudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhLmpzJyk7XG52YXIgRXZlbnRUYXJnZXQgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEtFWUNPREVTID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9rZXljb2Rlcy5qcycpO1xuXG52YXIgVmVjdG9yID0gbWF0aC5WZWN0b3I7XG52YXIgTWF0cml4ID0gbWF0aC5NYXRyaXg7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3tjYW52YXNfaWQ6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXJ9fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFNjZW5lKG9wdGlvbnMpe1xuICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoO1xuICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQ7XG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRpb25zLmNhbnZhc19pZCk7XG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXIud2lkdGggPSB0aGlzLndpZHRoO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyLmhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2N0eCA9IHRoaXMuX2JhY2tfYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSBudWxsO1xuICAgIHRoaXMuX2RlcHRoX2J1ZmZlciA9IFtdO1xuICAgIHRoaXMuZHJhd2luZ19tb2RlID0gMTtcbiAgICB0aGlzLl9iYWNrZmFjZV9jdWxsaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmNhbWVyYSA9IG5ldyBDYW1lcmEodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIHRoaXMuaWxsdW1pbmF0aW9uID0gbmV3IFZlY3Rvcig5MCwwLDApO1xuICAgIC8qKiBAdHlwZSB7QXJyYXkuPE1lc2g+fSAqL1xuICAgIHRoaXMubWVzaGVzID0ge307XG4gICAgLyoqIEB0eXBlIHtPYmplY3QuPG51bWJlciwgYm9vbGVhbj59ICovXG4gICAgdGhpcy5fa2V5cyA9IHt9OyAvLyBLZXlzIGN1cnJlbnRseSBwcmVzc2VkXG4gICAgdGhpcy5fa2V5X2NvdW50ID0gMDsgLy8gTnVtYmVyIG9mIGtleXMgYmVpbmcgcHJlc3NlZC4uLiB0aGlzIGZlZWxzIGtsdWRneVxuICAgIC8qKiBAdHlwZSB7P251bWJlcn0gKi9cbiAgICB0aGlzLl9hbmltX2lkID0gbnVsbDtcbiAgICAvKiogQHR5cGUge2Jvb2xlYW59ICovXG4gICAgdGhpcy5fbmVlZHNfdXBkYXRlID0gdHJ1ZTtcbiAgICB0aGlzLl9kcmF3X21vZGUgPSAnd2lyZWZyYW1lJztcbiAgICB0aGlzLmluaXQoKTtcbn1cblNjZW5lLnByb3RvdHlwZSA9IG5ldyBFdmVudFRhcmdldCgpO1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmNhbnZhcy50YWJJbmRleCA9IDE7IC8vIFNldCB0YWIgaW5kZXggdG8gYWxsb3cgY2FudmFzIHRvIGhhdmUgZm9jdXMgdG8gcmVjZWl2ZSBrZXkgZXZlbnRzXG4gICAgdGhpcy5feF9vZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyAyKTtcbiAgICB0aGlzLl95X29mZnNldCA9IE1hdGgucm91bmQodGhpcy5oZWlnaHQgLyAyKTtcbiAgICB0aGlzLmluaXRpYWxpemVEZXB0aEJ1ZmZlcigpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gdGhpcy5fYmFja19idWZmZXJfY3R4LmNyZWF0ZUltYWdlRGF0YSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMub25LZXlVcC5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuZW1wdHlLZXlzLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICBFdmVudFRhcmdldC5jYWxsKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlKCk7XG59O1xuLyoqXG4gKiBEdW1wIGFsbCBwcmVzc2VkIGtleXMgb24gYmx1ci5cbiAqIEBtZXRob2RcbiAqL1xuU2NlbmUucHJvdG90eXBlLmVtcHR5S2V5cyA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5fa2V5X2NvdW50ID0gMDtcbiAgICB0aGlzLl9rZXlzID0ge307XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pc0tleURvd24gPSBmdW5jdGlvbihrZXkpe1xuICAgIHJldHVybiAoS0VZQ09ERVNba2V5XSBpbiB0aGlzLl9rZXlzKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9uS2V5RG93biA9IGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwcmVzc2VkID0gZS5rZXlDb2RlIHx8IGUud2hpY2g7XG4gICAgaWYgKCF0aGlzLmlzS2V5RG93bihwcmVzc2VkKSl7XG4gICAgICAgIHRoaXMuX2tleV9jb3VudCArPSAxO1xuICAgICAgICB0aGlzLl9rZXlzW3ByZXNzZWRdID0gdHJ1ZTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5vbktleVVwID0gZnVuY3Rpb24oZSl7XG4gICAgdmFyIHByZXNzZWQgPSBlLmtleUNvZGUgfHwgZS53aGljaDtcbiAgICBpZiAocHJlc3NlZCBpbiB0aGlzLl9rZXlzKXtcbiAgICAgICAgdGhpcy5fa2V5X2NvdW50IC09IDE7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9rZXlzW3ByZXNzZWRdO1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmluaXRpYWxpemVEZXB0aEJ1ZmZlciA9IGZ1bmN0aW9uKCl7XG4gICAgZm9yICh2YXIgeCA9IDAsIGxlbiA9IHRoaXMud2lkdGggKiB0aGlzLmhlaWdodDsgeCA8IGxlbjsgeCsrKXtcbiAgICAgICAgdGhpcy5fZGVwdGhfYnVmZmVyW3hdID0gOTk5OTk5OTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5vZmZzY3JlZW4gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIC8vIFRPRE86IE5vdCB0b3RhbGx5IGNlcnRhaW4gdGhhdCB6PjEgaW5kaWNhdGVzIHZlY3RvciBpcyBiZWhpbmQgY2FtZXJhLlxuICAgIHZhciB4ID0gdmVjdG9yLnggKyB0aGlzLl94X29mZnNldDtcbiAgICB2YXIgeSA9IHZlY3Rvci55ICsgdGhpcy5feV9vZmZzZXQ7XG4gICAgdmFyIHogPSB2ZWN0b3IuejtcbiAgICByZXR1cm4gKHogPiAxIHx8IHggPCAwIHx8IHggPiB0aGlzLndpZHRoIHx8IHkgPCAwIHx8IHkgPiB0aGlzLmhlaWdodCk7XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5kcmF3UGl4ZWwgPSBmdW5jdGlvbih4LCB5LCB6LCBjb2xvcil7XG4gICAgeCA9IE1hdGguZmxvb3IoeCArIHRoaXMuX3hfb2Zmc2V0KTtcbiAgICB5ID0gTWF0aC5mbG9vcih5ICsgdGhpcy5feV9vZmZzZXQpO1xuICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLmhlaWdodCkge1xuICAgICAgICB2YXIgaW5kZXggPSB4ICsgKHkgKiB0aGlzLndpZHRoKTtcbiAgICAgICAgaWYgKHogPCB0aGlzLl9kZXB0aF9idWZmZXJbaW5kZXhdKSB7XG4gICAgICAgICAgICB2YXIgaW1hZ2VfZGF0YSA9IHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlLmRhdGE7XG4gICAgICAgICAgICB2YXIgaSA9IGluZGV4ICogNDtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaV0gPSBjb2xvci5yO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzFdID0gY29sb3IuZztcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSsyXSA9IGNvbG9yLmI7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krM10gPSAyNTU7XG4gICAgICAgICAgICB0aGlzLl9kZXB0aF9idWZmZXJbaW5kZXhdID0gejtcbiAgICAgICAgfVxuICAgIH1cbn07XG4vKiogQG1ldGhvZCAgKi9cblNjZW5lLnByb3RvdHlwZS5kcmF3RWRnZSA9IGZ1bmN0aW9uKHZlY3RvcjEsIHZlY3RvcjIsIGNvbG9yKXtcbiAgICB2YXIgYWJzID0gTWF0aC5hYnM7XG4gICAgaWYgKHZlY3RvcjEueCA+IHZlY3RvcjIueCl7XG4gICAgICAgIHZhciB0ZW1wID0gdmVjdG9yMTtcbiAgICAgICAgdmVjdG9yMSA9IHZlY3RvcjI7XG4gICAgICAgIHZlY3RvcjIgPSB0ZW1wO1xuICAgIH1cbiAgICB2YXIgY3VycmVudF94ID0gdmVjdG9yMS54O1xuICAgIHZhciBjdXJyZW50X3kgPSB2ZWN0b3IxLnk7XG4gICAgdmFyIGN1cnJlbnRfeiA9IHZlY3RvcjEuejtcbiAgICB2YXIgbG9uZ2VzdF9kaXN0ID0gTWF0aC5tYXgoYWJzKHZlY3RvcjIueCAtIHZlY3RvcjEueCksIGFicyh2ZWN0b3IyLnkgLSB2ZWN0b3IxLnkpLCBhYnModmVjdG9yMi56IC0gdmVjdG9yMS56KSk7XG4gICAgdmFyIHN0ZXBfeCA9ICh2ZWN0b3IyLnggLSB2ZWN0b3IxLngpIC8gbG9uZ2VzdF9kaXN0O1xuICAgIHZhciBzdGVwX3kgPSAodmVjdG9yMi55IC0gdmVjdG9yMS55KSAvIGxvbmdlc3RfZGlzdDtcbiAgICB2YXIgc3RlcF96ID0gKHZlY3RvcjIueiAtIHZlY3RvcjEueikgLyBsb25nZXN0X2Rpc3Q7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvbmdlc3RfZGlzdDsgaSsrKXtcbiAgICAgICAgdGhpcy5kcmF3UGl4ZWwoY3VycmVudF94LCBjdXJyZW50X3ksIGN1cnJlbnRfeiwgY29sb3IpO1xuICAgICAgICBjdXJyZW50X3ggKz0gc3RlcF94O1xuICAgICAgICBjdXJyZW50X3kgKz0gc3RlcF95O1xuICAgICAgICBjdXJyZW50X3ogKz0gc3RlcF96O1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdUcmlhbmdsZSA9IGZ1bmN0aW9uKHZlY3RvcjEsIHZlY3RvcjIsIHZlY3RvcjMsIGNvbG9yKXtcbiAgICB0aGlzLmRyYXdFZGdlKHZlY3RvcjEsIHZlY3RvcjIsIGNvbG9yKTtcbiAgICB0aGlzLmRyYXdFZGdlKHZlY3RvcjIsIHZlY3RvcjMsIGNvbG9yKTtcbiAgICB0aGlzLmRyYXdFZGdlKHZlY3RvcjMsIHZlY3RvcjEsIGNvbG9yKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmRyYXdGbGF0Qm90dG9tVHJpYW5nbGUgPSBmdW5jdGlvbih2MSwgdjIsIHYzLCBjb2xvcil7XG4gICAgLy8gRHJhdyBsZWZ0IHRvIHJpZ2h0XG4gICAgaWYgKHYyLnggPj0gdjMueCl7XG4gICAgICAgIHZhciB0ZW1wID0gdjM7XG4gICAgICAgIHYzID0gdjI7XG4gICAgICAgIHYyID0gdGVtcDtcbiAgICB9XG4gICAgLy8gY29tcHV0ZSBkZWx0YXNcbiAgICB2YXIgZHh5X2xlZnQgID0gKHYzLngtdjEueCkvKHYzLnktdjEueSk7XG4gICAgdmFyIGR4eV9yaWdodCA9ICh2Mi54LXYxLngpLyh2Mi55LXYxLnkpO1xuICAgIHZhciB6X3Nsb3BlX2xlZnQgPSAodjMuei12MS56KS8odjMueS12MS55KTtcbiAgICB2YXIgel9zbG9wZV9yaWdodCA9ICh2Mi56LXYxLnopLyh2Mi55LXYxLnkpO1xuXG4gICAgLy8gc2V0IHN0YXJ0aW5nIGFuZCBlbmRpbmcgcG9pbnRzIGZvciBlZGdlIHRyYWNlXG4gICAgdmFyIHhzID0gbmV3IFZlY3Rvcih2MS54LCB2MS55LCB2MS56KTtcbiAgICB2YXIgeGUgPSBuZXcgVmVjdG9yKHYxLngsIHYxLnksIHYxLnopO1xuICAgIHhzLnogPSB2My56ICsgKCh2MS55IC0gdjMueSkgKiB6X3Nsb3BlX2xlZnQpO1xuICAgIHhlLnogPSB2Mi56ICsgKCh2MS55IC0gdjIueSkgKiB6X3Nsb3BlX3JpZ2h0KTtcblxuICAgIC8vIGRyYXcgZWFjaCBzY2FubGluZVxuICAgIGZvciAodmFyIHk9djEueTsgeSA8PSB2Mi55OyB5Kyspe1xuICAgICAgICB4cy55ID0geTtcbiAgICAgICAgeGUueSA9IHk7XG4gICAgICAgIHRoaXMuZHJhd0VkZ2UoeHMsIHhlLCBjb2xvcik7XG5cbiAgICAgICAgLy8gbW92ZSBkb3duIG9uZSBzY2FubGluZVxuICAgICAgICB4cy54Kz1keHlfbGVmdDtcbiAgICAgICAgeGUueCs9ZHh5X3JpZ2h0O1xuICAgICAgICB4cy56Kz16X3Nsb3BlX2xlZnQ7XG4gICAgICAgIHhlLnorPXpfc2xvcGVfcmlnaHQ7XG4gICAgfVxufTtcblNjZW5lLnByb3RvdHlwZS5kcmF3RmxhdFRvcFRyaWFuZ2xlID0gZnVuY3Rpb24odjEsIHYyLCB2MywgY29sb3Ipe1xuICAgIC8vIERyYXcgbGVmdCB0byByaWdodFxuICAgIGlmICh2MS54ID49IHYyLngpe1xuICAgICAgICB2YXIgdGVtcCA9IHYxO1xuICAgICAgICB2MSA9IHYyO1xuICAgICAgICB2MiA9IHRlbXA7XG4gICAgfVxuICAgIC8vIGNvbXB1dGUgZGVsdGFzXG4gICAgdmFyIGR4eV9sZWZ0ICA9ICh2My54LXYxLngpLyh2My55LXYxLnkpO1xuICAgIHZhciBkeHlfcmlnaHQgPSAodjMueC12Mi54KS8odjMueS12Mi55KTtcbiAgICB2YXIgel9zbG9wZV9sZWZ0ID0gKHYzLnotdjEueikvKHYzLnktdjEueSk7XG4gICAgdmFyIHpfc2xvcGVfcmlnaHQgPSAodjMuei12Mi56KS8odjMueS12Mi55KTtcblxuICAgIC8vIHNldCBzdGFydGluZyBhbmQgZW5kaW5nIHBvaW50cyBmb3IgZWRnZSB0cmFjZVxuICAgIHZhciB4cyA9IG5ldyBWZWN0b3IodjEueCwgdjEueSwgdjEueik7XG4gICAgdmFyIHhlID0gbmV3IFZlY3Rvcih2Mi54LCB2MS55LCB2MS56KTtcblxuICAgIHhzLnogPSB2MS56ICsgKCh2MS55IC0gdjEueSkgKiB6X3Nsb3BlX2xlZnQpO1xuICAgIHhlLnogPSB2Mi56ICsgKCh2MS55IC0gdjIueSkgKiB6X3Nsb3BlX3JpZ2h0KTtcblxuICAgIC8vIGRyYXcgZWFjaCBzY2FubGluZVxuICAgIGZvciAodmFyIHk9djEueTsgeSA8PSB2My55OyB5Kyspe1xuICAgICAgICB4cy55ID0geTtcbiAgICAgICAgeGUueSA9IHk7XG4gICAgICAgIC8vIGRyYXcgYSBsaW5lIGZyb20geHMgdG8geGUgYXQgeSBpbiBjb2xvciBjXG4gICAgICAgIHRoaXMuZHJhd0VkZ2UoeHMsIHhlLCBjb2xvcik7XG4gICAgICAgIC8vIG1vdmUgZG93biBvbmUgc2NhbmxpbmVcbiAgICAgICAgeHMueCs9ZHh5X2xlZnQ7XG4gICAgICAgIHhlLngrPWR4eV9yaWdodDtcbiAgICAgICAgeHMueis9el9zbG9wZV9sZWZ0O1xuICAgICAgICB4ZS56Kz16X3Nsb3BlX3JpZ2h0O1xuICAgIH1cbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmZpbGxUcmlhbmdsZSA9IGZ1bmN0aW9uKHYxLCB2MiwgdjMsIGNvbG9yKXtcbiAgICAvLyBEcmF3IGVkZ2VzIGZpcnN0XG4gICAgLy8gVE9ETzogRml4LiBUaGlzIGlzIGEgaGFjay4gXG4gICAgLy90aGlzLmRyYXdUcmlhbmdsZSh2MSwgdjIsIHYzLCBjb2xvcik7XG4gICAgLy8gU29ydCB2ZXJ0aWNlcyBieSB5IHZhbHVlXG4gICAgdmFyIHRlbXA7XG4gICAgaWYodjEueSA+IHYyLnkpIHtcbiAgICAgICAgdGVtcCA9IHYyO1xuICAgICAgICB2MiA9IHYxO1xuICAgICAgICB2MSA9IHRlbXA7XG4gICAgfVxuICAgIGlmKHYyLnkgPiB2My55KSB7XG4gICAgICAgIHRlbXAgPSB2MjtcbiAgICAgICAgdjIgPSB2MztcbiAgICAgICAgdjMgPSB0ZW1wO1xuICAgIH1cbiAgICBpZih2MS55ID4gdjIueSkge1xuICAgICAgICB0ZW1wID0gdjI7XG4gICAgICAgIHYyID0gdjE7XG4gICAgICAgIHYxID0gdGVtcDtcbiAgICB9XG4gICAgLy8gVHJpYW5nbGUgd2l0aCBubyBoZWlnaHRcbiAgICBpZiAoKHYxLnkgLSB2My55KSA9PT0gMCl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2hvcnRfc2xvcGUsIGxvbmdfc2xvcGU7XG4gICAgaWYgKCh2Mi55IC0gdjEueSkgPT09IDApIHtcbiAgICAgICAgc2hvcnRfc2xvcGUgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3J0X3Nsb3BlID0gKHYyLnggLSB2MS54KSAvICh2Mi55IC0gdjEueSk7XG4gICAgfVxuICAgIGlmICgodjMueSAtIHYxLnkpID09PSAwKSB7XG4gICAgICAgIGxvbmdfc2xvcGUgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxvbmdfc2xvcGUgPSAodjMueCAtIHYxLngpIC8gKHYzLnkgLSB2MS55KTtcbiAgICB9XG5cbiAgICBpZiAodjIueSA9PT0gdjMueSl7XG4gICAgICAgIC8vIEZsYXQgdG9wXG4gICAgICAgIHRoaXMuZHJhd0ZsYXRCb3R0b21UcmlhbmdsZSh2MSwgdjIsIHYzLCBjb2xvcik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHYxLnkgPT09IHYyLnkgKXtcbiAgICAgICAgLy8gRmxhdCBib3R0b21cbiAgICAgICAgdGhpcy5kcmF3RmxhdFRvcFRyaWFuZ2xlKHYxLCB2MiwgdjMsIGNvbG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEZWNvbXBvc2UgaW50byBmbGF0IHRvcCBhbmQgZmxhdCBib3R0b20gdHJpYW5nbGVzXG4gICAgICAgIHZhciB6X3Nsb3BlID0gKHYzLnogLSB2MS56KSAvICh2My55IC0gdjEueSk7XG4gICAgICAgIHZhciB4ID0gKCh2Mi55IC0gdjEueSkqbG9uZ19zbG9wZSkgKyB2MS54O1xuICAgICAgICB2YXIgeiA9ICgodjIueSAtIHYxLnkpKnpfc2xvcGUpICsgdjEuejtcbiAgICAgICAgdmFyIHY0ID0gbmV3IFZlY3Rvcih4LCB2Mi55LCB6KTtcbiAgICAgICAgdGhpcy5kcmF3RmxhdEJvdHRvbVRyaWFuZ2xlKHYxLCB2MiwgdjQsIGNvbG9yKTtcbiAgICAgICAgdGhpcy5kcmF3RmxhdFRvcFRyaWFuZ2xlKHYyLCB2NCwgdjMsIGNvbG9yKTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5yZW5kZXJTY2VuZSA9IGZ1bmN0aW9uKCl7XG4gICAgLy8gVE9ETzogU2ltcGxpZnkgdGhpcyBmdW5jdGlvbi5cbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IHRoaXMuX2JhY2tfYnVmZmVyX2N0eC5jcmVhdGVJbWFnZURhdGEodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZURlcHRoQnVmZmVyKCk7XG4gICAgdmFyIGNhbWVyYV9tYXRyaXggPSB0aGlzLmNhbWVyYS52aWV3X21hdHJpeDtcbiAgICB2YXIgcHJvamVjdGlvbl9tYXRyaXggPSB0aGlzLmNhbWVyYS5wZXJzcGVjdGl2ZUZvdjtcbiAgICB2YXIgbGlnaHQgPSB0aGlzLmlsbHVtaW5hdGlvbjtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5tZXNoZXMpe1xuICAgICAgICBpZiAodGhpcy5tZXNoZXMuaGFzT3duUHJvcGVydHkoa2V5KSl7XG4gICAgICAgICAgICB2YXIgbWVzaCA9IHRoaXMubWVzaGVzW2tleV07XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBtZXNoLnNjYWxlO1xuICAgICAgICAgICAgdmFyIHJvdGF0aW9uID0gbWVzaC5yb3RhdGlvbjtcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IG1lc2gucG9zaXRpb247XG4gICAgICAgICAgICB2YXIgd29ybGRfbWF0cml4ID0gTWF0cml4LnNjYWxlKHNjYWxlLngsIHNjYWxlLnksIHNjYWxlLnopLm11bHRpcGx5KFxuICAgICAgICAgICAgICAgIE1hdHJpeC5yb3RhdGlvbihyb3RhdGlvbi5waXRjaCwgcm90YXRpb24ueWF3LCByb3RhdGlvbi5yb2xsKS5tdWx0aXBseShcbiAgICAgICAgICAgICAgICAgICAgTWF0cml4LnRyYW5zbGF0aW9uKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IG1lc2guZmFjZXMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgIHZhciBmYWNlID0gbWVzaC5mYWNlc1trXS5mYWNlO1xuICAgICAgICAgICAgICAgIHZhciBjb2xvciA9IG1lc2guZmFjZXNba10uY29sb3I7XG4gICAgICAgICAgICAgICAgdmFyIHYxID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzBdXTtcbiAgICAgICAgICAgICAgICB2YXIgdjIgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMV1dO1xuICAgICAgICAgICAgICAgIHZhciB2MyA9IG1lc2gudmVydGljZXNbZmFjZVsyXV07XG5cbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIG5vcm1hbFxuICAgICAgICAgICAgICAgIC8vIFRPRE86IENhbiB0aGlzIGJlIGNhbGN1bGF0ZWQganVzdCBvbmNlLCBhbmQgdGhlbiB0cmFuc2Zvcm1lZCBpbnRvXG4gICAgICAgICAgICAgICAgLy8gY2FtZXJhIHNwYWNlP1xuICAgICAgICAgICAgICAgIHZhciBjYW1fdG9fdmVydCA9IHRoaXMuY2FtZXJhLnBvc2l0aW9uLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lkZTEgPSB2Mi50cmFuc2Zvcm0od29ybGRfbWF0cml4KS5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpZGUyID0gdjMudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBub3JtID0gc2lkZTEuY3Jvc3Moc2lkZTIpO1xuICAgICAgICAgICAgICAgIGlmIChub3JtLm1hZ25pdHVkZSgpIDw9IDAuMDAwMDAwMDEpe1xuICAgICAgICAgICAgICAgICAgICBub3JtID0gbm9ybTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub3JtID0gbm9ybS5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQmFja2ZhY2UgY3VsbGluZy5cbiAgICAgICAgICAgICAgICBpZiAoY2FtX3RvX3ZlcnQuZG90KG5vcm0pID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2cF9tYXRyaXggPSB3b3JsZF9tYXRyaXgubXVsdGlwbHkoY2FtZXJhX21hdHJpeCkubXVsdGlwbHkocHJvamVjdGlvbl9tYXRyaXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgd3YxID0gdjEudHJhbnNmb3JtKHd2cF9tYXRyaXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgd3YyID0gdjIudHJhbnNmb3JtKHd2cF9tYXRyaXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgd3YzID0gdjMudHJhbnNmb3JtKHd2cF9tYXRyaXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHJhdyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRHJhdyBzdXJmYWNlIG5vcm1hbHNcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIGZhY2VfdHJhbnMgPSBNYXRyaXgudHJhbnNsYXRpb24od3YxLngsIHd2MS55LCB2MS56KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3RWRnZSh3djEsIG5vcm0uc2NhbGUoMjApLnRyYW5zZm9ybShmYWNlX3RyYW5zKSwgeydyJzoyNTUsXCJnXCI6MjU1LFwiYlwiOjI1NX0pXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogRml4IGZydXN0dW0gY3VsbGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHJlYWxseSBzdHVwaWQgZnJ1c3R1bSBjdWxsaW5nLi4uIHRoaXMgY2FuIHJlc3VsdCBpbiBzb21lIGZhY2VzIG5vdCBiZWluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBkcmF3biB3aGVuIHRoZXkgc2hvdWxkLCBlLmcuIHdoZW4gYSB0cmlhbmdsZXMgdmVydGljZXMgc3RyYWRkbGUgdGhlIGZydXN0cnVtLlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vZmZzY3JlZW4od3YxKSAmJiB0aGlzLm9mZnNjcmVlbih3djIpICYmIHRoaXMub2Zmc2NyZWVuKHd2Mykpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChkcmF3KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaWdodF9kaXJlY3Rpb24gPSBsaWdodC5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWxsdW1pbmF0aW9uX2FuZ2xlID0gbm9ybS5kb3QobGlnaHRfZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yID0gY29sb3IubGlnaHRlbihpbGx1bWluYXRpb25fYW5nbGUvNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxUcmlhbmdsZSh3djEsIHd2Miwgd3YzLCBjb2xvci5yZ2IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzLmRyYXdUcmlhbmdsZSh3djEsIHd2Miwgd3YzLCBjb2xvci5yZ2IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2N0eC5wdXRJbWFnZURhdGEodGhpcy5fYmFja19idWZmZXJfaW1hZ2UsIDAsIDApO1xuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICB0aGlzLmN0eC5kcmF3SW1hZ2UodGhpcy5fYmFja19idWZmZXIsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuYWRkTWVzaCA9IGZ1bmN0aW9uKG1lc2gpe1xuICAgIHRoaXMubWVzaGVzW21lc2gubmFtZV0gPSBtZXNoO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUucmVtb3ZlTWVzaCA9IGZ1bmN0aW9uKG1lc2gpe1xuICAgIGRlbGV0ZSB0aGlzLm1lc2hlc1ttZXNoLm5hbWVdO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKXtcbiAgICBpZiAodGhpcy5fa2V5X2NvdW50ID4gMCl7XG4gICAgICAgIHRoaXMuZmlyZSgna2V5ZG93bicpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBBZGQga2V5dXAsIG1vdXNlZG93biwgbW91c2VkcmFnLCBtb3VzZXVwLCBldGMuXG4gICAgaWYgKHRoaXMuX25lZWRzX3VwZGF0ZSkge1xuICAgICAgICB0aGlzLnJlbmRlclNjZW5lKCk7XG4gICAgICAgIHRoaXMuX25lZWRzX3VwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9hbmltX2lkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmU7XG4iLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi91dGlsaXR5L2NvbG9yLmpzJyk7XG5cbi8qKlxuICogQSAzRCB0cmlhbmdsZVxuICogQHBhcmFtIHtudW1iZXJ9IGEgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7bnVtYmVyfSBiICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge251bWJlcn0gYyAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gRmFjZShhLCBiLCBjLCBjb2xvcil7XG4gICAgdGhpcy5mYWNlID0gW2EsIGIsIGNdO1xuICAgIHRoaXMuY29sb3IgPSBuZXcgQ29sb3IoY29sb3IpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2U7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yLmpzJyk7XG52YXIgTWVzaCA9IHJlcXVpcmUoJy4vbWVzaC5qcycpO1xudmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4vbWF0cml4LmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4vZmFjZS5qcycpO1xuXG52YXIgbWF0aCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbm1hdGguVmVjdG9yID0gVmVjdG9yO1xubWF0aC5NZXNoID0gTWVzaDtcbm1hdGguTWF0cml4ID0gTWF0cml4O1xubWF0aC5GYWNlID0gRmFjZTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXRoOyIsIi8qKiBcbiAqIDR4NCBtYXRyaXguXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWF0cml4KCl7XG4gICAgLyoqIEB0eXBlIHtBcnJheS48bnVtYmVyPn0gKi9cbiAgICBmb3IgKHZhciBpPTA7IGk8MTY7IGkrKyl7XG4gICAgICAgIHRoaXNbaV0gPSAwO1xuICAgIH1cbiAgICB0aGlzLmxlbmd0aCA9IDE2O1xufVxuLyoqXG4gKiBDb21wYXJlIG1hdHJpeCB3aXRoIHNlbGYgZm9yIGVxdWFsaXR5LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5lcXVhbCA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBpZiAodGhpc1tpXSAhPT0gbWF0cml4W2ldKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG4vKipcbiAqIEFkZCBtYXRyaXggdG8gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gKyBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogU3VidHJhY3QgbWF0cml4IGZyb20gc2VsZi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gdGhpc1tpXSAtIG1hdHJpeFtpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBNdWx0aXBseSBzZWxmIGJ5IHNjYWxhci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsYXJcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uKHNjYWxhcil7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gdGhpc1tpXSAqIHNjYWxhcjtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBNdWx0aXBseSBzZWxmIGJ5IG1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9ICh0aGlzWzBdICogbWF0cml4WzBdKSArICh0aGlzWzFdICogbWF0cml4WzRdKSArICh0aGlzWzJdICogbWF0cml4WzhdKSArICh0aGlzWzNdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFsxXSA9ICh0aGlzWzBdICogbWF0cml4WzFdKSArICh0aGlzWzFdICogbWF0cml4WzVdKSArICh0aGlzWzJdICogbWF0cml4WzldKSArICh0aGlzWzNdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsyXSA9ICh0aGlzWzBdICogbWF0cml4WzJdKSArICh0aGlzWzFdICogbWF0cml4WzZdKSArICh0aGlzWzJdICogbWF0cml4WzEwXSkgKyAodGhpc1szXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbM10gPSAodGhpc1swXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs3XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzRdID0gKHRoaXNbNF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOF0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzVdID0gKHRoaXNbNF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzZdID0gKHRoaXNbNF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzddICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFs3XSA9ICh0aGlzWzRdICogbWF0cml4WzNdKSArICh0aGlzWzVdICogbWF0cml4WzddKSArICh0aGlzWzZdICogbWF0cml4WzExXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbOF0gPSAodGhpc1s4XSAqIG1hdHJpeFswXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTFdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs5XSA9ICh0aGlzWzhdICogbWF0cml4WzFdKSArICh0aGlzWzldICogbWF0cml4WzVdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzEwXSA9ICh0aGlzWzhdICogbWF0cml4WzJdKSArICh0aGlzWzldICogbWF0cml4WzZdKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTFdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxMV0gPSAodGhpc1s4XSAqIG1hdHJpeFszXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs3XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbMTJdID0gKHRoaXNbMTJdICogbWF0cml4WzBdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTVdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFsxM10gPSAodGhpc1sxMl0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMTNdICogbWF0cml4WzVdKSArICh0aGlzWzE0XSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzE0XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNl0pICsgKHRoaXNbMTRdICogbWF0cml4WzEwXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzE1XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbN10pICsgKHRoaXNbMTRdICogbWF0cml4WzExXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTVdKTtcbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE5lZ2F0ZSBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICB0aGlzW2ldID0gLXRoaXNbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogVHJhbnNwb3NlIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBuZXdfbWF0cml4WzBdID0gdGhpc1swXTtcbiAgICBuZXdfbWF0cml4WzFdID0gdGhpc1s0XTtcbiAgICBuZXdfbWF0cml4WzJdID0gdGhpc1s4XTtcbiAgICBuZXdfbWF0cml4WzNdID0gdGhpc1sxMl07XG4gICAgbmV3X21hdHJpeFs0XSA9IHRoaXNbMV07XG4gICAgbmV3X21hdHJpeFs1XSA9IHRoaXNbNV07XG4gICAgbmV3X21hdHJpeFs2XSA9IHRoaXNbOV07XG4gICAgbmV3X21hdHJpeFs3XSA9IHRoaXNbMTNdO1xuICAgIG5ld19tYXRyaXhbOF0gPSB0aGlzWzJdO1xuICAgIG5ld19tYXRyaXhbOV0gPSB0aGlzWzZdO1xuICAgIG5ld19tYXRyaXhbMTBdID0gdGhpc1sxMF07XG4gICAgbmV3X21hdHJpeFsxMV0gPSB0aGlzWzE0XTtcbiAgICBuZXdfbWF0cml4WzEyXSA9IHRoaXNbM107XG4gICAgbmV3X21hdHJpeFsxM10gPSB0aGlzWzddO1xuICAgIG5ld19tYXRyaXhbMTRdID0gdGhpc1sxMV07XG4gICAgbmV3X21hdHJpeFsxNV0gPSB0aGlzWzE1XTtcbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB4LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25YID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeS1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzJdID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzhdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHotYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblogPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxXSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzRdID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSBheGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvbkF4aXMgPSBmdW5jdGlvbihheGlzLCB0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgdSA9IGF4aXMubm9ybWFsaXplKCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdS54O1xuICAgIHZhciB1eSA9IHUueTtcbiAgICB2YXIgdXogPSB1Lno7XG4gICAgdmFyIHh5ID0gdXggKiB1eTtcbiAgICB2YXIgeHogPSB1eCAqIHV6O1xuICAgIHZhciB5eiA9IHV5ICogdXo7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zICsgKCh1eCp1eCkqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzFdID0gKHh5KmNvczEpIC0gKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzJdID0gKHh6KmNvczEpKyh1eSpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9ICh4eSpjb3MxKSsodXoqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3MrKCh1eSp1eSkqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzZdID0gKHl6KmNvczEpLSh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs4XSA9ICh4eipjb3MxKS0odXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOV0gPSAoeXoqY29zMSkrKHV4KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcyArICgodXoqdXopKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4IGZyb20gcGl0Y2gsIHlhdywgYW5kIHJvbGxcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uID0gZnVuY3Rpb24ocGl0Y2gsIHlhdywgcm9sbCl7XG4gICAgcmV0dXJuIE1hdHJpeC5yb3RhdGlvblgocm9sbCkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWih5YXcpKS5tdWx0aXBseShNYXRyaXgucm90YXRpb25ZKHBpdGNoKSk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgdHJhbnNsYXRpb24gbWF0cml4IGZyb20geCwgeSwgYW5kIHogZGlzdGFuY2VzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0geHRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0geXRyYW5zXG4gKiBAcGFyYW0ge251bWJlcn0genRyYW5zXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC50cmFuc2xhdGlvbiA9IGZ1bmN0aW9uKHh0cmFucywgeXRyYW5zLCB6dHJhbnMpe1xuICAgIHZhciB0cmFuc2xhdGlvbl9tYXRyaXggPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTJdID0geHRyYW5zO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxM10gPSB5dHJhbnM7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzE0XSA9IHp0cmFucztcbiAgICByZXR1cm4gdHJhbnNsYXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHNjYWxpbmcgbWF0cml4IGZyb20geCwgeSwgYW5kIHogc2NhbGVcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnNjYWxlID0gZnVuY3Rpb24oeHNjYWxlLCB5c2NhbGUsIHpzY2FsZSl7XG4gICAgdmFyIHNjYWxpbmdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHNjYWxpbmdfbWF0cml4WzBdID0geHNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzVdID0geXNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzEwXSA9IHpzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiBzY2FsaW5nX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYW4gaWRlbnRpdHkgbWF0cml4XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5pZGVudGl0eSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGlkZW50aXR5ID0gbmV3IE1hdHJpeCgpO1xuICAgIGlkZW50aXR5WzBdID0gMTtcbiAgICBpZGVudGl0eVs1XSA9IDE7XG4gICAgaWRlbnRpdHlbMTBdID0gMTtcbiAgICBpZGVudGl0eVsxNV0gPSAxO1xuICAgIHJldHVybiBpZGVudGl0eTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB6ZXJvIG1hdHJpeFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguemVybyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBNYXRyaXgoKTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBuZXcgbWF0cml4IGZyb20gYW4gYXJyYXlcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LmZyb21BcnJheSA9IGZ1bmN0aW9uKGFycil7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IGFycltpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdHJpeDsiLCJ2YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3IuanMnKTtcbnZhciBGYWNlID0gcmVxdWlyZSgnLi9mYWNlLmpzJyk7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtBcnJheS48VmVydGV4Pn0gdmVydGljZXNcbiAqIEBwYXJhbSB7QXJyYXkuPHtlZGdlOiBBcnJheS48bnVtYmVyPiwgY29sb3I6IHN0cmluZ30+fSBlZGdlc1xuICovXG5mdW5jdGlvbiBNZXNoKG5hbWUsIHZlcnRpY2VzLCBmYWNlcyl7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnZlcnRpY2VzID0gdmVydGljZXM7XG4gICAgdGhpcy5mYWNlcyA9IGZhY2VzO1xuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yKDAsIDAsIDApO1xuICAgIHRoaXMucm90YXRpb24gPSB7J3lhdyc6IDAsICdwaXRjaCc6IDAsICdyb2xsJzogMH07XG4gICAgdGhpcy5zY2FsZSA9IHsneCc6IDEsICd5JzogMSwgJ3onOiAxfTtcbn1cbk1lc2guZnJvbUpTT04gPSBmdW5jdGlvbihqc29uKXtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICB2YXIgZmFjZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0ganNvbi52ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIHZhciB2ZXJ0ZXggPSBqc29uLnZlcnRpY2VzW2ldO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoKG5ldyBWZWN0b3IodmVydGV4WzBdLCB2ZXJ0ZXhbMV0sIHZlcnRleFsyXSkpO1xuICAgIH1cbiAgICBmb3IgKHZhciBqID0gMCwgbG4gPSBqc29uLmZhY2VzLmxlbmd0aDsgaiA8IGxuOyBqKyspe1xuICAgICAgICB2YXIgZmFjZSA9IGpzb24uZmFjZXNbal07XG4gICAgICAgIGZhY2VzLnB1c2gobmV3IEZhY2UoZmFjZS5mYWNlWzBdLCBmYWNlLmZhY2VbMV0sIGZhY2UuZmFjZVsyXSwgZmFjZS5jb2xvcikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IE1lc2goanNvbi5uYW1lLCB2ZXJ0aWNlcywgZmFjZXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZXNoO1xuIiwiLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHBhcmFtIHtudW1iZXJ9IHpcbiAqL1xuZnVuY3Rpb24gVmVjdG9yKHgsIHksIHope1xuICAgIGlmICh0eXBlb2YgeCA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHkgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB6ID09PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5zdWZmaWNpZW50IGFyZ3VtZW50cy4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLnogPSB6O1xuICAgIH1cbn1cbi8qKlxuICogQWRkIHZlY3RvciB0byBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICsgdmVjdG9yLngsIHRoaXMueSArIHZlY3Rvci55LCB0aGlzLnogKyB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBTdWJ0cmFjdCB2ZWN0b3IgZnJvbSBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLSB2ZWN0b3IueCwgdGhpcy55IC0gdmVjdG9yLnksIHRoaXMueiAtIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIENvbXBhcmUgdmVjdG9yIHdpdGggc2VsZiBmb3IgZXF1YWxpdHlcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiB0aGlzLnggPT09IHZlY3Rvci54ICYmIHRoaXMueSA9PT0gdmVjdG9yLnkgJiYgdGhpcy56ID09PSB2ZWN0b3Iuejtcbn07XG4vKipcbiAqIEZpbmQgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hbmdsZSA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIGEgPSB0aGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBiID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBhbWFnID0gYS5tYWduaXR1ZGUoKTtcbiAgICB2YXIgYm1hZyA9IGIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSBhLmRvdChiKSAvIChhbWFnICogYm1hZyApO1xuICAgIGlmICh0aGV0YSA8IC0xKSB7dGhldGEgPSAtMTt9XG4gICAgaWYgKHRoZXRhID4gMSkge3RoZXRhID0gMTt9XG4gICAgcmV0dXJuIE1hdGguYWNvcyh0aGV0YSk7XG59O1xuLyoqXG4gKiBGaW5kIHRoZSBjb3Mgb2YgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY29zQW5nbGUgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBhID0gdGhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgYiA9IHZlY3Rvci5ub3JtYWxpemUoKTtcbiAgICB2YXIgYW1hZyA9IGEubWFnbml0dWRlKCk7XG4gICAgdmFyIGJtYWcgPSBiLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gYS5kb3QoYikgLyAoYW1hZyAqIGJtYWcgKTtcbiAgICBpZiAodGhldGEgPCAtMSkge3RoZXRhID0gLTE7fVxuICAgIGlmICh0aGV0YSA+IDEpIHt0aGV0YSA9IDE7fVxuICAgIHJldHVybiB0aGV0YTtcbn07XG4vKipcbiAqIEZpbmQgbWFnbml0dWRlIG9mIGEgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIE1hdGguc3FydCgodGhpcy54ICogdGhpcy54KSArICh0aGlzLnkgKiB0aGlzLnkpICsgKHRoaXMueiAqIHRoaXMueikpO1xufTtcbi8qKlxuICogRmluZCBtYWduaXR1ZGUgc3F1YXJlZCBvZiBhIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tYWduaXR1ZGVTcXVhcmVkID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gKHRoaXMueCAqIHRoaXMueCkgKyAodGhpcy55ICogdGhpcy55KSArICh0aGlzLnogKiB0aGlzLnopO1xufTtcbi8qKlxuICogRmluZCBkb3QgcHJvZHVjdCBvZiBzZWxmIGFuZCB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gKHRoaXMueCAqIHZlY3Rvci54KSArICh0aGlzLnkgKiB2ZWN0b3IueSkgKyAodGhpcy56ICogdmVjdG9yLnopO1xufTtcbi8qKlxuICogRmluZCBjcm9zcyBwcm9kdWN0IG9mIHNlbGYgYW5kIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jcm9zcyA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoXG4gICAgICAgICh0aGlzLnkgKiB2ZWN0b3IueikgLSAodGhpcy56ICogdmVjdG9yLnkpLFxuICAgICAgICAodGhpcy56ICogdmVjdG9yLngpIC0gKHRoaXMueCAqIHZlY3Rvci56KSxcbiAgICAgICAgKHRoaXMueCAqIHZlY3Rvci55KSAtICh0aGlzLnkgKiB2ZWN0b3IueClcbiAgICApO1xufTtcbi8qKlxuICogTm9ybWFsaXplIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKiBAdGhyb3dzIHtaZXJvRGl2aXNpb25FcnJvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbigpe1xuICAgIHZhciBtYWduaXR1ZGUgPSB0aGlzLm1hZ25pdHVkZSgpO1xuICAgIGlmIChtYWduaXR1ZGUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAvIG1hZ25pdHVkZSwgdGhpcy55IC8gbWFnbml0dWRlLCB0aGlzLnogLyBtYWduaXR1ZGUpO1xufTtcbi8qKlxuICogU2NhbGUgc2VsZiBieSBzY2FsZS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAqIHNjYWxlLCB0aGlzLnkgKiBzY2FsZSwgdGhpcy56ICogc2NhbGUpO1xufTtcbi8qKiBAbWV0aG9kICovXG5WZWN0b3IucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XG59O1xuLyoqXG4gKiBQcm9qZWN0IHNlbGYgb250byB2ZWN0b3JcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS52ZWN0b3JQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgbWFnID0gdmVjdG9yLm1hZ25pdHVkZSgpO1xuICAgIHJldHVybiB2ZWN0b3Iuc2NhbGUodGhpcy5kb3QodmVjdG9yKSAvIChtYWcgKiBtYWcpKTtcbn07XG4vKipcbiAqIFByb2plY3Qgc2VsZiBvbnRvIHZlY3RvclxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxhclByb2plY3Rpb24gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiB0aGlzLmRvdCh2ZWN0b3IpIC8gdmVjdG9yLm1hZ25pdHVkZSgpO1xufTtcbi8qKlxuICogUGVyZm9ybSBsaW5lYXIgdHJhbmZvcm1hdGlvbiBvbiBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IHRyYW5zZm9ybV9tYXRyaXhcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbih0cmFuc2Zvcm1fbWF0cml4KXtcbiAgICB2YXIgeCA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzBdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzRdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzhdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTJdO1xuICAgIHZhciB5ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMV0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNV0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOV0pICsgdHJhbnNmb3JtX21hdHJpeFsxM107XG4gICAgdmFyIHogPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsyXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs2XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMF0pICsgdHJhbnNmb3JtX21hdHJpeFsxNF07XG4gICAgdmFyIHcgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFszXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs3XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMV0pICsgdHJhbnNmb3JtX21hdHJpeFsxNV07XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCAvIHcsIHkgLyB3LCB6IC8gdyk7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKGF4aXMsIHRoZXRhKXtcbiAgICB2YXIgdSA9IGF4aXMubm9ybWFsaXplKCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdS54O1xuICAgIHZhciB1eSA9IHUueTtcbiAgICB2YXIgdXogPSB1Lno7XG4gICAgdmFyIHh5ID0gdS54ICogdS55O1xuICAgIHZhciB4eiA9IHUueCAqIHUuejtcbiAgICB2YXIgeXogPSB1LnkgKiB1Lno7XG4gICAgdmFyIHggPSAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueCkgKyAoKCh4eSpjb3MxKSAtICh1eipzaW4pKSAqIHRoaXMueSkgKyAoKCh4eipjb3MxKSsodXkqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB5ID0gKCgoeHkqY29zMSkrKHV6KnNpbikpICogdGhpcy54KSArICgoY29zKygodXkqdXkpKmNvczEpKSAqIHRoaXMueSkgKyAoKCh5eipjb3MxKS0odXgqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKCgoeHoqY29zMSktKHV5KnNpbikpICogdGhpcy54KSArICgoKHl6KmNvczEpKyh1eCpzaW4pKSAqIHRoaXMueSkgKyAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgeC1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVYID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IChjb3MgKiB0aGlzLnkpIC0gKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoc2luICogdGhpcy55KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHktYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICp0aGlzLngpICsgKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSAtKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB6LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gKGNvcyAqIHRoaXMueCkgLSAoc2luICogdGhpcy55KTtcbiAgICB2YXIgeSA9IChzaW4gKiB0aGlzLngpICsgKGNvcyAqIHRoaXMueSk7XG4gICAgdmFyIHogPSB0aGlzLno7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSBwaXRjaCwgeWF3LCByb2xsXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlUGl0Y2hZYXdSb2xsID0gZnVuY3Rpb24ocGl0Y2hfYW1udCwgeWF3X2FtbnQsIHJvbGxfYW1udCkge1xuICAgIHJldHVybiB0aGlzLnJvdGF0ZVgocm9sbF9hbW50KS5yb3RhdGVZKHBpdGNoX2FtbnQpLnJvdGF0ZVooeWF3X2FtbnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7IiwidmFyIHBhcnNlQ29sb3IsIGNhY2hlO1xuLyoqXG4gKiBBIGNvbG9yIHdpdGggYm90aCByZ2IgYW5kIGhzbCByZXByZXNlbnRhdGlvbnMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBBbnkgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqL1xuZnVuY3Rpb24gQ29sb3IoY29sb3Ipe1xuICAgIHZhciBwYXJzZWRfY29sb3IgPSB7fTtcbiAgICBpZiAoY29sb3IgaW4gY2FjaGUpe1xuICAgICAgICBwYXJzZWRfY29sb3IgPSBjYWNoZVtjb2xvcl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFyc2VkX2NvbG9yID0gcGFyc2VDb2xvcihjb2xvcik7XG4gICAgICAgIGNhY2hlW2NvbG9yXSA9IHBhcnNlZF9jb2xvcjtcbiAgICB9XG4gICAgdmFyIGhzbCA9IENvbG9yLnJnYlRvSHNsKHBhcnNlZF9jb2xvci5yLCBwYXJzZWRfY29sb3IuZywgcGFyc2VkX2NvbG9yLmIpO1xuICAgIHRoaXMucmdiID0geydyJzogcGFyc2VkX2NvbG9yLnIsICdnJzogcGFyc2VkX2NvbG9yLmcsICdiJzogcGFyc2VkX2NvbG9yLmJ9O1xuICAgIHRoaXMuaHNsID0geydoJzogaHNsLmgsICdzJzogaHNsLnMsICdsJzogaHNsLmx9O1xuICAgIHRoaXMuYWxwaGEgPSBwYXJzZWRfY29sb3IuYSB8fCAxO1xufVxuLyoqXG4gKiBMaWdodGVuIGEgY29sb3IgYnkgcGVyY2VudCBhbW91bnQuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG9yfVxuICovXG5Db2xvci5wcm90b3R5cGUubGlnaHRlbiA9IGZ1bmN0aW9uKHBlcmNlbnQpe1xuICAgIHZhciBoc2wgPSB0aGlzLmhzbDtcbiAgICB2YXIgbHVtID0gaHNsLmwgKyBwZXJjZW50O1xuICAgIGlmIChsdW0gPiAxKXtcbiAgICAgICAgbHVtID0gMTtcbiAgICB9XG4gICAgdmFyIGxpZ2h0ZXIgPSBDb2xvci5oc2xUb1JnYihoc2wuaCwgaHNsLnMsIGx1bSk7XG4gICAgcmV0dXJuIG5ldyBDb2xvcihcInJnYihcIiArIE1hdGguZmxvb3IobGlnaHRlci5yKSArIFwiLFwiICsgTWF0aC5mbG9vcihsaWdodGVyLmcpICsgXCIsXCIgKyBNYXRoLmZsb29yKGxpZ2h0ZXIuYikgKyBcIilcIik7XG59O1xuLyoqXG4gKiBEYXJrZW4gYSBjb2xvciBieSBwZXJjZW50IGFtb3VudC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3J9XG4gKi9cbkNvbG9yLnByb3RvdHlwZS5kYXJrZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sIC0gcGVyY2VudDtcbiAgICBpZiAobHVtIDwgMCl7XG4gICAgICAgIGx1bSA9IDA7XG4gICAgfVxuICAgIHZhciBkYXJrZXIgPSBDb2xvci5oc2xUb1JnYihoc2wuaCwgaHNsLnMsIGx1bSk7XG4gICAgcmV0dXJuIG5ldyBDb2xvcihcInJnYihcIiArIE1hdGguZmxvb3IoZGFya2VyLnIpICsgXCIsXCIgKyBNYXRoLmZsb29yKGRhcmtlci5nKSArIFwiLFwiICsgTWF0aC5mbG9vcihkYXJrZXIuYikgKyBcIilcIik7XG59O1xuQ29sb3IuaHNsVG9SZ2IgPSBmdW5jdGlvbihoLCBzLCBsKXtcbiAgICBmdW5jdGlvbiBfdihtMSwgbTIsIGh1ZSl7XG4gICAgICAgIGh1ZSA9IGh1ZSAlIDE7XG4gICAgICAgIGlmIChodWUgPCAwKXtodWUrPTE7fVxuICAgICAgICBpZiAoaHVlIDwgKDEvNikpe1xuICAgICAgICAgICAgcmV0dXJuIG0xICsgKG0yLW0xKSpodWUqNjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgMC41KXtcbiAgICAgICAgICAgIHJldHVybiBtMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgKDIvMykpe1xuICAgICAgICAgICAgcmV0dXJuIG0xICsgKG0yLW0xKSooKDIvMyktaHVlKSo2O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtMTtcbiAgICB9XG4gICAgdmFyIG0yO1xuICAgIGlmIChzID09PSAwKXtcbiAgICAgICAgcmV0dXJuIHsncic6IGwsICdnJzogbCwgJ2InOiBsfTtcbiAgICB9XG4gICAgaWYgKGwgPD0gMC41KXtcbiAgICAgICAgbTIgPSBsICogKDErcyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIG0yID0gbCtzLShsKnMpO1xuICAgIH1cbiAgICB2YXIgbTEgPSAyKmwgLSBtMjtcbiAgICByZXR1cm4geydyJzogX3YobTEsIG0yLCBoKygxLzMpKSoyNTUsICdnJzogX3YobTEsIG0yLCBoKSoyNTUsICdiJzogX3YobTEsIG0yLCBoLSgxLzMpKSoyNTV9O1xufTtcbkNvbG9yLnJnYlRvSHNsID0gZnVuY3Rpb24ociwgZywgYil7XG4gICAgciA9IHIgLyAyNTU7XG4gICAgZyA9IGcgLyAyNTU7XG4gICAgYiA9IGIgLyAyNTU7XG4gICAgdmFyIG1heGMgPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICB2YXIgbWluYyA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIHZhciBsID0gKG1pbmMrbWF4YykvMjtcbiAgICB2YXIgaCwgcztcbiAgICBpZiAobWluYyA9PT0gbWF4Yyl7XG4gICAgICAgIHJldHVybiB7J2gnOiAwLCAncyc6IDAsICdsJzogbH07XG4gICAgfVxuICAgIGlmIChsIDw9IDAuNSl7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvIChtYXhjK21pbmMpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAoMi1tYXhjLW1pbmMpO1xuICAgIH1cbiAgICB2YXIgcmMgPSAobWF4Yy1yKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBnYyA9IChtYXhjLWcpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGJjID0gKG1heGMtYikgLyAobWF4Yy1taW5jKTtcbiAgICBpZiAociA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSBiYy1nYztcbiAgICB9XG4gICAgZWxzZSBpZiAoZyA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSAyK3JjLWJjO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBoID0gNCtnYy1yYztcbiAgICB9XG4gICAgaCA9IChoLzYpICUgMTtcbiAgICBpZiAoaCA8IDApe2grPTE7fVxuICAgIHJldHVybiB7J2gnOiBoLCAncyc6IHMsICdsJzogbH07XG59O1xuXG4vKipcbiAqIFBhcnNlIGEgQ1NTIGNvbG9yIHZhbHVlIGFuZCByZXR1cm4gYW4gcmdiYSBjb2xvciBvYmplY3QuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvbG9yIEEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXJ9fSAgIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHRocm93cyB7Q29sb3JFcnJvcn0gSWYgaWxsZWdhbCBjb2xvciB2YWx1ZSBpcyBwYXNzZWQuXG4gKi9cbnBhcnNlQ29sb3IgPSBmdW5jdGlvbihjb2xvcil7XG4gICAgLy8gVE9ETzogSG93IGNyb3NzLWJyb3dzZXIgY29tcGF0aWJsZSBpcyB0aGlzPyBIb3cgZWZmaWNpZW50P1xuICAgIC8vIE1ha2UgYSB0ZW1wb3JhcnkgSFRNTCBlbGVtZW50IHN0eWxlZCB3aXRoIHRoZSBnaXZlbiBjb2xvciBzdHJpbmdcbiAgICAvLyB0aGVuIGV4dHJhY3QgYW5kIHBhcnNlIHRoZSBjb21wdXRlZCByZ2IoYSkgdmFsdWUuXG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcbiAgICB2YXIgcmdiYSA9IGRpdi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgLy8gQ29udmVydCBzdHJpbmcgaW4gZm9ybSAncmdiW2FdKG51bSwgbnVtLCBudW1bLCBudW1dKScgdG8gYXJyYXkgWydudW0nLCAnbnVtJywgJ251bSdbLCAnbnVtJ11dXG4gICAgcmdiYSA9IHJnYmEuc2xpY2UocmdiYS5pbmRleE9mKCcoJykrMSkuc2xpY2UoMCwtMSkucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xuICAgIHZhciByZXR1cm5fY29sb3IgPSB7fTtcbiAgICB2YXIgY29sb3Jfc3BhY2VzID0gWydyJywgJ2cnLCAnYicsICdhJ107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZ2JhLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdChyZ2JhW2ldKTsgLy8gQWxwaGEgdmFsdWUgd2lsbCBiZSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgaWYgKGlzTmFOKHZhbHVlKSl7XG4gICAgICAgICAgICB0aHJvdyBcIkNvbG9yRXJyb3I6IFNvbWV0aGluZyB3ZW50IHdyb25nLiBQZXJoYXBzIFwiICsgY29sb3IgKyBcIiBpcyBub3QgYSBsZWdhbCBDU1MgY29sb3IgdmFsdWVcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybl9jb2xvcltjb2xvcl9zcGFjZXNbaV1dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldHVybl9jb2xvcjtcbn07XG4vLyBQcmUtd2FybSB0aGUgY2FjaGUgd2l0aCBuYW1lZCBjb2xvcnMsIGFzIHRoZXNlIGFyZSBub3Rcbi8vIGNvbnZlcnRlZCB0byByZ2IgdmFsdWVzIGJ5IHRoZSBwYXJzZUNvbG9yIGZ1bmN0aW9uIGFib3ZlLlxuY2FjaGUgPSB7XG4gICAgXCJibGFja1wiOiB7IFwiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAsIFwiYVwiOiAxfSxcbiAgICBcInNpbHZlclwiOiB7IFwiclwiOiAxOTIsIFwiZ1wiOiAxOTIsIFwiYlwiOiAxOTIsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNzUyOTQxMTc2NDcwNTg4MiwgXCJhXCI6IDF9LFxuICAgIFwiZ3JheVwiOiB7IFwiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwid2hpdGVcIjogeyBcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAxLCBcImFcIjogMX0sXG4gICAgXCJtYXJvb25cIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwicmVkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwicHVycGxlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDEsIFwibFwiOiAwLjI1MDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJmdWNoc2lhXCI6IHtcInJcIjogMjU1LCBcImdcIjogMCwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImdyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEyOCwgXCJiXCI6IDAsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAxLCBcImxcIjogMC4yNTA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwibGltZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwib2xpdmVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjI1MDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJ5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogMC4xNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcIm5hdnlcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDEsIFwibFwiOiAwLjI1MDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJ0ZWFsXCI6IHtcInJcIjogMCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAuNSwgXCJzXCI6IDEsIFwibFwiOiAwLjI1MDk4MDM5MjE1Njg2Mjc0LCBcImFcIjogMX0sXG4gICAgXCJhcXVhXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAuNSwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcIm9yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2NSwgXCJiXCI6IDAsIFwiaFwiOiAwLjEwNzg0MzEzNzI1NDkwMTk3LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiYWxpY2VibHVlXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMC41Nzc3Nzc3Nzc3Nzc3Nzc4LCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjM1LCBcImJcIjogMjE1LCBcImhcIjogMC4wOTUyMzgwOTUyMzgwOTUxOSwgXCJzXCI6IDAuNzc3Nzc3Nzc3Nzc3Nzc3OSwgXCJsXCI6IDAuOTExNzY0NzA1ODgyMzUyOSwgXCJhXCI6IDF9LFxuICAgIFwiYXF1YW1hcmluZVwiOiB7XCJyXCI6IDEyNywgXCJnXCI6IDI1NSwgXCJiXCI6IDIxMiwgXCJoXCI6IDAuNDQ0MDEwNDE2NjY2NjY2NywgXCJzXCI6IDEsIFwibFwiOiAwLjc0OTAxOTYwNzg0MzEzNzMsIFwiYVwiOiAxfSxcbiAgICBcImF6dXJlXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMC41LCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwiYmVpZ2VcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMjAsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMC41NTU1NTU1NTU1NTU1NTYsIFwibFwiOiAwLjkxMTc2NDcwNTg4MjM1MywgXCJhXCI6IDF9LFxuICAgIFwiYmlzcXVlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMTk2LCBcImhcIjogMC4wOTAzOTU0ODAyMjU5ODg3MSwgXCJzXCI6IDEsIFwibFwiOiAwLjg4NDMxMzcyNTQ5MDE5NiwgXCJhXCI6IDF9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzUsIFwiYlwiOiAyMDUsIFwiaFwiOiAwLjA5OTk5OTk5OTk5OTk5OTk0LCBcInNcIjogMSwgXCJsXCI6IDAuOTAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwiYmx1ZXZpb2xldFwiOiB7XCJyXCI6IDEzOCwgXCJnXCI6IDQzLCBcImJcIjogMjI2LCBcImhcIjogMC43NTMxODc2MTM4NDMzNTE0LCBcInNcIjogMC43NTkzMzYwOTk1ODUwNjIxLCBcImxcIjogMC41Mjc0NTA5ODAzOTIxNTY5LCBcImFcIjogMX0sXG4gICAgXCJicm93blwiOiB7XCJyXCI6IDE2NSwgXCJnXCI6IDQyLCBcImJcIjogNDIsIFwiaFwiOiAwLCBcInNcIjogMC41OTQyMDI4OTg1NTA3MjQ3LCBcImxcIjogMC40MDU4ODIzNTI5NDExNzY0NywgXCJhXCI6IDF9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcInJcIjogMjIyLCBcImdcIjogMTg0LCBcImJcIjogMTM1LCBcImhcIjogMC4wOTM4Njk3MzE4MDA3NjYyNiwgXCJzXCI6IDAuNTY4NjI3NDUwOTgwMzkyMiwgXCJsXCI6IDAuNywgXCJhXCI6IDF9LFxuICAgIFwiY2FkZXRibHVlXCI6IHtcInJcIjogOTUsIFwiZ1wiOiAxNTgsIFwiYlwiOiAxNjAsIFwiaFwiOiAwLjUwNTEyODIwNTEyODIwNTEsIFwic1wiOiAwLjI1NDkwMTk2MDc4NDMxMzcsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImNoYXJ0cmV1c2VcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogMC4yNTAzMjY3OTczODU2MjA5LCBcInNcIjogMSwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9LFxuICAgIFwiY2hvY29sYXRlXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTA1LCBcImJcIjogMzAsIFwiaFwiOiAwLjA2OTQ0NDQ0NDQ0NDQ0NDQzLCBcInNcIjogMC43NDk5OTk5OTk5OTk5OTk5LCBcImxcIjogMC40NzA1ODgyMzUyOTQxMTc2NCwgXCJhXCI6IDF9LFxuICAgIFwiY29yYWxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxMjcsIFwiYlwiOiA4MCwgXCJoXCI6IDAuMDQ0NzYxOTA0NzYxOTA0NzYsIFwic1wiOiAxLCBcImxcIjogMC42NTY4NjI3NDUwOTgwMzkyLCBcImFcIjogMX0sXG4gICAgXCJjb3JuZmxvd2VyYmx1ZVwiOiB7XCJyXCI6IDEwMCwgXCJnXCI6IDE0OSwgXCJiXCI6IDIzNywgXCJoXCI6IDAuNjA3MDU1OTYxMDcwNTU5NiwgXCJzXCI6IDAuNzkxOTA3NTE0NDUwODY3MiwgXCJsXCI6IDAuNjYwNzg0MzEzNzI1NDkwMiwgXCJhXCI6IDF9LFxuICAgIFwiY29ybnNpbGtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyMjAsIFwiaFwiOiAwLjEzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAxLCBcImxcIjogMC45MzEzNzI1NDkwMTk2MDc5LCBcImFcIjogMX0sXG4gICAgXCJjcmltc29uXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjAsIFwiYlwiOiA2MCwgXCJoXCI6IDAuOTY2NjY2NjY2NjY2NjY2NywgXCJzXCI6IDAuODMzMzMzMzMzMzMzMzMzNSwgXCJsXCI6IDAuNDcwNTg4MjM1Mjk0MTE3NjQsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC4yNzI1NDkwMTk2MDc4NDMxLCBcImFcIjogMX0sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMzksIFwiYlwiOiAxMzksIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC4yNzI1NDkwMTk2MDc4NDMxLCBcImFcIjogMX0sXG4gICAgXCJkYXJrZ29sZGVucm9kXCI6IHtcInJcIjogMTg0LCBcImdcIjogMTM0LCBcImJcIjogMTEsIFwiaFwiOiAwLjExODQ5NzEwOTgyNjU4OTYsIFwic1wiOiAwLjg4NzE3OTQ4NzE3OTQ4NzIsIFwibFwiOiAwLjM4MjM1Mjk0MTE3NjQ3MDU2LCBcImFcIjogMX0sXG4gICAgXCJkYXJrZ3JheVwiOiB7IFwiclwiOiAxNjksIFwiZ1wiOiAxNjksIFwiYlwiOiAxNjksIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuNjYyNzQ1MDk4MDM5MjE1NywgXCJhXCI6IDF9LFxuICAgIFwiZGFya2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEwMCwgXCJiXCI6IDAsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAxLCBcImxcIjogMC4xOTYwNzg0MzEzNzI1NDkwMiwgXCJhXCI6IDF9LFxuICAgIFwiZGFya2dyZXlcIjogeyBcInJcIjogMTY5LCBcImdcIjogMTY5LCBcImJcIjogMTY5LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjY2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtraGFraVwiOiB7XCJyXCI6IDE4OSwgXCJnXCI6IDE4MywgXCJiXCI6IDEwNywgXCJoXCI6IDAuMTU0NDcxNTQ0NzE1NDQ3MTMsIFwic1wiOiAwLjM4MzE3NzU3MDA5MzQ1ODA0LCBcImxcIjogMC41ODAzOTIxNTY4NjI3NDUxLCBcImFcIjogMX0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDAsIFwiYlwiOiAxMzksIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAxLCBcImxcIjogMC4yNzI1NDkwMTk2MDc4NDMxLCBcImFcIjogMX0sXG4gICAgXCJkYXJrb2xpdmVncmVlblwiOiB7XCJyXCI6IDg1LCBcImdcIjogMTA3LCBcImJcIjogNDcsIFwiaFwiOiAwLjIyNzc3Nzc3Nzc3Nzc3Nzc3LCBcInNcIjogMC4zODk2MTAzODk2MTAzODk2LCBcImxcIjogMC4zMDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTQwLCBcImJcIjogMCwgXCJoXCI6IDAuMDkxNTAzMjY3OTczODU2MjIsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJkYXJrb3JjaGlkXCI6IHtcInJcIjogMTUzLCBcImdcIjogNTAsIFwiYlwiOiAyMDQsIFwiaFwiOiAwLjc3ODEzODUyODEzODUyODEsIFwic1wiOiAwLjYwNjI5OTIxMjU5ODQyNTIsIFwibFwiOiAwLjQ5ODAzOTIxNTY4NjI3NDUsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtyZWRcIjoge1wiclwiOiAxMzksIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxLCBcImxcIjogMC4yNzI1NDkwMTk2MDc4NDMxLCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2FsbW9uXCI6IHtcInJcIjogMjMzLCBcImdcIjogMTUwLCBcImJcIjogMTIyLCBcImhcIjogMC4wNDIwNDIwNDIwNDIwNDIwNCwgXCJzXCI6IDAuNzE2MTI5MDMyMjU4MDY0MywgXCJsXCI6IDAuNjk2MDc4NDMxMzcyNTQ5LCBcImFcIjogMX0sXG4gICAgXCJkYXJrc2VhZ3JlZW5cIjoge1wiclwiOiAxNDMsIFwiZ1wiOiAxODgsIFwiYlwiOiAxNDMsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjI1MTM5NjY0ODA0NDY5MjgsIFwibFwiOiAwLjY0OTAxOTYwNzg0MzEzNzMsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiclwiOiA3MiwgXCJnXCI6IDYxLCBcImJcIjogMTM5LCBcImhcIjogMC42OTAxNzA5NDAxNzA5NCwgXCJzXCI6IDAuMzg5OTk5OTk5OTk5OTk5OSwgXCJsXCI6IDAuMzkyMTU2ODYyNzQ1MDk4MDMsIFwiYVwiOiAxfSxcbiAgICBcImRhcmtzbGF0ZWdyYXlcIjoge1wiclwiOiA0NywgXCJnXCI6IDc5LCBcImJcIjogNzksIFwiaFwiOiAwLjUsIFwic1wiOiAwLjI1Mzk2ODI1Mzk2ODI1Mzk1LCBcImxcIjogMC4yNDcwNTg4MjM1Mjk0MTE3OCwgXCJhXCI6IDF9LFxuICAgIFwiZGFya3NsYXRlZ3JleVwiOiB7XCJyXCI6IDQ3LCBcImdcIjogNzksIFwiYlwiOiA3OSwgXCJoXCI6IDAuNSwgXCJzXCI6IDAuMjUzOTY4MjUzOTY4MjUzOTUsIFwibFwiOiAwLjI0NzA1ODgyMzUyOTQxMTc4LCBcImFcIjogMX0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcInJcIjogMCwgXCJnXCI6IDIwNiwgXCJiXCI6IDIwOSwgXCJoXCI6IDAuNTAyMzkyMzQ0NDk3NjA3NiwgXCJzXCI6IDEsIFwibFwiOiAwLjQwOTgwMzkyMTU2ODYyNzQ0LCBcImFcIjogMX0sXG4gICAgXCJkYXJrdmlvbGV0XCI6IHtcInJcIjogMTQ4LCBcImdcIjogMCwgXCJiXCI6IDIxMSwgXCJoXCI6IDAuNzgzNTcwMzAwMTU3OTc3OCwgXCJzXCI6IDEsIFwibFwiOiAwLjQxMzcyNTQ5MDE5NjA3ODQsIFwiYVwiOiAxfSxcbiAgICBcImRlZXBwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjAsIFwiYlwiOiAxNDcsIFwiaFwiOiAwLjkwOTkyOTA3ODAxNDE4NDQsIFwic1wiOiAxLCBcImxcIjogMC41MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJkZWVwc2t5Ymx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxOTEsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjU0MTgzMDA2NTM1OTQ3NzEsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJkaW1ncmF5XCI6IHsgXCJyXCI6IDEwNSwgXCJnXCI6IDEwNSwgXCJiXCI6IDEwNSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC40MTE3NjQ3MDU4ODIzNTI5LCBcImFcIjogMX0sXG4gICAgXCJkaW1ncmV5XCI6IHsgXCJyXCI6IDEwNSwgXCJnXCI6IDEwNSwgXCJiXCI6IDEwNSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC40MTE3NjQ3MDU4ODIzNTI5LCBcImFcIjogMX0sXG4gICAgXCJkb2RnZXJibHVlXCI6IHtcInJcIjogMzAsIFwiZ1wiOiAxNDQsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjU4MjIyMjIyMjIyMjIyMjIsIFwic1wiOiAxLCBcImxcIjogMC41NTg4MjM1Mjk0MTE3NjQ3LCBcImFcIjogMX0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiclwiOiAxNzgsIFwiZ1wiOiAzNCwgXCJiXCI6IDM0LCBcImhcIjogMCwgXCJzXCI6IDAuNjc5MjQ1MjgzMDE4ODY4LCBcImxcIjogMC40MTU2ODYyNzQ1MDk4MDM5LCBcImFcIjogMX0sXG4gICAgXCJmbG9yYWx3aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI0MCwgXCJoXCI6IDAuMTExMTExMTExMTExMTExMDEsIFwic1wiOiAxLCBcImxcIjogMC45NzA1ODgyMzUyOTQxMTc2LCBcImFcIjogMX0sXG4gICAgXCJmb3Jlc3RncmVlblwiOiB7XCJyXCI6IDM0LCBcImdcIjogMTM5LCBcImJcIjogMzQsIFwiaFwiOiAwLjMzMzMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjYwNjkzNjQxNjE4NDk3MTIsIFwibFwiOiAwLjMzOTIxNTY4NjI3NDUwOTc2LCBcImFcIjogMX0sXG4gICAgXCJnYWluc2Jvcm9cIjogeyBcInJcIjogMjIwLCBcImdcIjogMjIwLCBcImJcIjogMjIwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjg2Mjc0NTA5ODAzOTIxNTcsIFwiYVwiOiAxfSxcbiAgICBcImdob3N0d2hpdGVcIjoge1wiclwiOiAyNDgsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC45ODYyNzQ1MDk4MDM5MjE2LCBcImFcIjogMX0sXG4gICAgXCJnb2xkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE1LCBcImJcIjogMCwgXCJoXCI6IDAuMTQwNTIyODc1ODE2OTkzNDYsIFwic1wiOiAxLCBcImxcIjogMC41LCBcImFcIjogMX0sXG4gICAgXCJnb2xkZW5yb2RcIjoge1wiclwiOiAyMTgsIFwiZ1wiOiAxNjUsIFwiYlwiOiAzMiwgXCJoXCI6IDAuMTE5MTc1NjI3MjQwMTQzMzcsIFwic1wiOiAwLjc0NCwgXCJsXCI6IDAuNDkwMTk2MDc4NDMxMzcyNTMsIFwiYVwiOiAxfSxcbiAgICBcImdyZWVueWVsbG93XCI6IHtcInJcIjogMTczLCBcImdcIjogMjU1LCBcImJcIjogNDcsIFwiaFwiOiAwLjIzMjM3MTc5NDg3MTc5NDg1LCBcInNcIjogMSwgXCJsXCI6IDAuNTkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJncmV5XCI6IHsgXCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMC41MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJob25leWRld1wiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI0MCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImhvdHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxODAsIFwiaFwiOiAwLjkxNjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC43MDU4ODIzNTI5NDExNzY0LCBcImFcIjogMX0sXG4gICAgXCJpbmRpYW5yZWRcIjoge1wiclwiOiAyMDUsIFwiZ1wiOiA5MiwgXCJiXCI6IDkyLCBcImhcIjogMCwgXCJzXCI6IDAuNTMwNTE2NDMxOTI0ODgyNywgXCJsXCI6IDAuNTgyMzUyOTQxMTc2NDcwNiwgXCJhXCI6IDF9LFxuICAgIFwiaW5kaWdvXCI6IHtcInJcIjogNzUsIFwiZ1wiOiAwLCBcImJcIjogMTMwLCBcImhcIjogMC43NjI4MjA1MTI4MjA1MTI4LCBcInNcIjogMSwgXCJsXCI6IDAuMjU0OTAxOTYwNzg0MzEzNywgXCJhXCI6IDF9LFxuICAgIFwiaXZvcnlcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiAwLjE2NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuOTcwNTg4MjM1Mjk0MTE3NiwgXCJhXCI6IDF9LFxuICAgIFwia2hha2lcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyMzAsIFwiYlwiOiAxNDAsIFwiaFwiOiAwLjE1LCBcInNcIjogMC43NjkyMzA3NjkyMzA3NjkyLCBcImxcIjogMC43NDUwOTgwMzkyMTU2ODYzLCBcImFcIjogMX0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJyXCI6IDIzMCwgXCJnXCI6IDIzMCwgXCJiXCI6IDI1MCwgXCJoXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJzXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJsXCI6IDAuOTQxMTc2NDcwNTg4MjM1MywgXCJhXCI6IDF9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0MCwgXCJiXCI6IDI0NSwgXCJoXCI6IDAuOTQ0NDQ0NDQ0NDQ0NDQ0MywgXCJzXCI6IDEsIFwibFwiOiAwLjk3MDU4ODIzNTI5NDExNzYsIFwiYVwiOiAxfSxcbiAgICBcImxhd25ncmVlblwiOiB7XCJyXCI6IDEyNCwgXCJnXCI6IDI1MiwgXCJiXCI6IDAsIFwiaFwiOiAwLjI1MTMyMjc1MTMyMjc1MTM0LCBcInNcIjogMSwgXCJsXCI6IDAuNDk0MTE3NjQ3MDU4ODIzNTUsIFwiYVwiOiAxfSxcbiAgICBcImxlbW9uY2hpZmZvblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDIwNSwgXCJoXCI6IDAuMTQ5OTk5OTk5OTk5OTk5OTcsIFwic1wiOiAxLCBcImxcIjogMC45MDE5NjA3ODQzMTM3MjU1LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGJsdWVcIjoge1wiclwiOiAxNzMsIFwiZ1wiOiAyMTYsIFwiYlwiOiAyMzAsIFwiaFwiOiAwLjU0MDkzNTY3MjUxNDYxOTgsIFwic1wiOiAwLjUzMjcxMDI4MDM3MzgzMTYsIFwibFwiOiAwLjc5MDE5NjA3ODQzMTM3MjYsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Y29yYWxcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMC43ODg3MzIzOTQzNjYxOTcxLCBcImxcIjogMC43MjE1Njg2Mjc0NTA5ODA0LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGN5YW5cIjoge1wiclwiOiAyMjQsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLjUsIFwic1wiOiAxLCBcImxcIjogMC45MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI1MCwgXCJiXCI6IDIxMCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAwLjgwMDAwMDAwMDAwMDAwMDIsIFwibFwiOiAwLjkwMTk2MDc4NDMxMzcyNTQsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7IFwiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuODI3NDUwOTgwMzkyMTU2OCwgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJyXCI6IDE0NCwgXCJnXCI6IDIzOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuNzM0Mzc1LCBcImxcIjogMC43NDkwMTk2MDc4NDMxMzczLCBcImFcIjogMX0sXG4gICAgXCJsaWdodGdyZXlcIjogeyBcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwLjgyNzQ1MDk4MDM5MjE1NjgsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE4MiwgXCJiXCI6IDE5MywgXCJoXCI6IDAuOTc0ODg1ODQ0NzQ4ODU4NCwgXCJzXCI6IDEsIFwibFwiOiAwLjg1Njg2Mjc0NTA5ODAzOTMsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTYwLCBcImJcIjogMTIyLCBcImhcIjogMC4wNDc2MTkwNDc2MTkwNDc1OTYsIFwic1wiOiAxLCBcImxcIjogMC43MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcInJcIjogMzIsIFwiZ1wiOiAxNzgsIFwiYlwiOiAxNzAsIFwiaFwiOiAwLjQ5MDg2NzU3OTkwODY3NTc0LCBcInNcIjogMC42OTUyMzgwOTUyMzgwOTUyLCBcImxcIjogMC40MTE3NjQ3MDU4ODIzNTI5LCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyNTAsIFwiaFwiOiAwLjU2Mzc2ODExNTk0MjAyODksIFwic1wiOiAwLjkyLCBcImxcIjogMC43NTQ5MDE5NjA3ODQzMTM3LCBcImFcIjogMX0sXG4gICAgXCJsaWdodHNsYXRlZ3JheVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDAuNTgzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuMTQyODU3MTQyODU3MTQyODUsIFwibFwiOiAwLjUzMzMzMzMzMzMzMzMzMzMsIFwiYVwiOiAxfSxcbiAgICBcImxpZ2h0c2xhdGVncmV5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMC41ODMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC4xNDI4NTcxNDI4NTcxNDI4NSwgXCJsXCI6IDAuNTMzMzMzMzMzMzMzMzMzMywgXCJhXCI6IDF9LFxuICAgIFwibGlnaHRzdGVlbGJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAxOTYsIFwiYlwiOiAyMjIsIFwiaFwiOiAwLjU5NDIwMjg5ODU1MDcyNDYsIFwic1wiOiAwLjQxMDcxNDI4NTcxNDI4NTc1LCBcImxcIjogMC43ODAzOTIxNTY4NjI3NDUxLCBcImFcIjogMX0sXG4gICAgXCJsaWdodHllbGxvd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDIyNCwgXCJoXCI6IDAuMTY2NjY2NjY2NjY2NjY2NjYsIFwic1wiOiAxLCBcImxcIjogMC45MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJsaW1lZ3JlZW5cIjoge1wiclwiOiA1MCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogMC4zMzMzMzMzMzMzMzMzMzMzLCBcInNcIjogMC42MDc4NDMxMzcyNTQ5MDIsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcImxpbmVuXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjQwLCBcImJcIjogMjMwLCBcImhcIjogMC4wODMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuNjY2NjY2NjY2NjY2NjY2NiwgXCJsXCI6IDAuOTQxMTc2NDcwNTg4MjM1MywgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtYXF1YW1hcmluZVwiOiB7XCJyXCI6IDEwMiwgXCJnXCI6IDIwNSwgXCJiXCI6IDE3MCwgXCJoXCI6IDAuNDQzMzY1Njk1NzkyODgwMiwgXCJzXCI6IDAuNTA3Mzg5MTYyNTYxNTc2NCwgXCJsXCI6IDAuNjAxOTYwNzg0MzEzNzI1NiwgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjA1LCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMSwgXCJsXCI6IDAuNDAxOTYwNzg0MzEzNzI1NSwgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtb3JjaGlkXCI6IHtcInJcIjogMTg2LCBcImdcIjogODUsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLjgwMDI2NDU1MDI2NDU1MDIsIFwic1wiOiAwLjU4ODc4NTA0NjcyODk3MTgsIFwibFwiOiAwLjU4MDM5MjE1Njg2Mjc0NSwgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtcHVycGxlXCI6IHtcInJcIjogMTQ3LCBcImdcIjogMTEyLCBcImJcIjogMjE5LCBcImhcIjogMC43MjExODM4MDA2MjMwNTMsIFwic1wiOiAwLjU5Nzc2NTM2MzEyODQ5MTYsIFwibFwiOiAwLjY0OTAxOTYwNzg0MzEzNzIsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcInJcIjogNjAsIFwiZ1wiOiAxNzksIFwiYlwiOiAxMTMsIFwiaFwiOiAwLjQwNzU2MzAyNTIxMDA4NDEsIFwic1wiOiAwLjQ5NzkwNzk0OTc5MDc5NDk1LCBcImxcIjogMC40Njg2Mjc0NTA5ODAzOTIxNiwgXCJhXCI6IDF9LFxuICAgIFwibWVkaXVtc2xhdGVibHVlXCI6IHtcInJcIjogMTIzLCBcImdcIjogMTA0LCBcImJcIjogMjM4LCBcImhcIjogMC42OTAyOTg1MDc0NjI2ODY1LCBcInNcIjogMC43OTc2MTkwNDc2MTkwNDc3LCBcImxcIjogMC42NzA1ODgyMzUyOTQxMTc3LCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAxNTQsIFwiaFwiOiAwLjQzNiwgXCJzXCI6IDEsIFwibFwiOiAwLjQ5MDE5NjA3ODQzMTM3MjUzLCBcImFcIjogMX0sXG4gICAgXCJtZWRpdW10dXJxdW9pc2VcIjoge1wiclwiOiA3MiwgXCJnXCI6IDIwOSwgXCJiXCI6IDIwNCwgXCJoXCI6IDAuNDkzOTE3Mjc0OTM5MTcyNzYsIFwic1wiOiAwLjU5ODI1MzI3NTEwOTE3MDMsIFwibFwiOiAwLjU1MDk4MDM5MjE1Njg2MjgsIFwiYVwiOiAxfSxcbiAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiB7XCJyXCI6IDE5OSwgXCJnXCI6IDIxLCBcImJcIjogMTMzLCBcImhcIjogMC44OTUxMzEwODYxNDIzMjIxLCBcInNcIjogMC44MDkwOTA5MDkwOTA5MDksIFwibFwiOiAwLjQzMTM3MjU0OTAxOTYwNzg2LCBcImFcIjogMX0sXG4gICAgXCJtaWRuaWdodGJsdWVcIjoge1wiclwiOiAyNSwgXCJnXCI6IDI1LCBcImJcIjogMTEyLCBcImhcIjogMC42NjY2NjY2NjY2NjY2NjY2LCBcInNcIjogMC42MzUwMzY0OTYzNTAzNjUsIFwibFwiOiAwLjI2ODYyNzQ1MDk4MDM5MjE1LCBcImFcIjogMX0sXG4gICAgXCJtaW50Y3JlYW1cIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTAsIFwiaFwiOiAwLjQxNjY2NjY2NjY2NjY2NjQ2LCBcInNcIjogMSwgXCJsXCI6IDAuOTgwMzkyMTU2ODYyNzQ1MiwgXCJhXCI6IDF9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMjI1LCBcImhcIjogMC4wMTY2NjY2NjY2NjY2NjY3NTcsIFwic1wiOiAxLCBcImxcIjogMC45NDExNzY0NzA1ODgyMzUzLCBcImFcIjogMX0sXG4gICAgXCJtb2NjYXNpblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE4MSwgXCJoXCI6IDAuMTA1ODU1ODU1ODU1ODU1ODgsIFwic1wiOiAxLCBcImxcIjogMC44NTQ5MDE5NjA3ODQzMTM4LCBcImFcIjogMX0sXG4gICAgXCJuYXZham93aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3MywgXCJoXCI6IDAuMDk5NTkzNDk1OTM0OTU5MzYsIFwic1wiOiAxLCBcImxcIjogMC44MzkyMTU2ODYyNzQ1MDk4LCBcImFcIjogMX0sXG4gICAgXCJvbGRsYWNlXCI6IHtcInJcIjogMjUzLCBcImdcIjogMjQ1LCBcImJcIjogMjMwLCBcImhcIjogMC4xMDg2OTU2NTIxNzM5MTMwNCwgXCJzXCI6IDAuODUxODUxODUxODUxODUyMywgXCJsXCI6IDAuOTQ3MDU4ODIzNTI5NDExNywgXCJhXCI6IDF9LFxuICAgIFwib2xpdmVkcmFiXCI6IHtcInJcIjogMTA3LCBcImdcIjogMTQyLCBcImJcIjogMzUsIFwiaFwiOiAwLjIyMTE4MzgwMDYyMzA1Mjk2LCBcInNcIjogMC42MDQ1MTk3NzQwMTEyOTk0LCBcImxcIjogMC4zNDcwNTg4MjM1Mjk0MTE3NSwgXCJhXCI6IDF9LFxuICAgIFwib3JhbmdlcmVkXCI6IHtcInJcIjogMjU1LCBcImdcIjogNjksIFwiYlwiOiAwLCBcImhcIjogMC4wNDUwOTgwMzkyMTU2ODYyNiwgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcIm9yY2hpZFwiOiB7XCJyXCI6IDIxOCwgXCJnXCI6IDExMiwgXCJiXCI6IDIxNCwgXCJoXCI6IDAuODM5NjIyNjQxNTA5NDMzOSwgXCJzXCI6IDAuNTg4ODg4ODg4ODg4ODg4OSwgXCJsXCI6IDAuNjQ3MDU4ODIzNTI5NDExNywgXCJhXCI6IDF9LFxuICAgIFwicGFsZWdvbGRlbnJvZFwiOiB7XCJyXCI6IDIzOCwgXCJnXCI6IDIzMiwgXCJiXCI6IDE3MCwgXCJoXCI6IDAuMTUxOTYwNzg0MzEzNzI1NDgsIFwic1wiOiAwLjY2NjY2NjY2NjY2NjY2NjcsIFwibFwiOiAwLjgsIFwiYVwiOiAxfSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJyXCI6IDE1MiwgXCJnXCI6IDI1MSwgXCJiXCI6IDE1MiwgXCJoXCI6IDAuMzMzMzMzMzMzMzMzMzMzMywgXCJzXCI6IDAuOTI1MjMzNjQ0ODU5ODEzMSwgXCJsXCI6IDAuNzkwMTk2MDc4NDMxMzcyNSwgXCJhXCI6IDF9LFxuICAgIFwicGFsZXR1cnF1b2lzZVwiOiB7XCJyXCI6IDE3NSwgXCJnXCI6IDIzOCwgXCJiXCI6IDIzOCwgXCJoXCI6IDAuNSwgXCJzXCI6IDAuNjQ5NDg0NTM2MDgyNDc0MywgXCJsXCI6IDAuODA5ODAzOTIxNTY4NjI3NSwgXCJhXCI6IDF9LFxuICAgIFwicGFsZXZpb2xldHJlZFwiOiB7XCJyXCI6IDIxOSwgXCJnXCI6IDExMiwgXCJiXCI6IDE0NywgXCJoXCI6IDAuOTQ1NDgyODY2MDQzNjEzOCwgXCJzXCI6IDAuNTk3NzY1MzYzMTI4NDkxNiwgXCJsXCI6IDAuNjQ5MDE5NjA3ODQzMTM3MiwgXCJhXCI6IDF9LFxuICAgIFwicGFwYXlhd2hpcFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIzOSwgXCJiXCI6IDIxMywgXCJoXCI6IDAuMTAzMTc0NjAzMTc0NjAzMTUsIFwic1wiOiAxLCBcImxcIjogMC45MTc2NDcwNTg4MjM1Mjk1LCBcImFcIjogMX0sXG4gICAgXCJwZWFjaHB1ZmZcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMTgsIFwiYlwiOiAxODUsIFwiaFwiOiAwLjA3ODU3MTQyODU3MTQyODU2LCBcInNcIjogMSwgXCJsXCI6IDAuODYyNzQ1MDk4MDM5MjE1NywgXCJhXCI6IDF9LFxuICAgIFwicGVydVwiOiB7XCJyXCI6IDIwNSwgXCJnXCI6IDEzMywgXCJiXCI6IDYzLCBcImhcIjogMC4wODIxNTk2MjQ0MTMxNDU1NSwgXCJzXCI6IDAuNTg2Nzc2ODU5NTA0MTMyMywgXCJsXCI6IDAuNTI1NDkwMTk2MDc4NDMxNCwgXCJhXCI6IDF9LFxuICAgIFwicGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE5MiwgXCJiXCI6IDIwMywgXCJoXCI6IDAuOTcwODk5NDcwODk5NDcwOSwgXCJzXCI6IDEsIFwibFwiOiAwLjg3NjQ3MDU4ODIzNTI5NDEsIFwiYVwiOiAxfSxcbiAgICBcInBsdW1cIjoge1wiclwiOiAyMjEsIFwiZ1wiOiAxNjAsIFwiYlwiOiAyMjEsIFwiaFwiOiAwLjgzMzMzMzMzMzMzMzMzMzQsIFwic1wiOiAwLjQ3Mjg2ODIxNzA1NDI2MzcsIFwibFwiOiAwLjc0NzA1ODgyMzUyOTQxMTgsIFwiYVwiOiAxfSxcbiAgICBcInBvd2RlcmJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMzAsIFwiaFwiOiAwLjUxODUxODUxODUxODUxODYsIFwic1wiOiAwLjUxOTIzMDc2OTIzMDc2OTIsIFwibFwiOiAwLjc5NjA3ODQzMTM3MjU0OTEsIFwiYVwiOiAxfSxcbiAgICBcInJvc3licm93blwiOiB7XCJyXCI6IDE4OCwgXCJnXCI6IDE0MywgXCJiXCI6IDE0MywgXCJoXCI6IDAsIFwic1wiOiAwLjI1MTM5NjY0ODA0NDY5MjgsIFwibFwiOiAwLjY0OTAxOTYwNzg0MzEzNzMsIFwiYVwiOiAxfSxcbiAgICBcInJveWFsYmx1ZVwiOiB7XCJyXCI6IDY1LCBcImdcIjogMTA1LCBcImJcIjogMjI1LCBcImhcIjogMC42MjUsIFwic1wiOiAwLjcyNzI3MjcyNzI3MjcyNzIsIFwibFwiOiAwLjU2ODYyNzQ1MDk4MDM5MjEsIFwiYVwiOiAxfSxcbiAgICBcInNhZGRsZWJyb3duXCI6IHtcInJcIjogMTM5LCBcImdcIjogNjksIFwiYlwiOiAxOSwgXCJoXCI6IDAuMDY5NDQ0NDQ0NDQ0NDQ0NDMsIFwic1wiOiAwLjc1OTQ5MzY3MDg4NjA3NiwgXCJsXCI6IDAuMzA5ODAzOTIxNTY4NjI3NCwgXCJhXCI6IDF9LFxuICAgIFwic2FsbW9uXCI6IHtcInJcIjogMjUwLCBcImdcIjogMTI4LCBcImJcIjogMTE0LCBcImhcIjogMC4wMTcxNTY4NjI3NDUwOTgwMTYsIFwic1wiOiAwLjkzMTUwNjg0OTMxNTA2ODMsIFwibFwiOiAwLjcxMzcyNTQ5MDE5NjA3ODQsIFwiYVwiOiAxfSxcbiAgICBcInNhbmR5YnJvd25cIjoge1wiclwiOiAyNDQsIFwiZ1wiOiAxNjQsIFwiYlwiOiA5NiwgXCJoXCI6IDAuMDc2NTc2NTc2NTc2NTc2NTksIFwic1wiOiAwLjg3MDU4ODIzNTI5NDExNzksIFwibFwiOiAwLjY2NjY2NjY2NjY2NjY2NjcsIFwiYVwiOiAxfSxcbiAgICBcInNlYWdyZWVuXCI6IHtcInJcIjogNDYsIFwiZ1wiOiAxMzksIFwiYlwiOiA4NywgXCJoXCI6IDAuNDA2ODEwMDM1ODQyMjkzOSwgXCJzXCI6IDAuNTAyNzAyNzAyNzAyNzAyNiwgXCJsXCI6IDAuMzYyNzQ1MDk4MDM5MjE1NywgXCJhXCI6IDF9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMzgsIFwiaFwiOiAwLjA2ODYyNzQ1MDk4MDM5MjIsIFwic1wiOiAxLCBcImxcIjogMC45NjY2NjY2NjY2NjY2NjY3LCBcImFcIjogMX0sXG4gICAgXCJzaWVubmFcIjoge1wiclwiOiAxNjAsIFwiZ1wiOiA4MiwgXCJiXCI6IDQ1LCBcImhcIjogMC4wNTM2MjMxODg0MDU3OTcxMDYsIFwic1wiOiAwLjU2MDk3NTYwOTc1NjA5NzUsIFwibFwiOiAwLjQwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcInNreWJsdWVcIjoge1wiclwiOiAxMzUsIFwiZ1wiOiAyMDYsIFwiYlwiOiAyMzUsIFwiaFwiOiAwLjU0ODMzMzMzMzMzMzMzMzMsIFwic1wiOiAwLjcxNDI4NTcxNDI4NTcxNCwgXCJsXCI6IDAuNzI1NDkwMTk2MDc4NDMxMywgXCJhXCI6IDF9LFxuICAgIFwic2xhdGVibHVlXCI6IHtcInJcIjogMTA2LCBcImdcIjogOTAsIFwiYlwiOiAyMDUsIFwiaFwiOiAwLjY4OTg1NTA3MjQ2Mzc2ODEsIFwic1wiOiAwLjUzNDg4MzcyMDkzMDIzMjYsIFwibFwiOiAwLjU3ODQzMTM3MjU0OTAxOTcsIFwiYVwiOiAxfSxcbiAgICBcInNsYXRlZ3JheVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDAuNTgzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuMTI1OTg0MjUxOTY4NTAzOTQsIFwibFwiOiAwLjUwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDAuNTgzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuMTI1OTg0MjUxOTY4NTAzOTQsIFwibFwiOiAwLjUwMTk2MDc4NDMxMzcyNTUsIFwiYVwiOiAxfSxcbiAgICBcInNub3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNTAsIFwiaFwiOiAwLCBcInNcIjogMSwgXCJsXCI6IDAuOTkwMTk2MDc4NDMxMzcyNiwgXCJhXCI6IDF9LFxuICAgIFwic3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMTI3LCBcImhcIjogMC40MTYzMzk4NjkyODEwNDU3NywgXCJzXCI6IDEsIFwibFwiOiAwLjUsIFwiYVwiOiAxfSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDcwLCBcImdcIjogMTMwLCBcImJcIjogMTgwLCBcImhcIjogMC41NzU3NTc1NzU3NTc1NzU4LCBcInNcIjogMC40NCwgXCJsXCI6IDAuNDkwMTk2MDc4NDMxMzcyNiwgXCJhXCI6IDF9LFxuICAgIFwidGFuXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTgwLCBcImJcIjogMTQwLCBcImhcIjogMC4wOTUyMzgwOTUyMzgwOTUyNywgXCJzXCI6IDAuNDM3NDk5OTk5OTk5OTk5OSwgXCJsXCI6IDAuNjg2Mjc0NTA5ODAzOTIxNiwgXCJhXCI6IDF9LFxuICAgIFwidGhpc3RsZVwiOiB7XCJyXCI6IDIxNiwgXCJnXCI6IDE5MSwgXCJiXCI6IDIxNiwgXCJoXCI6IDAuODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuMjQyNzE4NDQ2NjAxOTQxNzgsIFwibFwiOiAwLjc5ODAzOTIxNTY4NjI3NDYsIFwiYVwiOiAxfSxcbiAgICBcInRvbWF0b1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDk5LCBcImJcIjogNzEsIFwiaFwiOiAwLjAyNTM2MjMxODg0MDU3OTY5NCwgXCJzXCI6IDEsIFwibFwiOiAwLjYzOTIxNTY4NjI3NDUwOTgsIFwiYVwiOiAxfSxcbiAgICBcInR1cnF1b2lzZVwiOiB7XCJyXCI6IDY0LCBcImdcIjogMjI0LCBcImJcIjogMjA4LCBcImhcIjogMC40ODMzMzMzMzMzMzMzMzMzNCwgXCJzXCI6IDAuNzIwNzIwNzIwNzIwNzIwNywgXCJsXCI6IDAuNTY0NzA1ODgyMzUyOTQxMiwgXCJhXCI6IDF9LFxuICAgIFwidmlvbGV0XCI6IHtcInJcIjogMjM4LCBcImdcIjogMTMwLCBcImJcIjogMjM4LCBcImhcIjogMC44MzMzMzMzMzMzMzMzMzM0LCBcInNcIjogMC43NjA1NjMzODAyODE2OTAyLCBcImxcIjogMC43MjE1Njg2Mjc0NTA5ODA0LCBcImFcIjogMX0sXG4gICAgXCJ3aGVhdFwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3OSwgXCJoXCI6IDAuMTA4NTg1ODU4NTg1ODU4NiwgXCJzXCI6IDAuNzY3NDQxODYwNDY1MTE2OCwgXCJsXCI6IDAuODMxMzcyNTQ5MDE5NjA3OCwgXCJhXCI6IDF9LFxuICAgIFwid2hpdGVzbW9rZVwiOiB7IFwiclwiOiAyNDUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyNDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDAuOTYwNzg0MzEzNzI1NDkwMiwgXCJhXCI6IDF9LFxuICAgIFwieWVsbG93Z3JlZW5cIjoge1wiclwiOiAxNTQsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDAuMjIxNTA1Mzc2MzQ0MDg2MDQsIFwic1wiOiAwLjYwNzg0MzEzNzI1NDkwMiwgXCJsXCI6IDAuNSwgXCJhXCI6IDF9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yOyIsIi8qKiBcbiAqIEBjb25zdGFudFxuICogQHR5cGUge09iamVjdC48c3RyaW5nLCBudW1iZXI+fSBcbiAqL1xudmFyIEtFWUNPREVTID0ge1xuICAgICdiYWNrc3BhY2UnIDogOCxcbiAgICAndGFiJyA6IDksXG4gICAgJ2VudGVyJyA6IDEzLFxuICAgICdzaGlmdCcgOiAxNixcbiAgICAnY3RybCcgOiAxNyxcbiAgICAnYWx0JyA6IDE4LFxuICAgICdwYXVzZV9icmVhaycgOiAxOSxcbiAgICAnY2Fwc19sb2NrJyA6IDIwLFxuICAgICdlc2NhcGUnIDogMjcsXG4gICAgJ3BhZ2VfdXAnIDogMzMsXG4gICAgJ3BhZ2UgZG93bicgOiAzNCxcbiAgICAnZW5kJyA6IDM1LFxuICAgICdob21lJyA6IDM2LFxuICAgICdsZWZ0X2Fycm93JyA6IDM3LFxuICAgICd1cF9hcnJvdycgOiAzOCxcbiAgICAncmlnaHRfYXJyb3cnIDogMzksXG4gICAgJ2Rvd25fYXJyb3cnIDogNDAsXG4gICAgJ2luc2VydCcgOiA0NSxcbiAgICAnZGVsZXRlJyA6IDQ2LFxuICAgICcwJyA6IDQ4LFxuICAgICcxJyA6IDQ5LFxuICAgICcyJyA6IDUwLFxuICAgICczJyA6IDUxLFxuICAgICc0JyA6IDUyLFxuICAgICc1JyA6IDUzLFxuICAgICc2JyA6IDU0LFxuICAgICc3JyA6IDU1LFxuICAgICc4JyA6IDU2LFxuICAgICc5JyA6IDU3LFxuICAgICdhJyA6IDY1LFxuICAgICdiJyA6IDY2LFxuICAgICdjJyA6IDY3LFxuICAgICdkJyA6IDY4LFxuICAgICdlJyA6IDY5LFxuICAgICdmJyA6IDcwLFxuICAgICdnJyA6IDcxLFxuICAgICdoJyA6IDcyLFxuICAgICdpJyA6IDczLFxuICAgICdqJyA6IDc0LFxuICAgICdrJyA6IDc1LFxuICAgICdsJyA6IDc2LFxuICAgICdtJyA6IDc3LFxuICAgICduJyA6IDc4LFxuICAgICdvJyA6IDc5LFxuICAgICdwJyA6IDgwLFxuICAgICdxJyA6IDgxLFxuICAgICdyJyA6IDgyLFxuICAgICdzJyA6IDgzLFxuICAgICd0JyA6IDg0LFxuICAgICd1JyA6IDg1LFxuICAgICd2JyA6IDg2LFxuICAgICd3JyA6IDg3LFxuICAgICd4JyA6IDg4LFxuICAgICd5JyA6IDg5LFxuICAgICd6JyA6IDkwLFxuICAgICdsZWZ0X3dpbmRvdyBrZXknIDogOTEsXG4gICAgJ3JpZ2h0X3dpbmRvdyBrZXknIDogOTIsXG4gICAgJ3NlbGVjdF9rZXknIDogOTMsXG4gICAgJ251bXBhZCAwJyA6IDk2LFxuICAgICdudW1wYWQgMScgOiA5NyxcbiAgICAnbnVtcGFkIDInIDogOTgsXG4gICAgJ251bXBhZCAzJyA6IDk5LFxuICAgICdudW1wYWQgNCcgOiAxMDAsXG4gICAgJ251bXBhZCA1JyA6IDEwMSxcbiAgICAnbnVtcGFkIDYnIDogMTAyLFxuICAgICdudW1wYWQgNycgOiAxMDMsXG4gICAgJ251bXBhZCA4JyA6IDEwNCxcbiAgICAnbnVtcGFkIDknIDogMTA1LFxuICAgICdtdWx0aXBseScgOiAxMDYsXG4gICAgJ2FkZCcgOiAxMDcsXG4gICAgJ3N1YnRyYWN0JyA6IDEwOSxcbiAgICAnZGVjaW1hbCBwb2ludCcgOiAxMTAsXG4gICAgJ2RpdmlkZScgOiAxMTEsXG4gICAgJ2YxJyA6IDExMixcbiAgICAnZjInIDogMTEzLFxuICAgICdmMycgOiAxMTQsXG4gICAgJ2Y0JyA6IDExNSxcbiAgICAnZjUnIDogMTE2LFxuICAgICdmNicgOiAxMTcsXG4gICAgJ2Y3JyA6IDExOCxcbiAgICAnZjgnIDogMTE5LFxuICAgICdmOScgOiAxMjAsXG4gICAgJ2YxMCcgOiAxMjEsXG4gICAgJ2YxMScgOiAxMjIsXG4gICAgJ2YxMicgOiAxMjMsXG4gICAgJ251bV9sb2NrJyA6IDE0NCxcbiAgICAnc2Nyb2xsX2xvY2snIDogMTQ1LFxuICAgICdzZW1pX2NvbG9uJyA6IDE4NixcbiAgICAnZXF1YWxfc2lnbicgOiAxODcsXG4gICAgJ2NvbW1hJyA6IDE4OCxcbiAgICAnZGFzaCcgOiAxODksXG4gICAgJ3BlcmlvZCcgOiAxOTAsXG4gICAgJ2ZvcndhcmRfc2xhc2gnIDogMTkxLFxuICAgICdncmF2ZV9hY2NlbnQnIDogMTkyLFxuICAgICdvcGVuX2JyYWNrZXQnIDogMjE5LFxuICAgICdiYWNrc2xhc2gnIDogMjIwLFxuICAgICdjbG9zZWJyYWNrZXQnIDogMjIxLFxuICAgICdzaW5nbGVfcXVvdGUnIDogMjIyXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtFWUNPREVTOyIsInJlcXVpcmUoJy4vLi4vdGVzdHMvZGF0YS9jb2xvcnMuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZW5naW5lL2NhbWVyYS5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9lbmdpbmUvc2NlbmUuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC9mYWNlLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvbWF0cml4LmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL21hdGgvbWVzaC5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9tYXRoL3ZlY3Rvci5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy91dGlsaXR5L2NvbG9yLmpzJyk7XG4iLCJ2YXIgY29sb3JsaXN0ID0gW1wiQWxpY2VCbHVlXCIsIFwiQW50aXF1ZVdoaXRlXCIsIFwiQXF1YVwiLCBcIkFxdWFtYXJpbmVcIiwgXCJBenVyZVwiLCBcIkJlaWdlXCIsIFwiQmlzcXVlXCIsIFwiQmxhY2tcIiwgXCJCbGFuY2hlZEFsbW9uZFwiLCBcIkJsdWVcIiwgXCJCbHVlVmlvbGV0XCIsIFwiQnJvd25cIiwgXCJCdXJseVdvb2RcIiwgXCJDYWRldEJsdWVcIiwgXCJDaGFydHJldXNlXCIsIFwiQ2hvY29sYXRlXCIsIFwiQ29yYWxcIiwgXCJDb3JuZmxvd2VyQmx1ZVwiLCBcIkNvcm5zaWxrXCIsIFwiQ3JpbXNvblwiLCBcIkN5YW5cIiwgXCJEYXJrQmx1ZVwiLCBcIkRhcmtDeWFuXCIsIFwiRGFya0dvbGRlblJvZFwiLCBcIkRhcmtHcmF5XCIsIFwiRGFya0dyZXlcIiwgXCJEYXJrR3JlZW5cIiwgXCJEYXJrS2hha2lcIiwgXCJEYXJrTWFnZW50YVwiLCBcIkRhcmtPbGl2ZUdyZWVuXCIsIFwiRGFya29yYW5nZVwiLCBcIkRhcmtPcmNoaWRcIiwgXCJEYXJrUmVkXCIsIFwiRGFya1NhbG1vblwiLCBcIkRhcmtTZWFHcmVlblwiLCBcIkRhcmtTbGF0ZUJsdWVcIiwgXCJEYXJrU2xhdGVHcmF5XCIsIFwiRGFya1NsYXRlR3JleVwiLCBcIkRhcmtUdXJxdW9pc2VcIiwgXCJEYXJrVmlvbGV0XCIsIFwiRGVlcFBpbmtcIiwgXCJEZWVwU2t5Qmx1ZVwiLCBcIkRpbUdyYXlcIiwgXCJEaW1HcmV5XCIsIFwiRG9kZ2VyQmx1ZVwiLCBcIkZpcmVCcmlja1wiLCBcIkZsb3JhbFdoaXRlXCIsIFwiRm9yZXN0R3JlZW5cIiwgXCJGdWNoc2lhXCIsIFwiR2FpbnNib3JvXCIsIFwiR2hvc3RXaGl0ZVwiLCBcIkdvbGRcIiwgXCJHb2xkZW5Sb2RcIiwgXCJHcmF5XCIsIFwiR3JleVwiLCBcIkdyZWVuXCIsIFwiR3JlZW5ZZWxsb3dcIiwgXCJIb25leURld1wiLCBcIkhvdFBpbmtcIiwgXCJJbmRpYW5SZWRcIiwgXCJJbmRpZ29cIiwgXCJJdm9yeVwiLCBcIktoYWtpXCIsIFwiTGF2ZW5kZXJcIiwgXCJMYXZlbmRlckJsdXNoXCIsIFwiTGF3bkdyZWVuXCIsIFwiTGVtb25DaGlmZm9uXCIsIFwiTGlnaHRCbHVlXCIsIFwiTGlnaHRDb3JhbFwiLCBcIkxpZ2h0Q3lhblwiLCBcIkxpZ2h0R29sZGVuUm9kWWVsbG93XCIsIFwiTGlnaHRHcmF5XCIsIFwiTGlnaHRHcmV5XCIsIFwiTGlnaHRHcmVlblwiLCBcIkxpZ2h0UGlua1wiLCBcIkxpZ2h0U2FsbW9uXCIsIFwiTGlnaHRTZWFHcmVlblwiLCBcIkxpZ2h0U2t5Qmx1ZVwiLCBcIkxpZ2h0U2xhdGVHcmF5XCIsIFwiTGlnaHRTbGF0ZUdyZXlcIiwgXCJMaWdodFN0ZWVsQmx1ZVwiLCBcIkxpZ2h0WWVsbG93XCIsIFwiTGltZVwiLCBcIkxpbWVHcmVlblwiLCBcIkxpbmVuXCIsIFwiTWFnZW50YVwiLCBcIk1hcm9vblwiLCBcIk1lZGl1bUFxdWFNYXJpbmVcIiwgXCJNZWRpdW1CbHVlXCIsIFwiTWVkaXVtT3JjaGlkXCIsIFwiTWVkaXVtUHVycGxlXCIsIFwiTWVkaXVtU2VhR3JlZW5cIiwgXCJNZWRpdW1TbGF0ZUJsdWVcIiwgXCJNZWRpdW1TcHJpbmdHcmVlblwiLCBcIk1lZGl1bVR1cnF1b2lzZVwiLCBcIk1lZGl1bVZpb2xldFJlZFwiLCBcIk1pZG5pZ2h0Qmx1ZVwiLCBcIk1pbnRDcmVhbVwiLCBcIk1pc3R5Um9zZVwiLCBcIk1vY2Nhc2luXCIsIFwiTmF2YWpvV2hpdGVcIiwgXCJOYXZ5XCIsIFwiT2xkTGFjZVwiLCBcIk9saXZlXCIsIFwiT2xpdmVEcmFiXCIsIFwiT3JhbmdlXCIsIFwiT3JhbmdlUmVkXCIsIFwiT3JjaGlkXCIsIFwiUGFsZUdvbGRlblJvZFwiLCBcIlBhbGVHcmVlblwiLCBcIlBhbGVUdXJxdW9pc2VcIiwgXCJQYWxlVmlvbGV0UmVkXCIsIFwiUGFwYXlhV2hpcFwiLCBcIlBlYWNoUHVmZlwiLCBcIlBlcnVcIiwgXCJQaW5rXCIsIFwiUGx1bVwiLCBcIlBvd2RlckJsdWVcIiwgXCJQdXJwbGVcIiwgXCJSZWRcIiwgXCJSb3N5QnJvd25cIiwgXCJSb3lhbEJsdWVcIiwgXCJTYWRkbGVCcm93blwiLCBcIlNhbG1vblwiLCBcIlNhbmR5QnJvd25cIiwgXCJTZWFHcmVlblwiLCBcIlNlYVNoZWxsXCIsIFwiU2llbm5hXCIsIFwiU2lsdmVyXCIsIFwiU2t5Qmx1ZVwiLCBcIlNsYXRlQmx1ZVwiLCBcIlNsYXRlR3JheVwiLCBcIlNsYXRlR3JleVwiLCBcIlNub3dcIiwgXCJTcHJpbmdHcmVlblwiLCBcIlN0ZWVsQmx1ZVwiLCBcIlRhblwiLCBcIlRlYWxcIiwgXCJUaGlzdGxlXCIsIFwiVG9tYXRvXCIsIFwiVHVycXVvaXNlXCIsIFwiVmlvbGV0XCIsIFwiV2hlYXRcIiwgXCJXaGl0ZVwiLCBcIldoaXRlU21va2VcIiwgXCJZZWxsb3dcIiwgXCJZZWxsb3dHcmVlblwiXTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb2xvcmxpc3Q7IiwidmFyIENhbWVyYSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9lbmdpbmUvY2FtZXJhLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NhbWVyYScsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNhbWVyYTtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICBjYW1lcmEgPSBuZXcgQ2FtZXJhKDYwMCwgNDAwKTtcbiAgICB9KVxuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnaGVpZ2h0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhjYW1lcmEuaGVpZ2h0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChjYW1lcmEuaGVpZ2h0LCA0MDApO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG5cbiAgICB9KTtcbn0pOyIsInZhciBTY2VuZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9lbmdpbmUvc2NlbmUuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnU2NlbmUnLCBmdW5jdGlvbigpe1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vdmFyIHNjZW5lID0gbmV3IFNjZW5lKHtjYW52YXNfaWQ6ICd3aXJlZnJhbWUnLCB3aWR0aDo2MDAsIGhlaWdodDo0MDB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2hlaWdodCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBhc3NlcnQuZXF1YWwoc2NlbmUuaGVpZ2h0LCA0MDApO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIFxuICAgIH0pXG59KTsiLCJ2YXIgRmFjZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL2ZhY2UuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG52YXIgZmFjZTtcblxuc3VpdGUoJ0ZhY2UnLCBmdW5jdGlvbigpe1xuICAgIHZhciBmYWNlO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGZhY2UgPSBuZXcgRmFjZSgwLCAxLCAyLCBcInJlZFwiKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmYWNlLmNvbG9yLnJnYi5yLCAyNTUpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG5cbiAgICB9KTtcbn0pOyIsInZhciBNYXRyaXggPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9tYXRyaXguanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnTWF0cml4JywgZnVuY3Rpb24oKXtcbiAgICB2YXIgemVybywgemVybzIsIGlkZW50aXR5LCBpZGVudGl0eTIsIG9uZXMsIG0wLCBtMSwgbTIsIG0zLCBtNCwgbTU7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgemVybyA9IE1hdHJpeC56ZXJvKCk7XG4gICAgICAgIGlkZW50aXR5ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgIHplcm8yID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBpZGVudGl0eTIgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIGlkZW50aXR5MlswXSA9IDE7XG4gICAgICAgIGlkZW50aXR5Mls1XSA9IDE7XG4gICAgICAgIGlkZW50aXR5MlsxMF0gPSAxO1xuICAgICAgICBpZGVudGl0eTJbMTVdID0gMTtcbiAgICAgICAgb25lcyA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTAgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0xID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMiA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTMgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG00ID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtNSA9IE1hdHJpeC5mcm9tQXJyYXkoWzAsIDEsIDEsIDIsIDMsIDUsIDgsIDEzLCAyMSwgMzQsIDU1LCA4OSwgMTQ0LCAyMzMsIDM3NywgNjEwXSk7XG4gICAgICAgIG00WzBdID0gMDtcbiAgICAgICAgbTRbMV0gPSAxO1xuICAgICAgICBtNFsyXSA9IDE7XG4gICAgICAgIG00WzNdID0gMjtcbiAgICAgICAgbTRbNF0gPSAzO1xuICAgICAgICBtNFs1XSA9IDU7XG4gICAgICAgIG00WzZdID0gODtcbiAgICAgICAgbTRbN10gPSAxMztcbiAgICAgICAgbTRbOF0gPSAyMTtcbiAgICAgICAgbTRbOV0gPSAzNDtcbiAgICAgICAgbTRbMTBdID0gNTU7XG4gICAgICAgIG00WzExXSA9IDg5O1xuICAgICAgICBtNFsxMl0gPSAxNDQ7XG4gICAgICAgIG00WzEzXSA9IDIzMztcbiAgICAgICAgbTRbMTRdID0gMzc3O1xuICAgICAgICBtNFsxNV0gPSA2MTA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICBvbmVzW2ldID0gMTtcbiAgICAgICAgICAgIG0wW2ldID0gaTtcbiAgICAgICAgICAgIG0xW2ldID0gaSsxO1xuICAgICAgICAgICAgbTJbaV0gPSBpKzI7XG4gICAgICAgICAgICBtM1tpXSA9IGkqMjtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbGVuZ3RoJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh6ZXJvLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5Lmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHplcm8yLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5Mi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtMS5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtMi5sZW5ndGgsIDE2KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtMy5sZW5ndGgsIDE2KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdlcXVhbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFpZGVudGl0eS5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobTQuZXF1YWwobTUpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghbTAuZXF1YWwobTEpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FkZCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB6ZXJvLmFkZChtMSk7XG4gICAgICAgICAgICB2YXIgdDIgPSBtMC5hZGQob25lcyk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwobTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChtMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy92YXIgdDEgPSAwO1xuICAgICAgICAgICAgdmFyIHQyID0gbTEuc3VidHJhY3Qob25lcyk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwobTApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5U2NhbGFyJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc3Bvc2UnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvblonLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbkF4aXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zbGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdpZGVudGl0eScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3plcm8nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdmcm9tQXJyYXknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7IiwidmFyIE1lc2ggPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC9tZXNoLmpzJyk7XG52YXIgRmFjZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL2ZhY2UuanMnKTtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0aC92ZWN0b3IuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnTWVzaCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG1lc2g7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgbWVzaCA9IG5ldyBNZXNoKCd0cmlhbmdsZScsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigxLDAsMCksXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigwLDEsMCksXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigwLDAsMSlcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbmV3IEZhY2UoMCwgMSwgMiwgJ3JlZCcpXG4gICAgICAgICAgICBdKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ25hbWUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG1lc2gubmFtZSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5uYW1lLCAndHJpYW5nbGUnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3ZlcnRpY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZmFjZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdwb3NpdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnZnJvbUpTT04nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYXRoL3ZlY3Rvci5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdWZWN0b3InLCBmdW5jdGlvbigpe1xuICAgIHZhciBvcmlnaW4sIHZlY3RvcjEsIHZlY3RvcjIsIHZlY3RvcjMsIHZlY3RvcjQsIHZlY3RvcjUsIHZlY3RvcngsIHZlY3RvcnksIHZlY3Rvcno7XG4gICAgdmFyIHZlY3RvcjEwMHgsIHZlY3RvcjIwMHksIHZlY3RvcjMwMHosIHZlY3RvcjEyMywgdmVjdG9yMTEyO1xuICAgIHZhciBlcHNpbG9uID0gMC4wMTtcbiAgICBmdW5jdGlvbiBuZWFybHlFcXVhbChhLCBiLCBlcHMpe1xuICAgICAgICBpZiAodHlwZW9mIGVwcyA9PT0gXCJ1bmRlZmluZWRcIikge2VwcyA9IGVwc2lsb247fVxuICAgICAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICAgICAgcmV0dXJuIChkaWZmIDwgZXBzKTtcbiAgICB9XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgb3JpZ2luID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yMSA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjIgPSBuZXcgVmVjdG9yKDEsIDEsIDEpO1xuICAgICAgICB2ZWN0b3IzID0gbmV3IFZlY3RvcigxMCwgMTAsIDEwKTtcbiAgICAgICAgdmVjdG9yNCA9IG5ldyBWZWN0b3IoMTEsIDExLCAxMSk7XG4gICAgICAgIHZlY3RvcjUgPSBuZXcgVmVjdG9yKC0xLCAtMSwgLTEpO1xuICAgICAgICB2ZWN0b3J4ID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yeSA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgIHZlY3RvcnogPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICB2ZWN0b3IxMDB4ID0gbmV3IFZlY3RvcigxMDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IyMDB5ID0gbmV3IFZlY3RvcigwLCAyMDAsIDApO1xuICAgICAgICB2ZWN0b3IzMDB6ID0gbmV3IFZlY3RvcigwLCAwLCAzMDApO1xuICAgICAgICB2ZWN0b3IxMjMgPSBuZXcgVmVjdG9yKDEsIDIsIDMpO1xuICAgICAgICB2ZWN0b3IxMTIgPSBuZXcgVmVjdG9yKC0xLCAxLCAyKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2F4ZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe25ldyBWZWN0b3IoKTt9LCBFcnJvcik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS54KTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcjEuYWRkKHZlY3RvcjMpO1xuICAgICAgICAgICAgdmFyIHQyID0gdmVjdG9yMS5hZGQodmVjdG9yNSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5hZGQodmVjdG9yMykuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuYWRkKHZlY3RvcjUpLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS55LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueiwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKTtcbiAgICAgICAgICAgIHZhciB0MiA9IHZlY3RvcjEuc3VidHJhY3QodmVjdG9yMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKS5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zdWJ0cmFjdCh2ZWN0b3IyKS5lcXVhbChvcmlnaW4pKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS54LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi55LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0Mi56LCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2VxdWFsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjIpLCB0cnVlKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmVxdWFsKHZlY3RvcjMpLCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbmdsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5hbmdsZSh2ZWN0b3J5KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LmFuZ2xlKHZlY3RvcnopLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnguYW5nbGUodmVjdG9yeiksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZSh2ZWN0b3IyKSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjEuYW5nbGUodmVjdG9yNSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nvc0FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J5KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeS5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZSh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3IyKSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZSh2ZWN0b3I1KSksIE1hdGguUEkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGUoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yNS5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMy5tYWduaXR1ZGUoKSwgTWF0aC5zcXJ0KDMwMCkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ21hZ25pdHVkZVNxdWFyZWQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yei5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEubWFnbml0dWRlU3F1YXJlZCgpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3I1Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMy5tYWduaXR1ZGVTcXVhcmVkKCksIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkb3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZG90KHZlY3RvcjIpLCAzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyLmRvdCh2ZWN0b3IzKSwgMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMuZG90KHZlY3RvcjUpLCAtMzApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguZG90KHZlY3RvcnkpLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmRvdCh2ZWN0b3J6KSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5kb3QodmVjdG9yeiksIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnY3Jvc3MnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yMTIzLmNyb3NzKHZlY3RvcjExMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yei5jcm9zcyh2ZWN0b3J4KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnkuY3Jvc3ModmVjdG9yeCkuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J6LmNyb3NzKHZlY3RvcnkpLmVxdWFsKHZlY3RvcngpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yeC5jcm9zcyh2ZWN0b3J6KS5lcXVhbCh2ZWN0b3J5KSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5jcm9zcyh2ZWN0b3J5KS56LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J5LmNyb3NzKHZlY3RvcnopLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnouY3Jvc3ModmVjdG9yeCkueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueSwgLTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnosIDMpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdub3JtYWxpemUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEwMHgubm9ybWFsaXplKCkueCwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMjAweS5ub3JtYWxpemUoKS55LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IzMDB6Lm5vcm1hbGl6ZSgpLnosIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnguc2NhbGUoMTAwKS5lcXVhbCh2ZWN0b3IxMDB4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeS5zY2FsZSgyMDApLmVxdWFsKHZlY3RvcjIwMHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J6LnNjYWxlKDMwMCkuZXF1YWwodmVjdG9yMzAweikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuc2NhbGUoMTApLmVxdWFsKHZlY3RvcjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnNjYWxlKDExKS5lcXVhbCh2ZWN0b3I0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkuZXF1YWwodmVjdG9yNSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEubmVnYXRlKCkubmVnYXRlKCkuZXF1YWwodmVjdG9yMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndmVjdG9yUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB2ZWN0b3J4LnZlY3RvclByb2plY3Rpb24odmVjdG9yeSk7XG4gICAgICAgICAgICB2YXIgdDIgPSB2ZWN0b3IxLnZlY3RvclByb2plY3Rpb24odmVjdG9yMyk7XG4gICAgICAgICAgICB2YXIgdDMgPSB2ZWN0b3IxMjMudmVjdG9yUHJvamVjdGlvbih2ZWN0b3IxMTIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQyLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0Mi55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDIueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLngsIC0xLjE2NykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLnksIDEuMTYpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0My56LCAyLjMzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsYXJQcm9qZWN0aW9uJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LnNjYWxhclByb2plY3Rpb24odmVjdG9yeSksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J5LnNjYWxhclByb2plY3Rpb24odmVjdG9yeiksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLnNjYWxhclByb2plY3Rpb24odmVjdG9yMyksIDEuNzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxMjMuc2NhbGFyUHJvamVjdGlvbih2ZWN0b3IxMTIpLCAyLjg1KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZSh2ZWN0b3J5LCAoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS56LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcnoucm90YXRlWCgoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcnoucm90YXRlWCgyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVZJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByb3QxID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkgLyAyKTtcbiAgICAgICAgICAgIHZhciByb3QyID0gdmVjdG9yeC5yb3RhdGVZKE1hdGguUEkpO1xuICAgICAgICAgICAgdmFyIHJvdDMgPSB2ZWN0b3J4LnJvdGF0ZVkoKCgzKk1hdGguUEkpIC8gMikpO1xuICAgICAgICAgICAgdmFyIHJvdDQgPSB2ZWN0b3J4LnJvdGF0ZVkoMipNYXRoLlBJKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlWicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICB2YXIgcm90MiA9IHZlY3Rvcnkucm90YXRlWihNYXRoLlBJKTtcbiAgICAgICAgICAgIHZhciByb3QzID0gdmVjdG9yeS5yb3RhdGVaKCgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeS5yb3RhdGVaKDIqTWF0aC5QSSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90MS54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QzLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnksIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3Q0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlUGl0Y2hZYXdSb2xsKE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbGl0eS9jb2xvci5qcycpO1xudmFyIGNvbG9ybGlzdCA9IHJlcXVpcmUoJy4uL2RhdGEvY29sb3JzLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgcmdiYSwgaHNsLCBoc2xhLCBhbGljZWJsdWUsIGVwc2lsb247XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVkID0gbmV3IENvbG9yKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvcihcIiNCQURBNTVcIik7XG4gICAgICAgIHJnYmEgPSBuZXcgQ29sb3IoXCJyZ2JhKDI1NSwgMCwgMCwgMC4zKVwiKTtcbiAgICAgICAgZXBzaWxvbiA9IDAuMDE7XG4gICAgICAgIGhzbCA9IG5ldyBDb2xvcihcImhzbCgwLCAxMDAlLCA1MCUpXCIpO1xuICAgICAgICBoc2xhID0gbmV3IENvbG9yKFwiaHNsYSgwLCAxMDAlLCA1MCUsIDAuMylcIik7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdyZ2InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuYiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2wnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5zLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLmwsIDAuNSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbHBoYScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2soTWF0aC5hYnMocmVkLmFscGhhIC0gMSkgPCBlcHNpbG9uKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhNYXRoLmFicyhyZ2JhLmFscGhhIC0gMC4zKSA8IGVwc2lsb24pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2xpZ2h0ZW4nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdkYXJrZW4nLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2xUb1JnYicsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JnYlRvSHNsJywgZnVuY3Rpb24oKXtcblxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyJdfQ==
(16)
});
