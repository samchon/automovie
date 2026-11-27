import type {
  IAutoMovieMark,
  IAutoMovieMotionHumanMotionCaptureOverlays,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Turn a motion case's overlays into inspection marks: trails as polylines,
 * targets as points, and drift samples as points flagged where their drift
 * exceeds their limit.
 *
 * A case colours each overlay itself, and an inspection draws every mark of one
 * kind in one colour and refuses two kinds in one colour, so a trail or target
 * kind is its colour: `case/<rrggbb>`, labelled by the overlays drawn in it and
 * the colour, such as `trail and target d04040`, short enough for a legend
 * stamped on a still beside the colour's swatch. Drift samples are the kind
 * `case/drift`, labelled `drift`, in violet `7b4fa8`; the samples within their
 * limit form one mark and those beyond it a flagged one, which the inspection
 * draws in its flag colour. Paths are `case/trail/<i>`, `case/target/<i>` and
 * `case/drift/<i>/within` or `/beyond`, so the pattern `case` selects them all.
 * Every mark is in world metres and unanchored. A trail of one point is drawn
 * as a point, and an empty trail or drift set gives no mark.
 * Parameter props: The case's overlays.
 * Returns: The trail marks, then the targets, then the drift.
 */
export function markMotionCaptureCase(
  props: IAutoMovieMotionHumanMotionCaptureOverlays,
): IAutoMovieMark[] {
  // A kind per colour, labelled by the overlays drawn in it.
  const uses: Map<number, Set<string>> = new Map();
  const use: (color: number, what: string) => void = (
    color: number,
    what: string,
  ): void => {
    const known: Set<string> | undefined = uses.get(color);
    if (known === undefined) uses.set(color, new Set([what]));
    else known.add(what);
  };
  for (const trail of props.trails)
    if (trail.points.length !== 0) use(trail.color, "trail");
  for (const target of props.targets) use(target.color, "target");
  const kind: (
    color: number,
  ) => Pick<IAutoMovieMark, MarkMotionCaptureCaseKind> = (
    color: number,
  ): Pick<IAutoMovieMark, MarkMotionCaptureCaseKindResult> => {
    const hex: string = color.toString(16).padStart(6, "0");
    return {
      kind: `case/${hex}`,
      label: `${[...uses.get(color)!].join(" and ")} ${hex}`,
      color,
    };
  };
  const flat: (points: readonly IAutoMovieVector3[]) => number[] = (
    points: readonly IAutoMovieVector3[],
  ): number[] =>
    points.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]);

  const marks: IAutoMovieMark[] = [];
  props.trails.forEach(
    (
      trail: IAutoMovieMotionHumanMotionCaptureOverlays["trails"][number],
      index: number,
    ): void => {
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
    (
      target: IAutoMovieMotionHumanMotionCaptureOverlays["targets"][number],
      index: number,
    ): void => {
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
    (
      set: IAutoMovieMotionHumanMotionCaptureOverlays["drift"][number],
      index: number,
    ): void => {
      for (const beyond of [false, true]) {
        const samples: IAutoMovieVector3[] = set.samples
          .filter(
            (sample: IMarkMotionCaptureCaseSamplesSample): boolean =>
              sample.drift > set.limit === beyond,
          )
          .map(
            (sample: IMarkMotionCaptureCaseSamplesSample2): IAutoMovieVector3 =>
              sample.at,
          );
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
/*
 * Colour of the drift kind: a violet no case overlay uses and the inspection
 * reserves for nothing.
 */
const DRIFT: number = 0x7b4fa8;

/*
 * The record of `IMarkMotionCaptureCaseSamplesSample2`'s site.
 */
type IMarkMotionCaptureCaseSamplesSample2 = {
  at: IAutoMovieVector3;
  drift: number;
};

/*
 * The record of `IMarkMotionCaptureCaseSamplesSample`'s site.
 */
type IMarkMotionCaptureCaseSamplesSample = {
  at: IAutoMovieVector3;
  drift: number;
};

/*
 * The alternatives of `MarkMotionCaptureCaseKindResult`'s site.
 */
type MarkMotionCaptureCaseKindResult = "kind" | "label" | "color";

/*
 * The alternatives of `MarkMotionCaptureCaseKind`'s site.
 */
type MarkMotionCaptureCaseKind = "kind" | "label" | "color";
