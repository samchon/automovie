# src/render/exposure/meterAutoMovieIlluminance.ts#meterAutoMovieIlluminance

## @evidence contracts/development/implementation.md#principled-implementation

Each light term is the beauty pass's own direct-light law: cosine for a directional light; inverse square with the renderer's 0.01 m² floor and range window for point and spot; a hard cone for a spot, since its penumbra is zero; and for an area panel Lambert's polygon formula (Arvo 1995) after Sutherland-Hodgman clipping to the plane's upper half-space, one-sided toward local -Z, ignoring scale as the renderer does. Each term is scaled by the Rec. 709 luma of the light colour, which is one for white. Terms are unoccluded, so a shadowed subject reads high. The daylight sky uses the shared `autoMovieSkyIlluminance`; the instant's beam is never added because the staged sun already carries it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function assembles the reading; private helpers hold the per-kind geometry, the polygon formula and the clip, because each is a separate closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every constant is the cited law's or the renderer's documented one; the 0.01 floor is the renderer's punctual falloff floor, stated as such.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every light law, the colour weighting, the unoccluded premise, the unmetered rules and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L) for L lights with constant work per light; the optional sky term adds the cost of `autoMovieSkyIlluminance` at one point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One reading per call; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the result and small vectors and retains nothing.
