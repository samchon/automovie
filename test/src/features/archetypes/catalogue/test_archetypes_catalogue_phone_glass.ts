import { AutoMovieArchetypePhone } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * The phone's glass is centered on the case's real front face.
 *
 * Scenarios:
 *
 * 1. Build the minimum and maximum allowed phone cases.
 * 2. Compare the screen placement and size to each collider and 94% of its face.
 */
export function test_archetypes_catalogue_phone_glass(): void {
  for (const [width, height, thickness] of [
    [0.0642, 0.1315, 0.00564],
    [0.078, 0.1634, 0.00875],
  ] as const) {
    const phone: ReturnType<typeof AutoMovieArchetypePhone.create> =
      AutoMovieArchetypePhone.create({
        width,
        height,
        thickness,
      });
    const body: IAutoMoviePhysicalShape | undefined = phone
      .shapes()
      .find((shape): boolean => shape.id === "body");
    assert.ok(body?.kind === "box", "the phone has a box case");

    const screen: IAutoMovieAffordance = phone.affordance("screen");
    const center: IAutoMovieVector3 = body.transform.position;
    TestValidator.predicate(
      `the ${width} m phone exposes glass on 94% of its face`,
      vclose(
        body.halfExtents,
        { x: width / 2, y: height / 2, z: thickness / 2 },
        1e-9,
      ) &&
        vclose(
          screen.frame.translation,
          { ...center, z: center.z + thickness / 2 },
          1e-9,
        ) &&
        screen.width !== undefined &&
        nclose(screen.width, 0.94 * width, 1e-9) &&
        screen.depth !== undefined &&
        nclose(screen.depth, 0.94 * height, 1e-9),
    );
  }
}
