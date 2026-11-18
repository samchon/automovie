import {
  type QuadrupedBody,
  createCat,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../internal/animalLocomotionFixture";

/**
 * An adult domestic cat enters the closed producer and produces an ordinary
 * level walk whose actual paw contacts follow the authored clock.
 *
 * Scenarios:
 * 1. Both factory paths produce the measured-scale bare reference.
 * 2. The automatic walk repeats its lateral contact sequence, keeps stance
 *    paw positions in the world and refuses a speed without a cited row.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the typed producer paths and the physical contact and admission properties.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the cat through both public factories and reads ride instants and actual posed parts after automatic selection.
 * @evidence contracts/development/testing.md#independent-expectations Source references supply 0.2709 m, 0.3254 m, 4.5 kg, 0.8 s stride, 20.60 percent hind-to-fore offset and distinct fore/hind duties. A landing remains planted until the observed liftoff.
 * @evidence contracts/development/testing.md#distinguishing-cases Verifies exact measured mean-speed admission and an adjacent unsupported speed, three distinct nonzero phase offsets and immobility during each limb's contact window.
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
    fixture.near(findings, "adult withers", animal.dimensions.withersHeight!, 0.2709, 1e-12);
    fixture.near(findings, "adult girth", animal.dimensions.girth!, 0.3254, 1e-12);
    fixture.near(findings, "bare mass", animal.dimensions.mass!, 4.5, 1e-12);
    for (const id of ["leftEar", "rightEar", "tail"])
      if (!animal.parts.some((part: IAutoMovieModelPart): boolean => part.id === id))
        findings.push(`missing physical part ${id}`);
  }

  const ride: fixture.Ride = rideQuadruped(cat, fixture.course(0.63));
  const origin: number = 0.8;
  const timing: Readonly<Record<QuadrupedBody.Limb, readonly [number, number]>> = {
    leftFore: [0, 0.47608],
    rightFore: [0.4, 0.47608],
    leftHind: [0.6352, 0.43896],
    rightHind: [0.2352, 0.43896],
  };
  for (const limb of fixture.FEET) {
    const [offset, duration]: readonly [number, number] = timing[limb];
    const onset: number = origin + offset;
    const end: number = onset + duration;
    for (const seconds of [onset, onset + 0.8])
      if (
        !ride.instants.some(
          (instant: { seconds: number; label: string }): boolean =>
            instant.label === `${limb}On` &&
            Math.abs(instant.seconds - seconds) < 1e-8,
        )
      )
        findings.push(`${limb} touchdown missing at ${seconds} s`);

    const early: IAutoMovieVector3 = fixture.foot(ride, limb, onset + 0.04);
    const late: IAutoMovieVector3 = fixture.foot(ride, limb, end - 0.015);
    const swing: IAutoMovieVector3 = fixture.foot(ride, limb, end + 0.075);
    if (swing.y <= late.y + 1e-5)
      findings.push(`${limb} failed to lift after its stance duration`);
    fixture.near(
      findings,
      `${limb} stance translation`,
      Vector3.length(Vector3.subtract(early, late)),
      0,
      1e-8,
    );
  }

  fixture.refused(
    findings,
    "an uncited positive speed refuses",
    (): unknown => rideQuadruped(cat, fixture.course(0.68)),
  );
  TestValidator.equals("domestic cat producer and level walk", findings, []);
}
