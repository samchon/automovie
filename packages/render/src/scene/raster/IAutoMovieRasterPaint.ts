import type * as THREE from "three";

/**
 * How one material colours the triangles drawn with it during one frame,
 * resolved once per material instead of once per triangle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the record is resolved and what each member decides; colours state their space.
 * @evidence contracts/development/design.md#principled-representation A material decides whether its picture is exact, a displacement of the vertices, a grey from each pixel's depth and a flat colour from the surface point; the four members are those four decisions and nothing else.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mesh submitter reads all four members and no other consumer exists; a material kind is not exposed because no reader branches on it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A material this rasterizer cannot reproduce says so through `approximated` instead of passing as exact.
 */
export interface IAutoMovieRasterPaint {
  /**
   * Whether the picture differs in kind from what the material draws on a
   * GPU, as an unknown shader drawn as grey clay does.
   */
  approximated: boolean;

  /**
   * Distance in model units each vertex moves along its posed unit normal,
   * after morph targets and skinning, zero for no displacement. An outline
   * pass's shell uses it.
   */
  extrude: number;

  /**
   * Per-pixel linear grey from normalized device depth, which a filled
   * triangle and a wireframe edge both take, or null when both take the flat
   * colour `shade` returns.
   */
  ramp: ((depth: number) => number) | null;

  /**
   * Linear RGB of one triangle.
   *
   * @param tint Product of the triangle's mean vertex colour and its instance colour, linear RGB.
   * @param point Triangle centroid in world metres.
   * @param normal Unit world normal of a filled triangle, turned toward the viewer. A wireframe edge passes its triangle's own normal unturned, and the zero vector for a triangle without area.
   * @param front Whether the viewer sees the triangle's front face; always true for a wireframe edge, since a line has no side.
   * @returns Linear RGB, not clamped.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives each parameter's space and unit and the result's colour space.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A callable member has no body; `resolveAutoMovieRasterPaint` implements every variant and answers for them.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callable member has no body; its structure is the resolver's.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callable member has no body; the resolver states which materials are approximated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callable member chooses no algorithm; the resolver states each variant's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callable member holds no work to reuse; the resolver hoists what a material's triangles share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callable member owns nothing; the returned triple is the caller's.
   */
  shade(
    tint: readonly [number, number, number],
    point: THREE.Vector3,
    normal: THREE.Vector3,
    front: boolean,
  ): [number, number, number];
}
