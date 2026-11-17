import { preparePoseResolution } from "@automovie/engine";

/** The existing direct-reader or lazy-parent loan; absence owns a fresh native reader. */
type ISource = ReturnType<typeof preparePoseResolution> |
  (() => ReturnType<typeof preparePoseResolution>) | undefined;

/** Actual factory-owned source/current-reader values, never source-pose admission. */
interface IReading {
  /** Captured parent remains unchanged for this getter's lifetime. */
  readonly source: ISource;

  /** Actual completed lazy reader, absent before the first real FK demand. */
  reader: ReturnType<typeof preparePoseResolution> | undefined;
}

/** Weak provenance admits only this owner's exact factory getter, without inspecting foreign functions. */
const SOURCES: WeakMap<() => ReturnType<typeof preparePoseResolution>, IReading> = new WeakMap();

/**
 * Own a lazy exact-FK reader for one synchronous person evaluation, or borrow
 * its parent's reader/supplier. No reader or supplier is evaluated until the
 * first actual FK demand. Release the returned getter with that evaluation;
 * it must not enter a retained plan, body fit entry or public result closure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States parent-source forms, lazy actual demand and synchronous ownership. read resolves one actual immediate demand without a discarded lazy wrapper. isNativeSource defines private getter provenance, transitive native-reader checks, current-method rechecking and unknown-function refusal without invocation.
 * @evidence contracts/development/implementation.md#principled-implementation Every demand returns the same operation-owned preparePoseResolution reader. Raw calls share pure admitted-basis joint factors; the body's immutable FK producer uses that actual operation identity for its own exact scalar dependency rows, independently of targets and solves.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This adapter owns lazy source/current-reader state and private readSource owns the shared absent/direct/bare-supplier dispatch. Immediate observations use read; repeated loans keep the lazy factory. Genuine getters call the private owner independently of public companion replacement. A private weak registry supports isNativeSource; the engine owns method provenance and actual admission/FK rows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not memoize a pose, numerical callback, fit, goal, near seed or query result. The optional supplier provides only the parent's exact FK workspace; all actual fits and changed dependencies remain evaluated normally.
 * @evidence contracts/development/implementation.md#efficient-algorithms One closure/state record supports repeated lazy reads. Immediate read dispatch allocates neither that discarded wrapper/state nor a weak-registry entry, and creates an engine reader only for absent input. No-FK callers leave the lazy getter unread; immediate observations dispatch only at actual demand. Native-source inspection traverses D actual parent getters in O(D) time/O(1) stack, invoking none and checking changed cached readers through the engine's constant descriptor gate. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit parent loans share one synchronous person's actual reader. isNativeSource proves only native factory/source-chain provenance; unknown functions are never invoked for inspection, and current cached methods are rechecked. It never certifies source/pose admission or a fit and no numerical result is cached here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous owner releases one getter/state borrowing its original parent and at most one reader. Immediate read retains no source or additional state after return/throw. The weak registry adds no strong getter population; parent chains release with their actual owners. No pose, result history, retained plan/body entry, task or handle is stored by this adapter.
 */
export function prepareHumanPoseResolution(
  source?:
    | ReturnType<typeof preparePoseResolution>
    | (() => ReturnType<typeof preparePoseResolution>),
): () => ReturnType<typeof preparePoseResolution> {
  const state: IReading = { source, reader: typeof source === "function" ? undefined : source };
  const read: () => ReturnType<typeof preparePoseResolution> = (): ReturnType<typeof preparePoseResolution> => {
    if (state.reader === undefined)
      state.reader = readSource(source);
    return state.reader;
  };
  SOURCES.set(read, state);
  return read;
}

/**
 * Provenance of the actual lazy-parent chain, separate from pose admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines absent/direct/lazy forms, no-invocation inspection, cached-method rechecking and conservative unknown-source refusal.
 * @evidence contracts/development/design.md#principled-representation Each genuine getter weakly owns its actual immutable parent reference and current reader. The source graph points only to previously created parents, so iteration needs no cycle marker or recursive stack.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Actual lowering/observation sites use read for a one-time loan; repeated consumers keep the lazy factory. Canonical source preparation inspects its actual borrowed FK source through isNativeSource before issuing/consuming reusable metadata. No caller registration or validity setter exists.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Foreign/wrapped/proxy functions receive no property or descriptor probes and never run during inspection. Only factory source chains and actual current engine-native readers pass; no source geometry, successful solve or pose validity is represented.
 */
export namespace prepareHumanPoseResolution {
  /**
   * Obtain one reader at an actual immediate FK demand. Absent input creates
   * a fresh native reader, direct input returns unchanged, and a supplier is
   * called once without a receiver, at the same position as a lazy first read.
   * This is actual dispatch, not provenance inspection or source admission:
   * foreign suppliers still run and throw normally. Callers retain the reader
   * only for their synchronous operation. No wrapper closure, state record,
   * weak registration or source/result history is retained by this dispatch.
   */
  export function read(source?: ISource): ReturnType<typeof preparePoseResolution> {
    return readSource(source);
  }

  /**
   * Whether an absent/direct/lazy loan can supply only an unchanged native reader.
   * Undefined owns native creation; direct readers use the engine's actual
   * provenance/method check. Only genuine factory getters expose private
   * captured-source/current-reader metadata; unknown functions return false
   * without being called or inspected. Every actual cached reader is checked
   * against its current methods, with repeated identical references shared
   * during this side-effect-free inspection. No supplier, FK or solve runs.
   * This O(D) iterative lookup retains nothing after return and certifies no
   * source/pose admission. Callers still run the cold path for unsupported loans.
   */
  export function isNativeSource(source: ISource): boolean {
    let current: ISource = source;
    let checked: ReturnType<typeof preparePoseResolution> | undefined;
    while (typeof current === "function") {
      const state: IReading | undefined = SOURCES.get(current);
      if (state === undefined) return false;
      if (state.reader !== undefined && state.reader !== checked) {
        if (!preparePoseResolution.isNative(state.reader)) return false;
        checked = state.reader;
      }
      current = state.source;
    }
    return current === undefined || current === checked || preparePoseResolution.isNative(current);
  }
}

/** Preserve the actual bare supplier call and undefined-only native default in one private owner. */
function readSource(source: ISource): ReturnType<typeof preparePoseResolution> {
  return typeof source === "function" ? source()
    : source === undefined ? preparePoseResolution() : source;
}
