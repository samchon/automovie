/** Escape text for an HTML text node or a double-quoted attribute. */
const escape = (text: string): string =>
  text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * A local contact sheet of an observation run: one caption and image per drawn
 * frame, grouped by state, as a dependency-free HTML page that opens over
 * `file://` beside the frames.
 *
 * The sheet only lays out files the run wrote; it draws nothing and embeds no
 * pixels, so it can sit in the same ignored directory as the frames and is
 * never committed. File names, state names and reasons are escaped, because
 * they come from documents and from the editor's own refusal text. Refused
 * states are listed with their reasons above the grid so a missing frame is
 * explained on the page that shows the rest.
 *
 * @param input The unit's name and what was drawn and refused.
 */
export function renderObservationSheet(input: {
  title: string;
  drawn: { state: string; view: string; pass: string; file: string }[];
  refused: { state: string; reason: string }[];
}): string {
  const states = [...new Set(input.drawn.map((frame) => frame.state))];
  const sections = states
    .map(
      (state) =>
        `<section><h2>${escape(state)}</h2><div class="grid">${input.drawn
          .filter((frame) => frame.state === state)
          .map(
            (frame) =>
              `<figure><img src="${escape(frame.file)}" loading="lazy" alt=""><figcaption>${escape(frame.view)} · ${escape(frame.pass)}</figcaption></figure>`,
          )
          .join("")}</div></section>`,
    )
    .join("\n");
  const refused =
    input.refused.length === 0
      ? ""
      : `<section><h2>Refused by the editor</h2><ul>${input.refused
          .map(
            (entry) =>
              `<li><b>${escape(entry.state)}</b>: ${escape(entry.reason)}</li>`,
          )
          .join("")}</ul></section>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escape(input.title)}</title>
<style>body{margin:16px;background:#161c23;color:#e4eaf0;font:13px system-ui}.grid{display:flex;flex-wrap:wrap;gap:8px}figure{margin:0;width:220px}img{width:100%;background:#1c252e}figcaption{color:#a9b7c8;font-size:11px}</style>
</head><body><h1>${escape(input.title)}</h1>
${refused}
${sections}
</body></html>
`;
}
