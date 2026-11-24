import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRoman,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRoman>;

/** Admit the times and the span, then sample. */
function planHumanRoman(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanRoman = context.params;
  const step: number = params.step ?? 0.6;
  HumanBound.above("hold", params.hold, 0, "s");
  HumanBound.least("step", step, 0, "s");
  const left: HumanMountedFrame.Reader = HumanMountedFrame(
    context.prop(params.left),
    params.left,
    params.frame,
  );
  const right: HumanMountedFrame.Reader = HumanMountedFrame(
    context.prop(params.right),
    params.right,
    params.frame,
  );
  const m = context.body.measure;
  const widest: number =
    2 * (m.thigh + m.shank) * Math.sin(Math.PI / 6) + 2 * m.hipHalfWidth;
  const narrowest: number = 2 * m.hipHalfWidth;
  const duration: number = step + params.hold;
  for (let k: number = 0; k <= 16; ++k) {
    const film: number = context.start + step + (params.hold * k) / 16;
    const span: number = Vector3.distance(
      left(film).position,
      right(film).position,
    );
    if (span > widest || span < narrowest)
      throw new HumanRefusal({
        kind: "reach",
        axis: "right",
        value: span,
        feasible: {
          kind: "range",
          minimum: narrowest,
          maximum: widest,
          unit: "m",
        },
        reason: `the two seats are ${span.toFixed(3)} m apart at ${film.toFixed(3)} s, outside the stance the legs span`,
        fix: "drive the two horses closer together, side by side",
      });
  }
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const stand = (film: number): IAutoMovieMotionHumanPosture => {
    const a: IAutoMovieRigidTransform = left(film);
    const b: IAutoMovieRigidTransform = right(film);
    const ahead: IAutoMovieVector3 = Vector3.add(
      Quaternion.rotateVector(a.rotation, { x: 0, y: 0, z: 1 }),
      Quaternion.rotateVector(b.rotation, { x: 0, y: 0, z: 1 }),
    );
    const middle: IAutoMovieVector3 = Vector3.lerp(a.position, b.position, 0.5);
    const ankle = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(p, { x: 0, y: m.ankleHeight, z: 0 });
    // Each knee bends toward a point ahead of its foot at the knee's height.
    const level: IAutoMovieVector3 = Vector3.normalize({
      x: ahead.x,
      y: 0,
      z: ahead.z,
    });
    const knee = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        p,
        Vector3.add(Vector3.scale(level, m.shank), {
          x: 0,
          y: m.shank,
          z: 0,
        }),
      );
    return {
      ...entry,
      root: Vector3.add(middle, { x: 0, y: m.hipHeight, z: 0 }),
      yaw: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {
        leftLeg: {
          point: ankle(a.position),
          bend: knee(a.position),
          planted: true,
        },
        rightLeg: {
          point: ankle(b.position),
          bend: knee(b.position),
          planted: true,
        },
      },
    };
  };
  return {
    duration,
    events: [{ name: "standing", share: step / duration }],
    contacts: [
      {
        part: "leftFoot",
        kind: "plant",
        from: step / duration,
        to: 1,
        support: { kind: "prop", subject: params.left },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: step / duration,
        to: 1,
        support: { kind: "prop", subject: params.right },
      },
    ],
    base: { kind: "standing" },
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const film: number = context.start + t;
      return t >= step || step === 0
        ? stand(film)
        : mixHumanPosture(entry, stand(film), minimumJerk.share(t / step));
    },
  };
}

/**
 * Roman riding (`IAutoMovieMotionHumanRoman`): each foot planted on its own
 * horse's moving seat, the root standing over their middle at the hip's height,
 * facing their mean heading; the stand is reached from the entry over `step` by
 * a minimum-jerk share. A stance the legs cannot span, wider than both legs or
 * narrower than the hips, is refused at any sampled second of the hold.
 * Register `HumanRoman` to use it.
 */
export const HumanRoman: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRoman> =
  {
    name: "roman",
    interrupts: {},
    plan: planHumanRoman,
  };
