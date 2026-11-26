import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** Canonical producer and authoring contract for Shuttlecock. */
export namespace AutoMovieArchetypeShuttlecock {
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
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
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    corkDiameter: AutoMovieArchetypeBand.metres(0.025, 0.028, BWF),
    featherLength: AutoMovieArchetypeBand.metres(0.062, 0.07, BWF),
    skirtDiameter: AutoMovieArchetypeBand.metres(0.058, 0.068, BWF),
    mass: AutoMovieArchetypeBand.of("kg", 0.00474, 0.0055, BWF),
  };

  /**
   * Build a feathered badminton shuttlecock. The rounded cork's nose sits at the
   * model origin and the hollow skirt opens along local +Y. The cork supplies
   * both a sized grip and the normal of its leading strike surface.
   *
   * @param params The scene subject and optional fixed rule dimensions.
   * @param seed Draws omitted dimensions reproducibly inside their bands.
   * @returns The shuttlecock with rigid cork and separate feather volumes.
   * @throws {AutoMovieArchetypeRefusal} On a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeShuttlecock.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeShuttlecock.Affordance,
    AutoMovieArchetypeShuttlecock.Dimension
  > {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeShuttlecock.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "shuttlecock",
        AutoMovieArchetypeShuttlecock.UNITS,
        seed,
        params,
      );
    const dimensions: Record<AutoMovieArchetypeShuttlecock.Dimension, number> =
      draw.dimensions(AutoMovieArchetypeShuttlecock.BANDS);
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeShuttlecock.Affordance,
      AutoMovieArchetypeShuttlecock.Dimension
    > = new AutoMovieArchetypeBuilder({
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
    for (let i: number = 0; i < AutoMovieArchetypeShuttlecock.FEATHERS; ++i) {
      const angle: number = (2 * Math.PI * i) / AutoMovieArchetypeShuttlecock.FEATHERS;
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
          tip * Math.sin(Math.PI / AutoMovieArchetypeShuttlecock.FEATHERS) * 0.96,
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
      frame: AutoMovieArchetypeFrame.facing(
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
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, 0, 0),
        Vector3.create(0, -1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(dimensions.mass);
  }
}
