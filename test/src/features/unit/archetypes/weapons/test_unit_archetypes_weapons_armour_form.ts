import {
  AutoMovieArchetypeDensity,
  AutoMovieArchetypeRefusal,
  createArmour,
} from "@automovie/archetypes";
import { physicalHullMass, physicalShapeNearest } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ARMOUR_RECORDS } from "../../../internal/ARMOUR_RECORDS";
import { armourActual } from "../../../internal/armourActual";

/**
 * Every real armour piece has actual visible/physical walls and empty cavities.
 *
 * Scenarios:
 *
 * 1. All nineteen records have multiple actual mesh walls, one real hull per
 *    visible part, finite positive cell volumes and an empty body centre.
 * 2. Every helmet has an open neck; the source sallet and missing-visor armet have
 *    a free frontal ray. The actual close-helmet and associated-visored sallet
 *    retain lower face coverage. No missing visor is reconstructed.
 * 3. Torso shells retain a free neck/hem path and arm access, mail has real hollow
 *    sleeves, the hand has a thumb and closed mitten tip, and guards have
 *    actual open ends. These witnesses query current physical cells.
 * 4. Every mail record's actual nonoverlapping cell volume at the existing steel
 *    preset density equals its independent museum mass; it is expressly a
 *    uniform-wall material proxy, not measured historical wire or alloy.
 * 5. Independent producer calls own independent geometry, while exact rigid sector
 *    placements share one admitted cell only inside the same model.
 * 6. A fitted shirt wider than its selected record's sleeve spread refuses
 *    structurally instead of erasing sleeves or introducing a zero wall.
 */
export function test_unit_archetypes_weapons_armour_form(): void {
  const findings: string[] = [];
  const EPSILON: number = 1e-9;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const pose: IAutoMovieRigidTransform = {
    position: origin,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  for (const kind of createArmour.KINDS)
    for (const [model, [heightCm, widthCm, depthCm, grams]] of Object.entries(
      ARMOUR_RECORDS[kind]!,
    )) {
      const piece: ReturnType<typeof createArmour> = createArmour({
        kind,
        model: model as createArmour.Model,
      });
      const shapes: IAutoMoviePhysicalShape[] = piece.shapes();
      const height: number = heightCm / 100;
      const width: number = widthCm / 100;
      const depth: number = depthCm / 100;
      const ids: Set<string> = new Set(
        shapes.map((shape: IAutoMoviePhysicalShape): string => shape.id),
      );
      if (
        piece.parts.length <= 1 ||
        shapes.length !== piece.parts.length ||
        piece.parts.some(
          (part: (typeof piece.parts)[number]): boolean =>
            part.geometry.type !== "mesh" || !ids.has(part.id),
        )
      )
        findings.push(
          kind +
            " " +
            model +
            " has no complete actual mesh/hull wall correspondence",
        );
      let volume: number = 0;
      for (const shape of shapes) {
        if (shape.kind !== "hull") {
          findings.push(model + " has a primitive body proxy");
          continue;
        }
        const cellVolume: number = physicalHullMass(shape.points).volume;
        if (!(cellVolume > 0))
          findings.push(model + " has a nonpositive wall cell");
        volume += cellVolume;
      }
      if (!(armourActual.distance(piece, origin) > EPSILON))
        findings.push(kind + " " + model + " fills its body centre");
      if (kind.endsWith("Helmet")) {
        if (!(clear(origin, { x: 0, y: -height, z: 0 }) > EPSILON))
          findings.push(model + " closes its neck");
        if (kind !== "brimmedHelmet") {
          const front: number = clear(
            { x: 0, y: -height / 3, z: 0 },
            { x: 0, y: -height / 3, z: depth },
          );
          const survivingVisor: boolean =
            model === "met26508" || model === "met25388";
          if (survivingVisor ? front > EPSILON : !(front > EPSILON))
            findings.push(
              model +
                " does not preserve its surviving or missing face coverage",
            );
        }
      } else if (kind === "cuirass" || kind === "mail") {
        if (
          !(
            clear({ x: 0, y: -height, z: 0 }, { x: 0, y: height, z: 0 }) >
            EPSILON
          )
        )
          findings.push(model + " blocks its neck/body/hem cavity");
        if (
          !(
            clear(
              { x: -width, y: height / 3, z: 0 },
              { x: width, y: height / 3, z: 0 },
            ) > EPSILON
          )
        )
          findings.push(model + " blocks its actual arm/sleeve opening");
        if (kind === "mail") {
          if (
            !piece.parts.some((part: (typeof piece.parts)[number]): boolean =>
              part.id.startsWith("sleeve"),
            )
          )
            findings.push(model + " has no actual sleeve walls");
          if (
            !(
              Math.abs(
                volume * AutoMovieArchetypeDensity.STEEL - grams / 1000,
              ) <= EPSILON
            )
          )
            findings.push(
              model +
                " actual equivalent steel wall does not retain record mass",
            );
        }
      } else if (kind === "gauntlet") {
        if (
          !piece.parts.some((part: (typeof piece.parts)[number]): boolean =>
            part.id.startsWith("thumb"),
          )
        )
          findings.push(model + " has no actual thumb domain");
        if (
          clear({ x: 0, y: height / 3, z: 0 }, { x: 0, y: height, z: 0 }) >
          EPSILON
        )
          findings.push(model + " has no closed mitten tip");
      } else if (
        !(
          clear({ x: 0, y: -height, z: 0 }, { x: 0, y: height, z: 0 }) > EPSILON
        )
      )
        findings.push(model + " fills a guard's open limb course");

      /**
       * The actual current convex cells, without an aggregate cavity-filling
       * hull.
       */
      function clear(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
        return Math.min(
          ...shapes.map(
            (shape: IAutoMoviePhysicalShape): number =>
              physicalShapeNearest(pose, shape, a, b).distance,
          ),
        );
      }
    }
  const first: ReturnType<typeof createArmour> = createArmour({
    kind: "openHelmet",
  });
  const geometry: (typeof first.parts)[number]["geometry"] =
    first.parts[0]!.geometry;
  if (geometry.type !== "mesh")
    findings.push("actual helmet has no mesh to test ownership");
  else {
    const original: number = geometry.mesh.positions[0]!;
    geometry.mesh.positions[0] = original + 1;
    const second: ReturnType<typeof createArmour> = createArmour({
      kind: "openHelmet",
    });
    const next: (typeof second.parts)[number]["geometry"] =
      second.parts[0]!.geometry;
    if (next.type !== "mesh" || next.mesh.positions[0] !== original)
      findings.push("independent producer calls share mutable geometry");
  }
  try {
    createArmour({
      kind: "mail",
      measure: { chestBreadth: 3, chestDepth: 0.2 },
    });
    findings.push("an impossible shirt silently loses its sleeves or wall");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal && error.axis === "measure")
    )
      findings.push("an impossible shirt has no structured geometric refusal");
  }
  TestValidator.equals(
    "actual armour identity, cavities and wall ownership",
    findings,
    [],
  );
}
