import { NextResponse } from 'next/server';
import { getClient } from '@/lib/elasticsearch';

const INDEX = 'horizon-hotels';

export async function DELETE() {
  if (process.env.ALLOW_DESTRUCTIVE_OPS !== 'true') {
    return NextResponse.json(
      { error: 'Destructive operations are disabled in this environment. Set ALLOW_DESTRUCTIVE_OPS=true to enable.' },
      { status: 403 }
    );
  }

  const es = getClient();

  try {
    const result = await es.deleteByQuery({
      index: INDEX,
      query: { match_all: {} },
      refresh: true,
    });

    return NextResponse.json({ deleted: result.deleted ?? 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
