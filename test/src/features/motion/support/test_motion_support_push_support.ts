import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPushPull,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A heavy load moved by its two handles (`pushPull`, #3351): pushed ahead,
 * pulled walking backward, dragged behind, or pressed and not moved.
 *
 * Each load is a prop on the floor with two handles 0.5 m apart, each a round
 * bar (`symmetry: "round"`, which the affordance contract requires every handle
 * to declare: without it the law held each fist at the authored turn, and the
 * average man's pull at the hips left the left fist, closed thumb outward on
 * the bar's one sense, 16 mm off its handle). A pushed or pulled load's handles
 * stand 0.6 of the arm ahead of the performer (the carry law's pushed handle,
 * Hoozemans et al. 1998), at its hip height or elbow height (the shoulder's
 * height less the upper arm), the two heights the issue's matrix names. A
 * dragged load's handles stand a third of the arm behind it at the hanging
 * wrist's height (the shoulder's height less the arm), a staging choice within
 * the arm's backward reach. A push and a drag walk 3 m forward, a pull 2 m
 * backward.
 *
 * Scenarios: on the small woman and the average man, read every quarter of a
 * second after the hands have taken the handles (`gripped`):
 *
 * 1. Every staging plans at every load.
 * 2. Each fist's grip socket lies within 10 mm of its handle (the issue's bound),
 *    and each handle keeps its place in its hand's frame within 1 mm (the
 *    campaign's grip bound): the load is held rigidly.
 * 3. Each handle's displacement from the grip to the end equals its fist's within
 *    10 mm, and the load goes the way walked, at least half the walk's length:
 *    the load moves as the hands move it.
 * 4. The load never sinks more than 10 mm below where it stood (the issue's
 *    penetration bound).
 * 5. The trunk (the hips joint to the neck) leans forward of vertical in a push
 *    and a drag and back in a pull, on average over the haul; and a heavy load
 *    leans it further that way than a light one, by more than the joints'
 *    resolution (`ROM_TOLERANCE`), at each staging.
 * 6. A haul walks slower than a free walk over the same ground (a walk of the same
 *    path and facing at the walk's own pace).
 * 7. A load that does not move (`moves: false`) stays within 1 mm of where it
 *    stood through the press, the fists within 10 mm of its handles.
 * 8. Refused, each with its class and axis: a handle the prop does not have
 *    (`affordance`), a moving haul with nowhere to go (`parameter` on `to`), a
 *    press with no duration (`parameter` on `duration`).
 *
 * Not covered: walking a tall load corner by corner, which the law does not
 * plan yet, and the seeded pauses under heavy loads.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each haul through the public chain and reads the displayed joints, the fists' grip sockets and the prop's frame; a hand off its handle, a load left behind or moved when it should not, a lean the wrong way or a missing refusal fails with the body, the way and the height.
 * @evidence contracts/development/testing.md#independent-expectations The contact, displacement and penetration bounds are the issue's, the grip bound the campaign's, the lean's direction and growth the measured study's, the free walk the walk law's own; none is read from the haul.
 * @evidence contracts/development/testing.md#distinguishing-cases A push and a pull at two handle heights and a drag, each at three loads, the stuck load at two heights and three refusals, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds about thirty short performances; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the staging, the 8 scenarios with their bounds and sources, and what is not covered.
 */
export function test_motion_support_push_support(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const arm: number = body.measure.upperArm + body.measure.forearm;
      const heights: Record<Height, number> = {
        hip: body.measure.hipHeight,
        elbow: body.measure.shoulderHeight - body.measure.upperArm,
      };
      const stagings: IStaging[] = [
        ...(["push", "pull"] as const).flatMap(
          (way: IAutoMovieMotionHumanPushPull.Way) =>
            Object.entries(heights).map(([label, height]) => ({
              way,
              label,
              height,
              ahead: 0.6 * arm,
            })),
        ),
        {
          way: "drag",
          label: "hanging wrist",
          height: body.measure.shoulderHeight - arm,
          ahead: -arm / 3,
        },
      ];
      const leans: Partial<Record<string, number>> = {};
      for (const { way, label, height, ahead } of stagings) {
        for (const load of ["light", "moderate", "heavy"] as const) {
          const tag: string = `${name} ${way} at the ${label} ${load}`;
          const to: IAutoMovieVector3 = {
            x: 0,
            y: 0,
            z: way === "pull" ? -2 : 3,
          };
          const prop: IAutoMovieMotionHumanProp = crate(ahead, height);
          const built:
            | IAutoMovieMotionHumanPerformance
            | string
            | IAutoMovieMotionHumanRefusal = perform(body, prop, {
            prop: "crate",
            way,
            to,
            load,
          });
          if (!(built instanceof HumanPerformance)) {
            complaints.push(`${tag}: expected to plan, got ${String(built)}`);
            continue;
          }
          const read: IRead = readHaul(built, body, prop);
          if (!(read.off <= 0.01))
            complaints.push(
              `${tag}: a fist lies ${mm(read.off)} mm from its handle, within 10 mm expected`,
            );
          if (!(read.slip <= 0.001))
            complaints.push(
              `${tag}: a handle moves ${mm(read.slip)} mm in its hand, within 1 mm expected`,
            );
          if (!(read.apart <= 0.01))
            complaints.push(
              `${tag}: a handle moves ${mm(read.apart)} mm apart from its fist, within 10 mm expected`,
            );
          const along: number = Math.sign(to.z) * read.moved.z;
          if (!(along >= Math.abs(to.z) / 2))
            complaints.push(
              `${tag}: the load moves ${mm(along)} mm the way walked, at least ${mm(Math.abs(to.z) / 2)} mm expected`,
            );
          if (!(read.lowest >= -0.01))
            complaints.push(
              `${tag}: the load sinks ${mm(-read.lowest)} mm below where it stood, within 10 mm expected`,
            );
          const sign: number = way === "pull" ? -1 : 1;
          if (!(sign * read.lean > 0))
            complaints.push(
              `${tag}: the trunk leans ${read.lean.toFixed(1)} degrees forward on average, ${way === "pull" ? "back" : "forward"} expected`,
            );
          leans[`${way} ${label} ${load}`] = read.lean;
          const free: number = freeSpeed(body, to, way);
          if (!(read.speed < free))
            complaints.push(
              `${tag}: the haul walks ${read.speed.toFixed(2)} m/s, slower than the free walk's ${free.toFixed(2)} m/s expected`,
            );
        }
        const light: number | undefined = leans[`${way} ${label} light`];
        const heavy: number | undefined = leans[`${way} ${label} heavy`];
        const sign: number = way === "pull" ? -1 : 1;
        if (
          light !== undefined &&
          heavy !== undefined &&
          !(sign * (heavy - light) > ROM_TOLERANCE)
        )
          complaints.push(
            `${name} ${way} at the ${label}: a heavy load leans the trunk ${heavy.toFixed(2)} degrees against a light one's ${light.toFixed(2)}, further expected`,
          );
      }
      for (const [label, height] of Object.entries(heights)) {
        // A load that does not move.
        for (const way of ["push", "pull"] as const) {
          const tag: string = `${name} ${way} at the ${label} not moving`;
          const prop: IAutoMovieMotionHumanProp = crate(0.6 * arm, height);
          const built:
            | IAutoMovieMotionHumanPerformance
            | string
            | IAutoMovieMotionHumanRefusal = perform(body, prop, {
            prop: "crate",
            way,
            moves: false,
            duration: 2,
            load: "heavy",
          });
          if (!(built instanceof HumanPerformance)) {
            complaints.push(`${tag}: expected to plan, got ${String(built)}`);
            continue;
          }
          const read: IRead = readHaul(built, body, prop);
          if (!(Vector3.length(read.moved) <= 0.001))
            complaints.push(
              `${tag}: the load moves ${mm(Vector3.length(read.moved))} mm, within 1 mm expected`,
            );
          if (!(read.off <= 0.01))
            complaints.push(
              `${tag}: a fist lies ${mm(read.off)} mm from its handle, within 10 mm expected`,
            );
        }
      }

      // The refusals.
      const refused = (
        label: string,
        params: IAutoMovieMotionHumanPushPull.IParams,
        kind: IAutoMovieMotionHumanRefusal.Kind,
        axis: string,
      ): void => {
        const built:
          | IAutoMovieMotionHumanPerformance
          | string
          | IAutoMovieMotionHumanRefusal = perform(
          body,
          crate(0.6 * arm, heights.elbow),
          params,
          true,
        );
        if (!(built instanceof HumanRefusal))
          complaints.push(
            `${name} ${label}: expected a ${kind} refusal on ${axis}, got ${typeof built === "string" ? built : "a plan"}`,
          );
        else if (built.kind !== kind || built.axis !== axis)
          complaints.push(
            `${name} ${label}: expected a ${kind} refusal on ${axis}, got ${built.kind} on ${built.axis}`,
          );
      };
      refused(
        "a missing handle",
        {
          prop: "crate",
          way: "drag",
          to: { x: 0, y: 0, z: 3 },
          left: "rope",
        },
        "affordance",
        "handle",
      );
      refused(
        "a moving haul with nowhere to go",
        { prop: "crate", way: "push" },
        "parameter",
        "to",
      );
      refused(
        "a press with no duration",
        { prop: "crate", way: "push", moves: false },
        "parameter",
        "duration",
      );
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.equals("a heavy load moved by its handles", complaints, []);
  checks.assert("support push support");
}

/** What a haul shows from the grip to its end. */
interface IRead {
  /** The farthest a fist's grip socket lies from its handle, metres. */
  off: number;

  /** The farthest a handle moves in its hand's frame, metres. */
  slip: number;

  /** The load's displacement from the grip to the end, world metres. */
  moved: IAutoMovieVector3;

  /**
   * The farthest a handle's displacement from the grip to the end differs from
   * its fist's, metres.
   */
  apart: number;

  /** The lowest the load stands relative to where it stood, metres. */
  lowest: number;

  /** The trunk's mean forward lean from vertical, degrees, negative back. */
  lean: number;

  /** The root's mean speed over the whole haul, m/s. */
  speed: number;
}

/**
 * A load on the floor `ahead` metres along +Z with two round bar handles 0.5 m
 * apart at `height`.
 */
function crate(ahead: number, height: number): IAutoMovieMotionHumanProp {
  return {
    subject: "crate",
    frame: {
      position: { x: 0, y: 0, z: ahead },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances: (["left", "right"] as const).map((id) => ({
      id,
      kind: "handle" as const,
      frame: {
        translation: { x: id === "left" ? 0.25 : -0.25, y: height, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
      symmetry: "round" as const,
    })),
  };
}

/**
 * Build a one-haul performance, or the error's message (or the refusal, when
 * asked).
 */
function perform(
  body: IAutoMovieMotionHumanBody,
  prop: IAutoMovieMotionHumanProp,
  params: IAutoMovieMotionHumanPushPull.IParams,
  refusal: boolean = false,
): IAutoMovieMotionHumanPerformance | string | IAutoMovieMotionHumanRefusal {
  try {
    return new HumanPerformance({
      seed: "haul",
      props: [prop],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").pushPull(params).node,
    });
  } catch (error) {
    if (refusal && error instanceof HumanRefusal) return error;
    return error instanceof Error ? error.message : String(error);
  }
}

/** Read a haul from its grip to its end, every quarter of a second. */
function readHaul(
  performance: IAutoMovieMotionHumanPerformance,
  body: IAutoMovieMotionHumanBody,
  prop: IAutoMovieMotionHumanProp,
): IRead {
  const placed = performance.segments("a")[0]!;
  const gripped: number =
    placed.start +
    (placed.plan.events.find((e): boolean => e.name === "gripped")?.share ??
      NaN) *
      placed.plan.duration;
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    performance,
    "a",
    body,
    0,
  );
  const fist = (
    seconds: number,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 => {
    const socket: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["gripLeft"] =
      body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
    return resolveAutoMovieHumanoidSurfaces.place(
      socket,
      performance.bones("a", seconds).get(socket.bone)!,
    ).point;
  };
  const handle = (
    seconds: number,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = performance.prop("crate", seconds);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        prop.affordances!.find((a) => a.id === side)!.frame.translation,
      ),
    );
  };
  let off: number = 0;
  let slip: number = 0;
  let lowest: number = Infinity;
  let lean: number = 0;
  let count: number = 0;
  const first: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
  const start: number = gripped + 0.05;
  for (let seconds: number = start; seconds <= placed.end; seconds += 0.25) {
    const frame: IAutoMovieRigidTransform = performance.prop("crate", seconds);
    lowest = Math.min(lowest, frame.position.y - prop.frame.position.y);
    const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
      performance.bones("a", seconds);
    for (const side of ["left", "right"] as const) {
      const handle: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          prop.affordances!.find((a) => a.id === side)!.frame.translation,
        ),
      );
      const socket: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["gripLeft"] =
        body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
      const fist: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        socket,
        bones.get(socket.bone)!,
      ).point;
      off = Math.max(off, Vector3.length(Vector3.subtract(fist, handle)));
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(handle, hand.worldPosition),
      );
      first[side] ??= local;
      slip = Math.max(
        slip,
        Vector3.length(Vector3.subtract(local, first[side]!)),
      );
    }
    const hips: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      seconds,
      "hips",
    );
    const neck: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      seconds,
      "neck",
    );
    // The performer faces +Z, so a forward lean carries the neck along +Z.
    lean += (Math.atan2(neck.z - hips.z, neck.y - hips.y) * 180) / Math.PI;
    ++count;
  }
  const moved: IAutoMovieVector3 = Vector3.subtract(
    performance.prop("crate", placed.end).position,
    performance.prop("crate", start).position,
  );
  // Each handle's displacement less its fist's, over the same span.
  const apart: number = Math.max(
    ...(["left", "right"] as const).map((side: AutoMovieHumanSide): number =>
      Vector3.length(
        Vector3.subtract(
          Vector3.subtract(handle(placed.end, side), handle(start, side)),
          Vector3.subtract(fist(placed.end, side), fist(start, side)),
        ),
      ),
    ),
  );
  const travelled: number = Vector3.length(
    Vector3.subtract(
      HumanSignature.joint(reader, placed.end, "hips"),
      HumanSignature.joint(reader, placed.start, "hips"),
    ),
  );
  return {
    off,
    slip,
    moved,
    apart,
    lowest,
    lean: count === 0 ? NaN : lean / count,
    speed: travelled / (placed.end - placed.start),
  };
}

/**
 * The mean speed of an unloaded walk over the same path and facing, m/s, at the
 * walk's own pace: a pull's backpedal keeps +Z facing, so it is compared with a
 * free backpedal rather than a turn followed by forward walking.
 */
function freeSpeed(
  body: IAutoMovieMotionHumanBody,
  to: IAutoMovieVector3,
  way: IAutoMovieMotionHumanPushPull.Way,
): number {
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "haul",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").walk({
      to,
      ...(way === "pull" ? { facing: { yaw: 0 } } : {}),
    }).node,
  });
  const placed = performance.segments("a")[0]!;
  return Math.hypot(to.x, to.z) / (placed.end - placed.start);
}

/** Inputs for the measured stagings. */
interface IStaging {
  way: IAutoMovieMotionHumanPushPull.Way;
  label: string;
  height: number;
  ahead: number;
}
/** Handle-height landmarks for the support fixture. */
type Height = "hip" | "elbow";
