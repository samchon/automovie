import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  type AutoMovieMotionMeeting,
  HumanChain,
  HumanFrame,
  HumanPerformance,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEntryState,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Three people who do one thing together read one meeting: the same record
 * whichever of them plans first, with its contact between them.
 *
 * The mutual action is a three-way toast stated in the test: a kind of three
 * roles of one name with one contact, `clink`, whose default place lies
 * ahead of each drinker at 0.75 of the stature. A registered law reads the
 * meeting while it plans and records it. Three people stand on the corners
 * of a triangle of side 1 m, each facing its middle.
 *
 * Scenarios:
 * 1. Three different bodies (the average man, the small woman, the large
 *    man), in each of the six orders the three can be composed in: every
 *    role reads the same record (frame origin and heading, the contact's
 *    place, the three instants and the order of the roles, to 1e-9), and
 *    the record is the same in all six orders.
 * 2. That meeting is solid, and its contact lies no lower than the lowest
 *    and no higher than the highest of the three default heights, 0.75 of
 *    each stature.
 * 3. Three people of one body: the contact lies on the triangle's middle,
 *    within a micrometre on the floor plan, at 0.75 of the stature, as the
 *    symmetry of the three places requires.
 * 4. With one of the three absent from the cast, the two who remain read a
 *    meeting that is not solid: a contact a role is missing from cannot be
 *    touched.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public input with a registered law as the reader and compares the records every role was given; a record that depends on the planning order, a contact outside the three default places, or a solid meeting with a role missing fails.
 * @evidence contracts/development/testing.md#independent-expectations Order independence is a relation between runs; the symmetric contact follows from three equal bodies on an equilateral triangle, and the height band from the kind's own stated share of each stature. Nothing is read back from the meeting's computation.
 * @evidence contracts/development/testing.md#distinguishing-cases Six planning orders, unequal and equal bodies, a full and a short cast. Two roles are `test_motion_compose_meeting`'s and `test_human_motion_mutual_join`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds performances of one held posture each in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the staged kind and the 4 scenarios with their bounds.
 */
