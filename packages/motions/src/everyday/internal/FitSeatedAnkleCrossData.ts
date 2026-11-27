export namespace FitSeatedAnkleCrossData {
  export const RAD = Math.PI / 180;

  /*
   * Surface convergence, metres, within the existing one-centimetre placement
   * fit.
   */
  export const SURFACE_PRECISION = 0.00005;

  export const ANGLES = ["flexion", "abduction", "twist"] as const;
}
