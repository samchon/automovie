import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEyeGlobe } from "./AutoMovieHumanEyeGlobe";
import { AutoMovieHumanEyelid } from "./AutoMovieHumanEyelid";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Apertures applied to the lofted body: refined stations, the cut, and the
 * lids built onto the eyeball.
 *
 * See {@link AutoMovieHumanLoftAperture} for the representation. This module
 * applies it by position only, so an aperture works on whichever chain the
 * opening falls in, horizontal or tilted, including chains owned by other
 * regions.
 *
 * Two kinds of opening are cut. An eye opening, whose margin is the lid
 * contact line on a globe (see {@link AutoMovieHumanEyelid}), loses the
 * skin out to a band around the margin, and the band is rebuilt as the lid
 * itself: the anterior lid surface continuing the skin, a rounded anterior
 * edge, the lid margin face back to the posterior edge resting on the
 * globe, and a tuck into the globe. Any other opening, such as a nostril,
 * loses the skin over its margin and gets a closed pocket of its own
 * `pocket` depth.
 */
export namespace AutoMovieHumanBodyApertures {
  /** An aperture with its margin and projected cut outline evaluated once. */
  export interface IPrepared {
    /** Aperture data. */
    aperture: IAutoMovieHumanLoftAperture;

    /**
     * Projected outline of the cut: the margin itself, or for an eye the
     * outer edge of the lid band around it.
     */
    outline: AutoMovieHumanLoftAperture.IOutline;

    /**
     * Lid of an eye opening: the calibrated eye nearest the margin's centre
     * lies behind it; null for any other opening.
     */
    lid: AutoMovieHumanEyelid.ILid | null;
  }

  /** Open edge of the cut skin, directed as its triangle winds it. */
  interface IEdge {
    /** Start vertex. */
    u: number;

    /** End vertex. */
    v: number;

    /** Group of the triangle the edge bounds. */
    name: string;
  }

  /** Station spacing where a chain's rings pass near an opening, mm. */
  const SPACING: number = 0.5;

  /** Distance around an opening's outline that still counts as near, mm. */
  const REACH: number = 2;

  /**
   * Reach of the lid's tuck under the lid from the posterior edge, mm.
   * The tuck stands for the conjunctiva lining the lid; any line of sight
   * past the posterior edge meets the globe first, so the tuck only has to
   * reach inside it.
   */
  const TUCK: number = 1.5;

  /**
   * Anterior-surface rows of the lid band, as fractions of the way from
   * the band's outer edge to the start of the rim's rounding.
   */
  const ROWS: readonly number[] = [0.18, 0.36, 0.52, 0.66, 0.78, 0.88, 1];

  /**
   * Radius of the anterior edge's rounding as a fraction of the margin
   * depth: a rounded lid edge, not a knife cut.
   */
  const ROUNDING: number = 0.4;

  /**
   * Evaluate each aperture's margin once and find the globe behind it.
   *
   * @param apertures Calibrated openings.
   * @param eyes Calibrated eye spheres.
   */
  export function prepare(
    apertures: readonly IAutoMovieHumanLoftAperture[],
    eyes: readonly IAutoMovieHumanBodyCalibration.IEye[],
  ): IPrepared[] {
    return apertures.map((aperture: IAutoMovieHumanLoftAperture): IPrepared => {
      const margin: AutoMovieHumanLoftAperture.Point[] =
        AutoMovieHumanLoftAperture.polyline(aperture);

      // A globe belongs to the opening whose margin centre lies within its
      // radius plus a margin of half that again.
      const centre: number[] = [0, 1, 2].map(
        (axis: number): number =>
          margin.reduce(
            (sum: number, p: AutoMovieHumanLoftAperture.Point): number =>
              sum + p[axis]!,
            0,
          ) / margin.length,
      );
      let globe: IAutoMovieHumanBodyCalibration.IEye | null = null;
      let best: number = Infinity;
      for (const eye of eyes) {
        const d: number = Math.hypot(
          eye.centre[0] - centre[0]!,
          eye.centre[1] - centre[1]!,
          eye.centre[2] - centre[2]!,
        );
        if (d < 1.5 * eye.radius && d < best) {
          best = d;
          globe = eye;
        }
      }
      if (globe === null)
        return {
          aperture,
          outline: AutoMovieHumanLoftAperture.outline(aperture, margin),
          lid: null,
        };

      // An eye is cut out to the lid band's outer edge.
      const lid: AutoMovieHumanEyelid.ILid = AutoMovieHumanEyelid.create(
        aperture,
        globe,
      );
      return {
        aperture,
        outline: AutoMovieHumanLoftAperture.outline(
          aperture,
          lid.samples.map(
            (
              s: AutoMovieHumanEyelid.ISample,
            ): AutoMovieHumanLoftAperture.Point =>
              AutoMovieHumanEyelid.add(
                s.contact,
                AutoMovieHumanEyelid.scale(
                  s.outward,
                  AutoMovieHumanEyelid.rule.band,
                ),
              ),
          ),
        ),
        lid,
      };
    });
  }

