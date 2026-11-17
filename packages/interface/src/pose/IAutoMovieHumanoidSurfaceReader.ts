import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieSubjectBox } from "../production/IAutoMovieSubjectBox";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieHumanoidSurfaceRays } from "./IAutoMovieHumanoidSurfaceRays";
import type { IAutoMovieHumanoidSurfaceRegions } from "./IAutoMovieHumanoidSurfaceRegions";
import type { IAutoMovieHumanoidSurfaces } from "./IAutoMovieHumanoidSurfaces";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Shared rest-pose and collision-surface readers for one humanoid rig and physical profile.
 *
 * `AutoMovieHumanoidSurfaceRays.tools` resolves the unposed skeleton once and retains that map together with the supplied profile. The caller keeps the rig and profile coherent for the reader's lifetime; profile segments are borrowed, not cloned. Releasing the reader releases these closures. World coordinates here mean the rig's resolved rest frame in metres, before scene placement.
 *
 * @evidence contracts/development/design.md#principled-representation Each callback distinguishes a rig-world point or direction from a bone-local surface frame; bone identity uses the canonical closed humanoid vocabulary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidSurfaces, AutoMovieHumanoidDigitSurfaces and AutoMovieHumanoidSurfaceExtents share these six readers over the same rest pose and profile.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing bones, missing profile segments and missed rays remain failures of their reader; no inferred frame, surrogate collider or zero-valued fallback is promised.
 * @evidence contracts/development/common.md#meaningful-documentation States retained ownership, metre frames, normalization, optional orientation and the exact missing-data behavior of each callback.
 */
export interface IAutoMovieHumanoidSurfaceReader {
  /**
   * Return the retained resolved rest bone; throw if the rig contains no such bone. The returned record is borrowed from the reader's map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Return the retained resolved rest bone; throw if the rig contains no such bone. The returned record is borrowed from the reader's map.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMovieHumanoidSurfaceRays.tools owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMovieHumanoidSurfaceRays.tools owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMovieHumanoidSurfaceRays.tools.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMovieHumanoidSurfaceRays.tools owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMovieHumanoidSurfaceRays.tools owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMovieHumanoidSurfaceRays.tools and the documented reader/caller lifetime own retained data and release.
   */
  at(bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone;

  /**
   * Union the segment's neutral collider bounds in rig-world metres. A missing segment throws; an empty shape list leaves positive-infinite minima and negative-infinite maxima. Each result is newly allocated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Union the segment's neutral collider bounds in rig-world metres. A missing segment throws; an empty shape list leaves positive-infinite minima and negative-infinite maxima. Each result is newly allocated.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMovieHumanoidSurfaceRays.tools owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMovieHumanoidSurfaceRays.tools owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMovieHumanoidSurfaceRays.tools.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMovieHumanoidSurfaceRays.tools owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMovieHumanoidSurfaceRays.tools owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMovieHumanoidSurfaceRays.tools and the documented reader/caller lifetime own retained data and release.
   */
  bounds(bone: AutoMovieHumanoidBone): IAutoMovieSubjectBox;

  /**
   * Convert a rig-world metre point and outward direction to the named bone's rest frame. Directions are normalized before rotation; omitted forward leaves the returned frame's forward absent. A missing bone throws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Convert a rig-world metre point and outward direction to the named bone's rest frame. Directions are normalized before rotation; omitted forward leaves the returned frame's forward absent. A missing bone throws.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMovieHumanoidSurfaceRays.tools owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMovieHumanoidSurfaceRays.tools owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMovieHumanoidSurfaceRays.tools.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMovieHumanoidSurfaceRays.tools owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMovieHumanoidSurfaceRays.tools owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMovieHumanoidSurfaceRays.tools and the documented reader/caller lifetime own retained data and release.
   */
  local(
    bone: AutoMovieHumanoidBone,
    world: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    forward?: IAutoMovieVector3,
  ): IAutoMovieHumanoidSurfaces.IFrame;

  /**
   * Locate a region's source station in rig-world metres: the collider-box centre for `toward: "centre"`, otherwise the specified share between two rest joints. Missing referenced bones or segments propagate the corresponding reader failure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Locate a region's source station in rig-world metres: the collider-box centre for `toward: "centre"`, otherwise the specified share between two rest joints. Missing referenced bones or segments propagate the corresponding reader failure.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMovieHumanoidSurfaceRays.tools owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMovieHumanoidSurfaceRays.tools owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMovieHumanoidSurfaceRays.tools.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMovieHumanoidSurfaceRays.tools owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMovieHumanoidSurfaceRays.tools owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMovieHumanoidSurfaceRays.tools and the documented reader/caller lifetime own retained data and release.
   */
  station(
    station: IAutoMovieHumanoidSurfaceRegions.IStation,
  ): IAutoMovieVector3;

  /**
   * Return only the farthest collider-exit point in rig-world metres; origin is a rig-world metre point and direction is normalized by the surface reader. A missing segment or ray with no admitted exit throws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Return only the farthest collider-exit point in rig-world metres; origin is a rig-world metre point and direction is normalized by the surface reader. A missing segment or ray with no admitted exit throws.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMovieHumanoidSurfaceRays.tools owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMovieHumanoidSurfaceRays.tools owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMovieHumanoidSurfaceRays.tools.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMovieHumanoidSurfaceRays.tools owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMovieHumanoidSurfaceRays.tools owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMovieHumanoidSurfaceRays.tools and the documented reader/caller lifetime own retained data and release.
   */
  exit(
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3;

  /**
   * Return the farthest exit from the segment's convex collider union and that collider's outward normal. Origin is rig-world metres; direction is normalized. A missing segment or no admitted exit throws, and the returned point/normal records are newly computed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Return the farthest exit from the segment's convex collider union and that collider's outward normal. Origin is rig-world metres; direction is normalized. A missing segment or no admitted exit throws, and the returned point/normal records are newly computed.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMovieHumanoidSurfaceRays.tools owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMovieHumanoidSurfaceRays.tools owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMovieHumanoidSurfaceRays.tools.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMovieHumanoidSurfaceRays.tools owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMovieHumanoidSurfaceRays.tools owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMovieHumanoidSurfaceRays.tools and the documented reader/caller lifetime own retained data and release.
   */
  surface(
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): IAutoMovieHumanoidSurfaceRays.ISurfacePoint;
}
