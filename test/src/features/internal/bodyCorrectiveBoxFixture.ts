import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { humanBodyBasisFixture } from "./humanBodyBasisFixture";

const wide = {
  flexion: { min: -30, max: 170 },
  abduction: { min: -10, max: 10 },
  twist: { min: -10, max: 10 },
};

/**
 * The analytic box (see `humanBodyBasisFixture`) made foldable for the
 * corrective solver's tests: the spine's flexion range opens to 170 degrees,
 * where the folded box crosses itself between the hips and the spine segment
 * and not before (the box is 2 m tall and folds about its middle).
 *
 * With `short` the two bones are a millimetre long, kept at the same pivot:
 * the hips bone ends 1 mm above its head and the spine bone 1 mm above the
 * pivot. A bone as long as the box passes through the skin of the other
 * segment when the box folds flat, which the solver refuses to push; a short
 * bone does not, so the tissue gives and the crossing can be parted.
 *
 * With `rename` the spine joint is called `leftLowerLeg` (a distal limb bone)
 * so the crossing is a limb against the trunk, contact the solver leaves to
 * the pose.
 */
export function bodyCorrectiveBoxFixture(
  options: { short?: boolean; rename?: boolean } = {},
): IAutoMovieHumanBodyBasis {
  const { basis } = humanBodyBasisFixture();
  const bone = options.rename === true ? "leftLowerLeg" : "spine";
  return {
    ...basis,
    landmarks:
      options.short === true
        ? {
            ids: [...basis.landmarks.ids, "tip-hips"],
            positions: [0, 0, 0, 0, 1, 0, 0, 1.001, 0, 0, 0.001, 0],
            targets: basis.landmarks.targets,
          }
        : basis.landmarks,
    joints: [
      {
        ...basis.joints[0],
        tail: options.short === true ? "tip-hips" : basis.joints[0].tail,
      },
      { ...basis.joints[1], bone, constraint: wide },
    ],
    surfaces: [
      {
        ...basis.surfaces[0],
        skin: {
          ...basis.surfaces[0].skin,
          joints: ["hips", bone],
        },
      },
    ],
  };
}
