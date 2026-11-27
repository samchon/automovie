import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeLongTool } from "../AutoMovieArchetypeLongTool";
import { ForestAxeData } from "./ForestAxeData";

/*
 * The forest axe among the long tools: Gränsfors Bruk's Scandinavian Forest Axe
 * as its maker and a retailer give it, its bands and its builder, kept apart
 * from `createLongTool` so each file stays within its size.
 *
 * The axe stands on its head at the origin, its handle rising along `+Y`; its
 * `face` is the edge, facing `+Z` the way the swing goes, with the handle's
 * back flush with the poll, and both hands hold the handle as the `shaft` bar.
 */
export namespace ForestAxe {
  /*
   * Shagbark hickory's density at 12 % moisture, kilograms per cubic metre,
   * which sizes an axe's handle from its mass (The Wood Database,
   * https://www.wood-database.com/shagbark-hickory/, average dried weight 800
   * kg/m3).
   */
  export const HICKORY: number = 800;

  /*
   * An axe head's thickness across `X`, metres: the retailer's 2.6 cm at the
   * poll. No act reads it, and the head's inertia about the swing's axis does
   * not depend on it.
   */
  export const HEAD_THICKNESS: number = 0.026;

  /*
   * The forest axe's bands; it has no drawn shaft diameter.
   */
  export const BANDS: Readonly<
    Partial<Record<AutoMovieArchetypeLongTool.Dimension, IAutoMovieArchetypeBand>>
  > = {
    length: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      0.65,
      `${ForestAxeData.FOREST_AXE}; ${ForestAxeData.FOREST_AXE_SHOP}`,
    ),
    edge: AutoMovieArchetypeBand.metres(
      3.5 * AutoMovieArchetypeUnits.INCH,
      0.09,
      `${ForestAxeData.FOREST_AXE}; ${ForestAxeData.FOREST_AXE_SHOP}`,
    ),
    headLength: AutoMovieArchetypeBand.metres(
      0.163,
      0.163,
      `${ForestAxeData.FOREST_AXE_SHOP}; where the handle sits in the head no maker's page, the Axe Book or a retailer gives, and no drawing was found, so the handle's back stands flush with the poll, a provisional construction from which the edge's reach ahead of the handle follows`,
      true,
    ),
    headMass: AutoMovieArchetypeBand.of(
      "kg",
      0.9,
      2 * AutoMovieArchetypeUnits.POUND,
      `${ForestAxeData.FOREST_AXE}; ${ForestAxeData.FOREST_AXE_SHOP}`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1.2,
      1.2,
      `${ForestAxeData.FOREST_AXE}; ${ForestAxeData.FOREST_AXE_SHOP}`,
    ),
  };

  /*
   * Builds the axe on the long tool's builder: the head on the floor and its
   * edge, then the handle and the bar both hands hold.
   *
   * The handle's diameter is the one at which hickory of the read density, over
   * the handle's length below the head, weighs the read handle mass: d = sqrt(4
   * m / (pi rho L)); the head and the handle carry their read masses as
   * shares.
   * Parameter builder: The long tool's builder.
   * Parameter d: The drawn dimensions: the length, the edge, the head's length and
   * mass, and the mass.
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
      AutoMovieEngineVector3.create(HEAD_THICKNESS, edge, head),
      AutoMovieEngineVector3.create(0, edge / 2, head / 2 - shaft),
      { color: "#6c7076", share: d.headMass! / d.mass! },
    );
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, edge / 2, head - shaft),
        AutoMovieEngineVector3.create(0, 0, 1),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      width: edge,
    });
    builder.rod(
      "shaft",
      shaft,
      AutoMovieEngineVector3.create(0, edge, 0),
      AutoMovieEngineVector3.create(0, length, 0),
      { color: "#b98d5b", share: handle / d.mass! },
    );
    builder.affordance({
      id: "shaft",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, (edge + length) / 2, 0),
        AutoMovieEngineVector3.create(0, 0, -1),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "two-hand",
      aperture: 2 * shaft,
      length: length - edge,
    });
  }
}

/*
 * A long tool under construction.
 */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeLongTool.Affordance,
  AutoMovieArchetypeLongTool.Dimension
>;

/*
 * A long tool's drawn dimensions.
 */
type Drawn = Readonly<Partial<Record<AutoMovieArchetypeLongTool.Dimension, number>>>;
