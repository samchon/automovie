import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMoviePropArticulation } from "./IAutoMoviePropArticulation";
import { IAutoMoviePropPlacement } from "./IAutoMoviePropPlacement";

/**
 * One authored prop, a crude primitive proxy with rich meaning: the geometry
 * stays simple boxes and cylinders, while the physics body
 * ({@link IAutoMovieModel.body}), the contact semantics
 * ({@link IAutoMovieModel.affordances}), and the self-declared articulation
 * carry everything the engine validates and simulates.
 *
 * The spec is what the FORGE stage's object side (`forgeProp`) gates: the model
 * must be a skeleton-less prop whose id equals `node` (the staged scene joins
 * on it, exactly as a forged cast member does), generated unless
 * {@link modelRef} names the registration its imported bytes came from, and the
 * articulation, when present, must bind its profile onto the declared nodes
 * without a dangling reference.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `IAutoMoviePropSpec` as the portable data boundary for the motion object authored vocabulary requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `IAutoMoviePropSpec` for the performance interaction attachment object handoff system contract.
 * @author Samchon
 */
export interface IAutoMoviePropSpec {
  /**
   * The scene node this prop will occupy (the staging join key).
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `node` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `node` for the performance interaction attachment object handoff system contract.
   */
  node: string;

  /**
   * The prop model: `skeleton: null` (a riggable actor goes through `forgeCast`
   * instead), primitive parts, optional body and affordances. `origin` is
   * `"generated"` for a prop drawn from those parts and `"imported"` for one
   * drawing a registered external appearance, which {@link modelRef} names and
   * gates.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `model` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `model` for the performance interaction attachment object handoff system contract.
   */
  model: IAutoMovieModel;

  /**
   * Self-declared moving parts, or `null` for a rigid prop.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `articulation` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `articulation` for the performance interaction attachment object handoff system contract.
   */
  articulation: IAutoMoviePropArticulation | null;

  /**
   * Optional semantic placement constraints checked beside the staged node.
   * Omission preserves the original prop contract: the prop is forged and
   * staged without claiming a building relation or a keep-out volume.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `placement` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `placement` for the performance interaction attachment object handoff system contract.
   */
  placement?: IAutoMoviePropPlacement;

  /**
   * The builder-owned model registration whose imported bytes draw this prop,
   * or absent / `null` for a prop drawn from its own generated parts.
   *
   * This is the escape hatch to an external asset, and it deliberately buys the
   * appearance alone. A manufacturer's chair arrives as a mesh with no mass, no
   * seat face, no hinge and no keep-out volume, so a prop that cited one and
   * nothing else would be a picture standing where furniture should be. Stating
   * the reference therefore moves no meaning out of this spec: {@link model}'s
   * parts stay the deterministic proxy every geometric judgment is made against
   * (occupancy, bearing on a support, clearance, containment, passage
   * intrusion), its `body` and `affordances` stay the contact semantics, and
   * {@link articulation} and {@link placement} stay the prop's own. That is the
   * same split the builder already makes when it materializes a registered
   * external appearance: the visible primitives become one registered collision
   * proxy and the imported bytes are kept for the viewer.
   *
   * So this does not repeal "crude primitive proxy, rich meaning" (D011). That
   * principle never said the pixels have to be ours; it said the meaning has to
   * be in the record rather than inferred from a mesh, which is exactly why the
   * proxy survives the reference instead of being replaced by it. What the
   * reference does repeal is the accident that the one category where free-form
   * geometry actually lives, furniture and fixtures and ironmongery, was also
   * the only category forbidden to bring any in.
   *
   * The reference is itself the classification the hatch demands, in the sense
   * Revit's DirectShape demands a category: free geometry is admitted, but only
   * under a registration it can be found and filtered by, so a blank reference
   * is refused. No second label rides along, because a per-prop category
   * nothing in this repository schedules or filters on would be decoration, and
   * the meaning a prop is classified by is already the affordances, body, and
   * relations it declares.
   *
   * The value names a registration the builder owns, a model recipe id or the
   * runtime model id it materializes, exactly as a built environment's
   * `modelReferences` entries do. It is not the spelling a cast member's
   * `modelRef` uses. There, a reference means "do not forge me", because an
   * imported rig carries the bones a performer is driven through; here it means
   * "forge me as an imported appearance", because nothing a prop means can be
   * imported at all.
   *
   * Stating it is what opens `forgeProp`'s origin gate, and it opens it exactly
   * as far as the record can be checked: `origin` must be `"imported"`, `asset`
   * must name the bytes, and the builder-sealed `imported` closure must be a
   * rigid `gltf-static-v1` appearance whose hero LOD binds those bytes under a
   * well-formed digest its own ledger covers. A humanoid appearance is a
   * performer and goes through `forgeCast`. Whether those digests match bytes
   * on disk, and whether the reference resolves to a registration at all, are
   * the builder's own gates, where the registry and the files are.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `modelRef` as the portable data boundary for the motion object authored vocabulary requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `modelRef` for the performance interaction attachment object handoff system contract.
   */
  modelRef?: string | null;
}
