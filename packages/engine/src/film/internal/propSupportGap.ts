import {
  IAutoMoviePropBox,
  type IAutoMoviePropSupportFace,
  type IAutoMoviePropSupportGap,
  IAutoMovieVector3,
} from "@automovie/interface";

import { midpoint } from "../../math/internal/midpoint";
import { AutoMovieEngineSpace } from "../../space/index";
import { surfaceHeightAt } from "../../space/surfaceHeightAt";

/**
 * How far a staged prop's underside stands above the face it rests on, in
 * metres: negative where it sinks into the support, zero where it touches it,
 * positive where it floats. `null` when no probe of the prop's footprint lies
 * over the face at all, which is the answer for a prop that does not stand over
 * its support rather than one standing at the wrong height on it.
 *
 * Contact is probed from both sides: at the footprint's four corners and its
 * centre where those land on the face, and at the face's own ring corners,
 * holes included, where those land under the footprint. One side alone would be
 * wrong in one direction each. A prop standing on a patch smaller than itself
 * covers none of its own probes with the patch, and a patch wider than the prop
 * is never reached at its corners, so a bench on a plinth and a chair on a
 * floor are the same question asked from whichever side can answer it.
 *
 * The deepest probe answers, which is what lets a box resting along one edge of
 * a ramp still be resting on it while a box whose near corner has gone through
 * the ramp is not, and it is the same footprint sampling
 * {@link supportContactsFor} decides a scene's supports by. Relief between the
 * probes is not read: a support that rises and falls between them is answered
 * where they stand. Edge intersections are not added as probes, so a thin
 * overlap can be missed and even a planar support need not expose its deepest
 * overlapping point to this finite probe set.
 *
 * @param props The face and the prop's world box.
 * @returns The smallest underside rise over the probed points, or `null`.
 */
export function propSupportGap(
  props: IAutoMoviePropSupportGap.IProps,
): number | null {
  const bounds: IAutoMoviePropBox = props.bounds;
  const probes: IAutoMovieVector3[] = [
    ...footprintProbes(bounds).filter((probe: IAutoMovieVector3): boolean =>
      AutoMovieEngineSpace.footprintContains(props.face.polygon, probe.x, probe.z),
    ),
    ...[
      ...props.face.polygon.outer.points,
      ...props.face.polygon.holes.flatMap(
        (
          hole: IAutoMoviePropSupportFace["polygon"]["holes"][number],
        ): readonly IAutoMovieVector3[] => hole.points,
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
function underFootprint(
  point: IAutoMovieVector3,
  bounds: IAutoMoviePropBox,
): boolean {
  return (
    point.x >= bounds.min.x &&
    point.x <= bounds.max.x &&
    point.z >= bounds.min.z &&
    point.z <= bounds.max.z
  );
}

/** The five ground-plan points a footprint is judged to bear on. */
function footprintProbes(bounds: IAutoMoviePropBox): IAutoMovieVector3[] {
  return [
    { x: bounds.min.x, y: 0, z: bounds.min.z },
    { x: bounds.max.x, y: 0, z: bounds.min.z },
    { x: bounds.max.x, y: 0, z: bounds.max.z },
    { x: bounds.min.x, y: 0, z: bounds.max.z },
    {
      x: midpoint(bounds.min.x, bounds.max.x),
      y: 0,
      z: midpoint(bounds.min.z, bounds.max.z),
    },
  ];
}
