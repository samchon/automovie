import type { AutoMovieArchetypeChopsticks } from "../AutoMovieArchetypeChopsticks";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * Build the equal rods and place the hinge one third along the moving rod.
 * The upper rod turns from its open angle to one tip-side contact on the
 * lower rod. A one-diameter lateral offset keeps the cylinders disjoint
 * through the entire swing.
 */
export function createChopsticks(
  params: AutoMovieArchetypeChopsticks.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeChopsticks.Affordance, AutoMovieArchetypeChopsticks.Dimension> {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const r: number = SIZE.diameter / 2;
  const fulcrum: number = SIZE.length / 3;
  const angle: number = (SIZE.spread * Math.PI) / 360;
  const openAxis: IAutoMovieVector3 = v(0, Math.sin(angle), Math.cos(angle));
  // Put the closed contact at the end of both rounded collider stems.
  const tip: number = SIZE.length - r;
  const reach: number = tip - fulcrum;
  const pivot: IAutoMovieVector3 = v(
    SIZE.diameter,
    reach * openAxis.y,
    tip - reach * openAxis.z,
  );
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
  builder.rod(
    "upper",
    r,
    AutoMovieEngineVector3.addScaled(pivot, openAxis, -fulcrum),
    AutoMovieEngineVector3.addScaled(pivot, openAxis, SIZE.length - fulcrum),
    { color: "#a0743c" },
  );
  builder.affordance({
    id: "pinch",
    kind: "hinge",
    extent: null,
    travel: SIZE.spread,
    parts: ["upper"],
    frame: AutoMovieArchetypeFrame.facing(
      pivot,
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
    frame: AutoMovieArchetypeFrame.upright(v(r, 0, tip)),
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
