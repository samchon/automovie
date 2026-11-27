import { type AutoMovieArchetypeEquine, type AutoMovieArchetypeQuadrupedBody, type AutoMovieArchetypeRide, AutoMovieArchetypeQuadruped, type AutoMovieArchetypeHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalAttachmentScenario } from "./animalAttachmentScenario";
import { nclose } from "./nclose";

/** The four measured equid clocks exercised by this finite matrix. */
type Gait = "walk" | "trot" | "canter" | "gallop";

/** The actual common equid source type returned by its public producers. */
type Animal = ReturnType<typeof AutoMovieArchetypeHorse.create>;

/** Complete public ride type; the shared law adds its body dimensions. */
type Ride = AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension | AutoMovieArchetypeQuadrupedBody.Dimension
>;

/**
 * Exercise one equid producer across four tacks, selected clocks and both leads.
 *
 * @param produce The public producer with explicit cohort and dimension inputs.
 * @param name Species/cohort/seed identity included in every finding.
 * @param gaits Two selected clocks; slow/fast discoverable tests divide the matrix.
 * @param findings Whole-round failure collector owned by the exported test.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines sixteen successful six-second rides per two-gait call, four real tack/contact assemblies, both leads and independent clock scaling. Physical bar/sole/attachment checks use actual primitives; the table is an equine timing reference and not a pony, mule or donkey population validation.
 * @evidence contracts/development/implementation.md#principled-implementation Robilliard 2007 Tables 2/3 supply literal speed/stride/stance triples at the provisional 1.38 m reference. Multiplying all three by sqrt(actual height/1.38) gives declared dynamic-similarity inputs and independent timing expectations. The shared independent scenario observes actual geometry/event neighborhoods; complete public contact queries are checked against actual current frames composed with root placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Produce each actual tack, require its exact declared contact set, run each selected gait on both leads, inspect all public contact frames at one independent off-grid time and preserve the source across the complete tack matrix.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No implementation timing/range/pose output supplies expected clocks, no unsupported positive case is skipped, and no species geometry, fixture body offset, foreign-method replacement or wall-clock assertion hides a failure. Rein hands and head endpoints are constrained by actual source primitive frames.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four source models and sixteen prepared rides per two-gait call; each bounded event scenario uses O(P+A) work per observed sample. Full public frame composition is checked at one additional off-grid time rather than querying every contact at every sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same independent attachment/solid/replay scenario as dog and new reference-species tests; one actual source per tack serves both clocks and leads. Quaternion/vector composition reuses existing primitives without calling a carriage or span solver.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Models and rides are retained only for the current tack/case; prior sample maps die inside the scenario. Only caller-owned failure strings escape, with no host, cache or global state.
 */
