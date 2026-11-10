import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import type { AutoMovieRecoveryCompactApproximation as C } from "../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import type { AutoMovieRecoveryConicApproximation as P } from "../../../packages/recovery/src/curves/AutoMovieRecoveryConicApproximation";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import { NodeCanvasCamera as V } from "../../../packages/human/src/inspection/NodeCanvasCamera";
import { CompactCurveSource as S } from "./CompactCurveSource";
import type { CompactCurveFit as F } from "./CompactCurveFit";
import type { ConicPaperInput as I } from "./ConicPaperInput";
import { SurfaceQualityData as D } from "./SurfaceQualityData";

/** Exact endpoint-jet postprocessing uses existing source/coefficient bytes; no fit or mesh generation is called. */
export async function SurfaceQualitySeams(): Promise<void> {
  const root: string = path.resolve(process.cwd(), "..");
  const directory: string = path.resolve(process.argv.find((a: string): boolean => a.startsWith("--from="))!.slice(7));
  const receipt: { coefficientPath: string; reports: { roi: string; rows: { key: string; heightMm: number; region: string; quality: string; component: number; supportPhaseFraction: number }[] }[] } = JSON.parse(await fs.readFile(path.join(directory, "receipt.json"), "utf8")) as typeof receipt;
  const fitBytes: Buffer = await fs.readFile(receipt.coefficientPath);
  const fitted: F.Result = JSON.parse(gunzipSync(fitBytes).toString("utf8")) as F.Result;
  const fit: Map<string, F.Record> = new Map(fitted.records.map((r: F.Record): [string, F.Record] => [r.key, r]));
  const indexPath: string = path.join(root, ".references/curves/bezier/f1/index.json");
  const indexBytes: Buffer = await fs.readFile(indexPath);
  const index: { loopColumns: string[]; files: { file: string }[]; sections: { index: number; loops: unknown[][] }[] } = JSON.parse(indexBytes.toString("utf8")) as typeof index;
  const sections: Map<number, (typeof index.sections)[number]> = new Map(index.sections.map((s): [number, typeof s] => [s.index, s]));
  const cache: Map<number, { sections: { index: number; curves: { kind: string; ordinal: number; curve: I.Curve }[] }[] }> = new Map();
  const reports: object[] = [];
  for (const roi of receipt.reports) {
    const rows: D.Row[] = [];
    for (const row of roi.rows) {
      const [section, ordinal]: number[] = row.key.split(":").map(Number);
      const address: unknown[] = sections.get(section!)!.loops.find((l: unknown[]): boolean => l[index.loopColumns.indexOf("kind")] === "closed" && l[index.loopColumns.indexOf("ordinal")] === ordinal)!;
      const file: number = Number(address[index.loopColumns.indexOf("file")]);
      if (!cache.has(file)) cache.set(file, JSON.parse(await fs.readFile(path.join(root, ".references/curves/bezier/f1", index.files[file]!.file), "utf8")) as NonNullable<ReturnType<typeof cache.get>>);
      const curve: I.Curve = cache.get(file)!.sections.find((s: { index: number }): boolean => s.index === section)!.curves.find((c: { kind: string; ordinal: number }): boolean => c.kind === "closed" && c.ordinal === ordinal)!.curve;
      const loop: I.Loop = { key: row.key, section: section!, ordinal: ordinal!, heightMm: row.heightMm, region: row.region, quality: row.quality, component: row.component, above: [], below: [], curve };
      const source: S.Prepared = S.prepare(loop);
      rows.push({ loop, source, pieces: fit.get(row.key)!.result!.pieces, period: source.curve.domain[1], anchor: row.supportPhaseFraction });
    }
    const events: object[] = [];
    const oldAngles: number[] = [], newAngles: number[] = [], speedRatioMismatch: number[] = [];
    let smoothProfileBrokenSurface: number = 0, actualProfileCornerSamples: number = 0;
    for (let i: number = 0; i + 1 < rows.length; ++i) {
      const a: D.Row = rows[i]!, b: D.Row = rows[i + 1]!, h: number = b.loop.heightMm - a.loop.heightMm;
      const phases: number[] = [...new Set([...a.pieces.map((p: C.IPiece): number => p.domain[0] / a.period), ...b.pieces.map((p: C.IPiece): number => p.domain[0] / b.period)])];
      for (const q of phases) for (const candidate of [false, true]) {
        const aa: readonly C.IPiece[] = candidate ? a.pieces : a.source.pieces, bb: readonly C.IPiece[] = candidate ? b.pieces : b.source.pieces;
        const al: P.Point = jet(aa, a.period, q, -1, 1), ar: P.Point = jet(aa, a.period, q, 1, 1), bl: P.Point = jet(bb, b.period, q, -1, 1), br: P.Point = jet(bb, b.period, q, 1, 1);
        const ap: P.Point = jet(aa, a.period, q, 1, 0), bp: P.Point = jet(bb, b.period, q, 1, 0);
        const ds: N.Point = [(bp[0] - ap[0]) / h, 1, (bp[1] - ap[1]) / h];
        const angleA: number = D.angle([al[0], 0, al[1]], [ar[0], 0, ar[1]]), angleB: number = D.angle([bl[0], 0, bl[1]], [br[0], 0, br[1]]);
        const ratioA: number = Math.hypot(...al) / Math.hypot(...ar), ratioB: number = Math.hypot(...bl) / Math.hypot(...br);
        if (candidate) speedRatioMismatch.push(Math.abs(ratioA - ratioB));
        for (const v of [0, 0.25, 0.5, 0.75, 1]) {
          const left: N.Point = V.cross([(1 - v) * al[0] + v * bl[0], 0, (1 - v) * al[1] + v * bl[1]], ds);
          const right: N.Point = V.cross([(1 - v) * ar[0] + v * br[0], 0, (1 - v) * ar[1] + v * br[1]], ds);
          const angle: number = D.angle(left, right);
          (candidate ? newAngles : oldAngles).push(angle);
          if (candidate && angleA < 1e-5 && angleB < 1e-5 && angle > 1e-3) {
            ++smoothProfileBrokenSurface;
            events.push({ lower: a.loop.key, upper: b.loop.key, hMm: h, q, slabV: v, surfaceNormalJumpDegrees: angle, profileAngleA: angleA, profileAngleB: angleB, leftOverRightSpeedA: ratioA, leftOverRightSpeedB: ratioB, endpointDirectionDifferenceDegrees: D.angle([ar[0], 0, ar[1]], [br[0], 0, br[1]]) });
          } else if (candidate && (angleA >= 1e-5 || angleB >= 1e-5)) ++actualProfileCornerSamples;
        }
      }
    }
    events.sort((a: object, b: object): number => (b as { surfaceNormalJumpDegrees: number }).surfaceNormalJumpDegrees - (a as { surfaceNormalJumpDegrees: number }).surfaceNormalJumpDegrees);
    reports.push({ roi: roi.roi, rows: rows.length, sourceSeamNormalJumpDegrees: D.summary(oldAngles), candidateSeamNormalJumpDegrees: D.summary(newAngles), neighboringLeftRightSpeedRatioMismatch: D.summary(speedRatioMismatch), smoothProfileBrokenSurface, actualProfileCornerSamples, witnesses: events.slice(0, 12) });
  }
  const result: object = { schema: "surface-quality-exact-seam-jets-v1", completedUtc: new Date().toISOString(), coefficientSha256: createHash("sha256").update(fitBytes).digest("hex"), indexSha256: createHash("sha256").update(indexBytes).digest("hex"), reports, policy: "Original raw normalized source phase, exact analytic polynomial endpoint jets divided by physical span width and multiplied by original row period. Join lookup uses only 32 machine-epsilon relative phase snapping, not finite differences. Profile angle <1e-5 degrees and surface normal jump >1e-3 degrees are disclosed diagnostic classification thresholds, not visual acceptance criteria. No refit, fairing or mesh generation." };
  await fs.writeFile(path.join(directory, "seam-jets.json"), JSON.stringify(result));
  process.stdout.write(JSON.stringify(result) + "\n");
}

