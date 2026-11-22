import {
  createPhysicalHullShape,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmOvershootRoom } from "./HumanArmOvershootRoom";
import { HumanShapeFraming } from "./HumanShapeFraming";

/** Values used by the clearance comparison, before later candidate queries. */
type AutoMovieClearanceWord = number | boolean | object;

/**
 * Capture the room's numerical inputs at their original first use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Captures only actual first room inputs and the original scalar hull queries of one trial.
 * @evidence contracts/development/design.md#principled-representation The broad check uses current packed planes, posed frames and lead; the exact check uses the actual point distance owner's reached topology proof.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The scorer compares rooms, verifies actual backing and restores the original local broad-phase lead after exact reuse.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No hull is queried or prepared before its original use, and no unsupported profile or mutable backing is treated as equivalent.
 */
export class HumanArmBendRoom {
  /** One actual engine scalar trial; no signed-distance result is retained. */
  public readonly trial: ReturnType<
    typeof physicalShapeSegmentDistance.pointTrial
  > = physicalShapeSegmentDistance.pointTrial();

  /** Room and its first-use scalar words. */
  #room: HumanArmOvershootRoom.IRoom | undefined;
  #words: AutoMovieClearanceWord[] | undefined;

  /**
   * Capture the original first room evaluation, after the radius read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Takes the actual room and forearm radius after the source reader.
   * @evidence contracts/development/implementation.md#principled-implementation Retains exact broad-phase words only after all shape identities and packed operands qualify.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered collection of the chest, room and actual shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unsupported shape, reference or backing leaves this trial unproved.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded pass over shapes and their packed words, once per trial.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact IEEE values and shape identities describe the same room input.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The trial owns its first room and words until the enclosing sweep releases it.
   */
  public read(room: HumanArmOvershootRoom.IRoom, radius: number): void {
    if (this.#room !== undefined) return;
    this.#room = room;
    const words: AutoMovieClearanceWord[] = [
      room.present,
      room.chest !== undefined,
      radius,
      room.shapes.length,
    ];
    if (room.chest !== undefined && !vector(words, room.chest.pose.position))
      return;
    if (!vector(words, room.out)) return;
    for (const { shape, framed, pose, free, rest } of room.shapes) {
      if (!createPhysicalHullShape.current(shape) || shape.kind !== "hull")
        return;
      const planes: Float64Array | undefined = HumanShapeFraming.bendPlanes(
        shape.points,
        framed,
      );
      if (
        planes === undefined ||
        framed.origin === undefined ||
        framed.inverse === undefined
      )
        return;
      words.push(
        shape,
        shape.points,
        planes,
        free,
        rest,
        framed.radius,
        framed.lead,
      );
      if (
        !vector(words, pose.position) ||
        !rotation(words, pose.rotation) ||
        !vector(words, framed.centre) ||
        !vector(words, framed.origin) ||
        !rotation(words, framed.inverse)
      )
        return;
      for (let index: number = 0; index < planes.length; ++index)
        words.push(planes[index]!);
    }
    this.#words = words;
  }

  /** Whether the two actual trials proved the same first-use broad room. */
  public same(other: HumanArmBendRoom): boolean {
    const words: AutoMovieClearanceWord[] | undefined = this.#words;
    const known: AutoMovieClearanceWord[] | undefined = other.#words;
    return (
      words !== undefined &&
      known !== undefined &&
      words.length === known.length &&
      words.every((value: AutoMovieClearanceWord, index: number): boolean =>
        Object.is(value, known[index]),
      )
    );
  }

  /** Read a completed numerical trial's ordering hints, only with valid backing. */
  public completed(): readonly number[] | undefined {
    if (this.#words === undefined || this.trial.status() !== "current")
      return undefined;
    return this.#room!.shapes.map(
      (shape: HumanArmOvershootRoom.IShape): number => shape.framed.lead,
    );
  }

  /** Advance current private broad-phase hints to those of the same completed trial. */
  public finish(leads: readonly number[]): void {
    const shapes: HumanArmOvershootRoom.IShape[] = this.#room!.shapes;
    for (let index: number = 0; index < shapes.length; ++index)
      shapes[index]!.framed.lead = leads[index]!;
  }
}

/** Append the actual components of a private vector source. */
function vector(
  words: AutoMovieClearanceWord[],
  value: IAutoMovieVector3,
): boolean {
  return scalars(words, value, ["x", "y", "z"]);
}

/** Append the actual components of a private quaternion source. */
function rotation(
  words: AutoMovieClearanceWord[],
  value: IAutoMovieQuaternion,
): boolean {
  return scalars(words, value, ["x", "y", "z", "w"]);
}

/** Require plain own numeric components of an already proved record. */
function scalars(
  words: AutoMovieClearanceWord[],
  value: object,
  keys: readonly string[],
): boolean {
  for (const key of keys) {
    const scalar: unknown = Object.getOwnPropertyDescriptor(value, key)?.value;
    if (typeof scalar !== "number" || !Number.isFinite(scalar)) return false;
    words.push(scalar);
  }
  return true;
}
