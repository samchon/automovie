import test from "node:test";
import assert from "node:assert/strict";
import { sections, measurements, attributions, audit, failureCount } from "./docs-review-host.cjs";

const source = (reason: string, body: string, evidence: string = "") => `# settings\n\n## Room {#room}\n<!--\n${evidence}\n@evidence principles/core/common.md#declared-basis ${reason}\n-->\n${body}\n`;
const inspect = (reason: string, body: string, evidence?: string) => audit([
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
  assert.equal(parsed[0].reviews.length, 2);
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
  const unmeasured = audit([
    {
      name: "other.md",
      source: source("방의 물건이 있다.", "방에 물건이 있다.").replace(
        "#declared-basis",
        "#scope-preservation",
      ),
    },
  ]);
  assert.equal(unmeasured.otherRows, 1);
  assert.equal(
    unmeasured.unmeasuredCandidates[0].target,
    "principles/core/common.md#scope-preservation",
  );
});

void test("acronyms and exclusive lists remain explicit reading candidates", () => {
  const report = inspect("UV만 설계가 정한다.", "텍스처 좌표는 설계가 정한다.");
  assert.equal(report.findings.length, 0);
  assert.equal(report.exclusiveRows, 1);
  assert.equal(report.codeCandidates[0].value, "UV");
});

void test("unread review candidates are reported without failing the census", () => {
  const report = audit([
    {
      name: "other.md",
      source: source("방의 물건이 있다.", "방에 물건이 있다.").replace(
        "#declared-basis",
        "#scope-preservation",
      ),
    },
  ]);
  assert.equal(report.reviewRows, 1);
  assert.equal(report.otherRows, 1);
  assert.equal(failureCount(report), 0);
  assert.equal(
    failureCount(
      audit([{ name: "empty.md", source: "## Empty {#empty}\n본문이다.\n" }]),
    ),
    1,
  );
});

void test("confirmed missing measurements fail the census", () => {
  const report = inspect("높이는 2.65 m다.", "높이는 설계가 정한다.");
  assert.equal(report.findings[0].kind, "measurement-outside-host");
  assert.equal(failureCount(report), 1);
});

void test("ordinary acknowledgements and exclusions retain their reasons without companion metadata", () => {
  const parsed = sections("# Settings\n## Owner {#owner}\n<!--\n@evidence settings/common.md#basis adopted basis\n@evidenceExclude settings/common.md#unused unused basis\n-->\nadopted basis\n");
  assert.equal(parsed[0].reviews.length, 2);
  assert.deepEqual(parsed[0].reviews.map((row) => row.target), [
    "settings/common.md#basis", "settings/common.md#unused",
  ]);
  assert.deepEqual(parsed[0].reviews.map((row) => row.reason), [
    "adopted basis", "unused basis",
  ]);
  assert.ok(!parsed[0].body.includes("unused basis"));
  assert.ok(parsed[0].evidence.includes("unused basis"));
});
