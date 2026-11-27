import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRoman,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { mixHumanPosture } from "../../posture/internal/mixHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { humanRomanStance } from "./humanRomanStance";

/*
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

/*
 * The law's context.
 */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRoman>;

/*
 * Admit the times and the span, then sample.
 */
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
  const [narrowest, widest] = humanRomanStance.span(m);
  const duration: number = step + params.hold;
  for (let k: number = 0; k <= 16; ++k) {
    const film: number = context.start + step + (params.hold * k) / 16;
    const span: number = Vector3.distance(
      left(film).position,
      right(film).position,
    );
    if (span > widest || span < narrowest)
      throw new AutoMovieMotionHumanRefusal({
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
  const stand = (film: number): IAutoMovieMotionHumanPosture =>
    humanRomanStance(m, entry, left(film), right(film));
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
        : mixHumanPosture(entry, stand(film), AutoMovieEngineMotionSampling.minimumJerkShare(t / step));
    },
  };
}
