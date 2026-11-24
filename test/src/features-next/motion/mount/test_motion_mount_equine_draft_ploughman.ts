import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineDraggedLoad,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
  createDragged,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const HumanHoldHandles = AutoMovieMotionHumanOperate.holdHandles;

/** Hips progress samples over the rehearsed walk. */
const SAMPLES: number = 80;

/** How far ahead of the hips the plough's grips are staged, metres: an authored working reach. */
const REACH: number = 0.3;

/** The plough staged after the rehearsal: the walk's film start and the dragged plough. */
interface IStaged {
  /** The film second the horse's course starts. */
  start: number;
  /** The dragged plough, once the horse's course is laid. */
  plough?: AutoMovieArchetypeEquineDraggedLoad.IRide;
}

/** The fitted trapezoidal progress of a rehearsed walk. */
interface IMatched {
  /** Distance walked, metres. */
  length: number;
  /** Steady speed, metres per second. */
  cruise: number;
  /** Starting and stopping rates, metres per second squared. */
  acceleration: number;
  deceleration: number;
}

/**
 * A ploughman walks a furrow behind a horse-drawn plough with both hands on its grips.
 *
 * Scenarios:
 * 1. The ploughman's walk is rehearsed, and the horse's course is laid so the dragged plough's grips stay the authored reach ahead of the walker's hips.
 * 2. Through the held interval each displayed palm lies within 10 mm of the skin of its plough grip, read from the posed plough.
 * 3. At the same seconds the ploughman's soles bear on the ground and never sink below it, while the share runs its 0.15 m below.
 * 4. The driving lines run from the horse's bit rings over the ploughman's left shoulder.
 * 5. The take passes the shipped take verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios, the bodies and the tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a horse, a dragged plough and a walking ploughman through public APIs and reads displayed palms, soles and the plough's share; a hand off its grip, a sinking foot or a shallow share fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm contact tolerance is the towed driver's; grips are the plough's own affordances on the posed load; the depth is authored.
 * @evidence contracts/development/testing.md#distinguishing-cases The held interval against the walk around it; the plough's headland lift belongs to test_archetype_equine_draft_ground.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_draft_ploughman(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, 1);
  const load: AutoMovieArchetype<
    createDragged.Affordance,
    createDragged.Dimension
  > = createDragged({ kind: "plough" });
  const issues: string[] = [];
  const staged: IStaged = { start: 0 };
  const place = (seconds: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform =
      staged.plough?.at(seconds - staged.start).placement ??
      AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 30 });
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, seconds: number): IAutoMovieTransform => {
    const sample: AutoMovieArchetypeEquineDraggedLoad.ISample | undefined =
      staged.plough?.at(seconds - staged.start);
    return sample === undefined
      ? AutoMovieArchetypeFrame.compose(
          AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 30 }),
          load.affordance(id as createDragged.Affordance).frame,
        )
      : AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id as createDragged.Affordance).frame,
        );
  };
  const actors = [
    {
      subject: "ploughman",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    },
  ];
  const chain = HumanChain.subject("ploughman").walk({
    to: { x: 0, y: 0, z: 12 },
  });
  const rehearsal: HumanPerformance = new HumanPerformance({
    seed: "ploughman",
    performers: actors,
    laws: [HumanHoldHandles],
    props: [HumanObject.prop("plough", load, place(0), place, part)],
    composition: chain.node,
  });
  const walking: IAutoMovieMotionHumanSegment = rehearsal
    .segments("ploughman")
    .at(-1)!;
  const seconds: number = walking.end - walking.start;
  const hips = (at: number): number =>
    rehearsal.bones("ploughman", at).get("hips")!.worldPosition.z;
  const begin: number = hips(walking.start);
  const step: number = seconds / SAMPLES;
  const matched: IMatched = match(
    Array.from(
      { length: SAMPLES + 1 },
      (_: unknown, i: number): number => hips(walking.start + i * step) - begin,
    ),
    step,
  );

  // 1. The horse leads by the grips' reach, the plough's length and the trace, from its own points of draft.
  const draft: number = horse.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === "draft-left",
  )!.transform!.translation.z;
  const grips: number = load.affordance("leftHandle").frame.translation.z;
  const coupling: number = load.affordance("coupling").frame.translation.z;
  const trace: number = 2;
  const ride: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(
    horse,
    {
      start: {
        x: 0,
        z: begin + REACH + (coupling - grips) + trace - draft,
        heading: 0,
      },
      cruise: matched.cruise,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: matched.acceleration,
      deceleration: matched.deceleration,
      startFromStanding: true,
      legs: [{ kind: "straight", length: matched.length }],
    },
    "walk",
  );
  staged.start = walking.start;
  staged.plough = AutoMovieArchetypeEquineDraggedLoad(ride, horse, load, {
    length: trace,
    depth: 0.15,
    draught: 900,
    capacity: 1300,
  });
  let film: HumanPerformance | undefined;
  try {
    film = new HumanPerformance({
      seed: "ploughman",
      performers: actors,
      laws: [HumanHoldHandles],
      props: [HumanObject.prop("plough", load, place(0), place, part)],
      composition: chain.over((walker) =>
        walker.registered("holdHandles", {
          on: "plough",
          duration: 0.79 * seconds,
          transition: 0.2 * seconds,
        }),
      ).node,
    });
  } catch (error) {
    issues.push(
      `ploughman: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 2 and 3. The held interval.
  if (film !== undefined)
    for (const share of [0.25, 0.4, 0.55]) {
      const at: number = walking.start + share * seconds;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones("ploughman", at);
      for (const side of ["left", "right"] as const) {
        const grip: IAutoMovieVector3 = part(`${side}Handle`, at).translation;
        const palm: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "palm",
        ).point;
        const gap: number =
          Vector3.distance(palm, grip) -
          load.affordance(`${side}Handle`).aperture! / 2;
        if (!(gap <= 0.01))
          issues.push(
            `${share}: ${side} palm ${(gap * 1000).toFixed(1)} mm from its grip`,
          );
        const soles: number[] = HumanFoot.sockets(body, bones, side).map(
          ({ point }: IAutoMovieMotionHumanFoot.ISocket): number => point.y,
        );
        if (Math.min(...soles) < -0.005)
          issues.push(
            `${share}: ${side} sole sinks to ${Math.min(...soles)} m`,
          );
      }
      const shoulder: IAutoMovieVector3 =
        bones.get("leftShoulder")!.worldPosition;
      const horseAt: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > = ride.at(at - staged.start);
      for (const line of staged.plough.lines(at - staged.start, shoulder)) {
        const bit: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
          horseAt.placement,
          horseAt.archetype.parts.find(
            (p: IAutoMovieModelPart): boolean =>
              p.id === `bit-${line.id.split("-")[1]}`,
          )!.transform!,
        ).translation;
        if (
          Vector3.distance(line.points[0]!, bit) > 1e-9 ||
          Vector3.distance(line.points.at(-1)!, shoulder) > 1e-9
        )
          issues.push(
            `${share}: ${line.id} does not run from the bit to the ploughman's shoulder`,
          );
      }
      const shareDepth: number = staged.plough.at(at - staged.start).depth;
      if (Math.abs(shareDepth - 0.15) > 1e-9)
        issues.push(`${share}: share depth ${shareDepth}`);
    }
  TestValidator.equals(
    "the ploughman walks the furrow holding the plough",
    issues,
    [],
  );
  if (film !== undefined) assertTakeClean("the ploughman's take", film);
}

/** Fit a trapezoidal speed profile to a rehearsed walk's progress samples. */
function match(progress: readonly number[], step: number): IMatched {
  const count: number = progress.length - 1;
  const from: number = Math.floor(count / 4);
  const to: number = Math.ceil((3 * count) / 4);
  let st: number = 0;
  let sp: number = 0;
  let stt: number = 0;
  let stp: number = 0;
  for (let i: number = from; i <= to; i++) {
    const t: number = i * step;
    st += t;
    sp += progress[i]!;
    stt += t * t;
    stp += t * progress[i]!;
  }
  const n: number = to - from + 1;
  const cruise: number = (n * stp - st * sp) / (n * stt - st * st);
  const startLag: number = (cruise * st - sp) / n;
  const length: number = progress[count]!;
  const stopLag: number = cruise * count * step - length - startLag;
  if (!(cruise > 0 && startLag > 0 && stopLag > 0))
    throw new Error("The rehearsed walk has no steady stretch to match");
  return {
    length,
    cruise,
    acceleration: (cruise * cruise) / (2 * startLag),
    deceleration: (cruise * cruise) / (2 * stopLag),
  };
}
