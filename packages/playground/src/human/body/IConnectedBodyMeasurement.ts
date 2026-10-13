/**
 * A measured body channel solved for a target: the new shape and the length the solved body actually measures, in metres. `actualMetres` is the solver's achieved readback, which may differ from the requested target within the numerical inverse's tolerance; it is not a separate authored channel.
 *
 * @evidence contracts/common.md#principled-implementation The inverse result pairs its new detailed shape with the measured outcome of that shape, preserving achieved readback rather than substituting the caller's requested target.
 * @evidence contracts/common.md#clear-and-simple-design A shape-and-length pair gives measured controls the commit payload and status reading without carrying the worker's basis or solver internals back to the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The achieved length remains a numerical solver result; this type neither snaps it to an expected target nor claims exact inverse convergence.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes the solved channel map, metre-valued achieved measurement and the requested target that numerical tolerance may separate from it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measurement result declares no inversion method; bracketing and body evaluation costs stay with the Human solver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pair represents one solved result and implements no sharing across channel requests or document generations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The inverse result contains ordinary numerical data without handles; pending transport and committed-document owners determine its retention.
 *
 * @author Samchon
 */
export interface IConnectedBodyMeasurement {
  /** The body shape after the solve. */
  shape: Record<string, number>;

  /** The measured length of the solved body, metres. */
  actualMetres: number;
}
