import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Authored sign semantics accompany metric endpoint effects without changing edits.
 * Scenarios:
 * 1. A supplied shape description is literal text, including markup characters.
 * 2. An omitted expression description retains its independently measured scale.
 * 3. Returning after an edit preserves the description and saved numerical weight.
 */
export const test_subject_connected_panel_channel_description =
  async (): Promise<void> => {
    const source = humanFaceBasisFixture();
    const description =
      "Negative narrows; positive widens. <b>Authored range.</b>";
    source.basis.channels[0].description = description;
    const f = connectedPanelFixture({ source });
    await f.panel.ready;
    TestValidator.equals(
      "literal sign meaning precedes metric scale",
      f
        .element("scale-width")
        .textContent?.startsWith(description + " · +1 moves"),
      true,
    );
    TestValidator.equals(
      "description is not HTML",
      f.element("scale-width").querySelector("b"),
      null,
    );
    await f.change("control-kind", "expression");
    TestValidator.equals(
      "absent description still states metric effect",
      f.element("scale-lift").textContent,
      "+1 moves 422.58 mm rms, 1000.00 mm peak on 2 vertices",
    );
    await f.change("control-kind", "shape");
    await f.change("control-width", "0.5");
    TestValidator.equals(
      "description survives commit",
      f.element("scale-width").textContent?.startsWith(description),
      true,
    );
    TestValidator.equals(
      "numerical edit remains authoritative",
      f.panel.snapshot()!.document.shape.width,
      0.5,
    );
    f.dom.window.close();
  };
