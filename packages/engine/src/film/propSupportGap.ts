import { IAutoMoviePropBox, IAutoMovieVector3 } from "@automovie/interface";

import { midpoint } from "../math/midpoint";
import { footprintContains } from "../space/footprintContains";
import { surfaceHeightAt } from "../space/surfaceHeightAt";
import { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";

/**
 * How far a staged prop's underside stands above the face it rests on, in metres: negative where it sinks into the support, zero where it touches it, positive where it floats. `null` when no probe of the prop's footprint lies over the face at all, which is the answer for a prop that does not stand over its support rather than one standing at the wrong height on it.
 *
 * Contact is probed from both sides: at the footprint's four corners and its centre where those land on the face, and at the face's own ring corners, holes included, where those land under the footprint. One side alone would be wrong in one direction each. A prop standing on a patch smaller than itself covers none of its own probes with the patch, and a patch wider than the prop is never reached at its corners, so a bench on a plinth and a chair on a floor are the same question asked from whichever side can answer it.
 *
 * The deepest probe answers, which is what lets a box resting along one edge of a ramp still be resting on it while a box whose near corner has gone through the ramp is not, and it is the same footprint sampling {@link supportContactsFor} decides a scene's supports by. Relief between the probes is not read: a support that rises and falls between them is answered where they stand. Edge intersections are not added as probes, so a thin overlap can be missed and even a planar support need not expose its deepest overlapping point to this finite probe set.
 *
 * @param props The face and the prop's world box.
 * @returns The smallest underside rise over the probed points, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Reads surfaceHeightAt at kept footprint probes and face ring corners under the prop, then takes the minimum sampled rise. Planar height is evaluated at those probes, but unread edge intersections can hide thin overlap or a deeper point; curved relief between probes is also outside this measurement.
 * @evidence contracts/common.md#clear-and-simple-design One measurement for every face kind `IAutoMoviePropSupportFace` carries, read by both the prop placement validator and the built-environment support status, so a patch, a prop top and a built part's top are judged by one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prop, face or tolerance is special-cased; deciding whether a gap is acceptable is left to the callers, which hold the contract's tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the sign convention, the unit, when `null` answers and why it differs from a wrong height, which probes are taken and why both sides are needed, why the deepest answers, and the unread relief between probes.
 * @evidence contracts/performance.md#efficient-algorithms Five footprint probes tested against the face in O(V) each for a face of V ring vertices, and V corner tests against the rectangle in O(1) each, so O(V) local traversal with one delegated height read per kept probe. Probe filtering, ring flattening and concatenation use O(V) temporary list storage. Height and rise representability is not enforced here; non-finite gaps can propagate to callers' comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measures one prop against one face per call and coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the probe arrays are released on return.
 */
export function propSupportGap (props: {
  /** The face the prop claims to rest on. */
  face: IAutoMoviePropSupportFace;

  /** The prop's world occupancy, from {@link propOccupancyBounds}. */
  bounds: IAutoMoviePropBox;
}): number | null {
  const bounds: IAutoMoviePropBox = props.bounds;
  const probes: IAutoMovieVector3[] = [
    ...footprintProbes(bounds).filter((probe: IAutoMovieVector3): boolean =>
      footprintContains(props.face.polygon, probe.x, probe.z),
    ),
    ...[
      ...props.face.polygon.outer.points,
      ...props.face.polygon.holes.flatMap(
        (
          hole: IAutoMoviePropSupportFace["polygon"]["holes"][number],
        ): readonly IAutoMovieVector3[] =>
          hole.points,
      ),
    ].filter((corner: IAutoMovieVector3): boolean =>
      underFootprint(corner, bounds),
    ),
  ];
  let gap: number | null = null;
  for (const probe of probes) {
    const rise: number =
      bounds.min.y - surfaceHeightAt(props.face.height, probe.x, probe.z);
    gap = gap === null ? rise : Math.min(gap, rise);
  }
  return gap;
}

/** Whether a ground-plan point stands under a staged prop's own footprint. */
function underFootprint (
  point: IAutoMovieVector3,
  bounds: IAutoMoviePropBox,
): boolean { return point.x >= bounds.min.x &&
  point.x <= bounds.max.x &&
  point.z >= bounds.min.z &&
  point.z <= bounds.max.z; }

/** The five ground-plan points a footprint is judged to bear on. */
function footprintProbes (bounds: IAutoMoviePropBox): IAutoMovieVector3[] { return [
  { x: bounds.min.x, y: 0, z: bounds.min.z },
  { x: bounds.max.x, y: 0, z: bounds.min.z },
  { x: bounds.max.x, y: 0, z: bounds.max.z },
  { x: bounds.min.x, y: 0, z: bounds.max.z },
  {
    x: midpoint(bounds.min.x, bounds.max.x),
    y: 0,
    z: midpoint(bounds.min.z, bounds.max.z),
  },
]; }
