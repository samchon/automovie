import type {
  AutoMovieVector2Tuple,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

/**
 * Resolve original material features once, taking only their directions from
 * placement. Shift is a longitudinal displacement in mm and follows the
 * window-length ratio; radial amplitude never changes it. This is an
 * independent new native feature law with a fixed invocation axis/turn, not a
 * nonlinear ambient pullback.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Original windows/control nets and placed directions have distinct owners; one declared site scale sets radial height while the material-window ratio sets longitudinal shift.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure pass returns the exact definitions shared by root targets, full source leaves and their reflected consumers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not read an already transported window as original material data; missing placed directions, nonpositive scales/windows and nonfinite arithmetic are refused.
 * @evidence contracts/development/common.md#meaningful-documentation Names physical units, fixed-direction scope and the distinction between height and shift.
 * @evidence contracts/development/implementation.md#efficient-algorithms One placed-name map and one pass over original control arrays use linear work/storage in features plus controls.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrowed control arrays remain unchanged when their owning ratio is one; callers share the resolved result for the whole invocation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned bounded feature list and changed arrays; no global cache or process retains them.
 */
export namespace AutoMovieHumanNativeFeatureLaw {
  /** Resolve placed directions and scale original material features. */
  export function resolve(
    original: readonly IAutoMovieLoftRelief[],
    placed: readonly IAutoMovieLoftRelief[],
    scale: (feature: IAutoMovieLoftRelief) => AutoMovieVector2Tuple,
    station: (s: number) => number,
  ): IAutoMovieLoftRelief[] {
    const directions: Map<string, IAutoMovieLoftRelief> = new Map(
      placed.map(
        (net: IAutoMovieLoftRelief): [string, IAutoMovieLoftRelief] => [
          net.name,
          net,
        ],
      ),
    );
    return original.map((net: IAutoMovieLoftRelief): IAutoMovieLoftRelief => {
      const frame: IAutoMovieLoftRelief | undefined = directions.get(net.name);
      if (frame === undefined)
        throw new Error("native placed feature directions absent: " + net.name);
      const [a, b]: AutoMovieVector2Tuple = scale(net);
      const window: [number, number] = [
        station(net.stations[0]),
        station(net.stations[1]),
      ];
      const along: number =
        (window[1] - window[0]) / (net.stations[1] - net.stations[0]);
      const amplitude: number = Math.sqrt(a * b);
      if (
        ![
          a,
          b,
          along,
          amplitude,
          ...window,
          ...frame.axis,
          ...(frame.turn ?? []),
        ].every(Number.isFinite) ||
        !(a > 0 && b > 0 && along > 0 && Math.hypot(...frame.axis) > 0)
      )
        throw new Error(
          "native feature scale/window/direction is not admissible: " +
            net.name,
        );
      return {
        ...net,
        stations: window,
        axis: frame.axis,
        ...(frame.turn === undefined ? {} : { turn: frame.turn }),
        heights:
          amplitude === 1
            ? net.heights
            : net.heights.map((height: number): number => height * amplitude),
        ...(net.shift === undefined
          ? {}
          : {
              shift:
                along === 1
                  ? net.shift
                  : net.shift.map((shift: number): number => shift * along),
            }),
      };
    });
  }
}
