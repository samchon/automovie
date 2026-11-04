import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanApertureBase } from "./AutoMovieHumanApertureBase";
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
     * These are the skin's own surface parameters. The rig and every
     * attachment bind to them instead of to vertex or triangle numbers, which
     * change with every parameter set, so a bound point can be evaluated
     * again on another body or pose by the chain functions.
     */
    coordinates: number[];

    /** Aperture paths sampled by the actual skin generation, in millimetres. */
    construction: IAutoMovieHumanConstructionPath[];

    /**
     * The rim of every opening closed from its trim loop, by name: the loop's
     * points on its base chain in loop order, mm.
     */
    rims: Map<string, [number, number, number][]>;
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
      rims: new Map(),
    };
    for (const appendage of calibration.appendages ?? []) {
      const list = context.roots.get(appendage.base) ?? [];
      list.push({
        appendage,
        loop: AutoMovieHumanBodyRoots.polygon(appendage.root, LOOP, appendage.winding),
      });
      context.roots.set(appendage.base, list);
    }
    // Every opening is a trim loop on its base chain: the declared one, or the
    // chain that holds it (`AutoMovieHumanApertureBase`). Only an eye, whose lid
    // band's outline crosses the ring between two head chains, is still cut by
    // position until the head is one chain.
    const based: AutoMovieHumanBodyApertures.IPrepared[] = [];
    for (const opening of context.apertures) {
      const found: AutoMovieHumanApertureBase.IBase | null =
        opening.aperture.base !== undefined && context.chains.has(opening.aperture.base)
          ? {
              chain: chain(context, opening.aperture.base),
              loop: AutoMovieHumanBodyRoots.trim(
                chain(context, opening.aperture.base),
                opening.outline,
                AutoMovieHumanLoftAperture.range(AutoMovieHumanLoftAperture.polyline(opening.aperture)),
              ),
            }
          : AutoMovieHumanApertureBase.of(opening, calibration.chains);
      if (found === null) {
        if (opening.lid === null) throw new Error(`Opening ${opening.aperture.name} lies on no single chain`);
        continue;
      }
      based.push(opening);
      const list = context.roots.get(found.chain.name) ?? [];
      list.push({ opening, loop: found.loop });
      context.roots.set(found.chain.name, list);
    }
    context.apertures = context.apertures.filter(
      (p: AutoMovieHumanBodyApertures.IPrepared): boolean => !based.includes(p),
    );

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

    // 4. The eyes: the skin over each is clipped away by position, and the
    // lid margins tucked onto the globes.
    construction.push(...AutoMovieHumanBodyApertures.cut(context.mesh, context.apertures));
    construction.push(...(WEBS.get(context.mesh) ?? []));

    const faces: number[] = AutoMovieHumanLoftMesh.normals(context.mesh);
    return {
      mesh: context.mesh,
      construction,
      rims: context.rims,
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
