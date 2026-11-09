import { AutoMovieMeshExtract as X } from "@automovie/engine";

/**
 * A made 40 mm cube centred on the origin: eight vertices at +-20 mm, each
 * face split into two triangles along a diagonal.
 */
function cube(): X.IMesh {
  const positions: number[] = [];
  for (let i: number = 0; i < 8; ++i) positions.push(i & 1 ? 20 : -20, i & 2 ? 20 : -20, i & 4 ? 20 : -20);
  const indices: number[] = [];
  for (const [p, q, r, s] of [
    [0, 2, 6, 4],
    [1, 3, 7, 5],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [0, 1, 3, 2],
    [4, 5, 7, 6],
  ] as const)
    indices.push(p, q, r, p, r, s);
  return { positions, indices };
}

/**
 * A made elliptic cylinder along +Y, semi-axes 30 mm in X and 20 mm in Z, 64
 * sides, rings every 10 mm from y = 0 to 100 mm, sides triangulated; with an
 * optional gap (the side quad at side `k` between rings `r` and `r + 1`
 * removed) and spike (ring `r`'s vertex at side 0 pushed to x = 40 mm).
 */
function cylinder(options: { gap?: [number, number]; spike?: number } = {}): X.IMesh {
  const n: number = 64;
  const positions: number[] = [];
  for (let r: number = 0; r <= 10; ++r)
    for (let k: number = 0; k < n; ++k) positions.push(k === 0 && r === options.spike ? 40 : 30 * Math.cos((2 * Math.PI * k) / n), 10 * r, 20 * Math.sin((2 * Math.PI * k) / n));
  const indices: number[] = [];
  for (let r: number = 0; r < 10; ++r)
    for (let k: number = 0; k < n; ++k) {
      if (options.gap !== undefined && options.gap[0] === r && options.gap[1] === k) continue;
      const a: number = r * n + k;
      const b: number = r * n + ((k + 1) % n);
      indices.push(a, b, a + n, b, b + n, a + n);
    }
  return { positions, indices };
}

/**
 * The exact plane cut of a mesh reproduces its section and flags its holes
 * and spikes.
 *
 * Scenarios:
 * 1. Cube: a made 40 mm cube cut at y = 5 mm gives one closed loop whose every point lies on the 40 mm square (the larger in-plane coordinate's magnitude is 20 mm), holding the four corners, with shoelace area 1600 mm^2, extremes 20 mm along +-a and +-b and 20 sqrt 2 mm along the diagonals, and no flag. Red: a loop missing, open, off the square, or a corner lost.
 * 2. Cylinder: a made 30 by 20 mm elliptic cylinder cut at y = 37.5 mm (inside its side triangles) reads extremes 30, 30, 20, 20 mm along +-X and +-Z, each point on the plane, a quarter-diagonal reach within the 64-gon's sag of the ellipse's support `sqrt((30^2 + 20^2) / 2)`, and one closed 64-point loop. A station above the mesh reads no section.
 * 3. Flags: the sound cylinder cut between and on its rings flags nothing; with one side quad removed between y = 20 and 30 mm only the station at 25 is flagged open, its loop an open chain; with one vertex of the y = 50 ring pushed from 30 to 40 mm the stations at 45 and 55 are flagged `jump +b`. Red: the gap or the spike kept unflagged.
 * 4. Outer boundary: a 40 mm tube slit over its height (an 11.7 mm chord) around a separate 10 mm tube gives one closed outer boundary, every point outside 39 mm, with exactly one bridged gap equal to the slit's chord and nothing unclosed; with a 5 mm bridge the slit stays open (flagged unclosed) and only the inner tube remains outer. Red: no outer boundary, the inner tube kept, or the gap unflagged.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `outline` of `AutoMovieMeshExtract` on made cube and cylinder meshes and reads the loops, extremes and flags.
 * @evidence contracts/testing.md#independent-expectations The cube's section at any height between its faces is the 40 mm square, so its loop lies on `max(|a|, |b|) = 20`, holds the corners and has area 1600; the cylinder's vertices stand on the ellipse at the axis angles, so the extremes are its semi-axes, and its diagonal support is `sqrt((a^2 + b^2) / 2)` less at most the chord sag `a (1 - cos(pi / 64))`; the slit's ends are the vertices bounding the removed quads, so its gap is their chord `2 * 40 sin(3 pi / 64)`.
 * @evidence contracts/testing.md#distinguishing-cases A plane through the mesh and one off it; a face split by a diagonal (three crossings per face) against plain ring faces; sound, gapped and spiked meshes; stations between and on rings; a slit within and beyond the bridge, and an enclosed piece against the outer one.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include geometry_extract_outline`, on made meshes with no person, reference file, loft or browser.
 */
