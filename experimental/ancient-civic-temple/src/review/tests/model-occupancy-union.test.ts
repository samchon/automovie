import assert from "node:assert/strict";
import test from "node:test";
import { occupancyUnionRows } from "../model-occupancy-union.mjs";

void test("whole width and outer diameter meet the occupancy box in both directions", () => {
  const width = "기본 폭 W=1.40m다. 점유 상자는 1.46×0.46×0.45m다.";
  assert.deepEqual(occupancyUnionRows("bench", width).map((row: { pass: boolean }) => row.pass), [false]);
  assert.deepEqual(occupancyUnionRows("bench", width.replace("1.46×", "1.40×")).map((row: { pass: boolean }) => row.pass), [true]);
  const diameter = "발은 반지름 0.30m다. 바깥 지름은 0.60m다. 점유 상자는 0.40×0.34×0.40m다.";
  assert.deepEqual(occupancyUnionRows("stand", diameter).map((row: { pass: boolean }) => row.pass), [false, false]);
  assert.deepEqual(occupancyUnionRows("stand", diameter.replaceAll("0.40×", "0.60×").replace("×0.40m", "×0.60m")).map((row: { pass: boolean }) => row.pass), [true, true]);
  assert.deepEqual(occupancyUnionRows("unbounded", "부재 대응: `p`=판."), []);
});

void test("part interval and circular centre witnesses reconstruct the complete Z union", () => {
  const body = [
    "바퀴 중심은 (X,Y,Z)=(±0.34,0.23,0.10)m, 반지름 0.23m인 X축 원통이다.",
    "축은 X=−0.34~0.34m, Y=0.23m, Z=0.10m의 반지름 0.018m 원통이다.",
    "판은 X=−0.30~0.30m, Y=0.43~0.49m, Z=−0.65~0.60m다.",
    "손잡이는 Z=−1.20~−0.65m다.",
    "지지재는 Z=0.08~0.12m다.",
    "점유 상자는 0.76×0.72×1.82m다.",
    "부재 대응: `wheel`=바퀴; `axle`=축; `deck`=판; `handle`=손잡이; `support`=지지재.",
  ].join("\n");
  const over = occupancyUnionRows("cart", body);
  assert.equal(over.find((row: { axis: string }) => row.axis === "Z part union")?.pass, false);
  assert.ok(Math.abs(over.find((row: { axis: string }) => row.axis === "Z part union")!.union - 1.80) < 1e-8);
  const exact = occupancyUnionRows("cart", body.replace("1.82m", "1.80m"));
  assert.equal(exact.find((row: { axis: string }) => row.axis === "Z part union")?.pass, true);
  assert.equal(occupancyUnionRows("cart", body.replace("지지재는 Z=0.08~0.12m다.", "지지재가 있다."))
    .some((row: { axis: string }) => row.axis === "Z part union"), false);
});
