export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const START = Date.now();

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: 'ghe-crochet',
      version: process.env.npm_package_version ?? '0.1.0',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      deployed_at: process.env.VERCEL_DEPLOYED_AT ?? new Date().toISOString(),
      env: process.env.VERCEL_ENV ?? 'development',
      uptime_s: Math.floor((Date.now() - START) / 1000),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
}
