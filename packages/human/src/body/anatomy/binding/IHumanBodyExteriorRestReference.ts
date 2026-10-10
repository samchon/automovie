/**
 * One consumer's neutral and evaluated rest exterior in matching vertex order.
 *
 * A whole-person consumer supplies its complete head and body partitions in
 * the same metre frame, so a head-only channel and a body channel displace
 * the internal assembly against the same exterior. These are runtime-owned
 * evaluated arrays, never personal vertices or independently authored skin.
 * The caller owns source correspondence and the shared-boundary evaluation.
 *
 * @author Samchon
 */
export interface IHumanBodyExteriorRestReference {
  /** Immutable neutral exterior in common body metres. */
  neutral: readonly number[];

  /** Evaluated rest exterior in exactly the neutral array's vertex order. */
  evaluated: readonly number[];
}
