import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** Versioned, comparable identity of the host capture runtime. */
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
   * Content identity of every installed package and browser support byte that
   * can participate in the captured frame.
   */
  runtimeClosure: {
    /** Capture-closure schema and semantics. */
    protocolVersion: "automovie.capture-runtime-closure.v1";

    /** Canonical digest of the complete package and browser-support identity. */
    contentDigest: AutoMovieContentDigest;

    /** Complete dependency-closed installed package generations. */
    packages: Array<{
      /** Installed package name. */
      package: string;

      /** Installed package version. */
      version: string;

      /** Digest of every captured package file path and byte digest. */
      contentDigest: AutoMovieContentDigest;

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
          contentDigest: AutoMovieContentDigest;

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
    executableDigest: AutoMovieContentDigest | null;
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
