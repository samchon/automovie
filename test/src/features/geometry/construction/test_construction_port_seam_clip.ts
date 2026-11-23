import type {
  IAutoMovieSolidAtlas,
  IAutoMovieSolidBody,
  IAutoMovieSolidClip,
  IAutoMovieSolidCycle,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import {
  AutoMovieSolidBody,
  AutoMovieSolidClip,
  AutoMovieSolidMesh,
} from "@automovie/engine";

type V3 = [number, number, number];

/** Radius of the made seam, mm. */
const R: number = 8;

/** Columns of the made seam. */
const N: number = 16;

/**
 * A seam one owner supplies to two faces stays that owner's curve, segment by segment, after a cut is clipped across it.
 *
 * Fixture (mm, radians): the host is the plane `z = 0` in its own coordinates; the band is the tube `(8 cos v, 8 sin v, u)` of period
 * `2 pi` standing on it. Their seam is the circle of radius 8: the host's hole is the 16-gon inscribed in it, whose owner's readers keep
 * the points at radius 8 or more and map a point to the band at station 0 and its polar angle; the band's start cycle is its station-0
 * line, whose reader maps a clock to the circle's point. A made rail of eight points crosses the seam at the clocks `pi / 16 -+ 0.1`,
 * inside column 0: three points on the host at radii 9, 9.5 and 9, three on the band at stations 1, 1.5 and 1.
 *
 * Scenarios, each read on the body's atlas before the clip and after it:
 * 1. A point between the 16-gon's side and the circle at mid-column 5.5 is not kept by the host, and one just past the circle is.
 * 2. A point inside the circle at clock `2 pi 5.3 / 16` crosses to the band at station 0 and that clock; a point before the band's
 *    start at that clock crosses to the circle's point there; from just inside that point the host crosses back to the same clock.
 * 3. After the clip only: the host's hole holds 21 vertices with 15 exact segments, the 15 sides the cut left whole; a point inside
 *    the cut's footprint on the host is not kept and crosses to the cut's own face; a point between the chord from column 0 to the
 *    first crossing and the circle is kept, as that chord reads it; the band keeps station 0.5 at mid-column 5.5 and not under the cut.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a body with `AutoMovieSolidBody.create`, clips it with `AutoMovieSolidClip.trim` and reads `AutoMovieSolidBody.atlas`. It catches a clip that drops the owner's readers from a rebuilt cycle, a kept test or crossing map that reads chords on a segment the cut never touched, a map that is not its own inverse across the seam, and a cut's own segments read as the owner's curve.
 * @evidence contracts/development/testing.md#independent-expectations The seam is a circle, so the kept side is a radius compared with 8 and the correspondence is the polar angle; the chord's affine share at 0.3 of a column differs from that angle by 8.5e-4 rad, far above the 1e-12 limit, which is rounding of `atan2`, `cos` and `sin`. The vertex and segment counts are 16 sides less the one cut, plus two crossings and three run points.
 * @evidence contracts/development/testing.md#distinguishing-cases The same readings before the clip (the cycle as built), on a column the cut left whole, on the piece of the column the cut split and inside the cut's footprint; both directions across the seam. `test_construction_port_seam` owns a realized port's seams and a traced second cutter.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_port_seam_clip`, on in-memory made faces with no realization, process or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the fixture, the three numbered scenarios and the closed forms each is read against.
 */
export function test_construction_port_seam_clip(): void {
  const failures: string[] = [];
  const clock = (k: number): number => (2 * Math.PI * k) / N;
  const on = (r: number, c: number): [number, number] => [r * Math.cos(c), r * Math.sin(c)];
  const flat = (p: V3, u: V3, v: V3, vv: V3 = [0, 0, 0]): IAutoMovieSolidSurface.IJet => ({ p, u, v, uu: [0, 0, 0], uv: [0, 0, 0], vv });
  const host: IAutoMovieSolidSurface = {
    name: "host",
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => flat([u, v, 0], [1, 0, 0], [0, 1, 0]),
  };
  const band: IAutoMovieSolidSurface = {
    name: "band",
    orientation: 1,
    period: 2 * Math.PI,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet =>
      flat([...on(R, v), u], [0, 0, 1], [-R * Math.sin(v), R * Math.cos(v), 0], [-R * Math.cos(v), -R * Math.sin(v), 0]),
  };
  const cut: IAutoMovieSolidSurface = { ...host, name: "cut" };
  const grid: { stations: number[]; phases: number[] } = { stations: [0, 1], phases: [0, 1] };
  const body: IAutoMovieSolidBody.IBody = AutoMovieSolidBody.create("made", [
    { surface: host, ...grid },
    { surface: band, ...grid },
    { surface: cut, ...grid },
  ]);
  const [HOST, BAND, CUT]: [number, number, number] = [0, 1, 2];
  const vertex = (surface: IAutoMovieSolidSurface, c: [number, number]): number =>
    AutoMovieSolidMesh.vertex(body.mesh, surface.jet(c[0], c[1]).p, AutoMovieSolidMesh.owner(body.mesh, surface), c[0], c[1]);

  // The seam as its owner supplies it to both faces.
  const hole: number[] = Array.from({ length: N }, (_: unknown, k: number): number => vertex(host, on(R, clock(k))));
  body.faces[HOST]!.cycles.push({
    kind: "hole",
    vertices: hole,
    chart: hole.map((_: number, k: number): [number, number] => on(R, clock(k))),
    neighbours: hole.map((_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({ face: BAND, from: [0, clock(k)], to: [0, clock(k + 1)] })),
    exact: {
      count: N,
      kept: (u: number, v: number): boolean => Math.hypot(u, v) >= R,
      across: (u: number, v: number): [number, number] => [0, (Math.atan2(v, u) + 2 * Math.PI) % (2 * Math.PI)],
    },
  });
  body.faces[BAND]!.cycles.push({
    kind: "start",
    vertices: hole.slice(),
    chart: hole.map((_: number, k: number): [number, number] => [0, clock(k)]),
    neighbours: hole.map((_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({ face: HOST, from: on(R, clock(k)), to: on(R, clock(k + 1)) })),
    exact: { count: N, across: (_: number, v: number): [number, number] => on(R, v) },
  });

  /** Scenarios 1 and 2, which hold on the cycle as built and must still hold on a column the cut left whole. */
  const seam = (label: string): void => {
    const atlas: IAutoMovieSolidAtlas = AutoMovieSolidBody.atlas(body).atlas;
    const lens: [number, number] = on((R * (1 + Math.cos(Math.PI / N))) / 2, clock(5.5));
    if (atlas.kept(HOST, lens[0], lens[1])) failures.push(`${label}: the host keeps a point between the 16-gon's side and the circle at mid-column 5.5`);
    const past: [number, number] = on(R + 2 ** -10, clock(5.5));
    if (!atlas.kept(HOST, past[0], past[1])) failures.push(`${label}: the host does not keep a point just past the circle at mid-column 5.5`);

    const c: number = clock(5.3);
    const inside: [number, number] = on(R * (1 - 2 ** -10), c);
    const there: ReturnType<IAutoMovieSolidAtlas["across"]> = atlas.across(HOST, inside[0], inside[1]);
    if (there === null || there.face !== BAND || !(Math.abs(there.u) <= 1e-12 && Math.abs(there.v - c) <= 1e-12))
      failures.push(`${label}: a point inside the circle at clock ${c} crosses to ${JSON.stringify(there)}, not to the band's start at that clock`);
    const back: ReturnType<IAutoMovieSolidAtlas["across"]> = atlas.across(BAND, -0.5, c);
    const foot: [number, number] = on(R, c);
    if (back === null || back.face !== HOST || !(Math.hypot(back.u - foot[0], back.v - foot[1]) <= 1e-12))
      failures.push(`${label}: a point before the band's start at clock ${c} crosses to ${JSON.stringify(back)}, not to the circle's point there`);
    else {
      const again: ReturnType<IAutoMovieSolidAtlas["across"]> = atlas.across(HOST, back.u * (1 - 2 ** -10), back.v * (1 - 2 ** -10));
      if (again === null || again.face !== BAND || !(Math.abs(again.u) <= 1e-12 && Math.abs(again.v - c) <= 1e-12))
        failures.push(`${label}: across the seam and back from clock ${c} arrives at ${JSON.stringify(again)}`);
    }
  };
  seam("as built");

  // The made rail: two crossings inside column 0, three points on the host between them and three on the band.
  const [alpha, middle, beta]: [number, number, number] = [Math.PI / N - 0.1, Math.PI / N, Math.PI / N + 0.1];
  const outward: [number, number] = on(1, middle);
  const single = (face: number, surface: IAutoMovieSolidSurface, c: [number, number], across: [number, number]): IAutoMovieSolidClip.IRailPoint =>
    ({ vertex: vertex(surface, c), phase: 0, faces: [face], chart: new Map([[face, c]]), across });
  const crossing = (c: number): IAutoMovieSolidClip.IRailPoint =>
    ({ vertex: vertex(host, on(R, c)), phase: 0, faces: [HOST, BAND], chart: new Map([[HOST, on(R, c)], [BAND, [0, c]]]) });
  const rail: IAutoMovieSolidClip.IRailPoint[] = [
    crossing(alpha),
    single(HOST, host, on(R + 1, alpha), outward),
    single(HOST, host, on(R + 1.5, middle), outward),
    single(HOST, host, on(R + 1, beta), outward),
    crossing(beta),
    single(BAND, band, [1, beta], [1, 0]),
    single(BAND, band, [1.5, middle], [1, 0]),
    single(BAND, band, [1, alpha], [1, 0]),
  ];
  rail.forEach((p: IAutoMovieSolidClip.IRailPoint, k: number): void => void (p.phase = (2 * Math.PI * k) / rail.length));
  const clipped: string | null = AutoMovieSolidClip.trim(body, rail, CUT, "hole");
  if (clipped !== null) failures.push(`the made rail was not clipped: ${clipped}`);
  else {
    seam("after the clip");

    // 3. The clip's own bookkeeping and segments.
    const trimmed: IAutoMovieSolidCycle.ICycle = body.faces[HOST]!.cycles[0]!;
    const exact: number = (trimmed.segments ?? []).filter((s: IAutoMovieSolidCycle.IExactSegment | null): boolean => s !== null).length;
    if (trimmed.vertices.length !== N + 5 || trimmed.segments?.length !== N + 5 || exact !== N - 1)
      failures.push(`the host's hole holds ${trimmed.vertices.length} vertices, ${trimmed.segments?.length} segment records and ${exact} exact segments; 21, 21 and 15 are due`);
    const atlas: IAutoMovieSolidAtlas = AutoMovieSolidBody.atlas(body).atlas;
    const footprint: [number, number] = on(R + 0.5, middle);
    const out: ReturnType<IAutoMovieSolidAtlas["across"]> = atlas.across(HOST, footprint[0], footprint[1]);
    if (atlas.kept(HOST, footprint[0], footprint[1]) || out === null || out.face !== CUT)
      failures.push(`a point inside the cut's footprint on the host is kept or crosses to ${JSON.stringify(out)}, not to the cut's face`);
    const piece: [number, number] = on((R * (1 + Math.cos(alpha / 2))) / 2, alpha / 2);
    if (!atlas.kept(HOST, piece[0], piece[1]))
      failures.push("a point between the circle and the chord from column 0 to the first crossing is not kept, though that chord is the clip's own segment");
    if (!atlas.kept(BAND, 0.5, clock(5.5)) || atlas.kept(BAND, 0.5, middle))
      failures.push("the band does not keep station 0.5 at mid-column 5.5, or keeps it under the cut");
  }
  if (failures.length !== 0) throw new Error(`${failures.length} clipped seam failures:\n${failures.join("\n")}`);
}
