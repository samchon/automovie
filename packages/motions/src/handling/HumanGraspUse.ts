import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import type { HumanGrasp } from "./HumanGrasp";
import { HumanGraspDemand } from "./HumanGraspDemand";
import { HumanGraspWorn } from "./HumanGraspWorn";
import { HumanGraspUsePreparation } from "./HumanGraspUsePreparation";

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
 * @evidence contracts/development/design.md#principled-representation A use is the tool's working point by its affordance id and one of six lines: three to the forearm, the hammer, oblique and in-line grips of the grasp taxonomies (Feix et al. 2016), one across the body, the long axis of a thing held in both hands, one along a surface of the body, the working face laid on it, and one worn there, the worn frame whole with its turn free for a round thing; the search ranges are data beside it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The use, its six lines, the bounds of the search and the presented key; read by `pickUp`, `touch` and `handToFace`.
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
     * stands upright on it, a hammer grip; `across` runs level across the
     * body toward the other hand, as a camera or a bar held in both hands
     * lies, whatever the place; `along` lays the tool along the surface of
     * its place with the working point's own face on it, as a razor lies on
     * the jaw or a comb on the scalp, its way along the surface the hand's
     * own (a place on the body only); `worn` puts the thing on that place
     * as it is worn (`HumanWorn.frame`), the whole frame of its `wear`
     * socket on the region, as a hat goes on the crown or spectacles on the
     * nose (a region only).
     */
    line: "forearm" | "oblique" | "square" | "across" | "along" | "worn";

    /** For a thing `worn` round about the region's normal, as a hat about the crown, that its turn about it is free: the grasp holds at whichever turn suits it; spectacles are not, and stay facing the body's way. False when absent. */
    round?: boolean;

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

  /** The tool line's rise above the level line when presented, degrees, by use. */
  export const RISE: Readonly<Record<IUse["line"], number>> = {
    forearm: 0,
    oblique: 45,
    square: 90,
    across: 0,
    along: 0,
    worn: 0,
  };

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

  /** The refinement step of the roll about the tool's line when it is presented, and the spacing of the rolls tried first round it, degrees (search resolution: an eighth of a turn, halving to under 6). */
  export const ROLL: number = 45;

  /**
   * Where a tool's grip is presented for a use ahead of the body: ahead of
   * the shoulder by six tenths of the arm and a tenth below it, where a tool
   * is held to be aimed (provisional shares). The grasp chosen for a use is
   * judged with the grip there (`presented`), and a law that presents the
   * tool puts it there (`StrikingRoll.hand`), so the pose a grasp is judged
   * at is the pose a law presents.
   *
   * @param bones The body's bones where it presents the tool.
   * @param side The hand.
   * @param yaw The body's heading, degrees.
   * @returns The grip socket's place, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the place, its shares, who reads it and why once.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's length read off the bones, shoulder to elbow and elbow to wrist, and the place laid ahead along the heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three joints, one length, one point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shares are provisional and named here, the one place both readers take.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function place(
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition">
    >,
    side: HumanHand.Side,
    yaw: number,
  ): IAutoMovieVector3 {
    const joint: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)?.worldPosition ?? { x: 0, y: 0, z: 0 };
    const shoulder: IAutoMovieVector3 = joint(`${side}UpperArm`);
    const elbow: IAutoMovieVector3 = joint(`${side}LowerArm`);
    const arm: number =
      Vector3.length(Vector3.subtract(elbow, shoulder)) +
      Vector3.length(Vector3.subtract(joint(`${side}Hand`), elbow));
    const heading: number = (yaw * Math.PI) / 180;
    return {
      x: shoulder.x + 0.6 * arm * Math.sin(heading),
      y: shoulder.y - 0.1 * arm,
      z: shoulder.z + 0.6 * arm * Math.cos(heading),
    };
  }

  /**
   * The pose a tool is presented in for its use, as a key the grasp must
   * also hold: the grip at the place a law presents it (`place`), and the
   * hand turned so that the tool's line lies on the line the use names, in
   * the plane the body faces.
   *
   * @param props The action's context, the prop and its handle, the hand, the hand the arm shows for the candidate grasp, the use, and how far the closed hand at a wrist keeps out of the body's other parts, metres, negative inside (every roll alike when absent).
   * @returns The key pose.
   * @throws {HumanRefusal} An `affordance` refusal on `use` when the prop declares no such working point, listing its contacts; a `parameter` refusal on `use` for an `along` line ahead of the body, listing the other lines.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pose, each input and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The tool is rigid in the hand from the grasp on, so the hand's rotation there is the candidate grasp's rotation turned by the shortest turn that takes the tool's line, as it lies now, onto the asked line, or, laid along a surface, the working point's own face onto the surface; worn, the thing's own worn frame, the one `dress` puts it at (`HumanWorn.frame`), so the grasp is judged at the very pose it is put on in (`HumanGraspWorn`). Every key is judged in the unit of what it places, metres, read off the fitted hand (`HumanGrasp.IKey.judge`): a tool on a line by the measure the law presenting it judges a held tool by (`StrikingHeld.strayed`, its working point and its line a tool's length behind, so a grip that keeps the point and turns the line is counted), the tool read from the candidate grip as a held tool is read (`StrikingHeld.read`); a tool laid along a surface by its working point. The roll about that line, or the turn about the surface's normal, is free in a use that names only that much: the shared chooser takes it (`HumanFreedomChoice`, a wrapped freedom), the roll whose key the arm, fitted within its ranges, leaves the working point nearest, as a law presenting the tool takes it (`StrikingRoll`), so the grasp is judged at the roll the law will use.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two contacts, the two lines, the turn between them, the place, the roll.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lines that oppose each other turn about the body's left instead of an undefined axis. Given the closed hand's clearance, its depth inside the body adds to a roll's miss. The place's shares of the arm (0.6 ahead, 0.1 below) are provisional and named at the code.
   * @evidence contracts/development/implementation.md#efficient-algorithms The chooser's fits, each roll fitted once, its elbow placed by the fit's own sweep (`IHumanPosture.IGoal.elbow`) with no search of its own, kept in a map, however often the search returns to it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the entry pose's bones once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned key retains its original live source/point-judge inputs; the original roll-score map is cleared after the final key is built. No fixed direct base, dynamic FK workspace or callback/result history is retained.
   */
  export function presented(props: {
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "start">;
    prop: string;
    handle: string;
    side: HumanHand.Side;
    wrist: HumanHand.IWrist;
    use: IUse;
    clear?: (wrist: HumanHand.IWrist) => number;
  }): HumanGrasp.IKey {
    const { context, held, tip, at, site, laid, ahead, socket, roll: rollAt }: HumanGraspUsePreparation.IPrepared =
      HumanGraspUsePreparation.of(props);

    // Worn: the key is the thing on the place it is worn (`HumanGraspWorn`).
    if (props.use.line === "worn")
      return HumanGraspWorn.key({
        context,
        held,
        tip,
        at: at!,
        site: site!,
        side: props.side,
        wrist: props.wrist,
        ...(props.use.round === undefined ? {} : { round: props.use.round }),
        ...(props.clear === undefined ? {} : { clear: props.clear }),
      });
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
    const tool: StrikingHeld.ITool | undefined =
      props.use.line === "along"
        ? undefined
        : StrikingHeld.read(
            AutoMovieMotionHumanHeld.grasped(
              context.body,
              props.side,
              props.prop,
              held.frame(context.start),
              held.prop.affordances ?? [],
              props.wrist,
            ),
            { tip: props.use.tip },
          );
    const back: number =
      tool === undefined || site !== undefined ? 0 : Vector3.length(tool.tip);

    // The roll about the asked line, or the turn about the surface's normal,
    // is free in a use that names only that much: the shared chooser takes
    // it (`HumanFreedomChoice`, a wrapped freedom), the roll whose key the
    // arm, fitted within its ranges, leaves the working point nearest, the
    // closed hand's depth inside the body added as a cost. A law that
    // presents the tool chooses its roll the same way (`StrikingRoll`), so
    // the grasp is judged at the roll the law will take.
    const keyed: (roll: number) => HumanHand.IWrist = (roll: number): HumanHand.IWrist => {
      const rolled: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(rollAt(roll), laid),
      );
      return {
        point: Vector3.subtract(
          site ?? ahead,
          Quaternion.rotateVector(
            rolled,
            tool === undefined
              ? inHand
              : Vector3.add(
                  socket,
                  Vector3.subtract(tool.tip, Vector3.scale(tool.axis, back)),
                ),
          ),
        ),
        rotation: rolled,
      };
    };

    // A roll's elbow is left to the body (`IHumanPosture.IGoal.elbow`): the
    // fit takes the place of least strain among those that turn the hand
    // best, in its own sweep, and the hanging arm's place is only where no
    // place is legal, as the least-strain place falls back to it.
    const hang: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      props.side,
    );

    // A use's key is the same contact-pivot goal and two-point measure the
    // presenting action uses; fitting only the wrist judges another task.
    const key: (roll: number) => HumanGrasp.IKey = (roll: number): HumanGrasp.IKey => {
      const wrist: HumanHand.IWrist = keyed(roll);
      if (tool !== undefined)
        return HumanGraspDemand.key(context.body, {
          posture: context.entry.posture,
          tool,
          frame: {
            point: Vector3.add(
              wrist.point,
              Quaternion.rotateVector(wrist.rotation, socket),
            ),
            rotation: wrist.rotation,
          },
          back,
          bound: StrikingRoll.MISS,
        });
      return {
        posture: context.entry.posture,
        wrist,
        bend: hang,
        judge: (
          bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        ): number => {
          const hand: IAutoMovieResolvedBone = bones.get(`${props.side}Hand`)!;
          return Vector3.length(
            Vector3.subtract(
              Vector3.add(
                hand.worldPosition,
                Quaternion.rotateVector(hand.worldRotation, inHand),
              ),
              site!,
            ),
          );
        },
      };
    };

    // Each roll fitted once, however often the search comes back to it.
    const fitted: Map<number, number> = new Map();
    const missed: (roll: number) => number = (roll: number): number => {
      const known: number | undefined = fitted.get(roll);
      if (known !== undefined) return known;
      const candidate: HumanGrasp.IKey = key(roll);
      const wrist: HumanHand.IWrist = candidate.wrist;
      const posture: IHumanPosture = context.entry.posture;
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      limbs[`${props.side}Arm`] = candidate.goal ?? {
        point: wrist.point,
        rotation: wrist.rotation,
        bend: hang,
        elbow: "strain",
      };
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(
          context.body,
          resolveHumanPosture(context.body, { ...posture, limbs }),
        );
      const hand: IAutoMovieResolvedBone = bones.get(`${props.side}Hand`)!;
      const kept: number =
        props.clear === undefined
          ? 0
          : Math.min(
              0,
              props.clear({
                point: hand.worldPosition,
                rotation: hand.worldRotation,
              }),
            );
      const miss: number = candidate.judge!(bones) - kept;
      fitted.set(roll, miss);
      return miss;
    };
    // The hand's own order of rolls, and its refinement's first sense with it.
    const seeds: number[] = HumanFreedomChoice.turns(ROLL, props.side);
    const roll: number = HumanFreedomChoice.chosen({
      tried: seeds.map((degrees: number): number[] => [degrees]),
      freedoms: [
        {
          kind: "wrapped",
          step: props.side === "left" ? -ROLL : ROLL,
          period: 360,
        },
      ],
      judge: (values: readonly number[]): number[] => [missed(values[0]!)],
    }).values[0]!;
    const selected: HumanGrasp.IKey = key(roll);
    fitted.clear();
    return selected;
  }
}
