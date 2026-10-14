import { IAutoMovieNode } from "../core/IAutoMovieNode";
import { IAutoMovieProfile } from "../core/IAutoMovieProfile";
import { IAutoMovieProfileBinding } from "../core/IAutoMovieProfileBinding";

/**
 * The self-declared moving parts of a prop, a door's hinge or a drawer's
 * slide: its own joint nodes plus the profile that limits and couples them, all
 * as data. It is the object-side counterpart of a character's skeleton and
 * range of motion. A prop with no moving parts sets the whole articulation to
 * `null`.
 *
 * `forgeProp` refuses no joints, blank/repeated joint ids, unresolved or cyclic joint parents, missing or multiply claimed model parts, a binding aimed at another profile, undeclared mapped joint ids and unmapped profile semantic keys. Typed node/profile records and their usable numeric values remain a premise: these reference checks do not independently validate every joint TRS or profile rule. `sceneToNodes` lowers joints as `<placement>/<joint>`.
 *
 * `gateAuthoredObjectMotions` resolves authored clips through the bound profile at opening, keys, one-sided boundaries and analytical direct quaternion-component extrema. Only driven-channel violations are reported; nonlinear combinations of profile drivers have no additional stationary-point search, so admission is not an exhaustive continuous bound proof. For display, a host must call `buildPropArticulation`, expose its joint lookup to object-motion playback and restore joint rests between samples. That builder currently has no production host call site. It reparents addressable generated parts while preserving their world placement; imported appearances expose no addressable authored part. Viewer playback writes clip channels and does not project profile-driver output.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary graph nodes and the shared profile let `resolveFrame` apply the same driver/constraint machinery as general rigs. The clip gate's critical clock covers direct interpolation under its stated limits; the separate viewer builder requires host wiring, compatible native attach transforms and explicit channel playback, and does not evaluate those drivers.
 * @evidence contracts/common.md#clear-and-simple-design Three fields split structure, capability and application: the joint nodes, the profile, and the binding that maps the profile's semantic keys onto those nodes, so one profile can serve every prop with the same mechanism.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing semantic mappings are refused at forge time. Observed driven-channel limit violations become refusals instead of treating the resolver's clamped result as authored success; undriven rest channels and unsearched nonlinear extrema are outside that refusal guarantee. An empty joint frame is not evidence that a visible part or a production host actually moves.
 * @evidence contracts/common.md#meaningful-documentation States the purpose, the `null` convention, every forge refusal, the lowered id form, how clips and limits act on the joints, and that drivers are gated but not drawn; members give the parent rule, the part reference that makes a joint visible, and the mapping requirement.
 * @author Samchon
 */
export interface IAutoMoviePropArticulation {
  /**
   * The prop's joint nodes, the subtree the profile binds onto.
   *
   * A `parent` must name another joint in this list or be `null` under the prop placement. A joint's {@link IAutoMovieNode.mesh} names the part of `IAutoMoviePropSpec.model` that rides it when a host builds the articulation and the rendered model exposes that part id. A hinge without a part turns an empty frame; a joint that only positions descendants leaves it `null`. An imported appearance may not expose the proxy part named by this record, in which case the viewer builder refuses the unresolved part rather than moving unrelated geometry.
   */
  nodes: IAutoMovieNode[];

  /** The declared capability: limits and drivers over the joint nodes. */
  profile: IAutoMovieProfile;

  /**
   * The application of {@link profile} onto these joints. Its `boneMap` must
   * map every semantic key the profile references to a joint id in
   * {@link nodes}.
   */
  binding: IAutoMovieProfileBinding;
}