export function test_human_motion_core_meeting_roles(): void {
  const complaints: string[] = [];
  const SHARE: number = 0.75;
  const kind: AutoMovieMotionMeeting.IKind = {
    name: "toast",
    roles: ["drinker", "drinker", "drinker"],
    contacts: { clink: { height: SHARE, range: 0.8, facing: "performer" } },
    timing: (): AutoMovieMotionMeeting.ITiming => ({
      ready: 0.6,
      stroke: 0.8,
      relax: 1.4,
    }),
  };

  // The corners of a triangle of side 1 m about the origin, and the heading
  // from each to its middle.
  const RADIUS: number = 1 / Math.sqrt(3);
  const corners: readonly { at: IAutoMovieVector3; yaw: number }[] = [
    0, 120, 240,
  ].map((degrees: number): { at: IAutoMovieVector3; yaw: number } => {
    const angle: number = (degrees * Math.PI) / 180;
    return {
      at: { x: RADIUS * Math.sin(angle), y: 0, z: RADIUS * Math.cos(angle) },
      yaw: degrees + 180,
    };
  });
  const SUBJECTS: readonly string[] = ["a", "b", "c"];

  // What every role of a cast read, by subject, in one performance.
  const read = (
    bodies: readonly IHumanBody[],
    order: readonly string[],
  ): Map<string, AutoMovieMotionMeeting.IMeeting> => {
    const seen: Map<string, AutoMovieMotionMeeting.IMeeting> = new Map();
    const clink: IHumanActionLaw<never> = {
      name: "clink",
      interrupts: {},
      plan: (context: IHumanActionContext<never>): IHumanActionPlan => {
        seen.set(
          context.subject,
          context.meeting(
            kind,
            "drinker",
            order
              .filter((subject: string): boolean => subject !== context.subject)
              .map(
                (subject: string): IHumanActionContext.IPartner => ({
                  role: "drinker",
                  subject,
                }),
              ),
          ),
        );
        return {
          duration: 1.5,
          events: [],
          contacts: context.entry.supports.map(
            (
              support: IHumanEntryState.ISupport,
            ): IHumanActionPlan["contacts"][number] => ({
              ...support,
              from: 0,
              to: 1,
            }),
          ),
          posture: (): ReturnType<IHumanActionPlan["posture"]> =>
            context.entry.posture,
        };
      },
    };
    new HumanPerformance({
      seed: "meeting",
      laws: [clink],
      performers: SUBJECTS.map((subject: string, index: number) => ({
        subject,
        body: bodies[index]!,
        at: corners[index]!.at,
        yaw: corners[index]!.yaw,
        proficiency: { level: "trained" as const },
      })),
      composition: AutoMovieComposition.parallel(
        ...order.map(
          (subject: string): HumanChain =>
            HumanChain.subject(subject).registered("clink"),
        ),
      ),
    });
    return seen;
  };
  const place = (meeting: AutoMovieMotionMeeting.IMeeting): IAutoMovieVector3 =>
    HumanFrame.point(meeting.frame, meeting.contacts.clink!);
  const apart = (
    one: AutoMovieMotionMeeting.IMeeting,
    other: AutoMovieMotionMeeting.IMeeting,
  ): number =>
    Math.max(
      Math.hypot(
        one.frame.origin.x - other.frame.origin.x,
        one.frame.origin.z - other.frame.origin.z,
      ),
      Math.abs(one.frame.yaw - other.frame.yaw),
      Math.hypot(
        place(one).x - place(other).x,
        place(one).y - place(other).y,
        place(one).z - place(other).z,
      ),
      Math.abs(one.instants.ready - other.instants.ready),
      Math.abs(one.instants.stroke - other.instants.stroke),
      Math.abs(one.instants.relax - other.instants.relax),
      one.roles.every(
        (role: AutoMovieMotionMeeting.IMeeting["roles"][number], i: number) =>
          role.subject === other.roles[i]?.subject,
      )
        ? 0
        : 1,
    );

  // 1 and 2. Three builds in the six orders.
  const mixed: readonly IHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-large"),
  ];
  const ORDERS: readonly (readonly string[])[] = [
    ["a", "b", "c"],
    ["a", "c", "b"],
    ["b", "a", "c"],
    ["b", "c", "a"],
    ["c", "a", "b"],
    ["c", "b", "a"],
  ];
  let reference: AutoMovieMotionMeeting.IMeeting | undefined;
  for (const order of ORDERS) {
    const seen: Map<string, AutoMovieMotionMeeting.IMeeting> = read(
      mixed,
      order,
    );
    for (const subject of SUBJECTS) {
      const meeting: AutoMovieMotionMeeting.IMeeting | undefined =
        seen.get(subject);
      if (meeting === undefined) {
        complaints.push(
          `composed ${order.join(", ")}: ${subject} read nothing`,
        );
        continue;
      }
      reference ??= meeting;
      const off: number = apart(reference, meeting);
      if (off > 1e-9)
        complaints.push(
          `composed ${order.join(", ")}: the meeting ${subject} read differs from the first one read by ${off.toExponential(2)}, the same record expected`,
        );
    }
  }
  if (reference !== undefined) {
    const heights: number[] = mixed.map(
      (body: IHumanBody): number => SHARE * body.measure.stature,
    );
    const y: number = place(reference).y;
    if (
      !reference.solid ||
      y < Math.min(...heights) - 1e-9 ||
      y > Math.max(...heights) + 1e-9
    )
      complaints.push(
        `three builds: the meeting is ${reference.solid ? "solid" : "not solid"} with its contact at ${y.toFixed(3)} m, solid and between ${Math.min(...heights).toFixed(3)} and ${Math.max(...heights).toFixed(3)} m expected`,
      );
  }

  // 3. Three of one body meet on the middle.
  const average: IHumanBody = motionHumanBody("m-average");
  const even: AutoMovieMotionMeeting.IMeeting | undefined = read(
    [average, average, average],
    SUBJECTS,
  ).get("a");
  if (even === undefined) complaints.push("three of one body: a read nothing");
  else {
    const at: IAutoMovieVector3 = place(even);
    if (
      Math.hypot(at.x, at.z) > 1e-6 ||
      Math.abs(at.y - SHARE * average.measure.stature) > 1e-6
    )
      complaints.push(
        `three of one body: the contact lies ${(Math.hypot(at.x, at.z) * 1000).toFixed(4)} mm from the triangle's middle at ${at.y.toFixed(4)} m, on the middle at ${(SHARE * average.measure.stature).toFixed(4)} m expected`,
      );
  }

  // 4. A role missing from the cast.
  for (const [subject, meeting] of read(mixed, ["a", "b"]))
    if (meeting.solid)
      complaints.push(
        `two of three roles present: ${subject} read a solid meeting, not solid expected`,
      );

  TestValidator.equals("three roles read one meeting", complaints, []);
}
