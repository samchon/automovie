import { AutoMovieExpressionPreset } from "@automovie/interface";

/** The VRM expression presets an expression may name and the viewer writes to morph targets. */
export const AUTOMOVIE_EXPRESSION_PRESETS: ReadonlySet<AutoMovieExpressionPreset> =
  new Set<AutoMovieExpressionPreset>([
    "neutral",
    "happy",
    "angry",
    "sad",
    "relaxed",
    "surprised",
    "aa",
    "ih",
    "ou",
    "ee",
    "oh",
    "blink",
    "blinkLeft",
    "blinkRight",
    "lookUp",
    "lookDown",
    "lookLeft",
    "lookRight",
  ]);
