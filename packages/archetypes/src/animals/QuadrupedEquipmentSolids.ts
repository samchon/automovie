import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeRefusal } from "../core";
import type { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";

/** Additional body spheres used by the common equipment preflight. */
export class QuadrupedEquipmentSolids {
  /** Independent records of the additional body spheres. */
  readonly #spheres: readonly AutoMovieArchetypeQuadrupedEquipment.ISphere[];
  /** Producer identity for an actionable physical refusal. */
  readonly #archetype: string;

  /**
   * Copy body spheres without retaining producer-owned records.
   *
   * @param archetype Producer identity for structured equipment refusals.
   * @param spheres Emitted sphere identities, positive finite radii and finite
   *   centres in neutral model metres; the plan supplies an empty list by
   *   default.
   * @throws {RangeError} For a nonpositive/nonfinite sphere radius or nonfinite
   *   centre.
   */
  public constructor(
    archetype: string,
    spheres: readonly AutoMovieArchetypeQuadrupedEquipment.ISphere[],
  ) {
    this.#archetype = archetype;
    this.#spheres = spheres.map(
      (
        sphere: AutoMovieArchetypeQuadrupedEquipment.ISphere,
      ): AutoMovieArchetypeQuadrupedEquipment.ISphere => {
        if (!(sphere.radius > 0))
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
   * Support a horizontal X bridge above every sphere intersecting its
   * footprint.
   *
   * @param minimum Already admitted finite positive lower height from the
   *   ordinary trunk envelope, metres.
   * @param halfSpan Already admitted finite positive bridge half-length along
   *   X, metres.
   * @param z Already admitted finite fore-aft bridge plane in the neutral
   *   model, metres.
   * @param radius Already admitted finite positive circular bar radius, metres.
   * @param clearance Already admitted finite nonnegative body separation,
   *   metres.
   * @returns A conservative upper support plane; the caller connects the raised
   *   beam to its rails.
   * @throws {AutoMovieArchetypeRefusal} If the derived support height is
   *   nonfinite.
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
    return height;

    /**
     * Round a finite sum outward, without replacing the physical clearance by a
     * tolerance.
     */
    function up(value: number): number {
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
   * @param id Cylinder identity used by refusal facts.
   * @param radius Already admitted positive finite cylinder radius, metres.
   * @param from First admitted finite cylinder endpoint in the neutral model,
   *   metres.
   * @param to Second admitted finite endpoint with positive finite span,
   *   metres.
   * @param clearance Already admitted finite nonnegative body separation,
   *   metres; the plan defaults it to zero.
   * @throws {AutoMovieArchetypeRefusal} If any sphere lacks the required
   *   cylinder separation, including a nonfinite computed distance.
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
   * @param id Side-pad identity used by geometry and refusal facts.
   * @param size Already admitted positive finite full box lengths, metres.
   * @param at Already admitted finite box centre in the neutral model frame,
   *   metres.
   * @param clearance Already admitted finite nonnegative body separation,
   *   metres; the plan defaults it to zero.
   * @throws {AutoMovieArchetypeRefusal} If any sphere lacks the required box
   *   separation, including a nonfinite engine distance.
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
   * Preserve a physically impossible equipment-solid request as an ordinary
   * refusal.
   *
   * @param axis Equipment part or derived support identity.
   * @param value Original geometry and obstacle facts, without an invented
   *   feasible interval.
   * @param obstacle Interfering body-sphere identity or nonfinite
   *   support-envelope description.
   * @throws {AutoMovieArchetypeRefusal} Always, retaining only ordinary request
   *   facts and an actionable authored-fit correction.
   */
  private refuse(axis: string, value: unknown, obstacle: string): never {
    throw new AutoMovieArchetypeRefusal({
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
