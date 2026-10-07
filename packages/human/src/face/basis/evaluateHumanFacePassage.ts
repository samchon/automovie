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
 *
 * @evidence contracts/common.md#principled-implementation The part of a tongue crossing the incisal plane needs a slab thickness no larger than both apertures. The section owner measures the complete triangle/slab intersection, including edge crossings when every source corner is outside. An absent section refuses rather than using an undefined or negative-infinite thickness, and a shortfall reports the channel, gap and metres needed.
 * @evidence contracts/common.md#clear-and-simple-design One shared triangle-section measurement followed by comparison against the two apertures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It refuses with figures and moves nothing.
 * @evidence contracts/common.md#meaningful-documentation States the geometric rule, the plane, and what the error tells an author.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the shared head frame; millimetres appear only in the message text.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping evaluateHumanFacePassage is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels evaluateHumanFacePassage defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry evaluateHumanFacePassage emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries evaluateHumanFacePassage constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation evaluateHumanFacePassage owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
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
