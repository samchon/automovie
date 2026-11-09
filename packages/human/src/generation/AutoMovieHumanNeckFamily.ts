import {
  AutoMovieConstructionNativeProfile,
  AutoMovieLoftSectionNative,
  AutoMovieLoftWorldJet,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanNeckSupport } from "./AutoMovieHumanNeckSupport";
import { AutoMovieHumanNeckPart } from "./AutoMovieHumanNeckPart";
import type { AutoMovieHumanHeadNeckCurves } from "./head/AutoMovieHumanHeadNeckCurves";

/** The actual neck radius/origin/course family, shared across surface ownership boundaries before lofting. */
export namespace AutoMovieHumanNeckFamily {
  /** One named point of the common base course, before either consumer is lofted. */
  export interface ISite {
    /** Original height-control identity; not a display alias. */
    readonly site: string;

    /** Actual material phase in radians. */
    readonly phase: number;

    /** Actual original source point in calibration mm. */
    readonly point: readonly [number, number, number];
  }

  /** One immutable original neck field and its actual nonplanar base course. */
  export interface IOutput {
    /** Original scalar declarations and native frame, without a loft. */
    readonly part: IAutoMovieViewPart;

    /** Same field in body X/Z, independently qualified Point0/phase/physical2. */
    readonly curve: IAutoMovieConstructionProfileSource.ICurve;

    /** Actual source/measurement owner; this is not a new neck calibration. */
    readonly controls: AutoMovieHumanHeadNeckCurves.IOutput;

    /** Explicit additional lower primitives; original control functions and measurements are retained. */
    readonly support: AutoMovieHumanNeckSupport.IOutput;

    /** Actual numerical endpoint/knot/critical range of the original course, not a sampled extrema certificate. */
    readonly courseRange: readonly [number, number];

    /** Actual named base points on this same generating field; side sites are distinct from lateral maximum support. */
    readonly sites: readonly ISite[];

    /** Original periodic base height and its derivatives per native radian. */
    height(phase: number): readonly [number, number, number];

    /** Original oblique normal-neck course height and its actual native-phase derivatives. */
    normalHeight(phase: number): readonly [number, number, number];
  }

