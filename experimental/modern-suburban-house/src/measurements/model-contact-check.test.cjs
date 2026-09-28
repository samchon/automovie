/** In-memory contact grammar cases. Each comparison uses independent hand
 * arithmetic and a negative twin; no test rewrites production source. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { arithmetic, sections, floorContact, relationshipFailures, audit } = require(
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

void test("a cutoff can meet a cited finish boundary without a local wall-height phrase", () => {
  const body = "아래 모서리는 Y=1.36+0.17×(X+0.65)/0.28 m, 위 모서리는 그 값+0.10 m다. " +
    "Xc=−0.65+(2.75−1.46)×0.28/0.17=1.474705882 m에서 천장에 닿는다.";
  const source = `## Part {#part}\n<!--\n@evidence spaces/rooms/entry.md#entry-plan 천장 접면을 소비한다.\n-->\n${body}\n`;
  const parent = () => "현관 천장 마감은 Y=[2.75,2.765] m다.";
  const good = audit([{ name:"sample.md", source }], parent);
  assert.equal(good.clippedSlopes, 1);
  assert.ok(!good.failures.some((line) => line.includes("clipped slope")));
  const displaced = source.replace("=1.474705882 m", "=1.60 m");
  const bad = audit([{ name:"sample.md", source:displaced }], parent);
  assert.ok(bad.failures.some((line) => line.includes("clipped slope")));
});

void test("the lexical census reports what is still outside the measured grammar", () => {
  const report = audit(
    file(
      "상판은 바닥에 붙는다. 별도 판은 Y=[0,0.10] m에서 바닥에 닿는다. 좌표 A=[왼쪽,오른쪽]이다.",
    ),
  );
  assert.equal(report.contactSentences, 2);
  assert.equal(report.checkedContactSentences, 1);
  assert.equal(report.uncheckedContactSentences, 1);
  assert.equal(report.unparsedBracketPairs, 1);
  assert.deepEqual(report.failures, []);
  assert.equal(
    audit(file("[문 예약 X=[0,1]](door.md#door) 안의 숫자 구간이다.")).unparsedBracketPairs,
    0,
  );
});

void test("body depth and front hardware must fit their shared envelope", () => {
  const good = "몸통 깊이는 0.72 m이고 문은 그 전면에서 0.03 m 안에 들어가 외곽 깊이 0.75 m를 채운다.";
  const bad = good.replace("0.72 m", "0.80 m");
  assert.deepEqual(relationshipFailures(good, "part"), []);
  assert.ok(
    relationshipFailures(bad, "part").some((line) =>
      line.includes("depth envelope"),
    ),
  );
});

void test("casing legs beside a threshold still reach the finished floor", () => {
  const good = "`casing-a`·`casing-b` 좌우 세로 판은 X=[−0.07,0]·[W,W+0.07] m, Y=[0,2.20] m이고 문턱판은 개구부 폭 안에서만 만든다.";
  const bad = good.replace("Y=[0,2.20]", "Y=[0.02,2.20]");
  assert.deepEqual(relationshipFailures(good, "door"), []);
  assert.ok(
    relationshipFailures(bad, "door").some((line) =>
      line.includes("finished floor"),
    ),
  );
});

void test("a recess limited to part of a depth cannot also claim the whole depth", () => {
  const good = "전체 깊이 Z=[0,0.75] m를 옆 홈으로 비운다.";
  const bad = "앞쪽 깊이 Z=[0.40,0.75] m만 옆 홈으로 비우고 뒤쪽은 남겨 전체 깊이 Z=[0,0.75] m를 옆 홈으로 비운다.";
  assert.deepEqual(relationshipFailures(good, "dryer"), []);
  assert.ok(
    relationshipFailures(bad, "dryer").some((line) =>
      line.includes("only-partial"),
    ),
  );
});

void test("an owned sloped plate carries its slope equation", () => {
  const good = "흰 경사 측판은 이 원형이 만든다. 아래 모서리는 Y=1.36+0.17×(X+0.65)/0.28 m다.";
  const bad = "흰 경사 측판은 이 원형이 만든다. 계단을 따른다.";
  assert.deepEqual(relationshipFailures(good, "skirt"), []);
  assert.ok(
    relationshipFailures(bad, "skirt").some((line) =>
      line.includes("slope equation"),
    ),
  );
});

void test("a claimed contact is checked against the measured floor and cylinder endpoints", () => {
  const floor = "판은 Y=[3.11,3.15] m로 닫는다. 이는 상층 바닥 Y=3.06 m에서 아랫면을 0.05 m 띄운 판이다.";
  const cylinder = "경첩축은 X=13.475 m이고 반지름 0.025 m 원통의 +X 끝 X=13.50 m가 기둥에 닿는다.";
  const opening = "창대는 Y=[y0,y0+0.03] m다. 창 아래벽 고체 Y<y0에 들어가지 않는다.";
  assert.deepEqual(relationshipFailures(floor + cylinder + opening, "join"), []);
  assert.ok(
    relationshipFailures(floor.replace("3.11", "3.00"), "join").some((line) =>
      line.includes("floor clearance"),
    ),
  );
  assert.ok(
    relationshipFailures(cylinder.replace("13.475", "13.51"), "join").some(
      (line) => line.includes("cylinder end"),
    ),
  );
  assert.ok(
    relationshipFailures(opening.replace("[y0,y0+0.03]", "[y0−0.03,y0]"), "join").some(
      (line) => line.includes("below its claimed opening"),
    ),
  );
});

void test("two side-wall end claims must match a cited body's span", () => {
  const { linkedSideWallFailures } = require("./model-contact-check.cjs");
  const raw = "<!--\n@evidence spaces/rooms/store.md#storage-bay owner를 받는다.\n-->";
  const parent = "수납 몸통 예약은 X=[1,2], Z=[−4.56,−3.51], Y=[0,2] m다.";
  const good = "봉은 Z=[−4.56,−3.51] m이고 선반은 두 측벽의 안쪽 면 Z=[−4.56,−3.51] m에 맞대며 끝난다.";
  const resolve = () => parent;
  assert.deepEqual(linkedSideWallFailures(raw, good, resolve, "bay"), {
    assertions: 2,
    failures: [],
  });
  const bad = good.replace("봉은 Z=[−4.56,−3.51]", "봉은 Z=[−4.51,−3.56]");
  assert.equal(
    linkedSideWallFailures(raw, bad, resolve, "bay").failures.length,
    1,
  );
});

void test("closed sibling volumes and stated guide and hinge limits are measured", () => {
  const inward = "닫힌 문짝의 날씨 면은 Z=−0.105, 실내 면은 Z=−0.145 m이고 경첩 축은 실내 면 Z=−0.145 m의 교선이다. 안쪽으로 90° 돌린다.";
  const trim = "좌우 세로 판 X=[0,0.1]·[1,1.1] m, Y=[0,2.2] m다. 세로 판은 테라스 완성면 Y=0에서 시작한다.";
  const guide = "좌우 수직 구간 중심 X=6.14·11.06 m와 단면 폭 0.030 m는 각각 부모 레일 띠 X=[6.00,6.16]·[11.04,11.20] m 안에 있고, 닫힌 문짝 X=[6.20,11.00] m와 양쪽 모두 최소 0.045 m 떨어진다.";
  const casing = "복도 쪽 `casing`의 왼쪽·오른쪽 세로 판은 X=[1.92,1.97]·[2.97,3.02] m, Z=[−3.425,−3.41] m, Y=[0,2.20] m다.\n닫힌 `leaf`의 앞 문짝 X=[1.97,2.495]·Z=[−3.40,−3.37] m와 뒤 문짝 X=[2.445,2.97]·Z=[−3.36,−3.33] m의 Y=[0.01,2.17] m 몸통이다.";
  assert.deepEqual(
    relationshipFailures([inward, trim, guide, casing].join("\n"), "members"),
    [],
  );
  assert.ok(
    relationshipFailures(inward.replace("실내 면 Z=−0.145 m의 교선", "날씨 면 Z=−0.105 m의 교선"), "members").some(
      (line) => line.includes("inward hinge"),
    ),
  );
  assert.ok(
    relationshipFailures(trim.replace("완성면 Y=0", "완성면 위 Y=0.05"), "members").some(
      (line) => line.includes("trim foot"),
    ),
  );
  assert.ok(
    relationshipFailures(guide.replace("중심 X=6.14·11.06", "중심 X=6.22·10.98"), "members").some(
      (line) => line.includes("guide sections"),
    ),
  );
  assert.ok(
    relationshipFailures(casing.replace("X=[1.92,1.97]·[2.97,3.02] m, Z=[−3.425,−3.41]", "X=[1.97,2.02]·[2.92,2.97] m, Z=[−3.41,−3.38]"), "members").some(
      (line) => line.includes("positive volume"),
    ),
  );
});

void test("numeric evidence requires literal support in its own host H2", () => {
  const { evidenceNumberFailures } = require("./model-contact-check.cjs");
  const rows = "@evidence principles/core/common.md#substantive-completion 세 판의 돌출 0.015 m를 정한다.\n";
  assert.deepEqual(
    evidenceNumberFailures(rows, "세 판은 0.015 m 돌출한다.", "trim").failures,
    [],
  );
  assert.equal(
    evidenceNumberFailures(rows, "세 판은 0.15 m 돌출한다.", "trim").failures.length,
    1,
  );
});
