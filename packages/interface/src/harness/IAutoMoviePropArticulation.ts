import type { IAutoMovieNode } from "../core/IAutoMovieNode";
import type { IAutoMovieProfile } from "../core/IAutoMovieProfile";
import type { IAutoMovieProfileBinding } from "../core/IAutoMovieProfileBinding";

/**
 * The self-declared moving parts of a prop, a door's hinge or a drawer's slide:
 * its own joint nodes plus the profile that limits and couples them, all as
 * data. It is the object-side counterpart of a character's skeleton and range
 * of motion. A prop with no moving parts sets the whole articulation to
 * `null`.
 *
 * `forgeProp` refuses no joints, blank/repeated joint ids, unresolved or cyclic
 * joint parents, missing or multiply claimed model parts, a binding aimed at
 * another profile, undeclared mapped joint ids and unmapped profile semantic
 * keys. Typed node/profile records and their usable numeric values remain a
 * premise: these reference checks do not independently validate every joint TRS
 * or profile rule. `sceneToNodes` lowers joints as `<placement>/<joint>`.
 *
 * `gateAuthoredObjectMotions` resolves authored clips through the bound profile
 * at opening, keys, one-sided boundaries and analytical direct
 * quaternion-component extrema. Only driven-channel violations are reported;
 * nonlinear combinations of profile drivers have no additional stationary-point
 * search, so admission is not an exhaustive continuous bound proof. For
 * display, a host must call `buildPropArticulation`, expose its joint lookup to
 * object-motion playback and restore joint rests between samples. That builder
 * currently has no production host call site. It reparents addressable
 * generated parts while preserving their world placement; imported appearances
 * expose no addressable authored part. Viewer playback writes clip channels and
 * does not project profile-driver output.
 */
export interface IAutoMoviePropArticulation {
  /**
   * The prop's joint nodes, the subtree the profile binds onto.
   *
   * A `parent` must name another joint in this list or be `null` under the prop
   * placement. A joint's {@link IAutoMovieNode.mesh} names the part of
   * `IAutoMoviePropSpec.model` that rides it when a host builds the
   * articulation and the rendered model exposes that part id. A hinge without a
   * part turns an empty frame; a joint that only positions descendants leaves
   * it `null`. An imported appearance may not expose the proxy part named by
   * this record, in which case the viewer builder refuses the unresolved part
   * rather than moving unrelated geometry.
   */
  nodes: IAutoMovieNode[];

  /** The declared capability: limits and drivers over the joint nodes. */
  profile: IAutoMovieProfile;

  /**
   * The application of {@link profile} onto these joints. Its `boneMap` must map
   * every semantic key the profile references to a joint id in {@link nodes}.
   */
  binding: IAutoMovieProfileBinding;
}
