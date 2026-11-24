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
  AutoMovieMotionHumanCarryPerson,
  AutoMovieMotionHumanGrapple,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** The old land/clearance witness's world tolerance in metres. */
const SKIN: number = 0.01;

/** Least separation of two forms' receiver paths, metres: five skin tolerances. */
const APART: number = 0.05;

/** Initiator heading on its mark, degrees. */
const ACTOR_YAW: number = 8;

/** Receiver heading on its mark, degrees. */
const RECEIVER_YAW: number = 188;

/** The stage disposition a take must display. */
type Disposition = "mat" | "refused";

/**
 * Where a form is entered from: the hand and hip throws turn in from the
 * grip at arm's length, while the leg throws step in beside the partner.
 */
type Range = "turn" | "step";

/** The receiver's mark for each range in the reference cast's scene, metres. */
const RECEIVER_MARKS: Readonly<Record<Range, IAutoMovieVector3>> = {
  turn: { x: 0.09, y: 0, z: 0.27 },
  step: { x: 0.09, y: 0, z: 0.15 },
};

/** One authored take and its independently expected disposition. */
interface ITake {
  /** Authored mutual scene parameters. */
  scene: IAutoMovieMotionHumanGrapple.IScene;

  /** The canonical cast playing both roles. */
  cast: motionHumanBody.Name;

  /** The range the form is entered from. */
  range: Range;

  /** Expected stage disposition. */
  expected: Disposition;
}

/** A completed throw's receiver path at the shared phase samples. */
interface IPath {
  /** The take's label. */
  label: string;

  /** Receiver pelvis displacement from its opening place at the quarter, half and three-quarter samples and the end, metres. */
  hips: readonly IAutoMovieVector3[];
}

/** Shoulder, hip, leg and sweep throws, a scaled cast and an unreachable hip block. */
const TAKES: readonly ITake[] = [
  {
    scene: { kind: "seoiNage", outcome: "complete" },
    cast: "m-average",
    range: "turn",
    expected: "mat",
  },
  {
    scene: { kind: "oGoshi", outcome: "complete" },
    cast: "m-average",
    range: "turn",
    expected: "mat",
  },
  {
    scene: { kind: "oSotoGari", outcome: "complete" },
    cast: "m-average",
    range: "step",
    expected: "mat",
  },
  {
    scene: { kind: "deAshiHarai", outcome: "complete" },
    cast: "m-average",
    range: "step",
    expected: "mat",
  },
  {
    scene: { kind: "seoiNage", outcome: "complete" },
    cast: "f-small",
    range: "turn",
    expected: "mat",
  },

  {
    scene: { kind: "oGoshi", outcome: "denied" },
    cast: "m-average",
    range: "turn",
    expected: "refused",
  },
];

/**
 * Four staged judo throws read as different receiver paths and recover on
 * the mat, a smaller cast repeats one on proportional marks, and a blocked
 * hip throw whose grip the marks cannot reach is refused.
 *
 * Scenarios:
 * 1. The shoulder, hip, leg and sweep throws use the same cast, the hand and
 *    hip throws one pair of marks and the leg throws a closer receiver mark.
 *    Each grips collar and sleeve over a named window that closes at its
 *    release and lays the receiver on the mat with a declared floor support.
 * 2. Every two completed throws displace the displayed receiver pelvis from
 *    its opening place differently by more than 5 cm at some shared phase.
 * 3. The small cast plays the shoulder throw on marks scaled by stature.
 * 4. The blocked hip throw's sleeve grip lies beyond the arm at its marks and
 *    is refused on its partner axis while the poses are sampled.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four forms, the same-cast control, the scaled cast, the shared film clock and the refused case.
 * @evidence contracts/development/testing.md#behavioral-verification The public mutual composition places both characters. Samples read both posed rigs at the shared phases and the named release, with the grip windows from the plan and floor support observed on the final displayed pose.
 * @evidence contracts/development/testing.md#independent-expectations The receiver path is read as displacement from its own opening place, so a closer mark does not separate two forms. The authored outcome is an input. Judo's collar-and-sleeve grip names two hand contacts. A displacement over five skin tolerances separates two paths. The maintained grapple witness supplies the 1 cm skin tolerance and the 30 percent of stature upright criterion a mat finish stays below.
 * @evidence contracts/development/testing.md#distinguishing-cases Four completed forms must differ pairwise; a scaled cast keeps the mat outcome; the blocked hip throw, whose sleeve grip lies beyond the arm at its marks, is the refused placement. Defended standing releases belong to the wrestling comparison and the mat handback. The bounded samples do not establish swept clearance.
 * @evidence contracts/development/testing.md#execution-ownership Uses only in-memory SDK inputs and pose/skin queries. No production host or native capture is invoked.
 */
