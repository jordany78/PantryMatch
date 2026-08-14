"use client";
// Current homepage. Leads users to login or signup

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main>
      <section>
        <h1>PantryMatch</h1>

        <p>
          Plan your meals, discover recipes, and build grocery lists
          based on what you already have in your pantry.
        </p>

        <div>
          <button onClick={() => router.push("/login")}>
            Log in
          </button>

          <button onClick={() => router.push("/signup")}>
            Sign up
          </button>
        </div>
      </section>
    </main>
  );
}
