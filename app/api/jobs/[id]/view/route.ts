// File: app/api/jobs/[id]/view/route.ts
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
  }

  if (!/^\d{1,10}$/.test(id)) {
    return NextResponse.json({ counted: false }, { status: 400 });
  }

  // Same default host as lib/api.ts when API_BASE_URL is not set.
  const apiBaseUrl = (process.env.API_BASE_URL || 'https://jobs.kazitechsolutions.com/api/v1').replace(/\/+$/, '');

  let installationId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.installation_id === 'string') {
      installationId = body.installation_id;
    }
  } catch {
    // Ignore invalid JSON body
  }

  try {
    const backendRes = await fetch(`${apiBaseUrl}/jobs/${encodeURIComponent(id)}/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        platform: 'web',
        ...(installationId ? { installation_id: installationId } : {}),
      }),
    });

    if (!backendRes.ok) {
      return NextResponse.json({ counted: false }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[View Counter Route Error for job ${id}]:`, err);
    return NextResponse.json({ counted: false }, { status: 500 });
  }
}
