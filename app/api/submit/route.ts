// FoodOS Calorie Calculator - Lead Storage via Upstash Redis
//
// Setup:
// 1. Create a free Upstash Redis database at https://console.upstash.com
// 2. Set these env vars in .env.local:
//    UPSTASH_REDIS_REST_URL=<your url>
//    UPSTASH_REDIS_REST_TOKEN=<your token>

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

async function saveLeadToRedis(data: {
  email: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  maintenance: number;
  dailyTarget: number;
}) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[FoodOS] Redis env vars missing, skipping lead storage");
    return;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });

    const lead = JSON.stringify({
      email: data.email,
      weight: data.weight,
      height: data.height,
      age: data.age,
      gender: data.gender,
      maintenance: data.maintenance,
      dailyTarget: data.dailyTarget,
      submittedAt: new Date().toISOString(),
    });

    await redis.lpush("foodos-leads", lead);
    console.log("[FoodOS] Lead saved to Redis:", data.email);
  } catch (err) {
    console.error("[FoodOS] Failed to save lead to Redis:", err);
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

    // Save lead to Redis (must await so Vercel doesn't kill it)
    await saveLeadToRedis({
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
