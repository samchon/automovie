import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const subject = "installed-passage";
const filmSource = "src/composition/films/installedPassageFilm.ts";
const bodySource = "src/composition/films/installedPassageBody.json";
const output = ".cache/e2e-passage-cut";

/** Observe the passage through the normal commands of an installed production. */
export function installedPassageSmoke(root, run, verify) {
  const start = performance.now();
  const recordPath = path.join(root, "docs", "acceptance", `${subject}.md`);
  const observations = [
    "# Installed mug exchange",
    "",
    `Planned subject \`${subject}\` uses \`${filmSource}\` and the film camera.`,
    "",
    "## Production checks",
    "",
  ];
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  const check = (name, id, state, extra = [], message, status = 0) =>
    run(
      `installed passage check: ${name}/${id} ${state}`,
      "pnpm",
      [
        "exec",
        "automovie",
        "check",
        "--subject",
        name,
        "--only",
        id,
        "--json",
        ...extra,
      ],
      root,
      {
        status,
        read: (stdout) => {
          const report = JSON.parse(stdout);
          const result = report.items.find(
            (row) => row.target === name && row.id === id,
          );
          assert.ok(result, stdout);
          assert.equal(result.state, state, result.message);
          if (message !== undefined) assert.match(result.message, message);
          if (status === 1) assert.equal(report.blocked, true);
          console.log(`${result.scope}: ${result.message}`);
          observations.push(
            `- \`${name}/${id}\` ${result.state}. ${result.scope}.`,
          );
        },
      },
    );
  check(subject, "exact-cut", "not-run");
  check(subject, "receiving-grip", "passed", ["--run"]);
  check(subject, "unloaded-source", "unobserved", ["--run"], /load|source/iu);
  check(
    subject,
    "directory-input",
    "unobserved",
    ["--run"],
    /file|directory|EISDIR/iu,
  );
  check(
    subject + "-withdraw",
    "receiving-grip",
    "failed",
    ["--run"],
    /No played receiving/iu,
  );
  check(subject + "-withdraw", "retained-grip", "passed", ["--run"]);
  check(
    subject + "-layout",
    "layout-ready",
    "failed",
    ["--run"],
    /layout-extra/iu,
  );
  check(
    subject + "-missing",
    "receiving-grip",
    "failed",
    ["--run", "--require", "passage"],
    /receiver/iu,
    1,
  );

  const body = path.join(root, bodySource);
  const original = fs.readFileSync(body);
  try {
    fs.appendFileSync(body, "\n");
    check(
      subject,
      "receiving-grip",
      "stale",
      ["--require", "passage"],
      /changed/iu,
      1,
    );
  } finally {
    fs.writeFileSync(body, original);
  }
  check(subject, "receiving-grip", "passed", ["--require", "passage"]);

  const capture = (name, from, to, folder) =>
    run(
      `installed passage capture: ${name} ${from}–${to}`,
      "pnpm",
      [
        "exec",
        "automovie",
        "capture",
        "--module",
        "src/subjects.ts",
        "--subject",
        name,
        "--from",
        String(from),
        "--to",
        String(to),
        "--rate",
        "12",
        "--out",
        folder,
      ],
      root,
    );
  const passage = ".cache/e2e-passage-bounded";
  const widened = ".cache/e2e-passage-widened";
  const obscured = ".cache/e2e-passage-obscured";
  const havePassage = capture(subject, 0.25, 3.5, passage);
  const haveWider = capture(subject, 0, 4.5, widened);
  const haveObscured = capture(subject + "-obscured", 0.25, 3.5, obscured);
  // Failure in a separate check leaves the same already observed passage intact.
  check(
    subject + "-missing",
    "receiving-grip",
    "failed",
    ["--require", "passage"],
    /receiver/iu,
    1,
  );

  if (havePassage && haveWider && haveObscured)
    verify("installed passage: same source and view across the join", () => {
      const bounded = rows(root, passage, subject);
      const broad = rows(root, widened, subject);
      const hidden = rows(root, obscured, subject + "-obscured");
      assert.equal(bounded[0].time.seconds, 0.25);
      for (const frame of [22, 34, 35])
        assert.ok(
          bounded.some((row) => row.time.frame === frame),
          `native grip and join frame ${frame}`,
        );
      assert.ok(broad[0].time.seconds < bounded[0].time.seconds);
      assert.ok(broad.at(-1).time.seconds > bounded.at(-1).time.seconds);
      let changed = false;
      for (const row of bounded) {
        const peer = broad.find((item) => sameSample(row, item));
        const covered = hidden.find(
          (item) => item.time.seconds === row.time.seconds,
        );
        assert.ok(
          peer,
          `same subject and view in widened interval at ${row.time.seconds}`,
        );
        assert.ok(
          covered,
          `same interval with obscured offer at ${row.time.seconds}`,
        );
        assert.equal(
          hash(root, passage, row.file),
          hash(root, widened, peer.file),
        );
        changed ||=
          hash(root, passage, row.file) !== hash(root, obscured, covered.file);
      }
      assert.equal(
        changed,
        true,
        "the obstructing screen must change the delivery view",
      );
      const observation =
        `Observed ${subject} in film view at frames ${bounded[0].time.frame}–${bounded.at(-1).time.frame}. ` +
        `Source ${filmSource} SHA-256 ${hash(root, filmSource)}. ` +
        "The wider capture retained the shared frames. The alternate staging places a screen across the contact ray. Pace and audience judgment are pending.";
      console.log(observation);
      observations.push("", "## Partial observation", "", observation);
    });

  if (
    run(
      "installed passage: render complete candidate",
      "pnpm",
      [
        "exec",
        "automovie",
        "render",
        "--module",
        "src/subjects.ts",
        "--subject",
        subject,
        "--out",
        output,
      ],
      root,
    )
  ) {
    check(subject, "exact-cut", "passed", ["--require", "handoff"]);
    verify("installed passage: identify first complete candidate", () => {
      const record = JSON.parse(
        fs.readFileSync(path.join(root, output, "render-report.json"), "utf8"),
      );
      assert.equal(record.subject, subject);
      assert.equal(path.basename(record.video), record.video);
      const file = path.join(root, output, record.video);
      const original = fs.readFileSync(file);
      const digest = createHash("sha256").update(original).digest("hex");
      assert.equal(digest, record.source.sha256);
      observations.push(
        "",
        "## First candidate",
        "",
        `Technical candidate at ${output}/${record.video} SHA-256 ${digest}. ` +
          `Report subject ${record.subject}. Independent viewing and director decision remain pending. ` +
          "The pending candidate has no correction outcome.",
      );
      try {
        fs.appendFileSync(file, Buffer.from([0]));
        check(
          subject,
          "exact-cut",
          "stale",
          ["--require", "handoff"],
          /differ/iu,
          1,
        );
      } finally {
        fs.writeFileSync(file, original);
      }
      check(subject, "exact-cut", "passed", ["--require", "handoff"]);
    });
  } else {
    observations.push(
      "",
      "## First candidate",
      "",
      "No complete candidate was observed in this run.",
    );
  }
  observations.push(
    "",
    `Elapsed ${Math.round((performance.now() - start) / 1000)} seconds. Cost unmeasured.`,
    "",
  );
  fs.writeFileSync(recordPath, observations.join("\n"));
  console.log(`Installed passage acceptance record: ${recordPath}`);
}

function rows(root, folder, name) {
  const record = JSON.parse(
    fs.readFileSync(path.join(root, folder, "record.json"), "utf8"),
  );
  assert.equal(record.state, "complete");
  assert.equal(record.subject.name, name);
  assert.equal(record.subject.fps, 12);
  const rows = record.rows.filter((row) => row.pass === "beauty");
  assert.ok(rows.length > 0, folder);
  for (const row of rows) {
    assert.equal(row.state, "drawn", row.cause);
    assert.equal(row.view, "film");
    assert.ok(row.file);
  }
  return rows;
}

function sameSample(a, b) {
  return (
    a.time.seconds === b.time.seconds &&
    a.time.frame === b.time.frame &&
    a.camera === b.camera &&
    a.view === b.view &&
    JSON.stringify(a.selection) === JSON.stringify(b.selection)
  );
}

function hash(root, ...file) {
  return createHash("sha256")
    .update(fs.readFileSync(path.join(root, ...file)))
    .digest("hex");
}
