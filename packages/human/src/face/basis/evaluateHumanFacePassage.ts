import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { measureHumanFaceTongueSection } from "./measureHumanFaceTongueSection";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Judge the contact contract's tongue passage: beyond the declared protrusion tolerance, its incisal-slab thickness must fit both current pair apertures. This is a geometric refusal rule, not a tissue mechanics simulation. The section is measured first; a tongue within the protrusion tolerance needs no subsequent aperture comparison and returns null.
 *
 * The plane passes through the posed lower incisal edge with the frame's forward normal because tongue and lower incisors share the mandible. Their common jaw movement is distinct from the tongue's own displacement relative to that edge.
 *
 * Protrusion is the positive part of the largest forward offset of a resident triangle; thickness is its slab intersection's extent along up. measureHumanFaceTongueSection reads corners and edge/plane intersections so it includes triangles whose corners all lie outside. A protruding surface with no slab section refuses because thickness is unavailable.
 *
 * A failure names the protrusion channel, the short gap and the measured/needed millimetres. Geometry is unchanged; opening by that reported difference describes this pair comparison, not a complete anatomical solution.
 *
 * @evidence contracts/common.md#principled-implementation The admitted pose caller supplies source triangles and its mandibular opening frame; affine triangle/slab intersections supply thickness, which is compared with both current pair gaps using the contact's declared tolerance. This floating section constraint does not model hydrostatic muscles or prove full swept collision freedom.
 * @evidence contracts/common.md#clear-and-simple-design Section measurement remains with its affine-triangle owner; this function owns only protrusion admission, two aperture comparisons and named diagnostic quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A protruding mesh without a measured slab section refuses, and short gaps produce measured causes rather than reducing tongue thickness or inventing an open aperture. The source tolerance is reused without another anatomical constant.
 * @evidence contracts/common.md#meaningful-documentation Prose gives the lower-incisor plane, basis metre quantities, actual measure-before-null ordering, absent-section refusal and the unchanged geometry boundary.
 * @evidence contracts/performance.md#efficient-algorithms Each call projects V source vertices and scans T triangles through the section helper, O(V+T) time and O(V) storage, even for the eventual behind-plane null result; the following two comparisons are constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work One computed section serves both tooth and lip comparisons on the same corrected pose. Changed positions/frame require measurement again; no prior-pose result or observer effect is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Projection buffers are per-call and collectible after return or refusal; the result transfers only protrusion/thickness scalars. No input array, viewer, task or external handle is retained.
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
  const section: { protrudingMetres: number; thicknessMetres: number | null } =
    measureHumanFaceTongueSection(tongue, indices, {
      origin: frame.incisors.lower,
      forward: frame.forward,
      up: frame.up,
      slabMetres: contact.passage.slabMetres,
    });
  const protruding: number = section.protrudingMetres;
  if (protruding <= contact.toleranceMetres) return null;
  if (section.thicknessMetres === null)
    throw new Error(
      "The protruding tongue has no incisal slab section to measure.",
    );
  const thickness: number = section.thicknessMetres;
  const mm: (metres: number) => string = (metres: number): string =>
    (metres * 1000).toFixed(1);
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
