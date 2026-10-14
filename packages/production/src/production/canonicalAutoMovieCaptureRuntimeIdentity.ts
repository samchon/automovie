import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import type { IAutoMovieCaptureRuntimeIdentity } from "@automovie/interface";
import typia from "typia";
import { canonicalizeAutoMovieJson, compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL } from "./AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL";

/**
 * Admit the declared capture identity and encode its canonical metadata.
 *
 * Capture/publication producers call this before binding the identity to frame receipts. The host supplies package/executable byte observations; this validator checks their shape and closure consistency rather than rereading installed files or proving that the reported graphics path produced pixels.
 *
 * @evidence contracts/common.md#principled-implementation The protocol guard precedes exact schema validation, then nonblank metadata, package closure/order/uniqueness, browser provenance and numeric/digest guards; recomputed canonical closure SHA-256 binds the supplied package/support ledger.
 * @evidence contracts/common.md#clear-and-simple-design Owns structured identity admission shared by capture and render publication, with parsing/canonical-text equality in parseAutoMovieCaptureRuntimeIdentity and actual byte observation in the capture host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The six required package names and browser-source distinctions are the shipped runtime protocol; system channels remain explicitly unsealed. Supplied file digests are not treated as independent proof that this function observed those files.
 * @evidence contracts/common.md#meaningful-documentation States caller roles, exact admission, metadata versus observed bytes and unsealed system browser limitations; invalid identities throw before a canonical string is returned.
 * @evidence contracts/performance.md#efficient-algorithms For K package records, one adjacent-key pass checks canonical strict order without sorting a copy, and six required-name scans take O(K); schema checks, canonicalization and hashing additionally scale with metadata bytes. Keys and canonical strings use O(metadata bytes) temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Computes each package ordering key once and reuses it for adjacent order/duplicate checks. The immutable digest grammar and canonical JSON owner are shared; mutable host observations are validated anew without a retained verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation, keys and canonical buffers are local to this synchronous call, and the caller owns the returned string; no installed file, browser handle or running capture task is opened or retained.
 */
