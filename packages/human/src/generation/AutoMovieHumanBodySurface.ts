import {
  AutoMovieHumanLoftChain,
  type IAutoMovieHumanLoftChain,
} from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Whole-body skin assembled from the calibrated chain tree.
 *
 * ## Procedure
 *
 * 1. The root chain is lofted upward from its bottom ring to its top pole.
 * 2. At every branch event the parent's bottom ring is split along the
 *    event's phase arcs; each child receives those exact vertices as its top
 *    ring, so parent and children share one boundary.
 * 3. A child assigns the inherited vertices phases by its own rule, then its
 *    first band zips them to its own uniform phase set (plus the pinch
 *    phases of its own bottom event, so its split falls on vertices).
 * 4. Each chain is lofted between its bisection stations; a chain end
 *    without an event closes at its pole.
 *
 * The short edge that closes a child ring across a pinch is shared by the
 * two children on either side of it, so the result is one closed manifold.
 */
export namespace AutoMovieHumanBodySurface {
  /** Generated skin buffers in millimetres. */
  export interface IOutput {
    /** Flat vertex positions in mm, registered frame. */
    positions: number[];

    /** Flat unit vertex normals. */
    normals: number[];

    /** Flat triangle indices, counter-clockwise from outside. */
    indices: number[];
  }

  /** Construction context passed between the chain lofting steps. */
  interface IContext {
    /** Mesh buffers shared by all chains. */
    mesh: AutoMovieHumanLoftMesh.IContext;

    /** Calibration chains by name. */
    chains: Map<string, IAutoMovieHumanLoftChain>;

    /** Branch events by parent chain name. */
    events: Map<string, IAutoMovieHumanBodyCalibration.IEvent>;

    /** Poles by `chain:end`. */
    poles: Map<string, IAutoMovieHumanBodyCalibration.IPole>;

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
      events: new Map(
        calibration.events.map(
          (
            e: IAutoMovieHumanBodyCalibration.IEvent,
          ): [string, IAutoMovieHumanBodyCalibration.IEvent] => [e.parent, e],
        ),
      ),
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
      tolerance: TOLERANCE,
    };

