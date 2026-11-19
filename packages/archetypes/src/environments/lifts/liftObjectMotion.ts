import { Vector3, builtConnectorCarriagePlacements } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieClip,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { createElevator } from "../../architecture/createElevator";
import { ArchetypeFrame } from "../../core/ArchetypeFrame";
import type { createLift } from "./createLift";
import type { liftStopHeights } from "./liftStopHeights";

/**
 * Bake the staged cab and sliding door panels into one ordinary object clip.
 * The first cab pose comes from the checked building connector. Every other
 * pose is its rigid displacement along the same resolved shaft. Keys are
 * shot-local seconds. Translation is linear between keys and holds at
 * either endpoint. There is no physics or platform motion simulation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source pose, clock, channels, interpolation and endpoint behavior.
 * @evidence contracts/development/implementation.md#principled-implementation All keyed transforms use the admitted local sill heights and the exact source slider travel along its +X axis. Linear weights keep closed doors closed during travel and preserve a static open plateau at stops.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The clip writes flat stage-node tracks, including constant rotation for the existing carrier sampling path. Geometry and timing admission happen before this step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fake moving support or duplicated time sampler; ordinary track sampling drives the cab and its entire stage frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the current built placement once. Per active landing and cab door it takes O(K) work to lower K keys. Never-open landings stay as staged and need no tracks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same canonical records drive the display and the motion consumers. Tracks reuse one array of times and share one constant yaw per node.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain tracks bounded by schedule keys times participating nodes, with no process or external resources.
 */
export function liftObjectMotion(
  environment: IAutoMovieBuiltEnvironment,
  car: ReturnType<typeof createElevator>,
  stops: readonly liftStopHeights.IStop[],
  schedule: readonly createLift.IKey[],
  gap: number,
): IAutoMovieClip {
  const firstState: createLift.IKey = schedule[0]!;
  const firstPlacement = builtConnectorCarriagePlacements(
    environment,
    "travel",
  )[0]!;
  const frame: IAutoMovieTransform = {
    translation: firstPlacement.position,
    rotation: firstPlacement.rotation,
    scale: firstPlacement.scale,
  };
  const heights: Map<string, number> = new Map(
    stops.map(({ id, height }) => [id, height]),
  );
  const firstHeight: number = heights.get(firstState.stop)!;
  const atHeight = (id: string): number => heights.get(id)! - firstHeight;
  const translation = (point: IAutoMovieVector3): number[] => [
    point.x,
    point.y,
    point.z,
  ];
  const times: number[] = schedule.map(({ seconds }): number => seconds);
  const tracks: IAutoMovieTrack[] = [];
  const append = (node: string, values: number[]): void => {
    const { x, y, z, w } = frame.rotation;
    tracks.push(
      {
        channel: { kind: "node", node, path: "translation" },
        times,
        values,
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node, path: "rotation" },
        times: [0],
        values: [x, y, z, w],
        interpolation: "linear",
      },
    );
  };
  append(
    firstPlacement.node,
    schedule.flatMap(({ stop }): number[] =>
      translation(
        ArchetypeFrame.point(frame, Vector3.create(0, atHeight(stop), 0)),
      ),
    ),
  );
  const visited: Set<string> = new Set(
    schedule
      .filter(({ doors }): boolean => doors === "open")
      .map(({ stop }): string => stop),
  );
  for (const door of ["leftDoor", "rightDoor"] as const) {
    const slider = car.affordance(door);
    const sweep: IAutoMovieVector3 = Vector3.scale(
      ArchetypeFrame.axis(slider.frame, "x"),
      slider.travel!,
    );
    append(
      `${firstPlacement.node}/${door}`,
      schedule.flatMap(({ doors, stop }): number[] =>
        translation(
          ArchetypeFrame.point(
            frame,
            Vector3.add(
              Vector3.create(0, atHeight(stop), 0),
              Vector3.scale(sweep, doors === "open" ? 1 : 0),
            ),
          ),
        ),
      ),
    );
    for (const stop of visited) {
      const rest: IAutoMovieVector3 = Vector3.create(0, atHeight(stop), gap);
      append(
        `${environment.id}/stops/${stop}/doors/${door}`,
        schedule.flatMap((key): number[] =>
          translation(
            ArchetypeFrame.point(
              frame,
              Vector3.add(
                rest,
                Vector3.scale(
                  sweep,
                  key.stop === stop && key.doors === "open" ? 1 : 0,
                ),
              ),
            ),
          ),
        ),
      );
    }
  }
  return {
    id: `${environment.id}/motion`,
    name: "Lift",
    duration: times[times.length - 1]!,
    loop: false,
    tracks,
  };
}
