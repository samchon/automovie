import { IAutoMovieBuiltEnvironment, IAutoMovieServicePenetration, IAutoMovieVector3, IAutoMoviePlanarPoint, IAutoMovieBuiltBoundary, IAutoMovieBoundaryFace, IAutoMovieBuiltOpening } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { Quaternion } from "../math/Quaternion";
import { polygonInside } from "../architecture/polygonInside";
import { outlineHull } from "../architecture/outlineHull";
import { SERVICE_EPSILON } from "./SERVICE_EPSILON";
/**
 * Hold a sleeve inside the face it claims to pierce.
 *
 * Until a boundary carried a face this could not be asked at all, and a sleeve
 * could only be held against the run that cited it. A face gives the question
 * an answer: the sleeve's world centre is read in the boundary's own frame,
 * where it must lie within the separation's thickness and inside its outline,
 * and a sleeve citing a declared opening must additionally sit inside that
 * opening's own void rather than merely somewhere on the same wall.
 *
 * The sleeve is held as the square that bounds it rather than as its true
 * circle, which errs towards refusing a hole tucked into a corner of an
 * irregular face. That is the same direction every other tolerance here leans:
 * a refused sleeve is moved, an unrefused one leaks. It is held by the very
 * predicate the architecture holds a door inside a wall with, so a sleeve and a
 * window cannot come to disagree about what "inside this face" means.
 *
 * A boundary with no face is not a failure. It is the pre-geometry record, and
 * `serviceAnalysisSupport` reports it as the reason this check is `unsupported`
 * rather than passing it silently.
  *
 * @evidence contracts/common.md#principled-implementation Inverse rigid face rotation places a finite sleeve centre in boundary coordinates, where thickness and a conservative radius-bounding square must fit the boundary and optional opening outline.
 * @evidence contracts/common.md#clear-and-simple-design Boundary geometry, Quaternion and shared polygonInside own frame conversion and inclusion, so service sleeves follow the same planar fit convention as architecture openings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent faces remain unsupported geometry rather than invented walls; malformed radius/position skips secondary fit accusations, and square bounds explicitly err toward refusing corner fits.
 * @evidence contracts/common.md#meaningful-documentation States centre/thickness checks, square-versus-circle conservatism, opening-specific fit and absent-face behavior without claiming actual construction waterproofing.
 * @evidence contracts/performance.md#efficient-algorithms Boundary/opening resolution is linear in their tables; four square corners undergo shared polygon inclusion whose work depends on outline population.
 * @evidence contracts/performance.md#reuse-equivalent-work One local centre and bounding square serve both boundary and opening checks; no face result is cached across geometric edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local offset, inverse rotation, centre and corners release on return, while only ordered violations remain on the caller's collector.
 */
export const appendServiceSleeveOnFace: (environment: IAutoMovieBuiltEnvironment, sleeve: IAutoMovieServicePenetration, path: string, out: ViolationCollector) => void = (
  environment: IAutoMovieBuiltEnvironment,
  sleeve: IAutoMovieServicePenetration,
  path: string,
  out: ViolationCollector,
): void => {
  const boundary: IAutoMovieBuiltBoundary | undefined = environment.boundaries.find(
    (candidate: IAutoMovieBuiltBoundary): boolean => candidate.id === sleeve.boundary,
  );
  const face: IAutoMovieBoundaryFace | undefined = boundary?.face;
  if (face === undefined) return;
  if (!Number.isFinite(sleeve.radius) || sleeve.radius <= 0) return;
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(sleeve.position[axis])) return;

  const offset: { x: number; y: number; z: number; } = {
    x: sleeve.position.x - face.origin.x,
    y: sleeve.position.y - face.origin.y,
    z: sleeve.position.z - face.origin.z,
  };
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(face.rotation),
    offset,
  );
  if (Math.abs(local.z) > face.thickness / 2 + SERVICE_EPSILON)
    out.push(
      "range",
      `${path}.position`,
      `penetration "${sleeve.id}" stands ${Math.abs(local.z)} m off the face of boundary "${sleeve.boundary}", which is only ${face.thickness} m thick`,
      sleeve.position,
      Math.abs(local.z) - face.thickness / 2,
    );

  const corners: IAutoMoviePlanarPoint[] = sleeveCorners(local, sleeve.radius);
  if (!polygonInside(corners, face.outline))
    out.push(
      "type",
      `${path}.position`,
      `penetration "${sleeve.id}" is not wholly inside the face of boundary "${sleeve.boundary}"`,
      sleeve.position,
    );

  if (sleeve.opening === null) return;
  const opening: IAutoMovieBuiltOpening | undefined = environment.openings.find(
    (candidate: IAutoMovieBuiltOpening): boolean => candidate.id === sleeve.opening,
  );
  if (opening === undefined || opening.boundary !== sleeve.boundary) return;
  if (opening.profile === undefined) return;
  if (!polygonInside(corners, outlineHull(opening.profile)))
    out.push(
      "type",
      `${path}.opening`,
      `penetration "${sleeve.id}" does not pass through the void of opening "${sleeve.opening}"`,
      sleeve.position,
    );
};

/** The four corners of the square bounding a sleeve in its face's own frame. */
const sleeveCorners: (local: { x: number; y: number; }, radius: number) => IAutoMoviePlanarPoint[] = (
  local: { x: number; y: number },
  radius: number,
): IAutoMoviePlanarPoint[] => [
  { x: local.x - radius, y: local.y - radius },
  { x: local.x + radius, y: local.y - radius },
  { x: local.x + radius, y: local.y + radius },
  { x: local.x - radius, y: local.y + radius },
];
