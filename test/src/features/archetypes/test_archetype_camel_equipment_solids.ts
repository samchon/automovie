import {
  AutoMovieArchetypeQuadrupedEquipment,
  AutoMovieArchetypeRefusal,
  createCamel,
} from "@automovie/archetypes";
import { Quaternion, validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AnimalEquipmentFixture as equipment } from "../internal/AnimalEquipmentFixture";
import { animalEquipmentBearingObservation } from "../internal/animalEquipmentBearingObservation";
import { nclose } from "../internal/nclose";

/**
 * Additional real body solids participate in physical equipment admission.
 *
 * Scenarios:
 * 1. All six explicit camel references carry an authored pack. Every emitted
 *    box/cylinder stays outside the actual hump by the requested clearance,
 *    raised horizontal bridges remain connected to both side rails, and actual
 *    tangent body bearings retain positive axial spans and frame connections.
 *    Actual tessellated sections also touch without a gap or penetration.
 * 2. The canonical pooled capture's authored dimensions remain admissible.
 *    Its input formula is independently reconstructed from Diop2020 TableII
 *    pooled girth 1.978 m, neck girth .656 m and body length 1.471 m, with
 *    the documented .15 authored pelvis share. The collision oracle reads
 *    actual primitives, never that formula or a production collision helper.
 * 3. An actual extra sphere occupying a real ox fixture's side pad refuses
 *    the entire plan before changing the genuine builder. This is a general
 *    body-solid contract, independent of camel identity.
 * 4. A real finite cylinder's flat end admits a nearby sphere which a capsule
 *    bound would falsely reject; moving the cap into the requested clearance
 *    refuses. No cylinder is replaced by a capsule during this admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical input provenance, every real primitive observation, tangent body-bearing spans and connected support, additional-body ownership and finite-cylinder distinguishing boundaries; no visual or load-capacity verdict is implied.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual public camel producers and equipment preparation/emission, inspects actual primitive transforms, body-bearing tangency and frame endpoints, and genuine builder isolation, and requires structured geometry refusals.
 * @evidence contracts/development/testing.md#independent-expectations The oracle transforms the actual sphere centre into each emitted cylinder/box's local frame and applies their elementary solid distance definitions. It imports no source table, production fit routine or saved geometry. Actual body-local circular sections supply tangent distances and positive axial overlap. Separating axes of sections cut from actual tessellated triangles require zero signed gap independently of the producer; actual endpoints supply frame joins. Canonical authoring inputs use independent published literals and declared construction ratios.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers pooled/five morphotypes, canonical/custom packs, additional sphere collision, source-independent ox consumption, connected raised bridges, tangent bearings across all six cohorts and an admitted flat cap versus a refused nearer cap. Existing cohort units own seed/mass/sex policies.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous discoverable scenario owns a bounded model collection and genuine in-memory builders, starts no process/compiler/renderer and replaces no method or geometry.
 */
