import { AutoMovieArchetypeWeaponLoop } from "../AutoMovieArchetypeWeaponLoop";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/**
 * A carrier worn on the body (`IHumanProp.worn`) for a club: a belt loop a
 * baton hangs through, or a back sleeve a bat stands in.
 *
 * It stands on its lower end at the origin, its opening straight up along `+Y`:
 * a belt loop is a short square ring under a strap up to the belt, a back
 * sleeve a long square channel with the strap at its middle. `socket` is the
 * opening's top, facing up: the club stands grip up through it, drawn out
 * upward by its grip. `belt` is where the strap meets the wearer, facing the
 * body on `-X`.
 *
 * @param params The kind, a belt loop's ring and any dimension the author
 *   fixes.
 * @param seed The seed that picks the ring left free and draws every dimension
 *   left free inside its band; absent, the first ring and the middle of each
 *   band.
 * @returns The carrier.
 * @throws {AutoMovieArchetypeRefusal} For a ring not of the kind, a fixed
 *   dimension outside its band, or one the ring gives.
 */
export function createWeaponLoop(
  params: AutoMovieArchetypeWeaponLoop.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWeaponLoop.Affordance, AutoMovieArchetypeWeaponLoop.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWeaponLoop.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeWeaponLoop.Dimension>(
      "weaponLoop",
      AutoMovieArchetypeWeaponLoop.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeWeaponLoop.Kind = ArchetypeDraw.choice(
    "weaponLoop",
    "kind",
    params.kind,
    AutoMovieArchetypeWeaponLoop.KINDS,
  );
  // A belt loop's ring is one of the three read rings whole; a back sleeve has no read model, its bands.
  const model: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeWeaponLoop.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeWeaponLoop.Model>(
    "model",
    params.model,
    AutoMovieArchetypeWeaponLoop.MODELS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeWeaponLoop.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeWeaponLoop.BANDS[kind], AutoMovieArchetypeWeaponLoop.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeWeaponLoop.Affordance,
    AutoMovieArchetypeWeaponLoop.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "leather",
    id: params.id,
    name: kind === "belt" ? "belt loop" : "back sleeve",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const half: number = (d.aperture! + WALL) / 2;
  const span: number = d.aperture! + 2 * WALL;
  for (const [id, size, at] of [
    ["wallFront", v(span, d.length!, WALL), v(0, d.length! / 2, half)],
    ["wallBack", v(span, d.length!, WALL), v(0, d.length! / 2, -half)],
    ["wallLeft", v(WALL, d.length!, d.aperture!), v(half, d.length! / 2, 0)],
    ["wallRight", v(WALL, d.length!, d.aperture!), v(-half, d.length! / 2, 0)],
  ] as const)
    builder.box(id, size, at, { color: "#3a2a1e" });
  // The strap toward the wearer: up to the belt over a loop, along the
  // middle of a sleeve.
  const strap: number = AutoMovieArchetypeWeaponLoop.STRAP[kind];
  const side: number = -(span / 2 + WALL / 2);
  const middle: number =
    kind === "belt" ? d.length! + strap / 2 : d.length! / 2;
  builder.box("strap", v(WALL, strap, 0.04), v(side, middle, 0), {
    color: "#3a2a1e",
  });
  builder.affordance({
    id: "socket",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.length!, 0)),
    extent: null,
  });
  builder.affordance({
    id: "belt",
    kind: "hook",
    frame: AutoMovieArchetypeFrame.facing(
      v(side - WALL / 2, kind === "belt" ? d.length! + strap : middle, 0),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** The wall of the loop or the sleeve round its opening, metres: an estimate. */
const WALL: number = 0.008;
