import { IAutoMovieNode } from "../core/IAutoMovieNode";
import { IAutoMovieProfile } from "../core/IAutoMovieProfile";
import { IAutoMovieProfileBinding } from "../core/IAutoMovieProfileBinding";

/**
 * The self-declared articulation of a prop: the internal joint nodes (a door's
 * hinge, a drawer's slide) plus the profile that constrains and drives them,
 * all as data.
 *
 * This is the object-side counterpart of a character's skeleton+ROM: the nodes
 * are the prop's own node-graph joints, the profile's limits bound them
 * (`resolveFrame`'s CONSTRAIN stage clamps and reports through
 * {@link bindProfile}), and its drivers couple them (a handle that mirrors the
 * hinge). A prop with no moving parts leaves the whole articulation `null`.
 *
 * @author Samchon
 */
export interface IAutoMoviePropArticulation {
  /**
   * The prop's internal joint nodes: the subtree the profile binds onto.
   * Parents must resolve within this list (`null` = the prop's own root); the
   * scene bridge (`sceneToNodes`'s `props` registry) parents the subtree under
   * the prop's scene node with the placement prefix, so the profile binds with
   * the same prefix (`bindProfile`'s `nodePrefix`).
   *
   * A joint's {@link IAutoMovieNode.mesh} names the part of
   * {@link IAutoMoviePropSpec.model} that rides it, and that reference is what
   * makes a declared joint visible: a hinge with no part named turns an empty
   * frame while the leaf stands still. `forgeProp` requires the name to be one
   * of this prop's own parts and refuses a part claimed by two joints, since a
   * part rides one frame. A joint that only positions other joints leaves it
   * `null`.
   */
  nodes: IAutoMovieNode[];

  /** The declared capability: limits and drivers over the joint nodes. */
  profile: IAutoMovieProfile;

  /**
   * The application of that profile onto this prop's nodes: every semantic key
   * the profile references maps to one of {@link nodes} via `boneMap`.
   */
  binding: IAutoMovieProfileBinding;
}
