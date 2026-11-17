import { physicalShapeSpan } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGraspHand } from "./HumanGraspHand";
import { HumanGraspReach } from "./HumanGraspReach";
import { HumanGraspTarget } from "./HumanGraspTarget";

/**
 * A prop's grip affordance as a grasp target, and the hand that grasps it:
 * where the grip socket goes, how the hand turns, how wide it opens on the
 * way and how its digits close.
 *
 * The affordance frame follows the one convention of
 * `AutoMovieAffordanceKind`: `+Y` points out of the contact, so the hand
 * arrives along `-Y` with its palm facing into the object, and the wrapped
 * axis runs along `+X`, the thumb side toward `+X`. The grasp lays the hand's
 * grip socket (the centre of a power grip, 25 mm out from the palm) on the
 * affordance point with the socket's palm normal along `-Y` and its thumb-side
 * forward along `+X` (`HumanHand.reach`), which fixes the hand's rotation, and
 * then sets the palm on the grasped part's near surface, half the grasped
 * width back from the affordance point on the part's axis, so a thick part
 * is not entered by a palm placed for the socket's nominal 50 mm handle; the
 * arm is then solved by inverse kinematics, the Final IK InteractionObject and
 * Unreal hand-socket practice of an effector frame laid on an object's
 * authored grip marker.
 *
 * The grasped width is the affordance's `aperture`, or else the extent along
 * the approach axis of the prop's collider nearest the grip point (the span
 * the closing hand must clear), read from the engine's `physicalShapeSpan`.
 * `HumanPreshape` opens the hand for it on the way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame convention, the socket alignment, the width rule and who owns the pre-shape.
 * @evidence contracts/development/design.md#principled-representation World-metre grip points/widths and unit approach/wrapped axes describe a grasp; body-local hand offsets and rest-relative rotations place the wrist, and key/reach records report actual constrained fits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The facade owns shared target/key/reach declarations and existing target, placement, reach and span entry points; HumanGraspTarget owns affordance geometry and HumanGraspReach owns numerical selection/standing prediction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Complete targets retain real collider/grip data while IFrame narrows actual hand-only needs; no body, prop, fixture, guessed width or alternate solver is encoded in the shared surface.
 */
export namespace HumanGrasp {
  /**
   * The existing target fields a hand placement actually consumes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reuses the target's world grip point, inward approach, wrapped axis and metre width without requiring collider output a hand placement never reads.
   * @evidence contracts/development/design.md#principled-representation A Pick of the complete target retains its exact frames/units while distinguishing a hand's geometric goal from digit-closure collider data.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanGraspTarget produces this view for HumanHeldUse.second; hand and around consume precisely these members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field is guessed, widened or substituted; complete target consumers retain ITarget and its actual colliders/grip kind.
   */
  export type IFrame = Pick<IAutoMovieMotionHumanGrasp.ITarget, "point" | "approach" | "axis" | "width">;

  

  /**
   * A prop affordance as a target at a film second, from its displayed frame.
   *
   * @param context The action's context.
   * @param subject The prop.
   * @param id The affordance id.
   * @param seconds Film seconds.
   * @returns The target.
   * @throws {HumanRefusal} When the prop declares no such affordance or no colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs identify a context prop, affordance and absolute film second; output is the complete world target and missing geometry retains its original refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The context supplies the actual displayed frame at that second and at performs the same rigid affordance transform and width reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prop read and frame evaluation delegate geometry to at and its shared HumanGraspTarget owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No frame is inferred or reused across seconds, and absent affordance/colliders keep their existing refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant dispatch to at's O(S+V) shape/selected-span work, plus the context frame reader's own cost; it creates no independent solve or scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the complete target geometry owner without caching an effectful context lookup or displayed frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no context/frame/history after return; the caller owns fresh target wrappers borrowing the actual prop shape records.
   */
  export function target(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    subject: string,
    id: string,
    seconds: number,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    const prop: IAutoMovieMotionHumanPropReader = context.prop(subject);
    return HumanGrasp.at(prop.prop, id, prop.frame(seconds));
  }

