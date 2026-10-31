import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li",
  "h3", "h4", "h5", "span", "div", "table", "thead", "tbody", "tr", "td", "th",
];

/**
 * Sanitize API-provided HTML for the Terms & Conditions box.
 * Only basic formatting tags survive; no attributes, no links, no images.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["a", "img", "script", "style", "iframe", "video", "audio", "form"],
    FORBID_ATTR: ["href", "src", "style", "class", "id", "onclick", "onerror"],
  });
}
