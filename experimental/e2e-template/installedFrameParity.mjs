import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * The 8 fps witness frames fixed by the authored edit, independent of its
 * planners.
 */
const frames = [
  {
    index: 5,
    time: 0.625,
    shot: "slide/0",
    source: 0.625,
    eye: 0,
    x: 0.48,
    pass: "depth",
  },
  {
    index: 6,
    time: 0.75,
    shot: "hold/1",
    source: 0.25,
    eye: 0.82,
    x: 0.35,
    pass: "depth",
  },
  {
    index: 11,
    time: 1.375,
    shot: "slide/2",
    source: 0.75,
    eye: 0,
    pass: "beauty",
  },
];

/**
 * Each cut row has a half-open live interval. During overlap the earlier shot
 * can still dominate.
 */
const cut = [
  {
    entry: 0,
    shot: "slide",
    start: 0,
    played: 1,
    offset: 0,
    liveFrames: [0, 4],
  },
  {
    entry: 1,
    shot: "hold",
    start: 0.5,
    played: 0.75,
    offset: 0,
    liveFrames: [4, 10],
  },
  {
    entry: 2,
    shot: "slide",
    start: 1.25,
    played: 0.25,
    offset: 0.5,
    playbackRate: 2,
    liveFrames: [10, 12],
  },
];

/** The shared subject, independent output folders and sample request. */
const subject = "installed-parity";
const delivery = ".cache/e2e-delivery-parity";
const captures = ".cache/e2e-parity-capture";
const source = path.join(captures, "rounds", "drawn");
const decoded = path.join(captures, "rounds", "decoded");
const review = ".cache/e2e-review-parity";
const instants = "0.625,0.75,1.25,1.375";

/**
 * Judge the installed Inspector, normal capture output and the exact encoded
 * delivery on one short authored sequence. The Inspector has one sharp sample
 * per completed paint. The Draw and encoded beauty pass have the commissioned
 * trailing shutter, and depth shows only the dominant shot even on a dissolve.
 */
export const installedFrameParity = { inspector, deliver };

/**
 * Collect a completed Viewer diagnosis and independently inspect the painted
 * canvas.
 */
async function inspector({ page, url, decodePng }) {
  let command;
  for (const frame of frames) {
    const requested = new URL(url);
    requested.searchParams.set("subject", subject);
    requested.searchParams.set("at", String(frame.time));
    if (frame.index === 5) {
      requested.searchParams.set("at", instants);
      requested.searchParams.set("passes", "depth,beauty");
      requested.searchParams.set("round", "drawn");
    } else requested.searchParams.set("shade", frame.pass);
    await page.goto(requested.href, { waitUntil: "load", timeout: 30_000 });

    // The browser's transport displays requested time before a draw has completed.
    // The existing diagnostics panel updates only after the paint it describes.
    const completed = page.getByText(
      `Confirmed — ${frame.time} s (frame ${frame.index}) · Cart placement ${frame.shot} source=${frame.source} eye=${frame.eye}`,
      { exact: false },
    );
    await completed.waitFor({ timeout: 30_000 });
    const raster = await decodePng(await page.locator("canvas").screenshot());
    if (frame.pass === "depth") guide(raster, frame);
    else colour(raster, "green");
    if (frame.index === 5) command = await copiedCommand(page, requested);
  }
  console.log(
    "inspector: completed output index, source occurrence, camera and painted pass agree",
  );
  return command;
}

/** Copy the production's formatted capture request through the actual button. */
async function copiedCommand(page, url) {
  await page
    .getByText("Request : address and capture command", { exact: true })
    .click();
  const shell = page.getByRole("combobox", { name: "Command shell" });
  const input = page.getByRole("textbox", { name: "Capture command" });
  assert.equal(await shell.inputValue(), "posix");
  const posix = await input.inputValue();
  assert.equal(
    posix,
    `pnpm run capture --subject=${subject} --at=${instants} --passes=depth,beauty --round=drawn`,
  );
  await shell.selectOption("powershell");
  const powershell = await input.inputValue();
  assert.equal(
    powershell,
    `pnpm run capture --subject=${subject} '--at=${instants}' '--passes=depth,beauty' --round=drawn`,
  );
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: url.origin,
  });
  await page.getByRole("button", { name: "Copy command" }).click();
  await page.waitForFunction(
    async (expected) => (await navigator.clipboard.readText()) === expected,
    powershell,
  );
  return { powershell, posix };
}

