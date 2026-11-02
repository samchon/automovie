import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanArmTapes as Tapes } from "../../../../packages/human/src/generation/AutoMovieHumanArmTapes";
import { HumanAnatomy as A } from "../internal/HumanAnatomy";
import { nclose } from "../internal/nclose";

/**
 * An arm tape closes on its owned plane, including an oblique wrist crease.
 *
 * Scenarios:
 * 1. Round and oval triangulated tubes answer normal and tilted tape planes.
 * 2. Reflection and translation retain the requested perimeter.
 * 3. Normalizing a different section exposes the old oblique-tape defect.
 *
 * @evidence contracts/testing.md#behavioral-verification Cuts a generated straight tube's actual triangles with the maintained skin cutter after normalizing its radius in the requested plane. It contrasts the same cut after the old bone-normal normalization, so the assertion distinguishes the wrong tape from the right one.
 * @evidence contracts/testing.md#independent-expectations The requested perimeter is 200 mm at every aspect and orientation. The triangle cutter measures Cartesian crossings and their convex hull, independently of the production speed integral. A 512-sided smooth ellipse misses its analytic circumference by less than 0.01 mm over these aspects and tilts.
 * @evidence contracts/testing.md#distinguishing-cases Covers circular and 1.7-aspect sections, zero/30/60 degree obliquity, both tilt signs and a translated axis. A 60-degree cut after normalizing the perpendicular section must remain more than the 4 mm small-tape tolerance wrong. Whole-person tests retain ownership of the varying arm surface and its actual wrist address.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test reached by --include human_arm_tape_section. Small local typed arrays supply independent straight cylinders; no person generator, process, browser or GPU starts.
 */
export function test_human_arm_tape_section(): void {
  for (const aspect of [1, 1.7])
    for (const angle of [0, Math.PI / 6, Math.PI / 3])
      for (const sign of [1, -1]) {
        const normal: A.V3 = [sign * Math.sin(angle), Math.cos(angle), 0];
        const origin: A.V3 = [37 * sign, 200, -17];
        const radius: number = Tapes.radius(200, aspect, { axis: [0, 1, 0], across: [1, 0, 0], normal });
        const cut: A.ICut | null = A.cut(tube(radius, aspect, origin), origin, normal, origin);
        TestValidator.predicate("owned plane intersects a closed tube", cut !== null);
        TestValidator.predicate("owned-plane tape closes", nclose(cut!.girth, 200, 0.01));
        if (angle === Math.PI / 3) {
          const defective: A.ICut | null = A.cut(tube(Tapes.radius(200, aspect), aspect, origin), origin, normal, origin);
          TestValidator.predicate("wrong section remains a real defect", defective !== null && defective.girth > 204);
        }
      }
}

/** An analytic elliptic cylinder sampled only into the triangles read by the audit. */
function tube(radius: number, aspect: number, origin: A.V3): A.ISkin {
  const positions: number[] = [];
  const indices: number[] = [];
  const phases: number = 512;
  for (let k: number = 0; k < 2; k++)
    for (let j: number = 0; j < phases; j++) {
      const t: number = (2 * Math.PI * j) / phases;
      positions.push(origin[0] + radius * Math.sqrt(aspect) * Math.cos(t), origin[1] + (k === 0 ? -400 : 400), origin[2] + radius / Math.sqrt(aspect) * Math.sin(t));
      if (k !== 0) continue;
      const next: number = (j + 1) % phases;
      indices.push(j, next, j + phases, next, next + phases, j + phases);
    }
  return { name: "analytic tape cylinder", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["arm.left"], joints: new Map() };
}
