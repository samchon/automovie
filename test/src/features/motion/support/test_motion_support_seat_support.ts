import { createSeat } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanMutual,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";

import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { motionHumanRiseSignature } from "../../internal/motionHumanRiseSignature";
import { motionHumanSignature as M } from "../../internal/motionHumanSignature";
import { motionPostureBranches } from "../../internal/motionPostureBranches";

const { HumanSeatedReach } = AutoMovieMotionHumanTouch;

/**
 * The three sitting modes retain the geometry of a chair at the body's own
 * popliteal height, on two stature extremes. Default seating, the backrest and
 * the slump retain contacts through the full audited path. The shift and rise
 * start seated at that same support.
 *
 * Bounds and sources:
 *
 * - Seated: on a seat at popliteal height the thighs lie about level and the
 *   shanks stand about upright, the hip and the knee near a right angle
 *   (ANSI/HFES 100-2007, the seated reference posture). Bound: hip and knee
 *   flexion in [70, 110] degrees from `seated` to the end (provisional limits
 *   about the right angle).
 * - Back: sitting upright holds the trunk near vertical; leaning back reclines
 *   it. Bound: upright in [-10, 10] degrees, lean at least 5 degrees behind the
 *   upright row (provisional). Slumping tilts the pelvis back and rounds the
 *   spine, which carries the head forward of the shoulders (Caneiro et al.
 *   2010, Man Ther 15:54); the hip-to-shoulder line need not tip forward.
 *   Bound: the head joint at least 10 mm farther ahead of the shoulder joints
 *   than in the upright row (provisional).
 * - Descent: sitting down inclines the trunk forward to keep the centre of mass
 *   over the feet before the seat takes the weight, by about 30 to 45 degrees
 *   (Kralj, Jaeger and Munih 1990, J Biomech 23:1123). Bound: peak inclination
 *   before `seatContact` in [15, 60] degrees (provisional limits).
 * - Feet: both feet stay on the floor throughout.
 * - Rise: the trunk flexes before seat-off and stands aligned on both feet, as
 *   measured in motionHumanRiseSignature.
 *
 * The trunk is read as the line from the hip joints' midpoint to the shoulder
 * joints' midpoint, the trunk segment of the cited studies, and the quiet
 * stance must read within 3 degrees of vertical under it (Kendall et al. 2005,
 * ideal alignment; `motionHumanSignature.calibrate`).
 *
 * Scenarios: A high stool supports a drink within 10 mm. Raising it raises the
 * sitter equally. Repeating the seed reproduces the entry, and infeasible seat
 * requests describe a feasible alternative.
 *
 * 1. Observe the supplied action through the phases identified above.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real sit law on real bodies and reads displayed joints and soles; a perched or sunk sit, an upright back that leans, a descent with an upright trunk or a lifted foot fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The seated posture is the standard's, the descent Kralj et al.'s, every limit marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The large rig tests the rearward lean against its upright reference; the small rig tests the forward head displacement of the slump against its own upright reference.
 * @evidence contracts/development/testing.md#execution-ownership Four distinct scenes carry the lean, slump, shift and rise. The upright poses are measured on the exact sit prefixes of the latter two, and those prefixes also supply both quiet entries.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_motion_support_seat_support(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  checkHighSeat(complaints.list);
  checkSeatedHandshake(complaints);
  const audited: Map<string, M.IStaged> = new Map();
  complaints.list.push(
    ...motionPostureBranches(AUDITED, (film, [law, row, name]): void => {
      const staged: M.IStaged = { film, body: motionHumanBody(name), yaw: 0 };
      // A shift and a rise each start with the same upright sit. Its complete
      // seated segment provides the matched reference on that very rig.
      const back: string = law === "sit" ? row : "back=upright";
      audited.set(`${back} ${name}`, staged);
      if (law === "rise") motionHumanRiseSignature(staged, name, complaints);
    }),
  );

  for (const name of BODIES) {
    const back: Record<string, number> = {};
    const forward: Record<string, number> = {};
    const variant: string = name === "m-large" ? "back=lean" : "back=slump";
    for (const row of ["back=upright", variant]) {
      const cell: string = `sit ${row} ${name}`;
      const s: M.IStaged | undefined = audited.get(`${row} ${name}`);
      if (s === undefined) continue; // The full audit reports a failed admission.
      const end: number = s.film.performance.segments("a")[0]!.end;
      if (row === "back=upright") {
        const stance: number = M.trunk(s, 0);
        complaints.check(
          `${cell}: quiet entry inclination ${stance}°, at most ${M.STANCE}°`,
          Math.abs(stance) <= M.STANCE,
        );
      }
      const contact: number = M.event(s, "seatContact")!;
      const seated: number = M.event(s, "seated")!;
      const ts: number[] = M.times(seated, end, M.HELD);
      const heading: IAutoMovieVector3 = M.forward(s.yaw);
      let trunkSum: number = 0;
      let headSum: number = 0;
      for (const t of ts) {
        const bones: ReturnType<typeof M.bones> = M.bones(s, t);
        const neck: IAutoMovieVector3 = bones.get("neck")!.worldPosition;
        for (const side of ["left", "right"] as const) {
          const thigh: IAutoMovieVector3 = bones.get(
            `${side}UpperLeg`,
          )!.worldPosition;
          const shin: IAutoMovieVector3 = bones.get(
            `${side}LowerLeg`,
          )!.worldPosition;
          const foot: IAutoMovieVector3 = bones.get(
            `${side}Foot`,
          )!.worldPosition;
          const hip: number = M.flexion(neck, thigh, shin);
          const knee: number = M.flexion(thigh, shin, foot);
          complaints.check(
            `${cell}: seated ${side} hip ${hip.toFixed(1)} and knee ${knee.toFixed(1)} deg at ${t.toFixed(3)} s, [70, 110] expected (ANSI/HFES 100-2007; provisional)`,
            hip >= 70 && hip <= 110 && knee >= 70 && knee <= 110,
          );
        }
        trunkSum += M.trunk(s, t);
        const head: IAutoMovieVector3 = bones.get("head")!.worldPosition;
        const left: IAutoMovieVector3 =
          bones.get("leftUpperArm")!.worldPosition;
        const right: IAutoMovieVector3 =
          bones.get("rightUpperArm")!.worldPosition;
        headSum +=
          (head.x - (left.x + right.x) / 2) * heading.x +
          (head.z - (left.z + right.z) / 2) * heading.z;
      }
      back[row] = trunkSum / ts.length;
      forward[row] = headSum / ts.length;
      let peak: number = -Infinity;
      let lifted: number = 0;
      for (const t of M.times(0, end, M.HELD)) {
        if (t <= contact) peak = Math.max(peak, M.trunk(s, t));
        if (!M.bears(s, t, "left") || !M.bears(s, t, "right")) lifted++;
      }
      complaints.check(
        `${cell}: peak trunk inclination ${peak.toFixed(1)} deg before seat contact, [15, 60] expected (Kralj et al. 1990; provisional)`,
        peak >= 15 && peak <= 60,
      );
      complaints.check(
        `${cell}: a foot is off the floor at ${lifted} instants of ${M.HELD} a second`,
        lifted === 0,
      );
    }
    const upright: number | undefined = back["back=upright"];
    const leaned: number | undefined = back["back=lean"];
    const head: number | undefined = forward["back=upright"];
    const slumped: number | undefined = forward["back=slump"];
    if (upright !== undefined) {
      complaints.check(
        `sit ${name}: upright back ${upright.toFixed(1)} deg, [-10, 10] expected (provisional)`,
        upright >= -10 && upright <= 10,
      );
      if (leaned !== undefined)
        complaints.check(
          `sit ${name}: lean ${leaned.toFixed(1)} deg, at least 5 behind upright ${upright.toFixed(1)} expected (provisional)`,
          leaned <= upright - 5,
        );
    }
    if (head !== undefined && slumped !== undefined)
      complaints.check(
        `sit ${name}: slumped, the head stands ${(slumped * 1000).toFixed(0)} mm ahead of the shoulders against ${(head * 1000).toFixed(0)} upright, at least 10 mm more expected (Caneiro et al. 2010; provisional)`,
        slumped >= head + 0.01,
      );
  }
  complaints.assert(
    "Sitting and rising keep their prescribed geometry and supports",
  );
}

/** The existing full-interval checks of the distinct seat and exit branches. */
const AUDITED: readonly motionPostureBranches.Branch[] = [
  ["sit", "back=lean", "m-large"],
  ["sit", "back=slump", "f-small"],
  ["shift", "default", "m-large"],
  ["rise", "default", "f-small"],
];

