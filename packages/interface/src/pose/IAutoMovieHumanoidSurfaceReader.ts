import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieSubjectBox } from "../production/IAutoMovieSubjectBox";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieHumanoidSurfaceRays } from "./IAutoMovieHumanoidSurfaceRays";
import type { IAutoMovieHumanoidSurfaceRegions } from "./IAutoMovieHumanoidSurfaceRegions";
import type { IAutoMovieHumanoidSurfaces } from "./IAutoMovieHumanoidSurfaces";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Shared rest-pose and collision-surface readers for one humanoid rig and
 * physical profile.
 *
 * `AutoMovieHumanoidSurfaceRays.tools` resolves the unposed skeleton once and
 * retains that map together with the supplied profile. The caller keeps the rig
 * and profile coherent for the reader's lifetime; profile segments are
 * borrowed, not cloned. Releasing the reader releases these closures. World
 * coordinates here mean the rig's resolved rest frame in metres, before scene
 * placement.
 */
export interface IAutoMovieHumanoidSurfaceReader {
  /**
   * Return the retained resolved rest bone; throw if the rig contains no such
   * bone. The returned record is borrowed from the reader's map.
   */
  at(bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone;

  /**
   * Union the segment's neutral collider bounds in rig-world metres. A missing
   * segment throws; an empty shape list leaves positive-infinite minima and
   * negative-infinite maxima. Each result is newly allocated.
   */
  bounds(bone: AutoMovieHumanoidBone): IAutoMovieSubjectBox;

  /**
   * Convert a rig-world metre point and outward direction to the named bone's
   * rest frame. Directions are normalized before rotation; omitted forward
   * leaves the returned frame's forward absent. A missing bone throws.
   */
  local(
    bone: AutoMovieHumanoidBone,
    world: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    forward?: IAutoMovieVector3,
  ): IAutoMovieHumanoidSurfaces.IFrame;

  /**
   * Locate a region's source station in rig-world metres: the collider-box
   * centre for `toward: "centre"`, otherwise the specified share between two
   * rest joints. Missing referenced bones or segments propagate the
   * corresponding reader failure.
   */
  station(
    station: IAutoMovieHumanoidSurfaceRegions.IStation,
  ): IAutoMovieVector3;

  /**
   * Return only the farthest collider-exit point in rig-world metres; origin is
   * a rig-world metre point and direction is normalized by the surface reader.
   * A missing segment or ray with no admitted exit throws.
   */
  exit(
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3;

  /**
   * Return the farthest exit from the segment's convex collider union and that
   * collider's outward normal. Origin is rig-world metres; direction is
   * normalized. A missing segment or no admitted exit throws, and the returned
   * point/normal records are newly computed.
   */
  surface(
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): IAutoMovieHumanoidSurfaceRays.ISurfacePoint;
}
