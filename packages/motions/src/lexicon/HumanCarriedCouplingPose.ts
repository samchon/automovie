import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/internal/stand";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/internal/bendLower";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";
import { resolveCarriedHoldGeometry } from "./internal/resolveCarriedHoldGeometry";

/**
 * The borne body of a coupled carry placed on its bearer: the carry's key
 * posture, the region places both bodies are read at, the anchor bone the borne
 * body rides, its posture carried by that bone at each instant and the bearer's
 * hold places. `HumanCarriedCoupling` states the coupling these read.
 */
export namespace HumanCarriedCouplingPose {
  /**
   * The bones `HumanTrunk.resolve` places from a posture's root and joints
   * alone.
   */
  export const TRUNK: readonly AutoMovieHumanoidBone[] = [
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "leftShoulder",
    "rightShoulder",
  ];

  /**
   * The bone a region's place is carried by, as the coupling anchors on it: the
   * region's own bone, a trunk bone or a limb's (a drag's thigh).
   *
   * @param body The body.
   * @param name The region.
   * @returns The bone.
   */
  export function anchor(
    body: IAutoMovieMotionHumanBody,
    name: AutoMovieHumanoidRegion,
  ): AutoMovieHumanoidBone {
    return body.surfaces.regions[name].bone;
  }

  /**
   * A posture's bones as far as the anchor needs them: the trunk's alone
   * (`HumanTrunk.resolve`) for a trunk anchor, the whole fitted pose for a
   * limb's.
   *
   * @param body The body.
   * @param posture The posture.
   * @param anchor The anchor bone.
   * @param resolution The forward-kinematics reader of the posture evaluation
   *   this call is part of, used for this call only; a fresh one when absent.
   * @param requested The bones the caller reads; every bone when absent.
   * @returns The resolved bones, only the requested ones and their ancestors
   *   when a set is given.
   */
  export function bones(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    anchor: AutoMovieHumanoidBone,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    if (TRUNK.includes(anchor))
      return HumanTrunk.resolve(
        body,
        posture,
        undefined,
        resolution,
        requested,
      );
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    return poseBones(
      body,
      resolveHumanPosture.seeded(body, posture, undefined, {}, read).pose,
      read(),
      requested,
    );
  }

  /**
   * The borne body's posture at an instant: the key pose carried rigidly by the
   * bearer's anchor bone as displayed, its clinging hands on the bearer's
   * regions.
   *
   * @param body The borne body.
   * @param coupling The coupling.
   * @param row The carry's row, for its key posture.
   * @param bearers Each bearer's body and displayed bones at the instant, by
   *   role.
   * @returns The posture, with a whole-body rotation.
   * @throws {HumanRefusal} A `participant` refusal on `by` when a bearer the
   *   coupling names is not given or lacks its anchor bone.
   */
  export function posture(
    body: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    row: IAutoMovieMotionHumanCarried.IRow,
    bearers: Bearers,
  ): IAutoMovieMotionHumanPosture {
    return preparePosture(body, coupling, row)(bearers);
  }

