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
      "Follows the user graph.",
      "The room follows the user graph.",
      "@evidence principles/core/common.md#declared-basis another fact",
    ),
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].reviews.length, 2);
  assert.ok(!parsed[0].body.includes("another fact"));
  assert.ok(parsed[0].evidence.includes("another fact"));
});

void test("the measurement grammar excludes one digit labels and accepts signed decimals", () => {
  assert.deepEqual(measurements("02 scene, 5 rooms, −0.35 m, 2.65 m"), [
    "02",
    "−0.35",
    "2.65",
  ]);
});

void test("a measurement declared only in evidence fails while a body value passes", () => {
  assert.equal(
    inspect("The height is 2.65 m.", "The height is 2.65 m.").findings.length,
    0,
  );
  const result = inspect(
    "The height is 2.65 m.",
    "The design sets the height.",
    "@evidence principles/core/common.md#declared-basis The height is 2.65 m.",
  );
  assert.equal(result.findings[0].kind, "measurement-in-evidence-only");
});

void test("an absent authority fails even when its claim is in the evidence annotation", () => {
  const result = inspect(
    "It is a room of the fixed graph.",
    "The room continues.",
    "@evidence principles/core/common.md#declared-basis It is a room of the fixed graph.",
  );
  assert.ok(
    result.findings.some(
      (finding) => finding.kind === "authority-in-evidence-only",
    ),
  );
  assert.equal(
    inspect("It is a room of the fixed graph.", "The room of the user graph continues.").findings.length,
    0,
  );
});

void test("attribution subjects are checked in the authority's own body sentence", () => {
  const reason = "Short checks are a coordinator handoff, and server upkeep is a user instruction.";
  assert.equal(attributions(reason).length, 2);
  assert.equal(
    inspect(reason, "Follows the instructions of the user and the coordinator. The author does the check. The coordinator takes on server upkeep.").findings.filter((f) => f.kind === "attribution-outside-host-sentence").length,
    2,
  );
  assert.equal(
    inspect(reason, "Per the coordinator handoff, the author checks. Per user instruction, the server is kept up.").findings.length,
    0,
  );
});

void test("an unreviewed population is counted rather than accepted as green", () => {
  const report = audit([
    { name: "empty.md", source: "## Empty {#empty}\nThis is a body.\n" },
  ]);
  assert.equal(report.h2, 1);
  assert.equal(report.reviewRows, 0);
  const unmeasured = audit([
    {
      name: "other.md",
      source: source("The room has objects.", "There are objects in the room.").replace(
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
  const report = inspect("Only UV is set by design.", "Texture coordinates are set by design.");
  assert.equal(report.findings.length, 0);
  assert.equal(report.exclusiveRows, 1);
  assert.equal(report.codeCandidates[0].value, "UV");
});

void test("unread review candidates are reported without failing the census", () => {
  const report = audit([
    {
      name: "other.md",
      source: source("The room has objects.", "There are objects in the room.").replace(
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
      audit([{ name: "empty.md", source: "## Empty {#empty}\nThis is a body.\n" }]),
    ),
    1,
  );
});

void test("confirmed missing measurements fail the census", () => {
  const report = inspect("The height is 2.65 m.", "The design sets the height.");
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