/** Join the Draw and delivered frame records to their real image witnesses. */
async function deliver({ root, decodePng, guideFrameName, ffmpeg, command }) {
  verification(root, {
    capture: "not-run",
    published: "not-run",
    blocked: true,
  });
  runCopiedCapture(root, command);
  verification(root, {
    capture: "unobserved",
    published: "not-run",
    blocked: true,
  });
  pnpm(root, [
    "run",
    "render",
    "--subject",
    subject,
    "--passes",
    "depth",
    "--out",
    delivery,
  ]);
  const file = path.join(delivery, "film.mp4");
  pnpm(root, [
    "exec",
    "automovie",
    "capture",
    "--file",
    file,
    "--subject",
    subject,
    "--at",
    instants,
    "--round",
    "decoded",
    "--compare",
    "drawn",
    "--threshold",
    "100",
    "--out",
    captures,
  ]);
  const capture = await read(root, source, "record.json");
  const report = await read(root, delivery, "render-report.json");
  const controls = await read(root, delivery, "controls", "record.json");
  const fromFile = await read(root, decoded, "record.json");
  const hash = sha256(await fs.readFile(path.join(root, file)));
  verification(root, {
    capture: "unobserved",
    published: "passed",
    blocked: false,
  });
  await reviewDelivered(root, file, hash);

  assert.equal(report.status, "published");
  assert.equal(report.subject, subject);
  assert.equal(report.video, "film.mp4");
  assert.equal(report.source.sha256, hash);
  assert.deepEqual(report.cut, cut);
  assert.deepEqual(
    report.frames.map(({ index, seconds }) => [index, seconds]),
    Array.from({ length: 12 }, (_, index) => [index, index / 8]),
  );
  assert.equal(controls.filmSha256, hash);
  assert.deepEqual(controls.clock.frameRate, [8, 1]);
  assert.equal(controls.clock.frameCount, 12);
  assert.equal(fromFile.video.file, path.join(root, file));
  // The file capture selects decoded frame indices. Read real presentation
  // timestamps independently because a nominal rate alone cannot pin that order.
  presentation(ffmpeg, path.join(root, file));

  assert.deepEqual(
    fromFile.comparison.entries,
    fromFile.rows
      .flatMap((row) => [
        {
          state: "paired",
          mode: "side-by-side",
          current: row.name,
          earlier: cell(
            capture,
            { index: row.time.frame, time: row.time.seconds },
            "beauty",
          ).name,
        },
        {
          state: "unmatched",
          current: null,
          earlier: cell(
            capture,
            { index: row.time.frame, time: row.time.seconds },
            "depth",
          ).name,
          cause:
            "this capture has no remaining cell with the same pass and selection at this second",
        },
      ])
      .sort((left, right) => left.state.localeCompare(right.state)),
  );

  for (const frame of frames) {
    for (const diagnoses of [capture.diagnostics, report.diagnostics])
      observation(diagnoses, frame);
    const drawn = cell(capture, frame, frame.pass);
    assert.equal(drawn.view, "film");
    assert.equal(JSON.parse(drawn.camera).position.x, frame.eye);
    const raster = await image(root, source, drawn.file, decodePng);
    const actual = cell(fromFile, frame, "beauty");
    assert.equal(actual.backend, "ffmpeg");
    assert.equal(actual.view, "file");
    assert.equal(
      actual.camera,
      null,
      "decoded pixels cannot supply an inspection camera",
    );
    const videoRaster = await image(root, decoded, actual.file, decodePng);
    if (frame.pass === "depth") {
      guide(raster, frame);
      const channel = controls.channels.find(({ pass }) => pass === "depth");
      assert.ok(channel, "depth must be a delivered control channel");
      const control = channel.frames[frame.index];
      assert.deepEqual(
        [control.index, control.seconds],
        [frame.index, frame.time],
      );
      const bytes = await fs.readFile(
        path.join(
          root,
          delivery,
          "controls",
          guideFrameName(control.index, channel.pass),
        ),
      );
      assert.equal(sha256(bytes), control.sha256);
      guide(await decodePng(bytes), frame);
      if (frame.index === 5) {
        const beauty = cell(capture, frame, "beauty");
        colour(await image(root, source, beauty.file, decodePng), "dissolve");
        colour(videoRaster, "dissolve");
      }
    } else {
      colour(raster, "shutter");
      colour(videoRaster, "shutter");
    }
  }

  const previous = cell(fromFile, { index: 10, time: 1.25 }, "beauty");
  const previousRaster = await image(root, decoded, previous.file, decodePng);
  colour(previousRaster, "red");
  assert.throws(() => colour(previousRaster, "shutter"), /shutter witness/);
  const wrongGuide = cell(capture, frames[1], "depth");
  const wrongRaster = await image(root, source, wrongGuide.file, decodePng);
  assert.throws(() => guide(wrongRaster, frames[0]), /depth witness/);
  assert.throws(
    () => observation(report.diagnostics, { ...frames[0], shot: "hold/1" }),
    /placed witness/,
  );
  console.log(
    "delivery: Draw and decoded file agree on authored samples; wrong frame, guide and occurrence rejected",
  );
}

