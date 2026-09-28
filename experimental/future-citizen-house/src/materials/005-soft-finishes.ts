/** Native finish recipes owned by docs/materials/005-soft-finishes.md.
 * The shared constructor supplies only the documented renderer defaults. */

export const softFinishesTextured = {
  "plaster-paint": ["#e5e0d6", .90, "paint-grain", .256, .256],
  "felt-panel": ["#a09a8d", .96, "felt-grain", .256, .256],
  "textile-linen": ["#c8c3b6", .92, "woven-grain", .064, .064],
  "textile-green": ["#6b735c", .94, "woven-grain", .064, .064],
  "textile-blue": ["#657682", .94, "woven-grain", .064, .064],
  "textile-white": ["#e1dfd5", .92, "woven-grain", .064, .064],
  "screen-fabric": ["#aab3a0", .88, "woven-grain", .064, .064],
} as const;
