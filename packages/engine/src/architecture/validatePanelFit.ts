/**
 * Refuse a closed leaf that does not fit the void it fills.
 *
 * The leaf is measured where it actually rests, projected into the host
 * boundary's own frame, so a leaf and a void authored in unrelated coordinates
 * disagree here instead of at render time. Nothing is said about a leaf smaller
 * than its void: two leaves sharing one opening, or a sash inside a frame, are
 * ordinary designs, while a leaf larger than its own hole is not a design at
 * all.
 *
 * Only the two in-plane coordinates are compared. How far the leaf sits in
 * front of or behind the face is a design freedom, not an error: a leaf in a
 * rebate, a storm sash outside the frame, and a surface-mounted sliding leaf
 * all rest off the face's own plane on purpose.
 *
 * Containment is the same test a void gets against its face, so a leaf that
 * spans the notch of a concave void is refused even though each of its corners
 * is inside.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validatePanelFit = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  faces: ReadonlyMap<string, IAutoMovieBoundaryFace>,
  hulls: ReadonlyMap<number, IAutoMoviePlanarPoint[]>,
  collector: ViolationCollector,
): void => {
  const matrices = worldMatricesOf(environment);
  environment.openings.forEach((opening, index) => {
    const operation = opening.operation;
    const hull = hulls.get(index);
    const face = faces.get(opening.boundary);
    if (operation === undefined || hull === undefined || face === undefined)
      return;
    const inverse = Quaternion.inverse(face.rotation);
    operation.panels.forEach((panel, panelIndex) => {
      const world = matrices.get(panel.element)!;
      const corners: IAutoMovieVector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: panel.width, y: 0, z: 0 },
        { x: panel.width, y: panel.height, z: 0 },
        { x: 0, y: panel.height, z: 0 },
      ];
      const planar = corners.map((corner) => {
        const local = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(applyMatrix(world, corner), face.origin),
        );
        return { x: local.x, y: local.y };
      });
      if (polygonInside(planar, hull) === false)
        collector.push(
          "range",
          `${root}.openings[${index}].operation.panels[${panelIndex}]`,
          `panel "${panel.id}" does not fit inside the void of opening "${opening.id}" when it rests closed`,
          { width: panel.width, height: panel.height },
        );
    });
  });
};
