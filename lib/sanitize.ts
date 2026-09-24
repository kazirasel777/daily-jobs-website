import sanitizeHtml from 'sanitize-html';

/** Keep editorial formatting while removing scripts, event handlers and unsafe links. */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a',
    ],
    allowedAttributes: { a: ['href'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}
