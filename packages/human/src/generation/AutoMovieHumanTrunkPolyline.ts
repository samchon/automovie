/** Operation-local arclength preparation for immutable trunk construction outlines. */
export namespace AutoMovieHumanTrunkPolyline {
  /** Prepare once while preserving the original sequential prefix sum and lookup arithmetic. */
  export function prepare(line: [number, number][]): (fraction: number) => [number, number] {
    if (line.length < 2) return (_fraction: number): [number, number] => line[0]!;
    const lengths: number[] = [0];
    for (let i: number = 1; i < line.length; i++)
      lengths.push(lengths[i - 1]! + Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1]));
    return (fraction: number): [number, number] => {
      const d: number = fraction * lengths[lengths.length - 1]!;
      let i: number = 0;
      while (i < line.length - 2 && lengths[i + 1]! < d) i++;
      const w: number = (d - lengths[i]!) / Math.max(1e-9, lengths[i + 1]! - lengths[i]!);
      return [line[i]![0] + w * (line[i + 1]![0] - line[i]![0]), line[i]![1] + w * (line[i + 1]![1] - line[i]![1])];
    };
  }
}
