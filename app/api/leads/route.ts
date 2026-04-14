// GET /api/leads?secret=YOUR_SECRET
//
// Admin endpoint to list all collected leads from Upstash Redis.
// Requires UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, and LEADS_ADMIN_SECRET env vars.

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const adminSecret = process.env.LEADS_ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin secret not configured." },
      { status: 500 }
    );
  }

  if (!secret || secret !== adminSecret) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json(
      { error: "Redis env vars not configured." },
      { status: 500 }
    );
  }

  try {
    const redis = new Redis({ url, token });

    const raw = await redis.lrange("foodos-leads", 0, -1);

    const leads = raw.map((entry) =>
      typeof entry === "string" ? JSON.parse(entry) : entry
    );

    return NextResponse.json({
      count: leads.length,
      leads,
    });
  } catch (err) {
    console.error("[FoodOS] Failed to read leads:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
