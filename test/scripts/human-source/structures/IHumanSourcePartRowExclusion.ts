/**
 * One attached part that an endpoint must not move, with the reason.
 *
 * @author Samchon
 */
export interface IHumanSourcePartRowExclusion {
  /** Part surface whose rows of the endpoint are removed. */
  surface: string;

  /** Endpoint name. */
  endpoint: string;

  /** Why this part does not follow this endpoint. */
  reason: string;
}
