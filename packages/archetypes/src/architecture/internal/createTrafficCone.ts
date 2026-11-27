import type { AutoMovieArchetypeTrafficCone } from "../AutoMovieArchetypeTrafficCone";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/**
 * A stepped traffic cone with its top grasp and square base on the pavement.
 *
 * The Brimar proportions shape the cone after the chosen height class and its
 * original mass draw. The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier, model choice and supported dimension
 *   overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createTrafficCone(
  params: AutoMovieArchetypeTrafficCone.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeTrafficCone.Affordance,
  AutoMovieArchetypeTrafficCone.Dimension
> {
  const {
    builder,
    d,
  }: StreetFixtureDraw.IFixture<AutoMovieArchetypeTrafficCone.Affordance> =
    StreetFixtureDraw.begin(
      "trafficCone",
      "traffic cone",
      "composite",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const plate: number = PLATE_RATIO * height;
  const base: number = CONE.base * height;
  builder.box("base", v(base, plate, base), v(0, plate / 2, 0), {
    color: "#1d1d1d",
  });
  const foot: number = (CONE.foot * height) / 2;
  const top: number = (CONE.top * height) / 2;
  const rise: number = (height - plate) / 3;
  for (let k: number = 0; k < 3; k++) {
    const share: number = (k + 0.5) / 3;
    builder.rod(
      `cone-${k + 1}`,
      foot + (top - foot) * share,
      v(0, plate + k * rise, 0),
      v(0, plate + (k + 1) * rise, 0),
      { color: k === 1 ? "#f2f2f2" : "#ff6a13" },
    );
  }
  builder.affordance({
    id: "top",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, height, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
  });
  return builder.build(d.mass!);
}

/** The shape of {@link CONE}. */
interface ICone {
  /** The `base` entry. */
  base: number;

  /** The `foot` entry. */
  foot: number;

  /** The `top` entry. */
  top: number;
}

/**
 * The Brimar 28 in cone's proportions to its height: its square base, its
 * cone's foot and its top (13.4, 9.8 and 2.1 in of 28).
 */
const CONE: Readonly<ICone> = {
  base: 13.4 / 28,
  foot: 9.8 / 28,
  top: 2.1 / 28,
};

/** The estimated share of the cone height used by its base plate. */
const PLATE_RATIO: number = 0.04;
