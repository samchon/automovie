import type { AutoMovieArchetypeStagePercussionRifle } from "../AutoMovieArchetypeStagePercussionRifle";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { StagePeriodGunConstruction } from "./StagePeriodGunConstruction";

/**
 * An inert percussion rifle silhouette for the screen.
 *
 * The gun lies along `+Z` from its butt plate to its muzzle, as
 * `StagePeriodGunConstruction` lays it. Its lock is a side hammer on the right
 * of the breech that falls on the `nipple`, the cone a percussion cap sits on;
 * the `hammer` is the thumb's place on its spur. No mechanism moves: the prop
 * is exterior geometry for the camera.
 *
 * @param params The optional scene id.
 * @returns The inert model and its contact frames, metres.
 */
export function createStagePercussionRifle(
  params: AutoMovieArchetypeStagePercussionRifle.IParams = {},
): AutoMovieArchetype<
  AutoMovieArchetypeStagePercussionRifle.Affordance,
  AutoMovieArchetypeStagePercussionRifle.Dimension
> {
  const v: typeof Vector3.create = Vector3.create;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStagePercussionRifle.Affordance,
    AutoMovieArchetypeStagePercussionRifle.Dimension
  > = StagePeriodGunConstruction.lay<AutoMovieArchetypeStagePercussionRifle.Lock>(
    PROFILE,
    params.id ?? "stagePercussionRifle",
  );
  const breech: number = PROFILE.overall - PROFILE.barrel;

  // The nipple stands up on the right of the breech; the hammer pivots
  // behind it and its face rests on the nipple.
  builder.rod(
    "nipple",
    0.003,
    v(0.012, 0.004, breech + 0.01),
    v(0.012, 0.016, breech + 0.01),
    {
      color: "#55595f",
    },
  );
  builder.box("hammer", v(0.008, 0.045, 0.01), v(0.014, 0.01, breech - 0.025), {
    color: "#55595f",
  });
  builder.affordance({
    id: "nipple",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0.012, 0.016, breech + 0.01)),
    extent: null,
  });
  builder.affordance({
    id: "hammer",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0.014, 0.034, breech - 0.025),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return StagePeriodGunConstruction.build(builder, PROFILE);
}

/**
 * The Metropolitan Museum of Art 1974.10, Carl Stiegele, Munich, percussion
 * rifle, ca. 1865, steel, walnut, gold, glass and silver: "L. 43 3/8 in. (110.2
 * cm); L. of barrel 27 5/8 in. (70.2 cm); Cal. .45 in. (11.4 mm); Wt. 8 lb. 1
 * oz. (3657.1 g)", Rogers Fund, 1974, not public domain, no primary image in
 * the open record (collectionapi.metmuseum.org object 27294, read 2026-11-21).
 * The record gives no stock depth or width, barrel wall or length of pull, so
 * those are provisional estimates.
 */
const PROFILE: Readonly<StagePeriodGunConstruction.IProfile> = {
  name: "stage percussion rifle",
  record:
    "Met 1974.10: overall 110.2 cm, barrel 70.2 cm, calibre 11.4 mm and mass 3657.1 g read; stock depth and width, barrel wall and pull estimated",
  overall: 1.102,
  barrel: 0.702,
  depth: 0.12,
  width: 0.045,
  radius: 0.0114 / 2 + 0.008,
  pull: 0.35,
  mass: 3.6571,
};
