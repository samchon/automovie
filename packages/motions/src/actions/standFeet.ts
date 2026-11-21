import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareStandSole } from "./prepareStandSole";
import { stand } from "./stand";

/**
 * A quiet stance's feet roll about their entry contacts. On a declared
 * ground plane, the rocker can use an actual supporting point of the sole.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact datum and both consumers.
 * @evidence contracts/development/design.md#principled-representation A planted foot rocks about one actual convex point when both feet can reach their declared sole planes. The other contact modes use their existing articulated socket course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One course builder, its flat ankle points, offset and posture writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads displayed sockets and uses HumanFoot.pivot, rather than subtracting a nominal ankle height.
 */
export namespace standFeet {
  /**
   * A planted foot's flattening course.
   * @evidence contracts/development/common.md#meaningful-documentation Documents each field's frame and share.
   * @evidence contracts/development/design.md#principled-representation The final ankle targets and the rigid-contact course are one plan.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ankle targets, pelvis displacement and posture writer used by quiet standing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared posture, placement and carry types.
   */
  export interface ICourse {
    /** Final ankle points, world metres. */
    flat: Record<"left" | "right", IAutoMovieVector3>;
    /** Read both rockers once for one share; the caller owns the sample. */
    sample(share: number): ISample;
    /** Mean ankle displacement from the flat targets at share 0 to 1. */
    offset(share: number): IAutoMovieVector3;
    /** Write the feet and toes at a share, optionally carried by their support. */
    write(
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
    ): IAutoMovieMotionHumanPosture;
  }

  /**
   * One synchronous course reading, shared by root placement and its feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the single-reading lifetime and the root/foot consumers; members state metres and carrying semantics.
   * @evidence contracts/development/design.md#principled-representation The same two rigid foot placements determine their mean displacement and the written goals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Quiet standing consumes both fields in one posture evaluation; the course retains no last query or sample history.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses existing posture and support-carry types and preserves the original rocker geometry.
   */
  export interface ISample {
    /** Mean world-metre ankle displacement from the final flat targets. */
    offset: IAutoMovieVector3;

    /** Write the already read feet, optionally moved by the current support. */
    write(
      posture: IAutoMovieMotionHumanPosture,
      carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
    ): IAutoMovieMotionHumanPosture;
  }

  /**
   * One foot's fixed-contact evaluations.
   * @evidence contracts/development/common.md#meaningful-documentation Each evaluator names its unit or frame.
   * @evidence contracts/development/design.md#principled-representation The same share places the ankle, articulates the toes and reads their contact offset.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the per-foot evaluations the paired course reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing foot placement and vector types.
   */
  interface IPlan {
    /** The foot. */
    side: "left" | "right";
    /** The ankle and rotation at a share. */
    at(share: number): IAutoMovieMotionHumanFoot.IPlacement;
    /** Toe flexion, degrees, at a share. */
    toes(share: number): number;
    /** The bearing offset in the foot's frame. */
    contact(share: number): IAutoMovieVector3;
  }

  /** Fixed share-one geometry used by both flat targets and completed rockers. */
  interface ISettled {
    /** The final ankle and foot rotation in the world. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** The final bearing offset in the foot's local frame, metres. */
    contact: IAutoMovieVector3;
  }

