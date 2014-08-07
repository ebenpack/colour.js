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
// Clamp x and y values to min and max
function clamp(x, min, max){
    if (x < min){x = min;}
    else if (x > max){x = max;}
    return x;
}
/**
 * Parse a CSS color value and return an rgba color object.
 * @param  {string} color A legal CSS color value (hex, color keyword, rgb[a], hsl[a]).
 * @return {{r: number, g: number, b: number, a: number}}   rgba color object.
 * @throws {ColourError} If illegal color value is passed.
 */
parseColor = function(color){
    var red, green, blue, hue, sat, lum;
    var alpha = 1;
    var match;
    var error = false;
    var pref = color.substr(0,3); // Three letter color prefix
    // HSL(a)
    if (pref === 'hsl'){
        var hsl_regex = /hsla?\(\s*(-?\d+)\s*,\s*(-?\d+)%\s*,\s*(-?\d+)%\s*(,\s*(-?\d+(\.\d+)?)\s*)?\)/g;
        match = hsl_regex.exec(color);
        if (match){
            hue = parseInt(match[1], 10);
            sat = parseInt(match[2], 10);
            lum = parseInt(match[3], 10);
            if (color[3] === 'a'){
                alpha = parseFloat(match[5]);
            }
            hue = Math.abs(hue % 360);
            sat = clamp(sat, 0, 100);
            lum = clamp(lum, 0, 100);
            var parsed = hslToRgb(hue, sat, lum);
            red = parsed.r;
            green = parsed.g;
            blue = parsed.b;
        } else {
            error = true;
        }
    // RGB(a)
    } else if (pref === 'rgb'){
        var rgb_regex = /rgba?\((-?\d+%?)\s*,\s*(-?\d+%?)\s*,\s*(-?\d+%?)(,\s*(-?\d+(\.\d+)?)\s*)?\)/g;
        match = rgb_regex.exec(color);
        if (match){
            var m1 = match[1];
            var m2 = match[2];
            var m3 = match[3];
            red = parseInt(match[1], 10);
            green = parseInt(match[2], 10);
            blue = parseInt(match[3], 10);
            // Check if using rgb(a) percentage values.
            if (m1[m1.length-1] === '%' ||
                m2[m2.length-1] === '%' ||
                m3[m3.length-1] === '%'){
                // All values must be percetage.
                if (m1[m1.length-1] === '%' &&
                    m2[m2.length-1] === '%' &&
                    m3[m3.length-1] === '%'){
                    // Convert to 255
                    red = Math.floor(red/100 * 255);
                    green = Math.floor(green/100 * 255);
                    blue = Math.floor(blue/100 * 255);
                } else {
                   error = true; 
                }
            }
            red = clamp(red, 0, 255);
            green = clamp(green, 0, 255);
            blue = clamp(blue, 0, 255);
            if (color[3] === 'a'){
                alpha = parseFloat(match[5]);
            }
        } else {
            error = true;
        }
    // HEX
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

    alpha = clamp(alpha, 0, 1);

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
    var red, green, blue, rgb, rgba, hsl, hsla, rgb_per, rgb_bad1, rgb_bad2, rgb_bad3, hsl_bad1, hsl_bad2;
    setup(function(){
        red = new Colour("red");
        green = new Colour("#0F0"); // Named color 'green' is rgb(0,128,0)
        blue = new Colour("blue");
        rgb = new Colour("rgb(1, 7, 29)");
        rgba = new Colour("rgba(1, 7, 29, 0.3)");
        rgb_per = new Colour("rgba(100%, 0%, 0%, 1)");
        hsl = new Colour("hsl(0, 100%, 50%)");
        hsla = new Colour("hsla(0, 100%, 50%, 0.3 )");

        // These are poorly formatted colors, but they should still work.
        rgb_bad1 = new Colour("rgb(300,0,0)");
        rgb_bad2 = new Colour("rgb(255,-10,0)");
        rgb_bad3 = new Colour("rgba(110%, 0%, 0%, 2)");
        hsl_bad1 = new Colour("hsl(720, 120%, 120%)");
        hsl_bad2 = new Colour("hsl(-720, -120%, -120%)");
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
            assert.equal(rgb_per.rgb.r, 255);
            assert.equal(rgb_per.rgb.g, 0);
            assert.equal(rgb_per.rgb.b, 0);
            assert.equal(rgb_bad1.rgb.r, 255);
            assert.equal(rgb_bad1.rgb.g, 0);
            assert.equal(rgb_bad1.rgb.b, 0);
            assert.equal(rgb_bad2.rgb.r, 255);
            assert.equal(rgb_bad2.rgb.g, 0);
            assert.equal(rgb_bad2.rgb.b, 0);
            assert.equal(rgb_bad3.rgb.r, 255);
            assert.equal(rgb_bad3.rgb.g, 0);
            assert.equal(rgb_bad3.rgb.b, 0);
            assert.equal(rgb_bad3.alpha, 1);
            
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

            // assert.equal(hsl_bad1.r, 255);
            // assert.equal(hsl_bad1.g, 255);
            // assert.equal(hsl_bad1.b, 255);
            // assert.equal(hsl_bad2.r, 255);
            // assert.equal(hsl_bad2.g, 255);
            // assert.equal(hsl_bad2.b, 255);
            
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvc3JjL2NvbG91ci5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2NvbG91ci5qcy90ZXN0L2Zha2VfNDI5MTllMTkuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9jb2xvdXIuanMvdGVzdHMvY29sb3VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRG9jdW1lbnRzL3dvcmsvY29sb3VyLmpzL3Rlc3RzL2RhdGEvY29sb3JzLmpzIiwiL2hvbWUvZWJlbnBhY2svRG9jdW1lbnRzL3dvcmsvY29sb3VyLmpzL3Rlc3RzL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RhQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmIChpc05hTih2YWx1ZSkgfHwgIWlzRmluaXRlKHZhbHVlKSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgICAga2V5LCBpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwidmFyIGhzbFRvUmdiLCByZ2JUb0hzbCwgcGFyc2VDb2xvciwgY2FjaGU7XG4vKipcbiAqIEEgY29sb3Igd2l0aCBib3RoIHJnYiBhbmQgaHNsIHJlcHJlc2VudGF0aW9ucy5cbiAqIEBjbGFzcyBDb2xvdXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBBbnkgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqL1xuZnVuY3Rpb24gQ29sb3VyKGNvbG9yLCBhbHBoYSl7XG4gICAgdmFyIGhzbCwgcmdiO1xuICAgIHZhciBwYXJzZWRfY29sb3IgPSB7fTtcbiAgICBpZiAodHlwZW9mIGNvbG9yID09PSAnc3RyaW5nJyl7XG4gICAgICAgIGNvbG9yID0gY29sb3IudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKGNvbG9yIGluIGNhY2hlKXtcbiAgICAgICAgICAgIHBhcnNlZF9jb2xvciA9IGNhY2hlW2NvbG9yXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNlZF9jb2xvciA9IHBhcnNlQ29sb3IoY29sb3IpO1xuICAgICAgICAgICAgY2FjaGVbY29sb3JdID0gcGFyc2VkX2NvbG9yO1xuICAgICAgICB9XG4gICAgICAgIHJnYiA9IHBhcnNlZF9jb2xvcjtcbiAgICAgICAgaHNsID0gcmdiVG9Ic2wocGFyc2VkX2NvbG9yLnIsIHBhcnNlZF9jb2xvci5nLCBwYXJzZWRfY29sb3IuYik7XG4gICAgICAgIGFscGhhID0gcGFyc2VkX2NvbG9yLmEgfHwgYWxwaGEgfHwgMTtcbiAgICB9IGVsc2UgaWYgKCdyJyBpbiBjb2xvcil7XG4gICAgICAgIHJnYiA9IGNvbG9yO1xuICAgICAgICBoc2wgPSByZ2JUb0hzbChjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKTtcbiAgICAgICAgYWxwaGEgPSBoc2wuYSB8fCBhbHBoYSB8fCAxO1xuICAgIH0gZWxzZSBpZiAoJ2gnIGluIGNvbG9yKXtcbiAgICAgICAgaHNsID0gY29sb3I7XG4gICAgICAgIHJnYiA9IGhzbFRvUmdiKGNvbG9yLmgsIGNvbG9yLnMsIGNvbG9yLmwpO1xuICAgICAgICBhbHBoYSA9IHJnYi5hIHx8IGFscGhhIHx8IDE7XG4gICAgfVxuICAgIHRoaXMucmdiID0geydyJzogcmdiLnIsICdnJzogcmdiLmcsICdiJzogcmdiLmJ9O1xuICAgIHRoaXMuaHNsID0geydoJzogaHNsLmgsICdzJzogaHNsLnMsICdsJzogaHNsLmx9O1xuICAgIHRoaXMuYWxwaGEgPSBhbHBoYTtcbn1cbi8qKlxuICogTGlnaHRlbiBhIGNvbG9yIGJ5IHRoZSBnaXZlbiBwZXJjZW50YWdlLlxuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG91cn1cbiAqL1xuQ29sb3VyLnByb3RvdHlwZS5saWdodGVuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCArIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA+IDEwMCl7XG4gICAgICAgIGx1bSA9IDEwMDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2xvdXIoeydoJzpoc2wuaCwgJ3MnOmhzbC5zLCAnbCc6bHVtfSwgdGhpcy5hbHBoYSk7XG59O1xuLyoqXG4gKiBEYXJrZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3VyfVxuICovXG5Db2xvdXIucHJvdG90eXBlLmRhcmtlbiA9IGZ1bmN0aW9uKHBlcmNlbnQpe1xuICAgIHZhciBoc2wgPSB0aGlzLmhzbDtcbiAgICB2YXIgbHVtID0gaHNsLmwgLSBwZXJjZW50O1xuICAgIGlmIChsdW0gPCAwKXtcbiAgICAgICAgbHVtID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2xvdXIoeydoJzpoc2wuaCwgJ3MnOmhzbC5zLCAnbCc6bHVtfSwgdGhpcy5hbHBoYSk7XG59O1xuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgY29sb3IgaW4gI2hleCBmb3JtLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5Db2xvdXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgciA9IHRoaXMucmdiLnIudG9TdHJpbmcoMTYpO1xuICAgIHZhciBnID0gdGhpcy5yZ2IuZy50b1N0cmluZygxNik7XG4gICAgdmFyIGIgPSB0aGlzLnJnYi5iLnRvU3RyaW5nKDE2KTtcbiAgICAvLyBaZXJvIGZpbGxcbiAgICBpZiAoci5sZW5ndGggPT09IDEpe1xuICAgICAgICByID0gXCIwXCIgKyByO1xuICAgIH1cbiAgICBpZiAoZy5sZW5ndGggPT09IDEpe1xuICAgICAgICBnID0gXCIwXCIgKyBnO1xuICAgIH1cbiAgICBpZiAoYi5sZW5ndGggPT09IDEpe1xuICAgICAgICBiID0gXCIwXCIgKyBiO1xuICAgIH1cbiAgICByZXR1cm4gXCIjXCIgKyByICsgZyArIGI7XG59O1xuLyoqXG4qIEBwYXJhbSB7bnVtYmVyfSBoIEh1ZVxuKiBAcGFyYW0ge251bWJlcn0gcyBTYXR1cmF0aW9uXG4qIEBwYXJhbSB7bnVtYmVyfSBsIEx1bWluYW5jZVxuKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlcn19XG4qL1xuaHNsVG9SZ2IgPSBmdW5jdGlvbihoLCBzLCBsKXtcbiAgICBmdW5jdGlvbiBfdihtMSwgbTIsIGh1ZSl7XG4gICAgICAgIGh1ZSA9IGh1ZTtcbiAgICAgICAgaWYgKGh1ZSA8IDApe2h1ZSs9MTt9XG4gICAgICAgIGlmIChodWUgPiAxKXtodWUtPTE7fVxuICAgICAgICBpZiAoaHVlIDwgKDEvNikpe1xuICAgICAgICAgICAgcmV0dXJuIG0xICsgKG0yLW0xKSpodWUqNjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgMC41KXtcbiAgICAgICAgICAgIHJldHVybiBtMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgKDIvMykpe1xuICAgICAgICAgICAgcmV0dXJuIG0xICsgKG0yLW0xKSooKDIvMyktaHVlKSo2O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtMTtcbiAgICB9XG4gICAgdmFyIG0yO1xuICAgIHZhciBmcmFjdGlvbl9sID0gKGwvMTAwKTtcbiAgICB2YXIgZnJhY3Rpb25fcyA9IChzLzEwMCk7XG4gICAgaWYgKHMgPT09IDApe1xuICAgICAgICB2YXIgZ3JheSA9IGZyYWN0aW9uX2wqMjU1O1xuICAgICAgICByZXR1cm4geydyJzogZ3JheSwgJ2cnOiBncmF5LCAnYic6IGdyYXl9O1xuICAgIH1cbiAgICBpZiAobCA8PSA1MCl7XG4gICAgICAgIG0yID0gZnJhY3Rpb25fbCAqICgxK2ZyYWN0aW9uX3MpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBtMiA9IGZyYWN0aW9uX2wrZnJhY3Rpb25fcy0oZnJhY3Rpb25fbCpmcmFjdGlvbl9zKTtcbiAgICB9XG4gICAgdmFyIG0xID0gMipmcmFjdGlvbl9sIC0gbTI7XG4gICAgaCA9IGggLyAzNjA7XG4gICAgcmV0dXJuIHsncic6IE1hdGgucm91bmQoX3YobTEsIG0yLCBoKygxLzMpKSoyNTUpLCAnZyc6IE1hdGgucm91bmQoX3YobTEsIG0yLCBoKSoyNTUpLCAnYic6IE1hdGgucm91bmQoX3YobTEsIG0yLCBoLSgxLzMpKSoyNTUpfTtcbn07XG4vKipcbiAqIEBwYXJhbSAge251bWJlcn0gciBSZWRcbiAqIEBwYXJhbSAge251bWJlcn0gZyBHcmVlblxuICogQHBhcmFtICB7bnVtYmVyfSBiIEJsdWVcbiAqIEByZXR1cm4ge3toOiBudW1iZXIsIHM6IG51bWJlciwgbDogbnVtYmVyfX1cbiAqL1xucmdiVG9Ic2wgPSBmdW5jdGlvbihyLCBnLCBiKXtcbiAgICByID0gciAvIDI1NTtcbiAgICBnID0gZyAvIDI1NTtcbiAgICBiID0gYiAvIDI1NTtcbiAgICB2YXIgbWF4YyA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIHZhciBtaW5jID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgdmFyIGwgPSBNYXRoLnJvdW5kKCgobWluYyttYXhjKS8yKSoxMDApO1xuICAgIGlmIChsID4gMTAwKSB7bCA9IDEwMDt9XG4gICAgaWYgKGwgPCAwKSB7bCA9IDA7fVxuICAgIHZhciBoLCBzO1xuICAgIGlmIChtaW5jID09PSBtYXhjKXtcbiAgICAgICAgcmV0dXJuIHsnaCc6IDAsICdzJzogMCwgJ2wnOiBsfTtcbiAgICB9XG4gICAgaWYgKGwgPD0gNTApe1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAobWF4YyttaW5jKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKDItbWF4Yy1taW5jKTtcbiAgICB9XG4gICAgdmFyIHJjID0gKG1heGMtcikgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgZ2MgPSAobWF4Yy1nKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBiYyA9IChtYXhjLWIpIC8gKG1heGMtbWluYyk7XG4gICAgaWYgKHIgPT09IG1heGMpe1xuICAgICAgICBoID0gYmMtZ2M7XG4gICAgfVxuICAgIGVsc2UgaWYgKGcgPT09IG1heGMpe1xuICAgICAgICBoID0gMityYy1iYztcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgaCA9IDQrZ2MtcmM7XG4gICAgfVxuICAgIGggPSAoaC82KSAlIDE7XG4gICAgaWYgKGggPCAwKXtoKz0xO31cbiAgICBoID0gTWF0aC5yb3VuZChoKjM2MCk7XG4gICAgcyA9IE1hdGgucm91bmQocyoxMDApO1xuICAgIGlmIChoID4gMzYwKSB7aCA9IDM2MDt9XG4gICAgaWYgKGggPCAwKSB7aCA9IDA7fVxuICAgIGlmIChzID4gMTAwKSB7cyA9IDEwMDt9XG4gICAgaWYgKHMgPCAwKSB7cyA9IDA7fVxuICAgIHJldHVybiB7J2gnOiBoLCAncyc6IHMsICdsJzogbH07XG59O1xuLy8gQ2xhbXAgeCBhbmQgeSB2YWx1ZXMgdG8gbWluIGFuZCBtYXhcbmZ1bmN0aW9uIGNsYW1wKHgsIG1pbiwgbWF4KXtcbiAgICBpZiAoeCA8IG1pbil7eCA9IG1pbjt9XG4gICAgZWxzZSBpZiAoeCA+IG1heCl7eCA9IG1heDt9XG4gICAgcmV0dXJuIHg7XG59XG4vKipcbiAqIFBhcnNlIGEgQ1NTIGNvbG9yIHZhbHVlIGFuZCByZXR1cm4gYW4gcmdiYSBjb2xvciBvYmplY3QuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvbG9yIEEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXJ9fSAgIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHRocm93cyB7Q29sb3VyRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIHZhciByZWQsIGdyZWVuLCBibHVlLCBodWUsIHNhdCwgbHVtO1xuICAgIHZhciBhbHBoYSA9IDE7XG4gICAgdmFyIG1hdGNoO1xuICAgIHZhciBlcnJvciA9IGZhbHNlO1xuICAgIHZhciBwcmVmID0gY29sb3Iuc3Vic3RyKDAsMyk7IC8vIFRocmVlIGxldHRlciBjb2xvciBwcmVmaXhcbiAgICAvLyBIU0woYSlcbiAgICBpZiAocHJlZiA9PT0gJ2hzbCcpe1xuICAgICAgICB2YXIgaHNsX3JlZ2V4ID0gL2hzbGE/XFwoXFxzKigtP1xcZCspXFxzKixcXHMqKC0/XFxkKyklXFxzKixcXHMqKC0/XFxkKyklXFxzKigsXFxzKigtP1xcZCsoXFwuXFxkKyk/KVxccyopP1xcKS9nO1xuICAgICAgICBtYXRjaCA9IGhzbF9yZWdleC5leGVjKGNvbG9yKTtcbiAgICAgICAgaWYgKG1hdGNoKXtcbiAgICAgICAgICAgIGh1ZSA9IHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgICAgICAgICBzYXQgPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuICAgICAgICAgICAgbHVtID0gcGFyc2VJbnQobWF0Y2hbM10sIDEwKTtcbiAgICAgICAgICAgIGlmIChjb2xvclszXSA9PT0gJ2EnKXtcbiAgICAgICAgICAgICAgICBhbHBoYSA9IHBhcnNlRmxvYXQobWF0Y2hbNV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaHVlID0gTWF0aC5hYnMoaHVlICUgMzYwKTtcbiAgICAgICAgICAgIHNhdCA9IGNsYW1wKHNhdCwgMCwgMTAwKTtcbiAgICAgICAgICAgIGx1bSA9IGNsYW1wKGx1bSwgMCwgMTAwKTtcbiAgICAgICAgICAgIHZhciBwYXJzZWQgPSBoc2xUb1JnYihodWUsIHNhdCwgbHVtKTtcbiAgICAgICAgICAgIHJlZCA9IHBhcnNlZC5yO1xuICAgICAgICAgICAgZ3JlZW4gPSBwYXJzZWQuZztcbiAgICAgICAgICAgIGJsdWUgPSBwYXJzZWQuYjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIC8vIFJHQihhKVxuICAgIH0gZWxzZSBpZiAocHJlZiA9PT0gJ3JnYicpe1xuICAgICAgICB2YXIgcmdiX3JlZ2V4ID0gL3JnYmE/XFwoKC0/XFxkKyU/KVxccyosXFxzKigtP1xcZCslPylcXHMqLFxccyooLT9cXGQrJT8pKCxcXHMqKC0/XFxkKyhcXC5cXGQrKT8pXFxzKik/XFwpL2c7XG4gICAgICAgIG1hdGNoID0gcmdiX3JlZ2V4LmV4ZWMoY29sb3IpO1xuICAgICAgICBpZiAobWF0Y2gpe1xuICAgICAgICAgICAgdmFyIG0xID0gbWF0Y2hbMV07XG4gICAgICAgICAgICB2YXIgbTIgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgIHZhciBtMyA9IG1hdGNoWzNdO1xuICAgICAgICAgICAgcmVkID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICAgIGdyZWVuID0gcGFyc2VJbnQobWF0Y2hbMl0sIDEwKTtcbiAgICAgICAgICAgIGJsdWUgPSBwYXJzZUludChtYXRjaFszXSwgMTApO1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdXNpbmcgcmdiKGEpIHBlcmNlbnRhZ2UgdmFsdWVzLlxuICAgICAgICAgICAgaWYgKG0xW20xLmxlbmd0aC0xXSA9PT0gJyUnIHx8XG4gICAgICAgICAgICAgICAgbTJbbTIubGVuZ3RoLTFdID09PSAnJScgfHxcbiAgICAgICAgICAgICAgICBtM1ttMy5sZW5ndGgtMV0gPT09ICclJyl7XG4gICAgICAgICAgICAgICAgLy8gQWxsIHZhbHVlcyBtdXN0IGJlIHBlcmNldGFnZS5cbiAgICAgICAgICAgICAgICBpZiAobTFbbTEubGVuZ3RoLTFdID09PSAnJScgJiZcbiAgICAgICAgICAgICAgICAgICAgbTJbbTIubGVuZ3RoLTFdID09PSAnJScgJiZcbiAgICAgICAgICAgICAgICAgICAgbTNbbTMubGVuZ3RoLTFdID09PSAnJScpe1xuICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRvIDI1NVxuICAgICAgICAgICAgICAgICAgICByZWQgPSBNYXRoLmZsb29yKHJlZC8xMDAgKiAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBncmVlbiA9IE1hdGguZmxvb3IoZ3JlZW4vMTAwICogMjU1KTtcbiAgICAgICAgICAgICAgICAgICAgYmx1ZSA9IE1hdGguZmxvb3IoYmx1ZS8xMDAgKiAyNTUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgZXJyb3IgPSB0cnVlOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWQgPSBjbGFtcChyZWQsIDAsIDI1NSk7XG4gICAgICAgICAgICBncmVlbiA9IGNsYW1wKGdyZWVuLCAwLCAyNTUpO1xuICAgICAgICAgICAgYmx1ZSA9IGNsYW1wKGJsdWUsIDAsIDI1NSk7XG4gICAgICAgICAgICBpZiAoY29sb3JbM10gPT09ICdhJyl7XG4gICAgICAgICAgICAgICAgYWxwaGEgPSBwYXJzZUZsb2F0KG1hdGNoWzVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIC8vIEhFWFxuICAgIH0gZWxzZSBpZiAoY29sb3JbMF0gPT09ICcjJyl7XG4gICAgICAgIHZhciBoZXggPSBjb2xvci5zdWJzdHIoMSk7XG4gICAgICAgIGlmIChoZXgubGVuZ3RoID09PSAzKXtcbiAgICAgICAgICAgIHJlZCA9IHBhcnNlSW50KGhleFswXStoZXhbMF0sIDE2KTtcbiAgICAgICAgICAgIGdyZWVuID0gcGFyc2VJbnQoaGV4WzFdK2hleFsxXSwgMTYpO1xuICAgICAgICAgICAgYmx1ZSA9IHBhcnNlSW50KGhleFsyXStoZXhbMl0sIDE2KTtcbiAgICAgICAgfSBlbHNlIGlmIChoZXgubGVuZ3RoID09PSA2KXtcbiAgICAgICAgICAgIHJlZCA9IHBhcnNlSW50KGhleFswXStoZXhbMV0sIDE2KTtcbiAgICAgICAgICAgIGdyZWVuID0gcGFyc2VJbnQoaGV4WzJdK2hleFszXSwgMTYpO1xuICAgICAgICAgICAgYmx1ZSA9IHBhcnNlSW50KGhleFs0XStoZXhbNV0sIDE2KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBhbHBoYSA9IGNsYW1wKGFscGhhLCAwLCAxKTtcblxuICAgIGlmIChlcnJvcil7XG4gICAgICAgIHRocm93IFwiQ29sb3VyRXJyb3I6IFNvbWV0aGluZyB3ZW50IHdyb25nLiBQZXJoYXBzIFwiICsgY29sb3IgKyBcIiBpcyBub3QgYSBsZWdhbCBDU1MgY29sb3IgdmFsdWVcIjtcbiAgICB9XG4gICAgcmV0dXJuIHsncic6IHJlZCwgJ2cnOiBncmVlbiwgJ2InOiBibHVlLCAnYSc6IGFscGhhfTtcbn07XG4vLyBQcmUtd2FybSB0aGUgY2FjaGUgd2l0aCBuYW1lZCBjb2xvcnMsIGFzIHRoZXNlIGFyZSBub3Rcbi8vIGNvbnZlcnRlZCB0byByZ2IgdmFsdWVzIGJ5IHRoZSBwYXJzZUNvbG9yIGZ1bmN0aW9uIGFib3ZlLlxuY2FjaGUgPSB7XG4gICAgXCJibGFja1wiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMH0sXG4gICAgXCJzaWx2ZXJcIjoge1wiclwiOiAxOTIsIFwiZ1wiOiAxOTIsIFwiYlwiOiAxOTIsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDc1fSxcbiAgICBcImdyYXlcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDUwfSxcbiAgICBcIndoaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAxMDB9LFxuICAgIFwibWFyb29uXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwicmVkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwicHVycGxlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMCwgXCJiXCI6IDEyOCwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImZ1Y2hzaWFcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImxpbWVcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9saXZlXCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwieWVsbG93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwibmF2eVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjU1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwidGVhbFwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJhcXVhXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm9yYW5nZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE2NSwgXCJiXCI6IDAsIFwiaFwiOiAzOSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDIwOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImFudGlxdWV3aGl0ZVwiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDIzNSwgXCJiXCI6IDIxNSwgXCJoXCI6IDM0LCBcInNcIjogNzgsIFwibFwiOiA5MX0sXG4gICAgXCJhcXVhbWFyaW5lXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMjEyLCBcImhcIjogMTYwLCBcInNcIjogMTAwLCBcImxcIjogNzV9LFxuICAgIFwiYXp1cmVcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJiZWlnZVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDIyMCwgXCJoXCI6IDYwLCBcInNcIjogNTYsIFwibFwiOiA5MX0sXG4gICAgXCJiaXNxdWVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxOTYsIFwiaFwiOiAzMywgXCJzXCI6IDEwMCwgXCJsXCI6IDg4fSxcbiAgICBcImJsYW5jaGVkYWxtb25kXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM1LCBcImJcIjogMjA1LCBcImhcIjogMzYsIFwic1wiOiAxMDAsIFwibFwiOiA5MH0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcInJcIjogMTM4LCBcImdcIjogNDMsIFwiYlwiOiAyMjYsIFwiaFwiOiAyNzEsIFwic1wiOiA3NiwgXCJsXCI6IDUzfSxcbiAgICBcImJyb3duXCI6IHtcInJcIjogMTY1LCBcImdcIjogNDIsIFwiYlwiOiA0MiwgXCJoXCI6IDAsIFwic1wiOiA1OSwgXCJsXCI6IDQxfSxcbiAgICBcImJ1cmx5d29vZFwiOiB7XCJyXCI6IDIyMiwgXCJnXCI6IDE4NCwgXCJiXCI6IDEzNSwgXCJoXCI6IDM0LCBcInNcIjogNTcsIFwibFwiOiA3MH0sXG4gICAgXCJjYWRldGJsdWVcIjoge1wiclwiOiA5NSwgXCJnXCI6IDE1OCwgXCJiXCI6IDE2MCwgXCJoXCI6IDE4MiwgXCJzXCI6IDI1LCBcImxcIjogNTB9LFxuICAgIFwiY2hhcnRyZXVzZVwiOiB7XCJyXCI6IDEyNywgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiA5MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDEwNSwgXCJiXCI6IDMwLCBcImhcIjogMjUsIFwic1wiOiA3NSwgXCJsXCI6IDQ3fSxcbiAgICBcImNvcmFsXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTI3LCBcImJcIjogODAsIFwiaFwiOiAxNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDY2fSxcbiAgICBcImNvcm5mbG93ZXJibHVlXCI6IHtcInJcIjogMTAwLCBcImdcIjogMTQ5LCBcImJcIjogMjM3LCBcImhcIjogMjE5LCBcInNcIjogNzksIFwibFwiOiA2Nn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0OCwgXCJiXCI6IDIyMCwgXCJoXCI6IDQ4LCBcInNcIjogMTAwLCBcImxcIjogOTN9LFxuICAgIFwiY3lhblwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMjU1LCBcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDk3fSxcbiAgICBcImNyaW1zb25cIjoge1wiclwiOiAyMjAsIFwiZ1wiOiAyMCwgXCJiXCI6IDYwLCBcImhcIjogMzQ4LCBcInNcIjogODMsIFwibFwiOiA0N30sXG4gICAgXCJkYXJrYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMTM5LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogMjd9LFxuICAgIFwiZGFya2N5YW5cIjoge1wiclwiOiAwLCBcImdcIjogMTM5LCBcImJcIjogMTM5LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogMjd9LFxuICAgIFwiZGFya2dvbGRlbnJvZFwiOiB7XCJyXCI6IDE4NCwgXCJnXCI6IDEzNCwgXCJiXCI6IDExLCBcImhcIjogNDMsIFwic1wiOiA4OSwgXCJsXCI6IDM4fSxcbiAgICBcImRhcmtncmF5XCI6IHtcInJcIjogMTY5LCBcImdcIjogMTY5LCBcImJcIjogMTY5LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA2Nn0sXG4gICAgXCJkYXJrZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMTAwLCBcImJcIjogMCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDIwfSxcbiAgICBcImRhcmtncmV5XCI6IHtcInJcIjogMTY5LCBcImdcIjogMTY5LCBcImJcIjogMTY5LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA2Nn0sXG4gICAgXCJkYXJra2hha2lcIjoge1wiclwiOiAxODksIFwiZ1wiOiAxODMsIFwiYlwiOiAxMDcsIFwiaFwiOiA1NiwgXCJzXCI6IDM4LCBcImxcIjogNTh9LFxuICAgIFwiZGFya21hZ2VudGFcIjoge1wiclwiOiAxMzksIFwiZ1wiOiAwLCBcImJcIjogMTM5LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogMjd9LFxuICAgIFwiZGFya29saXZlZ3JlZW5cIjoge1wiclwiOiA4NSwgXCJnXCI6IDEwNywgXCJiXCI6IDQ3LCBcImhcIjogODIsIFwic1wiOiAzOSwgXCJsXCI6IDMwfSxcbiAgICBcImRhcmtvcmFuZ2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNDAsIFwiYlwiOiAwLCBcImhcIjogMzMsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJkYXJrb3JjaGlkXCI6IHtcInJcIjogMTUzLCBcImdcIjogNTAsIFwiYlwiOiAyMDQsIFwiaFwiOiAyODAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfSxcbiAgICBcImRhcmtyZWRcIjoge1wiclwiOiAxMzksIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiAyN30sXG4gICAgXCJkYXJrc2FsbW9uXCI6IHtcInJcIjogMjMzLCBcImdcIjogMTUwLCBcImJcIjogMTIyLCBcImhcIjogMTUsIFwic1wiOiA3MiwgXCJsXCI6IDcwfSxcbiAgICBcImRhcmtzZWFncmVlblwiOiB7XCJyXCI6IDE0MywgXCJnXCI6IDE4OCwgXCJiXCI6IDE0MywgXCJoXCI6IDEyMCwgXCJzXCI6IDI1LCBcImxcIjogNjV9LFxuICAgIFwiZGFya3NsYXRlYmx1ZVwiOiB7XCJyXCI6IDcyLCBcImdcIjogNjEsIFwiYlwiOiAxMzksIFwiaFwiOiAyNDgsIFwic1wiOiAzOSwgXCJsXCI6IDM5fSxcbiAgICBcImRhcmtzbGF0ZWdyYXlcIjoge1wiclwiOiA0NywgXCJnXCI6IDc5LCBcImJcIjogNzksIFwiaFwiOiAxODAsIFwic1wiOiAyNSwgXCJsXCI6IDI1fSxcbiAgICBcImRhcmtzbGF0ZWdyZXlcIjoge1wiclwiOiA0NywgXCJnXCI6IDc5LCBcImJcIjogNzksIFwiaFwiOiAxODAsIFwic1wiOiAyNSwgXCJsXCI6IDI1fSxcbiAgICBcImRhcmt0dXJxdW9pc2VcIjoge1wiclwiOiAwLCBcImdcIjogMjA2LCBcImJcIjogMjA5LCBcImhcIjogMTgxLCBcInNcIjogMTAwLCBcImxcIjogNDF9LFxuICAgIFwiZGFya3Zpb2xldFwiOiB7XCJyXCI6IDE0OCwgXCJnXCI6IDAsIFwiYlwiOiAyMTEsIFwiaFwiOiAyODIsIFwic1wiOiAxMDAsIFwibFwiOiA0MX0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIwLCBcImJcIjogMTQ3LCBcImhcIjogMzI4LCBcInNcIjogMTAwLCBcImxcIjogNTR9LFxuICAgIFwiZGVlcHNreWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMTkxLCBcImJcIjogMjU1LCBcImhcIjogMTk1LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZGltZ3JheVwiOiB7XCJyXCI6IDEwNSwgXCJnXCI6IDEwNSwgXCJiXCI6IDEwNSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNDF9LFxuICAgIFwiZGltZ3JleVwiOiB7XCJyXCI6IDEwNSwgXCJnXCI6IDEwNSwgXCJiXCI6IDEwNSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNDF9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJyXCI6IDMwLCBcImdcIjogMTQ0LCBcImJcIjogMjU1LCBcImhcIjogMjEwLCBcInNcIjogMTAwLCBcImxcIjogNTZ9LFxuICAgIFwiZmlyZWJyaWNrXCI6IHtcInJcIjogMTc4LCBcImdcIjogMzQsIFwiYlwiOiAzNCwgXCJoXCI6IDAsIFwic1wiOiA2OCwgXCJsXCI6IDQyfSxcbiAgICBcImZsb3JhbHdoaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjQwLCBcImhcIjogNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJmb3Jlc3RncmVlblwiOiB7XCJyXCI6IDM0LCBcImdcIjogMTM5LCBcImJcIjogMzQsIFwiaFwiOiAxMjAsIFwic1wiOiA2MSwgXCJsXCI6IDM0fSxcbiAgICBcImdhaW5zYm9yb1wiOiB7XCJyXCI6IDIyMCwgXCJnXCI6IDIyMCwgXCJiXCI6IDIyMCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogODZ9LFxuICAgIFwiZ2hvc3R3aGl0ZVwiOiB7XCJyXCI6IDI0OCwgXCJnXCI6IDI0OCwgXCJiXCI6IDI1NSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk5fSxcbiAgICBcImdvbGRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMTUsIFwiYlwiOiAwLCBcImhcIjogNTEsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJnb2xkZW5yb2RcIjoge1wiclwiOiAyMTgsIFwiZ1wiOiAxNjUsIFwiYlwiOiAzMiwgXCJoXCI6IDQzLCBcInNcIjogNzQsIFwibFwiOiA0OX0sXG4gICAgXCJncmVlbnllbGxvd1wiOiB7XCJyXCI6IDE3MywgXCJnXCI6IDI1NSwgXCJiXCI6IDQ3LCBcImhcIjogODQsIFwic1wiOiAxMDAsIFwibFwiOiA1OX0sXG4gICAgXCJncmV5XCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA1MH0sXG4gICAgXCJob25leWRld1wiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI0MCwgXCJoXCI6IDEyMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImhvdHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxODAsIFwiaFwiOiAzMzAsIFwic1wiOiAxMDAsIFwibFwiOiA3MX0sXG4gICAgXCJpbmRpYW5yZWRcIjoge1wiclwiOiAyMDUsIFwiZ1wiOiA5MiwgXCJiXCI6IDkyLCBcImhcIjogMCwgXCJzXCI6IDUzLCBcImxcIjogNTh9LFxuICAgIFwiaW5kaWdvXCI6IHtcInJcIjogNzUsIFwiZ1wiOiAwLCBcImJcIjogMTMwLCBcImhcIjogMjc1LCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiaXZvcnlcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiA2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImtoYWtpXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjMwLCBcImJcIjogMTQwLCBcImhcIjogNTQsIFwic1wiOiA3NywgXCJsXCI6IDc1fSxcbiAgICBcImxhdmVuZGVyXCI6IHtcInJcIjogMjMwLCBcImdcIjogMjMwLCBcImJcIjogMjUwLCBcImhcIjogMjQwLCBcInNcIjogNjcsIFwibFwiOiA5NH0sXG4gICAgXCJsYXZlbmRlcmJsdXNoXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQwLCBcImJcIjogMjQ1LCBcImhcIjogMzQwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwibGF3bmdyZWVuXCI6IHtcInJcIjogMTI0LCBcImdcIjogMjUyLCBcImJcIjogMCwgXCJoXCI6IDkwLCBcInNcIjogMTAwLCBcImxcIjogNDl9LFxuICAgIFwibGVtb25jaGlmZm9uXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjA1LCBcImhcIjogNTQsIFwic1wiOiAxMDAsIFwibFwiOiA5MH0sXG4gICAgXCJsaWdodGJsdWVcIjoge1wiclwiOiAxNzMsIFwiZ1wiOiAyMTYsIFwiYlwiOiAyMzAsIFwiaFwiOiAxOTUsIFwic1wiOiA1MywgXCJsXCI6IDc5fSxcbiAgICBcImxpZ2h0Y29yYWxcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMjgsIFwiaFwiOiAwLCBcInNcIjogNzksIFwibFwiOiA3Mn0sXG4gICAgXCJsaWdodGN5YW5cIjoge1wiclwiOiAyMjQsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiA5NH0sXG4gICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiB7XCJyXCI6IDI1MCwgXCJnXCI6IDI1MCwgXCJiXCI6IDIxMCwgXCJoXCI6IDYwLCBcInNcIjogODAsIFwibFwiOiA5MH0sXG4gICAgXCJsaWdodGdyYXlcIjoge1wiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDgzfSxcbiAgICBcImxpZ2h0Z3JlZW5cIjoge1wiclwiOiAxNDQsIFwiZ1wiOiAyMzgsIFwiYlwiOiAxNDQsIFwiaFwiOiAxMjAsIFwic1wiOiA3MywgXCJsXCI6IDc1fSxcbiAgICBcImxpZ2h0Z3JleVwiOiB7XCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogODN9LFxuICAgIFwibGlnaHRwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTgyLCBcImJcIjogMTkzLCBcImhcIjogMzUxLCBcInNcIjogMTAwLCBcImxcIjogODZ9LFxuICAgIFwibGlnaHRzYWxtb25cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNjAsIFwiYlwiOiAxMjIsIFwiaFwiOiAxNywgXCJzXCI6IDEwMCwgXCJsXCI6IDc0fSxcbiAgICBcImxpZ2h0c2VhZ3JlZW5cIjoge1wiclwiOiAzMiwgXCJnXCI6IDE3OCwgXCJiXCI6IDE3MCwgXCJoXCI6IDE3NywgXCJzXCI6IDcwLCBcImxcIjogNDF9LFxuICAgIFwibGlnaHRza3libHVlXCI6IHtcInJcIjogMTM1LCBcImdcIjogMjA2LCBcImJcIjogMjUwLCBcImhcIjogMjAzLCBcInNcIjogOTIsIFwibFwiOiA3NX0sXG4gICAgXCJsaWdodHNsYXRlZ3JheVwiOiB7XCJyXCI6IDExOSwgXCJnXCI6IDEzNiwgXCJiXCI6IDE1MywgXCJoXCI6IDIxMCwgXCJzXCI6IDE0LCBcImxcIjogNTN9LFxuICAgIFwibGlnaHRzbGF0ZWdyZXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAyMTAsIFwic1wiOiAxNCwgXCJsXCI6IDUzfSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcInJcIjogMTc2LCBcImdcIjogMTk2LCBcImJcIjogMjIyLCBcImhcIjogMjE0LCBcInNcIjogNDEsIFwibFwiOiA3OH0sXG4gICAgXCJsaWdodHllbGxvd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDIyNCwgXCJoXCI6IDYwLCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibGltZWdyZWVuXCI6IHtcInJcIjogNTAsIFwiZ1wiOiAyMDUsIFwiYlwiOiA1MCwgXCJoXCI6IDEyMCwgXCJzXCI6IDYxLCBcImxcIjogNTB9LFxuICAgIFwibGluZW5cIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNDAsIFwiYlwiOiAyMzAsIFwiaFwiOiAzMCwgXCJzXCI6IDY3LCBcImxcIjogOTR9LFxuICAgIFwibWFnZW50YVwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1LCBcImhcIjogMTcsXCJzXCI6IDEwMCxcImxcIjogNzR9LFxuICAgIFwibWVkaXVtYXF1YW1hcmluZVwiOiB7XCJyXCI6IDEwMiwgXCJnXCI6IDIwNSwgXCJiXCI6IDE3MCwgXCJoXCI6IDE2MCwgXCJzXCI6IDUxLCBcImxcIjogNjB9LFxuICAgIFwibWVkaXVtYmx1ZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAwLCBcImJcIjogMjA1LCBcImhcIjogMjQwLCBcInNcIjogMTAwLCBcImxcIjogNDB9LFxuICAgIFwibWVkaXVtb3JjaGlkXCI6IHtcInJcIjogMTg2LCBcImdcIjogODUsIFwiYlwiOiAyMTEsIFwiaFwiOiAyODgsIFwic1wiOiA1OSwgXCJsXCI6IDU4fSxcbiAgICBcIm1lZGl1bXB1cnBsZVwiOiB7XCJyXCI6IDE0NywgXCJnXCI6IDExMiwgXCJiXCI6IDIxOSwgXCJoXCI6IDI2MCwgXCJzXCI6IDYwLCBcImxcIjogNjV9LFxuICAgIFwibWVkaXVtc2VhZ3JlZW5cIjoge1wiclwiOiA2MCwgXCJnXCI6IDE3OSwgXCJiXCI6IDExMywgXCJoXCI6IDE0NywgXCJzXCI6IDUwLCBcImxcIjogNDd9LFxuICAgIFwibWVkaXVtc2xhdGVibHVlXCI6IHtcInJcIjogMTIzLCBcImdcIjogMTA0LCBcImJcIjogMjM4LCBcImhcIjogMjQ5LCBcInNcIjogODAsIFwibFwiOiA2N30sXG4gICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAxNTQsIFwiaFwiOiAxNTcsIFwic1wiOiAxMDAsIFwibFwiOiA0OX0sXG4gICAgXCJtZWRpdW10dXJxdW9pc2VcIjoge1wiclwiOiA3MiwgXCJnXCI6IDIwOSwgXCJiXCI6IDIwNCwgXCJoXCI6IDE3OCwgXCJzXCI6IDYwLCBcImxcIjogNTV9LFxuICAgIFwibWVkaXVtdmlvbGV0cmVkXCI6IHtcInJcIjogMTk5LCBcImdcIjogMjEsIFwiYlwiOiAxMzMsIFwiaFwiOiAzMjIsIFwic1wiOiA4MSwgXCJsXCI6IDQzfSxcbiAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiB7XCJyXCI6IDI1LCBcImdcIjogMjUsIFwiYlwiOiAxMTIsIFwiaFwiOiAyNDAsIFwic1wiOiA2NCwgXCJsXCI6IDI3fSxcbiAgICBcIm1pbnRjcmVhbVwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1MCwgXCJoXCI6IDE1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk4fSxcbiAgICBcIm1pc3R5cm9zZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDIyNSwgXCJoXCI6IDYsIFwic1wiOiAxMDAsIFwibFwiOiA5NH0sXG4gICAgXCJtb2NjYXNpblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE4MSwgXCJoXCI6IDM4LCBcInNcIjogMTAwLCBcImxcIjogODV9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjIsIFwiYlwiOiAxNzMsIFwiaFwiOiAzNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDg0fSxcbiAgICBcIm9sZGxhY2VcIjoge1wiclwiOiAyNTMsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMzAsIFwiaFwiOiAzOSwgXCJzXCI6IDg1LCBcImxcIjogOTV9LFxuICAgIFwib2xpdmVkcmFiXCI6IHtcInJcIjogMTA3LCBcImdcIjogMTQyLCBcImJcIjogMzUsIFwiaFwiOiA4MCwgXCJzXCI6IDYwLCBcImxcIjogMzV9LFxuICAgIFwib3JhbmdlcmVkXCI6IHtcInJcIjogMjU1LCBcImdcIjogNjksIFwiYlwiOiAwLCBcImhcIjogMTYsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJvcmNoaWRcIjoge1wiclwiOiAyMTgsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTQsIFwiaFwiOiAzMDIsIFwic1wiOiA1OSwgXCJsXCI6IDY1fSxcbiAgICBcInBhbGVnb2xkZW5yb2RcIjoge1wiclwiOiAyMzgsIFwiZ1wiOiAyMzIsIFwiYlwiOiAxNzAsIFwiaFwiOiA1NSwgXCJzXCI6IDY3LCBcImxcIjogODB9LFxuICAgIFwicGFsZWdyZWVuXCI6IHtcInJcIjogMTUyLCBcImdcIjogMjUxLCBcImJcIjogMTUyLCBcImhcIjogMTIwLCBcInNcIjogOTMsIFwibFwiOiA3OX0sXG4gICAgXCJwYWxldHVycXVvaXNlXCI6IHtcInJcIjogMTc1LCBcImdcIjogMjM4LCBcImJcIjogMjM4LCBcImhcIjogMTgwLCBcInNcIjogNjUsIFwibFwiOiA4MX0sXG4gICAgXCJwYWxldmlvbGV0cmVkXCI6IHtcInJcIjogMjE5LCBcImdcIjogMTEyLCBcImJcIjogMTQ3LCBcImhcIjogMzQwLCBcInNcIjogNjAsIFwibFwiOiA2NX0sXG4gICAgXCJwYXBheWF3aGlwXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjM5LCBcImJcIjogMjEzLCBcImhcIjogMzcsIFwic1wiOiAxMDAsIFwibFwiOiA5Mn0sXG4gICAgXCJwZWFjaHB1ZmZcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMTgsIFwiYlwiOiAxODUsIFwiaFwiOiAyOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg2fSxcbiAgICBcInBlcnVcIjoge1wiclwiOiAyMDUsIFwiZ1wiOiAxMzMsIFwiYlwiOiA2MywgXCJoXCI6IDMwLCBcInNcIjogNTksIFwibFwiOiA1M30sXG4gICAgXCJwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTkyLCBcImJcIjogMjAzLCBcImhcIjogMzUwLCBcInNcIjogMTAwLCBcImxcIjogODh9LFxuICAgIFwicGx1bVwiOiB7XCJyXCI6IDIyMSwgXCJnXCI6IDE2MCwgXCJiXCI6IDIyMSwgXCJoXCI6IDMwMCwgXCJzXCI6IDQ3LCBcImxcIjogNzV9LFxuICAgIFwicG93ZGVyYmx1ZVwiOiB7XCJyXCI6IDE3NiwgXCJnXCI6IDIyNCwgXCJiXCI6IDIzMCwgXCJoXCI6IDE4NywgXCJzXCI6IDUyLCBcImxcIjogODB9LFxuICAgIFwicm9zeWJyb3duXCI6IHtcInJcIjogMTg4LCBcImdcIjogMTQzLCBcImJcIjogMTQzLCBcImhcIjogMCwgXCJzXCI6IDI1LCBcImxcIjogNjV9LFxuICAgIFwicm95YWxibHVlXCI6IHtcInJcIjogNjUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAyMjUsIFwiaFwiOiAyMjUsIFwic1wiOiA3MywgXCJsXCI6IDU3fSxcbiAgICBcInNhZGRsZWJyb3duXCI6IHtcInJcIjogMTM5LCBcImdcIjogNjksIFwiYlwiOiAxOSwgXCJoXCI6IDI1LCBcInNcIjogNzYsIFwibFwiOiAzMX0sXG4gICAgXCJzYWxtb25cIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxMTQsIFwiaFwiOiA2LCBcInNcIjogOTMsIFwibFwiOiA3MX0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcInJcIjogMjQ0LCBcImdcIjogMTY0LCBcImJcIjogOTYsIFwiaFwiOiAyOCwgXCJzXCI6IDg3LCBcImxcIjogNjd9LFxuICAgIFwic2VhZ3JlZW5cIjoge1wiclwiOiA0NiwgXCJnXCI6IDEzOSwgXCJiXCI6IDg3LCBcImhcIjogMTQ2LCBcInNcIjogNTAsIFwibFwiOiAzNn0sXG4gICAgXCJzZWFzaGVsbFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0NSwgXCJiXCI6IDIzOCwgXCJoXCI6IDI1LCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwic2llbm5hXCI6IHtcInJcIjogMTYwLCBcImdcIjogODIsIFwiYlwiOiA0NSwgXCJoXCI6IDE5LCBcInNcIjogNTYsIFwibFwiOiA0MH0sXG4gICAgXCJza3libHVlXCI6IHtcInJcIjogMTM1LCBcImdcIjogMjA2LCBcImJcIjogMjM1LCBcImhcIjogMTk3LCBcInNcIjogNzEsIFwibFwiOiA3M30sXG4gICAgXCJzbGF0ZWJsdWVcIjoge1wiclwiOiAxMDYsIFwiZ1wiOiA5MCwgXCJiXCI6IDIwNSwgXCJoXCI6IDI0OCwgXCJzXCI6IDUzLCBcImxcIjogNTh9LFxuICAgIFwic2xhdGVncmF5XCI6IHtcInJcIjogMTEyLCBcImdcIjogMTI4LCBcImJcIjogMTQ0LCBcImhcIjogMjEwLCBcInNcIjogMTMsIFwibFwiOiA1MH0sXG4gICAgXCJzbGF0ZWdyZXlcIjoge1wiclwiOiAxMTIsIFwiZ1wiOiAxMjgsIFwiYlwiOiAxNDQsIFwiaFwiOiAyMTAsIFwic1wiOiAxMywgXCJsXCI6IDUwfSxcbiAgICBcInNub3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyNTAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogOTl9LFxuICAgIFwic3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMTI3LCBcImhcIjogMTUwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwic3RlZWxibHVlXCI6IHtcInJcIjogNzAsIFwiZ1wiOiAxMzAsIFwiYlwiOiAxODAsIFwiaFwiOiAyMDcsIFwic1wiOiA0NCwgXCJsXCI6IDQ5fSxcbiAgICBcInRhblwiOiB7XCJyXCI6IDIxMCwgXCJnXCI6IDE4MCwgXCJiXCI6IDE0MCwgXCJoXCI6IDM0LCBcInNcIjogNDQsIFwibFwiOiA2OX0sXG4gICAgXCJ0aGlzdGxlXCI6IHtcInJcIjogMjE2LCBcImdcIjogMTkxLCBcImJcIjogMjE2LCBcImhcIjogMzAwLCBcInNcIjogMjQsIFwibFwiOiA4MH0sXG4gICAgXCJ0b21hdG9cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiA5OSwgXCJiXCI6IDcxLCBcImhcIjogOSwgXCJzXCI6IDEwMCwgXCJsXCI6IDY0fSxcbiAgICBcInR1cnF1b2lzZVwiOiB7XCJyXCI6IDY0LCBcImdcIjogMjI0LCBcImJcIjogMjA4LCBcImhcIjogMTc0LCBcInNcIjogNzIsIFwibFwiOiA1Nn0sXG4gICAgXCJ2aW9sZXRcIjoge1wiclwiOiAyMzgsIFwiZ1wiOiAxMzAsIFwiYlwiOiAyMzgsIFwiaFwiOiAzMDAsIFwic1wiOiA3NiwgXCJsXCI6IDcyfSxcbiAgICBcIndoZWF0XCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjIyLCBcImJcIjogMTc5LCBcImhcIjogMzksIFwic1wiOiA3NywgXCJsXCI6IDgzfSxcbiAgICBcIndoaXRlc21va2VcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyNDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDk2fSxcbiAgICBcInllbGxvd2dyZWVuXCI6IHtcInJcIjogMTU0LCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiA4MCwgXCJzXCI6IDYxLCBcImxcIjogNTB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG91cjtcbiIsInJlcXVpcmUoJy4vLi4vdGVzdHMvY29sb3VyLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2hlbHBlcnMuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvZGF0YS9jb2xvcnMuanMnKTtcbiIsInZhciBDb2xvdXIgPSByZXF1aXJlKCcuLi9zcmMvY29sb3VyLmpzJyk7XG52YXIgbmFtZWQgPSByZXF1aXJlKCcuL2RhdGEvY29sb3JzLmpzJyk7XG52YXIgbmVhcmx5RXF1YWwgPSByZXF1aXJlKCcuL2hlbHBlcnMuanMnKVsnbmVhcmx5RXF1YWwnXTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnQ29sb3VyJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgYmx1ZSwgcmdiLCByZ2JhLCBoc2wsIGhzbGEsIHJnYl9wZXIsIHJnYl9iYWQxLCByZ2JfYmFkMiwgcmdiX2JhZDMsIGhzbF9iYWQxLCBoc2xfYmFkMjtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICByZWQgPSBuZXcgQ29sb3VyKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvdXIoXCIjMEYwXCIpOyAvLyBOYW1lZCBjb2xvciAnZ3JlZW4nIGlzIHJnYigwLDEyOCwwKVxuICAgICAgICBibHVlID0gbmV3IENvbG91cihcImJsdWVcIik7XG4gICAgICAgIHJnYiA9IG5ldyBDb2xvdXIoXCJyZ2IoMSwgNywgMjkpXCIpO1xuICAgICAgICByZ2JhID0gbmV3IENvbG91cihcInJnYmEoMSwgNywgMjksIDAuMylcIik7XG4gICAgICAgIHJnYl9wZXIgPSBuZXcgQ29sb3VyKFwicmdiYSgxMDAlLCAwJSwgMCUsIDEpXCIpO1xuICAgICAgICBoc2wgPSBuZXcgQ29sb3VyKFwiaHNsKDAsIDEwMCUsIDUwJSlcIik7XG4gICAgICAgIGhzbGEgPSBuZXcgQ29sb3VyKFwiaHNsYSgwLCAxMDAlLCA1MCUsIDAuMyApXCIpO1xuXG4gICAgICAgIC8vIFRoZXNlIGFyZSBwb29ybHkgZm9ybWF0dGVkIGNvbG9ycywgYnV0IHRoZXkgc2hvdWxkIHN0aWxsIHdvcmsuXG4gICAgICAgIHJnYl9iYWQxID0gbmV3IENvbG91cihcInJnYigzMDAsMCwwKVwiKTtcbiAgICAgICAgcmdiX2JhZDIgPSBuZXcgQ29sb3VyKFwicmdiKDI1NSwtMTAsMClcIik7XG4gICAgICAgIHJnYl9iYWQzID0gbmV3IENvbG91cihcInJnYmEoMTEwJSwgMCUsIDAlLCAyKVwiKTtcbiAgICAgICAgaHNsX2JhZDEgPSBuZXcgQ29sb3VyKFwiaHNsKDcyMCwgMTIwJSwgMTIwJSlcIik7XG4gICAgICAgIGhzbF9iYWQyID0gbmV3IENvbG91cihcImhzbCgtNzIwLCAtMTIwJSwgLTEyMCUpXCIpO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgncmdiJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuciwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5nLCA3KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLmIsIDI5KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IuYWxwaGEsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYmEucmdiLnIsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYmEucmdiLmcsIDcpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYmEucmdiLmIsIDI5KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZ2JhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JfcGVyLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYl9wZXIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYl9wZXIucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYl9iYWQxLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYl9iYWQxLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JfYmFkMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiX2JhZDIucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiX2JhZDIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYl9iYWQyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JfYmFkMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JfYmFkMy5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiX2JhZDMucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYl9iYWQzLmFscGhhLCAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yICh2YXIgY29sb3IgaW4gbmFtZWQpe1xuICAgICAgICAgICAgICAgIGlmIChuYW1lZC5oYXNPd25Qcm9wZXJ0eShjb2xvcikpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBDb2xvdXIoY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGV4ID0gbmV3IENvbG91cihuYW1lZFtjb2xvcl0uaGV4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVkX3JnYiA9IG5hbWVkW2NvbG9yXS5yZ2I7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBoZXgucmdiLnIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuZywgaGV4LnJnYi5nKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmIsIGhleC5yZ2IuYik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBuYW1lZF9yZ2Iucik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5nLCBuYW1lZF9yZ2IuZyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5iLCBuYW1lZF9yZ2IuYik7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2hzbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5sLCA1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbC5oc2wucywgMTAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmwsIDUwKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2wuYWxwaGEsIDEpKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYS5oc2wubCwgNTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKGhzbGEuYWxwaGEsIDAuMykpO1xuXG4gICAgICAgICAgICAvLyBhc3NlcnQuZXF1YWwoaHNsX2JhZDEuciwgMjU1KTtcbiAgICAgICAgICAgIC8vIGFzc2VydC5lcXVhbChoc2xfYmFkMS5nLCAyNTUpO1xuICAgICAgICAgICAgLy8gYXNzZXJ0LmVxdWFsKGhzbF9iYWQxLmIsIDI1NSk7XG4gICAgICAgICAgICAvLyBhc3NlcnQuZXF1YWwoaHNsX2JhZDIuciwgMjU1KTtcbiAgICAgICAgICAgIC8vIGFzc2VydC5lcXVhbChoc2xfYmFkMi5nLCAyNTUpO1xuICAgICAgICAgICAgLy8gYXNzZXJ0LmVxdWFsKGhzbF9iYWQyLmIsIDI1NSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciAodmFyIGNvbG9yIGluIG5hbWVkKXtcbiAgICAgICAgICAgICAgICBpZiAobmFtZWQuaGFzT3duUHJvcGVydHkoY29sb3IpKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBuZXcgQ29sb3VyKGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhleCA9IG5ldyBDb2xvdXIobmFtZWRbY29sb3JdLmhleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lZF9oc2wgPSBuYW1lZFtjb2xvcl0ucmdiO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgaGV4LnJnYi5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIGhleC5yZ2Iucyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5sLCBoZXgucmdiLmwpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgbmFtZWRfaHNsLmgpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IucywgbmFtZWRfaHNsLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgbmFtZWRfaHNsLmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FscGhhJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZWQuYWxwaGEsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZ2JhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2xhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdsaWdodGVuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciByMyA9IHJlZC5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4ubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgZzMgPSBncmVlbi5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGIzID0gYmx1ZS5saWdodGVuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZGFya2VuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIHIyID0gcmVkLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQuZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgZzIgPSBncmVlbi5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4uZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciBiMiA9IGJsdWUuZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUuZGFya2VuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuZywgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5nLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5iLCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RvU3RyaW5nJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC50b1N0cmluZygpO1xuICAgICAgICAgICAgdmFyIGcxID0gZ3JlZW4udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciByZ2IxID0gcmdiLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB2YXIgcmdiYTEgPSByZ2JhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB2YXIgaHNsMSA9IGhzbC50b1N0cmluZygpO1xuICAgICAgICAgICAgdmFyIGhzbGExID0gaHNsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEudG9Mb3dlckNhc2UoKSwgXCIjZmYwMDAwXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnRvTG93ZXJDYXNlKCksIFwiIzAwZmYwMFwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS50b0xvd2VyQ2FzZSgpLCBcIiMwMDAwZmZcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiMS50b0xvd2VyQ2FzZSgpLCBcIiMwMTA3MWRcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYTEudG9Mb3dlckNhc2UoKSwgXCIjMDEwNzFkXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbDEudG9Mb3dlckNhc2UoKSwgXCIjZmYwMDAwXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGExLnRvTG93ZXJDYXNlKCksIFwiI2ZmMDAwMFwiKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJ2YXIgbmFtZWRjb2xvcnMgPSB7XG4gICAgXCJhbGljZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogMCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjBmOGZmXCJ9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyMzUsXCJiXCI6IDIxNSB9LCBcImhleFwiOiBcIiNmYWViZDdcIn0sXG4gICAgXCJhcXVhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiYXF1YW1hcmluZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiAxMDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjcsXCJnXCI6IDI1NSxcImJcIjogMjEyIH0sIFwiaGV4XCI6IFwiIzdmZmZkNFwifSxcbiAgICBcImF6dXJlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2YwZmZmZlwifSxcbiAgICBcImJlaWdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2Y1ZjVkY1wifSxcbiAgICBcImJpc3F1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMTk2IH0sIFwiaGV4XCI6IFwiI2ZmZTRjNFwifSxcbiAgICBcImJsYWNrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDAwMDAwXCJ9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMzUsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiNmZmViY2RcIn0sXG4gICAgXCJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMDAwZmZcIn0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMTM4LFwiZ1wiOiA0MyxcImJcIjogMjI2IH0sIFwiaGV4XCI6IFwiIzhhMmJlMlwifSxcbiAgICBcImJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTY1LFwiZ1wiOiA0MixcImJcIjogNDIgfSwgXCJoZXhcIjogXCIjYTUyYTJhXCJ9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMixcImdcIjogMTg0LFwiYlwiOiAxMzUgfSwgXCJoZXhcIjogXCIjZGViODg3XCJ9LFxuICAgIFwiY2FkZXRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDk1LFwiZ1wiOiAxNTgsXCJiXCI6IDE2MCB9LCBcImhleFwiOiBcIiM1ZjllYTBcIn0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNyxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzdmZmYwMFwifSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTAsXCJnXCI6IDEwNSxcImJcIjogMzAgfSwgXCJoZXhcIjogXCIjZDI2OTFlXCJ9LFxuICAgIFwiY29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDEyNyxcImJcIjogODAgfSwgXCJoZXhcIjogXCIjZmY3ZjUwXCJ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjA4LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTAwLFwiZ1wiOiAxNDksXCJiXCI6IDIzNyB9LCBcImhleFwiOiBcIiM2NDk1ZWRcIn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNzgsXCJsXCI6IDkxIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDgsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNmZmY4ZGNcIn0sXG4gICAgXCJjcmltc29uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2MCxcInNcIjogMTAwLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjAsXCJiXCI6IDYwIH0sIFwiaGV4XCI6IFwiI2RjMTQzY1wifSxcbiAgICBcImN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDU2LFwibFwiOiA5MSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiMwMDAwOGJcIn0sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA4OCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEzOSxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzAwOGI4YlwifSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMzYsXCJzXCI6IDEwMCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxODQsXCJnXCI6IDEzNCxcImJcIjogMTEgfSwgXCJoZXhcIjogXCIjYjg4NjBiXCJ9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjcxLFwic1wiOiA3NixcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjksXCJnXCI6IDE2OSxcImJcIjogMTY5IH0sIFwiaGV4XCI6IFwiI2E5YTlhOVwifSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA1OSxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA2NDAwXCJ9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDU3LFwibFwiOiA3MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE2OSxcImdcIjogMTY5LFwiYlwiOiAxNjkgfSwgXCJoZXhcIjogXCIjYTlhOWE5XCJ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MixcInNcIjogMjUsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTg5LFwiZ1wiOiAxODMsXCJiXCI6IDEwNyB9LCBcImhleFwiOiBcIiNiZGI3NmJcIn0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiA5MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOSxcImdcIjogMCxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzhiMDA4YlwifSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NSxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiA4NSxcImdcIjogMTA3LFwiYlwiOiA0NyB9LCBcImhleFwiOiBcIiM1NTZiMmZcIn0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY4YzAwXCJ9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTksXCJzXCI6IDc5LFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE1MyxcImdcIjogNTAsXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM5OTMyY2NcIn0sXG4gICAgXCJkYXJrcmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQ4LFwic1wiOiAxMDAsXCJsXCI6IDkzIH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzhiMDAwMFwifSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogMzQ4LFwic1wiOiA4MyxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzMsXCJnXCI6IDE1MCxcImJcIjogMTIyIH0sIFwiaGV4XCI6IFwiI2U5OTY3YVwifSxcbiAgICBcImRhcmtzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDMsXCJnXCI6IDE4OCxcImJcIjogMTQzIH0sIFwiaGV4XCI6IFwiIzhmYmM4ZlwifSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogNzIsXCJnXCI6IDYxLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjNDgzZDhiXCJ9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogODksXCJsXCI6IDM4IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiAyMCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDIwNixcImJcIjogMjA5IH0sIFwiaGV4XCI6IFwiIzAwY2VkMVwifSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDgsXCJnXCI6IDAsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiM5NDAwZDNcIn0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiA1NixcInNcIjogMzgsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMCxcImJcIjogMTQ3IH0sIFwiaGV4XCI6IFwiI2ZmMTQ5M1wifSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDE5MSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwYmZmZlwifSxcbiAgICBcImRpbWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogODIsXCJzXCI6IDM5LFwibFwiOiAzMCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZGltZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDMwLFwiZ1wiOiAxNDQsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMxZTkwZmZcIn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDE3OCxcImdcIjogMzQsXCJiXCI6IDM0IH0sIFwiaGV4XCI6IFwiI2IyMjIyMlwifSxcbiAgICBcImZsb3JhbHdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1LFwic1wiOiA3MixcImxcIjogNzAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2ZmZmFmMFwifSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMzQsXCJnXCI6IDEzOSxcImJcIjogMzQgfSwgXCJoZXhcIjogXCIjMjI4YjIyXCJ9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDgsXCJzXCI6IDM5LFwibFwiOiAzOSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcImdhaW5zYm9yb1wiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjIwLFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZGNkY2RjXCJ9LFxuICAgIFwiZ2hvc3R3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0OCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjhmOGZmXCJ9LFxuICAgIFwiZ29sZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODEsXCJzXCI6IDEwMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIxNSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmQ3MDBcIn0sXG4gICAgXCJnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMjgyLFwic1wiOiAxMDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxNjUsXCJiXCI6IDMyIH0sIFwiaGV4XCI6IFwiI2RhYTUyMFwifSxcbiAgICBcImdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzI4LFwic1wiOiAxMDAsXCJsXCI6IDU0IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDgwODBcIn0sXG4gICAgXCJncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA4MDAwXCJ9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDI1NSxcImJcIjogNDcgfSwgXCJoZXhcIjogXCIjYWRmZjJmXCJ9LFxuICAgIFwiZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODA4MDgwXCJ9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxMDAsXCJsXCI6IDU2IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNTUsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmMGZmZjBcIn0sXG4gICAgXCJob3RwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDY4LFwibFwiOiA0MiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTA1LFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjZmY2OWI0XCJ9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjA1LFwiZ1wiOiA5MixcImJcIjogOTIgfSwgXCJoZXhcIjogXCIjY2Q1YzVjXCJ9LFxuICAgIFwiaW5kaWdvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNjEsXCJsXCI6IDM0IH0sIFwicmdiXCI6IHtcInJcIjogNzUsXCJnXCI6IDAsXCJiXCI6IDEzMCB9LCBcImhleFwiOiBcIiM0YjAwODJcIn0sXG4gICAgXCJpdm9yeVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZmZmZmYwXCJ9LFxuICAgIFwia2hha2lcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDk5IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyMzAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNmMGU2OGNcIn0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJoc2xcIjoge1wiaFwiOiA1MSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIzMCxcImdcIjogMjMwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZTZlNmZhXCJ9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogNzQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDAsXCJiXCI6IDI0NSB9LCBcImhleFwiOiBcIiNmZmYwZjVcIn0sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogODQsXCJzXCI6IDEwMCxcImxcIjogNTkgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjQsXCJnXCI6IDI1MixcImJcIjogMCB9LCBcImhleFwiOiBcIiM3Y2ZjMDBcIn0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiI2ZmZmFjZFwifSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDIxNixcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2FkZDhlNlwifSxcbiAgICBcImxpZ2h0Y29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzMwLFwic1wiOiAxMDAsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiNmMDgwODBcIn0sXG4gICAgXCJsaWdodGN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNTMsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjI0LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNlMGZmZmZcIn0sXG4gICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyNzUsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDI1MCxcImJcIjogMjEwIH0sIFwiaGV4XCI6IFwiI2ZhZmFkMlwifSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMSxcImdcIjogMjExLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjZDNkM2QzXCJ9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA1NCxcInNcIjogNzcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTQ0LFwiZ1wiOiAyMzgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM5MGVlOTBcIn0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiA2NyxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTEsXCJnXCI6IDIxMSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2QzZDNkM1wifSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE4MixcImJcIjogMTkzIH0sIFwiaGV4XCI6IFwiI2ZmYjZjMVwifSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDkwLFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNjAsXCJiXCI6IDEyMiB9LCBcImhleFwiOiBcIiNmZmEwN2FcIn0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU0LFwic1wiOiAxMDAsXCJsXCI6IDkwIH0sIFwicmdiXCI6IHtcInJcIjogMzIsXCJnXCI6IDE3OCxcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiIzIwYjJhYVwifSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDUzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDEzNSxcImdcIjogMjA2LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjODdjZWZhXCJ9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNzksXCJsXCI6IDcyIH0sIFwicmdiXCI6IHtcInJcIjogMTE5LFwiZ1wiOiAxMzYsXCJiXCI6IDE1MyB9LCBcImhleFwiOiBcIiM3Nzg4OTlcIn0sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTksXCJnXCI6IDEzNixcImJcIjogMTUzIH0sIFwiaGV4XCI6IFwiIzc3ODg5OVwifSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiA4MCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzYsXCJnXCI6IDE5NixcImJcIjogMjIyIH0sIFwiaGV4XCI6IFwiI2IwYzRkZVwifSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDIyNCB9LCBcImhleFwiOiBcIiNmZmZmZTBcIn0sXG4gICAgXCJsaW1lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNzMsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwZmYwMFwifSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDUwLFwiZ1wiOiAyMDUsXCJiXCI6IDUwIH0sIFwiaGV4XCI6IFwiIzMyY2QzMlwifSxcbiAgICBcImxpbmVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM1MSxcInNcIjogMTAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjQwLFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjZmFmMGU2XCJ9LFxuICAgIFwibWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNyxcInNcIjogMTAwLFwibFwiOiA3NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcIm1hcm9vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzcsXCJzXCI6IDcwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4MDAwMDBcIn0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwMyxcInNcIjogOTIsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTAyLFwiZ1wiOiAyMDUsXCJiXCI6IDE3MCB9LCBcImhleFwiOiBcIiM2NmNkYWFcIn0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTQsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiIzAwMDBjZFwifSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDE0LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDE4NixcImdcIjogODUsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNiYTU1ZDNcIn0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMjE0LFwic1wiOiA0MSxcImxcIjogNzggfSwgXCJyZ2JcIjoge1wiclwiOiAxNDcsXCJnXCI6IDExMixcImJcIjogMjE5IH0sIFwiaGV4XCI6IFwiIzkzNzBkYlwifSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogNjAsXCJnXCI6IDE3OSxcImJcIjogMTEzIH0sIFwiaGV4XCI6IFwiIzNjYjM3MVwifSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyMyxcImdcIjogMTA0LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjN2I2OGVlXCJ9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDY3LFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1MCxcImJcIjogMTU0IH0sIFwiaGV4XCI6IFwiIzAwZmE5YVwifSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNjAsXCJzXCI6IDUxLFwibFwiOiA2MCB9LCBcInJnYlwiOiB7XCJyXCI6IDcyLFwiZ1wiOiAyMDksXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM0OGQxY2NcIn0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDQwIH0sIFwicmdiXCI6IHtcInJcIjogMTk5LFwiZ1wiOiAyMSxcImJcIjogMTMzIH0sIFwiaGV4XCI6IFwiI2M3MTU4NVwifSxcbiAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODgsXCJzXCI6IDU5LFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1LFwiZ1wiOiAyNSxcImJcIjogMTEyIH0sIFwiaGV4XCI6IFwiIzE5MTk3MFwifSxcbiAgICBcIm1pbnRjcmVhbVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNjAsXCJzXCI6IDYwLFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjU1LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZjVmZmZhXCJ9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NyxcInNcIjogNTAsXCJsXCI6IDQ3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDIyNSB9LCBcImhleFwiOiBcIiNmZmU0ZTFcIn0sXG4gICAgXCJtb2NjYXNpblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDksXCJzXCI6IDgwLFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAxODEgfSwgXCJoZXhcIjogXCIjZmZlNGI1XCJ9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTU3LFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjIsXCJiXCI6IDE3MyB9LCBcImhleFwiOiBcIiNmZmRlYWRcIn0sXG4gICAgXCJuYXZ5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3OCxcInNcIjogNjAsXCJsXCI6IDU1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzAwMDA4MFwifSxcbiAgICBcIm9sZGxhY2VcIjoge1wiaHNsXCI6IHtcImhcIjogMzIyLFwic1wiOiA4MSxcImxcIjogNDMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTMsXCJnXCI6IDI0NSxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2ZkZjVlNlwifSxcbiAgICBcIm9saXZlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogNjQsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjODA4MDAwXCJ9LFxuICAgIFwib2xpdmVkcmFiXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1MCxcInNcIjogMTAwLFwibFwiOiA5OCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNyxcImdcIjogMTQyLFwiYlwiOiAzNSB9LCBcImhleFwiOiBcIiM2YjhlMjNcIn0sXG4gICAgXCJvcmFuZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTY1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmYTUwMFwifSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOCxcInNcIjogMTAwLFwibFwiOiA4NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogNjksXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY0NTAwXCJ9LFxuICAgIFwib3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM2LFwic1wiOiAxMDAsXCJsXCI6IDg0IH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxMTIsXCJiXCI6IDIxNCB9LCBcImhleFwiOiBcIiNkYTcwZDZcIn0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA4NSxcImxcIjogOTUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDIzMixcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiI2VlZThhYVwifSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MCxcInNcIjogNjAsXCJsXCI6IDM1IH0sIFwicmdiXCI6IHtcInJcIjogMTUyLFwiZ1wiOiAyNTEsXCJiXCI6IDE1MiB9LCBcImhleFwiOiBcIiM5OGZiOThcIn0sXG4gICAgXCJwYWxldHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTc1LFwiZ1wiOiAyMzgsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNhZmVlZWVcIn0sXG4gICAgXCJwYWxldmlvbGV0cmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMixcInNcIjogNTksXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjE5LFwiZ1wiOiAxMTIsXCJiXCI6IDE0NyB9LCBcImhleFwiOiBcIiNkYjcwOTNcIn0sXG4gICAgXCJwYXBheWF3aGlwXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU1LFwic1wiOiA2NyxcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIzOSxcImJcIjogMjEzIH0sIFwiaGV4XCI6IFwiI2ZmZWZkNVwifSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDkzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjE4LFwiYlwiOiAxODUgfSwgXCJoZXhcIjogXCIjZmZkYWI5XCJ9LFxuICAgIFwicGVydVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDY1LFwibFwiOiA4MSB9LCBcInJnYlwiOiB7XCJyXCI6IDIwNSxcImdcIjogMTMzLFwiYlwiOiA2MyB9LCBcImhleFwiOiBcIiNjZDg1M2ZcIn0sXG4gICAgXCJwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0MCxcInNcIjogNjAsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxOTIsXCJiXCI6IDIwMyB9LCBcImhleFwiOiBcIiNmZmMwY2JcIn0sXG4gICAgXCJwbHVtXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM3LFwic1wiOiAxMDAsXCJsXCI6IDkyIH0sIFwicmdiXCI6IHtcInJcIjogMjIxLFwiZ1wiOiAxNjAsXCJiXCI6IDIyMSB9LCBcImhleFwiOiBcIiNkZGEwZGRcIn0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4LFwic1wiOiAxMDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMTc2LFwiZ1wiOiAyMjQsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNiMGUwZTZcIn0sXG4gICAgXCJwdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDU5LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwMDA4MFwifSxcbiAgICBcInJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNTAsXCJzXCI6IDEwMCxcImxcIjogODggfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmYwMDAwXCJ9LFxuICAgIFwicm9zeWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogNDcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTg4LFwiZ1wiOiAxNDMsXCJiXCI6IDE0MyB9LCBcImhleFwiOiBcIiNiYzhmOGZcIn0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTg3LFwic1wiOiA1MixcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiA2NSxcImdcIjogMTA1LFwiYlwiOiAyMjUgfSwgXCJoZXhcIjogXCIjNDE2OWUxXCJ9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiA2OSxcImJcIjogMTkgfSwgXCJoZXhcIjogXCIjOGI0NTEzXCJ9LFxuICAgIFwic2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIyNSxcInNcIjogNzMsXCJsXCI6IDU3IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAxMjgsXCJiXCI6IDExNCB9LCBcImhleFwiOiBcIiNmYTgwNzJcIn0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NixcImxcIjogMzEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDQsXCJnXCI6IDE2NCxcImJcIjogOTYgfSwgXCJoZXhcIjogXCIjZjRhNDYwXCJ9LFxuICAgIFwic2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogOTMsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogNDYsXCJnXCI6IDEzOSxcImJcIjogODcgfSwgXCJoZXhcIjogXCIjMmU4YjU3XCJ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiaHNsXCI6IHtcImhcIjogMjgsXCJzXCI6IDg3LFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjQ1LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjZmZmNWVlXCJ9LFxuICAgIFwic2llbm5hXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NixcInNcIjogNTAsXCJsXCI6IDM2IH0sIFwicmdiXCI6IHtcInJcIjogMTYwLFwiZ1wiOiA4MixcImJcIjogNDUgfSwgXCJoZXhcIjogXCIjYTA1MjJkXCJ9LFxuICAgIFwic2lsdmVyXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTkyLFwiZ1wiOiAxOTIsXCJiXCI6IDE5MiB9LCBcImhleFwiOiBcIiNjMGMwYzBcIn0sXG4gICAgXCJza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5LFwic1wiOiA1NixcImxcIjogNDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzUsXCJnXCI6IDIwNixcImJcIjogMjM1IH0sIFwiaGV4XCI6IFwiIzg3Y2VlYlwifSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTcsXCJzXCI6IDcxLFwibFwiOiA3MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNixcImdcIjogOTAsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiM2YTVhY2RcIn0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQ4LFwic1wiOiA1MyxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAxMTIsXCJnXCI6IDEyOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzcwODA5MFwifSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDExMixcImdcIjogMTI4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjNzA4MDkwXCJ9LFxuICAgIFwic25vd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZmZmYWZhXCJ9LFxuICAgIFwic3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiA5OSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMTI3IH0sIFwiaGV4XCI6IFwiIzAwZmY3ZlwifSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiA3MCxcImdcIjogMTMwLFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjNDY4MmI0XCJ9LFxuICAgIFwidGFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwNyxcInNcIjogNDQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjEwLFwiZ1wiOiAxODAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNkMmI0OGNcIn0sXG4gICAgXCJ0ZWFsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA0NCxcImxcIjogNjkgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiMwMDgwODBcIn0sXG4gICAgXCJ0aGlzdGxlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMjQsXCJsXCI6IDgwIH0sIFwicmdiXCI6IHtcInJcIjogMjE2LFwiZ1wiOiAxOTEsXCJiXCI6IDIxNiB9LCBcImhleFwiOiBcIiNkOGJmZDhcIn0sXG4gICAgXCJ0b21hdG9cIjoge1wiaHNsXCI6IHtcImhcIjogOSxcInNcIjogMTAwLFwibFwiOiA2NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogOTksXCJiXCI6IDcxIH0sIFwiaGV4XCI6IFwiI2ZmNjM0N1wifSxcbiAgICBcInR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzQsXCJzXCI6IDcyLFwibFwiOiA1NiB9LCBcInJnYlwiOiB7XCJyXCI6IDY0LFwiZ1wiOiAyMjQsXCJiXCI6IDIwOCB9LCBcImhleFwiOiBcIiM0MGUwZDBcIn0sXG4gICAgXCJ2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiA3NixcImxcIjogNzIgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDEzMCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2VlODJlZVwifSxcbiAgICBcIndoZWF0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA3NyxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDIyMixcImJcIjogMTc5IH0sIFwiaGV4XCI6IFwiI2Y1ZGViM1wifSxcbiAgICBcIndoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDk2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmZmZmZmZcIn0sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDgwLFwic1wiOiA2MSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjQ1IH0sIFwiaGV4XCI6IFwiI2Y1ZjVmNVwifSxcInllbGxvd1wiOiB7IFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZmZjAwXCJ9LFwieWVsbG93Z3JlZW5cIjogeyBcInJnYlwiOiB7XCJyXCI6IDE1NCxcImdcIjogMjA1LFwiYlwiOiA1MCB9LCBcImhleFwiOiBcIiM5YWNkMzJcIn1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuYW1lZGNvbG9yczsiLCJmdW5jdGlvbiBuZWFybHlFcXVhbChhLCBiLCBlcHMpe1xuICAgIGlmICh0eXBlb2YgZXBzID09PSBcInVuZGVmaW5lZFwiKSB7ZXBzID0gMC4wMTt9XG4gICAgdmFyIGRpZmYgPSBNYXRoLmFicyhhIC0gYik7XG4gICAgcmV0dXJuIChkaWZmIDwgZXBzKTtcbn1cblxudmFyIGhlbHBlcnMgPSBuZXcgT2JqZWN0KG51bGwpO1xuXG5oZWxwZXJzLm5lYXJseUVxdWFsID0gbmVhcmx5RXF1YWw7XG5cbm1vZHVsZS5leHBvcnRzID0gaGVscGVyczsiXX0=
(7)
});
