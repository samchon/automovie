/**
 * The scene-local key shared by palette attachment and lookup. Keeping it in
 * one owner makes both operations address the same binding without a second
 * map or lifetime outside the scene.
 */
export const SCENE_MASK_KEY = "automovieSemanticMask";
