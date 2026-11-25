import type { IAutoMovieVerification } from "automovie";

/** The director's checks for the installed fixture's delivery. */
export const checks = [
  {
    id: "installed-parity",
    checks: [
      {
        kind: "capture",
        id: "dissolve-depth",
        title: "Confirm the departing camera's depth",
        scope: "Slide occurrence 0 at output frame 5 during the dissolve",
        subject: "installed-parity",
        // The copied round includes depth and beauty in an aggregate audit.
        // This check requires current coverage for the named pass alone.
        record: ".cache/e2e-parity-capture/rounds/drawn/record.json",
        view: "film",
        pass: "depth",
        occurrence: "slide/0",
        diagnostic: { check: "installed-parity", key: "cart/5" },
        at: { second: 0.625 },
      },
      {
        kind: "delivery",
        id: "published",
        title: "Confirm published bytes",
        scope: "Published film bytes and matching depth guide record",
        subject: "installed-parity",
        // Check the actual MP4 bytes and the recorded depth channel sequence.
        // Draw capture stills can guide corrections during a blocked delivery.
        report: ".cache/e2e-delivery-parity/render-report.json",
        controls: ["depth"],
      },
    ],
    required: { handoff: ["published"] },
  },
] satisfies readonly IAutoMovieVerification[];
