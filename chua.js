// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (ENVIRONMENT_IS_WEB) {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
    this['Module'] = Module;
  } else if (ENVIRONMENT_IS_WORKER) {
    // We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 536870912;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addOnPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 93632;
var _stdout;
var _stdin;
var _stderr;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });
var ___fsmu8;
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt12out_of_rangeD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
var _stdout = _stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin = _stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,64,241,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,80,241,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([216,149,0,0,248,146,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,0,0,0,0,0,0,0,0,0,0,0,40,54,120,44,2,73,110,32,97,98,111,118,101,44,32,32,82,49,32,61,2,44,101,50,49,46,49,51,44,51,120,44,2,82,50,32,61,2,44,101,50,49,46,49,51,41,0,0,40,54,120,44,2,73,110,32,97,98,111,118,101,32,109,101,115,115,97,103,101,44,32,32,82,49,32,61,2,44,101,50,49,46,49,51,41,0,0,0,40,54,120,44,2,73,110,32,97,98,111,118,101,32,109,101,115,115,97,103,101,44,32,32,73,49,32,61,2,44,105,49,48,44,51,120,44,2,73,50,32,61,2,44,105,49,48,41,0,0,0,0,0,0,0,0,40,54,120,44,2,73,110,32,97,98,111,118,101,32,109,101,115,115,97,103,101,44,32,32,73,49,32,61,2,44,105,49,48,41,0,0,0,0,0,0,40,49,120,44,56,48,97,49,41,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,0,0,0,0,0,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,14,0,0,0,24,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,23,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,0,0,0,0,0,0,0,0,0,1,1,96,0,0,0,94,0,0,0,52,0,0,0,10,0,0,0,12,0,0,0,52,0,0,0,2,0,0,0,50,0,0,0,46,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,14,0,0,0,24,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,22,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,0,0,0,0,0,0,0,0,0,1,1,96,0,0,0,94,0,0,0,52,0,0,0,10,0,0,0,12,0,0,0,52,0,0,0,2,0,0,0,50,0,0,0,46,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,83,1,0,0,0,0,0,187,189,215,217,223,124,219,61,0,0,0,0,8,149,0,0,176,146,0,0,64,93,1,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,24,84,1,0,0,0,0,0,0,0,0,0,0,0,0,0,97,110,97,108,121,116,105,99,97,108,32,106,97,99,111,98,105,97,110,0,0,0,0,0,67,97,108,117,99,117,108,97,116,101,32,111,110,101,32,99,111,108,58,0,0,0,0,0,60,47,115,116,97,116,117,115,62,0,0,0,0,0,0,0,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,0,0,0,0,0,0,60,115,116,97,116,117,115,62,0,0,0,0,0,0,0,0,60,112,104,97,115,101,62,85,78,75,78,79,87,78,60,47,112,104,97,115,101,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,22,0,0,0,22,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,63,0,0,0,0,0,0,224,63,0,0,0,0,0,0,240,63,32,85,1,0,0,0,0,0,168,85,1,0,0,0,0,0,48,86,1,0,0,0,0,0,184,86,1,0,0,0,0,0,216,149,0,0,248,146,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,51,0,0,0,51,0,0,0,51,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,112,162,0,0,32,135,0,0,48,112,0,0,136,97,0,0,184,83,0,0,64,76,0,0,8,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,67,68,65,84,65,91,0,0,2,3,4,5,6,7,8,0,0,9,10,11,12,13,14,15,16,17,0,0,0,0,0,0,0,0,0,0,0,0,18,19,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,23,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,64,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,248,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,64,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,144,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,216,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,224,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,56,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,144,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,47,52,120,44,2,65,116,32,116,104,101,32,114,101,116,117,114,110,32,102,114,111,109,32,78,69,87,85,79,65,2,44,53,120,44,2,78,117,109,98,101,114,32,111,102,32,102,117,110,99,116,105,111,110,32,118,97,108,117,101,115,32,61,2,44,105,54,41,0,0,0,40,52,120,44,2,76,101,97,115,116,32,118,97,108,117,101,32,111,102,32,70,32,61,2,44,49,112,100,50,51,46,49,53,44,57,120,44,2,84,104,101,32,99,111,114,114,101,115,112,111,110,100,105,110,103,32,88,32,105,115,58,2,47,40,50,120,44,53,100,49,53,46,54,41,41,0,0,0,0,0,40,47,52,120,44,2,78,101,119,32,82,72,79,32,61,2,44,49,112,100,49,49,46,52,44,53,120,44,2,78,117,109,98,101,114,32,111,102,2,44,2,32,102,117,110,99,116,105,111,110,32,118,97,108,117,101,115,32,61,2,44,105,54,41,0,0,0,0,0,0,0,0,40,53,120,41,0,0,0,0,40,47,52,120,44,2,82,101,116,117,114,110,32,102,114,111,109,32,78,69,87,85,79,65,32,98,101,99,97,117,115,101,32,97,32,116,114,117,115,116,2,44,2,32,114,101,103,105,111,110,32,115,116,101,112,32,104,97,115,32,102,97,105,108,101,100,32,116,111,32,114,101,100,117,99,101,32,81,46,2,41,0,0,0,0,0,0,0,40,47,52,120,44,2,70,117,110,99,116,105,111,110,32,110,117,109,98,101,114,2,44,105,54,44,2,32,32,32,32,70,32,61,2,44,49,112,100,49,56,46,49,48,44,2,32,32,32,32,84,104,101,32,99,111,114,114,101,115,112,111,110,100,105,110,103,32,88,32,105,115,58,2,47,40,50,120,44,53,100,49,53,46,54,41,41,0,40,47,52,120,44,2,82,101,116,117,114,110,32,102,114,111,109,32,78,69,87,85,79,65,32,98,101,99,97,117,115,101,32,67,65,76,70,85,78,32,104,97,115,32,98,101,101,110,2,44,2,32,99,97,108,108,101,100,32,77,65,88,70,85,78,32,116,105,109,101,115,46,2,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,136,12,0,0,0,0,0,0,0,0,0,0,40,47,52,120,44,2,82,101,116,117,114,110,32,102,114,111,109,32,78,69,87,85,79,65,32,98,101,99,97,117,115,101,32,78,80,84,32,105,115,32,110,111,116,32,105,110,2,44,2,32,116,104,101,32,114,101,113,117,105,114,101,100,32,105,110,116,101,114,118,97,108,2,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,47,41,0,0,0,0,0,40,49,120,44,54,103,49,51,46,53,41,0,0,0,0,0,40,47,2,32,65,32,102,117,114,116,104,101,114,2,44,105,52,44,2,32,102,117,110,99,116,105,111,110,32,101,118,97,108,117,97,116,105,111,110,115,32,104,97,118,101,32,98,101,101,110,32,117,115,101,100,2,47,41,0,0,0,0,0,0,40,47,47,2,32,67,79,82,82,69,76,65,84,73,79,78,32,77,65,84,82,73,88,58,45,2,41,0,0,0,0,0,40,2,32,73,78,70,79,82,77,65,84,73,79,78,32,77,65,84,82,73,88,58,45,2,47,41,0,0,0,0,0,0,40,47,2,32,73,102,32,116,104,101,32,102,117,110,99,116,105,111,110,32,109,105,110,105,109,105,122,101,100,32,119,97,115,32,45,76,79,71,40,76,73,75,69,76,73,72,79,79,68,41,44,2,47,2,32,116,104,105,115,32,105,115,32,116,104,101,32,99,111,118,97,114,105,97,110,99,101,32,109,97,116,114,105,120,32,111,102,32,116,104,101,32,112,97,114,97,109,101,116,101,114,115,46,2,47,2,32,73,102,32,116,104,101,32,102,117,110,99,116,105,111,110,32,119,97,115,32,97,32,115,117,109,32,111,102,32,115,113,117,97,114,101,115,32,111,102,32,114,101,115,105,100,117,97,108,115,44,2,47,2,32,116,104,105,115,32,109,97,116,114,105,120,32,109,117,115,116,32,98,101,32,109,117,108,116,105,112,108,105,101,100,32,98,121,32,116,119,105,99,101,32,116,104,101,32,101,115,116,105,109,97,116,101,100,2,44,49,120,44,2,114,101,115,105,100,117,97,108,32,118,97,114,105,97,110,99,101,2,47,2,32,116,111,32,111,98,116,97,105,110,32,116,104,101,32,99,111,118,97,114,105,97,110,99,101,32,109,97,116,114,105,120,46,2,47,41,0,0,0,0,40,2,32,82,97,110,107,32,111,102,32,105,110,102,111,114,109,97,116,105,111,110,32,109,97,116,114,105,120,32,61,2,44,105,51,47,2,32,73,110,118,101,114,115,101,32,111,102,32,105,110,102,111,114,109,97,116,105,111,110,32,109,97,116,114,105,120,58,45,2,41,0,40,2,32,73,70,32,84,72,73,83,32,68,73,70,70,69,82,83,32,66,89,32,77,85,67,72,32,70,82,79,77,32,84,72,69,32,77,73,78,73,77,85,77,32,69,83,84,73,77,65,84,69,68,2,44,49,120,44,2,70,82,79,77,32,84,72,69,32,77,73,78,73,77,73,90,65,84,73,79,78,44,2,47,2,32,84,72,69,32,77,73,78,73,77,85,77,32,77,65,89,32,66,69,32,70,65,76,83,69,32,38,47,79,82,32,84,72,69,32,73,78,70,79,82,77,65,84,73,79,78,32,77,65,84,82,73,88,32,77,65,89,32,66,69,2,44,49,120,44,2,73,78,65,67,67,85,82,65,84,69,2,47,41,0,0,0,0,0,40,2,32,77,105,110,105,109,117,109,32,111,102,32,113,117,97,100,114,97,116,105,99,32,115,117,114,102,97,99,101,32,61,2,44,103,49,52,46,54,44,2,32,97,116,2,44,52,40,47,49,120,44,54,103,49,51,46,53,41,41,0,0,0,40,47,49,48,120,44,2,83,101,97,114,99,104,32,114,101,115,116,97,114,116,105,110,103,2,47,41,0,0,0,0,0,40,47,2,32,77,65,84,82,73,88,32,79,70,32,69,83,84,73,77,65,84,69,68,32,83,69,67,79,78,68,32,68,69,82,73,86,65,84,73,86,69,83,32,78,79,84,32,43,86,69,32,68,69,70,78,46,2,47,2,32,77,73,78,73,77,85,77,32,80,82,79,66,65,66,76,89,32,78,79,84,32,70,79,85,78,68,2,47,41,0,0,0,0,0,0,0,40,47,2,32,70,105,116,116,105,110,103,32,113,117,97,100,114,97,116,105,99,32,115,117,114,102,97,99,101,32,97,98,111,117,116,32,115,117,112,112,111,115,101,100,32,109,105,110,105,109,117,109,2,47,41,0,40,2,32,70,117,110,99,116,105,111,110,32,118,97,108,117,101,32,97,116,32,109,105,110,105,109,117,109,32,61,2,44,103,49,52,46,54,41,0,0,40,2,32,77,105,110,105,109,117,109,32,97,116,2,44,52,40,47,49,120,44,54,103,49,51,46,54,41,41,0,0,0,40,47,47,2,32,77,105,110,105,109,117,109,32,102,111,117,110,100,32,97,102,116,101,114,2,44,105,53,44,2,32,102,117,110,99,116,105,111,110,32,101,118,97,108,117,97,116,105,111,110,115,2,41,0,0,0,40,47,2,32,69,86,73,68,69,78,67,69,32,79,70,32,67,79,78,86,69,82,71,69,78,67,69,2,41,0,0,0,40,2,32,70,117,110,99,116,105,111,110,32,118,97,108,117,101,32,97,116,32,99,101,110,116,114,111,105,100,32,61,2,44,103,49,52,46,54,41,0,40,2,32,67,101,110,116,114,111,105,100,32,111,102,32,108,97,115,116,32,115,105,109,112,108,101,120,32,61,2,44,52,40,47,49,120,44,54,103,49,51,46,53,41,41,0,0,0,40,2,32,82,77,83,32,111,102,32,102,117,110,99,116,105,111,110,32,118,97,108,117,101,115,32,111,102,32,108,97,115,116,32,115,105,109,112,108,101,120,32,61,2,44,103,49,52,46,54,41,0,0,0,0,0,40,2,32,78,111,46,32,111,102,32,102,117,110,99,116,105,111,110,32,101,118,97,108,117,97,116,105,111,110,115,32,62,32,2,44,105,53,41,0,0,40,47,49,120,44,105,52,44,50,120,44,103,49,50,46,53,44,50,120,44,53,103,49,49,46,52,44,51,40,47,50,49,120,44,53,103,49,49,46,52,41,41,0,0,0,0,0,0,40,2,32,80,114,111,103,114,101,115,115,32,82,101,112,111,114,116,32,101,118,101,114,121,2,44,105,52,44,2,32,102,117,110,99,116,105,111,110,32,101,118,97,108,117,97,116,105,111,110,115,2,47,44,2,32,69,86,65,76,46,32,32,32,70,85,78,67,46,86,65,76,85,69,46,2,44,49,48,120,44,2,80,65,82,65,77,69,84,69,82,32,86,65,76,85,69,83,2,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,4,254,255,255,135,254,255,255,7,0,0,0,0,0,0,0,0,255,255,127,255,255,255,127,255,255,255,255,255,255,255,243,127,254,253,255,255,255,255,255,127,255,255,255,255,255,255,255,255,15,224,255,255,255,255,49,252,255,255,255,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,1,0,248,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,215,255,255,251,255,255,255,255,127,127,84,253,255,15,0,254,223,255,255,255,255,255,255,255,255,254,223,255,255,255,255,3,0,255,255,255,255,255,255,159,25,255,255,255,207,63,3,0,0,0,0,0,0,254,255,255,255,127,2,254,255,255,255,127,0,0,0,0,0,0,0,0,0,255,255,255,7,7,0,0,0,0,0,254,255,255,7,254,7,0,0,0,0,254,255,255,255,255,255,255,255,255,124,255,127,47,0,96,0,0,0,224,255,255,255,255,255,255,35,0,0,0,255,3,0,0,0,224,159,249,255,255,253,197,3,0,0,0,176,3,0,3,0,224,135,249,255,255,253,109,3,0,0,0,94,0,0,28,0,224,175,251,255,255,253,237,35,0,0,0,0,1,0,0,0,224,159,249,255,255,253,205,35,0,0,0,176,3,0,0,0,224,199,61,214,24,199,191,3,0,0,0,0,0,0,0,0,224,223,253,255,255,253,239,3,0,0,0,0,3,0,0,0,224,223,253,255,255,253,239,3,0,0,0,64,3,0,0,0,224,223,253,255,255,253,255,3,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,255,255,255,255,127,13,0,63,0,0,0,0,0,0,0,150,37,240,254,174,108,13,32,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,254,255,255,255,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,63,0,255,255,255,255,127,0,237,218,7,0,0,0,0,80,1,80,49,130,171,98,44,0,0,0,0,64,0,201,128,245,7,0,0,0,0,8,1,2,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,15,255,255,255,255,255,255,255,255,255,255,255,3,255,255,63,63,255,255,255,255,63,63,255,170,255,255,255,63,255,255,255,255,255,255,223,95,220,31,207,15,255,31,220,31,0,0,0,0,64,76,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,0,254,3,0,0,254,255,255,255,255,255,255,255,255,255,31,0,254,255,255,255,255,255,255,255,255,255,255,7,224,255,255,255,255,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,63,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,255,7,254,255,255,135,254,255,255,7,0,0,0,0,0,0,128,0,255,255,127,255,255,255,127,255,255,255,255,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,1,0,248,3,0,3,0,0,0,0,0,255,255,255,255,255,255,255,255,63,0,0,0,3,0,0,0,192,215,255,255,251,255,255,255,255,127,127,84,253,255,15,0,254,223,255,255,255,255,255,255,255,255,254,223,255,255,255,255,123,0,255,255,255,255,255,255,159,25,255,255,255,207,63,3,0,0,0,0,0,0,254,255,255,255,127,2,254,255,255,255,127,0,254,255,251,255,255,187,22,0,255,255,255,7,7,0,0,0,0,0,254,255,255,7,255,255,7,0,255,3,255,255,255,255,255,255,255,255,255,124,255,127,239,255,255,61,255,3,238,255,255,255,255,255,255,243,255,63,30,255,207,255,0,0,238,159,249,255,255,253,197,211,159,57,128,176,207,255,3,0,228,135,249,255,255,253,109,211,135,57,0,94,192,255,31,0,238,175,251,255,255,253,237,243,191,59,0,0,193,255,0,0,238,159,249,255,255,253,205,243,143,57,192,176,195,255,0,0,236,199,61,214,24,199,191,195,199,61,128,0,128,255,0,0,238,223,253,255,255,253,239,195,223,61,96,0,195,255,0,0,236,223,253,255,255,253,239,195,223,61,96,64,195,255,0,0,236,223,253,255,255,253,255,195,207,61,128,0,195,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,255,255,255,255,127,255,7,255,127,255,3,0,0,0,0,150,37,240,254,174,108,255,59,95,63,255,3,0,0,0,0,0,0,0,3,255,3,160,194,255,254,255,255,255,3,254,255,223,15,191,254,255,63,254,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,31,2,0,0,0,160,0,0,0,254,255,62,0,254,255,255,255,255,255,255,255,255,255,31,102,254,255,255,255,255,255,255,255,255,255,255,119,25,3,26,27,28,29,30,0,0,31,32,33,34,35,36,37,16,17,0,0,0,0,0,0,0,0,0,0,0,0,18,19,38,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,39,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,23,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,87,1,0,0,0,0,0,0,0,0,0,0,0,0,0,67,68,65,84,65,91,0,0,44,0,0,0,18,0,0,0,60,0,0,0,52,0,0,0,70,0,0,0,90,0,0,0,20,0,0,0,12,0,0,0,92,0,0,0,98,0,0,0,20,0,0,0,84,0,0,0,26,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,23,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,22,28,28,28,28,28,28,28,28,28,28,22,28,26,28,28,22,28,28,28,28,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,0,0,0,18,0,0,0,60,0,0,0,52,0,0,0,70,0,0,0,90,0,0,0,20,0,0,0,12,0,0,0,92,0,0,0,98,0,0,0,20,0,0,0,84,0,0,0,26,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,22,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,22,28,28,28,28,28,28,28,28,28,28,22,28,26,28,28,22,28,28,28,28,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,142,0,0,0,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,22,0,0,0,18,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,23,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,22,28,28,28,28,28,28,28,28,28,28,22,28,26,28,28,22,28,28,28,28,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,22,0,0,0,18,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,22,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,22,28,28,28,28,28,28,28,28,28,28,22,28,26,28,28,22,28,28,28,28,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,14,0,0,0,24,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,23,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,0,0,0,0,0,0,0,0,0,1,1,96,0,0,0,94,0,0,0,52,0,0,0,10,0,0,0,12,0,0,0,52,0,0,0,2,0,0,0,50,0,0,0,46,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,14,0,0,0,24,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,22,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,0,0,0,0,0,0,0,0,0,1,1,96,0,0,0,94,0,0,0,52,0,0,0,10,0,0,0,12,0,0,0,52,0,0,0,2,0,0,0,50,0,0,0,46,0,0,0,128,154,0,0,0,0,0,0,120,109,108,61,104,116,116,112,58,47,47,119,119,119,46,119,51,46,111,114,103,47,88,77,76,47,49,57,57,56,47,110,97,109,101,115,112,97,99,101,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,120,247,0,0,16,247,0,0,224,246,0,0,8,247,0,0,248,246,0,0,232,246,0,0,3,0,0,0,0,0,0,0,160,159,0,0,96,132,0,0,200,109,0,0,0,96,0,0,240,113,0,0,216,181,0,0,144,1,0,0,0,0,0,0,96,79,1,0,0,0,0,0,104,137,0,0,74,0,0,0,3,0,0,0,74,0,0,0,108,0,0,0,1,0,0,0,104,137,0,0,227,0,0,0,3,0,0,0,227,0,0,0,108,0,0,0,1,0,0,0,232,126,0,0,50,1,0,0,5,0,0,0,51,1,0,0,99,0,0,0,1,0,0,0,104,137,0,0,64,0,0,0,3,0,0,0,64,0,0,0,78,0,0,0,1,0,0,0,232,126,0,0,50,1,0,0,5,0,0,0,51,1,0,0,99,0,0,0,1,0,0,0,104,137,0,0,217,0,0,0,3,0,0,0,217,0,0,0,78,0,0,0,1,0,0,0,104,137,0,0,27,1,0,0,5,0,0,0,27,1,0,0,54,0,0,0,1,0,0,0,104,137,0,0,27,1,0,0,5,0,0,0,27,1,0,0,54,0,0,0,1,0,0,0,168,110,0,0,5,0,0,0,3,0,0,0,5,0,0,0,67,0,0,0,1,0,0,0,168,110,0,0,6,0,0,0,3,0,0,0,6,0,0,0,67,0,0,0,1,0,0,0,160,30,0,0,88,51,0,0,120,1,0,0,88,48,0,0,88,48,0,0,184,27,0,0,120,1,0,0,0,0,0,0,16,32,0,0,200,52,0,0,232,2,0,0,200,49,0,0,200,49,0,0,40,29,0,0,232,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,79,84,65,84,73,79,78,40,0,0,0,0,0,0,0,35,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,124,0,0,0,0,0,0,0,78,77,84,79,75,69,78,83,0,0,0,0,0,0,0,0,78,77,84,79,75,69,78,0,73,68,82,69,70,83,0,0,73,68,82,69,70,0,0,0,73,68,0,0,0,0,0,0,69,78,84,73,84,89,0,0,69,78,84,73,84,73,69,83,0,0,0,0,0,0,0,0,67,68,65,84,65,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].concat([0,0,0,0,6,0,0,0,0,0,0,0,40,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,47,47,2,32,87,65,82,78,73,78,71,46,32,84,104,101,32,118,97,108,117,101,32,69,77,73,78,32,109,97,121,32,98,101,32,105,110,99,111,114,114,101,99,116,58,45,2,44,2,32,32,69,77,73,78,32,61,32,2,44,105,56,44,47,2,32,73,102,44,32,97,102,116,101,114,32,105,110,115,112,101,99,116,105,111,110,44,32,116,104,101,32,118,97,108,117,101,32,69,77,73,78,32,108,111,111,107,115,2,44,2,32,97,99,99,101,112,116,97,98,108,101,32,112,108,101,97,115,101,32,99,111,109,109,101,110,116,32,111,117,116,32,2,44,47,2,32,116,104,101,32,73,70,32,98,108,111,99,107,32,97,115,32,109,97,114,107,101,100,32,119,105,116,104,105,110,32,116,104,101,32,99,111,100,101,32,111,102,32,114,111,117,116,105,110,101,2,44,2,32,68,76,65,77,67,50,44,2,44,47,2,32,111,116,104,101,114,119,105,115,101,32,115,117,112,112,108,121,32,69,77,73,78,32,101,120,112,108,105,99,105,116,108,121,46,2,44,47,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,118,0,0,128,114,0,0,136,112,0,0,8,111,0,0,8,109,0,0,24,107,0,0,208,105,0,0,96,104,0,0,232,118,0,0,88,103,0,0,136,102,0,0,208,101,0,0,160,98,0,0,184,97,0,0,128,96,0,0,152,95,0,0,0,0,0,0,40,156,0,0,32,154,0,0,64,93,1,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,34,3,0,0,0,0,0,0,33,3,0,0,0,0,0,0,8,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,174,2,0,0,0,0,0,0,173,2,0,0,0,0,0,0,169,2,0,0,0,0,0,0,168,2,0,0,0,0,0,0,165,2,0,0,0,0,0,0,164,2,0,0,0,0,0,0,163,2,0,0,0,0,0,0,160,2,0,0,0,0,0,0,159,2,0,0,0,0,0,0,158,2,0,0,0,0,0,0,149,2,0,0,0,0,0,0,148,2,0,0,0,0,0,0,140,2,0,0,0,0,0,0,139,2,0,0,0,0,0,0,138,2,0,0,0,0,0,0,129,2,0,0,0,0,0,0,128,2,0,0,0,0,0,0,119,2,0,0,0,0,0,0,118,2,0,0,0,0,0,0,110,2,0,0,0,0,0,0,109,2,0,0,0,0,0,0,108,2,0,0,0,0,0,0,99,2,0,0,0,0,0,0,98,2,0,0,0,0,0,0,60,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,57,0,0,0,0,0,0,0,55,0,0,0,0,0,0,0,54,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,39,0,0,0,0,0,0,0,38,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,36,0,0,0,0,0,0,0,34,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,29,0,0,0,0,0,0,0,28,0,0,0,0,0,0,0,25,0,0,0,0,0,0,0,24,0,0,0,0,0,0,0,203,0,0,0,0,0,0,0,202,0,0,0,0,0,0,0,201,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,19,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,17,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,72,145,0,0,0,0,0,0,184,186,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,67,68,65,84,65,91,0,0,98,0,0,0,6,0,0,0,24,0,0,0,40,0,0,0,50,0,0,0,84,0,0,0,22,0,0,0,66,0,0,0,38,0,0,0,64,0,0,0,88,0,0,0,74,0,0,0,64,0,0,0,30,0,0,0,8,0,0,0,2,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,23,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,22,28,28,28,28,28,28,28,28,28,28,22,28,26,28,28,22,28,28,28,28,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,0,0,0,6,0,0,0,24,0,0,0,40,0,0,0,50,0,0,0,84,0,0,0,22,0,0,0,66,0,0,0,38,0,0,0,64,0,0,0,88,0,0,0,74,0,0,0,64,0,0,0,30,0,0,0,8,0,0,0,2,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,22,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,22,28,28,28,28,28,28,28,28,28,28,22,28,26,28,28,22,28,28,28,28,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,22,22,22,22,22,22,22,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,247,0,0,176,247,0,0,168,247,0,0,160,247,0,0,192,247,0,0,200,247,0,0,104,247,0,0,88,247,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,8,0,0,0,18,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,23,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,76,0,0,0,28,0,0,0,14,0,0,0,78,0,0,0,54,0,0,0,30,0,0,0,16,0,0,0,76,0,0,0,28,0,0,0,10,0,0,0,62,0,0,0,72,0,0,0,18,0,0,0,58,0,0,0,8,0,0,0,18,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,21,10,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,16,12,19,28,30,3,13,31,32,33,34,35,27,26,17,25,25,25,25,25,25,25,25,25,25,22,18,2,14,11,15,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,20,28,4,28,22,28,24,24,24,24,24,24,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,28,36,28,28,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,116,116,112,58,47,47,119,119,119,46,119,51,46,111,114,103,47,50,48,48,48,47,120,109,108,110,115,47,0,0,0,104,116,116,112,58,47,47,119,119,119,46,119,51,46,111,114,103,47,88,77,76,47,49,57,57,56,47,110,97,109,101,115,112,97,99,101,0,0,0,0,72,88,1,0,0,0,0,0,74,117,108,0,0,0,0,0,114,101,115,105,100,117,97,108,32,102,117,110,99,116,105,111,110,32,112,111,105,110,116,101,114,32,105,115,32,105,110,118,97,108,105,100,0,0,0,0,38,108,116,59,0,0,0,0,100,97,115,115,108,32,119,105,116,104,32,115,121,109,98,111,108,105,99,32,106,97,99,111,98,105,97,110,0,0,0,0,97,108,108,111,99,97,116,105,111,110,78,101,119,116,111,110,68,97,116,97,40,41,32,102,97,105,108,101,100,33,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,115,116,114,105,110,103,32,97,108,105,97,115,32,118,97,114,115,0,0,0,0,0,74,117,110,0,0,0,0,0,98,97,99,107,117,112,95,103,111,117,116,0,0,0,0,0,114,98,0,0,0,0,0,0,100,97,115,115,108,32,102,111,114,32,100,101,98,117,103,32,112,114,111,112,111,115,101,0,66,111,111,108,101,97,110,32,65,108,105,97,115,32,118,97,114,105,97,98,108,101,32,0,100,101,114,40,0,0,0,0,68,101,115,105,114,101,100,32,115,116,101,112,32,116,111,32,115,109,97,108,108,32,116,114,121,32,110,101,120,116,32,111,110,101,0,0,0,0,0,0,65,112,114,0,0,0,0,0,79,0,0,0,0,0,0,0,60,47,102,111,114,109,97,116,62,10,0,0,0,0,0,0,100,97,115,115,108,32,119,105,116,104,111,117,116,32,105,110,116,101,114,110,97,108,32,114,111,111,116,32,102,105,110,100,105,110,103,0,0,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,98,111,111,108,101,97,110,32,97,108,105,97,115,32,118,97,114,115,0,0,0,0,117,110,97,98,108,101,32,116,111,32,105,109,112,111,114,116,32,98,111,111,108,101,97,110,32,112,97,114,97,109,101,116,101,114,32,37,115,32,102,114,111,109,32,103,105,118,101,110,32,102,105,108,101,0,0,0,77,97,114,0,0,0,0,0,32,40,99,112,117,32,116,105,109,101,41,60,47,100,111,117,98,108,101,62,10,0,0,0,108,111,98,97,116,116,111,54,32,91,115,117,110,100,105,97,108,47,107,105,110,115,111,108,32,110,101,101,100,101,100,93,0,0,0,0,0,0,0,0,73,110,116,101,103,101,114,32,65,108,105,97,115,32,118,97,114,105,97,98,108,101,32,0,124,32,37,115,40,115,116,97,114,116,61,37,115,41,0,0,68,65,83,83,76,45,45,32,32,65,84,32,84,32,40,61,82,49,41,32,83,79,77,69,32,69,76,69,77,69,78,84,32,79,70,32,87,84,0,0,70,101,98,0,0,0,0,0,100,117,112,108,105,99,97,116,101,32,97,116,116,114,105,98,117,116,101,0,0,0,0,0,60,100,111,117,98,108,101,62,0,0,0,0,0,0,0,0,108,111,98,97,116,116,111,52,32,91,115,117,110,100,105,97,108,47,107,105,110,115,111,108,32,110,101,101,100,101,100,93,0,0,0,0,0,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,105,110,116,101,103,101,114,32,97,108,105,97,115,32,118,97,114,115,0,0,0,0,105,109,112,111,114,116,32,98,111,111,108,101,97,110,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,76,79,71,95,73,78,73,84,0,0,0,0,0,0,0,0,105,110,116,101,114,97,99,116,105,118,101,0,0,0,0,0,74,97,110,0,0,0,0,0,115,0,0,0,0,0,0,0,97,108,108,111,99,97,116,105,111,110,72,121,98,114,100,68,97,116,97,40,41,32,102,97,105,108,101,100,33,0,0,0,32,40,99,97,108,108,115,41,60,47,117,105,110,116,51,50,62,10,0,0,0,0,0,0,108,111,98,97,116,116,111,50,32,91,115,117,110,100,105,97,108,47,107,105,110,115,111,108,32,110,101,101,100,101,100,93,0,0,0,0,0,0,0,0,117,110,97,98,108,101,32,116,111,32,105,109,112,111,114,116,32,105,110,116,101,103,101,114,32,112,97,114,97,109,101,116,101,114,32,37,115,32,102,114,111,109,32,103,105,118,101,110,32,102,105,108,101,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,117,110,105,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0,0,0,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,32,40,49,41,0,0,0,0,0,0,60,117,105,110,116,51,50,62,0,0,0,0,0,0,0,0,124,32,37,115,40,115,116,97,114,116,61,37,108,100,41,0,114,97,100,97,117,49,32,91,115,117,110,100,105,97,108,47,107,105,110,115,111,108,32,110,101,101,100,101,100,93,0,0,32,110,111,116,32,102,111,117,110,100,46,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,78,76,83,95,85,78,75,78,79,87,78,0,0,0,0,0,60,100,111,117,98,108,101,62,99,112,117,32,116,105,109,101,60,47,100,111,117,98,108,101,62,10,0,0,0,0,0,0,114,97,100,97,117,51,32,91,115,117,110,100,105,97,108,47,107,105,110,115,111,108,32,110,101,101,100,101,100,93,0,0,82,101,97,108,32,65,108,105,97,115,32,118,97,114,105,97,98,108,101,32,0,0,0,0,105,109,112,111,114,116,32,105,110,116,101,103,101,114,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,67,111,117,108,100,32,110,111,116,32,97,108,108,111,99,97,116,101,32,100,97,116,97,32,102,111,114,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,76,105,115,46,0,0,82,101,113,117,101,115,116,101,100,32,101,113,117,97,116,105,111,110,32,119,105,116,104,32,112,114,111,102,105,108,101,114,32,105,110,100,101,120,32,37,108,100,44,32,98,117,116,32,119,101,32,111,110,108,121,32,104,97,118,101,32,37,108,100,32,115,117,99,104,32,98,108,111,99,107,115,0,0,0,0,79,99,116,111,98,101,114,0,60,33,68,79,67,84,89,80,69,32,100,111,99,32,91,32,32,60,33,69,76,69,77,69,78,84,32,115,105,109,117,108,97,116,105,111,110,32,40,109,111,100,101,108,105,110,102,111,44,32,118,97,114,105,97,98,108,101,115,44,32,102,117,110,99,116,105,111,110,115,44,32,101,113,117,97,116,105,111,110,115,41,62,32,32,60,33,65,84,84,76,73,83,84,32,118,97,114,105,97,98,108,101,32,105,100,32,73,68,32,35,82,69,81,85,73,82,69,68,62,32,32,60,33,69,76,69,77,69,78,84,32,101,113,117,97,116,105,111,110,32,40,114,101,102,115,41,62,32,32,60,33,65,84,84,76,73,83,84,32,101,113,117,97,116,105,111,110,32,105,100,32,73,68,32,35,82,69,81,85,73,82,69,68,62,32,32,60,33,69,76,69,77,69,78,84,32,112,114,111,102,105,108,101,98,108,111,99,107,115,32,40,112,114,111,102,105,108,101,98,108,111,99,107,42,41,62,32,32,60,33,69,76,69,77,69,78,84,32,112,114,111,102,105,108,101,98,108,111,99,107,32,40,114,101,102,115,44,32,110,99,97,108,108,44,32,116,105,109,101,44,32,109,97,120,84,105,109,101,41,62,32,32,60,33,69,76,69,77,69,78,84,32,114,101,102,115,32,40,114,101,102,42,41,62,32,32,60,33,65,84,84,76,73,83,84,32,114,101,102,32,114,101,102,105,100,32,73,68,82,69,70,32,35,82,69,81,85,73,82,69,68,62,32,32,93,62,10,0,0,0,0,108,105,115,0,0,0,0,0,84,104,101,32,77,111,100,101,108,32,71,85,73,68,58,32,37,115,32,105,115,32,110,111,116,32,115,101,116,32,105,110,32,102,105,108,101,58,32,37,115,0,0,0,0,0,0,0,88,76,97,98,101,108,58,32,116,10,10,0,0,0,0,0,67,97,110,110,111,116,32,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,0,0,37,108,100,44,0,0,0,0,60,100,111,117,98,108,101,62,116,105,109,101,60,47,100,111,117,98,108,101,62,10,0,0,114,97,100,97,117,53,32,91,115,117,110,100,105,97,108,47,107,105,110,115,111,108,32,110,101,101,100,101,100,93,0,0,116,105,109,101,0,0,0,0,105,109,112,111,114,116,32,114,101,97,108,32,100,105,115,99,114,101,116,101,0,0,0,0,91,37,108,100,93,32,91,37,49,53,103,93,32,58,61,32,37,115,32,40,112,97,114,97,109,101,116,101,114,41,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,115,116,101,112,115,0,0,0,67,111,117,108,100,32,110,111,116,32,97,108,108,111,99,97,116,101,32,100,97,116,97,32,102,111,114,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,108,97,112,97,99,107,46,0,0,0,0,0,0,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,108,105,110,101,97,114,32,115,111,108,118,101,114,0,0,0,0,0,0,60,117,105,110,116,51,50,62,115,116,101,112,60,47,117,105,110,116,51,50,62,10,0,0,111,112,116,105,109,105,122,97,116,105,111,110,0,0,0,0,97,108,105,97,115,86,97,114,105,97,98,108,101,0,0,0,117,110,97,98,108,101,32,116,111,32,105,109,112,111,114,116,32,114,101,97,108,32,112,97,114,97,109,101,116,101,114,32,37,115,32,102,114,111,109,32,103,105,118,101,110,32,102,105,108,101,0,0,0,0,0,0,115,116,97,116,101,0,0,0,97,108,108,111,99,97,116,105,111,110,72,121,98,114,100,68,97,116,97,40,41,32,102,97,105,108,101,100,33,0,0,0,65,117,103,117,115,116,0,0,78,101,119,116,111,110,32,82,97,112,104,115,111,110,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,109,105,120,101,100,32,115,111,108,118,101,114,0,0,0,0,0,0,0,60,102,111,114,109,97,116,62,10,0,0,0,0,0,0,0,105,110,108,105,110,101,45,101,117,108,101,114,0,0,0,0,114,101,97,100,32,102,111,114,32,37,115,32,110,101,103,97,116,101,100,32,37,100,32,102,114,111,109,32,115,101,116,117,112,32,102,105,108,101,0,0,105,109,112,111,114,116,32,114,101,97,108,32,112,97,114,97,109,101,116,101,114,115,0,0,74,117,108,121,0,0,0,0,37,108,100,32,0,0,0,0,60,102,105,108,101,115,105,122,101,62,37,108,100,60,47,102,105,108,101,115,105,122,101,62,10,0,0,0,0,0,0,0,100,97,115,115,108,32,119,105,116,104,32,99,111,108,111,114,101,100,32,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,44,32,119,105,116,104,32,105,110,116,101,114,118,97,108,32,114,111,111,116,32,102,105,110,100,105,110,103,32,45,32,100,101,102,97,117,108,116,0,0,0,0,0,110,101,103,97,116,101,100,65,108,105,97,115,0,0,0,0,117,110,97,98,108,101,32,116,111,32,105,109,112,111,114,116,32,114,101,97,108,32,118,97,114,105,97,98,108,101,32,37,115,32,102,114,111,109,32,103,105,118,101,110,32,102,105,108,101,0,0,0,0,0,0,0,99,111,117,108,100,32,110,111,116,32,112,97,115,115,101,100,32,116,111,32,68,68,65,83,82,84,0,0,0,0,0,0,74,117,110,101,0,0,0,0,76,0,0,0,0,0,0,0,60,47,102,105,108,101,110,97,109,101,62,10,0,0,0,0,114,117,110,103,101,107,117,116,116,97,0,0,0,0,0,0,97,108,105,97,115,0,0,0,36,112,68,69,82,46,0,0,77,97,121,0,0,0,0,0,60,102,105,108,101,110,97,109,101,62,0,0,0,0,0,0,101,117,108,101,114,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,114,101,97,108,32,97,108,105,97,115,32,118,97,114,115,0,0,0,0,0,0,0,36,90,69,82,79,46,0,0,68,65,83,83,76,45,45,32,32,87,69,82,69,32,73,78,67,82,69,65,83,69,68,32,84,79,32,65,80,80,82,79,80,82,73,65,84,69,32,86,65,76,85,69,83,0,0,0,69,82,82,79,82,58,32,84,111,111,32,109,97,110,121,32,101,118,101,110,116,32,105,116,101,114,97,116,105,111,110,115,46,32,83,121,115,116,101,109,32,105,115,32,105,110,99,111,110,115,105,115,116,101,110,116,46,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,46,0,65,112,114,105,108,0,0,0,109,105,115,109,97,116,99,104,101,100,32,116,97,103,0,0,37,115,95,112,114,111,102,46,100,97,116,97,0,0,0,0,115,121,109,98,111,108,105,99,0,0,0,0,0,0,0,0,112,97,114,97,109,101,116,101,114,32,83,116,114,105,110,103,32,37,115,40,37,115,115,116,97,114,116,61,37,115,37,115,41,0,0,0,0,0,0,0,124,32,37,115,40,115,116,97,114,116,61,37,103,41,0,0,105,108,115,0,0,0,0,0,76,79,71,95,69,86,69,78,84,83,95,86,0,0,0,0,77,97,114,99,104,0,0,0,110,111,32,115,112,97,99,101,0,0,0,0,0,0,0,0,60,47,118,97,114,105,97,98,108,101,62,10,0,0,0,0,110,117,109,101,114,105,99,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,115,116,114,105,110,103,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,105,109,112,111,114,116,32,114,101,97,108,32,118,97,114,105,97,98,108,101,115,0,0,0,114,116,95,99,108,111,99,107,95,110,99,97,108,108,95,116,111,116,97,108,32,33,61,32,48,0,0,0,0,0,0,0,91,37,108,100,93,32,115,97,109,112,108,101,40,37,103,44,32,37,103,41,0,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,99,97,110,39,116,32,115,116,97,116,32,102,105,108,101,0,34,32,99,111,109,109,101,110,116,61,34,0,0,0,0,0,114,98,0,0,0,0,0,0,110,111,110,101,0,0,0,0,112,97,114,97,109,101,116,101,114,32,66,111,111,108,101,97,110,32,37,115,40,37,115,115,116,97,114,116,61,37,115,37,115,44,32,102,105,120,101,100,61,37,115,41,0,0,0,0,117,110,97,98,108,101,32,116,111,32,114,101,97,100,32,105,110,112,117,116,45,102,105,108,101,32,60,37,115,62,32,91,37,115,93,0,0,0,0,0,74,97,110,117,97,114,121,0,60,118,97,114,105,97,98,108,101,32,105,100,61,34,118,97,114,37,100,34,32,110,97,109,101,61,34,0,0,0,0,0,115,111,108,118,101,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,112,114,111,98,108,101,109,32,115,121,109,98,111,108,105,99,97,108,108,121,32,45,32,100,101,102,97,117,108,116,0,0,0,0,0,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,98,111,111,108,101,97,110,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,105,109,112,111,114,116,32,115,116,97,114,116,32,118,97,108,117,101,115,10,102,105,108,101,58,32,37,115,10,116,105,109,101,58,32,37,103,0,0,0,120,109,108,45,62,110,70,117,110,99,116,105,111,110,115,32,61,61,32,40,108,111,110,103,41,32,117,115,101,114,68,97,116,97,91,51,93,0,0,0,67,97,108,108,111,99,0,0,108,97,112,97,99,107,0,0,103,117,105,100,0,0,0,0,84,105,116,108,101,84,101,120,116,58,32,79,112,101,110,77,111,100,101,108,105,99,97,32,115,105,109,117,108,97,116,105,111,110,32,112,108,111,116,10,0,0,0,0,0,0,0,0,69,114,114,111,114,32,119,104,105,108,101,32,119,114,105,116,105,110,103,32,102,105,108,101,32,37,115,0,0,0,0,0,124,32,124,32,91,37,108,100,93,32,114,101,115,105,100,117,97,108,32,105,115,32,105,110,101,102,102,101,99,116,105,118,101,32,40,115,99,97,108,105,110,103,32,99,111,101,102,102,105,99,105,101,110,116,32,105,115,32,115,101,116,32,116,111,32,49,46,48,41,0,0,0,119,114,105,116,97,98,108,101,0,0,0,0,0,0,0,0,115,111,108,118,101,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,112,114,111,98,108,101,109,32,110,117,109,101,114,105,99,97,108,108,121,0,0,0,112,97,114,97,109,101,116,101,114,32,73,110,116,101,103,101,114,32,37,115,40,37,115,115,116,97,114,116,61,37,108,100,37,115,44,32,102,105,120,101,100,61,37,115,44,32,109,105,110,61,37,108,100,44,32,109,97,120,61,37,108,100,41,0,115,121,109,98,111,108,105,99,0,0,0,0,0,0,0,0,91,37,108,100,93,32,91,37,49,53,103,93,32,58,61,32,37,115,32,40,112,97,114,97,109,101,116,101,114,41,32,91,115,99,97,108,105,110,103,32,99,111,101,102,102,105,99,105,101,110,116,58,32,37,103,93,0,0,0,0,0,0,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,115,101,116,115,32,97,108,108,32,118,97,114,105,97,98,108,101,115,32,116,111,32,116,104,101,105,114,32,115,116,97,114,116,32,118,97,108,117,101,115,32,97,110,100,32,115,107,105,112,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,112,114,111,99,101,115,115,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,105,110,116,101,103,101,114,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,110,117,109,101,114,105,99,0,116,105,109,101,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,115,117,110,100,105,97,108,115,47,107,105,110,115,111,108,0,34,32,115,116,97,114,116,108,105,110,101,61,34,37,100,34,32,115,116,97,114,116,99,111,108,61,34,37,100,34,32,101,110,100,108,105,110,101,61,34,37,100,34,32,101,110,100,99,111,108,61,34,37,100,34,32,114,101,97,100,111,110,108,121,61,34,37,115,34,32,47,62,10,0,0,0,0,0,0,0,105,112,111,112,116,0,0,0,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,37,115,40,37,115,115,116,97,114,116,61,37,103,37,115,44,32,102,105,120,101,100,61,37,115,44,32,37,115,110,111,109,105,110,97,108,61,37,103,37,115,44,32,109,105,110,61,37,103,44,32,109,97,120,61,37,103,41,0,0,0,0,0,0,0,110,111,110,101,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,97,100,100,101,100,32,116,109,112,32,101,118,101,110,116,32,58,32,37,108,100,0,0,0,60,105,110,102,111,32,102,105,108,101,110,97,109,101,61,34,0,0,0,0,0,0,0,0,107,105,110,115,111,108,95,115,99,97,108,101,100,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,114,101,97,108,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,115,111,108,118,101,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,112,114,111,98,108,101,109,32,115,121,109,98,111,108,105,99,97,108,108,121,32,45,32,100,101,102,97,117,108,116,0,0,0,0,0,0,0,0,74,97,99,111,98,105,97,110,32,111,114,32,83,112,97,114,115,101,80,97,116,116,101,114,110,32,105,115,32,110,111,116,32,103,101,110,101,114,97,116,101,100,32,111,114,32,102,97,105,108,101,100,32,116,111,32,105,110,105,116,105,97,108,105,122,101,33,32,83,119,105,116,99,104,32,98,97,99,107,32,116,111,32,110,111,114,109,97,108,46,0,0,0,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,85,0,0,0,0,0,0,0,60,47,102,117,110,99,116,105,111,110,62,10,0,0,0,0,107,105,110,115,111,108,0,0,83,116,114,105,110,103,32,37,115,40,37,115,115,116,97,114,116,61,37,115,37,115,41,0,115,111,108,118,101,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,112,114,111,98,108,101,109,32,110,117,109,101,114,105,99,97,108,108,121,0,0,0,100,105,118,105,115,105,111,110,32,98,121,32,122,101,114,111,32,105,110,32,112,97,114,116,105,97,108,32,101,113,117,97,116,105,111,110,58,32,37,115,0,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,115,111,108,118,101,114,32,109,101,116,104,111,100,32,37,115,0,0,0,109,97,116,104,45,115,117,112,112,111,114,116,47,112,105,118,111,116,46,99,0,0,0,0,60,102,117,110,99,116,105,111,110,32,105,100,61,34,102,117,110,37,100,34,62,10,0,0,110,101,108,100,101,114,95,109,101,97,100,95,101,120,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,115,116,114,105,110,103,32,97,108,103,101,98,114,97,105,99,0,0,0,0,0,0,115,101,116,115,32,97,108,108,32,118,97,114,105,97,98,108,101,115,32,116,111,32,116,104,101,105,114,32,115,116,97,114,116,32,118,97,108,117,101,115,32,97,110,100,32,115,107,105,112,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,112,114,111,99,101,115,115,0,0,0,68,65,83,83,76,45,45,32,32,70,79,82,32,80,82,69,67,73,83,73,79,78,32,79,70,32,77,65,67,72,73,78,69,46,32,82,84,79,76,32,65,78,68,32,65,84,79,76,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,112,97,114,116,105,97,108,32,99,104,97,114,97,99,116,101,114,0,0,0,0,0,0,0,102,117,110,0,0,0,0,0,110,101,119,117,111,97,0,0,66,111,111,108,101,97,110,32,37,115,40,37,115,115,116,97,114,116,61,37,115,37,115,44,32,102,105,120,101,100,61,37,115,41,0,0,0,0,0,0,105,112,111,112,116,0,0,0,105,105,116,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,76,79,71,95,69,86,69,78,84,83,0,0,0,0,0,0,102,111,114,116,46,37,108,100,0,0,0,0,0,0,0,0,60,47,101,113,117,97,116,105,111,110,62,10,0,0,0,0,115,105,109,112,108,101,120,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,98,111,111,108,101,97,110,32,97,108,103,101,98,114,97,105,99,0,0,0,0,0,107,105,110,115,111,108,95,115,99,97,108,101,100,0,0,0,114,116,95,99,108,111,99,107,95,110,99,97,108,108,95,109,97,120,32,33,61,32,48,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,110,117,108,108,32,102,105,108,101,32,110,97,109,101,0,0,60,99,97,108,99,105,110,102,111,32,116,105,109,101,61,34,37,102,34,32,99,111,117,110,116,61,34,37,108,117,34,47,62,10,0,0,0,0,0,0,73,110,116,101,114,105,111,114,32,80,111,105,110,116,32,79,80,84,105,109,105,122,101,114,0,0,0,0,0,0,0,0,100,97,116,97,95,50,0,0,73,110,116,101,103,101,114,32,37,115,40,37,115,115,116,97,114,116,61,37,108,100,37,115,44,32,102,105,120,101,100,61,37,115,44,32,109,105,110,61,37,108,100,44,32,109,97,120,61,37,108,100,41,0,0,0,107,105,110,115,111,108,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,60,47,114,101,102,115,62,10,0,0,0,0,0,0,0,0,115,117,110,100,105,97,108,115,47,107,105,110,115,111,108,32,119,105,116,104,32,115,99,97,108,105,110,103,0,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,105,110,116,101,103,101,114,32,97,108,103,101,98,114,97,105,99,0,0,0,0,0,110,101,108,100,101,114,95,109,101,97,100,95,101,120,0,0,105,110,118,97,108,105,100,32,99,111,109,109,97,110,100,32,108,105,110,101,32,111,112,116,105,111,110,58,32,37,115,0,120,109,108,45,62,110,69,113,117,97,116,105,111,110,115,32,61,61,32,40,108,111,110,103,41,32,117,115,101,114,68,97,116,97,91,49,93,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,69,120,101,99,117,116,105,111,110,32,116,105,109,101,32,111,102,32,103,108,111,98,97,108,32,115,116,101,112,115,0,0,115,101,101,32,108,97,115,116,32,119,97,114,110,105,110,103,0,0,0,0,0,0,0,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,69,114,114,111,114,58,32,102,97,105,108,101,100,32,116,111,32,114,101,97,100,32,116,104,101,32,88,77,76,32,100,97,116,97,32,37,115,58,32,37,115,32,97,116,32,108,105,110,101,32,37,108,117,10,0,0,0,0,0,0,0,0,35,73,110,116,101,114,118,97,108,83,105,122,101,61,37,108,100,10,0,0,0,0,0,0,69,114,114,111,114,32,119,104,105,108,101,32,119,114,105,116,105,110,103,32,109,97,116,32,102,105,108,101,32,37,115,0,36,99,112,117,84,105,109,101,0,0,0,0,0,0,0,0,108,97,109,98,100,97,0,0,124,32,110,117,109,98,101,114,32,111,102,32,115,116,97,114,116,32,118,97,108,117,101,32,114,101,115,105,100,117,97,108,115,58,32,37,108,100,0,0,60,114,101,102,32,114,101,102,105,100,61,34,118,97,114,37,100,34,32,47,62,10,0,0,115,117,110,100,105,97,108,115,47,107,105,110,115,111,108,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,114,101,97,108,32,97,108,103,101,98,114,97,105,99,0,0,0,0,0,0,0,0,110,101,119,117,111,97,0,0,91,37,108,100,93,32,91,37,49,53,103,93,32,58,61,32,37,115,0,0,0,0,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,112,114,101,45,105,110,105,116,105,97,108,105,122,97,116,105,111,110,0,0,0,0,0,0,69,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,60,114,101,102,115,62,10,0,69,120,116,101,110,100,101,100,32,78,101,108,100,101,114,45,77,101,97,100,32,109,101,116,104,111,100,32,40,115,101,101,32,45,105,108,115,32,102,111,114,32,103,108,111,98,97,108,32,104,111,109,111,116,111,112,121,41,32,45,32,100,101,102,97,117,108,116,0,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,115,116,97,116,101,68,101,114,105,118,97,116,105,118,101,115,0,0,0,0,0,0,115,105,109,112,108,101,120,0,37,115,32,101,118,101,110,116,32,97,116,32,116,105,109,101,32,37,103,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,100,101,102,97,117,108,116,32,109,101,116,104,111,100,0,0,34,62,10,0,0,0,0,0,66,114,101,110,116,39,115,32,109,101,116,104,111,100,0,0,102,97,108,115,101,0,0,0,73,110,116,101,114,105,111,114,32,80,111,105,110,116,32,79,80,84,105,109,105,122,101,114,0,0,0,0,0,0,0,0])
.concat([68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,77,105,110,105,109,117,109,32,118,97,108,117,101,58,32,37,101,0,0,0,0,0,0,0,60,101,113,117,97,116,105,111,110,32,105,100,61,34,101,113,37,100,34,32,110,97,109,101,61,34,0,0,0,0,0,0,78,101,108,100,101,114,45,77,101,97,100,32,109,101,116,104,111,100,0,0,0,0,0,0,116,114,117,101,0,0,0,0,115,117,110,100,105,97,108,115,47,107,105,110,115,111,108,32,119,105,116,104,32,115,99,97,108,105,110,103,0,0,0,0,78,111,32,83,112,97,114,115,101,80,97,116,116,101,114,110,44,32,115,105,110,99,101,32,116,104,101,114,101,32,97,114,101,32,110,111,32,115,116,97,116,101,115,33,32,83,119,105,116,99,104,32,98,97,99,107,32,116,111,32,110,111,114,109,97,108,46,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,60,47,112,114,111,102,105,108,101,98,108,111,99,107,62,10,0,0,0,0,0,0,0,0,77,0,0,0,0,0,0,0,117,110,107,110,111,119,110,0,125,0,0,0,0,0,0,0,115,117,110,100,105,97,108,115,47,107,105,110,115,111,108,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,60,116,105,109,101,62,37,46,57,102,60,47,116,105,109,101,62,10,0,0,0,0,0,0,85,110,104,97,110,100,108,101,100,32,65,115,115,101,114,116,105,111,110,45,69,114,114,111,114,0,0,0,0,0,0,0,123,0,0,0,0,0,0,0,69,120,116,101,110,100,101,100,32,78,101,108,100,101,114,45,77,101,97,100,32,109,101,116,104,111,100,32,40,115,101,101,32,45,105,108,115,32,102,111,114,32,103,108,111,98,97,108,32,104,111,109,111,116,111,112,121,41,32,45,32,100,101,102,97,117,108,116,0,0,0,0,68,65,83,83,76,45,45,32,32,65,84,32,84,32,40,61,82,49,41,32,84,79,79,32,77,85,67,72,32,65,67,67,85,82,65,67,89,32,82,69,81,85,69,83,84,69,68,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,117,110,99,108,111,115,101,100,32,116,111,107,101,110,0,0,60,110,99,97,108,108,62,37,100,60,47,110,99,97,108,108,62,10,0,0,0,0,0,0,69,114,114,111,114,58,32,0,66,114,101,110,116,39,115,32,109,101,116,104,111,100,0,0,105,105,109,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,76,79,71,95,68,83,83,95,74,65,67,0,0,0,0,0,111,112,101,110,0,0,0,0,60,114,101,102,32,114,101,102,105,100,61,34,101,113,37,100,34,47,62,10,0,0,0,0,82,101,97,108,32,37,115,40,37,115,115,116,97,114,116,61,37,103,37,115,44,32,102,105,120,101,100,61,37,115,44,32,37,115,110,111,109,105,110,97,108,61,37,103,37,115,44,32,109,105,110,61,37,103,44,32,109,97,120,61,37,103,41,0,78,101,108,100,101,114,45,77,101,97,100,32,109,101,116,104,111,100,0,0,0,0,0,0,114,116,95,99,108,111,99,107,95,110,99,97,108,108,95,109,105,110,32,33,61,32,48,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,60,112,114,111,102,105,108,101,98,108,111,99,107,62,10,0,99,97,110,39,116,32,98,97,99,107,115,112,97,99,101,32,102,105,108,101,0,0,0,0,87,97,114,110,105,110,103,58,32,0,0,0,0,0,0,0,109,97,120,0,0,0,0,0,100,97,116,97,95,49,0,0,117,110,107,110,111,119,110,0,119,105,108,108,32,111,118,101,114,114,105,100,101,32,116,104,101,32,118,97,114,105,97,98,108,101,115,32,111,114,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,115,101,116,116,105,110,103,115,32,105,110,32,116,104,101,32,88,77,76,32,115,101,116,117,112,32,102,105,108,101,32,119,105,116,104,32,116,104,101,32,118,97,108,117,101,115,32,102,114,111,109,32,116,104,101,32,102,105,108,101,10,32,32,110,111,116,101,32,116,104,97,116,58,32,45,111,118,101,114,114,105,100,101,70,105,108,101,32,67,65,78,78,79,84,32,98,101,32,117,115,101,100,32,119,105,116,104,32,45,111,118,101,114,114,105,100,101,10,32,32,117,115,101,32,119,104,101,110,32,118,97,114,105,97,98,108,101,115,32,102,111,114,32,45,111,118,101,114,114,105,100,101,32,97,114,101,32,116,111,111,32,109,97,110,121,32,97,110,100,32,100,111,32,110,111,116,32,102,105,116,32,105,110,32,99,111,109,109,97,110,100,32,108,105,110,101,32,115,105,122,101,10,32,32,111,118,101,114,114,105,100,101,70,105,108,101,78,97,109,101,32,99,111,110,116,97,105,110,115,32,108,105,110,101,115,32,111,102,32,116,104,101,32,102,111,114,109,58,32,118,97,114,49,61,115,116,97,114,116,49,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,114,101,115,116,111,114,101,95,115,116,97,116,101,46,98,117,102,102,101,114,32,61,61,32,48,0,0,0,0,0,0,0,101,113,0,0,0,0,0,0,109,105,110,0,0,0,0,0,111,112,116,105,109,105,122,97,116,105,111,110,45,99,97,108,108,115,58,32,37,108,100,0,100,101,98,117,103,0,0,0,101,97,99,104,32,99,111,109,109,97,110,100,32,108,105,110,101,32,111,112,116,105,111,110,32,99,97,110,32,111,110,108,121,32,98,101,32,117,115,101,100,32,111,110,99,101,58,32,37,115,0,0,0,0,0,0,37,115,58,32,69,114,114,111,114,58,32,102,97,105,108,101,100,32,116,111,32,114,101,97,100,32,116,104,101,32,88,77,76,32,100,97,116,97,32,37,115,58,32,37,115,32,97,116,32,108,105,110,101,32,37,108,117,0,0,0,0,0,0,0,111,118,101,114,114,105,100,101,32,116,104,101,32,118,97,114,105,97,98,108,101,115,32,111,114,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,115,101,116,116,105,110,103,115,32,105,110,32,116,104,101,32,88,77,76,32,115,101,116,117,112,32,102,105,108,101,10,32,32,101,46,103,46,32,118,97,114,49,61,115,116,97,114,116,49,44,118,97,114,50,61,115,116,97,114,116,50,44,112,97,114,51,61,115,116,97,114,116,51,44,115,116,97,114,116,84,105,109,101,61,118,97,108,49,44,115,116,111,112,84,105,109,101,61,118,97,108,50,44,115,116,101,112,83,105,122,101,61,118,97,108,51,44,10,32,32,32,32,32,32,32,116,111,108,101,114,97,110,99,101,61,118,97,108,52,44,115,111,108,118,101,114,61,34,115,101,101,32,45,115,34,44,111,117,116,112,117,116,70,111,114,109,97,116,61,34,109,97,116,124,112,108,116,124,99,115,118,124,101,109,112,116,121,34,44,118,97,114,105,97,98,108,101,70,105,108,116,101,114,61,34,102,105,108,116,101,114,34,0,0,0,115,101,116,32,102,111,114,109,97,116,32,121,32,34,37,103,34,10,0,0,0,0,0,0,37,32,46,53,101,32,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,111,112,116,105,111,110,32,45,110,108,115,61,37,115,0,0,0,0,0,37,115,44,32,37,115,32,37,108,117,10,0,0,0,0,0,35,78,117,109,98,101,114,111,102,86,97,114,105,97,98,108,101,115,61,37,100,10,0,0,100,97,116,97,95,50,0,0,116,105,109,101,0,0,0,0,105,116,101,114,97,116,105,111,110,0,0,0,0,0,0,0,69,114,114,111,114,32,105,110,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,46,32,73,110,116,101,114,110,97,108,32,101,114,114,111,114,44,32,78,76,79,79,80,32,60,32,49,46,0,0,0,0,0,124,32,110,117,109,98,101,114,32,111,102,32,105,110,105,116,105,97,108,32,114,101,115,105,100,117,97,108,115,58,32,32,37,108,100,32,40,37,108,100,32,101,113,117,97,116,105,111,110,115,32,43,32,37,108,100,32,97,108,103,111,114,105,116,104,109,115,41,0,0,0,0,84,105,109,101,32,109,101,97,115,117,114,101,109,101,110,116,115,32,97,114,101,32,115,116,111,114,101,100,32,105,110,32,37,115,95,112,114,111,102,46,104,116,109,108,32,40,104,117,109,97,110,45,114,101,97,100,97,98,108,101,41,32,97,110,100,32,37,115,95,112,114,111,102,46,120,109,108,32,40,102,111,114,32,88,83,76,32,116,114,97,110,115,102,111,114,109,115,32,111,114,32,109,111,114,101,32,100,101,116,97,105,108,115,41,0,0,0,0,0,0,115,116,97,114,116,78,111,110,73,110,116,101,114,97,99,116,105,118,101,83,105,109,117,108,97,116,105,111,110,58,32,0,110,111,109,105,110,97,108,0,110,111,116,32,117,112,100,97,116,105,110,103,32,98,101,115,116,90,0,0,0,0,0,0,91,37,108,100,93,32,91,37,49,53,103,93,32,58,61,32,37,115,32,91,115,99,97,108,105,110,103,32,99,111,101,102,102,105,99,105,101,110,116,58,32,37,103,93,0,0,0,0,115,101,108,101,99,116,32,37,115,0,0,0,0,0,0,0,116,105,109,101,114,0,0,0,101,114,114,111,114,0,0,0,37,103,32,32,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,111,117,116,112,117,116,32,116,104,101,32,118,97,114,105,97,98,108,101,115,32,97,44,32,98,32,97,110,100,32,99,32,97,116,32,116,104,101,32,101,110,100,32,111,102,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,116,111,32,116,104,101,32,115,116,97,110,100,97,114,100,32,111,117,116,112,117,116,10,32,32,116,105,109,101,32,61,32,118,97,108,117,101,44,32,97,32,61,32,118,97,108,117,101,44,32,98,32,61,32,118,97,108,117,101,44,32,99,32,61,32,118,97,108,117,101,0,0,0,0,0,70,97,105,108,101,100,32,116,111,32,103,101,110,101,114,97,116,101,32,104,116,109,108,32,118,101,114,115,105,111,110,32,111,102,32,112,114,111,102,105,108,105,110,103,32,114,101,115,117,108,116,115,58,32,37,115,10,0,0,0,0,0,0,0,117,115,101,78,111,109,105,110,97,108,0,0,0,0,0,0,117,112,100,97,116,105,110,103,32,98,101,115,116,90,0,0,119,97,114,110,105,110,103,0,82,117,110,110,105,110,103,0,37,103,32,10,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,111,117,116,112,117,116,32,102,111,114,109,97,116,32,111,102,32,116,104,101,32,109,101,97,115,117,114,101,32,116,105,109,101,32,102,117,110,99,116,105,111,110,97,108,105,116,121,10,32,32,115,118,103,10,32,32,106,112,103,10,32,32,112,115,10,32,32,103,105,102,10,32,32,46,46,46,0,0,0,0,0,0,0,0,117,110,107,110,111,119,110,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,79,80,69,78,77,79,68,69,76,73,67,65,72,79,77,69,32,109,105,115,115,105,110,103,0,0,0,0,0,0,0,0,102,105,120,101,100,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,111,112,116,105,111,110,32,45,105,111,109,0,105,110,102,111,0,0,0,0,97,116,32,112,111,105,110,116,32,105,110,32,116,105,109,101,32,58,32,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,108,111,103,103,105,110,103,32,108,101,118,101,108,0,0,0,0,0,0,0,115,101,97,114,99,104,32,102,111,114,32,99,117,114,114,101,110,116,32,101,118,101,110,116,46,32,69,118,101,110,116,115,32,105,110,32,108,105,115,116,58,32,37,108,100,0,0,0,37,115,32,45,111,32,37,115,95,112,114,111,102,46,104,116,109,108,32,37,115,47,115,104,97,114,101,47,111,109,99,47,115,99,114,105,112,116,115,47,100,101,102,97,117,108,116,95,112,114,111,102,105,108,105,110,103,46,120,115,108,32,37,115,95,112,114,111,102,46,120,109,108,0,0,0,0,0,0,0,60,100,105,102,102,67,117,114,114,101,110,116,84,105,109,101,62,37,103,60,47,100,105,102,102,67,117,114,114,101,110,116,84,105,109,101,62,10,0,0,115,116,97,114,116,0,0,0,105,110,105,116,105,97,108,105,122,97,116,105,111,110,45,110,114,46,32,37,108,100,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,109,101,116,104,111,100,32,102,111,114,32,73,112,111,112,116,44,32,100,101,102,97,117,108,116,32,109,117,109,112,115,46,10,32,78,111,116,101,58,32,85,115,101,32,105,102,32,121,111,117,32,98,117,105,108,100,32,105,112,111,112,116,32,119,105,116,104,32,111,116,104,101,114,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,108,105,107,101,32,109,97,50,55,0,0,0,0,0,120,115,108,116,112,114,111,99,0,0,0,0,0,0,0,0,60,99,117,114,114,101,110,116,84,105,109,101,62,37,103,60,47,99,117,114,114,101,110,116,84,105,109,101,62,10,0,0,82,0,0,0,0,0,0,0,117,115,101,83,116,97,114,116,0,0,0,0,0,0,0,0,35,35,35,32,70,73,78,65,76,32,73,78,73,84,73,65,76,73,90,65,84,73,79,78,32,82,69,83,85,76,84,83,32,35,35,35,0,0,0,0,124,32,0,0,0,0,0,0,37,103,32,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,109,101,116,104,111,100,10,32,32,108,97,112,97,99,107,44,32,108,105,115,0,0,87,97,114,110,105,110,103,58,32,80,108,111,116,32,99,111,109,109,97,110,100,32,102,97,105,108,101,100,10,0,0,0,60,100,105,102,102,79,108,100,84,105,109,101,62,37,103,60,47,100,105,102,102,79,108,100,84,105,109,101,62,10,0,0,102,105,108,101,87,114,105,116,97,98,108,101,0,0,0,0,115,107,105,112,32,119,47,111,32,115,99,97,108,105,110,103,0,0,0,0,0,0,0,0,37,45,55,115,32,124,32,0,99,106,58,32,37,103,32,97,110,100,32,116,104,101,32,115,116,97,116,101,115,10,0,0,68,65,83,83,76,45,45,32,32,84,65,75,69,78,32,79,78,32,84,72,73,83,32,67,65,76,76,32,66,69,70,79,82,69,32,82,69,65,67,72,73,78,71,32,84,79,85,84,0,0,0,0,0,0,0,0,80,77,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,110,117,109,98,101,114,32,111,102,32,115,116,101,112,115,32,102,111,114,32,104,111,109,111,116,111,112,121,32,109,101,116,104,111,100,32,40,114,101,113,117,105,114,101,100,58,32,45,105,105,109,61,115,121,109,98,111,108,105,99,41,32,111,114,10,39,115,116,97,114,116,32,118,97,108,117,101,32,104,111,109,111,116,111,112,121,39,32,109,101,116,104,111,100,32,40,114,101,113,117,105,114,101,100,58,32,45,105,105,109,61,110,117,109,101,114,105,99,32,45,105,111,109,61,110,101,108,100,101,114,95,109,101,97,100,95,101,120,41,0,68,65,83,83,76,45,45,32,32,84,72,69,32,76,65,83,84,32,83,84,69,80,32,84,69,82,77,73,78,65,84,69,68,32,87,73,84,72,32,65,32,78,69,71,65,84,73,86,69,0,0,0,0,0,0,0,98,117,102,0,0,0,0,0,60,111,108,100,84,105,109,101,50,62,37,46,49,50,103,60,47,111,108,100,84,105,109,101,50,62,10,0,0,0,0,0,101,110,100,67,111,108,117,109,110,0,0,0,0,0,0,0,115,116,97,114,116,32,119,105,116,104,32,115,99,97,108,105,110,103,0,0,0,0,0,0,110,111,116,32,119,101,108,108,45,102,111,114,109,101,100,32,40,105,110,118,97,108,105,100,32,116,111,107,101,110,41,0,124,0,0,0,0,0,0,0,100,97,115,115,108,116,101,115,116,0,0,0,0,0,0,0,105,105,102,0,0,0,0,0,65,77,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,97,32,116,105,109,101,32,102,111,114,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,111,102,32,116,104,101,32,109,111,100,101,108,0,0,0,0,0,0,76,79,71,95,68,83,83,0,114,43,0,0,0,0,0,0,115,105,109,117,108,97,116,105,111,110,47,109,111,100,101,108,105,110,102,111,46,99,0,0,60,111,108,100,84,105,109,101,62,37,46,49,50,103,60,47,111,108,100,84,105,109,101,62,10,0,0,0,0,0,0,0,101,110,100,76,105,110,101,0,111,118,101,114,45,100,101,116,101,114,109,105,110,101,100,0,114,116,95,99,108,111,99,107,95,110,99,97,108,108,32,33,61,32,48,0,0,0,0,0,37,45,49,55,115,32,124,32,0,0,0,0,0,0,0,0,100,97,115,115,108,73,110,116,101,114,110,97,108,78,117,109,74,97,99,0,0,0,0,0,103,101,116,32,100,101,116,97,105,108,101,100,32,105,110,102,111,114,109,97,116,105,111,110,32,116,104,97,116,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,99,111,109,109,97,110,100,45,108,105,110,101,32,102,108,97,103,10,32,32,101,46,103,46,32,45,104,101,108,112,61,102,32,112,114,105,110,116,115,32,100,101,116,97,105,108,101,100,32,105,110,102,111,114,109,97,116,105,111,110,32,102,111,114,32,99,111,109,109,97,110,100,45,108,105,110,101,32,102,108,97,103,32,102,0,0,0,0,0,0,0,0,60,47,115,105,109,117,108,97,116,105,111,110,62,10,0,0,60,99,117,114,114,101,110,116,83,116,101,112,83,105,122,101,62,37,103,60,47,99,117,114,114,101,110,116,83,116,101,112,83,105,122,101,62,10,0,0,115,101,113,117,101,110,116,105,97,108,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0,0,0,0,0,0,0,115,116,97,114,116,67,111,108,117,109,110,0,0,0,0,0,100,97,116,97,73,110,102,111,0,0,0,0,0,0,0,0,110,111,32,105,110,105,116,105,97,108,32,118,97,108,117,101,115,32,116,111,32,99,97,108,99,117,108,97,116,101,0,0,100,97,115,115,108,67,111,108,111,114,83,121,109,74,97,99,0,0,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,32,32,45,32,100,117,109,112,115,32,116,104,101,32,99,112,117,45,116,105,109,101,32,105,110,116,111,32,116,104,101,32,114,101,115,117,108,116,45,102,105,108,101,10,32,32,45,32,36,99,112,117,84,105,109,101,32,105,115,32,116,104,101,32,118,97,114,105,97,98,108,101,32,110,97,109,101,32,105,110,115,105,100,101,32,116,104,101,32,114,101,115,117,108,116,45,102,105,108,101,0,0,0,0,105,110,118,97,108,105,100,32,100,97,116,97,32,110,111,100,101,0,0,0,0,0,0,0,60,47,112,114,111,102,105,108,101,98,108,111,99,107,115,62,10,0,0,0,0,0,0,0,115,116,97,114,116,76,105,110,101,0,0,0,0,0,0,0,37,115,40,102,105,120,101,100,61,116,114,117,101,41,32,61,32,37,103,0,0,0,0,0,100,97,115,115,108,78,117,109,74,97,99,0,0,0,0,0,117,110,98,97,108,97,110,99,101,100,32,99,111,109,109,97,110,100,32,108,105,110,101,32,102,108,97,103,32,115,116,114,117,99,116,117,114,101,58,32,70,76,65,71,95,68,69,84,65,73,76,69,68,95,68,69,83,67,0,0,0,0,0,0,115,105,109,117,108,97,116,105,111,110,47,115,105,109,117,108,97,116,105,111,110,95,105,110,102,111,95,120,109,108,46,99,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,115,101,108,101,99,116,115,32,116,104,101,32,116,121,112,101,32,111,102,32,99,108,111,99,107,32,116,111,32,117,115,101,32,45,99,108,111,99,107,61,82,84,44,32,45,99,108,111,99,107,61,67,89,67,32,111,114,32,45,99,108,111,99,107,61,67,80,85,10,32,32,82,84,61,109,111,110,111,116,111,110,105,99,32,114,101,97,108,45,116,105,109,101,32,99,108,111,99,107,44,32,67,80,85,61,112,114,111,99,101,115,115,45,98,97,115,101,100,32,67,80,85,45,116,105,109,101,44,32,67,89,67,61,99,112,117,32,99,121,99,108,101,115,32,109,101,97,115,117,114,101,100,32,119,105,116,104,32,82,68,84,83,67,0,0,0,0,0,115,101,116,32,110,111,107,101,121,10,0,0,0,0,0,0,80,114,105,110,116,32,106,97,99,58,0,0,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,111,112,116,105,111,110,32,45,108,118,32,37,115,0,0,0,0,0,0,115,101,101,32,108,97,115,116,32,119,97,114,110,105,110,103,0,0,0,0,0,0,0,0,35,80,116,111,108,101,109,121,32,80,108,111,116,32,102,105,108,101,44,32,103,101,110,101,114,97,116,101,100,32,98,121,32,79,112,101,110,77,111,100,101,108,105,99,97,10,0,0,100,97,116,97,73,110,102,111,0,0,0,0,0,0,0,0,69,114,114,111,114,44,32,99,111,117,108,100,110,39,116,32,99,114,101,97,116,101,32,111,117,116,112,117,116,32,102,105,108,101,58,32,91,37,115,93,32,98,101,99,97,117,115,101,32,111,102,32,37,115,0,0,37,115,44,0,0,0,0,0,69,114,114,111,114,32,105,110,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,46,32,78,117,109,98,101,114,32,111,102,32,105,110,105,116,105,97,108,32,118,97,108,117,101,115,32,116,111,32,99,97,108,99,117,108,97,116,101,32,60,32,49,0,0,0,0,0,0,124,32,124,32,91,37,108,100,93,32,100,105,115,99,114,101,116,101,32,82,101,97,108,32,37,115,40,115,116,97,114,116,61,37,103,44,32,110,111,109,105,110,97,108,61,37,103,41,32,61,32,37,103,0,0,0,60,112,114,111,102,105,108,101,98,108,111,99,107,115,62,10,0,0,0,0,0,0,0,0,60,109,111,100,101,108,62,37,115,60,47,109,111,100,101,108,62,10,0,0,0,0,0,0,102,105,108,101,78,97,109,101,0,0,0,0,0,0,0,0,115,101,116,116,105,110,103,32,102,105,120,101,100,61,116,114,117,101,32,102,111,114,58,0,117,110,102,105,120,101,100,32,118,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,115,101,108,101,99,116,32,110,101,119,32,115,116,97,116,101,115,32,97,116,32,116,105,109,101,32,37,102,0,0,0,0,35,35,35,32,83,84,65,84,73,83,84,73,67,83,32,35,35,35,0,0,0,0,0,0,100,97,115,115,108,83,121,109,74,97,99,0,0,0,0,0,115,104,111,119,115,32,97,108,108,32,119,97,114,110,105,110,103,115,32,101,118,101,110,32,105,102,32,97,32,114,101,108,97,116,101,100,32,108,111,103,45,115,116,114,101,97,109,32,105,115,32,105,110,97,99,116,105,118,101,0,0,0,0,0,60,47,101,113,117,97,116,105,111,110,115,62,10,0,0,0,100,101,115,99,114,105,112,116,105,111,110,0,0,0,0,0,117,110,100,101,114,45,100,101,116,101,114,109,105,110,101,100,0,0,0,0,0,0,0,0,99,97,108,108,32,115,111,108,118,101,114,32,102,114,111,109,32,37,103,32,116,111,32,37,103,32,40,115,116,101,112,83,105,122,101,58,32,37,103,41,0,0,0,0,0,0,0,0,100,97,115,115,108,119,111,114,116,0,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,115,111,108,118,101,114,0,0,0,0,0,0,78,76,83,95,77,65,88,0,60,101,113,117,97,116,105,111,110,115,62,10,0,0,0,0,78,111,32,118,97,114,105,97,98,108,101,115,32,105,110,32,116,104,101,32,109,111,100,101,108,46,0,0,0,0,0,0,118,97,108,117,101,82,101,102,101,114,101,110,99,101,0,0,110,111,32,105,110,105,116,105,97,108,32,114,101,115,105,100,117,97,108,115,32,40,110,101,105,116,104,101,114,32,105,110,105,116,105,97,108,32,101,113,117,97,116,105,111,110,115,32,110,111,114,32,105,110,105,116,105,97,108,32,97,108,103,111,114,105,116,104,109,115,41,0,119,114,105,116,97,98,108,101,0,0,0,0,0,0,0,0,100,97,115,115,108,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,97,32,110,101,119,32,114,101,115,117,108,116,32,102,105,108,101,32,116,104,97,110,32,116,104,101,32,100,101,102,97,117,108,116,32,77,111,100,101,108,95,114,101,115,46,109,97,116,0,0,0,0,0,0,0,0,115,116,97,116,101,115,95,108,101,102,116,0,0,0,0,0,32,73,79,0,0,0,0,0,60,47,102,117,110,99,116,105,111,110,115,62,10,0,0,0,69,114,114,111,114,58,32,67,111,117,108,100,32,110,111,116,32,105,110,105,116,105,97,108,105,122,101,32,116,104,101,32,103,108,111,98,97,108,32,100,97,116,97,32,115,116,114,117,99,116,117,114,101,32,102,105,108,101,0,0,0,0,0,0,110,97,109,101,0,0,0,0,110,111,32,118,97,114,105,97,98,108,101,115,32,116,111,32,105,110,105,116,105,97,108,105,122,101,0,0,0,0,0,0,100,105,118,105,115,105,111,110,32,98,121,32,122,101,114,111,0,0,0,0,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,100,97,115,115,108,32,102,111,114,32,100,101,98,117,103,32,112,114,111,112,111,115,101,0,124,32,115,111,108,118,101,114,32,124,32,85,115,101,32,115,111,108,118,101,114,32,109,101,116,104,111,100,58,32,37,115,9,37,115,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,105,110,116,101,114,97,99,116,105,118,101,32,115,105,109,117,108,97,116,105,111,110,32,112,111,114,116,0,0,0,0,0,105,110,116,101,114,110,97,108,0,0,0,0,0,0,0,0,60,102,117,110,99,116,105,111,110,115,62,10,0,0,0,0,91,37,115,58,37,100,58,37,100,45,37,100,58,37,100,58,37,115,93,0,0,0,0,0,117,115,101,32,37,115,32,45,104,101,108,112,32,102,111,114,32,97,32,108,105,115,116,32,111,102,32,97,108,108,32,99,111,109,109,97,110,100,45,108,105,110,101,32,102,108,97,103,115,0,0,0,0,0,0,0,114,101,97,100,32,120,109,108,32,102,105,108,101,32,102,111,114,32,115,116,97,116,101,115,0,0,0,0,0,0,0,0,78,0,0,0,0,0,0,0,67,97,110,110,111,116,32,105,110,105,116,105,97,108,105,122,101,32,117,110,105,113,117,101,32,116,104,101,32,100,121,110,97,109,105,99,32,115,116,97,116,101,32,115,101,108,101,99,116,105,111,110,46,32,85,115,101,32,45,108,118,32,76,79,71,95,68,83,83,32,116,111,32,115,101,101,32,116,104,101,32,115,119,105,116,99,104,105,110,103,32,115,116,97,116,101,32,115,101,116,46,0,0,0,100,97,115,115,108,32,119,105,116,104,32,105,110,116,101,114,110,97,108,32,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,0,0,119,105,108,108,32,111,118,101,114,114,105,100,101,32,116,104,101,32,118,97,114,105,97,98,108,101,115,32,111,114,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,115,101,116,116,105,110,103,115,32,105,110,32,116,104,101,32,88,77,76,32,115,101,116,117,112,32,102,105,108,101,32,119,105,116,104,32,116,104,101,32,118,97,108,117,101,115,32,102,114,111,109,32,116,104,101,32,102,105,108,101,0,0,0,0,0,0,101,120,116,101,114,110,97,108,0,0,0,0,0,0,0,0,60,47,118,97,114,105,97,98,108,101,115,62,10,0,0,0,105,110,118,97,108,105,100,32,99,111,109,109,97,110,100,32,108,105,110,101,32,111,112,116,105,111,110,58,32,45,104,101,108,112,61,37,115,0,0,0,97,100,100,105,116,105,111,110,97,108,32,105,110,102,111,114,109,97,116,105,111,110,32,97,98,111,117,116,32,116,104,101,32,122,101,114,111,99,114,111,115,115,105,110,103,115,0,0,110,121,115,116,114,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,0,37,46,49,54,103,44,0,0,100,97,115,115,108,32,119,105,116,104,32,99,111,108,111,114,101,100,32,115,121,109,98,111,108,105,99,32,106,97,99,111,98,105,97,110,0,0,0,0,70,76,65,71,95,85,78,75,78,79,87,78,0,0,0,0,68,65,83,83,76,45,45,32,32,82,85,78,32,84,69,82,77,73,78,65,84,69,68,46,32,65,80,80,65,82,69,78,84,32,73,78,70,73,78,73,84,69,32,76,79,79,80,0,68,65,83,83,76,45,45,32,32,65,84,32,67,85,82,82,69,78,84,32,84,32,40,61,82,49,41,32,32,53,48,48,32,83,84,69,80,83,0,0,111,118,101,114,114,105,100,101,32,116,104,101,32,118,97,114,105,97,98,108,101,115,32,111,114,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,115,101,116,116,105,110,103,115,32,105,110,32,116,104,101,32,88,77,76,32,115,101,116,117,112,32,102,105,108,101,0,117,110,102,111,114,109,97,116,116,101,100,0,0,0,0,0,60,118,97,114,105,97,98,108,101,115,62,10,0,0,0,0,100,101,116,97,105,108,100,32,102,108,97,103,45,100,101,115,99,114,105,112,116,105,111,110,32,102,111,114,58,32,60,45,37,115,61,118,97,108,117,101,62,32,111,114,32,60,45,37,115,32,118,97,108,117,101,62,10,37,115,0,0,0,0,0,63,63,63,0,0,0,0,0,110,112,115,116,114,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,0,108,97,109,98,100,97,32,61,32,37,103,32,100,111,110,101,0,0,0,0,0,0,0,0,110,111,32,101,108,101,109,101,110,116,32,102,111,117,110,100,0,0,0,0,0,0,0,0,86,97,114,105,97,98,108,101,32,78,114,46,71,98,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,78,114,46,71,98,32,62,61,32,45,49,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,0,0,0,37,35,46,42,69,0,0,0,100,97,115,115,108,32,119,105,116,104,32,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,0,0,0,104,101,108,112,0,0,0,0,68,65,83,83,76,45,45,32,32,82,69,80,69,65,84,69,68,32,79,67,67,85,82,82,69,78,67,69,83,32,79,70,32,73,76,76,69,71,65,76,32,73,78,80,85,84,0,0,111,117,116,112,117,116,32,116,104,101,32,118,97,114,105,97,98,108,101,115,32,97,44,32,98,32,97,110,100,32,99,32,97,116,32,116,104,101,32,101,110,100,32,111,102,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,116,111,32,116,104,101,32,115,116,97,110,100,97,114,100,32,111,117,116,112,117,116,0,0,0,0,0,102,111,114,109,97,116,116,101,100,0,0,0,0,0,0,0,114,43,98,0,0,0,0,0,76,79,71,95,68,69,66,85,71,0,0,0,0,0,0,0,60,47,112,114,111,102,105,108,105,110,103,100,97,116,97,104,101,97,100,101,114,62,10,0,100,101,116,97,105,108,100,32,102,108,97,103,45,100,101,115,99,114,105,112,116,105,111,110,32,102,111,114,58,32,60,45,37,115,62,10,37,115,0,0,97,100,100,105,116,105,111,110,97,108,32,115,116,97,116,105,115,116,105,99,115,32,97,98,111,117,116,32,116,105,109,101,114,47,101,118,101,110,116,115,47,115,111,108,118,101,114,0,110,121,98,111,111,108,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,104,111,109,111,116,111,112,121,32,112,114,111,99,101,115,115,0,0,0,0,0,0,0,0,116,105,99,107,95,116,112,32,33,61,32,48,0,0,0,0,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,69,120,97,109,112,108,101,115,47,85,116,105,108,105,116,105,101,115,47,78,111,110,108,105,110,101,97,114,82,101,115,105,115,116,111,114,46,109,111,0,0,0,0,0,100,97,115,115,108,32,119,105,116,104,32,115,121,109,98,111,108,105,99,32,106,97,99,111,98,105,97,110,0,0,0,0,32,32,32,32,32,32,32,32,32,84,79,79,32,78,69,65,82,32,84,79,32,84,72,69,32,73,78,73,84,73,65,76,32,80,79,73,78,84,0,0,100,111,32,110,111,116,32,101,109,105,116,32,97,110,121,32,114,101,115,117,108,116,115,32,116,111,32,116,104,101,32,114,101,115,117,108,116,32,102,105,108,101,0,0,0,0,0,0,100,105,114,101,99,116,0,0,60,112,114,111,102,105,108,105,110,103,100,97,116,97,104,101,97,100,101,114,62,10,0,0,91,117,110,107,110,111,119,110,32,102,108,97,103,45,116,121,112,101,93,32,60,45,37,115,62,0,0,0,0,0,0,0,102,105,110,97,108,32,115,111,108,117,116,105,111,110,32,111,102,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,0,0,0,0,110,112,98,111,111,108,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,100,105,114,101,99,116,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0,0,0,100,101,115,99,114,105,112,116,105,111,110,0,0,0,0,0,86,97,114,105,97,98,108,101,32,78,114,46,71,97,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,78,114,46,71,97,32,62,61,32,45,49,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,0,0,0,100,97,115,115,108,32,119,105,116,104,111,117,116,32,105,110,116,101,114,110,97,108,32,114,111,111,116,32,102,105,110,100,105,110,103,0,0,0,0,0,68,65,83,83,76,45,45,32,32,79,78,69,32,79,82,32,77,79,82,69,32,67,79,77,80,79,78,69,78,84,83,32,79,70,32,71,32,72,65,83,32,65,32,82,79,79,84,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,110,111,110,108,105,110,101,97,114,32,115,111,108,118,101,114,0,0,0,0,102,111,114,109,97,116,32,116,111,111,32,99,111,109,112,108,105,99,97,116,101,100,58,10,0,0,0,0,0,0,0,0,115,101,113,117,101,110,116,105,97,108,0,0,0,0,0,0,105,110,118,97,108,105,100,32,108,105,115,116,45,110,111,100,101,0,0,0,0,0,0,0,60,47,109,111,100,101,108,105,110,102,111,95,101,120,116,62,10,0,0,0,0,0,0,0,60,45,37,115,61,118,97,108,117,101,62,32,111,114,32,60,45,37,115,32,118,97,108,117,101,62,10,32,32,37,115,0,97,100,100,105,116,105,111,110,97,108,32,105,110,102,111,114,109,97,116,105,111,110,32,97,98,111,117,116,32,115,111,108,118,101,114,32,112,114,111,99,101,115,115,0,0,0,0,0,110,121,105,110,116,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,0,108,97,109,98,100,97,0,0,114,98,0,0,0,0,0,0,86,97,114,105,97,98,108,101,32,67,50,46,67,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,67,50,46,67,32,62,61,32,48,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,0,0,0,0,0,0,112,114,101,102,105,120,32,109,117,115,116,32,110,111,116,32,98,101,32,98,111,117,110,100,32,116,111,32,111,110,101,32,111,102,32,116,104,101,32,114,101,115,101,114,118,101,100,32,110,97,109,101,115,112,97,99,101,32,110,97,109,101,115,0,100,97,115,115,108,32,119,105,116,104,32,99,111,108,111,114,101,100,32,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,44,32,119,105,116,104,32,105,110,116,101,114,118,97,108,32,114,111,111,116,32,102,105,110,100,105,110,103,0,0,0,0,0,0,0,117,110,98,97,108,97,110,99,101,100,32,99,111,109,109,97,110,100,32,108,105,110,101,32,102,108,97,103,32,115,116,114,117,99,116,117,114,101,58,32,70,76,65,71,95,68,69,83,67,0,0,0,0,0,0,0,37,115,58,32,69,114,114,111,114,58,32,102,97,105,108,101,100,32,116,111,32,114,101,97,100,32,116,104,101,32,88,77,76,32,102,105,108,101,32,37,115,58,32,37,115,32,97,116,32,108,105,110,101,32,37,108,117,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,78,71,32,40,61,73,49,41,32,46,76,84,46,32,48,0,0,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,111,117,116,112,117,116,32,102,111,114,109,97,116,32,111,102,32,116,104,101,32,109,101,97,115,117,114,101,32,116,105,109,101,32,102,117,110,99,116,105,111,110,97,108,105,116,121,0,0,0,0,0,115,101,116,32,116,101,114,109,105,110,97,108,32,115,118,103,10,0,0,0,0,0,0,0,119,114,105,116,101,32,105,110,32,106,97,99,91,37,100,93,45,91,37,100,44,37,100,93,61,37,103,32,102,114,111,109,32,114,111,119,91,37,100,93,61,37,103,0,0,0,0,0,37,45,49,56,115,32,91,37,115,93,0,0,0,0,0,0,119,114,105,116,105,110,103,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,69,114,114,111,114,58,32,102,97,105,108,101,100,32,116,111,32,114,101,97,100,32,116,104,101,32,88,77,76,32,102,105,108,101,32,37,115,58,32,37,115,32,97,116,32,108,105,110,101,32,37,108,117,10,0,0,0,0,0,0,0,0,69,114,114,111,114,44,32,99,111,117,108,100,110,39,116,32,99,114,101,97,116,101,32,111,117,116,112,117,116,32,102,105,108,101,58,32,91,37,115,93,32,98,101,99,97,117,115,101,32,111,102,32,37,115,0,0,100,101,115,99,114,105,112,116,105,111,110,0,0,0,0,0,119,0,0,0,0,0,0,0,119,116,0,0,0,0,0,0,69,114,114,111,114,32,105,110,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,46,32,73,110,99,111,110,115,105,115,116,101,110,116,32,105,110,105,116,105,97,108,32,99,111,110,100,105,116,105,111,110,115,46,0,0,0,0,0,0,0,124,32,124,32,91,37,108,100,93,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,37,115,40,115,116,97,114,116,61,37,103,44,32,110,111,109,105,110,97,108,61,37,103,41,32,61,32,37,103,0,0,60,111,100,101,84,105,109,101,84,105,99,107,115,62,37,108,117,60,47,111,100,101,84,105,109,101,84,105,99,107,115,62,10,0,0,0,0,0,0,0,60,45,37,115,62,10,32,32,37,115,0,0,0,0,0,0,97,100,100,105,116,105,111,110,97,108,32,105,110,102,111,114,109,97,116,105,111,110,32,97,98,111,117,116,32,115,105,109,117,108,97,116,105,111,110,32,112,114,111,99,101,115,115,0,110,112,105,110,116,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,0,37,115,44,0,0,0,0,0,108,101,97,115,116,32,115,113,117,97,114,101,32,118,97,108,117,101,58,32,37,103,0,0,69,114,114,111,114,44,32,115,105,110,103,117,108,97,114,32,74,97,99,111,98,105,97,110,32,102,111,114,32,100,121,110,97,109,105,99,32,115,116,97,116,101,32,115,101,108,101,99,116,105,111,110,32,97,116,32,116,105,109,101,32,37,102,10,85,115,101,32,45,108,118,32,76,79,71,95,68,83,83,95,74,65,67,32,116,111,32,103,101,116,32,116,104,101,32,74,97,99,111,98,105,97,110,0,70,105,110,105,115,104,101,100,0,0,0,0,0,0,0,0,86,97,114,105,97,98,108,101,32,67,49,46,67,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,67,49,46,67,32,62,61,32,48,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,0,0,0,0,0,0,114,101,115,101,114,118,101,100,32,112,114,101,102,105,120,32,40,120,109,108,110,115,41,32,109,117,115,116,32,110,111,116,32,98,101,32,100,101,99,108,97,114,101,100,32,111,114,32,117,110,100,101,99,108,97,114,101,100,0,0,0,0,0,0,117,110,107,110,111,119,110,0,68,65,83,83,76,45,45,32,32,84,79,85,84,32,40,61,82,49,41,32,73,83,32,69,81,85,65,76,32,84,79,32,84,32,40,61,82,50,41,0,91,115,116,114,105,110,103,32,108,105,115,116,93,32,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,108,111,103,103,105,110,103,32,108,101,118,101,108,0,114,101,97,100,105,110,103,0,60,111,100,101,84,105,109,101,62,37,102,60,47,111,100,101,84,105,109,101,62,10,0,0,117,115,97,103,101,58,32,37,115,0,0,0,0,0,0,0,111,117,116,112,117,116,115,32,114,101,115,105,100,117,97,108,115,32,111,102,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,0,110,112,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,0,0,0,0,119,116,0,0,0,0,0,0,117,116,105,108,47,114,116,99,108,111,99,107,46,99,0,0,86,97,114,105,97,98,108,101,32,71,46,84,95,114,101,102,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97])
.concat([120,93,32,105,110,116,101,114,118,97,108,58,32,71,46,84,95,114,101,102,32,62,61,32,48,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,111,102,102,115,101,116,32,118,97,108,117,101,32,102,111,114,32,116,104,101,32,110,101,120,116,32,115,116,101,112,58,32,37,46,49,48,102,0,0,0,114,101,115,101,114,118,101,100,32,112,114,101,102,105,120,32,40,120,109,108,41,32,109,117,115,116,32,110,111,116,32,98,101,32,117,110,100,101,99,108,97,114,101,100,32,111,114,32,98,111,117,110,100,32,116,111,32,97,110,111,116,104,101,114,32,110,97,109,101,115,112,97,99,101,32,110,97,109,101,0,84,104,101,32,99,111,100,101,32,104,97,115,32,101,110,99,111,117,110,116,101,114,101,100,32,116,114,111,117,98,108,101,32,102,114,111,109,32,119,104,105,99,104,32,105,116,32,99,97,110,110,111,116,32,114,101,99,111,118,101,114,46,0,0,68,65,83,83,76,45,45,32,32,77,85,32,40,61,73,49,41,32,73,76,76,69,71,65,76,46,32,69,73,84,72,69,82,32,46,76,84,46,32,48,32,79,82,32,46,71,84,46,32,78,69,81,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,109,101,116,104,111,100,32,102,111,114,32,105,112,111,112,116,0,0,0,0,0,0,108,97,116,101,108,121,32,37,115,32,37,115,32,37,115,32,37,115,0,0,0,0,0,0,110,101,119,116,111,110,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,60,109,111,100,101,108,105,110,102,111,95,101,120,116,62,10,0,0,0,0,0,0,0,0,114,101,99,111,103,110,105,122,101,100,32,115,111,108,118,101,114,58,32,37,115,0,0,0,111,117,116,112,117,116,115,32,116,104,101,32,106,97,99,111,98,105,97,110,32,111,102,32,110,111,110,108,105,110,101,97,114,32,115,121,115,116,101,109,115,0,0,0,0,0,0,0,110,121,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,108,100,0,0,0,0,0,0,37,115,95,104,111,109,111,116,111,112,121,46,99,115,118,0,86,97,114,105,97,98,108,101,32,71,46,84,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,71,46,84,32,62,61,32,48,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,99,97,110,110,111,116,32,115,117,115,112,101,110,100,32,105,110,32,101,120,116,101,114,110,97,108,32,112,97,114,97,109,101,116,101,114,32,101,110,116,105,116,121,0,0,0,0,0,68,68,65,83,83,76,32,102,97,105,108,101,100,32,116,111,32,99,111,109,112,117,116,101,32,116,104,101,32,105,110,105,116,105,97,108,32,89,80,82,73,77,69,46,0,0,0,0,118,101,114,98,111,115,101,32,108,111,103,103,105,110,103,32,111,102,32,110,111,110,108,105,110,101,97,114,32,115,121,115,116,101,109,115,0,0,0,0,68,65,83,83,76,45,45,32,32,77,76,32,40,61,73,49,41,32,73,76,76,69,71,65,76,46,32,69,73,84,72,69,82,32,46,76,84,46,32,48,32,79,82,32,46,71,84,46,32,78,69,81,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,108,105,110,101,97,114,32,115,111,108,118,101,114,32,109,101,116,104,111,100,0,0,0,0,0,0,0,0,115,116,97,116,101,115,95,114,105,103,104,116,0,0,0,0,108,97,115,116,32,102,111,114,109,97,116,58,32,37,115,10,0,0,0,0,0,0,0,0,60,47,109,111,100,101,108,105,110,102,111,62,10,0,0,0,124,32,37,45,49,56,115,32,91,37,115,93,0,0,0,0,76,79,71,95,85,78,75,78,79,87,78,0,0,0,0,0,110,120,32,105,110,32,115,101,116,117,112,32,102,105,108,101,58,32,37,108,100,32,102,114,111,109,32,109,111,100,101,108,32,99,111,100,101,58,32,37,100,0,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,44,37,115,61,34,37,115,34,0,0,0,0,0,0,0,0,91,108,105,110,101,93,32,37,108,100,32,124,32,91,102,105,108,101,93,32,37,115,0,0,86,97,114,105,97,98,108,101,32,82,111,46,84,95,114,101,102,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,82,111,46,84,95,114,101,102,32,62,61,32,48,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,0,0,0,0,0,0,112,97,114,115,105,110,103,32,102,105,110,105,115,104,101,100,0,0,0,0,0,0,0,0,73,82,69,83,32,101,113,117,97,108,32,116,111,32,45,50,32,119,97,115,32,101,110,99,111,117,110,116,101,114,101,100,32,97,110,100,32,99,111,110,116,114,111,108,32,105,115,32,98,101,105,110,103,32,114,101,116,117,114,110,101,100,32,116,111,32,116,104,101,32,99,97,108,108,105,110,103,32,112,114,111,103,114,97,109,46,0,0,108,111,103,103,105,110,103,32,102,111,114,32,110,111,110,108,105,110,101,97,114,32,115,121,115,116,101,109,115,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,115,101,101,32,108,97,115,116,32,119,97,114,110,105,110,103,0,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,73,78,70,79,40,52,41,61,49,32,65,78,68,32,84,83,84,79,80,32,40,61,82,49,41,32,66,69,72,73,78,68,32,84,32,40,61,82,50,41,0,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,97,32,116,105,109,101,32,119,104,101,114,101,32,116,104,101,32,108,105,110,101,97,114,105,122,97,116,105,111,110,32,111,102,32,116,104,101,32,109,111,100,101,108,32,115,104,111,117,108,100,32,98,101,32,112,101,114,102,111,114,109,101,100,0,97,112,112,97,114,101,110,116,32,115,116,97,116,101,58,32,105,110,116,101,114,110,97,108,32,73,47,79,10,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,82,101,102,101,114,101,110,99,101,100,32,39,37,115,39,32,116,104,97,116,32,119,97,115,32,110,111,116,32,100,101,99,108,97,114,101,100,32,97,115,32,60,118,97,114,105,97,98,108,101,62,0,0,0,0,0,60,109,97,120,84,105,109,101,62,37,46,57,102,60,47,109,97,120,84,105,109,101,62,10,0,0,0,0,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,111,112,116,105,111,110,32,45,115,32,37,115,0,0,0,0,0,0,0,69,114,114,111,114,44,32,105,110,112,117,116,32,100,97,116,97,32,102,105,108,101,32,100,111,101,115,32,110,111,116,32,109,97,116,99,104,32,109,111,100,101,108,46,0,0,0,0,80,0,0,0,0,0,0,0,35,35,35,32,69,78,68,32,73,78,73,84,73,65,76,73,90,65,84,73,79,78,32,35,35,35,0,0,0,0,0,0,44,37,115,61,37,105,0,0,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,73,110,116,101,114,102,97,99,101,115,46,109,111,0,0,0,0,0,0,0,112,97,114,115,105,110,103,32,97,98,111,114,116,101,100,0,65,32,77,111,100,101,108,105,99,97,32,97,115,115,101,114,116,32,112,114,101,118,101,110,116,115,32,116,104,101,32,105,110,116,101,103,114,97,116,111,114,32,116,111,32,99,111,110,116,105,110,117,101,46,32,70,111,114,32,109,111,114,101,32,105,110,102,111,114,109,97,116,105,111,110,32,117,115,101,32,45,108,118,32,76,79,71,95,68,68,65,83,82,84,0,0,118,101,114,98,111,115,101,32,108,111,103,103,105,110,103,32,111,102,32,108,105,110,101,97,114,32,115,121,115,116,101,109,115,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,84,79,85,84,32,40,61,82,49,41,32,84,79,79,32,67,76,79,83,69,32,84,79,32,84,32,40,61,82,50,41,32,84,79,32,83,84,65,82,84,32,73,78,84,69,71,82,65,84,73,79,78,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,111,112,116,105,109,105,122,97,116,105,111,110,32,109,101,116,104,111,100,0,0,40,117,110,110,97,109,101,100,41,10,0,0,0,0,0,0,84,79,68,79,58,32,83,101,116,32,109,101,32,117,112,33,33,33,0,0,0,0,0,0,60,110,117,109,83,116,101,112,62,37,100,60,47,110,117,109,83,116,101,112,62,10,0,0,65,108,108,111,99,97,116,101,100,32,115,105,109,117,108,97,116,105,111,110,32,114,101,115,117,108,116,32,100,97,116,97,32,115,116,111,114,97,103,101,32,102,111,114,32,109,101,116,104,111,100,32,39,37,115,39,32,97,110,100,32,102,105,108,101,61,39,37,115,39,0,0,110,117,109,98,101,114,79,102,83,116,114,105,110,103,65,108,103,101,98,114,97,105,99,86,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,111,112,116,105,111,110,32,45,105,105,109,0,44,37,115,61,37,108,105,0,86,97,114,105,97,98,108,101,32,82,111,46,84,32,111,117,116,32,111,102,32,91,109,105,110,44,32,109,97,120,93,32,105,110,116,101,114,118,97,108,58,32,82,111,46,84,32,62,61,32,48,46,48,32,104,97,115,32,118,97,108,117,101,58,32,0,0,0,0,0,0,0,112,97,114,115,101,114,32,110,111,116,32,115,117,115,112,101,110,100,101,100,0,0,0,0,84,104,101,32,99,111,114,114,101,99,116,111,114,32,99,111,117,108,100,32,110,111,116,32,99,111,110,118,101,114,103,101,46,32,84,104,101,114,101,32,119,101,114,101,32,114,101,112,101,97,116,101,100,32,101,114,114,111,114,32,116,101,115,116,32,102,97,105,108,117,114,101,115,32,105,110,32,116,104,105,115,32,115,116,101,112,46,0,108,111,103,103,105,110,103,32,102,111,114,32,108,105,110,101,97,114,32,115,121,115,116,101,109,115,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,83,79,77,69,32,69,76,69,77,69,78,84,32,79,70,32,87,84,32,73,83,32,46,76,69,46,32,48,46,48,0,80,0,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,115,112,101,99,105,102,121,32,105,110,116,101,114,97,99,116,105,118,101,32,115,105,109,117,108,97,116,105,111,110,0,0,110,97,109,101,100,32,37,115,10,0,0,0,0,0,0,0,35,70,73,88,77,69,35,0,60,116,111,116,97,108,83,116,101,112,115,84,105,109,101,62,37,102,60,47,116,111,116,97,108,83,116,101,112,115,84,105,109,101,62,10,0,0,0,0,85,110,107,110,111,119,110,32,111,117,116,112,117,116,32,102,111,114,109,97,116,58,32,0,110,117,109,98,101,114,79,102,83,116,114,105,110,103,80,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,0,111,112,116,105,109,105,122,97,116,105,111,110,32,109,101,116,104,111,100,58,32,32,32,37,45,49,53,115,32,91,37,115,93,0,0,0,0,0,0,0,44,37,115,61,37,46,50,48,103,0,0,0,0,0,0,0,103,0,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,112,97,114,115,101,114,32,115,117,115,112,101,110,100,101,100,0,0,0,0,0,0,0,0,84,104,101,32,109,97,116,114,105,120,32,111,102,32,112,97,114,116,105,97,108,32,100,101,114,105,118,97,116,105,118,101,115,32,105,115,32,115,105,110,103,117,108,97,114,46,0,0,111,117,116,112,117,116,115,32,116,104,101,32,106,97,99,111,98,105,97,110,32,109,97,116,114,105,120,32,117,115,101,100,32,98,121,32,100,97,115,115,108,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,73,78,70,79,40,56,41,61,49,32,65,78,68,32,72,48,61,48,46,48,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,35,46,42,102,0,0,0,91,105,110,116,93,32,100,101,102,97,117,108,116,58,32,49,0,0,0,0,0,0,0,0,97,112,112,97,114,101,110,116,32,115,116,97,116,101,58,32,117,110,105,116,32,37,100,32,0,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,60,118,97,114,62,45,116,97,103,32,100,105,100,32,110,111,116,32,115,101,116,32,110,97,109,101,32,97,110,100,32,99,111,109,109,101,110,116,0,0,60,116,111,116,97,108,84,105,109,101,62,37,102,60,47,116,111,116,97,108,84,105,109,101,62,10,0,0,0,0,0,0,112,108,116,0,0,0,0,0,110,117,109,98,101,114,79,102,66,111,111,108,101,97,110,65,108,103,101,98,114,97,105,99,86,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,109,101,116,104,111,100,58,32,37,45,49,53,115,32,91,37,115,93,0,0,0,0,0,0,0,116,105,109,101,61,37,46,50,48,103,0,0,0,0,0,0,76,79,71,95,68,68,65,83,82,84,0,0,0,0,0,0,116,111,116,97,108,95,116,112,32,33,61,32,48,0,0,0,77,111,100,101,108,105,99,97,46,69,108,101,99,116,114,105,99,97,108,46,65,110,97,108,111,103,46,69,120,97,109,112,108,101,115,46,67,104,117,97,67,105,114,99,117,105,116,46,99,0,0,0,0,0,0,0,84,104,101,32,99,111,114,114,101,99,116,111,114,32,99,111,117,108,100,32,110,111,116,32,99,111,110,118,101,114,103,101,46,0,0,0,0,0,0,0,105,108,108,101,103,97,108,32,99,104,97,114,97,99,116,101,114,40,115,41,32,105,110,32,112,117,98,108,105,99,32,105,100,0,0,0,0,0,0,0,109,111,114,101,32,105,110,102,111,114,109,97,116,105,111,110,32,102,114,111,109,32,73,112,111,112,116,0,0,0,0,0,68,65,83,83,76,45,45,32,32,84,79,85,84,32,40,61,82,49,41,32,66,69,72,73,78,68,32,84,32,40,61,82,50,41,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,91,100,111,117,98,108,101,93,32,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,97,32,116,105,109,101,32,102,111,114,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,111,102,32,116,104,101,32,109,111,100,101,108,0,0,0,0,0,37,115,58,32,37,115,10,0,99,111,109,109,101,110,116,0,60,108,105,110,101,97,114,105,122,101,84,105,109,101,62,37,102,60,47,108,105,110,101,97,114,105,122,101,84,105,109,101,62,10,0,0,0,0,0,0,109,97,116,0,0,0,0,0,110,117,109,98,101,114,79,102,66,111,111,108,101,97,110,80,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,117,110,102,111,114,109,97,116,116,101,100,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0,0,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,111,112,116,105,111,110,32,45,105,111,109,32,37,115,0,0,0,0,0,44,0,0,0,0,0,0,0,110,97,109,101,0,0,0,0,84,101,109,112,101,114,97,116,117,114,101,32,111,117,116,115,105,100,101,32,115,99,111,112,101,32,111,102,32,109,111,100,101,108,33,0,0,0,0,0,114,101,99,101,110,100,0,0,68,68,65,83,83,76,32,104,97,100,32,114,101,112,101,97,116,101,100,32,101,114,114,111,114,32,116,101,115,116,32,102,97,105,108,117,114,101,115,32,111,110,32,116,104,101,32,108,97,115,116,32,97,116,116,101,109,112,116,101,100,32,115,116,101,112,46,0,0,0,0,0,116,101,120,116,32,100,101,99,108,97,114,97,116,105,111,110,32,110,111,116,32,119,101,108,108,45,102,111,114,109,101,100,0,0,0,0,0,0,0,0,97,100,100,105,116,105,111,110,97,108,32,105,110,102,111,114,109,97,116,105,111,110,32,100,117,114,105,110,103,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,0,0,0,0,68,65,83,83,76,45,45,32,32,72,77,65,88,32,40,61,82,49,41,32,46,76,84,46,32,48,46,48,0,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,109,101,116,104,111,100,0,0,0,0,0,0,0,98,97,100,32,115,116,114,105,110,103,0,0,0,0,0,0,37,115,58,32,101,110,100,32,111,102,32,102,105,108,101,10,0,0,0,0,0,0,0,0,83,79,77,69,32,78,73,67,69,32,69,81,85,65,84,73,79,78,32,78,65,77,69,32,40,116,111,32,98,101,32,115,101,116,32,97,32,108,105,116,116,108,101,32,108,97,116,101,114,41,0,0,0,0,0,0,105,110,118,97,108,105,100,32,102,105,115,116,32,108,105,115,116,45,112,111,105,110,116,101,114,0,0,0,0,0,0,0,60,111,117,116,112,117,116,84,105,109,101,62,37,102,60,47,111,117,116,112,117,116,84,105,109,101,62,10,0,0,0,0,99,115,118,0,0,0,0,0,110,117,109,98,101,114,79,102,73,110,116,101,103,101,114,65,108,103,101,98,114,97,105,99,86,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,115,101,101,32,108,97,115,116,32,119,97,114,110,105,110,103,0,0,0,0,0,0,0,0,83,116,97,114,116,32,110,117,109,101,114,105,99,97,108,32,115,111,108,118,101,114,32,102,114,111,109,32,37,103,32,116,111,32,37,103,0,0,0,0,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,66,97,115,105,99,46,109,111,0,0,0,0,84,104,101,32,101,114,114,111,114,32,116,111,108,101,114,97,110,99,101,115,32,97,114,101,32,116,111,111,32,115,116,114,105,110,103,101,110,116,0,0,88,77,76,32,100,101,99,108,97,114,97,116,105,111,110,32,110,111,116,32,119,101,108,108,45,102,111,114,109,101,100,0,118,101,114,98,111,115,101,32,108,111,103,103,105,110,103,32,111,102,32,101,118,101,110,116,32,115,121,115,116,101,109,0,117,110,98,97,108,97,110,99,101,100,32,99,111,109,109,97,110,100,32,108,105,110,101,32,102,108,97,103,32,115,116,114,117,99,116,117,114,101,58,32,70,76,65,71,95,78,65,77,69,0,0,0,0,0,0,0,68,117,109,109,121,32,101,113,117,97,116,105,111,110,32,115,111,32,119,101,32,99,97,110,32,105,110,100,101,120,32,102,114,111,109,32,49,0,0,0,68,65,83,83,76,45,45,32,32,73,78,70,79,40,52,41,32,61,32,49,32,65,78,68,32,84,83,84,79,80,32,40,61,82,49,41,32,66,69,72,73,78,68,32,84,79,85,84,32,40,61,82,50,41,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,97,105,108,101,100,32,116,111,32,111,112,101,110,32,37,115,58,32,37,115,10,0,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,97,110,32,101,120,116,101,114,110,97,108,32,102,105,108,101,32,102,111,114,32,116,104,101,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,111,102,32,116,104,101,32,109,111,100,101,108,0,0,0,0,115,101,101,100,58,32,100,97,116,97,45,62,115,105,109,117,108,97,116,105,111,110,73,110,102,111,46,97,110,97,108,121,116,105,99,74,97,99,111,98,105,97,110,115,91,105,110,100,101,120,93,46,115,101,101,100,86,97,114,115,91,37,100,93,61,32,37,102,0,0,0,0,99,117,114,114,101,110,116,32,111,112,116,105,111,110,115,32,97,114,101,58,0,0,0,0,37,115,58,32,105,108,108,101,103,97,108,32,101,114,114,111,114,32,110,117,109,98,101,114,32,37,100,10,0,0,0,0,97,98,115,86,97,114,73,110,100,101,120,32,62,32,48,32,38,38,32,97,98,115,86,97,114,73,110,100,101,120,32,60,61,32,114,101,97,100,101,114,45,62,110,118,97,114,0,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,69,114,114,111,114,58,32,99,111,117,108,100,110,39,116,32,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,102,111,114,32,116,104,101,32,88,77,76,32,112,97,114,115,101,114,33,0,0,0,119,0,0,0,0,0,0,0,110,97,109,101,0,0,0,0,37,115,95,105,110,105,116,80,97,116,104,46,99,115,118,0,69,114,114,111,114,32,105,110,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,46,32,83,111,108,118,101,114,32,105,116,101,114,97,116,101,100,32,37,100,32,116,105,109,101,115,32,119,105,116,104,111,117,116,32,102,105,110,100,105,110,103,32,97,32,115,111,108,117,116,105,111,110,0,0,0,0,37,115,58,32,73,110,102,111,32,88,77,76,32,37,115,32,103,111,116,32,101,113,117,97,116,105,111,110,32,119,105,116,104,32,105,110,100,101,120,32,37,108,100,44,32,101,120,112,101,99,116,101,100,32,37,108,100,0,0,0,0,0,0,0,124,32,124,32,91,37,108,100,93,32,82,101,97,108,32,37,115,40,115,116,97,114,116,61,37,103,44,32,110,111,109,105,110,97,108,61,37,103,41,32,61,32,37,103,0,0,0,0,60,101,118,101,110,116,84,105,109,101,62,37,102,60,47,101,118,101,110,116,84,105,109,101,62,10,0,0,0,0,0,0,101,109,112,116,121,0,0,0,110,117,109,98,101,114,79,102,73,110,116,101,103,101,114,80,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,124,32,37,45,49,53,115,32,91,37,115,93,0,0,0,0,82,101,99,111,103,110,105,122,101,100,32,115,111,108,118,101,114,58,32,105,110,108,105,110,101,45,114,117,110,103,101,107,117,116,116,97,44,32,98,117,116,32,116,104,101,32,101,120,101,99,117,116,97,98,108,101,32,119,97,115,32,110,111,116,32,99,111,109,112,105,108,101,100,32,119,105,116,104,32,115,117,112,112,111,114,116,32,102,111,114,32,105,116,46,32,67,111,109,112,105,108,101,32,119,105,116,104,32,45,68,95,79,77,67,95,73,78,76,73,78,69,95,82,75,46,0,0,0,108,101,97,115,116,32,115,113,117,97,114,101,32,118,97,108,117,101,58,32,37,103,32,91,115,99,97,108,101,100,58,32,37,103,93,0,0,0,0,0,87,114,111,116,101,32,112,97,114,97,109,101,116,101,114,115,32,116,111,32,116,104,101,32,102,105,108,101,32,97,102,116,101,114,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,40,102,111,114,32,111,117,116,112,117,116,32,102,111,114,109,97,116,115,32,116,104,97,116,32,115,117,112,112,111,114,116,32,116,104,105,115,41,0,0,0,0,0,0,0,0,109,111,100,101,108,32,108,105,110,101,97,114,95,77,111,100,101,108,105,99,97,95,69,108,101,99,116,114,105,99,97,108,95,65,110,97,108,111,103,95,69,120,97,109,112,108,101,115,95,67,104,117,97,67,105,114,99,117,105,116,10,32,32,112,97,114,97,109,101,116,101,114,32,73,110,116,101,103,101,114,32,110,32,61,32,51,59,32,47,47,32,115,116,97,116,101,115,32,10,32,32,112,97,114,97,109,101,116,101,114,32,73,110,116,101,103,101,114,32,107,32,61,32,48,59,32,47,47,32,116,111,112,45,108,101,118,101,108,32,105,110,112,117,116,115,32,10,32,32,112,97,114,97,109,101,116,101,114,32,73,110,116,101,103,101,114,32,108,32,61,32,48,59,32,47,47,32,116,111,112,45,108,101,118,101,108,32,111,117,116,112,117,116,115,32,10,32,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,120,48,91,51,93,32,61,32,123,37,115,125,59,10,32,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,117,48,91,48,93,32,61,32,123,37,115,125,59,10,32,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,65,91,51,44,51,93,32,61,32,91,37,115,93,59,10,32,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,66,91,51,44,48,93,32,61,32,122,101,114,111,115,40,51,44,48,41,59,37,115,10,32,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,67,91,48,44,51,93,32,61,32,122,101,114,111,115,40,48,44,51,41,59,37,115,10,32,32,112,97,114,97,109,101,116,101,114,32,82,101,97,108,32,68,91,48,44,48,93,32,61,32,122,101,114,111,115,40,48,44,48,41,59,37,115,10,32,32,82,101,97,108,32,120,91,51,93,40,115,116,97,114,116,61,120,48,41,59,10,32,32,105,110,112,117,116,32,82,101,97,108,32,117,91,48,93,59,10,32,32,111,117,116,112,117,116,32,82,101,97,108,32,121,91,48,93,59,10,10,32,32,82,101,97,108,32,120,95,80,67,50,80,118,32,61,32,120,91,49,93,59,10,32,32,82,101,97,108,32,120,95,80,67,49,80,118,32,61,32,120,91,50,93,59,10,32,32,82,101,97,108,32,120,95,80,76,80,105,32,61,32,120,91,51,93,59,10,32,32,32,32,32,32,10,101,113,117,97,116,105,111,110,10,32,32,100,101,114,40,120,41,32,61,32,65,32,42,32,120,32,43,32,66,32,42,32,117,59,10,32,32,121,32,61,32,67,32,42,32,120,32,43,32,68,32,42,32,117,59,10,101,110,100,32,108,105,110,101,97,114,95,77,111,100,101,108,105,99,97,95,69,108,101,99,116,114,105,99,97,108,95,65,110,97,108,111,103,95,69,120,97,109,112,108,101,115,95,67,104,117,97,67,105,114,99,117,105,116,59,10,0,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,102,111,114,109,97,116,0,105,110,99,111,109,112,108,101,116,101,32,109,97,114,107,117,112,32,105,110,32,112,97,114,97,109,101,116,101,114,32,101,110,116,105,116,121,0,0,0,98,105,110,84,114,97,110,115,0,0,0,0,0,0,0,0,97,100,100,105,116,105,111,110,97,108,32,105,110,102,111,114,109,97,116,105,111,110,32,100,117,114,105,110,103,32,101,118,101,110,116,32,105,116,101,114,97,116,105,111,110,0,0,0,68,65,83,83,76,45,45,32,32,65,76,76,32,69,76,69,77,69,78,84,83,32,79,70,32,82,84,79,76,32,65,78,68,32,65,84,79,76,32,65,82,69,32,90,69,82,79,0,101,110,100,102,105,108,101,0,103,101,116,32,100,101,116,97,105,108,101,100,32,105,110,102,111,114,109,97,116,105,111,110,32,116,104,97,116,32,115,112,101,99,105,102,105,101,115,32,116,104,101,32,99,111,109,109,97,110,100,45,108,105,110,101,32,102,108,97,103,0,0,0,110,109,76,98,117,102,32,111,118,101,114,102,108,111,119,0,117,116,105,108,47,114,101,97,100,95,109,97,116,108,97,98,52,46,99,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,37,115,58,32,73,110,102,111,32,88,77,76,32,37,115,32,99,111,110,116,97,105,110,101,100,32,101,113,117,97,116,105,111,110,32,119,105,116,104,111,117,116,32,105,110,100,101,120,0,0,0,0,0,0,0,0,60,105,110,105,116,84,105,109,101,62,37,102,60,47,105,110,105,116,84,105,109,101,62,10,0,0,0,0,0,0,0,0,115,118,103,0,0,0,0,0,110,117,109,98,101,114,79,102,82,101,97,108,80,97,114,97,109,101,116,101,114,115,0,0,83,105,109,117,108,97,116,105,111,110,32,116,105,109,101,32,91,115,93,0,0,0,0,0,99,117,114,114,101,110,116,32,111,112,116,105,111,110,115,32,97,114,101,58,0,0,0,0,105,110,108,105,110,101,45,114,117,110,103,101,107,117,116,116,97,0,0,0,0,0,0,0,67,49,46,118,32,62,32,78,114,46,86,101,0,0,0,0,84,105,109,101,32,109,101,97,115,117,114,101,109,101,110,116,115,32,111,117,116,112,117,116,32,102,105,108,101,32,37,115,32,99,111,117,108,100,32,110,111,116,32,98,101,32,111,112,101,110,101,100,58,32,37,115,0,0,0,0,0,0,0,0,115,116,97,114,116,105,111,0,83,101,116,32,116,111,108,101,114,97,110,99,101,32,102,111,114,32,122,101,114,111,45,99,114,111,115,115,105,110,103,32,104,121,115,116,101,114,101,115,105,115,32,116,111,58,32,37,101,0,0,0,0,0,0,0,70,105,110,105,115,104,101,100,32,68,68,65,83,82,84,32,115,116,101,112,46,0,0,0,109,117,115,116,32,110,111,116,32,117,110,100,101,99,108,97,114,101,32,112,114,101,102,105,120,0,0,0,0,0,0,0,111,117,116,112,117,116,115,32,106,97,99,111,98,105,97,110,32,111,102,32,116,104,101,32,100,121,110,97,109,105,99,32,115,116,97,116,101,32,115,101,108,101,99,116,105,111,110,0,68,65,83,83,76,45,45,32,32,83,79,77,69,32,69,76,69,77,69,78,84,32,79,70,32,65,84,79,76,32,73,83,32,46,76,84,46,32,48,0,118,97,108,117,101,32,115,112,101,99,105,102,105,101,115,32,97,32,110,101,119,32,115,101,116,117,112,32,88,77,76,32,102,105,108,101,32,116,111,32,116,104,101,32,103,101,110,101,114,97,116,101,100,32,115,105,109,117,108,97,116,105,111,110,32,99,111,100,101,0,0,0,110,111,110,45,112,111,115,105,116,105,118,101,32,114,101,99,111,114,100,32,110,117,109,98,101,114,0,0,0,0,0,0,73,109,112,108,101,109,101,110,116,97,116,105,111,110,32,101,114,114,111,114,58,32,85,110,107,110,111,119,110,32,99,97,115,101,0,0,0,0,0,0,107,105,110,115,111,108,0,0,105,110,100,101,120,0,0,0,60,112,114,101,105,110,105,116,84,105,109,101,62,37,102,60,47,112,114,101,105,110,105,116,84,105,109,101,62,10,0,0,95,112,114,111,102,46,112,108,116,0,0,0,0,0,0,0,110,117,109,98,101,114,79,102,82,101,97,108,65,108,103,101,98,114,97,105,99,86,97,114,105,97,98,108,101,115,0,0,116,105,109,101,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,111,112,116,105,111,110,32,45,105,105,109,32,37,115,0,0,0,0,0,82,101,99,111,103,110,105,122,101,100,32,115,111,108,118,101,114,58,32,105,110,108,105,110,101,45,101,117,108,101,114,44,32,98,117,116,32,116,104,101,32,101,120,101,99,117,116,97,98,108,101,32,119,97,115,32,110,111,116,32,99,111,109,112,105,108,101,100,32,119,105,116,104,32,115,117,112,112,111,114,116,32,102,111,114,32,105,116,46,32,67,111,109,112,105,108,101,32,119,105,116,104,32,45,68,95,79,77,67,95,73,78,76,73,78,69,95,69,85,76,69,82,46,0,0,0,0,0,119,95,101,100,44,32,117,110,101,120,112,101,99,116,101,100,32,99,111,100,101,58,32,37,100,10,0,0,0,0,0,0,91,37,100,93,32,37,115,0,67,49,46,118,32,60,32,40,45,78,114,46,86,101,41,0,91,37,100,93,32,37,115,0,101,114,114,111,114,32,97,108,108,111,99,97,116,105,110,103,32,101,120,116,101,114,110,97,108,32,111,98,106,101,99,116,115,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,49,48,32,43,32,117,105,32,60,32,100,97,115,115,108,68,97,116,97,45,62,108,105,119,0,0,0,0,0,0,0,0,117,110,98,111,117,110,100,32,112,114,101,102,105,120,0,0,111,117,116,112,117,116,115,32,105,110,102,111,114,109,97,116,105,111,110,32,97,98,111,117,116,32,100,121,110,97,109,105,99,32,115,116,97,116,101,32,115,101,108,101,99,116,105,111,110,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,83,79,77,69,32,69,76,69,77,69,78,84,32,79,70,32,82,84,79,76,32,73,83,32,46,76,84,46,32,48,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,100,117,109,112,115,32,116,104,101,32,99,112,117,45,116,105,109,101,32,105,110,116,111,32,116,104,101,32,114,101,115,117,108,116,115,45,102,105,108,101,0,0,0,0,0,0,0,0,115,105,109,117,108,97,116,105,111,110,47,115,111,108,118,101,114,47,101,118,101,110,116,115,46,99,0,0,0,0,0,0,115,116,97,114,116,105,111,0,99,97,110,39,116,32,97,112,112,101,110,100,32,116,111,32,102,105,108,101,0,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,58,32,100,97,116,97,95,50,32,109,97,116,114,105,120,0,0,0,37,115,58,32,73,110,102,111,32,88,77,76,32,37,115,32,99,111,110,116,97,105,110,101,100,32,109,111,114,101,32,101,113,117,97,116,105,111,110,115,32,116,104,97,110,32,101,120,112,101,99,116,101,100,32,40,37,108,100,41,0,0,0,0,60,111,118,101,114,104,101,97,100,84,105,109,101,62,37,102,60,47,111,118,101,114,104,101,97,100,84,105,109,101,62,10,0,0,0,0,0,0,0,0,95,112,114,111,102,46,120,109,108,0,0,0,0,0,0,0,110,117,109,98,101,114,79,102,67,111,110,116,105,110,117,111,117,115,83,116,97,116,101,115,0,0,0,0,0,0,0,0,105,110,108,105,110,101,45,101,117,108,101,114,0,0,0,0,83,84,79,80,32,0,0,0,117,112,100,97,116,105,110,103,32,105,110,105,116,105,97,108,32,114,101,115,105,100,117,97,108,115,0,0,0,0,0,0,115,111,108,118,101,114,32,119,105,108,108,32,116,114,121,32,116,111,32,104,97,110,100,108,101,32,116,104,97,116,46,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,115,105,109,117,108,97,116,105,111,110,47,115,111,108,118,101,114,47,100,97,115,115,108,46,99,0,0,0,0,0,0,0,99,97,110,110,111,116,32,99,104,97,110,103,101,32,115,101,116,116,105,110,103,32,111,110,99,101,32,112,97,114,115,105,110,103,32,104,97,115,32,98,101,103,117,110,0,0,0,0,32,32,37,45,49,53,115,32,91,37,115,93,0,0,0,0,97,100,100,105,116,105,111,110,97,108,32,100,101,98,117,103,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,68,65,83,83,76,45,45,32,32,73,87,79,82,75,32,76,69,78,71,84,72,32,78,69,69,68,69,68,44,32,76,69,78,73,87,32,40,61,73,49,41,44,32,69,88,67,69,69,68,83,32,76,73,87,32,40,61,73,50,41,0,0,0,0,115,101,108,101,99,116,115,32,116,104,101,32,116,121,112,101,32,111,102,32,99,108,111,99,107,32,116,111,32,117,115,101,32,45,99,108,111,99,107,61,82,84,44,32,45,99,108,111,99,107,61,67,89,67,32,111,114,32,45,99,108,111,99,107,61,67,80,85,0,0,0,0,39,110,101,119,39,32,102,105,108,101,32,101,120,105,115,116,115,0,0,0,0,0,0,0,84,111,111,32,102,101,119,32,114,111,119,115,32,105,110,32,100,97,116,97,95,50,32,109,97,116,114,105,120,0,0,0,102,97,108,115,101,0,0,0,37,115,58,32,85,110,107,110,111,119,110,32,97,116,116,114,105,98,117,116,101,32,105,110,32,60,105,110,102,111,62,0,60,111,117,116,112,117,116,70,105,108,101,115,105,122,101,62,37,108,100,60,47,111,117,116,112,117,116,70,105,108,101,115,105,122,101,62,10,0,0,0,76,105,110,101,97,114,32,109,111,100,101,108,32,105,115,32,99,114,101,97,116,101,100,33,0,0,0,0,0,0,0,0,79,80,69,78,77,79,68,69,76,73,67,65,72,79,77,69,58,32,37,115,0,0,0,0,99,112,117,32,116,105,109,101,32,91,115,93,0,0,0,0,66,0,0,0,0,0,0,0,35,35,35,32,83,84,65,82,84,32,73,78,73,84,73,65,76,73,90,65,84,73,79,78,32,35,35,35,0,0,0,0,73,112,111,112,116,32,105,115,32,110,101,101,100,101,100,32,98,117,116,32,110,111,116,32,97,118,97,105,108,97,98,108,101,46,0,0,0,0,0,0,101,109,112,116,121,0,0,0,89,111,117,114,32,109,101,109,111,114,121,32,105,115,32,110,111,116,32,115,116,114,111,110,103,32,101,110,111,117,103,104,32,102,111,114,32,111,117,114,32,82,105,110,103,98,117,102,102,101,114,33,0,0,0,0,116,111,116,97,108,32,110,117,109,98,101,114,32,111,102,32,101,114,114,111,114,32,116,101,115,116,32,102,97,105,108,117,114,101,115,58,32,37,100,0,114,101,113,117,101,115,116,101,100,32,102,101,97,116,117,114,101,32,114,101,113,117,105,114,101,115,32,88,77,76,95,68,84,68,32,115,117,112,112,111,114,116,32,105,110,32,69,120,112,97,116,0,0,0,0,0,97,100,100,105,116,105,111,110,97,108,32,105,110,102,111,114,109,97,116,105,111,110,32,97,98,111,117,116,32,100,97,115,115,108,32,115,111,108,118,101,114,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,82,87,79,82,75,32,76,69,78,71,84,72,32,78,69,69,68,69,68,44,32,76,69,78,82,87,32,40,61,73,49,41,44,32,69,88,67,69,69,68,83,32,76,82,87,32,40,61,73,50,41,0,0,0,0,117,110,107,110,111,119,110,0,99,97,110,39,116,32,119,114,105,116,101,32,102,105,108,101,0,0,0,0,0,0,0,0,100,97,116,97,95,49,32,109,97,116,114,105,120,32,100,111,101,115,32,110,111,116,32,104,97,118,101,32,49,32,111,114,32,50,32,114,111,119,115,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,60,47,111,117,116,112,117,116,70,105,108,101,110,97,109,101,62,10,0,0,0,0,0,0,79,80,69,78,77,79,68,69,76,73,67,65,72,79,77,69,0,0,0,0,0,0,0,0,36,99,112,117,84,105,109,101,0,0,0,0,0,0,0,0,91,37,108,100,93,32,83,116,114,105,110,103,32,37,115,40,115,116,97,114,116,61,37,115,41,32,61,32,37,115,32,40,112,114,101,58,32,37,115,41,0,0,0,0,0,0,0,0,83,117,110,100,105,97,108,47,107,105,110,115,111,108,32,105,115,32,110,101,101,100,101,100,32,98,117,116,32,110,111,116,32,97,118,97,105,108,97,98,108,101,46,32,80,108,101,97,115,101,32,99,104,111,111,115,101,32,111,116,104,101,114,32,115,111,108,118,101,114,46,0,117,112,100,97,116,105,110,103,32,115,116,97,114,116,45,118,97,108,117,101,115,0,0,0,116,111,116,97,108,32,110,117,109,98,101,114,32,111,102,32,99,111,110,118,101,114,103,101,110,99,101,32,116,101,115,116,32,102,97,105,108,117,114,101,115,58,32,37,100,0,0,0,101,110,116,105,116,121,32,100,101,99,108,97,114,101,100,32,105,110,32,112,97,114,97,109,101,116,101,114,32,101,110,116,105,116,121,0,0,0,0,0,116,104,105,115,32,115,116,114,101,97,109,32,105,115,32,97,108,119,97,121,115,32,97,99,116,105,118,101,0,0,0,0,68,65,83,83,76,45,45,32,32,77,65,88,79,82,68,32,40,61,73,49,41,32,78,79,84,32,73,78,32,82,65,78,71,69,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,65,67,84,73,79,78,32,87,65,83,32,84,65,75,69,78,46,32,82,85,78,32,84,69,82,77,73,78,65,84,69,68,0,0,0,0,0,0,0,70,76,65,71,95,77,65,88,0,0,0,0,0,0,0,0,99,97,110,39,116,32,114,101,97,100,32,102,105,108,101,0,100,97,116,97,95,49,32,109,97,116,114,105,120,32,99,111,110,116,97,105,110,101,100,32,112,97,114,97,109,101,116,101,114,32,116,104,97,116,32,99,104,97,110,103,101,100,32,98,101,116,119,101,101,110,32,115,116,97,114,116,32,97,110,100,32,115,116,111,112,45,116,105,109,101,0,0,0,0,0,0,116,114,117,101,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,60,111,117,116,112,117,116,70,105,108,101,110,97,109,101,62,0,0,0,0,0,0,0,0,95,114,101,115,46,0,0,0,118,97,114,105,97,98,108,101,32,102,105,108,116,101,114,58,32,37,115,0,0,0,0,0,100,101,114,40,0,0,0,0,115,116,114,105,110,103,32,118,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,0,35,35,35,32,69,78,68,32,83,84,65,84,73,83,84,73,67,83,32,35,35,35,0,0,99,97,108,108,32,101,120,116,101,114,110,97,108,32,79,98,106,101,99,116,32,67,111,110,115,116,114,117,99,116,111,114,115,32,102,105,110,105,115,104,101,100,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,110,117,109,98,101,114,32,111,102,32,99,97,108,99,117,108,97,116,105,111,110,32,111,102,32,106,97,99,111,98,105,97,110,32,58,32,37,100,0,0,117,110,101,120,112,101,99,116,101,100,32,112,97,114,115,101,114,32,115,116,97,116,101,32,45,32,112,108,101,97,115,101,32,115,101,110,100,32,97,32,98,117,103,32,114,101,112,111,114,116,0,0,0,0,0,0,117,110,107,110,111,119,110,0,99,112,117,0,0,0,0,0,68,65,83,83,76,45,45,32,32,78,69,81,32,40,61,73,49,41,32,46,76,69,46,32,48,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,115,117,98,115,99,114,105,112,116,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,58,32,100,97,116,97,95,49,32,109,97,116,114,105,120,0,0,0,119,98,0,0,0,0,0,0,117,110,107,110,111,119,110,32,99,111,100,101,32,105,110,32,100,111,95,102,105,111,58,32,37,100,10,37,115,10,0,0,99,111,108,69,110,100,0,0,60,47,111,117,116,112,117,116,70,111,114,109,97,116,62,10,0,0,0,0,0,0,0,0,111,118,101,114,119,114,105,116,101,32,115,111,108,118,101,114,32,109,101,116,104,111,100,58,32,37,115,32,91,102,114,111])
.concat([109,32,99,111,109,109,97,110,100,32,108,105,110,101,93,0,118,97,114,105,97,98,108,101,70,105,108,116,101,114,0,0,102,97,108,115,101,0,0,0,115,111,114,114,121,32,45,32,110,111,32,115,111,108,118,101,114,32,115,116,97,116,105,115,116,105,99,115,32,97,118,97,105,108,97,98,108,101,46,32,91,110,111,116,32,121,101,116,32,105,109,112,108,101,109,101,110,116,101,100,93,0,0,0,109,97,120,95,116,112,32,33,61,32,48,0,0,0,0,0,97,115,115,101,114,116,0,0,99,97,108,108,32,101,120,116,101,114,110,97,108,32,79,98,106,101,99,116,32,67,111,110,115,116,114,117,99,116,111,114,115,0,0,0,0,0,0,0,105,110,100,101,120,32,91,37,100,93,32,111,117,116,32,111,102,32,114,97,110,103,101,32,91,37,100,58,37,100,93,0,110,117,109,98,101,114,32,111,102,32,99,97,108,108,115,32,111,102,32,102,117,110,99,116,105,111,110,79,68,69,40,41,32,58,32,37,100,0,0,0,100,111,99,117,109,101,110,116,32,105,115,32,110,111,116,32,115,116,97,110,100,97,108,111,110,101,0,0,0,0,0,0,76,79,71,95,90,69,82,79,67,82,79,83,83,73,78,71,83,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,83,79,77,69,32,69,76,69,77,69,78,84,32,79,70,32,73,78,70,79,32,86,69,67,84,79,82,32,73,83,32,78,79,84,32,90,69,82,79,32,79,82,32,79,78,69,0,115,0,0,0,0,0,0,0,115,117,98,115,116,114,105,110,103,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,100,97,116,97,95,49,32,109,97,116,114,105,120,32,100,111,101,115,32,110,111,116,32,104,97,118,101,32,49,32,111,114,32,50,32,99,111,108,115,0,58,32,0,0,0,0,0,0,99,111,108,83,116,97,114,116,0,0,0,0,0,0,0,0,60,111,117,116,112,117,116,70,111,114,109,97,116,62,0,0,76,105,110,101,97,114,105,122,97,116,105,111,110,32,119,105,108,108,32,112,101,114,102,111,114,109,101,100,32,97,116,32,112,111,105,110,116,32,111,102,32,116,105,109,101,58,32,37,102,0,0,0,0,0,0,0,111,117,116,112,117,116,32,102,111,114,109,97,116,58,32,37,115,0,0,0,0,0,0,0,102,111,114,109,97,116,116,101,100,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,37,53,100,32,99,111,110,118,101,114,103,101,110,99,101,32,116,101,115,116,32,102,97,105,108,117,114,101,115,0,0,0,65,99,108,97,115,115,0,0,77,111,100,101,108,105,99,97,46,69,108,101,99,116,114,105,99,97,108,46,65,110,97,108,111,103,46,69,120,97,109,112,108,101,115,46,67,104,117,97,67,105,114,99,117,105,116,95,105,110,102,111,46,120,109,108,0,0,0,0,0,0,0,0,108,101,102,116,32,111,102,102,0,0,0,0,0,0,0,0,91,37,108,100,93,32,37,115,32,61,32,37,99,32,124,32,112,114,101,40,37,115,41,32,61,32,37,99,0,0,0,0,110,117,109,98,101,114,32,111,102,32,115,116,101,112,115,32,116,97,107,101,110,32,115,111,32,102,97,114,58,32,37,100,0,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,112,114,111,99,101,115,115,105,110,103,32,101,120,116,101,114,110,97,108,32,101,110,116,105,116,121,32,114,101,102,101,114,101,110,99,101,0,0,0,76,79,71,95,85,84,73,76,0,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,73,78,73,84,73,65,76,32,89,80,82,73,77,69,32,67,79,85,76,68,32,78,79,84,32,66,69,32,67,79,77,80,85,84,69,68,0,0,0,114,0,0,0,0,0,0,0,102,109,116,0,0,0,0,0,105,110,118,97,108,105,100,32,97,114,114,97,121,32,115,101,99,116,105,111,110,0,0,0,100,97,116,97,95,49,32,109,97,116,114,105,120,32,100,111,101,115,32,110,111,116,32,99,111,110,116,97,105,110,32,97,116,32,108,101,97,115,116,32,49,32,118,97,114,105,97,98,108,101,0,0,0,0,0,0,108,105,110,101,69,110,100,0,60,47,109,101,116,104,111,100,62,10,0,0,0,0,0,0,101,109,112,116,121,32,108,105,115,116,0,0,0,0,0,0,67,104,111,115,101,110,32,99,108,111,99,107,45,116,121,112,101,58,32,37,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,32,102,111,114,32,116,104,101,32,99,117,114,114,101,110,116,32,112,108,97,116,102,111,114,109,46,32,68,101,102,97,117,108,116,105,110,103,32,116,111,32,114,101,97,108,45,116,105,109,101,46,0,0,111,117,116,112,117,116,70,111,114,109,97,116,0,0,0,0,91,37,108,100,93,32,66,111,111,108,101,97,110,32,37,115,40,115,116,97,114,116,61,37,115,41,32,61,32,37,115,32,40,112,114,101,58,32,37,115,41,0,0,0,0,0,0,0,37,53,100,32,101,114,114,111,114,32,116,101,115,116,32,102,97,105,108,117,114,101,115,0,123,56,99,52,101,56,49,48,102,45,51,100,102,51,45,52,97,48,48,45,56,50,55,54,45,49,55,54,102,97,51,99,57,102,57,101,48,125,0,0,117,116,105,108,47,109,101,109,111,114,121,95,112,111,111,108,46,99,0,0,0,0,0,0,115,116,97,116,117,115,32,111,102,32,114,101,108,97,116,105,111,110,115,0,0,0,0,0,115,116,101,112,32,115,105,122,101,32,117,115,101,100,32,111,110,32,108,97,115,116,32,115,117,99,99,101,115,115,102,117,108,32,115,116,101,112,58,32,37,48,46,52,103,0,0,0,117,110,99,108,111,115,101,100,32,67,68,65,84,65,32,115,101,99,116,105,111,110,0,0,70,76,65,71,95,77,65,88,0,0,0,0,0,0,0,0,70,97,105,108,101,100,32,116,111,32,99,114,101,97,116,101,32,101,120,112,97,116,32,111,98,106,101,99,116,0,0,0,76,79,71,95,83,84,65,84,83,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,73,82,69,83,32,87,65,83,32,69,81,85,65,76,32,84,79,32,77,73,78,85,83,32,84,87,79,0,0,0,0,80,108,111,116,115,32,111,102,32,112,114,111,102,105,108,105,110,103,32,100,97,116,97,32,119,101,114,101,32,100,105,115,97,98,108,101,100,58,32,37,115,10,0,0,0,0,0,0,112,111,114,116,0,0,0,0,44,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,115,117,98,115,99,114,105,112,116,32,102,111,114,32,115,99,97,108,97,114,32,118,97,114,105,97,98,108,101,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,58,32,100,97,116,97,73,110,102,111,32,109,97,116,114,105,120,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,69,114,114,111,114,58,32,99,97,110,32,110,111,116,32,114,101,97,100,32,102,105,108,101,32,37,115,32,97,115,32,115,101,116,117,112,32,102,105,108,101,32,116,111,32,116,104,101,32,103,101,110,101,114,97,116,101,100,32,115,105,109,117,108,97,116,105,111,110,32,99,111,100,101,46,0,0,0,69,114,114,111,114,32,97,108,108,111,99,97,116,105,110,103,32,115,105,109,117,108,97,116,105,111,110,32,114,101,115,117,108,116,32,100,97,116,97,32,111,102,32,115,105,122,101,32,37,108,100,32,102,97,105,108,101,100,0,0,0,0,0,0,65,99,108,97,115,115,0,0,34,37,115,34,44,0,0,0,116,114,121,32,45,105,108,115,32,116,111,32,97,99,116,105,118,97,116,101,32,115,116,97,114,116,32,118,97,108,117,101,32,104,111,109,111,116,111,112,121,0,0,0,0,0,0,0,108,101,97,115,116,83,113,117,97,114,101,61,37,103,0,0,108,105,110,101,83,116,97,114,116,0,0,0,0,0,0,0,124,32,110,117,109,98,101,114,32,111,102,32,117,110,102,105,120,101,100,32,118,97,114,105,97,98,108,101,115,58,32,32,37,108,100,32,40,37,108,100,32,115,116,97,116,101,115,32,43,32,37,108,100,32,112,97,114,97,109,101,116,101,114,115,32,43,32,37,108,100,32,100,105,115,99,114,101,116,101,32,114,101,97,108,115,41,0,0,60,109,101,116,104,111,100,62,0,0,0,0,0,0,0,0,91,117,110,107,110,111,119,110,32,99,108,111,99,107,45,116,121,112,101,93,32,103,111,116,32,37,115,44,32,101,120,112,101,99,116,101,100,32,67,80,85,124,82,84,124,67,89,67,46,32,68,101,102,97,117,108,116,105,110,103,32,116,111,32,82,84,46,0,0,0,0,0,115,111,108,118,101,114,32,109,101,116,104,111,100,58,32,37,115,0,0,0,0,0,0,0,98,111,111,108,101,97,110,32,118,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,37,53,100,32,101,118,97,108,117,97,116,105,111,110,115,32,111,102,32,106,97,99,111,98,105,97,110,0,0,0,0,0,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,115,116,97,116,117,115,0,0,0,37,115,37,46,53,101,32,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,98,121,32,97,110,32,97,115,115,101,114,116,32,97,116,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,0,0,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,69,120,97,109,112,108,101,115,0,0,0,0,115,116,114,105,110,103,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,0,115,116,101,112,32,115,105,122,101,32,72,32,116,111,32,98,101,32,97,116,116,101,109,112,116,101,100,32,111,110,32,110,101,120,116,32,115,116,101,112,58,32,37,48,46,52,103,0,101,110,99,111,100,105,110,103,32,115,112,101,99,105,102,105,101,100,32,105,110,32,88,77,76,32,100,101,99,108,97,114,97,116,105,111,110,32,105,115,32,105,110,99,111,114,114,101,99,116,0,0,0,0,0,0,76,79,71,95,83,79,84,73,0,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,65,84,32,84,32,40,61,82,49,41,32,65,78,68,32,83,84,69,80,83,73,90,69,32,72,32,40,61,82,50,41,0,0,0,0,0,0,0,0,111,118,101,114,114,105,100,101,70,105,108,101,0,0,0,0,118,97,114,105,97,98,108,101,32,99,111,117,110,116,32,105,110,99,111,114,114,101,99,116,0,0,0,0,0,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,58,32,110,97,109,101,115,32,109,97,116,114,105,120,0,0,0,0,37,112,0,0,0,0,0,0,102,105,108,101,0,0,0,0,60,47,100,97,116,101,62,10,0,0,0,0,0,0,0,0,67,89,67,0,0,0,0,0,115,111,108,118,101,114,0,0,91,37,108,100,93,32,73,110,116,101,103,101,114,32,37,115,40,115,116,97,114,116,61,37,108,100,41,32,61,32,37,108,100,32,40,112,114,101,58,32,37,108,100,41,0,0,0,0,37,53,100,32,99,97,108,108,115,32,111,102,32,102,117,110,99,116,105,111,110,79,68,69,0,0,0,0,0,0,0,0,77,111,100,101,108,105,99,97,46,69,108,101,99,116,114,105,99,97,108,46,65,110,97,108,111,103,46,69,120,97,109,112,108,101,115,46,67,104,117,97,67,105,114,99,117,105,116,0,119,98,0,0,0,0,0,0,37,108,100,58,32,37,115,32,61,32,37,115,0,0,0,0,99,117,114,114,101,110,116,32,105,110,116,101,103,114,97,116,105,111,110,32,116,105,109,101,32,118,97,108,117,101,58,32,37,48,46,52,103,0,0,0,117,110,107,110,111,119,110,32,101,110,99,111,100,105,110,103,0,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,73,82,69,83,32,87,65,83,32,69,81,85,65,76,32,84,79,32,77,73,78,85,83,32,79,78,69,0,0,0,0,76,79,71,95,83,79,76,86,69,82,0,0,0,0,0,0,111,118,101,114,114,105,100,101,0,0,0,0,0,0,0,0,110,111,32,101,110,100,32,114,101,99,111,114,100,0,0,0,65,99,108,97,115,115,32,109,97,116,114,105,120,32,100,111,101,115,32,110,111,116,32,109,97,116,99,104,32,98,105,110,84,114,97,110,115,32,111,114,32,98,105,110,78,111,114,109,97,108,32,102,111,114,109,97,116,0,0,0,0,0,0,0,104,121,98,114,105,100,0,0,45,105,32,102,103,109,114,101,115,32,0,0,0,0,0,0,105,110,102,111,0,0,0,0,60,100,97,116,101,62,0,0,82,84,0,0,0,0,0,0,116,111,108,101,114,97,110,99,101,32,61,32,37,103,0,0,119,98,0,0,0,0,0,0,105,110,116,101,103,101,114,32,118,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,37,53,100,32,115,116,101,112,115,32,116,97,107,101,110,0,108,105,110,101,97,114,32,115,121,115,116,101,109,32,102,97,105,108,115,58,32,37,115,32,97,116,32,116,61,37,103,0,69,114,114,111,114,32,119,104,105,108,101,32,105,110,105,116,105,97,108,105,122,101,32,68,97,116,97,0,0,0,0,0,109,105,120,101,100,32,115,121,115,116,101,109,32,102,97,105,108,115,58,32,37,115,32,97,116,32,116,61,37,103,0,0,98,111,111,108,101,97,110,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,99,117,114,114,101,110,116,32,116,105,109,101,32,118,97,108,117,101,58,32,37,48,46,52,103,0,0,0,0,0,0,0,88,77,76,32,111,114,32,116,101,120,116,32,100,101,99,108,97,114,97,116,105,111,110,32,110,111,116,32,97,116,32,115,116,97,114,116,32,111,102,32,101,110,116,105,116,121,0,0,68,65,83,83,76,45,45,32,32,67,79,82,82,69,67,84,79,82,32,67,79,85,76,68,32,78,79,84,32,67,79,78,86,69,82,71,69,32,66,69,67,65,85,83,69,0,0,0,76,79,71,95,83,73,77,85,76,65,84,73,79,78,0,0,111,117,116,112,117,116,0,0,91,37,108,100,93,32,37,115,0,0,0,0,0,0,0,0,118,97,114,105,97,98,108,101,32,110,111,116,32,105,110,32,110,97,109,101,108,105,115,116,0,0,0,0,0,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,58,32,65,99,108,97,115,115,32,109,97,116,114,105,120,0,0,0,60,118,97,114,62,32,110,101,101,100,115,32,116,111,32,104,97,118,101,32,101,120,97,99,116,108,121,32,111,110,101,32,97,116,116,114,105,98,117,116,101,58,32,110,97,109,101,0,60,47,112,114,101,102,105,120,62,10,0,0,0,0,0,0,67,80,85,0,0,0,0,0,116,111,108,101,114,97,110,99,101,0,0,0,0,0,0,0,111,116,104,101,114,32,114,101,97,108,32,118,97,114,105,97,98,108,101,115,0,0,0,0,115,111,108,118,101,114,0,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,98,121,32,97,110,32,97,115,115,101,114,116,32,97,116,32,116,105,109,101,58,32,37,103,0,0,0,0,0,0,0,0,37,108,100,58,32,37,115,32,61,32,37,108,100,0,0,0,97,116,32,84,105,109,101,61,37,102,0,0,0,0,0,0,118,97,108,117,101,32,111,102,32,105,100,105,100,58,32,37,100,0,0,0,0,0,0,0,99,117,114,114,101,110,116,32,111,112,116,105,111,110,115,32,97,114,101,58,0,0,0,0,112,105,118,111,116,32,33,61,32,48,0,0,0,0,0,0,114,101,102,101,114,101,110,99,101,32,116,111,32,101,120,116,101,114,110,97,108,32,101,110,116,105,116,121,32,105,110,32,97,116,116,114,105,98,117,116,101,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,69,82,82,79,82,32,84,69,83,84,32,70,65,73,76,69,68,32,82,69,80,69,65,84,69,68,76,89,46,0,0,76,79,71,95,82,69,83,95,73,78,73,84,0,0,0,0,110,111,101,109,105,116,0,0,98,97,100,32,110,97,109,101,108,105,115,116,32,110,97,109,101,0,0,0,0,0,0,0,65,99,108,97,115,115,32,109,97,116,114,105,120,32,100,111,101,115,32,110,111,116,32,104,97,118,101,32,49,49,32,99,111,108,115,0,0,0,0,0,67,0,0,0,0,0,0,0,110,97,109,101,0,0,0,0,60,112,114,101,102,105,120,62,0,0,0,0,0,0,0,0,67,97,110,110,111,116,32,111,112,101,110,32,70,105,108,101,32,37,115,0,0,0,0,0,115,116,101,112,83,105,122,101,32,61,32,37,103,0,0,0,91,37,108,100,93,32,82,101,97,108,32,37,115,32,61,32,37,103,32,40,112,114,101,58,32,37,103,41,0,0,0,0,37,53,108,100,32,116,105,109,101,32,101,118,101,110,116,115,0,0,0,0,0,0,0,0,83,0,0,0,0,0,0,0,73,110,116,101,103,114,97,116,111,114,32,97,116,116,101,109,112,116,32,116,111,32,104,97,110,100,108,101,32,97,32,112,114,111,98,108,101,109,32,119,105,116,104,32,97,32,99,97,108,108,101,100,32,97,115,115,101,114,116,46,0,0,0,0,91,37,108,100,93,32,82,101,97,108,32,37,115,0,0,0,105,110,116,101,103,101,114,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,0,0,115,97,118,101,32,97,108,108,32,122,101,114,111,99,114,111,115,115,105,110,103,115,32,97,102,116,101,114,32,97,110,32,101,118,101,110,116,0,0,0,100,97,115,115,108,32,99,97,108,108,32,115,116,97,105,115,116,105,99,115,58,32,0,0,63,0,0,0,0,0,0,0,114,101,102,101,114,101,110,99,101,32,116,111,32,98,105,110,97,114,121,32,101,110,116,105,116,121,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,67,79,82,82,69,67,84,79,82,32,67,79,85,76,68,32,78,79,84,32,67,79,78,86,69,82,71,69,46,32,32,65,76,83,79,44,32,84,72,69,0,0,0,0,0,0,0,76,79,71,95,78,76,83,95,74,65,67,0,0,0,0,0,110,108,115,0,0,0,0,0,98,97,100,32,118,97,114,105,97,98,108,101,32,116,121,112,101,0,0,0,0,0,0,0,65,99,108,97,115,115,32,109,97,116,114,105,120,32,100,111,101,115,32,110,111,116,32,104,97,118,101,32,52,32,114,111,119,115,0,0,0,0,0,0,118,101,99,116,111,114,0,0,114,0,0,0,0,0,0,0,118,97,114,0,0,0,0,0,60,47,110,97,109,101,62,10,0,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,36,100,117,109,109,121,0,0,115,116,101,112,83,105,122,101,0,0,0,0,0,0,0,0,117,110,100,101,102,105,110,101,100,32,101,114,114,111,114,32,105,110,32,78,101,108,100,101,114,77,101,97,100,79,112,116,105,109,105,122,97,116,105,111,110,0,0,0,0,0,0,0,100,101,114,105,118,97,116,105,118,101,115,32,118,97,114,105,97,98,108,101,115,0,0,0,37,53,108,100,32,115,116,97,116,101,32,101,118,101,110,116,115,0,0,0,0,0,0,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,112,114,111,98,97,98,108,121,32,97,32,115,116,114,111,110,103,32,99,111,109,112,111,110,101,110,116,32,115,111,108,118,101,114,32,102,97,105,108,101,100,46,32,70,111,114,32,109,111,114,101,32,105,110,102,111,114,109,97,116,105,111,110,32,117,115,101,32,102,108,97,103,115,32,45,108,118,32,76,79,71,95,78,76,83,44,32,76,79,71,95,76,83,46,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,97,116,32,116,105,109,101,32,37,103,0,0,0,0,0,91,37,108,100,93,32,82,101,97,108,32,37,115,40,115,116,97,114,116,61,63,44,32,110,111,109,105,110,97,108,61,63,41,0,0,0,0,0,0,0,37,108,100,58,32,37,115,32,61,32,37,103,0,0,0,0,70,65,76,83,69,0,0,0,99,97,110,39,116,32,99,111,110,116,105,110,117,101,46,32,116,105,109,101,32,61,32,37,102,0,0,0,0,0,0,0,114,101,102,101,114,101,110,99,101,32,116,111,32,105,110,118,97,108,105,100,32,99,104,97,114,97,99,116,101,114,32,110,117,109,98,101,114,0,0,0,68,65,83,83,76,45,45,32,32,73,84,69,82,65,84,73,79,78,32,77,65,84,82,73,88,32,73,83,32,83,73,78,71,85,76,65,82,0,0,0,68,65,83,83,76,45,45,32,32,86,65,76,85,69,32,40,61,73,49,41,32,79,70,32,73,68,73,68,32,65,78,68,32,78,79,32,65,80,80,82,79,80,82,73,65,84,69,0,76,79,71,95,78,76,83,95,86,0,0,0,0,0,0,0,109,101,97,115,117,114,101,84,105,109,101,80,108,111,116,70,111,114,109,97,116,0,0,0,98,97,100,32,108,111,103,105,99,97,108,32,105,110,112,117,116,32,102,105,101,108,100,0,77,97,116,114,105,120,32,110,97,109,101,32,109,105,115,109,97,116,99,104,0,0,0,0,37,46,48,76,102,0,0,0,102,117,110,99,116,105,111,110,0,0,0,0,0,0,0,0,60,110,97,109,101,62,0,0,46,109,111,0,0,0,0,0,41,36,0,0,0,0,0,0,115,116,111,112,84,105,109,101,32,61,32,37,103,0,0,0,37,46,49,54,103,44,32,37,46,49,54,103,10,0,0,0,102,120,107,32,61,32,37,103,0,0,0,0,0,0,0,0,91,37,108,100,93,32,82,101,97,108,32,37,115,40,115,116,97,114,116,61,37,103,44,32,110,111,109,105,110,97,108,61,37,103,41,32,61,32,37,103,32,40,112,114,101,58,32,37,103,41,0,0,0,0,0,0,101,118,101,110,116,115,0,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,109,105,120,101,100,32,115,121,115,116,101,109,32,115,111,108,118,101,114,32,102,97,105,108,101,100,46,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,97,116,32,116,105,109,101,32,37,103,0,0,0,0,0,0,0,0,91,37,108,100,93,32,82,101,97,108,32,37,115,40,115,116,97,114,116,61,37,103,44,32,110,111,109,105,110,97,108,61,37,103,41,0,0,0,0,0,119,0,0,0,0,0,0,0,114,101,97,108,32,112,97,114,97,109,101,116,101,114,115,0,84,82,85,69,0,0,0,0,68,65,83,83,76,32,119,105,108,108,32,116,114,121,32,97,103,97,105,110,46,46,46,0,44,0,0,0,0,0,0,0,97,115,121,110,99,104,114,111,110,111,117,115,32,101,110,116,105,116,121,0,0,0,0,0,118,97,114,105,97,98,108,101,84,121,112,101,0,0,0,0,99,108,111,99,107,0,0,0,68,65,83,83,76,45,45,32,32,79,82,32,87,73,84,72,32,65,66,83,40,72,41,61,72,77,73,78,0,0,0,0,76,79,71,95,78,76,83,0,37,43,46,50,100,0,0,0,83,116,114,105,110,103,0,0,108,118,0,0,0,0,0,0,66,111,111,108,101,97,110,0,114,101,97,100,32,117,110,101,120,112,101,99,116,101,100,32,99,104,97,114,97,99,116,101,114,0,0,0,0,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,32,40,51,41,0,0,0,0,0,0,73,110,116,101,103,101,114,0,114,0,0,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,82,101,97,108,0,0,0,0,78,111,110,108,105,110,101,97,114,32,102,117,110,99,116,105,111,110,32,40,114,101,115,105,100,117,97,108,70,117,110,99,37,108,100,44,32,115,105,122,101,32,37,100,41,0,0,0,60,109,111,100,101,108,105,110,102,111,62,10,0,0,0,0,108,105,110,101,97,114,95,0,94,40,0,0,0,0,0,0,115,116,111,112,84,105,109,101,0,0,0,0,0,0,0,0,69,114,114,111,114,44,32,99,111,117,108,100,110,39,116,32,119,114,105,116,101,32,116,111,32,111,117,116,112,117,116,32,102,105,108,101,32,37,115,10,0,0,0,0,0,0,0,0,102,120,114,32,61,32,37,103,0,0,0,0,0,0,0,0,115,116,97,116,101,115,32,118,97,114,105,97,98,108,101,115,0,0,0,0,0,0,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,116,111,116,97,108,0,0,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,101,114,114,111,114,32,114,101,97,100,105,110,103,32,116,104,101,32,120,109,108,32,102,105,108,101,44,32,102,111,117,110,100,32,117,110,107,110,111,119,110,32,99,108,97,115,115,58,32,37,115,32,32,102,111,114,32,118,97,114,105,97,98,108,101,58,32,37,115,0,97,99,99,95,116,112,32,33,61,32,48,0,0,0,0,0,115,65,108,105,0,0,0,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,108,105,110,101,97,114,32,115,121,115,116,101,109,32,115,111,108,118,101,114,32,102,97,105,108,101,100,46,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,97,116,32,116,105,109,101,32,37,103,0,0,0,0,0,0,0,112,114,111,112,101,114,32,115,116,97,114,116,45,118,97,108,117,101,115,32,102,111,114,32,115,111,109,101,32,111,102,32,116,104,101,32,102,111,108,108,111,119,105,110,103,32,105,116,101,114,97,116,105,111,110,32,118,97,114,105,97,98,108,101,115,32,109,105,103,104,116,32,104,101,108,112,0,0,0,0,101,109,112,116,121,32,82,105,110,103,66,117,102,102,101,114,0,0,0,0,0,0,0,0,115,80,97,114,0,0,0,0,115,116,100,111,117,116,0,0,112,97,114,97,109,101,116,101,114,32,118,97,108,117,101,115,0,0,0,0,0,0,0,0,37,108,100,32,99,104,97,110,103,101,100,32,102,114,111,109,32,37,115,32,116,111,32,99,117,114,114,101,110,116,32,37,115,0,0,0,0,0,0,0,115,65,108,103,0,0,0,0,65,32,108,97,114,103,101,32,97,109,111,117,110,116,32,111,102,32,119,111,114,107,32,104,97,115,32,98,101,101,110,32,101,120,112,101,110,100,101,100,46,40,65,98,111,117,116,32,53,48,48,32,115,116,101,112,115,41,46,32,84,114,121,105,110,103,32,116,111,32,99,111,110,116,105,110,117,101,32,46,46,46,0,0,0,0,0,0,98,65,108,105,0,0,0,0,98,80,97,114,0,0,0,0,114,101,99,117,114,115,105,118,101,32,101,110,116,105,116,121,32,114,101,102,101,114,101,110,99,101,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,67,79,82,82,69,67,84,79,82,32,70,65,73,76,69,68,32,84,79,32,67,79,78,86,69,82,71,69,32,82,69,80,69,65,84,69,68,76,89,0,0,0,0,0,0,0,0,76,79,71,95,76,83,95,86,0,0,0,0,0,0,0,0,98,65,108,103,0,0,0,0,108,115,95,105,112,111,112,116,0,0,0,0,0,0,0,0,83,97,116,0,0,0,0,0,109,97,108,108,111,99,32,102,97,105,108,117,114,101,0,0,105,65,108,105,0,0,0,0,70,114,105,0,0,0,0,0,111,117,116,32,111,102,32,102,114,101,101,32,115,112,97,99,101,0,0,0,0,0,0,0,67,111,114,114,117,112,116,32,104,101,97,100,101,114,32,40,50,41,0,0,0,0,0,0,105,80,97,114,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,84,104,117,0,0,0,0,0,37,76,102,0,0,0,0,0,105,65,108,103,0,0,0,0,110,111,110,108,105,110,101,97,114,0,0,0,0,0,0,0,60,115,105,109,117,108,97,116,105,111,110,62,10,0,0,0,105,32,102,111,114,32,105,32,105,110,32,49,58,48,0,0,115,116,97,114,116,84,105,109,101,32,61,32,37,103,0,0,68,97,116,97,83,101,116,58,32,37,115,10,0,0,0,0,87,101,100,0,0,0,0,0,105,110,99,114,101,97,115,105,110,103,32,108,97,109,98,100,97,32,116,111,32,37,45,51,103,32,105,110,32,115,116,101,112,32,37,54,100,32,97,116,32,102,61,37,103,0,0,0,35,35,35,32,83,79,76,85,84,73,79,78,32,79,70,32,84,72,69,32,73,78,73,84,73,65,76,73,90,65,84,73,79,78,32,35,35,35,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,115,105,109,117,108,97,116,105,111,110,0,0,0,0,0,0,105,108,108,101,103,97,108,32,117,110,105,116,32,110,117,109,98,101,114,0,0,0,0,0,114,65,108,105,0,0,0,0,98,105,110,78,111,114,109,97,108,0,0,0,0,0,0,0,84,117,101,0,0,0,0,0,119,114,105,116,101,32,115,116,97,114,116,0,0,0,0,0,114,80,97,114,0,0,0,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,110,111,110,45,108,105,110,101,97,114,32,115,121,115,116,101,109,32,115,111,108,118,101,114,32,102,97,105,108,101,100,46,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,97,116,32,116,105,109,101,32,37,103,0,0,0,77,111,110,0,0,0,0,0,110,111,110,108,105,110,101,97,114,32,115,121,115,116,101,109,32,102,97,105,108,115,58,32,37,115,32,97,116,32,116,61,37,103,0,0,0,0,0,0,119,95,110,101,100,44,32,117,110,101,120,112,101,99,116,101,100,32,99,111,100,101,58,32,37,100,10,0,0,0,0,0,114,65,108,103,0,0,0,0,83,117,110,0,0,0,0,0,98,105,115,101,99,116,105,111,110,32,99,104,101,99,107,115,32,102,111,114,32,99,111,110,100,105,116,105,111,110,32,99,104,97,110,103,101,115,0,0,115,102,101,0,0,0,0,0,115,101,116,32,111,117,116,112,117,116,32,34,37,115,95,112,114,111,102,46,37,115,37,100,95,99,111,117,110,116,46,37,115,34,10,0,0,0,0,0,32,115,116,97,116,101,109,101,110,116,32,101,120,101,99,117,116,101,100,10,0,0,0,0,114,68,101,114,0,0,0,0,83,116,97,114,116,32,115,116,101,112,32,37,46,49,53,103,32,116,111,32,37,46,49,53,103,0,0,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,115,101,116,32,121,108,97,98,101,108,32,34,69,120,101,99,117,116,105,111,110,32,99,111,117,110,116,34,10,0,0,0,114,83,116,97,0,0,0,0,70,114,105,100,97,121,0,0,115,101,116,32,120,108,97,98,101,108,32,34,71,108,111,98,97,108,32,115,116,101,112,32,110,117,109,98,101,114,34,10,0,0,0,0,0,0,0,0,99,108,97,115,115,84,121,112,101,0,0,0,0,0,0,0,117,110,100,101,102,105,110,101,100,32,101,110,116,105,116,121,0,0,0,0,0,0,0,0,95,105,110,105,116,46,120,109,108,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,69,82,82,79,82,32,84,69,83,84,32,70,65,73,76,69,68,32,82,69,80,69,65,84,69,68,76,89,32,79,82,32,87,73,84,72,32,65,66,83,40,72,41,61,72,77,73,78,0,0,0,0,0,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,115,101,116,32,111,117,116,112,117,116,32,34,37,115,95,112,114,111,102,46,37,115,37,100,46,37,115,34,10,0,0,0,76,79,71,95,76,83,0,0,99,108,97,115,115,73,110,100,101,120,0,0,0,0,0,0,108,115,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,117,0,0,0,0,0,0,0,100,111,95,102,105,111,0,0,69,114,114,111,114,32,97,108,108,111,99,97,116,105,110,103,32,115,105,109,117,108,97,116,105,111,110,32,114,101,115,117,108,116,32,100,97,116,97,32,111,102,32,115,105,122,101,32,37,108,100,0,0,0,0,0,115,101,116,32,121,108,97,98,101,108,32,34,69,120,101,99,117,116,105,111,110,32,116,105,109,101,32,91,115,93,34,10,0,0,0,0,0,0,0,0,83,99,97,108,97,114,86,97,114,105,97,98,108,101,0,0,84,117,101,115,100,97,121,0,105,110,99,111,109,112,114,101,104,101,110,115,105,98,108,101,32,108,105,115,116,32,105,110,112,117,116,0,0,0,0,0,67,111,117,108,100,32,110,111,116,32,100,101,116,101,114,109,105,110,101,32,115,105,122,101,32,111,102,32,109,97,116,114,105,120,32,101,108,101,109,101,110,116,115,0,0,0,0,0,115,101,116,32,120,108,97,98,101,108,32,34,71,108,111,98,97,108,32,115,116,101,112,32,97,116,32,116,105,109,101,34,10,0,0,0,0,0,0,0,68,101,102,97,117,108,116,69,120,112,101,114,105,109,101,110,116,0,0,0,0,0,0,0,77,111,110,100,97,121,0,0,100,97,116,97,95,49,0,0,115,101,116,32,116,105,116,108,101,32,34,37,115,34,10,0,99,117,114,114,101,110,116,95,115,116,97,116,101,115,0,0,102,109,105,77,111,100,101,108,68,101,115,99,114,105,112,116,105,111,110,0,0,0,0,0,101,113,117,97,116,105,111,110,0,0,0,0,0,0,0,0,83,117,110,100,97,121,0,0,115,116,114,102,116,105,109,101,40,41,32,102,97,105,108,101,100,0,0,0,0,0,0,0,37,46,49,54,103,44,0,0,105,110,118,97,108,105,100,32,108,105,115,116,45,112,111,105,110,116,101,114,0,0,0,0,76,105,115,0,0,0,0,0,115,116,97,114,116,84,105,109,101,0,0,0,0,0,0,0,68,97,116,97,83,101,116,58,32,36,99,112,117,84,105,109,101,10,0,0,0,0,0,0,77,97,108,108,111,99,32,102,97,105,108,101,100,0,0,0,108,97,109,98,100,97,32,105,115,32,37,45,51,103,32,105,110,32,115,116,101,112,61,37,54,100,32,97,116,32,102,61,37,103,32,91,37,103,93,0,115,101,116,32,116,101,114,109,105,110,97,108,32,37,115,10,0,0,0,0,0,0,0,0,105,110,105,116,105,97,108,32,114,101,115,105,100,117,97,108,115,0,0,0,0,0,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,111,118,101,114,104,101,97,100,0,0,0,0,0,0,0,0,101,114,114,111,114,32,114,101,97,100,95,118,97,108,117,101,44,32,110,111,32,100,97,116,97,32,97,108,108,111,99,97,116,101,100,32,102,111,114,32,115,116,111,114,105,110,103,32,115,116,114,105,110,103,0,0,115,101,116,32,98,111,114,100,101,114,10,0,0,0,0,0,109,111,100,101,108,32,116,101,114,109,105,110,97,116,101,32,124,32,73,110,116,101,103,114,97,116,111,114,32,102,97,105,108,101,100,46,32,124,32,83,105,109,117,108,97,116,105,111,110,32,116,101,114,109,105,110,97,116,101,100,32,97,116,32,116,105,109,101,32,37,103,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,78,101,108,100,101,114,77,101,97,100,79,112,116,105,109,105,122,97,116,105,111,110,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,110,111,110,108,105,110,101,97,114,32,115,111,108,118,101,114,0,0,0,115,101,116,32,120,116,105,99,115,10,0,0,0,0,0,0,102,97,108,115,101,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,84,79,76,32,105,115,32,115,101,116,32,116,111,58,32,37,101,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,115,101,116,32,121,116,105,99,115,10,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,67,97,108,108,105,110,103,32,68,68,65,83,82,84,32,102,114,111,109,32,37,46,49,53,103,32,116,111,32,37,46,49,53,103,0,0,0,0,0,0,110,111,32,105,112,111,112,116,32,115,117,112,112,111,114,116,32,97,99,116,105,118,97,116,101,100,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,115,101,116,32,111,117,116,112,117,116,32,34,37,115,95,112,114,111,102,46,37,115,37,100,95,99,111,117,110,116,46,116,104,117,109,98,46,115,118,103,34,10,0,0,0,0,0,0,100,97,115,115,108,73,110,116,101,114,110,97,108,78,117,109,74,97,99,0,0,0,0,0,104,101,108,112,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,70,97,105,108,101,100,32,116,111,32,111,112,101,110,32,102,105,108,101,32,37,115,58,32,37,115,10,0,0,0,0,0,115,101,116,32,121,114,97,110,103,101,32,91,37,103,58,37,103,93,10,0,0,0,0,0,100,97,115,115,108,67,111,108,111,114,83,121,109,74,97,99,0,0,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,105,108,108,101,103,97,108,32,112,97,114,97,109,101,116,101,114,32,101,110,116,105,116,121,32,114,101,102,101,114,101,110,99,101,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,65,84,32,84,32,40,61,82,49,41,32,65,78,68,32,83,84,69,80,83,73,90,69,32,72,32,40,61,82,50,41,32,84,72,69,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,115,101,116,32,110,111,108,111,103,32,120,121,10,0,0,0,100,97,115,115,108,78,117,109,74,97,99,0,0,0,0,0,103,110,117,112,108,111,116,0,76,79,71,95,74,65,67,0,59,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,115,101,116,32,121,114,97,110,103,101,32,91,42,58,42,93,10,0,0,0,0,0,0,0,100,97,115,115,108,83,121,109,74,97,99,0,0,0,0,0,76,79,71,95,65,76,76,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,116,114,117,110,99,97,116,105,111,110,32,102,97,105,108,101,100,32,105,110,32,101,110,100,102,105,108,101,0,0,0,0,77,97,116,114,105,120,32,117,115,101,115,32,105,109,97,103,105,110,97,114,121,32,110,117,109,98,101,114,115,0,0,0,115,101,116,32,121,114,97,110,103,101,32,91,42,58,37,103,93,10,0,0,0,0,0,0,100,97,115,115,108,116,101,115,116,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,65,117,116,111,109,97,116,105,99,32,111,117,116,112,117,116,32,115,116,101,112,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,105,110,32,79,112,101,110,77,111,100,101,108,105,99,97,32,121,101,116,46,32,83,101,116,32,110,117,109,112,111,105,110,116,115,32,62,61,32,48,46,10,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,67,97,110,110,111,116,32,111,112,101,110,32,70,105,108,101,32,37,115,32,102,111,114,32,119,114,105,116,105,110,103,0,115,101,116,32,108,111,103,32,121,10,0,0,0,0,0,0,37,105,44,0,0,0,0,0,100,97,115,115,108,119,111,114,116,0,0,0,0,0,0,0,105,116,101,114,97,116,105,111,110,115,58,32,37,108,100,0,115,105,109,112,108,101,120,95,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,124,32,82,101,115,117,108,116,32,111,102,32,108,101,97,115,116,83,113,117,97,114,101,32,109,101,116,104,111,100,32,61,32,37,103,46,32,84,104,101,32,105,110,105,116,105,97,108,32,103,117,101,115,115,32,102,105,116,115,32,116,111,32,116,104,101,32,115,121,115,116,101,109,0,0,0,0,0,0,0,0,118,97,114,105,97,98,108,101,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,105,110,105,116,105,97,108,32,112,114,111,98,108,101,109,58,0,0,0,0,0,0,0,0,37,89,45,37,109,45,37,100,32,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,100,101,102,97,117,108,116,32,109,101,116,104,111,100,0,0,114,101,97,100,32,97,108,108,32,116,104,101,32,68,101,102,97,117,108,116,69,120,112,101,114,105,109,101,110,116,32,118,97,108,117,101,115,58,0,0,67,97,110,110,111,116,32,97,108,108,111,99,32,109,101,109,111,114,121,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,115,101,116,32,121,108,97,98,101,108,10,0,0,0,0,0,91,37,108,100,93,32,91,37,49,53,103,93,32,58,61,32,37,115,32,40,100,105,115,99,114,101,116,101,41,0,0,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,101,118,101,110,116,45,104,97,110,100,108,105,110,103,0,0,108,111,98,97,116,116,111,54,0,0,0,0,0,0,0,0,114,101,115,105,100,117,97,108,91,37,108,100,93,32,61,32,37,103,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,106,97,99,111,98,105,97,110,32,37,100,120,37,100,32,91,105,100,58,32,37,108,100,93,0,0,0,0,0,0,0,0,115,101,116,32,120,108,97,98,101,108,10,0,0,0,0,0,108,111,98,97,116,116,111,52,0,0,0,0,0,0,0,0,69,114,114,111,114,32,105,110,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,46,32,83,116,111,114,105,110,103,32,114,101,115,117,108,116,115,32,97,110,100,32,101,120,105,116,105,110,103,46,10,85,115,101,32,45,108,118,61,76,79,71,95,73,78,73,84,32,45,119,32,102,111,114,32,109,111,114,101,32,105,110,102,111,114,109,97,116,105,111,110,46,0,83,105,109,117,108,97,116,105,111,110,32,99,97,108,108,32,116,101,114,109,105,110,97,116,101,40,41,32,97,116,32,116,105,109,101,32,37,102,10,77,101,115,115,97,103,101,32,58,32,37,115,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,106,97,99,111,98,105,97,110,32,102,117,110,99,116,105,111,110,32,112,111,105,110,116,101,114,32,105,115,32,105,110,118,97,108,105,100,0,0,0,0,115,101,116,32,116,105,116,108,101,10,0,0,0,0,0,0,108,111,98,97,116,116,111,50,0,0,0,0,0,0,0,0,78,79,32,111,118,101,114,114,105,100,101,32,103,105,118,101,110,32,111,110,32,116,104,101,32,99,111,109,109,97,110,100,32,108,105,110,101,46,0,0,116,114,117,101,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0])
.concat([98,105,115,101,99,116,105,111,110,32,109,101,116,104,111,100,32,115,116,97,114,116,115,32,105,110,32,105,110,116,101,114,118,97,108,32,91,37,101,44,32,37,101,93,0,0,0,0,115,101,116,32,111,117,116,112,117,116,32,34,37,115,95,112,114,111,102,46,37,115,37,100,46,116,104,117,109,98,46,115,118,103,34,10,0,0,0,0,114,97,100,97,117,49,0,0,111,118,101,114,114,105,100,101,32,100,111,110,101,33,0,0,73,110,116,101,114,112,111,108,97,116,101,32,108,105,110,101,97,114,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,117,110,115,101,116,32,98,111,114,100,101,114,10,0,0,0,114,97,100,97,117,51,0,0,111,118,101,114,114,105,100,101,32,37,115,32,61,32,37,115,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,46,32,83,121,115,116,101,109,32,111,102,32,105,110,105,116,105,97,108,32,101,113,117,97,116,105,111,110,115,32,97,114,101,32,110,111,116,32,99,111,110,115,105,115,116,101,110,116,10,40,108,101,97,115,116,32,115,113,117,97,114,101,32,102,117,110,99,116,105,111,110,32,118,97,108,117,101,32,105,115,32,37,103,41,0,0,0,0,0,117,110,115,101,116,32,121,116,105,99,115,10,0,0,0,0,114,97,100,97,117,53,0,0,61,0,0,0,0,0,0,0,68,65,83,83,76,45,45,32,32,72,65,83,32,66,69,67,79,77,69,32,46,76,69,46,32,48,46,48,0,0,0,0,106,117,110,107,32,97,102,116,101,114,32,100,111,99,117,109,101,110,116,32,101,108,101,109,101,110,116,0,0,0,0,0,99,97,110,32,110,111,116,32,105,110,105,116,105,97,108,122,101,32,74,97,99,111,98,105,97,110,115,32,102,111,114,32,100,121,110,97,109,105,99,32,115,116,97,116,101,32,115,101,108,101,99,116,105,111,110,0,117,110,115,101,116,32,120,116,105,99,115,10,0,0,0,0,100,97,115,115,108,0,0,0,114,101,97,100,32,111,118,101,114,114,105,100,101,32,118,97,108,117,101,115,58,32,37,115,0,0,0,0,0,0,0,0,76,79,71,95,73,80,79,80,84,0,0,0,0,0,0,0,105,111,109,0,0,0,0,0,68,101,99,0,0,0,0,0,100,0,0,0,0,0,0,0,112,108,111,116,32,34,37,115,95,112,114,111,102,46,100,97,116,97,34,32,98,105,110,97,114,121,32,102,111,114,109,97,116,61,34,37,37,42,117,105,110,116,51,50,37,37,42,50,100,111,117,98,108,101,37,37,37,100,117,105,110,116,51,50,37,37,42,37,100,100,111,117,98,108,101,34,32,117,115,105,110,103,32,37,100,32,119,32,108,32,108,119,32,37,100,10,0,0,0,0,0,0,0,0,113,115,115,0,0,0,0,0,44,0,0,0,0,0,0,0,78,111,118,0,0,0,0,0,111,102,102,32,101,110,100,32,111,102,32,114,101,99,111,114,100,0,0,0,0,0,0,0,77,97,116,114,105,120,32,116,121,112,101,32,109,105,115,109,97,116,99,104,0,0,0,0,112,108,111,116,32,34,37,115,95,112,114,111,102,46,100,97,116,97,34,32,98,105,110,97,114,121,32,102,111,114,109,97,116,61,34,37,37,42,117,105,110,116,51,50,37,37,50,100,111,117,98,108,101,37,37,42,37,100,117,105,110,116,51,50,37,37,37,100,100,111,117,98,108,101,34,32,117,115,105,110,103,32,49,58,40,36,37,100,62,49,101,45,57,32,63,32,36,37,100,32,58,32,49,101,45,51,48,41,32,119,32,108,32,108,119,32,37,100,10,0,105,110,108,105,110,101,45,114,117,110,103,101,107,117,116,116,97,0,0,0,0,0,0,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,99,111,117,108,100,32,110,111,116,32,111,112,101,110,32,116,104,101,32,102,105,108,101,32,103,105,118,101,110,32,116,111,32,45,111,118,101,114,114,105,100,101,70,105,108,101,61,37,115,0,0,0,0,0,79,99,116,0,0,0,0,0,38,113,117,111,116,59,0,0,100,97,115,115,108,32,119,105,116,104,32,105,110,116,101,114,110,97,108,32,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,0,0,114,101,97,100,32,111,118,101,114,114,105,100,101,32,118,97,108,117,101,115,32,102,114,111,109,32,102,105,108,101,58,32,37,115,0,0,0,0,0,0,82,101,113,117,101,115,116,101,100,32,101,113,117,97,116,105,111,110,32,119,105,116,104,32,112,114,111,102,105,108,101,114,32,105,110,100,101,120,32,37,108,100,44,32,98,117,116,32,99,111,117,108,100,32,110,111,116,32,102,105,110,100,32,105,116,33,0,0,0,0,0,0,83,101,112,0,0,0,0,0,116,105,109,101,40,41,32,102,97,105,108,101,100,58,32,37,115,0,0,0,0,0,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,111,112,116,105,111,110,32,45,108,115,32,37,115,0,0,0,0,0,0,73,110,105,116,105,97,108,105,122,105,110,103,32,68,65,83,83,76,0,0,0,0,0,0,69,114,114,111,114,44,32,116,104,101,32,71,85,73,68,58,32,37,115,32,102,114,111,109,32,105,110,112,117,116,32,100,97,116,97,32,102,105,108,101,58,32,37,115,32,100,111,101,115,32,110,111,116,32,109,97,116,99,104,32,116,104,101,32,71,85,73,68,32,99,111,109,112,105,108,101,100,32,105,110,32,116,104,101,32,109,111,100,101,108,58,32,37,115,0,0,68,97,116,97,83,101,116,58,32,116,105,109,101,10,0,0,67,97,110,110,111,116,32,119,114,105,116,101,32,116,111,32,102,105,108,101,32,37,115,0,37,46,49,54,103,44,0,0,38,97,112,111,115,59,0,0,100,97,115,115,108,32,119,105,116,104,32,99,111,108,111,114,101,100,32,115,121,109,98,111,108,105,99,32,106,97,99,111,98,105,97,110,0,0,0,0,91,37,108,100,93,32,91,37,49,53,103,93,32,58,61,32,37,115,32,40,100,105,115,99,114,101,116,101,41,32,91,115,99,97,108,105,110,103,32,99,111,101,102,102,105,99,105,101,110,116,58,32,37,103,93,0,37,49,50,103,115,32,91,37,53,46,49,102,37,37,93,32,99,114,101,97,116,105,110,103,32,111,117,116,112,117,116,45,102,105,108,101,0,0,0,0,115,105,109,117,108,97,116,105,111,110,95,105,110,112,117,116,95,120,109,108,46,99,112,112,58,32,117,115,97,103,101,32,101,114,114,111,114,32,121,111,117,32,99,97,110,110,111,116,32,104,97,118,101,32,98,111,116,104,32,45,111,118,101,114,114,105,100,101,32,97,110,100,32,45,111,118,101,114,114,105,100,101,70,105,108,101,32,97,99,116,105,118,101,32,97,116,32,116,104,101,32,115,97,109,101,32,116,105,109,101,46,32,115,101,101,32,77,111,100,101,108,32,45,63,32,102,111,114,32,109,111,114,101,32,105,110,102,111,33,0,0,0,0,0,65,117,103,0,0,0,0,0,38,103,116,59,0,0,0,0,100,97,115,115,108,32,119,105,116,104,32,110,117,109,101,114,105,99,97,108,32,106,97,99,111,98,105,97,110,0,0,0,83,116,114,105,110,103,32,65,108,105,97,115,32,118,97,114,105,97,98,108,101,32,0,0,68,105,115,97,98,108,101,100,32,116,105,109,101,32,109,101,97,115,117,114,101,109,101,110,116,115,32,98,101,99,97,117,115,101,32,116,104,101,32,111,117,116,112,117,116,32,102,105,108,101,32,99,111,117,108,100,32,110,111,116,32,98,101,32,103,101,110,101,114,97,116,101,100,58,32,37,115,0,0,0,95,112,114,111,102,46,100,97,116,97,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,116,95,105,110,105,116,0,114,101,115,116,111,114,101,95,109,101,109,111,114,121,95,115,116,97,116,101,0,0,0,0,112,117,115,104,95,109,101,109,111,114,121,95,115,116,97,116,101,115,0,0,0,0,0,0,112,114,105,110,116,77,111,100,101,108,73,110,102,111,0,0,112,105,118,111,116,0,0,0,111,109,99,95,109,97,116,108,97,98,52,95,114,101,97,100,95,118,97,108,115,0,0,0,111,109,99,95,109,97,116,108,97,98,52,95,114,101,97,100,95,115,105,110,103,108,101,95,118,97,108,0,0,0,0,0,109,111,100,101,108,73,110,102,111,88,109,108,73,110,105,116,0,0,0,0,0,0,0,0,102,105,110,100,82,111,111,116,0,0,0,0,0,0,0,0,100,97,115,114,116,95,115,116,101,112,0,0,0,0,0,0,98,105,115,101,99,116,105,111,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,248,234,0,0,46,0,0,0,158,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,235,0,0,4,1,0,0,222,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,235,0,0,98,0,0,0,80,1,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,235,0,0,124,0,0,0,36,0,0,0,140,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,235,0,0,124,0,0,0,14,0,0,0,140,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,235,0,0,124,0,0,0,30,0,0,0,140,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,235,0,0,228,0,0,0,110,0,0,0,72,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,235,0,0,72,1,0,0,248,0,0,0,72,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,235,0,0,220,0,0,0,250,0,0,0,72,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,235,0,0,74,1,0,0,196,0,0,0,72,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,236,0,0,68,1,0,0,122,0,0,0,72,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,236,0,0,218,0,0,0,148,0,0,0,72,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,236,0,0,58,0,0,0,150,0,0,0,72,0,0,0,154,0,0,0,4,0,0,0,32,0,0,0,6,0,0,0,20,0,0,0,56,0,0,0,2,0,0,0,248,255,255,255,160,236,0,0,22,0,0,0,6,0,0,0,42,0,0,0,10,0,0,0,2,0,0,0,40,0,0,0,162,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,236,0,0,252,0,0,0,42,1,0,0,72,0,0,0,20,0,0,0,16,0,0,0,60,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,200,236,0,0,86,0,0,0,134,0,0,0,150,0,0,0,156,0,0,0,78,0,0,0,56,0,0,0,66,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,236,0,0,104,0,0,0,64,0,0,0,72,0,0,0,60,0,0,0,52,0,0,0,16,0,0,0,56,0,0,0,70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,237,0,0,132,0,0,0,94,0,0,0,72,0,0,0,54,0,0,0,108,0,0,0,24,0,0,0,78,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,237,0,0,60,1,0,0,2,0,0,0,72,0,0,0,46,0,0,0,34,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,237,0,0,70,0,0,0,6,0,0,0,72,0,0,0,66,0,0,0,14,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,237,0,0,30,1,0,0,152,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,237,0,0,42,0,0,0,194,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,237,0,0,12,0,0,0,234,0,0,0,72,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,2,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,237,0,0,128,0,0,0,26,0,0,0,72,0,0,0,22,0,0,0,26,0,0,0,34,0,0,0,24,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,237,0,0,60,0,0,0,34,0,0,0,72,0,0,0,48,0,0,0,46,0,0,0,38,0,0,0,40,0,0,0,28,0,0,0,44,0,0,0,36,0,0,0,54,0,0,0,52,0,0,0,50,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,237,0,0,78,0,0,0,4,0,0,0,72,0,0,0,76,0,0,0,68,0,0,0,64,0,0,0,66,0,0,0,58,0,0,0,30,0,0,0,62,0,0,0,74,0,0,0,72,0,0,0,70,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,237,0,0,100,0,0,0,120,0,0,0,72,0,0,0,60,0,0,0,24,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,237,0,0,40,0,0,0,236,0,0,0,72,0,0,0,106,0,0,0,28,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,238,0,0,48,1,0,0,186,0,0,0,72,0,0,0,14,0,0,0,4,0,0,0,104,0,0,0,14,0,0,0,74,0,0,0,16,0,0,0,94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,238,0,0,242,0,0,0,88,0,0,0,72,0,0,0,2,0,0,0,8,0,0,0,54,0,0,0,136,0,0,0,124,0,0,0,82,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,238,0,0,242,0,0,0,188,0,0,0,72,0,0,0,16,0,0,0,6,0,0,0,14,0,0,0,160,0,0,0,144,0,0,0,36,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,238,0,0,242,0,0,0,212,0,0,0,72,0,0,0,10,0,0,0,12,0,0,0,110,0,0,0,44,0,0,0,92,0,0,0,24,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,238,0,0,242,0,0,0,52,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,238,0,0,84,0,0,0,178,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,238,0,0,242,0,0,0,106,0,0,0,72,0,0,0,42,0,0,0,26,0,0,0,48,0,0,0,96,0,0,0,36,0,0,0,56,0,0,0,72,0,0,0,6,0,0,0,22,0,0,0,86,0,0,0,18,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,238,0,0,78,1,0,0,54,0,0,0,72,0,0,0,4,0,0,0,16,0,0,0,60,0,0,0,62,0,0,0,26,0,0,0,56,0,0,0,48,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,0,0,0,0,0,0,0,248,238,0,0,16,1,0,0,2,1,0,0,200,255,255,255,200,255,255,255,248,238,0,0,48,0,0,0,136,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,239,0,0,176,0,0,0,38,1,0,0,98,0,0,0,12,0,0,0,28,0,0,0,60,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,239,0,0,242,0,0,0,112,0,0,0,72,0,0,0,10,0,0,0,12,0,0,0,110,0,0,0,44,0,0,0,92,0,0,0,24,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,239,0,0,242,0,0,0,224,0,0,0,72,0,0,0,10,0,0,0,12,0,0,0,110,0,0,0,44,0,0,0,92,0,0,0,24,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,239,0,0,74,0,0,0,28,1,0,0,84,0,0,0,70,0,0,0,28,0,0,0,4,0,0,0,62,0,0,0,110,0,0,0,34,0,0,0,48,0,0,0,8,0,0,0,80,0,0,0,32,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,239,0,0,182,0,0,0,52,1,0,0,32,0,0,0,44,0,0,0,16,0,0,0,20,0,0,0,112,0,0,0,128,0,0,0,58,0,0,0,34,0,0,0,30,0,0,0,100,0,0,0,74,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,239,0,0,16,0,0,0,162,0,0,0,84,0,0,0,70,0,0,0,32,0,0,0,12,0,0,0,62,0,0,0,110,0,0,0,34,0,0,0,4,0,0,0,8,0,0,0,88,0,0,0,32,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,239,0,0,134,0,0,0,0,1,0,0,4,0,0,0,12,0,0,0,28,0,0,0,60,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,96,239,0,0,160,0,0,0,138,0,0,0,152,255,255,255,152,255,255,255,96,239,0,0,114,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,112,239,0,0,216,0,0,0,238,0,0,0,148,255,255,255,148,255,255,255,112,239,0,0,140,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,160,239,0,0,66,0,0,0,24,1,0,0,252,255,255,255,252,255,255,255,160,239,0,0,204,0,0,0,180,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,184,239,0,0,32,1,0,0,54,1,0,0,252,255,255,255,252,255,255,255,184,239,0,0,146,0,0,0,8,1,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,208,239,0,0,116,0,0,0,82,1,0,0,248,255,255,255,248,255,255,255,208,239,0,0,244,0,0,0,50,1,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,232,239,0,0,144,0,0,0,14,1,0,0,248,255,255,255,248,255,255,255,232,239,0,0,192,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,0,0,26,1,0,0,92,0,0,0,58,0,0,0,54,0,0,0,12,0,0,0,22,0,0,0,58,0,0,0,110,0,0,0,34,0,0,0,116,0,0,0,8,0,0,0,54,0,0,0,32,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,240,0,0,12,1,0,0,246,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,240,0,0,64,1,0,0,46,1,0,0,28,0,0,0,44,0,0,0,16,0,0,0,20,0,0,0,68,0,0,0,128,0,0,0,58,0,0,0,34,0,0,0,30,0,0,0,100,0,0,0,74,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,240,0,0,214,0,0,0,18,1,0,0,52,0,0,0,70,0,0,0,32,0,0,0,12,0,0,0,114,0,0,0,110,0,0,0,34,0,0,0,4,0,0,0,8,0,0,0,88,0,0,0,32,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,240,0,0,40,1,0,0,202,0,0,0,72,0,0,0,84,0,0,0,152,0,0,0,64,0,0,0,116,0,0,0,10,0,0,0,48,0,0,0,64,0,0,0,38,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,240,0,0,142,0,0,0,80,0,0,0,72,0,0,0,142,0,0,0,148,0,0,0,92,0,0,0,108,0,0,0,110,0,0,0,40,0,0,0,146,0,0,0,72,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,240,0,0,44,1,0,0,154,0,0,0,72,0,0,0,12,0,0,0,72,0,0,0,66,0,0,0,60,0,0,0,112,0,0,0,74,0,0,0,118,0,0,0,80,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,240,0,0,102,0,0,0,232,0,0,0,72,0,0,0,130,0,0,0,138,0,0,0,46,0,0,0,100,0,0,0,42,0,0,0,34,0,0,0,100,0,0,0,98,0,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,241,0,0,118,0,0,0,22,0,0,0,14,0,0,0,44,0,0,0,16,0,0,0,20,0,0,0,112,0,0,0,128,0,0,0,58,0,0,0,88,0,0,0,104,0,0,0,32,0,0,0,74,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,241,0,0,20,0,0,0,34,1,0,0,90,0,0,0,70,0,0,0,32,0,0,0,12,0,0,0,62,0,0,0,110,0,0,0,34,0,0,0,120,0,0,0,24,0,0,0,6,0,0,0,32,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,241,0,0,66,1,0,0,6,1,0,0,90,0,0,0,210,0,0,0,12,0,0,0,2,0,0,0,26,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,52,216,0,0,124,241,0,0,144,241,0,0,72,216,0,0,12,218,0,0,164,241,0,0,184,241,0,0,32,218,0,0,60,218,0,0,204,241,0,0,224,241,0,0,80,218,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,111,117,116,95,111,102,95,114,97,110,103,101,0,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,98,97,115,105,99,95,111,115,116,114,105,110,103,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,105,110,103,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,78,83,95,57,97,108,108,111,99,97,116,111,114,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,98,97,115,105,99,95,111,102,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,78,83,116,51,95,95,49,49,52,98,97,115,105,99,95,105,102,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,102,105,108,101,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,0,0,0,0,8,222,0,0,0,0,0,0,24,222,0,0,0,0,0,0,40,222,0,0,240,234,0,0,0,0,0,0,0,0,0,0,56,222,0,0,240,234,0,0,0,0,0,0,0,0,0,0,72,222,0,0,240,234,0,0,0,0,0,0,0,0,0,0,96,222,0,0,72,235,0,0,0,0,0,0,0,0,0,0,120,222,0,0,72,235,0,0,0,0,0,0,0,0,0,0,144,222,0,0,240,234,0,0,0,0,0,0,0,0,0,0,160,222,0,0,176,221,0,0,184,222,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,88,240,0,0,0,0,0,0,176,221,0,0,0,223,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,96,240,0,0,0,0,0,0,176,221,0,0,72,223,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,104,240,0,0,0,0,0,0,176,221,0,0,144,223,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,112,240,0,0,0,0,0,0,0,0,0,0,216,223,0,0,80,237,0,0,0,0,0,0,0,0,0,0,8,224,0,0,80,237,0,0,0,0,0,0,176,221,0,0,56,224,0,0,0,0,0,0,1,0,0,0,136,239,0,0,0,0,0,0,176,221,0,0,80,224,0,0,0,0,0,0,1,0,0,0,136,239,0,0,0,0,0,0,176,221,0,0,104,224,0,0,0,0,0,0,1,0,0,0,144,239,0,0,0,0,0,0,176,221,0,0,128,224,0,0,0,0,0,0,1,0,0,0,144,239,0,0,0,0,0,0,176,221,0,0,152,224,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,8,241,0,0,0,8,0,0,176,221,0,0,224,224,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,8,241,0,0,0,8,0,0,176,221,0,0,40,225,0,0,0,0,0,0,3,0,0,0,136,238,0,0,2,0,0,0,88,235,0,0,2,0,0,0,232,238,0,0,0,8,0,0,176,221,0,0,112,225,0,0,0,0,0,0,3,0,0,0,136,238,0,0,2,0,0,0,88,235,0,0,2,0,0,0,240,238,0,0,0,8,0,0,0,0,0,0,184,225,0,0,136,238,0,0,0,0,0,0,0,0,0,0,208,225,0,0,136,238,0,0,0,0,0,0,176,221,0,0,232,225,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,152,239,0,0,2,0,0,0,176,221,0,0,0,226,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,152,239,0,0,2,0,0,0,0,0,0,0,24,226,0,0,0,0,0,0,48,226,0,0,16,240,0,0,0,0,0,0,176,221,0,0,80,226,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,0,236,0,0,0,0,0,0,176,221,0,0,152,226,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,24,236,0,0,0,0,0,0,176,221,0,0,224,226,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,48,236,0,0,0,0,0,0,176,221,0,0,40,227,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,72,236,0,0,0,0,0,0,0,0,0,0,112,227,0,0,136,238,0,0,0,0,0,0,0,0,0,0,136,227,0,0,136,238,0,0,0,0,0,0,176,221,0,0,160,227,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,32,240,0,0,2,0,0,0,176,221,0,0,200,227,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,32,240,0,0,2,0,0,0,176,221,0,0,240,227,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,32,240,0,0,2,0,0,0,176,221,0,0,24,228,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,32,240,0,0,2,0,0,0,0,0,0,0,64,228,0,0,128,239,0,0,0,0,0,0,0,0,0,0,88,228,0,0,136,238,0,0,0,0,0,0,176,221,0,0,112,228,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,0,241,0,0,2,0,0,0,176,221,0,0,136,228,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,0,241,0,0,2,0,0,0,0,0,0,0,160,228,0,0,0,0,0,0,200,228,0,0,0,0,0,0,240,228,0,0,184,239,0,0,0,0,0,0,0,0,0,0,56,229,0,0,40,240,0,0,0,0,0,0,0,0,0,0,88,229,0,0,104,238,0,0,0,0,0,0,0,0,0,0,128,229,0,0,104,238,0,0,0,0,0,0,0,0,0,0,168,229,0,0,80,239,0,0,0,0,0,0,0,0,0,0,240,229,0,0,0,0,0,0,40,230,0,0,0,0,0,0,96,230,0,0,0,0,0,0,128,230,0,0,184,239,0,0,0,0,0,0,0,0,0,0,176,230,0,0,232,239,0,0,0,0,0,0,0,0,0,0,224,230,0,0,0,0,0,0,0,231,0,0,0,0,0,0,32,231,0,0,0,0,0,0,64,231,0,0,176,221,0,0,88,231,0,0,0,0,0,0,1,0,0,0,224,235,0,0,3,244,255,255,176,221,0,0,136,231,0,0,0,0,0,0,1,0,0,0,240,235,0,0,3,244,255,255,176,221,0,0,184,231,0,0,0,0,0,0,1,0,0,0,224,235,0,0,3,244,255,255,176,221,0,0,232,231,0,0,0,0,0,0,1,0,0,0,240,235,0,0,3,244,255,255,0,0,0,0,24,232,0,0])
.concat([80,239,0,0,0,0,0,0,0,0,0,0,72,232,0,0,24,235,0,0,0,0,0,0,0,0,0,0,96,232,0,0,0,0,0,0,120,232,0,0,88,239,0,0,0,0,0,0,0,0,0,0,144,232,0,0,72,239,0,0,0,0,0,0,0,0,0,0,176,232,0,0,80,239,0,0,0,0,0,0,0,0,0,0,208,232,0,0,0,0,0,0,240,232,0,0,0,0,0,0,16,233,0,0,0,0,0,0,48,233,0,0,176,221,0,0,80,233,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,248,240,0,0,2,0,0,0,176,221,0,0,112,233,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,248,240,0,0,2,0,0,0,176,221,0,0,144,233,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,248,240,0,0,2,0,0,0,176,221,0,0,176,233,0,0,0,0,0,0,2,0,0,0,136,238,0,0,2,0,0,0,248,240,0,0,2,0,0,0,0,0,0,0,208,233,0,0,0,0,0,0,232,233,0,0,0,0,0,0,0,234,0,0,0,0,0,0,24,234,0,0,72,239,0,0,0,0,0,0,0,0,0,0,48,234,0,0,80,239,0,0,0,0,0,0,0,0,0,0,72,234,0,0,80,241,0,0,0,0,0,0,0,0,0,0,112,234,0,0,80,241,0,0,0,0,0,0,0,0,0,0,152,234,0,0,96,241,0,0,0,0,0,0,0,0,0,0,192,234,0,0,232,234,0,0,0,0,0,0,56,0,0,0,0,0,0,0,184,239,0,0,32,1,0,0,54,1,0,0,200,255,255,255,200,255,255,255,184,239,0,0,146,0,0,0,8,1,0,0,104,0,0,0,0,0,0,0,184,239,0,0,32,1,0,0,54,1,0,0,152,255,255,255,152,255,255,255,184,239,0,0,146,0,0,0,8,1,0,0,108,0,0,0,0,0,0,0,232,239,0,0,144,0,0,0,14,1,0,0,148,255,255,255,148,255,255,255,232,239,0,0,192,0,0,0,76,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,71,46,71,32,47,32,40,49,46,48,32,43,32,71,46,97,108,112,104,97,32,42,32,40,71,46,84,32,45,32,71,46,84,95,114,101,102,41,41,32,98,101,99,97,117,115,101,32,49,46,48,32,43,32,71,46,97,108,112,104,97,32,42,32,40,71,46,84,32,45,32,71,46,84,95,114,101,102,41,32,61,61,32,48,58,32,70,105,108,101,58,32,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,66,97,115,105,99,46,109,111,32,76,105,110,101,58,32,50,50,51,0,0,0,0,0,0,76,46,118,32,47,32,76,46,76,32,98,101,99,97,117,115,101,32,76,46,76,32,61,61,32,48,58,32,70,105,108,101,58,32,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,66,97,115,105,99,46,109,111,32,76,105,110,101,58,32,51,51,56,0,0,0,0,0,0,0,0,67,49,46,105,32,47,32,67,49,46,67,32,98,101,99,97,117,115,101,32,67,49,46,67,32,61,61,32,48,58,32,70,105,108,101,58,32,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,66,97,115,105,99,46,109,111,32,76,105,110,101,58,32,50,56,54,0,0,0,0,0,67,50,46,105,32,47,32,67,50,46,67,32,98,101,99,97,117,115,101,32,67,50,46,67,32,61,61,32,48,58,32,70,105,108,101,58,32,47,117,115,114,47,108,105,98,47,111,109,108,105,98,114,97,114,121,47,77,111,100,101,108,105,99,97,32,51,46,50,46,49,47,69,108,101,99,116,114,105,99,97,108,47,65,110,97,108,111,103,47,66,97,115,105,99,46,109,111,32,76,105,110,101,58,32,50,56,54,0,0,0,0,0,0,0,0,0,192,158,0,0,88,131,0,0,160,108,0,0,112,95,0,0,88,82,0,0,224,74,0,0,24,66,0,0,240,56,0,0,176,201,0,0,64,194,0,0,176,188,0,0,192,184,0,0,32,181,0,0,232,178,0,0,152,176,0,0,176,174,0,0,200,172,0,0,16,171,0,0,88,169,0,0,64,165,0,0,16,163,0,0,248,160,0,0,248,158,0,0,248,156,0,0,232,154,0,0,120,152,0,0,64,150,0,0,160,147,0,0,32,145,0,0,208,137,0,0,160,135,0,0,152,133,0,0,104,131,0,0,104,129,0,0,48,127,0,0,128,124,0,0,128,122,0,0,88,120,0,0,168,118,0,0,64,114,0,0,0,0,0,0,56,81,0,0,88,65,0,0,32,65,0,0,24,202,0,0,200,63,0,0,0,63,0,0,128,201,0,0,192,200,0,0,96,200,0,0,168,199,0,0,160,198,0,0,32,198,0,0,136,196,0,0,192,195,0,0,24,195,0,0,184,194,0,0,24,194,0,0,176,193,0,0,144,203,0,0,208,202,0,0,56,81,0,0,88,65,0,0,32,65,0,0,72,64,0,0,200,63,0,0,0,63,0,0,8,62,0,0,72,59,0,0,216,58,0,0,24,58,0,0,24,57,0,0,112,56,0,0,200,55,0,0,72,55,0,0,192,54,0,0,184,206,0,0,144,205,0,0,8,204,0,0,144,203,0,0,208,202,0,0,192,83,0,0,136,79,0,0,176,78,0,0,240,76,0,0,128,76,0,0,176,75,0,0,48,75,0,0,0,0,0,0,192,83,0,0,48,83,0,0,136,82,0,0,184,81,0,0,72,81,0,0,136,80,0,0,232,79,0,0,0,0,0,0,24,59,0,0,192,171,0,0,168,148,0,0,136,121,0,0,184,102,0,0,0,0,0,0,120,90,0,0,184,79,0,0,16,71,0,0,136,63,0,0,184,102,0,0,0,0,0,0,48,159,0,0,216,90,0,0,248,89,0,0,232,88,0,0,128,160,0,0,96,85,0,0,184,123,0,0,8,184,0,0,128,160,0,0,24,133,0,0,208,109,0,0,248,95,0,0,192,82,0,0,80,75,0,0,136,66,0,0,176,57,0,0,64,202,0,0,208,194,0,0,72,189,0,0,24,185,0,0,112,181,0,0,104,179,0,0,240,176,0,0,8,175,0,0,40,173,0,0,80,171,0,0,144,169,0,0,136,165,0,0,64,163,0,0,24,161,0,0,48,159,0,0,32,157,0,0,32,157,0,0,32,155,0,0,184,152,0,0,80,150,0,0,192,147,0,0,88,145,0,0,240,137,0,0,200,135,0,0,192,133,0,0,176,131,0,0,216,129,0,0,160,127,0,0,240,124,0,0,224,122,0,0,208,121,0,0,120,119,0,0,104,117,0,0,136,113,0,0,192,111,0,0,32,110,0,0,80,108,0,0,176,106,0,0,121,101,115,0,0,0,0,0,118,101,114,115,105,111,110,0,115,116,97,110,100,97,108,111,110,101,0,0,0,0,0,0,110,111,0,0,0,0,0,0,101,110,99,111,100,105,110,103,0,0,0,0,0,0,0,0,85,84,70,45,56,0,0,0,85,84,70,45,49,54,76,69,0,0,0,0,0,0,0,0,85,84,70,45,49,54,66,69,0,0,0,0,0,0,0,0,85,84,70,45,49,54,0,0,85,83,45,65,83,67,73,73,0,0,0,0,0,0,0,0,83,89,83,84,69,77,0,0,82,69,81,85,73,82,69,68,0,0,0,0,0,0,0,0,80,85,66,76,73,67,0,0,80,67,68,65,84,65,0,0,78,79,84,65,84,73,79,78,0,0,0,0,0,0,0,0,78,77,84,79,75,69,78,83,0,0,0,0,0,0,0,0,78,77,84,79,75,69,78,0,78,68,65,84,65,0,0,0,73,83,79,45,56,56,53,57,45,49,0,0,0,0,0,0,73,78,67,76,85,68,69,0,73,77,80,76,73,69,68,0,73,71,78,79,82,69,0,0,73,68,82,69,70,83,0,0,73,68,82,69,70,0,0,0,73,68,0,0,0,0,0,0,70,73,88,69,68,0,0,0,69,78,84,73,84,89,0,0,69,78,84,73,84,73,69,83,0,0,0,0,0,0,0,0,69,77,80,84,89,0,0,0,69,76,69,77,69,78,84,0,68,79,67,84,89,80,69,0,67,68,65,84,65,0,0,0,65,84,84,76,73,83,84,0,65,78,89,0,0,0,0,0,192,83,0,0,200,71,0,0,240,70,0,0,232,69,0,0,192,83,0,0,56,74,0,0,64,73,0,0,72,72,0,0,4,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,16,145,0,0,152,186,0,0,40,162,0,0,216,134,0,0,24,112,0,0,88,97,0,0,136,83,0,0,232,75,0,0,80,67,0,0,136,58,0,0,232,202,0,0,104,195,0,0,0,190,0,0,104,185,0,0,136,58,0,0,152,181,0,0,144,179,0,0,8,177,0,0,32,175,0,0,80,173,0,0,112,171,0,0,224,169,0,0,16,166,0,0,144,163,0,0,112,161,0,0,104,159,0,0,168,157,0,0,152,155,0,0,96,153,0,0,32,151,0,0,96,148,0,0,0,146,0,0,0,0,0,0,2,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,64,107,0,0,72,181,0,0,56,159,0,0,224,131,0,0,40,109,0,0,168,95,0,0,152,82,0,0,56,75,0,0,128,66,0,0,192,57,0,0,80,202,0,0,224,194,0,0,96,189,0,0,48,185,0,0,136,181,0,0,120,179,0,0,0,177,0,0,24,175,0,0,56,173,0,0,96,171,0,0,208,169,0,0,240,165,0,0,128,163,0,0,104,161,0,0,96,159,0,0,152,157,0,0,144,155,0,0,40,99,0,0,224,97,0,0,24,148,0,0,152,96,0,0,232,138,0,0,40,136,0,0,184,95,0,0,72,94,0,0,128,130,0,0,24,128,0,0,112,125,0,0,72,93,0,0,64,92,0,0,32,91,0,0,16,90,0,0,224,112,0,0,80,111,0,0,16,89,0,0,224,85,0,0,200,83,0,0,160,104,0,0,96,103,0,0,152,102,0,0,224,101,0,0,152,157,0,0,144,155,0,0,24,153,0,0,200,150,0,0,24,148,0,0,192,145,0,0,232,138,0,0,40,136,0,0,48,134,0,0,40,132,0,0,128,130,0,0,24,128,0,0,112,125,0,0,64,123,0,0,56,121,0,0,24,119,0,0,96,115,0,0,224,112,0,0,80,111,0,0,96,109,0,0,168,107,0,0,248,105,0,0,160,104,0,0,96,103,0,0,152,102,0,0,224,101,0,0,152,157,0,0,65,49,32,98,116,46,32,105,114,49,32,110,97,32,32,84,106,32,32,114,101,32,32,97,99,32,32,110,116,32,32,115,111,32,32,32,114,32,32,32,121,32,32,32,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_strlen"] = _strlen;
  Module["_strncpy"] = _strncpy;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,EDOTDOT:76,EBADMSG:77,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"No message of desired type",36:"Identifier removed",37:"Channel number out of range",38:"Level 2 not synchronized",39:"Level 3 halted",40:"Level 3 reset",41:"Link number out of range",42:"Protocol driver not attached",43:"No CSI structure available",44:"Level 2 halted",45:"Deadlock condition",46:"No record locks available",50:"Invalid exchange",51:"Invalid request descriptor",52:"Exchange full",53:"No anode",54:"Invalid request code",55:"Invalid slot",56:"File locking deadlock error",57:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",74:"Multihop attempted",76:"Cross mount point (not really error)",77:"Trying to read unreadable message",80:"Given log. name not unique",81:"f.d. invalid for this operation",82:"Remote address changed",83:"Can   access a needed shared lib",84:"Accessing a corrupted shared lib",85:".lib section in a.out corrupted",86:"Attempting to link in too many libs",87:"Attempting to exec a shared library",88:"Function not implemented",90:"Directory not empty",91:"File or path name too long",92:"Too many symbolic links",95:"Operation not supported on transport endpoint",96:"Protocol family not supported",104:"Connection reset by peer",105:"No buffer space available",106:"Address family not supported by protocol family",107:"Protocol wrong type for socket",108:"Socket operation on non-socket",109:"Protocol not available",110:"Can't send after socket shutdown",111:"Connection refused",112:"Address already in use",113:"Connection aborted",114:"Network is unreachable",115:"Network interface is not configured",116:"Connection timed out",117:"Host is down",118:"Host is unreachable",119:"Connection already in progress",120:"Socket already connected",121:"Destination address required",122:"Message too long",123:"Unknown protocol",124:"Socket type not supported",125:"Address not available",126:"Connection reset by network",127:"Socket is already connected",128:"Socket is not connected",129:"Too many references",131:"Too many users",132:"Quota exceeded",133:"Stale file handle",134:"Not supported",135:"No medium (in tape drive)",138:"Illegal byte sequence",139:"Value too large for defined data type",140:"Operation canceled",141:"State not recoverable",142:"Previous owner died",143:"Streams pipe error"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },mount:function (mount) {
        return MEMFS.create_node(null, '/', 0040000 | 0777, 0);
      },create_node:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.create_node(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.create_node(parent, newname, 0777 | 0120000, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 0x02) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },cwd:function () {
        return FS.currentPath;
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.currentPath, path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          if (node.parent.id === parent.id && node.name === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 0170000) === 0100000;
      },isDir:function (mode) {
        return (mode & 0170000) === 0040000;
      },isLink:function (mode) {
        return (mode & 0170000) === 0120000;
      },isChrdev:function (mode) {
        return (mode & 0170000) === 0020000;
      },isBlkdev:function (mode) {
        return (mode & 0170000) === 0060000;
      },isFIFO:function (mode) {
        return (mode & 0170000) === 0010000;
      },isSocket:function (mode) {
        return (mode & 0140000) === 0140000;
      },flagModes:{"r":0,"rs":8192,"r+":2,"w":1537,"wx":3585,"xw":3585,"w+":1538,"wx+":3586,"xw+":3586,"a":521,"ax":2569,"xa":2569,"a+":522,"ax+":2570,"xa+":2570},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 3;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 1024)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.currentPath) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 3) !== 0 ||  // opening for write
              (flags & 1024)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 3) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 3) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 8); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },mount:function (type, opts, mountpoint) {
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
        }
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 0100000;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 0001000;
        mode |= 0040000;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 0020000;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 512)) {
          mode = (mode & 4095) | 0100000;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 0200000)
          });
          node = lookup.node;
          path = lookup.path;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 512)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 2048)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~1024;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 1024)) {
          FS.truncate(node, 0);
        }
        // register the stream with the filesystem
        var stream = FS.createStream({
          path: path,
          node: node,
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 8) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 0040000 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 0040000 | 0777, 0);
      },nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 0140000, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {} : ['binary'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          var handleMessage = function(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (0 /* XXX missing C define POLLRDNORM */ | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (0 /* XXX missing C define POLLRDNORM */ | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 2;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 1:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;
  Module["_testSetjmp"] = _testSetjmp;var _setjmp=undefined;
  function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcmp"] = _memcmp;
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _srand(seed) {}
  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }
  function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  var _llvm_va_start=undefined;
  function _llvm_va_end() {}
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }
  function _GC_malloc() {
  Module['printErr']('missing function: GC_malloc'); abort(-1);
  }
  var _llvm_pow_f64=Math.pow;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }
  Module["_strcpy"] = _strcpy;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return Module['dynCall_iii'](cmp, base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }
  function _bsearch(key, base, num, size, compar) {
      var cmp = function(x, y) {
        return Module['dynCall_iii'](compar, x, y);
      };
      var left = 0;
      var right = num;
      var mid, test, addr;
      while (left < right) {
        mid = (left + right) >>> 1;
        addr = base + (mid * size);
        test = cmp(key, addr);
        if (test < 0) {
          right = mid;
        } else if (test > 0) {
          left = mid + 1;
        } else {
          return addr;
        }
      }
      return 0;
    }
  var ___timespec_struct_layout={__size__:8,tv_sec:0,tv_nsec:4};function _clock_gettime(clk_id, tp) {
      // int clock_gettime(clockid_t clk_id, struct timespec *tp);
      var now = Date.now();
      HEAP32[(((tp)+(___timespec_struct_layout.tv_sec))>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((tp)+(___timespec_struct_layout.tv_nsec))>>2)]=(now % 1000) * 1000 * 1000; // nanoseconds (really milliseconds)
      return 0;
    }
  var _fabs=Math.abs;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)),ret>>>0)|0);
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }
  function _perror(s) {
      // void perror(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/perror.html
      var stdout = HEAP32[((_stdout)>>2)];
      if (s) {
        _fputs(s, stdout);
        _fputc(58, stdout);
        _fputc(32, stdout);
      }
      var errnum = HEAP32[((___errno_location())>>2)];
      _puts(_strerror(errnum));
    }
  function _fmax(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.max(x, y);
    }
  var _sqrt=Math.sqrt;
  var _cos=Math.cos;
  var _sin=Math.sin;
  var _llvm_memset_p0i8_i64=_memset;
  var _ceil=Math.ceil;
  function _lis_matrix_set_value() {
  Module['printErr']('missing function: lis_matrix_set_value'); abort(-1);
  }
  function _lis_vector_create() {
  Module['printErr']('missing function: lis_vector_create'); abort(-1);
  }
  function _lis_vector_set_size() {
  Module['printErr']('missing function: lis_vector_set_size'); abort(-1);
  }
  function _lis_solver_create() {
  Module['printErr']('missing function: lis_solver_create'); abort(-1);
  }
  function _lis_solver_set_option() {
  Module['printErr']('missing function: lis_solver_set_option'); abort(-1);
  }
  function _lis_solver_destroy() {
  Module['printErr']('missing function: lis_solver_destroy'); abort(-1);
  }
  function _lis_vector_destroy() {
  Module['printErr']('missing function: lis_vector_destroy'); abort(-1);
  }
  function _nls_kinsol_allocate() {
  Module['printErr']('missing function: nls_kinsol_allocate'); abort(-1);
  }
  function _nls_kinsol_free() {
  Module['printErr']('missing function: nls_kinsol_free'); abort(-1);
  }
  var ___strtok_state=0;
  function _strtok_r(s, delim, lasts) {
      var skip_leading_delim = 1;
      var spanp;
      var c, sc;
      var tok;
      if (s == 0 && (s = getValue(lasts, 'i8*')) == 0) {
        return 0;
      }
      cont: while (1) {
        c = getValue(s++, 'i8');
        for (spanp = delim; (sc = getValue(spanp++, 'i8')) != 0;) {
          if (c == sc) {
            if (skip_leading_delim) {
              continue cont;
            } else {
              setValue(lasts, s, 'i8*');
              setValue(s - 1, 0, 'i8');
              return s - 1;
            }
          }
        }
        break;
      }
      if (c == 0) {
        setValue(lasts, 0, 'i8*');
        return 0;
      }
      tok = s - 1;
      for (;;) {
        c = getValue(s++, 'i8');
        spanp = delim;
        do {
          if ((sc = getValue(spanp++, 'i8')) == c) {
            if (c == 0) {
              s = 0;
            } else {
              setValue(s - 1, 0, 'i8');
            }
            setValue(lasts, s, 'i8*');
            return tok;
          }
        } while (sc != 0);
      }
      abort('strtok_r error!');
    }function _strtok(s, delim) {
      return _strtok_r(s, delim, ___strtok_state);
    }
  function _kinsol_initialization() {
  Module['printErr']('missing function: kinsol_initialization'); abort(-1);
  }
  function ___gxx_personality_v0() {
    }
  function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  var _fseeko=_fseek;
  var _ftello=_ftell;
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  var _atol=_atoi;
  function _signal(sig, func) {
      // TODO
      return 0;
    }
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _popen(command, mode) {
      // FILE *popen(const char *command, const char *mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/popen.html
      // We allow only one process, so no pipes.
      ___setErrNo(ERRNO_CODES.EMFILE);
      return 0;
    }
  var ___tm_struct_layout={__size__:44,tm_sec:0,tm_min:4,tm_hour:8,tm_mday:12,tm_mon:16,tm_year:20,tm_wday:24,tm_yday:28,tm_isdst:32,tm_gmtoff:36,tm_zone:40};
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[(((tm)+(___tm_struct_layout.tm_sec))>>2)],
        tm_min: HEAP32[(((tm)+(___tm_struct_layout.tm_min))>>2)],
        tm_hour: HEAP32[(((tm)+(___tm_struct_layout.tm_hour))>>2)],
        tm_mday: HEAP32[(((tm)+(___tm_struct_layout.tm_mday))>>2)],
        tm_mon: HEAP32[(((tm)+(___tm_struct_layout.tm_mon))>>2)],
        tm_year: HEAP32[(((tm)+(___tm_struct_layout.tm_year))>>2)],
        tm_wday: HEAP32[(((tm)+(___tm_struct_layout.tm_wday))>>2)],
        tm_yday: HEAP32[(((tm)+(___tm_struct_layout.tm_yday))>>2)],
        tm_isdst: HEAP32[(((tm)+(___tm_struct_layout.tm_isdst))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var leadingSomething = function(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      var leadingNulls = function(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      var compareByDay = function(date1, date2) {
        var sgn = function(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      var getFirstWeekStartDate = function(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      var getWeekBasedYear = function(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }
  var ___tm_current=allocate(4*26, "i8", ALLOC_STATIC);
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);
  var __tzname=allocate(8, "i32*", ALLOC_STATIC);
  var __daylight=allocate(1, "i32*", ALLOC_STATIC);
  var __timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
      HEAP32[((__timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((__daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset())
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((__tzname)>>2)]=winterNamePtr
      HEAP32[(((__tzname)+(4))>>2)]=summerNamePtr
    }function _localtime_r(time, tmPtr) {
      _tzset();
      var offsets = ___tm_struct_layout;
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[(((tmPtr)+(offsets.tm_sec))>>2)]=date.getSeconds()
      HEAP32[(((tmPtr)+(offsets.tm_min))>>2)]=date.getMinutes()
      HEAP32[(((tmPtr)+(offsets.tm_hour))>>2)]=date.getHours()
      HEAP32[(((tmPtr)+(offsets.tm_mday))>>2)]=date.getDate()
      HEAP32[(((tmPtr)+(offsets.tm_mon))>>2)]=date.getMonth()
      HEAP32[(((tmPtr)+(offsets.tm_year))>>2)]=date.getFullYear()-1900
      HEAP32[(((tmPtr)+(offsets.tm_wday))>>2)]=date.getDay()
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(offsets.tm_yday))>>2)]=yday
      HEAP32[(((tmPtr)+(offsets.tm_gmtoff))>>2)]=start.getTimezoneOffset() * 60
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(offsets.tm_isdst))>>2)]=dst
      HEAP32[(((tmPtr)+(offsets.tm_zone))>>2)]=___tm_timezone
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }
  function _pclose(stream) {
      // int pclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/pclose.html
      // We allow only one process, so no pipes.
      ___setErrNo(ERRNO_CODES.ECHILD);
      return -1;
    }
  function _system(command) {
      // int system(const char *command);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
      // Can't call external programs.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }
  function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }
  var _putc=_fputc;
  function _abort() {
      Module['abort']();
    }
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _truncate(path, length) {
      // int truncate(const char *path, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/truncate.html
      // NOTE: The path argument may be a string, to simplify ftruncate().
      if (typeof path !== 'string') path = Pointer_stringify(path);
      try {
        FS.truncate(path, length);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _ftruncate(fildes, length) {
      // int ftruncate(int fildes, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftruncate.html
      try {
        FS.ftruncate(fildes, length);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }
  var ___stat_struct_layout={__size__:68,st_dev:0,st_ino:4,st_mode:8,st_nlink:12,st_uid:16,st_gid:20,st_rdev:24,st_size:28,st_atime:32,st_spare1:36,st_mtime:40,st_spare2:44,st_ctime:48,st_spare3:52,st_blksize:56,st_blocks:60,st_spare4:64};function _stat(path, buf, dontResolveLastLink) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/stat.html
      // int stat(const char *path, struct stat *buf);
      // NOTE: dontResolveLastLink is a shortcut for lstat(). It should never be
      //       used in client code.
      path = typeof path !== 'string' ? Pointer_stringify(path) : path;
      try {
        var stat = dontResolveLastLink ? FS.lstat(path) : FS.stat(path);
        HEAP32[(((buf)+(___stat_struct_layout.st_dev))>>2)]=stat.dev;
        HEAP32[(((buf)+(___stat_struct_layout.st_ino))>>2)]=stat.ino
        HEAP32[(((buf)+(___stat_struct_layout.st_mode))>>2)]=stat.mode
        HEAP32[(((buf)+(___stat_struct_layout.st_nlink))>>2)]=stat.nlink
        HEAP32[(((buf)+(___stat_struct_layout.st_uid))>>2)]=stat.uid
        HEAP32[(((buf)+(___stat_struct_layout.st_gid))>>2)]=stat.gid
        HEAP32[(((buf)+(___stat_struct_layout.st_rdev))>>2)]=stat.rdev
        HEAP32[(((buf)+(___stat_struct_layout.st_size))>>2)]=stat.size
        HEAP32[(((buf)+(___stat_struct_layout.st_atime))>>2)]=Math.floor(stat.atime.getTime() / 1000)
        HEAP32[(((buf)+(___stat_struct_layout.st_mtime))>>2)]=Math.floor(stat.mtime.getTime() / 1000)
        HEAP32[(((buf)+(___stat_struct_layout.st_ctime))>>2)]=Math.floor(stat.ctime.getTime() / 1000)
        HEAP32[(((buf)+(___stat_struct_layout.st_blksize))>>2)]=4096
        HEAP32[(((buf)+(___stat_struct_layout.st_blocks))>>2)]=stat.blocks
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fstat(fildes, buf) {
      // int fstat(int fildes, struct stat *buf);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/fstat.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      return _stat(stream.path, buf);
    }
  function _isatty(fildes) {
      // int isatty(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/isatty.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      // HACK - implement tcgetattr
      if (!stream.tty) {
        ___setErrNo(ERRNO_CODES.ENOTTY);
        return 0;
      }
      return 1;
    }
  function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStream(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }
  function _access(path, amode) {
      // int access(const char *path, int amode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/access.html
      path = Pointer_stringify(path);
      if (amode & ~0000007) {
        // need a valid mode
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      var node;
      try {
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
      var perms = '';
      if (amode & 4) perms += 'r';
      if (amode & 2) perms += 'w';
      if (amode & 1) perms += 'x';
      if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      }
      return 0;
    }
  function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      for (var i = 0; i < result.length; i++) {
        HEAP8[(((s)+(i))|0)]=result.charCodeAt(i);
      }
      HEAP8[(((s)+(i))|0)]=0;
      return s;
    }function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }
  function _rewind(stream) {
      // void rewind(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rewind.html
      _fseek(stream, 0, 0);  // SEEK_SET.
      var streamObj = FS.getStream(stream);
      if (streamObj) streamObj.error = false;
    }
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __isFloat(text) {
      return !!(/^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.exec(text));
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
        __scanString.whiteSpace[' '] = 1;
        __scanString.whiteSpace['\t'] = 1;
        __scanString.whiteSpace['\n'] = 1;
        __scanString.whiteSpace['\v'] = 1;
        __scanString.whiteSpace['\f'] = 1;
        __scanString.whiteSpace['\r'] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC)
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            var last = 0;
            next = get();
            while (next > 0) {
              buffer.push(String.fromCharCode(next));
              if (__isFloat(buffer.join(''))) {
                last = buffer.length;
              }
              next = get();
            }
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex] in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      var get = function() { return HEAP8[(((s)+(index++))|0)]; };
      var unget = function() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function __Z7catopenPKci() { throw 'catopen not implemented' }
  function __Z7catgetsP8_nl_catdiiPKc() { throw 'catgets not implemented' }
  function __Z8catcloseP8_nl_catd() { throw 'catclose not implemented' }
  function _newlocale(mask, locale, base) {
      return 0;
    }
  function _freelocale(locale) {}
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  var _strftime_l=_strftime;
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  function ___locale_mb_cur_max() { throw '__locale_mb_cur_max not implemented' }
  function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
___strtok_state = Runtime.staticAlloc(4);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    return Module["dynCall_iiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vif(index,a1,a2) {
  try {
    Module["dynCall_vif"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vf(index,a1) {
  try {
    Module["dynCall_vf"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  try {
    return Module["dynCall_iiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viifii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viifii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiif(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiif"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_fii(index,a1,a2) {
  try {
    return Module["dynCall_fii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiifi(index,a1,a2,a3,a4,a5,a6) {
  try {
    return Module["dynCall_iiiiifi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_fi(index,a1) {
  try {
    return Module["dynCall_fi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiif(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiif"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var p=env.___fsmu8|0;var q=env._stdin|0;var r=env._stdout|0;var s=env.___dso_handle|0;var t=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var u=env._stderr|0;var v=+env.NaN;var w=+env.Infinity;var x=0;var y=0;var z=0;var A=0;var B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0.0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=global.Math.floor;var V=global.Math.abs;var W=global.Math.sqrt;var X=global.Math.pow;var Y=global.Math.cos;var Z=global.Math.sin;var _=global.Math.tan;var $=global.Math.acos;var aa=global.Math.asin;var ab=global.Math.atan;var ac=global.Math.atan2;var ad=global.Math.exp;var ae=global.Math.log;var af=global.Math.ceil;var ag=global.Math.imul;var ah=env.abort;var ai=env.assert;var aj=env.asmPrintInt;var ak=env.asmPrintFloat;var al=env.min;var am=env.invoke_iiiiiiii;var an=env.invoke_vif;var ao=env.invoke_vf;var ap=env.invoke_viiiii;var aq=env.invoke_vi;var ar=env.invoke_vii;var as=env.invoke_iiiiiiiiiii;var at=env.invoke_ii;var au=env.invoke_viifii;var av=env.invoke_viiiiiiiii;var aw=env.invoke_iiiiii;var ax=env.invoke_iiii;var ay=env.invoke_viiiiif;var az=env.invoke_viiiiiiii;var aA=env.invoke_fii;var aB=env.invoke_iiiiifi;var aC=env.invoke_viiiiiii;var aD=env.invoke_fi;var aE=env.invoke_viiiiiif;var aF=env.invoke_iii;var aG=env.invoke_viiiiii;var aH=env.invoke_i;var aI=env.invoke_iiiii;var aJ=env.invoke_viii;var aK=env.invoke_v;var aL=env.invoke_iiiiiiiii;var aM=env.invoke_viiii;var aN=env._llvm_lifetime_end;var aO=env._lseek;var aP=env._nls_kinsol_allocate;var aQ=env.__scanString;var aR=env._fclose;var aS=env._pthread_mutex_lock;var aT=env.___cxa_end_catch;var aU=env.__isFloat;var aV=env._strtoull;var aW=env._fflush;var aX=env._lis_solver_create;var aY=env._strtol;var aZ=env._fputc;var a_=env._strtok;var a$=env._fwrite;var a0=env._strncmp;var a1=env._send;var a2=env._fputs;var a3=env._tmpnam;var a4=env._isspace;var a5=env._localtime;var a6=env._read;var a7=env._ceil;var a8=env._fileno;var a9=env._perror;var ba=env._fsync;var bb=env.___cxa_guard_abort;var bc=env._newlocale;var bd=env._signal;var be=env.___gxx_personality_v0;var bf=env._pthread_cond_wait;var bg=env.___cxa_rethrow;var bh=env._freopen;var bi=env.___resumeException;var bj=env._strcmp;var bk=env._llvm_va_end;var bl=env._clock_gettime;var bm=env._tmpfile;var bn=env._vsscanf;var bo=env._snprintf;var bp=env._fgetc;var bq=env._pclose;var br=env._atexit;var bs=env.___cxa_free_exception;var bt=env._close;var bu=env.__Z8catcloseP8_nl_catd;var bv=env._vasprintf;var bw=env.___setErrNo;var bx=env._isxdigit;var by=env._access;var bz=env._ftell;var bA=env._exit;var bB=env._sprintf;var bC=env._asprintf;var bD=env.___ctype_b_loc;var bE=env._strrchr;var bF=env._freelocale;var bG=env.__Z7catopenPKci;var bH=env.__isLeapYear;var bI=env._fmax;var bJ=env.___cxa_is_number_type;var bK=env._GC_malloc;var bL=env.___cxa_does_inherit;var bM=env.___cxa_guard_acquire;var bN=env.___locale_mb_cur_max;var bO=env._lis_vector_destroy;var bP=env._localtime_r;var bQ=env.___cxa_begin_catch;var bR=env._lis_vector_create;var bS=env._recv;var bT=env.__parseInt64;var bU=env.__ZSt18uncaught_exceptionv;var bV=env._cos;var bW=env._lis_matrix_set_value;var bX=env._putchar;var bY=env.___cxa_call_unexpected;var bZ=env._popen;var b_=env._bsearch;var b$=env.__exit;var b0=env._strftime;var b1=env._rand;var b2=env._tzset;var b3=env.___cxa_throw;var b4=env._llvm_eh_exception;var b5=env._printf;var b6=env._pread;var b7=env._fopen;var b8=env._open;var b9=env.__arraySum;var ca=env._sysconf;var cb=env._puts;var cc=env._qsort;var cd=env._system;var ce=env.___cxa_find_matching_catch;var cf=env._strdup;var cg=env._srand;var ch=env._isatty;var ci=env.__formatString;var cj=env._pthread_cond_broadcast;var ck=env.__ZSt9terminatev;var cl=env._atoi;var cm=env._vfprintf;var cn=env._pthread_mutex_unlock;var co=env._llvm_pow_f64;var cp=env._sbrk;var cq=env._lis_solver_destroy;var cr=env.___errno_location;var cs=env._strerror;var ct=env._fstat;var cu=env._llvm_lifetime_start;var cv=env.__parseInt;var cw=env.___cxa_guard_release;var cx=env._ungetc;var cy=env._ftruncate;var cz=env._uselocale;var cA=env._vsnprintf;var cB=env._sscanf;var cC=env._kinsol_initialization;var cD=env._fread;var cE=env._strtok_r;var cF=env._abort;var cG=env._fprintf;var cH=env._isdigit;var cI=env._strtoll;var cJ=env.__addDays;var cK=env._fabs;var cL=env.__reallyNegative;var cM=env.__Z7catgetsP8_nl_catdiiPKc;var cN=env._fseek;var cO=env._sqrt;var cP=env._write;var cQ=env._rewind;var cR=env.___cxa_allocate_exception;var cS=env._sin;var cT=env._stat;var cU=env.___cxa_pure_virtual;var cV=env._longjmp;var cW=env._truncate;var cX=env.___ctype_toupper_loc;var cY=env.___ctype_tolower_loc;var cZ=env._lis_vector_set_size;var c_=env._unlink;var c$=env.___assert_func;var c0=env._pwrite;var c1=env._strerror_r;var c2=env._nls_kinsol_free;var c3=env._lis_solver_set_option;var c4=env._time;
// EMSCRIPTEN_START_FUNCS
function wT(a){a=a|0;b$(a|0)}function wU(a){a=a|0;return aW(a|0)|0}function wV(a){a=a|0;return cs(a|0)|0}function wW(a){a=a|0;return aR(a|0)|0}function wX(a,b,c){a=a|0;b=b|0;c=c|0;return bB(a|0,b|0,c|0)|0}function wY(a,b){a=a|0;b=b|0;return b7(a|0,b|0)|0}function wZ(a,b){a=a|0;b=b|0;return aZ(a|0,b|0)|0}function w_(a,b){a=a|0;b=b|0;return+bd(a|0,b|0)}function w$(){return cr()|0}function w0(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return a$(a|0,b|0,c|0,d|0)|0}function w1(){ck()}function w2(){cU()}function w3(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;return c5[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0)|0}function w4(a,b,c){a=a|0;b=b|0;c=+c;c6[a&3](b|0,+c)}function w5(a,b){a=a|0;b=+b;c7[a&3](+b)}function w6(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;c8[a&31](b|0,c|0,d|0,e|0,f|0)}function w7(a,b){a=a|0;b=b|0;c9[a&511](b|0)}function w8(a,b,c){a=a|0;b=b|0;c=c|0;da[a&127](b|0,c|0)}function w9(a,b,c,d,e,f,g,h,i,j,k){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;return db[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0,k|0)|0}function xa(a,b){a=a|0;b=b|0;return dc[a&255](b|0)|0}function xb(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=+d;e=e|0;f=f|0;dd[a&7](b|0,c|0,+d,e|0,f|0)}function xc(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;de[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function xd(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return df[a&127](b|0,c|0,d|0,e|0,f|0)|0}function xe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return dg[a&127](b|0,c|0,d|0)|0}function xf(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;dh[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function xg(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;di[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function xh(a,b,c){a=a|0;b=b|0;c=c|0;return+dj[a&3](b|0,c|0)}function xi(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;return dk[a&3](b|0,c|0,d|0,e|0,+f,g|0)|0}function xj(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;dl[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function xk(a,b){a=a|0;b=b|0;return+dm[a&3](b|0)}function xl(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;dn[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function xm(a,b,c){a=a|0;b=b|0;c=c|0;return dp[a&127](b|0,c|0)|0}function xn(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;dq[a&63](b|0,c|0,d|0,e|0,f|0,g|0)}function xo(a){a=a|0;return dr[a&15]()|0}function xp(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return ds[a&127](b|0,c|0,d|0,e|0)|0}function xq(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;dt[a&31](b|0,c|0,d|0)}function xr(a){a=a|0;du[a&7]()}function xs(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return dv[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function xt(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;dw[a&31](b|0,c|0,d|0,e|0)}function xu(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ah(0);return 0}function xv(a,b){a=a|0;b=+b;ah(1)}function xw(a){a=+a;ah(2)}function xx(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(3)}function xy(a){a=a|0;ah(4)}function xz(a,b){a=a|0;b=b|0;ah(5)}function xA(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;ah(6);return 0}function xB(a){a=a|0;ah(7);return 0}function xC(a,b,c,d,e){a=a|0;b=b|0;c=+c;d=d|0;e=e|0;ah(8)}function xD(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ah(9)}function xE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(10);return 0}function xF(a,b,c){a=a|0;b=b|0;c=c|0;ah(11);return 0}function xG(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ah(12)}function xH(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(13)}function xI(a,b){a=a|0;b=b|0;ah(14);return 0.0}function xJ(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;f=f|0;ah(15);return 0}function xK(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ah(16)}function xL(a){a=a|0;ah(17);return 0.0}function xM(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ah(18)}function xN(a,b){a=a|0;b=b|0;ah(19);return 0}function xO(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ah(20)}function xP(){ah(21);return 0}function xQ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(22);return 0}function xR(a,b,c){a=a|0;b=b|0;c=c|0;ah(23)}function xS(){ah(24)}function xT(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(25);return 0}function xU(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(26)}
// EMSCRIPTEN_END_FUNCS
var c5=[xu,xu,kt,xu,kv,xu,kz,xu];var c6=[xv,xv,m1,xv];var c7=[xw,xw,k7,xw];var c8=[xx,xx,hi,xx,gO,xx,v9,xx,h8,xx,wc,xx,gk,xx,hQ,xx,gS,xx,h9,xx,gj,xx,ie,xx,hR,xx,wb,xx,hl,xx,xx,xx];var c9=[xy,xy,tS,xy,qX,xy,tM,xy,oU,xy,kO,xy,rU,xy,oZ,xy,pz,xy,t9,xy,oB,xy,op,xy,uj,xy,rF,xy,k6,xy,oT,xy,oY,xy,rm,xy,o_,xy,kW,xy,qK,xy,qG,xy,l4,xy,wn,xy,nm,xy,oU,xy,ul,xy,uo,xy,jf,xy,sl,xy,rn,xy,vZ,xy,vf,xy,qA,xy,m2,xy,tN,xy,um,xy,no,xy,qf,xy,qY,xy,s7,xy,jK,xy,ug,xy,lD,xy,uq,xy,vT,xy,lZ,xy,vd,xy,jF,xy,oY,xy,qV,xy,sY,xy,vg,xy,un,xy,wh,xy,tG,xy,vc,xy,ms,xy,qk,xy,oo,xy,qU,xy,sA,xy,oU,xy,vB,xy,rG,xy,k0,xy,ve,xy,oI,xy,nn,xy,mt,xy,l3,xy,s8,xy,qe,xy,qw,xy,sy,xy,sk,xy,qH,xy,s1,xy,kU,xy,wr,xy,mr,xy,py,xy,kR,xy,wT,xy,kT,xy,vD,xy,d3,xy,vE,xy,qE,xy,uf,xy,qB,xy,p7,xy,v3,xy,ur,xy,uH,xy,vR,xy,qg,xy,qF,xy,tj,xy,oi,xy,ju,xy,td,xy,qC,xy,k$,xy,vH,xy,vU,xy,uY,xy,ov,xy,lX,xy,sz,xy,tr,xy,v0,xy,vb,xy,sN,xy,tH,xy,vF,xy,sX,xy,rT,xy,qJ,xy,l2,xy,mu,xy,qL,xy,qm,xy,o4,xy,ty,xy,tq,xy,r7,xy,pq,xy,o$,xy,nf,xy,vR,xy,v4,xy,qp,xy,n8,xy,o5,xy,qd,xy,na,xy,ow,xy,d2,xy,kV,xy,qz,xy,lY,xy,np,xy,pI,xy,qo,xy,oC,xy,us,xy,qI,xy,te,xy,r6,xy,s2,xy,oj,xy,tX,xy,ql,xy,p6,xy,qn,xy,vC,xy,v2,xy,tT,xy,jL,xy,oh,xy,v1,xy,tl,xy,dQ,xy,tz,xy,tk,xy,pd,xy,up,xy,oX,xy,qj,xy,vI,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy,xy];var da=[xz,xz,mg,xz,vl,xz,mm,xz,kB,xz,th,xz,mC,xz,oq,xz,vi,xz,sT,xz,mi,xz,l7,xz,vh,xz,sR,xz,ok,xz,tR,xz,pQ,xz,s0,xz,md,xz,sU,xz,tc,xz,s$,xz,me,xz,sZ,xz,ti,xz,ui,xz,ox,xz,sV,xz,vk,xz,l_,xz,s4,xz,oW,xz,tf,xz,s3,xz,mA,xz,vm,xz,sS,xz,s6,xz,mz,xz,vj,xz,sQ,xz,pv,xz,pJ,xz,tV,xz,ja,xz,oD,xz,s9,xz,mf,xz,sP,xz,sO,xz,s_,xz,nA,xz,my,xz,mn,xz,ta,xz,tb,xz,s5,xz,kX,xz,tg,xz,xz,xz,xz,xz,xz,xz,xz,xz,xz,xz];var db=[xA,xA,kD,xA,gq,xA,gy,xA,ku,xA,kw,xA,kC,xA,ky,xA];var dc=[xB,xB,vA,xB,pN,xB,vq,xB,p4,xB,vy,xB,sE,xB,uM,xB,dT,xB,uS,xB,r5,xB,vo,xB,oF,xB,le,xB,ww,xB,qb,xB,wf,xB,pU,xB,lh,xB,dV,xB,vu,xB,vs,xB,u$,xB,vS,xB,nh,xB,oL,xB,u8,xB,u5,xB,vt,xB,l9,xB,u6,xB,pL,xB,sM,xB,vv,xB,ol,xB,jy,xB,sF,xB,uG,xB,wU,xB,vz,xB,u1,xB,wV,xB,sK,xB,vn,xB,or,xB,lq,xB,u0,xB,uO,xB,qq,xB,qt,xB,sD,xB,dR,xB,os,xB,wW,xB,u7,xB,pM,xB,pS,xB,oy,xB,ma,xB,sG,xB,oE,xB,t4,xB,t3,xB,wo,xB,pT,xB,sB,xB,dO,xB,vp,xB,t2,xB,sC,xB,oK,xB,sH,xB,uR,xB,sJ,xB,sI,xB,vr,xB,sL,xB,sj,xB,vx,xB,nV,xB,uQ,xB,vw,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB,xB];var dd=[xC,xC,k5,xC,lc,xC,xC,xC];var de=[xD,xD,st,xD,sf,xD,xD,xD];var df=[xE,xE,im,xE,ix,xE,iu,xE,iy,xE,iz,xE,iA,xE,uP,xE,uN,xE,iL,xE,iP,xE,i3,xE,va,xE,ir,xE,ub,xE,ip,xE,i0,xE,i1,xE,uX,xE,io,xE,i_,xE,iZ,xE,iT,xE,iV,xE,iS,xE,iX,xE,iY,xE,t1,xE,i$,xE,ud,xE,qS,xE,iB,xE,iG,xE,iH,xE,iI,xE,iD,xE,iE,xE,it,xE,iC,xE,iF,xE,iW,xE,t8,xE,iw,xE,i2,xE,iR,xE,iM,xE,iO,xE,iQ,xE,iJ,xE,is,xE,iN,xE,iK,xE,uL,xE,qu,xE,i7,xE,u_,xE,iq,xE,ik,xE,iU,xE,i8,xE,iv,xE,i4,xE,i5,xE,xE,xE];var dg=[xF,xF,gl,xF,qv,xF,uB,xF,wX,xF,lE,xF,v5,xF,gu,xF,uD,xF,t6,xF,gI,xF,hc,xF,qT,xF,gN,xF,o0,xF,hD,xF,p5,xF,p3,xF,gv,xF,m5,xF,wx,xF,uu,xF,pR,xF,tU,xF,t7,xF,gz,xF,nO,xF,l$,xF,uz,xF,qa,xF,oO,xF,uF,xF,hh,xF,tO,xF,m_,xF,pK,xF,hL,xF,qc,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF,xF];var dh=[xG,xG,r3,xG,r1,xG,rR,xG,rP,xG,xG,xG,xG,xG,xG,xG];var di=[xH,xH,sW,xH,sx,xH,tn,xH,tv,xH,tt,xH,tA,xH,xH,xH];var dj=[xI,xI,w_,xI];var dk=[xJ,xJ,lI,xJ];var dl=[xK,xK,sd,xK,sm,xK,sp,xK,tP,xK,r0,xK,r_,xK,tI,xK,r8,xK,sc,xK,sq,xK,rO,xK,rH,xK,sb,xK,rx,xK,ra,xK,sn,xK,rJ,xK,rz,xK,rv,xK,rw,xK,ro,xK,ry,xK,rt,xK,rq,xK,rE,xK,rD,xK,rA,xK,sr,xK,q8,xK,r9,xK,rc,xK,q3,xK,q6,xK,q$,xK,rk,xK,ri,xK,rf,xK,qZ,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK,xK];var dm=[xL,xL,jC,xL];var dn=[xM,xM,tJ,xM,tD,xM,xM,xM];var dp=[xN,xN,hW,xN,uC,xN,oG,xN,li,xN,hU,xN,hV,xN,ll,xN,qP,xN,gg,xN,ji,xN,t5,xN,wY,xN,t_,xN,hJ,xN,pP,xN,ot,xN,oz,xN,uy,xN,hd,xN,la,xN,gh,xN,nk,xN,hY,xN,wi,xN,hX,xN,hN,xN,l8,xN,mY,xN,wZ,xN,uE,xN,hM,xN,he,xN,gi,xN,pW,xN,e_,xN,uA,xN,hg,xN,hI,xN,lu,xN,ni,xN,ut,xN,gM,xN,mb,xN,pO,xN,om,xN,gJ,xN,hT,xN,hS,xN,gK,xN,pV,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN,xN];var dq=[xO,xO,wd,xO,r$,xO,rV,xO,we,xO,r4,xO,l6,xO,tQ,xO,p$,xO,rX,xO,rW,xO,rK,xO,rN,xO,rI,xO,ng,xO,wa,xO,pZ,xO,tW,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO,xO];var dr=[xP,xP,nY,xP,w$,xP,i6,xP,nZ,xP,nW,xP,xP,xP,xP,xP];var ds=[xQ,xQ,fF,xQ,gQ,xQ,g6,xQ,hk,xQ,hK,xQ,gF,xQ,hF,xQ,hE,xQ,gC,xQ,gL,xQ,kJ,xQ,g7,xQ,uv,xQ,hC,xQ,hA,xQ,gw,xQ,gA,xQ,w0,xQ,gn,xQ,g8,xQ,f0,xQ,gB,xQ,go,xQ,uw,xQ,ha,xQ,gE,xQ,hH,xQ,uc,xQ,hP,xQ,gD,xQ,fX,xQ,f_,xQ,g9,xQ,fi,xQ,gG,xQ,gd,xQ,fA,xQ,hB,xQ,hG,xQ,gb,xQ,f1,xQ,hb,xQ,ua,xQ,hf,xQ,gH,xQ,fO,xQ,gx,xQ,ux,xQ,g5,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ,xQ];var dt=[xR,xR,lU,xR,lR,xR,mE,xR,m4,xR,m3,xR,oN,xR,jR,xR,qD,xR,nw,xR,xR,xR,xR,xR,xR,xR,xR,xR,xR,xR,xR,xR];var du=[xS,xS,w1,xS,w2,xS,xS,xS];var dv=[xT,xT,t$,xT,uK,xT,uW,xT,t0,xT,uZ,xT,u9,xT,uJ,xT,uI,xT,xT,xT,xT,xT,xT,xT,xT,xT,xT,xT,xT,xT,xT,xT];var dw=[xU,xU,jb,xU,nj,xU,v6,xU,kK,xU,gp,xU,p_,xU,gP,xU,v_,xU,hO,xU,p0,xU,l0,xU,qW,xU,v7,xU,qM,xU,hj,xU];return{_testSetjmp:wA,_strlen:ww,_free:wh,_main:e5,_realloc:wi,_strncpy:wx,_memmove:wB,__GLOBAL__I_a:oQ,_memset:wC,_memcmp:wD,_malloc:wf,_saveSetjmp:wz,_memcpy:wy,_strcpy:wE,_calloc:wg,runPostSets:dN,stackAlloc:dx,stackSave:dy,stackRestore:dz,setThrew:dA,setTempRet0:dD,setTempRet1:dE,setTempRet2:dF,setTempRet3:dG,setTempRet4:dH,setTempRet5:dI,setTempRet6:dJ,setTempRet7:dK,setTempRet8:dL,setTempRet9:dM,dynCall_iiiiiiii:w3,dynCall_vif:w4,dynCall_vf:w5,dynCall_viiiii:w6,dynCall_vi:w7,dynCall_vii:w8,dynCall_iiiiiiiiiii:w9,dynCall_ii:xa,dynCall_viifii:xb,dynCall_viiiiiiiii:xc,dynCall_iiiiii:xd,dynCall_iiii:xe,dynCall_viiiiif:xf,dynCall_viiiiiiii:xg,dynCall_fii:xh,dynCall_iiiiifi:xi,dynCall_viiiiiii:xj,dynCall_fi:xk,dynCall_viiiiiif:xl,dynCall_iii:xm,dynCall_viiiiii:xn,dynCall_i:xo,dynCall_iiiii:xp,dynCall_viii:xq,dynCall_v:xr,dynCall_iiiiiiiii:xs,dynCall_viiii:xt}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiiiiiii": invoke_iiiiiiii, "invoke_vif": invoke_vif, "invoke_vf": invoke_vf, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii, "invoke_ii": invoke_ii, "invoke_viifii": invoke_viifii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_iiiiii": invoke_iiiiii, "invoke_iiii": invoke_iiii, "invoke_viiiiif": invoke_viiiiif, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_fii": invoke_fii, "invoke_iiiiifi": invoke_iiiiifi, "invoke_viiiiiii": invoke_viiiiiii, "invoke_fi": invoke_fi, "invoke_viiiiiif": invoke_viiiiiif, "invoke_iii": invoke_iii, "invoke_viiiiii": invoke_viiiiii, "invoke_i": invoke_i, "invoke_iiiii": invoke_iiiii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiii": invoke_viiii, "_llvm_lifetime_end": _llvm_lifetime_end, "_lseek": _lseek, "_nls_kinsol_allocate": _nls_kinsol_allocate, "__scanString": __scanString, "_fclose": _fclose, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "__isFloat": __isFloat, "_strtoull": _strtoull, "_fflush": _fflush, "_lis_solver_create": _lis_solver_create, "_strtol": _strtol, "_fputc": _fputc, "_strtok": _strtok, "_fwrite": _fwrite, "_strncmp": _strncmp, "_send": _send, "_fputs": _fputs, "_tmpnam": _tmpnam, "_isspace": _isspace, "_localtime": _localtime, "_read": _read, "_ceil": _ceil, "_fileno": _fileno, "_perror": _perror, "_fsync": _fsync, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "_signal": _signal, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "_freopen": _freopen, "___resumeException": ___resumeException, "_strcmp": _strcmp, "_llvm_va_end": _llvm_va_end, "_clock_gettime": _clock_gettime, "_tmpfile": _tmpfile, "_vsscanf": _vsscanf, "_snprintf": _snprintf, "_fgetc": _fgetc, "_pclose": _pclose, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "_close": _close, "__Z8catcloseP8_nl_catd": __Z8catcloseP8_nl_catd, "_vasprintf": _vasprintf, "___setErrNo": ___setErrNo, "_isxdigit": _isxdigit, "_access": _access, "_ftell": _ftell, "_exit": _exit, "_sprintf": _sprintf, "_asprintf": _asprintf, "___ctype_b_loc": ___ctype_b_loc, "_strrchr": _strrchr, "_freelocale": _freelocale, "__Z7catopenPKci": __Z7catopenPKci, "__isLeapYear": __isLeapYear, "_fmax": _fmax, "___cxa_is_number_type": ___cxa_is_number_type, "_GC_malloc": _GC_malloc, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "___locale_mb_cur_max": ___locale_mb_cur_max, "_lis_vector_destroy": _lis_vector_destroy, "_localtime_r": _localtime_r, "___cxa_begin_catch": ___cxa_begin_catch, "_lis_vector_create": _lis_vector_create, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_cos": _cos, "_lis_matrix_set_value": _lis_matrix_set_value, "_putchar": _putchar, "___cxa_call_unexpected": ___cxa_call_unexpected, "_popen": _popen, "_bsearch": _bsearch, "__exit": __exit, "_strftime": _strftime, "_rand": _rand, "_tzset": _tzset, "___cxa_throw": ___cxa_throw, "_llvm_eh_exception": _llvm_eh_exception, "_printf": _printf, "_pread": _pread, "_fopen": _fopen, "_open": _open, "__arraySum": __arraySum, "_sysconf": _sysconf, "_puts": _puts, "_qsort": _qsort, "_system": _system, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "_strdup": _strdup, "_srand": _srand, "_isatty": _isatty, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_atoi": _atoi, "_vfprintf": _vfprintf, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "_lis_solver_destroy": _lis_solver_destroy, "___errno_location": ___errno_location, "_strerror": _strerror, "_fstat": _fstat, "_llvm_lifetime_start": _llvm_lifetime_start, "__parseInt": __parseInt, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_ftruncate": _ftruncate, "_uselocale": _uselocale, "_vsnprintf": _vsnprintf, "_sscanf": _sscanf, "_kinsol_initialization": _kinsol_initialization, "_fread": _fread, "_strtok_r": _strtok_r, "_abort": _abort, "_fprintf": _fprintf, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "_fabs": _fabs, "__reallyNegative": __reallyNegative, "__Z7catgetsP8_nl_catdiiPKc": __Z7catgetsP8_nl_catdiiPKc, "_fseek": _fseek, "_sqrt": _sqrt, "_write": _write, "_rewind": _rewind, "___cxa_allocate_exception": ___cxa_allocate_exception, "_sin": _sin, "_stat": _stat, "___cxa_pure_virtual": ___cxa_pure_virtual, "_longjmp": _longjmp, "_truncate": _truncate, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_lis_vector_set_size": _lis_vector_set_size, "_unlink": _unlink, "___assert_func": ___assert_func, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_nls_kinsol_free": _nls_kinsol_free, "_lis_solver_set_option": _lis_solver_set_option, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "___fsmu8": ___fsmu8, "_stdin": _stdin, "_stdout": _stdout, "___dso_handle": ___dso_handle, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr }, buffer);
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = asm["dynCall_iiiiiiii"];
var dynCall_vif = Module["dynCall_vif"] = asm["dynCall_vif"];
var dynCall_vf = Module["dynCall_vf"] = asm["dynCall_vf"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = asm["dynCall_iiiiiiiiiii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viifii = Module["dynCall_viifii"] = asm["dynCall_viifii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiif = Module["dynCall_viiiiif"] = asm["dynCall_viiiiif"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_fii = Module["dynCall_fii"] = asm["dynCall_fii"];
var dynCall_iiiiifi = Module["dynCall_iiiiifi"] = asm["dynCall_iiiiifi"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_fi = Module["dynCall_fi"] = asm["dynCall_fi"];
var dynCall_viiiiiif = Module["dynCall_viiiiiif"] = asm["dynCall_viiiiiif"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
(function() {
function assert(check, msg) {
  if (!check) throw msg + new Error().stack;
}
// The following is apparently not needed
//Module['FS_createDataFile']('/', 'Modelica.Electrical.Analog.Examples.ChuaCircuit_info.xml', 
// The following is loaded by chua.md
//Module['FS_createDataFile']('/', 'Modelica.Electrical.Analog.Examples.ChuaCircuit_init.xml', 
})();
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
//run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}