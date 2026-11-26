import type { AutoMovieArchetypeScissors } from "../AutoMovieArchetypeScissors";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/**
 * Household scissors of eight inches overall (8 × 0.0254 m), the blades about
 * the front half. No source is read: every size here, the rings' bore, the
 * blades' opening and the mass are provisional construction estimates.
 */
const SIZE: Readonly<AutoMovieArchetypeScissors.ISize> = {
  length: 8 * 0.0254,
  blade: 0.1,
  ring: 0.022,
  opening: 30,
  mass: 0.08,
};

/**
 * A pair of scissors lying flat, its two blades on one pivot.
 *
 * The pivot is at the origin, the blades running along `+Z` and the rings along
 * `-Z`, the flat of the blades in `XZ`. The lower blade and the finger ring are
 * the prop's own frame, held in the hand; the upper blade and the thumb ring
 * turn about the pivot's `+Y` on the `pivot` hinge, from closed at 0 to open at
 * `opening` degrees. `fingerRing` is the handle the fingers hold, `thumbRing`
 * the ring the thumb works; `cut` is the fixed blade's edge midway along it,
 * where a cut advances, and `tip` its point.
 *
 * @param params The optional scene id.
 * @returns The scissors and their contacts, metres.
 */
export function createScissors(
  params: AutoMovieArchetypeScissors.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeScissors.Affordance, AutoMovieArchetypeScissors.Dimension> {
  const v: typeof Vector3.create = Vector3.create;
  const handle: number = SIZE.length - SIZE.blade;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeScissors.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "scissors",
      { length: "m", blade: "m", mass: "kg" },
      undefined,
    );
  draw.derive("length", SIZE.length);
  draw.derive("blade", SIZE.blade);
  draw.derive("mass", SIZE.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeScissors.Affordance,
    AutoMovieArchetypeScissors.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "scissors",
    name: "scissors",
    material: "steel",
    draw,
  });
  builder.box(
    "blade-lower",
    v(0.012, 0.002, SIZE.blade),
    v(0.004, -0.001, SIZE.blade / 2),
  );
  builder.box(
    "ring-finger",
    v(SIZE.ring, 0.004, SIZE.ring),
    v(0.012, -0.002, -handle + SIZE.ring / 2),
    { color: "#20262e" },
  );
  builder.box(
    "blade-upper",
    v(0.012, 0.002, SIZE.blade),
    v(-0.004, 0.001, SIZE.blade / 2),
  );
  builder.box(
    "ring-thumb",
    v(SIZE.ring, 0.004, SIZE.ring),
    v(-0.012, 0.002, -handle + SIZE.ring / 2),
    { color: "#20262e" },
  );
  builder.affordance({
    id: "pivot",
    kind: "hinge",
    extent: null,
    travel: SIZE.opening,
    parts: ["blade-upper", "ring-thumb"],
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
  });
  builder.affordance({
    id: "fingerRing",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0.012, -0.002, -handle + SIZE.ring / 2),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: SIZE.ring,
    length: SIZE.ring,
  });
  builder.affordance({
    id: "thumbRing",
    kind: "handle",
    symmetry: "round",
    rides: "pivot",
    frame: AutoMovieArchetypeFrame.facing(
      v(-0.012, 0.002, -handle + SIZE.ring / 2),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: SIZE.ring,
    length: SIZE.ring,
  });
  builder.affordance({
    id: "cut",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, SIZE.blade / 2)),
    extent: null,
  });
  builder.affordance({
    id: "tip",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, SIZE.blade)),
    extent: null,
  });
  return builder.build(SIZE.mass);
}
