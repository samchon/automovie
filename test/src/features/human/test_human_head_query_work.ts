import { AutoMovieHumanNasalConstruction as NasalBridge } from "../../../../packages/human/src/generation/AutoMovieHumanNasalConstruction";
import { AutoMovieHumanHeadNeckPhaseLookup as NeckPhase } from "../../../../packages/human/src/generation/AutoMovieHumanHeadNeckPhaseLookup";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHeadConstruction as H } from "../../../../packages/human/src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadPrior as P } from "../../../../packages/human/src/generation/AutoMovieHumanHeadPrior";
import { AutoMovieHumanLipCornerCap as Lip } from "../../../../packages/human/src/generation/AutoMovieHumanLipCornerCap";
import { AutoMovieHumanMedianWorldY as Median } from "../../../../packages/human/src/generation/AutoMovieHumanMedianWorldY";
import { AutoMovieHumanRadiusEpoch as Epoch } from "../../../../packages/human/src/generation/AutoMovieHumanRadiusEpoch";
import { AutoMovieHumanNaturalSpline as Spline } from "../../../../packages/human/src/lofting/AutoMovieHumanNaturalSpline";
import { nclose } from "../internal/nclose";

/** Observation of the supplied cache dependency without replacing foreign methods. */
interface ITrackedCache {
  /** Actual epoch cache forwarded into the production geometry consumer. */
  cache: Epoch.ICache;
  /** Number of raw-radius requests received through that owned dependency. */
  reads(): number;
  /** Number of actual geometric computations after memoization. */
  computations(): number;
}

/** Count observable cache traffic while preserving the real cache implementation. */
function trackedCache(): ITrackedCache {
  const base: Epoch.ICache = Epoch.create(128);
  let reads: number = 0;
  let computations: number = 0;
  const cache: Epoch.ICache = {
    /** Start the same actual geometry epoch as the caller requests. */
    beginEpoch(): void { base.beginEpoch(); },
    /** Forward the exact query and count only actual geometric evaluations. */
    read(owner: object | undefined, station: number, origin: number, angle: number, guess: number, compute: () => number): number {
      reads++;
      return base.read(owner, station, origin, angle, guess, (): number => { computations++; return compute(); });
    },
    /** Preserve the actual resource-capacity observation. */
    size(): number { return base.size(); },
  };
  return { cache, reads: (): number => reads, computations: (): number => computations };
}

/** Prescribed circular neck field with a shared two-millimetre skin boundary. */
function circle(cache: Epoch.ICache): H.ISurface {
  const prior: P.IPrior = structuredClone(P.PRIOR);
  for (const key of Object.keys(prior.curves) as (keyof P.ICurves)[])
    prior.curves[key] = prior.knots.map((): number => key.startsWith("square") ? -20 : 0);
  prior.tilt = [0, 1, 1, 1];
  prior.face.bumps = [];
  prior.face.philtrum = [0, 1];
  prior.face.fissure = [0, 1];
  const cap: Lip.ICap | Lip.IFailure = Lip.solve(20, 1);
  if ("failure" in cap) throw new Error(cap.detail);
  const plan: H.ILayout = {
    scale: 1, sex: 0, fat: 0, y0: 0, neck: { level: 0, x: 0, radius: 40 },
    menton: 50, stomion: 70, subnasale: 80, tip: 90, nasion: 100, eye: 100, vertex: 200,
    centre: 0, length: 80, breadth: 80, faceHeight: 108, faceWidth: 30, mandibularWidth: 50,
    vault: 0, jaw: 0, brow: 0, noseWidth: 10, noseLead: 0, mouthWidth: 20,
    upperLip: 0, lowerLip: 0, gap: 0, joint: 0,
    left: { place: 20, length: 30, height: 10, seat: 0 },
    right: { place: 20, length: 30, height: 10, seat: 0 },
    station: Spline.create([0, 50, 80, 100, 200], [0, 1, 2, 3, 4]), columella: 0.2, round: 1,
    geometryFindings: [], cranialQueries: new Map(), radiusEpoch: cache,
  };
  const boundary: number[] = new Array<number>(961).fill(2);
  const zeros: number[] = new Array<number>(961).fill(0);
  return { compiled: H.compile(prior), plan, neckLeft: [...boundary], neckRight: [...boundary],
    slopeLeft: [...zeros], slopeRight: [...zeros], riseLeft: [...zeros], riseRight: [...zeros],
    cut: new Map(), skipNose: true, lipCaps: [cap, cap], alarSections: [], withoutAla: true };
}

