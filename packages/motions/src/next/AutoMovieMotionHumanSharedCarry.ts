import {
  AutoMovieEngineMotionSampling,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSharedCarry,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanChain } from "../chain/AutoMovieMotionHumanChain";
import { motionHumanSharedCarry } from "../compose/internal/motionHumanSharedCarry";
import { ExerciseKey } from "../exercise/internal/ExerciseKey";
import { AutoMovieMotionHumanRefusal } from "../law/AutoMovieMotionHumanRefusal";
import { AutoMovieMotionHumanPerformance } from "../perform/AutoMovieMotionHumanPerformance";
import { HumanPropFrame } from "../perform/internal/HumanPropFrame";
import { HumanFoot } from "../posture/internal/HumanFoot";
import { HumanHand } from "../posture/internal/HumanHand";
import { HumanMaterialContact } from "../posture/internal/HumanMaterialContact";
import { mixHumanPosture } from "../posture/internal/mixHumanPosture";

/**
 * A stock episode stages two grounded actors taking the opposite round handles
 * of a rigid carton, carrying it on a short course, then setting it down and
 * opening their hands at separate authored times.
 */
export namespace AutoMovieMotionHumanSharedCarry {
  /**
   * Prepare the independent pickups, the common rigid course, and both release
   * poses on the same film clock. Start both returned chains at film zero.
   * Append ordinary follow-up actions to either chain.
   *
   * @param input The carton, both actors, supporting faces and course.
   * @returns Two role chains, their law, and the episode to register with the
   *   performance's `sharedCarry` input.
   * @throws {AutoMovieMotionHumanRefusal} When a role, material fit, reach,
   *   duration, or placed grip cannot support the authored course.
   */
  export function stage(
    input: IAutoMovieMotionHumanSharedCarry.IStage,
  ): IAutoMovieMotionHumanSharedCarry.IStaged {
    const { prop, carriers, course } = input;
    if (input.id.length === 0)
      throw refusal("id", "name the shared carry episode");
    if (
      carriers[0].performer.subject === carriers[1].performer.subject ||
      carriers[0].handle === carriers[1].handle
    ) {
      throw refusal("carriers", "use two actors on distinct named handles");
    }
    const box = prop.shapes?.find((shape) => shape.kind === "box");
    if (box === undefined)
      throw refusal("prop", "the carried prop needs a rigid box collider");
    for (const [role, value] of [
      ["duration", course.duration],
      ["rise", course.rise],
    ] as const)
      if (!Number.isFinite(value) || value <= 0)
        throw refusal(
          role,
          "give a positive finite value for the carry course",
        );
    if (course.duration > 5)
      throw refusal(
        "duration",
        "the prepared carry spans at most five seconds",
      );
    const home = staticSupport(input.start);
    const receiver = staticSupport(input.end);
    fit(box, prop.frame, home, input.start.point, 0);
    fit(box, course.to, receiver, input.end.point, 0);

    const first = acquire(input.seed, input.id, prop, carriers[0]);
    const second = acquire(input.seed, input.id, prop, carriers[1]);
    const actors: readonly [IAcquisition, IAcquisition] = [first, second];
    const from = Math.min(first.closed, second.closed);
    const lift = Math.max(first.closed, second.closed);
    const settled = lift + course.duration;
    const path = (seconds: number): IAutoMovieRigidTransform => {
      if (seconds <= lift) return prop.frame;
      if (seconds >= settled) return course.to;
      const share = (seconds - lift) / course.duration;
      const position = AutoMovieEngineVector3.lerp(
        prop.frame.position,
        course.to.position,
        share,
      );
      return {
        position: {
          ...position,
          y: position.y + course.rise * Math.sin(Math.PI * share),
        },
        rotation: AutoMovieEngineQuaternion.slerp(
          prop.frame.rotation,
          course.to.rotation,
          share,
        ),
      };
    };
    // The solver uses each actual grip socket in the prop frame. The
    // original model's named contact remains the centre of its material rail.
    const points = { ...prop.points };
    for (const actor of actors)
      points[actor.role.handle] = {
        ...points[actor.role.handle]!,
        point: actor.grip.position,
      };
    const carried = prepareCourse({
      prop: { ...prop, points },
      carriers: [carrier(first), carrier(second)],
      from: lift,
      to: settled,
      path,
    });
    const roles: IAutoMovieMotionHumanSharedCarry.IPreparedEpisode["roles"] = [
      placed(first, settled),
      placed(second, settled),
    ];
    const episode: IAutoMovieMotionHumanSharedCarry.IPreparedEpisode = {
      prop: prop.subject,
      from,
      settled,
      to: Math.max(roles[0].to, roles[1].to),
      frame: path,
      roles,
    };
    const name = "sharedCarry/" + input.id;
    const law: IAutoMovieMotionHumanActionLaw = {
      name,
      interrupts: {},
      plan: (context) => {
        const i =
          context.subject === roles[0].subject
            ? 0
            : context.subject === roles[1].subject
              ? 1
              : undefined;
        if (i === undefined)
          throw refusal(
            "carriers",
            "assign the law to one of the prepared actors",
          );
        if (i === 0) {
          const actual = context
            .prop(prop.subject)
            .prop.shapes?.find((shape) => shape.kind === "box");
          if (actual === undefined)
            throw refusal(
              "prop",
              "supply the rigid carton collider in the placed scene",
            );
          fit(
            actual,
            prop.frame,
            context.prop(input.start.prop.subject),
            input.start.point,
            0,
          );
          fit(
            actual,
            course.to,
            context.prop(input.end.prop.subject),
            input.end.point,
            settled,
          );
        }
        return rolePlan(
          context,
          actors[i],
          roles[i],
          episode,
          lift,
          carried.postures[i],
        );
      },
    };
    return {
      episode,
      law,
      chains: [
        AutoMovieMotionHumanChain.subject(roles[0].subject).registered(
          name,
          {},
          roles[0].anchor,
        ),
        AutoMovieMotionHumanChain.subject(roles[1].subject).registered(
          name,
          {},
          roles[1].anchor,
        ),
      ],
    };
  }
}

