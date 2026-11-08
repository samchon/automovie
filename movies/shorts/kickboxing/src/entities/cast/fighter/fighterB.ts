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
 * @evidence docs/body/settings/cast/fighter-b.md#drops-left-arm Whenever A's right knee rises he drops his left elbow, every time once learned.
 * @evidence docs/body/settings/cast/fighter-b.md#chases-pump His right glove jumps to a pump jab, every time.
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
      length: 195,
      cephalicIndex: 78,
      circumference: 575,
      height: 230,
      faceHeight: 120,
      faceWidth: 145,
      mandibularWidth: 110,
      minimumFrontalWidth: 110,
      mouthOpening: 48,
      mandibularLaterotrusion: 10,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
          right: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
        },
        intercanthalWidth: 33,
        nose: { width: 36, height: 52, protrusion: 20 },
        mouth: { width: 50, upperVermilionHeight: 7, lowerVermilionHeight: 9 },
      },
      earPair: {
        left: { length: 66, breadth: 29, protrusion: 18 },
        right: { length: 66, breadth: 29, protrusion: 18 },
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
      id: "drops-left-arm",
      trigger: ["body-kick", "feint-body-kick", "brazilian-kick"],
      response: "elbow-block",
      reliability: 1,
    },
    {
      id: "chases-pump",
      trigger: ["feint-jab"],
      response: "parry",
      reliability: 1,
    },
  ],
});
