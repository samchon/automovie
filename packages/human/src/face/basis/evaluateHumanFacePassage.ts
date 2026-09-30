import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

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
 * Protrusion is the largest forward offset, thickness the extent of the
 * slab's vertices along up. A failure names the protrusion channel, the
 * gap that is short and the millimetres measured and needed, so an author
 * opens the jaw or parts the lips by a stated amount instead of guessing.
 * Nothing is clamped or moved here.
 *
 * @evidence contracts/common.md#principled-implementation A tongue is a constant-volume muscular hydrostat, so a part of it that passes the incisal plane needs a slab thickness no larger than the interincisal and interlabial apertures. The plane passes through the lower incisal edge with the frame's forward normal because the tongue rides the mandible, thickness is the extent along up of the vertices within the slab about that plane, and a shortfall is reported with the channel, gap and millimetres needed instead of clamping the document.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the tongue's vertices and two apertures to test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It refuses with figures and moves nothing.
 * @evidence contracts/common.md#meaningful-documentation States the geometric rule, the plane, and what the error tells an author.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the shared head frame; millimetres appear only in the message text.
 * @evidenceExclude contracts/anatomy.md#anatomical-source evaluateHumanFacePassage carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range evaluateHumanFacePassage admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority evaluateHumanFacePassage defines no input through which a caller shapes a human form.
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
): { protrudingMetres: number; thicknessMetres: number } | null {
  const origin = frame.incisors.lower;
  let protruding = 0;
  let low = Infinity;
  let high = -Infinity;
  for (let at = 0; at < tongue.length; at += 3) {
    const offset = Vector3.subtract(
      Vector3.create(tongue[at], tongue[at + 1], tongue[at + 2]),
      origin,
    );
    const forward = Vector3.dot(offset, frame.forward);
    protruding = Math.max(protruding, forward);
    if (Math.abs(forward) <= contact.passage.slabMetres) {
      const height = Vector3.dot(offset, frame.up);
      low = Math.min(low, height);
      high = Math.max(high, height);
    }
  }
  if (protruding <= contact.toleranceMetres) return null;
  const thickness = high - low;
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
