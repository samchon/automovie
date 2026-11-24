import type {
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalStanceSupport } from "./physicalStanceSupport";

/**
 * The stance's centre-of-pressure law and its allocation of the support between
 * capture, the torso's moment and convergence (`physicalStanceBalance`).
 */
export namespace physicalStanceAllocation {
  /**
   * The centre-of-pressure law's command u = xi + k (xi - xi_ref), trimmed by
   * the integral's bias (Hof et al. 2005; Pratt et al., M2V2; Stephens 2011,
   * Eq. 5.31 for the bias): the pivot the pendulum's force is aimed through
   * when nothing trims it (`allocate`).
   */
  export function law(
    capture: IAutoMovieVector3,
    reference: IAutoMovieVector3,
    bias?: { x: number; z: number },
  ): IAutoMovieVector3 {
    return Vector3.add(
      Vector3.add(
        capture,
        Vector3.scale(
          Vector3.subtract(capture, reference),
          physicalStanceBalance.GAIN,
        ),
      ),
      { x: bias?.x ?? 0, y: 0, z: bias?.z ?? 0 },
    );
  }

  /**
   * Share the support between capture, the trunk and convergence, in that
   * order: the centre of pressure p is kept on the support and the centroidal
   * moment pivot u, through which the pendulum's force m omega^2 (c - u) is
   * aimed, may leave it, as linear momentum is kept before angular when both
   * cannot be (Lee and Goswami 2012). The capture point with the body's spin,
   * xi_eff = xi + omega k / (m g), moves as xi_eff' = omega (xi - p), so it is
   * the centre of pressure that holds it (Koolen et al., Corollary 3;
   * derived):
   *
   * 1. Capture: p is not behind xi_eff along its displacement from the reference,
   *    so xi_eff does not diverge while it is inside the support.
   * 2. Trunk: p is nearest u_law + delta, delta = (M_z, -M_x) / F_y the offset the
   *    trunk's moment asks of it from the pivot, on the shrunken polygon, or on
   *    the support itself once xi_eff has passed the shrunken edge, and then u
   *    = p - delta. On held feet a body has little posture freedom, a
   *    four-support body none, so the trunk's moment is part of holding the
   *    body and is served before convergence.
   * 3. Convergence: u_law = xi + k (xi - xi_ref) takes what is left, the term that
   *    is trimmed.
   *
   * 2b. In the band, xi_eff past the shrunken edge but inside the support,
   * where capture is at risk, convergence comes before the trunk, linear
   * momentum kept before angular as Lee and Goswami order them: u = u_law, and
   * p, nearest u_law + delta on the support, takes the trunk's offset only as
   * far as the room allows, the term that is trimmed. A pivot past p turns the
   * trunk, so it goes past p toward the excess only as far as the stance's hip
   * strategy reaches (`hip`); a stance without one keeps the order of rule 2,
   * the trunk's offset trimmed so the pivot does not fall inside the capture
   * point along the outward normal, u . n >= xi . n, as xi' = omega (xi - u)
   * would carry xi out (Hof et al. 2005).
   *
   * In every branch the pivot lies within the stance hips' hold of the centre
   * of pressure, |u - p| F_y no more than the room their caps leave about the
   * axis across the offset once their feet's forces are carried (`hipRoom`;
   * design-4017-edge, E1, rule 2): the moment the ground puts on the body
   * reaches the trunk through them.
   *
   * Past the support's edge, p sits at the edge nearest xi_eff. A body with a
   * hip strategy toward it (`hip`) sets the pivot's offset past p instead of
   * the trunk's servo: out along the excess while its trunk spins up, back
   * while it brakes (Hofmann, Popovic and Herr 2009; Pratt et al. 2006, the
   * flywheel model). Without one the trunk's moment is served as inside.
   *
   * @param input The capture point with spin, its reference and the law's
   *   command, world metres; the trunk's offset delta, metres; the shrunken
   *   polygon and the support, world metres; the hip strategy's signed pivot
   *   offset along an outward direction, metres, or undefined for none; and the
   *   farthest the pivot may lie from the centre of pressure along a horizontal
   *   direction, metres, absent for no bound.
   * @returns The centre of pressure, the pivot, and whether the command was
   *   trimmed.
   */
  export function allocate(input: {
    capture: IAutoMovieVector3;
    reference: IAutoMovieVector3;
    command: IAutoMovieVector3;
    offset: IAutoMovieVector3;
    shrunken: readonly IAutoMovieVector3[];
    support: readonly IAutoMovieVector3[];
    hip?: (direction: IAutoMovieVector3) => number | undefined;
    bound?: (direction: IAutoMovieVector3) => number;
  }): {
    pressure: IAutoMovieVector3;
    pivot: IAutoMovieVector3;
    clamped: boolean;
    strategy?: IAutoMovieVector3;
  } {
    const { capture, command, offset } = input;
    // Every branch keeps the pivot within the stance hips' hold of the centre
    // of pressure along the pivot's own direction from it (rule 2); the
    // branch past the support's edge that took the hip strategy names its
    // outward direction, along which the stance hips release the trunk
    // (design-4017-edge, E2: when xi_eff is beyond the true edge).
    const result = (
      pressure: IAutoMovieVector3,
      wanted: IAutoMovieVector3,
      strategy?: IAutoMovieVector3,
    ): {
      pressure: IAutoMovieVector3;
      pivot: IAutoMovieVector3;
      clamped: boolean;
      strategy?: IAutoMovieVector3;
    } => {
      const dx: number = wanted.x - pressure.x;
      const dz: number = wanted.z - pressure.z;
      const length: number = Math.hypot(dx, dz);
      const most: number =
        input.bound && length > 1e-12
          ? Math.max(0, input.bound({ x: dx / length, y: 0, z: dz / length }))
          : Infinity;
      const pivot: IAutoMovieVector3 =
        length > most
          ? {
              x: pressure.x + (dx * most) / length,
              y: wanted.y,
              z: pressure.z + (dz * most) / length,
            }
          : wanted;
      return {
        pressure,
        pivot,
        clamped: Math.hypot(pivot.x - command.x, pivot.z - command.z) > 1e-9,
        ...(strategy ? { strategy } : {}),
      };
    };
    const edge: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      input.support,
      capture,
    );
    const gap: number = Math.hypot(capture.x - edge.x, capture.z - edge.z);
    if (input.support.length >= 3 && gap > 1e-9) {
      const direction: IAutoMovieVector3 = {
        x: (capture.x - edge.x) / gap,
        y: 0,
        z: (capture.z - edge.z) / gap,
      };
      const strategy: number | undefined = input.hip?.(direction);
      if (strategy !== undefined) {
        const along: number =
          (command.x - edge.x) * direction.x +
          (command.z - edge.z) * direction.z;
        const shift: number =
          strategy >= 0 ? Math.min(strategy, Math.max(0, along)) : strategy;
        return result(
          edge,
          Vector3.add(edge, Vector3.scale(direction, shift)),
          direction,
        );
      }
      return result(edge, Vector3.subtract(edge, offset));
    }
    const inner: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      input.shrunken,
      capture,
    );
    const sheltered: boolean =
      Math.hypot(capture.x - inner.x, capture.z - inner.z) <= 1e-9;
    const room: readonly IAutoMovieVector3[] =
      input.shrunken.length >= 3 && sheltered ? input.shrunken : input.support;
    const away: IAutoMovieVector3 = Vector3.subtract(capture, input.reference);
    const length: number = Math.hypot(away.x, away.z);
    const admissible: IAutoMovieVector3[] =
      room.length >= 3 && length > 1e-9
        ? physicalStanceSupport.clip(room, capture, {
            x: away.x / length,
            y: 0,
            z: away.z / length,
          })
        : [...room];
    const wanted: IAutoMovieVector3 = Vector3.add(command, offset);
    const pressure: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      admissible.length > 0 ? admissible : room,
      wanted,
    );
    // In the band, past the shrunken edge and inside the support, capture is
    // at risk: convergence goes before the trunk, the pivot keeping the law's
    // command and the trunk's offset trimmed to the room left, as far past
    // the centre of pressure as the hip strategy toward the excess reaches; a
    // stance without one keeps the order inside (rule 2b).
    const out: number = Math.hypot(capture.x - inner.x, capture.z - inner.z);
    const outward: IAutoMovieVector3 | undefined =
      !sheltered && out > 1e-9
        ? {
            x: (capture.x - inner.x) / out,
            y: 0,
            z: (capture.z - inner.z) / out,
          }
        : undefined;
    const strategy: number | undefined = outward
      ? input.hip?.(outward)
      : undefined;
    if (outward && strategy !== undefined) {
      const excess: number =
        (command.x - pressure.x) * outward.x +
        (command.z - pressure.z) * outward.z;
      const allowed: number =
        strategy >= 0 ? Math.min(strategy, excess) : strategy;
      return result(
        pressure,
        excess > allowed
          ? Vector3.subtract(command, Vector3.scale(outward, excess - allowed))
          : command,
      );
    }
    // Without one, the trunk's offset in the band is trimmed so the pivot
    // stays on the capture point's outer side, u . n >= xi . n, the condition
    // under which xi' = omega (xi - u) does not carry xi out (Hof et al. 2005;
    // Koolen et al., Corollary 3).
    const pivot: IAutoMovieVector3 = Vector3.subtract(pressure, offset);
    const inside: number = outward
      ? (capture.x - pivot.x) * outward.x + (capture.z - pivot.z) * outward.z
      : 0;
    return result(
      pressure,
      inside > 0 ? Vector3.add(pivot, Vector3.scale(outward!, inside)) : pivot,
    );
  }
}
