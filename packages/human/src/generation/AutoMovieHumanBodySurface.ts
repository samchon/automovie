import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanSurfaceBoundary as IBoundary } from "./IAutoMovieHumanSurfaceBoundary";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

/**
 * Whole-body skin assembled from the calibrated chains and their events.
 *
 * A parent evaluates each contact ring once, including its pinch phases,
 * and shares its directed arcs with child chains by vertex index. Each
 * chain lofts at its bisection stations between owned rings, inherited arcs
 * or poles. Inherited rings use the existing section-phase rule and zipper;
 * the short pinch closure is shared by the adjacent children.
 *
 * Shared incidence does not qualify correspondence, regularity or the
 * inferred closures. Those obligations remain with reproduction review.
 * Triangle groups are named `<chain>/<k>` by their principal interval.
 */
export namespace AutoMovieHumanBodySurface {
  /** Generated skin in millimetres, registered frame. */
  export interface IOutput {
    /**
     * Skin buffers, triangles counter-clockwise from outside. Triangle groups
     * are named `<chain>/<k>`: the interval between principal layers k and
     * k+1 of that chain, which the sections `<chain>/<k>` and
     * `<chain>/<k+1>` shape.
     */
    mesh: AutoMovieHumanLoftMesh.IContext;

    /** Flat unit vertex normals of the whole skin. */
    normals: number[];

    /**
     * Loft coordinates of every vertex, flat `[chain, station, phase, ...]`:
     * the index of the chain in the calibration that evaluated it, the
     * station (height or tilted-frame station, mm) and the phase (radians).
     * A pole apex has phase NaN; a vertex the aperture cut or the lid tuck
     * derived from others has all three NaN.
     *
     * These are the skin's own surface parameters. Attachments such as
     * garments bind to them instead of to vertex or triangle numbers, which
     * change with every parameter set, so a bound point can be evaluated
     * again on another body or pose by the chain functions.
     */
    coordinates: number[];

    /** Aperture paths sampled by the actual skin generation, in millimetres. */
    construction: IAutoMovieHumanConstructionPath[];
  }

