import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanCarryHumanPosture,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

/*
 * The partner's carrying bone's frame at a film second: the sternum region's
 * bone, which breathes and turns with the trunk.
 */
export function lieTogetherFrame(
  partner: IAutoMovieMotionHumanPerformerReader,
  seconds: number,
): IAutoMovieMotionHumanCarryHumanPosture.IFrame {
  const carrier: AutoMovieHumanoidBone =
    partner.body.surfaces.regions.sternum.bone;
  const bone: IAutoMovieResolvedBone = partner
    .bones(seconds, new Set([carrier]))
    .get(carrier)!;
  return { position: bone.worldPosition, rotation: bone.worldRotation };
}
