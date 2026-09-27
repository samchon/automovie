/**
 * Base colours for the blocking pass.
 *
 * Source: settings `visual-grammar` (`docs/settings/20-verification.md`): warm
 * white lap siding, dark charcoal frames, white trim, red-brown brick for the
 * chimney and fireplace, honey to mid-brown wood, grey-beige textiles, dark
 * asphalt shingles, ground-floor wood, upper-floor carpet, bath tile and
 * garage concrete. Only a flat base colour per part is chosen here; optical
 * values, texture scale and texture images belong to the materials branch.
 * The spaces surface owner sets UV axes, origin and seams; the viewer preview
 * projects world vertices to those coordinates. No colour here is sampled from
 * a reference image.
 *
 * Consumers: every spaces owner when it emits a part.
 * @evidence spaces/03-surface-owners.md The table supplies named blocking colours for parts made by the allocated surface owners.
 * @evidenceReview spaces/03-surface-owners.md #1efa548 `PALETTE` is a record of hexadecimal part colours; `envelope/front.ts` supplies its `siding` key to an exterior wall and `rooms/common.ts` supplies `woodFloor` to its room floor, while those builders retain the actual surface ownership.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior siding, trim, roof, brick, paving and fence colours are available to their assigned owners.
 * @evidenceReview spaces/03-surface-owners.md#exterior-surface-handoff #51ba773 `siding` reaches the envelope walls, `roof` the separate roof builders, `brick` the chimney, `trim` the porch, and `paving`/`fenceWood` the site parts; the palette gives each owner a colour without moving its assigned geometry into this file.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Room owners can distinguish floor, ceiling and partition base colours.
 * @evidenceReview spaces/03-surface-owners.md#interior-surface-handoff #93a519e `rooms/common.ts` uses `woodFloor`, bedroom owners use `carpet`, bath owners use `tile`, and `rooms/shared.ts` supplies `ceiling` and `interiorWall` to room parts; `stairWood` is consumed by the separately assigned stair source rather than a room owner.
 * @evidence principles/core/source-units.md#source-scope-preservation This palette supplies flat source colours; materials owns images, optical values and repetition.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Every `PALETTE` field is a flat numeric base colour selected for a spaces part; the record contains no image path, optical parameter, or repetition length, leaving those material decisions outside this source value.
 * @evidence principles/core/source-units.md#source-substantive-completion The emitted parts have named base colours for all surface families in this blocking pass.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The initialized record gives roof, brick, paving, wood floor, carpet, tile, and concrete parts stable distinct hex values that their builders read directly, so the blocking source does not need to invent colours when those parts are emitted.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Exterior-surface-handoff assigns siding and brick to envelope owners and interior-surface-handoff assigns room finishes to room owners; this colour table changes neither assignment nor boundary.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `03-surface-owners.md` already gives the siding and chimney faces to envelope builders and the visible room finishes to room builders; this colour record emits no mesh and changes none of those boundaries, so its source work requires no design-owner revision.
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
