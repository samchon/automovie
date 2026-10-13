/** Plain primary clicks enhance a link; modified or other clicks stay native. */
export function acceptGalleryClick(input: {
  button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean;
}): boolean {
  return input.button === 0 && !input.ctrlKey && !input.metaKey && !input.shiftKey && !input.altKey;
}