  /**
   * Build the foot course from the displayed entry.
   *
   * @param body The body.
   * @param entry The displayed state.
   * @param yaw The quiet heading, degrees.
   * @param planes Authoritative horizontal ground heights by foot, world metres. Omission keeps the socket course.
   * @returns The contact-preserving foot course.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation Ground rockers use an actual hull point bearing throughout the pitch arc. Its horizontal position stays fixed as the height settles to its declared plane. The socket path keeps the original articulated inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares the two foot plans once. The same course reader supplies the ankle targets, their mean displacement and the posture writer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both feet need compatible ground geometry before choosing the convex rocker. A floor plane is supplied by the action.
   * @evidence contracts/development/implementation.md#efficient-algorithms The sagittal hulls are searched during preparation only. The socket path requests only planted socket bones and their ancestry. Completed geometry is read once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Entry sockets serve floor and pivot selection, and fixed share-one foot/contact geometry also serves the flat targets. Each caller-owned sample shares its placements between offset and writing; no time-query result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The course retains the body, two entry contacts and two fixed endpoint placements/offsets for its plan; outward endpoint vectors are fresh copies, and each sample's two current placements end with that reading.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    yaw: number,
    planes?: Readonly<Record<"left" | "right", number>>,
  ): ICourse {
    const sides: readonly ["left", "right"] = ["left", "right"];
    const ground: IPlan[] = [];
    if (planes)
      for (const side of sides) {
        const foot: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[side];
        const pivot: ReturnType<typeof prepareStandSole> = prepareStandSole(
          body,
          side,
          foot,
          toeFlexion(side),
        );
        const plane: number = planes[side];
        if (
          !pivot ||
          !Number.isFinite(plane) ||
          Math.abs(pivot.entry.y - plane) > HumanFoot.BEARING
        )
          break;
        const from: number = HumanFoot.heading(foot.rotation);
        const turn: number = quietTurn(side, from);
        const pitch: number = HumanFoot.pitch(foot.rotation);
        ground.push({
          side,
          at: (share: number): IAutoMovieMotionHumanFoot.IPlacement => {
            const rotation: IAutoMovieQuaternion = HumanFoot.rotation(
              from + turn * share,
              pitch + (pivot.pitch - pitch) * share,
            );
            const point: IAutoMovieVector3 = {
              ...pivot.entry,
              y: pivot.entry.y + (plane - pivot.entry.y) * share,
            };
            return {
              ankle: Vector3.subtract(
                point,
                Quaternion.rotateVector(rotation, pivot.local),
              ),
              rotation,
            };
          },
          toes: (): number => 0,
          contact: (): IAutoMovieVector3 => pivot.local,
        });
      }

    const plans: IPlan[] = ground.length === sides.length ? ground : sockets();
    const settled: ISettled[] = plans.map(
      (p: IPlan): ISettled => ({
        placement: p.at(1),
        contact: p.contact(1),
      }),
    );
    const flat: ICourse["flat"] = {
      left: { ...settled[0]!.placement.ankle },
      right: { ...settled[1]!.placement.ankle },
    };
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw,
    );
    const sample: ICourse["sample"] = (share: number): ISample => {
      const placed: IAutoMovieMotionHumanFoot.IPlacement[] = plans.map(
        (p: IPlan, i: number): IAutoMovieMotionHumanFoot.IPlacement =>
          share === 1
            ? {
                ankle: { ...settled[i]!.placement.ankle },
                rotation: { ...settled[i]!.placement.rotation },
              }
            : p.at(share),
      );
      return {
        offset: Vector3.scale(
          plans.reduce(
            (sum: IAutoMovieVector3, p: IPlan, i: number): IAutoMovieVector3 =>
              Vector3.add(
                sum,
                Vector3.subtract(placed[i]!.ankle, flat[p.side]),
              ),
            { x: 0, y: 0, z: 0 },
          ),
          0.5,
        ),
        write: (
          posture: IAutoMovieMotionHumanPosture,
          carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
        ): IAutoMovieMotionHumanPosture => {
          const feet: ICourse["flat"] = Object.fromEntries(
            plans.map(
              (p: IPlan, i: number): [IPlan["side"], IAutoMovieVector3] => [
                p.side,
                carry?.point(placed[i]!.ankle) ?? placed[i]!.ankle,
              ],
            ),
          ) as ICourse["flat"];
          const limbs: IAutoMovieMotionHumanPosture["limbs"] =
            posture.yaw === yaw
              ? legged(posture.root, feet)
              : stand.legs(body, posture.root, posture.yaw, feet);
          const joints: IAutoMovieMotionHumanPosture["joints"] = {
            ...posture.joints,
          };
          for (let i: number = 0; i < plans.length; i++) {
            const p: IPlan = plans[i]!;
            const goal: IAutoMovieHumanLimbGoal = limbs[`${p.side}Leg`]!;
            limbs[`${p.side}Leg`] = {
              ...goal,
              rotation:
                carry === undefined
                  ? placed[i]!.rotation
                  : Quaternion.multiply(carry.turn, placed[i]!.rotation),
              contact:
                share === 1
                  ? { ...settled[i]!.contact }
                  : { ...p.contact(share) },
            };
            joints[`${p.side}Toes`] = [p.toes(share), 0, 0];
          }
          return { ...posture, joints, limbs: { ...posture.limbs, ...limbs } };
        },
      };
    };
    return {
      flat,
      sample,
      offset: (share: number): IAutoMovieVector3 => sample(share).offset,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        share: number,
        carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
      ): IAutoMovieMotionHumanPosture => sample(share).write(posture, carry),
    };

    /** Read toe flexion from the actual entry. */
    function toeFlexion(side: "left" | "right"): number {
      return (
        entry.pose.joints.find(
          (joint: IAutoMovieJointPose): boolean => joint.bone === `${side}Toes`,
        )?.flexion ?? 0
      );
    }

