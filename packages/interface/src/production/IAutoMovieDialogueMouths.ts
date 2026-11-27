import type { IAutoMovieHumanVisemeWeights } from "../human/IAutoMovieHumanVisemeWeights";

/**
 * The dialogue mouths a draw host hands a subject: each speaking actor's mouth
 * at any film second, read while the subject places that second.
 *
 * The draw page builds it over the film's `IAutoMovieDialogueMouthTrack` with
 * engine's `sampleDialogueMouth`, and records what each read returned,
 * so the render measures the mouth the subject was handed for the drawn second.
 * A subject reads one form per actor, the one its representation takes, and
 * layers it over the actor's authored expression.
 */
export interface IAutoMovieDialogueMouths {
  /**
   * The actor's jaw opening in millimetres at the incisors at `seconds`, for
   * the Human or the polygon man; 0 while the actor speaks no line.
   */
  jaw(actor: string, seconds: number): number;

  /**
   * The actor's MPEG-4 viseme weights at `seconds`, for a VRM or imported model
   * through `applyExpression`; `{ sil: 1 }` while the actor speaks no line.
   */
  visemes(actor: string, seconds: number): IAutoMovieHumanVisemeWeights;
}