  /**
   * Stations refined wherever a chain's rings pass near an opening.
   *
   * An interval between consecutive stations is split into SPACING mm steps
   * when its end or middle ring has a point within REACH of an opening's
   * cut outline, so the cut is traced finely whatever the bisection chose
   * and whatever the orientation of the chain's sections.
   *
   * @param apertures Prepared openings.
   * @param target Chain being lofted.
   * @param heights Increasing stations from the bisection.
   * @param phases Probe phases, the chain's own ring phases.
   */
  export function refine(
    apertures: readonly IPrepared[],
    target: IAutoMovieHumanLoftChain,
    heights: readonly number[],
    phases: readonly number[],
  ): number[] {
    if (!apertures.length) return [...heights];
    const near = (s: number): boolean =>
      AutoMovieHumanLoftChain.ring(target, s, phases).some(
        (p: [number, number, number]): boolean =>
          apertures.some(
            (a: IPrepared): boolean =>
              AutoMovieHumanLoftAperture.signed(a.outline, p, REACH) < REACH,
          ),
      );

    const out: number[] = [heights[0]!];
    const marked: boolean[] = heights.map(near);
    for (let k: number = 0; k + 1 < heights.length; k++) {
      const a: number = heights[k]!;
      const b: number = heights[k + 1]!;
      const steps: number = Math.ceil((b - a) / SPACING);
      if (steps > 1 && (marked[k] || marked[k + 1] || near((a + b) / 2)))
        for (let i: number = 1; i < steps; i++)
          out.push(a + ((b - a) * i) / steps);
      out.push(b);
    }
    return out;
  }

