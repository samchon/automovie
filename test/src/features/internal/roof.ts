import { IAutoMovieMesh, type IAutoMovieVector3 } from "@automovie/interface";

import { buildAutoMoviePolyhedron } from "../../../../packages/engine/src/geometry/buildAutoMoviePolyhedron";

/**
 * Build the architecture test's ridged solid from five oriented faces: a gable at zero ridgeInset and a hip for the tested inset strictly between zero and half the depth. Dimensions are metres and the bottom face lies at Y=0; the helper relies on the production polyhedron builder for admission and tessellation.
 *
 * Literal face coordinates construct the fixture, while the parent independently checks prism/prismatoid volume and edge closure. Fixed face-count work returns a fresh mesh without caching or retaining the inputs; arbitrary insets and visible roof appearance are outside this fixture's guarantee.
 */
export const roof: (props: {
  width: number;
  depth: number;
  height: number;
  ridgeInset: number;
}) => IAutoMovieMesh = (props: {
  width: number;
  depth: number;
  height: number;
  ridgeInset: number;
}): IAutoMovieMesh => {
  const b0: IAutoMovieVector3 = {
    x: -props.width / 2,
    y: 0,
    z: -props.depth / 2,
  };
  const b1: IAutoMovieVector3 = {
    x: props.width / 2,
    y: 0,
    z: -props.depth / 2,
  };
  const b2: IAutoMovieVector3 = {
    x: props.width / 2,
    y: 0,
    z: props.depth / 2,
  };
  const b3: IAutoMovieVector3 = {
    x: -props.width / 2,
    y: 0,
    z: props.depth / 2,
  };
  const r0: IAutoMovieVector3 = {
    x: 0,
    y: props.height,
    z: -props.depth / 2 + props.ridgeInset,
  };
  const r1: IAutoMovieVector3 = {
    x: 0,
    y: props.height,
    z: props.depth / 2 - props.ridgeInset,
  };
  return buildAutoMoviePolyhedron([
    [b0, b1, b2, b3],
    [b1, r0, r1, b2],
    [b3, r1, r0, b0],
    [b0, r0, b1],
    [b2, r1, b3],
  ]);
};
