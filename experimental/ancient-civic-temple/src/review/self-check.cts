/**
 * 판정 요청 전 자가검사 실행 진입점(tsx). 현재 production의 environment를
 * 읽기 전용으로 만들고 (1) 외피 실체 겹침 전수 스캔 결과, (2) 방출된 완결
 * 표면 ID의 owner별 목록, (3) docs/spaces 본문 분량(HTML 주석·제목 줄·공백을 뺀
 * 유니코드 코드 포인트 수)을 출력한다. 겹침이 하나라도 있으면 종료 코드 1이다.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createTempleEnvironment } from "../spaces/environment";
import { envelopeSolids, scanOverlaps } from "./envelope-overlaps";

const built = createTempleEnvironment();
const solids = envelopeSolids({ walls: built.walls, roof: built.roof, trim: built.trim, floors: built.floors.inputs });
const started = Date.now();
const overlaps = scanOverlaps(solids);
console.log(`envelope overlap scan: ${solids.length} solids, 0.05 m grid, depth tolerance 0.001 m, ${Date.now() - started} ms`);
console.log(`overlapping pairs: ${overlaps.length}`);
for (const o of overlaps) {
  const f = (v: number) => v.toFixed(3);
  console.log(`  ${o.a} × ${o.b}: ${o.samples} samples, max depth ${f(o.maxDepth)} m at (${f(o.at.x)}, ${f(o.at.z)}) y ${f(o.at.low)}–${f(o.at.high)}, X ${f(o.bounds.west)}~${f(o.bounds.east)} Z ${f(o.bounds.north)}~${f(o.bounds.south)}`);
}

const surfaces = new Map<string, Set<string>>();
for (const model of built.environment.models) {
  for (const part of model.parts) {
    const owner = part.id.split(".")[1] ?? part.id;
    surfaces.set(owner, (surfaces.get(owner) ?? new Set()).add(part.id));
  }
}
console.log(`emitted surface owners: ${surfaces.size}`);
for (const [owner, ids] of [...surfaces].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${owner}: ${[...ids].map((id) => id.split(".").slice(2).join(".")).sort((a, b) => a.localeCompare(b)).join(", ")}`);
}

const root = join(__dirname, "..", "..", "docs", "spaces");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : name.endsWith(".md") ? [path] : [];
});
const bodyLength = (text: string): number => [...text
  .replace(/<!--[\s\S]*?-->/g, "")
  .split("\n").filter((line) => !line.startsWith("#")).join("")
  .replace(/\s/g, "")].length;
const files = walk(root).sort((a, b) => a.localeCompare(b));
let headings = 0;
console.log("docs/spaces body characters:");
for (const file of files) {
  const text = readFileSync(file, "utf8");
  headings += (text.match(/^## /gm) ?? []).length;
  console.log(`  ${relative(root, file).split("\\").join("/")}: ${bodyLength(text)}`);
}
console.log(`docs/spaces population: ${files.length} files, ${headings} H2`);
process.exitCode = overlaps.length > 0 ? 1 : 0;
