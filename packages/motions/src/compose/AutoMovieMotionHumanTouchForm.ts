import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { AutoMovieMotionHumanTiming } from "./AutoMovieMotionHumanTiming";

/**
 * The kinds of a touch and how each moves in the region's surface frame: the
 * social touch gestures of Jung et al. 2017 (the corpus of social touch)
 * reduced to a lift off the surface along its normal (a tap, a pat), a
 * travel along it (a stroke, a rub, a scratch) or neither (a press, a
 * squeeze, a hold), with the repetition's length and the fingers' curl.
 *
 * A stroke moves at the pleasant-touch speed of Loken et al. 2009 (1 to 10
 * cm/s; the peak is set to 5 cm/s). The other periods and every amplitude
 * are provisional shares of the hand's length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a kind is, its source, the sourced speed and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation A kind is a lift, a travel, a period and a curl, the four quantities that tell the taxonomy's gestures apart in a surface frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kind union, its table, the period rule and the region's tangent; read by the touch stroke and its laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Periods are timing spans, amplitudes shares of the hand, so no metre is typed for one body.
 */
export namespace AutoMovieMotionHumanTouchForm {
  /**
   * How the effector moves on the region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a kind selects; the namespace states the source and `FORMS` each kind's movement.
   * @evidence contracts/development/design.md#principled-representation The gesture names of the social touch corpus that differ in a surface frame; each maps to one row of `FORMS`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight literals, the key of `FORMS`; a law names a kind and never a lift or a travel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union, so `FORMS` is exhaustive and an unknown kind does not compile.
   */
  export type Kind = (typeof KINDS)[number];

  /** The touch kinds of {@link Kind}, as data. */
  export const KINDS = [
    "tap",
    "pat",
    "stroke",
    "rub",
    "press",
    "squeeze",
    "hold",
    "scratch",
  ] as const;

  /**
   * One kind's movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The lift and the travel in hand lengths, the repetition as a span or a peak speed, the curl in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by the touch stroke.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The speed is optional because only the stroke has a measured one.
   */
  export interface IForm {
    /** The lift's greatest height, a share of the hand's length. */
    lift: number;

    /** The travel's greatest offset each way, a share of the hand's length. */
    travel: number;

    /** One repetition's length; ignored when `speed` is given. */
    period: AutoMovieMotionHumanTiming.Span;

    /** The travel's peak speed, metres per second; sets the period when present. */
    speed?: number;

    /** Extra flexion of every finger joint, degrees. */
    curl: number;
  }

  /**
   * The forms (provisional apart from the stroke's speed): a tap lifts a
   * quarter hand in 0.3 s, a pat half a hand in 0.4 s, a rub travels a
   * quarter hand each way in 0.5 s, a scratch 8 % of a hand in 0.2 s with
   * curled fingers, a stroke a fifth of a hand each way at a 5 cm/s peak
   * (Loken et al. 2009), and a squeeze curls the fingers by 20 degrees.
   */
  export const FORMS: Readonly<Record<Kind, IForm>> = {
    tap: {
      lift: 0.25,
      travel: 0,
      period: { pause: "beat", scale: 0.75 },
      curl: 0,
    },
    pat: { lift: 0.5, travel: 0, period: "beat", curl: 0 },
    stroke: { lift: 0, travel: 0.2, period: "beat", speed: 0.05, curl: 0 },
    rub: {
      lift: 0,
      travel: 0.25,
      period: { pause: "beat", scale: 1.25 },
      curl: 0,
    },
    press: { lift: 0, travel: 0, period: "beat", curl: 0 },
    squeeze: { lift: 0, travel: 0, period: "beat", curl: 20 },
    hold: { lift: 0, travel: 0, period: "beat", curl: 0 },
    scratch: {
      lift: 0,
      travel: 0.08,
      period: { pause: "beat", scale: 0.5 },
      curl: 30,
    },
  };