  /**
   * Prepare the fixed carried key and actual clinging palm geometry. Each
   * request supplies its current bearer frames.
   */
  export function preparePosture(
    body: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    row: IAutoMovieMotionHumanCarried.IRow,
  ): (bearers: Bearers) => IAutoMovieMotionHumanPosture {
    const keyPose: IAutoMovieMotionHumanPosture = key(row, coupling.key.legs);
    const grips: ICling[] = [];
    const fingers: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const contact of coupling.contacts) {
      if (contact.kind !== "grip") continue;
      const side: AutoMovieHumanSide =
        contact.part === "leftHand" ? "left" : "right";
      grips.push({
        contact,
        side,
        palm: HumanHandTarget.prepareGoal(body, side, {
          shape: "flat",
          bend: row.straddles === true ? "raised" : "hang",
        }),
      });
      Object.assign(fingers, HumanHand.shape(side, "flat"));
    }
    const keyed: IAutoMovieMotionHumanPosture = {
      ...keyPose,
      joints: { ...keyPose.joints, ...fingers },
    };
    const keyTurn: IAutoMovieQuaternion = Quaternion.multiply(
      coupling.key.rotation,
      Quaternion.inverse(humanPostureHeading(keyed)),
    );
    return (bearers: Bearers): IAutoMovieMotionHumanPosture =>
      placedPosture(coupling, bearers, keyed, keyTurn, grips);
  }

  function placedPosture(
    coupling: IAutoMovieMotionCoupling,
    bearers: Bearers,
    keyed: IAutoMovieMotionHumanPosture,
    keyTurn: IAutoMovieQuaternion,
    grips: readonly ICling[],
  ): IAutoMovieMotionHumanPosture {
    const of = (
      role: string,
    ): IAutoMovieMotionHumanCarriedCouplingPose.IBearer => {
      const found:
        | IAutoMovieMotionHumanCarriedCouplingPose.IBearer
        | undefined = bearers[role];
      if (found === undefined)
        throw new HumanRefusal({
          kind: "participant",
          axis: "partner",
          value: role,
          reason: `the carry's ${role} is not given`,
          fix: "name every bearer of the carry",
        });
      return found;
    };
    const anchored: IAutoMovieResolvedBone | undefined = of(
      coupling.bearer,
    ).bones.get(coupling.anchor);
    if (anchored === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "partner",
        value: coupling.anchor,
        reason: `the bearer's rig has no ${coupling.anchor} to carry the borne body by`,
        fix: "carry on a body of the canonical humanoid rig",
      });

    // The borne root frame: the anchor's displayed frame composed with the
    // key frame.
    const root: IAutoMovieVector3 = Vector3.add(
      anchored.worldPosition,
      Quaternion.rotateVector(anchored.worldRotation, coupling.key.position),
    );
    const turn: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(anchored.worldRotation, keyTurn),
    );
    const placed: IAutoMovieMotionHumanPosture = {
      ...keyed,
      root,
      joints: { ...keyed.joints },
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    if (grips.length !== 0) {
      const back: IAutoMovieQuaternion = Quaternion.inverse(turn);
      for (const { contact, side, palm } of grips) {
        const bearer: IAutoMovieMotionHumanCarriedCouplingPose.IBearer = of(
          contact.on.role,
        );
        const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
          bearer.body.surfaces.regions[contact.on.region];
        const bone: IAutoMovieResolvedBone = bearer.bones.get(surface.bone)!;
        const at: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
          resolveAutoMovieHumanoidSurfaces.pointNormal(surface, bone);
        const goal: IAutoMovieHumanLimbGoal = palm(placed, {
          point: Vector3.add(
            root,
            Quaternion.rotateVector(back, Vector3.subtract(at.point, root)),
          ),
          normal: Quaternion.rotateVector(back, at.normal),
        });
        limbs[`${side}Arm`] = goal;
      }
    }
    return { ...placed, limbs, rotation: { about: root, turn } };
  }

  /**
   * Where each hand of a bearer holds, in that bearer's anchor frame: the borne
   * region it holds on the coupling's key pose, left then right; null for a
   * hand that does not hold.
   *
   * @param borne The borne body.
   * @param coupling The coupling.
   * @param row The carry's row.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @returns The two holds, each the held region's point and outward normal in
   *   that bearer's anchor frame, and the anchor bone.
   */
  export function holds(
    borne: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    row: IAutoMovieMotionHumanCarried.IRow,
    role: string = coupling.bearer,
  ): IAutoMovieMotionHumanCarriedCouplingPose.IHoldsResult {
    return resolveCarriedHoldGeometry(borne, coupling, row, role, key);
  }

  /**
   * A bearer at the origin in the performer's actual standing posture
   * (`stand.posture`), lowered as a squat by the stance's depth with the trunk
   * inclined by its angle (`bendLower.lower`). The standing alignment, planted
   * feet and minimum knee bend are the same at zero and at every nonzero
   * inclination or depth, so the stance has no finite jump at zero.
   *
   * @param body The bearer's body.
   * @param bent The stance: the trunk's forward inclination, degrees, and the
   *   lowering, a share of a squat's drop.
   * @returns The posture.
   */
  export function stance(
    body: IAutoMovieMotionHumanBody,
    bent: IAutoMovieMotionHumanCarriedCouplingPose.IStanceBent,
  ): IAutoMovieMotionHumanPosture {
    return bendLower.lower(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
      "squat",
      bent.incline,
      bent.depth,
      0,
    );
  }

  /**
   * A bearer's bones in its planted stance (`stance`), including at zero: every
   * trial is resolved by the same whole-body kinematics.
   *
   * @param body The bearer's body.
   * @param bent The stance.
   * @returns The resolved bones.
   */
  export function stood(
    body: IAutoMovieMotionHumanBody,
    bent: IAutoMovieMotionHumanCarriedCouplingPose.IStoodBent,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(body, resolveHumanPosture(body, stance(body, bent)));
  }

  /**
   * The carry's key posture of the borne body at the origin: the row's heading
   * and tip, and its leg angles or the fitted ones.
   *
   * @param row The carry's row.
   * @param legs Both legs' hip flexion, knee flexion and hip abduction,
   *   degrees; the row's when absent.
   * @returns The posture.
   */
  export function key(
    row: IAutoMovieMotionHumanCarried.IRow,
    legs: readonly [number, number, number] = row.legs,
  ): IAutoMovieMotionHumanPosture {
    const [hip, knee, apart]: readonly [number, number, number] = legs;
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: row.turn,
      pitch: row.pitch,
      roll: 0,
      joints: {
        leftUpperLeg: [hip, apart, 0],
        rightUpperLeg: [hip, apart, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
      },
      limbs: {},
    };
  }

  /**
   * A region's world point on resolved bones.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param name The region.
   * @returns World metres.
   * @throws {HumanRefusal} A `parameter` refusal on `carry` when the rig lacks
   *   the region's bone.
   */
  export function region(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    name: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[name];
    const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
    if (bone === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "carry",
        value: name,
        reason: `the rig has no bone ${frame.bone} for the region ${name}`,
        fix: "carry on a body of the canonical humanoid rig",
      });
    return resolveAutoMovieHumanoidSurfaces.point(frame, bone);
  }
}

/** The known bearers and prepared hand geometry for one carried plan. */
type Bearers = Readonly<
  Record<string, IAutoMovieMotionHumanCarriedCouplingPose.IBearer>
>;

interface ICling {
  contact: IAutoMovieMotionCoupling.IContact;
  side: AutoMovieHumanSide;
  palm: ReturnType<typeof HumanHandTarget.prepareGoal>;
}
