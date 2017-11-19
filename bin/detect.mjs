// `this` is undefined in ES modules.  Use this trait to determine whether Node
// is running this file as an ES module or not (i.e. determine whether it
// supports ES modules at all).
process.exit(typeof this === 'undefined' ? 0 : 1);
