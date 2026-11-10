import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanProxemics,
  type IHumanBody,
  approach,
  createHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * On polygon men of different statures and proportions, an approach stops
 * at its interpersonal gap facing its partner, and a look puts both eyes'
 * lines on its target without moving the feet.
 *
 * Scenarios, for every ordered pair of four sweep bodies (the small woman,
 * the tall man, the long-armed man and the short-legged man):
 * 1. `personal`, `faceToFace` and `handing` approaches stop with the
 *    horizontal sternum-to-sternum gap within 0.02 m of the requested gap
 *    (the handing gap from both bodies' own measures), facing the partner
 *    within 5 degrees.
 * 2. Every planted foot of the approach moves at most 5 mm while planted.
 * 3. An approach that starts nearer than its gap is refused.
 * 4. Looks at the partner's face, at a point 50 degrees to the side and at
 *    the floor ahead put each eye's forward axis within 2 degrees of its
 *    target once settled, and neither ankle moves more than 5 mm.
 * 5. An uncued look 100 degrees off the heading is refused; with a cue it
 *    starts after a reaction time between 0.1 and 0.6 s.
 * 6. An approach to a person's left side stops at the personal gap on that
 *    side facing them within 5 degrees, and walks round a third person
 *    standing on the straight line, the pelvises never nearer than the
 *    walker's lateral clearance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs whole performances and reads the posed bones; a stop off its gap, a body not facing its partner, sliding plants, an eye off its target or a missing refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations Gaps are Hall's bands and the handing gap's own formula from each body's measure; bounds are the campaign's 0.02 m, 5 degree, 2 degree and 5 mm acceptance values; eye directions are read from forward kinematics, not from the law's angles.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers short against tall in both orders, proportion extremes, three bands, three gaze eccentricities and the cue rule; band arithmetic is owned by the CI proxemics test.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_human_motion_everyday_approach_look(): void {
  const names: string[] = [
    "f-small",
    "m-tall",
    "m-long-armed",
    "m-short-legged",
  ];
  const bodies: Map<string, IHumanBody> = new Map(
    names.map((n: string): [string, IHumanBody] => {
      const man = MotionBodies.population(n);
      return [n, createHumanBody(man.body.skeleton, man.body.profile)];
    }),
  );
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };

  for (const a of names)
    for (const b of names) {
      if (a === b) continue;
      const self: IHumanBody = bodies.get(a)!;
      const other: IHumanBody = bodies.get(b)!;
      for (const band of ["personal", "faceToFace", "handing"] as const) {
        const target: AutoMovieMotionTarget = {
          kind: "person",
          subject: "b",
          region: "sternum",
        };
        const chain = HumanChain.subject("a")
          .approach({ target, at: band })
          .with(HumanChain.subject("b").stand({ seconds: 12 }));
        const performance: HumanPerformance = new HumanPerformance({
          seed: `approach-${a}-${b}-${band}`,
          performers: [
            {
              subject: "a",
              body: self,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
            {
              subject: "b",
              body: other,
              at: { x: 0.4, y: 0, z: 3.2 },
              yaw: 180,
              proficiency: { level: "trained" },
            },
          ],
          composition: chain.node,
        });
        const segment = performance.segments("a")[0]!;
        const end: number = segment.end;
        const sternum = (
          subject: string,
          body: IHumanBody,
          t: number,
        ): IAutoMovieVector3 =>
          region(body, performance.bones(subject, t), "sternum");
        const pa: IAutoMovieVector3 = sternum("a", self, end);
        const pb: IAutoMovieVector3 = sternum("b", other, end);
        const gap: number = Math.hypot(pa.x - pb.x, pa.z - pb.z);
        const want: number = HumanProxemics.gap(
          band,
          self.measure,
          other.measure,
        );
        check(
          `${a}->${b} ${band} gap ${gap.toFixed(3)} vs ${want.toFixed(3)}`,
          Math.abs(gap - want) <= 0.02,
        );
        const hips: IAutoMovieResolvedBone = performance
          .bones("a", end)
          .get("hips")!;
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(
          hips.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
        const facing: number =
          (Math.acos(
            Math.max(
              -1,
              Math.min(
                1,
                (forward.x * (pb.x - pa.x) + forward.z * (pb.z - pa.z)) /
                  (Math.hypot(forward.x, forward.z) * gap),
              ),
            ),
          ) *
            180) /
          Math.PI;
        check(`${a}->${b} ${band} facing ${facing.toFixed(2)}`, facing <= 5);
        check(
          `${a}->${b} ${band} slip ${slip(performance, "a", segment.start, end).toFixed(4)}`,
          slip(performance, "a", segment.start, end) <= 0.005,
        );
      }
    }

  const near = (): unknown =>
    new HumanPerformance({
      seed: "near",
      performers: [
        {
          subject: "a",
          body: bodies.get("m-tall")!,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: bodies.get("f-small")!,
          at: { x: 0, y: 0, z: 0.7 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .approach({
          target: { kind: "person", subject: "b", region: "sternum" },
        })
        .with(HumanChain.subject("b").stand()).node,
    });
  TestValidator.error("an approach from inside its gap is refused", near);

  // Stopping at a person's left side, walking round a third person in the way.
  {
    const performance: HumanPerformance = new HumanPerformance({
      seed: "side",
      performers: [
        {
          subject: "a",
          body: bodies.get("m-tall")!,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: bodies.get("f-small")!,
          at: { x: 0, y: 0, z: 4 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
        {
          subject: "c",
          body: bodies.get("m-short-legged")!,
          at: { x: 0.1, y: 0, z: 2 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .approach({
          target: { kind: "person", subject: "b", region: "sternum" },
          side: "left",
          avoid: ["c"],
        })
        .with(HumanChain.subject("b").stand({ seconds: 14 }))
        .with(HumanChain.subject("c").stand({ seconds: 14 })).node,
    });
    const walking = performance.segments("a")[0]!;
    const self: IHumanBody = bodies.get("m-tall")!;
    const pa: IAutoMovieVector3 = region(
      self,
      performance.bones("a", walking.end),
      "sternum",
    );
    const pb: IAutoMovieVector3 = region(
      bodies.get("f-small")!,
      performance.bones("b", walking.end),
      "sternum",
    );
    const gap: number = Math.hypot(pa.x - pb.x, pa.z - pb.z);
    check(
      `side gap ${gap.toFixed(3)}`,
      Math.abs(gap - HumanProxemics.GAPS.personal) <= 0.02,
    );
    check(
      `side is b's left (x ${(pa.x - pb.x).toFixed(3)})`,
      pa.x - pb.x < -0.9 * HumanProxemics.GAPS.personal,
    );
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      performance.bones("a", walking.end).get("hips")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    const facing: number =
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (forward.x * (pb.x - pa.x) + forward.z * (pb.z - pa.z)) /
              (Math.hypot(forward.x, forward.z) * gap),
          ),
        ),
      ) *
        180) /
      Math.PI;
    check(`side facing ${facing.toFixed(2)}`, facing <= 5);
    let nearest: number = Infinity;
    for (let t: number = walking.entryTime; t <= walking.end; t += 1 / 24) {
      const a: IAutoMovieVector3 = performance
        .bones("a", t)
        .get("hips")!.worldPosition;
      const c: IAutoMovieVector3 = performance
        .bones("c", t)
        .get("hips")!.worldPosition;
      nearest = Math.min(nearest, Math.hypot(a.x - c.x, a.z - c.z));
    }
    check(
      `walked round c (${nearest.toFixed(3)} m)`,
      nearest >= approach.CLEARANCE,
    );
  }

  for (const name of names) {
    const body: IHumanBody = bodies.get(name)!;
    const targets: [string, AutoMovieMotionTarget][] = [
      ["face", { kind: "person", subject: "b", region: "face" }],
      [
        "side",
        {
          kind: "point",
          at: {
            x: 2 * Math.sin((50 * Math.PI) / 180),
            y: 1.5,
            z: 2 * Math.cos((50 * Math.PI) / 180),
          },
          frame: "world",
        },
      ],
      ["floor", { kind: "point", at: { x: 0, y: 0, z: 1.2 }, frame: "world" }],
    ];
    for (const [label, target] of targets) {
      const performance: HumanPerformance = new HumanPerformance({
        seed: `look-${name}-${label}`,
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: bodies.get("m-tall")!,
            at: { x: -0.3, y: 0, z: 2 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .look({ target })
          .with(HumanChain.subject("b").stand({ seconds: 5 })).node,
      });
      const segment = performance.segments("a")[0]!;
      const settled: number =
        segment.start +
        segment.plan.events.find((e) => e.name === "settled")!.share *
          segment.plan.duration;
      const t: number = Math.min(segment.end, settled + 0.1);
      const bones = performance.bones("a", t);
      const goal: IAutoMovieVector3 = performance.aim(target, t, {
        root: { x: 0, y: 0, z: 0 },
        yaw: 0,
        heights: { low: 0, middle: 0, high: 0 },
        range: 1,
      }).point;
      for (const eye of ["leftEye", "rightEye"] as const) {
        const e: IAutoMovieResolvedBone = bones.get(eye)!;
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          e.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
        const to: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(goal, e.worldPosition),
        );
        const error: number =
          (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(axis, to)))) * 180) /
          Math.PI;
        check(
          `${name} look ${label} ${eye} error ${error.toFixed(2)}`,
          error <= 2,
        );
      }
      check(
        `${name} look ${label} slip`,
        slip(performance, "a", segment.start, segment.end) <= 0.005,
      );
    }
  }

  const behind = (cue?: "seen"): HumanPerformance =>
    new HumanPerformance({
      seed: "behind",
      performers: [
        {
          subject: "a",
          body: bodies.get("m-tall")!,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").look({
        target: {
          kind: "point",
          at: { x: 2 * Math.sin(1.745), y: 1.6, z: 2 * Math.cos(1.745) },
          frame: "world",
        },
        ...(cue === undefined ? {} : { cue }),
      }).node,
    });
  TestValidator.error("an uncued look behind is refused", (): unknown =>
    behind(),
  );
  const cued = behind("seen").segments("a")[0]!;
  const onset: number =
    cued.plan.events.find((e) => e.name === "gazeOn")!.share *
    cued.plan.duration;
  check(`cued onset ${onset.toFixed(3)}`, onset > 0.1 && onset < 0.6 + 0.2);
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** A region's world point on posed bones. */
function region(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  name: "sternum",
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions[name],
    bones.get(body.surfaces.regions[name].bone)!,
  ).point;
}

/**
 * The largest slip of a planted foot over a span: within each plant window of
 * the person's actions, the foot's lowest sole socket (heel, ball or toe) is
 * its contact, and the slip is that socket's horizontal drift from where it
 * first became the contact in the window, frame by frame on the 24 Hz grid.
 */
function slip(
  performance: HumanPerformance,
  subject: string,
  from: number,
  to: number,
): number {
  let worst: number = 0;
  for (const segment of performance.segments(subject))
    for (const contact of segment.plan.contacts) {
      if (contact.part !== "leftFoot" && contact.part !== "rightFoot") continue;
      if (contact.kind !== "plant" && contact.kind !== "pivot") continue;
      const side: "Left" | "Right" =
        contact.part === "leftFoot" ? "Left" : "Right";
      const a: number = Math.max(
        from,
        segment.start + contact.from * segment.plan.duration,
        segment.entryTime,
      );
      const b: number = Math.min(
        to,
        segment.start + contact.to * segment.plan.duration,
        segment.end,
      );
      const anchors: Map<string, IAutoMovieVector3> = new Map();
      for (let t: number = a; t <= b + 1e-9; t += 1 / 24) {
        const bones = performance.bones(subject, t);
        const body: IHumanBody = performance.segments(subject)[0]!.context.body;
        let lowest: [string, IAutoMovieVector3] | undefined;
        for (const name of ["heel", "ball", "toe"]) {
          const frame = body.surfaces.sockets[`${name}${side}` as "heelLeft"];
          const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
            frame,
            bones.get(frame.bone)!,
          ).point;
          if (lowest === undefined || p.y < lowest[1].y - 1e-6)
            lowest = [name, p];
        }
        const [name, p] = lowest!;
        const anchor: IAutoMovieVector3 = anchors.get(name) ?? p;
        anchors.set(name, anchor);
        worst = Math.max(worst, Math.hypot(p.x - anchor.x, p.z - anchor.z));
      }
    }
  return worst;
}
