import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

const RULES: string =
  "World Aquatics June 2025, Part Six Appendix 4 §20.4.3: https://resources.fina.org/fina/document/2025/07/01/ed3110a4-2291-411d-8526-6f641bd9237a/Competition-Regulations_June-2025_Clean-updated-01.07.2025-.pdf";

/**
 * A single water polo ball within the senior men's regulation size band.
 * The sphere's origin is its physical centre. That point is available to
 * the single-hand ball-custody and shot-resolution owners. The prop models the
 * ball's shape and mass for staging.
 *
 * @param params Scene identity and optional regulation dimensions.
 * @param seed Draws free dimensions within their bands.
 * @returns A spherical ball with the shared throw and catch affordances.
 * @evidence contracts/development/common.md#meaningful-documentation States the model anchor, shape, mass and actual grip frame.
 * @evidence contracts/development/implementation.md#principled-implementation Converts the supplied circumference to physical radius and uses the same center and diameter for the collider and grip.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw two dimensions, use one sphere and place two physical sites.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The model uses the size and mass band rather than another sport's ball silhouette.
 * @evidence contracts/development/implementation.md#efficient-algorithms One rigid part and two named affordances.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each draw owns one independently sized ball.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No external state.
 */
export function createWaterPoloBall(
  params: createWaterPoloBall.IParams = {},
  seed?: number | string,
): Archetype<createWaterPoloBall.Affordance, createWaterPoloBall.Dimension> {
  const draw: ArchetypeDrawSession<createWaterPoloBall.Dimension> =
    new ArchetypeDrawSession(
      "waterPoloBall",
      createWaterPoloBall.UNITS,
      seed,
      params,
    );
  const d: Record<createWaterPoloBall.Dimension, number> = draw.dimensions(
    createWaterPoloBall.BANDS,
  );
  const builder: ArchetypeBuilder<
    createWaterPoloBall.Affordance,
    createWaterPoloBall.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: "water polo ball",
    material: "rubber",
    draw,
  });
  const radius: number = d.circumference / (2 * Math.PI);
  const center = Vector3.create(0, 0, 0);
  builder.ball("ball", radius, center, { color: "#edc93b" });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.upright(center),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, radius, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Physical circumference and mass and the actual spherical grip sites.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declares the selected class, measurement sites and units.
 * @evidence contracts/development/design.md#principled-representation Both fitted radius and grip width follow the same drawn circumference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The public producer exposes only a scene id, the two regulation dimensions and two actual affordances.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both size and weight state their precise federation limits.
 */
export namespace createWaterPoloBall {
  /** The actual ball center and highest point. */
  export type Affordance = "grip" | "top";
  /** Ball circumference and weight. */
  export type Dimension = "circumference" | "mass";
  /** Scene identity and optional fixes within the size and mass bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of the cited regulation dimensions. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    circumference: "m",
    mass: "kg",
  };
  /** Regulation circumference for the senior men's game and regulation mass. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    circumference: ArchetypeBand.metres(0.68, 0.71, RULES),
    mass: ArchetypeBand.of("kg", 0.4, 0.45, RULES),
  };
}
