import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Borrowed collision-advice inputs: finite positive kilograms, finite world metres/second velocity and finite restitution, hardness and penetrability in [0,1]. Material traits drive a deterministic qualitative heuristic.
 *
 * @evidence contracts/common.md#principled-implementation resolveImpact validates exactly these values before normal impulse arithmetic and its material/speed classifications; the record deliberately omits geometry and angular state.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the minimum normal-response inputs together instead of introducing a full rigid-body simulation model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hardness/penetrability are dimensionless advisory controls, not measured constitutive fracture laws; no fixture-specific material behavior belongs to this record.
 * @evidence contracts/common.md#meaningful-documentation Members state positive finite mass, velocity units, [0,1] ranges and what each material trait influences.
 * @evidence contracts/performance.md#efficient-algorithms The type has constant-size input storage and no algorithm; collision producer cost is constant normal-response arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work The same borrowed body inputs serve admission and impact calculation, with no duplicate material lookup or body-state cache in the type.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns body and velocity lifetime; this representation retains no collider, physical world or task handle.
 */
export interface IAutoMovieImpactBody {
  /** Finite strictly positive kilograms, admitted by resolveImpact. */
  mass: number;

  /** Borrowed finite world metres/second vector. */
  velocity: IAutoMovieVector3;

  /** Finite [0,1] fraction of returned normal closing speed. */
  restitution: number;

  /** Finite [0,1] heuristic rigidity trait, with one denoting hard material. */
  hardness: number;

  /** Finite [0,1] heuristic ease-of-piercing trait; no constitutive material law is implied. */
  penetrability: number;
}
