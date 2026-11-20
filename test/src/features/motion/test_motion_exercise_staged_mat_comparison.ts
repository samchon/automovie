import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanCoupled,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  grapple,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/** The old land/clearance witness's world tolerance in metres. */
const SKIN: number = 0.01;

/** Authored digital takes and their independent expected stage disposition. */
const TAKES = [
  { scene: { kind: "seoiNage", outcome: "complete" }, expected: "mat" },
  { scene: { kind: "oGoshi", outcome: "complete" }, expected: "mat" },
  { scene: { kind: "oGoshi", outcome: "denied" }, expected: "refused" },
  { scene: { kind: "singleLeg", outcome: "denied" }, expected: "upright" },
] as const satisfies readonly {
  /** Authored mutual scene parameters. */
  scene: IAutoMovieMotionHumanGrapple.IScene;

  /** Expected stage disposition for the fixed fixture. */
  expected: "mat" | "refused" | "upright";
}[];

/**
 * Two staged mat entries read as different receiver paths on the same scene
 * marks. The alternate outcome exits upright on the shared film clock.
 *
 * Scenarios:
 * 1. Both named complete takes use the same cast and reach the mat with a
 *    declared floor support.
 * 2. One complete take moves the displayed receiver to a different place
 *    during the same relative phase than the other take.
 * 3. Sampling one denied setup refuses its unavailable partner contact. The admitted
 *    recovery completes its release and stays upright without a mat window.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the comparison, same-cast control, shared film clock and alternate outcome.
 * @evidence contracts/development/testing.md#behavioral-verification The public mutual composition places both characters. Samples read both posed rigs at the named release and intermediate phases, with floor support observed at the final pose.
 * @evidence contracts/development/testing.md#independent-expectations The same scene-space marks and independent chosen outcome isolate the movement contrast. A displacement over five centimetres separates the path from the floor/skin tolerance. The maintained grapple witness supplies the 1 cm skin tolerance and 30 percent of stature upright criterion.
 * @evidence contracts/development/testing.md#distinguishing-cases Two complete forms use the same poses at entry and need observable path separation. The separate denied controls distinguish an impossible partner placement from an admitted upright release. These bounded samples do not establish swept clearance.
 * @evidence contracts/development/testing.md#execution-ownership Uses only in-memory SDK inputs and pose/skin queries. No production host or native capture is invoked.
 */
export function test_motion_exercise_staged_mat_comparison(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const positions: Array<readonly IAutoMovieVector3[]> = [];
  const matHeight: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body, [
      new Set<AutoMovieHumanoidBone>(["hips", "spine", "chest"]),
    ]);

  for (const { scene, expected } of TAKES) {
    const label: string = `${scene.kind}/${scene.outcome}`;
    const uprightControl: boolean = scene.kind === "singleLeg";
    const actorYaw: number = uprightControl ? 0 : 8;
    const receiverYaw: number = uprightControl ? 165 : 188;
    try {
      const film: HumanPerformance = staged(body, scene, actorYaw, receiverYaw);
      const a: IAutoMovieMotionHumanSegment = film.segments("a").at(-1)!;
      const b: IAutoMovieMotionHumanSegment = film.segments("b").at(-1)!;
      const receiver: IAutoMovieMotionHumanSignature.IReader =
        HumanSignature.of(film, "b", body, receiverYaw);
      const actor: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        actorYaw,
      );
      const release: number | undefined = a.plan.events.find(
        (event) => event.name === "release",
      )?.share;
      complaints.check(
        `${label} shares the clock and publishes a release before the end`,
        nclose(a.start, b.start) &&
          nclose(a.end, b.end) &&
          release !== undefined &&
          release > 0 &&
          release < 1,
      );
      const samples: number[] = [0, 0.25, 0.5, 0.75, 1].map(
        (share: number): number => b.start + (b.end - b.start) * share,
      );
      if (release !== undefined)
        samples.push(a.start + a.plan.duration * release);
      const gap: number = Math.min(
        ...samples.map((seconds: number): number =>
          HumanSignature.apart(actor, receiver, seconds),
        ),
      );
      if (expected === "refused") {
        complaints.list.push(
          `${label}: displayed poses should refuse the partner placement`,
        );
        continue;
      }
      complaints.check(`${label} body/skin gap ${gap} m`, gap >= -SKIN);

      const supports: readonly IAutoMovieMotionHumanContactWindow[] =
        b.plan.contacts.filter(
          (contact): boolean =>
            contact.support.kind === "ground" &&
            (contact.part === "seat" || contact.part === "back"),
        );
      const grounded: boolean = supports.some((contact): boolean =>
        nclose(contact.to, 1),
      );
      const floorGap: number = Math.abs(
        matHeight(HumanSignature.bones(receiver, b.end))[0]!,
      );
      const head: IAutoMovieVector3 = HumanSignature.joint(
        receiver,
        b.end,
        "head",
      );
      const hips: IAutoMovieVector3 = HumanSignature.joint(
        receiver,
        b.end,
        "hips",
      );
      const upright: boolean = head.y - hips.y > 0.3 * body.measure.stature;
      complaints.check(
        `${label} mat support ${grounded}, skin gap ${floorGap} m, head above hips ${head.y - hips.y} m`,
        expected === "mat"
          ? grounded && !upright && floorGap <= SKIN
          : supports.length === 0 && upright,
      );

      if (expected === "mat")
        positions.push(
          samples
            .slice(1, 5)
            .map(
              (seconds: number): IAutoMovieVector3 =>
                HumanSignature.joint(receiver, seconds, "hips"),
            ),
        );
    } catch (error) {
      if (
        expected !== "refused" ||
        !(error instanceof HumanRefusal) ||
        error.axis !== "partner"
      )
        complaints.list.push(`${label}: ${String(error)}`);
    }
  }

  if (positions.length === 2) {
    const difference: number = Math.max(
      ...positions[0]!.map((point: IAutoMovieVector3, index: number): number =>
        Vector3.distance(point, positions[1]![index]!),
      ),
    );
    complaints.check(
      `complete staged receiver paths differ by ${difference} m`,
      difference > 0.05,
    );
  }
  complaints.assert("Staged mat entry and authored recovery");
}

/** Use the registered production law and existing scene-space marks. */
function staged(
  body: IAutoMovieMotionHumanBody,
  scene: IAutoMovieMotionHumanGrapple.IScene,
  actorYaw: number,
  receiverYaw: number,
): HumanPerformance {
  const uprightControl: boolean = scene.kind === "singleLeg";
  return new HumanPerformance({
    seed: "matched-stage-mat",
    laws: [grapple],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: uprightControl ? -0.21 : -0.27 },
        yaw: actorYaw,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: uprightControl
          ? { x: -0.36, y: 0, z: 0.66 }
          : { x: 0.09, y: 0, z: 0.27 },
        yaw: receiverYaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.mutual(
      HumanCoupled.grappling,
      {
        initiator: HumanChain.subject("a").stand({ seconds: 0.3, sway: 0 }),
        receiver: HumanChain.subject("b").stand({ seconds: 0.3, sway: 0 }),
      },
      scene,
    ).node,
  });
}
