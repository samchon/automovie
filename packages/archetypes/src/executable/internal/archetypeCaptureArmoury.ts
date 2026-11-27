import type { AutoMovieArchetype } from "../../core";
import { AutoMovieArchetypeBaseballBat } from "../../sport";
import { AutoMovieArchetypePracticeBaton, AutoMovieArchetypeStageBallProp, AutoMovieArchetypeStageBladeCarrier, AutoMovieArchetypeStageCartridgeProp, AutoMovieArchetypeStageGrenadeProp, AutoMovieArchetypeStageHandBowProp, AutoMovieArchetypeStageHolster, AutoMovieArchetypeStagePouch, AutoMovieArchetypeStageQuiver, AutoMovieArchetypeStageRoundProp, AutoMovieArchetypeStageShaftToken, AutoMovieArchetypeStageStockBowProp, AutoMovieArchetypeStageStoneProp, AutoMovieArchetypeMagazine, AutoMovieArchetypePolearm, AutoMovieArchetypeShield, AutoMovieArchetypeBow, AutoMovieArchetypeCannon, AutoMovieArchetypeClub, AutoMovieArchetypeHandgun, AutoMovieArchetypeHolster, AutoMovieArchetypeLongGun, AutoMovieArchetypePell, AutoMovieArchetypeProjectile, AutoMovieArchetypeSword } from "../../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * The capture catalog's armoury: the firearms, their holsters and magazines,
 * the projectiles, bows, cannon and clubs, and the blades, shields, polearms
 * and pell, each every kind of its producers at the middle of their bands. The
 * stage carriers, tokens, bows and clubs are built by their named producers
 * under their saved kind names.
 *
 * @returns The subjects by name, in the catalog's order.
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
        AutoMovieArchetypeHandgun.FRAMES,
        (frame: AutoMovieArchetypeHandgun.Frame): AutoMovieArchetype =>
          AutoMovieArchetypeHandgun.create({ frame }),
      ),
      ...kinds(
        "holster",
        AutoMovieArchetypeHolster.KINDS,
        (kind: AutoMovieArchetypeHolster.Kind): AutoMovieArchetype => carrier(kind),
      ),
      ...kinds(
        "magazine",
        AutoMovieArchetypeMagazine.KINDS,
        (kind: AutoMovieArchetypeMagazine.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeMagazine.create({ kind }),
      ),
      ...kinds(
        "projectile",
        AutoMovieArchetypeProjectile.KINDS,
        (kind: AutoMovieArchetypeProjectile.Kind): AutoMovieArchetype => token(kind),
      ),
      ...kinds(
        "bow",
        AutoMovieArchetypeBow.KINDS,
        (kind: AutoMovieArchetypeBow.Kind): AutoMovieArchetype => bow(kind),
      ),
      ...kinds(
        "cannon",
        AutoMovieArchetypeCannon.KINDS,
        (kind: AutoMovieArchetypeCannon.Kind): AutoMovieArchetype => AutoMovieArchetypeCannon.create({ kind }),
      ),
      ...kinds(
        "longGun",
        AutoMovieArchetypeLongGun.KINDS,
        (kind: AutoMovieArchetypeLongGun.Kind): AutoMovieArchetype =>
          AutoMovieArchetypeLongGun.create({ kind }),
      ),
      ...kinds(
        "club",
        AutoMovieArchetypeClub.KINDS,
        (kind: AutoMovieArchetypeClub.Kind): AutoMovieArchetype => club(kind),
      ),
    }),
    blades: still({
      ...kinds(
        "sword",
        AutoMovieArchetypeSword.KINDS,
        (kind: AutoMovieArchetypeSword.Kind): AutoMovieArchetype => AutoMovieArchetypeSword.create({ kind }),
      ),
      ...kinds(
        "shield",
        AutoMovieArchetypeShield.KINDS,
        (kind: AutoMovieArchetypeShield.Kind): AutoMovieArchetype => AutoMovieArchetypeShield.create({ kind }),
      ),
      ...kinds(
        "polearm",
        AutoMovieArchetypePolearm.KINDS,
        (kind: AutoMovieArchetypePolearm.Kind): AutoMovieArchetype =>
          AutoMovieArchetypePolearm.create({ kind }),
      ),
      pell: AutoMovieArchetypePell.create(),
    }),
  };
}

/** The named carrier for each saved holster kind. */
function carrier(kind: AutoMovieArchetypeHolster.Kind): AutoMovieArchetype {
  if (kind === "scabbard" || kind === "sheath")
    return AutoMovieArchetypeStageBladeCarrier.create({ kind });
  if (kind === "quiver") return AutoMovieArchetypeStageQuiver.create();
  if (kind === "pouch") return AutoMovieArchetypeStagePouch.create();
  return AutoMovieArchetypeStageHolster.create();
}

/** The named inert token for each saved projectile kind. */
function token(kind: AutoMovieArchetypeProjectile.Kind): AutoMovieArchetype {
  if (kind === "arrow" || kind === "bolt")
    return AutoMovieArchetypeStageShaftToken.create({ kind });
  if (kind === "ball") return AutoMovieArchetypeStageBallProp.create();
  if (kind === "roundShot") return AutoMovieArchetypeStageRoundProp.create();
  if (kind === "grenade") return AutoMovieArchetypeStageGrenadeProp.create();
  if (kind === "cartridge") return AutoMovieArchetypeStageCartridgeProp.create();
  return AutoMovieArchetypeStageStoneProp.create();
}

/** The named bow silhouette for each saved bow kind. */
function bow(kind: AutoMovieArchetypeBow.Kind): AutoMovieArchetype {
  return kind === "crossbow"
    ? AutoMovieArchetypeStageStockBowProp.create()
    : AutoMovieArchetypeStageHandBowProp.create({ kind });
}

/** The named bat or baton for each saved club kind. */
function club(kind: AutoMovieArchetypeClub.Kind): AutoMovieArchetype {
  return kind === "bat" ? AutoMovieArchetypeBaseballBat.create() : AutoMovieArchetypePracticeBaton.create();
}
