import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { TabletopStack } from "./TabletopStack";

/**
 * A six-sided die: "Common dice are small cubes, most often 1.6 cm (0.63 in)
 * across" (English Wikipedia, Dice, read 2026-11-21). The mass is not read, so
 * it is a provisional estimate.
 */
const DIE: Readonly<createDie.IDie> = { side: 0.016, mass: 0.005 };

/**
 * One six-sided die resting on a face.
 *
 * The die is a cube, its origin the centre of the face it rests on, `+Y` up. It
 * is picked up, rolled and placed by the shared tabletop contacts
 * (`TabletopStack`).
 *
 * @param params The optional scene id.
 * @returns The inert die and its contact frames, metres.
 */
export function createDie(
  params: createDie.IParams = {},
): AutoMovieArchetype<createDie.Affordance, createDie.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createDie.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "die",
      { side: "m", mass: "kg" },
      undefined,
    );
  draw.derive("side", DIE.side);
  draw.derive("mass", DIE.mass);
  const builder: AutoMovieArchetypeBuilder<
    createDie.Affordance,
    createDie.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "die",
    name: "die",
    material: "plastic",
    draw,
  });
  builder.box(
    "cube",
    Vector3.create(DIE.side, DIE.side, DIE.side),
    Vector3.create(0, DIE.side / 2, 0),
    { color: "#f2f0ea" },
  );
  TabletopStack.contacts(builder, DIE.side, DIE.side);
  return builder.build(DIE.mass);
}

/** The inputs, contacts and size of {@link createDie}. */
export namespace createDie {
  /** The shared pinch, underside and upper sockets. */
  export type Affordance = TabletopStack.Contact;

  /** The side and the mass. */
  export type Dimension = "side" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `die` when absent. */
    id?: string;
  }

  /** The die's size, metres and kilograms. */
  export interface IDie {
    /** The cube's side, read. */
    side: number;

    /** The die's mass, estimated. */
    mass: number;
  }
}
