/**
 * One optional exterior measurement of the simple tier and the channel its
 * own `HUMAN_BODY_MEASUREMENTS` rule solves.
 *
 * @evidence contracts/common.md#principled-implementation A closed set of optional exterior parameter names binds each requested metric measurement to its solving channel.
 * @evidence contracts/common.md#clear-and-simple-design The binding pairs one public parameter with one existing basis channel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule comes from the shared measurement table instead of duplicating an expected girth.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the simple parameter being set from the channel whose rule solves it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The optional measurement bindings declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The optional measurement bindings schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The optional measurement bindings type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMeasurement {
  /** The simple parameter the measurement sets. */
  parameter:
    | "waistMetres"
    | "hipsMetres"
    | "bustMetres"
    | "shoulderMetres"
    | "thighMetres"
    | "upperArmMetres"
    | "calfMetres";

  /** The body channel its rule solves. */
  channel: string;
}
