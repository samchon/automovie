/**
 * 판정 요청 전 자가검사 실행 진입점(tsx). 뷰어의 `/review`와 같은 producer
 * (review-payload)로 현재 source를 재고 다음을 출력한다.
 * (0) source basis·Git revision·호출 명령(측정값이 어느 source에서 나왔는지)
 * (1) 외피 실체 겹침 전수 스캔(기본 0.01m 격자, `--grid=m`로 바꿀 수 있다)
 * (2) 관찰 pose 중 실체 안에 놓인 것
 * (3) 모든 model과 합성 실체의 topology 결산표와 닫힘 계약 위반(mesh-ledger)
 * (4) 방출된 완결 표면 ID의 owner별 목록
 * (5) docs/spaces 본문 분량(HTML 주석·제목 줄·공백을 뺀 유니코드 코드 포인트 수)
 * (6) docs/models 본문 분량(HTML 주석·공백을 뺀 유니코드 코드 포인트 수)
 * (7) `--retired=값,값` 으로 준 옛 수치가 docs에 남은 위치. 수치를 바꾼 뒤 그 값을
 *     소비하던 문장을 찾는 용도이며 host 본문이 그대로면 lint가 다시 보지 않는 결함을 잡는다.
 * 겹침, 실체 안 관찰, 결산 계약 위반이 하나라도 있으면 종료 코드 1이다.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { createReviewPayload } from "./review-payload";
import { modelAccountMismatches, modelAccountRows, modelDocumentBodyLength, modelSectionMeasures } from "./model-account";
import { spaceAccountMismatches, spaceAccountRows, spaceDocumentBodyLength } from "./space-account";
import { replaceMeasuredTable } from "./account-sync";
import { modelHandoffRows } from "./model-handoff-audit";
import { addressCoverageCensus } from "./address-coverage";
import { createTempleEnvironment } from "../spaces/environment";
import { templeObservations } from "../spaces/observations";
import { ownReturnFacadeViews } from "./own-facade-view";

const { values } = parseArgs({ options: { grid: { type: "string", default: "0.01" }, retired: { type: "string", default: "" }, "sync-accounts": { type: "boolean", default: false }, handoffs: { type: "boolean", default: false } } });
const grid = Number(values.grid);
if (!(grid > 0)) throw new Error("--grid는 양의 m 값이어야 합니다.");

const review = createReviewPayload(grid);
const revision = review.revision === null ? "unverified (git을 읽지 못함)"
  : `${review.revision.commit}${review.revision.dirty ? " + 커밋되지 않은 변경(dirty)" : ""}`;
console.log(`source basis ${review.basis} · revision ${revision}`);
console.log(`invocation: npm run self-check -- --grid=${grid}${values.retired.length > 0 ? ` --retired=${values.retired}` : ""}${values["sync-accounts"] ? " --sync-accounts" : ""}${values.handoffs ? " --handoffs" : ""}`);

const f3 = (v: number) => v.toFixed(3);
const { overlaps } = review;
console.log(`envelope overlap scan: ${overlaps.solids} solids, ${overlaps.grid} m grid, ${overlaps.samples} samples, depth tolerance ${overlaps.tolerance} m, ${overlaps.milliseconds} ms`);
console.log(`overlapping pairs: ${overlaps.pairs.length}`);
for (const o of overlaps.pairs) {
  console.log(`  ${o.a} × ${o.b}: ${o.samples} samples, max depth ${f3(o.maxDepth)} m at (${f3(o.at.x)}, ${f3(o.at.z)}) y ${f3(o.at.low)}–${f3(o.at.high)}, X ${f3(o.bounds.west)}~${f3(o.bounds.east)} Z ${f3(o.bounds.north)}~${f3(o.bounds.south)}`);
}
console.log(`observations: ${review.observations.count} (${review.observations.withoutPose} without pose); poses inside a solid: ${review.observations.buried.length}`);
for (const line of review.observations.buried) console.log(`  ${line}`);
console.log(`emitted wall address census: ${review.addressCoverage.emitted} samples at ${review.addressCoverage.step} m; ${review.addressCoverage.covered} addressed; ${review.addressCoverage.uncovered} unaddressed; ${review.addressCoverage.skyOpen} unaddressed sky-open`);
for (const row of review.addressCoverage.rows.filter((item) => item.wall === "wall.facade-south.entry-back")) {
  console.log(`  ${row.wall} face ${row.face}: emitted ${row.emitted}, addressed ${row.covered}, unaddressed ${row.uncovered}, sky-open ${row.skyOpen}; surfaces ${row.surfaces.join(",")}`);
}
console.log(`unaddressed sky-open by wall: ${review.addressCoverage.rows.filter((row) => row.skyOpen > 0).map((row) => `${row.wall}#${row.face}=${row.skyOpen}`).join(", ") || "none"}`);
const addressControl = createTempleEnvironment();
const omittedEndAddresses = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter((boundary) => !/^boundary-entry\.(west|east)-(end|side)/.test(boundary.id)),
};
const controlCoverage = addressCoverageCensus(omittedEndAddresses, addressControl.walls);
const targetSky = review.addressCoverage.rows.filter((row) => row.wall === "wall.facade-south.entry-back").reduce((sum, row) => sum + row.skyOpen, 0);
const controlSky = controlCoverage.rows.filter((row) => row.wall === "wall.facade-south.entry-back").reduce((sum, row) => sum + row.skyOpen, 0);
const addressControlFailed = targetSky !== 0 || controlSky <= targetSky;
console.log(`entry-back geometry-side address: ${targetSky} unaddressed sky-open; omitted-end positive control ${controlSky}; ${addressControlFailed ? "FAIL" : "PASS"}`);
const ownViews = ownReturnFacadeViews(addressControl.environment, templeObservations(addressControl.environment));
console.log(`return-wall own facade views: ${ownViews.length} stations`);
for (const row of ownViews) console.log(`  ${row.id}: ${row.visible}/${row.sampled} (${(row.ratio * 100).toFixed(1)}%)`);
console.log(`boundary upper census: ${review.boundaryUpper.length} boundaries; ${review.boundaryUpper.filter((row) => row.tested > 0).length} two-space hosts tested; ${review.boundaryUpper.reduce((sum, row) => sum + row.sampled, 0)} sampled / ${review.boundaryUpper.reduce((sum, row) => sum + row.tested, 0)} adjacent-volume stations; ${review.boundaryUpper.filter((row) => row.exposed > 0).length} unsplit upper bands`);
for (const row of review.boundaryUpper) console.log(`  ${row.id}: ${row.sampled} sampled, ${row.tested} adjacent-volume stations, ${row.exposed} exposed, max band ${f3(row.maxBand)} m${row.maxAt === null ? "" : ` at u=${f3(row.maxAt.u)}, host=${f3(row.maxAt.hostTop)}, sides=${f3(row.maxAt.firstCap)}/${f3(row.maxAt.secondCap)}`}`);
console.log(`opening frustum census: ${review.openingFrustum.length} compiled openings; ${review.openingFrustum.filter((row) => row.roomCenterVisible).length} room-facing centers visible; ${review.openingFrustum.filter((row) => row.completeProfileFramed).length} full profiles framed`);
for (const row of review.openingFrustum) console.log(`  ${row.id} (${row.kind}): room ${row.roomCenterVisible ? "center visible" : "center MISSED"}, corners ${row.roomCornersVisible}/4, exterior ${row.exteriorCornersVisible ?? "n/a"}/4, arrival ${row.arrivalCenterVisible ?? "n/a"}; eye ${f3(row.roomPosition.x)},${f3(row.roomPosition.y)},${f3(row.roomPosition.z)} target ${f3(row.roomTarget.x)},${f3(row.roomTarget.y)},${f3(row.roomTarget.z)}`);

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
const spaces = walk(join(docs, "spaces")).sort((a, b) => a.localeCompare(b));
let headings = 0;
const measures: Array<{ path: string; body: number; headings: number }> = [];
console.log("docs/spaces body characters:");
for (const file of spaces) {
  const text = readFileSync(file, "utf8");
  const path = relative(join(docs, "spaces"), file).split("\\").join("/");
  const count = (text.match(/^## /gm) ?? []).length;
  const body = spaceDocumentBodyLength(text);
  headings += count;
  measures.push({ path, body, headings: count });
  console.log(`  ${path}: ${body}`);
}
console.log(`docs/spaces population: ${spaces.length} files, ${headings} H2`);
const accountRows = spaceAccountRows(measures);
const spaceAccountPath = join(docs, "accounts", "spaces", "core-common.md");
const rawSpaceAccount = readFileSync(spaceAccountPath, "utf8");
const account = values["sync-accounts"]
  ? replaceMeasuredTable(rawSpaceAccount, "| 역할 | 파일/H2 | 파일별 본문 문자 수 |", accountRows) : rawSpaceAccount;
if (values["sync-accounts"] && account !== rawSpaceAccount) writeFileSync(spaceAccountPath, account, "utf8");
const accountMismatches = spaceAccountMismatches(account, accountRows);
console.log("generated docs/accounts/spaces/core-common.md#proportion rows:");
for (const row of accountRows) console.log(row);
console.log(`spaces account table mismatches: ${accountMismatches.length}`);
for (const row of accountMismatches) console.log(`  stale: ${row}`);

const models = walk(join(docs, "models")).sort((a, b) => a.localeCompare(b));
const modelDocuments = models.map((file) => ({
  path: relative(join(docs, "models"), file).split("\\").join("/"), source: readFileSync(file, "utf8"),
}));
const modelMeasures = modelDocuments.map(({ path, source }) => {
  return {
    path,
    body: modelDocumentBodyLength(source),
    headings: (source.match(/^## /gm) ?? []).length,
  };
});
const modelRows = modelAccountRows(modelMeasures);
const modelAccountPath = join(docs, "accounts", "models", "core-common.md");
const rawModelAccount = readFileSync(modelAccountPath, "utf8");
const modelAccount = values["sync-accounts"]
  ? replaceMeasuredTable(rawModelAccount, "| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |", modelRows) : rawModelAccount;
if (values["sync-accounts"] && modelAccount !== rawModelAccount) writeFileSync(modelAccountPath, modelAccount, "utf8");
const modelMismatches = modelAccountMismatches(modelAccount, modelRows);
console.log(`docs/models population: ${models.length} files, ${modelMeasures.reduce((sum, row) => sum + row.headings, 0)} H2`);
console.log("generated docs/accounts/models/core-common.md#proportion rows:");
for (const row of modelRows) console.log(row);
console.log(`models account table mismatches: ${modelMismatches.length}`);
for (const row of modelMismatches) console.log(`  stale: ${row}`);
const sectionRanks = modelSectionMeasures(modelDocuments);
console.log(`model H2 ranks: ${sectionRanks.length} sections; top 7 ${sectionRanks.slice(0, 7).map((row) => `${row.title}=${row.body}`).join(", ")}; shortest 4 ${sectionRanks.slice(-4).reverse().map((row) => `${row.title}=${row.body}`).join(", ")}`);

const vocabulary = readFileSync(join(__dirname, "model-handoff-vocabulary.txt"), "utf8")
  .replace(/\r\n/g, "\n").split("\n").filter((term) => term.length > 0);
const handoffs = modelHandoffRows(
  [...walk(join(docs, "settings")), ...spaces].map((file) => ({
    path: relative(docs, file).split("\\").join("/"), source: readFileSync(file, "utf8"),
  })),
  models.map((file) => ({ path: relative(join(docs, "models"), file).split("\\").join("/"), source: readFileSync(file, "utf8") })),
  vocabulary,
);
const ownerless = handoffs.filter((row) => row.owners.length === 0);
console.log(`model handoff reverse audit: ${vocabulary.length} vocabulary terms, ${handoffs.length} parent H2 rows, ${ownerless.length} ownerless`);
if (values.handoffs) {
  for (const row of handoffs) console.log(`  ${row.parent} | ${row.terms.join(", ")} | ${row.owners.join(", ") || "OWNERLESS"}`);
}
for (const row of ownerless) console.log(`  ownerless: ${row.parent}: ${row.terms.join(", ")}`);

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
console.log(`self-check failures: ${review.failures + accountMismatches.length + modelMismatches.length + ownerless.length + Number(addressControlFailed)}`);
process.exitCode = review.failures + accountMismatches.length + modelMismatches.length + ownerless.length + Number(addressControlFailed) > 0 ? 1 : 0;
