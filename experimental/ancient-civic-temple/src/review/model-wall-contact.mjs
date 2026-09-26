/** Resolve an implicit wall-contact face to the part named immediately before it. */
/** @param {string} id @param {string} body */
export const implicitWallContactRows = (id, body) => {
  if (!/원점[^.\n]*뒷변/.test(body) || !/앞은[^.\n]*\+Z/.test(body)) return [];
  const rows = [];
  for (const claim of body.matchAll(/(?:^|\.\s+)(?:그 )?뒷면은[^.\n]*벽과 닿[^.\n]*/gm)) {
    const sentence = claim[0];
    if (/Z=/.test(sentence)) continue;
    const previous = [...body.slice(0, claim.index).matchAll(/뒷면은\s*`([^`]+)`/g)].at(-1);
    if (!previous) continue;
    const part = previous[1];
    const span = new RegExp("`" + part + "`(?:은|는)[^\\n]*?Z=([+−-]?\\d+(?:\\.\\d+)?)~([+−-]?\\d+(?:\\.\\d+)?)m").exec(body);
    if (!span) continue;
    const back = Number(span[1].replace("−", "-"));
    rows.push({ id, part, back, pass: Math.abs(back) < 1e-6 });
  }
  return rows;
};
