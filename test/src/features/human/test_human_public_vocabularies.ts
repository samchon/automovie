import {
  AutoMovieHumanActionUnit,
  AutoMovieHumanExpressionSide,
  AutoMovieHumanHairColor,
  AutoMovieHumanHairCurl,
  AutoMovieHumanHairStyle,
  AutoMovieHumanHairline,
  AutoMovieHumanIrisColor,
  AutoMovieHumanLowerUnderwear,
  AutoMovieHumanPopulation,
  AutoMovieHumanSex,
  AutoMovieHumanUpperUnderwear,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Human's public vocabulary objects preserve the string enums' consumer-visible values.
 *
 * Scenarios:
 * 1. All eleven public exports enumerate the original 74 named values in declaration order, without missing or extra members.
 * 2. JSON serialization preserves every named string value and its order, including case-sensitive curl grades and compound names.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Imports the actual Human public exports, enumerates their runtime entries and serializes them; lost value exports, renamed members, extra reverse mappings, changed order or changed serialized values fail one combined assertion. The comparisons include uppercase Roman curl grades, camel-case values and the ordered iris palette across all eleven exports.
 * @evidence contracts/development/testing.md#independent-expectations The literals are transcribed from the eleven original enum declarations in packages/human/src/typings at commit 817f06d76c7ce59b2fe3b09747cf0b601c513cfc, before their conversion to const objects. They are never read from current source or computed from the objects under test; this pins compatibility, not anatomical correctness.
 * @evidence contracts/development/common.md#meaningful-documentation States the original compatibility reference, both observable consumer operations and the limits of what the test establishes.
 */
export function test_human_public_vocabularies(): void {
  const vocabularies: Record<string, Readonly<Record<string, string>>> = {
    AutoMovieHumanActionUnit,
    AutoMovieHumanExpressionSide,
    AutoMovieHumanHairColor,
    AutoMovieHumanHairCurl,
    AutoMovieHumanHairline,
    AutoMovieHumanHairStyle,
    AutoMovieHumanIrisColor,
    AutoMovieHumanLowerUnderwear,
    AutoMovieHumanPopulation,
    AutoMovieHumanSex,
    AutoMovieHumanUpperUnderwear,
  };

  // Preserve the original published vocabulary independently of the new representation.
  const expected: Record<string, Readonly<Record<string, string>>> = {
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
      LipCornerPuller: "lipCornerPuller",
      SharpLipPuller: "sharpLipPuller",
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
    AutoMovieHumanExpressionSide: {
      Both: "both",
      Left: "left",
      Right: "right",
    },
    AutoMovieHumanHairColor: {
      Black: "black",
      DarkBrown: "darkBrown",
      Brown: "brown",
      LightBrown: "lightBrown",
      Blond: "blond",
      Auburn: "auburn",
      Red: "red",
      Gray: "gray",
      White: "white",
    },
    AutoMovieHumanHairCurl: {
      I: "I",
      II: "II",
      III: "III",
      IV: "IV",
      V: "V",
      VI: "VI",
      VII: "VII",
      VIII: "VIII",
    },
    AutoMovieHumanHairline: {
      Round: "round",
      MShaped: "mShaped",
      Rectangular: "rectangular",
      BellShaped: "bellShaped",
      Triangular: "triangular",
    },
    AutoMovieHumanHairStyle: {
      Crop: "crop",
      Short: "short",
      Bob: "bob",
    },
    AutoMovieHumanIrisColor: {
      Blue: "blue",
      Gray: "gray",
      Green: "green",
      Hazel: "hazel",
      LightBrown: "lightBrown",
      Brown: "brown",
      DarkBrown: "darkBrown",
    },
    AutoMovieHumanLowerUnderwear: {
      None: "none",
      Briefs: "briefs",
      BoxerBriefs: "boxerBriefs",
    },
    AutoMovieHumanPopulation: {
      European: "european",
      EastAsian: "eastAsian",
      African: "african",
    },
    AutoMovieHumanSex: {
      Female: "female",
      Male: "male",
    },
    AutoMovieHumanUpperUnderwear: {
      None: "none",
      Bra: "bra",
    },
  };
  const entries: Record<string, [string, string][]> = {};
  const expectedEntries: Record<string, [string, string][]> = {};
  for (const [name, vocabulary] of Object.entries(vocabularies))
    entries[name] = Object.entries(vocabulary);
  for (const [name, vocabulary] of Object.entries(expected))
    expectedEntries[name] = Object.entries(vocabulary);

  TestValidator.equals(
    "all Human vocabularies retain their ordered names and serialized string values",
    { entries, json: JSON.stringify(vocabularies) },
    { entries: expectedEntries, json: JSON.stringify(expected) },
  );
}
