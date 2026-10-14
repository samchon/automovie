# @automovie/ingest

Brings external media into AutoMovie's types, deterministically: glTF, GLB, and VRM documents become models, skeletons, and clips, and RIFF/WAVE audio becomes observed source facts with a finite sample buffer. The same bytes always produce the same records.

It reads only the bytes a host hands it. Files, downloads, browsers, mixing, and delivery checks belong to the host, `engine`, and `production`.

## Use

```bash
npm install @automovie/ingest
```

| Callable | Purpose |
| --- | --- |
| `inspectAutoMovieExternalModelBytes` | Validate glTF, GLB, or VRM bytes against a closed ingest profile, with their exact sidecars |
| `ingestDocument`, `humanoidSkeleton` | Convert a parsed document into models, skeletons, and clips |
| `decodeProductionAudioAsset` | Decode RIFF/WAVE bytes into observed format facts and a mono sample buffer |

A structural defect, such as an unknown attached bone, is refused with its cause; nothing is guessed or substituted.
