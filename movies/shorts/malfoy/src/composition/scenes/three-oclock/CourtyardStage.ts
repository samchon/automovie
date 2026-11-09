import type { AutoMovieComposition } from "@automovie/engine";

import { VerticalCamera } from "../../../entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../entities/cast/student/harryPotter";
import { Student } from "../../../entities/cast/student/Student";
import { InvitationNote } from "../../../entities/props/invitation-note/InvitationNote";
import { SideCourtyard } from "../../../entities/sets/side-courtyard/SideCourtyard";
import { StageMount } from "../../../interactions/staging/StageMount";

/**
 * The side-courtyard stage of the `three-oclock` film: the set, the two
 * students, the invitation note and the vertical camera every scene of
 * `docs/body/screenplay/three-oclock.md` composes, and the mount that hands
 * the film's composition to the library's `StageMount`. It names the cast and
 * nothing else; every place, motion, outcome and framing belongs to the
 * library.
 *
 * ```ts
 * const stage = new CourtyardStage();
 * const production = stage.mount(composeThreeOclock(stage.cast), 60, progress);
 * production.seek(35);
 * ```
 *
 * @evidence docs/body/screenplay/three-oclock.md#s01 The cast, set, prop and camera of the opening scene's breakdown.
 * @evidence docs/body/screenplay/three-oclock.md#s02 The same recess, students and note continue.
 * @evidence docs/body/screenplay/three-oclock.md#s03 The same recess, students and note continue to the end.
 * @evidence contracts/development/common.md#meaningful-documentation States what the stage holds, what it leaves to the library, and how a film uses it.
 * @evidence contracts/development/design.md#principled-representation The cast is the screenplay breakdown's entities, frozen; the mount is the library's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the cast the scenes read and the mount the film calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, second or coordinate is named here.
 * @evidence contracts/development/composition.md#composition-only The stage only constructs library entities and calls the library mount.
 */
export class CourtyardStage {
  /** Everyone and everything the scenes compose. */
  public readonly cast: CourtyardStage.ICast;

  /** Build the cast from the settings records the library entities realize. */
  public constructor() {
    this.cast = Object.freeze({
      set: new SideCourtyard(),
      carina: new Student(carinaMalfoy),
      harry: new Student(harryPotter),
      note: new InvitationNote(),
      camera: new VerticalCamera(),
    });
  }

  /**
   * The world a test resolves the composition on, without drawing.
   *
   * @returns The set, students and props of the stage.
   * @evidence contracts/development/composition.md#composition-only Returns the cast's library entities unchanged.
   * @evidence contracts/development/implementation.md#principled-implementation The mount and the schedule test resolve on the same world, so the test reads the schedule the film plays.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One accessor shared by `mount` and the test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No test-only member: the mount reads it too.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same entity instances serve every call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing beyond the frozen cast.
   */
  public world(): Pick<StageMount.IInput, "set" | "students" | "props"> {
    const { set, carina, harry, note } = this.cast;
    return { set, students: [carina, harry], props: [note] };
  }

  /**
   * Resolve the film's composition once and mount it.
   *
   * @param composition The film's composition.
   * @param duration The film's running time, seconds.
   * @param progress Receives progress messages.
   * @returns The mounted stage: the scene, the delivered camera, an exact-time seek and its release.
   * @evidence contracts/development/composition.md#composition-only Hands the composition and cast to the library's `StageMount`.
   * @evidence contracts/development/implementation.md#principled-implementation The library resolves the schedule once and seeks it exactly, in the Viewer and in Node capture alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single delegation; the film maps the result to its production.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is added to the library's mount.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per mount, owned by the library.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One mounted stage serves every seek.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mounted stage owns its scene and releases it through `dispose`.
   */
  public mount(
    composition: AutoMovieComposition,
    duration: number,
    progress?: (message: string) => void,
  ): StageMount.IMounted {
    return StageMount.mount({
      ...this.world(),
      camera: this.cast.camera,
      composition,
      duration,
      ...(progress === undefined ? {} : { progress }),
    });
  }
}
export namespace CourtyardStage {
  /** The entities of the courtyard film. */
  export interface ICast {
    /** The side courtyard. */
    set: SideCourtyard;

    /** Carina Malfoy, who holds the note from the first frame. */
    carina: Student;

    /** Harry Potter, who comes in through the west gap. */
    harry: Student;

    /** The invitation note. */
    note: InvitationNote;

    /** The film's one camera. */
    camera: VerticalCamera;
  }
}
