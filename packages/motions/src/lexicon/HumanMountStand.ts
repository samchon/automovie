import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { pelvisReachHeight } from "../posture/pelvisReachHeight";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanMountOnFrame } from "./HumanMountOnFrame";

/**
 * The pelvis of a rider getting astride from the floor onto a stirrup, who
 * stands in the near stirrup before the far leg swings over, as riding
 * instruction teaches the mount from the ground (the technique, not a
 * measured height): the near foot bears on its stirrup from its arrival,
 * and the pelvis rises at the climb's apex until that leg spans
 * `pelvisReachHeight.STRAIGHT` of its length from the hip to the stirrup's
 * ankle. While the foot bears, the pelvis keeps the hip within that span of
 * the ankle, moved toward the ankle along their line where the climb's
 * course would carry it further, so the bearing leg never leaves its
 * stirrup: the near leg is the pivot the climb turns about.
 *
 * @param props The climb's course and the near stirrup.
 * @returns The pelvis at a second of the climb.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the technique, the rise, the bound held while the foot bears and the pivot it makes.
 * @evidence contracts/development/implementation.md#principled-implementation The rise is Pythagoras on the apex hip's horizontal offset from the ankle; the hold is the projection of the hip onto the sphere of the near-straight span about the ankle, the nearest place the bearing leg reaches, applied to the whole pelvis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One rise read once, one projection a frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The span is the shared near-straight share; nothing is tuned.
 * @evidence contracts/development/implementation.md#efficient-algorithms One hip read a frame while the foot bears, and one at the apex once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `hipJoints`, the one owner of the hip joints, and the climb's own frame builder.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the props for the plan's life.
 */
export function HumanMountStand(
  props: HumanMountStand.IProps,
): (t: number) => HumanMountOnFrame.Frame {
  const { body, side, ankle }: HumanMountStand.IProps = props;
  const span: number =
    pelvisReachHeight.STRAIGHT * (body.measure.thigh + body.measure.shank);
  const hip = (frame: HumanMountOnFrame.Frame): IAutoMovieVector3 =>
    hipJoints(
      body,
      frame.root,
      resolveHumanPosture.heading(frame),
      frame.joints.hips,
    )[side];

  // The rise at the apex: the near leg straightened on its stirrup.
  const apex: IAutoMovieVector3 = hip(props.frame(props.hop)(props.apex));
  const across: number = Math.hypot(apex.x - ankle.x, apex.z - ankle.z);
  const rise: number =
    across < span
      ? Math.max(
          0,
          Math.sqrt(span * span - across * across) - (apex.y - ankle.y),
        )
      : 0;
  const base: (t: number) => HumanMountOnFrame.Frame = props.frame(
    props.hop + rise,
  );

  // While the foot bears, the hip stays within the bearing leg's span.
  return (t: number): HumanMountOnFrame.Frame => {
    const frame: HumanMountOnFrame.Frame = base(t);
    if (!(t >= props.bears && t <= props.until)) return frame;
    const at: IAutoMovieVector3 = hip(frame);
    const reach: IAutoMovieVector3 = Vector3.subtract(at, ankle);
    const distance: number = Vector3.length(reach);
    if (!(distance > span)) return frame;
    const shift: IAutoMovieVector3 = Vector3.scale(
      reach,
      span / distance - 1,
    );
    return { ...frame, root: Vector3.add(frame.root, shift) };
  };
}

/** What the standing pelvis reads. */
export namespace HumanMountStand {
  /** The climb's course and the near stirrup. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The near leg, the one that stands in its stirrup. */
    side: AutoMovieHumanSide;

    /** The near foot's ankle on its stirrup, world metres. */
    ankle: IAutoMovieVector3;

    /** The climb's frame builder over a rise above the seat, metres. */
    frame: (hop: number) => (t: number) => HumanMountOnFrame.Frame;

    /** The climb's own rise above the seat, metres. */
    hop: number;

    /** The climb's apex, seconds. */
    apex: number;

    /** The second the near foot bears on its stirrup. */
    bears: number;

    /** The second the seat takes the body, when the hold ends. */
    until: number;
  }
}
