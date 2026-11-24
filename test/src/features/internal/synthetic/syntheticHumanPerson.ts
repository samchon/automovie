import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

/**
 * A person for unit tests of a function that reads a person's placed actions,
 * overlays, holds, layers and stops: the given actions and nothing else.
 *
 * The performer, the skill, the standing posture and the layer context are
 * never read by the functions such a test calls, so they are left unset and
 * typed as their contracts (`as never`), which a read of them would expose at
 * once.
 *
 * @param subject The person's subject id.
 * @param segments The placed actions, in film order.
 * @param overlays The actions placed over them.
 * @returns The person.
 */
export function syntheticHumanPerson(
  subject: string,
  segments: IAutoMovieMotionHumanSegment[],
  overlays: IAutoMovieMotionHumanSegment.IOverlay[] = [],
): IAutoMovieMotionHumanSegment.IPerson {
  return {
    performer: { subject } as never,
    skill: undefined as never,
    segments,
    overlays,
    initial: undefined as never,
    layers: [],
    layer: undefined as never,
    holds: [],
    stops: new Map(),
  };
}
