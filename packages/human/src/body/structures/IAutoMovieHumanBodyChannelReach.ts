/**
 * The weight range a body channel can be evaluated over on its basis, and why
 * it ends where it does.
 *
 * @evidence contracts/common.md#principled-implementation Minimum and maximum delimit the evaluable signed weight; explanatory strings name missing corrective targets rather than physiological limits.
 * @evidence contracts/common.md#clear-and-simple-design The reach report keeps both bounds and their refusal causes together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Channel envelopes depend on the supplied basis and unavailable targets, without selecting a person or fixture.
 * @evidence contracts/common.md#meaningful-documentation Members explain evaluable bounds and why each limiting target matters.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The channel reach bounds declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The channel reach bounds schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The channel reach bounds type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelReach {
  /** Lowest evaluable weight. */
  minimum: number;

  /** Highest evaluable weight. */
  maximum: number;

  /** One sentence per matching missing corrective driver, including drivers whose onset does not tighten the final envelope. */
  limits: string[];
}
