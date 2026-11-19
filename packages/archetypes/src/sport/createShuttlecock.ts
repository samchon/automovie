import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * Build a feathered badminton shuttlecock. The rounded cork's nose sits at
 * the model origin and the hollow skirt opens along local +Y. The cork
 * supplies both a sized grip and the normal of its leading strike surface.
 *
 * @param params The scene subject and optional fixed rule dimensions.
 * @param seed Draws omitted dimensions reproducibly inside their bands.
 * @returns The shuttlecock with rigid cork and separate feather volumes.
 * @throws {ArchetypeRefusal} On a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modeled, local frame, affordances, parameters and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation BWF bounds control cork and skirt dimensions. Separate tapered convex vanes leave the air cavity open.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw dimensions, place cork and skirt, declare the two cork affordances, build.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None of the feather volumes bridges the opposing skirt sides.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of small convex cells and two affordances.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same archetype bands, convex collision parts and affordance frames as other rigid props.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The archetype is independently owned.
 */
export function createShuttlecock(
  params: createShuttlecock.IParams = {},
  seed?: number | string,
): Archetype<createShuttlecock.Affordance, createShuttlecock.Dimension> {
  const draw: ArchetypeDrawSession<createShuttlecock.Dimension> =
    new ArchetypeDrawSession(
      "shuttlecock",
      createShuttlecock.UNITS,
      seed,
      params,
    );
  const dimensions: Record<createShuttlecock.Dimension, number> =
    draw.dimensions(createShuttlecock.BANDS);
  const builder: ArchetypeBuilder<
    createShuttlecock.Affordance,
    createShuttlecock.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "badminton shuttlecock",
    draw,
  });
  const r: number = dimensions.corkDiameter / 2;
  const centre: IAutoMovieVector3 = Vector3.create(0, r, 0);
  const mount: number = r * 0.68;
  const tip: number = dimensions.skirtDiameter / 2;
  const height: number =
    2 * r + Math.sqrt(dimensions.featherLength ** 2 - (tip - mount) ** 2);
  builder.ball("cork", r, centre, { color: "#ead9b8" });

  // Taper each vane in its own radial sector. The feather thickness and
  // root width are provisional mesh dimensions.
  for (let i: number = 0; i < createShuttlecock.FEATHERS; ++i) {
    const angle: number = (2 * Math.PI * i) / createShuttlecock.FEATHERS;
    const radial: IAutoMovieVector3 = Vector3.create(
      Math.cos(angle),
      0,
      Math.sin(angle),
    );
    const tangent: IAutoMovieVector3 = Vector3.create(-radial.z, 0, radial.x);
    const corners: IAutoMovieVector3[] = [];
    for (const [radius, y, width] of [
      [mount, r * 1.55, 0.0012],
      [
        tip,
        height,
        tip * Math.sin(Math.PI / createShuttlecock.FEATHERS) * 0.96,
      ],
    ] as const)
      for (const edge of [-1, 1] as const)
        for (const layer of [-1, 1] as const)
          corners.push(
            Vector3.add(
              Vector3.add(
                Vector3.scale(radial, radius + layer * 0.00035),
                Vector3.scale(tangent, edge * width),
              ),
              Vector3.create(0, y, 0),
            ),
          );
    builder.convex(`feather-${i + 1}`, corners, Vector3.create(0, 0, 0), {
      color: "#f4f1e9",
      density: 0.075,
    });
  }
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      centre,
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: dimensions.corkDiameter,
  });
  builder.affordance({
    id: "strike",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(dimensions.mass);
}

/**
 * Inputs and BWF Law 2 dimensions for a feather shuttle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines each dimension, its units and origin.
 * @evidence contracts/development/design.md#principled-representation Three physical dimensions and one measured mass drive the rigid geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the declared archetype input and two cork affordances.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the documented feather-shuttle limits with separate internal modeling detail.
 */
export namespace createShuttlecock {
  /** The scene subject and optional fixed values for the drawn dimensions. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Unique scene subject. */
    id?: string;
  }

  /** Cork and feather dimensions in metres, and whole-shuttle mass in kilograms. */
  export type Dimension =
    | "corkDiameter"
    | "featherLength"
    | "skirtDiameter"
    | "mass";

  /** The cork-centre grip and outward strike surface on the rounded nose. */
  export type Affordance = "grip" | "strike";

  /** The units of the values a caller fixes or lets the draw choose. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    corkDiameter: "m",
    featherLength: "m",
    skirtDiameter: "m",
    mass: "kg",
  };

  /** BWF Laws of Badminton, §2.2, feathered shuttle. */
  const BWF: string =
    "BWF Laws of Badminton, 26 April 2025, 2.2 (https://badminton.dk/wp-content/uploads/2025/11/Section-4.1-Laws-of-Badminton-26-April-2025-V5.0-1-.pdf)";

  /** BWF Law 2.2.1's count of feathers fixed in the base. */
  export const FEATHERS: number = 16;

  /** BWF Law 2.2's dimensions and mass limits. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    corkDiameter: ArchetypeBand.metres(0.025, 0.028, BWF),
    featherLength: ArchetypeBand.metres(0.062, 0.07, BWF),
    skirtDiameter: ArchetypeBand.metres(0.058, 0.068, BWF),
    mass: ArchetypeBand.of("kg", 0.00474, 0.0055, BWF),
  };
}
