import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="container-astra py-16">
      <Suspense fallback={<div className="glass mx-auto max-w-md p-8">正在加载登录页面…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
