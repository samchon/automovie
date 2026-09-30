import { TestValidator } from "@nestia/e2e";

import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * Malformed display requests cannot silently fall back to a different picture.
 * Scenarios:
 * 1. Unknown/repeated fields, malformed frames and invalid closed choices refuse.
 * 2. Empty, nonfinite, fractional and out-of-range values refuse at syntax admission.
 */
export function test_human_viewer_address_refusal(): void {
  const invalid = [
    "unknown=1",
    "doc=a&doc=b",
    "view=sideways",
    "pass=colour",
    "size=0",
    "size=2049",
    "size=32.5",
    "size=",
    "size=Infinity",
    "opacity=-0.1",
    "opacity=1.1",
    "opacity=NaN",
    "pitch=89.5",
    "pitch=-89.5",
    "pitch=NaN",
    "pitch=",
    "ao=true",
    "fmt=jpg",
    "ref=remote",
    "doc=",
    "doc=%20",
    "parts=",
    "parts=a,,b",
    "parts=a,%20",
    "hide=",
    "hide=a,,b",
    "zoom=0.1",
    "zoom=9",
    "frame=0,0,0",
    "frame=0,0,0,0",
    "frame=0,0,Infinity,1",
    "frame=0,,0,1",
  ];
  for (const query of invalid) {
    let refused = false;
    try {
      parseHumanViewerAddress(query);
    } catch {
      refused = true;
    }
    TestValidator.predicate("refuses " + query, refused);
  }
}
