/** Check the owner named before a quoted phrase against its actual H2. */
const fs = require("node:fs");

/** @param {Array<{ id:number;file:string;host:string;text:string }>} rows
 * @param {string[][]} spans
 * @param {Array<{ file:string;anchor:string;body:string }>} hosts */
function quoteOwnerFailures(rows, spans, hosts = []) {
  const byId = new Map(
    rows.map((row) => [`R${String(row.id).padStart(4, "0")}`, row]),
  );
  const bodies = new Map(
    hosts.map((host) => [`${host.file}#${host.anchor}`, host.body]),
  );
  const failures = [];
  let checked = 0;
  for (const [id, host, , status, quote] of spans) {
    if (!status.startsWith("ELSEWHERE:")) continue;
    ++checked;
    const row = byId.get(id);
    if (!row || !quote) {
      failures.push(`${id} missing extracted row or quote`);
      continue;
    }
    const sources = status.slice("ELSEWHERE:".length).split(",");
    const at = row.text.indexOf(quote);
    if (at < 0) {
      failures.push(`${id} quote absent from row`);
      continue;
    }
    const before = row.text.slice(Math.max(0, at - 90), at).replace(/[‘'"“]\s*$/, "").trim();
    const namedRaw = /([A-Za-z][A-Za-z0-9-]*)의\s*$/.exec(before)?.[1] ||
      /([A-Za-z][A-Za-z0-9-]*)\s+설정의\s*$/.exec(before)?.[1] ||
      /([A-Za-z][A-Za-z0-9-]*)가\s*$/.exec(before)?.[1];
    const named = namedRaw === "owner" ? undefined : namedRaw;
    /** @param {string} source */
    const sourceMatches = (source) => {
      const [file, anchor] = source.split("#");
      if (!file || !anchor) return false;
      if (named && ![anchor, file.split("/").at(-1)?.replace(/\.md$/, "")].includes(named)) return false;
      if (before.endsWith("설정의") || before.includes("설정 ")) {
        if (!file.startsWith("settings/")) return false;
      }
      if (named) return true;
      if (file.startsWith("settings/") && before.endsWith("설정의"))
        return bodies.get(`${row.file}#${row.host}`)?.includes(`#${anchor}`) ?? false;
      if (before.endsWith("owner의")) return row.text.slice(0, at).includes(anchor);
      return row.text.slice(0, at).includes(anchor);
    };
    if (!sources.some(sourceMatches)) failures.push(
      `${id} ${host} quoted '${quote}' as '${before}' but source is ${sources.join(",")}`,
    );
  }
  return { checked, failures };
}

if (require.main === module) {
  const [rowsPath, spansPath] = process.argv.slice(2);
  if (!rowsPath || !spansPath) {
    console.error(
      "usage: node docs-spaces-quote-owner.cjs <rows.json> <quotes.tsv>",
    );
    process.exitCode = 2;
  } else {
    const data = JSON.parse(fs.readFileSync(rowsPath, "utf8"));
    const spans = fs.readFileSync(spansPath, "utf8").split(/\r?\n/).filter(Boolean).map(
      (line) => line.split("\t"),
    );
    const result = quoteOwnerFailures(data.rows, spans, data.hosts);
    console.log(
      `quote owners checked ${result.checked} mismatched ${result.failures.length}`,
    );
    for (const failure of result.failures) console.log(failure);
    process.exitCode = result.checked > 0 && result.failures.length === 0 ? 0 : 1;
  }
}

module.exports = { quoteOwnerFailures };