  /** Reuse the real calibrated lower neck law without requesting Head C or constructing an independent neck loft. */
  export function create(
    controls: AutoMovieHumanHeadNeckCurves.IOutput,
    lowerSupport: number = controls.radius.knots[0]!.station,
  ): IOutput {
    const support: AutoMovieHumanNeckSupport.IOutput =
      AutoMovieHumanNeckSupport.create(controls, lowerSupport);
    const domain: readonly [number, number] = [
      support.radius.knots[0]!.station,
      controls.band[1],
    ];
    const part: IAutoMovieViewPart = AutoMovieHumanNeckPart.create(
      support.radius, support.centre, controls.extents, controls.lateral, domain,
    );
    const frame: IAutoMovieViewPart["axis"] = part.axis;
    const native: IAutoMovieConstructionProfileSource =
      AutoMovieConstructionNativeProfile(part, {
        material: "neck.skin",
        binding: "neck.skin",
        revisions: {
          source: JSON.stringify({ controls, support }),
          constraints: "original-neck-normal-and-base-course",
          topology: "original-neck-regular-band",
        },
      });
    const local: IAutoMovieConstructionProfileSource.ICurve | undefined =
      native.curves.values().next().value;
    if (local === undefined)
      throw new Error("Actual native neck family did not supply its original");
    const preparedHeight: ReturnType<typeof AutoMovieViewOutline.create> =
      AutoMovieViewOutline.create(controls.height);
    if ("detail" in preparedHeight) throw new Error(preparedHeight.detail);
    const heights: number[] = [
      ...preparedHeight.knots.map(
        (knot: IAutoMovieViewPart.IKnot): number => knot.station,
      ),
      ...AutoMovieViewOutline.criticalStations(preparedHeight),
    ].map((station: number): number => {
      const reading: ReturnType<typeof AutoMovieViewOutline.value> =
        AutoMovieViewOutline.value(preparedHeight, station);
      if (typeof reading === "string") throw new Error(reading);
      return reading;
    });
    const courseRange: readonly [number, number] = [
      Math.min(...heights),
      Math.max(...heights),
    ];
    if (courseRange[0] < domain[0] || courseRange[1] > domain[1])
      throw new Error(
        "Original neck course leaves the actual shared family domain",
      );
    const curve: IAutoMovieConstructionProfileSource.ICurve = {
      domain,
      clock: [0, 2 * Math.PI],
      point(station: number, phase: number): [number, number] {
        const p: [number, number] = local.point(station, phase);
        const at: ReturnType<typeof frame.at> = frame.at(station);
        return [at.origin[0] + p[0], at.origin[2] + p[1]];
      },
      phase(
        station: number,
        phase: number,
      ): IAutoMovieConstructionProfileSource.IPhase | null {
        const p: IAutoMovieConstructionProfileSource.IPhase | null =
          local.phase?.(station, phase) ?? null;
        if (p === null) return null;
        const at: ReturnType<typeof frame.at> = frame.at(station);
        return {
          ...p,
          p: [at.origin[0] + p.p[0], at.origin[2] + p.p[1]],
        };
      },
      jet(
        station: number,
        phase: number,
      ): IAutoMovieConstructionProfileSource.IJet | null {
        const p: IAutoMovieConstructionProfileSource.IJet | null = local.jet(
          station,
          phase,
        );
        const at: ReturnType<NonNullable<typeof frame.jet>> =
          frame.jet?.(station) ?? null;
        if (p === null || at === null) return null;
        const world: ReturnType<typeof AutoMovieLoftWorldJet> =
          AutoMovieLoftWorldJet(
            p,
            [at.value, at.first, at.second].map(
              (row: NonNullable<typeof at>["value"]): number[] => [
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
    };
    const normal: ReturnType<typeof AutoMovieLoftSectionNative.phase> =
      AutoMovieLoftSectionNative.phase({
        extents: [...controls.extents],
        shoulders: [0, 1, 2, 3].map((): number => AutoMovieViewSection.ELLIPSE),
      });
    return {
      part,
      curve,
      controls,
      support,
      courseRange,
      sites: controls.height.knots.map((knot: IAutoMovieViewPart.IKnot): ISite => {
        const phase: number = 2 * Math.PI * (knot.station / controls.baseClock);
        const p: readonly [number, number] = curve.point(knot.value, phase);
        return { site: knot.site, phase, point: [p[0], knot.value, p[1]] };
      }),
      height(phase: number): readonly [number, number, number] {
        if (!Number.isFinite(phase))
          throw new Error("Original neck course requires a finite phase");
        const period: number = 2 * Math.PI;
        const raw: number = phase % period;
        const angle: number = raw < 0 ? raw + period : raw;
        const quarters: number[] = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const quarter: number = quarters.indexOf(angle);
        const clock: number =
          quarter < 0
            ? (controls.baseClock * angle) / period
            : (controls.baseClock * quarter) / 4;
        const reading: ReturnType<typeof AutoMovieViewOutline.at> =
          AutoMovieViewOutline.at(preparedHeight, clock);
        if (typeof reading === "string") throw new Error(reading);
        if (reading.stationJet === null)
          throw new Error(
            "Original neck course has no regular phase derivatives",
          );
        const turn: number = controls.baseClock / period;
        return [
          reading.value,
          reading.stationJet[0] * turn,
          reading.stationJet[1] * turn * turn,
        ];
      },
      normalHeight(phase: number): readonly [number, number, number] {
        const local: ReturnType<typeof normal> = normal(phase);
        const factor: number =
          -controls.slope / (1 + controls.slope * controls.slope);
        return [
          controls.planeOrigin[1] + factor * local.p[0],
          factor * local.t[0],
          factor * local.tt[0],
        ];
      },
    };
  }
}
