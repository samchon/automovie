import type {
  IAutoMovieMotionWeaponPath,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { StrikingWeapon } from "./StrikingWeapon";

/**
 * Constructor-owned chain/index provenance and operation-local sampling of
 * original plan weapons. No pose, endpoint or clock answer is kept here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines weak original-weapon metadata and exact synchronous sampling without posed-result retention.
 * @evidence contracts/development/design.md#principled-representation One weak registration identifies adjacent ends of the existing chain; returned axes remain StrikingWeapon's canonical readonly pair.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Capsule construction registers provenance and the existing StrikingWeapon read/sample facades delegate actual endpoint work here; no public barrel or new weapon representation is required.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no body/pose/time cache, alternate contact outcome, solver or geometry tolerance; only constructor metadata establishes shared chain ownership.
 */
export namespace StrikingWeaponSample {
  /**
   * Register one capsule's two adjacent chain endpoints at construction.
   *
   * @param weapon The actual original weapon made by capsules.
   * @param chain Its existing body/course/ends owner.
   * @param index The capsule's original first-end index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States construction-only original identity and adjacent-end provenance.
   * @evidence contracts/development/implementation.md#principled-implementation capsules has already validated one radius per id and constructs path/tail from indices i/i+1, so registering that same chain/index proves their common source.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak registration supplies both actual single-axis and grouped readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Registers the original weapon instead of a wrapped adapter and stores no fitted state, guessed limb or time answer; authored geometry and callback behavior remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup per capsule with one two-field metadata record; actual endpoint work stays deferred.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the capsule producer establishes chain correspondence, rather than structural guesses from ids or matching outputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weak weapon key owns its chain/index only while that weapon is reachable; no strong key list, sampled endpoint or history grows.
   */
  export function bind(weapon: IAutoMovieMotionWeaponPath, chain: StrikingWeapon.IChain, index: number): void {
    CHAINS.set(weapon, { chain, index });
  }

  /**
   * Read one actual axis at an exact film second.
   *
   * @param weapon The original plan weapon.
   * @param seconds The current exact film second.
   * @returns Its actual world-metre centre and optional capsule end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines original identity, exact film time, endpoint order and absent-tail sphere meaning.
   * @evidence contracts/development/implementation.md#principled-implementation Registered adjacent endpoints come from one actual chain evaluation. Unregistered weapons keep their original path then optional tail reads in order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak lookup chooses a combined chain read or original callbacks; the StrikingWeapon facade preserves the existing consumer entry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The actual source/fit runs for every invocation and no other actor, clock, stop state or callback answer is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Registered capsules pay one chain evaluation for two ends; legacy work remains one/two callbacks. Source fit/FK dominates and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Constructor provenance proves both ends share this exact chain/time/current context. Separate invocations still evaluate their own source.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation returns only a fresh endpoint pair and retains no sampled vectors, time or stop map; weak provenance has the weapon's lifetime.
   */
  export function read(weapon: IAutoMovieMotionWeaponPath, seconds: number): StrikingWeapon.IAxis {
    const binding: IBinding | undefined = CHAINS.get(weapon);
    if (binding === undefined) return [weapon.path(seconds), weapon.tail?.(seconds)];
    const ends: readonly IAutoMovieVector3[] = binding.chain.ends(seconds);
    return [ends[binding.index]!, ends[binding.index + 1]!];
  }

  /**
   * Read demanded original weapons together in one synchronous context.
   *
   * @param weapons The consumer's existing ordered demand.
   * @param seconds One exact film second for this operation.
   * @returns Actual axes keyed by their original weapon identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact current demand/order, film time and operation-local result ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Capsules whose constructor proves one chain share its actual endpoint evaluation within this invocation; distinct chains and legacy callbacks remain independent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An ordered weapon traversal uses one local chain-to-ends map and one result map, with no persistent numerical cache.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every demanded chain still runs its actual course/fit and original endpoints; no sampling reduction, alternate time, actor, stop context or physical acceptance is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms W requested weapons evaluate C distinct registered chains once each plus legacy callbacks, using O(W+C) temporary map space. Physical producer cost remains payable and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One explicit call fixes current context/time and constructor provenance fixes body/course ownership; the consumer consumes results before applying state-changing stops.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The chain map ends on return or throw; returned weapon-keyed axes are operation-owned actual endpoints, with no new body/plan cache, reader or history retained.
   */
  export function sample(weapons: readonly IAutoMovieMotionWeaponPath[], seconds: number): ReadonlyMap<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> {
    const chains: Map<StrikingWeapon.IChain, readonly IAutoMovieVector3[]> = new Map();
    const axes: Map<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis> = new Map();
    for (const weapon of weapons) {
      const binding: IBinding | undefined = CHAINS.get(weapon);
      if (binding === undefined) {
        axes.set(weapon, read(weapon, seconds));
        continue;
      }
      let ends: readonly IAutoMovieVector3[] | undefined = chains.get(binding.chain);
      if (ends === undefined) {
        ends = binding.chain.ends(seconds);
        chains.set(binding.chain, ends);
      }
      axes.set(weapon, [ends[binding.index]!, ends[binding.index + 1]!]);
    }
    return axes;
  }
}

/** Immutable constructor provenance, with no sampled numerical state. */
interface IBinding {
  /** The capsule's actual body/course/ends owner. */
  chain: StrikingWeapon.IChain;
  /** Its first adjacent endpoint. */
  index: number;
}

/** Weak ownership metadata only; no query/time answer survives an operation. */
const CHAINS: WeakMap<IAutoMovieMotionWeaponPath, IBinding> = new WeakMap();
