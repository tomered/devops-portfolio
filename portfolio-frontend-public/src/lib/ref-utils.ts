
import { RefObject } from "react";

// Helper function to safely cast refs between HTMLElement and HTMLDivElement
export function castToHTMLDivRef<T extends HTMLElement>(ref: RefObject<T>): RefObject<HTMLDivElement> {
  return ref as unknown as RefObject<HTMLDivElement>;
}