  /**
   * Cut every opening out of the skin and close it: lids for eyes, pockets
   * for the rest.
   *
   * Each vertex takes the least {@link AutoMovieHumanLoftAperture.signed}
   * distance over the openings' cut outlines. Every triangle is clipped at
   * its zero level: vertices on the opening side are dropped, and each edge
   * the outline crosses gets one new vertex, snapped onto the outline and
   * shared by the two triangles of the edge, so the cut skin stays
   * connected and its open edge lies on the outline.
   *
   * The open edges of an eye form a loop on the lid band's outer edge,
   * which {@link eyelid} continues into the lid. The open edges of any other
   * opening are each joined to a copy pushed back by the aperture's
   * `pocket` depth along `forward`, and the copies' rim is closed by a fan.
   * New triangles take the group of the skin triangle on the open edge they
   * continue, so they render with the skin they belong to.
   *
   * @param mesh Skin buffers with groups; triangles counter-clockwise from
   *   outside.
   * @param apertures Prepared openings.
   */
  export function cut(
    mesh: AutoMovieHumanLoftMesh.IContext,
    apertures: readonly IPrepared[],
  ): void {
    if (!apertures.length) return;

    // Signed distance and owning opening of every original vertex.
    const count: number = mesh.positions.length / 3;
    const value: number[] = new Array<number>(count).fill(Infinity);
    const owner: number[] = new Array<number>(count).fill(-1);
    for (let v: number = 0; v < count; v++) {
      const p: AutoMovieHumanLoftAperture.Point = [
        mesh.positions[3 * v]!,
        mesh.positions[3 * v + 1]!,
        mesh.positions[3 * v + 2]!,
      ];
      apertures.forEach((a: IPrepared, i: number): void => {
        const d: number = AutoMovieHumanLoftAperture.signed(
          a.outline,
          p,
          2 * REACH,
        );
        if (d < value[v]!) {
          value[v] = d;
          owner[v] = i;
        }
      });
    }

    // Margin vertices: originals exactly on the outline, and edge
    // crossings. A crossing remembers the kept vertex of its edge, from
    // which the skin's slope across the outline is read.
    const margin: Map<number, number> = new Map();
    for (let v: number = 0; v < count; v++)
      if (value[v] === 0) margin.set(v, owner[v]!);
    const anchor: Map<number, number> = new Map();
    const crossings: Map<number, number> = new Map();
    const crossing = (p: number, q: number): number => {
      // A far vertex (infinite distance) next to the opening places the
      // crossing at the opening's side.
      const f: number = Number.isFinite(value[p]!)
        ? value[p]! / (value[p]! - value[q]!)
        : 1;
      // A crossing within rounding of an edge's end is that end, which then
      // lies on the outline.
      const side: number = owner[value[p]! < 0 ? p : q]!;
      if (f <= 1e-9) {
        margin.set(p, side);
        return p;
      }
      if (f >= 1 - 1e-9) {
        if (Number.isFinite(value[p]!)) margin.set(q, side);
        return q;
      }
      const key: number = Math.min(p, q) * count + Math.max(p, q);
      const found: number | undefined = crossings.get(key);
      if (found !== undefined) return found;
      const index: number = mesh.positions.length / 3;
      const linear: AutoMovieHumanLoftAperture.Point = [0, 1, 2].map(
        (axis: number): number =>
          mesh.positions[3 * p + axis]! +
          f * (mesh.positions[3 * q + axis]! - mesh.positions[3 * p + axis]!),
      ) as AutoMovieHumanLoftAperture.Point;
      const placed: AutoMovieHumanLoftAperture.Point =
        AutoMovieHumanLoftAperture.snap(apertures[side]!.outline, linear);
      mesh.positions.push(placed[0], placed[1], placed[2]);
      crossings.set(key, index);
      margin.set(index, side);
      anchor.set(index, value[p]! >= 0 ? p : q);
      return index;
    };

    // Clip group by group, keeping the side where the distance is not
    // negative, and fan the kept polygon.
    const indices: number[] = [];
    const groups: { name: string; start: number }[] = [];
    const faces: string[] = [];
    mesh.groups.forEach(
      (g: { name: string; start: number }, k: number): void => {
        const end: number = mesh.groups[k + 1]?.start ?? mesh.indices.length;
        groups.push({ name: g.name, start: indices.length });
        for (let t: number = g.start; t < end; t += 3) {
          const corners: number[] = [
            mesh.indices[t]!,
            mesh.indices[t + 1]!,
            mesh.indices[t + 2]!,
          ];
          const polygon: number[] = [];
          corners.forEach((p: number, i: number): void => {
            const q: number = corners[(i + 1) % 3]!;
            const keep: boolean = value[p]! >= 0;
            if (keep) polygon.push(p);
            if (keep !== value[q]! >= 0) polygon.push(crossing(p, q));
          });
          const kept: number[] = polygon.filter(
            (v: number, i: number): boolean =>
              v !== polygon[(i + polygon.length - 1) % polygon.length],
          );
          for (let i: number = 1; i + 1 < kept.length; i++) {
            indices.push(kept[0]!, kept[i]!, kept[i + 1]!);
            faces.push(g.name);
          }
        }
      },
    );

    // Open margin edges per opening: directed edges whose reverse no
    // triangle uses, with the group of their triangle.
    const directed: Set<number> = new Set();
    const total: number = mesh.positions.length / 3;
    for (let t: number = 0; t < indices.length; t += 3)
      for (let i: number = 0; i < 3; i++)
        directed.add(indices[t + i]! * total + indices[t + ((i + 1) % 3)]!);
    const open: IEdge[][] = apertures.map((): IEdge[] => []);
    for (let t: number = 0; t < indices.length; t += 3)
      for (let i: number = 0; i < 3; i++) {
        const u: number = indices[t + i]!;
        const v: number = indices[t + ((i + 1) % 3)]!;
        if (directed.has(v * total + u)) continue;
        const a: number | undefined = margin.get(u);
        if (a === undefined || a !== margin.get(v)) continue;
        open[a]!.push({ u, v, name: faces[t / 3]! });
      }

    // Close each opening, collecting its triangles by group.
    const added: Map<string, number[]> = new Map();
    const emit = (name: string, ...corners: number[]): void => {
      const list: number[] = added.get(name) ?? [];
      list.push(...corners);
      added.set(name, list);
    };
    apertures.forEach((prepared: IPrepared, a: number): void => {
      if (prepared.lid !== null)
        eyelid(
          mesh,
          indices,
          prepared,
          prepared.lid,
          open[a]!,
          anchor,
          value,
          emit,
        );
      else if (prepared.aperture.pocket! > 0)
        pocket(mesh, prepared.aperture, open[a]!, emit);
    });
    for (const [name, list] of added) {
      groups.push({ name, start: indices.length });
      indices.push(...list);
    }

    mesh.indices = indices;
    mesh.groups = groups;
  }

  /**
   * Close an opening without a globe by a pocket: every open edge is
   * joined, through POCKET_RINGS rings, to a copy pushed back by the
   * aperture's `pocket` depth, and the deepest rim is closed by a fan to
   * its centroid. The rings let the wall carry colour and shading that
   * change with depth (a single triangle from rim to floor can only blend
   * the two linearly, so a nostril's wall stayed lit), and they draw the
   * wall in toward the pocket's axis as it deepens, as a nostril narrows.
   */
  /** Rings down a pocket's wall from its rim to its floor. */
  const POCKET_RINGS: number = 4;

