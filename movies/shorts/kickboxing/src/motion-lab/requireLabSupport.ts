import type { LabActor } from "./LabActor";

/**
 * Refuse unsupported actual bodies before their geometry can supply a contact event.
 * @evidence contracts/common.md#implementation-and-ownership Uses the complete actor admission result, including native hard/floor and independent loaded-foot checks. A raw joint-solver admission alone cannot bypass an invalid load relationship; no collision query or contact snapshot is produced here.
 * @evidence contracts/common.md#authoring-interface Requires the same actors just fitted by the consumer. Failure contains detached original observations and local time, without copying achieved anchors into new goals or changing load to obtain acceptance.
 */
export function requireLabSupport(
  actors: readonly LabActor[],
  seconds: number,
): void {
  const rejected: LabActor[] = actors.filter(
    (actor: LabActor): boolean => actor.support?.status !== "admitted",
  );
  if (rejected.length)
    throw new Error(
      `Contact capture has unresolved support at ${seconds}s: ${rejected.map((actor: LabActor): string => `${actor.id}/${actor.support?.reason}/${actor.support?.supportError}`).join(", ")}`,
      {
        cause: {
          kind: "unsupported-contact-capture",
          seconds,
          actors: actors.map((actor: LabActor): object => actor.inspect()),
        },
      },
    );
}
