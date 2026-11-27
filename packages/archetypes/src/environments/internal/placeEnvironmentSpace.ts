import { Quaternion, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieHeightRule,
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieTransform,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";

/*
 * Place authored support patches in a scoped upright rigid world frame.
 * Parameter id: Scoped occurrence id prefixed to the space and surface ids.
 * Parameter local: A support space in metres in the model frame.
 * Parameter frame: The already admitted rigid world frame.
 * Returns: A world space with the same support and walkability.
 * If the authored space is invalid, the frame is tilted, or a turned
 * lattice would need resampling.
 */
export function placeEnvironmentSpace(
  id: string,
  local: IAutoMovieSpace,
  frame: IAutoMovieTransform,
): IAutoMovieSpace {
  const report: IAutoMovieValidation = AutoMovieEngineValidation.validateSpace({ space: local });
  if (!report.success) {
    const first: IAutoMovieConstraintViolation | undefined =
      report.violations.find(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.severity !== "warning",
      );
    throw new Error(`${id}.space ${first?.path}: ${first?.expected}`);
  }
  if (frame.rotation.x !== 0 || frame.rotation.z !== 0)
    throw new Error(`${id}.space: local support requires an upright frame`);

  /*
   * Project a footprint vertex into world XZ, whose ring Y carries no height.
   */
  function point(vertex: IAutoMovieVector3): IAutoMovieVector3 {
    const placed: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(frame, {
      x: vertex.x,
      y: 0,
      z: vertex.z,
    });
    return { x: placed.x, y: 0, z: placed.z };
  }

  /*
   * Namespace every reference to a surface in the placed space.
   */
  function surfaceId(key: string): string {
    return `${id}/${local.id}/${key}`;
  }

  return {
    id: `${id}/${local.id}`,
    surfaces: local.surfaces.map(
      (surface: IAutoMovieSurface): IAutoMovieSurface => ({
        ...surface,
        id: surfaceId(surface.id),
        polygon: surface.polygon.map(point),
        ...(surface.holes !== undefined
          ? {
              holes: surface.holes.map((ring: IAutoMovieVector3[]) =>
                ring.map(point),
              ),
            }
          : {}),
        ...(surface.anchor !== undefined
          ? { anchor: AutoMovieArchetypeFrame.point(frame, surface.anchor) }
          : {}),
        ...(surface.rampTo !== undefined && surface.rampTo !== null
          ? { rampTo: AutoMovieArchetypeFrame.point(frame, surface.rampTo) }
          : {}),
        ...(surface.height !== undefined
          ? {
              height: placeHeight(surface.height, frame, surfaceId(surface.id)),
            }
          : {}),
      }),
    ),
    walkable: local.walkable.map(surfaceId),
  };
}

/*
 * Re-express a model-local height rule in a world pose that preserves its kind.
 */
function placeHeight(
  rule: IAutoMovieHeightRule,
  frame: IAutoMovieTransform,
  id: string,
): IAutoMovieHeightRule {
  switch (rule.kind) {
    case "constant":
      return { kind: "constant", value: rule.value + frame.translation.y };
    case "plane": {
      // A yaw rotates the gradient. The transformed local origin supplies its height datum.
      const slope: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
        x: rule.slopeX,
        y: 0,
        z: rule.slopeZ,
      });
      return {
        kind: "plane",
        originHeight:
          rule.originHeight +
          frame.translation.y -
          slope.x * frame.translation.x -
          slope.z * frame.translation.z,
        slopeX: slope.x,
        slopeZ: slope.z,
      };
    }
    case "heightfield":
      if (frame.rotation.y !== 0)
        throw new Error(
          `${id}.height: place a turned lattice in world coordinates`,
        );
      return {
        ...rule,
        originX: rule.originX + frame.translation.x,
        originZ: rule.originZ + frame.translation.z,
        samples: rule.samples.map(
          (height: number): number => height + frame.translation.y,
        ),
      };
  }
}
