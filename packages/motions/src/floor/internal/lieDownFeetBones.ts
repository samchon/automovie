import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

/**
 * The bones the feet's reads demand: both feet and shanks and each sole
 * socket's bone.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `feetBones`.
 */
export function lieDownFeetBones(
  prepared: lieDownFeetBones.IPrepared,
): ReadonlySet<AutoMovieHumanoidBone> {
  const { body }: lieDownFeetBones.IPrepared = prepared;
  return new Set<AutoMovieHumanoidBone>([
    "leftFoot",
    "rightFoot",
    "leftLowerLeg",
    "rightLowerLeg",
    ...(["heel", "ball", "toe"] as const).flatMap(
      (socket: IAutoMovieMotionHumanFoot.Socket): AutoMovieHumanoidBone[] => [
        body.surfaces.sockets[`${socket}Left`].bone,
        body.surfaces.sockets[`${socket}Right`].bone,
      ],
    ),
  ]);
}

/** The `feetBones` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownFeetBones {
  /** What `lieDown.plan` prepared for its `feetBones`. */
  export interface IPrepared {
    /** The `body` `lieDown.plan` prepared. */
    body: IAutoMovieMotionHumanBody;
  }
}
