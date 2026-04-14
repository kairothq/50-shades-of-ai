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
    const deficitAggressive = 1100; // for 1 kg/week

    // Choose moderate deficit as recommended
    const recommendedDeficit = deficitModerate;
    const weeklyLossRate = 0.5; // kg per week

    // Daily calorie target
    const dailyTarget = isLosing
      ? Math.round(maintenance - recommendedDeficit)
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

    // Log the email (for later Resend integration)
    console.log(`[FoodOS] New submission: ${email}`);
    console.log(
      `  Weight: ${weight}kg, Height: ${height}cm, Age: ${age}, Gender: ${gender}`
    );
    console.log(
      `  Activity: ${activityLevel}, Desired: ${desiredWeight}kg`
    );
    console.log(`  BMR: ${Math.round(bmr)}, Maintenance: ${Math.round(maintenance)}`);

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
