/**
 * Base colours for the blocking pass.
 *
 * Source: settings `visual-grammar` (`docs/settings/20-verification.md`): warm
 * white lap siding, dark charcoal frames, white trim, red-brown brick for the
 * chimney and fireplace, honey to mid-brown wood, grey-beige textiles, dark
 * asphalt shingles, ground-floor wood, upper-floor carpet, bath tile and
 * garage concrete. Only a flat base colour per part is chosen here; optical
 * values, texture scale and texture images belong to the materials branch.
 * The surface owner supplies metric UV coordinates. No colour here is sampled
 * from a reference image.
 *
 * Consumers: every spaces owner when it emits a part.
 * @evidence spaces/03-surface-owners.md Each allocated surface owner applies the blocking palette to its own part.
 * @evidenceReview spaces/03-surface-owners.md #9596716 v-141 Every part() colour in src/spaces is PALETTE.<key> (grep: no raw 0x colour outside palette.ts). 03:29-54 and 03:98-114 allocate the owners; the body has no colour content.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior siding, trim, roof, brick, paving and fence colours are available to their assigned owners.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #9f3db3c v-141 Keys siding, trim, roof, brick, paving and fenceWood (L22-37) are used by the 03:31-54 exterior owners.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room owners can distinguish floor, ceiling, partition and stair base colours.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #f1d029f v-141 Keys woodFloor/carpet/tile, ceiling, interiorWall and stairWood (L28-35) serve the interior owners of 03:98-114.
 * @evidence principles/core/source-units.md#source-scope-preservation This palette supplies flat source colours; materials owns images, optical values and repetition.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 palette.ts holds only hex numbers, with no textures or optical values (environment.ts modelOf sets roughness separately).
 * @evidence principles/core/source-units.md#source-substantive-completion The emitted parts have named base colours for all surface families in this blocking pass.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Every emitted part takes a PALETTE key; 17 keys cover the exterior, interior and site families.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns siding and brick to envelope owners and interior-surface-handoff assigns room finishes to room owners; this colour table changes neither assignment nor boundary.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 03-surface-owners.md:31-35 assign elevations to envelope owners, including the chimney face (:33, brick) and upper siding (:35); 03:96-114 give room finishes to room owners. PALETTE is a constant table (palette.ts:21-39); siding and brick are used only by envelope front/left/rear/right. No assignment changes.
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
