import type { FilmBodyRig as Rig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";

/** This film's authored rib surface seed, before actual collider-relative binding. */
export function filmRibPoint(
  context: { trunk: Rig.Trunk; forward: V.Value; left: V.Value },
  side: Rig.Side,
): V.Value {
  return V.add(
    context.trunk.chest,
    V.add(
      V.add(V.scale(context.forward, 0.07), [0, -0.17, 0]),
      V.scale(context.left, side === "left" ? 0.13 : -0.13),
    ),
  );
}
