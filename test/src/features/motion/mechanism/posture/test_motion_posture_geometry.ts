import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  HumanVerdicts,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditDifference,
  HUMAN_LEXICON,
  HumanFoot,
  HumanFrame,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { motionHumanLaw } from "../../../internal/motionHumanLaw";

/**
 * A body that sits or lies down on the floor ends on the floor: lying, the
 * trunk and the head are down; sitting, the hips are down and the head is up,
 * and folded legs lie on the floor.
 *
 * Scenarios: Full and partial crouch, two flinch intensities, recovering
 * balance, quiet hand placement and a self-directed gesture preserve their
 * declared foot plants. each row performed after 0.3 s of standing and read at
 * its end, on the average man or the small woman, alternating down the rows.
 * One body a row is enough because both builds meet a sitting and the claims
 * scale with the stature; the end is the instant each claim is about:
 *
 * 1. `lieStill` ends with the hip joints, the neck and the head all within 0.15
 *    statures of the floor (a lying trunk is one body depth thick; the share is
 *    provisional).
 * 2. `sitOnFloor`, `sitCrossLegged` and `sitSideways` end with the hip joints
 *    within that share of the floor and the head above 0.35 statures: seated,
 *    not lying (an adult's sitting height is about half the stature; the share
 *    is a provisional floor).
 * 3. `sitCrossLegged` and `sitSideways` end with both knees flexed 120 to 155
 *    degrees (Hemmerich et al. 2006 measure 130 to 150 in cross-legged sitting;
 *    the 10 and 5 beyond are a provisional reading margin) and both ankle
 *    joints within 0.06 statures of the floor.
 * 4. Cross-legged, the left ankle lies to the right of the right one.
 * 5. Side-sitting, the left wrist is within a quarter of the hand's length plus 15
 *    mm of the floor: the hand leant on (a flat hand holds its wrist about its
 *    own thickness up; the quarter is provisional and the 15 mm is the
 *    campaign's bound for a contact at its event).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the floor rows through the public input, performs each on a real body and reads the displayed hips, head, knees, ankles and wrist; a body left squatting on its feet, legs that stay ahead, or a hand in the air fails.
 * @evidence contracts/development/testing.md#independent-expectations Where each row ends is what its name states; the stature shares are provisional readings of "on the floor", stated as such, and the knee range is the cited measurement. None is taken from the law's tables.
 * @evidence contracts/development/testing.md#distinguishing-cases Lying against three sittings, legs ahead against folded, crossed against folded aside, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory, reading two instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds and which are provisional.
 */
export function test_motion_posture_geometry(): void {
  const complaints: string[] = [];
  checkStandingSupports(complaints);
  checkSideReflection(complaints);
  checkSupportTransfer(complaints);
  checkCrossedSeat(complaints);
  const rows: readonly string[] = [
    "lieStill",
    "sitOnFloor",
    "sitCrossLegged",
    "sitSideways",
  ];
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  rows.forEach((row: string, r: number): void => {
    const name: motionHumanBody.Name = names[r % 2]!;
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const label: string = `${name} ${row}`;
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "poses",
        laws: [...HUMAN_LEXICON.pose!],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3 })
          .registered(row).node,
      });
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    const segment: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      performance,
      "a",
      body,
      0,
    );
    const end: number = segment.end;
    const y = (bone: Parameters<typeof HumanSignature.joint>[2]): number =>
      HumanSignature.joint(reader, end, bone).y;
    const hips: number = (y("leftUpperLeg") + y("rightUpperLeg")) / 2;

    // 1. Lying on the floor.
    if (row === "lieStill") {
      const heights: readonly (readonly [string, number])[] = [
        ["hips", hips],
        ["neck", y("neck")],
        ["head", y("head")],
      ];
      for (const [part, height] of heights)
        if (height > 0.15 * stature)
          complaints.push(
            `${label}: the ${part} ends ${height.toFixed(3)} m above the floor, within ${(0.15 * stature).toFixed(3)} m expected`,
          );
      return;
    }

    // 2. Seated on the floor: the hips down, the head up.
    if (hips > 0.15 * stature || y("head") < 0.35 * stature)
      complaints.push(
        `${label}: the hips end ${hips.toFixed(3)} m and the head ${y("head").toFixed(3)} m above the floor; the hips within ${(0.15 * stature).toFixed(3)} m and the head above ${(0.35 * stature).toFixed(3)} m expected`,
      );
    if (row === "sitOnFloor") return;

    // 3. Folded legs lie on the floor.
    for (const side of ["left", "right"] as const) {
      const knee: number = HumanSignature.knee(reader, end, side);
      const ankle: number = y(`${side}Foot`);
      if (knee < 120 || knee > 155 || ankle > 0.06 * stature)
        complaints.push(
          `${label}: the ${side} knee ends flexed ${knee.toFixed(1)} degrees with its ankle ${ankle.toFixed(3)} m above the floor; 120 to 155 degrees and within ${(0.06 * stature).toFixed(3)} m expected`,
        );
    }

    // 4. Crossed.
    const across: number =
      HumanSignature.joint(reader, end, "leftFoot").x -
      HumanSignature.joint(reader, end, "rightFoot").x;
    if (row === "sitCrossLegged" && across >= 0)
      complaints.push(
        `${label}: the left ankle ends ${across.toFixed(3)} m to the left of the right one, to its right expected: the legs are not crossed`,
      );

    // 5. Leant on the hand.
    const wrist: number = y("leftHand");
    if (row === "sitSideways" && wrist > 0.25 * body.measure.hand + 0.015)
      complaints.push(
        `${label}: the left wrist ends ${wrist.toFixed(3)} m above the floor, within ${(0.25 * body.measure.hand + 0.015).toFixed(3)} m expected for a hand it leans on`,
      );
  });
  TestValidator.equals("floor poses end on the floor", complaints, []);
}

