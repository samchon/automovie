/** Whether a boundary's face is complete enough to place an opening on.  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const faceIsUsable = (
  face: IAutoMovieBoundaryFace,
  path: string,
  collector: ViolationCollector,
): boolean => {
  const before = collector.items.length;
  finiteVector(
    face.origin,
    `${path}.face.origin`,
    "boundary face origin",
    collector,
  );
  unitQuaternion(
    face.rotation,
    `${path}.face.rotation`,
    "boundary face rotation",
    collector,
  );
  positive(
    face.thickness,
    `${path}.face.thickness`,
    "boundary thickness",
    collector,
  );
  if (
    closedOutline(
      face.outline,
      3,
      `${path}.face.outline`,
      "boundary face outline",
      collector,
    )
  )
    closedRegion(
      face.outline,
      `${path}.face.outline`,
      "boundary face outline",
      collector,
    );
  return collector.items.length === before;
};
