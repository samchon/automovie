import { AutoMovieConstructionComposedEnd, AutoMovieConstructionSkinCut } from "@automovie/engine";
import type { AutoMovieVector3Tuple, IAutoMovieConstructionComposedEnd, IAutoMovieSolidSurface } from "@automovie/interface";

import { FamilyConicFit as Fit } from "../../../reference-conics/FamilyConicFit";
import { FamilyConicLoft as Loft } from "../../../reference-conics/FamilyConicLoft";

/**
 * @evidence contracts/development/testing.md#behavioral-verification Equalities and signed physical bounds share a coupled solve. The actual planar skin cut and two regular crossing tangents also own a stock-local physical derivative.
 * @evidence contracts/development/testing.md#independent-expectations The two affine equalities implicit in the squared residuals give x=.8 at y=.25. The impossible interval [.6,.4] has minimum uniform excess .1. The skewed cylinder cut and the two circles' radical line give independent moving point and fork velocities.
 * @evidence contracts/development/testing.md#distinguishing-cases The nested one-sided rows would be linearly dependent if simultaneously forced to their three endpoints. A genuinely contradictory pair remains infeasible. Real circle composition may recover a larger full scope but cannot drop its outline during a later trial. Exact nonlinear stock can admit a smaller extent of one affine direction or refuse its whole sampled tangent.
 * @evidence contracts/development/testing.md#execution-ownership Solves made two-variable and stock-bounded source problems in process with no private geometry.
 */
