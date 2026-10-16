/**
 * Neck-column semi-axes over mean neck radius: across, anterior and posterior, with the blend width of the internal mandibular guide. Grade: conventional.
 *
 * The simple neck tube cut and the upper-neck guide read the same semi-axes. Only the internal mandibular outline combines that column with the jawline; the actual part boundary contains no jaw.
 */
export const AUTOMOVIE_HUMAN_NECK_COLUMN: { readonly across: 0.9; readonly front: 0.76; readonly back: 0.95; readonly blend: 0.15; } = {
  across: 0.9,
  front: 0.76,
  back: 0.95,
  blend: 0.15,
} as const;
