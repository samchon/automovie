import { IAutoMovieMeshAssembly } from "@automovie/engine";
import { IAutoMovieMeshPart } from "@automovie/engine";
import { IAutoMovieProfilePoint } from "@automovie/engine";
import { extrudeAutoMovieProfile } from "@automovie/engine";
import { mergeAutoMovieMeshParts } from "@automovie/engine";
import { area } from "./area";
import { rectangle } from "./rectangle";

/**
 * Build the architecture test's polygonal half-ring from equal-angle convex quads, extruded in metres, with two piers only when springing is positive. Callers supply positive span/rise/thickness/depth, nonnegative springing and a positive integral segment count; this helper adds no input admission beyond the actual extrusion/merge owners.
 *
 * The returned volume sums shoelace quad/pier areas times depth, independently of mesh tetrahedron accumulation but sharing the authored ring coordinates. It measures the faceted prisms, not a smooth elliptical vault, and catches no shared mistake in those coordinates.
 *
 * Work/output grow with segment count, with one fixed-size extrusion per member and one final merge. Fresh arrays and assembly belong to the caller; no fixture, measurement or host resource persists between calls.
 */
export const arch: (props: {
  span: number;
  rise: number;
  thickness: number;
  depth: number;
  springing: number;
  segments: number;
}) => { assembly: IAutoMovieMeshAssembly; volume: number } = (props: {
  span: number;
  rise: number;
  thickness: number;
  depth: number;
  springing: number;
  segments: number;
}): { assembly: IAutoMovieMeshAssembly; volume: number } => {
  const inner: number = props.span / 2;
  const outer: number = inner + props.thickness;
  const at: (
    step: number,
  ) => [IAutoMovieProfilePoint, IAutoMovieProfilePoint] = (
    step: number,
  ): [IAutoMovieProfilePoint, IAutoMovieProfilePoint] => {
    const angle: number = (step / props.segments) * Math.PI;
    return [
      {
        x: -inner * Math.cos(angle),
        y: props.springing + props.rise * Math.sin(angle),
      },
      {
        x: -outer * Math.cos(angle),
        y: props.springing + (props.rise + props.thickness) * Math.sin(angle),
      },
    ];
  };
  const parts: IAutoMovieMeshPart[] = [];
  let volume: number = 0;
  for (let step: number = 0; step < props.segments; ++step) {
    const [innerFrom, outerFrom]: [
      IAutoMovieProfilePoint,
      IAutoMovieProfilePoint,
    ] = at(step);
    const [innerTo, outerTo]: [IAutoMovieProfilePoint, IAutoMovieProfilePoint] =
      at(step + 1);
    const quad: IAutoMovieProfilePoint[] = [
      innerFrom,
      innerTo,
      outerTo,
      outerFrom,
    ];
    volume += area(quad) * props.depth;
    parts.push({
      id: `voussoir-${step + 1}`,
      mesh: extrudeAutoMovieProfile({ profile: quad, depth: props.depth }),
    });
  }
  if (props.springing > 0)
    for (const [name, left] of [
      ["left", -outer],
      ["right", inner],
    ] as const) {
      const pier: IAutoMovieProfilePoint[] = rectangle(
        left,
        0,
        props.thickness,
        props.springing,
      );
      volume += area(pier) * props.depth;
      parts.push({
        id: `pier-${name}`,
        mesh: extrudeAutoMovieProfile({ profile: pier, depth: props.depth }),
      });
    }
  return { assembly: mergeAutoMovieMeshParts(parts), volume };
};
