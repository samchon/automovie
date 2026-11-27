import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLeg,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

/*
 * Leg primitives: a foot kept on the floor, and a foot lifted and set down
 * somewhere else.
 *
 * A foot is a placement of its ankle and its rotation (HumanFoot), and
 * the leg is an effector goal solved by inverse kinematics. A planted foot
 * declares its toes' joint as the goal's contact, so where the ankle cannot
 * hold the foot flat the heel rises about the ball and the foot does not slide
 * (`HumanFoot.heelOff`). The knee bends over the foot: its hint is ahead of the
 * knee's rest place along the foot's own heading (Perry and Burnfield, Gait
 * Analysis, 2nd ed.).
 */
export namespace AutoMovieMotionHumanLeg {
  /*
   * A foot on its way from one placement to another: the ankle on the straight
   * line between them raised by `4 c s (1 - s)`, a parabola that leaves and
   * lands at the floor and peaks at the clearance `c` half way, and the
   * rotation turned by spherical interpolation.
   * Parameter from: The placement at progress 0.
   * Parameter to: The placement at progress 1.
   * Parameter clearance: The ankle's greatest rise, metres.
   * Parameter progress: How far along, in [0, 1].
   * Returns: The placement.
   */
  export function arc(
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    clearance: number,
    progress: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const s: number = Math.min(1, Math.max(0, progress));
    return {
      ankle: swingAnkle(from.ankle, to.ankle, clearance, s),
      rotation: Quaternion.slerp(from.rotation, to.rotation, s),
    };
  }

  /*
   * Prepare repeated actual progress reads of one fixed foot swing.
   * Parameter from: The unchanged departure placement, borrowed for this reader.
   * Parameter to: The unchanged landing placement, borrowed for this reader.
   * Parameter clearance: The unchanged greatest ankle rise, metres.
   * Returns: Fresh ankle and rotation at every actual share, clamped exactly as
   * arc.
   */
  export function prepareArc(
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    clearance: number,
  ): (progress: number) => IAutoMovieMotionHumanFoot.IPlacement {
    const turn: ReturnType<typeof Quaternion.prepareSlerp> =
      Quaternion.prepareSlerp(from.rotation, to.rotation);
    const ankle: ReturnType<typeof Vector3.prepareLerp> = Vector3.prepareLerp(
      from.ankle,
      to.ankle,
    );
    return (progress: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const s: number = Math.min(1, Math.max(0, progress));
      return { ankle: raised(ankle(s), clearance, s), rotation: turn(s) };
    };
  }

  /*
   * The limb goal that puts a foot on a placement.
   * Parameter body: The body.
   * Parameter posture: The posture whose root carries the knee's rest place.
   * Parameter side: The leg.
   * Parameter placement: The foot's placement.
   * Parameter planted: Whether the foot bears on the floor.
   * Returns: The goal.
   */
  export function goal(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, GoalPosture>,
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    planted: boolean,
  ): IAutoMovieHumanLimbGoal {
    const point: IAutoMovieVector3 = placement.ankle;
    const rotation: IAutoMovieQuaternion = placement.rotation;
    return goalAt(
      body,
      posture,
      side,
      point,
      rotation,
      planted,
      HumanFoot.heading(placement.rotation),
    );
  }

