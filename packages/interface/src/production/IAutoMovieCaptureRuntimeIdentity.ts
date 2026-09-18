import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Versioned, comparable identity of the host capture runtime.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieCaptureRuntimeIdentity` as the portable data boundary for the rendering identity mask channels requirement.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieCaptureRuntimeIdentity` for the spec render pass products system contract.
 */
export interface IAutoMovieCaptureRuntimeIdentity {
  /**
   * Capture identity schema and semantics.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `protocolVersion` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `protocolVersion` for the spec render pass products system contract.
   */
  protocolVersion: "automovie.capture-runtime.v2";
  /**
   * Exact Playwright package that selected and launched the browser.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `playwright` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `playwright` for the spec render pass products system contract.
   */
  playwright: {
    /** Package name. */
    package: "playwright";
    /** Installed package version. */
    version: string;
  };
  /**
   * Content identity of every installed package and browser support byte that
   * can participate in the captured frame.
   *
   * @evidence requirements/acceptance/evidence-and-freshness.md#acceptance-current-historical-evidence Makes an installed renderer change a new evidence generation rather than letting historical pixels remain current.
   * @evidence specifications/review-and-acceptance/evidence-freshness-and-completeness.md#acceptance-system-current-historical-evidence Types the installed runtime closure consumed by capture freshness comparisons.
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
  /**
   * Exact browser executable provenance.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `browser` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `browser` for the spec render pass products system contract.
   */
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
  /**
   * Host operating-system boundary.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `platform` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `platform` for the spec render pass products system contract.
   */
  platform: {
    /** Node platform name. */
    os: string;
    /** Node architecture name. */
    arch: string;
  };
  /**
   * Browser launch and raster mode.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `mode` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `mode` for the spec render pass products system contract.
   */
  mode: {
    /** Explicit headless implementation. */
    headless: "chromium";
    /** Exact viewport scale. */
    deviceScaleFactor: number;
  };
  /**
   * Requested and actual WebGL identity.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `graphics` as the portable data boundary for the rendering identity mask channels requirement.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `graphics` for the spec render pass products system contract.
   */
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
