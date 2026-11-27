import type {
  IAutoMovieRenderSoftPropFrame,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieSceneSoftProps } from "../IAutoMovieSceneSoftProps.js";
import type { IAutoMovieSoftBodyObject } from "../IAutoMovieSoftBodyObject.js";
import { applyAutoMovieShadowParticipation } from "./applyAutoMovieShadowParticipation.js";
import { buildSoftBodyObject } from "./buildSoftBodyObject.js";
import { AutoMovieCollisionSource } from "../AutoMovieCollisionSource.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";
import { softPropCordSurface } from "./softPropCordSurface.js";

/*
 * Own a scene's soft props without retaining film samples. Each update supplies
 * the already evaluated world-space surfaces for one instant.
 */
export function buildSceneSoftProps(
  scene: THREE.Scene,
): IAutoMovieSceneSoftProps {
  const mounted: Map<string, IAutoMovieSoftBodyObject> = new Map();
  let closed: boolean = false;
  return {
    update: (frames: readonly IAutoMovieRenderSoftPropFrame[]): void => {
      if (closed) throw new Error("The scene's soft props are closed.");
      const incoming: Map<string, IAutoMovieRenderSoftPropFrame> = new Map();
      const cords: Map<string, AutoMovieCollisionSource.ICord | null> =
        new Map();
      for (const frame of frames) {
        if (frame.subject.trim() === "" || incoming.has(frame.subject))
          throw new Error(
            `Invalid or repeated soft prop subject "${frame.subject}".`,
          );
        const surface: IAutoMovieSoftBodySurface =
          frame.cordRadius === undefined
            ? frame.surface
            : softPropCordSurface(frame.surface, frame.cordRadius);
        incoming.set(frame.subject, { ...frame, surface });
        cords.set(
          frame.subject,
          frame.cordRadius === undefined || surface === frame.surface
            ? null
            : cordParticles(frame.surface.mesh.positions, frame.cordRadius),
        );
      }

      for (const [subject, frame] of incoming) {
        const previous: IAutoMovieSoftBodyObject | undefined =
          mounted.get(subject);
        if (previous !== undefined) previous.update(frame);
        else {
          const projection: IAutoMovieSoftBodyObject =
            buildSoftBodyObject(frame);
          projection.object.name = `soft:${subject}`;
          mounted.set(subject, projection);
          applyAutoMovieShadowParticipation(projection.object);
          scene.add(projection.object);
        }
        // Placed collision checks read the same particles the tube was drawn through.
        AutoMovieCollisionSource.bindCord(
          mounted.get(subject)!.object,
          cords.get(subject) ?? null,
        );
      }

      const removals: (() => void)[] = [];
      for (const [subject, projection] of mounted)
        if (!incoming.has(subject)) {
          mounted.delete(subject);
          removals.push((): void => {
            scene.remove(projection.object);
          }, projection.dispose);
        }
      restoreAutoMovieRenderModeState(removals);
    },
    dispose: restoreAutoMovieRenderModeOnce((): void => {
      closed = true;
      const removals: (() => void)[] = [];
      for (const projection of mounted.values())
        removals.push((): void => {
          scene.remove(projection.object);
        }, projection.dispose);
      mounted.clear();
      restoreAutoMovieRenderModeState(removals);
    }),
  };
}

/*
 * Consecutive distinct particles, matching the rings softPropCordSurface draws.
 */
function cordParticles(
  positions: readonly number[],
  radius: number,
): AutoMovieCollisionSource.ICord {
  const points: number[] = [];
  for (let offset: number = 0; offset + 2 < positions.length; offset += 3) {
    const n: number = points.length;
    if (
      n !== 0 &&
      points[n - 3] === positions[offset] &&
      points[n - 2] === positions[offset + 1] &&
      points[n - 1] === positions[offset + 2]
    )
      continue;
    points.push(
      positions[offset]!,
      positions[offset + 1]!,
      positions[offset + 2]!,
    );
  }
  return { radius, points };
}