/** Check the planted socket throughout each support window of the base action. */
function checkStandingSupports(findings: string[]): void {
  const body = motionHumanBody("m-average");
  const actor = HumanChain.subject("a");
  const take = (action: IAutoMovieMotionHumanChain) =>
    new HumanPerformance({
      seed: "poses",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: action.node,
    });
  const lifts: number[] = [];
  for (const [kind, action] of [
    ["deep crouch", actor.crouch({ depth: "full", heels: "up", hold: 3 })],
    ["partial crouch", actor.crouch({ hold: 2 })],
    ["full flinch", actor.flinch({ intensity: 1 })],
    ["light flinch", actor.flinch({ intensity: 0.4 })],
    ["brace", actor.brace({ kind: "impact" })],
    ["stagger", actor.stagger({ speed: 0.5 })],
    ["rest", actor.rest({ left: "hip", right: "hip" })],
    ["self action", actor.selfAction({ kind: "victory" })],
  ] as const) {
    try {
      const p = take(action),
        segment = p.segments("a")[0]!,
        reader = HumanSignature(p, "a", body, 0);
      const end = segment.end,
        middle = (segment.entryTime + end) / 2;
      const stance = kind === "rest" || kind === "self action";
      for (const side of ["left", "right"] as const) {
        if (kind !== "deep crouch" && !HumanSignature.bears(reader, end, side))
          findings.push(kind + " finishes without " + side + " foot support");
        if (
          stance &&
          !segment.plan.contacts.some(
            (c) =>
              c.kind === "plant" &&
              c.part === side + "Foot" &&
              c.from <= 1e-9 &&
              c.to >= 1 - 1e-9,
          )
        )
          findings.push(kind + " lacks continuous " + side + " plant");
        if (kind === "deep crouch" || kind === "partial crouch") {
          const expected = kind === "deep crouch" ? 150 : 100;
          if (
            Math.abs(HumanSignature.knee(reader, middle, side) - expected) > 10
          )
            findings.push(
              kind + " knee angle differs from " + expected + " degrees",
            );
        }
        for (const c of segment.plan.contacts.filter(
          (c) => c.kind === "plant" && c.part === side + "Foot",
        )) {
          const from = Math.max(
              segment.entryTime,
              segment.start + c.from * segment.plan.duration,
            ),
            to = Math.min(end, segment.start + c.to * segment.plan.duration);
          if (to - from < 0.1) continue;
          const socket = (t: number) => {
            const points = HumanFoot.sockets(
              body,
              HumanSignature.bones(reader, t),
              side,
            );
            return kind === "brace" || kind === "stagger"
              ? points.reduce((a, b) => (a.point.y < b.point.y ? a : b))
              : points.find(
                  (s) => s.socket === (kind === "deep crouch" ? "toe" : "ball"),
                )!;
          };
          let origin = socket(from + 0.02);
          for (const t of HumanSignature.times(
            from + 0.02,
            to - 0.02,
            3 / (to - from - 0.04),
          )) {
            const at = socket(t);
            if (at.socket !== origin.socket) {
              origin = at;
              continue;
            }
            if (
              Math.hypot(
                at.point.x - origin.point.x,
                at.point.y - origin.point.y,
                at.point.z - origin.point.z,
              ) > 0.005
            )
              findings.push(kind + " " + side + " slips at " + t);
          }
        }
      }
      if (stance || kind === "partial crouch") {
        const height = (t: number) =>
          (HumanSignature.joint(reader, t, "leftUpperLeg").y +
            HumanSignature.joint(reader, t, "rightUpperLeg").y) /
          2;
        if (Math.abs(height(end) - height(0)) > 0.02)
          findings.push(kind + " standing hips differ by more than 20 mm");
      }
      if (kind.endsWith("flinch")) {
        const wrist = (t: number) =>
          Math.max(
            HumanSignature.joint(reader, t, "leftHand").y,
            HumanSignature.joint(reader, t, "rightHand").y,
          );
        lifts.push(
          Math.max(
            ...HumanSignature.times(
              segment.entryTime,
              end,
              4 / (end - segment.entryTime),
            ).map(wrist),
          ) - wrist(0),
        );
      }
    } catch (error) {
      findings.push(kind + ": " + String(error));
    }
  }
  if (lifts.length !== 2 || !(lifts[0]! > lifts[1]!))
    findings.push(
      "Full flinch must lift the wrists further than a light flinch.",
    );
}

