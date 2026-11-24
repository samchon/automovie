import type {
  AutoMovieHumanoidBone,
  IAutoMovieContactMask,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Contact classification observes position only; full FK frames remain valid
 * inputs.
 */
type IPoint =
  | IAutoMovieResolvedBone
  | Pick<IAutoMovieResolvedBone, "worldPosition">;

/**
 * Classify each resolved effector sample as stance when its model-frame Y is at
 * or below sampled ground plus finite nonnegative tolerance. Missing effectors
 * are false; nonfinite sampled ground throws and callback exceptions
 * propagate.
 */
export const contactMask: (props: IAutoMovieContactMask.IProps) => boolean[] = (
  props: IAutoMovieContactMask.IProps,
): boolean[] => {
  if (props.tolerance < 0)
    throw new Error("contact tolerance must be finite and non-negative");
  return props.resolved.map(
    (map: ReadonlyMap<AutoMovieHumanoidBone, IPoint>): boolean => {
      const p: IAutoMovieVector3 | undefined = map.get(
        props.effector,
      )?.worldPosition;
      if (p === undefined) return false;
      const height: number = props.groundAt(p.x, p.z);
      return p.y <= height + props.tolerance;
    },
  );
};
