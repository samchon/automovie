import { AutoMovieEngineQuaternion, AutoMovieEngineTransform, AutoMovieEngineVector3, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConvexSpaceCell,
  IAutoMovieHalfSpacePlane,
  IAutoMovieModel,
  IAutoMovieProfilePoint,
  IAutoMovieRegionTriangulation,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { buildingPlans } from "./buildingPlans";
import { buildingRegionModel } from "./buildingRegionModel";

/*
 * Record the logical enclosure, staged slabs and support of one admitted room.
 */
export function emitBuildingRoom(
  environment: IAutoMovieBuiltEnvironment,
  anchors: Record<string, IAutoMovieTransform>,
  parent: string,
  level: buildingPlans.ILevel,
  room: buildingPlans.IRoom,
  thickness: number,
  color: string,
  root: IAutoMovieTransform,
): void {
  const name: string = `${level.id}/${room.id}`;
  const region: buildingPlans.IRegion = room.floor ?? room.region;
  const origin: IAutoMovieVector3 = AutoMovieEngineVector3.create(
    room.support.anchor.x,
    level.elevation,
    room.support.anchor.y,
  );
  const world: IAutoMovieTransform = AutoMovieEngineTransform.of(
    AutoMovieEngineFilm.placeTransformedPoint(root, origin),
    root.rotation,
  );
  anchors[name] = world;
  const rings: IAutoMovieVector3[][] = room.support.rings.map(
    (ring: IAutoMovieProfilePoint[]): IAutoMovieVector3[] =>
      ring.map(
        (point: IAutoMovieProfilePoint): IAutoMovieVector3 =>
          AutoMovieEngineFilm.placeTransformedPoint(
            root,
            AutoMovieEngineVector3.create(point.x, level.elevation, point.y),
          ),
      ),
  );
  environment.spaces.push({
    id: name,
    kind: "room",
    parent,
    cells: prismCells(room.region.region, root, level.elevation, level.height),
  });
  const floorId: string = `${environment.id}/${name}/floor`;
  environment.surfaces.push({
    space: name,
    surface: {
      id: floorId,
      kind: "floor",
      polygon: rings[0]!,
      ...(rings.length === 1 ? {} : { holes: rings.slice(1) }),
      height: { kind: "constant", value: world.translation.y },
    },
  });
  environment.walkable.push(floorId);
  const slabs: ReadonlyArray<
    readonly [string, number, buildingPlans.IRegion, string]
  > = [
    ["floor", level.elevation - thickness / 2, region, FLOOR_COLOR],
    [
      "ceiling",
      level.elevation + level.height + thickness / 2,
      room.ceiling ?? room.region,
      color,
    ],
  ];
  const rotation: IAutoMovieTransform["rotation"] = AutoMovieEngineQuaternion.fromAxisAngle(
    AutoMovieEngineVector3.create(1, 0, 0),
    90,
  );
  for (const [kind, y, plate, swatch] of slabs) {
    const id: string = `${name}/${kind}`;
    const model: IAutoMovieModel = buildingRegionModel(
      `${environment.id}/${id}`,
      kind,
      plate.rings,
      thickness,
      swatch,
    );
    environment.models.push(model);
    environment.elements.push({
      id,
      kind,
      parent,
      space: name,
      transform: AutoMovieEngineTransform.of(AutoMovieEngineVector3.create(0, y, 0), rotation),
      model: model.id,
    });
  }
}

/*
 * A neutral floor finish independent of the wall swatch.
 */
const FLOOR_COLOR: string = "#918575";

/*
 * Convert a positive region triangulation into convex world-space prisms with
 * exact plan coverage.
 */
function prismCells(
  region: IAutoMovieRegionTriangulation,
  root: IAutoMovieTransform,
  bottom: number,
  height: number,
): IAutoMovieConvexSpaceCell[] {
  const points: IAutoMovieVector3[] = region.points.map(
    (point: IAutoMovieProfilePoint): IAutoMovieVector3 =>
      AutoMovieEngineFilm.placeTransformedPoint(root, AutoMovieEngineVector3.create(point.x, bottom, point.y)),
  );
  const y: number = root.translation.y + bottom;
  const cells: IAutoMovieConvexSpaceCell[] = [];
  for (let index: number = 0; index < region.triangles.length; index += 3) {
    const planes: IAutoMovieHalfSpacePlane[] = [
      { normal: AutoMovieEngineVector3.create(0, -1, 0), offset: -y },
      { normal: AutoMovieEngineVector3.create(0, 1, 0), offset: y + height },
    ];
    for (let edge: number = 0; edge < 3; ++edge) {
      const a: IAutoMovieVector3 = points[region.triangles[index + edge]!]!;
      const b: IAutoMovieVector3 =
        points[region.triangles[index + ((edge + 1) % 3)]!]!;
      const direction: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b, a);
      const length: number = Math.hypot(direction.x, direction.z);
      const normal: IAutoMovieVector3 = AutoMovieEngineVector3.create(
        direction.z / length,
        0,
        -direction.x / length,
      );
      planes.push({ normal, offset: AutoMovieEngineVector3.dot(normal, a) });
    }
    cells.push({ id: String(index / 3), planes });
  }
  return cells;
}
