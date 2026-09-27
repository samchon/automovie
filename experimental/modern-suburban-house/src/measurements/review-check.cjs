/** Run the coordinator's read probes and the production check in one
 * command. Every child runs, and every nonzero exit contributes to the final
 * exit sum. The reason probe is scoped to docs and src separately so ignored
 * historical .wiki snapshots are not mistaken for production review hosts.
 * Full output stays in the ignored .wiki review log. */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const logs = path.join(root, ".wiki", "stage3-review-check");

/** @param {string} output @param {number|null} processStatus */
function identifierStatus(output, processStatus) {
  const count = /^rows (\d+) tokens-with-absent-part (\d+)$/m.exec(output);
  if (!count || Number(count[1]) === 0) return 1;
  const hits = output.split(/\r?\n/).filter((line) => line.startsWith("src/"));
  const total = Number(count[2]);
  if (hits.length !== total || processStatus !== (total === 0 ? 0 : 1)) return 1;
  const allowedVerb = "flat" + "Maps";
  return hits.every((line) => {
    const fields = line.split("\t");
    return fields.length === 4 && fields[2] === allowedVerb && fields[3] === `absent=${allowedVerb}`;
  }) ? 0 : 1;
}

/** Number reports are selectors for manual reading, not a failure count. */
function numberReportStatus(output, processStatus) {
  const rows = /^review rows\s+(\d+)$/m.exec(output);
  return rows && Number(rows[1]) > 0 && (processStatus === 0 || processStatus === 1) ? 0 : 1;
}

/** @param {string} probes @param {string} npmCli
 * @returns {Array<[string, string, string[]]>} */
function taskPlan(probes, npmCli) {
  return [
    [
      "src-literal-duplication",
      process.execPath,
      [path.join(probes, "src-literal-duplication.cjs"), root],
    ],
    [
      "src-review-host",
      process.execPath,
      [path.join(probes, "src-review-host.mjs"), root, "src/spaces"],
    ],
    [
      "src-review-missing-idents",
      "python",
      [path.join(probes, "src-review-missing-idents.py"), root],
    ],
    [
      "docs-review-host",
      process.execPath,
      [path.join(probes, "docs-review-host.mjs"), root, "docs/models"],
    ],
    [
      "docs-spaces-review-host",
      process.execPath,
      [path.join(probes, "docs-review-host.mjs"), root, "docs/spaces"],
    ],
    [
      "docs-spaces-review-rows",
      process.execPath,
      [
        path.join(probes, "1952-docs-rows-extract.mjs"),
        path.join(root, "docs"),
        path.join(logs, "docs-spaces-rows.json"),
        "spaces", "spaces/rooms", "spaces/envelope", "spaces/roof", "spaces/site",
      ],
    ],
    [
      "docs-spaces-review-quotes",
      process.execPath,
      [
        path.join(probes, "1952-docs-quote-check-all.cjs"),
        path.join(root, "docs"),
        path.join(logs, "docs-spaces-rows.json"),
        "1",
        path.join(logs, "docs-spaces-quotes"),
      ],
    ],
    [
      "docs-spaces-quote-owners",
      process.execPath,
      [
        path.join(__dirname, "docs-spaces-quote-owner.cjs"),
        path.join(logs, "docs-spaces-rows.json"),
        path.join(logs, "docs-spaces-quotes.tsv"),
      ],
    ],
    [
      "doc-review-numbers",
      process.execPath,
      [path.join(probes, "doc-review-numbers.mjs"), root],
    ],
    [
      "docs-spaces-review-numbers",
      process.execPath,
      [path.join(probes, "doc-review-numbers.mjs"), root, "docs/spaces"],
    ],
    [
      "doc-anchor-graph",
      process.execPath,
      [path.join(probes, "doc-anchor-graph.cjs"), root],
    ],
    [
      "face-binding-owner",
      process.execPath,
      [path.join(probes, "face-binding-owner.cjs"), root],
    ],
    [
      "evidence-reason-docs",
      "python",
      [path.join(probes, "evidence-reason-shared.py"), root, "docs"],
    ],
    [
      "evidence-reason-src",
      "python",
      [path.join(probes, "evidence-reason-shared.py"), root, "src"],
    ],
    ["production-check", process.execPath, [npmCli, "run", "check"]],
  ];
}

/** @param {ReturnType<typeof taskPlan>} tasks @param {(command:string,args:string[])=>{status:number|null,stdout?:string,stderr?:string,error?:Error}} run */
function execute(tasks, run) {
  let exitSum = 0;
  const results = [];
  for (const [name, command, args] of tasks) {
    const result = run(command, args);
    const unchecked = /\bNOTHING (?:WAS )?CHECKED\b/i.test(
      `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const rowCount = /\btotal\s+(\d+)\s+hosts\s+\d+/.exec(output);
    const spanCount = /\brows with quotes\s+\d+\s+spans\s+(\d+)/.exec(output);
    const failedQuotes = /\b(?:ABSENT|LOOSE):\s*[1-9]\d*\b/.test(output);
    const emptyPopulation =
      (name === "docs-spaces-review-rows" && Number(rowCount?.[1] ?? 0) === 0) ||
      (name === "docs-spaces-review-quotes" && Number(spanCount?.[1] ?? 0) === 0);
    const status = name === "src-review-missing-idents"
      ? identifierStatus(output, result.status)
      : name === "doc-review-numbers" || name === "docs-spaces-review-numbers"
      ? numberReportStatus(output, result.status)
      : Math.max(result.status ?? 1, unchecked || emptyPopulation || (name === "docs-spaces-review-quotes" && failedQuotes) ? 1 : 0);
    exitSum += status;
    results.push({
      name,
      status,
      unchecked: unchecked || emptyPopulation,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      error: result.error?.message ?? "",
    });
  }
  return { exitSum, results };
}

if (require.main === module) {
  const probes = process.argv[2];
  const npmCli = process.env.npm_execpath;
  if (!probes || !npmCli) {
    console.error("usage: npm run review-check -- <probe-directory>");
    process.exitCode = 2;
  } else {
    fs.mkdirSync(logs, { recursive: true });
    const spacesOnly = process.argv[3] === "--spaces";
    const tasks = taskPlan(path.resolve(probes), npmCli).filter(([name]) =>
      !spacesOnly || (name !== "docs-review-host" && name !== "production-check"),
    );
    const { exitSum, results } = execute(
      tasks,
      (command, args) =>
        spawnSync(command, args, {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 1 << 26,
        }),
    );
    for (const result of results) {
      const log = path.join(logs, `${result.name}.txt`);
      fs.writeFileSync(log, result.stdout + result.stderr + result.error);
      console.log(
        `${result.name}: exit=${result.status}${result.unchecked ? " (nothing checked)" : ""} log=${path.relative(root, log)}`,
      );
    }
    console.log(`review-check: ${results.length} tasks, exit sum=${exitSum}`);
    process.exitCode = Math.min(exitSum, 255);
  }
}

module.exports = { taskPlan, execute, identifierStatus, numberReportStatus };
