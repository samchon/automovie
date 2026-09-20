import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";

/**
 * World transform of every element, parent composed into child.
 *
 * The same composition `lowerBuiltEnvironment` performs when it flattens the
 * hierarchy into staged scene nodes, so a line on the drawing and the set piece
 * it depicts stand in the same place. The suite pins that agreement directly
 * rather than trusting the two to stay in step.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Places drawing geometry through the same parent-child transforms as its staged element so the sheet cannot drift from the model.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Recursively composes each element's local transform with its ancestors and caches one world matrix per resolved identity.
 */
export const autoMovieDrawingWorldMatrices = (
  environment: IAutoMovieBuiltEnvironment,
): Map<string, number[]> => {
  const byId = new Map(
    environment.elements.map((element) => [element.id, element]),
  );
  const matrices = new Map<string, number[]>();
  const read = (id: string): number[] => {
    const cached = matrices.get(id);
    if (cached !== undefined) return cached;
    const element = byId.get(id)!;
    const local = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    const world =
      element.parent === null
        ? local
        : Matrix4.multiply(read(element.parent), local);
    matrices.set(id, world);
    return world;
  };
  for (const element of environment.elements) read(element.id);
  return matrices;
};
