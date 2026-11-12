import type { IAutoMovieMark } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IMotionCaptureOverlays } from "./IMotionCaptureOverlays";

/** Colour of the drift kind: a violet no case overlay uses and the inspection reserves for nothing. */
const DRIFT: number = 0x7b4fa8;

/**
 * Turn a motion case's overlays into inspection marks: trails as polylines, targets as points, and drift samples as points flagged where their drift exceeds their limit.
 *
 * A case colours each overlay itself, and an inspection draws every mark of one kind in one colour and refuses two kinds in one colour, so a trail or target kind is its colour: `case/<rrggbb>`, labelled by the overlays drawn in it and the colour, such as `trail and target d04040`, short enough for a legend stamped on a still beside the colour's swatch. Drift samples are the kind `case/drift`, labelled `drift`, in violet `7b4fa8`; the samples within their limit form one mark and those beyond it a flagged one, which the inspection draws in its flag colour. Paths are `case/trail/<i>`, `case/target/<i>` and `case/drift/<i>/within` or `/beyond`, so the pattern `case` selects them all. Every mark is in world metres and unanchored. A trail of one point is drawn as a point, and an empty trail or drift set gives no mark.
 *
 * @param props The case's overlays.
 * @returns The trail marks, then the targets, then the drift.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each overlay's shape, the kind, label and colour rules and why, the flag rule, the paths, the frame and the degenerate cases.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/passes.md`: each kind of thing in one colour throughout a capture, a finding drawn where it was measured; a kind per colour keeps the case's own colours and obeys the inspection's colour law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Name each colour's kind, then one pass per overlay.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No colour is changed and the flag is the case's own limit, compared strictly.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the overlays' points.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure mapping of one case.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markMotionCaptureCase(
  props: IMotionCaptureOverlays,
): IAutoMovieMark[] {
  // A kind per colour, labelled by the overlays drawn in it.
  const uses: Map<number, Set<string>> = new Map();
  const use: (color: number, what: string) => void = (color: number, what: string): void => {
    const known: Set<string> | undefined = uses.get(color);
    if (known === undefined) uses.set(color, new Set([what]));
    else known.add(what);
  };
  for (const trail of props.trails) if (trail.points.length !== 0) use(trail.color, "trail");
  for (const target of props.targets) use(target.color, "target");
  const kind: (color: number) => Pick<IAutoMovieMark, "kind" | "label" | "color"> = (
    color: number,
  ): Pick<IAutoMovieMark, "kind" | "label" | "color"> => {
    const hex: string = color.toString(16).padStart(6, "0");
    return {
      kind: `case/${hex}`,
      label: `${[...uses.get(color)!].join(" and ")} ${hex}`,
      color,
    };
  };
  const flat: (points: readonly IAutoMovieVector3[]) => number[] = (
    points: readonly IAutoMovieVector3[],
  ): number[] => points.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]);

  const marks: IAutoMovieMark[] = [];
  props.trails.forEach(
    (trail: IMotionCaptureOverlays["trails"][number], index: number): void => {
      if (trail.points.length === 0) return;
      marks.push({
        path: `case/trail/${index}`,
        ...kind(trail.color),
        shape:
          trail.points.length === 1
            ? { type: "points", points: flat(trail.points) }
            : { type: "polyline", points: flat(trail.points), closed: false },
        flagged: false,
        anchor: null,
      });
    },
  );
  props.targets.forEach(
    (target: IMotionCaptureOverlays["targets"][number], index: number): void => {
      marks.push({
        path: `case/target/${index}`,
        ...kind(target.color),
        shape: { type: "points", points: flat([target.at]) },
        flagged: false,
        anchor: null,
      });
    },
  );
  props.drift.forEach(
    (set: IMotionCaptureOverlays["drift"][number], index: number): void => {
      for (const beyond of [false, true]) {
        const samples: IAutoMovieVector3[] = set.samples
          .filter(
            (sample: { at: IAutoMovieVector3; drift: number }): boolean =>
              sample.drift > set.limit === beyond,
          )
          .map((sample: { at: IAutoMovieVector3; drift: number }): IAutoMovieVector3 => sample.at);
        if (samples.length === 0) continue;
        marks.push({
          path: `case/drift/${index}/${beyond ? "beyond" : "within"}`,
          kind: "case/drift",
          label: "drift",
          color: DRIFT,
          shape: { type: "points", points: flat(samples) },
          flagged: beyond,
          anchor: null,
        });
      }
    },
  );
  return marks;
}
