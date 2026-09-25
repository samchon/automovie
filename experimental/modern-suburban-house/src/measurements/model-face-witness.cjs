/** Conservative sentence witness for one model face id. Both the material
 * inverse census and the model face census consume this same grammar. It
 * recognizes a named, measured, placed part in authored H2 body prose; it
 * does not certify the resulting solid, its UVs, or its neighbor contacts. */
const list = /(?:재질 경계|표면 id|면 id|face id|id 목록|표면 파티션|경계는|경계를)/;
const measure = /\d+(?:\.\d+)?\s*(?:m|UV\/m)|\[[−+\-.\d,\s]+\]\s*m|\d+(?:\.\d+)?\s*×\s*\d/;
const placement = /(?:X|Y|Z)\s*=\s*\[|(?:X|Y|Z)\s*=\s*[−-]?\d|원점|중심|모서리|끝에서|윗면|아랫면|뒤쪽|앞쪽|상단|하단|좌우|양끝|둘레|깊이/;

/** @param {string} body @param {string} id */
function witness(body, id) {
  const sentences = body.split(/(?<=다\.)\s+|\r?\n/).map((sentence) => sentence.trim()).filter(
    Boolean,
  );
  const named = sentences.filter((sentence) => sentence.includes(`\`${id}\``));
  const defining = named.filter(
    (sentence) => !list.test(sentence) && measure.test(sentence) && placement.test(sentence),
  );
  return { named: named.length, sentence: defining[0] ?? null };
}

module.exports = { witness };
