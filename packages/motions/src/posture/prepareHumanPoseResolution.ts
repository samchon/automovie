import { preparePoseResolution } from "@automovie/engine";

/**
 * The existing direct-reader or lazy-parent loan; absence owns a fresh native
 * reader.
 */
type ISource =
  | ReturnType<typeof preparePoseResolution>
  | (() => ReturnType<typeof preparePoseResolution>)
  | undefined;

/**
 * Actual factory-owned source/current-reader values, never source-pose
 * admission.
 */
interface IReading {
  /** Captured parent remains unchanged for this getter's lifetime. */
  readonly source: ISource;

  /** Actual completed lazy reader, absent before the first real FK demand. */
  reader: ReturnType<typeof preparePoseResolution> | undefined;

  /**
   * The private terminal owner of a completely factory-owned parent chain;
   * never a native-method verdict.
   */
  terminal?: IReading;
}

/**
 * Weak provenance admits only this owner's exact factory getter, without
 * inspecting foreign functions.
 */
const SOURCES: WeakMap<
  () => ReturnType<typeof preparePoseResolution>,
  IReading
> = new WeakMap();
/** The alternatives of `PrepareHumanPoseResolutionSource`'s site. */
type PrepareHumanPoseResolutionSource =
  | ReturnType<typeof preparePoseResolution>
  | (() => ReturnType<typeof preparePoseResolution>);

/**
 * Own a lazy exact-FK reader for one synchronous person evaluation, or borrow
 * its parent's reader/supplier. No reader or supplier is evaluated until the
 * first actual FK demand. Release the returned getter with that evaluation; it
 * must not enter a retained plan, body fit entry or public result closure.
 */
export function prepareHumanPoseResolution(
  source?: PrepareHumanPoseResolutionSource,
): () => ReturnType<typeof preparePoseResolution> {
  // A getter of this factory's own is already the lazy reader of its
  // source: a wrapper of it would return its reader on every call and share
  // its terminal, so it is handed back as it is, with no closure, state or
  // registry entry a call (every resolve and every limb fit asks one).
  if (typeof source === "function" && SOURCES.has(source)) return source;
  const state: IReading = {
    source,
    reader: typeof source === "function" ? undefined : source,
  };
  state.terminal =
    typeof source === "function" ? SOURCES.get(source)?.terminal : state;
  const read: () => ReturnType<typeof preparePoseResolution> = (): ReturnType<
    typeof preparePoseResolution
  > => {
    if (state.reader === undefined) state.reader = readSource(source);
    return state.reader;
  };
  SOURCES.set(read, state);
  return read;
}

/** Provenance of the actual lazy-parent chain, separate from pose admission. */
export namespace prepareHumanPoseResolution {
  /**
   * Obtain one reader at an actual immediate FK demand. Absent input creates a
   * fresh native reader, direct input returns unchanged, and a supplier is
   * called once without a receiver, at the same position as a lazy first read.
   * This is actual dispatch, not provenance inspection or source admission:
   * foreign suppliers still run and throw normally. Callers retain the reader
   * only for their synchronous operation. No wrapper closure, state record,
   * weak registration or source/result history is retained by this dispatch.
   */
  export function read(
    source?: ISource,
  ): ReturnType<typeof preparePoseResolution> {
    return readSource(source);
  }

  /**
   * Whether an absent/direct/lazy loan can supply only an unchanged native
   * reader. Undefined owns native creation; direct readers use the engine's
   * actual provenance/method check. Only genuine factory getters expose private
   * captured-source/current-reader metadata; unknown functions return false
   * without being called or inspected. A completely genuine parent chain's
   * private terminal link shares only structural origin: its actual current
   * reader still receives the engine's live method check on every call. Before
   * its first demand, only an undefined terminal source promises native
   * creation. Unknown suppliers retain the original full iterative lookup. No
   * supplier, FK or solve runs; provenance certifies no source/pose admission.
   */
  export function isNativeSource(source: ISource): boolean {
    const terminal: IReading | undefined =
      typeof source === "function" ? SOURCES.get(source)?.terminal : undefined;
    if (terminal !== undefined)
      return terminal.reader === undefined
        ? terminal.source === undefined
        : preparePoseResolution.isNative(terminal.reader);
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
    return (
      current === undefined ||
      current === checked ||
      preparePoseResolution.isNative(current)
    );
  }
}

/**
 * Preserve the actual bare supplier call and undefined-only native default in
 * one private owner.
 */
function readSource(source: ISource): ReturnType<typeof preparePoseResolution> {
  return typeof source === "function"
    ? source()
    : source === undefined
      ? preparePoseResolution()
      : source;
}
