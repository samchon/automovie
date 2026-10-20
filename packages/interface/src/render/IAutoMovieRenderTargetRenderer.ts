/**
 * Host-reported graphics API and device identity used by render target fingerprinting.
 *
 * @evidence contracts/common.md#principled-implementation Nonblank API, vendor and device strings distinguish the graphics implementation whose frame costs and pixels the capture reports; unavailable hardware details remain the explicit unknown spelling.
 * @evidence contracts/common.md#clear-and-simple-design Three reported identity fields keep graphics authority separate from settings and dependency bytes without embedding a native context object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown is not a verified hardware identity and equal reported strings do not guarantee identical drivers or pixels; the full capture runtime supplies additional installed closure when needed.
 * @evidence contracts/common.md#meaningful-documentation Defines API family and host-withheld vendor/device meaning for target identity.
 */
export interface IAutoMovieRenderTargetRenderer {
  /** Graphics API family, such as `webgl2`. */
  api: string;

  /** Reported hardware vendor, or `unknown` when the host withholds it. */
  vendor: string;

  /** Reported device or renderer string, or `unknown`. */
  device: string;
}
