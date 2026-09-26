/**
 * One correction per index for the gap between the anchored model and the
 * detector on the model's own render, shared by every subject.
 *
 * An index read on the photograph comes from the detector's landmarks; the
 * same index on the model comes from the landmark anchors on its surface.
 * On a render of the model the detector does not land where the anchors
 * sit (it puts the inner lip landmark above the lip's visible edge on a
 * render), so the two instruments differ. That gap belongs to the detector
 * between renders and photographs, not to a person, so it is taken once per
 * index: the median over the subjects that have both readings of the
 * anchored value less the render's, zero for an index no subject has.
 * Correcting each subject by its own gap would repay one render's quirks
 * one person at a time. Pure.
 */
export function faceRenderCorrection(
  ids: readonly string[],
  subjects: readonly {
    model: Record<string, number | null>;
    rendered: Record<string, number | null>;
  }[],
): Record<string, number> {
  return Object.fromEntries(
    ids.map((id) => {
      const gaps = subjects
        .filter(
          (one) =>
            typeof one.model[id] === "number" &&
            typeof one.rendered[id] === "number",
        )
        .map((one) => one.model[id]! - one.rendered[id]!)
        .sort((a, b) => a - b);
      const n = gaps.length;
      return [
        id,
        n === 0
          ? 0
          : n % 2 === 1
            ? gaps[(n - 1) / 2]!
            : (gaps[n / 2 - 1]! + gaps[n / 2]!) / 2,
      ];
    }),
  );
}
