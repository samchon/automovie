import { Vector3 } from "@automovie/engine";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
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
 * and owns rest deformation, shaped joint landmarks, aperture-scaled closure,
 * attached posing, native source refinement replay, contact, final
 * aperture/passage and shared surface normals
 * in that order. Closure scaling reads the earlier posed aperture, while the
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
 * @evidence contracts/common.md#principled-implementation Closure scaling reads the preliminary posed aperture, then attached surfaces pose and contact reads both posed and shape-only rest positions. Final aperture pairs and the tongue's complete slab section are measured after contact, so the admission and reported gaps read the same geometry as normals and the renderer.
 * @evidence contracts/common.md#clear-and-simple-design One function that sequences named stage owners and returns positions, normals and the summary; appearance is entirely downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contact correction belongs to resolveHumanFaceContact's declared rest-clearance rule and tissue budget; this orchestrator adds no compensating deformation. A document past a stage's budget refuses there.
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
  return (state, shape) => {
    const rest = evaluateHumanFaceRest(basis, state, closure);
    const motions =
      basis.articulation === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            basis.articulation,
            state.weights,
            rest.landmarks,
          ).motions;
    let summary: IAutoMovieHumanFaceContactSummary | null = null;
    let shaped: ReturnType<typeof evaluateHumanFaceRest> | undefined;
    let frame: ReturnType<typeof measureHumanFaceAperture> | undefined;
    const contact = basis.contact;
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
      frame = { ...frame!, lips: pair(contact.lips), incisors: pair(contact.incisors) };
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
