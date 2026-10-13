import koffi, { type LibraryHandle, type TypeObject } from "koffi";
import * as fs from "node:fs";
import * as path from "node:path";

import type { IScaffoldParentPublicationRequest } from "./IScaffoldParentPublicationRequest";
import { combineScaffoldFailures } from "./combineScaffoldFailures";
import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";
import type { ScaffoldFilePublicationOutcome } from "./scaffoldPublication";

/** A parent directory handle held for one publication. */
interface IBoundParent {
  close(): void;
  createExclusive(childName: string): ICreateResult;
  inspect(): IBoundParentStatus;
  openResident(childName: string): IBoundChild;
}

/** Whether the held parent is a directory, and its physical identity. */
interface IBoundParentStatus {
  directory: boolean;
  identity: string;
}

/**
 * One child opened relative to a held parent, driven through whatever the
 * platform hands back: a POSIX descriptor served by `node:fs`, or a Windows
 * HANDLE served by kernel32. Node's own C runtime does not share descriptor
 * tables with `ucrtbase.dll`, so a Windows handle is never lowered to a CRT
 * descriptor; every byte, flush, inspection, and close goes through the
 * handle itself.
 */
interface IBoundChild {
  close(): void;
  read(
    target: Buffer,
    offset: number,
    length: number,
    position: number,
  ): number;
  status(): IBoundChildStatus;
  sync(): void;
  write(
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ): number;
}

/** What the held child handle reports about the file it names. */
interface IBoundChildStatus {
  identity: string;
  link: boolean;
  links: bigint;
  regular: boolean;
  size: bigint;
  version: string;
}

/** Result of an exclusive create relative to the held parent. */
type ICreateResult =
  | { child: IBoundChild; status: "opened" }
  | { error: unknown; status: "partial" }
  | {
      error: unknown;
      reason: "create-failed" | "target-competitor";
      status: "refused";
    };

/** Result of one `NtCreateFile` call: a handle on success, else the NTSTATUS. */
interface IWindowsOpenedChild {
  handle?: unknown;
  status: number;
}

/** The held parent no longer names the captured directory. */
class ScaffoldParentChangedError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ScaffoldParentChangedError";
  }
}

/** The create reserved the child slot but returned no usable handle. */
class ScaffoldCreatedSlotError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ScaffoldCreatedSlotError";
  }
}

/**
 * Create one new scaffold file relative to a held parent directory handle and
 * report the effect.
 *
 * POSIX opens the parent with `open(O_DIRECTORY | O_NOFOLLOW)` and creates the
 * child with `openat(O_CREAT | O_EXCL | O_NOFOLLOW)`. Windows opens the parent
 * with `CreateFileW` without following a reparse point and creates the child
 * with `NtCreateFile(FILE_CREATE)` using `OBJECT_ATTRIBUTES.RootDirectory`.
 * The parent must report `expectedParentIdentity` before the create. The new
 * file is written, flushed, read back, and checked to be one ordinary
 * single-link file of the exact size, then reopened relative to the same held
 * parent, before and after its own handle closes, to prove the name still
 * holds that file.
 *
 * The function returns rather than throws. `refused` means no slot was
 * created: the request was malformed, the parent could not be opened or
 * changed, or the create failed or met an existing entry
 * (`target-competitor`). `partial` means a slot exists that did not pass
 * every check, with the bytes written so far; the adapter never deletes it and
 * never retries through an absolute child path. `completed` carries the new
 * file's identity.
 *
 * @param request Parent path, its expected identity, the child segment, and
 *   the bytes.
 * @returns The frozen outcome.
 *
 * @evidence contracts/common.md#principled-implementation The method is the documented handle-relative create of each platform, `openat` with `O_EXCL | O_NOFOLLOW` and `NtCreateFile` with a root directory handle and `FILE_CREATE`, both of which fail rather than follow an existing entry or a link; its premises are that the parent handle is held for the whole call and that `O_CLOEXEC` is known, which Node omits from `fs.constants` and this module supplies for Linux and Android, so another POSIX system such as macOS is refused with `create-failed` as an unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design The function owns the publication sequence, and the platforms differ only behind the private `IBoundParent` and `IBoundChild` shapes, so the order of checks is written once; the Koffi bindings load lazily per platform on first use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every failure after the create becomes `partial` with the byte count instead of a cleanup or a pathname retry, and no foreign method or global is replaced; Win32 and NT values are named constants from the Windows SDK headers.
 * @evidence contracts/common.md#meaningful-documentation The comment states both platform methods, the identity precondition, each verification step, and the meaning of each outcome, including that a partial slot is left in place.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in the file size: one write pass, one flush, one readback pass into a buffer of the same size, and a constant number of handle opens and status reads; the request bytes are viewed, not copied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call is an exclusive create whose effect must not be shared; only the loaded Koffi library bindings are kept, and they are stateless function handles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function owns at most three native handles, the parent, the created child, and one resident reopen; each is closed on success and on every failure path before return, and a close failure is combined with the earlier failure; the readback buffer is released with the call, and the module keeps only one lazily loaded binding set per platform.
 */
