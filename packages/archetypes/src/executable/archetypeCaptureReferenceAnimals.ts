import { Vector3 } from "@automovie/engine";

import { CamelBody, OxBody, QuadrupedBody, QuadrupedLocomotion, createCamel, createDeer, createOx, rideQuadruped } from "../animals";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Actual reference species, equipment and authored faster-gait consumers.
 *
 * @returns Canonical coarse static subjects and real measured-walk/authored-fast rides.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes measured reference dimensions and walking clocks from authored presentation mass, equipment dimensions and faster clocks.
 * @evidence contracts/development/implementation.md#principled-implementation Actual public producers make each model and real equipment; the shared ride samples their species tables or explicitly authored faster clocks. Every picture uses those actual model/placement outputs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build three bare references, two explicitly dimensioned equipment variants and actual shared rides for their measured walks and declared faster constructions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No renderer-only animal, biological default clock, source weight for an unweighed cohort, hidden override or perfect-fit/load claim supplies the subject. Construction inputs here are inspection choices, not producer defaults.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed collection of reference models and existing bounded ride plans is prepared once; current poses are read through their actual samplers.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static and moving subjects share immutable source references and the same capture/model/ride owners as production consumers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Catalogue records retain only their models/plans, opening no process or renderer here; the host owns actual drawing resources.
 */
export function archetypeCaptureReferenceAnimals(): Readonly<Record<string, archetypeCaptureCatalog.ISubject>> {
  const ox: ReturnType<typeof createOx> = createOx(createOx.REFERENCE, 73);
  const camel: ReturnType<typeof createCamel> = createCamel(createCamel.REFERENCE, 73);
  const deer: ReturnType<typeof createDeer> = createDeer({}, 73);
  const oxRig: QuadrupedBody.IRig = QuadrupedBody.rig(OxBody(), ox.dimensions);
  const camelRig: QuadrupedBody.IRig = QuadrupedBody.rig(CamelBody(), camel.dimensions);
  const neckLength: number = Vector3.length(Vector3.subtract(oxRig.poll, oxRig.neck));

  // Explicit gallery dimensions derived from the actual rest landmarks, not maker or population data.
  const beam: number = oxRig.neckRadius / 8;
  const equippedOx: ReturnType<typeof createOx> = createOx({ ...createOx.REFERENCE,
    equipment: { yoke: { width: 4 * oxRig.neckRadius, radius: beam,
      neckAt: neckLength / 2, clearance: beam,
      hook: { radius: beam / 2, opening: oxRig.neckRadius, depth: oxRig.neckRadius / 2 } } },
  }, 73);
  const pad: number = camelRig.barrel / 8;
  const packLength: number = (camelRig.trunk - 2 * camelRig.neckRadius) / 2;
  const equippedCamel: ReturnType<typeof createCamel> = createCamel({ ...createCamel.REFERENCE,
    equipment: { pack: { length: packLength, width: camelRig.barrel / 2,
      thickness: pad, railRadius: pad / 4, clearance: pad,
      hook: { radius: pad / 8, opening: packLength / 4, depth: packLength / 8 } } },
  }, 73);
  const entries: Record<string, archetypeCaptureCatalog.ISubject> = {
    "reference-quadrupeds": archetypeCaptureSubject.still({ ox, camel, deer }),
    "equipped-quadrupeds": archetypeCaptureSubject.still({ "yoked-ox": equippedOx, "pack-camel": equippedCamel }),
  };
  for (const [name, animal, speed] of [["ox", ox, 0.71], ["camel", camel, 1.08], ["deer", deer, 0.78]] as const)
    entries[`ride-${name}-walk`] = archetypeCaptureSubject.moving(name, rideQuadruped(animal,
      { start: { x: 0, z: 0, heading: 0 }, legs: [{ kind: "straight", length: 12 }], cruise: speed, startSpeed: speed, endSpeed: speed }, "walk"));

  // These round authoring choices demonstrate capability, not unreported biological timing measurements.
  entries["ride-camel-pace"] = archetypeCaptureSubject.moving("camel", rideQuadruped(camel,
    { start: { x: 0, z: 0, heading: 0 }, legs: [{ kind: "straight", length: 12 }], cruise: 3, startSpeed: 3, endSpeed: 3 }, "pace",
    QuadrupedLocomotion.camel({ pace: [{ speed: 3, stride: 1, foreStance: 0.45, hindStance: 0.45 }] })));
  const authoredDeer: ReturnType<typeof QuadrupedLocomotion.deer> = QuadrupedLocomotion.deer({
    trot: [{ speed: 2, stride: 0.6, foreStance: 0.3, hindStance: 0.3 }],
    gallop: [{ speed: 4, stride: 0.5, foreStance: 0.2, hindStance: 0.2 }],
  });
  for (const [gait, speed] of [["trot", 2], ["gallop", 4]] as const)
    entries[`ride-deer-${gait}`] = archetypeCaptureSubject.moving("deer", rideQuadruped(deer,
      { start: { x: 0, z: 0, heading: 0 }, legs: [{ kind: "straight", length: 12 }], cruise: speed, startSpeed: speed, endSpeed: speed }, gait, authoredDeer));
  return entries;
}
