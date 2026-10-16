/**
 * The neck column in the mandibular plane, over the neck circumference's mean radius: across, in front over the larynx, and behind before the plane's tilt lengthens it, with the smooth-maximum blend width to the jaw. Conventional.
 *
 * `shapeAutoMovieHumanRing` shapes the `neckTop` ring's column from it, and the head continues that column above the ring under the occiput, so both read this one constant.
 */
export const AUTOMOVIE_HUMAN_NECK_COLUMN = {
  across: 0.9,
  front: 0.76,
  back: 0.95,
  blend: 0.15,
} as const;