export function canonicalAutoMovieCaptureRuntimeIdentity(
  identity: IAutoMovieCaptureRuntimeIdentity,
): string {
  if (
    (identity as { protocolVersion?: unknown }).protocolVersion !==
    AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL
  )
    throw new Error(
      `Unsupported AutoMovie capture runtime identity protocol ${JSON.stringify(
        (identity as { protocolVersion?: unknown }).protocolVersion,
      )}; expected ${AUTOMOVIE_CAPTURE_RUNTIME_IDENTITY_PROTOCOL}.`,
    );
  const validation: typia.IValidation<IAutoMovieCaptureRuntimeIdentity> =
    typia.validateEquals<IAutoMovieCaptureRuntimeIdentity>(identity);
  if (validation.success === false)
    throw new Error(
      `Invalid AutoMovie capture runtime identity: ${validation.errors
        .map((error: typia.IValidation.IError): string => `${error.path} expects ${error.expected}`)
        .join("; ")}`,
    );
  const text: string[] = [
    identity.playwright.version,
    identity.browser.version,
    identity.platform.os,
    identity.platform.arch,
    identity.graphics.requestedBackend,
    identity.graphics.vendor,
    identity.graphics.renderer,
  ];
  if (text.some((value: string): boolean => value.trim().length === 0))
    throw new Error(
      "AutoMovie capture runtime identity text fields must be non-blank.",
    );
  const digest: RegExp = SHA256_DIGEST_PATTERN;
  const packages: IAutoMovieCaptureRuntimeIdentity["runtimeClosure"]["packages"] = identity.runtimeClosure.packages;
  const packageKeys: string[] = packages.map(
    (entry: IAutoMovieCaptureRuntimeIdentity["runtimeClosure"]["packages"][number]): string =>
      `${entry.package}\0${entry.version}\0${entry.contentDigest}`,
  );
  if (
    identity.runtimeClosure.protocolVersion !==
      "automovie.capture-runtime-closure.v1" ||
    digest.test(identity.runtimeClosure.contentDigest) === false ||
    packages.length === 0 ||
    packages.some(
      (entry: IAutoMovieCaptureRuntimeIdentity["runtimeClosure"]["packages"][number], index: number): boolean =>
        entry.package.trim().length === 0 ||
        entry.package !== entry.package.trim() ||
        entry.version.trim().length === 0 ||
        entry.version !== entry.version.trim() ||
        digest.test(entry.contentDigest) === false ||
        Number.isSafeInteger(entry.files) === false ||
        entry.files <= 0 ||
        Number.isSafeInteger(entry.bytes) === false ||
        entry.bytes <= 0 ||
        (index > 0 && compareCodeUnits(packageKeys[index - 1]!, packageKeys[index]!) >= 0),
    ) ||
    [
      "vite",
      "@automovie/viewer",
      "@automovie/engine",
      "three",
      "playwright",
      "playwright-core",
    ].some(
      (required: string): boolean =>
        packages.some((entry: IAutoMovieCaptureRuntimeIdentity["runtimeClosure"]["packages"][number]): boolean => entry.package === required) === false,
    )
  )
    throw new Error(
      "AutoMovie capture runtime package closure must be complete, canonical, non-empty, and content addressed.",
    );
  const browserSupport: IAutoMovieCaptureRuntimeIdentity["runtimeClosure"]["browserSupport"] = identity.runtimeClosure.browserSupport;
  if (
    (browserSupport.status === "content-sealed" &&
      (digest.test(browserSupport.contentDigest) === false ||
        Number.isSafeInteger(browserSupport.files) === false ||
        browserSupport.files <= 0 ||
        Number.isSafeInteger(browserSupport.bytes) === false ||
        browserSupport.bytes <= 0)) ||
    (identity.browser.source === "system-channel") !==
      (browserSupport.status === "system-channel-unsealed") ||
    browserSupport.source !== identity.browser.source
  )
    throw new Error(
      "AutoMovie capture runtime browser support closure does not match the selected browser source.",
    );
  const closureDigest: string = digestAutoMovieBytes(
    Buffer.from(
      canonicalizeAutoMovieJson({
        protocolVersion: identity.runtimeClosure.protocolVersion,
        packages: identity.runtimeClosure.packages,
        browserSupport: identity.runtimeClosure.browserSupport,
      }),
      "utf8",
    ),
  );
  if (closureDigest !== identity.runtimeClosure.contentDigest)
    throw new Error(
      "AutoMovie capture runtime closure digest does not match its package and browser support identities.",
    );
  if (
    Number.isFinite(identity.mode.deviceScaleFactor) === false ||
    identity.mode.deviceScaleFactor <= 0
  )
    throw new Error(
      "AutoMovie capture runtime deviceScaleFactor must be finite and positive.",
    );
  if (
    identity.browser.executableDigest !== null &&
    digest.test(identity.browser.executableDigest) === false
  )
    throw new Error(
      "AutoMovie capture runtime executableDigest must be one exact SHA-256 digest.",
    );
  if (
    identity.browser.source === "package-owned" &&
    (identity.browser.product !== "chromium" ||
      identity.browser.revision === null ||
      identity.browser.revision.trim().length === 0 ||
      identity.browser.executableDigest === null)
  )
    throw new Error(
      "Package-owned capture identity requires the Chromium product, a non-blank Playwright revision, and an exact executable digest. Run npm run capture:install and npm run capture:doctor.",
    );
  if (
    identity.browser.source === "configured-executable" &&
    (identity.browser.revision !== null ||
      identity.browser.executableDigest === null)
  )
    throw new Error(
      "Configured capture executable identity requires a null Playwright revision and an exact executable digest.",
    );
  if (
    identity.browser.source === "system-channel" &&
    (identity.browser.product === "chromium" ||
      identity.browser.revision !== null ||
      identity.browser.executableDigest !== null)
  )
    throw new Error(
      "System-channel capture identity requires Chrome or Edge and must leave package revision and executable digest null.",
    );
  return canonicalizeAutoMovieJson(validation.data);
}
