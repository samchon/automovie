import {
  AutoMovieGravity,
  type IAutoMovieProjectile,
  type IAutoMovieProjectileState,
  Vector3,
  projectileAt,
} from "@automovie/engine";

import {
  type Archetype,
  ArchetypeAssembly,
  ArchetypeFrame,
  ArchetypeTrack,
} from "../core";
import {
  createArmour,
  createCannon,
  createProjectile,
  createSiegeEngine,
} from "../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Museum armour pieces, both actual siege engines/arm throws and a field-gun launch.
 * Armour remains an unworn static model; there is no Human or Motion consumer.
 * The siege's actual arm/release is shown without substituting a hand-thrown
 * stone for its differently sized projectile. Cannon flight is explicitly drag-free.
 *
 * @returns Named static armour/siege subjects, each kind's actual arm throw and a cannon/shot launch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every public armour/siege kind, source-owned pendulum arm/release, real pin extraction from zero to the existing 0.5 s arm-start cue, unworn armour limitation and a 5-degree 6-pdr launch with an authored 0.1 s fire cue/0.04 s drag-free flight window.
 * @evidence contracts/development/implementation.md#principled-implementation Public producers own all geometry. throwAt supplies each actual arm track/release; the existing minimum-jerk ease extracts the actual pin from zero to its authored travel before that arm track starts. createCannon.launch supplies actual muzzle/bore speed; projectileAt evolves the matching six-pounder shot under standard gravity without a second ballistic law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the static kind surveys, add each source-owned mechanical throw and finish with one spatially coherent cannon/shot assembly consumer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No performer or Motion dependency, mismatched siege-stone mass, renderer-only model, hand-authored arm curve, fake recoil/impact, altered launch data or hidden drag claim is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepare K public models and one arm/pin track pair per siege kind once; each seek reads its prepared scalar tracks or constant-acceleration flight and assembles actual parts in linear model-size work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every throw reuses its actual engine and prepared arm/pin tracks, and the shot reuses one immutable launch record and producer geometry across seeks.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The subject records own a finite model/track/launch set for the catalog lifetime; no completed frames, global caches, external processes or resource handles are retained.
 */
export function archetypeCaptureExtendedArmoury(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const engines: Record<string, Archetype> = archetypeCaptureSubject.kinds(
    "siege",
    createSiegeEngine.KINDS,
    (kind: createSiegeEngine.Kind): Archetype => createSiegeEngine({ kind }),
  );
  const armour: Record<string, Archetype> = archetypeCaptureSubject.kinds(
    "armour",
    createArmour.KINDS,
    (kind: createArmour.Kind): Archetype => createArmour({ kind }),
  );
  const subjects: Record<string, archetypeCaptureCatalog.ISubject> = {
    "siege-engines": archetypeCaptureSubject.still(engines),
    "armour-pieces": archetypeCaptureSubject.still(armour),
  };
  for (const kind of createSiegeEngine.KINDS) {
    const engine: ReturnType<typeof createSiegeEngine> = createSiegeEngine({
      kind,
    });
    const thrown: createSiegeEngine.IThrow = createSiegeEngine.throwAt(
      engine,
      0.5,
    );
    const pin: ArchetypeTrack.ITrack<createSiegeEngine.Affordance> =
      ArchetypeTrack.ease(engine, "pin", {
        start: 0,
        seconds: thrown.track.start,
        from: 0,
        to: engine.affordance("pin").travel!,
      });
    subjects[`siege-${kind}-throw`] = {
      duration: thrown.track.end,
      instants: [
        { seconds: thrown.track.start, label: "pin-release" },
        { seconds: thrown.second, label: "projectile-release" },
        { seconds: thrown.track.end, label: "arm-track-end" },
      ],
      members: [
        {
          name: `${kind}-arm`,
          at: (seconds: number): { archetype: Archetype } => ({
            archetype: engine.articulate({
              arm: thrown.track.travel(seconds),
              pin: pin.travel(seconds),
            }),
          }),
        },
      ],
    };
  }
  const gun: ReturnType<typeof createCannon> = createCannon({
    kind: "fieldGun",
  }).articulate({ elevation: 5 });
  const shot: ReturnType<typeof createProjectile> = createProjectile({
    kind: "roundShot",
    model: "sixPounder",
  });
  const launch: createCannon.ILaunch = createCannon.launch(gun);
  if (shot.dimensions.diameter !== launch.calibre)
    throw new RangeError(
      "The canonical shot must match the actual six-pounder muzzle launch calibre",
    );
  const flight: IAutoMovieProjectile = {
    origin: { ...launch.origin },
    velocity: Vector3.scale(launch.direction, launch.speed),
    gravity: { x: 0, y: -AutoMovieGravity.STANDARD, z: 0 },
  };
  const fire: number = 0.1;
  subjects["cannon-launch"] = {
    duration: fire + 0.04,
    instants: [
      { seconds: 0, label: "aimed" },
      { seconds: fire, label: "muzzle-release" },
      { seconds: fire + 0.04, label: "drag-free-window-end" },
    ],
    members: [
      {
        name: "field-gun-and-shot",
        at: (seconds: number): { archetype: Archetype } => {
          const state: IAutoMovieProjectileState = projectileAt(
            flight,
            Math.max(0, seconds - fire),
          );
          return {
            archetype: ArchetypeAssembly.of(
              "capture-cannon-launch",
              "Actual 6-pdr muzzle launch",
              {
                cannon: {
                  archetype: gun,
                  placement: ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
                },
                shot: {
                  archetype: shot,
                  placement: ArchetypeFrame.upright(
                    Vector3.subtract(
                      state.position,
                      shot.affordance("body").frame.translation,
                    ),
                  ),
                },
              },
            ),
          };
        },
      },
    ],
  };
  return subjects;
}
