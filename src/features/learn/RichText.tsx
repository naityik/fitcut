import * as React from "react";

const TOKEN = /(`[^`]+`|\*[^*]+\*)/g;

/**
 * Renders `code` and *emphasis* out of plain strings.
 *
 * The plan's copy needs a little inline markup and the source artifact carried it as raw
 * HTML. Keeping it as data instead means nothing from the constants file is ever handed
 * to dangerouslySetInnerHTML — there is no path from content to markup.
 */
export function RichText({ children }: { children: string }) {
  const parts = React.useMemo(() => children.split(TOKEN), [children]);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={i}
              className="rounded bg-protein/10 px-1 py-0.5 font-mono text-[0.85em] text-protein"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <em key={i} className="font-display italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
