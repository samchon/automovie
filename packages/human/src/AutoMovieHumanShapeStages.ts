import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import type { AutoMovieHumanSkin } from "./appearance/AutoMovieHumanSkin";
import { AutoMovieHumanVermilion } from "./appearance/AutoMovieHumanVermilion";
import { AutoMovieHumanModelParts } from "./AutoMovieHumanModelParts";
import { AutoMovieHumanBodyConstruction } from "./generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodyLaw } from "./generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "./generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanOralCavity } from "./generation/AutoMovieHumanOralCavity";
import { AutoMovieHumanOralCavityAttempt } from "./generation/AutoMovieHumanOralCavityAttempt";
import type { IAutoMovieHumanBodyCalibration } from "./generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanStateAdmission } from "./instance/AutoMovieHumanStateAdmission";
import type { AutoMovieHumanLoftContract } from "./lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanLoftMesh } from "./lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanHermiteCurve } from "./lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftAperture } from "./lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanRig } from "./skeleton/AutoMovieHumanRig";
import type { IAutoMovieHumanParameters } from "./structures/IAutoMovieHumanParameters";
const { part }: typeof AutoMovieHumanModelParts = AutoMovieHumanModelParts;

/**
 * The shape stages of `AutoMovieHuman`: everything the shape fields `body`,
 * `head` and `extremities` decide (the shape law's calibration, the skin
 * pieces, the construction curves, the mouth's interior and the rig), kept
 * per shape so a hair, skin or garment edit costs only its own stages, and
 * the binding of parts to the shape's rig, kept per mesh.
 *
 * `AutoMovieHuman` composes these stages with the skin's dressing and the
 * appearance layer; this module owns their reuse and holds no state besides
 * its {@link AutoMovieHumanShapeStages.KEPT} most recent shapes.
 */
export namespace AutoMovieHumanShapeStages {
  /** The shape stages of one person: everything the shape fields decide. */
  export interface IShape {
    /** Calibration in calibration mm. */
    calibration: IAutoMovieHumanBodyCalibration;

    /** Calibration mm to model metres, including the stature scale. */
    scale: number;

    /** Skin pieces before dressing, calibration mm. */
    skin: AutoMovieHumanLoftMesh.IPiece[];

    /** Lips' colour boundary. */
    vermilion: AutoMovieHumanVermilion.IBoundary;

    /** Mouth interior, or null without a mouth aperture or with a rim that broke its contract. */
    interior: AutoMovieHumanOralCavity.IOutput | null;

    /** Contracts optional pieces broke, each piece replaced by its base. */
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];

    /** Construction parts in model metres. */
    construction: IAutoMovieModelPart[];

    /** Rig bound to the calibration. */
    rig: AutoMovieHumanRig.IRig;

    /**
     * Skin dressings of this shape, most recently used first, by the
     * canonical text of `appearance.skin` and `pigmentation`; at most
     * {@link KEPT}.
     */
    dressings: { key: string; output: AutoMovieHumanSkin.IOutput }[];