type Capsule = Extract<IAutoMoviePhysicalShape, { kind: "capsule" }>;
type Box = Extract<IAutoMoviePhysicalShape, { kind: "box" }>;
interface IAcquisition {
  role: IAutoMovieMotionHumanSharedCarry.IStageRole;
  film: AutoMovieMotionHumanPerformance;
  anchor: string;
  closed: number;
  base: IAutoMovieMotionHumanPosture;
  grip: IAutoMovieRigidTransform;
}

function acquire(
  seed: string,
  id: string,
  prop: IAutoMovieMotionHumanProp,
  role: IAutoMovieMotionHumanSharedCarry.IStageRole,
): IAcquisition {
  const { performer, hand, handle } = role;
  const wait = role.wait ?? 0;
  const releaseAfter = role.releaseAfter ?? 0.08;
  if (
    !Number.isFinite(wait) ||
    wait < 0 ||
    !Number.isFinite(releaseAfter) ||
    releaseAfter < 0
  )
    throw refusal("clock", "give non-negative finite waits and release times");
  const rail = materialRail(prop, handle);
  if (rail === undefined)
    throw refusal(
      "handle",
      "name a round handle centred on its material collider",
    );
  let action: IAutoMovieMotionHumanChain = AutoMovieMotionHumanChain.subject(
    performer.subject,
  );
  if (wait > 0) action = action.stand({ hold: wait });
  const film = new AutoMovieMotionHumanPerformance({
    seed,
    performers: [performer],
    props: [{ ...prop, motion: () => prop.frame }],
    composition: action
      .pickUp({ prop: prop.subject, handle, hand, lift: 0 }, "acquire")
      .stand({ hold: 0.2 }).node,
  });
  const closed = film.instant({ of: "acquire", event: "gripClosed" });
  const bones = film.bones(performer.subject, closed);
  requirePads(role, rail, prop.frame, bones);
  for (const side of ["left", "right"] as const) {
    const ankle = bones.get(side === "left" ? "leftFoot" : "rightFoot")!;
    const sole = HumanFoot.sole(performer.body, side, {
      ankle: ankle.worldPosition,
      rotation: ankle.worldRotation,
    });
    if (
      Math.abs(Math.min(...sole.map(({ y }) => y)) - performer.at.y) > PAD_LIMIT
    )
      throw refusal("support", "both carriers need settled feet at closure");
  }
  const grip = HumanPropFrame.relative(prop.frame, {
    position: HumanHand.frame(performer.body, bones, hand, "grip").point,
    rotation: bones.get(hand === "left" ? "leftHand" : "rightHand")!
      .worldRotation,
  });
  return {
    role,
    film,
    anchor: id + "/" + performer.subject,
    closed,
    base: displayed(film, performer.subject, closed),
    grip,
  };
}

