import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { kneelKeys } from "../../everyday/internal/kneelKeys";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { crawlFeet } from "./crawlFeet";
import { crawlFrame } from "./crawlFrame";

/*
 * The posture on hands and knees with each limb at a place and the hips' middle
 * `level` metres along, each hip joint a thigh from its knee
 * (`crawlFrame.over`): on the way down the hips sit `back` behind and the trunk
 * leans by `lean` of its pitch, each tucked foot follows its knee on its toes,
 * and the palms are laid on their places unless `palms` is false.
 *
 * Part of `crawl.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `kneeling`.
 */
export function crawlKneeling(
  prepared: crawlKneeling.IPrepared,
): (
  posture: IAutoMovieMotionHumanPosture,
  at: (limb: IAutoMovieMotionHumanCrawl.Limb) => IAutoMovieVector3,
  level: number,
  back: number,
  lean: number,
  palms?: boolean,
) => IAutoMovieMotionHumanPosture {
  const {
    m,
    frame,
    forward,
    nominal,
    separation,
    pitch,
    posed,
    rootFor,
    sides,
    tucks,
    placements,
    footContacts,
    laid,
  }: crawlKneeling.IPrepared = prepared;
  return (
    posture: IAutoMovieMotionHumanPosture,
    at: (limb: IAutoMovieMotionHumanCrawl.Limb) => IAutoMovieVector3,
    level: number,
    back: number,
    lean: number,
    palms: boolean = true,
  ): IAutoMovieMotionHumanPosture => {
    const knees: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: at("leftKnee"),
      right: at("rightKnee"),
    };
    const hips: ReturnType<typeof crawlFrame.over> = crawlFrame.over(
      m.thigh,
      HumanFrame.point(frame, { x: 0, y: 0, z: level - back }),
      forward,
      knees,
      { left: nominal.leftKnee.z, right: nominal.rightKnee.z },
      separation,
      lean * pitch,
    );
    const target: IAutoMovieMotionHumanPosture = posed(lean, pitch, hips.hike);
    const legged: IAutoMovieMotionHumanPosture = {
      ...target,
      root: rootFor(target, hips.point),
      limbs: {},
      joints: { ...posture.joints, ...target.joints },
    };
    for (const side of sides) {
      const kneeAt: IAutoMovieVector3 = knees[side];
      const foot: kneelKeys.IFoot = tucks[side].foot;
      const placement: IAutoMovieMotionHumanFoot.IPlacement = placements[side](
        Vector3.add(kneeAt, tucks[side].offset),
      );
      legged.limbs[`${side}Leg`] = {
        point: placement.ankle,
        rotation: placement.rotation,
        bend: kneeAt,
        contact: { ...footContacts[side] },
      };
      legged.joints[`${side}Toes`] = [foot.toes, 0, 0];
    }
    if (!palms) return legged;
    return laid(
      legged,
      (side: AutoMovieHumanSide): IAutoMovieVector3 => at(`${side}Hand`),
    );
  };
}

/*
 * The `kneeling` of `crawl.plan`, built from what that plan prepared.
 */
export namespace crawlKneeling {
  /*
   * What `crawl.plan` prepared for its `kneeling`.
   */
  export interface IPrepared {
    /*
     * The `m` `crawl.plan` prepared.
     */
    m: IAutoMovieMotionHumanBody["measure"];

    /*
     * The `frame` `crawl.plan` prepared.
     */
    frame: ReturnType<typeof crawlFeet.planted>["frame"];

    /*
     * The `forward` `crawl.plan` prepared.
     */
    forward: IAutoMovieVector3;

    /*
     * The `nominal` `crawl.plan` prepared.
     */
    nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3>;

    /*
     * The `separation` `crawl.plan` prepared.
     */
    separation: number;

    /*
     * The `pitch` `crawl.plan` prepared.
     */
    pitch: number;

    /*
     * The `posed` `crawl.plan` prepared.
     */
    posed: (
      share: number,
      degrees: number,
      hike?: number,
    ) => IAutoMovieMotionHumanPosture;

    /*
     * The `rootFor` `crawl.plan` prepared.
     */
    rootFor: (
      tilted: IAutoMovieMotionHumanPosture,
      hips: IAutoMovieVector3,
    ) => IAutoMovieVector3;

    /*
     * The `sides` `crawl.plan` prepared.
     */
    sides: readonly ["left", "right"];

    /*
     * The `tucks` `crawl.plan` prepared.
     */
    tucks: ReturnType<typeof crawlFeet.planted>["tucks"];

    /*
     * The `placements` `crawl.plan` prepared.
     */
    placements: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFoot.prepareAt>
    >;

    /*
     * The `footContacts` `crawl.plan` prepared.
     */
    footContacts: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * The `laid` `crawl.plan` prepared.
     */
    laid: ReturnType<typeof crawlFrame.prepareLaid>;
  }
}
