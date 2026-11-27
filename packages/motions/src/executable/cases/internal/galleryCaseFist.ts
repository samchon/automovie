import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
} from "@automovie/interface";

/*
 * Every finger segment of one hand flexed into a fist for the gallery: each
 * finger's proximal joint 85 degrees and its middle and distal joints 95, the
 * thumb's proximal 40 and distal 50 (provisional gallery angles).
 * Parameter side: The hand.
 * Returns: The clinical angles by bone.
 */
export function galleryCaseFist(
  side: AutoMovieHumanSide,
): GalleryCaseFistAngles {
  const out: GalleryCaseFistAngles = {};
  for (const digit of DIGITS)
    for (const k of SEGMENTS)
      out[`${side}${digit}${k}`] = [k === "Proximal" ? 85 : 95, 0, 0];
  out[`${side}ThumbProximal`] = [40, 0, 0];
  out[`${side}ThumbDistal`] = [50, 0, 0];
  return out;
}

/*
 * The record of `GalleryCaseFistAngles`'s site.
 */
type GalleryCaseFistAngles = Partial<
  Record<AutoMovieHumanoidBone, [number, number, number]>
>;

/*
 * The alternatives of `GalleryCaseFistDigit`'s site.
 */
type GalleryCaseFistDigit = "Index" | "Middle" | "Ring" | "Little";

/*
 * The alternatives of `GalleryCaseFistSegment`'s site.
 */
type GalleryCaseFistSegment = "Proximal" | "Intermediate" | "Distal";

/*
 * The four fingers.
 */
const DIGITS: readonly GalleryCaseFistDigit[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/*
 * Each finger's three segments.
 */
const SEGMENTS: readonly GalleryCaseFistSegment[] = [
  "Proximal",
  "Intermediate",
  "Distal",
];
