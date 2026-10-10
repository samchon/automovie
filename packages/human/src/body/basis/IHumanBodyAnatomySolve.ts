/**
 * The last anatomy solve of a body builder, kept with the key of the authored
 * weights and measurements it read so that pose, material and history edits
 * reuse it instead of solving again.
 *
 * @author Samchon
 */
export interface IHumanBodyAnatomySolve {
  /** Serialized authored weights and measurements the solve read. */
  key: string;

  /** The solved shape channel weights. */
  shape: Record<string, number>;
}
