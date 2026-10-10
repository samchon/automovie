import { Vector3 } from "@automovie/engine";

/**
 * A current-domain area proxy for a hair population: its neutral acceptance
 * share times the domain's triangles measured on the current positions. Under
 * uniform area scaling this carries the mask's area fraction to the current
 * shape. Under nonuniform deformation it does not integrate the accepted
 * patch's local area scales; the neutral share is a construction approximation.
 * It is the fallback that `humanFaceHairDensity` reads when a population is
 * too small to measure its own neighbourhoods.
 *
 * Positions are metres and the result is square metres. Inputs are read only.
 */
export function measureHumanFaceHairDomainArea(props: {
  share: number;
  triangles: readonly number[];
  indices: readonly number[];
  current: readonly number[];
}): number {
  const { indices, current } = props;
  return (
    props.share *
    props.triangles.reduce((total, triangle) => {
      const points = indices
        .slice(3 * triangle, 3 * triangle + 3)
        .map((id) =>
          Vector3.create(
            current[id * 3],
            current[id * 3 + 1],
            current[id * 3 + 2],
          ),
        );
      return (
        total +
        Vector3.length(
          Vector3.cross(
            Vector3.subtract(points[1], points[0]),
            Vector3.subtract(points[2], points[0]),
          ),
        ) /
          2
      );
    }, 0)
  );
}
