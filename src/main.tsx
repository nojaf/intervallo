import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import { type Note, type Step, urlDecodeNote, urlDecodeScalePattern } from "./music.ts";

const rootElement: HTMLElement | null = document.getElementById("root");

if (rootElement !== null) {
  const params: URLSearchParams = new URLSearchParams(location.search);

  const root: Note = urlDecodeNote(params.get("root") ?? "");
  const scale: readonly Step[] = urlDecodeScalePattern(params.get("scale") ?? "");
  const noteParam: string | null = params.get("note");
  const note: Note | undefined = noteParam !== null ? urlDecodeNote(noteParam) : undefined;

  createRoot(rootElement).render(
    <StrictMode>
      <App root={root} scale={scale} note={note} />
    </StrictMode>,
  );
}
