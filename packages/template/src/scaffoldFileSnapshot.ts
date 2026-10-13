import * as fs from "node:fs";
import * as path from "node:path";

import { publishNativeScaffoldFile } from "./nativeScaffoldPublication";
import type { ScaffoldFilePublicationOutcome } from "./scaffoldPublication";

/**
 * Closed input passed to a platform adapter for one parent-bound new slot.
 *
 * The adapter must open the parent without following a link, prove
 * `expectedParentIdentity`, create `childName` relative to that held native
 * handle with exclusive/no-follow semantics, and own descriptor write, sync,
 * readback, one-link and held-parent-relative resident-identity verification,
 * final-status, and close reporting. It must never retry through `parentPath`,
 * reopen through a mutable absolute child pathname, or delete a reported
 * partial slot.
 *
 * @author Samchon
 */
export interface IScaffoldParentPublicationRequest {
  /** Exact bytes the held descriptor must write and read back. */
  bytes: readonly number[];
  /** Single child segment created relative to the held parent handle. */
  childName: string;
  /** Physical identity the opened parent handle must prove before creation. */
  expectedParentIdentity: string;
  /**
   * Path used only to acquire the parent handle whose identity is then proved.
   */
  parentPath: string;
}

/**
 * Platform boundary for a parent-handle-relative exclusive file publication.
 *
 * A supported adapter returns `refused` only when it knows no slot was
 * created. Once a descriptor is secured, every failure is `partial`, with the
 * exact bound parent identity and byte count; only verified write/readback,
 * one-link and held-parent-relative resident identity, final status, and close
 * may return `completed`.
 *
 * @author Samchon
 */
export interface IScaffoldParentPublicationCapability {
  /**
   * Execute one native parent-bound publication and return its truthful effect.
   */
  publish(
    request: IScaffoldParentPublicationRequest,
  ): ScaffoldFilePublicationOutcome;
}

/** Captured physical identity of one ordinary scaffold directory generation. */
export interface IScaffoldPhysicalDirectory {
  /** Device-and-inode identity of the captured directory. */
  identity: string;
  /** Absolute lexical path selected for the directory. */
  path: string;
  /** Native real path used to reject linked escapes. */
  real: string;
}

/** Captured pathname generation that authorizes a later read or replacement. */
export interface IScaffoldFileSnapshot {
  /** Physical file identity reported by pathname metadata. */
  identity: string;
  /** Absolute pathname whose resident was captured. */
  path: string;
  /** Size and timestamp generation together with the physical identity. */
  version: string;
}

interface IScaffoldDescriptorFailure {
  error: unknown;
}

class ScaffoldDescriptorCleanupError extends AggregateError {}

/**
 * Publish one new scaffold file through an explicit parent-bound capability.
 *
 * This pure boundary closes and freezes the exact parent identity, child
 * segment, and bytes before entering the platform adapter. It accepts a
 * completed or partial result only when the adapter names that same parent
 * generation, and accepts a refusal only with one of the three pre-create
 * reasons. It performs no pathname retry and authorizes no cleanup.
 *
 * @author Samchon
 */
export const publishScaffoldFileToCapturedParent = (props: {
  bytes: readonly number[];
  capability: IScaffoldParentPublicationCapability;
  parent: IScaffoldPhysicalDirectory;
  target: string;
}): ScaffoldFilePublicationOutcome => {
  const target = path.resolve(props.target);
  if (path.dirname(target) !== props.parent.path)
    throw new Error(`scaffold file changed declared parent: ${target}`);
  if (props.parent.identity.length === 0)
    throw new Error(`scaffold parent omitted physical identity: ${target}`);
  if (
    props.bytes.some(
      (byte) => Number.isSafeInteger(byte) === false || byte < 0 || byte > 0xff,
    )
  )
    throw new Error(`scaffold file contains invalid byte values: ${target}`);

  const request = Object.freeze({
    bytes: Object.freeze([...props.bytes]),
    childName: path.basename(target),
    expectedParentIdentity: props.parent.identity,
    parentPath: props.parent.path,
  });
  const outcome = props.capability.publish(request);
  if (outcome.status === "refused") {
    if (
      outcome.reason !== "create-failed" &&
      outcome.reason !== "parent-changed" &&
      outcome.reason !== "target-competitor"
    )
      throw new Error(
        `scaffold parent capability returned an invalid refusal: ${target}`,
      );
    return Object.freeze({ ...outcome });
  }
  if (outcome.status === "completed") {
    if (outcome.parentIdentity !== props.parent.identity)
      throw new Error(
        `completed scaffold publication changed parent identity: ${target}`,
      );
    return Object.freeze({ ...outcome });
  }
  if (outcome.status === "partial") {
    if (
      outcome.parentIdentity !== props.parent.identity ||
      Number.isSafeInteger(outcome.bytesWritten) === false ||
      outcome.bytesWritten < 0 ||
      outcome.bytesWritten > request.bytes.length
    )
      throw new Error(
        `partial scaffold publication has invalid bound state: ${target}`,
      );
    return Object.freeze({ ...outcome });
  }
  throw new Error(
    `scaffold parent capability returned an unknown outcome: ${target}`,
  );
};

