import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSupportRootDrop } from "./physicalSupportRootDrop";
import { planPhysicalFloorSupportTargets } from "./planPhysicalFloorSupportTargets";
import type { planPhysicalSupportTargets } from "./planPhysicalSupportTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";

/** Fit world support intent in the measured floating-base frame. Reach-derived lowering remains a separate root motor request; no lowered virtual root is passed off as the actual stance frame. */
export function planPhysicalBalanceTargets(input: {
  /** Actual provider and bounded balance IK policy. */ profile: P;
  /** Owned endpoint chains, independent of species. */ pattern: IAutoMovieFootfallPattern;
  /** Coherent motor intent before balance fitting. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Actual simultaneous root pose. */ root: {
    bone: string;
    pose: P.ITransform;
  };
  /** Independent authored/recovery root intent used only to derive its lowering request. */ intent?: P.ITransform;
  /** Recovery and planted world endpoint goals. */ goals: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /** Actual stance owners; swinging/reserved endpoints are omitted. */ planted: readonly string[];
  /** World floor height. */ floor: number;
  /** Root-position intent budget, metres. */ maximumRootDrop: number;
  /** Existing balance update budget. */ iterations: number;
  /** Existing endpoint/floor tolerance, metres. */ tolerance: number;
}): ReturnType<typeof planPhysicalSupportTargets> {
  const original: P.ITransform = input.targets[input.root.bone]!;
  const targets: Record<string, P.ITransform> = rebasePhysicalTargets(
    input.targets,
    input.root.bone,
    input.root.pose,
  );
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    input.pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
      ): [string, IAutoMovieVector3] => [
        limb.bone,
        input.goals[limb.bone] ??
          physicalSupportPoint(input.targets[limb.bone]!, limb.localPoint),
      ],
    ),
  );
  const rootDrop: number = physicalSupportRootDrop({
    ...input,
    targets: rebasePhysicalTargets(
      input.targets,
      input.root.bone,
      input.intent ?? original,
    ),
    goals,
  });
  const fitted: ReturnType<typeof planPhysicalFloorSupportTargets> =
    planPhysicalFloorSupportTargets({
      ...input,
      targets,
      goals,
      endpointHeights: Object.fromEntries(
        input.planted.map((bone: string): [string, number] => [
          bone,
          goals[bone]!.y,
        ]),
      ),
      maximumRootDrop: 0,
      passes: 1,
    });
  return { targets: fitted.targets, residuals: fitted.residuals, rootDrop };
}
