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

  const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBaseUrl) {
    // Graceful fallback if API_BASE_URL is not set
    return NextResponse.json({ counted: false, note: 'API_BASE_URL not configured' }, { status: 200 });
  }

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
