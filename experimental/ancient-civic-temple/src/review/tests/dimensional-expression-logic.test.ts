import assert from "node:assert/strict";
import test from "node:test";

import { dimensionalExpression } from "../dimensionalExpression.mjs";
import { explicitEquationRows } from "../explicitEquationRows.mjs";
import { explicitRangeRows } from "../explicitRangeRows.mjs";

/** Pure grammar scenarios use hand arithmetic and immutable prose inputs. They
 * cover syntax and tolerance decisions without acquiring authored files or
 * depending on the full census. Node's runner reports each scenario duration.
 */
void test("dimensional grammar preserves precedence, unary signs and Unicode operators", () => {
  for (const [source, expected] of [
    ["1+2×3", 7], ["(1+2)×3", 9], ["8÷2−1", 3],
    ["-2+5", 3], ["−−2", 2], ["√9", 3], ["2√9", 6],
    ["(2+3)√4", 10], ["2²²", 16], [" 0.5 * 4 ", 2],
  ] as const)
    assert.ok(Math.abs(dimensionalExpression(source) - expected) < 1e-12, source);
});

void test("dimensional grammar refuses adjacent malformed syntax and nonfinite arithmetic", () => {
  assert.throws(() => dimensionalExpression("1+unit"), /unsupported expression/);
  assert.throws(() => dimensionalExpression("(1+2"), /unclosed expression/);
  for (const source of ["", ")", "1+"])
    assert.throws(() => dimensionalExpression(source), /missing operand/);
  for (const source of ["1)", "1 2", "1/0", "√-1"])
    assert.throws(() => dimensionalExpression(source), /invalid expression/);
});

void test("explicit equations distinguish printed rounding from exact claims", () => {
  const exact = explicitEquationRows("exact", "1+2=3m 1+2=4m");
  assert.equal(exact.length, 2);
  assert.equal(exact[0].pass, true);
  assert.equal(exact[1].pass, false);
  const approximate = explicitEquationRows("round", "1+0.04≈1.0m 1+0.06≈1.0m 1+0.4≈1m");
  assert.equal(approximate.length, 3);
  assert.deepEqual(approximate.map((row) => row.pass), [true, false, true]);
  assert.ok(Math.abs(approximate[0].tolerance - 0.050001) < 1e-12);
  assert.ok(Math.abs(approximate[2].tolerance - 0.500001) < 1e-12);
  assert.deepEqual(explicitEquationRows("none", "no metre equation"), []);
  assert.deepEqual(explicitEquationRows("unsupported", "1/0=3m 1..0+2=3m"), []);
});

void test("explicit axis ranges admit reversed signs and reject zero or nonfinite spans", () => {
  const rows = explicitRangeRows("axis", "X=−2~+3m Y=3~-2m Z=0~0m");
  assert.deepEqual(rows.map((row) => [row.axis, row.pass]), [["X", true], ["Y", true], ["Z", false]]);
  assert.ok(Math.abs(rows[0].from + 2) < 1e-12);
  assert.ok(Math.abs(rows[1].to + 2) < 1e-12);
  assert.equal(explicitRangeRows("large-start", `X=${"9".repeat(400)}~1m`)[0].pass, false);
  assert.equal(explicitRangeRows("large-end", `X=1~${"9".repeat(400)}m`)[0].pass, false);
  assert.deepEqual(explicitRangeRows("none", "no axis interval"), []);
});
