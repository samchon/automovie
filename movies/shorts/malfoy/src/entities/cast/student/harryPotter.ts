import type { IStudentProfile } from "./IStudentProfile";
import { studentParameters } from "./studentParameters";

/**
 * Harry Potter as data: a lean fifteen-year-old Gryffindor boy of 1.71 m and
 * 56 kg with light skin, short untidy black hair and round glasses, in the
 * Gryffindor uniform with trousers, right-handed, with his settings habits.
 *
 * @evidence docs/body/settings/cast/harry-potter.md#measures 1.71 m, 56 kg, waist 70 cm, upper arm 25 cm, chest 84 cm, hip 86 cm, shoulders 40 cm.
 * @evidence docs/body/settings/cast/harry-potter.md#recognition Light skin, untidy black hair, round glasses.
 * @evidence docs/body/settings/cast/harry-potter.md#uniform Gryffindor uniform with trousers.
 * @evidence docs/body/settings/cast/harry-potter.md#flying Banks to 60° at sprint speed.
 * @evidence docs/body/settings/cast/harry-potter.md#habits The habit ids the laws apply.
 * @evidence contracts/development/entities.md#settings-realization Every value is a fact of his record.
 * @evidence contracts/development/common.md#meaningful-documentation States who the record is.
 */
export const harryPotter: IStudentProfile = Object.freeze<IStudentProfile>({
  id: "harry",
  name: "Harry Potter",
  parameters: studentParameters({
    female: false,
    stature: 1.71,
    chest: 0.84,
    waist: 0.7,
    hip: 0.86,
    shoulders: 0.4,
    arm: 0.25,
  }),
  stature: 1.71,
  mass: 56,
  house: "gryffindor",
  bottoms: "trousers",
  skin: 0xe9c6a8,
  hairColor: 0x1a1512,
  hair: "short-untidy",
  glasses: true,
  bank: 60,
  habits: [
    "reaches-for-wrist",
    "watches-wand-hand",
    "gives-room",
    "pushes-glasses",
    "overreaches",
    "holds-on",
  ],
});
