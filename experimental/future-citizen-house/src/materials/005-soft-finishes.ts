/** Native finish recipes owned by docs/materials/005-soft-finishes.md.
 * The shared constructor supplies only the documented renderer defaults. */

export const softFinishesTextured = {
  "plaster-paint": ["#e5e0d6", 0.9, "paint-grain", 0.256, 0.256],
  "felt-panel": ["#a09a8d", 0.96, "felt-grain", 0.256, 0.256],
  "textile-linen": ["#c8c3b6", 0.92, "woven-grain", 0.064, 0.064],
  "textile-green": ["#6b735c", 0.94, "woven-grain", 0.064, 0.064],
  "textile-blue": ["#657682", 0.94, "woven-grain", 0.064, 0.064],
  "textile-white": ["#e1dfd5", 0.92, "woven-grain", 0.064, 0.064],
  "screen-fabric": ["#aab3a0", 0.88, "screen-grain", 0.064, 0.064],
} as const;
