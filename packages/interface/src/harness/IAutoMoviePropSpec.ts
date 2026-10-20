import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMoviePropArticulation } from "./IAutoMoviePropArticulation";
import { IAutoMoviePropPlacement } from "./IAutoMoviePropPlacement";

/**
 * One authored prop: a primitive proxy whose meaning is stated as data. The geometry stays simple parts, while the physics body ({@link IAutoMovieModel.body}), the contact points ({@link IAutoMovieModel.affordances}), the articulation and the placement carry what the engine validates and simulates.
 *
 * `forgeProp` gates one spec and returns every violation at once: `node` is non-blank and equals `model.id`, because the staged scene joins on it; the model is skeleton-less, because a rigged performer goes through `forgeCast`; `origin` is `"generated"` unless {@link modelRef} is stated; `validateModel` passes; and an articulation binds its profile onto declared nodes without a dangling reference or cycle. `validatePropPlacements` forges every prop of a shot, requires exactly one staged set piece drawing the prop's model, and then judges its placement.
 *
 * @evidence contracts/common.md#principled-implementation `forgeProp` requires `model.id === node` and placement validation requires one set piece joining that node and model. Geometry uses authored footprint/clearance boxes when declared, otherwise proxy model-part vertices, together with model affordances and building records. Importing appearance does not replace these semantic measurements with external asset geometry.
 * @evidence contracts/common.md#clear-and-simple-design Four concerns, each in its own member: the model with body and contact points, the articulation, the optional placement, and the optional external-appearance reference; the gates live in `forgeProp` and `validatePropPlacements`, not in this record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A model carrying a skeleton is refused; an imported appearance needs a structurally coherent rigid closure, whose digest strings are checked without reading bytes. Registry resolution and byte provenance belong to production. The forge gate assumes typed nested records and checks articulation references, not every joint transform, profile numeric value or rendered host capability; success returns the caller's mutable spec rather than a deep immutable seal.
 * @evidence contracts/common.md#meaningful-documentation States what carries the prop's meaning, every `forgeProp` rule with its reason, the staging requirement, and what omitting `placement` or `modelRef` means.
 */
export interface IAutoMoviePropSpec {
  /** Scene node this prop occupies; non-blank and equal to `model.id`. */
  node: string;

  /**
   * The prop model, with `skeleton: null`, parts that serve as the measured proxy, and an optional body and affordances. `origin` is `"generated"` for a prop drawn from its parts and `"imported"` for one drawing the external appearance {@link modelRef} names.
   */
  model: IAutoMovieModel;

  /** Self-declared moving parts, or `null` for a rigid prop. */
  articulation: IAutoMoviePropArticulation | null;

  /**
   * Building relations, footprint and clearances checked against the staged piece. Omitted, the prop makes no relation, containment, pairwise-overlap or passage claim of its own, but other props may still cite its affordances and must clear its staged occupancy. Forging and the unique staged-model join remain required.
   */
  placement?: IAutoMoviePropPlacement;

  /**
   * Registered external appearance drawing this prop, or absent or `null` for a prop drawn from its own generated parts.
   *
   * The reference buys appearance only. Authored proxy parts, explicit footprint/clearance boxes and affordances remain the inputs to occupancy, bearing, clearance, containment and passage measurements. Body, articulation and placement remain this spec's own data; this path does not infer mass, a seat face, a hinge or a keep-out volume from imported bytes.
   *
   * The value names a model group id or runtime model id the production registry owns, as a built environment's `modelReferences` entries do. It means "forge me as an imported appearance", unlike a cast member's `modelRef`, which skips forging because an imported rig carries the bones a performer is driven through.
   *
   * Stating it makes `forgeProp` require a non-blank value, `origin: "imported"`, a non-null `asset`, and a sealed `imported` closure: unique asset paths with `sha256:` digests of 64 lowercase hex digits, the rigid `gltf-static-v1` profile on the closure and every LOD with no humanoid bones, unique LOD levels whose asset and digest match the ledger, and a `hero` LOD binding `asset`. The production shot runtime then refuses a reference that does not resolve to a registered glTF, GLB or VRM appearance, a closure other than the one it sealed, and an `asset` other than the registered one.
   */
  modelRef?: string | null;
}
