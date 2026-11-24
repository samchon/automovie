import {
  AutoMovieArchetypeQuadrupedEquipment,
  AutoMovieArchetypeQuadrupedLead,
  AutoMovieArchetypeRefusal,
  createCamel,
  createDeer,
  createOx,
  createQuadruped,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieCylinderShape,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AnimalEquipmentFixture as Equipment } from "../../../internal/AnimalEquipmentFixture";
import { animalEquipmentBearingObservation } from "../../../internal/animalEquipmentBearingObservation";
import { nclose } from "../../../internal/nclose";

/** An actual public non-equid producer output. */
type Animal = ReturnType<typeof createOx>;

/** Genuine builder state and its actual laid body, owned by the shared fixture. */
type Fixture = Equipment.IFixture;

/** An invalid authored assembly and the exact input a refusal must preserve. */
interface Invalid {
  /** Whole request, including a valid yoke before every failing pack. */
  params: AutoMovieArchetypeQuadrupedEquipment.IParams;
  /** Physical parameter path. */
  axis: string;
  /** Actual submitted value, including NaN. */
  value: number;
}

/**
 * Actual ox/camel equipment has physical bearing bars and atomic fit admission.
 *
 * Scenarios:
 * 1. Explicitly authored yoke, side pack and lead dimensions build admissible
 *    real ox/camel models with exactly their equipment's contacts (the ox's
 *    own roping contacts beside them); the public dispatcher preserves the
 *    camel assembly.
 * 2. Each hitch/load contact is on its actual cylinder's upper bearing surface,
 *    with +Y outward, two physical upright bars and the authored clear opening
 *    and depth. Leads describe their actual bar's midpoint and diameter.
 * 3. Actual bearings touch neck/barrel over positive axial spans and connect
 *    to the free frame. Actual triangle sections also meet without penetrating.
 *    Pad inner faces retain barrel clearance; rails touch
 *    pad tops, bridges clear the back and stay behind the neck-root footprint.
 * 4. Empty equipment is a no-op and exact fit/zero clearance remain admitted,
 *    including a narrow positive pad with thickness equal to its rail diameter.
 *    Adjacent out-of-fit requests and malformed lengths preserve actionable
 *    refusals and the real builder's complete before/after serialization,
 *    including a valid yoke planned before an invalid pack. No spy is installed.
 * 5. A bare deer's measured mass cannot silently include new lead equipment.
 *
 * All equipment dimensions and ox/camel complete masses below are authored
 * examples, not measured equipment specifications or rated load capacities.
 * Analytic primitive surfaces, physical clearance and the supplied lengths are
 * the oracles; this unit makes no rendered-fit or safe-load claim.
 */
