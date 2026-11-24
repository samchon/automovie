import type { IAutoMovieFootfallPattern } from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalRootBounds } from "./physicalRootBounds";

/**
 * The support transitions a root task carries (`trackPhysicalRoot`): the force
 * bounds of the contacts of the limbs leaving and entering the stance
 * (`physicalRootBounds`), on their carriers' bodies; the lifted limbs'
 * contacts released to the contact passes, so their swings move them off the
 * floor; and every stance limb's carriers kept the task's stance whatever
 * their load, so their legs keep their posture rows.
 *
 * @param input The body's support pattern, its segments by bone, the stance
 *   limbs, the limbs asked to step that have not lifted, the lifted limbs, the
 *   feet's seating shares and the vertical force the stance is asked for,
 *   newtons.
 * @returns The task's bounds, released contacts and stance, each present only
 *   when not empty.
 */
export function physicalRootTransitions(input: {
  pattern: readonly IAutoMovieFootfallPattern["limbs"][number][];
  segments: ReadonlyMap<string, AutoMovieXpbdBody>;
  stance: readonly IAutoMovieFootfallPattern["limbs"][number][];
  requested: readonly string[];
  lifted: readonly string[];
  seating?: Readonly<Record<string, { bearing?: number; entry?: number }>>;
  force: number;
}): Pick<AutoMovieXpbdWorld.IRootTask, "bounds" | "released" | "stance"> {
  const carriers = (bone: string | undefined): AutoMovieXpbdBody[] => {
    const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
      input.pattern.find(
        (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
          candidate.bone === bone,
      );
    return limb
      ? (limb.contacts ?? [limb.bone]).flatMap(
          (carrier: string): AutoMovieXpbdBody[] => {
            const rigid: AutoMovieXpbdBody | undefined =
              input.segments.get(carrier);
            return rigid ? [rigid] : [];
          },
        )
      : [];
  };
  const bounds: AutoMovieXpbdWorld.IBound[] = physicalRootBounds({
    force: input.force,
    requested: input.requested,
    stance: input.stance.map(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): string => limb.bone,
    ),
    ...(input.seating ? { seating: input.seating } : {}),
  }).flatMap(
    (bound: physicalRootBounds.IBound): AutoMovieXpbdWorld.IBound[] => {
      const bodies: AutoMovieXpbdBody[] = carriers(bound.bone);
      return bodies.length > 0 ? [{ bodies, force: bound.force }] : [];
    },
  );
  const released: AutoMovieXpbdBody[] = input.lifted.flatMap(
    (bone: string): AutoMovieXpbdBody[] => carriers(bone),
  );
  const stance: AutoMovieXpbdBody[] = input.stance.flatMap(
    (limb: IAutoMovieFootfallPattern["limbs"][number]): AutoMovieXpbdBody[] =>
      carriers(limb.bone),
  );
  return {
    ...(bounds.length > 0 ? { bounds } : {}),
    ...(released.length > 0 ? { released: new Set(released) } : {}),
    ...(stance.length > 0 ? { stance } : {}),
  };
}
