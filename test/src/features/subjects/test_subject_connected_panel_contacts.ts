import type { IAutoMovieModelCrossing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

const crossing = (
  part: string,
  other: string,
  triangles: number,
): IAutoMovieModelCrossing => ({
  part,
  other,
  triangles,
  otherTriangles: triangles,
  coplanar: 0,
});

/**
 * The contact check reads a pose against the source neutral, not against zero.
 *
 * A layered face rests with its shells inside each other on purpose, so the
 * absolute count does not establish anatomical validity. Comparing counts with
 * the source neutral reports a numerical difference, not penetration depth. The
 * fixture hands out readings by document, so every expected sentence here
 * follows from the two readings rather than from what the panel happens to
 * print.
 *
 * Scenarios:
 * 1. Nothing beyond the rest reading is reported as such, and the rest count is stated so it is not mistaken for zero.
 * 2. New pairs, increased counts and their combination are reported without claiming greater penetration depth.
 * 3. Ordinary builds ask for no reading; the check asks, and reuses the rest reading it already took.
 * 4. A build that supplies no reading says so rather than reporting clear.
 * 5. Measuring leaves the committed document and the editor history untouched.
 */
export const test_subject_connected_panel_contacts =
  async (): Promise<void> => {
    const rest = [
      crossing("skin", "eyes", 400),
      crossing("teeth", "tongue", 10),
    ];
    let posed = [
      crossing("skin", "eyes", 400),
      crossing("teeth", "tongue", 25),
      crossing("skin", "teeth", 7),
    ];
    const f = connectedPanelFixture({
      crossings: (document) =>
        Object.keys(document.expression).length === 0 ? rest : posed,
    });
    await f.panel.ready;
    const committed = f.panel.snapshot()!.document;

    await f.click("face-contacts");
    TestValidator.equals(
      "a pose matching rest reports nothing new and states the rest count",
      f.element("face-status").textContent,
      "No new intersecting pairs or increased triangle counts relative to the source neutral. Source neutral: 2 intersecting pairs. Counts do not measure penetration depth or anatomical validity.",
    );
    TestValidator.equals(
      "the mount build asks for no reading and the check asks for two",
      f.measurements,
      [false, true, true],
    );
    TestValidator.equals(
      "measuring does not disturb the committed document",
      f.panel.snapshot()!.document,
      committed,
    );

    await f.change("control-kind", "expression");
    await f.change("control-lift", "0.5");
    const edited = f.panel.snapshot()!.document;
    await f.click("face-contacts");
    TestValidator.equals(
      "new pairs and increased triangle counts are named separately",
      f.element("face-status").textContent,
      "New intersecting pairs: skin x teeth 7/7\nIncreased triangle counts: teeth x tongue 25/25\nSource neutral: 2 intersecting pairs. Counts do not measure penetration depth or anatomical validity.",
    );
    TestValidator.equals(
      "the rest reading is taken once and reused, so the edit and the second check add one each",
      f.measurements,
      [false, true, true, false, true],
    );
    TestValidator.equals(
      "an edit survives the measurement",
      f.panel.snapshot()!.document,
      edited,
    );
    posed = [crossing("teeth", "tongue", 25)];
    await f.click("face-contacts");
    TestValidator.equals(
      "increased counts alone do not imply a new pair",
      f.element("face-status").textContent,
      "Increased triangle counts: teeth x tongue 25/25\nSource neutral: 2 intersecting pairs. Counts do not measure penetration depth or anatomical validity.",
    );
    posed = [crossing("skin", "teeth", 7)];
    await f.click("face-contacts");
    TestValidator.equals(
      "new pairs alone do not imply an increase on an existing pair",
      f.element("face-status").textContent,
      "New intersecting pairs: skin x teeth 7/7\nSource neutral: 2 intersecting pairs. Counts do not measure penetration depth or anatomical validity.",
    );
    TestValidator.predicate(
      "undo still reaches the state before that edit",
      f.panel.snapshot()!.canUndo,
    );
    f.dom.window.close();

    const silent = connectedPanelFixture();
    await silent.panel.ready;
    await silent.click("face-contacts");
    TestValidator.equals(
      "a build with no reading says so rather than reporting clear",
      silent.element("face-status").textContent,
      "This build does not supply a crossing reading.",
    );
    TestValidator.equals(
      "a silent build leaves the document committed",
      silent.panel.snapshot()!.document,
      silent.document,
    );
    silent.dom.window.close();
  };
