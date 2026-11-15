import type { IHumanBody } from "@automovie/motions";

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
 * a left row is the mirrored scene. A row that sets the tangent strokes,
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
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const side: string | undefined = pick("side");
    const tangent: string | undefined = pick("tangent");
    return S.duo(a, b, 0.55, [
      S.chain().act("touch", {
        target: S.person(
          "b",
          side === "left" ? "shoulderRight" : "shoulderLeft",
        ),
        ...(tangent === undefined ? {} : { kind: "stroke", tangent }),
        ...S.set(pick, "kind", "with"),
        ...(side === undefined ? {} : { side }),
      }),
      S.chain("b").act("stand", { seconds: 8, sway: 0 }),
    ]);
  },
  handToFace: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("handToFace", {
        task: pick("task") ?? "drink",
        ...S.set(pick, "side"),
      }),
    ),
  kiss: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(a, b, 0.45, [
      S.chain().act("kiss", {
        partner: "b",
        region: pick("region") ?? "cheekLeft",
        ...S.set(pick, "side"),
      }),
      S.chain("b").act("stand", { seconds: 6, sway: 0 }),
    ]),
  highFive: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const params: object = S.set(pick, "kind", "side");
    return S.duo(a, b, 0.7, [
      S.chain().act("highFive", { partner: "b", ...params }),
      S.chain("b").act("highFive", { partner: "a", ...params }),
    ]);
  },
  selfAction: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.solo(
      a,
      S.chain().act("selfAction", {
        kind: pick("kind") ?? "stretch",
        ...S.set(pick, "side"),
      }),
    ),
};
