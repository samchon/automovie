import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { FilmVector as V } from "../../src/motion/rig/FilmVector";

/** Independently observe this production's single symmetric provider head collider. Its world center is the transformed shape origin; this oracle never reads the production guard landmark or bounding-box helper. A changed provider representation requires a new explicit oracle. */
export function observedBoutHeadCenter(
  profile: Pick<P, "segments">,
  head: P.ITransform,
): V.Value {
  const shapes: P.IShape[] = profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === "head",
  )!.shapes;
  if (shapes.length !== 1)
    throw new Error(
      "The independent head-center oracle expects one symmetric provider shape",
    );
  const shape: P.IShape = shapes[0]!;
  return V.tuple(
    Vector3.add(
      head.position,
      Quaternion.rotateVector(head.rotation, shape.transform.position),
    ),
  );
}
