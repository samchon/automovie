import type { AutoMovieArkitChannel } from "./AutoMovieArkitChannel";

/**
 * One ARKit blendshape channel set to a weight.
 *
 * ValidateExpression checks the closed 52-name channel vocabulary, finite
 * unit-interval weights and duplicate channels in an expression list. The
 * record declares a coefficient; it does not create a mesh target or prove a
 * visible deformation.
 *
 * ApplyExpression replaces the expanded preset weight for the same channel,
 * then writes matching morph names or explicit host sinks. Unmatched morph
 * names have no effect, and host sinks own their name interpretation.
 */
export interface IAutoMovieBlendshapeChannel {
  /** ARKit channel, from the closed 52-name menu. */
  channel: AutoMovieArkitChannel;

  /** Activation weight in `[0, 1]`: `0` inactive, `1` full. */
  weight: number;
}