export function test_unit_archetypes_animals_animal_equipment(): void {
  const lead: AutoMovieArchetypeQuadrupedLead.IParams = {
    width: 0.1,
    thickness: 0.01,
    leadLength: 0.6,
    leadRadius: 0.005,
  };
  const yoke: NonNullable<
    AutoMovieArchetypeQuadrupedEquipment.IParams["yoke"]
  > = {
    width: 0.6,
    radius: 0.02,
    neckAt: 0.12,
    clearance: 0.005,
    hook: { radius: 0.008, opening: 0.08, depth: 0.05 },
  };
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
  const findings: string[] = [];
  const ox: Animal = createOx({ mass: 300, lead, equipment: { yoke } }, 7);
  const camel: Animal = createCamel(
    { mass: 450, lead, equipment: { pack } },
    7,
  );
  for (const animal of [ox, camel]) {
    if (!validateModel({ model: animal }).success)
      findings.push(
        `${animal.archetype}: actual equipped model admission failed`,
      );
    // The ox keeps its own roping contacts (head, horns, hind) beside the equipment's.
    const expected: string =
      animal === ox ? "head|hind|hitch|horns|lead" : "lead|leftLoad|rightLoad";
    if (
      animal.affordances
        .map((contact: IAutoMovieAffordance): string => contact.id)
        .sort((left: string, right: string): number =>
          left.localeCompare(right),
        )
        .join("|") !== expected
    )
      findings.push(
        `${animal.archetype}: real equipment contact identities were lost`,
      );
    const original: string = JSON.stringify(animal);
    Equipment.inspectLead(animal, lead, findings);
    animal.shapes();
    if (JSON.stringify(animal) !== original)
      findings.push(`${animal.archetype}: equipment reads mutated model bytes`);
  }
  if (
    ox.parts.length !== createOx({ mass: 300 }, 7).parts.length + 9 ||
    camel.parts.length !== createCamel({ mass: 450 }, 7).parts.length + 26
  )
    findings.push(
      "seven real yoke parts, twenty-four pack parts and two lead parts were not assembled",
    );
  if (!nclose(ox.body.mass, 300) || !nclose(camel.body.mass, 450))
    findings.push("equipment silently replaced the authored whole-model mass");
  if (
    JSON.stringify(
      createQuadruped(
        { kind: "camel", mass: 450, lead, equipment: { pack } },
        7,
      ),
    ) !== JSON.stringify(camel)
  )
    findings.push("public camel dispatch dropped or changed actual equipment");
  Equipment.inspectHook(ox, "yoke-hitch", "hitch", yoke.hook, findings);
  Equipment.inspectHook(
    camel,
    "pack-left-hook",
    "leftLoad",
    pack.hook,
    findings,
  );
  Equipment.inspectHook(
    camel,
    "pack-right-hook",
    "rightLoad",
    pack.hook,
    findings,
  );
  animalEquipmentBearingObservation(ox, "yoke", yoke.radius, findings);
  animalEquipmentBearingObservation(camel, "pack", pack.railRadius, findings);

  // Clearance is observed on the actual fitted parts, not a returned plan.
  const beam: IAutoMovieModelPart = Equipment.part(ox, "yoke-beam");
  const oxTrunk: IAutoMovieModelPart = Equipment.part(ox, "trunk");
  const neck: IAutoMovieModelPart = Equipment.part(ox, "neck");
  const beamShape: IAutoMovieCylinderShape = Equipment.cylinder(beam);
  const neckShape: IAutoMovieCylinderShape = Equipment.cylinder(neck);
  if (
    !nclose(beamShape.height, 0.6) ||
    !nclose(beamShape.radius, 0.02) ||
    beam.transform!.translation.y - beamShape.radius <
      oxTrunk.transform!.translation.y +
        Equipment.radius(oxTrunk) +
        yoke.clearance -
        1e-9 ||
    Equipment.lineDistance(beam.transform!.translation, neck) <
      neckShape.radius + beamShape.radius + yoke.clearance - 1e-9
  )
    findings.push(
      "actual yoke does not preserve authored span or body clearance",
    );
  const trunk: IAutoMovieModelPart = Equipment.part(camel, "trunk");
  const neckRoot: IAutoMovieVector3 = Equipment.end(
    Equipment.part(camel, "neck"),
    -1,
  );
  for (const side of ["left", "right"] as const) {
    const pad: IAutoMovieModelPart = Equipment.part(camel, `pack-${side}-pad`);
    if (pad.geometry.type !== "primitive" || pad.geometry.shape.type !== "box")
      throw new Error("A real pack side pad must be a box");
    const size: typeof pad.geometry.shape = pad.geometry.shape;
    const rail: IAutoMovieModelPart = Equipment.part(
      camel,
      `pack-${side}-rail`,
    );
    if (
      !nclose(size.width, 0.06) ||
      !nclose(size.height, 0.2) ||
      !nclose(size.depth, 0.45) ||
      Math.abs(pad.transform!.translation.x) - size.width / 2 <
        Equipment.radius(trunk) + pack.clearance - 1e-9 ||
      pad.transform!.translation.y - size.height / 2 < -1e-9 ||
      !nclose(
        rail.transform!.translation.y - Equipment.cylinder(rail).radius,
        pad.transform!.translation.y + size.height / 2,
        1e-9,
      )
    )
      findings.push(
        `${side}: actual pad/rail dimensions, clearance or contact were lost`,
      );
  }
  for (const side of [-1, 1] as const) {
    const bridge: IAutoMovieModelPart = Equipment.part(
      camel,
      `pack-bridge-${side}`,
    );
    if (
      bridge.transform!.translation.y - Equipment.cylinder(bridge).radius <
        trunk.transform!.translation.y +
          Equipment.radius(trunk) +
          pack.clearance -
          1e-9 ||
      bridge.transform!.translation.z + Equipment.cylinder(bridge).radius >
        neckRoot.z -
          Equipment.cylinder(Equipment.part(camel, "neck")).radius +
          1e-9
    )
      findings.push(`bridge ${side}: actual back or neck clearance was lost`);
  }

  // Builders are observed through build(), including their complete real contacts.
  const empty: Fixture = Equipment.create();
  const beforeEmpty: string = JSON.stringify(empty.builder.build(300));
  AutoMovieArchetypeQuadrupedEquipment.lay(
    empty.builder,
    empty.rig,
    {},
    "equipment-fixture",
  );
  if (JSON.stringify(empty.builder.build(300)) !== beforeEmpty)
    findings.push("empty equipment changed the actual body builder");
  const exact: Fixture = Equipment.create();
  const bound: number =
    Math.min(exact.rig.trunk, 2 * (exact.rig.neck.z - exact.rig.neckRadius)) -
    2 * pack.railRadius;
  const neckLength: number = Math.hypot(
    exact.rig.poll.x - exact.rig.neck.x,
    exact.rig.poll.y - exact.rig.neck.y,
    exact.rig.poll.z - exact.rig.neck.z,
  );
  const beamMinimum: number = 2 * (exact.rig.neckRadius + yoke.radius);
  AutoMovieArchetypeQuadrupedEquipment.lay(
    exact.builder,
    exact.rig,
    {
      yoke: { ...yoke, width: beamMinimum, clearance: 0 },
      pack: { ...pack, length: bound, clearance: 0 },
    },
    "equipment-fixture",
  );
  const exactModel: Animal = exact.builder.build(300);
  animalEquipmentBearingObservation(exactModel, "yoke", yoke.radius, findings);
  animalEquipmentBearingObservation(
    exactModel,
    "pack",
    pack.railRadius,
    findings,
  );
  const frontBridge: IAutoMovieModelPart = Equipment.part(
    exactModel,
    "pack-bridge-1",
  );
  const exactNeck: IAutoMovieModelPart = Equipment.part(exactModel, "neck");
  const exactBeam: IAutoMovieModelPart = Equipment.part(
    exactModel,
    "yoke-beam",
  );
  if (
    !validateModel({ model: exactModel }).success ||
    !nclose(
      frontBridge.transform!.translation.z +
        Equipment.cylinder(frontBridge).radius,
      Equipment.end(exactNeck, -1).z - Equipment.cylinder(exactNeck).radius,
      1e-9,
    ) ||
    !nclose(
      Equipment.cylinder(exactBeam).height / 2 -
        Equipment.cylinder(exactBeam).radius,
      Equipment.cylinder(exactNeck).radius,
      1e-9,
    )
  )
    findings.push("exact span and zero-clearance equipment did not admit");
  const narrow: Fixture = Equipment.create();
  AutoMovieArchetypeQuadrupedEquipment.lay(
    narrow.builder,
    narrow.rig,
    {
      pack: {
        ...pack,
        width: pack.railRadius,
        thickness: 2 * pack.railRadius,
        clearance: 0,
      },
    },
    "equipment-fixture",
  );
  const narrowModel: Animal = narrow.builder.build(300);
  animalEquipmentBearingObservation(
    narrowModel,
    "pack",
    pack.railRadius,
    findings,
  );
  if (!validateModel({ model: narrowModel }).success)
    findings.push(
      "narrow positive zero-clearance pack lost its actual body path",
    );
  const invalid: Invalid[] = [
    { params: { yoke: { ...yoke, radius: 0 } }, axis: "yoke.radius", value: 0 },
    {
      params: { yoke: { ...yoke, neckAt: -1 } },
      axis: "yoke.neckAt",
      value: -1,
    },
    {
      params: { yoke: { ...yoke, clearance: -0.01 } },
      axis: "yoke.clearance",
      value: -0.01,
    },
    {
      params: { yoke: { ...yoke, width: beamMinimum - 1e-8, clearance: 0 } },
      axis: "yoke.width",
      value: beamMinimum - 1e-8,
    },
    {
      params: { yoke: { ...yoke, neckAt: neckLength + 1e-8 } },
      axis: "yoke.neckAt",
      value: neckLength + 1e-8,
    },
    {
      params: { yoke: { ...yoke, neckAt: 0.001 } },
      axis: "yoke.neckAt",
      value: 0.001,
    },
    {
      params: { yoke: { ...yoke, hook: { ...yoke.hook, radius: 0.021 } } },
      axis: "yoke.hook.radius",
      value: 0.021,
    },
    {
      params: { yoke: { ...yoke, hook: { ...yoke.hook, opening: 0 } } },
      axis: "yoke.hook.opening",
      value: 0,
    },
  ];
  for (const [key, value] of [
    ["width", 0],
    ["thickness", -0.01],
    ["length", bound + 1e-8],
    ["width", 2 * exact.rig.barrel + 1e-8],
    ["railRadius", 0.031],
  ] as const)
    invalid.push({
      params: { yoke, pack: { ...pack, [key]: value } },
      axis: `pack.${key}`,
      value,
    });
  for (const [key, value] of [
    ["radius", -0.01],
    ["radius", 0.021],
    ["opening", pack.length - 4 * pack.hook.radius + 1e-8],
    ["depth", 0],
  ] as const)
    invalid.push({
      params: { yoke, pack: { ...pack, hook: { ...pack.hook, [key]: value } } },
      axis: `pack.hook.${key}`,
      value,
    });
  for (const request of invalid) {
    const actual: Fixture = Equipment.create();
    const before: string = JSON.stringify(actual.builder.build(300));
    try {
      AutoMovieArchetypeQuadrupedEquipment.lay(
        actual.builder,
        actual.rig,
        request.params,
        "equipment-fixture",
      );
      findings.push(
        `${request.axis}/${request.value}: invalid authored equipment admitted`,
      );
    } catch (error) {
      if (
        !(error instanceof AutoMovieArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.archetype !== "equipment-fixture" ||
        error.axis !== request.axis ||
        !Object.is(error.value, request.value) ||
        error.reason.length === 0 ||
        error.fix.length === 0
      )
        findings.push(
          `${request.axis}/${request.value}: actionable actual-input refusal was lost`,
        );
    }
    if (JSON.stringify(actual.builder.build(300)) !== before)
      findings.push(
        `${request.axis}/${request.value}: a failed batch partially appended equipment`,
      );
  }
  for (const [key, value] of [
    ["width", 0],
    ["width", neckLength + 1e-8],
    ["thickness", -0.01],
  ] as const) {
    const actual: Fixture = Equipment.create();
    const before: string = JSON.stringify(actual.builder.build(300));
    try {
      AutoMovieArchetypeQuadrupedLead(
        actual.builder,
        actual.rig,
        "lead",
        { ...lead, [key]: value },
        "equipment-fixture",
      );
      findings.push(`collar.${key}/${value}: invalid lead admitted`);
    } catch (error) {
      if (
        !(error instanceof AutoMovieArchetypeRefusal) ||
        error.kind !== "parameter" ||
        error.archetype !== "equipment-fixture" ||
        error.axis !== `collar.${key}` ||
        !Object.is(error.value, value) ||
        error.reason.length === 0 ||
        error.fix.length === 0
      )
        findings.push(
          `collar.${key}/${value}: actionable actual-input refusal was lost`,
        );
    }
    if (JSON.stringify(actual.builder.build(300)) !== before)
      findings.push(
        `collar.${key}/${value}: an invalid lead partially changed the actual builder`,
      );
  }
  try {
    createDeer({ lead }, 7);
    findings.push(
      "bare measured deer mass silently included authored lead equipment",
    );
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.axis !== "mass" ||
      error.archetype !== "deer"
    )
      findings.push("deer lead mass failure lost its physical ownership");
  }
  if (!validateModel({ model: createDeer({ mass: 65, lead }, 7) }).success)
    findings.push("explicit complete deer/lead mass did not admit");
  TestValidator.equals("real authored animal equipment", findings, []);
}
