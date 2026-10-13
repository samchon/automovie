/** Unmodified arrows navigate views; every other key retains native behavior. */
export function galleryKeyDirection(input: {
  key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean;
}): -1 | 0 | 1 {
  if (input.key !== "ArrowLeft" && input.key !== "ArrowRight") return 0;
  if (input.ctrlKey || input.metaKey || input.altKey || input.shiftKey) return 0;
  return input.key === "ArrowRight" ? 1 : -1;
}
