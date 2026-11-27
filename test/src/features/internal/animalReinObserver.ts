import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./nclose";

/**
 * Observe the complete held run against the actual straight rein primitive.
 *
 * @param part The real rod, whose local positive Y runs toward its far end.
 * @param contact The real rein frame, held length and grip diameter.
 * @param label Scenario and film time attached to every finding.
 * @param findings Whole-round failure collector.
 * @evidence contracts/development/common.md#meaningful-documentation Defines metre dimensions, the rod's positive Y axis, the held run centred on contact X and its actual proximal start; the hand is not assumed to sit at the centre of a longer rod.
 * @evidence contracts/development/implementation.md#principled-implementation Inverse-transform both contact X endpoints into the actual cylinder or capsule. Their transverse coordinates vanish and both lie within its axial segment; the held centre is half the held length from the rod's proximal endpoint, grip diameter is twice radius and contact X is parallel to rod Y.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit actual rod and positive dimensions, observe its held centre and axis, then inspect both physical held endpoints while collecting every failed predicate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No span metadata, source solver, fabricated head point or entire-rod-centre substitution supplies an expected grip; unsupported geometry is a failed observation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant vector arithmetic and two held-endpoint observations, independent of film length or model size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's quaternion and vector primitives and the existing independent nclose assertion helper, without calling a span or carriage owner.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no records; only caller-owned failure strings escape.
 */
export function animalReinObserver(
  part: IAutoMovieModelPart,
  contact: IAutoMovieAffordance,
  label: string,
  findings: string[],
): void {
  if (
    part.transform === null ||
    part.transform === undefined ||
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new Error(`${label}: unsupported actual rein ${part.id}`);
  const height: number = part.geometry.shape.height;
  const radius: number = part.geometry.shape.radius;
  const held: number = contact.length ?? NaN;
  const aperture: number = contact.aperture ?? NaN;
  truth(
    "positive actual rod and held dimensions",
    [height, radius, held, aperture].every(
      (value: number): boolean => value > 0,
    ),
  );
  truth("held run fits actual rod", held <= height + 1e-9);
  near("actual grip diameter", aperture, 2 * radius);
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    part.transform.rotation,
  );
  const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    part.transform.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const along: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    contact.frame.rotation,
    { x: 1, y: 0, z: 0 },
  );
  near("contact X follows actual rod Y", Math.abs(AutoMovieEngineVector3.dot(axis, along)), 1);
  const middle: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    inverse,
    AutoMovieEngineVector3.subtract(contact.frame.translation, part.transform.translation),
  );
  near("held midpoint X lies on actual rod", middle.x, 0);
  near("held midpoint Z lies on actual rod", middle.z, 0);
  near(
    "held midpoint is half a held run from actual proximal end",
    middle.y,
    (held - height) / 2,
  );
  for (const side of [-1, 1] as const) {
    const endpoint: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      contact.frame.translation,
      AutoMovieEngineVector3.scale(along, (side * held) / 2),
    );
    const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      inverse,
      AutoMovieEngineVector3.subtract(endpoint, part.transform.translation),
    );
    near(`held endpoint ${side} lies on actual rod X`, local.x, 0);
    near(`held endpoint ${side} lies on actual rod Z`, local.z, 0);
    truth(
      `held endpoint ${side} remains inside actual segment`,
      Math.abs(local.y) <= height / 2 + 1e-9,
    );
  }

  /** Observe finite scalars at the same rigid-arithmetic metre precision. */
  function near(id: string, actual: number, expected: number): void {
    truth(
      `${id}: ${actual} expected ${expected}`,
      nclose(actual, expected, 1e-9),
    );
  }

  /** Preserve every physical finding for the complete positive matrix. */
  function truth(id: string, condition: boolean): void {
    try {
      TestValidator.predicate(`${label}/${contact.id}: ${id}`, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
