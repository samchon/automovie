# Assembly and handoff

Turn the composed scenes or accepted takes into the complete delivered video. Read [project context](project-context.md), the actual source and media and the installed packages' documentation.

## Assemble

Each screenplay film folder becomes one film under [source layout](../development/source-layout.md#source), and every scene file, section and beat reaches it through the scene composition that cites it; resolve missing, duplicated or omitted material before rendering. A motion hint or direct 3D film assembles its programmed scenes, a generated film its [accepted takes](../video/generation.md), and control channels keep their meaning through the [control channels](../motion/control-channels.md) rules.

Assembly decides nothing. The screenplay owns the order of scenes, the cuts, transitions, pauses and titles, and the [composition contract](../contracts/development/composition.md#screenplay-realization) holds the film to them. When the assembled film shows that a decision does not work, repair the screenplay under [upstream repair](../story/correction/repair.md) and realize the repair, because a trim or reorder made here leaves a film that no longer realizes the screenplay it cites.

[Frame evaluation](../motion/frame-evaluation.md) owns frame schedules and the checks at both sides of every cut.

## Render

Before scaling a new host, run one small path through capture or take ingestion, a join and the encoded file, and inspect stills extracted from that file. Then make the single [delivery render](stage-caches.md#render-the-whole-film-once) of the complete scope, with the README's render command for a drawn film and the installed renderer's sequence and caption APIs for takes, captions or audio tracks, at the delivery profile [project context](project-context.md) records, and measure the file's actual profile and extent against it.

## Repair and deliver

Route defects to their owners: entity form to [entity work](../development/entities.md), performance and clocks to [motion](../motion/SKILL.md), sound to [audio](../audio/SKILL.md), takes to [video generation](../video/generation.md), host and source to [development](../development/SKILL.md) and narrative to [upstream repair](../story/correction/repair.md). Rebuild the affected outputs and inspect them again.

Hand off, without credentials:

- the accepted output revision and its media identities;
- the fixed inputs, source entry and dependencies;
- the commands that reproduce it;
- the checks observed, by whom, and what only the user watched or heard;
- rights and attribution, with each generation request traceable to the derivatives the film uses;
- the remaining limits.

[Delivery review](../review/delivery-review.md) accepts the result.
