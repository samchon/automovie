import type { AutoMovieArchetypeHalter } from "../AutoMovieArchetypeHalter";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * A halter fitted to one equid's head: a crown loop behind the poll, a noseband
 * loop round the nose and a cheek strap down each side between them.
 *
 * The halter is built in its head's own frame, the frame its `seat` names: the
 * origin at the poll, `+Y` along the head from the poll to the nose, `+X` to
 * the animal's left. Each loop is four flat straps round a square that just
 * clears the head's radius, so the halter sits on the head it was fitted to
 * without passing into it; a halter is sized to its horse (Schockemöhle's
 * Fremont lists an 11.5 in noseband and 27 in crown for a full horse, a cob's
 * smaller), and the fit here is that sizing made exact. `grip` is the crown's
 * top, where a hand carries the halter. Strap width and thickness, the
 * noseband's place and the mass are authored.
 * Parameter head: The head it is fitted to: the head capsule's length from poll to
 * nose and its radius, metres.
 * Parameter params: The model's id.
 * Returns: The halter.
 */
export function createHalter(
  head: AutoMovieArchetypeHalter.IHead,
  params: AutoMovieArchetypeHalter.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeHalter.Affordance, never> {
  if (!(head.length > 0) || !(head.radius > 0))
    throw new RangeError("A halter fits a head of positive length and radius");
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession<never>("halter", {}, undefined, {});
  const builder: AutoMovieArchetypeBuilder<AutoMovieArchetypeHalter.Affordance, never> =
    new AutoMovieArchetypeBuilder({
      material: "leather",
      id: params.id,
      name: "halter",
      draw,
    });
  const a: number = head.radius + STRAP.thickness / 2;
  const side: number = 2 * a + STRAP.thickness;
  const loop = (name: string, y: number): void => {
    for (const sign of [1, -1]) {
      builder.box(
        `${name}-${sign > 0 ? "ventral" : "dorsal"}`,
        AutoMovieEngineVector3.create(side, STRAP.width, STRAP.thickness),
        AutoMovieEngineVector3.create(0, y, sign * a),
        { color: "#5a3a22" },
      );
      builder.box(
        `${name}-${sign > 0 ? "left" : "right"}`,
        AutoMovieEngineVector3.create(STRAP.thickness, STRAP.width, 2 * a),
        AutoMovieEngineVector3.create(sign * a, y, 0),
        { color: "#5a3a22" },
      );
    }
  };
  const nose: number = NOSEBAND * head.length;
  loop("crown", 0);
  loop("noseband", nose);
  for (const sign of [1, -1])
    builder.box(
      `cheek-${sign > 0 ? "left" : "right"}`,
      AutoMovieEngineVector3.create(STRAP.thickness, nose, STRAP.width),
      AutoMovieEngineVector3.create(sign * a, nose / 2, 0),
      { color: "#5a3a22" },
    );
  const top: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, 0, -a - STRAP.thickness / 2);
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      top,
      AutoMovieEngineVector3.create(0, 0, -1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: STRAP.thickness,
  });
  builder.affordance({
    id: "seat",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, 0, 0)),
    extent: null,
  });
  return builder.build(MASS);
}

/*
 * A halter strap's width and thickness, metres: authored, the halter listings
 * read give strap lengths only.
 */
const STRAP: Readonly<{ width: number; thickness: number }> = {
  width: 0.025,
  thickness: 0.006,
};

/*
 * The noseband's place along the head from the poll, a fraction of the head's
 * length: authored.
 */
const NOSEBAND: number = 0.7;

/*
 * A halter's mass, kilograms: authored, no listing read gives it.
 */
const MASS: number = 0.4;