/**
 * Create or capture one ordinary scaffold base without following a linked
 * parent.
 */
export const ensureScaffoldBaseDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const absolute = path.resolve(directory);
  const missing: string[] = [];
  let cursor = absolute;
  let ownership: IScaffoldPhysicalDirectory;
  while (true) {
    try {
      ownership = captureScaffoldPhysicalDirectory(cursor);
      break;
    } catch (error) {
      if (missingPath(error) === false) throw error;
      missing.unshift(cursor);
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      cursor = parent;
    }
  }
  for (const target of missing) {
    assertScaffoldPhysicalDirectory(ownership);
    fs.mkdirSync(target);
    assertScaffoldPhysicalDirectory(ownership);
    ownership = captureEmptyScaffoldPhysicalDirectory(target);
  }
  return ownership;
};

/**
 * Capture one ordinary physical directory without accepting symlinks or
 * junctions.
 */
export const captureScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const absolute = path.resolve(directory);
  const status = fs.lstatSync(absolute, { bigint: true });
  if (status.isSymbolicLink() || status.isDirectory() === false)
    throw new Error(
      `scaffold directory is not one ordinary directory: ${absolute}`,
    );
  return {
    identity: physicalDirectoryIdentity(absolute, status),
    path: absolute,
    real: path.resolve(fs.realpathSync.native(absolute)),
  };
};

/**
 * Derive a directory's physical identity from an opened descriptor.
 *
 * A path-based stat is not a reliable device source everywhere: Node 22 on
 * Windows reports device 0 for a directory reached by path while `fstat` on
 * the opened directory reports the volume serial, which is also what the
 * native parent handle reports at publication. Deriving the identity from the
 * descriptor keeps the captured identity and the held-handle identity on one
 * basis, and the inode equality check pins the descriptor to the very
 * directory the caller just inspected.
 */
const physicalDirectoryIdentity = (
  absolute: string,
  status: fs.BigIntStats,
): string => {
  const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY);
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    if (opened.isDirectory() === false || opened.ino !== status.ino)
      throw new Error(
        `scaffold directory changed while its identity was captured: ${absolute}`,
      );
    return physicalIdentity(opened);
  } finally {
    fs.closeSync(descriptor);
  }
};

/** Revalidate one captured scaffold directory generation. */
export const assertScaffoldPhysicalDirectory = (
  ownership: IScaffoldPhysicalDirectory,
): void => {
  const current = captureScaffoldPhysicalDirectory(ownership.path);
  if (
    current.identity !== ownership.identity ||
    current.real !== ownership.real
  )
    throw new Error(`scaffold directory changed generation: ${ownership.path}`);
};

const captureEmptyScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const ownership = captureScaffoldPhysicalDirectory(directory);
  const before = fs.lstatSync(ownership.path, { bigint: true });
  if (physicalDirectoryIdentity(ownership.path, before) !== ownership.identity)
    throw new Error(`scaffold directory changed generation: ${ownership.path}`);
  const entries = fs.readdirSync(ownership.path);
  const after = fs.lstatSync(ownership.path, { bigint: true });
  if (
    physicalDirectoryIdentity(ownership.path, after) !== ownership.identity ||
    physicalVersion(after) !== physicalVersion(before)
  )
    throw new Error(
      `scaffold directory changed while inspected: ${ownership.path}`,
    );
  assertScaffoldPhysicalDirectory(ownership);
  if (entries.length !== 0)
    throw new Error(
      `new scaffold directory is unexpectedly non-empty: ${ownership.path}`,
    );
  return ownership;
};

/**
 * Resolve and retain every physical descendant directory needed by one file.
 */
