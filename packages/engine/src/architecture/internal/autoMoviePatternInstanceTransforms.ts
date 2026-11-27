import {
  IAutoMovieExplicitInstanceTransform,
  type IAutoMoviePatternFaceFrame,
  type IAutoMoviePatternFacet,
  type IAutoMoviePatternInstanceTransforms,
  type IAutoMoviePatternInstancing,
  type IAutoMoviePatternPoint,
  type IAutoMoviePatternZoneQuantities,
  type IAutoMovieSurfacePatternResult,
  IAutoMovieVector3,
} from "@automovie/interface";

import { positive } from "../../geometry/internal/positive";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { quaternionFromAutoMovieBasis } from "../../math/internal/quaternionFromAutoMovieBasis";

/*
 * Turn whole occurrences into computed instance slots and name the ones that
 * cannot be.
 *
 * A repeated module is a GPU instance, never duplicated vertex data, so the
 * whole modules leave here as explicit full-TRS slots: the occurrence id
 * becomes the slot id, the in-plane rotation becomes a real unit quaternion
 * rather than a yaw, and the module's two face dimensions plus its thickness
 * become a per-axis scale rather than a uniform one. A prototype table, when
 * given, is indexed by the occurrence's own seeded variant, so the variation
 * the run drew is the variation the instancer draws.
 *
 * A cut piece is not an instance and is not pretended to be one. Scaling a
 * whole module down to a cut piece's bounding box would render a tile that is
 * the wrong shape and the wrong size, so cut occurrences are returned by id for
 * the caller to build as geometry.
 *
 * The prototype's local `+X` maps to the module's U extent, local `+Y` to its V
 * extent, and local `+Z` to the face normal, which is `u × v`.
 *
 * A host that folds at a corner or curves is one developed face standing on
 * several flat panels, so a zone may name its own IAutoMoviePatternFacet
 * and every zone that does not stays on frame.
 *
 * Throws when the thickness is not a finite positive number, a frame or facet
 * value is not finite, an axis is not unit length or the two axes are not
 * perpendicular within `1e-6`, a facet names a zone the run did not lay or
 * repeats one, or an occurrence's variant has no entry in `prototypes`.
 */
export function autoMoviePatternInstanceTransforms(
  props: IAutoMoviePatternInstanceTransforms.IProps,
): IAutoMoviePatternInstancing {
  positive(props.thickness, "pattern module thickness");
  const flat: IResolvedPanel = resolvePanel(
    { u: 0, v: 0 },
    props.frame,
    "pattern face frame",
  );
  const panels: Map<string, IResolvedPanel> = resolveFacets(
    props.result,
    props.facets ?? [],
  );
  const transforms: IAutoMovieExplicitInstanceTransform[] = [];
  const cut: string[] = [];
  for (const placement of props.result.placements) {
    if (placement.cut !== "none") {
      cut.push(placement.id);
      continue;
    }
    const panel: IResolvedPanel = panels.get(placement.zone) ?? flat;
    const angle: number = placement.rotationDeg * AutoMovieEngineQuaternion.DEG2RAD;
    const axisU: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(panel.u, Math.cos(angle)),
      AutoMovieEngineVector3.scale(panel.v, Math.sin(angle)),
    );
    const slot: IAutoMovieExplicitInstanceTransform = {
      id: placement.id,
      translation: AutoMovieEngineVector3.add(
        panel.origin,
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(panel.u, placement.center.u - panel.anchor.u),
          AutoMovieEngineVector3.scale(panel.v, placement.center.v - panel.anchor.v),
        ),
      ),
      rotation: quaternionFromAutoMovieBasis(
        axisU,
        AutoMovieEngineVector3.cross(panel.normal, axisU),
        panel.normal,
      ),
      scale: {
        x: placement.size.u,
        y: placement.size.v,
        z: props.thickness,
      },
    };
    if (props.prototypes !== undefined) {
      const prototype: string | undefined = props.prototypes[placement.variant];
      if (prototype === undefined)
        throw new Error(
          `pattern occurrence "${placement.id}" draws variant ${placement.variant}, which the ${props.prototypes.length} declared prototypes do not cover`,
        );
      slot.prototype = prototype;
    }
    transforms.push(slot);
  }
  return { transforms, cut };
}

/*
 * One panel's approximate orthonormal world basis and developed anchor.
 */
interface IResolvedPanel {
  /*
   * Face-local metre point origin sits at.
   */
  anchor: IAutoMoviePatternPoint;

  /*
   * World point the panel is measured from.
   */
  origin: IAutoMovieVector3;

  /*
   * Unit world direction of the panel's U axis.
   */
  u: IAutoMovieVector3;

  /*
   * Unit world direction of the panel's V axis.
   */
  v: IAutoMovieVector3;

  /*
   * Computed world face normal, `u × v`, under the approximate frame checks.
   */
  normal: IAutoMovieVector3;
}

/*
 * Index each declared quantity zone's facet, including zones with no survivors.
 */
const resolveFacets: (
  result: IAutoMovieSurfacePatternResult,
  facets: readonly IAutoMoviePatternFacet[],
) => Map<string, IResolvedPanel> = (
  result: IAutoMovieSurfacePatternResult,
  facets: readonly IAutoMoviePatternFacet[],
): Map<string, IResolvedPanel> => {
  const zones: Set<string> = new Set(
    result.quantities.zones.map(
      (one: IAutoMoviePatternZoneQuantities): string => one.zone,
    ),
  );
  const panels: Map<string, IResolvedPanel> = new Map();
  for (const facet of facets) {
    if (!zones.has(facet.zone))
      throw new Error(
        `pattern facet names zone "${facet.zone}", which pattern "${result.id}" did not lay`,
      );
    if (panels.has(facet.zone))
      throw new Error(`pattern facet zone "${facet.zone}" must be unique`);
    panels.set(
      facet.zone,
      resolvePanel(
        facet.anchor,
        facet.frame,
        `pattern facet "${facet.zone}" frame`,
      ),
    );
  }
  return panels;
};

/*
 * Validate one frame and anchor against the approximate orthonormality
 * tolerance.
 */
const resolvePanel: (
  anchor: IAutoMoviePatternPoint,
  frame: IAutoMoviePatternFaceFrame,
  label: string,
) => IResolvedPanel = (
  anchor: IAutoMoviePatternPoint,
  frame: IAutoMoviePatternFaceFrame,
  label: string,
): IResolvedPanel => {
  const u: IAutoMovieVector3 = unitAxis(frame.u, `${label} u`);
  const v: IAutoMovieVector3 = unitAxis(frame.v, `${label} v`);
  if (Math.abs(AutoMovieEngineVector3.dot(u, v)) > 1e-6)
    throw new Error(`${label} axes must be perpendicular`);
  return { anchor, origin: frame.origin, u, v, normal: AutoMovieEngineVector3.cross(u, v) };
};

/*
 * Refuse an axis that is not finite or not unit length within `1e-6`.
 */
const unitAxis: (
  axis: IAutoMovieVector3,
  label: string,
) => IAutoMovieVector3 = (
  axis: IAutoMovieVector3,
  label: string,
): IAutoMovieVector3 => {
  if (Math.abs(AutoMovieEngineVector3.length(axis) - 1) > 1e-6)
    throw new Error(`${label} must be a unit vector`);
  return axis;
};

/*
 * Refuse a vector with a non-finite component.
 */
