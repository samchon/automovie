import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeConvexCell } from "../core";
import { ArmourCell } from "./ArmourCell";
import type { ArmourProfile } from "./ArmourProfile";

/**
 * Hollow forearm/shank guards and a cuff with a coarse mitten/thumb defense.
 *
 * A hand's sole radius input is its cuff's forearm radius, not an invented palm
 * or thumb measurement. The hand regions use explicit coarse envelope fractions
 * and one rigid piece; their proportions are not specimen-exact anatomy.
 * Unfitted elliptical guards/cuffs share one inner scale, retaining a minimum
 * authored normal gauge instead of claiming uniform specimen thickness.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States model metres/+Y course, original unfitted extrema, actual fitted radial cavity, gauntlet cuff fitting site and authored rigid hand-domain limits.
 * @evidence contracts/development/implementation.md#principled-implementation Fitted radial convex wall cells have an inner plane tangent to the admitted limb radius and an outer plane one exact sourced plate gauge beyond it. Unfitted ellipses retain their outer course and share inner factor 1-wall/minimum actual face support, so adjacent inner corners meet and every face retains at least the authored gauge. Y endpoints retain measured segment length. Gauntlet cuffs continue into actual mitten/thumb regions with declared coarse hand limits.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare one bounded radial lattice, emit the actual tube/cuff, then build the gauntlet's hand and thumb through the shared interval-panel owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No filled cylinder, hidden body solid, extra hand measure, reconstructed elbow reinforce or articulated finger supplies the geometry; insufficient positive wall/working resolution refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen coarse radial cells and, for a gauntlet, ten panels. A fitted circle prepares one radial cell; an unfitted ellipse prepares its eight distinct half-turn classes, without a thin-wall resolution loop.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One prepared actual cell and exact Y rotations serve circular sectors, while ellipses share only exact half turns. Core reuses its hull, mesh and local mass without re-admitting each placement.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh corners and cell records without retaining input, completed geometry, source buffers or external handles.
 */
export function ArmourLimb(
  profile: ArmourProfile.IProfile,
): readonly ArmourProfile.ICell[] {
  const cells: ArmourProfile.ICell[] = [];
  const prepared: Map<number, ArmourProfile.ICell> = new Map();
  const rx: number = profile.outer.x / 2;
  const rz: number = profile.outer.z / 2;
  const half: number = profile.outer.y / 2;
  const t: number = profile.wall;
  const cavity: number | undefined = profile.fitted
    ? profile.inner.x / 2
    : undefined;
  const count: number = 16;
  const end: number = profile.kind === "gauntlet" ? -half / 3 : half;
  const prefix: string = profile.kind === "gauntlet" ? "cuff" : "guard";
  const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const lattice: Map<number, readonly IAutoMovieVector3[]> = new Map();
  for (
    let canonical: number = 0;
    canonical < (profile.fitted ? 1 : count / 2);
    canonical++
  ) {
    const a: number = (2 * Math.PI * canonical) / count;
    const b: number = (2 * Math.PI * (canonical + 1)) / count;
    lattice.set(canonical, [
      point(a, -half),
      point(a, end),
      point(b, end),
      point(b, -half),
    ]);
  }
  const minimum: number | undefined = profile.fitted
    ? undefined
    : ArmourCell.minimumDistance(lattice.values(), centre);
  for (let index: number = 0; index < count; index++) {
    const canonical: number = profile.fitted ? 0 : index % (count / 2);
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      (-360 * (index - canonical)) / count,
    );
    if (!prepared.has(canonical)) {
      const cell: ArmourProfile.ICell = ArmourCell.radial(
        prefix,
        lattice.get(canonical)!,
        centre,
        t,
        cavity,
        "axis",
        minimum,
      );
      prepared.set(canonical, {
        ...cell,
        prepared: ArchetypeConvexCell.of(cell.points),
      });
    }
    cells.push({
      ...prepared.get(canonical)!,
      id: `${prefix}-${index}`,
      rotation,
    });
  }
  if (profile.kind === "gauntlet") {
    hand("mitten", -rx, rx / 2, -half / 3, half, -rz, rz);
    hand("thumb", rx / 2, rx, -half / 3, half / 3, -rz / 2, rz / 2);
    if (profile.model === "met23256")
      return cells.map(
        (cell: ArmourProfile.ICell): ArmourProfile.ICell =>
          cell.id.startsWith("cuff")
            ? cell
            : {
                id: cell.id,
                points: cell.points.map(
                  (p: IAutoMovieVector3): IAutoMovieVector3 => ({
                    ...p,
                    x: -p.x,
                  }),
                ),
              },
      );
  }
  return cells;

  /** Exact named outer ellipse; quadrants retain the original measured extrema. */
  function point(angleValue: number, y: number): IAutoMovieVector3 {
    return { x: rx * Math.cos(angleValue), y, z: rz * Math.sin(angleValue) };
  }

  /** Five disjoint rectangular walls leave a real cuff-side opening. */
  function hand(
    id: string,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
  ): void {
    cells.push(
      ArmourCell.box(
        `${id}-front`,
        { x: x0, y: y0, z: z1 - t },
        { x: x1, y: y1, z: z1 },
      ),
      ArmourCell.box(
        `${id}-back`,
        { x: x0, y: y0, z: z0 },
        { x: x1, y: y1, z: z0 + t },
      ),
      ArmourCell.box(
        `${id}-left`,
        { x: x0, y: y0, z: z0 + t },
        { x: x0 + t, y: y1, z: z1 - t },
      ),
      ArmourCell.box(
        `${id}-right`,
        { x: x1 - t, y: y0, z: z0 + t },
        { x: x1, y: y1, z: z1 - t },
      ),
      ArmourCell.box(
        `${id}-tip`,
        { x: x0 + t, y: y1 - t, z: z0 + t },
        { x: x1 - t, y: y1, z: z1 - t },
      ),
    );
  }
}