export const ensureScaffoldFileDirectory = (props: {
  base: IScaffoldPhysicalDirectory;
  cache: Map<string, IScaffoldPhysicalDirectory>;
  directory: string;
}): IScaffoldPhysicalDirectory => {
  const absolute = path.resolve(props.directory);
  const relative = path.relative(props.base.path, absolute);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(`scaffold directory escapes its base: ${absolute}`);
  let current = props.base;
  if (relative.length === 0) return current;
  for (const segment of relative.split(path.sep)) {
    const target = path.join(current.path, segment);
    assertScaffoldPhysicalDirectory(props.base);
    assertScaffoldPhysicalDirectory(current);
    let child = props.cache.get(target);
    if (child === undefined) {
      try {
        child = captureScaffoldPhysicalDirectory(target);
      } catch (error) {
        if (missingPath(error) === false) throw error;
        assertScaffoldPhysicalDirectory(props.base);
        assertScaffoldPhysicalDirectory(current);
        fs.mkdirSync(target);
        assertScaffoldPhysicalDirectory(props.base);
        assertScaffoldPhysicalDirectory(current);
        child = captureEmptyScaffoldPhysicalDirectory(target);
      }
      if (inside(props.base.real, child.real) === false)
        throw new Error(
          `scaffold directory escapes its physical base: ${target}`,
        );
      props.cache.set(target, child);
    } else assertScaffoldPhysicalDirectory(child);
    current = child;
  }
  return current;
};

/**
 * Create or explicitly overwrite one exact final file through its bound
 * descriptor.
 */
export const writeScaffoldFile = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  expected?: IScaffoldFileSnapshot | null;
  capability?: IScaffoldParentPublicationCapability;
  force: boolean;
  parent: IScaffoldPhysicalDirectory;
  target: string;
}): ScaffoldFilePublicationOutcome => {
  const absolute = path.resolve(props.target);
  if (path.dirname(absolute) !== props.parent.path)
    throw new Error(`scaffold file changed declared parent: ${absolute}`);
  assertScaffoldOwnership(props.base, props.parent);
  if (props.expected !== undefined && props.expected !== null) {
    if (!props.force || props.expected.path !== absolute)
      throw new Error(
        `scaffold replacement lacks exact captured authority: ${absolute}`,
      );
    assertScaffoldFileSnapshot(props.expected);
    return overwriteScaffoldFile({ ...props, existing: props.expected });
  }
  if (props.force && props.expected === undefined) {
    let existing: IScaffoldFileSnapshot | null;
    try {
      existing = captureScaffoldFile(absolute);
    } catch (error) {
      if (missingPath(error) === false) throw error;
      existing = null;
    }
    if (existing !== null) {
      return overwriteScaffoldFile({ ...props, existing });
    }
  }
  return publishScaffoldFileToCapturedParent({
    bytes: Array.from(props.bytes),
    capability: props.capability ?? { publish: publishNativeScaffoldFile },
    parent: props.parent,
    target: absolute,
  });
};

/**
 * Replace one existing ordinary single-link scaffold file in place.
 *
 * The entry count is read from the descriptor this operation writes through
 * rather than from a pathname stat, so the decision and the write cannot be
 * looking at different files. Rewriting the resident inode is admissible only
 * while exactly one entry names it, because that write is precisely what every
 * other pathname naming it would observe. Another entry causes refusal.
 *
 * A window remains between this stat and the truncation on the in-place branch:
 * a link created inside it is not seen, and the rewrite would then reach the new
 * peer. That window exists today, and this branch neither widens nor narrows it.
 */
