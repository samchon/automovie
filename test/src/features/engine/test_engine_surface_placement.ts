
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieHumanoidSurfaces, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/**
 * Actual surface field demands retain the same rigid bone-local placement.
 *
 * Scenarios:
 * 1. A Y90 bone at(10,20,30) carries local point(2,3,4) to(14,23,28),
 *    local normal+X to-Z and forward+Z to+X. Full and demanded public
 *    entries must realize those hand-derived coordinates.
 * 2. Point-only placement never observes a throwing normal/forward; the
 *    point/normal pair never observes forward and owns exactly those fields.
 *    Normal-only placement never observes point, parent position or forward.
 * 3. Editing returned vectors cannot change source local geometry or later
 *    outputs. Editing the current bone quaternion/position does affect the
 *    next query, even when the same source objects are reused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines metres, the local/world rigid equation, explicit cardinal orientation, field demand, live input lifetime and fresh output ownership in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the existing public surface namespace point, normal, pointNormal and place entries on owned admitted frame data. Throwing unused point/position/direction getters distinguish actual required fields; literal world coordinates distinguish incorrect or stale transforms. Changes target owned input/output records only.
 * @evidence contracts/development/testing.md#independent-expectations Right-handed Y90 maps(x,y,z) to(z,y,-x); translation then gives(14,23,28). Identity with changed origin(-3,20,30) gives(-1,23,34) and leaves normal+X unchanged. Tolerance1e-12 covers binary64 half-angle rotation arithmetic at tens of metres, without substituting a cold production result as the expected transform.
 */
export function test_engine_surface_placement(): void {
  const half: number = Math.SQRT1_2;
  const rotation: IAutoMovieQuaternion = { x: 0, y: half, z: 0, w: half };
  const origin: IAutoMovieVector3 = { x: 10, y: 20, z: 30 };
  const bone: Parameters<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace>[1] = { worldPosition: origin, worldRotation: rotation };
  const local: IAutoMovieVector3 = { x: 2, y: 3, z: 4 };
  const frame: IAutoMovieHumanoidSurfaces.IFrame = { bone: "head", point: local, normal: { x: 1, y: 0, z: 0 }, forward: { x: 0, y: 0, z: 1 } };
  const pairFrame: IAutoMovieHumanoidSurfaces.IFrame = { ...frame,
    get forward(): never { throw new Error("point/normal does not demand forward"); },
  };
  const pointFrame: IAutoMovieHumanoidSurfaces.IFrame = { ...frame,
    get normal(): never { throw new Error("point does not demand normal"); },
    get forward(): never { throw new Error("point does not demand forward"); },
  };
  const normalFrame: IAutoMovieHumanoidSurfaces.IFrame = { ...frame,
    get point(): never { throw new Error("normal does not demand point"); },
    get forward(): never { throw new Error("normal does not demand forward"); },
  };
  const normalBone: Parameters<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace>[1] = { worldRotation: rotation,
    get worldPosition(): never { throw new Error("normal does not demand parent position"); },
  };
  const normal: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaceNormal(normalFrame, normalBone);
  const complete: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace> = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(frame, bone);
  const pair: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal> = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(pairFrame, bone);
  const point: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(pointFrame, bone);
  const expected: IAutoMovieVector3 = { x: 14, y: 23, z: 28 };
  TestValidator.predicate("actual surface fields follow the literal Y90 rigid transform",
    vclose(complete.point, expected, 1e-12) && vclose(pair.point, expected, 1e-12) && vclose(point, expected, 1e-12) &&
    vclose(complete.normal, { x: 0, y: 0, z: -1 }, 1e-12) && vclose(pair.normal, { x: 0, y: 0, z: -1 }, 1e-12) &&
    vclose(normal, { x: 0, y: 0, z: -1 }, 1e-12) &&
    complete.forward !== undefined && vclose(complete.forward, { x: 1, y: 0, z: 0 }, 1e-12));
  TestValidator.equals("the demanded pair owns only point and normal", Object.keys(pair), ["point", "normal"]);
  pair.point.x = 777;
  pair.normal.y = 888;
  normal.y = 555;
  complete.forward!.z = 999;
  const again: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal> = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(pairFrame, bone);
  const normalAgain: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaceNormal(normalFrame, normalBone);
  TestValidator.predicate("every placement owns its wrapper and nested values without repairing earlier outputs",
    again !== pair && again.point !== pair.point && again.normal !== pair.normal && point !== local &&
    normalAgain !== normal && normalAgain !== frame.normal && normalAgain !== again.normal &&
    vclose(normalAgain, { x: 0, y: 0, z: -1 }, 1e-12) && Object.is(normal.y, 555) &&
    vclose(again.point, expected, 1e-12) && vclose(again.normal, { x: 0, y: 0, z: -1 }, 1e-12) &&
    Object.is(pair.point.x, 777) && Object.is(pair.normal.y, 888) && Object.is(complete.forward!.z, 999) &&
    vclose(local, { x: 2, y: 3, z: 4 }, 0) && vclose(frame.normal, { x: 1, y: 0, z: 0 }, 0) &&
    vclose(frame.forward!, { x: 0, y: 0, z: 1 }, 0));
  rotation.y = 0;
  rotation.w = 1;
  origin.x = -3;
  const moved: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal> = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(pairFrame, bone);
  TestValidator.predicate("same-object current bone changes cannot replay a previous placed surface",
    vclose(moved.point, { x: -1, y: 23, z: 34 }, 1e-12) && vclose(moved.normal, { x: 1, y: 0, z: 0 }, 1e-12) &&
    vclose(again.point, expected, 1e-12) && vclose(normalAgain, { x: 0, y: 0, z: -1 }, 1e-12) &&
    vclose(AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaceNormal(normalFrame, normalBone), { x: 1, y: 0, z: 0 }, 1e-12));
}
