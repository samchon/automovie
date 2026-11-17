import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";

/**
 * Final shot artifacts borrowed by the camera subject-framing closure.
 */
export namespace IAutoMovieCreatePerformShotSubjectFramer {
  /**
   * Build the function that turns a gated camera subject into the framed subject the camera grammar solves from.
   *
   * Called once the performance, couplings and object clips are final, so a `follow` can track a walking actor, a launched prop or a handoff. The hero's frame moves and every coverage angle read subjects through the same function, so an alternate camera frames the beat's subject exactly as the hero does.
   *
   * A group is measured as the union of its resolved members' portable part/proxy boxes, with formation footprint sampled from its cue. Height and radius are fixed from the opening union; following a cued group updates only the base, so later expansion is not automatically refitted. Below MIN_MEASURED_SUBJECT_HEIGHT, height takes DEFAULT_SUBJECT_HEIGHT. Groups without formation cues hold still.
   *
   * Any other subject resolves to one point, from the live resolver when it answers and the staged placements otherwise, and is boxed through {@link nodeSubjectBox} from the geometry its model draws, falling back to its rig span and then the stand-in height. Its framed base keeps a constant offset from that point, so a moving subject stays framed on the same part of itself. It moves with a live bone resolver for a bone target, with its compiled clip under its staged facing for a performer, with its effective object clip for a driven prop, and otherwise holds still. A camera subject has no staged facing and holds still.
   *
   * @evidence contracts/development/design.md#principled-representation Models supply model-metre bounds, rotations place motion under staged world facing, and all clips/cues are sampled on shot-local seconds. Missing geometry falls back to rig span and then the stand-in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface createPerformShotSubjectFramer captures these inputs for the hero camera and coverage cameras after performance, launches and coupling are complete.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The closure retains the supplied tables and caches model extents; callers must keep them stable while using it. Group height/radius are opening measurements, so following changes the base without refitting later expansion.
   * @evidence contracts/development/common.md#meaningful-documentation Final shot artifacts borrowed by the camera subject-framing closure. Models supply model-metre bounds, rotations place motion under staged world facing, and all clips/cues are sampled on shot-local seconds. Missing geometry falls back to rig span and then the stand-in.
   */
  export type IProps = {
      /**
     * Borrowed compiled model registry, retained by the returned closure. Undefined or an unresolved model uses the node's rig span, then the stand-in height; measured extents are cached per node.
     */
    models: readonly IAutoMovieModel[] | undefined;
      /**
     * Borrowed shot-local formation cues. Empty means formations remain at rest; a cued group's follow position changes while its opening height and radius stay fixed.
     */
    formationMotions: readonly IAutoMovieFormationMotion[];
      /**
     * Borrowed compiled actor motions keyed by node id. With a staged rotation, a motion drives the subject's base; absent motion falls through to object clips or a stationary subject.
     */
    motions: Readonly<Record<string, IAutoMovieMotion>>;
      /**
     * Borrowed final object clips in producer order. The framing closure samples their effective translation channel authority after coupling, using the staged point where none applies.
     */
    objectMotions: readonly IAutoMovieClip[];
      /**
     * Borrowed map of scene-node world-facing quaternions. A node must have a facing here to follow its actor motion; camera subjects have no staged node facing.
     */
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;
    };
}
