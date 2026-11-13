/**
 * Why a composition was not performed, with the facts of the package's
 * `HumanRefusal` copied field for field.
 *
 * `message` is the package's own text and is shown unedited. A failure that
 * is not a refusal (an error the package throws for another reason, or an
 * operator the adapter cannot build) has `kind` `error` and only a message.
 */
export interface IPlaygroundRefusal {
  /** The refusal's class, or `error` for a failure that is not a refusal. */
  kind: string;

  /** The message, verbatim. */
  message: string;

  /** The performer who was to act; empty when unknown. */
  performer: string;

  /** The action refused; empty when unknown. */
  act: string;

  /** Which occurrence of that action in the performer's chain, from 1; 0 when unknown. */
  instance: number;

  /** The axis at fault; empty for an error. */
  axis: string;

  /** The value given on that axis. */
  value: unknown;

  /** What the axis accepts, as the package describes it; null when it names nothing. */
  feasible: string | null;

  /** The values that would have been accepted, when the axis takes a closed set; the editor offers each as a fix. */
  alternatives: string[];

  /** One sentence naming what to change; empty for an error. */
  fix: string;
}