export function equidAttachmentMatrix(
  produce: (tack: AutoMovieArchetypeEquine.Tack) => Animal,
  name: string,
  gaits: readonly Gait[],
  findings: string[],
): void {
  const rows: Readonly<Record<Gait, readonly [number, number, number]>> = {
    walk: [1.5, 0.904, 0.54],
    trot: [3, 0.637, 0.327],
    canter: [5, 0.496, 0.172],
    gallop: [5, 0.472, 0.176],
  };
  const contactIds: Readonly<
    Record<
      Exclude<
        AutoMovieArchetypeEquine.Tack,
        "bare" | AutoMovieArchetypeEquine.Alternative
      >,
      readonly string[]
    >
  > = {
    saddle: [
      "seat",
      "pommel",
      "cantle",
      "leftStirrup",
      "rightStirrup",
      "leftRein",
      "rightRein",
      "lead",
      "mane",
    ],
    harness: ["hitch"],
    both: [
      "seat",
      "pommel",
      "cantle",
      "leftStirrup",
      "rightStirrup",
      "leftRein",
      "rightRein",
      "lead",
      "hitch",
      "mane",
    ],
    pack: ["lead", "leftLoad", "rightLoad", "tie"],
  };
  for (const tack of ["saddle", "harness", "both", "pack"] as const) {
    try {
      const animal: Animal = produce(tack);
      const source: string = JSON.stringify(animal);
      truth(
        `${tack} exact declared contact set`,
        JSON.stringify(
          animal.affordances
            .map((contact: IAutoMovieAffordance): string => contact.id)
            .sort((left: string, right: string): number =>
              left.localeCompare(right),
            ),
        ) ===
          JSON.stringify(
            [...contactIds[tack]].sort((left: string, right: string): number =>
              left.localeCompare(right),
            ),
          ),
      );
      const by: number = Math.sqrt(animal.dimensions.withersHeight! / 1.38);
      for (const gait of gaits)
        for (const lead of ["left", "right"] as const) {
          const [referenceSpeed, referencePeriod, referenceStance]: readonly [
            number,
            number,
            number,
          ] = rows[gait];
          const speed: number = referenceSpeed * by;
          const label: string = `${name}/${tack}/${gait}/${lead}`;
          let prepared: Ride | undefined;
          animalAttachmentScenario(
            animal,
            (): Ride => {
              const result: Ride = AutoMovieArchetypeQuadruped.ride(
                animal,
                {
                  start: { x: 2, z: -3, heading: 29 },
                  legs: [{ kind: "straight", length: speed * 6, lead }],
                  cruise: speed,
                  startSpeed: speed,
                  endSpeed: speed,
                },
                gait,
              );
              prepared = result;
              return result;
            },
            {
              period: referencePeriod * by,
              foreStance: referenceStance * by,
              hindStance: referenceStance * by,
              headMustMove: true,
            },
            label,
            findings,
            ["leftRein", "rightRein", "lead"],
          );
          if (prepared !== undefined) {
            try {
              publicFrames(prepared, label);
            } catch (error) {
              findings.push(
                `${label}: required public frame observation failed: ${String(error)}`,
              );
            }
          }
        }
      truth(
        `${tack} source remains unchanged across all gaits/leads/frames`,
        JSON.stringify(animal) === source,
      );
    } catch (error) {
      findings.push(
        `${name}/${tack}: required positive producer failed: ${String(error)}`,
      );
    }
  }

  /** Compose every actual contact with the complete root independently of frame(). */
  function publicFrames(ride: Ride, label: string): void {
    const seconds: number = 1.937;
    const sample: ReturnType<Ride["at"]> = ride.at(seconds);
    for (const contact of sample.archetype.affordances) {
      const actual: IAutoMovieTransform = ride.frame(
        contact.id as AutoMovieArchetypeEquine.Affordance,
        seconds,
      );
      const expected: IAutoMovieTransform["translation"] = Vector3.add(
        sample.placement.translation,
        Quaternion.rotateVector(
          sample.placement.rotation,
          contact.frame.translation,
        ),
      );
      const rotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
        sample.placement.rotation,
        contact.frame.rotation,
      );
      for (const axis of ["x", "y", "z"] as const) {
        truth(
          `${label}/${contact.id} public world ${axis}`,
          nclose(actual.translation[axis], expected[axis], 1e-9),
        );
        truth(
          `${label}/${contact.id} public unit scale ${axis}`,
          nclose(actual.scale[axis], 1, 0),
        );
      }
      truth(
        `${label}/${contact.id} public unit quaternion`,
        nclose(
          Math.hypot(
            actual.rotation.x,
            actual.rotation.y,
            actual.rotation.z,
            actual.rotation.w,
          ),
          1,
          1e-10,
        ),
      );
      truth(
        `${label}/${contact.id} public world rotation`,
        nclose(
          Math.abs(
            actual.rotation.x * rotation.x +
              actual.rotation.y * rotation.y +
              actual.rotation.z * rotation.z +
              actual.rotation.w * rotation.w,
          ),
          1,
          1e-9,
        ),
      );
    }
  }

  /** Gather the complete producer/tack matrix without hiding later assemblies. */
  function truth(id: string, condition: boolean): void {
    try {
      TestValidator.predicate(`${name}: ${id}`, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
