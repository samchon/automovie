import { Quaternion, computeModelRestExtent } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMoviePropSpec,
  IAutoMovieQuaternion,
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "../../core/ArchetypeFrame";
import { createEnvironmentProp } from "./createEnvironmentProp";

/** XZ occupancy in the room frame, in metres. */
interface IRect {
  /** Lower X edge. */
  minX: number;

  /** Upper X edge. */
  maxX: number;

  /** Lower Z edge. */
  minZ: number;

  /** Upper Z edge. */
  maxZ: number;
}

/** The resolved model origin and occupied footprint in the room frame. */
interface IPlacement {
  /** The model selected by this role. */
  item: furnishRoom.IItem;

  /** Model origin on X, in metres. */
  x: number;

  /** Model origin on Z, in metres. */
  z: number;

  /** Unit yaw used for both the box and the staged transform. */
  rotation: IAutoMovieQuaternion;

  /** Box of the turned model, translated into the room frame. */
  rect: IRect;
}

/** The 915 mm walking width in U.S. Access Board §403.5.1 (https://www.access-board.gov/ada/chapter/ch04/), used here as a layout default. */
const DEFAULT_AISLE: number = 0.915;

/** Bearing and box-coordinate tolerance in metres, as in prop placement. */
const EPSILON: number = 1e-9;

/**
 * Place a room-scale kit on a grid of repeated prop groups and any fixed roles.
 *
 * Models keep their measured underside on the floor. The room and clearance
 * checks run in the host frame, so a yawed room does not enlarge its furniture
 * footprints for fit. A slot reserves the full box of its group, with an aisle
 * between slots and at the room edge. Named keep-outs and prop overrides are
 * placed first. Authored overrides stay where given when a different seed
 * changes a prototype's dimensions. An infeasible layout names the role or
 * capacity that failed and never stages a partial kit.
 *
 * @param context The room's resolved world frame and occurrence id.
 * @param params The useful room, repeatable model group and any fixed item.
 * @returns Models, prop specs, stage placements and each role's anchors.
 * @throws If room input, capacity, clearances or overrides cannot be satisfied.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States frame, floor contact, slot and aisle policy, priority of keep-outs and overrides, errors and emitted records.
 * @evidence contracts/development/implementation.md#principled-implementation Measures the oriented proxy footprint in the room frame. A repeating lattice starts at the minimum XZ edges with one aisle of perimeter inset. Each cell translates a group box so neighboring boxes have the stated aisle width. Only generated items within the cell are checked against its fixed-role boxes and reserved areas. Model rest bounds give the local Y offset for floor contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Places and validates the room layout before calling the common prop adapter. Kit producers supply equipment geometry and relative arrangement. The same fit, identity and staging logic serves both producers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Grid spacing uses conservative group boxes. The 915 mm default is from the U.S. Access Board's accessible-route width, not a compliance assertion. The 1e-9 m contact tolerance follows the engine's authored prop relations. It does not move explicit overrides or solve continuous actor clearance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Measures each prototype before this call and projects its room-local box once per default orientation. Grid slots are considered at most once. Each considered slot checks the fixed and override count and the named keep-outs. Output work grows with the number of staged items and their affordances.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Instances share the production's model prototypes, measured bounds and candidate grid arithmetic. Per-occurrence ids, support frames and stage placements are rebuilt from the authoring inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reservation, prototype and occupancy maps live only for the call. The returned records are bounded by the requested group count, fixed props and model affordances. No external resources are held.
 */
