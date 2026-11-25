import type {
  IAutoMovieFootfallPattern,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { physicalSupportPoint } from "./physicalSupportPoint";

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/**
 * The stance's weighted objective (`physicalStanceBalance`): the momentum, yaw
 * and centre-of-pressure weights and the centre-of-pressure command row.
 */
export namespace physicalStancePressure {
  /**
   * IHMC's weighted whole-body objective over the contact wrench
   * (`AutoMovieXpbdWorld.IObjective`), the centre of pressure command's foot
   * named by its endpoint bone, all the stance's when absent.
   */
  export interface IObjective {
    /** Each axis's weight on the force's residual, world x, y and z. */
    force: IAutoMovieVector3;

    /** The yaw rate command's centre of mass and weight, when selected. */
    yaw?: { center: IAutoMovieVector3; weight: number };

    /** The centre of pressure command, when there is one. */
    pressure?: { point: IAutoMovieVector3; weight: number; bone?: string };
  }

  /**
   * Zulu's linear momentum rate weight, (0.5, 0.5, 0.02) in IHMC's x, y and z
   * (develop `ZuluMomentumOptimizationSettings` l.19, also its recovery weight,
   * `MomentumOptimizationSettings.getRecoveryLinearMomentumWeight` l.21-24),
   * world x and z horizontal and y up; the vertical row is selected, as
   * `controlHeightWithMomentum` is true (`WalkingControllerParameters`
   * l.817-819, `LinearMomentumRateControlModule` l.420).
   */
  export const BIPED_MOMENTUM_WEIGHT: Readonly<IAutoMovieVector3> = {
    x: 0.5,
    y: 0.02,
    z: 0.5,
  };

  /**
   * Zulu's yaw angular momentum rate weight (`ZuluMomentumOptimizationSettings`
   * l.21), selected while a foot swings
   * (`ZuluWalkingControllerParameters.minimizeAngularMomentumRateZDuringSwing`
   * l.135-137, `LinearMomentumRateControlModule` l.421).
   */
  export const BIPED_YAW_WEIGHT: number = 0.1;

  /**
   * The centre of pressure command's weight on both rows
   * (`CenterOfPressureCommandCalculator.CenterOfPressureObjectiveWeight`,
   * develop l.39).
   */
  export const CENTER_OF_PRESSURE_WEIGHT: number = 15.0;

  /**
   * IHMC's centre of pressure command for a biped
   * (`CenterOfPressureCommandCalculator.computeCenterOfPressureCommand`,
   * develop l.52-101): with one foot in contact, the command on that foot's
   * contacts; with two, on the foot the desired centre of pressure lies inside
   * of and to its outer side (left of the left sole, right of the right,
   * l.73-88), else on both; with none, no command (weight zero, l.97-101). The
   * weight is `CenterOfPressureObjectiveWeight` (l.39). The sole frames face +z
   * as the authored stance does, so the left one is the foot of the larger x.
   *
   * @param outlines The planted stance limbs and their outlines, world metres.
   * @param planted The planted poses of the stance limbs' carriers.
   * @param point The ICP controller's desired centre of pressure, world metres.
   * @returns The command, or none.
   */
  function pressureCommand(
    outlines: readonly { limb: Limb; outline: IAutoMovieVector3[] }[],
    planted: Readonly<Record<string, IAutoMovieRigidTransform>>,
    point: IAutoMovieVector3,
  ): { pressure?: NonNullable<IObjective["pressure"]> } {
    if (outlines.length === 0) return {};
    const command = (
      bone?: string,
    ): { pressure: NonNullable<IObjective["pressure"]> } => ({
      pressure: {
        point,
        weight: CENTER_OF_PRESSURE_WEIGHT,
        ...(bone !== undefined ? { bone } : {}),
      },
    });
    if (outlines.length === 1) return command(outlines[0]!.limb.bone);
    const soles = outlines.map(
      (entry: { limb: Limb; outline: IAutoMovieVector3[] }) => ({
        entry,
        origin: physicalSupportPoint(
          planted[entry.limb.bone]!,
          entry.limb.localPoint,
        ),
      }),
    );
    // Left first, as `RobotSide.values` lists the sides (l.75).
    soles.sort((a, b): number => b.origin.x - a.origin.x);
    for (const [index, sole] of soles.entries()) {
      const outward: number =
        (index === 0 ? 1 : -1) * (point.x - sole.origin.x);
      const nearest: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
        sole.entry.outline,
        point,
      );
      if (outward > 0 && nearest.x === point.x && nearest.z === point.z)
        return command(sole.entry.limb.bone);
    }
    return command();
  }

  /**
   * The biped's weighted objective: IHMC's controllers ask the whole-body solve
   * for their linear momentum rate, aimed through the pivot (develop
   * `LinearMomentumRateControlModule.computeDesiredLinearMomentumRateOfChange`
   * l.603-628), as weighted objectives over the contact wrench rather than a
   * moment (`AutoMovieXpbdWorld.IObjective`); the trunk's orientation stays the
   * root task's spin row, its own task.
   *
   * @param input The centre of mass, whether a limb swings, the planted
   *   outlines and poses, and the controller's centre of pressure.
   * @returns The objective's weights and rows.
   */
  export function objective(input: {
    center: IAutoMovieVector3;
    swinging: boolean;
    outlines: readonly { limb: Limb; outline: IAutoMovieVector3[] }[];
    planted: Readonly<Record<string, IAutoMovieRigidTransform>>;
    point: IAutoMovieVector3;
  }): IObjective {
    return {
      force: BIPED_MOMENTUM_WEIGHT,
      ...(input.swinging
        ? { yaw: { center: input.center, weight: BIPED_YAW_WEIGHT } }
        : {}),
      ...pressureCommand(input.outlines, input.planted, input.point),
    };
  }
}
