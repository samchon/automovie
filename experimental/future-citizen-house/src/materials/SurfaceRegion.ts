/**
 * Box-bounded patch of a mesh's faces that takes its own finish.
 *
 * `partitionSurfaceRegions` clips each face whose normal points along `normal` to the box between
 * `min` and `max`, in the mesh's local metres.
 */
export type SurfaceRegion = {
  /** Finish the clipped patch takes. */
  finish: string;

  /** Local face direction the region selects. */
  normal: "x-" | "x+" | "y-" | "y+" | "z-" | "z+";

  /** Lower local x, y and z bound of the region box. */
  min: [number, number, number];

  /** Upper local x, y and z bound of the region box. */
  max: [number, number, number];
};
