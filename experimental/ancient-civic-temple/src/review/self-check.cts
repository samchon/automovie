/**
 * 판정 요청 전 자가검사 실행 진입점(tsx). 뷰어의 `/review`와 같은 producer
 * (review-payload)로 현재 source를 재고 다음을 출력한다.
 * (0) source basis·Git revision·호출 명령(측정값이 어느 source에서 나왔는지)
 * (1) 외피 실체 겹침 전수 스캔(기본 0.01m 격자, `--grid=m`로 바꿀 수 있다)
 * (2) 관찰 pose 중 실체 안에 놓인 것
 * (3) 모든 model과 합성 실체의 topology 결산표와 닫힘 계약 위반(mesh-ledger)
 * (4) 방출된 완결 표면 ID의 owner별 목록
 * (5) docs/spaces 본문 분량(HTML 주석·제목 줄·공백을 뺀 유니코드 코드 포인트 수)
 * (6) `--retired=값,값` 으로 준 옛 수치가 docs에 남은 위치. 수치를 바꾼 뒤 그 값을
 *     소비하던 문장을 찾는 용도이며 host 본문이 그대로면 lint가 다시 보지 않는 결함을 잡는다.
 * 겹침, 실체 안 관찰, 결산 계약 위반이 하나라도 있으면 종료 코드 1이다.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { createReviewPayload } from "./review-payload";

const { values } = parseArgs({ options: { grid: { type: "string", default: "0.01" }, retired: { type: "string", default: "" } } });
const grid = Number(values.grid);
if (!(grid > 0)) throw new Error("--grid는 양의 m 값이어야 합니다.");

const review = createReviewPayload(grid);
const revision = review.revision === null ? "unverified (git을 읽지 못함)"
  : `${review.revision.commit}${review.revision.dirty ? " + 커밋되지 않은 변경(dirty)" : ""}`;
console.log(`source basis ${review.basis} · revision ${revision}`);
console.log(`invocation: npm run self-check -- --grid=${grid}${values.retired.length > 0 ? ` --retired=${values.retired}` : ""}`);

const f3 = (v: number) => v.toFixed(3);
const { overlaps } = review;
console.log(`envelope overlap scan: ${overlaps.solids} solids, ${overlaps.grid} m grid, ${overlaps.samples} samples, depth tolerance ${overlaps.tolerance} m, ${overlaps.milliseconds} ms`);
console.log(`overlapping pairs: ${overlaps.pairs.length}`);
for (const o of overlaps.pairs) {
  console.log(`  ${o.a} × ${o.b}: ${o.samples} samples, max depth ${f3(o.maxDepth)} m at (${f3(o.at.x)}, ${f3(o.at.z)}) y ${f3(o.at.low)}–${f3(o.at.high)}, X ${f3(o.bounds.west)}~${f3(o.bounds.east)} Z ${f3(o.bounds.north)}~${f3(o.bounds.south)}`);
}
console.log(`observations: ${review.observations.count} (${review.observations.withoutPose} without pose); poses inside a solid: ${review.observations.buried.length}`);
for (const line of review.observations.buried) console.log(`  ${line}`);

console.log("topology ledger (engine inspect/validate + T-junction resolution; open = open edges after resolution):");
console.log("  model | contract | parts | verts/welded | tris | degenerate | non-finite | raw open | non-manifold | winding | T-verts | open | components | volume m³ | normals/uvs parts | bounds");
for (const { account: a, contract, findings } of review.ledger) {
  const bounds = `${a.bounds.min.map(f3).join(",")} ~ ${a.bounds.max.map(f3).join(",")}`;
  console.log(`  ${a.id} | ${contract} | ${a.parts} | ${a.vertices}/${a.weldedVertices} | ${a.triangles} | ${a.degenerate} | ${a.nonFinite} | ${a.boundaryEdges} | ${a.nonManifoldEdges}/${a.resolvedNonManifold} | ${a.windingErrors} | ${a.tJunctionVertices} | ${a.openEdges} | ${a.components} | ${a.volume.toFixed(4)} | ${a.partsWithNormals}/${a.partsWithUvs} of ${a.parts} | ${bounds}${findings.length > 0 ? ` | 계약 위반: ${findings.join("; ")}` : ""}`);
  if (findings.length > 0) for (const d of a.defectSamples) console.log(`      ${d.kind} at (${d.at.map(f3).join(", ")})`);
}
console.log(`ledger rows violating their contract: ${review.ledger.filter((row) => row.findings.length > 0).length} of ${review.ledger.length}`);

console.log(`emitted surface owners: ${review.surfaces.length}`);
for (const { owner, ids } of review.surfaces) console.log(`  ${owner}: ${ids.map((id) => id.split(".").slice(2).join(".")).join(", ")}`);

const docs = join(__dirname, "..", "..", "docs");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : name.endsWith(".md") ? [path] : [];
});
const bodyLength = (text: string): number => [...text
  .replace(/<!--[\s\S]*?-->/g, "")
  .split("\n").filter((line) => !line.startsWith("#")).join("")
  .replace(/\s/g, "")].length;
const spaces = walk(join(docs, "spaces")).sort((a, b) => a.localeCompare(b));
let headings = 0;
console.log("docs/spaces body characters:");
for (const file of spaces) {
  const text = readFileSync(file, "utf8");
  headings += (text.match(/^## /gm) ?? []).length;
  console.log(`  ${relative(join(docs, "spaces"), file).split("\\").join("/")}: ${bodyLength(text)}`);
}
console.log(`docs/spaces population: ${spaces.length} files, ${headings} H2`);

const retired = values.retired.split(",").map((value) => value.trim()).filter((value) => value.length > 0);
if (retired.length > 0) {
  const authored = ["spaces", "models", "accounts", "settings", "contracts"].flatMap((dir) => walk(join(docs, dir)));
  console.log(`retired values in docs/{spaces,models,accounts,settings,contracts}:`);
  for (const value of retired) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = /^[\d.]+$/.test(value) ? new RegExp(`(?<![\\d.])${escaped}(?!\\d)`) : new RegExp(escaped);
    const hits = authored.flatMap((file) => readFileSync(file, "utf8").split("\n").flatMap((line, i) =>
      pattern.test(line) ? [`${relative(docs, file).split("\\").join("/")}:${i + 1}`] : []));
    console.log(`  ${value}: ${hits.length}${hits.length > 0 ? ` — ${hits.join(", ")}` : ""}`);
  }
}
console.log(`self-check failures: ${review.failures}`);
process.exitCode = review.failures > 0 ? 1 : 0;
