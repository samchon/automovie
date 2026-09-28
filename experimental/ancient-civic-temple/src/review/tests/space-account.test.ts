/** spaces 분량 표가 실제 전체 문서를 선택하고 주석·제목을 제외하는지 검사한다. */
import assert from "node:assert/strict";
import test from "node:test";
import { spaceAccountMismatches, spaceAccountRows, spaceDocumentBodyLength } from "../space-account";

void test("body measure excludes comments, headings and whitespace but keeps authored symbols", () => {
  assert.equal(spaceDocumentBodyLength("# 제목\n<!-- evidence -->\n## 단위\n가 나 · 2\n"), 4);
});

void test("account rows require the complete unique 27-document population and expose a stale row", () => {
  const paths = [
    "building.md", "storey.md", "openings.md", "junctions.md", "circulation.md",
    "facades/south.md", "facades/north.md", "facades/west.md", "facades/east.md",
    "rooms/entrance.md", "rooms/courtyard.md", "rooms/colonnade.md", "rooms/sanctuary.md", "rooms/offering.md",
    "rooms/administration.md", "rooms/records.md", "rooms/storage.md", "rooms/service-yard.md",
    "roofs/assembly.md", "roofs/sanctuary.md", "roofs/west.md", "roofs/east.md", "roofs/porch.md", "roofs/colonnade.md",
    "ownership.md", "observations.md", "site.md",
  ];
  const measures = paths.map((path, i) => ({ path, body: i + 1, headings: 1 }));
  const rows = spaceAccountRows(measures);
  assert.equal(rows.length, 9);
  assert.equal(rows[0], "| building·storey | 2/2 | 1·2 |");
  const table = ["| 역할 | 파일/H2 | 파일별 본문 문자 수 |", "| --- | --- | --- |", ...rows].join("\n");
  assert.equal(spaceAccountMismatches(table, rows).length, 0);
  assert.equal(spaceAccountMismatches(table.replace(/\n/g, "\r\n"), rows).length, 0);
  assert.deepEqual(spaceAccountMismatches(table.replace("1·2", "1·3"), rows), [rows[0]]);
  assert.deepEqual(spaceAccountMismatches(`${table}\n${rows[0]}`, rows), [`unexpected: ${rows[0]}`]);
  assert.deepEqual(spaceAccountMismatches(table.replace(`${rows[0]}\n${rows[1]}`, `${rows[1]}\n${rows[0]}`), rows), [rows[0], rows[1]]);
  assert.throws(() => spaceAccountRows(measures.slice(1)), /building.md가 없습니다/);
  assert.throws(() => spaceAccountRows([...measures, measures[0]!]), /중복 경로/);
  assert.throws(() => spaceAccountRows([...measures, { path: "extra.md", body: 1, headings: 1 }]), /표에 없는 문서/);
});
