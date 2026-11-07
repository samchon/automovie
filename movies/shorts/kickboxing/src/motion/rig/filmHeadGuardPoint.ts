import { physicalShapeBounds } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { FilmVector as V } from "./FilmVector";

/** Aim protection at the center of the actual head collision envelope, rather than its skull-base joint. The provider owns the head geometry; this film chooses which visible region its guards protect. */
export function filmHeadGuardPoint(
  profile: Pick<P, "segments">,
  head: P.ITransform,
): V.Value {
  const bounds: ReturnType<typeof physicalShapeBounds>[] = profile.segments
    .find((segment: P.ISegment): boolean => segment.bone === "head")!
    .shapes.map(
      (shape: P.IShape): ReturnType<typeof physicalShapeBounds> =>
        physicalShapeBounds(head, shape),
    );
  return [
    (Math.min(
      ...bounds.map((bound: (typeof bounds)[number]): number => bound.min.x),
    ) +
      Math.max(
        ...bounds.map((bound: (typeof bounds)[number]): number => bound.max.x),
      )) /
      2,
    (Math.min(
      ...bounds.map((bound: (typeof bounds)[number]): number => bound.min.y),
    ) +
      Math.max(
        ...bounds.map((bound: (typeof bounds)[number]): number => bound.max.y),
      )) /
      2,
    (Math.min(
      ...bounds.map((bound: (typeof bounds)[number]): number => bound.min.z),
    ) +
      Math.max(
        ...bounds.map((bound: (typeof bounds)[number]): number => bound.max.z),
      )) /
      2,
  ];
}
