import type { IAutoMovieVerification } from "automovie";

/** The director's checks for the installed fixture's delivery. */
export const checks = [
  {
    id: "installed-parity",
    checks: [
      {
        kind: "delivery",
        id: "published",
        title: "Confirm published bytes",
        scope: "Completed film and depth guide pass",
        subject: "installed-parity",
        // Check the actual MP4 bytes and the depth channel written beside it.
        // Draw capture stills can guide corrections during a blocked delivery.
        report: ".cache/e2e-delivery-parity/render-report.json",
        controls: ["depth"],
      },
    ],
    required: { handoff: ["published"] },
  },
] satisfies readonly IAutoMovieVerification[];
