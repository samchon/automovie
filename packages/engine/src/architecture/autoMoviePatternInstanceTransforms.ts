import { IAutoMovieExplicitInstanceTransform } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { positive } from "../geometry/positive";
import { IAutoMoviePatternFaceFrame } from "./IAutoMoviePatternFaceFrame";
import { IAutoMoviePatternFacet } from "./IAutoMoviePatternFacet";
import { IAutoMoviePatternInstancing } from "./IAutoMoviePatternInstancing";
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
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `autoMoviePatternInstanceTransforms` turns whole occurrences into exact instance slots and names the ones that cannot be. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `autoMoviePatternInstanceTransforms` performs pattern instance transforms derivation when the engine resolves the declared physical-module pattern deterministically.
 * @evidence requirements/interior/grain-seams-and-continuity.md#interior-grain-corner-continuity `autoMoviePatternInstanceTransforms` maps developed face coordinates back through each folded or curved facet frame so grain-bearing pieces retain their corner relation on the host.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-joint-edge-grain-continuity The instance transforms preserve the declared developed-to-host relation that carries grain and seam continuity across facets.
 * @evidence requirements/building-exterior/patterns-and-instances.md#building-exterior-instance-exceptions `autoMoviePatternInstanceTransforms` keeps cut occurrences as separately identified exceptions while preserving exact prototype transforms for whole repeated pieces.
 * @evidence specifications/building-envelope/external-assets-patterns-and-instances.md#building-envelope-instance-local-stability-invariant The lowering preserves stable occurrence identity and local transforms while refusing to disguise cut exceptions as ordinary instances.
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
  const flat = resolveFacet({ u: 0, v: 0 }, props.frame, "pattern face frame");
  const panels = resolveFacets(props.result, props.facets ?? []);
  const transforms: IAutoMovieExplicitInstanceTransform[] = [];
  const cut: string[] = [];
  for (const placement of props.result.placements) {
    if (placement.cut !== "none") {
      cut.push(placement.id);
      continue;
    }
    const panel = panels.get(placement.zone) ?? flat;
    const { u, v, normal } = panel;
    const angle = placement.rotationDeg * Quaternion.DEG2RAD;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const axisU = Vector3.add(Vector3.scale(u, cosine), Vector3.scale(v, sine));
    const axisV = Vector3.cross(normal, axisU);
    const translation = Vector3.add(
      panel.origin,
      Vector3.add(
        Vector3.scale(u, placement.center.u - panel.anchor.u),
        Vector3.scale(v, placement.center.v - panel.anchor.v),
      ),
    );
    const rotation = Quaternion.normalize(
      Matrix4.decompose([
        axisU.x,
        axisU.y,
        axisU.z,
        0,
        axisV.x,
        axisV.y,
        axisV.z,
        0,
        normal.x,
        normal.y,
        normal.z,
        0,
        translation.x,
        translation.y,
        translation.z,
        1,
      ]).rotation,
    );
    const slot: IAutoMovieExplicitInstanceTransform = {
      id: placement.id,
      translation,
      rotation,
      scale: {
        x: placement.size.u,
        y: placement.size.v,
        z: props.thickness,
      },
    };
    if (props.prototypes !== undefined) {
      const prototype = props.prototypes[placement.variant];
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