/**
 * Median queries preserve actual geometry with bounded work and fresh epochs.
 *
 * Scenarios:
 * 1. The production frontAt consumer reads a known circular neck once at z=0.
 * 2. Adjacent nonzero lateral rays retain their physical circle intersections.
 * 3. Signed boundary changes remain downstream of the shared raw-radius cache.
 * 4. Tilted world-Y callbacks retain known geometry and bounded nonconvergence.
 * 5. Actual H.radius reuses an exact query and observes changed geometry after reset.
 * 6. No-jaw/new-jaw scopes, exact angles/guesses, eviction and nonfinite results remain distinct.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls production H.frontAt on a prescribed ISurface and counts requests through its owned Epoch.ICache dependency. The old median angular inverse exceeds twelve radius reads while the new direct median requires one. The nonmedian circle must retain its physical intersection with positive work below the former 30 reads. Numerical intersections, downstream skin changes, failed convergence and stale-epoch control distinguish correct reuse from caching the wrong point or geometry.
 * @evidence contracts/testing.md#independent-expectations A 40 mm circular base plus its shared 2 mm boundary has forward intersection sqrt(42 squared minus z squared). Tilted callback expectations solve the independently prescribed linear world-Y equation. The median work bound is the existing twelve station corrections. On a level circle the old one initial point plus 28 angular samples plus one final point costs 30 reads; the accelerated nonmedian query must use fewer, while answering the independently prescribed circle intersection. These are operation counts, not elapsed-time thresholds. Floating comparisons retain the existing 1e-6 world-Y criterion; unit radial accuracy uses 1e-5, tighter than the head allowance. No expected value is read from solved head dimensions.
 * @evidence contracts/testing.md#distinguishing-cases Separates exact median and adjacent positive/negative rays, zero and tilted neck frames, signed boundary changes, bounded nonconvergence, immutable owner identities, exact angle/guess keys, epoch reset, resource eviction and nonfinite outputs. Existing back-body tests own cardinal semiaxes; identity/landmark tests own dimension closure and anatomical sites. Full-person anatomy, CPU observation and renders own jaw/BVH composition and private rebuild-to-epoch wiring, which this test does not invoke.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous CPU unit test reached by --include human_head_query_work. It constructs local analytic fields and callbacks, calls H.frontAt/H.radius without apply/calibrate/person generation, and starts no native consumer, process, GPU or viewer. Its forwarding cache is fixture-owned input; it replaces no global or foreign method.
 */
