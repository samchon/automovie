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
 * @evidence contracts/common.md#principled-implementation Shared rest arrays and shape-only identity feed the existing closure, joint and refinement owners in the original order.
 * @evidence contracts/common.md#clear-and-simple-design One cohesive native stage owns pre-articulation identity and source companion evaluation; final spatial admission stays downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ghost incisor, second jaw transform or clinical default supplies closure identity.
 * @evidence contracts/common.md#meaningful-documentation States native identity, neutral oral performance, direction-only closure and downstream ownership.
 * @evidence contracts/modeling.md#spatial-conventions Native source coordinates remain canonical head-frame metres and rigid motion uses the existing source owner.
 * @evidence contracts/modeling.md#parameter-channels Closure companion reads the original admitted source weight and aperture-scaled gain once.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Preserves source part identities without defining new members.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Changes source positions without changing topology.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The named lid/oral identity owners preserve their source interfaces; this stage sequences them.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final assembly and viewer owners observe the actual performed output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source and identity owners retain anatomical qualifications; orchestration adds no biological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing closure and articulation owners admit their domains.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes the admitted named geometric record without adding a control.
 */
export function createHumanFaceNativePose(
  basis: IAutoMovieHumanFaceBasis,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  geometry?: IHumanFacePoseGeometry,
  progress?: (owner: string) => void,
) => IHumanFaceNativePose {
  const closure = new Set(
    basis.contact === undefined ? [] : [basis.contact.closure.channel],
  );
  const shapeChannels = new Set(
    basis.channels
      .filter((channel) => channel.kind === "shape")
      .map((channel) => channel.id),
  );
  const contact = basis.contact;
  return (state, geometry, progress) => {
    const { oral, eyelids, eyelidPhenotypes } = geometry ?? {};
    const rest = evaluateHumanFaceRest(basis, state, closure);
    progress?.("native:rest");
    if (eyelids !== undefined) {
      const lidRest = applyHumanFaceLidSections(
        basis,
        new Map(
          basis.surfaces.map((surface, at) => [surface.id, rest.surfaces[at]]),
        ),
        eyelids,
      );
      basis.surfaces.forEach((surface, at) => {
        rest.surfaces[at] = [...lidRest.get(surface.id)!];
      });
    }
    if (eyelidPhenotypes !== undefined) {
      const namedLids = applyHumanFaceEyelidPhenotypes(
        basis,
        new Map(
          basis.surfaces.map((surface, at) => [surface.id, rest.surfaces[at]]),
        ),
        eyelidPhenotypes,
      );
      basis.surfaces.forEach((surface, at) => {
        rest.surfaces[at] = [...namedLids.get(surface.id)!];
      });
    }
    if (oral !== undefined) {
      const oralRest = applyHumanFaceOralIdentity(
        basis,
        new Map(
          basis.surfaces.map((surface, at) => [surface.id, rest.surfaces[at]]),
        ),
        oral,
      );
      basis.surfaces.forEach((surface, at) => {
        rest.surfaces[at] = [...oralRest.get(surface.id)!];
      });
    }
    const motions =
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
    let closureRatio = 0;
    if (contact !== undefined) {
      shaped = evaluateHumanFaceRest(basis, {
        weights: new Map(
          [...state.weights].filter(([id]) => shapeChannels.has(id)),
        ),
        activations: state.activations.filter((one) => one.shapeOnly),
      });
      if (eyelids !== undefined) {
        const lidRest = applyHumanFaceLidSections(
          basis,
          new Map(
            basis.surfaces.map((surface, at) => [
              surface.id,
              shaped!.surfaces[at],
            ]),
          ),
          eyelids,
        );
        basis.surfaces.forEach((surface, at) => {
          shaped!.surfaces[at] = [...lidRest.get(surface.id)!];
        });
      }
      if (eyelidPhenotypes !== undefined) {
        const namedRestLids = applyHumanFaceEyelidPhenotypes(
          basis,
          new Map(
            basis.surfaces.map((surface, at) => [
              surface.id,
              shaped!.surfaces[at],
            ]),
          ),
          eyelidPhenotypes,
        );
        basis.surfaces.forEach((surface, at) => {
          shaped!.surfaces[at] = [...namedRestLids.get(surface.id)!];
        });
      }
      if (oral !== undefined) {
        const identity = structuredClone(oral);
        delete identity.performance;
        const oralRest = applyHumanFaceOralIdentity(
          basis,
          new Map(
            basis.surfaces.map((surface, at) => [
              surface.id,
              shaped!.surfaces[at],
            ]),
          ),
          identity,
        );
        basis.surfaces.forEach((surface, at) => {
          shaped!.surfaces[at] = [...oralRest.get(surface.id)!];
        });
      }
      up = resolveHumanFaceApertureUp(basis.articulation!.jaw.axis);
      const weight = state.weights.get(contact.closure.channel) ?? 0;
      if (weight === 0) {
        closureRatio = measureHumanFaceClosureRatio(
          basis, contact, rest.surfaces, motions!, up, contact.lips,
        );
        progress?.("native:closure-ratio");
      } else {
        const gains = createHumanFaceClosureGain(
          basis, contact, rest.surfaces, motions!, up,
        );
        closureRatio = gains.ratio;
        progress?.("native:closure-field");
        const endpoint = basis.channels.find(
          (channel) => channel.id === contact.closure.channel,
        )!.positive;
        basis.surfaces.forEach((surface, index) => {
          const rows = surface.targets[endpoint];
          if (rows === undefined) return;
          const positions = rest.surfaces[index];
          const lips = surface.id === contact.lips.surface;
          for (let i = 0; i < rows.length; i += 4) {
            const gain = weight * (lips ? gains.lips[rows[i]] : gains.ratio);
            for (let axis = 0; axis < 3; axis++)
              positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
          }
        });
        progress?.("native:closure-application");
      }
    }
    const posed = new Map<string, number[]>();
    basis.surfaces.forEach((surface, index) => {
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
