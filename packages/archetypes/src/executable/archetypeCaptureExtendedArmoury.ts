import { AutoMovieGravity, Vector3, projectileAt } from "@automovie/engine";
import type {
  IAutoMovieProjectile,
  IAutoMovieProjectileState,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeTrack,
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
 * Museum armour pieces, both siege engines/arm throws and a field-gun launch.
 * Armour remains an unworn static model; there is no Human or Motion consumer.
 * The siege's arm/release is shown without substituting a hand-thrown stone for
 * its differently sized projectile. Cannon flight is explicitly drag-free.
 *
 * @returns Named static armour/siege subjects, each kind's arm throw and a
 *   cannon/shot launch.
 */
export function archetypeCaptureExtendedArmoury(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const engines: Record<string, AutoMovieArchetype> =
    archetypeCaptureSubject.kinds(
      "siege",
      createSiegeEngine.KINDS,
      (kind: createSiegeEngine.Kind): AutoMovieArchetype =>
        createSiegeEngine({ kind }),
    );
  const armour: Record<string, AutoMovieArchetype> =
    archetypeCaptureSubject.kinds(
      "armour",
      createArmour.KINDS,
      (kind: createArmour.Kind): AutoMovieArchetype => createArmour({ kind }),
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
    const pin: AutoMovieArchetypeTrack.ITrack<createSiegeEngine.Affordance> =
      AutoMovieArchetypeTrack.ease(engine, "pin", {
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
          at: (seconds: number): { archetype: AutoMovieArchetype } => ({
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
        at: (seconds: number): { archetype: AutoMovieArchetype } => {
          const state: IAutoMovieProjectileState = projectileAt(
            flight,
            Math.max(0, seconds - fire),
          );
          return {
            archetype: AutoMovieArchetypeAssembly.of(
              "capture-cannon-launch",
              "Actual 6-pdr muzzle launch",
              {
                cannon: {
                  archetype: gun,
                  placement: AutoMovieArchetypeFrame.upright({
                    x: 0,
                    y: 0,
                    z: 0,
                  }),
                },
                shot: {
                  archetype: shot,
                  placement: AutoMovieArchetypeFrame.upright(
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
