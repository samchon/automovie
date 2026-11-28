import { AutoMovieHumanSkinCutLoop as K } from "@automovie/human";

type V3 = [number, number, number];

/**
 * A join's loop as a face's skin cut by a declared surface, on a made plane and a made cylinder.
 *
 * Made inputs, millimetres: the skin is the plane `z = 0` charted `(x, y)`; the surface is the cylinder of radius 20 about the line
 * through the origin along `(sin t, 0, cos t)`, `t = 0.6`. A point `(x, y, 0)` stands `sqrt(x^2 cos^2 t + y^2)` from that line, so the
 * cut is the ellipse `x^2 cos^2 t + y^2 = 20^2`, and against a circle of radius 20 its share at the clock `c` is
 * `1 / sqrt(cos^2 c cos^2 t + sin^2 c)`: 1 across the tilt and `1 / cos t` along it.
 *
 * Scenarios:
 * 1. The 64 shares equal that closed form.
 * 2. Red control: against the closed form of a cylinder one hundredth wider the same comparison misses by a hundredth, so the check sees
 *    a wrong surface.
 * 3. A reach of 1.05 is short of the share `1 / cos 0.6 = 1.21` at clock 0: refused, naming the clock.
 * 4. A centre outside the cylinder: refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanSkinCutLoop.shares` and reads the shares or the refusal. It catches a share off the first crossing, a crossing interpolated between columns, a ray that is given a share where the surface is out of reach, and a centre on the wrong side that is not refused.
 * @evidence contracts/development/testing.md#independent-expectations The shares follow from the distance of a plane point to a tilted line, written in the comment; the refusals from `1 / cos 0.6 > 1.05` and from a centre 25 mm from a 20 mm cylinder's axis. No value comes from a run.
 * @evidence contracts/development/common.md#meaningful-documentation Analytic shares for a tilted cylinder are checked against a wider-radius control. Short reach and an outside centre each produce a separate refusal.
 */
export function test_human_skin_cut_loop(): void {
  const failures: string[] = [];
  const tilt: number = 0.6;
  const axis: V3 = [Math.sin(tilt), 0, Math.cos(tilt)];
  const cylinder = (radius: number): ((p: V3) => number) => (p: V3): number => {
    const along: number = p[0] * axis[0] + p[1] * axis[1] + p[2] * axis[2];
    return Math.hypot(p[0] - along * axis[0], p[1] - along * axis[1], p[2] - along * axis[2]) - radius;
  };
  const input = (centre: [number, number], reach: number): K.IInput => ({ point: (u: number, v: number): V3 => [u, v, 0], centre: { u: centre[0], v: centre[1] }, semi: { u: 20, v: 20 }, sense: 1, count: 64, side: cylinder(20), reach });
  const closed = (clock: number, widen: number): number => widen / Math.sqrt(Math.cos(clock) ** 2 * Math.cos(tilt) ** 2 + Math.sin(clock) ** 2);

  // 1 and 2. The shares on the closed form, and off a wider cylinder's.
  const got: number[] | string = K.shares(input([0, 0], 2));
  if (typeof got === "string") failures.push(`cut: refused, ${got}`);
  else {
    if (got.length !== 64) failures.push(`cut: ${got.length} shares, expected 64`);
    const miss = (widen: number): number => Math.max(...got.map((share: number, k: number): number => Math.abs(share - closed((2 * Math.PI * k) / 64, widen))));
    if (!(miss(1) <= 1e-12)) failures.push(`cut: the shares stand ${miss(1)} off the ellipse's`);
    if (!(miss(1.01) >= 0.01)) failures.push(`control: a cylinder one hundredth wider is missed by ${miss(1.01)} only`);
  }

  // 3. Out of reach along the tilt.
  const short: number[] | string = K.shares(input([0, 0], 1.05));
  if (typeof short !== "string" || !short.includes("clock 0 ")) failures.push(`reach: expected the refusal at clock 0, got ${typeof short === "string" ? short : "shares"}`);

  // 4. The centre outside.
  const off: number[] | string = K.shares(input([0, 25], 2));
  if (typeof off !== "string" || !off.includes("centre")) failures.push(`centre: expected the refusal of the centre, got ${typeof off === "string" ? off : "shares"}`);
  if (failures.length !== 0) throw new Error(`${failures.length} skin cut loop failures:\n${failures.join("\n")}`);
}
