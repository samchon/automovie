import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfaceContact } from "./AutoMovieHumanBodySurfaceContact";
import { AutoMovieHumanBodySurfaceLoft } from "./AutoMovieHumanBodySurfaceLoft";
import { AutoMovieHumanBodySurfaceNormals } from "./AutoMovieHumanBodySurfaceNormals";
import { AutoMovieHumanBodySurfacePoles } from "./AutoMovieHumanBodySurfacePoles";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const { ringBlend, surfaceNormals } = AutoMovieHumanBodySurfaceNormals;
const { contact, held, WEBS } = AutoMovieHumanBodySurfaceContact;
const { join, loft, LOOP, open } = AutoMovieHumanBodySurfaceLoft;
const { chain } = AutoMovieHumanBodySurfaceRead;
const { domed } = AutoMovieHumanBodySurfacePoles;

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

  /** Chord tolerance of the station bisection in mm. */
  const TOLERANCE: number = 0.5;

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
      roots: new Map(),
      ends: new Map(),
      holes: new Map(),
    };
    for (const appendage of calibration.appendages ?? []) {
      const list = context.roots.get(appendage.base) ?? [];
      list.push({
        appendage,
        loop: AutoMovieHumanBodyRoots.polygon(appendage.root, LOOP, appendage.winding),
      });
      context.roots.set(appendage.base, list);
    }
    // Openings on a base are its trim loops; the rest are cut by position.
    const based: AutoMovieHumanBodyApertures.IPrepared[] = context.apertures.filter(
      (p: AutoMovieHumanBodyApertures.IPrepared): boolean =>
        p.aperture.base !== undefined && context.chains.has(p.aperture.base),
    );
    context.apertures = context.apertures.filter(
      (p: AutoMovieHumanBodyApertures.IPrepared): boolean => !based.includes(p),
    );
    for (const opening of based) {
      const base: IAutoMovieHumanLoftChain = chain(context, opening.aperture.base!);
      const margin = AutoMovieHumanLoftAperture.polyline(opening.aperture);
      const list = context.roots.get(base.name) ?? [];
      list.push({
        opening,
        loop: AutoMovieHumanBodyRoots.trim(
          base,
          opening.outline,
          AutoMovieHumanLoftAperture.range(margin),
        ),
      });
      context.roots.set(base.name, list);
    }

    // 1-2. Contact rings and the boundaries they define on both sides.
    for (const event of calibration.events) contact(context, event);

    // 3. Every chain between its two boundaries; bases leave their root
    // loops open.
    for (const target of calibration.chains) loft(context, target);

    // 3b. Every appendage joined to its base through its strip, and every
    // opening on a base closed from its trim loop.
    for (const appendage of calibration.appendages ?? []) join(context, appendage);
    const construction: IAutoMovieHumanConstructionPath[] = [];
    for (const [name, roots] of context.roots)
      for (const r of roots)
        if (r.opening !== undefined)
          construction.push(...open(context, chain(context, name), r.opening, r.loop));

    // 4. Other openings: the skin over every aperture is clipped away by
    // position, and the lid margins tucked onto the globes.
    construction.push(...AutoMovieHumanBodyApertures.cut(context.mesh, context.apertures));
    construction.push(...(WEBS.get(context.mesh) ?? []));

    const faces: number[] = AutoMovieHumanLoftMesh.normals(context.mesh);
    return {
      mesh: context.mesh,
      construction,
      normals: domed(
        context.mesh,
        held(
          context.mesh,
          faces,
          ringBlend(
            calibration,
            context.coordinates,
            context.mesh.indices,
            surfaceNormals(calibration, context.coordinates, faces),
          ),
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
}
