import { IAutoMovieSweepSection } from "@automovie/engine";

/**
 * A thigh tube's first section, just below the crotch: its own half of the two thighs' outer contour, closed on the midline where it presses against the other thigh.
 *
 * The outer contour is the superellipse spanning both thighs, of half-breadth `half` and half-depth `depth` about the midline at depth `centre`, the same family as the crotch section above it, so the bridge between them joins two coincident outer curves and raises no bulge where a separate lobe would stand proud of them. The medial side is the lobe of half-width `half / 2` centred on the thigh's half, rounded by `medial`, which flattens the thigh where it meets the other one; the section is the intersection of the two, convex and so star-shaped about any inner point.
 *
 * The section is radial about the tube's spine point `start`, in the level plane whose first axis points backward and whose second points to the person's left, as the tube's first station lies.
 *
 * @param props.side The thigh, `1` for the person's left and `-1` for the right
 * @param props.centre Depth of the midline the contour is centred on, millimetres
 * @param props.depth Half-depth of the contour, millimetres
 * @param props.half Half-breadth across both thighs, millimetres
 * @param props.exponent Superellipse exponent of the outer contour
 * @param props.medial Superellipse exponent of the medial side
 * @param props.start The tube's spine point, `x` across and `z` in depth, millimetres
 * @returns The section in metres
 */
export function sectionAutoMovieHumanTrunkThigh(props: {
  side: 1 | -1;
  centre: number;
  depth: number;
  half: number;
  exponent: number;
  medial: number;
  start: { x: number; z: number };
}): IAutoMovieSweepSection.IRadial {
  const { side, centre, depth, half, exponent, medial, start } = props;
  const inside = (x: number, z: number): boolean => {
    const a: number = Math.abs((z - centre) / depth);
    if (Math.pow(a, exponent) + Math.pow(Math.abs(x / half), exponent) > 1)
      return false;
    const across: number = (x - (side * half) / 2) / (half / 2);
    // only the medial half of the lobe bounds the section; laterally the spanning contour does
    return (
      across * side >= 0 ||
      Math.pow(a / LOBE_DEPTH, medial) + Math.pow(Math.abs(across), medial) <= 1
    );
  };
  const reach: number = 4 * (half + depth);
  const radii: number[] = Array.from(
    { length: SAMPLES },
    (_: unknown, k: number): number => {
      const angle: number = (2 * Math.PI * k) / SAMPLES;
      // first axis backward, second toward the person's left
      const dx: number = Math.sin(angle);
      const dz: number = -Math.cos(angle);
      let low: number = 0;
      let high: number = reach;
      for (let step: number = 0; step < BISECTIONS; ++step) {
        const middle: number = (low + high) / 2;
        if (inside(start.x + middle * dx, start.z + middle * dz)) low = middle;
        else high = middle;
      }
      return low / 1000;
    },
  );
  return { type: "radial", radii };
}

/** Directions the section is sampled in. */
const SAMPLES: number = 96;

/** Bisection steps along a ray when it leaves the section. */
const BISECTIONS: number = 40;

/** The medial lobe's half-depth over the contour's, a little deeper so the lobe rounds only the medial corners and never cuts the front or back. */
const LOBE_DEPTH: number = 1.1;
