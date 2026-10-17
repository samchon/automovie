import type { V2 } from "../geometry/V2.ts";

/**
 * Measures one closed native section independently of a chosen curve basis.
 * Skin perimeter follows concavities and is distinct from a convex tape girth.
 *
 * @evidence contracts/common.md#principled-implementation Keeps independently measured section dimensions and axis eccentricity separate from a fitted curve basis.
 * @evidence contracts/common.md#clear-and-simple-design This record carries only this declaration's observation responsibility; geometric operators and consumer fitting remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private source coordinates, identity table, consumer exception or product mesh.
 * @evidence contracts/common.md#meaningful-documentation Defines the record's observation purpose and its non-obvious units, ownership or qualification limits above and beside the affected members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface LimbDimension {
  /** Source section identifier used to retain correspondence with its measured contour. */
  section: string;

  /** Physical station coordinate along the declared rig segment, in millimetres. */
  axisMm: number;

  /** Range along the section's u axis, in millimetres. */
  breadthMm: number;

  /** Range along the section's v axis, in millimetres. */
  depthMm: number;

  /** Measured contour path including concavities, in millimetres. */
  skinPerimeterMm: number;

  /** Signed enclosed section area, in square millimetres. */
  areaMm2: number;

  /** Centre of the section's coordinate bounds relative to its rig axis, in millimetres. */
  originOffsetUV: V2;
}
