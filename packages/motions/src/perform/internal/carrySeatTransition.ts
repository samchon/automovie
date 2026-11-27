import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Keep the authored root while a seat carries it across the whole blend. Joints
 * still take the ordinary transition offset. A seat staged in world coordinates
 * may pass to a moving prop when the two roots meet at the cut.
 */
export function carrySeatTransition(
  entry: Pick<IAutoMovieMotionHumanEntryState, "base" | "supports">,
  window: IWindow,
  decay: Offset,
): Offset {
  if (entry.base.kind !== "seated") return decay;
  const previous = entry.supports.find(
    (contact) => contact.part === "seat" && contact.kind === "seat",
  )?.support;
  if (previous === undefined) return decay;
  const { sourceRoot: first, targetRoot: next }: IWindow = window;
  const carried = window.contacts.some((contact) => {
    if (
      contact.part !== "seat" ||
      contact.kind !== "seat" ||
      contact.support.kind !== "prop" ||
      !(contact.from <= window.from && contact.to >= window.until)
    )
      return false;
    if (previous.kind === "ground")
      return (
        first !== undefined &&
        next !== undefined &&
        first.x === next.x &&
        first.y === next.y &&
        first.z === next.z
      );
    return (
      previous.kind === "prop" &&
      previous.subject === contact.support.subject &&
      (previous.point === undefined ||
        contact.support.point === undefined ||
        previous.point === contact.support.point)
    );
  });
  return carried
    ? (elapsed, pose) => ({ ...decay(elapsed, pose), root: pose.root })
    : decay;
}

type Offset = (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose;

interface IWindow {
  from: number;
  until: number;
  contacts: readonly IAutoMovieMotionHumanContactWindow[];
  sourceRoot: IAutoMovieVector3 | undefined;
  targetRoot: IAutoMovieVector3 | undefined;
}
