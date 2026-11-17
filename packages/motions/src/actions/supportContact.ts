import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanSupport } from "../law/HumanSupport";
import type { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { prepareSupportContactForm } from "./prepareSupportContactForm";
import { supportContactOnFloor } from "./supportContactOnFloor";

/**
 * A support planner's contact (`support`) as the whole-body fit takes it
 * and as the course between keys pivots about it: the bone and point that
 * bear, the place held, the normal laid flat and the bones that bear on the
 * floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read for each part.
 * @evidence contracts/development/design.md#principled-representation A contact becomes a fit target and a bearing pattern, and a part the bone its contact rides.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The form, its builder and the pin reader, read by the support law alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The normals are the quiet stance's and the palm socket's own; no angle is typed.
 */
export namespace supportContact {
  /** A contact as the fit takes it: its target and the part that bears on the floor. */
  export interface IForm {
    /** The fit's target. */
    target: HumanBodyFit.ITarget;

    /** The bones that bear on the floor, for a contact on it. */
    bearing?: RegExp;
  }

  /**
   * A contact as the fit takes it. A part on the floor bears on it, its
   * place held across the floor and its height left to the bearing; a part
   * above it is brought to its target on all three axes. A foot lies with
   * its toes flat, a palm flat facing down, as the quiet stance and the
   * hand's palm socket give their normals.
   */
  export function form(
    body: IHumanBody,
    c: HumanSupport.IContact,
    aimed: IAutoMovieVector3 | null,
  ): IForm {
    return prepareSupportContactForm(body)(c, aimed);
  }

  /** Body-fixed contact geometry shared within one operation; prepareSupportContactForm owns its lifetime and exact mapping. */
  export const prepareForm: typeof prepareSupportContactForm =
    prepareSupportContactForm;

  /** The form's existing floor-height predicate, without constructing unused target geometry. */
  export const onFloorTarget: typeof supportContactOnFloor =
    supportContactOnFloor;

  /**
   * The target of a part stepping from one contact to another, at the top
   * of its swing: over the middle of the step, lifted by a stepping limb's
   * rise (`crawl.LIFT`) above the higher end, its surface facing as it will
   * bear. Where only one end has a place the swing rises over it; where
   * neither has, the part swings free.
   *
   * @param body The body.
   * @param to The contact it steps to.
   * @param from Where it leaves, world metres; no place when null.
   * @param onto Where it sets down, world metres; no place when null.
   * @param rise How high the swing clears the higher end, metres.
   * @returns The fit's target, or null for a step with no place.
   */
  export function swing(
    body: IHumanBody,
    to: HumanSupport.IContact,
    from: IAutoMovieVector3 | null,
    onto: IAutoMovieVector3 | null,
    rise: number,
  ): HumanBodyFit.ITarget | null {
    const a: IAutoMovieVector3 | null = from ?? onto;
    const b: IAutoMovieVector3 | null = onto ?? from;
    if (a === null || b === null) return null;
    const top: IAutoMovieVector3 = {
      x: (a.x + b.x) / 2,
      y: Math.max(a.y, b.y) + rise,
      z: (a.z + b.z) / 2,
    };
    return form(body, { ...to, kind: "bear" }, top).target;
  }

  /**
   * The contact window's part a support part bears through: a knee through
   * its shin, the lower leg's window; the trunk's window named by the back
   * for every lying position, the front's too, as the lying law names it
   * (`lieDown`); any other part its own.
   */
  export function window(part: HumanSupport.Part): string {
    return part.endsWith("Knee")
      ? part.replace("Knee", "LowerLeg")
      : part === "front"
        ? "back"
        : part;
  }

  /**
   * The limb a part belongs to, which steps as one: a foot and its knee are
   * one leg, a hand its arm; a part of the trunk is its own, since the
   * trunk rolls from one to another and never steps.
   */
  export function limb(part: HumanSupport.Part): string {
    return part.endsWith("Foot") || part.endsWith("Knee")
      ? `${part.startsWith("left") ? "left" : "right"}Leg`
      : part.endsWith("Hand")
        ? `${part.startsWith("left") ? "left" : "right"}Arm`
        : part;
  }

  /** Whether two contacts are one: the same part on the same target. */
  export function same(
    a: HumanSupport.IContact,
    b: HumanSupport.IContact,
  ): boolean {
    return id(a) === id(b);
  }

  /** A contact's identity: its part, how it touches, its target and the stance it was set down in (`placements`). */
  export function id(c: HumanSupport.IContact): string {
    return `${c.part}|${c.kind}|${JSON.stringify(c.target)}|${c.inset ?? 0}|${(c as Partial<IPlaced>).placed ?? ""}`;
  }

  /** A contact with the index of the stance it was last set down in. */
  export interface IPlaced extends HumanSupport.IContact {
    /** The stance it was set down in. */
    placed: number;
  }

  /**
   * The stances with each contact marked by the stance it was set down in: a
   * part bearing in the stance before on the same target and in the same way
   * bears on from it, and one that bore in none, or that the stance sets down
   * anew (`step`), is set down in that stance.
   */
  export function placements(
    stances: readonly HumanSupport.IStance[],
  ): HumanSupport.IStance[] {
    const out: HumanSupport.IStance[] = [];
    stances.forEach((stance: HumanSupport.IStance, i: number): void => {
      const before: readonly HumanSupport.IContact[] =
        i === 0 ? [] : out[i - 1]!.contacts;
      out.push({
        ...stance,
        contacts: stance.contacts.map((c: HumanSupport.IContact): IPlaced => {
          const was: HumanSupport.IContact | undefined =
            c.step === true
              ? undefined
              : before.find(
                  (p: HumanSupport.IContact): boolean =>
                    p.part === c.part &&
                    p.kind === c.kind &&
                    (p.inset ?? 0) === (c.inset ?? 0) &&
                    JSON.stringify(p.target) === JSON.stringify(c.target),
                );
          return {
            ...c,
            placed: was === undefined ? i : (was as IPlaced).placed,
          };
        }),
      });
    });
    return out;
  }

  /**
   * Where a contact on the action's surface (`on`) lies: on its own side of
   * the surface's point (a hand out by the shoulder's half width, a foot or
   * a knee by the hip's, the trunk at its middle) and in from the edge
   * along the heading by its inset (`HumanSupport.IContact.inset`), a share
   * of the forearm and hand's length.
   *
   * @param body The body.
   * @param c The contact.
   * @param edge The surface's point, world metres.
   * @param yaw The heading the body enters with, degrees.
   * @returns The place, world metres.
   */
  export function onSurface(
    body: IHumanBody,
    c: HumanSupport.IContact,
    edge: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieVector3 {
    const sign: number = c.part.startsWith("left")
      ? 1
      : c.part.startsWith("right")
        ? -1
        : 0;
    const half: number = c.part.endsWith("Hand")
      ? body.measure.shoulderHalfWidth
      : body.measure.hipHalfWidth;
    const reach: number = body.measure.forearm + body.measure.hand;
    const frame: HumanFrame.IFrame = { origin: edge, yaw };
    return HumanFrame.point(frame, {
      x: sign * half,
      y: 0,
      z: (c.inset ?? 0) * reach,
    });
  }

  /** Where a part bears in a posture, dropped to the floor: the place a contact without one keeps. */
  export function onFloor(
    body: IHumanBody,
    posture: IHumanPosture,
    part: HumanSupport.Part,
  ): IAutoMovieVector3 {
    return onFloors(body, posture, [part])[0]!;
  }

  /**
   * Read several support parts on the same unchanged posture, dropping their
   * existing bone-origin datums to the floor in the original part order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged posture/body, ordered part datums and world-metre floor projection.
   * @evidence contracts/development/implementation.md#principled-implementation Uses pinned's identical part-to-bone mapping and actual canonical bone positions, then retains each point's x/z with y zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private batch owns the bone observation, followed by one ordered floor projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sole offset, declared target, guessed height or fitted-pose reuse replaces the original bone-origin datum; scalar onFloor delegates this same owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms N parts share one canonical observational solve and one FK of their named bones/ancestry instead of N solves; empty input performs no solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All parts observe the same unchanged input in one synchronous invocation; canonical ordered admission and unsupported-context full fallback remain in the resolver.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary bone names, current map and workspace end with the call; N fresh world-metre floor points return with no retained current pose or history.
   */
  export function onFloors(
    body: IHumanBody,
    posture: IHumanPosture,
    parts: readonly HumanSupport.Part[],
  ): IAutoMovieVector3[] {
    return pinnedMany(body, posture, parts).map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: point.x,
        y: 0,
        z: point.z,
      }),
    );
  }

  /**
   * The exact point the contact's fit target rides, using the same local
   * offset for seed placement as for its solved residual.
   *
   * @param body The body.
   * @param posture The candidate posture.
   * @param contact The contact.
   * @param aimed Its target, world metres, or null on an unnamed floor place.
   * @param resolution Optional exact FK source borrowed only for this current query.
   * @param projection Optional genuine same-body ROM metadata from that query.
   * @returns The contact point, world metres.
   * @evidence contracts/development/common.md#meaningful-documentation States the shared datum and its frame.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid point is its bone origin plus its rotated local offset, taken from the fit's own form.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One form and one forward kinematics.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raised skin contacts keep their surface offset; floor joint datums retain their existing meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose resolution.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses form rather than duplicating the part map.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    body: IHumanBody,
    posture: IHumanPosture,
    contact: HumanSupport.IContact,
    aimed: IAutoMovieVector3 | null,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3 {
    return points(
      body,
      posture,
      [{ contact, at: aimed }],
      resolution,
      projection,
    )[0]!;
  }

  /**
   * Read contact points on one unchanged candidate posture in their given
   * order. Its actual canonical observation and FK are shared within this
   * synchronous call; each local contact offset keeps the form's owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged candidate/body, ordered world-metre outputs, shared synchronous observation and canonical contact offsets; optional FK/ROM inputs are current-query loans only.
   * @evidence contracts/development/implementation.md#principled-implementation Builds each original contact form and transforms its exact local offset through the actual resolved target bone, with the resolver's existing observational-demand guards.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Forms determine one demanded-bone set, one canonical solve/FK supplies those frames, then one ordered transform pass emits the points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All target offsets, authored admission, relevant limb/digit fits and unsupported-context full fallbacks remain canonical; no declared target substitutes for an achieved bone point.
   * @evidence contracts/development/implementation.md#efficient-algorithms N contacts share one candidate pose/FK instead of N repeated solves; point-only forms demand no unused quiet-foot-normal solve, only target frames and ancestry are requested, and an empty request performs no solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All contacts observe exactly this same unchanged candidate/body in one synchronous operation. Optional parent FK/ROM sources share only exact prerequisites; every current joint/fit remains canonical, and the current map, metadata reader and prepared form do not escape.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources N target records, one bounded name set and current bone map end with this call or throw; only N fresh world points return and no workspace, posed result or history is retained.
   */
  export function points(
    body: IHumanBody,
    posture: IHumanPosture,
    contacts: readonly IPoint[],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3[] {
    return preparePoints(body, contacts)(posture, resolution, projection);
  }

  /**
   * Prepare the exact local contact datums and demanded frames for fixed
   * contacts/targets on one unchanged body. Each returned read observes its
   * actual current posture; no achieved point or pose is prepared here.
   *
   * @param body The unchanged body/surfaces/rig.
   * @param contacts Fixed ordered contact/target pairs, including null floor places.
   * @returns A fresh-point reader borrowing optional exact FK and genuine ROM metadata only for its current synchronous call.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines immutable body/contact/target geometry, ordered world-metre outputs, fresh current observations and nonescaping optional FK/ROM sources.
   * @evidence contracts/development/implementation.md#principled-implementation The existing point-only form owner supplies each exact local datum. A canonical actual posture solve and demanded FK transform those datums by their current bones under the original guarded observational policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed forms, ordered targets and a genuine named-frame reader prepare once; each current query performs the same canonical solve/FK and ordered rigid transforms as points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No declared target replaces its achieved point; relevant limb/digit fits, every authored joint and unsupported-context full fallback remain native. Point-only preparation retains the existing omission of unused quiet-foot normals.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) contact/name preparation serves Q observations without rebuilding their forms/name set or FK demand. Each observation still resolves its complete current authored inputs and transforms N actual contact datums; an empty list needs no solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/surface/contact/target geometry proves fixed forms and demands. Every current posture/achieved point remains evaluated; schedule-dependent consumers discard this producer at settle before using final target geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fixed-contact operation owns N target datums and a bounded genuine name reader until release or settlement. Each call's borrowed/owned workspace, current pose and map end on return or throw; no posed result, current point or query history is stored.
   */
  export function preparePoints(
    body: IHumanBody,
    contacts: readonly IPoint[],
  ): (
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieVector3[] {
    if (contacts.length === 0) return (): IAutoMovieVector3[] => [];
    const form: ReturnType<typeof prepareSupportContactForm> =
      prepareSupportContactForm(body, false);
    const targets: HumanBodyFit.ITarget[] = contacts.map(
      (item: IPoint): HumanBodyFit.ITarget =>
        form(item.contact, item.at).target,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      targets.map(
        (target: HumanBodyFit.ITarget): AutoMovieHumanoidBone => target.bone,
      ),
    );
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    return (
      posture: IHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieVector3[] => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const bones: ReturnType<typeof poseBones> = frames(
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          undefined,
          read,
          requested,
          projection,
        ).pose,
        read(),
      );
      return targets.map((target: HumanBodyFit.ITarget): IAutoMovieVector3 => {
        const bone: IAutoMovieResolvedBone = bones.get(target.bone)!;
        return Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(
            bone.worldRotation,
            target.point ?? { x: 0, y: 0, z: 0 },
          ),
        );
      });
    };
  }

  /** One current contact observation, including an unnamed floor target. */
  interface IPoint {
    /** The contact whose actual form supplies its local offset. */
    contact: HumanSupport.IContact;

    /** The world-metre target, or null for an unnamed floor place. */
    at: IAutoMovieVector3 | null;
  }
  /** Where a part bears in a posture: the joint or bone its contact rides. */
  export function pinned(
    body: IHumanBody,
    posture: IHumanPosture,
    part: HumanSupport.Part,
  ): IAutoMovieVector3 {
    return pinnedMany(body, posture, [part])[0]!;
  }

  /** Observe one immutable candidate's exact part-origin frames without a goal or offset substitution. */
  function pinnedMany(
    body: IHumanBody,
    posture: IHumanPosture,
    parts: readonly HumanSupport.Part[],
  ): IAutoMovieVector3[] {
    if (parts.length === 0) return [];
    const names: AutoMovieHumanoidBone[] = parts.map(
      (part: HumanSupport.Part): AutoMovieHumanoidBone => {
        const side: "left" | "right" = part.startsWith("left")
          ? "left"
          : "right";
        return part.endsWith("Foot")
          ? `${side}Toes`
          : part.endsWith("Hand")
            ? `${side}Hand`
            : part.endsWith("Knee")
              ? `${side}LowerLeg`
              : "hips";
      },
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(names);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        resolution,
        requested,
      ).pose,
      resolution(),
      requested,
    );
    return names.map(
      (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        bones.get(bone)!.worldPosition,
    );
  }
}