/**
 * The chair scales with the body, so the two stature limits bracket this
 * geometry.
 */
const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];

function checkHighSeat(complaints: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stool = createSeat({ kind: "barStool" });
  const seatAt = (height: number): IAutoMovieMotionHumanSeated.ISeat =>
    HumanObject.seat(stool, { at: { x: 0, y: height, z: -0.6 }, yaw: 0 });
  const drink = (
    chain: IAutoMovieMotionHumanChain,
  ): IAutoMovieMotionHumanChain => chain.handToFace({ kind: "drink" });
  const perform = (
    seat: IAutoMovieMotionHumanSeated.ISeat,
    then: typeof drink = drink,
    ahead: number = 0.2,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "high-seat",
      performers: [
        {
          subject: "a",
          body,
          yaw: seat.yaw,
          proficiency: { level: "trained" },
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            { x: 0, y: 0, z: ahead },
          ),
        },
      ],
      composition: then(HumanChain.subject("a").sit({ seat, hold: 0.5 })).node,
    });
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const low = perform(seatAt(0));
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    low,
    "a",
    body,
    0,
  );
  const segment = low.segments("a")[1]!;
  const start = HumanSignature.region(reader, "seat", segment.entryTime);
  if (
    !segment.plan.contacts.some(
      (c) => c.part === "seat" && c.from <= 1e-9 && c.to >= 1 - 1e-9,
    )
  )
    complaints.push("The drink does not declare its full seat support.");
  for (const t of HumanSignature.times(segment.entryTime, segment.end, 4))
    if (distance(start, HumanSignature.region(reader, "seat", t)) > 0.01)
      complaints.push(`High-seat support moved more than 10 mm at ${t} s.`);
  const lift: number = 0.1;
  const raised = perform(seatAt(lift), (chain) => chain);
  const height = HumanSignature.region(
    HumanSignature(raised, "a", body, 0),
    "seat",
    raised.segments("a")[0]!.end,
  ).y;
  const end = low.segments("a")[0]!.end;
  if (
    Math.abs(height - HumanSignature.region(reader, "seat", end).y - lift) >
    0.01
  )
    complaints.push(
      "The seated body did not follow the stool's 100 mm rise within 10 mm.",
    );
  const repeat = perform(seatAt(0));
  const repeated = HumanSignature(repeat, "a", body, 0);
  for (const share of [0, 0.25, 0.5, 0.75, 1]) {
    const t = share * end;
    if (
      distance(low.posture("a", t).root, repeat.posture("a", t).root) > 1e-9 ||
      distance(
        HumanSignature.joint(reader, t, "rightFoot"),
        HumanSignature.joint(repeated, t, "rightFoot"),
      ) > 1e-9
    )
      complaints.push(`Same-seed sitting differs at ${t} s.`);
  }
  const refused = (
    run: () => IAutoMovieMotionHumanPerformance,
    kind: string,
    axis: string,
  ): void => {
    try {
      run().segments("a");
    } catch (error) {
      if (
        error instanceof HumanRefusal &&
        error.kind === kind &&
        error.axis === axis &&
        error.feasible !== undefined &&
        error.feasible !== null &&
        (kind !== "base" ||
          (error.feasible.kind === "alternatives" &&
            error.feasible.values.includes("rise")))
      )
        return;
      complaints.push(`Unexpected ${axis} refusal: ${String(error)}`);
      return;
    }
    complaints.push(`Expected a ${kind} refusal on ${axis}.`);
  };
  refused(() => perform(seatAt(0), (chain) => chain, 1.5), "reach", "seat");
  refused(
    () => perform({ at: { x: 0, y: 0.1, z: -0.6 }, yaw: 0 }, (chain) => chain),
    "reach",
    "seat",
  );
  refused(
    () => perform(seatAt(0), (chain) => chain.shift({ by: 0.1 })),
    "base",
    "base",
  );
}

