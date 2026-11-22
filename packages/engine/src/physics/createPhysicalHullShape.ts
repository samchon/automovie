import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Original references and scalar placement of one allocated shape. */
interface IAutoMovieHullShapeReceipt {
  points: IAutoMovieVector3[];
  transform: IAutoMoviePhysicalShape["transform"];
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  words: readonly number[];
}

/** Shape authority belongs to this geometry allocator. */
const SHAPES: WeakMap<IAutoMoviePhysicalShape, IAutoMovieHullShapeReceipt> =
  new WeakMap();

/** The genuine geometry operations that issue private transform operands. */
const IDENTITY: typeof Quaternion.identity = Quaternion.identity;
const SUBTRACT: typeof Vector3.subtract = Vector3.subtract;

/** One profile construction owns a shared rotation and its placed hulls. */
interface IAutoMovieHullShapeFactory {
  rotation: IAutoMovieQuaternion;
  offset(
    a: () => IAutoMovieVector3,
    b: () => IAutoMovieVector3,
  ): IAutoMovieVector3;
  shape(
    id: string,
    material: string,
    position: IAutoMovieVector3,
    points: IAutoMovieVector3[],
  ): IAutoMoviePhysicalShape;
}

/**
 * Open one actual hull constructor group with the same shared identity rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the shared rotation, local offsets, points and returned shape ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Original engine operations allocate the rotation and offsets. Actual owned outputs issue one shape receipt without changing public field aliases.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One identity allocation, original offset operator and shape assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original supplied points, actual placement values and shared rotation. Unknown offset or rotation origins issue no receipt.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time identity and offset creation, independent of hull vertices.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Live native geometry can supply a qualified repeat without losing original public aliases.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The group lives with its caller; weak receipts follow individual shapes.
 */
export function createPhysicalHullShape(): IAutoMovieHullShapeFactory {
  const original: boolean = own(Quaternion, "identity") === IDENTITY;
  const rotation: IAutoMovieQuaternion = Quaternion.identity();
  const offsets: WeakSet<IAutoMovieVector3> = new WeakSet();
  return {
    rotation,
    offset(
      a: () => IAutoMovieVector3,
      b: () => IAutoMovieVector3,
    ): IAutoMovieVector3 {
      const native: boolean = own(Vector3, "subtract") === SUBTRACT;
      const position: IAutoMovieVector3 = Vector3.subtract(a(), b());
      if (native) offsets.add(position);
      return position;
    },
    shape(
      id: string,
      material: string,
      position: IAutoMovieVector3,
      points: IAutoMovieVector3[],
    ): IAutoMoviePhysicalShape {
      const transform: IAutoMoviePhysicalShape["transform"] = {
        position,
        rotation,
      };
      const hull: IAutoMoviePhysicalShape = {
        id,
        material,
        transform,
        kind: "hull",
        points,
      };
      if (original && offsets.has(position)) {
        const current: readonly unknown[] = wordsOf(position, rotation);
        if (finite(current))
          SHAPES.set(hull, {
            points,
            transform,
            position,
            rotation,
            words: current,
          });
      }
      return hull;
    },
  };
}
/**
 * Verify the current placement of an actually allocated hull shape.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the actual native source and continued equivalence of its operands.
 * @evidence contracts/development/design.md#principled-representation Identity and exact scalar values certify the owned shape and placement, while topology remains with the hull topology owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One read-only predicate for actual repeated point trials.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Foreign shape and transform replacements cannot be inspected or reference matched by structure.
 */
export namespace createPhysicalHullShape {
  /**
   * Check the original point-array and transform identities and placement bits.
   *
   */
  export function current(shape: IAutoMoviePhysicalShape): boolean {
    const receipt: IAutoMovieHullShapeReceipt | undefined = SHAPES.get(shape);
    if (
      receipt === undefined ||
      own(shape, "kind") !== "hull" ||
      own(shape, "points") !== receipt.points ||
      own(shape, "transform") !== receipt.transform ||
      own(receipt.transform, "position") !== receipt.position ||
      own(receipt.transform, "rotation") !== receipt.rotation
    )
      return false;
    const current: readonly unknown[] = wordsOf(
      receipt.position,
      receipt.rotation,
    );
    return receipt.words.every((value: number, index: number): boolean =>
      Object.is(value, current[index]),
    );
  }
}

/** Read the own value of a known ordinary record. */
function own(owner: object, field: string): unknown {
  const descriptor: PropertyDescriptor | undefined =
    Object.getOwnPropertyDescriptor(owner, field);
  return descriptor !== undefined && Object.hasOwn(descriptor, "value")
    ? descriptor.value
    : undefined;
}

/** Read only own scalar data from the known allocator-owned placement. */
function wordsOf(
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): readonly unknown[] {
  return [
    own(position, "x"),
    own(position, "y"),
    own(position, "z"),
    own(rotation, "x"),
    own(rotation, "y"),
    own(rotation, "z"),
    own(rotation, "w"),
  ];
}

/** Reject malformed or accessor-backed placement before issuing a receipt. */
function finite(words: readonly unknown[]): words is readonly number[] {
  return words.every(
    (value: unknown): boolean =>
      typeof value === "number" && Number.isFinite(value),
  );
}
