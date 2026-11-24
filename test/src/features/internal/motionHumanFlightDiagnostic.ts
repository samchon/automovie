import {
  Vector3,
  clampPose,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

import { motionHumanFrame } from "./motionHumanFrame";
import { qunit } from "./qunit";

/**
 * Same-root rigid-shape evidence beside one original displayed observation.
 * Null vectors name an unavailable computation, never a fabricated zero.
 */
interface IRow {
  /** Reference or original numbered conservation read. */
  role: string;

  /** Original midpoint in film seconds. */
  seconds: number;

  /** Actual difference endpoints in film seconds. */
  support: readonly [number, number];

  /** The two already measured displayed root rotations, null only if absent. */
  roots: readonly [IAutoMovieQuaternion | null, IAutoMovieQuaternion | null];

  /** Original world angular momentum, kg m squared per second. */
  displayed: IAutoMovieVector3;

  /** Same-root/unturned-shape momentum in those same units. */
  rigid: IAutoMovieVector3 | null;

  /** Displayed less rigid momentum, not a solver residual. */
  discrepancy: IAutoMovieVector3 | null;

  /** Whether all observed joint and computed vector components were finite. */
  finite: boolean;

  /** All unequal clinical coordinates at both endpoints, in degrees/null rest. */
  jointDifferences: {
    /** Film second of this actual difference endpoint. */
    seconds: number;

    /** Canonical joint whose two resolved clinical values differ. */
    bone: AutoMovieHumanoidBone;

    /** Clinical degree coordinate compared, preserving null rest. */
    axis: "flexion" | "abduction" | "twist";

    /** Actual displayed clinical degrees, or its null rest marker. */
    displayed: number | null;

    /** Unturned canonical clinical degrees, or its null rest marker. */
    rigid: number | null;
  }[];

  /** Why a row could not be reconstructed, with no fabricated substitute. */
  error?: string;
}

/**
 * Decompose the same flight observation into its actual displayed body and the
 * already observed root carrying the canonical unturned articulation.
 *
 * The single-case prerequisites are checked: one stand followed by this jump,
 * no configured layers/external forces/props, no overlays/holds/weapons, no
 * transition offset or contact window at the original momentum endpoints, and
 * free raw limb goals there. Only the raw posture's rotation is removed. Public
 * resolution plus its final clamp gives the unturned joints; replacing only
 * that canonical pose's root with the recorded actual root then performs fresh
 * FK. Both momenta use the original mass model and two-DELTA interval.
 *
 * Displayed-minus-rigid momentum isolates the changed articulation pipeline
 * while keeping observed root motion equal. Drift of rigid momentum still
 * combines the root trajectory and planned shape history; it does not by itself
 * prove one numerical cause. Joint differences are observations, not a
 * substitute for the representative's unchanged one-percent assertion. All work
 * happens after its original observations and timing have finished. Three
 * additional direct displayed reads straddle takeoff by adjacent binary64
 * seconds. Their actual poses, world centres and root-local FK are observed
 * without the unturned reconstruction. Unavailable boundary data is logged
 * separately and changes no original physical acceptance result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the checked momentum-row prerequisites, same-film/root decomposition, direct adjacent-time takeoff observations, units, execution order, separate boundary problems and causal interpretation limits.
 * @evidence contracts/development/implementation.md#principled-implementation Rigid motion preserves a canonical articulation: actual root plus unturned joints defines that same shape under the measured turn. Public FK and momentum measure it without another film or an ideal angular target.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check and reconstruct the original momentum endpoints, reduce their FK maps, then directly read the completed film at the three takeoff boundary seconds without reconstruction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Removes only an owned copy's rotation, keeps the recorded actual root and original DELTA/model, and records failures explicitly. No private state, foreign patch, tolerance change or pose expectation is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms For N original observations, performs two additional posture resolutions/FK plus linear joint comparison. Three boundary records add world/root-local FK and mass reductions. Diagnostic cost is separately timed and is not claimed as production speed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the completed film's actual raw plan and captured displayed poses, with no second performance. Original measurements finish before any additional resolver/memory work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one row per supplied observation and at most three copied boundary states until the completion log; temporary bone maps release after each read, with no global cache or external handle.
 */
export function motionHumanFlightDiagnostic(props: {
  /** Actual canonical body shared by the input and completed performance. */
  body: IAutoMovieMotionHumanBody;

  /** Completed original performance; no second film is constructed. */
  film: IAutoMovieMotionHumanPerformance;

  /** Original construction input, used to check the decomposition premises. */
  input: IAutoMovieMotionHumanPerformance.IInput;

  /** The actual jump segment in that film's stand/jump sequence. */
  segment: IAutoMovieMotionHumanSegment;

  /** Original physical mass model, shared with the displayed measurements. */
  model: IAutoMovieResolveCenterOfMass.IModel;

  /**
   * Original takeoff; momentum supports follow it and direct seam reads
   * straddle it.
   */
  from: number;

  /** Original touchdown in film seconds; all difference endpoints precede it. */
  to: number;

  /** Unchanged positive central-difference half-interval, in seconds. */
  delta: number;

  /** The nineteen interior twentieths of flight and their owned actual poses. */
  observations: readonly motionHumanFlightDiagnostic.IObservation[];
}): {
  /** Failed momentum-row premises/readings, without masking later rows. */
  problems: string[];

  /** One causal observation per original conservation read, in input order. */
  rows: IRow[];

  /** Direct displayed states at takeoff and its two adjacent binary64 seconds. */
  takeoff: {
    /** Actual queried film second. */
    seconds: number;

    /** Owned actual canonical pose, including its displayed world root. */
    pose: IAutoMoviePose;

    /** Actual world centre of mass, metres. */
    centre: IAutoMovieVector3;

    /** Owned actual articulation's root-local FK, in skeleton order. */
    bones: IAutoMovieResolvedBone[];
  }[];

  /** Unavailable boundary observations; these change no original acceptance. */
  takeoffProblems: string[];
} {
  const {
    body,
    film,
    input,
    segment,
    model,
    from,
    to,
    delta,
    observations,
  }: typeof props = props;
  const problems: string[] = [];
  const rows: IRow[] = [];
  const segments: readonly IAutoMovieMotionHumanSegment[] = film.segments("a");
  if (
    film.performers.length !== 1 ||
    film.performers[0]?.body !== body ||
    input.performers[0]?.body !== body ||
    segments.length !== 2 ||
    segments[0]?.name !== "stand" ||
    segment !== segments[1] ||
    segment.name !== "jump"
  )
    problems.push(
      "flight diagnostic needs the original single stand/jump performer",
    );
  if (
    film.overlays("a").length !== 0 ||
    Object.values(input.layers ?? {}).some(
      (
        layers: NonNullable<
          IAutoMovieMotionHumanPerformance.IInput["layers"]
        >[string],
      ): boolean => layers.length !== 0,
    )
  )
    problems.push("flight diagnostic does not admit overlays or layers");
  if (
    (input.props?.length ?? 0) !== 0 ||
    (input.forces?.length ?? 0) !== 0 ||
    (input.blasts?.length ?? 0) !== 0
  )
    problems.push(
      "flight diagnostic does not admit props, external forces or blasts",
    );
  if (
    segments.some(
      (value: IAutoMovieMotionHumanSegment): boolean =>
        (value.plan.holds?.length ?? 0) !== 0 ||
        (value.plan.weapons?.length ?? 0) !== 0,
    )
  )
    problems.push("flight diagnostic does not admit held or stopped weapons");
  if (
    !(
      delta > 0 &&
      observations.length === 19 &&
      observations.every(
        (row: motionHumanFlightDiagnostic.IObservation, i: number): boolean =>
          row.seconds === from + ((to - from) * (i + 1)) / 20,
      )
    )
  )
    problems.push(
      "flight diagnostic needs one observation at each of the nineteen interior twentieths and positive DELTA",
    );
  for (const observation of observations) {
    const row: IRow = {
      role: observation.role,
      seconds: observation.seconds,
      support: [observation.seconds - delta, observation.seconds + delta],
      roots: [
        observation.before.root?.rotation ?? null,
        observation.after.root?.rotation ?? null,
      ],
      displayed: { ...observation.displayed },
      rigid: null,
      discrepancy: null,
      finite: true,
      jointDifferences: [],
    };
    try {
      const endpoint: (
        seconds: number,
        actual: IAutoMoviePose,
      ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
        seconds: number,
        actual: IAutoMoviePose,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        if (!(seconds > from && seconds < to))
          throw new Error(`difference endpoint ${seconds} is outside flight`);
        const transition: IAutoMovieMotionHumanSegment["transition"] =
          segment.transition;
        if (
          transition !== undefined &&
          transition.kind !== "redirect" &&
          !(seconds - transition.cut >= transition.blend)
        )
          throw new Error(`transition offset still active at ${seconds}`);
        const share: number = (seconds - segment.start) / segment.plan.duration;
        if (
          segment.plan.contacts.some(
            (
              contact: IAutoMovieMotionHumanSegment["plan"]["contacts"][number],
            ): boolean => contact.from <= share && share <= contact.to,
          )
        )
          throw new Error(`a declared contact remains active at ${seconds}`);
        const raw: IAutoMovieMotionHumanPosture = {
          ...segment.plan.posture(seconds - segment.start),
        };
        delete raw.rotation;
        if (
          Object.values(raw.limbs).some(
            (goal: IAutoMovieHumanLimbGoal): boolean =>
              goal.planted === true || goal.on !== undefined,
          )
        )
          throw new Error(`raw goals are planted or attached at ${seconds}`);
        if (actual.root === null || !qunit(actual.root.rotation))
          throw new Error(`recorded displayed root is invalid at ${seconds}`);
        const canonical: IAutoMoviePose = clampPose(
          resolveHumanPosture(body, raw),
          body.skeleton,
        );
        const actualJoints: Map<
          AutoMovieHumanoidBone,
          IAutoMoviePose["joints"][number]
        > = new Map(
          actual.joints.map(
            (
              joint: IAutoMoviePose["joints"][number],
            ): [AutoMovieHumanoidBone, IAutoMoviePose["joints"][number]] => [
              joint.bone,
              joint,
            ],
          ),
        );
        if (actual.joints.length !== canonical.joints.length)
          throw new Error(`joint population changed at ${seconds}`);
        for (const joint of canonical.joints) {
          const displayed: IAutoMoviePose["joints"][number] | undefined =
            actualJoints.get(joint.bone);
          if (displayed === undefined)
            throw new Error(
              `displayed joint ${joint.bone} is missing at ${seconds}`,
            );
          for (const axis of ["flexion", "abduction", "twist"] as const) {
            if (!Object.is(displayed[axis], joint[axis]))
              row.jointDifferences.push({
                seconds,
                bone: joint.bone,
                axis,
                displayed: displayed[axis],
                rigid: joint[axis],
              });
          }
        }
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(body, { ...canonical, root: actual.root });
        motionHumanFrame(bones, `rigid diagnostic ${seconds}`);
        return bones;
      };
      row.rigid = resolveAutoMovieMomentum(
        model,
        endpoint(row.support[0], observation.before),
        endpoint(row.support[1], observation.after),
        2 * delta,
      ).angular;
      row.discrepancy = Vector3.subtract(row.displayed, row.rigid);
    } catch (error) {
      row.finite = false;
      row.error = error instanceof Error ? error.message : String(error);
      problems.push(`${row.role}: ${row.error}`);
    }
    rows.push(row);
  }
  const takeoff: ReturnType<typeof motionHumanFlightDiagnostic>["takeoff"] = [];
  const takeoffProblems: string[] = [];
  if (!(from > 0))
    takeoffProblems.push(
      "Direct takeoff observation requires this fixture's positive finite clock",
    );
  else {
    const view: DataView = new DataView(
      new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT),
    );
    view.setFloat64(0, from);
    const bits: bigint = view.getBigUint64(0);
    view.setBigUint64(0, bits - 1n);
    const before: number = view.getFloat64(0);
    view.setBigUint64(0, bits + 1n);
    const after: number = view.getFloat64(0);
    for (const seconds of [before, from, after]) {
      try {
        const pose: IAutoMoviePose = film.pose("a", seconds);
        if (pose.root === null || !qunit(pose.root.rotation))
          throw new Error(
            "Direct takeoff observation has an invalid displayed root",
          );
        const world: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones("a", seconds);
        const local: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(body, { ...pose, root: null });
        motionHumanFrame(world, `displayed takeoff ${seconds}`);
        motionHumanFrame(local, `root-local takeoff ${seconds}`);
        const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
          model,
          world,
        );
        takeoff.push({
          seconds,
          pose: structuredClone(pose),
          centre,
          bones: Array.from(
            local.values(),
            (bone: IAutoMovieResolvedBone): IAutoMovieResolvedBone =>
              structuredClone(bone),
          ),
        });
      } catch (error) {
        takeoffProblems.push(
          `${seconds}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  return { problems, rows, takeoff, takeoffProblems };
}

/**
 * The input observation owned by the same-film flight diagnostic. SI world
 * momentum and copied canonical poses retain the original film's seconds and
 * clinical joints; runtime checks admit the decomposition.
 */
export namespace motionHumanFlightDiagnostic {
  /**
   * One original momentum read and owned copies of the displayed poses its two
   * bone reads used. These values preserve evidence for later diagnosis.
   */
  export interface IObservation {
    /** Reference or original numbered conservation read. */
    role: string;

    /** Original film second, at the interval's midpoint. */
    seconds: number;

    /** Original displayed world angular momentum, kg m squared per second. */
    displayed: IAutoMovieVector3;

    /** Actual displayed pose at seconds minus the unchanged DELTA. */
    before: IAutoMoviePose;

    /** Actual displayed pose at seconds plus the unchanged DELTA. */
    after: IAutoMoviePose;
  }
}
