import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";

/**
 * What an arm primitive is given: a hand surface's target, the origin the
 * hand leaves from and returns to, and the wrist goal the two make.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them; they live
 * here so the carry, the move and the phrases read them without reading
 * each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the records are and why they have a file of their own.
 * @evidence contracts/development/design.md#principled-representation A target is a surface's place, facing and bend; an origin is a wrist's place and rotation; the goal is the posture's own goal type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The records and the three readers every arm primitive shares; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No primitive is defined here, so no file of the arm depends on another's phrases.
 */
export namespace AutoMovieMotionHumanArmTarget {
  /**
   * Where a hand surface is on a pose, as an origin in a floor frame.
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param frame The performer's floor frame at that pose.
   * @param side The hand.
   * @param surface The surface.
   * @returns The origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and that the result is in the given floor frame.
   * @evidence contracts/development/implementation.md#principled-implementation The surface's world point and the hand's world rotation, taken into the floor frame by its inverse: the hand's place relative to the body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two inverse transforms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the relaxed hand, the shape an arm has before a movement shapes it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.frame`, `HumanFrame.local` and `HumanFrame.turn`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads the supplied resolved map and actual hand surface, then performs constant floor-frame transforms; no body bone map is rebuilt here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function origin(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    frame: IAutoMovieMotionHumanFrame,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
  ): IAutoMovieMotionHumanArmTarget.IOrigin {
    return {
      point: HumanFrame.local(
        frame,
        HumanHand.frame(body, bones, side, surface, "relaxed").point,
      ),
      rotation: Quaternion.multiply(
        HumanFrame.turn(-frame.yaw),
        bones.get(`${side}Hand`)!.worldRotation,
      ),
    };
  }

  /**
   * An origin's surface point in the world on a posture.
   *
   * @param posture The posture whose root and heading carry the origin.
   * @param from The origin.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what of the posture is read and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The floor-frame transform of the origin's point by the posture's root and heading, the inverse of what `origin` stored.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root's own height is kept, as `origin` measured from it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function point(
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    from: IAutoMovieMotionHumanArmTarget.IOrigin,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      from.point,
    );
  }

  /**
   * The limb goal that puts a hand surface on its target: the wrist placed
   * for the asked rotation, and the surface declared as the goal's contact so
   * the resolver keeps it on the point when the rotation is out of range.
   *
   * @param body The body.
   * @param side The arm.
   * @param target The target.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the goal places and why it carries the surface as its contact.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist follows rigidly from the surface's point and the hand's rotation; the surface's offset from the wrist is the contact the resolver holds when the rotation is out of range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrist placement and one offset lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A surface at the wrist itself declares no contact, since a zero offset gives the resolver no lever to re-aim by.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ordinary targets retain both current hand-geometry reads. An issued prepareTarget row may lend only its explicitly fixed same-body/side/surface/shape offset to a transported copy; every current world point/rotation/bend remains actual and unissued or changed domains fall back cold.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two actual surface lookups remain in cold goal, including shaped-hand FK for digit surfaces, followed by constant rigid placement/contact assembly. Fixed consumers use prepareGoal or prepareSurfaceGoal to share only their unchanged geometry; no measured speedup is claimed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "curl">,
    preparedFrom?: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "curl">,
  ): IAutoMovieHumanLimbGoal {
    const prepared: IPreparedSurface | undefined = TARGETS.get(preparedFrom ?? target);
    if (prepared !== undefined && prepared.body === body && prepared.side === side &&
      prepared.surface === target.surface && prepared.shape === target.shape) return prepared.read(target);
    const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
      body,
      side,
      target.surface,
      target.point,
      target.rotation,
      target.shape,
    );
    const contact: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      target.surface,
      target.shape,
    ).point;
    return fromWrist(wrist, target.bend, contact);
  }

  /**
   * Keep an already placed wrist and its actual elbow hint as a contact goal.
   *
   * @param wrist Actual wrist point/rotation from the owning surface placement.
   * @param bend Actual world-metre elbow hint, including a completed default search.
   * @param contact Original hand-local surface offset in metres.
   * @returns A fresh goal wrapper borrowing these numerical payloads; a contact shorter than 1e-9 metres is absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual wrist/hint inputs, local contact units, original zero-contact branch and borrowed output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation A surface target already computed its wrist and actual bend; goal assembly preserves those values rather than placing the same surface or solving the bend again.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original length comparison feeds the same field assembly used by cold and fixed-geometry goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the exact length < 1e-9 condition, including its nonfinite behavior, and keeps the achieved wrist, original hint and local pivot unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar length and wrapper assembly replace duplicate hand-offset/placement work at prepared consumers; every actual wrist/bend computation remains with its producer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold goal and prepared Placed.arm consume the same assembly; completed wrist/hint values are shared only within their one unchanged target computation, without a result cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the fresh goal borrows its point/rotation/bend and any emitted contact exactly as the cold goal does.
   */
  export function fromWrist(wrist: IAutoMovieMotionHumanHand.IWrist, bend: IAutoMovieVector3,
    contact: IAutoMovieVector3): IAutoMovieHumanLimbGoal {
    return assembled(wrist, bend, contact, !(Vector3.length(contact) < 1e-9));
  }

