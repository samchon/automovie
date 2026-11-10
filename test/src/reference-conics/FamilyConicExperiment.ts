import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain } from "../../../packages/engine/src/geometry/construction/AutoMovieLoftChain";
import { AutoMovieViewAxis } from "../../../packages/engine/src/geometry/construction/AutoMovieViewAxis";
import { AutoMovieNaturalSpline as S } from "../../../packages/engine/src/geometry/construction/AutoMovieNaturalSpline";
import type { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";
import { AutoMovieViewLoft as L } from "../../../packages/engine/src/geometry/construction/AutoMovieViewLoft";
import type { IAutoMovieViewPart as V } from "../../../packages/engine/src/geometry/construction/IAutoMovieViewPart";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { PartConicGeometry as G } from "./PartConicGeometry";
import { PartConicInput as I } from "./PartConicInput";
import { PartConicRender as R } from "./PartConicRender";
import type { PartConicTypes as T } from "./PartConicTypes";

/**
 * Shared-knot least-squares conic families on the two representative limb
 * shafts of the earlier part study, regenerated through the engine's actual
 * view loft from the stored knot values alone.
 *
 * For each part every combination of conics per quarter and shared knot count
 * is fitted; the smallest definition whose sampled error on both the fitting
 * and the withheld sections stays inside the target is regenerated, measured
 * against the native cuts and rendered beside them.
 */
namespace FamilyConicExperiment {
  /** Sampled position target of campaign 1, mm. */
  const TARGET_MM: number = 0.5;

  /** Least distance between two station knots, mm: three observed 4 mm sections. */
  const GAP_MM: number = 12;

  /** One fitted candidate's summary row; `pieces` is the quarter split depth. */
  interface ICandidate {
    pieces: number;
    knots: number;
    scalars: number;
    trainMaxMm: number;
    trainMeanMm: number;
    heldMaxMm: number;
    heldMeanMm: number;
    chordMaxMm: number;
    iterations: number;
    folds: number;
    fault: string | null;
    milliseconds: number;
  }

  /** Run the study and write its receipt. */
  export async function main(): Promise<void> {
    const started: number = performance.now();
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-study", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const log = (event: string, detail: object): void => void process.stdout.write(JSON.stringify({ event, ...detail, elapsedMs: Math.round(performance.now() - started) }) + "\n");
    const input: T.Input = await I.load(root);
    const receipt: unknown[] = [];
    for (const part of input.parts) {
      const rows: F.IRow[] = part.rows.map((row: T.Row): F.IRow => ({ s: row.s, points: row.points as C.P[], heldout: row.heldout }));
      const candidates: ICandidate[] = [];
      const kept: Map<string, F.IResult> = new Map();
      // Each depth starts from the previous depth's coarsest family, cut exactly one split deeper, and grows its knot vector where the worst fitting section stands.
      let coarse: F.IResult | null = null;
      for (const pieces of [0, 1, 2]) {
        let knots: number[] = [part.domain[0], (part.domain[0] + part.domain[1]) / 2, part.domain[1]];
        let initial: number[][] | undefined = coarse === null ? undefined : F.deepen(coarse.values, pieces - 1);
        for (;;) {
          const result: F.IResult = F.fit(rows, knots, pieces, 4, initial);
          const count: number = knots.length;
          const row: ICandidate = { pieces, knots: count, scalars: count * (1 + C.count(pieces)), trainMaxMm: result.training.maximumMm, trainMeanMm: result.training.meanMm, heldMaxMm: result.heldout.maximumMm, heldMeanMm: result.heldout.meanMm, chordMaxMm: result.chordMaximumMm, iterations: result.iterations, folds: result.folds, fault: result.fault, milliseconds: Math.round(result.milliseconds) };
          candidates.push(row);
          kept.set(pieces + ":" + count, result);
          log("family-conic-candidate", { part: part.name, ...row, knotsMm: knots.map((s: number): number => Math.round(s)).join(",") });
          if (count === 3) coarse = result;
          if (result.fault !== null || count >= 14 || Math.max(result.training.maximumMm, result.heldout.maximumMm) <= 0.9 * TARGET_MM) {
            log("family-conic-rows", { part: part.name, pieces, rows: result.rows.map((r: F.IResult["rows"][number]): string => r.s.toFixed(0) + (r.heldout ? "h" : "t") + ":" + r.maximumMm.toFixed(2) + "@" + ((r.phase * 180) / Math.PI).toFixed(0) + (r.fault === null ? "" : "!" + r.fault)).join(" ") });
            break;
          }

          // Put the new knot at the worst fitting section that stands at least GAP_MM from every knot: a closer knot has no observed section of its own, and an error that survives it is a crease the station splines are not meant to follow.
          const open: F.IResult["rows"] = result.rows.filter((r: F.IResult["rows"][number]): boolean => !r.heldout && knots.every((s: number): boolean => Math.abs(s - r.s) >= GAP_MM));
          if (open.length === 0) break;
          const at: number = open.reduce((a, b) => (b.maximumMm > a.maximumMm ? b : a)).s;
          const next: number[] = [...knots, at].sort((a: number, b: number): number => a - b);
          initial = F.resample(result.values, knots, next);
          knots = next;
        }
      }

      // The smallest definition inside the target on fitting and withheld sections alike.
      const passing: ICandidate[] = candidates.filter((c: ICandidate): boolean => c.fault === null && c.trainMaxMm <= TARGET_MM && c.heldMaxMm <= TARGET_MM).sort((a: ICandidate, b: ICandidate): number => a.scalars - b.scalars);
      const chosen: ICandidate | undefined = passing[0];
      const native: G.Scene = G.nativeGrid(part);
      const subjects: R.Subject[] = [{ name: "native-reference", mesh: G.reference(part, input.mesh), curves: native.curves }, { name: native.name, mesh: native.mesh, curves: native.curves }];
      let engine: unknown = null;
      if (chosen !== undefined) {
        const fitted: F.IResult = kept.get(chosen.pieces + ":" + chosen.knots)!;
        const stored: string = JSON.stringify({ name: part.name, origin: part.origin, u: part.u, v: part.v, depth: fitted.depth, knots: fitted.knots.map(round), values: fitted.values.map((field: number[], f: number): number[] => field.map(f >= 8 ? round5 : round)) });
        await fs.writeFile(path.join(out, part.name + ".family.json"), stored);

        // Regenerate from the rounded stored text alone, through the engine's actual view loft.
        const loft: L.IResult = create(JSON.parse(stored) as IStored, part.rows.map((row: T.Row): number => row.s));
        if (loft.chain === null) engine = { fault: loft.diagnostics };
        else {
          const chain: NonNullable<L.IResult["chain"]> = loft.chain;
          const scene: G.Scene = G.grid(part, "family-conic-" + 4 * 2 ** chosen.pieces + "-k" + chosen.knots, (s: number, phi: number): T.V => AutoMovieLoftChain.point(chain, s, phi));
          subjects.push(scene);
          let maximum: number = 0;
          let heldMaximum: number = 0;
          let sum: number = 0;
          let n: number = 0;
          let phaseSlip: number = 0;
          part.rows.forEach((row: T.Row): void => {
            // Read the engine surface on the ray of every native cut vertex, in the section chart.
            for (const vertex of row.points) {
              const phi: number = Math.atan2(vertex[1], vertex[0]);
              const p: T.V = AutoMovieLoftChain.point(chain, row.s, phi);
              const d: T.V = I.sub(p, [part.origin[0] + part.n[0] * row.s, part.origin[1] + part.n[1] * row.s, part.origin[2] + part.n[2] * row.s]);
              const a: number = I.dot(d, part.u);
              const b: number = I.dot(d, part.v);
              phaseSlip = Math.max(phaseSlip, Math.abs(Math.atan2(Math.sin(Math.atan2(b, a) - phi), Math.cos(Math.atan2(b, a) - phi))));
              const e: number = Math.abs(Math.hypot(a, b) - Math.hypot(vertex[0], vertex[1]));
              maximum = Math.max(maximum, e);
              if (row.heldout) heldMaximum = Math.max(heldMaximum, e);
              sum += e;
              ++n;
            }
          });
          engine = { storedBytes: Buffer.byteLength(stored), engineMaxMm: maximum, engineHeldoutMaxMm: heldMaximum, engineMeanMm: sum / n, enginePhaseSlipRadians: phaseSlip, quality: G.quality(part, scene, native), diagnostics: loft.diagnostics };
        }
        log("family-conic-engine", { part: part.name, chosen, engine });
      }
      const render: unknown = await R.run(out, part.name, native, subjects);
      receipt.push({ part: part.name, family: part.family, domainMm: part.domain, trainingPlanes: rows.filter((r: F.IRow): boolean => !r.heldout).length, heldoutPlanes: rows.filter((r: F.IRow): boolean => r.heldout).length, candidates, chosen: chosen ?? null, engine, render });
      await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "f1-family-conic-study-v1", targetMm: TARGET_MM, sourceIdentities: input.identities, parts: receipt, milliseconds: performance.now() - started }, null, 2));
    }
    log("family-conic-complete", { out });
  }

  /** A stored family: the frame, the shared knots and every field's knot values. */
  interface IStored {
    name: string;
    origin: T.V;
    u: T.V;
    v: T.V;
    depth: number;
    knots: number[];
    values: number[][];
  }

  /**
   * Build the engine's view part from stored knot values and loft it.
   *
   * The supports and touch offsets go to the engine as the stored sparse
   * knots. The engine's split points, tangent angles and shoulders are not
   * stored: they are evaluated from the stored shares at every requested
   * station through `FamilyConicSection.input`, the same function the fit
   * used, and handed over as derived dense outlines.
   */
  function create(stored: IStored, stations: number[]): L.IResult {
    const sparse = (f: number): V.IOutline => ({ knots: stored.knots.map((station: number, m: number): V.IKnot => ({ site: "k" + m, station, value: stored.values[f]![m]! })) });
    const splines: S.ISpline[] = stored.values.map((field: number[]): S.ISpline => S.create(stored.knots, field));
    const sections: Q.IInput[] = stations.map((s: number): Q.IInput => C.input(splines.map((spline: S.ISpline): number => S.evaluate(spline, s)), stored.depth));
    const dense = (read: (input: Q.IInput) => number): V.IOutline => ({ knots: stations.map((station: number, i: number): V.IKnot => ({ site: "d" + i, station, value: read(sections[i]!) })) });
    const arcs: number = 2 ** stored.depth;
    const quarters = <X>(make: (q: number) => X): V.IQuarters<X> => [make(0), make(1), make(2), make(3)];
    const split = (q: number, j: number): V.ISplit => {
      const at: number = q * arcs + j;

      // Quarter q's tangents turn from its first guide's direction, (q + 1) pi / 2, by less than a quarter turn; one branch keeps the angle continuous along the station.
      const angle = (input: Q.IInput): number => {
        let value: number = Math.atan2(input.tangents[at]![1], input.tangents[at]![0]);
        while (value < ((q + 1) * Math.PI) / 2 - 1e-9) value += 2 * Math.PI;
        return value;
      };
      return { u: dense((input: Q.IInput): number => input.points[at]![0]), v: dense((input: Q.IInput): number => input.points[at]![1]), angle: dense(angle), shoulder: dense((input: Q.IInput): number => input.shoulders[at]!) };
    };
    const part: V = {
      name: stored.name,
      axis: AutoMovieViewAxis.straight(stored.origin, stored.u, stored.v),
      stations,
      front: { positive: sparse(0), negative: sparse(1) },
      side: { positive: sparse(2), negative: sparse(3) },
      fullness: { kind: "top", shoulders: quarters((q: number): V.IOutline => dense((input: Q.IInput): number => input.shoulders[q * arcs]!)), touch: quarters((q: number): V.IOutline => sparse(4 + q)), ...(arcs > 1 ? { pieces: quarters((q: number): V.ISplit[] => Array.from({ length: arcs - 1 }, (_: unknown, j: number): V.ISplit => split(q, j + 1))) } : {}) },
      order: 32,
      samples: 128,
    };
    return L.create(part);
  }

  /** Round a length to a hundredth of a millimetre, the stored precision. */
  function round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /** Round a dimensionless share or an angle to five decimals, the stored precision. */
  function round5(value: number): number {
    return Math.round(value * 1e5) / 1e5;
  }
}
void FamilyConicExperiment.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
