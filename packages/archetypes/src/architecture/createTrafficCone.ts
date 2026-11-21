import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/** The shape of {@link CONE}. */
interface ICone {
  /** The `base` entry. */
  base: number;

  /** The `foot` entry. */
  foot: number;

  /** The `top` entry. */
  top: number;
}

/** The Brimar 28 in cone's proportions to its height: its square base, its cone's foot and its top (13.4, 9.8 and 2.1 in of 28). */
const CONE: Readonly<ICone> = {
  base: 13.4 / 28,
  foot: 9.8 / 28,
  top: 2.1 / 28,
};

/** The estimated share of the cone height used by its base plate. */
const PLATE_RATIO: number = 0.04;

/**
 * A stepped traffic cone with its top grasp and square base on the pavement.
 *
 * The Brimar proportions shape the cone after the chosen height class and its original mass draw.
 * The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier, model choice and supported dimension overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {ArchetypeRefusal} If a supplied override lies outside the selected profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model, its inputs, frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation The Brimar proportions shape the cone after the chosen height class and its original mass draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the fixed measurements, then record the parts and their typed contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original measurements, fixed input checks and contact/part geometry are used by both APIs.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Builds a single fixture with a bounded number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares recorded dimensions and part construction with the saved recipe.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer returns one completed model and retains no input references.
 */
export function createTrafficCone(
  params: createTrafficCone.IParams = {},
  seed?: number | string,
): Archetype<createTrafficCone.Affordance, createTrafficCone.Dimension> {
  const {
    builder,
    d,
  }: StreetFixtureDraw.IFixture<createTrafficCone.Affordance> =
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
    frame: ArchetypeFrame.facing(v(0, height, 0), v(0, 0, 1), v(0, 1, 0)),
    extent: null,
    grip: "power",
  });
  return builder.build(d.mass!);
}

/**
 * Inputs, dimensions and contacts for {@link createTrafficCone}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed inputs and the contact identifiers returned by the producer.
 * @evidence contracts/development/design.md#principled-representation A closed contact union and the selected profile's numeric inputs. Lengths are metres and mass is kilograms. The model fixes the height class.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters admit an identifier and only this producer's authored numeric overrides. The model fixes the height class.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contacts and override keys correspond to the producer's existing geometry and measured bands.
 */
export namespace createTrafficCone {
  /** The `model` choices this producer admits. */
  export type Model = "cone 18 in" | "cone 28 in";

  /** The named contacts built by this producer. */
  export type Affordance = "top";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "mass";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height" | "mass";

  /** The numeric overrides and optional scene identifier. The model fixes the height class. */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The road-class model, drawn from the seed when omitted. */
    model?: Model;
  }
}
