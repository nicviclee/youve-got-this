require('./');
var assert = require('assert');
var buf;

console.log('Buffer.prototype.readUIntLE : ');
buf = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
assert.equal(buf.readUIntBE(0, 1), 0x01);
assert.equal(buf.readUIntBE(0, 3), 0x010203);
assert.equal(buf.readUIntBE(0, 5), 0x0102030405);
assert.equal(buf.readUIntBE(0, 6), 0x010203040506);
console.log('Passed');

console.log('Buffer.prototype.writeUIntBE : ');
buf = Buffer(3);
buf.writeUIntBE(0x123456, 0, 3);
assert.deepEqual(buf.toJSON(), [0x12, 0x34, 0x56]);
assert.equal(buf.readUIntBE(0, 3), 0x123456);
console.log('Passed');
