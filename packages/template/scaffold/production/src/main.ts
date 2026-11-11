import { mountAutoMovieInspectorPage } from "@automovie/viewer";

import { subjects } from "./subjects";

// The inspector page shows the subjects `npm run capture` draws, and the page's address is its request: the page reads the address once and replaces it after every change, so a link or the capture command repeats the picture.
mountAutoMovieInspectorPage({
  root: document.getElementById("root")!,
  subjects: subjects(null),
  location: window.location,
  history: window.history,
});