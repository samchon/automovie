import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * Pelvis and both proximal legs are the regions on the sitting face.
 */
const SEATED: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "hips",
  "leftUpperLeg",
  "rightUpperLeg",
]);

/*
 * Bind an ordinary seat's actual receiving face and proximal body geometry.
 */
export function prepareSeatedMaterial(
  context: Pick<IAutoMovieMotionHumanActionContext, "body" | "prop" | "start">,
  seat: IAutoMovieMotionHumanSeated.ISeat,
): prepareSeatedMaterial.ISeat | undefined {
  if (seat.carrier === undefined || seat.point === undefined) return undefined;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(seat.carrier);
  const site: HumanMaterialContact.ISite | undefined =
    HumanMaterialContact.prepare(reader, seat.point, context.start);
  if (site === undefined) return undefined;
  const back: HumanMaterialContact.ISite | undefined =
    seat.back === undefined
      ? undefined
      : HumanMaterialContact.prepare(
          reader,
          seat.backrest ?? "back",
          context.start,
        );
  const placed: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    context.body,
    SEATED,
  );
  const pelvis: ReturnType<typeof HumanMaterialContact.prepareBody> =
    HumanMaterialContact.prepareBody(context.body, new Set(["hips"]));
  const left: ReturnType<typeof HumanMaterialContact.prepareBody> =
    HumanMaterialContact.prepareBody(context.body, new Set(["leftUpperLeg"]));
  const right: ReturnType<typeof HumanMaterialContact.prepareBody> =
    HumanMaterialContact.prepareBody(context.body, new Set(["rightUpperLeg"]));
  const backFit:
    | ReturnType<typeof HumanMaterialContact.preparePosture>
    | undefined =
    back === undefined
      ? undefined
      : HumanMaterialContact.preparePosture(
          context.body,
          new Set(["spine", "chest"]),
        );
  const first: HumanMaterialContact.IFace = site.at(context.start);
  const vertical: number = Quaternion.rotateVectorY(
    first.frame.rotation,
    HumanMaterialContact.NORMAL,
  );
  if (vertical <= 0) throw prepareSeatedMaterial.refusal("seat", seat.point);
  return {
    support: site.support,
    vertical,
    bearing: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number = context.start,
    ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = placed(
        resolveHumanPosture(context.body, posture),
      );
      const face: HumanMaterialContact.IFace =
        seconds === context.start ? first : site.at(seconds);
      const a: IAutoMovieMotionHumanContactWindow.IMaterial | undefined = left(
        bones,
        face,
      );
      const b: IAutoMovieMotionHumanContactWindow.IMaterial | undefined = right(
        bones,
        face,
      );
      if (a === undefined || b === undefined) return undefined;
      const hip: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
        pelvis(bones, face);
      const candidates: IAutoMovieMotionHumanContactWindow.IMaterial[] =
        hip === undefined ? [a, b] : [a, b, hip];
      const best: IAutoMovieMotionHumanContactWindow.IMaterial =
        candidates.reduce((a, b) => (b.clearance < a.clearance ? b : a));
      const patch: IAutoMovieVector3[] = candidates.flatMap(
        (candidate): readonly IAutoMovieVector3[] =>
          candidate.clearance - best.clearance > HumanFoot.BEARING
            ? []
            : (candidate.patch ?? [candidate.point]),
      );
      return { ...best, patch };
    },
    ...(back === undefined || backFit === undefined
      ? {}
      : {
          back: {
            support: back.support,
            bearing: (
              posture: IAutoMovieMotionHumanPosture,
            ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined =>
              backFit(posture, back.at(context.start)),
          },
        }),
  };
}

/*
 * Finite seat fit shared by sit, shift and the release from sitting.
 */
export namespace prepareSeatedMaterial {
  /*
   * Fitted seat and optional named backrest.
   */
  export interface ISeat {
    /*
     * Named receiving seat face.
     */
    support: IAutoMovieMotionHumanContactWindow.Support;
    /*
     * World vertical component of the entry bearing face's normal.
     */
    vertical: number;
    /*
     * Measure both sides where they project onto the receiving seat.
     */
    bearing(
      posture: IAutoMovieMotionHumanPosture,
      seconds?: number,
    ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined;
    /*
     * The separate finite backrest when the seat declares one.
     */
    back?: {
      /*
       * Named receiving backrest.
       */
      support: IAutoMovieMotionHumanContactWindow.Support;
      /*
       * Signed upper-back clearance at the entry's backrest.
       */
      bearing(
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined;
    };
  }

  /*
   * Geometric refusal shared by the ordinary seated actions.
   */
  export function refusal(
    axis: "seat" | "back",
    value: string | undefined,
    detail?: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis,
      value,
      reason:
        detail ??
        (axis === "seat"
          ? "both sides of the seated body need reachable material on the seat"
          : "the named backrest is outside the displayed upper back's reach"),
      fix:
        axis === "seat"
          ? "use a level seat under both sides of the body"
          : "move the backrest into reach or sit upright",
    });
  }
}
