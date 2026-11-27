import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { AutoMovieMotionHumanTouch } from "@automovie/motions";
import {
  HumanPerception
} from "../../../../packages/motions/src/law/internal/HumanPerception";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/**
 * The stages of the laws of touch: a touch on a partner, a hand brought to
 * the face, a kiss, a high five and the actions done to oneself.
 *
 * The distances are those of the affection captures: a partner 0.55 m ahead
 * to be touched, 0.45 m ahead to be kissed and 0.7 m ahead for a high five,
 * each facing the performer. A touch lands on the partner's shoulder on the
 * acting hand's side of the scene (their left shoulder for a right hand), so
 * a left row is the mirrored scene, and a kiss lands on the cheek mirrored
 * with the head's turn for the same reason. A row that sets the tangent strokes,
 * since only a travelling kind has one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family, every distance and the two companion choices.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five laws, the ones whose intent is a contact of skin.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A left row mirrors the touched region with the hand rather than reaching across the partner.
 */
export const MOTION_HUMAN_LAW_STAGES_TOUCH: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  touch: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene => {
    const hand: string | undefined = pick("hand");
    const tangent: string | undefined = pick("tangent");
    return S.duo(a, b, 0.55, [
      S.chain().act("touch", {
        target: S.person(
          "b",
          hand === "left" ? "shoulderRight" : "shoulderLeft",
        ),
        ...(tangent === undefined ? {} : { kind: "stroke", tangent }),
        ...S.set(pick, "kind", "effector"),
        ...(hand === undefined ? {} : { hand }),
      }),
      S.chain("b").act("stand", { hold: 8, sway: 0 }),
    ]);
  },
  handToFace: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("handToFace", {
        kind: pick("kind") ?? "drink",
        ...S.set(pick, "hand"),
      }),
    ),
  kiss: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene => {
    // A head turned left kisses the mirrored cheek, as a left hand
    // touches the mirrored shoulder: staged at one cheek for both turns,
    // the left row was not the right row's mirror, and the two heads
    // stood the cheeks' distance apart (measured 0.1231 m).
    const region: string =
      pick("region") ?? (pick("side") === "left" ? "cheekRight" : "cheekLeft");
    const kiss: object = { partner: "b", region, ...S.set(pick, "side") };
    const hand: "left" | "right" | undefined =
      region === "handBackLeft"
        ? "left"
        : region === "handBackRight"
          ? "right"
          : undefined;
    if (hand === undefined)
      return S.duo(a, b, 0.45, [
        S.chain().act("kiss", kiss),
        S.chain("b").act("stand", { hold: 6, sway: 0 }),
      ]);
    // A hand kiss is given to a presented hand: the partner holds the hand
    // out, palm down, and the kisser bows to it (the baciamano), so b lays
    // the hand's palm down on a place ahead of the shoulder before a's kiss
    // starts, held out by the share a touch keeps its wrist within
    // (`touch.REACH`), at the height of the kisser's neck so the kiss is a
    // bow of the head and not a stoop (provisional), and the kisser stands that far again of
    // her own arm from the hand, where her bow meets it; b faces a, so b's
    // left lies toward -x.
    const held: number =
      AutoMovieMotionHumanTouch.touch.REACH *
      (b.measure.upperArm + b.measure.forearm);
    const gap: number =
      held +
      AutoMovieMotionHumanTouch.touch.REACH *
        (a.measure.upperArm + a.measure.forearm);
    const across: number =
      (hand === "left" ? -1 : 1) * b.measure.shoulderHalfWidth;
    return S.duo(a, b, gap, [
      S.chain("b").act(
        "touch",
        {
          target: S.point(across, a.measure.neckHeight, gap - held, {
            x: 0,
            y: 1,
            z: 0,
          }),
          kind: "hold",
          effector: "palm",
          hand: hand,
          hold: 6,
        },
        "presented",
      ),
      // The kisser sees the hand a reaction time after it is held out
      // (`HumanPerception.REACTION`, the delay a partner's region is read at).
      S.chain().act("kiss", kiss).sync({
        of: "presented",
        event: "ready",
        offset: HumanPerception.REACTION,
      }),
    ]);
  },
  highFive: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene => {
    const params: object = S.set(pick, "kind", "hand");
    return S.duo(a, b, 0.7, [
      S.chain().act("highFive", { partner: "b", ...params }),
      S.chain("b").act("highFive", { partner: "a", ...params }),
    ]);
  },
  selfAction: (
    pick: motionHumanLawSweep.Pick,
    a: IAutoMovieMotionHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("selfAction", {
        kind: pick("kind") ?? "stretch",
        ...S.set(pick, "hand"),
      }),
    ),
};
