import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  clampPose,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { HumanSegment } from "../../perform/HumanSegment";
import { HumanColliders } from "../../posture/HumanColliders";
import { StrikingBody } from "../../striking/StrikingBody";
import { StrikingContact } from "../../striking/StrikingContact";
import { StrikingRecord } from "../../striking/StrikingRecord";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";

/**
 * Capture cases of the striking laws on polygon men of different statures,
 * for what the numeric tests cannot show: whether a strike reads as the
 * technique, whether the body carries it, and what the weapon meets.
 *
 * - `striking-jab-cover`: the tall man jabs the small woman's face, once
 *   undefended and once against a cover forced in time.
 * - `striking-crosses`: both throw a rear straight at once.
 * - `striking-kicks`: an orthodox right round kick and a southpaw left round
 *   kick thrown at once, meeting shin to leg.
 * - `striking-redirect`: a middle round kick redirected mid-chamber into a
 *   high kick at the jaw, with the uninterrupted middle kick as a ghost.
 * - `striking-redirect-tall`: the same redirect thrown by the small woman at
 *   the tall man.
 * - `striking-fooled`: a cover bitten on a jab feint, the real cross landing.
 * - `striking-knee`: a rear knee to the abdomen from clinch range (the gap at
 *   which the two guards just touch), the hands on the other's neck.
 * - `striking-air`: a jab and a high round kick at no target.
 *
 * Each case draws the launch, the chamber or mid-delivery, the stop (or the
 * planned contact), and the recovery, trails the striking wrist or ankle and
 * marks the planned contact point. Verdicts per strike, read from the posed
 * limb as capsules (the upper arm, forearm and fist; the thigh, shank and
 * foot) against the other body's colliders by the exact segment distance:
 * the limb touches the first surface on its line within 15 mm at its stop
 * (or, at the air, reaches its virtual aim within 15 mm), never sinks more
 * than 10 mm into the other body, keeps every planted or pivoting ball within
 * 5 mm, and never leaves the range of motion; a declared miss at maximum
 * reach stands only when the target lies beyond the bare limb's length from
 * its root. Each kick also reports its chamber knee's height against the
 * target and the defender's shoulders, for the side-sheet review. The
 * redirect case also checks that a redirect after the chamber key is
 * refused.
 *
 * @param family One case family or all when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and its instants, overlays and verdicts.
 * @evidence contracts/development/implementation.md#principled-implementation Each case runs the real performance and samples its displayed poses at the plans' own events and stops.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scenario table over a shared builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Verdicts read forward kinematics and the struck body's colliders, not the laws' goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case; poses sampled at drawn instants and trail points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function strikingCases(family?: string): IMotionCaptureCase[] {
  const tall: humanPolygonMan.IPolygonMan = MotionBodies.population("m-tall");
  const small: humanPolygonMan.IPolygonMan = MotionBodies.population("f-small");
  const A: IHumanBody = createHumanBody(tall.body.skeleton, tall.body.profile);
  const B: IHumanBody = createHumanBody(
    small.body.skeleton,
    small.body.profile,
  );
  const faceB: AutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "face",
  };
  const faceA: AutoMovieMotionTarget = {
    kind: "person",
    subject: "a",
    region: "face",
  };
  const guardA = (): HumanChain =>
    HumanChain.subject("a").act("guard", { seconds: 0.8, facing: faceB });
  const guardB = (seconds: number = 0.8): HumanChain =>
    HumanChain.subject("b").act("guard", { seconds, facing: faceA });
  const scenarios: Record<
    string,
    () => {
      a: HumanChain;
      b?: HumanChain;
      gap: number;
      ghost?: HumanChain;
      late?: HumanChain;
      swap?: boolean;
    }
  > = {
    "striking-jab-cover": () => ({
      a: guardA().act("punch", { technique: "straight", at: faceB }, "jab"),
      b: guardB().act("defend", {
        kind: "cover",
        against: "jab",
        outcome: "inTime",
      }),
      gap: 1.1,
    }),
    "striking-crosses": () => ({
      a: guardA().act(
        "punch",
        { technique: "straight", hand: "rear", at: faceB },
        "crossA",
      ),
      b: guardB().act(
        "punch",
        { technique: "straight", hand: "rear", at: faceA },
        "crossB",
      ),
      gap: 1.0,
    }),
    "striking-kicks": () => ({
      a: guardA().act(
        "kick",
        {
          technique: "round",
          at: { kind: "person", subject: "b", region: "ribsLeft" },
        },
        "kickA",
      ),
      b: HumanChain.subject("b")
        .act("guard", { seconds: 0.8, stance: "southpaw", facing: faceA })
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "a", region: "ribsRight" },
          },
          "kickB",
        ),
      gap: 1.1,
    }),
    "striking-redirect": () => ({
      a: guardA()
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "b", region: "ribsLeft" },
          },
          "middle",
        )
        .until({ share: 0.15 })
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "b", region: "jawLeft" },
          },
          "high",
        ),
      b: guardB(3),
      gap: 1.0,
      ghost: guardA().act(
        "kick",
        {
          technique: "round",
          at: { kind: "person", subject: "b", region: "ribsLeft" },
        },
        "middle",
      ),
      late: guardA()
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "b", region: "ribsLeft" },
          },
          "middle",
        )
        .until({ share: 0.35 })
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "b", region: "jawLeft" },
          },
          "high",
        ),
    }),
    // The same redirect with the bodies swapped: the small woman kicks at the
    // tall man's jaw, so the high kick's chamber faces a taller defender.
    "striking-redirect-tall": () => ({
      a: guardA()
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "b", region: "ribsLeft" },
          },
          "middle",
        )
        .until({ share: 0.15 })
        .act(
          "kick",
          {
            technique: "round",
            at: { kind: "person", subject: "b", region: "jawLeft" },
          },
          "high",
        ),
      b: guardB(3),
      gap: 1.0,
      swap: true,
    }),
    "striking-fooled": () => ({
      a: guardA()
        .act("punch", { technique: "straight", at: faceB, feint: 0.5 }, "fake")
        .act(
          "punch",
          { technique: "straight", hand: "rear", at: faceB },
          "real",
        ),
      b: guardB().act("defend", {
        kind: "cover",
        against: "fake",
        outcome: "inTime",
      }),
      gap: 1.0,
    }),
    // Clinch range from the bodies: the gap at which the two guards just
    // meet along the line between them.
    "striking-knee": () => ({
      a: guardA().act("knee", {
        at: { kind: "person", subject: "b", region: "abdomen" },
      }),
      b: guardB(2),
      gap: touching(A, B, guardA(), guardB()),
    }),
    "striking-air": () => ({
      a: HumanChain.subject("a")
        .act("guard", { seconds: 0.8 })
        .act("punch", {
          technique: "straight",
          at: { kind: "none", line: "high" },
        })
        .act("kick", {
          technique: "round",
          at: { kind: "none", line: "high" },
        }),
      gap: 0,
    }),
  };

  const out: IMotionCaptureCase[] = [];
  for (const [name, make] of Object.entries(scenarios)) {
    if (family !== undefined && family !== name) continue;
    const s = make();
    const [PA, PB, pa, pb] =
      s.swap === true ? [B, A, small, tall] : [A, B, tall, small];
    const perform = (a: HumanChain, b?: HumanChain): HumanPerformance =>
      new HumanPerformance({
        seed: name,
        performers: [
          {
            subject: "a",
            body: PA,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(b === undefined
            ? []
            : [
                {
                  subject: "b",
                  body: PB,
                  at: { x: 0, y: 0, z: s.gap },
                  yaw: 180,
                  proficiency: { level: "trained" as const },
                },
              ]),
        ],
        composition: (b === undefined ? a : a.with(b)).node,
      });
    const performance: HumanPerformance = perform(s.a, s.b);
    const subjects: {
      id: string;
      body: IHumanBody;
      other?: { id: string; body: IHumanBody };
    }[] = [
      {
        id: "a",
        body: PA,
        ...(s.b === undefined ? {} : { other: { id: "b", body: PB } }),
      },
      ...(s.b === undefined
        ? []
        : [{ id: "b", body: PB, other: { id: "a", body: PA } }]),
    ];
    const strikes: {
      id: string;
      body: IHumanBody;
      other?: { id: string; body: IHumanBody };
      segment: HumanSegment.ISegment;
    }[] = subjects.flatMap((p) =>
      performance
        .segments(p.id)
        .filter(
          (g: HumanSegment.ISegment): boolean =>
            g.name === "punch" || g.name === "kick" || g.name === "knee",
        )
        .map((segment: HumanSegment.ISegment) => ({ ...p, segment })),
    );
    const times: IMotionCaptureCase.ITime[] = [];
    const trails: { color: number; points: IAutoMovieVector3[] }[] = [];
    const targets: { at: IAutoMovieVector3; radius: number; color: number }[] =
      [];
    const verdicts: IMotionCaptureCase.IVerdict[] = [];
    for (const strike of strikes) {
      const g: HumanSegment.ISegment = strike.segment;
      const record: StrikingRecord.IRecord | undefined = StrikingRecord.of(
        g.plan,
      );
      const at = (event: string): number | undefined => {
        const e = g.plan.events.find((x) => x.name === event);
        return e === undefined
          ? undefined
          : g.start + e.share * g.plan.duration;
      };
      const stop: number | undefined = record?.stop(g.end);
      const contact: number | undefined = stop ?? at("impact") ?? at("shown");
      times.push({
        seconds: g.entryTime,
        label: `${strike.id} ${g.id} launch`,
      });
      const chamber: number | undefined = at("chamber");
      if (chamber !== undefined && chamber > g.entryTime)
        times.push({ seconds: chamber, label: `${strike.id} chamber` });
      else if (contact !== undefined)
        times.push({
          seconds: (g.entryTime + contact) / 2,
          label: `${strike.id} mid`,
        });
      if (contact !== undefined)
        times.push({
          seconds: Math.min(g.end, contact),
          label: `${strike.id} ${stop === undefined ? "contact" : "stop"}`,
        });
      times.push({ seconds: g.end, label: `${strike.id} end` });

      // The weapon's end joint trail and the planned contact point.
      const end: "leftHand" | "rightHand" | "leftFoot" | "rightFoot" = weapon(
        performance,
        strike.id,
        g,
      );
      const points: IAutoMovieVector3[] = [];
      for (let t: number = g.entryTime; t <= g.end + 1e-9; t += 1 / 48)
        points.push(performance.bones(strike.id, t).get(end)!.worldPosition);
      trails.push({ color: strike.id === "a" ? 0xd0503c : 0x3c7ad0, points });
      if (record !== undefined)
        targets.push({ at: record.planned, radius: 0.02, color: 0xe0c040 });

      // A measurement for the review of the side sheets, not a bound: how
      // high the kicking knee is at the chamber key against the target and
      // the defender's shoulders, when the kick reaches its chamber key
      // before any stop.
      if (
        g.name === "kick" &&
        chamber !== undefined &&
        chamber > g.entryTime &&
        (stop === undefined || chamber <= stop) &&
        record !== undefined
      ) {
        const side: "left" | "right" = end === "leftFoot" ? "left" : "right";
        const knee: number = performance
          .bones(strike.id, chamber)
          .get(`${side}LowerLeg`)!.worldPosition.y;
        const shoulders: string =
          strike.other === undefined
            ? ""
            : `, the defender's shoulders at ${(
                (performance
                  .bones(strike.other.id, chamber)
                  .get("leftUpperArm")!.worldPosition.y +
                  performance
                    .bones(strike.other.id, chamber)
                    .get("rightUpperArm")!.worldPosition.y) /
                2
              ).toFixed(3)} m`;
        verdicts.push({
          name: `${strike.id} ${g.id} chamber knee (measured)`,
          passed: true,
          detail: `knee at ${knee.toFixed(3)} m, hip at ${performance.bones(strike.id, chamber).get(`${side}UpperLeg`)!.worldPosition.y.toFixed(3)} m, target at ${record.planned.y.toFixed(3)} m${shoulders}`,
        });
      }

      // Contact: at the stop the weapon touches the first surface on its
      // line within 15 mm; a strike that met nothing reaches its planned
      // point within 15 mm at its contact second (an extension check).
      const leg: boolean = end === "leftFoot" || end === "rightFoot";
      const capsules = (
        bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      ): ICapsule[] =>
        leg
          ? legCapsules(
              strike.body,
              bones,
              end === "leftFoot" ? "left" : "right",
            )
          : armCapsules(
              strike.body,
              bones,
              end === "leftHand" ? "left" : "right",
            );

      // The weapon's capsules on the shown bones against the other body's
      // colliders, by the exact segment distance: the depth is the limb's own,
      // wherever along it the other body is met.
      const gap = (t: number): { distance: number; name: string } => {
        if (strike.other === undefined)
          return { distance: Infinity, name: "nothing" };
        const others = performance.bones(strike.other.id, t);
        let best: { distance: number; name: string } = {
          distance: Infinity,
          name: "nothing",
        };
        for (const c of capsules(performance.bones(strike.id, t))) {
          const near: HumanColliders.IDistance =
            HumanColliders.distanceToSegment(
              strike.other.body,
              others,
              c.a,
              c.b,
            );
          if (near.distance - c.radius < best.distance)
            best = {
              distance: near.distance - c.radius,
              name: `${near.bone} (${c.name})`,
            };
        }
        return best;
      };
      // The verdict compares with the declared intent: a feint, a graze or a
      // miss must meet nothing, a strike cut before its contact is exempt, and
      // a strike meant to hit must stop on a surface.
      const params = g.params as {
        feint?: number | boolean;
        accuracy?: unknown;
      };
      const cut: boolean =
        g.plan.contact !== undefined && g.end < g.start + g.plan.contact - 1e-9;
      const passes: boolean =
        params.feint !== undefined && params.feint !== false
          ? true
          : params.accuracy === "graze" || params.accuracy === "miss";
      if (cut)
        verdicts.push({
          name: `${strike.id} ${g.id} contact`,
          passed: stop === undefined,
          detail: "cut before its contact",
        });
      else if (strike.other === undefined) {
        const reach: number =
          record === undefined || contact === undefined
            ? Infinity
            : Math.min(
                ...capsules(performance.bones(strike.id, contact)).map(
                  (c: ICapsule): number =>
                    Vector3.length(
                      Vector3.subtract(
                        StrikingContact.closest(record.reached, c.a, c.b),
                        record.reached,
                      ),
                    ) - c.radius,
                ),
              );
        const short: number =
          record === undefined
            ? 0
            : Vector3.length(Vector3.subtract(record.planned, record.reached));
        verdicts.push({
          name: `${strike.id} ${g.id} extension`,
          passed: Math.abs(reach) <= 0.015,
          detail: `${(1000 * reach).toFixed(1)} mm from its ${short > 0.001 ? `maximum reach (the virtual aim lies ${(1000 * short).toFixed(0)} mm beyond, the declared miss)` : "virtual aim"}`,
        });
      } else if (passes)
        verdicts.push({
          name: `${strike.id} ${g.id} contact`,
          passed: stop === undefined,
          detail:
            stop === undefined
              ? "met nothing, as declared"
              : `met ${gap(stop).name} though declared to pass`,
        });
      else if (
        stop === undefined &&
        record !== undefined &&
        record.status === "short"
      ) {
        // A declared miss stands only when the target lies beyond the bare
        // limb's length from its root at the launch, an anatomical bound
        // the law does not compute: a target within it is a law failure.
        const m = strike.body.measure;
        const side: "left" | "right" = end.startsWith("left")
          ? "left"
          : "right";
        const root: IAutoMovieVector3 = performance
          .bones(strike.id, g.entryTime)
          .get(leg ? `${side}UpperLeg` : `${side}UpperArm`)!.worldPosition;
        const length: number =
          g.name === "knee"
            ? m.thigh + m.thighRadius
            : leg
              ? m.thigh + m.shank + m.footLength
              : m.upperArm + m.forearm + m.hand;
        const beyond: number =
          Vector3.length(Vector3.subtract(record.planned, root)) - length;
        verdicts.push({
          name: `${strike.id} ${g.id} contact`,
          passed: beyond > 0,
          detail: `declared beyond reach by ${(1000 * Vector3.length(Vector3.subtract(record.planned, record.reached))).toFixed(0)} mm; the target lies ${(1000 * beyond).toFixed(0)} mm ${beyond > 0 ? "beyond" : "within"} the bare limb's length from its root`,
        });
      } else if (stop === undefined)
        verdicts.push({
          name: `${strike.id} ${g.id} contact`,
          passed: false,
          detail: `declared to hit but met nothing${
            record === undefined
              ? ""
              : ` (solve ${record.status}; the shown weapon at the planned contact lies ${(1000 * Vector3.length(Vector3.subtract(record.reached, record.planned))).toFixed(0)} mm from the target)`
          }`,
        });
      else {
        const touch = gap(stop);
        const landed: boolean = /head|neck|chest|spine|hips/i.test(touch.name);
        verdicts.push({
          name: `${strike.id} ${g.id} contact`,
          passed: Math.abs(touch.distance) <= 0.015,
          detail: `${landed ? "landed on" : "stopped by"} ${touch.name} at ${stop.toFixed(3)} s, gap ${(1000 * touch.distance).toFixed(1)} mm`,
        });
      }

      // Penetration, support slip and range of motion over the strike; the
      // deepest instant is named with what it sank into, so a sink after the
      // stop (the recoil) reads apart from one before it (the stop itself).
      let deepest: { distance: number; name: string; at: number } = {
        distance: Infinity,
        name: "nothing",
        at: g.entryTime,
      };
      for (let t: number = g.entryTime; t <= g.end + 1e-9; t += 1 / 96) {
        const now = gap(t);
        if (now.distance < deepest.distance) deepest = { ...now, at: t };
      }
      verdicts.push({
        name: `${strike.id} ${g.id} penetration`,
        passed: deepest.distance >= -0.01,
        detail: `deepest ${(1000 * Math.min(0, deepest.distance)).toFixed(1)} mm${deepest.distance < 0 ? ` into ${deepest.name} at ${deepest.at.toFixed(3)} s` : ""}`,
      });
      const drift = slip(performance, strike.id, strike.body, g);
      verdicts.push({
        name: `${strike.id} ${g.id} support slip`,
        passed: drift.worst <= 0.005,
        detail: `${(1000 * drift.worst).toFixed(2)} mm (${drift.part} ${drift.kind} window from ${drift.from.toFixed(3)} s, past 1 mm at ${drift.onset === undefined ? "none" : `${drift.onset.toFixed(3)} s`}, worst at ${drift.at.toFixed(3)} s)`,
      });
      let over: number = 0;
      for (let t: number = g.entryTime; t <= g.end + 1e-9; t += 1 / 48) {
        const pose = performance.pose(strike.id, t);
        const clamped = clampPose(pose, strike.body.skeleton);
        for (const j of pose.joints) {
          const c = clamped.joints.find((x) => x.bone === j.bone)!;
          over = Math.max(
            over,
            Math.abs((c.flexion ?? 0) - (j.flexion ?? 0)),
            Math.abs((c.abduction ?? 0) - (j.abduction ?? 0)),
            Math.abs((c.twist ?? 0) - (j.twist ?? 0)),
          );
        }
      }
      verdicts.push({
        name: `${strike.id} ${g.id} range of motion`,
        passed: over <= 1e-6,
        detail: `largest overshoot ${over.toFixed(6)} deg`,
      });
    }

    // A redirect after the chamber key must be refused.
    if (s.late !== undefined) {
      let refused: string = "";
      try {
        perform(s.late, s.b);
      } catch (error) {
        refused = error instanceof Error ? error.message : String(error);
      }
      verdicts.push({
        name: "redirect after the chamber key refused",
        passed: refused !== "",
        detail: refused === "" ? "accepted" : refused,
      });
    }
    times.sort((x, y) => x.seconds - y.seconds);
    const performers: IMotionCaptureCase.IPerformer[] = [
      { id: "a", body: pa.body, pose: (t: number) => performance.pose("a", t) },
      ...(s.b === undefined
        ? []
        : [
            {
              id: "b",
              body: pb.body,
              pose: (t: number) => performance.pose("b", t),
              color: 0x7a8fa6,
            },
          ]),
    ];
    const ghosts: IMotionCaptureCase.IGhost[] = [];
    if (s.ghost !== undefined) {
      const source: HumanPerformance = perform(s.ghost, s.b);
      ghosts.push({
        id: "uninterrupted",
        body: pa.body,
        pose: (t: number) => source.pose("a", t),
        opacity: 0.3,
      });
    }
    out.push({ name, times, performers, ghosts, trails, targets, verdicts });
  }
  return out;
}

/**
 * The root gap at which two bodies, each holding its chain's last pose and
 * facing the other along +Z, just touch along that line: posed once two
 * metres apart, the attacker's foremost collider point along +Z and the
 * defender's hindmost are each a support function of the posed shapes, and
 * the gap closes by their separation.
 */
