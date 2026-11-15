import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";


/** The professional rule on a bat's size. */
const RULE: string =
  "Official Baseball Rules 2024, rule 3.02(a), a bat at most 2.61 in across at its thickest (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

/** A maker's straight batons. */
const BATON: string =
  "Monadnock MP straight polycarbonate batons, 24 and 26 in long and 1.25 in across (https://www.defense-technology.com/?p=2138)";

/**
 * A club swung in the hands: a baseball bat or a straight baton.
 *
 * The club stands along `+Y` from its knob or butt end at the origin to its tip. A bat is a knob, a slender handle, a taper in three steps and a barrel, all of one wood, so its balance point and its moment of inertia about the hands follow from its shape and its mass; `properties` and `moment` give them. The `grip` is where the hands hold it and `strike` the place on its `+Z` side that meets what it hits.
 *
 * @param params The kind, the model and any dimension the author fixes.
 * @param seed The seed that picks the model left free and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The club.
 * @throws {ArchetypeRefusal} For a model not of the kind, a fixed dimension outside its band, or one the model gives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the club stands, what a bat is built of and why, and the two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A bat's profile as stepped rods of uniform density: a 10 in barrel and a sweet spot 5.5 in from the tip (Nathan, Smith and Russell 2026: a barrel of about 10 in, a sweet spot 5 to 6 in from the tip), a handle over the first three tenths of the length and three equal steps between. The mass properties are computed from that shape, never stated, so a test can hold them against measured bats.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model, draw the other dimensions, stack the rods from the knob up, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Three steps stand for the taper's curve; no cupped end or grip tape.
 * @evidence contracts/development/implementation.md#efficient-algorithms Six rods for a bat, one for a baton.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createClub(
  params: createClub.IParams,
  seed?: number | string,
): Archetype<createClub.Affordance, createClub.Dimension> {
  const draw: ArchetypeDrawSession<createClub.Dimension> = new ArchetypeDrawSession<createClub.Dimension>("club", createClub.UNITS, seed, params);
  const kind: createClub.Kind = ArchetypeDraw.choice(
    "club",
    "kind",
    params.kind,
    createClub.KINDS,
  );
  // A bat is one of the four measured maple bats, a baton one of the maker's two lengths, each whole.
  const model: { figures: Readonly<Partial<Record<createClub.Dimension, number>>> } =
    draw.model<createClub.Model>("model", params.model, createClub.MODELS[kind]);
  const d: Partial<Record<createClub.Dimension, number>> = {
    ...draw.dimensions(createClub.BANDS[kind], createClub.BANDS),
    ...model.figures,
  };
  const length: number = d.length!;
  const thick: number = d.diameter! / 2;
  const builder: ArchetypeBuilder<createClub.Affordance, createClub.Dimension> =
    new ArchetypeBuilder({
      id: params.id,
      name: kind === "bat" ? "baseball bat" : "baton",
      draw,
    });
  const wood: string = kind === "bat" ? "#c9a36b" : "#2c2f33";
  const rod = (id: string, radius: number, from: number, to: number): void => {
    builder.rod(
      id,
      radius,
      Vector3.create(0, from, 0),
      Vector3.create(0, to, 0),
      {
        color: wood,
      },
    );
  };

  // Where the hands hold it and how thick it is there.
  let held: number = thick;
  let middle: number = 0.08;
  let span: number = 0.12;
  if (kind === "baton") rod("shaft", thick, 0, length);
  else {
    const slim: number = d.handleDiameter! / 2;
    const handle: number = 0.3 * length;
    const barrel: number = length - createClub.BARREL;
    const step: number = (barrel - handle) / 3;
    rod("knob", createClub.KNOB / 2, 0, createClub.KNOB_LENGTH);
    rod("handle", slim, createClub.KNOB_LENGTH, handle);
    for (let k: number = 0; k < 3; k++)
      rod(
        `taper-${k + 1}`,
        slim + ((thick - slim) * (k + 1)) / 4,
        handle + k * step,
        handle + (k + 1) * step,
      );
    rod("barrel", thick, barrel, length);
    held = slim;

    // The held run starts at the top of the knob and never reaches the first taper step.
    span = Math.min(createClub.HANDS, handle - createClub.KNOB_LENGTH);
    middle = createClub.KNOB_LENGTH + span / 2;
  }
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, middle, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: kind === "bat" ? "two-hand" : "power",
    aperture: 2 * held,
    length: span,
  });
  builder.affordance({
    id: "strike",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, length - createClub.SWEET, thick),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createClub}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds and read models, each model whole, and one cited band per dimension a model leaves; a bat's profile constants are lengths along it, named.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The length, the mass and the handle a swing reads (#3374), and the two contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared: both follow from the shape. Nothing between two models is drawn; Cross's 84 cm bat is aluminium, so it is not one of this solid wood bat's models.
 */
