import { type IAutoMovieResolvedBone, Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import { HumanHand } from "../posture/HumanHand";
import { StrikingHeld } from "../striking/StrikingHeld";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * Actual grasp measures whose source reads precisely one displayed hand.
 * Only this owner's constructed function identities carry private dependency
 * metadata; an arbitrary, replaced or wrapped judge keeps complete FK output.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the point/tool measures, unchanged geometry premises, single hand-name dependency and exact issued-function membership used by HumanGraspSearch.
 * @evidence contracts/development/design.md#principled-representation Judges retain the existing metre-valued callback type; private weak metadata stores one immutable canonical bone name rather than a result, resolved flag or caller-authored dependency claim.
 * @evidence contracts/development/design.md#minimal-and-owned-surface point serves original surface/worn socket measures, tool serves demanded held-tool measures, and hand lets the existing search select required output frames without changing public HumanGrasp records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No public registration accepts arbitrary callbacks, no goal/fit/admission answer is certified, and unknown identities retain full-map behavior. Each issued measure's complete get/iteration/size dependency is its one named hand only.
 */
export namespace HumanGraspJudgement {
  /**
   * Judge one actual hand-carried local point against its original world site.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs are acting side, wrist-local metre offset and world-metre site; output is their original displayed point miss in metres for each actual bone map.
   * @evidence contracts/development/implementation.md#principled-implementation Reads only the named hand and retains original worldPosition plus rotate(worldRotation,offset), world-site subtraction and vector length grouping shared by surface and worn socket measures.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One actual numerical callback is issued with its exact canonical hand-name dependency in this module's private weak map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every callback invocation computes its current actual miss; no frame iteration, size, other bone, changed contact or stored fit answer is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant original rigid-point work plus one map lookup per invocation; known dependency lets the search output only its original three-arm departure frames instead of unrelated rig frames. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same actual point formula serves original surface and worn judges. Only exact constructed function identity exposes its one hand dependency; wrapping/replacing the function loses membership and preserves ordinary full-map behavior.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback borrows its original offset/site geometry and immutable hand name until release. Weak metadata cannot keep a discarded callback alive and stores no map, point, query/time history, fit or handle.
   */
  export function point(side: HumanHand.Side, offset: IAutoMovieVector3,
    site: IAutoMovieVector3): IJudge {
    const name: AutoMovieHumanoidBone = `${side}Hand`;
    const judge: IJudge = (bones: Bones): number => {
      const hand: IAutoMovieResolvedBone = bones.get(name)!;
      return Vector3.length(Vector3.subtract(Vector3.add(hand.worldPosition,
        Quaternion.rotateVector(hand.worldRotation, offset)), site));
    };
    READS.set(judge, name);
    return judge;
  }

  /**
   * Prepare one fixed body's grip-point geometry for actual demanded tools.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes unchanged body/grip surface and side while every demand retains its actual tool/frame/back/least inputs; each produced callback returns the original metre stray on current displayed bones.
   * @evidence contracts/development/implementation.md#principled-implementation The shared non-digit grip point producer reads only that hand; the original StrikingHeld.strayed comparison and Math.max proven-least floor consume the actual hand rotation and current demand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy fixed grip-point reader supplies independent demand callbacks; only callbacks actually constructed here receive private single-hand metadata.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The callback's two hand lookups and non-digit point producer have no map iteration/size/other-bone dependency. Original least/bound/contact semantics and every actual judgement invocation remain; arbitrary callback injection is unavailable.
   * @evidence contracts/development/implementation.md#efficient-algorithms One grip-offset preparation serves C actual demand callbacks, each retaining its original two-point stray calculation while omitting unused hand normal/forward rotations. Issued dependency also omits unrelated FK output in the search; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work HumanGraspDemand's exact unchanged body/side lifetime proves only local grip geometry reuse. Every changed demand reads its own actual tool/frame/back/least; no judgement, candidate or fit result is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder and issued callbacks share one lazy body-owned grip reader until their last owner releases it; each callback borrows only its actual demand and hand name, without the grasp hand map/goal producer. Weak metadata stores no current bones, result/time history, FK loan or handle.
   */
  export function tool(body: IHumanBody, side: HumanHand.Side):
    (demand: Omit<IHumanActionLaw.IDemand, "posture">) => IJudge {
    const name: AutoMovieHumanoidBone = `${side}Hand`;
    const point: ReturnType<typeof HumanHand.preparePoint> = HumanHand.preparePoint(body, side, "grip");
    return (demand: Omit<IHumanActionLaw.IDemand, "posture">): IJudge => {
      const judge: IJudge = (bones: Bones): number =>
        Math.max(demand.least ?? 0, StrikingHeld.strayed(demand.tool, {
          point: point(bones), rotation: bones.get(name)!.worldRotation,
        }, demand.frame, demand.back));
      READS.set(judge, name);
      return judge;
    };
  }

  /**
   * Read the single bone dependency of an exact judge issued by this owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns an immutable canonical hand-name string only for the exact constructed point/tool function, otherwise undefined including absent, arbitrary, replaced and wrapped callbacks.
   * @evidence contracts/development/implementation.md#principled-implementation Weak function-identity lookup reads source-owned dependency metadata, never a solved pose, callback property or caller assertion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One undefined check and private weak-map lookup serve the search's demanded-output decision.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exposes no setter, registration, mutable set or success/result capability; unknown callbacks cannot acquire narrower output by writing a property.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant identity lookup has no varying traversal or numerical search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Metadata is created beside the actual numerical functions whose complete bone reads are known; no dependency inference is made about other code.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar name without retaining the callback or exposing mutable private metadata; weak ownership ends with issued callback lifetime.
   */
  export function hand(judge: IJudge | undefined): AutoMovieHumanoidBone | undefined {
    return judge === undefined ? undefined : READS.get(judge);
  }
}

/** Original grasp callback representation; no public property can issue dependency proof. */
type IJudge = NonNullable<HumanGrasp.IKey["judge"]>;

/** The original actual displayed frames accepted by every judgement. */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** Weak issued-function ownership with immutable one-bone metadata and no result data. */
const READS: WeakMap<IJudge, AutoMovieHumanoidBone> = new WeakMap();
