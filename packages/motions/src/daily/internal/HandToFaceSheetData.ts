import type { IAutoMovieVector3 } from "@automovie/interface";
import type { AutoMovieHumanSide } from "@automovie/interface";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

// Moving readers held the phone 33.3 cm from their eyes at customary speed.
export const WALK_DISTANCE: number = 0.333;

// Mean downward gaze relative to the calibrated head during customary
// walking (Table 1, doi:10.1007/s00221-021-06267-6). The study found
// no significant change in vertical gaze angle between conditions.
export const GAZE: number = (10.3 * Math.PI) / 180;

export const WALK_SIGHT: IAutoMovieVector3 = {
  x: 0,
  y: -Math.sin(GAZE),
  z: Math.cos(GAZE),
};

// The only bones a sheet's place reads, by holding side: both eyes, the
// head that turns the walking sight and the holding shoulder.
export const SIGHT: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>([
    "leftEye",
    "rightEye",
    "head",
    "leftUpperArm",
  ]),
  right: new Set<AutoMovieHumanoidBone>([
    "leftEye",
    "rightEye",
    "head",
    "rightUpperArm",
  ]),
};
