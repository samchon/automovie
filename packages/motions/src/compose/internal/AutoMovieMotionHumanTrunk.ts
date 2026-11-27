import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRoot,
  IAutoMovieMotionHumanTrunk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../../everyday/internal/HumanBalance";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanJoints } from "./AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRoot } from "./AutoMovieMotionHumanRoot";

/*
 * Trunk phrases: the trunk turned on the pelvis, the body sunk into its knees,
 * and the hips moved back under a limb held out.
 *
 * The hip shifts are solved by HumanBalance.shift on the body at the
 * phrase's fullest pose and scaled between by the clock's envelope, so no shift
 * is stated as a constant.
 */
export namespace AutoMovieMotionHumanTrunk {
  /*
   * The chest's share of a trunk turn; the lumbar spine takes the rest.
   */
  export const CHEST: number = 0.6;

  /*
   * A turn: the trunk twists on the pelvis and comes back (the wind-up and the
   * rotation of a throw or a punch, a turn toward a neighbour).
   * Parameter clock: The action's clock.
   * Parameter rise: The instants the turn starts growing and is full at.
   * Parameter fall: The instants the turn starts shrinking and is gone at.
   * Parameter degrees: The twist at its fullest, degrees; positive toward the
   * performer's left.
   * Returns: The primitive, on the trunk.
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

  /*
   * Where a posture puts each foot: its ankle and its rotation as the posture
   * resolves, whether its legs are goals or joint angles alone.
   * Parameter body: The body.
   * Parameter posture: The posture.
   * Returns: Each foot's placement, world frame.
   */
  export function footing(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, posture, undefined, {}, resolution).pose,
      resolution(),
      HumanBoneGroups.FEET,
    );
    const at = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
    });
    return { left: at("left"), right: at("right") };
  }

  /*
   * A posture with legs planted on given feet: each named leg a planted goal on
   * its foot's placement, its knee hinted over the foot from the posture's
   * root, so lowering the root bends the knee instead of carrying the foot down
   * with it.
   * Parameter body: The body.
   * Parameter posture: The posture whose root carries the knees' rest places.
   * Parameter feet: Each foot's placement, world frame.
   * Parameter legs: The legs planted.
   * Returns: The posture with those legs' goals.
   */
  export function planted(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
    >,
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

  /*
   * Prepare fixed foot placements for repeated actual planted postures.
   * Parameter body: The unchanged body supplying rest knee/toe geometry.
   * Parameter feet: The unchanged ankle/rotation placements, borrowed for this
   * reader.
   * Parameter legs: The unchanged ordered legs to plant, both by default; duplicate
   * visits remain duplicate goal writes.
   * Returns: A fresh posture/limb map at each current root/yaw, with original
   * borrowed foot fields and fresh knee/contact values.
   */
  export function preparePlanted(
    body: IAutoMovieMotionHumanBody,
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    legs: readonly AutoMovieHumanSide[] = ["left", "right"],
  ): (posture: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture {
    const goals: Partial<
      Record<
        AutoMovieHumanSide,
        ReturnType<typeof AutoMovieMotionHumanLeg.prepareGoal>
      >
    > = {};
    for (const side of legs)
      if (goals[side] === undefined)
        goals[side] = AutoMovieMotionHumanLeg.prepareGoal(
          body,
          side,
          feet[side],
          true,
        );
    return (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of legs) limbs[`${side}Leg`] = goals[side]!(posture);
      return { ...posture, limbs };
    };
  }
  /*
   * A posture sunk into its knees: the hips lowered and moved back along the
   * heading, and the trunk inclined forward over them by the lumbopelvic rhythm
   * (`HumanTrunk.incline`), the pelvis taking no more than the planted legs'
   * hip flexion leaves it (`HumanTrunk.pelvisLimit`) and the spine the rest.
   * The legs keep their goals. The hips start where the posture's own heading
   * (its yaw, pitch and roll) puts them, so a posture already pitched (a lean
   * an earlier action left) at no depth, back or inclination is returned in
   * place.
   * Parameter body: The body.
   * Parameter posture: The posture, its pelvis level or already pitched.
   * Parameter depth: How far the hips sink, metres.
   * Parameter inclination: The trunk's forward inclination, degrees.
   * Parameter back: How far the hips move back along the heading, metres.
   * Returns: The sunk posture.
   */
  export function sunk(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    depth: number,
    inclination: number,
    back: number,
  ): IAutoMovieMotionHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    // The hips where the posture's own heading puts them, then lowered and
    // moved back along the yaw.
    const goal: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        posture.root,
        Quaternion.rotateVector(humanPostureHeading(posture), hips),
      ),
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: 0, y: -depth, z: -back },
      ),
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
        Quaternion.rotateVector(humanPostureHeading(tipped), hips),
      ),
    };
  }

  /*
   * A crouch: the hips sink and the trunk inclines forward over them (`sunk`),
   * the hips moved so the centre of mass stays over the feet where they bear,
   * back over flat feet and forward over a forefoot whose heel the ankle's
   * range lifts, and the body stands again (a duck, the dip before a jump, a
   * load taken into the legs). The crouch plants its legs itself on the feet
   * the standing posture shows (`footing`, `planted`), so the knees bend under
   * the sinking hips whatever the action before it left: a stance with leg
   * goals, or an exercise whose legs are joint angles alone, under which a root
   * lowered without goals would carry straight legs through the floor.
   * Parameter props: The body, the standing posture, the windows, the depth, the
   * pitch and the legs planted.
   * Returns: The primitive, on the root, the trunk and the planted legs.
   * When the depth or the pitch is negative.
   */
  export function crouch(
    props: IAutoMovieMotionHumanTrunk.ICrouch,
    window: HumanPhysics.Window = HumanPhysics.fromClock(
      props,
      { balance: { by: "hips" } },
      0,
      props.clock,
    ),
  ): IAutoMovieMotionHumanPrimitive {
    if (window?.by === "trunk")
      HumanPhysics.unsupported(
        window.by,
        "the crouch prescribes the trunk pitch and moves the hips under it",
      );
    const lower: ReturnType<typeof prepareCrouch> = prepareCrouch(
      props,
      window,
    );
    const legs: readonly AutoMovieHumanSide[] = props.legs ?? ["left", "right"];
    return {
      channels: [
        "root",
        "trunk",
        ...legs.map((side: AutoMovieHumanSide): CrouchResult => `${side}Leg`),
      ],
      from: props.clock.at(props.rise[0]),
      to: props.clock.at(props.fall[1]),
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture =>
        lower(
          posture,
          props.clock.envelope(props.rise, props.fall, seconds),
          HumanPhysics.weightAt(window, seconds),
        ),
    };
  }

  /*
   * Prepare one crouch's planted feet and full-depth balance shift so repeated
   * clock windows can apply the same geometry with their own share. The body,
   * standing posture and dimensional inputs remain unchanged for the returned
   * reader's lifetime; a different stance or depth prepares anew.
   * Parameter props: The body, fixed stance, hip displacement, inclination and
   * planted legs.
   * Returns: A posture writer at the supplied share in [0, 1], without a clock
   * or sampled pose cache.
   * When depth or pitch is negative or non-numeric.
   */
  export function prepareCrouch(
    props: IAutoMovieMotionHumanTrunk.IShape,
    window?: HumanPhysics.Window,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    weight?: number,
  ) => IAutoMovieMotionHumanPosture {
    if (window === undefined)
      HumanPhysics.fixed(
        props,
        "a geometric crouch share has no event clock for a timed balance correction",
      );
    if (!(props.depth >= 0) || !(props.pitch >= 0))
      throw new Error("A crouch's depth and pitch are not negative");
    const displacement: number = props.back ?? 0;
    if (!Number.isFinite(displacement))
      throw new Error("A crouch's backward distance must be finite");
    const legs: readonly AutoMovieHumanSide[] = props.legs ?? ["left", "right"];
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = footing(props.body, props.standing);
    const plant: ReturnType<typeof preparePlanted> = preparePlanted(
      props.body,
      feet,
      legs,
    );

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
          back + displacement * share,
        ),
      );
    // Optional balance adds one prepared correction to the geometric path.
    const back: number =
      window === undefined || window === null
        ? 0
        : HumanBalance.shift(
            props.body,
            (b: number): IAutoMovieMotionHumanPosture =>
              low(props.standing, 1, b),
          );
    return (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      weight: number = 0,
    ): IAutoMovieMotionHumanPosture =>
      low(posture, share, back * share * weight);
  }

  /*
   * A counterbalance: the hips move back along the heading under a limb held
   * out ahead and come forward again as it returns (a kick's leg, a load at
   * arm's length), by the shift that puts the centre of mass of the extended
   * pose back over the feet.
   * Parameter body: The body.
   * Parameter clock: The action's clock.
   * Parameter rise: The instants the limb starts extending and is fullest at.
   * Parameter fall: The instants the limb starts returning and is back at.
   * Parameter extended: The action's posture at the limb's fullest extension.
   * Parameter balance: The balancing shift asked (`IAutoMovieMotionHumanBalance`);
   * absent, the hips are not shifted and no centre of mass is read.
   * Returns: The primitive, on the root.
   * `base` on `balance` when no place of the hips within
   * `HumanBalance.REACH` brings the centre of mass inside the feet.
   */
  export function counterbalance(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    extended: IAutoMovieMotionHumanPosture,
    balance?: IAutoMovieMotionHumanBalance,
  ): IAutoMovieMotionHumanPrimitive {
    // Without the balance option the hips stay where the action puts them:
    // no centre of mass is read and nothing is shifted.
    const window: HumanPhysics.Window = HumanPhysics.fromClock(
      { balance },
      { balance: { by: "hips" } },
      0,
      clock,
    );
    if (window?.by === "trunk")
      HumanPhysics.unsupported(
        window.by,
        "the counterbalance primitive moves the root under the extended limb",
      );
    if (window === null)
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
    return AutoMovieMotionHumanRoot.travel({
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset => ({
        point: {
          x: 0,
          y: 0,
          z:
            -back *
            clock.envelope(rise, fall, seconds) *
            HumanPhysics.weightAt(window, seconds),
        },
        yaw: 0,
      }),
    });
  }
}

/*
 * The alternatives of `CrouchResult`'s site.
 */
type CrouchResult = "leftLeg" | "rightLeg";
