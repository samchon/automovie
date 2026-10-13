# @automovie/human

Builds human figures numerically. Body, face and person documents are JSON numbers over a basis the caller supplies; the package evaluates them into geometry, skeletons, skin, hair and measurements, and exports the result as GLB or glTF. It ships no basis, mesh or person data.

## Use

```bash
npm install @automovie/human
```

| Module | Owns |
| --- | --- |
| `body` | Body dimensions, skeleton, skin, tissue and measurements |
| `face` | Facial anatomy, expression, skin, eyes, hair and eyebrows |
| `human` | Composition of a face and body into a person, and whole-person measurement and solving |
| `common` | Shared geometry, colour, document and static export |

Resident runtimes keep one admitted basis and the last evaluated document across preview, measurement, construction and export requests: `face/runtime/createConnectedFaceRuntime`, `body/runtime/createConnectedBodyRuntime` and `human/runtime/createConnectedPersonRuntime`. The host supplies the worker transport and display; `@automovie/viewer` provides both for the browser.

A target the basis cannot reach, such as a stature or joint angle outside its measured range, is refused with the reach rather than clamped. Numerical construction does not establish visual quality or likeness; judge those in the rendered figure.

## Build

`pnpm --filter @automovie/human build` emits Node CommonJS and browser ESM output into a staging directory and replaces `lib` only after both passes succeed, so a failed build leaves the previous output in place.
