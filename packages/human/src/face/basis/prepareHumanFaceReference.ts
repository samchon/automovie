import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import type {
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
} from "../../index";
import { buildHumanFaceOpticalAssembly } from "../anatomy/eye/buildHumanFaceOpticalAssembly";
import { seatHumanFaceLidCage } from "../anatomy/eye/seatHumanFaceLidCage";
import type { IHumanFaceOpticalAssembly as IHumanFaceOpticalAssemblyImported } from "../anatomy/eye/structures/IHumanFaceOpticalAssembly";
import { applyHumanFaceNasolabialRelief } from "../anatomy/skin/applyHumanFaceNasolabialRelief";
import { applyHumanFaceRegionalRelief } from "../anatomy/skin/applyHumanFaceRegionalRelief";
import { humanFaceSkinReliefIdentity } from "../anatomy/skin/humanFaceSkinReliefIdentity";
import type { IAutoMovieHumanFacePeriocularCage as IAutoMovieHumanFacePeriocularCageImported } from "../structures/IAutoMovieHumanFacePeriocularCage";
import type { IHumanFaceNativePose as IHumanFaceNativePoseImported } from "./IHumanFaceNativePose";
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
 * @evidence contracts/common.md#principled-implementation The current native identity pose supplies shaped surfaces and actual optics; registered lid cages seat that rest before a copied material reference is captured. Completion applies persistent relief to candidates, replays source refinements, then commits only after every replay and progress callback succeeds. Initial lid seating can already mutate the caller-owned shaped state before a later failure.
 * @evidence contracts/common.md#clear-and-simple-design Immediate optical/cage preparation and lazy complete isolate the pre-relief material reference from the final geometric reference; the pose evaluator requests completion only when that geometry is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing cage registration or relief reference refuses, and observer exceptions propagate. Successful completion alone is memoized; a failed completion may retry without applying a committed relief twice, but preparation is not an atomic rollback of earlier lid seating.
 * @evidence contracts/common.md#meaningful-documentation Returned shaped state is stage-owned and mutable, materialReference is a copied pre-relief snapshot, complete returns the committed replay reference or undefined for absent shaped geometry, and neither is a visual certificate.
 * @evidence contracts/performance.md#efficient-algorithms Preparation pays native pose and optical/cage work plus copied surface coordinates. First completion adds actual relief and per-surface refinement replay; replay includes native parent scans, so its cost is not merely the count of appended samples.
 * @evidence contracts/performance.md#reuse-equivalent-work One successful complete caches its result within this fixed identity stage; material reference is captured once before relief. New geometry/identity inputs create a new owner, and effectful failed work is not reported as completed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stage retains shaped buffers, optics, material snapshots and at most one completed reference, each proportional to the actual source population. Candidate/replay maps are local until commit; no worker or GPU resource is acquired.
 */
export function prepareHumanFaceReference(
  input: IHumanFaceReferencePreparationInput,
): IHumanFaceReferencePreparation {
  const { basis, state, geometry }: IHumanFaceReferencePreparationInput = input;
  const native: IHumanFaceNativePoseImported =
    input.native ??
    createHumanFaceNativePose(basis)(state, geometry, input.progress);
  const shaped:
    | {
        surfaces: number[][];
        landmarks: Record<string, IAutoMovieVector3Imported>;
      }
    | undefined = native.shaped;
  const optics: IHumanFaceOpticalAssemblyImported[] | undefined =
    geometry?.eyes === undefined
      ? undefined
      : buildHumanFaceOpticalAssembly(
          basis,
          state,
          geometry.eyes,
          input.progress,
        );
  for (const eye of optics ?? []) {
    const cage: IAutoMovieHumanFacePeriocularCageImported | undefined =
      basis.periocular?.[eye.side].cage;
    if (cage === undefined || shaped === undefined) continue;
    assertHumanFacePeriocularCage(basis, cage);
    const host: number = basis.surfaces.findIndex(
      (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
        surface.id === cage.surface,
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
  let completed: boolean = false;
  let reference: Map<string, number[]> | undefined;
  const materialReference: Map<string, number[]> | undefined =
    shaped === undefined
      ? undefined
      : new Map(
          basis.surfaces.map(
            (
              surface: IAutoMovieHumanFaceBasisSurfaceImported,
              at: number,
            ): [string, number[]] => [surface.id, [...shaped.surfaces[at]]],
          ),
        );
  return {
    optics,
    shaped,
    materialReference,
    complete: (): Map<string, number[]> | undefined => {
      if (completed) return reference;
      if (shaped !== undefined) {
        let candidate: number[][] = shaped.surfaces;
        if (geometry?.skinRelief !== undefined) {
          if (materialReference === undefined)
            throw new Error(
              "Skin relief needs its same shape-only material reference.",
            );
          const shapeChannels: Set<string> = new Set(
            basis.channels
              .filter(
                (channel: IAutoMovieHumanFaceBasisChannelImported): boolean =>
                  channel.kind === "shape",
              )
              .map(
                (channel: IAutoMovieHumanFaceBasisChannelImported): string =>
                  channel.id,
              ),
          );
          const relieved: ReadonlyMap<string, readonly number[]> =
            applyHumanFaceRegionalRelief(
              basis,
              applyHumanFaceNasolabialRelief(
                basis,
                new Map(
                  basis.surfaces.map(
                    (
                      surface: IAutoMovieHumanFaceBasisSurfaceImported,
                      at: number,
                    ): [string, number[]] => [surface.id, shaped.surfaces[at]],
                  ),
                ),
                new Map(
                  [...state.weights].filter(([id]: [string, number]): boolean =>
                    shapeChannels.has(id),
                  ),
                ),
                geometry.skinRelief,
                materialReference,
              ),
              humanFaceSkinReliefIdentity(geometry.skinRelief),
              materialReference,
            );
          candidate = basis.surfaces.map(
            (surface: IAutoMovieHumanFaceBasisSurfaceImported): number[] => [
              ...relieved.get(surface.id)!,
            ],
          );
          input.progress?.("reference:identity-relief");
        }
        const replayed: Map<string, number[]> = new Map(
          basis.surfaces.map(
            (
              surface: IAutoMovieHumanFaceBasisSurfaceImported,
              at: number,
            ): readonly [string, number[]] => {
              const positions: number[] = replayHumanFaceSourceRefinements(
                surface.sourcePosePlan,
                candidate[at],
              );
              input.progress?.("reference:replay:" + surface.id);
              return [surface.id, positions] as const;
            },
          ),
        );
        input.progress?.("reference:computed");
        // A failed replay leaves the exposed native shape unchanged, so a
        // later completion cannot apply persistent relief to it a second time.
        candidate.forEach((positions: number[], at: number): void => {
          shaped.surfaces[at] = positions;
        });
        reference = replayed;
      }
      completed = true;
      return reference;
    },
  };
}
