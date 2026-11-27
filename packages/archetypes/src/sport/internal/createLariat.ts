import { AutoMovieArchetypeLariat } from "../AutoMovieArchetypeLariat";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A lariat, a roper's catch rope: a loop running through the hondo, the eye
 * tied at the rope's working end, the spoke from the hondo back to the swinging
 * hand, and the coiled tail the other hand holds with the reins.
 *
 * It lies open on the floor: the loop a circle of the drawn diameter centred
 * over the origin in the `XZ` plane, the hondo at its `+Z` point, the spoke
 * running from it along `+Z`, and the coils lying beyond. The rope is rigid
 * here: an act swings, throws and settles the loop by posing it. `spoke` is the
 * swinging hand's hold, at the spoke's far end where the hand takes loop and
 * spoke together; `coils` is the tail the rein hand holds; `hondo` is the eye;
 * `loop` the loop's centre, its `+Y` the loop's normal.
 * Parameter params: Any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The lariat.
 * For a fixed dimension outside its band.
 */
export function createLariat(
  params: AutoMovieArchetypeLariat.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLariat.Affordance, AutoMovieArchetypeLariat.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLariat.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLariat.Dimension>(
      "lariat",
      AutoMovieArchetypeLariat.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeLariat.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeLariat.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLariat.Affordance,
    AutoMovieArchetypeLariat.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "fabric",
    id: params.id,
    name: "lariat",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.diameter / 2;
  const ring = (
    id: string,
    centre: IAutoMovieVector3,
    radius: number,
  ): void => {
    for (let k: number = 0; k < AutoMovieArchetypeLariat.SEGMENTS; ++k) {
      const a: number = (2 * Math.PI * k) / AutoMovieArchetypeLariat.SEGMENTS;
      const b: number = (2 * Math.PI * (k + 1)) / AutoMovieArchetypeLariat.SEGMENTS;
      builder.rod(
        `${id}${k}`,
        r,
        v(
          centre.x + radius * Math.sin(a),
          centre.y,
          centre.z + radius * Math.cos(a),
        ),
        v(
          centre.x + radius * Math.sin(b),
          centre.y,
          centre.z + radius * Math.cos(b),
        ),
        { color: "#c9b48a" },
      );
    }
  };
  const loop: number = d.loop / 2;
  ring("loop", v(0, r, 0), loop);
  builder.rod(
    "hondo",
    r * 1.5,
    v(0, r, loop),
    v(0, r, loop + AutoMovieArchetypeLariat.HONDO),
    {
      color: "#b09a70",
    },
  );
  const hand: number = loop + AutoMovieArchetypeLariat.HONDO + d.spoke;
  builder.rod("spoke", r, v(0, r, loop + AutoMovieArchetypeLariat.HONDO), v(0, r, hand), {
    color: "#c9b48a",
  });
  // The tail: what the loop and spoke leave of the length, in turns of the coil's radius beyond the hand.
  const used: number = Math.PI * d.loop + AutoMovieArchetypeLariat.HONDO + d.spoke;
  const turns: number = Math.max(
    1,
    Math.round((d.length - used) / (2 * Math.PI * AutoMovieArchetypeLariat.COIL)),
  );
  const coilCentre: IAutoMovieVector3 = v(0, r, hand + 0.3 + AutoMovieArchetypeLariat.COIL);
  for (let t: number = 0; t < turns; ++t)
    ring(
      `coil${t}-`,
      v(coilCentre.x, r + t * d.diameter, coilCentre.z),
      AutoMovieArchetypeLariat.COIL,
    );
  builder.affordance({
    id: "spoke",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, hand),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * d.diameter,
    length: 0.1,
  });
  builder.affordance({
    id: "coils",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, coilCentre.z - AutoMovieArchetypeLariat.COIL),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 4 * d.diameter,
    length: 0.1,
  });
  builder.affordance({
    id: "hondo",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, loop),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "loop",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(v(0, r, 0)),
    extent: null,
    width: d.loop,
  });
  return builder.build(d.mass);
}
