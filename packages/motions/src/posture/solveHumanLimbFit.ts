import type {
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbMirror } from "./HumanLimbMirror";
import type { IHumanPosture } from "./IHumanPosture";
import { prepareHumanLimbSource } from "./prepareHumanLimbSource";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Solve one limb fit directly, every time, with no memory of earlier fits.
 *
 * A left limb is solved as the right limb in the mirror image of its world
 * and mirrored back, so the two sides are mirror images to the bit. The
 * solve runs in the root-position frame (`HumanLimbFitFrame`): the pose root,
 * goal point and bend and the other arm's wrist are moved by minus the
 * root's position and turned by minus its heading, and the result is handed
 * back with the caller's own root, so one body doing the same thing in
 * another place solves the same numbers. This is the numerical path the fit
 * memory took on a miss, without its key, lookup, recency list or result
 * copies.
 *
 * @param body The performer's body.
 * @param pose The pose before the fit.
 * @param limb The limb.
 * @param goal Its goal, attached or not.
 * @param placed The arms already placed.
 * @param rival Where the other arm's wrist will be, while it is still to be fitted.
 * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
 * @param resolution Optional FK reader or lazy supplier borrowed from the caller's synchronous evaluation.
 * @param policy The ordinary fit, or the owned continuous curve's current hinged correction.
 * @returns The pose with the limb fitted, the seed that continues it and its value; records the fit leaves unchanged are shared with the input pose, which callers treat as immutable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mirror and frame conventions, the absence of memory, the two policies and the shared-record ownership of the result.
 * @evidence contracts/development/implementation.md#principled-implementation Mirror reflection and a rigid root-frame move leave a limb fit equivariant; solving in that frame is the path the memory solved its misses on, so results are those of a memory miss.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Mirror, move into the frame, one solve by the policy's HumanLimbFit entry, restore the root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, lookup or stored answer: every request is solved from its own inputs, and an attached or collider goal stays in the world frame as before.
 * @evidence contracts/development/implementation.md#efficient-algorithms The fit's own work plus O(B) frame and mirror copies; no serialization, hashing, recency update or result clone.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Solves each request afresh; a consumer needing one fit twice passes the value it holds.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the borrowed reader stays with its caller and only the result escapes.
 */
export function solveHumanLimbFit(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limb: IHumanPosture.Limb,
  goal: IHumanPosture.IGoal,
  placed: readonly ("left" | "right")[],
  rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  policy: "ordinary" | "continuous" = "ordinary",
): IAutoMovieSeededChainFit {
  if (limb.startsWith("left")) {
    const image: IAutoMovieSeededChainFit = solveHumanLimbFit(
      body,
      HumanLimbMirror.pose(pose),
      HumanLimbMirror.limb(limb),
      HumanLimbMirror.goal(goal),
      placed.map(HumanLimbMirror.side),
      rival === undefined ? undefined : HumanArmMirror.flip(rival),
      near,

      // The mirror image is read through the operation reader's companion
      // (`prepareHumanLimbSource.mirror`), so neither the pose's rows nor
      // its image's are recomputed for the other's sake. A solve with no
      // reader lent makes its own either way.
      resolution === undefined
        ? undefined
        : (): ReturnType<ReturnType<typeof prepareHumanPoseResolution>> =>
            prepareHumanLimbSource.mirror(prepareHumanPoseResolution.read(resolution)),
      policy,
    );
    return { ...image, pose: HumanLimbMirror.pose(image.pose) };
  }

  // Solved in the root-position frame and handed back with the caller's root.
  const frame: HumanLimbFitFrame.IFrame | null = HumanLimbFitFrame.of(pose, goal);
  const own: IAutoMoviePose = frame === null ? pose : HumanLimbFitFrame.pose(frame, pose);
  const aim: IHumanPosture.IGoal = frame === null ? goal : HumanLimbFitFrame.goal(frame, goal);
  const away: IAutoMovieVector3 | undefined =
    frame === null || rival === undefined ? rival : HumanLimbFitFrame.point(frame, rival);
  HumanLimbFitFrame.work(body, near === undefined ? "coldFits" : "continuedFits");
  const out: IAutoMovieSeededChainFit = policy === "ordinary"
    ? HumanLimbFit.fit(body, own, limb, aim, placed, away, near, resolution)
    : HumanLimbFit.continued(body, own, limb, aim, placed, away, near, resolution);
  return frame === null ? out : { ...out, pose: { ...out.pose, root: pose.root } };
}
