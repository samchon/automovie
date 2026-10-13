

/** Maximum aggregate source bytes observed for one layer revision.
 *
 * The provider refuses aggregate source bytes above 32 MiB before copying the next file, rather than publishing a partial revision population. This differs from per-file and file-count admission; checking the running total is O(1) per file, hashing belongs to the layer scan, and each request owns its copied sources independently of this process-owned scalar.
 */
export const MAX_LAYER_BYTES: number = 33_554_432;