function touching(
  A: IHumanBody,
  B: IHumanBody,
  a: HumanChain,
  b: HumanChain,
): number {
  const apart: number = 2;
  const p: HumanPerformance = new HumanPerformance({
    seed: "touching",
    performers: [
      {
        subject: "a",
        body: A,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: B,
        at: { x: 0, y: 0, z: apart },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: a.with(b).node,
  });
  const reach = (
    body: IHumanBody,
    subject: string,
    along: IAutoMovieVector3,
  ): number => {
    const t: number = p.segments(subject).at(-1)!.end;
    let most: number = -Infinity;
    for (const c of StrikingBody.colliders(body, p.bones(subject, t))) {
      if (c.kind === "capsule")
        most = Math.max(
          most,
          Vector3.dot(c.a, along) + c.radius,
          Vector3.dot(c.b, along) + c.radius,
        );
      else {
        let extent: number = Vector3.dot(c.centre, along);
        for (const axis of [
          { x: c.halfExtents.x, y: 0, z: 0 },
          { x: 0, y: c.halfExtents.y, z: 0 },
          { x: 0, y: 0, z: c.halfExtents.z },
        ])
          extent += Math.abs(
            Vector3.dot(Quaternion.rotateVector(c.rotation, axis), along),
          );
        most = Math.max(most, extent);
      }
    }
    return most;
  };
  const front: number = reach(A, "a", { x: 0, y: 0, z: 1 });
  const rear: number = -reach(B, "b", { x: 0, y: 0, z: -1 });
  return apart - (rear - front);
}

/** A weapon capsule on shown bones: an axis swept by a radius, world metres. */
interface ICapsule {
  /** What part of the limb it is. */
  name: string;
  /** One end of its axis. */
  a: IAutoMovieVector3;
  /** The other end. */
  b: IAutoMovieVector3;
  /** Its radius, metres. */
  radius: number;
}

/**
 * A kicking or kneeing leg's capsules on shown bones, measured from the
 * body: the thigh from the hip to the knee with the thigh's radius, the
 * shank from the knee to the ankle with the shank's radius, and the foot
 * from the ankle to the ball with half the ankle's height.
 */
function legCapsules(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: "left" | "right",
): ICapsule[] {
  const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
  const ball: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.sockets[side === "left" ? "ballLeft" : "ballRight"],
    foot,
  ).point;
  return [
    {
      name: "thigh",
      a: bones.get(`${side}UpperLeg`)!.worldPosition,
      b: bones.get(`${side}LowerLeg`)!.worldPosition,
      radius: body.measure.thighRadius,
    },
    {
      name: "shank",
      a: bones.get(`${side}LowerLeg`)!.worldPosition,
      b: foot.worldPosition,
      radius: body.measure.shankRadius,
    },
    {
      name: "foot",
      a: foot.worldPosition,
      b: ball,
      radius: 0.5 * body.measure.ankleHeight,
    },
  ];
}

/**
 * A punching arm's capsules on shown bones, measured from the body: the
 * upper arm from the shoulder to the elbow with its radius, the forearm from
 * the elbow to the wrist and the fist from the wrist to one forearm radius
 * behind the knuckles, both of the forearm's radius, so the fist's front is
 * the knuckles.
 */
function armCapsules(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: "left" | "right",
): ICapsule[] {
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const knuckles: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"],
    hand,
  ).point;
  const reach: IAutoMovieVector3 = Vector3.subtract(
    knuckles,
    hand.worldPosition,
  );
  const length: number = Vector3.length(reach);
  const r: number = body.measure.forearmRadius;
  return [
    {
      name: "upper arm",
      a: bones.get(`${side}UpperArm`)!.worldPosition,
      b: bones.get(`${side}LowerArm`)!.worldPosition,
      radius: body.measure.upperArmRadius,
    },
    {
      name: "forearm",
      a: bones.get(`${side}LowerArm`)!.worldPosition,
      b: hand.worldPosition,
      radius: r,
    },
    {
      name: "fist",
      a: hand.worldPosition,
      b: Vector3.add(
        hand.worldPosition,
        Vector3.scale(reach, Math.max(0, length - r) / Math.max(1e-9, length)),
      ),
      radius: r,
    },
  ];
}

