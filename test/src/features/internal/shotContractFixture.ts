import type {
  IAutoMovieShotContract,
  IAutoMovieShotEventContract,
} from "@automovie/interface";

/**
 * A complete shot contract that declares only its id and events.
 *
 * Every other field holds a neutral value: no participants, states or review
 * frames, a one-second span and an unconstrained camera. It serves consumers
 * that read the contract's id or events, such as sound planning and effect
 * materialization, without inventing data they never read.
 */
export function shotContractFixture(
  id: string,
  events: IAutoMovieShotEventContract[] = [],
): IAutoMovieShotContract {
  return {
    id,
    beat: "beat",
    source: { module: "test", export: id },
    durationSeconds: 1,
    participants: [],
    opening: [],
    closing: [],
    camera: { intent: "frame", requiredSubjects: [], maxOcclusionRatio: 1 },
    events,
    reviewFrames: [],
  };
}