  /**
   * Which way the travel runs on the region: up its surface, or across it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two directions relative to the region's surface.
   * @evidence contracts/development/design.md#principled-representation A surface has two tangent directions; they are named by the world's up projected on it and its perpendicular.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two literals, read by the region's tangent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A named direction on the surface, not a free vector a law could point off it.
   */
  export type Tangent = (typeof TANGENTS)[number];

  /** The tangents of {@link Tangent}, as data. */
  export const TANGENTS = ["up", "across"] as const;

  /**
   * An effector read in the hand as a kind displays it: its fingers curled
   * by the kind's curl over its shape (`FORMS`), so a fingertip that a
   * scratch curls is laid on its region where the curled finger puts it,
   * not where the shape alone would. The effector itself when the kind
   * curls nothing.
   *
   * @param effector The effector.
   * @param kind The kind.
   * @returns The effector with the kind's curl.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added, why and the unchanged case.
   * @evidence contracts/development/implementation.md#principled-implementation The curl the stroke displays (`AutoMovieMotionHumanHand.form`) is the curl its effector is read with.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kind's own curl, never a row's.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function curled<E extends { curl?: number }>(
    effector: E,
    kind: Kind,
  ): E {
    const curl: number = FORMS[kind].curl;
    return curl === 0 ? effector : { ...effector, curl };
  }
  /**
   * The seconds of one repetition of a kind on a body: the span's seconds,
   * or for a kind with a peak speed the period of a sine of the kind's
   * travel at that peak, `2 pi A / v`.
   *
   * @param body The body.
   * @param kind The kind.
   * @param seconds The span's seconds, from `AutoMovieMotionHumanTiming.seconds`.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both rules, the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation A sine of amplitude A and period T peaks at 2 pi A / T, so the period that meets a peak speed is 2 pi A / v.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The amplitude is the body's hand length times the kind's share.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function period(
    body: Pick<IHumanBody, "measure">,
    kind: Kind,
    seconds: number,
  ): number {
    const form: IForm = FORMS[kind];
    return form.speed === undefined
      ? seconds
      : (2 * Math.PI * form.travel * body.measure.hand) / form.speed;
  }

  /**
   * The unit tangent of a region: its upward direction across the normal,
   * or, for `across` or a region facing up or down, the direction from the
   * acting hand's side toward the body's other side (the performer's left
   * for the right hand, their right for the left hand) or the heading,
   * turned across it. A left-hand stroke is so the right-hand one's mirror.
   *
   * @param normal The region's normal.
   * @param yaw The performer's heading, degrees.
   * @param tangent Which tangent.
   * @param side The acting hand.
   * @returns The unit vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which direction is taken, for which hand, and the fallbacks.
   * @evidence contracts/development/implementation.md#principled-implementation The first candidate whose part across the normal is long enough, normalised; `across` points toward the body's midline from the acting hand, so the body's mirror symmetry carries a stroke from one hand to the other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two perpendicular candidates and one choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate shorter than 0.3 across the normal is skipped so a near-parallel direction is never normalised.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tangent(
    normal: IAutoMovieVector3,
    yaw: number,
    tangent: Tangent,
    side: HumanHand.Side,
  ): IAutoMovieVector3 {
    const n: IAutoMovieVector3 = Vector3.normalize(normal);
    const across = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(n, Vector3.dot(v, n)));
    const frame: HumanFrame.IFrame = { origin: { x: 0, y: 0, z: 0 }, yaw };
    const candidates: IAutoMovieVector3[] =
      tangent === "up"
        ? [{ x: 0, y: 1, z: 0 }, HumanFrame.point(frame, { x: 0, y: 0, z: 1 })]
        : [
            HumanFrame.point(frame, {
              x: side === "right" ? 1 : -1,
              y: 0,
              z: 0,
            }),
            HumanFrame.point(frame, { x: 0, y: 0, z: 1 }),
          ];
    // The two candidates are perpendicular, so when the first lies within
    // 0.3 of the normal the second lies almost fully across it.
    const first: IAutoMovieVector3 = across(candidates[0]!);
    return Vector3.normalize(
      Vector3.length(first) > 0.3 ? first : across(candidates[1]!),
    );
  }
}
