import { Quaternion, computeModelRestExtent } from "@automovie/engine";
import type {
  AutoMovieFurnishingWall,
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieWallMount,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { FurnishingRect } from "./FurnishingRect";
import { createEnvironmentProp } from "./createEnvironmentProp";
import { resolveFurnishingPieces } from "./resolveFurnishingPieces";

/** Room-frame point on each wall's inner face and its unit normal into the room. */
const WALL_FACES: Readonly<
  Record<
    AutoMovieFurnishingWall,
    (
      width: number,
      depth: number,
    ) => readonly [point: IAutoMovieVector3, normal: IAutoMovieVector3]
  >
> = {
  "-z": (_w: number, d: number) => [
    { x: 0, y: 0, z: -d / 2 },
    { x: 0, y: 0, z: 1 },
  ],
  "+z": (_w: number, d: number) => [
    { x: 0, y: 0, z: d / 2 },
    { x: 0, y: 0, z: -1 },
  ],
  "-x": (w: number) => [
    { x: -w / 2, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ],
  "+x": (w: number) => [
    { x: w / 2, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
  ],
};

/**
 * Furnish a rectangular room with related pieces and a grid of repeated prop
 * groups.
 *
 * The room checks run in the host frame, so a yawed room does not enlarge its
 * furniture footprints for fit. Named keep-outs are blocked first, then
 * overrides of grid roles are claimed where given, then the related pieces
 * resolve in record order (`resolveFurnishingPieces`), reserving their
 * clearances. A grid slot reserves the full box of its group, with an aisle
 * between slots and at the room edge, and takes the first slot clear of every
 * blocked rectangle. Models keep their measured underside on the floor unless a
 * wall relation hangs them higher. Authored overrides stay where given when a
 * different seed changes a prototype's dimensions. An infeasible layout names
 * the role or capacity that failed and never stages a partial room.
 *
 * @param context The room's resolved world frame and occurrence id.
 * @param params The useful room, related pieces and any repeated group.
 * @returns Models, prop specs, stage placements, each role's anchors and the
 *   wall each wall piece stands on.
 * @throws If room input, capacity, relations, clearances or overrides cannot be
 *   satisfied.
 */
export function furnishRoom(
  context: IAutoMovieEnvironmentModule.IContext,
  params: furnishRoom.IParams,
): IAutoMovieEnvironmentContribution {
  const layout: IAutoMovieFurnishingLayout = params.layout;
  const [width, depth] = layout.room;
  const aisle: number = layout.aisle ?? furnishRoom.DEFAULT_AISLE;
  if (![width, depth, aisle].every((n: number): boolean => n > 0))
    throw new Error(
      `${context.id} room and aisle need positive finite dimensions`,
    );
  const grid: furnishRoom.IGrid | undefined = params.grid;
  if (grid !== undefined && grid.count < 1)
    throw new Error(`${context.id} ${grid.capacity} needs a positive integer`);

  const room: FurnishingRect.IRect = {
    minX: -width / 2,
    maxX: width / 2,
    minZ: -depth / 2,
    maxZ: depth / 2,
  };
  const blocked: Map<string, FurnishingRect.IRect> = new Map();
  for (const [id, [x, z, w, d]] of Object.entries(layout.keepClear ?? {})) {
    const box: FurnishingRect.IRect = {
      minX: x,
      maxX: x + w,
      minZ: z,
      maxZ: z + d,
    };
    if (!(box.maxX > x && box.maxZ > z && FurnishingRect.within(box, room)))
      throw new Error(
        `${context.id} keepClear.${id} needs a positive rectangle within the room`,
      );
    blocked.set(`keepClear.${id}`, box);
  }

  // The repeated group at its own origin, and every grid role it fills.
  const prototype: IGroupPart[] = (grid?.group ?? []).map(
    (item: furnishRoom.IItem): IGroupPart => ({
      role: item.role,
      placement: FurnishingRect.locate(
        item.model,
        item.bounds,
        item.x,
        item.z,
        item.heading,
      ),
    }),
  );
  const gridRoles: Map<string, IGroupPart> = new Map();
  for (let index: number = 1; index <= (grid?.count ?? 0); ++index)
    for (const part of prototype)
      gridRoles.set(roleAt(grid!.prefix, index, part.role), part);

  const pieces: Readonly<Record<string, resolveFurnishingPieces.IPiece>> =
    params.pieces ?? {};
  const placed: Map<string, FurnishingRect.IPlacement> = new Map();
  for (const [role, override] of Object.entries(layout.overrides ?? {})) {
    if (Object.hasOwn(pieces, role)) continue;
    const original: IGroupPart | undefined = gridRoles.get(role);
    if (original === undefined)
      throw new Error(
        `${context.id} overrides.${role} names no furnished prop`,
      );
    const candidate: FurnishingRect.IPlacement = FurnishingRect.locate(
      original.placement.model,
      original.placement.bounds,
      override.at[0],
      override.at[1],
      override.heading ?? 0,
    );
    FurnishingRect.claim(
      context.id,
      `overrides.${role}`,
      candidate,
      room,
      blocked,
    );
    placed.set(role, candidate);
  }

  const related: resolveFurnishingPieces.IResult = resolveFurnishingPieces({
    id: context.id,
    room,
    aisle,
    overrides: layout.overrides,
    pieces,
    blocked,
  });
  if (grid !== undefined)
    placeGrid(context.id, grid, prototype, room, aisle, blocked, placed);

  const anchors: Record<string, IAutoMovieTransform> = {};
  const models: IAutoMovieModel[] = [];
  const set: IAutoMovieStageSetPiece[] = [];
  const props: IAutoMoviePropSpec[] = [];
  const mounts: IAutoMovieWallMount[] = [];
  const uses: Map<IAutoMovieModel, IAutoMovieEnvironmentModule> = new Map();
  for (const role of [...related.placed.keys(), ...gridRoles.keys()]) {
    const p: FurnishingRect.IPlacement = (related.placed.get(role) ??
      placed.get(role))!;
    const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.move(
      context.frame,
      {
        translation: { x: p.x, y: p.y, z: p.z },
        rotation: p.rotation,
        scale: AutoMovieArchetypeFrame.UNIT,
      },
    );
    let use: IAutoMovieEnvironmentModule | undefined = uses.get(p.model);
    if (use === undefined) {
      use = createEnvironmentProp({ model: p.model });
      uses.set(p.model, use);
    }
    const built: IAutoMovieEnvironmentContribution = use({
      ...context,
      id: `${context.id}/${role}`,
      frame,
    });
    models.push(...(built.models ?? []));
    set.push(...(built.set ?? []));
    props.push(...(built.props ?? []));
    anchors[role] = frame;
    for (const [name, target] of Object.entries(built.anchors ?? {}))
      anchors[`${role}/${name}`] = target;
    const wall: AutoMovieFurnishingWall | undefined = related.walls.get(role);
    if (wall !== undefined) {
      const [point, normal] = WALL_FACES[wall](width, depth);
      mounts.push({
        node: `${context.id}/${role}`,
        wall: `${context.id}/walls/${wall}`,
        point: AutoMovieArchetypeFrame.point(context.frame, point),
        normal: Quaternion.rotateVector(context.frame.rotation, normal),
      });
    }
  }
  return {
    anchors,
    models,
    set,
    props,
    ...(mounts.length !== 0 ? { mounts } : {}),
  };
}

/** One member of the repeated group, placed at the group's own origin. */
interface IGroupPart {
  /** Local role suffix; empty selects the group role. */
  role: string;

  /** The member's placement relative to the group origin. */
  placement: FurnishingRect.IPlacement;
}

/**
 * Fill the grid's missing roles slot by slot: a slot is taken when the whole
 * group box fits the room and every missing member's box enters no blocked
 * rectangle.
 */
function placeGrid(
  id: string,
  grid: furnishRoom.IGrid,
  prototype: readonly IGroupPart[],
  room: FurnishingRect.IRect,
  aisle: number,
  blocked: ReadonlyMap<string, FurnishingRect.IRect>,
  placed: Map<string, FurnishingRect.IPlacement>,
): void {
  const group: FurnishingRect.IRect = {
    minX: Math.min(
      ...prototype.map((p: IGroupPart): number => p.placement.rect.minX),
    ),
    maxX: Math.max(
      ...prototype.map((p: IGroupPart): number => p.placement.rect.maxX),
    ),
    minZ: Math.min(
      ...prototype.map((p: IGroupPart): number => p.placement.rect.minZ),
    ),
    maxZ: Math.max(
      ...prototype.map((p: IGroupPart): number => p.placement.rect.maxZ),
    ),
  };
  const width: number = room.maxX - room.minX;
  const depth: number = room.maxZ - room.minZ;
  const groupWidth: number = group.maxX - group.minX;
  const groupDepth: number = group.maxZ - group.minZ;
  const pitchX: number = groupWidth + aisle;
  const pitchZ: number = groupDepth + aisle;
  const columns: number = Math.max(
    0,
    1 + Math.floor((width - 2 * aisle - groupWidth) / pitchX),
  );
  const rows: number = Math.max(
    0,
    1 + Math.floor((depth - 2 * aisle - groupDepth) / pitchZ),
  );
  const capacity: number = columns * rows;
  if (capacity < grid.count)
    throw capacityError(id, grid.capacity, grid.count, capacity);

  let slot: number = 0;
  for (let index: number = 1; index <= grid.count; ++index) {
    const missing: IGroupPart[] = prototype.filter(
      (p: IGroupPart): boolean =>
        !placed.has(roleAt(grid.prefix, index, p.role)),
    );
    if (missing.length === 0) continue;

    let offset: readonly [number, number] | null = null;
    for (; slot < capacity && offset === null; ++slot) {
      const x: number =
        room.minX + aisle + (slot % columns) * pitchX - group.minX;
      const z: number =
        room.minZ + aisle + Math.floor(slot / columns) * pitchZ - group.minZ;
      const occupied: FurnishingRect.IRect = FurnishingRect.shift(group, x, z);
      if (
        FurnishingRect.within(occupied, room) &&
        missing.every(
          (p: IGroupPart): boolean =>
            FurnishingRect.obstruction(
              FurnishingRect.shift(p.placement.rect, x, z),
              blocked,
            ) === undefined,
        )
      )
        offset = [x, z];
    }
    if (offset === null)
      throw capacityError(id, grid.capacity, grid.count, index - 1);
    const [x, z] = offset;
    for (const part of missing)
      placed.set(roleAt(grid.prefix, index, part.role), {
        ...part.placement,
        x: part.placement.x + x,
        z: part.placement.z + z,
        rect: FurnishingRect.shift(part.placement.rect, x, z),
      });
  }
}

/**
 * Build the role of one occurrence from its group's stable ordinal and the
 * part's local suffix.
 */
function roleAt(prefix: string, index: number, part: string): string {
  return part === "" ? `${prefix}-${index}` : `${prefix}-${index}/${part}`;
}

/**
 * Name the failing count and the capacity already available when grid placement
 * stops.
 */
function capacityError(
  id: string,
  key: string,
  count: number,
  fits: number,
): Error {
  return new Error(
    `${id} ${key} cannot fit ${count} groups (${fits} available). Widen the room, reduce the count or review the reserved areas.`,
  );
}

/**
 * The planner's default aisle, its item, grid and parameter records, and its
 * rest-box measure.
 */
export namespace furnishRoom {
  /**
   * The 915 mm walking width in U.S. Access Board §403.5.1
   * (https://www.access-board.gov/ada/chapter/ch04/), used here as a layout
   * default and not as a compliance claim.
   */
  export const DEFAULT_AISLE: number = 0.915;

  /**
   * One prop prototype positioned in the repeated group.
   *
   * The rest bounds describe the model's occupied extents before the authored
   * yaw and translation. Their lower Y determines how far to lift the model's
   * origin from the floor.
   */
  export interface IItem {
    /** Suffix appended to the group's role. Empty selects the group role. */
    role: string;

    /** Renderable rigid model with its authored affordances. */
    model: IAutoMovieModel;

    /** Measured model-local bounds, in metres. */
    bounds: IAutoMoviePropBox;

    /** X metres in the group. */
    x: number;

    /** Z metres in the group. */
    z: number;

    /** Rotation about local +Y in degrees. */
    heading: number;
  }

  /** A repeated group laid on the room's grid. */
  export interface IGrid {
    /** Positive integer number of repeated groups. */
    count: number;

    /** Name by which the kit exposes the count parameter. */
    capacity: string;

    /** Role prefix for the repeated groups. */
    prefix: string;

    /**
     * Nonempty props of one group, positioned relative to one grid point and
     * named by local suffix.
     */
    group: readonly IItem[];
  }

  /** The room, its related pieces and any repeated group. */
  export interface IParams {
    /** Room and override declarations. */
    layout: IAutoMovieFurnishingLayout;

    /**
     * Pieces placed by relation, by role, resolved in record order before the
     * grid.
     */
    pieces?: Readonly<Record<string, resolveFurnishingPieces.IPiece>>;

    /** The repeated group, when the room has one. */
    grid?: IGrid;
  }

  /**
   * Measure a kit prototype's visible rest extent in its own frame, in metres,
   * using the same geometry as film framing.
   *
   * @param model The equipment model selected by the producer.
   * @returns Model-local bounds used for footprint and floor seating.
   * @throws If the model has no measurable rest extent.
   */
  export function measure(model: IAutoMovieModel): IAutoMoviePropBox {
    const result: IAutoMoviePropBox | null = computeModelRestExtent(model);
    if (result === null)
      throw new Error(`${model.id} has no measurable furniture geometry`);
    return result;
  }
}
