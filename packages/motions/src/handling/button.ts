import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanButton,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operateDrive } from "../affordance/operateDrive";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateShape } from "./manipulateShape";

/**
 * Brace a fixed garment's rim with the index finger while the opposite thumb
 * pushes its button through the opening. Register as `button`. The same stroke
 * clock moves the button mesh and places the thumb; the drive leaves the button
 * through the panel when the hands leave. A rigid straight slider and authored
 * bounding sphere approximate the closure without cloth dynamics.
 */
export const button: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanButton> =
  {
    name: "button",
    interrupts: {
      any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/**
 * Admit the model and its passage, then plan the two reaching hands together.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanButton>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanButton = context.params;
  if (
    !Number.isFinite(p.travel) ||
    p.travel === 0 ||
    ![p.radius, p.thickness, p.duration].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "travel",
      value: p.travel,
      reason:
        "buttoning needs a finite nonzero travel and positive finite dimensions and duration",
      fix: "give the measured slider travel, sphere radius, panel thickness and push duration",
    });
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.garment);
  const model: IAutoMovieMotionHumanPropReader["prop"] = reader.prop;
  if (
    model.fixed !== true ||
    model.worn !== undefined ||
    model.motion !== undefined ||
    model.articulate === undefined
  )
    throw garmentRefusal(
      p.garment,
      "buttoning needs a stationary articulated garment",
      "stage a fixed garment model with a button slider",
    );

  const opening: IAutoMovieAffordance = site(model.affordances, p.opening);
  const rim: IAutoMovieAffordance = site(model.affordances, p.rim);
  const center: IAutoMovieAffordance = site(model.affordances, p.button);
  const push: IAutoMovieAffordance = site(model.affordances, p.contact);
  const slider: IAutoMovieAffordance | undefined = model.affordances?.find(
    (candidate: IAutoMovieAffordance): boolean => candidate.id === center.rides,
  );
  if (
    slider?.kind !== "slider" ||
    slider.rides !== undefined ||
    slider.follows !== undefined ||
    (slider.parts?.length ?? 0) === 0 ||
    push.rides !== slider.id ||
    push.id === center.id ||
    opening.rides !== undefined ||
    rim.rides !== undefined ||
    opening.kind !== "aperture" ||
    !positive(opening.width) ||
    !positive(opening.height)
  )
    throw garmentRefusal(
      p.garment,
      "the opening and rim must be stationary and both button sites must ride one straight, independent geometry slider",
      "bind the button geometry and both button sites to that slider and declare the aperture's clear width and height",
    );

  const moving: IAutoMovieMotionHumanOperateDrive.IPart = part(
    context,
    center.id,
  );
  const working: IAutoMovieMotionHumanOperateDrive.IPart = part(
    context,
    push.id,
  );
  const frame: IAutoMovieRigidTransform = reader.frame(context.start);
  const mouth: IAutoMovieMotionHumanOperateDrive.IPlace = place(frame, opening);
  const support: IAutoMovieMotionHumanOperateDrive.IPlace = place(frame, rim);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    Quaternion.multiply(frame.rotation, opening.frame.rotation),
  );
  const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(inverse, Vector3.subtract(point, mouth.point));
  let start: IAutoMovieVector3;
  let end: IAutoMovieVector3;
  try {
    start = local(moving.place(0).point);
    end = local(moving.place(1).point);
  } catch (error: unknown) {
    throw garmentRefusal(
      p.garment,
      `the button slider refuses its travel: ${(error as Error).message}`,
      "set the requested end inside the authored slider range",
    );
  }

  // In the aperture frame the sphere meets the panel only within this
  // expanded slab. Its planar projection must clear both sides of the hole
  // at each end of the interval, which bounds the full straight segment.
  const clearance: number = p.thickness / 2 + p.radius;
  const front: IAutoMovieVector3 = start.z > end.z ? start : end;
  const back: IAutoMovieVector3 = front === start ? end : start;
  if (
    !(front.z > clearance && back.z < -clearance) ||
    ![clearance, -clearance].every((z: number): boolean => {
      const point: IAutoMovieVector3 = Vector3.lerp(
        front,
        back,
        (front.z - z) / (front.z - back.z),
      );
      return (
        Math.abs(point.x) + p.radius < opening.width! / 2 &&
        point.y > p.radius &&
        point.y + p.radius < opening.height!
      );
    })
  )
    throw garmentRefusal(
      p.garment,
      "the whole button does not clear both faces through the aperture",
      "align the slider with the opening, give it enough travel, or enlarge the clear opening",
    );

  const face: IAutoMovieMotionHumanOperateDrive.IPlace = working.place(0);
  const advance: IAutoMovieVector3 = Vector3.subtract(end, start);
  const offset: IAutoMovieVector3 = Vector3.subtract(local(face.point), start);
  if (
    !(Vector3.length(offset) <= p.radius + 1e-9) ||
    !(Vector3.dot(offset, advance) < 0) ||
    !(Vector3.dot(Quaternion.rotateVector(inverse, face.normal), advance) < 0)
  )
    throw garmentRefusal(
      p.garment,
      "the working contact does not face the approaching hand on the trailing button surface",
      "place and orient the thumb site on the back of the button relative to its travel",
    );

  const side: AutoMovieHumanSide = p.hand ?? "right";
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const tempo: number = context.tempo ?? 1;
  const stroke: number = tempo * p.duration;
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const motion: number = Math.max(
    Vector3.length(
      Vector3.subtract(face.point, bones.get(`${side}Hand`)!.worldPosition),
    ),
    Vector3.length(
      Vector3.subtract(support.point, bones.get(`${other}Hand`)!.worldPosition),
    ),
  );
  const transport: number =
    tempo * AutoMovieMotionHumanTiming.transport(motion);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: transport,
    attack: stroke,
    retract: transport,
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const target = (seconds: number): IAutoMovieMotionHumanOperateDrive.IPlace =>
    working.place(clock.progress("strokeStart", "strokeEnd", seconds));
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const arms: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArm.together(context.handover, true, tempo);
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [
        ...fingers(context, clock, side, "thumb", target, arms),
        ...fingers(context, clock, other, "index", () => support, arms),
      ],
      contact: "strokeEnd",
    });
  return {
    ...composed,
    hands: [side, other],
    drives: [operateDrive.drive(working, clock)],
    contacts: [
      ...composed.contacts,
      {
        part: `${other}Hand`,
        kind: "bear",
        region: other === "left" ? "indexTipLeft" : "indexTipRight",
        from: ready / clock.duration,
        to: done / clock.duration,
        support: { kind: "prop", subject: p.garment },
      },
    ],
  };
}

/** Resolve the world frame and start travel of one moving button site. */
function part(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanButton>,
  point: string,
): IAutoMovieMotionHumanOperateDrive.IPart {
  const p: IAutoMovieMotionHumanButton = context.params;
  const result: IAutoMovieMotionHumanOperateDrive.IPart | undefined =
    operateDrive.part(
      context,
      { kind: "prop", subject: p.garment, point },
      p.travel,
      "slider",
    );
  if (result === undefined)
    throw garmentRefusal(
      p.garment,
      `${point} does not ride a button slider`,
      "bind the button center and its thumb site to the slider",
    );
  return result;
}
/** The alternatives of `FingersDigit`'s site. */
type FingersDigit = "thumb" | "index";

/**
 * The arm seeds a flexed fingertip; the independent digit fit closes the
 * remaining contact error.
 */
function fingers(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanButton>,
  clock: IAutoMovieMotionClock,
  side: AutoMovieHumanSide,
  digit: FingersDigit,
  target: (seconds: number) => IAutoMovieMotionHumanOperateDrive.IPlace,
  together: IAutoMovieMotionHumanArmPlanned.ITogether,
): readonly IAutoMovieMotionHumanPrimitive[] {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const first: IAutoMovieMotionHumanOperateDrive.IPlace = target(0);
  const rotation: IAutoMovieQuaternion = manipulateFacing(
    context.entry.posture,
    [{ site: first.point, normal: first.normal, side }],
    side,
  );
  const offset: IAutoMovieVector3 = HumanHand.offset(
    body,
    side,
    `${digit}Tip`,
    "relaxed",
  ).point;
  const lever: IAutoMovieVector3 = Quaternion.rotateVector(rotation, offset);
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    context.entry.posture,
    side,
    0.1,
  );
  const ready: number = clock.at("strokeStart");
  const relax: number = clock.at("strokeEnd");
  const key: AutoMovieHumanDigit = `${side}${digit === "thumb" ? "Thumb" : "Index"}`;
  const shape: ReturnType<typeof manipulateShape> = manipulateShape(
    body,
    side,
    digit,
    Vector3.subtract(first.point, lever),
    rotation,
    first.point,
    first.normal,
  );
  const weight = (seconds: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  return [
    AutoMovieMotionHumanArm.carried({
      body,
      side,
      together,
      from: 0,
      to: clock.duration,
      span: { start: 0, ready, relax, end: clock.duration },
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      // The finger solves the exact site after wrist placement. Allow the
      // wrist proxy the keyed-contact tolerance while the arm stays clear.
      disc: 0.002,
      weight,
      goal: (
        _posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieHumanLimbGoal => ({
        point: Vector3.subtract(target(seconds).point, lever),
        rotation,
        contact: offset,
        bend,
      }),
    }),
    {
      from: 0,
      to: clock.duration,
      channels: [`${side}Hand`],
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        const share: number = weight(seconds);
        for (const bone of Object.keys(shape.joints) as AutoMovieHumanoidBone[])
          joints[bone] = blendHumanJoint(
            body,
            bone,
            joints[bone] ?? [0, 0, 0],
            shape.joints[bone]!,
            share,
          );
        if (seconds < ready || seconds > relax) return { ...posture, joints };
        const now: IAutoMovieMotionHumanOperateDrive.IPlace = target(seconds);
        return {
          ...posture,
          joints,
          digits: {
            ...posture.digits,
            ...shape.avoid,
            [key]: {
              point: now.point,
              normal: now.normal,
              surface: "tip",
              contact: true,
            },
          },
        };
      },
    },
  ];
}

/** The named authored site, with an explicit refusal if it does not exist. */
function site(
  affordances: readonly IAutoMovieAffordance[] | undefined,
  id: string,
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = affordances?.find(
    (candidate: IAutoMovieAffordance): boolean => candidate.id === id,
  );
  if (found === undefined)
    throw garmentRefusal(
      id,
      "the garment has no site with this id",
      "name one of its authored affordances",
    );
  return found;
}

/** A static affordance's world position and outward direction. */
function place(
  frame: IAutoMovieRigidTransform,
  affordance: IAutoMovieAffordance,
): IAutoMovieMotionHumanOperateDrive.IPlace {
  return {
    point: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
    ),
    normal: Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, affordance.frame.rotation),
      { x: 0, y: 1, z: 0 },
    ),
  };
}

/** A finite aperture dimension stated in metres. */
function positive(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0;
}

/** A garment model or closure the law cannot stage. */
function garmentRefusal(
  value: string,
  reason: string,
  fix: string,
): HumanRefusal {
  return new HumanRefusal({
    kind: "affordance",
    axis: "garment",
    value,
    reason,
    fix,
  });
}
