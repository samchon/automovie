import type { AutoMovieArchetypeStageMatchlock } from "../AutoMovieArchetypeStageMatchlock";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { StagePeriodGunConstruction } from "./StagePeriodGunConstruction";

/**
 * Detroit Institute of Arts 53.220, German matchlock gun, late 16th century and
 * later, steel, wood, staghorn and pigment: "Overall: 5 9/16 × 2 13/16 × 44 7/8
 * inches (14.2 × 7.1 × 114 cm) Overall (barrel): 31 15/16 inches (81.1 cm)",
 * photographed in seven gallery views, reproduction credited to the Gift of the
 * William Randolph Hearst Foundation
 * (https://dia.org/collection/matchlock-gun/31695, read 2026-11-21). The record
 * gives no mass, barrel radius or length of pull, so those are provisional
 * estimates.
 */
const PROFILE: Readonly<StagePeriodGunConstruction.IProfile> = {
  name: "stage matchlock",
  record:
    "DIA 53.220: overall 114 cm, barrel 81.1 cm, depth 14.2 cm and width 7.1 cm read; mass, barrel radius and pull estimated",
  overall: 1.14,
  barrel: 0.811,
  depth: 0.142,
  width: 0.071,
  radius: 0.013,
  pull: 0.34,
  mass: 4.5,
};

/**
 * An inert matchlock silhouette for the screen.
 *
 * The gun lies along `+Z` from its butt plate to its muzzle, as
 * `StagePeriodGunConstruction` lays it. Its lock is a serpentine, the S-shaped
 * arm that lowers the glowing match into the pan, on the right of the breech,
 * and a coil of match cord hangs from it. The `serpentine` is the thumb's place
 * on the arm and the `match` the cord's burning end over the `pan`. No
 * mechanism moves: the prop is exterior geometry for the camera.
 *
 * @param params The optional scene id.
 * @returns The inert model and its contact frames, metres.
 */
export function createStageMatchlock(
  params: AutoMovieArchetypeStageMatchlock.IParams = {},
): AutoMovieArchetype<
  AutoMovieArchetypeStageMatchlock.Affordance,
  AutoMovieArchetypeStageMatchlock.Dimension
> {
  const v: typeof Vector3.create = Vector3.create;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageMatchlock.Affordance,
    AutoMovieArchetypeStageMatchlock.Dimension
  > = StagePeriodGunConstruction.lay<AutoMovieArchetypeStageMatchlock.Lock>(
    PROFILE,
    params.id ?? "stageMatchlock",
  );
  const breech: number = PROFILE.overall - PROFILE.barrel;

  // The pan sits on the right of the breech; the serpentine pivots behind it
  // and its upper jaw holds the match over the pan.
  builder.box("pan", v(0.02, 0.008, 0.03), v(0.02, 0.005, breech + 0.02), {
    color: "#55595f",
  });
  builder.box(
    "serpentine",
    v(0.008, 0.07, 0.012),
    v(0.025, 0.0, breech - 0.04),
    {
      color: "#55595f",
    },
  );
  builder.rod(
    "match",
    0.004,
    v(0.025, 0.035, breech - 0.04),
    v(0.022, 0.012, breech + 0.02),
    { color: "#3b2a1e" },
  );
  builder.affordance({
    id: "pan",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0.02, 0.009, breech + 0.02)),
    extent: null,
  });
  builder.affordance({
    id: "serpentine",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0.029, -0.03, breech - 0.04),
      v(1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "match",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(v(0.022, 0.012, breech + 0.02)),
    extent: null,
  });
  return StagePeriodGunConstruction.build(builder, PROFILE);
}
