import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * A spent .30-06 Springfield case, the M1903's ammunition: "Case length
 * 2.494 in (63.3 mm)", "Base diameter .4708 in (11.96 mm)", "Rim diameter
 * .4740 in (12.04 mm)", "Neck diameter .3404 in (8.65 mm)" (English Wikipedia
 * infobox, unattributed there; the SAAMI drawing is the source to confirm,
 * read 2026-11-21). The neck's length and the empty brass's mass are not
 * read, so they are provisional estimates.
 */
const CASE: Readonly<createStageCasing.ICase> = {
  length: 0.0633,
  base: 0.01196,
  rim: 0.01204,
  neck: 0.00865,
  neckLength: 0.0095,
  mass: 0.013,
};

/**
 * An inert spent rifle casing for the screen.
 *
 * The case stands along `+Y` from its rim at the origin to its open mouth.
 * The `grip` is a precision pinch across the body and the `mouth` the open
 * end, facing `+Y`. It is brass-coloured exterior geometry with no primer,
 * powder or projectile.
 *
 * @param params The optional scene id.
 * @returns The inert casing and its contact frames, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cartridge, its frame, its two contacts and which sizes are read.
 * @evidence contracts/development/implementation.md#principled-implementation A rim, a body at the base diameter and a neck at the neck diameter, together the read case length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the dimensions, lay rim, body and neck, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The neck's length and the mass are named provisional estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts and two contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createStageCasing(
  params: createStageCasing.IParams = {},
): AutoMovieArchetype<
  createStageCasing.Affordance,
  createStageCasing.Dimension
> {
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<createStageCasing.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stageCasing",
      { length: "m", diameter: "m", mass: "kg" },
      undefined,
    );
  draw.derive("length", CASE.length);
  draw.derive("diameter", CASE.rim);
  draw.derive("mass", CASE.mass);
  const builder: AutoMovieArchetypeBuilder<
    createStageCasing.Affordance,
    createStageCasing.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "stageCasing",
    name: "spent .30-06 casing",

    // The material table has no brass; steel is the nearest metal for its
    // surface pairing, and the mass is the case's own, set at build.
    material: "steel",
    draw,
  });
  const rim: number = 0.0012;
  const body: number = CASE.length - CASE.neckLength;
  builder.rod("rim", CASE.rim / 2, v(0, 0, 0), v(0, rim, 0), {
    color: "#b8913a",
  });
  builder.rod("body", CASE.base / 2, v(0, rim, 0), v(0, body, 0), {
    color: "#c9a24a",
  });
  builder.rod("neck", CASE.neck / 2, v(0, body, 0), v(0, CASE.length, 0), {
    color: "#c9a24a",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, body / 2, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: CASE.base,
    length: body - rim,
  });
  builder.affordance({
    id: "mouth",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, CASE.length, 0)),
    extent: null,
  });
  return builder.build(CASE.mass);
}

/**
 * The inputs, contacts and case figures of {@link createStageCasing}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene id input, the contacts, the recorded dimensions and the case figures.
 * @evidence contracts/development/design.md#principled-representation Metres and kilograms; the case figures name which are read and which are estimated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pinch and the mouth a scene places a casing by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The read cartridge fixes the casing, so no dimension is authorable.
 */
export namespace createStageCasing {
  /** The pinch across the body and the open mouth. */
  export type Affordance = "grip" | "mouth";

  /** The case length, the rim diameter and the mass. */
  export type Dimension = "length" | "diameter" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `stageCasing` when absent. */
    id?: string;
  }

  /** The case figures, metres and kilograms. */
  export interface ICase {
    /** Rim to mouth, read. */
    length: number;

    /** The body's diameter at the base, read. */
    base: number;

    /** The rim's diameter, read. */
    rim: number;

    /** The neck's outer diameter, read. */
    neck: number;

    /** The neck's length, estimated. */
    neckLength: number;

    /** The empty case's mass, estimated. */
    mass: number;
  }
}