export function furnishRoom(
  context: IAutoMovieEnvironmentModule.IContext,
  params: furnishRoom.IParams,
): IAutoMovieEnvironmentContribution {
  const layout: IAutoMovieFurnishingLayout = params.layout;
  const [width, depth] = layout.room;
  const aisle: number = layout.aisle ?? DEFAULT_AISLE;
  if (
    ![width, depth, aisle].every(
      (n: number): boolean => Number.isFinite(n) && n > 0,
    )
  )
    throw new Error(
      `${context.id} room and aisle need positive finite dimensions`,
    );
  if (!Number.isSafeInteger(params.count) || params.count < 1)
    throw new Error(
      `${context.id} ${params.capacity} needs a positive integer`,
    );

  const room: IRect = {
    minX: -width / 2,
    maxX: width / 2,
    minZ: -depth / 2,
    maxZ: depth / 2,
  };
  const blocked: Map<string, IRect> = new Map();
  for (const [id, [x, z, w, d]] of Object.entries(layout.keepClear ?? {})) {
    const box: IRect = { minX: x, maxX: x + w, minZ: z, maxZ: z + d };
    if (!(box.maxX > x && box.maxZ > z && within(box, room)))
      throw new Error(
        `${context.id} keepClear.${id} needs a positive rectangle within the room`,
      );
    blocked.set(`keepClear.${id}`, box);
  }

  const prototype: IPlacement[] = params.group.map(
    (item: furnishRoom.IItem): IPlacement =>
      locate(item, item.x, item.z, item.heading),
  );
  const group: IRect = {
    minX: Math.min(...prototype.map((p: IPlacement): number => p.rect.minX)),
    maxX: Math.max(...prototype.map((p: IPlacement): number => p.rect.maxX)),
    minZ: Math.min(...prototype.map((p: IPlacement): number => p.rect.minZ)),
    maxZ: Math.max(...prototype.map((p: IPlacement): number => p.rect.maxZ)),
  };
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
  if (!Number.isSafeInteger(capacity))
    throw new Error(
      `${context.id} room is too large to index its furnishing grid`,
    );
  if (capacity < params.count)
    throw capacityError(context.id, params.capacity, params.count, capacity);

  const roles: Map<string, IPlacement> = new Map();
  if (params.fixed !== undefined)
    roles.set(
      params.fixed.role,
      locate(
        params.fixed,
        params.fixed.x,
        params.fixed.z,
        params.fixed.heading,
      ),
    );
  for (let index: number = 1; index <= params.count; ++index)
    for (const part of prototype)
      roles.set(roleAt(params.prefix, index, part.item.role), part);

  const placed: Map<string, IPlacement> = new Map();
  for (const [role, override] of Object.entries(layout.overrides ?? {})) {
    const original: IPlacement | undefined = roles.get(role);
    if (original === undefined)
      throw new Error(
        `${context.id} overrides.${role} names no furnished prop`,
      );
    if (
      ![override.at[0], override.at[1], override.heading ?? 0].every(
        Number.isFinite,
      )
    )
      throw new Error(
        `${context.id} overrides.${role} needs a finite position and heading`,
      );
    const candidate: IPlacement = locate(
      original.item,
      override.at[0],
      override.at[1],
      override.heading ?? 0,
    );
    claim(context.id, `overrides.${role}`, candidate, room, blocked);
    placed.set(role, candidate);
  }
  if (params.fixed !== undefined && !placed.has(params.fixed.role)) {
    const candidate: IPlacement = roles.get(params.fixed.role)!;
    claim(context.id, params.fixed.role, candidate, room, blocked);
    placed.set(params.fixed.role, candidate);
  }
  if (params.fixed !== undefined) {
    // Preserve at least one clear approach along the service side of the counter.
    const counter: IPlacement = placed.get(params.fixed.role)!;
    const { min, max } = counter.item.bounds;
    const centre: number = (min.x + max.x) / 2;
    const halfWidth: number = Math.max(max.x - min.x, aisle) / 2;
    const approach: IRect = shift(
      project(
        {
          minX: centre - halfWidth,
          maxX: centre + halfWidth,
          minZ: max.z,
          maxZ: max.z + aisle,
        },
        counter.rotation,
      ),
      counter.x,
      counter.z,
    );
    if (!within(approach, room))
      throw new Error(
        `${context.id} ${params.fixed.role} approach is outside the usable room`,
      );
    for (const [role, override] of placed)
      if (role !== params.fixed.role && overlaps(override.rect, approach))
        throw new Error(
          `${context.id} overrides.${role} blocks ${params.fixed.role} approach`,
        );
    blocked.set(`${params.fixed.role}/approach`, approach);
  }

  let slot: number = 0;
  for (let index: number = 1; index <= params.count; ++index) {
    const missing: IPlacement[] = prototype.filter(
      (p: IPlacement): boolean =>
        !placed.has(roleAt(params.prefix, index, p.item.role)),
    );
    if (missing.length === 0) continue;

    let offset: readonly [number, number] | null = null;
    for (; slot < capacity && offset === null; ++slot) {
      const x: number =
        room.minX + aisle + (slot % columns) * pitchX - group.minX;
      const z: number =
        room.minZ + aisle + Math.floor(slot / columns) * pitchZ - group.minZ;
      const occupied: IRect = shift(group, x, z);
      if (
        within(occupied, room) &&
        missing.every(
          (p: IPlacement): boolean =>
            obstruction(shift(p.rect, x, z), blocked) === undefined,
        )
      )
        offset = [x, z];
    }
    if (offset === null)
      throw capacityError(context.id, params.capacity, params.count, index - 1);
    for (const part of missing) {
      const [x, z] = offset;
      placed.set(roleAt(params.prefix, index, part.item.role), {
        item: part.item,
        x: part.x + x,
        z: part.z + z,
        rotation: part.rotation,
        rect: shift(part.rect, x, z),
      });
    }
  }

  const anchors: Record<string, IAutoMovieTransform> = {};
  const models: IAutoMovieModel[] = [];
  const set: IAutoMovieStageSetPiece[] = [];
  const props: IAutoMoviePropSpec[] = [];
  const uses: Map<IAutoMovieModel, IAutoMovieEnvironmentModule> = new Map();
  for (const role of roles.keys()) {
    const p: IPlacement = placed.get(role)!;
    const frame: IAutoMovieTransform = ArchetypeFrame.move(context.frame, {
      translation: { x: p.x, y: -p.item.bounds.min.y, z: p.z },
      rotation: p.rotation,
      scale: ArchetypeFrame.UNIT,
    });
    let use: IAutoMovieEnvironmentModule | undefined = uses.get(p.item.model);
    if (use === undefined) {
      use = createEnvironmentProp({ model: p.item.model });
      uses.set(p.item.model, use);
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
  }
  return { anchors, models, set, props };
}

/** Build the role of one occurrence from its group's stable ordinal and the part's local suffix. */
function roleAt(prefix: string, index: number, part: string): string {
  return part === "" ? `${prefix}-${index}` : `${prefix}-${index}/${part}`;
}

/** Place a local occupied box at the given heading and translation and project it onto XZ. */
function locate(
  item: furnishRoom.IItem,
  x: number,
  z: number,
  heading: number,
): IPlacement {
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    heading % 360,
  );
  return {
    item,
    x,
    z,
    rotation,
    rect: shift(
      project(
        {
          minX: item.bounds.min.x,
          maxX: item.bounds.max.x,
          minZ: item.bounds.min.z,
          maxZ: item.bounds.max.z,
        },
        rotation,
      ),
      x,
      z,
    ),
  };
}

