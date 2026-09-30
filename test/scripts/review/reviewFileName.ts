/**
 * The file name of one review frame: the document state, the named view and
 * the pass, joined so that a directory listing sorts by state then view.
 *
 * Every part is reduced to lower-case letters, digits and hyphens, because
 * the names come from documents and hooks and land on a file system that
 * treats `/`, `\`, `:` and a trailing dot or space differently. The reduction
 * is a function of the three names only, so the same request always writes
 * the same file, and two different requests do not share one unless they
 * differ only in characters the reduction removes (an empty part is refused
 * instead of silently colliding).
 *
 * @param frame The state, view and pass of the frame.
 * @returns `<state>__<view>__<pass>.png`.
 */
export function reviewFileName(frame: {
  state: string;
  view: string;
  pass: string;
}): string {
  const part = (label: string, value: string): string => {
    const reduced = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (reduced === "")
      throw new Error(
        `A review frame needs a ${label} name with a letter or digit.`,
      );
    return reduced;
  };
  return `${part("state", frame.state)}__${part("view", frame.view)}__${part("pass", frame.pass)}.png`;
}
