import type { AutoMovieArchetypeArmour } from "@automovie/archetypes";
import { Quaternion, Vector3, AutoMoviePhysicalHullFaces, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Independent observations of actual armour meshes and their actual colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines model-metre observations of emitted vertices and current hulls, without reading producer profile dimensions or generation formulas.
 * @evidence contracts/development/design.md#principled-representation Actual artifact vertices provide bounds/radii and the engine's signed-distance query observes actual colliders; no primitive type stands in for a cavity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four observations serve the existing band/fit units and the new actual form/cavity unit; no renderer or fixture-specific producer hook is exported.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Mesh absence and empty selections fail rather than falling back to public dimension metadata or an expected primitive.
 */
export namespace armourActual {
  /**
   * Read transformed positions from actual selected emitted meshes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual model input, optional part-id prefix, model-metre fresh output and failure for missing mesh geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Apply each actual part's TRS to its emitted mesh positions with engine quaternion/vector arithmetic; source dimensions and profile metadata are not read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select actual parts, refuse nonmeshes, then transform each emitted position.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No expected geometry or producer formula supplies positions, and an empty or changed representation cannot silently pass.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V) work and fresh vector storage for selected actual vertices.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All three numerical units share this artifact reader rather than repeating producer-specific shape inspection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only newly observed scalar coordinates escape; source arrays, model and completed observations are not retained.
   */
  export function points(
    piece: ReturnType<typeof AutoMovieArchetypeArmour.create>,
    prefix?: string,
  ): IAutoMovieVector3[] {
    const output: IAutoMovieVector3[] = [];
    for (const part of piece.parts) {
      if (prefix !== undefined && !part.id.startsWith(prefix)) continue;
      if (part.geometry.type !== "mesh" || part.transform === null)
        throw new Error(
          `Armour ${part.id} has no actual transformed wall mesh`,
        );
      const positions: number[] = part.geometry.mesh.positions;
      for (let index: number = 0; index < positions.length; index += 3) {
        const local: IAutoMovieVector3 = {
          x: positions[index]! * part.transform.scale.x,
          y: positions[index + 1]! * part.transform.scale.y,
          z: positions[index + 2]! * part.transform.scale.z,
        };
        output.push(
          Vector3.add(
            part.transform.translation,
            Quaternion.rotateVector(part.transform.rotation, local),
          ),
        );
      }
    }
    if (output.length === 0)
      throw new Error(`Armour selection ${prefix} has no actual points`);
    return output;
  }

  /**
   * Exact coordinate extrema of the actual selected emitted vertices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States model-metre low/high coordinates and an optional source part prefix, with fresh results and empty-selection refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Coordinate minima/maxima of the artifact positions give the actual polyhedral envelope, independently of museum or producer dimensions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read actual points once and reduce every coordinate into two fresh extrema records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No model dimension, generated profile, assumed box or tolerance padding replaces an actual extremum.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V) work/storage through the actual point reader; no geometric inverse or mesh regeneration.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the actual TRS reader and serves both literal record and fitted-section observations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two independent vectors and retains neither model nor observed arrays.
   */
  export function bounds(
    piece: ReturnType<typeof AutoMovieArchetypeArmour.create>,
    prefix?: string,
  ): { low: IAutoMovieVector3; high: IAutoMovieVector3 } {
    const vertices: IAutoMovieVector3[] = points(piece, prefix);
    const low: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
    const high: IAutoMovieVector3 = {
      x: -Infinity,
      y: -Infinity,
      z: -Infinity,
    };
    for (const point of vertices)
      for (const axis of ["x", "y", "z"] as const) {
        low[axis] = Math.min(low[axis], point[axis]);
        high[axis] = Math.max(high[axis], point[axis]);
      }
    return { low, high };
  }

  /**
   * Observe the existing nominal plate clearance at its physical fitting site.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admitted body and actual emitted model, actual normal wall gauge at helmet/limb/cuff faces, exact torso side thickness and absent mail plate.
   * @evidence contracts/development/implementation.md#principled-implementation Actual radial cell hulls have opposite inner/outer plane offsets, whose sum is normal gauge; axial end planes are excluded by their direction. Torso side-wall X span gives its actual thickness. Polygon corner radius is not a curved primitive's radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Branch only by the documented measurement site, then observe actual emitted vertices or bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads no profile or dimension thickness, does not treat a mitten's unmeasured palm as a forearm and does not infer clearance from a filled proxy primitive.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V) actual observation with one maximum or extrema reduction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses actual points/bounds for both fixed band ends and the independent canonical-body sweep.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a scalar observation escapes; no body, model, buffer or completed result is retained.
   */
  export function plate(
    kind: AutoMovieArchetypeArmour.Kind,
    piece: ReturnType<typeof AutoMovieArchetypeArmour.create>,
    measure: IAutoMovieBodyMeasure,
  ): number {
    if (kind === "mail") return 0;
    if (kind === "cuirass") {
      const section: ReturnType<typeof bounds> = bounds(piece, "side-1");
      return section.high.x - section.low.x;
    }
    const helmet: boolean = kind.endsWith("Helmet");
    const prefix: string = helmet
      ? "bowl"
      : kind === "gauntlet"
        ? "cuff"
        : "guard";
    const radius: number = helmet
      ? measure.headRadius + 0.75 * 0.0254
      : kind === "greave"
        ? measure.shankRadius
        : measure.forearmRadius;
    const gauges: number[] = [];
    for (const shape of piece.shapes()) {
      if (!shape.id.startsWith(prefix) || shape.kind !== "hull") continue;
      const faces: IAutoMoviePhysicalHullFaces.IFace[] = AutoMoviePhysicalHullFaces.build(
        shape.points,
      ).faces.filter(
        (face: IAutoMoviePhysicalHullFaces.IFace): boolean =>
          helmet || Math.abs(face.normal.y) < 1e-12,
      );
      const inside: number = Math.min(
        ...faces.map(
          (face: IAutoMoviePhysicalHullFaces.IFace): number => face.offset,
        ),
      );
      if (Math.abs(inside + radius) > 1e-12)
        throw new Error(
          `${shape.id} does not preserve its independently measured body/padding boundary`,
        );
      gauges.push(
        Math.max(
          ...faces.map(
            (face: IAutoMoviePhysicalHullFaces.IFace): number => face.offset,
          ),
        ) + inside,
      );
    }
    if (gauges.length === 0)
      throw new Error("Armour has no measured radial wall cells");
    return Math.min(...gauges);
  }

  /**
   * Signed distance to the actual declared closed wall-cell colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States model-metre query point, optional part prefix and minimum signed distance, negative in any actual wall cell.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's physicalShapeNearest point query evaluates current actual hull geometry with identity parent pose and each declared part transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select actual colliders and reduce their signed point distances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hollow body's overall convex hull, expected cavity formula or visual-only geometry never supplies containment.
   * @evidence contracts/development/implementation.md#efficient-algorithms One engine point query per selected actual cell; each query reuses the engine's prepared hull topology.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the public archetype's actual shapes and engine signed-distance owner for all cavity witnesses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Query records are local; no model, collider list or signed-distance result is cached.
   */
  export function distance(
    piece: ReturnType<typeof AutoMovieArchetypeArmour.create>,
    point: IAutoMovieVector3,
    prefix?: string,
  ): number {
    const pose: IAutoMovieRigidTransform = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const shapes: IAutoMoviePhysicalShape[] = piece
      .shapes()
      .filter(
        (shape: IAutoMoviePhysicalShape): boolean =>
          prefix === undefined || shape.id.startsWith(prefix),
      );
    if (shapes.length === 0)
      throw new Error("Armour has no actual wall colliders");
    return Math.min(
      ...shapes.map(
        (shape: IAutoMoviePhysicalShape): number =>
          AutoMovieEnginePhysics.physicalShapeNearest(pose, shape, point, point).distance,
      ),
    );
  }
}
