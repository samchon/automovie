const assert = require("node:assert/strict");
const test = require("node:test");
const { geometry, sweep } = require("./hinged-attachment-sweep.cjs");

const authored = `The attachment has 깊이 0.025 m, from 자유단 X=12.31 m to X=13.45 m까지.
The vertical +X 경첩축은 X=13.475 m·Z=−0.32 m의 수직선이고 반지름 0.025 m 원통이다.
The attachment has Z=[−0.345,−0.32] m.`;
/** @type {{ box:{ x:[number,number];y:[number,number];z:[number,number] } }[]} */
const obstacle = [
  { box: { x: [13.50, 13.62], y: [0, 1.8], z: [-0.36, -0.24] } },
];

void test("authored hinge and attachment sweep clear the fixed post", () => {
  const member = geometry(authored);
  const result = sweep(member, obstacle);
  assert.equal(result.comparisons, 181);
  assert.deepEqual(result.failures, []);
});

void test("moving the attachment into the hinge clearance collides while open", () => {
  const member = geometry(authored.replace("X=13.45 m까지", "X=13.49 m까지"));
  assert.ok(sweep(member, obstacle).maximumArea > 0);
});

void test("moving the hinge cylinder into the fixed post fails", () => {
  const member = geometry(
    authored.replace("경첩축은 X=13.475", "경첩축은 X=13.49"),
  );
  assert.ok(sweep(member, obstacle).hingePenetration > 0);
});
