import { Vector3 } from "@automovie/engine";

/**
 * The area a hair population grows on, on the face as it now stands: the
 * share of the growth domain its roots' own acceptance covers, times the
 * domain's triangles measured on the current positions. The share is measured
 * on the neutral domain, where candidates are uniform, and the area on the
 * current shape, so a larger head grows the same population on more scalp.
 * It is the fallback that `humanFaceHairDensity` reads when a population is
 * too small to measure its own neighbourhoods.
 *
 * Positions are metres and the result is square metres. Inputs are read only.
 *
 * @evidence contracts/common.md#principled-implementation The area of a triangle is half the length of the cross product of two edges, so the sum over the domain's triangles on the current positions is the domain's area, and the accepted share of a uniform candidate stream estimates the fraction of that area the masks leave; the product is the area the population occupies. The share is an estimate from the sampled candidates, not an exact integral of the masks.
 * @evidence contracts/common.md#clear-and-simple-design One pure function of the share, the domain triangles, the resident indices and the current positions, extracted from the builder so its stages read in order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a subject or shape; the area is measured, not looked up.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two measurements taken on different shapes and why, who reads the result and the units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures an area and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres in the head frame of the evaluated face and the result is square metres; the share is dimensionless and nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function.
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
