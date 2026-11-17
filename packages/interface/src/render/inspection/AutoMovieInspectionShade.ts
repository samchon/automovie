import type { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass.js";

/**
 * A surface colouring: one of the guide passes, or one of the two inspection shades.
 *
 * `clay` replaces every material with one grey lit by the scene's lights, so form reads without colour. A scene without lights draws it black. `faces` draws each surface in one unlit colour by the side seen, so a flipped or open surface shows its back.
 *
 * Under `pose` the picture is the skeleton of the whole scene: a bone is not a drawn object and has no path, so `parts` and `hide` do not narrow it.
 *
 * This is the requested picture's surface-rendering mode. It carries no interactive selection state, renderer handle or event; the inspection parser refuses names outside the union.
 *
 * @evidence contracts/development/design.md#principled-representation The guide passes keep the names the interface gives them, and the two shades that exist only for inspection extend that union instead of renaming any of it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Headless capture pass planning, inspection parsing and surface drawing share this closed vocabulary; viewer actions consume the value without owning its semantics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ordinary render is the `beauty` member of the same union, not an absent value with a second meaning.
 * @evidence contracts/development/common.md#meaningful-documentation States what each inspection shade replaces, what lights it and what it reveals, and that the pose pass is not narrowed by a selection.
 */
export type AutoMovieInspectionShade = AutoMovieGuidePass | "clay" | "faces";
