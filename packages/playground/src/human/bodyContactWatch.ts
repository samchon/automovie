import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Read the committed body's skin contact on its own, so a pose or a shape
 * that sends skin through skin is never shown without saying so.
 *
 * The body builder does not refuse a crossing: whether soft tissue may press
 * is the census's question, and a crossing reading costs about a second,
 * too much for every slider step. So the editor reads it after each commit,
 * once the author has paused for `delayMs`, through the same worker request
 * and segment partition the Check contacts button uses, and appends the
 * result to the status line. A newer intent at any point (a slider moved,
 * a preset chosen) discards the reading, and the preview it would have
 * delayed is never queued behind it for longer than the pause.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reports skin passing through skin on every committed body instead of only when the author asks.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Reads the committed document's contact after a pause and discards the reading when a newer intent supersedes it.
 */
export function createBodyContactWatch<
  Model extends { crossings?: IAutoMovieModelCrossing[] | null },
>(props: {
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
    measure: boolean,
  ) => Promise<Model>;
  dispose: (model: Model) => void;
  isCurrent: (ticket: number) => boolean;
  report: (text: string) => void;
  delayMs?: number;
  schedule?: (callback: () => void, delayMs: number) => void;
}) {
  const schedule =
    props.schedule ??
    ((callback: () => void, delayMs: number) => {
      setTimeout(callback, delayMs);
    });
  /** The status wording of one reading; null when the build supplied none. */
  const describe = (
    reading: IAutoMovieModelCrossing[] | null | undefined,
  ): string | null =>
    reading === null || reading === undefined
      ? null
      : reading.length === 0
        ? "No skin segment crosses itself or another in this pose."
        : "Crossing segments: " +
          reading
            .map(
              (entry) =>
                `${entry.part} x ${entry.other} ${entry.triangles}/${entry.otherTriangles}`,
            )
            .join(", ");
  return {
    describe,
    /** Read the contact of `document` once `ticket` has held for the pause. */
    after: (document: IAutoMovieHumanBodyBasisDocument, ticket: number) =>
      new Promise<undefined>((resolve) => {
        schedule(() => {
          if (!props.isCurrent(ticket)) {
            resolve(undefined);
            return;
          }
          props
            .build(document, true)
            .then((model) => {
              props.dispose(model);
              const text = describe(model.crossings);
              if (props.isCurrent(ticket) && text !== null) props.report(text);
            })
            .catch((error: unknown) => {
              // a superseded reading reports nothing: the edit that replaced
              // it owns the status line
              if (props.isCurrent(ticket))
                props.report(
                  "Contact reading failed: " +
                    (error instanceof Error ? error.message : String(error)),
                );
            })
            .finally(() => resolve(undefined));
        }, props.delayMs ?? 600);
      }),
  };
}
