import { AutoMovieArchetypePoloMallet } from "../AutoMovieArchetypePoloMallet";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A polo mallet: a cane shaft with a rubber-wrapped grip and a wrist sling at
 * its top, and a cigar-shaped head set across its foot, struck with the head's
 * long side.
 *
 * It stands on its head at the origin, the shaft straight up along `+Y` to the
 * grip's end, the head lying along `X`. `grip` is the grip the hand closes on;
 * `sling` the loop at the grip's end the wrist passes through; `head` the
 * head's centre, its `+Y` running out of the mallet down the shaft's line, the
 * working point a swing carries through the ball (`tip`); `face` the head's
 * side toward `+Z`, its `+Y` out of it, the striking side of a forehand (a
 * backhand strikes with the other side).
 * Parameter params: Any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The mallet.
 * For a fixed dimension outside its band.
 */
export function createPoloMallet(
  params: AutoMovieArchetypePoloMallet.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePoloMallet.Affordance, AutoMovieArchetypePoloMallet.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePoloMallet.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypePoloMallet.Dimension>(
      "poloMallet",
      AutoMovieArchetypePoloMallet.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypePoloMallet.Dimension, number> = draw.dimensions(
    AutoMovieArchetypePoloMallet.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePoloMallet.Affordance,
    AutoMovieArchetypePoloMallet.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "poloMallet",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const r: number = d.headDiameter / 2;
  const hold: number = AutoMovieArchetypePoloMallet.GRIP_LENGTH;
  builder.rod(
    "head",
    r,
    v(-d.headLength / 2 + r, r, 0),
    v(d.headLength / 2 - r, r, 0),
    { color: "#d9c7a0", density: 1.2, round: true },
  );
  builder.rod(
    "shaft",
    AutoMovieArchetypePoloMallet.CANE / 2,
    v(0, 2 * r, 0),
    v(0, d.length - hold, 0),
    {
      color: "#c8a86b",
    },
  );
  builder.rod(
    "grip",
    d.gripDiameter / 2,
    v(0, d.length - hold, 0),
    v(0, d.length, 0),
    {
      color: "#2b2622",
    },
  );
  // The sling: a flat loop hanging from the grip's end, drawn as four thin rods.
  const s: number = AutoMovieArchetypePoloMallet.SLING;
  const top: number = d.length;
  const corners: readonly ReturnType<typeof v>[] = [
    v(0, top, 0),
    v(s / 2, top - s / 2, 0),
    v(0, top - s, 0),
    v(-s / 2, top - s / 2, 0),
  ];
  corners.forEach((from, k: number): void => {
    builder.rod(`sling${k}`, 0.004, from, corners[(k + 1) % corners.length]!, {
      color: "#4a3b2a",
    });
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.length - hold / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDiameter,
    length: hold,
  });
  builder.affordance({
    id: "sling",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top - s / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: s,
    length: s,
  });
  builder.affordance({
    id: "head",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(v(0, r, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(v(0, r, r), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width: d.headLength,
  });
  return builder.build(d.mass);
}
