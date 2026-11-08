import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanTrunkJointDatums } from "../trunk/AutoMovieHumanTrunkJointDatums";
import { AutoMovieHumanTrunkSpecLandmarks } from "../trunk/AutoMovieHumanTrunkSpecLandmarks";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The Frankfort head frame placed relative to the trunk's ISB thorax frame
 * (`f1_trunk`'s `AutoMovieHumanTrunkJointDatums`, origin IJ, axes parallel to
 * the world at neutral), until the neck-base spec supplies the neck port.
 *
 * - Height: the tragia stand the tragion-vertex height below the stature
 *   (`AutoMovieHumanHeadFrankfort`, ANSUR II line), read in the thorax frame
 *   from IJ's suprasternale height.
 * - Forward place: the craniovertebral angle, the angle above the horizontal
 *   of the line from the C7 spinous process to the tragus in standing, puts
 *   the tragion `(tragion height - cervicale height) / tan(CVA)` ahead of C7.
 *   Women 50.07 (SD 6.63) degrees, men 47.46 (6.71), 122 healthy adults
 *   (Applied Sciences 14:8639, 2024, doi 10.3390/app14198639; abstract read).
 *   The tragus stands for the tragion: a declared convention.
 * - Orientation: FH level, the head frame's axes parallel to the thorax's
 *   (the standing FH inclination is an input gap).
 * - Lateral place: on the midsagittal plane.
 * C7 is the trunk's own landmark (`AutoMovieHumanTrunkSpecLandmarks`).
 */
export namespace AutoMovieHumanHeadPlacement {
  /** Craniovertebral angle in standing, degrees: women, men. */
  export const CRANIOVERTEBRAL: { female: number; male: number } = { female: 50.07, male: 47.46 };

  /** The placement and the datums it read. */
  export interface IOutput {
    /** The head frame, parent `thorax`. */
    frame: AutoMovieHumanArmCurveSpec.ISegmentFrame;

    /** C7 in the thorax frame, mm. */
    c7: Vec3;

    /** Tragion height above the floor, mm. */
    tragion: number;

    /** Tragion ahead of C7 along X, mm. */
    forward: number;
  }

  /** Place the head frame in the thorax frame. */
  export function create(trunk: AutoMovieHumanTrunkJointDatums.IOutput, head: AutoMovieHumanHeadFrankfort.IOutput, stature: number, female: boolean): IOutput {
    const c7: Vec3 = AutoMovieHumanTrunkSpecLandmarks.get(trunk.landmarks, "C7").point;
    const tragion: number = stature - head.points.v[1];
    const cervicale: number = trunk.frames.heights.cervicale;
    const ij: number = trunk.frames.heights.suprasternale;
    // f1 first (owner, 2026-11-08 13:1x): her own craniovertebral angle (`AutoMovieHumanHeadF1Lines.CRANIOVERTEBRAL`, read by its definition). Later algorithmization: the person's posture input, else the sex's mean `CRANIOVERTEBRAL`.
    const angle: number = (AutoMovieHumanHeadF1Lines.CRANIOVERTEBRAL * Math.PI) / 180;
    const mean: number = female ? CRANIOVERTEBRAL.female : CRANIOVERTEBRAL.male;
    const forward: number = (tragion - cervicale) / Math.tan(angle);
    return {
      frame: {
        name: "head",
        parent: "thorax",
        basis: { kind: "published", citation: "Applied Sciences 14:8639 (2024) craniovertebral angle; ANSUR II tragion-top line; Farkas FH orientation", detail: `bitragion midpoint ${forward.toFixed(1)} mm ahead of C7 at the tragion height ${tragion.toFixed(1)} mm, f1's own craniovertebral angle ${AutoMovieHumanHeadF1Lines.CRANIOVERTEBRAL} deg (the mean ${mean} waits for the later algorithmization); FH level (inclination gap)` },
        relative: { origin: [c7[0] + forward, tragion - ij, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
      },
      c7,
      tragion,
      forward,
    };
  }
}
