import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieSurface,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { buildingPlans } from "./buildingPlans";
import { createPassage } from "./createPassage";

/** Add a planned interior stair to the building that owns its two cut slabs. */
export function emitBuildingStair(
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  buildingFrame: IAutoMovieTransform,
  stair: buildingPlans.IStair,
): void {
  const key: string = `stairs/${stair.id}`;
  const makeStair: IAutoMovieEnvironmentModule = createPassage({
    kind: "stairs",
    from: "lower",
    to: "upper",
    width: stair.width,
    steps: stair.steps,
  });
  const localSpan: IAutoMovieEnvironmentContribution = makeStair({
    id: `${environment.id}/${key}`,
    seed: undefined,
    frame: Transform.identity(),
    anchor: (name: string): IAutoMovieTransform => ({
      ...Transform.identity(),
      translation: stair.endpoints[name === "lower" ? 0 : 1],
    }),
  });
  environment.models.push(...(localSpan.models ?? []));
  const elements: string[] = [];
  for (const piece of localSpan.set ?? []) {
    const id: string = piece.node.slice(environment.id.length + 1);
    elements.push(id);
    environment.elements.push({
      id,
      kind: "stair",
      parent: root,
      transform: Transform.of(
        piece.position,
        piece.rotation ?? Quaternion.identity(),
      ),
      model: piece.model,
      space: stair.rooms[0],
    });
  }
  /**
   * Place a building-local tread or connector coordinate in the scene's fixed
   * frame.
   */
  const toWorld = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      buildingFrame.translation,
      Quaternion.rotateVector(buildingFrame.rotation, point),
    );
  for (const space of localSpan.spaces ?? [])
    for (const surface of space.surfaces) {
      if (surface.anchor === undefined)
        throw new Error(
          `stair "${stair.id}" did not produce flat tread support`,
        );
      const support: IAutoMovieSurface = {
        ...surface,
        polygon: surface.polygon.map(toWorld),
        anchor: toWorld(surface.anchor),
      };
      environment.surfaces.push({ space: stair.rooms[0], surface: support });
      environment.walkable.push(support.id);
    }
  const [from, to] = stair.endpoints;
  environment.connectors.push({
    id: key,
    kind: "stair",
    from: stair.rooms[0],
    to: stair.rooms[1],
    bidirectional: true,
    width: stair.width,
    clearHeight: stair.clearHeight,
    route: [toWorld(from), toWorld(to)],
    steps: {
      count: stair.steps,
      rise: (to.y - from.y) / stair.steps,
      run: Math.hypot(to.x - from.x, to.z - from.z) / stair.steps,
    },
    elements,
  });
}