/** Enclose the four corners of a yawed rectangle in the room frame. */
function project(box: IRect, rotation: IAutoMovieQuaternion): IRect {
  const corners: IAutoMovieVector3[] = [];
  for (const x of [box.minX, box.maxX])
    for (const z of [box.minZ, box.maxZ])
      corners.push(Quaternion.rotateVector(rotation, { x, y: 0, z }));
  return {
    minX: Math.min(...corners.map((p: IAutoMovieVector3): number => p.x)),
    maxX: Math.max(...corners.map((p: IAutoMovieVector3): number => p.x)),
    minZ: Math.min(...corners.map((p: IAutoMovieVector3): number => p.z)),
    maxZ: Math.max(...corners.map((p: IAutoMovieVector3): number => p.z)),
  };
}

/** Translate an occupied XZ rectangle. */
function shift(box: IRect, x: number, z: number): IRect {
  return {
    minX: box.minX + x,
    maxX: box.maxX + x,
    minZ: box.minZ + z,
    maxZ: box.maxZ + z,
  };
}

/** Touching two rectangles is allowed within the common metre tolerance. */
function overlaps(a: IRect, b: IRect): boolean {
  return (
    Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > EPSILON &&
    Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > EPSILON
  );
}

/** Check the whole occupied box against the recipient bounds. */
function within(box: IRect, room: IRect): boolean {
  return (
    box.minX >= room.minX - EPSILON &&
    box.maxX <= room.maxX + EPSILON &&
    box.minZ >= room.minZ - EPSILON &&
    box.maxZ <= room.maxZ + EPSILON
  );
}

