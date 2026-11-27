import {
  AutoMovieHumanoidSurfaceRays,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountRider } from "./HumanMountRider";
import type { HumanRideHands } from "./HumanRideHands";

/*
 * How deep a hand's palm skin lies below its palm socket at the station a
 * holding hand closes on: `HumanMountRider.CENTRE` hand lengths along the
 * fingers from the palm socket, measured along the palm's normal to the body's
 * own skin. A ride's round articulated handle is held at this depth
 * (`HumanRideHands`).
 * Parameter body: The body.
 * Parameter side: The hand.
 * Parameter surfaces: The body's surface rays at rest, built once by the caller.
 * Returns: The depth, metres.
 */
export function measureRidePalmDepth(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  surfaces: ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools>,
): number {
  const palm: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"];
  const bone: IAutoMovieResolvedBone = surfaces.at(palm.bone);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    bone.worldRotation,
    palm.normal,
  );
  const fingers: IAutoMovieVector3 = Quaternion.rotateVector(
    bone.worldRotation,
    palm.forward!,
  );
  const station: IAutoMovieVector3 = Vector3.add(
    bone.worldPosition,
    Vector3.scale(fingers, HumanMountRider.CENTRE * body.measure.hand),
  );
  const skin: IAutoMovieVector3 = surfaces.exit(palm.bone, station, normal);
  return Vector3.dot(Vector3.subtract(skin, station), normal);
}

/*
 * The ride's handles' palm depths (`measureRidePalmDepth`).
 */
export namespace measureRidePalmDepth {
  /*
   * Measure, once, the palm depth of every holding hand whose handle is a round
   * riding handle on a fixed seat and declares no depth of its own: the depth
   * is set on the handle.
   * Parameter body: The body.
   * Parameter handles: The ride's handles by hand.
   * Parameter holding: The hands that hold.
   * Parameter fixedSeat: Whether the rider sits a fixed seat.
   */
  export function handles(
    body: IAutoMovieMotionHumanBody,
    handles: Partial<Record<AutoMovieHumanSide, HumanRideHands.IHandle>>,
    holding: readonly AutoMovieHumanSide[],
    fixedSeat: boolean,
  ): void {
    const rounded: AutoMovieHumanSide[] = holding.filter(
      (side: AutoMovieHumanSide): boolean => {
        const held: HumanRideHands.IHandle = handles[side]!;
        const a: IAutoMovieAffordance | undefined = held.affordance;
        return (
          fixedSeat &&
          held.palmDepth === undefined &&
          a?.kind === "handle" &&
          a.rides !== undefined &&
          a.symmetry === "round" &&
          a.aperture !== undefined
        );
      },
    );
    if (rounded.length === 0) return;
    const surfaces: ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools> =
      AutoMovieHumanoidSurfaceRays.tools(body.skeleton, body.profile);
    for (const side of rounded)
      handles[side]!.palmDepth = measureRidePalmDepth(body, side, surfaces);
  }
}
