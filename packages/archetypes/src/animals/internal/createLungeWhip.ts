import type { AutoMovieArchetypeLungeWhip } from "../AutoMovieArchetypeLungeWhip";
import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/**
 * The shaft's length, metres: 65 in, the Weaver Leather lunge whip's listed
 * shaft (retailer listing, Farm & Fleet), whose 67 in lash and 11 in popper are
 * not laid.
 */
const SHAFT: number = 1.65;

/** The handle's size. */
interface IHandle {
  /** Length up from the butt, metres. */
  length: number;

  /** Radius, metres. */
  radius: number;
}

/**
 * The handle's length up from the butt and its radius, metres: authored, no
 * listing read gives them.
 */
const HANDLE: IHandle = {
  length: 0.3,
  radius: 0.013,
};

/** The stock's radius above the handle, metres: authored. */
const STOCK: number = 0.006;

/** The whip's mass, kilograms: authored, no listing read gives it. */
const MASS: number = 0.25;

/**
 * A lunge whip: a handle at the butt and a long stock up `+Y`, the shaft a
 * handler points at a lunged equid's quarters.
 *
 * The handle runs from the butt at the origin up `HANDLE.length`; the stock
 * carries on to the shaft's length. `grip` is the handle's middle on its
 * surface, its line along the shaft, where the whip hand closes. The lash and
 * popper hang from a real whip's tip; they are not laid, so the whip shows its
 * shaft only.
 *
 * @param params The model's id.
 * @returns The whip.
 */
export function createLungeWhip(
  params: AutoMovieArchetypeLungeWhip.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeLungeWhip.Affordance, never> {
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession<never>("lungeWhip", {}, undefined, {});
  const builder: AutoMovieArchetypeBuilder<AutoMovieArchetypeLungeWhip.Affordance, never> =
    new AutoMovieArchetypeBuilder({
      material: "wood",
      id: params.id,
      name: "lungeWhip",
      draw,
    });
  builder.rod(
    "handle",
    HANDLE.radius,
    Vector3.create(0, 0, 0),
    Vector3.create(0, HANDLE.length, 0),
    { color: "#202020" },
  );
  builder.rod(
    "stock",
    STOCK,
    Vector3.create(0, HANDLE.length, 0),
    Vector3.create(0, SHAFT, 0),
    { color: "#2b2b2b" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, HANDLE.length / 2, HANDLE.radius),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * HANDLE.radius,
  });
  return builder.build(MASS);
}
