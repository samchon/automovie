import { AutoMovieArchetypeFoodPortion } from "../AutoMovieArchetypeFoodPortion";
import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/**
 * Each portion's size, metres and kilograms. No source is read: every figure is
 * a provisional construction estimate of a plated portion, a bite-sized piece
 * cut from it, and a morsel taken with chopsticks.
 */
const SIZES: Readonly<Record<AutoMovieArchetypeFoodPortion.Kind, AutoMovieArchetypeFoodPortion.ISize>> =
  {
    steak: { width: 0.12, height: 0.02, depth: 0.08, mass: 0.2 },
    piece: { width: 0.025, height: 0.02, depth: 0.025, mass: 0.012 },
    morsel: { width: 0.025, height: 0.02, depth: 0.025, mass: 0.01 },
  };

/**
 * A plated portion of food: a steak cut at the table, a bite-sized piece of it,
 * or a morsel taken with chopsticks or a serving spoon.
 *
 * The portion is a slab standing on its underside at the origin, its width
 * along `X`. `top` is its upper face, the surface a knife saws and a fork's
 * tines pin, facing `+Y`; `base` is the underside, the socket set on a plate;
 * `pick` is the centre of its upper face, where a fork's tines or chopstick
 * tips take it.
 *
 * @param params The kind and the optional scene id.
 * @returns The portion and its contacts, metres.
 * @throws {AutoMovieArchetypeRefusal} For a kind outside the set.
 */
export function createFoodPortion(
  params: AutoMovieArchetypeFoodPortion.IParams,
): AutoMovieArchetype<
  AutoMovieArchetypeFoodPortion.Affordance,
  AutoMovieArchetypeFoodPortion.Dimension
> {
  const kind: AutoMovieArchetypeFoodPortion.Kind = ArchetypeDraw.choice(
    "foodPortion",
    "kind",
    params.kind,
    AutoMovieArchetypeFoodPortion.KINDS,
  );
  const size: AutoMovieArchetypeFoodPortion.ISize = SIZES[kind];
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeFoodPortion.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "foodPortion",
      { width: "m", height: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", size.width);
  draw.derive("height", size.height);
  draw.derive("mass", size.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeFoodPortion.Affordance,
    AutoMovieArchetypeFoodPortion.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? kind,
    name: kind,
    material: "foam",
    draw,
  });
  builder.box(
    "portion",
    v(size.width, size.height, size.depth),
    v(0, size.height / 2, 0),
    { color: kind === "morsel" ? "#e8d9b0" : "#7a3b2a" },
  );
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, size.height, 0)),
    extent: null,
    width: size.width,
    depth: size.depth,
  });
  builder.affordance({
    id: "base",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "pick",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, size.height, 0)),
    extent: null,
  });
  return builder.build(size.mass);
}
