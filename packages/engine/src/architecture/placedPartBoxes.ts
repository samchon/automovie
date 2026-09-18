/**
 * One world box per drawn part, rather than one box over all of them.
 *
 * A model's union box says where the body is and nothing about how much of that
 * volume it fills. A shelf is a back panel and two boards, so its union spans
 * floor to head height and is mostly air; anything standing on a board is
 * inside that box, and a test written against the union reports an overlap that
 * is true about the boxes and false about the bodies. The same box puts the
 * bearing face at the panel's top rather than at the board the object rests on,
 * which is the paired "floating" answer.
 *
 * Part boxes are contained in the union box, so every answer they give is one
 * the union would also have given or a false positive the union invented. A
 * single-part body yields exactly the union box and behaves as before.
 *
 * An element with no drawn part keeps its degenerate origin box, for the reason
 * {@link builtEnvironmentElementBounds} states.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const placedPartBoxes = (
  model: IAutoMovieModel | undefined,
  world: number[],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] => {
  const boxes: { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] = [];
  for (const part of model === undefined ? [] : model.parts) {
    const points = placedPartPoints(part, world);
    if (points.length !== 0) boxes.push(boundsOf(points));
  }
  return boxes.length === 0
    ? [boundsOf([applyMatrix(world, { x: 0, y: 0, z: 0 })])]
    : boxes;
};
