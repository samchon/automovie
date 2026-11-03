import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import { AutoMovieHumanHandForm } from "./AutoMovieHumanHandForm";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const { TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { form }: typeof AutoMovieHumanHandForm = AutoMovieHumanHandForm;

/**
 * Both hands' events: the form's for the left, reflected for the right.
 */
export namespace AutoMovieHumanHandEvents {
  /** Both hands' events: the form's for the left, reflected for the right. */
  export function events(): IAutoMovieHumanBodyCalibration.IEvent[] {
    return form().events.flatMap(
      (e: IAutoMovieHumanHandForm.IEvent): IAutoMovieHumanBodyCalibration.IEvent[] => [
        {
          parent: e.parent.replace("{side}", "left"),
          direction: "down",
          web: true,
          splits: e.splits.map(
            (s: IAutoMovieHumanHandForm.ISplit): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: s.child.replace("{side}", "left"),
              arcs: s.arcs.map(
                (a: [number, number]): [number, number] => [a[0], a[1]],
              ),
            }),
          ),
        },
        {
          parent: e.parent.replace("{side}", "right"),
          direction: "down",
          web: true,
          splits: [...e.splits].reverse().map(
            (s: IAutoMovieHumanHandForm.ISplit): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: s.child.replace("{side}", "right"),
              arcs: [...s.arcs]
                .reverse()
                .map(
                  (a: [number, number]): [number, number] => [
                    TWO_PI - a[1],
                    TWO_PI - a[0],
                  ],
                ),
            }),
          ),
        },
      ],
    );
  }
}
