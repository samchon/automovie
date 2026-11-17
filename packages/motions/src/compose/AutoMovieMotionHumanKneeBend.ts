import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

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
   * Prepare an unchanged body/rest knee and fixed degree foot heading/splay.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every call reads actual current root/yaw and returns a fresh world hint; fixed body/side/rest/foot heading/splay belong to the plan and must remain unchanged.
   * @evidence contracts/development/implementation.md#principled-implementation HumanFrame.preparePoint preserves both original nested origin/local product groups. One lazy outer unit-step transform serves all calls; one bounded last-yaw inner rest-knee transform changes whenever Object.is yaw differs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure First actual use admits the same current root/yaw and rest knee before preparing inner products; outer fixed-heading preparation follows the actual inner point, retaining original nesting order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No point result, pose identity, heading approximation, omitted zero term or target/ROM substitution is used; current root translation and exact yaw remain inputs and every output is fresh.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed outer trigonometry/products prepare once and inner fixed-rest products prepare once per consecutive exact yaw; every request retains both original translation groups. Varying yaw keeps constant work and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The genuine fixed rest point/foot heading/splay justify product reuse; changed yaw replaces one inner reader, while changed fixed body/geometry requires another producer. No earlier world knee or leg answer is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one lazy rest snapshot, outer transform and at most one last-yaw inner transform until release; it retains no current root, world point, FK loan, pose/time history or handle.
   */
  export function prepare(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    heading: number, splay: number = 0): (posture: IPosture) => IAutoMovieVector3 {
    let rest: IAutoMovieVector3 | undefined;
    let inner: { yaw: number; point: ReturnType<typeof HumanFrame.preparePoint> } | undefined;
    let outer: ReturnType<typeof HumanFrame.preparePoint> | undefined;
    return (posture: IPosture): IAutoMovieVector3 => {
      const root: IAutoMovieVector3 = posture.root;
      const yaw: number = posture.yaw;
      if (inner === undefined || !Object.is(inner.yaw, yaw)) {
        let source: IAutoMovieVector3;
        if (rest === undefined) source = body.rest.get(`${side}LowerLeg`)!;
        else source = rest;
        const point: ReturnType<typeof HumanFrame.preparePoint> = HumanFrame.preparePoint(yaw, source);
        rest ??= { x: source.x, y: source.y, z: source.z };
        inner = { yaw, point };
      }
      const knee: IAutoMovieVector3 = inner.point(root);
      outer ??= HumanFrame.preparePoint(heading + (side === "left" ? splay : -splay), { x: 0, y: 0, z: 1 });
      return outer(knee);
    };
  }
}

/** Existing current horizontal body frame; no full pose or solved leg is represented. */
type IPosture = Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;
