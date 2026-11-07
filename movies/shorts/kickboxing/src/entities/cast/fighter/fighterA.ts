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
  ],
  defenses: ["parry", "cover", "slip", "roll", "sway", "elbow-block", "high-block", "check", "take"],
  habits: [
    { id: "checks-drag", trigger: ["feint-low-kick"], response: "check", reliability: 1 },
    { id: "answers-pump", trigger: ["feint-jab"], response: "parry", reliability: 1 },
  ],
});
