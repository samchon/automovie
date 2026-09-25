import type * as Human from "@automovie/human";

/**
 * The connected-basis iris pigment path is inspected as shared construction
 * source. This frozen procedural subject builds its eyes with the constructed
 * portrait eye, not the connected rule, and receives no new visual or
 * anatomical acceptance from the following source observations.
 *
 * @evidence {@link Human.createHumanFaceIrisPigment} Read the compile-time globe search, the lazy decode and rasterization, per-document painting, the pigment-keyed cache and the texture replacement.
 * @evidenceReview {@link Human.createHumanFaceIrisPigment} #1eac040 Read the globe as the textured, UV-bearing region triangles fully bound to one eye owner, texture references skipped, omission and null returning before any work, pigment validation before the eye checks, and the cache keyed by both pigments. Reread the rasterization reaching past the larger of the anatomical and painted half-angles by the edge and a 2 degree sclera band, the sclera colour as the linear mean of that band beyond the painted edge (white when it is empty), and the painted iris outside a smaller anatomical disc covered by it, blended linearly across the painted edge, before the band colour.
 * @evidence {@link Human.locateHumanFaceIrisDisc} Read the two-pass sphere fit, the protrusion-weighted axis, the azimuth reference and the anatomical half-angles.
 * @evidenceReview {@link Human.locateHumanFaceIrisDisc} #31da681 Read the normal-equation sphere fit with pivot refusal, the posterior refit beyond 45 degrees, the refusal of a globe without protrusion or sclera, the vertical-axis reference fallback, the limbus and pupil as asin of 11.71 and 3.5 mm over the fitted diameter, held at a right angle for a globe smaller than them, and the painted half-angle as asin(11.71 / 24.2), with their cited sources.
 * @evidence {@link Human.rasterizeHumanFaceIrisTexels} Read the texel-centre barycentric test in UV, the neutral surface point, polar angle and azimuth, the first-claim rule and the limbus-plus-margin cut.
 * @evidenceReview {@link Human.rasterizeHumanFaceIrisTexels} #0f52620 Read texel centres at half-integer coordinates with rows growing with v, degenerate UV triangles skipped, bounding boxes clipped to the texture and the acos argument clamped.
 * @evidence {@link Human.humanFaceIrisTexelColour} Read the normalized radius, the portrait eye's fibre formula and eight-band quantization, the limbal ring, the pupil and the two blended edges.
 * @evidenceReview {@link Human.humanFaceIrisTexelColour} #6d57293 Read band 0 beyond rho 0.87, the fibre value clamped to bands 0..7, the pupil colour of the constructed eye, and linear blends over the caller's edge width into the pupil and outward into the original texel.
 * @evidence {@link Human.decodePortraitPng} Read the data URI and signature checks, the IHDR admission, IDAT concatenation, the five filters and the RGBA expansion.
 * @evidenceReview {@link Human.decodePortraitPng} #3c182b0 Read refusals for non-PNG input, bit depths other than 8, palette and interlaced images, missing data, a size mismatch and an unknown filter, and the Paeth predictor of PNG section 9.4.
 * @evidence {@link Human.encodePortraitPng} Read the size admission, filter-0 rows, the IHDR fields, zlib level 6 and the table CRC.
 * @evidenceReview {@link Human.encodePortraitPng} #93db68e Read that decoding the output returns the input bytes and that the same bytes yield the same string.
 * @evidence {@link Human.IPortraitPngImage} Read the decoded size and RGBA layout shared by the codec and the iris rule.
 * @evidenceReview {@link Human.IPortraitPngImage} #edc4542 Read the decoded size and RGBA layout shared by the codec and the iris rule.
 * @evidence {@link Human.IPortraitPngImage.width} Read the positive integer width.
 * @evidenceReview {@link Human.IPortraitPngImage.width} #741c6cd Read the positive integer width.
 * @evidence {@link Human.IPortraitPngImage.height} Read the positive integer height.
 * @evidenceReview {@link Human.IPortraitPngImage.height} #17fa5ff Read the positive integer height.
 * @evidence {@link Human.IPortraitPngImage.rgba} Read four bytes per pixel, row-major.
 * @evidenceReview {@link Human.IPortraitPngImage.rgba} #3c4d5f2 Read four bytes per pixel, row-major.
 * @evidence {@link Human.IHumanFaceIrisDisc} Read the disc record the locator returns and the rasterizer and colour rule consume.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc} #cc46b81 Read the disc record the locator returns and the rasterizer and colour rule consume, its limbus and pupil the population's absolute sizes on the globe.
 * @evidence {@link Human.IHumanFaceIrisDisc.centre} Read the sclera sphere centre in metres.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.centre} #b1793b8 Read the sclera sphere centre in metres.
 * @evidence {@link Human.IHumanFaceIrisDisc.radius} Read the sclera sphere radius in metres.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.radius} #b50446b Read the sclera sphere radius in metres.
 * @evidence {@link Human.IHumanFaceIrisDisc.axis} Read the unit optical axis through the corneal apex.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.axis} #f02a2a6 Read the unit optical axis through the corneal apex.
 * @evidence {@link Human.IHumanFaceIrisDisc.reference} Read the unit azimuth reference perpendicular to the axis.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.reference} #e85e6c8 Read the unit azimuth reference perpendicular to the axis.
 * @evidence {@link Human.IHumanFaceIrisDisc.limbus} Read the limbal half-angle in radians.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.limbus} #dd94b8f Read the limbal half-angle in radians.
 * @evidence {@link Human.IHumanFaceIrisDisc.pupil} Read the pupillary half-angle in radians.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.pupil} #de3611a Read the pupillary half-angle in radians.
 * @evidence {@link Human.IHumanFaceIrisDisc.painted} Read the half-angle at which the asset texture ends its painted iris.
 * @evidenceReview {@link Human.IHumanFaceIrisDisc.painted} #d8caa3c Read the half-angle at which the asset texture ends its painted iris, the population ratio of iris to globe.
 * @evidence {@link Human.IHumanFaceIrisTexels} Read the parallel texel arrays the rasterizer returns.
 * @evidenceReview {@link Human.IHumanFaceIrisTexels} #3e49ee3 Read the parallel texel arrays the rasterizer returns.
 * @evidence {@link Human.IHumanFaceIrisTexels.index} Read the row-major texel index.
 * @evidenceReview {@link Human.IHumanFaceIrisTexels.index} #a5f3de1 Read the row-major texel index.
 * @evidence {@link Human.IHumanFaceIrisTexels.theta} Read the polar angle from the optical axis.
 * @evidenceReview {@link Human.IHumanFaceIrisTexels.theta} #4283341 Read the polar angle from the optical axis.
 * @evidence {@link Human.IHumanFaceIrisTexels.phi} Read the azimuth about the optical axis.
 * @evidenceReview {@link Human.IHumanFaceIrisTexels.phi} #914357b Read the azimuth about the optical axis.
 */
export const portraitIrisReview = {
  scope: "connected iris pigment source inspection",
};
