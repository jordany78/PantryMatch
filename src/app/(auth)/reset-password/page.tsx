"use client";
// Allows user to input their email and a reset
// password email is sent via supabase

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    // Sends a password reset email and redirects the user
    // to the update-password page after they click the link.
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists with that email, you will receive a password reset email."
    );

    setLoading(false);
  }

  return (
    <main>
      <h1>Reset your password</h1>

      <p>
        Enter the email associated with your PantryMatch account.
      </p>

      <form onSubmit={handleResetRequest}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {error && <p>{error}</p>}

        {message && <p>{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </button>
      </form>

      <p>
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
        >
          Log in
        </button>
      </p>
    </main>
  );
}