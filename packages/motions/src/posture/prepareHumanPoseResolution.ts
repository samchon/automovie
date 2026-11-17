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

  /** The private terminal owner of a completely factory-owned parent chain; never a native-method verdict. */
  terminal?: IReading;
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This adapter owns lazy source/current-reader state and private readSource owns the shared absent/direct/bare-supplier dispatch. Immediate observations use read; repeated loans keep the lazy factory. A genuine child links its parent's private terminal state without calling it. isNativeSource still asks the engine to check that terminal's current methods on every consumption; unknown suppliers retain the original full walk.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not memoize a pose, numerical callback, fit, goal, near seed or query result. The optional supplier provides only the parent's exact FK workspace; all actual fits and changed dependencies remain evaluated normally.
 * @evidence contracts/development/implementation.md#efficient-algorithms One closure/state and one terminal reference support repeated lazy reads. Fully factory-owned parent chains resolve provenance in O(1) instead of O(D), still performing the same current-reader descriptor gate. Unknown-supplier chains retain the original O(D) iterative path and no supplier runs for inspection. Immediate read allocates no discarded wrapper/state/registry entry; runtime gains are unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The private readonly single-parent graph proves all initialized genuine getters share their terminal's actual reader. Only that structural terminal link is reused, never a native-method verdict. Current terminal joint/bone methods are rechecked on every consumption, so replacement or restoration remains observable. This certifies no source/pose admission, mutable rig, fit or numerical result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous owner releases one getter/state borrowing its original parent, at most one reader and its already reachable terminal state. Immediate read retains no additional state; no path arrays or epoch histories are created. Weak registry keys add no strong getter population and chains release with their owners. No pose, numerical history, retained plan/body entry, task or handle is stored here.
 */
export function prepareHumanPoseResolution(
  source?:
    | ReturnType<typeof preparePoseResolution>
    | (() => ReturnType<typeof preparePoseResolution>),
): () => ReturnType<typeof preparePoseResolution> {
  const state: IReading = { source, reader: typeof source === "function" ? undefined : source };
  state.terminal = typeof source === "function" ? SOURCES.get(source)?.terminal : state;
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
   * without being called or inspected. A completely genuine parent chain's
   * private terminal link shares only structural origin: its actual current
   * reader still receives the engine's live method check on every call.
   * Before its first demand, only an undefined terminal source promises native
   * creation. Unknown suppliers retain the original full iterative lookup.
   * No supplier, FK or solve runs; provenance certifies no source/pose admission.
   */
  export function isNativeSource(source: ISource): boolean {
    const terminal: IReading | undefined = typeof source === "function"
      ? SOURCES.get(source)?.terminal : undefined;
    if (terminal !== undefined)
      return terminal.reader === undefined
        ? terminal.source === undefined : preparePoseResolution.isNative(terminal.reader);
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
