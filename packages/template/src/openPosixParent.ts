import koffi, { type LibraryHandle } from "koffi";
import * as fs from "node:fs";

import { type IBoundChild } from "./IBoundChild";
import { type IBoundChildStatus } from "./IBoundChildStatus";
import { type IBoundParent } from "./IBoundParent";
import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type ICreateResult } from "./ICreateResult";
import type { IScaffoldPosixConstants } from "./IScaffoldPosixConstants";
import { ScaffoldParentChangedError } from "./ScaffoldParentChangedError";
import { nativeError } from "./nativeError";
import { resolveScaffoldPosixConstants } from "./resolveScaffoldPosixConstants";
import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";

/**
 * Open one POSIX directory with directory, no-follow and close-on-exec flags; create and reopen children relative to its held descriptor, which the publication coordinator closes.
 *
 * @evidence contracts/common.md#principled-implementation open with directory, no-follow and close-on-exec flags holds the parent; openat creates and verifies children relative to that descriptor.
 * @evidence contracts/common.md#clear-and-simple-design One adapter lowers the common parent and child contracts to POSIX descriptors while shared publication owns sequencing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing child slots and final symlinks refuse through exclusive no-follow opening; there is no absolute-child retry.
 * @evidence contracts/common.md#meaningful-documentation The comment states held-parent operations and coordinator-owned closing, and the shared interfaces document byte and failure semantics.
 * @evidence contracts/performance.md#efficient-algorithms Opening binds a fixed libc call set on first use and performs one parent open; each child operation issues its corresponding bounded syscall or stat.
 * @evidence contracts/performance.md#reuse-equivalent-work The libc binding record is reused for one process ABI; parent and child opens remain separate effects and are never shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned parent owns one descriptor until its coordinator closes it; child descriptors are transferred in create/reopen results, and the lazy libc binding lasts for the process.
 */
export const openPosixParent: (parentPath: string) => IBoundParent = (
  parentPath: string,
): IBoundParent => {
  const library: IPosixLibrary = loadPosixLibrary();
  const flags: IScaffoldPosixConstants = library.constants;
  const descriptor: number = library.open(
    parentPath,
    flags.O_RDONLY | flags.O_DIRECTORY | flags.O_NOFOLLOW | flags.O_CLOEXEC,
    0,
  );
  if (descriptor < 0) {
    const code: number = koffi.errno();
    const error: Error = nativeError("unable to open scaffold parent", code);
    if (
      code === koffi.os.errno.ENOENT ||
      code === koffi.os.errno.ENOTDIR ||
      code === koffi.os.errno.ELOOP
    )
      throw new ScaffoldParentChangedError(error.message);
    throw error;
  }
  return {
    close: (): void => fs.closeSync(descriptor),
    createExclusive: (childName: string): ICreateResult => {
      const child: number = library.openat(
        descriptor,
        childName,
        flags.O_RDWR |
          flags.O_CREAT |
          flags.O_EXCL |
          flags.O_NOFOLLOW |
          flags.O_CLOEXEC,
        0o600,
      );
      if (child >= 0) return { child: posixChild(child), status: "opened" };
      const code: number = koffi.errno();
      return {
        error: nativeError("unable to create scaffold child", code),
        reason:
          code === koffi.os.errno.EEXIST
            ? "target-competitor"
            : "create-failed",
        status: "refused",
      };
    },
    inspect: (): IBoundParentStatus => {
      const status: fs.BigIntStats = fs.fstatSync(descriptor, {
        bigint: true,
      });
      return {
        directory: status.isDirectory(),
        identity: scaffoldPhysicalIdentity(status),
      };
    },
    openResident: (childName: string): IBoundChild => {
      const child: number = library.openat(
        descriptor,
        childName,
        flags.O_RDONLY | flags.O_NOFOLLOW | flags.O_CLOEXEC,
        0,
      );
      if (child < 0)
        throw nativeError("unable to reopen scaffold child", koffi.errno());
      return posixChild(child);
    },
  };
};
const posixChild: (descriptor: number) => IBoundChild = (
  descriptor: number,
): IBoundChild => ({
  close: (): void => fs.closeSync(descriptor),
  read: (
    target: Buffer,
    offset: number,
    length: number,
    position: number,
  ): number => fs.readSync(descriptor, target, offset, length, position),
  status: (): IBoundChildStatus => {
    const status: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
    return {
      link: status.isSymbolicLink(),
      links: status.nlink,
      regular: status.isFile(),
      size: status.size,
      version: `${scaffoldPhysicalIdentity(status)}:${status.size}:${status.mtimeNs}`,
    };
  },
  sync: (): void => fs.fsyncSync(descriptor),
  write: (
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ): number => fs.writeSync(descriptor, source, offset, length, position),
});

/** The libc entry points and open flags the POSIX adapter needs. */
interface IPosixLibrary {
  constants: IScaffoldPosixConstants;
  open(pathname: string, flags: number, mode: number): number;
  openat(
    directory: number,
    pathname: string,
    flags: number,
    mode: number,
  ): number;
}

let posixLibrary: IPosixLibrary | undefined;

/** Bind `open` and `openat` from the running process once, on first use. */
const loadPosixLibrary: () => IPosixLibrary = (): IPosixLibrary =>
  (posixLibrary ??= createPosixLibrary());

const createPosixLibrary: () => IPosixLibrary = (): IPosixLibrary => {
  const constants: IScaffoldPosixConstants = resolveScaffoldPosixConstants(
    process.platform,
    fs.constants,
  );
  const library: LibraryHandle = koffi.load(null);
  return {
    constants,
    open: library.func(
      "int open(const char *pathname, int flags, uint32_t mode)",
    ) as IPosixLibrary["open"],
    openat: library.func(
      "int openat(int directory, const char *pathname, int flags, uint32_t mode)",
    ) as IPosixLibrary["openat"],
  };
};
