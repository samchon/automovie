import { TestValidator } from "@nestia/e2e";

import type { HumanViewerCatalogue } from "../../../scripts/human-viewer/HumanViewerCatalogue";
import { changeHumanViewerParts } from "../../../scripts/human-viewer/changeHumanViewerParts";
import { describeHumanViewerDocuments } from "../../../scripts/human-viewer/describeHumanViewerDocuments";
import { filterHumanViewerIndex } from "../../../scripts/human-viewer/filterHumanViewerIndex";
import { neighbourHumanViewerDocument } from "../../../scripts/human-viewer/neighbourHumanViewerDocument";
import { openHumanViewerHref } from "../../../scripts/human-viewer/openHumanViewerHref";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { throwsError } from "../internal/predicates";

type Entry = HumanViewerCatalogue["documents"][number];
// Only the fields the index reads are given; the rest of a document is not its concern.
const face = (id: string, name?: string): Entry =>
  ({ id, domain: "face", key: id, document: { id, name, expression: {} } }) as unknown as Entry;
const body = (name: string, rest: Record<string, unknown>): Entry =>
  ({ id: "body:" + name, domain: "body", key: name, document: { id: "body:" + name, name, shape: {}, pose: [], ...rest } }) as unknown as Entry;

/**
 * The index lists every document, filters them, and opens each with one link.
 *
 * Scenarios:
 * 1. Faces are listed by name (else id), body states by what they vary
 *    (neutral, age, sex, build, pose) judged from their content, and a
 *    `file:` input as a local input with its name.
 * 2. The filter matches every word in the label, id or section without case,
 *    keeps the order, and restricts to a domain.
 * 3. Stepping wraps at both ends, starts from an end for an unknown current
 *    document, and refuses an empty list.
 * 5. A part is switched into or out of the isolated or hidden set once, in
 *    order, leaving the rest of the address alone, and the sheet link asks for
 *    the eight views of the same frame.
 * 4. The view link, the render request and the thumbnail carry one address:
 *    the thumbnail is the same document as a small clay frame, an override
 *    reaches all three, and the link parses back to the address.
 */
export const test_human_viewer_index = (): void => {
  const entries = describeHumanViewerDocuments({
    documents: [
      face("connected-reference", "CC0 connected reference"),
      face("anon"),
      body("neutral", { shape: {} }),
      body("child", { shape: { macroAge: -1 } }),
      body("female", { shape: { macroGender: -1 } }),
      body("heavy", { shape: { macroWeight: 1 } }),
      body("arms", { pose: [], shoulders: [{}] }),
      body("sitting", { pose: [{}] }),
      face("file:mine"),
    ],
  });
  TestValidator.equals(
    "sections",
    entries.map((entry) => entry.section),
    ["Face", "Face", "Body neutral", "Body age", "Body sex", "Body build", "Body pose", "Body pose", "Local input"],
  );
  TestValidator.equals(
    "labels",
    entries.map((entry) => entry.label).filter((_, index) => index === 0 || index === 1 || index === 8),
    ["CC0 connected reference", "anon", "mine"],
  );
  const ids = (text: string, domain: "all" | "face" | "body") =>
    filterHumanViewerIndex(entries, { text, domain }).map((entry) => entry.id);
  TestValidator.equals("everything", ids("  ", "all").length, 9);
  TestValidator.equals("case and word", ids("BODY pose", "all"), ["body:arms", "body:sitting"]);
  TestValidator.equals("domain", ids("", "face"), ["connected-reference", "anon", "file:mine"]);
  TestValidator.equals("both", ids("nothing", "all"), []);
  const list = ["a", "b", "c"];
  TestValidator.equals("next", neighbourHumanViewerDocument(list, "a", 1), "b");
  TestValidator.equals("wrap forward", neighbourHumanViewerDocument(list, "c", 1), "a");
  TestValidator.equals("wrap back", neighbourHumanViewerDocument(list, "a", -1), "c");
  TestValidator.equals("unknown forward", neighbourHumanViewerDocument(list, "z", 1), "a");
  TestValidator.equals("unknown back", neighbourHumanViewerDocument(list, "z", -1), "c");
  TestValidator.predicate("empty", throwsError(() => neighbourHumanViewerDocument([], "a", 1), "no document"));
  const href = openHumanViewerHref("body:neutral", { view: "left" });
  TestValidator.equals(
    "link parses back",
    parseHumanViewerAddress(href.view.slice("/view#".length)).doc,
    "body:neutral",
  );
  TestValidator.equals("render", href.render.startsWith("/render?doc=body%3Aneutral&view=left&pass=beauty"), true);
  const thumbnail = parseHumanViewerAddress(href.thumbnail.slice("/render?".length));
  TestValidator.equals("thumbnail", [thumbnail.doc, thumbnail.view, thumbnail.pass, thumbnail.size], ["body:neutral", "left", "clay", 160]);
  const base = parseHumanViewerAddress("doc=a&view=left");
  const isolated = changeHumanViewerParts(
    changeHumanViewerParts(base, "eye", "parts", true),
    "lid",
    "parts",
    true,
  );
  TestValidator.equals("isolated", isolated.parts, ["eye", "lid"]);
  TestValidator.equals("once", changeHumanViewerParts(isolated, "eye", "parts", true).parts, ["lid", "eye"]);
  TestValidator.equals("off", changeHumanViewerParts(isolated, "eye", "parts", false).parts, ["lid"]);
  TestValidator.equals("hidden set", changeHumanViewerParts(base, "hair", "hide", true).hide, ["hair"]);
  TestValidator.equals("rest kept", changeHumanViewerParts(base, "hair", "hide", true).view, "left");
  TestValidator.equals("empty", changeHumanViewerParts(changeHumanViewerParts(base, "x", "hide", true), "x", "hide", false).hide, []);
  TestValidator.equals("sheet", href.sheet.includes("axes=view%3Afront%2Cleft-three-quarter%2Cleft%2Cback%2Cright-three-quarter%2Cright%2Ctop%2Cbottom"), true);
};
