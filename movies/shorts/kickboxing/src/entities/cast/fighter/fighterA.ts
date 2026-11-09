import { AutoMovieHumanSex } from "@automovie/human";

import type { IFighterProfile } from "./IFighterProfile";

/**
 * Fighter A, built from his settings: an adult man of 180 cm and 80 kg with
 * an athletic build, warm medium skin, red gloves and red shorts with a pale
 * waistband, a Dutch-style pressure kicker who keeps the Brazilian kick in
 * reserve. The body controls give the build's broad shoulders and thick
 * trunk; head and face controls are the Human figure's adult male defaults.
 *
 * @evidence docs/body/settings/cast/fighter-a.md#build 180 cm, 80 kg, athletic build through chest, shoulder, waist, arm and thigh girths.
 * @evidence docs/body/settings/cast/fighter-a.md#recognition Warm medium skin distinguishes him from B.
 * @evidence docs/body/settings/cast/fighter-a.md#kit Red gloves and shorts with a pale waistband.
 * @evidence docs/body/settings/cast/fighter-a.md#weapons His repertoire, including the reserved Brazilian kick.
 * @evidence docs/body/settings/cast/fighter-a.md#defense Parry, catch, slip, roll, sway, elbow block and check.
 * @evidence docs/body/settings/cast/fighter-a.md#checks-drag He checks the drag feint at once, every time.
 * @evidence docs/body/settings/cast/fighter-a.md#answers-pump His right glove meets a pump jab, every time.
 * @evidence docs/research/kickboxing/exchanges.md#feints A shoulder feint draws the parry; a level feint draws the elbow block.
 */
export const fighterA: IFighterProfile = Object.freeze<IFighterProfile>({
  id: "a",
  corner: "red",
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
  skin: 0xb98367,
  gloves: 0xc62a34,
  shorts: 0xc62a34,
  trim: 0xf0e3ce,
  repertoire: [
    "jab",
    "cross",
    "hook",
    "uppercut",
    "body-cross",
    "body-hook",
    "low-kick",
    "body-kick",
    "brazilian-kick",
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
      id: "checks-drag",
      sees: { families: ["feint"], limb: "leg", levels: ["leg"] },
      response: "check",
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
      id: "answers-pump",
      sees: { families: ["feint"], limb: "arm" },
      response: "parry",
      reliability: 1,
    },
  ],
});
