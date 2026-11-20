import { Vector3 } from "@automovie/engine";

import { ArchetypeFrame } from "../core";
import type { StageTokenConstruction } from "./StageTokenConstruction";
import { createProjectile } from "./createProjectile";

/**
 * Record the round screen-prop body.
 *
 * The selected prop's sphere, model-space grip and recorded resting material share one radius.
 *
 * @param builder The selected prop builder.
 * @param d Resolved display dimensions in metres and kilograms.
 * @param kind One of the round digital silhouettes.
 * @param model The selected reference model if any.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the sphere origin, its shared surface and actor contact.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the same sphere and support placement across round digital silhouettes without redoing the model draw.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Records one sphere and one grip at the same centre.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function stageTokenSphere(
  builder: Parameters<StageTokenConstruction.Build>[0],
  d: Parameters<StageTokenConstruction.Build>[1],
  kind: "ball" | "roundShot" | "grenade" | "stone",
  model: createProjectile.Model | undefined,
): ReturnType<StageTokenConstruction.Build> {
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.diameter! / 2;
  const stone: boolean = kind === "stone";
  builder.ball(kind, r, v(0, r, 0), {
    color: stone ? "#8a8580" : "#6f6f72",
    ...(kind === "ball"
      ? {}
      : { surface: stone ? ("stone" as const) : ("steel" as const) }),
  });
  builder.affordance({
    id: "body",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, r, 0), v(-1, 0, 0), v(0, 1, 0)),
    extent: null,
    grip:
      kind === "ball"
        ? "precision"
        : kind === "grenade" || stone
          ? "power"
          : "two-hand",
    aperture: d.diameter!,
  });

  return builder.build(d.mass!, {
    ...(kind === "ball"
      ? {}
      : { rests: stone ? ("stone" as const) : ("steel" as const) }),
    ...createProjectile.flight(kind, model, r),
  });
}
