# Kickboxing acceptance

The film's delivery checklist and the results observed on the actual Viewer, stills and render. Logic units run separately through `pnpm --filter kickboxing test`; nothing here is a unit test.

## Checklist {#checklist}

| Check | Method | Result |
| --- | --- | --- |
| The Viewer mounts the film, reports no legality violation and no outcome-audit finding | Load `http://127.0.0.1:5199/` and read `window.__afReport()` | Pending |
| Exchanges read with rig guides: strikes reach the receiver's region or defending limb, both guard sides | Stills with `?rig=1` at exchange contacts | Pending |
| Kick guard on both sides through chamber, delivery, recoil and replant | Stills of A's and B's round kicks | Pending |
| The Brazilian kick: chamber, turnover, descending contact behind B's left ear at 150.000 | Stills at 149.75, 149.9 and 150.0 | Pending |
| Fall onto the right side, neutral corner, count, knockout, celebration | Stills at 151.6, 157, 162, 167.6, 172 | Pending |
| The referee is never idle and never between the fighters; the camera reframes | Stills across the round | Pending |
| Full render: 1280x720, 30 fps, 5400 frames, 180 s, with audio | `pnpm --filter kickboxing render --film kickboxing http://127.0.0.1:5199/` and the complete decode | Pending |
| Listening: bell, referee commands and count, contact sounds only on contacts | Listen to the delivered file | Pending |
