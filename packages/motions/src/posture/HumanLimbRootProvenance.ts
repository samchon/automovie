import { fitSeededChainToTarget } from "@automovie/engine";
import type { IAutoMovieSeededChainFit } from "@automovie/interface";

/**
 * Transport genuine algebraic-root facts through owned fit copies.
 * Only the engine's guarded original-result accessor can issue these facts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original engine capture, exact seed-coordinate transport, fresh observations and weak private ownership; copied public fact objects grant no authority.
 * @evidence contracts/development/design.md#principled-representation Weak seed identity carries the engine-owned finite root counts and bone-local degree branch/swivel. Read/copy also require unchanged exact seed scalars; owned mirrors and root-frame restoration preserve that canonical seed convention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanLimbFit captures the actual result, Memory transports genuine seed copies, and HumanPosturePreparation reads fresh facts for the separately checked curve cell; the engine owns the root type and physical admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller flag, inferred cache counter, JSON string or arbitrary packet can register provenance. These facts certify only the original point solve; current rig/cell/goal validation remains mandatory downstream.
 */
export namespace HumanLimbRootProvenance {
  /**
   * Capture actual engine identity before any mirror, root restoration or clone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the sole producer of private seed evidence and its original-result requirement.
   * @evidence contracts/development/implementation.md#principled-implementation The engine validates original result/pose/seed descriptors and scalars against private actual-root issuance; foreign, changed or copied results produce no facts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One guarded engine read creates one private primitive packet; solving and root classification remain in engine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never fabricates roots, changes the fit, counts acceptance by inference or admits caller-provided packets.
   * @evidence contracts/development/implementation.md#efficient-algorithms The engine performs its O(J) original-slot guard without cloning the pose; successful capture adds one constant-size packet.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Genuine original seed identity is the only capture source; later copies require that private membership and exact canonical seed values.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak seed membership retains only a small copied numeric packet, never the fit, pose, body, reader or prior query.
   */
  export function capture(fit: IAutoMovieSeededChainFit): void {
    if (fit.seed === null) return;
    const root: IRoot | undefined = fitSeededChainToTarget.orientationRoot(fit);
    if (root !== undefined) ROOTS.set(fit.seed, { ...root });
  }

  /**
   * Restore private provenance only between an actual owned seed and its copy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines clone/capture/hit transport and unchanged bone-local branch/swivel, including signed zero.
   * @evidence contracts/development/implementation.md#principled-implementation An owned seed clone preserves the actual root selection when both exact scalars match the genuine private source packet. Mirrors and common rigid root restoration keep these canonical chain-local scalars unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Memory calls this at its actual copy boundaries; no pose cache, public registration method or alternate root classifier is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only private genuine source membership permits transfer. A fresh public read packet or matching ordinary GRID key supplies no source authority.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant weak lookups and four exact scalar comparisons replace no numerical fitting or validation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared immutable-by-ownership numeric facts describe the same completed root while each returned seed remains independently owned.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Both memberships are weak; the packet contains only five primitive numbers and releases with its last actual seed.
   */
  export function copy(
    source: IAutoMovieSeededChainFit["seed"],
    target: IAutoMovieSeededChainFit["seed"],
  ): void {
    if (source === null || target === null) return;
    const root: IRoot | undefined = ROOTS.get(source);
    if (root !== undefined && matches(source, root) && matches(target, root))
      ROOTS.set(target, root);
  }

  /**
   * Observe independent facts from a genuine unchanged canonical seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns fresh numeric facts or undefined; this does not validate the current curve cell or mutable rig.
   * @evidence contracts/development/implementation.md#principled-implementation Private producer membership and exact original branch/swivel retain engine provenance through legitimate copies, never through numeric equality alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak lookup and scalar guard provide the preparation observer without exposing a registration token.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Public observations are copies and cannot mint or mutate private evidence; current physical checks remain with their owners.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and one small successful observation allocation, without a full pose clone or JSON traversal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each read independently observes the actual retained scalar facts.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the fresh packet; this read retains no observation, seed, result or handle.
   */
  export function read(
    seed: IAutoMovieSeededChainFit["seed"],
  ): IRoot | undefined {
    if (seed === null) return undefined;
    const root: IRoot | undefined = ROOTS.get(seed);
    return root !== undefined && matches(seed, root) ? { ...root } : undefined;
  }
}

/** Engine-owned scalar facts, without another independently maintained root schema. */
type IRoot = NonNullable<
  ReturnType<typeof fitSeededChainToTarget.orientationRoot>
>;

/** Actual original/copy seed lifetimes alone bound private membership. */
const ROOTS: WeakMap<
  NonNullable<IAutoMovieSeededChainFit["seed"]>,
  IRoot
> = new WeakMap();

/** Bone-local seed coordinates remain exact through the owner's legitimate transforms. */
function matches(
  seed: NonNullable<IAutoMovieSeededChainFit["seed"]>,
  root: IRoot,
): boolean {
  return (
    Object.is(seed.branch, root.branch) && Object.is(seed.swivel, root.swivel)
  );
}