export namespace createClub {
  /** The kinds of club. */
  export type Kind = "bat" | "baton";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["bat", "baton"];

  /** A bat's barrel length, metres: about 10 in (Nathan, Smith and Russell 2026, Introduction). */
  export const BARREL: number = 10 * ArchetypeUnits.INCH;

  /** The striking place from the tip, metres: a bat's sweet spot, 5 to 6 in from the barrel's tip (Nathan, Smith and Russell 2026, Introduction). */
  export const SWEET: number = 5.5 * ArchetypeUnits.INCH;

  /** A bat's knob diameter, metres: about 2.0 in, read off the profile plotted in Nathan, Smith and Russell 2026, Figure 2, not a stated number. */
  export const KNOB: number = 2 * ArchetypeUnits.INCH;

  /** A bat's knob length along the bat, metres. An estimate, not read at a source. */
  export const KNOB_LENGTH: number = 0.02;

  /** The run of a bat's handle two hands take, one above the other, metres. An estimate, not read at a source; a handle shorter than this above the knob is held over all of it. */
  export const HANDS: number = 0.25;

  /**
   * The affordance ids:
   *
   * - `grip`: where the hands hold the club, taken from the `-Z` side: both hands on a bat's slender handle, over a run that starts at the top of the knob and is `HANDS` long or, on a shorter handle, ends where the first taper step begins, so the whole run has the handle's diameter; one hand near a baton's butt.
   * - `strike`: the place on the `+Z` side that meets what is hit, at a bat's sweet spot.
   */
  export type Affordance = "grip" | "strike";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the knob or butt to the tip.
   * - `diameter`: the barrel's, or a baton's, thickness.
   * - `handleDiameter`: a bat's handle.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "handleDiameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    diameter: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /** The read models: the four maple bats S154, S155, T153 and T156, and the Monadnock MP24 and MP26 batons. */
  export type Model = "s154" | "s155" | "t153" | "t156" | "mp24" | "mp26";

  /** Each kind's models whole, the default first: the bats' length and weight in Nathan, Smith and Russell, Studies of the Torpedo Bat, ISEA 2026, Table 1 (https://baseball.physics.illinois.edu/ISEA2026-Torpedo-v7.pdf), and the batons' lengths (https://www.defense-technology.com/?p=2138). */
  export const MODELS: Readonly<Record<Kind, Readonly<Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>>>> = {
    bat: {
      s154: { length: 35.2 * ArchetypeUnits.INCH, mass: 33.9 * ArchetypeUnits.OUNCE },
      s155: { length: 35.1 * ArchetypeUnits.INCH, mass: 34 * ArchetypeUnits.OUNCE },
      t153: { length: 35.2 * ArchetypeUnits.INCH, mass: 34 * ArchetypeUnits.OUNCE },
      t156: { length: 35.1 * ArchetypeUnits.INCH, mass: 34.5 * ArchetypeUnits.OUNCE },
    },
    baton: {
      mp24: { length: 24 * ArchetypeUnits.INCH },
      mp26: { length: 26 * ArchetypeUnits.INCH },
    },
  };

  /** The parameters: the kind, the model, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which club. */
    kind: Kind;

    /** Which of the kind's read models; picked from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `club` when absent. */
    id?: string;
  }

  /** The band of each free dimension a kind's model leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    bat: {
      diameter: ArchetypeBand.metres(
        2.5 * ArchetypeUnits.INCH,
        2.61 * ArchetypeUnits.INCH,
        `${RULE}; the lower end, 2.5 in, is an estimate`,
        true,
      ),
      handleDiameter: ArchetypeBand.metres(
        0.9 * ArchetypeUnits.INCH,
        0.025,
        "about 0.9 in at the handle's thinnest, read off the profile plotted in Nathan, Smith and Russell 2026, Figure 2 (https://baseball.physics.illinois.edu/ISEA2026-Torpedo-v7.pdf), not a stated number",
        true,
      ),
    },
    baton: {
      diameter: ArchetypeBand.metres(1.25 * ArchetypeUnits.INCH, 1.25 * ArchetypeUnits.INCH, BATON),
      mass: ArchetypeBand.of(
        "kg",
        13 * ArchetypeUnits.OUNCE,
        21.6 * ArchetypeUnits.OUNCE,
        "Monadnock 26 in wood baton, 13 oz, and MP26 polycarbonate baton, 21.6 oz, retailer listings",
        true,
      ),
    },
  };
}
