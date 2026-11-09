import type { AutoMovieComposition } from "@automovie/engine";

import { VerticalCamera } from "../../../entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../entities/cast/student/harryPotter";
import { Student } from "../../../entities/cast/student/Student";
import { PaperCrane } from "../../../entities/props/paper-crane/PaperCrane";
import { TeaCup } from "../../../entities/props/tea-cup/TeaCup";
import { SchoolCorridor } from "../../../entities/sets/school-corridor/SchoolCorridor";
import { StageMount } from "../../../interactions/staging/StageMount";

/**
 * The corridor-bay stage of the `paper-crane-invitation` film: the window
 * bay, Carina and Harry, the charmed paper crane, the two tea cups and the
 * one vertical camera every scene composes, mounted through the library's
 * `StageMount`. It only names the set and cast; every place, timing, pose
 * and framing comes from the library.
 *
 * ```ts
 * const stage = new CorridorStage();
 * const mounted = stage.mount(paperCraneInvitation.compose(stage.cast), 60);
 * mounted.seek(17);
 * ```
 *
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s01 The bay, both students, the crane, the two cups and the vertical camera every scene of the one continuous take uses.
 * @evidence contracts/development/common.md#meaningful-documentation States what the stage names and what it leaves to the library.
 * @evidence contracts/development/design.md#principled-representation The cast is the screenplay breakdown's people, props, set and camera as library entities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cast the scenes read, one mount the film calls and one resolve the schedule test calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, time or coordinate is named here.
 */
export class CorridorStage {
  /** Everyone and everything the scenes compose. */
  public readonly cast: CorridorStage.ICast;

  /** Build the cast from the shared library's settings entities. */
  public constructor() {
    this.cast = Object.freeze({
      bay: new SchoolCorridor(),
      carina: new Student(carinaMalfoy),
      harry: new Student(harryPotter),
      crane: new PaperCrane("crane"),
      cupA: new TeaCup("cupA"),
      cupB: new TeaCup("cupB"),
      camera: new VerticalCamera(),
    });
  }

  /**
   * Resolve the film's composition in the bay and mount it.
   *
   * @param composition The film's composition.
   * @param duration The film's running time, seconds.
   * @param progress Receives progress messages.
   * @returns The mounted stage, structurally a film production.
   * @evidence docs/body/screenplay/paper-crane-invitation.md#s01 Mounts the cast the scenes compose.
   * @evidence contracts/development/composition.md#screenplay-realization Mounts exactly the breakdown's cast, props, set and camera.
   * @evidence contracts/development/composition.md#composition-only Hands the composition to the library's mount without any calculation.
   * @evidence contracts/development/composition.md#living-scene Both students, the props and the camera are mounted for the whole film; their behaviour is the scenes'.
   * @evidence contracts/development/common.md#meaningful-documentation States what is mounted.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `StageMount.mount`, which resolves the schedule once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call; the stage owns only the cast list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per mount.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The mount's schedule, tracks and scene serve every seek.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned mount owns and disposes the scene.
   */
  public mount(composition: AutoMovieComposition, duration: number, progress?: (message: string) => void): StageMount.IMounted {
    const { bay, carina, harry, crane, cupA, cupB, camera } = this.cast;
    return StageMount.mount({
      set: bay,
      students: [carina, harry],
      props: [crane, cupA, cupB],
      camera,
      composition,
      duration,
      ...(progress === undefined ? {} : { progress }),
    });
  }

  /**
   * Resolve the film's composition without drawing: what the schedule test reads.
   *
   * @param composition The film's composition.
   * @returns The schedule, performance and prop track.
   * @evidence docs/body/screenplay/paper-crane-invitation.md#s01 Resolves the same cast the film mounts.
   * @evidence contracts/development/composition.md#screenplay-realization Resolves exactly the mounted cast and props.
   * @evidence contracts/development/composition.md#composition-only Delegates to `StageMount.resolve`.
   * @evidence contracts/development/composition.md#living-scene The same parts as the mount.
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the library's resolver.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing retained between calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data; nothing to release.
   */
  public resolve(composition: AutoMovieComposition): ReturnType<typeof StageMount.resolve> {
    const { bay, carina, harry, crane, cupA, cupB } = this.cast;
    return StageMount.resolve({ set: bay, students: [carina, harry], props: [crane, cupA, cupB], composition });
  }
}

/** Companion types of {@link CorridorStage}. */
export namespace CorridorStage {
  /** The cast every scene of the film composes. */
  export interface ICast {
    /** The corridor window bay with its bench and sill. */
    readonly bay: SchoolCorridor;

    /** Carina Malfoy. */
    readonly carina: Student;

    /** Harry Potter. */
    readonly harry: Student;

    /** The charmed paper crane carrying the invitation, folded in Carina's right hand at the start. */
    readonly crane: PaperCrane;

    /** The cup Carina keeps, standing on the sill at the start. */
    readonly cupA: TeaCup;

    /** The cup Carina hands to Harry, standing on the sill at the start. */
    readonly cupB: TeaCup;

    /** The one vertical camera. */
    readonly camera: VerticalCamera;
  }
}
