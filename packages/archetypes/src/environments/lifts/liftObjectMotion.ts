import { AutoMovieEngineBuiltEnvironment, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieClip,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { AutoMovieArchetypeElevator } from "../../architecture/AutoMovieArchetypeElevator";
import type { AutoMovieEnvironment } from "../AutoMovieEnvironment";
import type { liftStopHeights } from "./internal/liftStopHeights";

/**
 * Bake the staged cab and sliding door panels into one ordinary object clip.
 * The first cab pose comes from the checked building connector. Every other
 * pose is its rigid displacement along the same resolved shaft. Keys are
 * shot-local seconds. Translation is linear between keys and holds at either
 * endpoint. There is no physics or platform motion simulation.
 */
export function liftObjectMotion(
  environment: IAutoMovieBuiltEnvironment,
  car: ReturnType<typeof AutoMovieArchetypeElevator.create>,
  stops: readonly liftStopHeights.IStop[],
  schedule: readonly AutoMovieEnvironment.ILiftKey[],
  gap: number,
): IAutoMovieClip {
  const firstState: AutoMovieEnvironment.ILiftKey =
    schedule[0]!;
  const firstPlacement =
    AutoMovieEngineBuiltEnvironment.connectorCarriagePlacements(
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
        AutoMovieArchetypeFrame.point(
          frame,
          Vector3.create(0, atHeight(stop), 0),
        ),
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
      AutoMovieArchetypeFrame.axis(slider.frame, "x"),
      slider.travel!,
    );
    append(
      `${firstPlacement.node}/${door}`,
      schedule.flatMap(({ doors, stop }): number[] =>
        translation(
          AutoMovieArchetypeFrame.point(
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
            AutoMovieArchetypeFrame.point(
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
