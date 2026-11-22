import type { AutoMovieArchetype } from "../core";
import { createBaseballBat } from "../sport";
import {
  createBow,
  createCannon,
  createClub,
  createHandgun,
  createHolster,
  createLongGun,
  createMagazine,
  createPell,
  createPolearm,
  createPracticeBaton,
  createProjectile,
  createShield,
  createStageBallProp,
  createStageBladeCarrier,
  createStageCartridgeProp,
  createStageGrenadeProp,
  createStageHandBowProp,
  createStageHolster,
  createStagePouch,
  createStageQuiver,
  createStageRoundProp,
  createStageShaftToken,
  createStageStockBowProp,
  createStageStoneProp,
  createSword,
} from "../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/** The named carrier for each saved holster kind. */
function carrier(kind: createHolster.Kind): AutoMovieArchetype {
  if (kind === "scabbard" || kind === "sheath")
    return createStageBladeCarrier({ kind });
  if (kind === "quiver") return createStageQuiver();
  if (kind === "pouch") return createStagePouch();
  return createStageHolster();
}

/** The named inert token for each saved projectile kind. */
function token(kind: createProjectile.Kind): AutoMovieArchetype {
  if (kind === "arrow" || kind === "bolt")
    return createStageShaftToken({ kind });
  if (kind === "ball") return createStageBallProp();
  if (kind === "roundShot") return createStageRoundProp();
  if (kind === "grenade") return createStageGrenadeProp();
  if (kind === "cartridge") return createStageCartridgeProp();
  return createStageStoneProp();
}

/** The named bow silhouette for each saved bow kind. */
function bow(kind: createBow.Kind): AutoMovieArchetype {
  return kind === "crossbow"
    ? createStageStockBowProp()
    : createStageHandBowProp({ kind });
}

/** The named bat or baton for each saved club kind. */
function club(kind: createClub.Kind): AutoMovieArchetype {
  return kind === "bat" ? createBaseballBat() : createPracticeBaton();
}

/**
 * The capture catalog's armoury: the firearms, their holsters and magazines, the projectiles, bows, cannon and clubs, and the blades, shields, polearms and pell, each every kind of its producers at the middle of their bands. The stage carriers, tokens, bows and clubs are built by their named producers under their saved kind names.
 *
 * @returns The subjects by name, in the catalog's order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which subjects it builds.
 * @evidence contracts/development/implementation.md#principled-implementation Every producer and kind through its own public call at the middle of its bands, as `archetypeCaptureCatalog` builds its other subjects.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal of subjects over the shared helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No archetype is built here by hand; an inspection list, never a registry a production reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a few dozen small models once per page load.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once by the catalog.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds plain data only.
 */
export function archetypeCaptureArmoury(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const still: typeof archetypeCaptureSubject.still =
    archetypeCaptureSubject.still;
  const kinds: typeof archetypeCaptureSubject.kinds =
    archetypeCaptureSubject.kinds;
  return {
    weapons: still({
      ...kinds(
        "handgun",
        createHandgun.FRAMES,
        (frame: createHandgun.Frame): AutoMovieArchetype =>
          createHandgun({ frame }),
      ),
      ...kinds(
        "holster",
        createHolster.KINDS,
        (kind: createHolster.Kind): AutoMovieArchetype => carrier(kind),
      ),
      ...kinds(
        "magazine",
        createMagazine.KINDS,
        (kind: createMagazine.Kind): AutoMovieArchetype =>
          createMagazine({ kind }),
      ),
      ...kinds(
        "projectile",
        createProjectile.KINDS,
        (kind: createProjectile.Kind): AutoMovieArchetype => token(kind),
      ),
      ...kinds(
        "bow",
        createBow.KINDS,
        (kind: createBow.Kind): AutoMovieArchetype => bow(kind),
      ),
      ...kinds(
        "cannon",
        createCannon.KINDS,
        (kind: createCannon.Kind): AutoMovieArchetype => createCannon({ kind }),
      ),
      ...kinds(
        "longGun",
        createLongGun.KINDS,
        (kind: createLongGun.Kind): AutoMovieArchetype =>
          createLongGun({ kind }),
      ),
      ...kinds(
        "club",
        createClub.KINDS,
        (kind: createClub.Kind): AutoMovieArchetype => club(kind),
      ),
    }),
    blades: still({
      ...kinds(
        "sword",
        createSword.KINDS,
        (kind: createSword.Kind): AutoMovieArchetype => createSword({ kind }),
      ),
      ...kinds(
        "shield",
        createShield.KINDS,
        (kind: createShield.Kind): AutoMovieArchetype => createShield({ kind }),
      ),
      ...kinds(
        "polearm",
        createPolearm.KINDS,
        (kind: createPolearm.Kind): AutoMovieArchetype =>
          createPolearm({ kind }),
      ),
      pell: createPell(),
    }),
  };
}