  /**
   * A prop affordance as a target with the prop at a given world frame, such
   * as where another person's hand will hold it.
   *
   * @param prop The prop.
   * @param id The affordance id.
   * @param frame The prop's world frame.
   * @returns The target.
   * @throws {HumanRefusal} When the prop declares no such affordance or no colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States prop/affordance/current world frame, complete world target output and missing-handle/shape refusals.
   * @evidence contracts/development/implementation.md#principled-implementation HumanGraspTarget composes the same rigid affordance, inward normal and wrapped axis, choosing authored aperture or the nearest collider's exact projected span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cold invocation of the shared target producer preserves a single geometry and admission owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Width, strict nearest-centre ties, shape list and original refusals remain; complete targets always contain their actual collider wrappers.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admission scans A affordances; complete wrapping scans S shapes, and inferred width adds its original S centre comparisons plus selected-shape span cost V. Authored aperture omits that width scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both complete and hand-only targets use HumanGraspTarget; explicit fixed-geometry consumers retain its producer, while this facade admits current inputs on every call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cold builder is released at return; only the fresh target/collider wrappers borrowing prop shape records and the supplied frame escape, with no result cache or handle.
   */
  export function at(
    prop: IAutoMovieMotionHumanProp,
    id: string,
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    return HumanGraspTarget(prop, id).at(frame);
  }

  /**
   * The wrist goal that lays the grip socket on a target.
   *
   * @param body The body.
   * @param side The hand.
   * @param target The target.
   * @param tilt Degrees the hand turns about the approach, for an oblique grip; 0 when absent.
   * @returns The wrist point and the hand's rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged canonical body/side, world target, optional degree tilt and fresh world wrist point/rest-relative hand rotation.
   * @evidence contracts/development/implementation.md#principled-implementation prepareHand applies the same grip-frame alignment, approach tilt and half-width palm placement using the body's actual grip/palm offsets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade delegates to the existing prepared hand-geometry owner for this actual target.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No width, point, tilt or normalization policy changes and no collider placeholders are required by the narrow target.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed hand geometry preparation and one rigid goal calculation; there is no IK, candidate scan or unused grip-wrist translation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same prepareHand producer serves this cold goal, grasp searches and other-hand support without another alignment or palm-placement formula.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cold preparation is released at return and retains no body/result history; output point and rotation are fresh numeric records.
   */
  export function hand(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: IFrame,
    tilt: number = 0,
  ): IAutoMovieMotionHumanHand.IWrist {
    return prepareHand(body, side)(target, tilt);
  }

  /**
   * Prepare one body's hand geometry before its grasp targets vary.
   *
   * @param body The unchanged canonical body.
   * @param side The grasping hand.
   * @returns The original wrist goal for each actual target and optional tilt in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/side, world target geometry, metre width and degree tilt.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the grip-frame alignment, approach-axis tilt and half-width palm placement of hand; only the body's fixed grip frame and palm offset are prepared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed hand geometry precedes the same orientation and rigid palm-offset translation for each target.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No width, target, quaternion normalization or tilt changes; the unused grip-wrist translation is omitted because only its rotation ever fed palm placement.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two fixed hand-offset queries serve C candidate goals instead of repeated grip/palm lookups and an unused wrist placement; each actual target still performs its original alignment, tilt and palm transform.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/side grip and palm geometry are shared; differing target points, approaches, axes, widths and tilts compute their own actual wrist.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder owns constant-size hand frames/offsets through its grasp search or support plan and stores no candidate pose, numerical reader or time history.
   */
  export function prepareHand(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): (target: IFrame, tilt?: number) => IAutoMovieMotionHumanHand.IWrist {
    return HumanGraspHand.prepare(body, side);
  }

