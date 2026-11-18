import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { resolveHumanArmChain } from "./resolveHumanArmChain";

/** One private exact local-coordinate key and its completed, frozen articulation. */
interface IEntry {
  /** The bone owning this local domain. */
  bone: AutoMovieHumanoidBone;

  /** A private three-scalar snapshot; caller coordinate buffers are never retained. */
  angles: readonly [number, number, number];

  /** The completed local articulation, never exposed as a world result. */
  rotation: IAutoMovieQuaternion;
}

/** Compare exact local coordinates, including signed zero and NaN identity. */
function matches(
  entry: IEntry | undefined,
  bone: AutoMovieHumanoidBone,
  flexion: number,
  abduction: number,
  twist: number,
): boolean {
  return (
    entry !== undefined &&
    entry.bone === bone &&
    Object.is(entry.angles[0], flexion) &&
    Object.is(entry.angles[1], abduction) &&
    Object.is(entry.angles[2], twist)
  );
}

/** Copy successful local work into private immutable storage without freezing a producer's object. */
function entry(
  bone: AutoMovieHumanoidBone,
  flexion: number,
  abduction: number,
  twist: number,
  rotation: IAutoMovieQuaternion,
): IEntry {
  return {
    bone,
    angles: [flexion, abduction, twist],
    rotation: Object.freeze({
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      w: rotation.w,
    }),
  };
}

/**
 * Prepare exact local articulation reuse within one synchronous derivative
 * invocation over one unchanged setup and frame. This is not a cross-fit,
 * seed, instant or trajectory result cache.
 *
 * @param setup The actual prepare-produced setup, unchanged until reader release.
 * @param at This derivative invocation's unchanged frame.
 * @param readShoulder The existing pure HumanArmGeometry.shoulder implementation.
 * @param readRotation The existing pure HumanArmGeometry.rotation implementation.
 * @returns A chain reader; the caller releases it when that derivative finishes or throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the one-derivative boundary, unchanged dependencies, pure primitive-reader provenance, exact local inputs and caller release responsibility.
 * @evidence contracts/development/implementation.md#principled-implementation A local articulation depends on its actual bone, three Object.is-equal local coordinates and fixed rig/frame/domain data, independently of changed upstream world rotations; successful identical local work is therefore shared while resolveHumanArmChain still recomputes every world prefix.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One latest shoulder entry and one latest entry per lower/hand bone wrap only the existing pure primitives; the shared chain owner keeps all FK expression grouping and query order in one place.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every distinct triple runs actual projection/composition, failures are never stored and signed zero stays distinct. The owning caller supplies only the existing pure shoulder/rotation primitives, without target or obstruction callbacks; private frozen quaternion copies cannot be corrupted through mutable returned world records.
 * @evidence contracts/development/implementation.md#efficient-algorithms Local hits compare three current scalars without constructing lower/hand input tuples. Misses keep the actual projection's tuple, private three-angle snapshot and quaternion copy; all world FK/fresh output remains. At most three current entries are retained and runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only exact completed local work under the one unchanged derivative scope is reused; coordinate keys are scalar snapshots, each incoming world prefix is recomputed and neither caller buffers nor final chain results become memo keys or values.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller's local reader owns one shoulder entry and at most two lower/hand entries plus borrowed setup/frame/functions; completion or failure releases the reader and its constant-size state, with no global map, pose population, handle or task.
 */
export function prepareHumanArmChain(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  at: IAutoMovieMotionHumanArmGeometry.IFrame,
  readShoulder: typeof G.shoulder,
  readRotation: typeof G.rotation,
): (c: readonly number[]) => Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> {
  let shoulder: IEntry | undefined;
  const joints: Map<AutoMovieHumanoidBone, IEntry> = new Map();
  const shoulderAt: typeof G.shoulder = (
    current: IAutoMovieMotionHumanArmGeometry.ISetup,
    c: readonly number[],
  ): IAutoMovieQuaternion => {
    const bone: AutoMovieHumanoidBone = current.bones.upper;
    if (!matches(shoulder, bone, c[0]!, c[1]!, c[2]!))
      shoulder = entry(
        bone,
        c[0]!,
        c[1]!,
        c[2]!,
        readShoulder(current, c),
      );
    return shoulder!.rotation;
  };
  const rotationAt: NonNullable<Parameters<typeof resolveHumanArmChain>[5]> = (
    current: IAutoMovieMotionHumanArmGeometry.ISetup,
    bone: AutoMovieHumanoidBone,
    flexion: number,
    abduction: number,
    twist: number,
  ): IAutoMovieQuaternion => {
    let known: IEntry | undefined = joints.get(bone);
    if (!matches(known, bone, flexion, abduction, twist)) {
      known = entry(
        bone,
        flexion,
        abduction,
        twist,
        readRotation(current, bone, [flexion, abduction, twist]),
      );
      joints.set(bone, known);
    }
    return known!.rotation;
  };
  return (c: readonly number[]): Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> =>
    resolveHumanArmChain(setup, at, c, shoulderAt, readRotation, rotationAt);
}
