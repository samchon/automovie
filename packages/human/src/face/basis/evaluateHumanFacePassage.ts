import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { measureHumanFaceTongueSection } from "./measureHumanFaceTongueSection";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Judge whether a posed tongue can be where the document put it: a tongue
 * past the incisal plane must be thinner, over the slab about that plane,
 * than the interincisal and the interlabial apertures, because a constant
 * volume muscular hydrostat cannot be pressed through closed teeth or sealed
 * lips. A tongue that stays behind the plane passes without measurement.
 *
 * The plane passes through the posed lower incisal edge with the frame's
 * forward normal, because the tongue rides the mandible: a protruding or
 * sliding jaw carries tongue and lower incisors together and protrudes
 * nothing, while the tongue's own channel carries it past that edge.
 * Protrusion is the largest forward offset of a resident triangle, thickness
 * the extent of its intersection with the slab along up. Source corners alone
 * can miss a section entirely, so measureHumanFaceTongueSection also measures
 * edge intersections with both slab planes. A protruding surface with no slab
 * intersection refuses because no passage thickness can be established.
 * A failure names the protrusion channel, the
 * gap that is short and the millimetres measured and needed, so an author
 * opens the jaw or parts the lips by a stated amount instead of guessing.
 * Nothing is clamped or moved here.
 */
export function evaluateHumanFacePassage(
  contact: Contact,
  tongue: readonly number[],
  frame: {
    up: IAutoMovieVector3;
    forward: IAutoMovieVector3;
    lips: { gap: number };
    incisors: {
      upper: IAutoMovieVector3;
      lower: IAutoMovieVector3;
      gap: number;
    };
  },
  indices: readonly number[],
): { protrudingMetres: number; thicknessMetres: number } | null {
  const section = measureHumanFaceTongueSection(tongue, indices, {
    origin: frame.incisors.lower,
    forward: frame.forward,
    up: frame.up,
    slabMetres: contact.passage.slabMetres,
  });
  const protruding = section.protrudingMetres;
  if (protruding <= contact.toleranceMetres) return null;
  if (section.thicknessMetres === null)
    throw new Error(
      "The protruding tongue has no incisal slab section to measure.",
    );
  const thickness = section.thicknessMetres;
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const [name, gap, channel] of [
    ["incisors", frame.incisors.gap, contact.closure.reference],
    ["lips", frame.lips.gap, contact.closure.channel],
  ] as const)
    if (thickness > gap + contact.toleranceMetres)
      throw new Error(
        `The tongue cannot pass the ${name}: ${contact.passage.channel} puts a ${mm(thickness)} mm tongue through a ${mm(gap)} mm gap; ${channel} must open it by at least ${mm(thickness - gap)} mm more.`,
      );
  return { protrudingMetres: protruding, thicknessMetres: thickness };
}
