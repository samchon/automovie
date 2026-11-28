import { AutoMovieEngineSolidVector } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/*
 * Admit the indexed triangle before measuring the registered millimetre face.
 * Both the cross product and its half-length must be representable.
 */
export function measureRecoveryChartFace(
  vertices: readonly Readonly<AutoMovieVector3Tuple>[],
  triangle: readonly [number, number, number],
  fail: (reason: string) => never,
  invalidArea: string,
  invalidAddress: string = "triangle addresses are invalid",
): IRecoveryMeasuredChartFace {
  if (
    triangle.length !== 3 ||
    new Set(triangle).size !== 3 ||
    triangle.some(
      (id: number): boolean =>
        !Number.isSafeInteger(id) || id < 0 || id >= vertices.length,
    )
  )
    fail(invalidAddress);
  const a: Readonly<AutoMovieVector3Tuple> = vertices[triangle[0]]!,
    b: Readonly<AutoMovieVector3Tuple> = vertices[triangle[1]]!,
    c: Readonly<AutoMovieVector3Tuple> = vertices[triangle[2]]!;
  const normal: AutoMovieVector3Tuple = AutoMovieEngineSolidVector.cross(
    AutoMovieEngineSolidVector.sub(b, a),
    AutoMovieEngineSolidVector.sub(c, a),
  );
  const length: number = AutoMovieEngineSolidVector.norm(normal);
  const areaMm2: number = length / 2;
  if (!Number.isFinite(length) || !(areaMm2 > 0)) fail(invalidArea);
  return { normal, length, areaMm2 };
}

interface IRecoveryMeasuredChartFace {
  normal: AutoMovieVector3Tuple;
  length: number;
  areaMm2: number;
}
