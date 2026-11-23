import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * The room a forearm reading reads of its colliders (`HumanArmOvershoot`): the
 * chest and its outward side, whether the other arm's colliders are among the
 * trunk's, and every shape with its frame and its role, built once per list and
 * side.
 */
export namespace HumanArmOvershootRoom {
  /** One shape with the posed frame of its segment. */
  export interface IShape {
    /** The segment's posed frame. */
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"];

    /** The shape. */
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number];

    /**
     * Whether the wrist has no goal on the shape, so its own depth excuses
     * nothing.
     */
    free: boolean;

    /**
     * Whether the goal lays the hand on the shape, so the wrist's shortfall
     * from its room excuses that much.
     */
    rest: boolean;

    /** Its bounding sphere and hull frame (`HumanShapeFraming.of`). */
    framed: HumanShapeFraming.IFramed;
  }

  /** What a reading reads of its colliders besides the elbow and the wrist. */
  export interface IRoom {
    /**
     * The chest's collider, whose median plane the elbow keeps its side of;
     * none for a rig without one.
     */
    chest: IAutoMovieMotionHumanColliders.IPlaced | undefined;

    /**
     * The chest's outward axis on the arm's side, world; unused without a
     * chest.
     */
    out: IAutoMovieVector3;

    /** Whether the other arm's colliders are among the trunk's. */
    present: boolean;

    /**
     * The trunk's shapes, then the others', then the rests', each with its
     * frame.
     */
    shapes: IShape[];
  }

  /**
   * The room of a reading's colliders, built once per trunk list, others' list,
   * rests' list and side, and read by every candidate of a sweep, which passes
   * the same lists: the chest, its outward axis, whether the other arm is
   * present and every shape framed (`HumanShapeFraming.of`).
   *
   * @param shapes The trunk's colliders.
   * @param others Another body's colliders the wrist has no goal on.
   * @param rests Another body's colliders the goal lays the hand on.
   * @param side The arm.
   * @returns The room.
   */
  export function of(
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    others: readonly IAutoMovieMotionHumanColliders.IFramed[],
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    side: "left" | "right",
  ): IRoom {
    const key: (
      list: readonly IAutoMovieMotionHumanColliders.IFramed[],
    ) => object = (
      list: readonly IAutoMovieMotionHumanColliders.IFramed[],
    ): object => (list.length === 0 ? EMPTY : list);
    let byOthers:
      | WeakMap<
          object,
          WeakMap<object, Partial<Record<"left" | "right", IRoom>>>
        >
      | undefined = ROOMS.get(key(shapes));
    if (byOthers === undefined) {
      byOthers = new WeakMap();
      ROOMS.set(key(shapes), byOthers);
    }
    let byRests:
      | WeakMap<object, Partial<Record<"left" | "right", IRoom>>>
      | undefined = byOthers.get(key(others));
    if (byRests === undefined) {
      byRests = new WeakMap();
      byOthers.set(key(others), byRests);
    }
    let sides: Partial<Record<"left" | "right", IRoom>> | undefined =
      byRests.get(key(rests));
    if (sides === undefined) {
      sides = {};
      byRests.set(key(rests), sides);
    }
    const known: IRoom | undefined = sides[side];
    if (known !== undefined) return known;
    const chest: IAutoMovieMotionHumanColliders.IPlaced | undefined =
      shapes.find(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          s.bone === "upperChest",
      ) ??
      shapes.find(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          s.bone === "chest",
      );
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const room: IRoom = {
      chest,
      out:
        chest === undefined
          ? { x: 0, y: 0, z: 0 }
          : Quaternion.rotateVector(chest.pose.rotation, {
              x: side === "left" ? 1 : -1,
              y: 0,
              z: 0,
            }),
      present: shapes.some(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          s.bone === `${other}UpperArm` || s.bone === `${other}LowerArm`,
      ),
      shapes: [
        ...shapes.map(
          (
            s: IAutoMovieMotionHumanColliders.IPlaced,
          ): readonly [
            IAutoMovieMotionHumanColliders.IPlaced,
            boolean,
            boolean,
          ] => [s, false, false],
        ),
        ...others.map(
          (
            s: IAutoMovieMotionHumanColliders.IFramed,
          ): readonly [
            IAutoMovieMotionHumanColliders.IFramed,
            boolean,
            boolean,
          ] => [s, true, false],
        ),
        ...rests.map(
          (
            s: IAutoMovieMotionHumanColliders.IPlaced,
          ): readonly [
            IAutoMovieMotionHumanColliders.IPlaced,
            boolean,
            boolean,
          ] => [s, true, true],
        ),
      ].flatMap(
        ([segment, free, rest]: readonly [
          IAutoMovieMotionHumanColliders.IFramed,
          boolean,
          boolean,
        ]): IShape[] =>
          segment.shapes.map(
            (
              shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
            ): IShape => ({
              pose: segment.pose,
              shape,
              free,
              rest,
              framed: HumanShapeFraming.of(segment.pose, shape),
            }),
          ),
      ),
    };
    sides[side] = room;
    return room;
  }
}

/**
 * The rooms read, by the trunk's list, the others' list and the rests' list,
 * then by side; an empty list is keyed by `EMPTY`.
 */
const ROOMS: WeakMap<
  object,
  WeakMap<
    object,
    WeakMap<
      object,
      Partial<Record<"left" | "right", HumanArmOvershootRoom.IRoom>>
    >
  >
> = new WeakMap();

/**
 * The key of an empty collider list: a reading given none makes a fresh empty
 * list each time.
 */
const EMPTY: object = Object.freeze({});