  /** Fraction of the way to the rim's centre a pocket's floor is drawn in. */
  const POCKET_NARROWING: number = 0.35;

  function pocket(
    mesh: AutoMovieHumanLoftMesh.IContext,
    aperture: IAutoMovieHumanLoftAperture,
    open: readonly IEdge[],
    emit: (name: string, ...corners: number[]) => void,
  ): void {
    const f: AutoMovieHumanLoftAperture.Point = aperture.forward;
    const depth: number = aperture.pocket!;

    // Centre of the opening's rim, the axis the wall narrows toward.
    const rimVertices: number[] = [
      ...new Set(open.flatMap((e: IEdge): number[] => [e.u, e.v])),
    ];
    const centre: number[] = [0, 1, 2].map(
      (axis: number): number =>
        rimVertices.reduce(
          (sum: number, v: number): number =>
            sum + mesh.positions[3 * v + axis]!,
          0,
        ) / Math.max(1, rimVertices.length),
    );

    // Ring k of a rim vertex: pushed back by depth k / POCKET_RINGS and
    // drawn toward the centre by up to POCKET_NARROWING at the floor.
    const rings: Map<number, number>[] = Array.from(
      { length: POCKET_RINGS + 1 },
      (): Map<number, number> => new Map(),
    );
    const ringOf = (v: number, k: number): number => {
      if (k === 0) return v;
      const found: number | undefined = rings[k]!.get(v);
      if (found !== undefined) return found;
      const w: number = k / POCKET_RINGS;
      const pull: number = POCKET_NARROWING * Math.sin((w * Math.PI) / 2);
      const index: number = mesh.positions.length / 3;
      for (let axis: number = 0; axis < 3; axis++) {
        const p: number = mesh.positions[3 * v + axis]!;
        mesh.positions.push(
          p + (centre[axis]! - p) * pull - f[axis]! * depth * w,
        );
      }
      rings[k]!.set(v, index);
      return index;
    };
    const rim: number[] = [];
    let first: string | null = null;
    for (const { u, v, name } of open) {
      first ??= name;
      for (let k: number = 0; k < POCKET_RINGS; k++) {
        const au: number = ringOf(u, k);
        const av: number = ringOf(v, k);
        const bu: number = ringOf(u, k + 1);
        const bv: number = ringOf(v, k + 1);
        emit(name, av, au, bu, av, bu, bv);
      }
      rim.push(ringOf(u, POCKET_RINGS), ringOf(v, POCKET_RINGS));
    }
    if (first === null) return;
    const index: number = centroid(mesh, rim);
    for (let k: number = 0; k < rim.length; k += 2)
      emit(first, rim[k + 1]!, rim[k]!, index);
  }

