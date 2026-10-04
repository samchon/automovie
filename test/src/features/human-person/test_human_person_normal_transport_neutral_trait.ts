import { createHumanPersonBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonSourceBasisFixture } from "../internal/humanPersonSourceBasisFixture";

/**
 * A neutral reference never invents an unsupported facial trait.
 * The analytic source tube has no expression channels and carries admitted raw
 * normal cells. Omitted expression weights already mean zero at their owner.
 * Scenarios:
 * 1. Present transport builds its final neutral reference without requesting an
 *    absent mouthClose channel; source and caller document remain unchanged.
 */
export const test_human_person_normal_transport_neutral_trait = (): void => {
  const fixture = humanPersonSourceBasisFixture();
  for (const surface of [fixture.face.surfaces[0], fixture.body.surfaces[0]]) {
    const record = surface.sourcePartition!;
    surface.sourcePartition = { ...record, normalTransport: {
      subdivisions: [], cells: record.parents.map(() => 0),
      bindings: Array.from({ length: surface.positions.length / 3 }, (_, vertex) => ({
        parent: record.parents[Math.floor(surface.indices.indexOf(vertex) / 3)],
      })),
    } };
  }
  TestValidator.equals("arranged basis contains no closure trait", fixture.face.channels.length, 0);
  const before = JSON.stringify(fixture);
  const model = createHumanPersonBuilder(fixture)(fixture.document).model;
  TestValidator.equals("supported neutral reference builds all existing parts", model.parts.length, 3);
  TestValidator.equals("reference selection leaves authored values unchanged", JSON.stringify(fixture), before);
};
