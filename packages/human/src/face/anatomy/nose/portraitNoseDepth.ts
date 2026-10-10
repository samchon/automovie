import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Anterior displacement of the nasal surface at one host point, in
 * millimetres: a tip bump plus one mirrored alar bump, each a Gaussian scaled
 * by its projection channel.
 *
 * The point is a head-frame position in millimetres (+X anatomical left, +Y
 * up). The tip bump is centred on the midline at `tipY` with the socket's two
 * tip radii. The alar bump is centred on `alarY` at distance `alarOffset` from
 * the midline on either side, taken through `|x|` so one expression serves both
 * alae and the result is exactly mirror-symmetric. Each radius is the distance
 * at which a bump has fallen to `1/e`, and a zero `tipProjection` and
 * `alarProjection` return zero everywhere, the neutral of both channels. The
 * result is a displacement along host Z, so a positive value advances the
 * surface.
 *
 * The expression is smooth except for a slope break of the alar term on the
 * midline, where `|x|` folds; the size of the break scales with
 * `exp(-(alarOffset / alarRadius)^2)`, which is negligible when the alae sit
 * several radii from the midline and is not when they nearly coincide. Radii
 * must be positive and finite, which `resolvePortraitNoseSocket` admits.
 */
export function portraitNoseDepth(
  point: number[],
  socket: IPortraitNoseSocket,
  shape: IPortraitNoseShape,
): number {
  const x = point[0] - socket.midline;
  const alar = Math.exp(
    -(((Math.abs(x) - socket.alarOffset) / socket.alarRadius) ** 2) -
      ((point[1] - socket.alarY) / socket.alarRadius) ** 2,
  );
  const tip = Math.exp(
    -((x / socket.tipRadius[0]) ** 2) -
      ((point[1] - socket.tipY) / socket.tipRadius[1]) ** 2,
  );
  return shape.alarProjection * alar + shape.tipProjection * tip;
}
