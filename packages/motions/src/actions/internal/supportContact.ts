import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { prepareSupportContactForm } from "./prepareSupportContactForm";
import { supportContactOnFloor } from "./supportContactOnFloor";

/*
 * A support planner's contact (`support`) as the whole-body fit takes it and as
 * the course between keys pivots about it: the bone and point that bear, the
 * place held, the normal laid flat and the bones that bear on the floor.
 */
export namespace supportContact {
  /*
   * A contact as the fit takes it: its target and the part that bears on the
   * floor.
   */
  export interface IForm {
    /*
     * The fit's target.
     */
    target: IAutoMovieMotionHumanBodyFitTypes.ITarget;

    /*
     * The bones that bear on the floor, for a contact on it.
     */
    bearing?: RegExp;
  }

  /*
   * Body-fixed contact geometry shared within one operation;
   * prepareSupportContactForm owns its lifetime and mapping.
   */
  export const prepareForm: typeof prepareSupportContactForm =
    prepareSupportContactForm;

  /*
   * The form's existing floor-height predicate, without constructing unused
   * target geometry.
   */
  export const onFloorTarget: typeof supportContactOnFloor =
    supportContactOnFloor;

  /*
   * The target of a part stepping from one contact to another, at the top of
   * its swing: over the middle of the step, lifted by a stepping limb's rise
   * (`crawl.LIFT`) above the higher end, its surface facing as it will bear.
   * Where only one end has a place the swing rises over it; where neither has,
   * the part swings free.
   * Parameter form: The plan's contact forms (`prepareForm`) for its body.
   * Parameter to: The contact it steps to.
   * Parameter from: Where it leaves, world metres; no place when null.
   * Parameter onto: Where it sets down, world metres; no place when null.
   * Parameter via: A caller-owned world waypoint that clears the obstacle, when
   * given.
   * Parameter rise: How high the swing clears the higher end, metres.
   * Returns: The fit's target, or null for a step with no place.
   */
  export function swing(
    form: ReturnType<typeof prepareSupportContactForm>,
    to: IAutoMovieMotionHumanSupport.IContact,
    from: IAutoMovieVector3 | null,
    onto: IAutoMovieVector3 | null,
    rise: number,
    via?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanBodyFitTypes.ITarget | null {
    if (via !== undefined) return form({ ...to, kind: "bear" }, via).target;
    const a: IAutoMovieVector3 | null = from ?? onto;
    const b: IAutoMovieVector3 | null = onto ?? from;
    if (a === null || b === null) return null;
    const top: IAutoMovieVector3 = {
      x: (a.x + b.x) / 2,
      y: Math.max(a.y, b.y) + rise,
      z: (a.z + b.z) / 2,
    };
    return form({ ...to, kind: "bear" }, top).target;
  }

  /*
   * The contact window's part a support part bears through: a knee through its
   * shin, the lower leg's window; the trunk's window named by the back for
   * every lying position, the front's too, as the lying law names it
   * (`lieDown`); any other part its own.
   * Parameter part: The support part.
   * Returns: The contact window's part name.
   */
  export function window(part: IAutoMovieMotionHumanSupport.Part): string {
    return part.endsWith("Knee")
      ? part.replace("Knee", "LowerLeg")
      : part === "front"
        ? "back"
        : part;
  }

  /*
   * The limb a part belongs to, which steps as one: a foot and its knee are one
   * leg, a hand its arm; a part of the trunk is its own, since the trunk rolls
   * from one to another and never steps.
   * Parameter part: The support part.
   * Returns: The limb's name.
   */
  export function limb(part: IAutoMovieMotionHumanSupport.Part): string {
    return part.endsWith("Foot") || part.endsWith("Knee")
      ? `${part.startsWith("left") ? "left" : "right"}Leg`
      : part.endsWith("Hand")
        ? `${part.startsWith("left") ? "left" : "right"}Arm`
        : part;
  }

  /*
   * Whether two contacts are one: the same part on the same target.
   * Parameter a: A contact.
   * Parameter b: Another.
   * Returns: Whether their identities match.
   */
  export function same(
    a: IAutoMovieMotionHumanSupport.IContact,
    b: IAutoMovieMotionHumanSupport.IContact,
  ): boolean {
    return id(a) === id(b);
  }
  /*
   * A contact's identity: its part, how it touches, its target, its inset and
   * the stance it was set down in (`placements`), empty for a contact not yet
   * placed.
   * Parameter c: The contact.
   * Returns: The identity string.
   */
  export function id(c: IdC): string {
    const placed: IdPlaced = c.placed ?? "";
    return `${c.part}|${c.kind}|${JSON.stringify(c.target)}|${c.inset ?? 0}|${placed}`;
  }

  /*
   * A contact with the index of the stance it was last set down in.
   */
  export interface IPlaced extends IAutoMovieMotionHumanSupport.IContact {
    /*
     * The stance it was set down in.
     */
    placed: number;
  }

  /*
   * The stances with each contact marked by the stance it was set down in: a
   * part bearing in the stance before on the same target and in the same way
   * bears on from it, and one that bore in none, or that the stance sets down
   * anew (`step`), is set down in that stance.
   * Parameter stances: The authored stances.
   * Returns: The stances with placed contacts.
   */
  export function placements(
    stances: readonly IAutoMovieMotionHumanSupport.IStance[],
  ): IAutoMovieMotionHumanSupport.IStance[] {
    const out: IAutoMovieMotionHumanSupport.IStance[] = [];
    stances.forEach(
      (stance: IAutoMovieMotionHumanSupport.IStance, i: number): void => {
        const before: readonly IAutoMovieMotionHumanSupport.IContact[] =
          i === 0 ? [] : out[i - 1]!.contacts;
        out.push({
          ...stance,
          contacts: stance.contacts.map(
            (c: IAutoMovieMotionHumanSupport.IContact): IPlaced => {
              const was: IAutoMovieMotionHumanSupport.IContact | undefined =
                c.step === true
                  ? undefined
                  : before.find(
                      (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
                        p.part === c.part &&
                        p.kind === c.kind &&
                        (p.inset ?? 0) === (c.inset ?? 0) &&
                        JSON.stringify(p.target) === JSON.stringify(c.target),
                    );
              return {
                ...c,
                placed: was === undefined ? i : (was as IPlaced).placed,
              };
            },
          ),
        });
      },
    );
    return out;
  }

  /*
   * Where a contact on the action's surface (`on`) lies: on its own side of the
   * surface's point (a hand out by the shoulder's half width, a foot or a knee
   * by the hip's, the trunk at its middle) and in from the edge along the
   * heading by its inset (`HumanSupport.IContact.inset`), a share of the
   * forearm and hand's length.
   * Parameter body: The body.
   * Parameter c: The contact.
   * Parameter edge: The surface's point, world metres.
   * Parameter yaw: The heading the body enters with, degrees.
   * Returns: The place, world metres.
   */
  export function onSurface(
    body: IAutoMovieMotionHumanBody,
    c: IAutoMovieMotionHumanSupport.IContact,
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
    const frame: IAutoMovieMotionHumanFrame = { origin: edge, yaw };
    return HumanFrame.point(frame, {
      x: sign * half,
      y: 0,
      z: (c.inset ?? 0) * reach,
    });
  }

  /*
   * Where support parts bear in one posture, dropped to the floor: the places
   * contacts without one keep, in the parts' order.
   */
  export function onFloors(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    parts: readonly IAutoMovieMotionHumanSupport.Part[],
  ): IAutoMovieVector3[] {
    return pinnedMany(body, posture, parts).map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: point.x,
        y: 0,
        z: point.z,
      }),
    );
  }

  /*
   * Read contact points on one unchanged candidate posture in their given
   * order. Its actual canonical observation and FK are shared within this
   * synchronous call; each local contact offset keeps the form's owner.
   */
  export function points(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    contacts: readonly IPoint[],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3[] {
    return preparePoints(body, contacts)(posture, resolution, projection);
  }

  /*
   * Prepare the exact local contact datums and demanded frames for fixed
   * contacts/targets on one unchanged body. Each returned read observes its
   * actual current posture; no achieved point or pose is prepared here.
   * Parameter body: The unchanged body/surfaces/rig.
   * Parameter contacts: Fixed ordered contact/target pairs, including null floor
   * places.
   * Returns: A fresh-point reader borrowing optional exact FK and genuine ROM
   * metadata only for its current synchronous call.
   */
  export function preparePoints(
    body: IAutoMovieMotionHumanBody,
    contacts: readonly IPoint[],
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieVector3[] {
    if (contacts.length === 0) return (): IAutoMovieVector3[] => [];
    const form: ReturnType<typeof prepareSupportContactForm> =
      prepareSupportContactForm(body, false);
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = contacts.map(
      (item: IPoint): IAutoMovieMotionHumanBodyFitTypes.ITarget =>
        form(item.contact, item.at).target,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      targets.map(
        (
          target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
        ): AutoMovieHumanoidBone => target.bone,
      ),
    );
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
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
      return targets.map(
        (
          target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
        ): IAutoMovieVector3 => {
          const bone: IAutoMovieResolvedBone = bones.get(target.bone)!;
          return AutoMovieEngineVector3.add(
            bone.worldPosition,
            AutoMovieEngineQuaternion.rotateVector(
              bone.worldRotation,
              target.point ?? { x: 0, y: 0, z: 0 },
            ),
          );
        },
      );
    };
  }

  /*
   * A contact, with the stance it was set down in once it is placed.
   */
  type IdC = IAutoMovieMotionHumanSupport.IContact &
    Partial<Pick<IPlaced, "placed">>;

  /*
   * One current contact observation, including an unnamed floor target.
   */
  interface IPoint {
    /*
     * The contact whose actual form supplies its local offset.
     */
    contact: IAutoMovieMotionHumanSupport.IContact;

    /*
     * The world-metre target, or null for an unnamed floor place.
     */
    at: IAutoMovieVector3 | null;
  }

  /*
   * Observe one candidate's part-origin frames without a goal or offset
   * substitution.
   */
  function pinnedMany(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    parts: readonly IAutoMovieMotionHumanSupport.Part[],
  ): IAutoMovieVector3[] {
    if (parts.length === 0) return [];
    const names: AutoMovieHumanoidBone[] = parts.map(
      (part: IAutoMovieMotionHumanSupport.Part): AutoMovieHumanoidBone => {
        const side: AutoMovieHumanSide = part.startsWith("left")
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

/*
 * The alternatives of `IdPlaced`'s site.
 */
type IdPlaced = number | string;
