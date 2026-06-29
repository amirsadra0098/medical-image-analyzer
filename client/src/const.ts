
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  // اگر متغیر محیطی ست نشده بود، از آدرس ساب‌دومین خودت به عنوان دیفالت استفاده کند
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://site1.bahmanandroid.ir";
  const appId = import.meta.env.VITE_APP_ID || "1"; // یک مقدار دیفالت برای اپ‌آی‌دی
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // استفاده از try...catch برای جلوگیری ۱۰۰٪ از کرش کردن کل سایت
  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (e) {
    console.error("خطا در ساخت URL منبع احراز هویت:", e);
    return `${window.location.origin}/login`;
  }
};
