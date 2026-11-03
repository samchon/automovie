import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import type { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import { AutoMovieHumanSkeletonChain } from "./AutoMovieHumanSkeletonChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegBones } from "./leg/AutoMovieHumanLegBones";

type Vec3 = AutoMovieHumanSkeletonChain.Vec3;
const { level, RING } = AutoMovieHumanSkeletonChain;

/**
 * The skeleton's legs: each leg's hip, knee and ankle centres placed by
 * AutoMovieHumanLegBones from the trunk's crotch ring and the foot's ankle
 * ring, and the foot's move to the stance.
 */
export namespace AutoMovieHumanSkeletonLeg {
  /** Phases of a leg's end ring. */
  export const LEG_PHASES: number[] = Array.from(
    { length: 256 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 256,
  );

  /** Phases of the thigh's top section, as the leg samples it. */
  export const TOP_PHASES: number = 256;

  /** One leg's bones on the leg prior's line. */
  export interface ILeg {
    /** Hip centre. */
    hip: Vec3;

    /** Knee centre. */
    knee: Vec3;

    /** Ankle centre. */
    ankle: Vec3;

    /** The foot's move from its own frame to the stance, `[x, z]`. */
    shift: [number, number];
  }

  /**
   * A leg's three joint centres, placed at their published definitions by
   * `AutoMovieHumanLegBones`: the hip at Hara's lateral place and under the
   * centre of the thigh's top section (the trunk's crotch ring), the knee on the
   * straight line from the hip to the ankle, and the ankle at the lateral
   * malleolus under the stance.
   *
   * The ring and the foot's ankle ring only locate the hip's forward place and
   * the foot's move to the stance.
   */
  export function leg(
    footed: IAutoMovieHumanBodyCalibration,
    inputs: AutoMovieHumanLegConstruction.IInputs,
    side: "left" | "right",
    ankleHeight: number,
  ): ILeg {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const S: number = footed.stature;
    const prior: AutoMovieHumanLegPrior.IPrior = AutoMovieHumanLegPrior.PRIOR;
    const ankleForward: number =
      (prior.ankle.offset +
        prior.ankle.fat * inputs.fat +
        prior.ankle.muscularity * inputs.muscularity) *
      inputs.scale;
    const foot: IAutoMovieHumanLoftChain = footed.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === `foot.${side}`,
    )!;
    const ankleRing: Vec3[] = AutoMovieHumanLoftChain.ring(
      foot,
      foot.layers[foot.layers.length - 1]!.y,
      LEG_PHASES,
    );
    const crotch: Vec3[] = crotchRing(footed, side);
    const bottom: number = level(ankleRing);
    const length: number = level(crotch) - bottom;

    // The thigh's top section: the crotch ring read about the section centre the
    // leg prior puts beside the ring's own area centre, since the ring is tilted
    // and its projection is not a section.
    const canonical: [number, number][] = crotch.map(
      (p: Vec3): [number, number] => [p[0], sign * p[2]],
    );
    const area: [number, number] =
      AutoMovieHumanPolarSection.measure(canonical).centre;
    const centre: [number, number] = [
      area[0] + prior.ring.forward * length,
      area[1] + prior.ring.lateral * length,
    ];
    let sx: number = 0;
    let sz: number = 0;
    for (let m: number = 0; m < TOP_PHASES; m++) {
      const t: number = (2 * Math.PI * m) / TOP_PHASES;
      const r: number = AutoMovieHumanPolarSection.radius(canonical, centre, t);
      sx += centre[0] + r * Math.cos(t);
      sz += centre[1] + r * Math.sin(t);
    }
    const top: Vec3 = [sx / TOP_PHASES, level(crotch), (sign * sz) / TOP_PHASES];
    const at: [number, number] = AutoMovieHumanPolarSection.measure(
      ankleRing.map((p: Vec3): [number, number] => [p[0], p[2]]),
    ).centre;

    // The three joint centres at their published definitions; the right leg is
    // the left one reflected across the median plane.
    const joints: AutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({
      stature: S,
      scale: inputs.scale,
      ankleHeight,
      medial: AutoMovieHumanFootPrior.PRIOR.malleoli.medial.height,
      hipForward: top[0],
      ankleForward,
    });
    return {
      hip: [joints.hip[0], joints.hip[1], sign * joints.hip[2]],
      knee: [joints.knee[0], joints.knee[1], sign * joints.knee[2]],
      ankle: [joints.ankle[0], joints.ankle[1], sign * joints.ankle[2]],
      shift: [joints.ankle[0] - at[0], sign * joints.ankle[2] - at[1]],
    };
  }

  /** The arc of the trunk's bottom ring that a leg takes. */
  export function crotchRing(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): Vec3[] {
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
    )!;
    const event: IAutoMovieHumanBodyCalibration.IEvent = calibration.events.find(
      (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
        e.parent === "trunk" && e.direction === "down",
    )!;
    const split: IAutoMovieHumanBodyCalibration.ISplit | undefined =
      event.splits.find(
        (s: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
          s.child === `leg.${side}`,
      );
    if (split === undefined)
      throw new Error(`The trunk's bottom ring gives no arc to leg.${side}`);
    return split.arcs.flatMap(([from, to]: [number, number]): Vec3[] => {
      const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
      return AutoMovieHumanLoftChain.ring(
        trunk,
        trunk.layers[0]!.y,
        Array.from(
          { length: RING },
          (_: unknown, i: number): number => from + (span * i) / (RING - 1),
        ),
      );
    });
  }
}