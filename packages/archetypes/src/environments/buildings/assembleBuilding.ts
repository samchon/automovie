import {
  Quaternion,
  Vector3,
  buildAutoMovieWall,
  builtBoundaryWallCut,
  convexHull2D,
  lowerBuiltEnvironment,
  placeTransformedPoint,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieClip,
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePlanarPoint,
  IAutoMovieProfilePoint,
  IAutoMoviePropSpec,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { buildingDoor } from "./buildingDoor";
import { buildingModel } from "./buildingModel";
import type { buildingPlans } from "./buildingPlans";
import { buildingRegionModel } from "./buildingRegionModel";
import { buildingWalls } from "./buildingWalls";
import { emitBuildingRoom } from "./emitBuildingRoom";
import { emitBuildingStair } from "./emitBuildingStair";

/** Root element and root space share this identity in their independent tables. */
const ROOT: string = "structure";

/** Optional scene records assembled from the checked source geometry. */
interface IAssembly {
  /** One building graph and its visible model inventory. */
  environment: IAutoMovieBuiltEnvironment;

  /** Module-local names of world-space attachment frames. */
  anchors: Record<string, IAutoMovieTransform>;

  /** Live leaf placements, whose model and node identities agree. */
  props: IAutoMoviePropSpec[];

  /** Scene-node rotation clips for the leaf's authored motion. */
  clips: IAutoMovieClip[];
}

/**
 * Lower an admitted upright building plan to normal stage, runtime and anchor
 * records.
 */
export function assembleBuilding(
  plan: buildingPlans.IPlan,
  context: IAutoMovieEnvironmentModule.IContext,
): IAutoMovieEnvironmentContribution {
  const assembly: IAssembly = {
    environment: {
      id: context.id,
      version: 1,
      units: "meter",
      buildings: [{ id: ROOT, element: ROOT, space: ROOT }],
      models: [],
      modelReferences: [],
      elements: [
        {
          id: ROOT,
          kind: "building",
          parent: null,
          transform: context.frame,
          model: null,
          space: ROOT,
        },
      ],
      spaces: [{ id: ROOT, kind: "building", parent: null, cells: [] }],
      surfaces: [],
      walkable: [],
      boundaries: [],
      openings: [],
      connectors: [],
    },
    anchors: Object.create(null),
    props: [],
    clips: [],
  };
  if (plan.kind === "facade") {
    const model: IAutoMovieModel = buildingRegionModel(
      context.id + "/facade",
      "facade",
      plan.region.rings,
      plan.height,
      plan.color,
    );
    addElement(
      assembly,
      "facade",
      "facade",
      ROOT,
      horizontalPlate(plan.height / 2),
      model,
    );
  } else {
    for (const level of plan.levels) {
      for (const room of level.rooms)
        emitBuildingRoom(
          assembly.environment,
          assembly.anchors,
          ROOT,
          level,
          room,
          plan.slab,
          plan.color,
          context.frame,
        );
      const walls: buildingWalls.IWall[] = buildingWalls(level);
      for (const wall of walls)
        addWall(assembly, level, wall, plan.wall, plan.color, context);
      addWallJoints(assembly, level, walls, plan.wall, plan.color);
    }
    for (const stair of plan.stairs) {
      emitBuildingStair(assembly.environment, ROOT, context.frame, stair);
      assembly.anchors[`stairs/${stair.id}/from`] =
        AutoMovieArchetypeFrame.compose(
          context.frame,
          frame(stair.endpoints[0]),
        );
      assembly.anchors[`stairs/${stair.id}/to`] =
        AutoMovieArchetypeFrame.compose(
          context.frame,
          frame(stair.endpoints[1]),
        );
    }
  }
  return {
    ...lowerBuiltEnvironment(assembly.environment),
    anchors: assembly.anchors,
    ...(assembly.props.length === 0 ? {} : { props: assembly.props }),
    ...(assembly.clips.length === 0 ? {} : { objectMotions: assembly.clips }),
  };
}

/**
 * Record one shared or exterior wall and pass its owned apertures to the mesh
 * kernel.
 */
function addWall(
  assembly: IAssembly,
  level: buildingPlans.ILevel,
  wall: buildingWalls.IWall,
  thickness: number,
  color: string,
  context: IAutoMovieEnvironmentModule.IContext,
): void {
  const dx: number = wall.to.x - wall.from.x;
  const dz: number = wall.to.y - wall.from.y;
  const width: number = Math.hypot(dx, dz);
  const local: IAutoMovieTransform = frame(
    Vector3.create(wall.from.x, level.elevation, wall.from.y),
    Quaternion.fromAxisAngle(
      Vector3.create(0, 1, 0),
      Math.atan2(-dz, dx) / Quaternion.DEG2RAD,
    ),
  );
  const world: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    context.frame,
    local,
  );
  const id: string = `${level.id}/wall/${wall.key}`;
  const spaces: string[] = [wall.left, wall.right].flatMap(
    (room: string | null): string[] =>
      room === null ? [] : [`${level.id}/${room}`],
  );
  assembly.environment.boundaries.push({
    id,
    kind: spaces.length === 1 ? "exterior" : "partition",
    spaces,
    elements: [id],
    face: {
      origin: world.translation,
      rotation: world.rotation,
      thickness,
      outline: rectangle(0, 0, width, level.height),
    },
  });
  for (const binding of wall.openings)
    addOpening(assembly, level, id, width, thickness, binding, local, context);
  const cut: ReturnType<typeof builtBoundaryWallCut> = builtBoundaryWallCut(
    assembly.environment,
    id,
  );
  const center: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    local,
    frame(Vector3.create(width / 2, level.height / 2, 0)),
  );
  addElement(
    assembly,
    id,
    "wall",
    spaces[0]!,
    center,
    buildingModel(
      `${context.id}/${id}`,
      "wall",
      { type: "mesh", mesh: buildAutoMovieWall(cut) },
      color,
    ),
  );
}