export function test_human_head_query_work(): void {
  /** Preserve every local contract failure until all cases have been observed. */
  const failures: string[] = [];
  /** Record actual observed behavior without hiding later cases. */
  const check: (name: string, condition: boolean) => void = (name: string, condition: boolean): void => { if (!condition) failures.push(name); };
  const observed: ITrackedCache = trackedCache();
  observed.cache.beginEpoch();
  const surface: H.ISurface = circle(observed.cache);
  const x: number = H.frontAt(surface, 0, 0);
  check("actual median circle intersection", nclose(x, 42, 1e-5));
  check("actual median consumer has one raw-radius request", observed.reads() === 1 && observed.computations() === 1);
  check("repeat median retains the same actual geometry", nclose(H.frontAt(surface, 0, -0), 42, 1e-5) && observed.computations() === 1);
  for (const z of [1, -1]) {
    const before: number = observed.reads();
    check("nonmedian keeps its physical circle root", nclose(H.frontAt(surface, 0, z), Math.sqrt(42 ** 2 - z ** 2), 1e-5));
    check("nonzero lateral ray accelerates the physical inverse", observed.reads() - before > 0 && observed.reads() - before < 30);
  }
  const baseComputations: number = observed.computations();
  surface.neckLeft.fill(4);
  surface.neckRight.fill(4);
  check("signed boundary is composed after cached base", nclose(H.frontAt(surface, 0, 0), 44, 1e-5) && observed.computations() === baseComputations);

  let calls: number = 0;
  const tilt: number = Math.PI / 9;
  const result: Median.IReading = Median.solve(30, (station: number): [number, number, number] => {
    calls++;
    const physical: number = 47 + 0.07 * station;
    return [physical * Math.cos(tilt), station + physical * Math.sin(tilt) + 0.7, 0];
  });
  const station: number = (30 - 0.7 - 47 * Math.sin(tilt)) / (1 + 0.07 * Math.sin(tilt));
  check("tilted neck keeps world-Y and physical forward coordinate", result.converged && nclose(result.point[1], 30, 1e-6) && nclose(result.point[0], (47 + 0.07 * station) * Math.cos(tilt), 1e-6));
  check("median callback work remains bounded", calls === result.evaluations && calls <= 12);
  const failed: Median.IReading = Median.solve(1, (s: number): [number, number, number] => [0, 2 * s + 1, 0]);
  check("nonconverging world-Y is visibly bounded", !failed.converged && failed.evaluations === 12);

  const epoch: ITrackedCache = trackedCache();
  epoch.cache.beginEpoch();
  const section: H.ISection = { t: 3, tilt: 0, axis: 0, front: 90, back: -80, width: 40, waist: 20, face: 30, shield: 0, powerBack: 2, powerFace: 2, station: 0, radiusEpoch: epoch.cache };
  check("actual radius is computed once for an exact key", nclose(H.radius(section, 0, Math.PI / 2), 40, 1e-5) && nclose(H.radius(section, 0, Math.PI / 2), 40, 1e-5) && epoch.computations() === 1);
  section.width = 50;
  check("deliberately stale no-reset control is red", !nclose(H.radius(section, 0, Math.PI / 2), 50, 1e-5));
  epoch.cache.beginEpoch();
  check("epoch reset exposes the changed actual radius", nclose(H.radius(section, 0, Math.PI / 2), 50, 1e-5) && epoch.computations() === 2);

  const keys: Epoch.ICache = Epoch.create(2);
  let evaluations: number = 0;
  const owner: object = {};
  /** Count real noncached computations under exact source keys. */
  const compute: () => number = (): number => { evaluations++; return evaluations; };
  const first: number = keys.read(undefined, 0, 0, 0, 0, compute);
  check("identical raw key reuses the actual result", keys.read(undefined, 0, 0, 0, 0, compute) === first && evaluations === 1);
  keys.read(owner, 0, 0, 0, 0, compute);
  keys.read(owner, 0, 0, Number.EPSILON, 0, compute);
  keys.read(owner, 0, 0, Number.EPSILON, 1, compute);
  check("construction owner and exact angle/guess do not alias", evaluations === 4 && keys.size() <= 2);
  keys.read(owner, 0, 0, 0, 0, (): number => { evaluations++; return NaN; });
  keys.read(owner, 0, 0, 0, 0, (): number => { evaluations++; return NaN; });
  check("nonfinite generated values remain observable", evaluations === 6);
  assertBridgeWork(failures);
  assertNeckPhaseWork(failures);
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** Runtime profile queries do not materialize the primitive observer's mesh. */
function assertBridgeWork(findings: string[]): void {
  let calls: number = 0;
  /** Independent analytic frontal foundation, counting its real consumption. */
  const face: (y: number, z: number) => number = (y: number, z: number): number => {
    calls++;
    return 10 + (y - 100) ** 2 / 400 + z * z / 1000;
  };
  const input: NasalBridge.BridgeInputs = {
    root: 100, join: 77.5, tip: 50, halfWidth: 18,
    jet: { value: 12, first: -0.2, second: 0.01 },
    profile: (y: number): number => 12 - 0.2 * (y - 77.5) + 0.005 * (y - 77.5) ** 2,
    width: (): number => 8, face, boneJoint: [0, 100, 0], normal: [1, 0, 0],
  };
  const evaluator: NasalBridge.BridgeEvaluator = NasalBridge.evaluateBridge(input);
  if (calls !== 0) findings.push(`runtime profile consumed ${calls} unused foundation queries`);
  if (evaluator.height(input.root, 0) !== 0 || Math.abs(evaluator.height(input.join, 0) - 12) > 1e-12)
    findings.push("runtime profile lost its prescribed endpoint values");
  const mesh: NasalBridge.Mesh = NasalBridge.bridge(input).mesh;
  if (calls !== 65 * 33 || mesh.points.length !== 65 * 33 || mesh.triangles.length !== 64 * 32 * 2)
    findings.push("requested bridge mesh changed resolution or materialization work");
  let error: number = 0;
  for (let row: number = 0; row <= 64; row++) for (let column: number = 0; column <= 32; column++) {
    const y: number = 50 + 50 * row / 64;
    const z: number = 18 * (2 * column / 32 - 1);
    const point: NasalBridge.Point = mesh.points[row * 33 + column]!;
    const foundation: number = 10 + (y - 100) ** 2 / 400 + z * z / 1000;
    error = Math.max(error, Math.hypot(point[0] - foundation - evaluator.height(y, z), point[1] - y, point[2] - z));
  }
  if (error > 1e-12) findings.push(`requested bridge mesh no longer consumes the runtime law: ${error}`);
}

/** Original physical vertex selection survives a bounded sorted phase search. */
function assertNeckPhaseWork(findings: string[]): void {
  const count: number = 720;
  const ring: NeckPhase.IPoint[] = Array.from({ length: count }, (_: unknown, i: number): NeckPhase.IPoint => {
    const angle: number = 2 * Math.PI * i / count;
    return [20 + 50 * Math.cos(angle), 1500 + 3 * Math.sin(2 * angle), 50 * Math.sin(angle)];
  });
  const lookup: NeckPhase.IPrepared = NeckPhase.prepare(ring, 20);
  for (let i: number = 0; i < count; i++) {
    const theta: number = Math.atan2(ring[i]![2], ring[i]![0] - 20);
    const reading: NeckPhase.IReading = lookup.nearest(theta);
    if (reading.index !== i) findings.push(`neck source vertex moved at ${i}: ${reading.index}`);
    // A 720-ray circle has phase separation 2pi/720. Only two nearest
    // physical phases can enter this numerical broad phase; the two initial
    // seeds plus both final candidates require at most four comparisons.
    // Six also includes duplicate periodic seeds at the +/-pi boundary.
    if (reading.comparisons > 6) findings.push(`neck lookup scanned unrelated phases at ${i}: ${reading.comparisons}`);
  }
  const tied: NeckPhase.IPoint[] = [[2, 11, 0], [2, 99, 0], [0, 3, 2], [-2, 4, 0], [0, 5, -2]];
  if (NeckPhase.prepare(tied, 0).nearest(0).index !== 0) findings.push("coincident source phases lost original vertex priority");
}
