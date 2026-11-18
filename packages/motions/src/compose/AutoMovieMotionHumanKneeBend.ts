import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/**
 * The original knee-over-foot bend hint and its fixed-foot-heading geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Places the body's rest knee under current root/yaw then one metre along foot heading opened by signed splay; outputs remain fresh world-metre hints.
 * @evidence contracts/development/design.md#principled-representation Existing body, side, raw root/yaw and degree headings retain the original two horizontal frames; preparation stores fixed products rather than a current point or solved leg.
 * @evidence contracts/development/design.md#minimal-and-owned-surface at owns the cold Bend.knee formula, while prepare serves actual fixed-heading Leg.prepareGoal through Bend.prepareKnee.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One-metre direction, side sign, current root/yaw and original nested arithmetic remain without target fitting, quantization or inferred pose equivalence.
 */
export namespace AutoMovieMotionHumanKneeBend {
  /**
   * Read the original hint from this actual body, root/yaw and foot heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs are body/side, current world root and degree yaw, degree foot heading and outward degree splay; absent heading follows current yaw and splay defaults to zero.
   * @evidence contracts/development/implementation.md#principled-implementation Carries the actual LowerLeg rest point by root/yaw, then performs the original unit-forward transform under heading plus left splay or minus right splay.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two original HumanFrame.point calls own the nested point construction without another knee model.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact, one-metre step, heading default, side sign, arithmetic grouping or missing-rest behavior is changed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant two-frame rigid work has no varying population.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses HumanFrame's existing scalar point owner, which also owns prepared fixed-point products.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh point with no retained body, current posture, reader, history or handle.
   */
  export function at(body: IAutoMovieMotionHumanBody, posture: IPosture, side: AutoMovieHumanSide,
    heading: number = posture.yaw, splay: number = 0): IAutoMovieVector3 {
    return HumanFrame.point({ origin: HumanFrame.point({ origin: posture.root, yaw: posture.yaw },
      body.rest.get(`${side}LowerLeg`)!), yaw: heading + (side === "left" ? splay : -splay) },
    { x: 0, y: 0, z: 1 });
  }

  /**
   * Prepare a body's knee hint under a fixed foot heading and splay.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every call reads the current root and yaw and returns a fresh world hint; the body, side, heading and splay are the plan's.
   * @evidence contracts/development/implementation.md#principled-implementation HumanFrame.preparePoint keeps both nested origin/local product groups of `at`: the outer unit-step transform under the fixed heading is prepared once, and the inner rest-knee transform once per consecutive yaw.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The rest knee and the outer transform are read at preparation; each call rebuilds the inner transform only on a new yaw.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No point result, pose identity, heading approximation or omitted zero term is used; root translation and exact yaw remain inputs and every output is fresh.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed outer trigonometry is computed once and the inner once per consecutive exact yaw; every request keeps both translation groups. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body's rest knee and the fixed heading justify product reuse; a changed yaw replaces the one inner reader. No earlier world knee is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns the rest point, the outer transform and at most one last-yaw inner transform until release; it retains no root, world point, pose history or handle.
   */
  export function prepare(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    heading: number, splay: number = 0): (posture: IPosture) => IAutoMovieVector3 {
    const rest: IAutoMovieVector3 = body.rest.get(`${side}LowerLeg`)!;
    const outer: ReturnType<typeof HumanFrame.preparePoint> =
      HumanFrame.preparePoint(heading + (side === "left" ? splay : -splay), { x: 0, y: 0, z: 1 });

    // The yaw is the posture's at each call, so its rest-knee transform is
    // rebuilt only when the yaw changes.
    let inner: { yaw: number; point: ReturnType<typeof HumanFrame.preparePoint> } | undefined;
    return (posture: IPosture): IAutoMovieVector3 => {
      if (inner === undefined || !Object.is(inner.yaw, posture.yaw))
        inner = { yaw: posture.yaw, point: HumanFrame.preparePoint(posture.yaw, rest) };
      return outer(inner.point(posture.root));
    };
  }
}

/** Existing current horizontal body frame; no full pose or solved leg is represented. */
type IPosture = Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;
