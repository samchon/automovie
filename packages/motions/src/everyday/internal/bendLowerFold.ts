import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { bendLower } from "./bendLower";

/**
 * How deep a solved key folds the trunk into the thighs, metres beyond the rest
 * pose as the tangle audit reads it: the trunk's segments above the pelvis
 * against the thighs, on the key at its full depth. A lowering whose key is
 * also its display (the pick-up's) refuses a fold past the audit's skin and
 * lowers into a squat instead, the knees and hips lowering the trunk rather
 * than the lumbar spine folding it on (Kingma et al. 2010, J Biomech 43:1440).
 *
 * @param body The body.
 * @param upright The standing posture lowered.
 * @param lateral The frontal inclination the key takes, degrees.
 * @param solved The solved lowering.
 * @returns Metres, 0 when the trunk clears the thighs.
 */
export function bendLowerFold(
  body: IAutoMovieMotionHumanBody,
  upright: IAutoMovieMotionHumanPosture,
  lateral: number,
  solved: IAutoMovieMotionHumanBendLower.ISolved,
): number {
  if (!(solved.pitch > 0)) return 0;
  const key: IAutoMovieMotionHumanPosture = bendLower.lower(
    body,
    upright,
    solved.strategy,
    solved.pitch,
    1,
    solved.lean * Math.sin((solved.pitch * Math.PI) / 180),
    undefined,
    lateral,
  );
  let deepest: number = 0;
  for (const pair of AutoMovieMotionHumanAuditTangle.pose(
    body,
    poseBones(body, resolveHumanPosture(body, key)),
  ))
    if (
      (TRUNK.has(pair.a) && HumanBoneGroups.THIGHS.has(pair.b)) ||
      (TRUNK.has(pair.b) && HumanBoneGroups.THIGHS.has(pair.a))
    )
      deepest = Math.max(deepest, pair.depth);
  return deepest;
}

/**
 * The trunk's segments a lowering folds onto the thighs: those above the
 * pelvis, which shares the hip joints with the thighs and so overlaps them by
 * its build.
 */
const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["spine", "chest", "upperChest"]);
