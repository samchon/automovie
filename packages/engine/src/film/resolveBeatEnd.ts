import { IAutoMovieBeatEndState } from "@automovie/interface";
import { IResolveBeatProps } from "./IResolveBeatProps";

/**
 * Derive the forward-state a later beat should block against from a compiled
 * shot. Every scene actor gets an end snapshot: held actors keep their staged
 * placement, performed actors sample their motion at the shot end, and pose
 * root motion is folded into the returned world transform.
 *
 * Beyond the end pose, the state is a _resumable_ simulation snapshot: the gait
 * cycle phase (so the next beat continues mid-stride instead of resetting), the
 * world root velocity (finite-differenced over the clip's last instants), the
 * planted feet (when the caller passes the ground-IK pass output), and the
 * persistent mount coupling (absorbing the staged `mounts` the film pipeline
 * previously never consumed). This is the seam that keeps an hours-long
 * timeline continuous across beat boundaries.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity resolveBeatEnd snapshots every actor, plant, velocity, and mount at the compiled shot boundary so later blocking starts from measured prior state.
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-entry-exit-state Emits the scene's closing physical actor transforms, articulation, gait phase, velocity, contacts, and mounts from the compiled end instant.
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Bounds the reviewed actor-state facts to the compiled shot's closing instant; it does not claim sequence or film chronology validation.
 * @evidence requirements/actors/state-and-continuity.md#actor-scene-state-handoff Emits the outgoing actor transform, pose phase, velocity, planted contacts, and mount state that a later chronological boundary can consume.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Produces the measured closing snapshot that the next chronological beat receives instead of resetting actor state.
 * @evidence specifications/narrative-and-intent/characters-relations-and-state.md#narrative-intent-scene-entry-exit-state Resolves the physical actor exit state at the shot end without extending it into a full story-state ledger.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-state-continuity-ledger Produces the measured closing-side actor state used by the continuity ledger rather than resetting the next boundary to defaults.
 */
export const resolveBeatEnd = (
  props: IResolveBeatProps,
): IAutoMovieBeatEndState => resolveSnapshot(props, props.shot.duration);
