import type {
  IAutoMovieConstructionBandEdge,
  IAutoMovieConstructionSkinCut,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import {
  AutoMovieConstructionSkinCut,
  AutoMovieConstructionPortField,
  AutoMovieConstructionSplitEdge,
  AutoMovieSolidBlendChain,
  AutoMovieSolidChain,
} from "@automovie/engine";

type V3 = [number, number, number];

/**
 * A face's skin cut by declared planes is the closed-form curve on the skin with its exact derivatives, two parallel positions of the planes give offsets of one curve, and a band carried onto that curve ends on it between its columns.
 *
 * Fixture (millimetres): the cylinder `S(u, v) = (9 cos v, 9 sin v, u)` over stations `[-10, 60]`, its facing end the low one (`into = +1`), 9 stations, 32 samples.
 *
 * Scenarios:
 * 1. One tilted plane through `(0, 0, 12)` with the normal `(sin 0.4, 0, cos 0.4)`: at 97 phases off the samples the rail's station is `12 - 9 tan 0.4 cos v` within 1e-10 mm, its first derivative `9 tan 0.4 sin v` and its second `9 tan 0.4 cos v` within 1e-8.
 * 2. Offsets of one curve: the same plane moved 3 mm along its normal gives a rail `3 / cos 0.4` above the first at every phase, within 1e-10 mm, so the strip between them is even. Red control, the station ring: against the ring `u = 15` the first rail's distance along the station spreads over `2 * 9 tan 0.4 = 7.61` mm round the face.
 * 3. A wedge: the end plane `u >= 5` and the plane through `(7, 0, 0)` with the normal `(-cos 0.2, 0, sin 0.2)`, which parts the cylinder from a neighbour on `+x`: the rail is `max(5, (9 cos v - 7) / tan 0.2)` within 1e-9 mm at 97 phases, the second plane's branch between the phases `+-acos((7 + 5 tan 0.2) / 9)`.
 * 4. Round: with the rounding 1 mm the smooth minimum `-ln(sum exp(-g_i))` of the two distances, evaluated here from the planes, vanishes on the rail within 1e-9 at 97 phases; the rail stands above the sharp one by at most `ln 2` in distance and by under 1e-6 mm opposite the edge; and across the wedge's edge its derivative agrees with the central difference of its stations within 1e-4 mm per radian, where the sharp rail's differs by more than 5 (its slope jumps by `9 sin v / tan 0.2 = 20.2`).
 * 5. Refusals by name: a second plane parallel to the axis (`(-1, 0, 0)` through `(7, 0, 0)`) is refused because the skin never enters the cut; an end plane before the facing end (`u >= -20`) because the skin is already inside it; no plane.
 * 6. A band carried onto the rail (`AutoMovieConstructionSplitEdge.carried`): a 32-column strip from the circle of radius 14 at `z = 0` to scenario 1's rail, its end ribbons the cylinder's station direction. Red control, the column strip: midway between columns its end edge stands off the rail's curve by more than 1e-5 mm somewhere. Carried: at 64 mid-column and quarter-column clocks its end edge is the cylinder's point on the rail within 1e-9 mm, its start edge and its cross derivative at both edges are the strip's own within 1e-9, and the clock and rail readers invert each other within 1e-9 rad.
 * 7. A prepared point reader supplies scalar bracket signs on the same tilted cylinder. It retains the jet-only root and derivatives and prepares each declared station once.
 * 8. Uneven but directed columns take a C2 advancing phase map even when their unconstrained cubic reverses. Reversing two actual columns still refuses.
 * 9. The point reader lands on the closed-form tilted rail without reading any second derivatives.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds cuts with `AutoMovieConstructionSkinCut.create` on a made closed-form skin and reads `at`; builds a strip with `AutoMovieSolidBlendChain.strip` and carries it with `AutoMovieConstructionSplitEdge.carried`. It catches a wrong root, a wrong implicit derivative, a wedge that takes the wrong plane, a rounding that leaves the wedge, an admitted cut with no crossing, and a band whose end edge is interpolated between columns.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is the cylinder's and the planes' closed form written here: the plane's equation solved for the station, its derivatives by hand, the wedge as the larger of two stations, the smooth minimum from the two plane distances, and the rail's point as the cylinder at that station; none reads the operator's own residual.
 * @evidence contracts/development/testing.md#distinguishing-cases One plane against two; sharp against rounded at the same edge; an offset pair against a station ring; a strip against the same strip carried; three refusals with distinct causes.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_skin_cut`; it evaluates made closed forms in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios, each naming its input, its closed form and its bound.
 */
export function test_construction_skin_cut(): void {
  const failures: string[] = [];
  const turn: number = 2 * Math.PI;
  const r: number = 9;
  const cylinder: IAutoMovieSolidSurface = {
    name: "cylinder",
    orientation: -1,
    period: turn,
    domain: [-10, 60],
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [r * Math.cos(v), r * Math.sin(v), u],
      u: [0, 0, 1],
      v: [-r * Math.sin(v), r * Math.cos(v), 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [-r * Math.cos(v), -r * Math.sin(v), 0],
    }),
  };
  const stations: number[] = Array.from({ length: 9 }, (_: unknown, i: number): number => -10 + (70 * i) / 8);
  const phases: number[] = Array.from({ length: 97 }, (_: unknown, i: number): number => 0.013 + (turn * i) / 97);
  const cut = (planes: IAutoMovieConstructionSkinCut.IPlane[], round?: number): IAutoMovieConstructionSkinCut.ICut | string =>
    AutoMovieConstructionSkinCut.create({ surface: cylinder, planes, ...(round === undefined ? {} : { round }), into: 1, stations, samples: 32 });

  // 1. One tilted plane.
  const t: number = 0.4;
  const tilted = (shift: number): IAutoMovieConstructionSkinCut.IPlane => ({
    point: [shift * Math.sin(t), 0, 12 + shift * Math.cos(t)],
    normal: [Math.sin(t), 0, Math.cos(t)],
  });
  const one: IAutoMovieConstructionSkinCut.ICut | string = cut([tilted(0)]);
  let preparations: number = 0;
  let pointReads: number = 0;
  let secondReads: number = 0;
  const point = (u: number, v: number): V3 => {
    ++pointReads;
    return [r * Math.cos(v), r * Math.sin(v), u];
  };
  const prepared: IAutoMovieConstructionSkinCut.ICut | string = AutoMovieConstructionSkinCut.create({
    surface: {
      ...cylinder,
      point,
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
        const jet: IAutoMovieSolidSurface.IJet = cylinder.jet(u, v);
        return {
          ...jet,
          get vv(): V3 {
            ++secondReads;
            return jet.vv;
          },
        };
      },
      pointAt: (u: number): ((v: number) => V3) => {
        ++preparations;
        return (v: number): V3 => point(u, v);
      },
    },
    planes: [tilted(0)],
    into: 1,
    stations,
    samples: 32,
  });
  if (typeof prepared === "string" || preparations !== stations.length || pointReads <= 32)
    failures.push("prepared cut did not use one point reader per declared station for its scalar signs");
  else if (typeof one !== "string") {
    const railPoint: ((phase: number) => V3) | undefined = prepared.point;
    if (railPoint === undefined) failures.push("the cut has no first-order rail point reader");
    else {
      const before: number = secondReads;
      for (const phase of phases) {
        const [x, y, z]: V3 = railPoint(phase);
        const expected: number = 12 - r * Math.tan(t) * Math.cos(phase);
        if (Math.hypot(x - r * Math.cos(phase), y - r * Math.sin(phase), z - expected) > 1e-10)
          failures.push(`the reduced rail point misses its closed form at ${phase} rad`);
      }
      if (secondReads !== before)
        failures.push(`position reads consumed ${secondReads - before} second derivatives`);
    }
    for (const phase of phases) {
      const exact: [number, number, number] = one.at(phase);
      if (prepared.at(phase).some((value, i): boolean => Math.abs(value - exact[i]!) > 1e-10))
        failures.push(`point-only bracketing changed the tilted plane's root or jet at ${phase} rad`);
    }
  }
  if (typeof one === "string") failures.push(`one plane: ${one}`);
  else {
    let [e0, e1, e2]: [number, number, number] = [0, 0, 0];
    for (const v of phases) {
      const [u, u1, u2]: [number, number, number] = one.at(v);
      e0 = Math.max(e0, Math.abs(u - (12 - r * Math.tan(t) * Math.cos(v))));
      e1 = Math.max(e1, Math.abs(u1 - r * Math.tan(t) * Math.sin(v)));
      e2 = Math.max(e2, Math.abs(u2 - r * Math.tan(t) * Math.cos(v)));
    }
    if (!(e0 <= 1e-10 && e1 <= 1e-8 && e2 <= 1e-8)) failures.push(`one plane: station off ${e0} mm, first derivative ${e1}, second ${e2}`);

    // 2. Offsets of one curve, against the station ring.
    const moved: IAutoMovieConstructionSkinCut.ICut | string = cut([tilted(3)]);
    if (typeof moved === "string") failures.push(`moved plane: ${moved}`);
    else {
      const widths: number[] = phases.map((v: number): number => moved.at(v)[0] - one.at(v)[0]);
      const uneven: number = Math.max(...widths.map((w: number): number => Math.abs(w - 3 / Math.cos(t))));
      const ring: number[] = phases.map((v: number): number => 15 - one.at(v)[0]);
      const spread: number = Math.max(...ring) - Math.min(...ring);
      if (!(uneven <= 1e-10)) failures.push(`offsets: the strip between the two rails varies by ${uneven} mm`);
      if (!(Math.abs(spread - 2 * r * Math.tan(t)) <= 1e-2)) failures.push(`red control: the station ring stands ${spread} mm unevenly off the rail, not ${2 * r * Math.tan(t)}`);
    }
  }

  // 3-4. A wedge, sharp and rounded.
  const a: number = 0.2;
  const wedge: IAutoMovieConstructionSkinCut.IPlane[] = [
    { point: [0, 0, 5], normal: [0, 0, 1] },
    { point: [7, 0, 0], normal: [-Math.cos(a), 0, Math.sin(a)] },
  ];
  const sharp: IAutoMovieConstructionSkinCut.ICut | string = cut(wedge);
  const round: IAutoMovieConstructionSkinCut.ICut | string = cut(wedge, 1);
  const closed = (v: number): number => Math.max(5, (r * Math.cos(v) - 7) / Math.tan(a));
  const edge: number = Math.acos((7 + 5 * Math.tan(a)) / r);
  if (typeof sharp === "string" || typeof round === "string") failures.push(`wedge: ${String(sharp)} / ${String(round)}`);
  else {
    const off: number = Math.max(...phases.map((v: number): number => Math.abs(sharp.at(v)[0] - closed(v))));
    if (!(off <= 1e-9)) failures.push(`wedge: the rail stands ${off} mm off max(5, (9 cos v - 7) / tan 0.2)`);
    if (!(sharp.at(0)[0] > 9 && Math.abs(sharp.at(Math.PI)[0] - 5) <= 1e-9)) failures.push("wedge: the rail takes the wrong plane at phase 0 or pi");

    let residual: number = 0;
    let above: number = 0;
    for (const v of phases) {
      const u: number = round.at(v)[0];
      const g: [number, number] = [u - 5, -Math.cos(a) * (r * Math.cos(v) - 7) + Math.sin(a) * u];
      residual = Math.max(residual, Math.abs(-Math.log(Math.exp(-g[0]) + Math.exp(-g[1]))));
      above = Math.max(above, Math.min(g[0], g[1]));
      if (!(Math.min(g[0], g[1]) >= -1e-12)) failures.push(`round: at phase ${v} the rail leaves the wedge by ${-Math.min(g[0], g[1])} mm`);
    }
    if (!(residual <= 1e-9)) failures.push(`round: the smooth minimum is ${residual} on the rail`);
    if (!(above <= Math.log(2) + 1e-9)) failures.push(`round: the rail stands ${above} mm inside the wedge, more than ln 2`);
    if (!(Math.abs(round.at(Math.PI)[0] - 5) <= 1e-6)) failures.push(`round: opposite the edge the rail stands ${round.at(Math.PI)[0] - 5} mm off the end plane`);
    const h: number = 1e-4;
    const kink = (c: IAutoMovieConstructionSkinCut.ICut): number =>
      Math.abs(c.at(edge)[1] - (c.at(edge + h)[0] - c.at(edge - h)[0]) / (2 * h));
    if (!(kink(round) <= 1e-4 && kink(sharp) > 5)) failures.push(`round: across the edge the derivative misses the stations' difference by ${kink(round)} rounded and ${kink(sharp)} sharp`);
  }

  // 5. Refusals by name.
  const never: IAutoMovieConstructionSkinCut.ICut | string = cut([wedge[0]!, { point: [7, 0, 0], normal: [-1, 0, 0] }]);
  if (typeof never !== "string" || !never.includes("never enters")) failures.push(`a plane along the axis was not refused as never entered: ${String(never)}`);
  const before: IAutoMovieConstructionSkinCut.ICut | string = cut([{ point: [0, 0, -20], normal: [0, 0, 1] }]);
  if (typeof before !== "string" || !before.includes("already inside")) failures.push(`a plane before the facing end was not refused: ${String(before)}`);
  const none: IAutoMovieConstructionSkinCut.ICut | string = cut([]);
  if (typeof none !== "string") failures.push("a cut without a plane was admitted");

  // 6. A band carried onto the rail.
  if (typeof one !== "string") {
    const n: number = 32;
    const childPhases: number[] = Array.from({ length: n }, (_: unknown, k: number): number => (turn * k) / n);
    const columns: { start: { point: V3; first: V3; second: V3 }; end: { point: V3; first: V3; second: V3 } }[] = childPhases.map(
      (v: number): { start: { point: V3; first: V3; second: V3 }; end: { point: V3; first: V3; second: V3 } } => {
        const u: number = one.at(v)[0];
        const L: number = Math.hypot(5, u);
        return {
          start: { point: [14 * Math.cos(v), 14 * Math.sin(v), 0], first: [0, 0, L], second: [0, 0, 0] },
          end: { point: [r * Math.cos(v), r * Math.sin(v), u], first: [0, 0, L], second: [0, 0, 0] },
        };
      },
    );
    const made: { chain: IAutoMovieLoftChain; length: number } | null =AutoMovieSolidBlendChain.strip("strip", columns, [1, 0, 0]);
    const strip: IAutoMovieSolidSurface | null = made === null ? null : AutoMovieSolidChain.surface(made.chain);
    if (made === null || strip === null) failures.push("carried: no strip");
    else {
      const carried: IAutoMovieConstructionBandEdge | string = AutoMovieConstructionSplitEdge.carried(strip, made.length, cylinder, one.at, childPhases);
      if (typeof carried === "string") failures.push(`carried: ${carried}`);
      else {
        const L: number = made.length;
        const offRail = (s: IAutoMovieSolidSurface, c: number): number => {
          const p: readonly number[] = s.jet(L, c).p;
          const u: number = 12 - r * Math.tan(t) * Math.cos(c);
          return Math.hypot(p[0]! - r * Math.cos(c), p[1]! - r * Math.sin(c), p[2]! - u);
        };
        let [red, green, start, cross, inverse]: [number, number, number, number, number] = [0, 0, 0, 0, 0];
        for (let k: number = 0; k < 64; ++k) {
          const c: number = (turn * (k + (k % 2 === 0 ? 0.5 : 0.25))) / 64;
          red = Math.max(red, offRail(strip, c));
          green = Math.max(green, offRail(carried.surface, c));
          const [s0, c0]: [IAutoMovieSolidSurface.IJet, IAutoMovieSolidSurface.IJet] = [strip.jet(0, c), carried.surface.jet(0, c)];
          const [s1, c1]: [IAutoMovieSolidSurface.IJet, IAutoMovieSolidSurface.IJet] = [strip.jet(L, c), carried.surface.jet(L, c)];
          start = Math.max(start, Math.hypot(s0.p[0] - c0.p[0], s0.p[1] - c0.p[1], s0.p[2] - c0.p[2]));
          cross = Math.max(cross, Math.hypot(s0.u[0] - c0.u[0], s0.u[1] - c0.u[1], s0.u[2] - c0.u[2]), Math.hypot(s1.u[0] - c1.u[0], s1.u[1] - c1.u[1], s1.u[2] - c1.u[2]));
          inverse = Math.max(inverse, Math.abs(carried.clock(carried.rail(c)[1]) - c));
        }
        if (!(red > 1e-5)) failures.push(`red control: the column strip's end edge stands only ${red} mm off the rail between columns`);
        if (!(green <= 1e-9)) failures.push(`carried: the end edge stands ${green} mm off the rail between columns`);
        if (!(start <= 1e-9 && cross <= 1e-9)) failures.push(`carried: the start edge moved by ${start} mm and the cross derivatives by ${cross}`);
        if (!(inverse <= 1e-9)) failures.push(`carried: clock and rail invert each other within ${inverse} rad`);
      }

      const clustered: number[] = childPhases.map(
        (v, k): number => k === 1 ? v + (0.99 * turn) / n : v,
      );
      const unconstrained = AutoMovieConstructionPortField.periodic(
        clustered.map((v, k): number => v - childPhases[k]!),
      );
      if (!(unconstrained.slopes[0] < -1))
        failures.push("control columns do not expose the periodic cubic reversal");
      const advancing = AutoMovieConstructionSplitEdge.carried(
        strip, made.length, cylinder, one.at, clustered,
      );
      if (typeof advancing === "string") failures.push(`directed uneven columns: ${advancing}`);
      else {
        let previous: number = advancing.rail(0)[1];
        for (let k: number = 1; k <= 8 * n; ++k) {
          const clock: number = (turn * k) / (8 * n);
          const phase: number = advancing.rail(clock)[1];
          if (!(phase > previous)) failures.push(`phase reverses at ${clock} rad`);
          if (k % 8 === 0 && Math.abs(phase - (clustered[k / 8] ?? turn)) > 1e-12)
            failures.push(`phase left the source column at ${clock} rad`);
          previous = phase;
        }
      }
      const reversed: number[] = [...clustered];
      reversed[1] = clustered[2]! + (turn / n) / 10;
      if (typeof AutoMovieConstructionSplitEdge.carried(strip, made.length, cylinder, one.at, reversed) !== "string")
        failures.push("a reversed source column was accepted by a phase interpolation");
    }
  }

  if (failures.length !== 0) throw new Error("test_construction_skin_cut:\n" + failures.join("\n"));
}
