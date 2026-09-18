import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Every drawn element's part boxes, resolved in one pass over the record.
 *
 * {@link builtEnvironmentElementPartBounds} answers for one element and walks
 * the whole element tree to do it, which is the right cost for one question and
 * the wrong one for a sweep: a building with three thousand placed bodies would
 * pay that walk three thousand times. This resolves the world matrices once and
 * reads every element through them, so a whole-building pass is one walk.
 *
 * A transform-only element is absent rather than present and empty, matching the
 * single-element answer's `null`, because a grouping node draws nothing and a
 * caller that finds no entry should fall back to the box the record reports for
 * it rather than treat it as a body with no volume.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the per-part world extents a whole-building support pass needs without re-walking the element tree once per body.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves every drawn element's placed geometry into its parts' world boxes from a single placement pass.
 * @author Samchon
 */
export const builtEnvironmentPartBoxes = (
  environment: IAutoMovieBuiltEnvironment,
): Map<string, { min: IAutoMovieVector3; max: IAutoMovieVector3 }[]> => {
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const models = new Map(
    environment.models.map((model) => [model.id, model] as const),
  );
  const boxes = new Map<
    string,
    { min: IAutoMovieVector3; max: IAutoMovieVector3 }[]
  >();
  for (const element of environment.elements) {
    if (element.model === null) continue;
    boxes.set(
      element.id,
      placedPartBoxes(models.get(element.model), matrices.get(element.id)!),
    );
  }
  return boxes;
};
