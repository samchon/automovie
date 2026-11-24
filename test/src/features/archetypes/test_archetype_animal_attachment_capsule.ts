import {
  type AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeRide,
  createDog,
  rideQuadruped,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalAttachmentScenario as scenario } from "../internal/animalAttachmentScenario";

/**
 * A caller-owned rounded terminal variant is supported as a complete solid.
 *
 * Scenarios:
 * 1. Repose an actual dog with four explicitly authored capsule terminals,
 *    preserving their centreline heights, radii and actual neutral transforms.
 * 2. Walk and trot this actual alternate geometry on both leads, observing
 *    real parent attachments, bar continuity and the whole capsule sole at
 *    touchdown/liftoff +/-1 microsecond and off-grid stance/swing times.
 * 3. Source ownership, real lead frames and unordered seeking obey the same
 *    contract as the canonical cylinder terminals. No mass/inertia validity
 *    or measured canine paw morphology is claimed for this authored variant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the explicit primitive variation, unchanged four control lengths, complete capsule support and contact/replay observations and excludes anatomical/material/mass claims.
 * @evidence contracts/development/testing.md#behavioral-verification The actual public reposed model is passed to the actual shared ride; an implementation that corrects only cylinder rim clearance or only the terminal cap centre fails on the capsule radius at real support events. Required positive cases cannot pass through refusal.
 * @evidence contracts/development/testing.md#independent-expectations A capsule extends one radius beyond its centreline at every orientation. Thus the actual solid, not just the distal bar centre, must clear the plane and touch it during support; attachment and Euclidean length preservation remain unchanged by this explicit terminal cross-section choice.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts rounded capsules with the canonical cylinder cases, walk/trot, both leads, all terminal solids and exact/off-grid event neighborhoods; it does not tune source dimensions to make a solver pass.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit owns the explicit alternate model and four actual rides, with no producer mutation, foreign-method replacement, host, renderer or compiler.
 */
export function test_archetype_animal_attachment_capsule(): void {
  const findings: string[] = [];
  const original: ReturnType<typeof createDog> = createDog(
    {
      mass: 22,
      cohort: "pet",
      tempo: 0,
      collar: {
        width: 0.02,
        thickness: 0.003,
        leadLength: 0.6,
        leadRadius: 0.004,
      },
    },
    43,
  );
  const source: string = JSON.stringify(original);
  const parts: IAutoMovieModelPart[] = original.parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (!part.id.endsWith("Pastern")) return part;
      if (
        part.geometry.type !== "primitive" ||
        part.geometry.shape.type !== "cylinder"
      )
        throw new Error(
          "The canonical fixture must expose actual cylinder terminals",
        );
      return {
        ...part,
        geometry: {
          ...part.geometry,
          shape: { ...part.geometry.shape, type: "capsule" },
        },
      };
    },
  );
  const frames: Map<string, IAutoMovieTransform> = new Map(
    original.affordances.map(
      (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
        contact.id,
        contact.frame,
      ],
    ),
  );
  const rounded: ReturnType<typeof createDog> = original.reposed(parts, frames);
  for (const [gait, speed, period, foreStance, hindStance] of [
    ["walk", 0.75, 1.11, 0.62, 0.56],
    ["trot", 2.69, 0.57, 0.23, 0.21],
  ] as const)
    for (const side of ["left", "right"] as const)
      scenario(
        rounded,
        (): AutoMovieArchetypeRide.IRide<
          createDog.Affordance,
          AutoMovieArchetypeQuadrupedBody.Dimension
        > =>
          rideQuadruped(
            rounded,
            {
              start: { x: -1, z: 4, heading: -23 },
              legs: [{ kind: "straight", length: speed * 6, lead: side }],
              cruise: speed,
              startSpeed: speed,
              endSpeed: speed,
            },
            gait,
          ),
        { period, foreStance, hindStance },
        `dog/authored-capsules/${gait}/${side}`,
        findings,
      );
  TestValidator.equals(
    "authored capsule variant preserves the original producer model",
    JSON.stringify(original),
    source,
  );
  TestValidator.equals("actual capsule terminal support", findings, []);
}
