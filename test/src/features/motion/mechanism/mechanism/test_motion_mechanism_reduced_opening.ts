import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTravelDoor,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HumanColliders,
  HumanFoot,
  HumanHand,
  HumanObstacle,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * Fit the performer through the actual depth of the named aperture.
 *
 * Scenarios:
 * 1. An average man and a small woman duck through a low opening.
 * 2. The same bodies travel side-on through openings narrower than their
 *    upright chest width.
 * 3. The same bodies get down, travel prone on alternating palms through
 *    a deep low hole, then rise and walk out.
 * 4. The upright default preserves the ordinary path and an impossible
 *    opening identifies the limiting dimension.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the visible traversal modes, both bodies and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed colliders through the wall and actual palm positions at support, then follows the public chain to a standing exit.
 * @evidence contracts/development/testing.md#independent-expectations The axis-aligned wall's entered dimensions define the clear volume in world axes; the palm progress and floor are read independently of the planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes upright admission, reduced headroom, side-on width, prone supports, both stature cases and a physically impossible request.
 * @evidence contracts/development/testing.md#execution-ownership Constructs portable in-memory performances and reads canonical displayed bones.
 */
export function test_motion_mechanism_reduced_opening(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const person of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(person);
    for (const [mode, width, height] of [
      ["duck", 0.85, body.measure.stature - 0.18],
      [
        "squeeze",
        body.measure.chestBreadth - (person === "f-small" ? 0.002 : 0.008),
        body.measure.stature + 0.5,
      ],
      ["crawl", 0.95, 0.5],
      [undefined, 0.85, body.measure.stature + 0.5],
    ] as const) {
      const name: string = person + " " + (mode ?? "upright");
      let film: HumanPerformance;
      try {
        film = stage(body, width, height, mode);
      } catch (error) {
        all.check(
          name + ": admits the complete crossing: " + String(error),
          false,
        );
        continue;
      }
      const passed: IAutoMovieMotionHumanSegment =
        film.segments("a")[mode === "crawl" ? 2 : 1]!;
      let firstHead: number = Infinity;
      let lastHips: number = -Infinity;
      let worst: IWorstMiss = {
        miss: 0,
        bone: "",
        time: 0,
      };
      const count: number = Math.ceil(film.duration * 30);
      for (let i: number = 0; i <= count; i++) {
        const time: number = (i * film.duration) / count;
        const posed: ReturnType<HumanPerformance["bones"]> = film.bones(
          "a",
          time,
        );
        for (const piece of HumanColliders.placed(body, posed)) {
          for (const shape of piece.shapes) {
            const box: IAutoMoviePhysicalShapeBounds.IResult =
              physicalShapeBounds(piece.pose, shape);
            if (box.max.z < 1.65 || box.min.z > 2.35) continue;
            if (piece.bone === "head") firstHead = Math.min(firstHead, time);
            if (piece.bone === "hips") lastHips = Math.max(lastHips, time);
            const miss: number = Math.max(
              -width / 2 - box.min.x,
              box.max.x - width / 2,
              box.max.y - height,
            );
            if (miss > worst.miss) worst = { miss, bone: piece.bone, time };
          }
        }
      }
      all.check(
        name + ": the head enters and hips cross before continuation",
        firstHead !== Infinity &&
          lastHips !== -Infinity &&
          firstHead >= passed.start &&
          lastHips <= passed.end,
      );
      all.check(
        name +
          ": maximum solid overlap is " +
          worst.miss.toFixed(4) +
          " m at " +
          worst.bone +
          " " +
          worst.time.toFixed(3) +
          " s",
        worst.miss <= 1e-6,
      );
      all.check(
        name + ": a planted standing beat follows on the far side",
        film.bones("a", film.duration).get("hips")!.worldPosition.z > 2.7 &&
          film.bones("a", film.duration).get("head")!.worldPosition.y >
            0.8 * body.measure.stature,
      );
      if (mode === "squeeze") {
        const hip = film.bones("a", (firstHead + lastHips) / 2).get("hips")!;
        const facing: IAutoMovieVector3 = Quaternion.rotateVector(
          hip.worldRotation,
          { x: 0, y: 0, z: 1 },
        );
        all.check(
          name + ": the actor is side-on in the wall",
          Math.abs(facing.x) > 0.85,
        );
      }
      const before = film
        .bones("a", passed.end - 0.001)
        .get("hips")!.worldPosition;
      const after = film
        .bones("a", passed.end + 0.001)
        .get("hips")!.worldPosition;
      all.check(
        name + ": the displayed hips continue without a step at the join",
        Vector3.length(Vector3.subtract(after, before)) < 0.025,
      );
      if (mode === "crawl") checkPalms(all, name, body, film, passed);
      else checkFeet(all, name, body, film, passed);
      if (mode === "squeeze") {
        let refused: unknown;
        try {
          stage(body, width, height);
        } catch (error) {
          refused = error;
        }
        all.check(
          name + ": the same opening refuses the upright gait",
          refused instanceof HumanRefusal && refused.axis === "path",
        );
      }
    }
    let failure: unknown;
    try {
      stage(body, 0.85, 0.1, "duck");
    } catch (error) {
      failure = error;
    }
    all.check(
      person +
        ": impossible named opening reports a headroom bound: " +
        String(failure),
      failure instanceof HumanRefusal &&
        failure.axis === "aperture" &&
        failure.message.includes("headroom") &&
        failure.message.includes("passage"),
    );
  }
  all.assert("displayed clearance and contact decide the named crossing");
}

