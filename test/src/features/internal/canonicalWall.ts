import type { IAutoMovieBuiltBoundary, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** One rectangular separation with its face frame written out in full.
 *
 * Create an authored rectangular face boundary with caller-selected placement, dimensions and owning spaces. The four local XY corners use the supplied width/height and declared 0.2 metre thickness; a string space becomes one side and an array preserves its order.
 *
 * Single-room exterior faces and shared storey separation use the same input shape; consumers own assertions, and constructing this fixture supplies no wall-builder output oracle or behavior proof. This synchronous portable declaration is reached through explicit imports or the compatibility barrel, registers no dynamic case, installs no consumer and starts no process, browser, native artifact build or GPU.
 */
export const canonicalWall: (props: { id: string; kind: string; space: string | readonly string[]; origin: IAutoMovieVector3; rotation: IAutoMovieQuaternion; width: number; height: number; }) => IAutoMovieBuiltBoundary = (props: {
  id: string;
  kind: string;
  /** The one space this encloses, or the two it separates. */
  space: string | readonly string[];
  origin: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  width: number;
  height: number;
}): IAutoMovieBuiltBoundary => ({
  id: props.id,
  kind: props.kind,
  spaces: typeof props.space === "string" ? [props.space] : [...props.space],
  elements: [],
  face: {
    origin: props.origin,
    rotation: props.rotation,
    outline: [
      { x: 0, y: 0 },
      { x: props.width, y: 0 },
      { x: props.width, y: props.height },
      { x: 0, y: props.height },
    ],
    thickness: 0.2,
  },
});