    /** Shortest turn from a displayed heading to the same quiet toe-out. */
    function quietTurn(side: "left" | "right", from: number): number {
      const heading: number =
        yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
      const turn: number = heading - from;
      return turn - 360 * Math.round(turn / 360);
    }

    /** Prepare the original articulated foot course for other support modes. */
    function sockets(): IPlan[] {
      const requested: Set<AutoMovieHumanoidBone> = new Set();
      for (const side of sides)
        if (entry.feet[side].planted)
          for (const socket of ["heel", "ball", "toe"] as const)
            requested.add(
              body.surfaces.sockets[
                `${socket}${side === "left" ? "Left" : "Right"}`
              ].bone,
            );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, entry.pose, undefined, requested);
      const planted: ("left" | "right")[] = sides.filter(
        (side: "left" | "right"): boolean => entry.feet[side].planted,
      );
      const socketsBySide: Partial<
        Record<"left" | "right", IAutoMovieMotionHumanFoot.ISocket[]>
      > = {};
      for (const side of planted)
        socketsBySide[side] = HumanFoot.sockets(body, bones, side);
      const floor: number =
        planted.length === 0
          ? 0
          : Math.min(
              ...planted.flatMap((side: "left" | "right"): number[] =>
                socketsBySide[side]!.map(
                  (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.y,
                ),
              ),
            );
      return sides.map((side: "left" | "right"): IPlan => {
        const heading: number =
          yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
        const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
        const fallback: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: HumanFrame.point(
            { origin: { ...entry.posture.root, y: floor }, yaw },
            rest,
          ),
          rotation: HumanFoot.rotation(heading, 0),
        };
        if (!entry.feet[side].planted)
          return {
            side,
            at: (_: number): IAutoMovieMotionHumanFoot.IPlacement => fallback,
            toes: (_: number): number => 0,
            contact: (_: number): IAutoMovieVector3 =>
              HumanFoot.offset(body, side, "mtp"),
          };
        const sockets: IAutoMovieMotionHumanFoot.ISocket[] =
          socketsBySide[side]!;
        const pivot: IAutoMovieMotionHumanFoot.ISocket = sockets.reduce(
          (
            a: IAutoMovieMotionHumanFoot.ISocket,
            b: IAutoMovieMotionHumanFoot.ISocket,
          ): IAutoMovieMotionHumanFoot.ISocket =>
            b.point.y < a.point.y ? b : a,
        );
        const rotation: IAutoMovieQuaternion = entry.feet[side].rotation;
        const from: number = HumanFoot.heading(rotation);
        const turn: number = quietTurn(side, from);
        const pitch: number = HumanFoot.pitch(rotation);
        const roll: number = HumanFoot.roll(rotation);
        const flexion: number = toeFlexion(side);
        const toes: (share: number) => number = (share: number): number =>
          flexion * (1 - share);
        return {
          side,
          at: (share: number): IAutoMovieMotionHumanFoot.IPlacement => {
            const placement: IAutoMovieMotionHumanFoot.IPlacement =
              HumanFoot.pivot(
                body,
                side,
                pivot.socket,
                pivot.point,
                from + turn * share,
                pitch * (1 - share),
                toes(share),
                roll * (1 - share),
              );
            return placement;
          },
          toes,
          contact: (share: number): IAutoMovieVector3 =>
            HumanFoot.offset(body, side, pivot.socket, toes(share)),
        };
      });
    }
  }
}
