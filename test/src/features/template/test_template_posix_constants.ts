import { TestValidator } from "@nestia/e2e";

import type { IScaffoldPosixConstants } from "@automovie/template/IScaffoldPosixConstants";
import { resolveScaffoldPosixConstants } from "@automovie/template/resolveScaffoldPosixConstants";
import { throwsError } from "../internal/predicates";

/**
 * POSIX scaffold publication resolves native open flags without starting a host or replacing process state.
 *
 * Scenarios:
 *
 * 1. Darwin without Node's close-on-exec export receives Apple's 0x01000000 ABI bit and preserves supplied flags, including zero-valued read-only mode.
 * 2. Linux and Android without that export receive the generic Linux 1<<19 bit.
 * 3. An explicitly supplied native close-on-exec value takes precedence even on a platform with no bundled fallback.
 * 4. An unknown close-on-exec ABI and every missing required open flag refuse by the missing name.
 * 5. Fallback and provider resolution leave both caller-owned flag bags unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production flag resolver and checks its native bit choices, preservation and refusal messages, catching the macOS pre-create failure caused by Node omitting O_CLOEXEC.
 * @evidence contracts/testing.md#independent-expectations Darwin's bit comes from Apple XNU bsd/sys/fcntl.h and Linux's from include/uapi/asm-generic/fcntl.h; preserved integers are caller-owned snapshots taken before invocation, so changing an input cannot change the expectation. This pure test verifies flag resolution and cannot establish a real macOS syscall's result.
 * @evidence contracts/testing.md#distinguishing-cases Covers both fallback families, a zero required value, explicit-provider precedence on a platform with no fallback, unknown ABI refusal, each absent required flag and unchanged input bags; native filesystem creation remains covered by scaffold publication integration observation.
 * @evidence contracts/testing.md#execution-ownership The test_ entry is discovered by the unit runner and invokes the pure resolver in-process with explicit platform and scalar inputs, starting no consumer process, native library or GPU.
 */
export function test_template_posix_constants(): void {
  // Primary ABI definitions: https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/fcntl.h and https://github.com/torvalds/linux/blob/master/include/uapi/asm-generic/fcntl.h.
  const supplied: Omit<IScaffoldPosixConstants, "O_CLOEXEC"> = {
    O_CREAT: 0x00000200,
    O_DIRECTORY: 0x00100000,
    O_EXCL: 0x00000800,
    O_NOFOLLOW: 0x00000100,
    O_RDONLY: 0,
    O_RDWR: 2,
  };
  const original: Omit<IScaffoldPosixConstants, "O_CLOEXEC"> = { ...supplied };
  const expectedDarwin: IScaffoldPosixConstants = {
    ...original,
    O_CLOEXEC: 0x01000000,
  };
  TestValidator.equals(
    "Darwin close-on-exec ABI and unchanged native fields",
    resolveScaffoldPosixConstants("darwin", supplied),
    expectedDarwin,
  );
  for (const platform of ["linux", "android"] as const)
    TestValidator.equals(
      `${platform} generic Linux close-on-exec ABI`,
      resolveScaffoldPosixConstants(platform, supplied).O_CLOEXEC,
      1 << 19,
    );
  const provided: IScaffoldPosixConstants = {
    ...supplied,
    O_CLOEXEC: 0x01000000,
  };
  const expectedProvided: IScaffoldPosixConstants = { ...provided };
  TestValidator.equals(
    "explicit native provider needs no platform fallback",
    resolveScaffoldPosixConstants("freebsd", provided),
    expectedProvided,
  );
  TestValidator.predicate(
    "an unsupported close-on-exec ABI refuses",
    throwsError(
      (): IScaffoldPosixConstants =>
        resolveScaffoldPosixConstants("freebsd", supplied),
      "omitted O_CLOEXEC",
    ),
  );
  for (const name of Object.keys(supplied) as (keyof typeof supplied)[]) {
    const incomplete: Partial<IScaffoldPosixConstants> = { ...provided };
    delete incomplete[name];
    TestValidator.predicate(
      `missing ${name} refuses before native binding`,
      throwsError(
        (): IScaffoldPosixConstants =>
          resolveScaffoldPosixConstants("darwin", incomplete),
        `omitted ${name}`,
      ),
    );
  }
  TestValidator.equals(
    "fallback preserves the caller's native bag",
    supplied,
    original,
  );
  TestValidator.equals(
    "provider input remains unchanged",
    provided,
    expectedProvided,
  );
}