/**
 * Resolve a single wall cut into an aperture, named sill, and optional moving
 * leaf.
 */
function addOpening(
  assembly: IAssembly,
  level: buildingPlans.ILevel,
  wall: string,
  wallWidth: number,
  thickness: number,
  binding: buildingWalls.IBinding,
  local: IAutoMovieTransform,
  context: IAutoMovieEnvironmentModule.IContext,
): void {
  const { opening, turn } = binding;
  const leafKey: string = `${level.id}/${opening.id}`;
  const id: string = `${context.id}/${leafKey}`;
  const room: string = `${level.id}/${opening.between[0]}`;
  const door: buildingDoor.IDoor | null =
    opening.kind === "door"
      ? buildingDoor(
          id,
          opening,
          context.seed === undefined
            ? undefined
            : JSON.stringify([context.seed, leafKey]),
        )
      : null;
  const width: number = opening.kind === "door" ? door!.width : opening.width;
  const height: number =
    opening.kind === "door" ? door!.height : opening.height;
  const sill: number = opening.kind === "window" ? opening.sill : 0;
  const shift: number = opening.offset ?? 0;
  const center: number = wallWidth / 2 + (turn ? -shift : shift);
  if (
    !Number.isFinite(center) ||
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isFinite(sill) ||
    sill < 0 ||
    sill + height >= level.height ||
    center - width / 2 <= thickness / 2 ||
    center + width / 2 >= wallWidth - thickness / 2
  )
    throw new Error(
      `opening "${id}" does not fit its wall's width, clear height or end joints`,
    );
  const facing: IAutoMovieQuaternion = turn
    ? Quaternion.fromAxisAngle(Vector3.create(0, 1, 0), 180)
    : Quaternion.identity();
  const datum: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    local,
    frame(Vector3.create(center, sill, 0), facing),
  );
  const world: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    context.frame,
    datum,
  );
  assembly.anchors[leafKey] = world;
  const clearWidth: number = door?.clearWidth ?? width;
  const clearHeight: number = door?.clearHeight ?? height;
  const clearCenter: number = door?.clearCenter ?? 0;
  if (opening.kind !== "window")
    for (const [edge, x, y] of [
      ["left", clearCenter - clearWidth / 2, 0],
      ["right", clearCenter + clearWidth / 2, 0],
      ["head", clearCenter, clearHeight],
    ] as const)
      assembly.anchors[`${leafKey}/clear/${edge}`] =
        AutoMovieArchetypeFrame.compose(world, frame(Vector3.create(x, y, 0)));
  assembly.environment.openings.push({
    id: leafKey,
    kind: opening.kind,
    boundary: wall,
    fill: door === null ? null : leafKey,
    profile: { outline: rectangle(center - width / 2, sill, width, height) },
  });
  let availableFrom: number | undefined;
  if (opening.kind === "door" && door !== null) {
    addElement(
      assembly,
      `${leafKey}/frame`,
      "door frame",
      room,
      datum,
      door.fixed,
    );
    addElement(
      assembly,
      leafKey,
      "door leaf",
      room,
      AutoMovieArchetypeFrame.compose(datum, frame(door.pivot)),
      door.leaf,
    );
    assembly.props.push({ node: id, model: door.leaf, articulation: null });
    const clip: IAutoMovieClip | null = door.clip(world.rotation);
    if (clip !== null) assembly.clips.push(clip);
    const swing: typeof opening.swing = opening.swing;
    if (swing === undefined || swing.degrees < 90) return;
    availableFrom = swing.from + (swing.to - swing.from) * (90 / swing.degrees);
  }
  if (opening.kind !== "window")
    addThreshold(
      assembly,
      leafKey,
      level.id,
      opening.between,
      world,
      thickness,
      clearWidth,
      clearCenter,
      clearHeight,
      availableFrom,
    );
}