  /**
   * Prepare a fixed hand surface, shape, rotation and bend for varying points.
   * The body's geometry stays unchanged for this reader's lifetime; changed
   * hand geometry or fixed values require new preparation.
   *
   * @param body The body that supplies the actual hand surface offset once.
   * @param side The fixed acting arm.
   * @param target Fixed world rotation/bend and local surface/shape, without the varying surface point or curl.
   * @returns Fresh original wrist/contact goals for each actual world surface point in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed geometry, varying world point, unchanged-body premise and fresh goal payload ownership.
   * @evidence contracts/development/implementation.md#principled-implementation HumanHand.offset supplies the same local surface point as cold goal; the common wrist-placement owner rotates it by the same fixed hand quaternion and subtracts it from every actual target. The original contact-length comparison decides whether contact is emitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One offset lookup, one prepared wrist placement and copied bend/contact scalars feed the same private assembly as fromWrist without owning hand geometry or IK.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same surface/shape geometry, unnormalized rotation policy, contact offset and 1e-9-metre zero-contact rule remain. No world point, goal or fit answer is sampled or cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Surface geometry and its quaternion-vector rotation run once rather than twice and once per each of Q cold goals; every actual query still constructs fresh point, rotation, bend and optional contact payloads. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The consumer explicitly fixes body/side/surface/shape/rotation/bend; numeric snapshots isolate caller and returned-output edits. A changed fixed dependency requires a new producer, while each point remains a current input.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns constant-size private rotated-offset, quaternion, bend and optional contact scalars until release. No body, target input object, query history or external handle is retained after preparation.
   */
  export function prepareGoal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "point" | "curl">,
  ): (point: IAutoMovieVector3) => IAutoMovieHumanLimbGoal {
    const contact: IAutoMovieVector3 = { ...HumanHand.offset(
      body, side, target.surface, target.shape,
    ).point };
    const place: (point: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist =
      placeHumanHandSurface.prepare(contact, target.rotation);
    const bend: IAutoMovieVector3 = { ...target.bend };
    const hasContact: boolean = !(Vector3.length(contact) < 1e-9);
    return (point: IAutoMovieVector3): IAutoMovieHumanLimbGoal => {
      const wrist: IAutoMovieMotionHumanHand.IWrist = place(point);
      return assembled(wrist, { ...bend }, hasContact ? { ...contact } : contact, hasContact);
    };
  }

  /**
   * Prepare a fixed local hand surface while world placement keeps varying.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes unchanged body geometry, side, surface and shape; every call reads its current world point/rotation/bend and returns a fresh wrist/contact with borrowed current rotation/bend.
   * @evidence contracts/development/implementation.md#principled-implementation The shaped hand's local offset is independent of world target translation/rotation, so its original geometry is read once while the original rotate-then-subtract placement runs for every actual target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One copied local offset and original contact-length decision feed placeHumanHandSurface and the same goal assembler as cold and fixed-world goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No world rotation, bowed point, bend, finger curl, IK or contact tolerance is frozen; exact length < 1e-9 and nonfinite behavior remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual local surface computation replaces two per goal, including digit FK when needed; each current quaternion-vector rotation and subtraction remains actual. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed body/side/surface/shape geometry is shared; changing that domain requires another reader. Fresh contact copies prevent a returned goal from changing later prepared placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner retains one local numeric offset and contact decision until release, without a body, target record, pose, time result or reader history; each result keeps current point/rotation/bend ownership.
   */
  export function prepareSurfaceGoal(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape):
    (target: Pick<IAutoMovieMotionHumanArmTarget.ITarget, "point" | "rotation" | "bend">) => IAutoMovieHumanLimbGoal {
    const contact: IAutoMovieVector3 = { ...HumanHand.offset(body, side, surface, shape).point };
    const hasContact: boolean = !(Vector3.length(contact) < 1e-9);
    return (target: Pick<IAutoMovieMotionHumanArmTarget.ITarget, "point" | "rotation" | "bend">): IAutoMovieHumanLimbGoal =>
      assembled(placeHumanHandSurface(contact, target.point, target.rotation), target.bend,
        hasContact ? { ...contact } : contact, hasContact);
  }

  /**
   * Emit current target rows with privately issued fixed local-surface geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Binds unchanged body/side/surface/shape and returns fresh raw target rows from current world point/rotation/bend/curl; goal may consume the issued geometry through an actual transported copy.
   * @evidence contracts/development/implementation.md#principled-implementation Explicit fixed geometry owns one actual prepared offset; world placement remains varying data and original target callbacks still run. A private weak row association supplies provenance without an authorable marker or extra target field.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareSurfaceGoal owns numerical geometry, this producer owns raw-row issuance and goal checks the complete fixed domain before consuming it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Generic callbacks retain cold mutable-input reads unless they return an actually issued row. Copies lose issuance unless the owning transport explicitly passes its original row; no point, rotation, curl, bend or solver result is frozen.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed local-surface computation serves Q emitted targets; each row still allocates fresh data and each current wrist runs its actual quaternion-vector placement. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit fixed-body producer and exact body/side/surface/shape checks establish only local geometry equivalence. Changed domains or arbitrary target rows use ordinary goal, with no sampled pose/time cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The producer owns one geometry reader until release. Weak row entries retain only that shared static metadata while their raw rows live; returned goals retain no source row, body, reader or query history.
   */
  export function prepareTarget(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape):
    (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">) => IAutoMovieMotionHumanArmTarget.ITarget {
    const prepared: IPreparedSurface = surfacePreparation(body, side, surface, shape);
    return (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">): IAutoMovieMotionHumanArmTarget.ITarget => {
      const target: IAutoMovieMotionHumanArmTarget.ITarget = { surface, shape, ...placement };
      TARGETS.set(target, prepared);
      return target;
    };
  }

  /**
   * Emit sided requests from one explicitly fixed hand geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes body/side/surface/shape and emits fresh ISided rows in side/surface/shape then placement insertion order, preserving current world payloads and additional spread entries.
   * @evidence contracts/development/implementation.md#principled-implementation The gesture's fixed hand geometry uses the same actual prepareSurfaceGoal offset as unsided targets; the side is request data while point/rotation/bend/curl remain current inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both row producers share one private surface preparation and TARGETS issuance map; this constructor adds only the side field required by the existing gesture request consumer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No marker, extra target field, generic callback cache, prior sample or solved pose is added. goal still checks body/side/surface/shape and falls back cold for unissued or changed domains.
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual local-offset preparation serves Q fresh requests; each request needs one object and one weak registration, with no intermediate unsided row or copied world payload. Current wrist placement and fits remain actual; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the explicit unchanged body/side/surface/shape domain shares metadata. The actual gesture hand producer replaces its emitter when fixed surface/shape changes and passes each current world placement to the same goal consumer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The hand factory owns one shared surface reader until release. Weak row entries follow raw request lifetime and retain only that metadata; returned requests borrow current numeric payloads and retain no prior, pose, time result or query workspace.
   */
  export function prepareSidedTarget(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape):
    (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">) => IAutoMovieMotionHumanArmTarget.ISided {
    const prepared: IPreparedSurface = surfacePreparation(body, side, surface, shape);
    return (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">): IAutoMovieMotionHumanArmTarget.ISided => {
      const target: IAutoMovieMotionHumanArmTarget.ISided = { side, surface, shape, ...placement };
      TARGETS.set(target, prepared);
      return target;
    };
  }
}

/** Sided and unsided issuance share the same fixed local-geometry owner. */
function surfacePreparation(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
  surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape): IPreparedSurface {
  return { body, side, surface, shape,
    read: AutoMovieMotionHumanArmTarget.prepareSurfaceGoal(body, side, surface, shape) };
}

/** Genuine fixed local geometry, independent of any emitted row's world placement. */
interface IPreparedSurface {
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  surface: IAutoMovieMotionHumanHand.Surface;
  shape: IAutoMovieMotionHumanHand.Shape;
  read: ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareSurfaceGoal>;
}

/** Row lifetime controls issuance retention; no target row or query result is a value. */
const TARGETS: WeakMap<IAutoMovieMotionHumanArmTarget.ITarget, IPreparedSurface> = new WeakMap();

/** The one goal field assembly; preparation may share the fixed contact decision. */
function assembled(wrist: IAutoMovieMotionHumanHand.IWrist, bend: IAutoMovieVector3,
  contact: IAutoMovieVector3, hasContact: boolean): IAutoMovieHumanLimbGoal {
  return { point: wrist.point, rotation: wrist.rotation, bend,
    ...(hasContact ? { contact } : {}) };
}
