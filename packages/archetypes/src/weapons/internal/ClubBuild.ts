import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeClub } from "../AutoMovieArchetypeClub";

/** The professional rule on a bat's size. */
const RULE: string =
  "Official Baseball Rules 2024, rule 3.02(a), a bat at most 2.61 in across at its thickest (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

/** A maker's straight batons. */
const BATON: string =
  "Monadnock MP straight polycarbonate batons, 24 and 26 in long and 1.25 in across (https://www.defense-technology.com/?p=2138)";

/**
 * The measured club recipes, seed draw and model contacts retained by the bat
 * and screen practice prop.
 */
export namespace ClubBuild {
  /** The retained barrel length in metres. */
  export const BARREL: number = 10 * AutoMovieArchetypeUnits.INCH;

  /** The retained strike distance from the tip in metres. */
  export const SWEET: number = 5.5 * AutoMovieArchetypeUnits.INCH;

  /** The retained knob diameter in metres. */
  export const KNOB: number = 2 * AutoMovieArchetypeUnits.INCH;

  /** The retained knob length in metres. */
  export const KNOB_LENGTH: number = 0.02;

  /** The retained hand span in metres. */
  export const HANDS: number = 0.25;

  /** The retained dimension units. */
  export const UNITS: Readonly<
    Record<AutoMovieArchetypeClub.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /** The retained measured profiles. */
  export const MODELS: Readonly<
    Record<
      AutoMovieArchetypeClub.Kind,
      Readonly<
        Partial<
          Record<
            AutoMovieArchetypeClub.Model,
            Readonly<Partial<Record<AutoMovieArchetypeClub.Dimension, number>>>
          >
        >
      >
    >
  > = {
    bat: {
      s154: {
        length: 35.2 * AutoMovieArchetypeUnits.INCH,
        mass: 33.9 * AutoMovieArchetypeUnits.OUNCE,
      },
      s155: {
        length: 35.1 * AutoMovieArchetypeUnits.INCH,
        mass: 34 * AutoMovieArchetypeUnits.OUNCE,
      },
      t153: {
        length: 35.2 * AutoMovieArchetypeUnits.INCH,
        mass: 34 * AutoMovieArchetypeUnits.OUNCE,
      },
      t156: {
        length: 35.1 * AutoMovieArchetypeUnits.INCH,
        mass: 34.5 * AutoMovieArchetypeUnits.OUNCE,
      },
    },
    baton: {
      mp24: { length: 24 * AutoMovieArchetypeUnits.INCH },
      mp26: { length: 26 * AutoMovieArchetypeUnits.INCH },
    },
  };

  /** The retained free-dimension bands. */
  export const BANDS: Readonly<
    Record<
      AutoMovieArchetypeClub.Kind,
      Readonly<Partial<Record<AutoMovieArchetypeClub.Dimension, IAutoMovieArchetypeBand>>>
    >
  > = {
    bat: {
      diameter: AutoMovieArchetypeBand.metres(
        2.5 * AutoMovieArchetypeUnits.INCH,
        2.61 * AutoMovieArchetypeUnits.INCH,
        `${RULE}; the lower end, 2.5 in, is an estimate`,
        true,
      ),
      handleDiameter: AutoMovieArchetypeBand.metres(
        0.9 * AutoMovieArchetypeUnits.INCH,
        0.025,
        "about 0.9 in at the handle's thinnest, read off the profile plotted in Nathan, Smith and Russell 2026, Figure 2 (https://baseball.physics.illinois.edu/ISEA2026-Torpedo-v7.pdf), not a stated number",
        true,
      ),
    },
    baton: {
      diameter: AutoMovieArchetypeBand.metres(
        1.25 * AutoMovieArchetypeUnits.INCH,
        1.25 * AutoMovieArchetypeUnits.INCH,
        BATON,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        13 * AutoMovieArchetypeUnits.OUNCE,
        21.6 * AutoMovieArchetypeUnits.OUNCE,
        "Monadnock 26 in wood baton, 13 oz, and MP26 polycarbonate baton, 21.6 oz, retailer listings",
        true,
      ),
    },
  };

  /** The values {@link draw} accepts at this place in its signature. */
  export type DrawMaterial = "wood" | "plastic";

  /** What {@link draw} prepares for its caller. */
  export interface IDrawResult {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeClub.Affordance,
      AutoMovieArchetypeClub.Dimension
    >;

    /** The prepared `d` this call returns. */
    d: Partial<Record<AutoMovieArchetypeClub.Dimension, number>>;
  }

  /** Draw the bat or screen practice profile under its original club namespace. */
  export function draw(
    kind: AutoMovieArchetypeClub.Kind,
    params: Readonly<Omit<AutoMovieArchetypeClub.IParams, "kind">>,
    seed: number | undefined,
    name: string,
    material: DrawMaterial,
  ): IDrawResult {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeClub.Dimension> =
      new AutoMovieArchetypeDrawSession("club", UNITS, seed, params);
    const model: AutoMovieArchetypeDrawSession.IModel<
      AutoMovieArchetypeClub.Model,
      AutoMovieArchetypeClub.Dimension
    > = draw.model("model", params.model, MODELS[kind]);
    const d: Partial<Record<AutoMovieArchetypeClub.Dimension, number>> = {
      ...draw.dimensions(BANDS[kind], BANDS),
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeClub.Affordance,
      AutoMovieArchetypeClub.Dimension
    > = new AutoMovieArchetypeBuilder({ material, id: params.id, name, draw });
    return { builder, d };
  }

  /** The values {@link contacts} accepts at this place in its signature. */
  export type ContactsGrip = "two-hand" | "power";

  /**
   * Attach the original grip and facing surface in the built model frame.
   *
   * @param builder The builder that receives the saved prop's contacts.
   * @param length The model's full length along local Y, in metres.
   * @param thick The radius at its scene-contact surface, in metres.
   * @param held The model radius at the grip, in metres.
   * @param middle The grip midpoint along local Y, in metres.
   * @param span The extent of the grip along local Y, in metres.
   * @param grip The grip convention used by the stored prop shape.
   */
  export function contacts(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeClub.Affordance,
      AutoMovieArchetypeClub.Dimension
    >,
    length: number,
    thick: number,
    held: number,
    middle: number,
    span: number,
    grip: ContactsGrip,
  ): void {
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, middle, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: grip,
      aperture: 2 * held,
      length: span,
    });
    builder.affordance({
      id: "strike",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, length - SWEET, thick),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  }
}
