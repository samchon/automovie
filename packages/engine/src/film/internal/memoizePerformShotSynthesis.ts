import type {
  IAutoMovieActionCall,
  IAutoMovieActionSynthesizer,
  IAutoMovieBeatEndState,
  IAutoMovieMotion,
} from "@automovie/interface";

/*
 * Wrap a shot's synthesizer so it runs once per action object and actor, with
 * the prior beat state bound, and every stage that needs a clip shares one.
 *
 * The cache is keyed by the action object's identity, in a `Map` owned by the
 * wrapper, and then by actor id; a `null` result is cached like a clip. The
 * wrapper and its cache live only as long as the `performShot` call that made
 * it.
 * Parameter synthesize: The production's synthesizer.
 * Parameter previous: The prior beat's end state, passed to every call.
 * Returns: The memoized synthesizer.
 */
export function memoizePerformShotSynthesis(
  synthesize: IAutoMovieActionSynthesizer,
  previous: IAutoMovieBeatEndState | null | undefined,
): IAutoMovieActionSynthesizer {
  const cache: Map<
    IAutoMovieActionCall,
    Map<string, IAutoMovieMotion | null>
  > = new Map();
  return (
    action: IAutoMovieActionCall,
    actor: string,
  ): IAutoMovieMotion | null => {
    let byActor: Map<string, IAutoMovieMotion | null> | undefined =
      cache.get(action);
    if (byActor === undefined) {
      byActor = new Map();
      cache.set(action, byActor);
    }
    if (byActor.has(actor)) return byActor.get(actor)!;
    const motion: IAutoMovieMotion | null = synthesize(action, actor, previous);
    byActor.set(actor, motion);
    return motion;
  };
}
