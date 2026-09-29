import { portraitNormals } from "../mesh/portraitNormals";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import { evaluateHumanFacePassage } from "./evaluateHumanFacePassage";
import { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { measureHumanFaceAperture } from "./measureHumanFaceAperture";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";
import { resolveHumanFaceContact } from "./resolveHumanFaceContact";

/**
 * Compile the connected basis's geometry stage, independent of appearance.
 * One call receives admitted channel weights and the matching identity shape,
 * and owns rest deformation, shaped joint landmarks, aperture-scaled closure,
 * attached posing, passage/contact and shared surface normals in that order.
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
        motions !== undefined && (surface.attachments?.length ?? 0) > 0
          ? poseHumanFaceSurface(
              rest.surfaces[index],
              surface.attachments!,
              motions,
            )
          : rest.surfaces[index],
      );
    });
    if (contact !== undefined) {
      // Passage judges the closed seam the rendered face actually shows.
      const lips = posed.get(contact.lips.surface)!;
      const seam = [0, 1, 2].reduce(
        (total, axis) =>
          total +
          (lips[3 * contact.lips.upper + axis] -
            lips[3 * contact.lips.lower + axis]) *
            [frame!.up.x, frame!.up.y, frame!.up.z][axis],
        0,
      );
      frame = { ...frame!, lips: { ...frame!.lips, gap: seam } };
      const passage = evaluateHumanFacePassage(
        contact,
        posed.get(contact.passage.surface)!,
        frame,
      );
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
        portraitNormals(posed.get(surface.id)!, surface.indices),
      ]),
    );
    return { positions: posed, normals, summary };
  };
}
