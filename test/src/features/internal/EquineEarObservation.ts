import {
  type AutoMovieArchetypeEquine,
  type AutoMovieArchetypeQuadrupedGait,
  type AutoMovieArchetypeRide,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { nclose } from "./nclose";

/**
 * Independent actual ear geometry, head carriage and genuine builder admission.
 *
 * Expected source ratios and cases remain in the discoverable unit. This helper
 * reads actual emitted primitive frames, applies elementary capsule/corner
 * mathematics and samples a real AR walk with an explicitly authored 10-degree
 * nod. It never calls the production attachment constructor as an oracle and
 * never replaces a renderer, builder method, action law or process.
 */
export namespace EquineEarObservation {
  /** Actual producer output, without an alternate proxy skeleton. */
  export type Model = ReturnType<typeof createQuadruped>;

  /** Fixed independent donor ratios and existing body/mass figures. */
  export interface ICase {
    /** The real producer and explicit mule body sex where applicable. */
    params: { kind: "donkey" | "mule"; sex?: "female" | "male" };
    /** Independent complete pinna-length/donor-withers ratio, dimensionless. */
    length: number;

    /** Independent complete pinna-breadth/donor-withers ratio, dimensionless. */
    width: number;

    /**
     * Existing withers height, metres, or null for the original drawn donkey
     * profile.
     */
    height: number | null;

    /** Existing girth, metres, or null for the original drawn donkey profile. */
    girth: number | null;

    /**
     * Existing whole-body mass, kilograms, or null for the original drawn
     * donkey profile.
     */
    mass: number | null;
  }

  /**
   * Real dimensions and actual base-corner membership, with no production
   * attachment oracle.
   */
  export function observe(
    model: Model,
    row: ICase,
    tack: AutoMovieArchetypeEquine.Tack,
    label: string,
    findings: string[],
  ): void {
    if (!validateModel({ model }).success)
      findings.push(`${label}: actual equid model is invalid`);
    const height: number = model.dimensions.withersHeight!;
    const girth: number = model.dimensions.girth!;
    const withers: IAutoMovieModelPart = part(model, "withers");
    const trunk: IAutoMovieModelPart = part(model, "trunk");
    if (
      withers.geometry.type !== "primitive" ||
      withers.geometry.shape.type !== "sphere" ||
      trunk.geometry.type !== "primitive" ||
      trunk.geometry.shape.type !== "capsule"
    )
      throw new Error("Actual withers/trunk reference primitives changed");
    check(
      "actual withers apex unchanged",
      frame(withers).translation.y + withers.geometry.shape.radius,
      height,
    );
    check(
      "actual girth unchanged",
      2 * Math.PI * trunk.geometry.shape.radius,
      girth,
    );
    const head: IAutoMovieModelPart = part(model, "head");
    if (
      head.geometry.type !== "primitive" ||
      head.geometry.shape.type !== "capsule"
    )
      throw new Error("Actual equid head must remain its capsule");
    check("head radius unchanged", head.geometry.shape.radius, 0.06 * height);
    check(
      "head control unchanged",
      head.geometry.shape.height,
      Math.hypot(0.31, 0.18) * height,
    );
    if (row.height !== null) check("body height unchanged", height, row.height);
    check(
      "body girth unchanged",
      girth,
      row.girth ?? (height * 121.2) / 112.62,
    );
    const bodyMass: number =
      row.mass ?? 640 * (girth / 2.04) ** 2 * (height / 1.72);
    const tackMass: number =
      tack === "saddle" || tack === "both"
        ? 5.4
        : tack === "pack"
          ? 95 * 0.45359237 * (height / (60.5 * 0.0254)) ** 3
          : 0;
    check(
      "existing complete mass",
      model.properties.mass,
      bodyMass + tackMass,
      1e-6,
    );
    for (const side of ["left", "right"] as const) {
      const ear: IAutoMovieModelPart = part(model, `${side}Ear`);
      if (
        ear.geometry.type !== "primitive" ||
        ear.geometry.shape.type !== "box"
      )
        throw new Error("Actual pinna must be a dimensioned plate");
      const shape: typeof ear.geometry.shape = ear.geometry.shape;
      check(`${side} full base-tip length`, shape.height, height * row.length);
      check(`${side} full breadth`, shape.width, height * row.width);
      check(
        `${side} authored plate thickness`,
        shape.depth,
        (height * row.width) / 10,
      );
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        frame(ear).rotation,
        { x: 0, y: 1, z: 0 },
      );
      const sign: number = side === "left" ? 1 : -1;
      check(`${side} authored outward axis`, axis.x, sign / Math.SQRT2);
      check(`${side} authored upward axis`, axis.y, 1 / Math.SQRT2);
      check(`${side} authored sagittal axis`, axis.z, 0);
      const rootX: number =
        frame(ear).translation.x - (axis.x * shape.height) / 2;
      if (!(sign * rootX > 0))
        findings.push(`${label}: ${side} actual base lost its bilateral side`);
      for (const point of corners(ear, [-1])) {
        const local: IAutoMovieVector3 = inverse(frame(head), point);
        const axial: number = Math.max(
          0,
          Math.abs(local.y) - head.geometry.shape.height / 2,
        );
        if (
          Math.hypot(local.x, axial, local.z) >
          head.geometry.shape.radius + 1e-9
        )
          findings.push(
            `${label}: ${side} actual base corner is outside the head capsule`,
          );
      }
    }
    /** Independent finite scalar comparisons retain physical metre tolerances. */
    function check(
      id: string,
      actual: number,
      expected: number,
      tolerance: number = 1e-9,
    ): void {
      if (!nclose(actual, expected, tolerance))
        findings.push(`${label}: ${id}: ${actual} expected ${expected}`);
    }
  }

  /**
   * Current head-local plate corners stay equal through actual AR nodding and
   * seeking.
   */
  export function carriage(
    model: Model,
    label: string,
    findings: string[],
  ): void {
    const table: AutoMovieArchetypeQuadrupedGait.ITable = structuredClone(
      createQuadruped.species(model).table,
    );
    table.gaits.walk!.nod = { range: 10, timing: "support" };
    const ride: AutoMovieArchetypeRide.IRide<
      createQuadruped.Affordance,
      createQuadruped.Dimension
    > = rideQuadruped(
      model,
      {
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: 4 }],
        cruise: 1,
        acceleration: 0.5,
        deceleration: 0.5,
      },
      "walk",
      table,
    );
    for (const seconds of [0.7, 0.2, 1.1, 0.7]) {
      const current: Pick<Model, "parts"> = ride.at(seconds).archetype;
      for (const id of ["leftEar", "rightEar"]) {
        const original: readonly IAutoMovieVector3[] = corners(part(model, id));
        const posed: readonly IAutoMovieVector3[] = corners(part(current, id));
        for (let index: number = 0; index < original.length; index++) {
          const before: IAutoMovieVector3 = inverse(
            frame(part(model, "head")),
            original[index]!,
          );
          const after: IAutoMovieVector3 = inverse(
            frame(part(current, "head")),
            posed[index]!,
          );
          if (
            Math.hypot(
              before.x - after.x,
              before.y - after.y,
              before.z - after.z,
            ) > 1e-9
          )
            findings.push(
              `${label}: actual ${id} corner left the head frame at ${seconds}s`,
            );
        }
      }
    }
    const later: string = JSON.stringify(ride.at(0.7));
    ride.at(0.1);
    if (JSON.stringify(ride.at(0.7)) !== later)
      findings.push(`${label}: reordered seeking changed an actual ear sample`);
  }

  /** All actual box corners, or just its true local-Y base face. */
  function corners(
    part: IAutoMovieModelPart,
    ends: readonly number[] = [-1, 1],
  ): readonly IAutoMovieVector3[] {
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "box"
    )
      throw new Error("Actual pinna is not a box");
    const shape: typeof part.geometry.shape = part.geometry.shape;
    const points: IAutoMovieVector3[] = [];
    for (const y of ends)
      for (const x of [-1, 1])
        for (const z of [-1, 1]) {
          const offset: IAutoMovieVector3 = Quaternion.rotateVector(
            frame(part).rotation,
            {
              x: (x * shape.width) / 2,
              y: (y * shape.height) / 2,
              z: (z * shape.depth) / 2,
            },
          );
          points.push({
            x: frame(part).translation.x + offset.x,
            y: frame(part).translation.y + offset.y,
            z: frame(part).translation.z + offset.z,
          });
        }
    return points;
  }

  /** Actual primitive-centre inverse, independent of the appendage constructor. */
  function inverse(
    at: IAutoMovieTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(Quaternion.inverse(at.rotation), {
      x: point.x - at.translation.x,
      y: point.y - at.translation.y,
      z: point.z - at.translation.z,
    });
  }

  /** Every observed part must retain the actual finite rigid root-local premise. */
  function frame(part: IAutoMovieModelPart): IAutoMovieTransform {
    if (
      part.transform === null ||
      part.attachedBone !== null ||
      part.transform.scale.x !== 1 ||
      part.transform.scale.y !== 1 ||
      part.transform.scale.z !== 1 ||
      !nclose(
        Math.hypot(
          part.transform.rotation.x,
          part.transform.rotation.y,
          part.transform.rotation.z,
          part.transform.rotation.w,
        ),
        1,
        1e-10,
      )
    )
      throw new Error(`Actual ${part.id} has no unit rigid neutral frame`);
    return part.transform;
  }

  /** Require a real emitted part instead of synthesizing missing anatomy. */
  export function part(
    model: Pick<Model, "parts">,
    id: string,
  ): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = model.parts.find(
      (entry: IAutoMovieModelPart): boolean => entry.id === id,
    );
    if (found === undefined) throw new Error(`Missing actual ${id}`);
    return found;
  }
}
