import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanRingCurve } from "./AutoMovieHumanRingCurve";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";

/**
 * Shape a closed radial section and invert its periodic cubic limit stencil.
 *
 * @param layout Section plane, rays and semantic address
 * @param section Origin, radius on each ray and optional measured perimeter
 * @returns Control points and the section's perimeter, millimetres
 */
export const shapeAutoMovieHumanRadialSection: (layout: IAutoMovieHumanRingLayout, section: { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number; girth: number | null; }) => IAutoMovieHumanRingShape = (
  layout: IAutoMovieHumanRingLayout,
  section: {
    origin: IAutoMovieVector3;
    radius: (d: IAutoMovieVector3) => number;
    girth: number | null;
  },
): IAutoMovieHumanRingShape => {
  const { origin, radius, girth }: { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number; girth: number | null; } = section;
  const n: number = layout.count;
  const binormal: IAutoMovieVector3 = AutoMovieHumanVector.cross(
    layout.frame.normal,
    layout.frame.reference,
  );
  const target: number =
    girth ??
    AutoMovieHumanRingCurve.perimeter(
      Array.from(
        { length: SAMPLES },
        (_: unknown, i: number): IAutoMovieVector3 => {
          const angle: number = (2 * Math.PI * i) / SAMPLES;
          const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(
            AutoMovieHumanVector.of(0, 0, 0),
            [layout.frame.reference, Math.cos(angle)],
            [binormal, Math.sin(angle)],
          );
          return AutoMovieHumanVector.offset(origin, [d, radius(d)]);
        },
      ),
    );
  // control radii whose limit points reach the section radially: the ring's limit stencil
  // (1, 4, 1) / 6 seen along each ray, where neighbouring rays meet at cos(2π / n)
  const control: number[] = AutoMovieHumanRingCurve.unstencil(
    layout.directions.map(radius),
    Math.cos((2 * Math.PI) / n),
  );
  const place: (radii: number[]) => IAutoMovieVector3[] = (radii: number[]): IAutoMovieVector3[] =>
    layout.directions.map(
      (d: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(origin, [d, radii[k]!]),
    );
  // the limit curve scales with the control radii about the origin, so one factor sets its girth
  const scale: number =
    target /
    AutoMovieHumanRingCurve.perimeter(
      AutoMovieHumanRingCurve.spline(place(control)),
    );
  const radii: number[] = control.map((r: number): number => r * scale);
  return {
    ...layout,
    frame: { ...layout.frame, origin },
    girth: target,
    radii,
    positions: place(radii),
  };
};

/** Directions used only to integrate a section's perimeter. */
const SAMPLES: number = 720;
