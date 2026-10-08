import { buildHumanFaceOpticalAssembly } from "../anatomy/eye/buildHumanFaceOpticalAssembly";
import { seatHumanFaceLidCage } from "../anatomy/eye/seatHumanFaceLidCage";
import { applyHumanFaceNasolabialRelief } from "../anatomy/skin/applyHumanFaceNasolabialRelief";
import { applyHumanFaceRegionalRelief } from "../anatomy/skin/applyHumanFaceRegionalRelief";
import { humanFaceSkinReliefIdentity } from "../anatomy/skin/humanFaceSkinReliefIdentity";
import type { IHumanFaceReferencePreparation } from "./IHumanFaceReferencePreparation";
import type { IHumanFaceReferencePreparationInput } from "./IHumanFaceReferencePreparationInput";
import { assertHumanFacePeriocularCage } from "./assertHumanFacePeriocularCage";
import { createHumanFaceNativePose } from "./createHumanFaceNativePose";
import { replayHumanFaceSourceRefinements } from "./replayHumanFaceSourceRefinements";

/**
 * Prepare the one shape-only skin reference shared by normal assembly and
 * source attachment compilation. Independent optics and rest lid seating
 * happen first. The intermediate shape remains available to oral assembly;
 * `complete` then applies persistent relief and final source replay once.
 * That staging preserves assembly order without a second preparation recipe.
 * Completion commits the relieved shape only after every source replay
 * succeeds; a failed completion can be retried without applying relief twice.
 *
 * A supplied native stage is caller-owned and its shape arrays are modified
 * at the same stages as normal assembly. Otherwise the existing native owner
 * evaluates the unchanged numerical geometry inputs. This source stage emits
 * no generated tissue and makes no whole-model admission claim.
 * An optional observer reports only completed owners. Its exceptions propagate;
 * completion callbacks run before the retained reference is committed, so a
 * failed completion never retains a partially observed reference.
 *
 * @evidence contracts/common.md#principled-implementation Reuses native identity, exact optical support, lid seating, persistent relief and source replay in their existing canonical order.
 * @evidence contracts/common.md#clear-and-simple-design One preparation owner exposes the intermediate shape and one memoized completion boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source compilation and normal assembly call the same preparation rather than substituting a neutral fixture or altered geometry record.
 * @evidence contracts/common.md#meaningful-documentation States ownership, staging, units and the generated-assembly boundary.
 * @evidence contracts/modeling.md#spatial-conventions Every returned coordinate remains canonical head-frame metres; the optical owner supplies the same rest exterior.
 * @evidence contracts/modeling.md#shared-boundaries Tissue attachment and source coverage read the same seated and replayed skin reference.
 * @evidenceExclude contracts/anatomy.md#anatomical-source All anatomical qualifications stay with the called identity, optics and skin owners.
 * @evidenceExclude contracts/anatomy.md#permitted-range This orchestration adds no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes existing numerical inputs and adds no shaping control.
 */
export function prepareHumanFaceReference(
  input: IHumanFaceReferencePreparationInput,
): IHumanFaceReferencePreparation {
  const { basis, state, geometry } = input;
  const native =
    input.native ?? createHumanFaceNativePose(basis)(state, geometry, input.progress);
  const shaped = native.shaped;
  const optics =
    geometry?.eyes === undefined
      ? undefined
      : buildHumanFaceOpticalAssembly(basis, state, geometry.eyes, input.progress);
  for (const eye of optics ?? []) {
    const cage = basis.periocular?.[eye.side].cage;
    if (cage === undefined || shaped === undefined) continue;
    assertHumanFacePeriocularCage(basis, cage);
    const host = basis.surfaces.findIndex(
      (surface) => surface.id === cage.surface,
    );
    shaped.surfaces[host] = seatHumanFaceLidCage(
      cage,
      basis.surfaces[host].sourcePartition!.samples,
      shaped.surfaces[host],
      eye.exterior.rest,
      basis.surfaces[host].indices,
    );
    input.progress?.("reference:lid-seat:" + eye.side + ":" + cage.surface);
  }
  let completed = false;
  let reference: Map<string, number[]> | undefined;
  const materialReference = shaped === undefined ? undefined : new Map(
    basis.surfaces.map((surface, at) => [surface.id, [...shaped.surfaces[at]]]),
  );
  return {
    optics,
    shaped,
    materialReference,
    complete: () => {
      if (completed) return reference;
      if (shaped !== undefined) {
        let candidate = shaped.surfaces;
        if (geometry?.skinRelief !== undefined) {
          if (materialReference === undefined)
            throw new Error("Skin relief needs its same shape-only material reference.");
          const shapeChannels = new Set(
            basis.channels
              .filter((channel) => channel.kind === "shape")
              .map((channel) => channel.id),
          );
          const relieved = applyHumanFaceRegionalRelief(
            basis,
            applyHumanFaceNasolabialRelief(
              basis,
              new Map(
                basis.surfaces.map((surface, at) => [
                  surface.id,
                  shaped.surfaces[at],
                ]),
              ),
              new Map(
                [...state.weights].filter(([id]) => shapeChannels.has(id)),
              ),
              geometry.skinRelief,
              materialReference,
            ),
            humanFaceSkinReliefIdentity(geometry.skinRelief),
            materialReference,
          );
          candidate = basis.surfaces.map((surface) => [
            ...relieved.get(surface.id)!,
          ]);
          input.progress?.("reference:identity-relief");
        }
        const replayed = new Map(
          basis.surfaces.map((surface, at) => {
            const positions = replayHumanFaceSourceRefinements(
              surface.sourcePosePlan,
              candidate[at],
            );
            input.progress?.("reference:replay:" + surface.id);
            return [surface.id, positions] as const;
          }),
        );
        input.progress?.("reference:computed");
        // A failed replay leaves the exposed native shape unchanged, so a
        // later completion cannot apply persistent relief to it a second time.
        candidate.forEach((positions, at) => {
          shaped.surfaces[at] = positions;
        });
        reference = replayed;
      }
      completed = true;
      return reference;
    },
  };
}
