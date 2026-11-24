import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanSlipRing,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/**
 * A ring dresser's steadying palm (`slipRing`): laid on the partner's forearm
 * collider a third of the way from the wrist to the elbow, from the side facing
 * the steadying shoulder, its fingers toward the partner's wrist, found by a
 * ray in from that side (`HumanColliders.cast`). Read from the plan's context,
 * body, partner and its bones, the presented hand and the steadying arm.
 *
 * @param scope What the plan lays the steadying palm from.
 * @returns The steadying hand's target.
 * @throws {HumanRefusal} When no collider of the forearm lies on the way in.
 */
export function slipRingSteady(
  scope: slipRingSteady.IScope,
): IAutoMovieMotionHumanArmTarget.ITarget {
  const {
    context,
    p,
    body,
    partner,
    bones,
    hand,
    steady,
    bend,
  }: slipRingSteady.IScope = scope;
  // The steadying palm takes the partner's forearm a third of the way
  // from the wrist to the elbow, from the side facing the steadying
  // shoulder, its fingers toward the partner's wrist: on the presented
  // hand the two hands converged and their forearms crossed (25 mm,
  // then 22.8 mm on either side of the hand). The palm lies the forearm's
  // radius off its axis toward the steadying shoulder and faces back
  // onto it, so the steadying arm comes in from its own side.
  const wrist: IAutoMovieVector3 = bones.get(
    `${hand}Hand` as AutoMovieHumanoidBone,
  )!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get(
    `${hand}LowerArm` as AutoMovieHumanoidBone,
  )!.worldPosition;
  const grasped: IAutoMovieVector3 = Vector3.lerp(wrist, elbow, 1 / 3);
  const along: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(wrist, elbow),
  );
  const shoulder: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
    `${steady}UpperArm`,
  )!.worldPosition;
  const toward: IAutoMovieVector3 = Vector3.subtract(shoulder, grasped);
  const outward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(toward, Vector3.scale(along, Vector3.dot(toward, along))),
  );
  // The palm lies on the partner's forearm collider itself, not one
  // radius off the axis shared by the whole limb (contacts.md, "Contact
  // between performers": penetration is measured against each part's own
  // collider): a ray in from the steadying side onto the forearm's
  // colliders finds the place and its facing (`HumanColliders.cast`), as
  // the embrace lays its palms. It starts a forearm's length out, beyond
  // any of the forearm's colliders, and runs twice that.
  const lowerArm: AutoMovieHumanoidBone =
    `${hand}LowerArm` as AutoMovieHumanoidBone;
  const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
    HumanColliders.cast(
      partner.body,
      new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
        [lowerArm, bones.get(lowerArm)!],
      ]),
      Vector3.add(
        grasped,
        Vector3.scale(outward, partner.body.measure.forearm),
      ),
      Vector3.scale(outward, -1),
      2 * partner.body.measure.forearm,
    );
  if (hit === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "partner",
      value: p.partner,
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
      rotation: HumanHand.align(
        HumanHand.offset(body, steady, "palm", "flat"),
        {
          normal: Vector3.scale(hit.normal, -1),
          forward: Vector3.normalize(
            Vector3.subtract(
              along,
              Vector3.scale(hit.normal, Vector3.dot(along, hit.normal)),
            ),
          ),
        },
      ),
      bend: bend(steady),
    });

  return under;
}

/** What a ring dresser's steadying palm reads. */
export namespace slipRingSteady {
  /** What a ring plan lays its steadying palm from. */
  export interface IScope {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSlipRing>;

    /** The action's parameters. */
    p: IAutoMovieMotionHumanSlipRing;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The partner. */
    partner: IAutoMovieMotionHumanPerformerReader;

    /** The partner's bones at the action's start. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The partner's presented hand. */
    hand: AutoMovieHumanSide;

    /** The dresser's steadying hand. */
    steady: AutoMovieHumanSide;

    /**
     * An arm's hanging bend point.
     *
     * @param arm The arm.
     * @returns The bend point, world metres.
     */
    bend: (arm: AutoMovieHumanSide) => IAutoMovieVector3;
  }
}
