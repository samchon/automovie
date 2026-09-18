/**
 * Subject-owned oral boundaries. Upper and lower curves share their endpoints
 * and run from negative to positive X. No landmark identity belongs to the
 * replaceable mouth implementation.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds a replaceable mouth to common outer vermilion and inner oral boundaries.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines ordered shared-corner upper/lower rims and a strictly interior lip-band seed without embedding landmark numbers.
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
