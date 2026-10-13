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
 * `forgeProp` refuses an articulation with no joint, a blank or repeated joint
 * id, a parent that does not resolve within the joints or forms a cycle, a
 * joint `mesh` that is not one of the prop's own parts or is claimed by two
 * joints, a binding aimed at another profile, a `boneMap` value naming an
 * undeclared joint, and any semantic key the profile uses that `boneMap` does
 * not map. `sceneToNodes` lowers the joints under the prop's placement as
 * `<placement>/<joint>`. A shot turns them with authored object clips, and
 * `gateAuthoredObjectMotions` resolves those clips through `resolveFrame` with
 * the profile bound at the same prefix, refusing a channel driven past its
 * declared limit. The viewer turns only the channels a clip carries: a
 * profile driver, such as a handle mirroring its hinge, is honoured in that
 * gate but does not move on screen.
 *
 * @evidence contracts/common.md#principled-implementation Joints are ordinary scene-graph nodes and the profile is the same limit-and-driver data a character binds, so `resolveFrame`'s constrain and drive stages evaluate a prop exactly as they evaluate a rig; the remaining gap is that the viewer draws clip channels only, not driver output.
 * @evidence contracts/common.md#clear-and-simple-design Three fields split structure, capability and application: the joint nodes, the profile, and the binding that maps the profile's semantic keys onto those nodes, so one profile can serve every prop with the same mechanism.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every unmapped key is refused at forge time rather than left for `bindProfile` to throw on, and a clip past a limit is refused rather than silently clamped in the gate.
 * @evidence contracts/common.md#meaningful-documentation States the purpose, the `null` convention, every forge refusal, the lowered id form, how clips and limits act on the joints, and that drivers are gated but not drawn; members give the parent rule, the part reference that makes a joint visible, and the mapping requirement.
 * @author Samchon
 */
export interface IAutoMoviePropArticulation {
  /**
   * The prop's joint nodes, the subtree the profile binds onto.
   *
   * A `parent` must name another joint in this list, or be `null` to sit
   * directly under the prop's placement. A joint's {@link IAutoMovieNode.mesh}
   * names the part of `IAutoMoviePropSpec.model` that rides it, and that
   * reference is what makes a joint visible: a hinge with no part named turns
   * an empty frame while the leaf stands still. A joint that only positions
   * other joints leaves it `null`.
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
