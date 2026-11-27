import type { AutoMovieArchetypeDie } from "../AutoMovieArchetypeDie";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../../core/index";
import { TabletopStack } from "./TabletopStack";

/*
 * One six-sided die resting on a face.
 *
 * The die is a cube, its origin the centre of the face it rests on, `+Y` up. It
 * is picked up, rolled and placed by the shared tabletop contacts
 * (`TabletopStack`).
 * Parameter params: The optional scene id.
 * Returns: The inert die and its contact frames, metres.
 */
export function createDie(
  params: AutoMovieArchetypeDie.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeDie.Affordance, AutoMovieArchetypeDie.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDie.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "die",
      { side: "m", mass: "kg" },
      undefined,
    );
  draw.derive("side", DIE.side);
  draw.derive("mass", DIE.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeDie.Affordance,
    AutoMovieArchetypeDie.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "die",
    name: "die",
    material: "plastic",
    draw,
  });
  builder.box(
    "cube",
    AutoMovieEngineVector3.create(DIE.side, DIE.side, DIE.side),
    AutoMovieEngineVector3.create(0, DIE.side / 2, 0),
    { color: "#f2f0ea" },
  );
  TabletopStack.contacts(builder, DIE.side, DIE.side);
  return builder.build(DIE.mass);
}

/*
 * A six-sided die: "Common dice are small cubes, most often 1.6 cm (0.63 in)
 * across" (English Wikipedia, Dice, read 2026-11-21). The mass is not read, so
 * it is a provisional estimate.
 */
const DIE: Readonly<AutoMovieArchetypeDie.IDie> = { side: 0.016, mass: 0.005 };
