import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/** The shape of {@link HYDRANT}. */
interface IHydrant {
  /** The `pumper` entry. */
  pumper: number;

  /** The `hose` entry. */
  hose: number;

  /** The `nut` entry. */
  nut: number;
}

/** The Mueller hydrant's nozzle bores, metres: the 4 1/2 in pumper and the 2 1/2 in hose nozzles; its 1 1/2 in operating nut. */
const HYDRANT: Readonly<IHydrant> = {
  pumper: 4.5 * AutoMovieArchetypeUnits.INCH,
  hose: 2.5 * AutoMovieArchetypeUnits.INCH,
  nut: 1.5 * AutoMovieArchetypeUnits.INCH,
};

/**
 * A ground-standing hydrant with one pumper and two hose socket frames, plus its operating nut.
 *
 * The pumper points toward +Z and the hose sockets toward each side. All three sockets sit on their corresponding nozzle faces.
 * The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier and any dimensions to fix inside their bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The pumper points toward +Z and the hose sockets toward each side. All three sockets sit on their corresponding nozzle faces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then record the parts and their typed contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createFireHydrant(
  params: createFireHydrant.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createFireHydrant.Affordance,
  createFireHydrant.Dimension
> {
  const {
    builder,
    d,
  }: StreetFixtureDraw.IFixture<createFireHydrant.Affordance> =
    StreetFixtureDraw.begin(
      "hydrant",
      "fire hydrant",
      "composite",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const radius: number = d.diameter! / 2;
  const y: number = d.nozzleHeight!;
  const red: string = "#c8102e";
  builder.rod("barrel", radius, v(0, 0, 0), v(0, height - HYDRANT.nut, 0), {
    color: red,
  });
  builder.rod(
    "nut",
    HYDRANT.nut / 2,
    v(0, height - HYDRANT.nut, 0),
    v(0, height, 0),
    { color: "#8a8d91" },
  );
  const out: number = d.pumperReach!;
  const hose: number = d.hoseReach!;
  builder.rod("pumper", HYDRANT.pumper / 2, v(0, y, 0), v(0, y, out), {
    color: red,
  });
  for (const [id, sign] of [
    ["hose-left", 1],
    ["hose-right", -1],
  ] as const)
    builder.rod(id, HYDRANT.hose / 2, v(0, y, 0), v(sign * hose, y, 0), {
      color: red,
    });
  builder.affordance({
    id: "pumper",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(v(0, y, out), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  for (const [id, sign] of [
    ["hoseLeft", 1],
    ["hoseRight", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(sign * hose, y, 0),
        v(sign, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
    });
  builder.affordance({
    id: "nut",
    kind: "knob",
    frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createFireHydrant}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createFireHydrant {
  /** The named contacts built by this producer. */
  export type Affordance = "hoseLeft" | "hoseRight" | "nut" | "pumper";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "diameter"
    | "height"
    | "hoseReach"
    | "mass"
    | "nozzleHeight"
    | "pumperReach";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }
}
