/**
 * 판정 요청 전 자가검사 실행 진입점(tsx). 현재 production의 environment를
 * 읽기 전용으로 만들고 다음을 출력한다.
 * (1) 외피 실체 겹침 전수 스캔(기본 0.01m 격자, `--grid=m`로 바꿀 수 있다)
 * (2) 관찰 pose 중 실체 안에 놓인 것
 * (3) 방출된 완결 표면 ID의 owner별 목록
 * (4) docs/spaces 본문 분량(HTML 주석·제목 줄·공백을 뺀 유니코드 코드 포인트 수)
 * (5) `--retired=값,값` 으로 준 옛 수치가 docs에 남은 위치. 수치를 바꾼 뒤 그 값을
 *     소비하던 문장을 찾는 용도이며 host 본문이 그대로면 lint가 다시 보지 않는 결함을 잡는다.
 * 겹침이나 실체 안 관찰이 하나라도 있으면 종료 코드 1이다.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { createTempleEnvironment } from "../spaces/environment";
import { templeObservations } from "../spaces/observations";
import { envelopeSolids, lastScan, scanOverlaps, solidsContaining } from "./envelope-overlaps";

const { values } = parseArgs({ options: { grid: { type: "string", default: "0.01" }, retired: { type: "string", default: "" } } });
const grid = Number(values.grid);
if (!(grid > 0)) throw new Error("--grid는 양의 m 값이어야 합니다.");

const built = createTempleEnvironment();
const solids = envelopeSolids({ walls: built.walls, roof: built.roof, trim: built.trim, floors: built.floors.inputs });
const started = Date.now();
const overlaps = scanOverlaps(solids, grid);
console.log(`envelope overlap scan: ${solids.length} solids, ${grid} m grid, ${lastScan.samples} samples, depth tolerance 0.001 m, ${Date.now() - started} ms`);
console.log(`overlapping pairs: ${overlaps.length}`);
for (const o of overlaps) {
  const f = (v: number) => v.toFixed(3);
  console.log(`  ${o.a} × ${o.b}: ${o.samples} samples, max depth ${f(o.maxDepth)} m at (${f(o.at.x)}, ${f(o.at.z)}) y ${f(o.at.low)}–${f(o.at.high)}, X ${f(o.bounds.west)}~${f(o.bounds.east)} Z ${f(o.bounds.north)}~${f(o.bounds.south)}`);
}

const observations = templeObservations(built.environment);
const buried = observations.flatMap((o) => o.position === null ? [] : solidsContaining(solids, o.position).map((group) => `${o.id} in ${group}`));
console.log(`observations: ${observations.length} (${observations.filter((o) => o.position === null).length} without pose); poses inside a solid: ${buried.length}`);
for (const line of buried) console.log(`  ${line}`);

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
process.exitCode = overlaps.length > 0 || buried.length > 0 ? 1 : 0;