export function test_human_group_physical_constraints(): void {
  const tolerance = 1e-8;
  // The cut z=0 of S=(cx + lambda*s + R*cos(phi), cy + R*sin(phi), s + gamma*k)
  // has s=-gamma*k and moves by (-lambda*gamma,0,0) at every phase.
  const cut = (field: number): AutoMovieVector3Tuple => {
    const surface: IAutoMovieSolidSurface = {
      name: "skewed original cylinder",
      domain: [-2, 2], orientation: 1,
      jet: (s, phi) => ({
        p: [0.5 * s + 9 * Math.cos(phi), 9 * Math.sin(phi), s + 4 * field],
        u: [0.5, 0, 1], v: [-9 * Math.sin(phi), 9 * Math.cos(phi), 0],
        uu: [0, 0, 0], uv: [0, 0, 0], vv: [-9 * Math.cos(phi), -9 * Math.sin(phi), 0],
      }),
    };
    const made = AutoMovieConstructionSkinCut.create({
      surface, into: 1, stations: [-2, -1, 0, 1, 2], samples: 16,
      planes: [{ point: [0, 0, 0], normal: [0, 0, 1] }],
    });
    if (typeof made === "string") throw new Error(made);
    const phase: number = 1.37;
    return surface.jet(made.at(phase)[0], phase).p;
  };
  const velocity = Fit.planeVelocity([0, 0, 1], [0.5, 0, 1], [0, 0, 4]);
  const step: number = 1 / 32, lead = cut(step), trail = cut(-step);
  if (velocity[0] !== -2 || velocity[1] !== 0 || velocity[2] !== 0 ||
      velocity.some((component, k): boolean => Math.abs(component - (lead[k]! - trail[k]!) / (2 * step)) > tolerance))
    throw new Error("the fixed plane lost the source's physical station contribution");
  const h: number = Math.sqrt(32);
  const fork = Fit.forkVelocity([1, 0, 0], [0, 1, 0], [-h, 7, 0], [-h, -7, 0], velocity, [0, 0, 0]);
  // Circles of radius 9 and separation d have upper fork (midpoint, sqrt(81-d*d/4)).
  if (Math.abs(fork.point[0] + 1) > tolerance || Math.abs(fork.point[1] + 7 / h) > tolerance || fork.point[2] !== 0)
    throw new Error("the actual two-cut fork differential left a circle");
  const refused = (read: () => unknown, detail: string): boolean => {
    try { read(); return false; } catch (error: unknown) {
      return error instanceof Error && error.message.includes(detail);
    }
  };
  if (!refused(() => Fit.planeVelocity([0, 0, 1], [1, 0, 0], [0, 0, 1]), "transverse station differential") ||
      !refused(() => Fit.forkVelocity([1, 0, 0], [0, 1, 0], [0, 1, 0], [0, -1, 0], velocity, [0, 0, 0]),
        "transverse material differential"))
    throw new Error("a tangent source invented a transverse differential");
  const run = (contradict: boolean) => Fit.fitGroup([0, 0],
    (state, derivatives) => {
      const [x, y] = state as readonly [number, number];
      const row = (value: number, a: number, b: number): Fit.IGroupRow => ({
        value, gradient: new Map(derivatives ? [[0, a], [1, b]] : []),
      });
      return Fit.readGroup(state, derivatives, [{ rows: () => ({
        measured: [row(x + y - 1.05, 1, 1), row(2 * x - y - 1.35, 2, -1)],
        incidence: [row(y - 0.25, 0, 1)],
        inside: [row(0.2 - x, -1, 0), row(0.4 - x, -1, 0), row(0.6 - x, -1, 0),
          row(x - (contradict ? 0.4 : 0.9), 1, 0)],
      }) }]);
    }, tolerance, 8);
  const possible = run(false), contradictory = run(true);
  if (typeof possible === "string" || possible.incidence > tolerance ||
      Math.abs(possible.values[0]! - 0.8) > 1e-6 || Math.abs(possible.values[1]! - 0.25) > tolerance ||
      !possible.steps.some((step) => step.phase === "constrained measured fit"))
    throw new Error("the constrained source lost its known full-objective feasible solution: " + JSON.stringify(possible));
  if (typeof contradictory === "string" || Math.abs(contradictory.incidence - 0.1) > tolerance ||
      contradictory.steps.some((step) => step.phase === "constrained measured fit"))
    throw new Error("a contradictory physical interval entered the feasible phase: " + JSON.stringify(contradictory));

  // Relaxing x <= 1/4 with the same slack as x = 1 would propose x = 5/8.
  // The material constraint owns the full quarter bound even in the elastic solve.
  const hardRun = (target: number) => {
    let largestTried: number = 0;
    const fit = Fit.fitGroup([0], (state, derivatives) => {
      const x: number = state[0]!;
      if (!derivatives) largestTried = Math.max(largestTried, x);
      const row = (value: number): Fit.IGroupRow => ({
        value, gradient: new Map(derivatives ? [[0, 1]] : []),
      });
      return Fit.readGroup(state, derivatives, [{ rows: () => ({
        measured: [], incidence: [row(x - target)], inside: [], hard: [row(x - 0.25)],
      }) }]);
    }, tolerance, 3);
    return { fit, largestTried };
  };
  const bounded = hardRun(1), interior = hardRun(0.125);
  if (typeof bounded.fit === "string" || bounded.largestTried >= 0.5 ||
      Math.abs((bounded.fit.steps[0]?.slack ?? Infinity) - 0.75) > tolerance)
    throw new Error("elastic incidence slack bought access to a hard source region");
  if (typeof interior.fit === "string" || interior.fit.incidence > tolerance ||
      Math.abs(interior.fit.values[0]! - 0.125) > tolerance)
    throw new Error("the hard source lost a real feasible interior incidence");

  const circles = (distance: number) => {
    const sections = [0, distance].map((centre, index): IAutoMovieConstructionComposedEnd.ISection => ({
      name: "circle " + index,
      axis: [0, 0, 1],
      at: (phi) => ({ point: [centre + Math.cos(phi), Math.sin(phi), 0],
        first: [-Math.sin(phi), Math.cos(phi), 0], second: [-Math.cos(phi), -Math.sin(phi), 0] }),
    }));
    return AutoMovieConstructionComposedEnd.create({ point: [0, 0, 0], normal: [0, 0, 1], sections, samples: 16 });
  };
  const shape = circles(1.5), apart = circles(2.5);
  if (typeof shape === "string" || typeof apart !== "string")
    throw new Error("the two circles did not distinguish two actual crossings from separation");
  const witness: AutoMovieVector3Tuple = [0, 1.25, 0];
  const evidence = (): { distance: number; sites: string } => {
    let sites: string = "";
    const distance: number = shape.outline.distance(witness, (rows): void => { sites = JSON.stringify(rows); });
    return { distance, sites };
  };
  const observed = evidence(), repeated = evidence();
  if (!Object.is(observed.distance, shape.outline.distance(witness)) || !Object.is(observed.distance, repeated.distance) ||
      observed.sites === "" || observed.sites === "[]" || observed.sites !== repeated.sites ||
      Math.abs(observed.distance - 0.25) > tolerance)
    throw new Error("recording an unchanged actual outline witness changed its distance or branch order");
  // The distance from this fixed host point to either unit circle at d=1.5 is at least hypot(.75,3)-1.
  // The far query therefore creates a physical excess greater than one without needing an exact settled foot.
  const point: AutoMovieVector3Tuple = [0.75, 3, 0];

  const outlineRun = (initial: number, target: number, rail: number, commonAlreadyFeasible: boolean = false) => {
    const lost: number[] = [];
    const result = Fit.fitGroup([initial], (state, derivatives) => {
      const x: number = state[0]!;
      const made = circles(x);
      if (!derivatives && typeof made === "string") lost.push(x);
      const row = (value: number, slope: number): Fit.IGroupRow =>
        ({ value, gradient: new Map(derivatives ? [[0, slope]] : []) });
      const key: string = "fixed oriented plane and ordered circle sources";
      let outline: Fit.IGroupOutline;
      if (typeof made === "string") outline = { kind: "refused", key, detail: made };
      else {
        let right: boolean = false;
        const distance: number = made.outline.distance(point, (sites): void => {
          right = made.outline.pieces[sites[0]!.piece]!.section === 1;
        });
        outline = { kind: "formed", key,
          rows: [row(distance - rail, right ? (x - point[0]) / Math.hypot(x - point[0], point[1]) : 0)] };
      }
      const measured = row(x - target, 1);
      return Fit.readGroup(state, derivatives, [{ rows: () => ({
        measured: commonAlreadyFeasible ? [measured] : [],
        incidence: commonAlreadyFeasible ? [] : [measured],
        inside: [], hard: [row(-x, -1)],
      }) }], outline);
    }, tolerance, 1);
    return { result, lost };
  };
  const preserve = outlineRun(1.5, 4, 10), recover = outlineRun(2.5, 1.5, 0.25);
  if (typeof preserve.result === "string" || !preserve.lost.some((x): boolean => x > 2) ||
      !(preserve.result.values[0]! > 1.5 && preserve.result.values[0]! < 2) || preserve.result.outlineRefusal !== null)
    throw new Error("a smaller residual was accepted after a real outline was lost");
  if (typeof recover.result === "string" || recover.result.outlineRefusal !== null ||
      Math.abs(recover.result.values[0]! - 1.5) > tolerance || !(recover.result.incidence > 1))
    throw new Error("a real outline recovery was rejected when its new physical rows raised the full maximum");
  const recoverFeasibleCommon = outlineRun(2.5, 1.5, 0.25, true).result;
  const remainsUnformed = outlineRun(2.5, 3, 0.25, true).result;
  if (typeof recoverFeasibleCommon === "string" || recoverFeasibleCommon.outlineRefusal !== null ||
      !(recoverFeasibleCommon.values[0]! > 0 && recoverFeasibleCommon.values[0]! < 2) ||
      !(recoverFeasibleCommon.objective < 1 && recoverFeasibleCommon.incidence > 1) ||
      typeof remainsUnformed === "string" || remainsUnformed.outlineRefusal === null)
    throw new Error("feasible common rows could not recover an actual outline or concealed its final refusal");

  const y: number = Math.sqrt(1 - 0.75 ** 2);
  const upper: [number, number] = [0.75, y], lower: [number, number] = [0.75, -y];
  const owners: { child: number; points: [number, number][] }[] = [
    { child: 0, points: [upper, [-1, 0], lower] },
    { child: 1, points: [lower, [2.5, 0], upper] },
  ];
  const reversed = [...owners].reverse().map(({ child, points }) => ({ child, points: [...points].reverse() }));
  for (const [observed, same] of [[owners, true], [reversed, false]] as const) {
    const matched = Fit.directedForks(shape, observed, same);
    if (typeof matched === "string" || matched.length !== 2 ||
        matched.some(({ fork, observed }): boolean =>
          Math.hypot(fork.point[0] - observed[0], fork.point[1] - observed[1], fork.point[2]) > tolerance))
      throw new Error("the directed owner assignment lost an original analytic fork");
  }
  if (typeof Fit.directedForks(shape, [owners[0]!, { ...owners[1]!, child: 0 }], true) !== "string")
    throw new Error("an owner transition without its adjacent section manufactured a physical fork");

  const ring = Loft.measuredRing([[1, 0], [0, 1], [-1, 0], [0, -1]], true);
  if (typeof ring === "string") throw new Error(ring);
  const quadrature = Loft.parentWitnesses(ring, { origin: [4, 5, 6], u: [1, 0, 0], v: [0, 1, 0] });
  const perimeter: number = 4 * Math.SQRT2, turn: number = 2 * Math.PI;
  const phaseA = quadrature.map(({ along }): number => Loft.parentPhase(along, [0, perimeter], [0, turn]));
  const phaseB = quadrature.map(({ along }): number =>
    Loft.parentPhase(along, [0, 0.2 * perimeter, 0.6 * perimeter, perimeter], [0, 0.2 * turn, 0.6 * turn, turn]));
  const score = (phases: readonly number[]): number => quadrature.reduce((sum, witness, i): number => {
    const phase: number = phases[i]!;
    return sum + witness.weight ** 2 * ((4 + Math.cos(phase) - witness.point[0]) ** 2 +
      (5 + Math.sin(phase) - witness.point[1]) ** 2);
  }, 0);
  if (quadrature.length !== 4 || quadrature[0]!.edge !== 0 ||
      quadrature[0]!.point.some((v, i): boolean => v !== [4.5, 5.5, 6][i]) ||
      Math.abs(quadrature[0]!.weight ** 2 - Math.SQRT2) > tolerance ||
      Math.abs(score(phaseA) - score(phaseB)) > tolerance ||
      !refused(() => Loft.parentPhase(1, [0, 1, 1, 2], [0, 1, 2, 3]), "directed inverse"))
    throw new Error("subdividing one native branch changed the fixed observed-world parent measure or admitted an alias");

  const protect = (keep: boolean) => Fit.fitGroup([1.5], (state, derivatives) => {
    const x: number = state[0]!, actual = circles(x);
    if (typeof actual === "string") return actual;
    const row = (value: number, slope: number): Fit.IGroupRow => ({
      value, gradient: new Map(derivatives && slope !== 0 ? [[0, slope]] : []),
    });
    const fork = actual.seams[0]!.forks.find(({ point }): boolean => point[1] > 0)!;
    const [dx, dy] = [fork.point[0] - 0.6, fork.point[1] - 0.8];
    const gap: number = Math.hypot(dx, dy);
    const bound = row(gap - 0.05, gap === 0 ? 0 : (dx / 2 - dy * x / (4 * fork.point[1])) / gap);
    const rail = row(actual.outline.distance([2.6, 0, 0]) - 0.2, -1);
    const outline: Fit.IGroupOutline = { kind: "formed", key: "real oriented two-cut owner", rows: [rail] };
    return Fit.readGroup(state, derivatives, [{ rows: () => ({ measured: [row(dx, 0.5)], incidence: [], inside: [bound] }) }],
      outline, keep ? [{ name: "host outline rail", rows: [rail] }] : []);
  }, tolerance, 1);
  const unguarded = protect(false), guarded = protect(true);
  if (typeof unguarded === "string" || typeof guarded === "string" ||
      !(unguarded.values[0]! < 1.4 && guarded.values[0]! >= 1.4 && guarded.values[0]! < 1.5) ||
      !(unguarded.objective < guarded.objective && guarded.incidence > 0))
    throw new Error("a softer measured fork bought a real already-satisfied host rail or prevented legal stock progress");

  const reads: { width: number; derivatives: boolean }[] = [];
  const staged = Fit.fitGroup([2.5, 1], (state, derivatives) => {
    reads.push({ width: state.length, derivatives });
    const made = circles(state[0]!);
    const row = (value: number, index: number): Fit.IGroupRow =>
      ({ value, gradient: new Map(derivatives ? [[index, 1]] : []) });
    const outline: Fit.IGroupOutline = typeof made === "string"
      ? { kind: "refused", key: "fixed real oriented circle group", detail: made }
      : { kind: "formed", key: "fixed real oriented circle group", rows: [row(-1, 0)] };
    const common = row(state[0]! - 1.5, 0);
    const incidence: Fit.IGroupRow[] = state.length === 1 ? [] : [common, row(state[1]!, 1)];
    return Fit.readGroup(state, derivatives, [{ rows: () => ({ measured: [common], incidence, inside: [] }) }], outline);
  }, tolerance, 1, undefined, undefined, {
    transfer: (point) => point.length === 1 ? null : point.slice(0, 1),
    certify: (point) => ({
      admitted: point.length === 1 && Math.abs(point[0]! - 1.5) <= tolerance && typeof circles(point[0]!) !== "string",
      receipt: [...point],
    }),
  });
  if (typeof staged === "string" || staged.iteration !== 1 || staged.values.length !== 1 ||
      staged.outlineRefusal !== null || staged.seal?.length !== 1 || staged.seal[0] !== staged.values[0] ||
      !reads.some(({ width, derivatives }): boolean => width === 2 && derivatives) ||
      !reads.some(({ width, derivatives }): boolean => width === 1 && !derivatives) ||
      reads.some(({ width, derivatives }): boolean => width === 1 && derivatives))
    throw new Error("recovery did not transfer the same real formed stock under one budget before unnecessary differentiation");

  const rawRun = (initial: number, target: number, radius: number) => {
    const checked: number[] = [], tried: number[] = [];
    const result = Fit.fitGroup([initial], (state, derivatives) => {
      const x: number = state[0]!;
      if (!derivatives) tried.push(x);
      return Fit.readGroup(state, derivatives, [{ rows: () => ({
        measured: [], inside: [], incidence: [{ value: x - target, gradient: new Map(derivatives ? [[0, 1]] : []) }],
        hard: [{ value: x * x - radius * radius, gradient: new Map(derivatives && x !== 0 ? [[0, 2 * x]] : []) }],
      }) }]);
    }, tolerance, 1, undefined, (state) => {
      const x: number = state[0]!;
      checked.push(x);
      return x * x <= radius * radius ? null : "the exact curved stock excludes this extent";
    });
    return { result, checked, tried };
  };
  const scaled = rawRun(0.8, 1.4, 1), tangent = rawRun(0, 0.5, 0);
  if (typeof scaled.result === "string" || scaled.result.steps.length !== 1 ||
      !(scaled.checked[0]! > 1 && scaled.checked[1]! > 0.8 && scaled.checked[1]! < 1) ||
      scaled.tried.length !== 1 || scaled.tried[0] !== scaled.checked[1])
    throw new Error("one affine direction was not screened at its smaller exact stock extent");
  if (typeof tangent.result === "string" || tangent.checked.length < 2 || tangent.tried.length !== 0 ||
      tangent.result.values[0] !== 0)
    throw new Error("an impossible tangent extent was sent to physical geometry");
}
