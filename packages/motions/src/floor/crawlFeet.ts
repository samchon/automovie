import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { kneelKeys } from "../everyday/kneelKeys";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The feet of a crawl on the knees: each tucked on its toes behind its knee
 * (`kneelKeys.tucked`), the crawl placed so the tucked feet are where the
 * standing feet roll onto their toes, and the roll that takes a standing
 * foot there without its toes sliding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three pieces and what each gives.
 * @evidence contracts/development/design.md#principled-representation Pure functions of the body and the standing feet, read by the crawl and its way down.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tuck's record, the roll and the placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is solved on the body and the range table; nothing is a length typed in metres.
 */
export namespace crawlFeet {
  /**
   * A foot tucked behind its knee, carried with the knee.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
   * @evidence contracts/development/design.md#principled-representation The foot solved once and its place from the knee.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the crawl.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The foot is `kneelKeys.tucked`'s.
   */
  export interface ITuck {
    /** The foot, solved at the knee's nominal place. */
    foot: kneelKeys.IFoot;

    /** The toes' joint from the knee joint, world metres. */
    offset: IAutoMovieVector3;
  }

  /**
   * A standing foot rolled onto its toes: the heel rises about the toes'
   * joint, the toes staying flat on the floor, until the toes reach their
   * extension range, and from there the foot turns on the tips of its toes,
   * the toes held at that range. The foot's turn to its tucked heading is
   * taken about the toes' tip throughout, so the toes never slide.
   *
   * @param body The body.
   * @param side The foot.
   * @param standing The standing foot's placement.
   * @param heading The heading the foot turns to as it rolls, degrees about +Y.
   * @param lift The heel's lift at the end of the roll, degrees.
   * @param share How far through the roll, in [0, 1].
   * @returns The foot's placement, its toes' extension in degrees and its toes' joint, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two pivots, why and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A foot rolling onto its toes pitches about the metatarsophalangeal joints while the toes lie flat, then about the toes' tips once the toes are at their range (the forefoot rocker, Perry and Burnfield); its heading turns about the tip that bears, the contact held by `HumanFoot`'s offsets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range is read from the range table; the heading turns about the contact that bears.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rolled(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    standing: IAutoMovieMotionHumanFoot.IPlacement,
    heading: number,
    lift: number,
    share: number,
  ): { placement: IAutoMovieMotionHumanFoot.IPlacement; toes: number; mtp: IAutoMovieVector3; } {
    return prepareRoll(body, side, standing, heading, lift)(share);
  }

  /**
   * Prepare a fixed standing foot's roll for independent progress queries.
   * The heading, toe range and standing toes' tip are invariant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs and independent progress; rolled documents units and the two contact phases.
   * @evidence contracts/development/implementation.md#principled-implementation The toes' tip bears throughout: with the toes flat the heel's pitch about their joint leaves the tip in place, so one placement about the standing tip serves both phases, the toes' extension capped at their range; the heading turns about that tip toward the tucked heading along the shortest arc, as angle blends must, whatever turn of the circle the yaw is written in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed geometry precedes one evaluator about one point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not change the toe-extension range, heading interpolation or endpoint progress.
   * @evidence contracts/development/implementation.md#efficient-algorithms The heading, range, tip and the native toe offset and MTP point readers are prepared once; each share is one rotation and one offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body and standing placement, heading and lift establish the invariant geometry. Native HumanFoot readers share only fixed socket/rest prerequisites; current progress, rotation, articulation and placement are independently evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One owning plan retains its tip, scalar limits, one MTP point reader and one offset reader until release; no pose, solver reader or history is cached.
   */
  export function prepareRoll(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    standing: IAutoMovieMotionHumanFoot.IPlacement,
    heading: number,
    lift: number,
  ): (share: number) => {
    placement: IAutoMovieMotionHumanFoot.IPlacement;
    toes: number;
    mtp: IAutoMovieVector3;
  } {
    const from: number = HumanFoot.heading(standing.rotation);
    const extension: number = Math.min(
      lift,
      AutoMovieMotionHumanRange.limit(`${side}Toes`, "flexion") ?? lift,
    );
    const mtpAt: ReturnType<typeof HumanFoot.preparePoint> =
      HumanFoot.preparePoint(body, side, "mtp");
    const offset: ReturnType<typeof HumanFoot.prepareOffset> =
      HumanFoot.prepareOffset(body, side, "toe");

    // The standing heading is read off the foot in (-180, 180] while the
    // tucked heading is the body's yaw as written, so the turn is taken the
    // short way round: a body facing 270 degrees would otherwise spin its
    // foot almost a whole turn as it rolls.
    const turn: number = ((((heading - from) % 360) + 540) % 360) - 180;

    // The toes' tip bears throughout: while the toes lie flat the heel's
    // pitch about the toes' joint leaves the tip where it stood, and once
    // they reach their range the foot turns on it. The heading's turn is
    // taken about that tip too; taken about the toes' joint, it would sweep
    // the flat toes across the floor.
    const tip: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      "toe",
      standing,
      0,
    );
    return (
      share: number,
    ): {
      placement: IAutoMovieMotionHumanFoot.IPlacement;
      toes: number;
      mtp: IAutoMovieVector3;
    } => {
      const q: number = lift * share;
      const toes: number = Math.min(q, extension);
      const rotation: IAutoMovieQuaternion = HumanFoot.rotation(
        from + (turn * q) / lift,
        -q,
      );
      const placement: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: Vector3.subtract(
          tip,
          Quaternion.rotateVector(rotation, offset(toes)),
        ),
        rotation,
      };
      return { placement, toes, mtp: mtpAt(placement) };
    };
  }

  /**
   * The feet a crawl kneels on, and the floor frame that keeps them where
   * the standing feet were: each foot tucked behind its knee
   * (`kneelKeys.tucked`), the frame moved along the heading and each tucked
   * foot across it until its toes' joint is where the standing foot rolls
   * onto its toes (`rolled`), so the feet do not slide as the body gets
   * down.
   *
   * @param body The body.
   * @param standing The standing posture, its feet on their goals.
   * @param measured The floor frame under the standing root.
   * @param knees Each knee joint's nominal place, metres in that frame.
   * @param ahead How far before its nominal place each knee lands, metres along the heading.
   * @returns The frame and the tucked feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, what is moved, why, and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The tucked foot is the kneel's; the frame's move is the feet's mean difference along the heading, and each foot's own difference across it stays with that foot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One tuck and one roll per side, then one move.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each foot is rolled from its own standing foot.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two tucked feet, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function planted(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
    measured: IAutoMovieMotionHumanFrame,
    knees: Record<"left" | "right", IAutoMovieVector3>,
    ahead: number,
  ): { frame: IAutoMovieMotionHumanFrame; tucks: Record<"left" | "right", ITuck>; } {
    const forward: IAutoMovieVector3 = HumanFrame.forward(measured.yaw);
    const sides = ["left", "right"] as const;
    const feet = sides.map((side: "left" | "right") => {
      const goal: IAutoMovieHumanLimbGoal = standing.limbs[`${side}Leg`]!;
      const placement: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(measured.yaw),
      };
      const at: IAutoMovieVector3 = HumanFrame.point(measured, knees[side]);
      const foot: kneelKeys.IFoot = kneelKeys.tucked(
        body,
        side,
        at,
        measured.yaw,
        HumanFoot.point(body, side, "mtp", placement).y,
      );
      const toes: IAutoMovieVector3 = rolled(
        body,
        side,
        placement,
        foot.heading,
        -foot.pitch,
        1,
      ).mtp;
      const off: IAutoMovieVector3 = Vector3.subtract(toes, foot.at);
      const along: number = Vector3.dot(off, forward);
      const across: IAutoMovieVector3 = {
        ...Vector3.subtract(off, Vector3.scale(forward, along)),
        y: 0,
      };
      return {
        along,
        tuck: {
          foot: { ...foot, at: Vector3.add(foot.at, across) },
          offset: Vector3.add(Vector3.subtract(foot.at, at), across),
        },
      };
    });
    return {
      frame: {
        origin: Vector3.add(
          measured.origin,
          Vector3.scale(forward, (feet[0]!.along + feet[1]!.along) / 2 - ahead),
        ),
        yaw: measured.yaw,
      },
      tucks: { left: feet[0]!.tuck, right: feet[1]!.tuck },
    };
  }
}
