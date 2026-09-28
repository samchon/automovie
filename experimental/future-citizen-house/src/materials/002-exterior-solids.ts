/** Native finish recipes owned by docs/materials/002-exterior-solids.md.
 * The shared constructor supplies only the documented renderer defaults. */

export const exteriorSolidsTextured = {
  "limestone-honed": ["#c9c3b5", .82, "limestone-grain", .64, .64],
  "cassette-coated": ["#454d4a", .82, "cassette-grain", .40, .40],
  "cassette-seal": ["#252b29", .94, "seal-grain", .16, .16],
} as const;

export const exteriorSolidsSolid = {
  "frame-coated": ["#293332", .38, 0, 0],
  "steel-satin": ["#b4bcb8", .24, .85, 0],
} as const;
