import type { IAutoMovieHumanF1 } from "@automovie/interface";
import { AutoMovieHumanF1FingerIndex } from "./AutoMovieHumanF1FingerIndex";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1FingerPinky } from "./AutoMovieHumanF1FingerPinky";
import { AutoMovieHumanF1FingerRing } from "./AutoMovieHumanF1FingerRing";
import { AutoMovieHumanF1FingerThumb } from "./AutoMovieHumanF1FingerThumb";
import { AutoMovieHumanF1ToeBig } from "./AutoMovieHumanF1ToeBig";
import { AutoMovieHumanF1ToeIndex } from "./AutoMovieHumanF1ToeIndex";
import { AutoMovieHumanF1ToeLittle } from "./AutoMovieHumanF1ToeLittle";
import { AutoMovieHumanF1ToeMiddle } from "./AutoMovieHumanF1ToeMiddle";
import { AutoMovieHumanF1ToeRing } from "./AutoMovieHumanF1ToeRing";

/**
 * The authored pre-dome source of each digit.
 *
 * Each fitted digit supplies its complete stored source. The carried toes
 * already include their declared phase policy and cap metadata.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The roster supplies placement and the stored splice input before the downstream W3 law.
 * @evidence contracts/development/design.md#principled-representation The producer binding owns the pre-W3 stage and the side of each fitted digit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stored distal source is not normalized again before the dome rule.
 */
export const AutoMovieHumanF1DigitSources: readonly IAutoMovieHumanF1.IDigit[] = [
  { family: AutoMovieHumanF1FingerMiddle, limb: "arm", knuckle: true },
  { family: AutoMovieHumanF1FingerRing, limb: "arm", knuckle: true },
  { family: AutoMovieHumanF1FingerIndex, limb: "arm", knuckle: true },
  { family: AutoMovieHumanF1FingerPinky, limb: "arm", knuckle: true },
  { family: AutoMovieHumanF1FingerThumb, limb: "arm", knuckle: false },
  { family: AutoMovieHumanF1ToeBig, limb: "leg", knuckle: true },
  { family: AutoMovieHumanF1ToeIndex, limb: "leg", knuckle: true },
  { family: AutoMovieHumanF1ToeMiddle, limb: "leg", knuckle: true },
  { family: AutoMovieHumanF1ToeRing, limb: "leg", knuckle: true },
  { family: AutoMovieHumanF1ToeLittle, limb: "leg", knuckle: true },
];
