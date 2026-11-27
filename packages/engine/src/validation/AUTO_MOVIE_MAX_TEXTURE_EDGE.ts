/**
 * The largest edge a portable target is required to sample.
 *
 * WebGL 2 guarantees `MAX_TEXTURE_SIZE >= 2048` and desktop GPUs report 16384,
 * but a 16k tile is not a finish decision, it is a download nobody meant to
 * ship. 8192 is the widest edge every currently targeted browser/GPU pair in
 * this project's capture matrix samples without a driver-side rescale, so it is
 * the bound a production is held to rather than the bound a driver happens to
 * allow.
 */
export const AUTO_MOVIE_MAX_TEXTURE_EDGE = 8192;
