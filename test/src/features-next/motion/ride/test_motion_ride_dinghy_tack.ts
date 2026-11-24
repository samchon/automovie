import { AutoMovieArchetypeCourse, createDinghy } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Contact bound in metres: one centimetre of displayed geometry. */
const METRE: number = 0.01;

/** The dinghy's cockpit floor height above its waterline, metres (`createDinghy`). */
const FLOOR: number = 0.02;

/** Port-side stance distance from the centreline, metres. */
const BEAM: number = 0.35;

/** The two crew members of the dinghy. */
type Crew = "helm" | "crew";

/** One hand's control on the dinghy. */
interface IControl {
  /** The holding hand. */
  side: AutoMovieHumanSide;

  /** The handle affordance it holds. */
  handle: createDinghy.Affordance;
}

/** Each sailor's hand on its control: the helm steers, the crew trims. */
const CONTROLS: Readonly<Record<Crew, IControl>> = {
  helm: { side: "right", handle: "tiller" },
  crew: { side: "left", handle: "mainSheet" },
};
/**
 * A helm and crew tack a moving two-person dinghy, or abort the tack, while
 * the helm works its real tiller and mainsheet.
 *
 * Scenarios:
 * 1. Both sailors start on the port side of the moving hull. Through a tack
 *    both pelvises cross the centreline and the boom swings to the other
 *    side; through an abort both return to port and the boom returns.
 * 2. The helm's hand holds the tiller and the crew's hand the mainsheet on
 *    the posed rig while the rudder and boom move.
 * 3. Each planted forefoot stays on the cockpit floor of the moving hull
 *    without slipping, and the crew moves its feet before the helm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hull, the two roles, both outcomes, the controls and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered sail law over a course-driven dinghy archetype and reads displayed bones, the hull frame and the articulated model the performance poses.
 * @evidence contracts/development/testing.md#independent-expectations The handle positions come from the archetype posed at the performance's own articulation state and placed by the course; the floor height comes from the archetype. The centreline separates the sides. One centimetre bounds grip and sole contact.
 * @evidence contracts/development/testing.md#distinguishing-cases A completed tack and an abort differ in the final side of the sailors and the boom; the roles differ in timing; the hand bound covers both moving controls.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances with one generated body, one archetype and a closed-form course.
 */
