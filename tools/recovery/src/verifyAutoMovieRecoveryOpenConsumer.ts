import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Exercise the installed open-continuation command without any original mesh.
 * Two saved straight cubics bound a 3 mm by 2 mm plane; the exact graph owns one
 * ordinary pair. This host integration checks physical area and byte authority,
 * not source fit, arbitrary topology or surface-normal continuity.
 *
 * @evidence contracts/common.md#principled-implementation Explicit saved cubic coefficients and one declared graph pair define a planar surface whose independent area is six square millimetres; the installed CLI generates every output triangle.
 * @evidence contracts/common.md#clear-and-simple-design The repository host check owns fixture publication and physical measurements; package code supplies the real command and numerical operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original mesh, copied normals, alias import, global replacement, coordinate adjustment or expected generated triangle list supplies the consumer.
 * @evidence contracts/common.md#meaningful-documentation States the saved-input boundary, dimensional oracle, installed invocation and qualification limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant-size saved curves drive a bounded engine grid; the independent measurement visits every generated vertex and face once.
 * @evidence contracts/performance.md#reuse-equivalent-work One installed command supplies both the geometry and processing report without another reconstruction for measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the external consumer directory and bounded synchronous child runner; this helper closes synchronous file operations and retains only its receipt.
 */
export function verifyAutoMovieRecoveryOpenConsumer(input: {
  consumer: string;
  cli: string;
  sourceEpoch: string;
  run: (command: string, args: string[], cwd: string) => string;
}): { area: number; triangles: number; generatedRuns: number; sourceMeshProvided: false } {
  const curveFile: string = path.join(input.consumer, "outputs", "open-curves.json"),
    graphFile: string = path.join(input.consumer, "outputs", "open-graph.json"),
    output: string = path.join(input.consumer, "outputs", "open-model.json");
  const sections: object[] = [0, 2].map((y: number): object => ({ coordinateMm: y, loops: [] }));
  const curves: Buffer = Buffer.from(JSON.stringify({
    schema: "automovie-recovery-curves-v1", loft: { sections, events: [], chordToleranceMm: 1,
      intervals: [{ beforeMm: 0, afterMm: 2, groups: [] }] },
    reports: [0, 2].map((y: number): object => ({ coordinateMm: y, fits: [], isolatedContactsMm: [], diagnostics: [],
      open: [{ curve: { type: "cubicBezier", name: `open.${y}`, closed: false, unit: "mm", phaseUnit: "mm", phaseIntervals: [3], spans: [[[0,y,0],[1,y,0],[2,y,0],[3,y,0]]] }, sampleMaximumMm: 0, polylineUpperEstimateMm: 0, toleranceMet: true, observationsPerSpan: 2, handleFallbacks: 0 }] })),
    diagnostics: [], topologyGaps: [], unconsumedEvents: [],
    policy: { axis: [0,1,0], reference: [1,0,0], stepMm: 2, toleranceMm: 0.01, chordToleranceMm: 1, maxSections: 8, maxSpans: 8, exactCoordinateAliases: false, sourceOrientationSign: 1, cornerDegrees: 45 },
    summary: { observations: 4, spans: 2, sections: 2, events: 0, aliases: 0 },
  }));
  fs.writeFileSync(curveFile, curves);
  fs.writeFileSync(graphFile, JSON.stringify({ schema: "automovie-recovery-open-continuation-v1", criticalPolicy: "boundary-regular-path-v1", intervals: [{ beforeSection: 0, afterSection: 1, pairs: [{ before: 0, after: 0, reverseAfter: false }], unresolved: [] }], orientations: [[1],[1]], diagnostics: [], resolutionMm: 1, maxVerticesPerRun: 1000, provenance: { curveBundleSha256: createHash("sha256").update(curves).digest("hex") } }));
  input.run(process.execPath, ["--permission", `--allow-fs-read=${input.consumer}`, `--allow-fs-write=${path.join(input.consumer, "outputs")}`, input.cli, "recoveryOpen", "--source-epoch", input.sourceEpoch, "reconstruct", curveFile, graphFile, output], input.consumer);
  const result: { model: { parts: { geometry: { type: string; mesh: { positions: number[]; indices: number[] } } }[] }; openReports: { generatedRuns: number } } = JSON.parse(fs.readFileSync(output, "utf8"));
  let area: number = 0, triangles: number = 0;
  for (const part of result.model.parts) {
    const mesh: (typeof part.geometry)["mesh"] = part.geometry.mesh;
    if (part.geometry.type !== "mesh" || mesh.positions.length % 3 || mesh.indices.length % 3 || !mesh.positions.every(Number.isFinite) || !mesh.indices.every((index: number): boolean => Number.isSafeInteger(index) && index >= 0 && index * 3 + 2 < mesh.positions.length))
      throw new Error("Installed open consumer returned invalid finite indexed geometry");
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const p: number[][] = mesh.indices.slice(i, i + 3).map((index: number): number[] => mesh.positions.slice(index * 3, index * 3 + 3));
      const a: number[] = p[0]!, b: number[] = p[1]!, c: number[] = p[2]!;
      const u: number[] = b.map((value: number, axis: number): number => value - a[axis]!), v: number[] = c.map((value: number, axis: number): number => value - a[axis]!);
      area += Math.hypot(u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!) / 2;
      triangles++;
    }
  }
  if (!Number.isFinite(area) || Math.abs(area - 6e-6) > 1e-12 || !triangles || result.openReports.generatedRuns !== 1)
    throw new Error("Installed ordinary open run did not preserve the independent planar area");
  return { area, triangles, generatedRuns: result.openReports.generatedRuns, sourceMeshProvided: false };
}
