/**
 * The two inner faces of a body skin and what limited them.
 *
 * Both faces keep the skin's vertex order and triangles. A vertex is counted
 * as beyond the normal-ray proxy when combined thickness is at least half
 * its positive opposite-sheet travel. This is not true surface reach or a
 * collision proof for unequal opposite offsets. Missing positive travel and
 * orientation failures on both sheets are separate observations. No count
 * repairs the output or certifies global embedding or clinical thickness.
 *
 * @evidence contracts/common.md#principled-implementation Carries both offsets with their limited normal-ray and orientation observations, preserving missing coverage instead of implying an embedding certificate.
 * @evidence contracts/common.md#clear-and-simple-design Both sheets and their source normals travel with separate ratio, missing-coverage and orientation counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Proxy refusals and missing coverage remain explicit without clamping thickness or altering geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines the observed conditions and the embedding and clinical claims they cannot establish.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the frame of the skin positions that were given; nothing is converted.
 * @evidence contracts/modeling.md#shared-boundaries The dermal and fascial faces are the boundaries the skin, the subcutaneous layer and the deep tissues share.
 * @evidence contracts/anatomy.md#permitted-range Keeps conventional normal-ray ratio, unavailable reach and both offset orientations explicit; actual anatomical admission needs more than these geometric proxies.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shell builder decides what is emitted.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The thickness field owns the values and their sources.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is a derived result.
 * @author Samchon
 */
export interface IHumanBodyLayerSurfaces {
  /** Outward area-weighted unit skin normal per vertex; its negative supplies the inward offset. */
  normals: number[];

  /** Inner face of the dermis, three metre-valued coordinates per skin vertex. */
  dermis: number[];

  /** Fascial face under the subcutaneous layer, three metre-valued coordinates per skin vertex. */
  fascia: number[];

  /** Vertices whose combined thickness reaches half their positive opposite-sheet ray travel. */
  beyondReachVertices: number;

  /** Vertices with no finite positive opposite-sheet travel, including coincident nonincident hits. */
  unmeasuredReachVertices: number;

  /** Vertex with the largest thickness-to-positive-ray-travel ratio, or null when none was measured. */
  tightestVertex: number | null;

  /** That vertex's combined thickness divided by positive opposite-sheet ray travel, or null. */
  tightestRatio: number | null;

  /** Skin triangles the fascial face turns against their own orientation. */
  invertedTriangles: number;

  /** Skin triangles the dermal face turns against their own orientation. */
  dermalInvertedTriangles: number;

  /** Instrument meaning and limits; no passing count certifies global embedding. */
  qualification: string;

  /** Native skin vertex identities behind the conventional ray-ratio refusal count. */
  beyondReachVertexOrdinals: number[];

  /** Native skin vertices without finite positive opposite-sheet travel. */
  unmeasuredReachVertexOrdinals: number[];

  /** Native skin triangle identities behind the fascial orientation failure count. */
  fascialInvertedTriangleOrdinals: number[];

  /** Native skin triangle identities behind the dermal orientation failure count. */
  dermalInvertedTriangleOrdinals: number[];
}
