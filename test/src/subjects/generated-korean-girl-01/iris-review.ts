/**
 * The connected-basis iris pigment path is inspected as shared construction
 * source. This frozen procedural subject builds its eyes with the constructed
 * portrait eye, not the connected rule, and receives no new visual or
 * anatomical acceptance from the following source observations.
 *
 * @evidence ../../../../packages/human/src/face/anatomy/eye/createHumanFaceIrisPigment.ts#createHumanFaceIrisPigment Read the compile-time globe search, the lazy decode and rasterization, per-document painting, the pigment-keyed cache and the texture replacement.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/locateHumanFaceIrisDisc.ts#locateHumanFaceIrisDisc Read the two-pass sphere fit, the protrusion-weighted axis, the azimuth reference and the anatomical half-angles.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/rasterizeHumanFaceIrisTexels.ts#rasterizeHumanFaceIrisTexels Read the texel-centre barycentric test in UV, the neutral surface point, polar angle and azimuth, the first-claim rule and the limbus-plus-margin cut.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/humanFaceIrisTexelColour.ts#humanFaceIrisTexelColour Read the normalized radius, the portrait eye's fibre formula and eight-band quantization, the limbal ring, the pupil and the two blended edges.
 * @evidence ../../../../packages/human/src/common/mesh/decodePng.ts#decodePng Read the data URI and signature checks, the IHDR admission, IDAT concatenation, the five filters and the RGBA expansion.
 * @evidence ../../../../packages/human/src/common/mesh/encodePng.ts#encodePng Read the size admission, filter-0 rows, the IHDR fields, zlib level 6 and the table CRC.
 * @evidence ../../../../packages/human/src/common/mesh/structures/IPngImage.ts#IPngImage Read the decoded size and RGBA layout shared by the codec and the iris rule.
 * @evidence ../../../../packages/human/src/common/mesh/structures/IPngImage.ts#IPngImage.width Read the positive integer width.
 * @evidence ../../../../packages/human/src/common/mesh/structures/IPngImage.ts#IPngImage.height Read the positive integer height.
 * @evidence ../../../../packages/human/src/common/mesh/structures/IPngImage.ts#IPngImage.rgba Read four bytes per pixel, row-major.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc Read the disc record the locator returns and the rasterizer and colour rule consume.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.centre Read the sclera sphere centre in metres.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.radius Read the sclera sphere radius in metres.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.axis Read the unit optical axis through the corneal apex.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.reference Read the unit azimuth reference perpendicular to the axis.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.limbus Read the limbal half-angle in radians.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.pupil Read the pupillary half-angle in radians.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisDisc.ts#IHumanFaceIrisDisc.painted Read the half-angle at which the asset texture ends its painted iris.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisTexels.ts#IHumanFaceIrisTexels Read the parallel texel arrays the rasterizer returns.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisTexels.ts#IHumanFaceIrisTexels.index Read the row-major texel index.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisTexels.ts#IHumanFaceIrisTexels.theta Read the polar angle from the optical axis.
 * @evidence ../../../../packages/human/src/face/anatomy/eye/structures/IHumanFaceIrisTexels.ts#IHumanFaceIrisTexels.phi Read the azimuth about the optical axis.
 */
export const portraitIrisReview = {
  scope: "connected iris pigment source inspection",
};
