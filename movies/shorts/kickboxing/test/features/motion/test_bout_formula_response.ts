import { AutoMovieHumanRigControls as Controls } from "@automovie/human";
import assert from "node:assert/strict";

import { FilmActor } from "../../../src/assets/person/FilmActor";
import { createPersonParameters } from "../../../src/assets/person/createPersonParameters";
import { BoutDefense } from "../../../src/motion/defense/BoutDefense";
import { FighterBody } from "../../../src/motion/fighter/FighterBody";
import { BoutFormulaResponse as Response } from "../../../src/motion/reactions/BoutFormulaResponse";
import { Strike } from "../../../src/motion/striking/Strike";
import { BoutTargetSource } from "../../../src/physics/BoutTargetSource";
import { BoutScript } from "../../../src/shots/kickboxing/ring-bout/BoutScript";

/** Direct actual-frame units: geometric response is causal, bounded and seek independent; it cannot weaken either kick guard or add a formula displacement to native bones. All contact records here are independent synthetic unit inputs, not evidence of a scene collision. */
export function test_bout_formula_response(): void {
  const source: BoutTargetSource = new BoutTargetSource();
  const action: BoutScript.Action = BoutScript.actions.find(
    (candidate: BoutScript.Action): boolean =>
      candidate.defense === "hit" && candidate.technique !== "high-kick",
  )!;
  const receiver: "a" | "b" = action.actor === "a" ? "b" : "a";
  const input: Response.IContact = {
    receiptId: "independent-unit-geometric-contact",
    actionId: action.id,
    actorId: receiver,
    seconds: action.at,
    relation: "head",
    normalImpulseEstimate: 4,
    source: "geometric",
  };
  const beforeInput: string = JSON.stringify(input);
  const time: number = action.at + Response.recipes.head.peakSeconds;
  source.configureResponses("native", []);
  const baseline: FighterBody.Frame = source.fighters[receiver].frame(time);
  source.configureResponses("kinematic", []);
  assert.deepEqual(source.fighters[receiver].frame(time), baseline);
  source.configureResponses("kinematic", [
    { ...input, normalImpulseEstimate: 0 },
  ]);
  assert.deepEqual(source.fighters[receiver].frame(time), baseline);
  source.configureResponses("kinematic", [input]);
  const actual: FighterBody.Frame = source.fighters[receiver].frame(time);
  assert.ok(actual.cervical.flexion < baseline.cervical.flexion);
  assert.ok(actual.atlas.flexion < baseline.atlas.flexion);
  assert.ok(actual.wince > baseline.wince);
  assert.deepEqual(actual.hands, baseline.hands);
  assert.deepEqual(actual.legs, baseline.legs);
  assert.deepEqual(actual.shift, baseline.shift);
  assert.equal(actual.drop, baseline.drop);
  assert.deepEqual(actual.evade, baseline.evade);
  for (const seconds of [action.at - 0.02, action.at, action.at + 1]) {
    source.configureResponses("kinematic", [input]);
    const withContact: FighterBody.Frame =
      source.fighters[receiver].frame(seconds);
    source.configureResponses("kinematic", []);
    assert.deepEqual(withContact, source.fighters[receiver].frame(seconds));
  }
  source.configureResponses("kinematic", [input]);
  const repeated: FighterBody.Frame = source.fighters[receiver].frame(time);
  source.fighters[receiver].frame(action.at + 0.4);
  source.fighters[receiver].frame(action.at - 0.2);
  assert.deepEqual(source.fighters[receiver].frame(time), repeated);
  source.configureResponses("native", [input]);
  assert.deepEqual(source.fighters[receiver].frame(time), baseline);
  source.configureResponses("kinematic", [
    { ...input, normalImpulseEstimate: 8 },
  ]);
  assert.ok(
    source.fighters[receiver].frame(time).cervical.flexion <
      actual.cervical.flexion,
  );
  source.configureResponses("kinematic", [
    { ...input, normalImpulseEstimate: 1e6 },
  ]);
  const bounded: FighterBody.Frame = source.fighters[receiver].frame(time);
  for (const [value, channel] of [
    [bounded.cervical.flexion, "neck.cervical.flexion"],
    [bounded.atlas.flexion, "neck.atlantoOccipital.flexion"],
    [bounded.thoracic.flexion, "spine.thoracic.flexion"],
  ] as const) {
    const limits: ReturnType<typeof Controls.bounds> = Controls.bounds(channel);
    assert.ok(value >= limits.minimum && value <= limits.maximum);
  }
  assert.equal(JSON.stringify(input), beforeInput);
  const actor: FilmActor = new FilmActor(
    receiver,
    source.rigs[receiver],
    createPersonParameters(1800, true),
  );
  try {
    const pose: ReturnType<typeof FighterBody.pose> = FighterBody.pose(actual);
    const segments: ReturnType<
      (typeof source.rigs)[typeof receiver]["trunk"]
    >["segments"] = source.rigs[receiver].trunk(
      pose,
      FighterBody.placement(actual),
    ).segments;
    actor.physical(segments, pose, 0);
    const boneSnapshot: string = JSON.stringify(actor.person.output.posed);
    const revision: number = actor.person.geometryRevision;
    actor.physical(segments, pose, actual.wince);
    assert.ok(
      actor.person.geometryRevision > revision,
      "actual physical consumer discarded the facial response",
    );
    assert.equal(
      JSON.stringify(actor.person.output.posed),
      boneSnapshot,
      "facial acting changed cached collider bones",
    );
    const repeatedRevision: number = actor.person.geometryRevision;
    actor.physical(segments, pose, actual.wince);
    assert.equal(actor.person.geometryRevision, repeatedRevision);
  } finally {
    actor.dispose();
  }
  source.configureResponses("kinematic", [input]);
  input.normalImpulseEstimate = 0;
  assert.deepEqual(source.fighters[receiver].frame(time), repeated);
  assert.throws((): void =>
    source.configureResponses("kinematic", [
      { ...input, normalImpulseEstimate: -1 },
    ]),
  );
  assert.throws((): void =>
    source.configureResponses("kinematic", [
      { ...input, source: "solver" } as unknown as Response.IContact,
    ]),
  );

  const kicks: BoutScript.Action[] = BoutScript.actions.filter(
    (candidate: BoutScript.Action): boolean =>
      candidate.technique.endsWith("kick"),
  );
  for (const kick of kicks) {
    const [start, end]: readonly [number, number] = Strike.window(kick);
    for (const seconds of [
      start + 0.11,
      kick.at - 0.12,
      kick.at,
      kick.at + 0.12,
      end - 0.02,
    ]) {
      const actor: "a" | "b" = kick.actor;
      const contact: Response.IContact = {
        ...input,
        normalImpulseEstimate: 8,
        actorId: actor,
        seconds: seconds - 0.04,
      };
      source.configureResponses("native", []);
      const guard: FighterBody.Frame = source.fighters[actor].frame(seconds);
      source.configureResponses("kinematic", [contact]);
      const responding: FighterBody.Frame =
        source.fighters[actor].frame(seconds);
      assert.deepEqual(
        responding.hands,
        guard.hands,
        `${kick.id}@${seconds}: formula changed guards`,
      );
      assert.deepEqual(
        responding.legs,
        guard.legs,
        `${kick.id}@${seconds}: formula changed legs`,
      );
      for (const side of ["left", "right"] as const) {
        const frame: FighterBody.Frame = structuredClone(guard);
        frame.hands = {
          [side]: { kind: "guard", tight: 0.8, extension: 1 },
          [side === "left" ? "right" : "left"]: { kind: "guard", tight: 0.8 },
        } as FighterBody.Frame["hands"];
        const protectedHands: FighterBody.Frame["hands"] = structuredClone(
          frame.hands,
        );
        for (const defense of [
          "catch",
          "cover",
          "parry",
          "hit",
          "block",
        ] as const) {
          BoutDefense.apply(
            frame,
            { ...action, at: seconds, defense },
            seconds,
          );
          assert.deepEqual(
            frame.hands,
            protectedHands,
            `${side}/${defense}: incoming answer replaced own kick protection`,
          );
        }
      }
    }
  }
}
