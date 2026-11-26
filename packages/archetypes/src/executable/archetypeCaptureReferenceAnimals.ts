import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetypeQuadrupedBody } from "../animals/AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedEquipment } from "../animals/AutoMovieArchetypeQuadrupedEquipment";
import type { AutoMovieArchetypeQuadrupedLead } from "../animals/AutoMovieArchetypeQuadrupedLead";
import { AutoMovieArchetypeQuadrupedLocomotion } from "../animals/AutoMovieArchetypeQuadrupedLocomotion";
import { buildCamelBody } from "../animals/camel/internal/buildCamelBody";
import { createCamel } from "../animals/createCamel";
import { createDeer } from "../animals/createDeer";
import { createOx } from "../animals/createOx";
import { buildDeerBody } from "../animals/deer/internal/buildDeerBody";
import { buildOxBody } from "../animals/ox/internal/buildOxBody";
import { rideQuadruped } from "../animals/rideQuadruped";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Reference species, equipment and authored faster-gait consumers.
 *
 * @returns Bare and combined-equipment subjects, their walks and explicitly
 *   authored faster rides.
 */
export function archetypeCaptureReferenceAnimals(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const ox: ReturnType<typeof createOx> = createOx(createOx.REFERENCE, 73);
  const camel: ReturnType<typeof createCamel> = createCamel(
    createCamel.REFERENCE,
    73,
  );
  const deer: ReturnType<typeof createDeer> = createDeer(
    createDeer.REFERENCE,
    73,
  );
  const oxRig: AutoMovieArchetypeQuadrupedBody.IRig =
    AutoMovieArchetypeQuadrupedBody.rig(buildOxBody(), ox.dimensions);
  const camelRig: AutoMovieArchetypeQuadrupedBody.IRig =
    AutoMovieArchetypeQuadrupedBody.rig(buildCamelBody(), camel.dimensions);
  const neckLength: number = Vector3.length(
    Vector3.subtract(oxRig.poll, oxRig.neck),
  );

  // Explicit gallery dimensions derived from the rest landmarks, not maker or population data.
  const beam: number = oxRig.neckRadius / 8;
  const equippedOx: ReturnType<typeof createOx> = createOx(
    {
      ...createOx.REFERENCE,
      lead: lead(oxRig),
      equipment: {
        pack: pack(oxRig),
        yoke: {
          width: 4 * oxRig.neckRadius,
          radius: beam,
          neckAt: neckLength / 2,
          clearance: beam,
          hook: {
            radius: beam / 2,
            opening: oxRig.neckRadius,
            depth: oxRig.neckRadius / 2,
          },
        },
      },
    },
    73,
  );
  const equippedCamel: ReturnType<typeof createCamel> = createCamel(
    {
      ...createCamel.REFERENCE,
      lead: lead(camelRig),
      equipment: { pack: pack(camelRig) },
    },
    73,
  );
  const equippedDeer: ReturnType<typeof createDeer> = createDeer(
    {
      ...createDeer.REFERENCE,

      // This number now declares complete authored model kilograms, rather than a measured bare/equipment sum.
      mass: deer.dimensions.mass!,
      lead: lead(
        AutoMovieArchetypeQuadrupedBody.rig(buildDeerBody(), deer.dimensions),
      ),
    },
    73,
  );
  const entries: Record<string, archetypeCaptureCatalog.ISubject> = {
    "reference-quadrupeds": archetypeCaptureSubject.still({ ox, camel, deer }),
    "equipped-quadrupeds": archetypeCaptureSubject.still({
      "yoked-packed-led-ox": equippedOx,
      "packed-led-camel": equippedCamel,
      "led-deer": equippedDeer,
    }),
  };
  for (const [name, animal, speed] of [
    ["ox", ox, 0.71],
    ["camel", camel, 1.08],
    ["deer", deer, 0.78],
  ] as const)
    entries[`ride-${name}-walk`] = archetypeCaptureSubject.moving(
      name,
      rideQuadruped(
        animal,
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 12 }],
          cruise: speed,
          startSpeed: speed,
          endSpeed: speed,
        },
        "walk",
      ),
      animal,
    );
  for (const [name, animal, speed] of [
    ["ox", equippedOx, 0.71],
    ["camel", equippedCamel, 1.08],
    ["deer", equippedDeer, 0.78],
  ] as const)
    entries[`ride-equipped-${name}-walk`] = archetypeCaptureSubject.moving(
      name,
      rideQuadruped(
        animal,
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 12 }],
          cruise: speed,
          startSpeed: speed,
          endSpeed: speed,
        },
        "walk",
      ),
      animal,
    );

  // These round authoring choices demonstrate capability, not unreported biological timing measurements.
  entries["ride-camel-pace"] = archetypeCaptureSubject.moving(
    "camel",
    rideQuadruped(
      camel,
      {
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: 12 }],
        cruise: 3,
        startSpeed: 3,
        endSpeed: 3,
      },
      "pace",
      AutoMovieArchetypeQuadrupedLocomotion.camel({
        pace: [{ speed: 3, stride: 1, foreStance: 0.45, hindStance: 0.45 }],
      }),
    ),
    camel,
  );
  const authoredDeer: ReturnType<
    typeof AutoMovieArchetypeQuadrupedLocomotion.deer
  > = AutoMovieArchetypeQuadrupedLocomotion.deer({
    trot: [{ speed: 2, stride: 0.6, foreStance: 0.3, hindStance: 0.3 }],
    gallop: [{ speed: 4, stride: 0.5, foreStance: 0.2, hindStance: 0.2 }],
  });
  for (const [gait, speed] of [
    ["trot", 2],
    ["gallop", 4],
  ] as const)
    entries[`ride-deer-${gait}`] = archetypeCaptureSubject.moving(
      "deer",
      rideQuadruped(
        deer,
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 12 }],
          cruise: speed,
          startSpeed: speed,
          endSpeed: speed,
        },
        gait,
        authoredDeer,
      ),
      deer,
    );
  return entries;
}

/**
 * Authored inspection collar/lead ratios fit the neck; they are not maker
 * dimensions.
 */
function lead(
  rig: AutoMovieArchetypeQuadrupedBody.IRig,
): AutoMovieArchetypeQuadrupedLead.IParams {
  return {
    width: Vector3.length(Vector3.subtract(rig.poll, rig.neck)) / 8,
    thickness: rig.neckRadius / 16,
    leadLength: rig.barrel * 2,
    leadRadius: rig.neckRadius / 32,
  };
}

/**
 * Explicit gallery pack dimensions use the free trunk span, barrel and neck
 * footprint.
 */
function pack(
  rig: AutoMovieArchetypeQuadrupedBody.IRig,
): AutoMovieArchetypeQuadrupedEquipment.IPack {
  const length: number = (rig.trunk - 2 * rig.neckRadius) / 2;
  const thickness: number = rig.barrel / 8;
  return {
    length,
    width: rig.barrel / 2,
    thickness,
    railRadius: thickness / 4,
    clearance: thickness,
    hook: { radius: thickness / 8, opening: length / 4, depth: length / 8 },
  };
}
