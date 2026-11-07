import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import type { FilmBodyRig as BodyRig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";

/** Resolve this film's head guard and forward post from actual shoulder, arm and glove geometry. Extension blends from the ordinary guard to reachable head-height protection, on either anatomical side. */
export function filmGuard(
  context: {
    rig: BodyRig;
    trunk: BodyRig.Trunk;
    forward: V.Value;
    left: V.Value;
  },
  side: BodyRig.Side,
  tight: number,
  extension: number = 0,
  feintReach: number = 0,
): BodyRig.Goal {
  const lead: boolean = side === "left";
  const forward: number =
    (lead ? Ease.lerp(0.27, 0.18, tight) : 0.14) + feintReach;
  const height: number = lead
    ? Ease.lerp(-0.05, 0, tight)
    : Ease.lerp(-0.07, -0.02, tight);
  const lateral: number = lead
    ? Ease.lerp(0.07, 0.09, tight)
    : Ease.lerp(-0.13, -0.11, tight);
  const guard: V.Value = V.add(
    context.trunk.headCenter,
    V.add(
      V.add(V.scale(context.forward, forward), [0, height, 0]),
      V.scale(context.left, lateral),
    ),
  );
  const shoulder: V.Value = context.trunk.shoulders[side];
  const rise: number = context.trunk.headCenter[1] - shoulder[1];
  const reach: number = context.rig.armReach[side];
  const post: V.Value = V.add(
    shoulder,
    V.add(
      V.scale(
        context.forward,
        Math.sqrt(Math.max(0, reach * reach - rise * rise)),
      ),
      [0, rise, 0],
    ),
  );
  const point: V.Value = V.lerp(guard, post, extension);
  const elbow: V.Value = V.add(
    shoulder,
    V.add(V.scale(context.forward, 0.1), [0, -0.24, 0]),
  );
  return {
    point,
    ...(extension < 1
      ? {
          aim: {
            bone: "elbow" as const,
            point: elbow,
            weight: 0.25 * (1 - extension),
          },
        }
      : {}),
  };
}
