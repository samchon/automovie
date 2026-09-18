import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import { contactMask } from "./contactMask";

/**
 * The stance detection + pinning stage of {@link plantStanceFeet}: judge every
 * frame's feet against the ground height source, group contiguous contact into
 * stance runs, and pin each run to its start contact. Returns the plants plus
 * the per-frame solve targets the re-key stage consumes.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases Groups touching samples into explicit planted intervals and releases.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Converts stance runs into stable support targets on the declared ground.
 * @author Samchon
 */
export const pinStanceTargets = (props: {
  /** Legs whose feet are planted. */
  legs: readonly IAutoMovieFootLeg[];
  /** Per-frame FK bone lookups. */
  resolved: ReadonlyArray<
    ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
  >;
  /** Frame times, parallel to `resolved`. */
  times: readonly number[];
  /** Ground height at a plan position. */
  groundAt: (x: number, z: number) => number;
  /** Contact tolerance above the ground counted as stance. */
  tolerance: number;
  /** Prior beat's authoritative opening pin per foot, in model space. */
  openingTargets?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
}): {
  plants: IAutoMovieFootPlant[];
  targets: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>>;
} => {
  const { legs, resolved, times, groundAt, tolerance } = props;
  const plants: IAutoMovieFootPlant[] = [];
  const targets = times.map(
    () => new Map<AutoMovieHumanoidBone, IAutoMovieVector3>(),
  );

  for (const leg of legs) {
    const contact = contactMask({
      effector: leg.foot,
      resolved,
      groundAt,
      tolerance,
    });
    for (const run of stanceRuns(contact)) {
      const startFoot = resolved[run.start]!.get(leg.foot)!.worldPosition;
      const carried =
        run.start === 0 ? props.openingTargets?.get(leg.foot) : undefined;
      const target: IAutoMovieVector3 =
        carried === undefined
          ? {
              x: startFoot.x,
              y: groundAt(startFoot.x, startFoot.z),
              z: startFoot.z,
            }
          : { ...carried };
      for (let f = run.start; f <= run.end; ++f)
        targets[f]!.set(leg.foot, target);
      plants.push({
        foot: leg.foot,
        start: times[run.start]!,
        end: times[run.end]!,
        position: target,
      });
    }
  }

  return { plants, targets };
};

/** Contiguous `true` runs of a contact mask, as inclusive frame ranges. */
const stanceRuns = (
  contact: readonly boolean[],
): Array<{ start: number; end: number }> => {
  const runs: Array<{ start: number; end: number }> = [];
  let start = -1;
  contact.forEach((inContact, index) => {
    if (inContact && start === -1) start = index;
    else if (!inContact && start !== -1) {
      runs.push({ start, end: index - 1 });
      start = -1;
    }
  });
  if (start !== -1) runs.push({ start, end: contact.length - 1 });
  return runs;
};

/** Contiguous `true` runs of a contact mask, as inclusive frame ranges. */
const stanceRuns = (
  contact: readonly boolean[],
): Array<{ start: number; end: number }> => {
  const runs: Array<{ start: number; end: number }> = [];
  let start = -1;
  contact.forEach((inContact, index) => {
    if (inContact && start === -1) start = index;
    else if (!inContact && start !== -1) {
      runs.push({ start, end: index - 1 });
      start = -1;
    }
  });
  if (start !== -1) runs.push({ start, end: contact.length - 1 });
  return runs;
};
