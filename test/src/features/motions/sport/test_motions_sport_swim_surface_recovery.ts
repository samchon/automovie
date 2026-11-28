import { AutoMovieArchetypePoolEdge } from "@automovie/archetypes";
import {
  AutoMovieEngineKinematics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
  AutoMovieMotionHumanSwim,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { FamilyCaseKit } from "../../../../../packages/motions/src/executable/cases/FamilyCaseKit";
import { HumanFoot } from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";

const SUBJECT = "swimmer";
const WATER = 0.8;
const STEP = 1 / 240;

/**
 * A surface swimmer alternates pulls on straight and turning courses, can
 * falter and breathe before floating, treading or exiting at a named ledge. It
 * can also be staged in separately authored terminal distress.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases name the authored courses and recovery choices, and identify the terminal outcome kept as a separate control.
 * @evidence contracts/development/testing.md#behavioral-verification Composes both stored bodies through the public chain and performance and reads actual hips, chest, palms, feet and mouth from the prepared film at samples and played cue instants. A fixed pool edge presents both palm and sole contacts. Invalid course and edge parameters report their refusal axes.
 * @evidence contracts/development/testing.md#independent-expectations A 1.20 m two-cycle course at zero yaw ends on +Z. A 90-degree arc of the same length ends approximately 0.764 m down each horizontal axis. The film waterline and anatomy markers distinguish alternating underwater limbs, breathing and terminal submersion. A deck top 0.20 m above the water and 0.12 m behind the lip locates both placed palms; 0.60 m of freeboard exceeds the unaided exit range.
 */
export function test_motions_sport_swim_surface_recovery(): void {
  for (const profile of ["m-average", "f-average"] as const) {
    const { body } = FamilyCaseKit.body(profile);
    const straight = stage(
      body,
      chain().swim({ kind: "dogPaddle", count: 2, water: WATER }, "paddle"),
    );
    const curved = stage(
      body,
      chain().swim(
        { kind: "dogPaddle", count: 2, water: WATER, turn: 90 },
        "paddle",
      ),
    );
    course(straight, body, 0, 1.2);
    course(curved, body, 0.764, 0.764);

    const reachRight = read(
      straight,
      body,
      straight.instant({ of: "paddle", event: "reachRight2" }),
    );
    const reachLeft = read(
      straight,
      body,
      straight.instant({ of: "paddle", event: "reachLeft2" }),
    );
    TestValidator.predicate(
      "opposite palms advance at successive reaches",
      () =>
        reachRight.right.z - reachRight.left.z > 0.08 &&
        reachLeft.left.z - reachLeft.right.z > 0.08,
    );
    TestValidator.predicate(
      "feet exchange vertical ordering over a half cycle",
      () =>
        reachRight.rightFoot.y - reachRight.leftFoot.y > 0.02 &&
        reachLeft.leftFoot.y - reachLeft.rightFoot.y > 0.02,
    );

    for (const kind of ["float", "treadWater"] as const) {
      const film = stage(
        body,
        chain()
          .swim({ kind: "dogPaddle", count: 1, water: WATER }, "paddle")
          .swim({ kind: "falter", water: WATER }, "slip")
          .swim({ kind, count: 1, water: WATER }, "recovery"),
      );
      const slip = film.instant({ of: "slip", event: "falter" });
      const dip = film.instant({ of: "slip", event: "dip" });
      const breath = film.instant({ of: "slip", event: "breath" });
      const cut = film.segments(SUBJECT)[2]!.start;
      TestValidator.predicate(
        "falter, dip and breath precede the chosen recovery",
        () =>
          slip < dip &&
          dip < breath &&
          breath < cut &&
          -read(film, body, dip).air > 0.015 &&
          read(film, body, breath).air > 0.015,
      );
      seam(film, body, cut);
      const settled = read(film, body, film.duration - STEP);
      TestValidator.predicate(
        kind + " reaches its own body trim and breathing line",
        () =>
          settled.air >= 0.018 &&
          (kind === "float"
            ? Math.abs(settled.trunk.y) < 0.12
            : settled.trunk.y > 0.25) &&
          (kind === "float"
            ? Math.hypot(settled.trunk.x, settled.trunk.z) > 0.25
            : true),
      );
    }

    const distress = chain().registered(
      "aquatic",
      { kind: "distress", water: WATER, duration: 20 },
      "distress",
    );
    const terminal = stage(body, distress);
    const submerge = terminal.instant({ of: "distress", event: "submerge" });
    const under = terminal.instant({ of: "distress", event: "under" });
    TestValidator.predicate(
      "uncut distress still submerges and supplies no material support",
      () =>
        submerge === 20 &&
        under === 22 &&
        -read(terminal, body, under).air > 0.2 &&
        terminal.segments(SUBJECT)[0]!.plan.contacts.length === 0,
    );
    const cut = stage(
      body,
      distress
        .swim({ kind: "float", water: WATER }, "recover")
        .sync({ of: "distress", offset: 0.2 }),
    );
    TestValidator.equals(
      "the authored distress cut plays",
      cut.segments(SUBJECT)[0]!.end,
      0.2,
    );
    seam(cut, body, 0.2);
    TestValidator.error(
      "the clipped distress has no played submersion cue",
      () => cut.instant({ of: "distress", event: "submerge" }),
    );

    refuses("turn", () =>
      stage(body, chain().swim({ kind: "dogPaddle", turn: 91 })),
    );
    refuses("turn", () =>
      stage(body, chain().swim({ kind: "treadWater", turn: 20 })),
    );
    refuses("count", () =>
      stage(body, chain().swim({ kind: "falter", count: 2 })),
    );
  }
  edgeRecovery(FamilyCaseKit.body("m-average").body);
}

function edgeRecovery(body: IAutoMovieMotionHumanBody): void {
  const perform = (deckHeight: number): AutoMovieMotionHumanPerformance => {
    const edge = AutoMovieMotionHumanObject.prop(
      "pool",
      AutoMovieArchetypePoolEdge.create({ kind: "deckEdge" }),
      { at: { x: 0, y: deckHeight, z: 0 }, yaw: 0, fixed: true },
    );
    return new AutoMovieMotionHumanPerformance({
      seed: "stock-surface-to-deck",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      performers: [
        {
          subject: SUBJECT,
          body,
          at: { x: 0, y: -1.35, z: 0.3 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [edge],
      composition: chain()
        .swim({ kind: "falter", water: 0 }, "falter")
        .swim({ kind: "treadWater", count: 1, water: 0 }, "tread")
        .registered(
          "aquatic",
          { kind: "edgeExit", water: 0, support: "pool" },
          "exit",
        ).node,
    });
  };
  const film = perform(0.2);
  const handsAt = film.instant({ of: "exit", event: "hands" });
  const standingsAt = film.instant({ of: "exit", event: "standing" });
  const lip = film.site("pool", "edge", handsAt).position;
  const hands = film.bones(SUBJECT, handsAt);
  const standing = film.bones(SUBJECT, standingsAt);
  const exit = film.segments(SUBJECT)[2]!;
  TestValidator.predicate(
    "the edge is reached after the falter breath was played",
    handsAt > film.instant({ of: "falter", event: "breath" }),
  );
  for (const side of ["left", "right"] as const) {
    const palm = HumanHand.frame(body, hands, side, "palm").point;
    const foot = standing.get(side === "left" ? "leftFoot" : "rightFoot")!;
    const sole = HumanFoot.sole(body, side, {
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
    });
    TestValidator.predicate(
      side + " palm bears 120 mm behind the actual lip",
      () =>
        Math.abs(palm.y - lip.y) < 0.002 &&
        Math.abs(palm.z - lip.z + 0.12) < 0.002 &&
        Math.abs(palm.x - (side === "left" ? -0.25 : 0.25)) < 0.002 &&
        exit.plan.contacts.some(
          (contact) =>
            contact.part === (side === "left" ? "leftHand" : "rightHand") &&
            contact.kind === "bear" &&
            contact.support?.kind === "prop" &&
            contact.support.subject === "pool" &&
            contact.support.point === "deckFace",
        ),
    );
    TestValidator.predicate(
      side + " sole lands on the finite material deck",
      () =>
        sole.every(
          (point) => Math.abs(point.y - lip.y) < 0.008 && lip.z - point.z > 0.1,
        ) &&
        exit.plan.contacts.some(
          (contact) =>
            contact.part === (side === "left" ? "leftFoot" : "rightFoot") &&
            contact.kind === "plant" &&
            contact.support?.kind === "prop" &&
            contact.support.subject === "pool" &&
            contact.support.point === "deckFace",
        ),
    );
  }
  refuses("support", () => perform(0.6));
}

function chain(): ReturnType<typeof AutoMovieMotionHumanChain.subject> {
  return AutoMovieMotionHumanChain.subject(SUBJECT);
}

function stage(
  body: IAutoMovieMotionHumanBody,
  action: ReturnType<typeof chain>,
): AutoMovieMotionHumanPerformance {
  return new AutoMovieMotionHumanPerformance({
    seed: "stock-surface-recovery",
    performers: [
      {
        subject: SUBJECT,
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanSwim.aquatic],
    composition: action.node,
  });
}

function read(
  film: AutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  seconds: number,
) {
  const bones = film.bones(SUBJECT, seconds);
  const position = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    bones.get(bone)!.worldPosition;
  const mouth = body.surfaces.regions.mouth;
  const hips = position("hips");
  return {
    hips,
    trunk: AutoMovieEngineVector3.subtract(position("chest"), hips),
    air:
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
        mouth,
        bones.get(mouth.bone)!,
      ).y - WATER,
    left: HumanHand.frame(body, bones, "left", "palm").point,
    right: HumanHand.frame(body, bones, "right", "palm").point,
    leftFoot: position("leftFoot"),
    rightFoot: position("rightFoot"),
  };
}

function course(
  film: AutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  x: number,
  z: number,
): void {
  const start = read(film, body, 0);
  const end = read(film, body, film.duration - STEP);
  TestValidator.predicate(
    "the pelvis follows the independently computed endpoint",
    () =>
      Math.abs(end.hips.x - start.hips.x - x) < 0.025 &&
      Math.abs(end.hips.z - start.hips.z - z) < 0.025 &&
      (x === 0 ? end.trunk.z > 0.25 : end.trunk.x > 0.25),
  );
  for (let i = 1; i <= 30; ++i) {
    const frame = read(film, body, (film.duration * i) / 30);
    TestValidator.predicate(
      "the reaching swimmer has shallow trim, submerged palms and a clear mouth",
      () =>
        frame.hips.y < WATER &&
        Math.abs(frame.trunk.y) < 0.23 &&
        frame.air > 0.018 &&
        Math.max(frame.left.y, frame.right.y) < WATER + 0.004,
    );
  }
  const breath = film.instant({ of: "paddle", event: "breath2" });
  TestValidator.predicate(
    "the named breath clears the film waterline",
    read(film, body, breath).air > 0.02,
  );
}

function seam(
  film: AutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  cut: number,
): void {
  const before = read(film, body, cut - STEP);
  const after = read(film, body, cut + STEP);
  const distance = AutoMovieEngineVector3.distance;
  TestValidator.predicate(
    "displayed pelvis, both palms, mouth and body axis continue at the join",
    () =>
      distance(before.hips, after.hips) < 0.018 &&
      Math.abs(before.air - after.air) < 0.018 &&
      distance(before.left, after.left) < 0.025 &&
      distance(before.right, after.right) < 0.025 &&
      distance(before.trunk, after.trunk) < 0.018,
  );
}

function refuses(axis: string, run: () => unknown): void {
  let refusal: unknown;
  try {
    run();
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "invalid authored " + axis + " reports its parameter axis",
    refusal instanceof AutoMovieMotionHumanRefusal && refusal.axis === axis,
  );
}
