import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBand,
  type ArchetypeBuilder,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import type { createLongTool } from "./createLongTool";

/** A long tool under construction. */
type Builder = ArchetypeBuilder<
  createLongTool.Affordance,
  createLongTool.Dimension
>;

/** A long tool's drawn dimensions. */
type Drawn = Readonly<Partial<Record<createLongTool.Dimension, number>>>;

/** Gränsfors Bruk's Scandinavian Forest Axe, read at the maker. */
const FOREST_AXE: string =
  "Gränsfors Bruk Scandinavian Forest Axe 430, 64 cm and 1,2 kg (https://www.gransforsbruk.com/en/p/scandinavian-forest-axe); The Axe Book (Gränsfors Bruks AB 2005, ISBN 91-975532-5-5, p. 9, https://www.canadianoutdoorequipment.com/downloads/TheAxeBook.pdf): a 3 1/2 in face, a 25 in hickory handle and a 2 lb head";

/** The same axe as a retailer measures it. */
const FOREST_AXE_SHOP: string =
  "Knives and Tools, Gränsfors Bruk Scandinavian Forest Axe 430 (GS430): 65 cm overall, head 16.3 cm long, 9 cm high and 2.6 cm thick, sharpened length 9 cm, head 900 g, 1,200 g (https://knivesandtools.co.uk/en/pt/-gransfors-bruk-scandinavian-forest-axe-430.htm), a retailer's measurement";

/**
 * The forest axe among the long tools: Gränsfors Bruk's Scandinavian Forest Axe as its maker and a retailer give it, its bands and its builder, kept apart from `createLongTool` so each file stays within its size.
 *
 * The axe stands on its head at the origin, its handle rising along `+Y`; its `face` is the edge, facing `+Z` the way the swing goes, with the handle's back flush with the poll, and both hands hold the handle as the `shaft` bar.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the axe stands, its contacts, and why it is its own file.
 * @evidence contracts/development/design.md#principled-representation The axe's read figures as bands, the hickory density that sizes its handle, and one builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bands and the builder `createLongTool` takes for its forest axe.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The head's place on the handle, which no source gives, is a provisional band; the head's thickness is the retailer's.
 */
export namespace ForestAxe {
  /** Shagbark hickory's density at 12 % moisture, kilograms per cubic metre, which sizes an axe's handle from its mass (The Wood Database, https://www.wood-database.com/shagbark-hickory/, average dried weight 800 kg/m3). */
  export const HICKORY: number = 800;

  /** An axe head's thickness across `X`, metres: the retailer's 2.6 cm at the poll. No act reads it, and the head's inertia about the swing's axis does not depend on it. */
  export const HEAD_THICKNESS: number = 0.026;

  /** The forest axe's bands; it has no drawn shaft diameter. */
  export const BANDS: Readonly<
    Partial<Record<createLongTool.Dimension, IArchetypeBand>>
  > = {
    length: ArchetypeBand.metres(
      25 * ArchetypeUnits.INCH,
      0.65,
      `${FOREST_AXE}; ${FOREST_AXE_SHOP}`,
    ),
    edge: ArchetypeBand.metres(
      3.5 * ArchetypeUnits.INCH,
      0.09,
      `${FOREST_AXE}; ${FOREST_AXE_SHOP}`,
    ),
    headLength: ArchetypeBand.metres(
      0.163,
      0.163,
      `${FOREST_AXE_SHOP}; where the handle sits in the head no maker's page, the Axe Book or a retailer gives, and no drawing was found, so the handle's back stands flush with the poll, a provisional construction from which the edge's reach ahead of the handle follows`,
      true,
    ),
    headMass: ArchetypeBand.of(
      "kg",
      0.9,
      2 * ArchetypeUnits.POUND,
      `${FOREST_AXE}; ${FOREST_AXE_SHOP}`,
    ),
    mass: ArchetypeBand.of("kg", 1.2, 1.2, `${FOREST_AXE}; ${FOREST_AXE_SHOP}`),
  };

  /**
   * Builds the axe on the long tool's builder: the head on the floor and its edge, then the handle and the bar both hands hold.
   *
   * The handle's diameter is the one at which hickory of the read density, over the handle's length below the head, weighs the read handle mass: d = sqrt(4 m / (pi rho L)); the head and the handle carry their read masses as shares.
   *
   * @param builder The long tool's builder.
   * @param d The drawn dimensions: the length, the edge, the head's length and mass, and the mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and how the handle is sized.
   * @evidence contracts/development/implementation.md#principled-implementation The handle's diameter from its read mass and hickory's density; the head a block of the read edge and length, its poll flush with the handle's back.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The handle's size, the head and its edge, the handle and its bar.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wedge head is a block of the retailer's poll thickness, and the oval handle, which slims below the grip, a round rod.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function build(builder: Builder, d: Drawn): void {
    const length: number = d.length!;
    const edge: number = d.edge!;
    const head: number = d.headLength!;
    const handle: number = d.mass! - d.headMass!;
    const shaft: number = Math.sqrt(
      handle / (Math.PI * HICKORY * (length - edge)),
    );
    // The head on the floor, its poll flush with the handle's back and its edge toward +Z.
    builder.box(
      "head",
      Vector3.create(HEAD_THICKNESS, edge, head),
      Vector3.create(0, edge / 2, head / 2 - shaft),
      { color: "#6c7076", share: d.headMass! / d.mass! },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, edge / 2, head - shaft),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      width: edge,
    });
    builder.rod(
      "shaft",
      shaft,
      Vector3.create(0, edge, 0),
      Vector3.create(0, length, 0),
      { color: "#b98d5b", share: handle / d.mass! },
    );
    builder.affordance({
      id: "shaft",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, (edge + length) / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "two-hand",
      aperture: 2 * shaft,
      length: length - edge,
    });
  }
}