/** The largest drift of a foot's ball within a segment's plant or pivot windows, metres (a pivot turns about the ball, so the ball must stay), with that window's start and the second its drift first passed 1 mm. */
function slip(
  performance: HumanPerformance,
  subject: string,
  body: IHumanBody,
  segment: HumanSegment.ISegment,
): {
  worst: number;
  part: string;
  kind: string;
  at: number;
  from: number;
  onset?: number;
} {
  let worst: {
    worst: number;
    part: string;
    kind: string;
    at: number;
    from: number;
    onset?: number;
  } = {
    worst: 0,
    part: "none",
    kind: "none",
    at: segment.entryTime,
    from: segment.entryTime,
  };
  for (const c of segment.plan.contacts) {
    if (
      (c.part !== "leftFoot" && c.part !== "rightFoot") ||
      (c.kind !== "plant" && c.kind !== "pivot")
    )
      continue;
    const from: number = Math.max(
      segment.entryTime,
      segment.start + c.from * segment.plan.duration,
    );
    const to: number = Math.min(
      segment.end,
      segment.start + c.to * segment.plan.duration,
    );
    if (!(to > from)) continue;
    const frame =
      body.surfaces.sockets[c.part === "leftFoot" ? "ballLeft" : "ballRight"];
    const at = (t: number): IAutoMovieVector3 =>
      resolveAutoMovieHumanoidSurfaces.place(
        frame,
        performance.bones(subject, t).get(frame.bone)!,
      ).point;
    const origin: IAutoMovieVector3 = at(from);
    let onset: number | undefined;
    for (let t: number = from; t <= to + 1e-9; t += 1 / 48) {
      const d: number = Vector3.length(Vector3.subtract(at(t), origin));
      if (onset === undefined && d > 0.001) onset = t;
      if (d > worst.worst)
        worst = {
          worst: d,
          part: c.part,
          kind: c.kind,
          at: t,
          from,
          ...(onset === undefined ? {} : { onset }),
        };
    }
  }
  return worst;
}

/** The end joint carrying a strike's weapon: the hand (a punch) or foot (a kick or a knee) that moves farthest during it. */
function weapon(
  performance: HumanPerformance,
  subject: string,
  segment: HumanSegment.ISegment,
): "leftHand" | "rightHand" | "leftFoot" | "rightFoot" {
  let best: "leftHand" | "rightHand" | "leftFoot" | "rightFoot" = "leftHand";
  let far: number = -1;
  const start = performance.bones(subject, segment.entryTime);
  const mid = performance.bones(
    subject,
    segment.start + (segment.plan.contact ?? segment.plan.duration / 2),
  );
  for (const bone of segment.name === "punch"
    ? (["leftHand", "rightHand"] as const)
    : (["leftFoot", "rightFoot"] as const)) {
    const a: IAutoMovieVector3 = start.get(bone)!.worldPosition;
    const b: IAutoMovieVector3 = mid.get(bone)!.worldPosition;
    const d: number = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d > far) {
      far = d;
      best = bone;
    }
  }
  return best;
}
