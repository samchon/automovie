import { IAutoMoviePropBox } from "@automovie/interface";
import { footprintContains } from "../space/footprintContains";
import { surfaceHeightAt } from "../space/surfaceHeightAt";
import { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";

/**
 * How far a staged prop's underside stands above the face it rests on: negative
 * where it sinks into the support, zero where it touches it, positive where it
 * floats. `null` when no probe of the prop's footprint lies over the face at
 * all, which is the answer for a prop that does not stand over its support
 * rather than one standing at the wrong height on it.
 *
 * Contact is probed from both sides: at the footprint's four corners and its
 * centre where those land on the face, and at the face's own corners where
 * those land under the footprint. One side alone would be wrong in one
 * direction each. A prop standing on a patch smaller than itself covers none of
 * its own probes with the patch, and a patch wider than the prop is never
 * reached at its corners, so a bench on a plinth and a chair on a floor are the
 * same question asked from whichever side can answer it.
 *
 * The deepest of those probes answers, which is what lets a box resting along
 * one edge of a ramp still be resting on it while a box whose near corner has
 * gone through the ramp is not, and it is the same footprint sampling
 * {@link supportContactsFor} decides a scene's supports by. Relief between the
 * probes is not read: a support that rises and falls between them is answered
 * where they stand.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-anchor-support propSupportGap measures penetration, contact, or flotation only where the prop footprint actually overlaps the declared support face.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propSupportGap realizes furnishing placement clearance: How far a staged prop's underside stands above the face it rests on: negative where it sinks into the support, zero where it touches it, positive where it floats. `null` when no probe of the prop's footprint lies over the face at all, which is the answer for a prop that does not stand over its support rather than one standing at the wrong height on it. Contact is probed from both sides: at the footprint's four corners and its centre where those land on the face, and at the face's own corners where those land under the footprint. One side alone would be wrong in one direction each. A prop standing on a patch smaller than itself covers none of its own probes with the patch, and a patch wider than the prop is never reached at its corners, so a bench on a plinth and a chair on a floor are the same question asked from whichever side can answer it. The deepest of those probes answers, which is what lets a box resting along one edge of a ramp still be resting on it while a box whose near corner has gone through the ramp is not, and it is the same footprint sampling {@link supportContactsFor} decides a scene's supports by. Relief between the probes is not read: a support that rises and falls between them is answered where they stand.
 */
export const propSupportGap = (props: {
  /** The face the prop claims to rest on. */
  face: IAutoMoviePropSupportFace;

  /** The prop's world occupancy, from {@link propOccupancyBounds}. */
  bounds: IAutoMoviePropBox;
}): number | null => {
  const bounds = props.bounds;
  const probes = [
    ...footprintProbes(bounds).filter((probe) =>
      footprintContains(props.face.polygon, probe.x, probe.z),
    ),
    ...[
      ...props.face.polygon.outer.points,
      ...props.face.polygon.holes.flatMap((hole) => hole.points),
    ].filter((corner) => underFootprint(corner, bounds)),
  ];
  let gap: number | null = null;
  for (const probe of probes) {
    const rise =
      bounds.min.y - surfaceHeightAt(props.face.height, probe.x, probe.z);
    gap = gap === null ? rise : Math.min(gap, rise);
  }
  return gap;
};