/** The worst displayed overlap of the opening's solid. */
interface IWorstMiss {
  /** Overlap, metres. */
  miss: number;

  /** The overlapping bone. */
  bone: string;

  /** When, film seconds. */
  time: number;
}

/** Measure the sole contact on the floor through the standing travel. */
function checkFeet(
  all: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  passed: IAutoMovieMotionHumanSegment,
): void {
  let maximum: number = 0;
  let count: number = 0;
  for (const window of passed.plan.contacts) {
    if (window.part !== "leftFoot" && window.part !== "rightFoot") continue;
    const side: AutoMovieHumanSide =
      window.part === "leftFoot" ? "left" : "right";
    count++;
    for (const u of [0.2, 0.5, 0.8]) {
      const share: number = window.from + u * (window.to - window.from);
      const bones = film.bones(
        "a",
        passed.start + share * passed.plan.duration,
      );
      const low: number = Math.min(
        ...HumanFoot.sockets(body, bones, side).map((item) => item.point.y),
      );
      maximum = Math.max(maximum, Math.abs(low));
    }
  }
  all.check(
    name +
      ": the actual bearing soles stay on the floor, max " +
      maximum.toFixed(4) +
      " m",
    count > 2 && maximum <= 0.018,
  );
}

/** Observe the same actual palm over the interior of each loaded interval. */
function checkPalms(
  all: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  passed: IAutoMovieMotionHumanSegment,
): void {
  let previous: AutoMovieHumanSide | undefined;
  let count: number = 0;
  let maximum: number = 0;
  for (const window of passed.plan.contacts) {
    if (window.part !== "leftHand" && window.part !== "rightHand") continue;
    const side: AutoMovieHumanSide =
      window.part === "leftHand" ? "left" : "right";
    all.check(
      name + ": consecutive strokes alternate hands",
      previous !== side,
    );
    previous = side;
    count++;
    const point = (u: number): IAutoMovieVector3 =>
      HumanHand.frame(
        body,
        film.bones(
          "a",
          passed.start +
            (window.from + u * (window.to - window.from)) *
              passed.plan.duration,
        ),
        side,
        "palm",
      ).point;
    const middle: IAutoMovieVector3 = point(0.5);
    maximum = Math.max(
      maximum,
      Math.abs(middle.y),
      Vector3.length(Vector3.subtract(middle, point(0.1))),
      Vector3.length(Vector3.subtract(middle, point(0.9))),
    );
  }
  all.check(
    name + ": at least two genuine palm supports travel through the opening",
    count >= 2,
  );
  all.check(
    name +
      ": the actual planted palms stay at their floor marks within 15 mm, max " +
      maximum.toFixed(4),
    maximum <= 0.015,
  );
}

/** Build the complete public action with a continuation. */
function stage(
  body: IAutoMovieMotionHumanBody,
  width: number,
  height: number,
  mode?: IAutoMovieMotionHumanTravelDoor.IParams["mode"],
): HumanPerformance {
  const standing: IAutoMovieMotionHumanChain = HumanChain.subject("a").stand({
    hold: 0.25,
  });
  const entry: IAutoMovieMotionHumanChain =
    mode === "crawl" ? standing.lieDown({ kind: "prone" }) : standing;
  const passage: IAutoMovieMotionHumanChain = entry.registered("passThrough", {
    through: "wall",
    aperture: "passage",
    ...(mode === undefined ? {} : { mode }),
  });
  const exit: IAutoMovieMotionHumanChain =
    mode === "crawl" ? passage.getUp() : passage;
  return new HumanPerformance({
    seed: "reduced-opening",
    laws: [AutoMovieMotionHumanGait.HumanTravelDoor.passThrough],
    obstacles: [
      HumanObstacle.wall(
        "wall",
        { x: -3, y: 0, z: 2 },
        { x: 3, y: 0, z: 2 },
        0.7,
        height + 0.5,
        [
          {
            id: "passage",
            at: { x: 0, y: 0, z: 2 },
            across: { x: 1, y: 0, z: 0 },
            width,
            height,
          },
        ],
      ),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: mode === "crawl" ? -0.7 : 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: exit.walk({ to: { x: 0, y: 0, z: 4.6 } }).stand({ hold: 0.25 })
      .node,
  });
}
