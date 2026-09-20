/**
 * A measurement rule the body basis evaluates on its shaped surface.
 *
 * Rules are data so the measuring code holds no anatomy: each one names the
 * landmarks that place it and the way a value is read. A `girth` cuts the
 * surface with planes along the segment from `from` to `to` at the fractions
 * `range` covers, perpendicular to the segment (or horizontal when `horizontal`
 * is set, which is what ISO 7250-1 asks of trunk girths), keeps the closed
 * section loop nearest the segment point, and reports the largest or smallest
 * perimeter found. A `distance` is the straight distance between two
 * landmarks. A `height` is the vertical distance from the surface's lowest
 * point to the mean of its clip-ring vertices, the body's stand-in for stature
 * while the head belongs to another basis. A `breadth` is the X extent of the
 * section loop found by a girth rule, which is how a front-chest width is read
 * on a mesh that has no chest-corner landmarks.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Names each rule by the public measurement definition it follows so a millimetre figure has a stated meaning.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Types the three rule kinds and the landmark, plane and extremum parameters the evaluator reads.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMeasurement =
  | {
      kind: "girth" | "breadth";
      /** Landmark ids of the segment the sections walk along. */
      from: string;
      to: string;
      /** Fractions of the segment, inclusive, sampled at `steps` evenly spaced planes. */
      range: [number, number];
      steps: number;
      /** Take the largest or the smallest perimeter over the sampled planes. */
      pick: "max" | "min";
      /** Cut horizontally (trunk girths) instead of perpendicular to the segment. */
      horizontal: boolean;
    }
  | {
      kind: "distance";
      from: string;
      to: string;
    }
  | {
      kind: "height";
    };
