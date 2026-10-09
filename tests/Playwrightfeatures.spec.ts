import { test, expect, type Page } from '@playwright/test';

async function loginAsStandardUser(page: Page) {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

async function loginAsUser(page: Page, username: string) {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

async function continueToCheckoutOverview(page: Page, username: string) {
  await loginAsUser(page, username);

  const backpack = page.locator('[data-test="inventory-item"]')
    .filter({ hasText: 'Sauce Labs Backpack' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();
}

test('SauceDemo page loads with the expected title', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  await expect(page).toHaveTitle(/Swag Labs/i);
});

test('user can log in and see the products page', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  await expect(page.locator('[data-test="inventory-item"]')).not.toHaveCount(0);
});

test('user can purchase one in-stock product', async ({ page }) => {
  await loginAsStandardUser(page);

  const backpack = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Sauce Labs Backpack' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();

  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $29.99');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $32.39');
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
});

test('user can select multiple products, remove one, and checkout the remaining product', async ({ page }) => {
  await loginAsStandardUser(page);

  const backpack = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Sauce Labs Backpack' });
  const bikeLight = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Sauce Labs Bike Light' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await bikeLight.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');

  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
  ]);
  await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(['Sauce Labs Bike Light']);
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();

  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $9.99');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $10.79');
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
});

test('checkout requires a first name', async ({ page }) => {
  await loginAsStandardUser(page);
  await page.locator('[data-test="inventory-item"]')
    .filter({ hasText: 'Sauce Labs Backpack' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();

  await expect(page.locator('[data-test="error"]')).toContainText('Error: First Name is required');
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
});

const checkoutUsers = [
  'standard_user',
  'performance_glitch_user',
  'visual_user',
];

for (const username of checkoutUsers) {
  test(`${username} can complete checkout`, async ({ page }) => {
    await continueToCheckoutOverview(page, username);

    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
    await expect(page.locator('[data-test="inventory-item-name"]'))
      .toHaveText(['Sauce Labs Backpack']);
    await page.locator('[data-test="finish"]').click();
    await expect(page.locator('[data-test="complete-header"]'))
      .toHaveText('Thank you for your order!');
  });
}

test('problem_user remains on checkout information after Continue', async ({ page }) => {
  await continueToCheckoutOverview(page, 'problem_user');

  await expect(page.locator('[data-test="title"]'))
    .toHaveText('Checkout: Your Information');
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
});

test('error_user remains on checkout overview after Finish', async ({ page }) => {
  await continueToCheckoutOverview(page, 'error_user');

  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.locator('[data-test="complete-header"]')).toHaveCount(0);
});

test('locked_out_user cannot log in', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill('locked_out_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  await expect(page.locator('[data-test="error"]'))
    .toContainText('Sorry, this user has been locked out.');
  await expect(page).toHaveURL(/\/$/);
});
