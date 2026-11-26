import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanTravelCarExit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanSignature } from "../audit/AutoMovieMotionHumanSignature";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMaterialContact } from "../posture/HumanMaterialContact";
import { crossingClearance } from "../terrain/crossingClearance";

/** Position tolerance below the sill's top, metres. */
const ALLOWANCE: number = 0.001;

/** World up for an aperture whose author supplied no separate material. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Admit the resolved toes, feet and shanks crossing the sill. Evaluate the
 * authored transition at its lift and lower knots and interior seconds.
 */
export function verifyCarExitSill(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelCarExit.IParams>,
    "body" | "params" | "prop" | "start"
  >,
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  duration: number,
  marks: readonly number[],
): void {
  const { sill, through }: IAutoMovieMotionHumanTravelCarExit.IParams =
    context.params;
  const name: string =
    sill === undefined ? through.id : `${sill.subject}/${sill.point}`;
  const refuse = (reason: string): never => {
    throw new HumanRefusal({
      kind: "reach",
      axis: "sill",
      value: name,
      reason,
      fix: "raise or reposition the swing through the finite sill opening",
    });
  };
  const prepared: HumanMaterialContact.ISite | undefined =
    sill === undefined
      ? undefined
      : HumanMaterialContact.prepare(
          context.prop(sill.subject),
          sill.point,
          context.start,
        );
  if (sill !== undefined && prepared === undefined)
    return refuse(name + " declares no finite sill surface");
  const initial: HumanMaterialContact.IFace | undefined = prepared?.at(
    context.start,
  );
  const normal: IAutoMovieVector3 = Vector3.cross(through.across, UP);
  if (initial !== undefined) {
    const positions: IAutoMovieVector3[] = initial.outline.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.subtract(
          HumanMaterialContact.world(initial, point),
          through.at,
        ),
    );
    const depth: number[] = positions.map((p: IAutoMovieVector3): number =>
      Vector3.dot(p, normal),
    );
    const across: number[] = positions.map((p: IAutoMovieVector3): number =>
      Vector3.dot(p, through.across),
    );
    if (
      Quaternion.rotateVectorY(initial.frame.rotation, UP) < 1 - 1e-8 ||
      Math.abs(initial.frame.position.y - through.at.y) > ALLOWANCE ||
      Math.min(...depth) > ALLOWANCE ||
      Math.max(...depth) < -ALLOWANCE ||
      Math.min(...across) >= through.width / 2 ||
      Math.max(...across) <= -through.width / 2
    )
      return refuse(
        name + " is outside the selected aperture's level threshold",
      );
  }
  const read: ReturnType<typeof HumanMaterialContact.preparePosture> =
    HumanMaterialContact.preparePosture(
      context.body,
      crossingClearance.LOWER_LEGS,
    );
  const fallback: HumanMaterialContact.IFace = {
    frame: {
      position: through.at,
      rotation: AutoMovieEngineMath.quaternionFromBasis(through.across, UP, normal),
    },
    outline: [
      { x: -through.width / 2, y: 0, z: -ALLOWANCE / 2 },
      { x: through.width / 2, y: 0, z: -ALLOWANCE / 2 },
      { x: through.width / 2, y: 0, z: ALLOWANCE / 2 },
      { x: -through.width / 2, y: 0, z: ALLOWANCE / 2 },
    ],
  };
  let lowest: IAutoMovieMotionHumanContactWindow.IMaterial | undefined;
  let at: number = 0;
  for (const seconds of new Set([
    ...AutoMovieMotionHumanSignature.times(0, duration, 240),
    ...marks,
    duration,
  ])) {
    const face: HumanMaterialContact.IFace =
      prepared?.at(context.start + seconds) ?? fallback;
    const clearance: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
      read(posture(seconds), face);
    if (
      clearance !== undefined &&
      clearance.clearance < (lowest?.clearance ?? -ALLOWANCE)
    ) {
      lowest = clearance;
      at = seconds;
    }
  }
  if (lowest !== undefined)
    refuse(
      `${lowest.bone} crosses ${name} ${(-1000 * lowest.clearance).toFixed(1)} mm below its top at ${at.toFixed(3)} s`,
    );
}