/** Admit one capture record row only when its whole address was observed. */
function cell(record, frame, pass) {
  const matching = record.rows.filter(
    (row) =>
      row.time.frame === frame.index &&
      row.time.seconds === frame.time &&
      row.pass === pass,
  );
  assert.equal(matching.length, 1, `one ${pass} capture at ${frame.time}`);
  const row = matching[0];
  assert.equal(row.state, "drawn", row.cause);
  return row;
}

/**
 * Read the diagnostic produced by the fixture's actual placement and canonical
 * camera.
 */
function observation(diagnostics, frame) {
  const episodes = diagnostics?.episodes ?? [];
  const match = episodes.find(
    ({ first }) =>
      first.finding.check === "installed-parity" &&
      first.time.outputFrame === frame.index,
  );
  assert.ok(match, `placed witness for output frame ${frame.index}`);
  assert.deepEqual(
    [match.scope, match.first.time.filmSeconds, match.first.time.shot],
    [frame.shot, frame.time, { path: frame.shot, seconds: frame.source }],
    `placed witness for output frame ${frame.index}`,
  );
  assert.match(
    match.first.finding.message,
    new RegExp(` eye=${String(frame.eye).replace(".", "\\.")} cart=`),
  );
}

/** Read the container's actual presentation ticks on its own FFmpeg timebase. */
function presentation(ffmpeg, file) {
  const result = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-copyts",
      "-i",
      file,
      "-an",
      "-vf",
      "showinfo",
      "-f",
      "null",
      "-",
    ],
    {
      encoding: "utf8",
      windowsHide: true,
    },
  );
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const timeBase = /config in time_base: (\d+)\/(\d+)/u.exec(result.stderr);
  assert.ok(timeBase, "decoded presentation timebase");
  const numerator = BigInt(timeBase[1]);
  const denominator = BigInt(timeBase[2]);
  const timestamps = [
    ...result.stderr.matchAll(/\bn:\s*(\d+)\s+pts:\s*(-?\d+)\s+pts_time:/gu),
  ];
  assert.deepEqual(
    timestamps.map((row) => [Number(row[1]), BigInt(row[2]) * numerator * 8n]),
    Array.from({ length: 12 }, (_, index) => [
      index,
      BigInt(index) * denominator,
    ]),
    "all presented frames and their exact output-grid positions",
  );
}

/** Verify the guide draws one sharp cart through the dominant layer's camera. */
function guide(raster, frame) {
  const rgb = pixel(raster, frame.x, 0.495);
  const absent = pixel(raster, frame.x === 0.48 ? 0.35 : 0.48, 0.495);
  const corners = pixel(raster, 0.1, 0.1);
  assert.ok(
    Math.min(...rgb) > 45 &&
      Math.max(...rgb) - Math.min(...rgb) < 5 &&
      Math.max(...absent, ...corners) < 8,
    `depth witness for ${frame.shot} at frame ${frame.index}: cart=${rgb}, other=${absent}, background=${corners}`,
  );
}

