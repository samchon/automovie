/**
 * One oriented source-cell frame in common Y-up/+Z-forward coordinates: row-major 3×3 columns contain two metre edge tangents and a dimensionless scaled unit normal. Area is cross-product magnitude, the doubled triangle area in square metres. Current-times-inverse-reference frames yield the numerical shading Jacobian; sqrt(current/reference area) transverse scaling is a shading convention, not tissue thickness or volume preservation. Producers own finite/nonsingular admission; flat typed arrays alone enforce no matrix size.
 *
 * @evidence contracts/common.md#principled-implementation Actual oriented tangent and transverse columns preserve the operands and doubled-area measure used by fixed-source cofactor normal transport.
 * @evidence contracts/common.md#clear-and-simple-design Matrix/area carry one cell frame while geometry admission, inversion and cofactor evaluation retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mixed column units are explicit and transverse scaling is not called clinical tissue mechanics, determinant volume conservation or a geometry certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose states row-major nine-entry contract, metre/dimensionless/square-metre domains and actual shading convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased frame record performs no cross product, inversion or normal transport; source/engine producers own those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fixed cell-frame sharing is transport behavior rather than memoization implemented by this carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no source query or task; actual transport calls own matrix arrays and scalar frame lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonCellFrame {
  /** Row-major 3x3 matrix of edge tangents and the scaled unit normal. */
  matrix: number[];

  /** Length of the tangents' cross product, square metres. */
  area: number;
}
