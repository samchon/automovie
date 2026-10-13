/**
 * One runtime model's drawable geometry cost at one explicit or directly placed level of detail.
 *
 * @evidence contracts/common.md#principled-implementation Model measurement counts drawable parts, tessellated vertex/triangle populations and distinct cited materials, estimating vertex-attribute and index device storage from the compiled geometry representation.
 * @evidence contracts/common.md#clear-and-simple-design A reusable per-model row avoids charging shared geometry storage once per scene placement, while the inventory separately counts submitted instances and whole-frame passes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Geometry bytes are estimates rather than observed GPU allocation, and one part's submission count does not include extra shadow or guide passes by itself.
 * @evidence contracts/common.md#meaningful-documentation Defines runtime id, nullable direct-placement tier, parts, vertices, triangles, materials and estimated storage units.
 * @author Samchon
 */
export interface IAutoMovieRenderModelCost {
  /** Runtime model id. */
  model: string;

  /**
   * Level-of-detail tier this row measures, or `null` for a model placed directly by a scene node rather than selected by distance.
   */
  tier: "hero" | "near" | "far" | null;

  /** Exact drawable part count; one part is one draw submission. */
  parts: number;

  /** Exact vertex count over every part. */
  vertices: number;

  /** Exact triangle count over every part. */
  triangles: number;

  /** Distinct material ids cited by the parts. */
  materials: string[];

  /** Estimated device bytes of vertex attributes and indices. */
  geometryBytes: number;
}
