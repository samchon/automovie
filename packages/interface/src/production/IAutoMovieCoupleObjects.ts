import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";
import type { IAutoMovieAttachJob } from "./IAutoMovieAttachJob";
import type { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/** Inputs and bake outcome for shot attachments and persistent mounts. */
export namespace IAutoMovieCoupleObjects {
  /**
   * Bake the object couplings a shot carries, the per-beat `attachTo` handoffs
   * and the persistent staged `mounts` (#674), into follow clips once the
   * parents' poses have compiled.
   *
   * `attachTo`, already validated by `performShot`'s action scan, rides the
   * child on the parent's bone in scene space and emits the grab, attach,
   * detach and release {@link handoffEvents}. Each staged mount descends through
   * the same baker, {@link compileAttach}, spanning the whole shot, so a rider
   * rides every beat without re-issuing `attachTo`; an explicit `attachTo` for
   * the same child this shot replaces its mount, and a mount emits no handoff
   * events because it is standing scene state. A mount's parent rig and bone
   * are validated here, since staging placed the parent without skeletons, and
   * returned as violations.
   *
   * Couplings chain (#1140): a parent that is itself a coupled child this shot,
   * such as a rider mounted on an animal and carrying a pole, is baked first,
   * and its riders compose onto its baked frame per sample through any depth.
   * That frame is read from all of the parent's baked clips through
   * {@link bakedTransformFromClipsAt}, the channel authority playback uses, so
   * before the parent's first coupling starts its riders follow its staged
   * placement and across a handoff they follow whichever coupling is in effect.
   * A coupling cycle has no world composition, so its members are reported in
   * one violation and never baked.
   *
   * Returns the baked clips in bake order, parents before riders, with a
   * child's attach clips in start order and repeats suffixed
   * `attach:<child>:2`, ...; the handoff events; and the violations.
   */
  export type IProps = {
    /** Validated `attachTo` jobs of this shot. */
    attachments: readonly IAutoMovieAttachJob[];

    /** Staged persistent mounts; an `attachTo` for the same child replaces one. */
    mounts: readonly IAutoMovieStagedSet.IMount[];

    /** The staged scene, whose nodes hold every parent's placement. */
    scene: IAutoMovieScene;

    /**
     * Borrowed pose motions keyed by scene node. A missing parent's motion
     * holds its rest pose; the table is not changed by coupling.
     */
    motions: Record<string, IAutoMovieMotion>;

    /**
     * Synchronous borrowed rig lookup, stable for each node throughout the
     * call. Null rejects a persistent mount; attachment jobs require a
     * previously admitted nonnull answer. Exceptions propagate.
     */
    skeleton: (node: string) => IAutoMovieSkeleton | null;

    /**
     * Synchronous per-parent clinical axis lookup. Missing callback or
     * undefined answer uses AutoMovieEngineHumanoidJointAxes; returned records are borrowed
     * and exceptions propagate.
     */
    jointAxes?: (
      node: string,
    ) =>
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined;

    /**
     * Synchronous per-parent rest-frame lookup matching the renderer. Missing
     * callback or undefined answer uses the rig's own frames; records are
     * borrowed only during baking and exceptions propagate.
     */
    restFrames?: (
      node: string,
    ) =>
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
      | undefined;

    /**
     * Finite positive shot duration in seconds, admitted by performShot. Mounts
     * span [0, duration]; explicit attachment ends are clipped to this
     * boundary.
     */
    duration: number;
  };

  /**
   * Caller-owned coupling artifacts and diagnostics. Parent clips precede their
   * riders; each child's attachment clips are ordered by action start with
   * input order breaking ties. Failed mounts and cycle members are omitted
   * while their violations remain.
   */
  export type IResult = {
    /**
     * New mutable follow-clip array in parent-before-child bake order, with
     * shot-local keys and scene-world child transforms. Repeated attachment ids
     * carry occurrence suffixes.
     */
    clips: IAutoMovieClip[];
    /**
     * New mutable handoff-event array for explicit attachments only, carrying
     * actionIndex and shot-local seconds. Persistent mounts generate no
     * grab/release history.
     */
    events: IAutoMovieInteractionEvent[];
    /**
     * Collected mount-rig, mount-bone and cycle refusals. Empty means these
     * coupling checks passed; otherwise successful partial clips/events may
     * still be present.
     */
    violations: IAutoMovieConstraintViolation[];
  };
}
