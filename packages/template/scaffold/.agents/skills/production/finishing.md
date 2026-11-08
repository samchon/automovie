# Edit, render and hand off

Turn the composed scenes or accepted takes into the complete delivered video. Read [project context](profile.md), the actual source and media and the installed runtime documentation.

## Assemble

Each screenplay file becomes one film in `src/composition/films/`, and every scene and beat reaches it through the scene composition that cites it under [source layout](../development/layout.md); resolve missing, duplicated or omitted material before rendering. Render one film at a time with `npm run render -- --film <name>`. A generated film consumes [accepted takes](generation.md), a hint or direct 3D film its programmed scene output, and control channels keep their meaning through [conditioning](conditioning.md).

Give the edit one timeline owner. Choose shots, order, in/out points, transitions and pauses from the audience experience, keeping required performance and information. [Motion timing](../motion/timeline.md) owns frame schedules and replay; [audio](../audio/SKILL.md) supplies accepted recordings, and sound and captions are placed against those exact performances. A new take, trim, speed change or cut requires rechecking its timing and neighbors.

## Render

Record the delivery profile (dimensions, frame rate, container and codec, color, audio and caption tracks, loudness target, and any dialogue, music and effects stems or music-and-effects mix it requires) in [project context](profile.md). Before scaling a new host, run one small path through capture or take ingestion, a join, sound and the encoded file, and play it in the intended consumer. Then render the complete scope for delivery, reusing unchanged [stages](stages.md), and check its profile, extent, first and last material and both sides of every edit.

For imported or generated media, map decoded timestamps and time bases into the edit; a nominal frame rate cannot place an action, especially at variable rates. Trimming, retiming and rebasing are different operations, and a shortest-stream option or silent padding must not hide lost material. [FFmpeg's filters](https://ffmpeg.org/ffmpeg-filters.html) document `trim`, `setpts`, `fps` and `atempo`.

## Repair and deliver

Route defects to their owners: geometry and rendering to [3D modeling](../3d-modeling/SKILL.md), performance and clocks to [motion](../motion/SKILL.md), sound to [audio](../audio/SKILL.md), takes to [generation](generation.md), host and source to [development](../development/SKILL.md) and narrative to [upstream repair](../story/correction/repair.md). Rebuild the affected outputs and inspect them again.

Hand off the accepted output revision and media identities, fixed inputs, source entry, dependencies, reproducible commands, observed checks, rights and attribution, and remaining limits, keeping each generation request traceable to the derivatives the film uses, without credentials. A programmed hint and a generated film are separate artifacts. [Delivery review](../review/delivery.md) accepts the result.
