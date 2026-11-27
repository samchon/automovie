import {
  AutoMovieGravity,
  AutoMoviePhysicalSimulation,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  poseJointCodec,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSimulation,
  IAutoMovieMotionHumanSimulationWindow,
  IAutoMoviePerformanceMode,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { bindHumanSimulationGrips } from "./internal/bindHumanSimulationGrips";
import { coupleHumanSimulationGrips } from "./internal/coupleHumanSimulationGrips";
import { placeHumanSimulationColliders } from "./internal/placeHumanSimulationColliders";
import { placeHumanSimulationImpulses } from "./internal/placeHumanSimulationImpulses";
import { planHumanSimulationBody } from "./internal/planHumanSimulationBody";
import { reachHumanSimulation } from "./internal/reachHumanSimulation";
import { readHumanSimulatedPose } from "./internal/readHumanSimulatedPose";
import { sampleHumanSimulationTargets } from "./internal/sampleHumanSimulationTargets";

/**
 * The simulated tier: a window of a performance baked once through the engine's
 * solver at a fixed step and read back by time.
 *
 * `bake` builds the engine's input from the placed performance: each simulated
 * performer's profile and its displayed world bones sampled at `RATE`, the
 * performance's impulses at their steps, the grips between simulated performers
 * as collider bindings, the scene's solids within reach as kinematic bodies,
 * and the floor at the canonical frame's y = 0 with bounds that hold every
 * body's reach (`planHumanSimulationBody` says which parts the solver owns and
 * when). `pose` reads a performer inside the window: the bones the solver owns
 * at the instant come from the cache and every other bone is the performance's
 * own (`readHumanSimulatedPose`). The solve is a pure function of its sampled
 * input, which the engine hashes into the cache's identity, so two bakes of one
 * window agree bit for bit.
 */
export namespace HumanPerformanceSimulation {
  /**
   * Cached intervals per second: the 120 Hz the window issue fixes, five per 24
   * Hz film frame.
   */
  export const RATE: number = 120;
  /**
   * The canonical frame's floor height, metres: every canonical body stands
   * with its lowest point at y = 0.
   */
  export const FLOOR: number = 0;

  /** A baked window as a performance reads it. */
  export interface IReading {
    /** The engine's record of the window. */
    record: IAutoMovieMotionHumanSimulation;

    /** The window's last film second, on the grid. */
    end: number;

    /** Each simulated performer's body and rig codec. */
    performers: ReadonlyMap<string, IPerformer>;
  }

  /** A simulated performer as a reading needs it. */
  export interface IPerformer {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The profile the window solved: the body's, its hands with their fingers,
     * its toes and its neck with the head welded into the segments above them
     * (`weldHumanSimulationProfile`).
     */
    profile: IAutoMoviePhysicalProfile;

    /** The body's rig codec, with its joint axes and the humanoid rest frames. */
    codec: IAutoMoviePoseJointCodec.ICodec;
  }

  /**
   * Bake a window.
   *
   * @param performance The performance read for its displayed bones and placed
   *   actions; its own earlier windows included.
   * @param state The resolved performance, for its forces, props and obstacles.
   * @param window The window.
   * @param mode The physical policy of every simulated body.
   * @returns The reading.
   * @throws {HumanRefusal} When the window lies outside the film, is shorter
   *   than one interval, or names a performer the performance does not have.
   */
  export async function bake(
    performance: IAutoMovieMotionHumanPerformance,
    state: IAutoMovieMotionHumanPerformanceState,
    window: IAutoMovieMotionHumanSimulationWindow,
    mode: IAutoMoviePerformanceMode,
  ): Promise<IReading> {
    const count: number = Math.round((window.to - window.from) * RATE);
    const duration: number = count / RATE;
    if (
      !(window.from >= 0) ||
      count < 1 ||
      window.from + duration > performance.duration + 1e-9 ||
      duration * RATE !== count
    )
      throw refusal(
        "window",
        window,
        `a window must lie within the film's ${performance.duration} s and last at least one ${RATE} Hz interval`,
      );
    const people: Map<string, IAutoMovieMotionHumanPerformer> = new Map(
      performance.performers.map(
        (
          performer: IAutoMovieMotionHumanPerformer,
        ): [string, IAutoMovieMotionHumanPerformer] => [
          performer.subject,
          performer,
        ],
      ),
    );
    const subjects: readonly string[] = window.subjects ?? [...people.keys()];
    for (const subject of [...subjects, ...(window.released ?? [])])
      if (!people.has(subject) || !subjects.includes(subject))
        throw refusal(
          "window.subjects",
          subject,
          `${subject} is not a simulated performer of the performance`,
        );
    const bodies: Map<string, IAutoMovieMotionHumanBody> = new Map(
      subjects.map((subject: string): [string, IAutoMovieMotionHumanBody] => [
        subject,
        people.get(subject)!.body,
      ]),
    );
    const clock: bindHumanSimulationGrips.IClock = {
      from: window.from,
      count,
      rate: RATE,
    };

    // Each step's displayed bones, read once, and the segments' poses in them.
    const bones: Map<
      string,
      Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[]
    > = new Map(
      subjects.map(
        (
          subject: string,
        ): [string, Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[]] => [
          subject,
          Array.from(
            { length: count + 1 },
            (
              _: unknown,
              step: number,
            ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
              performance.bones(subject, window.from + step / RATE),
          ),
        ],
      ),
    );
    // The profile each performer is solved with and its targets.
    const sampled: Map<string, sampleHumanSimulationTargets.IResult> = new Map(
      subjects.map(
        (subject: string): [string, sampleHumanSimulationTargets.IResult] => [
          subject,
          sampleHumanSimulationTargets(
            bodies.get(subject)!,
            bones.get(subject)!,
          ),
        ],
      ),
    );
    const profiles: Map<string, IAutoMoviePhysicalProfile> = new Map(
      [...sampled].map(
        ([subject, read]: [string, sampleHumanSimulationTargets.IResult]): [
          string,
          IAutoMoviePhysicalProfile,
        ] => [subject, read.profile],
      ),
    );
    const targets: Map<string, Record<string, IAutoMovieRigidTransform>[]> =
      new Map(
        [...sampled].map(
          ([subject, read]: [string, sampleHumanSimulationTargets.IResult]): [
            string,
            Record<string, IAutoMovieRigidTransform>[],
          ] => [subject, read.targets],
        ),
      );
    const impulses: IAutoMoviePhysicalSimulationInput.IInput["impulses"] =
      placeHumanSimulationImpulses(
        state.forces,
        bodies,
        profiles,
        bones,
        clock,
      );

    // A performer is released from its first impulse when the performance
    // lays it down inside the window (fall), or from the window's
    // start when the window releases it.
    const releases: Map<string, number> = new Map(
      subjects.map((subject: string): [string, number] => {
        if (window.released?.includes(subject) === true) return [subject, 1];
        if (
          !falls(
            performance.segments(subject),
            window.from,
            window.from + duration,
          )
        )
          return [subject, count + 1];
        const first: number = Math.min(
          ...impulses
            .filter(
              (
                impulse: IAutoMoviePhysicalSimulationInput.IInput["impulses"][number],
              ): boolean => impulse.body === subject,
            )
            .map(
              (
                impulse: IAutoMoviePhysicalSimulationInput.IInput["impulses"][number],
              ): number => impulse.step,
            ),
        );
        return [subject, first === Infinity ? 1 : first];
      }),
    );

    // Kinematic motion follows a window that ends before the film does, so
    // the solver hands every segment back over the last handoff interval.
    const end: number =
      window.from + duration < performance.duration - 1e-9
        ? count - Math.ceil(planHumanSimulationBody.HANDOFF * RATE)
        : count;
    // Kinematic mode shows the authored motion, whose grips already close,
    // so it asks the solver for no binding fit.
    const grips: bindHumanSimulationGrips.IGrip[] =
      mode.kind === "kinematic"
        ? []
        : bindHumanSimulationGrips(
            performance,
            bodies,
            profiles,
            targets,
            clock,
          );
    const groups: Map<number, Map<string, string>> = coupleHumanSimulationGrips(
      grips,
      releases,
      end,
    );
    const humans: IAutoMoviePhysicalSimulationInput.IBody[] = subjects.map(
      (subject: string): IAutoMoviePhysicalSimulationInput.IBody =>
        planHumanSimulationBody({
          subject,
          profile: profiles.get(subject)!,
          mode,
          targets: targets.get(subject)!,
          impulses,
          grips,
          releases,
          groups,
          end,
        }),
    );

    const reach: reachHumanSimulation.IBox = reachHumanSimulation(
      targets,
      bodies,
      impulses,
      RATE,
      FLOOR,
    );
    const stature: number = Math.max(
      ...[...bodies.values()].map(
        (body: IAutoMovieMotionHumanBody): number => body.measure.stature,
      ),
    );
    const solids: placeHumanSimulationColliders.IResult =
      placeHumanSimulationColliders(
        state,
        new Set(subjects),
        clock,
        reach,
        humans[0]!.profile.materials[0]!,
      );
    const input: IAutoMoviePhysicalSimulationInput.IInput = {
      duration,
      rate: RATE,
      gravity: { x: 0, y: -AutoMovieGravity.STANDARD, z: 0 },
      floor: FLOOR,
      floorBounds: {
        min: { x: solids.box.minimum.x, z: solids.box.minimum.z },
        max: { x: solids.box.maximum.x, z: solids.box.maximum.z },
        // The floor's solid depth only keeps a shape from tunnelling
        // through it; a stature is deeper than any body reaches in a step.
        thickness: stature,
      },
      bodies: [...humans, ...solids.bodies],
      impulses,
      checkpointEvery: count,
      yieldEvery: count,
      maximumSteps: count,
      maximumSegments: [...humans, ...solids.bodies].reduce(
        (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
          sum + body.profile.segments.length,
        0,
      ),
    };
    const simulation: IAutoMoviePhysicalSimulation =
      await AutoMoviePhysicalSimulation.compute(input);
    return {
      record: {
        window: structuredClone(window),
        mode: structuredClone(mode),
        simulation,
      },
      end: window.from + duration,
      performers: new Map(
        subjects.map((subject: string): [string, IPerformer] => [
          subject,
          {
            body: bodies.get(subject)!,
            profile: profiles.get(subject)!,
            codec: poseJointCodec({
              skeleton: bodies.get(subject)!.skeleton,
              jointAxes: HUMANOID_JOINT_AXES,
              restFrames: HUMANOID_REST_FRAME,
            }),
          },
        ]),
      ),
    };
  }

  /**
   * Whether a reading shows a performer at a film second.
   *
   * @param reading The baked window.
   * @param subject The performer.
   * @param seconds Film seconds.
   * @returns True inside the window for a simulated performer.
   */
  export function covers(
    reading: IReading,
    subject: string,
    seconds: number,
  ): boolean {
    return (
      reading.performers.has(subject) &&
      reading.record.window.from <= seconds &&
      seconds <= reading.end
    );
  }

  /**
   * A performer's displayed pose inside a baked window.
   *
   * @param reading The baked window.
   * @param subject The performer, simulated by the window.
   * @param seconds Film seconds inside the window.
   * @param kinematic The pose the performance shows there without the window.
   * @returns The pose: the solver's bones where it owns them, the kinematic
   *   pose's elsewhere.
   */
  export function pose(
    reading: IReading,
    subject: string,
    seconds: number,
    kinematic: IAutoMoviePose,
  ): IAutoMoviePose {
    const performer: IPerformer = reading.performers.get(subject)!;
    const cache: IAutoMovieMotionHumanSimulation["simulation"]["cache"] =
      reading.record.simulation.cache;
    const local: number = Math.min(
      cache.duration,
      Math.max(0, seconds - reading.record.window.from),
    );
    const owned: Set<string> = new Set(
      performer.profile.segments
        .map((segment: IAutoMoviePhysicalSegment): string => segment.bone)
        .filter(
          (bone: string): boolean =>
            cache.ownershipAt(subject, bone, local) !== "authored",
        ),
    );
    if (owned.size === 0) return kinematic;
    return readHumanSimulatedPose(
      performer.body,
      performer.codec,
      performer.profile,
      kinematic,
      cache.at(local).bodies[subject]!,
      owned,
    );
  }

  /** A refusal of a window's term. */
  function refusal(axis: string, value: unknown, reason: string): HumanRefusal {
    return new HumanRefusal({
      kind: "parameter",
      axis,
      value,
      feasible: null,
      reason,
      fix: "give a window inside the film over the performance's own performers",
    });
  }

  /**
   * Whether a placed action lays the body down inside the span: a lying contact
   * opens there.
   */
  function falls(
    segments: readonly IAutoMovieMotionHumanSegment[],
    from: number,
    to: number,
  ): boolean {
    return segments.some((segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.contacts.some(
        (
          contact: IAutoMovieMotionHumanSegment["plan"]["contacts"][number],
        ): boolean => {
          const opens: number =
            segment.start + contact.from * segment.plan.duration;
          return (
            contact.kind === "lie" &&
            segment.entryTime <= opens &&
            opens <= segment.end &&
            from <= opens &&
            opens <= to
          );
        },
      ),
    );
  }
}
