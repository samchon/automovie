
/**
 * Versioned identity of the installed capture runtime and observed graphics path. System browser channels remain explicitly unsealed; package or configured executables carry content identity.
 *
 * @evidence contracts/common.md#principled-implementation Capture identity combines dependency-closed package content, browser support and executable provenance, platform, raster scale and actual WebGL vendor and renderer; canonical capture validation checks the closure and protocol before comparing receipts.
 * @evidence contracts/common.md#clear-and-simple-design Package closure, browser selection, platform, launch mode and graphics are separate record groups, exposing which observation supplies each part of capture reproducibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Package version strings alone cannot stand in for byte identity, and a system channel explicitly declares its unsealed boundary rather than borrowing the digest of another executable or support tree.
 * @evidence contracts/common.md#meaningful-documentation Describes package and browser-support digests with file and byte counts, executable selection and unavailability, host architecture, device scale, requested backend and actual graphics identity.
 * @author Samchon
 */
export interface IAutoMovieCaptureRuntimeIdentity {
  /** Capture identity schema and semantics. */
  protocolVersion: "automovie.capture-runtime.v2";

  /** Exact Playwright package that selected and launched the browser. */
  playwright: {
    /** Package name. */
    package: "playwright";

    /** Installed package version. */
    version: string;
  };

  /**
   * Content identity of every installed package and browser support byte that can participate in the captured frame.
   */
  runtimeClosure: {
    /** Capture-closure schema and semantics. */
    protocolVersion: "automovie.capture-runtime-closure.v1";

    /** Canonical digest of the complete package and browser-support identity. */
    contentDigest: string;

    /** Complete dependency-closed installed package generations. */
    packages: Array<{
      /** Installed package name. */
      package: string;

      /** Installed package version. */
      version: string;

      /** Digest of every captured package file path and byte digest. */
      contentDigest: string;

      /** Number of captured package files. */
      files: number;

      /** Total captured package bytes. */
      bytes: number;
    }>;

    /** Browser support closure, or the explicit unsealed system-channel boundary. */
    browserSupport:
      | {
          /** A physical support tree was sealed. */
          status: "content-sealed";

          /** How the browser executable was selected. */
          source: "package-owned" | "configured-executable";

          /** Digest of every support-file path and byte digest. */
          contentDigest: string;

          /** Number of captured support files. */
          files: number;

          /** Total captured support bytes. */
          bytes: number;
        }
      | {
          /** A system channel remains compatible but is not content sealed. */
          status: "system-channel-unsealed";

          /** Explicit compatibility boundary. */
          source: "system-channel";
        };
  };

  /** Exact browser executable provenance. */
  browser: {
    /** Browser product family. */
    product: "chromium" | "chrome" | "msedge";

    /** Runtime-reported browser version. */
    version: string;

    /** Playwright browser revision, unavailable for a system channel. */
    revision: string | null;

    /** How the executable was selected. */
    source: "package-owned" | "system-channel" | "configured-executable";

    /** SHA-256 of the executable, unavailable only for a system channel. */
    executableDigest: string | null;
  };

  /** Host operating-system boundary. */
  platform: {
    /** Node platform name. */
    os: string;

    /** Node architecture name. */
    arch: string;
  };

  /** Browser launch and raster mode. */
  mode: {
    /** Explicit headless implementation. */
    headless: "chromium";

    /** Exact viewport scale. */
    deviceScaleFactor: number;
  };

  /** Requested and actual WebGL identity. */
  graphics: {
    /** Requested ANGLE/backend selection. */
    requestedBackend: string;

    /** Actual canvas graphics API. */
    api: "webgl" | "webgl2";

    /** Runtime-reported WebGL vendor. */
    vendor: string;

    /** Runtime-reported WebGL renderer. */
    renderer: string;
  };
}
