import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeRefusal } from "../core";
import type { QuadrupedEquipment } from "./QuadrupedEquipment";

/**
 * Actual additional body spheres used by the common equipment preflight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical model metres, real producer-owned spheres, analytic finite-cylinder/box separation, conservative top support and outward binary64 rounding.
 * @evidence contracts/development/design.md#principled-representation Private independent sphere copies describe the same solids emitted by the producer. Analytic finite-cylinder distances and the engine's point-to-box distance admit real equipment; a conservative upper support envelope determines connected bridge height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The equipment plan delegates its live additional-sphere admission and pack bridge support here; species construction and emitted geometry retain their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species branch, obstacle-specific offset, hidden tolerance, mesh proxy, guessed anatomy or render-only displacement supplies clearance.
 */
export class QuadrupedEquipmentSolids {
  /** Independent records of the actual additional body spheres. */
  readonly #spheres: readonly QuadrupedEquipment.ISphere[];
  /** Producer identity for an actionable physical refusal. */
  readonly #archetype: string;

  /**
   * Copy actual body spheres without retaining producer-owned records.
   *
   * @param archetype Actual producer identity for structured equipment refusals.
   * @param spheres Actual emitted sphere identities, positive finite radii and finite centres in neutral model metres; the plan supplies an empty list by default.
   * @throws {RangeError} For a nonpositive/nonfinite sphere radius or nonfinite centre.
   */
  public constructor(
    archetype: string,
    spheres: readonly QuadrupedEquipment.ISphere[],
  ) {
    this.#archetype = archetype;
    this.#spheres = spheres.map(
      (sphere: QuadrupedEquipment.ISphere): QuadrupedEquipment.ISphere => {
        if (
          !(Number.isFinite(sphere.radius) && sphere.radius > 0) ||
          ![sphere.centre.x, sphere.centre.y, sphere.centre.z].every(
            Number.isFinite,
          )
        )
          throw new RangeError(
            "Additional equipment body spheres must be finite and positive",
          );
        return {
          id: sphere.id,
          radius: sphere.radius,
          centre: { ...sphere.centre },
        };
      },
    );
  }

  /**
   * Support a horizontal X bridge above every sphere intersecting its footprint.
   *
   * @param minimum Already admitted finite positive lower height from the ordinary trunk envelope, metres.
   * @param halfSpan Already admitted finite positive bridge half-length along X, metres.
   * @param z Already admitted finite fore-aft bridge plane in the neutral model, metres.
   * @param radius Already admitted finite positive circular bar radius, metres.
   * @param clearance Already admitted finite nonnegative body separation, metres.
   * @returns A conservative upper support plane; the caller connects the raised beam to its rails.
   * @throws {ArchetypeRefusal} If the derived support height is nonfinite.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names actual bridge footprint, finite metre inputs, additional solid support and the conservative sphere-top choice rather than a minimum-height fit.
   * @evidence contracts/development/implementation.md#principled-implementation A sphere whose radius-plus-bar-plus-clearance reaches the finite XZ segment contributes its top plus bar radius and clearance. Each sum rounds outward to the next representable binary64 value, so representation cannot lower a support plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Inspect each sphere's XZ distance, raise the common support plane when needed and admit its finite result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither clearance nor a collision tolerance is changed. No species name, fixture constant, iterative search or invisible displacement is used; the emitted connecting posts consume this actual height.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) arithmetic for S additional spheres and one call-local eight-byte rounding view; no model, mesh, solver or geometry search is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both pack bridge planes share the actual producer sphere records and this support owner; later primitive admission verifies their real solids.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no bridge input or rounding view; the owner keeps O(S) independent sphere copies for its own lifetime.
   */
  public above(
    minimum: number,
    halfSpan: number,
    z: number,
    radius: number,
    clearance: number,
  ): number {
    let height: number = minimum;
    if (this.#spheres.length === 0) return height;
    const view: DataView = new DataView(new ArrayBuffer(8));
    for (const sphere of this.#spheres) {
      const dx: number = Math.max(0, Math.abs(sphere.centre.x) - halfSpan);
      const reach: number = sphere.radius + radius + clearance;
      if (Math.hypot(dx, z - sphere.centre.z) >= reach) continue;
      let top: number = sphere.centre.y;
      for (const amount of [sphere.radius, radius, clearance])
        top = up(top + amount);
      height = Math.max(height, top);
    }
    if (!Number.isFinite(height))
      this.refuse("pack.bridge", height, "support envelope");
    return height;

    /** Round a finite sum outward, without replacing the physical clearance by a tolerance. */
    function up(value: number): number {
      if (!Number.isFinite(value)) return value;
      if (value === 0) return Number.MIN_VALUE;
      view.setFloat64(0, value, false);
      view.setBigUint64(
        0,
        view.getBigUint64(0, false) + (value > 0 ? 1n : -1n),
        false,
      );
      return view.getFloat64(0, false);
    }
  }

  /**
   * Admit a real finite capped cylinder against each additional body sphere.
   *
   * @param id Actual cylinder identity used by refusal facts.
   * @param radius Already admitted positive finite cylinder radius, metres.
   * @param from First admitted finite cylinder endpoint in the neutral model, metres.
   * @param to Second admitted finite endpoint with positive finite span, metres.
   * @param clearance Already admitted finite nonnegative body separation, metres; the plan defaults it to zero.
   * @throws {ArchetypeRefusal} If any actual sphere lacks the required cylinder separation, including a nonfinite computed distance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual cylinder endpoints/radius, authored clearance and exact finite axial/radial distance to a solid cylinder.
   * @evidence contracts/development/implementation.md#principled-implementation Project the sphere centre onto the cylinder axis, subtract its circular radius from radial distance and its finite span from axial distance. The hypotenuse of the two nonnegative outside distances must reach sphere radius plus clearance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One axis preparation, then one analytic distance and ordinary structured refusal per intersecting sphere.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The engine exposes capsule distance but no flat-capped cylinder distance. A capsule would add hemispherical ends absent from these real bars, so this owner uses their finite-cylinder geometry directly. Intersection is refused without a tolerance, clipping or shape change.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) arithmetic in constant auxiliary storage, without a mesh query or solver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every yoke, rail, post, bridge and hook cylinder uses this admission after the common plan validates its positive span.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps no cylinder, query or builder; only this owner's private sphere records remain.
   */
  public rod(
    id: string,
    radius: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    clearance: number,
  ): void {
    const dx: number = to.x - from.x;
    const dy: number = to.y - from.y;
    const dz: number = to.z - from.z;
    const length: number = Math.hypot(dx, dy, dz);
    for (const sphere of this.#spheres) {
      const x: number = sphere.centre.x - from.x;
      const y: number = sphere.centre.y - from.y;
      const z: number = sphere.centre.z - from.z;
      const axial: number =
        x * (dx / length) + y * (dy / length) + z * (dz / length);
      const radial: number = Math.hypot(
        x - axial * (dx / length),
        y - axial * (dy / length),
        z - axial * (dz / length),
      );
      const distance: number = Math.hypot(
        Math.max(0, radial - radius),
        Math.max(0, -axial, axial - length),
      );
      if (!(distance >= sphere.radius + clearance))
        this.refuse(
          id,
          { radius, from, to, clearance, sphere: sphere.id },
          sphere.id,
        );
    }
  }

  /**
   * Admit a real axis-aligned side pad against each additional body sphere.
   *
   * @param id Actual side-pad identity used by geometry and refusal facts.
   * @param size Already admitted positive finite full box lengths, metres.
   * @param at Already admitted finite box centre in the neutral model frame, metres.
   * @param clearance Already admitted finite nonnegative body separation, metres; the plan defaults it to zero.
   * @throws {ArchetypeRefusal} If any actual sphere lacks the required box separation, including a nonfinite engine distance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual full box sizes/centre and authored minimum body clearance in canonical metres.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's exact point-to-box signed distance must reach sphere radius plus clearance. Coincident segment endpoints select its point query, with no iterative segment search.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Describe the actual box once, query each sphere centre through the existing engine owner and refuse overlap.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A side pad cannot pass through an additional real body solid; no surface-only marker, tolerance, clipping or guessed species dimension hides intersection.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) scalar arithmetic in constant auxiliary storage, without meshes or fitting.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both actual side pads reuse physicalShapeSegmentDistance rather than introducing another point-to-box distance formula; shape material identity is inert metadata for this geometry-only query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no box, body or builder; refusal owns only ordinary diagnostic facts.
   */
  public box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    clearance: number,
  ): void {
    const pose: IAutoMovieRigidTransform = {
      position: at,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const shape: IAutoMoviePhysicalShape = {
      id,
      material: id,
      kind: "box",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      halfExtents: { x: size.x / 2, y: size.y / 2, z: size.z / 2 },
    };
    for (const sphere of this.#spheres) {
      const distance: number = physicalShapeSegmentDistance(
        pose,
        shape,
        sphere.centre,
        sphere.centre,
      );
      if (!(distance >= sphere.radius + clearance))
        this.refuse(id, { size, at, clearance, sphere: sphere.id }, sphere.id);
    }
  }

  /**
   * Preserve a physically impossible equipment-solid request as an ordinary refusal.
   *
   * @param axis Actual equipment part or derived support identity.
   * @param value Original geometry and obstacle facts, without an invented feasible interval.
   * @param obstacle Actual interfering body-sphere identity or nonfinite support-envelope description.
   * @throws {ArchetypeRefusal} Always, retaining only ordinary request facts and an actionable authored-fit correction.
   */
  private refuse(axis: string, value: unknown, obstacle: string): never {
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: this.#archetype,
      axis: `equipment.${axis}`,
      value,
      feasible: null,
      reason: `the real equipment must remain outside ${obstacle} with its authored clearance`,
      fix: "change the authored equipment dimensions or choose an explicitly compatible body reference",
    });
  }
}
