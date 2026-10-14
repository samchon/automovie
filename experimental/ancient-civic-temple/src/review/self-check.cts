/** Inspect the current typed environment, mesh topology, observation poses,
 * facade addresses and full viewer scene before requesting review. The viewer's
 * /review endpoint uses the same producer. A positive grid in metres selects
 * the overlap scan resolution; measurements identify their source and revision.
 * Any geometric, observation, address, unit or scene failure returns exit 1.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { createTempleEnvironment } from "../spaces/environment";
import { templeObservations } from "../spaces/observations";
import { addressCoverageCensus } from "./address-coverage";
import { envelopeSolids } from "./envelope-overlaps";
import { ownFacadeFailures, ownFacadeViews } from "./own-facade-view";
import { createReviewPayload } from "./review-payload";

const { values } = parseArgs({
  options: {
    grid: { type: "string", default: "0.01" },
  },
});
const grid = Number(values.grid);
if (!(grid > 0)) throw new Error("--grid must be a positive value in metres.");

const review = createReviewPayload(grid);
const revision =
  review.revision === null
    ? "unverified (git is unreadable)"
    : `${review.revision.commit}${review.revision.dirty ? " + uncommitted changes (dirty)" : ""}`;
console.log(`source basis ${review.basis} · revision ${revision}`);
console.log(`invocation: npm run self-check -- --grid=${grid}`);

const f3 = (v: number) => v.toFixed(3);
const { overlaps } = review;
console.log(
  `envelope overlap scan: ${overlaps.solids} solids, ${overlaps.grid} m grid, ${overlaps.samples} samples, depth tolerance ${overlaps.tolerance} m, ${overlaps.milliseconds} ms`,
);
console.log(`overlapping pairs: ${overlaps.pairs.length}`);
for (const o of overlaps.pairs) {
  console.log(
    `  ${o.a} × ${o.b}: ${o.samples} samples, max depth ${f3(o.maxDepth)} m at (${f3(o.at.x)}, ${f3(o.at.z)}) y ${f3(o.at.low)}–${f3(o.at.high)}, X ${f3(o.bounds.west)}~${f3(o.bounds.east)} Z ${f3(o.bounds.north)}~${f3(o.bounds.south)}`,
  );
}
console.log(
  `observations: ${review.observations.count} (${review.observations.withoutPose} without pose); poses inside a solid: ${review.observations.buried.length}`,
);
for (const line of review.observations.buried) console.log(`  ${line}`);
console.log(
  `emitted wall address census: ${review.addressCoverage.emitted} samples at ${review.addressCoverage.step} m; ${review.addressCoverage.covered} addressed; ${review.addressCoverage.uncovered} unaddressed; ${review.addressCoverage.skyOpen} unaddressed sky-open`,
);
console.log(
  `exposed wall address census: ${review.addressCoverage.exposed} exposed without facade address; ${review.addressCoverage.excepted} named junction exceptions; ${review.addressCoverage.unexpected} unexpected`,
);
console.log(
  `addressed samples inside a named exception: ${review.addressCoverage.addressedInException}`,
);
console.log(
  `named exception observations missing: ${review.missingExceptionObservations.length}${review.missingExceptionObservations.length === 0 ? "" : ` (${review.missingExceptionObservations.join(", ")})`}`,
);
console.log(
  `named exception intervals sampled: ${review.addressCoverage.exceptions.filter((entry) => entry.samples > 0).length}/${review.addressCoverage.exceptions.length}`,
);
for (const entry of review.addressCoverage.exceptions)
  console.log(
    `  exception ${entry.wall}#${entry.face} ${entry.axis} ${entry.from}..${entry.to}${entry.minY === undefined ? "" : ` above ${entry.minY}`}: ${entry.samples}; ${entry.observation}`,
  );
for (const row of review.addressCoverage.rows.filter(
  (item) => item.unexpected > 0,
))
  console.log(`  unexpected ${row.wall}#${row.face}: ${row.unexpected}`);
for (const row of review.addressCoverage.rows.filter(
  (item) => item.wall === "wall.facade-south.entry-back",
)) {
  console.log(
    `  ${row.wall} face ${row.face}: emitted ${row.emitted}, addressed ${row.covered}, unaddressed ${row.uncovered}, sky-open ${row.skyOpen}; surfaces ${row.surfaces.join(",")}`,
  );
}
console.log(
  `unaddressed sky-open by wall: ${
    review.addressCoverage.rows
      .filter((row) => row.skyOpen > 0)
      .map((row) => `${row.wall}#${row.face}=${row.skyOpen}`)
      .join(", ") || "none"
  }`,
);
const addressControl = createTempleEnvironment();
const omittedEndAddresses = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter(
    (boundary) => !/^boundary-entry\.(west|east)-(end|side)/.test(boundary.id),
  ),
};
const controlSolids = envelopeSolids({
  walls: addressControl.walls,
  roof: addressControl.roof,
  trim: addressControl.trim,
  floors: addressControl.floors.inputs,
});
const controlCoverage = addressCoverageCensus(
  omittedEndAddresses,
  addressControl.walls,
  controlSolids,
);
const omittedSouthAddress = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter(
    (boundary) => boundary.id !== "boundary-south.colonnade-west",
  ),
};
const southControl = addressCoverageCensus(
  omittedSouthAddress,
  addressControl.walls,
  controlSolids,
);
const omittedUpperAddress = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter(
    (boundary) => boundary.id !== "boundary-sanctuary-south.upper",
  ),
};
const upperControl = addressCoverageCensus(
  omittedUpperAddress,
  addressControl.walls,
  controlSolids,
);
const omittedPedimentFront = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter(
    (boundary) => boundary.id !== "boundary-porch-pediment.front",
  ),
};
const pedimentControl = addressCoverageCensus(
  omittedPedimentFront,
  addressControl.walls,
  controlSolids,
);
const omittedPedimentBack = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter(
    (boundary) => boundary.id !== "boundary-porch-pediment.back",
  ),
};
const pedimentBackControl = addressCoverageCensus(
  omittedPedimentBack,
  addressControl.walls,
  controlSolids,
);
const targetSky = review.addressCoverage.rows
  .filter((row) => row.wall === "wall.facade-south.entry-back")
  .reduce((sum, row) => sum + row.skyOpen, 0);
const controlSky = controlCoverage.rows
  .filter((row) => row.wall === "wall.facade-south.entry-back")
  .reduce((sum, row) => sum + row.skyOpen, 0);
const addressControlFailed =
  targetSky !== 0 ||
  controlSky <= targetSky ||
  controlCoverage.unexpected <= review.addressCoverage.unexpected ||
  southControl.unexpected <= review.addressCoverage.unexpected ||
  upperControl.unexpected <= review.addressCoverage.unexpected ||
  pedimentControl.unexpected <= review.addressCoverage.unexpected ||
  pedimentBackControl.unexpected <= review.addressCoverage.unexpected;
console.log(
  `whole-envelope address gate: baseline unexpected ${review.addressCoverage.unexpected}; omitted-end ${controlCoverage.unexpected} (sky ${controlSky}); omitted-south ${southControl.unexpected}; omitted-under-eave upper ${upperControl.unexpected}; omitted-pediment-front ${pedimentControl.unexpected}; omitted-pediment-back ${pedimentBackControl.unexpected}; ${addressControlFailed ? "FAIL" : "PASS"}`,
);
console.log(
  `one-space own facade views: ${review.ownFacades.length} stations; ${ownFacadeFailures(review.ownFacades).length} below 50%`,
);
for (const row of review.ownFacades) {
  console.log(
    `  ${row.id}: ${row.sides.map((side) => `${side.addressSide ? "address" : "opposite"} ${side.visible}/${side.sampled} (${(side.ratio * 100).toFixed(1)}%)`).join("; ")}`,
  );
}
const viewControlEnvironment = {
  ...addressControl.environment,
  boundaries: addressControl.environment.boundaries.filter(
    (boundary) =>
      boundary.id === "boundary-entry.west-end" ||
      boundary.id === "boundary-porch-pediment.front",
  ),
};
const authoredObservations = templeObservations(addressControl.environment);
const occludedWest = authoredObservations.map((observation) =>
  observation.id === "exterior.facade.boundary-entry.west-end"
    ? { ...observation, position: { x: -1.8, y: 2.2, z: 12.2 } }
    : observation,
);
const wrongPedimentFace = occludedWest.map((observation) =>
  observation.id === "exterior.facade.boundary-porch-pediment.front"
    ? { ...observation, position: { x: 0, y: 3.3, z: 9.3 } }
    : observation,
);
const occlusionFailures = ownFacadeFailures(
  ownFacadeViews(viewControlEnvironment, wrongPedimentFace),
);
const ownViewControlFailed =
  !occlusionFailures.includes("boundary-entry.west-end") ||
  !occlusionFailures.includes("boundary-porch-pediment.front");
console.log(
  `own-view negative controls: occluded west-end and wrong-side pediment ${occlusionFailures.join(",")}; ${ownViewControlFailed ? "FAIL" : "PASS"}`,
);
console.log(
  `boundary upper census: ${review.boundaryUpper.length} boundaries; ${review.boundaryUpper.filter((row) => row.tested > 0).length} two-space hosts tested; ${review.boundaryUpper.reduce((sum, row) => sum + row.sampled, 0)} sampled / ${review.boundaryUpper.reduce((sum, row) => sum + row.tested, 0)} adjacent-volume stations; ${review.boundaryUpper.filter((row) => row.exposed > 0).length} unsplit upper bands`,
);
for (const row of review.boundaryUpper)
  console.log(
    `  ${row.id}: ${row.sampled} sampled, ${row.tested} adjacent-volume stations, ${row.exposed} exposed, max band ${f3(row.maxBand)} m${row.maxAt === null ? "" : ` at u=${f3(row.maxAt.u)}, host=${f3(row.maxAt.hostTop)}, sides=${f3(row.maxAt.firstCap)}/${f3(row.maxAt.secondCap)}`}`,
  );
console.log(
  `opening frustum census: ${review.openingFrustum.length} compiled openings; ${review.openingFrustum.filter((row) => row.roomCenterVisible).length} room-facing centers visible; ${review.openingFrustum.filter((row) => row.completeProfileFramed).length} full profiles framed`,
);
for (const row of review.openingFrustum)
  console.log(
    `  ${row.id} (${row.kind}): room ${row.roomCenterVisible ? "center visible" : "center MISSED"}, corners ${row.roomCornersVisible}/4, exterior ${row.exteriorCornersVisible ?? "n/a"}/4, arrival ${row.arrivalCenterVisible ?? "n/a"}; eye ${f3(row.roomPosition.x)},${f3(row.roomPosition.y)},${f3(row.roomPosition.z)} target ${f3(row.roomTarget.x)},${f3(row.roomTarget.y)},${f3(row.roomTarget.z)}`,
  );

console.log(
  "topology ledger (engine inspect/validate + T-junction resolution; open = open edges after resolution):",
);
console.log(
  "  model | contract | parts | verts/welded | tris | degenerate | non-finite | raw open | non-manifold | winding | T-verts | open | components | volume m³ | normals/uvs parts | bounds",
);
for (const { account: a, contract, findings } of review.ledger) {
  const bounds = `${a.bounds.min.map(f3).join(",")} ~ ${a.bounds.max.map(f3).join(",")}`;
  console.log(
    `  ${a.id} | ${contract} | ${a.parts} | ${a.vertices}/${a.weldedVertices} | ${a.triangles} | ${a.degenerate} | ${a.nonFinite} | ${a.boundaryEdges} | ${a.nonManifoldEdges}/${a.resolvedNonManifold} | ${a.windingErrors} | ${a.tJunctionVertices} | ${a.openEdges} | ${a.components} | ${a.volume.toFixed(4)} | ${a.partsWithNormals}/${a.partsWithUvs} of ${a.parts} | ${bounds}${findings.length > 0 ? ` | contract violations: ${findings.join("; ")}` : ""}`,
  );
  if (findings.length > 0)
    for (const d of a.defectSamples)
      console.log(`      ${d.kind} at (${d.at.map(f3).join(", ")})`);
}
console.log(
  `ledger rows violating their contract: ${review.ledger.filter((row) => row.findings.length > 0).length} of ${review.ledger.length}`,
);

console.log(`emitted surface owners: ${review.surfaces.length}`);
for (const { owner, ids } of review.surfaces)
  console.log(
    `  ${owner}: ${ids.map((id) => id.split(".").slice(2).join(".")).join(", ")}`,
  );
const npmCli = [
  process.env.npm_execpath,
  join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
].find((path) => path !== undefined && existsSync(path));
const unit = npmCli
  ? spawnSync(process.execPath, [npmCli, "run", "test"], {
      cwd: join(__dirname, "..", ".."),
      encoding: "utf8",
      windowsHide: true,
    })
  : spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "test"],
      {
        cwd: join(__dirname, "..", ".."),
        encoding: "utf8",
        shell: process.platform === "win32",
        windowsHide: true,
      },
    );
const unitFailure = unit.status === 0 ? 0 : 1;
// Full scene compilation is an integration observation, not a <500ms unit.
const viewerCheck = execFileSync(
  process.execPath,
  ["--import", "tsx", join(__dirname, "check-viewer-scene.cts")],
  {
    cwd: join(__dirname, "..", ".."),
    encoding: "utf8",
    windowsHide: true,
  },
);
console.log(viewerCheck.trim());
const unitSummary = (unit.stdout ?? "")
  .split(/\r?\n/)
  .filter((line) => /^ℹ (?:tests|pass|fail|todo) /.test(line));
console.log(
  `pure unit suite: exit ${unit.status ?? "spawn failure"}; ${unitSummary.join("; ")}`,
);
if (unitFailure)
  console.error((unit.stderr ?? "") + "\n" + (unit.stdout ?? ""));
const failureCount = review.failures + unitFailure + Number(addressControlFailed) + Number(ownViewControlFailed);
console.log(`self-check failures: ${failureCount}`);
process.exitCode = failureCount > 0 ? 1 : 0;
