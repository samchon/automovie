import type { IAutoMovieHumanParameters } from "@automovie/human";

/**
 * One student's settings record as data: identity, body controls, the
 * uniform's house and bottoms, hair and glasses, and the habits the motion
 * laws apply. Built once per person in `carinaMalfoy`, `harryPotter` and
 * `practicePlayers`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every member names what it carries and its unit.
 * @evidence contracts/development/design.md#principled-representation Stature in metres and mass in kilograms beside Human's own parameter record; colours as RGB integers; house, bottoms and hair as closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The facts the body, figure, chains and habit laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named; habits are ids the laws read.
 */
export interface IStudentProfile {
  /** Stable subject id. */
  id: string;

  /** Display name. */
  name: string;

  /** Human body and head controls. */
  parameters: IAutoMovieHumanParameters;

  /** Stature, metres, equal to the anatomy's stature. */
  stature: number;

  /** Mass, kilograms. */
  mass: number;

  /** House, which colours the tie, knit band, robe lining and crest. */
  house: "slytherin" | "gryffindor";

  /** School bottoms. */
  bottoms: "skirt" | "trousers";

  /** Skin colour. */
  skin: number;

  /** Hair colour. */
  hairColor: number;

  /** Hair shape. */
  hair: "shoulder-straight" | "short-untidy" | "short" | "tail-high" | "tail-low" | "bob" | "braids" | "curls" | "shaved";

  /** Hair shape in the riding state, when it changes. */
  ridingHair?: IStudentProfile["hair"];

  /** Whether round glasses are drawn. */
  glasses: boolean;

  /** Most the rider banks a broom at sprint speed, degrees; the flight law's 60° when absent. */
  bank?: number;

  /** Ids of the settings habits the laws apply. */
  habits: readonly string[];
}
