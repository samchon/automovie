import { IAutoMovieBeatEndActorState, IAutoMovieBeatEndState, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * The actor root's shot-local world transform at one sampled instant.
 *
 * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode Represents the actor root produced by the selected motion authority.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Defines the sampled world-frame result of procedural root trajectory resolution.
 * @author Samchon
 */
export interface IAutoMovieActorWorldFrame {
  /**
   * Actor-root position in world space.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-root-authority-mode Carries the world translation produced by the selected root authority.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Emits the sampled world root required by procedural trajectory consumers.
   */
  position: IAutoMovieVector3;
  /**
   * Actor-root orientation in world space.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-facing-travel Preserves root orientation independently from the translated travel path.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Carries the sampled root rotation used to interpret local target space.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * Authored yaw in degrees retained for locomotion synthesis.
   *
   * @evidence requirements/motion/root-motion-and-trajectories.md#motion-facing-travel Exposes the resolved facing direction separately from root displacement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Reports the sampled facing state of the procedural trajectory.
   */
  facingDeg: number;
}

const staticActorWorldFrame = (
  context: IAutoMovieActorContext,
): IAutoMovieActorWorldFrame => ({
  position: context.position,
  rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.facingDeg),
  facingDeg: context.facingDeg,
});

/** Resume one actor context from a verified prior beat snapshot. */
const resumeActorContext = (
  context: IAutoMovieActorContext,
  previous: IAutoMovieBeatEndActorState | undefined,
): IAutoMovieActorContext => {
  if (previous === undefined) return context;
  const carriedSpeed =
    previous.rootVelocity === null
      ? 0
      : Math.hypot(previous.rootVelocity.x, previous.rootVelocity.z);
  return {
    ...context,
    position: previous.transform.translation,
    facingDeg:
      (Math.atan2(previous.facing.x, previous.facing.z) * 180) / Math.PI,
    gaitPhase: previous.gaitPhase,
    speed: carriedSpeed > 1e-6 ? carriedSpeed : context.speed,
    restPose: previous.pose ?? context.restPose,
  };
};

/** Apply prior root positions to every positional target in the live beat. */
const resumedRuntime = (
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  placements: ReadonlyMap<string, IAutoMovieVector3>,
  previous: IAutoMovieBeatEndState | null | undefined,
): {
  contexts: Map<string, IAutoMovieActorContext>;
  nodes: Map<string, IAutoMovieVector3>;
} => {
  if (previous === null || previous === undefined)
    return {
      contexts: new Map(contexts),
      nodes: new Map(placements),
    };
  const states = new Map(previous.actors.map((actor) => [actor.node, actor]));
  const liveContexts = new Map(
    [...contexts].map(
      ([node, context]) =>
        [node, resumeActorContext(context, states.get(node))] as const,
    ),
  );
  const nodes = new Map(placements);
  for (const actor of previous.actors)
    if (nodes.has(actor.node))
      nodes.set(actor.node, actor.transform.translation);
  return { contexts: liveContexts, nodes };
};

/** Resume one actor context from a verified prior beat snapshot. */
const resumeActorContext = (
  context: IAutoMovieActorContext,
  previous: IAutoMovieBeatEndActorState | undefined,
): IAutoMovieActorContext => {
  if (previous === undefined) return context;
  const carriedSpeed =
    previous.rootVelocity === null
      ? 0
      : Math.hypot(previous.rootVelocity.x, previous.rootVelocity.z);
  return {
    ...context,
    position: previous.transform.translation,
    facingDeg:
      (Math.atan2(previous.facing.x, previous.facing.z) * 180) / Math.PI,
    gaitPhase: previous.gaitPhase,
    speed: carriedSpeed > 1e-6 ? carriedSpeed : context.speed,
    restPose: previous.pose ?? context.restPose,
  };
};
