# @automovie/viewer

Play and inspect AutoMovie subjects in a browser. Use the inspector for a production view or the imperative mount to build your own controls.

## Start

Use ESM in your browser host and keep it on the same Three.js version as the viewer. The inspector uses React 19.

```powershell
npm install @automovie/viewer @automovie/render react@19 react-dom@19
```

## Inspector page

Call `mountAutoMovieInspectorPage` with a root element and the same subject record you give the capture host. The URL records the inspection request. The inspector displays the capture command that repeats it.

Use `AutoMovieInspector` to embed the component in a React application. Use `mountViewer` for a canvas and playback handles without React controls.

See [the generated entry point](https://github.com/samchon/automovie/blob/master/packages/template/scaffold/production/src/main.ts) and the [capture request reference](https://github.com/samchon/automovie/blob/master/packages/render/docs/capture-requests.md).
