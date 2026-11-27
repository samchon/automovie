import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { kneelKeys } from "../../everyday/internal/kneelKeys";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import type { humanFootOffset } from "../../posture/internal/humanFootOffset";

/**
 * The feet of a crawl on the knees: each tucked on its toes behind its knee
 * (`kneelKeys.tucked`), the crawl placed so the tucked feet are where the
 * standing feet roll onto their toes, and the roll that takes a standing foot
 * there without its toes sliding.
 */
export namespace crawlFeet {
  /** A foot tucked behind its knee, carried with the knee. */
  export interface ITuck {
    /** The foot, solved at the knee's nominal place. */
    foot: kneelKeys.IFoot;

    /** The toes' joint from the knee joint, world metres. */
    offset: IAutoMovieVector3;
  }

  /**
   * A standing foot rolled onto its toes: the heel rises about the toes' joint,
   * the toes staying flat on the floor, until the toes reach their extension
   * range, and from there the foot turns on the tips of its toes, the toes held
   * at that range. The foot's turn to its tucked heading is taken about the
   * toes' tip throughout, so the toes never slide.
   *
   * @param body The body.
   * @param side The foot.
   * @param standing The standing foot's placement.
   * @param heading The heading the foot turns to as it rolls, degrees about +Y.
   * @param lift The heel's lift at the end of the roll, degrees.
   * @param share How far through the roll, in [0, 1].
   * @returns The foot's placement, its toes' extension in degrees and its toes'
   *   joint, world metres.
   */
  export function rolled(
    body: humanFootOffset.IBody,
    side: AutoMovieHumanSide,
    standing: IAutoMovieMotionHumanFoot.IPlacement,
    heading: number,
    lift: number,
    share: number,
  ): IRolledResult {
    return prepareRoll(body, side, standing, heading, lift)(share);
  }

  /**
   * Prepare a fixed standing foot's roll for independent progress queries. The
   * heading, toe range and standing toes' tip are invariant.
   */
  export function prepareRoll(
    body: humanFootOffset.IBody,
    side: AutoMovieHumanSide,
    standing: IAutoMovieMotionHumanFoot.IPlacement,
    heading: number,
    lift: number,
  ): (share: number) => IPrepareRollResult {
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
    return (share: number): IPrepareRollResult2 => {
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
   * The feet a crawl kneels on, and the floor frame that keeps them where the
   * standing feet were: each foot tucked behind its knee (`kneelKeys.tucked`),
   * the frame moved along the heading and each tucked foot across it until its
   * toes' joint is where the standing foot rolls onto its toes (`rolled`), so
   * the feet do not slide as the body gets down.
   *
   * @param body The body.
   * @param standing The standing posture, its feet on their goals.
   * @param measured The floor frame under the standing root.
   * @param knees Each knee joint's nominal place, metres in that frame.
   * @param ahead How far before its nominal place each knee lands, metres along
   *   the heading.
   * @returns The frame and the tucked feet.
   */
  export function planted(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
    measured: IAutoMovieMotionHumanFrame,
    knees: Record<AutoMovieHumanSide, IAutoMovieVector3>,
    ahead: number,
  ): IPlantedResult {
    const forward: IAutoMovieVector3 = HumanFrame.forward(measured.yaw);
    const sides = ["left", "right"] as const;
    const feet = sides.map((side: AutoMovieHumanSide) => {
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

  /** The record of `IPlantedResult`'s site. */
  type IPlantedResult = {
    frame: IAutoMovieMotionHumanFrame;
    tucks: Record<AutoMovieHumanSide, ITuck>;
  };
}

/** The record of `IPrepareRollResult2`'s site. */
type IPrepareRollResult2 = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  toes: number;
  mtp: IAutoMovieVector3;
};

/** The record of `IPrepareRollResult`'s site. */
type IPrepareRollResult = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  toes: number;
  mtp: IAutoMovieVector3;
};

/** The record of `IRolledResult`'s site. */
type IRolledResult = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  toes: number;
  mtp: IAutoMovieVector3;
};
