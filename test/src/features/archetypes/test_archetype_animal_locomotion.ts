import {
  type Archetype,
  ArchetypeFrame,
  type ArchetypeRide,
  OxBody,
  QuadrupedBody,
  type QuadrupedGait,
  QuadrupedLocomotion,
  createCamel,
  createDeer,
  createDog,
  createOx,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";

/** A separately authored contract case, not read from a producer's gait table. */
interface ICase {
  /** Actual model from its public factory. */
  animal: fixture.Animal;
  /** Explicit faster gait for this case. */
  gait: "pace" | "trot" | "gallop";
  /** Caller-supplied SI clocks. */
  clock: QuadrupedLocomotion.IClock;
  /** Table produced from this case's explicit authoring input. */
  table: QuadrupedGait.ITable;
}

/** Compare declared carried contacts/equipment with the actual head's independently observed rigid displacement. */
function carried<Id extends string, D extends string>(
  animal: Archetype<Id, D | QuadrupedBody.Dimension>,
  speed: number,
  contacts: readonly Id[],
  parts: readonly string[],
  findings: string[],
): void {
  const table: QuadrupedGait.ITable = QuadrupedLocomotion.admit(
    createQuadruped.species(animal).table,
  );
  table.gaits.walk!.nod = { range: 20, timing: "support" };
  const ride: ArchetypeRide.IRide<Id, D | QuadrupedBody.Dimension> =
    rideQuadruped<Id, D>(animal, fixture.course(speed), "walk", table);
  const sample: ReturnType<typeof ride.at> = ride.at(1.137);
  const rest: IAutoMovieTransform = animal.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "head",
  )!.transform!;
  const posed: IAutoMovieTransform = sample.archetype.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "head",
  )!.transform!;
  const change: IAutoMovieQuaternion = Quaternion.multiply(posed.rotation, {
    x: -rest.rotation.x,
    y: -rest.rotation.y,
    z: -rest.rotation.z,
    w: rest.rotation.w,
  });
  if (Math.abs(change.w) >= 1 - 1e-8)
    findings.push(`${animal.archetype}: the authored nonzero nod was lost`);
  const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      posed.translation,
      Quaternion.rotateVector(
        change,
        Vector3.subtract(point, rest.translation),
      ),
    );
  for (const id of contacts) {
    const before: IAutoMovieTransform = animal.affordance(id).frame;
    const actual: IAutoMovieTransform = ride.frame(id, 1.137);
    const expected: IAutoMovieTransform = ArchetypeFrame.compose(
      sample.placement,
      {
        translation: local(before.translation),
        rotation: Quaternion.multiply(change, before.rotation),
        scale: { ...before.scale },
      },
    );
    fixture.near(
      findings,
      `${animal.archetype}/${id} head-carried point`,
      Vector3.length(
        Vector3.subtract(actual.translation, expected.translation),
      ),
      0,
      1e-10,
    );
    fixture.near(
      findings,
      `${animal.archetype}/${id} head-carried rotation`,
      Vector3.length(
        Vector3.subtract(
          Quaternion.rotateVector(actual.rotation, { x: 0, y: 1, z: 0 }),
          Quaternion.rotateVector(expected.rotation, { x: 0, y: 1, z: 0 }),
        ),
      ),
      0,
      1e-10,
    );
    if (id === "lead") {
      const rope: IAutoMovieModelPart = sample.archetype.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === "lead",
      )!;
      fixture.near(
        findings,
        `${animal.archetype} contact meets actual rope`,
        Vector3.length(
          Vector3.subtract(
            actual.translation,
            ArchetypeFrame.point(sample.placement, rope.transform!.translation),
          ),
        ),
        0,
        1e-10,
      );
    }
  }
  for (const id of parts) {
    const before: IAutoMovieModelPart = animal.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === id,
    )!;
    const actual: IAutoMovieModelPart = sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === id,
    )!;
    fixture.near(
      findings,
      `${animal.archetype}/${id} shares head carriage`,
      Vector3.length(
        Vector3.subtract(
          actual.transform!.translation,
          local(before.transform!.translation),
        ),
      ),
      0,
      1e-10,
    );
  }
}

