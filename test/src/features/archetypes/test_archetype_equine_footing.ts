import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../internal/archetypeHorseRide";

/**
 * Named equine footholds retain actual footprint and sole contact in world space.
 *
 * A walk uses raised and declining planes with transverse slope and a separate
 * step. A trotting horse clears a raised pole authored in world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the independent planes, whole terminal parts, observations and typed missing foothold proof.
 * @evidence contracts/development/testing.md#behavioral-verification Builds actual horse courses and reads emitted oriented solids and unchanged world stance positions at named landing clocks.
 * @evidence contracts/development/testing.md#independent-expectations Project actual toe cylinders onto the authored plane normal. Evaluate finite-segment clearance directly in the pole cross section. Neither witness reads production ground goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses incline, decline, crossfall, step, level reference, finite obstruction and an absent foothold.
 * @evidence contracts/development/testing.md#execution-ownership One bounded in-memory unit uses public gait and body samples without renderer setup or external files.
 */
export function test_archetype_equine_footing(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const course: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 1.6,
    startSpeed: 1.6,
    endSpeed: 1.6,
    legs: [{ kind: "straight", length: 8 }],
  };
  const plane: AutoMovieArchetypeQuadrupedFooting.IPlane = {
    id: "level",
    origin: { x: 0, y: 0, z: 0 },
    x: [-4, 4],
    z: [-4, 16],
    slope: { x: 0, z: 0 },
  };
  const issues: string[] = [];

  for (const slope of [0.025, -0.025]) {
    const incline: AutoMovieArchetypeQuadrupedFooting.IPlane = {
      ...plane,
      id: slope > 0 ? "incline" : "decline",
      origin: { x: 0, y: 0.12, z: 0 },
      slope: { x: 0.04, z: slope },
    };
    observe(incline.id, () => {
      const ride: ReturnType<typeof rideHorse> = rideHorse(
        horse,
        { ...course, footing: { planes: [incline] } },
        "walk",
      );
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const landings: number[] = archetypeHorseRide.footfalls(ride, limb);
        for (const at of landings.filter(
          (time: number): boolean => time > 0.4 && time < ride.duration - 0.4,
        )) {
          const start: IAutoMovieVector3 = archetypeHorseRide.hoof(
            ride,
            limb,
            at + 1e-6,
          );
          const finish: IAutoMovieVector3 = archetypeHorseRide.hoof(
            ride,
            limb,
            at + 0.08,
          );
          if (Vector3.distance(start, finish) > 1e-8)
            issues.push(`${incline.id} ${limb} slips at ${at}`);
          closePlane(ride, limb, at + 0.08, incline);
        }
      }
    });
  }

  const rise: AutoMovieArchetypeQuadrupedFooting.IPlane = {
    ...plane,
    id: "step",
    origin: { x: 0, y: 0.028, z: 2.8 },
    z: [2.8, 16],
  };
  observe("raised step", () => {
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      horse,
      {
        ...course,
        footing: {
          planes: [{ ...plane, z: [-4, 2.8] }, rise],
          swingLift: 0.035,
        },
      },
      "walk",
    );
    const touched: Set<AutoMovieArchetypeQuadrupedBody.Limb> = new Set();
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
      for (const at of archetypeHorseRide.footfalls(ride, limb)) {
        if (at <= 0.4 || at >= ride.duration - 0.4) continue;
        const position: IAutoMovieVector3 = archetypeHorseRide.hoof(
          ride,
          limb,
          at + 0.08,
        );
        closePlane(ride, limb, at + 0.08, position.z >= 2.8 ? rise : plane);
        if (position.z >= 2.8) touched.add(limb);
      }
    if (touched.size !== 4)
      issues.push("every hoof needs an observed raised landing");
    for (let i: number = 0; i <= 30; i++) ride.at(0.4 + i * 0.13);
  });

  const pole: AutoMovieArchetypeQuadrupedFooting.IPole = {
    id: "raised-pole",
    from: { x: -0.8, y: 0.04, z: 3.8 },
    to: { x: 0.8, y: 0.04, z: 3.8 },
    radius: 0.018,
  };
  const faster: rideQuadruped.ICourse = {
    ...course,
    cruise: 3.1,
    startSpeed: 3.1,
    endSpeed: 3.1,
  };
  observe("grounded approach and pole clearance", () => {
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      horse,
      {
        ...faster,
        footing: { planes: [plane], poles: [pole], swingLift: 0.07 },
      },
      "trot",
    );
    const crossed: Set<string> = new Set();
    for (let i: number = 0; i < 81; i++) {
      const at: number = 0.4 + i * 0.02;
      const sample: ReturnType<typeof ride.at> = ride.at(at);
      for (const part of sample.archetype.parts) {
        const distance: number = capsuleClearance(
          part,
          sample.placement,
          pole.from,
          pole.radius,
        );
        if (distance < -1e-8)
          issues.push(`pole clearance ${part.id} ${at} = ${distance}`);
        const centre: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
          sample.placement,
          part.transform!.translation,
        );
        if (centre.z > pole.from.z) crossed.add(part.id);
      }
    }
    if (crossed.size !== horse.parts.length)
      issues.push("the complete actual body must travel past the pole");
  });

  let missing: unknown = null;
  try {
    rideHorse(
      horse,
      {
        ...course,
        footing: { planes: [{ ...plane, x: [-0.01, 0.01] }] },
      },
      "walk",
    ).at(0.5);
  } catch (error) {
    missing = error;
  }
  if (
    !(
      missing instanceof AutoMovieArchetypeRefusal &&
      missing.axis === "footing" &&
      missing.reason.includes("No authored surface")
    )
  )
    issues.push(
      "missing foothold must report the typed authored terrain refusal",
    );
  let unreachable: unknown = null;
  try {
    const impossible: ReturnType<typeof rideHorse> = rideHorse(
      horse,
      {
        ...course,
        footing: {
          planes: [
            { ...plane, z: [-4, 2.8] },
            { ...rise, origin: { ...rise.origin, y: 2.5 } },
          ],
        },
      },
      "walk",
    );
    for (let i: number = 0; i < 18; i++) impossible.at(1 + i * 0.08);
  } catch (error) {
    unreachable = error;
  }
  if (
    !(
      unreachable instanceof RangeError ||
      unreachable instanceof AutoMovieArchetypeRefusal
    )
  )
    issues.push("the impossible mixed-height footholds must refuse");
  TestValidator.equals("independent equine terrain observations", issues, []);

  /** Compare a specific actual hoof to the author's full world plane. */
  function closePlane(
    ride: ReturnType<typeof rideHorse>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    at: number,
    surface: AutoMovieArchetypeQuadrupedFooting.IPlane,
  ): void {
    const current: ReturnType<typeof ride.at> = ride.at(at);
    const name: AutoMovieArchetypeQuadrupedBody.Bone =
      AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
    const part: IAutoMovieModelPart = current.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === name,
    )!;
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "cylinder"
    )
      throw new Error(`The ${name} must use the actual cylindrical hoof`);
    const shape: typeof part.geometry.shape = part.geometry.shape;
    const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      current.placement,
      part.transform!,
    );
    const normal: IAutoMovieVector3 = Vector3.normalize({
      x: -surface.slope.x,
      y: 1,
      z: -surface.slope.z,
    });
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const axial: number = Math.abs(Vector3.dot(normal, axis));
    const gap: number =
      Vector3.dot(Vector3.subtract(frame.translation, surface.origin), normal) -
      (shape.height / 2) * axial -
      shape.radius * Math.sqrt(Math.max(0, 1 - axial * axial));
    if (Math.abs(gap) > 1e-8)
      issues.push(`${surface.id} ${name} gap at ${at} = ${gap}`);
  }

  /** Collect each distinct supported scenario before reporting defects together. */
  function observe(label: string, execute: () => void): void {
    try {
      execute();
    } catch (error) {
      issues.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/** Independent capsule-envelope clearance against a span wholly covering the horse along X. */
function capsuleClearance(
  part: IAutoMovieModelPart,
  placement: IAutoMovieTransform,
  pole: IAutoMovieVector3,
  radius: number,
): number {
  if (part.geometry.type !== "primitive")
    throw new Error("The fixture expects actual primitive geometry");
  const shape: typeof part.geometry.shape = part.geometry.shape;
  const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    placement,
    part.transform!,
  );
  if (shape.type === "box")
    return boxClearance(
      { x: shape.width, y: shape.height, z: shape.depth },
      frame,
      pole,
      radius,
    );
  if (
    shape.type !== "sphere" &&
    shape.type !== "capsule" &&
    shape.type !== "cylinder"
  )
    throw new Error(`Unsupported pole witness part ${part.id}`);
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const span: number = shape.type === "sphere" ? 0 : shape.height / 2;
  const y: number = pole.y - frame.translation.y;
  const z: number = pole.z - frame.translation.z;
  const projected: number = axis.y * axis.y + axis.z * axis.z;
  const offset: number =
    projected === 0
      ? 0
      : Math.max(-span, Math.min(span, (axis.y * y + axis.z * z) / projected));
  return (
    Math.hypot(y - offset * axis.y, z - offset * axis.z) - shape.radius - radius
  );
}

/** Independent clearance of a box of width, height and depth `size`, such as an ear plate, from the same X-spanning pole: the box's projection on the YZ plane is the convex hull of its corners, and the pole's clearance is its distance to that hull less the pole's radius, negative inside. */
function boxClearance(
  size: IAutoMovieVector3,
  frame: IAutoMovieTransform,
  pole: IAutoMovieVector3,
  radius: number,
): number {
  const corners: IAutoMovieVector3[] = [];
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1])
        corners.push(
          Vector3.add(
            frame.translation,
            Quaternion.rotateVector(frame.rotation, {
              x: (x * size.x) / 2,
              y: (y * size.y) / 2,
              z: (z * size.z) / 2,
            }),
          ),
        );

  // Gift-wrap the projected corners, then measure the pole's centre against each hull edge.
  const points: IAutoMovieVector3[] = corners.sort(
    (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      a.y - b.y || a.z - b.z,
  );
  const cross = (
    o: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => (a.y - o.y) * (b.z - o.z) - (a.z - o.z) * (b.y - o.y);
  const hull: IAutoMovieVector3[] = [];
  for (const pass of [points, [...points].reverse()]) {
    const start: number = hull.length;
    for (const p of pass) {
      while (
        hull.length >= start + 2 &&
        cross(hull[hull.length - 2]!, hull[hull.length - 1]!, p) <= 0
      )
        hull.pop();
      hull.push(p);
    }
    hull.pop();
  }
  let outside: boolean = false;
  let nearest: number = Infinity;
  for (let k: number = 0; k < hull.length; k++) {
    const a: IAutoMovieVector3 = hull[k]!;
    const b: IAutoMovieVector3 = hull[(k + 1) % hull.length]!;
    if (cross(a, b, pole) < 0) outside = true;
    const ey: number = b.y - a.y;
    const ez: number = b.z - a.z;
    const t: number = Math.max(
      0,
      Math.min(
        1,
        ((pole.y - a.y) * ey + (pole.z - a.z) * ez) / (ey * ey + ez * ez),
      ),
    );
    nearest = Math.min(
      nearest,
      Math.hypot(pole.y - a.y - t * ey, pole.z - a.z - t * ez),
    );
  }
  return (outside ? nearest : -nearest) - radius;
}
