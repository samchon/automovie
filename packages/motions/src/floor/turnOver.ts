import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTurnOver,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareHumanShapeBlend } from "../posture/prepareHumanShapeBlend";
import { knockdown } from "../reaction/knockdown";
import { lieDownPoses } from "./lieDownPoses";
import { lyingTurn } from "./lyingTurn";
import { turnOverToward } from "./turnOverToward";

/** Seconds of each quarter turn (provisional). */
const QUARTER: number = 1;

/** The limb postures at each quarter turn, from the back over the left side. */
const KEYS: readonly IAutoMovieMotionHumanLieDown.IPose[] = [
  lieDownPoses.POSES.supine,
  lieDownPoses.POSES.lateralLeft,
  lieDownPoses.POSES.prone,
  lieDownPoses.POSES.lateralRight,
];

/**
 * Turn over while lying. The body turns about its own long axis (`lyingTurn`)
 * from the position it lies in to the requested one, a quarter turn at a time,
 * through each side posture between; a turn between the back and the front
 * passes the `via` side. The limbs go from one quarter's posture to the next
 * (`lieDown`'s postures: the arms and the uppermost knee come over first in the
 * side posture, provisional angles), the pelvis keeps its place over the
 * support and the root rests the lowest collision shape on the floor or the
 * named surface at every second (`knockdown.rest`). A body not lying is
 * refused.
 */
export const turnOver: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTurnOver> =
  {
    name: "turnOver",
    interrupts: {
      any: [{ window: ["settled", 1], kind: "inertialize", entry: 0 }],
    },
    plan: planTurnOver,
  };

/**
 * Turn over while lying. The body turns about its own long axis (`lyingTurn`)
 * from the position it lies in to the requested one, a quarter turn at a time,
 * through each side posture between; a turn between the back and the front
 * passes the `via` side. The limbs go from one quarter's posture to the next
 * (`lieDown`'s postures: the arms and the uppermost knee come over first in the
 * side posture, provisional angles), the pelvis keeps its place over the
 * support and the root rests the lowest collision shape on the floor or the
 * named surface at every second (`knockdown.rest`). A body not lying is
 * refused.
 */
function planTurnOver(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTurnOver>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanTurnOver = context.params;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const hold: number = p.hold ?? 0;
  HumanBound.least("hold", hold, 0, "s");
  if (context.entry.base.kind !== "lying")
    throw new HumanRefusal({
      kind: "base",
      axis: "to",
      value: p.to,
      reason: "a body turns over only while lying",
      fix: "lie down first",
    });
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const from: lyingTurn.ITurn = lyingTurn(entry);
  const target: number = turnOverToward(
    from.turn,
    lyingTurn.TURNS[p.to],
    p.via ?? "left",
  );
  const delta: number = target - from.turn;
  const quarters: number = Math.max(1, Math.ceil(Math.abs(delta) / 90 - 1e-6));
  const support: number = height(context, p.on);
  const hips: IAutoMovieVector3 = Vector3.add(
    entry.root,
    Quaternion.rotateVector(humanPostureHeading(entry), body.rest.get("hips")!),
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.sequence([
      { name: "turning", seconds: QUARTER * quarters },
      { name: p.to, seconds: 0 },
      { name: "settled", seconds: hold },
    ]),
    AutoMovieMotionManner(context, p.manner),
    { holds: ["settled"] },
  );
  const progress: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "turning", p.to);
  // The limb key at a turn: the entry's joints blended into the quarter
  // keys on the way, so the body leaves exactly as it lay.
  const key: (turn: number) => IAutoMovieMotionHumanPosture["joints"] = (
    turn: number,
  ): IAutoMovieMotionHumanPosture["joints"] =>
    KEYS[((Math.round(turn / 90) % 4) + 4) % 4]!.joints;
  const quarterTurn: number = Math.sign(delta) * 90;
  const blends: ReturnType<typeof prepareHumanShapeBlend>[] = Array.from(
    { length: quarters },
    (_, quarter: number): ReturnType<typeof prepareHumanShapeBlend> =>
      prepareHumanShapeBlend(
        quarter === 0 ? entry.joints : key(from.turn + quarterTurn * quarter),
        key(from.turn + quarterTurn * (quarter + 1)),
      ),
  );
  const rest: ReturnType<typeof knockdown.prepareRest> =
    knockdown.prepareRest(body);
  const at: (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture = (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const u: number = progress.progress(seconds);
    const turn: number = from.turn + delta * u;
    const step: number = u * quarters;
    const quarter: number = Math.min(quarters - 1, Math.floor(step));
    const w: number = step - quarter;
    const posture: IAutoMovieMotionHumanPosture = {
      ...lyingTurn.tilt({ yaw: from.yaw, turn }),
      root: { x: 0, y: 0, z: 0 },
      joints: blends[quarter]!(w),
      limbs: {},
    };
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      humanPostureHeading(posture),
      body.rest.get("hips")!,
    );
    return {
      ...posture,
      root: {
        x: hips.x - offset.x,
        y:
          rest(
            posture,
            prepareHumanPoseResolution(resolution),
            projection ?? prepareHumanPostureProjection(body),
          ) + support,
        z: hips.z - offset.z,
      },
    };
  };
  const duration: number = clock.duration;
  const turning: IAutoMovieMotionHumanPrimitive = {
    channels: [
      "root",
      "trunk",
      "head",
      "leftLeg",
      "rightLeg",
      "leftArm",
      "rightArm",
    ],
    reads: [],
    from: 0,
    to: duration,
    write: (
      _: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => at(seconds, resolution, projection),
  };
  // The contact parts have no side or chest; the trunk's window is the back's in every lying position.
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "back",
      kind: "lie",
      from: 0,
      to: 1,
      support:
        p.on === undefined
          ? { kind: "ground" }
          : { kind: "prop", subject: p.on.prop },
    },
  ];
  const planned: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      contact: "settled",
      primitives: [turning],
    });
  return { ...planned, base: { kind: "lying" } };
}

/** The support's height: the named prop surface's, or the floor's. */
function height(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTurnOver>,
  on: IAutoMovieMotionHumanTurnOver.IOn | undefined,
): number {
  if (on === undefined) return 0;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(on.prop);
  const id: string = on.surface ?? "surface";
  const surface: IAutoMovieAffordance | undefined =
    reader.prop.affordances?.find(
      (a: IAutoMovieAffordance): boolean => a.id === id && a.kind === "surface",
    );
  if (surface === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "on",
      value: id,
      reason: `the prop declares no lying surface named ${id}`,
      fix: "name the bed's lying surface",
    });
  return HumanPropFrame.compose(reader.frame(context.start), {
    position: surface.frame.translation,
    rotation: surface.frame.rotation,
  }).position.y;
}