const overwriteScaffoldFile = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  capability?: IScaffoldParentPublicationCapability;
  existing: IScaffoldFileSnapshot;
  parent: IScaffoldPhysicalDirectory;
  target: string;
}): ScaffoldFilePublicationOutcome => {
  let descriptor: number;
  try {
    descriptor = fs.openSync(props.target, "r+");
  } catch (error) {
    return Object.freeze({
      error,
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  }
  const progress = { bytesWritten: 0 };
  let failure: unknown = undefined;
  let mutated = false;
  let completedIdentity: string | undefined;
  let completedSnapshot: IScaffoldFileSnapshot | null = null;
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    assertOrdinarySingleLinkFile(opened, props.target);
    assertScaffoldFileDescriptor(
      props.existing,
      descriptor,
      physicalVersion(opened),
      assertOrdinarySingleLinkFile,
    );
    assertScaffoldOwnership(props.base, props.parent);
    fs.ftruncateSync(descriptor, 0);
    mutated = true;
    writeScaffoldDescriptor(descriptor, props.target, props.bytes, progress);
    const completed = fs.fstatSync(descriptor, { bigint: true });
    completedIdentity = physicalIdentity(completed);
    if (completed.size !== BigInt(props.bytes.byteLength))
      throw new Error(`scaffold file changed final size: ${props.target}`);
    assertScaffoldFileDescriptor(
      captureScaffoldFile(props.target),
      descriptor,
      physicalVersion(completed),
      assertOrdinarySingleLinkFile,
    );
    assertScaffoldDescriptorBytes(descriptor, props.target, props.bytes);
    const finalStatus = fs.fstatSync(descriptor, { bigint: true });
    if (writtenVersion(finalStatus) !== writtenVersion(completed))
      throw new Error(
        `scaffold file changed after final readback: ${props.target}`,
      );
    completedSnapshot = captureScaffoldFile(props.target);
    assertScaffoldFileDescriptor(
      completedSnapshot,
      descriptor,
      physicalVersion(finalStatus),
      assertOrdinarySingleLinkFile,
    );
    completedSnapshot = assertOpenedScaffoldFileSnapshot(completedSnapshot);
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
      "overwritten scaffold file",
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
        fileIdentity: completedIdentity!,
        parentIdentity: props.parent.identity,
        status: "completed",
      })
    : Object.freeze({
        bytesWritten: progress.bytesWritten,
        error: failure,
        parentIdentity: props.parent.identity,
        status: "partial",
      });
};

/**
 * Capture one ordinary file before its bytes authorize an operation.
 *
 * Capturing observes a pathname and changes nothing, so it admits a file that
 * more than one directory entry names. The documented script runner mirrors
 * every root-direct file of a generated project into its own cache for the
 * duration of a command, which made a link count here refuse ordinary inputs
 * such as the project's reference-client configuration. A symbolic link stays
 * refused, and the writer that truncates in place keeps its stricter admission.
 */
export const captureScaffoldFile = (file: string): IScaffoldFileSnapshot =>
  captureAdmittedScaffoldFile(file, assertOrdinaryScaffoldFile);

/**
 * Capture one ordinary file that exactly one directory entry names.
 *
 * A caller whose own contract refuses an aliased work target uses this instead
 * of {@link captureScaffoldFile}. The repository's experiment launcher is that
 * caller: it promises not to adopt a linked manifest as a work target, and its
 * only enforcement of that promise is the admission it captures through. The
 * relaxed capture exists for a generated project, whose root-direct inputs the
 * documented script runner mirrors while a command runs, and that reason does
 * not transfer to a launcher choosing what to operate on.
 */
export const captureSingleLinkScaffoldFile = (
  file: string,
): IScaffoldFileSnapshot =>
  captureAdmittedScaffoldFile(file, assertOrdinarySingleLinkFile);

const captureAdmittedScaffoldFile = (
  file: string,
  admission: (status: fs.BigIntStats, file: string) => void,
): IScaffoldFileSnapshot => {
  const absolute = path.resolve(file);
  const status = fs.lstatSync(absolute, { bigint: true });
  admission(status, absolute);
  return {
    identity: physicalIdentity(status),
    path: absolute,
    version: physicalVersion(status),
  };
};

/**
 * Verify a held descriptor against its captured pathname generation.
 *
 * The caller supplies the admission because the two callers own different
 * promises: the in-place writer requires the single entry its truncation
 * depends on, while a read requires only an ordinary file.
 */
const assertScaffoldFileDescriptor = (
  snapshot: IScaffoldFileSnapshot,
  descriptor: number,
  expectedDescriptorVersion: string,
  admission: (status: fs.BigIntStats, file: string) => void,
): void => {
  assertOpenedScaffoldFileSnapshot(snapshot);
  const opened = fs.fstatSync(descriptor, { bigint: true });
  admission(opened, snapshot.path);
  if (
    withoutChangeTime(physicalVersion(opened)) !==
    withoutChangeTime(expectedDescriptorVersion)
  )
    throw new Error(
      `scaffold file descriptor changed generation: ${snapshot.path}`,
    );
  const residentDescriptor = fs.openSync(snapshot.path, "r");
  let failure: IScaffoldDescriptorFailure | undefined;
  try {
    const resident = fs.fstatSync(residentDescriptor, { bigint: true });
    admission(resident, snapshot.path);
    if (writtenVersion(resident) !== writtenVersion(opened))
      throw new Error(
        `scaffold file descriptor changed resident generation: ${snapshot.path}`,
      );
    assertOpenedScaffoldFileSnapshot(snapshot);
  } catch (error) {
    failure = { error };
    throw error;
  } finally {
    closeScaffoldDescriptor(
      residentDescriptor,
      failure,
      "resident scaffold file",
    );
  }
};

