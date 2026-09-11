const { createClient } = require("@supabase/supabase-js");

const BATCH_SIZE = 100;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function fetchIngredientInfo(spoonacularId) {
  const url = `https://api.spoonacular.com/food/ingredients/${spoonacularId}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error(`Spoonacular request failed: ${res.status}`);
  }

  return res.json();
}

async function main() {
  console.log(`Fetching up to ${BATCH_SIZE} ingredients with null category...`);

  const { data: ingredients, error } = await supabase
    .from("ingredients")
    .select("id, name, spoonacular_id, default_unit")
    .is("category", null)
    .not("spoonacular_id", "is", null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Failed to fetch ingredients:", error.message);
    process.exit(1);
  }

  console.log(`Found ${ingredients.length} ingredients to backfill.\n`);

  let updated = 0;
  let failed = 0;

  for (const ingredient of ingredients) {
    try {
      const info = await fetchIngredientInfo(ingredient.spoonacular_id);

      const updates = {};
      if (info.aisle) updates.category = info.aisle;
      if (!ingredient.default_unit && info.possibleUnits?.length > 0) {
        updates.default_unit = info.possibleUnits[0];
      }

      if (Object.keys(updates).length === 0) {
        console.log(`  skip  ${ingredient.name} (nothing to update)`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("ingredients")
        .update(updates)
        .eq("id", ingredient.id);

      if (updateError) {
        console.log(`  fail  ${ingredient.name}: ${updateError.message}`);
        failed++;
        continue;
      }

      console.log(`  ok    ${ingredient.name} -> ${updates.category ?? "(no category)"}`);
      updated++;
    } catch (err) {
      if (err.message === "QUOTA_EXCEEDED") {
        console.log("\nSpoonacular daily quota exceeded. Stopping early.");
        console.log(`Progress so far: ${updated} updated, ${failed} failed.`);
        console.log("Run this script again tomorrow to continue.");
        process.exit(0);
      }
      console.log(`  fail  ${ingredient.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${failed} failed.`);
}

main();