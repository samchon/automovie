import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBalanceOption,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTrunk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanJoints } from "./AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRoot } from "./AutoMovieMotionHumanRoot";

/**
 * Trunk phrases: the trunk turned on the pelvis, the body sunk into its
 * knees, and the hips moved back under a limb held out.
 *
 * The hip shifts are solved by {@link HumanBalance.shift} on the body at the
 * phrase's fullest pose and scaled between by the clock's envelope, so no
 * shift is stated as a constant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three phrases and how the hip shifts are found.
 * @evidence contracts/development/design.md#principled-representation A trunk movement is a twist shared along the spine, or a root and pitch change that keeps the centre of mass over the feet; the balance is solved on the body, so the same phrase holds for every body shape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three phrases, one record, the sunk posture the crouch is built on (also read by a law that solves its own inclination) and the chest's share. No law reads them yet: the reactions state their trunk angles as their own curves, and the strikes and the everyday laws rebuilt for #3286 are the consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The crouch takes one record because it has seven inputs; the turn and the counterbalance take positional arguments because each has few and no optional one.
 */
export namespace AutoMovieMotionHumanTrunk {
  /** The chest's share of a trunk turn; the lumbar spine takes the rest. */
  export const CHEST: number = 0.6;

  /**
   * A turn: the trunk twists on the pelvis and comes back (the wind-up and
   * the rotation of a throw or a punch, a turn toward a neighbour).
   *
   * @param clock The action's clock.
   * @param rise The instants the turn starts growing and is full at.
   * @param fall The instants the turn starts shrinking and is gone at.
   * @param degrees The twist at its fullest, degrees; positive toward the performer's left.
   * @returns The primitive, on the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the two windows, the unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Axial rotation of the trunk is mostly thoracic, the lumbar spine allowing little, so the chest takes the larger stated share and the spine the rest, and the two sum to the asked twist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call with the two joints' twists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is the named constant `CHEST`, a modelling choice for a rig with two trunk joints; the pelvis is not turned, which is the root's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanJoints.pulse`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function turn(
    clock: IAutoMovieMotionClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanJoints.pulse(clock, rise, fall, {
      chest: [0, 0, CHEST * degrees],
      spine: [0, 0, (1 - CHEST) * degrees],
    });
  }

  /**
   * Where a posture puts each foot: its ankle and its rotation as the
   * posture resolves, whether its legs are goals or joint angles alone.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Each foot's placement, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the frame and that either kind of leg is read.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the resolved posture reads the foot bones' world frames, so a leg written as goals reads where its solve put it and a leg written as angles where its angles put it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy exact FK workspace feeds the full resolution and final two-foot observation, followed by two lookups.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the feet are read, never rebuilt from a stance width.
   * @evidence contracts/development/implementation.md#efficient-algorithms Every limb/digit/contact still fits fully; final FK admits every authored joint but transforms only foot ancestry, sharing exact unchanged work already performed during that solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A local same-operation reader serves the actual full fitting and final foot FK; changed joint/root dependencies remain checked, without solved-pose or time-result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The getter and temporary map end with synchronous return or throw; only the two fresh foot placements escape.
   */
  export function footing(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, posture, undefined, {}, resolution).pose,
      resolution(),
      FEET,
    );
    const at = (side: AutoMovieHumanSide): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
    });
    return { left: at("left"), right: at("right") };
  }

  /**
   * A posture with legs planted on given feet: each named leg a planted goal
   * on its foot's placement, its knee hinted over the foot from the
   * posture's root, so lowering the root bends the knee instead of carrying
   * the foot down with it.
   *
   * @param body The body.
   * @param posture The posture whose root carries the knees' rest places.
   * @param feet Each foot's placement, world frame.
   * @param legs The legs planted.
   * @returns The posture with those legs' goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written, why the knee bends and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A foot that bears stays on the floor and the leg is solved onto it by inverse kinematics (the effector goals of the motion skill), through the one goal builder `AutoMovieMotionHumanLeg.goal`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal per named leg.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per leg.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function planted(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    feet: Readonly<Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>>,
    legs: readonly AutoMovieHumanSide[],
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of legs)
      limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
        body,
        posture,
        side,
        feet[side],
        true,
      );
    return { ...posture, limbs };
  }

  /**
   * Prepare fixed foot placements for repeated actual planted postures.
   *
   * @param body The unchanged body supplying rest knee/toe geometry.
   * @param feet The unchanged ankle/rotation placements, borrowed for this reader.
   * @param legs The unchanged ordered legs to plant, both by default; duplicate visits remain duplicate goal writes.
   * @returns A fresh posture/limb map at each current root/yaw, with original borrowed foot fields and fresh knee/contact values.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/placements/ordered selection, both-leg default, duplicate order, current posture inputs and fresh/borrowed output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Each selected leg uses the existing Leg.prepareGoal producer for the same planted ankle, foot rotation, actual root/yaw knee and toe contact; all remaining posture fields and limb goals stay as originally spread.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed goal reader per distinct selected side precedes the original ordered limb-map writer; prepareCrouch and fixed-foot dive share this same preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cold planted entry keeps live inputs unchanged. Explicit fixed geometry alone is shared; every selected visit writes its actual goal, including duplicates, and no joint, contact, ROM check or target is replaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two fixed goal readers serve Q writes, avoiding repeated fixed foot heading/contact and exact-yaw knee prerequisites; every actual root transform, ordered goal write and fresh output map remains. Improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller establishes unchanged body, foot placements and leg selection. Current root/yaw and every raw posture/goal remain live inputs, while the leg owner guards exact rotation metadata and owns its original numerical knee/contact formulas.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning action holds the borrowed fixed selection/feet and at most two bounded goal readers until release. No current posture, returned limb map, target result, FK/ROM loan or time history is retained.
   */
  export function preparePlanted(body: IAutoMovieMotionHumanBody,
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    legs: readonly AutoMovieHumanSide[] = ["left", "right"]): (posture: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture {
    const goals: Partial<Record<AutoMovieHumanSide, ReturnType<typeof AutoMovieMotionHumanLeg.prepareGoal>>> = {};
    for (const side of legs)
      if (goals[side] === undefined)
        goals[side] = AutoMovieMotionHumanLeg.prepareGoal(body, side, feet[side], true);
    return (posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of legs) limbs[`${side}Leg`] = goals[side]!(posture);
      return { ...posture, limbs };
    };
  }
  /**
   * A posture sunk into its knees: the hips lowered and moved back along the
   * heading, and the trunk inclined forward over them by the lumbopelvic
   * rhythm (`HumanTrunk.incline`), the pelvis taking no more than the planted
   * legs' hip flexion leaves it (`HumanTrunk.pelvisLimit`) and the spine the
   * rest. The legs keep their goals.
   *
   * @param body The body.
   * @param posture The posture, its pelvis level.
   * @param depth How far the hips sink, metres.
   * @param inclination The trunk's forward inclination, degrees.
   * @param back How far the hips move back along the heading, metres.
   * @returns The sunk posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, moved and inclined, who shares the inclination and each parameter's unit.
   * @evidence contracts/development/implementation.md#principled-implementation Folded thighs use up the hip's flexion range, so a deep crouch inclines the trunk through the spine rather than the pelvis (Esola et al. 1996 for the rhythm); a pelvis pitched past the range would pull the planted feet off the floor. The limit is read over the leg goals' ankles with the hips at their sunk place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One hips goal, one incline and one root placed under the pitched hips.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A posture without both leg goals has no thighs to read, so its pelvis takes the rhythm's full share; the hips' place is read in the yaw frame, so a posture already pitched is not a valid input, as the parameter states.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the split and the limit to `HumanTrunk`, the owner the bend, the sit and the rise read.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function sunk(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    depth: number,
    inclination: number,
    back: number,
  ): IAutoMovieMotionHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const goal: IAutoMovieVector3 = HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      { x: hips.x, y: hips.y - depth, z: hips.z - back },
    );
    const level: IAutoMovieVector3 = Vector3.subtract(
      goal,
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        hips,
      ),
    );
    const left: IAutoMovieHumanLimbGoal | undefined = posture.limbs.leftLeg;
    const right: IAutoMovieHumanLimbGoal | undefined = posture.limbs.rightLeg;
    const tilt = HumanTrunk.incline(
      posture.joints,
      inclination,
      left === undefined || right === undefined
        ? Infinity
        : HumanTrunk.pelvisLimit(body, level, posture.yaw, {
            left: left.point,
            right: right.point,
          }),
    );
    const tipped: IAutoMovieMotionHumanPosture = {
      ...posture,
      pitch: posture.pitch + tilt.pitch,
      joints: tilt.joints,
    };
    return {
      ...tipped,
      root: Vector3.subtract(
        goal,
        Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips),
      ),
    };
  }

  /**
   * A crouch: the hips sink and the trunk inclines forward over them
   * (`sunk`), the hips moved so the centre of mass stays over the feet where
   * they bear, back over flat feet and forward over a forefoot whose heel the
   * ankle's range lifts, and the body stands again (a duck, the dip before
   * a jump, a load taken into the legs). The crouch plants its legs itself
   * on the feet the standing posture shows (`footing`, `planted`), so the knees bend under
   * the sinking hips whatever the action before it left: a stance with leg
   * goals, or an exercise whose legs are joint angles alone, under which a
   * root lowered without goals would carry straight legs through the floor.
   *
   * @param props The body, the standing posture, the windows, the depth, the pitch and the legs planted.
   * @returns The primitive, on the root, the trunk and the planted legs.
   * @throws {Error} When the depth or the pitch is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, why the knees bend whatever the entry, the channels and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Standing balance keeps the centre of mass over the base of support, so the hip shift is solved by `HumanBalance.shift` on the lowest pose, over the feet where they bear, and scaled with the depth and the pitch by the clock's envelope. The shift is solved once on the standing posture with its legs planted, so between the ends the balance is the linear share of the solved one, not solved again. The feet are read once off the resolved standing posture, the place the body is displayed standing on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper builds the lowered and planted pose for a share; it serves both the solve and the write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative or non-numeric depth or pitch throws; no shift is stated; the feet are the posture's own, never a stance rebuilt from a width.
   * @evidence contracts/development/implementation.md#efficient-algorithms The balance and the feet are solved once when the phrase is built, not per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the lowered pose to `sunk`, the solve to `HumanBalance.shift` and the leg goals to `AutoMovieMotionHumanLeg.goal`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive keeps its arguments and the bounded prepareCrouch writer: two feet, at most two fixed goal readers and one solved shift, without sampled posture results.
   */
  export function crouch(props: IAutoMovieMotionHumanTrunk.ICrouch): IAutoMovieMotionHumanPrimitive {
    const lower: (posture: IAutoMovieMotionHumanPosture, share: number) => IAutoMovieMotionHumanPosture =
      prepareCrouch(props);
    const legs: readonly AutoMovieHumanSide[] = props.legs ?? ["left", "right"];
    return {
      channels: [
        "root",
        "trunk",
        ...legs.map(
          (side: AutoMovieHumanSide): "leftLeg" | "rightLeg" => `${side}Leg`,
        ),
      ],
      from: props.clock.at(props.rise[0]),
      to: props.clock.at(props.fall[1]),
      write: (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture =>
        lower(posture, props.clock.envelope(props.rise, props.fall, seconds)),
    };
  }

  /**
   * Prepare one crouch's planted feet and full-depth balance shift so
   * repeated clock windows can apply the same geometry with their own share.
   * The body, standing posture and dimensional inputs remain unchanged for
   * the returned reader's lifetime; a different stance or depth prepares anew.
   *
   * @param props The body, fixed stance, depth in metres, inclination in degrees and planted legs.
   * @returns A posture writer at the supplied share in [0, 1], without a clock or sampled pose cache.
   * @throws {Error} When depth or pitch is negative or non-numeric.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged geometry, world/clinical units, caller-supplied clock share and preparation failure.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the standing feet once, plants before sinking and uses the original HumanBalance.shift at full depth. Each write applies exactly the original scaled depth, pitch and solved hip shift through sunk and planted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fixed foot-goal readers feed the same planted posture before and after sunk; one low builder serves the static search and dynamic writes while each clock supplies its actual share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every write still reads its actual incoming posture and the original share; the balance search, ROM, plant goals and tolerance are unchanged, and no representative repetition replaces another repetition's clock.
   * @evidence contracts/development/implementation.md#efficient-algorithms One footing solve and original bounded balance search serve all R identical repetitions. Each selected fixed foot heading/contact prepares once across both plant stages and all trials/writes; actual knee transforms, trunk arithmetic and every leg goal remain, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The consumer explicitly shares only fixed body, stance, depth, inclination and selected leg geometry through Leg.prepareGoal; a changed one requires fresh preparation. Incoming posture, root/yaw, knee hints and share remain actual per-write inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function owns two foot frames, at most two bounded fixed-goal readers and one solved shift until its action ends. The search's trial readings do not survive preparation and no time-indexed history is kept.
   */
  export function prepareCrouch(
    props: Pick<IAutoMovieMotionHumanTrunk.ICrouch, "body" | "standing" | "depth" | "pitch" | "legs" | "balance">,
  ): (posture: IAutoMovieMotionHumanPosture, share: number) => IAutoMovieMotionHumanPosture {
    if (!(props.depth >= 0) || !(props.pitch >= 0))
      throw new Error("A crouch's depth and pitch are not negative");
    const legs: readonly AutoMovieHumanSide[] = props.legs ?? [
      "left",
      "right",
    ];
    const feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
      footing(props.body, props.standing);
    const plant: ReturnType<typeof preparePlanted> = preparePlanted(props.body, feet, legs);

    // The legs are planted before the hips sink, so `sunk` reads the thighs
    // the pelvis's share is limited by, and the knees bend as the root goes
    // down.
    const low = (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      back: number,
    ): IAutoMovieMotionHumanPosture =>
      plant(
        sunk(
          props.body,
          plant(posture),
          props.depth * share,
          props.pitch * share,
          back,
        ),
      );
    // Without the balance option the hips sink where they stand: no centre
    // of mass is read.
    const back: number = !HumanPhysics.balanced(props)
      ? 0
      : HumanBalance.shift(
          props.body,
          (b: number): IAutoMovieMotionHumanPosture => low(props.standing, 1, b),
        );
    return (posture: IAutoMovieMotionHumanPosture, share: number): IAutoMovieMotionHumanPosture =>
      low(posture, share, back * share);
  }

  /**
   * A counterbalance: the hips move back along the heading under a limb held
   * out ahead and come forward again as it returns (a kick's leg, a load at
   * arm's length), by the shift that puts the centre of mass of the extended
   * pose back over the feet.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param rise The instants the limb starts extending and is fullest at.
   * @param fall The instants the limb starts returning and is back at.
   * @param extended The action's posture at the limb's fullest extension.
   * @param balance The balancing shift asked (`IAutoMovieMotionHumanBalanceOption`); absent, the hips are not shifted and no centre of mass is read.
   * @returns The primitive, on the root.
   * @throws {HumanRefusal} `base` on `balance` when no place of the hips within `HumanBalance.REACH` brings the centre of mass inside the feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the two windows, which pose the shift is solved on and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A limb held out ahead moves the centre of mass forward, and the body answers by moving the hips back; the shift is the one `HumanBalance.shift` finds for the extended pose, applied along the heading by the clock's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve and one excursion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No distance is stated, and a pose already balanced solves to no shift; a pose no shift balances is refused with the measured remainder instead of being shown falling.
   * @evidence contracts/development/implementation.md#efficient-algorithms The balance is solved once when the phrase is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanBalance.shift`, `AutoMovieMotionHumanRoot.place` and `AutoMovieMotionHumanRoot.excursion`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive keeps the clock, the windows and one solved number; the extended posture is read only during the solve.
   */
  export function counterbalance(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    extended: IAutoMovieMotionHumanPosture,
    balance?: IAutoMovieMotionHumanBalanceOption,
  ): IAutoMovieMotionHumanPrimitive {
    // Without the balance option the hips stay where the action puts them:
    // no centre of mass is read and nothing is shifted.
    if (!HumanPhysics.balanced({ balance }))
      return AutoMovieMotionHumanRoot.excursion(clock, rise, fall, {
        point: { x: 0, y: 0, z: 0 },
        yaw: 0,
      });
    const shifted = (b: number): IAutoMovieMotionHumanPosture =>
      AutoMovieMotionHumanRoot.place(extended, {
        point: { x: 0, y: 0, z: -b },
        yaw: 0,
      });
    const back: number = HumanBalance.shift(
      body,
      shifted,
      // The extended posture is the caller's, so its hips may stand anywhere
      // the planted legs let them: a body tipped whole about its feet has
      // them most of a leg's length ahead.
      HumanBalance.REACH,
    );
    // No place of the hips holds the pose when the nearest one still leaves
    // the centre of mass outside the feet.
    const margin: number = HumanBalance.margin(body, shifted(back));
    if (back !== 0 && !(margin > 0)) {
      const ahead: number = HumanBalance.offset(body, shifted(back));
      throw new HumanRefusal({
        kind: "base",
        axis: "balance",
        value: Number(ahead.toFixed(4)),
        feasible: { kind: "range", minimum: null, maximum: 0, unit: "m" },
        reason: `the extended pose cannot be balanced over the feet: with the hips ${(back * 1000).toFixed(0)} mm back, the nearest place the search reaches, the centre of mass still stands ${(ahead * 1000).toFixed(0)} mm ahead of the middle of the feet where they bear and ${(-margin * 1000).toFixed(0)} mm outside the feet`,
        fix: "pitch the trunk less, hold the limbs nearer, or give the body a support or a step",
      });
    }
    return AutoMovieMotionHumanRoot.excursion(clock, rise, fall, {
      point: { x: 0, y: 0, z: -back },
      yaw: 0,
    });
  }
}

/** Both displayed foot frames; their parent closure is owned by canonical FK. */
const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(["leftFoot", "rightFoot"]);
