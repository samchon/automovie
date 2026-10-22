import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";
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
    };

    // 1-2. Contact rings and the boundaries they define on both sides.
    for (const event of calibration.events) contact(context, event);

    // 3. Every chain between its two boundaries.
    for (const target of calibration.chains) loft(context, target);

    return {
      mesh: context.mesh,
      normals: AutoMovieHumanLoftMesh.normals(context.mesh),
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
    const ring: number[] = AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      AutoMovieHumanLoftChain.ring(parent, endHeight(parent, parentEnd), phases),
    );
    context.boundaries.set(parent.name + ":" + parentEnd, { kind: "own", ring });

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
    const heights: number[] = AutoMovieHumanLoftChain.stations(
      target,
      bottomY,
      topY,
      context.tolerance,
    );

    // Ring at each station; ends come from their boundaries when inherited
    // or owned, and are generated here when the end is a pole.
    const bottom: IBoundary = boundary(context, target, "bottom");
    const top: IBoundary = boundary(context, target, "top");
    const rings: number[][] = heights.map((y: number, k: number): number[] => {
      const end: IBoundary | undefined =
        k === 0 ? bottom : k === heights.length - 1 ? top : undefined;
      if (end !== undefined && end.kind !== "pole") return end.ring;
      return AutoMovieHumanLoftMesh.vertices(
        context.mesh,
        AutoMovieHumanLoftChain.ring(target, y, phases),
      );
    });

    // Bands between consecutive stations, grouped by principal interval.
    for (let k: number = 0; k + 1 < heights.length; k++) {
      AutoMovieHumanLoftMesh.group(
        context.mesh,
        interval(target, heights[k]!, heights[k + 1]!),
      );
      const lowerInherited: boolean = k === 0 && bottom.kind === "inherited";
      const upperInherited: boolean =
        k + 1 === heights.length - 1 && top.kind === "inherited";

      if (!lowerInherited && !upperInherited)
        AutoMovieHumanLoftMesh.band(context.mesh, rings[k]!, rings[k + 1]!);
      else
        AutoMovieHumanLoftMesh.zipper(
          context.mesh,
          rings[k]!,
          lowerInherited
            ? inheritedPhases(context, target, bottomY, rings[k]!)
            : phases,
          rings[k + 1]!,
          upperInherited
            ? inheritedPhases(context, target, topY, rings[k + 1]!)
            : phases,
        );
    }

    // Poles close the ends that no event owns.
    if (bottom.kind === "pole")
      pole(context, target, "bottom", rings[0]!);
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
   * Phases of inherited ring vertices under a chain's own rule, measured in
   * the chain's section plane at the inheriting end.
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
      ring.map(
        (v: number): [number, number, number] =>
          AutoMovieHumanLoftMesh.position(context.mesh, v),
      ),
    );
    return AutoMovieHumanLoftParameter.phases(target.rule, outline);
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
