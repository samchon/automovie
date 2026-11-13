import type { AutoMovieHumanoidRegion } from "@automovie/interface";
import type { touch } from "@automovie/motions";

import { motionHumanLawTouch } from "./motionHumanLawTouch";

/**
 * The rows of the touch law's two spec families, one spec per row and part so
 * each runs within the time a test may take: the touches of the performer's own
 * body (`test_human_motion_law_touch_self_*`) and of a partner standing
 * still before them (`test_human_motion_law_touch_partner_*`), each read by
 * `motionHumanLawTouch`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two families, who reads the rows and why they are split.
 * @evidence contracts/development/design.md#principled-representation One record per family keyed by the row's label, so a spec names its row and the table holds its parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two tables and the two readers the specs call.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Regions are the interface's; the partner's place is the stage's own distance.
 */
export namespace motionHumanLawTouchRows {
  /** A touch of the performer's own region. */
  const self = (
    region: AutoMovieHumanoidRegion,
  ): { kind: "self"; region: AutoMovieHumanoidRegion } => ({
    kind: "self",
    region,
  });

  /** A touch of the partner's region. */
  const person = (
    region: AutoMovieHumanoidRegion,
  ): { kind: "person"; subject: string; region: AutoMovieHumanoidRegion } => ({
    kind: "person",
    subject: "b",
    region,
  });

  /** The self-directed family's rows: a belly pat, a nape rub, a forearm scratch, a self hug, hands over the ears, a hand on the heart, a thigh slap, a facepalm and a brow wipe. */
  export const SELF = {
    "pat-belly": { target: self("abdomen"), kind: "pat" },
    "rub-nape": { target: self("nape"), kind: "rub" },
    "scratch-forearm": {
      target: self("forearmLeft"),
      kind: "scratch",
      with: "fingertips",
      count: 4,
    },
    "hug-self": {
      target: self("shoulderLeft"),
      other: self("shoulderRight"),
      kind: "squeeze",
    },
    "cover-ears": {
      target: self("earRight"),
      other: self("earLeft"),
      kind: "press",
    },
    "hand-on-heart": { target: self("chestLeft"), kind: "press" },
    "slap-thigh": { target: self("thighFrontRight"), kind: "pat", count: 1 },
    facepalm: { target: self("forehead"), kind: "hold" },
    "wipe-brow": {
      target: self("forehead"),
      kind: "rub",
      with: "handBack",
      count: 1,
      tangent: "across",
    },
  } as const satisfies Record<string, touch.IParams>;

  /** The affectionate family's rows, each with whether the partner faces the performer: a pat on the head, a two-finger tap on the shoulder, a stroke of the upper arm and a hand cupping the cheek of a partner facing the performer, and a rub of the upper back of a partner turned away. */
  export const PARTNER = {
    "pat-head": {
      params: { target: person("crown"), kind: "pat" },
      facing: true,
    },
    "tap-shoulder": {
      params: {
        target: person("shoulderLeft"),
        kind: "tap",
        with: "fingertips",
        count: 2,
      },
      facing: true,
    },
    "stroke-arm": {
      params: { target: person("upperArmLeft"), kind: "stroke" },
      facing: true,
    },
    "cup-cheek": {
      params: { target: person("cheekLeft"), kind: "hold" },
      facing: true,
    },
    "rub-back": {
      params: { target: person("upperBack"), kind: "rub" },
      facing: false,
    },
  } as const satisfies Record<
    string,
    { params: touch.IParams; facing: boolean }
  >;

  /**
   * The complaints of one part of one self-directed row.
   *
   * @param label The row.
   * @param part The part (`motionHumanLawTouch`'s).
   * @returns `motionHumanLawTouch`'s complaints; empty when the row is right.
   */
  export function own(
    label: keyof typeof SELF,
    part: Parameters<typeof motionHumanLawTouch>[2],
  ): string[] {
    return motionHumanLawTouch(label, SELF[label], part);
  }

  /**
   * The complaints of one part of one row on a partner, who stands 0.55 m
   * ahead facing the performer, or 0.45 m ahead turned away.
   *
   * @param label The row.
   * @param part The part (`motionHumanLawTouch`'s).
   * @returns `motionHumanLawTouch`'s complaints; empty when the row is right.
   */
  export function partner(
    label: keyof typeof PARTNER,
    part: Parameters<typeof motionHumanLawTouch>[2],
  ): string[] {
    const row: { params: touch.IParams; facing: boolean } = PARTNER[label];
    return motionHumanLawTouch(label, row.params, part, {
      facing: row.facing,
      gap: row.facing ? 0.55 : 0.45,
    });
  }
}
