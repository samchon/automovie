import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";

/** Roundoff bound for the component of world down across a vertical forearm. */
const PARALLEL: number = 1e-9;

/**
 * A ring dresser's steadying palm (`slipRing`): laid on the partner's own
 * forearm collider. The fingers run along the forearm in the direction the
 * dresser approaches it. Palm and fingers fit between the partner's joints
 * where the hand supports from below. Read from the action's entry stance,
 * bodies and presented hand.
 *
 * @param scope What the plan lays the steadying palm from.
 * @returns The steadying hand's target.
 * @throws {HumanRefusal} When the hand does not fit between the joints or the
 *   forearm collider cannot be reached by the support ray.
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
  const forearm: number = Vector3.distance(wrist, elbow);
  const along: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(wrist, elbow),
  );
  const palm: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
    body,
    steady,
    "palm",
    "flat",
  );
  const fingers: number = Vector3.distance(
    palm.point,
    HumanHand.offset(body, steady, "indexTip", "flat").point,
  );
  const skin: number = AutoMovieMotionHumanAuditSkin.BUILT;
  const approach: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
  // Point the hand along the available reach. A wristward hand on a forearm
  // presented toward the dresser makes the wrist fold back on its own arm.
  const wristward: boolean = Vector3.dot(approach, along) >= 0;
  let distance: number;
  let fromBelow: IAutoMovieVector3 | undefined;
  if (wristward)
    distance = Math.min(forearm, Math.max(forearm / 3, fingers + skin));
  else {
    const heel: number = Vector3.dot(palm.point, palm.forward);
    const minimum: number = heel + skin;
    const maximum: number = forearm - fingers - skin;
    if (minimum > maximum)
      throw new HumanRefusal({
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
    distance = Math.max(minimum, Math.min(forearm / 3, maximum));

    // An elbow-facing palm supports from below. A vertical forearm is
    // steadied from the shoulder side because it has no downward radial.
    const below: IAutoMovieVector3 = across({ x: 0, y: -1, z: 0 }, along);
    if (Vector3.length(below) > PARALLEL) fromBelow = below;
  }
  const grasped: IAutoMovieVector3 = Vector3.lerp(
    wrist,
    elbow,
    distance / forearm,
  );
  const outward: IAutoMovieVector3 = Vector3.normalize(
    fromBelow ?? across(Vector3.subtract(shoulder, grasped), along),
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
      Vector3.add(grasped, Vector3.scale(outward, forearm)),
      Vector3.scale(outward, -1),
      2 * forearm,
    );
  if (hit === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "partner",
      value: subject,
      reason: `no collider of the partner's ${lowerArm} lies on the steadying hand's way in`,
      fix: "have the partner present the forearm toward the steadying hand",
    });
  const under: IAutoMovieMotionHumanArmTarget.ITarget =
    AutoMovieMotionHumanArmTarget.prepareTarget(
      body,
      steady,
      "palm",
      "flat",
    )({
      point: hit.point,
      rotation: HumanHand.align(palm, {
        normal: Vector3.scale(hit.normal, -1),
        forward: Vector3.normalize(
          across(wristward ? along : Vector3.scale(along, -1), hit.normal),
        ),
      }),
      bend,
    });

  return under;
}

/** The component of a vector perpendicular to a unit axis. */
function across(
  vector: IAutoMovieVector3,
  axis: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.subtract(
    vector,
    Vector3.scale(axis, Vector3.dot(vector, axis)),
  );
}

/** What a ring dresser's steadying palm reads. */
export namespace slipRingSteady {
  /** What a ring plan lays its steadying palm from. */
  export interface IScope {
    /** The participant whose surface the hand steadies. */
    subject: string;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The partner's body. */
    partner: IAutoMovieMotionHumanBody;

    /** The partner's bones at the action's start. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The partner's presented hand. */
    hand: AutoMovieHumanSide;

    /** The dresser's steadying hand. */
    steady: AutoMovieHumanSide;

    /** The steadying shoulder at entry, world metres. */
    shoulder: IAutoMovieVector3;

    /** The steadying elbow's hanging bend point, world metres. */
    bend: IAutoMovieVector3;
  }
}
