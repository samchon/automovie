# Stock court possession

A ten-second silent basketball scene with five fictional athletes on each side. The mounted film reads the stock ball, actor, dribble, staged catch, shot and vertical-contest owners at their native times. Read [the brief](brief.md) before [the screenplay](screenplay.md).

## Replay in an installed production

Use the SDK revision exposing `AutoMovieMotionHumanThrowCatch.dribblePush` and `AutoMovieMotionHumanJump.verticalContest`. Use its normal generated production and dependency install. For an unreleased revision, install the SDK archives built from that revision and pin the archive set with the existing [installed integration recipe](../e2e-template/run.mjs). Keep the archive identities with the playback receipt.

From the SDK checkout, create a production in a fresh directory and copy the source into its ordinary composition tree.

```powershell
$repo = (Get-Location).Path
$example = Join-Path $repo 'experimental/stock-court-possession'
$production = Join-Path $repo 'test/bin/stock-court-scaffold'
pnpm automovie create $production --name stock-court-scaffold

$scene = Join-Path $production 'src/composition/scenes/stock-court-possession/001-court'
$brief = Join-Path $production 'docs/body/brief/court'
$script = Join-Path $production 'docs/body/screenplay/stock-court-possession'
foreach ($directory in @($scene, $brief, $script)) {
  [void][IO.Directory]::CreateDirectory($directory)
}
Copy-Item -LiteralPath (Join-Path $example 'stage.ts') -Destination $scene
Copy-Item -LiteralPath (Join-Path $example 'verify.ts') -Destination $scene
Copy-Item -LiteralPath (Join-Path $example 'film.ts') -Destination (Join-Path $production 'src/composition/films/stock-court-possession.ts')
Copy-Item -LiteralPath (Join-Path $example 'brief.md') -Destination (Join-Path $brief 'court.md')
Copy-Item -LiteralPath (Join-Path $example 'screenplay.md') -Destination (Join-Path $script '001-court.md')
Copy-Item -LiteralPath (Join-Path $repo 'test/src/features/internal/fixtures/humans/m-average.json') -Destination (Join-Path $scene 'body.json')
Copy-Item -LiteralPath @(
  (Join-Path $repo 'test/src/features/internal/people/M_AVERAGE.ts'),
  (Join-Path $repo 'test/src/features/internal/people/IMotionHumanPerson.ts')
) -Destination $scene
```

The exact body snapshot has SHA-256 `53ae459c8c39ec695ec89b4884fbcf3aa2286d9a2d4d3a17825f9442ad163627`. The stage compares the regenerated bind with it before solving either version.

Import `film` from `./stock-court-possession` in the generated `src/composition/films/index.ts` and add `"stock-court-possession": film()` to the existing registry. The inspector, capture and render already read that registry. For the separately staged rebound, use `film("recovery")` and select the same route in the checks below. Keep distinct capture, delivery and review records for the two versions.

## Register the source checks

Add the subject to the generated `src/executable/check.ts`. These measurements read the physical source. The delivered artifact has its own framing, frame and playback review.

```ts
import type { IAutoMovieProductionCheck } from "@automovie/interface";

import { verify } from "../composition/scenes/stock-court-possession/001-court/verify";

const scene = "src/composition/scenes/stock-court-possession/001-court";
const source = `${scene}/verify.ts`;
const items = [
  source,
  `${scene}/stage.ts`,
  `${scene}/body.json`,
  `${scene}/M_AVERAGE.ts`,
  `${scene}/IMotionHumanPerson.ts`,
  "pnpm-lock.yaml",
];
const targets: readonly IAutoMovieProductionCheck[] = [{
  id: "stock-court-possession",
  checks: [
    {
      id: "cast-and-cues",
      title: "Ten actors resolve with every launch, catch and score",
      scope: "The complete source cut",
      kind: "measure",
      source,
      inputs: items,
      unit: "actors",
      minimum: 10,
      maximum: 10,
      measure: () => verify().cast,
    },
    {
      id: "body-bounds",
      title: "All performers meet the native body bounds",
      scope: "Every performer over the complete source cut",
      kind: "measure",
      source,
      inputs: items,
      unit: "findings",
      minimum: 0,
      maximum: 0,
      measure: () => verify("score", true).body!.findings.length,
    },
  ],
}];

export default targets;
```

Run the checks and render from the production after installing the pinned dependencies.

```powershell
Set-Location -LiteralPath $production
pnpm install
pnpm run lint
pnpm run check --subject stock-court-possession --only cast-and-cues --run --json
pnpm run check --subject stock-court-possession --only body-bounds --run --json
pnpm run review:setup
pnpm run capture --subject stock-court-possession --from 0 --to 10 --rate 24 --out .cache/court-capture
pnpm run render --subject stock-court-possession --out .cache/court-render
```

Read the capture record and decoded output across the full cut. Check at least 100 distinct decoded pictures and inspect the dribble, gather, pass, catch, defender's take-off and landing, shot, ring passage and floor rebound. Give the exact delivered movie to an independent reviewer for one uninterrupted 1x playback. Record their own observation with `automovie review --file <published-film> --from 0 --to 10 --note <observation> --reviewer <reviewer> --decision <decision> --viewed playback`. Keep the exact movie hash, frame ranges and review record with that delivery.

## Reference clocks

The new source takes raw seconds 0.65 through 10.65. Delivery second 0 begins after the initial grip. The score route has two dribble releases, a real two-hand moving gather, a chest pass and catch, a vertical contest and a separate shot. The ball crosses down through the opening at delivery second 8.507847 and first meets the floor at 8.970161. The recovery route adds real two-hand custody at 9.257847 and secures it at 9.407847. Use `verify` for current exact cues.

The first reviewed camera uses a 40-degree field of view from (9.8, 4.5, 7.2), looking at (0.05, 1.55, 2.65), in metres. The recorded reference encode has 240 frames at 960 by 540 and 24 fps, with SHA-256 `8df881d78b82f1e485a401f4102471d115e0c9322ad0c1a915c4d2e000f2b374`. The review examined 175 decoded pictures. The original source paired with that encode had six body-bound findings. Run the body check again on the source used for a new encode and record that delivery's hash and review.

The earlier independent commission used SDK `f90fd2707851bd753c0c5906adfd3b9aaf544b36` and stopped after seven admitted performers. Its issue records the original cast, failed fitting and earlier delivery boundary. [Original commission and issue](https://github.com/samchon/automovie/issues/4276)
