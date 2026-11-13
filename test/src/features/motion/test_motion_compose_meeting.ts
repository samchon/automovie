import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionMeeting,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The meeting: the one record two roles of a mutual action read.
 *
 * The body is a stub 2 m tall with an arm of 0.5 m, so the kind's contact
 * `palm` (height 0.5, range 0.5) lies 1 m up and 0.25 m ahead of whoever
 * offers it. Performer `a` stands at the origin facing +z, performer `b` 1 m
 * ahead facing back; the meeting starts at film second 2. `a`'s natural
 * timing is ready 0.25, stroke 0.5, relax 1; `b`'s is 0.5, 0.75, 0.875.
 *
 * Scenarios:
 * 1. Both roles: the frame is on the floor halfway between them heading from
 *    `a` to `b`, the palm is at the mean of both offers, each instant is the
 *    later of the two, and the record is the same whichever role comes first.
 * 2. Each role's place of the contact is the same point within 1e-9 m, facing
 *    back at that role, and solid.
 * 3. One role: the frame is the role's own, the contact its own default
 *    place, the instants its own, and the meeting is not solid.
 * 4. A kind that places its contacts itself is asked only when every role is
 *    present.
 * 5. No role and a role too many are `participant` refusals on `roles` with
 *    the kind's range of one to two; a role the kind does not name is one on
 *    `role` listing `shaker`; a contact the meeting lacks is a `parameter`
 *    refusal on `contact` listing `palm`.
 * 6. The shared instants on an action's own time, and a clock aligned on one:
 *    the spans before the instant stretch and the spans after keep their length.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public `of`, `place` and `local` and the clock's alignment, and reads the record; a frame that depends on the order of the roles, a contact not shared by both, an instant taken from the faster role, or a lone role marked solid fails.
 * @evidence contracts/development/testing.md#independent-expectations The frame, the contact and the places are worked out by hand from the stated stances and the stub's measures; the instants are the stated timings' maxima plus the start; the aligned clock's instants are the phrase's spans scaled by 0.75 over 0.625 before the stroke and unchanged after it.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both orders of two roles, each role's place, a lone role, a kind with and without its own placement, three refusals of the role list and an unknown contact, each with its axis and what it accepts, and an alignment on a time and on none.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; the body is a stub of the four measures a default place reads and the kind is the test's own, since no law defines a kind until the mutual laws are rebuilt. How the performance pairs two actions into one meeting is not covered here. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub, both stances and timings, and lists the 6 scenarios with their numbers.
 */
