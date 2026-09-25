import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/session";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next } = await searchParams;

  return (
    <div className="mx-auto mt-16 flex max-w-sm flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>AutoSolace CRM</h1>
        <p className="mt-2">Enter the password to continue.</p>
      </div>

      <form action={loginAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={safeNextPath(next)} />
        <div className="flex flex-col gap-1">
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
          />
        </div>
        {error && <div className="text-sm text-danger">Incorrect password.</div>}
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  );
}
