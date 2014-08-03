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
 * Return a string representation of color in #hex form.
 * @method
 * @return {string}
 */
Color.prototype.toHexString = function(){
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
}
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
 * @throws {ColorError} If illegal color value is passed.
 */
parseColor = function(color){
    // TODO: This isn't perfect. Some strings that would be accepted CSS color values
    // (e.g. negative numbers, alpha greater than 1) will not work.
    var red, green, blue, hue, sat, lum;
    var alpha = 1;
    var regex, match;
    var pref = color.substr(0,3); // Three letter color prefix
    var return_color = {};
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
        throw "ColorError: Something went wrong. Perhaps " + color + " is not a legal CSS color value";
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
        test('toString', function(){
            var r1 = red.toHexString();
            var g1 = green.toHexString();
            var b1 = blue.toHexString();
            var rgb1 = rgb.toHexString();
            var rgba1 = rgba.toHexString();
            var hsl1 = hsl.toHexString();
            var hsla1 = hsl.toHexString();
            rgb = new Color("rgb(1, 7, 29)");
            rgba = new Color("rgba(1, 7, 29, 0.3)");
            hsl = new Color("hsl(0, 100%, 50%)");
            hsla = new Color("hsla(0, 100%, 50%, 0.3)");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci9zcmMvY29sb3VyLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay9jb2xvdXIvdGVzdC9mYWtlXzgxZjIzMDAxLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay9jb2xvdXIvdGVzdHMvY29sb3IuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL2NvbG91ci90ZXN0cy9kYXRhL2NvbG9ycy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvY29sb3VyL3Rlc3RzL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoWkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyB3aGVuIHVzZWQgaW4gbm9kZSwgdGhpcyB3aWxsIGFjdHVhbGx5IGxvYWQgdGhlIHV0aWwgbW9kdWxlIHdlIGRlcGVuZCBvblxuLy8gdmVyc3VzIGxvYWRpbmcgdGhlIGJ1aWx0aW4gdXRpbCBtb2R1bGUgYXMgaGFwcGVucyBvdGhlcndpc2Vcbi8vIHRoaXMgaXMgYSBidWcgaW4gbm9kZSBtb2R1bGUgbG9hZGluZyBhcyBmYXIgYXMgSSBhbSBjb25jZXJuZWRcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcblxudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBzdGFja1N0YXJ0RnVuY3Rpb24ubmFtZTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgaWYgKHV0aWwuaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHV0aWwuaXNOdW1iZXIodmFsdWUpICYmIChpc05hTih2YWx1ZSkgfHwgIWlzRmluaXRlKHZhbHVlKSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB1dGlsLmlzUmVnRXhwKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodXRpbC5pc1N0cmluZyhzKSkge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuYWN0dWFsLCByZXBsYWNlciksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNCdWZmZXIoYWN0dWFsKSAmJiB1dGlsLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCF1dGlsLmlzT2JqZWN0KGFjdHVhbCkgJiYgIXV0aWwuaXNPYmplY3QoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiKSB7XG4gIGlmICh1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGEpIHx8IHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgICAga2V5LCBpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodXRpbC5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW2ZhbHNlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikge3Rocm93IGVycjt9fTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwidmFyIGhzbFRvUmdiLCByZ2JUb0hzbCwgcGFyc2VDb2xvciwgY2FjaGU7XG4vKipcbiAqIEEgY29sb3Igd2l0aCBib3RoIHJnYiBhbmQgaHNsIHJlcHJlc2VudGF0aW9ucy5cbiAqIEBjbGFzcyBDb2xvclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIEFueSBsZWdhbCBDU1MgY29sb3IgdmFsdWUgKGhleCwgY29sb3Iga2V5d29yZCwgcmdiW2FdLCBoc2xbYV0pLlxuICovXG5mdW5jdGlvbiBDb2xvcihjb2xvciwgYWxwaGEpe1xuICAgIHZhciBoc2wsIHJnYjtcbiAgICB2YXIgcGFyc2VkX2NvbG9yID0ge307XG4gICAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycpe1xuICAgICAgICBjb2xvciA9IGNvbG9yLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChjb2xvciBpbiBjYWNoZSl7XG4gICAgICAgICAgICBwYXJzZWRfY29sb3IgPSBjYWNoZVtjb2xvcl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzZWRfY29sb3IgPSBwYXJzZUNvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgIGNhY2hlW2NvbG9yXSA9IHBhcnNlZF9jb2xvcjtcbiAgICAgICAgfVxuICAgICAgICByZ2IgPSBwYXJzZWRfY29sb3I7XG4gICAgICAgIGhzbCA9IHJnYlRvSHNsKHBhcnNlZF9jb2xvci5yLCBwYXJzZWRfY29sb3IuZywgcGFyc2VkX2NvbG9yLmIpO1xuICAgICAgICBhbHBoYSA9IHBhcnNlZF9jb2xvci5hIHx8IGFscGhhIHx8IDE7XG4gICAgfSBlbHNlIGlmICgncicgaW4gY29sb3Ipe1xuICAgICAgICByZ2IgPSBjb2xvcjtcbiAgICAgICAgaHNsID0gcmdiVG9Ic2woY29sb3IuciwgY29sb3IuZywgY29sb3IuYik7XG4gICAgICAgIGFscGhhID0gaHNsLmEgfHwgYWxwaGEgfHwgMTtcbiAgICB9IGVsc2UgaWYgKCdoJyBpbiBjb2xvcil7XG4gICAgICAgIGhzbCA9IGNvbG9yO1xuICAgICAgICByZ2IgPSBoc2xUb1JnYihjb2xvci5oLCBjb2xvci5zLCBjb2xvci5sKTtcbiAgICAgICAgYWxwaGEgPSByZ2IuYSB8fCBhbHBoYSB8fCAxO1xuICAgIH1cbiAgICB0aGlzLnJnYiA9IHsncic6IHJnYi5yLCAnZyc6IHJnYi5nLCAnYic6IHJnYi5ifTtcbiAgICB0aGlzLmhzbCA9IHsnaCc6IGhzbC5oLCAncyc6IGhzbC5zLCAnbCc6IGhzbC5sfTtcbiAgICB0aGlzLmFscGhhID0gYWxwaGE7XG59XG4vKipcbiAqIExpZ2h0ZW4gYSBjb2xvciBieSB0aGUgZ2l2ZW4gcGVyY2VudGFnZS5cblxuICogQG1ldGhvZFxuICogQHBhcmFtICB7bnVtYmVyfSBwZXJjZW50XG4gKiBAcmV0dXJuIHtDb2xvcn1cbiAqL1xuQ29sb3IucHJvdG90eXBlLmxpZ2h0ZW4gPSBmdW5jdGlvbihwZXJjZW50KXtcbiAgICB2YXIgaHNsID0gdGhpcy5oc2w7XG4gICAgdmFyIGx1bSA9IGhzbC5sICsgcGVyY2VudDtcbiAgICBpZiAobHVtID4gMTAwKXtcbiAgICAgICAgbHVtID0gMTAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKHsnaCc6aHNsLmgsICdzJzpoc2wucywgJ2wnOmx1bX0sIHRoaXMuYWxwaGEpO1xufTtcbi8qKlxuICogRGFya2VuIGEgY29sb3IgYnkgdGhlIGdpdmVuIHBlcmNlbnRhZ2UuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG9yfVxuICovXG5Db2xvci5wcm90b3R5cGUuZGFya2VuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCAtIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA8IDApe1xuICAgICAgICBsdW0gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKHsnaCc6aHNsLmgsICdzJzpoc2wucywgJ2wnOmx1bX0sIHRoaXMuYWxwaGEpO1xufTtcbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGNvbG9yIGluICNoZXggZm9ybS5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQ29sb3IucHJvdG90eXBlLnRvSGV4U3RyaW5nID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgciA9IHRoaXMucmdiLnIudG9TdHJpbmcoMTYpO1xuICAgIHZhciBnID0gdGhpcy5yZ2IuZy50b1N0cmluZygxNik7XG4gICAgdmFyIGIgPSB0aGlzLnJnYi5iLnRvU3RyaW5nKDE2KTtcbiAgICAvLyBaZXJvIGZpbGxcbiAgICBpZiAoci5sZW5ndGggPT09IDEpe1xuICAgICAgICByID0gXCIwXCIgKyByO1xuICAgIH1cbiAgICBpZiAoZy5sZW5ndGggPT09IDEpe1xuICAgICAgICBnID0gXCIwXCIgKyBnO1xuICAgIH1cbiAgICBpZiAoYi5sZW5ndGggPT09IDEpe1xuICAgICAgICBiID0gXCIwXCIgKyBiO1xuICAgIH1cbiAgICByZXR1cm4gXCIjXCIgKyByICsgZyArIGI7XG59XG4vKipcbiogQHBhcmFtIHtudW1iZXJ9IGggSHVlXG4qIEBwYXJhbSB7bnVtYmVyfSBzIFNhdHVyYXRpb25cbiogQHBhcmFtIHtudW1iZXJ9IGwgTHVtaW5hbmNlXG4qIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyfX1cbiovXG5oc2xUb1JnYiA9IGZ1bmN0aW9uKGgsIHMsIGwpe1xuICAgIGZ1bmN0aW9uIF92KG0xLCBtMiwgaHVlKXtcbiAgICAgICAgaHVlID0gaHVlO1xuICAgICAgICBpZiAoaHVlIDwgMCl7aHVlKz0xO31cbiAgICAgICAgaWYgKGh1ZSA+IDEpe2h1ZS09MTt9XG4gICAgICAgIGlmIChodWUgPCAoMS82KSl7XG4gICAgICAgICAgICByZXR1cm4gbTEgKyAobTItbTEpKmh1ZSo2O1xuICAgICAgICB9XG4gICAgICAgIGlmIChodWUgPCAwLjUpe1xuICAgICAgICAgICAgcmV0dXJuIG0yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChodWUgPCAoMi8zKSl7XG4gICAgICAgICAgICByZXR1cm4gbTEgKyAobTItbTEpKigoMi8zKS1odWUpKjY7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0xO1xuICAgIH1cbiAgICB2YXIgbTI7XG4gICAgdmFyIGZyYWN0aW9uX2wgPSAobC8xMDApO1xuICAgIHZhciBmcmFjdGlvbl9zID0gKHMvMTAwKTtcbiAgICBpZiAocyA9PT0gMCl7XG4gICAgICAgIHZhciBncmF5ID0gZnJhY3Rpb25fbCoyNTU7XG4gICAgICAgIHJldHVybiB7J3InOiBncmF5LCAnZyc6IGdyYXksICdiJzogZ3JheX07XG4gICAgfVxuICAgIGlmIChsIDw9IDUwKXtcbiAgICAgICAgbTIgPSBmcmFjdGlvbl9sICogKDErZnJhY3Rpb25fcyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIG0yID0gZnJhY3Rpb25fbCtmcmFjdGlvbl9zLShmcmFjdGlvbl9sKmZyYWN0aW9uX3MpO1xuICAgIH1cbiAgICB2YXIgbTEgPSAyKmZyYWN0aW9uX2wgLSBtMjtcbiAgICBoID0gaCAvIDM2MDtcbiAgICByZXR1cm4geydyJzogTWF0aC5yb3VuZChfdihtMSwgbTIsIGgrKDEvMykpKjI1NSksICdnJzogTWF0aC5yb3VuZChfdihtMSwgbTIsIGgpKjI1NSksICdiJzogTWF0aC5yb3VuZChfdihtMSwgbTIsIGgtKDEvMykpKjI1NSl9O1xufTtcbi8qKlxuICogQHBhcmFtICB7bnVtYmVyfSByIFJlZFxuICogQHBhcmFtICB7bnVtYmVyfSBnIEdyZWVuXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGIgQmx1ZVxuICogQHJldHVybiB7e2g6IG51bWJlciwgczogbnVtYmVyLCBsOiBudW1iZXJ9fVxuICovXG5yZ2JUb0hzbCA9IGZ1bmN0aW9uKHIsIGcsIGIpe1xuICAgIHIgPSByIC8gMjU1O1xuICAgIGcgPSBnIC8gMjU1O1xuICAgIGIgPSBiIC8gMjU1O1xuICAgIHZhciBtYXhjID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgdmFyIG1pbmMgPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgICB2YXIgbCA9IE1hdGgucm91bmQoKChtaW5jK21heGMpLzIpKjEwMCk7XG4gICAgaWYgKGwgPiAxMDApIHtsID0gMTAwO31cbiAgICBpZiAobCA8IDApIHtsID0gMDt9XG4gICAgdmFyIGgsIHM7XG4gICAgaWYgKG1pbmMgPT09IG1heGMpe1xuICAgICAgICByZXR1cm4geydoJzogMCwgJ3MnOiAwLCAnbCc6IGx9O1xuICAgIH1cbiAgICBpZiAobCA8PSA1MCl7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvIChtYXhjK21pbmMpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBzID0gKG1heGMtbWluYykgLyAoMi1tYXhjLW1pbmMpO1xuICAgIH1cbiAgICB2YXIgcmMgPSAobWF4Yy1yKSAvIChtYXhjLW1pbmMpO1xuICAgIHZhciBnYyA9IChtYXhjLWcpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGJjID0gKG1heGMtYikgLyAobWF4Yy1taW5jKTtcbiAgICBpZiAociA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSBiYy1nYztcbiAgICB9XG4gICAgZWxzZSBpZiAoZyA9PT0gbWF4Yyl7XG4gICAgICAgIGggPSAyK3JjLWJjO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICBoID0gNCtnYy1yYztcbiAgICB9XG4gICAgaCA9IChoLzYpICUgMTtcbiAgICBpZiAoaCA8IDApe2grPTE7fVxuICAgIGggPSBNYXRoLnJvdW5kKGgqMzYwKTtcbiAgICBzID0gTWF0aC5yb3VuZChzKjEwMCk7XG4gICAgaWYgKGggPiAzNjApIHtoID0gMzYwO31cbiAgICBpZiAoaCA8IDApIHtoID0gMDt9XG4gICAgaWYgKHMgPiAxMDApIHtzID0gMTAwO31cbiAgICBpZiAocyA8IDApIHtzID0gMDt9XG4gICAgcmV0dXJuIHsnaCc6IGgsICdzJzogcywgJ2wnOiBsfTtcbn07XG4vKipcbiAqIFBhcnNlIGEgQ1NTIGNvbG9yIHZhbHVlIGFuZCByZXR1cm4gYW4gcmdiYSBjb2xvciBvYmplY3QuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvbG9yIEEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlIChoZXgsIGNvbG9yIGtleXdvcmQsIHJnYlthXSwgaHNsW2FdKS5cbiAqIEByZXR1cm4ge3tyOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhOiBudW1iZXJ9fSAgIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHRocm93cyB7Q29sb3JFcnJvcn0gSWYgaWxsZWdhbCBjb2xvciB2YWx1ZSBpcyBwYXNzZWQuXG4gKi9cbnBhcnNlQ29sb3IgPSBmdW5jdGlvbihjb2xvcil7XG4gICAgLy8gVE9ETzogVGhpcyBpc24ndCBwZXJmZWN0LiBTb21lIHN0cmluZ3MgdGhhdCB3b3VsZCBiZSBhY2NlcHRlZCBDU1MgY29sb3IgdmFsdWVzXG4gICAgLy8gKGUuZy4gbmVnYXRpdmUgbnVtYmVycywgYWxwaGEgZ3JlYXRlciB0aGFuIDEpIHdpbGwgbm90IHdvcmsuXG4gICAgdmFyIHJlZCwgZ3JlZW4sIGJsdWUsIGh1ZSwgc2F0LCBsdW07XG4gICAgdmFyIGFscGhhID0gMTtcbiAgICB2YXIgcmVnZXgsIG1hdGNoO1xuICAgIHZhciBwcmVmID0gY29sb3Iuc3Vic3RyKDAsMyk7IC8vIFRocmVlIGxldHRlciBjb2xvciBwcmVmaXhcbiAgICB2YXIgcmV0dXJuX2NvbG9yID0ge307XG4gICAgdmFyIGVycm9yID0gZmFsc2U7XG4gICAgaWYgKHByZWYgPT09ICdoc2wnKXtcbiAgICAgICAgcmVnZXggPSAvKFxcZHsxLDN9KVxccyosXFxzKihcXGR7MSwzfSklXFxzKixcXHMqKFxcZHsxLDN9KS9nO1xuICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoY29sb3IpO1xuICAgICAgICBodWUgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICBzYXQgPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuICAgICAgICBsdW0gPSBwYXJzZUludChtYXRjaFszXSwgMTApO1xuICAgICAgICBpZiAoY29sb3JbM10gPT09ICdhJyl7XG4gICAgICAgICAgICByZWdleCA9IC8sXFxzKihcXGRcXC4/XFxkPylcXHMqXFwpL2c7XG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoY29sb3IpO1xuICAgICAgICAgICAgYWxwaGEgPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaHVlIDwgMCB8fCBodWUgPiAzNjAgfHxcbiAgICAgICAgICAgIHNhdCA8IDAgfHwgc2F0ID4gMTAwIHx8XG4gICAgICAgICAgICBsdW0gPCAwIHx8IGx1bSA+IDEwMCB8fFxuICAgICAgICAgICAgYWxwaGEgPCAwIHx8IGFscGhhID4gMSl7XG4gICAgICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcGFyc2VkID0gaHNsVG9SZ2IoaHVlLCBzYXQsIGx1bSk7XG4gICAgICAgICAgICByZWQgPSBwYXJzZWQucjtcbiAgICAgICAgICAgIGdyZWVuID0gcGFyc2VkLmc7XG4gICAgICAgICAgICBibHVlID0gcGFyc2VkLmI7XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAocHJlZiA9PT0gJ3JnYicpe1xuICAgICAgICByZWdleCA9IC8oXFxkezEsM30pXFxzKixcXHMqKFxcZHsxLDN9KVxccyosXFxzKihcXGR7MSwzfSkvZztcbiAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKGNvbG9yKTtcbiAgICAgICAgcmVkID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgZ3JlZW4gPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuICAgICAgICBibHVlID0gcGFyc2VJbnQobWF0Y2hbM10sIDEwKTtcbiAgICAgICAgaWYgKGNvbG9yWzNdID09PSAnYScpe1xuICAgICAgICAgICAgcmVnZXggPSAvLFxccyooXFxkXFwuP1xcZD8pXFxzKlxcKS9nO1xuICAgICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKGNvbG9yKTtcbiAgICAgICAgICAgIGFscGhhID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNvbG9yWzBdID09PSAnIycpe1xuICAgICAgICB2YXIgaGV4ID0gY29sb3Iuc3Vic3RyKDEpO1xuICAgICAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gMyl7XG4gICAgICAgICAgICByZWQgPSBwYXJzZUludChoZXhbMF0raGV4WzBdLCAxNik7XG4gICAgICAgICAgICBncmVlbiA9IHBhcnNlSW50KGhleFsxXStoZXhbMV0sIDE2KTtcbiAgICAgICAgICAgIGJsdWUgPSBwYXJzZUludChoZXhbMl0raGV4WzJdLCAxNik7XG4gICAgICAgIH0gZWxzZSBpZiAoaGV4Lmxlbmd0aCA9PT0gNil7XG4gICAgICAgICAgICByZWQgPSBwYXJzZUludChoZXhbMF0raGV4WzFdLCAxNik7XG4gICAgICAgICAgICBncmVlbiA9IHBhcnNlSW50KGhleFsyXStoZXhbM10sIDE2KTtcbiAgICAgICAgICAgIGJsdWUgPSBwYXJzZUludChoZXhbNF0raGV4WzVdLCAxNik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHJlZCA8IDAgfHwgcmVkID4gMjU1IHx8XG4gICAgICAgIGdyZWVuIDwgMCB8fCBncmVlbiA+IDI1NSB8fFxuICAgICAgICBibHVlIDwgMCB8fCBibHVlID4gMjU1IHx8XG4gICAgICAgIGFscGhhIDwgMCB8fCBhbHBoYSA+IDEpe1xuICAgICAgICBlcnJvciA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGVycm9yKXtcbiAgICAgICAgdGhyb3cgXCJDb2xvckVycm9yOiBTb21ldGhpbmcgd2VudCB3cm9uZy4gUGVyaGFwcyBcIiArIGNvbG9yICsgXCIgaXMgbm90IGEgbGVnYWwgQ1NTIGNvbG9yIHZhbHVlXCI7XG4gICAgfVxuICAgIHJldHVybiB7J3InOiByZWQsICdnJzogZ3JlZW4sICdiJzogYmx1ZSwgJ2EnOiBhbHBoYX07XG59O1xuLy8gUHJlLXdhcm0gdGhlIGNhY2hlIHdpdGggbmFtZWQgY29sb3JzLCBhcyB0aGVzZSBhcmUgbm90XG4vLyBjb252ZXJ0ZWQgdG8gcmdiIHZhbHVlcyBieSB0aGUgcGFyc2VDb2xvciBmdW5jdGlvbiBhYm92ZS5cbmNhY2hlID0ge1xuICAgIFwiYmxhY2tcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDB9LFxuICAgIFwic2lsdmVyXCI6IHtcInJcIjogMTkyLCBcImdcIjogMTkyLCBcImJcIjogMTkyLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA3NX0sXG4gICAgXCJncmF5XCI6IHtcInJcIjogMTI4LCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA1MH0sXG4gICAgXCJ3aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogMTAwfSxcbiAgICBcIm1hcm9vblwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcInJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcInB1cnBsZVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJmdWNoc2lhXCI6IHtcInJcIjogMjU1LCBcImdcIjogMCwgXCJiXCI6IDI1NSwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImdyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEyOCwgXCJiXCI6IDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJsaW1lXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJvbGl2ZVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDAsIFwiaFwiOiA2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcInllbGxvd1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDAsIFwiaFwiOiA2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcIm5hdnlcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDEyOCwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDI1NSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcInRlYWxcIjoge1wiclwiOiAwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiYXF1YVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAxODAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJvcmFuZ2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxNjUsIFwiYlwiOiAwLCBcImhcIjogMzksIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJhbGljZWJsdWVcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyNTUsIFwiaFwiOiAyMDgsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJhbnRpcXVld2hpdGVcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyMzUsIFwiYlwiOiAyMTUsIFwiaFwiOiAzNCwgXCJzXCI6IDc4LCBcImxcIjogOTF9LFxuICAgIFwiYXF1YW1hcmluZVwiOiB7XCJyXCI6IDEyNywgXCJnXCI6IDI1NSwgXCJiXCI6IDIxMiwgXCJoXCI6IDE2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDc1fSxcbiAgICBcImF6dXJlXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiYmVpZ2VcIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMjAsIFwiaFwiOiA2MCwgXCJzXCI6IDU2LCBcImxcIjogOTF9LFxuICAgIFwiYmlzcXVlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjI4LCBcImJcIjogMTk2LCBcImhcIjogMzMsIFwic1wiOiAxMDAsIFwibFwiOiA4OH0sXG4gICAgXCJibGFuY2hlZGFsbW9uZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIzNSwgXCJiXCI6IDIwNSwgXCJoXCI6IDM2LCBcInNcIjogMTAwLCBcImxcIjogOTB9LFxuICAgIFwiYmx1ZXZpb2xldFwiOiB7XCJyXCI6IDEzOCwgXCJnXCI6IDQzLCBcImJcIjogMjI2LCBcImhcIjogMjcxLCBcInNcIjogNzYsIFwibFwiOiA1M30sXG4gICAgXCJicm93blwiOiB7XCJyXCI6IDE2NSwgXCJnXCI6IDQyLCBcImJcIjogNDIsIFwiaFwiOiAwLCBcInNcIjogNTksIFwibFwiOiA0MX0sXG4gICAgXCJidXJseXdvb2RcIjoge1wiclwiOiAyMjIsIFwiZ1wiOiAxODQsIFwiYlwiOiAxMzUsIFwiaFwiOiAzNCwgXCJzXCI6IDU3LCBcImxcIjogNzB9LFxuICAgIFwiY2FkZXRibHVlXCI6IHtcInJcIjogOTUsIFwiZ1wiOiAxNTgsIFwiYlwiOiAxNjAsIFwiaFwiOiAxODIsIFwic1wiOiAyNSwgXCJsXCI6IDUwfSxcbiAgICBcImNoYXJ0cmV1c2VcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogOTAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJjaG9jb2xhdGVcIjoge1wiclwiOiAyMTAsIFwiZ1wiOiAxMDUsIFwiYlwiOiAzMCwgXCJoXCI6IDI1LCBcInNcIjogNzUsIFwibFwiOiA0N30sXG4gICAgXCJjb3JhbFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDEyNywgXCJiXCI6IDgwLCBcImhcIjogMTYsIFwic1wiOiAxMDAsIFwibFwiOiA2Nn0sXG4gICAgXCJjb3JuZmxvd2VyYmx1ZVwiOiB7XCJyXCI6IDEwMCwgXCJnXCI6IDE0OSwgXCJiXCI6IDIzNywgXCJoXCI6IDIxOSwgXCJzXCI6IDc5LCBcImxcIjogNjZ9LFxuICAgIFwiY29ybnNpbGtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyMjAsIFwiaFwiOiA0OCwgXCJzXCI6IDEwMCwgXCJsXCI6IDkzfSxcbiAgICBcImN5YW5cIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiA5N30sXG4gICAgXCJjcmltc29uXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjAsIFwiYlwiOiA2MCwgXCJoXCI6IDM0OCwgXCJzXCI6IDgzLCBcImxcIjogNDd9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtjeWFuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEzOSwgXCJiXCI6IDEzOSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiclwiOiAxODQsIFwiZ1wiOiAxMzQsIFwiYlwiOiAxMSwgXCJoXCI6IDQzLCBcInNcIjogODksIFwibFwiOiAzOH0sXG4gICAgXCJkYXJrZ3JheVwiOiB7XCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNjZ9LFxuICAgIFwiZGFya2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEwMCwgXCJiXCI6IDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiAyMH0sXG4gICAgXCJkYXJrZ3JleVwiOiB7XCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNjZ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcInJcIjogMTg5LCBcImdcIjogMTgzLCBcImJcIjogMTA3LCBcImhcIjogNTYsIFwic1wiOiAzOCwgXCJsXCI6IDU4fSxcbiAgICBcImRhcmttYWdlbnRhXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcInJcIjogODUsIFwiZ1wiOiAxMDcsIFwiYlwiOiA0NywgXCJoXCI6IDgyLCBcInNcIjogMzksIFwibFwiOiAzMH0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTQwLCBcImJcIjogMCwgXCJoXCI6IDMzLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJyXCI6IDE1MywgXCJnXCI6IDUwLCBcImJcIjogMjA0LCBcImhcIjogMjgwLCBcInNcIjogNjEsIFwibFwiOiA1MH0sXG4gICAgXCJkYXJrcmVkXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogMjd9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJyXCI6IDIzMywgXCJnXCI6IDE1MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDE1LCBcInNcIjogNzIsIFwibFwiOiA3MH0sXG4gICAgXCJkYXJrc2VhZ3JlZW5cIjoge1wiclwiOiAxNDMsIFwiZ1wiOiAxODgsIFwiYlwiOiAxNDMsIFwiaFwiOiAxMjAsIFwic1wiOiAyNSwgXCJsXCI6IDY1fSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiclwiOiA3MiwgXCJnXCI6IDYxLCBcImJcIjogMTM5LCBcImhcIjogMjQ4LCBcInNcIjogMzksIFwibFwiOiAzOX0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMTgwLCBcInNcIjogMjUsIFwibFwiOiAyNX0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMTgwLCBcInNcIjogMjUsIFwibFwiOiAyNX0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcInJcIjogMCwgXCJnXCI6IDIwNiwgXCJiXCI6IDIwOSwgXCJoXCI6IDE4MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDQxfSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiclwiOiAxNDgsIFwiZ1wiOiAwLCBcImJcIjogMjExLCBcImhcIjogMjgyLCBcInNcIjogMTAwLCBcImxcIjogNDF9LFxuICAgIFwiZGVlcHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMCwgXCJiXCI6IDE0NywgXCJoXCI6IDMyOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU0fSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDE5MSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE5NSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImRpbWdyYXlcIjoge1wiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDQxfSxcbiAgICBcImRpbWdyZXlcIjoge1wiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDQxfSxcbiAgICBcImRvZGdlcmJsdWVcIjoge1wiclwiOiAzMCwgXCJnXCI6IDE0NCwgXCJiXCI6IDI1NSwgXCJoXCI6IDIxMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU2fSxcbiAgICBcImZpcmVicmlja1wiOiB7XCJyXCI6IDE3OCwgXCJnXCI6IDM0LCBcImJcIjogMzQsIFwiaFwiOiAwLCBcInNcIjogNjgsIFwibFwiOiA0Mn0sXG4gICAgXCJmbG9yYWx3aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI0MCwgXCJoXCI6IDQwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiclwiOiAzNCwgXCJnXCI6IDEzOSwgXCJiXCI6IDM0LCBcImhcIjogMTIwLCBcInNcIjogNjEsIFwibFwiOiAzNH0sXG4gICAgXCJnYWluc2Jvcm9cIjoge1wiclwiOiAyMjAsIFwiZ1wiOiAyMjAsIFwiYlwiOiAyMjAsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDg2fSxcbiAgICBcImdob3N0d2hpdGVcIjoge1wiclwiOiAyNDgsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyNTUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5OX0sXG4gICAgXCJnb2xkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE1LCBcImJcIjogMCwgXCJoXCI6IDUxLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZ29sZGVucm9kXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTY1LCBcImJcIjogMzIsIFwiaFwiOiA0MywgXCJzXCI6IDc0LCBcImxcIjogNDl9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiclwiOiAxNzMsIFwiZ1wiOiAyNTUsIFwiYlwiOiA0NywgXCJoXCI6IDg0LCBcInNcIjogMTAwLCBcImxcIjogNTl9LFxuICAgIFwiZ3JleVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNTB9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJob3RwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTA1LCBcImJcIjogMTgwLCBcImhcIjogMzMwLCBcInNcIjogMTAwLCBcImxcIjogNzF9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcInJcIjogMjA1LCBcImdcIjogOTIsIFwiYlwiOiA5MiwgXCJoXCI6IDAsIFwic1wiOiA1MywgXCJsXCI6IDU4fSxcbiAgICBcImluZGlnb1wiOiB7XCJyXCI6IDc1LCBcImdcIjogMCwgXCJiXCI6IDEzMCwgXCJoXCI6IDI3NSwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcIml2b3J5XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJraGFraVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDIzMCwgXCJiXCI6IDE0MCwgXCJoXCI6IDU0LCBcInNcIjogNzcsIFwibFwiOiA3NX0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJyXCI6IDIzMCwgXCJnXCI6IDIzMCwgXCJiXCI6IDI1MCwgXCJoXCI6IDI0MCwgXCJzXCI6IDY3LCBcImxcIjogOTR9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0MCwgXCJiXCI6IDI0NSwgXCJoXCI6IDM0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImxhd25ncmVlblwiOiB7XCJyXCI6IDEyNCwgXCJnXCI6IDI1MiwgXCJiXCI6IDAsIFwiaFwiOiA5MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDQ5fSxcbiAgICBcImxlbW9uY2hpZmZvblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDIwNSwgXCJoXCI6IDU0LCBcInNcIjogMTAwLCBcImxcIjogOTB9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcInJcIjogMTczLCBcImdcIjogMjE2LCBcImJcIjogMjMwLCBcImhcIjogMTk1LCBcInNcIjogNTMsIFwibFwiOiA3OX0sXG4gICAgXCJsaWdodGNvcmFsXCI6IHtcInJcIjogMjQwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDc5LCBcImxcIjogNzJ9LFxuICAgIFwibGlnaHRjeWFuXCI6IHtcInJcIjogMjI0LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMTAsIFwiaFwiOiA2MCwgXCJzXCI6IDgwLCBcImxcIjogOTB9LFxuICAgIFwibGlnaHRncmF5XCI6IHtcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4M30sXG4gICAgXCJsaWdodGdyZWVuXCI6IHtcInJcIjogMTQ0LCBcImdcIjogMjM4LCBcImJcIjogMTQ0LCBcImhcIjogMTIwLCBcInNcIjogNzMsIFwibFwiOiA3NX0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDgzfSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE4MiwgXCJiXCI6IDE5MywgXCJoXCI6IDM1MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDg2fSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTYwLCBcImJcIjogMTIyLCBcImhcIjogMTcsIFwic1wiOiAxMDAsIFwibFwiOiA3NH0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcInJcIjogMzIsIFwiZ1wiOiAxNzgsIFwiYlwiOiAxNzAsIFwiaFwiOiAxNzcsIFwic1wiOiA3MCwgXCJsXCI6IDQxfSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDI1MCwgXCJoXCI6IDIwMywgXCJzXCI6IDkyLCBcImxcIjogNzV9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAyMTAsIFwic1wiOiAxNCwgXCJsXCI6IDUzfSxcbiAgICBcImxpZ2h0c2xhdGVncmV5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMjEwLCBcInNcIjogMTQsIFwibFwiOiA1M30sXG4gICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDE3NiwgXCJnXCI6IDE5NiwgXCJiXCI6IDIyMiwgXCJoXCI6IDIxNCwgXCJzXCI6IDQxLCBcImxcIjogNzh9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMjQsIFwiaFwiOiA2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJyXCI6IDUwLCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiAxMjAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfSxcbiAgICBcImxpbmVuXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjQwLCBcImJcIjogMjMwLCBcImhcIjogMzAsIFwic1wiOiA2NywgXCJsXCI6IDk0fSxcbiAgICBcIm1hZ2VudGFcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDI1NSwgXCJoXCI6IDE3LFwic1wiOiAxMDAsXCJsXCI6IDc0fSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiclwiOiAxMDIsIFwiZ1wiOiAyMDUsIFwiYlwiOiAxNzAsIFwiaFwiOiAxNjAsIFwic1wiOiA1MSwgXCJsXCI6IDYwfSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDIwNSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDQwfSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJyXCI6IDE4NiwgXCJnXCI6IDg1LCBcImJcIjogMjExLCBcImhcIjogMjg4LCBcInNcIjogNTksIFwibFwiOiA1OH0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiclwiOiAxNDcsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTksIFwiaFwiOiAyNjAsIFwic1wiOiA2MCwgXCJsXCI6IDY1fSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcInJcIjogNjAsIFwiZ1wiOiAxNzksIFwiYlwiOiAxMTMsIFwiaFwiOiAxNDcsIFwic1wiOiA1MCwgXCJsXCI6IDQ3fSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEyMywgXCJnXCI6IDEwNCwgXCJiXCI6IDIzOCwgXCJoXCI6IDI0OSwgXCJzXCI6IDgwLCBcImxcIjogNjd9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjUwLCBcImJcIjogMTU0LCBcImhcIjogMTU3LCBcInNcIjogMTAwLCBcImxcIjogNDl9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiAyMDksIFwiYlwiOiAyMDQsIFwiaFwiOiAxNzgsIFwic1wiOiA2MCwgXCJsXCI6IDU1fSxcbiAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiB7XCJyXCI6IDE5OSwgXCJnXCI6IDIxLCBcImJcIjogMTMzLCBcImhcIjogMzIyLCBcInNcIjogODEsIFwibFwiOiA0M30sXG4gICAgXCJtaWRuaWdodGJsdWVcIjoge1wiclwiOiAyNSwgXCJnXCI6IDI1LCBcImJcIjogMTEyLCBcImhcIjogMjQwLCBcInNcIjogNjQsIFwibFwiOiAyN30sXG4gICAgXCJtaW50Y3JlYW1cIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTAsIFwiaFwiOiAxNTAsIFwic1wiOiAxMDAsIFwibFwiOiA5OH0sXG4gICAgXCJtaXN0eXJvc2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAyMjUsIFwiaFwiOiA2LCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibW9jY2FzaW5cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxODEsIFwiaFwiOiAzOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg1fSxcbiAgICBcIm5hdmFqb3doaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjIyLCBcImJcIjogMTczLCBcImhcIjogMzYsIFwic1wiOiAxMDAsIFwibFwiOiA4NH0sXG4gICAgXCJvbGRsYWNlXCI6IHtcInJcIjogMjUzLCBcImdcIjogMjQ1LCBcImJcIjogMjMwLCBcImhcIjogMzksIFwic1wiOiA4NSwgXCJsXCI6IDk1fSxcbiAgICBcIm9saXZlZHJhYlwiOiB7XCJyXCI6IDEwNywgXCJnXCI6IDE0MiwgXCJiXCI6IDM1LCBcImhcIjogODAsIFwic1wiOiA2MCwgXCJsXCI6IDM1fSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDY5LCBcImJcIjogMCwgXCJoXCI6IDE2LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib3JjaGlkXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTEyLCBcImJcIjogMjE0LCBcImhcIjogMzAyLCBcInNcIjogNTksIFwibFwiOiA2NX0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcInJcIjogMjM4LCBcImdcIjogMjMyLCBcImJcIjogMTcwLCBcImhcIjogNTUsIFwic1wiOiA2NywgXCJsXCI6IDgwfSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJyXCI6IDE1MiwgXCJnXCI6IDI1MSwgXCJiXCI6IDE1MiwgXCJoXCI6IDEyMCwgXCJzXCI6IDkzLCBcImxcIjogNzl9LFxuICAgIFwicGFsZXR1cnF1b2lzZVwiOiB7XCJyXCI6IDE3NSwgXCJnXCI6IDIzOCwgXCJiXCI6IDIzOCwgXCJoXCI6IDE4MCwgXCJzXCI6IDY1LCBcImxcIjogODF9LFxuICAgIFwicGFsZXZpb2xldHJlZFwiOiB7XCJyXCI6IDIxOSwgXCJnXCI6IDExMiwgXCJiXCI6IDE0NywgXCJoXCI6IDM0MCwgXCJzXCI6IDYwLCBcImxcIjogNjV9LFxuICAgIFwicGFwYXlhd2hpcFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIzOSwgXCJiXCI6IDIxMywgXCJoXCI6IDM3LCBcInNcIjogMTAwLCBcImxcIjogOTJ9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE4LCBcImJcIjogMTg1LCBcImhcIjogMjgsIFwic1wiOiAxMDAsIFwibFwiOiA4Nn0sXG4gICAgXCJwZXJ1XCI6IHtcInJcIjogMjA1LCBcImdcIjogMTMzLCBcImJcIjogNjMsIFwiaFwiOiAzMCwgXCJzXCI6IDU5LCBcImxcIjogNTN9LFxuICAgIFwicGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE5MiwgXCJiXCI6IDIwMywgXCJoXCI6IDM1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg4fSxcbiAgICBcInBsdW1cIjoge1wiclwiOiAyMjEsIFwiZ1wiOiAxNjAsIFwiYlwiOiAyMjEsIFwiaFwiOiAzMDAsIFwic1wiOiA0NywgXCJsXCI6IDc1fSxcbiAgICBcInBvd2RlcmJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMzAsIFwiaFwiOiAxODcsIFwic1wiOiA1MiwgXCJsXCI6IDgwfSxcbiAgICBcInJvc3licm93blwiOiB7XCJyXCI6IDE4OCwgXCJnXCI6IDE0MywgXCJiXCI6IDE0MywgXCJoXCI6IDAsIFwic1wiOiAyNSwgXCJsXCI6IDY1fSxcbiAgICBcInJveWFsYmx1ZVwiOiB7XCJyXCI6IDY1LCBcImdcIjogMTA1LCBcImJcIjogMjI1LCBcImhcIjogMjI1LCBcInNcIjogNzMsIFwibFwiOiA1N30sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDY5LCBcImJcIjogMTksIFwiaFwiOiAyNSwgXCJzXCI6IDc2LCBcImxcIjogMzF9LFxuICAgIFwic2FsbW9uXCI6IHtcInJcIjogMjUwLCBcImdcIjogMTI4LCBcImJcIjogMTE0LCBcImhcIjogNiwgXCJzXCI6IDkzLCBcImxcIjogNzF9LFxuICAgIFwic2FuZHlicm93blwiOiB7XCJyXCI6IDI0NCwgXCJnXCI6IDE2NCwgXCJiXCI6IDk2LCBcImhcIjogMjgsIFwic1wiOiA4NywgXCJsXCI6IDY3fSxcbiAgICBcInNlYWdyZWVuXCI6IHtcInJcIjogNDYsIFwiZ1wiOiAxMzksIFwiYlwiOiA4NywgXCJoXCI6IDE0NiwgXCJzXCI6IDUwLCBcImxcIjogMzZ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMzgsIFwiaFwiOiAyNSwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcInNpZW5uYVwiOiB7XCJyXCI6IDE2MCwgXCJnXCI6IDgyLCBcImJcIjogNDUsIFwiaFwiOiAxOSwgXCJzXCI6IDU2LCBcImxcIjogNDB9LFxuICAgIFwic2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDIzNSwgXCJoXCI6IDE5NywgXCJzXCI6IDcxLCBcImxcIjogNzN9LFxuICAgIFwic2xhdGVibHVlXCI6IHtcInJcIjogMTA2LCBcImdcIjogOTAsIFwiYlwiOiAyMDUsIFwiaFwiOiAyNDgsIFwic1wiOiA1MywgXCJsXCI6IDU4fSxcbiAgICBcInNsYXRlZ3JheVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDIxMCwgXCJzXCI6IDEzLCBcImxcIjogNTB9LFxuICAgIFwic2xhdGVncmV5XCI6IHtcInJcIjogMTEyLCBcImdcIjogMTI4LCBcImJcIjogMTQ0LCBcImhcIjogMjEwLCBcInNcIjogMTMsIFwibFwiOiA1MH0sXG4gICAgXCJzbm93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjUwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk5fSxcbiAgICBcInNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDEyNywgXCJoXCI6IDE1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDcwLCBcImdcIjogMTMwLCBcImJcIjogMTgwLCBcImhcIjogMjA3LCBcInNcIjogNDQsIFwibFwiOiA0OX0sXG4gICAgXCJ0YW5cIjoge1wiclwiOiAyMTAsIFwiZ1wiOiAxODAsIFwiYlwiOiAxNDAsIFwiaFwiOiAzNCwgXCJzXCI6IDQ0LCBcImxcIjogNjl9LFxuICAgIFwidGhpc3RsZVwiOiB7XCJyXCI6IDIxNiwgXCJnXCI6IDE5MSwgXCJiXCI6IDIxNiwgXCJoXCI6IDMwMCwgXCJzXCI6IDI0LCBcImxcIjogODB9LFxuICAgIFwidG9tYXRvXCI6IHtcInJcIjogMjU1LCBcImdcIjogOTksIFwiYlwiOiA3MSwgXCJoXCI6IDksIFwic1wiOiAxMDAsIFwibFwiOiA2NH0sXG4gICAgXCJ0dXJxdW9pc2VcIjoge1wiclwiOiA2NCwgXCJnXCI6IDIyNCwgXCJiXCI6IDIwOCwgXCJoXCI6IDE3NCwgXCJzXCI6IDcyLCBcImxcIjogNTZ9LFxuICAgIFwidmlvbGV0XCI6IHtcInJcIjogMjM4LCBcImdcIjogMTMwLCBcImJcIjogMjM4LCBcImhcIjogMzAwLCBcInNcIjogNzYsIFwibFwiOiA3Mn0sXG4gICAgXCJ3aGVhdFwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3OSwgXCJoXCI6IDM5LCBcInNcIjogNzcsIFwibFwiOiA4M30sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjQ1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA5Nn0sXG4gICAgXCJ5ZWxsb3dncmVlblwiOiB7XCJyXCI6IDE1NCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogODAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjtcbiIsInJlcXVpcmUoJy4vLi4vdGVzdHMvY29sb3IuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvaGVscGVycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9kYXRhL2NvbG9ycy5qcycpO1xuIiwidmFyIENvbG9yID0gcmVxdWlyZSgnLi4vc3JjL2NvbG91ci5qcycpO1xudmFyIG5hbWVkID0gcmVxdWlyZSgnLi9kYXRhL2NvbG9ycy5qcycpO1xudmFyIG5lYXJseUVxdWFsID0gcmVxdWlyZSgnLi9oZWxwZXJzLmpzJylbJ25lYXJseUVxdWFsJ107XG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcblxuc3VpdGUoJ0NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgcmVkLCBncmVlbiwgYmx1ZSwgcmdiLCByZ2JhLCBoc2wsIGhzbGE7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgcmVkID0gbmV3IENvbG9yKFwicmVkXCIpO1xuICAgICAgICBncmVlbiA9IG5ldyBDb2xvcihcIiMwRjBcIik7IC8vIE5hbWVkIGNvbG9yICdncmVlbicgaXMgcmdiKDAsMTI4LDApXG4gICAgICAgIGJsdWUgPSBuZXcgQ29sb3IoXCJibHVlXCIpO1xuICAgICAgICByZ2IgPSBuZXcgQ29sb3IoXCJyZ2IoMSwgNywgMjkpXCIpO1xuICAgICAgICByZ2JhID0gbmV3IENvbG9yKFwicmdiYSgxLCA3LCAyOSwgMC4zKVwiKTtcbiAgICAgICAgaHNsID0gbmV3IENvbG9yKFwiaHNsKDAsIDEwMCUsIDUwJSlcIik7XG4gICAgICAgIGhzbGEgPSBuZXcgQ29sb3IoXCJoc2xhKDAsIDEwMCUsIDUwJSwgMC4zKVwiKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ3JnYicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLnIsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuZywgNyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLmFscGhhLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5yLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5nLCA3KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhLnJnYi5iLCAyOSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBjb2xvciBpbiBuYW1lZCl7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVkLmhhc093blByb3BlcnR5KGNvbG9yKSl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmV3IENvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhleCA9IG5ldyBDb2xvcihuYW1lZFtjb2xvcl0uaGV4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVkX3JnYiA9IG5hbWVkW2NvbG9yXS5yZ2I7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBoZXgucmdiLnIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuZywgaGV4LnJnYi5nKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmIsIGhleC5yZ2IuYik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5yLCBuYW1lZF9yZ2Iucik7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5nLCBuYW1lZF9yZ2IuZyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5iLCBuYW1lZF9yZ2IuYik7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2hzbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5sLCA1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbC5oc2wucywgMTAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLmwsIDUwKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2wuYWxwaGEsIDEpKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLmgsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYS5oc2wubCwgNTApO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKGhzbGEuYWxwaGEsIDAuMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgY29sb3IgaW4gbmFtZWQpe1xuICAgICAgICAgICAgICAgIGlmIChuYW1lZC5oYXNPd25Qcm9wZXJ0eShjb2xvcikpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBDb2xvcihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3IobmFtZWRbY29sb3JdLmhleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lZF9oc2wgPSBuYW1lZFtjb2xvcl0ucmdiO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgaGV4LnJnYi5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIGhleC5yZ2Iucyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5sLCBoZXgucmdiLmwpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuaCwgbmFtZWRfaHNsLmgpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IucywgbmFtZWRfaHNsLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgbmFtZWRfaHNsLmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FscGhhJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZWQuYWxwaGEsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZ2JhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2xhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3VpdGUoJ21ldGhvZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdsaWdodGVuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciByMyA9IHJlZC5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4ubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgZzMgPSBncmVlbi5saWdodGVuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGIzID0gYmx1ZS5saWdodGVuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDUxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuciwgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMTAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuZywgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMjU1KTtcblxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZGFya2VuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIHIyID0gcmVkLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQuZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBnMSA9IGdyZWVuLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgZzIgPSBncmVlbi5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4uZGFya2VuKDUwKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciBiMiA9IGJsdWUuZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUuZGFya2VuKDUwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5yLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuZywgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5nLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5iLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5iLCAwKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuYiwgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5iLCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RvU3RyaW5nJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByMSA9IHJlZC50b0hleFN0cmluZygpO1xuICAgICAgICAgICAgdmFyIGcxID0gZ3JlZW4udG9IZXhTdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciBiMSA9IGJsdWUudG9IZXhTdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciByZ2IxID0gcmdiLnRvSGV4U3RyaW5nKCk7XG4gICAgICAgICAgICB2YXIgcmdiYTEgPSByZ2JhLnRvSGV4U3RyaW5nKCk7XG4gICAgICAgICAgICB2YXIgaHNsMSA9IGhzbC50b0hleFN0cmluZygpO1xuICAgICAgICAgICAgdmFyIGhzbGExID0gaHNsLnRvSGV4U3RyaW5nKCk7XG4gICAgICAgICAgICByZ2IgPSBuZXcgQ29sb3IoXCJyZ2IoMSwgNywgMjkpXCIpO1xuICAgICAgICAgICAgcmdiYSA9IG5ldyBDb2xvcihcInJnYmEoMSwgNywgMjksIDAuMylcIik7XG4gICAgICAgICAgICBoc2wgPSBuZXcgQ29sb3IoXCJoc2woMCwgMTAwJSwgNTAlKVwiKTtcbiAgICAgICAgICAgIGhzbGEgPSBuZXcgQ29sb3IoXCJoc2xhKDAsIDEwMCUsIDUwJSwgMC4zKVwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS50b0xvd2VyQ2FzZSgpLCBcIiNmZjAwMDBcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEudG9Mb3dlckNhc2UoKSwgXCIjMDBmZjAwXCIpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnRvTG93ZXJDYXNlKCksIFwiIzAwMDBmZlwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IxLnRvTG93ZXJDYXNlKCksIFwiIzAxMDcxZFwiKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2JhMS50b0xvd2VyQ2FzZSgpLCBcIiMwMTA3MWRcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsMS50b0xvd2VyQ2FzZSgpLCBcIiNmZjAwMDBcIik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsYTEudG9Mb3dlckNhc2UoKSwgXCIjZmYwMDAwXCIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBuYW1lZGNvbG9ycyA9IHtcbiAgICBcImFsaWNlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiAwIH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNDgsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmMGY4ZmZcIn0sXG4gICAgXCJhbnRpcXVld2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDIzNSxcImJcIjogMjE1IH0sIFwiaGV4XCI6IFwiI2ZhZWJkN1wifSxcbiAgICBcImFxdWFcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMGZmZmZcIn0sXG4gICAgXCJhcXVhbWFyaW5lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDEwMCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNyxcImdcIjogMjU1LFwiYlwiOiAyMTIgfSwgXCJoZXhcIjogXCIjN2ZmZmQ0XCJ9LFxuICAgIFwiYXp1cmVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjBmZmZmXCJ9LFxuICAgIFwiYmVpZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjQ1LFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZjVmNWRjXCJ9LFxuICAgIFwiYmlzcXVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAxOTYgfSwgXCJoZXhcIjogXCIjZmZlNGM0XCJ9LFxuICAgIFwiYmxhY2tcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMDAwMDBcIn0sXG4gICAgXCJibGFuY2hlZGFsbW9uZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIzNSxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiI2ZmZWJjZFwifSxcbiAgICBcImJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwMDBmZlwifSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzgsXCJnXCI6IDQzLFwiYlwiOiAyMjYgfSwgXCJoZXhcIjogXCIjOGEyYmUyXCJ9LFxuICAgIFwiYnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjUsXCJnXCI6IDQyLFwiYlwiOiA0MiB9LCBcImhleFwiOiBcIiNhNTJhMmFcIn0sXG4gICAgXCJidXJseXdvb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjIyLFwiZ1wiOiAxODQsXCJiXCI6IDEzNSB9LCBcImhleFwiOiBcIiNkZWI4ODdcIn0sXG4gICAgXCJjYWRldGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogOTUsXCJnXCI6IDE1OCxcImJcIjogMTYwIH0sIFwiaGV4XCI6IFwiIzVmOWVhMFwifSxcbiAgICBcImNoYXJ0cmV1c2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMTI3LFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjN2ZmZjAwXCJ9LFxuICAgIFwiY2hvY29sYXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMCxcImdcIjogMTA1LFwiYlwiOiAzMCB9LCBcImhleFwiOiBcIiNkMjY5MWVcIn0sXG4gICAgXCJjb3JhbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTI3LFwiYlwiOiA4MCB9LCBcImhleFwiOiBcIiNmZjdmNTBcIn0sXG4gICAgXCJjb3JuZmxvd2VyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMDgsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDAsXCJnXCI6IDE0OSxcImJcIjogMjM3IH0sIFwiaGV4XCI6IFwiIzY0OTVlZFwifSxcbiAgICBcImNvcm5zaWxrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA3OCxcImxcIjogOTEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI0OCxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2ZmZjhkY1wifSxcbiAgICBcImNyaW1zb25cIjoge1wiaHNsXCI6IHtcImhcIjogMTYwLFwic1wiOiAxMDAsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMjIwLFwiZ1wiOiAyMCxcImJcIjogNjAgfSwgXCJoZXhcIjogXCIjZGMxNDNjXCJ9LFxuICAgIFwiY3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMGZmZmZcIn0sXG4gICAgXCJkYXJrYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogNTYsXCJsXCI6IDkxIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzAwMDA4YlwifSxcbiAgICBcImRhcmtjeWFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMzLFwic1wiOiAxMDAsXCJsXCI6IDg4IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTM5LFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjMDA4YjhiXCJ9LFxuICAgIFwiZGFya2dvbGRlbnJvZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNixcInNcIjogMTAwLFwibFwiOiA5MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE4NCxcImdcIjogMTM0LFwiYlwiOiAxMSB9LCBcImhleFwiOiBcIiNiODg2MGJcIn0sXG4gICAgXCJkYXJrZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNzEsXCJzXCI6IDc2LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDE2OSxcImdcIjogMTY5LFwiYlwiOiAxNjkgfSwgXCJoZXhcIjogXCIjYTlhOWE5XCJ9LFxuICAgIFwiZGFya2dyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDU5LFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEwMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMDY0MDBcIn0sXG4gICAgXCJkYXJrZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNTcsXCJsXCI6IDcwIH0sIFwicmdiXCI6IHtcInJcIjogMTY5LFwiZ1wiOiAxNjksXCJiXCI6IDE2OSB9LCBcImhleFwiOiBcIiNhOWE5YTlcIn0sXG4gICAgXCJkYXJra2hha2lcIjoge1wiaHNsXCI6IHtcImhcIjogMTgyLFwic1wiOiAyNSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxODksXCJnXCI6IDE4MyxcImJcIjogMTA3IH0sIFwiaGV4XCI6IFwiI2JkYjc2YlwifSxcbiAgICBcImRhcmttYWdlbnRhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDkwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiAwLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjOGIwMDhiXCJ9LFxuICAgIFwiZGFya29saXZlZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMjUsXCJzXCI6IDc1LFwibFwiOiA0NyB9LCBcInJnYlwiOiB7XCJyXCI6IDg1LFwiZ1wiOiAxMDcsXCJiXCI6IDQ3IH0sIFwiaGV4XCI6IFwiIzU1NmIyZlwifSxcbiAgICBcImRhcmtvcmFuZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTYsXCJzXCI6IDEwMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE0MCxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZjhjMDBcIn0sXG4gICAgXCJkYXJrb3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxOSxcInNcIjogNzksXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMTUzLFwiZ1wiOiA1MCxcImJcIjogMjA0IH0sIFwiaGV4XCI6IFwiIzk5MzJjY1wifSxcbiAgICBcImRhcmtyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogNDgsXCJzXCI6IDEwMCxcImxcIjogOTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzksXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjOGIwMDAwXCJ9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDgsXCJzXCI6IDgzLFwibFwiOiA0NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIzMyxcImdcIjogMTUwLFwiYlwiOiAxMjIgfSwgXCJoZXhcIjogXCIjZTk5NjdhXCJ9LFxuICAgIFwiZGFya3NlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDE0MyxcImdcIjogMTg4LFwiYlwiOiAxNDMgfSwgXCJoZXhcIjogXCIjOGZiYzhmXCJ9LFxuICAgIFwiZGFya3NsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiA3MixcImdcIjogNjEsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiM0ODNkOGJcIn0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDQzLFwic1wiOiA4OSxcImxcIjogMzggfSwgXCJyZ2JcIjoge1wiclwiOiA0NyxcImdcIjogNzksXCJiXCI6IDc5IH0sIFwiaGV4XCI6IFwiIzJmNGY0ZlwifSxcbiAgICBcImRhcmtzbGF0ZWdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiA0NyxcImdcIjogNzksXCJiXCI6IDc5IH0sIFwiaGV4XCI6IFwiIzJmNGY0ZlwifSxcbiAgICBcImRhcmt0dXJxdW9pc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDIwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjA2LFwiYlwiOiAyMDkgfSwgXCJoZXhcIjogXCIjMDBjZWQxXCJ9LFxuICAgIFwiZGFya3Zpb2xldFwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE0OCxcImdcIjogMCxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiIzk0MDBkM1wifSxcbiAgICBcImRlZXBwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU2LFwic1wiOiAzOCxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIwLFwiYlwiOiAxNDcgfSwgXCJoZXhcIjogXCIjZmYxNDkzXCJ9LFxuICAgIFwiZGVlcHNreWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMTkxLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBiZmZmXCJ9LFxuICAgIFwiZGltZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MixcInNcIjogMzksXCJsXCI6IDMwIH0sIFwicmdiXCI6IHtcInJcIjogMTA1LFwiZ1wiOiAxMDUsXCJiXCI6IDEwNSB9LCBcImhleFwiOiBcIiM2OTY5NjlcIn0sXG4gICAgXCJkaW1ncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDMzLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTA1LFwiZ1wiOiAxMDUsXCJiXCI6IDEwNSB9LCBcImhleFwiOiBcIiM2OTY5NjlcIn0sXG4gICAgXCJkb2RnZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4MCxcInNcIjogNjEsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMzAsXCJnXCI6IDE0NCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzFlOTBmZlwifSxcbiAgICBcImZpcmVicmlja1wiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTc4LFwiZ1wiOiAzNCxcImJcIjogMzQgfSwgXCJoZXhcIjogXCIjYjIyMjIyXCJ9LFxuICAgIFwiZmxvcmFsd2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTUsXCJzXCI6IDcyLFwibFwiOiA3MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZmZmYWYwXCJ9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAyNSxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAzNCxcImdcIjogMTM5LFwiYlwiOiAzNCB9LCBcImhleFwiOiBcIiMyMjhiMjJcIn0sXG4gICAgXCJmdWNoc2lhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0OCxcInNcIjogMzksXCJsXCI6IDM5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAwLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZmYwMGZmXCJ9LFxuICAgIFwiZ2FpbnNib3JvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMjUsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjIwLFwiZ1wiOiAyMjAsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNkY2RjZGNcIn0sXG4gICAgXCJnaG9zdHdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMjUsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjQ4LFwiZ1wiOiAyNDgsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmOGY4ZmZcIn0sXG4gICAgXCJnb2xkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MSxcInNcIjogMTAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjE1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmZDcwMFwifSxcbiAgICBcImdvbGRlbnJvZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODIsXCJzXCI6IDEwMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTgsXCJnXCI6IDE2NSxcImJcIjogMzIgfSwgXCJoZXhcIjogXCIjZGFhNTIwXCJ9LFxuICAgIFwiZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMjgsXCJzXCI6IDEwMCxcImxcIjogNTQgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwODA4MFwifSxcbiAgICBcImdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5NSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEyOCxcImJcIjogMCB9LCBcImhleFwiOiBcIiMwMDgwMDBcIn0sXG4gICAgXCJncmVlbnllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDE3MyxcImdcIjogMjU1LFwiYlwiOiA0NyB9LCBcImhleFwiOiBcIiNhZGZmMmZcIn0sXG4gICAgXCJncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDgwODBcIn0sXG4gICAgXCJob25leWRld1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEwMCxcImxcIjogNTYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI1NSxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2YwZmZmMFwifSxcbiAgICBcImhvdHBpbmtcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNjgsXCJsXCI6IDQyIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxMDUsXCJiXCI6IDE4MCB9LCBcImhleFwiOiBcIiNmZjY5YjRcIn0sXG4gICAgXCJpbmRpYW5yZWRcIjoge1wiaHNsXCI6IHtcImhcIjogNDAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMDUsXCJnXCI6IDkyLFwiYlwiOiA5MiB9LCBcImhleFwiOiBcIiNjZDVjNWNcIn0sXG4gICAgXCJpbmRpZ29cIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiA2MSxcImxcIjogMzQgfSwgXCJyZ2JcIjoge1wiclwiOiA3NSxcImdcIjogMCxcImJcIjogMTMwIH0sIFwiaGV4XCI6IFwiIzRiMDA4MlwifSxcbiAgICBcIml2b3J5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmZmZmZjBcIn0sXG4gICAgXCJraGFraVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogOTkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDIzMCxcImJcIjogMTQwIH0sIFwiaGV4XCI6IFwiI2YwZTY4Y1wifSxcbiAgICBcImxhdmVuZGVyXCI6IHtcImhzbFwiOiB7XCJoXCI6IDUxLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjMwLFwiZ1wiOiAyMzAsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiNlNmU2ZmFcIn0sXG4gICAgXCJsYXZlbmRlcmJsdXNoXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQzLFwic1wiOiA3NCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI0MCxcImJcIjogMjQ1IH0sIFwiaGV4XCI6IFwiI2ZmZjBmNVwifSxcbiAgICBcImxhd25ncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA4NCxcInNcIjogMTAwLFwibFwiOiA1OSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNCxcImdcIjogMjUyLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzdjZmMwMFwifSxcbiAgICBcImxlbW9uY2hpZmZvblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyMDUgfSwgXCJoZXhcIjogXCIjZmZmYWNkXCJ9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDE3MyxcImdcIjogMjE2LFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjYWRkOGU2XCJ9LFxuICAgIFwibGlnaHRjb3JhbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMzAsXCJzXCI6IDEwMCxcImxcIjogNzEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiI2YwODA4MFwifSxcbiAgICBcImxpZ2h0Y3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA1MyxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAyMjQsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2UwZmZmZlwifSxcbiAgICBcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDI3NSxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjUwLFwiYlwiOiAyMTAgfSwgXCJoZXhcIjogXCIjZmFmYWQyXCJ9LFxuICAgIFwibGlnaHRncmF5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjExLFwiZ1wiOiAyMTEsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNkM2QzZDNcIn0sXG4gICAgXCJsaWdodGdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU0LFwic1wiOiA3NyxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDQsXCJnXCI6IDIzOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzkwZWU5MFwifSxcbiAgICBcImxpZ2h0Z3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDY3LFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMSxcImdcIjogMjExLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjZDNkM2QzXCJ9LFxuICAgIFwibGlnaHRwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTgyLFwiYlwiOiAxOTMgfSwgXCJoZXhcIjogXCIjZmZiNmMxXCJ9LFxuICAgIFwibGlnaHRzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogOTAsXCJzXCI6IDEwMCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE2MCxcImJcIjogMTIyIH0sIFwiaGV4XCI6IFwiI2ZmYTA3YVwifSxcbiAgICBcImxpZ2h0c2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNTQsXCJzXCI6IDEwMCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAzMixcImdcIjogMTc4LFwiYlwiOiAxNzAgfSwgXCJoZXhcIjogXCIjMjBiMmFhXCJ9LFxuICAgIFwibGlnaHRza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5NSxcInNcIjogNTMsXCJsXCI6IDc5IH0sIFwicmdiXCI6IHtcInJcIjogMTM1LFwiZ1wiOiAyMDYsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiM4N2NlZmFcIn0sXG4gICAgXCJsaWdodHNsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA3OSxcImxcIjogNzIgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTksXCJnXCI6IDEzNixcImJcIjogMTUzIH0sIFwiaGV4XCI6IFwiIzc3ODg5OVwifSxcbiAgICBcImxpZ2h0c2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDExOSxcImdcIjogMTM2LFwiYlwiOiAxNTMgfSwgXCJoZXhcIjogXCIjNzc4ODk5XCJ9LFxuICAgIFwibGlnaHRzdGVlbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDgwLFwibFwiOiA5MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE3NixcImdcIjogMTk2LFwiYlwiOiAyMjIgfSwgXCJoZXhcIjogXCIjYjBjNGRlXCJ9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMjI0IH0sIFwiaGV4XCI6IFwiI2ZmZmZlMFwifSxcbiAgICBcImxpbWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiA3MyxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDBmZjAwXCJ9LFxuICAgIFwibGltZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogNTAsXCJnXCI6IDIwNSxcImJcIjogNTAgfSwgXCJoZXhcIjogXCIjMzJjZDMyXCJ9LFxuICAgIFwibGluZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzUxLFwic1wiOiAxMDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyNDAsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNmYWYwZTZcIn0sXG4gICAgXCJtYWdlbnRhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3LFwic1wiOiAxMDAsXCJsXCI6IDc0IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAwLFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZmYwMGZmXCJ9LFxuICAgIFwibWFyb29uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3NyxcInNcIjogNzAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzgwMDAwMFwifSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiaHNsXCI6IHtcImhcIjogMjAzLFwic1wiOiA5MixcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMDIsXCJnXCI6IDIwNSxcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiIzY2Y2RhYVwifSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxNCxcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAyMDUgfSwgXCJoZXhcIjogXCIjMDAwMGNkXCJ9LFxuICAgIFwibWVkaXVtb3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTQsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMTg2LFwiZ1wiOiA4NSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2JhNTVkM1wifSxcbiAgICBcIm1lZGl1bXB1cnBsZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTQsXCJzXCI6IDQxLFwibFwiOiA3OCB9LCBcInJnYlwiOiB7XCJyXCI6IDE0NyxcImdcIjogMTEyLFwiYlwiOiAyMTkgfSwgXCJoZXhcIjogXCIjOTM3MGRiXCJ9LFxuICAgIFwibWVkaXVtc2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiA2MCxcImdcIjogMTc5LFwiYlwiOiAxMTMgfSwgXCJoZXhcIjogXCIjM2NiMzcxXCJ9LFxuICAgIFwibWVkaXVtc2xhdGVibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNjEsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTIzLFwiZ1wiOiAxMDQsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiM3YjY4ZWVcIn0sXG4gICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMCxcInNcIjogNjcsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjUwLFwiYlwiOiAxNTQgfSwgXCJoZXhcIjogXCIjMDBmYTlhXCJ9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2MCxcInNcIjogNTEsXCJsXCI6IDYwIH0sIFwicmdiXCI6IHtcInJcIjogNzIsXCJnXCI6IDIwOSxcImJcIjogMjA0IH0sIFwiaGV4XCI6IFwiIzQ4ZDFjY1wifSxcbiAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogNDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxOTksXCJnXCI6IDIxLFwiYlwiOiAxMzMgfSwgXCJoZXhcIjogXCIjYzcxNTg1XCJ9LFxuICAgIFwibWlkbmlnaHRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4OCxcInNcIjogNTksXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjUsXCJnXCI6IDI1LFwiYlwiOiAxMTIgfSwgXCJoZXhcIjogXCIjMTkxOTcwXCJ9LFxuICAgIFwibWludGNyZWFtXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI2MCxcInNcIjogNjAsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjQ1LFwiZ1wiOiAyNTUsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiNmNWZmZmFcIn0sXG4gICAgXCJtaXN0eXJvc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTQ3LFwic1wiOiA1MCxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMjI1IH0sIFwiaGV4XCI6IFwiI2ZmZTRlMVwifSxcbiAgICBcIm1vY2Nhc2luXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0OSxcInNcIjogODAsXCJsXCI6IDY3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDE4MSB9LCBcImhleFwiOiBcIiNmZmU0YjVcIn0sXG4gICAgXCJuYXZham93aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTcsXCJzXCI6IDEwMCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyMixcImJcIjogMTczIH0sIFwiaGV4XCI6IFwiI2ZmZGVhZFwifSxcbiAgICBcIm5hdnlcIjoge1wiaHNsXCI6IHtcImhcIjogMTc4LFwic1wiOiA2MCxcImxcIjogNTUgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAwLFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjMDAwMDgwXCJ9LFxuICAgIFwib2xkbGFjZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMjIsXCJzXCI6IDgxLFwibFwiOiA0MyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MyxcImdcIjogMjQ1LFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjZmRmNWU2XCJ9LFxuICAgIFwib2xpdmVcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiA2NCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjgsXCJnXCI6IDEyOCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4MDgwMDBcIn0sXG4gICAgXCJvbGl2ZWRyYWJcIjoge1wiaHNsXCI6IHtcImhcIjogMTUwLFwic1wiOiAxMDAsXCJsXCI6IDk4IH0sIFwicmdiXCI6IHtcInJcIjogMTA3LFwiZ1wiOiAxNDIsXCJiXCI6IDM1IH0sIFwiaGV4XCI6IFwiIzZiOGUyM1wifSxcbiAgICBcIm9yYW5nZVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2LFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNjUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZhNTAwXCJ9LFxuICAgIFwib3JhbmdlcmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM4LFwic1wiOiAxMDAsXCJsXCI6IDg1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiA2OSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZjQ1MDBcIn0sXG4gICAgXCJvcmNoaWRcIjoge1wiaHNsXCI6IHtcImhcIjogMzYsXCJzXCI6IDEwMCxcImxcIjogODQgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTgsXCJnXCI6IDExMixcImJcIjogMjE0IH0sIFwiaGV4XCI6IFwiI2RhNzBkNlwifSxcbiAgICBcInBhbGVnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDg1LFwibFwiOiA5NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIzOCxcImdcIjogMjMyLFwiYlwiOiAxNzAgfSwgXCJoZXhcIjogXCIjZWVlOGFhXCJ9LFxuICAgIFwicGFsZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDgwLFwic1wiOiA2MCxcImxcIjogMzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxNTIsXCJnXCI6IDI1MSxcImJcIjogMTUyIH0sIFwiaGV4XCI6IFwiIzk4ZmI5OFwifSxcbiAgICBcInBhbGV0dXJxdW9pc2VcIjoge1wiaHNsXCI6IHtcImhcIjogMTYsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzUsXCJnXCI6IDIzOCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2FmZWVlZVwifSxcbiAgICBcInBhbGV2aW9sZXRyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMzAyLFwic1wiOiA1OSxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTksXCJnXCI6IDExMixcImJcIjogMTQ3IH0sIFwiaGV4XCI6IFwiI2RiNzA5M1wifSxcbiAgICBcInBhcGF5YXdoaXBcIjoge1wiaHNsXCI6IHtcImhcIjogNTUsXCJzXCI6IDY3LFwibFwiOiA4MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjM5LFwiYlwiOiAyMTMgfSwgXCJoZXhcIjogXCIjZmZlZmQ1XCJ9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogOTMsXCJsXCI6IDc5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMTgsXCJiXCI6IDE4NSB9LCBcImhleFwiOiBcIiNmZmRhYjlcIn0sXG4gICAgXCJwZXJ1XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogNjUsXCJsXCI6IDgxIH0sIFwicmdiXCI6IHtcInJcIjogMjA1LFwiZ1wiOiAxMzMsXCJiXCI6IDYzIH0sIFwiaGV4XCI6IFwiI2NkODUzZlwifSxcbiAgICBcInBpbmtcIjoge1wiaHNsXCI6IHtcImhcIjogMzQwLFwic1wiOiA2MCxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE5MixcImJcIjogMjAzIH0sIFwiaGV4XCI6IFwiI2ZmYzBjYlwifSxcbiAgICBcInBsdW1cIjoge1wiaHNsXCI6IHtcImhcIjogMzcsXCJzXCI6IDEwMCxcImxcIjogOTIgfSwgXCJyZ2JcIjoge1wiclwiOiAyMjEsXCJnXCI6IDE2MCxcImJcIjogMjIxIH0sIFwiaGV4XCI6IFwiI2RkYTBkZFwifSxcbiAgICBcInBvd2RlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjgsXCJzXCI6IDEwMCxcImxcIjogODYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzYsXCJnXCI6IDIyNCxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2IwZTBlNlwifSxcbiAgICBcInB1cnBsZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMCxcInNcIjogNTksXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAwLFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODAwMDgwXCJ9LFxuICAgIFwicmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM1MCxcInNcIjogMTAwLFwibFwiOiA4OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZjAwMDBcIn0sXG4gICAgXCJyb3N5YnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiA0NyxcImxcIjogNzUgfSwgXCJyZ2JcIjoge1wiclwiOiAxODgsXCJnXCI6IDE0MyxcImJcIjogMTQzIH0sIFwiaGV4XCI6IFwiI2JjOGY4ZlwifSxcbiAgICBcInJveWFsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODcsXCJzXCI6IDUyLFwibFwiOiA4MCB9LCBcInJnYlwiOiB7XCJyXCI6IDY1LFwiZ1wiOiAxMDUsXCJiXCI6IDIyNSB9LCBcImhleFwiOiBcIiM0MTY5ZTFcIn0sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAyNSxcImxcIjogNjUgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzksXCJnXCI6IDY5LFwiYlwiOiAxOSB9LCBcImhleFwiOiBcIiM4YjQ1MTNcIn0sXG4gICAgXCJzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogMjI1LFwic1wiOiA3MyxcImxcIjogNTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDEyOCxcImJcIjogMTE0IH0sIFwiaGV4XCI6IFwiI2ZhODA3MlwifSxcbiAgICBcInNhbmR5YnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMjUsXCJzXCI6IDc2LFwibFwiOiAzMSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NCxcImdcIjogMTY0LFwiYlwiOiA5NiB9LCBcImhleFwiOiBcIiNmNGE0NjBcIn0sXG4gICAgXCJzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA2LFwic1wiOiA5MyxcImxcIjogNzEgfSwgXCJyZ2JcIjoge1wiclwiOiA0NixcImdcIjogMTM5LFwiYlwiOiA4NyB9LCBcImhleFwiOiBcIiMyZThiNTdcIn0sXG4gICAgXCJzZWFzaGVsbFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyOCxcInNcIjogODcsXCJsXCI6IDY3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDUsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNmZmY1ZWVcIn0sXG4gICAgXCJzaWVubmFcIjoge1wiaHNsXCI6IHtcImhcIjogMTQ2LFwic1wiOiA1MCxcImxcIjogMzYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjAsXCJnXCI6IDgyLFwiYlwiOiA0NSB9LCBcImhleFwiOiBcIiNhMDUyMmRcIn0sXG4gICAgXCJzaWx2ZXJcIjoge1wiaHNsXCI6IHtcImhcIjogMjUsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxOTIsXCJnXCI6IDE5MixcImJcIjogMTkyIH0sIFwiaGV4XCI6IFwiI2MwYzBjMFwifSxcbiAgICBcInNreWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTksXCJzXCI6IDU2LFwibFwiOiA0MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEzNSxcImdcIjogMjA2LFwiYlwiOiAyMzUgfSwgXCJoZXhcIjogXCIjODdjZWViXCJ9LFxuICAgIFwic2xhdGVibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5NyxcInNcIjogNzEsXCJsXCI6IDczIH0sIFwicmdiXCI6IHtcInJcIjogMTA2LFwiZ1wiOiA5MCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiIzZhNWFjZFwifSxcbiAgICBcInNsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDgsXCJzXCI6IDUzLFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDExMixcImdcIjogMTI4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjNzA4MDkwXCJ9LFxuICAgIFwic2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTMsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTEyLFwiZ1wiOiAxMjgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM3MDgwOTBcIn0sXG4gICAgXCJzbm93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTMsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTAsXCJiXCI6IDI1MCB9LCBcImhleFwiOiBcIiNmZmZhZmFcIn0sXG4gICAgXCJzcHJpbmdncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAxMDAsXCJsXCI6IDk5IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAxMjcgfSwgXCJoZXhcIjogXCIjMDBmZjdmXCJ9LFxuICAgIFwic3RlZWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDcwLFwiZ1wiOiAxMzAsXCJiXCI6IDE4MCB9LCBcImhleFwiOiBcIiM0NjgyYjRcIn0sXG4gICAgXCJ0YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMjA3LFwic1wiOiA0NCxcImxcIjogNDkgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTAsXCJnXCI6IDE4MCxcImJcIjogMTQwIH0sIFwiaGV4XCI6IFwiI2QyYjQ4Y1wifSxcbiAgICBcInRlYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDQ0LFwibFwiOiA2OSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEyOCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzAwODA4MFwifSxcbiAgICBcInRoaXN0bGVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiAyNCxcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTYsXCJnXCI6IDE5MSxcImJcIjogMjE2IH0sIFwiaGV4XCI6IFwiI2Q4YmZkOFwifSxcbiAgICBcInRvbWF0b1wiOiB7XCJoc2xcIjoge1wiaFwiOiA5LFwic1wiOiAxMDAsXCJsXCI6IDY0IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiA5OSxcImJcIjogNzEgfSwgXCJoZXhcIjogXCIjZmY2MzQ3XCJ9LFxuICAgIFwidHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3NCxcInNcIjogNzIsXCJsXCI6IDU2IH0sIFwicmdiXCI6IHtcInJcIjogNjQsXCJnXCI6IDIyNCxcImJcIjogMjA4IH0sIFwiaGV4XCI6IFwiIzQwZTBkMFwifSxcbiAgICBcInZpb2xldFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDc2LFwibFwiOiA3MiB9LCBcInJnYlwiOiB7XCJyXCI6IDIzOCxcImdcIjogMTMwLFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjZWU4MmVlXCJ9LFxuICAgIFwid2hlYXRcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDc3LFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjIyLFwiYlwiOiAxNzkgfSwgXCJoZXhcIjogXCIjZjVkZWIzXCJ9LFxuICAgIFwid2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogOTYgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmZmZmZlwifSxcbiAgICBcIndoaXRlc21va2VcIjoge1wiaHNsXCI6IHtcImhcIjogODAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjQ1LFwiYlwiOiAyNDUgfSwgXCJoZXhcIjogXCIjZjVmNWY1XCJ9LFwieWVsbG93XCI6IHsgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1NSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmZmMDBcIn0sXCJ5ZWxsb3dncmVlblwiOiB7IFwicmdiXCI6IHtcInJcIjogMTU0LFwiZ1wiOiAyMDUsXCJiXCI6IDUwIH0sIFwiaGV4XCI6IFwiIzlhY2QzMlwifVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5hbWVkY29sb3JzOyIsImZ1bmN0aW9uIG5lYXJseUVxdWFsKGEsIGIsIGVwcyl7XG4gICAgaWYgKHR5cGVvZiBlcHMgPT09IFwidW5kZWZpbmVkXCIpIHtlcHMgPSAwLjAxO31cbiAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICByZXR1cm4gKGRpZmYgPCBlcHMpO1xufVxuXG52YXIgaGVscGVycyA9IG5ldyBPYmplY3QobnVsbCk7XG5cbmhlbHBlcnMubmVhcmx5RXF1YWwgPSBuZWFybHlFcXVhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWxwZXJzOyJdfQ==
(7)
});
