/** Legacy addresses exercised against the published catalogue and its viewer. */
export const archetypeSmokeCases = [
  {
    name: "the old camera variant opens the named camera and keeps its seed",
    path: "archetypes/?subject=createDevice&variant=camera&seed=7",
    arrives: "archetypes/?subject=createCamera&seed=7",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      'aside[aria-label="Details"] td:text-is("thickness")',
      'a[href$="/scenes/snapshot/"]:text-is("Snapshot")',
    ],
    lacks: [".am-viewport-error"],
    contexts: 1,
  },
  {
    name: "the old quadruped address opens the horse and keeps its seed",
    path: "archetypes/?subject=createQuadruped&variant=horse&seed=7",
    arrives: "archetypes/?subject=createHorse&seed=7",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      'aside[aria-label="Details"] td:text-is("withersHeight")',
    ],
    lacks: [".am-viewport-error"],
    contexts: 1,
  },
  {
    name: "a saved map opens the folded paper format",
    path: "archetypes/?subject=createStationery&variant=map&seed=7",
    arrives: "archetypes/?subject=createPaper&variant=foldedMap&seed=7",
    shows: [
      '.am-viewport[aria-busy="false"] canvas',
      'aside[aria-label="Details"] .am-label:text-is("Format")',
    ],
    lacks: [".am-viewport-error"],
    contexts: 1,
  },
];
