import {
  AutoMovieArchetypeQuadrupedEquipment,
  AutoMovieArchetypeRefusal,
  createCamel,
  createDeer,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { AnimalEquipmentFixture } from "../internal/AnimalEquipmentFixture";
import { nclose } from "../internal/nclose";

/**
 * Physical gear admission precedes a free whole-reference draw.
 *
 * Scenarios:
 * 1. The same 1.15 m collar request refuses identically without a fixed camel
 *    reference for no seed and 32 seeds. Diop Table II neck means 1.025..1.179 m
 *    cannot all admit it, so random reference choice cannot decide success.
 * 2. Explicit Maur5 admits that collar on its 1.179 m neck. Explicit Maur1
 *    refuses it with its actual 1.108 m limit; no smaller cohort is silently drawn.
 * 3. A deer 0.27 m collar fits the authored male neck (.34×.836 m), but not the
 *    female (.34×.740 m). The unfixed adult palette always refuses; fixed male
 *    or an explicit male-only antler request admits its actual complete mass.
 * 4. A prepared pack emits into two actual equivalent bodies independently;
 *    mutating one returned contact cannot change the other or a later emission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the independent physical length inequalities, fixed/unfixed selection cases, complete authored mass and plan reuse mutation boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes actual public producers across seed variants and real prepared equipment emission, reads actual collar/contact geometry and requires structured physical refusals rather than arbitrary exceptions.
 * @evidence contracts/development/testing.md#independent-expectations Camel neck lengths are primary TableII literals; deer neck lengths follow the explicitly authored .34height construction. A reference-free gear request must fit the complete permitted palette before seed choice, while a fixed reference needs only its own actual fit. Independent outputs must not share mutable contact frames.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts default versus fixed selection, seedless versus seeded calls, accepted/rejected adjacent physical references, a conditioned male-only palette and shared prepared-plan emissions; ordinary small gear and all whole-row geometry belong to the adjacent cohort unit.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous scenario owns bounded32-seed loops and genuine in-memory builders/models. It starts no host/compiler/renderer and replaces no foreign method.
 */
export function test_archetype_animal_cohort_equipment(): void {
  const findings: string[] = [];
  const lead: NonNullable<createCamel.IParams["lead"]> = {
    width: 1.15,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };
  let first: string | undefined;
  for (const seed of [
    undefined,
    ...Array.from({ length: 32 }, (_: unknown, index: number): number => index),
  ]) {
    const error: AutoMovieArchetypeRefusal | undefined = rejected(
      `free camel/${seed}`,
      (): unknown => createCamel({ mass: 450, lead }, seed),
    );
    if (error === undefined) continue;
    if (
      error.axis !== "collar.width" ||
      typeof error.value !== "number" ||
      !nclose(error.value, 1.15) ||
      error.feasible !== null
    )
      findings.push(
        `free camel/${seed}: incorrect complete-palette refusal facts`,
      );
    const observed: string = JSON.stringify({
      kind: error.kind,
      axis: error.axis,
      value: error.value,
      feasible: error.feasible,
      reason: error.reason,
      fix: error.fix,
    });
    if (first === undefined) first = observed;
    else if (observed !== first)
      findings.push(`free camel/${seed}: physical refusal depended on seed`);
  }
  const admitted: ReturnType<typeof createCamel> = createCamel(
    { mass: 450, cohort: "maur5", lead },
    73,
  );
  const collar: (typeof admitted.parts)[number] | undefined =
    admitted.parts.find(
      (part: (typeof admitted.parts)[number]): boolean => part.id === "collar",
    );
  if (
    !validateModel({ model: admitted }).success ||
    admitted.provenance.models.cohort !== "maur5" ||
    collar?.geometry.type !== "primitive" ||
    collar.geometry.shape.type !== "cylinder" ||
    !nclose(collar.geometry.shape.height, 1.15, 1e-9)
  )
    findings.push("fixed Maur5 did not emit its admitted actual collar");
  const narrow: AutoMovieArchetypeRefusal | undefined = rejected(
    "fixed Maur1",
    (): unknown => createCamel({ mass: 450, cohort: "maur1", lead }, 73),
  );
  if (
    narrow?.feasible?.kind !== "range" ||
    narrow.feasible.maximum === null ||
    !nclose(narrow.feasible.maximum, 1.108, 1e-9)
  )
    findings.push("fixed Maur1 lost its actual1.108m neck limit");

  const deerLead: NonNullable<createDeer.IParams["lead"]> = {
    ...lead,
    width: 0.27,
  };
  for (const seed of [undefined, 0, 1, 2, 3, 73]) {
    const error: AutoMovieArchetypeRefusal | undefined = rejected(
      `free deer/${seed}`,
      (): unknown => createDeer({ mass: 65, lead: deerLead }, seed),
    );
    if (error?.axis !== "collar.width" || error.feasible !== null)
      findings.push(
        `free deer/${seed}: lost its complete-palette collar refusal`,
      );
  }
  for (const params of [
    { cohort: "boso-adult-male", mass: 65, lead: deerLead },
    { antlers: true, mass: 65, lead: deerLead },
  ] satisfies readonly createDeer.IParams[])
    if (!validateModel({ model: createDeer(params, 73) }).success)
      findings.push(
        "an explicitly male permitted palette lost its actual collar fit",
      );
  rejected("fixed female collar", (): unknown =>
    createDeer({ cohort: "boso-adult-female", mass: 43, lead: deerLead }, 73),
  );

  const firstBody: ReturnType<typeof AnimalEquipmentFixture.create> =
    AnimalEquipmentFixture.create();
  const secondBody: ReturnType<typeof AnimalEquipmentFixture.create> =
    AnimalEquipmentFixture.create();
  const thirdBody: ReturnType<typeof AnimalEquipmentFixture.create> =
    AnimalEquipmentFixture.create();
  const plan: ReturnType<typeof AutoMovieArchetypeQuadrupedEquipment.prepare> =
    AutoMovieArchetypeQuadrupedEquipment.prepare(
      firstBody.rig,
      {
        pack: {
          length: 0.45,
          width: 0.2,
          thickness: 0.06,
          railRadius: 0.02,
          clearance: 0.01,
          hook: { radius: 0.008, opening: 0.1, depth: 0.05 },
        },
      },
      "ox",
    );
  plan.emit(firstBody.builder);
  plan.emit(secondBody.builder);
  const model: ReturnType<typeof firstBody.builder.build> =
    firstBody.builder.build(300);
  const other: ReturnType<typeof secondBody.builder.build> =
    secondBody.builder.build(300);
  const original: string = JSON.stringify(other);
  model.affordance("leftLoad").frame.translation.y += 5;
  if (JSON.stringify(other) !== original)
    findings.push("prepared equipment emissions share a contact frame");
  plan.emit(thirdBody.builder);
  if (JSON.stringify(thirdBody.builder.build(300)) !== original)
    findings.push(
      "a returned contact mutation changed the retained equipment plan",
    );
  TestValidator.equals(
    "seed-independent actual equipment preflight",
    findings,
    [],
  );

  /** Only an actual structured physical parameter refusal satisfies a negative case. */
  function rejected(
    label: string,
    run: () => unknown,
  ): AutoMovieArchetypeRefusal | undefined {
    try {
      run();
      findings.push(`${label}: unexpectedly accepted`);
    } catch (error) {
      if (
        error instanceof AutoMovieArchetypeRefusal &&
        error.kind === "parameter"
      )
        return error;
      findings.push(`${label}: wrong refusal ${String(error)}`);
    }
    return undefined;
  }
}
