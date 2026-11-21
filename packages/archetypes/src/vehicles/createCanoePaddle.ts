import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { PaddleBlade } from "./PaddleBlade";

const SOURCE: string =
  "Bending Branches Expedition Plus product specifications: https://www.bendingbranches.com/products/expedition-plus";
const v: typeof Vector3.create = Vector3.create;

/**
 * A single-bladed wooden canoe paddle. The blade extends along -X and the
 * transverse T-grip forms the +X end. The shaft hand takes the lower handle.
 * This prop uses the published 56 inch reference envelope and overall mass.
 *
 * @param params Optional scene identity or exact reference overrides.
 * @param seed Provenance seed. The reference dimensions are fixed.
 * @returns The paddle, lower shaft grip, top T-grip and one blade-tip face.
 * @evidence contracts/development/common.md#meaningful-documentation Defines its axes, the two different grips, size and provenance.
 * @evidence contracts/development/implementation.md#principled-implementation One measured blade and shaft terminate at a separate T-shaped handle, with contacts on those physical pieces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read one known envelope, join the three shapes, then declare their contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No second blade or assumed symmetric grip. The shaft diameter and the local blade thickness are authored.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed geometry independent of scene length.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the measured blade's panel construction and the contact convention of the paired paddle.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no external state.
 */
export function createCanoePaddle(
  params: createCanoePaddle.IParams = {},
  seed?: number | string,
): Archetype<createCanoePaddle.Affordance, createCanoePaddle.Dimension> {
  const draw: ArchetypeDrawSession<createCanoePaddle.Dimension> =
    new ArchetypeDrawSession(
      "canoePaddle",
      createCanoePaddle.UNITS,
      seed,
      params,
    );
  const d: Record<createCanoePaddle.Dimension, number> = draw.dimensions(
    createCanoePaddle.BANDS,
  );
  const builder: ArchetypeBuilder<
    createCanoePaddle.Affordance,
    createCanoePaddle.Dimension
  > = new ArchetypeBuilder({
    name: "canoe paddle",
    material: "wood",
    id: params.id,
    draw,
  });
  const half: number = d.length / 2;
  const shoulder: number = -half + d.bladeLength;
  const diameter: number = 0.031;
  const top: number = half - 0.017;
  const handleSpan: number = 0.11;
  const wood: string = "#b7854d";
  builder.rod("shaft", diameter / 2, v(shoulder, 0, 0), v(top, 0, 0), {
    color: wood,
  });
  builder.rod(
    "top-grip",
    0.017,
    v(top, 0, -handleSpan / 2),
    v(top, 0, handleSpan / 2),
    {
      color: "#5d3c25",
    },
  );
  PaddleBlade.draw(
    builder,
    "blade",
    shoulder,
    -1,
    d.bladeLength,
    d.bladeWidth,
    0.003,
    wood,
  );
  PaddleBlade.grip(
    builder,
    "shaftGrip",
    v(shoulder + 0.24, 0, 0),
    v(1, 0, 0),
    diameter,
    0.14,
  );
  PaddleBlade.grip(
    builder,
    "topGrip",
    v(top, 0, 0),
    v(0, 0, 1),
    0.034,
    handleSpan,
    v(1, 0, 0),
  );
  PaddleBlade.tip(builder, "bladeTip", -half, -1, d.bladeWidth);
  return builder.build(d.mass);
}

/**
 * Shaft and blade dimensions and three contact ids of the single-bladed paddle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three grips or markers and the exact reference values.
 * @evidence contracts/development/design.md#principled-representation Each dimension has an explicit physical measurement site and provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the actual shaft and T-grip contacts plus the blade-tip surface are published.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Includes the measured 56 inch model as one reference, without inventing other sizes.
 */
export namespace createCanoePaddle {
  /** Shaft hand, T-grip hand, and the edge that crosses the water. */
  export type Affordance = "shaftGrip" | "topGrip" | "bladeTip";
  /** Overall length, blade envelope and published product mass. */
  export type Dimension = "length" | "bladeLength" | "bladeWidth" | "mass";
  /** Scene identity and exact reference overrides. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of each published figure. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    length: "m",
    bladeLength: "m",
    bladeWidth: "m",
    mass: "kg",
  };
  /** One manufacturer catalogue size and its blade and mass. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(
      56 * ArchetypeUnits.INCH,
      56 * ArchetypeUnits.INCH,
      SOURCE,
    ),
    bladeLength: ArchetypeBand.metres(
      19 * ArchetypeUnits.INCH,
      19 * ArchetypeUnits.INCH,
      SOURCE,
    ),
    bladeWidth: ArchetypeBand.metres(
      8.2 * ArchetypeUnits.INCH,
      8.2 * ArchetypeUnits.INCH,
      SOURCE,
    ),
    mass: ArchetypeBand.of("kg", 0.68, 0.68, SOURCE),
  };
}
