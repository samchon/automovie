/** Ordered lower and upper host-skin boundaries of one complete eyebrow band.
 *
 *
 * @evidence contracts/common.md#principled-implementation Ordered upper/lower source vertex identities define one complete native implantation band and its anatomical side.
 * @evidence contracts/common.md#clear-and-simple-design The binding separates source correspondence from shaft dimensions and population controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Side is declared anatomically rather than guessed from mirrored coordinates, and source vertex identity is retained through seating.
 * @evidence contracts/common.md#meaningful-documentation Members give shared source order and side ownership; connected guides derive the medial endpoint from the band, while portrait sockets supply increasing-X rows.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyebrowBinding is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyebrowBinding declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyebrowBinding acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowBinding {
  /** Anatomical side of the registered implantation band, independent of coordinates. */
  side: "left" | "right";

  /** Ordered source indices; portrait sockets use increasing X and connected guides derive the medial endpoint. */
  upper: number[];

  /** Same source direction as the upper row. */
  lower: number[];
}
