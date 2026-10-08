import sanitizeHtml from 'sanitize-html';

/** Keep editorial formatting while removing scripts, event handlers and unsafe links. */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 'sub', 'sup',
      'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4', 'h5',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a',
    ],
    allowedAttributes: { a: ['href', 'rel', 'target'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      // Outbound links in circular text open in a new tab and pass no ranking signal.
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer', target: '_blank' }),
    },
  });
}
