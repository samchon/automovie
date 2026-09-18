import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world boxes one element's drawn parts fill, one per part.
 *
 * Answers the question {@link builtEnvironmentElementBounds} cannot: how much of
 * a body's box is body. A caller testing whether two placed things intersect,
 * or which face one rests on, reads these rather than the union, because a
 * multi-part body's union is mostly air and says so nowhere.
 *
 * `null` for the same reasons the union answers `null`: an element that was
 * never declared, or one that draws nothing.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support `builtEnvironmentElementPartBounds` supplies the per-part world extents a support probe needs to name the face an object actually rests on.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves one element's placed geometry into its drawn parts' world boxes while preserving the measurement basis.
 * @author Samchon
 */
export const builtEnvironmentElementPartBounds = (
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] | null => {
  const element = environment.elements.find(
    (candidate) => candidate.id === elementId,
  );
  if (element === undefined || element.model === null) return null;
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const model = environment.models.find(
    (candidate) => candidate.id === element.model,
  );
  return placedPartBoxes(model, matrices.get(element.id)!);
};
