import { Vector3 } from "@automovie/engine";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import { applyHumanFaceSourceClosure } from "./applyHumanFaceSourceClosure";
import { evaluateHumanFacePassage } from "./evaluateHumanFacePassage";
import { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { measureHumanFaceAperture } from "./measureHumanFaceAperture";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { replayHumanFaceSourceRefinements } from "./replayHumanFaceSourceRefinements";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";
import { resolveHumanFaceContact } from "./resolveHumanFaceContact";

/**
 * Compile the connected basis's geometry stage, independent of appearance.
 * One call receives admitted channel weights and the matching identity shape,
 * and owns native rest deformation, shaped joints, companion scaling, attached
 * posing and source refinement replay. A compiled source span reads fixed
 * closure-zero/one native stages with the same other inputs, forms its endpoint
 * after replay and applies the request once. Legacy bases retain their original
 * aperture-scaled closure. Rigid contact, final aperture/passage and normals
 * then read the resulting performed geometry. Native scaling reads the earlier
 * authored aperture, while the
 * admission and summary read the corrected geometry the renderer receives.
 * All positions remain basis metres in the Y-up, +Z-anterior head frame.
 * The returned arrays are owned by the caller and must not be modified by a
 * renderer or hair producer if a later appearance edit reuses them. Material
 * colours, iris pixels, scalp hair and ambient occlusion remain downstream.
 *
 * Jaw rotation and translation are source-authored endpoint interpolation;
 * Lindauer et al. observed both movements from early opening
 * (https://pubmed.ncbi.nlm.nih.gov/7771361/), but this does not turn the
 * complete endpoint path into a clinical trajectory. The rest-clearance
 * contact stage is also a deterministic authored constraint rather than
 * measured tissue mechanics; resolveHumanFaceContact owns that distinction.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the native companion/pose/replay stage at fixed source closure zero and one, with the weights owner rebuilding all other identical inputs, before one requested source-span blend. Legacy bases retain their native aperture scaling. Original rigid floors read the same shape-only rest, and final registered/native aperture diagnostics and tongue passage read the actual corrected geometry.
 * @evidence contracts/common.md#clear-and-simple-design One native stage feeds the legacy path or the compiled source endpoint owner; contact, final measurements and normals remain their named downstream responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second requested gain, source index clamp or forced zero gap enters the source path. Contact still owns its rest-clearance rule and budget, while source registration selects the actual final representative and retains the authored native diagnostic.
 * @evidence contracts/common.md#meaningful-documentation States the order, the frame and units, who owns the returned arrays and cites the jaw source with the limits of endpoint interpolation.
 * @evidence contracts/modeling.md#spatial-conventions Positions in basis metres in the Y-up +Z-anterior head frame, as the docs state; no conversion happens.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createHumanFaceBasisPoseEvaluator is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createHumanFaceBasisPoseEvaluator emits no primitive.
 */
export function createHumanFaceBasisPoseEvaluator(
  basis: IAutoMovieHumanFaceBasis,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  shape: IAutoMovieHumanFaceBasisDocument["shape"],
) => {
  positions: ReadonlyMap<string, readonly number[]>;
  normals: ReadonlyMap<string, readonly number[]>;
  summary: IAutoMovieHumanFaceContactSummary | null;
} {
  for (const surface of basis.surfaces)
    if (
      surface.sourcePosePlan !== undefined &&
      surface.sourcePartition !== undefined &&
      surface.sourcePosePlan.generation !== surface.sourcePartition.generation
    )
      throw new Error(
        "Face source pose and normal partitions need the same compiler generation.",
      );
  const closure = new Set(
    basis.contact === undefined ? [] : [basis.contact.closure.channel],
  );
  const shapeChannels = new Set(
    basis.channels
      .filter((channel) => channel.kind === "shape")
      .map((channel) => channel.id),
  );
  const contact = basis.contact;
  const sourceSpan = contact?.closure.sourceSpan;
  if (sourceSpan !== undefined) {
    const source = basis.surfaces.find(surface => surface.id === sourceSpan.surface);
    if (source === undefined)
      throw new Error("Face source closure names an absent basis surface.");
    if ([source.sourcePosePlan?.generation, source.sourcePartition?.generation]
      .some(generation => generation !== undefined && generation !== sourceSpan.generation))
      throw new Error("Face source closure needs the same compiler generation.");
  }
  const poseNative = (
    state: ReturnType<typeof humanFaceBasisWeights>,
    shape: IAutoMovieHumanFaceBasisDocument["shape"],
  ) => {
    const rest = evaluateHumanFaceRest(basis, state, closure);
    const motions =
      basis.articulation === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            basis.articulation,
            state.weights,
            rest.landmarks,
          ).motions;
    let shaped: ReturnType<typeof evaluateHumanFaceRest> | undefined;
    let frame: ReturnType<typeof measureHumanFaceAperture> | undefined;
    if (contact !== undefined) {
      shaped = evaluateHumanFaceRest(basis, {
        weights: new Map(
          [...state.weights].filter(([id]) => shapeChannels.has(id)),
        ),
        activations: state.activations.filter((one) => one.shapeOnly),
      });
      const referenced = evaluateHumanFaceRest(
        basis,
        humanFaceBasisWeights(basis, {
          shape,
          expression: { [contact.closure.reference]: 1 },
        }),
      );
      frame = measureHumanFaceAperture(
        basis,
        contact,
        shaped,
        referenced,
        rest,
        motions!,
      );
      const weight = state.weights.get(contact.closure.channel) ?? 0;
      const gain = weight * frame.closureRatio;
      const endpoint = basis.channels.find(
        (channel) => channel.id === contact.closure.channel,
      )!.positive;
      if (gain !== 0)
        basis.surfaces.forEach((surface, index) => {
          const rows = surface.targets[endpoint];
          if (rows === undefined) return;
          const positions = rest.surfaces[index];
          for (let i = 0; i < rows.length; i += 4)
            for (let axis = 0; axis < 3; axis++)
              positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
        });
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
    });
    return { posed, shaped, frame };
  };
  return (state, shape) => {
    const fixed = (weight: number) => humanFaceBasisWeights(basis, {
      shape,
      expression: Object.fromEntries(basis.channels
        .filter(channel => channel.kind === "expression")
        .map(channel => [channel.id, channel.id === contact!.closure.channel
          ? weight : state.weights.get(channel.id) ?? 0])),
    });
    const native = poseNative(sourceSpan === undefined ? state : fixed(0), shape);
    const posed = sourceSpan === undefined ? native.posed : applyHumanFaceSourceClosure(
      sourceSpan, native.posed, poseNative(fixed(1), shape).posed,
      state.weights.get(contact!.closure.channel) ?? 0,
    );
    const shaped = native.shaped;
    let frame = native.frame;
    let summary: IAutoMovieHumanFaceContactSummary | null = null;
    if (contact !== undefined) {
      const resolved = resolveHumanFaceContact(
        basis,
        contact,
        posed,
        new Map(
          basis.surfaces.map((surface, index) => [
            surface.id,
            shaped!.surfaces[index],
          ]),
        ),
      );
      const pair = (entry: typeof contact.lips) => {
        const positions = posed.get(entry.surface)!;
        const point = (vertex: number) => Vector3.create(
          positions[3 * vertex],
          positions[3 * vertex + 1],
          positions[3 * vertex + 2],
        );
        const upper = point(entry.upper);
        const lower = point(entry.lower);
        return { upper, lower, gap: measureHumanFaceApertureGap(upper, lower, frame!.up) };
      };
      const authoredLips = pair(contact.lips);
      const lips = sourceSpan === undefined ? authoredLips : pair({
        surface: sourceSpan.surface,
        upper: sourceSpan.representativePair[0],
        lower: sourceSpan.representativePair[1],
      });
      frame = { ...frame!, lips, incisors: pair(contact.incisors) };
      const passage = evaluateHumanFacePassage(
        contact,
        posed.get(contact.passage.surface)!,
        frame,
        basis.surfaces.find((surface) => surface.id === contact.passage.surface)!.indices,
      );
      summary = {
        interlabialMetres: frame!.lips.gap,
        interincisalMetres: frame!.incisors.gap,
        closureRatio: frame!.closureRatio,
        passage,
        resolved,
        ...(sourceSpan === undefined ? {} : {
          sourceNativeInterlabialMetres: authoredLips.gap,
        }),
      };
    }
    const normals = new Map(
      basis.surfaces.map((surface) => [
        surface.id,
        areaWeightedNormals(posed.get(surface.id)!, surface.indices),
      ]),
    );
    return { positions: posed, normals, summary };
  };
}
