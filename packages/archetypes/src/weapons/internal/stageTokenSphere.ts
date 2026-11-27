import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetypeFrame } from "../../core/index";
import type { StageTokenConstruction } from "./StageTokenConstruction";
import { AutoMovieArchetypeProjectile } from "../AutoMovieArchetypeProjectile";

/*
 * Record the round screen-prop body.
 *
 * The selected prop's sphere, model-space grip and recorded resting material
 * share one radius.
 * Parameter builder: The selected prop builder.
 * Parameter d: Resolved display dimensions in metres and kilograms.
 * Parameter kind: One of the round digital silhouettes.
 * Parameter model: The selected reference model if any.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function stageTokenSphere(
  builder: Parameters<StageTokenConstruction.Build>[0],
  d: Parameters<StageTokenConstruction.Build>[1],
  kind: StageTokenSphereKind,
  model: AutoMovieArchetypeProjectile.Model | undefined,
): ReturnType<StageTokenConstruction.Build> {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
    frame: AutoMovieArchetypeFrame.facing(v(0, r, 0), v(-1, 0, 0), v(0, 1, 0)),
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
    ...AutoMovieArchetypeProjectile.flight(kind, model, r),
  });
}

/*
 * The values stageTokenSphere accepts at this place in its signature.
 */
type StageTokenSphereKind = "ball" | "roundShot" | "grenade" | "stone";
