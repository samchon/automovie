import type { AutoMovieArchetypeChopsticks } from "../AutoMovieArchetypeChopsticks";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * A pair of chopsticks held in the conventional hold: the lower stick fixed
 * against the thumb's base and the ring finger, the upper stick moved by the
 * index and middle fingers.
 *
 * The lower stick is the prop's frame, running along `+Z` from its butt at the
 * origin to its tip. The upper stick lies above it (`+Y`) and turns about a
 * fulcrum a third of the way along, at the thumb's tip, on the `pinch` hinge:
 * open at 0, spread `spread` degrees, and closed at `spread`, its tip on the
 * lower one's. `grip` is the hold a third of the way along, `tips` the meeting
 * point of the two tips, where a morsel is pinched.
 * Parameter params: The optional scene id.
 * Returns: The chopsticks and their contacts, metres.
 */
export function createChopsticks(
  params: AutoMovieArchetypeChopsticks.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeChopsticks.Affordance, AutoMovieArchetypeChopsticks.Dimension> {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const r: number = SIZE.diameter / 2;
  const fulcrum: number = SIZE.length / 3;
  const rise: number =
    Math.tan((SIZE.spread * Math.PI) / 180) * (SIZE.length - fulcrum);
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeChopsticks.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "chopsticks",
      { length: "m", diameter: "m", mass: "kg" },
      undefined,
    );
  draw.derive("length", SIZE.length);
  draw.derive("diameter", SIZE.diameter);
  draw.derive("mass", SIZE.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeChopsticks.Affordance,
    AutoMovieArchetypeChopsticks.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "chopsticks",
    name: "chopsticks",
    material: "wood",
    draw,
  });
  builder.rod("lower", r, v(0, 0, 0), v(0, 0, SIZE.length), {
    color: "#a0743c",
  });
  // Open, the upper stick rises from the fulcrum toward its tip.
  builder.rod("upper", r, v(0, 2 * r, 0), v(0, 2 * r + rise, SIZE.length), {
    color: "#a0743c",
  });
  builder.affordance({
    id: "pinch",
    kind: "hinge",
    extent: null,
    travel: SIZE.spread,
    parts: ["upper"],
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 2 * r, fulcrum),
      v(1, 0, 0),
      v(0, 0, 1),
    ),
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, r, fulcrum),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: 3 * SIZE.diameter,
    length: 0.06,
  });
  builder.affordance({
    id: "tips",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, r, SIZE.length)),
    extent: null,
  });
  return builder.build(SIZE.mass);
}

/*
 * An adult's pair of chopsticks: 0.24 m long, the length Hsu and Wu found best
 * for adults, and 6 mm across, the diameter Chan (1999, Int J Ind Ergon) found
 * best for food-pinching efficiency, both as the 2017 MATEC Web of Conferences
 * study of chopstick operation summarizes them
 * (https://www.matec-conferences.org/10.1051/matecconf/201711901017, read
 * through its search summary). The spread and the mass are provisional
 * construction estimates.
 */
const SIZE: Readonly<AutoMovieArchetypeChopsticks.ISize> = {
  length: 0.24,
  diameter: 0.006,
  spread: 12,
  mass: 0.02,
};