/** Evaluate a literal one-sided polynomial jet; shared endpoint speeds are never replaced by artificial tangents. */
function jet(pieces: readonly C.IPiece[], period: number, q: number, side: -1 | 1, order: 0 | 1): P.Point {
  let t: number = q * period;
  const epsilon: number = 32 * Number.EPSILON * period;
  if (Math.abs(t) <= epsilon) t = side < 0 ? period : 0;
  let index: number = pieces.findIndex((p: C.IPiece): boolean => side < 0 ? t > p.domain[0] + epsilon && t <= p.domain[1] + epsilon : t >= p.domain[0] - epsilon && t < p.domain[1] - epsilon);
  if (index < 0) index = side < 0 ? pieces.length - 1 : 0;
  const p: C.IPiece = pieces[index]!;
  if (p.kind !== "polynomial") throw new Error("Exact source-clock polynomial control only");
  const h: number = p.domain[1] - p.domain[0], u: number = Math.max(0, Math.min(1, (t - p.domain[0]) / h));
  let controls: P.Point[] = p.controls.map((v: P.Point): P.Point => [v[0], v[1]]);
  if (order === 1) controls = controls.slice(1).map((v: P.Point, i: number): P.Point => [(v[0] - controls[i]![0]) * p.degree * period / h, (v[1] - controls[i]![1]) * p.degree * period / h]);
  for (let n: number = controls.length - 1; n > 0; --n) for (let i: number = 0; i < n; ++i) controls[i] = [(1 - u) * controls[i]![0] + u * controls[i + 1]![0], (1 - u) * controls[i]![1] + u * controls[i + 1]![1]];
  return controls[0]!;
}

void SurfaceQualitySeams().catch((error: unknown): void => { process.stderr.write(String(error instanceof Error ? error.stack : error) + "\n"); process.exitCode = 1; });
