import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Seated hand placements on the thighs and armrests. A placement invocation
 * owns its resolved bones so its target and hanging origin share one solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the target surfaces and the lifetime of shared resolved bones; members give world-metre and degree inputs.
 * @evidence contracts/development/design.md#principled-representation Existing posture goals, body surfaces and resolved bones describe both resting targets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seated facade delegates its five hand operations here; no new public action or parameter is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the canonical arm goal and posture resolver without a parallel fit or stored target pose.
 */
export namespace seatedHands {
  /**
   * Lay both palms on their own front thighs, fingers toward the knees.
   * The input's leg goals are solved before the surface is measured.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the surface, direction and solved-leg premise.
   * @evidence contracts/development/implementation.md#principled-implementation Transforms each body's thigh-front surface through its resolved bone and uses its lower leg to orient a flat palm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical solve feeds the shared thigh-goal builder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the existing provisional hanging-elbow out share of 0.2 and canonical palm goal construction.
   * @evidence contracts/development/implementation.md#efficient-algorithms One canonical observational resolution and demanded FK, then constant work for the requested targets; independent world arm goals that cannot change thigh observations need no fit, under the resolver's existing guard.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both targets read the same completed bone map; it is never shared across different input postures.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Bones and goals are invocation-local and no cache or handle is retained.
   */
  export function hands(
    body: IHumanBody,
    posture: IHumanPosture,
    side?: HumanHand.Side,
  ): IHumanPosture["limbs"] {
    const sides: readonly HumanHand.Side[] =
      side === undefined ? SIDES : [side];
    return thighs(
      body,
      posture,
      resolved(body, posture, thighBones(body, sides, false)),
      sides,
    );
  }

  /**
   * Move the hands from their posed hanging origins to their thighs by a
   * caller-eased share, clamped by the endpoint branches at zero and one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two endpoints and the caller's eased progress convention.
   * @evidence contracts/development/implementation.md#principled-implementation Interpolates world wrist points linearly and hand rotations spherically between the same posed origin and thigh target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the two active hands to the shared partial-placement operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original hanging and fully resting branches and elbow hints remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms At positive share one pose resolution and FK supplies origins and targets instead of resolving that same posture twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses one invocation's exact bone map for target surfaces and hanging wrist frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned posture and its goals survive the call.
   */
  export function arms(
    body: IHumanBody,
    posture: IHumanPosture,
    share: number,
  ): IHumanPosture {
    return towardThighs(body, posture, share, SIDES);
  }

  /**
   * Rest each hand on its armrest when supplied, otherwise on its thigh.
   * Inputs contain placed legs and directly authored hanging arms; share is
   * zero hanging to one bearing, and armrest coordinates are world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States target precedence, input pose and progress, and world-metre rests.
   * @evidence contracts/development/implementation.md#principled-implementation Each hand retains the same independently defined thigh or armrest interpolation from the posed hanging origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects only the thighs that remain visible, then writes supplied armrests with their existing owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Armrest goals still replace thigh goals on that side and become planted only at full share; no reach refusal is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Avoids overwritten thigh targets and, when the input has no arm goals, shares one canonical solve between the actual thigh and armrest consumers instead of repeating its identical leg solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Absence of both input arm goals makes the original posture exactly the legs-only posture armrest origins require; those matching inputs share one call-local map. Inputs with arm goals retain separate full and legs-only readings.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The active-side list and resolved maps end with the invocation; no retained state is added.
   */
  export function rested(
    body: IHumanBody,
    posture: IHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined,
    yaw: number,
    share: number,
  ): IHumanPosture {
    if (share <= 0) return posture;
    if (
      rests === undefined ||
      (rests.left === undefined && rests.right === undefined)
    )
      return arms(body, posture, share);
    const sides: HumanHand.Side[] = SIDES.filter(
      (side: HumanHand.Side): boolean => rests[side] === undefined,
    );
    if (
      posture.limbs.leftArm === undefined &&
      posture.limbs.rightArm === undefined
    ) {
      const requested: Set<AutoMovieHumanoidBone> = new Set(
        thighBones(body, sides, share < 1),
      );
      for (const side of SIDES)
        if (rests[side] !== undefined) requested.add(`${side}Hand`);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        resolved(body, posture, requested);
      return restGoals(
        body,
        towardThighs(body, posture, share, sides, bones),
        rests,
        yaw,
        share,
        bones,
      );
    }
    return onArmrests(
      body,
      towardThighs(body, posture, share, sides),
      rests,
      yaw,
      share,
    );
  }

