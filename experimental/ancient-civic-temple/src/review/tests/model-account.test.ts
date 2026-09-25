/** 모델 분량 계측과 계정 표가 동일한 전집합을 쓰는지 검사한다. */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { modelAccountMismatches, modelAccountRows, modelDocumentBodyLength, modelSectionMeasures, modelInputHeader, modelSourceInputRows, modelSourceInputMismatches, modelPartNounMismatches } from "../model-account";

void test("every geometry noun retains a part owner, including an omitted truss strut", () => {
  const root = join(__dirname, "../../../docs/models");
  const docs = ["fixtures", "entablature", "openings", "wares", "landscape", "scale", "columns", "cladding", "portable"]
    .map((name) => ({ path: `${name}.md`, source: readFileSync(join(root, `${name}.md`), "utf8") }));
  assert.deepEqual(modelPartNounMismatches(docs), []);
  const changed = docs.map((doc) => doc.path !== "entablature.md" ? doc : {
    ...doc,
    source: doc.source.replace("`tie-beam`, `principal`, `king-post`, `strut`", "`tie-beam`, `principal`, `king-post`"),
  });
  assert.match(modelPartNounMismatches(changed).join("\n"), /sanctuary-truss: 버팀재 has no strut surface/);
});

void test("the same coordinate grammar rejects moved, lifted, removed and coincident parts", () => {
  const source = readFileSync(join(__dirname, "../../../docs/models/portable.md"), "utf8");
  const section = source.split(/(?=^## )/m).find((item) => item.includes("| part | X | Y | Z |"))!;
  const rows = [...section.matchAll(/^\| `[^`]+` \| [^\n]+$/gm)].map((match) => match[0]);
  assert.ok(rows.length >= 2);
  const doc = (text: string) => [{ path: "object.md", source: text }];
  assert.deepEqual(modelPartNounMismatches(doc(section)), []);
  const moved = section.replace(rows[0]!, rows[0]!.replace(/X=([+−-]?\d+(?:\.\d+)?)/, "X=9"));
  const lifted = section.replace(rows[1]!, rows[1]!.replace(/Y=0~/, "Y=0.01~"));
  const removed = section.replace(`${rows[1]}\n`, "");
  const firstCoordinates = rows[0]!.slice(rows[0]!.indexOf(" | ") + 3);
  const secondPart = rows[1]!.match(/^\| `[^`]+`/)![0];
  const coincident = section.replace(rows[1]!, `${secondPart} | ${firstCoordinates}`);
  assert.ok(modelPartNounMismatches(doc(moved)).length > 0);
  assert.ok(modelPartNounMismatches(doc(lifted)).length > 0);
  assert.ok(modelPartNounMismatches(doc(removed)).length > 0);
  assert.match(modelPartNounMismatches(doc(coincident)).join("\n"), /identical coordinate intervals/);
});

void test("model measure excludes comments and whitespace while retaining headings", () => {
  assert.equal(modelDocumentBodyLength("# 제목\n<!-- 제외 -->\n## 단위\n가 나 · 2\n"), 11);
});

void test("source-input rows follow every part and reject stale values, omitted parts and extra rows", () => {
  const docs = [{ path: "fixture.md", source: "## 하나 {#one}\n원점 X=0, 반지름 0.2m, 8분할, 벽에 닿는다.\npart와 표면은 `body`, `rim`이다.\n## 둘 {#two}\n판 두께 0.03m.\npart와 표면은 `board`다." }];
  const rows = modelSourceInputRows(docs);
  assert.equal(rows.length, 3);
  const table = [modelInputHeader, "| --- | --- | ---: | --- |", ...rows].join("\n");
  assert.deepEqual(modelSourceInputMismatches(table, rows), []);
  assert.ok(modelSourceInputMismatches(table, modelSourceInputRows([{ ...docs[0]!, source: docs[0]!.source.replace("0.2m", "0.3m") }])).some((row) => row.includes("stale")));
  assert.ok(modelSourceInputMismatches(table.replace(`${rows[1]}\n`, ""), rows).length > 0);
  assert.ok(modelSourceInputMismatches(`${table}\n${rows[0]}`, rows).some((row) => row.includes("unexpected")));
  assert.throws(() => modelSourceInputRows([{ path: "fixture.md", source: "## 셋 {#three}\npart 선언 없음" }]), /part 선언/);
});

void test("H2 rank measure excludes evidence comments and keeps each section distinct", () => {
  const rows = modelSectionMeasures([{ path: "one.md", source: "# file\n## 짧은 {#short}\na\n<!-- 매우 긴 증거 문장 -->\n## 긴 {#long}\na b c d e f g h i j\n" }]);
  assert.deepEqual(rows.map(({ title }) => title), ["긴", "짧은"]);
  assert.ok(rows[0]!.body > rows[1]!.body);
});

void test("model account includes each source file once and detects stale or extra rows", () => {
  const paths = [
    "fixtures.md", "entablature.md", "openings.md", "wares.md",
    "landscape.md", "scale.md", "columns.md", "cladding.md", "portable.md",
  ];
  const measures = paths.map((path, i) => ({ path, headings: i + 1, body: (i + 1) * 10 }));
  const rows = modelAccountRows(measures);
  assert.equal(rows.length, 10);
  assert.equal(rows[0], "| fixtures.md | 1 | 10 |");
  assert.equal(rows.at(-1), "| 합계 | 45 | 450 |");
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