function checkCrossedSeat(findings: string[]): void {
  const body = motionHumanBody("m-average");
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: AutoMovieMotionHumanSeat.seated.popliteal(body), z: -0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const perform = (seconds: number) =>
    new HumanPerformance({
      seed: "crossed",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .sit({ seat: chair, legs: "crossed", hold: seconds })
        .rise().node,
    });
  try {
    perform(0.2).segments("a");
    findings.push("The crossed sit accepted 200 ms.");
  } catch (error) {
    if (
      !(
        error instanceof HumanRefusal &&
        error.kind === "parameter" &&
        error.axis === "hold"
      )
    )
      findings.push(String(error));
  }
  const p = perform(1.5),
    [sit, rise] = p.segments("a");
  const reader = HumanSignature(p, "a", body, 0),
    settled = sit!.end - 0.05;
  const frame = { origin: { ...chair.at, y: 0 }, yaw: chair.yaw };
  const left = HumanFrame.local(
    frame,
    HumanSignature.joint(reader, settled, "leftFoot"),
  );
  const right = HumanFrame.local(
    frame,
    HumanSignature.joint(reader, settled, "rightFoot"),
  );
  if (!(left.x < right.x && left.z > right.z))
    findings.push("Crossed ankles do not cross on the chair frame.");
  for (const side of ["left", "right"] as const)
    if (
      !HumanSignature.bears(reader, settled, side) ||
      !HumanSignature.bears(reader, rise!.end, side)
    )
      findings.push(side + " sole lacks support after crossing or rising.");
}

function checkSupportTransfer(findings: string[]): void {
  const body = motionHumanBody("f-small"),
    actor = HumanChain.subject("a");
  const perform = (chain: IAutoMovieMotionHumanChain) =>
    new HumanPerformance({
      seed: "sweep-1",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const feet = [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ] as const;
  const p = perform(
    actor.support({
      stances: [
        { contacts: [...feet] },
        {
          contacts: [
            ...feet,
            { part: "leftHand", kind: "bear" },
            { part: "rightHand", kind: "bear" },
          ],
        },
        { contacts: [...feet] },
      ],
    }),
  );
  const windows = p.segments("a")[0]!.plan.contacts;
  const palms = windows.filter(
    (w) => w.part === "leftHand" || w.part === "rightHand",
  );
  if (
    palms.length !== 2 ||
    palms[0]!.part === palms[1]!.part ||
    !palms.every((w) => w.from > 0 && w.to < 1) ||
    Math.max(...palms.map((w) => w.from)) >= Math.min(...palms.map((w) => w.to))
  )
    findings.push("The two palms must share an interior contact interval.");
  for (const side of ["left", "right"] as const) {
    const foot = windows.filter((w) => w.part === side + "Foot");
    if (foot.length !== 1 || foot[0]!.from !== 0 || foot[0]!.to !== 1)
      findings.push(side + " foot loses support during palm transfer");
  }
  for (const kind of ["impact", "push", "catchBody"] as const) {
    const brace = perform(
      actor.brace({
        kind,
        target: { kind: "point", at: { x: 0, y: 1.2, z: 2 }, frame: "world" },
      }),
    );
    const verdict = HumanVerdicts(brace);
    if (!verdict.clean)
      findings.push(kind + ": " + HumanVerdicts.describe(verdict));
  }
}

function checkSideReflection(findings: string[]): void {
  const body = motionHumanBody("m-average"),
    actor = HumanChain.subject("a");
  const actions = (side: AutoMovieHumanSide) => [
    actor.gesture({ kind: "wave", hand: side }),
    actor.kneel({ knee: side, hold: 0.5 }),
    actor.bend({
      hand: side,
      target: {
        kind: "point",
        frame: "world",
        at: {
          x: side === "left" ? 0.15 : -0.15,
          y: body.measure.ankleHeight + 0.6 * body.measure.shank,
          z: 0.45,
        },
      },
    }),
  ];
  const right = actions("right");
  for (const [i, left] of actions("left").entries()) {
    const film = (node: IAutoMovieMotionHumanChain) =>
      motionHumanLaw.perform("sweep-1", [{ subject: "a", body }], node);
    const result = AutoMovieMotionHumanAuditDifference.measure(
      film(left),
      film(right[i]!),
      "a",
      { mirror: 0, rate: 4 },
    ).distance;
    if (!(result.value <= 0.01))
      findings.push(
        "Reflected posture exceeds 10 mm at " +
          result.seconds +
          ": " +
          result.value,
      );
  }
}
