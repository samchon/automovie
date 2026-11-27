import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";

/*
 * Place an admitted bone-local surface frame in the bone's world frame.
 * Point/normal reads precede the optional forward read as in the original full
 * placement. Every returned vector and wrapper is caller-owned.
 */
export namespace AutoMovieHumanoidSurfacePlacement {
  /*
   * Place the admitted frame, including its optional forward vector.
   */
  export function run(
    frame: IFrame,
    bone: IBone,
  ): {
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    forward?: IAutoMovieVector3;
  } {
    const placed: ReturnType<typeof AutoMovieHumanoidSurfacePlacement.run> =
      AutoMovieHumanoidSurfacePlacement.pointNormal(frame, bone);
    if (frame.forward !== undefined)
      placed.forward = AutoMovieEngineQuaternion.rotateVector(
        bone.worldRotation,
        frame.forward,
      );
    return placed;
  }

  /*
   * Field projections of the same local-to-world surface placement.
   */
  /*
   * Fresh world point in metres, with no direction reads. Parent-position
   * reference is read before rotation; its XYZ sums follow the same order.
   */
  export function point(frame: IFrame, bone: IBone): IAutoMovieVector3 {
    const origin: IAutoMovieVector3 = bone.worldPosition;
    const placed: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      bone.worldRotation,
      frame.point,
    );
    placed.x = origin.x + placed.x;
    placed.y = origin.y + placed.y;
    placed.z = origin.z + placed.z;
    return placed;
  }

  /*
   * Fresh world normal; no point, parent position or forward field is observed.
   */
  export function normal(
    frame: Pick<IFrame, "normal">,
    bone: Pick<IBone, "worldRotation">,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(bone.worldRotation, frame.normal);
  }

  /*
   * Fresh world point/normal only; forward is not observed.
   */
  export function pointNormal(
    frame: IFrame,
    bone: IBone,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    return {
      point: point(frame, bone),
      normal: normal(frame, bone),
    };
  }
}

/*
 * Existing bone-local surface data; geometry and direction admission belongs to
 * its producer.
 */
type IFrame = IAutoMovieHumanoidSurfaces.IFrame;

/*
 * The actual current placement fields read by every surface projection.
 */
type IBone = Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">;
