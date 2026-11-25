import {
  AutoMovieArchetypeEquineEarProfiles,
  createQuadruped,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { EquineEarAdmission } from "../../internal/EquineEarAdmission";
import { EquineEarMass } from "../../internal/EquineEarMass";
import { EquineEarObservation as Ear } from "../../internal/EquineEarObservation";

/**
 * Real equid pinnae preserve donor L/W, head connection and independent carriage.
 *
 * Scenarios:
 * 1. Donkey and both mule body sexes, all four tacks and 200 seeds each,
 *    emit two actual positive boxes with independently transcribed donor L/W
 *    ratios. The existing body height/girth/head/mass and tack policies remain.
 * 2. Repeated builds preserve bytes and caller inputs. A separately mutated
 *    ear cannot alter another model, the next build or its source profile.
 * 3. The actual base rectangle's four corners lie inside the real head capsule.
 *    Complete base-to-tip box length and breadth equal the published-reference
 *    transfer; a detached, zero-length, isotropic rod or resized head fails.
 * 4. Real AR walks with an explicitly authored 10-degree nod carry all eight
 *    plate corners in the actual head frame at independent times, and reordered
 *    seeking returns the same actual sample.
 * 5. Genuine builder observation proves malformed dimensions, nonfinite/zero
 *    direction and oversized complete roots refuse before either ear is added.
 * 6. Actual harness-body COM preserves the independently restated Kubo segment
 *    totals. Real head/ear fracture pieces expose positive actual plate masses
 *    proportional to their true volumes and preserve the complete head budget,
 *    both with source weights and the existing uniform-volume default.
 * 7. Horse and pony pinnae carry Krebs et al. 2021's pooled Campolina ear
 *    length over withers height (Table 1, 84 males and 131 females).
 *
 * Independent donor literals: Patel2025 Halari Table2 p326 male n28,
 * h108.04/L28.64/W10.64cm. Salamanca2020 TableS1 pp6-7 gives seven male
 * mule rows with sums h855.4/L134.5/W68cm and eight female rows with sums
 * h1001.2/L159.8/W77.5cm. These are distinct from current Veracruz donkey
 * and Vel찼squez2020 mule bodies. No SD, individual allometry or population band
 * is inferred. Thickness W/10, rectangular outline and diagonal neutral pose
 * are explicitly authored primitives, never measured ear tissue or angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines primary/cohort limitations, all 200-seed/tack cases, actual pinna/body/solid-frame observations, source independence, genuine geometry refusals and authored dimensions versus anatomy.
 * @evidence contracts/development/testing.md#behavioral-verification Constructs actual public equids and observes real positive pinnae, body invariants, source-root corners, ride samples and the actual whole-body COM under original segment weights. The public head assembler's real fracture pieces expose positive per-part masses and complete-head conservation. Genuine builders expose profile/weight refusal without patched methods, private mass records or fake models.
 * @evidence contracts/development/testing.md#independent-expectations Donor literals and sums come from the original tables, never producer constants. Actual quaternion-transformed box corners and elementary finite-axis capsule distance are root/carriage oracles. Independent Kubo percentages normalized by their printed 100.4 sum and actual analytic solid volumes predict integrated COM and positive head/ear masses; fracture calibration is explicitly authored for observation, not biological. No production attachment/mass calculator supplies an expected answer.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three donor/body combinations across four tacks and 200 seeds, bilateral dimensional plates versus missing/round ears, real physical bases versus detached decoration, both mule sexes, input/output aliasing, nonfinite/zero versus positive dimensions, complete-root overflow and chronological versus reordered seeking.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous portable discoverable scenario owns bounded in-memory builders/models and AR kinematic rides. It invokes no Human/Motion action law, process, renderer, compiler, hardware-dependent wall-clock assertion or foreign implementation replacement; the lead's ordinary execution log owns elapsed measurement.
 */
export function test_archetype_animal_equine_ears(): void {
  const findings: string[] = [];
  const rows: readonly Ear.ICase[] = [
    {
      params: { kind: "donkey" },
      length: 28.64 / 108.04,
      width: 10.64 / 108.04,
      height: null,
      girth: null,
      mass: null,
    },
    {
      params: { kind: "mule", sex: "female" },
      length: 159.8 / 1001.2,
      width: 77.5 / 1001.2,
      height: 1.304,
      girth: 1.4785,
      mass: 275.36,
    },
    {
      params: { kind: "mule", sex: "male" },
      length: 134.5 / 855.4,
      width: 68 / 855.4,
      height: 1.3528,
      girth: 1.5258,
      mass: 298.88,
    },
  ];
  const beforeDonor: string = JSON.stringify([
    AutoMovieArchetypeEquineEarProfiles.DONKEY,
    AutoMovieArchetypeEquineEarProfiles.MULES,
  ]);
  for (const row of rows)
    for (const tack of ["saddle", "harness", "both", "pack"] as const) {
      const params: createQuadruped.IParams = { ...row.params, tack };
      const beforeParams: string = JSON.stringify(params);
      for (let seed: number = 0; seed < 200; seed++) {
        const label: string = `${params.kind}/${"sex" in params ? params.sex : "reference"}/${tack}/${seed}`;
        try {
          const model: Ear.Model = createQuadruped(params, seed);
          const before: string = JSON.stringify(model);
          const again: Ear.Model = createQuadruped(params, seed);
          if (JSON.stringify(again) !== before)
            findings.push(`${label}: same seed changed actual bytes`);
          Ear.observe(model, row, tack, label, findings);
          if (seed === 0) {
            const ear: IAutoMovieModelPart = Ear.part(again, "leftEar");
            ear.transform!.translation.y += 1;
            if (
              JSON.stringify(model) !== before ||
              JSON.stringify(createQuadruped(params, seed)) !== before
            )
              findings.push(
                `${label}: independent builds share actual ear records`,
              );
            Ear.carriage(model, label, findings);
            if (tack === "harness") EquineEarMass.body(model, label, findings);
          }
          if (JSON.stringify(model) !== before)
            findings.push(`${label}: observation changed the source equid`);
        } catch (error) {
          findings.push(
            `${label}: actual construction/observation failed: ${String(error)}`,
          );
        }
        if (JSON.stringify(params) !== beforeParams)
          findings.push(`${label}: construction mutated caller params`);
      }
    }
  try {
    EquineEarAdmission.verify(findings);
  } catch (error) {
    findings.push(`Actual ear-seam baseline failed: ${String(error)}`);
  }
  try {
    EquineEarMass.fragments(findings);
  } catch (error) {
    findings.push(`Actual physical head/ear masses failed: ${String(error)}`);
  }
  // Krebs et al. 2021 Table 1: Campolina ear length 0.180/0.183 m at withers 1.566/1.533 m over 84 males and 131 females, pooled by count.
  const horseRatio: number =
    (84 * 0.18 + 131 * 0.183) / (84 * 1.566 + 131 * 1.533);
  for (const kind of ["horse", "pony"] as const) {
    const model: Ear.Model = createQuadruped({ kind }, 7);
    for (const id of ["leftEar", "rightEar"] as const) {
      const ear: IAutoMovieModelPart | undefined = model.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === id,
      );
      const length: number =
        ear?.geometry.type === "primitive" && ear.geometry.shape.type === "box"
          ? ear.geometry.shape.height
          : NaN;
      if (
        !(
          Math.abs(length / model.dimensions.withersHeight! - horseRatio) <=
          1e-12
        )
      )
        findings.push(
          `${kind}: the ${id} does not carry the Krebs 2021 ear-length ratio`,
        );
    }
  }
  if (
    JSON.stringify([
      AutoMovieArchetypeEquineEarProfiles.DONKEY,
      AutoMovieArchetypeEquineEarProfiles.MULES,
    ]) !== beforeDonor
  )
    findings.push("Actual construction changed primary donor data");
  TestValidator.equals(
    "actual referenced equid ears and head attachment",
    findings,
    [],
  );
}
