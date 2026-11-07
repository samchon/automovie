import {
  type AutoMoviePhysicsCache as Cache,
  preparePhysicalGeometry as Geometry,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { filmContactIntent } from "../../src/motion/contact/filmContactIntent";
import { filmKickApproach } from "../../src/motion/contact/filmKickApproach";
import { filmKickGeometry } from "../../src/motion/contact/filmKickGeometry";
import { FighterBody } from "../../src/motion/fighter/FighterBody";
import { FilmVector as V } from "../../src/motion/rig/FilmVector";
import { filmTrunkFromSegments } from "../../src/motion/rig/filmTrunkFromSegments";
import { Strike } from "../../src/motion/striking/Strike";
import { BoutReceipts } from "../../src/physics/BoutReceipts";
import type { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { boutContactBindings } from "../../src/physics/boutContactBindings";
import { BoutScript } from "../../src/shots/kickboxing/ring-bout/BoutScript";

/** Observe the real provider and public geometry queries without claiming native hits. Every scripted kick keeps its shin declaration; moved receivers change goals, global translation preserves them, random seeks repeat, and an unreachable approach retains its excess. The separate full-pair audit owns achieved clearance and protective geometry. */
export async function assertBoutKickGeometry(
  source: BoutTargetSource,
): Promise<void> {
  const queries: Geometry.IQueries = await Geometry();
  const findings: string[] = [];
  const actions: BoutScript.Action[] = BoutScript.actions.filter(
    (action: BoutScript.Action): boolean => action.technique.endsWith("kick"),
  );
  for (const action of actions) {
    const receiverId: "a" | "b" = action.actor === "a" ? "b" : "a";
    const intent: filmContactIntent.IIntent = filmContactIntent(action);
    const binding: ReturnType<typeof boutContactBindings>[number] =
      boutContactBindings(source, action.actor, action.at).find(
        (value: ReturnType<typeof boutContactBindings>[number]): boolean =>
          value.id === action.id,
      )!;
    if (
      binding.source.bone !==
      `${BoutScript.specs[action.technique].side}LowerLeg`
    )
      findings.push(`${action.id}: the adopted weapon is not the actual shin`);
    if (
      intent.relation === "guard" &&
      !binding.target.bone.endsWith("LowerArm")
    )
      findings.push(
        `${action.id}: guarded roundhouse is not bound to the forearm shield`,
      );
    const window: readonly [number, number] = Strike.window(action);
    const times: number[] = [
      window[0],
      action.at - (action.at - window[0]) * 0.55,
      action.at,
      action.at + Strike.HOLD,
      window[1],
    ];
    for (const seconds of times) {
      const frames: ReturnType<BoutTargetSource["frames"]> =
        source.frames(seconds);
      /** Read the actual current clinical carrier population, without a fitted or archived success pose. */
      const context: (id: "a" | "b") => filmKickGeometry.IContext = (
        id: "a" | "b",
      ): filmKickGeometry.IContext => {
        const root: filmKickGeometry.IContext["root"] = FighterBody.placement(
          frames[id],
        );
        return {
          id,
          rig: source.rigs[id],
          frame: frames[id],
          root,
          trunk: source.rigs[id].trunk(FighterBody.pose(frames[id]), root),
        };
      };
      const own: filmKickGeometry.IContext = context(action.actor);
      const other: filmKickGeometry.IContext = context(receiverId);
      const before: string = JSON.stringify({
        frames,
        own: own.trunk,
        other: other.trunk,
      });
      const delivery: filmKickGeometry.IDelivery = filmKickGeometry(
        own,
        other,
        action,
        queries,
      );
      if (
        Math.abs(
          V.distance(delivery.chamber.knee, delivery.chamber.ankle) -
            V.distance(delivery.impact.knee, delivery.impact.ankle),
        ) > 1e-10
      )
        findings.push(
          `${action.id}@${seconds}: aiming stretched the authored shank`,
        );
      if (
        delivery.maximumAnkleReach <
        V.distance(delivery.hip, delivery.chamber.ankle) - 1e-10
      )
        findings.push(
          `${action.id}@${seconds}: declared link span is shorter than the real ankle distance`,
        );

      const delta: V.Value = [0.31, 0.08, -0.27];
      const shifted: filmKickGeometry.IDelivery = filmKickGeometry(
        translate(own, delta),
        translate(other, delta),
        action,
        queries,
      );
      const scale: number = Math.max(
        1,
        ...[
          ...Object.values(own.trunk.segments),
          ...Object.values(other.trunk.segments),
        ].flatMap((pose: P.ITransform): number[] =>
          Object.values(pose.position).map(
            (value: number): number => Math.abs(value) + V.length(delta),
          ),
        ),
      );

      // The pinned public convex kernel stores transforms in f32. Its documented
      // source broad-phase margin bounds transform roundoff by 32 f32 ulps at
      // scene scale. This seed-equivariance budget does not change contact rules.
      const nativeRoundoff: number = 32 * 2 ** -23 * scale;
      const nominal: filmKickGeometry.IDelivery = filmKickGeometry(
        own,
        other,
        action,
      );
      const shiftedNominal: filmKickGeometry.IDelivery = filmKickGeometry(
        translate(own, delta),
        translate(other, delta),
        action,
      );
      for (const phase of ["chamber", "impact"] as const)
        for (const point of ["ankle", "knee"] as const) {
          if (
            V.distance(
              shifted[phase][point],
              V.add(delivery[phase][point], delta),
            ) > nativeRoundoff
          )
            findings.push(
              `${action.id}@${seconds}/${phase}/${point}: native receiver-relative seed exceeded its scale-dependent transform roundoff ${nativeRoundoff}m`,
            );
          if (
            V.distance(
              shiftedNominal[phase][point],
              V.add(nominal[phase][point], delta),
            ) > 1e-9
          )
            findings.push(
              `${action.id}@${seconds}/${phase}/${point}: double-precision nominal authoring depends on a world position`,
            );
        }
      const moved: filmKickGeometry.IDelivery = filmKickGeometry(
        own,
        translate(other, [0.17, 0.09, -0.11]),
        action,
        queries,
      );
      if (V.distance(moved.impact.ankle, delivery.impact.ankle) < 0.01)
        findings.push(
          `${action.id}@${seconds}: moved actual receiver did not change the goal`,
        );
      if (
        JSON.stringify({ frames, own: own.trunk, other: other.trunk }) !==
        before
      )
        findings.push(
          `${action.id}@${seconds}: borrowed intent or actual geometry was mutated`,
        );
      if (
        JSON.stringify(filmKickGeometry(own, other, action, queries)) !==
        JSON.stringify(delivery)
      )
        findings.push(
          `${action.id}@${seconds}: a random intervening query changed the same authored instant`,
        );
    }
  }

  const action: BoutScript.Action = actions.find(
    (candidate: BoutScript.Action): boolean =>
      candidate.technique === "body-kick",
  )!;
  const frames: ReturnType<BoutTargetSource["frames"]> = source.frames(
    action.at,
  );
  const id: "a" | "b" = action.actor;
  const otherId: "a" | "b" = id === "a" ? "b" : "a";
  const ownRoot: filmKickGeometry.IContext["root"] = FighterBody.placement(
    frames[id],
  );
  const otherRoot: filmKickGeometry.IContext["root"] = FighterBody.placement(
    frames[otherId],
  );
  const own: filmKickGeometry.IContext = {
    id,
    rig: source.rigs[id],
    frame: frames[id],
    root: ownRoot,
    trunk: source.rigs[id].trunk(FighterBody.pose(frames[id]), ownRoot),
  };
  const other: filmKickGeometry.IContext = {
    id: otherId,
    rig: source.rigs[otherId],
    frame: frames[otherId],
    root: otherRoot,
    trunk: source.rigs[otherId].trunk(
      FighterBody.pose(frames[otherId]),
      otherRoot,
    ),
  };
  const away: V.Value = V.scale(
    V.normalize(V.sub(other.trunk.hipJoints.left, own.trunk.hipJoints.left)),
    3,
  );
  const impossible: ReturnType<typeof filmKickApproach> = filmKickApproach(
    own,
    translate(other, away),
    [],
    { maximumTranslation: 0.35, iterations: 8, tolerance: 0.001 },
    queries,
  );
  assert.ok(
    !impossible.converged && impossible.maximumExcess > 1,
    "bounded staging retains an unreachable receiver finding",
  );
  assert.ok(
    V.length(V.tuple(impossible.translation)) <= 0.35 + 1e-10,
    "receiver distance cannot bypass the declared travel budget",
  );
  const preparing: filmKickGeometry.IContext = {
    ...own,
    frame: { ...own.frame, time: Strike.window(action)[0] },
  };
  const unprepared: ReturnType<typeof filmKickApproach> = filmKickApproach(
    preparing,
    translate(other, away),
    [],
    { maximumTranslation: 0.35, iterations: 8, tolerance: 0.001 },
    queries,
  );
  const doubleRoundoff: number =
    32 *
    Number.EPSILON *
    Math.max(1, V.length(away), V.length(own.trunk.hipJoints.left));
  assert.ok(
    unprepared.converged &&
      unprepared.maximumExcess <= doubleRoundoff &&
      V.length(V.tuple(unprepared.translation)) <= doubleRoundoff,
    "inactive preparation cannot move beyond double-precision staging roundoff",
  );
  try {
    await receipts(source, actions[0]!);
  } catch (error: unknown) {
    findings.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
  }
  assert.deepEqual(findings, []);
}

/** Move borrowed world geometry and its root together; the actual provider remains unchanged. */
function translate(
  context: filmKickGeometry.IContext,
  delta: V.Value,
): filmKickGeometry.IContext {
  const segments: Record<string, P.ITransform> = Object.fromEntries(
    Object.entries(context.trunk.segments).map(
      ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
        bone,
        { ...pose, position: V.vector(V.add(V.tuple(pose.position), delta)) },
      ],
    ),
  );
  return {
    ...context,
    root: { ...context.root, position: V.add(context.root.position, delta) },
    trunk: filmTrunkFromSegments(segments, context.rig.profile),
  };
}

/** Unit receipt adaptation must not relabel a forefoot-only impact as this film's promised shin strike. These explicit synthetic receipts test identity selection, not achieved momentum or a movie hit. */
async function receipts(
  source: BoutTargetSource,
  action: BoutScript.Action,
): Promise<void> {
  const actor: "a" | "b" = action.actor;
  const target: "a" | "b" = actor === "a" ? "b" : "a";
  const intent: filmContactIntent.IIntent = filmContactIntent(action);
  const window: readonly [number, number] = Strike.window(action);
  const tolerance: number = Math.max(
    action.at - window[0],
    window[1] - action.at,
  );
  const profiles: Parameters<typeof BoutReceipts.measure>[0]["profiles"] = {
    a: source.rigs.a.profile,
    b: source.rigs.b.profile,
    referee: source.rigs.referee.profile,
  };
  /** Borrow real scoped shape identities while keeping the receipt's synthetic origin explicit. */
  const part: (body: "a" | "b", bone: string) => Receipt["a"] = (
    body: "a" | "b",
    bone: string,
  ): Receipt["a"] => {
    const shape: P.IShape = profiles[body].segments.find(
      (segment: P.ISegment): boolean => segment.bone === bone,
    )!.shapes[0]!;
    return { body, bone, shape: shape.id, material: shape.material };
  };
  const receipt: Receipt = {
    id: "synthetic-shin-policy-unit",
    source: "solver",
    seconds: action.at,
    endSeconds: action.at,
    a: part(actor, `${intent.side}Midfoot`),
    b: part(target, intent.targetBone),
    point: { x: 0, y: 0.5, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    impulse: 1,
    separation: 0,
    compression: 0,
  };
  const input: Parameters<typeof BoutReceipts.measure>[0] = {
    profiles,
    contacts: [receipt],
    start: action.at - tolerance,
    end: action.at + tolerance,
    source: "solver",
    at: (seconds: number): Cache.IFrame => ({
      seconds,
      bodies: Object.fromEntries(
        Object.entries(profiles).map(
          ([body, profile]: [string, P]): [
            string,
            Record<string, Cache.ISegment>,
          ] => [
            body,
            Object.fromEntries(
              profile.segments.map(
                (segment: P.ISegment): [string, Cache.ISegment] => [
                  segment.bone,
                  {
                    ...segment.neutral,
                    velocity: { x: 0, y: 0, z: 0 },
                    angularVelocity: { x: 0, y: 0, z: 0 },
                  },
                ],
              ),
            ),
          ],
        ),
      ),
    }),
  };
  const footOnly: BoutReceipts.IResult = await BoutReceipts.measure(input);
  assert.ok(
    footOnly.findings.some(
      (finding: BoutReceipts.IResult["findings"][number]): boolean =>
        finding.actionId === action.id && finding.kind === "missed-contact",
    ),
  );
  assert.ok(
    !footOnly.contacts.some(
      (contact: BoutReceipts.IResult["contacts"][number]): boolean =>
        contact.actionId === action.id,
    ),
  );
  const shin: BoutReceipts.IResult = await BoutReceipts.measure({
    ...input,
    contacts: [{ ...receipt, a: part(actor, `${intent.side}LowerLeg`) }],
  });
  assert.ok(
    !shin.findings.some(
      (finding: BoutReceipts.IResult["findings"][number]): boolean =>
        finding.actionId === action.id && finding.kind === "missed-contact",
    ),
  );
  assert.ok(
    shin.contacts.some(
      (contact: BoutReceipts.IResult["contacts"][number]): boolean =>
        contact.actionId === action.id,
    ),
  );
}