// Only while this operation holds/reopens a descriptor: our own Windows opens
// can move ctime. Physical identity, size and mtime still cannot change. The
// public snapshot assertion keeps ctime for later, separately admitted work.
const withoutChangeTime = (version: string): string =>
  version.split(":").slice(0, -1).join(":");
const assertOpenedScaffoldFileSnapshot = (
  snapshot: IScaffoldFileSnapshot,
): IScaffoldFileSnapshot => {
  const current = captureScaffoldFile(snapshot.path);
  if (
    current.identity !== snapshot.identity ||
    withoutChangeTime(current.version) !== withoutChangeTime(snapshot.version)
  )
    throw new Error(
      `scaffold file changed while its descriptor was open: ${snapshot.path}`,
    );
  return current;
};

/** Refuse a pathname whose physical file or content generation has changed. */
export const assertScaffoldFileSnapshot = (
  snapshot: IScaffoldFileSnapshot,
): void => {
  const current = captureScaffoldFile(snapshot.path);
  if (
    current.identity !== snapshot.identity ||
    current.version !== snapshot.version
  )
    throw new Error(
      `scaffold file changed after descriptor close: ${snapshot.path}`,
    );
};

/**
 * Read the descriptor that proves a captured pathname generation. Descriptor
 * identity is separate because Windows path and handle device ids can differ.
 */
export const readScaffoldFileSnapshot = (
  file: string,
): {
  snapshot: IScaffoldFileSnapshot;
  bytes: Buffer;
  identity: string;
  version: string;
} => readAdmittedScaffoldFileSnapshot(file, assertOrdinaryScaffoldFile);

/**
 * Read one ordinary file that exactly one directory entry names.
 *
 * The caller that refuses an aliased work target reads through this instead of
 * {@link readScaffoldFileSnapshot}, so its manifest is refused at admission
 * rather than adopted. Admission is where that promise lives: a second entry
 * appearing after this read leaves the inode identity unchanged, so the
 * generation checks that follow are not the place to look for it.
 */
export const readSingleLinkScaffoldFileSnapshot = (
  file: string,
): {
  snapshot: IScaffoldFileSnapshot;
  bytes: Buffer;
  identity: string;
  version: string;
} => readAdmittedScaffoldFileSnapshot(file, assertOrdinarySingleLinkFile);

const readAdmittedScaffoldFileSnapshot = (
  file: string,
  admission: (status: fs.BigIntStats, file: string) => void,
): {
  snapshot: IScaffoldFileSnapshot;
  bytes: Buffer;
  identity: string;
  version: string;
} => {
  const snapshot = captureAdmittedScaffoldFile(file, admission);
  const descriptor = fs.openSync(snapshot.path, "r");
  let failure: IScaffoldDescriptorFailure | undefined;
  let result: {
    snapshot: IScaffoldFileSnapshot;
    bytes: Buffer;
    identity: string;
    version: string;
  };
  try {
    const opened = fs.fstatSync(descriptor, { bigint: true });
    const version = physicalVersion(opened);
    assertScaffoldFileDescriptor(snapshot, descriptor, version, admission);
    const bytes = fs.readFileSync(descriptor);
    assertScaffoldFileDescriptor(snapshot, descriptor, version, admission);
    result = { snapshot, bytes, identity: physicalIdentity(opened), version };
  } catch (error) {
    failure = { error };
    throw error;
  } finally {
    closeScaffoldDescriptor(descriptor, failure, "read scaffold file");
  }
  // Capture after our final close, not before our own resident reopen.
  const completed = assertOpenedScaffoldFileSnapshot(snapshot);
  assertScaffoldFileSnapshot(completed);
  return { ...result, snapshot: completed };
};

/**
 * Admission for an operation that only observes: a regular file that is not a
 * symbolic link. It asks nothing about directory entries, because reading bytes
 * cannot change what a second entry naming the same inode shows.
 */
const assertOrdinaryScaffoldFile = (
  status: fs.BigIntStats,
  file: string,
): void => {
  if (status.isSymbolicLink() || status.isFile() === false)
    throw new Error(`scaffold file is not one ordinary file: ${file}`);
};

/**
 * Admission for the writer that truncates and rewrites the resident inode.
 *
 * Exactly one directory entry is load-bearing here and nowhere else: this write
 * changes the bytes of the inode itself, so every other pathname naming it would
 * observe the change. Anything that replaces the directory entry instead keeps
 * the peer pointed at the old inode and uses the ordinary admission above.
 */
