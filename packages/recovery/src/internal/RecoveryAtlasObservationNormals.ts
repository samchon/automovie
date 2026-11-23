import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryAtlasObservationInput,
} from "@automovie/interface";

/** Compute the original unnormalized source face cross products in index order. */
export function RecoveryAtlasObservationNormals(
  input: IAutoMovieRecoveryAtlasObservationInput,
): number[][] {
  return input.triangles.map(
    (triangle: readonly [number, number, number]): number[] => {
      const a: Readonly<AutoMovieVector3Tuple> = input.verticesMm[triangle[0]]!,
        b: Readonly<AutoMovieVector3Tuple> = input.verticesMm[triangle[1]]!,
        c: Readonly<AutoMovieVector3Tuple> = input.verticesMm[triangle[2]]!;
      const u: number[] = b.map((x: number, k: number): number => x - a[k]!),
        v: number[] = c.map((x: number, k: number): number => x - a[k]!);
      return [
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ];
    },
  );
}