  /**
   * Choose a symmetric grip by its actual constrained fit through the grasp
   * and every reached stroke key. HumanGraspReach.reachable owns the
   * complete numerical method and its cited grasp-planning basis: required
   * judgements precede the original mixed degree/millimetre cost, with the
   * grasp's own arm solution anchoring its stroke keys.
   *
   * @param body The body.
   * @param posture The posture the arm is fitted in (its other limbs and trunk).
   * @param side The arm.
   * @param bend The elbow hint.
   * @param goal The wrist goal of a turn and a tilt, degrees.
   * @param tilts The tilts tried at each turn; only the authored one when absent.
   * @param stroke The further key poses the same grip must reach, from its grasp goal and from the hand the arm shows for that goal: what is held is rigid in the shown hand, so a key that places the held thing is built from the shown one. None when absent.
   * @param turns The turns tried, degrees; -90 to 90 in steps of 15 when absent.
   * @param required What a grip must hold before its cost counts: a measure of its per-key errors, judgements and the bounds the keys hold their judgements to (the grasp's, then each stroke key's; `NaN` where none) and the most it may be. A grip within the bound is chosen before any beyond it; with none within, the one nearest the bound is returned for the caller to refuse. Absent, the least cost alone decides.
   * @param admits Whether the caller can take a candidate's grasp goal at all: a candidate it refuses is tried only when it refuses every one. Every candidate when absent.
   * @returns The best turn and tilt, their goal, the hand the arm achieves for it, and the arm's solution there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents world wrist goals, degree turns/tilts, lazy stroke keys, actual shown hand, required judgements/bounds, caller admission and chosen arm reference.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to HumanGraspReach's actual full coupled posture fits and original required-first/lower-bound ordered search, preserving its physical joint ranges and key judgments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This public facade passes every input to the single numerical owner without a second candidate selector or fit path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All supplied turns, tilts, keys, admission callbacks, bounds, degree/millimetre cost and authored-turn preference retain their original policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms The owner fits C admitted turn/tilt goals and reached stroke keys, preserving original lower-bound pruning and complete numerical searches; this facade adds constant dispatch only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ordinary numerical owner may share exact FK dependencies while admitting all current raw values, but never a fixed direct base across arbitrary callbacks. Goal/admission invocation order, eager full observations and every distinct complete fit remain original.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate/key/FK workspaces are local to the delegated synchronous search; only the chosen wrist, pose, reference and scalar reports escape without a reader or history.
   */
  export function reachable(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    bend: IAutoMovieVector3,
    goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
    tilts: readonly number[] = [0],
    stroke?: (
      wrist: IAutoMovieMotionHumanHand.IWrist,
      shown: IAutoMovieMotionHumanHand.IWrist,
    ) => Iterable<IAutoMovieMotionHumanGrasp.IKey>,
    turns: readonly number[] = TURNS,
    required?: IAutoMovieMotionHumanGrasp.IReachableRequired,
    admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean,
  ): IAutoMovieMotionHumanGrasp.IReach {
    return HumanGraspReach.reachable(
      body,
      posture,
      side,
      bend,
      goal,
      tilts,
      stroke,
      turns,
      required,
      admits,
    );
  }

