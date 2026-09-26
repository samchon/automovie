import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { auditSurfaceOwners } from "../surface-owner-audit";

const markdown = readFileSync(
  join(__dirname, "../../../docs/spaces/ownership.md"),
  "utf8",
);
const declared = [...markdown.matchAll(/^\| .+ \| `([^`]+)` \|$/gm)].map(
  (match) => match[1]!,
);
const emitted = declared.map((owner) => ({
  owner,
  ids: [`surface.${owner}.face`],
}));

void test("surface table and emitted owners are compared in both directions", () => {
  const baseline = auditSurfaceOwners(markdown, emitted);
  assert.equal(baseline.rows, 22);
  assert.equal(baseline.declared, 21);
  assert.equal(baseline.emitted, 21);
  assert.deepEqual(baseline.failures, []);
  assert.match(
    auditSurfaceOwners(markdown, [...emitted, { owner: "unlisted", ids: ["surface.unlisted.face"] }]).failures.join(
      " ",
    ),
    /표에 없습니다/,
  );
  assert.match(
    auditSurfaceOwners(markdown, emitted.slice(1)).failures.join(" "),
    /방출되지 않았습니다/,
  );
  assert.match(
    auditSurfaceOwners(markdown, [...emitted, emitted[0]!]).failures.join(" "),
    /중복/,
  );
  assert.match(
    auditSurfaceOwners(markdown, [{ ...emitted[0]!, ids: [] }, ...emitted.slice(1)]).failures.join(
      " ",
    ),
    /비었습니다/,
  );
});

void test("missing, malformed, and duplicated table rows fail", () => {
  assert.match(
    auditSurfaceOwners("## 다른 제목", emitted).failures.join(" "),
    /표가 없습니다/,
  );
  const missing = markdown.replace("| `facade-south` |", "| 없음(누락) |");
  assert.match(
    auditSurfaceOwners(missing, emitted).failures.join(" "),
    /표에 없습니다/,
  );
  const duplicate = markdown.replace("| `facade-north` |", "| `facade-south` |");
  assert.match(
    auditSurfaceOwners(duplicate, emitted).failures.join(" "),
    /중복/,
  );
  const malformed = markdown.replace("| `facade-north` |", "| 빈칸 |");
  assert.match(
    auditSurfaceOwners(malformed, emitted).failures.join(" "),
    /방출 owner가 없습니다/,
  );
});

void test("every ownership row keeps its design link and source path", () => {
  const row = markdown.split(/\r?\n/).find((line) => line.includes("| `facade-north` |"));
  assert.ok(row);
  const columns = row.split("|");
  const mutate = (index: number, replacement: string): string => {
    const changed = [...columns];
    changed[index] = replacement;
    return markdown.replace(row, changed.join("|"));
  };
  assert.ok(auditSurfaceOwners(mutate(2, " missing design link "), emitted).failures.length > 0);
  assert.ok(auditSurfaceOwners(mutate(3, " src/elsewhere/owner.ts "), emitted).failures.length > 0);
  assert.ok(auditSurfaceOwners(markdown.replace(row, row.replace("| `facade-north` |", "| extra | `facade-north` |")), emitted).failures.length > 0);
});