export function test_motion_ride_dinghy_tack(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const dinghy: ReturnType<typeof createDinghy> = createDinghy(
    { id: "dinghy" },
    5,
  );
  for (const kind of ["sailTack", "sailAbort"] as const) {
    const complete: boolean = kind === "sailTack";
    const course: AutoMovieArchetypeCourse.IPlan =
      AutoMovieArchetypeCourse.plan("dinghy", {
        start: { x: 0, z: 0, heading: 45 },
        legs: complete
          ? [
              { kind: "straight", length: 1.2 },
              { kind: "turn", radius: 3, angle: -90 },
              { kind: "straight", length: 3 },
            ]
          : [
              { kind: "straight", length: 1.2 },
              { kind: "turn", radius: 3, angle: -30 },
              { kind: "turn", radius: 3, angle: 30 },
              { kind: "straight", length: 3 },
            ],
        cruise: 1.4,
        acceleration: 0.8,
        deceleration: 0.6,
      });
    const motion = (seconds: number): IAutoMovieRigidTransform => ({
      position: course.at(seconds).placement.translation,
      rotation: course.at(seconds).placement.rotation,
    });
    const origin: IAutoMovieRigidTransform = motion(0);
    const placed = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        origin.position,
        Quaternion.rotateVector(origin.rotation, local),
      );
    const deck = (id: createDinghy.Affordance): number =>
      dinghy.affordance(id).frame.translation.z;
    const performers: IAutoMovieMotionHumanPerformer[] = [
      sailor(body, "helm", placed({ x: BEAM, y: FLOOR, z: deck("helmDeck") })),
      sailor(body, "crew", placed({ x: BEAM, y: FLOOR, z: deck("crewDeck") })),
    ];
    const film: HumanPerformance = new HumanPerformance({
      seed: `dinghy-${kind}`,
      laws: [AutoMovieMotionHumanSwim.aquatic],
      props: [HumanObject.prop("dinghy", dinghy, origin, motion)],
      performers,
      composition: {
        kind: "parallel",
        parts: (["helm", "crew"] as const).map(
          (role: Crew) =>
            HumanChain.subject(role).registered("aquatic", params(kind, role))
              .node,
        ),
      },
    });

    const local = (
      seconds: number,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const hull: IAutoMovieRigidTransform = film.prop("dinghy", seconds);
      return Quaternion.rotateVector(
        Quaternion.inverse(hull.rotation),
        Vector3.subtract(point, hull.position),
      );
    };
    const hips = (role: Crew, seconds: number): IAutoMovieVector3 =>
      local(seconds, film.bones(role, seconds).get("hips")!.worldPosition);
    const helm: IAutoMovieMotionHumanSegment = film.segments("helm")[0]!;
    assertTakeClean(`${kind}: the sailors pass the generic audit`, film);
    const crew: IAutoMovieMotionHumanSegment = film.segments("crew")[0]!;
    const end: number = helm.start + helm.plan.duration;
    const side: number = complete ? -1 : 1;
    TestValidator.predicate(
      `${kind}: both sailors start on port and settle on the authored side`,
      (["helm", "crew"] as const).every(
        (role: Crew): boolean =>
          hips(role, 0).x > 0 && side * hips(role, end).x > 0,
      ),
    );
    TestValidator.predicate(
      `${kind}: the crew lifts its first foot before the helm`,
      at(crew, "leadLift") < at(helm, "leadLift"),
    );
    TestValidator.predicate(
      `${kind}: the hull moves and turns during the maneuver`,
      Vector3.distance(film.prop("dinghy", end).position, origin.position) >
        2 &&
        Math.abs(
          Quaternion.rotateVector(film.prop("dinghy", end).rotation, {
            x: 0,
            y: 0,
            z: 1,
          }).x -
            Quaternion.rotateVector(origin.rotation, { x: 0, y: 0, z: 1 }).x,
        ) > (complete ? 0.5 : -1),
    );

    // The boom's clew crosses with a completed tack and returns on abort.
    const clew = (seconds: number): IAutoMovieVector3 =>
      dinghy.articulate(film.state("dinghy", seconds)).affordance("clew").frame
        .translation;
    const helmIn: number = at(helm, "helmIn");
    TestValidator.predicate(
      `${kind}: the boom starts to leeward and ends on the authored side`,
      clew(helmIn).x < -0.05 && -side * clew(end).x > 0.05,
    );
    TestValidator.predicate(
      `${kind}: the rudder turns during the maneuver`,
      Math.abs(film.state("dinghy", at(helm, "leadLift")).rudder ?? 0) > 5,
    );

    // Hands on the posed handles and soles on the cockpit floor.
    let grip: number = 0;
    let floor: number = 0;
    let slip: number = 0;
    for (let i: number = 0; i <= 60; ++i) {
      const seconds: number = (end * i) / 60;
      const hull: IAutoMovieRigidTransform = film.prop("dinghy", seconds);
      const rig: ReturnType<typeof dinghy.articulate> = dinghy.articulate(
        film.state("dinghy", seconds),
      );
      // A power grip holds a round handle anywhere along its length: the
      // grip centre must lie on the handle's wrapped axis (its +X) within
      // the handle's length.
      const miss = (role: Crew): number => {
        const { side, handle: id }: IControl = CONTROLS[role];
        const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
          role,
          seconds,
        );
        const affordance: ReturnType<typeof rig.affordance> =
          rig.affordance(id);
        const offset: IAutoMovieVector3 = Vector3.subtract(
          Quaternion.rotateVector(
            Quaternion.inverse(hull.rotation),
            Vector3.subtract(
              HumanHand.frame(body, bones, side, "grip").point,
              hull.position,
            ),
          ),
          affordance.frame.translation,
        );
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          affordance.frame.rotation,
          { x: 1, y: 0, z: 0 },
        );
        const along: number = Vector3.dot(offset, axis);
        const radial: number = Vector3.length(
          Vector3.subtract(offset, Vector3.scale(axis, along)),
        );
        return Math.max(radial, Math.abs(along) - (affordance.length ?? 0) / 2);
      };
      if (seconds >= helmIn)
        for (const role of ["helm", "crew"] as const)
          grip = Math.max(grip, miss(role));
      for (const [role, segment] of [
        ["helm", helm],
        ["crew", crew],
      ] as const)
        for (const foot of ["left", "right"] as const) {
          const window: IAutoMovieMotionHumanContactWindow | undefined = plant(
            segment,
            foot,
            seconds,
          );
          if (window === undefined) continue;
          const ball: IAutoMovieVector3 = local(
            seconds,
            HumanFoot.sockets(body, film.bones(role, seconds), foot)[1]!.point,
          );
          const from: number =
            segment.start + window.from * segment.plan.duration;
          const first: IAutoMovieVector3 = local(
            from,
            HumanFoot.sockets(body, film.bones(role, from), foot)[1]!.point,
          );
          floor = Math.max(floor, Math.abs(ball.y - FLOOR));
          slip = Math.max(slip, Vector3.distance(ball, first));
        }
    }
    TestValidator.predicate(
      `${kind}: the tiller and the mainsheet stay in hand (${grip.toFixed(5)} m)`,
      // A coursed hold lands its hand within its site's disc, the skin's
      // 10 mm (`courseArmGoal`); the grip is read at that bound.
      grip <= METRE + 1e-4,
    );
    TestValidator.predicate(
      `${kind}: planted forefeet bear on the cockpit floor (${floor.toFixed(4)} m)`,
      floor < METRE,
    );
    TestValidator.predicate(
      `${kind}: planted forefeet do not slip on the hull (${slip.toFixed(4)} m)`,
      slip < METRE,
    );
  }
}

/** A trained sailor standing on the dinghy, facing aft toward the tiller. */
function sailor(
  body: IAutoMovieMotionHumanBody,
  subject: Crew,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanPerformer {
  return {
    subject,
    body,
    at,
    yaw: 45 + 180,
    proficiency: { level: "trained" },
  };
}

/** The registered parameters of one role: the helm steers and drives the rig, the crew trims the mainsheet. */
function params(
  kind: IAutoMovieMotionHumanAquatic.Kind,
  role: Crew,
): IAutoMovieMotionHumanAquatic.IParams {
  return role === "helm"
    ? {
        kind,
        support: "dinghy",
        role,
        side: "left",
        rightGrip: "tiller",
        boom: "boom",
        rudder: "rudder",
      }
    : { kind, support: "dinghy", role, side: "left", leftGrip: "mainSheet" };
}

/** The film second of an event of a segment. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((event) => event.name === name)!.share
  );
}

/** The foot's plant window open at a film second, if any. */
function plant(
  segment: IAutoMovieMotionHumanSegment,
  side: AutoMovieHumanSide,
  seconds: number,
): IAutoMovieMotionHumanContactWindow | undefined {
  const share: number = (seconds - segment.start) / segment.plan.duration;
  return segment.plan.contacts.find(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.part === `${side}Foot` &&
      window.kind === "plant" &&
      window.from <= share &&
      share <= window.to,
  );
}