  /** The turns {@link reachable} tries by default, degrees: a quarter turn either way in steps of 15. */
  export const TURNS: readonly number[] = Array.from(
    { length: 13 },
    (_: unknown, i: number): number => -90 + 15 * i,
  );
  /**
   * The standing posture a person settles into from where they stand: the
   * stand law's posture centred over the person's displayed feet, facing the
   * way the pelvis faces. A law predicting another person's arm (a
   * handshake's partner, a handover's receiver) reads it, so the prediction
   * starts from the same root the partner's own stand law will hold.
   *
   * @param body The person's body.
   * @param bones The person's displayed world bones.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines displayed bone input and the stand-law posture centred on its feet under the hips' heading.
   * @evidence contracts/development/implementation.md#principled-implementation HumanGraspReach takes the displayed hips heading and foot midpoint, subtracts the body's rotated rest-foot midpoint and calls the existing stand law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegated owner supplies the same prediction used by handshake and handover.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No guessed body proportions or root substitution replaces the actual displayed feet and canonical body rest geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant bone lookups and rigid arithmetic precede stand.posture's normal construction; this facade introduces no FK or body scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares one standing prediction with all grasp consumers and the same stand law the partner actually performs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh stand posture and retains no displayed bone map, body memory, query history or handle.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
  ): IAutoMovieMotionHumanPosture {
    return HumanGraspReach.standing(body, bones);
  }

  /**
   * A target turned about its wrapped axis through the axis point, as a
   * cylinder's grip may be taken from any side.
   *
   * @param target The target.
   * @param turn Degrees about the wrapped axis.
   * @returns The turned target.
   */
  export function around(target: IAutoMovieMotionHumanGrasp.ITarget, turn: number): IAutoMovieMotionHumanGrasp.ITarget;
  /** The same rigid handle turn when only its hand-placement frame is needed. */
  export function around(target: IFrame, turn: number): IFrame;
  /**
   * Delegate both target views to the same wrapped-axis rotation owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The overloads distinguish complete closure targets from the exact fields a hand goal consumes; both keep world points, unit directions and metre width.
   * @evidence contracts/development/implementation.md#principled-implementation The existing approach rotation about the unchanged wrapped axis, delegated without another transform formula.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner handles both structural views and preserves every additional supplied target field.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider placeholder, width proxy, normalization or different turn rule is introduced.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant target-copy and quaternion-vector work with no data traversal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both views use HumanGraspReach.around's same existing wrapped-axis computation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new target view and retains no state or handle.
   */
  export function around(target: IFrame, turn: number): IFrame {
    return HumanGraspReach.around(target, turn);
  }

  /**
   * The width of colliders along an axis: the extent of their union's
   * projection.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual placed colliders, unit world axis and metre union width.
   * @evidence contracts/development/implementation.md#principled-implementation The width of the projected union is its existing maximum support minus minimum support, computed by span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One span query and one subtraction retain one shape-projection owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No axis normalization, collider approximation, tolerance or empty-list policy is added; original infinite endpoints propagate unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(S+V) span traversal covers S shapes and their total queried hull vertices V, with constant additional arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses span and the engine physicalShapeSpan rather than recomputing width with another geometric formula.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no collider list, span history or handles; only the numeric width is returned.
   */
  export function extent(
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    axis: IAutoMovieVector3,
  ): number {
    const [lo, hi]: readonly [number, number] = span(colliders, axis);
    return hi - lo;
  }

  /**
   * The interval colliders cover along an axis: the lowest and highest
   * projections of their union onto it, so an object's middle along the
   * vertical is the mean of the two.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns The low and high projections, metres along the axis from the world origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines unit world-axis input and low/high world-origin metre projections of all actual placed shapes.
   * @evidence contracts/development/implementation.md#principled-implementation Reduces each exact engine physicalShapeSpan by ordered minimum/maximum, which is the support interval of their union on the same axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shape loop and low/high accumulator delegate shape-specific support geometry to the engine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every collider is queried in supplied order; original Infinity/-Infinity for an empty list, ties and all projection arithmetic remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S+V) time for S placed shapes and total queried hull vertices V; two scalar accumulators add constant space and the full scan is required for exact union extrema.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Extent and all grasp consumers use this same union reducer and shared engine projection owner without result caching or copied shape geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each engine span is consumed immediately; the fresh two-number tuple is the only output and no shapes, frames, history or handle are retained.
   */
  export function span(
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    axis: IAutoMovieVector3,
  ): readonly [number, number] {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const c of colliders) {
      const [low, high]: readonly [number, number] = physicalShapeSpan(
        c.frame,
        c.shape,
        axis,
      );
      lo = Math.min(lo, low);
      hi = Math.max(hi, high);
    }
    return [lo, hi];
  }
}