export const publishNativeScaffoldFile = (
  request: IScaffoldParentPublicationRequest,
): ScaffoldFilePublicationOutcome => {
  if (
    request.childName.length === 0 ||
    request.childName === "." ||
    request.childName === ".." ||
    request.childName.includes("\0") ||
    request.childName.includes("/") ||
    request.childName.includes("\\") ||
    request.expectedParentIdentity.length === 0
  )
    return Object.freeze({
      error: new Error("invalid native scaffold publication request"),
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  let parent: IBoundParent;
  try {
    parent = openBoundParent(request);
  } catch (error) {
    return Object.freeze({
      error,
      reason:
        error instanceof ScaffoldParentChangedError
          ? ("parent-changed" as const)
          : ("create-failed" as const),
      status: "refused" as const,
    });
  }

  let creation: ICreateResult;
  try {
    creation = parent.createExclusive(request.childName);
  } catch (error) {
    return Object.freeze({
      error: closeAfterFailure(parent, error),
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  }
  if (creation.status === "refused")
    return Object.freeze({
      ...creation,
      error: closeAfterFailure(parent, creation.error),
    });
  if (creation.status === "partial")
    return Object.freeze({
      bytesWritten: 0,
      error: closeAfterFailure(parent, creation.error),
      parentIdentity: request.expectedParentIdentity,
      status: "partial" as const,
    });

  const source: Buffer = Buffer.from(
    request.bytes.buffer,
    request.bytes.byteOffset,
    request.bytes.byteLength,
  );
  const child: IBoundChild = creation.child;
  let bytesWritten: number = 0;
  let failure: unknown = undefined;
  let completedVersion: string | undefined;
  let completedIdentity: string | undefined;
  try {
    assertOrdinarySingleLink(child.status(), request.childName);
    while (bytesWritten < source.length) {
      const written: number = child.write(
        source,
        bytesWritten,
        source.length - bytesWritten,
        bytesWritten,
      );
      if (written === 0)
        throw new Error(
          `scaffold file stopped while written: ${request.childName}`,
        );
      bytesWritten += written;
    }
    child.sync();
    const completed: IBoundChildStatus = child.status();
    assertOrdinarySingleLink(completed, request.childName);
    if (completed.size !== BigInt(source.length))
      throw new Error(`scaffold file changed final size: ${request.childName}`);
    assertChildBytes(child, request.childName, source);
    completedVersion = completed.version;
    completedIdentity = completed.identity;
    assertBoundResident(parent, request.childName, completedVersion);
  } catch (error) {
    failure = error;
  }

  try {
    child.close();
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "created scaffold descriptor close",
    );
  }
  if (failure === undefined)
    try {
      assertBoundResident(parent, request.childName, completedVersion!);
    } catch (residentError) {
      failure = residentError;
    }
  try {
    parent.close();
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "scaffold parent close",
    );
  }

  return failure === undefined
    ? Object.freeze({
        fileIdentity: completedIdentity!,
        parentIdentity: request.expectedParentIdentity,
        status: "completed" as const,
      })
    : Object.freeze({
        bytesWritten,
        error: failure,
        parentIdentity: request.expectedParentIdentity,
        status: "partial" as const,
      });
};

/** Close the parent after `failure`, keeping both errors if the close fails. */
const closeAfterFailure = (parent: IBoundParent, failure: unknown): unknown => {
  try {
    parent.close();
    return failure;
  } catch (closeError) {
    return combineScaffoldFailures(failure, closeError, "scaffold parent close");
  }
};

const openBoundParent = (
  request: IScaffoldParentPublicationRequest,
): IBoundParent => {
  const parent: IBoundParent =
    process.platform === "win32"
      ? openWindowsParent(request.parentPath)
      : openPosixParent(request.parentPath);
  try {
    const status: IBoundParentStatus = parent.inspect();
    if (
      status.directory === false ||
      status.identity !== request.expectedParentIdentity
    )
      throw new ScaffoldParentChangedError(
        `scaffold parent changed before native create: ${request.parentPath}`,
      );
    return parent;
  } catch (error) {
    try {
      parent.close();
    } catch (closeError) {
      if (error instanceof ScaffoldParentChangedError)
        throw new ScaffoldParentChangedError(error.message, {
          cause: combineScaffoldFailures(
            error,
            closeError,
            "changed scaffold parent close",
          ),
        });
      throw combineScaffoldFailures(error, closeError, "scaffold parent close");
    }
    throw error;
  }
};

const openPosixParent = (parentPath: string): IBoundParent => {
  const library: IPosixLibrary = loadPosixLibrary();
  const flags: IPosixConstants = library.constants;
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
          code === koffi.os.errno.EEXIST ? "target-competitor" : "create-failed",
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

const posixChild = (descriptor: number): IBoundChild => ({
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
      identity: scaffoldPhysicalIdentity(status),
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
  constants: IPosixConstants;
  open(pathname: string, flags: number, mode: number): number;
  openat(
    directory: number,
    pathname: string,
    flags: number,
    mode: number,
  ): number;
}

/** Open flags for the running POSIX system. */
interface IPosixConstants {
  O_CLOEXEC: number;
  O_CREAT: number;
  O_DIRECTORY: number;
  O_EXCL: number;
  O_NOFOLLOW: number;
  O_RDONLY: number;
  O_RDWR: number;
}

let posixLibrary: IPosixLibrary | undefined;

/** Bind `open` and `openat` from the running process once, on first use. */
const loadPosixLibrary = (): IPosixLibrary =>
  (posixLibrary ??= createPosixLibrary());

const createPosixLibrary = (): IPosixLibrary => {
  const constants: IPosixConstants = requiredPosixConstants();
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

/**
 * Read the open flags from `fs.constants`. Node does not export `O_CLOEXEC`,
 * so the Linux ABI value is supplied for Linux and Android, and any other
 * POSIX system is refused rather than given a guessed value.
 */
const requiredPosixConstants = (): IPosixConstants => {
  const constants: Record<string, number | undefined> =
    fs.constants as unknown as Record<string, number | undefined>;
  const read = (name: keyof IPosixConstants): number => {
    const value: number | undefined = constants[name];
    if (value === undefined)
      throw new Error(`supported POSIX runtime omitted ${name}`);
    return value;
  };
  const closeOnExec: number | undefined =
    constants.O_CLOEXEC ??
    (process.platform === "linux" || process.platform === "android"
      ? LINUX_O_CLOEXEC
      : undefined);
  if (closeOnExec === undefined)
    throw new Error("supported POSIX runtime omitted O_CLOEXEC");
  return {
    O_CLOEXEC: closeOnExec,
    O_CREAT: read("O_CREAT"),
    O_DIRECTORY: read("O_DIRECTORY"),
    O_EXCL: read("O_EXCL"),
    O_NOFOLLOW: read("O_NOFOLLOW"),
    O_RDONLY: read("O_RDONLY"),
    O_RDWR: read("O_RDWR"),
  };
};

/** `O_CLOEXEC` in the generic Linux ABI (`02000000` octal). */
const LINUX_O_CLOEXEC: number = 0x00080000;

// Windows SDK access rights, share modes, dispositions, options, attributes,
// and codes, named as in `winnt.h`, `winbase.h`, `winternl.h`, and `ntstatus.h`.
const FILE_READ_DATA: number = 0x1;
const FILE_WRITE_DATA: number = 0x2;
const FILE_READ_ATTRIBUTES: number = 0x80;
const FILE_WRITE_ATTRIBUTES: number = 0x100;
const SYNCHRONIZE: number = 0x00100000;
const FILE_SHARE_READ: number = 0x1;
const FILE_SHARE_WRITE: number = 0x2;
const FILE_SHARE_DELETE: number = 0x4;
const OPEN_EXISTING: number = 3;
const FILE_FLAG_BACKUP_SEMANTICS: number = 0x02000000;
const FILE_FLAG_OPEN_REPARSE_POINT: number = 0x00200000;
const OBJ_CASE_INSENSITIVE: number = 0x40;
const FILE_ATTRIBUTE_DIRECTORY: number = 0x10;
const FILE_ATTRIBUTE_NORMAL: number = 0x80;
const FILE_ATTRIBUTE_REPARSE_POINT: number = 0x400;
const FILE_OPEN: number = 1;
const FILE_CREATE: number = 2;
const FILE_SYNCHRONOUS_IO_NONALERT: number = 0x20;
const FILE_NON_DIRECTORY_FILE: number = 0x40;
const FILE_OPEN_REPARSE_POINT: number = 0x00200000;
const FILE_BEGIN: number = 0;
const ERROR_FILE_NOT_FOUND: number = 2;
const ERROR_PATH_NOT_FOUND: number = 3;
const ERROR_NOT_A_REPARSE_POINT: number = 4390;
const STATUS_OBJECT_NAME_COLLISION: number = 0xc0000035 | 0;

const openWindowsParent = (parentPath: string): IBoundParent => {
  const windows: IWindowsLibrary = loadWindowsLibrary();
  const raw: unknown = windows.createFile(
    path.toNamespacedPath(parentPath),
    SYNCHRONIZE | FILE_READ_ATTRIBUTES | FILE_READ_DATA,
    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
    null,
    OPEN_EXISTING,
    FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT,
    null,
  );
  if (invalidWindowsHandle(raw, windows.handleType)) {
    const code: number = windows.getLastError();
    if (
      code === ERROR_FILE_NOT_FOUND ||
      code === ERROR_PATH_NOT_FOUND ||
      code === ERROR_NOT_A_REPARSE_POINT
    )
      throw new ScaffoldParentChangedError(
        nativeError("unable to open scaffold parent", code).message,
      );
    throw nativeError("unable to open scaffold parent", code);
  }
  const openChild = (
    childName: string,
    disposition: number,
  ): IWindowsOpenedChild => {
    const nameBytes: Buffer = Buffer.from(`${childName}\0`, "utf16le");
    const output: unknown[] = [null];
    // The exclusive create holds read and write access and lets a later
    // reader share the file; a resident reopen asks for read access only and
    // tolerates the still-open writer, so the pre-close identity check does
    // not trip a sharing violation on itself.
    const creating: boolean = disposition === FILE_CREATE;
    const status: number = windows.ntCreateFile(
      output,
      creating
        ? SYNCHRONIZE |
            FILE_READ_ATTRIBUTES |
            FILE_WRITE_ATTRIBUTES |
            FILE_READ_DATA |
            FILE_WRITE_DATA
        : SYNCHRONIZE | FILE_READ_ATTRIBUTES | FILE_READ_DATA,
      {
        Attributes: OBJ_CASE_INSENSITIVE,
        Length: koffi.sizeof(windows.objectAttributesType),
        ObjectName: {
          Buffer: nameBytes,
          Length: nameBytes.length - 2,
          MaximumLength: nameBytes.length,
        },
        RootDirectory: raw,
        SecurityDescriptor: null,
        SecurityQualityOfService: null,
      },
      { Information: 0n, Status: 0n },
      null,
      FILE_ATTRIBUTE_NORMAL,
      creating ? FILE_SHARE_READ : FILE_SHARE_READ | FILE_SHARE_WRITE,
      disposition,
      FILE_OPEN_REPARSE_POINT |
        FILE_SYNCHRONOUS_IO_NONALERT |
        FILE_NON_DIRECTORY_FILE,
      null,
      0,
    ) as number;
    if (status < 0) return { status };
    const childRaw: unknown = output[0];
    if (invalidWindowsHandle(childRaw, windows.handleType)) {
      const error: Error = new Error(
        "native create returned an invalid scaffold child",
      );
      // A successful create that yields no usable handle has still reserved
      // the slot, so the caller learns about a created slot, not a clean miss.
      if (creating)
        throw new ScaffoldCreatedSlotError(
          "scaffold slot was created before its handle could be bound",
          { cause: error },
        );
      throw error;
    }
    return { handle: childRaw, status };
  };
  return {
    close: (): void => {
      if (windows.closeHandle(raw) === false)
        throw nativeError(
          "unable to close scaffold parent",
          windows.getLastError(),
        );
    },
    createExclusive: (childName: string): ICreateResult => {
      let created: IWindowsOpenedChild;
      try {
        created = openChild(childName, FILE_CREATE);
      } catch (error) {
        if (error instanceof ScaffoldCreatedSlotError)
          return { error, status: "partial" };
        return { error, reason: "create-failed", status: "refused" };
      }
      if (created.handle !== undefined)
        return {
          child: windowsChild(windows, created.handle),
          status: "opened",
        };
      return {
        error: nativeError("unable to create scaffold child", created.status),
        reason:
          created.status === STATUS_OBJECT_NAME_COLLISION
            ? "target-competitor"
            : "create-failed",
        status: "refused",
      };
    },
    inspect: (): IBoundParentStatus => windows.inspectParent(raw),
    openResident: (childName: string): IBoundChild => {
      const opened: IWindowsOpenedChild = openChild(childName, FILE_OPEN);
      if (opened.handle === undefined)
        throw nativeError("unable to reopen scaffold child", opened.status);
      return windowsChild(windows, opened.handle);
    },
  };
};

const windowsChild = (
  windows: IWindowsLibrary,
  handle: unknown,
): IBoundChild => {
  const seek = (position: number): void => {
    if (windows.setFilePointer(handle, position) === false)
      throw nativeError(
        "unable to position scaffold child",
        windows.getLastError(),
      );
  };
  return {
    close: (): void => {
      if (windows.closeHandle(handle) === false)
        throw nativeError(
          "unable to close scaffold child",
          windows.getLastError(),
        );
    },
    read: (
      target: Buffer,
      offset: number,
      length: number,
      position: number,
    ): number => {
      seek(position);
      const read: number | null = windows.readFile(
        handle,
        target.subarray(offset, offset + length),
        length,
      );
      if (read === null)
        throw nativeError(
          "unable to read scaffold child",
          windows.getLastError(),
        );
      return read;
    },
    status: (): IBoundChildStatus => {
      const information: IWindowsFileInformation = windows.inspectFile(handle);
      const reparse: boolean =
        (information.attributes & FILE_ATTRIBUTE_REPARSE_POINT) !== 0;
      return {
        identity: information.identity,
        link: reparse,
        links: BigInt(information.links),
        regular:
          reparse === false &&
          (information.attributes & FILE_ATTRIBUTE_DIRECTORY) === 0,
        size: information.size,
        version: `${information.identity}:${information.size}:${information.lastWrite}`,
      };
    },
    sync: (): void => {
      if (windows.flushFileBuffers(handle) === false)
        throw nativeError(
          "unable to flush scaffold child",
          windows.getLastError(),
        );
    },
    write: (
      source: Buffer,
      offset: number,
      length: number,
      position: number,
    ): number => {
      seek(position);
      const written: number | null = windows.writeFile(
        handle,
        source.subarray(offset, offset + length),
        length,
      );
      if (written === null)
        throw nativeError(
          "unable to write scaffold child",
          windows.getLastError(),
        );
      return written;
    },
  };
};

/** The fields of `BY_HANDLE_FILE_INFORMATION` the adapter reads. */
interface IWindowsFileInformation {
  attributes: number;
  identity: string;
  lastWrite: bigint;
  links: number;
  size: bigint;
}

/** Two 32-bit halves of a Windows `FILETIME`. */
interface IWindowsFileTime {
  dwHighDateTime: number;
  dwLowDateTime: number;
}

/** The kernel32 and ntdll entry points the Windows adapter needs. */
interface IWindowsLibrary {
  closeHandle(handle: unknown): boolean;
  createFile(
    pathname: string,
    access: number,
    share: number,
    security: unknown,
    disposition: number,
    flags: number,
    template: unknown,
  ): unknown;
  flushFileBuffers(handle: unknown): boolean;
  getLastError(): number;
  handleType: TypeObject;
  inspectFile(handle: unknown): IWindowsFileInformation;
  inspectParent(handle: unknown): IBoundParentStatus;
  ntCreateFile: ReturnType<LibraryHandle["func"]>;
  objectAttributesType: TypeObject;
  readFile(handle: unknown, target: Buffer, length: number): number | null;
  setFilePointer(handle: unknown, position: number): boolean;
  writeFile(handle: unknown, source: Buffer, length: number): number | null;
}

let windowsLibrary: IWindowsLibrary | undefined;

/** Bind kernel32 and ntdll once, on first use. */
const loadWindowsLibrary = (): IWindowsLibrary =>
  (windowsLibrary ??= createWindowsLibrary());

const createWindowsLibrary = (): IWindowsLibrary => {
  const kernel: LibraryHandle = koffi.load("kernel32.dll");
  const ntdll: LibraryHandle = koffi.load("ntdll.dll");
  const handleType: TypeObject = koffi.pointer(
    "AutoMovieScaffoldHandle",
    koffi.opaque("AutoMovieScaffoldHandleValue"),
  );
  const unicodeType: TypeObject = koffi.struct(
    "AutoMovieScaffoldUnicodeString",
    {
      Length: "uint16_t",
      MaximumLength: "uint16_t",
      Buffer: "void *",
    },
  );
  const objectAttributesType: TypeObject = koffi.struct(
    "AutoMovieScaffoldObjectAttributes",
    {
      Length: "uint32_t",
      RootDirectory: handleType,
      ObjectName: koffi.pointer(unicodeType),
      Attributes: "uint32_t",
      SecurityDescriptor: "void *",
      SecurityQualityOfService: "void *",
    },
  );
  const ioStatusType: TypeObject = koffi.struct(
    "AutoMovieScaffoldIoStatusBlock",
    {
      Status: "intptr_t",
      Information: "uintptr_t",
    },
  );
  const fileTimeType: TypeObject = koffi.struct("AutoMovieScaffoldFileTime", {
    dwLowDateTime: "uint32_t",
    dwHighDateTime: "uint32_t",
  });
  const fileInformationType: TypeObject = koffi.struct(
    "AutoMovieScaffoldFileInformation",
    {
      dwFileAttributes: "uint32_t",
      ftCreationTime: fileTimeType,
      ftLastAccessTime: fileTimeType,
      ftLastWriteTime: fileTimeType,
      dwVolumeSerialNumber: "uint32_t",
      nFileSizeHigh: "uint32_t",
      nFileSizeLow: "uint32_t",
      nNumberOfLinks: "uint32_t",
      nFileIndexHigh: "uint32_t",
      nFileIndexLow: "uint32_t",
    },
  );
  const getFileInformation = kernel.func(
    "__stdcall",
    "GetFileInformationByHandle",
    "bool",
    [handleType, koffi.out(koffi.pointer(fileInformationType))],
  ) as (handle: unknown, information: Record<string, unknown>) => boolean;
  const getLastError = kernel.func(
    "uint32_t __stdcall GetLastError(void)",
  ) as IWindowsLibrary["getLastError"];
  const transferCount: ReturnType<typeof koffi.out> = koffi.out(
    koffi.pointer("uint32_t"),
  );
  const writeFileNative = kernel.func("__stdcall", "WriteFile", "bool", [
    handleType,
    "void *",
    "uint32_t",
    transferCount,
    "void *",
  ]) as (
    handle: unknown,
    source: Buffer,
    length: number,
    written: number[],
    overlapped: null,
  ) => boolean;
  const readFileNative = kernel.func("__stdcall", "ReadFile", "bool", [
    handleType,
    "void *",
    "uint32_t",
    transferCount,
    "void *",
  ]) as (
    handle: unknown,
    target: Buffer,
    length: number,
    read: number[],
    overlapped: null,
  ) => boolean;
  const setFilePointerNative = kernel.func(
    "__stdcall",
    "SetFilePointerEx",
    "bool",
    [handleType, "int64_t", "void *", "uint32_t"],
  ) as (
    handle: unknown,
    distance: bigint,
    newPointer: null,
    method: number,
  ) => boolean;
  const dword = (value: unknown): number => Number(value) >>> 0;
  const readInformation = (
    handle: unknown,
    label: string,
  ): Record<string, unknown> => {
    const zeroTime: IWindowsFileTime = { dwHighDateTime: 0, dwLowDateTime: 0 };
    const information: Record<string, unknown> = {
      dwFileAttributes: 0,
      dwVolumeSerialNumber: 0,
      ftCreationTime: { ...zeroTime },
      ftLastAccessTime: { ...zeroTime },
      ftLastWriteTime: { ...zeroTime },
      nFileIndexHigh: 0,
      nFileIndexLow: 0,
      nFileSizeHigh: 0,
      nFileSizeLow: 0,
      nNumberOfLinks: 0,
    };
    if (getFileInformation(handle, information) === false)
      throw nativeError(`unable to inspect ${label}`, getLastError());
    return information;
  };
  // Formatted like `scaffoldPhysicalIdentity`: Node's Windows `fstat` reports
  // the volume serial number as `dev` and the file index as `ino`.
  const identityOf = (information: Record<string, unknown>): string => {
    const volume: bigint = BigInt(dword(information.dwVolumeSerialNumber));
    const fileIndex: bigint =
      (BigInt(dword(information.nFileIndexHigh)) << 32n) |
      BigInt(dword(information.nFileIndexLow));
    return `${volume}:${fileIndex}`;
  };
  return {
    closeHandle: kernel.func("__stdcall", "CloseHandle", "bool", [
      handleType,
    ]) as IWindowsLibrary["closeHandle"],
    createFile: kernel.func("__stdcall", "CreateFileW", handleType, [
      "str16",
      "uint32_t",
      "uint32_t",
      "void *",
      "uint32_t",
      "uint32_t",
      "void *",
    ]) as IWindowsLibrary["createFile"],
    flushFileBuffers: kernel.func("__stdcall", "FlushFileBuffers", "bool", [
      handleType,
    ]) as IWindowsLibrary["flushFileBuffers"],
    getLastError,
    handleType,
    inspectFile: (handle: unknown): IWindowsFileInformation => {
      const information: Record<string, unknown> = readInformation(
        handle,
        "scaffold child",
      );
      const lastWrite: IWindowsFileTime =
        information.ftLastWriteTime as IWindowsFileTime;
      return {
        attributes: dword(information.dwFileAttributes),
        identity: identityOf(information),
        lastWrite:
          (BigInt(dword(lastWrite.dwHighDateTime)) << 32n) |
          BigInt(dword(lastWrite.dwLowDateTime)),
        links: dword(information.nNumberOfLinks),
        size:
          (BigInt(dword(information.nFileSizeHigh)) << 32n) |
          BigInt(dword(information.nFileSizeLow)),
      };
    },
    inspectParent: (handle: unknown): IBoundParentStatus => {
      const information: Record<string, unknown> = readInformation(
        handle,
        "scaffold parent",
      );
      return {
        directory:
          (dword(information.dwFileAttributes) & FILE_ATTRIBUTE_DIRECTORY) !==
          0,
        identity: identityOf(information),
      };
    },
    ntCreateFile: ntdll.func("__stdcall", "NtCreateFile", "int32_t", [
      koffi.out(koffi.pointer(handleType)),
      "uint32_t",
      koffi.pointer(objectAttributesType),
      koffi.out(koffi.pointer(ioStatusType)),
      "int64_t *",
      "uint32_t",
      "uint32_t",
      "uint32_t",
      "uint32_t",
      "void *",
      "uint32_t",
    ]),
    objectAttributesType,
    readFile: (
      handle: unknown,
      target: Buffer,
      length: number,
    ): number | null => {
      const read: number[] = [0];
      return readFileNative(handle, target, length, read, null) === false
        ? null
        : read[0]!;
    },
    setFilePointer: (handle: unknown, position: number): boolean =>
      setFilePointerNative(handle, BigInt(position), null, FILE_BEGIN),
    writeFile: (
      handle: unknown,
      source: Buffer,
      length: number,
    ): number | null => {
      const written: number[] = [0];
      return writeFileNative(handle, source, length, written, null) === false
        ? null
        : written[0]!;
    },
  };
};

/** Null, or `INVALID_HANDLE_VALUE` (all bits set) at the handle's width. */
const invalidWindowsHandle = (
  handle: unknown,
  handleType: TypeObject,
): boolean =>
  handle === null ||
  BigInt.asIntN(koffi.sizeof(handleType) * 8, koffi.address(handle)) === -1n;

/**
 * Reopen `childName` relative to the held parent and require the same
 * ordinary single-link file generation, closing the reopened handle in every
 * case.
 */
const assertBoundResident = (
  parent: IBoundParent,
  childName: string,
  expectedVersion: string,
): void => {
  const resident: IBoundChild = parent.openResident(childName);
  let failure: unknown = undefined;
  try {
    const status: IBoundChildStatus = resident.status();
    assertOrdinarySingleLink(status, childName);
    if (status.version !== expectedVersion)
      throw new Error(
        `scaffold resident changed descriptor generation: ${childName}`,
      );
  } catch (error) {
    failure = error;
  }
  try {
    resident.close();
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "resident scaffold descriptor close",
    );
  }
  if (failure !== undefined) throw nativeFailure(failure);
};

/** Read the whole file back through `child` and require `bytes` exactly. */
const assertChildBytes = (
  child: IBoundChild,
  childName: string,
  bytes: Buffer,
): void => {
  const readback: Buffer = Buffer.alloc(bytes.length);
  let offset: number = 0;
  while (offset < readback.length) {
    const read: number = child.read(
      readback,
      offset,
      readback.length - offset,
      offset,
    );
    if (read === 0)
      throw new Error(`scaffold file stopped during readback: ${childName}`);
    offset += read;
  }
  if (readback.equals(bytes) === false)
    throw new Error(`scaffold file changed during readback: ${childName}`);
};

const assertOrdinarySingleLink = (
  status: IBoundChildStatus,
  childName: string,
): void => {
  if (status.link || status.regular === false || status.links !== 1n)
    throw new Error(
      `scaffold file is not one ordinary single-link file: ${childName}`,
    );
};

const nativeError = (message: string, code: number): Error =>
  new Error(`${message} (native code ${code})`);

const nativeFailure = (failure: unknown): Error =>
  failure instanceof Error
    ? failure
    : new Error("Native scaffold publication failed.", { cause: failure });