export function test_motion_compose_meeting(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const at = (g: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    close(g.x, x) && close(g.y, y) && close(g.z, z);
  const body = {
    measure: {
      stature: 2,
      shoulderHalfWidth: 0.25,
      upperArm: 0.25,
      forearm: 0.25,
    },
  } as unknown as IHumanBody;
  const role = (
    subject: string,
    z: number,
    yaw: number,
    name: string = "shaker",
  ): AutoMovieMotionMeeting.IRole => ({
    name,
    subject,
    body,
    posture: { root: { x: 0, y: 1, z }, yaw },
    bones: new Map(),
  });
  const a = role("a", 0, 0);
  const b = role("b", 1, 180);
  const kind: AutoMovieMotionMeeting.IKind = {
    name: "handshake",
    roles: ["shaker", "shaker"],
    contacts: { palm: { height: 0.5, range: 0.5, facing: "performer" } },
    timing: (r: AutoMovieMotionMeeting.IRole) =>
      r.subject === "a"
        ? { ready: 0.25, stroke: 0.5, relax: 1 }
        : { ready: 0.5, stroke: 0.75, relax: 0.875 },
  };
  const context = { start: 2 };

  // 1. Both roles.
  const meeting = AutoMovieMotionMeeting.of(kind, [a, b], context);
  TestValidator.equals(
    "the same record either order",
    AutoMovieMotionMeeting.of(kind, [b, a], context),
    meeting,
  );
  TestValidator.predicate(
    "the frame lies between the roles, heading from the first to the second",
    at(meeting.frame.origin, 0, 0, 0.5) &&
      close(meeting.frame.yaw, 0) &&
      at(meeting.contacts.palm!, 0, 1, 0) &&
      meeting.solid === true,
  );
  TestValidator.equals(
    "each instant is the later of the two",
    meeting.instants,
    {
      ready: 2.5,
      stroke: 2.75,
      relax: 3,
    },
  );
  TestValidator.equals("the roles in the meeting's order", meeting.roles, [
    { name: "shaker", subject: "a" },
    { name: "shaker", subject: "b" },
  ]);

  // 2. Each role's place.
  const mine = AutoMovieMotionMeeting.place(meeting, "palm", a.posture);
  const theirs = AutoMovieMotionMeeting.place(meeting, "palm", b.posture);
  TestValidator.predicate(
    "both roles read one point, each facing back at itself",
    at(mine.point, theirs.point.x, theirs.point.y, theirs.point.z) &&
      at(mine.point, 0, 1, 0.5) &&
      at(mine.normal, 0, 0, -1) &&
      at(theirs.normal, 0, 0, 1) &&
      mine.solid === true,
  );

  // 3. One role.
  const alone = AutoMovieMotionMeeting.of(kind, [b], context);
  TestValidator.predicate(
    "one role meets on its own default place, not solid",
    at(alone.frame.origin, 0, 0, 1) &&
      close(alone.frame.yaw, 180) &&
      at(alone.contacts.palm!, 0, 1, 0.25) &&
      at(
        AutoMovieMotionMeeting.place(alone, "palm", b.posture).point,
        0,
        1,
        0.75,
      ) &&
      alone.solid === false &&
      AutoMovieMotionMeeting.place(alone, "palm", b.posture).solid === false,
  );
  TestValidator.equals("one role's own instants", alone.instants, {
    ready: 2.5,
    stroke: 2.75,
    relax: 2.875,
  });
  TestValidator.equals("one role present", alone.roles, [
    { name: "shaker", subject: "b" },
  ]);

  // 4. A kind that places its contacts.
  const placing: AutoMovieMotionMeeting.IKind = {
    ...kind,
    place: () => ({ palm: { x: 0.125, y: 1.25, z: 0.5 } }),
  };
  TestValidator.predicate(
    "a kind places its contacts only when every role is present",
    at(
      AutoMovieMotionMeeting.of(placing, [a, b], context).contacts.palm!,
      0.125,
      1.25,
      0,
    ) &&
      at(
        AutoMovieMotionMeeting.of(placing, [a], context).contacts.palm!,
        0,
        1,
        0.25,
      ),
  );

  // 5. Refusals, each located with what the axis accepts.
  const refusal = (build: () => unknown): string => {
    try {
      build();
    } catch (error) {
      return error instanceof HumanRefusal
        ? `${error.kind} ${error.axis} ${JSON.stringify(error.feasible)}`
        : `not a refusal: ${String(error)}`;
    }
    return "accepted";
  };
  const count: string = JSON.stringify({
    kind: "range",
    minimum: 1,
    maximum: 2,
    unit: "",
    whole: true,
  });
  TestValidator.equals(
    "no role",
    refusal((): unknown => AutoMovieMotionMeeting.of(kind, [], context)),
    `participant roles ${count}`,
  );
  TestValidator.equals(
    "a role too many",
    refusal((): unknown =>
      AutoMovieMotionMeeting.of(kind, [a, b, role("c", 2, 0)], context),
    ),
    `participant roles ${count}`,
  );
  TestValidator.equals(
    "a role the kind does not name",
    refusal((): unknown =>
      AutoMovieMotionMeeting.of(kind, [a, role("b", 1, 180, "giver")], context),
    ),
    `participant role ${JSON.stringify({ kind: "alternatives", values: ["shaker"] })}`,
  );
  TestValidator.equals(
    "a contact the meeting lacks, refused with its contacts",
    refusal((): unknown =>
      AutoMovieMotionMeeting.place(meeting, "elbow", a.posture),
    ),
    `parameter contact ${JSON.stringify({ kind: "alternatives", values: ["palm"] })}`,
  );

  // 6. The action's own time.
  TestValidator.equals(
    "the shared instants on an action's own time",
    AutoMovieMotionMeeting.local(meeting, 2.25),
    { ready: 0.25, stroke: 0.5, relax: 0.75 },
  );
  const free = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const aligned = AutoMovieMotionClock.align(free, "stroke", 0.75);
  TestValidator.predicate(
    "an aligned clock puts the instant on the shared second",
    close(aligned.at("stroke"), 0.75) &&
      close(aligned.at("ready"), 0.3) &&
      close(aligned.at("strokeEnd"), 1) &&
      close(aligned.duration, 1.375),
  );
  TestValidator.error("an alignment on no time", (): unknown =>
    AutoMovieMotionClock.align(free, "stroke", 0),
  );
}
