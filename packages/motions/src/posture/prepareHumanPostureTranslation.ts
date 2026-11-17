import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * Prepare only the nonescaping expected translation used by carried's exact
 * signature comparison. The caller supplies its private structuredClone raw
 * snapshot and keeps it unchanged; no borrowed result is a public posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual private-clone provenance, plain alias-free source validation, original external-root read order, nonescaping expected use and owned-prefix fallback.
 * @evidence contracts/development/implementation.md#principled-implementation A private structuredClone contains no accessors or functions. Plain alias-free joint-only/free-leg sources permit unchanged joints/rotations to be borrowed by an internal expected object while source-plus-displacement arithmetic constructs every changed point. carried separately preserves empty-goal Euler replacement and detaches the borrowed prefix before possible JSON callbacks; rich/aliased sources retain complete graph-preserving translation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One source inspection creates a root-to-expected builder; HumanPosturePreparation.carried owns immediate comparison and the complete-copy fallback. Public translated never uses this borrowed builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not solve, certify a carried posture, probe external root descriptors or alter any raw goal. The actual private raw owner calls it; root subtraction then spread execute once in original order, and the consumer inspects only that fresh copy before detaching any prefix exposed to possible JSON callbacks.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(J+G) plain-tree inspection replaces repeated whole raw cloning for J direct triples and at most two free-leg goals. Each supported expected translation allocates only outer/root/limb/goal/point records, retains the original JSON comparison and makes no measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The source's actual private immutable clone proves unchanged prefix ownership, rather than caller identity or a trusted flag. Required scalar points/tuples and alias-free containers are checked once; each current root retains its original reads and every displacement uses the original subtract/add grouping.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One closure borrows the existing preparation-owned raw snapshot and retains no candidate, result, reader, history or handle. Its expected object is consumed synchronously by carried and never enters issued output or weak evidence maps.
 */
export function prepareHumanPostureTranslation(source: IHumanPosture):
  ((root: IAutoMovieVector3) => IHumanPosture) | undefined {
  try {
    const seen: Set<object> = new Set();
    if (!plain(source, seen, ["root", "yaw", "pitch", "roll", "joints", "limbs"]) ||
      !vector(source.root, seen) || ![source.yaw, source.pitch, source.roll].every(Number.isFinite) ||
      !plain(source.joints, seen) || !plain(source.limbs, seen)) return undefined;
    for (const tuple of Object.values(source.joints)) {
      if (tuple === undefined || !Array.isArray(tuple) || Object.getPrototypeOf(tuple) !== Array.prototype ||
        tuple.length !== 3 || seen.has(tuple) || !tuple.every(Number.isFinite)) return undefined;
      const keys: string[] = Object.keys(tuple);
      if (keys.length !== 3 || keys.some((key: string): boolean => key !== "0" && key !== "1" && key !== "2")) return undefined;
      seen.add(tuple);
    }
    for (const [limb, goal] of Object.entries(source.limbs)) {
      if ((limb !== "leftLeg" && limb !== "rightLeg") || goal === undefined ||
        !plain(goal, seen, Object.hasOwn(goal, "rotation") ? ["point", "bend", "rotation"] : ["point", "bend"]) ||
        !vector(goal.point, seen) || !vector(goal.bend, seen) ||
        (goal.rotation !== undefined && (!plain(goal.rotation, seen, ["x", "y", "z", "w"]) ||
          ![goal.rotation.x, goal.rotation.y, goal.rotation.z, goal.rotation.w].every(Number.isFinite)))) return undefined;
    }

    return (root: IAutoMovieVector3): IHumanPosture => {
      const delta: IAutoMovieVector3 = Vector3.subtract(root, source.root);
      const placed: IAutoMovieVector3 = { ...root };
      const limbs: IHumanPosture["limbs"] = { ...source.limbs };
      for (const [limb, goal] of Object.entries(source.limbs)) {
        if (goal === undefined) continue;
        limbs[limb as "leftLeg" | "rightLeg"] = { ...goal,
          point: Vector3.add(goal.point, delta), bend: Vector3.add(goal.bend, delta) };
      }
      return { ...source, root: placed, limbs };
    };
  } catch { return undefined; }
}

/** The actual private clone already has normal data descriptors; require only its closed plain tree shape. */
function plain(value: object, seen: Set<object>, names?: readonly string[]): boolean {
  if (Object.getPrototypeOf(value) !== Object.prototype || seen.has(value)) return false;
  const keys: string[] = Object.keys(value);
  if (names !== undefined && (keys.length !== names.length || keys.some((key: string): boolean => !names.includes(key)))) return false;
  seen.add(value);
  return true;
}

/** Source points are finite plain private records, and cannot share graph nodes. */
function vector(value: IAutoMovieVector3, seen: Set<object>): boolean {
  return plain(value, seen, ["x", "y", "z"]) && [value.x, value.y, value.z].every(Number.isFinite);
}

