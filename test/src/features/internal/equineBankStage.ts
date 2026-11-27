import { AutoMovieArchetypeFrame, AutoMovieArchetypeQuadrupedBody, type AutoMovieArchetypeQuadrupedFooting, rideHorse, type rideQuadruped, type AutoMovieArchetypeHorse } from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { equineFordScene } from "./equineFordScene";

/**
 * The steep-bank stages of the bank slide and scramble specs: a level approach, a straight face down or up, and a level run-out, as authored footing and a walking course, and readers of the ride's emitted hooves against them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage and who reads it.
 * @evidence contracts/development/design.md#principled-representation A face's grade and run with the planes and course they make.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by test_motion_mount_equine_bank_slide and test_motion_mount_equine_bank_scramble.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equineBankStage {
  /** The level approach before the face, metres along +Z: long enough for a rider to sit on and settle before the face. */
  export const APPROACH: number = 5;

  /** The level run-out after the face, metres. */
  export const RUN_OUT: number = 4;

  /** A horse ride along a course. */
  export type Ride = ReturnType<typeof rideHorse>;

  /**
   * A face: its signed grade, rise over run, negative down, and its run in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and sign.
   * @evidence contracts/development/design.md#principled-representation Two numbers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `planes` and `course`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFace {
    /** Rise over run, negative for a descent. */
    grade: number;
    /** Horizontal metres. */
    run: number;
  }

  /**
   * The footing: the approach, the face and the run-out.
   *
   * @param face The face.
   * @returns The planes, in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the planes returned.
   * @evidence contracts/development/implementation.md#principled-implementation Each plane starts where the previous ends, at the height it reached.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both specs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh planes.
   */
  export function planes(
    face: IFace,
  ): AutoMovieArchetypeQuadrupedFooting.IPlane[] {
    const end: number = APPROACH + face.run;
    return [
      {
        id: "approach",
        origin: { x: 0, y: 0, z: APPROACH },
        x: [-6, 6],
        z: [-6, APPROACH],
        slope: { x: 0, z: 0 },
      },
      {
        id: "face",
        origin: { x: 0, y: 0, z: APPROACH },
        x: [-6, 6],
        z: [APPROACH, end],
        slope: { x: 0, z: face.grade },
      },
      {
        id: "runOut",
        origin: { x: 0, y: face.grade * face.run, z: end },
        x: [-6, 6],
        z: [end, end + 30],
        slope: { x: 0, z: 0 },
      },
    ];
  }

  /**
   * The walking course over the stage with a technique on the face.
   *
   * @param face The face.
   * @param technique The face's footwork.
   * @param runOut Whether a run-out leg follows the face.
   * @param footing Whether the footing is authored.
   * @returns The course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the course returned.
   * @evidence contracts/development/implementation.md#principled-implementation The face's leg rises with the face's grade.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both specs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh course.
   */
  export function course(
    face: IFace,
    technique: NonNullable<rideQuadruped.ILeg["equineFootwork"]>,
    runOut: boolean = true,
    footing: boolean = true,
  ): rideQuadruped.ICourse {
    return {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.2,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 0.5,
      deceleration: 0.5,
      startFromStanding: true,
      ...(footing ? { footing: { planes: planes(face) } } : {}),
      legs: [
        { kind: "straight", length: APPROACH },
        {
          kind: "straight",
          length: face.run,
          rise: face.grade * face.run,
          equineFootwork: technique,
        },
        ...(runOut
          ? [
              {
                kind: "straight",
                length: RUN_OUT,
              } satisfies rideQuadruped.ILeg,
            ]
          : []),
      ],
    };
  }

  /**
   * Readers of a ride's emitted hooves against its stage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each reader's unit.
   * @evidence contracts/development/design.md#principled-representation The film second of a cue, a hoof's world centre, its sole's gap to the plane under it, and any part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `read`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IReader {
    /** The film second of a named cue. */
    cue: (label: string) => number;
    /** A hoof bar's world centre at a film second. */
    hoof: (
      at: number,
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ) => IAutoMovieVector3;
    /** A hoof bar's lowest surface over the authored plane under it, metres, negative inside. */
    sole: (at: number, limb: AutoMovieArchetypeQuadrupedBody.Limb) => number;
    /** An emitted part at a film second. */
    part: (at: number, id: string) => IAutoMovieModelPart;
  }

  /**
   * Read a ride against its stage.
   *
   * @param ride The ride.
   * @param face The face.
   * @returns The readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and result.
   * @evidence contracts/development/implementation.md#principled-implementation Emitted parts placed by the ride's own placement, against the authored plane whose interval holds the hoof.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four closures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One ride sample per read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `equineFordScene.separation`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the ride.
   */
  export function read(ride: Ride, face: IFace): IReader {
    const surfaces: AutoMovieArchetypeQuadrupedFooting.IPlane[] = planes(face);
    const part = (at: number, id: string): IAutoMovieModelPart =>
      ride
        .at(at)
        .archetype.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === id,
        )!;
    const hoof = (
      at: number,
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.compose(
        ride.at(at).placement,
        part(at, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).transform!,
      ).translation;
    return {
      cue: (label: string): number => {
        for (const instant of ride.instants)
          if (instant.label === label) return instant.seconds;
        throw new Error(`The ride has no ${label} cue`);
      },
      hoof,
      part,
      sole: (
        at: number,
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
      ): number => {
        const z: number = hoof(at, limb).z;
        return equineFordScene.separation(
          part(at, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
          ride.at(at).placement,
          surfaces.find(
            (p: AutoMovieArchetypeQuadrupedFooting.IPlane): boolean =>
              z >= p.z[0] && z < p.z[1],
          )!,
        );
      },
    };
  }

  /**
   * Walk a horse over a course.
   *
   * @param horse The horse.
   * @param authored The course.
   * @returns The ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the gait.
   * @evidence contracts/development/implementation.md#principled-implementation The public horse ride at the walk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One ride.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `rideHorse`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the ride.
   */
  export function walk(
    horse: ReturnType<typeof AutoMovieArchetypeHorse.create>,
    authored: rideQuadruped.ICourse,
  ): Ride {
    return rideHorse(horse, authored, "walk");
  }
}
