/** Replaces the one exact occurrence of `search` in `source` with `replace`. */
export function applyEdit(source: string, search: string, replace: string): string {
  const firstIndex = source.indexOf(search);
  if (firstIndex === -1) {
    throw new Error("`search` was not found in the current source.");
  }
  const lastIndex = source.lastIndexOf(search);
  if (firstIndex !== lastIndex) {
    throw new Error("`search` matches more than once; make it more specific.");
  }

  return source.slice(0, firstIndex) + replace + source.slice(firstIndex + search.length);
}
