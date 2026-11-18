import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
} from "../core";

/**
 * A stationary 16-inch crash cymbal on a straight tripod stand. The diameter
 * and raised bell follow Zildjian's cymbal anatomy
 * (https://ae.zildjian.com/wp-content/uploads/Zildjian_Drum_Method_Lesson_11.pdf).
 * The 0.85 m plate height is a scenic setting within Yamaha's CS650A range
 * (https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/hardware/cymbal_stands/specs.html).
 * The plate thickness, bell and stand proportions and assembly mass are
 * scenic estimates for the rigid prop.
 *
 * @param id Optional model id.
 * @returns The mounted cymbal with the upward-facing `edge` on the rim at
 * local −Z and `bell` at the raised center.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sources, estimates, local strike positions and the mounted rest.
 * @evidence contracts/development/implementation.md#principled-implementation A round plate and raised bell sit on a mast with three radial legs. The strike sites lie on the two solid surfaces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the plate and bell, then the stand, then the sites.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The edge uses the plate's radius and top height, and the bell uses its own top height. Contact coefficients are left unspecified.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Six fixed primitives.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds an independent scenic prop.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the returned prop.
 */
export function createCymbal(id?: string): Archetype<"edge" | "bell", never> {
  const radius: number = 8 * ArchetypeUnits.INCH;
  const edgeHeight: number = 0.85;
  const plateThickness: number = 0.002;
  const bellRadius: number = 0.055;
  const bellRise: number = 0.022;
  const mastRadius: number = 0.011;
  const legRadius: number = 0.009;
  const legSpread: number = 0.25;
  const legJointHeight: number = 0.18;
  const mass: number = 3;
  const bronze: string = "#c89439";
  const steel: string = "#8c969c";
  const v: typeof Vector3.create = Vector3.create;
  const builder: ArchetypeBuilder<"edge" | "bell", never> =
    new ArchetypeBuilder({
      id,
      name: "mounted cymbal",
      material: "composite",
      draw: new ArchetypeDrawSession<never>("cymbal", {}, undefined),
    });

  builder.rod(
    "plate",
    radius,
    v(0, edgeHeight - plateThickness, 0),
    v(0, edgeHeight, 0),
    { color: bronze },
  );
  builder.rod(
    "bell",
    bellRadius,
    v(0, edgeHeight, 0),
    v(0, edgeHeight + bellRise, 0),
    { color: bronze },
  );
  builder.rod(
    "mast",
    mastRadius,
    v(0, legJointHeight, 0),
    v(0, edgeHeight - plateThickness, 0),
    { color: steel },
  );
  for (let leg: number = 0; leg < 3; leg++) {
    const angle: number = (leg * 2 * Math.PI) / 3;
    builder.rod(
      `leg-${leg + 1}`,
      legRadius,
      v(0, legJointHeight, 0),
      v(legSpread * Math.sin(angle), legRadius, legSpread * Math.cos(angle)),
      { color: steel, round: true },
    );
  }

  builder.affordance({
    id: "edge",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, edgeHeight, -radius)),
    extent: null,
  });
  builder.affordance({
    id: "bell",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, edgeHeight + bellRise, 0)),
    extent: null,
  });
  return builder.build(mass);
}
