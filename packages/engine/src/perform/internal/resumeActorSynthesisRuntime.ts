import {
  type IAutoMovieActorContext,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  type IAutoMovieResumeActorSynthesisRuntime,
  IAutoMovieVector3,
} from "@automovie/interface";

function resumeActorContext(
  context: IAutoMovieActorContext,
  previous: IAutoMovieBeatEndActorState | undefined,
): IAutoMovieActorContext {
  if (previous === undefined) return context;
  const carriedSpeed: number =
    previous.rootVelocity === null
      ? 0
      : Math.hypot(previous.rootVelocity.x, previous.rootVelocity.z);
  return {
    ...context,
    position: previous.transform.translation,
    facingDeg:
      (Math.atan2(previous.facing.x, previous.facing.z) * 180) / Math.PI,
    gaitPhase: previous.gaitPhase,
    gaitPeriod: previous.gaitPeriod,
    speed: carriedSpeed > 1e-6 ? carriedSpeed : context.speed,
    restPose: previous.pose ?? context.restPose,
  };
}

/**
 * Build per-action context and placement maps from a verified previous beat,
 * when supplied. Carried pose, facing, root position and gait phase replace the
 * staged values; horizontal speed below 1e-6 m/s keeps the authored speed.
 * Entries and nested pose data are borrowed.
 */
export function resumeActorSynthesisRuntime(
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  placements: ReadonlyMap<string, IAutoMovieVector3>,
  previous: IAutoMovieBeatEndState | null | undefined,
): IAutoMovieResumeActorSynthesisRuntime.IResult {
  if (previous === null || previous === undefined)
    return {
      contexts: new Map(contexts),
      nodes: new Map(placements),
    };
  const states: Map<string, IAutoMovieBeatEndActorState> = new Map(
    previous.actors.map(
      (
        actor: IAutoMovieBeatEndActorState,
      ): [string, IAutoMovieBeatEndActorState] => [actor.node, actor],
    ),
  );
  const liveContexts: Map<string, IAutoMovieActorContext> = new Map(
    [...contexts].map(
      ([node, context]: [string, IAutoMovieActorContext]): readonly [
        string,
        IAutoMovieActorContext,
      ] => [node, resumeActorContext(context, states.get(node))] as const,
    ),
  );
  const nodes: Map<string, IAutoMovieVector3> = new Map(placements);
  for (const actor of previous.actors)
    if (nodes.has(actor.node))
      nodes.set(actor.node, actor.transform.translation);
  return { contexts: liveContexts, nodes };
}