  /**
   * Build the lid of an eye opening from the skin's cut loop.
   *
   * The loop lies on the band's outer edge. Each lid sample is a column
   * across the band, running in projection from the band's outer edge to
   * the contact line; its rows are, in the plane of the column's outward
   * direction and the line of sight:
   *
   * 1. the anterior lid surface (ROWS), a cubic Hermite in depth from the
   *    skin's own depth and slope at the outer edge, read from the loop, to
   *    the anterior edge, kept at least `clearance` in front of the globe;
   * 2. the anterior edge rounded by a quadratic Bezier of radius ROUNDING
   *    times the margin depth;
   * 3. the margin face from the anterior edge back to the posterior edge,
   *    which rests on the globe (the contact sample);
   * 4. the tuck: TUCK straight back from the posterior edge into the
   *    globe, or toward its silhouette behind its centre where the margin
   *    runs past it, as at the canthi; the tucks' rim is closed by a fan
   *    inside the globe.
   *
   * The loop and the first row are joined by a zipper ordered by phase,
   * because the skin's loop vertices are wherever the skin's triangles
   * crossed the outline; consecutive rows are joined by quads. The rows
   * follow the loop's direction, so every new triangle continues the
   * skin's counter-clockwise winding, and each column takes the group of
   * the loop edge it continues.
   */
  function eyelid(
    mesh: AutoMovieHumanLoftMesh.IContext,
    skin: readonly number[],
    prepared: IPrepared,
    lid: AutoMovieHumanEyelid.ILid,
    open: readonly IEdge[],
    anchor: Map<number, number>,
    value: readonly number[],
    emit: (name: string, ...corners: number[]) => void,
  ): void {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const edges: IEdge[] = circuit(open);
    if (edges.length < 8) return;
    const loop: number[] = edges.map((e: IEdge): number => e.u);
    const samples: AutoMovieHumanEyelid.ISample[] = lid.samples;
    const n: number = samples.length;
    const g: AutoMovieHumanEyelid.IGlobe = lid.globe;
    const at = (v: number): AutoMovieHumanEyelid.Point => [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
    const depth = (p: Readonly<AutoMovieHumanEyelid.Point>): number =>
      E.dot(E.sub(p, g.centre), g.forward);

    // Phase of each loop vertex: the nearest point of the band's outer
    // edge, as a fractional sample index.
    const outer: [number, number][] = prepared.outline.points;
    const phase: number[] = loop.map((v: number): number => {
      const q: [number, number] = [
        E.dot(at(v), prepared.outline.lateral),
        E.dot(at(v), prepared.outline.up),
      ];
      let best: number = Infinity;
      let found: number = 0;
      for (let j: number = 0; j < n; j++) {
        const a: [number, number] = outer[j]!;
        const b: [number, number] = outer[(j + 1) % n]!;
        const du: number = b[0] - a[0];
        const dv: number = b[1] - a[1];
        const l: number = du * du + dv * dv;
        const w: number =
          l > 0
            ? Math.min(
                1,
                Math.max(0, ((q[0] - a[0]) * du + (q[1] - a[1]) * dv) / l),
              )
            : 0;
        const d: number =
          (a[0] + w * du - q[0]) ** 2 + (a[1] + w * dv - q[1]) ** 2;
        if (d < best) {
          best = d;
          found = j + w;
        }
      }
      return found;
    });

    // Unwrapped phases along the loop, increasing in the loop's direction:
    // `sign` is +1 when the loop runs with the samples.
    const wrap = (d: number): number => d - n * Math.round(d / n);
    let turn: number = 0;
    for (let i: number = 0; i < loop.length; i++)
      turn += wrap(phase[(i + 1) % loop.length]! - phase[i]!);
    const sign: number = turn >= 0 ? 1 : -1;
    const lambda: number[] = [sign * phase[0]!];
    for (let i: number = 1; i <= loop.length; i++)
      lambda.push(
        lambda[i - 1]! + sign * wrap(phase[i % loop.length]! - phase[i - 1]!),
      );

    // Skin depth and outward slope at each loop vertex; the slope is the
    // depth change toward the kept vertex of the crossed edge per unit of
    // its distance outside the outline. Both are smoothed along the loop.
    const raw: { x: number; k: number }[] = loop.map(
      (v: number): { x: number; k: number } => {
        const x: number = depth(at(v));
        const p: number | undefined = anchor.get(v);
        if (p === undefined || !(value[p]! > 0.2)) return { x, k: NaN };
        return { x, k: (depth(at(p)) - x) / value[p]! };
      },
    );
    const smooth: { x: number; k: number }[] = raw.map(
      (_: { x: number; k: number }, i: number): { x: number; k: number } => {
        let sx: number = 0;
        let sk: number = 0;
        let wx: number = 0;
        let wk: number = 0;
        for (let d: number = -4; d <= 4; d++) {
          const r: { x: number; k: number } =
            raw[(i + d + loop.length) % loop.length]!;
          const w: number = Math.exp(-((d / 2) ** 2));
          sx += w * r.x;
          wx += w;
          if (Number.isFinite(r.k)) {
            sk += w * r.k;
            wk += w;
          }
        }
        return { x: sx / wx, k: wk > 0 ? sk / wk : 0 };
      },
    );

    // Columns in loop order: the first sample at or after the loop's start.
    const start: number = Math.ceil(lambda[0]!);
    const column = (k: number): number => (((sign * (start + k)) % n) + n) % n;

    // Skin depth and slope at each column, interpolated along the loop.
    const outerSkin: { x: number; k: number }[] = new Array(n);
    {
      let i: number = 0;
      for (let k: number = 0; k < n; k++) {
        const l: number = start + k;
        while (i + 1 < loop.length && lambda[i + 1]! <= l) i++;
        const a: { x: number; k: number } = smooth[i]!;
        const b: { x: number; k: number } = smooth[(i + 1) % loop.length]!;
        const span: number = lambda[i + 1]! - lambda[i]!;
        const w: number =
          span > 0 ? Math.min(1, Math.max(0, (l - lambda[i]!) / span)) : 0;
        outerSkin[column(k)] = {
          x: a.x + (b.x - a.x) * w,
          k: a.k + (b.k - a.k) * w,
        };
      }
    }

    // Outward slope read from the kept skin itself, between the band's
    // outer edge and REACH beyond it, where the skin is found there; then
    // smoothed across columns, so the band leaves the skin tangentially.
    const probe: (q: [number, number]) => number = skinDepth(
      mesh,
      skin,
      prepared.outline,
    );
    const slopes: number[] = samples.map(
      (s: AutoMovieHumanEyelid.ISample, j: number): number => {
        const o: [number, number] = outer[j]!;
        const n2: [number, number] = [
          E.dot(s.outward, prepared.outline.lateral),
          E.dot(s.outward, prepared.outline.up),
        ];
        const x: number = probe([o[0] + REACH * n2[0], o[1] + REACH * n2[1]]);
        if (!Number.isFinite(x)) return outerSkin[j]!.k;
        return (x - E.dot(g.centre, g.forward) - outerSkin[j]!.x) / REACH;
      },
    );
    for (let j: number = 0; j < n; j++) {
      let sum: number = 0;
      let weight: number = 0;
      for (let d: number = -4; d <= 4; d++) {
        const w: number = Math.exp(-((d / 2) ** 2));
        sum += w * slopes[(j + d + n) % n]!;
        weight += w;
      }
      outerSkin[j]!.k = sum / weight;
    }

    // Rows of every column, in calibration mm.
    const band: number = E.rule.band;
    const rows: number[][] = [];
    const add = (p: AutoMovieHumanEyelid.Point): number => {
      const index: number = mesh.positions.length / 3;
      mesh.positions.push(p[0], p[1], p[2]);
      return index;
    };
    const profiles: AutoMovieHumanEyelid.Point[][] = samples.map(
      (
        s: AutoMovieHumanEyelid.ISample,
        j: number,
      ): AutoMovieHumanEyelid.Point[] => section(s, g, band, outerSkin[j]!),
    );
    // A non-finite coordinate would void the whole model's bounds; such a
    // lid is left open rather than emitted.
    if (
      profiles.some((column: AutoMovieHumanEyelid.Point[]): boolean =>
        column.some(
          (p: AutoMovieHumanEyelid.Point): boolean => !p.every(Number.isFinite),
        ),
      )
    )
      return;
    for (let r: number = 0; r < profiles[0]!.length; r++)
      rows.push(new Array<number>(n));
    for (let k: number = 0; k < n; k++) {
      const j: number = column(k);
      profiles[j]!.forEach((p: AutoMovieHumanEyelid.Point, r: number): void => {
        rows[r]![j] = add(p);
      });
    }

    // Group of each column: the loop edge it continues.
    const groupOf: string[] = new Array<string>(n);

    // Zipper between the loop and the first row, both in loop order.
    {
      let i: number = 0;
      let k: number = 0;
      const B = (m: number): number => loop[m % loop.length]!;
      const R = (m: number): number => rows[0]![column(m % n)]!;
      const lb = (m: number): number => lambda[m]!;
      const lr = (m: number): number => start + m;
      while (i < loop.length || k < n) {
        const name: string = edges[i % edges.length]!.name;
        groupOf[column(k % n)] ??= name;
        const advanceLoop: boolean =
          k >= n || (i < loop.length && lb(i + 1) < lr(k + 1));
        if (advanceLoop) {
          emit(name, B(i + 1), B(i), R(k));
          i++;
        } else {
          emit(name, B(i), R(k), R(k + 1));
          k++;
        }
      }
    }

    // Quads between consecutive rows. The tuck ends inside the globe's
    // opaque shell (sclera, iris and pupil), so its rim needs no cover.
    for (let r: number = 0; r + 1 < rows.length; r++)
      for (let k: number = 0; k < n; k++) {
        const c: number = column(k);
        const d: number = column(k + 1);
        const name: string = groupOf[c]!;
        emit(name, rows[r]![d]!, rows[r]![c]!, rows[r + 1]![c]!);
        emit(name, rows[r]![d]!, rows[r + 1]![c]!, rows[r + 1]![d]!);
      }
  }

  /**
   * Frontmost depth of the kept skin along an outline's `forward` at a
   * point of its projection plane, NaN where no skin triangle covers it.
   * Triangles near the outline are indexed in a 1 mm grid once.
   */
  function skinDepth(
    mesh: AutoMovieHumanLoftMesh.IContext,
    skin: readonly number[],
    outline: AutoMovieHumanLoftAperture.IOutline,
  ): (q: [number, number]) => number {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const box: [number, number, number, number] = outline.box;
    const lo: [number, number] = [box[0] - 6, box[1] - 6];
    const hi: [number, number] = [box[2] + 6, box[3] + 6];
    const project = (v: number): [number, number, number] => {
      const p: AutoMovieHumanEyelid.Point = [
        mesh.positions[3 * v]!,
        mesh.positions[3 * v + 1]!,
        mesh.positions[3 * v + 2]!,
      ];
      return [
        E.dot(p, outline.lateral),
        E.dot(p, outline.up),
        E.dot(p, outline.forward),
      ];
    };
    const grid: Map<number, [number, number, number][][]> = new Map();
    for (let t: number = 0; t < skin.length; t += 3) {
      const q: [number, number, number][] = [0, 1, 2].map(
        (k: number): [number, number, number] => project(skin[t + k]!),
      );
      if (
        q.some(
          (c: [number, number, number]): boolean =>
            c[2] < outline.window[0] || c[2] > outline.window[1],
        )
      )
        continue;
      const a0: number = Math.min(q[0]![0], q[1]![0], q[2]![0]);
      const a1: number = Math.max(q[0]![0], q[1]![0], q[2]![0]);
      const b0: number = Math.min(q[0]![1], q[1]![1], q[2]![1]);
      const b1: number = Math.max(q[0]![1], q[1]![1], q[2]![1]);
      if (a1 < lo[0] || a0 > hi[0] || b1 < lo[1] || b0 > hi[1]) continue;
      for (let i: number = Math.floor(a0); i <= Math.floor(a1); i++)
        for (let j: number = Math.floor(b0); j <= Math.floor(b1); j++) {
          const key: number = i * 100003 + j;
          const list: [number, number, number][][] = grid.get(key) ?? [];
          list.push(q);
          grid.set(key, list);
        }
    }
    return (p: [number, number]): number => {
      const list: [number, number, number][][] | undefined = grid.get(
        Math.floor(p[0]) * 100003 + Math.floor(p[1]),
      );
      let best: number = NaN;
      for (const q of list ?? []) {
        const [a, b, c] = q as [
          [number, number, number],
          [number, number, number],
          [number, number, number],
        ];
        const det: number =
          (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
        if (Math.abs(det) < 1e-12) continue;
        const u: number =
          ((p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1])) / det;
        const v: number =
          ((b[0] - a[0]) * (p[1] - a[1]) - (p[0] - a[0]) * (b[1] - a[1])) / det;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const x: number = a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2]);
        if (!(x <= best)) best = x;
      }
      return best;
    };
  }

  /**
   * One column of the lid band, outer edge excluded: anterior surface,
   * rounded anterior edge, margin face, posterior edge and tuck.
   *
   * @param s Lid sample
   * @param g Seated globe
   * @param band Band width, mm
   * @param skin Skin depth relative to the globe centre at the band's
   *   outer edge, and its slope per mm outward
   * @returns Row points in mm
   */
  function section(
    s: AutoMovieHumanEyelid.ISample,
    g: AutoMovieHumanEyelid.IGlobe,
    band: number,
    skin: { x: number; k: number },
  ): AutoMovieHumanEyelid.Point[] {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const contact: number = E.dot(E.sub(s.contact, g.centre), g.forward);

    // Points of the column's plane: `u` outward from the contact point in
    // projection, `x` depth from the globe centre.
    const place = (u: number, x: number): AutoMovieHumanEyelid.Point =>
      E.add(
        E.add(s.contact, E.scale(s.outward, u)),
        E.scale(g.forward, x - contact),
      );
    const globe = (u: number): number =>
      E.surface(g, E.add(s.contact, E.scale(s.outward, u)));

    // Anterior edge, and the start of its rounding on the anterior surface.
    const edgeU: number = E.rule.offset;
    const edgeX: number = contact + s.thickness;
    const r: number = ROUNDING * s.thickness;
    const span: number = band - edgeU;
    const h: number = Math.min(0.9 * span, r);
    const endU: number = edgeU + h;

    // Anterior surface: Hermite in u from the outer edge (band) to endU,
    // ending on the line toward the anterior edge.
    const x0: number = skin.x;
    const m0: number = skin.k;
    const x1: number = edgeX + ((x0 - edgeX) * h) / span;
    const m1: number = (x0 - edgeX) / span;
    const L: number = band - endU;
    const surface: [number, number][] = ROWS.map(
      (f: number): [number, number] => {
        const t: number = f;
        const h00: number = 2 * t ** 3 - 3 * t ** 2 + 1;
        const h10: number = t ** 3 - 2 * t ** 2 + t;
        const h01: number = -2 * t ** 3 + 3 * t ** 2;
        const h11: number = t ** 3 - t ** 2;
        // u decreases from band to endU; slopes are per unit outward u, so
        // per unit t they carry -L.
        const u: number = band - L * t;
        let x: number = h00 * x0 - h10 * L * m0 + h01 * x1 - h11 * L * m1;

        // Lid thickness over the globe, never less than the clearance.
        const under: number = globe(u);
        if (Number.isFinite(under))
          x = smoothMax(x, under + E.rule.clearance, 0.3);
        return [u, x];
      },
    );

    // Rounded anterior edge: quadratic Bezier from the surface's end,
    // through the edge as control, to the margin face's start.
    const inU: number = surface[surface.length - 1]![0];
    const inX: number = surface[surface.length - 1]![1];
    const faceU: number = -edgeU;
    const faceX: number = -s.thickness;
    const faceLength: number = Math.hypot(faceU, faceX) || 1;
    const outU: number = edgeU + (faceU * r) / faceLength;
    const outX: number = edgeX + (faceX * r) / faceLength;
    const rounded: [number, number][] = [0.25, 0.5, 0.75, 1].map(
      (t: number): [number, number] => [
        (1 - t) ** 2 * inU + 2 * t * (1 - t) * edgeU + t * t * outU,
        (1 - t) ** 2 * inX + 2 * t * (1 - t) * edgeX + t * t * outX,
      ],
    );

    // Margin face to the posterior edge, then the tuck.
    const face: [number, number][] = [
      [(outU + 0) / 2, (outX + contact) / 2],
      [0, contact],
    ];
    // The tuck runs from the posterior edge under the lid, just inside the
    // globe's surface, as the conjunctiva lining the lid lies on the eye;
    // where the margin passes the globe, toward its silhouette behind its
    // centre.
    const radial: number = AutoMovieHumanEyeGlobe.dimensions.radial;
    const into: number = E.smoothstep(0.75 * radial, 0.95 * radial, s.rho);
    const under: number = Math.min(s.rho + TUCK, 0.97 * radial);
    const tuckRho: number =
      (1 - into) * under + into * Math.min(s.rho, 0.97 * radial);
    const tuckX: number =
      (1 - into) * (AutoMovieHumanEyeGlobe.anterior(under) - 0.15) +
      into * -TUCK;
    const points: AutoMovieHumanEyelid.Point[] = [
      ...surface,
      ...rounded,
      ...face,
    ].map(
      ([u, x]: [number, number]): AutoMovieHumanEyelid.Point => place(u, x),
    );

    // The tuck end lies on the contact point's radial line from the axis.
    const offset: AutoMovieHumanEyelid.Point = E.sub(s.contact, g.centre);
    const across: AutoMovieHumanEyelid.Point = E.sub(
      offset,
      E.scale(g.forward, E.dot(offset, g.forward)),
    );
    const unit: AutoMovieHumanEyelid.Point = E.normalize(across);
    points.push(
      E.add(E.add(g.centre, E.scale(unit, tuckRho)), E.scale(g.forward, tuckX)),
    );
    return points;
  }

  /** Smooth maximum with blend width `k`. */
  function smoothMax(a: number, b: number, k: number): number {
    return (a + b + Math.sqrt((a - b) ** 2 + k * k)) / 2;
  }

  /**
   * Closed walk through the open edges of an opening, each edge once, by
   * Hierholzer's algorithm; of several components, the longest. A
   * boundary that touches itself at a vertex still yields one walk.
   */
  function circuit(open: readonly IEdge[]): IEdge[] {
    const out: Map<number, IEdge[]> = new Map();
    for (const e of open) {
      const list: IEdge[] = out.get(e.u) ?? [];
      list.push(e);
      out.set(e.u, list);
    }
    let best: IEdge[] = [];
    for (const start of [...out.keys()]) {
      if (!out.get(start)!.length) continue;
      const stack: IEdge[] = [];
      const path: IEdge[] = [];
      let at: number = start;
      for (;;) {
        const list: IEdge[] | undefined = out.get(at);
        if (list !== undefined && list.length) {
          const e: IEdge = list.pop()!;
          stack.push(e);
          at = e.v;
        } else if (stack.length) {
          const e: IEdge = stack.pop()!;
          path.push(e);
          at = e.u;
        } else break;
      }
      path.reverse();
      if (path.length > best.length) best = path;
    }
    return best;
  }

  /** Append the centroid of some vertices and return its index. */
  function centroid(
    mesh: AutoMovieHumanLoftMesh.IContext,
    vertices: readonly number[],
  ): number {
    const c: number[] = [0, 1, 2].map(
      (axis: number): number =>
        vertices.reduce(
          (sum: number, v: number): number =>
            sum + mesh.positions[3 * v + axis]!,
          0,
        ) / vertices.length,
    );
    const index: number = mesh.positions.length / 3;
    mesh.positions.push(c[0]!, c[1]!, c[2]!);
    return index;
  }
}
