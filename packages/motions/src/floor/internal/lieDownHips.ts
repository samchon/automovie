import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";

/**
 * The pelvis's floor place the body goes down over: the hips joint of the
 * posture it starts from, the stand or the posture the entry displays.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `hips`.
 */
export function lieDownHips(
  prepared: lieDownHips.IPrepared,
): IAutoMovieVector3 {
  const { from, body }: lieDownHips.IPrepared = prepared;
  return Vector3.add(
    from.root,
    Quaternion.rotateVector(humanPostureHeading(from), body.rest.get("hips")!),
  );
}

/** The `hips` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownHips {
  /** What `lieDown.plan` prepared for its `hips`. */
  export interface IPrepared {
    /** The `from` `lieDown.plan` prepared. */
    from: IAutoMovieMotionHumanPosture;

    /** The `body` `lieDown.plan` prepared. */
    body: IAutoMovieMotionHumanBody;
  }
}