  /*
   * Prepare an unchanged foot placement for current root-dependent leg goals.
   * Parameter body: The unchanged body supplying the knee and toe rest geometry.
   * Parameter side: The leg.
   * Parameter placement: The unchanged ankle point and foot rotation, borrowed
   * without mutation.
   * Parameter planted: Whether every emitted goal bears on the floor.
   * Returns: A fresh goal with an actual current knee hint; point/rotation
   * retain goal's borrowed placement convention and contacts are fresh
   * vectors.
   */
  export function prepareGoal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    planted: boolean,
  ): (
    posture: Pick<IAutoMovieMotionHumanPosture, PrepareGoalPostureResult>,
  ) => IAutoMovieHumanLimbGoal {
    const point: IAutoMovieVector3 = placement.ankle;
    const rotation: IAutoMovieQuaternion = placement.rotation;
    const read: ReturnType<typeof placementReader> = placementReader(
      body,
      side,
      rotation,
      planted,
    );
    return (
      posture: Pick<IAutoMovieMotionHumanPosture, PrepareGoalPosture>,
    ): IAutoMovieHumanLimbGoal => read(posture, point, rotation, planted);
  }

  /*
   * Prepare fixed foot-rotation geometry for varying ankle and bearing goals.
   * Parameter body: The unchanged body supplying rest knee/toe geometry.
   * Parameter side: The leg.
   * Parameter rotation: The copied fixed quaternion values used only when every
   * current component matches by Object.is.
   * Returns: A reader of actual posture/root/yaw, ankle/rotation placement and
   * bearing. Goals/contacts are fresh while ankle/rotation retain goal's
   * borrowed-reference convention; a changed rotation uses ordinary cold goal
   * geometry.
   */
  export function preparePlacement(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion,
  ): (
    posture: Pick<IAutoMovieMotionHumanPosture, PreparePlacementPostureResult>,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    planted: boolean,
  ) => IAutoMovieHumanLimbGoal {
    const read: ReturnType<typeof placementReader> = placementReader(
      body,
      side,
      rotation,
    );
    return (
      posture: Pick<IAutoMovieMotionHumanPosture, PreparePlacementPosture>,
      placement: IAutoMovieMotionHumanFoot.IPlacement,
      planted: boolean,
    ): IAutoMovieHumanLimbGoal =>
      read(posture, placement.ankle, placement.rotation, planted);
  }

  /*
   * A leg whose foot follows a placement.
   * Parameter props: The movement.
   * Returns: The primitive, on the leg's channel.
   */
  export function place(
    props: IAutoMovieMotionHumanLeg.IPlace,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: PlaceLimb = `${props.side}Leg`;
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          [limb]: goal(
            props.body,
            posture,
            props.side,
            props.placement(posture, seconds),
            props.planted(seconds),
          ),
        },
      }),
    };
  }

  /*
   * A foot kept planted on one placement between two instants.
   * Parameter body: The body.
   * Parameter clock: The action's clock.
   * Parameter side: The leg.
   * Parameter window: The instants the plant starts and ends at.
   * Parameter at: Where the foot stands.
   * Returns: The primitive.
   */
  export function plant(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    at: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieMotionHumanPrimitive {
    const primitive: IAutoMovieMotionHumanPrimitive = place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (): IAutoMovieMotionHumanFoot.IPlacement => at,
      planted: (): boolean => true,
    });
    return { ...primitive, reads: ["root", `${side}Leg`] };
  }

  /*
   * A foot lifted from one placement and set down on another between two
   * instants, on the clock's minimum-jerk progress along arc. The foot
   * is free inside the window and planted at its last instant.
   * Parameter body: The body.
   * Parameter clock: The action's clock.
   * Parameter side: The leg.
   * Parameter window: The instants the foot leaves and lands at.
   * Parameter from: Where the foot leaves.
   * Parameter to: Where the foot lands.
   * Parameter clearance: The ankle's greatest rise, metres.
   * Returns: The primitive.
   */
  export function step(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    from: IAutoMovieMotionHumanFoot.IPlacement,
    to: IAutoMovieMotionHumanFoot.IPlacement,
    clearance: number,
  ): IAutoMovieMotionHumanPrimitive {
    const primitive: IAutoMovieMotionHumanPrimitive = place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (
        _: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanFoot.IPlacement =>
        arc(from, to, clearance, clock.progress(window[0], window[1], seconds)),
      planted: (seconds: number): boolean =>
        clock.linear(window[0], window[1], seconds) >= 1,
    });
    return { ...primitive, reads: ["root", `${side}Leg`] };
  }
}

/*
 * The alternatives of `PlaceLimb`'s site.
 */
type PlaceLimb = "leftLeg" | "rightLeg";

/*
 * The alternatives of `PreparePlacementPosture`'s site.
 */
