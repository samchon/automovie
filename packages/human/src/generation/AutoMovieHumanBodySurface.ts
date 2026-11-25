import type {
  IAutoMovieHumanApertureSpan,
  IAutoMovieHumanBodyApertures,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodySurface,
  IAutoMovieHumanConstructionPath,
  IAutoMovieHumanSurfaceContext,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanApertureSpan } from "./AutoMovieHumanApertureSpan";
import { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfaceContact } from "./AutoMovieHumanBodySurfaceContact";
import { AutoMovieHumanBodySurfaceLoft } from "./AutoMovieHumanBodySurfaceLoft";
import { AutoMovieHumanBodySurfaceNormals } from "./AutoMovieHumanBodySurfaceNormals";
import { AutoMovieHumanBodySurfaceOpening } from "./AutoMovieHumanBodySurfaceOpening";
import { AutoMovieHumanBodySurfacePoles } from "./AutoMovieHumanBodySurfacePoles";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import { AutoMovieHumanBodySurfaceSolids } from "./AutoMovieHumanBodySurfaceSolids";
import { AutoMovieHumanNailExteriorClearance } from "./nail/AutoMovieHumanNailExteriorClearance";

const { ringBlend, surfaceNormals } = AutoMovieHumanBodySurfaceNormals;
const { contact, held } = AutoMovieHumanBodySurfaceContact;
const { join, loft, LOOP } = AutoMovieHumanBodySurfaceLoft;
const { chain } = AutoMovieHumanBodySurfaceRead;
const { domed } = AutoMovieHumanBodySurfacePoles;

/**
 * Whole-body skin assembled from the calibrated chains and their events.
 *
 * A parent evaluates each contact ring once, including its pinch phases, and
 * shares its directed arcs with child chains by vertex index. Each chain lofts
 * at its bisection stations between owned rings, inherited arcs or poles.
 * Inherited rings use the existing section-phase rule and zipper; the short
 * pinch closure is shared by the adjacent children.
 *
 * Shared incidence does not qualify correspondence, regularity or the inferred
 * closures. Those obligations remain with reproduction review. Triangle groups
 * are named `<chain>/<k>` by their principal interval.
 */
export namespace AutoMovieHumanBodySurface {
  /** Chord tolerance of the station bisection in mm. */
  const TOLERANCE: number = 0.5;

  /**
   * Loft the whole calibrated body.
   *
   * @param calibration Shared chain coefficients, events and poles.
   * @param details Optional detail intervals consumed by the existing body
   *   loft.
   * @param observeSolids Optional observer of this skin's actual prepared
   *   analytic charts.
   */
  export function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    details: IAutoMovieHumanBodySurface.GenerateDetails = [],
    observeSolids?: IAutoMovieHumanBodySurface.SolidObserver,
  ): IAutoMovieHumanBodySurface.IOutput {
    const context: IAutoMovieHumanSurfaceContext = {
      mesh: AutoMovieHumanLoftMesh.create(),
      chains: new Map(
        calibration.chains.map(
          (c: IAutoMovieLoftChain): [string, IAutoMovieLoftChain] => [
            c.name,
            c,
          ],
        ),
      ),
      events: calibration.events,
      poles: new Map(
        calibration.poles.map(
          (
            p: IAutoMovieHumanSurfacePole,
          ): [string, IAutoMovieHumanSurfacePole] => [p.chain + ":" + p.end, p],
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
          (c: IAutoMovieLoftChain, i: number): [string, number] => [c.name, i],
        ),
      ),
      coordinates: [],
      webPaths: [],
      pinches: new Set(),
      domeNormals: [],
      roots: new Map(),
      ends: new Map(),
      holes: new Map(),
      rims: new Map(),
    };
    for (const appendage of calibration.appendages ?? []) {
      const list = context.roots.get(appendage.base) ?? [];
      list.push({
        appendage,
        loop: AutoMovieHumanBodyRoots.polygon(
          appendage.root,
          LOOP,
          appendage.winding,
        ),
      });
      context.roots.set(appendage.base, list);
    }
    // Every opening is a trim on its base chains: the declared one, or the
    // chains that hold it, split at the ring two of them share
    // (`AutoMovieHumanApertureSpan`); an eye's along its lid band's outer
    // edge, one rim point per lid sample, which the lid band's columns start
    // from. The openings stay listed for the rows refined near them.
    const spans: [
      IAutoMovieHumanBodyApertures.IPrepared,
      IAutoMovieHumanApertureSpan.ISpan,
    ][] = [];
    for (const opening of context.apertures) {
      const span: IAutoMovieHumanApertureSpan.ISpan | string =
        AutoMovieHumanApertureSpan.of(
          opening,
          opening.aperture.base !== undefined &&
            context.chains.has(opening.aperture.base)
            ? [chain(context, opening.aperture.base)]
            : calibration.chains,
          calibration.events,
        );
      if (typeof span === "string")
        throw new Error(
          `Opening ${opening.aperture.name} lies on no chain or pair of chains sharing a ring: ${span}`,
        );
      if (opening.lid !== null && span.points.length !== opening.edge.length)
        throw new Error(
          `Opening ${opening.aperture.name}: ${opening.edge.length - span.points.length} of ${opening.edge.length} lid band edge points have no foot on the skin`,
        );
      spans.push([opening, span]);
      for (const [name, loop] of span.loops) {
        const list = context.roots.get(name) ?? [];
        list.push({
          opening,
          loop,
          span:
            span.chains.length > 1
              ? AutoMovieHumanApertureSpan.key(opening.aperture.name)
              : undefined,
        });
        context.roots.set(name, list);
      }
    }

    // 1-2. Contact rings and the boundaries they define on both sides.
    for (const event of calibration.events) contact(context, event);

    // 3. Every chain between its two boundaries; bases leave their root
    // loops open.
    const solids: Set<string> =
      AutoMovieHumanBodySurfaceSolids.names(calibration);
    for (const target of calibration.chains)
      if (!solids.has(target.name)) loft(context, target);

    // 3a. The solids: every chain a merge names, drawn as trimmed faces and
    // blends with their rails shared.
    calibration.diagnostics?.push(
      ...AutoMovieHumanBodySurfaceSolids.draw(
        context,
        calibration,
        observeSolids,
      ),
    );

    // 3b. Every appendage joined to its base through its strip, and every
    // opening on a base closed from its trim loop.
    for (const appendage of calibration.appendages ?? [])
      join(context, appendage);
    const construction: IAutoMovieHumanConstructionPath[] = [];
    for (const [opening, span] of spans)
      construction.push(
        ...AutoMovieHumanBodySurfaceOpening.open(
          context,
          opening,
          span,
          calibration.events,
        ),
      );
    construction.push(...context.webPaths);

    const faces: number[] = AutoMovieHumanLoftMesh.normals(context.mesh);
    const nailClipping: NonNullable<
      IAutoMovieHumanBodySurface.IOutput["nailClipping"]
    > =
      AutoMovieHumanNailExteriorClearance.report(
        context.mesh,
        calibration.chains,
      )?.flatMap(
        ({ digit, maximumMm }): { digit: string; maximumMm: number }[] =>
          maximumMm === null ? [] : [{ digit, maximumMm }],
      ) ?? [];
    return {
      mesh: context.mesh,
      construction,
      rims: context.rims,
      ...(nailClipping.length === 0 ? {} : { nailClipping }),
      normals: domed(
        context.domeNormals,
        held(
          context.pinches,
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
