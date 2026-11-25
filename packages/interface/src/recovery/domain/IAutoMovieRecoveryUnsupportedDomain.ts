/** An omitted domain and its mandatory textual cause. */

export interface IAutoMovieRecoveryUnsupportedDomain {
  /** Identity of the omitted domain. */
  id: string;

  /** Nonempty original diagnostic cause. */
  reason: string;

  /** Optional producer record retained without assuming a shared payload shape. */
  detail?: unknown;
}