/** Read the broad background hue, well away from antialiasing and codec edges. */
function colour(raster, expected) {
  const [r, g, b] = pixel(raster, 0.1, 0.1);
  const ok =
    expected === "green"
      ? g > 145 && r < 65 && b < 65
      : expected === "red"
        ? r > 145 && g < 65 && b < 65
        : expected === "dissolve"
          ? r > b + 25 && b > 55 && g < 65
          : r > 95 && g > 95 && b < 65;
  assert.ok(ok, `${expected} witness: sampled RGB ${r}, ${g}, ${b}`);
}

/** Sample an interior pixel on the observation's own raster. */
function pixel({ width, height, pixels }, x, y) {
  const offset = 4 * (Math.floor(y * height) * width + Math.floor(x * width));
  return [...pixels.subarray(offset, offset + 3)];
}

/** Read one JSON receipt or capture record from the installed project. */
async function read(root, ...file) {
  return JSON.parse(await fs.readFile(path.join(root, ...file), "utf8"));
}

/** Decode a captured frame with the installed render package's reader. */
async function image(root, directory, file, decodePng) {
  return decodePng(await fs.readFile(path.join(root, directory, file)));
}

/** Compute the digest of the exact file the witness came from. */
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** A generated production can require the matching current published receipt. */
function verification(root, { capture, published, blocked }) {
  const result = pnpm(
    root,
    [
      "--silent",
      "run",
      "verify",
      "--subject",
      subject,
      "--require",
      "handoff",
      "--json",
    ],
    { expectedStatus: blocked ? 1 : 0, encoding: "utf8", stdio: "pipe" },
  );
  const status = JSON.parse(result.stdout);
  assert.equal(status.blocked, blocked);
  assert.equal(status.requiredStage, "handoff");
  assert.deepEqual(
    status.items.map(({ target, id, state, required }) => [
      target,
      id,
      state,
      required,
    ]),
    [
      [subject, "dissolve-depth", capture, false],
      [subject, "published", published, true],
    ],
  );
  if (capture === "unobserved")
    assert.match(
      status.items[0].message,
      /Capture input identity is unknown|this audit combines other views or passes/u,
    );
}

/** The navigation mark and its replay name the exact bytes and output frame. */
async function reviewDelivered(root, file, hash) {
  pnpm(root, [
    "run",
    "review",
    "--file",
    file,
    "--at",
    "0",
    "--note",
    "Check the cut",
    "--out",
    review,
  ]);
  const observation = await read(root, review, "review.json");
  assert.equal(observation.version, 1);
  assert.equal(observation.subject, subject);
  assert.equal(observation.sha256, hash);
  assert.equal(observation.observed.firstFrame, 0);
  assert.equal(observation.observed.start.ticks, 0);
  assert.equal(observation.viewed, null);
  const replay = pnpm(
    root,
    [
      "run",
      "review",
      "--mark",
      path.join(review, "review.json"),
      "--out",
      review,
    ],
    { encoding: "utf8", stdio: "pipe" },
  );
  assert.match(replay.stdout, /\bframe 0:/u);
}

/** Execute the copied Windows command; on CI use the tested POSIX argv directly. */
function runCopiedCapture(root, command) {
  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `${command.powershell} --out ${captures}; exit $LASTEXITCODE`,
      ],
      { cwd: root, stdio: "inherit", windowsHide: true },
    );
    assert.equal(result.status, 0, result.error?.message);
  } else {
    // All fixture arguments use the shell's unquoted word alphabet.
    const [program, ...args] = command.posix.split(" ");
    assert.equal(program, "pnpm");
    pnpm(root, [...args, "--out", captures]);
  }
}

/** Run the production's actual script. PowerShell resolves the Windows shim. */
function pnpm(root, args, { expectedStatus = 0, ...overrides } = {}) {
  const options = {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
    ...overrides,
  };
  const result =
    process.platform === "win32"
      ? spawnSync(
          "powershell.exe",
          [
            "-NoProfile",
            "-Command",
            "& pnpm " +
              args
                .map((arg) => "'" + arg.replaceAll("'", "''") + "'")
                .join(" ") +
              "; exit $LASTEXITCODE",
          ],
          options,
        )
      : spawnSync("pnpm", args, options);
  assert.equal(
    result.status,
    expectedStatus,
    result.error?.message ?? result.stderr ?? `pnpm ${args.join(" ")} failed`,
  );
  return result;
}