export function test_geometry_extract_outline(): void {
  const failures: string[] = [];
  const near = (v: number, w: number, tol: number): boolean => Math.abs(v - w) <= tol;
  const frame: X.IFrame = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };

  // 1. Cube.
  const [square] = X.outline(cube(), frame, [5], 1);
  if (square === undefined || square.extremes === null || square.loops.length !== 1 || !square.loops[0]!.closed) failures.push(`the cube's cut is not one closed loop: ${JSON.stringify(square?.loops.map((l: X.ILoop): [number, boolean] => [l.points.length, l.closed]))}`);
  else {
    const points: [number, number][] = square.loops[0]!.points;
    const off: [number, number][] = points.filter((p: [number, number]): boolean => !near(Math.max(Math.abs(p[0]), Math.abs(p[1])), 20, 1e-9));
    if (off.length !== 0) failures.push(`cube loop points off the square: ${JSON.stringify(off)}`);
    for (const corner of [
      [20, 20],
      [20, -20],
      [-20, 20],
      [-20, -20],
    ] as const)
      if (!points.some((p: [number, number]): boolean => near(p[0], corner[0], 1e-9) && near(p[1], corner[1], 1e-9))) failures.push(`the cube's corner ${corner.join(", ")} is missing`);
    let area: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const p: [number, number] = points[i]!;
      const q: [number, number] = points[(i + 1) % points.length]!;
      area += (p[0] * q[1] - q[0] * p[1]) / 2;
    }
    if (!near(Math.abs(area), 1600, 1e-6)) failures.push(`the cube's loop encloses ${area} mm^2`);
    const e: NonNullable<X.ISection["extremes"]> = square.extremes;
    for (const name of ["+a", "-a", "+b", "-b"] as const) if (!near(e[name].reach, 20, 1e-9)) failures.push(`cube extreme ${name} ${e[name].reach}`);
    for (const name of ["+a+b", "+a-b", "-a+b", "-a-b"] as const) if (!near(e[name].reach, 20 * Math.SQRT2, 1e-9)) failures.push(`cube diagonal ${name} ${e[name].reach}`);
    if (square.flags.length !== 0) failures.push(`the cube's cut is flagged: ${square.flags.join("; ")}`);
  }

  // 2. Cylinder.
  const [section, missed] = X.outline(cylinder(), frame, [37.5, 150], 1);
  if (section === undefined || section.extremes === null) failures.push("the plane through the cylinder reads no section");
  else {
    const e: NonNullable<X.ISection["extremes"]> = section.extremes;
    // Axis 1's in-plane axes: a = axes[2] (Z), b = axes[0] (X).
    if (!(near(e["+b"].reach, 30, 1e-9) && near(e["-b"].reach, 30, 1e-9) && near(e["+a"].reach, 20, 1e-9) && near(e["-a"].reach, 20, 1e-9))) failures.push(`axis extremes ${e["+b"].reach}, ${e["-b"].reach}, ${e["+a"].reach}, ${e["-a"].reach}`);
    if (!Object.values(e).every((x: X.IExtreme): boolean => near(x.point[1], 37.5, 1e-9))) failures.push("an extreme point is off the section plane");
    const support: number = Math.sqrt((30 * 30 + 20 * 20) / 2);
    const sag: number = 30 * (1 - Math.cos(Math.PI / 64));
    for (const name of ["+a+b", "+a-b", "-a+b", "-a-b"] as const)
      if (!(e[name].reach <= support + 1e-9 && e[name].reach >= support - sag)) failures.push(`diagonal ${name} reach ${e[name].reach}, ellipse support ${support}`);
    // Each side quad's two triangles cross on two vertical edges and the diagonal: 128 crossings, all distinct.
    if (!(section.loops.length === 1 && section.loops[0]!.closed && section.loops[0]!.points.length === 128)) failures.push(`the cylinder's cut loops ${JSON.stringify(section.loops.map((l: X.ILoop): [number, boolean] => [l.points.length, l.closed]))}`);
    if (section.flags.length !== 0) failures.push(`a sound section is flagged: ${section.flags.join("; ")}`);
  }
  if (missed === undefined || missed.extremes !== null || missed.count !== 0 || missed.loops.length !== 0) failures.push("a station above the mesh reads a section");

  // 3. Flags.
  const mid: number[] = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  const flagged = (sections: X.ISection[]): number[] => sections.filter((s: X.ISection): boolean => s.flags.length !== 0).map((s: X.ISection): number => s.station);
  const sound: number[] = flagged(X.outline(cylinder(), frame, [...mid, 20, 30, 40], 1));
  if (sound.length !== 0) failures.push(`a sound cylinder flags stations ${sound.join(", ")}`);
  const gap: X.ISection[] = X.outline(cylinder({ gap: [2, 10] }), frame, mid, 1);
  const holed: X.ISection | undefined = gap.find((s: X.ISection): boolean => s.station === 25);
  if (holed === undefined || !holed.flags.some((f: string): boolean => f.startsWith("open")) || flagged(gap).some((s: number): boolean => s !== 25)) failures.push(`a gap between y = 20 and 30 flags ${JSON.stringify(gap.map((s: X.ISection): [number, string[]] => [s.station, s.flags]).filter((e: [number, string[]]): boolean => e[1].length !== 0))}`);
  if (holed !== undefined && !(holed.loops.length === 1 && !holed.loops[0]!.closed)) failures.push(`the gapped cut's loops ${JSON.stringify(holed.loops.map((l: X.ILoop): [number, boolean] => [l.points.length, l.closed]))}`);
  const spike: X.ISection[] = X.outline(cylinder({ spike: 5 }), frame, mid, 1);
  for (const station of [45, 55])
    if (!spike.some((s: X.ISection): boolean => s.station === station && s.flags.some((f: string): boolean => f.startsWith("jump +b")))) failures.push(`the spike at y = 50 is kept unflagged at station ${station}`);

  // 4. Outer boundary: a 40 mm tube along Y with a slit (its side quads 0, 1
  // and 2 removed over the whole height, so the cut's chain ends at vertices
  // 3 and 0, a chord 2 * 40 sin(3 pi / 64) apart) around a separate 10 mm tube.
  const slit: { positions: number[]; indices: number[] } = { positions: [], indices: [] };
  for (const [radius, skip] of [
    [40, 3],
    [10, 0],
  ] as const) {
    const base: number = slit.positions.length / 3;
    for (let r: number = 0; r <= 10; ++r) for (let k: number = 0; k < 64; ++k) slit.positions.push(radius * Math.cos((2 * Math.PI * k) / 64), 10 * r, radius * Math.sin((2 * Math.PI * k) / 64));
    for (let r: number = 0; r < 10; ++r)
      for (let k: number = skip; k < 64; ++k) {
        const a: number = base + r * 64 + k;
        const b: number = base + r * 64 + ((k + 1) % 64);
        slit.indices.push(a, b, a + 64, b, b + 64, a + 64);
      }
  }
  const chord: number = 2 * 40 * Math.sin((3 * Math.PI) / 64);
  const [ring] = X.outline(slit, frame, [35], 1);
  const bridged: string[] = ring?.flags.filter((f: string): boolean => f.startsWith("bridged")) ?? [];
  if (ring === undefined || ring.outer.length !== 1 || !ring.outer[0]!.closed) failures.push(`the slit ring's outer boundaries ${JSON.stringify(ring?.outer.map((l: X.ILoop): number => l.points.length))}`);
  else if (!ring.outer[0]!.points.every((p: [number, number]): boolean => Math.hypot(p[0], p[1]) > 39)) failures.push("the slit ring's outer boundary holds a point of the inner tube");
  if (!(bridged.length === 1 && Math.abs(Number.parseFloat(bridged[0]!.slice("bridged: ".length)) - chord) <= 1e-3)) failures.push(`the slit ring's bridged gaps ${JSON.stringify(bridged)}, the slit chord ${chord}`);
  if (ring !== undefined && ring.flags.some((f: string): boolean => f.startsWith("unclosed"))) failures.push(`the slit ring is left unclosed: ${ring.flags.join("; ")}`);
  const [narrow] = X.outline(slit, frame, [35], 1, 0.5, 5);
  if (narrow === undefined || narrow.outer.length !== 1 || Math.hypot(narrow.outer[0]!.points[0]![0], narrow.outer[0]!.points[0]![1]) > 11 || !narrow.flags.some((f: string): boolean => f.startsWith("unclosed: 1"))) failures.push(`a 5 mm bridge over the 11.7 mm slit gives ${JSON.stringify(narrow?.outer.map((l: X.ILoop): number => l.points.length))}, flags ${narrow?.flags.join("; ")}`);
  if (failures.length !== 0) throw new Error(`${failures.length} outline failures:\n${failures.join("\n")}`);
}