export function test_motion_stage_fight_staged_mat_comparison(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const paths: IPath[] = [];
  const reference: IAutoMovieMotionHumanBody = motionHumanBody("m-average");

  for (const { scene, cast, range, expected } of TAKES) {
    const label: string = `${cast}/${scene.kind}/${scene.outcome}`;
    const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
    const scale: number = body.measure.stature / reference.measure.stature;
    try {
      const film: HumanPerformance = staged(body, scale, range, scene);
      assertTakeClean(`mat ${scene.kind} ${range} ${scale}`, film);
      const a: IAutoMovieMotionHumanSegment = film.segments("a").at(-1)!;
      const b: IAutoMovieMotionHumanSegment = film.segments("b").at(-1)!;
      const receiver: IAutoMovieMotionHumanSignature.IReader =
        HumanSignature.of(film, "b", body, RECEIVER_YAW);
      const actor: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        ACTOR_YAW,
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
      const grips: readonly IAutoMovieMotionHumanContactWindow[] =
        a.plan.contacts.filter(
          (contact): boolean =>
            contact.kind === "grip" && contact.support.kind === "person",
        );
      complaints.check(
        `${label} grips collar and sleeve over a window closing at the release`,
        grips.length === 2 &&
          grips.every(
            (grip): boolean =>
              grip.from < grip.to &&
              release !== undefined &&
              nclose(grip.to, release),
          ),
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
        HumanColliders.prepareMinima(body, [
          new Set<AutoMovieHumanoidBone>(["hips", "spine", "chest"]),
        ])(HumanSignature.bones(receiver, b.end))[0]!,
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
        grounded && !upright && floorGap <= SKIN,
      );

      if (cast === "m-average") {
        const opening: IAutoMovieVector3 = HumanSignature.joint(
          receiver,
          samples[0]!,
          "hips",
        );
        paths.push({
          label,
          hips: samples
            .slice(1, 5)
            .map(
              (seconds: number): IAutoMovieVector3 =>
                Vector3.subtract(
                  HumanSignature.joint(receiver, seconds, "hips"),
                  opening,
                ),
            ),
        });
      }
    } catch (error) {
      if (
        expected !== "refused" ||
        !(error instanceof HumanRefusal) ||
        error.axis !== "partner"
      )
        complaints.list.push(`${label}: ${String(error)}`);
    }
  }

  complaints.check(
    `four completed forms were compared, ${paths.length} played`,
    paths.length === 4,
  );
  for (let i: number = 0; i < paths.length; ++i)
    for (let j: number = i + 1; j < paths.length; ++j) {
      const difference: number = Math.max(
        ...paths[i]!.hips.map((point: IAutoMovieVector3, k: number): number =>
          Vector3.distance(point, paths[j]!.hips[k]!),
        ),
      );
      complaints.check(
        `${paths[i]!.label} and ${paths[j]!.label} receiver paths differ by ${difference} m`,
        difference > APART,
      );
    }
  complaints.assert("Staged judo entries and authored recovery");
}

/** Use the registered production law on the form's marks, scaled by stature. */
function staged(
  body: IAutoMovieMotionHumanBody,
  scale: number,
  range: Range,
  scene: IAutoMovieMotionHumanGrapple.IScene,
): HumanPerformance {
  return new HumanPerformance({
    seed: "matched-stage-mat",
    laws: [AutoMovieMotionHumanGrapple.grapple],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: -0.27 * scale },
        yaw: ACTOR_YAW,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: Vector3.scale(RECEIVER_MARKS[range], scale),
        yaw: RECEIVER_YAW,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.mutual(
      AutoMovieMotionHumanCarryPerson.HumanCoupled.grappling,
      {
        initiator: HumanChain.subject("a").stand({ hold: 0.3, sway: 0 }),
        receiver: HumanChain.subject("b").stand({ hold: 0.3, sway: 0 }),
      },
      scene,
    ).node,
  });
}