  /**
   * Create ring vertices and record their loft coordinates.
   *
   * @returns The new vertex indices, in phase order.
   */
  function ringVertices(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    station: number,
    phases: readonly number[],
  ): number[] {
    const chain: number = context.indices.get(target.name)!;
    for (const t of phases) context.coordinates.push(chain, station, t);
    return AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      AutoMovieHumanLoftChain.ring(target, station, phases),
    );
  }

  /** Chord tolerance of the station bisection in mm. */
  const TOLERANCE: number = 0.5;

  /**
   * Shading normals from the lofted surface itself.
   *
   * The mesh joins equal phases of consecutive stations, and where a
   * chain's correspondence slides along its sections (5 to 7 mm per 0.8 mm
   * of station beside the outer eye corners) or a child's own ring meets
   * the ring it inherits by a zipper, the triangles cut across the curved
   * surface. Their area-weighted normals then turn by several degrees from
   * one band to the next, which shaded as lines along the head rings and
   * round the hips although the surface those rings lie on is smooth
   * (profiled in fixed planes, its slope is continuous to 0.1 mm). Every
   * vertex with loft coordinates therefore takes the normal of its chain's
   * surface at its station and phase, `dS/dt x dS/ds`, the phase derivative
   * exact and the station one a central difference over {@link STEP} mm
   * (one-sided at the chain's ends), oriented with the mesh normal. A vertex
   * without coordinates, or whose two normals differ by more than
   * {@link AGREE} degrees (a pinch bridge or a pole apex, where the mesh is
   * the surface), keeps the mesh normal.
   */
  function surfaceNormals(
    calibration: IAutoMovieHumanBodyCalibration,
    coordinates: readonly number[],
    mesh: number[],
  ): number[] {
    const out: number[] = [...mesh];
    const cosine: number = Math.cos((AGREE * Math.PI) / 180);
    const cache: Map<string, IStationJet> = new Map();
    for (let v: number = 0; 3 * v + 2 < coordinates.length; v++) {
      const index: number = coordinates[3 * v]!;
      const s: number = coordinates[3 * v + 1]!;
      const t: number = coordinates[3 * v + 2]!;
      if (!Number.isFinite(index) || !Number.isFinite(t)) continue;
      const target: IAutoMovieHumanLoftChain = calibration.chains[index]!;
      const key: string = index.toString() + ":" + s.toString();
      let jet: IStationJet | undefined = cache.get(key);
      if (jet === undefined) {
        jet = stationJet(target, s);
        cache.set(key, jet);
      }
      const p: [number, number, number, number] =
        AutoMovieHumanLoftChain.section(target, jet.here, t);
      const a: [number, number, number] = place(target, jet.lo, t);
      const b: [number, number, number] = place(target, jet.hi, t);
      const dt: number[] = [0, 1, 2].map(
        (k: number): number => jet.frame.u[k]! * p[2] + jet.frame.v[k]! * p[3],
      );
      if (jet.lift !== null) {
        const l: number = AutoMovieHumanSplineCurve.evaluate(
          jet.lift,
          target.order,
          t,
        )[2];
        for (let k: number = 0; k < 3; k++) dt[k]! += l * jet.normal[k]!;
      }
      const ds: number[] = [0, 1, 2].map((k: number): number => b[k]! - a[k]!);
      const n: number[] = [
        dt[1]! * ds[2]! - dt[2]! * ds[1]!,
        dt[2]! * ds[0]! - dt[0]! * ds[2]!,
        dt[0]! * ds[1]! - dt[1]! * ds[0]!,
      ];
      const length: number = Math.hypot(n[0]!, n[1]!, n[2]!);
      if (!(length > 1e-12)) continue;
      const m: number[] = mesh.slice(3 * v, 3 * v + 3);
      let c: number = (n[0]! * m[0]! + n[1]! * m[1]! + n[2]! * m[2]!) / length;
      const sign: number = c < 0 ? -1 : 1;
      c *= sign;
      if (c < cosine) continue;
      for (let k: number = 0; k < 3; k++)
        out[3 * v + k] = (sign * n[k]!) / length;
    }
    return out;
  }

  /**
   * Shading normals blended across the event rings.
   *
   * Parent and child are fitted on their own and meet at a shared ring with
   * one tangent plane (`AutoMovieHumanEventJoin`) but not one curvature, so
   * each side's surface normals turn at their own rate and the ring shades
   * as a line under raking light: across the face at the 1543.2 mm ring
   * under the nose and at the 1595.5 mm ring beside the eyes, in clay as in
   * colour, although the normals there agree with the local surface to 1.7
   * degrees. Every vertex within {@link BLEND} mm of station from one of
   * its chain's event rings therefore averages its normal with its mesh
   * neighbours' over {@link PASSES} passes, fully at the ring and fading to
   * nothing at the band's edge, so the turn spreads over the band on both
   * sides. A neighbour whose normal differs by more than {@link FOLD}
   * degrees is left out: the contacts' real folds (the axillae, the crotch,
   * the webs, the auricle's rims) keep their shading. Positions are not
   * moved.
   */
  function ringBlend(
    calibration: IAutoMovieHumanBodyCalibration,
    coordinates: readonly number[],
    indices: readonly number[],
    normals: number[],
  ): number[] {
    // Event ring stations of every chain, by calibration index.
    const index: Map<string, number> = new Map(
      calibration.chains.map(
        (c: IAutoMovieHumanLoftChain, i: number): [string, number] => [
          c.name,
          i,
        ],
      ),
    );
    const rings: number[][] = calibration.chains.map((): number[] => []);
    for (const event of calibration.events) {
      const parent: IAutoMovieHumanLoftChain =
        calibration.chains[index.get(event.parent)!]!;
      rings[index.get(event.parent)!]!.push(
        event.direction === "down"
          ? parent.layers[0]!.y
          : parent.layers[parent.layers.length - 1]!.y,
      );
      for (const split of event.splits) {
        const child: IAutoMovieHumanLoftChain =
          calibration.chains[index.get(split.child)!]!;
        rings[index.get(split.child)!]!.push(
          event.direction === "down"
            ? child.layers[child.layers.length - 1]!.y
            : child.layers[0]!.y,
        );
      }
    }

    // Blend weight of each vertex: full at a ring, none at the band's edge.
    const count: number = normals.length / 3;
    const weight: number[] = new Array<number>(count).fill(0);
    for (let v: number = 0; v < count && 3 * v + 2 < coordinates.length; v++) {
      const chain: number = coordinates[3 * v]!;
      const s: number = coordinates[3 * v + 1]!;
      if (!Number.isFinite(chain) || !Number.isFinite(s)) continue;
      const d: number = Math.min(
        ...rings[chain]!.map((r: number): number => Math.abs(s - r)),
      );
      if (d >= BLEND) continue;
      const x: number = d / BLEND;
      weight[v] = 1 - x * x * (3 - 2 * x);
    }

    // Neighbours of the blended vertices.
    const neighbours: Map<number, Set<number>> = new Map();
    for (let t: number = 0; t < indices.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number = indices[t + e]!;
        const b: number = indices[t + ((e + 1) % 3)]!;
        if (weight[a]! > 0) {
          let set: Set<number> | undefined = neighbours.get(a);
          if (set === undefined) neighbours.set(a, (set = new Set()));
          set.add(b);
        }
        if (weight[b]! > 0) {
          let set: Set<number> | undefined = neighbours.get(b);
          if (set === undefined) neighbours.set(b, (set = new Set()));
          set.add(a);
        }
      }

    const cosine: number = Math.cos((FOLD * Math.PI) / 180);
    let current: number[] = [...normals];
    for (let pass: number = 0; pass < PASSES; pass++) {
      const next: number[] = [...current];
      for (const [v, set] of neighbours) {
        const n: [number, number, number] = [
          current[3 * v]!,
          current[3 * v + 1]!,
          current[3 * v + 2]!,
        ];
        const sum: [number, number, number] = [0, 0, 0];
        let k: number = 0;
        for (const u of set) {
          const m: [number, number, number] = [
            current[3 * u]!,
            current[3 * u + 1]!,
            current[3 * u + 2]!,
          ];
          if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < cosine) continue;
          for (let i: number = 0; i < 3; i++) sum[i]! += m[i]!;
          k++;
        }
        if (k === 0) continue;
        const w: number = weight[v]!;
        const b: number[] = [0, 1, 2].map(
          (i: number): number => n[i]! + w * (sum[i]! / k - n[i]!),
        );
        const length: number = Math.hypot(b[0]!, b[1]!, b[2]!);
        if (!(length > 1e-12)) continue;
        for (let i: number = 0; i < 3; i++) next[3 * v + i] = b[i]! / length;
      }
      current = next;
    }
    return current;
  }

  /** Station half-width of the normal blend across an event ring, mm. */
  const BLEND: number = 4;

  /** Averaging passes of the ring blend. */
  const PASSES: number = 16;

  /** Largest normal difference a blended neighbour may have, degrees. */
  const FOLD: number = 30;

  /** Station step of the surface normals' station derivative, mm. */
  const STEP: number = 0.05;

  /** Largest angle between the surface and mesh normals still replaced, degrees. */
  const AGREE: number = 30;

  /** A chain's sections at a station and its two difference neighbours. */
  interface IStationJet {
    here: number[];
    frame: AutoMovieHumanLoftFrame.IFrame;
    normal: [number, number, number];
    lift: number[] | null;
    lo: IStationSample;
    hi: IStationSample;
  }

  /** Coefficients, frame and lift of one station, to place points from. */
  interface IStationSample {
    coefficients: number[];
    frame: AutoMovieHumanLoftFrame.IFrame;
    lift: number[] | null;
  }

  /** Sections at a station and STEP mm to either side, clamped into the chain. */
  function stationJet(
    target: IAutoMovieHumanLoftChain,
    s: number,
  ): IStationJet {
    const bottom: number = target.layers[0]!.y;
    const top: number = target.layers[target.layers.length - 1]!.y;
    const sample = (y: number): IStationSample => {
      const l: number[] | null = AutoMovieHumanLoftChain.lift(target, y);
      return {
        coefficients: AutoMovieHumanLoftChain.coefficients(target, y),
        frame: AutoMovieHumanLoftChain.frame(target, y),
        lift: l === null ? null : [...l, ...l],
      };
    };
    const here: IStationSample = sample(s);
    const f: AutoMovieHumanLoftFrame.IFrame = here.frame;
    return {
      here: here.coefficients,
      frame: f,
      normal: [
        f.v[1] * f.u[2] - f.v[2] * f.u[1],
        f.v[2] * f.u[0] - f.v[0] * f.u[2],
        f.v[0] * f.u[1] - f.v[1] * f.u[0],
      ],
      lift: here.lift,
      lo: sample(Math.max(bottom, s - STEP)),
      hi: sample(Math.min(top, s + STEP)),
    };
  }

  /** World point of a phase on a sampled station. */
  function place(
    target: IAutoMovieHumanLoftChain,
    sample: IStationSample,
    t: number,
  ): [number, number, number] {
    const p: [number, number, number, number] = AutoMovieHumanLoftChain.section(
      target,
      sample.coefficients,
      t,
    );
    const q: [number, number, number] = AutoMovieHumanLoftFrame.place(
      sample.frame,
      p[0],
      p[1],
    );
    if (sample.lift === null) return q;
    const h: number = AutoMovieHumanSplineCurve.evaluate(
      sample.lift,
      target.order,
      t,
    )[0];
    const f: AutoMovieHumanLoftFrame.IFrame = sample.frame;
    const n: [number, number, number] = [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
    return [q[0] + h * n[0], q[1] + h * n[1], q[2] + h * n[2]];
  }

  /**
   * Loft the whole calibrated body.
   *
   * @param calibration Shared chain coefficients, events and poles.
   */
  export function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    details: [[number, number, number], [number, number, number]][] = [],
  ): IOutput {
    const context: IContext = {
      mesh: AutoMovieHumanLoftMesh.create(),
      chains: new Map(
        calibration.chains.map(
          (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
            c.name,
            c,
          ],
        ),
      ),
      events: calibration.events,
      poles: new Map(
        calibration.poles.map(
          (
            p: IAutoMovieHumanBodyCalibration.IPole,
          ): [string, IAutoMovieHumanBodyCalibration.IPole] => [
            p.chain + ":" + p.end,
            p,
          ],
        ),
      ),
      boundaries: new Map(),
      tolerance: TOLERANCE,
      apertures: AutoMovieHumanBodyApertures.prepare(
        calibration.apertures,
        calibration.eyes,
      ),
      details,
      indices: new Map(
        calibration.chains.map(
          (c: IAutoMovieHumanLoftChain, i: number): [string, number] => [
            c.name,
            i,
          ],
        ),
      ),
      coordinates: [],
    };

    // 1-2. Contact rings and the boundaries they define on both sides.
    for (const event of calibration.events) contact(context, event);

    // 3. Every chain between its two boundaries.
    for (const target of calibration.chains) loft(context, target);

    // 4. Openings: the skin over every aperture is clipped away by
    // position, and the lid margins tucked onto the globes.
    const construction: IAutoMovieHumanConstructionPath[] =
      AutoMovieHumanBodyApertures.cut(context.mesh, context.apertures);

    return {
      mesh: context.mesh,
      construction,
      normals: ringBlend(
        calibration,
        context.coordinates,
        context.mesh.indices,
        surfaceNormals(
          calibration,
          context.coordinates,
          AutoMovieHumanLoftMesh.normals(context.mesh),
        ),
      ),
      // Vertices the cut and the tuck added after lofting have no loft
      // coordinates of their own.
      coordinates: [
        ...context.coordinates,
        ...new Array<number>(
          context.mesh.positions.length - context.coordinates.length,
        ).fill(NaN),
      ],
    };
  }

  /**
   * Generate an event's contact ring from its parent and hand out its arcs.
   *
   * The parent's end boundary becomes the whole ring; each child's adjacent
   * end becomes the vertices on its arcs, in ring order.
   */
  function contact(
    context: IContext,
    event: IAutoMovieHumanBodyCalibration.IEvent,
  ): void {
    const parent: IAutoMovieHumanLoftChain = chain(context, event.parent);
    const parentEnd: "bottom" | "top" =
      event.direction === "down" ? "bottom" : "top";
    const childEnd: "bottom" | "top" =
      event.direction === "down" ? "top" : "bottom";

    const phases: number[] = ownPhases(context, parent);
    const ring: number[] = ringVertices(
      context,
      parent,
      endHeight(parent, parentEnd),
      phases,
    );
    context.boundaries.set(parent.name + ":" + parentEnd, {
      kind: "own",
      ring,
    });

    for (const split of event.splits)
      context.boundaries.set(split.child + ":" + childEnd, {
        kind: "inherited",
        ring: split.arcs.flatMap((arc: [number, number]): number[] =>
          arcVertices(ring, phases, arc),
        ),
      });
  }

  /**
   * Loft one chain between its resolved bottom and top boundaries.
   *
   * Rings are generated at the interior bisection stations in the chain's
   * own phase set. An own boundary ring already has that phase set and joins
   * by an ordinary band; an inherited ring joins by a zipper; a missing
   * boundary is generated at the end height, or at the dome base of a
   * rounded pole, and closed at its pole.
   */
  function loft(context: IContext, target: IAutoMovieHumanLoftChain): void {
    const phases: number[] = ownPhases(context, target);
    const bottom: IBoundary = boundary(context, target, "bottom");
    const top: IBoundary = boundary(context, target, "top");
    // A rounded pole closes from its dome base instead of the chain's end.
    const bottomY: number =
      (bottom.kind === "pole" ? domeBase(context, target, "bottom") : null) ??
      endHeight(target, "bottom");
    const topY: number =
      (top.kind === "pole" ? domeBase(context, target, "top") : null) ??
      endHeight(target, "top");
    // Bisection stations, refined where the rings pass near an opening.
    const heights: number[] = AutoMovieHumanBodyApertures.detail(
      context.details,
      target,
      AutoMovieHumanBodyApertures.refine(
        context.apertures,
        target,
        AutoMovieHumanLoftChain.stations(
          target,
          bottomY,
          topY,
          context.tolerance,
        ),
        phases,
      ),
      phases,
    );

    // Ring and phase set at each station. Ends come from their boundaries
    // when inherited or owned, and are generated here when the end is a
    // pole.
    const ringPhases: (readonly number[])[] = [];
    const rings: number[][] = heights.map((y: number, k: number): number[] => {
      const end: IBoundary | undefined =
        k === 0 ? bottom : k === heights.length - 1 ? top : undefined;
      if (end !== undefined && end.kind !== "pole") {
        ringPhases.push(
          end.kind === "inherited"
            ? inheritedPhases(context, target, y, end.ring)
            : phases,
        );
        return end.ring;
      }

      ringPhases.push(phases);
      return ringVertices(context, target, y, phases);
    });

    // Bands between consecutive stations, grouped by principal interval.
    for (let k: number = 0; k + 1 < heights.length; k++) {
      AutoMovieHumanLoftMesh.group(
        context.mesh,
        interval(target, heights[k]!, heights[k + 1]!),
      );
      // Rings with one shared phase set join by a band; inherited rings
      // join by a zipper.
      if (ringPhases[k] === ringPhases[k + 1])
        AutoMovieHumanLoftMesh.band(context.mesh, rings[k]!, rings[k + 1]!);
      else
        AutoMovieHumanLoftMesh.zipper(
          context.mesh,
          rings[k]!,
          ringPhases[k]!,
          rings[k + 1]!,
          ringPhases[k + 1]!,
        );
    }

    // Poles close the ends that no event owns.
    if (bottom.kind === "pole") pole(context, target, "bottom", rings[0]!);
    if (top.kind === "pole")
      pole(context, target, "top", rings[rings.length - 1]!);
  }

  /** Resolved boundary of a chain end; ends without an event are poles. */
  function boundary(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "bottom" | "top",
  ): IBoundary {
    return context.boundaries.get(target.name + ":" + end) ?? { kind: "pole" };
  }

  /** Height of a chain's bottom or top principal layer in mm. */
  function endHeight(
    target: IAutoMovieHumanLoftChain,
    end: "bottom" | "top",
  ): number {
    return end === "bottom"
      ? target.layers[0]!.y
      : target.layers[target.layers.length - 1]!.y;
  }

  /**
   * A chain's own ring phases: uniform samples plus the pinch phases of the
   * events it parents, so every arc of those events falls on vertices.
   */
  function ownPhases(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
  ): number[] {
    const uniform: number[] = Array.from(
      { length: target.samples },
      (_: unknown, i: number): number => (2 * Math.PI * i) / target.samples,
    );
    const pinches: number[] = context.events
      .filter(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
          e.parent === target.name,
      )
      .flatMap((e: IAutoMovieHumanBodyCalibration.IEvent): number[] =>
        e.splits.flatMap((s: IAutoMovieHumanBodyCalibration.ISplit): number[] =>
          s.arcs.flat(),
        ),
      )
      // A whole-ring arc ends at 2pi, the same vertex as phase 0.
      .map((p: number): number => (p >= 2 * Math.PI - 1e-9 ? 0 : p));

    // Merge, dropping uniform phases that nearly coincide with a pinch.
    const spacing: number = (2 * Math.PI) / target.samples;
    const kept: number[] = uniform.filter((t: number): boolean =>
      pinches.every((p: number): boolean => circular(t, p) > 0.25 * spacing),
    );
    return [...new Set([...kept, ...pinches])].sort(
      (a: number, b: number): number => a - b,
    );
  }

  /**
   * Phases of inherited ring vertices on the chain's own end section.
   *
   * Each vertex takes the phase of its nearest point on the section the chain
   * itself evaluates at the inheriting end (a dense scan refined on the two
   * neighbouring chords), so the inherited ring is parametrized exactly as
   * the chain's own rings, whatever rule or matching fitted them. Phases are
   * then made to increase along the ring order, which the zipper requires.
   */
  function inheritedPhases(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    station: number,
    ring: readonly number[],
  ): number[] {
    const outline: [number, number][] = AutoMovieHumanLoftChain.local(
      target,
      station,
      ring.map((v: number): [number, number, number] =>
        AutoMovieHumanLoftMesh.position(context.mesh, v),
      ),
    );
    // Dense samples of the chain's own section at this station.
    const c: number[] = AutoMovieHumanLoftChain.coefficients(target, station);
    const n: number = Math.max(1024, 8 * target.order);
    const curve: [number, number][] = Array.from(
      { length: n },
      (_: unknown, k: number): [number, number] => {
        const p: [number, number, number, number] =
          AutoMovieHumanLoftChain.section(target, c, (2 * Math.PI * k) / n);
        return [p[0], p[1]];
      },
    );

    // Nearest sample, then the nearest point on its two chords.
    const projected: number[] = outline.map((p: [number, number]): number => {
      let best: number = 0;
      let distance: number = Infinity;
      curve.forEach((q: [number, number], k: number): void => {
        const d: number = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
        if (d < distance) {
          distance = d;
          best = k;
        }
      });
      let phase: number = best;
      let closest: number = Infinity;
      for (const k of [best - 1, best]) {
        const a: [number, number] = curve[(k + n) % n]!;
        const b: [number, number] = curve[(k + 1 + n) % n]!;
        const dx: number = b[0] - a[0];
        const dz: number = b[1] - a[1];
        const L: number = dx * dx + dz * dz;
        const u: number =
          L > 0
            ? Math.min(
                1,
                Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L),
              )
            : 0;
        const d: number =
          (a[0] + u * dx - p[0]) ** 2 + (a[1] + u * dz - p[1]) ** 2;
        if (d < closest) {
          closest = d;
          phase = k + u;
        }
      }
      return (2 * Math.PI * phase) / n;
    });

    // Increase along the ring: unwrap, never step backward, wrap again.
    const out: number[] = [];
    projected.forEach((t: number, i: number): void => {
      if (i === 0) {
        out.push(t);
        return;
      }
      const previous: number = out[i - 1]!;
      const step: number =
        ((((t - previous) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) -
        Math.PI;
      out.push(previous + Math.max(step, 1e-6));
    });
    return out.map(
      (t: number): number =>
        ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    );
  }

  /** Ring vertices whose phases lie on a forward arc, inclusive, in ring order. */
  function arcVertices(
    ring: readonly number[],
    phases: readonly number[],
    arc: [number, number],
  ): number[] {
    const [from, to]: [number, number] = arc;

    // A whole-period arc is a continuation event: the child takes every
    // vertex of the ring, which a forward distance of zero would lose.
    const width: number =
      to - from >= 2 * Math.PI - 1e-9 ? 2 * Math.PI : forward(from, to);

    // Phases are ascending in [0, 2pi); start at the arc's first vertex.
    const start: number = phases.findIndex(
      (t: number): boolean => circular(t, from) < 1e-9,
    );
    if (start < 0) throw new Error("Branch arc does not start on a vertex");

    const out: number[] = [];
    for (let k: number = 0; k < ring.length; k++) {
      const i: number = (start + k) % ring.length;
      if (forward(from, phases[i]!) > width + 1e-9) break;
      out.push(ring[i]!);
    }
    return out;
  }

  /**
   * Group name `<chain>/<k>` of the band between two station heights: k is
   * the principal interval containing the band's middle height.
   */
  function interval(
    target: IAutoMovieHumanLoftChain,
    lower: number,
    upper: number,
  ): string {
    const middle: number = (lower + upper) / 2;
    let k: number = 0;
    while (k < target.layers.length - 2 && target.layers[k + 1]!.y <= middle)
      k++;
    return target.name + "/" + k.toString();
  }

  /** Forward phase distance from a to b in `[0, 2pi)`. */
  function forward(a: number, b: number): number {
    const d: number = (b - a) % (2 * Math.PI);
    return d < -1e-12 ? d + 2 * Math.PI : Math.max(0, d);
  }

  /** Shortest circular distance between two phases. */
  function circular(a: number, b: number): number {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }

  /** Calibration chain by name; a missing chain is a calibration defect. */
  function chain(context: IContext, name: string): IAutoMovieHumanLoftChain {
    const found: IAutoMovieHumanLoftChain | undefined =
      context.chains.get(name);
    if (found === undefined)
      throw new Error(`Calibration lacks the ${name} chain`);
    return found;
  }

  /**
   * Close a chain end with a fan to its pole.
   *
   * A calibrated pole is the recovered critical point (crown, fingertip) or
   * a provisional closure point; without one the end closes at its axis.
   * The fan belongs to the chain's end interval.
   */
  function pole(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "top" | "bottom",
    ring: number[],
  ): void {
    const y: number = endHeight(target, end);
    const calibrated: IAutoMovieHumanBodyCalibration.IPole | undefined =
      context.poles.get(target.name + ":" + end);
    const point: [number, number, number] =
      calibrated?.point ?? AutoMovieHumanLoftChain.axis(target, y);

    AutoMovieHumanLoftMesh.group(
      context.mesh,
      target.name +
        "/" +
        (end === "top" ? target.layers.length - 2 : 0).toString(),
    );

    // A recovered critical point closes the chain with a rounded dome: each
    // ring vertex v runs to the apex p along the quarter ellipse
    // c + (v - c) cos(a) + (p - c) sin(a), a from 0 to pi/2, c the ring's
    // centroid. Its tangent at the ring points along c -> p, the chain's
    // own direction there, and at the apex it lies across it, so the tip is
    // round instead of the cone a direct fan draws (pointed fingertips and
    // toe tips). The ring is the dome base's (see domeBase), so the dome
    // replaces the fitted point rings. A provisional closure keeps the flat
    // fan.
    let last: number[] = ring;
    if (calibrated?.critical === true) {
      const corners: [number, number, number][] = ring.map(
        (v: number): [number, number, number] =>
          AutoMovieHumanLoftMesh.position(context.mesh, v),
      );
      const c: [number, number, number] = [0, 1, 2].map(
        (k: number): number =>
          corners.reduce(
            (sum: number, q: [number, number, number]): number => sum + q[k]!,
            0,
          ) / corners.length,
      ) as [number, number, number];
      for (let i: number = 1; i < DOME; i++) {
        const a: number = (Math.PI / 2) * (i / DOME);
        for (let k: number = 0; k < ring.length; k++)
          context.coordinates.push(context.indices.get(target.name)!, y, NaN);
        const next: number[] = AutoMovieHumanLoftMesh.vertices(
          context.mesh,
          corners.map(
            (q: [number, number, number]): [number, number, number] =>
              [0, 1, 2].map(
                (k: number): number =>
                  c[k]! +
                  (q[k]! - c[k]!) * Math.cos(a) +
                  (point[k]! - c[k]!) * Math.sin(a),
              ) as [number, number, number],
          ),
        );
        if (end === "top")
          AutoMovieHumanLoftMesh.band(context.mesh, last, next);
        else AutoMovieHumanLoftMesh.band(context.mesh, next, last);
        last = next;
      }
    }

    context.coordinates.push(context.indices.get(target.name)!, y, NaN);
    const apex: number = AutoMovieHumanLoftMesh.vertices(context.mesh, [
      point,
    ])[0]!;
    AutoMovieHumanLoftMesh.cap(context.mesh, last, apex, end === "top");
  }

  /**
   * Station where a rounded pole's dome starts, or null to close at the end.
   *
   * The fitter ends a digit chain with a layer of a few tenths of a
   * millimetre round its recovered tip, the next layer 3 to 6 mm inward
   * holding the digit's full section (f1: index finger 0.1 then 5.0 mm
   * radius over 5.4 mm, ring finger 0.7, 1.2 then 5.0 mm). The Hermite
   * interval between them narrows linearly, so the tip lofts as a cone that
   * no dome on its point-sized end ring can round. The dome therefore starts
   * at the first layer from the end whose mean radius reaches
   * {@link FLOOR} of the chain's median layer radius, skipping the point
   * rings. A base whose apex lies closer than {@link ASPECT} of its radius
   * would flatten the end (the crown's last layers are wide and shallow),
   * so such an end keeps its fitted layers.
   */
  function domeBase(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "top" | "bottom",
  ): number | null {
    const calibrated: IAutoMovieHumanBodyCalibration.IPole | undefined =
      context.poles.get(target.name + ":" + end);
    if (calibrated?.critical !== true) return null;
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = target.layers;
    const probes: number[] = Array.from(
      { length: 32 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 32,
    );
    const measure = (y: number): [number, [number, number, number]] => {
      const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
        target,
        y,
        probes,
      );
      const c: [number, number, number] = [0, 1, 2].map(
        (k: number): number =>
          ring.reduce(
            (sum: number, p: [number, number, number]): number => sum + p[k]!,
            0,
          ) / ring.length,
      ) as [number, number, number];
      const radius: number =
        ring.reduce(
          (sum: number, p: [number, number, number]): number =>
            sum + Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]),
          0,
        ) / ring.length;
      return [radius, c];
    };
    const radii: number[] = layers.map(
      (l: IAutoMovieHumanLoftChain.ILayer): number => measure(l.y)[0],
    );
    const sorted: number[] = [...radii].sort(
      (a: number, b: number): number => a - b,
    );
    const floor: number = FLOOR * sorted[sorted.length >> 1]!;
    const order: number[] = layers.map((_: unknown, k: number): number =>
      end === "bottom" ? k : layers.length - 1 - k,
    );
    if (radii[order[0]!]! >= floor) return null;
    const k: number | undefined = order.find(
      (i: number): boolean => radii[i]! >= floor,
    );
    if (k === undefined || k === order[order.length - 1]) return null;
    const [radius, centre] = measure(layers[k]!.y);
    const apex: number = Math.hypot(
      calibrated.point[0] - centre[0],
      calibrated.point[1] - centre[1],
      calibrated.point[2] - centre[2],
    );
    return apex >= ASPECT * radius ? layers[k]!.y : null;
  }

  /** Rings of the rounded dome closing a chain at a critical point, plus one. */
  const DOME: number = 4;

  /** Share of a chain's median layer radius below which an end layer is a point ring. */
  const FLOOR: number = 0.35;

  /** Least apex height of a dome as a share of its base radius. */
  const ASPECT: number = 0.5;
}
