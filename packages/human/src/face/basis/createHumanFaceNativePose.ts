import type { IAutoMovieVector3 } from "@automovie/interface";

import { applyHumanFaceEyelidPhenotypes } from "../anatomy/eye/applyHumanFaceEyelidPhenotypes";
import { applyHumanFaceLidSections } from "../anatomy/eye/applyHumanFaceLidSections";
import { applyHumanFaceOralIdentity } from "../anatomy/oral/applyHumanFaceOralIdentity";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceNativePose } from "./IHumanFaceNativePose";
import type { IHumanFacePoseGeometry } from "./IHumanFacePoseGeometry";
import { createHumanFaceClosureGain } from "./createHumanFaceClosureGain";
import { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";
import { measureHumanFaceClosureRatio } from "./measureHumanFaceClosureRatio";
import type { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { replayHumanFaceSourceRefinements } from "./replayHumanFaceSourceRefinements";
import { resolveHumanFaceApertureUp } from "./resolveHumanFaceApertureUp";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";
import type { IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported, IAutoMovieHumanFaceBasisContact as IAutoMovieHumanFaceBasisContactImported, IAutoMovieHumanFaceRigidMotion as IAutoMovieHumanFaceRigidMotionImported, IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported, IAutoMovieHumanFaceOral as IAutoMovieHumanFaceOralImported } from "../../index";
import type { IHumanFaceClosureGain as IHumanFaceClosureGainImported } from "./IHumanFaceClosureGain";


/**
 * Evaluate the native source rest identity, rigid motion and closure companion.
 * Numerical lid and oral identity change their actual shared rest arrays before
 * the one source articulation/refinement owner. Shape-only reference omits oral
 * transient performance. Closure needs the lip aperture and source opening
 * direction, so no absent incisor is read merely to construct this stage.
 * A zero closure request reads the same central ratio without solving the
 * unrequested closure-one margin field. Nonzero requests retain that field.
 * Optional progress reports completed owners and propagates observer failures.
 * The final evaluator owns source-span blending, assembly/contact and normals.
 *
 * @evidence contracts/common.md#principled-implementation Sparse rest sums, admitted identity-only joint landmarks and registered attachments produce one native pose. Lid/oral identity modifies owned rest arrays before articulation; shape-only references filter weights and activations and omit oral performance. Closure is applied once with actual aperture gains before source refinement replay.
 * @evidence contracts/common.md#clear-and-simple-design The native owner separates source deformation/articulation/refinement from generated assemblies, source-span blending, contact and final normals owned by the outer evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero closure request reads its central ratio without solving an unused full field; nonzero requests retain actual gain admission. Shape references deliberately omit expression/performance rather than use a mismatched posed reference, and authored transforms prove no clinical muscle mechanics.
 * @evidence contracts/common.md#meaningful-documentation Prose gives shared-rest identity order, shape-only omission, lip-only ratio dependency, zero/nonzero closure behavior, optional progress failures and downstream responsibilities.
 * @evidence contracts/performance.md#efficient-algorithms Costs include full rest copies plus visited sparse rows, optional repeated shape-only identity, closure margin solving, attachment-row posing and registered source replay. Fixed shape-channel and closure sets make membership constant-time but do not remove vertex/refinement costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shape/closure membership sets are compiled once for the fixed basis, and one current native motion map serves closure and every attached surface. References and performed arrays remain distinct; cross-document reuse belongs to the pose cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed basis/membership sets live with the evaluator; current rest, shaped, motion and replay arrays transfer in the result or are released on failure. Input profiles are read-only, oral reference cloning is local, and no external task is retained.
 */
export function createHumanFaceNativePose(
  basis: IAutoMovieHumanFaceBasis,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  geometry?: IHumanFacePoseGeometry,
  progress?: (owner: string) => void,
) => IHumanFaceNativePose {
  const closure: Set<string> = new Set(
    basis.contact === undefined ? [] : [basis.contact.closure.channel],
  );
  const shapeChannels: Set<string> = new Set(
    basis.channels
      .filter((channel: IAutoMovieHumanFaceBasisChannelImported): boolean  => channel.kind === "shape")
      .map((channel: IAutoMovieHumanFaceBasisChannelImported): string  => channel.id),
  );
  const contact: IAutoMovieHumanFaceBasisContactImported | undefined = basis.contact;
  return (state: { weights: Map<string, number>; activations: { target: string; activation: number; shapeOnly: boolean; }[]; }, geometry: IHumanFacePoseGeometry | undefined, progress: ((owner: string) => void) | undefined): { posed: Map<string, number[]>; shaped: { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3>; } | undefined; up: IAutoMovieVector3 | undefined; closureRatio: number; motions: Map<string, IAutoMovieHumanFaceRigidMotionImported> | undefined; }  => {
    const { oral, eyelids, eyelidPhenotypes }: IHumanFacePoseGeometry = geometry ?? {};
    const rest: { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3>; } = evaluateHumanFaceRest(basis, state, closure);
    progress?.("native:rest");
    if (eyelids !== undefined) {
      const lidRest: ReadonlyMap<string, readonly number[]> = applyHumanFaceLidSections(
        basis,
        new Map(
          basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): [string, number[]]  => [surface.id, rest.surfaces[at]]),
        ),
        eyelids,
      );
      basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): void  => {
        rest.surfaces[at] = [...lidRest.get(surface.id)!];
      });
    }
    if (eyelidPhenotypes !== undefined) {
      const namedLids: ReadonlyMap<string, readonly number[]> = applyHumanFaceEyelidPhenotypes(
        basis,
        new Map(
          basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): [string, number[]]  => [surface.id, rest.surfaces[at]]),
        ),
        eyelidPhenotypes,
      );
      basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): void  => {
        rest.surfaces[at] = [...namedLids.get(surface.id)!];
      });
    }
    if (oral !== undefined) {
      const oralRest: ReadonlyMap<string, readonly number[]> = applyHumanFaceOralIdentity(
        basis,
        new Map(
          basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): [string, number[]]  => [surface.id, rest.surfaces[at]]),
        ),
        oral,
      );
      basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): void  => {
        rest.surfaces[at] = [...oralRest.get(surface.id)!];
      });
    }
    const motions: Map<string, IAutoMovieHumanFaceRigidMotionImported> | undefined =
      basis.articulation === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            basis.articulation,
            state.weights,
            rest.landmarks,
          ).motions;
    if (motions !== undefined) progress?.("native:articulation");
    let shaped: ReturnType<typeof evaluateHumanFaceRest> | undefined;
    let up: IAutoMovieVector3 | undefined;
    let closureRatio: number = 0;
    if (contact !== undefined) {
      shaped = evaluateHumanFaceRest(basis, {
        weights: new Map(
          [...state.weights].filter(([id]: [string, number]): boolean  => shapeChannels.has(id)),
        ),
        activations: state.activations.filter((one: { target: string; activation: number; shapeOnly: boolean; }): boolean  => one.shapeOnly),
      });
      if (eyelids !== undefined) {
        const lidRest: ReadonlyMap<string, readonly number[]> = applyHumanFaceLidSections(
          basis,
          new Map(
            basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): [string, number[]]  => [
              surface.id,
              shaped!.surfaces[at],
            ]),
          ),
          eyelids,
        );
        basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): void  => {
          shaped!.surfaces[at] = [...lidRest.get(surface.id)!];
        });
      }
      if (eyelidPhenotypes !== undefined) {
        const namedRestLids: ReadonlyMap<string, readonly number[]> = applyHumanFaceEyelidPhenotypes(
          basis,
          new Map(
            basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): [string, number[]]  => [
              surface.id,
              shaped!.surfaces[at],
            ]),
          ),
          eyelidPhenotypes,
        );
        basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): void  => {
          shaped!.surfaces[at] = [...namedRestLids.get(surface.id)!];
        });
      }
      if (oral !== undefined) {
        const identity: IAutoMovieHumanFaceOralImported = structuredClone(oral);
        delete identity.performance;
        const oralRest: ReadonlyMap<string, readonly number[]> = applyHumanFaceOralIdentity(
          basis,
          new Map(
            basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): [string, number[]]  => [
              surface.id,
              shaped!.surfaces[at],
            ]),
          ),
          identity,
        );
        basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, at: number): void  => {
          shaped!.surfaces[at] = [...oralRest.get(surface.id)!];
        });
      }
      up = resolveHumanFaceApertureUp(basis.articulation!.jaw.axis);
      const weight: number = state.weights.get(contact.closure.channel) ?? 0;
      if (weight === 0) {
        closureRatio = measureHumanFaceClosureRatio(
          basis, contact, rest.surfaces, motions!, up, contact.lips,
        );
        progress?.("native:closure-ratio");
      } else {
        const gains: IHumanFaceClosureGainImported = createHumanFaceClosureGain(
          basis, contact, rest.surfaces, motions!, up,
        );
        closureRatio = gains.ratio;
        progress?.("native:closure-field");
        const endpoint: string = basis.channels.find(
          (channel: IAutoMovieHumanFaceBasisChannelImported): boolean  => channel.id === contact.closure.channel,
        )!.positive;
        basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, index: number): void  => {
          const rows: number[] = surface.targets[endpoint];
          if (rows === undefined) return;
          const positions: number[] = rest.surfaces[index];
          const lips: boolean = surface.id === contact.lips.surface;
          for (let i: number = 0; i < rows.length; i += 4) {
            const gain: number = weight * (lips ? gains.lips[rows[i]] : gains.ratio);
            for (let axis: number = 0; axis < 3; axis++)
              positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
          }
        });
        progress?.("native:closure-application");
      }
    }
    const posed: Map<string, number[]> = new Map<string, number[]>();
    basis.surfaces.forEach((surface: IAutoMovieHumanFaceBasisSurfaceImported, index: number): void  => {
      posed.set(
        surface.id,
        replayHumanFaceSourceRefinements(
          surface.sourcePosePlan,
          motions !== undefined && (surface.attachments?.length ?? 0) > 0
            ? poseHumanFaceSurface(
                rest.surfaces[index],
                surface.attachments!,
                motions,
              )
            : rest.surfaces[index],
        ),
      );
      progress?.("native:replay:" + surface.id);
    });
    return { posed, shaped, up, closureRatio, motions };
  };
}