/** Name the first occupied or reserved rectangle entered by this box. */
function obstruction(
  box: IRect,
  blocked: ReadonlyMap<string, IRect>,
): string | undefined {
  for (const [id, other] of blocked) if (overlaps(box, other)) return id;
  return undefined;
}

/** Accept a fixed or overridden position only when its actual proxy fits. */
function claim(
  id: string,
  role: string,
  placed: IPlacement,
  room: IRect,
  blocked: Map<string, IRect>,
): void {
  if (!within(placed.rect, room))
    throw new Error(`${id} ${role} is outside the usable room`);
  const conflict: string | undefined = obstruction(placed.rect, blocked);
  if (conflict !== undefined)
    throw new Error(`${id} ${role} overlaps ${conflict}`);
  blocked.set(role, placed.rect);
}

/** Name the failing count and the capacity already available when grid placement stops. */
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
 * The room planner's kit input and common proxy measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the producer-only room layout contracts and the measured proxy helper.
 * @evidence contracts/development/design.md#principled-representation Stores model dimensions in a rest-pose volume and plan positions in metres, with one positive count and a repeated role prefix per room.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cafe and gym provide models and a relative group instead of knowing placement or staging transforms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These records are constructed by kit producers. Room admission is the repeat planner's responsibility.
 */
export namespace furnishRoom {
  /**
   * One prop prototype positioned in the repeated group or the room itself.
   *
   * The rest bounds describe the model's occupied extents before the authored yaw and translation. Their lower Y determines how far to lift the model's origin from the floor.
   */
  export interface IItem {
    /** Fixed role, or suffix appended to the group's role. Empty selects the group role. */
    role: string;

    /** Renderable rigid model with its authored affordances. */
    model: IAutoMovieModel;

    /** Measured model-local bounds, in metres. */
    bounds: IAutoMoviePropBox;

    /** X metres in the group or host room. */
    x: number;

    /** Z metres in the group or host room. */
    z: number;

    /** Rotation about local +Y in degrees. */
    heading: number;
  }

  /**
   * One repeatable furniture layout and optional fixed service item.
   *
   * The group is nonempty and its positions are relative to one grid point. The fixed item stands in room coordinates.
   */
  export interface IParams {
    /** Room and override declarations. */
    layout: IAutoMovieFurnishingLayout;

    /** Positive integer number of repeated groups. */
    count: number;

    /** Name by which the kit exposes the capacity parameter. */
    capacity: string;

    /** Role prefix for the repeated groups. */
    prefix: string;

    /** Props in one repeated group, named by local suffix. */
    group: readonly IItem[];

    /** Optional service prop in room coordinates, with an aisle across its local +Z face. */
    fixed?: IItem;
  }

  /**
   * Measure a kit prototype's visible rest extent in its own frame, in metres, using the same geometry as film framing.
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
