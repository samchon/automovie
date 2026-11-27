import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { AutoMovieMotionHumanObject } from "../../perform/AutoMovieMotionHumanObject";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";

/*
 * Bind the material link beneath every actual shaft grip, including when a grip
 * lies between named bands. A link is carried by the hinge at its upper end,
 * whose articulated frame includes its own turn and all ancestors.
 */
export function preparePoleVaultLinks(
  prop: Pick<
    IAutoMovieMotionHumanProp,
    "subject" | "affordances" | "articulate" | "articulateSite"
  >,
  places: readonly IAutoMovieVector3[],
): (state: Readonly<Record<string, number>>) => IAutoMovieRigidTransform[] {
  const hinges: IAutoMovieAffordance[] = (prop.affordances ?? [])
    .filter((site: IAutoMovieAffordance): boolean => site.kind === "hinge")
    .sort(
      (a: IAutoMovieAffordance, b: IAutoMovieAffordance): number =>
        a.frame.translation.y - b.frame.translation.y,
    );
  const prepared: IGrip[] = places.map((position: IAutoMovieVector3): IGrip => {
    const owner: IAutoMovieAffordance | undefined = hinges.find(
      (hinge: IAutoMovieAffordance): boolean =>
        hinge.frame.translation.y > position.y,
    );
    const rest: IAutoMovieRigidTransform = {
      position,
      rotation: AutoMovieEngineQuaternion.identity(),
    };
    return owner === undefined
      ? { rest }
      : {
          rest,
          owner: owner.id,
          at: HumanPropFrame.relative(frame(owner), rest),
        };
  });
  const ids: string[] = [
    ...new Set(
      prepared.flatMap((grip: IGrip): string[] =>
        grip.owner === undefined ? [] : [grip.owner],
      ),
    ),
  ];
  const site: IAutoMovieMotionHumanProp["articulateSite"] =
    AutoMovieMotionHumanObject.articulateSite(prop);
  return (
    state: Readonly<Record<string, number>>,
  ): IAutoMovieRigidTransform[] => {
    let posed: readonly IAutoMovieAffordance[] | undefined;
    const frames: Map<string, IAutoMovieRigidTransform> = new Map();
    for (const id of ids) {
      const narrow: IAutoMovieAffordance | undefined = site?.call(
        prop,
        id,
        state,
      );
      const found: IAutoMovieAffordance | undefined =
        narrow ??
        (posed ??= prop.articulate?.(state).affordances)?.find(
          (site: IAutoMovieAffordance): boolean => site.id === id,
        );
      if (found === undefined)
        throw new AutoMovieMotionHumanRefusal({
          kind: "affordance",
          axis: "pole",
          value: id,
          reason: `${prop.subject} does not expose the posed material frame of ${id}`,
          fix: "stage a pole with readable articulated links",
        });
      frames.set(id, frame(found));
    }
    return prepared.map(
      (grip: IGrip): IAutoMovieRigidTransform =>
        grip.owner === undefined
          ? grip.rest
          : HumanPropFrame.compose(frames.get(grip.owner)!, grip.at!),
    );
  };
}

/*
 * Static grip location and its nearest upper material hinge.
 */
interface IGrip {
  /*
   * Shaft point in the unbent model's axes.
   */
  rest: IAutoMovieRigidTransform;
  /*
   * The owning link's moving upper hinge when the link turns.
   */
  owner?: string;
  /*
   * The grip frame within the hinge, in metres and quaternion axes.
   */
  at?: IAutoMovieRigidTransform;
}

/*
 * Read the rigid portion of an authored or posed hinge.
 */
function frame(site: IAutoMovieAffordance): IAutoMovieRigidTransform {
  return { position: site.frame.translation, rotation: site.frame.rotation };
}
