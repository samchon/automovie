import type * as Human from "@automovie/human";

/**
 * Connected-basis iris pigment source inspection. The shared rule was read
 * beside its analytic globe scenario and one GPU capture of two published
 * documents with a blue and a brown pigment. Neither the rule nor this record
 * accepts a subject's iris likeness: the pigments are authored optical values
 * under the renderer's light, and the population comparison is recorded in
 * the population likeness receipt.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Keeps the iris rule's source inspection separate from subjects' visual observations.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Records source inspection of the globe location, anatomical disc, texel rasterization, band colour and texture codec of the iris rule.
 *
 * @evidence {@link Human.IAutoMovieHumanFaceIris} Read the two-eye document field, its owner mapping and its admission through the portrait pigment endpoint check.
 * @evidence {@link Human.IAutoMovieHumanFaceIris.left} Read the subject's left-eye pigment, painted on the leftEye globe only.
 * @evidence {@link Human.IAutoMovieHumanFaceIris.right} Read the subject's right-eye pigment, painted on the rightEye globe only.
 * @evidence {@link Human.createHumanFaceIrisPigment} Read the compile-time globe search, the lazy decode and rasterization, per-document painting, the pigment-keyed cache and the texture replacement.
 * @evidence {@link Human.locateHumanFaceIrisDisc} Read the two-pass sphere fit, the protrusion-weighted axis, the azimuth reference and the anatomical half-angles.
 * @evidence {@link Human.rasterizeHumanFaceIrisTexels} Read the texel-centre barycentric test in UV, the neutral surface point, polar angle and azimuth, the first-claim rule and the limbus-plus-margin cut.
 * @evidence {@link Human.humanFaceIrisTexelColour} Read the normalized radius, the portrait eye's fibre formula and eight-band quantization, the limbal ring, the pupil and the two blended edges.
 * @evidence {@link Human.decodePortraitPng} Read the data URI and signature checks, the IHDR admission, IDAT concatenation, the five filters and the RGBA expansion.
 * @evidence {@link Human.encodePortraitPng} Read the size admission, filter-0 rows, the IHDR fields, zlib level 6 and the table CRC.
 * @evidence {@link Human.IPortraitPngImage} Read the decoded size and RGBA layout shared by the codec and the iris rule.
 * @evidence {@link Human.IPortraitPngImage.width} Read the positive integer width.
 * @evidence {@link Human.IPortraitPngImage.height} Read the positive integer height.
 * @evidence {@link Human.IPortraitPngImage.rgba} Read four bytes per pixel, row-major.
 * @evidence {@link Human.IHumanFaceIrisDisc} Read the disc record the locator returns and the rasterizer and colour rule consume.
 * @evidence {@link Human.IHumanFaceIrisDisc.centre} Read the sclera sphere centre in metres.
 * @evidence {@link Human.IHumanFaceIrisDisc.radius} Read the sclera sphere radius in metres.
 * @evidence {@link Human.IHumanFaceIrisDisc.axis} Read the unit optical axis through the corneal apex.
 * @evidence {@link Human.IHumanFaceIrisDisc.reference} Read the unit azimuth reference perpendicular to the axis.
 * @evidence {@link Human.IHumanFaceIrisDisc.limbus} Read the limbal half-angle in radians.
 * @evidence {@link Human.IHumanFaceIrisDisc.pupil} Read the pupillary half-angle in radians.
 * @evidence {@link Human.IHumanFaceIrisDisc.painted} Read the half-angle at which the asset texture ends its painted iris.
 * @evidence {@link Human.IHumanFaceIrisTexels} Read the parallel texel arrays the rasterizer returns.
 * @evidence {@link Human.IHumanFaceIrisTexels.index} Read the row-major texel index.
 * @evidence {@link Human.IHumanFaceIrisTexels.theta} Read the polar angle from the optical axis.
 * @evidence {@link Human.IHumanFaceIrisTexels.phi} Read the azimuth about the optical axis.
 */
export const humanFaceIrisReview =
  "Connected iris pigment source inspection; subject likeness pending" as const;
