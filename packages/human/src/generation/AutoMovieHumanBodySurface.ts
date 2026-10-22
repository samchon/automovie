import {
  AutoMovieHumanLoftChain,
  type IAutoMovieHumanLoftChain,
} from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Whole-body skin assembled from the calibrated section chains.
 *
 * ## Topology
 *
 * The body is lofted top-down through two branch events:
 *
 * ```text
 *              upper (axillae -> crown)
 *                 |  axilla: split at four pinch phases
 *     arm.left  trunk  arm.right
 *                 |  crotch: split at trunk phases 0 and pi
 *         leg.left   leg.right
 * ```
 *
 * At each event the parent's lowest ring is generated once and its vertices
 * are handed to the children unchanged, so parent and children share one
 * boundary instead of agreeing coordinate copies. Each child assigns the
 * inherited vertices phases with its own correspondence rule and evaluates
 * all of its lower rings at those phases, so every band of a chain joins
 * corresponding points. The short edge that closes a child ring across a
 * pinch is shared by the two children on either side of it.
 *
 * ## Open scope
 *
 * The hands end at the palm and the feet above the toes, each closed by a
 * flat pole; fingers, toes, ears, eyes and the mouth are later branch
 * events. The head is the outer section only.
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

    /** Bisection chord tolerance in mm. */
    tolerance: number;
  }

  /** Phase count of the upper chain's rings; children inherit subsets. */
  const UPPER_PHASES: number = 320;

  /** Chord tolerance of the station bisection in mm. */
  const TOLERANCE: number = 0.5;

  /**
   * Loft the whole calibrated body.
   *
   * @param calibration Shared chain coefficients and event phases.
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
      tolerance: TOLERANCE,
    };
    const { left, right } = calibration.axilla;

    // Upper chain phases: uniform, plus the four pinch phases exactly, so
    // the axillary split falls on vertices.
    const phases: number[] = [
      ...Array.from(
        { length: UPPER_PHASES },
        (_: unknown, i: number): number => (2 * Math.PI * i) / UPPER_PHASES,
      ),
      left[0],
      left[1],
      right[0],
      right[1],
    ].sort((a: number, b: number): number => a - b);

    // Upper: generated from the axillary ring up to the crown pole.
    const upper: IAutoMovieHumanLoftChain = chain(context, "upper");
    const axillaRing: number[] = AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      AutoMovieHumanLoftChain.ring(upper, calibration.axilla.y, phases),
    );
    const crown: number[] = loftUp(context, upper, axillaRing, phases);
    pole(context, upper, crown, true);

    // Axilla: arm lobes are the phase intervals between each pinch pair;
    // the trunk keeps the rest, in ring order.
    const inside = (t: number, range: [number, number]): boolean =>
      t >= range[0] - 1e-12 && t <= range[1] + 1e-12;
    const pick = (keep: (t: number) => boolean): number[] =>
      axillaRing.filter((_: number, i: number): boolean => keep(phases[i]!));

    const armLeft: number[] = pick((t: number): boolean => inside(t, left));
    const armRight: number[] = pick((t: number): boolean => inside(t, right));
    const torso: number[] = pick(
      (t: number): boolean =>
        t <= left[0] ||
        (t >= left[1] && t <= right[0]) ||
        t >= right[1],
    );

    for (const [name, ring] of [
      ["arm.left", armLeft],
      ["arm.right", armRight],
    ] as const) {
      const arm: IAutoMovieHumanLoftChain = chain(context, name);
      const palm: number[] = loftDown(context, arm, ring);
      pole(context, arm, palm, false);
    }

    // Trunk: lofted down to the crotch contact, then split between the legs
    // at its front (phase 0) and back (phase pi) vertices.
    const trunk: IAutoMovieHumanLoftChain = chain(context, "trunk");
    const trunkPhases: number[] = inheritedPhases(context, trunk, torso);
    const crotchRing: number[] = loftDown(context, trunk, torso, trunkPhases);

    const front: number = nearestPhase(trunkPhases, 0);
    const back: number = nearestPhase(trunkPhases, Math.PI);
    for (const [name, from, to] of [
      ["leg.left", front, back],
      ["leg.right", back, front],
    ] as const) {
      const leg: IAutoMovieHumanLoftChain = chain(context, name);
      const sole: number[] = loftDown(
        context,
        leg,
        cyclicRange(crotchRing, from, to),
      );
      pole(context, leg, sole, false);
    }

    return {
      positions: context.mesh.positions,
      normals: AutoMovieHumanLoftMesh.normals(context.mesh),
      indices: context.mesh.indices,
    };
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
   * Phases of inherited ring vertices under a child chain's own rule.
   *
   * The child's rule decides correspondence inside the child, so its lower
   * rings are evaluated at the phases its rule assigns to the inherited
   * outline, exactly as the fitter assigned phases to observed outlines.
   */
  function inheritedPhases(
    context: IContext,
    child: IAutoMovieHumanLoftChain,
    ring: readonly number[],
  ): number[] {
    const outline: [number, number][] = ring.map(
      (v: number): [number, number] => {
        const p: [number, number, number] = AutoMovieHumanLoftMesh.position(
          context.mesh,
          v,
        );
        return [p[0], p[2]];
      },
    );
    return AutoMovieHumanLoftParameter.phases(child.rule, outline);
  }

  /**
   * Loft a chain downward from an inherited top ring to its bottom layer.
   *
   * @param context Construction context.
   * @param child Chain to loft.
   * @param top Inherited vertex ring at the chain's top height.
   * @param phases Phases of the top ring; derived by the chain's rule when omitted.
   * @returns The ring generated at the chain's bottom height.
   */
  function loftDown(
    context: IContext,
    child: IAutoMovieHumanLoftChain,
    top: number[],
    phases: number[] = inheritedPhases(context, child, top),
  ): number[] {
    const bottom: number = child.layers[0]!.y;
    const ceiling: number = child.layers[child.layers.length - 1]!.y;
    const heights: number[] = AutoMovieHumanLoftChain.stations(
      child,
      bottom,
      ceiling,
      context.tolerance,
    );

    // Walk downward: each new ring is the lower ring of a band whose upper
    // ring is the previous one, starting from the inherited top ring.
    let upperRing: number[] = top;
    for (let k: number = heights.length - 2; k >= 0; k--) {
      const lowerRing: number[] = AutoMovieHumanLoftMesh.vertices(
        context.mesh,
        AutoMovieHumanLoftChain.ring(child, heights[k]!, phases),
      );
      AutoMovieHumanLoftMesh.band(context.mesh, lowerRing, upperRing);
      upperRing = lowerRing;
    }
    return upperRing;
  }

  /**
   * Loft a chain upward from a generated bottom ring to its top layer.
   *
   * @returns The ring generated at the chain's top height.
   */
  function loftUp(
    context: IContext,
    child: IAutoMovieHumanLoftChain,
    bottomRing: number[],
    phases: number[],
  ): number[] {
    const bottom: number = child.layers[0]!.y;
    const ceiling: number = child.layers[child.layers.length - 1]!.y;
    const heights: number[] = AutoMovieHumanLoftChain.stations(
      child,
      bottom,
      ceiling,
      context.tolerance,
    );

    let lowerRing: number[] = bottomRing;
    for (let k: number = 1; k < heights.length; k++) {
      const upperRing: number[] = AutoMovieHumanLoftMesh.vertices(
        context.mesh,
        AutoMovieHumanLoftChain.ring(child, heights[k]!, phases),
      );
      AutoMovieHumanLoftMesh.band(context.mesh, lowerRing, upperRing);
      lowerRing = upperRing;
    }
    return lowerRing;
  }

  /**
   * Close a chain end with a fan to its axis point at the end height.
   *
   * The crown's pole is a genuine surface pole. The palm and sole poles are
   * provisional closures of chains whose finger and toe branches are not
   * generated yet.
   */
  function pole(
    context: IContext,
    child: IAutoMovieHumanLoftChain,
    ring: number[],
    top: boolean,
  ): void {
    const y: number = top
      ? child.layers[child.layers.length - 1]!.y
      : child.layers[0]!.y;
    const axis: [number, number] = AutoMovieHumanLoftChain.axis(child, y);
    const apex: number = AutoMovieHumanLoftMesh.vertices(context.mesh, [
      [axis[0], y, axis[1]],
    ])[0]!;
    AutoMovieHumanLoftMesh.cap(context.mesh, ring, apex, top);
  }

  /** Index of the phase closest to a target on the circle. */
  function nearestPhase(phases: readonly number[], target: number): number {
    let best: number = 0;
    let distance: number = Infinity;
    phases.forEach((t: number, i: number): void => {
      const d: number = Math.abs(
        Math.atan2(Math.sin(t - target), Math.cos(t - target)),
      );
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  }

  /** Ring entries from index `from` to `to` inclusive, wrapping forward. */
  function cyclicRange(ring: readonly number[], from: number, to: number): number[] {
    const out: number[] = [];
    for (let i: number = from; ; i = (i + 1) % ring.length) {
      out.push(ring[i]!);
      if (i === to) break;
    }
    return out;
  }
}