function materialRail(
  prop: IAutoMovieMotionHumanProp,
  handle: string,
): Capsule | undefined {
  const point = prop.points[handle]?.point;
  const contact = prop.affordances?.find((item) => item.id === handle);
  if (
    point === undefined ||
    contact?.kind !== "handle" ||
    contact.symmetry !== "round"
  )
    return undefined;
  return prop.shapes?.find(
    (shape): shape is Capsule =>
      shape.kind === "capsule" &&
      Math.abs((contact.aperture ?? 0) - shape.radius * 2) < EPSILON &&
      AutoMovieEngineVector3.distance(point, shape.transform.position) <
        EPSILON,
  );
}

function prepareCourse(
  input: IAutoMovieMotionHumanSharedCarry.IInput,
): IAutoMovieMotionHumanSharedCarry.IPrepared {
  try {
    return motionHumanSharedCarry(input);
  } catch (error: unknown) {
    if (error instanceof RangeError) throw refusal("course", error.message);
    throw error;
  }
}

function displayed(
  film: AutoMovieMotionHumanPerformance,
  subject: string,
  seconds: number,
): IAutoMovieMotionHumanPosture {
  const raw = film.posture(subject, seconds);
  return {
    ...raw,
    limbs: {},
    joints: ExerciseKey.shown(film.pose(subject, seconds)).joints,
  };
}

function carrier(
  actor: IAcquisition,
): IAutoMovieMotionHumanSharedCarry.ICarrier {
  return {
    performer: actor.role.performer,
    side: actor.role.hand,
    site: actor.role.handle,
    rotation: actor.grip.rotation,
    posture: () => actor.base,
  };
}

function placed(
  actor: IAcquisition,
  settled: number,
): IAutoMovieMotionHumanSharedCarry.IPreparedRole {
  return {
    subject: actor.role.performer.subject,
    hand: actor.role.hand,
    handle: actor.role.handle,
    anchor: actor.anchor,
    from: actor.closed,
    to: settled + (actor.role.releaseAfter ?? 0.08),
  };
}