    // Root: its own phase set from the bottom ring up to the top pole.
    const root: IAutoMovieHumanLoftChain = chain(context, calibration.root);
    const phases: number[] = ownPhases(context, root);
    const bottom: number[] = AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      AutoMovieHumanLoftChain.ring(root, root.layers[0]!.y, phases),
    );
    const top: number[] = loftUp(context, root, bottom, phases);
    pole(context, root, "top", top);

    // Everything below the root descends from its bottom event.
    branch(context, root, bottom, phases);

    return {
      positions: context.mesh.positions,
      normals: AutoMovieHumanLoftMesh.normals(context.mesh),
      indices: context.mesh.indices,
    };
  }

  /**
   * Hand a chain's bottom ring to its children, or close it with a pole.
   *
   * @param context Construction context.
   * @param parent Chain whose bottom ring is given.
   * @param ring Bottom ring vertices.
   * @param phases Parent phase of each ring vertex.
   */
  function branch(
    context: IContext,
    parent: IAutoMovieHumanLoftChain,
    ring: number[],
    phases: number[],
  ): void {
    const event: IAutoMovieHumanBodyCalibration.IEvent | undefined =
      context.events.get(parent.name);
    if (event === undefined) {
      pole(context, parent, "bottom", ring);
      return;
    }

    for (const split of event.splits) {
      // The child's top ring: the parent vertices on its arcs, in order.
      const inherited: number[] = split.arcs.flatMap(
        (arc: [number, number]): number[] => arcVertices(ring, phases, arc),
      );
      const child: IAutoMovieHumanLoftChain = chain(context, split.child);
      const own: number[] = ownPhases(context, child);
      const lower: number[] = loftDown(context, child, inherited, own);
      branch(context, child, lower, own);
    }
  }

  /**
   * A chain's own ring phases: uniform samples plus its bottom pinch phases.
   *
   * Including the pinch phases exactly makes every arc of the chain's bottom
   * event start and end on a vertex.
   */
  function ownPhases(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
  ): number[] {
    const uniform: number[] = Array.from(
      { length: target.samples },
      (_: unknown, i: number): number => (2 * Math.PI * i) / target.samples,
    );
    const pinches: number[] =
      context.events
        .get(target.name)
        ?.splits.flatMap((s: IAutoMovieHumanBodyCalibration.ISplit) =>
          s.arcs.flat(),
        ) ?? [];

    // Merge, dropping uniform phases that nearly coincide with a pinch.
    const spacing: number = (2 * Math.PI) / target.samples;
    const kept: number[] = uniform.filter((t: number): boolean =>
      pinches.every(
        (p: number): boolean => circular(t, p) > 0.25 * spacing,
      ),
    );
    return [...new Set([...kept, ...pinches])].sort(
      (a: number, b: number): number => a - b,
    );
  }

  /** Ring vertices whose phases lie on a forward arc, inclusive, in ring order. */
  function arcVertices(
    ring: readonly number[],
    phases: readonly number[],
    arc: [number, number],
  ): number[] {
    const [from, to] = arc;
    const width: number = forward(from, to);

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
   * Loft a chain downward from an inherited top ring to its bottom layer.
   *
   * The inherited vertices get phases by the chain's own rule, exactly as
   * the fitter assigned phases to observed outlines; the first band zips
   * them to the chain's own phase set.
   *
   * @returns The ring generated at the chain's bottom height, in `phases` order.
   */
  function loftDown(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    top: number[],
    phases: number[],
  ): number[] {
    const outline: [number, number][] = top.map(
      (v: number): [number, number] => {
        const p: [number, number, number] = AutoMovieHumanLoftMesh.position(
          context.mesh,
          v,
        );
        return [p[0], p[2]];
      },
    );
    const inheritedPhases: number[] = AutoMovieHumanLoftParameter.phases(
      target.rule,
      outline,
    );

    const heights: number[] = AutoMovieHumanLoftChain.stations(
      target,
      target.layers[0]!.y,
      target.layers[target.layers.length - 1]!.y,
      context.tolerance,
    );

    // Walk downward: each new ring is the lower ring of a band whose upper
    // ring is the previous one; the first band is the zipper.
    let upper: number[] = top;
    for (let k: number = heights.length - 2; k >= 0; k--) {
      const lower: number[] = AutoMovieHumanLoftMesh.vertices(
        context.mesh,
        AutoMovieHumanLoftChain.ring(target, heights[k]!, phases),
      );
      if (upper === top)
        AutoMovieHumanLoftMesh.zipper(
          context.mesh,
          lower,
          phases,
          upper,
          inheritedPhases,
        );
      else AutoMovieHumanLoftMesh.band(context.mesh, lower, upper);
      upper = lower;
    }
    return upper;
  }

  /**
   * Loft a chain upward from a generated bottom ring to its top layer.
   *
   * @returns The ring generated at the chain's top height.
   */
  function loftUp(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    bottom: number[],
    phases: number[],
  ): number[] {
    const heights: number[] = AutoMovieHumanLoftChain.stations(
      target,
      target.layers[0]!.y,
      target.layers[target.layers.length - 1]!.y,
      context.tolerance,
    );

    let lower: number[] = bottom;
    for (let k: number = 1; k < heights.length; k++) {
      const upper: number[] = AutoMovieHumanLoftMesh.vertices(
        context.mesh,
        AutoMovieHumanLoftChain.ring(target, heights[k]!, phases),
      );
      AutoMovieHumanLoftMesh.band(context.mesh, lower, upper);
      lower = upper;
    }
    return lower;
  }

  /**
   * Close a chain end with a fan to its pole.
   *
   * A calibrated pole is the recovered critical point (crown, fingertip) or
   * a provisional axis point; without one the end is closed at its axis.
   */
  function pole(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "top" | "bottom",
    ring: number[],
  ): void {
    const y: number =
      end === "top"
        ? target.layers[target.layers.length - 1]!.y
        : target.layers[0]!.y;
    const calibrated: IAutoMovieHumanBodyCalibration.IPole | undefined =
      context.poles.get(target.name + ":" + end);
    const axis: [number, number] = AutoMovieHumanLoftChain.axis(target, y);
    const point: [number, number, number] = calibrated?.point ?? [
      axis[0],
      y,
      axis[1],
    ];

    const apex: number = AutoMovieHumanLoftMesh.vertices(context.mesh, [
      point,
    ])[0]!;
    AutoMovieHumanLoftMesh.cap(context.mesh, ring, apex, end === "top");
  }
}
