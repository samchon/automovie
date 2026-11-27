import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * A ring dresser's steadying palm (`slipRing`): laid on the partner's own
 * forearm collider on the side facing the steadying shoulder. When the
 * partner presents their wrist toward the dresser, the palm settles at the
 * nearest site that leaves room for the palm and fingers. Its fingers point
 * along the dresser's approach projected onto the contact plane. Read from
 * the action's entry stance, bodies and presented hand.
 * Parameter scope: What the plan lays the steadying palm from.
 * Returns: The steadying hand's target.
 * When the hand does not fit between the joints or the
 * forearm collider cannot be reached by the support ray.
 */
export function slipRingSteady(
  scope: slipRingSteady.IScope,
): IAutoMovieMotionHumanArmTarget.ITarget {
  const {
    subject,
    body,
    partner,
    bones,
    hand,
    steady,
    shoulder,
    bend,
  }: slipRingSteady.IScope = scope;
  const handBone: AutoMovieHumanoidBone = `${hand}Hand`;
  const lowerArm: AutoMovieHumanoidBone = `${hand}LowerArm`;
  const wrist: IAutoMovieVector3 = bones.get(handBone)!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get(lowerArm)!.worldPosition;
  const forearm: number = AutoMovieEngineVector3.distance(wrist, elbow);
  const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(wrist, elbow),
  );
  const palm: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
    body,
    steady,
    "palm",
    "flat",
  );
  const fingers: number = AutoMovieEngineVector3.distance(
    palm.point,
    HumanHand.offset(body, steady, "indexTip", "flat").point,
  );
  const skin: number = AutoMovieMotionHumanAuditSkin.BUILT;
  const approach: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(wrist, shoulder);
  // Point the hand along the available reach. A wristward hand on a forearm
  // presented toward the dresser makes the wrist fold back on its own arm.
  const wristward: boolean = AutoMovieEngineVector3.dot(approach, along) >= 0;
  let distance: number;
  if (wristward)
    distance = Math.min(forearm, Math.max(forearm / 3, fingers + skin));
  else {
    const heel: number = AutoMovieEngineVector3.dot(palm.point, palm.forward);
    const minimum: number = heel + skin;
    const maximum: number = forearm - fingers - skin;
    if (minimum > maximum)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "partner",
        value: forearm,
        feasible: {
          kind: "range",
          minimum: heel + fingers + 2 * skin,
          maximum: null,
          unit: "m",
        },
        reason:
          "the steadying hand does not fit between the partner's wrist and elbow",
        fix: "have the partner present their forearm from the steadying hand's side",
      });
    distance = minimum;
  }
  const grasped: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
    wrist,
    elbow,
    distance / forearm,
  );
  const outward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    across(AutoMovieEngineVector3.subtract(shoulder, grasped), along),
  );
  // The palm lies on the partner's forearm collider itself, not one
  // radius off the axis shared by the whole limb. The support ray finds the
  // forearm's actual surface and normal from the chosen approach. It starts
  // a forearm's length off the axis and runs twice that.
  const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
    HumanColliders.cast(
      partner,
      new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
        [lowerArm, bones.get(lowerArm)!],
      ]),
      AutoMovieEngineVector3.add(grasped, AutoMovieEngineVector3.scale(outward, forearm)),
      AutoMovieEngineVector3.scale(outward, -1),
      2 * forearm,
    );
  if (hit === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "partner",
      value: subject,
      reason: `no collider of the partner's ${lowerArm} lies on the steadying hand's way in`,
      fix: "have the partner present the forearm toward the steadying hand",
    });
  const forward: IAutoMovieVector3 = wristward
    ? along
    : AutoMovieEngineVector3.subtract(hit.point, shoulder);
  return AutoMovieMotionHumanArmTarget.prepareTarget(
    body,
    steady,
    "palm",
    "flat",
  )({
    point: hit.point,
    rotation: HumanHand.align(palm, {
      normal: AutoMovieEngineVector3.scale(hit.normal, -1),
      forward: AutoMovieEngineVector3.normalize(across(forward, hit.normal)),
    }),
    bend,
  });
}

/*
 * What a ring dresser's steadying palm reads.
 */
export namespace slipRingSteady {
  /*
   * What a ring plan lays its steadying palm from.
   */
  export interface IScope {
    /*
     * The participant whose surface the hand steadies.
     */
    subject: string;

    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The partner's body.
     */
    partner: IAutoMovieMotionHumanBody;

    /*
     * The partner's bones at the action's start.
     */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /*
     * The partner's presented hand.
     */
    hand: AutoMovieHumanSide;

    /*
     * The dresser's steadying hand.
     */
    steady: AutoMovieHumanSide;

    /*
     * The steadying shoulder at entry, world metres.
     */
    shoulder: IAutoMovieVector3;

    /*
     * The steadying elbow's hanging bend point, world metres.
     */
    bend: IAutoMovieVector3;
  }
}

/*
 * Project the approach onto the contact plane by subtracting its component
 * along the unit normal `n`, giving `v - n (v · n)`.
 * See Gilbert Strang, MIT 18.06 Lecture 15, Projections onto Subspaces.
 */
function across(
  vector: IAutoMovieVector3,
  axis: IAutoMovieVector3,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.subtract(
    vector,
    AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(vector, axis)),
  );
}
