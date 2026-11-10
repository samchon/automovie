/**
 * ANSUR II ratio bands the trunk and neck observers search inside or judge
 * against: each sex's mean plus and minus 2.326 SD (the 1st to 99th percentile
 * of a normal), the union of both sexes, computed per subject from the public
 * working databases in `packages/human/docs/sources/ansur-ii-trunk-ratios.md`.
 * Heights are over stature; the neck ratio is a girth over a girth.
 */
export namespace HumanAnatomyTrunkBand {
  /** Chest point height over stature. */
  export const CHEST_HEIGHT: readonly [number, number] = [0.6867, 0.7596];

  /** Buttock height over stature. */
  export const BUTTOCK_HEIGHT: readonly [number, number] = [0.4672, 0.5482];

  /** Suprasternale height over stature; it bounds the notch's search and is not a row. */
  export const SUPRASTERNALE_HEIGHT: readonly [number, number] = [
    0.7999, 0.8355,
  ];

  /** Cervicale height over stature. */
  export const CERVICALE_HEIGHT: readonly [number, number] = [0.8411, 0.8793];

  /** Neck base circumference over neck circumference. */
  export const NECK_BASE_RATIO: readonly [number, number] = [1.0338, 1.1994];
}
