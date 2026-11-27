import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Plan rectangles and placed rest boxes in a furnished room's frame.
 *
 * The room planner and its relation resolver share these: a placement turns a
 * model's measured rest box about +Y, projects it onto XZ and translates it,
 * and every fit test compares those plan rectangles. Rectangles are full
 * height, so two pieces whose plans overlap conflict at any elevation.
 */
export namespace FurnishingRect {
  /*
   * XZ occupancy in the room frame, in metres.
   */
  export interface IRect {
    /*
     * Lower X edge.
     */
    minX: number;

    /*
     * Upper X edge.
     */
    maxX: number;

    /*
     * Lower Z edge.
     */
    minZ: number;

    /*
     * Upper Z edge.
     */
    maxZ: number;
  }

  /*
   * A model placed in the room frame with its turned plan box.
   */
  export interface IPlacement {
    /*
     * The placed model.
     */
    model: IAutoMovieModel;

    /*
     * The model's measured rest box in its own frame, in metres.
     */
    bounds: IAutoMoviePropBox;

    /*
     * Model origin on X, in metres.
     */
    x: number;

    /*
     * Model origin on Y above the floor, in metres.
     */
    y: number;

    /*
     * Model origin on Z, in metres.
     */
    z: number;

    /*
     * Unit yaw used for both the box and the staged transform.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * Box of the turned model, translated into the room frame.
     */
    rect: IRect;
  }

  /*
   * Box-coordinate tolerance in metres, as in prop placement.
   */
  export const EPSILON: number = 1e-9;

  /*
   * Place a model at a room position and heading with its underside on the
   * floor, and project its turned rest box onto XZ.
   * Parameter model: The placed model.
   * Parameter bounds: Its measured rest box.
   * Parameter x: Origin X in metres.
   * Parameter z: Origin Z in metres.
   * Parameter heading: Turn about +Y in degrees.
   * Returns: The placement, its origin lifted by the box's underside depth.
   */
  export function locate(
    model: IAutoMovieModel,
    bounds: IAutoMoviePropBox,
    x: number,
    z: number,
    heading: number,
  ): IPlacement {
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      heading % 360,
    );
    return {
      model,
      bounds,
      x,
      y: -bounds.min.y,
      z,
      rotation,
      rect: shift(project(plan(bounds), rotation), x, z),
    };
  }

  /*
   * The XZ rectangle of a model-local box.
   */
  export function plan(bounds: IAutoMoviePropBox): IRect {
    return {
      minX: bounds.min.x,
      maxX: bounds.max.x,
      minZ: bounds.min.z,
      maxZ: bounds.max.z,
    };
  }

  /*
   * Enclose the four corners of a yawed rectangle in the room frame.
   */
  export function project(box: IRect, rotation: IAutoMovieQuaternion): IRect {
    const corners: IAutoMovieVector3[] = [];
    for (const x of [box.minX, box.maxX])
      for (const z of [box.minZ, box.maxZ])
        corners.push(AutoMovieEngineQuaternion.rotateVector(rotation, { x, y: 0, z }));
    return {
      minX: Math.min(...corners.map((p: IAutoMovieVector3): number => p.x)),
      maxX: Math.max(...corners.map((p: IAutoMovieVector3): number => p.x)),
      minZ: Math.min(...corners.map((p: IAutoMovieVector3): number => p.z)),
      maxZ: Math.max(...corners.map((p: IAutoMovieVector3): number => p.z)),
    };
  }

  /*
   * Translate an occupied XZ rectangle.
   */
  export function shift(box: IRect, x: number, z: number): IRect {
    return {
      minX: box.minX + x,
      maxX: box.maxX + x,
      minZ: box.minZ + z,
      maxZ: box.maxZ + z,
    };
  }

  /*
   * Whether two rectangles share area; touching within the tolerance is
   * allowed.
   */
  export function overlaps(a: IRect, b: IRect): boolean {
    return (
      Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > EPSILON &&
      Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > EPSILON
    );
  }

  /*
   * Whether the whole box lies inside the recipient bounds.
   */
  export function within(box: IRect, room: IRect): boolean {
    return (
      box.minX >= room.minX - EPSILON &&
      box.maxX <= room.maxX + EPSILON &&
      box.minZ >= room.minZ - EPSILON &&
      box.maxZ <= room.maxZ + EPSILON
    );
  }

  /*
   * Name the first occupied or reserved rectangle this box enters.
   */
  export function obstruction(
    box: IRect,
    blocked: ReadonlyMap<string, IRect>,
  ): string | undefined {
    for (const [id, other] of blocked) if (overlaps(box, other)) return id;
    return undefined;
  }

  /*
   * Accept a placement only when its box fits the room and enters no blocked
   * rectangle, then block its box under its role.
   * Naming the occurrence and role when the box leaves the room or
   * enters a blocked rectangle, naming that rectangle.
   */
  export function claim(
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
}