/**
 * Actual camel/deer consumers run authored faster cycles through the common ride.
 *
 * Scenarios cover pace at 3 m/s with a 1 s cycle, trot at 2 m/s with a 0.6 s
 * cycle, rotary gallop at 4 m/s with a 0.5 s cycle, both leads and all four feet.
 * A second pace independently shortens hind support from 0.45 to 0.35 s;
 * a two-row authored interval is also ridden at its independent midpoint.
 * These are authored prototype clocks and construction phases, not empirical
 * dromedary/sika timing or proof of anatomical ROM, skin contact or dynamics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists actual consumers, authored SI clocks, lead/phase cases, separate support durations, physical endpoint assertions and unverified biological fidelity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls real factories and the four-argument shared ride, reads actual published landings and transformed lower-bar endpoints, and detects wrong periods, diagonal/lateral confusion, rotary lead errors, sliding support or missing swing.
 * @evidence contracts/development/testing.md#independent-expectations Caller literals supply periods and stance seconds. The specified pace pairs same-side feet, trot pairs diagonals and the authored rotary order is LH→RH→RF→LF with opposite leading sides; right-lead fractions are stated independently. A planted point remains fixed within the existing 1 mm contact contract and a swinging endpoint clears that bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Three faster gaits, two leads, four actual feet, distinct fore/hind release times and nonzero world translation/yaw distinguish correct physical timing from metadata alone; malformed inputs and mutation isolation have separate test files.
 * @evidence contracts/development/testing.md#execution-ownership This exported synchronous unit owns finite in-memory models and six-second plans; it launches no renderer, host, compiler or external process and changes no registry or method.
 */