  /**
   * Move supplied hands from their directly posed frames onto world-metre
   * armrest points, palms down, fingers along yaw in degrees. Other hand
   * goals remain; a hand bears when share reaches one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the origins, target frame, hand orientation and contact threshold.
   * @evidence contracts/development/implementation.md#principled-implementation Reads hanging origins with leg goals alone, then linearly interpolates points and slerps the original palm-down armrest goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose solve and a two-side pass retain goals on missing sides.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the provisional hand-thickness and elbow shares and leaves out-of-reach reporting to the existing contact audit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Positive share with supplied rests costs one observational pose resolution and FK plus constant target work; zero share or no supplied rest needs none.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both supplied armrests use the same completed map, with no cross-posture cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Resolved bones and temporary goals end with the call; the returned posture owns its new limb map.
   */
  export function onArmrests(
    body: IHumanBody,
    posture: IHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
    share: number,
  ): IHumanPosture {
    if (share <= 0) return posture;
    const legs: IHumanPosture["limbs"] = {};
    for (const side of SIDES) {
      const goal: IHumanPosture.IGoal | undefined = posture.limbs[`${side}Leg`];
      if (goal !== undefined) legs[`${side}Leg`] = goal;
    }
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const side of SIDES)
      if (rests[side] !== undefined) requested.add(`${side}Hand`);
    if (requested.size === 0) return posture;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = resolved(
      body,
      { ...posture, limbs: legs },
      requested,
    );
    return restGoals(body, posture, rests, yaw, share, bones);
  }

  /** Write armrest goals from the exact hanging-origin map owned by this call. */
  function restGoals(
    body: IHumanBody,
    posture: IHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
    share: number,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IHumanPosture {
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    const s: number = Math.min(1, share);
    for (const side of SIDES) {
      const rest: IAutoMovieVector3 | undefined = rests[side];
      if (rest === undefined) continue;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const goal: IHumanPosture.IGoal = armrest(body, posture, side, rest, yaw);
      limbs[`${side}Arm`] = {
        point: Vector3.lerp(hand.worldPosition, goal.point, s),
        rotation: Quaternion.slerp(hand.worldRotation, goal.rotation!, s),
        bend: goal.bend,
        planted: s >= 1,
      };
    }
    return { ...posture, limbs };
  }

  /**
   * The bearing wrist a fifth of this body's hand length above an armrest,
   * palm down and fingers along the seat's yaw, in world metres and degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the offset, frame, orientation and bearing state.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing provisional hand-thickness share, canonical hand orientation and hanging-elbow preset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Constructs one world arm goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing 0.2 thickness and elbow shares; no new fitted posture or body special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work without pose resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Independent point and posture inputs require their own goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state or resources.
   */
  export function armrest(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    rest: IAutoMovieVector3,
    yaw: number,
  ): IHumanPosture.IGoal {
    return {
      point: { ...rest, y: rest.y + 0.2 * body.measure.hand },
      rotation: HumanHand.rotation(side, {
        fingers: HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: 1 },
        ),
        palm: { x: 0, y: -1, z: 0 },
      }),
      bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      planted: true,
    };
  }

  /** Share the input's resolved wrist frames and thigh surfaces in this call. */
  function towardThighs(
    body: IHumanBody,
    posture: IHumanPosture,
    share: number,
    sides: readonly HumanHand.Side[],
    prepared?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IHumanPosture {
    if (share <= 0 || sides.length === 0) return posture;
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      prepared ?? resolved(body, posture, thighBones(body, sides, share < 1));
    const goals: IHumanPosture["limbs"] = thighs(body, posture, bones, sides);
    if (share >= 1)
      return { ...posture, limbs: { ...posture.limbs, ...goals } };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of sides) {
      const goal: IHumanPosture.IGoal = goals[`${side}Arm`]!;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      limbs[`${side}Arm`] = {
        point: Vector3.lerp(hand.worldPosition, goal.point, share),
        rotation: Quaternion.slerp(hand.worldRotation, goal.rotation!, share),
        bend: goal.bend,
      };
    }
    return { ...posture, limbs };
  }

  /** Measure only target surfaces this invocation will return. */
  function thighs(
    body: IHumanBody,
    posture: IHumanPosture,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    sides: readonly HumanHand.Side[],
  ): IHumanPosture["limbs"] {
    const limbs: IHumanPosture["limbs"] = {};
    for (const side of sides) {
      const frame: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        body.surfaces.regions[
          `thighFront${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
        ];
      const thigh: IAutoMovieResolvedBone = bones.get(frame.bone)!;
      const point: IAutoMovieVector3 = Vector3.add(
        thigh.worldPosition,
        Quaternion.rotateVector(thigh.worldRotation, frame.point),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        thigh.worldRotation,
        frame.normal,
      );
      const along: IAutoMovieVector3 = Vector3.subtract(
        bones.get(`${side}LowerLeg`)!.worldPosition,
        thigh.worldPosition,
      );
      limbs[`${side}Arm`] = AutoMovieMotionHumanArm.goal(body, side, {
        surface: "palm",
        shape: "flat",
        point,
        rotation: HumanHand.rotation(side, {
          fingers: along,
          palm: Vector3.scale(normal, -1),
        }),
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      });
    }
    return limbs;
  }

  /** Resolve this call's observed frames under the canonical demand guards. */
  function resolved(
    body: IHumanBody,
    posture: IHumanPosture,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        resolution,
        requested,
      ).pose,
      resolution(),
      requested,
    );
  }

  /** Surface bones and knees determine targets; hanging origins also need wrists. */
  function thighBones(
    body: IHumanBody,
    sides: readonly HumanHand.Side[],
    wrists: boolean,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const side of sides) {
      requested.add(
        body.surfaces.regions[`thighFront${side === "left" ? "Left" : "Right"}`]
          .bone,
      );
      requested.add(`${side}LowerLeg`);
      if (wrists) requested.add(`${side}Hand`);
    }
    return requested;
  }

  /** The body's fixed bilateral ordering, shared by every placement. */
  const SIDES: readonly HumanHand.Side[] = ["left", "right"];
}
