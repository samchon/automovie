import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * A grasp chosen for what the tool is taken up for, and not only for the
 * reach: the use names the tool's working point and how the tool's line,
 * from its handle to that point, lies to the forearm when it is presented.
 *
 * A handle can be wrapped from any side, and the side a hanging arm reaches
 * most easily leaves a blade or a barrel where the wrist cannot later aim
 * it. So a grasp taken for a use must also hold in one more key pose of the
 * grasp's choice (`HumanGrasp.reachable`): the tool presented ahead of the
 * shoulder on the line of its use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a use names, why the reach alone is not enough and how the use enters the grasp's choice.
 * @evidence contracts/development/design.md#principled-representation A use is the tool's working point by its affordance id and one of three lines to the forearm, the hammer, oblique and in-line grips of the grasp taxonomies (Feix et al. 2016); the search ranges are data beside it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The use, its three lines, the bounds of the search and the presented key; read by `pickUp`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool kind is named: a sword and a pistol differ only in the id of their working point and the line asked.
 */
export namespace HumanGraspUse {
  /** The use a tool is taken up for. */
  export interface IUse {
    /** The affordance id of the tool's working point: a blade's point, a muzzle, a hammer's face. The tool's line runs from the handle to it. */
    tip: string;

    /**
     * How the tool's line lies to the forearm when it is presented: `forearm`
     * continues it, as a pistol's bore and a thrusting point do; `oblique`
     * rises 45 degrees from it, a sabre grip across the palm; `square`
     * stands upright on it, a hammer grip.
     */
    line: "forearm" | "oblique" | "square";

    /**
     * Where the tool is used, which is where the grasp must also hold:
     * `ahead` presents it ahead of the shoulder, as a blade or a barrel is
     * aimed; `mouth` brings its working point to the performer's own mouth,
     * as a vessel's lip is drunk from; a `region` brings it to that named
     * region of the performer's own body, as a razor's edge is laid on the
     * jaw or a comb on the scalp. `ahead` when absent. At the mouth or a
     * region the level part of the line runs from the hand back into the
     * body (a cigarette's or a spoon's `forearm` line points at the lips),
     * and `square` stays upright.
     */
    at?: "ahead" | "mouth" | { region: AutoMovieHumanoidRegion };
  }

  /** The tool line's rise above the level forward line when presented, degrees, by use. */
  export const RISE: Readonly<Record<IUse["line"], number>> = {
    forearm: 0,
    oblique: 45,
    square: 90,
  };

  /** The most a grasp chosen for a use may leave unmet at its presented pose, as `HumanGrasp.IReach.miss` counts it (degrees of hand rotation plus millimetres of wrist place; provisional: 15, about what a wrist takes up unseen). */
  export const UNMET: number = 15;

  /**
   * The turns about a handle's axis tried for a grasp chosen for a use,
   * degrees: the whole way round in steps of 30, since the side the use
   * needs may be the far one. The authored side comes first and the far
   * side last, so a grip that holds the use is met early and the search
   * drops dearer candidates before fitting their poses.
   */
  export const AROUND: readonly number[] = [
    0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180,
  ];

  /** The tilts of the hand about its approach tried for a grasp chosen for a use, degrees, the untilted grip first: up to 60 either way, the oblique grip a blade held along the forearm takes with the rest left to the wrist's deviation (provisional; a grasp chosen for the reach alone tries up to 45). */
  export const OBLIQUE: readonly number[] = [
    0, 15, -15, 30, -30, 45, -45, 60, -60,
  ];

  /** The rolls about the tool's line tried when it is presented, degrees: the whole way round in steps of 15. */
  export const ROLLS: readonly number[] = Array.from(
    { length: 24 },
    (_: unknown, index: number): number => -180 + 15 * index,
  );