type SeatedActor = "a" | "b";
function checkSeatedHandshake(all: motionComplaints.IGatherer): void {
  const APART: number = 0.7;
  const SEAT: number = 0.01;
  const RANGE: number = 120;
  const bodies: Record<SeatedActor, IAutoMovieMotionHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const sit = (who: SeatedActor): IAutoMovieMotionHumanChain => {
    const body: IAutoMovieMotionHumanBody = bodies[who];
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: AutoMovieMotionHumanSeat.seated.popliteal(body),
        z:
          who === "a"
            ? body.rest.get("leftFoot")!.z - 0.1
            : APART - body.rest.get("leftFoot")!.z + 0.1,
      },
      yaw: who === "a" ? 0 : 180,
      depth: 0.45,
    };
    return HumanChain.subject(who).sit({ seat });
  };
  try {
    const p = new HumanPerformance({
      seed: "seated-reach",
      performers: (["a", "b"] as const).map((subject: SeatedActor) => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : APART },
        yaw: subject === "a" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(HumanMutual.handshake, {
        one: sit("a"),
        other: sit("b"),
      }).node,
    });
    for (const who of ["a", "b"] as const) {
      const segments: readonly IAutoMovieMotionHumanSegment[] = p.segments(who);
      const last: IAutoMovieMotionHumanSegment = segments[0]!;
      const seats: IAutoMovieMotionHumanContactWindow[] =
        last.plan.contacts.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean => w.kind === "seat",
        );
      all.check(
        `${who}: the sit's seat windows are ${seats.map((w) => `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ") || "none"}, one open at its end expected`,
        seats.some(
          (w: IAutoMovieMotionHumanContactWindow): boolean => w.to === 1,
        ),
      );
      const end: number = last.start + last.plan.duration;
      const rooms: IAutoMovieMotionHumanSeatedReach.IJoint[] =
        HumanSeatedReach.rooms({
          body: bodies[who],
          posture: last.plan.posture(last.plan.duration),
          bones: p.bones(who, end),
          seated: true,
        });
      const hips: number =
        rooms.find(
          (j: IAutoMovieMotionHumanSeatedReach.IJoint): boolean =>
            j.bone === "hips",
        )?.room ?? 0;
      all.check(
        `${who}: seated, the hips have ${hips.toFixed(1)} degrees of room, more than none and at most ${RANGE} expected (joints ${rooms.map((j) => `${j.bone} ${j.room.toFixed(1)}`).join(", ")})`,
        hips > 0 && hips <= RANGE,
      );
      const standing: IAutoMovieMotionHumanSeatedReach.IJoint[] =
        HumanSeatedReach.rooms({
          body: bodies[who],
          posture: segments[0]!.plan.posture(0),
          bones: p.bones(who, 0),
          seated: false,
        });
      all.check(
        `${who}: standing, the trunk has ${standing.length} joints with room, none expected`,
        standing.length === 0,
      );
    }

    const shake: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
    const clasp: number =
      shake.start +
      shake.plan.events.find(
        (e: { name: string }): boolean => e.name === "clasp",
      )!.share *
        shake.plan.duration;
    const hands: number = (bodies.a.measure.hand + bodies.b.measure.hand) / 2;
    const wrists: number = Vector3.length(
      Vector3.subtract(
        p.bones("a", clasp).get("rightHand")!.worldPosition,
        p.bones("b", clasp).get("rightHand")!.worldPosition,
      ),
    );
    all.check(
      `seated handshake: at the clasp the wrists are ${(wrists * 1000).toFixed(0)} mm apart, ${(hands * 1000).toFixed(0)} mm at most expected`,
      wrists <= hands,
    );
    for (const who of ["a", "b"] as const) {
      const segment: IAutoMovieMotionHumanSegment = p.segments(who)[1]!;
      const settled: IAutoMovieVector3 = p
        .bones(who, segment.entryTime)
        .get("hips")!.worldPosition;
      let moved: number = 0;
      for (let t: number = segment.entryTime; t <= segment.end; t += 1 / 24)
        moved = Math.max(
          moved,
          Vector3.length(
            Vector3.subtract(
              p.bones(who, t).get("hips")!.worldPosition,
              settled,
            ),
          ),
        );
      all.check(
        `seated handshake: ${who}'s pelvis moves up to ${(moved * 1000).toFixed(1)} mm, ${SEAT * 1000} mm at most expected`,
        moved <= SEAT,
      );
    }
  } catch (error) {
    all.list.push(String(error));
  }
}
