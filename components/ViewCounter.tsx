// File: components/ViewCounter.tsx
'use client';

import { useEffect } from 'react';

function getOrCreateInstallationId(): string {
  if (typeof window === 'undefined') return '';
  const STORAGE_KEY = 'dj_session_install_id';
  try {
    let id = window.sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      // Generate a simple UUID v4
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      window.sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export default function ViewCounter({ jobId }: { jobId: number | string }) {
  useEffect(() => {
    if (!jobId) return;

    // Check if we already recorded a view for this job in the current browser session
    const viewedKey = `dj_viewed_job_${jobId}`;
    try {
      if (window.sessionStorage.getItem(viewedKey)) {
        return;
      }
    } catch {
      // Ignore sessionStorage issues (e.g. private mode restrictions)
    }

    const installationId = getOrCreateInstallationId();

    // Call same-origin route handler
    fetch(`/api/jobs/${jobId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installation_id: installationId || undefined,
      }),
    })
      .then((res) => {
        if (res.ok) {
          try {
            window.sessionStorage.setItem(viewedKey, '1');
          } catch {
            // Ignore
          }
        }
      })
      .catch((err) => {
        // Silently catch tracking errors so visitor experience is unaffected
        if (process.env.NODE_ENV === 'development') {
          console.debug('[View Counter]:', err);
        }
      });
  }, [jobId]);

  return null;
}