const assertOrdinarySingleLinkFile = (
  status: fs.BigIntStats,
  file: string,
): void => {
  assertOrdinaryScaffoldFile(status, file);
  if (status.nlink !== 1n)
    throw new Error(
      `scaffold file is not one ordinary single-link file: ${file}`,
    );
};

const assertScaffoldOwnership = (
  base: IScaffoldPhysicalDirectory,
  parent: IScaffoldPhysicalDirectory,
): void => {
  assertScaffoldPhysicalDirectory(base);
  assertScaffoldPhysicalDirectory(parent);
  if (inside(base.real, parent.real) === false)
    throw new Error(
      `scaffold file parent escapes its physical base: ${parent.path}`,
    );
};

const writeScaffoldDescriptor = (
  descriptor: number,
  target: string,
  bytes: Uint8Array,
  progress?: { bytesWritten: number },
): void => {
  const source = Buffer.from(bytes);
  let offset = 0;
  while (offset < source.length) {
    const written = fs.writeSync(
      descriptor,
      source,
      offset,
      source.length - offset,
      offset,
    );
    if (written === 0)
      throw new Error(`scaffold file stopped while written: ${target}`);
    offset += written;
    if (progress !== undefined) progress.bytesWritten = offset;
  }
  fs.fsyncSync(descriptor);
  assertScaffoldDescriptorBytes(descriptor, target, source);
};

const combineScaffoldFailures = (
  first: unknown,
  second: unknown,
  resource: string,
): unknown =>
  first === undefined
    ? second
    : new AggregateError(
        [first, second],
        `${resource} close failed after publication failure`,
      );

const assertScaffoldDescriptorBytes = (
  descriptor: number,
  target: string,
  bytes: Uint8Array,
): void => {
  const source = Buffer.from(bytes);
  const readback = Buffer.alloc(source.length);
  let offset = 0;
  while (offset < readback.length) {
    const read = fs.readSync(
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
  if (readback.equals(source) === false)
    throw new Error(`scaffold file changed during readback: ${target}`);
};

const closeScaffoldDescriptor = (
  descriptor: number,
  failure: IScaffoldDescriptorFailure | undefined,
  resource: string,
): void => {
  try {
    fs.closeSync(descriptor);
  } catch (closeFailure) {
    if (failure === undefined) throw closeFailure;
    throw new ScaffoldDescriptorCleanupError(
      [
        ...(failure.error instanceof ScaffoldDescriptorCleanupError
          ? failure.error.errors
          : [failure.error]),
        closeFailure,
      ],
      `Scaffold descriptor cleanup failed after the operation failed: ${resource}.`,
    );
  }
};

const physicalIdentity = (status: fs.BigIntStats): string =>
  `${status.dev}:${status.ino}`;

const physicalVersion = (status: fs.BigIntStats): string =>
  `${physicalIdentity(status)}:${status.size}:${status.mtimeNs}:${status.ctimeNs}`;

/**
 * The part of a file's identity a writer owns, for comparing two stats of one
 * held descriptor across this module's own verification reads.
 *
 * `ctimeNs` is absent across this operation's own held-descriptor observations. Windows advances a
 * file's change time when _any_ handle opens the path, including the read-only
 * handle `captureScaffoldFile` takes to verify the write, so the check's own
 * probe moved the value the check then compared: measured 20 of 20 with the
 * probe and 0 of 20 without it, `size` and `mtimeNs` steady throughout. That
 * made every scaffold write on such a machine report tampering, which is a
 * false refusal a virus scanner or an indexer can trigger at will.
 *
 * Nothing is given up. A substituted file no longer shares the descriptor's
 * physical identity, a rewrite changes the size or the modification time, and
 * `assertScaffoldDescriptorBytes` has already read the bytes back through the
 * descriptor that never let go. Every other comparison keeps
 * {@link physicalVersion}, including the directory-ownership checks where a
 * rename's `ctime` move is the signal.
 */
const writtenVersion = (status: fs.BigIntStats): string =>
  `${physicalIdentity(status)}:${status.size}:${status.mtimeNs}`;

const inside = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return (
    relative.length === 0 ||
    (relative !== ".." &&
      relative.startsWith(`..${path.sep}`) === false &&
      path.isAbsolute(relative) === false)
  );
};

const missingPath = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "ENOENT" ||
  (error as NodeJS.ErrnoException).code === "ENOTDIR";
