import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidIntersectionWalk } from "./AutoMovieSolidIntersectionWalk";
import { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import { AutoMovieSolidTraceSolve } from "./AutoMovieSolidTraceSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Original surface jet used by the closure measurement. */
type IJet = IAutoMovieSolidSurface.IJet;
/** The existing public point and its implicit parameter rates. */
type IPoint = AutoMovieSolidIntersection.IPoint;
/** Existing declared parameter kind and angle data. */
type Parameter = AutoMovieSolidIntersection.Parameter;
/** Original public curve with its shared point array and reader. */
type ICurve = AutoMovieSolidIntersection.ICurve;
/** Existing borrowed trace inputs and callbacks. */
type IInput = AutoMovieSolidIntersection.IInput;
/** Existing nullable curve and ordered diagnostics. */
type IResult = AutoMovieSolidIntersection.IResult;
/** Original world-vector norm used by closure observations. */
const { norm }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/**
 * Existing trace orchestration and public host/domain adapters behind the original API.
 *
 * @evidence contracts/common.md#principled-implementation Moves original law/continuation/publication statements while keeping numerical work in TraceSolve and arc preparation in Walk.
 * @evidence contracts/common.md#clear-and-simple-design Owns trace lifecycle and captured curve dependencies separately from the public namespace's data/API declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changes no solver, numeric domain rule, diagnostic, step policy or callback evaluation order.
 * @evidence contracts/common.md#meaningful-documentation Operations document the original input references, failure paths and sampled acceptance limits.
 * @evidence contracts/performance.md#efficient-algorithms Includes solver/substep and optional arc-walk costs rather than treating a trace as a fixed number of cheap solves.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same accepted points and law inside each published reader, without another identity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned curves own their original captured references; local orchestration scratch and failed results add no resource owner.
 */
export namespace AutoMovieSolidIntersectionTrace {
  /**
   * Trace the closed curve from its seed.
   *
   * @param input The two surfaces, the seed, the parameter and the trace's limits.
   * @param walkSteps Original public first-walk step multiplier, unchanged at 64.
   * @param walkPoints Original public reference-point multiplier, unchanged at 4.
   * @param closingSteps Original public secant trial limit, unchanged at 6.
   * @returns The curve and its diagnostics.
   *
   * @evidence contracts/common.md#principled-implementation Uses the original declared-law continuation, closure/domain observations and grazing diagnostics; the same nearest-parameter reader corrects later queries.
   * @evidence contracts/common.md#clear-and-simple-design One operation stages law creation, seed correction, continuation and publication without moving numerical solves into the façade.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains count>=8 admission, tolerances, raw residual limitations and all returned/throwing behavior; finite integral counts and regular callbacks remain premises.
   * @evidence contracts/common.md#meaningful-documentation Explains original callback/points ownership, public step controls and the limits of sampled domain/grazing checks.
   * @evidence contracts/performance.md#efficient-algorithms Stores C traced points; each continuation includes the existing solver and accepted-substep costs, while arc adds the original preparation walks.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned at closure shares the same public points array, surfaces and law; it corrects from the nearest stored parameter without retracing or snapshotting.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The curve retains those original references and traced points for its lifetime; null results retain diagnostics only and no new task/cache is created.
   */
  export function create(
    input: IInput,
    walkSteps: number,
    walkPoints: number,
    closingSteps: number,
  ): IResult {
    /** Read original top-level inputs in the same order before any surface callback. */
    const { part, count, tolerance, grazing }: IInput = input;

    /** Normalize the original host without copying an existing atlas. */
    const host: IAutoMovieSolidAtlas = atlas(input.host);

    /** Borrow the requested parameter or use the original phase default. */
    const parameter: Parameter = input.parameter ?? { kind: "phase" };

    /** Original diagnostic identity for this part/host pair. */
    const producer: string = `solid.intersection.${part.name}.${host.name}`;

    /** Diagnostics in original traversal and grazing-observation order. */
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];

    /** Return the unchanged null-curve failure shape. */
    const report: (contract: string, detail: string) => IResult = (
      contract: string,
      detail: string,
    ): IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { curve: null, diagnostics };
    };
    if (part.period === undefined)
      return report("periodic part", `${part.name} has no periodic phase`);
    if (!(count >= 8))
      return report("trace count", `${count} points per turn, under 8`);

    /** One full parameter turn in radians. */
    const turn: number = 2 * Math.PI;

    // The parameter's law, the seed's parameter and the seed refined at it.

    /** Law selected by the original phase/angle/arc branch. */
    let law: AutoMovieSolidTraceLaw.ILaw;

    /** Original starting parameter for one turn. */
    let t0: number;

    /** Seed corrected by the existing law-specific solve. */
    let first: IPoint | null;
    if (parameter.kind === "arc") {
      /** Arc preparation with the unchanged public step constants. */
      const walked: ReturnType<typeof AutoMovieSolidIntersectionWalk.create> =
        AutoMovieSolidIntersectionWalk.create(
          part,
          host,
          input,
          count,
          tolerance,
          walkSteps,
          walkPoints,
          closingSteps,
        );
      if (typeof walked === "string") return report("traced loop", walked);
      law = walked.law;
      t0 = 0;
      first = AutoMovieSolidTraceSolve.solve(
        part,
        host,
        law,
        0,
        walked.x,
        walked.face,
        tolerance,
      );
    } else {
      /** Original phase/angle law admission result. */
      const made: AutoMovieSolidTraceLaw.ILaw | null =
        AutoMovieSolidTraceLaw.of(parameter);
      if (made === null)
        return report(
          "parameter",
          "the angle parameter's normal and reference are parallel or zero",
        );
      law = made;
      t0 =
        parameter.kind === "phase"
          ? input.seed.phi
          : law.angle(part.jet(input.seed.s, input.seed.phi).p);
      first = AutoMovieSolidTraceSolve.solve(
        part,
        host,
        law,
        t0,
        [input.seed.s, input.seed.phi, input.seed.y, input.seed.theta],
        input.seed.face ?? 0,
        tolerance,
      );
    }
    if (first === null)
      return report(
        "one loop per contact",
        `no meeting near the seed (phi ${input.seed.phi}, s ${input.seed.s}, y ${input.seed.y}, theta ${input.seed.theta})`,
      );

    // Continuation over one turn, each target reached by halving steps.

    /** The same point array later exposed publicly and captured by at. */
    const points: IPoint[] = [first];

    /** Latest accepted point, including the final closure observation. */
    let current: IPoint = first;
    for (let i: number = 1; i <= count; i++) {
      /** Original uniform target over one turn. */
      const target: number = t0 + (turn * i) / count;

      /** Next point returned by the unchanged continuation owner. */
      const next: IPoint | null = AutoMovieSolidTraceSolve.advance(
        part,
        host,
        law,
        current,
        target,
        tolerance,
      );
      if (next === null)
        return report(
          "traced loop",
          `lost at t ${current.t}, toward ${target}`,
        );
      current = next;
      if (i < count) points.push(next);
    }

    // Closure: the same part and host points after one turn, each phase
    // changed by whole periods.

    /** Original starting host face for closure measurements. */
    const home: IAutoMovieSolidSurface = host.faces[first.face]!;

    /** Whether the last point returned to that original face. */
    const same: boolean = current.face === first.face;

    /** Original whole-turn host phase observation. */
    const winding: number =
      home.period === undefined || !same
        ? 0
        : Math.round((current.theta - first.theta) / home.period);

    /** Host phase shift applied to the periodic reader. */
    const shift: number = home.period === undefined ? 0 : winding * home.period;

    /** Original whole-turn part phase observation. */
    const partWinding: number = Math.round(
      (current.phi - first.phi) / part.period,
    );

    /** Part phase shift retained by the same reader. */
    const partShift: number = partWinding * part.period;

    /** Part metric used by the original closure test. */
    const a0: IJet = part.jet(first.s, first.phi);

    /** Host metric at the original starting chart point. */
    const b0: IJet = home.jet(first.y, first.theta);

    /** Original maximum chart displacement measured through local surface speeds. */
    const closed: number = Math.max(
      Math.abs(current.s - first.s) * norm(a0.u),
      Math.abs(current.phi - partShift - first.phi) * norm(a0.v),
      same ? Math.abs(current.y - first.y) * norm(b0.u) : Infinity,
      Math.abs(current.theta - shift - first.theta) * norm(b0.v),
    );
    if (!(closed <= 10 * tolerance))
      return report(
        "one loop per contact",
        `the trace returns ${closed} mm from its start after one turn`,
      );

    // Every traced point inside both surfaces' own ranges: past a chain's
    // end layer the solver extension is not owned surface skin.
    for (const p of points) {
      /** Original ordered part-domain then host-domain observation. */
      const outside: string | null =
        beyond(part, p.s) ?? beyond(host.faces[p.face]!, p.y);
      if (outside !== null)
        return report(
          "inside the layers",
          `at t ${p.t}: ${outside}; build the part far enough to cross its host inside both chains' layers`,
        );
    }

    // Tangential contacts along the loop.
    for (const p of points)
      if (p.angle < grazing)
        diagnostics.push({
          producer,
          level: 6,
          contract: "transversal contact",
          detail: `tangent planes ${p.angle} rad apart at t ${p.t}, under ${grazing}`,
        });

    /** Reader capturing the original points array, law and surfaces. */
    const at: ICurve["at"] = (t: number): IPoint | null => {
      // The nearest traced point by parameter, the loop's own copy of the
      // start closing the turn.

      /** Original whole-turn reduction for a finite real query. */
      const turns: number = Math.floor((t - t0) / turn);

      /** Query on the same base parameter turn. */
      const local: number = t - turns * turn;

      /** Original rounded nearest stored-parameter index. */
      const k: number = Math.round(((local - t0) / turn) * count);

      /** Original stored point or shifted copy used for correction. */
      const from: IPoint =
        k >= count
          ? AutoMovieSolidTraceSolve.shifted(points[0]!, shift, partShift, turn)
          : points[k]!;

      /** Correction result before restoring whole-turn shifts. */
      const p: IPoint | null = AutoMovieSolidTraceSolve.advance(
        part,
        host,
        law,
        from,
        local,
        tolerance,
      );
      return p === null
        ? null
        : AutoMovieSolidTraceSolve.shifted(
            p,
            turns * shift,
            turns * partShift,
            turns * turn,
          );
    };
    return {
      curve: {
        part: part.name,
        host: host.name,
        parameter,
        points,
        winding,
        partWinding,
        at,
      },
      diagnostics,
    };
  }

  /**
   * Where a surface's `u` lies past its declared domain, if it does.
   *
   * @param surface The surface.
   * @param u Its first chart parameter.
   * @returns A description with the numbers, or null inside the domain or without one.
   *
   * @evidence contracts/common.md#principled-implementation Reads the current optional u interval and reports the unchanged inclusive-range predicate's outside value.
   * @evidence contracts/common.md#clear-and-simple-design A scalar domain reader remains separate from numerical continuation and geometric admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the exact comparison/string and borrowed domain reads; adds no clamp, periodic adjustment or tolerance.
   * @evidence contracts/common.md#meaningful-documentation States null for an absent domain or an included u, with the existing numeric description outside.
   * @evidence contracts/performance.md#efficient-algorithms Constant property/scalar work, without reading a surface jet.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Queries the current domain rather than retaining a stale interval.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns null or a string and retains no surface or domain.
   */
  export function beyond(
    surface: IAutoMovieSolidSurface,
    u: number,
  ): string | null {
    /** Current borrowed surface interval, without a cached copy. */
    const d: [number, number] | undefined = surface.domain;
    if (d === undefined || (u >= d[0] && u <= d[1])) return null;
    return `${surface.name}'s u ${u} lies outside its layers ${d[0]} to ${d[1]}`;
  }

  /**
   * A host as an atlas: itself, or a single surface as the atlas of one face
   * whose region is all of its chart.
   *
   * @param host The host.
   * @returns The atlas.
   *
   * @evidence contracts/common.md#principled-implementation Preserves an existing atlas by identity or wraps one surface with the original always-kept/no-neighbour callbacks.
   * @evidence contracts/common.md#clear-and-simple-design One adapter keeps normalization of the public host union beside trace orchestration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no domain or boundary admission; the single-face callbacks remain exactly true/null.
   * @evidence contracts/common.md#meaningful-documentation States identity reuse and the one-face interpretation.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and one fixed-size wrapper for a single surface.
   * @evidence contracts/performance.md#reuse-equivalent-work An atlas input is reused unchanged rather than copied or rebuilt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns a wrapper referencing its original surface; this adapter keeps no global cache.
   */
  export function atlas(
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas,
  ): IAutoMovieSolidAtlas {
    if ("faces" in host) return host;
    return {
      name: host.name,
      faces: [host],
      kept: (): boolean => true,
      across: (): null => null,
    };
  }
}
