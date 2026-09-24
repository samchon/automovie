/**
 * Base colours for the blocking pass.
 *
 * Source: settings `visual-grammar` (`docs/settings/20-verification.md`): warm
 * white lap siding, dark charcoal frames, white trim, red-brown brick for the
 * chimney and fireplace, honey to mid-brown wood, grey-beige textiles, dark
 * asphalt shingles, ground-floor wood, upper-floor carpet, bath tile and
 * garage concrete. Only a flat base colour per part is chosen here; optical
 * values, texture scale, UV and texture images belong to the materials branch
 * and arrive later. No colour here is sampled from a reference image.
 *
 * Consumers: every spaces owner when it emits a part.
 */
export const PALETTE = {
  siding: 0xebe5d8,
  trim: 0xf4f2ec,
  roof: 0x3d3f43,
  brick: 0x8c4b36,
  concrete: 0xbab7b0,
  paving: 0xc4c0b6,
  woodFloor: 0xb88a5c,
  carpet: 0xcbbfab,
  tile: 0xd6dadb,
  utility: 0xc2c3c0,
  interiorWall: 0xf0ebe1,
  ceiling: 0xf6f4ef,
  structure: 0xa9a49a,
  stairWood: 0x9a6b43,
  railing: 0x2b2b2b,
  fenceWood: 0x8a6a4a,
  porchFloor: 0xa39a8e,
} as const;