export function test_archetype_animal_locomotion(): void {
  const findings: string[] = [];
  const camel: fixture.Animal = createCamel(
    { ...createCamel.REFERENCE, tempo: 0 },
    73,
  );
  const deer: fixture.Animal = createDeer({ tempo: 0 }, 73);
  const pace: QuadrupedLocomotion.IClock = {
    speed: 3,
    stride: 1,
    foreStance: 0.45,
    hindStance: 0.45,
  };
  const shorter: QuadrupedLocomotion.IClock = { ...pace, hindStance: 0.35 };
  const trot: QuadrupedLocomotion.IClock = {
    speed: 2,
    stride: 0.6,
    foreStance: 0.3,
    hindStance: 0.3,
  };
  const gallop: QuadrupedLocomotion.IClock = {
    speed: 4,
    stride: 0.5,
    foreStance: 0.2,
    hindStance: 0.2,
  };
  const deerTable: QuadrupedGait.ITable = QuadrupedLocomotion.deer({
    trot: [trot],
    gallop: [gallop],
  });
  const interval: QuadrupedGait.ITable = QuadrupedLocomotion.camel({
    pace: [
      shorter,
      { speed: 4, stride: 0.8, foreStance: 0.36, hindStance: 0.28 },
    ],
  });
  const cases: readonly ICase[] = [
    {
      animal: camel,
      gait: "pace",
      clock: pace,
      table: QuadrupedLocomotion.camel({ pace: [pace] }),
    },
    {
      animal: camel,
      gait: "pace",
      clock: shorter,
      table: QuadrupedLocomotion.camel({ pace: [shorter] }),
    },
    {
      animal: camel,
      gait: "pace",
      clock: { speed: 3.5, stride: 0.9, foreStance: 0.405, hindStance: 0.315 },
      table: interval,
    },
    { animal: deer, gait: "trot", clock: trot, table: deerTable },
    { animal: deer, gait: "gallop", clock: gallop, table: deerTable },
  ];
  for (const item of cases)
    for (const lead of ["left", "right"] as const) {
      const label: string = `${item.gait}/${lead}/hind${item.clock.hindStance}`;
      const ride: fixture.Ride = rideQuadruped(
        item.animal,
        fixture.course(item.clock.speed, lead),
        item.gait,
        item.table,
      );
      const starts: readonly { seconds: number; label: string }[] =
        ride.instants.filter(
          (instant: { seconds: number; label: string }): boolean =>
            instant.label === "leftForeOn" &&
            instant.seconds > 1 &&
            instant.seconds < ride.duration - 1,
        );
      if (starts.length < 2) {
        findings.push(`${label}: missing complete strides`);
        continue;
      }
      fixture.near(
        findings,
        `${label} period`,
        starts[1]!.seconds - starts[0]!.seconds,
        item.clock.stride,
        1e-9,
      );
      const zero: number = starts[0]!.seconds;
      const expected: Readonly<Record<QuadrupedBody.Limb, number>> =
        item.gait === "pace"
          ? { leftFore: 0, rightFore: 0.5, leftHind: 0, rightHind: 0.5 }
          : item.gait === "trot"
            ? { leftFore: 0, rightFore: 0.5, leftHind: 0.5, rightHind: 0 }
            : lead === "left"
              ? { leftFore: 0, rightFore: 0.75, leftHind: 0.25, rightHind: 0.5 }
              : {
                  leftFore: 0,
                  rightFore: 0.25,
                  leftHind: 0.75,
                  rightHind: 0.5,
                };
      for (const limb of fixture.FEET) {
        const landing: { seconds: number; label: string } | undefined =
          ride.instants.find(
            (instant: { seconds: number; label: string }): boolean =>
              instant.label === `${limb}On` && instant.seconds >= zero - 1e-9,
          );
        if (landing === undefined) {
          findings.push(`${label}: missing ${limb} landing`);
          continue;
        }
        fixture.near(
          findings,
          `${label} ${limb} phase`,
          landing.seconds - zero,
          expected[limb] * item.clock.stride,
          1e-8,
        );
        const stance: number = limb.endsWith("Fore")
          ? item.clock.foreStance
          : item.clock.hindStance;
        const early: IAutoMovieVector3 = fixture.foot(
          ride,
          limb,
          landing.seconds + 0.173 * stance,
        );
        const late: IAutoMovieVector3 = fixture.foot(
          ride,
          limb,
          landing.seconds + 0.811 * stance,
        );
        fixture.near(
          findings,
          `${label} ${limb} planted point`,
          Vector3.length(Vector3.subtract(early, late)),
          0,
          1e-3,
        );
        fixture.near(findings, `${label} ${limb} ground`, early.y, 0, 1e-3);
        fixture.near(findings, `${label} ${limb} late ground`, late.y, 0, 1e-3);
        const swing: IAutoMovieVector3 = fixture.foot(
          ride,
          limb,
          landing.seconds + stance + (item.clock.stride - stance) / 2,
        );
        if (!(swing.y > 1e-3))
          findings.push(
            `${label}: ${limb} did not clear the floor after its own support`,
          );
        if (
          item.clock.hindStance !== item.clock.foreStance &&
          limb.endsWith("Hind")
        ) {
          const released: IAutoMovieVector3 = fixture.foot(
            ride,
            limb,
            landing.seconds +
              (item.clock.foreStance + item.clock.hindStance) / 2,
          );
          if (!(released.y > 1e-3))
            findings.push(`${label}: ${limb} retained the longer fore stance`);
        }
      }
    }
  const lead: Readonly<{
    width: number;
    thickness: number;
    leadLength: number;
    leadRadius: number;
  }> = { width: 0.02, thickness: 0.003, leadLength: 0.6, leadRadius: 0.004 };
  carried(
    createDog({ mass: 22, tempo: 0, collar: lead }, 73),
    0.75,
    ["lead"],
    ["collar", "lead"],
    findings,
  );
  carried(
    createCamel({ ...createCamel.REFERENCE, tempo: 0, lead }, 73),
    1.08,
    ["lead"],
    ["collar", "lead"],
    findings,
  );
  carried(
    createDeer({ mass: 70, tempo: 0, lead }, 73),
    0.78,
    ["lead"],
    ["collar", "lead"],
    findings,
  );
  const bare: ReturnType<typeof createOx> = createOx(
    { ...createOx.REFERENCE, tempo: 0, lead },
    73,
  );
  const rig: QuadrupedBody.IRig = QuadrupedBody.rig(OxBody(), bare.dimensions);
  const beam: number = rig.neckRadius / 8;
  const yoked: ReturnType<typeof createOx> = createOx(
    {
      ...createOx.REFERENCE,
      tempo: 0,
      lead,
      equipment: {
        yoke: {
          width: 4 * rig.neckRadius,
          radius: beam,
          neckAt: Vector3.length(Vector3.subtract(rig.poll, rig.neck)) / 2,
          clearance: beam,
          hook: {
            radius: beam / 2,
            opening: rig.neckRadius,
            depth: rig.neckRadius / 2,
          },
        },
      },
    },
    73,
  );
  carried(
    yoked,
    0.71,
    ["lead", "hitch"],
    [
      "collar",
      "lead",
      "yoke-beam",
      "yoke-hitch-link",
      "yoke-hitch-base",
      "yoke-hitch-upright--1",
      "yoke-hitch-upright-1",
    ],
    findings,
  );
  TestValidator.equals(
    "authored faster animal clocks and physical endpoints",
    findings,
    [],
  );
}