  /**
   * The pose a tool is presented in for its use, as a key the grasp must
   * also hold: the wrist ahead of the shoulder, a little below it, and the
   * hand turned so that the tool's line lies on the line the use names, in
   * the plane the body faces.
   *
   * @param props The action's context, the prop and its handle, the hand, the hand the arm shows for the candidate grasp, the use, and the hand's own rotation at a place (what the arm gives it there when none is asked).
   * @returns The key pose.
   * @throws {HumanRefusal} An `affordance` refusal on `use` when the prop declares no such working point, listing its contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pose, each input and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The tool is rigid in the hand from the grasp on, so the hand's rotation there is the candidate grasp's rotation turned by the shortest turn that takes the tool's line, as it lies now, onto the asked line. The roll about that line is free in a use that names only a line, so of the rolls tried the hand takes the one nearest its own rotation at that place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two contacts, the two lines, the turn between them, the place, the roll.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lines that oppose each other turn about the body's left instead of an undefined axis. The place's shares of the arm (0.6 ahead, 0.1 below) are provisional and named at the code.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and twenty-four quaternion products; the caller keeps the hand's own rotation per place.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the entry pose's bones once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function presented(props: {
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "start">;
    prop: string;
    handle: string;
    side: HumanHand.Side;
    wrist: HumanHand.IWrist;
    use: IUse;
    natural: (point: IAutoMovieVector3) => IAutoMovieQuaternion;
  }): HumanGrasp.IKey {
    const context: (typeof props)["context"] = props.context;
    const held: IHumanActionContext.IProp = context.prop(props.prop);
    const contact = (id: string): IAutoMovieAffordance | undefined =>
      (held.prop.affordances ?? []).find(
        (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
      );
    const handle: IAutoMovieAffordance | undefined = contact(props.handle);
    const tip: IAutoMovieAffordance | undefined = contact(props.use.tip);
    if (handle === undefined || tip === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "use",
        value: `${props.prop}.${props.use.tip}`,
        feasible: {
          kind: "alternatives",
          values: (held.prop.affordances ?? []).map(
            (affordance: IAutoMovieAffordance): string => affordance.id,
          ),
        },
        reason: `${props.prop} declares no ${props.use.tip}, the working point its use names`,
        fix: "name one of the prop's contacts as the tip, or pick the prop up without a use",
      });

    // The tool's line as it lies now, and the line asked: forward of the
    // body, risen by the use's angle.
    const lying: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(
        held.frame(context.start).rotation,
        Vector3.subtract(tip.frame.translation, handle.frame.translation),
      ),
    );
    const yaw: number = (context.entry.posture.yaw * Math.PI) / 180;
    const rise: number = (RISE[props.use.line] * Math.PI) / 180;
    const forward: IAutoMovieVector3 = {
      x: Math.sin(yaw),
      y: 0,
      z: Math.cos(yaw),
    };

    // Ahead of the body the tool's line runs away from it. At the mouth or
    // a region it runs back into the body, from the hand before it to the
    // working point there: a line that ran forward would put the handle
    // inside the head.
    const at: AutoMovieHumanoidRegion | undefined =
      props.use.at === "mouth"
        ? "mouth"
        : typeof props.use.at === "object"
          ? props.use.at.region
          : undefined;
    const level: number = at === undefined ? 1 : -1;
    const asked: IAutoMovieVector3 = {
      x: level * forward.x * Math.cos(rise),
      y: Math.sin(rise),
      z: level * forward.z * Math.cos(rise),
    };

    // The shortest turn from one line to the other; lines that oppose each
    // other turn about the body's left, which keeps the turn in the plane
    // the body faces.
    const across: IAutoMovieVector3 = Vector3.cross(lying, asked);
    const axis: IAutoMovieVector3 =
      Vector3.length(across) > 1e-9
        ? Vector3.normalize(across)
        : { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
    const laid: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle(
        axis,
        (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(lying, asked)))) *
          180) /
          Math.PI,
      ),
      props.wrist.rotation,
    );

    // Ahead of the shoulder by six tenths of the arm and a tenth below it,
    // where a tool is held to be aimed (provisional shares).
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
    );
    const joint = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)?.worldPosition ?? { x: 0, y: 0, z: 0 };
    const shoulder: IAutoMovieVector3 = joint(`${props.side}UpperArm`);
    const arm: number =
      Vector3.length(
        Vector3.subtract(joint(`${props.side}LowerArm`), shoulder),
      ) +
      Vector3.length(
        Vector3.subtract(
          joint(`${props.side}Hand`),
          joint(`${props.side}LowerArm`),
        ),
      );
    const ahead: IAutoMovieVector3 = {
      x: shoulder.x + 0.6 * arm * forward.x,
      y: shoulder.y - 0.1 * arm,
      z: shoulder.z + 0.6 * arm * forward.z,
    };

    // At the mouth or a region, the tool's working point goes there and
    // the wrist follows from the hand's rotation: the point is rigid in the
    // hand, at the offset it has in the candidate grasp.
    const region: IHumanBody["surfaces"]["regions"]["mouth"] | undefined =
      at === undefined ? undefined : context.body.surfaces.regions[at];
    const bearer: IAutoMovieResolvedBone | undefined =
      region === undefined ? undefined : bones.get(region.bone);
    const site: IAutoMovieVector3 | undefined =
      region !== undefined && bearer !== undefined
        ? resolveAutoMovieHumanoidSurfaces.place(region, bearer).point
        : undefined;
    const inHand: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(props.wrist.rotation),
      Vector3.subtract(
        Vector3.add(
          held.frame(context.start).position,
          Quaternion.rotateVector(
            held.frame(context.start).rotation,
            tip.frame.translation,
          ),
        ),
        props.wrist.point,
      ),
    );

    // Of the rolls about the asked line, the one nearest the hand's own
    // rotation there (near the mouth or a region, read a hand's length
    // ahead of it, where the wrist comes to lie).
    const own: IAutoMovieQuaternion = props.natural(
      site === undefined
        ? ahead
        : Vector3.add(site, Vector3.scale(forward, Vector3.length(inHand))),
    );
    let rotation: IAutoMovieQuaternion = Quaternion.normalize(laid);
    let nearest: number = -1;
    for (const roll of ROLLS) {
      const rolled: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(Quaternion.fromAxisAngle(asked, roll), laid),
      );
      const alike: number = Math.abs(
        rolled.x * own.x +
          rolled.y * own.y +
          rolled.z * own.z +
          rolled.w * own.w,
      );
      if (alike > nearest) {
        nearest = alike;
        rotation = rolled;
      }
    }
    const point: IAutoMovieVector3 =
      site === undefined
        ? ahead
        : Vector3.subtract(site, Quaternion.rotateVector(rotation, inHand));

    // The elbow's hint of this pose, not the reach's: below the middle of
    // the line from the shoulder to the wrist, by half the arm, where an
    // elbow hangs under a hand held up before the body (provisional share).
    return {
      posture: context.entry.posture,
      wrist: { point, rotation },
      bend: {
        x: (shoulder.x + point.x) / 2,
        y: (shoulder.y + point.y) / 2 - 0.5 * arm,
        z: (shoulder.z + point.z) / 2,
      },
    };
  }
}
