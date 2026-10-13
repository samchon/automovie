import { IAutoMovieMeshPhysicalVertices } from "./IAutoMovieMeshPhysicalVertices";
import { IAutoMovieMeshSkin } from "./IAutoMovieMeshSkin";

/**
 * Explicit triangle-mesh geometry: imported, baked, or deterministically generated.
 *
 * Unlike a {@link AutoMoviePrimitiveShape} with compact named dimensions, a mesh carries explicit bulk vertex data. Ingest may decode it from a glTF/VRM/FBX, an engine may bake it, or ordinary production TypeScript may generate it deterministically from reviewed equations and inputs. An authoring agent does not hand-transcribe opaque bulk arrays; it authors the named generator and lets that program produce the data.
 *
 * Attributes follow the glTF convention of parallel flat arrays indexed by vertex: `positions` is `[x0,y0,z0, x1,y1,z1, ...]`, so `positions.length` is `3 * vertexCount`. `normals` and `uvs` (when present) align to the same vertex order. `skin` binds vertices to skeleton bones for deformation.
 *
 * Reference: glTF 2.0 mesh primitive attributes.
 *
 * @evidence contracts/common.md#principled-implementation Parallel flat buffers share one render-vertex index; validateMesh checks tuple cardinality, finite values, indices and skin weights, while physical correspondence separately identifies true source aliases for topology without merging independent contact points.
 * @evidence contracts/common.md#clear-and-simple-design Positions and triangle addressing are the geometry core, with nullable shading and skin buffers and optional correspondence, colour and relief attributes; each optional attribute states its own neutral absence rather than requiring placeholder arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit buffers must come from imported bytes or an authored deterministic generator rather than transcribed opaque content; source identity cannot exempt a triangle from area, winding or intersection validation.
 * @evidence contracts/common.md#meaningful-documentation Defines flat tuple layouts, metre positions, attribute alignment, indexed and non-indexed ordering, null shading and skin semantics, physical-source ownership and optional colour and relief defaults and export limits.
 * @author Samchon
 */
export interface IAutoMovieMesh {
  /**
   * Flat vertex positions `[x,y,z,...]` in meters. Length is `3 * vertexCount`.
   */
  positions: number[];

  /**
   * Optional physical source correspondence, aligned with render vertices. A numeric entry in `vertices` references `sources`; `null` retains current position welding. Omission makes every vertex position-derived. Source IDs are nonnegative safe integers and domains are nonblank strings naming an actual physical instance's equivalence context. Equal domain/ID pairs identify one point duplicated for attributes; contact alone never identifies two points. Every alias must occupy the same topology-grid cell. Domains are not biological-source names or normal islands. Reusing one pair across placed meshes asserts the same actual point in their shared frame. A producer owns incidence and must rebind newly created vertices. The table survives composition; indices into it have no physical meaning. This correspondence supplies topology, not geometry-validity exemptions.
   */
  physicalVertices?: IAutoMovieMeshPhysicalVertices;

  /**
   * Flat vertex normals `[x,y,z,...]`, aligned to `positions`. `null` if absent.
   */
  normals: number[] | null;

  /**
   * Flat texture coordinates `[u,v,...]`, aligned to `positions`. `null` if absent.
   */
  uvs: number[] | null;

  /**
   * Optional linear RGB multipliers `[r,g,b,...]`, one triple per vertex. Components are finite in [0,1]. Omission means white, without a buffer. These multiply material and texture base colour, never opacity or light.
   */
  colors?: number[];

  /**
   * Optional factor on the slopes of the material's normal map, one per vertex, finite and nonnegative: a relief that deepens or flattens across the surface, such as the wrinkles over a joint that flatten as it bends and stretch the skin. It scales `normalTexture` alone, not the detail map or an overlay's. glTF has no ratified attribute for it, so an exported asset omits it. Omission means one, without a buffer.
   */
  reliefWeights?: number[];

  /**
   * Triangle indices into the vertex arrays (every 3 form one triangle). `null` for a non-indexed mesh (vertices taken in order).
   */
  indices: number[] | null;

  /** Skeletal binding for deformation, or `null` for rigid/static geometry. */
  skin: IAutoMovieMeshSkin | null;
}
