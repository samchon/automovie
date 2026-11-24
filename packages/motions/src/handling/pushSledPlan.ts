import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFreedomChoice,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPushSled,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanSampledCourse } from "../actions/prepareHumanSampledCourse";
import { stand } from "../actions/stand";
import { walk } from "../actions/walk";
import { walkDelayed } from "../actions/walkDelayed";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingRoll } from "../striking/StrikingRoll";
import { pushSled } from "./pushSled";
import { pushSledCarry } from "./pushSledCarry";
import { pushSledHandles } from "./pushSledHandles";
import { pushSledStance } from "./pushSledStance";

/**
 * Plan a push.
 *
 * @param context The action's context.
 * @returns The plan.
 * @throws {HumanRefusal} When the lean or the asked incline is out of range,
 *   the walk or the stand is shorter than the settle, the prop lacks a named
 *   handle, or a fist does not reach its handle as the grip closes; and
 *   whatever the walk refuses.
 */
export function pushSledPlan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPushSled.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanPushSled.IParams = context.params;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const lean: number = p.lean ?? 0;
  HumanBound.within("lean", lean, 0, pushSledStance.RANGE, "degrees");
  if (p.incline !== undefined)
    HumanBound.within(
      "incline",
      p.incline,
      -pushSledStance.RANGE,
      pushSledStance.RANGE,
      "degrees",
    );

  const grips: Record<AutoMovieHumanSide, pushSledHandles.IHandle> =
    pushSledHandles(context, p.sled, p.left ?? "left", p.right ?? "right");
  const hands: Record<AutoMovieHumanSide, IAutoMovieMotionHumanHand.IFrame> = {
    left: HumanHand.offset(body, "left", "grip", "fist"),
    right: HumanHand.offset(body, "right", "grip", "fist"),
  };
  const sockets: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: hands.left.point,
    right: hands.right.point,
  };
  const walking: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams> =
    {
      ...context,
      start: context.start + pushSled.SETTLE,
      params: {
        to: p.to,
        pace: "slow",
        armSwing: 0,
        ...(p.facing === undefined ? {} : { facing: p.facing }),
      },
    } as IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams>;

  // Take the handles before moving the load, or stand against it throughout.
  const base: IAutoMovieMotionHumanActionPlan =
    p.duration === undefined
      ? walkDelayed(walk.plan(walking), pushSled.SETTLE)
      : stand.plan({
          ...context,
          params: { hold: p.duration },
        } as IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>);
  const duration: number = base.duration;
  HumanBound.above("walk", duration, pushSled.SETTLE, "s");

  // The trunk inclined into the push by a hinge at the hips, the pelvis
  // and the spine sharing it by the lumbopelvic rhythm
  // (`AutoMovieMotionHumanTrunk.sunk`), and the sink onto bent knees, both
  // read from the handles (`pushSledStance`), a share of the way in.
  const stance: pushSledStance.IStance = pushSledStance.solved(
    body,
    base,
    pushSled.SETTLE,
    context.entry.feet,
    { left: grips.left.frame, right: grips.right.frame },
    lean,
    p.incline,
  );
  const leaned: (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ) => IAutoMovieMotionHumanPosture = (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture =>
    AutoMovieMotionHumanTrunk.sunk(
      body,
      posture,
      stance.sink * share,
      stance.incline * share,
      0,
    );
  const chest: (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ) => IAutoMovieResolvedBone = (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): IAutoMovieResolvedBone =>
    HumanTrunk.resolve(
      body,
      posture,
      undefined,
      resolution,
      HumanBoneGroups.CHEST,
    ).get("chest")!;

  const taking: IAutoMovieMotionHumanPosture = leaned(
    base.posture(pushSled.SETTLE),
    1,
  );
  const arrived: IAutoMovieResolvedBone = chest(taking);
  type Hold = pushSledCarry.IHold;
  const carry: ReturnType<typeof pushSledCarry.prepare> =
    pushSledCarry.prepare(arrived);
  // An arm's goal on a hold: where the arm cannot meet its turn, the grip
  // socket stays on the handle and the turn gives.
  const goal: (
    side: AutoMovieHumanSide,
    hold: Hold,
  ) => IAutoMovieHumanLimbGoal = (
    side: AutoMovieHumanSide,
    hold: Hold,
  ): IAutoMovieHumanLimbGoal => ({
    point: hold.wrist.point,
    rotation: hold.wrist.rotation,
    contact: sockets[side],
    bend: hold.bend,
  });
  const readHand: Record<
    AutoMovieHumanSide,
    ReturnType<typeof poseBones.prepare>
  > = {
    left: poseBones.prepare(body, new Set<AutoMovieHumanoidBone>(["leftHand"])),
    right: poseBones.prepare(
      body,
      new Set<AutoMovieHumanoidBone>(["rightHand"]),
    ),
  };
  const fit: (
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    hold: Hold,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    hold: Hold,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    limbs[`${side}Arm`] = goal(side, hold);
    return readHand[side](
      resolveHumanPosture.seeded(
        body,
        { ...posture, limbs },
        undefined,
        undefined,
        resolution,
      ).pose,
      resolution(),
    );
  };

  // Where the arms take the handles when the grips close: each hand's turn
  // about its handle, wrapped the whole way round a round post and held at
  // the authored turn (or its half turn) otherwise, and its place along the
  // grip band, chosen by the shared chooser (`HumanFreedomChoice`), judged
  // by the fitted arm at the grip and at `SAMPLES` of the push, the worst
  // counting: the fist sits where the wrist's range holds it through the
  // push. The wrist the arm takes it with is what the push keeps, so the
  // hands never ask a turn the arms gave up, and the load riding one hand
  // stays where the other holds it.
  const pushing: IAutoMovieMotionHumanPosture[] = pushSled.SAMPLES.map(
    (share: number): IAutoMovieMotionHumanPosture =>
      leaned(
        base.posture(pushSled.SETTLE + share * (duration - pushSled.SETTLE)),
        1,
      ),
  );
  type Grasp = { point: IAutoMovieVector3; hold: Hold; off: number };
  type Held = { hold: Hold; off: number };
  const take: (side: AutoMovieHumanSide) => Held = (
    side: AutoMovieHumanSide,
  ): Held => {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const align: ReturnType<typeof HumanHand.prepareAlignment> =
      HumanHand.prepareAlignment(hands[side]);
    const gripAt: ReturnType<typeof HumanHand.preparePoint> =
      HumanHand.preparePoint(body, side, "grip", "fist");
    const { frame: at, symmetry, length } = grips[side];
    const grasps: Map<number, Map<number, Grasp>> = new Map();

    // A turn and a place on the handle: the point, the hold the arm takes
    // it with, its elbow toward its place of least joint strain
    // (`AutoMovieMotionHumanBend.solve`), and how far the fitted fist is
    // off the point.
    const grasp: (values: readonly number[]) => Grasp = (
      values: readonly number[],
    ): Grasp => {
      const previous: Grasp | undefined = grasps
        .get(values[0]!)
        ?.get(values[1]!);
      if (previous !== undefined) return previous;
      const point: IAutoMovieVector3 = Vector3.add(
        at.point,
        Vector3.scale(at.forward, values[1]!),
      );
      const wrist: IAutoMovieMotionHumanHand.IWrist = placeHumanHandSurface(
        sockets[side],
        point,
        align({
          normal: Quaternion.rotateVector(
            Quaternion.fromAxisAngle(at.forward, values[0]!),
            at.normal,
          ),
          forward: at.forward,
        }),
      );
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve({
        body,
        posture: taking,
        side,
        point: wrist.point,
        rotation: wrist.rotation,
        fallback: "hang",
      });
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        fit(taking, side, { wrist, bend }, resolution);
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const result: Grasp = {
        point,
        hold: {
          wrist: { point: hand.worldPosition, rotation: hand.worldRotation },
          bend,
        },
        off: Vector3.length(Vector3.subtract(gripAt(bones), point)),
      };
      let positions: Map<number, Grasp> | undefined = grasps.get(values[0]!);
      if (positions === undefined)
        grasps.set(values[0]!, (positions = new Map()));
      positions.set(values[1]!, result);
      return result;
    };
    // The turns tried first: round a round post `TURN` apart, nearest the
    // authored turn first, so the search starts on every side of it (the
    // wrist's ranges leave several basins); a half turn on a flat handle.
    const turns: number[] = [0];
    if (symmetry === "round")
      for (let k: number = pushSled.TURN; k <= 180; k += pushSled.TURN)
        turns.push(...(k < 180 ? [k, -k] : [k]));
    else if (symmetry === "half") turns.push(180);
    const choice: IAutoMovieMotionHumanFreedomChoice.IChoice =
      HumanFreedomChoice.chosen({
        tried: turns.map((turn: number): number[] => [turn, 0]),
        freedoms: [
          {
            kind: "wrapped",
            step: symmetry === "round" ? pushSled.TURN : 0,
            period: 360,
          },
          {
            kind: "bounded",
            step: length / 4,
            least: -length / 2,
            greatest: length / 2,
          },
        ],
        judge: function* (
          values: readonly number[],
        ): Generator<number, void, undefined> {
          const taken: Grasp = grasp(values);
          yield taken.off;

          // Through the push the hands and the load are carried as one.
          for (let index: number = 0; index < pushing.length; ++index) {
            const posture: IAutoMovieMotionHumanPosture = pushing[index]!;
            const frame: pushSledCarry.IFrame = carry(chest(posture));
            const carried: Hold = frame.hold(taken.hold);
            yield Vector3.length(
              Vector3.subtract(
                gripAt(fit(posture, side, carried, resolution)),
                Vector3.add(
                  carried.wrist.point,
                  Quaternion.rotateVector(
                    frame.turn,
                    Vector3.subtract(taken.point, taken.hold.wrist.point),
                  ),
                ),
              ),
            );
          }
        },
      });
    return { hold: grasp(choice.values).hold, off: choice.miss };
  };
  const taken: Record<AutoMovieHumanSide, Held> = {
    left: take("left"),
    right: take("right"),
  };
  pushing.length = 0;

  // A handle the fist does not keep, as the grip closes or through the
  // push, would be held in the air: the push is refused, the body to stand
  // nearer.
  const most: number = StrikingRoll.MISS;
  for (const side of ["left", "right"] as const) {
    const off: number = taken[side].off;
    if (!(off <= most))
      throw new HumanRefusal({
        kind: "reach",
        axis: "sled",
        value: off,
        feasible: { kind: "range", minimum: 0, maximum: most, unit: "m" },
        reason: `the ${side} fist stays ${(off * 1000).toFixed(0)} mm off its handle at worst as the grip closes or through the push, the arms leaning in at full reach`,
        fix: "stand nearer the sled before pushing it, or push one whose handles are within the arms' reach",
      });
  }

  // The hands reach for the holds they keep, so the reach ends where the
  // hold begins.
  const kept: Record<AutoMovieHumanSide, Hold> = {
    left: taken.left.hold,
    right: taken.right.hold,
  };
  const fist: IAutoMovieMotionHumanPosture["joints"] = {
    ...HumanHand.shape("left", "fist"),
    ...HumanHand.shape("right", "fist"),
  };
  const sides: AutoMovieHumanSide[] = ["left", "right"];

  // The arms carried on the leaning walk from the entry's arms to the
  // handles by `SETTLE`, then held on them as the load is carried, the
  // fists closed from the grip on.
  // The walking arms the grips take over from during the settle, solved at
  // the settle's ends and middle and read from their course
  // (`prepareHumanSampledCourse`), so a read resolves no posture.
  const settling: (seconds: number) => number[] = prepareHumanSampledCourse(
    prepareHumanSampledCourse.window(0, pushSled.SETTLE),
    (t: number): number[] => {
      const walked: ReturnType<typeof resolveHumanPosture> =
        resolveHumanPosture.seeded(
          body,
          leaned(
            base.posture(t),
            minimumJerk.share(Math.min(1, t / pushSled.SETTLE)),
          ),
        ).pose;
      const out: number[] = [];
      for (const side of ["left", "right"] as const) {
        const angles: IAutoMovieMotionHumanArmAngles.IAngles =
          AutoMovieMotionHumanArm.angles(walked, side);
        out.push(...angles.upper, ...angles.lower, ...angles.hand);
      }
      return out;
    },
  );
  return {
    duration,
    events: [
      ...base.events,
      { name: "gripped", share: pushSled.SETTLE / duration },
    ],
    contacts: [
      ...base.contacts,
      ...sides.map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Hand`,
          // A load that does not move is pressed, bearing none of the
          // body's weight, not gripped, so it stays where it stands.
          ...(p.moves === false
            ? { kind: "bear" as const, load: 0 }
            : { kind: "grip" as const }),
          from: pushSled.SETTLE / duration,
          to: 1,
          support: { kind: "prop", subject: p.sled },
        }),
      ),
    ],
    hands: sides,
    posture: (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const share: number = minimumJerk.share(Math.min(1, t / pushSled.SETTLE));
      const posture: IAutoMovieMotionHumanPosture = leaned(
        base.posture(t, undefined, resolution, projection),
        share,
      );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...posture.limbs,
      };
      const current: pushSledCarry.IFrame | undefined =
        t < pushSled.SETTLE ? undefined : carry(chest(posture, resolution));
      for (const side of sides)
        limbs[`${side}Arm`] = goal(
          side,
          current === undefined ? kept[side] : current.hold(kept[side]),
        );
      const carrying: IAutoMovieMotionHumanPosture = {
        ...posture,
        joints: { ...posture.joints, ...(t >= pushSled.SETTLE ? fist : {}) },
        limbs,
      };
      if (share >= 1) return carrying;
      const a: number[] = settling(t);
      const angles = (k: number): IAutoMovieMotionHumanArmAngles.IAngles => ({
        upper: [a[k]!, a[k + 1]!, a[k + 2]!],
        lower: [a[k + 3]!, a[k + 4]!, a[k + 5]!],
        hand: [a[k + 6]!, a[k + 7]!, a[k + 8]!],
      });
      return AutoMovieMotionHumanArm.carry(
        body,
        carrying,
        { left: angles(0), right: angles(9) },
        share,
        undefined,
        resolution,
        projection,
      );
    },
  };
}
