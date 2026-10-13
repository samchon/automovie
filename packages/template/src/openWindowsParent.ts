import { type IBoundParent } from "./IBoundParent";
import { type IWindowsLibrary } from "./IWindowsLibrary";
import { loadWindowsLibrary } from "./loadWindowsLibrary";
import { ScaffoldParentChangedError } from "./ScaffoldParentChangedError";
import { nativeError } from "./nativeError";
import { type ICreateResult } from "./ICreateResult";
import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type IBoundChild } from "./IBoundChild";
import { type IBoundChildStatus } from "./IBoundChildStatus";
import { type IWindowsFileInformation } from "./IWindowsFileInformation";
import { FILE_ATTRIBUTE_DIRECTORY } from "./FILE_ATTRIBUTE_DIRECTORY";
import koffi, { type TypeObject } from "koffi";
import * as path from "node:path";


/** Result of one `NtCreateFile` call: a handle on success, else the NTSTATUS. */
interface IWindowsOpenedChild {
  handle?: unknown;
  status: number;
}

/** The create reserved the child slot but returned no usable handle. */
class ScaffoldCreatedSlotError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ScaffoldCreatedSlotError";
  }
}

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

const FILE_ATTRIBUTE_NORMAL: number = 0x80;

const FILE_ATTRIBUTE_REPARSE_POINT: number = 0x400;

const FILE_OPEN: number = 1;

const FILE_CREATE: number = 2;

const FILE_SYNCHRONOUS_IO_NONALERT: number = 0x20;

const FILE_NON_DIRECTORY_FILE: number = 0x40;

const FILE_OPEN_REPARSE_POINT: number = 0x00200000;

const ERROR_FILE_NOT_FOUND: number = 2;

const ERROR_PATH_NOT_FOUND: number = 3;

const ERROR_NOT_A_REPARSE_POINT: number = 4390;

const STATUS_OBJECT_NAME_COLLISION: number = 0xc0000035 | 0;


/**
 * Open a Windows directory without following its final reparse point and return held-parent child operations; the publication coordinator owns closing the parent and each child.
 *
 * @evidence contracts/common.md#principled-implementation CreateFileW opens the non-followed parent, and NtCreateFile uses its RootDirectory with FILE_CREATE or FILE_OPEN for child operations.
 * @evidence contracts/common.md#clear-and-simple-design The Windows adapter retains raw HANDLEs and supplies the same parent/child contract as POSIX without introducing a CRT descriptor conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A collision is a no-slot refusal, while a successful create with an unusable handle remains partial; no cleanup or pathname retry hides either effect.
 * @evidence contracts/common.md#meaningful-documentation The comment states final-reparse handling, parent-relative operations and coordinator release ownership.
 * @evidence contracts/performance.md#efficient-algorithms Parent opening and each child operation use a fixed number of native calls; byte transfers remain proportional to the requested slice.
 * @evidence contracts/performance.md#reuse-equivalent-work The native ABI bindings are shared through the lazy loader, while every parent and child HANDLE represents a separate unshared open effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent HANDLE and returned child HANDLEs transfer to the publication coordinator for closing; native errors before a child exists retain no child handle.
 */
export const openWindowsParent: (parentPath: string) => IBoundParent = (parentPath: string): IBoundParent => {
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
  const openChild: (childName: string, disposition: number) => IWindowsOpenedChild = (
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

const windowsChild: (windows: IWindowsLibrary, handle: unknown) => IBoundChild = (
  windows: IWindowsLibrary,
  handle: unknown,
): IBoundChild => {
  const seek: (position: number) => void = (position: number): void => {
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


/** Null, or `INVALID_HANDLE_VALUE` (all bits set) at the handle's width. */
const invalidWindowsHandle: (handle: unknown, handleType: TypeObject) => boolean = (
  handle: unknown,
  handleType: TypeObject,
): boolean =>
  handle === null ||
  BigInt.asIntN(koffi.sizeof(handleType) * 8, koffi.address(handle)) === -1n;
