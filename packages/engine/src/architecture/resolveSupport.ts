/**
 * The face a body bears on, chosen from the parts it is actually over.
 *
 * A support's union box puts the bearing face at the highest point of the whole
 * body, which for a shelf is the back panel rather than the board an object
 * rests on — so a correctly seated object reads as floating by the height of a
 * part it is nowhere near. Where the support has drawn parts, the face is the
 * top of the part nearest the subject's underside among the parts its footprint
 * covers, and where it covers none of them the face comes from a part anyway:
 * standing over no part is what `not-over-support` means, and the union would
 * have answered that the subject stands over the body.
 *
 * A single-part support yields its own box either way.
  * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
 * @author Samchon
 */
export const resolveSupport = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IResolvedSupport | null => {
  if (locator.kind === "surface") {
    const entry = environment.surfaces.find(
      (candidate) => candidate.surface.id === locator.id,
    );
    if (entry === undefined) return null;
    const polygon = surfaceFootprint(entry.surface);
    if (footprintConvexPieces(polygon).length === 0) return null;
    return {
      face: { polygon, height: entry.surface },
      basis: "surface-height-rule",
    };
  }
  const body = builtEnvironmentPlacementBounds({
    environment,
    target: locator,
  });
  if (body === null) return null;
  const bearing = bearingPart(environment, locator, body, subject);
  const { min, max } = bearing;
  return {
    face: {
      polygon: {
        outer: footprintRing([
          { x: min.x, y: max.y, z: min.z },
          { x: max.x, y: max.y, z: min.z },
          { x: max.x, y: max.y, z: max.z },
          { x: min.x, y: max.y, z: max.z },
        ]),
        holes: [],
      },
      height: { height: { kind: "constant", value: max.y } },
    },
    basis: body.basis,
  };
};
