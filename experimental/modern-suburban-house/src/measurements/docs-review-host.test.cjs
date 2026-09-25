/** Small in-memory cases for the settings review host reader. The fixtures
 * distinguish authored body prose from adjacent evidence annotations so a
 * green structural graph cannot masquerade as a semantic review. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { sections, measurements, attributions, audit } = require(
  "./docs-review-host.cjs",
);

/** @param {string} reason @param {string} body @param {string} [evidence] */
const source = (reason, body, evidence = "") => `# settings\n\n## Room {#room}\n<!--\n${evidence}\n@evidenceReview principles/core/common.md#declared-basis #123abcd ${reason}\n-->\n${body}\n`;
/** @param {string} reason @param {string} body @param {string} [evidence] */
const inspect = (reason, body, evidence) => audit([
  { name: "test.md", source: source(reason, body, evidence) },
]);

void test("the H2 parser counts reviewed rows and omits evidence prose from the body", () => {
  const parsed = sections(
    source(
      "사용자 그래프를 따른다.",
      "방은 사용자 그래프를 따른다.",
      "@evidence principles/core/common.md#declared-basis 다른 사실",
    ),
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].reviews.length, 1);
  assert.ok(!parsed[0].body.includes("다른 사실"));
  assert.ok(parsed[0].evidence.includes("다른 사실"));
});

void test("the measurement grammar excludes one digit labels and accepts signed decimals", () => {
  assert.deepEqual(measurements("02 장면, 5 방, −0.35 m, 2.65 m"), [
    "02",
    "−0.35",
    "2.65",
  ]);
});

void test("a measurement declared only in evidence fails while a body value passes", () => {
  assert.equal(
    inspect("높이는 2.65 m다.", "높이는 2.65 m다.").findings.length,
    0,
  );
  const result = inspect(
    "높이는 2.65 m다.",
    "높이는 설계가 정한다.",
    "@evidence principles/core/common.md#declared-basis 높이는 2.65 m다.",
  );
  assert.equal(result.findings[0].kind, "measurement-in-evidence-only");
});

void test("an absent authority fails even when its claim is in the evidence annotation", () => {
  const result = inspect(
    "고정 그래프의 방이다.",
    "방이 이어진다.",
    "@evidence principles/core/common.md#declared-basis 고정 그래프의 방이다.",
  );
  assert.ok(
    result.findings.some(
      (finding) => finding.kind === "authority-in-evidence-only",
    ),
  );
  assert.equal(
    inspect("고정 그래프의 방이다.", "사용자 그래프의 방이 이어진다.").findings.length,
    0,
  );
});

void test("attribution subjects are checked in the authority's own body sentence", () => {
  const reason = "짧은 확인은 조정자 인계, 서버 유지는 사용자 지시다.";
  assert.equal(attributions(reason).length, 2);
  assert.equal(
    inspect(reason, "사용자와 조정자의 지시를 따른다. 확인은 저작자가 한다. 서버 유지는 조정자가 맡는다.").findings.filter((f) => f.kind === "attribution-outside-host-sentence").length,
    2,
  );
  assert.equal(
    inspect(reason, "조정자 인계에 따라 저작자가 확인한다. 사용자 지시에 따라 서버를 유지한다.").findings.length,
    0,
  );
});

void test("an unreviewed population is counted rather than accepted as green", () => {
  const report = audit([
    { name: "empty.md", source: "## Empty {#empty}\n본문이다.\n" },
  ]);
  assert.equal(report.h2, 1);
  assert.equal(report.reviewRows, 0);
  const unmeasured = audit([{ name: "other.md", source: source("방의 물건이 있다.", "방에 물건이 있다.").replace("#declared-basis", "#scope-preservation") }]);
  assert.equal(unmeasured.otherRows, 1);
  assert.equal(unmeasured.unmeasuredCandidates[0].target, "principles/core/common.md#scope-preservation");
});

void test("acronyms and exclusive lists remain explicit reading candidates", () => {
  const report = inspect("UV만 설계가 정한다.", "텍스처 좌표는 설계가 정한다.");
  assert.equal(report.findings.length, 0);
  assert.equal(report.exclusiveRows, 1);
  assert.equal(report.codeCandidates[0].value, "UV");
});
