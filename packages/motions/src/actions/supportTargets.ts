import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { support } from "./support";
import { supportContact } from "./supportContact";

/**
 * A support contact's actual target at a film second. A held contact reads
 * its support now, rather than the perception-delayed point used to aim a
 * free reach. The shared `on` placements keep their offset in the support's
 * frame, so a turning platform carries both palms instead of turning between
 * two world-fixed offsets.
 * This reader is not yet connected to the support law or its static keys;
 * the current law still reads explicit targets at its start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the timebase, held-person exception and on-placement frame.
 * @evidence contracts/development/design.md#principled-representation A contact reads the same target's world point and normal at a specified second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Point and contact-form readers for support keys and their continuous course.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The target, surface placement, support frame and contact datum retain their existing owners.
 */
export namespace supportTargets {
  /**
   * Resolve a contact's target without freezing a moving prop or person.
   * @param context The action and its target readers.
   * @param contact The placed contact.
   * @param seconds Action-local seconds.
   * @returns World metres, or null for an unnamed floor contact.
   * @throws {HumanRefusal} When the row names on without supplying a surface.
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, time and unnamed-floor case.
   * @evidence contracts/development/implementation.md#principled-implementation Actual person landmarks use the existing rigid surface placement; an on offset is carried by F(t)F(start)^-1 from the existing support frame owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the target, then carry an on offset when it has a moving support.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Contact targets have no perceptual delay or world-fixed raised-surface offset.
   * @evidence contracts/development/implementation.md#efficient-algorithms One target reading, plus two existing support-frame readings for a framed on placement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Moving targets are deliberately reread, including when a plan is evaluated twice at the same second after its dependencies settle.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no frame or target cache.
   */
  export function point(
    context: IHumanActionContext<support.IParams>,
    contact: HumanSupport.IContact,
    seconds: number,
  ): IAutoMovieVector3 | null {
    const named: AutoMovieMotionTarget | null = target(context, contact);
    if (named === null) return null;
    const now: IAim = aim(context, named, context.start + seconds);
    if (contact.target !== "on") return now.point;
    const first: IAim = aim(context, named, context.start);
    const placed: IAutoMovieVector3 = supportContact.onSurface(
      context.body,
      contact,
      first.point,
      context.entry.posture.yaw,
    );
    const support: IHumanContactWindow.Support | undefined =
      named.kind === "prop"
        ? { kind: "prop", subject: named.subject }
        : named.kind === "person"
          ? named
          : undefined;
    if (support === undefined)
      return Vector3.add(now.point, Vector3.subtract(placed, first.point));
    const before: HumanSupportFrame.IFrame = HumanSupportFrame.at(
      context,
      context.start,
      support,
    );
    const after: HumanSupportFrame.IFrame = HumanSupportFrame.at(
      context,
      context.start + seconds,
      support,
    );
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      after.rotation,
      Quaternion.inverse(before.rotation),
    );
    return Vector3.add(
      now.point,
      Quaternion.rotateVector(turn, Vector3.subtract(placed, first.point)),
    );
  }

  /**
   * The canonical contact form with the actual raised support's normal.
   * @param context The action and its target readers.
   * @param contact The contact.
   * @param point Its current point, including a previously laid floor place.
   * @param seconds Action-local seconds.
   * @returns The existing fit's contact form.
   * @evidence contracts/development/common.md#meaningful-documentation States the point and normal roles and timebase.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the shared datum, then faces its outward skin normal against the raised surface's outward normal. Floor-bearing forms remain the floor owner's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical form and one optional normal replacement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A palm on a tilted prop does not silently keep a world-down normal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One form and at most one target reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing form owns every part's effector-local offset and bearing pattern.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function form(
    context: IHumanActionContext<support.IParams>,
    contact: HumanSupport.IContact,
    point: IAutoMovieVector3 | null,
    seconds: number,
  ): supportContact.IForm {
    const base: supportContact.IForm = supportContact.form(
      context.body,
      contact,
      point,
    );
    const named: AutoMovieMotionTarget | null = target(context, contact);
    if (
      named === null ||
      base.bearing !== undefined ||
      base.target.normal === undefined
    )
      return base;
    return {
      ...base,
      target: {
        ...base.target,
        normal: {
          ...base.target.normal,
          world: Vector3.scale(
            aim(context, named, context.start + seconds).normal,
            -1,
          ),
        },
      },
    };
  }
}

/** The point and outward normal of an actual support landmark. */
type IAim = ReturnType<IHumanActionContext["aim"]>;

/** Resolve the row's shared surface before asking the target owner. */
function target(
  context: IHumanActionContext<support.IParams>,
  contact: HumanSupport.IContact,
): AutoMovieMotionTarget | null {
  if (contact.target === undefined) return null;
  if (contact.target !== "on") return contact.target;
  if (context.params.on !== undefined) return context.params.on;
  throw new HumanRefusal({
    kind: "parameter",
    axis: "on",
    value: contact.part,
    reason: `the ${contact.part} needs the action's surface`,
    fix: "supply on for contacts placed on it",
  });
}

/** A bearing person's actual landmark, without a free reach's reaction delay. */
function aim(
  context: IHumanActionContext,
  target: AutoMovieMotionTarget,
  seconds: number,
): IAim {
  if (target.kind !== "person" || target.subject === context.subject)
    return context.aim(target, seconds);
  const other: IHumanActionContext.IPerformer = context.performer(
    target.subject,
  );
  const region: resolveAutoMovieHumanoidSurfaces.IFrame =
    other.body.surfaces.regions[target.region];
  return resolveAutoMovieHumanoidSurfaces.place(
    region,
    other.bones(seconds).get(region.bone)!,
  );
}
