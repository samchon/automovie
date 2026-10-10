/**
 * Subject-owned oral boundaries. Upper and lower curves share their endpoints
 * and run from negative to positive X. No landmark identity belongs to the
 * replaceable mouth implementation.
 *
 * @author Samchon
 */
export interface IPortraitMouthSocket {
  /** Closed outer vermilion loop, in boundary order. */
  outer: number[];

  /** Upper inner lip from negative to positive X. */
  upper: number[];

  /** Lower inner lip in the same direction. */
  lower: number[];

  /** A vertex strictly inside the connected vermilion band. */
  lipSeed: number;
}
