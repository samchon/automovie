import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEvaluation,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArmTarget } from "./AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";

/** A named target hand's literal finger shape. */
type Shape = IAutoMovieMotionHumanHand.Shape;

/** The original finger interpolation in an owned joint record. */
type FingerWriter = ReturnType<
  typeof AutoMovieMotionHumanHand.prepareFingerWriter
>;

/** A move may name a form known to the law during preparation. */
type Move = IAutoMovieMotionHumanArmTarget.IMove & {
  /** The expected fixed form, when the target owns one. */
  fixedShape?: Shape;
};

/** The alternatives of `MoveLimb`'s site. */
type MoveLimb = "leftArm" | "rightArm";

/**
 * An arm moved between an origin and a target by a weight, and the three
 * windows of it a phrase is made of: the reach, the hold and the retract.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them.
 */
export namespace AutoMovieMotionHumanArmMove {
  /**
   * An arm moved between an origin and a target by a weight.
   *
   * @param props The movement.
   * @returns The primitive, on the arm's and the hand's channels.
   */
  export function move(props: Move): IAutoMovieMotionHumanPrimitive {
    const limb: MoveLimb = `${props.side}Arm`;
    const fingers: (shape: Shape) => FingerWriter = prepareMoveFingers(
      props.side,
      props.fixedShape,
    );
    const write = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[2],
      projection?: Parameters<IAutoMovieMotionHumanArmTarget.Frame>[3],
      evaluation?: IAutoMovieMotionHumanEvaluation,
    ): IAutoMovieMotionHumanPosture => {
      const target: IAutoMovieMotionHumanArmTarget.ITarget = props.target(
        posture,
        seconds,
        resolution,
        projection,
        evaluation,
      );
      const s: number = Math.min(1, Math.max(0, props.weight(seconds)));
      const placed: IAutoMovieMotionHumanArmTarget.ITarget =
        s >= 1
          ? target
          : {
              ...target,
              point: bowed(
                posture,
                props.side,
                AutoMovieMotionHumanArmTarget.point(posture, props.origin),
                target.point,
                s,
                props.curvature ?? 0,
              ),
              rotation: Quaternion.slerp(
                Quaternion.multiply(
                  HumanFrame.turn(posture.yaw),
                  props.origin.rotation,
                ),
                target.rotation,
                s,
              ),
            };
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
      fingers(target.shape)(joints, target.curl ?? 0, s);
      return {
        ...posture,
        joints,
        limbs: {
          ...posture.limbs,
          [limb]: AutoMovieMotionHumanArmTarget.goal(
            props.body,
            props.side,
            placed,
          ),
        },
      };
    };
    return {
      channels: [limb, `${props.side}Hand`],
      from: props.from,
      to: props.to,
      write,
    };
  }

  /**
   * A point of a path from one point to another that bows out to the arm's own
   * side: the straight path's point plus a sideways deviation that is greatest
   * at the middle and none at both ends (EMOTE's indirect Space). The side is
   * the performer's left for the left arm and right for the right, less its
   * part along the path; a path that runs sideways bows up.
   */
  const bowed = (
    posture: Pick<IAutoMovieMotionHumanPosture, "yaw">,
    side: AutoMovieHumanSide,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
    curvature: number,
  ): IAutoMovieVector3 => {
    const straight: IAutoMovieVector3 = Vector3.lerp(from, to, share);
    const path: IAutoMovieVector3 = Vector3.subtract(to, from);
    const length: number = Vector3.length(path);
    if (curvature === 0 || length < 1e-9) return straight;
    const along: IAutoMovieVector3 = Vector3.scale(path, 1 / length);
    const across = (axis: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(axis, Vector3.scale(along, Vector3.dot(axis, along)));
    const outward: IAutoMovieVector3 = across(
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      ),
    );
    const direction: IAutoMovieVector3 =
      Vector3.length(outward) > 0.1 ? outward : across({ x: 0, y: 1, z: 0 });
    return Vector3.add(
      straight,
      Vector3.scale(
        Vector3.normalize(direction),
        curvature * length * Math.sin(Math.PI * share),
      ),
    );
  };

  /**
   * A hand carried from an origin to its target between two instants, on the
   * clock's minimum-jerk progress.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the reach starts and arrives at.
   * @param from Where the hand starts.
   * @param target The target.
   * @returns The primitive.
   */
  export function reach(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    from: IAutoMovieMotionHumanArmTarget.IOrigin,
    target: IAutoMovieMotionHumanArmTarget.Frame,
  ): IAutoMovieMotionHumanPrimitive {
    const progress: (seconds: number) => number = progressOn(clock, window);
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: from,
      target,
      weight: progress,
    });
  }

  /**
   * A hand kept on its target between two instants; the target may move (a
   * stroke's path, a partner's hand, a carried prop).
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the hold starts and ends at.
   * @param target The target.
   * @returns The primitive.
   */
  export function hold(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    target: IAutoMovieMotionHumanArmTarget.Frame,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: { point: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
      target,
      weight: (): number => 1,
    });
  }

  /**
   * A hand taken from its target back to an origin between two instants, on the
   * clock's minimum-jerk progress.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the retraction starts and arrives at.
   * @param target The target the hand leaves.
   * @param to Where the hand ends.
   * @returns The primitive.
   */
  export function retract(
    body: IAutoMovieMotionHumanBody,
    clock: IAutoMovieMotionClock,
    side: AutoMovieHumanSide,
    window: readonly [string, string],
    target: IAutoMovieMotionHumanArmTarget.Frame,
    to: IAutoMovieMotionHumanArmTarget.IOrigin,
  ): IAutoMovieMotionHumanPrimitive {
    const progress: (seconds: number) => number = progressOn(clock, window);
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: to,
      target,
      weight: (seconds: number): number => 1 - progress(seconds),
    });
  }
}

/** Prepare the law's one fixed form or the named forms of a varying target. */
function prepareMoveFingers(
  side: AutoMovieHumanSide,
  fixed: Shape | undefined,
): (shape: Shape) => FingerWriter {
  const prepare: typeof AutoMovieMotionHumanHand.prepareFingerWriter =
    AutoMovieMotionHumanHand.prepareFingerWriter;
  if (fixed !== undefined) {
    const writer: FingerWriter = prepare(side, fixed);
    return (shape: Shape): FingerWriter =>
      shape === fixed ? writer : prepare(side, shape);
  }
  const writers: Record<Shape, FingerWriter> = {
    relaxed: prepare(side, "relaxed"),
    flat: prepare(side, "flat"),
    point: prepare(side, "point"),
    fist: prepare(side, "fist"),
    bridge: prepare(side, "bridge"),
  };
  return (shape: Shape): FingerWriter => writers[shape];
}

/**
 * The window's minimum-jerk progress, its two instants resolved once
 * (`AutoMovieMotionClock.prepare`).
 */
function progressOn(
  clock: IAutoMovieMotionClock,
  window: readonly [string, string],
): (seconds: number) => number {
  const read: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, window[0], window[1]);
  return (seconds: number): number => read.progress(seconds);
}
