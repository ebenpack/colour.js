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
/**
 * @license
 * Copyright (c) 2014 Eben Packwood. All rights reserved.
 * MIT License
 *
 */

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
    if (!(type in this._listeners)) {
        this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
};
/**
 * @method
 * @param  {string} event
 */
EventTarget.prototype.fire = function(event){
    var e = {"event": event, "target": this};
    var listeners = this._listeners[event];
    for (var i = 0, len = listeners.length; i < len; i++) {
        listeners[i].call(this, e);
    }
};
/**
 * @method
 * @param  {string} type
 * @param  {function} listener
 */
EventTarget.prototype.removeListener = function(type, listener){
    var listeners = this._listeners[type];
    for (var i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i] === listener) {
            listeners.splice(i, 1);
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
var rgbToHsl, parseColor, cache, div;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9ub2RlX21vZHVsZXMvbGluZWFyYWxnZWEvYnVpbGQvbGluZWFyYWxnZWEuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvZW5naW5lL2NhbWVyYS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9lbmdpbmUvZXZlbnRzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2VuZ2luZS9zY2VuZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3NyYy9nZW9tZXRyeS9mYWNlLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL2dlb21ldHJ5L21lc2guanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS9zcmMvdXRpbGl0aWVzL2NvbG9yLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvc3JjL3V0aWxpdGllcy9rZXljb2Rlcy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3QvZmFrZV8xYTRmYzFlMy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2RhdGEvY29sb3JzLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvZW5naW5lL2NhbWVyYS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2VuZ2luZS9zY2VuZS5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL2dlb21ldHJ5L2ZhY2UuanMiLCIvaG9tZS9lYmVucGFjay9Ecm9wYm94L0hvbWV3b3JrL3dpcmVmcmFtZS90ZXN0cy9nZW9tZXRyeS9tZXNoLmpzIiwiL2hvbWUvZWJlbnBhY2svRHJvcGJveC9Ib21ld29yay93aXJlZnJhbWUvdGVzdHMvaGVscGVycy5qcyIsIi9ob21lL2ViZW5wYWNrL0Ryb3Bib3gvSG9tZXdvcmsvd2lyZWZyYW1lL3Rlc3RzL3V0aWxpdGllcy9jb2xvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAgICBrZXksIGk7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4hZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi5saW5lYXJhbGdlYT1lKCl9fShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNCBFYmVuIFBhY2t3b29kLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogTUlUIExpY2Vuc2VcbiAqXG4gKi9cblxudmFyIFZlY3RvciA9IF9kZXJlcV8oJy4vdmVjdG9yLmpzJyk7XG52YXIgTWF0cml4ID0gX2RlcmVxXygnLi9tYXRyaXguanMnKTtcblxudmFyIG1hdGggPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5tYXRoLlZlY3RvciA9IFZlY3Rvcjtcbm1hdGguTWF0cml4ID0gTWF0cml4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGg7XG5cbn0se1wiLi9tYXRyaXguanNcIjoyLFwiLi92ZWN0b3IuanNcIjozfV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKiogXG4gKiA0eDQgbWF0cml4LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1hdHJpeCgpe1xuICAgIGZvciAodmFyIGk9MDsgaTwxNjsgaSsrKXtcbiAgICAgICAgdGhpc1tpXSA9IDA7XG4gICAgfVxuICAgIHRoaXMubGVuZ3RoID0gMTY7XG59XG4vKipcbiAqIENvbXBhcmUgbWF0cml4IHdpdGggc2VsZiBmb3IgZXF1YWxpdHkuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5NYXRyaXgucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIGlmICh0aGlzW2ldICE9PSBtYXRyaXhbaV0pe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcbi8qKlxuICogQWRkIG1hdHJpeCB0byBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gdGhpc1tpXSArIG1hdHJpeFtpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBTdWJ0cmFjdCBtYXRyaXggZnJvbSBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldIC0gbWF0cml4W2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE11bHRpcGx5IHNlbGYgYnkgc2NhbGFyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyID0gZnVuY3Rpb24oc2NhbGFyKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldICogc2NhbGFyO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE11bHRpcGx5IHNlbGYgYnkgbWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24obWF0cml4KXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBuZXdfbWF0cml4WzBdID0gKHRoaXNbMF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMl0gKiBtYXRyaXhbOF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzFdID0gKHRoaXNbMF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbMl0gKiBtYXRyaXhbOV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzJdID0gKHRoaXNbMF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbMl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzNdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFszXSA9ICh0aGlzWzBdICogbWF0cml4WzNdKSArICh0aGlzWzFdICogbWF0cml4WzddKSArICh0aGlzWzJdICogbWF0cml4WzExXSkgKyAodGhpc1szXSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbNF0gPSAodGhpc1s0XSAqIG1hdHJpeFswXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs0XSkgKyAodGhpc1s2XSAqIG1hdHJpeFs4XSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxMl0pO1xuICAgIG5ld19tYXRyaXhbNV0gPSAodGhpc1s0XSAqIG1hdHJpeFsxXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs1XSkgKyAodGhpc1s2XSAqIG1hdHJpeFs5XSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbNl0gPSAodGhpc1s0XSAqIG1hdHJpeFsyXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs2XSkgKyAodGhpc1s2XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzddID0gKHRoaXNbNF0gKiBtYXRyaXhbM10pICsgKHRoaXNbNV0gKiBtYXRyaXhbN10pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzddICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFs4XSA9ICh0aGlzWzhdICogbWF0cml4WzBdKSArICh0aGlzWzldICogbWF0cml4WzRdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs4XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzldID0gKHRoaXNbOF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbMTBdICogbWF0cml4WzldKSArICh0aGlzWzExXSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMTBdID0gKHRoaXNbOF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbMTBdICogbWF0cml4WzEwXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzExXSA9ICh0aGlzWzhdICogbWF0cml4WzNdKSArICh0aGlzWzldICogbWF0cml4WzddKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbMTFdICogbWF0cml4WzE1XSk7XG4gICAgbmV3X21hdHJpeFsxMl0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMF0pICsgKHRoaXNbMTNdICogbWF0cml4WzRdKSArICh0aGlzWzE0XSAqIG1hdHJpeFs4XSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzEzXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNV0pICsgKHRoaXNbMTRdICogbWF0cml4WzldKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxM10pO1xuICAgIG5ld19tYXRyaXhbMTRdID0gKHRoaXNbMTJdICogbWF0cml4WzJdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs2XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbMTVdID0gKHRoaXNbMTJdICogbWF0cml4WzNdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs3XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxNV0pO1xuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTmVnYXRlIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubmVnYXRlID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSAtdGhpc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBUcmFuc3Bvc2Ugc2VsZi5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS50cmFuc3Bvc2UgPSBmdW5jdGlvbigpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIG5ld19tYXRyaXhbMF0gPSB0aGlzWzBdO1xuICAgIG5ld19tYXRyaXhbMV0gPSB0aGlzWzRdO1xuICAgIG5ld19tYXRyaXhbMl0gPSB0aGlzWzhdO1xuICAgIG5ld19tYXRyaXhbM10gPSB0aGlzWzEyXTtcbiAgICBuZXdfbWF0cml4WzRdID0gdGhpc1sxXTtcbiAgICBuZXdfbWF0cml4WzVdID0gdGhpc1s1XTtcbiAgICBuZXdfbWF0cml4WzZdID0gdGhpc1s5XTtcbiAgICBuZXdfbWF0cml4WzddID0gdGhpc1sxM107XG4gICAgbmV3X21hdHJpeFs4XSA9IHRoaXNbMl07XG4gICAgbmV3X21hdHJpeFs5XSA9IHRoaXNbNl07XG4gICAgbmV3X21hdHJpeFsxMF0gPSB0aGlzWzEwXTtcbiAgICBuZXdfbWF0cml4WzExXSA9IHRoaXNbMTRdO1xuICAgIG5ld19tYXRyaXhbMTJdID0gdGhpc1szXTtcbiAgICBuZXdfbWF0cml4WzEzXSA9IHRoaXNbN107XG4gICAgbmV3X21hdHJpeFsxNF0gPSB0aGlzWzExXTtcbiAgICBuZXdfbWF0cml4WzE1XSA9IHRoaXNbMTVdO1xuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIHgtYXhpc1xuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvblggPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzZdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbOV0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMTVdID0gMTtcbiAgICByZXR1cm4gcm90YXRpb25fbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCwgcm90YXRpbmcgYnkgdGhldGEgYXJvdW5kIHRoZSB5LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25ZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMl0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgei1heGlzXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uWiA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzFdID0gLXNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNF0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSAxO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIGF4aXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7VmVjdG9yfSBheGlzXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uQXhpcyA9IGZ1bmN0aW9uKGF4aXMsIHRoZXRhKXtcbiAgICB2YXIgcm90YXRpb25fbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHZhciB1ID0gYXhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB1Lng7XG4gICAgdmFyIHV5ID0gdS55O1xuICAgIHZhciB1eiA9IHUuejtcbiAgICB2YXIgeHkgPSB1eCAqIHV5O1xuICAgIHZhciB4eiA9IHV4ICogdXo7XG4gICAgdmFyIHl6ID0gdXkgKiB1ejtcbiAgICByb3RhdGlvbl9tYXRyaXhbMF0gPSBjb3MgKyAoKHV4KnV4KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMV0gPSAoeHkqY29zMSkgLSAodXoqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMl0gPSAoeHoqY29zMSkrKHV5KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzRdID0gKHh5KmNvczEpKyh1eipzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs1XSA9IGNvcysoKHV5KnV5KSpjb3MxKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNl0gPSAoeXoqY29zMSktKHV4KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzhdID0gKHh6KmNvczEpLSh1eSpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs5XSA9ICh5eipjb3MxKSsodXgqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbMTBdID0gY29zICsgKCh1eip1eikqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXggZnJvbSBwaXRjaCwgeWF3LCBhbmQgcm9sbFxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHBpdGNoXG4gKiBAcGFyYW0ge251bWJlcn0geWF3XG4gKiBAcGFyYW0ge251bWJlcn0gcm9sbFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb24gPSBmdW5jdGlvbihwaXRjaCwgeWF3LCByb2xsKXtcbiAgICByZXR1cm4gTWF0cml4LnJvdGF0aW9uWChyb2xsKS5tdWx0aXBseShNYXRyaXgucm90YXRpb25aKHlhdykpLm11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblkocGl0Y2gpKTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB0cmFuc2xhdGlvbiBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBkaXN0YW5jZXNcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnRyYW5zbGF0aW9uID0gZnVuY3Rpb24oeHRyYW5zLCB5dHJhbnMsIHp0cmFucyl7XG4gICAgdmFyIHRyYW5zbGF0aW9uX21hdHJpeCA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxMl0gPSB4dHJhbnM7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEzXSA9IHl0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTRdID0genRyYW5zO1xuICAgIHJldHVybiB0cmFuc2xhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgc2NhbGluZyBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBzY2FsZVxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguc2NhbGUgPSBmdW5jdGlvbih4c2NhbGUsIHlzY2FsZSwgenNjYWxlKXtcbiAgICB2YXIgc2NhbGluZ19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgc2NhbGluZ19tYXRyaXhbMF0gPSB4c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbNV0gPSB5c2NhbGU7XG4gICAgc2NhbGluZ19tYXRyaXhbMTBdID0genNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHNjYWxpbmdfbWF0cml4O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhbiBpZGVudGl0eSBtYXRyaXhcbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LmlkZW50aXR5ID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgaWRlbnRpdHkgPSBuZXcgTWF0cml4KCk7XG4gICAgaWRlbnRpdHlbMF0gPSAxO1xuICAgIGlkZW50aXR5WzVdID0gMTtcbiAgICBpZGVudGl0eVsxMF0gPSAxO1xuICAgIGlkZW50aXR5WzE1XSA9IDE7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHplcm8gbWF0cml4XG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC56ZXJvID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gbmV3IE1hdHJpeCgpO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIG5ldyBtYXRyaXggZnJvbSBhbiBhcnJheVxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguZnJvbUFycmF5ID0gZnVuY3Rpb24oYXJyKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gYXJyW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0cml4O1xufSx7fV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIDNEIHZlY3Rvci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IHggeCBjb29yZGluYXRlXG4gKiBAcGFyYW0ge251bWJlcn0geSB5IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB6IHogY29vcmRpbmF0ZVxuICovXG5mdW5jdGlvbiBWZWN0b3IoeCwgeSwgeil7XG4gICAgaWYgKHR5cGVvZiB4ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHogPT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnN1ZmZpY2llbnQgYXJndW1lbnRzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMueiA9IHo7XG4gICAgfVxufVxuLyoqXG4gKiBBZGQgdmVjdG9yIHRvIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB2ZWN0b3IueCwgdGhpcy55ICsgdmVjdG9yLnksIHRoaXMueiArIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIFN1YnRyYWN0IHZlY3RvciBmcm9tIHNlbGYuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHZlY3Rvci54LCB0aGlzLnkgLSB2ZWN0b3IueSwgdGhpcy56IC0gdmVjdG9yLnopO1xufTtcbi8qKlxuICogQ29tcGFyZSB2ZWN0b3Igd2l0aCBzZWxmIGZvciBlcXVhbGl0eVxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5lcXVhbCA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIHRoaXMueCA9PT0gdmVjdG9yLnggJiYgdGhpcy55ID09PSB2ZWN0b3IueSAmJiB0aGlzLnogPT09IHZlY3Rvci56O1xufTtcbi8qKlxuICogRmluZCBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmFuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gTWF0aC5hY29zKHRoZXRhKTtcbn07XG4vKipcbiAqIEZpbmQgdGhlIGNvcyBvZiB0aGUgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jb3NBbmdsZSA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIGEgPSB0aGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBiID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBhbWFnID0gYS5tYWduaXR1ZGUoKTtcbiAgICB2YXIgYm1hZyA9IGIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSBhLmRvdChiKSAvIChhbWFnICogYm1hZyApO1xuICAgIGlmICh0aGV0YSA8IC0xKSB7dGhldGEgPSAtMTt9XG4gICAgaWYgKHRoZXRhID4gMSkge3RoZXRhID0gMTt9XG4gICAgcmV0dXJuIHRoZXRhO1xufTtcbi8qKlxuICogRmluZCBtYWduaXR1ZGUgb2YgYSB2ZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubWFnbml0dWRlID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCh0aGlzLnggKiB0aGlzLngpICsgKHRoaXMueSAqIHRoaXMueSkgKyAodGhpcy56ICogdGhpcy56KSk7XG59O1xuLyoqXG4gKiBGaW5kIG1hZ25pdHVkZSBzcXVhcmVkIG9mIGEgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZVNxdWFyZWQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAodGhpcy54ICogdGhpcy54KSArICh0aGlzLnkgKiB0aGlzLnkpICsgKHRoaXMueiAqIHRoaXMueik7XG59O1xuLyoqXG4gKiBGaW5kIGRvdCBwcm9kdWN0IG9mIHNlbGYgYW5kIHZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiAodGhpcy54ICogdmVjdG9yLngpICsgKHRoaXMueSAqIHZlY3Rvci55KSArICh0aGlzLnogKiB2ZWN0b3Iueik7XG59O1xuLyoqXG4gKiBGaW5kIGNyb3NzIHByb2R1Y3Qgb2Ygc2VsZiBhbmQgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3RvcihcbiAgICAgICAgKHRoaXMueSAqIHZlY3Rvci56KSAtICh0aGlzLnogKiB2ZWN0b3IueSksXG4gICAgICAgICh0aGlzLnogKiB2ZWN0b3IueCkgLSAodGhpcy54ICogdmVjdG9yLnopLFxuICAgICAgICAodGhpcy54ICogdmVjdG9yLnkpIC0gKHRoaXMueSAqIHZlY3Rvci54KVxuICAgICk7XG59O1xuLyoqXG4gKiBOb3JtYWxpemUgc2VsZi5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqIEB0aHJvd3Mge1plcm9EaXZpc2lvbkVycm9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlKCk7XG4gICAgaWYgKG1hZ25pdHVkZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC8gbWFnbml0dWRlLCB0aGlzLnkgLyBtYWduaXR1ZGUsIHRoaXMueiAvIG1hZ25pdHVkZSk7XG59O1xuLyoqXG4gKiBTY2FsZSBzZWxmIGJ5IHNjYWxlLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICogc2NhbGUsIHRoaXMueSAqIHNjYWxlLCB0aGlzLnogKiBzY2FsZSk7XG59O1xuLyoqXG4gKiBOZWdhdGVzIHNlbGZcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gW2Rlc2NyaXB0aW9uXVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XG59O1xuLyoqXG4gKiBQcm9qZWN0IHNlbGYgb250byB2ZWN0b3JcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS52ZWN0b3JQcm9qZWN0aW9uID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgbWFnID0gdmVjdG9yLm1hZ25pdHVkZSgpO1xuICAgIHJldHVybiB2ZWN0b3Iuc2NhbGUodGhpcy5kb3QodmVjdG9yKSAvIChtYWcgKiBtYWcpKTtcbn07XG4vKipcbiAqIFByb2plY3Qgc2VsZiBvbnRvIHZlY3RvclxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnNjYWxhclByb2plY3Rpb24gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHJldHVybiB0aGlzLmRvdCh2ZWN0b3IpIC8gdmVjdG9yLm1hZ25pdHVkZSgpO1xufTtcbi8qKlxuICogUGVyZm9ybSBsaW5lYXIgdHJhbmZvcm1hdGlvbiBvbiBzZWxmLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IHRyYW5zZm9ybV9tYXRyaXhcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbih0cmFuc2Zvcm1fbWF0cml4KXtcbiAgICB2YXIgeCA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzBdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzRdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzhdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTJdO1xuICAgIHZhciB5ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMV0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNV0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbOV0pICsgdHJhbnNmb3JtX21hdHJpeFsxM107XG4gICAgdmFyIHogPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFsyXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs2XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMF0pICsgdHJhbnNmb3JtX21hdHJpeFsxNF07XG4gICAgdmFyIHcgPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFszXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs3XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFsxMV0pICsgdHJhbnNmb3JtX21hdHJpeFsxNV07XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCAvIHcsIHkgLyB3LCB6IC8gdyk7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKGF4aXMsIHRoZXRhKXtcbiAgICB2YXIgdSA9IGF4aXMubm9ybWFsaXplKCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdS54O1xuICAgIHZhciB1eSA9IHUueTtcbiAgICB2YXIgdXogPSB1Lno7XG4gICAgdmFyIHh5ID0gdS54ICogdS55O1xuICAgIHZhciB4eiA9IHUueCAqIHUuejtcbiAgICB2YXIgeXogPSB1LnkgKiB1Lno7XG4gICAgdmFyIHggPSAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueCkgKyAoKCh4eSpjb3MxKSAtICh1eipzaW4pKSAqIHRoaXMueSkgKyAoKCh4eipjb3MxKSsodXkqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB5ID0gKCgoeHkqY29zMSkrKHV6KnNpbikpICogdGhpcy54KSArICgoY29zKygodXkqdXkpKmNvczEpKSAqIHRoaXMueSkgKyAoKCh5eipjb3MxKS0odXgqc2luKSkgKiB0aGlzLnopO1xuICAgIHZhciB6ID0gKCgoeHoqY29zMSktKHV5KnNpbikpICogdGhpcy54KSArICgoKHl6KmNvczEpKyh1eCpzaW4pKSAqIHRoaXMueSkgKyAoKGNvcyArICgodXgqdXgpKmNvczEpKSAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSB0aGV0YSBhcm91bmQgeC1heGlzXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVYID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IChjb3MgKiB0aGlzLnkpIC0gKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoc2luICogdGhpcy55KSArIChjb3MgKiB0aGlzLnopO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHNlbGYgYnkgdGhldGEgYXJvdW5kIHktYXhpc1xuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICp0aGlzLngpICsgKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSAtKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSBzZWxmIGJ5IHRoZXRhIGFyb3VuZCB6LWF4aXNcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gKGNvcyAqIHRoaXMueCkgLSAoc2luICogdGhpcy55KTtcbiAgICB2YXIgeSA9IChzaW4gKiB0aGlzLngpICsgKGNvcyAqIHRoaXMueSk7XG4gICAgdmFyIHogPSB0aGlzLno7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgc2VsZiBieSBwaXRjaCwgeWF3LCByb2xsXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlUGl0Y2hZYXdSb2xsID0gZnVuY3Rpb24ocGl0Y2hfYW1udCwgeWF3X2FtbnQsIHJvbGxfYW1udCkge1xuICAgIHJldHVybiB0aGlzLnJvdGF0ZVgocm9sbF9hbW50KS5yb3RhdGVZKHBpdGNoX2FtbnQpLnJvdGF0ZVooeWF3X2FtbnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XG59LHt9XX0se30sWzFdKVxuKDEpXG59KTtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIG1hdGggPSByZXF1aXJlKCdsaW5lYXJhbGdlYScpO1xudmFyIFZlY3RvciA9IG1hdGguVmVjdG9yO1xudmFyIE1hdHJpeCA9IG1hdGguTWF0cml4O1xuXG4vKiogXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSBwb3NpdGlvbiBDYW1lcmEgcG9zaXRpb24uXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZ2V0ICAgQ2FtZXJhXG4gKi9cbmZ1bmN0aW9uIENhbWVyYSh3aWR0aCwgaGVpZ2h0LCBwb3NpdGlvbil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IG5ldyBWZWN0b3IoMSwxLDIwKTtcbiAgICB0aGlzLnVwID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcbiAgICB0aGlzLnJvdGF0aW9uID0geyd5YXcnOiAwLCAncGl0Y2gnOiAwLCAncm9sbCc6IDB9O1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5uZWFyID0gMC4xO1xuICAgIHRoaXMuZmFyID0gMTAwMDtcbiAgICB0aGlzLmZvdiA9IDkwO1xuICAgIHRoaXMucGVyc3BlY3RpdmVGb3YgPSB0aGlzLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92KCk7XG59XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi5waXRjaCk7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHRoaXMucm90YXRpb24ucGl0Y2gpO1xuICAgIHZhciBzaW5feWF3ID0gTWF0aC5zaW4odGhpcy5yb3RhdGlvbi55YXcpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3ModGhpcy5yb3RhdGlvbi55YXcpO1xuXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoLWNvc19waXRjaCAqIHNpbl95YXcsIHNpbl9waXRjaCwgLWNvc19waXRjaCAqIGNvc195YXcpO1xufTtcbi8qKlxuICogQnVpbGRzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggYmFzZWQgb24gYSBmaWVsZCBvZiB2aWV3LlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5DYW1lcmEucHJvdG90eXBlLmNhbGN1bGF0ZVBlcnNwZWN0aXZlRm92ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvdiA9IHRoaXMuZm92ICogKE1hdGguUEkgLyAxODApOyAvLyBjb252ZXJ0IHRvIHJhZGlhbnNcbiAgICB2YXIgYXNwZWN0ID0gdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0O1xuICAgIHZhciBuZWFyID0gdGhpcy5uZWFyO1xuICAgIHZhciBmYXIgPSB0aGlzLmZhcjtcbiAgICB2YXIgbWF0cml4ID0gTWF0cml4Lnplcm8oKTtcbiAgICB2YXIgaGVpZ2h0ID0gKDEvTWF0aC50YW4oZm92LzIpKSAqIHRoaXMuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IGhlaWdodCAqIGFzcGVjdDtcblxuICAgIG1hdHJpeFswXSA9IHdpZHRoO1xuICAgIG1hdHJpeFs1XSA9IGhlaWdodDtcbiAgICBtYXRyaXhbMTBdID0gZmFyLyhuZWFyLWZhcikgO1xuICAgIG1hdHJpeFsxMV0gPSAtMTtcbiAgICBtYXRyaXhbMTRdID0gbmVhcipmYXIvKG5lYXItZmFyKTtcblxuICAgIHJldHVybiBtYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUuY3JlYXRlVmlld01hdHJpeCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGV5ZSA9IHRoaXMucG9zaXRpb247XG4gICAgdmFyIHBpdGNoID0gdGhpcy5yb3RhdGlvbi5waXRjaDtcbiAgICB2YXIgeWF3ID0gdGhpcy5yb3RhdGlvbi55YXc7XG4gICAgdmFyIGNvc19waXRjaCA9IE1hdGguY29zKHBpdGNoKTtcbiAgICB2YXIgc2luX3BpdGNoID0gTWF0aC5zaW4ocGl0Y2gpO1xuICAgIHZhciBjb3NfeWF3ID0gTWF0aC5jb3MoeWF3KTtcbiAgICB2YXIgc2luX3lhdyA9IE1hdGguc2luKHlhdyk7XG5cbiAgICB2YXIgeGF4aXMgPSBuZXcgVmVjdG9yKGNvc195YXcsIDAsIC1zaW5feWF3ICk7XG4gICAgdmFyIHlheGlzID0gbmV3IFZlY3RvcihzaW5feWF3ICogc2luX3BpdGNoLCBjb3NfcGl0Y2gsIGNvc195YXcgKiBzaW5fcGl0Y2ggKTtcbiAgICB2YXIgemF4aXMgPSBuZXcgVmVjdG9yKHNpbl95YXcgKiBjb3NfcGl0Y2gsIC1zaW5fcGl0Y2gsIGNvc19waXRjaCAqIGNvc195YXcgKTtcblxuICAgIHZhciB2aWV3X21hdHJpeCA9IE1hdHJpeC5mcm9tQXJyYXkoW1xuICAgICAgICB4YXhpcy54LCB5YXhpcy54LCB6YXhpcy54LCAwLFxuICAgICAgICB4YXhpcy55LCB5YXhpcy55LCB6YXhpcy55LCAwLFxuICAgICAgICB4YXhpcy56LCB5YXhpcy56LCB6YXhpcy56LCAwLFxuICAgICAgICAtKHhheGlzLmRvdChleWUpICksIC0oIHlheGlzLmRvdChleWUpICksIC0oIHpheGlzLmRvdChleWUpICksIDFcbiAgICBdKTtcbiAgICByZXR1cm4gdmlld19tYXRyaXg7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSwgeil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IoeCx5LHopO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlUmlnaHQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciByaWdodCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChyaWdodCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVMZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB2YXIgbGVmdCA9IHRoaXMudXAuY3Jvc3ModGhpcy5kaXJlY3Rpb24oKSkubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQobGVmdCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbkNhbWVyYS5wcm90b3R5cGUudHVyblJpZ2h0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3IDwgMCl7XG4gICAgICAgIHRoaXMucm90YXRpb24ueWF3ID0gdGhpcy5yb3RhdGlvbi55YXcgKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLnR1cm5MZWZ0ID0gZnVuY3Rpb24oYW1vdW50KXtcbiAgICB0aGlzLnJvdGF0aW9uLnlhdyArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ueWF3ID4gKE1hdGguUEkqMikpe1xuICAgICAgICB0aGlzLnJvdGF0aW9uLnlhdyA9IHRoaXMucm90YXRpb24ueWF3IC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG5DYW1lcmEucHJvdG90eXBlLmxvb2tVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCAtPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPiAoTWF0aC5QSSoyKSl7XG4gICAgICAgIHRoaXMucm90YXRpb24ucGl0Y2ggPSB0aGlzLnJvdGF0aW9uLnBpdGNoIC0gKE1hdGguUEkqMik7XG4gICAgfVxuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5sb29rRG93biA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdGhpcy5yb3RhdGlvbi5waXRjaCArPSBhbW91bnQ7XG4gICAgaWYgKHRoaXMucm90YXRpb24ucGl0Y2ggPCAwKXtcbiAgICAgICAgdGhpcy5yb3RhdGlvbi5waXRjaCA9IHRoaXMucm90YXRpb24ucGl0Y2ggKyAoTWF0aC5QSSoyKTtcbiAgICB9XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5DYW1lcmEucHJvdG90eXBlLm1vdmVVcCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIHVwID0gdGhpcy51cC5ub3JtYWxpemUoKS5zY2FsZShhbW91bnQpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLnN1YnRyYWN0KHVwKTtcbiAgICB0aGlzLnZpZXdfbWF0cml4ID0gdGhpcy5jcmVhdGVWaWV3TWF0cml4KCk7XG59O1xuLyoqIEBtZXRob2QgKi9cbkNhbWVyYS5wcm90b3R5cGUubW92ZURvd24gPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciB1cCA9IHRoaXMudXAubm9ybWFsaXplKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5hZGQodXApO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlRm9yd2FyZCA9IGZ1bmN0aW9uKGFtb3VudCl7XG4gICAgdmFyIGZvcndhcmQgPSB0aGlzLmRpcmVjdGlvbigpLnNjYWxlKGFtb3VudCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYWRkKGZvcndhcmQpO1xuICAgIHRoaXMudmlld19tYXRyaXggPSB0aGlzLmNyZWF0ZVZpZXdNYXRyaXgoKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuQ2FtZXJhLnByb3RvdHlwZS5tb3ZlQmFja3dhcmQgPSBmdW5jdGlvbihhbW91bnQpe1xuICAgIHZhciBiYWNrd2FyZCA9IHRoaXMuZGlyZWN0aW9uKCkuc2NhbGUoYW1vdW50KTtcbiAgICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5zdWJ0cmFjdChiYWNrd2FyZCk7XG4gICAgdGhpcy52aWV3X21hdHJpeCA9IHRoaXMuY3JlYXRlVmlld01hdHJpeCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIvKipcbiAqIEV2ZW50IGhhbmRsZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5mdW5jdGlvbiBFdmVudFRhcmdldCgpe1xuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xufVxuLyoqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXJcbiAqL1xuRXZlbnRUYXJnZXQucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpe1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy5fbGlzdGVuZXJzKSkge1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB9XG4gICAgdGhpcy5fbGlzdGVuZXJzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xufTtcbi8qKlxuICogQG1ldGhvZFxuICogQHBhcmFtICB7c3RyaW5nfSBldmVudFxuICovXG5FdmVudFRhcmdldC5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICB2YXIgZSA9IHtcImV2ZW50XCI6IGV2ZW50LCBcInRhcmdldFwiOiB0aGlzfTtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50XTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHRoaXMsIGUpO1xuICAgIH1cbn07XG4vKipcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICogQHBhcmFtICB7ZnVuY3Rpb259IGxpc3RlbmVyXG4gKi9cbkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKXtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW3R5cGVdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKGxpc3RlbmVyc1tpXSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50VGFyZ2V0O1xuIiwidmFyIG1hdGggPSByZXF1aXJlKCdsaW5lYXJhbGdlYScpO1xudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhLmpzJyk7XG52YXIgRXZlbnRUYXJnZXQgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEtFWUNPREVTID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2tleWNvZGVzLmpzJyk7XG5cbnZhciBWZWN0b3IgPSBtYXRoLlZlY3RvcjtcbnZhciBNYXRyaXggPSBtYXRoLk1hdHJpeDtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7e2NhbnZhc19pZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn19IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gU2NlbmUob3B0aW9ucyl7XG4gICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGg7XG4gICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXG4gICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodDtcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9wdGlvbnMuY2FudmFzX2lkKTtcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5fYmFja19idWZmZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlci53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgdGhpcy5fYmFja19idWZmZXIuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgdGhpcy5fYmFja19idWZmZXJfY3R4ID0gdGhpcy5fYmFja19idWZmZXIuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZSA9IG51bGw7XG4gICAgdGhpcy5fZGVwdGhfYnVmZmVyID0gW107XG4gICAgdGhpcy5fYmFja2ZhY2VfY3VsbGluZyA9IHRydWU7XG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmlsbHVtaW5hdGlvbiA9IG5ldyBWZWN0b3IoOTAsMCwwKTtcbiAgICAvKiogQHR5cGUge0FycmF5LjxNZXNoPn0gKi9cbiAgICB0aGlzLm1lc2hlcyA9IHt9O1xuICAgIC8qKiBAdHlwZSB7T2JqZWN0LjxudW1iZXIsIGJvb2xlYW4+fSAqL1xuICAgIHRoaXMuX2tleXMgPSB7fTsgLy8gS2V5cyBjdXJyZW50bHkgcHJlc3NlZFxuICAgIHRoaXMuX2tleV9jb3VudCA9IDA7IC8vIE51bWJlciBvZiBrZXlzIGJlaW5nIHByZXNzZWQuLi4gdGhpcyBmZWVscyBrbHVkZ3lcbiAgICAvKiogQHR5cGUgez9udW1iZXJ9ICovXG4gICAgdGhpcy5fYW5pbV9pZCA9IG51bGw7XG4gICAgLyoqIEB0eXBlIHtib29sZWFufSAqL1xuICAgIHRoaXMuX25lZWRzX3VwZGF0ZSA9IHRydWU7XG4gICAgdGhpcy5fZHJhd19tb2RlID0gMDtcbiAgICB0aGlzLmluaXQoKTtcbn1cblNjZW5lLnByb3RvdHlwZSA9IG5ldyBFdmVudFRhcmdldCgpO1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmNhbnZhcy50YWJJbmRleCA9IDE7IC8vIFNldCB0YWIgaW5kZXggdG8gYWxsb3cgY2FudmFzIHRvIGhhdmUgZm9jdXMgdG8gcmVjZWl2ZSBrZXkgZXZlbnRzXG4gICAgdGhpcy5feF9vZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyAyKTtcbiAgICB0aGlzLl95X29mZnNldCA9IE1hdGgucm91bmQodGhpcy5oZWlnaHQgLyAyKTtcbiAgICB0aGlzLmluaXRpYWxpemVEZXB0aEJ1ZmZlcigpO1xuICAgIHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlID0gdGhpcy5fYmFja19idWZmZXJfY3R4LmNyZWF0ZUltYWdlRGF0YSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMub25LZXlVcC5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuZW1wdHlLZXlzLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICBFdmVudFRhcmdldC5jYWxsKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlKCk7XG59O1xuLyoqXG4gKiBEdW1wIGFsbCBwcmVzc2VkIGtleXMgb24gYmx1ci5cbiAqIEBtZXRob2RcbiAqL1xuU2NlbmUucHJvdG90eXBlLmVtcHR5S2V5cyA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5fa2V5X2NvdW50ID0gMDtcbiAgICB0aGlzLl9rZXlzID0ge307XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pc0tleURvd24gPSBmdW5jdGlvbihrZXkpe1xuICAgIHZhciBwcmVzc2VkID0gS0VZQ09ERVNba2V5XTtcbiAgICByZXR1cm4gKHByZXNzZWQgaW4gdGhpcy5fa2V5cyAmJiB0aGlzLl9rZXlzW3ByZXNzZWRdKTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLm9uS2V5RG93biA9IGZ1bmN0aW9uKGUpe1xuICAgIHZhciBwcmVzc2VkID0gZS5rZXlDb2RlIHx8IGUud2hpY2g7XG4gICAgaWYgKCF0aGlzLmlzS2V5RG93bihwcmVzc2VkKSl7XG4gICAgICAgIHRoaXMuX2tleV9jb3VudCArPSAxO1xuICAgICAgICB0aGlzLl9rZXlzW3ByZXNzZWRdID0gdHJ1ZTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5vbktleVVwID0gZnVuY3Rpb24oZSl7XG4gICAgdmFyIHByZXNzZWQgPSBlLmtleUNvZGUgfHwgZS53aGljaDtcbiAgICBpZiAocHJlc3NlZCBpbiB0aGlzLl9rZXlzKXtcbiAgICAgICAgdGhpcy5fa2V5X2NvdW50IC09IDE7XG4gICAgICAgIHRoaXMuX2tleXNbcHJlc3NlZF0gPSBmYWxzZTtcbiAgICB9XG59O1xuLyoqIEBtZXRob2QgKi9cblNjZW5lLnByb3RvdHlwZS5pbml0aWFsaXplRGVwdGhCdWZmZXIgPSBmdW5jdGlvbigpe1xuICAgIGZvciAodmFyIHggPSAwLCBsZW4gPSB0aGlzLndpZHRoICogdGhpcy5oZWlnaHQ7IHggPCBsZW47IHgrKyl7XG4gICAgICAgIHRoaXMuX2RlcHRoX2J1ZmZlclt4XSA9IDk5OTk5OTk7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUub2Zmc2NyZWVuID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICAvLyBUT0RPOiBOb3QgdG90YWxseSBjZXJ0YWluIHRoYXQgej4xIGluZGljYXRlcyB2ZWN0b3IgaXMgYmVoaW5kIGNhbWVyYS5cbiAgICB2YXIgeCA9IHZlY3Rvci54ICsgdGhpcy5feF9vZmZzZXQ7XG4gICAgdmFyIHkgPSB2ZWN0b3IueSArIHRoaXMuX3lfb2Zmc2V0O1xuICAgIHZhciB6ID0gdmVjdG9yLno7XG4gICAgcmV0dXJuICh6ID4gMSB8fCB4IDwgMCB8fCB4ID4gdGhpcy53aWR0aCB8fCB5IDwgMCB8fCB5ID4gdGhpcy5oZWlnaHQpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUudG9nZ2xlRHJhd01vZGUgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuX2RyYXdfbW9kZSA9ICh0aGlzLl9kcmF3X21vZGUgKyAxKSAlIDI7XG4gICAgdGhpcy5yZW5kZXJTY2VuZSgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUudG9nZ2xlQmFja2ZhY2VDdWxsaW5nID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLl9iYWNrZmFjZV9jdWxsaW5nID0gIXRoaXMuX2JhY2tmYWNlX2N1bGxpbmc7XG4gICAgdGhpcy5yZW5kZXJTY2VuZSgpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd1BpeGVsID0gZnVuY3Rpb24oeCwgeSwgeiwgY29sb3Ipe1xuICAgIHggPSB4ICsgdGhpcy5feF9vZmZzZXQ7XG4gICAgeSA9IHkgKyB0aGlzLl95X29mZnNldDtcbiAgICBpZiAoeCA+PSAwICYmIHggPCB0aGlzLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy5oZWlnaHQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0geCArICh5ICogdGhpcy53aWR0aCk7XG4gICAgICAgIGlmICh6IDwgdGhpcy5fZGVwdGhfYnVmZmVyW2luZGV4XSkge1xuICAgICAgICAgICAgdmFyIGltYWdlX2RhdGEgPSB0aGlzLl9iYWNrX2J1ZmZlcl9pbWFnZS5kYXRhO1xuICAgICAgICAgICAgdmFyIGkgPSBpbmRleCAqIDQ7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2ldID0gY29sb3IucjtcbiAgICAgICAgICAgIGltYWdlX2RhdGFbaSsxXSA9IGNvbG9yLmc7XG4gICAgICAgICAgICBpbWFnZV9kYXRhW2krMl0gPSBjb2xvci5iO1xuICAgICAgICAgICAgaW1hZ2VfZGF0YVtpKzNdID0gMjU1O1xuICAgICAgICAgICAgdGhpcy5fZGVwdGhfYnVmZmVyW2luZGV4XSA9IHo7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLyoqIEBtZXRob2QgICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd0VkZ2UgPSBmdW5jdGlvbih2ZWN0b3IxLCB2ZWN0b3IyLCBjb2xvcil7XG4gICAgdmFyIGFicyA9IE1hdGguYWJzO1xuICAgIGlmICh2ZWN0b3IxLnggPj0gdmVjdG9yMi54KXtcbiAgICAgICAgdmFyIHRlbXAgPSB2ZWN0b3IxO1xuICAgICAgICB2ZWN0b3IxID0gdmVjdG9yMjtcbiAgICAgICAgdmVjdG9yMiA9IHRlbXA7XG4gICAgfVxuICAgIHZhciBjdXJyZW50X3ggPSB2ZWN0b3IxLng7XG4gICAgdmFyIGN1cnJlbnRfeSA9IHZlY3RvcjEueTtcbiAgICB2YXIgY3VycmVudF96ID0gdmVjdG9yMS56O1xuICAgIHZhciBsb25nZXN0X2Rpc3QgPSBNYXRoLm1heChhYnModmVjdG9yMi54IC0gdmVjdG9yMS54KSwgYWJzKHZlY3RvcjIueSAtIHZlY3RvcjEueSksIGFicyh2ZWN0b3IyLnogLSB2ZWN0b3IxLnopKTtcbiAgICB2YXIgc3RlcF94ID0gKHZlY3RvcjIueCAtIHZlY3RvcjEueCkgLyBsb25nZXN0X2Rpc3Q7XG4gICAgdmFyIHN0ZXBfeSA9ICh2ZWN0b3IyLnkgLSB2ZWN0b3IxLnkpIC8gbG9uZ2VzdF9kaXN0O1xuICAgIHZhciBzdGVwX3ogPSAodmVjdG9yMi56IC0gdmVjdG9yMS56KSAvIGxvbmdlc3RfZGlzdDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9uZ2VzdF9kaXN0OyBpKyspe1xuICAgICAgICB0aGlzLmRyYXdQaXhlbChNYXRoLmZsb29yKGN1cnJlbnRfeCksIE1hdGguZmxvb3IoY3VycmVudF95KSwgY3VycmVudF96LCBjb2xvcik7XG4gICAgICAgIGN1cnJlbnRfeCArPSBzdGVwX3g7XG4gICAgICAgIGN1cnJlbnRfeSArPSBzdGVwX3k7XG4gICAgICAgIGN1cnJlbnRfeiArPSBzdGVwX3o7XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZHJhd1RyaWFuZ2xlID0gZnVuY3Rpb24odmVjdG9yMSwgdmVjdG9yMiwgdmVjdG9yMywgY29sb3Ipe1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMSwgdmVjdG9yMiwgY29sb3IpO1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMiwgdmVjdG9yMywgY29sb3IpO1xuICAgIHRoaXMuZHJhd0VkZ2UodmVjdG9yMywgdmVjdG9yMSwgY29sb3IpO1xufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUuZmlsbFRyaWFuZ2xlID0gZnVuY3Rpb24odjEsIHYyLCB2MywgY29sb3Ipe1xuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIGNodWdzIHdoZW4gY2xvc2UgdG8gYSBmYWNlLiBTZWUgaWYgdGhpcyBjYW4gYmUgZml4ZWQuXG4gICAgLy8gSXMgdGhpcyBqdXN0IGJlY2F1c2UgaXQncyBsb29waW5nIG92ZXIgc28gbWFueSBleHRyYW5lb3VzIHBvaW50cz9cbiAgICAvLyBEZWNvbXBvc2luZyBpbnRvIHNtYWxsZXIgdHJpYW5nbGVzIG1heSBhbGxldmlhdGUgdGhpcyBzb21ld2hhdC5cbiAgICB2YXIgeDAgPSB2MS54O1xuICAgIHZhciB4MSA9IHYyLng7XG4gICAgdmFyIHgyID0gdjMueDtcbiAgICB2YXIgeTAgPSB2MS55O1xuICAgIHZhciB5MSA9IHYyLnk7XG4gICAgdmFyIHkyID0gdjMueTtcbiAgICB2YXIgejAgPSB2MS56O1xuICAgIHZhciB6MSA9IHYyLno7XG4gICAgdmFyIHoyID0gdjMuejtcblxuICAgIC8vIENvbXB1dGUgb2Zmc2V0cy4gVXNlZCB0byBhdm9pZCBjb21wdXRpbmcgYmFyeWNlbnRyaWMgY29vcmRzIGZvciBvZmZzY3JlZW4gcGl4ZWxzXG4gICAgdmFyIHhsZWZ0ID0gMCAtIHRoaXMuX3hfb2Zmc2V0O1xuICAgIHZhciB4cmlnaHQgPSB0aGlzLndpZHRoIC0gdGhpcy5feF9vZmZzZXQ7XG4gICAgdmFyIHl0b3AgPSAwIC0gdGhpcy5feV9vZmZzZXQ7XG4gICAgdmFyIHlib3QgPSB0aGlzLmhlaWdodCAtIHRoaXMuX3lfb2Zmc2V0O1xuXG4gICAgLy8gQ29tcHV0ZSBib3VuZGluZyBib3hcbiAgICB2YXIgeG1pbiA9IE1hdGguZmxvb3IoTWF0aC5taW4oeDAsIHgxLCB4MikpO1xuICAgIGlmICh4bWluIDwgeGxlZnQpe3htaW49eGxlZnQ7fVxuICAgIHZhciB4bWF4ID0gTWF0aC5jZWlsKE1hdGgubWF4KHgwLCB4MSwgeDIpKTtcbiAgICBpZiAoeG1heCA+IHhyaWdodCl7eG1heD14cmlnaHQ7fVxuICAgIHZhciB5bWluID0gTWF0aC5mbG9vcihNYXRoLm1pbih5MCwgeTEsIHkyKSk7XG4gICAgaWYgKHltaW4gPCB5dG9wKXt5bWluPXl0b3A7fVxuICAgIHZhciB5bWF4ID0gTWF0aC5jZWlsKE1hdGgubWF4KHkwLCB5MSwgeTIpKTtcbiAgICBpZiAoeW1heCA+IHlib3Qpe3ltYXg9eWJvdDt9XG5cbiAgICAvLyBQcmVjb21wdXRlIGFzIG11Y2ggYXMgcG9zc2libGVcbiAgICB2YXIgeTJ5MCA9IHkyLXkwO1xuICAgIHZhciB4MHgyID0geDAteDI7XG4gICAgdmFyIHkweTEgPSB5MC15MTtcbiAgICB2YXIgeDF4MCA9IHgxLXgwO1xuICAgIHZhciB4MnkweDB5MiA9IHgyKnkwIC0geDAqeTI7XG4gICAgdmFyIHgweTF4MXkwID0geDAqeTEgLSB4MSp5MDtcbiAgICB2YXIgZjIweDF5MSA9ICgoeTJ5MCp4MSkgKyAoeDB4Mip5MSkgKyB4MnkweDB5Mik7XG4gICAgdmFyIGYwMXgyeTIgPSAoKHkweTEqeDIpICsgKHgxeDAqeTIpICsgeDB5MXgxeTApO1xuXG4gICAgdmFyIHkyeTBvdmVyZjIweDF5MSA9IHkyeTAvZjIweDF5MTtcbiAgICB2YXIgeDB4Mm92ZXJmMjB4MXkxID0geDB4Mi9mMjB4MXkxO1xuICAgIHZhciB4MnkweDB5MjFvdmVyZjIweDF5MSA9IHgyeTB4MHkyL2YyMHgxeTE7XG5cbiAgICB2YXIgeTB5MW92ZXJmMDF4MnkyID0geTB5MS9mMDF4MnkyO1xuICAgIHZhciB4MHgyb3ZlcmYwMXgyeTIgPSB4MXgwL2YwMXgyeTI7XG4gICAgdmFyIHgyeTB4MHkyb3ZlcmYwMXgyeTIgPSB4MHkxeDF5MC9mMDF4MnkyO1xuXG4gICAgLy8gTG9vcCBvdmVyIGJvdW5kaW5nIGJveFxuICAgIGZvciAodmFyIHggPSB4bWluOyB4IDw9IHhtYXg7IHgrKyl7XG4gICAgICAgIGZvciAodmFyIHkgPSB5bWluOyB5IDw9IHltYXg7IHkrKyl7XG4gICAgICAgICAgICAvLyBDb21wdXRlIGJhcnljZW50cmljIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAvLyBJZiBhbnkgb2YgdGhlIGNvb3JkaW5hdGVzIGFyZSBub3QgaW4gdGhlIHJhbmdlIFswLDFdLCB0aGVuIHRoZVxuICAgICAgICAgICAgLy8gcG9pbnQgaXMgbm90IGluc2lkZSB0aGUgdHJpYW5nbGUuIFJhdGhlciB0aGFuIGNvbXB1dGUgYWxsIHRoZVxuICAgICAgICAgICAgLy8gY29vcmRpbmF0ZXMgc3RyYWlnaHQgYXdheSwgd2UnbGwgc2hvcnQtY2lyY3VpdCBhcyBzb29uIGFzIGEgY29vcmRpbmF0ZSBvdXRzaWRlXG4gICAgICAgICAgICAvLyBvZiB0aGF0IHJhbmdlIGlzIGVuY291bnRlcmVkLlxuICAgICAgICAgICAgdmFyIGJldGEgPSB5Mnkwb3ZlcmYyMHgxeTEqeCArIHgweDJvdmVyZjIweDF5MSp5ICsgeDJ5MHgweTIxb3ZlcmYyMHgxeTE7XG4gICAgICAgICAgICBpZiAoYmV0YSA+PSAwICYmIGJldGEgPD0gMSl7XG4gICAgICAgICAgICAgICAgdmFyIGdhbW1hID0geTB5MW92ZXJmMDF4MnkyKnggKyB4MHgyb3ZlcmYwMXgyeTIqeSAreDJ5MHgweTJvdmVyZjAxeDJ5MjtcbiAgICAgICAgICAgICAgICBpZiAoZ2FtbWEgPj0gMCAmJiBnYW1tYSA8PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFscGhhID0gMSAtIGJldGEgLSBnYW1tYTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFscGhhID49IDAgJiYgYWxwaGEgPD0gMSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhbGwgYmFyeWNlbnRyaWMgY29vcmRzIHdpdGhpbiByYW5nZSBbMCwxXSwgaW5zaWRlIHRyaWFuZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeiA9IGFscGhhKnowICsgYmV0YSp6MSArIGdhbW1hKnoyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3UGl4ZWwoeCwgeSwgeiwgY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcbi8qKiBAbWV0aG9kICovXG5TY2VuZS5wcm90b3R5cGUucmVuZGVyU2NlbmUgPSBmdW5jdGlvbigpe1xuICAgIC8vIFRPRE86IFNpbXBsaWZ5IHRoaXMgZnVuY3Rpb24uXG4gICAgdGhpcy5fYmFja19idWZmZXJfaW1hZ2UgPSB0aGlzLl9iYWNrX2J1ZmZlcl9jdHguY3JlYXRlSW1hZ2VEYXRhKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmluaXRpYWxpemVEZXB0aEJ1ZmZlcigpO1xuICAgIHZhciBjYW1lcmFfbWF0cml4ID0gdGhpcy5jYW1lcmEudmlld19tYXRyaXg7XG4gICAgdmFyIHByb2plY3Rpb25fbWF0cml4ID0gdGhpcy5jYW1lcmEucGVyc3BlY3RpdmVGb3Y7XG4gICAgdmFyIGxpZ2h0ID0gdGhpcy5pbGx1bWluYXRpb247XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubWVzaGVzKXtcbiAgICAgICAgaWYgKHRoaXMubWVzaGVzLmhhc093blByb3BlcnR5KGtleSkpe1xuICAgICAgICAgICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hlc1trZXldO1xuICAgICAgICAgICAgdmFyIHNjYWxlID0gbWVzaC5zY2FsZTtcbiAgICAgICAgICAgIHZhciByb3RhdGlvbiA9IG1lc2gucm90YXRpb247XG4gICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBtZXNoLnBvc2l0aW9uO1xuICAgICAgICAgICAgdmFyIHdvcmxkX21hdHJpeCA9IE1hdHJpeC5zY2FsZShzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KS5tdWx0aXBseShcbiAgICAgICAgICAgICAgICBNYXRyaXgucm90YXRpb24ocm90YXRpb24ucGl0Y2gsIHJvdGF0aW9uLnlhdywgcm90YXRpb24ucm9sbCkubXVsdGlwbHkoXG4gICAgICAgICAgICAgICAgICAgIE1hdHJpeC50cmFuc2xhdGlvbihwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KSkpO1xuICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBtZXNoLmZhY2VzLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICB2YXIgZmFjZSA9IG1lc2guZmFjZXNba10uZmFjZTtcbiAgICAgICAgICAgICAgICB2YXIgY29sb3IgPSBtZXNoLmZhY2VzW2tdLmNvbG9yO1xuICAgICAgICAgICAgICAgIHZhciB2MSA9IG1lc2gudmVydGljZXNbZmFjZVswXV07XG4gICAgICAgICAgICAgICAgdmFyIHYyID0gbWVzaC52ZXJ0aWNlc1tmYWNlWzFdXTtcbiAgICAgICAgICAgICAgICB2YXIgdjMgPSBtZXNoLnZlcnRpY2VzW2ZhY2VbMl1dO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBub3JtYWxcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBDYW4gdGhpcyBiZSBjYWxjdWxhdGVkIGp1c3Qgb25jZSwgYW5kIHRoZW4gdHJhbnNmb3JtZWQgaW50b1xuICAgICAgICAgICAgICAgIC8vIGNhbWVyYSBzcGFjZT9cbiAgICAgICAgICAgICAgICB2YXIgY2FtX3RvX3ZlcnQgPSB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpZGUxID0gdjIudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkuc3VidHJhY3QodjEudHJhbnNmb3JtKHdvcmxkX21hdHJpeCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlMiA9IHYzLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpLnN1YnRyYWN0KHYxLnRyYW5zZm9ybSh3b3JsZF9tYXRyaXgpKTtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybSA9IHNpZGUxLmNyb3NzKHNpZGUyKTtcbiAgICAgICAgICAgICAgICBpZiAobm9ybS5tYWduaXR1ZGUoKSA8PSAwLjAwMDAwMDAxKXtcbiAgICAgICAgICAgICAgICAgICAgbm9ybSA9IG5vcm07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9ybSA9IG5vcm0ubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEJhY2tmYWNlIGN1bGxpbmcuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9iYWNrZmFjZV9jdWxsaW5nIHx8IGNhbV90b192ZXJ0LmRvdChub3JtKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3dnBfbWF0cml4ID0gd29ybGRfbWF0cml4Lm11bHRpcGx5KGNhbWVyYV9tYXRyaXgpLm11bHRpcGx5KHByb2plY3Rpb25fbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MSA9IHYxLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MiA9IHYyLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd2MyA9IHYzLnRyYW5zZm9ybSh3dnBfbWF0cml4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRyYXcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIERyYXcgc3VyZmFjZSBub3JtYWxzXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciBmYWNlX3RyYW5zID0gTWF0cml4LnRyYW5zbGF0aW9uKHd2MS54LCB3djEueSwgdjEueik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0VkZ2Uod3YxLCBub3JtLnNjYWxlKDIwKS50cmFuc2Zvcm0oZmFjZV90cmFucyksIHsncic6MjU1LFwiZ1wiOjI1NSxcImJcIjoyNTV9KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEZpeCBmcnVzdHVtIGN1bGxpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyByZWFsbHkgc3R1cGlkIGZydXN0dW0gY3VsbGluZy4uLiB0aGlzIGNhbiByZXN1bHQgaW4gc29tZSBmYWNlcyBub3QgYmVpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gZHJhd24gd2hlbiB0aGV5IHNob3VsZCwgZS5nLiB3aGVuIGEgdHJpYW5nbGVzIHZlcnRpY2VzIHN0cmFkZGxlIHRoZSBmcnVzdHJ1bS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub2Zmc2NyZWVuKHd2MSkgJiYgdGhpcy5vZmZzY3JlZW4od3YyKSAmJiB0aGlzLm9mZnNjcmVlbih3djMpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZHJhdyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZHJhd19tb2RlID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdUcmlhbmdsZSh3djEsIHd2Miwgd3YzLCBjb2xvci5yZ2IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9kcmF3X21vZGUgPT09IDEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaWdodF9kaXJlY3Rpb24gPSBsaWdodC5zdWJ0cmFjdCh2MS50cmFuc2Zvcm0od29ybGRfbWF0cml4KSkubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlsbHVtaW5hdGlvbl9hbmdsZSA9IG5vcm0uZG90KGxpZ2h0X2RpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSBjb2xvci5saWdodGVuKGlsbHVtaW5hdGlvbl9hbmdsZSoxNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsVHJpYW5nbGUod3YxLCB3djIsIHd2MywgY29sb3IucmdiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9iYWNrX2J1ZmZlcl9jdHgucHV0SW1hZ2VEYXRhKHRoaXMuX2JhY2tfYnVmZmVyX2ltYWdlLCAwLCAwKTtcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgdGhpcy5jdHguZHJhd0ltYWdlKHRoaXMuX2JhY2tfYnVmZmVyLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLmFkZE1lc2ggPSBmdW5jdGlvbihtZXNoKXtcbiAgICB0aGlzLm1lc2hlc1ttZXNoLm5hbWVdID0gbWVzaDtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnJlbW92ZU1lc2ggPSBmdW5jdGlvbihtZXNoKXtcbiAgICBkZWxldGUgdGhpcy5tZXNoZXNbbWVzaC5uYW1lXTtcbn07XG4vKiogQG1ldGhvZCAqL1xuU2NlbmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKHRoaXMuX2tleV9jb3VudCA+IDApe1xuICAgICAgICB0aGlzLmZpcmUoJ2tleWRvd24nKTtcbiAgICB9XG4gICAgLy8gVE9ETzogQWRkIGtleXVwLCBtb3VzZWRvd24sIG1vdXNlZHJhZywgbW91c2V1cCwgZXRjLlxuICAgIGlmICh0aGlzLl9uZWVkc191cGRhdGUpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJTY2VuZSgpO1xuICAgICAgICB0aGlzLl9uZWVkc191cGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fYW5pbV9pZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy51cGRhdGUuYmluZCh0aGlzKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjZW5lO1xuIiwidmFyIENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL2NvbG9yLmpzJyk7XG5cbi8qKlxuICogQSAzRCB0cmlhbmdsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gYVxuICogQHBhcmFtIHtudW1iZXJ9IGJcbiAqIEBwYXJhbSB7bnVtYmVyfSBjXG4gKiBAcGFyYW0ge3N0cmluZ30gY29sb3JcbiAqL1xuZnVuY3Rpb24gRmFjZShhLCBiLCBjLCBjb2xvcil7XG4gICAgdGhpcy5mYWNlID0gW2EsIGIsIGNdO1xuICAgIHRoaXMuY29sb3IgPSBuZXcgQ29sb3IoY29sb3IpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2U7IiwidmFyIFZlY3RvciA9IHJlcXVpcmUoJ2xpbmVhcmFsZ2VhJykuVmVjdG9yO1xudmFyIEZhY2UgPSByZXF1aXJlKCcuL2ZhY2UuanMnKTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge0FycmF5LjxWZWN0b3I+fSB2ZXJ0aWNlc1xuICogQHBhcmFtIHtBcnJheS48RmFjZT59IGVkZ2VzXG4gKi9cbmZ1bmN0aW9uIE1lc2gobmFtZSwgdmVydGljZXMsIGZhY2VzKXtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudmVydGljZXMgPSB2ZXJ0aWNlcztcbiAgICB0aGlzLmZhY2VzID0gZmFjZXM7XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IoMCwgMCwgMCk7XG4gICAgdGhpcy5yb3RhdGlvbiA9IHsneWF3JzogMCwgJ3BpdGNoJzogMCwgJ3JvbGwnOiAwfTtcbiAgICB0aGlzLnNjYWxlID0geyd4JzogMSwgJ3knOiAxLCAneic6IDF9O1xufVxuXG4vKipcbiAqIENvbnN0cnVjdCBhIE1lc2ggZnJvbSBhIEpTT04gb2JqZWN0LlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtICB7e25hbWU6IHN0cmluZywgdmVydGljaWVzOiBBcnJheS48QXJyYXkuPG51bWJlcj4+LCBmYWNlczoge3tmYWNlOiBBcnJheS48bnVtYmVyPiwgY29sb3I6IHN0cmluZ319fX0ganNvblxuICogQHJldHVybiB7TWVzaH1cbiAqL1xuTWVzaC5mcm9tSlNPTiA9IGZ1bmN0aW9uKGpzb24pe1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuICAgIHZhciBmYWNlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBqc29uLnZlcnRpY2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgdmFyIHZlcnRleCA9IGpzb24udmVydGljZXNbaV07XG4gICAgICAgIHZlcnRpY2VzLnB1c2gobmV3IFZlY3Rvcih2ZXJ0ZXhbMF0sIHZlcnRleFsxXSwgdmVydGV4WzJdKSk7XG4gICAgfVxuICAgIGZvciAodmFyIGogPSAwLCBsbiA9IGpzb24uZmFjZXMubGVuZ3RoOyBqIDwgbG47IGorKyl7XG4gICAgICAgIHZhciBmYWNlID0ganNvbi5mYWNlc1tqXTtcbiAgICAgICAgZmFjZXMucHVzaChuZXcgRmFjZShmYWNlLmZhY2VbMF0sIGZhY2UuZmFjZVsxXSwgZmFjZS5mYWNlWzJdLCBmYWNlLmNvbG9yKSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgTWVzaChqc29uLm5hbWUsIHZlcnRpY2VzLCBmYWNlcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lc2g7XG4iLCJ2YXIgcmdiVG9Ic2wsIHBhcnNlQ29sb3IsIGNhY2hlLCBkaXY7XG4vKipcbiAqIEEgY29sb3Igd2l0aCBib3RoIHJnYiBhbmQgaHNsIHJlcHJlc2VudGF0aW9ucy5cbiAqIEBjbGFzcyBDb2xvclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIEFueSBsZWdhbCBDU1MgY29sb3IgdmFsdWUgKGhleCwgY29sb3Iga2V5d29yZCwgcmdiW2FdLCBoc2xbYV0pLlxuICovXG5mdW5jdGlvbiBDb2xvcihjb2xvcil7XG4gICAgdmFyIHBhcnNlZF9jb2xvciA9IHt9O1xuICAgIGNvbG9yID0gY29sb3IudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoY29sb3IgaW4gY2FjaGUpe1xuICAgICAgICBwYXJzZWRfY29sb3IgPSBjYWNoZVtjb2xvcl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFyc2VkX2NvbG9yID0gcGFyc2VDb2xvcihjb2xvcik7XG4gICAgICAgIGNhY2hlW2NvbG9yXSA9IHBhcnNlZF9jb2xvcjtcbiAgICB9XG4gICAgdmFyIGhzbCA9IHJnYlRvSHNsKHBhcnNlZF9jb2xvci5yLCBwYXJzZWRfY29sb3IuZywgcGFyc2VkX2NvbG9yLmIpO1xuICAgIHRoaXMucmdiID0geydyJzogcGFyc2VkX2NvbG9yLnIsICdnJzogcGFyc2VkX2NvbG9yLmcsICdiJzogcGFyc2VkX2NvbG9yLmJ9O1xuICAgIHRoaXMuaHNsID0geydoJzogaHNsLmgsICdzJzogaHNsLnMsICdsJzogaHNsLmx9O1xuICAgIHRoaXMuYWxwaGEgPSBwYXJzZWRfY29sb3IuYSB8fCAxO1xufVxuLyoqXG4gKiBMaWdodGVuIGEgY29sb3IgYnkgdGhlIGdpdmVuIHBlcmNlbnRhZ2UuXG5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSAge251bWJlcn0gcGVyY2VudFxuICogQHJldHVybiB7Q29sb3J9XG4gKi9cbkNvbG9yLnByb3RvdHlwZS5saWdodGVuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCArIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA+IDEwMCl7XG4gICAgICAgIGx1bSA9IDEwMDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2xvcihcImhzbGEoXCIgKyBoc2wuaCArIFwiLFwiICsgaHNsLnMgKyBcIiUsXCIgKyBsdW0gKyBcIiUsXCIgKyB0aGlzLmFscGhhICsgXCIpXCIpO1xufTtcbi8qKlxuICogRGFya2VuIGEgY29sb3IgYnkgdGhlIGdpdmVuIHBlcmNlbnRhZ2UuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHBlcmNlbnRcbiAqIEByZXR1cm4ge0NvbG9yfVxuICovXG5Db2xvci5wcm90b3R5cGUuZGFya2VuID0gZnVuY3Rpb24ocGVyY2VudCl7XG4gICAgdmFyIGhzbCA9IHRoaXMuaHNsO1xuICAgIHZhciBsdW0gPSBoc2wubCAtIHBlcmNlbnQ7XG4gICAgaWYgKGx1bSA8IDApe1xuICAgICAgICBsdW0gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbG9yKFwiaHNsYShcIiArIGhzbC5oICsgXCIsXCIgKyBoc2wucyArIFwiJSxcIiArIGx1bSArIFwiJSxcIiArIHRoaXMuYWxwaGEgKyBcIilcIik7XG59O1xuLyoqXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHIgUmVkXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGcgR3JlZW5cbiAqIEBwYXJhbSAge251bWJlcn0gYiBCbHVlXG4gKiBAcmV0dXJuIHt7aDogbnVtYmVyLCBzOiBudW1iZXIsIGw6IG51bWJlcn19XG4gKi9cbnJnYlRvSHNsID0gZnVuY3Rpb24ociwgZywgYil7XG4gICAgciA9IHIgLyAyNTU7XG4gICAgZyA9IGcgLyAyNTU7XG4gICAgYiA9IGIgLyAyNTU7XG4gICAgdmFyIG1heGMgPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICB2YXIgbWluYyA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIHZhciBsID0gTWF0aC5yb3VuZCgoKG1pbmMrbWF4YykvMikqMTAwKTtcbiAgICBpZiAobCA+IDEwMCkge2wgPSAxMDA7fVxuICAgIGlmIChsIDwgMCkge2wgPSAwO31cbiAgICB2YXIgaCwgcztcbiAgICBpZiAobWluYyA9PT0gbWF4Yyl7XG4gICAgICAgIHJldHVybiB7J2gnOiAwLCAncyc6IDAsICdsJzogbH07XG4gICAgfVxuICAgIGlmIChsIDw9IDUwKXtcbiAgICAgICAgcyA9IChtYXhjLW1pbmMpIC8gKG1heGMrbWluYyk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIHMgPSAobWF4Yy1taW5jKSAvICgyLW1heGMtbWluYyk7XG4gICAgfVxuICAgIHZhciByYyA9IChtYXhjLXIpIC8gKG1heGMtbWluYyk7XG4gICAgdmFyIGdjID0gKG1heGMtZykgLyAobWF4Yy1taW5jKTtcbiAgICB2YXIgYmMgPSAobWF4Yy1iKSAvIChtYXhjLW1pbmMpO1xuICAgIGlmIChyID09PSBtYXhjKXtcbiAgICAgICAgaCA9IGJjLWdjO1xuICAgIH1cbiAgICBlbHNlIGlmIChnID09PSBtYXhjKXtcbiAgICAgICAgaCA9IDIrcmMtYmM7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIGggPSA0K2djLXJjO1xuICAgIH1cbiAgICBoID0gKGgvNikgJSAxO1xuICAgIGlmIChoIDwgMCl7aCs9MTt9XG4gICAgaCA9IE1hdGgucm91bmQoaCozNjApO1xuICAgIHMgPSBNYXRoLnJvdW5kKHMqMTAwKTtcbiAgICBpZiAoaCA+IDM2MCkge2ggPSAzNjA7fVxuICAgIGlmIChoIDwgMCkge2ggPSAwO31cbiAgICBpZiAocyA+IDEwMCkge3MgPSAxMDA7fVxuICAgIGlmIChzIDwgMCkge3MgPSAwO31cbiAgICByZXR1cm4geydoJzogaCwgJ3MnOiBzLCAnbCc6IGx9O1xufTtcbmRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuLyoqXG4gKiBQYXJzZSBhIENTUyBjb2xvciB2YWx1ZSBhbmQgcmV0dXJuIGFuIHJnYmEgY29sb3Igb2JqZWN0LlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2xvciBBIGxlZ2FsIENTUyBjb2xvciB2YWx1ZSAoaGV4LCBjb2xvciBrZXl3b3JkLCByZ2JbYV0sIGhzbFthXSkuXG4gKiBAcmV0dXJuIHt7cjogbnVtYmVyLCBnOiBudW1iZXIsIGI6IG51bWJlciwgYTogbnVtYmVyfX0gICByZ2JhIGNvbG9yIG9iamVjdC5cbiAqIEB0aHJvd3Mge0NvbG9yRXJyb3J9IElmIGlsbGVnYWwgY29sb3IgdmFsdWUgaXMgcGFzc2VkLlxuICovXG5wYXJzZUNvbG9yID0gZnVuY3Rpb24oY29sb3Ipe1xuICAgIC8vIFRPRE86IEhvdyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGUgaXMgdGhpcz8gSG93IGVmZmljaWVudD9cbiAgICAvLyBNYWtlIGEgdGVtcG9yYXJ5IEhUTUwgZWxlbWVudCBzdHlsZWQgd2l0aCB0aGUgZ2l2ZW4gY29sb3Igc3RyaW5nXG4gICAgLy8gdGhlbiBleHRyYWN0IGFuZCBwYXJzZSB0aGUgY29tcHV0ZWQgcmdiKGEpIHZhbHVlLlxuICAgIC8vIE4uQi4gVGhpcyBjYW4gY3JlYXRlIGEgbG9vb290IG9mIERPTSBub2Rlcy4gSXQncyBub3QgYSBncmVhdCBtZXRob2QuXG4gICAgLy8gVE9ETzogRml4XG4gICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yO1xuICAgIHZhciByZ2JhID0gZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvcjtcbiAgICAvLyBDb252ZXJ0IHN0cmluZyBpbiBmb3JtICdyZ2JbYV0obnVtLCBudW0sIG51bVssIG51bV0pJyB0byBhcnJheSBbJ251bScsICdudW0nLCAnbnVtJ1ssICdudW0nXV1cbiAgICByZ2JhID0gcmdiYS5zbGljZShyZ2JhLmluZGV4T2YoJygnKSsxKS5zbGljZSgwLC0xKS5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XG4gICAgdmFyIHJldHVybl9jb2xvciA9IHt9O1xuICAgIHZhciBjb2xvcl9zcGFjZXMgPSBbJ3InLCAnZycsICdiJywgJ2EnXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJnYmEubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0KHJnYmFbaV0pOyAvLyBBbHBoYSB2YWx1ZSB3aWxsIGJlIGZsb2F0aW5nIHBvaW50LlxuICAgICAgICBpZiAoaXNOYU4odmFsdWUpKXtcbiAgICAgICAgICAgIHRocm93IFwiQ29sb3JFcnJvcjogU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBlcmhhcHMgXCIgKyBjb2xvciArIFwiIGlzIG5vdCBhIGxlZ2FsIENTUyBjb2xvciB2YWx1ZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuX2NvbG9yW2NvbG9yX3NwYWNlc1tpXV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0dXJuX2NvbG9yO1xufTtcbi8vIFByZS13YXJtIHRoZSBjYWNoZSB3aXRoIG5hbWVkIGNvbG9ycywgYXMgdGhlc2UgYXJlIG5vdFxuLy8gY29udmVydGVkIHRvIHJnYiB2YWx1ZXMgYnkgdGhlIHBhcnNlQ29sb3IgZnVuY3Rpb24gYWJvdmUuXG5jYWNoZSA9IHtcbiAgICBcImJsYWNrXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAwLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiAwfSxcbiAgICBcInNpbHZlclwiOiB7XCJyXCI6IDE5MiwgXCJnXCI6IDE5MiwgXCJiXCI6IDE5MiwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNzV9LFxuICAgIFwiZ3JheVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNTB9LFxuICAgIFwid2hpdGVcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDEwMH0sXG4gICAgXCJtYXJvb25cIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJyZWRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAwLCBcImJcIjogMCwgXCJoXCI6IDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJwdXJwbGVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAwLCBcImJcIjogMTI4LCBcImhcIjogMzAwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAzMDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJncmVlblwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogMjV9LFxuICAgIFwibGltZVwiOiB7XCJyXCI6IDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogMTIwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib2xpdmVcIjoge1wiclwiOiAxMjgsIFwiZ1wiOiAxMjgsIFwiYlwiOiAwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJ5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJuYXZ5XCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAxMjgsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiAyNX0sXG4gICAgXCJibHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDAsIFwiYlwiOiAyNTUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA1MH0sXG4gICAgXCJ0ZWFsXCI6IHtcInJcIjogMCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcImFxdWFcIjoge1wiclwiOiAwLCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTY1LCBcImJcIjogMCwgXCJoXCI6IDM5LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiYWxpY2VibHVlXCI6IHtcInJcIjogMjQwLCBcImdcIjogMjQ4LCBcImJcIjogMjU1LCBcImhcIjogMjA4LCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjM1LCBcImJcIjogMjE1LCBcImhcIjogMzQsIFwic1wiOiA3OCwgXCJsXCI6IDkxfSxcbiAgICBcImFxdWFtYXJpbmVcIjoge1wiclwiOiAxMjcsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMTIsIFwiaFwiOiAxNjAsIFwic1wiOiAxMDAsIFwibFwiOiA3NX0sXG4gICAgXCJhenVyZVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImJlaWdlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjIwLCBcImhcIjogNjAsIFwic1wiOiA1NiwgXCJsXCI6IDkxfSxcbiAgICBcImJpc3F1ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIyOCwgXCJiXCI6IDE5NiwgXCJoXCI6IDMzLCBcInNcIjogMTAwLCBcImxcIjogODh9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMzUsIFwiYlwiOiAyMDUsIFwiaFwiOiAzNiwgXCJzXCI6IDEwMCwgXCJsXCI6IDkwfSxcbiAgICBcImJsdWV2aW9sZXRcIjoge1wiclwiOiAxMzgsIFwiZ1wiOiA0MywgXCJiXCI6IDIyNiwgXCJoXCI6IDI3MSwgXCJzXCI6IDc2LCBcImxcIjogNTN9LFxuICAgIFwiYnJvd25cIjoge1wiclwiOiAxNjUsIFwiZ1wiOiA0MiwgXCJiXCI6IDQyLCBcImhcIjogMCwgXCJzXCI6IDU5LCBcImxcIjogNDF9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcInJcIjogMjIyLCBcImdcIjogMTg0LCBcImJcIjogMTM1LCBcImhcIjogMzQsIFwic1wiOiA1NywgXCJsXCI6IDcwfSxcbiAgICBcImNhZGV0Ymx1ZVwiOiB7XCJyXCI6IDk1LCBcImdcIjogMTU4LCBcImJcIjogMTYwLCBcImhcIjogMTgyLCBcInNcIjogMjUsIFwibFwiOiA1MH0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcInJcIjogMTI3LCBcImdcIjogMjU1LCBcImJcIjogMCwgXCJoXCI6IDkwLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiY2hvY29sYXRlXCI6IHtcInJcIjogMjEwLCBcImdcIjogMTA1LCBcImJcIjogMzAsIFwiaFwiOiAyNSwgXCJzXCI6IDc1LCBcImxcIjogNDd9LFxuICAgIFwiY29yYWxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAxMjcsIFwiYlwiOiA4MCwgXCJoXCI6IDE2LCBcInNcIjogMTAwLCBcImxcIjogNjZ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiclwiOiAxMDAsIFwiZ1wiOiAxNDksIFwiYlwiOiAyMzcsIFwiaFwiOiAyMTksIFwic1wiOiA3OSwgXCJsXCI6IDY2fSxcbiAgICBcImNvcm5zaWxrXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjQ4LCBcImJcIjogMjIwLCBcImhcIjogNDgsIFwic1wiOiAxMDAsIFwibFwiOiA5M30sXG4gICAgXCJjcmltc29uXCI6IHtcInJcIjogMjIwLCBcImdcIjogMjAsIFwiYlwiOiA2MCwgXCJoXCI6IDM0OCwgXCJzXCI6IDgzLCBcImxcIjogNDd9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtjeWFuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEzOSwgXCJiXCI6IDEzOSwgXCJoXCI6IDE4MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiclwiOiAxODQsIFwiZ1wiOiAxMzQsIFwiYlwiOiAxMSwgXCJoXCI6IDQzLCBcInNcIjogODksIFwibFwiOiAzOH0sXG4gICAgXCJkYXJrZ3JheVwiOiB7XCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNjZ9LFxuICAgIFwiZGFya2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDEwMCwgXCJiXCI6IDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiAyMH0sXG4gICAgXCJkYXJrZ3JleVwiOiB7XCJyXCI6IDE2OSwgXCJnXCI6IDE2OSwgXCJiXCI6IDE2OSwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNjZ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcInJcIjogMTg5LCBcImdcIjogMTgzLCBcImJcIjogMTA3LCBcImhcIjogNTYsIFwic1wiOiAzOCwgXCJsXCI6IDU4fSxcbiAgICBcImRhcmttYWdlbnRhXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDEzOSwgXCJoXCI6IDMwMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDI3fSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcInJcIjogODUsIFwiZ1wiOiAxMDcsIFwiYlwiOiA0NywgXCJoXCI6IDgyLCBcInNcIjogMzksIFwibFwiOiAzMH0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTQwLCBcImJcIjogMCwgXCJoXCI6IDMzLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJyXCI6IDE1MywgXCJnXCI6IDUwLCBcImJcIjogMjA0LCBcImhcIjogMjgwLCBcInNcIjogNjEsIFwibFwiOiA1MH0sXG4gICAgXCJkYXJrcmVkXCI6IHtcInJcIjogMTM5LCBcImdcIjogMCwgXCJiXCI6IDAsIFwiaFwiOiAwLCBcInNcIjogMTAwLCBcImxcIjogMjd9LFxuICAgIFwiZGFya3NhbG1vblwiOiB7XCJyXCI6IDIzMywgXCJnXCI6IDE1MCwgXCJiXCI6IDEyMiwgXCJoXCI6IDE1LCBcInNcIjogNzIsIFwibFwiOiA3MH0sXG4gICAgXCJkYXJrc2VhZ3JlZW5cIjoge1wiclwiOiAxNDMsIFwiZ1wiOiAxODgsIFwiYlwiOiAxNDMsIFwiaFwiOiAxMjAsIFwic1wiOiAyNSwgXCJsXCI6IDY1fSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiclwiOiA3MiwgXCJnXCI6IDYxLCBcImJcIjogMTM5LCBcImhcIjogMjQ4LCBcInNcIjogMzksIFwibFwiOiAzOX0sXG4gICAgXCJkYXJrc2xhdGVncmF5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMTgwLCBcInNcIjogMjUsIFwibFwiOiAyNX0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcInJcIjogNDcsIFwiZ1wiOiA3OSwgXCJiXCI6IDc5LCBcImhcIjogMTgwLCBcInNcIjogMjUsIFwibFwiOiAyNX0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcInJcIjogMCwgXCJnXCI6IDIwNiwgXCJiXCI6IDIwOSwgXCJoXCI6IDE4MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDQxfSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiclwiOiAxNDgsIFwiZ1wiOiAwLCBcImJcIjogMjExLCBcImhcIjogMjgyLCBcInNcIjogMTAwLCBcImxcIjogNDF9LFxuICAgIFwiZGVlcHBpbmtcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMCwgXCJiXCI6IDE0NywgXCJoXCI6IDMyOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU0fSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcInJcIjogMCwgXCJnXCI6IDE5MSwgXCJiXCI6IDI1NSwgXCJoXCI6IDE5NSwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcImRpbWdyYXlcIjoge1wiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDQxfSxcbiAgICBcImRpbWdyZXlcIjoge1wiclwiOiAxMDUsIFwiZ1wiOiAxMDUsIFwiYlwiOiAxMDUsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDQxfSxcbiAgICBcImRvZGdlcmJsdWVcIjoge1wiclwiOiAzMCwgXCJnXCI6IDE0NCwgXCJiXCI6IDI1NSwgXCJoXCI6IDIxMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDU2fSxcbiAgICBcImZpcmVicmlja1wiOiB7XCJyXCI6IDE3OCwgXCJnXCI6IDM0LCBcImJcIjogMzQsIFwiaFwiOiAwLCBcInNcIjogNjgsIFwibFwiOiA0Mn0sXG4gICAgXCJmbG9yYWx3aGl0ZVwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDI0MCwgXCJoXCI6IDQwLCBcInNcIjogMTAwLCBcImxcIjogOTd9LFxuICAgIFwiZm9yZXN0Z3JlZW5cIjoge1wiclwiOiAzNCwgXCJnXCI6IDEzOSwgXCJiXCI6IDM0LCBcImhcIjogMTIwLCBcInNcIjogNjEsIFwibFwiOiAzNH0sXG4gICAgXCJnYWluc2Jvcm9cIjoge1wiclwiOiAyMjAsIFwiZ1wiOiAyMjAsIFwiYlwiOiAyMjAsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDg2fSxcbiAgICBcImdob3N0d2hpdGVcIjoge1wiclwiOiAyNDgsIFwiZ1wiOiAyNDgsIFwiYlwiOiAyNTUsIFwiaFwiOiAyNDAsIFwic1wiOiAxMDAsIFwibFwiOiA5OX0sXG4gICAgXCJnb2xkXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE1LCBcImJcIjogMCwgXCJoXCI6IDUxLCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwiZ29sZGVucm9kXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTY1LCBcImJcIjogMzIsIFwiaFwiOiA0MywgXCJzXCI6IDc0LCBcImxcIjogNDl9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiclwiOiAxNzMsIFwiZ1wiOiAyNTUsIFwiYlwiOiA0NywgXCJoXCI6IDg0LCBcInNcIjogMTAwLCBcImxcIjogNTl9LFxuICAgIFwiZ3JleVwiOiB7XCJyXCI6IDEyOCwgXCJnXCI6IDEyOCwgXCJiXCI6IDEyOCwgXCJoXCI6IDAsIFwic1wiOiAwLCBcImxcIjogNTB9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiclwiOiAyNDAsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNDAsIFwiaFwiOiAxMjAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJob3RwaW5rXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTA1LCBcImJcIjogMTgwLCBcImhcIjogMzMwLCBcInNcIjogMTAwLCBcImxcIjogNzF9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcInJcIjogMjA1LCBcImdcIjogOTIsIFwiYlwiOiA5MiwgXCJoXCI6IDAsIFwic1wiOiA1MywgXCJsXCI6IDU4fSxcbiAgICBcImluZGlnb1wiOiB7XCJyXCI6IDc1LCBcImdcIjogMCwgXCJiXCI6IDEzMCwgXCJoXCI6IDI3NSwgXCJzXCI6IDEwMCwgXCJsXCI6IDI1fSxcbiAgICBcIml2b3J5XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjQwLCBcImhcIjogNjAsIFwic1wiOiAxMDAsIFwibFwiOiA5N30sXG4gICAgXCJraGFraVwiOiB7XCJyXCI6IDI0MCwgXCJnXCI6IDIzMCwgXCJiXCI6IDE0MCwgXCJoXCI6IDU0LCBcInNcIjogNzcsIFwibFwiOiA3NX0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJyXCI6IDIzMCwgXCJnXCI6IDIzMCwgXCJiXCI6IDI1MCwgXCJoXCI6IDI0MCwgXCJzXCI6IDY3LCBcImxcIjogOTR9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI0MCwgXCJiXCI6IDI0NSwgXCJoXCI6IDM0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcImxhd25ncmVlblwiOiB7XCJyXCI6IDEyNCwgXCJnXCI6IDI1MiwgXCJiXCI6IDAsIFwiaFwiOiA5MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDQ5fSxcbiAgICBcImxlbW9uY2hpZmZvblwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDI1MCwgXCJiXCI6IDIwNSwgXCJoXCI6IDU0LCBcInNcIjogMTAwLCBcImxcIjogOTB9LFxuICAgIFwibGlnaHRibHVlXCI6IHtcInJcIjogMTczLCBcImdcIjogMjE2LCBcImJcIjogMjMwLCBcImhcIjogMTk1LCBcInNcIjogNTMsIFwibFwiOiA3OX0sXG4gICAgXCJsaWdodGNvcmFsXCI6IHtcInJcIjogMjQwLCBcImdcIjogMTI4LCBcImJcIjogMTI4LCBcImhcIjogMCwgXCJzXCI6IDc5LCBcImxcIjogNzJ9LFxuICAgIFwibGlnaHRjeWFuXCI6IHtcInJcIjogMjI0LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImhcIjogMTgwLCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjoge1wiclwiOiAyNTAsIFwiZ1wiOiAyNTAsIFwiYlwiOiAyMTAsIFwiaFwiOiA2MCwgXCJzXCI6IDgwLCBcImxcIjogOTB9LFxuICAgIFwibGlnaHRncmF5XCI6IHtcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA4M30sXG4gICAgXCJsaWdodGdyZWVuXCI6IHtcInJcIjogMTQ0LCBcImdcIjogMjM4LCBcImJcIjogMTQ0LCBcImhcIjogMTIwLCBcInNcIjogNzMsIFwibFwiOiA3NX0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiclwiOiAyMTEsIFwiZ1wiOiAyMTEsIFwiYlwiOiAyMTEsIFwiaFwiOiAwLCBcInNcIjogMCwgXCJsXCI6IDgzfSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE4MiwgXCJiXCI6IDE5MywgXCJoXCI6IDM1MSwgXCJzXCI6IDEwMCwgXCJsXCI6IDg2fSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcInJcIjogMjU1LCBcImdcIjogMTYwLCBcImJcIjogMTIyLCBcImhcIjogMTcsIFwic1wiOiAxMDAsIFwibFwiOiA3NH0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcInJcIjogMzIsIFwiZ1wiOiAxNzgsIFwiYlwiOiAxNzAsIFwiaFwiOiAxNzcsIFwic1wiOiA3MCwgXCJsXCI6IDQxfSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDI1MCwgXCJoXCI6IDIwMywgXCJzXCI6IDkyLCBcImxcIjogNzV9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiclwiOiAxMTksIFwiZ1wiOiAxMzYsIFwiYlwiOiAxNTMsIFwiaFwiOiAyMTAsIFwic1wiOiAxNCwgXCJsXCI6IDUzfSxcbiAgICBcImxpZ2h0c2xhdGVncmV5XCI6IHtcInJcIjogMTE5LCBcImdcIjogMTM2LCBcImJcIjogMTUzLCBcImhcIjogMjEwLCBcInNcIjogMTQsIFwibFwiOiA1M30sXG4gICAgXCJsaWdodHN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDE3NiwgXCJnXCI6IDE5NiwgXCJiXCI6IDIyMiwgXCJoXCI6IDIxNCwgXCJzXCI6IDQxLCBcImxcIjogNzh9LFxuICAgIFwibGlnaHR5ZWxsb3dcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyMjQsIFwiaFwiOiA2MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk0fSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJyXCI6IDUwLCBcImdcIjogMjA1LCBcImJcIjogNTAsIFwiaFwiOiAxMjAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfSxcbiAgICBcImxpbmVuXCI6IHtcInJcIjogMjUwLCBcImdcIjogMjQwLCBcImJcIjogMjMwLCBcImhcIjogMzAsIFwic1wiOiA2NywgXCJsXCI6IDk0fSxcbiAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjoge1wiclwiOiAxMDIsIFwiZ1wiOiAyMDUsIFwiYlwiOiAxNzAsIFwiaFwiOiAxNjAsIFwic1wiOiA1MSwgXCJsXCI6IDYwfSxcbiAgICBcIm1lZGl1bWJsdWVcIjoge1wiclwiOiAwLCBcImdcIjogMCwgXCJiXCI6IDIwNSwgXCJoXCI6IDI0MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDQwfSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJyXCI6IDE4NiwgXCJnXCI6IDg1LCBcImJcIjogMjExLCBcImhcIjogMjg4LCBcInNcIjogNTksIFwibFwiOiA1OH0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiclwiOiAxNDcsIFwiZ1wiOiAxMTIsIFwiYlwiOiAyMTksIFwiaFwiOiAyNjAsIFwic1wiOiA2MCwgXCJsXCI6IDY1fSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcInJcIjogNjAsIFwiZ1wiOiAxNzksIFwiYlwiOiAxMTMsIFwiaFwiOiAxNDcsIFwic1wiOiA1MCwgXCJsXCI6IDQ3fSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJyXCI6IDEyMywgXCJnXCI6IDEwNCwgXCJiXCI6IDIzOCwgXCJoXCI6IDI0OSwgXCJzXCI6IDgwLCBcImxcIjogNjd9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiclwiOiAwLCBcImdcIjogMjUwLCBcImJcIjogMTU0LCBcImhcIjogMTU3LCBcInNcIjogMTAwLCBcImxcIjogNDl9LFxuICAgIFwibWVkaXVtdHVycXVvaXNlXCI6IHtcInJcIjogNzIsIFwiZ1wiOiAyMDksIFwiYlwiOiAyMDQsIFwiaFwiOiAxNzgsIFwic1wiOiA2MCwgXCJsXCI6IDU1fSxcbiAgICBcIm1lZGl1bXZpb2xldHJlZFwiOiB7XCJyXCI6IDE5OSwgXCJnXCI6IDIxLCBcImJcIjogMTMzLCBcImhcIjogMzIyLCBcInNcIjogODEsIFwibFwiOiA0M30sXG4gICAgXCJtaWRuaWdodGJsdWVcIjoge1wiclwiOiAyNSwgXCJnXCI6IDI1LCBcImJcIjogMTEyLCBcImhcIjogMjQwLCBcInNcIjogNjQsIFwibFwiOiAyN30sXG4gICAgXCJtaW50Y3JlYW1cIjoge1wiclwiOiAyNDUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTAsIFwiaFwiOiAxNTAsIFwic1wiOiAxMDAsIFwibFwiOiA5OH0sXG4gICAgXCJtaXN0eXJvc2VcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAyMjUsIFwiaFwiOiA2LCBcInNcIjogMTAwLCBcImxcIjogOTR9LFxuICAgIFwibW9jY2FzaW5cIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyMjgsIFwiYlwiOiAxODEsIFwiaFwiOiAzOCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg1fSxcbiAgICBcIm5hdmFqb3doaXRlXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjIyLCBcImJcIjogMTczLCBcImhcIjogMzYsIFwic1wiOiAxMDAsIFwibFwiOiA4NH0sXG4gICAgXCJvbGRsYWNlXCI6IHtcInJcIjogMjUzLCBcImdcIjogMjQ1LCBcImJcIjogMjMwLCBcImhcIjogMzksIFwic1wiOiA4NSwgXCJsXCI6IDk1fSxcbiAgICBcIm9saXZlZHJhYlwiOiB7XCJyXCI6IDEwNywgXCJnXCI6IDE0MiwgXCJiXCI6IDM1LCBcImhcIjogODAsIFwic1wiOiA2MCwgXCJsXCI6IDM1fSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDY5LCBcImJcIjogMCwgXCJoXCI6IDE2LCBcInNcIjogMTAwLCBcImxcIjogNTB9LFxuICAgIFwib3JjaGlkXCI6IHtcInJcIjogMjE4LCBcImdcIjogMTEyLCBcImJcIjogMjE0LCBcImhcIjogMzAyLCBcInNcIjogNTksIFwibFwiOiA2NX0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcInJcIjogMjM4LCBcImdcIjogMjMyLCBcImJcIjogMTcwLCBcImhcIjogNTUsIFwic1wiOiA2NywgXCJsXCI6IDgwfSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJyXCI6IDE1MiwgXCJnXCI6IDI1MSwgXCJiXCI6IDE1MiwgXCJoXCI6IDEyMCwgXCJzXCI6IDkzLCBcImxcIjogNzl9LFxuICAgIFwicGFsZXR1cnF1b2lzZVwiOiB7XCJyXCI6IDE3NSwgXCJnXCI6IDIzOCwgXCJiXCI6IDIzOCwgXCJoXCI6IDE4MCwgXCJzXCI6IDY1LCBcImxcIjogODF9LFxuICAgIFwicGFsZXZpb2xldHJlZFwiOiB7XCJyXCI6IDIxOSwgXCJnXCI6IDExMiwgXCJiXCI6IDE0NywgXCJoXCI6IDM0MCwgXCJzXCI6IDYwLCBcImxcIjogNjV9LFxuICAgIFwicGFwYXlhd2hpcFwiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDIzOSwgXCJiXCI6IDIxMywgXCJoXCI6IDM3LCBcInNcIjogMTAwLCBcImxcIjogOTJ9LFxuICAgIFwicGVhY2hwdWZmXCI6IHtcInJcIjogMjU1LCBcImdcIjogMjE4LCBcImJcIjogMTg1LCBcImhcIjogMjgsIFwic1wiOiAxMDAsIFwibFwiOiA4Nn0sXG4gICAgXCJwZXJ1XCI6IHtcInJcIjogMjA1LCBcImdcIjogMTMzLCBcImJcIjogNjMsIFwiaFwiOiAzMCwgXCJzXCI6IDU5LCBcImxcIjogNTN9LFxuICAgIFwicGlua1wiOiB7XCJyXCI6IDI1NSwgXCJnXCI6IDE5MiwgXCJiXCI6IDIwMywgXCJoXCI6IDM1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDg4fSxcbiAgICBcInBsdW1cIjoge1wiclwiOiAyMjEsIFwiZ1wiOiAxNjAsIFwiYlwiOiAyMjEsIFwiaFwiOiAzMDAsIFwic1wiOiA0NywgXCJsXCI6IDc1fSxcbiAgICBcInBvd2RlcmJsdWVcIjoge1wiclwiOiAxNzYsIFwiZ1wiOiAyMjQsIFwiYlwiOiAyMzAsIFwiaFwiOiAxODcsIFwic1wiOiA1MiwgXCJsXCI6IDgwfSxcbiAgICBcInJvc3licm93blwiOiB7XCJyXCI6IDE4OCwgXCJnXCI6IDE0MywgXCJiXCI6IDE0MywgXCJoXCI6IDAsIFwic1wiOiAyNSwgXCJsXCI6IDY1fSxcbiAgICBcInJveWFsYmx1ZVwiOiB7XCJyXCI6IDY1LCBcImdcIjogMTA1LCBcImJcIjogMjI1LCBcImhcIjogMjI1LCBcInNcIjogNzMsIFwibFwiOiA1N30sXG4gICAgXCJzYWRkbGVicm93blwiOiB7XCJyXCI6IDEzOSwgXCJnXCI6IDY5LCBcImJcIjogMTksIFwiaFwiOiAyNSwgXCJzXCI6IDc2LCBcImxcIjogMzF9LFxuICAgIFwic2FsbW9uXCI6IHtcInJcIjogMjUwLCBcImdcIjogMTI4LCBcImJcIjogMTE0LCBcImhcIjogNiwgXCJzXCI6IDkzLCBcImxcIjogNzF9LFxuICAgIFwic2FuZHlicm93blwiOiB7XCJyXCI6IDI0NCwgXCJnXCI6IDE2NCwgXCJiXCI6IDk2LCBcImhcIjogMjgsIFwic1wiOiA4NywgXCJsXCI6IDY3fSxcbiAgICBcInNlYWdyZWVuXCI6IHtcInJcIjogNDYsIFwiZ1wiOiAxMzksIFwiYlwiOiA4NywgXCJoXCI6IDE0NiwgXCJzXCI6IDUwLCBcImxcIjogMzZ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiclwiOiAyNTUsIFwiZ1wiOiAyNDUsIFwiYlwiOiAyMzgsIFwiaFwiOiAyNSwgXCJzXCI6IDEwMCwgXCJsXCI6IDk3fSxcbiAgICBcInNpZW5uYVwiOiB7XCJyXCI6IDE2MCwgXCJnXCI6IDgyLCBcImJcIjogNDUsIFwiaFwiOiAxOSwgXCJzXCI6IDU2LCBcImxcIjogNDB9LFxuICAgIFwic2t5Ymx1ZVwiOiB7XCJyXCI6IDEzNSwgXCJnXCI6IDIwNiwgXCJiXCI6IDIzNSwgXCJoXCI6IDE5NywgXCJzXCI6IDcxLCBcImxcIjogNzN9LFxuICAgIFwic2xhdGVibHVlXCI6IHtcInJcIjogMTA2LCBcImdcIjogOTAsIFwiYlwiOiAyMDUsIFwiaFwiOiAyNDgsIFwic1wiOiA1MywgXCJsXCI6IDU4fSxcbiAgICBcInNsYXRlZ3JheVwiOiB7XCJyXCI6IDExMiwgXCJnXCI6IDEyOCwgXCJiXCI6IDE0NCwgXCJoXCI6IDIxMCwgXCJzXCI6IDEzLCBcImxcIjogNTB9LFxuICAgIFwic2xhdGVncmV5XCI6IHtcInJcIjogMTEyLCBcImdcIjogMTI4LCBcImJcIjogMTQ0LCBcImhcIjogMjEwLCBcInNcIjogMTMsIFwibFwiOiA1MH0sXG4gICAgXCJzbm93XCI6IHtcInJcIjogMjU1LCBcImdcIjogMjUwLCBcImJcIjogMjUwLCBcImhcIjogMCwgXCJzXCI6IDEwMCwgXCJsXCI6IDk5fSxcbiAgICBcInNwcmluZ2dyZWVuXCI6IHtcInJcIjogMCwgXCJnXCI6IDI1NSwgXCJiXCI6IDEyNywgXCJoXCI6IDE1MCwgXCJzXCI6IDEwMCwgXCJsXCI6IDUwfSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJyXCI6IDcwLCBcImdcIjogMTMwLCBcImJcIjogMTgwLCBcImhcIjogMjA3LCBcInNcIjogNDQsIFwibFwiOiA0OX0sXG4gICAgXCJ0YW5cIjoge1wiclwiOiAyMTAsIFwiZ1wiOiAxODAsIFwiYlwiOiAxNDAsIFwiaFwiOiAzNCwgXCJzXCI6IDQ0LCBcImxcIjogNjl9LFxuICAgIFwidGhpc3RsZVwiOiB7XCJyXCI6IDIxNiwgXCJnXCI6IDE5MSwgXCJiXCI6IDIxNiwgXCJoXCI6IDMwMCwgXCJzXCI6IDI0LCBcImxcIjogODB9LFxuICAgIFwidG9tYXRvXCI6IHtcInJcIjogMjU1LCBcImdcIjogOTksIFwiYlwiOiA3MSwgXCJoXCI6IDksIFwic1wiOiAxMDAsIFwibFwiOiA2NH0sXG4gICAgXCJ0dXJxdW9pc2VcIjoge1wiclwiOiA2NCwgXCJnXCI6IDIyNCwgXCJiXCI6IDIwOCwgXCJoXCI6IDE3NCwgXCJzXCI6IDcyLCBcImxcIjogNTZ9LFxuICAgIFwidmlvbGV0XCI6IHtcInJcIjogMjM4LCBcImdcIjogMTMwLCBcImJcIjogMjM4LCBcImhcIjogMzAwLCBcInNcIjogNzYsIFwibFwiOiA3Mn0sXG4gICAgXCJ3aGVhdFwiOiB7XCJyXCI6IDI0NSwgXCJnXCI6IDIyMiwgXCJiXCI6IDE3OSwgXCJoXCI6IDM5LCBcInNcIjogNzcsIFwibFwiOiA4M30sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcInJcIjogMjQ1LCBcImdcIjogMjQ1LCBcImJcIjogMjQ1LCBcImhcIjogMCwgXCJzXCI6IDAsIFwibFwiOiA5Nn0sXG4gICAgXCJ5ZWxsb3dncmVlblwiOiB7XCJyXCI6IDE1NCwgXCJnXCI6IDIwNSwgXCJiXCI6IDUwLCBcImhcIjogODAsIFwic1wiOiA2MSwgXCJsXCI6IDUwfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjtcbiIsIi8qKiBcbiAqIEBjb25zdGFudFxuICogQHR5cGUge09iamVjdC48c3RyaW5nLCBudW1iZXI+fSBcbiAqL1xudmFyIEtFWUNPREVTID0ge1xuICAgICdiYWNrc3BhY2UnIDogOCxcbiAgICAndGFiJyA6IDksXG4gICAgJ2VudGVyJyA6IDEzLFxuICAgICdzaGlmdCcgOiAxNixcbiAgICAnY3RybCcgOiAxNyxcbiAgICAnYWx0JyA6IDE4LFxuICAgICdwYXVzZV9icmVhaycgOiAxOSxcbiAgICAnY2Fwc19sb2NrJyA6IDIwLFxuICAgICdlc2NhcGUnIDogMjcsXG4gICAgJ3BhZ2VfdXAnIDogMzMsXG4gICAgJ3BhZ2UgZG93bicgOiAzNCxcbiAgICAnZW5kJyA6IDM1LFxuICAgICdob21lJyA6IDM2LFxuICAgICdsZWZ0X2Fycm93JyA6IDM3LFxuICAgICd1cF9hcnJvdycgOiAzOCxcbiAgICAncmlnaHRfYXJyb3cnIDogMzksXG4gICAgJ2Rvd25fYXJyb3cnIDogNDAsXG4gICAgJ2luc2VydCcgOiA0NSxcbiAgICAnZGVsZXRlJyA6IDQ2LFxuICAgICcwJyA6IDQ4LFxuICAgICcxJyA6IDQ5LFxuICAgICcyJyA6IDUwLFxuICAgICczJyA6IDUxLFxuICAgICc0JyA6IDUyLFxuICAgICc1JyA6IDUzLFxuICAgICc2JyA6IDU0LFxuICAgICc3JyA6IDU1LFxuICAgICc4JyA6IDU2LFxuICAgICc5JyA6IDU3LFxuICAgICdhJyA6IDY1LFxuICAgICdiJyA6IDY2LFxuICAgICdjJyA6IDY3LFxuICAgICdkJyA6IDY4LFxuICAgICdlJyA6IDY5LFxuICAgICdmJyA6IDcwLFxuICAgICdnJyA6IDcxLFxuICAgICdoJyA6IDcyLFxuICAgICdpJyA6IDczLFxuICAgICdqJyA6IDc0LFxuICAgICdrJyA6IDc1LFxuICAgICdsJyA6IDc2LFxuICAgICdtJyA6IDc3LFxuICAgICduJyA6IDc4LFxuICAgICdvJyA6IDc5LFxuICAgICdwJyA6IDgwLFxuICAgICdxJyA6IDgxLFxuICAgICdyJyA6IDgyLFxuICAgICdzJyA6IDgzLFxuICAgICd0JyA6IDg0LFxuICAgICd1JyA6IDg1LFxuICAgICd2JyA6IDg2LFxuICAgICd3JyA6IDg3LFxuICAgICd4JyA6IDg4LFxuICAgICd5JyA6IDg5LFxuICAgICd6JyA6IDkwLFxuICAgICdsZWZ0X3dpbmRvdyBrZXknIDogOTEsXG4gICAgJ3JpZ2h0X3dpbmRvdyBrZXknIDogOTIsXG4gICAgJ3NlbGVjdF9rZXknIDogOTMsXG4gICAgJ251bXBhZCAwJyA6IDk2LFxuICAgICdudW1wYWQgMScgOiA5NyxcbiAgICAnbnVtcGFkIDInIDogOTgsXG4gICAgJ251bXBhZCAzJyA6IDk5LFxuICAgICdudW1wYWQgNCcgOiAxMDAsXG4gICAgJ251bXBhZCA1JyA6IDEwMSxcbiAgICAnbnVtcGFkIDYnIDogMTAyLFxuICAgICdudW1wYWQgNycgOiAxMDMsXG4gICAgJ251bXBhZCA4JyA6IDEwNCxcbiAgICAnbnVtcGFkIDknIDogMTA1LFxuICAgICdtdWx0aXBseScgOiAxMDYsXG4gICAgJ2FkZCcgOiAxMDcsXG4gICAgJ3N1YnRyYWN0JyA6IDEwOSxcbiAgICAnZGVjaW1hbCBwb2ludCcgOiAxMTAsXG4gICAgJ2RpdmlkZScgOiAxMTEsXG4gICAgJ2YxJyA6IDExMixcbiAgICAnZjInIDogMTEzLFxuICAgICdmMycgOiAxMTQsXG4gICAgJ2Y0JyA6IDExNSxcbiAgICAnZjUnIDogMTE2LFxuICAgICdmNicgOiAxMTcsXG4gICAgJ2Y3JyA6IDExOCxcbiAgICAnZjgnIDogMTE5LFxuICAgICdmOScgOiAxMjAsXG4gICAgJ2YxMCcgOiAxMjEsXG4gICAgJ2YxMScgOiAxMjIsXG4gICAgJ2YxMicgOiAxMjMsXG4gICAgJ251bV9sb2NrJyA6IDE0NCxcbiAgICAnc2Nyb2xsX2xvY2snIDogMTQ1LFxuICAgICdzZW1pX2NvbG9uJyA6IDE4NixcbiAgICAnZXF1YWxfc2lnbicgOiAxODcsXG4gICAgJ2NvbW1hJyA6IDE4OCxcbiAgICAnZGFzaCcgOiAxODksXG4gICAgJ3BlcmlvZCcgOiAxOTAsXG4gICAgJ2ZvcndhcmRfc2xhc2gnIDogMTkxLFxuICAgICdncmF2ZV9hY2NlbnQnIDogMTkyLFxuICAgICdvcGVuX2JyYWNrZXQnIDogMjE5LFxuICAgICdiYWNrc2xhc2gnIDogMjIwLFxuICAgICdjbG9zZWJyYWNrZXQnIDogMjIxLFxuICAgICdzaW5nbGVfcXVvdGUnIDogMjIyXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtFWUNPREVTOyIsInJlcXVpcmUoJy4vLi4vdGVzdHMvaGVscGVycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9kYXRhL2NvbG9ycy5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9lbmdpbmUvY2FtZXJhLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2VuZ2luZS9zY2VuZS5qcycpO1xucmVxdWlyZSgnLi8uLi90ZXN0cy9nZW9tZXRyeS9mYWNlLmpzJyk7XG5yZXF1aXJlKCcuLy4uL3Rlc3RzL2dlb21ldHJ5L21lc2guanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvdXRpbGl0aWVzL2NvbG9yLmpzJyk7XG4iLCJ2YXIgbmFtZWRjb2xvcnMgPSB7XG4gICAgXCJhbGljZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogMCB9LCBcInJnYlwiOiB7XCJyXCI6IDI0MCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjBmOGZmXCJ9LFxuICAgIFwiYW50aXF1ZXdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAyMzUsXCJiXCI6IDIxNSB9LCBcImhleFwiOiBcIiNmYWViZDdcIn0sXG4gICAgXCJhcXVhXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiYXF1YW1hcmluZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiAxMDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjcsXCJnXCI6IDI1NSxcImJcIjogMjEyIH0sIFwiaGV4XCI6IFwiIzdmZmZkNFwifSxcbiAgICBcImF6dXJlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDAsXCJnXCI6IDI1NSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2YwZmZmZlwifSxcbiAgICBcImJlaWdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjIwIH0sIFwiaGV4XCI6IFwiI2Y1ZjVkY1wifSxcbiAgICBcImJpc3F1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMDAsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIyOCxcImJcIjogMTk2IH0sIFwiaGV4XCI6IFwiI2ZmZTRjNFwifSxcbiAgICBcImJsYWNrXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDAwMDAwXCJ9LFxuICAgIFwiYmxhbmNoZWRhbG1vbmRcIjoge1wiaHNsXCI6IHtcImhcIjogMTIwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMzUsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiNmZmViY2RcIn0sXG4gICAgXCJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMwMDAwZmZcIn0sXG4gICAgXCJibHVldmlvbGV0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDI1IH0sIFwicmdiXCI6IHtcInJcIjogMTM4LFwiZ1wiOiA0MyxcImJcIjogMjI2IH0sIFwiaGV4XCI6IFwiIzhhMmJlMlwifSxcbiAgICBcImJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTY1LFwiZ1wiOiA0MixcImJcIjogNDIgfSwgXCJoZXhcIjogXCIjYTUyYTJhXCJ9LFxuICAgIFwiYnVybHl3b29kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMixcImdcIjogMTg0LFwiYlwiOiAxMzUgfSwgXCJoZXhcIjogXCIjZGViODg3XCJ9LFxuICAgIFwiY2FkZXRibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDk1LFwiZ1wiOiAxNTgsXCJiXCI6IDE2MCB9LCBcImhleFwiOiBcIiM1ZjllYTBcIn0sXG4gICAgXCJjaGFydHJldXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MCxcInNcIjogMTAwLFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyNyxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzdmZmYwMFwifSxcbiAgICBcImNob2NvbGF0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTAsXCJnXCI6IDEwNSxcImJcIjogMzAgfSwgXCJoZXhcIjogXCIjZDI2OTFlXCJ9LFxuICAgIFwiY29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzksXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDEyNyxcImJcIjogODAgfSwgXCJoZXhcIjogXCIjZmY3ZjUwXCJ9LFxuICAgIFwiY29ybmZsb3dlcmJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMjA4LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTAwLFwiZ1wiOiAxNDksXCJiXCI6IDIzNyB9LCBcImhleFwiOiBcIiM2NDk1ZWRcIn0sXG4gICAgXCJjb3Juc2lsa1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNCxcInNcIjogNzgsXCJsXCI6IDkxIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDgsXCJiXCI6IDIyMCB9LCBcImhleFwiOiBcIiNmZmY4ZGNcIn0sXG4gICAgXCJjcmltc29uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2MCxcInNcIjogMTAwLFwibFwiOiA3NSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjAsXCJiXCI6IDYwIH0sIFwiaGV4XCI6IFwiI2RjMTQzY1wifSxcbiAgICBcImN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjMDBmZmZmXCJ9LFxuICAgIFwiZGFya2JsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogNjAsXCJzXCI6IDU2LFwibFwiOiA5MSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDAsXCJiXCI6IDEzOSB9LCBcImhleFwiOiBcIiMwMDAwOGJcIn0sXG4gICAgXCJkYXJrY3lhblwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA4OCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDEzOSxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzAwOGI4YlwifSxcbiAgICBcImRhcmtnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMzYsXCJzXCI6IDEwMCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxODQsXCJnXCI6IDEzNCxcImJcIjogMTEgfSwgXCJoZXhcIjogXCIjYjg4NjBiXCJ9LFxuICAgIFwiZGFya2dyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjcxLFwic1wiOiA3NixcImxcIjogNTMgfSwgXCJyZ2JcIjoge1wiclwiOiAxNjksXCJnXCI6IDE2OSxcImJcIjogMTY5IH0sIFwiaGV4XCI6IFwiI2E5YTlhOVwifSxcbiAgICBcImRhcmtncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiA1OSxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA2NDAwXCJ9LFxuICAgIFwiZGFya2dyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzQsXCJzXCI6IDU3LFwibFwiOiA3MCB9LCBcInJnYlwiOiB7XCJyXCI6IDE2OSxcImdcIjogMTY5LFwiYlwiOiAxNjkgfSwgXCJoZXhcIjogXCIjYTlhOWE5XCJ9LFxuICAgIFwiZGFya2toYWtpXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE4MixcInNcIjogMjUsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTg5LFwiZ1wiOiAxODMsXCJiXCI6IDEwNyB9LCBcImhleFwiOiBcIiNiZGI3NmJcIn0sXG4gICAgXCJkYXJrbWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiA5MCxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEzOSxcImdcIjogMCxcImJcIjogMTM5IH0sIFwiaGV4XCI6IFwiIzhiMDA4YlwifSxcbiAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NSxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiA4NSxcImdcIjogMTA3LFwiYlwiOiA0NyB9LCBcImhleFwiOiBcIiM1NTZiMmZcIn0sXG4gICAgXCJkYXJrb3JhbmdlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY4YzAwXCJ9LFxuICAgIFwiZGFya29yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTksXCJzXCI6IDc5LFwibFwiOiA2NiB9LCBcInJnYlwiOiB7XCJyXCI6IDE1MyxcImdcIjogNTAsXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM5OTMyY2NcIn0sXG4gICAgXCJkYXJrcmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQ4LFwic1wiOiAxMDAsXCJsXCI6IDkzIH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiAwLFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzhiMDAwMFwifSxcbiAgICBcImRhcmtzYWxtb25cIjoge1wiaHNsXCI6IHtcImhcIjogMzQ4LFwic1wiOiA4MyxcImxcIjogNDcgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzMsXCJnXCI6IDE1MCxcImJcIjogMTIyIH0sIFwiaGV4XCI6IFwiI2U5OTY3YVwifSxcbiAgICBcImRhcmtzZWFncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDAsXCJzXCI6IDEwMCxcImxcIjogMjcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDMsXCJnXCI6IDE4OCxcImJcIjogMTQzIH0sIFwiaGV4XCI6IFwiIzhmYmM4ZlwifSxcbiAgICBcImRhcmtzbGF0ZWJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTgwLFwic1wiOiAxMDAsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogNzIsXCJnXCI6IDYxLFwiYlwiOiAxMzkgfSwgXCJoZXhcIjogXCIjNDgzZDhiXCJ9LFxuICAgIFwiZGFya3NsYXRlZ3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogODksXCJsXCI6IDM4IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrc2xhdGVncmV5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDY2IH0sIFwicmdiXCI6IHtcInJcIjogNDcsXCJnXCI6IDc5LFwiYlwiOiA3OSB9LCBcImhleFwiOiBcIiMyZjRmNGZcIn0sXG4gICAgXCJkYXJrdHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMTAwLFwibFwiOiAyMCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDIwNixcImJcIjogMjA5IH0sIFwiaGV4XCI6IFwiIzAwY2VkMVwifSxcbiAgICBcImRhcmt2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNjYgfSwgXCJyZ2JcIjoge1wiclwiOiAxNDgsXCJnXCI6IDAsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiM5NDAwZDNcIn0sXG4gICAgXCJkZWVwcGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiA1NixcInNcIjogMzgsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMCxcImJcIjogMTQ3IH0sIFwiaGV4XCI6IFwiI2ZmMTQ5M1wifSxcbiAgICBcImRlZXBza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDE5MSxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiIzAwYmZmZlwifSxcbiAgICBcImRpbWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogODIsXCJzXCI6IDM5LFwibFwiOiAzMCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZGltZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAzMyxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNSxcImdcIjogMTA1LFwiYlwiOiAxMDUgfSwgXCJoZXhcIjogXCIjNjk2OTY5XCJ9LFxuICAgIFwiZG9kZ2VyYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDMwLFwiZ1wiOiAxNDQsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiMxZTkwZmZcIn0sXG4gICAgXCJmaXJlYnJpY2tcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiAyNyB9LCBcInJnYlwiOiB7XCJyXCI6IDE3OCxcImdcIjogMzQsXCJiXCI6IDM0IH0sIFwiaGV4XCI6IFwiI2IyMjIyMlwifSxcbiAgICBcImZsb3JhbHdoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1LFwic1wiOiA3MixcImxcIjogNzAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjQwIH0sIFwiaGV4XCI6IFwiI2ZmZmFmMFwifSxcbiAgICBcImZvcmVzdGdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMzQsXCJnXCI6IDEzOSxcImJcIjogMzQgfSwgXCJoZXhcIjogXCIjMjI4YjIyXCJ9LFxuICAgIFwiZnVjaHNpYVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDgsXCJzXCI6IDM5LFwibFwiOiAzOSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcImdhaW5zYm9yb1wiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDIyMCxcImdcIjogMjIwLFwiYlwiOiAyMjAgfSwgXCJoZXhcIjogXCIjZGNkY2RjXCJ9LFxuICAgIFwiZ2hvc3R3aGl0ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDI1LFwibFwiOiAyNSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0OCxcImdcIjogMjQ4LFwiYlwiOiAyNTUgfSwgXCJoZXhcIjogXCIjZjhmOGZmXCJ9LFxuICAgIFwiZ29sZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODEsXCJzXCI6IDEwMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIxNSxcImJcIjogMCB9LCBcImhleFwiOiBcIiNmZmQ3MDBcIn0sXG4gICAgXCJnb2xkZW5yb2RcIjoge1wiaHNsXCI6IHtcImhcIjogMjgyLFwic1wiOiAxMDAsXCJsXCI6IDQxIH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxNjUsXCJiXCI6IDMyIH0sIFwiaGV4XCI6IFwiI2RhYTUyMFwifSxcbiAgICBcImdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMzI4LFwic1wiOiAxMDAsXCJsXCI6IDU0IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiM4MDgwODBcIn0sXG4gICAgXCJncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjMDA4MDAwXCJ9LFxuICAgIFwiZ3JlZW55ZWxsb3dcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNDEgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDI1NSxcImJcIjogNDcgfSwgXCJoZXhcIjogXCIjYWRmZjJmXCJ9LFxuICAgIFwiZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMTI4LFwiYlwiOiAxMjggfSwgXCJoZXhcIjogXCIjODA4MDgwXCJ9LFxuICAgIFwiaG9uZXlkZXdcIjoge1wiaHNsXCI6IHtcImhcIjogMjEwLFwic1wiOiAxMDAsXCJsXCI6IDU2IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyNTUsXCJiXCI6IDI0MCB9LCBcImhleFwiOiBcIiNmMGZmZjBcIn0sXG4gICAgXCJob3RwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDY4LFwibFwiOiA0MiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTA1LFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjZmY2OWI0XCJ9LFxuICAgIFwiaW5kaWFucmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDQwLFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMjA1LFwiZ1wiOiA5MixcImJcIjogOTIgfSwgXCJoZXhcIjogXCIjY2Q1YzVjXCJ9LFxuICAgIFwiaW5kaWdvXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNjEsXCJsXCI6IDM0IH0sIFwicmdiXCI6IHtcInJcIjogNzUsXCJnXCI6IDAsXCJiXCI6IDEzMCB9LCBcImhleFwiOiBcIiM0YjAwODJcIn0sXG4gICAgXCJpdm9yeVwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjU1LFwiYlwiOiAyNDAgfSwgXCJoZXhcIjogXCIjZmZmZmYwXCJ9LFxuICAgIFwia2hha2lcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDk5IH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAyMzAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNmMGU2OGNcIn0sXG4gICAgXCJsYXZlbmRlclwiOiB7XCJoc2xcIjoge1wiaFwiOiA1MSxcInNcIjogMTAwLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDIzMCxcImdcIjogMjMwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZTZlNmZhXCJ9LFxuICAgIFwibGF2ZW5kZXJibHVzaFwiOiB7XCJoc2xcIjoge1wiaFwiOiA0MyxcInNcIjogNzQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNDAsXCJiXCI6IDI0NSB9LCBcImhleFwiOiBcIiNmZmYwZjVcIn0sXG4gICAgXCJsYXduZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogODQsXCJzXCI6IDEwMCxcImxcIjogNTkgfSwgXCJyZ2JcIjoge1wiclwiOiAxMjQsXCJnXCI6IDI1MixcImJcIjogMCB9LCBcImhleFwiOiBcIiM3Y2ZjMDBcIn0sXG4gICAgXCJsZW1vbmNoaWZmb25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDI1MCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiI2ZmZmFjZFwifSxcbiAgICBcImxpZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzMsXCJnXCI6IDIxNixcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2FkZDhlNlwifSxcbiAgICBcImxpZ2h0Y29yYWxcIjoge1wiaHNsXCI6IHtcImhcIjogMzMwLFwic1wiOiAxMDAsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogMjQwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiNmMDgwODBcIn0sXG4gICAgXCJsaWdodGN5YW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNTMsXCJsXCI6IDU4IH0sIFwicmdiXCI6IHtcInJcIjogMjI0LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNlMGZmZmZcIn0sXG4gICAgXCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyNzUsXCJzXCI6IDEwMCxcImxcIjogMjUgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTAsXCJnXCI6IDI1MCxcImJcIjogMjEwIH0sIFwiaGV4XCI6IFwiI2ZhZmFkMlwifSxcbiAgICBcImxpZ2h0Z3JheVwiOiB7XCJoc2xcIjoge1wiaFwiOiA2MCxcInNcIjogMTAwLFwibFwiOiA5NyB9LCBcInJnYlwiOiB7XCJyXCI6IDIxMSxcImdcIjogMjExLFwiYlwiOiAyMTEgfSwgXCJoZXhcIjogXCIjZDNkM2QzXCJ9LFxuICAgIFwibGlnaHRncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA1NCxcInNcIjogNzcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTQ0LFwiZ1wiOiAyMzgsXCJiXCI6IDE0NCB9LCBcImhleFwiOiBcIiM5MGVlOTBcIn0sXG4gICAgXCJsaWdodGdyZXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiA2NyxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAyMTEsXCJnXCI6IDIxMSxcImJcIjogMjExIH0sIFwiaGV4XCI6IFwiI2QzZDNkM1wifSxcbiAgICBcImxpZ2h0cGlua1wiOiB7XCJoc2xcIjoge1wiaFwiOiAzNDAsXCJzXCI6IDEwMCxcImxcIjogOTcgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDE4MixcImJcIjogMTkzIH0sIFwiaGV4XCI6IFwiI2ZmYjZjMVwifSxcbiAgICBcImxpZ2h0c2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDkwLFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxNjAsXCJiXCI6IDEyMiB9LCBcImhleFwiOiBcIiNmZmEwN2FcIn0sXG4gICAgXCJsaWdodHNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU0LFwic1wiOiAxMDAsXCJsXCI6IDkwIH0sIFwicmdiXCI6IHtcInJcIjogMzIsXCJnXCI6IDE3OCxcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiIzIwYjJhYVwifSxcbiAgICBcImxpZ2h0c2t5Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTUsXCJzXCI6IDUzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDEzNSxcImdcIjogMjA2LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjODdjZWZhXCJ9LFxuICAgIFwibGlnaHRzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogNzksXCJsXCI6IDcyIH0sIFwicmdiXCI6IHtcInJcIjogMTE5LFwiZ1wiOiAxMzYsXCJiXCI6IDE1MyB9LCBcImhleFwiOiBcIiM3Nzg4OTlcIn0sXG4gICAgXCJsaWdodHNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDEwMCxcImxcIjogOTQgfSwgXCJyZ2JcIjoge1wiclwiOiAxMTksXCJnXCI6IDEzNixcImJcIjogMTUzIH0sIFwiaGV4XCI6IFwiIzc3ODg5OVwifSxcbiAgICBcImxpZ2h0c3RlZWxibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiA4MCxcImxcIjogOTAgfSwgXCJyZ2JcIjoge1wiclwiOiAxNzYsXCJnXCI6IDE5NixcImJcIjogMjIyIH0sIFwiaGV4XCI6IFwiI2IwYzRkZVwifSxcbiAgICBcImxpZ2h0eWVsbG93XCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDgzIH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDIyNCB9LCBcImhleFwiOiBcIiNmZmZmZTBcIn0sXG4gICAgXCJsaW1lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDEyMCxcInNcIjogNzMsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMjU1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiIzAwZmYwMFwifSxcbiAgICBcImxpbWVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiAwLFwic1wiOiAwLFwibFwiOiA4MyB9LCBcInJnYlwiOiB7XCJyXCI6IDUwLFwiZ1wiOiAyMDUsXCJiXCI6IDUwIH0sIFwiaGV4XCI6IFwiIzMyY2QzMlwifSxcbiAgICBcImxpbmVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM1MSxcInNcIjogMTAwLFwibFwiOiA4NiB9LCBcInJnYlwiOiB7XCJyXCI6IDI1MCxcImdcIjogMjQwLFwiYlwiOiAyMzAgfSwgXCJoZXhcIjogXCIjZmFmMGU2XCJ9LFxuICAgIFwibWFnZW50YVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNyxcInNcIjogMTAwLFwibFwiOiA3NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMCxcImJcIjogMjU1IH0sIFwiaGV4XCI6IFwiI2ZmMDBmZlwifSxcbiAgICBcIm1hcm9vblwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzcsXCJzXCI6IDcwLFwibFwiOiA0MSB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMCB9LCBcImhleFwiOiBcIiM4MDAwMDBcIn0sXG4gICAgXCJtZWRpdW1hcXVhbWFyaW5lXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwMyxcInNcIjogOTIsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTAyLFwiZ1wiOiAyMDUsXCJiXCI6IDE3MCB9LCBcImhleFwiOiBcIiM2NmNkYWFcIn0sXG4gICAgXCJtZWRpdW1ibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIxMCxcInNcIjogMTQsXCJsXCI6IDUzIH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMjA1IH0sIFwiaGV4XCI6IFwiIzAwMDBjZFwifSxcbiAgICBcIm1lZGl1bW9yY2hpZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDE0LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDE4NixcImdcIjogODUsXCJiXCI6IDIxMSB9LCBcImhleFwiOiBcIiNiYTU1ZDNcIn0sXG4gICAgXCJtZWRpdW1wdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMjE0LFwic1wiOiA0MSxcImxcIjogNzggfSwgXCJyZ2JcIjoge1wiclwiOiAxNDcsXCJnXCI6IDExMixcImJcIjogMjE5IH0sIFwiaGV4XCI6IFwiIzkzNzBkYlwifSxcbiAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDYwLFwic1wiOiAxMDAsXCJsXCI6IDk0IH0sIFwicmdiXCI6IHtcInJcIjogNjAsXCJnXCI6IDE3OSxcImJcIjogMTEzIH0sIFwiaGV4XCI6IFwiIzNjYjM3MVwifSxcbiAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDYxLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDEyMyxcImdcIjogMTA0LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjN2I2OGVlXCJ9LFxuICAgIFwibWVkaXVtc3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDY3LFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1MCxcImJcIjogMTU0IH0sIFwiaGV4XCI6IFwiIzAwZmE5YVwifSxcbiAgICBcIm1lZGl1bXR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNjAsXCJzXCI6IDUxLFwibFwiOiA2MCB9LCBcInJnYlwiOiB7XCJyXCI6IDcyLFwiZ1wiOiAyMDksXCJiXCI6IDIwNCB9LCBcImhleFwiOiBcIiM0OGQxY2NcIn0sXG4gICAgXCJtZWRpdW12aW9sZXRyZWRcIjoge1wiaHNsXCI6IHtcImhcIjogMjQwLFwic1wiOiAxMDAsXCJsXCI6IDQwIH0sIFwicmdiXCI6IHtcInJcIjogMTk5LFwiZ1wiOiAyMSxcImJcIjogMTMzIH0sIFwiaGV4XCI6IFwiI2M3MTU4NVwifSxcbiAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyODgsXCJzXCI6IDU5LFwibFwiOiA1OCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1LFwiZ1wiOiAyNSxcImJcIjogMTEyIH0sIFwiaGV4XCI6IFwiIzE5MTk3MFwifSxcbiAgICBcIm1pbnRjcmVhbVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNjAsXCJzXCI6IDYwLFwibFwiOiA2NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI0NSxcImdcIjogMjU1LFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZjVmZmZhXCJ9LFxuICAgIFwibWlzdHlyb3NlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NyxcInNcIjogNTAsXCJsXCI6IDQ3IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjgsXCJiXCI6IDIyNSB9LCBcImhleFwiOiBcIiNmZmU0ZTFcIn0sXG4gICAgXCJtb2NjYXNpblwiOiB7XCJoc2xcIjoge1wiaFwiOiAyNDksXCJzXCI6IDgwLFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjI4LFwiYlwiOiAxODEgfSwgXCJoZXhcIjogXCIjZmZlNGI1XCJ9LFxuICAgIFwibmF2YWpvd2hpdGVcIjoge1wiaHNsXCI6IHtcImhcIjogMTU3LFwic1wiOiAxMDAsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyMjIsXCJiXCI6IDE3MyB9LCBcImhleFwiOiBcIiNmZmRlYWRcIn0sXG4gICAgXCJuYXZ5XCI6IHtcImhzbFwiOiB7XCJoXCI6IDE3OCxcInNcIjogNjAsXCJsXCI6IDU1IH0sIFwicmdiXCI6IHtcInJcIjogMCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzAwMDA4MFwifSxcbiAgICBcIm9sZGxhY2VcIjoge1wiaHNsXCI6IHtcImhcIjogMzIyLFwic1wiOiA4MSxcImxcIjogNDMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTMsXCJnXCI6IDI0NSxcImJcIjogMjMwIH0sIFwiaGV4XCI6IFwiI2ZkZjVlNlwifSxcbiAgICBcIm9saXZlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI0MCxcInNcIjogNjQsXCJsXCI6IDI3IH0sIFwicmdiXCI6IHtcInJcIjogMTI4LFwiZ1wiOiAxMjgsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjODA4MDAwXCJ9LFxuICAgIFwib2xpdmVkcmFiXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE1MCxcInNcIjogMTAwLFwibFwiOiA5OCB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNyxcImdcIjogMTQyLFwiYlwiOiAzNSB9LCBcImhleFwiOiBcIiM2YjhlMjNcIn0sXG4gICAgXCJvcmFuZ2VcIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogMTAwLFwibFwiOiA5NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMTY1LFwiYlwiOiAwIH0sIFwiaGV4XCI6IFwiI2ZmYTUwMFwifSxcbiAgICBcIm9yYW5nZXJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzOCxcInNcIjogMTAwLFwibFwiOiA4NSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogNjksXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmY0NTAwXCJ9LFxuICAgIFwib3JjaGlkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM2LFwic1wiOiAxMDAsXCJsXCI6IDg0IH0sIFwicmdiXCI6IHtcInJcIjogMjE4LFwiZ1wiOiAxMTIsXCJiXCI6IDIxNCB9LCBcImhleFwiOiBcIiNkYTcwZDZcIn0sXG4gICAgXCJwYWxlZ29sZGVucm9kXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA4NSxcImxcIjogOTUgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDIzMixcImJcIjogMTcwIH0sIFwiaGV4XCI6IFwiI2VlZThhYVwifSxcbiAgICBcInBhbGVncmVlblwiOiB7XCJoc2xcIjoge1wiaFwiOiA4MCxcInNcIjogNjAsXCJsXCI6IDM1IH0sIFwicmdiXCI6IHtcInJcIjogMTUyLFwiZ1wiOiAyNTEsXCJiXCI6IDE1MiB9LCBcImhleFwiOiBcIiM5OGZiOThcIn0sXG4gICAgXCJwYWxldHVycXVvaXNlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE2LFwic1wiOiAxMDAsXCJsXCI6IDUwIH0sIFwicmdiXCI6IHtcInJcIjogMTc1LFwiZ1wiOiAyMzgsXCJiXCI6IDIzOCB9LCBcImhleFwiOiBcIiNhZmVlZWVcIn0sXG4gICAgXCJwYWxldmlvbGV0cmVkXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMixcInNcIjogNTksXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjE5LFwiZ1wiOiAxMTIsXCJiXCI6IDE0NyB9LCBcImhleFwiOiBcIiNkYjcwOTNcIn0sXG4gICAgXCJwYXBheWF3aGlwXCI6IHtcImhzbFwiOiB7XCJoXCI6IDU1LFwic1wiOiA2NyxcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDIzOSxcImJcIjogMjEzIH0sIFwiaGV4XCI6IFwiI2ZmZWZkNVwifSxcbiAgICBcInBlYWNocHVmZlwiOiB7XCJoc2xcIjoge1wiaFwiOiAxMjAsXCJzXCI6IDkzLFwibFwiOiA3OSB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjE4LFwiYlwiOiAxODUgfSwgXCJoZXhcIjogXCIjZmZkYWI5XCJ9LFxuICAgIFwicGVydVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxODAsXCJzXCI6IDY1LFwibFwiOiA4MSB9LCBcInJnYlwiOiB7XCJyXCI6IDIwNSxcImdcIjogMTMzLFwiYlwiOiA2MyB9LCBcImhleFwiOiBcIiNjZDg1M2ZcIn0sXG4gICAgXCJwaW5rXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0MCxcInNcIjogNjAsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAxOTIsXCJiXCI6IDIwMyB9LCBcImhleFwiOiBcIiNmZmMwY2JcIn0sXG4gICAgXCJwbHVtXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM3LFwic1wiOiAxMDAsXCJsXCI6IDkyIH0sIFwicmdiXCI6IHtcInJcIjogMjIxLFwiZ1wiOiAxNjAsXCJiXCI6IDIyMSB9LCBcImhleFwiOiBcIiNkZGEwZGRcIn0sXG4gICAgXCJwb3dkZXJibHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI4LFwic1wiOiAxMDAsXCJsXCI6IDg2IH0sIFwicmdiXCI6IHtcInJcIjogMTc2LFwiZ1wiOiAyMjQsXCJiXCI6IDIzMCB9LCBcImhleFwiOiBcIiNiMGUwZTZcIn0sXG4gICAgXCJwdXJwbGVcIjoge1wiaHNsXCI6IHtcImhcIjogMzAsXCJzXCI6IDU5LFwibFwiOiA1MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEyOCxcImdcIjogMCxcImJcIjogMTI4IH0sIFwiaGV4XCI6IFwiIzgwMDA4MFwifSxcbiAgICBcInJlZFwiOiB7XCJoc2xcIjoge1wiaFwiOiAzNTAsXCJzXCI6IDEwMCxcImxcIjogODggfSwgXCJyZ2JcIjoge1wiclwiOiAyNTUsXCJnXCI6IDAsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmYwMDAwXCJ9LFxuICAgIFwicm9zeWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogNDcsXCJsXCI6IDc1IH0sIFwicmdiXCI6IHtcInJcIjogMTg4LFwiZ1wiOiAxNDMsXCJiXCI6IDE0MyB9LCBcImhleFwiOiBcIiNiYzhmOGZcIn0sXG4gICAgXCJyb3lhbGJsdWVcIjoge1wiaHNsXCI6IHtcImhcIjogMTg3LFwic1wiOiA1MixcImxcIjogODAgfSwgXCJyZ2JcIjoge1wiclwiOiA2NSxcImdcIjogMTA1LFwiYlwiOiAyMjUgfSwgXCJoZXhcIjogXCIjNDE2OWUxXCJ9LFxuICAgIFwic2FkZGxlYnJvd25cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMjUsXCJsXCI6IDY1IH0sIFwicmdiXCI6IHtcInJcIjogMTM5LFwiZ1wiOiA2OSxcImJcIjogMTkgfSwgXCJoZXhcIjogXCIjOGI0NTEzXCJ9LFxuICAgIFwic2FsbW9uXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIyNSxcInNcIjogNzMsXCJsXCI6IDU3IH0sIFwicmdiXCI6IHtcInJcIjogMjUwLFwiZ1wiOiAxMjgsXCJiXCI6IDExNCB9LCBcImhleFwiOiBcIiNmYTgwNzJcIn0sXG4gICAgXCJzYW5keWJyb3duXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiA3NixcImxcIjogMzEgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDQsXCJnXCI6IDE2NCxcImJcIjogOTYgfSwgXCJoZXhcIjogXCIjZjRhNDYwXCJ9LFxuICAgIFwic2VhZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogNixcInNcIjogOTMsXCJsXCI6IDcxIH0sIFwicmdiXCI6IHtcInJcIjogNDYsXCJnXCI6IDEzOSxcImJcIjogODcgfSwgXCJoZXhcIjogXCIjMmU4YjU3XCJ9LFxuICAgIFwic2Vhc2hlbGxcIjoge1wiaHNsXCI6IHtcImhcIjogMjgsXCJzXCI6IDg3LFwibFwiOiA2NyB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjQ1LFwiYlwiOiAyMzggfSwgXCJoZXhcIjogXCIjZmZmNWVlXCJ9LFxuICAgIFwic2llbm5hXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE0NixcInNcIjogNTAsXCJsXCI6IDM2IH0sIFwicmdiXCI6IHtcInJcIjogMTYwLFwiZ1wiOiA4MixcImJcIjogNDUgfSwgXCJoZXhcIjogXCIjYTA1MjJkXCJ9LFxuICAgIFwic2lsdmVyXCI6IHtcImhzbFwiOiB7XCJoXCI6IDI1LFwic1wiOiAxMDAsXCJsXCI6IDk3IH0sIFwicmdiXCI6IHtcInJcIjogMTkyLFwiZ1wiOiAxOTIsXCJiXCI6IDE5MiB9LCBcImhleFwiOiBcIiNjMGMwYzBcIn0sXG4gICAgXCJza3libHVlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDE5LFwic1wiOiA1NixcImxcIjogNDAgfSwgXCJyZ2JcIjoge1wiclwiOiAxMzUsXCJnXCI6IDIwNixcImJcIjogMjM1IH0sIFwiaGV4XCI6IFwiIzg3Y2VlYlwifSxcbiAgICBcInNsYXRlYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxOTcsXCJzXCI6IDcxLFwibFwiOiA3MyB9LCBcInJnYlwiOiB7XCJyXCI6IDEwNixcImdcIjogOTAsXCJiXCI6IDIwNSB9LCBcImhleFwiOiBcIiM2YTVhY2RcIn0sXG4gICAgXCJzbGF0ZWdyYXlcIjoge1wiaHNsXCI6IHtcImhcIjogMjQ4LFwic1wiOiA1MyxcImxcIjogNTggfSwgXCJyZ2JcIjoge1wiclwiOiAxMTIsXCJnXCI6IDEyOCxcImJcIjogMTQ0IH0sIFwiaGV4XCI6IFwiIzcwODA5MFwifSxcbiAgICBcInNsYXRlZ3JleVwiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDExMixcImdcIjogMTI4LFwiYlwiOiAxNDQgfSwgXCJoZXhcIjogXCIjNzA4MDkwXCJ9LFxuICAgIFwic25vd1wiOiB7XCJoc2xcIjoge1wiaFwiOiAyMTAsXCJzXCI6IDEzLFwibFwiOiA1MCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogMjUwLFwiYlwiOiAyNTAgfSwgXCJoZXhcIjogXCIjZmZmYWZhXCJ9LFxuICAgIFwic3ByaW5nZ3JlZW5cIjoge1wiaHNsXCI6IHtcImhcIjogMCxcInNcIjogMTAwLFwibFwiOiA5OSB9LCBcInJnYlwiOiB7XCJyXCI6IDAsXCJnXCI6IDI1NSxcImJcIjogMTI3IH0sIFwiaGV4XCI6IFwiIzAwZmY3ZlwifSxcbiAgICBcInN0ZWVsYmx1ZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNTAsXCJzXCI6IDEwMCxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiA3MCxcImdcIjogMTMwLFwiYlwiOiAxODAgfSwgXCJoZXhcIjogXCIjNDY4MmI0XCJ9LFxuICAgIFwidGFuXCI6IHtcImhzbFwiOiB7XCJoXCI6IDIwNyxcInNcIjogNDQsXCJsXCI6IDQ5IH0sIFwicmdiXCI6IHtcInJcIjogMjEwLFwiZ1wiOiAxODAsXCJiXCI6IDE0MCB9LCBcImhleFwiOiBcIiNkMmI0OGNcIn0sXG4gICAgXCJ0ZWFsXCI6IHtcImhzbFwiOiB7XCJoXCI6IDM0LFwic1wiOiA0NCxcImxcIjogNjkgfSwgXCJyZ2JcIjoge1wiclwiOiAwLFwiZ1wiOiAxMjgsXCJiXCI6IDEyOCB9LCBcImhleFwiOiBcIiMwMDgwODBcIn0sXG4gICAgXCJ0aGlzdGxlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDMwMCxcInNcIjogMjQsXCJsXCI6IDgwIH0sIFwicmdiXCI6IHtcInJcIjogMjE2LFwiZ1wiOiAxOTEsXCJiXCI6IDIxNiB9LCBcImhleFwiOiBcIiNkOGJmZDhcIn0sXG4gICAgXCJ0b21hdG9cIjoge1wiaHNsXCI6IHtcImhcIjogOSxcInNcIjogMTAwLFwibFwiOiA2NCB9LCBcInJnYlwiOiB7XCJyXCI6IDI1NSxcImdcIjogOTksXCJiXCI6IDcxIH0sIFwiaGV4XCI6IFwiI2ZmNjM0N1wifSxcbiAgICBcInR1cnF1b2lzZVwiOiB7XCJoc2xcIjoge1wiaFwiOiAxNzQsXCJzXCI6IDcyLFwibFwiOiA1NiB9LCBcInJnYlwiOiB7XCJyXCI6IDY0LFwiZ1wiOiAyMjQsXCJiXCI6IDIwOCB9LCBcImhleFwiOiBcIiM0MGUwZDBcIn0sXG4gICAgXCJ2aW9sZXRcIjoge1wiaHNsXCI6IHtcImhcIjogMzAwLFwic1wiOiA3NixcImxcIjogNzIgfSwgXCJyZ2JcIjoge1wiclwiOiAyMzgsXCJnXCI6IDEzMCxcImJcIjogMjM4IH0sIFwiaGV4XCI6IFwiI2VlODJlZVwifSxcbiAgICBcIndoZWF0XCI6IHtcImhzbFwiOiB7XCJoXCI6IDM5LFwic1wiOiA3NyxcImxcIjogODMgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDIyMixcImJcIjogMTc5IH0sIFwiaGV4XCI6IFwiI2Y1ZGViM1wifSxcbiAgICBcIndoaXRlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDAsXCJzXCI6IDAsXCJsXCI6IDk2IH0sIFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDI1NSB9LCBcImhleFwiOiBcIiNmZmZmZmZcIn0sXG4gICAgXCJ3aGl0ZXNtb2tlXCI6IHtcImhzbFwiOiB7XCJoXCI6IDgwLFwic1wiOiA2MSxcImxcIjogNTAgfSwgXCJyZ2JcIjoge1wiclwiOiAyNDUsXCJnXCI6IDI0NSxcImJcIjogMjQ1IH0sIFwiaGV4XCI6IFwiI2Y1ZjVmNVwifSxcInllbGxvd1wiOiB7IFwicmdiXCI6IHtcInJcIjogMjU1LFwiZ1wiOiAyNTUsXCJiXCI6IDAgfSwgXCJoZXhcIjogXCIjZmZmZjAwXCJ9LFwieWVsbG93Z3JlZW5cIjogeyBcInJnYlwiOiB7XCJyXCI6IDE1NCxcImdcIjogMjA1LFwiYlwiOiA1MCB9LCBcImhleFwiOiBcIiM5YWNkMzJcIn1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuYW1lZGNvbG9yczsiLCJ2YXIgQ2FtZXJhID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9jYW1lcmEuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnQ2FtZXJhJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgY2FtZXJhO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGNhbWVyYSA9IG5ldyBDYW1lcmEoNjAwLCA0MDApO1xuICAgIH0pXG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdoZWlnaHQnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGNhbWVyYS5oZWlnaHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGNhbWVyYS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcblxuICAgIH0pO1xufSk7IiwidmFyIFNjZW5lID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VuZ2luZS9zY2VuZS5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdTY2VuZScsIGZ1bmN0aW9uKCl7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgLy92YXIgc2NlbmUgPSBuZXcgU2NlbmUoe2NhbnZhc19pZDogJ3dpcmVmcmFtZScsIHdpZHRoOjYwMCwgaGVpZ2h0OjQwMH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdwcm9wZXJ0aWVzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnaGVpZ2h0JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIGFzc2VydC5lcXVhbChzY2VuZS5oZWlnaHQsIDQwMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgXG4gICAgfSlcbn0pOyIsInZhciBGYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL2dlb21ldHJ5L2ZhY2UuanMnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG52YXIgZmFjZTtcblxuc3VpdGUoJ0ZhY2UnLCBmdW5jdGlvbigpe1xuICAgIHZhciBmYWNlO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIGZhY2UgPSBuZXcgRmFjZSgwLCAxLCAyLCBcInJlZFwiKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ3ZlcnRpY2VzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmYWNlLmZhY2VbMF0sIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGZhY2UuZmFjZVsxXSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZmFjZS5mYWNlWzJdLCAyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2NvbG9yJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChmYWNlLmNvbG9yLnJnYi5yLCAyNTUpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pOyIsInZhciBNZXNoID0gcmVxdWlyZSgnLi4vLi4vc3JjL2dlb21ldHJ5L21lc2guanMnKTtcbnZhciBGYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL2dlb21ldHJ5L2ZhY2UuanMnKTtcbnZhciBWZWN0b3IgPSByZXF1aXJlKCdsaW5lYXJhbGdlYScpLlZlY3RvcjtcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xuXG5zdWl0ZSgnTWVzaCcsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIG1lc2g7XG4gICAgc2V0dXAoZnVuY3Rpb24oKXtcbiAgICAgICAgbWVzaCA9IG5ldyBNZXNoKCd0cmlhbmdsZScsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigxLDAsMCksXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigwLDEsMCksXG4gICAgICAgICAgICAgICAgbmV3IFZlY3RvcigwLDAsMSlcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbmV3IEZhY2UoMCwgMSwgMiwgJ3JlZCcpXG4gICAgICAgICAgICBdKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ25hbWUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gubmFtZSwgJ3RyaWFuZ2xlJyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZXJ0aWNlcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1swXS54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzBdLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMF0ueiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1sxXS54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzFdLnksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMV0ueiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1syXS54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzJdLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMl0ueiwgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdmYWNlcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5mYWNlc1swXS5mYWNlWzBdLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLmZhY2VzWzBdLmZhY2VbMV0sIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guZmFjZXNbMF0uZmFjZVsyXSwgMik7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdwb3NpdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5wb3NpdGlvbi54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnBvc2l0aW9uLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucG9zaXRpb24ueiwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5yb3RhdGlvbi5waXRjaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5yb3RhdGlvbi55YXcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucm90YXRpb24ucm9sbCwgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5zY2FsZS54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnNjYWxlLnksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guc2NhbGUueiwgMSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnZnJvbUpTT04nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIGpzb24gPSBNZXNoLmZyb21KU09OKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJ25hbWUnOiAndHJpYW5nbGUnLFxuICAgICAgICAgICAgICAgICAgICAndmVydGljZXMnOltcbiAgICAgICAgICAgICAgICAgICAgICAgIFsxLDAsMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMCwxLDBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzAsMCwxXVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAnZmFjZXMnOltcbiAgICAgICAgICAgICAgICAgICAgICAgIHsnZmFjZSc6IFswLCAxLCAyXSwgJ2NvbG9yJzogJ3JlZCd9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzBdLngsIGpzb24udmVydGljZXNbMF0ueCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1swXS55LCBqc29uLnZlcnRpY2VzWzBdLnkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMF0ueiwganNvbi52ZXJ0aWNlc1swXS56KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzFdLngsIGpzb24udmVydGljZXNbMV0ueCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1sxXS55LCBqc29uLnZlcnRpY2VzWzFdLnkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMV0ueiwganNvbi52ZXJ0aWNlc1sxXS56KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnZlcnRpY2VzWzJdLngsIGpzb24udmVydGljZXNbMl0ueCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC52ZXJ0aWNlc1syXS55LCBqc29uLnZlcnRpY2VzWzJdLnkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gudmVydGljZXNbMl0ueiwganNvbi52ZXJ0aWNlc1syXS56KTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guZmFjZXNbMF0uZmFjZVswXSwganNvbi5mYWNlc1swXS5mYWNlWzBdKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLmZhY2VzWzBdLmZhY2VbMV0sIGpzb24uZmFjZXNbMF0uZmFjZVsxXSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5mYWNlc1swXS5mYWNlWzJdLCBqc29uLmZhY2VzWzBdLmZhY2VbMl0pO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5wb3NpdGlvbi54LCBqc29uLnBvc2l0aW9uLngpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucG9zaXRpb24ueSwganNvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnBvc2l0aW9uLnosIGpzb24ucG9zaXRpb24ueik7XG4gICAgIFxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucm90YXRpb24ucGl0Y2gsIGpzb24ucm90YXRpb24ucGl0Y2gpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2gucm90YXRpb24ueWF3LCBqc29uLnJvdGF0aW9uLnlhdyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5yb3RhdGlvbi5yb2xsLCBqc29uLnJvdGF0aW9uLnJvbGwpO1xuICAgICAgICBcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtZXNoLnNjYWxlLngsIG1lc2guc2NhbGUueCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobWVzaC5zY2FsZS55LCBtZXNoLnNjYWxlLnkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1lc2guc2NhbGUueiwgbWVzaC5zY2FsZS56KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTsiLCJmdW5jdGlvbiBuZWFybHlFcXVhbChhLCBiLCBlcHMpe1xuICAgIGlmICh0eXBlb2YgZXBzID09PSBcInVuZGVmaW5lZFwiKSB7ZXBzID0gMC4wMTt9XG4gICAgdmFyIGRpZmYgPSBNYXRoLmFicyhhIC0gYik7XG4gICAgcmV0dXJuIChkaWZmIDwgZXBzKTtcbn1cblxudmFyIGhlbHBlcnMgPSBuZXcgT2JqZWN0KG51bGwpO1xuXG5oZWxwZXJzLm5lYXJseUVxdWFsID0gbmVhcmx5RXF1YWw7XG5cbm1vZHVsZS5leHBvcnRzID0gaGVscGVyczsiLCJ2YXIgQ29sb3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbGl0aWVzL2NvbG9yLmpzJyk7XG52YXIgbmFtZWQgPSByZXF1aXJlKCcuLi9kYXRhL2NvbG9ycy5qcycpO1xudmFyIG5lYXJseUVxdWFsID0gcmVxdWlyZSgnLi4vaGVscGVycy5qcycpWyduZWFybHlFcXVhbCddO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdDb2xvcicsIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHJlZCwgZ3JlZW4sIGJsdWUsIHJnYiwgcmdiYSwgaHNsLCBoc2xhO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIHJlZCA9IG5ldyBDb2xvcihcInJlZFwiKTtcbiAgICAgICAgZ3JlZW4gPSBuZXcgQ29sb3IoXCIjMEYwXCIpOyAvLyBOYW1lZCBjb2xvciAnZ3JlZW4nIGlzIHJnYigwLDEyOCwwKVxuICAgICAgICBibHVlID0gbmV3IENvbG9yKFwiYmx1ZVwiKTtcbiAgICAgICAgcmdiID0gbmV3IENvbG9yKFwicmdiKDEsIDcsIDI5KVwiKTtcbiAgICAgICAgcmdiYSA9IG5ldyBDb2xvcihcInJnYmEoMSwgNywgMjksIDAuMylcIik7XG4gICAgICAgIGhzbCA9IG5ldyBDb2xvcihcImhzbCgwLCAxMDAlLCA1MCUpXCIpO1xuICAgICAgICBoc2xhID0gbmV3IENvbG9yKFwiaHNsYSgwLCAxMDAlLCA1MCUsIDAuMylcIik7XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdyZ2InLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZWQucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiLnJnYi5yLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZ2IucmdiLmcsIDcpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5yZ2IuYiwgMjkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJnYi5hbHBoYSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYS5yZ2IuciwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYS5yZ2IuZywgNyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmdiYS5yZ2IuYiwgMjkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJnYmEuYWxwaGEsIDAuMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgY29sb3IgaW4gbmFtZWQpe1xuICAgICAgICAgICAgICAgIGlmIChuYW1lZC5oYXNPd25Qcm9wZXJ0eShjb2xvcikpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBDb2xvcihjb2xvcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZXggPSBuZXcgQ29sb3IobmFtZWRbY29sb3JdLmhleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lZF9yZ2IgPSBuYW1lZFtjb2xvcl0ucmdiO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuciwgaGV4LnJnYi5yKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmcsIGhleC5yZ2IuZyk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5iLCBoZXgucmdiLmIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuciwgbmFtZWRfcmdiLnIpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuZywgbmFtZWRfcmdiLmcpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IuYiwgbmFtZWRfcmdiLmIpO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdoc2wnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wuaCwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVkLmhzbC5zLCAxMDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlZC5oc2wubCwgNTApO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2wuaHNsLnMsIDEwMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaHNsLmhzbC5sLCA1MCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoaHNsLmFscGhhLCAxKSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2xhLmhzbC5oLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChoc2xhLmhzbC5zLCAxMDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGhzbGEuaHNsLmwsIDUwKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChoc2xhLmFscGhhLCAwLjMpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGNvbG9yIGluIG5hbWVkKXtcbiAgICAgICAgICAgICAgICBpZiAobmFtZWQuaGFzT3duUHJvcGVydHkoY29sb3IpKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBuZXcgQ29sb3IoY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGV4ID0gbmV3IENvbG9yKG5hbWVkW2NvbG9yXS5oZXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZWRfaHNsID0gbmFtZWRbY29sb3JdLnJnYjtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmgsIGhleC5yZ2IuaCk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChuYW1lLnJnYi5zLCBoZXgucmdiLnMpO1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobmFtZS5yZ2IubCwgaGV4LnJnYi5sKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmgsIG5hbWVkX2hzbC5oKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLnMsIG5hbWVkX2hzbC5zKTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG5hbWUucmdiLmwsIG5hbWVkX2hzbC5sKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhbHBoYScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVkLmFscGhhLCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmdiYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoaHNsYS5hbHBoYSwgMC4zKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnbGlnaHRlbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQubGlnaHRlbigxMCk7XG4gICAgICAgICAgICB2YXIgcjIgPSByZWQubGlnaHRlbigyMCk7XG4gICAgICAgICAgICB2YXIgcjMgPSByZWQubGlnaHRlbig1MCk7XG4gICAgICAgICAgICB2YXIgZzEgPSBncmVlbi5saWdodGVuKDEwKTtcbiAgICAgICAgICAgIHZhciBnMiA9IGdyZWVuLmxpZ2h0ZW4oMjApO1xuICAgICAgICAgICAgdmFyIGczID0gZ3JlZW4ubGlnaHRlbig1MCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLmxpZ2h0ZW4oMTApO1xuICAgICAgICAgICAgdmFyIGIyID0gYmx1ZS5saWdodGVuKDIwKTtcbiAgICAgICAgICAgIHZhciBiMyA9IGJsdWUubGlnaHRlbig1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuciwgMjU1KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuZywgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIxLnJnYi5iLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmcsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjIucmdiLmIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuciwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5nLCAyNTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcxLnJnYi5iLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLnIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzIucmdiLmIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuciwgNTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5nLCA1MSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLnIsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmcsIDEwMik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLnIsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmcsIDI1NSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLmIsIDI1NSk7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2RhcmtlbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcjEgPSByZWQuZGFya2VuKDEwKTtcbiAgICAgICAgICAgIHZhciByMiA9IHJlZC5kYXJrZW4oMjApO1xuICAgICAgICAgICAgdmFyIHIzID0gcmVkLmRhcmtlbig1MCk7XG4gICAgICAgICAgICB2YXIgZzEgPSBncmVlbi5kYXJrZW4oMTApO1xuICAgICAgICAgICAgdmFyIGcyID0gZ3JlZW4uZGFya2VuKDIwKTtcbiAgICAgICAgICAgIHZhciBnMyA9IGdyZWVuLmRhcmtlbig1MCk7XG4gICAgICAgICAgICB2YXIgYjEgPSBibHVlLmRhcmtlbigxMCk7XG4gICAgICAgICAgICB2YXIgYjIgPSBibHVlLmRhcmtlbigyMCk7XG4gICAgICAgICAgICB2YXIgYjMgPSBibHVlLmRhcmtlbig1MCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuciwgMjA0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMS5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjEucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5yLCAxNTMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIyLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMi5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocjMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHIzLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyMy5yZ2IuYiwgMCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMS5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmcsIDIwNCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzEucmdiLmIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGcyLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuZywgMTUzKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMi5yZ2IuYiwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZzMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGczLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChnMy5yZ2IuYiwgMCk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMS5yZ2IuciwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjEucmdiLmcsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIxLnJnYi5iLCAyMDQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIyLnJnYi5yLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMi5yZ2IuZywgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjIucmdiLmIsIDE1Myk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoYjMucmdiLnIsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGIzLnJnYi5nLCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChiMy5yZ2IuYiwgMCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7Il19
(14)
});
