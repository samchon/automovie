# src/inspector/AutoMovieInspector.tsx#AutoMovieInspector

## @evidence contracts/development/common.md#meaningful-documentation

States what the component shows and how it is laid out, where its state lives and changes, how the address follows it, why a playing frame renders only the readout and a start or stop the play button too, the keys, the effect split and the StrictMode behaviour, and shows the mount.

## @evidence contracts/development/implementation.md#principled-implementation

React owns layout and dispatch only: `useReducer` holds the request, `useEffect` owns the scene's lifetime per subject and forwards each request, and the canvas is drawn by three.js outside React's render, as the campaign decides against a React scene graph.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One component composes its panels and passes the host's optional command prefix through to the request panel. The reducer owns request changes and the mount owns scene changes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No panel writes the scene, and a scene refusal is answered by restoring the request, never by drawing a picture the address does not name.

## @evidence contracts/development/implementation.md#efficient-algorithms

A dispatched edit renders the panels once and re-applies the inspection only when its text changed; a playing frame renders the readout alone, and a start or stop the play button too.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mount, its renderer and its instance live while the subject stays; a request change reuses them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The component owns one playhead and at most one mount at a time, disposed by the effect cleanup when the subject changes or the component unmounts, and keeps at most INCIDENT_LIMIT incidents, cleared with the mount.
