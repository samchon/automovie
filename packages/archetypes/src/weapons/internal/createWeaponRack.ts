import { AutoMovieArchetypeWeaponRack } from "../AutoMovieArchetypeWeaponRack";
import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/**
 * A floor weapon rack: a base with a row of slots and a top rail with a notch
 * over each, where swords, clubs and bats stand upright.
 *
 * The base lies on the floor centred over the origin, its row of slots along
 * `X` and its front toward `+Z`; two end posts carry the top rail at the drawn
 * height. `slot1` to `slot6`, counted from `-X`, are each slot's floor on the
 * base's top, facing up, where a weapon's lower end (a sword's point, a bat's
 * barrel, a club's tip) rests; `rail1` to `rail6` the notch above it in the top
 * rail's front, facing `+Z`, against which the weapon leans. A weapon set in a
 * slot keeps its own `grip` for a hand to reach.
 *
 * @param params The model and any dimension the author fixes.
 * @param seed The seed that picks the model left free and draws the mass inside
 *   its band; absent, the first model and the middle of the band.
 * @returns The rack.
 * @throws {AutoMovieArchetypeRefusal} For a model not read, a fixed mass
 *   outside its band, or a fixed dimension the model gives.
 */
export function createWeaponRack(
  params: AutoMovieArchetypeWeaponRack.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWeaponRack.Affordance, AutoMovieArchetypeWeaponRack.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeWeaponRack.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeWeaponRack.Dimension>(
      "weaponRack",
      AutoMovieArchetypeWeaponRack.UNITS,
      seed,
      params,
    );
  // The rack is one of the two read stands whole; only its unread mass is drawn.
  const model: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeWeaponRack.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeWeaponRack.Model>(
    "model",
    params.model,
    AutoMovieArchetypeWeaponRack.MODELS,
  );
  const d: Partial<Record<AutoMovieArchetypeWeaponRack.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeWeaponRack.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeWeaponRack.Affordance,
    AutoMovieArchetypeWeaponRack.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "weapon rack",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const base: number = AutoMovieArchetypeWeaponRack.BASE;
  const post: number = AutoMovieArchetypeWeaponRack.POST;
  const half: number = d.width! / 2;
  builder.box("base", v(d.width!, base, d.depth!), v(0, base / 2, 0), {
    color: "#5a3e2b",
  });
  for (const [id, x] of [
    ["leftPost", -half + post / 2],
    ["rightPost", half - post / 2],
  ] as const)
    builder.rod(id, post / 2, v(x, base, 0), v(x, d.height!, 0), {
      color: "#5a3e2b",
    });
  builder.box("rail", v(d.width!, post, post), v(0, d.height! - post / 2, 0), {
    color: "#5a3e2b",
  });
  const inner: number = d.width! - 2 * post;
  for (const [slot, rail, k] of [
    ["slot1", "rail1", 0],
    ["slot2", "rail2", 1],
    ["slot3", "rail3", 2],
    ["slot4", "rail4", 3],
    ["slot5", "rail5", 4],
    ["slot6", "rail6", 5],
  ] as const) {
    const x: number = -inner / 2 + (inner * (k + 0.5)) / AutoMovieArchetypeWeaponRack.SLOTS;
    builder.affordance({
      id: slot,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(x, base, 0)),
      extent: null,
      width: inner / AutoMovieArchetypeWeaponRack.SLOTS,
      depth: d.depth!,
    });
    builder.affordance({
      id: rail,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, d.height! - post / 2, post / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
  return builder.build(d.mass!);
}
