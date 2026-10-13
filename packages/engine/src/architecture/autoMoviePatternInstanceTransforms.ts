import {
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { quaternionFromAutoMovieBasis } from "../math/quaternionFromAutoMovieBasis";
import { IAutoMoviePatternFaceFrame } from "./IAutoMoviePatternFaceFrame";
import { IAutoMoviePatternFacet } from "./IAutoMoviePatternFacet";
import { IAutoMoviePatternInstancing } from "./IAutoMoviePatternInstancing";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";
import { IAutoMoviePatternZoneQuantities } from "./IAutoMoviePatternZoneQuantities";
import { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";

/**
 * Turn whole occurrences into exact instance slots and name the ones that
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
 * several flat panels, so a zone may name its own {@link IAutoMoviePatternFacet}
 * and every zone that does not stays on {@link frame}.
 *
 * Throws when the thickness is not a finite positive number, a frame or facet
 * value is not finite, an axis is not unit length or the two axes are not
 * perpendicular within `1e-6`, a facet names a zone the run did not lay or
 * repeats one, or an occurrence's variant has no entry in `prototypes`.
 *
 * @evidence contracts/common.md#principled-implementation Each slot's rotation is the unit quaternion of the orthonormal right-handed basis `(U·cos θ + V·sin θ, N × that, N)` read with Shepperd's method in `quaternionFromAutoMovieBasis`, and its translation is the developed offset from the panel anchor along the panel's U and V; the frame checks establish the orthonormal premise within `1e-6`.
 * @evidence contracts/common.md#clear-and-simple-design Validates and resolves every panel once, then maps each whole placement to one slot; the slot shape is the interface's explicit instance transform, so no second instancing record is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no zone, module or production; a cut piece is reported for geometry instead of being approximated by a scaled whole module, and a missing prototype throws instead of falling back to the set default.
 * @evidence contracts/common.md#meaningful-documentation States why whole modules become slots and cut ones do not, how id, rotation, scale and prototype are derived, the local axis mapping, the facet rule, the metre unit of thickness, and every throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the placement count plus the facet count, with constant work per whole placement; panels are resolved once into a map keyed by zone so each placement looks its panel up in constant time.
 * @evidence contracts/performance.md#reuse-equivalent-work Every placement of a zone reuses that zone's resolved panel basis instead of re-validating its frame; nothing is reused across calls, since the result and frames are inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The panel map is dropped on return; the caller owns the slots and cut ids, together bounded by the placement count.
 */
export const autoMoviePatternInstanceTransforms = (props: {
  result: IAutoMovieSurfacePatternResult;
  frame: IAutoMoviePatternFaceFrame;
  /** Panels the folded or curved zones return onto; the rest use `frame`. */
  facets?: readonly IAutoMoviePatternFacet[];
  /** Module thickness along the face normal in metres, strictly above zero. */
  thickness: number;
  /** Prototype ids indexed by variant; omitted leaves the set default. */
  prototypes?: readonly string[];
}): IAutoMoviePatternInstancing => {
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
    const angle: number = placement.rotationDeg * Quaternion.DEG2RAD;
    const axisU: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(panel.u, Math.cos(angle)),
      Vector3.scale(panel.v, Math.sin(angle)),
    );
    const slot: IAutoMovieExplicitInstanceTransform = {
      id: placement.id,
      translation: Vector3.add(
        panel.origin,
        Vector3.add(
          Vector3.scale(panel.u, placement.center.u - panel.anchor.u),
          Vector3.scale(panel.v, placement.center.v - panel.anchor.v),
        ),
      ),
      rotation: quaternionFromAutoMovieBasis(
        axisU,
        Vector3.cross(panel.normal, axisU),
        panel.normal,
      ),
      scale: {
        x: placement.size.u,
        y: placement.size.v,
        z: props.thickness,
      },
    };
    if (props.prototypes !== undefined) {
      const prototype: string | undefined =
        props.prototypes[placement.variant];
      if (prototype === undefined)
        throw new Error(
          `pattern occurrence "${placement.id}" draws variant ${placement.variant}, which the ${props.prototypes.length} declared prototypes do not cover`,
        );
      slot.prototype = prototype;
    }
    transforms.push(slot);
  }
  return { transforms, cut };
};

/** One panel's orthonormal world basis and the developed point it stands at. */
interface IResolvedPanel {
  /** Face-local metre point {@link origin} sits at. */
  anchor: IAutoMoviePatternPoint;

  /** World point the panel is measured from. */
  origin: IAutoMovieVector3;

  /** Unit world direction of the panel's U axis. */
  u: IAutoMovieVector3;

  /** Unit world direction of the panel's V axis. */
  v: IAutoMovieVector3;

  /** Unit world face normal, `u × v`. */
  normal: IAutoMovieVector3;
}

/** The panel each zone returns onto, refusing a facet nothing was laid in. */
const resolveFacets = (
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

/** Validate one frame and anchor into an orthonormal panel. */
const resolvePanel = (
  anchor: IAutoMoviePatternPoint,
  frame: IAutoMoviePatternFaceFrame,
  label: string,
): IResolvedPanel => {
  const u: IAutoMovieVector3 = unitAxis(frame.u, `${label} u`);
  const v: IAutoMovieVector3 = unitAxis(frame.v, `${label} v`);
  finiteVector(frame.origin, `${label} origin`);
  if (!Number.isFinite(anchor.u) || !Number.isFinite(anchor.v))
    throw new Error(`${label} anchor must be finite`);
  if (Math.abs(Vector3.dot(u, v)) > 1e-6)
    throw new Error(`${label} axes must be perpendicular`);
  return { anchor, origin: frame.origin, u, v, normal: Vector3.cross(u, v) };
};

/** Refuse an axis that is not finite or not unit length within `1e-6`. */
const unitAxis = (
  axis: IAutoMovieVector3,
  label: string,
): IAutoMovieVector3 => {
  finiteVector(axis, label);
  if (Math.abs(Vector3.length(axis) - 1) > 1e-6)
    throw new Error(`${label} must be a unit vector`);
  return axis;
};

/** Refuse a vector with a non-finite component. */
const finiteVector = (value: IAutoMovieVector3, label: string): void => {
  if (![value.x, value.y, value.z].every(Number.isFinite))
    throw new Error(`${label} must be finite`);
};

/** Refuse a value that is not a finite number above zero. */
const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};
