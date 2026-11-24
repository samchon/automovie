import {
  AutoMovieArchetypeCourse,
  createDoubleScull,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { vclose } from "../../internal/vclose";

const SIDES = [
  ["left", "Left"],
  ["right", "Right"],
] as const;

/**
 * Two scullers take one actual shell through a start and bend. Each actor
 * drives and tracks the handles of their own station through three strokes.
 *
 * Scenarios:
 *
 * 1. Measure the body seat, both forefeet and both grip centers against the
 *    visible articulated model in film coordinates from catch through
 *    recovery.
 * 2. Measure blade wet and dry states, phase separation, progressive motion of the
 *    hull, and replay identical samples in reverse order.
 * 3. Refuse two concurrent owners of one station's carriage and oars.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the real moving shell, actuated contacts, sample boundaries and conflict.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a canonical hull and two filmed performers for each of two body profiles, and reads independently displayed model parts and anatomical sockets.
 * @evidence contracts/development/testing.md#independent-expectations Compares geometry derived from the actual scene track and posed product with body sockets, using a 1 cm world-space contact bound. World Rowing defines wet drive and dry recovery.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes launch, bend, two crew phases over multiple cycles, wet and dry blade samples, reverse playback and overlapping station ownership.
 * @evidence contracts/development/testing.md#execution-ownership Coordinates no external simulation and owns its film, bodies and hull in memory.
 */
export function test_motion_ride_racing_scull(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const profile of ["m-average", "f-average"] as const) {
    try {
      verifyCrew(checks, motionHumanBody(profile));
    } catch (error: unknown) {
      checks.check(
        `${String(profile)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("ride racing scull");
}

/** Use the same moving shell and signed station timings with one body profile. */
function verifyCrew(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
): void {
  const shell = createDoubleScull({ id: "shell" }, 4);
  const course: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "doubleScull",
    {
      start: { x: 0.4, z: 1.1, heading: -12 },
      legs: [
        { kind: "straight", length: 2 },
        { kind: "turn", radius: 12, angle: 42 },
        { kind: "straight", length: 10 },
      ],
      cruise: 2.3,
      acceleration: 1.2,
      deceleration: 0.7,
    },
  );
  const motion = (t: number): IAutoMovieRigidTransform => {
    const { translation, rotation } = course.at(t).placement;
    return { position: translation, rotation };
  };
  const take = (
    second: IAutoMovieMotionHumanAquatic.Station,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "racing-scull",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      props: [HumanObject.prop("shell", shell, motion(0), motion)],
      performers: ["bow", "stroke"].map((subject: string) => ({
        subject,
        body,
        at: motion(0).position,
        yaw: 168,
        proficiency: { level: "trained" },
      })),
      composition: {
        kind: "parallel",
        parts: [rower("bow", "bow", 0), rower("stroke", second, 0.035)],
      },
    });
  const film: HumanPerformance = take("stroke");
  verdict(checks, "racing scull", film);
  const world = (
    model: typeof shell,
    name: createDoubleScull.Affordance,
    frame: IAutoMovieRigidTransform,
  ): Pick<IAutoMovieTransform, "translation" | "rotation"> => {
    const local: IAutoMovieTransform = model.affordance(name).frame;
    return {
      translation: Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local.translation),
      ),
      rotation: Quaternion.multiply(frame.rotation, local.rotation),
    };
  };
  const first = film.segments("bow")[0]!;
  const aft = film.segments("stroke")[0]!;
  const catch2: number = at(first, "catch2");
  const extract2: number = at(first, "extract2");
  const next: number = at(first, "catch3");
  checks.check(
    "the same moving hull starts, turns, and advances over three cycles",
    course.at(0).speed === 0 &&
      course.at(catch2).speed > 1.5 &&
      course.at(next).curvature !== 0 &&
      Vector3.distance(
        film.prop("shell", next).position,
        film.prop("shell", catch2).position,
      ) > 3,
  );
  checks.check(
    "both stations' catches retain the authored phase",
    Math.abs(
      at(first, "catch2") -
        at(aft, "catch2") -
        (0.035 * first.plan.duration) / 3,
    ) < 1.0e-8,
  );

  let seatError: number = 0;
  let handError: number = 0;
  let soleError: number = 0;
  let allWet: boolean = true;
  let allDry: boolean = true;
  const samples: readonly number[] = Array.from(
    { length: 73 },
    (_, index) => (index * first.plan.duration) / 72,
  );
  for (const seconds of samples) {
    const frame: IAutoMovieRigidTransform = film.prop("shell", seconds);
    const model: typeof shell = shell.articulate(film.state("shell", seconds));
    for (const station of ["bow", "stroke"] as const) {
      const bones: ReturnType<typeof film.bones> = film.bones(station, seconds);
      const placedSeat = model.parts.find(
        (part) => part.id === `${station}-seat`,
      )!;
      if (
        placedSeat.transform === null ||
        placedSeat.geometry.type !== "primitive" ||
        placedSeat.geometry.shape.type !== "box"
      )
        throw new Error("the moving seat must be a placed box");
      const seatCenter: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          Vector3.add(
            placedSeat.transform.translation,
            Quaternion.rotateVector(placedSeat.transform.rotation, {
              x: 0,
              y: placedSeat.geometry.shape.height / 2,
              z: 0,
            }),
          ),
        ),
      );
      const pelvis: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.point(
        body.surfaces.sockets.seat,
        bones.get("hips")!,
      );
      seatError = Math.max(seatError, Vector3.distance(pelvis, seatCenter));
      for (const [side, title] of SIDES) {
        const plate = world(model, `${station}${title}Foot`, frame);
        const sole: IAutoMovieVector3 = HumanFoot.sockets(body, bones, side)[1]!
          .point;
        soleError = Math.max(
          soleError,
          Vector3.distance(sole, plate.translation),
        );
        const grip = model.parts.find(
          (part) => part.id === `${station}${title}-grip`,
        )!.transform!;
        const socket: IAutoMovieVector3 = Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, grip.translation),
        );
        const hand: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "grip",
        ).point;
        handError = Math.max(handError, Vector3.distance(hand, socket));
      }
    }
  }

  for (const [station, segment] of [
    ["bow", first],
    ["stroke", aft],
  ] as const) {
    const extracted: number = at(segment, "extract2");
    const loaded: number = (at(segment, "catch2") + extracted) / 2;
    const recovering: number = (extracted + at(segment, "catch3")) / 2;
    for (const [, title] of SIDES) {
      const name = `${station}${title}BladeTip` as const;
      allWet &&=
        world(
          shell.articulate(film.state("shell", loaded)),
          name,
          film.prop("shell", loaded),
        ).translation.y < -0.02;
      allDry &&=
        world(
          shell.articulate(film.state("shell", recovering)),
          name,
          film.prop("shell", recovering),
        ).translation.y > 0.12;
    }
  }
  checks.check(
    "all four visible blade tips have a wet drive and dry recovery",
    allWet && allDry,
  );
  checks.check(
    `seat sockets remain on moving sliders (${seatError.toFixed(4)} m max)`,
    seatError < 0.01,
  );
  checks.check(
    `all grips follow their actual oars (${handError.toFixed(4)} m max)`,
    handError < 0.01,
  );
  checks.check(
    `the forefeet stay on their angled stretchers (${soleError.toFixed(4)} m max)`,
    soleError < 0.01,
  );

  const catchSlide: number = film.state("shell", catch2).bowSlide!;
  const driveSlide: number = film.state("shell", extract2).bowSlide!;
  checks.check(
    "the visible seat moves along its rail and recovers to the same place",
    driveSlide - catchSlide > 0.2 &&
      Math.abs(film.state("shell", next).bowSlide! - catchSlide) < 1.0e-8,
  );
  const before = film.bones("stroke", extract2).get("hips")!.worldPosition;
  film.bones("stroke", next);
  checks.check(
    "reverse scrub reuses the same phase",
    vclose(
      before,
      film.bones("stroke", extract2).get("hips")!.worldPosition,
      1.0e-8,
    ),
  );
  try {
    take("bow");
  } catch (error) {
    checks.check(
      "conflicting station ownership refuses",
      error instanceof HumanRefusal &&
        error.kind === "cut" &&
        error.axis === "drives",
    );
    return;
  }
  throw new Error(
    "two rowers cannot drive the same station during overlapping intervals",
  );
}

function rower(
  subject: string,
  station: IAutoMovieMotionHumanAquatic.Station,
  phase: number,
): ReturnType<typeof HumanChain.subject>["node"] {
  const params: IAutoMovieMotionHumanAquatic.IParams = {
    kind: "doubleScull",
    support: "shell",
    station,
    phase,
  };
  return HumanChain.subject(subject).registered("aquatic", params).node;
}

function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((event) => event.name === name)!.share
  );
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
