import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The mass center a supported body's floor load is balanced about. */
export namespace PhysicalSupportLoads {
  /** The mass center of a frame's segments, metres. */
  export function center(
    profile: IAutoMoviePhysicalProfile,
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): IAutoMovieVector3 {
    return profile.segments.reduce(
      (
        sum: IAutoMovieVector3,
        segment: IAutoMoviePhysicalSegment,
      ): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(
          sum,
          AutoMovieEngineVector3.scale(
            AutoMovieEngineVector3.add(
              poses[segment.bone]!.position,
              AutoMovieEngineQuaternion.rotateVector(
                poses[segment.bone]!.rotation,
                segment.centerOfMass,
              ),
            ),
            segment.mass / profile.mass,
          ),
        ),
      { x: 0, y: 0, z: 0 },
    );
  }
}
