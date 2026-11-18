import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanMutual,
  HumanRefusal,
  seated,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import type { motionHumanLawSweep } from "../internal/motionHumanLawSweep";
import { nclose } from "../internal/nclose";

/** One meeting's display witness and the cast that supplies its rest skin. */
interface IMeetingCase {
  /** The surface variant. */
  kind: IAutoMovieMotionHumanHighFive.Kind;
  /** Whether to approach from the two seats. */
  sit: boolean;
  /** The standing stage distance, metres. */
  separation: number;
  /** The two facing bodies in the scene's order. */
  bodies: readonly [IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBody];
}

/** The original high-five stage places both facing people 0.7 metres apart. */
const GAP: number = 0.7;

/** A body's displayed contact point and the skin's outward normal there. */
interface IHandSurface {
  /** The outer surface point in world metres. */
  point: IAutoMovieVector3;
  /** The outward unit normal in world axes. */
  normal: IAutoMovieVector3;
}

/**
 * A high or low five, or a fist bump, puts two opposed skin surfaces on
 * one plane without breaking the ground or seated base.
 *
 * Scenarios:
 * 1. The standing extreme pair keeps the original 0.7 m stage, meets at
 *    one instant and touches within the 10 mm skin limit.
 * 2. The high five from two popliteal-height seats keeps the pelvis within
 *    10 mm of its seated placement at meet, with the same hand bound.
 * 3. The standing low five reaches the same contact bound with the low
 *    target height. Equal bodies bump fists on their ground bisector.
 * 4. Standing bodies two statures apart refuse the meeting on `partner`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, seat, physical surfaces, limits and separating cases.
 * @evidence contracts/development/testing.md#behavioral-verification Performs both roles through the public chain. Reads actual world skin from each wrist transform and the timed meeting and rebound. Detects a one-sided meeting, wrong hand form, false wrist contact, feet or pelvis leaving the base, and partner penetration.
 * @evidence contracts/development/testing.md#independent-expectations The hand point is an anatomical frame placed by the displayed wrist with the collider's own skin thickness. Equal mirrored bodies give a known bisector independent of the reported meeting point. The prior skin and seating bounds remain 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all three contact heights and both physical skin forms, seated and standing, unequal and identical proportions, and an unreachable pair. The mutual join spec owns role-order symmetry.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory test reads four short public performances and one refused input, with no render or alternate solver.
 */
export function test_human_motion_high_five_meeting(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const small: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const large: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const average: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const cases: readonly IMeetingCase[] = [
    { kind: "high", sit: false, separation: GAP, bodies: [small, large] },
    { kind: "high", sit: true, separation: GAP, bodies: [average, small] },
    { kind: "low", sit: false, separation: GAP, bodies: [small, large] },
    { kind: "fist", sit: false, separation: GAP, bodies: [average, average] },
  ];
  let standingHigh: number | undefined;
  for (const row of cases) {
    const label: string = `${row.kind}, ${row.sit ? "seated" : "standing"}`;
    try {
      const scene: motionHumanLawSweep.IScene = stage(row);
      const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
        "mutual",
        scene.people,
        scene.composition,
        scene.props,
      );
      const meet: number = motionHumanLaw.event(film, "meet", "a");
      const other: number = motionHumanLaw.event(film, "meet", "b");
      const rebound: number = motionHumanLaw.event(film, "rebound", "a");
      all.check(
        `${label}: both roles have one meeting before rebound`,
        nclose(meet, other) && meet < rebound,
      );
      for (const seconds of [meet, (meet + rebound) / 2]) {
        const a: IHandSurface = surface(film, "a", row, seconds);
        const b: IHandSurface = surface(film, "b", row, seconds);
        const gap: number = Vector3.distance(a.point, b.point);
        all.check(
          `${label}: skin gap ${gap * 1000} mm at ${seconds} s`,
          gap <= 0.01,
        );
        all.check(
          `${label}: the two skin normals face each other`,
          Vector3.dot(a.normal, b.normal) < 0,
        );
        if (row.kind === "fist")
          all.check(
            "equal facing bodies share the midpoint of their ground origins",
            nclose(a.point.z, row.separation / 2, 0.01) &&
              nclose(b.point.z, row.separation / 2, 0.01),
          );
        if (seconds === meet && !row.sit) {
          const height: number = (a.point.y + b.point.y) / 2;
          if (row.kind === "high") standingHigh = height;
          if (row.kind === "low")
            all.check(
              "the same two standing bodies meet below their high-five height",
              standingHigh !== undefined && height < standingHigh,
            );
        }
      }
      /** For a held base, check the part that bears it at and through contact. */
      const supports: readonly AutoMovieHumanoidBone[] = row.sit
        ? ["hips"]
        : ["leftFoot", "rightFoot"];
      for (const who of ["a", "b"] as const) {
        const span: IAutoMovieMotionHumanSegment = film.performance
          .segments(who)
          .at(-1)!;
        for (const bone of supports) {
          const before: IAutoMovieVector3 = film
            .bones(who, span.entryTime)
            .get(bone)!.worldPosition;
          const held: IAutoMovieVector3 = film
            .bones(who, meet)
            .get(bone)!.worldPosition;
          const moved: number = Vector3.distance(before, held);
          all.check(
            `${label}: ${who}'s ${bone} moves ${moved * 1000} mm at contact`,
            moved <= 0.01,
          );
        }
      }
      const worst: ReturnType<
        typeof AutoMovieMotionHumanAuditPartner.measure
      >["worst"] = AutoMovieMotionHumanAuditPartner.measure(
        film,
        scene.people[0]!,
        scene.people[1]!,
      ).worst;
      all.check(
        `${label}: partner penetration ${worst.value * 1000} mm at ${worst.seconds} s (${worst.where})`,
        worst.value <= 0.01,
      );
    } catch (error: unknown) {
      all.check(`${label}: the meeting must play: ${String(error)}`, false);
    }
  }

  const far: motionHumanLawSweep.IScene = stage({
    ...cases[0]!,
    separation: 2 * large.measure.stature,
  });
  let refused: unknown;
  try {
    motionHumanLaw.perform("mutual", far.people, far.composition, far.props);
  } catch (error: unknown) {
    refused = error;
  }
  all.check(
    `separated reach spheres refuse their partner: ${String(refused)}`,
    refused instanceof HumanRefusal &&
      refused.kind === "reach" &&
      refused.axis === "partner",
  );
  all.assert("both displayed hands meet on a common surface");
}