    /**
     * Rig-bound meshes by source mesh and part id. A mesh reused by a later
     * generation (a kept dressing, construction or haircut) keeps its
     * binding; weak keys drop the binding with the mesh.
     */
    bound: WeakMap<IAutoMovieMesh, Map<string, IAutoMovieMesh>>;
  }

  /** Shapes kept for reuse, and dressings kept per shape: the current one and the one before. */
  export const KEPT: number = 2;

  /** Shapes, most recently used first; see {@link shaped}. */
  const SHAPES: { key: string; shape: IShape }[] = [];

  /**
   * The shape stages, reused across generations whose shape fields are equal.
   *
   * Dependencies: these stages read only `body`, `head` and `extremities` (the
   * shape law, the surface, its construction, the mouth interior and the
   * rig); `appearance.skin` and `pigmentation` reach the skin's dressing, kept
   * per shape in {@link IShape.dressings}; the rest of `appearance` reaches
   * the appearance layer, which runs every time and reuses its own stages
   * (`AutoMovieHumanHairStage`); and `pose` and `expression` reach none of
   * them. A generation whose shape fields have the same canonical text
   * (`AutoMovieHumanStateAdmission.key`, object keys sorted) therefore reuses
   * the calibration, skin pieces, construction, interior and rig of the
   * earlier one instead of lofting the body again. The text is the full input
   * of these stages, so equal text proves equal work.
   *
   * Retention: the last {@link KEPT} shapes, most recent first. Every model
   * built from one shape shares its construction parts, skin pieces and
   * calibration, which no consumer may mutate.
   *
   * @param params Complete public input
   * @param height Stature, millimetres
   * @returns The shape stages
   */
  export function shaped(params: IAutoMovieHumanParameters, height: number): IShape {
    const key: string = AutoMovieHumanStateAdmission.key({
      body: params.body,
      head: params.head,
      extremities: params.extremities,
    });
    const at: number = SHAPES.findIndex((entry: { key: string; shape: IShape }): boolean => entry.key === key);
    const found: { key: string; shape: IShape } | undefined = at < 0 ? undefined : SHAPES.splice(at, 1)[0];
    const entry: { key: string; shape: IShape } = found ?? { key, shape: shape(params, height) };
    SHAPES.unshift(entry);
    SHAPES.length = Math.min(SHAPES.length, KEPT);
    return entry.shape;
  }

  /**
   * Bind every part to the shape's rig (`AutoMovieHumanRig.dress`), reusing
   * the binding of a mesh this shape has bound before under the same part id:
   * the binding reads only the rig, the positions and the id, all fixed for
   * that mesh object, so the same object proves the same work.
   *
   * @param parts Parts at the bind
   * @param shape Shape whose rig binds them
   * @returns Bound parts, in the order given
   */
  export function bind(parts: IAutoMovieModelPart[], shape: IShape): IAutoMovieModelPart[] {
    const fresh: IAutoMovieModelPart[] = [];
    const out: (IAutoMovieModelPart | null)[] = parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart | null => {
      if (part.geometry.type !== "mesh") return part;
      const mesh: IAutoMovieMesh | undefined = shape.bound.get(part.geometry.mesh)?.get(part.id);
      if (mesh === undefined) {
        fresh.push(part);
        return null;
      }
      return { ...part, geometry: { ...part.geometry, mesh } };
    });
    const dressed: IAutoMovieModelPart[] = AutoMovieHumanRig.dress(fresh, shape.rig);
    dressed.forEach((part: IAutoMovieModelPart, k: number): void => {
      const source: IAutoMovieModelPart = fresh[k]!;
      if (part.geometry.type !== "mesh" || source.geometry.type !== "mesh") return;
      let byId: Map<string, IAutoMovieMesh> | undefined = shape.bound.get(source.geometry.mesh);
      if (byId === undefined) {
        byId = new Map();
        shape.bound.set(source.geometry.mesh, byId);
      }
      byId.set(part.id, part.geometry.mesh);
    });
    let next: number = 0;
    return out.map((part: IAutoMovieModelPart | null): IAutoMovieModelPart => {
      if (part !== null) return part;
      return dressed[next++]!;
    });
  }

  /**
   * Compute the shape stages of one parameter set.
   *
   * @param params Complete public input
   * @param height Stature, millimetres
   * @returns The shape stages
   */
  function shape(params: IAutoMovieHumanParameters, height: number): IShape {
    // The shape law gives this person's calibration in calibration mm; the
    // skin, its construction, the lips, eyes and apertures all read it.
    const law: AutoMovieHumanBodyLaw.IOutput = AutoMovieHumanBodyLaw.calibrate(params);
    const calibration: IAutoMovieHumanBodyCalibration = law.body;
    const lips: IAutoMovieHumanHermiteCurve = law.vermilion;

    // Uniform stature scale about the floor origin, then mm -> m for the
    // engine, whose model units are metres.
    const scale: number = height / calibration.stature / 1000;

    // The lips' colour boundary is drawn per vertex, so the skin is refined
    // in a box 3 mm around it.
    const ends: [number, number, number][] = lips.spans.flatMap(
      (s: IAutoMovieHumanHermiteCurve["spans"][number]): [number, number, number][] => [s.start, s.end],
    );
    const box: [[number, number, number], [number, number, number]] = [
      [0, 1, 2].map((k: number): number => Math.min(...ends.map((p: [number, number, number]): number => p[k]!)) - 3) as [number, number, number],
      [0, 1, 2].map((k: number): number => Math.max(...ends.map((p: [number, number, number]): number => p[k]!)) + 3) as [number, number, number],
    ];
    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(calibration, [box]);
    const skin: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals);
    const curves: AutoMovieHumanBodyConstruction.ICurve[] = AutoMovieHumanBodyConstruction.generate(calibration, surface.construction);

    const vermilion: AutoMovieHumanVermilion.IBoundary = AutoMovieHumanVermilion.prepare(lips);
    curves.push(
      ...AutoMovieHumanBodyConstruction.paths([
        {
          id: lips.chain + "/" + lips.name.replaceAll(".", "_"),
          points: vermilion.points,
          closed: true,
        },
      ]),
    );

    // The mouth's interior behind the rim the `mouth` aperture cut; a rim that
    // breaks its contract leaves the mouth closed and is recorded, after what
    // the body law's pieces recorded.
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [...(calibration.diagnostics ?? [])];
    const opening: IAutoMovieHumanLoftAperture | undefined = calibration.apertures.find(
      (a: IAutoMovieHumanLoftAperture): boolean => a.name === "mouth",
    );
    const interior: AutoMovieHumanOralCavity.IOutput | null =
      calibration.mouth === undefined || opening === undefined
        ? null
        : AutoMovieHumanOralCavityAttempt.attempt(surface.mesh, calibration.mouth, opening, scale, diagnostics);

    const construction: IAutoMovieModelPart[] = curves.map(
      (curve: AutoMovieHumanBodyConstruction.ICurve): IAutoMovieModelPart =>
        part(
          "human.construction." + curve.id,
          curve.kind === "axis" ? "construction.axes" : curve.kind === "guide" ? "construction.guides" : "construction.sections",
          curve.mesh,
          AutoMovieHumanLoftMesh.normals(curve.mesh),
          scale,
        ),
    );

    const rig: AutoMovieHumanRig.IRig = AutoMovieHumanRig.prepare(calibration, scale);
    return {
      calibration,
      scale,
      skin,
      vermilion,
      interior,
      construction,
      rig,
      diagnostics,
      dressings: [],
      bound: new WeakMap(),
    };
  }
}
