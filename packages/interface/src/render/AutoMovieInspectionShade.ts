import type { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * A surface colouring: one of the guide passes, or one of the two inspection
 * shades.
 *
 * `clay` replaces every material with one grey lit by the scene's lights, so
 * form reads without colour. A scene without lights draws it black. `faces`
 * draws each surface in one unlit colour by the side seen, so a flipped or open
 * surface shows its back.
 *
 * Under `pose` the picture is the skeleton of the whole scene: a bone is not a
 * drawn object and has no path, so `parts` and `hide` do not narrow it.
 *
 * This is the requested picture's surface-rendering mode. It carries no
 * interactive selection state, renderer handle or event; the inspection parser
 * refuses names outside the union.
 */
export type AutoMovieInspectionShade = AutoMovieGuidePass | "clay" | "faces";
