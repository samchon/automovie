import { createQuadruped, AutoMovieArchetypeDog } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { observeQuadrupedAttachment } from "./observeQuadrupedAttachment";

/**
 * Whole-solid support uses the full radius of a rounded terminal.
 *
 * Scenarios:
 * 1. Changing each original terminal from cylinder to capsule preserves its
 *    bar length, radius and source frame.
 * 2. Direct fixed and lifted foot goals put each complete capsule at its
 *    requested clearance and preserve attachment, carriers and read ownership.
 */
export function test_archetypes_animals_capsule_terminal_pose(): void {
  const findings: string[] = [];
  const original: ReturnType<typeof AutoMovieArchetypeDog.create> = AutoMovieArchetypeDog.create(
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
  const rounded: ReturnType<typeof AutoMovieArchetypeDog.create> = original.reposed(parts, frames);
  observeQuadrupedAttachment(
    rounded,
    createQuadruped.species(rounded),
    "dog/authored-capsules",
    findings,
    rounded.dimensions.withersHeight!,
  );
  TestValidator.equals(
    "authored capsule variant preserves the original producer model",
    JSON.stringify(original),
    source,
  );
  TestValidator.equals("actual capsule terminal support", findings, []);
}
