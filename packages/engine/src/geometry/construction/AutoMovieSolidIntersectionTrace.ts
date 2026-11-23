import type {
  IAutoMovieLoftContract,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidIntersectionWalk,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTraceLaw,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidIntersectionWalk } from "./AutoMovieSolidIntersectionWalk";
import { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import type { AutoMovieSolidTraceObservation } from "./AutoMovieSolidTraceObservation";
import { AutoMovieSolidTraceSolve } from "./AutoMovieSolidTraceSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** Original surface jet used by the closure measurement. */
type IJet = IAutoMovieSolidSurface.IJet;
/** The existing public point and its implicit parameter rates. */
type IPoint = IAutoMovieSolidIntersection.IPoint;
/** Existing declared parameter kind and angle data. */
type Parameter = IAutoMovieSolidIntersection.Parameter;
/** Original public curve with its shared point array and reader. */
type ICurve = IAutoMovieSolidIntersection.ICurve;
/** Original world-vector norm used by closure observations. */
const { norm }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/**
 * Existing trace orchestration and public host/domain adapters behind the
 * original API.
 */
export namespace AutoMovieSolidIntersectionTrace {
  /**
   * Trace the closed curve from its seed.
   *
   * @param input The two surfaces, the seed, the parameter and the trace's
   *   limits.
   * @param walkSteps Original public first-walk step multiplier, unchanged at
   *   64.
   * @param walkPoints Original public reference-point multiplier, unchanged at
   *   4.
   * @param closingSteps Original public secant trial limit, unchanged at 6.
   * @returns The curve and its diagnostics.
   */
  export function create(
    input: IAutoMovieSolidIntersection.IInput,
    walkSteps: number,
    walkPoints: number,
    closingSteps: number,
  ): IAutoMovieSolidIntersection.IResult {
    /**
     * Read original top-level inputs in the same order before any surface
     * callback.
     */
    const {
      part,
      count,
      tolerance,
      grazing,
    }: IAutoMovieSolidIntersection.IInput = input;

    /** Normalize the original host without copying an existing atlas. */
    const host: IAutoMovieSolidAtlas = atlas(input.host);

    /** Borrow the requested parameter or use the original phase default. */
    const parameter: Parameter = input.parameter ?? { kind: "phase" };

    /** Original diagnostic identity for this part/host pair. */
    const producer: string = `solid.intersection.${part.name}.${host.name}`;

    /** Diagnostics in original traversal and grazing-observation order. */
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];

    /** Return the unchanged null-curve failure shape. */
    const report: (
      contract: string,
      detail: string,
    ) => IAutoMovieSolidIntersection.IResult = (
      contract: string,
      detail: string,
    ): IAutoMovieSolidIntersection.IResult => {
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
    let law: IAutoMovieSolidTraceLaw.ILaw;

    /** Original starting parameter for one turn. */
    let t0: number;

    /** Seed corrected by the existing law-specific solve. */
    let first: IPoint | null;

    /**
     * The last meeting attempt's refusal, named in the diagnostic when the seed
     * or the trace is lost.
     */
    const attempt: AutoMovieSolidTraceObservation.IState = {
      failure: null,
      trial: null,
      meeting: null,
      step: null,
    };

    /**
     * That refusal as text, where the solver recorded one: its guard, face,
     * chart point, residual and crossings left.
     */
    const refusal: () => string = (): string => {
      const last: AutoMovieSolidTraceObservation.IFailure | null =
        attempt.failure;
      return last === null
        ? ""
        : `: ${last.reason} on host face ${host.faces[last.face]?.name ?? last.face} at [${last.chart.join(", ")}], gap ${last.gap ?? "unread"} mm, crossings left ${last.budget ?? "unread"}`;
    };
    if (parameter.kind === "arc") {
      /** Arc preparation with the unchanged public step constants. */
      const walked: IAutoMovieSolidIntersectionWalk.IWalk | string =
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
        attempt,
      );
    } else {
      /** Original phase/angle law admission result. */
      const made: IAutoMovieSolidTraceLaw.ILaw | null =
        AutoMovieSolidTraceLaw.of(parameter);
      if (made === null)
        return report(
          "parameter",
          "the angle parameter's normal and reference are parallel or zero",
        );
      law = made;
      const seedJet: IJet | null = AutoMovieSolidDomain.jet(
        part,
        input.seed.s,
        input.seed.phi,
      );
      if (seedJet === null)
        return report(
          "one loop per contact",
          "the seed has no owned regular surface chart",
        );
      t0 = parameter.kind === "phase" ? input.seed.phi : law.angle(seedJet.p);
      first = AutoMovieSolidTraceSolve.solve(
        part,
        host,
        law,
        t0,
        [input.seed.s, input.seed.phi, input.seed.y, input.seed.theta],
        input.seed.face ?? 0,
        tolerance,
        attempt,
      );
    }
    if (first === null)
      return report(
        "one loop per contact",
        `no meeting near the seed (phi ${input.seed.phi}, s ${input.seed.s}, y ${input.seed.y}, theta ${input.seed.theta})${refusal()}`,
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
        attempt,
      );
      if (next === null)
        return report(
          "traced loop",
          `lost at t ${current.t}, toward ${target}${refusal()}; from host face ${host.faces[current.face]?.name ?? current.face} at [${[current.s, current.phi, current.y, current.theta].join(", ")}]` +
            (attempt.step === null
              ? ""
              : `, last step ${attempt.step.h}, correction ${attempt.step.distance ?? "none"} mm against ${attempt.step.allowance ?? "none"} mm`),
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
    const a0: IJet | null = AutoMovieSolidDomain.jet(part, first.s, first.phi);

    /** Host metric at the original starting chart point. */
    const b0: IJet | null = AutoMovieSolidDomain.jet(
      home,
      first.y,
      first.theta,
    );
    if (a0 === null || b0 === null)
      return report(
        "regular chart",
        "the original closure metric has no admitted physical2",
      );

    /**
     * Original maximum chart displacement measured through local surface
     * speeds.
     */
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
   * @returns A description with the numbers, or null inside the domain or
   *   without one.
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
