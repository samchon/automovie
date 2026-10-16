import { AutoMovieHumanBranch } from "./AutoMovieHumanBranch";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { AutoMovieHumanUvLayout } from "./AutoMovieHumanUvLayout";
/**
 * The preserved version 3 skin atlas. These rectangles and seams remain independent of later layout versions; version 3 maps the generators' physical evaluation coordinates.
 *
 * Every part instance owns one rectangle of the unit atlas, and so does every branch of one, each digit of each hand and each of the trunk's shoulder and hip tubes, and a face corner's UV is a fixed function of its semantic address: `x` runs across the rectangle with `v`, starting at the chart's seam meridian, and `y` runs up it with `u`. The rectangles were fixed, but version 3 hand coordinates reused identity-dependent physical sweep parameters. This record and mapping are retained to reproduce existing textures; they do not establish identity-invariant hand UVs. Rectangles share one texel density, about 1.8 m of skin per atlas width, sized from the rounded girths and lengths of the generator's median 30-year-old adult; an identity of other proportions stretches its charts instead of changing the layout. The rectangles leave gaps of at least 0.01 for mip filtering.
 *
 * Seams are where the layout cuts the surface. Each junction ring is a chart boundary, and each chart's wrap seam lies on a low-visibility meridian, where Lévy et al. (2002, ACM TOG 21(3):362-371, "Least squares conformal maps") place cuts so texture discontinuity does not show: the posterior midline of the trunk, neck and head, under the hair and along the spinal furrow; the medial side of each arm, hand, digit and leg, against the body; the back of the heel and the sole of each foot; and behind each ear.
 *
 * A change to any rectangle or seam breaks textures authored against the layout, so it bumps `version`. Version 2 gave each digit its own chart, which version 1 folded into its hand's; version 3 gave the trunk's shoulder and hip tubes their own charts, as wide as the arm's and the leg's so the texel density matches across the upper arm and thigh rings.
 */
export const AUTOMOVIE_HUMAN_UV_LAYOUT_V3: AutoMovieHumanUvLayout.ILayout = {
    version: 3,
    charts: [
        chart("trunk", null, 0.5, [0.0, 0.0, 0.556, 0.5]),
        chart("leg", "left", 0.25, [0.57, 0.0, 0.25, 0.303]),
        chart("leg", "right", 0.75, [0.57, 0.32, 0.25, 0.303]),
        chart("arm", "left", 0.25, [0.832, 0.0, 0.167, 0.239]),
        chart("arm", "right", 0.75, [0.832, 0.25, 0.167, 0.239]),
        chart("head", null, 0.5, [0.0, 0.52, 0.317, 0.167]),
        chart("neck", null, 0.5, [0.33, 0.52, 0.222, 0.056]),
        chart("ear", "left", 0.75, [0.33, 0.59, 0.083, 0.033]),
        chart("ear", "right", 0.25, [0.425, 0.59, 0.083, 0.033]),
        chart("hand", "left", 0.25, [0.0, 0.7, 0.111, 0.106]),
        chart("hand", "right", 0.75, [0.12, 0.7, 0.111, 0.106]),
        chart("foot", "left", 0.5, [0.24, 0.7, 0.139, 0.167]),
        chart("foot", "right", 0.5, [0.39, 0.7, 0.139, 0.167]),
        ...digits("left", 0.25, 0.64),
        ...digits("right", 0.75, 0.7),
        // the trunk's tubes out to the limb rings: as wide as the limb's chart, so one turn has the same texels on both sides of the ring
        chart("trunk", null, 0.25, [0.832, 0.5, 0.167, 0.083], "leftShoulder"),
        chart("trunk", null, 0.75, [0.832, 0.6, 0.167, 0.083], "rightShoulder"),
        chart("trunk", null, 0.25, [0.57, 0.76, 0.25, 0.11], "leftHip"),
        chart("trunk", null, 0.75, [0.57, 0.88, 0.25, 0.11], "rightHip"),
    ],
};
/** One chart's record from its rectangle `[x, y, width, height]`. */
function chart(part: AutoMovieHumanPart, side: AutoMovieHumanSide | null, seam: number, [x, y, width, height]: [
    number,
    number,
    number,
    number
], branch: AutoMovieHumanBranch | null = null): AutoMovieHumanUvLayout.IChart {
    return { part, side, branch, seam, x, y, width, height };
}
/**
 * The five digit charts of one hand in a row from `x` 0.57, thumb first: 0.04 wide for a digit's girth and 0.045 tall for its length at the layout's texel density, 0.05 apart, their seams on the hand's medial meridian.
 */
function digits(side: AutoMovieHumanSide, seam: number, y: number): AutoMovieHumanUvLayout.IChart[] {
    return (["thumb", "index", "middle", "ring", "little"] as const).map((branch: "thumb" | "index" | "middle" | "ring" | "little", i: number): AutoMovieHumanUvLayout.IChart => chart("hand", side, seam, [0.57 + 0.05 * i, y, 0.04, 0.045], branch));
}
