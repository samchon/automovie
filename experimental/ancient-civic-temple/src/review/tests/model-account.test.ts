/** 모델 분량 계측과 계정 표가 동일한 전집합을 쓰는지 검사한다. */
import assert from "node:assert/strict";
import test from "node:test";
import { modelAccountMismatches, modelAccountRows, modelDocumentBodyLength, modelSectionMeasures, modelParameterAuditMismatches } from "../model-account";

void test("model measure excludes comments and whitespace while retaining headings", () => {
  assert.equal(modelDocumentBodyLength("# 제목\n<!-- 제외 -->\n## 단위\n가 나 · 2\n"), 11);
});

void test("parameter audit has one closed row per real H2 and rejects an omitted, duplicate or open row", () => {
  const docs = [{ path: "fixture.md", source: "## 하나 {#one}\n본문\n## 둘 {#two}\n본문" }];
  const table = ["| 모델 H2 | source에 남긴 새 치수 결정 | 본문의 닫힘 근거 |", "| --- | ---: | --- |",
    "| [one](../../models/fixture.md#one) | 0 | 값 |", "| [two](../../models/fixture.md#two) | 0 | 값 |"].join("\n");
  assert.deepEqual(modelParameterAuditMismatches(docs, table), []);
  assert.ok(modelParameterAuditMismatches(docs, table.replace("| [two](../../models/fixture.md#two) | 0 | 값 |", "")).some((row) => row.includes("two")));
  assert.ok(modelParameterAuditMismatches(docs, `${table}\n| [one](../../models/fixture.md#one) | 0 | 값 |`).some((row) => row.includes("duplicate")));
  assert.ok(modelParameterAuditMismatches(docs, table.replace("#two) | 0", "#two) | 1")).some((row) => row.includes("not closed")));
});

void test("H2 rank measure excludes evidence comments and keeps each section distinct", () => {
  const rows = modelSectionMeasures([{ path: "one.md", source: "# file\n## 짧은 {#short}\na\n<!-- 매우 긴 증거 문장 -->\n## 긴 {#long}\na b c d e f g h i j\n" }]);
  assert.deepEqual(rows.map(({ title }) => title), ["긴", "짧은"]);
  assert.ok(rows[0]!.body > rows[1]!.body);
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
