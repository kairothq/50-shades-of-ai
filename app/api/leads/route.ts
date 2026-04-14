// GET /api/leads?secret=YOUR_SECRET
//
// Admin endpoint to list all collected leads from the Notion database.
// Requires NOTION_API_TOKEN, NOTION_LEADS_DB_ID, and LEADS_ADMIN_SECRET env vars.

import { NextRequest, NextResponse } from "next/server";

interface NotionTextContent {
  plain_text: string;
}

interface NotionPage {
  properties: {
    Email: { title: NotionTextContent[] };
    Weight: { number: number | null };
    Height: { number: number | null };
    Age: { number: number | null };
    Gender: { select: { name: string } | null };
    "Maintenance Calories": { number: number | null };
    "Daily Target": { number: number | null };
    "Submitted At": { date: { start: string } | null };
    Source: { select: { name: string } | null };
  };
}

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

  const token = process.env.NOTION_API_TOKEN;
  const dbId = process.env.NOTION_LEADS_DB_ID;

  if (!token || !dbId) {
    return NextResponse.json(
      { error: "Notion env vars not configured." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [
            {
              property: "Submitted At",
              direction: "descending",
            },
          ],
          page_size: 100,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[FoodOS] Notion query error:", res.status, err);
      return NextResponse.json(
        { error: "Failed to fetch leads from Notion." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const leads = data.results.map((page: NotionPage) => ({
      email:
        page.properties.Email?.title?.[0]?.plain_text ?? "",
      weight: page.properties.Weight?.number ?? null,
      height: page.properties.Height?.number ?? null,
      age: page.properties.Age?.number ?? null,
      gender: page.properties.Gender?.select?.name ?? null,
      maintenanceCalories:
        page.properties["Maintenance Calories"]?.number ?? null,
      dailyTarget:
        page.properties["Daily Target"]?.number ?? null,
      submittedAt:
        page.properties["Submitted At"]?.date?.start ?? null,
      source: page.properties.Source?.select?.name ?? null,
    }));

    return NextResponse.json({
      count: leads.length,
      leads,
    });
  } catch (err) {
    console.error("[FoodOS] Failed to query leads:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
