import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFootStrike,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The foot strikes' forms: for each technique, the point of the foot that
 * lands, where its toes and instep face from the line, the kicker's left and
 * the kicking leg's outward side, and the direction it travels at the strike.
 */
export namespace FootStrikeForms {
  /*
   * A foot strike's contact point on the foot.
   */
  export type Contact = "heel" | "sole";

  /*
   * How one technique meets its target: the contact, the foot's attitude and
   * the travel.
   */
  export interface IForm {
    /*
     * The point of the foot that lands.
     */
    contact: Contact;

    /*
     * Where the toes point, from the line, the kicker's left and up.
     */
    toes: (
      line: IAutoMovieVector3,
      left: IAutoMovieVector3,
      outward: IAutoMovieVector3,
    ) => IAutoMovieVector3;

    /*
     * Where the instep faces.
     */
    instep: (
      line: IAutoMovieVector3,
      left: IAutoMovieVector3,
      outward: IAutoMovieVector3,
    ) => IAutoMovieVector3;

    /*
     * The unit direction the contact travels at the strike.
     */
    travel: (
      line: IAutoMovieVector3,
      left: IAutoMovieVector3,
      outward: IAutoMovieVector3,
    ) => IAutoMovieVector3;
  }

  /*
   * The world's up.
   */
  export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /*
   * The world's down.
   */
  export const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

  /*
   * Each technique's contact, foot attitude and travel.
   */
  export const FORMS: Readonly<
    Record<IAutoMovieMotionHumanFootStrike.Technique, IForm>
  > = {
    side: {
      contact: "heel",
      toes: (_l, _x, outward) => Vector3.scale(outward, -1),
      instep: (line) => Vector3.scale(line, -1),
      travel: (line) => line,
    },
    back: {
      contact: "heel",
      toes: () => DOWN,
      instep: (line) => Vector3.scale(line, -1),
      travel: (line) => line,
    },
    hook: {
      contact: "heel",
      toes: (_l, _x, outward) => Vector3.scale(outward, -1),
      instep: () => UP,
      travel: (_l, _x, outward) => outward,
    },
    crescent: {
      contact: "sole",
      toes: () => UP,
      instep: (_l, _x, outward) => outward,
      travel: (_l, _x, outward) => Vector3.scale(outward, -1),
    },
    axe: {
      contact: "heel",
      toes: (line) => line,
      instep: () => UP,
      travel: () => DOWN,
    },
    stomp: {
      contact: "sole",
      toes: (line) => line,
      instep: () => UP,
      travel: () => DOWN,
    },
    sweep: {
      contact: "sole",
      toes: (line) => line,
      instep: (_l, _x, outward) => outward,
      travel: (_l, _x, outward) => Vector3.scale(outward, -1),
    },
  };
}
