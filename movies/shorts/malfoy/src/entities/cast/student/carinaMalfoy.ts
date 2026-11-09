import type { IStudentProfile } from "./IStudentProfile";
import { studentParameters } from "./studentParameters";

/**
 * Carina Malfoy as data: a slim, athletic fifteen-year-old Slytherin girl of
 * 1.63 m and 50 kg with fair skin and straight platinum hair to just above
 * the shoulders, tied low at the nape for flying, in the Slytherin uniform
 * with a skirt and black tights, right-handed, with her settings habits.
 *
 * @evidence docs/body/settings/cast/carina-malfoy.md#measures 1.63 m, 50 kg, waist 66 cm, upper arm 23.5 cm, chest 80 cm, hip 87 cm, shoulders 35.5 cm.
 * @evidence docs/body/settings/cast/carina-malfoy.md#recognition Fair skin, platinum hair just above the shoulders.
 * @evidence docs/body/settings/cast/carina-malfoy.md#uniform Slytherin uniform with skirt and tights.
 * @evidence docs/body/settings/cast/carina-malfoy.md#riding-state Hair tied low at the nape for flying.
 * @evidence docs/body/settings/cast/carina-malfoy.md#flying Banks to 50° at sprint speed.
 * @evidence docs/body/settings/cast/carina-malfoy.md#habits The habit ids the laws apply.
 * @evidence contracts/development/entities.md#settings-realization Every value is a fact of her record.
 * @evidence contracts/development/common.md#meaningful-documentation States who the record is.
 */
export const carinaMalfoy: IStudentProfile = Object.freeze<IStudentProfile>({
  id: "carina",
  name: "Carina Malfoy",
  parameters: studentParameters({
    female: true,
    stature: 1.63,
    chest: 0.8,
    waist: 0.66,
    hip: 0.87,
    shoulders: 0.355,
    arm: 0.235,
  }),
  stature: 1.63,
  mass: 50,
  house: "slytherin",
  bottoms: "skirt",
  skin: 0xf2d8c8,
  hairColor: 0xeee5c6,
  hair: "shoulder-straight",
  ridingHair: "tail-low",
  glasses: false,
  bank: 50,
  habits: [
    "chin-up",
    "squares-to-face",
    "hides-the-personal",
    "withdraws-first-offer",
    "wand-drops",
    "forehead-touch",
    "chest-down",
  ],
});
