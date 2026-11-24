import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  createStageWeaponProp,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";
import { nclose } from "../../../internal/nclose";

/**
 * The padded silhouettes differ even at the same authored display height.
 *
 * Scenarios
 * 1. All four models stand from the origin to the selected height and expose a shaft grip.
 * 2. At equal height the mace ornament is round, the pike is narrower than the shuo, and the halberd extends to one side.
 * 3. The same authored outline reproduces its geometry and rejects a zero height.
 */
export function test_unit_archetypes_props_props_stage_weapon_silhouettes(): void {
  const height: number = 1.25;
  const mace: ReturnType<typeof createStageWeaponProp> = createStageWeaponProp({
    kind: "mace",
    height,
  });
  const pike: ReturnType<typeof createStageWeaponProp> = createStageWeaponProp({
    kind: "pike",
    height,
  });
  const shuo: ReturnType<typeof createStageWeaponProp> = createStageWeaponProp({
    kind: "shuo",
    height,
  });
  const halberd: ReturnType<typeof createStageWeaponProp> =
    createStageWeaponProp({ kind: "halberd", height });

  for (const prop of [mace, pike, shuo, halberd]) {
    const vertical: ReturnType<typeof archetypeExtent> = archetypeExtent(
      prop,
      "y",
    );
    const shaft: ReturnType<typeof archetypeExtent> = archetypeExtent(
      prop,
      "y",
      ["shaft"],
    );
    const grip: ReturnType<typeof prop.affordance> = prop.affordance("grip");
    TestValidator.predicate(
      `${prop.name} shares the stage origin and the hand approach`,
      nclose(vertical.low, 0) &&
        nclose(vertical.high, height) &&
        grip.kind === "handle" &&
        grip.length !== undefined &&
        grip.length !== null &&
        grip.frame.translation.y - grip.length / 2 > shaft.low &&
        grip.frame.translation.y + grip.length / 2 < shaft.high &&
        nclose(AutoMovieArchetypeFrame.axis(grip.frame, "x").y, 1) &&
        nclose(AutoMovieArchetypeFrame.axis(grip.frame, "y").z, -1),
    );
  }

  const maceWidth: number = archetypeExtent(mace, "x", ["ornament"]).size;
  const pikeWidth: number = archetypeExtent(pike, "x", ["ornament"]).size;
  const shuoWidth: number = archetypeExtent(shuo, "x", ["ornament"]).size;
  const halberdWidth: ReturnType<typeof archetypeExtent> = archetypeExtent(
    halberd,
    "x",
  );
  TestValidator.predicate(
    "round, narrow, wide and asymmetric stage outlines",
    nclose(maceWidth, archetypeExtent(mace, "y", ["ornament"]).size) &&
      pikeWidth < shuoWidth &&
      shuoWidth < maceWidth &&
      halberdWidth.high > 2 * -halberdWidth.low,
  );

  const nextPike: ReturnType<typeof createStageWeaponProp> =
    createStageWeaponProp({ kind: "pike", height }, 17);
  TestValidator.predicate(
    "the scale override gives a reproducible outline",
    nclose(archetypeExtent(nextPike, "y").size, height) &&
      nclose(archetypeExtent(nextPike, "x").size, pikeWidth),
  );

  let refused: unknown;
  try {
    createStageWeaponProp({ kind: "pike", height: 0 });
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "zero display height is refused",
    refused instanceof AutoMovieArchetypeRefusal && refused.axis === "height",
  );
}
