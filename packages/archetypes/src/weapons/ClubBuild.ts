import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import type { createClub } from "./createClub";

/** The professional rule on a bat's size. */
const RULE: string =
  "Official Baseball Rules 2024, rule 3.02(a), a bat at most 2.61 in across at its thickest (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

/** A maker's straight batons. */
const BATON: string =
  "Monadnock MP straight polycarbonate batons, 24 and 26 in long and 1.25 in across (https://www.defense-technology.com/?p=2138)";

/**
 * The measured club recipes, seed draw and model contacts retained by the bat and screen practice prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the original club draw namespace and the model record it preserves.
 * @evidence contracts/development/design.md#principled-representation Keeps dimensions in metres and mass in kilograms with the original per-kind bands and provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One draw and its tables serve the public producers and the saved-recipe dispatcher.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The same draw records bands, fixed figures and model choices.
 */
export namespace ClubBuild {
  /** The retained barrel length in metres. */
  export const BARREL: number = 10 * ArchetypeUnits.INCH;

  /** The retained strike distance from the tip in metres. */
  export const SWEET: number = 5.5 * ArchetypeUnits.INCH;

  /** The retained knob diameter in metres. */
  export const KNOB: number = 2 * ArchetypeUnits.INCH;

  /** The retained knob length in metres. */
  export const KNOB_LENGTH: number = 0.02;

  /** The retained hand span in metres. */
  export const HANDS: number = 0.25;

  /** The retained dimension units. */
  export const UNITS: Readonly<
    Record<createClub.Dimension, ArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    handleDiameter: "m",
    mass: "kg",
  };

  /** The retained measured profiles. */
  export const MODELS: Readonly<
    Record<
      createClub.Kind,
      Readonly<
        Partial<
          Record<
            createClub.Model,
            Readonly<Partial<Record<createClub.Dimension, number>>>
          >
        >
      >
    >
  > = {
    bat: {
      s154: {
        length: 35.2 * ArchetypeUnits.INCH,
        mass: 33.9 * ArchetypeUnits.OUNCE,
      },
      s155: {
        length: 35.1 * ArchetypeUnits.INCH,
        mass: 34 * ArchetypeUnits.OUNCE,
      },
      t153: {
        length: 35.2 * ArchetypeUnits.INCH,
        mass: 34 * ArchetypeUnits.OUNCE,
      },
      t156: {
        length: 35.1 * ArchetypeUnits.INCH,
        mass: 34.5 * ArchetypeUnits.OUNCE,
      },
    },
    baton: {
      mp24: { length: 24 * ArchetypeUnits.INCH },
      mp26: { length: 26 * ArchetypeUnits.INCH },
    },
  };

  /** The retained free-dimension bands. */
  export const BANDS: Readonly<
    Record<
      createClub.Kind,
      Readonly<Partial<Record<createClub.Dimension, IArchetypeBand>>>
    >
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
      diameter: ArchetypeBand.metres(
        1.25 * ArchetypeUnits.INCH,
        1.25 * ArchetypeUnits.INCH,
        BATON,
      ),
      mass: ArchetypeBand.of(
        "kg",
        13 * ArchetypeUnits.OUNCE,
        21.6 * ArchetypeUnits.OUNCE,
        "Monadnock 26 in wood baton, 13 oz, and MP26 polycarbonate baton, 21.6 oz, retailer listings",
        true,
      ),
    },
  };

  /**
   * Draw the bat or screen practice profile under its original club namespace.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the compatibility draw and the local model it fills.
   * @evidence contracts/development/implementation.md#principled-implementation Admit one model and its fixed dimensions, then draw the dimensions left free and preserve the provenance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keep draw and model assembly together, separate from shape construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserve the published parameter checks and contact conventions.
   * @evidence contracts/development/implementation.md#efficient-algorithms One draw pass over the profile's bands and one construction pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both independently constructed models share the former club draw.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or draw state between calls.
   */
  export function draw(
    kind: createClub.Kind,
    params: Readonly<Omit<createClub.IParams, "kind">>,
    seed: number | string | undefined,
    name: string,
    material: "wood" | "plastic",
  ): {
    builder: ArchetypeBuilder<createClub.Affordance, createClub.Dimension>;
    d: Partial<Record<createClub.Dimension, number>>;
  } {
    const draw: ArchetypeDrawSession<createClub.Dimension> =
      new ArchetypeDrawSession("club", UNITS, seed, params);
    const model: ArchetypeDrawSession.IModel<
      createClub.Model,
      createClub.Dimension
    > = draw.model("model", params.model, MODELS[kind]);
    const d: Partial<Record<createClub.Dimension, number>> = {
      ...draw.dimensions(BANDS[kind], BANDS),
      ...model.figures,
    };
    const builder: ArchetypeBuilder<
      createClub.Affordance,
      createClub.Dimension
    > = new ArchetypeBuilder({ material, id: params.id, name, draw });
    return { builder, d };
  }

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the original model coordinates and the location of the two scene contacts.
   * @evidence contracts/development/implementation.md#principled-implementation The grip frame uses the centre and thickness of the held portion, and the facing surface stays on the positive Z side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Add the shared grasp and positive-Z surface after the producer emits its model parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retain contact coordinates in the model's published resting frame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The fixed surface pair requires two frame constructions.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The bat and the inert replica share the saved contact convention.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or draw state between calls.
   */
  export function contacts(
    builder: ArchetypeBuilder<createClub.Affordance, createClub.Dimension>,
    length: number,
    thick: number,
    held: number,
    middle: number,
    span: number,
    grip: "two-hand" | "power",
  ): void {
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
      grip: grip,
      aperture: 2 * held,
      length: span,
    });
    builder.affordance({
      id: "strike",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, length - SWEET, thick),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
  }
}
