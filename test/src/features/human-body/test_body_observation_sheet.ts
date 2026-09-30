import { TestValidator } from "@nestia/e2e";

import { renderObservationSheet } from "../../../scripts/body-review/renderObservationSheet";

/**
 * The contact sheet lays out the run's files and escapes what comes from the
 * documents and the editor.
 *
 * Scenarios:
 * 1. Each drawn frame becomes one image with its view and pass as caption,
 *    grouped under its state.
 * 2. Refused states are listed with their reasons above the grid; with none,
 *    the section is absent.
 * 3. Negative twin: markup in a state name, a file name and a reason is
 *    escaped, so it cannot inject an element or break out of an attribute.
 * 4. The page embeds no pixel data and references only the given file names.
 */
export const test_body_observation_sheet = (): void => {
  const html = renderObservationSheet({
    title: "joint spine>chest",
    drawn: [
      { state: "neutral", view: "front", pass: "beauty", file: "a.png" },
      { state: "neutral", view: "left", pass: "normal", file: "b.png" },
      { state: "flex", view: "front", pass: "beauty", file: "c.png" },
    ],
    refused: [],
  });
  TestValidator.equals("three images", (html.match(/<img /g) ?? []).length, 3);
  TestValidator.equals("two state groups", (html.match(/<section>/g) ?? []).length, 2);
  TestValidator.predicate(
    "captions",
    html.includes("front · beauty") && html.includes("left · normal"),
  );
  TestValidator.predicate("no refused section", !html.includes("Refused"));
  TestValidator.predicate("no embedded pixels", !html.includes("data:image"));

  const hostile = renderObservationSheet({
    title: "<b>t</b>",
    drawn: [
      {
        state: "<script>x</script>",
        view: "front",
        pass: "beauty",
        file: 'a".png" onerror="x',
      },
    ],
    refused: [{ state: "<i>s</i>", reason: "a & b <u>" }],
  });
  TestValidator.predicate(
    "markup is escaped",
    !hostile.includes("<script>") &&
      !hostile.includes("<b>t") &&
      !hostile.includes('onerror="x') &&
      !hostile.includes("<i>s") &&
      !hostile.includes("<u>"),
  );
  TestValidator.predicate(
    "refused section lists the reason",
    hostile.includes("Refused by the editor") && hostile.includes("a &#38; b"),
  );
};
