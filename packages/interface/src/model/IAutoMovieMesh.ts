import { IAutoMovieMeshPhysicalVertices } from "./IAutoMovieMeshPhysicalVertices";
import { IAutoMovieMeshSkin } from "./IAutoMovieMeshSkin";

/**
 * Explicit triangle-mesh geometry: imported, baked, or deterministically generated.
 *
 * Unlike a {@link AutoMoviePrimitiveShape} with compact named dimensions, a
 * mesh carries explicit bulk vertex data. Ingest may decode it from a
 * glTF/VRM/FBX, an engine may bake it, or ordinary production TypeScript may
 * generate it deterministically from reviewed equations and inputs. An
 * authoring agent does not hand-transcribe opaque bulk arrays; it authors the
 * named generator and lets that program produce the data.
 *
 * Attributes follow the glTF convention of parallel flat arrays indexed by
 * vertex: `positions` is `[x0,y0,z0, x1,y1,z1, ...]`, so `positions.length` is
 * `3 * vertexCount`. `normals` and `uvs` (when present) align to the same
 * vertex order. `skin` binds vertices to skeleton bones for deformation.
 *
 * Reference: glTF 2.0 mesh primitive attributes.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `IAutoMovieMesh` as the portable data boundary for the asset primitive freeform geometry requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `IAutoMovieMesh` for the asset spec geometry inputs system contract.
 * @author Samchon
 */
export interface IAutoMovieMesh {
  /**
   * Flat vertex positions `[x,y,z,...]` in meters. Length is `3 * vertexCount`.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `positions` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `positions` for the asset spec geometry inputs system contract.
   */
  positions: number[];

  /**
   * Optional physical source correspondence, aligned with render vertices.
   * A numeric entry in `vertices` references `sources`; `null` retains current
   * position welding. Omission makes every vertex position-derived.
   * Source IDs are nonnegative safe integers and domains are nonblank strings
   * naming an actual physical instance's equivalence context. Equal domain/ID
   * pairs identify one point duplicated for attributes; contact alone never
   * identifies two points. Every alias must occupy the same topology-grid cell.
   * Domains are not biological-source names or normal islands. Reusing one
   * pair across placed meshes asserts the same actual point in their shared
   * frame. A producer owns incidence and must rebind newly created vertices.
   * The table survives composition; indices into it have no physical meaning.
   * This correspondence supplies topology, not geometry-validity exemptions.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Distinguishes actual source-point aliases from coordinate contact while retaining position-derived vertices.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Carries source domain/ID lineage and nullable current-position correspondence per render vertex.
   */
  physicalVertices?: IAutoMovieMeshPhysicalVertices;

  /**
   * Flat vertex normals `[x,y,z,...]`, aligned to `positions`. `null` if
   * absent.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `normals` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `normals` for the asset spec geometry inputs system contract.
   */
  normals: number[] | null;

  /**
   * Flat texture coordinates `[u,v,...]`, aligned to `positions`. `null` if
   * absent.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `uvs` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `uvs` for the asset spec geometry inputs system contract.
   */
  uvs: number[] | null;

  /**
   * Optional linear RGB multipliers `[r,g,b,...]`, one triple per vertex.
   * Components are finite in [0,1]. Omission means white, without a buffer.
   * These multiply material and texture base colour, never opacity or light.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Carries authored surface colour alongside the vertices of a freeform mesh.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Defines optional aligned linear RGB multipliers with explicit bounds and an identity default.
   */
  colors?: number[];

  /**
   * Optional factor on the slopes of the material's normal map, one per
   * vertex, finite and nonnegative: a relief that deepens or flattens across
   * the surface, such as the wrinkles over a joint that flatten as it bends
   * and stretch the skin. It scales `normalTexture` alone, not the detail
   * map or an overlay's. glTF has no ratified attribute for it, so an
   * exported asset omits it. Omission means one, without a buffer.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Carries a per-vertex relief strength alongside the vertices of a freeform mesh.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Defines optional aligned nonnegative relief factors with an identity default.
   */
  reliefWeights?: number[];

  /**
   * Triangle indices into the vertex arrays (every 3 form one triangle). `null`
   * for a non-indexed mesh (vertices taken in order).
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `indices` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `indices` for the asset spec geometry inputs system contract.
   */
  indices: number[] | null;

  /**
   * Skeletal binding for deformation, or `null` for rigid/static geometry.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `skin` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `skin` for the asset spec geometry inputs system contract.
   */
  skin: IAutoMovieMeshSkin | null;
}
