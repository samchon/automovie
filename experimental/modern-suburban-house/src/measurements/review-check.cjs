/** Run the coordinator's read probes and the production check in one
 * command. Every child runs, and every nonzero exit contributes to the final
 * exit sum. Identifier inspection reads ordinary source acknowledgements and
 * exclusions. Companion-only probes are retired with their annotation duty.
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
  })
    ? 0
    : 1;
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
      "src-review-missing-idents",
      "python",
      [path.join(probes, "src-review-missing-idents.py"), root, "--all-tags"],
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
    ["production-check", process.execPath, [npmCli, "run", "check"]],
  ];
}

/** @param {ReturnType<typeof taskPlan>} tasks @param {(command:string,args:string[])=>{ status:number|null;stdout?:string;stderr?:string;error?:Error }} run */
function execute(tasks, run) {
  let exitSum = 0;
  const results = [];
  for (const [name, command, args] of tasks) {
    const result = run(command, args);
    const unchecked = /\bNOTHING (?:WAS )?CHECKED\b/i.test(
      `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const status = name === "src-review-missing-idents"
      ? identifierStatus(output, result.status)
      : Math.max(result.status ?? 1, unchecked ? 1 : 0);
    exitSum += status;
    results.push({
      name,
      status,
      unchecked,
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
      !spacesOnly || name !== "production-check",
    );
    const { exitSum, results } = execute(tasks, (command, args) =>
      spawnSync(command, args, {
        windowsHide: true,
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

module.exports = { taskPlan, execute, identifierStatus };
