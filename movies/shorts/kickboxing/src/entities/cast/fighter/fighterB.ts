import { AutoMovieHumanSex } from "@automovie/human";

import type { IFighterProfile } from "./IFighterProfile";

/**
 * Fighter B, built from his settings: an adult man of 180 cm and 80 kg with
 * the same competitive build as A, dark cool skin, cyan gloves and navy
 * shorts with cyan stripes, a counter-puncher of long combinations, low kicks
 * and the switch kick, who learns to drop his left arm whenever A's right
 * knee rises.
 *
 * @evidence docs/body/settings/cast/fighter-b.md#build 180 cm, 80 kg, the same build as A, so the same body controls.
 * @evidence docs/body/settings/cast/fighter-b.md#recognition Dark cool skin, cyan gloves, navy shorts with cyan stripes.
 * @evidence docs/body/settings/cast/fighter-b.md#kit His kit.
 * @evidence docs/body/settings/cast/fighter-b.md#weapons His repertoire, including the switch kick, the high kick and the clinch knee.
 * @evidence docs/body/settings/cast/fighter-b.md#defense Parry, cover, body block, slips, rolls and the check.
 * @evidence docs/body/settings/cast/fighter-b.md#drops-left-arm Whenever A's right knee rises (a right body or head kick, or its feint) he drops his left elbow by the chamber, every time once learned.
 * @evidence docs/body/settings/cast/fighter-b.md#chases-pump His right glove jumps to a pump jab, every time.
 * @evidence docs/research/kickboxing/exchanges.md#feints A shoulder feint draws the parry; a level feint draws the elbow block; the body-kick feint shows the knee rise.
 * @evidence docs/body/settings/cast/fighter-b.md#stays-on-leg After his checked low kick he stays on the kicking leg a beat too long.
 */
export const fighterB: IFighterProfile = Object.freeze<IFighterProfile>({
  id: "b",
  corner: "blue",
  parameters: {
    body: {
      anatomy: {
        sex: AutoMovieHumanSex.Male,
        stature: 1800,
        chestCircumference: 1060,
        acrossBackShoulderWidth: 465,
        waistCircumference: 820,
        hipCircumference: 980,
        neckCircumference: 410,
        upperArmCircumference: 355,
        thighCircumference: 590,
      },
    },
    head: {
      length: 201.12,
      cephalicIndex: 76.90433571996817,
      circumference: 577.89,
      height: 225,
      faceHeight: 127.2,
      faceWidth: 143.23,
      mandibularWidth: 104.5,
      minimumFrontalWidth: 111.4,
      mouthOpening: 55.3,
      mandibularLaterotrusion: 10.4,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 28.8, palpebralFissureHeight: 11.61 },
          right: { palpebralFissureLength: 28.8, palpebralFissureHeight: 11.61 },
        },
        intercanthalWidth: 32.7,
        nose: { width: 36.1, height: 56.6, protrusion: 21 },
        mouth: { width: 50.9, upperVermilionHeight: 7.5, lowerVermilionHeight: 8.7 },
      },
      earPair: {
        left: { length: 67, breadth: 29.05, protrusion: 19.5 },
        right: { length: 67, breadth: 29.05, protrusion: 19.5 },
      },
    },
  },
  mass: 80,
  skin: 0x75523f,
  gloves: 0x2ad0dc,
  shorts: 0x142946,
  trim: 0x28d6e0,
  repertoire: [
    "jab",
    "cross",
    "hook",
    "uppercut",
    "body-cross",
    "body-hook",
    "low-kick",
    "body-kick",
    "high-kick",
    "switch-kick",
    "teep",
    "knee",
    "feint-jab",
    "feint-low-kick",
    "feint-body-kick",
    "feint-shoulder",
    "feint-level",
  ],
  defenses: [
    "parry",
    "cover",
    "slip",
    "roll",
    "sway",
    "elbow-block",
    "high-block",
    "check",
    "take",
  ],
  habits: [
    {
      kind: "tell",
      id: "drops-left-arm",
      sees: { limb: "leg", side: "right", levels: ["body", "head"] },
      response: "elbow-block",
      ready: "chamber",
      reliability: 1,
    },
    {
      kind: "tell",
      id: "reads-level",
      sees: { families: ["feint"], limb: "arm", levels: ["body"] },
      response: "elbow-block",
      reliability: 1,
    },
    {
      kind: "tell",
      id: "chases-pump",
      sees: { families: ["feint"], limb: "arm" },
      response: "parry",
      reliability: 1,
    },
    {
      kind: "linger",
      id: "stays-on-leg",
      after: { limb: "leg", level: "leg" },
      outcome: "checked",
    },
  ],
});
