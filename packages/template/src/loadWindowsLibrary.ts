import koffi, { type LibraryHandle, type TypeObject } from "koffi";

import { FILE_ATTRIBUTE_DIRECTORY } from "./FILE_ATTRIBUTE_DIRECTORY";
import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type IWindowsFileInformation } from "./IWindowsFileInformation";
import { type IWindowsLibrary } from "./IWindowsLibrary";
import { nativeError } from "./nativeError";

const FILE_BEGIN: number = 0;

/** Two 32-bit halves of a Windows `FILETIME`. */
interface IWindowsFileTime {
  dwHighDateTime: number;
  dwLowDateTime: number;
}

let windowsLibrary: IWindowsLibrary | undefined;

/**
 * Bind kernel32 and ntdll once, on first use.
 *
 * @evidence contracts/common.md#principled-implementation Koffi binds the declared kernel32 and ntdll ABI, including pointer-width HANDLEs and explicit native structure layouts, lazily once per module.
 * @evidence contracts/common.md#clear-and-simple-design Binding definitions stay separate from parent and child operations so loading does not create a filesystem handle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native methods are called through their bindings without replacing globals or foreign implementations.
 * @evidence contracts/common.md#meaningful-documentation The comment states first-use initialization; the interface documents native transfer counts, status and structure ownership.
 * @evidence contracts/performance.md#efficient-algorithms First use builds a fixed set of types and function bindings; subsequent calls read one cached binding record.
 * @evidence contracts/performance.md#reuse-equivalent-work The binding set is shared because operating-system ABI and pointer width stay fixed for the process; a failed creation is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One kernel32 and one ntdll binding set remain for the module's process lifetime; no parent or child HANDLE is retained by this cache.
 */
export const loadWindowsLibrary: () => IWindowsLibrary = (): IWindowsLibrary =>
  (windowsLibrary ??= createWindowsLibrary());

const createWindowsLibrary: () => IWindowsLibrary = (): IWindowsLibrary => {
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
  const getFileInformation: (
    handle: unknown,
    information: Record<string, unknown>,
  ) => boolean = kernel.func(
    "__stdcall",
    "GetFileInformationByHandle",
    "bool",
    [handleType, koffi.out(koffi.pointer(fileInformationType))],
  ) as (handle: unknown, information: Record<string, unknown>) => boolean;
  const getLastError: () => number = kernel.func(
    "uint32_t __stdcall GetLastError(void)",
  ) as IWindowsLibrary["getLastError"];
  const transferCount: ReturnType<typeof koffi.out> = koffi.out(
    koffi.pointer("uint32_t"),
  );
  const writeFileNative: (
    handle: unknown,
    source: Buffer,
    length: number,
    written: number[],
    overlapped: null,
  ) => boolean = kernel.func("__stdcall", "WriteFile", "bool", [
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
  const readFileNative: (
    handle: unknown,
    target: Buffer,
    length: number,
    read: number[],
    overlapped: null,
  ) => boolean = kernel.func("__stdcall", "ReadFile", "bool", [
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
  const setFilePointerNative: (
    handle: unknown,
    distance: bigint,
    newPointer: null,
    method: number,
  ) => boolean = kernel.func("__stdcall", "SetFilePointerEx", "bool", [
    handleType,
    "int64_t",
    "void *",
    "uint32_t",
  ]) as (
    handle: unknown,
    distance: bigint,
    newPointer: null,
    method: number,
  ) => boolean;
  const dword: (value: unknown) => number = (value: unknown): number =>
    Number(value) >>> 0;
  const readInformation: (
    handle: unknown,
    label: string,
  ) => Record<string, unknown> = (
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
  const identityOf: (information: Record<string, unknown>) => string = (
    information: Record<string, unknown>,
  ): string => {
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
