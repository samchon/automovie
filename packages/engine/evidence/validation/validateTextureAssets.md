# src/validation/validateTextureAssets.ts#validateTextureAssets

## @evidence contracts/development/implementation.md#principled-implementation

Cross-check every sampled material/environment project image with manifest registration, production consumer authorization, media/edge facts and consistent color intent; model-carried images resolve first, skip the ledger and keep a model-scoped intent check. Each shot's font sources go through validateAutoMovieFontSources with this ledger, so a font file without a licence or a font use is refused here, the one check holding the ledger, and a font use no source names is stale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

materialTextureSlots owns consumer slots, validateAutoMovieFontSources owns the font record rules and facts is the host-provided header-fact seam; byte digest ownership stays with the manifest gate and font decoding with render.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Facts do not prove full decoding, and this validator does not reread or redigest bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Material versus environment media, positive pixel edges/portable limit, carried-image precedence, font admission against the ledger and stale-use errors are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Assets/uses/slots drive maps and scans; repeated asset uses checks cost O(TU) worst-case and string keys/text also contribute.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Asset records and intent/declared maps are shared within one call; the facts callback may own per-asset reuse outside it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only report rows escape; assets/models are borrowed and no file, pixel buffer or texture handle is acquired.