export function test_archetype_camel_equipment_solids(): void {
  const findings: string[] = [];
  const pack: NonNullable<
    AutoMovieArchetypeQuadrupedEquipment.IParams["pack"]
  > = {
    length: 0.45,
    width: 0.2,
    thickness: 0.06,
    railRadius: 0.02,
    clearance: 0.01,
    hook: { radius: 0.008, opening: 0.1, depth: 0.05 },
  };
  for (const cohort of [
    "mauritanian-adult-female",
    "maur1",
    "maur2",
    "maur3",
    "maur4",
    "maur5",
  ] as const)
    inspect(
      cohort,
      createCamel({ mass: 450, cohort, equipment: { pack } }, 73),
      pack.clearance,
      pack.railRadius,
    );

  const barrel: number = 1.978 / (2 * Math.PI);
  const neckRadius: number = 0.656 / (2 * Math.PI);
  const trunk: number = 1.471 * (1 - 0.15) - barrel;
  const length: number = (trunk - 2 * neckRadius) / 2;
  const thickness: number = barrel / 8;
  const canonical: typeof pack = {
    length,
    width: barrel / 2,
    thickness,
    railRadius: thickness / 4,
    clearance: thickness,
    hook: { radius: thickness / 8, opening: length / 4, depth: length / 8 },
  };
  inspect(
    "canonical pooled capture",
    createCamel(
      { ...createCamel.REFERENCE, equipment: { pack: canonical } },
      73,
    ),
    canonical.clearance,
    canonical.railRadius,
  );

  const reference: ReturnType<typeof equipment.create> = equipment.create();
  AutoMovieArchetypeQuadrupedEquipment.lay(
    reference.builder,
    reference.rig,
    { pack },
    "equipment-fixture",
  );
  const actual: ReturnType<typeof reference.builder.build> =
    reference.builder.build(300);
  const occupied: IAutoMovieModelPart = equipment.part(actual, "pack-left-pad");
  const blocked: ReturnType<typeof equipment.create> = equipment.create();
  const sphere: AutoMovieArchetypeQuadrupedEquipment.ISphere = {
    id: "actual-extra-body-sphere",
    radius: 0.025,
    centre: { ...occupied.transform!.translation },
  };
  blocked.builder.ball(sphere.id, sphere.radius, sphere.centre);
  const before: string = JSON.stringify(blocked.builder.build(300));
  refuse(
    "actual occupied side pad",
    (): unknown =>
      AutoMovieArchetypeQuadrupedEquipment.prepare(
        blocked.rig,
        { pack },
        "equipment-fixture",
        [sphere],
      ),
    "equipment.pack-left-pad",
  );
  if (JSON.stringify(blocked.builder.build(300)) !== before)
    findings.push(
      "refused additional-solid preflight changed the actual builder",
    );

  const capped: ReturnType<typeof equipment.create> = equipment.create();
  const endSphere: AutoMovieArchetypeQuadrupedEquipment.ISphere = {
    id: "actual-end-sphere",
    radius: 0.1,
    centre: { x: 0, y: 3.25, z: 0 },
  };
  capped.builder.ball(endSphere.id, endSphere.radius, endSphere.centre);
  const capPlan: ReturnType<
    typeof AutoMovieArchetypeQuadrupedEquipment.prepare
  > = AutoMovieArchetypeQuadrupedEquipment.prepare(
    capped.rig,
    {},
    "equipment-fixture",
    [endSphere],
  );
  capPlan.rod(
    "flat-cap",
    0.1,
    { x: 0, y: 2, z: 0 },
    { x: 0, y: 3, z: 0 },
    "#70543b",
    0.12,
  );
  refuse(
    "cap enters requested clearance",
    (): unknown =>
      capPlan.rod(
        "near-cap",
        0.1,
        { x: 0, y: 2, z: 0 },
        { x: 0, y: 3.2, z: 0 },
        "#70543b",
        0.12,
      ),
    "equipment.near-cap",
  );
  capPlan.emit(capped.builder);
  const capModel: ReturnType<typeof capped.builder.build> =
    capped.builder.build(300);
  if (
    !validateModel({ model: capModel }).success ||
    !nclose(
      distance(equipment.part(capModel, "flat-cap"), endSphere.centre),
      0.25,
      1e-9,
    )
  )
    findings.push(
      "finite cylinder flat-cap distance did not preserve its actual .15m sphere gap",
    );
  TestValidator.equals(
    "actual additional body solid equipment fit",
    findings,
    [],
  );

  /** Observe real model solids and the two physical bridge-to-rail connections. */
  function inspect(
    label: string,
    model: ReturnType<typeof createCamel>,
    clearance: number,
    bearingRadius: number,
  ): void {
    if (!validateModel({ model }).success)
      findings.push(`${label}: actual equipped model failed admission`);
    animalEquipmentBearingObservation(model, "pack", bearingRadius, findings);
    const hump: IAutoMovieModelPart = equipment.part(model, "hump");
    if (
      hump.geometry.type !== "primitive" ||
      hump.geometry.shape.type !== "sphere"
    )
      throw new Error("The actual camel hump must be its emitted sphere");
    const centre: IAutoMovieVector3 = hump.transform!.translation;
    const radius: number = hump.geometry.shape.radius;
    for (const part of model.parts.filter(
      (candidate: IAutoMovieModelPart): boolean =>
        candidate.id.startsWith("pack-"),
    )) {
      const gap: number = distance(part, centre) - radius;
      if (gap < clearance - 1e-9)
        findings.push(
          `${label}/${part.id}: actual hump gap ${gap} is below authored ${clearance}`,
        );
    }
    for (const end of [-1, 1] as const) {
      const bridge: IAutoMovieModelPart = equipment.part(
        model,
        `pack-bridge-${end}`,
      );
      if (
        bridge.transform!.translation.y - equipment.cylinder(bridge).radius <
        centre.y + radius + clearance - 1e-9
      )
        findings.push(
          `${label}/${bridge.id}: crossbar does not clear the actual hump top`,
        );
      for (const [side, sign] of [
        ["left", 1],
        ["right", -1],
      ] as const) {
        const post: IAutoMovieModelPart = equipment.part(
          model,
          `pack-${side}-post-${end}`,
        );
        const rail: IAutoMovieModelPart = equipment.part(
          model,
          `pack-${side}-rail`,
        );
        if (
          !same(equipment.end(post, -1), equipment.end(rail, end)) ||
          !same(equipment.end(post, 1), equipment.end(bridge, sign))
        )
          findings.push(
            `${label}/${post.id}: raised bridge lost its real rail connection`,
          );
      }
    }
  }

  /** Independently read point-to-solid distance in the actual primitive's local frame. */
  function distance(
    part: IAutoMovieModelPart,
    centre: IAutoMovieVector3,
  ): number {
    if (part.geometry.type !== "primitive")
      throw new Error("Equipment must have actual primitive geometry");
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(part.transform!.rotation),
      {
        x: centre.x - part.transform!.translation.x,
        y: centre.y - part.transform!.translation.y,
        z: centre.z - part.transform!.translation.z,
      },
    );
    const shape: typeof part.geometry.shape = part.geometry.shape;
    if (shape.type === "cylinder")
      return Math.hypot(
        Math.max(0, Math.hypot(local.x, local.z) - shape.radius),
        Math.max(0, Math.abs(local.y) - shape.height / 2),
      );
    if (shape.type === "box")
      return Math.hypot(
        Math.max(0, Math.abs(local.x) - shape.width / 2),
        Math.max(0, Math.abs(local.y) - shape.height / 2),
        Math.max(0, Math.abs(local.z) - shape.depth / 2),
      );
    throw new Error(
      "The equipment distance oracle admits only its actual cylinders and boxes",
    );
  }

  /** Observe matching physical join points at a scale far below an authored dimension. */
  function same(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
    return (
      nclose(a.x, b.x, 1e-9) && nclose(a.y, b.y, 1e-9) && nclose(a.z, b.z, 1e-9)
    );
  }

  /** An actual parameter refusal on the physical part is the only accepted failure. */
  function refuse(label: string, run: () => unknown, axis: string): void {
    try {
      run();
      findings.push(`${label}: unexpectedly admitted`);
    } catch (error) {
      if (
        !(error instanceof AutoMovieArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.axis !== axis ||
        error.feasible !== null
      )
        findings.push(`${label}: wrong physical refusal ${String(error)}`);
    }
  }
}
