import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Whole-body skin assembled from the calibrated chains and their events.
 *
 * ## Procedure
 *
 * 1. **Contact rings.** Every event's contact ring is generated once by its
 *    parent chain, at the parent's end layer and in the parent's own phase
 *    set. That set includes the event's pinch phases, so every arc starts
 *    and ends on a vertex.
 * 2. **Chain boundaries.** Each chain end is one of three things: the
 *    contact ring of an event it parents, the arcs of a contact ring it
 *    inherits as a child, or a pole.
 * 3. **Lofting.** Each chain is lofted between its bottom and top boundaries
 *    at its bisection stations in its own phase set. An inherited boundary
 *    gets phases by the chain's own rule, exactly as the fitter assigned
 *    phases to observed outlines, and is joined by a zipper band.
 *
 * Every boundary ring is generated once and shared by index, and the short
 * edge that closes a child ring across a pinch belongs to the two children
 * on either side of it, so the result is one closed manifold. Triangle
 * groups are named `<chain>/<k>` by the principal interval they lie in.
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
  }

  /** A chain end boundary resolved to vertices or a pole. */
  type IBoundary =
    | {
        /** The chain's own contact ring, in its own phase set. */
        kind: "own";
        ring: number[];
      }
    | {
        /** Arcs inherited from a parent's contact ring. */
        kind: "inherited";
        ring: number[];
      }
    | {
        /** Closed at a pole. */
        kind: "pole";
      };

  /** Construction context passed between the lofting steps. */
  interface IContext {
    /** Mesh buffers shared by all chains. */
    mesh: AutoMovieHumanLoftMesh.IContext;

    /** Calibration chains by name. */
    chains: Map<string, IAutoMovieHumanLoftChain>;

    /** Calibration events. */
    events: IAutoMovieHumanBodyCalibration.IEvent[];

    /** Poles by `chain:end`. */
    poles: Map<string, IAutoMovieHumanBodyCalibration.IPole>;

    /** Resolved boundaries by `chain:end`. */
    boundaries: Map<string, IBoundary>;

    /** Bisection chord tolerance in mm. */
    tolerance: number;

    /** Apertures with their margins evaluated once. */
    apertures: AutoMovieHumanBodyApertures.IPrepared[];

    /** Calibration index of every chain, by name. */
    indices: Map<string, number>;

    /** Loft coordinates of the vertices created so far; see {@link IOutput}. */
    coordinates: number[];
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
   * Loft the whole calibrated body.
   *
   * @param calibration Shared chain coefficients, events and poles.
   */
  export function generate(
    calibration: IAutoMovieHumanBodyCalibration,
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
    AutoMovieHumanBodyApertures.cut(context.mesh, context.apertures);

    return {
      mesh: context.mesh,
      normals: AutoMovieHumanLoftMesh.normals(context.mesh),
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
   * boundary is generated at the end height and closed at its pole.
   */
  function loft(context: IContext, target: IAutoMovieHumanLoftChain): void {
    const phases: number[] = ownPhases(context, target);
    const bottomY: number = endHeight(target, "bottom");
    const topY: number = endHeight(target, "top");
    // Bisection stations, refined where the rings pass near an opening.
    const heights: number[] = AutoMovieHumanBodyApertures.refine(
      context.apertures,
      target,
      AutoMovieHumanLoftChain.stations(
        target,
        bottomY,
        topY,
        context.tolerance,
      ),
      phases,
    );

    // Ring and phase set at each station. Ends come from their boundaries
    // when inherited or owned, and are generated here when the end is a
    // pole.
    const bottom: IBoundary = boundary(context, target, "bottom");
    const top: IBoundary = boundary(context, target, "top");
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
        e.splits.flatMap((s: IAutoMovieHumanBodyCalibration.ISplit) =>
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
    const [from, to] = arc;

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

    context.coordinates.push(context.indices.get(target.name)!, y, NaN);
    const apex: number = AutoMovieHumanLoftMesh.vertices(context.mesh, [
      point,
    ])[0]!;
    AutoMovieHumanLoftMesh.group(
      context.mesh,
      target.name +
        "/" +
        (end === "top" ? target.layers.length - 2 : 0).toString(),
    );
    AutoMovieHumanLoftMesh.cap(context.mesh, ring, apex, end === "top");
  }
}
