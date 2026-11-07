import { Quaternion, validatePhysicalProfile } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import assert from "node:assert/strict";

import type { BoutFormulaResponse as Response } from "../../../src/motion/reactions/BoutFormulaResponse";
import { collectBoutFormulaResponses as collect } from "../../../src/physics/collectBoutFormulaResponses";

/** Direct bounded collector unit: two actual glove pairs, an independent sinusoidal closing speed and analytic two-mass impulse. Missing and nonclosing geometry remain distinct, and each measurement sees only its prior adopted response prefix. This is no film playback or dynamics world. */
export async function test_bout_formula_collection(): Promise<void> {
  const pose: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const provider: (mass: number) => P = (mass: number): P => ({
    id: `two-fixed-spheres-${mass}kg-each`,
    mass: mass * 2,
    centerOfMass: { x: 0, y: 0, z: 0.5 },
    provenance:
      "Independent solid spheres joined at their actual one-metre separation for collector units",
    materials: [
      { id: "glove", friction: 0, restitution: 0, compliance: 0, damping: 0 },
    ],
    segments: ["leftHand", "rightHand"].map(
      (bone: string, index: number): P.ISegment => ({
        bone,
        mass,
        neutral: { ...pose, position: { x: 0, y: 0, z: index } },
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 0.004 * mass, y: 0.004 * mass, z: 0.004 * mass },
        inertiaRotation: pose.rotation,
        shapes: [
          {
            id: `${bone}-sphere`,
            material: "glove",
            kind: "sphere",
            radius: 0.1,
            transform: pose,
          },
        ],
      }),
    ),
    joints: [
      {
        id: "actual-fixed-one-metre-link",
        parent: "leftHand",
        child: "rightHand",
        parentFrame: { ...pose, position: { x: 0, y: 0, z: 1 } },
        childFrame: pose,
        axes: [],
      },
    ],
  });
  const a: P = provider(2);
  const b: P = provider(3);
  assert.deepEqual(validatePhysicalProfile(a), []);
  assert.deepEqual(validatePhysicalProfile(b), []);
  const profiles: Record<"a" | "b" | "referee", P> = { a, b, referee: a };
  const originalProfiles: string = JSON.stringify(profiles);
  const period: number = 0.35;
  const amplitude: number = (6 * period) / (2 * Math.PI);
  const measuredClosing: number =
    amplitude * Math.sin((2 * Math.PI) / (120 * period)) * 120;
  const expectedImpulse: number = measuredClosing / (1 / 2 + 1 / 3);
  // Convex query witnesses/normals use native float32; scale this unit's impulse
  // comparison accordingly. No cinematic contact or guard tolerance is changed.
  const tolerance: number =
    64 * Math.pow(2, -23) * Math.max(1, expectedImpulse);
  for (const scenario of ["closing", "missing", "nonclosing"] as const) {
    let prefix: Response.IContact[] = [];
    const adopted: string[][] = [];
    const observations: { seconds: number; prefixLength: number }[] = [];
    const result: Response.IContact[] = await collect({
      profiles,
      start: 2.4,
      end: 2.9,
      at: (seconds: number): collect.IFrames => {
        observations.push({ seconds, prefixLength: prefix.length });
        const direction: number = scenario === "nonclosing" ? -1 : 1;
        const x: number =
          direction *
          amplitude *
          Math.sin((2 * Math.PI * (seconds - 2.5)) / period);
        const receiverX: number = scenario === "missing" ? 2 : 0.199;
        const flipped: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
          { x: 1, y: 0, z: 0 },
          180,
        );
        return {
          a: {
            leftHand: { ...pose, position: { x, y: 0, z: 0 } },
            rightHand: { ...pose, position: { x, y: 0, z: 1 } },
          },
          b: {
            leftHand: {
              position: { x: receiverX, y: 0, z: 1 },
              rotation: flipped,
            },
            rightHand: {
              position: { x: receiverX, y: 0, z: 0 },
              rotation: flipped,
            },
          },
          referee: {
            leftHand: { ...pose, position: { x: 0, y: 5, z: 0 } },
            rightHand: { ...pose, position: { x: 0, y: 5, z: 1 } },
          },
        };
      },
      adopt: (contacts: readonly Response.IContact[]): void => {
        prefix = contacts.map(
          (contact: Response.IContact): Response.IContact => ({ ...contact }),
        );
        adopted.push(
          prefix.map((contact: Response.IContact): string => contact.actionId),
        );
      },
    });
    const ids: string[] = ["x001-a-jab", "x002-a-cross"];
    assert.equal(
      observations.length,
      4,
      "only the two bounded action samples and their velocity predecessors are read",
    );
    assert.deepEqual(
      observations.map(
        (row: { prefixLength: number }): number => row.prefixLength,
      ),
      scenario === "missing" ? [0, 0, 0, 0] : [0, 0, 1, 1],
    );
    if (scenario === "missing") {
      assert.deepEqual(result, []);
      assert.deepEqual(adopted, [[]]);
    } else {
      assert.deepEqual(
        result.map((contact: Response.IContact): string => contact.actionId),
        ids,
      );
      assert.deepEqual(
        result.map((contact: Response.IContact): number => contact.seconds),
        [2.5, 2.85],
      );
      assert.deepEqual(adopted, [[], [ids[0]!], ids]);
      for (const contact of result) {
        assert.equal(contact.source, "geometric");
        assert.equal(contact.actorId, "b");
        assert.equal(contact.relation, "guard");
        if (scenario === "nonclosing")
          assert.equal(contact.normalImpulseEstimate, 0);
        else
          assert.ok(
            Math.abs(contact.normalImpulseEstimate - expectedImpulse) <=
              tolerance,
          );
      }
    }
    assert.equal(JSON.stringify(profiles), originalProfiles);
  }
}
