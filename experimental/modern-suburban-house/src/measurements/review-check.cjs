/** Run the coordinator's seven read probe types and the production check in one
 * command. Every child runs, and every nonzero exit contributes to the final
 * exit sum. The reason probe is scoped to docs and src separately so ignored
 * historical .wiki snapshots are not mistaken for production review hosts.
 * Full output stays in the ignored .wiki review log. */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");

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
      "docs-review-host",
      process.execPath,
      [path.join(probes, "docs-review-host.mjs"), root, "docs/models"],
    ],
    [
      "doc-review-numbers",
      process.execPath,
      [path.join(probes, "doc-review-numbers.mjs"), root],
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
    const status = Math.max(result.status ?? 1, unchecked ? 1 : 0);
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
    const logs = path.join(root, ".wiki", "stage3-review-check");
    fs.mkdirSync(logs, { recursive: true });
    const { exitSum, results } = execute(
      taskPlan(path.resolve(probes), npmCli),
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

module.exports = { taskPlan, execute };
