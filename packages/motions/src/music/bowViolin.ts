import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBowViolinParams,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { bowViolinGrip } from "./bowViolinGrip";
import { bowViolinHairAxis } from "./bowViolinHairAxis";
import { bowViolinStroke } from "./bowViolinStroke";

/** The bar frame's +X points from bridge to nut. */
const X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/** The outward axis of the violin's string bar. */
const Y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Raised clearance before and after the stroke in metres, provisional. */
const CLEARANCE: number = 0.035;

/** The record of `IBowViolin`'s site. */
type IBowViolin = {
  name: "bowViolin";
};

/**
 * One staged open-string violin stroke with a held bow. Register this law with
 * HumanChain.extend and HumanPerformance.laws. The bow moves to a raised ready
 * pose, lowers to contact, slides frog-to-tip or tip-to-frog during the stroke
 * and leaves the string after lift, still in the hand.
 *
 * The straight hair line is perpendicular to the selected string, following the
 * straight-stroke condition in Schoonderwaldt (2010, DOI 10.3813/AAA.918314).
 * The sounding point is one tenth of the bar's length from the bridge, as in
 * the range for a sustained note in Schoonderwaldt (2009, DOI
 * 10.1121/1.3203209, Fig. 1). The provisional stroke travels over 18–42% of the
 * playable hair. Inclination clears the other strings on the simplified
 * coplanar instrument. The performer moves the right arm and holds the same
 * grip throughout. The violin is staged as a fixed prop. This geometry models
 * contact only, with hair deflection and note acoustics outside the law.
 */
export const bowViolin: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBowViolinParams> &
  IBowViolin = {
  name: "bowViolin",
  overlay: true,
  interrupts: {},
  plan: planStroke,
};

/**
 * Place the bow from its held frame, then pose its hand on the four stroke
 * phases.
 */
function planStroke(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBowViolinParams>,
): IAutoMovieMotionHumanActionPlan {
  const {
    body,
    entry,
    params,
  }: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBowViolinParams> =
    context;
  const stroke: number = HumanBound.above(
    "duration",
    params.duration ?? 1,
    0,
    "s",
  );
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    "right",
    params.bow,
  );
  const violin: IAutoMovieMotionHumanPropReader = context.prop(params.violin);
  const bar: IAutoMovieAffordance | undefined = violin.prop.affordances?.find(
    (affordance: IAutoMovieAffordance): boolean =>
      affordance.id === params.string && affordance.kind === "bar",
  );
  if (
    !violin.prop.fixed ||
    violin.prop.motion !== undefined ||
    violin.prop.worn !== undefined
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "violin",
      value: params.violin,
      reason: "the bow stroke requires a fixed violin",
      fix: "stage the violin as a fixed prop at the bowing pose",
    });
  if (
    (params.string !== "string1" && params.string !== "string4") ||
    bar?.length === undefined ||
    !(bar.length > 0)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "string",
      value: params.string,
      reason: "the stroke needs a finite bar at an outer violin string",
      fix: "use string1 or string4 of createInstrument's violin",
    });

  const world: IAutoMovieRigidTransform = violin.frame(context.start);
  const axes: IAutoMovieQuaternion = Quaternion.multiply(
    world.rotation,
    bar.frame.rotation,
  );
  const longitudinal: IAutoMovieVector3 = Quaternion.rotateVector(axes, X);
  const outward: IAutoMovieVector3 = Quaternion.rotateVector(axes, Y);
  const contact: IAutoMovieVector3 = Vector3.add(
    Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, bar.frame.translation),
    ),
    Vector3.scale(longitudinal, -0.4 * bar.length),
  );

  // Across the instrument, the hair rises toward the other three strings.
  const hairAxis: IAutoMovieVector3 = bowViolinHairAxis(
    longitudinal,
    outward,
    params.string,
  );
  const frog: IAutoMovieMotionHumanHeld.IPointResult =
    AutoMovieMotionHumanHeld.point(held, "hairFrog");
  const tip: IAutoMovieMotionHumanHeld.IPointResult =
    AutoMovieMotionHumanHeld.point(held, "hairTip");
  const hair: IAutoMovieVector3 = Vector3.subtract(tip.point, frog.point);
  const length: number = Vector3.length(hair);
  if (
    !(length > 0) ||
    Math.abs(Vector3.dot(Vector3.scale(hair, 1 / length), frog.direction)) >
      1e-6
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "bow",
      value: params.bow,
      reason:
        "the bow's hair endpoints must be distinct with a transverse frog normal",
      fix: "hold a bow with hairFrog and hairTip as in createViolinBow",
    });
  const rotation: IAutoMovieQuaternion = HumanHand.align(
    { normal: hair, forward: frog.direction },
    { normal: hairAxis, forward: Vector3.scale(outward, -1) },
  );
  const grip: (share: number, lift: number) => IAutoMovieVector3 =
    bowViolinGrip(contact, outward, rotation, frog.point, hair);
  const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
    AutoMovieMotionHumanArm.origin(
      body,
      poseBones(body, entry.pose),
      { origin: entry.posture.root, yaw: entry.posture.yaw },
      "right",
      "grip",
    );
  const reach: number = AutoMovieMotionHumanTiming.aimed(
    Vector3.length(
      Vector3.subtract(
        grip(bowViolinStroke.from(params.direction), CLEARANCE),
        AutoMovieMotionHumanArm.point(entry.posture, origin),
      ),
    ),
    0.03,
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.sequence([
    { name: "approach", seconds: reach },
    { name: "ready", seconds: 0.2 },
    { name: "contact", seconds: stroke },
    { name: "lift", seconds: 0.2 },
  ]);
  const stroked: ReturnType<typeof bowViolinStroke> = bowViolinStroke(
    clock,
    params.direction,
    CLEARANCE,
  );
  const target = (
    posture: IAutoMovieMotionHumanPosture,
    time: number,
  ): IAutoMovieMotionHumanArmTarget.ITarget => {
    const at: bowViolinStroke.IStroke = stroked(time);
    const point: IAutoMovieVector3 = grip(at.share, at.lift);
    return {
      surface: "grip",
      shape: "relaxed",
      point,
      rotation,
      bend: AutoMovieMotionHumanBend.solve({
        body,
        posture,
        side: "right",
        rotation,
        point: HumanHand.place(
          body,
          "right",
          "grip",
          point,
          rotation,
          "relaxed",
        ).point,
      }),
    };
  };
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.move({
    fixedShape: "relaxed",
    body,
    side: "right",
    from: 0,
    to: clock.duration,
    origin,
    target,
    weight: (seconds: number): number =>
      clock.progress("approach", "ready", seconds),
  });
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "contact",
      primitives: [
        {
          ...arm,
          prepare: (
            before: (seconds: number) => IAutoMovieMotionHumanPosture,
          ): void => {
            // Refuse unreachable staged poses at boundaries and the stroke's midpoint.
            for (const t of [
              clock.at("ready"),
              clock.at("contact"),
              clock.at("contact") + stroke / 2,
              clock.at("lift"),
              clock.duration,
            ])
              target(before(t), t);
          },
        },
      ],
    });
  const fingers: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
    entry.pose,
    "right",
  );
  return {
    ...composed,
    contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [AutoMovieMotionHumanHeld.hold(context, held)],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = composed.posture(seconds);
      return { ...posture, joints: { ...posture.joints, ...fingers } };
    },
  };
}
