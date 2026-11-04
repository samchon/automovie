import * as Human from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Public Human choices exist as runtime objects with their established values.
 *
 * Scenarios:
 * 1. Reflection through the package namespace reads every public enum object.
 * 2. Every member retains its exact serialized value without extra members.
 * 3. Existing appearance, expression and trait types accept the same enum uses.
 *
 * @evidence contracts/testing.md#behavioral-verification Imports the public package namespace and reflects eleven runtime objects and all their members. Reflect.get receives the namespace and string names, so const-member inlining cannot hide an absent runtime export; an absent, renamed or changed choice fails.
 * @evidence contracts/testing.md#independent-expectations The literal member/value mappings below specify the existing serialized authoring contract, independently of values imported from the producer. Typed parameter records additionally preserve enum usage in existing public fields; they do not replace the reflective assertions.
 * @evidence contracts/testing.md#distinguishing-cases Covers all eleven public families, including the seven actual factory imports, every named member, left/right/symmetric expression choices, none garment choices, curl endpoints and extra-member refusal. This portable public ABI check does not certify a published package or the isolated ESM production loader; the actual production factory suite owns that boundary.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous root unit imports public SDK values and performs in-memory reflection only; no install, transpilation experiment, child process, browser, body generation or GPU runs.
 */
export function test_human_runtime_choices(): void {
  const expected: Readonly<Record<string, Readonly<Record<string, string>>>> = {
    AutoMovieHumanActionUnit: {
      InnerBrowRaiser: "innerBrowRaiser",
      OuterBrowRaiser: "outerBrowRaiser",
      BrowLowerer: "browLowerer",
      UpperLidRaiser: "upperLidRaiser",
      CheekRaiser: "cheekRaiser",
      LidTightener: "lidTightener",
      NoseWrinkler: "noseWrinkler",
      UpperLipRaiser: "upperLipRaiser",
      NasolabialDeepener: "nasolabialDeepener",
      SharpLipPuller: "sharpLipPuller",
      LipCornerPuller: "lipCornerPuller",
      Dimpler: "dimpler",
      LipCornerDepressor: "lipCornerDepressor",
      LowerLipDepressor: "lowerLipDepressor",
      ChinRaiser: "chinRaiser",
      LipPucker: "lipPucker",
      LipStretcher: "lipStretcher",
      NeckTightener: "neckTightener",
      LipFunneler: "lipFunneler",
      LipTightener: "lipTightener",
      LipPressor: "lipPressor",
      LipsPart: "lipsPart",
      JawDrop: "jawDrop",
      MouthStretch: "mouthStretch",
      LipSuck: "lipSuck",
      NostrilDilator: "nostrilDilator",
      NostrilCompressor: "nostrilCompressor",
      LidDroop: "lidDroop",
      EyesClosed: "eyesClosed",
    },
    AutoMovieHumanExpressionSide: {Both: "both", Left: "left", Right: "right"},
    AutoMovieHumanHairColor: {Black: "black", DarkBrown: "darkBrown", Brown: "brown", LightBrown: "lightBrown", Blond: "blond", Auburn: "auburn", Red: "red", Gray: "gray", White: "white"},
    AutoMovieHumanHairCurl: {I: "I", II: "II", III: "III", IV: "IV", V: "V", VI: "VI", VII: "VII", VIII: "VIII"},
    AutoMovieHumanHairline: {Round: "round", MShaped: "mShaped", Rectangular: "rectangular", BellShaped: "bellShaped", Triangular: "triangular"},
    AutoMovieHumanHairStyle: {Crop: "crop", Short: "short", Bob: "bob"},
    AutoMovieHumanIrisColor: {Blue: "blue", Gray: "gray", Green: "green", Hazel: "hazel", LightBrown: "lightBrown", Brown: "brown", DarkBrown: "darkBrown"},
    AutoMovieHumanLowerUnderwear: {None: "none", Briefs: "briefs", BoxerBriefs: "boxerBriefs"},
    AutoMovieHumanPopulation: {European: "european", EastAsian: "eastAsian", African: "african"},
    AutoMovieHumanSex: {Female: "female", Male: "male"},
    AutoMovieHumanUpperUnderwear: {None: "none", Bra: "bra"},
  };
  for (const [name, members] of Object.entries(expected)) {
    const actual: unknown = Reflect.get(Human, name);
    if (actual === null || typeof actual !== "object" || Array.isArray(actual)) throw new Error(`Public Human runtime choice is missing: ${name}`);
    TestValidator.equals(`${name}: closed member names`, Object.keys(actual).sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0), Object.keys(members).sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0));
    for (const [member, value] of Object.entries(members)) {
      TestValidator.equals(`${name}.${member}: serialized value`, Reflect.get(actual, member), value);
    }
  }

  const hair: Human.IAutoMovieHumanScalpHair = {style: Human.AutoMovieHumanHairStyle.Crop, color: Human.AutoMovieHumanHairColor.Black, length: 12, curl: Human.AutoMovieHumanHairCurl.II, hairline: Human.AutoMovieHumanHairline.Rectangular};
  const underwear: Human.IAutoMovieHumanUnderwear = {bottom: Human.AutoMovieHumanLowerUnderwear.BoxerBriefs, top: Human.AutoMovieHumanUpperUnderwear.None, color: "#123456"};
  const pigmentation: Human.IAutoMovieHumanPigmentation = {melanin: 0.1, eumelaninShare: 0.8, haemoglobin: 0.015, iris: Human.AutoMovieHumanIrisColor.Brown};
  const activation: Human.IAutoMovieHumanActionUnitActivation = {unit: Human.AutoMovieHumanActionUnit.EyesClosed, side: Human.AutoMovieHumanExpressionSide.Both, intensity: 0};
  const traits: Pick<Human.IAutoMovieHumanTraits, "sex" | "population"> = {sex: Human.AutoMovieHumanSex.Female, population: Human.AutoMovieHumanPopulation.EastAsian};
  const serialized: string[] = [hair.style, hair.color, hair.curl, hair.hairline, underwear.bottom, underwear.top, pigmentation.iris, activation.unit, activation.side, traits.sex, traits.population];
  TestValidator.equals("existing typed authoring values", serialized, ["crop", "black", "II", "rectangular", "boxerBriefs", "none", "brown", "eyesClosed", "both", "female", "eastAsian"]);
}
