import type { AutoMovieComposition } from "@automovie/engine";

import { VerticalCamera } from "../../../entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../entities/cast/student/harryPotter";
import { Student } from "../../../entities/cast/student/Student";
import { StageEffects } from "../../../consequences/effects/StageEffects";
import { FallingMasonry } from "../../../entities/props/falling-masonry/FallingMasonry";
import { Wand } from "../../../entities/props/wand/Wand";
import { TrainingCourt } from "../../../entities/sets/training-court/TrainingCourt";
import { StageMount } from "../../../interactions/staging/StageMount";

/**
 * The training-court stage of the `look-at-me-duel` film: the court, Carina
 * and Harry with their wands, and the one vertical camera every scene
 * composes, mounted through the library's `StageMount`. It only names the
 * set and cast; every place, timing, pose and framing comes from the
 * library.
 *
 * ```ts
 * const stage = new CourtStage();
 * const mounted = stage.mount(composeLookAtMeDuel(stage.cast), 60);
 * mounted.seek(30);
 * ```
 *
 * @evidence docs/body/screenplay/look-at-me-duel.md#s01 The court, both students, both wands, the support and the vertical camera every scene of the one continuous duel uses.
 * @evidence contracts/development/common.md#meaningful-documentation States what the stage names and what it leaves to the library.
 * @evidence contracts/development/design.md#principled-representation The cast is the screenplay breakdown's people, props, set and camera as library entities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cast the scenes read and one mount the film calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene, time or coordinate is named here.
 */
export class CourtStage {
  /** Everyone and everything the scenes compose. */
  public readonly cast: CourtStage.ICast;

  /** Build the cast from the shared library's settings entities. */
  public constructor() {
    this.cast = Object.freeze({
      court: new TrainingCourt(),
      carina: new Student(carinaMalfoy),
      harry: new Student(harryPotter),
      carinasWand: new Wand("wand-carina", "hawthorn"),
      harrysWand: new Wand("wand-harry", "holly"),
      cap: new FallingMasonry("cap"),
      camera: new VerticalCamera(),
    });
  }

  /**
   * Resolve the film's composition on the court and mount it.
   *
   * @param composition The film's composition.
   * @param duration The film's running time, seconds.
   * @param progress Receives progress messages.
   * @returns The mounted stage, structurally a film production.
   * @evidence docs/body/screenplay/look-at-me-duel.md#s01 Mounts the cast the scenes compose.
   * @evidence contracts/development/composition.md#screenplay-realization Mounts exactly the breakdown's cast, props, set and camera.
   * @evidence contracts/development/composition.md#composition-only Hands the composition to the library's mount without any calculation.
   * @evidence contracts/development/composition.md#living-scene Both students and the camera are mounted for the whole film; their behaviour is the scenes'.
   * @evidence contracts/development/common.md#meaningful-documentation States what is mounted.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `StageMount.mount`, which resolves the schedule once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call; the stage owns only the cast list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per mount.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The mount's schedule, tracks and scene serve every seek.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned mount owns and disposes the scene.
   */
  public mount(composition: AutoMovieComposition, duration: number, progress?: (message: string) => void): StageMount.IMounted {
    const { court, carina, harry, carinasWand, harrysWand, cap, camera } = this.cast;
    return StageMount.mount({
      set: court,
      students: [carina, harry],
      props: [carinasWand, harrysWand, cap],
      camera,
      composition,
      duration,
      effects: StageEffects.duel({ cap, seed: CourtStage.SEED }),
      ...(progress === undefined ? {} : { progress }),
    });
  }

  /**
   * Resolve the film's composition without drawing: what the schedule test reads.
   *
   * @param composition The film's composition.
   * @returns The schedule, performance and prop track.
   * @evidence docs/body/screenplay/look-at-me-duel.md#s01 Resolves the same cast the film mounts.
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
    const { court, carina, harry, carinasWand, harrysWand, cap } = this.cast;
    return StageMount.resolve({ set: court, students: [carina, harry], props: [carinasWand, harrysWand, cap], composition });
  }

  /** The film seed the duel's seeded consequences (the cap's fragments) derive from: the film's name. */
  public static readonly SEED: string = "look-at-me-duel";
}

/** Companion types of {@link CourtStage}. */
export namespace CourtStage {
  /** The cast every scene of the film composes. */
  export interface ICast {
    /** The training court and its support. */
    readonly court: TrainingCourt;

    /** Carina Malfoy. */
    readonly carina: Student;

    /** Harry Potter. */
    readonly harry: Student;

    /** Carina's hawthorn wand, in her right hand. */
    readonly carinasWand: Wand;

    /** Harry's holly wand, in his right hand. */
    readonly harrysWand: Wand;

    /** The support's cap, which fails when the deflected jinx strikes its cracked fillet. */
    readonly cap: FallingMasonry;

    /** The one vertical camera. */
    readonly camera: VerticalCamera;
  }
}
