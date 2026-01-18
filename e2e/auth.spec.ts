import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login Flow", () => {
    test("shows login page with all required elements", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByPlaceholder(/email/i)).toBeAttached();
      await expect(page.getByPlaceholder(/password/i)).toBeAttached();
      await expect(
        page.getByRole("button", { name: /sign in/i })
      ).toBeAttached();
    });

    test("prevents empty form submission", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      await page
        .getByRole("button", { name: /sign in/i })
        .click({ force: true });

      // Should stay on login page (form validation prevents submission)
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
    });

    test("handles invalid credentials", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      await page
        .getByPlaceholder(/email/i)
        .fill("nonexistent@example.com", { force: true });
      await page
        .getByPlaceholder(/password/i)
        .fill("wrongpassword123", { force: true });
      await page
        .getByRole("button", { name: /sign in/i })
        .click({ force: true });

      // Should stay on login page after failed login attempt
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/login/);
    });

    test("validates email format", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      await page.getByPlaceholder(/email/i).fill("notanemail", { force: true });
      await page
        .getByPlaceholder(/password/i)
        .fill("password123", { force: true });
      await page
        .getByRole("button", { name: /sign in/i })
        .click({ force: true });

      // Should show validation error or invalid credentials
      const errorVisible = await page
        .getByText(/invalid|email/i)
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(errorVisible).toBeTruthy();
    });
  });

  test.describe("Signup Flow", () => {
    test("signup page loads and shows branding", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForLoadState("domcontentloaded");

      // Page should show Viral Kid branding (use first() as there may be multiple)
      await expect(page.getByText("Viral Kid").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("signup page handles missing token", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForLoadState("domcontentloaded");

      // Page should show either validation spinner or error state
      await expect(page.getByText("Viral Kid").first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page).toHaveURL(/\/signup/);
    });

    test("signup page handles invalid token in URL", async ({ page }) => {
      await page.goto("/signup?token=invalid-token-12345");
      await page.waitForLoadState("domcontentloaded");

      // Page should load without crashing
      await expect(page.getByText("Viral Kid").first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe("Protected Routes", () => {
    test("redirects unauthenticated users from homepage to login", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/);
    });

    test("redirects unauthenticated users from admin to login", async ({
      page,
    }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