/**
 * Let the opening's own clear footprint bridge the wall's depth at sill
 * elevation.
 */
function addThreshold(
  assembly: IAssembly,
  opening: string,
  level: string,
  between: readonly [string, string | null],
  world: IAutoMovieTransform,
  thickness: number,
  width: number,
  center: number,
  clearance: number,
  availableFrom: number | undefined,
): void {
  const id: string = `${assembly.environment.id}/${opening}/threshold`;
  const room: string = `${level}/${between[0]}`;
  assembly.environment.surfaces.push({
    space: room,
    surface: {
      id,
      kind: "floor",
      polygon: rectangle(
        center - width / 2,
        -thickness / 2,
        width,
        thickness,
      ).map(
        (point: IAutoMoviePlanarPoint): IAutoMovieVector3 =>
          placeTransformedPoint(world, Vector3.create(point.x, 0, point.y)),
      ),
      height: { kind: "constant", value: world.translation.y },
      ...(availableFrom === undefined ? {} : { availableFrom }),
    },
  });
  assembly.environment.walkable.push(id);
  if (between[1] !== null && availableFrom === undefined) {
    const connector: IAutoMovieBuiltConnector = {
      id: opening,
      kind: "passage",
      from: room,
      to: `${level}/${between[1]}`,
      bidirectional: true,
      route: [-thickness / 2, thickness / 2].map(
        (z: number): IAutoMovieVector3 =>
          placeTransformedPoint(world, Vector3.create(center, 0, z)),
      ),
      width,
      clearHeight: clearance,
      elements: [],
    };
    assembly.environment.connectors.push(connector);
  }
}

/** Build a beveled wall junction only where noncollinear edge caps meet. */
function addWallJoints(
  assembly: IAssembly,
  level: buildingPlans.ILevel,
  walls: readonly buildingWalls.IWall[],
  thickness: number,
  color: string,
): void {
  const points: Map<string, IAutoMovieVector3[]> = new Map();
  for (const wall of walls) {
    const dx: number = wall.to.x - wall.from.x;
    const dz: number = wall.to.y - wall.from.y;
    const halfOverLength: number = thickness / (2 * Math.hypot(dx, dz));
    for (const end of [wall.from, wall.to]) {
      const key: string = `${end.x},${end.y}`;
      const tips: IAutoMovieVector3[] = points.get(key) ?? [];
      tips.push(
        Vector3.create(
          end.x - dz * halfOverLength,
          0,
          end.y + dx * halfOverLength,
        ),
        Vector3.create(
          end.x + dz * halfOverLength,
          0,
          end.y - dx * halfOverLength,
        ),
      );
      points.set(key, tips);
    }
  }
  for (const [key, ends] of points) {
    const hull: IAutoMovieVector3[] = convexHull2D(ends);
    if (hull.length < 3) continue;
    const id: string = `${level.id}/joint/${key}`;
    addElement(
      assembly,
      id,
      "wall joint",
      null,
      horizontalPlate(level.elevation + level.height / 2),
      buildingRegionModel(
        `${assembly.environment.id}/${id}`,
        "wall joint",
        [
          hull.map(
            (point: IAutoMovieVector3): IAutoMovieProfilePoint => ({
              x: point.x,
              y: point.z,
            }),
          ),
        ],
        level.height,
        color,
      ),
    );
  }
}

/** Add a scoped geometry model and place it as one owned building element. */
function addElement(
  assembly: IAssembly,
  id: string,
  kind: string,
  space: string | null,
  transform: IAutoMovieTransform,
  model: IAutoMovieModel,
): void {
  assembly.environment.models.push(model);
  assembly.environment.elements.push({
    id,
    kind,
    space,
    transform,
    model: model.id,
    parent: ROOT,
  });
}

/** Store the corners of a rectangular face in its local plane. */
function rectangle(
  x: number,
  y: number,
  width: number,
  height: number,
): IAutoMoviePlanarPoint[] {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

/** Orient geometry authored in XY so the planar y becomes the building Z. */
function horizontalPlate(y: number): IAutoMovieTransform {
  return frame(
    Vector3.create(0, y, 0),
    Quaternion.fromAxisAngle(Vector3.create(1, 0, 0), 90),
  );
}

/** Rigid unit-scale frame at an explicit origin. */
function frame(
  translation: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion = Quaternion.identity(),
): IAutoMovieTransform {
  return { translation, rotation, scale: Vector3.create(1, 1, 1) };
}
