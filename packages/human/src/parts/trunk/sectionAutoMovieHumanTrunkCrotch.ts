import { IAutoMovieSweepSection } from "@automovie/engine";

/**
 * The trunk's lowest section, at the crotch: the outer contour of the two thighs side by side, with the clefts between them filled to a given depth.
 *
 * Each thigh is a superellipse lobe of half-depth `depth` and half-width `half / 2`, centred `half / 2` either side of the midline, rounded by `exponent` on its lateral side and flattened by `medial` on the side it presses against the other thigh, so the lobes touch at the section's centre and their outer sides span the full breadth `half` either way. The two thighs' tubes start on these same lobes, in the same superellipse family, so the bridges between the trunk and the tubes join nearly coincident loops. Between the lobes the contour would reach the centre; the front and back clefts are instead filled to `depth - recess` of the single superellipse spanning both lobes, which is where the pubic region and the natal cleft lie at that level.
 *
 * The section is radial about the centre: the contour's distance at evenly spaced angles, the first forward, then toward the person's left, which keeps it star-shaped as direction correspondence needs.
 *
 * @param props.depth Half-depth of the lobes and of the section, millimetres
 * @param props.half Half-breadth of the section across both lobes, millimetres
 * @param props.exponent Superellipse exponent of the lobes' lateral sides and of the spanning section
 * @param props.medial Superellipse exponent of the lobes' medial sides
 * @param props.recess Depth of the front and back clefts below the spanning section, millimetres
 * @returns The section in metres
 */
export function sectionAutoMovieHumanTrunkCrotch(props: {
  depth: number;
  half: number;
  exponent: number;
  medial: number;
  recess: { front: number; back: number };
}): IAutoMovieSweepSection.IRadial {
  const { depth, half, exponent } = props;
  const radii: number[] = [];
  for (let k: number = 0; k < SAMPLES; ++k) {
    const angle: number = (2 * Math.PI * k) / SAMPLES;
    const forward: number = Math.cos(angle);
    const lateral: number = Math.sin(angle);
    const spanning: number = radiusOf(forward / depth, lateral / half, exponent);
    const cleft: number = forward >= 0 ? props.recess.front : props.recess.back;
    radii.push(Math.max(lobes(forward, lateral, depth, half / 2, exponent, props.medial), spanning - cleft) / 1000);
  }
  return { type: "radial", radii };
}

/** Directions the crotch section is sampled in. */
const SAMPLES: number = 96;

/** Bisection steps along a ray when it leaves a lobe. */
const BISECTIONS: number = 40;

/** Distance along the unit direction `(a / sa, b / sb)` scaled back, to a superellipse of unit half-axes centred at the origin: `(|a|^n + |b|^n)^(-1/n)`. */
const radiusOf = (a: number, b: number, n: number): number =>
  Math.pow(Math.pow(Math.abs(a), n) + Math.pow(Math.abs(b), n), -1 / n);

/** Distance from the section centre along a direction to where it leaves the lobe on its side; 0 along the midline. */
const lobes = (
  forward: number,
  lateral: number,
  depth: number,
  width: number,
  n: number,
  medial: number,
): number => {
  if (Math.abs(lateral) < 1e-12) return 0;
  const side: number = Math.sign(lateral);
  const inside = (t: number): boolean => {
    const across: number = (t * lateral - side * width) / width;
    const e: number = across * side < 0 ? medial : n;
    return Math.pow(Math.abs((t * forward) / depth), e) + Math.pow(Math.abs(across), e) <= 1;
  };
  // the ray starts on the lobe's boundary at the centre and runs through the lobe, leaving it once
  let low: number = 0;
  let high: number = 2 * (depth + 2 * width);
  for (let step: number = 0; step < BISECTIONS; ++step) {
    const middle: number = (low + high) / 2;
    if (inside(middle) || middle < 1e-9) low = middle;
    else high = middle;
  }
  return low;
};