/** Reuse the usual facing stance and the seated-reach fixture's seat placement. */
function stage(row: IMeetingCase): motionHumanLawSweep.IScene {
  const people: motionHumanLawSweep.IPerson[] = row.bodies.map(
    (
      body: IAutoMovieMotionHumanBody,
      index: number,
    ): motionHumanLawSweep.IPerson => ({
      subject: index === 0 ? "a" : "b",
      body,
      at: { x: 0, y: 0, z: index === 0 ? 0 : row.separation },
      yaw: index === 0 ? 0 : 180,
    }),
  );
  const lead: (
    person: motionHumanLawSweep.IPerson,
  ) => IAutoMovieMotionHumanChain = (
    person: motionHumanLawSweep.IPerson,
  ): IAutoMovieMotionHumanChain => {
    const chain: IAutoMovieMotionHumanChain = HumanChain.subject(
      person.subject,
    );
    if (!row.sit) return chain;
    const direction: number = person.yaw === 0 ? 1 : -1;
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(person.body),
        z:
          person.at.z + direction * (person.body.rest.get("leftFoot")!.z - 0.1),
      },
      yaw: person.yaw,
      depth: 0.45,
    };
    return chain.sit({ seat });
  };
  return {
    people,
    composition: HumanChain.mutual(
      HumanMutual.highFive,
      { one: lead(people[0]!), other: lead(people[1]!) },
      { kind: row.kind },
    ).node,
    props: [],
  };
}

/** The rig's contact socket moved through its actual hand transformation. */
function surface(
  film: motionHumanLaw.IFilm,
  who: string,
  row: IMeetingCase,
  seconds: number,
): IHandSurface {
  const body: IAutoMovieMotionHumanBody = row.bodies[who === "a" ? 0 : 1];
  const socket: IAutoMovieMotionHumanHand.Surface =
    row.kind === "fist" ? "fist" : "palm";
  const effector: IAutoMovieMotionHumanTouchEffector.IEffector = {
    surface: socket,
    shape: row.kind === "fist" ? "fist" : "flat",
  };
  const wrist: IAutoMovieResolvedBone = film
    .bones(who, seconds)
    .get("rightHand")!;
  const rest: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["palmRight"] =
    body.surfaces.sockets[row.kind === "fist" ? "fistRight" : "palmRight"];
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    wrist.worldRotation,
    rest.normal,
  );
  const skin: number = AutoMovieMotionHumanTouchEffector.pad(
    body,
    "right",
    effector,
  );
  return {
    point: Vector3.addScaled(
      Vector3.add(
        wrist.worldPosition,
        Quaternion.rotateVector(wrist.worldRotation, rest.point),
      ),
      normal,
      skin,
    ),
    normal,
  };
}
