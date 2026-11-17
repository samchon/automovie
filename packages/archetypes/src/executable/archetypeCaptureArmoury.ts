import type { Archetype } from "../core";
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
  createProjectile,
  createShield,
  createSword,
} from "../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * The capture catalog's armoury: the firearms, their holsters and magazines, the projectiles, bows, cannon and clubs, and the blades, shields, polearms and pell, each every kind of its producers at the middle of their bands.
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
        (frame: createHandgun.Frame): Archetype => createHandgun({ frame }),
      ),
      ...kinds(
        "holster",
        createHolster.KINDS,
        (kind: createHolster.Kind): Archetype => createHolster({ kind }),
      ),
      ...kinds(
        "magazine",
        createMagazine.KINDS,
        (kind: createMagazine.Kind): Archetype => createMagazine({ kind }),
      ),
      ...kinds(
        "projectile",
        createProjectile.KINDS,
        (kind: createProjectile.Kind): Archetype => createProjectile({ kind }),
      ),
      ...kinds(
        "bow",
        createBow.KINDS,
        (kind: createBow.Kind): Archetype => createBow({ kind }),
      ),
      ...kinds(
        "cannon",
        createCannon.KINDS,
        (kind: createCannon.Kind): Archetype => createCannon({ kind }),
      ),
      ...kinds(
        "longGun",
        createLongGun.KINDS,
        (kind: createLongGun.Kind): Archetype => createLongGun({ kind }),
      ),
      ...kinds(
        "club",
        createClub.KINDS,
        (kind: createClub.Kind): Archetype => createClub({ kind }),
      ),
    }),
    blades: still({
      ...kinds(
        "sword",
        createSword.KINDS,
        (kind: createSword.Kind): Archetype => createSword({ kind }),
      ),
      ...kinds(
        "shield",
        createShield.KINDS,
        (kind: createShield.Kind): Archetype => createShield({ kind }),
      ),
      ...kinds(
        "polearm",
        createPolearm.KINDS,
        (kind: createPolearm.Kind): Archetype => createPolearm({ kind }),
      ),
      pell: createPell(),
    }),
  };
}
