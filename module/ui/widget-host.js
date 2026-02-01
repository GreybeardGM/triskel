const HOST_CLASS = "triskel-widget-host";

/**
 * Shared host for fixed-position widgets (e.g. difficulty + complication).
 * Keeps the widgets aligned and provides a single mount point in the DOM.
 */
export function getWidgetHost(root = document) {
  const existingHost = root.querySelector(`.${HOST_CLASS}`);
  if (existingHost) return existingHost;

  const body = root?.body ?? document.body;
  if (!body) return null;

  const host = document.createElement("div");
  host.className = `triskel ${HOST_CLASS}`;
  body.append(host);
  return host;
}
