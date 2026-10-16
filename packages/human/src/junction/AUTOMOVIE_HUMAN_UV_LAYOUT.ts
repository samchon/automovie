import { AUTOMOVIE_HUMAN_UV_LAYOUT_V3 } from "./AUTOMOVIE_HUMAN_UV_LAYOUT_V3";
import { AutoMovieHumanUvLayout } from "./AutoMovieHumanUvLayout";

/**
 * The published UV layout of the human profile's skin, version 4.
 *
 * Every part instance owns one rectangle of the unit atlas, and so does every branch of one, each digit of each hand and each of the trunk's shoulder and hip tubes, and a face corner's UV is a fixed function of its semantic address: `x` runs across the rectangle with `v`, starting at the chart's seam meridian, and `y` runs up it with `u`. The rectangle packing does not depend on identity or vertex indices. Each generator must additionally publish an identity-independent semantic map inside its rectangle; constant rectangles alone do not establish that invariant. Rectangles share one texel density, about 1.8 m of skin per atlas width, sized from the rounded girths and lengths of the generator's median 30-year-old adult; an identity of other proportions stretches its charts instead of changing the layout. The rectangles leave gaps of at least 0.01 for mip filtering.
 *
 * Seams are where the layout cuts the surface. Each junction ring is a chart boundary, and each chart's wrap seam lies on a low-visibility meridian, where Lévy et al. (2002, ACM TOG 21(3):362-371, "Least squares conformal maps") place cuts so texture discontinuity does not show: the posterior midline of the trunk, neck and head, under the hair and along the spinal furrow; the medial side of each arm, hand, digit and leg, against the body; the back of the heel and the sole of each foot; and behind each ear.
 *
 * Version 4 separates the hand texture chart from its physical sweep parameter: seven named palm bands occupy the lower seven eighths, the three webs have separate rectangles in the distal eighth, and each digit has equal logical sweep bands after its bridge plus a square cap chart. Hand texture addresses are local rectangles packed directly, with the palmar tube cut at its first logical column because quarter-turn cuts do not lie on every transition ring; webs and caps are explicitly cut from their neighbouring charts. Rectangle packing and all other parts keep their version 3 mapping; hand charts record the new physical seam at turn 0. These logical addresses stay fixed as the person changes; physical evaluation coordinates are preserved for other consumers.
 *
 * A change to any rectangle or seam breaks textures authored against the layout, so it bumps `version`. Version 2 gave each digit its own chart, which version 1 folded into its hand's; version 3 gave the trunk's shoulder and hip tubes their own charts, as wide as the arm's and the leg's so the texel density matches across the upper arm and thigh rings.
 */
export const AUTOMOVIE_HUMAN_UV_LAYOUT: AutoMovieHumanUvLayout.ILayout = {
  version: 4,
  charts: AUTOMOVIE_HUMAN_UV_LAYOUT_V3.charts.map(
    (chart: AutoMovieHumanUvLayout.IChart): AutoMovieHumanUvLayout.IChart => ({
      ...chart,
      seam: chart.part === "hand" ? 0 : chart.seam,
    }),
  ),
};
