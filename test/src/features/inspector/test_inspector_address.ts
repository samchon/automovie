import {
  type IAutoMovieCapturePlanRequest,
  type IAutoMovieInspectionView,
  parseAutoMovieCapturePlanRequest,
  parseAutoMovieInspectionView,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import {
  formatAutoMovieInspectorAddress,
  formatAutoMovieInspectorCommand,
  formatAutoMovieInspectorView,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * The inspector's request round-trips through its address text, the command it shows reads back to the same plan request through the command's own reader, and a view the panel builds is written as text the view grammar reads back.
 *
 * Scenarios:
 *
 * 1. Requests that set every kind of key, including a subject with `&`, a space and a quote, a fixed view starting with `-`, a focus and several views, read back equal after being written as an address, and the address keeps `,`, `:`, `;`, `/`, `@` and `=` readable while escaping `&` and the space.
 * 2. The request that asks for nothing is the empty address, and a leading `?` is accepted.
 * 3. An address with an unknown key or an empty `views` is refused naming the key.
 * 4. Each request's command options, read by `readAutoMovieCaptureArguments` and the plan reader, give an equal request; the command text starts with `automovie capture`, and split as a POSIX shell splits single-quoted words it gives back the same arguments.
 * 5. Film, fixed, named, orthographic, pattern-focused, flagged and combined views are written as text that parses back to the same view.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Writes requests with the public address and command writers and reads them back with the inspector's address reader and the capture command's own argument reader, and writes views read back by render's view parser.
 * @evidence contracts/development/testing.md#independent-expectations The requests are read from address texts written out in the test, so the oracle is the plan grammar's reader, not the writer under test; the shell split follows the POSIX single-quote rule, implemented in the test, and the readable characters are those RFC 3986 allows in a query.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts the empty request against full ones, a value needing escapes against plain ones, an argument needing quotes against plain ones, every view form, and accepted against refused addresses.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_address`; no browser and no command is run. The reducer's edits belong to `test_inspector_reducer`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_inspector_address(): void {
  const texts: string[] = [
    "parts=hero/**,prop&hide=hero/legs&label=hero/**&color=hero/arm=ff8800&marks=edge,defect/*&shade=clay&surface=0&xray&sliver=4&section=-x:0.2&stroke=2",
    `subject=${encodeURIComponent("a&b c's")}&at=0.5,1.25&events=2&window=1&views=front@ortho@focus=hero/arm;-1,1.6,4:0,1,0;film&sweep=hero/*&margin=0.1&round=r1&compare=r0&tolerance=3`,
    "from=1&to=2.5&rate=10&passes=normal,depth&longest=2576&smallest=256&reduction=nearest",
  ];
  const requests: IAutoMovieCapturePlanRequest[] = texts.map(
    (text: string): IAutoMovieCapturePlanRequest =>
      parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
  );

  // 1. Address round trip and readability.
  for (const request of requests) {
    const address: string = formatAutoMovieInspectorAddress(request);
    TestValidator.equals(`${address} reads back`, readAutoMovieInspectorAddress(address), request);
    TestValidator.predicate(`${address} keeps separators readable`, !/%2C|%3A|%3B|%2F|%40|%3D/u.test(address));
  }
  const second: string = formatAutoMovieInspectorAddress(requests[1]!);
  TestValidator.predicate("the subject's &, space and quote are escaped", second.includes("subject=a%26b%20c's"));
  TestValidator.predicate("views stay readable", second.includes("views=front@ortho@focus=hero/arm;-1,1.6,4:0,1,0;film"));
  TestValidator.predicate("a colour pair keeps its =", formatAutoMovieInspectorAddress(requests[0]!).includes("color=hero/arm=ff8800"));

  // 2. Empty request and leading question mark.
  const empty: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress("");
  TestValidator.equals("the empty request is the empty address", formatAutoMovieInspectorAddress(empty), "");
  TestValidator.equals("a leading ? is accepted", readAutoMovieInspectorAddress(`?${texts[2]!}`), requests[2]!);

  // 3. Refusals.
  for (const [text, key] of [["colour=1", "colour"], ["views=", "views"]] as const)
    TestValidator.predicate(`${text} is refused naming ${key}`, refusal((): void => {
      readAutoMovieInspectorAddress(text);
    }).includes(key));

  // 4. The command reads back through the command's reader and splits back as a shell splits it.
  for (const request of requests) {
    const command: { options: string[]; text: string } = formatAutoMovieInspectorCommand(request);
    TestValidator.equals(
      `${command.text} reads back`,
      parseAutoMovieCapturePlanRequest(readAutoMovieCaptureArguments(command.options)),
      request,
    );
    TestValidator.equals(`${command.text} splits back`, split(command.text), ["automovie", "capture", ...command.options]);
  }
  TestValidator.predicate(
    "an argument holding a quote is quoted",
    formatAutoMovieInspectorCommand(requests[1]!).text.includes(`'--subject=a&b c'\\''s'`),
  );

  // 5. Views written by the panel read back.
  const views: IAutoMovieInspectionView[] = [
    { type: "film" },
    { type: "fixed", position: { x: -0.5, y: 1.6, z: 1e-7 }, target: { x: 0, y: 1, z: 0 } },
    { type: "named", name: "front", orthographic: false, focus: null },
    { type: "named", name: "three-quarter", orthographic: true, focus: null },
    { type: "named", name: "side", orthographic: false, focus: { type: "pattern", pattern: "hero/*" } },
    { type: "named", name: "top", orthographic: false, focus: { type: "flagged" } },
    { type: "named", name: "front", orthographic: true, focus: { type: "pattern", pattern: "hero/arm" } },
  ];
  for (const view of views) {
    const text: string = formatAutoMovieInspectorView(view);
    TestValidator.equals(`${text} reads back`, parseAutoMovieInspectionView(text), view);
  }
}

/** The message a call throws, or the empty string when it does not throw. */
function refusal(call: () => void): string {
  try {
    call();
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Split a command line into words as a POSIX shell splits plain and single-quoted words. */
function split(text: string): string[] {
  const words: string[] = [];
  let word: string | null = null;
  let quoted: boolean = false;
  let escaped: boolean = false;
  for (const character of text) {
    if (escaped) {
      word = (word ?? "") + character;
      escaped = false;
    } else if (quoted) {
      if (character === "'") quoted = false;
      else word += character;
    } else if (character === "'") {
      quoted = true;
      word ??= "";
    } else if (character === "\\") escaped = true;
    else if (character === " ") {
      if (word !== null) words.push(word);
      word = null;
    } else word = (word ?? "") + character;
  }
  if (word !== null) words.push(word);
  return words;
}
