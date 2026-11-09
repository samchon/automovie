import type { AutoMovieComposition } from "@automovie/engine";

import { VerticalCamera } from "../../../entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../entities/cast/student/harryPotter";
import { practicePlayers } from "../../../entities/cast/student/practicePlayers";
import { Student } from "../../../entities/cast/student/Student";
import { BeaterBat } from "../../../entities/props/beater-bat/BeaterBat";
import { Broom } from "../../../entities/props/broom/Broom";
import type { IStageProp } from "../../../entities/props/IStageProp";
import { QuidditchBall } from "../../../entities/props/quidditch-ball/QuidditchBall";
import { QuidditchPitch } from "../../../entities/sets/quidditch-pitch/QuidditchPitch";
import { StageMount } from "../../../interactions/staging/StageMount";

/**
 * The practice-pitch stage of the `snitch-before-you` film: the pitch, the
 * two Seekers, the twelve supporting players, the fourteen brooms, the four
 * balls, the four Beaters' bats and the vertical camera every scene composes, and the mount that
 * resolves the film once through the library's `StageMount`. It only wires
 * library entities; every decision lives in the scenes and the library.
 *
 * ```ts
 * const stage = new PitchStage();
 * const mounted = stage.mount(composeSnitchBeforeYou(stage), 60);
 * mounted.seek(38);
 * ```
 *
 * @evidence docs/body/screenplay/snitch-before-you.md#s01 The cast, crowd, props, set and camera of the one continuous practice match.
 * @evidence contracts/development/composition.md#composition-only Only library entities and the library mount are wired; no coordinate is written here.
 * @evidence contracts/development/common.md#meaningful-documentation States what the stage holds and what it leaves to others.
 */
export class PitchStage {
  /** The practice pitch. */
  public readonly pitch: QuidditchPitch = new QuidditchPitch();

  /** Carina Malfoy, Slytherin's Seeker. */
  public readonly carina: Student = new Student(carinaMalfoy);

  /** Harry Potter, Gryffindor's Seeker. */
  public readonly harry: Student = new Student(harryPotter);

  /** The twelve supporting players by authoring id. */
  public readonly players: Readonly<Record<string, Student>> = Object.freeze(
    Object.fromEntries(Object.entries(practicePlayers).map(([id, profile]) => [id, new Student(profile)])),
  );

  /** The Golden Snitch. */
  public readonly snitch: QuidditchBall = new QuidditchBall("snitch", "snitch");

  /** The Quaffle. */
  public readonly quaffle: QuidditchBall = new QuidditchBall("quaffle", "quaffle");

  /** The two Bludgers, west and east. */
  public readonly bludgers: readonly QuidditchBall[] = [new QuidditchBall("B-1", "bludger"), new QuidditchBall("B-2", "bludger")];

  /** The four Beaters' bats by Beater id, `bat-<id>`, each held from the first frame. */
  public readonly bats: Readonly<Record<string, BeaterBat>> = Object.freeze(
    Object.fromEntries(["S-B1", "S-B2", "G-B1", "G-B2"].map((id: string): [string, BeaterBat] => [id, new BeaterBat(`bat-${id}`)])),
  );

  /** The film's one camera. */
  public readonly camera: VerticalCamera = new VerticalCamera();

  /** @returns Every rider who may appear: the two Seekers and the twelve. */
  public students(): Student[] {
    return [this.carina, this.harry, ...Object.values(this.players)];
  }

  /** @returns Every prop: one broom per rider, `broom-<id>` in its house colour, the four balls and the four bats. */
  public props(): IStageProp[] {
    return [
      ...this.students().map((s: Student) => new Broom(`broom-${s.id}`, s.profile.house)),
      this.snitch,
      this.quaffle,
      ...this.bludgers,
      ...Object.values(this.bats),
    ];
  }

  /**
   * Mount the film's composition on the pitch.
   *
   * @param composition The film's composition.
   * @param duration Film seconds.
   * @param progress Progress messages.
   * @returns The mounted stage.
   */
  public mount(composition: AutoMovieComposition, duration: number, progress?: (message: string) => void): StageMount.IMounted {
    return StageMount.mount({
      set: this.pitch,
      students: this.students(),
      props: this.props(),
      camera: this.camera,
      composition,
      duration,
      ...(progress === undefined ? {} : { progress }),
    });
  }
}
