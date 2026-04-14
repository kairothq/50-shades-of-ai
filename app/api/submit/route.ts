// FoodOS Calorie Calculator - Lead Storage via Notion
//
// Setup:
// 1. Create a Notion integration at https://www.notion.so/my-integrations
// 2. Create a Notion database with these properties:
//    - Email (title)
//    - Weight (number)
//    - Height (number)
//    - Age (number)
//    - Gender (select: "male", "female")
//    - Maintenance Calories (number)
//    - Daily Target (number)
//    - Submitted At (date)
//    - Source (select: "foodos-calculator")
// 3. Share the database with your integration
// 4. Set these env vars in .env.local:
//    NOTION_API_TOKEN=<your integration token>
//    NOTION_LEADS_DB_ID=<your database id>

import { NextRequest, NextResponse } from "next/server";

interface SubmitBody {
  email: string;
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
  activityLevel: number;
  desiredWeight: number;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function saveLeadToNotion(data: {
  email: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  maintenance: number;
  dailyTarget: number;
}) {
  const token = process.env.NOTION_API_TOKEN;
  const dbId = process.env.NOTION_LEADS_DB_ID;

  if (!token || !dbId) {
    console.warn("[FoodOS] Notion env vars missing, skipping lead storage");
    return;
  }

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Email: {
            title: [{ text: { content: data.email } }],
          },
          Weight: { number: data.weight },
          Height: { number: data.height },
          Age: { number: data.age },
          Gender: {
            select: { name: data.gender },
          },
          "Maintenance Calories": { number: data.maintenance },
          "Daily Target": { number: data.dailyTarget },
          "Submitted At": {
            date: { start: new Date().toISOString() },
          },
          Source: {
            select: { name: "foodos-calculator" },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[FoodOS] Notion API error:", res.status, err);
    } else {
      console.log("[FoodOS] Lead saved to Notion:", data.email);
    }
  } catch (err) {
    console.error("[FoodOS] Failed to save lead to Notion:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitBody = await request.json();

    const { email, weight, height, age, gender, activityLevel, desiredWeight } =
      body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (!weight || !height || !age || !activityLevel || !desiredWeight) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (weight <= 0 || height <= 0 || age <= 0 || desiredWeight <= 0) {
      return NextResponse.json(
        { error: "All values must be positive numbers." },
        { status: 400 }
      );
    }

    // Calculate BMR using Mifflin-St Jeor
    let bmr: number;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Maintenance calories
    const maintenance = bmr * activityLevel;

    // Weight difference
    const weightToLose = weight - desiredWeight;
    const isLosing = weightToLose > 0;

    // Deficit calculations
    // 1 kg of fat ~ 7700 calories
    // 0.5 kg/week = 550 cal/day deficit
    // 1 kg/week = 1100 cal/day deficit
    const deficitModerate = 550; // for 0.5 kg/week

    // Daily calorie target
    const dailyTarget = isLosing
      ? Math.round(maintenance - deficitModerate)
      : Math.round(maintenance);

    // Ensure minimum safe calories
    const safeMinimum = gender === "male" ? 1500 : 1200;
    const adjustedTarget = isLosing
      ? Math.max(dailyTarget, safeMinimum)
      : dailyTarget;

    // Recalculate actual deficit based on adjusted target
    const actualDeficit = isLosing
      ? Math.round(maintenance - adjustedTarget)
      : 0;
    const actualWeeklyLoss = isLosing
      ? Number(((actualDeficit * 7) / 7700).toFixed(2))
      : 0;

    // Timeline
    const weeksToGoal =
      isLosing && actualWeeklyLoss > 0
        ? Math.ceil(Math.abs(weightToLose) / actualWeeklyLoss)
        : 0;
    const monthsToGoal = Number((weeksToGoal / 4.33).toFixed(1));

    // Save lead to Notion (non-blocking, don't fail the request if this errors)
    saveLeadToNotion({
      email,
      weight,
      height,
      age,
      gender,
      maintenance: Math.round(maintenance),
      dailyTarget: adjustedTarget,
    });

    console.log(`[FoodOS] New submission: ${email}`);

    return NextResponse.json({
      success: true,
      results: {
        bmr: Math.round(bmr),
        maintenance: Math.round(maintenance),
        recommendedDeficit: isLosing ? actualDeficit : 0,
        dailyTarget: adjustedTarget,
        weeklyLoss: actualWeeklyLoss,
        weeksToGoal,
        monthsToGoal,
        weightToLose: Number(Math.abs(weightToLose).toFixed(1)),
        isLosing,
        safeMinimumApplied: isLosing && dailyTarget < safeMinimum,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