type PreparePlacementPosture = "root" | "yaw";

/*
 * The alternatives of `PreparePlacementPostureResult`'s site.
 */
type PreparePlacementPostureResult = "root" | "yaw";

/*
 * The alternatives of `PrepareGoalPosture`'s site.
 */
type PrepareGoalPosture = "root" | "yaw";

/*
 * The alternatives of `PrepareGoalPostureResult`'s site.
 */
type PrepareGoalPostureResult = "root" | "yaw";

/*
 * The alternatives of `GoalPosture`'s site.
 */
type GoalPosture = "root" | "yaw";

/*
 * The original ankle interpolation and parabolic lift, with unchanged grouping.
 */
function swingAnkle(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  clearance: number,
  share: number,
): IAutoMovieVector3 {
  return raised(Vector3.lerp(from, to, share), clearance, share);
}

/*
 * Raise only a genuine fresh interpolation result with the original parabola.
 */
function raised(
  ankle: IAutoMovieVector3,
  clearance: number,
  share: number,
): IAutoMovieVector3 {
  ankle.y = ankle.y + 4 * clearance * share * (1 - share);
  return ankle;
}

/*
 * The same borrowed placement, current knee and optional fresh contact goal
 * fields.
 */
function formed(
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  bend: IAutoMovieVector3,
  contact: IAutoMovieVector3 | undefined,
): IAutoMovieHumanLimbGoal {
  return {
    point,
    rotation,
    bend,
    ...(contact === undefined ? {} : { planted: true, contact }),
  };
}
/*
 * The alternatives of `GoalAtPosture`'s site.
 */
type GoalAtPosture = "root" | "yaw";

/*
 * Original cold heading, current knee and actual bearing-contact admission
 * order.
 */
function goalAt(
  body: IAutoMovieMotionHumanBody,
  posture: Pick<IAutoMovieMotionHumanPosture, GoalAtPosture>,
  side: AutoMovieHumanSide,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  planted: boolean,
  heading: number = HumanFoot.heading(rotation),
): IAutoMovieHumanLimbGoal {
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.knee(
    body,
    posture,
    side,
    heading,
  );
  return formed(
    point,
    rotation,
    bend,
    planted ? HumanFoot.offset(body, side, "mtp") : undefined,
  );
}
/*
 * The alternatives of `PlacementReaderPosture`'s site.
 */
type PlacementReaderPosture = "root" | "yaw";

/*
 * The alternatives of `PlacementReaderPostureResult`'s site.
 */
type PlacementReaderPostureResult = "root" | "yaw";

/*
 * Genuine fixed-rotation producer shared by both actual prepared-placement
 * APIs.
 */
function placementReader(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  fixed: IAutoMovieQuaternion,
  mayPlant: boolean = true,
): (
  posture: Pick<IAutoMovieMotionHumanPosture, PlacementReaderPostureResult>,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  planted: boolean,
) => IAutoMovieHumanLimbGoal {
  const x: number = fixed.x;
  const y: number = fixed.y;
  const z: number = fixed.z;
  const w: number = fixed.w;
  const knee: ReturnType<typeof AutoMovieMotionHumanBend.prepareKnee> =
    AutoMovieMotionHumanBend.prepareKnee(body, side, HumanFoot.heading(fixed));
  const contact: IAutoMovieVector3 | undefined = mayPlant
    ? HumanFoot.offset(body, side, "mtp")
    : undefined;
  return (
    posture: Pick<IAutoMovieMotionHumanPosture, PlacementReaderPosture>,
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    planted: boolean,
  ): IAutoMovieHumanLimbGoal => {
    if (
      !Object.is(rotation.x, x) ||
      !Object.is(rotation.y, y) ||
      !Object.is(rotation.z, z) ||
      !Object.is(rotation.w, w)
    )
      return goalAt(body, posture, side, point, rotation, planted);
    const bend: IAutoMovieVector3 = knee(posture);
    return formed(
      point,
      rotation,
      bend,
      planted && contact !== undefined ? { ...contact } : undefined,
    );
  };
}
