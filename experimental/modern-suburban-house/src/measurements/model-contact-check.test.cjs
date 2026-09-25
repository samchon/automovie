/** In-memory contact grammar cases. Each comparison uses independent hand
 * arithmetic and a negative twin; no test rewrites production source. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { arithmetic, sections, floorContact, audit } = require(
  "./model-contact-check.cjs",
);

/** @param {string} body */
const file = (body) => [
  { name: "sample.md", source: `## Part {#part}\n${body}\n` },
];
/** @param {string} body */
const findings = (body) => audit(file(body)).failures;

void test("arithmetic evaluates signed and parenthesized numeric expressions", () => {
  assert.ok(
    Math.abs((arithmetic("−0.65+(2.75−1.46)×0.28/0.17") ?? NaN) - 1.4747058823529413) < 1e-12,
  );
  assert.equal(arithmetic("4/0"), null);
  assert.equal(arithmetic("X+1"), null);
  assert.equal(arithmetic("(1+2"), null);
});

void test("model sections exclude evidence comments from the measured body", () => {
  const parsed = sections("## Part {#part}\n<!-- X=[2,1] -->\nX=[1,2] m다.\n");
  assert.equal(parsed.length, 1);
  assert.ok(!parsed[0].body.includes("[2,1]"));
});

void test("floor contact accepts a bottom at zero and refuses a floating bottom", () => {
  assert.equal(floorContact("판은 Y=[0,0.10] m에서 바닥에 닿는다."), true);
  assert.equal(floorContact("판은 Y=[0.02,0.10] m에서 바닥에 닿는다."), false);
  assert.equal(floorContact("판은 바닥에 닿는다."), null);
});

void test("occupancy intervals are ordered while a declared path may run backwards", () => {
  assert.ok(
    findings("판은 X=[2,1] m의 닫힌 부피다.").some((line) =>
      line.includes("reversed occupancy"),
    ),
  );
  const directed = audit(file("레일 중심선의 경로는 z=[2,1] m로 이어진다."));
  assert.equal(directed.directedIntervals, 1);
  assert.ok(
    !directed.failures.some((line) => line.includes("reversed occupancy")),
  );
});

void test("angular motion must match both its equation and reservation", () => {
  const valid = findings(
    "경첩 창의 돌출은 0.63×sin(π/8)=0.2411 m이므로 0.25 m 예약 안에 남는다.",
  );
  assert.ok(!valid.some((line) => line.includes("angular")));
  const falseEquation = findings(
    "경첩 창의 돌출은 0.63×sin(π/6)=0.2411 m이므로 0.25 m 예약 안에 남는다.",
  );
  assert.ok(falseEquation.some((line) => line.includes("angular expression")));
  const overReservation = findings(
    "경첩 창의 돌출은 0.63×sin(π/6)=0.315 m이므로 0.25 m 예약 안에 남는다.",
  );
  assert.ok(
    overReservation.some((line) => line.includes("exceeds reservation")),
  );
});

void test("a cutoff must retain the slope and ceiling relationship", () => {
  const prefix = "아래 모서리는 Y=1.36+0.17×(X+0.65)/0.28 m, 위 모서리는 그 값+0.10 m다. 천장은 Y≥2.75 m다. ";
  const good = findings(
    prefix + "Xc=−0.65+(2.75−1.46)×0.28/0.17=1.474705882 m에서 절단한다.",
  );
  assert.ok(!good.some((line) => line.includes("clipped slope")));
  const bad = findings(
    prefix + "Xc=−0.65+(2.75−1.46)×0.28/0.17=1.87 m에서 절단한다.",
  );
  assert.ok(bad.some((line) => line.includes("clipped slope")));
  const missing = findings("Xc=1+2=3 m에서 절단한다.");
  assert.ok(missing.some((line) => line.includes("no measurable slope")));
});

void test("the lexical census reports what is still outside the measured grammar", () => {
  const report = audit(
    file("상판은 바닥에 붙는다. 별도 판은 Y=[0,0.10] m에서 바닥에 닿는다. 좌표 A=[왼쪽,오른쪽]이다."),
  );
  assert.equal(report.contactSentences, 2);
  assert.equal(report.checkedContactSentences, 1);
  assert.equal(report.uncheckedContactSentences, 1);
  assert.equal(report.unparsedBracketPairs, 1);
  assert.ok(
    report.failures.some((line) =>
      line.includes("outside the measured relation grammar"),
    ),
  );
  assert.ok(report.failures.some((line) => line.includes("outside the numeric interval grammar")));
  assert.equal(audit(file("[문 예약 X=[0,1]](door.md#door) 안의 숫자 구간이다.")).unparsedBracketPairs, 0);
});
