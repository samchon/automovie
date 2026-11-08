import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieLoftWorldJet,
  AutoMovieNativeCoordinate,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";
import { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";

/** Actual wall originals in the torso's common physical planes, with independently requested point and phase capabilities. */
export namespace AutoMovieHumanTorsoWall {
  /** First refused native preparation from this exact call-owned wall; no source is recomputed for diagnostics. */
  export interface IRefusal {
    /** Physical station requested by the actual consumer, calibration mm. */
    readonly station: number;

    /** Requested polar phase; native station preparation may refuse before evaluating it. */
    readonly requestedPhase: number;

    /** The failed call's actual copied extent values; IEEE nonfinite values retain their names. */
    readonly extents: readonly (number | string)[];

    /** The failed call's actual copied shoulder values, dimensionless. */
    readonly shoulders: readonly (number | string)[];
  }

  /** One caller-owned immutable wall; preparing it never lofts a surface. */
  export interface IOutput {
    /** Original support/clock declaration, retained for contributor inspection. */
    readonly part: IAutoMovieViewPart;

    /** Observed failed operands only, without rerunning a section, length or source query. */
    refusal(): IRefusal | undefined;

    /** Same point in common body X/Z, calibration mm. */
    point(station: number, clock: number): [number, number];

    /** Actual phase derivatives, unavailable at the collapsed physical pole. */
    phase(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IPhase | null;

    /** Actual complete physical2, independently unavailable at the real lower pole. */
    jet(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IJet | null;

    /** Original branch correspondence used only at an actual anatomical apex. */
    clock(station: number, z: number, outward: 1 | -1): number;
  }

  /** One station's original numeric values, frame and lazily requested phase reader. */
  interface IStation {
    /** The exact physical station, calibration mm. */
    station: number;

    /** Actual scalar values admitted by the native owner. */
    values: AutoMovieLoftViewRead.IValues;

    /** Original translation in the fixed +X/+Z common basis. */
    origin: [number, number, number];

    /** Point0 preparation performs no derivative work. */
    point: ReturnType<typeof AutoMovieLoftSectionNative.point>;

    /** Requested phase preparation belongs to this station only. */
    phase?: ReturnType<typeof AutoMovieLoftSectionNative.phase>;

    /** Actual physical2 is prepared only when requested. */
    jet?: ReturnType<typeof AutoMovieLoftSectionNative.jet>;
  }

  /** Keep the existing scalar/neck originals and a bounded last-station preparation; no completed mass or parent cut is read. */
  export function create(
    plan: Pick<AutoMovieHumanTorsoPlan.IOutput, "wall" | "domain">,
    sections: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane> =
      AutoMovieHumanTrunkSectionFamily.define(plan.wall),
  ): IOutput {
    const baseline: ReturnType<typeof AutoMovieHumanTrunkViewPart.define> =
      AutoMovieHumanTrunkViewPart.define(
        {
          perineum: plan.wall.perineum,
          sites: plan.wall.sites,
          backProfile: plan.wall.backProfile,
        },
        undefined,
        sections,
      );
    const built: ReturnType<typeof AutoMovieHumanTrunkViewPart.define> =
      baseline;
    if (built.part === null)
      throw new Error(
        "S00 wall originals: " + JSON.stringify(built.diagnostics),
      );

    // The biacromial datum is the lateral crest, not a through-point for a
    // global secant to the much narrower neck. Author its flat C2 crest in
    // the retained source clock. All other copied knot jets, the actual neck
    // boundary and source support remain unchanged; only incident spans change.
    const part: IAutoMovieViewPart = {
      ...built.part,
      side: {
        positive: shoulder(built.part.side.positive),
        negative: shoulder(built.part.side.negative),
      },
    };
    const prepared: ReturnType<typeof AutoMovieLoftViewSource.create> =
      AutoMovieLoftViewSource.create(part);
    if (prepared?.source === null || prepared === null)
      throw new Error(
        "S00 wall source: " + JSON.stringify(prepared?.diagnostics ?? []),
      );
    const source: AutoMovieLoftViewSource.ISource = prepared.source;
    let retained: IStation | undefined;
    let refusal: IRefusal | undefined;

    /** Query admission precedes reuse, so a retained preparation cannot hide an invalid request. */
    const station: (s: number, clock: number) => IStation | null = (
      s: number,
      clock: number,
    ): IStation | null => {
      if (
        !Number.isFinite(s) ||
        s < plan.domain[0] ||
        s > plan.domain[1] ||
        !Number.isFinite(clock)
      )
        throw new Error(
          "S00 query leaves its finite original physical/phase domain",
        );
      if (s === plan.domain[0]) return null;
      if (retained?.station === s) return retained;
      const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
        AutoMovieLoftViewRead.values(source, s);
      if (typeof values === "string") throw new Error(values);
      const frame: ReturnType<typeof part.axis.at> = part.axis.at(s);
      if (
        frame.origin[1] !== s ||
        frame.u.some((v: number, i: number): boolean => v !== [1, 0, 0][i]) ||
        frame.v.some((v: number, i: number): boolean => v !== [0, 0, 1][i])
      )
        throw new Error(
          "S00 wall original must use its declared level +X/+Z common plane",
        );
      let point: IStation["point"];
      try {
        point = AutoMovieLoftSectionNative.point(values);
      } catch (error: unknown) {
        const preserve: (value: number) => number | string = (value: number): number | string => Number.isFinite(value) ? value : String(value);
        refusal ??= { station: s, requestedPhase: clock,
          extents: values.extents.map(preserve), shoulders: values.shoulders.map(preserve) };
        throw error;
      }
      retained = {
        station: s,
        values,
        origin: frame.origin,
        point,
      };
      return retained;
    };
    return {
      part,
      refusal: (): IRefusal | undefined => refusal,
      point(s: number, clock: number): [number, number] {
        const at: IStation | null = station(s, clock);
        if (at === null) return [plan.wall.perineum.x, 0];
        const local: [number, number] = at.point(clock);
        return [at.origin[0] + local[0], at.origin[2] + local[1]];
      },
      phase(
        s: number,
        clock: number,
      ): IAutoMovieConstructionProfileSource.IPhase | null {
        const at: IStation | null = station(s, clock);
        if (at === null) return null;
        at.phase ??= AutoMovieLoftSectionNative.phase(at.values);
        const local: ReturnType<NonNullable<IStation["phase"]>> =
          at.phase(clock);
        return {
          ...local,
          p: [at.origin[0] + local.p[0], at.origin[2] + local.p[1]],
        };
      },
      jet(
        s: number,
        clock: number,
      ): IAutoMovieConstructionProfileSource.IJet | null {
        const at: IStation | null = station(s, clock);
        if (at === null) return null;
        if (at.jet === undefined) {
          const inputs: ReturnType<typeof AutoMovieLoftViewRead.jets> =
            AutoMovieLoftViewRead.jets(source, s);
          if (typeof inputs === "string") throw new Error(inputs);
          at.jet = AutoMovieLoftSectionNative.jet(inputs);
        }
        const frame: ReturnType<
          NonNullable<IAutoMovieViewPart["axis"]["jet"]>
        > = part.axis.jet?.(s) ?? null;
        if (frame === null) return null;
        const world: ReturnType<typeof AutoMovieLoftWorldJet> =
          AutoMovieLoftWorldJet(
            at.jet(clock),
            [frame.value, frame.first, frame.second].map(
              (row: NonNullable<typeof frame>["value"]): number[] => [
                ...row.origin,
                ...row.u,
                ...row.v,
              ],
            ),
          );
        return {
          p: [world.p[0], world.p[2]],
          s: [world.s[0], world.s[2]],
          t: [world.t[0], world.t[2]],
          ss: [world.ss[0], world.ss[2]],
          st: [world.st[0], world.st[2]],
          tt: [world.tt[0], world.tt[2]],
        };
      },
      clock(s: number, z: number, outward: 1 | -1): number {
        const at: IStation | null = station(s, 0);
        if (at === null)
          throw new Error(
            "S00 anatomical apex correspondence is unavailable at its singular pole",
          );
        return AutoMovieNativeCoordinate.locate(
          at.values,
          1,
          outward,
          z - at.origin[2],
        ).phase;
      },
    };
  }
}

/** The explicit lateral crest has zero first/two source-clock derivatives; no unavailable derivative is being substituted. */
function shoulder(
  outline: IAutoMovieViewPart.IOutline,
): IAutoMovieViewPart.IOutline {
  return {
    ...outline,
    knots: outline.knots.map(
      (knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot =>
        knot.site === "acromion"
          ? { ...knot, jet: { first: 0, second: 0 } }
          : knot,
    ),
  };
}
