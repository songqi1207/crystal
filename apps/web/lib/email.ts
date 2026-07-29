export type EmailDeliveryResult = {
  mode: "resend" | "console";
  messageId?: string;
};

function emailMode(): "resend" | "console" {
  const mode = (process.env.ASTRAYA_EMAIL_MODE ?? "resend").trim().toLowerCase();
  if (mode === "resend" || mode === "console") return mode;
  throw new Error("ASTRAYA_EMAIL_MODE must be either resend or console");
}

export async function sendLoginCode(
  email: string,
  code: string,
  requestId: string,
): Promise<EmailDeliveryResult> {
  const mode = emailMode();
  if (mode === "console") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ASTRAYA_EMAIL_MODE=console is forbidden in production");
    }
    console.info(`[astraya/auth] development login code for ${email}: ${code}`);
    return { mode };
  }

  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be configured when ASTRAYA_EMAIL_MODE=resend");
  }

  const from = (process.env.ASTRAYA_EMAIL_FROM ?? "").trim();
  if (!from) throw new Error("ASTRAYA_EMAIL_FROM must be configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "Astraya/0.1 email-auth",
      "Idempotency-Key": `astraya-login-${requestId}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Astraya 登录验证码",
      text: `你的 Astraya 登录验证码是 ${code}。验证码 10 分钟内有效，请勿转发。`,
      html: loginCodeHtml(code),
      tags: [{ name: "category", value: "login_code" }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`email delivery failed (${response.status}): ${detail}`);
  }

  const result = (await response.json().catch(() => ({}))) as { id?: string };
  return { mode, messageId: result.id };
}

function loginCodeHtml(code: string): string {
  return `<!doctype html>
<html lang="zh-CN">
  <body style="margin:0;background:#080b1d;color:#f0eee6;font-family:Arial,'PingFang SC',sans-serif">
    <div style="max-width:520px;margin:0 auto;padding:48px 20px">
      <div style="border:1px solid #393756;border-radius:18px;background:#10142d;padding:36px;text-align:center">
        <div style="color:#e8c37a;font-size:12px;letter-spacing:4px">ASTRAYA · 星脉</div>
        <h1 style="margin:18px 0 8px;font-size:26px;color:#f0eee6">登录验证码</h1>
        <p style="margin:0;color:#aaa8ba;font-size:14px;line-height:1.7">请在登录页面输入以下验证码</p>
        <div style="margin:28px 0;padding:18px;border-radius:12px;background:#090c20;color:#e8c37a;font-family:monospace;font-size:34px;font-weight:700;letter-spacing:10px">${code}</div>
        <p style="margin:0;color:#aaa8ba;font-size:13px;line-height:1.7">验证码 10 分钟内有效，且只能使用一次。<br>如果不是你本人操作，请忽略此邮件。</p>
      </div>
      <p style="margin:18px 0 0;text-align:center;color:#6f6d80;font-size:11px">Astraya account security</p>
    </div>
  </body>
</html>`;
}
