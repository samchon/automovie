import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { type IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";
import { assertOrdinarySingleLinkFile } from "./assertOrdinarySingleLinkFile";
import { writtenVersion } from "./writtenVersion";
import { assertScaffoldOwnership } from "./assertScaffoldOwnership";
import { captureScaffoldFile } from "./captureScaffoldFile";
import * as fs from "node:fs";
import { combineScaffoldFailures } from "./combineScaffoldFailures";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";


/**
 * Replace one existing ordinary single-link scaffold file in place.
 *
 * The link count is read from the descriptor this operation writes through
 * rather than from a pathname stat, so the decision and the write look at the
 * same file. Rewriting the inode is admissible only while exactly one entry
 * names it, because every other name would observe the write.
 *
 * @evidence contracts/common.md#principled-implementation One ordinary single-link file descriptor is verified against pathname generations before truncation, after write/readback and after close.
 * @evidence contracts/common.md#clear-and-simple-design The replacement owner groups positioned writing and resident verification while shared ownership and snapshot helpers define identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No retry or deletion hides a failed replacement; pre-truncation failures refuse and post-truncation failures retain partial bytes. A concurrent new hard link after the link-count check remains the documented limitation.
 * @evidence contracts/common.md#meaningful-documentation The comment states in-place semantics, descriptor-based link admission and effects on other names of the inode.
 * @evidence contracts/performance.md#efficient-algorithms One full write and readback are linear in bytes, with a fixed number of stat and resident-open operations.
 * @evidence contracts/performance.md#reuse-equivalent-work Replacement is an effect that repeats per request; snapshots are fresh observations and no previous successful write is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner attempts writer and temporary resident descriptor close on every exit, combining close failures with earlier failures; failed close leaves actual release unproven. Readback storage is bounded by file bytes and released with the call.
 */
export const overwriteScaffoldFile: (props: { base: IScaffoldPhysicalDirectory; bytes: Uint8Array; existing: IScaffoldFileSnapshot; parent: IScaffoldPhysicalDirectory; }) => ScaffoldFilePublicationOutcome = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  existing: IScaffoldFileSnapshot;
  parent: IScaffoldPhysicalDirectory;
}): ScaffoldFilePublicationOutcome => {
  const target: string = props.existing.path;
  let descriptor: number;
  try {
    descriptor = fs.openSync(target, "r+");
  } catch (error) {
    return Object.freeze({
      error,
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  }
  const progress: { bytesWritten: number } = { bytesWritten: 0 };
  let failure: unknown = undefined;
  let mutated: boolean = false;
  let completedSnapshot: IScaffoldFileSnapshot | undefined;
  try {
    const opened: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
    assertOrdinarySingleLinkFile(opened, target);
    assertScaffoldFileDescriptor(
      props.existing,
      descriptor,
      writtenVersion(opened),
    );
    assertScaffoldOwnership(props.base, props.parent);
    fs.ftruncateSync(descriptor, 0);
    mutated = true;
    writeScaffoldDescriptor(descriptor, target, props.bytes, progress);
    const completed: fs.BigIntStats = fs.fstatSync(descriptor, {
      bigint: true,
    });
    if (completed.size !== BigInt(props.bytes.byteLength))
      throw new Error(`scaffold file changed final size: ${target}`);
    assertScaffoldFileDescriptor(
      captureScaffoldFile(target),
      descriptor,
      writtenVersion(completed),
    );
    assertScaffoldDescriptorBytes(descriptor, target, props.bytes);
    const finalStatus: fs.BigIntStats = fs.fstatSync(descriptor, {
      bigint: true,
    });
    if (writtenVersion(finalStatus) !== writtenVersion(completed))
      throw new Error(`scaffold file changed after final readback: ${target}`);
    const resident: IScaffoldFileSnapshot = captureScaffoldFile(target);
    assertScaffoldFileDescriptor(
      resident,
      descriptor,
      writtenVersion(finalStatus),
    );
    completedSnapshot = assertOpenedScaffoldFileSnapshot(resident);
    assertScaffoldOwnership(props.base, props.parent);
  } catch (error) {
    failure = error;
  }
  try {
    fs.closeSync(descriptor);
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "overwritten scaffold file close",
    );
  }
  if (failure === undefined)
    try {
      assertScaffoldFileSnapshot(completedSnapshot!);
      assertScaffoldOwnership(props.base, props.parent);
    } catch (error) {
      failure = error;
    }
  if (failure !== undefined && mutated === false)
    return Object.freeze({
      error: failure,
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  return failure === undefined
    ? Object.freeze({
        parentIdentity: props.parent.identity,
        status: "completed" as const,
      })
    : Object.freeze({
        bytesWritten: progress.bytesWritten,
        error: failure,
        parentIdentity: props.parent.identity,
        status: "partial" as const,
      });
};


/**
 * Verify a held descriptor against its captured pathname generation: the
 * pathname still names the snapshot's file, the descriptor still shows
 * `expectedWritten`, and a fresh pathname open shows the same written state.
 */
const assertScaffoldFileDescriptor: (snapshot: IScaffoldFileSnapshot, descriptor: number, expectedWritten: string) => void = (
  snapshot: IScaffoldFileSnapshot,
  descriptor: number,
  expectedWritten: string,
): void => {
  assertOpenedScaffoldFileSnapshot(snapshot);
  const opened: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
  assertOrdinarySingleLinkFile(opened, snapshot.path);
  if (writtenVersion(opened) !== expectedWritten)
    throw new Error(
      `scaffold file descriptor changed generation: ${snapshot.path}`,
    );
  const residentDescriptor: number = fs.openSync(snapshot.path, "r");
  let failure: unknown = undefined;
  try {
    const resident: fs.BigIntStats = fs.fstatSync(residentDescriptor, {
      bigint: true,
    });
    assertOrdinarySingleLinkFile(resident, snapshot.path);
    if (writtenVersion(resident) !== writtenVersion(opened))
      throw new Error(
        `scaffold file descriptor changed resident generation: ${snapshot.path}`,
      );
    assertOpenedScaffoldFileSnapshot(snapshot);
  } catch (error) {
    failure = error;
  }
  try {
    fs.closeSync(residentDescriptor);
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "resident scaffold file close",
    );
  }
  if (failure !== undefined)
    throw failure instanceof Error
      ? failure
      : new Error(`scaffold file verification failed: ${snapshot.path}`, {
          cause: failure,
        });
};


/**
 * Recapture a snapshot's pathname while this operation holds descriptors on
 * it and require the same file and written state. The change time is left
 * out: Windows advances it whenever any handle opens the path, including this
 * module's own verification opens, while identity, size, and modification time
 * still move only on a real change.
 */
const assertOpenedScaffoldFileSnapshot: (snapshot: IScaffoldFileSnapshot) => IScaffoldFileSnapshot = (
  snapshot: IScaffoldFileSnapshot,
): IScaffoldFileSnapshot => {
  const current: IScaffoldFileSnapshot = captureScaffoldFile(snapshot.path);
  if (
    current.identity !== snapshot.identity ||
    current.written !== snapshot.written
  )
    throw new Error(
      `scaffold file changed while its descriptor was open: ${snapshot.path}`,
    );
  return current;
};


/**
 * Require the exact captured generation, change time included, after every
 * descriptor of this operation has closed.
 */
const assertScaffoldFileSnapshot: (snapshot: IScaffoldFileSnapshot) => void = (snapshot: IScaffoldFileSnapshot): void => {
  const current: IScaffoldFileSnapshot = captureScaffoldFile(snapshot.path);
  if (
    current.identity !== snapshot.identity ||
    current.version !== snapshot.version
  )
    throw new Error(
      `scaffold file changed after descriptor close: ${snapshot.path}`,
    );
};


/** Write `bytes` from offset 0 through `descriptor`, then flush it. */
const writeScaffoldDescriptor: (descriptor: number, target: string, bytes: Uint8Array, progress: { bytesWritten: number; }) => void = (
  descriptor: number,
  target: string,
  bytes: Uint8Array,
  progress: { bytesWritten: number },
): void => {
  let offset: number = 0;
  while (offset < bytes.byteLength) {
    const written: number = fs.writeSync(
      descriptor,
      bytes,
      offset,
      bytes.byteLength - offset,
      offset,
    );
    if (written === 0)
      throw new Error(`scaffold file stopped while written: ${target}`);
    offset += written;
    progress.bytesWritten = offset;
  }
  fs.fsyncSync(descriptor);
};


/** Read the whole file back through `descriptor` and require `bytes` exactly. */
const assertScaffoldDescriptorBytes: (descriptor: number, target: string, bytes: Uint8Array) => void = (
  descriptor: number,
  target: string,
  bytes: Uint8Array,
): void => {
  const readback: Buffer = Buffer.alloc(bytes.byteLength);
  let offset: number = 0;
  while (offset < readback.length) {
    const read: number = fs.readSync(
      descriptor,
      readback,
      offset,
      readback.length - offset,
      offset,
    );
    if (read === 0)
      throw new Error(`scaffold file stopped during readback: ${target}`);
    offset += read;
  }
  if (readback.equals(bytes) === false)
    throw new Error(`scaffold file changed during readback: ${target}`);
};
