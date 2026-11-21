import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type ArchetypeMaterial,
} from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { OBSTACLE_BANDS } from "./OBSTACLE_BANDS";
import { TIE_SIZES } from "./TIE_SIZES";
import type { createObstacle } from "./createObstacle";

/**
 * The draw and forward-facing ledge shared by ground obstacles with a rectangular top.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the shared seeded dimensions and the contact coordinates.
 * @evidence contracts/development/design.md#principled-representation Per-profile construction uses the measured bounding dimensions and its own top depth to supply the ledge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Seeded input validation and the common top and edge only; each producer defines its actual geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ties keep the two original whole-model axes. No support frame is inferred from an object's category.
 */
export namespace ObstacleDraw {
  /**
   * The obstacle's seeded dimensions and its empty builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the measurements and builder returned to each obstacle.
   * @evidence contracts/development/design.md#principled-representation The recorded shape keys refer to the fixed obstacle profile and its selected model dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions and builder are the only intermediate outputs needed to construct the selected obstacle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The same draw gives construction dimensions and stored provenance.
   */
  export interface IObstacle<Id extends string> {
    /** A fresh builder with the drawn identity and physical material. */
    builder: ArchetypeBuilder<Id, createObstacle.Dimension>;

    /** Values in metres, kilograms or kilograms per metre. */
    d: Partial<Record<createObstacle.Dimension, number>>;
  }

  /**
   * Admit a saved obstacle's section and length choices and draw its free measurements.
   *
   * @param kind The fixed profile.
   * @param name The readable display name.
   * @param material The obstacle's physical material.
   * @param params The scene identifier, dimension overrides and optional crosstie sizes.
   * @param seed The seed for unresolved dimensions and choices.
   * @returns The dimensions and the builder awaiting the selected geometry.
   * @throws {ArchetypeRefusal} For a model or dimension the given profile cannot admit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the original axes and returned builder.
   * @evidence contracts/development/implementation.md#principled-implementation Apply two whole crosstie draws and then validate the selected bands, preserving the recorded figures.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw model axes, draw bands and open the builder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A tie dimension set by a section or length remains model-owned; other profiles refuse supplied tie models.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One fixed set of dimension draws.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All obstacle profiles reuse the original draw and dimensional checks.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only returns the drawn dimensions and new builder.
   */
  export function begin<Id extends string>(
    kind: createObstacle.Kind,
    name: string,
    material: ArchetypeMaterial.Kind,
    params: Omit<createObstacle.IParams, "kind">,
    seed?: number | string,
  ): IObstacle<Id> {
    const draw: ArchetypeDrawSession<createObstacle.Dimension> =
      new ArchetypeDrawSession("obstacle", FixtureDraw.obstacle, seed, params);
    const section: Readonly<Partial<Record<createObstacle.Dimension, number>>> =
      draw.model("section", params.section, TIE_SIZES.section[kind]).figures;
    const length: Readonly<Partial<Record<createObstacle.Dimension, number>>> =
      draw.model("tieLength", params.tieLength, TIE_SIZES.length[kind]).figures;
    const d: Partial<Record<createObstacle.Dimension, number>> = {
      ...draw.dimensions(OBSTACLE_BANDS[kind], OBSTACLE_BANDS),
      ...section,
      ...length,
    };
    const builder: ArchetypeBuilder<Id, createObstacle.Dimension> =
      new ArchetypeBuilder({
        material,
        id: params.id,
        name,
        draw,
      });
    return { builder, d };
  }

  /** The contact ids {@link ledge} builds or reads. */
  export type LedgeContact = "top" | "edge";

  /**
   * Put a standing surface and a ledge on the actual top rectangle.
   *
   * @param builder The builder holding the obstacle's parts.
   * @param height The top above the floor, metres.
   * @param length The top measured along X, metres.
   * @param depth The top measured along Z, metres.
   * @param centre The middle of the top along Z, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two frames and their rectangle's measurements.
   * @evidence contracts/development/implementation.md#principled-implementation Use the top's own dimensions for its surface and put its forward edge at the near boundary.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The rectangle gives one surface and one front ledge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A barrier's narrow top supplies the contact depth independently of the full base.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Records two affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The three solid obstacles reuse the same surface-and-edge construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the builder receives the contacts.
   */
  export function ledge(
    builder: FixtureDraw.IContactWriter<LedgeContact>,
    height: number,
    length: number,
    depth: number,
    centre: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, height, centre)),
      extent: null,
      width: length,
      depth,
    });
    builder.affordance({
      id: "edge",
      kind: "ledge",
      frame: ArchetypeFrame.facing(
        v(0, height, centre + depth / 2),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length,
    });
  }
}
