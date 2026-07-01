// Canvas API helpers will move here during refactor.
export async function canvasFetch(path) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Canvas API error ${response.status}: ${response.statusText} at ${path}`);
  }

  return response.json();
}

export async function canvasFetchAll(path) {
  let url = path;
  let results = [];

  while (url) {
    const response = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Canvas API error ${response.status}: ${response.statusText} at ${url}`);
    }

    const data = await response.json();
    results = results.concat(data);

    const link = response.headers.get("Link");
    url = getNextLink(link);
  }

  return results;
}

function getNextLink(linkHeader) {
  if (!linkHeader) return null;

  for (const link of linkHeader.split(",")) {
    const parts = link.split(";");
    if (parts.length >= 2 && parts[1].trim() === 'rel="next"') {
      return parts[0].trim().slice(1, -1);
    }
  }

  return null;
}