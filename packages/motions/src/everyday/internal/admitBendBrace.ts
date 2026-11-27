import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Admit a bend's bracing palm on its thigh at the deepest second. A point-only
 * wrist fit may turn its palm away when the wrist's preferred rotation is
 * beyond range. A thigh can bear the body only on the palm and between the ends
 * of the femur, a half hand from each end clear of the built tangle allowance.
 *
 * @param body The bending body.
 * @param course The composed lowering.
 * @param down The descent's duration, seconds: the deepest second.
 * @param free The bracing hand's side.
 * @returns The posture at the deepest second, which the hold keeps.
 * @throws {HumanRefusal} When the palm faces away from the thigh or lies beyond
 *   either end of the femur.
 */
export function admitBendBrace(
  body: IAutoMovieMotionHumanBody,
  course: IAutoMovieMotionHumanActionPlan,
  down: number,
  free: AutoMovieHumanSide,
): IAutoMovieMotionHumanPosture {
  const held: IAutoMovieMotionHumanPosture = course.posture(down);
  const shown: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, held),
  );
  const knee: IAutoMovieVector3 = shown.get(`${free}LowerLeg`)!.worldPosition;
  const femur: IAutoMovieVector3 = Vector3.subtract(
    shown.get(`${free}UpperLeg`)!.worldPosition,
    knee,
  );
  const axis: IAutoMovieVector3 = Vector3.normalize(femur);
  const contact: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
    body,
    shown,
    free,
    "palm",
    "flat",
  );
  const delta: IAutoMovieVector3 = Vector3.subtract(contact.point, knee);
  const station: number = Vector3.dot(delta, axis);
  const radial: IAutoMovieVector3 = Vector3.addScaled(delta, axis, -station);
  const margin: number =
    body.measure.hand / 2 - AutoMovieMotionHumanAuditTangle.BUILT;
  if (
    Vector3.dot(contact.normal, radial) >= 0 ||
    station < margin ||
    Vector3.length(femur) - station < margin
  )
    throw new HumanRefusal({
      kind: "reach",
      axis: "region",
      value: `${free}UpperLeg`,
      reason:
        "the open support palm cannot bear against the front of the thigh between its ends",
      fix: "choose a lowering that leaves room for the bracing wrist",
    });
  return held;
}
