import {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieActorContext } from "./IAutoMovieActorContext";

const resumeActorContext: (
  context: IAutoMovieActorContext,
  previous: IAutoMovieBeatEndActorState | undefined,
) => IAutoMovieActorContext = (
  context: IAutoMovieActorContext,
  previous: IAutoMovieBeatEndActorState | undefined,
): IAutoMovieActorContext => {
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
    speed: carriedSpeed > 1e-6 ? carriedSpeed : context.speed,
    restPose: previous.pose ?? context.restPose,
  };
};

/**
 * Build per-action context and placement maps from a verified previous beat, when supplied. Carried pose, facing, root position and gait phase replace the staged values; horizontal speed below 1e-6 m/s keeps the authored speed. Entries and nested pose data are borrowed.
 *
 * @evidence contracts/common.md#principled-implementation Indexes prior actors by node, updates known actor contexts, and replaces only already staged placement entries; the verified beat premise supplies matching poses and finite simulation quantities.
 * @evidence contracts/common.md#clear-and-simple-design Beat continuation is separate from verb dispatch so every positional target and actor reads the same resumed snapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-6 m/s threshold is the existing rest-speed policy; prior actors never create unstaged node entries, and duplicate prior ids use their final entry.
 * @evidence contracts/common.md#meaningful-documentation States the verified snapshot premise, carried pose/facing/root/speed/phase, rest-speed threshold, existing-id updates and borrowed nested data.
 * @evidence contracts/performance.md#efficient-algorithms For A contexts, N placements and P prior actors, one action costs O(A+N+P) time and O(A+N+P) temporary entries; maps are rebuilt for each call because callers may mutate the supplied maps or prior state.
 * @evidence contracts/performance.md#reuse-equivalent-work One returned snapshot serves all reads within its action; cross-action caching is absent because mutable maps and previous-state objects provide no revision contract.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned maps belong to the invocation and are released with it; only nested context, pose and translation references are shared, and there are no external resources.
 */
export const resumeActorSynthesisRuntime: (
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  placements: ReadonlyMap<string, IAutoMovieVector3>,
  previous: IAutoMovieBeatEndState | null | undefined,
) => {
  /** Call-local resumed actor lookup; nested poses, rigs and unchanged contexts are borrowed. */ contexts: Map<
    string,
    IAutoMovieActorContext
  >;
  /** Call-local staged-id lookup with known prior actor translations substituted; values are borrowed. */ nodes: Map<
    string,
    IAutoMovieVector3
  >;
} = (
  contexts: ReadonlyMap<string, IAutoMovieActorContext>,
  placements: ReadonlyMap<string, IAutoMovieVector3>,
  previous: IAutoMovieBeatEndState | null | undefined,
): {
  /** Call-local resumed actor lookup; nested poses, rigs and unchanged contexts are borrowed. */
  contexts: Map<string, IAutoMovieActorContext>;

  /** Call-local staged-id lookup with known prior actor translations substituted; values are borrowed. */
  nodes: Map<string, IAutoMovieVector3>;
} => {
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
};
