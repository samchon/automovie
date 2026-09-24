/** 모델 분량 계측과 계정 표가 동일한 전집합을 쓰는지 검사한다. */
import assert from "node:assert/strict";
import test from "node:test";
import { modelAccountMismatches, modelAccountRows, modelDocumentBodyLength } from "../model-account";

void test("model measure excludes comments and whitespace while retaining headings", () => {
  assert.equal(modelDocumentBodyLength("# 제목\n<!-- 제외 -->\n## 단위\n가 나 · 2\n"), 11);
});

void test("model account includes each source file once and detects stale or extra rows", () => {
  const paths = [
    "fixtures.md", "entablature.md", "openings.md", "wares.md",
    "landscape.md", "scale.md", "columns.md", "cladding.md",
  ];
  const measures = paths.map((path, i) => ({ path, headings: i + 1, body: (i + 1) * 10 }));
  const rows = modelAccountRows(measures);
  assert.equal(rows.length, 9);
  assert.equal(rows[0], "| fixtures.md | 1 | 10 |");
  assert.equal(rows.at(-1), "| 합계 | 36 | 360 |");
  const table = ["| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |", "| --- | ---: | ---: |", ...rows].join("\n");
  assert.deepEqual(modelAccountMismatches(table, rows), []);
  assert.deepEqual(modelAccountMismatches(table.replace(/\n/g, "\r\n"), rows), []);
  assert.deepEqual(modelAccountMismatches(table.replace("| 1 | 10 |", "| 1 | 11 |"), rows), [rows[0]]);
  assert.deepEqual(modelAccountMismatches(`${table}\n${rows[0]}`, rows), [`unexpected: ${rows[0]}`]);
  assert.deepEqual(modelAccountMismatches("no table", rows), rows);
  assert.throws(() => modelAccountRows(measures.slice(1)), /fixtures.md가 없습니다/);
  assert.throws(() => modelAccountRows([...measures, measures[0]!]), /중복 경로/);
  assert.throws(() => modelAccountRows([...measures, { path: "extra.md", headings: 1, body: 1 }]), /표에 없는 문서/);
});
