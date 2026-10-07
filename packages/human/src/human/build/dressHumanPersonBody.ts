import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "../../body/structures/IHumanBodyPreparedBuild";

/** Inputs of the final exterior garment composition, before render splitting. */
interface IHumanPersonBodyDressInput {
  /** Prepared admitted body sharing the garment compiler and rest coverage. */
  prepared: IHumanBodyPreparedBuild;

  /** Independent before-join body evaluation, including its own garment. */
  body: IAutoMovieHumanBodyBuild;

  /** Native basis surface receiving the person's final joined skin. */
  surface: number;

  /** Final native positions in common body-frame metres; cut samples may follow. */
  positions: readonly number[];

  /** Common final unit normals, with face vertices preceding body vertices. */
  normals: readonly number[];

  /** Number of face vertices preceding the body in the common normal field. */
  faceVertices: number;
}

/**
 * Compose a garment on the person's final joined exterior.
 * The independent before-collar body keeps its own supported garment output.
 * This composition result is consumed only by the whole person model. The
 * prepared owner retains the admitted choice, shape
 * rest coverage and cutting rule; this composition only supplies final native
 * positions and common normals before material and texture corner splitting.
 * Appended cut samples are excluded from the original native basis surface.
 * The returned composition owns a new model record without mutating the body.
 * The garment's producer reserves its material identity against all basis
 * materials, so that identity replaces only its owned garment in composition.
 *
 * @evidence contracts/common.md#principled-implementation Garment production consumes the same final native skin that the person skin parts read, after collar and common-normal evaluation.
 * @evidence contracts/common.md#clear-and-simple-design One composition supplies the final native surface and replaces its garment by the producer's reserved material identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source producer's collision-free garment material identity selects its owned result; no part-name heuristic or nearest-surface rebinding enters.
 * @evidence contracts/common.md#meaningful-documentation States distinct body and person outputs, native addressing, shared normals, retained rest coverage and immutable body ownership.
 * @evidence contracts/modeling.md#spatial-conventions Native positions remain common body-frame metres and normals remain the final dimensionless unit field.
 * @evidence contracts/modeling.md#shared-boundaries Garment construction reads the final source skin instead of a separately evaluated pre-collar surface.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The prepared garment owner defines parts and composition; this operation appends its result.
 * @evidenceExclude contracts/modeling.md#parameter-channels The prepared owner retains every garment and body choice.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing underwear owner determines the emitted population.
 * @evidenceExclude contracts/modeling.md#rendered-observation The complete person builder owns garment observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity or clinical fit claim.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source and underwear owners admit their domains.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal sculpt or garment input.
 */
export function dressHumanPersonBody(
  input: IHumanPersonBodyDressInput,
): IAutoMovieHumanBodyBuild {
  const count = input.body.posedSurfaces[input.surface].positions.length;
  const posed = input.body.posedSurfaces.map((surface, at) =>
    at === input.surface
      ? {
          positions: input.positions.slice(0, count),
          normals: input.normals.slice(3 * input.faceVertices, 3 * input.faceVertices + count),
        }
      : surface,
  );
  const garment = input.prepared.dress(posed);
  if (garment === undefined) return input.body;
  return {
    ...input.body,
    model: {
      ...input.body.model,
      parts: [...input.body.model.parts.filter((part) => part.material !== garment.material.id), ...garment.parts],
      materials: [...input.body.model.materials.filter((material) => material.id !== garment.material.id), garment.material],
    },
  };
}
