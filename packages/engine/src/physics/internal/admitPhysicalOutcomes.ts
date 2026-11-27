import type { IAutoMovieAuditPhysicalOutcomes } from "@automovie/interface";

import { samplePhysicalContactEvents } from "./samplePhysicalContactEvents";

/*
 * Refuse invalid event windows, observed times and receipt authority before
 * evaluating outcome promises.
 */
export function admitPhysicalOutcomes(
  input: IAutoMovieAuditPhysicalOutcomes.IInput,
): void {
  const name: (value: string) => boolean = (value: string): boolean =>
    !!value.trim();
  const time: (seconds: number, tolerance: number) => boolean = (
    seconds: number,
    tolerance: number,
  ): boolean => seconds >= 0 && tolerance >= 0;
  for (const action of input.actions)
    if (
      !name(action.id) ||
      !time(action.seconds, action.tolerance) ||
      !name(action.actor) ||
      !name(action.target) ||
      !action.actorShapes.length ||
      !action.actorShapes.every(name) ||
      !action.targetShapes.length ||
      !action.targetShapes.every(name)
    )
      throw new Error("Invalid physical outcome promise");
  for (const fall of input.falls)
    if (
      !name(fall.id) ||
      !name(fall.body) ||
      !time(fall.seconds, fall.tolerance)
    )
      throw new Error("Invalid physical fall promise");
  for (const [body, seconds] of Object.entries(input.observedFalls))
    if (!name(body) || seconds < 0)
      throw new Error("Invalid observed physical fall time");
  for (const receipt of input.contacts) samplePhysicalContactEvents(receipt, 0);
}
