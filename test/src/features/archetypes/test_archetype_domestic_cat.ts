import {
  AutoMovieArchetypeFrame,
  createCat,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AnimalNeutralObservation } from "../internal/AnimalNeutralObservation";
import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";
import { animalTerminalSole } from "../internal/animalTerminalSole";

/**
 * An adult domestic cat enters the closed producer and produces an ordinary
 * level walk whose actual paw contacts follow the authored clock.
 *
 * Scenarios:
 *
 * 1. Both factory paths produce the measured-scale bare reference and four sourced
 *    proximal control lengths. Two builds with the same seed reproduce their
 *    actual geometry and draw.
 * 2. The automatic walk repeats its lateral contact sequence, keeps stance soles
 *    grounded in stance, and lifts the actual soles in swing.
 * 3. An unsupported speed and an unsupported explicit gait refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the typed producer paths and the physical contact and admission properties.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the cat through both public factories, repeats independent seeded construction, and reads actual posed sole geometry and ride instants after automatic selection.
 * @evidence contracts/development/testing.md#independent-expectations Source references supply 0.2709 m, 0.3254 m, 4.5 kg, four proximal segment lengths in Poradowski Tables 2–3, 0.8 s stride, 20.60 percent hind-to-fore offset and distinct fore/hind duties. The level course puts the whole terminal solid on Y=0 during stance and above it during swing.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the one admitted mean speed, an adjacent unsupported speed, explicit trot at the admitted speed, three distinct nonzero phase offsets, and grounded stationary stance versus whole-solid swing clearance.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous test owns fixed cat instances and a constant six-second course. No renderer, fixture record mutation or external process is used.
 */
export function test_archetype_domestic_cat(): void {
  const findings: string[] = [];
  const cat: ReturnType<typeof createCat> = createCat({ tempo: 0 });
  const general: ReturnType<typeof createQuadruped> = createQuadruped({
    kind: "cat",
    tempo: 0,
  });
  for (const animal of [cat, general]) {
    if (animal.archetype !== "cat")
      findings.push(`unexpected producer ${animal.archetype}`);
    fixture.near(
      findings,
      "adult withers",
      animal.dimensions.withersHeight!,
      0.2709,
      1e-12,
    );
    fixture.near(
      findings,
      "adult girth",
      animal.dimensions.girth!,
      0.3254,
      1e-12,
    );
    fixture.near(findings, "bare mass", animal.dimensions.mass!, 4.5, 1e-12);
    for (const id of ["leftEar", "rightEar", "tail"])
      if (
        !animal.parts.some(
          (part: IAutoMovieModelPart): boolean => part.id === id,
        )
      )
        findings.push(`missing physical part ${id}`);
    for (const [suffix, length] of [
      ["ForeHumerus", 0.1039],
      ["ForeRadius", 0.1007],
      ["HindFemur", 0.1127],
      ["HindTibia", 0.1165],
    ] as const)
      for (const side of ["left", "right"]) {
        const id: string = side + suffix;
        const part: IAutoMovieModelPart | undefined = animal.parts.find(
          (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
        );
        if (part === undefined) {
          findings.push(`missing physical part ${id}`);
          continue;
        }
        fixture.near(
          findings,
          `${id} measured axial length`,
          Vector3.length(
            Vector3.subtract(
              AnimalNeutralObservation.endpoint(part, 1),
              AnimalNeutralObservation.endpoint(part, -1),
            ),
          ),
          length,
          1e-9,
        );
      }
  }

  const seed: number = 1040;
  const first: ReturnType<typeof createCat> = createCat({}, seed);
  const repeated: ReturnType<typeof createCat> = createCat({}, seed);
  if (
    first.parts.length === 0 ||
    repeated.parts.length === 0 ||
    JSON.stringify({
      parts: first.parts,
      dimensions: first.dimensions,
      provenance: first.provenance,
      properties: first.properties,
    }) !==
      JSON.stringify({
        parts: repeated.parts,
        dimensions: repeated.dimensions,
        provenance: repeated.provenance,
        properties: repeated.properties,
      })
  )
    findings.push("the same seed changed the actual cat or its draw");

  const ride: fixture.Ride = rideQuadruped(cat, fixture.course(0.63));
  // Rebase the measured lateral sequence to left fore, with bilateral half-cycle symmetry.
  const stride: number = 0.8;
  const halfStride: number = stride / 2;
  const hindLead: number = stride * 0.206;
  const offsets: Readonly<Record<(typeof fixture.FEET)[number], number>> = {
    leftFore: 0,
    rightFore: halfStride,
    leftHind: stride - hindLead,
    rightHind: halfStride - hindLead,
  };
  for (const limb of fixture.FEET) {
    const duty: number = limb.endsWith("Fore") ? 0.5951 : 0.5487;
    const onset: number = stride + offsets[limb];
    const end: number = onset + stride * duty;
    for (const seconds of [onset, onset + stride])
      if (
        !ride.instants.some(
          (instant: { seconds: number; label: string }): boolean =>
            instant.label === `${limb}On` &&
            Math.abs(instant.seconds - seconds) < 1e-8,
        )
      )
        findings.push(`${limb} touchdown missing at ${seconds} s`);

    const distal: IAutoMovieVector3[] = [];
    for (const seconds of [onset + 0.04, end - 0.015]) {
      const sample: ReturnType<typeof ride.at> = ride.at(seconds);
      const part: IAutoMovieModelPart = terminal(sample, limb);
      fixture.near(
        findings,
        `${limb} whole sole on ground at ${seconds} s`,
        animalTerminalSole(part, sample.placement),
        0,
        1e-8,
      );
      distal.push(
        AutoMovieArchetypeFrame.point(
          sample.placement,
          AnimalNeutralObservation.endpoint(part, 1),
        ),
      );
    }
    const swing: ReturnType<typeof ride.at> = ride.at(end + 0.075);
    if (!(animalTerminalSole(terminal(swing, limb), swing.placement) > 1e-5))
      findings.push(`${limb} sole failed to clear the ground after stance`);
    fixture.near(
      findings,
      `${limb} stance translation`,
      Vector3.length(Vector3.subtract(distal[0]!, distal[1]!)),
      0,
      1e-8,
    );
  }

  fixture.refused(findings, "an uncited positive speed refuses", (): unknown =>
    rideQuadruped(cat, fixture.course(0.68)),
  );
  fixture.refused(
    findings,
    "an explicit unsupported trot refuses even at the admitted walk speed",
    (): unknown => rideQuadruped(cat, fixture.course(0.63), "trot"),
  );
  TestValidator.equals("domestic cat producer and level walk", findings, []);
}

/** Locate the actual distal bar used for both joint and solid observations. */
function terminal(
  sample: ReturnType<fixture.Ride["at"]>,
  limb: (typeof fixture.FEET)[number],
): IAutoMovieModelPart {
  const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean =>
      candidate.id === `${limb}Pastern`,
  );
  if (part === undefined) throw new Error(`Missing actual terminal ${limb}`);
  return part;
}