function rolePlan(
  context: IAutoMovieMotionHumanActionContext,
  actor: IAcquisition,
  role: IAutoMovieMotionHumanSharedCarry.IPreparedRole,
  episode: IAutoMovieMotionHumanSharedCarry.IPreparedEpisode,
  lift: number,
  carried: IAutoMovieMotionHumanSharedCarry.ICarrier["posture"],
): IAutoMovieMotionHumanActionPlan {
  if (
    Math.abs(context.start) > EPSILON ||
    context.body !== actor.role.performer.body
  )
    throw refusal(
      "clock",
      "start each staged chain at film zero with its prepared body",
    );
  const duration = role.to + WITHDRAW;
  const prop = context.prop(episode.prop);
  const rail = materialRail(prop.prop, role.handle);
  if (rail === undefined)
    throw refusal("handle", "use the named material rail in the placed scene");
  const placedPose = carried(episode.settled);
  const joints = { ...placedPose.joints };
  for (const [bone, angles] of Object.entries(
    ExerciseKey.standing(context.body).joints,
  )) {
    if (
      bone.startsWith(role.hand) &&
      /^(Shoulder|UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(
        bone.slice(role.hand.length),
      )
    )
      joints[bone as AutoMovieHumanoidBone] = angles;
  }
  const loose = { ...placedPose, joints };
  const feet: IAutoMovieMotionHumanContactWindow[] = [];
  for (const segment of actor.film.segments(role.subject))
    for (const contact of segment.plan.contacts) {
      if (contact.kind !== "plant") continue;
      const from = Math.max(
        segment.entryTime,
        segment.start + contact.from * segment.plan.duration,
      );
      const to = Math.min(
        role.from,
        segment.end,
        segment.start + contact.to * segment.plan.duration,
      );
      if (from < to)
        feet.push({ ...contact, from: from / duration, to: to / duration });
    }
  for (const part of ["leftFoot", "rightFoot"] as const)
    feet.push({
      part,
      kind: "plant",
      from: role.from / duration,
      to: 1,
      support: { kind: "ground" },
    });
  return {
    duration,
    contacts: [
      ...feet,
      {
        part: role.hand === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        from: role.from / duration,
        to: role.to / duration,
        support: { kind: "prop", subject: episode.prop, point: role.handle },
      },
    ],
    events: [
      { name: "gripClosed", share: role.from / duration },
      { name: "lift", share: lift / duration },
      { name: "settled", share: episode.settled / duration },
      { name: "release", share: role.to / duration },
      { name: "relax", share: 1 },
    ],
    posture: (seconds) => {
      if (seconds < role.from)
        return displayed(actor.film, role.subject, seconds);
      if (seconds <= lift) return actor.base;
      if (seconds <= episode.settled) return carried(seconds);
      if (seconds <= role.to) return placedPose;
      return mixHumanPosture(
        placedPose,
        loose,
        AutoMovieEngineMotionSampling.minimumJerkShare(
          Math.min(1, (seconds - role.to) / WITHDRAW),
        ),
      );
    },
    verifyDisplayed: (bones, span) => {
      if (
        span !== undefined &&
        (span.entryTime > role.from + EPSILON || span.end < role.to - EPSILON)
      )
        throw refusal(
          "clock",
          "keep both staged grip and release cues in their realized spans",
        );
      const check = (seconds: number): void => {
        const actual = prop.frame(seconds);
        const expected = episode.frame(seconds);
        if (
          AutoMovieEngineVector3.distance(actual.position, expected.position) >
            EPSILON ||
          AutoMovieEngineQuaternion.angle(actual.rotation, expected.rotation) >
            0.001
        ) {
          throw refusal(
            "prop",
            "register the staged frame for the whole played grip interval",
          );
        }
        requirePads(actor.role, rail, actual, bones(seconds));
      };
      check(role.from);
      check(role.to);
      const spanSeconds = episode.settled - lift;
      const samples = Math.ceil(spanSeconds * 24);
      for (let i = 0; i <= samples; ++i)
        check(lift + (spanSeconds * i) / samples);
    },
  };
}

function staticSupport(
  contact: IAutoMovieMotionHumanSharedCarry.IStageSupport,
): IAutoMovieMotionHumanPropReader {
  return { prop: contact.prop, frame: () => contact.prop.frame };
}

function fit(
  box: Box,
  frame: IAutoMovieRigidTransform,
  support: IAutoMovieMotionHumanPropReader,
  point: string,
  seconds: number,
): void {
  const face =
    support.prop.fixed === true
      ? HumanMaterialContact.prepare(support, point, seconds)?.at(seconds)
      : undefined;
  if (face === undefined)
    throw refusal(
      "support",
      "name a fixed receiver with a finite material face",
    );
  const posed = HumanPropFrame.compose(frame, box.transform);
  for (const x of [-box.halfExtents.x, box.halfExtents.x])
    for (const z of [-box.halfExtents.z, box.halfExtents.z]) {
      const corner = AutoMovieEngineVector3.add(
        posed.position,
        AutoMovieEngineQuaternion.rotateVector(posed.rotation, {
          x,
          y: -box.halfExtents.y,
          z,
        }),
      );
      const result = HumanMaterialContact.point(face, corner);
      if (result === undefined || Math.abs(result.clearance) > PAD_LIMIT)
        throw refusal(
          "support",
          "land all four bottom corners on the finite receiving face",
        );
    }
}

function requirePads(
  role: IAutoMovieMotionHumanSharedCarry.IStageRole,
  rail: Capsule,
  frame: IAutoMovieRigidTransform,
  bones: ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]>,
): void {
  const posed = HumanPropFrame.compose(frame, rail.transform);
  const inverse = AutoMovieEngineQuaternion.inverse(posed.rotation);
  for (const pad of ["indexPad", "middlePad"] as const) {
    const point = HumanHand.frame(
      role.performer.body,
      bones,
      role.hand,
      pad,
    ).point;
    const local = AutoMovieEngineQuaternion.rotateVector(
      inverse,
      AutoMovieEngineVector3.subtract(point, posed.position),
    );
    const gap =
      Math.hypot(
        local.x,
        local.z,
        Math.max(0, Math.abs(local.y) - rail.halfLength),
      ) - rail.radius;
    if (Math.abs(gap) > PAD_LIMIT)
      throw refusal(
        "grip",
        "keep both displayed finger pads on " + role.handle,
      );
  }
}

function refusal(axis: string, reason: string): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis,
    value: null,
    reason,
    fix: "adjust the authored participants, material contact or course",
  });
}

const PAD_LIMIT = 0.004;
const WITHDRAW = 0.28;
const EPSILON = 1e-6;
