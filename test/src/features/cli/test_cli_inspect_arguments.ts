import {
  type IAutoMovieCapturePlanRequest,
  formatAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  AUTOMOVIE_INSPECT_OPTIONS,
  formatAutoMovieInspectUrl,
  readAutoMovieCommandArguments,
  readAutoMovieInspectHostOptions,
} from "automovie";

/**
 * `automovie inspect` keeps its tokens for the production's request reader, takes `--module` and `--port` for itself, refuses what it cannot serve, and prints an address whose query reads back to the request it was given.
 *
 * Scenarios:
 *
 * 1. `inspect` keeps every token after it, in order, including none.
 * 2. The command's own options are taken out of the read options, with the port as a number and the props file as its path, and every other option, such as `at` and `views`, is left for the request reader; every name in `AUTOMOVIE_INSPECT_OPTIONS` is taken and an unlisted one is not.
 * 3. A missing `--module`, an empty `--module`, `--port` or `--props`, and a port of 0, 65536, 1.5 or text are refused naming the option.
 * 4. The request left by the command, read by the plan reader, written by its writer and joined into the address, reads back from the address's query to an equal request, special characters included; the request that asks for nothing is the base address alone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported command reader, option splitter and address writer, with render's own argument reader, plan reader and writer around them, and asserts the returned values or thrown messages.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the documented options table and the TCP port range 1 to 65535; the address oracle is the browser's `URL` decoder read by the plan reader, compared with the request read from the command line, not with the writer's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts each command option against a request option, the port's two ends against the values just outside them, a fraction and text, a missing against an empty module, and an empty against a full request.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_cli_inspect_arguments`; it starts no server, Vite or browser. Serving the page belongs to a run of the command.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_cli_inspect_arguments(): void {
  // 1. The command keeps its tokens.
  TestValidator.equals(
    "inspect keeps its tokens",
    readAutoMovieCommandArguments([
      "inspect",
      "--module",
      "src/subjects.ts",
      "--at",
      "1.5",
      "--views",
      "front;top",
    ]),
    {
      command: "inspect",
      args: [
        "--module",
        "src/subjects.ts",
        "--at",
        "1.5",
        "--views",
        "front;top",
      ],
    },
  );
  TestValidator.equals(
    "inspect without tokens",
    readAutoMovieCommandArguments(["inspect"]),
    { command: "inspect", args: [] },
  );

  // 2. The command's own options.
  const read: (
    ...args: string[]
  ) => ReturnType<typeof readAutoMovieInspectHostOptions> = (
    ...args: string[]
  ): ReturnType<typeof readAutoMovieInspectHostOptions> =>
    readAutoMovieInspectHostOptions(readAutoMovieCaptureArguments(args));
  const options: ReturnType<typeof readAutoMovieInspectHostOptions> = read(
    "--module",
    "src/subjects.ts",
    "--port",
    "5174",
    "--at",
    "1.5",
    "--views",
    "front;top",
  );
  TestValidator.equals(
    "module and port",
    [options.module, options.port],
    ["src/subjects.ts", 5174],
  );
  TestValidator.equals(
    "the rest is the request",
    [...options.request.entries()],
    [
      ["at", "1.5"],
      ["views", "front;top"],
    ],
  );
  TestValidator.equals(
    "no port or props is null",
    [read("--module", "m.ts").port, read("--module", "m.ts").props],
    [null, null],
  );
  TestValidator.equals(
    "props is its file",
    read("--module", "m.ts", "--props", "case.json").props,
    "case.json",
  );
  const every: Map<string, string> = new Map<string, string>([
    ...AUTOMOVIE_INSPECT_OPTIONS.map((key: string): [string, string] => [
      key,
      key === "port" ? "8080" : "value",
    ]),
    ["subject", "s"],
  ]);
  TestValidator.equals(
    "every listed option is taken",
    [...readAutoMovieInspectHostOptions(every).request.keys()],
    ["subject"],
  );

  // 3. Refusals name the option.
  const refusals: [args: string[], option: string][] = [
    [["--at", "1"], "--module"],
    [["--module="], "--module"],
    [["--module", "m.ts", "--port="], "--port"],
    [["--module", "m.ts", "--props="], "--props"],
    ...["0", "65536", "1.5", "abc"].map((port: string): [string[], string] => [
      ["--module", "m.ts", "--port", port],
      "--port",
    ]),
  ];
  for (const [args, option] of refusals) {
    let message: string = "";
    try {
      read(...args);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    TestValidator.predicate(
      `${args.join(" ")} is refused naming ${option}`,
      message.includes(option),
    );
  }
  TestValidator.equals(
    "the port's ends are accepted",
    [
      read("--module", "m", "--port", "1").port,
      read("--module", "m", "--port", "65535").port,
    ],
    [1, 65535],
  );

  // 4. The printed address reads back to the request.
  const base: string = "http://127.0.0.1:5174/";
  const requested: IAutoMovieCapturePlanRequest =
    parseAutoMovieCapturePlanRequest(
      read(
        "--module",
        "m.ts",
        "--subject",
        "a&b c",
        "--parts",
        "hero/**",
        "--color",
        "hero/arm=ff8800",
        "--views",
        "front@ortho;0,1.6,4:0,1,0",
        "--at",
        "0.5,1.25",
      ).request,
    );
  const url: string = formatAutoMovieInspectUrl(
    base,
    formatAutoMovieCapturePlanRequest(requested),
  );
  TestValidator.equals(
    "the address reads back",
    parseAutoMovieCapturePlanRequest(new URL(url).searchParams),
    requested,
  );
  TestValidator.equals(
    "the empty request is the base address",
    formatAutoMovieInspectUrl(
      base,
      formatAutoMovieCapturePlanRequest(
        parseAutoMovieCapturePlanRequest(new Map()),
      ),
    ),
    base,
  );
}
