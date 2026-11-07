import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
  IAutoMovieVector3 as V,
} from "@automovie/interface";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { preparePhysicalGeometry as Geometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";
import { AutoMovieHumanLimbIk as LimbIk } from "../../../../packages/human/src/skeleton/AutoMovieHumanLimbIk";
import { AutoMovieHumanPhysicalProfile as Provider } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalProfile";
import type { AutoMovieHumanSkeleton as Skeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import { HumanPeople } from "./HumanPeople";
import { PhysicalFixtures } from "./PhysicalFixtures";
import { PhysicalHumanFixtures } from "./PhysicalHumanFixtures";
import { PhysicalPerformanceFixtures as Performance } from "./PhysicalPerformanceFixtures";

/** Complete contact classification and incoming-speed sweep on an actual tracked Human with provider-owned glove equipment. */
export async function measurePhysicalHumanContacts(): Promise<
  measurePhysicalHumanContacts.IObservation[]
> {
  const bare: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get();
  const hand: P.ISegment = bare.profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === "leftHand",
  )!;
  const elbow: P.ISegment = bare.profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === "leftLowerArm",
  )!;
  const offset: V = Quaternion.rotateVector(
    Quaternion.inverse(hand.neutral.rotation),
    Vector3.scale(
      Vector3.normalize(
        Vector3.subtract(hand.neutral.position, elbow.neutral.position),
      ),
      0.065,
    ),
  );
  const equipment: Provider.IEquipment = {
    bone: "leftHand",
    mass: 0.5,
    centerOfMass: offset,
    inertia: { x: 0.001805, y: 0.001805, z: 0.001805 },
    shape: {
      id: "covering-glove",
      material: "glove",
      kind: "sphere",
      radius: 0.095,
      transform: { position: offset, rotation: Quaternion.identity() },
    },
  };
  const person: ReturnType<typeof Provider.prepare> = Provider.prepare(
    HumanPeople.params("m1"),
    {
      mass: 80,
      frequency: 20,
      dampingRatio: 1,
      torquePerKg: 50,
      passiveRate: 5,
      equipment: [equipment],
      materials: [
        {
          id: "skin",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
        {
          id: "glove",
          friction: 0.4,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      skin: "skin",
    },
  );
  const head: P.ISegment = person.profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === "head",
  )!;
  const center: V = Vector3.add(
    head.neutral.position,
    Quaternion.rotateVector(
      head.neutral.rotation,
      head.shapes[0]!.transform.position,
    ),
  );
  const guard: ReturnType<ReturnType<typeof LimbIk.prepare>> = LimbIk.prepare(
    person.evaluate,
  )({
    pose: {
      arms: {
        left: { shoulder: { flexion: 90 }, elbow: { flexion: 100 } },
        right: {},
      },
    },
    root: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
    gloveOffset: 0.065,
    priorWeight: 0.0001,
    arms: {
      left: {
        point: [center.x + 0.25, center.y, center.z],
        aim: {
          bone: "elbow",
          point: [center.x + 0.05, center.y - 0.2, center.z + 0.2],
          weight: 0.5,
        },
      },
    },
  });
  const observations: measurePhysicalHumanContacts.IObservation[] = [];
  const geometry: Geometry.IQueries = await Geometry();
  for (const motion of ["free", "jab"] as const)
    for (const scenario of [
      { kind: "hit", speed: 2 },
      { kind: "hit", speed: 4 },
      { kind: "guard", speed: 4 },
      { kind: "slip", speed: 4 },
    ] as const) {
      const duration: number = 0.8;
      const receiver: Simulation.IBody = Performance.trackedBody(
        person.profile,
        duration,
      );
      if (scenario.kind === "guard") {
        const poses: Map<string, Skeleton.IPlacement> = new Map(
          guard.output.posed.map(
            (placement: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
              placement.bone,
              placement,
            ],
          ),
        );
        for (const target of receiver.targets)
          target.segments = Object.fromEntries(
            person.profile.segments.map(
              (segment: P.ISegment): [string, P.ITransform] => {
                const pose: Skeleton.IPlacement = poses.get(segment.bone)!;
                return [
                  segment.bone,
                  {
                    position: {
                      x: pose.position[0],
                      y: pose.position[1],
                      z: pose.position[2],
                    },
                    rotation: {
                      x: pose.rotation[0],
                      y: pose.rotation[1],
                      z: pose.rotation[2],
                      w: pose.rotation[3],
                    },
                  },
                ];
              },
            ),
          );
      }
      const glove: P = PhysicalFixtures.sphere(0.095, 0.0002);
      glove.materials[0]!.id = "glove";
      glove.segments[0]!.shapes[0]!.material = "glove";
      const position: V = {
        x: center.x + 0.6,
        y: center.y + (scenario.kind === "slip" ? 0.4 : 0),
        z: center.z,
      };
      const striker: Simulation.IBody = PhysicalFixtures.body(
        "incoming-glove",
        glove,
        duration,
        { position, rotation: Quaternion.identity() },
      );
      if (motion === "jab") {
        Performance.track(striker);
        // Maximum forward extension reaches the original receiver centre plane.
        // The same finite actuator then withdraws toward the initial hand pose;
        // this is a jab, while the free control retains passive recontacts.
        const extension: number = (position.x - center.x) / scenario.speed;
        for (const [step, target] of striker.targets.entries())
          target.strength = step / 120 >= extension ? 1 : 0;
      }
      const input: Simulation.IInput = PhysicalFixtures.input(
        [receiver, striker],
        duration,
      );
      Object.assign(input, { substeps: 32, iterations: 12 });
      input.impulses.push({
        step: 1,
        body: striker.id,
        bone: "root",
        point: position,
        impulse: { x: -scenario.speed * glove.mass, y: 0, z: 0 },
      });
      const run: Simulation = await Simulation.compute(input);
      const contacts: Receipt[] = run.cache.contacts.filter(
        (receipt: Receipt): boolean =>
          [receipt.a.body, receipt.b.body].includes(striker.id) &&
          [receipt.a.body, receipt.b.body].includes(receiver.id),
      );
      const initial: V = run.cache.at(0).bodies[receiver.id]!.head!.position;
      const peak: number = Math.max(
        ...run.cache.frames.map(
          (frame: (typeof run.cache.frames)[number]): number =>
            Vector3.length(
              Vector3.subtract(
                frame.bodies[receiver.id]!.head!.position,
                initial,
              ),
            ),
        ),
      );
      const face: Receipt[] = contacts.filter((receipt: Receipt): boolean =>
        [receipt.a, receipt.b].some(
          (side: Receipt["a"]): boolean =>
            side.body === receiver.id && side.bone === head.bone,
        ),
      );
      const gaps: number[] = face
        .slice(1)
        .map((receipt: Receipt, index: number): number =>
          Math.max(
            0,
            ...run.cache.frames
              .filter(
                (frame: (typeof run.cache.frames)[number]): boolean =>
                  frame.seconds > face[index]!.endSeconds &&
                  frame.seconds < receipt.seconds,
              )
              .map(
                (frame: (typeof run.cache.frames)[number]): number =>
                  geometry.contact(
                    {
                      body: striker.id,
                      bone: "root",
                      shape: glove.segments[0]!.shapes[0]!,
                      pose: frame.bodies[striker.id]!.root!,
                    },
                    {
                      body: receiver.id,
                      bone: head.bone,
                      shape: head.shapes[0]!,
                      pose: frame.bodies[receiver.id]![head.bone]!,
                    },
                    frame.seconds,
                    10,
                  )?.separation ?? 0,
              ),
          ),
        );
      observations.push({
        ...scenario,
        motion,
        guardError: guard.error,
        peak,
        contacts,
        gaps,
      });
    }
  return observations;
}

/** Actual native episodes and matching head motion, collected before assertions. */
export namespace measurePhysicalHumanContacts {
  /** One complete fixed-input scenario. */
  export interface IObservation {
    /** A free projectile control or a finite-actuator jab with withdrawal. */ motion:
      | "free"
      | "jab";
    /** Explicit choreography class. */ kind: "hit" | "guard" | "slip";
    /** Incoming glove metres/second. */ speed: number;
    /** Actual clinical guard residual, metres. */ guardError: number;
    /** Maximum actual head-origin displacement, metres. */ peak: number;
    /** Native incoming-glove contact episodes only. */ contacts: Receipt[];
    /** Measured positive geometric clearance between consecutive face episodes, not an episode-id inference. */ gaps: number[];
  }
}
