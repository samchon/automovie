import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";

/** Final shot artifacts borrowed by the camera subject-framing closure. */
export namespace IAutoMovieCreatePerformShotSubjectFramer {
  /**
   * Build the function that turns a gated camera subject into the framed
   * subject the camera grammar solves from.
   *
   * Called once the performance, couplings and object clips are final, so a
   * `follow` can track a walking actor, a launched prop or a handoff. The
   * hero's frame moves and every coverage angle read subjects through the same
   * function, so an alternate camera frames the beat's subject exactly as the
   * hero does.
   *
   * A group is measured as the union of its resolved members' portable
   * part/proxy boxes, using the displayed world frame of driven nodes and
   * formation footprints sampled from their cues. Height and radius are fixed
   * from the opening union and follow updates the base. Below
   * AutoMovieEngineMinMeasuredSubjectHeight, height takes AutoMovieEngineDefaultSubjectHeight.
   *
   * Any other subject resolves to one point, from the live resolver when it
   * answers and the staged placements otherwise, and is boxed through
   * {@link nodeSubjectBox} from the geometry its model draws, falling back to
   * its rig span and then the stand-in height. Baked world placements move the
   * full box. Actor translations under a staged facing and live bone positions
   * move their framed base by the same offset. A camera subject holds still.
   */
  export type IProps = {
    /**
     * Borrowed compiled model registry, retained by the returned closure.
     * Undefined or an unresolved model uses the node's rig span, then the
     * stand-in height. The geometry is prepared once per framed subject.
     */
    models: readonly IAutoMovieModel[] | undefined;
    /**
     * Borrowed shot-local formation cues. Empty means formations remain at
     * rest; a cued group's follow position changes while its opening height and
     * radius stay fixed.
     */
    formationMotions: readonly IAutoMovieFormationMotion[];
    /**
     * Borrowed compiled actor motions keyed by node id. A motion with a staged
     * rotation drives the subject's base before a baked world placement starts;
     * otherwise the subject uses its staged point.
     */
    motions: Readonly<Record<string, IAutoMovieMotion>>;
    /**
     * Borrowed final object clips in producer order. The framing closure shares
     * one sample of their effective world translation, rotation and scale
     * channels per query instant. The actor motion or staged placement supplies
     * the frame before both required channels start.
     */
    objectMotions: readonly IAutoMovieClip[];
    /**
     * Borrowed map of scene-node world-facing quaternions. A node must have a
     * facing here to follow its actor motion; camera subjects have no staged
     * node facing.
     */
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;
  };
}
