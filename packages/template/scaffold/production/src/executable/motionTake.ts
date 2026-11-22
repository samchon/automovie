import { openMotionTake } from "./motionTake/openMotionTake";

/** Parse the installed motion take command and print an exact reopened sample. */
async function main(): Promise<void> {
  const [mode, source, artifact, seconds, entry, side, ...rest]: string[] =
    process.argv.slice(2);
  if (
    !source ||
    !artifact ||
    rest.length ||
    (mode === "save"
      ? !seconds ||
        (entry !== undefined && !/^(0|[1-9]\d*)$/u.test(entry)) ||
        (side !== undefined && side !== "before" && side !== "after")
      : (mode !== "open" && mode !== "branch") || seconds !== undefined)
  )
    throw new Error(
      [
        "Usage:",
        "motion:take save <source-module> <new-artifact> <output-seconds> [entry] [before|after]",
        "motion:take open <source-module> <artifact>",
        "motion:take branch <branch-source-module> <new-artifact>",
      ].join("\n"),
    );

  const result: Awaited<ReturnType<typeof openMotionTake>> =
    await openMotionTake({
      root: process.cwd(),
      source,
      artifact,
      ...(mode === "save"
        ? {
            create: {
              mode,
              outputSeconds: Number(seconds),
              ...(entry === undefined ? {} : { entry: Number(entry) }),
              ...(side === "before" || side === "after" ? { side } : {}),
            },
          }
        : mode === "branch"
          ? { create: { mode } }
          : {}),
    });
  const { anchor } = result.take;
  const performance: ReturnType<typeof result.replay.performanceAt> =
    result.replay.performanceAt(anchor.sourceSeconds);
  if (mode === "open") {
    console.log(
      JSON.stringify({
        take: result.take,
        poses: Object.fromEntries(
          performance.performers.map(({ subject }) => [
            subject,
            performance.pose(subject, anchor.sourceSeconds),
          ]),
        ),
      }),
    );
  } else console.log(JSON.stringify(result.take));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
