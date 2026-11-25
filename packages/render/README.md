# @automovie/render

Draw AutoMovie scenes and plan captures and video exports. Use the `automovie` CLI for its built-in browser and FFmpeg hosts or supply your own host to the library.

## Start

Use Node.js 22.23.2 or later for Node hosts.

```powershell
npm install @automovie/render
```

### The draw-only page

Use `installAutoMovieDraw` in a browser page over the same `IAutoMovieDrawSubject` records your inspector uses. `AutoMovieDrawSession` lets a host describe a subject, draw a planned still or draw a delivery frame. If you import Three.js in the host, use the same version as the render package.

## Capture

`planAutoMovieCapture` turns the subject and request into cells. `runAutoMovieCapture` draws them with your host and writes stills, contact sheets and `record.json`. Use `renderAutoMovieDrawnVideo` to draw and encode an entire subject.

## Inspection

`parseAutoMovieInspectionRequest` reads the shared URL and CLI request. `applyAutoMovieInspection` applies the selected view and marks to a scene.

## Request keys

Use `subject` to choose a film, `at` for exact seconds, and `views` and `passes` to change what the still shows. Copy the inspector's capture command to repeat a view. See [all request keys and host options](https://github.com/samchon/automovie/blob/master/packages/render/docs/capture-requests.md).
